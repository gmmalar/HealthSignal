// Freshness Agent — deterministic classification of data freshness per source cadence.
// Does not call any LLM. Pure logic only.

export type FreshnessStatus = "Verified" | "Recent" | "Stale" | "Unavailable";
export type FreshnessCadence = "hourly" | "weekly";

export interface FreshnessResult {
  status: FreshnessStatus;
  cadence: FreshnessCadence;
  timestamp: string;
  badge: string;
  reason: string;
}

const TZ_OFFSETS: Record<string, string> = {
  EST: "-05:00",
  EDT: "-04:00",
  CST: "-06:00",
  CDT: "-05:00",
  MST: "-07:00",
  MDT: "-06:00",
  PST: "-08:00",
  PDT: "-07:00",
  AKST: "-09:00",
  HST: "-10:00",
  UTC: "+00:00",
  GMT: "+00:00",
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function cadenceFor(topic: string): FreshnessCadence {
  return topic === "air-quality" ? "hourly" : "weekly";
}

function unavailable(cadence: FreshnessCadence, reason: string): FreshnessResult {
  return {
    status: "Unavailable",
    cadence,
    timestamp: "",
    badge: "No Data Returned",
    reason,
  };
}

// Parse AirNow-style freshness string, e.g. "2026-07-06 9:00 CST".
function parseHourlyTimestamp(raw: string): { iso: string; hour: string; tz: string } | null {
  const trimmed = (raw || "").trim();
  if (!trimmed) return null;
  const m = trimmed.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}):(\d{2})(?:\s+([A-Z]{2,5}))?$/);
  if (!m) return null;
  const [, date, hh, mm, tz = "UTC"] = m;
  const offset = TZ_OFFSETS[tz] ?? "+00:00";
  const hourNum = parseInt(hh, 10);
  const iso = `${date}T${String(hourNum).padStart(2, "0")}:${mm}:00${offset}`;
  return { iso, hour: `${hourNum}:${mm}`, tz };
}

// Parse a flu release date like "2026-07-06" or "20260706".
function parseIsoDate(raw: string): { iso: string; year: number; month: number; day: number } | null {
  const trimmed = (raw || "").trim();
  if (!trimmed) return null;
  let y: number, mo: number, d: number;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    [y, mo, d] = trimmed.split("-").map(Number);
  } else if (/^\d{8}$/.test(trimmed)) {
    y = parseInt(trimmed.slice(0, 4), 10);
    mo = parseInt(trimmed.slice(4, 6), 10);
    d = parseInt(trimmed.slice(6, 8), 10);
  } else {
    return null;
  }
  if (!y || !mo || !d) return null;
  const iso = `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}T00:00:00+00:00`;
  return { iso, year: y, month: mo, day: d };
}

// Parse CDC NNDSS reporting period, e.g. "2026 Week 25".
function parseMmwrWeek(raw: string): { iso: string; year: number; week: number } | null {
  const trimmed = (raw || "").trim();
  const m = trimmed.match(/^(\d{4})\s+Week\s+(\d{1,2})$/i);
  if (!m) return null;
  const year = parseInt(m[1], 10);
  const week = parseInt(m[2], 10);
  // Approximate the week's Saturday (MMWR week ends Saturday) as a stable ISO anchor.
  // Downstream agents can refine; this keeps the timestamp field ISO 8601.
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Dow = jan4.getUTCDay() || 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - (jan4Dow - 1));
  const weekSaturday = new Date(week1Monday);
  weekSaturday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7 + 5);
  const iso = weekSaturday.toISOString().replace(/\.\d{3}Z$/, "+00:00");
  return { iso, year, week };
}

function classifyHourly(freshness: string, lastUpdated: string): FreshnessResult {
  const raw = freshness || lastUpdated;
  const parsed = parseHourlyTimestamp(raw);
  if (!parsed) {
    return {
      status: "Unavailable",
      cadence: "hourly",
      timestamp: "",
      badge: "No Data Returned",
      reason: "Timestamp missing or invalid",
    };
  }
  const t = Date.parse(parsed.iso);
  if (Number.isNaN(t)) {
    return {
      status: "Unavailable",
      cadence: "hourly",
      timestamp: "",
      badge: "No Data Returned",
      reason: "Timestamp missing or invalid",
    };
  }
  const ageHours = (Date.now() - t) / (1000 * 60 * 60);
  let status: FreshnessStatus;
  let reason: string;
  if (ageHours < 24) {
    status = "Verified";
    reason = "Updated within the last 24 hours";
  } else if (ageHours <= 72) {
    status = "Recent";
    reason = "Updated within the last 1–3 days";
  } else {
    status = "Stale";
    reason = "No update in over 3 days";
  }
  return {
    status,
    cadence: "hourly",
    timestamp: parsed.iso,
    badge: `Updated Hourly · ${parsed.hour} ${parsed.tz}`,
    reason,
  };
}

function classifyFlu(freshness: string, lastUpdated: string): FreshnessResult {
  const raw = freshness || lastUpdated;
  const parsed = parseIsoDate(raw);
  if (!parsed) return unavailable("weekly", "No data returned from source");
  const monthName = MONTH_NAMES[parsed.month - 1] ?? "";
  return {
    status: "Verified",
    cadence: "weekly",
    timestamp: parsed.iso,
    badge: `Latest Weekly Release · Published ${monthName} ${parsed.day}, ${parsed.year}`,
    reason: "Latest published weekly release",
  };
}

function classifyDiseaseOutbreaks(freshness: string, lastUpdated: string): FreshnessResult {
  const raw = freshness || lastUpdated;
  const parsed = parseMmwrWeek(raw);
  if (!parsed) return unavailable("weekly", "No data returned from source");
  return {
    status: "Verified",
    cadence: "weekly",
    timestamp: parsed.iso,
    badge: `Latest CDC Weekly Release · Week ${parsed.week}, ${parsed.year}`,
    reason: "Latest published weekly release",
  };
}

export function classifyFreshness(args: {
  topic: string;
  freshness: string;
  lastUpdated: string;
}): FreshnessResult {
  const { topic, freshness, lastUpdated } = args;
  const cadence = cadenceFor(topic);

  if (!freshness && !lastUpdated) {
    return unavailable(
      cadence,
      cadence === "hourly" ? "Timestamp missing or invalid" : "No data returned from source",
    );
  }

  if (topic === "air-quality") return classifyHourly(freshness, lastUpdated);
  if (topic === "flu") return classifyFlu(freshness, lastUpdated);
  if (topic === "disease-outbreaks") return classifyDiseaseOutbreaks(freshness, lastUpdated);

  return unavailable(cadence, "No data returned from source");
}