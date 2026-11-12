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

🔨 **Phase 2, a college at a time: 114 colleges hold records (15,946; S414), every new record unchecked until read.** `kb/_program_requirements_college.py` on `program-requirements-college.yml` (its readers: the catalog sweep, below); `assign()` gives a page to the programs whose award and title it names most fully. A push reads only on `[read]`/`[extract]`; a dispatch runs `step=read`, `load` or `display`. The load is insert-only and commits a receipt naming every inserted key, which is the rollback; a record placing none of its listed courses (another program's page) stays out of the load and the display build. Earlier waves: lessons, S399 and S401. **Display:** each build applies through the display job, which files each row's prior build (the rollback); Sam's standing go (2026-10-10) covers a build that follows a load. **Extraction runs with no card up to $40 a college** (Sam, 2026-10-14, S393; `sam-extraction-standing-go-40-per-college-2026-10-14`); above $40 it is a card. The display job applies the build `cpl_pathways_roep_data.js` carries: run `kb/_build_roep_display.py` and commit its two outputs before dispatching (lessons S385). A program pointing at a retired version of a course the college still offers lists it, placed, no flag (Sam, 2026-10-11, Cerritos 02226). A college must be in the builder's dated reads (`kb/program_requirements_pilot/`, `registry_read.json` and `map_cr_by_course.json`) before its display is built; Earlier colleges' reads and rulings (S385-S398): lessons archive 3, *Moved from the lane (S495 compaction)*. 

🔨 **The reconcile pass (S392; Sam, 2026-10-14: "a secondary search of the catalog text to see if we can reconcile after the initial PR harvest", each catalog's own steps; `cpl_memory` `sam-reconcile-pass-after-harvest-2026-10-14`).** `kb/_program_requirements_reconcile.py` applies a college's steps (`kb/program_requirements_reconcile.json`) at extraction and on filed records (`step=reconcile`, no model call); each change names the words it came from. Orange Coast's and Monterey Peninsula's steps, Cabrillo's and Cerritos's, and Sheet 85's rulings on them (Sam, 2026-10-16, `sam-sheet-85-rulings-2026-10-16`; Victor Valley 37006 and 38352 stay as read, unchecked, shown and flagged): lessons, *Moved from the lane (S402 compaction)*.

**Parked or displayed earlier:** Hartnell 83 of 94, Delta 200 of 203, Glendale 115 of 226 (parked, `glendale-parked-2026-10-30`), Los Angeles Valley 202 of 215 (parked, `lavc-parked-2026-10-31`); a choose-courses list's printed units are its floor (Sheet 144 card 2): lessons, *Moved from the lane (S639 side session)*.

**Displayed or standing as filed:** Monterey Peninsula 184 of 197, Mt. San Jacinto 116 of 152, Ohlone 146 of 179, Siskiyous, Palomar, Coalinga, Columbia 78 of 82, Las Positas 181 of 193, College of Alameda 35 of 59, Butte 138 of 164: lessons, *Moved from the lane (S639 side session)*. **A refused read follows [`blocked_sources`](../blocked_sources.md) before any card.**
**Los Medanos (S599-S602, #2889): 44 of 83 passing; parked** until an electives sentence in its own words: lessons, *Moved from the lane (S633)*.
**Redwoods (#2918, #3105): 59 of 73 passing on the branch;** local degrees take CRGE's 21 (`d-redwoods-crge-21-s636`). NEXT: the reread and display. The paragraph as it stood: lessons, *Moved from the lane (S641)*.

**De Anza (S636-S638, #3109): 205 of 221 passing on its 2026-2027 eLumen catalog.** NEXT: the 24 rows with no display; the 15 rows on 2025-2026 removed by the S456 method (Sheet 118 card 1); the display build after this wave's rereads.

**The numbered handoff carries the lane** ([`session_642_handoff`](../../session_642_handoff.md)). **DECIDED (Sam, 7:13 PM PT 2026-11-11, relayed by COBIx on #3110; `sam-harvest-next-steps-tonight-2026-11-11`):** "Yes, pick them up tonight." Decisions that stand: `d-lacc-heading-minimum-60-s639`, `d-occ-up-to-ge-maximum-s639`, `d-hours-meets-top-term-length-s639`, `d-rio-hondo-cal-getc-areas-count-s639`, `d-west-valley-cal-getc-areas-count-s639`.
**Merged in S640 and S641:** Victor Valley 136 of 168, West Valley 120 of 133, Berkeley City 48 of 89, Rio Hondo 276 of 288 (lessons, *Moved from the lane (S641)*).
**The PDF reader (#3135, merged `1ebee603`, S641):** the list-page rule skips a department's award list; `text_sha` fingerprints each window, and a later edition that only moves a program keeps its record with no model call (`moved_unchanged`), from each program's next extraction on. A capture never stamps a record it did not extract.
**DECIDED (the S640 conductor; `d-pdf-reader-design-calls-s640`):** the list rule never lowers coverage; a bare number is a page number only when proven.
**DECIDED (the S641 conductor, 2026-11-12):** equal coverage holds a passing record, fingerprint or not. A text change at equal coverage is answered by a catalog-year rule (a new catalog year reads every record once), never by the per-run fingerprint, which moves on unchanged text and would pay for the same record every run.
**DECIDED (the S641 conductor, the second review):** (1) a hold protects only a passing record. (2a) a passing record whose new window covers no more than its extraction window is held (`held_worse_window`, `held_no_gain`; more from a list opening is `held_opens_on_list`). (2b) after any read, a passing record is replaced only by a read that passes at least as well and covers at least as much (`kept_reason`, `kb/_program_requirements_college.py`, #3135 and #3154): a filed record that passes in full (`score.pass` and the live test) stays unless the new read also passes in full (`passes_less`), one that passes only the live test stays unless the new read passes it too, and a read at the same grade or better that places a smaller share of the listed courses (`score.coverage.share`) is `covers_less`; equal coverage replaces. Kept programs go to `kept_passing.json` with both scores; `force` overrides. Found on American River 11566 (15 of 20 placed to 9 of 20). **Open, not ruled:** whether a larger arithmetic fill at equal coverage should keep the filed record; the guard ignores it. (3) "passing" is `passes_live` (`kb/_program_requirements_score.py`). (4) window coverage is compared only with window coverage.
**Known costs of the fingerprint, and the proof table:** lessons, *Moved from the lane (S641)*.
**Running a college:** `program-requirements-college.yml` (`college`, `extract` default `1`, so leaving it out spends; `limit`, `step`, `force` adds programs and never limits; `route`). A run files to the branch it ran on: a paid run goes on the college's branch, never `ref main`.
**The S641 paid reads** (branches off `main` at `17d5ac54`; a verifier read each against `main`'s records before any load):
- **American River (#3156, open):** paid run 43212067552, 33 programs, $3.13 (a run's cost: its stamped records plus `kept_passing.json`; `summary.json` `cost_usd` includes older runs). 17 fail to pass, 0 pass to fail; 11566 held back by restoring `main`'s copy (`020fb872`). Reread 43216104949 (16 replaced) and load 43217624238 (8 inserted), receipts on the branch. Live 292 of 327 passing at 12:24Z.
- **Los Angeles City (#3155, open; `test` failed on its first head, being fixed):** paid run 43212072618, 145 programs, $11.38. 39 fail to pass, 0 pass to fail, none lost coverage; `kept_passing.json` kept 02748, 40593, 40596. Reread 43216110417: 117 replaced, 22 absent (receipt on the branch). Live 203 of 223 at 12:24Z.
- **Victor Valley (`claude/harvest-victor-valley-s641`, no PR):** capture 43209653923 filed (176 kept); the paid read with `force=38353,38366,38502,38503` (about $0.25) was dispatched about 12:10Z and had not filed at 12:34Z. Live 136 of 168.
- **College of the Desert stays unread and unproven:** the baseline (`claude/harvest-pdf-baseline-s640`, `919373d6`) read the PDF (476 pages, 51 to extract), and the capture on the new reader (43212020852, `claude/harvest-desert-proof-s641`) found the host unreachable after 1,016 s with the 2,400 s limit in force (receipt `kb/receipts/program_source_procedure_desert_timeout_s641_2026-11-12.sql`): a third failure. Both branches can go (Sam or GitHub deletes them).
**NEXT, in order:** (1) merge #3155 and #3156 on a green `test`. (2) Victor Valley: verify the four against `main`'s, reread, count, PR. (3) Los Angeles City: whether `step=load` runs for the 22 absent records (18 pass); it would also insert IGETC (19842) and Cal-GETC (44946) as program records, both failing. (4) College of the Desert by [`blocked_sources`](../blocked_sources.md): the college's other hosts, the publisher's copy, an archive copy, then a comment that mentions `cobi-cto`. (5) Fix `fetch_copy`'s docstring: "never from the college's host" contradicts Sam's #3096 ruling. (6) Design item, not built: the catalog-year rule.
**San Bernardino Valley, Grossmont, East Los Angeles:** diagnosed, not started ([`harvest_wave3_diagnoses_s639`](../../harvest_wave3_diagnoses_s639.md)). NEXT (7): two scorer readings, one writer, each measured at every college first: a noncredit *Total Hours N-M*, and the electives flag where a step files the catalog's own sentence. NEXT (8): De Anza's tail and the display build.
🔨 **The catalog sweep (S394-S414; Sam's aim of 2026-10-14: every catalog, then curated audit sweeps).** The standing rules: one branch per college, never two on one host; a free capture-only read (`extract=0`) where a host's shape is new, and a free page read (`kb/college_reads/`) before any reader change, verified on the catalog's own words before any dispatch; **dispatch every read with `college=`**; extraction under the $40 go. **A reconcile rescores a record only on the page it was extracted from, or a fresh capture printing the record's own heading** (`own_heading_kept`, S530), and a reconcile step for a figure a local degree never carries reads transfer degrees only (`awards: transfer`). **`step=display` applies the committed build; it never builds one** (run `kb/_build_roep_display.py` on the wave branch first). **Sam's go of 2026-10-17:** harvest calls proceed on their procedures without a card; a write the Supabase guard holds goes through `supabase-migrate.yml`. **Sheet 118 card 1:** each wave's older-build rows are removed with a before-values receipt (the S456 method), no card; Sam ruled **narrow** on the scorer's `meets` reading (Sheet 120 card 1); no note to Program Mapper's vendor for now (Sheet 112 card 1). The two S448 offers wait on Sam's word. **List the thin colleges live, and look for a shared cause, first** (S442). On screen the reference is **CPL Pathways**. **No record (4):** North Orange Continuing Education, San Jose City, Diablo Valley, Santiago Canyon. Readers, invariants, waves, parked colleges and renumbers: the paragraph as it stood, lessons, *Moved from the lane (S562)*, and the pointers it carries.

**The second reader, Grok** (Sheet 97 card 1; built S421, #2246) waits on the xAI billing moving to the RCCD district card and two Edge Function secrets only Sam sets: lessons, *Moved from the lane (S530 compaction)*.

✅ **A light index, full records by key or by college** (S384; the index reads stored columns, S405, guard `tests/program_requirements.test.js` 6e): lessons, *Moved from the lane (S641)*.

✅ **Flags and a person's reading are built (S347; Sam, Sheet 51 card 1).** Confirm or Needs a fix writes `program_record_verdicts` through `program_record_verdict_add`; a trigger keeps a person's reading across a reload. Detail: lessons doc, *Moved from the lane (S356 compaction)*.

