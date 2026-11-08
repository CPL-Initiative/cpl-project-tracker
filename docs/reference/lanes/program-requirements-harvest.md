---
title: "Program requirements harvest — lane state"
created: 2026-10-03
updated: 2026-11-01
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

**The List (2026-11-01, `#program-requirements/list`):** the Catalog Commons' shared List (`commons_list.js`), one row per active COCI program (20,282), read only; its columns, the control-number join and the timing at 20,282 rows: lessons, *Moved from the lane (S542 compaction)*. Guard `tests/program_requirements_list.test.js`. **The List is the workspace (2026-11-04, the List norms):** the engine's line of the requirements row in `kb/status/commons.json` (its issues set Fail a machine check and Not read yet), the Progress view's opened page folded behind *Hide the summary* (prefix `prl-pg-`), and a program's side panel: its record's checks in words, its courses block by block with title, units and the CPL on record at the college, and COCI's words folded; a light record is read once from the panel. Guard `tests/program_requirements_list_panel.test.js`. **Program records retired into the List (SkyLoquat, 2026-11-04, PR 3 of 3, after #2769 and #2771):** the panel carries the record's card (the checks in full, the flags, the chips, the CPL dialog, Your reading) and drafts the message to the college (*Draft the message to …*, reading the college's records once; Catalogs' drafts count opens the List on the college); side by side draws the full card. An older `view: "records"` address still opens the List. Guards `tests/program_requirements_list_record_port.test.js` and `tests/program_requirements.test.js`, whose card checks read side by side.

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

**Course objectives too (Sam, 2026-11-02, S551):** *"Since we are grabbing leaning outcomes, we should grab course objectives and store them as well. They are often richer descriptions of course content than any other element of the COR and we will need this when we star solving for the edge cases of the common course reference."* **Built (S584):** the reader files objectives as `course_outcomes.kind` `objective`; detail: lessons, *Moved from the lane (S590)*. **NEXT:** (4) the ten loaded colleges read once more for objectives (runner minutes only, no model call), most exhibit articulations first, one host at a time, after Mission's read; a full read files no page text, so it cannot be a reparse.

**The nightly SLO read (Sam, 2026-11-01: *"yes to SLO hints and the nightly harvest"*):** step 11 of [`scheduled_sessions`](../scheduled_sessions.md), most exhibit articulations first (`scripts/next_slo_colleges.py`); a host that prints none gets a verdict in `kb/course_outcomes/queue.json`. Pages only, no model call, so no cost. Loads so far (Golden West, Santa Ana, Las Positas, Columbia, with runs and receipts): lessons, *Moved from the lane (S584)*. Since then Mission (S591), Lake Tahoe (S596, 435 rows) and **Contra Costa (S604, load 42454133971: 492 inserted, 39 skipped; receipt `kb/receipts/course_outcomes_ccc_42454133971.json` with its delete; #2873)** are loaded. **Cuesta's index landed** (run 42434939730, #2910), so `next_slo_colleges.py` moves it to a trial (`index=kb/course_outline_index/index_42434939730.json`, `slugs=cuesta`, `trial=12`). **Next:** on 2026-11-09 UTC, Cuesta's trial on #2910 (that day's one preparation run), and the day's one full read from `--next --skip cuesta`.

**CSU LA:** later (Sam, sheet 33 card 3; lessons S336).

**The Cerritos Ironworker proof of concept** (the ladder on CPL Pathways), the reader `kb/_college_page_read.py` with its plans in `kb/college_reads/`, and **one procedure record per college** written through `program_source_procedure_set(college, record, by, expect_md5)` (service role, md5-guarded, history trigger): the lessons doc, *Moved from the lane (S346 compaction)*.

✅ **Sheets 38, 39 and 42's rulings:** lessons, *Moved from the lane (S336 compaction)*. ✅ **The Progress view (S343, #1900), drawn by `commons_progress.js`, its status file written at step 12:** lessons, *Moved from the lane (S598)*. **NEXT:** ① Re-read Schedule+ for Spring 2027 once its IWAP sections post. ② The film: re-render when a ladder line it shows changes. ③ The addenda reading agent after the 2026-10-11 apply; Miramar's map (`read: 1`); Butte's ROE definitions; every loaded college holds a procedure record (S395). Refresh the builder's two dated reads when the harvest adds a college. Later (Sam, ~20:02Z): every program with ROEP in a SkyView view ([skyview lane](skyview-ccr-interface.md)).

**Sheet 50 and the maps (S346-S347):** lessons (S353 compaction).

🔨 **Phase 2, a college at a time: 114 colleges hold records (15,946; S414), every new record unchecked until read.** `kb/_program_requirements_college.py` on `program-requirements-college.yml` (its readers: the catalog sweep, below); `assign()` gives a page to the programs whose award and title it names most fully. A push reads only on `[read]`/`[extract]`; a dispatch runs `step=read`, `load` or `display`. The load is insert-only and commits a receipt naming every inserted key, which is the rollback; a record placing none of its listed courses (another program's page) stays out of the load and the display build. **Loaded:** the newest wave is the catalog sweep's, below; the earlier waves' names and counts: lessons, *Moved from the lane (S399 compaction)* and S401. **Display:** each build applies through the display job, which files each row's prior build (the rollback); Sam's standing go (2026-10-10) covers a build that follows a load. **Extraction runs with no card up to $40 a college** (Sam, 2026-10-14, S393; `sam-extraction-standing-go-40-per-college-2026-10-14`); above $40 it is a card. The display job applies the build `cpl_pathways_roep_data.js` carries: run `kb/_build_roep_display.py` and commit its two outputs before dispatching (lessons S385). A program pointing at a retired version of a course the college still offers lists it, placed, no flag (Sam, 2026-10-11, Cerritos 02226). A college must be in the builder's dated reads (`kb/program_requirements_pilot/`, `registry_read.json` and `map_cr_by_course.json`) before its display is built; Earlier colleges' reads and rulings (S385-S398): lessons archive 3, *Moved from the lane (S495 compaction)*. 

🔨 **The reconcile pass (S392; Sam, 2026-10-14: "a secondary search of the catalog text to see if we can reconcile after the initial PR harvest", each catalog's own steps; `cpl_memory` `sam-reconcile-pass-after-harvest-2026-10-14`).** `kb/_program_requirements_reconcile.py` applies a college's steps (`kb/program_requirements_reconcile.json`) at extraction and on filed records (`step=reconcile`, no model call); each change names the words it came from. Orange Coast's and Monterey Peninsula's steps, Cabrillo's and Cerritos's, and Sheet 85's rulings on them (Sam, 2026-10-16, `sam-sheet-85-rulings-2026-10-16`; Victor Valley 37006 and 38352 stay as read, unchecked, shown and flagged): lessons, *Moved from the lane (S402 compaction)*.

Hartnell 83 of 94 and Delta 200 of 203: lessons, *Moved from the lane (S530 compaction)*.
**Glendale (S505, S523-S528; its 2025-26 PDF):** 115 of 226 loaded records pass (S527, from 110). Every course is priced from its own
description (`units_file`; lessons S523, S526), the C-numbers from the runner's parse (S527). Prose totals and the IT Technician pair: lessons S524-S526; the catalog's own sums: S528.
**PARKED (S527, the stopping rule; Sam, 2026-10-30):** two sessions under 3% each. The to-do `glendale-parked-2026-10-30` names what restarts it: [`scheduled_sessions`](../scheduled_sessions.md).
✅ **Sam, Sheet 144 card 2 *floor* (17:50Z 2026-10-30, his own call):** a choose-courses list's printed units are its floor, never its ceiling (`block_units`; `block_units_summed` keeps the reading before it). The S529 rescore and its live apply (Sheet 146 card 2): lessons, *Moved from the lane (S542 compaction)*. NEXT: the display build.
**Los Angeles Valley (S530-S534; its 2026-27 PDF): parked at 202 of 215** (`lavc-parked-2026-10-31`, the stopping rule). Its steps and the 13 left: lessons S530-S534.

**Monterey Peninsula: 184 of 197, every program found; its failing records wait for the outlier pass (Sam marked `monterey-peninsula-parked-2026-11-06` done, 2026-11-06 19:29Z: *"keep going to get everything you can and we'll handle the outliers afterward"*; S594).** Its steps, Sam's *keep* on the floor (Open Asks Sheet 159 card 1) and the four reader items that turn it on (call `monterey-peninsula-parked-2026-11-06`): lessons, *Moved from the lane (S592)*.
**Mt. San Jacinto: 116 of 152 found, merged (#2838);** its 36 gaps stand as the catalog prints them (recheck Chemistry A.S.-T 40010 with the next catalog edit). Detail: lessons, *Moved from the lane (S595)*.
**Ohlone (S593, #2841): 146 of 179 found; every gap is the college's own** (lessons, *Moved from the lane (S596)*).
**Siskiyous (S594-S596, #2877): 66 of 73 passing on the current eLumen reader** (73 of 77 found; was 42 of 65). Extraction 42354853403 ($4.86), load 42359009832 (8 inserted), reread 42359184639 (65 replaced; receipt with before-values), display build 6c1c41f71db3, merged (#2877). Display applied on `main` (run 42360530754: 17,555 of 17,558, 0 errors, the 3 missing Monterey Peninsula rows the table no longer holds; record `9c11f641`). The 7 failing are arithmetic; read them before a reconcile.
**Palomar (S599-S600, #2887): 282 of 342 found; Chemistry A.S. 05201 reread** (load 42376077805 kept 281, reread 42376267731 replaced 05201 with before-values). Displayed: apply 42377748161, 0 errors.
**Coalinga (S599-S600, #2882): 55 of 62 found, 45 passing, displayed.** Display apply 42372728141 on `main` wrote 17,557 of 17,560 with 0 errors (the 3 missing are the Monterey Peninsula rows the table no longer holds; record `64577367`). Its 7 not found and 10 failing stand as filed.
**Los Medanos (S599-S600, #2889): 44 of 83 passing (was 29), free.** About 37 of the 54 failing named the degree's 60 and a GE pattern with no units. Page read 42376216539 gave the transfer pages' words; a reconcile step sets Cal-GETC 34 on transfer degrees only. Reconcile 42376691800, reread 42377887155 (27 replaced, before-values), display build a19682c0630e. Detail: lessons S600. Displayed: apply 42379928561, 0 errors. **GE page read (S602, `kb/college_reads/los_medanos_ge_page.json`):** `26-27/asdegreereq` prints *"at least 24 units"* for the local pattern; `gradreq` prints no electives rule; `calgetc` prints no total, so the MPC citation of the statewide 34 stands (as for Taft, Hartnell). GE 24 alone passes no local degree (Accounting A.S. 01528 computes 23 against 60). **Parked:** the local degrees wait on an electives sentence in LMC's own words.

🔨 **The catalog sweep (S394-S414; Sam's aim of 2026-10-14: every catalog, then curated audit sweeps).** The standing rules: one branch per college, never two on one host; a free capture-only read (`extract=0`) where a host's shape is new, and a free page read (`kb/college_reads/`) before any reader change, verified on the catalog's own words before any dispatch; **dispatch every read with `college=`**; extraction under the $40 go. **A reconcile rescores a record only on the page it was extracted from, or a fresh capture printing the record's own heading** (`own_heading_kept`, S530), and a reconcile step for a figure a local degree never carries reads transfer degrees only (`awards: transfer`). **`step=display` applies the committed build; it never builds one** (run `kb/_build_roep_display.py` on the wave branch first). **Sam's go of 2026-10-17:** harvest calls proceed on their procedures without a card; a write the Supabase guard holds goes through `supabase-migrate.yml`. **Sheet 118 card 1:** each wave's older-build rows are removed with a before-values receipt (the S456 method), no card; Sam ruled **narrow** on the scorer's `meets` reading (Sheet 120 card 1); no note to Program Mapper's vendor for now (Sheet 112 card 1). The two S448 offers wait on Sam's word. **List the thin colleges live, and look for a shared cause, first** (S442). On screen the reference is **CPL Pathways**. **No record (4):** North Orange Continuing Education, San Jose City, Diablo Valley, Santiago Canyon. Readers, invariants, waves, parked colleges and renumbers: the paragraph as it stood, lessons, *Moved from the lane (S562)*, and the pointers it carries.

**The second reader, Grok** (Sheet 97 card 1; built S421, #2246) waits on the xAI billing moving to the RCCD district card and two Edge Function secrets only Sam sets: lessons, *Moved from the lane (S530 compaction)*.

✅ **A light index, full records by key or by college** (S384, Sam 2026-10-13, `cpl_memory` `sam-records-load-by-college-filter-2026-10-13`; the cap, the anon timeout and #2088-#2090, #2121: lessons, S385 and S542 compactions). **The index reads stored columns** (S405, guard `tests/program_requirements.test.js` 6e; lessons, S411). The Records view's college sections and its CIP batch read retired with it (SkyLoquat, 2026-11-04); the List's CIP Sector reads COCI's own CIP.

Sheet 77 card 3 (#2093, #2097): lessons (S387 compaction).

✅ **Flags and a person's reading are built (S347; Sam, Sheet 51 card 1).** Confirm or Needs a fix writes `program_record_verdicts` through `program_record_verdict_add`; a trigger keeps a person's reading across a reload. Detail: lessons doc, *Moved from the lane (S356 compaction)*.

