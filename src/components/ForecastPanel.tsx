import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ForecastPoint, CurrencyCode } from "@/lib/stock-utils";
import { formatCurrency } from "@/lib/stock-utils";

interface ForecastPanelProps {
  forecast: ForecastPoint[];
  lastClose: number;
  currency: CurrencyCode;
}

export function ForecastPanel({ forecast, lastClose, currency }: ForecastPanelProps) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
          </svg>
          Basic Forecast (Trend-Based)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg bg-stock-neutral/10 border border-stock-neutral/20 p-3">
          <p className="text-xs text-muted-foreground">
            ⚠️ This forecast uses simple moving average trends. It is NOT financial advice
            and should not be used for trading decisions.
          </p>
        </div>

        <div className="space-y-2">
          {forecast.map((f) => {
            const change = f.predictedClose - lastClose;
            const changePercent = (change / lastClose) * 100;
            const isUp = change >= 0;

            return (
              <div
                key={f.day}
                className="flex items-center justify-between rounded-lg bg-surface p-3"
              >
                <div>
                  <p className="text-xs text-muted-foreground">Day {f.day}</p>
                  <p className="text-sm text-surface-foreground">{f.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono font-semibold text-surface-foreground">
                    {formatCurrency(f.predictedClose, currency)}
                  </p>
                  <p className={`text-xs font-mono ${isUp ? "text-stock-up" : "text-stock-down"}`}>
                    {isUp ? "+" : ""}
                    {changePercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
