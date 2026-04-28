import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import Ticker from "@/components/Ticker";
import MarketCard from "@/components/MarketCard";
import TradeModal from "@/components/TradeModal";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { Market } from "@shared/schema";

type MarketWithHistory = Market & { priceHistory: number[] };

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [selectedMarket, setSelectedMarket] = useState<MarketWithHistory | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("all");

  const { data: markets, isLoading: marketsLoading } = useQuery<MarketWithHistory[]>({
    queryKey: ["/api/markets"],
  });

  // Redirect if not logged in
  if (!user) {
    navigate("/login");
    return null;
  }

  const filtered = markets?.filter((m) =>
    filter === "all" ? true : m.status === filter
  ) ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Ticker />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl font-bold text-foreground">Bankruptcy Markets</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Trade recovery prices on active bankruptcy cases. Demo only — no real money.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm text-muted-foreground">Balance:</span>
            <span className="font-mono font-bold text-primary text-lg" data-testid="dashboard-balance">
              BB${user.bbBalance.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5">
          {(["all", "active", "resolved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                filter === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
              }`}
              data-testid={`filter-${f}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === "active" && markets && (
                <span className="ml-1">({markets.filter((m) => m.status === "active").length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Markets grid */}
        {marketsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg font-medium">No markets found</p>
            <p className="text-sm mt-1">Try changing the filter above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((m) => (
              <MarketCard
                key={m.caseId}
                market={m}
                onClick={() => m.status === "active" && setSelectedMarket(m)}
                readonly={m.status !== "active"}
              />
            ))}
          </div>
        )}

        {/* How to trade */}
        <div className="mt-10 rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold text-foreground mb-2">How to trade</h2>
          <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
            <li>Click any <Badge variant="outline" className="text-xs mx-1">ACTIVE</Badge> market card</li>
            <li>Choose a direction: <strong className="text-green-600">Long</strong> (price rises) or <strong className="text-red-600">Short</strong> (price falls)</li>
            <li>Enter your target recovery price in cents (0–100¢)</li>
            <li>Set your wager in BB$ (demo credits — no real money)</li>
            <li>Review your potential payout and place the trade</li>
          </ol>
        </div>
      </div>

      {selectedMarket && (
        <TradeModal
          market={selectedMarket}
          bbBalance={user.bbBalance}
          onClose={() => setSelectedMarket(null)}
        />
      )}
    </div>
  );
}
