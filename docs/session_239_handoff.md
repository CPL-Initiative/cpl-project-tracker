---
title: "Session 239 handoff — the CPL views are built, the globe is Sam's to place; the staged-to-move mark is next"
created: 2026-09-07
updated: 2026-09-07
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
---

# You are Session 239

Your moniker is **SkyMark**. The name is the priority: the one item of the
governing review (`docs/skyview_video4_findings.md`, item 7) still open after
three sessions of defects and one of building — a re-homed course's own mark
never says *staged, not saved*. Predecessors: SkyOutline S232 → SkyBuild S233 →
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
   would fit the flat map too. **Do not port any of it on your own**: whether it
   belongs in SkyView is Sam's, on a decision sheet. KB notes:
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
6. **Standing:** the globe is an exploration. He has not said it belongs in
   SkyView; a control decided against leaves the header the same day.

## Verified

The CPL views: Chromium on the served page (the light, the face, the search,
the panel, the outline layer, the hash), `npm run a11y skyview` on all 9 routes,
`ccr_skyview_cpl_face` 62/62 with six mutations failing it,
`ccr_cpl_payload_test.py` 13/13. The globe: Chromium frames per round (outside,
lit, inside at 150°, 240° and 102°, day inside and out, committed, the two
region names), hover sweeps in both views, the repo generators rebuilding the
published page byte for byte, the docs checks and the dependency map.

## YOUR PRIORITY

**Build the staged-to-move mark** (v4 item 7). Read
`docs/skyview_video4_findings.md` §7 first: the confirmation sentence exists
(frame 17) and S237 already stopped it pointing at a hidden pane. What is
missing is on the course itself — after `applyMove()`, the moved course's dot on
the map and its row in the panel should say *staged, not saved*, and the
receipt should be one click away. `movedTo[cn]` already relocates; nothing
marks. Verify in Chromium, not jsdom.

Then, in order: **DR-24's write surface** (the curate phrase and the
propose/second gate, through Governance first — Rule 10 a3); the skills layer's
fetch problem (NEEDS SAM ①); the backlog (`docs/skyview_backlog.md`). **The
globe: nothing unless Sam rules.** If he asks for a fourth round,
`prototype/globe/README.md` is the three-step build; publish to the same
artifact URL from the session that owns it, or a new one.

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
⑧ **The globe in SkyView?** The sky by kind, the window view, the day sky — is
any of it wanted in the product? A yes is a decision sheet (the form, curation
gestures on a sphere, motion), never a port.

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

*Greetings, you are SkyMark (Session 239), see SkyFacet III's handoff —
`docs/session_239_handoff.md` — let's keep rolling with our queue.*
