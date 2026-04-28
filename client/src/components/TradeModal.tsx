import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import type { Market } from "@shared/schema";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TradeModalProps {
  market: (Market & { priceHistory: number[] }) | null;
  bbBalance: number;
  onClose: () => void;
}

export default function TradeModal({ market, bbBalance, onClose }: TradeModalProps) {
  const [direction, setDirection] = useState<"long" | "short">("long");
  const [targetPrice, setTargetPrice] = useState("");
  const [wager, setWager] = useState("1000");
  const { toast } = useToast();
  const { updateUser } = useAuth();
  const qc = useQueryClient();

  const entry = market?.currentPrice ?? 0;
  const target = parseFloat(targetPrice) || 0;
  const wagerNum = parseFloat(wager) || 0;
  const diff = Math.abs(target - entry);
  const potentialPayout = target > 0 && wagerNum > 0
    ? Math.round(wagerNum * Math.max(1.5, 1 + (diff / (entry || 1)) * 3))
    : 0;

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/trades", {
        marketId: market!.id,
        direction,
        targetPrice: target,
        wager: wagerNum,
        entryPrice: entry,
      });
      return res.json();
    },
    onSuccess: (data) => {
      // Update auth context so Navbar balance refreshes immediately
      if (data.user) updateUser(data.user);
      qc.invalidateQueries({ queryKey: ["/api/trades"] });
      toast({
        title: "Trade placed!",
        description: `BB$${wagerNum.toLocaleString()} wagered on ${market?.name}. Potential payout: BB$${potentialPayout.toLocaleString()}`,
      });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "Trade failed", description: err.message, variant: "destructive" });
    },
  });

  if (!market) return null;

  const isDisabled = !target || target <= 0 || target > 100 || wagerNum < 100 || wagerNum > bbBalance || mutation.isPending;

  return (
    <Dialog open={!!market} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md bg-card border-border" data-testid="trade-modal">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">
            Trade: {market.name}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Entry price: <span className="text-primary font-mono font-bold">{entry.toFixed(1)}¢</span> &nbsp;·&nbsp; Your balance: <span className="font-semibold text-foreground">BB${bbBalance.toLocaleString()}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Direction */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Position</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={direction === "long" ? "default" : "outline"}
                className={direction === "long" ? "bg-green-600 hover:bg-green-700 text-white border-0" : "border-border text-foreground"}
                onClick={() => setDirection("long")}
                data-testid="btn-direction-long"
              >
                <TrendingUp size={14} className="mr-1.5" /> Long (Price Rises)
              </Button>
              <Button
                type="button"
                variant={direction === "short" ? "default" : "outline"}
                className={direction === "short" ? "bg-red-600 hover:bg-red-700 text-white border-0" : "border-border text-foreground"}
                onClick={() => setDirection("short")}
                data-testid="btn-direction-short"
              >
                <TrendingDown size={14} className="mr-1.5" /> Short (Price Falls)
              </Button>
            </div>
          </div>

          {/* Target price */}
          <div>
            <Label htmlFor="targetPrice" className="text-xs text-muted-foreground">
              Target Recovery Price (¢, 0–100)
            </Label>
            <Input
              id="targetPrice"
              type="number"
              min={0}
              max={100}
              step={0.5}
              placeholder={`e.g. ${direction === "long" ? (entry + 5).toFixed(0) : Math.max(1, entry - 3).toFixed(0)}`}
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className="mt-1 bg-background border-input"
              data-testid="input-target-price"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {direction === "long" ? "Set a price ABOVE the entry to predict a recovery." : "Set a price BELOW entry to predict further decline."}
            </p>
          </div>

          {/* Wager */}
          <div>
            <Label htmlFor="wager" className="text-xs text-muted-foreground">
              Wager (BB$ 100 – {Math.min(50000, bbBalance).toLocaleString()})
            </Label>
            <Input
              id="wager"
              type="number"
              min={100}
              max={Math.min(50000, bbBalance)}
              step={100}
              value={wager}
              onChange={(e) => setWager(e.target.value)}
              className="mt-1 bg-background border-input"
              data-testid="input-wager"
            />
            <div className="flex gap-2 mt-2">
              {[500, 1000, 5000, 10000].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setWager(String(v))}
                  className="text-xs px-2 py-1 rounded border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  data-testid={`btn-wager-${v}`}
                >
                  {v >= 1000 ? `${v / 1000}K` : v}
                </button>
              ))}
            </div>
          </div>

          {/* Payout preview */}
          {potentialPayout > 0 && (
            <div className="rounded-lg bg-primary/8 dark:bg-primary/10 border border-primary/20 p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Potential payout</span>
                <span className="text-lg font-bold text-primary font-mono">BB${potentialPayout.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-muted-foreground">Multiplier</span>
                <span className="text-xs font-medium text-foreground">
                  {(potentialPayout / (wagerNum || 1)).toFixed(2)}×
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">Demo only — no real money. CFTC approval pending.</p>
            </div>
          )}

          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            onClick={() => mutation.mutate()}
            disabled={isDisabled}
            data-testid="btn-place-trade"
          >
            {mutation.isPending ? "Placing…" : "Place Trade"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
