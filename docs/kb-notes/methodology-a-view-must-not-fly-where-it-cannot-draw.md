---
title: A view must not fly where it cannot draw
created: 2026-08-25
updated: 2026-08-25
tags: [methodology, ui, rendering, verification, pitfall]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/ccr_atlas_lessons]]"
  - "[[docs/kb-notes/methodology-the-measuring-browser-can-hide-the-defect]]"
artifacts:
  - prototype/ccr_universe.js
  - prototype/check_ccr_atlas.js
---

# A view must not fly where it cannot draw

> **One-sentence summary** — when one part of a view decides *where to look* and
> another decides *what is drawn*, a threshold known to only one of them
> produces a report that contradicts the screen.

## Context

SkyView's search reported *"19 match across 9 subjects … Ringed in red"* and
drew nothing. The renderer draws course nodes only above zoom `k=0.20`. The
search flew to "fit all the hits", which for hits scattered across nine subjects
computes to about `0.12`. **The search chose a zoom the renderer refuses to draw
at, then described what would have been there.**

Reported by a human in a browser. No test caught it, and none could have: the
search's own assertions were about *finding* hits, and the renderer's were about
*drawing* nodes. Neither owned the sentence that tied them together.

## Why it is easy to miss

Both halves are individually correct. Fitting the results in view is the obvious
thing for a search to do. Culling invisible detail is the obvious thing for a
canvas to do. The defect exists only in the *relationship*, and it appears only
on inputs that spread far enough — a search inside one subject worked fine, so
the feature demoed perfectly.

It also fails **silently and plausibly**: a wide view with no highlights looks
like a search that found nothing nearby, which is a real state.

## What to do

1. **One constant, read by both.** The renderer's threshold is not the
   renderer's private business the moment anything else chooses a viewport.
   Export it; do not restate it.
2. **Never claim a rendering you have not made.** If the hits cannot be framed
   together at a drawable zoom, go somewhere they *can* be seen and say what you
   did — do not frame them all invisibly and describe rings.
3. **Assert the relationship, not the halves.** The check that matters is
   literally *"it never claims rings at a zoom that draws none"*. Removing the
   floor reproduces the reported symptom at exactly the zoom in the user's
   screenshot, which is what makes it a regression guard rather than a
   restatement.

## The same shape, one grain down

The same session: flying into a crowded subject queued **344** course titles and
**54** fit — 290 names painted on top of each other. The file had carried
collision rejection for *island* names since it was written, and described an
unreadable pile as "the exact failure of a global graph view". The rule had been
stated and simply never applied at the next level of detail.

**A principle written down for one layer does not propagate to the layer below
it on its own.**
