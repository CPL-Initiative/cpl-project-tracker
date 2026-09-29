---
title: "A floor the layout cannot go under — why a page scrolls sideways on a phone, in four spellings"
created: 2026-09-09
updated: 2026-09-09
tags: [methodology, ui, mobile, a11y, css, pitfall]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[methodology-a-token-that-cannot-flip-is-a-surface-that-cannot-theme]]"
  - "[[reference-ui-design-system]]"
  - "[[docs/reference/lanes/cobi-dark-mode]]"
---

# A floor the layout cannot go under

Sam, 2026-09-09, with a phone screenshot: *"the mobile view of COBI analytics,
not easily readable."* The dashboard was **1278px wide on a 390px screen** — the
KPI cards far wider than the viewport, their labels running off the right edge.

Every cause of sideways scroll found that day was the same thing wearing
different clothes: **a minimum the layout is not allowed to go below.** The
useful part is that three of the four are invisible in the CSS, because the floor
is a *default*, not a declaration.

## The four spellings

**1. `min-width: auto` on a grid or flex item — the default, and the one to
know.** A grid item's automatic minimum is its **min-content** width, so a `1fr`
track cannot shrink below the widest thing inside it. COBI's `.kpi-section`
resolved correctly to one column at 390px; the column was **1261.56px**, because
two of its fifteen items were not KPI cards at all but blocks wrapping ~1210px
tables. Every card then inherited that width. `min-width: 0` on the items drops
the track to 358px.

⚠️ **The scrollers were already there and were doing nothing.** Both tables sat
inside `overflow-x: auto` boxes — boxes that were themselves 1262px wide. **A
scroller constrains nothing until something caps it.** "It already has
`overflow-x: auto`" is not evidence that a table scrolls.

**2. A hard px floor:** `min-width: 340px` on a flex item, `min-width: 600px` on
a chart. Anything above a phone's ~358px content box forces overflow. Write
`min-width: min(340px, 100%)` — the desktop intent survives, the phone shrinks.

**3. `minmax()`'s first argument is a floor too.**
`repeat(auto-fit, minmax(500px, 1fr))` produces a 500px track on a 390px screen;
`auto-fit` only removes *empty* tracks, it does not shrink a floor. Write
`minmax(min(500px, 100%), 1fr)`.

**4. No scroller at all.** Two wide tables simply overflowed their containers.
A region that scrolls also needs `tabindex="0"` and an accessible name — and
⚠️ **Chromium 127+ focuses an overflowing div with no tabindex, so the measuring
browser hides this defect**; the explicit fix is still correct.

## How to find it, in one pass

Walk the DOM breadth-first, report the **shallowest** element whose right edge
passes the viewport, and stop descending that branch. Depth matters more than
width: the widest element is usually a symptom, and the shallowest is the cause.
Skip anything an ancestor clips (`overflow` other than `visible`), or every
correctly-scrolling table reports as a fault.

Then test the hypothesis rather than reading more CSS: set `min-width: 0` on
every grid/flex item and re-measure `document.documentElement.scrollWidth`. If
the number collapses, the floor was the cause and you now know which family.

⚠️ **Measure, do not reason from the stylesheet.** Four wrong hypotheses died
here — the media query was matching, the cascade was correct, the content did
shrink when forced, and hiding every card changed nothing. The stylesheet said
the layout was fine; the layout was not fine.

## The guard, and how it failed twice

A source-level test is the right instrument (jsdom returns zeroes for every
rectangle, so it cannot see layout), but this one could not fail — twice:

- **Placed after the loop that tallies results**, its checks were pushed once the
  count had been taken. It printed nothing and passed. A test file that reports
  `N/M` has an ordering contract; appending to it is not free.
- **Then it fired on `minmax(500px` inside the comment that explains the fix.**
  A scanner that reads comments reports the *explanation* of a defect as the
  defect. Strip comments before scanning. Same family as the house rule that a
  British spelling must be written in a code span to survive its own lint.

Verify a guard by reverting its own fix and watching it go red. Both failures
above were found that way and by nothing else.
