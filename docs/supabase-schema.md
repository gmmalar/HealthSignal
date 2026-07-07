# HealthSignal — Supabase Schema

Built via Lovable Cloud (confirmed working — see prep notes). No user authentication in V1, so no `auth.users` dependency; favorites and history are session/anonymous-based or tied to a simple local identifier if needed later.

## Tables

### `favorites`
Stores states a user has marked to track.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, primary key | auto-generated |
| `state` | text | one of the 15 locked states |
| `created_at` | timestamptz | default `now()` |

*(No `user_id` in V1 — no auth. If a lightweight "remember this browser" identifier is wanted, add a `session_id` text column populated from a client-generated UUID stored in local state, not auth.)*

### `briefing_cache`
Stores the most recently generated briefing per state/topic, used both as a performance cache and as the "last verified update" fallback source when live data is stale/unavailable (per PRD Guardrail 6 and the Data Freshness Agent).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, primary key | auto-generated |
| `state` | text | one of the 15 locked states |
| `topic` | text | Flu / RSV / Air Quality / Disease Outbreaks / Heat Risk |
| `risk_level` | text | Low / Medium / High |
| `risk_score` | int | 0–100 |
| `trend_direction` | text | rising / stable / falling |
| `summary` | text | plain-language summary from Health Topic Agent |
| `recommendations` | jsonb | array of exactly 3 strings |
| `freshness_status` | text | verified / recent / stale / unavailable |
| `source_updated_at` | timestamptz | the actual timestamp from the CDC/AirNow/Delphi source |
| `cached_at` | timestamptz | when HealthSignal last wrote this row |

*(One row per state+topic combination, upserted each time a fresh briefing is generated — this is what "showing last verified update" reads from when live data can't be fetched.)*

### `topic_availability` (new — build this alongside `briefing_cache`, not after)
Static per-state/topic config confirming which combinations have real live data, seeded from Day 1 API testing (see `docs/api-notes.md` for the full test results). The app checks this table **before** calling any live API, so an unsupported combination shows the correct card state immediately instead of discovering a gap live during a demo.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, primary key | auto-generated |
| `state` | text | one of the 15 locked states |
| `topic` | text | Flu / Air Quality / Disease Outbreaks |
| `is_available` | boolean | whether this state/topic combination has confirmed live data |
| `known_data_state` | text | `present` / `confirmed_zero` / `missing` / `not_reportable` / `untested` — the expected classification based on Day 1 testing, used as a fallback hint if the live call itself times out |
| `notes` | text | e.g. "No Delphi data for this state" or "AirNow — retry wider radius before live call" |

**Seed data from Day 1 testing (`docs/api-notes.md`):**
- New York, Flu → `is_available: false`, `known_data_state: missing`, notes: "Delphi returns result: -2, no results"
- New York, Air Quality → `is_available: false` (pending wider-radius retry), notes: "Zip 13421 returned empty array at 25mi radius"
- All 15 states, Disease Outbreaks (Measles) → `is_available: true` — confirmed either numeric or `confirmed_zero` for every target state
- Remaining state/topic combinations not yet tested → `known_data_state: untested`; the app should still attempt a live call for these rather than blocking, and update this table once confirmed

**Design note:** this table is a fast-path optimization and demo-safety net, not a replacement for the Data Freshness Agent — the live agent call is still the source of truth each time; this table just lets the UI pre-emptively show the correct card state (or a "likely unavailable" hint) without waiting on a live call that's already known to fail for that combination.

### `trend_history` (optional — only if time allows post-core-build)
Stores prior risk scores per state/topic to show "what's changed since last visit," per the original Week 8 design.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, primary key | auto-generated |
| `state` | text | |
| `topic` | text | |
| `risk_score` | int | |
| `recorded_at` | timestamptz | default `now()` |

## Build Priority
Per the PRD's scope discipline (Section 13 — "the public briefing is v1 core, favorites is last"):
1. **`topic_availability`** and **`briefing_cache`** first, together — both are load-bearing for the trust/freshness guardrail, not personalization features. Build alongside the Data Freshness Agent.
2. **`favorites`** — build last, once the core briefing loop works end to end.
3. **`trend_history`** — stretch goal, only if V1 core + favorites are solid with time remaining.

## Notes for the build
- Ask Lovable directly to create these tables via chat prompt (e.g., *"Create a table called briefing_cache with these columns: ..."**) rather than writing raw SQL — Lovable Cloud handles this from plain language, as confirmed in prep testing.
- No Row Level Security policies needed for V1 since there's no auth and no private user data — revisit if V2 adds accounts.

