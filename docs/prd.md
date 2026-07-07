# HealthSignal — Product Requirements Document

**Mission Track:** Health & Wellbeing
**Build Window:** July 5–10, 2026 (AI Launchpad Hackathon, Week 9)
**Application Type:** Solo

---

## 1. Problem Statement

Public health information exists across CDC dashboards, surveillance reports, and government data sources, but most of it is written for epidemiologists rather than everyday people. Parents, caregivers, older adults, and travelers need to make quick decisions without an easy way to understand local health conditions. The gap isn't data availability — it's trust and interpretability.

## 2. Target Users

- Parents deciding whether it's safe to send a child to school
- Caregivers checking conditions before visiting elderly family
- Travelers assessing health risk before visiting another state
- Anyone wanting a plain-language read on local public health conditions

## 3. Core Value Proposition

Answer three questions in under 30 seconds:
1. What is happening?
2. How serious is it?
3. What should I do?

**Distinguishing feature:** HealthSignal is not defined by agent count or number of APIs — it's defined by turning complex public health information into one trusted, personalized health briefing. Every design decision below is evaluated against that single outcome. HealthSignal solves one problem well; it does not become a diagnosis tool, hospital finder, medical chatbot, or symptom checker.

## 3a. Product Principles

HealthSignal is designed around four principles. Every feature decision should trace back to one of these:

1. **Trust First** — Never present information without showing its source and freshness.
2. **Clarity Over Complexity** — Translate technical surveillance data into plain language.
3. **Action Over Information** — Every briefing should help someone make an informed decision.
4. **Responsible AI** — Inform, never diagnose. Explain, never speculate.

## 3b. Product Success Metrics

**Hackathon MVP**
- Generate a personalized health briefing in under 5 seconds
- Display verified data freshness on every briefing
- Generate exactly three recommendations
- Successfully support 10–15 states
- Complete an end-to-end demo without manual intervention

**Future Product Metrics**
- User engagement
- Returning users
- Favorite locations saved
- Time to decision
- User trust survey

---

## 4. Final V1 Scope (Locked)

### Must Have (judge-visible)

**Core experience**
- State selection (10–15 states)

**Locked V1 State List (15):**
**Confirmed built (10, with unique mock data already in V0):** Texas (Dallas-Fort Worth), California (Los Angeles), Florida (Miami), New York (New York City), Virginia (Northern Virginia/Richmond), Georgia (Atlanta), Illinois (Chicago), North Carolina (Charlotte), Arizona (Phoenix), Washington (Seattle)
**New for hackathon (5, need mock/real data):** Colorado, Ohio, Michigan, Pennsylvania, Massachusetts

*(The original 10 already have full unique mock datasets — risk score, trend %, city, forecast text, sparkline shape — built and working in V0. Reuse this data as seed/fallback content while wiring live CDC data; don't rebuild from scratch.)*

**Unsupported-state message** (user selects a state outside the 15 — a scope message, not a failure). Confirmed working copy from V0, updated for the 15-state expansion:
> "Live data for [State] is coming soon. Currently showing data for 15 states."

This is distinct from the "No Data"/"Stale" failure states in Section 12, which apply to a *supported* state/topic when the Data Freshness Agent can't verify current data. Don't conflate "not built yet" with "temporarily broken" — they need different copy.

- Health topic selection
  - **Required (V1):** Flu, Air Quality, Disease Outbreaks (locked to **Measles, Indigenous** — see Section 14 for why this condition was chosen over Tuberculosis/Pertussis)
  - **Deferred to V1.1:** RSV — evaluated during the hackathon build and deferred because the publicly available CDC NREVSS dataset was confirmed (via two independent live checks the night before build) to return only historical 2015 records rather than current surveillance data. This is a data-quality decision consistent with HealthSignal's principle of presenting only verified, current information — not a time-management cut. The architecture remains topic-agnostic, so adding RSV later requires only connecting a reliable current data source, not new agent logic.
  - **Optional/Stretch:** Heat Risk — included only if a reliable integration is completed during the sprint (see Section 17 for why this one is genuinely uncertain, unlike the other topics)
- Personalized health briefing: hero risk score, trend, three recommendations, data freshness badge (cadence-aware — see `docs/design-system.md`)

**AI (5 specialist agents + 1 orchestrator — see Section 6)**
- Health Intelligence Manager (orchestrator)
- Data Freshness Agent
- Trend Analysis Agent
- Health Topic Agent
- Alert Agent
- Recommendation Agent

**Data**
- Delphi Epidata API (Flu) — key-free, verified live July 6
- CDC NNDSS Weekly Data, unified dataset (Disease Outbreaks) — key-free, single table covering all conditions, filtered by disease label/MMWR year/MMWR week; MVP locked to **Measles, Indigenous** (chosen over Tuberculosis/Pertussis for its currency, broad state coverage, and direct relevance to HealthSignal's target user — parents deciding about school attendance during an active national outbreak)
- EPA AirNow API (Air Quality) — key obtained, active
- NWS/NOAA (Heat Risk — optional/stretch, see Section 17)
- ~~CDC NREVSS (RSV)~~ — deferred to V1.1, see Section 4 topic scope above and `docs/api-notes.md` for the verification finding

**UX**
- Favorites (build last, per CycleGuide scope discipline below)
- Last Updated timestamp
- Unverified/stale data fallback
- Loading state
- Error state

### Explicitly Cut (V2/V3 — do not build for hackathon)
User login/auth · push notifications · weekly summaries · wearables/Apple Health · ZIP code precision · county precision · all 50 states · charts/complex dashboards

---

## 5. Known Failure Mode — Design Around It From Day 1

**Context:** HealthSignal is being rebuilt fresh in Lovable, not migrated from the Vercel/V0 version — so this isn't a bug to patch, it's a failure mode to avoid reintroducing during the new build.

The Week 7 V0 prototype's right column (AI insight, forecast, recommendations) was hardcoded to Texas and did not re-render per state selection; topic tabs weren't wired to state selection either. **When building the Lovable version, every card in Section 5c's list must read from the selected state/topic from the first working version — not bolted on after the fact.** This is the single most likely place for the same failure to recur, since it happened once already under the same basic architecture (state selector + dependent content cards).

---

## 5c. UI Reference — Reviewed from Live V0 Prototype (healthsignal-eight.vercel.app)

**Keep and carry into Lovable:**
- Health Risk Score card (0–100 scale, Normal/Moderate/High/Critical bands) — already close to the ClaimLens hero-card pattern; enlarge and add real color coding (green/yellow/orange/red) per band
- "What To Do This Week" — already exactly 3 recommendations, matches spec, don't change the count
- AI Insight section (trend %, consecutive-week streak, plain-language explanation) — well-designed, carry over as-is
- "Mock CDC Data · Educational Use Only" disclaimer — keep, update to reflect live data once connected

**New bug found (in addition to the Texas hardcoding):** the page currently shows **two conflicting freshness timestamps** — a global header ("Last updated: Jun 16, 2026 · 9:00 AM CST") and a separate snapshot card ("Updated 2 hrs ago"). These contradict each other. Since freshness/trust is the product's core claim, this must collapse to a single source of truth from the Data Freshness Agent before build is considered done — both the header and the snapshot card must read from the same shared state value, never hardcoded independently.

**State list scope:** the current UI lists all 50 states with only 10 wired ("coming soon" for the rest). For V1, trim the visible list to the actual 10–15 working states — a dead-end click during a live judge demo undermines credibility more than a shorter, fully-functional list does. All 50 states stays a roadmap item, not a UI element.

**Not portable from Vercel/v0 to Lovable:** actual code/components don't transfer. What transfers is the layout structure, content/copy, and this document — describe the reference screenshots to Lovable in build prompts rather than expecting a direct migration.

## 6. Agent Architecture

**Reconciliation note:** The real Week 8 design specifies 6 agents (including a separate Location Agent). Peer/advisor review recommends capping at 5 specialist agents to avoid overengineering in a 5-day build. These aren't in conflict: the Week 8 orchestrator already "receives the user's selected state and health topic" directly — meaning the Location Agent's function is redundant with what the orchestrator does by design. Folding it in removes duplication, not real functionality. The Alert Agent name is kept as-is from Week 8 (not renamed to an invented "Risk Assessment Agent") since it already does exactly what's needed for the hero risk card.

| Agent | Responsibility | Input | Output |
|---|---|---|---|
| **Health Intelligence Manager** (orchestrator) | Coordinates specialist agents, assembles final briefing | User's selected state + topic | Final personalized briefing |
| **Data Freshness Agent** | Verifies data is current relative to each source's expected publishing cadence; triggers fallback when stale/missing | Raw API response + source cadence | Freshness status + last-updated timestamp |
| **Trend Analysis Agent** | Identifies whether conditions are improving, stable, or worsening | Historical data points | Trend direction |
| **Health Topic Agent** | Applies correct logic per topic (Flu, Air Quality, Disease Outbreaks for V1) | Raw topic data | Plain-language interpretation |
| **Alert Agent** | Assigns Low/Medium/High risk level; high-risk alerts shown only when data is verified fresh | Trend + topic + freshness status | Risk level + alert flag |
| **Recommendation Agent** | Generates three simple, actionable recommendations | Topic interpretation + Alert Agent's risk level | Three recommendations |

*(Table order above reflects actual execution order: Alert Agent runs before Recommendation Agent, since Recommendation needs the risk level as input. See `docs/agent-specs.md` and `docs/orchestration_agentsd.docx` for the full call sequence.)*

### Agent Spec Format (one page each, to be completed per agent before build)
- **Purpose**
- **Input**
- **Output**
- **Prompt**
- **Guardrails**
- **Failure Handling**

---

## 7. Data Flow

```
User
 ↓
Lovable (UI)
 ↓
n8n (orchestration)
 ↓
CDC Open Data API / EPA AirNow API / Delphi Epidata API
 ↓
Data Freshness Agent
 ↓
Trend Analysis Agent
 ↓
Health Topic Agent
 ↓
Alert Agent (risk scoring)
 ↓
Recommendation Agent
 ↓
Health Intelligence Manager (assembles briefing)
 ↓
UI (Health Briefing displayed)
```

This diagram doubles as the architecture diagram and the demo narration script.

## 7a. User Journey

```
Open App
 ↓
Choose State
 ↓
Choose Topic
 ↓
Generate Briefing
 ↓
Read Risk
 ↓
Review Recommendations
 ↓
Save Favorite
```

This is the user-facing counterpart to the technical data flow above — useful as a basis for a wireframe or demo slide.

---

## 8. Functional Requirements

```
User selects state
 ↓
User selects topic
 ↓
System retrieves latest CDC data
 ↓
Freshness verified (cadence-aware)
 ↓
Trend calculated
 ↓
Risk scored
 ↓
Recommendations generated
 ↓
Health Briefing displayed
```

## 9. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Response time | Under 5 seconds |
| Availability | CDC/API failure handled gracefully (never a blank screen) |
| Transparency | Timestamp always displayed |
| Accessibility | Plain language throughout — no epidemiological jargon |

## 10. Guardrails & Responsible AI

HealthSignal is designed to support informed decisions, not replace professional medical advice. The system:

1. Never diagnoses medical conditions.
2. Never predicts outcomes beyond what the data supports.
3. Never estimates or fills in missing data — shows it's missing instead.
4. Always displays the data source.
5. Always displays freshness/last-updated status.
6. If data is stale or unverified, clearly indicates this rather than presenting it as current.
7. Uses plain language appropriate for the general public — no unexplained medical/epidemiological jargon.

## 11. Acceptance Criteria (example)

**Given** Texas, Flu
**When** user clicks Generate
**Then** risk card shown, trend shown, recommendations shown, freshness shown, source shown

## 12. UI States (design before July 6)

| State | Content |
|---|---|
| **Empty** | "Choose a state," "Choose a topic" |
| **Loading** | "Fetching latest public health data..." |
| **Success** | Full health briefing (hero risk card + trend + recommendations) |
| **No Data / Unavailable** | "No current data available for this topic in this state. Try another location." — fires when `dataState` is `missing` (failed API call, empty response, or a source's explicit "unavailable" flag) |
| **Partial** | "This topic's data is currently unavailable — other topics for this state remain available." — fires when one topic/agent fails but others for the same state succeed; the Health Intelligence Manager still assembles a briefing for the working topics rather than failing entirely |
| **Error** | "Unable to retrieve latest information" |
| **Stale** | "Updated [X] releases ago — showing last verified data" (worded per cadence, not raw hours, since weekly sources shouldn't be flagged Stale just for being days old) |
| **Off-season** | "Flu surveillance is between seasons. Showing the most recent data from [date]. Regular updates resume this Fall." — distinct from Stale: this is expected/normal, not a data failure. Applies specifically to Flu given ILINet's seasonal reporting pause (see `docs/api-notes.md`). Do not use "Stale" copy here, or the Data Freshness Agent will read as broken when it's functioning correctly. |

**Critical distinction, confirmed against CDC's own flag definitions (see `docs/api-notes.md`):** a data point can be `present` (real number), `confirmed_zero` (source explicitly reported zero — e.g. NNDSS's `-` flag), `missing` (source couldn't provide data — e.g. NNDSS's `U` flag, an empty AirNow response, or Delphi's `result: -2`), or `not_reportable` (condition isn't legally tracked in that jurisdiction — NNDSS's `N` flag). **`confirmed_zero` is real, scoreable data (Low Risk) — it must never be shown as "No Data," and `missing` must never be shown as "0."** Collapsing these into one bucket would either hide good news or fabricate a false reading. See `docs/agent-specs.md` (Data Freshness Agent, Alert Agent) for the enforcement logic.

---

## 13. Internal Design Principles

These principles were shaped by cohort peer review and study of related product patterns, generalized here as HealthSignal's own design standards rather than attributed comparisons:

- **Documentation-first discipline:** Write masterplan, agent specs, and data flow before sending build prompts to Lovable — keeps prompts short, avoids drift, credits go to building not rework.
- **Graceful failure handling:** On missing/delayed data, fall back to a rule-based default and flag it clearly — never silently predict or guess. This is exactly the kind of thing judges test by intentionally breaking a data source.
- **Trust through transparency:** Show *"Data unavailable — showing last verified update"* instead of hiding gaps or silently reusing stale numbers. Directly addresses the trust gap identified in Week 7 peer review.
- **Scope discipline:** The public health briefing *is* v1. Favorites/personalization is the last feature built, not the first. The RSV deferral (Section 4) is this same discipline applied to data quality, not just feature count.
- **Hero-card visual anchor:** A large, color-coded score card as the single visual anchor, with supporting detail below it — not scattered as equal-weight data points.
- **One problem, solved well:** Stay focused — do not expand into diagnosis, hospital finder, symptom checker, or medical chatbot territory.

---

## 13a. Peer Validation (Week 7)

The freshness indicator and favorites features aren't speculative additions — they were the two most-requested fixes from cohort peer review of the Week 7 V0 prototype:
- One reviewer identified the exact bug this PRD locks as "fix first" (Section 5): switching states left the AI insight/forecast column still referencing Texas.
- Another reviewer flagged a real ~3-day data lag between the displayed "Last updated" timestamp and their review date, and proposed a "Data Freshness Indicator" — directly validating the freshness-badge requirement in Section 4.
- A third reviewer suggested marking favorite states for tracking family/travel destinations — directly validating the Favorites feature scope.

This gives V1 a credible answer if a judge asks "how did you decide what to build" — it's not guesswork, it's responding to real user feedback on a working prototype.

## 14. Data Sources

| Topic | Source | Auth Required | Notes |
|---|---|---|---|
| Flu | **Delphi Epidata API** (mirrors CDC FluView/ILINet — not a direct Socrata dataset) | No | Off-season (ILINet surveillance pauses seasonally, resumes Fall 2026); freshness is cadence-aware, not flat-threshold — verified live July 6 |
| Disease Outbreaks | **CDC NNDSS Weekly Data — unified dataset** (`x9gk-5huc`) | No | Single table covers all notifiable conditions, filterable by disease label, MMWR year, MMWR week. **MVP locked to Measles, Indigenous** — confirmed live, 1,833 YTD cases nationally as of week 25, broad coverage across target states. Chosen over Tuberculosis/Pertussis for currency and relevance to the target user (parents deciding about school). Supersedes the earlier per-condition-table approach — those older tables (e.g. Table 1JJ) are archival only as of CDC's 2026 migration. |
| Air Quality | EPA AirNow API | **Yes — key required (obtained, active)** | Real-time hourly data; reporting-area/zip based, not clean state rows |
| RSV *(deferred to V1.1)* | CDC NREVSS via Open Data API (Socrata) | No | Confirmed via two independent live checks that the public endpoint returns only 2015 data — not current. Deferred, not built for V1. |
| Heat Risk *(optional/stretch)* | NWS/CDC HeatRisk (GIS raster/ImageServer, not JSON) or NOAA CDO as a simpler proxy | No / Token for NOAA CDO | **Optional/stretch for V1** — see Section 17 |

Full endpoint details, exact URLs, and field-level notes are in `docs/api-notes.md`.

## 15. Technology Stack

- **Frontend/App:** Lovable
- **Orchestration:** n8n
- **AI Reasoning:** Claude API
- **Memory/Database:** Supabase (via Lovable Cloud)
- **Data Sources:** Delphi Epidata API (Flu), CDC NNDSS Weekly Data unified dataset (Disease Outbreaks), EPA AirNow API (Air Quality), NWS/NOAA (Heat Risk, if built)
- **Version Control:** GitHub

## 16. Why 10–15 States, Not 50

A 5-day build with live multi-agent orchestration across 50 states introduces data-reliability risk (rate limits, inconsistent state-level data, freshness gaps) that would surface live during judging. The architecture is state-agnostic — adding a state is a configuration change, not a rebuild — so this is a launch-scope decision, not a technical limitation.

## 17. Risk: External Data Source Dependencies

**Air Quality:** Only topic requiring external signup (API key). Mitigation: build and fully test the other topics first (key-free). Wire in Air Quality once core loop works. Key already obtained and confirmed active (see `docs/api-notes.md`).

**Heat Risk — higher risk than originally scoped.** Research (see `docs/api-notes.md`) found the official HeatRisk product is a GIS raster service, not a simple JSON API, and the CDC HeatRisk Dashboard is currently down for maintenance. **Recommendation: treat Heat Risk as a stretch goal, not committed V1 scope.**

**Flu data source correction:** State-level flu data comes from the Delphi Epidata API (Carnegie Mellon, mirrors CDC FluView), not a direct CDC Socrata dataset. Verified live July 6; freshness is cadence-aware. See `docs/api-notes.md` for the exact endpoint.

**RSV data-currency risk — resolved by deferral.** The CDC NREVSS public endpoint was confirmed via two independent live checks to return only historical 2015 data. Rather than force an unreliable integration or display misleading freshness, RSV is deferred to V1.1. This is documented as a deliberate data-quality decision, not a gap — see Section 4 and `docs/api-notes.md` for the full rationale and the judge-facing explanation.

**Disease Outbreaks — risk reduced and finalized.** The original assumption of "no unified NNDSS endpoint" was outdated; CDC's consolidated `x9gk-5huc` dataset (live since 2022) covers all conditions in one table, simplifying the Disease Outbreak Agent to a single query pattern. Schema fully confirmed Day 1, locked to Measles (Indigenous), with documented handling for all four CDC data-quality flags (numeric, `-`, `U`, `N`) — see `docs/api-notes.md` and `docs/agent-specs.md`.

**Multi-state data gaps — expected, not a build blocker.** Day 1 testing found real per-state gaps that are data facts, not bugs: New York has no Flu surveillance data (`result: -2` from Delphi) and several zip codes returned no AirNow monitoring station within the search radius. These are handled by the Data Freshness Agent's `missing` classification and the app's Partial/Unavailable UI states (Section 12) — the app should never fail or fabricate data for these gaps, and should still deliver a briefing for whichever topics do have data for that state.

## 18. Success Criteria (Hackathon Submission)

- Live, publicly accessible app (no login required, or demo credentials provided)
- All 5 specialist agents + orchestrator functioning end-to-end for all selected states and V1 topics (Flu, Air Quality, Disease Outbreaks)
- Visible, accurate, cadence-aware data freshness indicators
- Demo video (2–5 min): problem, solution, live walkthrough, AI functionality, impact
- Public GitHub repository with README, architecture doc, and this PRD

## 19. Future Vision (V2/V3)

- **V1.1 (fast-follow):** RSV, once a public dataset with genuinely current surveillance data is identified
- **V2:** Supabase authentication, saved user accounts, push notification alerts, saved briefings, Heat Risk (if not completed in V1)
- **V3:** County/ZIP-level precision, all 50 states, wearable integration (Apple Health), family monitoring mode, AI-generated weekly summaries
- **V4 (directional, not near-term):** Community Health Watch, Family Health Dashboard, Travel Health Assistant, School Health Briefings — included to show platform potential, not as committed roadmap items

The long-term vision extends HealthSignal beyond the hackathon into a standalone product for families, caregivers, and community health organizations needing trustworthy, real-time health guidance without interpreting raw surveillance data themselves.

