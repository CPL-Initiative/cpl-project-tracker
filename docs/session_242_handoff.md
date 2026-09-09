---
title: "Session 242 handoff — the asteroid field is culled; the frame budget is the remaining lever"
created: 2026-09-08
updated: 2026-09-08
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_245_handoff.md
---

# You are Session 242

Your moniker is **SkyTrue**. The name is the job: two runs in a row shipped
fixes that were *correct* and did not fix what Sam saw, and this one keeps the
measurements pointed at the thing he is actually looking at. Predecessors:
SkyFacet III S238 → SkyGlobe S239 → SkyDome S240 → **SkyClear S241** (this run).

## What this run did

One PR: [#1516](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1516).
Sam reported the flicker was still there after S240's two fixes, then described
it: *"an enlarged grouping that is crossing over all the others — like a loose
asteroid field spiraling around."* That sentence was the diagnosis.

**The bug.** The sky is stereographic, so the scale at an angle `ang` off the
view direction is `sec²(ang/2)` — 1.3× at 60°, 4× at 120°, **131× at 170°**.
`projectDir` only refuses past 174.8°, so an island almost directly BEHIND the
reader still projects, at a hundredfold scale. The screen cull is a bounding box
built from `isl.r * k`, so that inflated radius covers the window and **the cull
passes**. Fixed with an ANGULAR test. Largest island scale **88.4× → 1.5×**;
frames containing one over 8× **149/150 → 0/150**; and because **89 of 159
islands at the default zoom were drawn having never been visible**, the frame
rate went **11.4 → 17.4 fps**.

**Sam's two asks**, both settled by measurement: the sky opens **188° across**
(the widest where all 99 islands keep their stars — 240° drops four), and the
**Map button** leaves the row while the Map itself stays in the code.

## ⭐ THE THINGS TO CARRY FORWARD

1. ⚠️ **S240'S `dt` FIX WAS RIGHT AND MADE THE PICTURE WORSE, AND IT DID NOT
   MEASURE THAT.** Time-true motion at 8 fps steps further than broken
   half-speed motion: per-frame visual change **18.59 → 21.87**. A correctness
   fix and an appearance fix are different claims needing different
   measurements. Verifying the property you changed is not verifying the
   outcome you were asked for.
2. ⚠️ **THE EVIDENCE WAS IN S240'S OWN OUTPUT.** Its island-scale probe logged
   Music at `k = 71.5` while every other island in the same table sat between
   0.2 and 2.4, and the run read it as a normal cull. **Scan measurements for
   outliers, not only for the value you went looking for.**
3. ⭐ **A CULL MUST BE EXPRESSED IN THE SPACE WHERE THE CONSTRAINT LIVES.** The
   constraint is angular; the cull was in projected pixels, where a divergent
   projection makes "far away" and "fills the screen" identical.
4. ⚠️ **A LEVER THAT MOVES THE METRIC IS NOT A LEVER THAT FIXES THE CAUSE.**
   This run measured a rate sweep and nearly shipped a slower turn (per-frame
   change 21.87 → 7.72) before finding the real bug. Reverted.
5. ⚠️ **THE OPENING WIDTH IS WRITTEN IN TWO PLACES** — `sph`'s initializer and
   `resetView()` — and `resetView` is the one that runs. Changing only the
   initializer changed nothing, and only a browser probe caught it.
6. **The remaining shimmer is not a defect.** With the giant island gone the
   per-frame change is spread over 877 of 1008 cells — uniform motion plus
   ~27,000 one-pixel stars aliasing. The lever is frame rate.
7. **Two committed rulings were reversed in two days** (the staged-away row,
   then the Map button). Both are named in the code AND beside the new
   assertion in the suite. A reversal that is not recorded reads as a
   regression to the next session.

## Decisions Sam made this run

- **"Default might look better a bit smaller...as long as the stars show up"**
  → 188° across, chosen against the measured star-visibility table, not by eye.
- **"WE don't need the map view anymore, not with this view showing so nicely"**
  → the Map button leaves the row. ⚠️ This reverses his own sheet item 2 of
  2026-09-07 ("the Map stays").
- **"SkyView is looking fabulous and will blow folks away once we get the bugs
  ironed out"** (2026-09-08) — the direction is right; the work is polish.

## Verified

309 test files pass; `ccr_skyview_sky.test.js` updated to both reversals, floored
at 51 (no floor lowered); `npm run a11y skyview` **11/11** routes at three
widths; the dependency map regenerated, 0 warnings.

## YOUR PRIORITY

1. **Sam's eye on the Sky, again** — is the asteroid field gone, and does the
   drift read acceptably at ~17 fps?
2. **The frame budget**, if he says it still steps. The map of it is corrected:
   the canvas is ~4% of the frame (27,000 rects in 5.9 ms of 133); the cost is
   per-point JS and text. S241 took `emptied()`, `measureText` and `cw()`/`ch()`
   for ~10%; the angular cull took 53% by drawing fewer points. **Fewer points
   per frame is the lever that works** — the next candidates are the remaining
   per-node work inside the island loop.
3. Then the standing queue: **DR-24's write surface** (Governance first — Rule
   10 a3), the skills layer's fetch problem (NEEDS SAM ①), and
   `docs/skyview_backlog.md`.

## NEEDS SAM

① Where agency skill statements come from when the three sources disagree.
② Which disciplines are grab bags besides Vocational and the no-discipline pile.
③ The live-session banner — what link, which tabs.
④ The three legacy anchors with no seed discipline (`M-ID HOSP 100`, `104`, `102`).
⑤ Whether 60 is the right search depth; whether an emptied discipline vanishes
or ghosts.
⑥ The right-edge glyph rail from his Obsidian screenshot — his call.
⑦ His eye on the CPL face (`#skyview/cpl`).
⑧ **His eye on the Sky as culled** — the artifact he described is gone and
measured; open is whether the drift now reads smooth on his machine.

## Read these, in this order

1. This file.
2. `docs/reference/lanes/skyview-ccr-interface.md` — the invariants; the S241
   block is at the top.
3. `docs/ccr_atlas_lessons.md`, the 2026-09-08 S241 section.
4. `docs/kb-notes/methodology-a-bug-report-is-evidence-not-diagnosis.md` — its
   postscript is this run.

## Safety patterns to honor

- **The page must be SERVED, not opened** — `file://` blocks the payload fetch.
- **Edit the SOURCES** (`prototype/ccr_universe.js`, `prototype/ccr_atlas_v1.html`)
  and rebuild with `python3 prototype/build_ccr_atlas.py`.
- **`python3 kb/_build_dependency_map.py`** after any change that moves code.
- **`npm test` sees none of this.** Drive a real browser; run `npm run a11y skyview`.
- Never force-push `main` (Rule 5). Squash-merge on green `test`.

---

Greetings, you are SkyTrue (Session 242), see SkyClear's handoff —
`docs/session_242_handoff.md` — let's keep rolling with our queue.
