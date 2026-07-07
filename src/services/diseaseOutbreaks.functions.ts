import { createServerFn } from "@tanstack/react-start";
import type { HealthSignalResponse } from "./types";

const CURRENT_NNDSS = { year: "2026", week: "25" };

const STATE_JURISDICTION: Record<string, { jurisdiction: string; label: string }> = {
  texas: { jurisdiction: "Texas", label: "Texas" },
  california: { jurisdiction: "California", label: "California" },
  florida: { jurisdiction: "Florida", label: "Florida" },
};

export type DiseaseOutbreaksResult =
  | (HealthSignalResponse & { status: "Verified" | "Unavailable" })
  | { status: "Error"; error: string };

export const getDiseaseOutbreaks = createServerFn({ method: "GET" })
  .inputValidator((data: { state: string }) => data)
  .handler(async ({ data }): Promise<DiseaseOutbreaksResult> => {
    const entry = STATE_JURISDICTION[data.state];
    if (!entry) {
      return { status: "Error", error: "Unsupported state for Disease Outbreaks" };
    }

    const reportingPeriod = `${CURRENT_NNDSS.year} Week ${CURRENT_NNDSS.week}`;

    const url = new URL("https://data.cdc.gov/resource/x9gk-5huc.json");
    url.searchParams.set("label", "Measles, Indigenous");
    url.searchParams.set("year", CURRENT_NNDSS.year);
    url.searchParams.set("week", CURRENT_NNDSS.week);
    url.searchParams.set("states", entry.jurisdiction);

    try {
      const res = await fetch(url.toString());
      if (!res.ok) {
        return { status: "Error", error: `CDC NNDSS request failed: ${res.status}` };
      }
      const raw = (await res.json()) as Array<Record<string, unknown>>;

      if (!Array.isArray(raw) || raw.length === 0) {
        return {
          topic: "disease-outbreaks",
          state: data.state,
          stateLabel: entry.label,
          status: "Unavailable",
          freshness: reportingPeriod,
          rawData: raw ?? [],
          normalizedData: {
            condition: "Measles, Indigenous",
            reportingPeriod,
            reportedCases: 0,
            dataStatus: "Unavailable",
            source: "CDC NNDSS",
          },
        };
      }

      const row = raw[0];
      const m3Flag = typeof row.m3_flag === "string" ? row.m3_flag : undefined;
      const m3Raw = row.m3;
      const m3Num = typeof m3Raw === "number" ? m3Raw : typeof m3Raw === "string" ? Number(m3Raw) : NaN;

      let reportedCases = 0;
      let dataStatus: "Verified" | "Unavailable" = "Verified";
      let status: "Verified" | "Unavailable" = "Verified";

      if (m3Flag === "U" || m3Flag === "N") {
        dataStatus = "Unavailable";
        status = "Unavailable";
        reportedCases = 0;
      } else if (m3Flag === "-") {
        reportedCases = 0;
        dataStatus = "Verified";
        status = "Verified";
      } else if (!Number.isNaN(m3Num)) {
        reportedCases = m3Num;
        dataStatus = "Verified";
        status = "Verified";
      } else {
        dataStatus = "Unavailable";
        status = "Unavailable";
      }

      return {
        topic: "disease-outbreaks",
        state: data.state,
        stateLabel: entry.label,
        status,
        freshness: reportingPeriod,
        rawData: raw,
        normalizedData: {
          condition: "Measles, Indigenous",
          reportingPeriod,
          reportedCases,
          dataStatus,
          source: "CDC NNDSS",
        },
      };
    } catch (err) {
      return {
        status: "Error",
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  });