import { createServerFn } from "@tanstack/react-start";
import type { StockDataPoint } from "./stock-utils";

export interface StockFetchResult {
  symbol: string;
  name: string;
  currentPrice: number;
  currency: string;
  data: StockDataPoint[];
  dateRange: { start: string; end: string };
}

export const fetchStockData = createServerFn({ method: "GET" })
  .inputValidator((input: { symbol: string; range: "6mo" | "1y" }) => {
    return input;
  })
  .handler(async ({ data }) => {
    const { symbol, range } = data;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=1d`;

    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch data for "${symbol}". Please check the ticker symbol.`,
      );
    }

    const json = await response.json();
    const result = json.chart?.result?.[0];

    if (!result) {
      throw new Error(
        `No data found for "${symbol}". Please check the ticker symbol.`,
      );
    }

    const meta = result.meta;
    const timestamps: number[] = result.timestamp || [];
    const q = result.indicators?.quote?.[0] || {};

    const stockData: StockDataPoint[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (q.close?.[i] != null) {
        stockData.push({
          date: new Date(timestamps[i] * 1000).toISOString().split("T")[0],
          open: q.open[i],
          high: q.high[i],
          low: q.low[i],
          close: q.close[i],
          volume: q.volume[i],
        });
      }
    }

    if (stockData.length === 0) {
      throw new Error(`No historical data available for "${symbol}".`);
    }

    const fetchResult: StockFetchResult = {
      symbol: meta.symbol || symbol.toUpperCase(),
      name:
        meta.longName ||
        meta.shortName ||
        meta.symbol ||
        symbol.toUpperCase(),
      currentPrice:
        meta.regularMarketPrice || stockData[stockData.length - 1].close,
      currency: meta.currency || "USD",
      data: stockData,
      dateRange: {
        start: stockData[0].date,
        end: stockData[stockData.length - 1].date,
      },
    };

    return fetchResult;
  });
