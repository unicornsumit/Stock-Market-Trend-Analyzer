import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { StockAnalysis, CurrencyCode } from "@/lib/stock-utils";
import { formatCurrency, formatNumber } from "@/lib/stock-utils";

interface AnalysisPanelProps {
  analysis: StockAnalysis;
  currentPrice: number;
  name: string;
  dateRange: { start: string; end: string };
  currency: CurrencyCode;
}

export function AnalysisPanel({ analysis, currentPrice, name, dateRange, currency }: AnalysisPanelProps) {
  const trendColor =
    analysis.trend === "Uptrend"
      ? "bg-stock-up/15 text-stock-up border-stock-up/30"
      : analysis.trend === "Downtrend"
        ? "bg-stock-down/15 text-stock-down border-stock-down/30"
        : "bg-stock-neutral/15 text-stock-neutral border-stock-neutral/30";

  const volatilityColor =
    analysis.volatility === "Low"
      ? "bg-stock-up/15 text-stock-up border-stock-up/30"
      : analysis.volatility === "High"
        ? "bg-stock-down/15 text-stock-down border-stock-down/30"
        : "bg-stock-neutral/15 text-stock-neutral border-stock-neutral/30";

  const changeColor = analysis.priceChange >= 0 ? "text-stock-up" : "text-stock-down";

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stock info */}
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{name}</p>
            <p className="text-2xl font-bold font-mono">{formatCurrency(currentPrice, currency)}</p>
          </div>
          <div className="text-right">
            <span className={`text-lg font-mono font-semibold ${changeColor}`}>
              {analysis.priceChange >= 0 ? "+" : ""}
              {formatCurrency(analysis.priceChange, currency)}
            </span>
            <p className={`text-sm font-mono ${changeColor}`}>
              ({analysis.priceChangePercent >= 0 ? "+" : ""}
              {analysis.priceChangePercent.toFixed(2)}%)
            </p>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          {dateRange.start} → {dateRange.end}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-surface p-3">
            <p className="text-xs text-muted-foreground mb-1">Trend</p>
            <Badge className={`${trendColor} border`} variant="outline">
              {analysis.trend === "Uptrend" && "↗ "}
              {analysis.trend === "Downtrend" && "↘ "}
              {analysis.trend === "Sideways" && "→ "}
              {analysis.trend}
            </Badge>
          </div>
          <div className="rounded-lg bg-surface p-3">
            <p className="text-xs text-muted-foreground mb-1">Volatility</p>
            <Badge className={`${volatilityColor} border`} variant="outline">
              {analysis.volatility}
            </Badge>
          </div>
          <div className="rounded-lg bg-surface p-3">
            <p className="text-xs text-muted-foreground mb-1">Daily Return</p>
            <p className={`text-sm font-mono font-semibold ${analysis.dailyReturnPercent >= 0 ? "text-stock-up" : "text-stock-down"}`}>
              {analysis.dailyReturnPercent >= 0 ? "+" : ""}
              {analysis.dailyReturnPercent.toFixed(2)}%
            </p>
          </div>
          <div className="rounded-lg bg-surface p-3">
            <p className="text-xs text-muted-foreground mb-1">Avg Volume</p>
            <p className="text-sm font-mono font-semibold text-surface-foreground">
              {formatNumber(analysis.avgVolume)}
            </p>
          </div>
          <div className="rounded-lg bg-surface p-3">
            <p className="text-xs text-muted-foreground mb-1">52W High</p>
            <p className="text-sm font-mono font-semibold text-stock-up">
              {formatCurrency(analysis.highPrice, currency)}
            </p>
          </div>
          <div className="rounded-lg bg-surface p-3">
            <p className="text-xs text-muted-foreground mb-1">52W Low</p>
            <p className="text-sm font-mono font-semibold text-stock-down">
              {formatCurrency(analysis.lowPrice, currency)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
