import { createServerFn } from "@tanstack/react-start";

export type AirQualityResult =
  | {
      status: "success" | "unavailable";
      topic: "Air Quality";
      state: string;
      normalizedData: {
        topic: "Air Quality";
        state: string;
        status: "Verified" | "Unavailable";
        freshness: string;
        rawData: unknown;
      };
    }
  | { status: "error"; error: string };

const STATE_ZIP: Record<string, string> = {
  Texas: "75201",
};

export const getAirQuality = createServerFn({ method: "GET" })
  .inputValidator((data: { state: string }) => data)
  .handler(async ({ data }): Promise<AirQualityResult> => {
    const zip = STATE_ZIP[data.state];
    if (!zip) {
      return { status: "error", error: "Unsupported state for Air Quality" };
    }

    const apiKey = process.env.AIRNOW_API_KEY;
    if (!apiKey) {
      return { status: "error", error: "AIRNOW_API_KEY is not configured" };
    }

    const url = new URL("https://www.airnowapi.org/aq/observation/zipCode/current/");
    url.searchParams.set("format", "application/json");
    url.searchParams.set("zipCode", zip);
    url.searchParams.set("distance", "25");
    url.searchParams.set("API_KEY", apiKey);

    try {
      const res = await fetch(url.toString());
      if (!res.ok) {
        return { status: "error", error: `AirNow request failed: ${res.status}` };
      }
      const raw = (await res.json()) as Array<Record<string, unknown>>;

      if (!Array.isArray(raw) || raw.length === 0) {
        return {
          status: "unavailable",
          topic: "Air Quality",
          state: data.state,
          normalizedData: {
            topic: "Air Quality",
            state: data.state,
            status: "Unavailable",
            freshness: "",
            rawData: [],
          },
        };
      }

      const first = raw[0];
      const dateObserved =
        typeof first.DateObserved === "string" ? first.DateObserved.trim() : "";
      const hourObserved =
        typeof first.HourObserved === "number" ? first.HourObserved : "";
      const localTz = typeof first.LocalTimeZone === "string" ? first.LocalTimeZone : "";
      const freshness = dateObserved
        ? `${dateObserved} ${hourObserved}:00 ${localTz}`.trim()
        : "";

      return {
        status: "success",
        topic: "Air Quality",
        state: data.state,
        normalizedData: {
          topic: "Air Quality",
          state: data.state,
          status: "Verified",
          freshness,
          rawData: raw,
        },
      };
    } catch (err) {
      return {
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  });