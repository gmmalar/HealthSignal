# HealthSignal

**Explainable Multi-Agent AI.**
**Built on live government public health data.**

HealthSignal transforms live government surveillance data into trustworthy, plain-language public health briefings using deterministic AI reasoning and LLM-powered communication.

---

## Problem

Trusted public health information is widely available, but it's often difficult for everyday people to understand and use. Valuable information is spread across surveillance systems and technical public health reports, making it difficult to quickly understand what is happening locally and whether the information is still current. Feedback from an early HealthSignal prototype consistently highlighted the need for live data, location-specific insight, and visible data freshness — revealing that the real challenge wasn't access to information, but confidence that the information was current and relevant.

## Solution

HealthSignal turns live government public health data into clear, trustworthy, plain-language briefings across three health topics and up to 13 U.S. states.

HealthSignal answers three simple questions for every briefing: **What is happening? How serious is it? What should I do?**

**Target users:** parents, caregivers, older adults, travelers, and anyone seeking trusted public health information when making everyday decisions.

---

## Explainable AI by Design

HealthSignal separates deterministic reasoning from language generation. A Health Intelligence Manager orchestrates three deterministic specialist agents — Freshness, Trend, and Alert — before invoking Claude to generate a plain-language briefing.

**Claude is used exactly once in the pipeline — only to explain, never to decide.**

**Typical AI application**
```
LLM
  ↓
Output
```

**HealthSignal**
```
Government data
  ↓
Deterministic AI reasoning
  ↓
Claude explanation
  ↓
Health briefing
```

That's a fundamentally different architecture.

### Why a Multi-Agent Architecture?

Instead of relying on a single LLM prompt, HealthSignal separates reasoning into specialized agents:

- **Freshness Agent** validates whether data is current.
- **Trend Agent** analyzes historical changes.
- **Alert Agent** evaluates attention level using deterministic rules.
- **Health Topic Agent** converts verified findings into natural language.

The Health Intelligence Manager coordinates each agent in sequence, passing verified outputs between agents so that every stage builds on validated information before the final explanation is generated. This separation improves transparency and explainability, and reduces hallucination risk by ensuring factual reasoning occurs before language generation.

### Design Principles

- **Live government data only** — never simulated or fabricated.
- **Deterministic reasoning before LLM generation** — factual analysis is rule-based and auditable.
- **Explainable AI** — every reasoning step can be inspected independently.
- **Graceful handling of missing data** — HealthSignal never invents unavailable public health information.

---

## How HealthSignal Thinks

![How HealthSignal Thinks](https://raw.githubusercontent.com/gmmalar/HealthSignal/main/docs/architecture/how_healthsignal_thinks.png)

Each agent in the pipeline answers one specific question, in sequence, before the briefing is produced. This is the clearest way to see that Claude is not doing everything — it only writes the explanation after the other agents have already reasoned over the data.

This sequential reasoning pipeline makes every stage independently testable, auditable, and reusable across future health topics.

## AI Orchestration Flow

The Health Intelligence Manager coordinates a sequential reasoning pipeline:

1. Retrieve live government surveillance data.
2. Normalize data into a common structure.
3. Run deterministic Freshness, Trend, and Alert agents.
4. Pass verified findings to Claude.
5. Generate a plain-language health briefing.

## System Architecture

![Current Architecture](https://raw.githubusercontent.com/gmmalar/HealthSignal/main/docs/architecture/current_architecture.png)

This orchestration ensures that reasoning is transparent, repeatable, and explainable — while reserving the LLM exclusively for communication. Three live government data sources feed a shared adapter and normalization layer. Three deterministic agents — Freshness, Trend, and Alert — run before Claude is ever invoked. Claude's Health Topic Agent is used exclusively to translate already-verified findings into a plain-language summary; it never determines facts.

## Roadmap Preview

![Future Platform Vision](https://raw.githubusercontent.com/gmmalar/HealthSignal/main/docs/architecture/future_platform.png)

A conceptual view of where HealthSignal is headed — clearly separated from what's built today. Full roadmap details are further below.

---

## Live Data Coverage

| Topic | Live Source | States | Validation |
|---|---|---|---|
| Air Quality | EPA AirNow | 4 | :white_check_mark: **4/4 verified** |
| Flu | Delphi Epidata | 7 | :white_check_mark: **7/7 verified** |
| Disease Outbreaks | CDC NNDSS | 13 | :white_check_mark: **13/13 verified** |

Every supported state/topic combination was validated against live government data before submission. Coverage varies by topic because each public health data source has different geographic availability. The State selector is topic-aware — only combinations with verified live data are selectable, so every option in the app is guaranteed to return real results.

## AI Agents

| Agent | Execution | Purpose |
|---|---|---|
| **Freshness Agent** | **Deterministic** | Validates publication cadence and freshness |
| **Trend Agent** | **Deterministic** | Detects direction and strength of change |
| **Alert Agent** | **Deterministic** | Evaluates attention level using rules |
| Health Topic Agent | Claude Sonnet (LLM) | Produces plain-language summaries |

Three of four agents are fully deterministic. Claude is used exactly once in the pipeline — only to explain, never to decide.

---

## Built vs Planned

| Feature | MVP | Planned |
|---|---|---|
| Live EPA AirNow | :white_check_mark: | |
| Live Delphi Epidata | :white_check_mark: | |
| Live CDC NNDSS | :white_check_mark: | |
| Freshness Agent | :white_check_mark: | |
| Trend Agent | :white_check_mark: | |
| Alert Agent | :white_check_mark: | |
| Health Topic Agent (Claude) | :white_check_mark: | |
| Dynamic weekly release detection | | :soon: |
| Historical data persistence | | :soon: |
| n8n orchestration | | :soon: |
| Personalized notifications | | :soon: |

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Lovable, React, TypeScript, TanStack Start |
| AI | Claude Sonnet |
| Data Sources | EPA AirNow, Delphi Epidata, CDC NNDSS |
| Architecture | Multi-agent orchestration, deterministic rule engines |
| Version Control | GitHub |

## Known Limitations

**Weekly Data Release Cadence**

Weekly surveillance data follows the publication cadence of the underlying public health sources. Flu surveillance is retrieved from the latest available Delphi weekly release, and Disease Outbreak surveillance is currently aligned with the latest validated CDC NNDSS publication (Week 25, 2026 at the time of submission). During validation, Week 26 was confirmed as not yet published by either source, so the displayed data represents the most current verified release available.

The current MVP references the latest validated reporting week explicitly. A future enhancement will automatically detect and consume newly published weekly releases as they become available, eliminating the need to reference a specific reporting week.

**Trend Detection Coverage**

The Trend Agent is fully generic and topic-agnostic, but currently only the Flu adapter retrieves multi-period historical data. Air Quality and Disease Outbreaks return single-period snapshots today, so trend analysis is not yet available for those topics — the architecture requires no changes to support them once their adapters are extended to retrieve historical data.

---

## Roadmap

**Near-term**
- Automatic weekly release detection
- Historical Air Quality support
- Historical Disease Outbreak support
- Expanded state coverage

**Long-term**
- Persistent briefing history (Supabase)
- Automated orchestration (n8n)
- Personalized notifications
- Personalized recommendations

The items above are explicitly planned work and are not part of the current MVP.

---

## Status

**HealthSignal MVP is feature complete.** All live data adapters have been validated against every supported state and are frozen for the remainder of the hackathon. All four AI agents — orchestrated by the Health Intelligence Manager — are built, wired, and verified end-to-end. Remaining work is limited to documentation, presentation assets, and hackathon submission materials.

Current MVP scope: 3 live health topics, up to 13 validated U.S. states, 4 production-ready AI agents.

## Credits

- Deterministic health reasoning designed and implemented by HealthSignal.
- Plain-language summaries generated using Claude Sonnet.
- Public health data provided by:
  - U.S. CDC
  - EPA AirNow
  - Delphi Group at Carnegie Mellon University

## About

**Built by ThulirX Labs**

**Malar Manogaran**

AI Product Builder • Digital Health • Data Products

HealthSignal was created to make trusted public health information understandable, transparent, and actionable for everyone.

---

:star: Thank you for visiting the HealthSignal repository.
