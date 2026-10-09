---
title: Check a page inside every frame that embeds it
created: 2026-10-09
updated: 2026-10-09
tags: [methodology, ui, accessibility, first-light, embedding]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-a-sweep-sees-only-the-states-its-seed-reaches]]"
artifacts:
  - veteran-sprint-map/build_selfcontained.py
  - a11y.config.js
  - tests/public_pages_a11y.test.js
---

# Check a page inside every frame that embeds it

> **A page that another page frames has two sizes: its own window and the frame's box. Review and measure it at
> both, because a layout approved in a window can overflow the frame, repeat its host's heading, and shrink anything
> sized to the drawing.**

## Context

The public veteran map moved to First Light in S350 after Sam approved a mock-up of the standalone page. COBI's
Military Partnerships tab frames the same file. The mock-up review and its accessibility run both opened the page in
a full window, so neither saw the frame. Lessons: `docs/sierra_page_redesign_lessons.md`, S350.

## The claim

**The frame is a separate viewport with a fixed height, so measure the page in it.** COBI's frame is
`calc(100vh - 170px)`, at least 700px. A document-flow page whose map takes 70vh of the frame plus a header and
toolbar cannot fit: it overflowed by 170 to 280px at every desktop height measured. The reader then scrolls inside the
frame, and on a map the wheel zooms instead.

**The host introduces the page, so the page should not introduce itself twice.** The tab carries its own heading and
paragraph; the framed page repeated them. A mode the host requests by URL (`?embed=1`) lets the page drop its h1 and
lede to the screen reader and spend the height on the content. A URL parameter keeps it explicit: a third-party embed
or a direct visit still gets the full page, and the a11y harness can open the mode as its own target (`query`).

**Anything sized to the drawing shrinks with the frame.** Map markers were counter-scaled for zoom but not for the
drawn size, so the frame's shorter map drew stars at 4px. Hold such sizes to the approved view with a floor, and
scope the floor to where it helps (above the phone breakpoint here, since bigger pins on a phone would merge a dense
region).

**A framed page follows its host's settings only if it listens.** Reading a stored theme at load covers a fresh
frame; the host's control changes it while the frame is open. Same-origin `storage` events reach the iframe.

## How we got here

S350 (PR #1924): a Playwright measurement of `scrollHeight` against the frame's heights found the overflow; a
screenshot of the COBI tab showed the vanishing stars, measured with `getBoundingClientRect()` on a star (4.3px
against 7.7px). The embed mode and the marker floor brought both to the approved figures, and `npm run a11y --
veteran-map-embed` now measures the framed layout at nine widths.

## When this applies (and when it doesn't)

Applies to any page that a COBI tab frames, or that partners embed: the veteran map, and any future public page
offered as an iframe. Does not apply to a page that is only ever opened in its own window. The phone breakpoint is
the edge: below it the framed page behaves as the ordinary page and scrolls, because a stacked map and panel cannot
share a short frame.

## See also

- [`methodology-a-sweep-sees-only-the-states-its-seed-reaches`](methodology-a-sweep-sees-only-the-states-its-seed-reaches.md):
  the same shape of gap, one level up: a sweep measures only the states and contexts it opens.
- `veteran-sprint-map/README.md`, *Embedding*.
