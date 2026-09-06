---
title: A fix can be right about the complaint and wrong about the axis
created: 2026-09-06
updated: 2026-09-06
tags: [methodology, ui, testing, skyview]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
artifacts:
  - prototype/skyview.html
  - docs/skyview_video2_findings.md
---

# A fix can be right about the complaint and wrong about the axis

> **One-sentence summary** — When a user says "it jumps", find out *what* jumps
> before you fix *a* jump: the same sentence can name two mechanisms, and fixing
> the one you found leaves the complaint alive and the guard green.

## Context

Sam reported that SkyView's search list "jumps back" every time he picked a
course. Ruling 3 (2026-09-05) fixed it: `openSug()` rebuilds the dropdown with
`scrollTop = 0`, so `takeHighlighted()` now restores the exact offset after
`markSug()`. The fix was careful, correctly reasoned, guarded, and shipped.

The next day he drove the same screen and said *"jumping again, driving me
nuts"* — three separate times in ninety seconds.

## What was measured

Serving the page and driving it in Chromium at 1440px: search `weld`, scroll the
list to 300px, then pick rows.

| after | `#u-bar` height | `#sug` top | row 10 top | `scrollTop` |
|---|---|---|---|---|
| 0 picks | 30 | 40 | 439 | 0 |
| scrolled | 30 | 40 | 139 | 300 |
| picks 1-3 | 30 | 40 | 139 | 300 |
| **pick 4** | **76** | **76** | **175** | 300 |

`scrollTop` never moves. The shipped fix works exactly as designed. What moves
is the toolbar: `.u-tokens{display:contents}` makes every chip a flex child of
`#u-bar`, so the fourth chip wraps the bar to a second line, and the whole list
shifts down **36px — almost exactly one row height**. The row under the pointer
becomes a different row.

## The lesson

**A complaint names an experience, not a mechanism.** "The list jumps" was true
of two independent things: the list's *scroll offset* (fixed) and the list's
*position on screen* (not). Both produce the same sentence from the same user on
the same screen, and the first fix cannot retire the second.

Three practical consequences:

- **A shipped fix is not evidence the complaint is closed.** Re-drive the actual
  workflow rather than closing on the diff. Sam's second report was the only
  thing that would have found this.
- **Guard the thing the user experiences, not the thing you changed.** A test
  pinning `scrollTop` passes at full green while the reader's target walks out
  from under the pointer. The assertion here has to be `#sug`'s
  `getBoundingClientRect().top`, unchanged across picks.
- **Use enough of the input to reach the failure.** Three picks reproduce
  nothing; the wrap needs four at that width. A fixture that cannot produce the
  condition makes a guard a decoration — see
  [`methodology-a-fixture-too-small-to-fail-makes-a-guard-a-decoration`](methodology-a-fixture-too-small-to-fail-makes-a-guard-a-decoration.md).

## Why the measurement was necessary

`npm test` cannot see either mechanism: jsdom returns zeroes for every
rectangle, so a layout defect is invisible to 299 green suites. The distinction
between the two axes only exists in a real browser. This is the same reason
`npm run a11y` exists rather than a jsdom check.
