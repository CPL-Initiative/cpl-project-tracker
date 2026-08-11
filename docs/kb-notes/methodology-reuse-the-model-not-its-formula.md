---
title: Reuse the model, not its formula — a derivation can be wrong for cases its special case never touches
created: 2026-08-11
updated: 2026-08-11
tags: [methodology, funding, data-integrity, measurement, reuse]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/college_action_page_lessons]]"
  - "[[docs/kb-notes/methodology-verify-the-last-hop-of-a-resolution-chain]]"
artifacts:
  - cpl_funding.js
  - college_briefing.js
  - tests/college_briefing.test.js
---

# Reuse the model, not its formula

> **One-sentence summary** — when a second surface needs a number an existing
> module computes, call that module; re-implementing "the formula, plus the
> special case" produces figures that are plausible, unqueryable, and wrong —
> including for the rows the special case never applies to.

## Context

The My College tab needed to show one college its share of the $35M CPL
implementation pool. The handing-over note carried a worked example: Bakersfield
at **≈$426K**, being 1.83% of the $23.24M pool from 46,171 headcount — with an
explicit warning to *"resolve the $150K floor waterfall, don't ship my flat
proportional number."*

That warning was right, and understated.

## The claim

The allocation is not `share × pool`. It is an **iterative floor waterfall**:
every college whose proportional share falls below the $150K minimum-viable
floor is pinned to the floor, the remainder re-splits across the rest, and the
pass repeats until it settles — with a guaranteed rural allowance layered on
top. Measured against the live model:

| College | Flat proportional | Model | |
|---|---:|---:|---|
| Palo Verde | $59,742 | **$150,000** | pinned at the floor |
| Lassen | $34,985 | **$150,000** | pinned at the floor |
| LA Southwest | $113,262 | **$150,000** | pinned at the floor |
| Bakersfield | $426,196 | **$414,856** | **not floored** |
| Mt. San Antonio | $772,869 | **$522,239** | **not floored** |

**50 of 115 colleges are pinned at the floor** — so the flat figure is wrong for
43% of the state outright. That much is predictable from reading the rule.

⭐ **The part that is not predictable is the last two rows.** The flat figure is
also wrong for colleges the floor *never touches*, because the floor's
**$1,999,687** cost is funded out of the same pool, so every unfloored college's
proportional share is reduced. Bakersfield is not floored and is still off by
$11,340; Mt. San Antonio by $250,630.

> **A derivation can be wrong for the cases its special case does not apply to.**
> Anyone reasoning "the floor only affects small colleges, so the big ones are
> safe to approximate" gets a wrong number and a confident explanation of why it
> should have been right.

## Why this failure mode is worse than an obvious error

$426K is *plausible*. Nobody at Bakersfield would query it. It disagrees with
the Implementation Funding tab by an amount too small to look like a bug and too
large to be rounding — so the two surfaces quietly disagree, and the first person
to notice is someone reconciling a figure they have already sent somewhere.

This is the same shape as an answer that is
[accidentally correct](methodology-a-retrieval-miss-and-a-data-gap-look-identical.md):
output that survives review because it is not obviously wrong is more durable
than output that fails loudly.

## What to do

Call the module that owns the math, and give it the smallest public surface that
lets you:

```js
// cpl_funding.js — read-only API for the My College tab
onModelChange(fn)   // remote loads (ledger, perf, ESS) land async; render IS the event
ensureLoaded()      // reuses the module's own boot(), so both surfaces read the same figures
_alloc(name)        // the floor-waterfall result for one college
_ess(name), _grant(name), _isRural(name), _district(name)
```

Three properties matter, and the first two are easy to skip:

1. **Load through the owner's own boot path.** The appropriation figures come
   from the Budget ledger and *override* the values baked into the data file. A
   second surface that loads only the data file gets the pre-ledger number and
   is wrong in a way no test on either side would notice — the
   [last hop of a resolution chain](methodology-verify-the-last-hop-of-a-resolution-chain.md)
   again.

2. **Subscribe, don't snapshot.** Those remote figures land asynchronously. A
   surface that reads once at mount renders whatever was there first and never
   corrects.

3. **Cross-check the result against a figure derived by a different route.**
   Mt. San Antonio returns $522,239, which is exactly the value the Sep-BOG
   workbook reconciliation arrived at independently. One such agreement is worth
   more than any amount of re-reading the formula.

Then guard the absence of the second implementation, so the next session cannot
quietly reintroduce it:

```js
check("no re-derived allocation arithmetic in the briefing",
  !/headcount_pct|floor_window|ruralPerCollege|23240308/.test(briefingCode));
```

## Corollary

If a formula is genuinely too expensive to reuse — different language, different
process, no shared runtime — then **publish the reference outputs and assert
against them**, rather than duplicating the derivation and hoping. A second
implementation is a second thing to keep in sync, and nothing on either side
fails when they drift.
