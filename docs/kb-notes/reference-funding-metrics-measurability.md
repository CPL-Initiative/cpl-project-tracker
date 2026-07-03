---
title: Reference — Funding priority metrics, measurability map (2026-07-03 metric set)
created: 2026-07-03
updated: 2026-07-03
tags: [reference, funding, metrics, map-platform, mis, data-gaps, session-98]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cpl_funding_lessons]]"
  - "[[docs/kb-notes/reference-p1-completion-data-gap]]"
  - "[[docs/kb-notes/adr-funding-priority-metrics-privacy]]"
artifacts:
  - funding/_build_funding_performance.py
  - cpl_funding.js (the MEASURABILITY map)
---

# Reference — Funding priority metrics: what we can measure today, and what closes each gap

> **One-sentence summary** — of the six 2026-07-03 year-specific funding
> metrics, two are measurable from today's daily MAP Custom Report feed
> (plus one more with a small builder extension); the other three need
> exhibit linkage, origin tracking, or the CO MIS match-back.

## The available dataset

The daily feed is MAP Custom Report **`View_StudentAggregatedValues_APIDataset`**
(pseudonymous per-student rows: college, MAP Internal StudentID, **Eligible
Credits, Transcribed Credits**, test/potential flags). It carries **credit
totals per student** — NOT the exhibits behind them, and NOT where the student
came from. Consumed daily by `funding/_build_funding_performance.py` under the
ratified privacy ADR (aggregate counts only, <5 suppressed).

## The measurability map

| Year | Priority metric | Measurable today? | What's missing / what closes it |
|---|---|---|---|
| Y1-P1 | Headcount with any transcribed CPL | ✅ **YES** — distinct students with Transcribed Credits > 0 (already computed daily; 16,251 statewide as of 2026-07-03) | — |
| Y1-P2 | Headcount with Eligible CPL based on **Statewide Credit Recommendations** | ❌ | Eligible credits are per-student **totals with no exhibit linkage** — we can't tell which eligibility traces to a CCC-collaborative (statewide) exhibit. **Ask MAP for an exhibit-level eligibility view** (StudentID × ExhibitID × CollaborativeType, or even just a per-student "any eligibility via CCC exhibit" flag) in the Custom Report. |
| Y1-P3 | Headcount with transcribed credit from **CPL Portal or CPL Landing Page** | ❌ | Origin/provenance isn't captured anywhere. **The Student Portal ships in ~2 weeks — bake a `source` stamp into it at launch** (portal / landing-page / staff-entered, set at account-creation or credit-request time and carried onto the transcription record, exposed in the Custom Report). Retrofitting later loses history — this is the time-critical ask. |
| Y2-P1 | Units of Transcribed CPL | 🟡 **DERIVABLE** — the same dataset has per-student Transcribed Credits; summing units per college is a ~15-line extension to the daily builder | Extend `_build_funding_performance.py` to emit `units` (Σ transcribed credits per college + statewide). |
| Y2-P2 | Headcount with **Completion** and 3+ Transcribed CPL Units | 🟡 half | The 3+-units half is derivable today (same builder extension, threshold 3). **Completion is the known gap** (`reference-p1-completion-data-gap.md`): completions live in college SIS/MIS, not MAP → needs the **CO MIS match-back** (below). |
| Y2-P3 | Headcount with CPL **Matched in MAP and MIS** | ❌ | Needs the **MAP↔MIS student match** — the same build as Y2-P2's completion half. This metric is effectively "the match exists," which is exactly P3's interoperability intent. |

## The two structural asks (sequenced)

1. **NOW (Portal launch window):** origin tracking (Y1-P3) + the exhibit-level
   eligibility view (Y1-P2) are **MAP-side additions**. Origin is urgent —
   provenance must be stamped at the source from day one of the Portal.
2. **Year-2 runway:** the **CO MIS match-back** unlocks BOTH Y2-P2 and Y2-P3
   with one build: ① an ID-coverage report from MAP (what share of students
   carry a CCCID usable for matching), ② the CO matches MAP records to MIS
   enrollment + SP (award) files, ③ optionally the CAEL-style replication
   study. The Year-2 placement of these metrics is well judged — MIS files lag
   annually, and there's a year to build the match.

## Current wiring

`cpl_funding.js` carries this table as its `MEASURABILITY` map: measurable
metrics show live actuals (Y1-P1 = the daily any-transcribed count); gap
metrics render an honest "⏳ data gap" line naming what closes it. The daily
builder still emits the legacy `p2` (≥6 units) key — retained for the future
≥3-unit rebuild, unused by the cards today.
