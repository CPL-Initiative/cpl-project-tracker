---
title: An accessibility sweep does not measure alignment; probe the edges
created: 2026-09-30
updated: 2026-09-30
tags: [methodology, a11y, layout, margins, playwright]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[cpl_funding_lessons]]"
artifacts:
  - scripts/a11y.js
  - a11y.config.js
  - funding-model/index.html
---

# An accessibility sweep does not measure alignment; probe the edges

> **One-sentence summary** — `npm run a11y` passed the funding explainer at nine
> widths while its header ran flush to a phone's edge, because the sweep checks
> contrast, target size, overflow and hidden content, and no rule in it asks
> whether two blocks share a left edge; a margin audit reads each block's edges.

## Context

Sam asked (2026-09-30) for the funding Public view and explainer to be audited
"to be sure the margins are consistent and everything continues to be AA and
mobile friendly." The sweep answered the second half. The first half needed a
different instrument. The session record is in the
[`cpl_funding_lessons`](../cpl_funding_lessons.md) S307 section.

## The claim

**Consistent margins are a relation between blocks, and a per-element checker
cannot see a relation.** Contrast, a 24px target and horizontal overflow are
properties of one element against its surroundings; each passes or fails alone.
A header whose text starts at 0px while the body text starts at 16px violates
nothing any one element owns, so a sweep built from per-element rules reports
the page clean.

**The instrument is a probe that reads edges.** Open the page in Chromium at a
desktop and a phone width, and for each block that should share a column (the
header's title, the section headings, the body text, the toolbars, the tables,
the footer's text) print its left and right edge in pixels. Blocks meant to
align must print the same numbers; any difference is a finding or a deliberate
exception worth a comment. The S307 probe was about 60 lines of Playwright over
a local static server, with `.cplfl-overlay` (the First Light greeting) removed
before measuring.

**Measure the content, not its box.** A `.wrap` with side padding reports its
outer edge; the text inside it starts one gutter further in. Probe the children.

## How we got here

The probe's first run found three defects the sweep had passed:

- The explainer's `.head{padding: … 0 …}` shorthand set the side padding to 0,
  erasing the `.wrap` gutter, so the header sat 28px left of the body column on a
  desktop and flush to the screen edge on a phone.
- A phone-width rule written for COBI's mount (`#cplFundingMount { padding: 12px
  !important }`) also reached the explainer's mount, which carried no padding, so
  the table sat 12px inside the text column.
- Every `.cplfund-optbtn` carried `margin-left: 6px` for inline runs, and inside
  a flex row with `gap` it set the row's first button 6px off the column.

It also flagged a frame around the funding tab that turned out to be COBI's
placeholder on 18 tab roots, the house pattern. Measure a pattern's reach before
calling it one page's defect.

## When this applies (and when it doesn't)

Use the probe whenever an ask names margins, alignment or "consistent" layout,
and after any change to a shared wrapper, gutter or padding shorthand. The
sweep stays the instrument for contrast, target size, overflow and hidden
content; the probe adds to it and replaces none of it. A deliberate exception,
such as the explainer's table widening past the prose column on a desktop (Sam,
2026-09-15), should carry a comment at its rule so the next probe reads it as
intended.

## See also

- `scripts/a11y.js` and `a11y.config.js`: the sweep, with the S307 targets
  `funding-public`, `funding-public-mycpl` and `funding-model-mycpl`.
- [`methodology-a-sticky-header-sticks-only-inside-a-box-that-scrolls`](methodology-a-sticky-header-sticks-only-inside-a-box-that-scrolls.md):
  the S306 layout lesson that also showed only in Chromium.
