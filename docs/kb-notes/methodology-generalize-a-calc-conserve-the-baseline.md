---
title: Methodology — Generalize a hardcoded calc by reducing it to the old form, then assert conservation
created: 2026-07-23
updated: 2026-07-23
tags: [methodology, refactoring, testing, funding, conservation, session-skyfunder]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cpl_funding_lessons]]"
  - "[[docs/kb-notes/methodology-three-layer-scenario-config]]"
  - "[[docs/kb-notes/methodology-commit-the-test-harness]]"
artifacts:
  - cpl_funding.js (CORE_REVENUE / CORE_DEDUCTION / grossRevenue / grossDeduction / netBeforeFeeder)
  - tests/cpl_funding.test.js (C1c conservation assertion)
---

# Methodology — Generalize a hardcoded calc, conserve the baseline

> **One-sentence summary** — when you turn a fixed formula into a configurable one
> (add/remove/relabel its terms), write the general form so it *provably reduces to
> the old formula* under the old inputs, and pin that with a conservation test — so a
> feature that adds knobs changes zero existing numbers.

## Context

The Implementation Funding net-college pool was a hardcoded expression:

```js
function netBeforeFeeder() {
  return poolField("remaining_2025_26") + poolField("one_time_2026_27")
       - poolField("admin_cost") - poolField("scaling_projects_tech");
}
```

Sam asked to make the funding-pool boxes **add/deletable and relabelable**. That means
the four fixed terms become a *variable* set of revenue and deduction line-items. The
risk: any slip in the generalization silently shifts every one of the 115 college
allocations (all downstream of this number).

## The claim

Generalize in two moves, and let a test hold the line:

1. **Reduce-to-old-form.** Express the general calc as sums over *classified* terms,
   seeded so the default configuration is exactly the old term set:

   ```js
   var CORE_REVENUE   = [{field:"remaining_2025_26"}, {field:"one_time_2026_27"}];
   var CORE_DEDUCTION = [{field:"admin_cost"}, {field:"scaling_projects_tech"}];
   function grossRevenue()  { /* Σ non-hidden CORE_REVENUE + Σ custom revenue */ }
   function grossDeduction(){ /* Σ non-hidden CORE_DEDUCTION + Σ custom deduction */ }
   function netBeforeFeeder(){ return grossRevenue() - grossDeduction(); }
   ```

   With no custom items and nothing hidden, `grossRevenue()−grossDeduction()`
   is *term-for-term* the old expression. Downstream callers (`netCollege`,
   `perYear`, every allocation) are untouched.

2. **Assert conservation.** A single test states the invariant against the *baked data*,
   not against the code (so it can't drift with the code):

   ```js
   const bakedNet = P.remaining_2025_26 + P.one_time_2026_27 - P.admin_cost
                  - P.scaling_projects_tech - P.feeder_carveout - P.rural_carveout;
   check("net matches the baked formula (conservation)",
     Math.round(T._netCollege()) === Math.round(bakedNet));
   ```

   Then test the *new* behavior separately (add a revenue box → net rises by its
   amount; flip to deduction → subtracts; delete → returns to baseline; hide a core
   box → excluded). The conservation test is the safety net; the behavior tests are
   the feature.

## Corollaries

- **Classify, don't special-case.** Each term carries a *kind* (revenue / deduction /
  carve-out / computed). The math sums by kind; the UI renders by kind (deletable vs
  structural vs derived). One classification drives both.
- **Keep the structural/derived terms out of the knobs.** Carve-outs and computed
  cards were made non-deletable — they have their own sections or are pure functions
  of other inputs. Generalizing the *inputs* doesn't mean generalizing the *outputs*.
- **Round before comparing** floating-point money in the assertion (`Math.round`), or
  a benign `0.0000001` defeats the conservation check.

## When to reuse

Any time a fixed formula gains configurable terms: a budget with add-a-line-item, a
score with pluggable signals, a rollup with optional cohorts. The pattern is
provider-agnostic and cheap — it's one extra test that says "the new general thing,
with old inputs, is the old thing."

## Pitfalls

- Don't assert conservation against a re-derivation of the *new* code (it will pass
  vacuously). Anchor it to the committed baseline data or a hand-computed constant.
- A string that lands in an `<input value>` must use real characters (—), never HTML
  entities (`&mdash;`) — jsdom won't surface the literal, real Chromium will. (Caught
  exactly this on the generalized pool labels.)
