---
title: "Session 241 handoff — the recordings are answered; his eye on the sky, then the frame budget"
created: 2026-09-07
updated: 2026-09-07
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_242_handoff.md
---

# You are Session 241

Your moniker is **SkyClear**. The name is the job: S240 took three screen
recordings of things flickering, changing color and refusing to move, and cleared
all of them — your run is the one that finds out whether the sky actually reads
clear on Sam's machine, and then goes after the frame budget with a profile
instead of a guess. Predecessors: SkyOutline S232 → SkyBuild S233 → S234 →
SkyOutline II S235 → SkyFacet S236 → SkyFacet II S237 → SkyFacet III S238 →
SkyGlobe S239 → **SkyDome S240** (this run).

## What this run did

One PR: [#1515](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1515).
Sam sent **three screen recordings** and four asks; every finding was reproduced
in Chromium on the served page before it was touched.

- **The flicker, two causes.** `dt` was clamped at 0.1 s, BELOW the real frame
  time (133 ms at 240° across), so `sph.spin` advanced a fixed 7.20e-3 rad while
  the interval swung 192–319 ms — and the sky turned at **0.0393 rad/s against an
  intended 0.0720**. And `showNodes = k > NODE_ZOOM` is a bare threshold on a
  PER-ISLAND scale: 18 of 159 islands sit within ±3% of it at 240° across, 11
  flipped inside 120 frames, each blinking a whole discipline's dot field.
  Fixed: `TURN_DT_MAX`, and hysteresis with `pick()` reading the same memory.
- **The purple sky.** `--sky-island-sel` #2E2A44 is the selected island's fill;
  past the zoom where its edge leaves the window it simply *is* the sky.
- **The stuck carry.** The panel routes to `applyMove` never cleared `drag`, so
  after one move from the panel EVERY Drag button was a silent no-op for the
  rest of the session.
- **Re-targeting a staged move** from the row that names the wrong destination.
- **The outline is a sheet over the map** (Sam's own idea, better than the Back
  button he asked for in the same sentence), a **Back** that parks and restores
  the camera, a **sidebar that closes by dragging its border**, and **COBI** in
  the ⋮ menu.

## ⭐ THE THINGS TO CARRY FORWARD

1. **A bug report is evidence, not diagnosis.** None of Sam's three sentences
   named its own cause, and one ("staged move seems to clear but…") pointed at a
   button that worked perfectly. Extract frames, diff them, sample the pixels,
   build the rival hypothesis, run the control. KB note:
   `docs/kb-notes/methodology-a-bug-report-is-evidence-not-diagnosis.md`.
2. ⚠️ **BEWARE THE METRIC THAT IMPROVES BECAUSE THE THING STOPPED EXISTING.** A
   variant dropped the per-frame diff 18.26 → 2.69 and nearly shipped; it had
   switched every dot off. An empty canvas is very stable. Always carry a second
   observable that would notice the regression.
3. **S239's frame-budget lever was backwards, and the profile is now recorded.**
   The canvas is 4% of the frame: one batched path of 27,000 rects fills in
   **5.9 ms of 133 ms**, `clearRect` 0.02, `readPal()` 0.03. The cost is
   per-point JS and text — **`measureText` 12.3%**, `emptied()` 6.7% (fixed),
   `save` 7.4%, `cw()`/`ch()` 2.7% (each a `clientWidth` layout read from
   `w2s`). An offscreen star layer or a WebGL pass buys the 5.9 ms and leaves
   the other 127. **Cheap next steps: a text-width memo keyed on font+string,
   and hoisting `cw()`/`ch()` out of the per-point path.** ⚠️ Headless, no GPU —
   the order should hold, the absolutes will not.
4. **When a scalar becomes a field, every threshold on it needs hysteresis.**
   `NODE_ZOOM` was the one a reader parked on; `ID_ZOOM`, `TITLE_ZOOM` and
   `MEMBER_ZOOM` have the same shape and are unfixed.
5. **`npm test` saw none of this.** 309 green suites sat beside all six defects.
   Two needed a real browser; the sidebar's 5px sideways scroll needed
   `npm run a11y skyview`, which failed all 11 routes at every width.
6. **A guard needs an owner for its release.** `drag` had four release sites,
   none of them the function every route converges on.

## Decisions Sam made this run

- **The outline should be a popup, not a view** (2026-09-07): *"Maybe best way to
  avoid this is to make the course outline a popup that can be closed and we
  never have to exit skyview."* Built as a sheet over the map; the hash is left
  alone because the reader has not left.
- **The sidebar must close by its own border** — *"so I don't have to know that
  the hide/unhide selector is in the 3-dot menu."*
- **A staged move must be re-targetable** — *"Note how I can't move this course
  out of its previous move to a new one — the correct intro course."* ⚠️ This
  **reversed** an S239 test assertion (`li.away` carried no drag button); the
  check now pins both buttons with the old reasoning named in a comment.
- **The night must survive a filter** — *"should stay the same as was selected
  (night) on opening screen."*
- **A back button on any SkyView screen he switches to.**
- **A COBI link on the ⋮ menu.**

## Verified

309 test files pass; new `tests/ccr_skyview_carry_release.test.js` (16 checks),
confirmed failing without each of its two fixes; `npm run a11y skyview` **11/11**
routes at three widths; the dependency map regenerated (0 warnings) after CI
caught it stale; the flicker/purple/camera measurements re-run after every
subsequent change.

## YOUR PRIORITY

1. **Sam's eye on the Sky as fixed** — does it read smooth now, on his machine?
   The turn is time-true and the islands no longer blink, but the frame rate is
   unchanged (7.5–12 fps headless; nobody holds a number from his hardware).
2. **The frame budget**, with carry-forward 3 as the map. Start with the
   `measureText` memo and the `cw()`/`ch()` hoist — both are contained, and both
   are measurable on the served page before and after. ⚠️ The drop test, the
   keyboard path and `npm run a11y skyview` run again in the same PR.
3. Then the standing queue: **DR-24's write surface** (through Governance first —
   Rule 10 a3), the skills layer's fetch problem (NEEDS SAM ①), and
   `docs/skyview_backlog.md`.

## NEEDS SAM

① Where agency skill statements come from when the three sources disagree
(pilot: an AWS welding certification) — the only thing blocking the skills layer.
② Which disciplines are grab bags besides Vocational and the no-discipline pile.
③ The live-session banner — what link, which tabs.
④ The three legacy anchors with no seed discipline (`M-ID HOSP 100`, `104`, `102`).
⑤ Whether 60 is the right search depth; whether an emptied discipline vanishes
or ghosts.
⑥ The right-edge glyph rail from his Obsidian screenshot — his call.
⑦ His eye on the CPL face (`#skyview/cpl`) — does the credential-led label read
right at his zoom, and is *Articulations* the word?
⑧ **His eye on the Sky as fixed** — the smoothness half is answered and
measured; what is open is whether it now READS smooth to him.

## Read these, in this order

1. This file.
2. `docs/reference/lanes/skyview-ccr-interface.md` — the lane's invariants; the
   S240 block is at the top of the invariants and in *Measured in a browser*.
3. `docs/ccr_atlas_lessons.md`, the 2026-09-07 S240 section — the round-by-round,
   including the two hypotheses that were wrong.
4. `docs/kb-notes/methodology-a-bug-report-is-evidence-not-diagnosis.md`.
5. `docs/skyview_backlog.md` for the queue behind the priority.

## Safety patterns to honor

- **The page must be SERVED, not opened** — `file://` blocks the payload fetch.
- **Edit the SOURCES** (`prototype/ccr_universe.js`, `prototype/ccr_atlas_v1.html`)
  and rebuild with `python3 prototype/build_ccr_atlas.py`; `skyview.html` is
  generated and the payload is inline, so a JS-only change never reaches the page.
- **`python3 kb/_build_dependency_map.py`** after any change that moves code —
  CI `--check`s it, and it failed #1515's first run on a line-number shift alone.
- Never force-push `main` (Rule 5). Squash-merge on green `test`.

---

Greetings, you are SkyClear (Session 241), see SkyDome's handoff —
`docs/session_241_handoff.md` — let's keep rolling with our queue.
