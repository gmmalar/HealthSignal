export interface HealthSignalResponse {
  topic: string;
  state: string;
  stateLabel: string;
  status: "Verified" | "Unavailable" | "Error";
  freshness: string;
  rawData: unknown;
  normalizedData: unknown;
}