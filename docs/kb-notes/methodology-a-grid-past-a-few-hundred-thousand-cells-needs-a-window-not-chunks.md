---
title: A grid past a few hundred thousand cells needs a window, not chunks
created: 2026-09-24
updated: 2026-09-24
tags: [methodology, performance, ui-design, cobi, eacr]
kb-status: internal
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/reference/lanes/eacr-exhibit-cr-adoption]]"
  - "[[docs/kb-notes/reference-ui-design-system]]"
artifacts:
  - statewide_interactive.js
  - tests/eacr_matrix.test.js
---

# A grid past a few hundred thousand cells needs a window, not chunks

## The claim

Chunking a large table's render spreads the JavaScript cost across frames and
leaves the DOM cost untouched. Past a few hundred thousand cells the DOM cost is
the whole problem, so the fix is a window: the DOM holds the rows near the
scroll position and spacer rows carry the rest of the height.

## The measurement (2026-09-24, Chromium, the EACR adoption matrix)

The matrix opened on every adopted credential: 2,675 rows by 118 colleges,
315,650 cells. Three renders were measured on the same page.

| Render | First rows | Whole grid | Scroll frame |
|---|---|---|---|
| Chunked, auto table layout | 1.2–2.6 s | 18–23 s | 244 ms mean, 509 ms max |
| Chunked, fixed layout, sticky headers removed | 2.4 s | 21–23 s | 189–201 ms mean |
| Windowed (25–40 rows in the DOM) | 65–82 ms | never built | 33 ms median, 168 ms max |

The second row is the finding. Fixed layout and the sticky title column were the
two suspects, and removing both changed nothing: a 316,000-cell table costs
what it costs to lay out and paint, however it arrives. The chunked version
also queued 67 pieces of HTML that the reader scrolled past before they landed.

## What the window has to get right

- **Row heights are known before the rows exist.** Every credential row is
  52px and every section header 30px, so any row's offset is arithmetic. A
  title that would run past two lines clamps with an ellipsis; the th's title
  attribute and its DOM text keep the whole name for assistive technology and
  for find-in-page. An expanded drill-down is the one variable height, measured
  once it renders, and it only ever moves the rows below it.
- **The sticky section header comes along.** The window renders the header of
  the section it starts inside one line early, at its natural (off-screen)
  position, and the sticky rule pins it under the column header. Scrolling into
  the next section pushes it off exactly as a full table would.
- **Focus survives a re-render.** The window is rebuilt with `innerHTML`, which
  destroys the focused cell. Recording (row, column) before the rebuild and
  re-focusing after it keeps the arrow keys working across window edges, and a
  row outside the window scrolls itself in before it takes focus.
- **Hysteresis.** Re-rendering when the visible range comes within four lines
  of the window's edge, with fourteen lines of overscan, means a wheel step
  costs a frame most of the time and a rebuild every ten rows or so.

## Where else this applies

Any COBI table that opens on a whole population rather than a page: the CCR
worklists, SkyView's tables, a funding view that lists every college by every
measure. The tell is a render that a test suite passes in jsdom and a browser
takes seconds over, which is the same gap `npm run a11y` exists to close for
layout.
