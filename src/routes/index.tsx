import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { StockInputPanel } from "@/components/StockInputPanel";
import { StockChart } from "@/components/StockChart";
import { AnalysisPanel } from "@/components/AnalysisPanel";
import { ForecastPanel } from "@/components/ForecastPanel";
import { InvestmentInsightsPanel } from "@/components/InvestmentInsightsPanel";
import { fetchStockData, type StockFetchResult } from "@/lib/fetch-stock";
import {
  calculateMovingAverages,
  analyzeStock,
  generateForecast,
  generateInvestmentInsight,
  type StockDataPoint,
  type StockAnalysis,
  type ForecastPoint,
  type InvestmentInsight,
  type CurrencyCode,
} from "@/lib/stock-utils";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Stock Market Trend Analyzer" },
      { name: "description", content: "Analyze stock trends with charts, moving averages, investment signals, and simple forecasting." },
    ],
  }),
});

interface StockState {
  result: StockFetchResult;
  dataWithMA: StockDataPoint[];
  analysis: StockAnalysis;
  forecast: ForecastPoint[];
  insight: InvestmentInsight;
}

function Index() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stock, setStock] = useState<StockState | null>(null);
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const lastReqRef = useRef<{ symbol: string; range: "6mo" | "1y"; cur: CurrencyCode } | null>(null);

  const handleSubmit = async (symbol: string, range: "6mo" | "1y", cur: CurrencyCode, silent = false) => {
    setCurrency(cur);
    lastReqRef.current = { symbol, range, cur };
    if (!silent) setLoading(true);
    setError(null);

    try {
      const raw = await fetchStockData({ data: { symbol, range } });

      // Gold (GC=F) is quoted per troy ounce in USD. Convert to per 10g for Indian market norm.
      const GOLD_OZ_TO_10G = 1 / 3.110348; // 1 troy oz = 31.10348 g
      const scale = symbol === "GC=F" ? GOLD_OZ_TO_10G : 1;
      const result = scale === 1
        ? raw
        : {
            ...raw,
            currentPrice: raw.currentPrice * scale,
            data: raw.data.map((d) => ({
              ...d,
              open: d.open * scale,
              high: d.high * scale,
              low: d.low * scale,
              close: d.close * scale,
            })),
          };

      const dataWithMA = calculateMovingAverages(result.data);
      const analysis = analyzeStock(result.data);
      const forecast = generateForecast(result.data, 5);
      const insight = generateInvestmentInsight(result.data, analysis);

      setStock({ result, dataWithMA, analysis, forecast, insight });
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch stock data.");
      if (!silent) setStock(null);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Auto-refresh live price every 30 seconds
  useEffect(() => {
    if (!autoRefresh || !stock) return;
    const id = setInterval(() => {
      const r = lastReqRef.current;
      if (r) handleSubmit(r.symbol, r.range, r.cur, true);
    }, 30000);
    return () => clearInterval(id);
  }, [autoRefresh, stock]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center gap-3">
          <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/15">
            <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold tracking-tight">Stock Market Trend Analyzer</h1>
            <p className="text-xs text-muted-foreground">Historical trends · Moving averages · Investment signals · Simple forecasting</p>
          </div>
          {stock && (
            <div className="flex items-center gap-3 text-xs">
              <button
                onClick={() => setAutoRefresh((v) => !v)}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 border transition-colors ${
                  autoRefresh
                    ? "bg-stock-up/10 border-stock-up/30 text-stock-up"
                    : "bg-muted border-border text-muted-foreground"
                }`}
                title="Toggle auto-refresh (30s)"
              >
                <span className={`h-2 w-2 rounded-full ${autoRefresh ? "bg-stock-up animate-pulse" : "bg-muted-foreground"}`} />
                {autoRefresh ? "LIVE" : "PAUSED"}
              </button>
              {lastUpdated && (
                <span className="text-muted-foreground hidden sm:inline">
                  Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        {/* Input Panel */}
        <StockInputPanel onSubmit={handleSubmit} loading={loading} onCurrencyChange={setCurrency} />

        {/* Error */}
        {error && (
          <div className="animate-slide-up rounded-lg border border-stock-down/30 bg-stock-down/10 p-4 text-sm text-stock-down">
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 h-[480px] rounded-xl bg-card animate-pulse" />
              <div className="space-y-4">
                <div className="h-[300px] rounded-xl bg-card animate-pulse" />
                <div className="h-[250px] rounded-xl bg-card animate-pulse" />
              </div>
            </div>
            <div className="h-[400px] rounded-xl bg-card animate-pulse" />
          </div>
        )}

        {/* Results */}
        {stock && !loading && (
          <div className="animate-slide-up space-y-6">
            {/* Chart + Analysis Row */}
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <StockChart
                  data={stock.dataWithMA}
                  forecast={stock.forecast}
                  symbol={stock.result.symbol}
                  currency={currency}
                />
                {stock.result.symbol === "GC=F" && (
                  <p className="mt-2 text-xs text-yellow-400/80 text-center">
                    🪙 Gold prices shown per 10 grams (Indian standard)
                  </p>
                )}
              </div>
              <div className="space-y-4">
                <AnalysisPanel
                  analysis={stock.analysis}
                  currentPrice={stock.result.currentPrice}
                  name={stock.result.name}
                  dateRange={stock.result.dateRange}
                  currency={currency}
                />
                <ForecastPanel
                  forecast={stock.forecast}
                  lastClose={stock.result.data[stock.result.data.length - 1].close}
                  currency={currency}
                />
              </div>
            </div>

            {/* Investment Insights Row */}
            <div className="grid gap-6 lg:grid-cols-2">
              <InvestmentInsightsPanel
                insight={stock.insight}
                currentPrice={stock.result.currentPrice}
                currency={currency}
              />
              {/* Quick Stats Summary Card */}
              <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                  Should You Invest Now?
                </h3>

                {/* Verdict */}
                <div className={`rounded-lg p-4 border ${
                  stock.insight.signal.includes("Buy")
                    ? "bg-stock-up/10 border-stock-up/25"
                    : stock.insight.signal.includes("Sell")
                      ? "bg-stock-down/10 border-stock-down/25"
                      : "bg-stock-neutral/10 border-stock-neutral/25"
                }`}>
                  <p className={`text-lg font-bold ${
                    stock.insight.signal.includes("Buy")
                      ? "text-stock-up"
                      : stock.insight.signal.includes("Sell")
                        ? "text-stock-down"
                        : "text-stock-neutral"
                  }`}>
                    {stock.insight.signal.includes("Buy")
                      ? "✅ Conditions look favorable"
                      : stock.insight.signal.includes("Sell")
                        ? "⛔ Caution — bearish signals detected"
                        : "⏳ Wait for a clearer signal"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stock.insight.signal.includes("Buy")
                      ? "Technical indicators suggest potential upside. Consider this as a starting point for further research."
                      : stock.insight.signal.includes("Sell")
                        ? "Multiple indicators suggest downward pressure. You may want to wait for a better entry point."
                        : "The market is undecided. Patience may be the best strategy right now."}
                  </p>
                </div>

                {/* Key Factors */}
                <div className="space-y-2.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Key Factors</p>
                  <Factor
                    label="Trend Direction"
                    value={stock.analysis.trend}
                    positive={stock.analysis.trend === "Uptrend"}
                    negative={stock.analysis.trend === "Downtrend"}
                  />
                  <Factor
                    label="RSI Reading"
                    value={`${stock.insight.rsi} — ${stock.insight.rsi < 30 ? "Oversold" : stock.insight.rsi > 70 ? "Overbought" : "Normal"}`}
                    positive={stock.insight.rsi < 30}
                    negative={stock.insight.rsi > 70}
                  />
                  <Factor
                    label="MACD Signal"
                    value={stock.insight.macdSignal}
                    positive={stock.insight.macdSignal === "Bullish"}
                    negative={stock.insight.macdSignal === "Bearish"}
                  />
                  <Factor
                    label="Volatility"
                    value={stock.analysis.volatility}
                    positive={stock.analysis.volatility === "Low"}
                    negative={stock.analysis.volatility === "High"}
                  />
                  <Factor
                    label="Risk/Reward"
                    value={`${stock.insight.riskRewardRatio}x`}
                    positive={stock.insight.riskRewardRatio >= 1.5}
                    negative={stock.insight.riskRewardRatio < 0.8}
                  />
                </div>

                {/* Disclaimer */}
                <div className="rounded-lg bg-stock-neutral/10 border border-stock-neutral/20 p-3">
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    ⚠️ This is a simplified educational tool using basic technical analysis.
                    It is <strong>NOT</strong> financial advice. Always do your own research and consult
                    a qualified financial advisor before making investment decisions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!stock && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-primary animate-pulse-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-1">Enter a stock ticker to begin</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Search for any stock symbol to view historical price charts, moving averages,
              investment signals, and a simple forecast.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function Factor({
  label,
  value,
  positive,
  negative,
}: {
  label: string;
  value: string;
  positive: boolean;
  negative: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold font-mono ${positive ? "text-stock-up" : negative ? "text-stock-down" : "text-stock-neutral"}`}>
        {positive ? "✓ " : negative ? "✗ " : "– "}
        {value}
      </span>
    </div>
  );
}
