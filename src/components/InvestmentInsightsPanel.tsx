import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { InvestmentInsight, CurrencyCode } from "@/lib/stock-utils";
import { formatCurrency } from "@/lib/stock-utils";

interface InvestmentInsightsPanelProps {
  insight: InvestmentInsight;
  currentPrice: number;
  currency: CurrencyCode;
}

function SignalBadge({ signal }: { signal: InvestmentInsight["signal"] }) {
  const config: Record<string, { bg: string; emoji: string }> = {
    "Strong Buy": { bg: "bg-stock-up/20 text-stock-up border-stock-up/40", emoji: "🚀" },
    Buy: { bg: "bg-stock-up/15 text-stock-up border-stock-up/30", emoji: "📈" },
    Hold: { bg: "bg-stock-neutral/15 text-stock-neutral border-stock-neutral/30", emoji: "⏸️" },
    Sell: { bg: "bg-stock-down/15 text-stock-down border-stock-down/30", emoji: "📉" },
    "Strong Sell": { bg: "bg-stock-down/20 text-stock-down border-stock-down/40", emoji: "🔻" },
  };
  const c = config[signal];
  return (
    <Badge className={`${c.bg} border text-base px-3 py-1.5 font-semibold`} variant="outline">
      {c.emoji} {signal}
    </Badge>
  );
}

function GaugeBar({ value, label }: { value: number; label: string }) {
  // value from -100 to 100, map to 0-100 for display
  const normalized = (value + 100) / 2;
  const color =
    normalized > 65 ? "bg-stock-up" : normalized < 35 ? "bg-stock-down" : "bg-stock-neutral";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-semibold">
          {value > 0 ? "+" : ""}
          {value}
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-surface overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${normalized}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>Strong Sell</span>
        <span>Hold</span>
        <span>Strong Buy</span>
      </div>
    </div>
  );
}

function RSIGauge({ rsi }: { rsi: number }) {
  const label =
    rsi < 30 ? "Oversold" : rsi > 70 ? "Overbought" : rsi < 45 ? "Slightly Bearish" : rsi > 55 ? "Slightly Bullish" : "Neutral";
  const color =
    rsi < 30 ? "text-stock-up" : rsi > 70 ? "text-stock-down" : "text-stock-neutral";

  return (
    <div className="rounded-lg bg-surface p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">RSI (14)</p>
        <span className={`text-xs font-semibold ${color}`}>{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Progress value={rsi} className="h-2" />
        </div>
        <span className="text-sm font-mono font-bold">{rsi}</span>
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>0 – Oversold</span>
        <span>50</span>
        <span>Overbought – 100</span>
      </div>
    </div>
  );
}

export function InvestmentInsightsPanel({ insight, currentPrice, currency }: InvestmentInsightsPanelProps) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
          </svg>
          Investment Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Signal */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Overall Signal</p>
            <SignalBadge signal={insight.signal} />
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-1">MACD</p>
            <Badge
              className={`border ${
                insight.macdSignal === "Bullish"
                  ? "bg-stock-up/15 text-stock-up border-stock-up/30"
                  : insight.macdSignal === "Bearish"
                    ? "bg-stock-down/15 text-stock-down border-stock-down/30"
                    : "bg-stock-neutral/15 text-stock-neutral border-stock-neutral/30"
              }`}
              variant="outline"
            >
              {insight.macdSignal}
            </Badge>
          </div>
        </div>

        {/* Signal Score Gauge */}
        <GaugeBar value={insight.signalScore} label="Signal Strength" />

        {/* RSI */}
        <RSIGauge rsi={insight.rsi} />

        {/* Expert Sentiment */}
        <div className="rounded-lg bg-surface p-3 space-y-2">
          <p className="text-xs text-muted-foreground font-semibold">📊 Analyst Consensus (Simulated)</p>
          <div className="flex h-5 rounded-full overflow-hidden">
            <div
              className="bg-stock-up transition-all duration-700 flex items-center justify-center"
              style={{ width: `${insight.expertBullPercent}%` }}
            >
              {insight.expertBullPercent > 15 && (
                <span className="text-[10px] font-bold text-background">{insight.expertBullPercent}%</span>
              )}
            </div>
            <div
              className="bg-stock-neutral transition-all duration-700 flex items-center justify-center"
              style={{ width: `${insight.expertHoldPercent}%` }}
            >
              {insight.expertHoldPercent > 15 && (
                <span className="text-[10px] font-bold text-background">{insight.expertHoldPercent}%</span>
              )}
            </div>
            <div
              className="bg-stock-down transition-all duration-700 flex items-center justify-center"
              style={{ width: `${insight.expertBearPercent}%` }}
            >
              {insight.expertBearPercent > 15 && (
                <span className="text-[10px] font-bold text-background">{insight.expertBearPercent}%</span>
              )}
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-stock-up" /> Bullish
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-stock-neutral" /> Hold
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-stock-down" /> Bearish
            </span>
          </div>
        </div>

        {/* Support & Resistance */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-surface p-3">
            <p className="text-xs text-muted-foreground mb-1">Support Level</p>
            <p className="text-sm font-mono font-semibold text-stock-up">
              {formatCurrency(insight.supportLevel, currency)}
            </p>
            {insight.nearSupport && (
              <p className="text-[10px] text-stock-up mt-1">📍 Price near support</p>
            )}
          </div>
          <div className="rounded-lg bg-surface p-3">
            <p className="text-xs text-muted-foreground mb-1">Resistance Level</p>
            <p className="text-sm font-mono font-semibold text-stock-down">
              {formatCurrency(insight.resistanceLevel, currency)}
            </p>
            {insight.nearResistance && (
              <p className="text-[10px] text-stock-down mt-1">📍 Price near resistance</p>
            )}
          </div>
          <div className="rounded-lg bg-surface p-3">
            <p className="text-xs text-muted-foreground mb-1">Risk/Reward</p>
            <p className={`text-sm font-mono font-semibold ${insight.riskRewardRatio >= 1.5 ? "text-stock-up" : insight.riskRewardRatio < 0.8 ? "text-stock-down" : "text-stock-neutral"}`}>
              {insight.riskRewardRatio}x
            </p>
          </div>
          <div className="rounded-lg bg-surface p-3">
            <p className="text-xs text-muted-foreground mb-1">Current Price</p>
            <p className="text-sm font-mono font-semibold text-surface-foreground">
              {formatCurrency(currentPrice, currency)}
            </p>
          </div>
        </div>

        {/* AI-Style Insight Summary */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1.5">
          <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
            Quick Insight
          </p>
          <p className="text-xs text-foreground/80 leading-relaxed">{insight.insightSummary}</p>
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-muted-foreground/60 text-center">
          ⚠️ Simulated analysis based on technical indicators. Not financial advice.
        </p>
      </CardContent>
    </Card>
  );
}
