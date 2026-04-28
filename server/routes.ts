import type { Express } from "express";
import { Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertSignupSchema } from "@shared/schema";
import { z } from "zod";
import crypto from "crypto";

function hashPassword(pw: string) {
  return crypto.createHash("sha256").update(pw + "bb_salt_2026").digest("hex");
}

function calcPayout(direction: string, target: number, entry: number, wager: number): number {
  const diff = Math.abs(target - entry);
  const multiplier = Math.max(1.5, 1 + (diff / (entry || 1)) * 3);
  return Math.round(wager * multiplier);
}

// ── TOKEN STORE ───────────────────────────────────────────────────────────────
// Cookie-free auth: we issue a random token on login/register and the frontend
// sends it as X-Session-Token on every request. This works reliably in all
// sandboxed-iframe / HTTPS-proxy environments where cookies are stripped.
const tokenStore = new Map<string, number>(); // token → userId

function issueToken(userId: number): string {
  const token = crypto.randomBytes(32).toString("hex");
  tokenStore.set(token, userId);
  return token;
}

function getUserIdFromRequest(req: any): number | null {
  // 1. Header token (primary — works in all environments)
  const headerToken = req.headers["x-session-token"] as string | undefined;
  if (headerToken && tokenStore.has(headerToken)) {
    return tokenStore.get(headerToken)!;
  }
  // 2. Cookie session fallback
  const sessionUserId = (req.session as any)?.userId;
  if (sessionUserId) return sessionUserId;
  return null;
}

export function registerRoutes(httpServer: Server, app: Express) {
  // ── AUTH ──────────────────────────────────────────────────────────────────
  app.post("/api/auth/register", (req, res) => {
    try {
      const body = insertUserSchema.parse(req.body);
      const existing = storage.getUserByEmail(body.email);
      if (existing) return res.status(409).json({ error: "Email already registered" });
      const user = storage.createUser({ ...body, password: hashPassword(body.password) });
      const token = issueToken(user.id);
      (req.session as any).userId = user.id;
      const { password: _, ...safe } = user;
      return res.json({ user: safe, token });
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    const user = storage.getUserByEmail(email);
    if (!user || user.password !== hashPassword(password)) {
      return res.status(401).json({ error: "Invalid email or password" });
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

  // ── MARKETS ───────────────────────────────────────────────────────────────
  app.get("/api/markets", (_req, res) => {
    const all = storage.getAllMarkets();
    const result = all.map((m) => ({
      ...m,
      priceHistory: JSON.parse(m.priceHistory || "[]"),
    }));
    return res.json(result);
  });

  app.get("/api/markets/:caseId", (req, res) => {
    const market = storage.getMarketByCaseId(req.params.caseId);
    if (!market) return res.status(404).json({ error: "Market not found" });
    const newsItems = storage.getNewsByMarketId(market.id);
    return res.json({
      ...market,
      priceHistory: JSON.parse(market.priceHistory || "[]"),
      news: newsItems.sort((a, b) => a.sortOrder - b.sortOrder),
    });
  });

  // ── TRADES ────────────────────────────────────────────────────────────────
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

  app.post("/api/trades", (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ error: "Not logged in" });

    const schema = z.object({
      marketId: z.number(),
      direction: z.enum(["long", "short", "yes", "no"]),
      targetPrice: z.number().min(0).max(100),
      wager: z.number().min(100).max(50000),
      entryPrice: z.number(),
    });

    try {
      const body = schema.parse(req.body);
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

  // ── SIGNUPS ───────────────────────────────────────────────────────────────
  app.post("/api/signups", (req, res) => {
    const schema = insertSignupSchema.extend({ email: z.string().email() });
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
