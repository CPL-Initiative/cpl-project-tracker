---
title: "Program requirements harvest — lane state"
created: 2026-10-03
updated: 2026-11-13
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

**Older rulings and notes** (Sheets 23, 25, 26, 29, 32, 33, 50 and 77; the sequence pass; CSU LA later): lessons, the S335, S336, S353, S387, S394 and S422 compactions.

**Measured (2026-10-03):** the Program Course File names every course a program lists (the closed list each record is checked against) but marks none required. Detail: lessons archive, S334.

**The pilot (Phase 1): all 20 records pass all four checks** (Cerritos, Mt. San Antonio, Riverside City, West LA, Miramar; Sam read them, 18 matched and both fixes went in). Capture `kb/_program_requirements_pilot.py`, extraction the `program-requirements-extract` Edge Function, scorer `kb/_program_requirements_score.py`; guard `tests/program_requirements_pilot_test.py`. Detail: lessons, S372.

**A refusal is on the college's record (Sam, sheet 29 card 3, revised 2026-10-17; `sam-sheet-29-revised-refusal-workarounds-2026-10-17`):** `program_source_registry` carries `sequence_host`, `sequence_access`, `sequence_note`, `sequence_checked_run` and the catalog's `access_status`. ⚠️ **Automated reads still name the CPL Initiative in the user agent and still respect blocks and robots.txt.** A person may fetch a public file by hand for the pipeline (`kb/hand_filed_catalogs/`), and the CO may ask a college or vendor for access (Sam sends the notes). Detail: lessons, *Moved from the lane (S386 compaction)*.

**Sam's ruling (2026-10-04, 11:1xZ, in chat):** *"No need for governance at this
point. Everything is public record and we can mark the tab and contents as beta
draft."* The harvest's tab shows its records without a Governance pass, marked
**Beta draft** (vault braindump
`braindump-2026-10-04-1115-program-requirements-tab-public-record.md`). Then:
*"Integrate Sierra in the tab design."*

**The tab is in COBI** (Beta draft, #1860, Reference & Curation): `program_requirements.js` ports the approved mock-up ([v3](https://claude.ai/artifact/DkfRYLpyusuqYy6ErqQe6f), Sam: *"mock up looks good"*) and reads `program_source_registry` and `program_requirement_records` live. Five views: Progress, Catalogs, Sequences, Procedures (each college's procedure record) and the List; no Sierra (Sam, 2026-10-14, guard `(4b)`). Two early notes (the unscoped surface, Cerritos's Ironworker): lessons, *Moved from the lane (S542 compaction)*.

**The List (2026-11-01, `#program-requirements/list`):** one row per active COCI program (20,282), read only, and the workspace: a program's side panel carries its record's card and drafts the message to the college; program records retired into it (SkyLoquat, 2026-11-04). Guards `tests/program_requirements_list.test.js`, `tests/program_requirements_list_panel.test.js`, `tests/program_requirements_list_record_port.test.js` and `tests/program_requirements.test.js`. The paragraph as it stood: lessons, *Moved from the lane (S639 side session)*.

**Catalog addenda** (`program_source_addenda`; 79 listed at 52 colleges; the eight amending loaded colleges read, S387-S388; the other 71 as the reader reaches their colleges): lessons, S394.

**CPL Pathways reads the ROEP record (Sam, 2026-10-04 ~17:20Z; vault braindump 2026-10-04 17:20):** the harvest tab runs the reading and CPL Pathways shows every record, checked or not, each marked. No record is edited by hand: a misread is filed against the college's reading procedure, and a place where the catalog and the Program Course File disagree goes to the college. The map names the pick inside a choice; the catalog keeps the rule. Ported S334; guard `tests/cpl_pathways_roep_view.test.js`; a11y targets `cpl-pathways-roep` and `-dark`. His words and the mock-up: lessons, *Moved from the lane (S641)*.

**The display build** (`kb/_build_roep_display.py`) writes each program's facts once, under one build stamp, to `program_requirement_records.display` (Sierra) and `cpl_pathways_roep_data.js` (the page); guard `tests/roep_display_test.py`. Its history (S327-S336): the lessons doc, *Moved from the lane (S346 compaction)*.

**Outcomes (Sam, 2026-10-04):** course and program outcomes beside the harvested credential skills, in `course_outcomes`, read nightly (below); the skills comparison waits for `kb/reference/industry_credential_skills.json` (lessons, S413).

**Course objectives too (Sam, 2026-11-02, S551):** his words: lessons, *Moved from the lane (S639 side session)*. **Built (S584):** the reader files objectives as `course_outcomes.kind` `objective`; detail: lessons, *Moved from the lane (S590)*. **NEXT:** (4) the ten loaded colleges read once more for objectives (runner minutes only, no model call), most exhibit articulations first, one host at a time, after Mission's read; a full read files no page text, so it cannot be a reparse.

**The nightly SLO read (Sam, 2026-11-01: *"yes to SLO hints and the nightly harvest"*):** step 11 of [`scheduled_sessions`](../scheduled_sessions.md), most exhibit articulations first (`scripts/next_slo_colleges.py`); a host that prints none gets a verdict in `kb/course_outcomes/queue.json`. Pages only, no model call, so no cost. Ten colleges loaded through Shasta (S641, #3102: 1,549 rows; receipt `kb/receipts/course_outcomes_shasta_43203623517.json`, the rollback). De Anza is held (#3145: its 2026-27 catalog does not answer the older course codes) until the reader maps codes and a fresh trial runs. Earlier runs: lessons, *Moved from the lane (S636)*. **Next:** the day's full read and preparation run, as `--next` names them.

**The Cerritos Ironworker proof of concept** (the ladder on CPL Pathways), the reader `kb/_college_page_read.py` with its plans in `kb/college_reads/`, and **one procedure record per college** written through `program_source_procedure_set(college, record, by, expect_md5)` (service role, md5-guarded, history trigger): the lessons doc, *Moved from the lane (S346 compaction)*.

✅ **Sheets 38, 39 and 42's rulings:** lessons, *Moved from the lane (S336 compaction)*. ✅ **The Progress view (S343, #1900), drawn by `commons_progress.js`, its status file written at step 12:** lessons, *Moved from the lane (S598)*. **NEXT:** ① Re-read Schedule+ for Spring 2027 once its IWAP sections post. ② The film: re-render when a ladder line it shows changes. ③ The addenda reading agent after the 2026-10-11 apply; Miramar's map (`read: 1`); Butte's ROE definitions; every loaded college holds a procedure record (S395). Refresh the builder's two dated reads when the harvest adds a college. Later (Sam, ~20:02Z): every program with ROEP in a SkyView view ([skyview lane](skyview-ccr-interface.md)).

🔨 **Phase 2, a college at a time: 114 colleges hold records (15,946; S414), every new record unchecked until read.** `kb/_program_requirements_college.py` on `program-requirements-college.yml` (its readers: the catalog sweep, below); `assign()` gives a page to the programs whose award and title it names most fully. A push reads only on `[read]`/`[extract]`; a dispatch runs `step=read`, `load` or `display`. The load is insert-only and commits a receipt naming every inserted key, which is the rollback; a record placing none of its listed courses (another program's page) stays out of the load and the display build. Earlier waves: lessons, S399 and S401. **Display:** each build applies through the display job, which files each row's prior build (the rollback); Sam's standing go (2026-10-10) covers a build that follows a load; S644 asks him whether it still stands (Sheet 187 card 3). **Extraction runs with no card up to $40 a college** (Sam, 2026-10-14, S393; `sam-extraction-standing-go-40-per-college-2026-10-14`); above $40 it is a card. The display job applies the build `cpl_pathways_roep_data.js` carries: run `kb/_build_roep_display.py` and commit its two outputs before dispatching (lessons S385). A program pointing at a retired version of a course the college still offers lists it, placed, no flag (Sam, 2026-10-11, Cerritos 02226). A college must be in the builder's dated reads (`kb/program_requirements_pilot/`, `registry_read.json` and `map_cr_by_course.json`) before its display is built; Earlier colleges' reads and rulings (S385-S398): lessons archive 3, *Moved from the lane (S495 compaction)*. 

🔨 **The reconcile pass (S392; Sam, 2026-10-14: "a secondary search of the catalog text to see if we can reconcile after the initial PR harvest", each catalog's own steps; `cpl_memory` `sam-reconcile-pass-after-harvest-2026-10-14`).** `kb/_program_requirements_reconcile.py` applies a college's steps (`kb/program_requirements_reconcile.json`) at extraction and on filed records (`step=reconcile`, no model call); each change names the words it came from. Orange Coast's and Monterey Peninsula's steps, Cabrillo's and Cerritos's, and Sheet 85's rulings on them (Sam, 2026-10-16, `sam-sheet-85-rulings-2026-10-16`; Victor Valley 37006 and 38352 stay as read, unchecked, shown and flagged): lessons, *Moved from the lane (S402 compaction)*.

**Parked or displayed earlier:** Hartnell 83 of 94, Delta 200 of 203, Glendale 115 of 226 (parked, `glendale-parked-2026-10-30`), Los Angeles Valley 202 of 215 (parked, `lavc-parked-2026-10-31`); a choose-courses list's printed units are its floor (Sheet 144 card 2): lessons, *Moved from the lane (S639 side session)*.

**Displayed or standing as filed:** Monterey Peninsula 184 of 197, Mt. San Jacinto 116 of 152, Ohlone 146 of 179, Siskiyous, Palomar, Coalinga, Columbia 78 of 82, Las Positas 181 of 193, College of Alameda 35 of 59, Butte 138 of 164: lessons, *Moved from the lane (S639 side session)*. **A refused read follows [`blocked_sources`](../blocked_sources.md) before any card.**
**Los Medanos (S599-S602, #2889): 44 of 83 passing; parked** until an electives sentence in its own words: lessons, *Moved from the lane (S633)*.
**Redwoods (#2918, #3105): 59 of 73 passing on the branch;** local degrees take CRGE's 21 (`d-redwoods-crge-21-s636`). NEXT: the reread and display. The paragraph as it stood: lessons, *Moved from the lane (S641)*.

**De Anza (S636-S638, #3109): 205 of 221 passing on its 2026-2027 eLumen catalog.** NEXT: the 24 rows with no display; the 15 rows on 2025-2026 removed by the S456 method (Sheet 118 card 1); the display build after this wave's rereads.

**The numbered handoff carries the lane** ([`session_645_handoff`](../../session_645_handoff.md)). **DECIDED (Sam, 7:13 PM PT 2026-11-11, relayed by COBIx on #3110; `sam-harvest-next-steps-tonight-2026-11-11`):** "Yes, pick them up tonight." Decisions that stand: `d-lacc-heading-minimum-60-s639`, `d-occ-up-to-ge-maximum-s639`, `d-hours-meets-top-term-length-s639`, `d-rio-hondo-cal-getc-areas-count-s639`, `d-west-valley-cal-getc-areas-count-s639`.
**DECIDED (the S640 conductor; `d-pdf-reader-design-calls-s640`):** the list rule never lowers coverage; a bare number is a page number only when proven.
**DECIDED (the S641 conductor, 2026-11-12):** equal coverage holds a passing record, fingerprint or not. A text change at equal coverage is answered by a catalog-year rule (a new catalog year reads every record once), never by the per-run fingerprint, which moves on unchanged text and would pay for the same record every run.
**DECIDED (the S641 conductor, the second review; the kept-passing guard):** a passing record is replaced only by a read that passes at least as well and covers at least as much (`kept_reason`, `kept_passing.json`; `force` overrides); "passing" is `passes_live`, equal only on purpose. The rules as written: lessons, *Moved from the lane (S644)*.
**Known costs of the fingerprint, and the proof table:** lessons, *Moved from the lane (S641)*. The PDF reader's merge note, the S641 paid reads, S643's display-run NEXT and the wave 3 diagnoses: lessons, *Moved from the lane (S644)*.
**Running a college:** `program-requirements-college.yml` (`college`, `extract` default `1`, so leaving it out spends; `limit`, `step`, `force` adds programs and never limits; `route`). A run files to the branch it ran on: a paid run goes on the college's branch, never `ref main`.
🔨 **Throughput (S644; Sam, 23:53Z 2026-11-12: *"we need to increase our throughput"*).** Record: lessons, *S644*.
**The gap census** (`kb/_harvest_gap_census.py`, `harvest-gap-census.yml`, #3189) gives each active program without a passing record one cause and one lever. Live 00:24Z 2026-11-13: 20,282 active, 13,524 pass, 6,758 do not; the largest causes no closed list 1,604, units unequal 1,207, page not found 940. **DECIDED (`d-passes-live-stays-equal-only-s644`):** `passes_live`, the kept-passing guard, stays equal only (S641); the tab, the census and the headline count equal or unstated (`counts_passing_on_tab`, #3193): 15,183 of 18,545 committed records against 14,645.
**A wave** (`program-requirements-wave.yml`, #3191): up to eight colleges on distinct hosts, one branch, one PR, one filing job, no table written; how: lessons, *Running a wave (S644)*. **DECIDED (`d-wave-one-branch-hard-stop-s644`, COBIx agreed):** $40 a college on the estimate and by a hard stop on actual cost; a re-run never extracts. **DECIDED (`d-wave-price-rate-floor-s644`):** the rate is max(0.08, the mean of filed records with a positive cost). First free trial: run 43343741511, `claude/harvest-wave-s644trial`.
**The display apply (#3190, not yet run live):** paged before-read, eight parallel writes, the record filed from a confirming read. **DECIDED (`d-display-missing-threshold-s644`):** a missing key is listed, fatal only above max(1% of statements, 30); the rollback names every row sent a write.
**Loaded in S644** (insert-only, each receipt the rollback): Los Angeles City's 22 absent records, 18 pass (**DECIDED** `d-lacc-22-absent-loaded-s644`: IGETC 19842 and Cal-GETC 44946 included, both Active there); Santiago Canyon 192 rows, 149 pass (receipt on #3194's branch); North Orange Continuing Education 78 rows, 77 pass (receipt on `claude/harvest-noce-s644`).
**DECIDED (`d-no-closed-list-separate-grade-s644`):** the 1,604 programs with no closed list (#3192: no join bug) are read and checked against the college's own active course list as a separate grade outside the headline. **DECIDED (`d-hours-reading-gated-sbv-coalinga-s644`):** #3193's no-colon hours reading reads only at San Bernardino Valley and Coalinga, with positive evidence in the record's own section. **DECIDED (`d-dated-reads-runner-job-s644`):** a college PR's dated reads refresh in a runner job (#3197); plan them and the display build as part of a first read. **DECIDED (`d-cobix-offers-specialist-bots-s644`, Sam's go relayed by COBIx):** COBIx scouts sources, spot-checks five records after each wave and ranks by blast radius; two read-only bots (source scout, wave checker), not built.
**Waits for Sam (Sheet 187, cards 3-5):** 3, does the 2026-10-10 display go still stand (COBIx could not confirm it, #3111 6840723274); 4, does the course-list grade count in the headline; 5, a statewide Cal-GETC of 34 units (93 more programs pass).
**NEXT, in order:** (1) #3193 on green, then its rescore as a reviewed step (migration, reconcile and reread at San Bernardino Valley, Coalinga, Grossmont, ELAC, Pierce, Solano). (2) #3197; then on #3194's branch merge `main` and `claude/harvest-noce-s644`, run the dated reads for both, `kb/_build_roep_display.py`, commit, merge on green; then `step=display` (card 3). (3) The trial's `kb/program_requirements_wave/s644trial.md`. (4) #3195 (Diablo Valley's eLumen pages) and #3196 (San Jose City's code form), then free captures, paid reads within $40. (5) The next wave's colleges to COBIx on #3111; the sample in the filing job; census follow-ups. (6) College of the Desert by [`blocked_sources`](../blocked_sources.md); the catalog-year rule; De Anza's tail; Redwoods' reread.
🔨 **The catalog sweep (S394-S414; Sam's aim of 2026-10-14: every catalog, then curated audit sweeps).** The standing rules: one branch per college, never two on one host; a free capture-only read (`extract=0`) where a host's shape is new, and a free page read (`kb/college_reads/`) before any reader change, verified on the catalog's own words before any dispatch; **dispatch every read with `college=`**; extraction under the $40 go. **A reconcile rescores a record only on the page it was extracted from, or a fresh capture printing the record's own heading** (`own_heading_kept`, S530), and a reconcile step for a figure a local degree never carries reads transfer degrees only (`awards: transfer`). **`step=display` applies the committed build; it never builds one** (run `kb/_build_roep_display.py` on the wave branch first). **Sam's go of 2026-10-17:** harvest calls proceed on their procedures without a card; a write the Supabase guard holds goes through `supabase-migrate.yml`. **Sheet 118 card 1:** each wave's older-build rows are removed with a before-values receipt (the S456 method), no card; Sam ruled **narrow** on the scorer's `meets` reading (Sheet 120 card 1); no note to Program Mapper's vendor for now (Sheet 112 card 1). The two S448 offers wait on Sam's word. **List the thin colleges live, and look for a shared cause, first** (S442). On screen the reference is **CPL Pathways**. **No record (2):** Diablo Valley (#3195) and San Jose City (#3196); Santiago Canyon and North Orange Continuing Education were read and loaded in S644 (Throughput, above). Readers, invariants, waves, parked colleges and renumbers: the paragraph as it stood, lessons, *Moved from the lane (S562)*, and the pointers it carries.

**The second reader, Grok** (Sheet 97 card 1; built S421, #2246) waits on the xAI billing moving to the RCCD district card and two Edge Function secrets only Sam sets: lessons, *Moved from the lane (S530 compaction)*.

✅ **A light index, full records by key or by college** (S384; the index reads stored columns, S405, guard `tests/program_requirements.test.js` 6e): lessons, *Moved from the lane (S641)*.

✅ **Flags and a person's reading are built (S347; Sam, Sheet 51 card 1).** Confirm or Needs a fix writes `program_record_verdicts` through `program_record_verdict_add`; a trigger keeps a person's reading across a reload. Detail: lessons doc, *Moved from the lane (S356 compaction)*.

