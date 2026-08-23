---
title: A mechanism that looks redundant may be carrying a second job the table cannot show
created: 2026-08-22
updated: 2026-08-22
tags: [methodology, funding, allocation, simplification, invariants]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cpl_funding_lessons]]"
  - "[[docs/kb-notes/methodology-a-second-bound-breaks-a-pin-as-you-go-solver]]"
artifacts:
  - cpl_funding.js
  - tests/cpl_funding_rural.test.js
---

# A mechanism that looks redundant may be carrying a second job

> **One-sentence summary** — Before removing something because a newer mechanism
> appears to cover it, check what it does that the comparison table cannot
> display; the overlap you can see is rarely the whole of what it was for.

## Context

The $35M model carried a $1,000,000 rural allowance, split 13 ways, alongside a
$150,000 per-college minimum. When a maximum was added, the reasonable read was:
every rural college is small, every small college is lifted by the minimum, so
the allowance is now redundant — drop it and fold the money back in.

Measured against the allocation table, that read was **two-thirds right**: ten of
the 13 sat exactly at the minimum and would move **$0**. The floor genuinely was
doing that work.

## Two things the table could not show

**1. The overlap was partial, and the non-overlapping part ran the wrong way.**
Three rural colleges sat *above* the minimum, so for them the allowance was a
bonus on top rather than a floor-fill: −$70,656, −$12,193, −$5,655. And the
released money re-splits *proportionally*, so it landed on the **largest**
colleges in the system. A change proposed for equity would have moved money from
three rural colleges to the biggest non-rural ones. Removing it was still right,
but only when **paired** with a floor raise that more than repaid the cohort.

**2. It was the only UNCONDITIONAL money in the pool** — and no column said so.
The floor caps what a college can *earn*; it does not guarantee what it
*receives*. A floored college that posts nothing still earns ~$0. The rural
allowance was never performance-gated, so the 13 went from $76,923 guaranteed to
**$0 guaranteed**. Every figure in the allocation view was unchanged for ten of
them while the *terms* changed for all thirteen.

That second job was also **latent**: unmeasurable priorities currently pay
provisional advances, so at the moment everyone looks funded either way. It would
have started mattering exactly when the data got better.

## The generalization

A mechanism sitting next to a newer one usually overlaps it on the dimension you
are looking at — that is what makes it look redundant. Before removing it, ask:

- **Who does it NOT overlap?** Set-difference is cheap to compute and it is
  where the losses live. Ten of thirteen agreeing is not thirteen.
- **Where does the freed resource GO?** Redistribution has a direction. A pool
  that re-splits proportionally sends released money *up*, which can invert the
  intent of the removal.
- **What does it promise that the other doesn't?** Guarantee vs. cap, timing vs.
  amount, eligibility vs. quantity. Two mechanisms can produce identical numbers
  today and differ entirely in what they commit to.
- **Is the difference LATENT?** A distinction that is invisible under current
  data is still a distinction. Ask what changes when the data improves.

None of this argues for keeping things. It argues for pricing the removal
honestly, and for pairing it with whatever repays what it actually did.

## Applying it

- Run the counterfactual on the **whole population**, not the aggregate. "Near
  zero impact" summed over 115 colleges hid a 32% cut to one.
- State the removal's terms change in words, not just money. "Ten colleges move
  $0" and "thirteen colleges lose their guarantee" are both true; only the first
  is in the table.
- When the mechanism goes, guard its **absence**: the retirement guard in
  `tests/cpl_funding_rural.test.js` pins the data, the pool arithmetic, the row
  shape, the bounds, four UI surfaces and the source itself, because a mechanism
  threaded through that many places can come back in any one of them.

## See also

- [[docs/cpl_funding_lessons]] — the measurements, and what the paired floor
  raise cost in earn rate.
- [[docs/kb-notes/methodology-a-second-bound-breaks-a-pin-as-you-go-solver]] —
  the solver change that prompted the question in the first place.
