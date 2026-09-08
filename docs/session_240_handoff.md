---
title: "Session 240 handoff — the Sky is in; his eye on it, then the frame budget"
created: 2026-09-07
updated: 2026-09-07
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_242_handoff.md
---

# You are Session 240

Your moniker is **SkyDome**. The name is the job: the sky is IN — SkyView now
opens as the inside window onto the night sky — and this session is the one
that looks at it with Sam, keeps it smooth on his machine, and carries the
queue behind it. Predecessors: SkyOutline S232 → SkyBuild S233 → S234 →
SkyOutline II S235 → SkyFacet S236 → SkyFacet II S237 → SkyFacet III S238 →
**SkyGlobe S239** (this run).

## What this run did

Two PRs. [#1513](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1513)
in the afternoon: the eight design calls on ONE sheet with reply chips
(`docs/visuals/2026-09-07-eight-calls-before-the-sky-goes-in.html`, artifact
https://claude.ai/code/artifact/5d683e8a-baa7-4ecc-a0b8-140ad3aee18d), the
sphere placement as a daily artifact (`kb/_build_ccr_sky.py` →
`prototype/ccr_sky.json`, fingerprinted, Step 4d4, 32 checks), and the
staged-to-move mark on the model (v4 item 7 — the governing review is fully
shipped).

Then Sam answered the sheet — **eight items, eight `yes`, no notes** — and
#1514 built the Sky the same evening, in `prototype/ccr_universe.js` on the
map's own canvas: `#skyview` opens the Sky; **Sky · Globe · Map** in the row;
Night by default, Day keeping the rim; a slow turn that stops at the first
touch, twinkle only while turning, none of either under reduced motion; drag
and drop by angle; By kind with its two region names; silver M-IDs on every
dark canvas; the prototype's controls as tabled (Rotate came; Discipline names
folded into More → Show or hide; the readout in degrees / radii / percent; the
Islands switch, the color chips and the count line left). Every invariant
re-earned on the sphere: the S237 drop fixture passes on the curve, the label
placer and Tab/Enter/Escape unchanged, fixed-size text, `prefers-reduced-motion`,
`#globe` and `#map` in `a11y.config.js`.

## ⭐ THE THINGS TO CARRY FORWARD

1. **The sphere is the map through a projection, not a second renderer.**
   `prepSphere()` projects each island's center and Jacobian once a frame
   (`isl._s`); `w2s(x,y,isl)` is one multiply-add from it; `pick()` reads the
   same cache. Keep it that way — a second hit-test or a second placer is the
   drift that would make the sphere disagree with the map. KB note:
   `docs/kb-notes/methodology-the-sphere-is-the-map-through-a-projection.md`.
2. **The harness declares what opens.** Production opens the Sky; a flat-map
   suite sets `window.CPL_SKYVIEW_OPENS = "map"` in `beforeParse` (seven do).
   `tests/ccr_skyview_sky.test.js` (50 checks) is the sphere's suite: the
   fixture's two islands (Welding CTE, English academic), the eclipse
   reproduced on the curve, the keyboard path, Day, Globe, Map, reduced motion.
3. **The frame budget is the open engineering question.** 117 → 42.5 ms a draw
   after batching the sub-`ID_ZOOM` stars per color|alpha bucket; 13.5 rAF
   frames a second in headless software rendering. A GPU should do better;
   nobody has measured it on Sam's machine. If it reads slow, the lever is an
   offscreen star layer invalidated by view change, or a WebGL point pass
   behind the same `w2s` — never per-point work. Measure first
   (`time_draw.js` in this run's scratchpad is the recipe: serve, open, time
   `draw()` at the opening window).
4. **The globe is the sky mirrored.** The window's right is the globe's left;
   `projectDir`/`unprojectDir` flip x outside and the drag and arrow signs
   flip with it. A test that passes on one and fails on the other is usually
   this sign.
5. **A fake canvas needs every method the draw path calls.** The last failing
   check read *"globe 150% #map"* — a state bug on its face, actually
   `ctx.clip is not a function` leaving `setProj` half done. One stack trace
   before any theory.
6. **The docked panel narrows the canvas** — measure a screen position after
   the open, never before (two Chromium drives dropped on empty space).

## Decisions Sam made this run

**The sheet, all eight `yes` (2026-09-07, 19:59–20:02 UTC; no notes, no
follow-ups; then "decisions done!")**: (1) the Sky opens, once it passes the
drop test, the keyboard path and the a11y route in the same PR; (2) Sky ·
Globe · Map as three words, the Map stays; (3) Night by default, Day keeps the
rim, one control and one memory; (4) the turn stops at the first touch,
twinkle only while turning, none under reduced motion; (5) drag and drop by
angle on the sphere, a Pan drag turns it; (6) By kind with the two region
names; (7) the prototype's controls' fates as tabled; (8) silver M-IDs on
every dark canvas. All eight are built; `cpl_memory` holds them under his name.

## Verified

The Sky: 50/50 new checks; eight SkyView suites green (`universe` 222,
`search_show` 130, `cpl_face` 62, `outline` 50, `staged_move` 20,
`drop_target` 14, `hover_disc` 10, `sky` 50); the full suite with check floors
recorded; `npm run a11y skyview` **11 of 11** routes at three widths on the
final build; two Chromium drives on the served page (turn, fly, open, a
real-mouse drag landing on the neighbor's circle, Day, Globe, Map, no page
errors); the dependency map with 0 warnings.

## YOUR PRIORITY

1. **Sam's eye on the Sky** (NEEDS SAM ⑧) — the opening window, the turn's
   pace, the region names, Day's rim, and above all whether it is smooth on
   his machine. Ask for a number if he can give one (the readout says what the
   window holds; a stutter he can describe is enough).
2. **The frame budget**, only if he says it drags: measure on the served page
   first (carry-forward 3), then the offscreen layer or the WebGL point pass.
   The drop test, the keyboard path and `npm run a11y skyview` run again in
   the same PR — item 1 of the sheet says so.
3. Then, as before: **DR-24's write surface** (through Governance first — Rule
   10 a3), the skills layer's fetch problem (NEEDS SAM ①), the backlog
   (`docs/skyview_backlog.md`).

## NEEDS SAM

① Where agency skill statements come from when the three sources disagree
(pilot: an AWS welding certification) — the only thing blocking the skills layer.
② Which disciplines are grab bags besides Vocational and the no-discipline pile.
③ The live-session banner — what link, which tabs.
④ The three legacy anchors with no seed discipline (`M-ID HOSP 100`, `104`, `102`).
⑤ Whether 60 is the right search depth; whether an emptied discipline vanishes
or ghosts.
⑥ The right-edge glyph rail from his Obsidian screenshot — his call.
⑦ **His eye on the CPL face** (`#skyview/cpl`) — does the credential-led label
read right, and is *Articulations* the word.
⑧ **His eye on the Sky as shipped** — and whether it runs smoothly for him.

## Housekeeping

- The description shards are gitignored: `python3 kb/_build_ccr_universe.py
  --shards-only` (~2 min) before browser work on the outline.
- `kb/ccr_cpl_funnel.json` is a dated hand read of `map_college_cr_unit`
  through the Supabase MCP; refresh it after the next custom-report load.
- `npm install` first; run the suites you touched and let CI run the rest.
  Chromium: `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, playwright at
  `/opt/node22/lib/node_modules/playwright/index.js`, `python3 -m http.server
  8777` from the repo root. **Use it** — and run `npm run a11y` from the repo
  root (the shell's cwd resets between calls).
- Rebuild the served page after touching the JS or the template:
  `python3 prototype/build_ccr_atlas.py` (add
  `python3 kb/_build_ccr_atlas_extract.py` first only when the data extract
  should move — it changes the file's timestamp line every time).
- `git add` new files BEFORE `python3 kb/_build_dependency_map.py` — the builder
  scans tracked files only.
- The globe prototype (`prototype/globe/`, `docs/visuals/…globe-prototype.html`)
  is now history: the sky form lives in SkyView. Its generators stay for the
  relaxation SkyView's daily artifact imports.

## `cpl_memory` rows written this run

Afternoon: `sky-design-calls-sheet-handed-over-2026-09-07` and
`silver-and-violet-two-rulings-meet-on-the-dark-ground` (questions, now
superseded by his answers) · `the-day-sky-fails-non-text-contrast-for-three-of-four-legend-colors`
· `skyview-sky-placement-is-a-daily-artifact-2026-09-07` ·
`skyview-staged-to-move-mark-shipped-2026-09-07` ·
`a-staged-state-lives-on-the-model-and-every-view-asks-it` ·
`a-slow-build-fingerprints-its-inputs-so-the-check-stays-cheap` ·
`the-docked-panel-narrows-the-canvas-measure-after-the-open`.
Evening: `sam-ruled-the-eight-sky-calls-2026-09-07` (decision, his — written at "decisions done!") ·
`skyview-opens-as-the-sky-2026-09-07` (milestone) ·
`the-sphere-is-the-map-through-a-projection` (procedure) ·
`a-fake-canvas-needs-every-method-the-draw-path-calls` (pitfall) ·
`the-sky-turn-costs-42-ms-a-frame-in-software-rendering` (fact).

## Read these first, in order

1. [`docs/reference/lanes/skyview-ccr-interface.md`](reference/lanes/skyview-ccr-interface.md)
   — the invariants now include the sphere's.
2. `docs/ccr_atlas_lessons.md`, the S239 evening section — what went wrong on
   the way and the numbers.
3. `tests/ccr_skyview_sky.test.js` — the sphere's harness and fixture.
4. `prototype/ccr_universe.js`: `prepSphere`, `w2s`, `projectDir`, `draw()`'s
   star pass (`starPush`/`starFlush`), `setProj`, `turnFrame`.

Then run **`python3 kb/doctrine.py --read <files>`** before concluding anything
from the data, and **query `cpl_memory` before you work** (Rule 8).

---

*Greetings, you are SkyDome (Session 240), see SkyGlobe's handoff —
`docs/session_240_handoff.md` — let's keep rolling with our queue.*
