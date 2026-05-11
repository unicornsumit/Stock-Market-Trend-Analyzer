import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StockDataPoint, ForecastPoint, CurrencyCode } from "@/lib/stock-utils";
import { formatCurrency, convertFromUSD } from "@/lib/stock-utils";
import { useRef, useCallback } from "react";

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = { USD: "$", EUR: "€", INR: "₹" };

interface StockChartProps {
  data: StockDataPoint[];
  forecast: ForecastPoint[];
  symbol: string;
  currency?: CurrencyCode;
}

export function StockChart({ data, forecast, symbol, currency = "USD" }: StockChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  // Combine historical + forecast for chart
  const chartData = [
    ...data.map((d) => ({
      date: d.date,
      close: d.close,
      ma7: d.ma7,
      ma30: d.ma30,
      forecast: undefined as number | undefined,
    })),
    ...forecast.map((f) => ({
      date: f.date,
      close: undefined as number | undefined,
      ma7: undefined as number | undefined,
      ma30: undefined as number | undefined,
      forecast: f.predictedClose,
    })),
  ];

  // Bridge: add forecast start to last data point
  if (forecast.length > 0 && data.length > 0) {
    const lastIdx = data.length - 1;
    chartData[lastIdx] = { ...chartData[lastIdx], forecast: data[lastIdx].close };
  }

  const handleExport = useCallback(() => {
    if (!chartRef.current) return;
    const svg = chartRef.current.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      if (ctx) {
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(2, 2);
        ctx.drawImage(img, 0, 0);
      }
      const a = document.createElement("a");
      a.download = `${symbol}_chart.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }, [symbol]);

  // Format dates for display
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
          </svg>
          Price Chart — {symbol}
        </CardTitle>
        <button
          onClick={handleExport}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export
        </button>
      </CardHeader>
      <CardContent>
        <div ref={chartRef} className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.02 250)" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="oklch(0.45 0.02 250)"
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="oklch(0.45 0.02 250)"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => {
                  const c = convertFromUSD(Number(v), currency);
                  const s = CURRENCY_SYMBOLS[currency];
                  return currency === "INR" && c >= 1000
                    ? `${s}${(c / 1000).toFixed(1)}k`
                    : `${s}${c.toFixed(0)}`;
                }}
                domain={["auto", "auto"]}
                width={70}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.17 0.02 250)",
                  border: "1px solid oklch(0.25 0.02 250)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelFormatter={(label: any) => formatDate(String(label))}
                formatter={(value: any, name: any) => [
                  formatCurrency(Number(value), currency),
                  name === "close" ? "Close" : name === "ma7" ? "7-Day MA" : name === "ma30" ? "30-Day MA" : "Forecast",
                ]}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
              />
              {data.length > 0 && forecast.length > 0 && (
                <ReferenceLine
                  x={data[data.length - 1].date}
                  stroke="oklch(0.40 0.02 250)"
                  strokeDasharray="4 4"
                  label={{ value: "Forecast →", position: "top", fill: "oklch(0.50 0.02 250)", fontSize: 10 }}
                />
              )}
              <Line
                type="monotone"
                dataKey="close"
                stroke="oklch(0.65 0.18 160)"
                strokeWidth={2}
                dot={false}
                name="Close"
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="ma7"
                stroke="oklch(0.65 0.18 260)"
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="4 2"
                name="7-Day MA"
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="ma30"
                stroke="oklch(0.70 0.18 55)"
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="8 4"
                name="30-Day MA"
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="oklch(0.70 0.15 300)"
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={{ r: 3, fill: "oklch(0.70 0.15 300)" }}
                name="Forecast"
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
