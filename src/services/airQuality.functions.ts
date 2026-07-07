import { createServerFn } from "@tanstack/react-start";
import type { HealthSignalResponse, JsonValue } from "./types";

const STATE_ZIP: Record<string, string> = {
  texas: "75201",
  "north-carolina": "27607",
  florida: "32801",
  arizona: "86001",
};

function toLabel(stateKey: string): string {
  return stateKey
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export type AirQualityResult =
  | (HealthSignalResponse & { status: "Verified" | "Unavailable" })
  | { status: "Error"; error: string };

const SOURCE = "EPA AirNow" as const;

function unavailable(state: string, freshness = ""): AirQualityResult {
  return {
    topic: "air-quality",
    state,
    stateLabel: toLabel(state),
    status: "Unavailable",
    freshness,
    source: SOURCE,
    lastUpdated: freshness,
    rawData: [],
    normalizedData: {
      parameter: "",
      aqi: 0,
      category: "",
      dominantPollutant: true,
      dataStatus: "Unavailable",
      source: SOURCE,
    },
  };
}

export const getAirQuality = createServerFn({ method: "GET" })
  .inputValidator((data: { state: string }) => data)
  .handler(async ({ data }): Promise<AirQualityResult> => {
    const zip = STATE_ZIP[data.state];
    if (!zip) {
      // Adapter owns state coverage. Unsupported state -> Unavailable, not Error.
      return unavailable(data.state);
    }

    const apiKey = process.env.AIRNOW_API_KEY;
    if (!apiKey) {
      return { status: "Error", error: "AIRNOW_API_KEY is not configured" };
    }

    const url = new URL("https://www.airnowapi.org/aq/observation/zipCode/current/");
    url.searchParams.set("format", "application/json");
    url.searchParams.set("zipCode", zip);
    url.searchParams.set("distance", "25");
    url.searchParams.set("API_KEY", apiKey);

    try {
      const res = await fetch(url.toString());
      if (!res.ok) {
        return { status: "Error", error: `AirNow request failed: ${res.status}` };
      }
      const raw = (await res.json()) as JsonValue;

      if (!Array.isArray(raw) || raw.length === 0) {
        return unavailable(data.state);
      }

      const rows = raw as Array<Record<string, JsonValue>>;
      const first = rows[0];
      const dateObserved = typeof first.DateObserved === "string" ? first.DateObserved.trim() : "";
      const hourObserved = typeof first.HourObserved === "number" ? first.HourObserved : "";
      const localTz = typeof first.LocalTimeZone === "string" ? first.LocalTimeZone : "";
      const freshness = dateObserved ? `${dateObserved} ${hourObserved}:00 ${localTz}`.trim() : "";

      // Dominant-pollutant rule: pick the pollutant with the highest individual AQI.
      // Do NOT average across pollutants.
      let dominant: Record<string, JsonValue> | null = null;
      let dominantAqi = -Infinity;
      for (const row of rows) {
        const aqi = typeof row.AQI === "number" ? row.AQI : Number(row.AQI);
        if (!Number.isNaN(aqi) && aqi > dominantAqi) {
          dominantAqi = aqi;
          dominant = row;
        }
      }

      if (!dominant) {
        return unavailable(data.state, freshness);
      }

      const parameter =
        typeof dominant.ParameterName === "string" ? dominant.ParameterName : "";
      const categoryObj = dominant.Category as
        | { Name?: string; Number?: number }
        | undefined;
      const category = categoryObj && typeof categoryObj.Name === "string" ? categoryObj.Name : "";

      return {
        topic: "air-quality",
        state: data.state,
        stateLabel: toLabel(data.state),
        status: "Verified",
        freshness,
        source: SOURCE,
        lastUpdated: freshness,
        rawData: raw,
        normalizedData: {
          parameter,
          aqi: dominantAqi,
          category,
          dominantPollutant: true,
          dataStatus: "Verified",
          source: SOURCE,
        },
      };
    } catch (err) {
      return {
        status: "Error",
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  });
