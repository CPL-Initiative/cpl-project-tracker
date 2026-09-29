---
title: Retiring a behavior means inverting its tests, not deleting them
created: 2026-09-15
updated: 2026-09-15
tags: [methodology, testing, governance]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
artifacts:
  - tests/cpl_funding_basis.test.js
  - tests/cpl_funding_basis_locked.test.js
---

# Retiring a behavior means inverting its tests, not deleting them

> **One-sentence summary** — when an authorized decision removes a feature, its assertions become absence guards naming the ruling, because a deleted assertion is indistinguishable from one that was never written.

## Context

On 2026-09-15 Sam retired the headcount allocation basis from the Implementation Funding tab. Six
assertions in `cpl_funding_basis.test.js` existed to prove the basis SWITCH worked — the exact
behavior being removed. Deleting them would have gone green immediately and left no trace that the
property had ever been guarded.

This is distinct from the standing prohibition on skipping or quarantining a test to get green. Here
the tested behavior was removed on purpose; what must not vanish is the RECORD that it was removed
and the guarantee that it stays removed.

## The three moves

**1. Invert the assertion.** Part E required the basis switch to move 2–25% of the pool. It now
requires a stored `"headcount"` to move **not one dollar**, and every institution to read identically
on both stored values. Same fixture, opposite expectation, and the ruling named in the comment.

**2. Retarget a property that outlives the feature.** Part D proved that an unbound institution's
share equals its size share of the unbound remainder — proven ON the headcount basis, but the
property is about the solver, not the basis. It was re-pointed at credit + noncredit FTES rather
than dropped. It still holds to under $1, which independently confirms the one-pool sizing formula.

**3. Guard the STORED value, not just the control.** The removal's real risk was never the UI. The
reader chain was `SCENARIO.allocationBasis` → `SHARED.allocationBasis` → the bake, so deleting only
the control would have left a saved `"headcount"` silently re-sizing the allocation with nothing on
screen offering the choice. The load-bearing assertion is behavioral: same config, same awards, with
and without a stored basis.

## Scope the guard to the ruling, not to a word

The same change swept a sentence reading *"this year's metrics are headcount-denominated"*. A test
caught it: that sentence describes the METRIC, not the allocation basis, and is true on a path where
a headcount metric renders. The new guard asserts that nothing names headcount as the **allocation
basis** — asserting on the bare word would have re-broken a true sentence on every future run.

**The test that caught it was doing its job.** A retirement sweep is exactly when a suite earns its
keep, and a failure during one is information, not an obstacle.

## Measure before removing

The removal was argued on "dead policy" for two sessions and shipped the day it was measured:
flipping the basis moved **69 of 118 awards**, largest single change **$110,391**. A ruling the code
does not enforce is one misclick from being undone, and the size of the misclick is what makes the
case.
