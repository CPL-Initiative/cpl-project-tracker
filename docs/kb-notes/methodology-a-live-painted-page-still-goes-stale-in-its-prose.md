---
title: A live-painted page still goes stale in its prose
created: 2026-09-01
updated: 2026-09-01
tags: [methodology, funding, explainer, staleness]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
artifacts:
  - funding-model/index.html
  - cpl_funding.js
---

# A live-painted page still goes stale in its prose

> **One-sentence summary** — wiring every figure on a page to a live painter
> stops the numbers from going stale, but sentences that assert model
> mechanics have no element ids, so the page keeps making claims the model no
> longer makes.

## Context

The public funding-model explainer was rebuilt in August 2026 to compute
every figure from the same engine as the Implementation Funding tab, after
hand-typed numbers repeatedly went stale ("the count was 'four' in five
places until 2026-08-23"). The fix keyed on **figures**: each number sits in
an element with an id the painter overwrites on every model change.

## The failure

Found 2026-09-01, while sourcing a presentation from the page: two *prose*
passages survived the one-pool port asserting the previous model's
mechanics —

- Step one still says awards are sized by **credit** FTES over "all 115 …
  1,069,182", while the adopted one-pool sizes on **combined** credit +
  noncredit FTES over 118 — a claim the same page's opening section and
  noncredit section contradict.
- Step three and the what-is-a-choice table still say every funding factor
  is **1.0**, while the live Year-1 factors are **0.5** (and `mirrorYears`
  makes Year 1 effective for both years).

Neither sentence contains a painted id, so no repaint could ever correct
them. The page cannot lie in numbers anymore; it can still lie in prose.

## The rule

When a page is made live-painted, the unit of staleness stops being the
figure and becomes the **claim**. At that point, every load-bearing
mechanical claim in static prose must either (a) be painted too — built
from the payload like the figures, or (b) be deleted in favor of text the
painter writes (the noncredit section's `nc-body` paragraph is the worked
example — its whole paragraph is painter-written). Prose that merely frames
("two things then adjust that starting figure") is safe; prose that asserts
a dial's value or a formula's input is not.

A cheap lint exists: any sentence containing a number or a dial name
(`floor`, `cap`, `factor`, `rate`, `FTES`) inside a `<section>` but outside
an element the painter touches is a candidate stale claim.

## Status

The two passages above are open defects in `funding-model/index.html` as of
2026-09-01 (queued in the implementation-funding lane's NEXT). The
presentation sourced from the page carries no factor figure, so it is not
exposed.
