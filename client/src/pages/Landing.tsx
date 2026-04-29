import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import Ticker from "@/components/Ticker";
import MarketCard from "@/components/MarketCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Shield, TrendingUp, BarChart2, Scale, Landmark, ChevronRight } from "lucide-react";
import type { Market } from "@shared/schema";

type MarketWithHistory = Market & { priceHistory: number[] };

// Safe scroll helper — avoids hash routing conflict
function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function Landing() {
  const { user } = useAuth();

  const { data: markets } = useQuery<MarketWithHistory[]>({
    queryKey: ["/api/markets"],
  });
  const activeMarkets = markets?.filter((m) => m.status === "active") ?? [];

  return (
    <div className="min-h-screen bg-background">
     <Navbar />
      <Ticker />

      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-secondary text-secondary-foreground">
        {/* Background grid pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none"
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
            {user ? (
              <Link href="/dashboard">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-8" data-testid="hero-cta-dashboard">
                  Open Trading Dashboard <ArrowRight size={16} className="ml-2" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/register">
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-8" data-testid="hero-cta-register">
                    Start Trading Free <ArrowRight size={16} className="ml-2" />
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
              </>
            )}
          </div>
          {/* Stats bar */}
          <div className="mt-12 grid grid-cols-3 divide-x divide-secondary-foreground/10 max-w-lg mx-auto">
            {[
              { label: "Active Markets", value: `${activeMarkets.length}` },
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

      {/* ── LIVE MARKETS ──────────────────────────────────────────────────────── */}
      <section id="markets" className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Live Markets</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Active bankruptcy cases available for trading</p>
          </div>
          <Link href={user ? "/dashboard" : "/register"}>
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
        {!user && (
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              <Link href="/register" className="text-primary hover:underline font-medium" data-testid="link-register-markets">
                Create a free account
              </Link>
              {" "}to start placing trades with BB$50,000 in demo credits.
            </p>
          </div>
        )}
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────────── */}
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
                <div className="mb-3 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  {s.icon}
                </div>
                <h3 className="font-semibold text-sm text-foreground mb-1.5">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HEDGING UTILITY ───────────────────────────────────────────────────── */}
      <section id="hedging" className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col sm:flex-row gap-8 items-start">
          <div className="flex-1">
            <Badge className="mb-3 bg-secondary/10 text-secondary dark:bg-secondary-foreground/10 dark:text-secondary-foreground border-secondary/20 text-xs">
              Hedging Utility
            </Badge>
            <h2 className="text-xl font-bold text-foreground mb-3">
              The Most Important Feature: Real Hedge Value
            </h2>
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

      {/* ── PRE-FILING MARKETS ────────────────────────────────────────────────── */}
      <section id="pre-filing" className="bg-muted/40 dark:bg-muted/10 border-y border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <div className="text-center mb-8">
            <Badge className="mb-3 bg-primary/10 text-primary border-primary/20 text-xs">Pre-Filing Intelligence</Badge>
            <h2 className="text-xl font-bold text-foreground">Will They File? Markets for Private Credit Lenders</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl mx-auto">
              Private credit lenders with direct loan exposure to distressed borrowers face binary risk: the company files or it doesn't. BankruptcyBet's pre-filing probability markets let lenders hedge that risk before a Chapter 11 petition is ever filed.
            </p>
          </div>

          {/* Private credit hedging explainer */}
          <div className="bg-secondary text-secondary-foreground rounded-xl p-5 mb-8">
            <h3 className="font-semibold text-sm mb-3">How private credit lenders use pre-filing markets</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-secondary-foreground/80">
              {[
                {
                  step: "1",
                  title: "Identify exposure",
                  body: "You hold a $20M term loan to a leveraged borrower showing signs of distress — covenant violations, PIK toggles, missed amort payments.",
                },
                {
                  step: "2",
                  title: "Short the filing probability",
                  body: "The market shows a 68% chance of Chapter 11 within 12 months. You short at 68¢, wagering that the probability will move against you — hedging your loan principal.",
                },
                {
                  step: "3",
                  title: "Offset your loss",
                  body: "If the company files and the market settles at 100¢, your position pays out — partially offsetting the impairment on your credit facility.",
                },
              ].map((s) => (
                <div key={s.step} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{s.step}</div>
                  <div>
                    <p className="font-semibold text-secondary-foreground mb-1">{s.title}</p>
                    <p className="leading-relaxed">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Example pre-filing markets */}
          <h3 className="font-semibold text-foreground mb-4 text-sm">Example Pre-Filing Probability Markets</h3>
          <div className="space-y-3">
            {[
              {
                name: "Enviva Partners",
                ticker: "EVA",
                exposure: "Senior secured term loan",
                prob: 72,
                window: "12 months",
                lenderNote: "Wood pellet exporter; debt load unsustainable at current commodity prices. Private credit holds ~$400M in secured paper.",
                trend: "up",
              },
              {
                name: "Ardagh Group",
                ticker: "ARD",
                exposure: "PIK toggle notes / unitranche",
                prob: 61,
                window: "18 months",
                lenderNote: "Glass & metal packaging; $11B debt stack, EBITDA compression. Multiple direct lenders hold subordinated tranches.",
                trend: "up",
              },
              {
                name: "Cano Health",
                ticker: "CANO",
                exposure: "Revolving credit facility",
                prob: 85,
                window: "6 months",
                lenderNote: "Primary care operator; Medicare Advantage rate headwinds, negative operating cash flow. High near-term filing probability.",
                trend: "up",
              },
              {
                name: "Bausch Health",
                ticker: "BHC",
                exposure: "Senior secured notes",
                prob: 44,
                window: "24 months",
                lenderNote: "Pharma/eye care; $21B debt, Xifaxan patent litigation pending. Outcome-dependent — binary risk around court ruling.",
                trend: "neutral",
              },
              {
                name: "iHeartMedia",
                ticker: "IHRT",
                exposure: "Second lien term loan",
                prob: 38,
                window: "18 months",
                lenderNote: "Terrestrial radio facing secular decline; ad revenue softness. Second lien holders most exposed in downside scenario.",
                trend: "down",
              },
              {
                name: "Regent Communications",
                ticker: "Private",
                exposure: "Unitranche direct loan",
                prob: 79,
                window: "9 months",
                lenderNote: "Mid-market media operator; covenant breach Q3 2025, waiver expired. Direct lender facing full principal impairment risk.",
                trend: "up",
              },
            ].map((c) => {
              const probColor =
                c.prob >= 70 ? "text-red-600 dark:text-red-400" :
                c.prob >= 50 ? "text-yellow-600 dark:text-yellow-400" :
                "text-green-600 dark:text-green-400";
              const barColor =
                c.prob >= 70 ? "bg-red-500" :
                c.prob >= 50 ? "bg-yellow-500" :
                "bg-green-500";
              return (
                <div key={c.name} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Left: name + context */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-foreground">{c.name}</p>
                        <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{c.ticker}</span>
                        <Badge variant="outline" className="text-xs border-border text-muted-foreground">{c.exposure}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{c.lenderNote}</p>
                    </div>
                    {/* Right: probability gauge */}
                    <div className="sm:w-52 shrink-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Filing probability</span>
                        <span className={`text-sm font-bold font-mono ${probColor}`}>{c.prob}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${c.prob}%` }} />
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs text-muted-foreground">Window: {c.window}</span>
                        <span className={`text-xs font-medium ${
                          c.trend === "up" ? "text-red-500" :
                          c.trend === "down" ? "text-green-500" :
                          "text-muted-foreground"
                        }`}>
                          {c.trend === "up" ? "▲ Rising" : c.trend === "down" ? "▼ Falling" : "— Stable"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Note:</strong> These are illustrative demo markets only. Probabilities are hypothetical examples for platform demonstration purposes and do not constitute investment advice or credit analysis. No real money is accepted. CFTC approval pending.
            </p>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-5">
            Pre-filing markets open upon DCM partner approval. <Link href="/register" className="text-primary hover:underline">Join the waitlist.</Link>
          </p>
        </div>
      </section>

      {/* ── PLAN CONFIRMATION MARKETS ───────────────────────────────────────── */}
      <section id="plan-confirmation" className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <Badge className="mb-3 bg-primary/10 text-primary border-primary/20 text-xs">Case Outcome Intelligence</Badge>
          <h2 className="text-xl font-bold text-foreground">Likelihood of Plan Confirmation</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Plan confirmation is the single event that determines whether creditors get paid on the proposed terms — or fight on. These markets price the probability that the debtor's proposed reorganization plan will be confirmed by the court.
          </p>
        </div>
        <div className="space-y-3">
          {[
            {
              name: "Spirit Airlines",
              caseId: "spirit",
              court: "S.D.N.Y.",
              prob: 41,
              trend: "down",
              planSummary: "Proposed plan offers unsecured creditors ~8¢ on the dollar; labor and lessor objections pending. Confirmation contested.",
              creditorImpact: "Unsecured bondholders at risk of cram-down if plan fails; conversion to Ch. 7 would wipe out remaining value.",
            },
            {
              name: "Rite Aid",
              caseId: "rite-aid",
              court: "D.N.J.",
              prob: 58,
              trend: "up",
              planSummary: "Store-closure plan with going-concern sale component; opioid litigation settlement a key gating item for confirmation.",
              creditorImpact: "Secured lenders largely unimpaired; unsecured trade creditors face ~30–40% haircut depending on settlement size.",
            },
            {
              name: "Steward Health Care",
              caseId: "steward",
              court: "S.D. Tex.",
              prob: 34,
              trend: "down",
              planSummary: "Hospital system liquidation plan; state regulators seeking operational continuity commitments as confirmation condition.",
              creditorImpact: "Physician and vendor unsecured claims face near-total impairment; secured lenders recovery highly uncertain.",
            },
            {
              name: "Red Lobster",
              caseId: "redlobster",
              court: "M.D. Fla.",
              prob: 67,
              trend: "up",
              planSummary: "Going-concern sale to new ownership group; plan premised on successful operational turnaround and lease renegotiation.",
              creditorImpact: "Trade vendors and gift card holders moderately impaired; new equity sponsor absorbs most restructuring risk.",
            },
          ].map((c) => {
            const probColor = c.prob >= 65 ? "text-green-600 dark:text-green-400" : c.prob >= 45 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400";
            const barColor = c.prob >= 65 ? "bg-green-500" : c.prob >= 45 ? "bg-yellow-500" : "bg-red-500";
            return (
              <div key={c.name} className="bg-card border border-border rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <p className="font-semibold text-sm text-foreground">{c.name}</p>
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">{c.court}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-1">
                      <strong className="text-foreground/80">Plan:</strong> {c.planSummary}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <strong className="text-foreground/80">Creditor impact:</strong> {c.creditorImpact}
                    </p>
                  </div>
                  <div className="sm:w-52 shrink-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Confirmation probability</span>
                      <span className={`text-sm font-bold font-mono ${probColor}`}>{c.prob}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${c.prob}%` }} />
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs text-muted-foreground">Trend</span>
                      <span className={`text-xs font-medium ${
                        c.trend === "up" ? "text-green-500" : c.trend === "down" ? "text-red-500" : "text-muted-foreground"
                      }`}>
                        {c.trend === "up" ? "▲ Improving" : c.trend === "down" ? "▼ Deteriorating" : "— Stable"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="text-xs text-muted-foreground"><strong className="text-foreground">Note:</strong> Illustrative demo markets only. Not legal or investment advice. No real money accepted.</p>
        </div>
      </section>

      {/* ── CH. 7 CONVERSION MARKETS ──────────────────────────────────────────── */}
      <section id="ch7-conversion" className="bg-muted/40 dark:bg-muted/10 border-y border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <div className="mb-8">
            <Badge className="mb-3 bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 text-xs">Liquidation Risk</Badge>
            <h2 className="text-xl font-bold text-foreground">Likelihood of Conversion to Chapter 7</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              When a Chapter 11 reorganization collapses — plan fails, DIP financing exhausted, or trustee appointed — the case converts to Chapter 7 and a liquidating trustee takes over. For most creditors, conversion means near-total loss. These markets price that risk.
            </p>
          </div>

          {/* Explainer for private credit */}
          <div className="bg-secondary text-secondary-foreground rounded-xl p-5 mb-8">
            <h3 className="font-semibold text-sm mb-3">Why private credit lenders watch conversion risk</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-secondary-foreground/80">
              {[
                { icon: "⚠", title: "DIP lender exposure", body: "DIP loans are super-priority but asset liquidation value in Ch. 7 is typically 20–40% of Ch. 11 going-concern value. Conversion erodes collateral fast." },
                { icon: "📉", title: "Unsecured cliff", body: "In Ch. 7, unsecured creditors often recover zero after administrative expenses consume the estate. Conversion is effectively a write-off for sub-debt holders." },
                { icon: "⏱", title: "Time value", body: "Ch. 7 distributions take 2–5 years. Even secured lenders face extended hold periods and uncertain recovery timing vs. a confirmed Ch. 11 plan." },
              ].map((s) => (
                <div key={s.title} className="flex gap-3">
                  <span className="text-lg shrink-0">{s.icon}</span>
                  <div>
                    <p className="font-semibold text-secondary-foreground mb-1">{s.title}</p>
                    <p className="leading-relaxed">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <h3 className="font-semibold text-foreground mb-4 text-sm">Example Ch. 7 Conversion Probability Markets</h3>
          <div className="space-y-3">
            {[
              {
                name: "Spirit Airlines",
                court: "S.D.N.Y.",
                prob: 52,
                trend: "up",
                trigger: "Plan confirmation objections, DIP maturity approaching, no qualified stalking horse bidder",
                ch7Impact: "Fleet and route network liquidated piecemeal; estimated unsecured recovery drops from 8¢ to near zero. Gate leases returned to airports.",
              },
              {
                name: "Steward Health Care",
                court: "S.D. Tex.",
                prob: 71,
                trend: "up",
                trigger: "Failed hospital sale process, state regulatory intervention, operating cash burn rate accelerating",
                ch7Impact: "Hospital licenses cannot be sold in Ch. 7; real property and medical equipment only. Unsecured creditors face total impairment.",
              },
              {
                name: "Rite Aid",
                court: "D.N.J.",
                prob: 29,
                trend: "down",
                trigger: "Opioid settlement breakdown or inability to fund plan distributions",
                ch7Impact: "Pharmacy licenses have value; Ch. 7 trustee could liquidate prescription files. Secured recovery likely near par; unsecured severely impaired.",
              },
              {
                name: "Red Lobster",
                court: "M.D. Fla.",
                prob: 18,
                trend: "down",
                trigger: "New ownership fails to close, lease rejections exceed threshold, brand value impaired",
                ch7Impact: "Restaurant equipment, IP, and gift card liabilities. Conversion would likely yield 5–10¢ for unsecured vs. current plan value.",
              },
              {
                name: "Enviva Partners",
                court: "E.D. Va.",
                prob: 44,
                trend: "up",
                trigger: "Long-term offtake contract terminations, European biomass regulation tightening, financing gap",
                ch7Impact: "Wood pellet facilities have limited buyer pool outside industry. Liquidation value well below secured debt face amount.",
              },
            ].map((c) => {
              const probColor = c.prob >= 60 ? "text-red-600 dark:text-red-400" : c.prob >= 35 ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400";
              const barColor = c.prob >= 60 ? "bg-red-500" : c.prob >= 35 ? "bg-yellow-500" : "bg-green-500";
              return (
                <div key={c.name} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <p className="font-semibold text-sm text-foreground">{c.name}</p>
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">{c.court}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-1">
                        <strong className="text-foreground/80">Conversion trigger:</strong> {c.trigger}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        <strong className="text-foreground/80">Ch. 7 creditor impact:</strong> {c.ch7Impact}
                      </p>
                    </div>
                    <div className="sm:w-52 shrink-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Conversion probability</span>
                        <span className={`text-sm font-bold font-mono ${probColor}`}>{c.prob}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${c.prob}%` }} />
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs text-muted-foreground">Trend</span>
                        <span className={`text-xs font-medium ${
                          c.trend === "up" ? "text-red-500" : c.trend === "down" ? "text-green-500" : "text-muted-foreground"
                        }`}>
                          {c.trend === "up" ? "▲ Risk Rising" : "▼ Risk Falling"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
            <p className="text-xs text-muted-foreground"><strong className="text-foreground">Note:</strong> Illustrative demo markets only. Not legal or investment advice. No real money accepted. CFTC approval pending.</p>
          </div>
        </div>
      </section>

      {/* ── REGULATORY ────────────────────────────────────────────────────────── */}
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
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    s.status === "active"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}>
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

      {/* ── SIGNUP CTA ────────────────────────────────────────────────────────── */}
      {!user && (
        <section id="signup" className="bg-secondary text-secondary-foreground">
          <div className="max-w-xl mx-auto px-4 sm:px-6 py-12 text-center">
            <h2 className="text-xl font-bold mb-2">Join the Waitlist</h2>
            <p className="text-sm text-secondary-foreground/70 mb-6">
              Get early access when live trading opens. No spam, ever.
            </p>
            <SignupForm />
          </div>
        </section>
      )}

      {/* ── FOUNDER ───────────────────────────────────────────────────────────── */}
      <section id="founder" className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold text-foreground mb-3 text-sm text-muted-foreground uppercase tracking-wide">Founder</h2>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
              <span className="text-primary font-bold text-sm">RJ</span>
            </div>
            <div>
              <p className="font-semibold text-foreground">Roland Gary Jones</p>
              <p className="text-sm text-muted-foreground">Jones &amp; Associates · 1325 Avenue of the Americas, 28th Floor, New York, NY 10019</p>
              <a
                href="https://rolandjones.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline mt-1 inline-block"
              >
                rolandjones.com
              </a>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-lg">
                Roland Gary Jones is a bankruptcy attorney based in New York City with over 25 years of experience in bankruptcy litigation. He has represented debtors, creditors' committees, trustees, and secured lenders in complex Chapter 11 cases across a broad range of industries. BankruptcyBet draws directly on that courtroom and restructuring expertise to build the first predictive market for corporate bankruptcy outcomes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-muted/30 dark:bg-muted/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>
            <span className="font-semibold text-foreground">BankruptcyBet LLC</span> · Delaware · © {new Date().getFullYear()}
          </div>
          <div className="text-center">
            Demo platform only. No real money accepted. CFTC approval pending. Not legal or investment advice.
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-foreground transition-colors">Log In</Link>
            <Link href="/register" className="hover:text-foreground transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/signups", { name, email, role });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "You're on the list!", description: "We'll reach out when live trading opens." });
      setName(""); setEmail(""); setRole("");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
      className="flex flex-col gap-3 max-w-sm mx-auto"
    >
      <Input
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="bg-secondary-foreground/10 border-secondary-foreground/20 text-secondary-foreground placeholder:text-secondary-foreground/40"
        data-testid="signup-input-name"
      />
      <Input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="bg-secondary-foreground/10 border-secondary-foreground/20 text-secondary-foreground placeholder:text-secondary-foreground/40"
        data-testid="signup-input-email"
      />
      <Input
        placeholder="Your role (e.g., credit analyst, attorney)"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="bg-secondary-foreground/10 border-secondary-foreground/20 text-secondary-foreground placeholder:text-secondary-foreground/40"
        data-testid="signup-input-role"
      />
      <Button
        type="submit"
        className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
        disabled={mutation.isPending}
        data-testid="signup-submit"
      >
        {mutation.isPending ? "Submitting…" : "Join Waitlist"}
      </Button>
    </form>
  );
}
