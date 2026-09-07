---
title: "Session 240 handoff — read the sheet's replies, then build the Sky view"
created: 2026-09-07
updated: 2026-09-07
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
---

# You are Session 240

Your moniker is **SkyDome**. The name is the job: the inside window sky — the
form Sam was drawn to (*"this may turn out to be the best view!"*) — goes into
SkyView this session, **on the answers he gives to the sheet, never on a
guess**. Predecessors: SkyOutline S232 → SkyBuild S233 → S234 → SkyOutline II
S235 → SkyFacet S236 → SkyFacet II S237 → SkyFacet III S238 → **SkyGlobe S239**
(this run).

## What this run did ([PR #1513](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1513))

**The sheet.** Sam had ruled the globe in at the close of S238; his practice
puts the design calls on one sheet before the code. Eight calls, every figure
measured, reply chips saved to the sheet's own store:
`docs/visuals/2026-09-07-eight-calls-before-the-sky-goes-in.html`, artifact
https://claude.ai/code/artifact/5d683e8a-baa7-4ecc-a0b8-140ad3aee18d. The seven
from the handoff, and an eighth the measurements surfaced: **the M-ID color on
the dark ground**, where his globe ruling (silver, *"like stars"*) and his
legend ruling (violet) meet — and 49,355 of 49,896 points (99%) wear it.

**The sphere placement as a daily artifact** (handoff priority 2).
`kb/_build_ccr_sky.py` → `prototype/ccr_sky.json` (34 KB): each island's center
on the sphere three ways (committed · spread · by kind, as longitude/latitude)
with the CTE share and its base. Fingerprinted, so the daily run relaxes only on
a change and `--check` runs in half a second (Step 4d4;
`tests/ccr_sky_payload_test.py`, 32 checks). A side is held across 0.6/0.4 by a
0.05 margin. The prototype's generator imports the relaxation; the globe page
rebuilds byte for byte.

**The staged-to-move mark** (v4 item 7 — the governing review is now fully
shipped). On the model: `stagedHere` / `stagedAwayFrom` / `stagedWords` /
`unstageMove`; every view asks it. *staged here — not saved* at the
destination; at the origin the course is still drawn (a dashed ghost star),
listed under *Staged to move away*, with *Put back*; labels, hovers and the
outline's band count it. `tests/ccr_skyview_staged_move.test.js` (20 checks);
driven in Chromium; `npm run a11y skyview` 9 of 9.

## ⭐ THE THINGS TO CARRY FORWARD

1. **The replies come first, from the sheet's store.** Artifact tool,
   `read_db`, url above, collection `replies`, one document per item (`v` is
   the verdict — yes · edit · later · dismiss — `fu` the follow-up flag, `note`
   his words). If the store is empty and Sam replied in chat by number, that
   line is the same thing. Record his verdicts in `cpl_memory` under his name
   and the reasons in the commit; then build. **Do not build a call he has not
   answered.**
2. **The port needs no three.js.** A full Canvas 2D redraw of 49,896 points
   measured 18–35 ms in headless software rendering (17.9 ms with a projection
   and the far half culled). Draw on the map's own canvas; the CSP and the
   public/private split stay untouched.
3. **The payload contract.** `prototype/ccr_sky.json` gives each island
   `committed` / `spread` / `kind` as `[lon°, lat°]`, plus `radians_per_unit`.
   A point's place is its island's center walked `east = (p.x − isl.x) ·
   radians_per_unit`, `north = −(p.y − isl.y) · radians_per_unit` along the
   surface — the prototype's `expmap()` in `prototype/globe/build_globe.py`
   (search `function expmap`), with `toSphere` for the committed centers.
   The window projection (stereographic, 30°–240° across), the star sizing in
   pixels, the limb fade and the twinkle are in the same file; port them.
4. **The Day sky exists only by its rim.** Silver stars 1.24:1 and the light
   1.08:1 on the day ground; the prototype gives every dot a seal-blue rim by
   day (7.2:1). Whatever he rules on item 3, the rim comes with Day, and the
   legend's swatches must wear it too.
5. **The docked panel narrows the canvas.** Opening an identity docks the
   details panel; a screen position computed from the canvas rect before the
   open is stale after it. Two Chromium drives dropped on empty space this
   way. Measure after the open; jsdom cannot see it.
6. **Re-earn every invariant on the sphere with a test where jsdom can see it
   and a Chromium drive where it cannot** — the drop hit-test by ANGLE on the
   sphere (the S237 fixture ports as is), the label placer (drop, never
   stack), Tab/Enter/Escape, fixed-size text under zoom,
   `prefers-reduced-motion` (no turn, no twinkle), and the a11y route added in
   `a11y.config.js`.

## Decisions Sam made this run

None — he opened the session with the greeting and had not replied to the
sheet by the checkpoint. Nothing here presumes an answer.

## Verified

The sheet: `tests/decision_sheet_replies.test.js` 27/27 (every bare token
resolves), one rendered look in Chromium, published with `capabilities {db}`.
The placement: 32/32, `--check` 0.56 s, the prototype's layout and page byte
for byte from the shared relaxation. The mark: 20/20 new; every SkyView suite
green (`drop_target` 14, `universe` 222, `search_show` 130, `outline` 50,
`hover_disc` 10, `first` 51, `cpl_face` 62); a real drag on the served page;
`npm run a11y skyview` 9 of 9 at three widths; the dependency map with 0
warnings.

## YOUR PRIORITY

1. **Read the replies** (carry-forward 1). Execute each verdict: `yes` builds
   the proposal as written; `edit` builds his wording; `later` parks it in the
   lane's NEEDS SAM; `dismiss` records why. Write the verdicts to `cpl_memory`
   (`verified_by` Sam) and the reasons in the commit body.
2. **Build the Sky view in `prototype/ccr_universe.js`** behind the Views menu
   per the answers — the window sky (and the globe, if he keeps it) reading
   `ccr_sky.json` + `ccr_universe.json`, on the map's own canvas, with the CPL
   face and the Articulations light carried (same data), and the staged mark
   read from the same helpers. Rebuild `skyview.html`
   (`python3 kb/_build_ccr_atlas_extract.py && python3 prototype/build_ccr_atlas.py`)
   and commit it, as #1508 and #1513 did.
3. **Re-earn the invariants** (carry-forward 6), then `npm run a11y skyview`
   with the new route.
4. Then, as before: **DR-24's write surface** (through Governance first — Rule
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
⑧ **The eight calls on the sheet** (artifact above): which view opens; whether
the flat map stays; the Day sky; motion by default; curation on a curve; By kind
as the arrangement; the prototype's controls; the M-ID color on the dark ground.

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
- `git add` new files BEFORE `python3 kb/_build_dependency_map.py` — the builder
  scans tracked files only.
- The globe prototype's data is a build-time snapshot; the daily run does not
  rebuild it, by design. `prototype/globe/README.md` is its three-step build.
- The artifact service refused a wake subscription for this session's sheet
  (a session credential is required), so no session is woken by his replies;
  read the store.

## `cpl_memory` rows written this run

`sky-design-calls-sheet-handed-over-2026-09-07` (question, for Sam) ·
`silver-and-violet-two-rulings-meet-on-the-dark-ground` (question, for Sam) ·
`the-day-sky-fails-non-text-contrast-for-three-of-four-legend-colors` (fact) ·
`skyview-sky-placement-is-a-daily-artifact-2026-09-07` (milestone) ·
`skyview-staged-to-move-mark-shipped-2026-09-07` (milestone) ·
`a-staged-state-lives-on-the-model-and-every-view-asks-it` (procedure) ·
`a-slow-build-fingerprints-its-inputs-so-the-check-stays-cheap` (procedure) ·
`the-docked-panel-narrows-the-canvas-measure-after-the-open` (pitfall).

## Read these first, in order

1. The sheet's replies (`read_db`), then the sheet itself.
2. [`docs/reference/lanes/skyview-ccr-interface.md`](reference/lanes/skyview-ccr-interface.md)
3. `prototype/globe/build_globe.py` — the renderer to port (`expmap`, the
   window projection, the star sizing, the labels).
4. `tests/ccr_skyview_drop_target.test.js` and
   `tests/ccr_skyview_staged_move.test.js` — the harness, and the two models
   the sphere must honor.

Then run **`python3 kb/doctrine.py --read <files>`** before concluding anything
from the data, and **query `cpl_memory` before you work** (Rule 8).

---

*Greetings, you are SkyDome (Session 240), see SkyGlobe's handoff —
`docs/session_240_handoff.md` — let's keep rolling with our queue.*
