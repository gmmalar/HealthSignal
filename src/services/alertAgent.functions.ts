// Alert Agent — deterministic classification of alert level.
// Does not call any LLM. Pure logic only.

export type AlertLevel = "Normal" | "Watch" | "Elevated";

export interface AlertResult {
  level: AlertLevel;
  triggered: boolean;
  reason: string;
}

// Deterministic, topic-specific thresholds — documented for auditability.
// Alert Agent never infers severity from language; it only evaluates
// numeric values and trend direction already computed upstream.
// reason strings describe *what triggered the level*, not how to
// present it — presentation/explanation belongs to the UI or the
// Health Topic Agent, not this layer.

// Air Quality (EPA AQI)
// 0-100    -> Normal
// 101-150  -> Watch
// >150     -> Elevated

// Flu (ILI %)
// >5% ILI                          -> Elevated
// Significant increasing trend     -> Watch
// otherwise                        -> Normal

// Disease Outbreaks
// Cases > 0 AND increasing trend   -> Elevated
// Cases > 0 only                   -> Watch
// No cases                         -> Normal

export function classifyAlert(args: {
  topic: string;
  normalizedData: Record<string, unknown>;
  trendInfo?: { supported: boolean; direction?: string; strength?: string };
}): AlertResult {
  const { topic, normalizedData, trendInfo } = args;

  switch (topic) {
    case "air-quality": {
      const aqi = Number(normalizedData.aqi ?? NaN);
      if (Number.isNaN(aqi)) {
        return { level: "Normal", triggered: false, reason: "AQI unavailable" };
      }
      if (aqi > 150) {
        return { level: "Elevated", triggered: true, reason: "Exceeded Elevated AQI threshold" };
      }
      if (aqi > 100) {
        return { level: "Watch", triggered: true, reason: "Exceeded Watch AQI threshold" };
      }
      return { level: "Normal", triggered: false, reason: "AQI within normal range" };
    }

    case "flu": {
      const activity = Number(normalizedData.activityLevel ?? NaN);
      const trendUp = trendInfo?.supported && trendInfo.direction === "Increasing";
      if (!Number.isNaN(activity) && activity > 5) {
        return { level: "Elevated", triggered: true, reason: "Exceeded ILI activity threshold" };
      }
      if (trendUp && trendInfo?.strength === "Significant") {
        return { level: "Watch", triggered: true, reason: "Significant increasing trend detected" };
      }
      return { level: "Normal", triggered: false, reason: "Flu activity within expected range" };
    }

    case "disease-outbreaks": {
      const cases = Number(normalizedData.reportedCases ?? 0);
      const trendUp = trendInfo?.supported && trendInfo.direction === "Increasing";
      if (cases > 0 && trendUp) {
        return { level: "Elevated", triggered: true, reason: "Reported cases with increasing trend" };
      }
      if (cases > 0) {
        return { level: "Watch", triggered: true, reason: "Cases reported this period" };
      }
      return { level: "Normal", triggered: false, reason: "No cases reported this period" };
    }

    default:
      return { level: "Normal", triggered: false, reason: "No alert rules defined for this topic" };
  }
}