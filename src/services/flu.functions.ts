import { createServerFn } from "@tanstack/react-start";
import type { JsonValue } from "./types";

export type FluResult =
  | {
      status: "success" | "unavailable";
      topic: "Flu";
      state: string;
      stateLabel: string;
      normalizedData: {
        condition: "Influenza-like Illness (ILI)";
        reportingPeriod: string;
        activityLevel: number;
        dataStatus: "Verified" | "Unavailable";
        source: "Delphi Epidata (Carnegie Mellon)";
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

function formatWeekEnding(value: JsonValue): string {
  const raw = String(value ?? "");
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return `Week ending ${raw}`;
  }
  if (/^\d{8}$/.test(raw)) {
    const year = raw.slice(0, 4);
    const month = raw.slice(4, 6);
    const day = raw.slice(6, 8);
    return `Week ending ${year}-${month}-${day}`;
  }
  return "";
}

function toActivityLevel(value: JsonValue): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function getMostRecentRow(
  rows: Array<Record<string, JsonValue>>,
): Record<string, JsonValue> | undefined {
  return rows.reduce<Record<string, JsonValue> | undefined>((latest, row) => {
    if (!latest) return row;
    const ew = String(row.epiweek ?? "0");
    const latestEw = String(latest.epiweek ?? "0");
    return ew > latestEw ? row : latest;
  }, undefined);
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
            condition: "Influenza-like Illness (ILI)",
            reportingPeriod: "",
            activityLevel: 0,
            dataStatus: "Unavailable",
            source: "Delphi Epidata (Carnegie Mellon)",
          },
        };
      }

      const rows = raw.epidata as Array<Record<string, JsonValue>>;
      let freshness = "";
      for (const row of rows) {
        const rd = row.release_date;
        if (typeof rd === "string" && rd > freshness) freshness = rd;
      }

      const mostRecent = getMostRecentRow(rows);
      const reportingPeriod = mostRecent
        ? formatWeekEnding(mostRecent.release_date)
        : "";
      const activityLevel = mostRecent ? toActivityLevel(mostRecent.wili) : 0;

      return {
        status: "success",
        topic: "Flu",
        state: data.state,
        stateLabel: label,
        normalizedData: {
          condition: "Influenza-like Illness (ILI)",
          reportingPeriod,
          activityLevel,
          dataStatus: "Verified",
          source: "Delphi Epidata (Carnegie Mellon)",
        },
      };
    } catch (err) {
      return {
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  });
