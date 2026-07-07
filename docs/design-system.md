# HealthSignal — Design System

Extracted from the working V0 prototype spec. Use as the direct reference for Lovable rebuild prompts — describe these specs rather than migrating code.

## UI Principles

- Calm, trustworthy, healthcare-inspired visual design
- One primary action per screen
- Mobile-first responsive layout
- Hero Risk Card as visual anchor
- Information grouped by priority
- Minimal cognitive load

## Interaction Design

- Calm visual hierarchy, smooth 150ms transitions, accessible color palette, minimal animation
- Focus attention on the Health Briefing, not the interface

## Hero Card Spec

The Health Risk Score card must show: Risk Level, Risk Score, Trend, Freshness, Data Source, Primary Recommendation.

**Risk Score can be `null`/`--`.** Only render a numeric score when the Alert Agent returns one — see "Card States" below for what to show instead when it doesn't.

## Freshness Rules — Cadence-Aware

Freshness is evaluated relative to each source's expected publishing cadence, not a flat "age of data" measurement — a weekly source that's several days old may still be the most current data that exists.

| Source | Expected Cadence | Verified | Recent | Stale | Unavailable |
|---|---|---|---|---|---|
| Air Quality (AirNow) | Hourly | Latest hourly update | < 24 hours | > 24 hours | No data |
| Flu (Delphi/ILINet) | Weekly, seasonal | Matches latest published release | One release behind | Multiple releases behind | No data / off-season pause |
| Disease Outbreaks (Measles, NNDSS) | Weekly | Matches latest published release | One release behind | Multiple releases behind | No data |

### Freshness Badge Copy
- **Air Quality:** "Verified · Updated Hourly · 10:00 AM"
- **Flu:** "Verified · Latest Weekly Release · Published June 26"
- **Disease Outbreaks:** "Verified · Latest CDC Weekly Release · MMWR Week 25, 2026"

## Card States (five states, every topic must support all five)

| State | When it fires | Content |
|---|---|---|
| **Empty** | No state/topic selected yet | "Choose a state," "Choose a topic" |
| **Loading** | Request in flight | "Fetching latest public health data..." |
| **Success** | Data present, freshness verified/recent | Full hero card: score, level, trend, freshness, recommendations |
| **Partial** | One topic/agent failed but others for this state succeeded | That topic's card shows its own Unavailable/Not-Tracked state (below) while the rest of the briefing renders normally — the Health Intelligence Manager assembles what's available rather than failing the whole briefing |
| **No Data / Unavailable** | `dataState: missing` — API failed, empty response, or `U` flag | See "Unavailable" card copy below — **not** a fabricated score |

### Disease Outbreaks — additional card states from confirmed CDC flag semantics

| `dataState` | Card shows | Risk Score |
|---|---|---|
| `present` (numeric) | "Reported Cases (Year-to-Date): [n]" | Scored normally |
| `confirmed_zero` (`-` flag) | "Reported Cases (Year-to-Date): 0" — Verified, Low Risk | **Scored as Low** — this is real good news, not missing data |
| `missing` (`U` flag or failed call) | "Unavailable — CDC did not receive usable data from this jurisdiction for this reporting period." | `--`, no score |
| `not_reportable` (`N` flag) | "Not Tracked in [State] — this condition isn't a reportable condition in this jurisdiction under current law." | `--`, no score, distinct from Unavailable |

**Do not collapse `confirmed_zero` and `missing` into one "no data" bucket.** A confirmed zero is scoreable, trustworthy information; a missing value is not. This is the single most important rule in this section.

### Air Quality — empty-response handling
An empty `[]` from AirNow means no monitoring station within the search radius — retry with a wider radius (50–75mi) before showing Unavailable. Card copy: "No current monitoring data available for this reporting area. Try another nearby location." Gray badge, no score, no trend, no recommendations.

### Flu — "no results" handling
A Delphi response of `result: -2` is genuinely missing data (seen for New York on Day 1 testing), not a zero-activity reading. Card copy: "No surveillance data reported for this state during the selected reporting period." Do not show Risk = Low here — there's no data to support any conclusion.

### Off-season (Flu only, distinct from all of the above)
> "Flu surveillance is between seasons. Showing the most recent data from [date]. Regular updates resume this Fall."
This is expected/normal, not a failure — don't use Unavailable copy here even though activity numbers are low.

## Trust Tooltips (small ⓘ next to freshness/case-count badges)

Tapping the info icon should show plain-language CDC semantics, reinforcing the trust-first principle:
- **On "0 reported cases":** "No reported cases means the reporting jurisdiction submitted data to CDC and reported zero cases for this reporting period."
- **On "Unavailable":** "Unavailable means CDC did not receive usable data from the reporting jurisdiction for this reporting period."
- **On "Not Tracked":** "This condition is not required to be reported to CDC in this state under current public health law."

## Colors

| Purpose | Color |
|---|---|
| Page background | `#F2FAF8` |
| Header background | `#0F6E56` |
| Header text | White / light teal `#9FE1CB` |
| Cards | White `#FFFFFF`, soft shadow, 0.5px teal border, 10–12px radius (20px on pills/badges) |
| AI Insight card | Gradient `#0F6E56` → `#085041`, white/light teal text |
| Why This Matters card | Soft green `#EAF3DE` |
| Footer | Light teal `#E1F5EE` |
| Unavailable/Not Tracked badge | Neutral gray — distinct from the green/amber/red risk scale, signaling "no verdict" rather than "low risk" |

## Risk Level Color Rules
| Level | Range | Color | Badge background |
|---|---|---|---|
| Low (incl. confirmed zero) | 0–30 | Green | Light green |
| Moderate | 31–60 | Amber `#BA7517` | `#FAEEDA` |
| Elevated | 61–75 | Amber `#BA7517` | `#FAEEDA` |
| High | 76–85 | Orange `#D85A30` | `#FCE8DC` |
| Critical | 86–100 | Red `#E24B4A` | `#FCEBEB` |

## Layout — Card Order
1. **Header** — logo, tagline, last-updated timestamp, trust line
2. **Selectors** — state pill, topic pill (Flu / Air Quality / Disease Outbreaks for V1)
3. **Health Risk Score (hero)** — score or `--`, status badge, 4-dot severity scale
4. **Alert banner** (High/Elevated/Critical only, and only when scored)
5. **[State] Health Snapshot** — 2×2 grid
6. **4-Week Trend** — SVG bezier sparkline, never bars
7. **What's Happening** — 2–3 sentence summary, respects dataState
8. **AI Insight** — 3 stat pills + forecast line
9. **Why This Matters**
10. **Who Should Pay Extra Attention**
11. **What To Do This Week** — exactly 3 items, or fallback general guidance if score is null
12. **Community Impact This Week** — 3-column color-coded metrics
13. **Footer** — disclaimer, copyright

## Sparkline Rules
Smooth SVG bezier curve, never a bar chart. 4 data points, plotted 0–100. Green→amber→red transition. Endpoint dot matches current risk color, or is grayed out if score is null.

## Copy Rules (what NOT to write)
- No "Coming Soon" placeholders in the main UI — use the dedicated Unsupported-State message instead
- No childish "explained in plain English" phrasing
- No dense paragraphs in AI Insight — use 3 stat pills
- Conversational tone ("Flu activity is rising across Texas"), not dashboard-speak
- Never show a bare age-based "Stale" badge for a weekly source that's actually current — pair status with cadence context
- Never show "0" for a topic that's actually Unavailable, and never show "Unavailable" for a topic that's actually a confirmed zero

## Unsupported State Message
> "Live data for [State] is coming soon. Currently showing data for 15 states."

## Confirmed Mock Data (10 of 15 states — reuse as seed/fallback)

| State | City | Risk Score | Level | Trend |
|---|---|---|---|---|
| Texas | Dallas-Fort Worth | 68 | Elevated | +21% |
| California | Los Angeles | 74 | High | +27% |
| Florida | Miami | 61 | High | +15% |
| New York | New York City | 52 | Moderate | +8% |
| Virginia | Northern Virginia | 45 | Moderate | +11% |
| Georgia | Atlanta | 79 | High | +31% |
| Illinois | Chicago | 58 | Moderate | +13% |
| North Carolina | Charlotte | 72 | High | +24% |
| Arizona | Phoenix | 83 | Critical | +38% |
| Washington | Seattle | 34 | Moderate | +6% |

Remaining 5 states (Colorado, Ohio, Michigan, Pennsylvania, Massachusetts) need equivalent seed data — real Measles YTD figures for these are already confirmed in `docs/api-notes.md` (Colorado 11, Ohio 10, Michigan 12, Pennsylvania 66, Massachusetts 1).

