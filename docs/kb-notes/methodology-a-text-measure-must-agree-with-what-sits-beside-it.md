---
title: A text measure must agree with what sits beside it
created: 2026-08-22
updated: 2026-08-22
tags: [methodology, ui-design, typography, artifacts, cobi]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/reference-ui-design-system]]"
  - "[[docs/cpl_funding_lessons]]"
artifacts:
  - CPL_Dashboard.html
  - index.html
  - tests/cobi_prose_measure.test.js
---

# A text measure must agree with what sits beside it

> **One-sentence summary** — A comfortable ~65–80 character reading measure is
> correct on a page of continuous prose and reads as a mistake on a page of
> full-width tables and cards; pick one edge and hold it, or go to columns.

## Context

Sam, 2026-08-22, on the funding explainer and then on the whole dashboard:
*"this is a consistent formatting pattern you use — where you make text widths
short for readability but it looks awkward when set against the full width items.
I prefer if you either extend text widths the full extent OR use two columns to
preserve readability."* Then: *"I would like the full width format rule on
throughout COBI."*

## The claim

**A measure is not a universal good; it is a relationship with the widest element
on the page.** Prose capped at 74ch beside a table that runs to 1400px does not
read as considerate typography — it reads as a block that failed to fill its
container, because nothing else on the page stops there. Three resolutions, in
order of preference:

1. **One edge.** Prose runs to the same right edge as the tables and cards.
   Costs measure; buys a page that looks composed. Nudge line-height up (1.62 →
   1.7 here) to carry the longer line.
2. **Columns.** Preserves measure *and* fills the width — but only pays off over
   long continuous runs of text. Where most blocks are one to three lines,
   columns produce one- and two-line stacks and force the eye down and back for
   nothing. Check block lengths before choosing this.
3. **Narrow everything**, furniture included. Rarely available once a wide table
   exists.

## Three things that bite when you apply it at scale

⚠️ **The threshold is the whole point.** COBI carried 60 `ch` caps. 34 at 60–82ch
were reading measures. 26 at 9–46ch were **layout** — a cell truncation
(`.cs-variants` 42ch), a raw-value column (`.cr-wl-raw` 42ch), a monospace context
strip (46ch), a badge (9ch), a deliberately short hero lede (44ch). A blanket
sweep widens all 60 and breaks layouts the change was never about. Sort by intent,
not by unit, and **pin a sample of the layout caps in a test** so a future sweep
that eats them fails loudly.

⚠️ **A px cap is the same defect in different units.** Four tab intro paragraphs
were capped at 880px and 760px and were invisible to a `ch` grep. Grep both.

⚠️ **Ship it as a token, not as N hardcoded values.** `--cpl-measure: none` on
`:root`, every site `max-width:var(--cpl-measure,none)`. One lever restores a
measure everywhere, or becomes a column rule later — and the diff stays readable.
**The `,none` fallback is load-bearing**: most of these rules are injected by a
tab's own JS onto surfaces that may never declare the token, and without a
fallback the declaration is invalid — which happens to look right while the token
means "none", and is wrong the day it means `74ch`.

## How we got here

The explainer's `--measure: 64ch` sat against full-width stat boxes, and Sam named
it as a habit rather than a one-off — which it was: the same pattern was in 17
COBI files, 39 sites. A prior related ruling (2026-08-17, *"use as much of the
screen as possible for usable space"*) had already widened the **containers** on
the Sierra tab while explicitly moving the cap onto the prose elements at 82ch.
This ruling finishes that move.

## When this does NOT apply

A standalone document meant to be read start to finish with no wide furniture on
the page — an essay, a memo, a letter. There the measure has nothing to disagree
with, and 65–75 characters is simply right.
