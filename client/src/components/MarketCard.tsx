import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Sparkline from "@/components/Sparkline";
import type { Market } from "@shared/schema";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MarketCardProps {
  market: Market & { priceHistory: number[] };
  onClick?: () => void;
  readonly?: boolean;
}

export default function MarketCard({ market, onClick, readonly = false }: MarketCardProps) {
  const isActive = market.status === "active";
  const signalIcon =
    market.signal === "up" ? <TrendingUp size={14} className="text-green-500" /> :
    market.signal === "down" ? <TrendingDown size={14} className="text-red-500" /> :
    <Minus size={14} className="text-muted-foreground" />;

  return (
    <Card
      className={`market-card border border-border bg-card ${readonly ? "" : "cursor-pointer hover:border-primary/50"}`}
      onClick={readonly ? undefined : onClick}
      data-testid={`market-card-${market.caseId}`}
    >
      <CardContent className="p-4 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm leading-tight truncate">{market.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{market.court}</p>
          </div>
          <Badge
            variant={isActive ? "default" : "secondary"}
            className={`shrink-0 text-xs ${
              isActive
                ? "bg-primary/15 text-primary border-primary/20 hover:bg-primary/20"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {isActive ? (
              <><span className="pulse-dot mr-1 inline-block w-1.5 h-1.5 rounded-full bg-primary" />ACTIVE</>
            ) : "SETTLED"}
          </Badge>
        </div>

        {/* Price row */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-primary font-mono">{market.currentPrice.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">¢</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              {signalIcon}
              <span>52w: {market.low52.toFixed(0)}–{market.high52.toFixed(0)}¢</span>
            </div>
          </div>
          <Sparkline data={market.priceHistory} width={80} height={36} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-2">
          <span>{market.industry}</span>
          <span>Vol: {market.volume.toLocaleString()}</span>
        </div>

        {!readonly && isActive && (
          <div className="text-xs text-center text-primary font-medium py-1 rounded bg-primary/8 dark:bg-primary/10">
            Click to Trade
          </div>
        )}
      </CardContent>
    </Card>
  );
}
