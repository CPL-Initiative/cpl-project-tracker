---
title: A published asset with zero uptake is an outreach worklist, not a build backlog
created: 2026-08-05
updated: 2026-08-05
tags: [methodology, cpl, exhibits, outreach, measurement, worklist]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/noncredit_cpl_lessons]]"
  - "[[docs/noncredit_cpl_thinking]]"
artifacts:
  - nc_learning_partners.js
  - kb/nc_learning_partners.json
---

# A published asset with zero uptake is an outreach worklist, not a build backlog

> **One-sentence summary** — When a system tracks *things built*, the built-and-unused
> ones are invisible; query for them explicitly and you get the cheapest available
> volume, because the expensive part is already done.

## Context

Programs that build shared assets — articulations, exhibits, crosswalks, templates,
integrations — usually measure **construction** (how many exist) and **outcomes**
(how much flowed). Almost nobody measures the gap between them: assets that were
built, published, and then never used.

That gap is invisible by default because it falls between the two metrics everyone
already watches. A "we have 84 statewide exhibits" headline and a "we transcribed
55,068 units" headline can both be true while most of the 84 have never produced a
single unit.

## The finding that produced this

Querying MAP's credential layer for **statewide exhibits published at 2+ colleges
with zero transcribed units**:

- **49 dormant exhibits across 252 college-slots**
- **Only 30 of 84 statewide exhibits have ever converted a unit — 64% have not**
- CompTIA Linux+ live at **16 colleges**, never used
- The Correctional Officer Core Course (CDCR/CPOST) and Standards & Training for
  Corrections — the Rising Scholars population — dormant at **11 and 10**

None of this was hidden. It had simply never been asked for.

## Why it matters

**A dormant published asset is the cheapest volume in the system**, because the
expensive part is finished: the faculty determination is made, the equivalence is
approved, the colleges are signed on. What's missing is that nobody told the students
or the counselors.

This inverts the default strategic instinct. Facing a shortfall, the reflex is *build
more*. But when 64% of what you built has never been used, the correct move is
**light up what exists** — and that's an outreach problem with a named list, not a
curriculum problem with a budget.

## The pattern

1. **Name the two metrics you already track.** Construction (assets built) and
   outcome (volume flowed).
2. **Query the join, filtered to zero.** Assets that exist AND have no outcome.
3. **Set a floor that removes noise.** A single-site asset is usually mid-rollout,
   not dormant — we required ≥2 published sites. Tune the floor to your rollout
   shape.
4. **Rank by reach, not age.** `sites_published × 0 uptake` — a thing published at
   16 sites and unused is a bigger miss than one published at 2.
5. **Compute it live, never hand-copy it.** A pasted list is stale the day the first
   one converts, and a stale worklist sends people chasing finished work. Ours
   recomputes from the source dataset at render time.
6. **Distinguish it from failure.** Dormant ≠ broken. Say "completed work awaiting
   outreach," because the people who built it are the people you're about to ask for
   help.

## Where else this applies

Any system with a build phase and an adoption phase, where the two are measured
separately:

- Published crosswalks / articulations / equivalencies nobody routes students through
- Integrations shipped but never enabled by the receiving side
- Templates, playbooks, or guidance documents with no downstream citations
- Grant-funded deliverables completed and not operationalized
- Feature flags shipped dark and never turned on

## Pitfalls

- **Zero can mean "too new."** Add a floor, or an age filter, or both.
- **Zero can mean the measurement is broken**, not the adoption — confirm the outcome
  metric actually reaches this asset class before concluding nobody used it.
- **Don't report dormancy as a count alone.** "49 dormant" invites a shrug;
  "49 across 252 college-slots, and CompTIA Linux+ is live at 16 colleges with zero
  awards" is actionable and names the first call.
- **Resist folding it into the build backlog.** The whole point is that these need a
  *different* kind of work than the un-built ones.

## See also

- [`docs/noncredit_cpl_thinking.md`](../noncredit_cpl_thinking.md) §7a Finding 3
- [`methodology-omit-dont-zero-an-absent-measure`](methodology-omit-dont-zero-an-absent-measure.md)
  — the sibling discipline: an absent measure and a measured zero are different facts
