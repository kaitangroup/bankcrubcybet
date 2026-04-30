import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, desc } from "drizzle-orm";
import { users, markets, news, trades, signups, inviteCodes, accessRequests } from "@shared/schema";
import type { User, InsertUser, Market, InsertMarket, News, InsertNews, Trade, InsertTrade, Signup, InsertSignup, InviteCode, AccessRequest } from "@shared/schema";

const sqlite = new Database("bankruptcybet.db");
const db = drizzle(sqlite);

// ── MIGRATIONS — safe ALTER TABLE for schema upgrades ────────────────────────
// Each entry is idempotent — errors (column already exists) are silently ignored
const migrations = [
  `ALTER TABLE access_requests ADD COLUMN temp_password TEXT`,
  `ALTER TABLE users ADD COLUMN firm TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE users ADD COLUMN approved INTEGER NOT NULL DEFAULT 0`,
];
for (const sql of migrations) {
  try { sqlite.exec(sql); } catch { /* column already exists — ignore */ }
}

// ── INIT TABLES ──────────────────────────────────────────────────────────────
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    firm TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'trader',
    approved INTEGER NOT NULL DEFAULT 0,
    bb_balance REAL NOT NULL DEFAULT 50000,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS access_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    firm TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending',
    temp_password TEXT,
    created_at TEXT NOT NULL,
    reviewed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS markets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    case_no TEXT NOT NULL,
    court TEXT NOT NULL,
    judge TEXT NOT NULL,
    filed TEXT NOT NULL,
    industry TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    current_price REAL NOT NULL,
    opening_price REAL NOT NULL,
    high_52 REAL NOT NULL,
    low_52 REAL NOT NULL,
    volume INTEGER NOT NULL DEFAULT 0,
    signal TEXT NOT NULL DEFAULT 'flat',
    summary TEXT NOT NULL,
    debtor_counsel TEXT NOT NULL DEFAULT '',
    creditor_counsel TEXT NOT NULL DEFAULT '',
    claims_agent TEXT NOT NULL DEFAULT '',
    secured_claims TEXT NOT NULL DEFAULT '',
    unsecured_claims TEXT NOT NULL DEFAULT '',
    total_liabilities TEXT NOT NULL DEFAULT '',
    price_history TEXT NOT NULL DEFAULT '[]',
    type TEXT NOT NULL DEFAULT 'recovery'
  );
  CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    market_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    headline TEXT NOT NULL,
    body TEXT NOT NULL,
    impact TEXT NOT NULL,
    impact_note TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL DEFAULT 'PACER / Public Reporting',
    sort_order INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    market_id INTEGER NOT NULL,
    direction TEXT NOT NULL,
    target_price REAL NOT NULL,
    wager REAL NOT NULL,
    entry_price REAL NOT NULL,
    potential_payout REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS signups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS invite_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL DEFAULT '',
    used_by_email TEXT,
    created_at TEXT NOT NULL,
    used_at TEXT
  );
`);

export interface IStorage {
  // Users
  getUserById(id: number): User | undefined;
  getUserByEmail(email: string): User | undefined;
  createUser(data: InsertUser): User;
  updateBalance(userId: number, newBalance: number): void;
  updatePassword(userId: number, hashedPassword: string): void;
  // Markets
  getAllMarkets(): Market[];
  getMarketByCaseId(caseId: string): Market | undefined;
  getMarketById(id: number): Market | undefined;
  // News
  getNewsByMarketId(marketId: number): News[];
  // Trades
  createTrade(data: InsertTrade & { createdAt: string }): Trade;
  getTradesByUser(userId: number): Trade[];
  getTradesByMarket(marketId: number): Trade[];
  // Signups
  createSignup(data: InsertSignup & { createdAt: string }): Signup | null;
  getAllSignups(): Signup[];
  // Invite codes
  getInviteCode(code: string): InviteCode | undefined;
  consumeInviteCode(code: string, email: string): void;
  createInviteCode(code: string, label: string): InviteCode;
  getAllInviteCodes(): InviteCode[];
  // Access requests
  createAccessRequest(data: { name: string; email: string; firm: string; role: string }): AccessRequest | null;
  getAccessRequestByEmail(email: string): AccessRequest | undefined;
  getAllAccessRequests(): AccessRequest[];
  approveAccessRequest(id: number, tempPassword?: string): void;
  denyAccessRequest(id: number): void;
  approveUser(email: string): void;
}

export const storage: IStorage = {
  getUserById(id) {
    return db.select().from(users).where(eq(users.id, id)).get();
  },
  getUserByEmail(email) {
    return db.select().from(users).where(eq(users.email, email.toLowerCase())).get();
  },
  createUser(data) {
    return db.insert(users).values({
      ...data,
      email: data.email.toLowerCase(),
      createdAt: new Date().toISOString(),
    }).returning().get();
  },
  updatePassword(userId, hashedPassword) {
    db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId)).run();
  },
  updateBalance(userId, newBalance) {
    db.update(users).set({ bbBalance: newBalance }).where(eq(users.id, userId)).run();
  },
  getAllMarkets() {
    return db.select().from(markets).all();
  },
  getMarketByCaseId(caseId) {
    return db.select().from(markets).where(eq(markets.caseId, caseId)).get();
  },
  getMarketById(id) {
    return db.select().from(markets).where(eq(markets.id, id)).get();
  },
  getNewsByMarketId(marketId) {
    return db.select().from(news).where(eq(news.marketId, marketId)).all();
  },
  createTrade(data) {
    return db.insert(trades).values(data).returning().get();
  },
  getTradesByUser(userId) {
    return db.select().from(trades).where(eq(trades.userId, userId)).all();
  },
  getTradesByMarket(marketId) {
    return db.select().from(trades).where(eq(trades.marketId, marketId)).all();
  },
  createSignup(data) {
    try {
      return db.insert(signups).values(data).returning().get();
    } catch {
      return null;
    }
  },
  getAllSignups() {
    return db.select().from(signups).all();
  },
  getInviteCode(code) {
    return db.select().from(inviteCodes).where(eq(inviteCodes.code, code.trim().toUpperCase())).get();
  },
  consumeInviteCode(code, email) {
    db.update(inviteCodes)
      .set({ usedByEmail: email, usedAt: new Date().toISOString() })
      .where(eq(inviteCodes.code, code.trim().toUpperCase()))
      .run();
  },
  createInviteCode(code, label) {
    return db.insert(inviteCodes).values({
      code: code.trim().toUpperCase(),
      label,
      createdAt: new Date().toISOString(),
    }).returning().get();
  },
  getAllInviteCodes() {
    return db.select().from(inviteCodes).all();
  },
  createAccessRequest(data) {
    try {
      return db.insert(accessRequests).values({
        ...data,
        createdAt: new Date().toISOString(),
      }).returning().get();
    } catch {
      return null; // duplicate email
    }
  },
  getAccessRequestByEmail(email) {
    return db.select().from(accessRequests).where(eq(accessRequests.email, email.toLowerCase())).get();
  },
  getAllAccessRequests() {
    return db.select().from(accessRequests).all();
  },
  approveAccessRequest(id, tempPassword?: string) {
    db.update(accessRequests)
      .set({ status: "approved", reviewedAt: new Date().toISOString(), tempPassword: tempPassword || null })
      .where(eq(accessRequests.id, id)).run();
  },
  denyAccessRequest(id) {
    db.update(accessRequests)
      .set({ status: "denied", reviewedAt: new Date().toISOString() })
      .where(eq(accessRequests.id, id)).run();
  },
  approveUser(email) {
    db.update(users).set({ approved: true }).where(eq(users.email, email.toLowerCase())).run();
  },
};

// ── SEED DATA ────────────────────────────────────────────────────────────────
function seedIfEmpty() {
  const existing = db.select().from(markets).all();
  if (existing.length > 0) return;

  // ── DEMO USER ─────────────────────────────────────────────────────────────
  // Email: demo@bankruptcybet.com  |  Password: BBdemo2026!
  // Pre-hashed with bcrypt cost 12 — change password after first login
  const demoEmail = "demo@bankruptcybet.com";
  const existingDemo = db.select().from(users).where(eq(users.email, demoEmail)).get();
  if (!existingDemo) {
    db.insert(users).values({
      name: "Demo User",
      email: demoEmail,
      password: "$2b$12$OCgai1T8qFtZag07PLJLuOmR15AJ5v81bIIwb25r7W4lbwkAqOngC",
      firm: "BankruptcyBet",
      role: "trader",
      approved: true,
      bbBalance: 50000,
      createdAt: new Date().toISOString(),
    }).run();
    // Also create an approved access request so the demo account is consistent
    db.insert(accessRequests).values({
      name: "Demo User",
      email: demoEmail,
      firm: "BankruptcyBet",
      role: "Demo",
      status: "approved",
      createdAt: new Date().toISOString(),
      reviewedAt: new Date().toISOString(),
    }).run();
  }

  const marketData = [
    {
      caseId: "spirit",
      name: "Spirit Airlines",
      caseNo: "24-11988",
      court: "SDNY",
      judge: "Martin Glenn",
      filed: "Nov 18, 2024",
      industry: "Aviation",
      status: "active",
      currentPrice: 8,
      openingPrice: 12,
      high52: 22,
      low52: 3,
      volume: 14820,
      signal: "down",
      summary: "Spirit Airlines filed Chapter 11 in November 2024 with ~$1.1B in secured debt and ~$2.3B in unsecured claims. A $500M federal bailout has been discussed but remains unsigned. Cash runs out April 30. Court hearing April 30, 2026 will be pivotal — recovery ranges from 0–2¢ (liquidation) to 15¢+ (bailout/sale).",
      debtorCounsel: "Kirkland & Ellis",
      creditorCounsel: "Paul Weiss",
      claimsAgent: "Epiq Systems",
      securedClaims: "$1.1B",
      unsecuredClaims: "$2.3B",
      totalLiabilities: "$3.4B",
      priceHistory: JSON.stringify([12,14,11,9,13,10,8,7,9,8]),
      type: "recovery",
    },
    {
      caseId: "redlobster",
      name: "Red Lobster",
      caseNo: "24-02461",
      court: "M.D. Fla.",
      judge: "Tiffany Geyer",
      filed: "May 19, 2024",
      industry: "Casual Dining",
      status: "active",
      currentPrice: 5,
      openingPrice: 8,
      high52: 15,
      low52: 2,
      volume: 9340,
      signal: "down",
      summary: "Red Lobster filed after closing 100+ locations. The endless shrimp promotion and rising food costs decimated margins. Thai Union (largest shareholder) walked away. §363 sale in progress — unsecured creditors likely to receive 3–7¢ depending on sale price.",
      debtorCounsel: "King & Spalding",
      creditorCounsel: "Pachulski Stang",
      claimsAgent: "Stretto",
      securedClaims: "$280M",
      unsecuredClaims: "$1.1B",
      totalLiabilities: "$1.4B",
      priceHistory: JSON.stringify([8,9,7,6,8,5,4,6,5,5]),
      type: "recovery",
    },
    {
      caseId: "rite-aid",
      name: "Rite Aid",
      caseNo: "23-18993",
      court: "D.N.J.",
      judge: "Michael Kaplan",
      filed: "Oct 15, 2023",
      industry: "Retail Pharmacy",
      status: "active",
      currentPrice: 3,
      openingPrice: 6,
      high52: 9,
      low52: 1,
      volume: 22100,
      signal: "down",
      summary: "Rite Aid entered Chapter 11 with massive opioid litigation liability on top of structural pharmacy margin compression. Plan confirmation has been delayed by opioid claimant disputes. GUC recovery likely to be minimal — 2–5¢ range — as secured lenders and opioid trusts absorb most of the estate.",
      debtorCounsel: "Skadden Arps",
      creditorCounsel: "Brown Rudnick",
      claimsAgent: "Kroll",
      securedClaims: "$3.9B",
      unsecuredClaims: "$6.2B",
      totalLiabilities: "$10.1B",
      priceHistory: JSON.stringify([6,5,7,4,3,4,2,3,3,3]),
      type: "recovery",
    },
    {
      caseId: "yellow-corp",
      name: "Yellow Corp (YRC)",
      caseNo: "23-11069",
      court: "D. Del.",
      judge: "Craig Goldblatt",
      filed: "Aug 6, 2023",
      industry: "Trucking / Freight",
      status: "resolved",
      currentPrice: 14,
      openingPrice: 5,
      high52: 18,
      low52: 3,
      volume: 31400,
      signal: "up",
      summary: "Yellow Corp (formerly YRC Worldwide) liquidated its trucking network after 99 years. Asset sales exceeded expectations — real estate, terminals, and equipment commanded strong prices. Plan confirmed Q1 2025 with GUC recovery of approximately 14¢, well above initial estimates of 3–6¢.",
      debtorCounsel: "Kirkland & Ellis",
      creditorCounsel: "Akin Gump",
      claimsAgent: "Epiq Systems",
      securedClaims: "$1.5B",
      unsecuredClaims: "$2.3B",
      totalLiabilities: "$3.8B",
      priceHistory: JSON.stringify([5,6,5,8,9,11,13,12,14,14]),
      type: "recovery",
    },
    {
      caseId: "wework",
      name: "WeWork",
      caseNo: "23-19865",
      court: "D.N.J.",
      judge: "John Sherwood",
      filed: "Nov 6, 2023",
      industry: "Commercial Real Estate",
      status: "resolved",
      currentPrice: 2,
      openingPrice: 4,
      high52: 7,
      low52: 1,
      volume: 18600,
      signal: "flat",
      summary: "WeWork emerged from bankruptcy in May 2024 as a restructured entity. Landlord negotiations reduced lease obligations dramatically. GUC recovery settled at approximately 2¢ on the dollar — unsecured creditors received equity in the reorganized entity worth roughly 2% of face value.",
      debtorCounsel: "Kirkland & Ellis",
      creditorCounsel: "Milbank",
      claimsAgent: "Omni Agent Solutions",
      securedClaims: "$2.9B",
      unsecuredClaims: "$12.8B",
      totalLiabilities: "$15.7B",
      priceHistory: JSON.stringify([4,5,3,2,3,2,1,2,2,2]),
      type: "recovery",
    },
    {
      caseId: "steward",
      name: "Steward Health Care",
      caseNo: "24-90213",
      court: "S.D. Tex.",
      judge: "Christopher Lopez",
      filed: "May 6, 2024",
      industry: "Healthcare",
      status: "active",
      currentPrice: 6,
      openingPrice: 9,
      high52: 14,
      low52: 3,
      volume: 11200,
      signal: "down",
      summary: "Steward Health Care filed as the largest private for-profit hospital operator in the US. Hospital sales to state health systems and other operators are underway. Recovery depends heavily on net proceeds after secured lender payoff — trade creditors (vendors, medical suppliers) face 4–8¢ depending on sale closings.",
      debtorCounsel: "McDermott Will & Emery",
      creditorCounsel: "Akin Gump",
      claimsAgent: "Kroll",
      securedClaims: "$6.8B",
      unsecuredClaims: "$3.2B",
      totalLiabilities: "$10.0B",
      priceHistory: JSON.stringify([9,8,10,7,8,6,5,7,6,6]),
      type: "recovery",
    },
  ];

  for (const m of marketData) {
    const inserted = db.insert(markets).values(m).returning().get();

    // Seed news per market
    const newsItems: Array<Omit<InsertNews, "marketId">> = getNewsForCase(m.caseId);
    for (let i = 0; i < newsItems.items.length; i++) {
      db.insert(news).values({ ...newsItems.items[i], marketId: inserted.id, sortOrder: i }).run();
    }
  }
}

function getNewsForCase(caseId: string): { items: Omit<InsertNews, "marketId" | "sortOrder">[] } {
  const map: Record<string, Omit<InsertNews, "marketId" | "sortOrder">[]> = {
    spirit: [
      { date: "Apr 25, 2026", headline: "$500M Government Bailout — Talks 'Very Advanced,' Still Unsigned", body: "Spirit counsel Marshall Huebner told SDNY Judge Glenn cash will run out before April 30. A $500M federal loan giving the government 90% equity is under discussion, but Transportation Secretary called it 'good money after bad.'", impact: "MIXED", impactNote: "Bailout would push recovery to 15¢+. No deal = likely 0–2¢ liquidation.", source: "Reuters / PACER" },
      { date: "Mar 12, 2026", headline: "DIP Lenders Decline Extension — Cash Burn Accelerates", body: "Spirit's DIP lenders refused to extend the facility past April 30 without a signed government commitment. The airline is burning ~$12M per week.", impact: "BEARISH", impactNote: "Accelerates liquidation timeline. Unsecured creditors face lower recovery.", source: "Bloomberg" },
      { date: "Jan 22, 2026", headline: "Potential Acquirer Frontier Airlines Walks Away", body: "Frontier, which merged with Spirit rival Allegiant, determined it had no strategic rationale to acquire Spirit's gates and fleet at this juncture.", impact: "BEARISH", impactNote: "Removes primary reorganization scenario. Liquidation becomes base case.", source: "Wall Street Journal" },
      { date: "Nov 18, 2024", headline: "Spirit Files Chapter 11 — Case Opens at 12¢", body: "Spirit Airlines filed Ch.11 in SDNY. Capital structure shows $1.1B secured, $2.3B unsecured. Market opened at 12¢ based on comparable airline restructurings (Frontier 2008: 18¢, Sun Country 2002: 9¢).", impact: "MIXED", impactNote: "Opening price of 12¢ reflects wide recovery range. Case outcome highly uncertain.", source: "PACER Filing" },
    ],
    redlobster: [
      { date: "Mar 5, 2026", headline: "§363 Sale to New Operator — Proceeds Below Expectations", body: "Red Lobster's 544-location portfolio sold to a PE-backed operator for $375M — $80M below the floor bid that Darden Restaurants walked away from in 2024.", impact: "BEARISH", impactNote: "Lower proceeds compress recovery waterfall. GUC recovery now estimated 3–5¢.", source: "Restaurant Business / PACER" },
      { date: "Oct 9, 2025", headline: "Thai Union Writes Off $530M Investment — Exits Completely", body: "Thai Union, Red Lobster's controlling shareholder, wrote off its entire $530M investment and declined to participate in any reorganization plan.", impact: "BEARISH", impactNote: "No sponsor support for reorganization. Sale process now only path.", source: "Bloomberg" },
      { date: "May 19, 2024", headline: "Filing: Endless Shrimp + Thai Union's Exit Created Cash Crisis", body: "The petition disclosed that the 2023 all-you-can-eat shrimp promotion cost $11M in a single quarter. Combined with Thai Union reducing support, the company had no bridge to viability.", impact: "BEARISH", impactNote: "Case opens with slim reorganization prospects. Sale scenario most likely.", source: "PACER Filing" },
    ],
    "rite-aid": [
      { date: "Feb 28, 2026", headline: "Opioid Trust Demands $5.4B — GUC Pool Shrinks to Near Zero", body: "The official opioid claimant committee filed a proof of claim for $5.4B against the estate. If allowed, the opioid trust would absorb virtually the entire unsecured pool ahead of trade creditors.", impact: "BEARISH", impactNote: "GUC recovery may be 1–2¢ or zero if opioid trust claim is allowed at full amount.", source: "PACER" },
      { date: "Nov 14, 2025", headline: "Pharmacy Sales Complete — $1.8B Total Proceeds", body: "Rite Aid completed sales of 1,200+ pharmacy locations to Walgreens, CVS, and independent operators. Total proceeds of $1.8B will first satisfy secured creditors.", impact: "MIXED", impactNote: "Secured creditors fully paid. Residual for unsecured depends on opioid resolution.", source: "Bloomberg / PACER" },
      { date: "Oct 15, 2023", headline: "Filing: $6.2B Unsecured with Opioid Overhang", body: "Rite Aid entered Ch.11 with the largest opioid liability exposure of any company still operating. DOJ and state AGs have filed claims. The estate simultaneously faces legacy lease obligations.", impact: "BEARISH", impactNote: "Dual headwinds of opioid liability and lease costs make recovery highly uncertain.", source: "PACER Filing" },
    ],
    "yellow-corp": [
      { date: "Mar 15, 2025", headline: "Plan Confirmed — GUC Recovery: 14¢", body: "Judge Goldblatt confirmed Yellow Corp's liquidating plan. Terminal and real estate sales totaled $2.1B — significantly above initial estimates. GUC holders receive 14¢ on the dollar.", impact: "BULLISH", impactNote: "FINAL SETTLEMENT: 14¢. Contract resolved. Strong asset sales drove above-consensus recovery.", source: "PACER / Plan of Reorganization" },
      { date: "Jan 8, 2025", headline: "Terminal Auction Clears $1.3B — Beats Reserve by 40%", body: "Yellow's 169 freight terminals drew intense bidding from XPO, Estes Express, and Old Dominion. Final auction cleared $1.3B against a reserve of $920M.", impact: "BULLISH", impactNote: "Asset proceeds above estimate. Raises recovery projection from 8–10¢ to 12–16¢ range.", source: "Truck News / PACER" },
      { date: "Aug 6, 2023", headline: "Yellow Shuts Down After 99 Years — 30,000 Jobs Lost", body: "Yellow Corp ceased operations and filed Chapter 11. The sudden shutdown — caused by a feud with the Teamsters over network restructuring — left 30,000 employees without jobs and thousands of shippers scrambling.", impact: "MIXED", impactNote: "Market opens at 5¢ — below comparable trucking cases due to operational complexity.", source: "FreightWaves / PACER Filing" },
    ],
    wework: [
      { date: "May 12, 2024", headline: "WeWork Emerges — GUC Receives 2¢ in New Equity", body: "WeWork successfully emerged from bankruptcy. The reorganized entity's equity was distributed to creditors at ~2% of face value. Former CEO Adam Neumann's attempt to re-acquire the company for $900M was rejected.", impact: "MIXED", impactNote: "FINAL SETTLEMENT: 2¢ in equity. Contract resolved. Below initial expectations.", source: "PACER / Plan of Reorganization" },
      { date: "Nov 6, 2023", headline: "Filing: $12.8B Unsecured Claims, 500+ Lease Rejections", body: "WeWork filed with an unprecedented lease rejection agenda — 500+ locations globally. The company's core liability was long-term leases signed at peak 2019 valuations. Landlords became the largest creditor class.", impact: "BEARISH", impactNote: "Massive landlord claims ahead of trade creditors. GUC pool severely compressed.", source: "PACER Filing" },
    ],
    steward: [
      { date: "Apr 10, 2026", headline: "Massachusetts Hospital Sale Falls Through — State Intervenes", body: "The sale of Steward's five Massachusetts hospitals collapsed when the buyer failed to secure financing. Governor Healey activated emergency powers to keep hospitals open, but the collapse reduces estate proceeds.", impact: "BEARISH", impactNote: "Failed sale reduces recovery waterfall. Secured lenders may not be fully paid, leaving less for GUC.", source: "Boston Globe / PACER" },
      { date: "Jan 17, 2026", headline: "Texas Hospital Sales Complete — $800M Proceeds", body: "Steward's Texas portfolio (8 hospitals) sold to a consortium of health systems and private equity for $800M. Proceeds will be applied to secured debt first.", impact: "MIXED", impactNote: "Some secured debt retired. Remaining proceeds for GUC depend on full hospital portfolio disposition.", source: "Healthcare Dive / PACER" },
      { date: "May 6, 2024", headline: "Largest Hospital Bankruptcy in US History Filed", body: "Steward Health Care filed Chapter 11 — the largest private for-profit hospital operator in the US. 31 hospitals across 8 states. Secured lenders include MPT (Medical Properties Trust) with $6.8B first lien.", impact: "MIXED", impactNote: "Case opens at 9¢. Hospital assets have strong strategic value to competing health systems.", source: "PACER Filing / Modern Healthcare" },
    ],
  };
  return { items: map[caseId] || [] };
}

seedIfEmpty();
export { db };
