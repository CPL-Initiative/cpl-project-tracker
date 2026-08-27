---
title: A defect that produces the value you expected is invisible
created: 2026-08-27
updated: 2026-08-27
tags: [methodology, verification, funding, measurement, testing]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-a-metric-matched-by-its-prose-mis-measures-once-a-second-lane-exists]]"
  - "[[methodology-omit-dont-zero-an-absent-measure]]"
artifacts:
  - cpl_funding.js
  - tests/cpl_funding_metric_pin.test.js
  - docs/cpl_funding_lessons.md
---

# A defect that produces the value you expected is invisible

> **One-sentence summary** — When you already know what a number should read, a
> bug that happens to produce that number cannot be caught by looking at it; the
> only thing that can catch it is checking WHERE the number came from.

## Context

The CPL funding tab was about to gain a noncredit lane whose measures nothing
delivers yet, so Sam ruled the row must show its targets with **current earnings
at zero**. Separately, `measurability()` resolves a priority to its data source by
substring-matching the metric's **prose**, and every noncredit metric — written in
his own words, naming the noncredit *landing page* — matched the **credit** lane's
portal-origin measure `pp_u` instead.

Both facts were known. Their intersection was not.

## The claim

`pp_u` is **25.0 units statewide, carried by 3 of 105 colleges**. So the mis-wired
noncredit lane would have rendered **0 for 102 of 105 colleges** — which is
*exactly what everyone was expecting to see*.

The lane would have looked correct on the day it shipped, looked correct on every
subsequent day it stayed near zero, and started producing quietly wrong numbers
only once the credit lane's portal traffic grew — by which time nobody would
connect the two.

**The general form:**

> A defect is detectable by inspection only when its output differs from the
> expected output. Where you have *predicted* a value — zero, empty, "not yet",
> a placeholder — you have given up inspection as a detector, because the broken
> path and the correct path agree. What remains is verifying the **provenance**:
> not *is the number right* but *did it come from the thing it claims to measure*.

⚠️ This is the sharp edge of "absent is fine, wrong is never". An absent number is
self-announcing. A wrong number that **equals** the absent number is the one case
where the two are the same pixel, and the rule collapses unless something checks
the source.

⭐ **The corollary is a design rule, not just a testing one:** make the source
explicit and checkable. A measure resolved by matching prose cannot be verified by
reading the screen; a measure **pinned to a declared key** can be asserted, linted
and mutation-tested. The fix was not "correct the matcher" — it was to stop
inferring the source at all where it matters, and to make an unrecognised pin fail
**loudly** rather than fall through to a plausible zero.

## Where it bites

- Any second lane, tenant, region or cohort added beside a first one, when the new
  one is expected to start empty. Its emptiness is the alibi for reading the wrong
  source.
- Ramp-up periods generally: a launch metric expected near zero, a feature behind a
  flag nobody has turned on, a backfill not yet run.
- Fixtures built alongside the code they test — the same failure one layer up: the
  fixture asserts the expected value, so it agrees with the bug (see #1361's `"000"`
  regression, and the `columnValue`/`data` key in Session 172).

## How to act on it

1. When the expected value is zero/absent/empty, **write the assertion about the
   SOURCE**, not the value. "Scores on `pa_u`" is a guard; "reads 0" is not.
2. Put a **contrasting case beside it** in the same fixture — a slot that is
   correctly wired and returns something non-zero. Two cells that must differ catch
   a collapse that one cell reading 0 never will.
3. **Mutate the fix and watch the guard fail.** Two of this change's guards passed
   with the fix removed: one read source text instead of exercising the code, and
   one used a fixture whose prose already produced the right answer without the pin.
   A guard that has never been made to fail is not yet a guard.
4. Prefer **declared** over **inferred** for anything that decides which data a
   figure comes from, and make an unknown declaration an error rather than a
   fallback.
