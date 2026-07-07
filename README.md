# 🚀 HealthSignal

## Public Health Intelligence Made Simple

**Built for the AI Launchpad 2026 Hackathon**
**Mission Track:** Health & Wellbeing
**Status:** 🚧 In Development *(Hackathon Build: July 6–10, 2026)*

---

## Overview

HealthSignal transforms trusted public health data into personalized health briefings that help people make informed everyday decisions in under 30 seconds.

Instead of asking people to interpret surveillance reports and technical public health data, HealthSignal answers three simple questions:

- **What is happening?**
- **How serious is it?**
- **What should I do?**

---

## The Problem

Trusted public health information is widely available, but it is often difficult for everyday people to understand and use. Parents, caregivers, older adults, and travelers frequently need timely guidance without having to interpret surveillance reports, technical metrics, or multiple government data sources.

---

## The Solution

HealthSignal is a multi-agent AI system that transforms trusted public health data into a personalized health briefing in under 30 seconds.

By combining live public health data, AI-powered trend analysis, cadence-aware data freshness verification, and location-aware recommendations, HealthSignal delivers information people can trust, understand, and act upon.

---

## Why HealthSignal?

HealthSignal is built on three principles:

### ✅ Trust
Uses verified public health data with visible, cadence-aware freshness indicators so users know when information was last updated — and why a weekly source and an hourly source show different timestamps.

### ✅ Clarity
Transforms complex surveillance data into plain language health briefings that anyone can understand.

### ✅ Action
Provides personalized recommendations that help people make informed everyday decisions.

---

## Key Features

- Live public health data from trusted government sources
- State and health topic selection (Flu, Air Quality, Disease Outbreaks for V1)
- Personalized plain-language health briefings
- AI-powered trend analysis
- Cadence-aware data freshness verification (hourly vs. weekly sources)
- Risk scoring
- Personalized recommendations
- Favorite locations
- Historical trend tracking

---

## AI Architecture

HealthSignal uses a coordinated multi-agent architecture: one orchestrator and five specialist agents.

```text
                     Health Intelligence Manager
                                │
        ┌───────────────────────┼────────────────────────┐
        │                       │                        │
 Data Freshness Agent     Trend Analysis Agent    Health Topic Agent
        │                       │                        │
        └──────────────┬────────┴───────────────┬────────┘
                       │                        │
                 Alert Agent              Recommendation Agent
                       │
                       ▼
         Personalized Health Briefing
```

Each specialist AI agent performs a dedicated task before the Health Intelligence Manager synthesizes the results into a single personalized health briefing. The Alert Agent runs before the Recommendation Agent, since the Recommendation Agent's output depends on the Alert Agent's risk level.

Full one-page specs for each agent (Purpose, Input, Output, Prompt, Guardrails, Failure Handling) are in [`docs/agent-specs.md`](./docs/agent-specs.md).

---

## Technology Stack

| Layer | Technology |
|--------|------------|
| **Frontend** | Lovable |
| **AI** | Claude API |
| **Workflow Orchestration** | n8n |
| **Database & Memory** | Supabase (via Lovable Cloud) |
| **Flu Data** | Delphi Epidata API (mirrors CDC FluView/ILINet) |
| **Disease Outbreak Data** | CDC NNDSS Weekly Data — unified dataset, locked to Measles (Indigenous) for V1 |
| **Air Quality Data** | EPA AirNow API |
| **Heat Risk Data** | NWS/NOAA *(optional — see roadmap)* |
| **Version Control** | GitHub |

**Note on RSV:** RSV was evaluated during the hackathon build using the CDC NREVSS public dataset and deferred to a future version after two independent checks confirmed the public endpoint returns only historical 2015 data rather than current surveillance. Since HealthSignal's core principle is presenting only verified, current information, RSV was deferred rather than shipped with misleading freshness data. The architecture is topic-agnostic, so adding RSV later requires only a reliable current data source, not new agent logic.

---

## Screenshots

🚧 Screenshots will be added during the hackathon build.

---

## Live Demo

🌐 **Live Application** — *(Lovable deployment link will be added after deployment)*

🎥 **Demo Video** — *(Loom or YouTube demo link will be added after recording)*

---

## Documentation

- [Product Requirements Document](./docs/prd.md)
- [Design System](./docs/design-system.md)
- [Agent Specification Sheets](./docs/agent-specs.md)
- [API Notes](./docs/api-notes.md)
- [Supabase Schema](./docs/supabase-schema.md)

---

## Product Roadmap

### Version 1 — Hackathon MVP
- Live public health data — **required:** Flu, Air Quality, Disease Outbreaks; **optional/stretch:** Heat Risk
- 15 U.S. states
- AI-generated health briefings
- Trend analysis
- Risk scoring
- Cadence-aware data freshness indicators
- Favorite locations

### Version 1.1 — Fast Follow
- RSV, once a public dataset with genuinely current surveillance data is identified

### Version 2 — Personalization
- User accounts
- Saved preferences
- Personalized alerts
- Push notifications
- Saved health briefings
- Enhanced recommendation engine
- Heat Risk (if not completed in V1)

### Version 3 — Platform Expansion
- Coverage for all 50 U.S. states
- County and ZIP code level insights
- Additional public health topics
- Wearable integration
- Family health monitoring
- Weekly AI-generated health summaries

---

## Vision

HealthSignal is designed as a scalable AI platform that transforms trusted public health data into personalized, actionable health intelligence.

Its multi-agent architecture is designed to extend beyond the hackathon by supporting additional health topics, broader geographic coverage, and richer personalization. Future enhancements include county-level insights, family health monitoring, wearable integrations, and AI-generated weekly health summaries, creating a trusted digital health companion for individuals, families, caregivers, and community organizations.

---

## About

**Built by ThulirX Labs · Malar Manogaran (Solo Builder)**

AI Product Builder | Digital Health & Data Products | Product Strategy

HealthSignal was inspired by firsthand experience building public health data products and by the belief that trusted public health information should be understandable, transparent, and actionable for everyone.

---

⭐ *Thank you for visiting the HealthSignal repository.*

