---
title: A safe fallback is safe only for the caller it was written for
created: 2026-08-11
updated: 2026-08-11
tags: [methodology, data-integrity, entity-resolution, joins, error-handling]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/college_action_page_lessons]]"
  - "[[docs/kb-notes/methodology-verify-the-last-hop-of-a-resolution-chain]]"
artifacts:
  - college_short_names.js
  - kb/_seed_college_short_names.py
  - college_briefing.js
---

# A safe fallback is safe only for the caller it was written for

> **One-sentence summary** — a "fail-soft" default encodes an assumption about
> what the caller is doing with the value, and the second caller inherits the
> default without inheriting the assumption.

## Context

`college_short_names.js` resolves a college's many spellings to one short name.
Its documented contract: *"Returns the original name if unmatched (safe
fallback — chips never render blank)."* That is correct, and for eighteen months
it had exactly one kind of caller: display chips.

Then the My College tab needed to join MAP's college names (`Bakersfield
College`) to the funding roster's short names (`Bakersfield`) in order to show a
college **its own allocation**. Same resolver, different job.

## The claim

**For a display caller, returning the input unmatched is the safest possible
behaviour. For a join caller, it is the most dangerous.** The chip renders a
slightly long label; the join silently drops the row — and the page renders a
college as though it has no money.

The fallback did not change. The second caller arrived.

Two consequences worth generalising:

1. **A fallback is part of the contract, and the contract is caller-relative.**
   "Never fails" and "never wrong" are different guarantees. A function that
   cannot fail is not thereby safe to build a determination on — it has moved
   the failure from an exception you would have seen to a value you will not.

2. **The new caller must distinguish the states the fallback collapsed.** In
   `fundingFor()` there are three, and a single `null` would have merged them:

   | State | Renders as |
   |---|---|
   | model not loaded | *"failed read, not a finding"* |
   | resolved, genuinely off the roster | *"a different route to money, not an absence of it"* |
   | resolved, on the roster | the real figure |

   This is the same family as [three kinds of zero](methodology-publish-the-denominator-with-the-number.md):
   absent, withheld, and measured are different claims, and only the code that
   knows which one it is holding can keep them apart.

## How it was caught

By measuring the join instead of assuming it, before building on it — 116 MAP
names against 115 roster rows, counting collisions in **both** directions:

| Attempt | Resolved | Collisions |
|---|---:|---|
| MAP side only, matched against raw roster strings | 110 / 116 | 0 |
| **both sides through the resolver** | 114 / 116 | 0 |
| both sides, after the resolver fix | **115 / 116** | 0 |

The last residue is Calbright, a noncredit feeder genuinely absent from the
115-college credit roster — a real state, not a defect.

The step from 110 to 114 is worth noting on its own: **normalise both sides with
the same function rather than comparing a normalised value to a raw one.** Five
of the six original misses were spelling drift *inside the roster* (`Reedley
College` vs `Reedley`, `MiraCosta` vs `Mira Costa`), and running both sides
through the resolver dissolved them without a single hand-written alias.

## The defect underneath

Pushing to 115 exposed a real bug: **the resolver could not round-trip its own
output.** It indexed `canonical` + `aliases`, while its Python twin in
`funding/_build_funding_performance.py` also indexes `short` and `short_caps`.
So `cplCollegeShort("LA Swest")` — a string the resolver itself emits — matched
nothing, hit the safe fallback, returned the input, and Los Angeles Southwest
College vanished from any join routed through it.

Fixed in `kb/_seed_college_short_names.py` (the generator, never the generated
artifact) and regenerated; verified collision-free at 146 normalised keys, 0
conflicts.

> **`f(f(x)) == f(x)` is a cheap and strong test for any normaliser.** It needs
> no fixtures, it runs against the real data, and a fallback that returns the
> input on failure makes it the *only* test that can tell "resolved" from
> "gave up".

## What to do

- When adopting a fail-soft helper for a **determination** rather than a
  **display**, read its fallback first and ask what it means for your caller.
- Assert idempotence on any normaliser you join through.
- Count collisions in both directions, and assert **0 orphans** — a lookup table
  row nothing can reach is a silently missing answer.
- Commit those assertions against the **real** rosters, not fixtures, so drift
  in either file fails in CI rather than on the page.
