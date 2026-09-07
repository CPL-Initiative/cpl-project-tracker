---
title: "Session 239 handoff — the CPL views are built; the staged-to-move mark is next"
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

Sam's eight rulings of 2026-09-07 became a build. SkyView's control row has two
new words next to Show — **Courses | CPL** and **Articulations** — and the
course outline of record has its CPL layer. Everything is in
[PR #1508](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1508).

- **The payload** — `kb/_build_ccr_cpl.py` writes `prototype/ccr_cpl.json`
  (509 KB, fetched on demand). The join is the articulation crosswalk, the same
  join the map's `ar` badge counts, so the lit set and the CPL face agree by
  construction: 1,490 identities both ways. Agencies come from the curated CER
  artifact; the articulated-exhibit universe from `statewide_data.js`. The daily
  run rebuilds it every morning (Step 4d3) and CI fails on a stale file.
- **The light** — a gold glow and ring on what carries an articulation; nothing
  on the rest. Below the course zoom a discipline holding a lit course carries
  the ring. The Show menu's filter is untouched.
- **The face** — the credential leads the label, the hover, the panel, the
  discipline panel and the search; a point nothing reaches is unlabeled; the
  line under the row says the coverage; `#skyview/cpl` is a link.
- **The outline's CPL layer** — built, uncapped, both agencies, and an empty
  layer states the ceiling in words.

## After the checkpoint: the globe (Sam, "build it!")

While #1508 waited on CI Sam asked, unprompted, whether the 2-D sky should
become *"a 3-d 360 globe that rotates"* to gain real estate. His words are in
the vault
(`CPLBrain/03-professional/braindumps/braindump-2026-09-07-1605-skyview-as-a-rotating-globe.md`);
the assessment there stands — a globe shows a hemisphere at a time, so it adds
no area, and the map's real estate is its zoom range — and he answered *build
it!* So a throwaway exists, deliberately outside the product:
`docs/visuals/2026-09-07-skyview-globe-prototype.html` (three.js from cdnjs, the committed layout wrapped onto a sphere in
First Light tokens, the Articulations light, an Outside and an Inside view, and
a line counting the points that face the reader — 25,580 of 49,896 at the
opening view, which is the whole argument). Artifact: https://claude.ai/code/artifact/51f5249d-1884-406d-889e-259b262b86e5.
It is for looking at, not porting: nothing in `ccr_universe.js` changed, its
data is a build-time snapshot the daily run does not refresh, and none of the
lane's invariants were re-earned by it. If Sam wants it on sight, the design
questions (the planetarium form, curation gestures on a curved surface, motion
for readers who asked for none) go on a decision sheet before any code.

**Second round, the same afternoon.** Sam: *"I like the globe view! Love the
glow on the articulations"* — then five asks (use the empty sky for separation;
M-ID white like stars, with a chip to change it; a version with round islands
rather than ovals; a slower turn; keep the header, add what the new view needs)
and, from a screenshot, that the inside view looked "globby" and could not zoom
out to a sky. All built as controls on the same page: Spread | Committed, Round
| Wrapped, M-ID color chips, a third of the spin, and Inside as an all-sky disc
(30° to 360°). His verbatim reaction and the reading of it are in the vault
braindump. The globe is now *keep exploring*, not *keep or drop*; the product
question (whether any of it belongs in SkyView) is still his, on a sheet.

## ⭐ THE THING TO CARRY FORWARD

**The ruled coverage line carried two wrong numbers, and the surface computes
its own.** *"1,490 of 6,388 exhibits reach a course on this map"* was answered
*yes*. 1,490 is the count of **identities** with an articulation; the exhibits
number **1,924**. And 6,388 is the credit funnel's exhibit count — a universe
that shares only **570** ids with those 1,924, because the funnel is ACE-keyed
(6,291 of 6,388 ids are ACE exhibits) and the crosswalk is MAP-keyed. The line
reads **1,924 of 5,497 articulated exhibits**, built from the payload's counts,
and the test fixture's *4 of 777* makes a literal fail. Sam has not been told
in so many words yet — it is in the To-Do feed and the lane; say it plainly
when he opens the face. KB note:
[`methodology-a-coverage-line-takes-both-numbers-from-one-universe`](kb-notes/methodology-a-coverage-line-takes-both-numbers-from-one-universe.md).

⚠️ **The crosswalk's inlined `issuing_agency` is a 2026-05-21 snapshot.** It
disagrees with the curated CER on 1,743 of 4,592 records, mostly a null where
the CER has since been curated. Read agencies from
`credential_reference_data.js`; never from the crosswalk.

⚠️ **55 crosswalk exhibits are not in today's articulated feed.** They stay on
the map, flagged *not in today's feed* in words (ruling 5, 2026-09-05: never a
silent drop). The builder prints them; a re-seed of the crosswalk from a fresh
`CustomReport_latest.json` is the fix, and it is Fable's, not Sam's.

## Verified

Chromium on the served page: the light at the opening zoom and at 88%; the face
switch with its line; *Welding (170) · 46 credentials*; a vocabulary search
("american welding society" → 18 courses); the panel and the hover on
`WELD M1109` (7 credentials); the outline's layer; the dark canvas; the hash
restoring the face. `npm run a11y skyview` — all 9 routes at 3 widths (the CPL
face is a route). Suites: `ccr_skyview_cpl_face` 62/62 (new) ·
`ccr_cpl_payload_test.py` 13/13 (new, in CI) · the seven existing SkyView
suites unchanged. Six mutations each fail the new suite.

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
fetch problem (NEEDS SAM ①); the backlog (`docs/skyview_backlog.md`).

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
⑧ **The globe, second round — his eye.** Do the five asks read as answered, and
does the all-sky Inside look like stars in their groupings? If the globe earns a
place in the product, that is a decision sheet, never a port of that file.

## Housekeeping

- The description shards are gitignored: `python3 kb/_build_ccr_universe.py
  --shards-only` (~2 min) before browser work on the outline.
- `kb/ccr_cpl_funnel.json` is a dated hand read of `map_college_cr_unit`
  through the Supabase MCP; refresh it after the next custom-report load.
- `npm install` first; run the suites you touched and let CI run the rest.
  Chromium: `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, playwright at
  `/opt/node22/lib/node_modules/playwright/index.js`, `python3 -m http.server
  8777` from the repo root. **Use it.**
- `python3 kb/_build_dependency_map.py` before pushing anything that adds a file.

## `cpl_memory` rows written this run

`a-coverage-line-takes-both-numbers-from-one-universe` (verified, source the KB
note) · `the-credit-funnel-and-the-articulation-feed-are-nearly-disjoint-exhibit-universes`
· `the-crosswalks-inlined-issuer-is-a-stale-snapshot-read-agencies-from-the-cer`
· `fifty-five-crosswalk-exhibits-are-absent-from-todays-articulated-feed` ·
`skyview-cpl-face-and-articulations-light-shipped-2026-09-07`.

## Read these first, in order

1. [`docs/reference/lanes/skyview-ccr-interface.md`](reference/lanes/skyview-ccr-interface.md)
2. [`docs/skyview_video4_findings.md`](skyview_video4_findings.md) §7 — the ask
3. `tests/ccr_skyview_drop_target.test.js` — the drop model, as assertions

Then run **`python3 kb/doctrine.py --read <files>`** before concluding anything
from the data, and **query `cpl_memory` before you work** (Rule 8).

---

*Greetings, you are SkyMark (Session 239), see SkyFacet III's handoff —
`docs/session_239_handoff.md` — let's keep rolling with our queue.*
