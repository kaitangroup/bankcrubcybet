# BankruptcyBet

**Predictive markets for corporate bankruptcy recovery rates.**

BankruptcyBet is a full-stack web application that lets users trade recovery rates on active Chapter 11 bankruptcy cases using BB$ demo credits. No real money is ever accepted or at risk. CFTC approval is pending.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v3 + shadcn/ui |
| Routing | Wouter (hash-based for iframe compatibility) |
| Data fetching | TanStack Query v5 |
| Forms | react-hook-form + Zod |
| Backend | Express 5 |
| Database | SQLite via better-sqlite3 + Drizzle ORM |
| Auth | express-session + memorystore |
| Icons | lucide-react |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install

```bash
git clone https://github.com/YOUR_USERNAME/bankruptcybet.git
cd bankruptcybet
npm install
```

### Configure environment

```bash
cp .env.example .env
# Edit .env and set SESSION_SECRET to a long random string
```

### Run (development)

```bash
npm run dev
```

Opens at **http://localhost:5000**

### Build (production)

```bash
npm run build
npm start
```

---

## Project Structure

```
bankruptcybet/
├── client/                     # React frontend
│   ├── index.html
│   └── src/
│       ├── App.tsx             # Root component + router
│       ├── index.css           # Tailwind + brand tokens (Navy/Gold/Cream)
│       ├── main.tsx
│       ├── components/
│       │   ├── Navbar.tsx      # Sticky nav with auth state + theme toggle
│       │   ├── Ticker.tsx      # Scrolling live price ticker
│       │   ├── MarketCard.tsx  # Case card with sparkline + price data
│       │   ├── TradeModal.tsx  # Trade entry dialog (Long/Short/payout preview)
│       │   ├── Sparkline.tsx   # Inline SVG price history chart
│       │   ├── ThemeProvider.tsx
│       │   └── ui/             # shadcn/ui components
│       ├── pages/
│       │   ├── Landing.tsx     # Public home page
│       │   ├── Login.tsx
│       │   ├── Register.tsx
│       │   ├── Dashboard.tsx   # Authenticated markets grid + trading
│       │   └── Portfolio.tsx   # User's open/settled positions
│       ├── hooks/
│       └── lib/
│           ├── queryClient.ts  # TanStack Query + apiRequest helper
│           └── utils.ts
├── server/
│   ├── index.ts                # Express server bootstrap + sessions
│   ├── routes.ts               # API routes (auth, markets, trades, signups)
│   ├── storage.ts              # Drizzle ORM storage layer + seed data
│   └── vite.ts                 # Vite dev middleware
├── shared/
│   └── schema.ts               # Drizzle schema + Zod types (shared client/server)
├── script/
│   └── build.ts                # Production build script
├── .env.example
├── .gitignore
├── drizzle.config.ts
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

---

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account (name, email, password) |
| POST | `/api/auth/login` | Log in |
| POST | `/api/auth/logout` | Log out |
| GET | `/api/auth/me` | Get current user |

### Markets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/markets` | List all markets (with price history) |
| GET | `/api/markets/:caseId` | Single market + news items |

### Trades
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trades` | User's trade history |
| POST | `/api/trades` | Place a new trade |

### Signups
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/signups` | Join the waitlist |

---

## Seeded Markets

Six markets are seeded on first run:

| Case | caseId | Status | Entry Price | Court |
|------|--------|--------|-------------|-------|
| Spirit Airlines | `spirit` | Active | 8¢ | S.D.N.Y. |
| Red Lobster | `redlobster` | Active | 5¢ | M.D. Fla. |
| Rite Aid | `rite-aid` | Active | 3¢ | D.N.J. |
| Yellow Corp (YRC) | `yellow-corp` | Resolved | 14¢ | D. Del. |
| WeWork | `wework` | Resolved | 2¢ | D.N.J. |
| Steward Health Care | `steward` | Active | 6¢ | S.D. Tex. |

---

## Brand

| Token | Value |
|-------|-------|
| Navy | `#1B2A4A` / HSL `220 45% 20%` |
| Gold | `#B8942A` / HSL `38 68% 44%` |
| Cream | `#F5F0E8` / HSL `42 30% 96%` |
| Display font | Playfair Display |
| Body font | DM Sans |

---

## Payout Formula

```
multiplier = max(1.5, 1 + (|targetPrice - entryPrice| / entryPrice) × 3)
potentialPayout = wager × multiplier
```

---

## Regulatory

BankruptcyBet operates in **demo mode only**. No real money is accepted. A Designated Contract Market (DCM) license application under the Commodity Exchange Act is in preparation. All trades use BB$ fictional credits.

---

## License

MIT — see [LICENSE](LICENSE)

---

*BankruptcyBet LLC · Delaware · rolandjones.com*
