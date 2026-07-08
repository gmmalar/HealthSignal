// Trend Agent — deterministic classification of period-over-period trend.
// Does not call any LLM. Pure logic only.

export type TrendDirection = "Increasing" | "Decreasing" | "Stable";
export type TrendStrength = "Slight" | "Moderate" | "Significant";

export interface HistoricalPoint {
  order: number;
  period: string;
  value: number;
}

export interface TrendResult {
  supported: boolean;
  direction?: TrendDirection;
  strength?: TrendStrength;
  latestValue?: number;
  previousValue?: number;
  change?: number;
  percentChange?: number;
  consecutivePeriods?: number;
  historyLength?: number;
  reason: string;
}

// Thresholds (documented, deterministic — no LLM):
// direction: |percentChange| < 5%  -> Stable
//            percentChange >= 5%   -> Increasing
//            percentChange <= -5%  -> Decreasing
// strength (on |percentChange|): 5-10% Slight, 10-25% Moderate, 25%+ Significant
//
// Trend Agent never infers missing historical data. If fewer than two
// observations are supplied, or the previous period's value is zero
// (making percent change mathematically undefined), it returns
// supported: false without estimating, extrapolating, or synthesizing
// values.
export function classifyTrend(args: {
  historicalData: HistoricalPoint[];
}): TrendResult {
  const { historicalData } = args;
  if (!historicalData || historicalData.length < 2) {
    return { supported: false, reason: "Insufficient historical data to compute trend" };
  }

  const sorted = [...historicalData].sort((a, b) => a.order - b.order);
  const latest = sorted[sorted.length - 1];
  const previous = sorted[sorted.length - 2];

  if (previous.value === 0) {
    return {
      supported: false,
      reason: "Previous period is zero; percent change cannot be computed.",
    };
  }

  const change = latest.value - previous.value;
  const percentChange = (change / previous.value) * 100;

  let direction: TrendDirection;
  if (Math.abs(percentChange) < 5) direction = "Stable";
  else direction = percentChange > 0 ? "Increasing" : "Decreasing";

  let strength: TrendStrength;
  const abs = Math.abs(percentChange);
  if (abs < 10) strength = "Slight";
  else if (abs < 25) strength = "Moderate";
  else strength = "Significant";

  let consecutivePeriods = 1;
  for (let i = sorted.length - 2; i > 0; i--) {
    const d = sorted[i].value - sorted[i - 1].value;
    const sameDirection = change > 0 ? d > 0 : change < 0 ? d < 0 : false;
    if (!sameDirection) break;
    consecutivePeriods++;
  }

  return {
    supported: true,
    direction,
    strength,
    latestValue: latest.value,
    previousValue: previous.value,
    change,
    percentChange,
    consecutivePeriods,
    historyLength: sorted.length,
    reason: `Computed from ${sorted.length} historical periods`,
  };
}