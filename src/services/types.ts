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