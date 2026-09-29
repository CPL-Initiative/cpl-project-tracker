---
title: Measure your mechanism's ceiling before working the queue
created: 2026-08-24
updated: 2026-08-24
tags: [methodology, curation, prioritization, measurement, ccr, strategy]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/ccr_convergence_strategy]]"
  - "[[docs/ccr_atlas_lessons]]"
artifacts:
  - kb/_build_ccr_atlas_extract.py
---

# Measure your mechanism's ceiling before working the queue

> **One-sentence summary** — before committing to grind a work queue, compute
> where the queue *ends up if you finish it perfectly*; if that ceiling misses
> the target, no amount of diligence closes the gap and you need a different
> mechanism, not more effort.

## Context

The CCR's goal is a catalog of **2,000–2,500 common courses** out of **135,484
local college courses** — a 54:1 compression. The visible instrument is a
suggested-merge queue, and every planning conversation for months treated
"work the queue" as the path.

Nobody had computed what finishing the queue would produce.

## The measurement

Collapse every suggestion lane into connected components (the honest unit — see
[[methodology-the-unit-of-curation-work-is-the-component-not-the-suggestion]]),
then assume the *best possible* outcome: every decision correct, every component
collapsing to a single row.

| | |
|---|---:|
| identities today | 52,161 |
| identities touched by any suggestion | 22,280 |
| decision components | 6,056 |
| identities removed if every one folds perfectly | 16,224 |
| **catalog after grinding the entire queue** | **35,937** |
| target | 2,500 |
| **short by** | **14.4×** |

Current compression is 2.6:1. Perfect execution of the whole queue takes it to
3.8:1. The target needs 54:1.

**The queue cannot reach the goal.** Not slowly — at all. The lanes only
*propose* 6,056 collapses, and that is the entire supply.

## Why this is worth doing every time

The failure mode is not laziness, it is *diligence pointed at a mechanism that
tops out below the target*. A team can work a queue faithfully for a year, be
right on every individual call, and still miss by an order of magnitude — and
because each decision is correct, nothing in the day-to-day surfaces the
problem. The ceiling is only visible from above.

The arithmetic is cheap: **count the queue's maximum yield, compare it to the
target, and do it before you commit.** One afternoon of measurement reframed a
workstream that had been stalled and re-attempted for months.

## What it changes

When the ceiling misses, you need a mechanism with a different shape. For the
CCR that is **packaging** — deciding what the catalog should *contain* and
mapping into it — rather than **merging**, which can only compare what already
exists.

The proof was already in the repo: the ESL packaging dry-run collapsed 2,364
identities to ~221 (10.7:1 inside one discipline) by asking "what should ESL
contain?" instead of "are these two the same?".

The ceiling also yields the design target. 2,500 ÷ 144 disciplines ≈ **17 common
courses per discipline** — which turns an unbounded goal into 144 bounded,
checkable questions.

## Caveats

- A ceiling is an upper bound on *that* mechanism, not a verdict on the goal.
- Compute it from the mechanism's actual supply (here: what the lanes propose),
  not from the total population — those differ by 2× in this corpus.
- Re-derive it when the mechanism changes. A new evidence lane raises the
  ceiling; the ceiling does not raise itself.
