import { useState } from "react";
import type { CurrencyCode } from "@/lib/stock-utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const POPULAR_STOCKS = [
  { symbol: "AAPL", name: "Apple" },
  { symbol: "GOOGL", name: "Alphabet" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "NVDA", name: "NVIDIA" },
];

const INDIA_COMMODITIES = [
  { symbol: "GC=F", name: "🪙 Gold", defaultCurrency: "INR" as CurrencyCode },
  { symbol: "SI=F", name: "🥈 Silver", defaultCurrency: "INR" as CurrencyCode },
];

const CRYPTO = [
  { symbol: "BTC-USD", name: "₿ Bitcoin" },
];

const INDIAN_STOCKS = [
  { symbol: "^NSEI", name: "NIFTY 50" },
  { symbol: "^BSESN", name: "SENSEX" },
  { symbol: "RELIANCE.NS", name: "Reliance" },
  { symbol: "TCS.NS", name: "TCS" },
  { symbol: "INFY.NS", name: "Infosys" },
];

interface StockInputPanelProps {
  onSubmit: (symbol: string, range: "6mo" | "1y", currency: CurrencyCode) => void;
  loading: boolean;
  onCurrencyChange?: (currency: CurrencyCode) => void;
}

export function StockInputPanel({ onSubmit, loading, onCurrencyChange }: StockInputPanelProps) {
  const [ticker, setTicker] = useState("");
  const [range, setRange] = useState<"6mo" | "1y">("1y");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticker.trim()) {
      onSubmit(ticker.trim().toUpperCase(), range, currency);
    }
  };

  const handleQuickPick = (symbol: string, overrideCurrency?: CurrencyCode) => {
    const cur = overrideCurrency ?? currency;
    if (overrideCurrency) setCurrency(overrideCurrency);
    setTicker(symbol);
    onSubmit(symbol, range, cur);
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          Search Stock
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-2">
          <Input
            placeholder="Enter ticker (e.g., AAPL)"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            className="font-mono bg-input/50"
          />
          <Select value={range} onValueChange={(v) => setRange(v as "6mo" | "1y")}>
            <SelectTrigger className="w-24 bg-input/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6mo">6 Months</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={currency} onValueChange={(v) => { const c = v as CurrencyCode; setCurrency(c); onCurrencyChange?.(c); }}>
            <SelectTrigger className="w-20 bg-input/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">$ USD</SelectItem>
              <SelectItem value="EUR">€ EUR</SelectItem>
              <SelectItem value="INR">₹ INR</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" disabled={loading || !ticker.trim()}>
            {loading ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              "Analyze"
            )}
          </Button>
        </form>

        <div>
          <p className="text-xs text-muted-foreground mb-2">Popular stocks</p>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_STOCKS.map((stock) => (
              <button
                key={stock.symbol}
                onClick={() => handleQuickPick(stock.symbol)}
                disabled={loading}
                className="rounded-md bg-secondary px-2.5 py-1 text-xs font-mono text-secondary-foreground hover:bg-accent transition-colors disabled:opacity-50"
              >
                {stock.symbol}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">🇮🇳 Gold · Silver (India ₹)</p>
          <div className="flex flex-wrap gap-1.5">
            {INDIA_COMMODITIES.map((item) => (
              <button
                key={item.symbol}
                onClick={() => handleQuickPick(item.symbol, item.defaultCurrency)}
                disabled={loading}
                className="rounded-md bg-yellow-500/15 px-2.5 py-1 text-xs font-mono text-yellow-400 hover:bg-yellow-500/25 transition-colors disabled:opacity-50"
              >
                {item.name}
              </button>
            ))}
            {CRYPTO.map((item) => (
              <button
                key={item.symbol}
                onClick={() => handleQuickPick(item.symbol)}
                disabled={loading}
                className="rounded-md bg-primary/15 px-2.5 py-1 text-xs font-mono text-primary hover:bg-primary/25 transition-colors disabled:opacity-50"
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">🇮🇳 Indian Market</p>
          <div className="flex flex-wrap gap-1.5">
            {INDIAN_STOCKS.map((stock) => (
              <button
                key={stock.symbol}
                onClick={() => handleQuickPick(stock.symbol, "INR")}
                disabled={loading}
                className="rounded-md bg-orange-500/15 px-2.5 py-1 text-xs font-mono text-orange-400 hover:bg-orange-500/25 transition-colors disabled:opacity-50"
              >
                {stock.name}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
