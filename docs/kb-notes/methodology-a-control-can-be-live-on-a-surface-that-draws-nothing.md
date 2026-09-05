---
title: A control reported as broken may be live on a surface that draws nothing
created: 2026-09-05
updated: 2026-09-05
tags: [methodology, ui, debugging, skyview]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
artifacts:
  - prototype/ccr_universe.js
  - tests/ccr_skyview_search_show.test.js
---

# A control reported as broken may be live on a surface that draws nothing

> **One-sentence summary** — Before changing a control that a user says does
> nothing, check whether the control is working and the surface it acts on is
> empty at the state the user is in.

## Context

Sam, 2026-09-05: *"Show:All box does not respond when making changes."* The
Show menu's twelve switches were wired correctly, repainted their label,
recomputed their hint, and called `draw()` on every change. Nothing was wrong
with any of them. Measured in Chromium, stepping the zoom up from the view
SkyView opens on:

| k | 0.100 | 0.141 | 0.197 | 0.276 | 0.386 |
|---|---|---|---|---|---|
| a filter change alters the canvas | ✗ | ✗ | ✗ | ✓ | ✓ |

Individual courses are only drawn past `NODE_ZOOM` (0.20), and SkyView opens at
**k = 0.100** — three zoom steps below it, because 49,896 dots at 10% are a
smear and the disciplines are what is worth reading there. Every switch changed
a number and moved nothing on screen. Story:
[docs/ccr_atlas_lessons.md](../ccr_atlas_lessons.md).

## The claim

**A control that is correct and a control that is broken look identical when
the thing it acts on is not being drawn.** Level-of-detail thresholds, virtual
scrolling, culling, collapsed groups, filtered-away rows — any of them can put
a user in a state where a working control produces no visible change.

The diagnosis has a shape:

1. **Reproduce at the user's state, not a convenient one.** The bug was
   invisible at any zoom a developer would naturally test at, and visible at
   the one the page opens on. A repro that starts by zooming in has already
   destroyed the evidence.
2. **Instrument the surface, not the control.** Asserting the checkbox toggled
   and the label repainted confirms the half that was never in doubt. Hash the
   rendered output before and after; if it is byte-identical, the control is
   not the defect.
3. **Then choose between two fixes, and they are not equivalent.** Either lower
   the threshold so the control's target is drawn, or **make the filter reach
   what IS drawn at that state.** The second is usually right: the threshold
   exists for a reason (here, fifty thousand sub-pixel dots), and defeating it
   trades a dead control for a stuttering one.

The fix shipped was the second: a discipline holding no course that passes the
switches is no longer drawn at all, so *Deselect all* empties the map at the
zoom it opens on and a credit filter drops the disciplines that teach nothing
matching.

## Consequences

- **Say the zoom fact in the interface.** A partial filter still moves little at
  low zoom, so the hint now names why: *at this magnification the map draws
  disciplines, not individual courses.* A control that cannot always show its
  effect should explain the gap rather than leave the reader to infer breakage.
- **Hit-testing must honor the same filter as drawing.** `pick()` was still
  selecting points the filter had hidden, so a click opened the inspector on an
  invisible course — the filter honored by the eye and not by the hand, which is
  worse than no filter.
- ⚠️ **Watch for the second-order gap.** Making the filter drop empty
  disciplines meant a search pick could land on a discipline that was no longer
  drawn — the pick landed on empty ground. Any change that lets a filter hide
  MORE needs a pass over every path that navigates TO the hidden thing.

## Counter-signals

This note does not apply when the control genuinely is not wired: check that
the handler fires at all before reaching for this explanation. The tell is
whether *any* observable state changes — a label, a count, a hint. If nothing
anywhere moves, it is an ordinary wiring bug.
