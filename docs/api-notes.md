HealthSignal — API Notes

Researched July 4, 2026. Finalized July 6, Day 1 — all three V1 sources are live-confirmed with real field mappings, flag semantics, and multi-state coverage below. This is the settled reference; nothing here should change without a new live test.

---

## Day 1 Final Status

| Topic | Status | Key finding |
|---|---|---|
| Flu (Delphi) | ✅ Live, multi-state confirmed | TX/CA/FL/AZ/NC/IL/WA all return real data; NY returns no results |
| Air Quality (AirNow) | ✅ Live, multi-zip confirmed | Most target zips return data; 4 zips returned empty (no monitor in range) |
| Disease Outbreaks (Measles, Indigenous) | ✅ Live, locked | 1,833 YTD cases nationally, real coverage across most target states |
| RSV | ❌ Deferred to V1.1 | Two independent checks: only 2015 data available |
| Heat Risk | ⚠️ Stretch goal | Not tested — raster format, dashboard down |

---

## Flu

Base URL: `https://api.delphi.cmu.edu/epidata/fluview/`
Auth: None. Key fields: `ili`, `wili`, `region`, `epiweek`, `release_date`.
Timestamp field: `release_date` — use for freshness, not `epiweek`.

**Multi-state verification (Day 1):** Queried `tx`, `ca`, `fl`, `az`, `nc`, `il`, `wa` for epiweeks 202620–202626 — all returned real data, `release_date: "2026-06-26"`, consistent off-season `ili`/`wili` values (roughly 0.5–2.9% depending on state). **`ny` returned `result: -2, "no results"`** — genuinely no data, not an error to retry. This matches the known caveat that ILINet is voluntary and state coverage varies.

**Card behavior for NY (and any state with `result: -2`):** show the **Unavailable** state for Flu specifically — "No surveillance data reported for this state during the selected reporting period." Do not show Risk = Low; you don't have data to support any risk conclusion, per the empty-vs-zero distinction below.

**Freshness:** cadence-aware, not flat. A June 26 release checked in early July (~10 days) is still **Verified** — it's the most recent release Delphi has published, not stale. Cadence: **Weekly, seasonal.**

---

## Disease Outbreaks — LOCKED: Measles, Indigenous

**Why Measles over Tuberculosis/Pertussis (originally considered):** as of the live outbreak this year, national cases are in the low thousands across 40+ jurisdictions — genuinely current, high-coverage, and narratively relevant to HealthSignal's own target user (parents deciding about school). TB/Pertussis would have been technically fine but much quieter and less demo-compelling.

**Source:** `https://data.cdc.gov/resource/x9gk-5huc.json` (NNDSS Weekly Data, unified dataset — covers all 42 notifiable conditions in one table; the old per-condition tables like 1JJ/1Q are archival-only per CDC's March 2026 migration notice, do not use)

**Confirmed schema (16 columns):**

| Column | API field | Use |
|---|---|---|
| Reporting Area | `states` | State/jurisdiction name |
| Current MMWR Year | `year` | Freshness |
| MMWR Week | `week` | Freshness |
| Label | `label` | Filter to `"Measles, Indigenous"` — **not** `"Measles, Imported"` (the small travel-related slice; nearly empty since ~99% of 2026 cases are locally-acquired) |
| Current week | `m1` | Optional "new this week" — frequently null even in active states |
| Current week flag | `m1_flag` | See flag semantics below |
| Previous 52-week max | `m2` | Trend Analysis Agent input |
| Cumulative YTD current year | `m3` | **Primary severity indicator** |
| Cumulative YTD previous year | `m4` | Year-over-year comparison |
| Location | `location1`, `location2`, `geocode` | State name / region grouping / lat-long |

**Confirmed flag semantics (CDC's own published footnote, verified against real data):**

| Flag | Meaning | Card treatment |
|---|---|---|
| *(numeric value)* | Real reported count | Show the number, Verified, score normally |
| `-` | **No reported cases** — jurisdiction submitted data, reported zero | Show **"0 reported cases," Verified, Low Risk** — this is good news, not missing data |
| `U` | **Unavailable** — jurisdiction couldn't send data to CDC | Show **"Unavailable," no risk score** — genuinely missing |
| `N` | **Not Reportable** — condition isn't legally reportable in that jurisdiction | Show **"Not Tracked in [State]"** — distinct from both above; this is a regulatory fact, not a data gap |
| `NC` (seen on `m2` only) | Likely "Not Calculated" — insufficient history for a 52-week rolling max | Trend Analysis Agent should treat as insufficient data for that input, not zero |

**Verified live, `label='Measles, Indigenous'`, year 2026, week 25:** National `m3: 1833`. Real per-state coverage confirmed across most target states — Pennsylvania (66), Ohio (10), Michigan (12), Illinois (3), Indiana (9), Florida (137), Virginia (143), Texas (46), Arizona (24), California (49) — plus confirmed genuine zeros (`m3_flag: "-"`) for Connecticut, Missouri, Delaware, DC, Alabama, Mississippi, Arkansas, Louisiana, Oklahoma, Wyoming. **`U` and `N` flags confirmed to exist in the dataset generally** (found on Babesiosis/Hepatitis rows from 2022) but did not appear anywhere in the Measles/2026/week-25 slice — build the handling defensively, but don't expect to see it in your actual demo data.

**Design rule:** use `m3` (cumulative YTD) as the primary severity number — `m1` is frequently null/zero even during real active spread due to normal weekly reporting lumpiness, and treating a null `m1` as "outbreak over" is a real interpretation error to avoid.

**No dedicated timestamp field** — infer freshness by comparing returned `year`/`week` against the actual current MMWR week. As of Day 1 (~week 27), most recent available release is week 25 — a ~2 week lag is normal for this source.

**Query pattern:**
```
https://data.cdc.gov/resource/x9gk-5huc.json?$where=label='Measles, Indigenous' AND year='2026' AND week='25'&$limit=60
```
(Returns all jurisdictions in one call — filter down to your 15 states client-side rather than querying per-state.)

**UI naming:** keep user-facing label "Disease Outbreaks" (already in submission materials); internal implementation is "CDC NNDSS Weekly Data, Measles (Indigenous)."

---

## RSV — DEFERRED FROM V1

Dataset ID 52kb-ccu2 (NREVSS). Confirmed dead via two independent live checks — both returned only `repweekdate: "31OCT2015"` regardless of sort order. Genuinely stale, not caching.

**Alternative source evaluated (Day 1): RSV-NET, dataset `29hc-w46k`.** This is a genuinely different, currently-live CDC system (hospitalization rates, not lab-test positivity) — confirmed via live query returning real 2025-26 season data (`week_ending_date: "2026-06-13"`, ~3 weeks old). However, RSV-NET only covers 58 counties across a small number of participating states (confirmed live: California, Georgia, New York, Colorado, Michigan, Washington — 6 of our 15 target states; the "District of Columbia" label was checked and confirmed empty, ruling out any DC-mislabeling ambiguity). The remaining 9 target states (Texas, Florida, Virginia, Illinois, North Carolina, Arizona, Ohio, Pennsylvania, Massachusetts) have no coverage in this network at all — not a data-freshness gap, but a structural surveillance-scope gap that would require a third distinct UI state ("Not in Surveillance Network," separate from both "Unavailable" and "Not Tracked") to represent honestly.

**Decision: still deferred to V1.1.** Even with a live, current alternative source identified, coverage of 6/15 states doesn't justify the added card-state complexity for a non-required topic on a 5-day build. This was evaluated thoroughly, not skipped — two independent data sources checked, one confirmed dead, one confirmed live-but-structurally-limited.

**Judge-facing rationale (updated):** "We evaluated two CDC RSV data sources during the build. The primary source (NREVSS) was confirmed via two independent checks to return only historical 2015 data. We then identified and live-tested an alternative (RSV-NET), which is genuinely current, but its surveillance network covers only 6 of our 15 target states by design — it's a 58-county sentinel network, not a national system. Rather than build inconsistent, partial coverage into V1, we deferred RSV entirely and documented both findings for V1.1. The architecture remains topic-agnostic, so adding RSV later requires only a data-source decision, not new agent logic."

---

## Heat Risk

GIS raster/ImageServer, not JSON. CDC HeatRisk Dashboard down for maintenance as of July 4. **Stretch goal only** — NOAA CDO (`ncei.noaa.gov/cdo-web/api/v2`) as a simpler proxy if time allows.

---

## Air Quality — CONFIRMED LIVE, multi-zip tested

**Source:** EPA AirNow API. Key confirmed active as of July 6 (new keys can take a few hours to activate — "Invalid API key" on a fresh key is likely just this, not a typo).

**Multi-zip Day 1 results:**

| Zip | Area | Result |
|---|---|---|
| 75201 | Dallas-Fort Worth, TX | ✅ O3 64, PM2.5 59, PM10 23 |
| 27607 | Wake County, NC | ✅ O3 44, PM2.5 60, PM10 18 |
| 32801 | Orlando, FL | ✅ O3 29, PM2.5 36 (no PM10 monitor) |
| 86001 | Flagstaff, AZ | ✅ O3 47 only |
| 93001 | Oxnard, CA | ✅ O3 23, PM2.5 17, PM10 22 |
| 85215 | Salt River, AZ | ✅ O3 48, PM10 26 (no PM2.5 monitor) |
| 75078 | TX (alt) | ✅ full data |
| 13421 | NY | ❌ empty `[]` |
| 85925 | AZ (alt) | ❌ empty `[]` |
| 75087 | TX (alt) | ❌ empty `[]` |
| 85091 | AZ (alt) | ❌ empty `[]` |

**Empty-array handling:** an empty `[]` means no AirNow monitoring station within the queried radius — **not** zero pollution. Retry with a wider radius (50–75 miles) before concluding a state/zip has no coverage:
```
https://www.airnowapi.org/aq/observation/zipCode/current/?format=application/json&zipCode={zip}&distance=75&API_KEY={key}
```
If still empty after a wider radius, show the **Unavailable** state — "No current monitoring data available for this reporting area. Try another nearby location." Never show a fabricated AQI.

**Design rule — multi-pollutant handling:** AirNow returns one row per pollutant (O3, PM2.5, PM10) for a reporting area, not one combined number. **The overall AQI is the highest individual pollutant AQI** (EPA's own "dominant pollutant" convention). E.g. Dallas: report AQI 64 (Moderate), dominant pollutant O3 — not an average, not the first one returned.

Granularity: reporting-area/zip-based — map each state to a representative zip (capital or largest city), with a backup zip in case the primary has no monitor. Rate limit: 500/hour, no concern at this scale. Cadence: **Hourly**, confirmed genuinely live (`DateObserved`/`HourObserved` matched real current date/hour on test).

**Data reliability disclaimer (AirNow's own fact sheet):** data is preliminary/unvalidated, for public reporting/forecasting only, not official regulatory use — worth a line in the app footer.

---

## Summary Table (final)

| Topic | Base | Auth | Cadence | V1 Status |
|---|---|---|---|---|
| Flu | Delphi Epidata API | None | Weekly, seasonal | ✅ Required — verified live, multi-state |
| Air Quality | EPA AirNow | Key (active) | Hourly | ✅ Required — verified live, multi-zip |
| Disease Outbreaks | CDC NNDSS, Measles (Indigenous), `x9gk-5huc` | None | Weekly | ✅ Required — verified live, schema + flags confirmed |
| RSV | CDC NREVSS (Socrata) | None | Weekly | ❌ Deferred to V1.1 |
| Heat Risk | NWS HeatRisk / NOAA CDO | None / Token | — | ⚠️ Stretch goal |

## Per-State Data Availability (as tested, Day 1 — see `docs/supabase-schema.md` for the config table this feeds)

| State | Air Quality | Flu | Measles |
|---|---|---|---|
| Texas | ✅ | ✅ | ✅ (46 YTD) |
| California | ✅ | ✅ | ✅ (49 YTD) |
| Florida | ✅ | ✅ | ✅ (137 YTD) |
| New York | ⚠️ retry wider radius | ❌ Unavailable | ✅ (5 YTD) |
| Virginia | untested | untested | ✅ (143 YTD) |
| Georgia | untested | untested | ✅ (1 YTD) |
| Illinois | untested | ✅ | ✅ (3 YTD) |
| North Carolina | ✅ | ✅ | ✅ (19 YTD) |
| Arizona | ✅ | ✅ | ✅ (24 YTD) |
| Washington | untested | ✅ | untested |
| Colorado | untested | untested | ✅ (11 YTD) |
| Ohio | untested | untested | ✅ (10 YTD) |
| Michigan | untested | untested | ✅ (12 YTD) |
| Pennsylvania | untested | untested | ✅ (66 YTD) |
| Massachusetts | untested | untested | ✅ (1 YTD) |

**Remaining test gaps before demo:** Virginia/Georgia/Washington/Colorado/Ohio/Michigan/Pennsylvania/Massachusetts need Air Quality + Flu spot-checks; New York Air Quality needs the wider-radius retry. These aren't blockers for starting the build — wire the agents against the confirmed states first, fill in the rest during testing.

