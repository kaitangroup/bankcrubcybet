import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ── USERS ──────────────────────────────────────────────────────────────────
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firm: text("firm").notNull().default(""),
  role: text("role").notNull().default("trader"), // 'trader' | 'admin'
  approved: integer("approved", { mode: "boolean" }).notNull().default(false),
  bbBalance: real("bb_balance").notNull().default(50000),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, bbBalance: true, createdAt: true, role: true, approved: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ── ACCESS REQUESTS ─────────────────────────────────────────────────────────
export const accessRequests = sqliteTable("access_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  firm: text("firm").notNull().default(""),
  role: text("role").notNull().default(""),  // e.g. 'Credit Risk Officer', 'Portfolio Manager'
  status: text("status").notNull().default("pending"), // 'pending' | 'approved' | 'denied'
  tempPassword: text("temp_password"),                  // set on approval, cleared after first login
  createdAt: text("created_at").notNull(),
  reviewedAt: text("reviewed_at"),
});
export type AccessRequest = typeof accessRequests.$inferSelect;

// ── MARKETS ────────────────────────────────────────────────────────────────
export const markets = sqliteTable("markets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  caseId: text("case_id").notNull().unique(),   // e.g. 'spirit'
  name: text("name").notNull(),
  caseNo: text("case_no").notNull(),
  court: text("court").notNull(),
  judge: text("judge").notNull(),
  filed: text("filed").notNull(),
  industry: text("industry").notNull(),
  status: text("status").notNull().default("active"), // 'active' | 'resolved'
  currentPrice: real("current_price").notNull(),
  openingPrice: real("opening_price").notNull(),
  high52: real("high_52").notNull(),
  low52: real("low_52").notNull(),
  volume: integer("volume").notNull().default(0),
  signal: text("signal").notNull().default("flat"), // 'up' | 'down' | 'flat'
  summary: text("summary").notNull(),
  debtorCounsel: text("debtor_counsel").notNull().default(""),
  creditorCounsel: text("creditor_counsel").notNull().default(""),
  claimsAgent: text("claims_agent").notNull().default(""),
  securedClaims: text("secured_claims").notNull().default(""),
  unsecuredClaims: text("unsecured_claims").notNull().default(""),
  totalLiabilities: text("total_liabilities").notNull().default(""),
  priceHistory: text("price_history").notNull().default("[]"), // JSON number[]
  type: text("type").notNull().default("recovery"), // 'recovery' | 'prefiling'
});

export const insertMarketSchema = createInsertSchema(markets).omit({ id: true });
export type InsertMarket = z.infer<typeof insertMarketSchema>;
export type Market = typeof markets.$inferSelect;

// ── NEWS ───────────────────────────────────────────────────────────────────
export const news = sqliteTable("news", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  marketId: integer("market_id").notNull(),
  date: text("date").notNull(),
  headline: text("headline").notNull(),
  body: text("body").notNull(),
  impact: text("impact").notNull(), // 'BULLISH' | 'BEARISH' | 'MIXED'
  impactNote: text("impact_note").notNull().default(""),
  source: text("source").notNull().default("PACER / Public Reporting"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertNewsSchema = createInsertSchema(news).omit({ id: true });
export type InsertNews = z.infer<typeof insertNewsSchema>;
export type News = typeof news.$inferSelect;

// ── TRADES ─────────────────────────────────────────────────────────────────
export const trades = sqliteTable("trades", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  marketId: integer("market_id").notNull(),
  direction: text("direction").notNull(), // 'long' | 'short' | 'yes' | 'no'
  targetPrice: real("target_price").notNull(),
  wager: real("wager").notNull(),
  entryPrice: real("entry_price").notNull(),
  potentialPayout: real("potential_payout").notNull(),
  status: text("status").notNull().default("open"), // 'open' | 'settled'
  createdAt: text("created_at").notNull(),
});

export const insertTradeSchema = createInsertSchema(trades).omit({ id: true, createdAt: true, status: true });
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof trades.$inferSelect;

// ── SIGNUPS ────────────────────────────────────────────────────────────────
export const signups = sqliteTable("signups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default(""),
  createdAt: text("created_at").notNull(),
});

export const insertSignupSchema = createInsertSchema(signups).omit({ id: true, createdAt: true });
export type InsertSignup = z.infer<typeof insertSignupSchema>;
export type Signup = typeof signups.$inferSelect;

// ── INVITE CODES ───────────────────────────────────────────────────────────
export const inviteCodes = sqliteTable("invite_codes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  label: text("label").notNull().default(""),       // e.g. 'Ares Capital', 'Blue Owl'
  usedByEmail: text("used_by_email"),               // null = unused
  createdAt: text("created_at").notNull(),
  usedAt: text("used_at"),
});
export type InviteCode = typeof inviteCodes.$inferSelect;
