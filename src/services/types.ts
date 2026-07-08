import type { TrendResult } from "./trendAgent.functions";
import type { AlertResult } from "./alertAgent.functions";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [k: string]: JsonValue };

export interface HealthSignalResponse {
  topic: string;
  state: string;
  stateLabel: string;
  status: "Verified" | "Unavailable" | "Error";
  freshness: string;
  source: string;
  lastUpdated: string;
  rawData: JsonValue;
  normalizedData: JsonValue;
  historicalData?: Array<{ order: number; period: string; value: number }>;
  trendInfo?: TrendResult;
  alertInfo?: AlertResult;
  summary?: string;
  generatedBy?: string;
  freshnessInfo?: {
    status: "Verified" | "Recent" | "Stale" | "Unavailable";
    cadence: "hourly" | "weekly";
    timestamp: string;
    badge: string;
    reason: string;
  };
}