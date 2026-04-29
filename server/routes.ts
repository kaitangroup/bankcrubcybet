import type { Express } from "express";
import { Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertSignupSchema } from "@shared/schema";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Resend } from "resend";

// ── PASSWORD HASHING (bcrypt, cost 12) ───────────────────────────────────────
const BCRYPT_ROUNDS = 12;

async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, BCRYPT_ROUNDS);
}

async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  // Support legacy SHA-256 hashes from before migration
  if (hash.length === 64 && !hash.startsWith("$2")) {
    const legacyHash = crypto.createHash("sha256").update(pw + "bb_salt_2026").digest("hex");
    return legacyHash === hash;
  }
  return bcrypt.compare(pw, hash);
}

// ── EMAIL (Resend) ────────────────────────────────────────────────────────────
// RESEND_API_KEY  — your Resend API key (get it at resend.com)
// RESEND_FROM     — verified sender, e.g. noreply@bankruptcybets.com
//                   defaults to onboarding@resend.dev for testing (Resend's sandbox)
const NOTIFY_TO = "rgj@rolandjones.com";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[email] RESEND_API_KEY not set — emails will be skipped");
    return null;
  }
  return new Resend(key);
}

function fromAddress() {
  // Use your verified domain sender in production.
  // During testing you can use onboarding@resend.dev (Resend's sandbox sender)
  return process.env.RESEND_FROM || "onboarding@resend.dev";
}

// Email 1: notify Roland of a new access request
async function notifyAdminOfRequest(name: string, firm: string, email: string, role: string) {
  const resend = getResend();
  if (!resend) return;
  const safe = (s: string) => s.replace(/[<>&"]/g, "").slice(0, 200);
  const { error } = await resend.emails.send({
    from: `BankruptcyBet <${fromAddress()}>`,
    to: [NOTIFY_TO],
    reply_to: safe(email),
    subject: `New Access Request: ${safe(name)} — ${safe(firm) || "(no firm)"}`,
    text:
`New access request received on BankruptcyBet.

Name:  ${safe(name)}
Firm:  ${safe(firm) || "—"}
Email: ${safe(email)}
Role:  ${safe(role) || "—"}

Review and approve at:
https://bankruptcybets.com/admin

—
BankruptcyBet Platform`,
  });
  if (error) console.error("[email] Admin notify failed:", error);
  else console.log("[email] Admin notified OK");
}

// Email 2: confirmation to the person who requested access
async function confirmRequestToUser(name: string, email: string) {
  const resend = getResend();
  if (!resend) return;
  const safe = (s: string) => s.replace(/[<>&"]/g, "").slice(0, 200);
  const { error } = await resend.emails.send({
    from: `BankruptcyBet <${fromAddress()}>`,
    to: [safe(email)],
    subject: "Your BankruptcyBet access request was received",
    text:
`Hi ${safe(name)},

Thank you for requesting access to BankruptcyBet.

Your request is under review. You will receive another email once it has been approved.

If you have any questions, reply to this email.

—
Roland Gary Jones, Esq.
BankruptcyBet LLC
rolandjones.com`,
  });
  if (error) console.error("[email] User confirmation failed:", error);
  else console.log("[email] User confirmation sent OK");
}

// ── TOKEN STORE — with expiry ─────────────────────────────────────────────────
// Cookie-free auth: random token → userId, expires after 7 days of inactivity
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface TokenEntry {
  userId: number;
  expiresAt: number;
}

const tokenStore = new Map<string, TokenEntry>();

// Purge expired tokens every hour
setInterval(() => {
  const now = Date.now();
  for (const [token, entry] of tokenStore.entries()) {
    if (entry.expiresAt < now) tokenStore.delete(token);
  }
}, 60 * 60 * 1000);

function issueToken(userId: number): string {
  const token = crypto.randomBytes(32).toString("hex");
  tokenStore.set(token, { userId, expiresAt: Date.now() + TOKEN_TTL_MS });
  return token;
}

function getUserIdFromRequest(req: any): number | null {
  // 1. Header token (primary)
  const headerToken = req.headers["x-session-token"] as string | undefined;
  if (headerToken) {
    const entry = tokenStore.get(headerToken);
    if (entry && entry.expiresAt > Date.now()) {
      // Slide expiry on activity
      entry.expiresAt = Date.now() + TOKEN_TTL_MS;
      return entry.userId;
    }
    if (entry) tokenStore.delete(headerToken); // expired — clean up
  }
  // 2. Cookie session fallback
  const sessionUserId = (req.session as any)?.userId;
  if (sessionUserId) return sessionUserId;
  return null;
}

// ── ADMIN KEY ─────────────────────────────────────────────────────────────────
// Reads from ADMIN_KEY env var at startup; falls back to hardcoded for dev only
const ADMIN_KEY = process.env.ADMIN_KEY || "bb-admin-2026";

function requireAdmin(req: any, res: any, next: any) {
  const key = req.headers["x-admin-key"] || req.query.adminKey;
  if (!key || key !== ADMIN_KEY) return res.status(401).json({ error: "Unauthorized" });
  next();
}

// ── INPUT SCHEMAS — with length caps ─────────────────────────────────────────
const registerBodySchema = insertUserSchema.extend({
  name: z.string().min(2).max(100),
  email: z.string().email().max(254),
  password: z.string().min(6).max(128),
});

const accessRequestSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(254),
  firm: z.string().max(200).default(""),
  role: z.string().max(100).default(""),
});

const tradeSchema = z.object({
  marketId: z.number().int().positive(),
  direction: z.enum(["long", "short", "yes", "no"]),
  targetPrice: z.number().min(0).max(100),
  wager: z.number().min(100).max(50000),
  entryPrice: z.number().min(0).max(100),
});

// ── PAYOUT CALC ───────────────────────────────────────────────────────────────
function calcPayout(direction: string, target: number, entry: number, wager: number): number {
  const diff = Math.abs(target - entry);
  const multiplier = Math.max(1.5, 1 + (diff / (entry || 1)) * 3);
  return Math.round(wager * multiplier);
}

export function registerRoutes(httpServer: Server, app: Express) {
  // ── AUTH ───────────────────────────────────────────────────────────────────
  app.post("/api/auth/register", async (req, res) => {
    try {
      const body = registerBodySchema.parse(req.body);
      // Must have an approved access request first
      const request = storage.getAccessRequestByEmail(body.email);
      if (!request) return res.status(403).json({ error: "No access request found for this email. Please request access first." });
      if (request.status === "pending") return res.status(403).json({ error: "Your access request is still under review. You will be notified when approved." });
      if (request.status === "denied") return res.status(403).json({ error: "Your access request was not approved. Contact Roland Gary Jones, Esq. for more information." });
      const existing = storage.getUserByEmail(body.email);
      if (existing) return res.status(409).json({ error: "Email already registered" });
      const hashed = await hashPassword(body.password);
      const user = storage.createUser({ ...body, password: hashed, approved: true } as any);
      const token = issueToken(user.id);
      const { password: _, ...safe } = user;
      return res.json({ user: safe, token });
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    // Validate basic format before hitting DB
    if (typeof email !== "string" || email.length > 254) return res.status(400).json({ error: "Invalid email" });
    if (typeof password !== "string" || password.length > 128) return res.status(400).json({ error: "Invalid password" });

    const user = storage.getUserByEmail(email);
    // Always run password check to prevent timing-based user enumeration
    const dummyHash = "$2a$12$invalidsaltinvalidsaltinvalidsaltinvalidsaltinvalidsal";
    const validPassword = user
      ? await verifyPassword(password, user.password)
      : await bcrypt.compare(password, dummyHash).then(() => false);

    if (!user || !validPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    if (!user.approved) {
      return res.status(403).json({ error: "Your account is pending approval. You will be notified by email when access is granted.", pending: true });
    }
    const token = issueToken(user.id);
    (req.session as any).userId = user.id;
    const { password: _, ...safe } = user;
    return res.json({ user: safe, token });
  });

  app.post("/api/auth/logout", (req, res) => {
    const headerToken = req.headers["x-session-token"] as string | undefined;
    if (headerToken) tokenStore.delete(headerToken);
    req.session.destroy(() => res.json({ ok: true }));
  });

  app.get("/api/auth/me", (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ error: "Not logged in" });
    const user = storage.getUserById(userId);
    if (!user) return res.status(401).json({ error: "User not found" });
    const { password: _, ...safe } = user;
    return res.json({ user: safe });
  });

  // ── MARKETS — authenticated only ──────────────────────────────────────────
  app.get("/api/markets", (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ error: "Not logged in" });
    const all = storage.getAllMarkets();
    const result = all.map((m) => ({
      ...m,
      priceHistory: JSON.parse(m.priceHistory || "[]"),
    }));
    return res.json(result);
  });

  app.get("/api/markets/:caseId", (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ error: "Not logged in" });
    // Sanitize caseId — alphanumeric + hyphens only
    const caseId = req.params.caseId.replace(/[^a-zA-Z0-9-]/g, "");
    const market = storage.getMarketByCaseId(caseId);
    if (!market) return res.status(404).json({ error: "Market not found" });
    const newsItems = storage.getNewsByMarketId(market.id);
    return res.json({
      ...market,
      priceHistory: JSON.parse(market.priceHistory || "[]"),
      news: newsItems.sort((a, b) => a.sortOrder - b.sortOrder),
    });
  });

  // ── TRADES ─────────────────────────────────────────────────────────────────
  app.get("/api/trades", (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ error: "Not logged in" });
    const userTrades = storage.getTradesByUser(userId);
    const enriched = userTrades.map((t) => {
      const market = storage.getMarketById(t.marketId);
      return { ...t, marketName: market?.name || "", caseId: market?.caseId || "" };
    });
    return res.json(enriched);
  });

  app.post("/api/trades", async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ error: "Not logged in" });

    try {
      const body = tradeSchema.parse(req.body);
      const user = storage.getUserById(userId);
      if (!user) return res.status(401).json({ error: "User not found" });
      if (user.bbBalance < body.wager) return res.status(400).json({ error: "Insufficient BB$ balance" });

      const market = storage.getMarketById(body.marketId);
      if (!market) return res.status(404).json({ error: "Market not found" });

      const potentialPayout = calcPayout(body.direction, body.targetPrice, body.entryPrice, body.wager);
      const trade = storage.createTrade({
        userId,
        marketId: body.marketId,
        direction: body.direction,
        targetPrice: body.targetPrice,
        wager: body.wager,
        entryPrice: body.entryPrice,
        potentialPayout,
        createdAt: new Date().toISOString(),
      });

      storage.updateBalance(userId, user.bbBalance - body.wager);
      const updatedUser = storage.getUserById(userId)!;
      const { password: _, ...safeUser } = updatedUser;

      return res.json({ trade, user: safeUser });
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  });

  // ── ACCESS REQUESTS ────────────────────────────────────────────────────────
  app.post("/api/access-request", (req, res) => {
    try {
      const body = accessRequestSchema.parse(req.body);
      const existing = storage.getAccessRequestByEmail(body.email);
      if (existing) {
        return res.status(409).json({ error: "A request for this email already exists.", status: existing.status });
      }
      const request = storage.createAccessRequest({ ...body, email: body.email.toLowerCase() });
      if (!request) return res.status(500).json({ error: "Could not save request" });
      // Fire both emails — errors are logged but don't fail the request
      notifyAdminOfRequest(body.name, body.firm, body.email, body.role);
      confirmRequestToUser(body.name, body.email);
      return res.json({ ok: true });
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  });

  // ── ADMIN: ACCESS REQUESTS ─────────────────────────────────────────────────
  app.get("/api/admin/requests", requireAdmin, (_req, res) => {
    return res.json(storage.getAllAccessRequests());
  });

  app.post("/api/admin/requests/:id/approve", requireAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id < 1) return res.status(400).json({ error: "Invalid id" });
    storage.approveAccessRequest(id);
    const all = storage.getAllAccessRequests();
    const request = all.find(r => r.id === id);
    if (request) storage.approveUser(request.email);
    return res.json({ ok: true });
  });

  app.post("/api/admin/requests/:id/deny", requireAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id < 1) return res.status(400).json({ error: "Invalid id" });
    storage.denyAccessRequest(id);
    return res.json({ ok: true });
  });

  // ── ADMIN: INVITE CODES ────────────────────────────────────────────────────
  app.get("/api/admin/invites", requireAdmin, (_req, res) => {
    return res.json(storage.getAllInviteCodes());
  });

  app.post("/api/admin/invites", requireAdmin, (req, res) => {
    try {
      const { codes, count, label = "" } = req.body;
      const safeLabel = String(label).slice(0, 100);
      const results: any[] = [];
      if (Array.isArray(codes) && codes.length > 0 && codes.length <= 50) {
        for (const c of codes) {
          try { results.push(storage.createInviteCode(String(c).slice(0, 32), safeLabel)); } catch { /* dupe */ }
        }
      } else if (typeof count === "number" && count > 0 && count <= 50) {
        for (let i = 0; i < count; i++) {
          const code = crypto.randomBytes(4).toString("hex").toUpperCase();
          try { results.push(storage.createInviteCode(code, safeLabel)); } catch { /* dupe */ }
        }
      } else {
        return res.status(400).json({ error: "Provide codes[] or count (max 50)" });
      }
      return res.json({ created: results.length, codes: results });
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  });

  // ── SIGNUPS ────────────────────────────────────────────────────────────────
  app.post("/api/signups", (req, res) => {
    const schema = insertSignupSchema.extend({
      email: z.string().email().max(254),
      name: z.string().min(1).max(100),
      role: z.string().max(100).optional(),
    });
    try {
      const body = schema.parse(req.body);
      const signup = storage.createSignup({ ...body, createdAt: new Date().toISOString() });
      if (!signup) return res.status(409).json({ error: "Email already registered" });
      return res.json({ ok: true });
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  });
}
