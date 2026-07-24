---
title: "Achievement-based funding — the cap-and-earn model"
date: 2026-07-24
kb-status: published
kb-type: methodology
tags: [methodology, funding, implementation-funding, incentive, measurability, cpl]
artifacts:
  - cpl_funding.js (earnFraction · collegeAlloc.earned_total · earnAgg · basis toggle)
  - tests/cpl_funding.test.js (Part E — achievement-based earning)
related:
  - "[[docs/cpl_funding_lessons]]"
  - "[[docs/kb-notes/reference-funding-metrics-measurability]]"
  - "[[docs/kb-notes/methodology-top-is-a-last-in-line-signal]]"
---

# Achievement-based funding — the cap-and-earn model

A reusable pattern for turning a **formula-based allocation** into an
**incentive-aligned disbursement**: pay each recipient for what it *actually
achieves*, proportional to a target, never above a ceiling — while degrading
gracefully where the achievement can't be measured yet.

Built for the CPL Implementation Funding tab (COBI), 2026-07-24, at Sam's
direction. The generic shape applies to any "allocate a pool by share, then
disburse on performance" program.

## The three layers

1. **Cap (potential allocation).** A deterministic entitlement — each recipient's
   share of the pool. Here: `headcount share × priority share × tranche` (see
   [[docs/kb-notes/methodology-generalize-a-calc-conserve-the-baseline]]). This is
   the **maximum** a recipient can be paid; it is *not* what they are paid.

2. **Target.** The performance bar the cap is measured against — a projected count
   (`headcount × projection %`). Crucially, this is where a "projection percent"
   that looked decorative earns a real job: it is the **denominator** of the
   achievement fraction, not a second dollar lever. (In the pre-cap-and-earn
   model the projection % moved no money; re-purposing it as the target is what
   makes the earn calculation meaningful without adding a knob.)

3. **Earned (disbursement).** `earned = cap × min(1, actual ÷ target)`.
   - Proportional: hit 50% of target → draw 50% of the cap. A recipient **never
     has to reach the full target to be funded** — this is the safeguard that
     lets varying-readiness recipients participate.
   - Capped: `min(1, …)` means overshooting the target **cannot** exceed the cap.
   - Unearned (`cap − earned`) **rolls forward** and re-levels in later periods.

## The measurability phase-in (the subtle part)

Real programs can only measure *some* metrics at first. Getting the *default for
the unmeasured cases right* is the whole ballgame, because it decides who gets
paid for doing nothing. Four states, and they are **not** the same:

| State | Meaning | Fraction | Why |
|---|---|---|---|
| **earned** | metric measurable, recipient has a datum | `min(1, actual/target)` | pay on the actual |
| **gap** | the *metric itself* isn't measurable for anyone yet (a data gap) | **1 (full advance)** | can't penalize what nobody can measure — advance until the feed lands |
| **pending** | the feed hasn't published this cycle (transient) | **1 (full advance)** | don't zero someone on a missing refresh |
| **none** | metric IS measurable, feed IS published, recipient posted **nothing** | **0** | this is the incentive — do nothing, earn nothing on that metric |
| **suppressed** | a privacy floor hid a small count (<5) | **0, flagged** | don't blind-credit an unverifiable value; surface it for a human |

The load-bearing distinction: **"the metric can't be measured" (gap/pending →
advance) vs. "this recipient didn't do it" (none → $0).** Collapsing those two
into one "no data → advance" rule silently pays non-participants their full cap
and kills the incentive. Collapsing them into "no data → $0" wrongly zeros
everyone the instant a feed is late or a whole metric is still a data gap. You
need both a **feed-loaded check** and a **per-recipient-datum check** to tell
them apart.

As feeds land (here: exhibit linkage, the Student Portal, the CO MIS match-back),
metrics move from **gap → earned** automatically, and the incentive sharpens on
its own — no code change, because the fraction is computed from the live feed +
the metric-content [[measurability]] resolver.

## Invariants to assert (money math is high-stakes)

- **Conservation / ceiling:** `earned ≤ cap` for every recipient, always
  (`min(1, …)` guarantees it — test it anyway).
- **Reduces to advance:** with no feed loaded, or every metric a gap, `earned ==
  cap` (the model degrades to the old entitlement). Assert this — it's the proof
  the overlay is non-destructive when there's no data.
- **The incentive identity:** a recipient absent from a *loaded* feed on the one
  measurable metric earns exactly `cap − (that metric's cap slice)` — its other
  (still-gap) slices advance in full. A crisp, non-hardcoded assertion.
- **Real disbursement = Σ recipients** (each on its *own* actuals), not the
  deduplicated statewide figure — dedup understates the money because a person at
  two colleges earns at both.

## UI shape (what made it legible)

- A **Potential ⇄ Earned** basis toggle; potential is the default so existing
  viewers see no change until they opt in.
- Earned mode overlays *the same* surfaces: pool gains **Earned so far /
  Unearned-rolls-forward** cards; each priority card gains an **earned-of-cap %**
  (or a "full advance until this metric's feed lands" note); the table's total
  column shows **earned of cap · % maxed**; the drill-in shows each priority's
  `earned of cap — actual ÷ target` (or the honest advance/$0/suppressed reason).
- Keep the column **keys** stable across modes (only labels + values change) so
  sort, CSV, and print don't fork.

## Why this matters beyond funding

Any program that (a) allocates by a formula and (b) wants to reward outcomes hits
this exact fork. The reusable lesson is the **measurability-aware default**: an
unmeasured cell is not a zero and not a free pass — its treatment depends on
*why* it's unmeasured, and that "why" has to be represented in the data
(gap vs. absent vs. suppressed vs. feed-not-loaded), not inferred from a single
`== null`.
