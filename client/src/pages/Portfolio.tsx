import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import Ticker from "@/components/Ticker";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import type { Trade } from "@shared/schema";

type TradeEnriched = Trade & { marketName: string; caseId: string };

export default function Portfolio() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const { data: trades, isLoading: tradesLoading } = useQuery<TradeEnriched[]>({
    queryKey: ["/api/trades"],
    enabled: !!user,
  });

  if (!user) {
    navigate("/login");
    return null;
  }

  const openTrades = trades?.filter((t) => t.status === "open") ?? [];
  const settledTrades = trades?.filter((t) => t.status === "settled") ?? [];
  const totalWagered = openTrades.reduce((s, t) => s + t.wager, 0);
  const totalPotential = openTrades.reduce((s, t) => s + t.potentialPayout, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Ticker />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl font-bold text-foreground">My Portfolio</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Your open and settled positions</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Available:</span>
            <span className="font-mono font-bold text-primary text-lg" data-testid="portfolio-balance">
              BB${user.bbBalance.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Summary cards */}
        {!tradesLoading && openTrades.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Card className="border-border bg-card">
              <CardContent className="pt-4 pb-3 px-4">
                <p className="text-xs text-muted-foreground">Open Positions</p>
                <p className="text-xl font-bold text-foreground mt-0.5" data-testid="stat-open-positions">{openTrades.length}</p>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="pt-4 pb-3 px-4">
                <p className="text-xs text-muted-foreground">Total Wagered</p>
                <p className="text-xl font-bold text-primary font-mono mt-0.5">BB${totalWagered.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="pt-4 pb-3 px-4">
                <p className="text-xs text-muted-foreground">Potential Return</p>
                <p className="text-xl font-bold text-green-600 font-mono mt-0.5">BB${totalPotential.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Open positions */}
        <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          Open Positions
          {openTrades.length > 0 && (
            <Badge variant="secondary" className="text-xs">{openTrades.length}</Badge>
          )}
        </h2>

        {tradesLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
          </div>
        ) : openTrades.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground text-sm">No open positions yet.</p>
              <Link href="/dashboard">
                <Button className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90 text-sm" data-testid="btn-go-trade">
                  Browse Markets <ArrowRight size={14} className="ml-1.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {openTrades.map((t) => (
              <TradeRow key={t.id} trade={t} />
            ))}
          </div>
        )}

        {/* Settled positions */}
        {settledTrades.length > 0 && (
          <div className="mt-8">
            <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              Settled Positions
              <Badge variant="outline" className="text-xs">{settledTrades.length}</Badge>
            </h2>
            <div className="space-y-3">
              {settledTrades.map((t) => (
                <TradeRow key={t.id} trade={t} settled />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TradeRow({ trade, settled }: { trade: TradeEnriched; settled?: boolean }) {
  const isLong = trade.direction === "long" || trade.direction === "yes";
  const date = new Date(trade.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <Card className={`border-border bg-card ${settled ? "opacity-70" : ""}`} data-testid={`trade-row-${trade.id}`}>
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-1.5 rounded-full ${isLong ? "bg-green-500/15" : "bg-red-500/15"}`}>
              {isLong
                ? <TrendingUp size={14} className="text-green-600" />
                : <TrendingDown size={14} className="text-red-600" />}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm text-foreground truncate">{trade.marketName}</p>
              <p className="text-xs text-muted-foreground">
                {isLong ? "Long" : "Short"} · Entry {trade.entryPrice.toFixed(1)}¢ → Target {trade.targetPrice.toFixed(1)}¢
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-mono font-bold text-primary">BB${trade.wager.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">
              Payout: <span className="text-green-600 font-medium">BB${trade.potentialPayout.toLocaleString()}</span>
            </p>
          </div>
          <div className="w-full flex items-center justify-between border-t border-border/40 pt-2 mt-0.5">
            <span className="text-xs text-muted-foreground">{date}</span>
            <Badge
              variant={settled ? "secondary" : "default"}
              className={`text-xs ${settled ? "" : "bg-primary/15 text-primary border-primary/20"}`}
            >
              {settled ? "SETTLED" : "OPEN"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
