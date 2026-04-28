import { useQuery } from "@tanstack/react-query";
import type { Market } from "@shared/schema";

function TickerItem({ market }: { market: Market & { priceHistory: number[] } }) {
  const change = market.priceHistory.length >= 2
    ? market.currentPrice - market.priceHistory[market.priceHistory.length - 2]
    : 0;
  const isUp = change >= 0;
  const pct = ((change / (market.priceHistory[market.priceHistory.length - 2] || market.currentPrice)) * 100);

  return (
    <span className="inline-flex items-center gap-2 px-5 border-r border-border/30 text-sm">
      <span className="font-semibold text-foreground">{market.name.toUpperCase()}</span>
      <span className="text-primary font-mono font-bold">{market.currentPrice.toFixed(1)}¢</span>
      <span className={isUp ? "text-green-500" : "text-red-500"}>
        {isUp ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}%
      </span>
      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
        market.status === "active"
          ? "bg-green-500/15 text-green-600 dark:text-green-400"
          : "bg-muted text-muted-foreground"
      }`}>
        {market.status === "active" ? "LIVE" : "SETTLED"}
      </span>
    </span>
  );
}

export default function Ticker() {
  const { data: markets } = useQuery<(Market & { priceHistory: number[] })[]>({
    queryKey: ["/api/markets"],
  });

  if (!markets || markets.length === 0) {
    return (
      <div className="w-full overflow-hidden bg-secondary text-secondary-foreground py-2 px-4 text-sm">
        Loading markets…
      </div>
    );
  }

  // Double the array so the scroll loops seamlessly
  const doubled = [...markets, ...markets];

  return (
    <div className="w-full overflow-hidden bg-secondary/90 dark:bg-secondary/80 border-b border-border/20 py-2">
      <div className="ticker-inner">
        {doubled.map((m, i) => (
          <TickerItem key={`${m.caseId}-${i}`} market={m} />
        ))}
      </div>
    </div>
  );
}
