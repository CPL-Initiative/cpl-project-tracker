---
title: A pane painted only by its event is blank after every re-render
created: 2026-09-10
updated: 2026-09-10
tags: [methodology, skyview, rendering, state, testing]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-a-staged-state-lives-on-the-model-and-every-view-asks-it]]"
  - "[[methodology-verify-an-ask-against-what-the-reader-sees]]"
artifacts:
  - prototype/ccr_universe.js
  - prototype/check_skyview_sweep.js
  - tests/ccr_skyview_exhibits.test.js
---

# A pane painted only by its event is blank after every re-render

> **One-sentence summary** — if the only code that paints a pane runs when its
> state CHANGES, every re-render that seeds the pane from a template shows it
> empty until the next change; paint every pane from state at render.

## Context

SkyView's comprehensive view lists a curator's staged moves under the map
("What this would write"). The render seeded that pane with *No moves yet* and
the only call that painted it was the one that staged a move. A trip to the
workspace and back, an outline of record, and — from 2026-09-10 — a universe
swap all re-render the map, and each came back with the list blank while the
moves themselves were intact in memory. The 2026-09-10 sweep found it because a
new re-render (the CPL swap) ran between staging two moves and reading the list.

## The claim

**State a view holds must be painted at render, not only on the event that
changed it.** A pane whose template ships a placeholder and whose painter is
wired to one event is correct exactly until the first re-render, and a
re-render is not rare: routes, view swaps, payload swaps and error recoveries
all rebuild the DOM. The failure is silent — the model is right, only the
picture is stale — so nothing throws and no reader can tell "nothing staged"
from "nothing painted yet."

The test for a pane is one question: *if this DOM were rebuilt right now from
the template, would this pane say what the model says?* If the answer depends
on an event having fired since, the render is missing a call.

## How we got here

The render at `__ccrUniverse` builds the pane as `<p class="empty">No moves
yet.</p>` and `applyMove()` is the one caller of `drawWrites()`. The staged-move
suite passed because it stages a move and reads the pane in the same rendered
DOM. The live sweep's §L check *"the moves staged so far are listed under the
map"* failed only once §R's universe swap ran between §H (which stages) and §L
(which reads) — the same lesson as the S238 staged-move mark, one surface over:
a state that lives on the model must be asked by every view, including the view
that is being rebuilt.

## How to apply it

- At the end of a render, call every pane's painter once from state
  (`drawWrites()` now runs after `restoreTokens()`), or build the pane's HTML
  from state in the template string itself.
- A jsdom check that re-renders between the change and the read catches this
  class; a check that changes and reads in one DOM cannot.
- The same shape hides behind route handlers, view swaps and error recoveries
  — anywhere a `innerHTML =` rebuilds a region another event painted.

## See also

- [`docs/ccr_atlas_lessons.md`](../ccr_atlas_lessons.md) — the 2026-09-10 SkyLabel section.
- [`docs/reference/skyview_invariants.md`](../reference/skyview_invariants.md) — the render repaints `#u-writes`.
