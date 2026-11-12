---
title: "Program requirements harvest — lane state"
created: 2026-10-03
updated: 2026-11-12
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
 - "[[CLAUDE]]"
 - "[[docs/reference/lanes/sierra-retrieval-corpus]]"
 - "[[docs/program_requirements_harvest_lessons]]"
---

# Program requirements harvest

**What this lane is:** for every active program at the 115 credit colleges, a
record of how its courses count toward the award (required, choose N courses or
units from a list, open elective), the program total, the catalog year and the
source, plus the recommended term sequence where a college publishes one. From
it: which courses a learner qualifies for through CPL, and the units saved.

## Status

🔨 **Phase 0 (the census) built (S320, #1836; reader corrections S321-S322),
and the registry filled by apply on `main`.** Sam's three
statements that opened the lane are verbatim in the vault:
`CPLBrain/03-professional/braindumps/braindump-2026-10-03-1433-program-requirements-from-local-catalogs.md`.
The plan is a Claude Doc Sam edits and comments on:
[Program Requirements Harvest Plan](https://claude.ai/code/artifact/77ae8cb2-443b-45e3-b287-594c9c9b8744).

**The registry** (`kb/supabase_program_source_registry.sql`, four migrations applied live 2026-10-03): one row per college, a history table, one write path (`program_source_census_apply`, service role only), anon SELECT. Columns and Sam's 2026-10-03 rulings: lessons, S419.

**The census** (`kb/_program_source_census.py`, `program-source-census.yml`): reads each college's homepage on a runner, scores and dates its catalog link, applies weekly on `main` (Sundays 10:29 UTC). Its rules, politeness limits and governance note: lessons archive, S334. Guard: `tests/program_source_census_test.py`.

**Sheets 23, 25 and 26 rulings:** lessons (S335 compaction).

**Measured (2026-10-03):** the Program Course File names every course a program lists (the closed list each record is checked against) but marks none required. Detail: lessons archive, S334.

**The pilot (Phase 1): all 20 records pass all four checks** (Cerritos, Mt. San Antonio, Riverside City, West LA, Miramar; Sam read them, 18 matched and both fixes went in). Capture `kb/_program_requirements_pilot.py`, extraction the `program-requirements-extract` Edge Function, scorer `kb/_program_requirements_score.py`; guard `tests/program_requirements_pilot_test.py`. Detail: lessons, S372.

**The sequence pass (S325) and a refused mapper host:** lessons, S394.

**A refusal is on the college's record (Sam, sheet 29 card 3, revised 2026-10-17):** `program_source_registry` carries `sequence_host`, `sequence_access`, `sequence_note`, `sequence_checked_run`, and `access_status` for the catalog. ⚠️ **Automated reads still name the CPL Initiative in the user agent and still respect blocks and robots.txt.** Since Sam's rulings of 2026-10-17 (`cpl_memory` `sam-sheet-29-revised-refusal-workarounds-2026-10-17`), a person may fetch a public file by hand for the pipeline (the hand-filed step, `kb/hand_filed_catalogs/`), and the CO may ask a college or vendor for access (the access-note drafts in `CPLBrain/04-projects/cpl-initiative/20261017_Catalog_Reader_Access_Notes_Draft_1.md`; Sam sends them). Detail and the 25 colleges filed: lessons, *Moved from the lane (S386 compaction)*.

**Sam's ruling (2026-10-04, 11:1xZ, in chat):** *"No need for governance at this
point. Everything is public record and we can mark the tab and contents as beta
draft."* The harvest's tab shows its records without a Governance pass, marked
**Beta draft** (vault braindump
`braindump-2026-10-04-1115-program-requirements-tab-public-record.md`). Then:
*"Integrate Sierra in the tab design."*

**The tab is in COBI** (Beta draft, #1860, Reference & Curation): `program_requirements.js` ports the approved mock-up ([v3](https://claude.ai/artifact/DkfRYLpyusuqYy6ErqQe6f), Sam: *"mock up looks good"*) and reads `program_source_registry` and `program_requirement_records` live. Five views: Progress, Catalogs, Sequences, Procedures (each college's procedure record) and the List; no Sierra (Sam, 2026-10-14, guard `(4b)`). Two early notes (the unscoped surface, Cerritos's Ironworker): lessons, *Moved from the lane (S542 compaction)*.

**The List (2026-11-01, `#program-requirements/list`):** one row per active COCI program (20,282), read only, and the workspace: a program's side panel carries its record's card and drafts the message to the college; program records retired into it (SkyLoquat, 2026-11-04). Guards `tests/program_requirements_list.test.js`, `tests/program_requirements_list_panel.test.js`, `tests/program_requirements_list_record_port.test.js` and `tests/program_requirements.test.js`. The paragraph as it stood: lessons, *Moved from the lane (S639 side session)*.

**Catalog addenda** (`program_source_addenda`; 79 listed at 52 colleges; the eight amending loaded colleges read, S387-S388; the other 71 as the reader reaches their colleges): lessons, S394.

**CPL Pathways reads the ROEP record (Sam, 2026-10-04 ~17:20Z):** *"we use the
new tab based on mockup to manage the ongoing process to harvest program ROE and
Pathway data and CPL Pathways to show it graphically to the colleges and public...
My goal is to not need to curate or manually adjust and instead to adjust
college-based procedures to arrive at accurate catalog ROEP dataset"* (vault
braindump, 2026-10-04 17:20). The
harvest tab runs the reading; CPL Pathways shows every record, checked or not, each
marked (Sierra's "required" stays on the checked gate). No record is edited by
hand: a misread is filed against the college's reading procedure; a place where the
catalog and the state's Program Course File disagree goes to the college (10 of 20
pilot records).
**The map names the pick inside a choice**; the catalog keeps the rule. Mock-up:
[CPL Pathways ROEP](https://claude.ai/artifact/8hkej9jHsmLRX6cZYxrXbM). ✅ **Ported (S334):** the pathway selector lists every catalog record (Beta draft) (its two views: lessons, *Moved from the lane (S542 compaction)*). Guard `tests/cpl_pathways_roep_view.test.js`; a11y targets `cpl-pathways-roep` and `-dark`.

**Sam's sheets 29 and 32 (2026-10-04)** (Sierra's "required"; "up to" and CPL in three kinds): lessons, S422 compaction.

**The display build** (`kb/_build_roep_display.py`) writes each program's facts once, under one build stamp, to `program_requirement_records.display` (Sierra) and `cpl_pathways_roep_data.js` (the page); guard `tests/roep_display_test.py`. Its history (S327-S336): the lessons doc, *Moved from the lane (S346 compaction)*.

**Outcomes (Sam, 2026-10-04):** course and program outcomes beside the harvested credential skills. `course_outcomes` holds 10,311 rows at thirteen colleges (Santa Ana 2026-11-03, S559; Las Positas 2026-11-04, S567; Columbia 2026-11-05, S578); the skills comparison waits for `kb/reference/industry_credential_skills.json` (lessons, S413). **The SLO read nightly in the CPL queue, to build** (Sam, 2026-11-01, in chat: *"yes to SLO hints and the nightly harvest"*): the colleges that articulate the most exhibits first; `course-outcomes-read.yml` and `-load.yml` are dispatch-only today.

**Course objectives too (Sam, 2026-11-02, S551):** his words: lessons, *Moved from the lane (S639 side session)*. **Built (S584):** the reader files objectives as `course_outcomes.kind` `objective`; detail: lessons, *Moved from the lane (S590)*. **NEXT:** (4) the ten loaded colleges read once more for objectives (runner minutes only, no model call), most exhibit articulations first, one host at a time, after Mission's read; a full read files no page text, so it cannot be a reparse.

**The nightly SLO read (Sam, 2026-11-01: *"yes to SLO hints and the nightly harvest"*):** step 11 of [`scheduled_sessions`](../scheduled_sessions.md), most exhibit articulations first (`scripts/next_slo_colleges.py`); a host that prints none gets a verdict in `kb/course_outcomes/queue.json`. Pages only, no model call, so no cost. Nine colleges loaded through Cuesta (S628); their runs, receipts and Cuesta's reader fix (S616): lessons, *Moved from the lane (S636)*. **Next:** the day's full read and preparation run, as `--next` names them.

**CSU LA:** later (Sam, sheet 33 card 3; lessons S336).

**The Cerritos Ironworker proof of concept** (the ladder on CPL Pathways), the reader `kb/_college_page_read.py` with its plans in `kb/college_reads/`, and **one procedure record per college** written through `program_source_procedure_set(college, record, by, expect_md5)` (service role, md5-guarded, history trigger): the lessons doc, *Moved from the lane (S346 compaction)*.

✅ **Sheets 38, 39 and 42's rulings:** lessons, *Moved from the lane (S336 compaction)*. ✅ **The Progress view (S343, #1900), drawn by `commons_progress.js`, its status file written at step 12:** lessons, *Moved from the lane (S598)*. **NEXT:** ① Re-read Schedule+ for Spring 2027 once its IWAP sections post. ② The film: re-render when a ladder line it shows changes. ③ The addenda reading agent after the 2026-10-11 apply; Miramar's map (`read: 1`); Butte's ROE definitions; every loaded college holds a procedure record (S395). Refresh the builder's two dated reads when the harvest adds a college. Later (Sam, ~20:02Z): every program with ROEP in a SkyView view ([skyview lane](skyview-ccr-interface.md)).

**Sheet 50 and the maps (S346-S347):** lessons (S353 compaction).

🔨 **Phase 2, a college at a time: 114 colleges hold records (15,946; S414), every new record unchecked until read.** `kb/_program_requirements_college.py` on `program-requirements-college.yml` (its readers: the catalog sweep, below); `assign()` gives a page to the programs whose award and title it names most fully. A push reads only on `[read]`/`[extract]`; a dispatch runs `step=read`, `load` or `display`. The load is insert-only and commits a receipt naming every inserted key, which is the rollback; a record placing none of its listed courses (another program's page) stays out of the load and the display build. **Loaded:** the newest wave is the catalog sweep's, below; the earlier waves' names and counts: lessons, *Moved from the lane (S399 compaction)* and S401. **Display:** each build applies through the display job, which files each row's prior build (the rollback); Sam's standing go (2026-10-10) covers a build that follows a load. **Extraction runs with no card up to $40 a college** (Sam, 2026-10-14, S393; `sam-extraction-standing-go-40-per-college-2026-10-14`); above $40 it is a card. The display job applies the build `cpl_pathways_roep_data.js` carries: run `kb/_build_roep_display.py` and commit its two outputs before dispatching (lessons S385). A program pointing at a retired version of a course the college still offers lists it, placed, no flag (Sam, 2026-10-11, Cerritos 02226). A college must be in the builder's dated reads (`kb/program_requirements_pilot/`, `registry_read.json` and `map_cr_by_course.json`) before its display is built; Earlier colleges' reads and rulings (S385-S398): lessons archive 3, *Moved from the lane (S495 compaction)*. 

🔨 **The reconcile pass (S392; Sam, 2026-10-14: "a secondary search of the catalog text to see if we can reconcile after the initial PR harvest", each catalog's own steps; `cpl_memory` `sam-reconcile-pass-after-harvest-2026-10-14`).** `kb/_program_requirements_reconcile.py` applies a college's steps (`kb/program_requirements_reconcile.json`) at extraction and on filed records (`step=reconcile`, no model call); each change names the words it came from. Orange Coast's and Monterey Peninsula's steps, Cabrillo's and Cerritos's, and Sheet 85's rulings on them (Sam, 2026-10-16, `sam-sheet-85-rulings-2026-10-16`; Victor Valley 37006 and 38352 stay as read, unchecked, shown and flagged): lessons, *Moved from the lane (S402 compaction)*.

**Parked or displayed earlier:** Hartnell 83 of 94, Delta 200 of 203, Glendale 115 of 226 (parked, `glendale-parked-2026-10-30`), Los Angeles Valley 202 of 215 (parked, `lavc-parked-2026-10-31`); a choose-courses list's printed units are its floor (Sheet 144 card 2): lessons, *Moved from the lane (S639 side session)*.

**Displayed or standing as filed:** Monterey Peninsula 184 of 197, Mt. San Jacinto 116 of 152, Ohlone 146 of 179, Siskiyous, Palomar, Coalinga, Columbia 78 of 82, Las Positas 181 of 193, College of Alameda 35 of 59, Butte 138 of 164: lessons, *Moved from the lane (S639 side session)*. **A refused read follows [`blocked_sources`](../blocked_sources.md) before any card.**
**Los Medanos (S599-S602, #2889): 44 of 83 passing; parked** until an electives sentence in its own words: lessons, *Moved from the lane (S633)*.
**Redwoods (S608-S609, S636; #2918, #3105): 59 of 73 passing on the branch** (was 53). COBIx found the college's 2026-27 CRGE sheet (#3096): *CRGE Units Required 21*, *Minimum Degree Units for Associate 60*. **DECIDED (S636, `d-redwoods-crge-21-s636`):** local degrees take 21; a title printing 60.0 is a floor; the page's double-count sentence sets the overlap. Reconcile 43018781168 (18 changed); the reread and display follow. 01831 and 08393 keep their totals.

**De Anza (S636-S638, #3109): 205 of 221 passing on its 2026-2027 eLumen catalog.** NEXT: the 24 rows with no display; the 15 rows on 2025-2026 removed by the S456 method (Sheet 118 card 1); the display build after this wave's rereads.

**S640 holds the lane (2026-11-12, the conductor).** **DECIDED (Sam, 7:13 PM PT 2026-11-11, relayed by COBIx on #3110;
`sam-harvest-next-steps-tonight-2026-11-11`):** "Yes, pick them up tonight." The queue takes the side handoff's Next 1
to 4. Merged on a green `test`: Victor Valley (#3131, 136 of 168 live), West Valley (#3137, 120 of 133 live) and
Berkeley City (#3138, 48 of 89 live; 37936 passes the machine checks, which the live count reads).

**The S639 side session (2026-11-12, beside the S639 conductor; handoff [`harvest_side_handoff_s639`](../../harvest_side_handoff_s639.md)).** Live at 03:05Z: 15,046 of 17,581 rows pass (01:20Z: 14,963 of 17,580). The shared cause at about a dozen colleges: a degree names a GE pattern with no units. Before any merge, no `daily-dashboard` run in flight (cron 06:17, 09:17, 12:17 UTC). Lessons, *S639 side session*.
**Los Angeles City (#3130, merged 02:49Z): 181 of 223 live** (156 before). **DECIDED (`d-lacc-heading-minimum-60-s639`):** a local degree's heading *Total Units: Minimum of 60* is a floor, and general education is the printed 18-27 (pages 59-60 quoted); `only_with` on both steps; `heading_above_code` (this college only) keeps a heading above the State Code line. Rereads 43141074738 (27 replaced) and 43142129065 (29), none held. NEXT: a paid re-extraction of the records read past their heading, on #3135's reader once it merges.
**Orange Coast (#3133, merged 03:04Z): 217 of 259 live** (187 before); done this pass. **DECIDED (`d-occ-up-to-ge-maximum-s639`):** a printed *Up to 21* (A.S.), *Up to 27* (A.A.) or Cal-GETC *up to 34* is that pattern's maximum, and an exact 21 stands as printed. Reconcile 43136182950 (29 more pass, none regressed), reread 43142833449 (51 replaced, none held).
**Victor Valley (#3131, merged 04:20Z by S640): 136 of 168 live** (108 before). **DECIDED (`d-hours-meets-top-term-length-s639`, the session's call for Sam to revise; Sheet 120 card 1 unchanged):** an hours program passes when its printed range's low end is eight ninths of the top and its single-figure course hours sum to exactly the top: 22 records, all Victor Valley. Reread on head 17d69398 (02:59Z), the 20 out-of-scope transfer degrees restored first; the eight review fixes pushed, not re-reviewed. NEXT: the reread's receipt; merge `main`; `test` green; merge. The four EMS certificates (38353, 38366, 38502, 38503) need a paid re-extraction. 37006 and 38352 stay as read (Sheet 85).
**American River:** read 43134279776 ($12.99) rewrote 154 records on the renumbered edition (16 better, 30 now fail); not loaded, branch kept. NEXT: re-extract on #3135's reader after its proofs and review.
**The PDF reader (#3135):** `text_sha` keeps a program whose page moved and whose text did not, with no model call; the list-page rule skips a department's award list. Proofs filed for American River and Los Angeles City, not yet read. NEXT: Sacramento City, Los Angeles Valley, College of the Desert one at a time; previews judged against the PR's pass marks; review; merge; then the paid reads.
**Rio Hondo (#3136) and West Valley (#3137):** each catalog prints Cal-GETC's units by area and no total. **DECIDED (`d-rio-hondo-cal-getc-areas-count-s639`, `d-west-valley-cal-getc-areas-count-s639`; the lane conductor's call for Sam to revise, extending his *count* on Sheet 180 cards 2 and 4):** transfer degrees take the sum of the college's own printed areas, 34. Steps written; simulated 276 of 288, West Valley about 116 of 133 (the review). **Berkeley City (#3138):** local degrees take *at least 18 units in general education* and the electives rule, 35 to 49 of 89 simulated; its 21 transfer degrees wait (its Cal-GETC tab prints no units). Reconciles dispatched 02:28Z to 02:34Z (West Valley's filed 02:50Z); review: no wrong record, five minor findings being fixed. NEXT, one at a time: the worker's push and result, a reread, merge `main`, merge.
**San Bernardino Valley, Grossmont, East Los Angeles:** diagnosed, not started ([`harvest_wave3_diagnoses_s639`](../../harvest_wave3_diagnoses_s639.md)). They need two scorer readings, one writer, each measured at every college first: a noncredit *Total Hours N-M*, and the electives flag where a step files the catalog's own sentence.
🔨 **The catalog sweep (S394-S414; Sam's aim of 2026-10-14: every catalog, then curated audit sweeps).** The standing rules: one branch per college, never two on one host; a free capture-only read (`extract=0`) where a host's shape is new, and a free page read (`kb/college_reads/`) before any reader change, verified on the catalog's own words before any dispatch; **dispatch every read with `college=`**; extraction under the $40 go. **A reconcile rescores a record only on the page it was extracted from, or a fresh capture printing the record's own heading** (`own_heading_kept`, S530), and a reconcile step for a figure a local degree never carries reads transfer degrees only (`awards: transfer`). **`step=display` applies the committed build; it never builds one** (run `kb/_build_roep_display.py` on the wave branch first). **Sam's go of 2026-10-17:** harvest calls proceed on their procedures without a card; a write the Supabase guard holds goes through `supabase-migrate.yml`. **Sheet 118 card 1:** each wave's older-build rows are removed with a before-values receipt (the S456 method), no card; Sam ruled **narrow** on the scorer's `meets` reading (Sheet 120 card 1); no note to Program Mapper's vendor for now (Sheet 112 card 1). The two S448 offers wait on Sam's word. **List the thin colleges live, and look for a shared cause, first** (S442). On screen the reference is **CPL Pathways**. **No record (4):** North Orange Continuing Education, San Jose City, Diablo Valley, Santiago Canyon. Readers, invariants, waves, parked colleges and renumbers: the paragraph as it stood, lessons, *Moved from the lane (S562)*, and the pointers it carries.

**The second reader, Grok** (Sheet 97 card 1; built S421, #2246) waits on the xAI billing moving to the RCCD district card and two Edge Function secrets only Sam sets: lessons, *Moved from the lane (S530 compaction)*.

✅ **A light index, full records by key or by college** (S384, Sam 2026-10-13, `cpl_memory` `sam-records-load-by-college-filter-2026-10-13`; the cap, the anon timeout and #2088-#2090, #2121: lessons, S385 and S542 compactions). **The index reads stored columns** (S405, guard `tests/program_requirements.test.js` 6e; lessons, S411). The Records view's college sections and its CIP batch read retired with it (SkyLoquat, 2026-11-04); the List's CIP Sector reads COCI's own CIP.

Sheet 77 card 3 (#2093, #2097): lessons (S387 compaction).

✅ **Flags and a person's reading are built (S347; Sam, Sheet 51 card 1).** Confirm or Needs a fix writes `program_record_verdicts` through `program_record_verdict_add`; a trigger keeps a person's reading across a reload. Detail: lessons doc, *Moved from the lane (S356 compaction)*.

