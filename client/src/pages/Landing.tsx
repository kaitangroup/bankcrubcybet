import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/components/ThemeProvider";
import Navbar from "@/components/Navbar";
import Ticker from "@/components/Ticker";
import MarketCard from "@/components/MarketCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Sun, Moon, Lock, ArrowRight, Shield, TrendingUp, BarChart2, Scale, Landmark, ChevronRight } from "lucide-react";
import type { Market } from "@shared/schema";

type MarketWithHistory = Market & { priceHistory: number[] };

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

// ── GUEST GATE ────────────────────────────────────────────────────────────────
function GatePage() {
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
          className="text-secondary-foreground/40 hover:text-secondary-foreground"
          aria-label="Toggle theme"
          data-testid="btn-theme-toggle"
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </Button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="mb-8">
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none" aria-label="BankruptcyBet logo">
            <rect width="28" height="28" rx="6" fill="hsl(var(--primary) / 0.15)" />
            <path d="M8 7h6.5c2.2 0 3.5 1.2 3.5 2.8 0 1.1-.6 1.9-1.5 2.3C17.8 12.5 19 13.5 19 15c0 2-1.5 3.2-3.8 3.2H8V7z" fill="hsl(var(--primary))" />
            <rect x="10" y="9" width="3.5" height="2.5" rx="0.5" fill="hsl(var(--secondary))" />
            <rect x="10" y="13" width="4" height="2.8" rx="0.5" fill="hsl(var(--secondary))" />
            <path d="M21 8 L7 20" stroke="hsl(var(--primary))" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-secondary-foreground mb-1 tracking-tight">
          <span className="text-primary">BB</span>et
        </h1>
        <p className="text-sm text-secondary-foreground/40 mb-10">bankruptcybet.com</p>
        <div className="mb-6 w-10 h-10 rounded-full border border-secondary-foreground/10 flex items-center justify-center">
          <Lock size={16} className="text-secondary-foreground/40" />
        </div>
        <p className="text-sm text-secondary-foreground/50 mb-8 text-center max-w-xs">
          This platform is invite-only.<br />Request access to continue.
        </p>
        <div className="flex flex-col items-center gap-3 w-full max-w-xs">
          <Link href="/request-access" className="w-full">
            <Button size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold" data-testid="btn-request-access">
              Request Access
            </Button>
          </Link>
          <Link href="/login" className="w-full">
            <Button variant="ghost" size="sm" className="w-full text-secondary-foreground/40 hover:text-secondary-foreground text-sm" data-testid="btn-login">
              Already have an account? Log in
            </Button>
          </Link>
        </div>
      </div>

      <div className="text-center pb-6 text-xs text-secondary-foreground/20">
        BankruptcyBet LLC · Delaware · © {new Date().getFullYear()}
      </div>
    </div>
  );
}

// ── AUTHENTICATED HOME ────────────────────────────────────────────────────────
function HomePage() {
  const { user } = useAuth();

  const { data: markets } = useQuery<MarketWithHistory[]>({
    queryKey: ["/api/markets"],
  });
  const activeMarkets = markets?.filter((m) => m.status === "active") ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Ticker />

      {/* HERO */}
      <section className="relative overflow-hidden bg-secondary text-secondary-foreground">
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <Badge className="mb-5 bg-primary/20 text-primary border-primary/30 hover:bg-primary/25 text-xs px-3 py-1">
            DEMO PLATFORM · CFTC Approval Pending
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold text-secondary-foreground leading-tight max-w-2xl mx-auto">
            Predict Corporate Bankruptcy Recovery Rates
          </h1>
          <p className="mt-4 text-base text-secondary-foreground/70 max-w-xl mx-auto">
            BankruptcyBet is a predictive markets platform for Chapter 11 cases. Trade recovery rates, hedge credit exposure, and track outcomes — with BB$ demo credits. No real money, ever.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-8" data-testid="hero-cta-dashboard">
                Open Trading Dashboard <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground/10 px-8"
              onClick={() => scrollTo("how-it-works")}
              data-testid="hero-cta-learn"
            >
              How It Works
            </Button>
          </div>
          <div className="mt-12 grid grid-cols-3 divide-x divide-secondary-foreground/10 max-w-lg mx-auto">
            {[
              { label: "Active Markets", value: `${activeMarkets.length || "—"}` },
              { label: "Starting Credits", value: "BB$50K" },
              { label: "Revenue Split", value: "2.00%" },
            ].map((s) => (
              <div key={s.label} className="px-4 py-2 text-center">
                <div className="text-xl font-bold text-primary font-mono">{s.value}</div>
                <div className="text-xs text-secondary-foreground/60 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LIVE MARKETS */}
      <section id="markets" className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Live Markets</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Active bankruptcy cases available for trading</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="text-sm border-border text-muted-foreground hover:text-foreground gap-1.5" data-testid="link-view-all">
              View All <ChevronRight size={13} />
            </Button>
          </Link>
        </div>
        {markets && markets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {markets.slice(0, 6).map((m) => (
              <MarketCard key={m.caseId} market={m} readonly />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        )}
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="bg-muted/40 dark:bg-muted/10 border-y border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-foreground">How BankruptcyBet Works</h2>
            <p className="text-sm text-muted-foreground mt-1">A predictive market for credit professionals and restructuring specialists</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: <BarChart2 size={20} className="text-primary" />,
                title: "Browse Markets",
                body: "Each open bankruptcy case is a market showing the current consensus recovery price in cents on the dollar (0–100¢). Spirit Airlines at 8¢ implies an 8% recovery rate.",
              },
              {
                icon: <TrendingUp size={20} className="text-primary" />,
                title: "Place a Trade",
                body: "Pick a direction (Long or Short), enter your target price, and wager BB$ credits. The further your target from the entry price, the higher your potential multiplier.",
              },
              {
                icon: <Shield size={20} className="text-primary" />,
                title: "Demo Only",
                body: "Every account starts with BB$50,000 in demo credits. No real money is ever accepted or at risk. CFTC approval is pending before any live trading.",
              },
            ].map((s) => (
              <div key={s.title} className="bg-card border border-border rounded-xl p-5">
                <div className="mb-3 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">{s.icon}</div>
                <h3 className="font-semibold text-sm text-foreground mb-1.5">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HEDGING UTILITY */}
      <section id="hedging" className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col sm:flex-row gap-8 items-start">
          <div className="flex-1">
            <Badge className="mb-3 bg-secondary/10 text-secondary dark:bg-secondary-foreground/10 dark:text-secondary-foreground border-secondary/20 text-xs">
              Hedging Utility
            </Badge>
            <h2 className="text-xl font-bold text-foreground mb-3">The Most Important Feature: Real Hedge Value</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              BankruptcyBet's primary value proposition is its <strong className="text-foreground">hedging utility</strong>. Lenders, bondholders, and trade creditors with exposure to distressed companies can use the platform to offset potential losses on their credit positions.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[
                "A lender with $10M exposure can short the recovery rate, locking in a hedge",
                "A bondholder can go long to benefit from a higher-than-expected recovery",
                "Law firms and advisors can validate consensus pricing against real market signals",
                "Institutional investors gain a price discovery mechanism for distressed debt",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5 shrink-0">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="sm:w-64 shrink-0">
            <div className="bg-secondary text-secondary-foreground rounded-xl p-5">
              <h3 className="font-semibold text-sm mb-3">Market Types</h3>
              <ul className="space-y-2 text-xs text-secondary-foreground/80">
                {[
                  ["Recovery Rate", "0–100¢ prediction"],
                  ["Pre-Filing Binary", "Will they file? Yes/No"],
                  ["Case Outcome", "Plan type prediction"],
                  ["Second Filing", "Re-filing probability"],
                  ["Estate Litigation", "Outcome prediction"],
                ].map(([type, desc]) => (
                  <li key={type} className="flex justify-between gap-2">
                    <span className="font-medium text-secondary-foreground/90">{type}</span>
                    <span className="text-right">{desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* PRE-FILING MARKETS */}
      <section id="pre-filing" className="bg-muted/40 dark:bg-muted/10 border-y border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <div className="text-center mb-6">
            <Badge className="mb-3 bg-primary/10 text-primary border-primary/20 text-xs">Pre-Filing Intelligence</Badge>
            <h2 className="text-xl font-bold text-foreground">Watch List: Companies at Risk</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-lg mx-auto">
              BankruptcyBet monitors distressed companies before they file. Pre-filing binary markets let you bet on whether a company will file within a defined window.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { name: "Joann Stores", ticker: "JOAN", risk: "High", reason: "Craft retail decline; second restructuring attempt" },
              { name: "Big Lots", ticker: "BIG", risk: "High", reason: "Mass-market retail distress; store closure pace" },
              { name: "Envision Healthcare", ticker: "EVHC", risk: "Medium", reason: "Physician staffing model under payor pressure" },
              { name: "Cineworld / Regal", ticker: "CNNWF", risk: "Medium", reason: "Box office recovery lag; heavy lease burden" },
            ].map((c) => (
              <div key={c.name} className="bg-card border border-border rounded-lg p-4 flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{c.ticker}</p>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{c.reason}</p>
                </div>
                <Badge
                  variant="outline"
                  className={`shrink-0 text-xs ${c.risk === "High" ? "border-red-500/40 text-red-600 dark:text-red-400 bg-red-500/5" : "border-yellow-500/40 text-yellow-700 dark:text-yellow-400 bg-yellow-500/5"}`}
                >
                  {c.risk} Risk
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REGULATORY */}
      <section id="regulatory" className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-start">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-3">Regulatory Pathway</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              BankruptcyBet is pursuing a Designated Contract Market (DCM) license under the Commodity Exchange Act, consistent with the CFTC's framework for event contracts on economic outcomes. The platform operates in demo mode until approval is granted.
            </p>
            <div className="space-y-2">
              {[
                { step: "1", label: "TSP Partner Agreement", time: "1–3 months", cost: "$0", status: "active" },
                { step: "2", label: "IB Sponsor Route", time: "3–6 months", cost: "$45K", status: "pending" },
                { step: "3", label: "Own DCM License", time: "12–36 months", cost: "$5M+", status: "pending" },
              ].map((s) => (
                <div key={s.step} className="flex items-center gap-3 text-sm">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${s.status === "active" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {s.step}
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-foreground">{s.label}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{s.time} · {s.cost}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {[
              { icon: <Scale size={16} className="text-primary" />, label: "CFTC", text: "Event contracts on Chapter 11 outcomes are a recognized category under CEA Section 5c(c)(5)(C)." },
              { icon: <Landmark size={16} className="text-primary" />, label: "Delaware LLC", text: "BankruptcyBet LLC is organized in Delaware, the preferred jurisdiction for institutional-grade fintech." },
              { icon: <Shield size={16} className="text-primary" />, label: "No Retail Speculation", text: "Platform is restricted to accredited investors and qualified institutional buyers pending DCM license." },
            ].map((item) => (
              <div key={item.label} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-start gap-2">
                  {item.icon}
                  <div>
                    <p className="font-semibold text-xs text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOUNDER */}
      <section id="founder" className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold text-foreground mb-3 text-sm text-muted-foreground uppercase tracking-wide">Founder</h2>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
              <span className="text-primary font-bold text-sm">RJ</span>
            </div>
            <div>
              <p className="font-semibold text-foreground">Roland Gary Jones, Esq.</p>
              <p className="text-sm text-muted-foreground">Jones &amp; Associates · 1325 Avenue of the Americas, 28th Floor, New York, NY 10019</p>
              <a href="https://rolandjones.com" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1 inline-block">
                rolandjones.com
              </a>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-lg">
                Roland Gary Jones is a New York–based bankruptcy attorney with over 25 years of experience in bankruptcy litigation, restructuring, and capital markets. BankruptcyBet is his platform to democratize access to distressed debt intelligence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border bg-muted/30 dark:bg-muted/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>
            <span className="font-semibold text-foreground">BankruptcyBet LLC</span> · Delaware · © {new Date().getFullYear()}
          </div>
          <div className="text-center">
            Demo platform only. No real money accepted. CFTC approval pending. Not legal or investment advice.
          </div>
          <div className="flex gap-4">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            <Link href="/portfolio" className="hover:text-foreground transition-colors">Portfolio</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── ROOT: picks which page to show ───────────────────────────────────────────
export default function Landing() {
  const { user } = useAuth();
  return user ? <HomePage /> : <GatePage />;
}
