---
title: Validate a derived metric against the expert's ranking before publishing it
created: 2026-08-06
updated: 2026-08-06
tags: [methodology, metrics, measurement, funding]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cpl_funding_lessons]]"
artifacts:
  - funding/_build_cr_backlog.py
  - tests/funding_cr_backlog_test.py
---

# Validate a derived metric against the expert's ranking before publishing it

> **One-sentence summary** — when a domain expert can already name the top
> performers, that list is a free test set: a metric that disagrees with it is
> measuring something else, however defensible its arithmetic.

## Context

The $50k tab needed a measure of which colleges are "doing CPL well." Sam named
three he knew to be adept at the full student lifecycle — Moreno Valley,
Cabrillo, Bakersfield — **before** any metric was computed. That offhand list
turned out to be the most valuable input of the session.

## The claim

**Score the candidate metric against the expert's ranking first.** Four metrics
were tried on the same data:

| Metric | MVC | Cabrillo | Bakersfield |
|---|---:|---:|---:|
| Applied students per 1,000 enrolled | 5th | **29th** | **34th** |
| Applied ÷ eligible units | 13th | 24th | 8th |
| Transcribe completion | 3rd | low | **very low** |
| **Disposition rate** | **3rd** | **13th** | **6th** |

Only the last put all three in the top thirteen of 106, against a **median of
4.7%**. The first three were each arithmetically sound and each measured
something real — just not the thing the expert meant by "adept."

Two corollaries:

- **A metric that disagrees with the expert is a hypothesis about the expert
  being wrong.** Sometimes that's right, but it is a claim requiring evidence,
  not a default. Here it was wrong every time.
- **The disagreement is diagnostic.** Transcribe-completion ranked Merced at 99%
  — which on inspection was a *batch AP/IB upload*, auto-transcribed by
  construction, not lifecycle mastery. The metric's failure to match the expert
  is what surfaced the contamination.

## How we got here

Volume metrics kept crowning colleges with large military populations, because a
JST upload auto-applies Basic Training credit against an already-articulated
exhibit — volume without the per-CR work that defines the practice. The
disposition rate (share of credit recommendations carrying *any* disposition:
Applied / Not Applicable / In Process) measures the action a college actually
controls, and it reproduced the expert ranking on first computation.

## When this applies (and when it doesn't)

Applies to any derived score that will be shown to the people being scored —
funding formulas, readiness tiers, quality indices. The cost of asking for a
ground-truth list is one sentence; the cost of publishing a metric that ranks
known-good performers mid-pack is the credibility of the whole instrument.

Does **not** apply where the expert's list is itself the thing under audit, or
where the metric is deliberately measuring a different construct — in which case
say so explicitly rather than letting readers assume it means "good."

## See also

- `[[docs/cpl_funding_lessons]]` — 2026-08-06 section
- PR `#1014` — `funding/_build_cr_backlog.py`
- `[[methodology-a-summary-must-share-the-unit-of-its-detail]]`

---

*Authoring check: durable · reusable · distilled · self-contained.*
