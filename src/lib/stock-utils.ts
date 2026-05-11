export interface StockDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ma7?: number;
  ma30?: number;
}

export interface StockAnalysis {
  trend: "Uptrend" | "Downtrend" | "Sideways";
  volatility: "Low" | "Medium" | "High";
  dailyReturnPercent: number;
  avgVolume: number;
  highPrice: number;
  lowPrice: number;
  priceChange: number;
  priceChangePercent: number;
}

export interface ForecastPoint {
  day: number;
  date: string;
  predictedClose: number;
}

export type SignalType = "Strong Buy" | "Buy" | "Hold" | "Sell" | "Strong Sell";

export interface InvestmentInsight {
  signal: SignalType;
  signalScore: number; // -100 to 100
  rsi: number;
  supportLevel: number;
  resistanceLevel: number;
  expertBullPercent: number;
  expertBearPercent: number;
  expertHoldPercent: number;
  macdSignal: "Bullish" | "Bearish" | "Neutral";
  nearSupport: boolean;
  nearResistance: boolean;
  insightSummary: string;
  riskRewardRatio: number;
}

export function calculateRSI(closes: number[], period: number = 14): number {
  if (closes.length < period + 1) return 50;
  const changes = [];
  for (let i = closes.length - period; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }
  const gains = changes.filter((c) => c > 0);
  const losses = changes.filter((c) => c < 0).map((c) => Math.abs(c));
  const avgGain = gains.length > 0 ? gains.reduce((s, v) => s + v, 0) / period : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((s, v) => s + v, 0) / period : 0;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function calculateSupportResistance(data: StockDataPoint[]): { support: number; resistance: number } {
  const recent = data.slice(-60);
  const lows = recent.map((d) => d.low);
  const highs = recent.map((d) => d.high);
  lows.sort((a, b) => a - b);
  highs.sort((a, b) => b - a);
  const support = lows.slice(0, 5).reduce((s, v) => s + v, 0) / 5;
  const resistance = highs.slice(0, 5).reduce((s, v) => s + v, 0) / 5;
  return { support: Math.round(support * 100) / 100, resistance: Math.round(resistance * 100) / 100 };
}

export function generateInvestmentInsight(data: StockDataPoint[], analysis: StockAnalysis): InvestmentInsight {
  const closes = data.map((d) => d.close);
  const lastClose = closes[closes.length - 1];
  const rsi = calculateRSI(closes);
  const { support, resistance } = calculateSupportResistance(data);

  // MACD-like signal (simplified: 12-day EMA vs 26-day EMA direction)
  const ema12 = closes.slice(-12).reduce((s, v) => s + v, 0) / 12;
  const ema26 = closes.slice(-26).reduce((s, v) => s + v, 0) / Math.min(26, closes.length);
  const macdValue = ema12 - ema26;
  const macdSignal: "Bullish" | "Bearish" | "Neutral" =
    macdValue > lastClose * 0.005 ? "Bullish" : macdValue < -lastClose * 0.005 ? "Bearish" : "Neutral";

  // Composite score from -100 to 100
  let score = 0;

  // RSI contribution (-30 to +30)
  if (rsi < 30) score += 30;
  else if (rsi < 40) score += 15;
  else if (rsi > 70) score -= 30;
  else if (rsi > 60) score -= 15;

  // Trend contribution (-25 to +25)
  if (analysis.trend === "Uptrend") score += 25;
  else if (analysis.trend === "Downtrend") score -= 25;

  // MACD contribution (-20 to +20)
  if (macdSignal === "Bullish") score += 20;
  else if (macdSignal === "Bearish") score -= 20;

  // Support/Resistance proximity (-15 to +15)
  const nearSupport = (lastClose - support) / lastClose < 0.03;
  const nearResistance = (resistance - lastClose) / lastClose < 0.03;
  if (nearSupport) score += 15;
  if (nearResistance) score -= 10;

  // Volatility adjustment
  if (analysis.volatility === "High") score = Math.round(score * 0.8);

  score = Math.max(-100, Math.min(100, score));

  let signal: SignalType;
  if (score >= 40) signal = "Strong Buy";
  else if (score >= 15) signal = "Buy";
  else if (score <= -40) signal = "Strong Sell";
  else if (score <= -15) signal = "Sell";
  else signal = "Hold";

  // Simulated expert consensus derived from score
  const bullBase = Math.max(10, 50 + score * 0.4);
  const bearBase = Math.max(10, 50 - score * 0.4);
  const total = bullBase + bearBase + 20;
  const expertBullPercent = Math.round((bullBase / total) * 100);
  const expertBearPercent = Math.round((bearBase / total) * 100);
  const expertHoldPercent = 100 - expertBullPercent - expertBearPercent;

  // Risk/Reward ratio
  const upside = resistance - lastClose;
  const downside = lastClose - support;
  const riskRewardRatio = downside > 0 ? Math.round((upside / downside) * 100) / 100 : 99;

  // Generate human-friendly insight
  const insights: string[] = [];
  if (rsi < 30) insights.push("RSI indicates the stock is oversold — potential bounce ahead.");
  else if (rsi > 70) insights.push("RSI shows overbought conditions — caution advised.");
  if (nearSupport) insights.push("Price is near a key support level, which could attract buyers.");
  if (nearResistance) insights.push("Price is approaching resistance — breakout or pullback likely.");
  if (analysis.trend === "Uptrend" && macdSignal === "Bullish") insights.push("Strong bullish momentum confirmed by both trend and MACD.");
  else if (analysis.trend === "Downtrend" && macdSignal === "Bearish") insights.push("Bearish momentum with downtrend and negative MACD alignment.");
  if (analysis.volatility === "High") insights.push("High volatility — consider smaller position sizes.");
  if (insights.length === 0) insights.push("Market conditions appear neutral. Watch for a clearer signal before acting.");

  return {
    signal,
    signalScore: score,
    rsi: Math.round(rsi * 10) / 10,
    supportLevel: support,
    resistanceLevel: resistance,
    expertBullPercent,
    expertBearPercent,
    expertHoldPercent,
    macdSignal,
    nearSupport,
    nearResistance,
    insightSummary: insights.join(" "),
    riskRewardRatio,
  };
}

export function calculateMovingAverages(data: StockDataPoint[]): StockDataPoint[] {
  return data.map((point, i) => {
    const ma7 = i >= 6
      ? data.slice(i - 6, i + 1).reduce((s, p) => s + p.close, 0) / 7
      : undefined;
    const ma30 = i >= 29
      ? data.slice(i - 29, i + 1).reduce((s, p) => s + p.close, 0) / 30
      : undefined;
    return { ...point, ma7, ma30 };
  });
}

export function analyzeStock(data: StockDataPoint[]): StockAnalysis {
  const closes = data.map(d => d.close);
  const volumes = data.map(d => d.volume);

  const firstClose = closes[0];
  const lastClose = closes[closes.length - 1];
  const priceChange = lastClose - firstClose;
  const priceChangePercent = (priceChange / firstClose) * 100;

  // Trend: compare 30-day MA slope
  const recent30 = closes.slice(-30);
  const first10Avg = recent30.slice(0, 10).reduce((s, v) => s + v, 0) / 10;
  const last10Avg = recent30.slice(-10).reduce((s, v) => s + v, 0) / Math.min(10, recent30.slice(-10).length);
  const slopePercent = ((last10Avg - first10Avg) / first10Avg) * 100;

  let trend: StockAnalysis["trend"] = "Sideways";
  if (slopePercent > 3) trend = "Uptrend";
  else if (slopePercent < -3) trend = "Downtrend";

  // Volatility: std dev of daily returns
  const dailyReturns: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    dailyReturns.push(((closes[i] - closes[i - 1]) / closes[i - 1]) * 100);
  }
  const meanReturn = dailyReturns.reduce((s, v) => s + v, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((s, v) => s + (v - meanReturn) ** 2, 0) / dailyReturns.length;
  const stdDev = Math.sqrt(variance);

  let volatility: StockAnalysis["volatility"] = "Medium";
  if (stdDev < 1.5) volatility = "Low";
  else if (stdDev > 3) volatility = "High";

  const lastReturn = dailyReturns[dailyReturns.length - 1] || 0;

  return {
    trend,
    volatility,
    dailyReturnPercent: lastReturn,
    avgVolume: volumes.reduce((s, v) => s + v, 0) / volumes.length,
    highPrice: Math.max(...closes),
    lowPrice: Math.min(...closes),
    priceChange,
    priceChangePercent,
  };
}

export function generateForecast(data: StockDataPoint[], days: number = 5): ForecastPoint[] {
  const closes = data.map(d => d.close);
  const ma7 = closes.slice(-7).reduce((s, v) => s + v, 0) / 7;
  const ma30 = closes.slice(-30).reduce((s, v) => s + v, 0) / Math.min(30, closes.length);

  // Simple trend-based: use weighted average of MA7 and MA30 with slight momentum
  const momentum = (ma7 - ma30) / ma30;
  const lastClose = closes[closes.length - 1];

  const forecast: ForecastPoint[] = [];
  let currentPrice = lastClose;

  const lastDate = new Date(data[data.length - 1].date);

  for (let i = 1; i <= days; i++) {
    const dailyChange = currentPrice * momentum * 0.1;
    currentPrice = currentPrice + dailyChange;

    const forecastDate = new Date(lastDate);
    forecastDate.setDate(forecastDate.getDate() + i);

    // Skip weekends
    while (forecastDate.getDay() === 0 || forecastDate.getDay() === 6) {
      forecastDate.setDate(forecastDate.getDate() + 1);
    }

    forecast.push({
      day: i,
      date: forecastDate.toISOString().split("T")[0],
      predictedClose: Math.round(currentPrice * 100) / 100,
    });
  }

  return forecast;
}

export type CurrencyCode = "USD" | "EUR" | "INR";

const CURRENCY_LOCALES: Record<CurrencyCode, string> = {
  USD: "en-US",
  EUR: "de-DE",
  INR: "en-IN",
};

// Approximate exchange rates from USD (for display conversion only)
const EXCHANGE_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  EUR: 0.92,
  INR: 83.5,
};

export function convertFromUSD(value: number, currency: CurrencyCode): number {
  return value * EXCHANGE_RATES[currency];
}

export function formatCurrency(value: number, currency: CurrencyCode = "USD"): string {
  const converted = convertFromUSD(value, currency);
  const fractionDigits = currency === "INR" ? 0 : 2;
  return new Intl.NumberFormat(CURRENCY_LOCALES[currency], {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(converted);
}

export function formatNumber(value: number): string {
  if (value >= 1e9) return (value / 1e9).toFixed(2) + "B";
  if (value >= 1e6) return (value / 1e6).toFixed(2) + "M";
  if (value >= 1e3) return (value / 1e3).toFixed(1) + "K";
  return value.toFixed(2);
}
