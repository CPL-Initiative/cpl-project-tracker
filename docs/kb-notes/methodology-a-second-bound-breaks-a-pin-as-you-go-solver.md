---
title: A second bound breaks a pin-as-you-go solver — one-sided is monotone, two-sided is not
created: 2026-08-22
updated: 2026-08-22
tags: [methodology, funding, allocation, algorithm, invariants]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cpl_funding_lessons]]"
  - "[[docs/kb-notes/methodology-test-the-relationship-not-each-side]]"
artifacts:
  - cpl_funding.js
  - tests/cpl_funding_cap.test.js
---

# A second bound breaks a pin-as-you-go solver

> **One-sentence summary** — An iterative "pin the ones that violate the bound,
> re-split the rest" loop is correct for a floor alone and silently wrong the
> moment a ceiling joins it, because the two bounds push the free rows in
> opposite directions; solve for the single scalar instead.

## Context

The $35M Implementation Funding allocation had one bound for a year: a $150,000
minimum per college, funded from inside the pool. Its solver was the obvious
one — split proportionally, pin whoever lands under the floor, re-split the
remainder over the rest, repeat until nothing new pins.

On 2026-08-22 Sam asked for a maximum as well. The instinct is to add a second
`if` to the same loop. That is wrong, and the wrongness is invisible: the pool
still balances, every row still respects both bounds, and the numbers look
entirely plausible.

## The asymmetry

A **floor is monotone.** Pinning a college at the floor hands it *more* than its
proportional share, so the remainder shrinks and every unpinned college moves
**down**. A college that once fell below the floor can therefore never rise back
above it. Pinning as you go is safe forever — the pinned set only ever grows,
and it grows toward the right answer.

A **ceiling runs the other way.** Pinning a college at the ceiling hands it
*less* than its share, so the remainder grows and every unpinned college moves
**up**. That can lift a college back **off** the floor it was pinned to on an
earlier pass — and a pin-as-you-go loop never revisits a pin, so it strands that
college at the minimum and quietly under-pays it.

This is not a theoretical edge. On the live 115-college roster at floor
$150,000 / ceiling $400,000, **five of the fifty floored colleges come off the
floor** once the ceiling releases its money (Ohlone, Clovis, Cerro Coso, Cuesta,
Cabrillo). A naive two-bound loop would have paid each of them $150,000 and
still reported a balanced pool.

## What to do instead

Both bounds describe one family of solutions parameterized by a single scalar:

```
W(c) = clamp(lambda * size(c), floorFor(c), capFor(c))
```

`sum(W)` is monotone increasing in `lambda`, so **exactly one** `lambda` spends
the pool, and bisecting for it honors both bounds simultaneously in any
combination. No ordering, no pin history, no convergence argument to get wrong.

Two refinements worth copying:

1. **Bisect to find the bound SETS, then compute the free rows with the old
   arithmetic.** Bisection lands within a few ulps of the exact answer, which
   would perturb every published figure by a fraction of a cent. Once you know
   *which* colleges are bound, the free rows are `size / freeSize * remaining` —
   the pre-existing formula — so with the ceiling off the new solver reproduces
   the old loop **bit-for-bit** (measured: max difference `0.000e+0`). That
   makes the migration behavior-neutral and lets a test assert it against the
   transcribed old algorithm.

2. **Surface the degenerate cases.** Floors that cost more than the pool, and
   ceilings too low to spend it, are both reachable from a curator's keyboard.
   The second one is the dangerous one: the balance silently stops being zero.
   Report the unspendable remainder rather than absorbing it, and clamp a
   ceiling set below the floor rather than paying someone under the minimum.

## The other half: a bound on the money is a bound on the bar

Adding a ceiling to the *allocation* and not to the *target* asks the capped
college to produce the same output for less money. On this model that was ~40%
more CPL per dollar than any other college, and statewide it had the state
asking for more prior learning than it was paying for.

The floor's asymmetry (more money, same target) is deliberate — a small college
lifted to a viability minimum should not be asked to perform at a large
college's scale. **That exception does not run in the other direction.** Scale a
capped college's targets down with its money.

One subtlety: scale them to the ceiling *divided by the discount every unbound
college already bears*, not to the ceiling itself. Here the floor top-ups are
funded by renormalizing over the unfloored colleges, so those colleges earn at
~91% of the statewide rate. Scaling a capped college's target to its bare
ceiling would hand the six largest colleges the only unsubsidized rate in the
state. The invariant to hold is the one the repo already had a test for:
**cap ÷ target is a single rate for every college above the minimum.**

## Applying it

- Adding a bound to a constrained-allocation solver? Ask which direction each
  bound pushes the free rows. Same direction → a pin loop is fine. Opposite
  directions → solve for the scalar.
- Migrating a solver whose output is published: make the new one reproduce the
  old one exactly under the old settings, and **assert that against a
  transcription of the old algorithm**, not against a stored snapshot of its
  output. A snapshot cannot tell you *why* it still matches.
- A clamp that exists for two reasons needs applying at both call sites. Here
  targets are derived two ways — a CPL-FTES priority reads `prioEntitlement`, a
  student-unit priority reads `size x target_rate` and never touches it — so the
  clamp is one named function called from both, or the same college gets two
  different answers depending on a metric's label.

## See also

- [[docs/cpl_funding_lessons]] — the run, the measurements, and what the ceiling
  actually does to the distribution.
- [[docs/kb-notes/methodology-the-same-arithmetic-can-read-as-withholding-or-as-investment]]
  — why "same work, less money" is not a neutral policy position.
