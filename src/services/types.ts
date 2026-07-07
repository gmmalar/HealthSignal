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
  rawData: JsonValue;
  normalizedData: JsonValue;
}