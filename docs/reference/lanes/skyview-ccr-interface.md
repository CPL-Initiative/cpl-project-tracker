---
title: "SkyView / the CCR curation interface — lane state"
created: 2026-08-28
updated: 2026-09-05
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# SkyView / the CCR curation interface

> **Always-current lane state, not an archive.** Update it at every checkpoint
> that moves this lane; `CLAUDE.md` keeps the one-line pointer. History lives in
> [docs/ccr_atlas_lessons.md](docs/ccr_atlas_lessons.md).

**What this lane is:** An interactive view of the Common Course Reference — common courses by discipline, their constituent local courses, and moving a course to where it belongs. **"SkyView" is the map ALONE, filling the window** (Sam, 2026-08-24, tightened 2026-09-05: *"the full screen SkyView … I would like to henceforth refer to as SkyView"*); the map with its panes is **the comprehensive view**, and the discipline table, the subject table and the ESL card are the **workspace** (*Disciplines and subjects*), a tab of their own. Since 2026-09-03 the lane also carries the **re-mint series** Sam ruled on the authority-codes sheet — the CSR's codes are what SkyView's islands are keyed by.

## Status

✅ **SAM'S FIVE GOALS ARE MET (SkyOrbit S223, 2026-09-03).** ① The whole universe on one canvas: 16,482
identities and 33,423 stand-alone courses in 159 discipline islands. ② Keyword jump to any discipline,
identity, stand-alone or college course (by code or control number). ③ Hover is a quick look, click is the
docked inspector; an identity OPENS past 2.7× to ring its college courses. ④ Every stand-alone orbits its
best-matching identity (31,515 of 33,423; 1,908 on the rim); ⭐ **orbits cross disciplines** (1,375; the
inspector says which discipline the course is filed under). ⑤ Drag and drop is real, keyboard path included.

⭐ **AN ORBIT IS A PLACEMENT SUGGESTION, NEVER A CURATION DECISION.** Hollow, tethered, and the inspector names the shared signals; **Move `<code>` into `<parent>`** (on the course) and **Move here** (on the parent's card, one row per orbiting course) accept ONE course at a time as the same `CN:<control number> merge_into <identity>` row a drag writes. Nothing is written from the page.

⭐ **THE TITLE CARRIES THE WEIGHT** (`kb/_build_ccr_universe.py`): title 8 × Dice over lightly stemmed tokens; a shared local subject code 1.5; TOP 0.5, units 0.15, credit type 0.05 count only after a subject or title signal fired (Rule 7's two-signals gate); a bare SUBJ4 match 0.3 and never enough alone. `tests/ccr_universe_orbits_test.py` pins both directions — a clear title wins, a marginal gap yields.

⭐ **DESCRIPTIONS LIVE IN THE PUBLIC SUPABASE BUCKET `ccr-desc`**: one JSON shard per discipline keyed by control number (159 shards · 50 MB), built by `kb/_build_ccr_universe.py --shards-only`, published by `scripts/publish_skyview_desc_shards.sh`. The client tries `./ccr_desc/` first, then the bucket.

✅ **THE C-ID CHIP IS LIVE (SkyTune S224, #1447).** Where a discipline's Common SUBJ differs from the code the authority uses, the CSR tab, the CCR tab's Subject list and SkyView's discipline card show the verbatim code as a word chip — `C-ID AJ` beside `CRIM`, `CCN STAT` beside `MATH`; a CSR-minted code no authority names reads **proposed**. `kb/_seed_authority_codes.py` writes the fields and the precedence (ruled > canonical > majority above four rows > name-home; a ruled or canonical home never spills onto the discipline its mis-filed rows sit under); receipt `kb/reference/authority_subject_codes.json`. 12 disciplines on a CCN code, 14 on a C-ID code, 120 CSR-proposed, 29 with a chip. SkyView reads the seed live, so the chip never lags it.

✅ **THE RE-MINT SERIES IS APPLIED (SkyTune S224, 2026-09-03; Sam ruled the fourteen readings yes to all).** The recode (#1454): 10,296 ids re-keyed, 10,041 keeping their number; the seed carries the ruled codes, the umbrella flags and the FTVE fan-in pair. The retirement: the 4,053 Z identities are real M-ID records with `origin: machine cluster`, 218 legacy anchors folded, the Z counters retired. Both receipts sit in `ALIAS_MAPS`; `kb_curation` was re-keyed. ⭐ A code change is a prefix re-key that keeps the number ([KB note](../../kb-notes/methodology-a-code-change-is-a-prefix-rekey-not-a-resequence.md)); a land's post-state counts are worklists, not defects ([KB note](../../kb-notes/methodology-land-a-re-mint-by-rehearsal-and-a-fresh-read.md)).

✅ **THE PREFIX FOLD IS APPLIED (SkyFold S225, 2026-09-04; Sam: "Yes to all recommendations").** 278 rows moved onto their discipline's code, `kb_curation` re-keyed, artifacts and SkyView rebuilt (#1463, #1464); `subject_collision_signal` 153 → 113, and the seven rows held on TOP alone are the fold-verify `re_key`. Frozen receipt + every number: `kb/prefix_fold_out/2026-09-03/`.

✅ **THE CURATED-ANCHOR DUPLICATES ARE A WORKLIST LANE (S226, #1465).** The 130 May anchors that duplicate a catalog identity lead the Suggested-merges queue, recomputed live (`legacy_anchor_duplicate_groups`): the catalog twin first, the anchor last, so the survivor rule folds the anchor into the course carrying the college courses (31 stand-alone-only pairs go the other way); strict title key, displayed discipline, aliases as the dry run resolved them; never merged by a script. 129 of 130 receipt pairs surface; `THTR M1377` hides behind a bot's `Stagecraft` re-discipline on its twin — a signal. ⭐ The 31 folded ids SkyView does not draw were never missing: 20 Phase B folds into C-ID descriptor rows (`consolidated_from`), 11 curated merge sources.

**Durable facts that carry over:** grinding the whole merge queue perfectly lands at 35,937, 14.4× short of 2,500, so **packaging** is the only mechanism with the right shape (ESL proved it at 85:1); ~5,700 decisions, 97.1% ≤ 12 identities; 3,001 carry NO discipline; decision packs exist for 5 of 159 disciplines; `CN:` names more than one course on 1,761 keys and those moves are refused with the reason; the page must be SERVED, not opened; the layout is rebuilt by hand (`kb/_build_ccr_universe.py`, ~20 s) and committed, and the harness needs the gitignored shards (`--shards-only`).

**NEEDS SAM:** ① **Drive it again.** His eight notes of 2026-09-03 all shipped (#1460; verbatim in that evening's vault braindump), and the next four are one line each: the halo, the ring spread, the 48-square cap, the open-all zoom. ② **Should the daily run rebuild the universe layout too?** ③ **Which disciplines are grab bags besides Vocational and the no-discipline pile?** Interdisciplinary Studies (513 identities) is the obvious candidate. ④ **The live-session banner** he asked for (2026-09-03) — what link should observers follow, and on which tabs? ⑤ **The three legacy anchors without a seed discipline** — `M-ID HOSP 100` and `M-ID HOSP 104` (Travel Services), `M-ID HOSP 102` (Hotel and Motel Services) — need one of the 146 MQ disciplines on the CSR tab; the next retirement pass folds them. And **drive the CCR tab after the land**: the materialized machine clusters render as M-ID Courses, the CSR reads `THTR`, `CDEV`, `ITIS`, `BSOT`, `FTVE`, `COMP` and the language codes. ⚠️ The Pages deploy prunes `docs/`, so a sheet is handed over as an artifact link, never a github.io URL.

✅ **THE TOP ROW IS TITLE · VIEWS · SEARCH · CONTROLS · CLOSE (SkyMint S227, 2026-09-04).** Sam's items
1-5, 10, 11. Every rendered "subject" that meant an island now reads "discipline" (`kind` stays the internal
key). ⭐ **Item 11 was structural**: the page's ONE search lived in the masthead, which browser full screen
does not paint, so the form is BORROWED into `#u-top` and sent home before another view renders; results
fly to exact figures (1000% a course, 150% a discipline).

✅ **SKYVIEW IS THE MAP ALONE, AND THE CCR MENU OPENS IT THAT WAY (SkyQuiet S228, 2026-09-05, #1479).**
Sam: *"Make sure the CCR menu button opens the full screen SkyView … I've made several requests for this
so far and none of them have worked."* Three sessions had each shipped a mechanism (the iframe as the
landing view, `allow="fullscreen"`, a side-menu link); none changed what the tab SHOWED. Now `body.u-solo`
paints `#u-full` and nothing else; the **comprehensive view** (map + panes) is
the SAME render with the class off, one Views-menu click away, never the default. COBI's CCR tab hides its
chrome in map mode and sizes the frame to the viewport; SkyView's close and "CCR table view"
post a message that swaps in the list; `#unified-courses/list` opens the list directly. ⭐ **Items 6-9 are
ONE tab, *Disciplines and subjects*:** By discipline (islands, the map's counts, the atlas's decision
count, Common SUBJ chips, *On the map*, *Decisions* where a decision view exists) · **By subject, the
SUBJ4 grain** (344 codes read off the identity ids; standing from the seed: the Common SUBJ, an umbrella
code, or "not X's code"; TOP plays no part; *On the map* rings ≤150 identities at 150%) · ESL packaging
rendered INTO the tab. ONE Views menu serves every view and names the one you are on; the hash names
each view (`#skyview` · `#comprehensive` · `#disciplines` · `#subjects` · `#esl`). ⭐ **The harness
found a latent bug one click in**: a forest cell under the comprehensive map replaced the view without
sending the borrowed search box home; `setCrumbs`, the one call every view makes, is now the choke point.
Verified in jsdom (131 → 157, 26 → 37), the Chromium harness and `npm run a11y`.

✅ **SAM'S SECOND LIST SHIPPED (SkyKeep S230, 2026-09-05, #1481).** The top row is ONE chip vocabulary
(30px, one size, 6px corners, the search box and its button included); the zoom label stacks over its
percentage beside Out · In · Reset; "Details" reads **Sidebar**; the "Search" label is the box's
placeholder; the Full screen and Hide legend chips are gone. ⭐ **The window is three states and two
steps** — the page (or COBI) around the map · the map alone · the browser's own full screen — with the
OS trio at the row's right end (step down · step up · close) and a **menu control (☰) at the far left,
framed only, that opens COBI's side bar** (Sam: *"should be default collapsed on open"*). ⭐ **The CCR
click opens the full window**: `body.cpl-skyview-solo` hides COBI's header, rail, hamburger and To-Do
button and gives the frame the viewport; the rail is the ≤900px slide-over at every width, opened by
the frame's ☰ through `postMessage`; *dock* brings the chrome back without leaving the map; leaving the
tab takes the class off. **Show** is a menu of twelve switches (CR · NC · NCE · not recorded; M-ID ·
C-ID · CCN · unified; identities · orphans in orbit · orphans on the rim; college courses): a point is
drawn when every switch that describes it is on, and "not recorded" stays a switch of its own. **The
legend folds from its own corner** (the word, unbold, with a fold mark). **Go To** replaces Views and
carries **How SkyView works** (`#how`), an explainer for faculty reviewers with three drawn figures.
⭐ **The search is a selection**: a pick from the list ADDS a chip beside the box (DISC · CRSE IDENTITY
· STAND-ALONE CRSE · COLLEGE CRSE; credit as CR / NC / NCE), the map rings every course and outlines
every discipline chosen and fits them all; a typed search REPLACES the selection (a search still means a
search); Backspace in an empty box drops the last chip; the dropdown is wider, wraps whole titles and
uses one font size. ⭐ **A dark canvas** (the *Dark* chip, remembered per browser): the map's palette is
`--sky-*` tokens read at draw time (`readPal`), `body.u-dark` redefines them, every text pair measured
≥4.5:1 — the one workspace that earns a dark ground; First Light stays light everywhere else. Verified
in jsdom (157 → 188), COBI's suite (37 → 51), the Chromium harness and `npm run a11y` (six routes, three
widths). Story: `ccr_atlas_lessons`.

**NEXT:** ⓪ **Sam drives the second list** — the row, the window controls and the ☰ from the CCR menu,
the Show menu, the chips, the dark canvas, the explainer's voice. **Open from his Obsidian screenshot
(2026-09-05):** a right-edge vertical rail of glyphs (zoom in · reset · fit · zoom out · undo · redo ·
help) in place of the row's zoom words — glyph-only, so his call under his own glyph rule. The CCR
tab's only sweep finding is still First Light's 15px greeting opt-out checkbox (`first_light.js`), a
chrome-wide fix in the a11y backlog. ① **decision packs per discipline, fetched on demand** — the bottleneck behind every UI tweak; the shards' publish path is the template. ② **The QUEUE**: a drag that leaves the destination's SUBJ4 inconsistent with its corroborated discipline queues a re-mint candidate — proposes, never auto-adds. ③ The 73 two-real-course control numbers (93 rows at San Jose City College). ④ The member-roster fold at source (`CaÃ±ada College` ×678). ⑤ Accept-all-orbits-above-a-score as a batch verb, once Sam has seen single accepts behave. ⑥ The 67 `ESOL Z####` rows, `FIMS M1018` (needs an un-merge verb), a tool for the 3,001. ⑦ **A description signal for the rim** (Sam, 2026-09-03): 1,600 of the 2,073 rim courses have a catalog description; a TF-IDF match places about 130 well and agrees with the title-based parent only 20% of the time — a gap-filler that never outvotes a title, boilerplate stripped, the shared terms shown as the reason. ⑧ **Dropdown labels that name the grain** on the CCR tab: Subject as `CODE — title — discipline`, Discipline as `Discipline — Common SUBJ(s)` (SkyView's own wording is DONE — S227 swept every rendered use to "discipline", S228 caught the two hints that still said "Subject", and the SUBJ4 sense now has its own By subject view.) ⑨ **After the fold:** the promote step is BUILT (`kb/_uc_cur_promote.py`, S226 — run it the day a `UC-CUR-*` target appears, then ALIAS_MAPS, the Supabase re-key, the chain); the seven held rows move when a second signal arrives (`--ruled-held`); the identities map's 1,597 ghost keys have a dry run and a cut receipt (`kb/identities_rekey_out/2026-09-04/`: re-key 1,369, drop 228) awaiting Sam's sheet, then `--apply --ruling`; and measure how many curated `discipline` values sit outside the MQ list. ⑩ **Identity-level chips** once members are classified: CMUS on commercial-music identities, ACCT and BSOT under Business, LPPS under Administration of Justice. Story: [docs/ccr_atlas_lessons.md](docs/ccr_atlas_lessons.md).
