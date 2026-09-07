---
title: "Session 239 handoff — the globe goes into SkyView; the staged-to-move mark rides second"
created: 2026-09-07
updated: 2026-09-07
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
---

# You are Session 239

Your moniker is **SkyGlobe**. The name is the priority: at the end of S238 Sam
ruled on the globe prototype — *"Looks great! Let's go with it in next session"*
— so the sky form goes into SkyView. The one item of the governing review still
open (`docs/skyview_video4_findings.md`, item 7, a re-homed course's own mark
saying *staged, not saved*) rides second. Predecessors: SkyOutline S232 → SkyBuild S233 →
S234 → SkyOutline II S235 → SkyFacet S236 → SkyFacet II S237 → **SkyFacet III
S238** (this run).

## What this run did

**Morning — the CPL views** ([PR #1508](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1508)).
Sam's eight rulings became a build: SkyView's control row has **Courses | CPL**
and **Articulations** next to Show; the course outline of record has its CPL
layer with both agencies. The payload is `kb/_build_ccr_cpl.py` →
`prototype/ccr_cpl.json`, rebuilt daily (Step 4d3), CI-guarded. The join is the
articulation crosswalk, so the lit set and the face agree by construction:
1,490 identities both ways.

**Afternoon — the globe** ([#1509](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1509),
[#1510](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1510),
[#1511](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1511)).
Sam asked, unprompted, whether the 2-D sky should become *"a 3-d 360 globe that
rotates"*, heard that a globe shows a hemisphere, and said *build it!* Three
rounds on his reactions, each ask built as a switch on the same page:
`docs/visuals/2026-09-07-skyview-globe-prototype.html`, artifact
https://claude.ai/code/artifact/51f5249d-1884-406d-889e-259b262b86e5. What
stands: islands **By kind** (CTE one side, academic the other, the mixed ones
between, from TOP's one sanctioned use), **Inside** as a window onto the night
sky (30° to 240° across), star-sized dots that twinkle gently, Silver M-IDs with
chips, a turn that slows with zoom, **Day** and **Night**. His close: *"Looks
great!!!"* Generators: `prototype/globe/` (README there). Nothing in
`ccr_universe.js` or the SkyView build changed.

## ⭐ THE THINGS TO CARRY FORWARD

1. **The ruled coverage line carried two wrong numbers, and the surface computes
   its own.** *"1,490 of 6,388 exhibits"* paired an identity count with the
   credit funnel's exhibit count — a universe sharing only **570** ids with the
   1,924 exhibits that reach the map. The line reads **1,924 of 5,497
   articulated exhibits**, from the payload. KB note:
   [`methodology-a-coverage-line-takes-both-numbers-from-one-universe`](kb-notes/methodology-a-coverage-line-takes-both-numbers-from-one-universe.md).
2. **A globe adds no real estate; the order is the gain.** A hemisphere faces you
   (25,580 of 49,896 points at the opening view); the room is the zoom range.
   What the sphere added was an arrangement with a meaning — by kind — and that
   would fit the flat map too. **Sam has now ruled it in** (decision 7 below):
   port it with the lane's invariants re-earned, and put the first design calls
   on a sheet before the code. KB notes:
   [`methodology-a-globe-shows-a-hemisphere-real-estate-is-the-zoom-range`](kb-notes/methodology-a-globe-shows-a-hemisphere-real-estate-is-the-zoom-range.md),
   [`methodology-answer-a-reaction-with-a-switch-not-a-version`](kb-notes/methodology-answer-a-reaction-with-a-switch-not-a-version.md).

⚠️ **The crosswalk's inlined `issuing_agency` is a 2026-05-21 snapshot** — read
agencies from `credential_reference_data.js`, never from the crosswalk. ⚠️ **55
crosswalk exhibits are not in today's feed**; they stay on the map flagged in
words; a re-seed from a fresh `CustomReport_latest.json` is Fable's fix.

## Decisions Sam made this run

Recorded in `cpl_memory` under his name (`sam-ruled-the-globe-direction-2026-09-07`)
and verbatim in the vault braindump
`CPLBrain/03-professional/braindumps/braindump-2026-09-07-1605-skyview-as-a-rotating-globe.md`.

1. **The eight CPL rulings** (the morning sheet): items 1-3 built, 4-5 stand as
   shipped, 6-8 are DR-24 in the governance register with Sam as owner.
2. ***"build it!"*** — the globe, as a throwaway to look at.
3. **On round one:** use the empty sky for separation; M-ID white like stars,
   with a chip to change it; a version with round islands, *"I want to see how
   the difference is perceived"*; slow the rotation; keep the header, add what
   the new view needs. On a screenshot: the inside view looked *"globby"* and
   could not zoom out to a sky. On the ovals: smaller entities, circles work,
   *"since we can zoom almost infinitely, nothing lost."*
4. **On round two** (*"Better! Tweak:"*): proximity by CTE versus academic; full
   use of the blank areas; the inside view's finer dots in both views; the
   inside view filling the window like the night sky (*"this may turn out to be
   the best view!"*); Silver M-IDs. Then: the rotation is nicer now; *"we don't
   need the wrapped option"*; Day versus Night, *"sky blue and with ghosted very
   feint clouds if possible."*
5. **On round three:** *"Looks great!!!"*; slow the rotation proportionally on
   zoom; make the twinkle gentler and slower. Both built before this checkpoint.
6. **On the direction:** *"rotation should be left to right..."* — built: left to
   right in both views.
7. **The ruling, at the close:** *"Looks great! Let's go with it in next
   session"* — the globe is adopted for SkyView, and the next session builds it
   in. This replaces the earlier standing (*keep exploring*); the design calls
   the port raises (NEEDS SAM ⑧) go on a decision sheet first, per his own
   practice. A control decided against leaves the header the same day.

## Verified

The CPL views: Chromium on the served page (the light, the face, the search,
the panel, the outline layer, the hash), `npm run a11y skyview` on all 9 routes,
`ccr_skyview_cpl_face` 62/62 with six mutations failing it,
`ccr_cpl_payload_test.py` 13/13. The globe: Chromium frames per round (outside,
lit, inside at 150°, 240° and 102°, day inside and out, committed, the two
region names), hover sweeps in both views, the repo generators rebuilding the
published page byte for byte, the docs checks and the dependency map.

## YOUR PRIORITY

**Bring the sky form into SkyView** (Sam, 2026-09-07: *"Looks great! Let's go
with it in next session"*). Not a copy of the prototype page into the product:
the prototype is a separate three.js page over a build-time snapshot. The work
is a **Sky view inside SkyView** that reads the live payload and re-earns the
lane's invariants. In this order:

1. **The design calls on a sheet, first** (NEEDS SAM ⑧ below) — a First Light
   decision sheet with reply chips, one sitting. Everything below assumes his
   answers; do not guess them.
2. **The layout as a daily artifact.** `prototype/globe/globe_layout.py`
   already computes committed, spread and by-kind placements from
   `prototype/ccr_universe.json`; make its output a committed payload the daily
   run rebuilds (Step 4d3 is the pattern), with a `--check` and a test, so the
   sphere never lags the map.
3. **A Sky view in `ccr_universe.js`** behind the Views menu: the prototype's
   renderer (the stereographic window, the star sizing, the twinkle while it
   turns, the limb fade, Day and Night) reading the live identities, with the
   CPL face and the Articulations light carried over — they are the same data.
4. **Re-earn the invariants on the sphere**, each with a test where jsdom can
   see it and a Chromium drive where it cannot: the drop hit-test (S237's fix
   was 2-D), the label placer that drops rather than stacks, the keyboard path
   (Tab through disciplines, Enter, Escape), fixed-size text under zoom,
   `prefers-reduced-motion` (no turn, no twinkle), and `npm run a11y skyview`
   with the new route added in `a11y.config.js`.
5. **The staged-to-move mark** (v4 item 7) rides second — it applies to the
   flat map and the sphere alike, so build it once on the model, not the view.

Then, as before: **DR-24's write surface** (through Governance first — Rule 10
a3), the skills layer's fetch problem (NEEDS SAM ①), the backlog
(`docs/skyview_backlog.md`). `prototype/globe/README.md` is the three-step
build of the prototype itself; publish any new round to the same artifact URL
only from the session that owns it, otherwise a new one.

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
⑧ **The port's design calls — one sheet before the code.** Sam has ruled the
globe in; these are the choices the port raises, none of them guessable: (a)
which view opens — the window sky, the outside globe, or the flat map with the
sky one click away; (b) whether the flat map stays as a view at all; (c) the
Day sky against the dark-canvas doctrine (the page chrome stays light either
way); (d) motion by default — the turn and the twinkle — beside the
reduced-motion rule; (e) curation gestures on a sphere: does a drag between
islands re-home a course, as on the flat map, and what does a drop target look
like on a curve; (f) By kind as the default arrangement, and whether the
committed neighborhoods survive inside each side.

## Housekeeping

- The description shards are gitignored: `python3 kb/_build_ccr_universe.py
  --shards-only` (~2 min) before browser work on the outline.
- `kb/ccr_cpl_funnel.json` is a dated hand read of `map_college_cr_unit`
  through the Supabase MCP; refresh it after the next custom-report load.
- `npm install` first; run the suites you touched and let CI run the rest.
  Chromium: `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, playwright at
  `/opt/node22/lib/node_modules/playwright/index.js`, `python3 -m http.server
  8777` from the repo root. **Use it.**
- `git add` new files BEFORE `python3 kb/_build_dependency_map.py` — the builder
  scans tracked files only (it cost one red CI run this session).
- `pkill -f` with a pattern that also appears later in the same shell command
  kills the shell itself; a python heredoc that fails does not stop unchained
  commands after it. Both bit this session; both are in the lessons doc.
- The globe page's data is a build-time snapshot; the daily run does not
  rebuild it, by design.

## `cpl_memory` rows written this run

Morning: `a-coverage-line-takes-both-numbers-from-one-universe` (verified) ·
`the-credit-funnel-and-the-articulation-feed-are-nearly-disjoint-exhibit-universes`
· `the-crosswalks-inlined-issuer-is-a-stale-snapshot-read-agencies-from-the-cer`
· `fifty-five-crosswalk-exhibits-are-absent-from-todays-articulated-feed` ·
`skyview-cpl-face-and-articulations-light-shipped-2026-09-07`. Afternoon:
`sam-ruled-the-globe-direction-2026-09-07` (verified by Sam) ·
`a-globe-shows-a-hemisphere-real-estate-is-the-zoom-range` (verified) ·
`answer-a-reaction-with-a-switch-not-a-version` (verified) ·
`skyview-globe-prototype-three-rounds-shipped-2026-09-07`.

## Read these first, in order

1. [`docs/reference/lanes/skyview-ccr-interface.md`](reference/lanes/skyview-ccr-interface.md)
2. [`docs/skyview_video4_findings.md`](skyview_video4_findings.md) §7 — the ask
3. `tests/ccr_skyview_drop_target.test.js` — the drop model, as assertions

Then run **`python3 kb/doctrine.py --read <files>`** before concluding anything
from the data, and **query `cpl_memory` before you work** (Rule 8).

---

*Greetings, you are SkyGlobe (Session 239), see SkyFacet III's handoff —
`docs/session_239_handoff.md` — let's keep rolling with our queue.*
