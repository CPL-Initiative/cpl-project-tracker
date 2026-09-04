---
title: "SkyView / the CCR curation interface — lane state"
created: 2026-08-28
updated: 2026-09-04
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

**What this lane is:** An interactive view of the Common Course Reference — common courses by discipline, their constituent local courses, and moving a course to where it belongs. **"SkyView" is the graph view** (Sam, 2026-08-24); the discipline cells, the ESL card and the decision list are panes *on* the SkyView page. Since 2026-09-03 the lane also carries the **re-mint series** Sam ruled on the authority-codes sheet — the CSR's codes are what SkyView's islands are keyed by.

## Status

✅ **SKYVIEW IS THE LANDING VIEW OF THE CCR TAB AND MEETS SAM'S FIVE GOALS (SkyOrbit S223, 2026-09-03).**
① The whole universe on one canvas that fills the first screen — 16,482 identities and 33,423 stand-alone
courses in 159 discipline islands, full width and viewport-high. ② Keyword jump to any discipline, course
identity, stand-alone or college course, all four kinds suggested by name; a college course is found by
its code or control number and lands on the identity carrying it. ③ Hover is a quick look, click is the
inspector — docked beside the map, listing every college course, its number the button that opens the
catalog description; labels ride leader lines and an identity OPENS past 2.7× to ring its college courses.
④ Every stand-alone is a hollow point in ORBIT around its best-matching identity — 31,515 of 33,423
(94.3%) found a parent; 1,908 share nothing and sit on their island's rim. ⭐ **ORBITS CROSS DISCIPLINES**
(1,375 satellites): a course filed under a grab bag is scored against the whole reference with a
`HOME_BONUS` of 0.4, and any other course crosses only when nothing at home fits AND the title match is
strong (`CROSS_MIN_DICE` 0.5, `CROSS_MIN_SHARED` 2); such a point carries `h`, the discipline it is filed
under, and the inspector says so. ⑤ Drag and drop is real, keyboard path included, Escape puts a carry back.

⭐ **AN ORBIT IS A PLACEMENT SUGGESTION, NEVER A CURATION DECISION.** Hollow, tethered, and the inspector names the shared signals; **Move `<code>` into `<parent>`** (on the course) and **Move here** (on the parent's card, one row per orbiting course) accept ONE course at a time as the same `CN:<control number> merge_into <identity>` row a drag writes. Nothing is written from the page.

⭐ **THE TITLE CARRIES THE WEIGHT** (`kb/_build_ccr_universe.py`): title 8 × Dice over lightly stemmed tokens; a shared local subject code 1.5; TOP 0.5, units 0.15, credit type 0.05 count only after a subject or title signal fired (Rule 7's two-signals gate); a bare SUBJ4 match 0.3 and never enough alone. `tests/ccr_universe_orbits_test.py` pins both directions — a clear title wins, a marginal gap yields.

⭐ **DESCRIPTIONS LIVE IN THE PUBLIC SUPABASE BUCKET `ccr-desc`**: one JSON shard per discipline keyed by control number (159 shards · 50 MB), built by `kb/_build_ccr_universe.py --shards-only`, published by `scripts/publish_skyview_desc_shards.sh`. The client tries `./ccr_desc/` first, then the bucket.

✅ **THE C-ID CHIP IS LIVE (SkyTune S224, #1447).** Where a discipline's Common SUBJ differs from the code the authority uses, the CSR tab, the CCR tab's Subject list and SkyView's discipline card show the verbatim code as a word chip — `C-ID AJ` beside `CRIM`, `CCN STAT` beside `MATH`; a CSR-minted code no authority names reads **proposed**. `kb/_seed_authority_codes.py` writes the fields and the precedence (ruled > canonical > majority above four rows > name-home; a ruled or canonical home never spills onto the discipline its mis-filed rows sit under); receipt `kb/reference/authority_subject_codes.json`. 12 disciplines on a CCN code, 14 on a C-ID code, 120 CSR-proposed, 29 with a chip. SkyView reads the seed live, so the chip never lags it.

✅ **THE RE-MINT SERIES IS APPLIED (SkyTune S224, 2026-09-03; Sam ruled the fourteen readings yes to all).** The recode (#1454): 10,296 ids re-keyed, 10,041 keeping their number; the seed carries the seven ruled codes, the umbrella flags and the FTVE fan-in pair (`fan_in_with`, not an alias fold), twelve language codes. The retirement (`kb/zband_retire_out/2026-09-03/`): the 4,053 Z identities are real M-ID records with `origin: machine cluster` (the members' aggregate, no membership entry of their own), 218 legacy anchors folded, the Z counters retired; a full credit bucket continues into the next band digit. Both receipts sit in `ALIAS_MAPS`; `kb_curation` was re-keyed by `supabase-rekey.yml`. ⭐ **A code change is a prefix re-key that keeps the number** ([KB note](../../kb-notes/methodology-a-code-change-is-a-prefix-rekey-not-a-resequence.md)); the land's post-state counts are worklists, not defects ([KB note](../../kb-notes/methodology-land-a-re-mint-by-rehearsal-and-a-fresh-read.md)) — and the fold worklist it surfaced is applied (below).

✅ **THE PREFIX FOLD IS APPLIED (SkyFold S225, 2026-09-04; Sam: "Yes to all recommendations").** 278 rows moved onto their discipline's code, `kb_curation` re-keyed, artifacts and SkyView rebuilt (#1463, #1464); `subject_collision_signal` 153 → 113, and the seven rows held on TOP alone are the fold-verify `re_key`. Frozen receipt + every number: `kb/prefix_fold_out/2026-09-03/`.

✅ **THE CURATED-ANCHOR DUPLICATES ARE A WORKLIST LANE (S226, #1465).** The 130 May anchors that duplicate a catalog identity lead the Suggested-merges queue, recomputed live (`legacy_anchor_duplicate_groups`): the catalog twin first, the anchor last, so the survivor rule folds the anchor into the course carrying the college courses (31 stand-alone-only pairs go the other way); strict title key, displayed discipline, aliases as the dry run resolved them; never merged by a script. 129 of 130 receipt pairs surface; `THTR M1377` hides behind a bot's `Stagecraft` re-discipline on its twin — a signal. ⭐ The 31 folded ids SkyView does not draw were never missing: 20 Phase B folds into C-ID descriptor rows (`consolidated_from`), 11 curated merge sources.

**Durable facts that carry over:** grinding the whole merge queue perfectly lands at 35,937 — 14.4× short of 2,500 — so **packaging** is the only mechanism with the right shape (ESL proved it at 85:1; target ≈17 per discipline); ~5,700 decisions, 97.1% ≤ 12 identities; 3,001 carry NO discipline — a different job; decision packs exist for 5 of 159 disciplines; `CN:` names more than one course on 1,761 keys (3,634 draggable rows) and those moves are refused with the reason; the page must be SERVED, not opened; the layout is rebuilt by hand (`kb/_build_ccr_universe.py`, ~20 s) and committed — the daily run does not rebuild it.

**NEEDS SAM:** ① **Drive it again.** His eight notes of 2026-09-03 all shipped (#1460; verbatim in that evening's vault braindump), and the next four are one line each: the halo, the ring spread, the 48-square cap, the open-all zoom. ② **Should the daily run rebuild the universe layout too?** ③ **Which disciplines are grab bags besides Vocational and the no-discipline pile?** Interdisciplinary Studies (513 identities) is the obvious candidate. ④ **The live-session banner** he asked for (2026-09-03) — what link should observers follow, and on which tabs? ⑤ **The three legacy anchors without a seed discipline** — `M-ID HOSP 100` and `M-ID HOSP 104` (Travel Services), `M-ID HOSP 102` (Hotel and Motel Services) — need one of the 146 MQ disciplines on the CSR tab; the next retirement pass folds them. And **drive the CCR tab after the land**: the materialized machine clusters render as M-ID Courses, the CSR reads `THTR`, `CDEV`, `ITIS`, `BSOT`, `FTVE`, `COMP` and the language codes. ⚠️ The Pages deploy prunes `docs/`, so a sheet is handed over as an artifact link, never a github.io URL.

✅ **THE CCR TABLE VIEW IS A LINK OUT, AND THE WORD IS "DISCIPLINE" (SkyMint S227).** COBI's Common
Course Reference tab is the page this map is framed IN, so `#u-ccr-list` opens it in a new tab and
**removes itself when framed**. "Subjects as a list" was a grain error (`__ccrSubjectList` reads `I.d`,
the discipline), so every rendered "subject" is now "discipline" — `kind` stays the internal key,
`kindWord` is what a reader sees. Story: `ccr_atlas_lessons`.

✅ **THE TOP ROW IS TITLE · VIEWS · SEARCH · CONTROLS · CLOSE (SkyMint S227, 2026-09-04).** Sam's items
1-5, 10, 11. ⭐ **Item 11 was structural, not a bug in the box**: the page's ONE search lived in the
masthead, which browser full screen does not paint (only `#u-full` is), so in full SkyView there was
nothing to click. The form is now MOVED into `#u-top` — borrowed, not copied, so the page still carries
exactly one search field — and `homeSearch()` returns it before any other view replaces `#view`
(`innerHTML =` detaches rather than destroys, so an unreferenced node is simply gone). The four view
links folded into one `<details>` menu; a closed `<details>` still LAYS OUT its contents in Chromium, so
`display:none` is what takes them out of the layout and the tab order. Search results now fly to exact
figures — **1000% for a course, 150% for a discipline** — instead of a zoom fitted to the island, so the
readout means something. Verified in Chromium (`prototype/check_ccr_atlas.js` +13) and jsdom (126 → 131).

**NEXT:** ⓪ **Sam's items 6-9, the consolidation** — one tab with a subject ⇄ discipline toggle and an
explanation of the difference (his "subject" is the SUBJ4 grain, not the island), ESL packaging folded
in, the map on the same tab, and the Views menu reachable from every one of them. ① **decision packs per discipline, fetched on demand** — the bottleneck behind every UI tweak; the shards' publish path is the template. ② **The QUEUE**: a drag that leaves the destination's SUBJ4 inconsistent with its corroborated discipline queues a re-mint candidate — proposes, never auto-adds. ③ The 73 two-real-course control numbers (93 rows at San Jose City College). ④ The member-roster fold at source (`CaÃ±ada College` ×678). ⑤ Accept-all-orbits-above-a-score as a batch verb, once Sam has seen single accepts behave. ⑥ The 67 `ESOL Z####` rows, `FIMS M1018` (needs an un-merge verb), a tool for the 3,001. ⑦ **A description signal for the rim** (Sam, 2026-09-03): 1,600 of the 2,073 rim courses have a catalog description; a TF-IDF match places about 130 well and agrees with the title-based parent only 20% of the time — a gap-filler that never outvotes a title, boilerplate stripped, the shared terms shown as the reason. ⑧ **Dropdown labels that name the grain**: Subject as `CODE — title — discipline`, Discipline as `Discipline — Common SUBJ(s)`, (SkyView's own "subject" wording is DONE — S227 swept every rendered use to "discipline"; the SUBJ4 sense stays.) ⑨ **After the fold:** the promote step is BUILT (`kb/_uc_cur_promote.py`, S226 — run it the day a `UC-CUR-*` target appears, then ALIAS_MAPS, the Supabase re-key, the chain); the seven held rows move when a second signal arrives (`--ruled-held`); the identities map's 1,597 ghost keys have a dry run and a cut receipt (`kb/identities_rekey_out/2026-09-04/`: re-key 1,369, drop 228) awaiting Sam's sheet, then `--apply --ruling`; and measure how many curated `discipline` values sit outside the MQ list. ⑩ **Identity-level chips** once members are classified: CMUS on commercial-music identities, ACCT and BSOT under Business, LPPS under Administration of Justice. Story: [docs/ccr_atlas_lessons.md](docs/ccr_atlas_lessons.md).
