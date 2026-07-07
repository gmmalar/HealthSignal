import { createServerFn } from "@tanstack/react-start";
import type { JsonValue } from "./types";

export type FluResult =
  | {
      status: "success" | "unavailable";
      topic: "Flu";
      state: string;
      stateLabel: string;
      normalizedData: {
        topic: "Flu";
        state: string;
        stateLabel: string;
        status: "Verified" | "Unavailable";
        freshness: string;
        source: string;
        lastUpdated: string;
        rawData: JsonValue;
        normalizedData: Record<string, never>;
      };
    }
  | { status: "error"; error: string };

const STATE_REGION: Record<string, string> = {
  texas: "tx",
  california: "ca",
  florida: "fl",
  arizona: "az",
  "north-carolina": "nc",
  illinois: "il",
  washington: "wa",
};

function toLabel(stateKey: string): string {
  return stateKey
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export const getFlu = createServerFn({ method: "GET" })
  .inputValidator((data: { state: string }) => data)
  .handler(async ({ data }): Promise<FluResult> => {
    const region = STATE_REGION[data.state];
    if (!region) {
      return { status: "error", error: "Unsupported state for Flu" };
    }
    const label = toLabel(data.state);

    const url = new URL("https://api.delphi.cmu.edu/epidata/fluview/");
    url.searchParams.set("regions", region);
    url.searchParams.set("epiweeks", "202620-202627");

    try {
      const res = await fetch(url.toString());
      if (!res.ok) {
        return { status: "error", error: `Delphi request failed: ${res.status}` };
      }
      const raw = (await res.json()) as { result?: number; message?: string; epidata?: unknown };

      if (raw.result !== 1 || !Array.isArray(raw.epidata) || raw.epidata.length === 0) {
        return {
          status: "unavailable",
          topic: "Flu",
          state: data.state,
          stateLabel: label,
          normalizedData: {
            topic: "Flu",
            state: data.state,
            stateLabel: label,
            status: "Unavailable",
            freshness: "",
            source: "Delphi Epidata (Carnegie Mellon)",
            lastUpdated: "",
            rawData: (raw as unknown) as JsonValue,
            normalizedData: {},
          },
        };
      }

      const rows = raw.epidata as Array<Record<string, JsonValue>>;
      let freshness = "";
      for (const row of rows) {
        const rd = row.release_date;
        if (typeof rd === "string" && rd > freshness) freshness = rd;
      }

      return {
        status: "success",
        topic: "Flu",
        state: data.state,
        stateLabel: label,
        normalizedData: {
          topic: "Flu",
          state: data.state,
          stateLabel: label,
          status: "Verified",
          freshness,
          source: "Delphi Epidata (Carnegie Mellon)",
          lastUpdated: freshness,
          rawData: (raw as unknown) as JsonValue,
          normalizedData: {},
        },
      };
    } catch (err) {
      return {
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  });