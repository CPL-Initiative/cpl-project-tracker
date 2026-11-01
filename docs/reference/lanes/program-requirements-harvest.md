---
title: "Program requirements harvest — lane state"
created: 2026-10-03
updated: 2026-10-31
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

**The registry** (`kb/supabase_program_source_registry.sql`, four migrations applied live 2026-10-03): one row per college, a history table, one write path (`program_source_census_apply`, service role only), anon SELECT. Columns and Sam's 2026-10-03 rulings: lessons, *Moved from the lane (S419 compaction)*.

**The census** (`kb/_program_source_census.py`, `program-source-census.yml`): reads each college's homepage on a runner, scores and dates its catalog link, applies weekly on `main` (Sundays 10:29 UTC). Its rules, politeness limits and governance note: the lessons doc, *Moved from the lane (S334 compaction)*. Guard: `tests/program_source_census_test.py`.

**Sheets 23, 25 and 26 rulings:** lessons (S335 compaction).

**Measured (2026-10-03):** the Program Course File names every course a program lists (the closed list each record is checked against) but marks none required. Detail: lessons, *Moved from the lane (S334 compaction)*.

**The pilot (Phase 1): all 20 records pass all four checks** (Cerritos, Mt. San Antonio, Riverside City, West LA, Miramar; Sam read them, 18 matched and both fixes went in). Capture `kb/_program_requirements_pilot.py`, extraction the `program-requirements-extract` Edge Function, scorer `kb/_program_requirements_score.py`; guard `tests/program_requirements_pilot_test.py`. Detail: the lessons doc, *Moved from the lane (S372)*.

**The sequence pass (S325) and a refused mapper host:** lessons, *Moved from the lane (S394 compaction)*.

**A refusal is on the college's record (Sam, sheet 29 card 3, revised 2026-10-17):** `program_source_registry` carries `sequence_host`, `sequence_access`, `sequence_note`, `sequence_checked_run`, and `access_status` for the catalog. ⚠️ **Automated reads still name the CPL Initiative in the user agent and still respect blocks and robots.txt.** Since Sam's rulings of 2026-10-17 (`cpl_memory` `sam-sheet-29-revised-refusal-workarounds-2026-10-17`), a person may fetch a public file by hand for the pipeline (the hand-filed step, `kb/hand_filed_catalogs/`), and the CO may ask a college or vendor for access (the access-note drafts in `CPLBrain/04-projects/cpl-initiative/20261017_Catalog_Reader_Access_Notes_Draft_1.md`; Sam sends them). Detail and the 25 colleges filed: lessons, *Moved from the lane (S386 compaction)*.

**Sam's ruling (2026-10-04, 11:1xZ, in chat):** *"No need for governance at this
point. Everything is public record and we can mark the tab and contents as beta
draft."* The harvest's tab shows its records without a Governance pass, marked
**Beta draft** (vault braindump
`braindump-2026-10-04-1115-program-requirements-tab-public-record.md`). Then:
*"Integrate Sierra in the tab design."*

**The tab is in COBI** (Beta draft, #1860, Reference & Curation): `program_requirements.js` ports the approved mock-up ([v3](https://claude.ai/artifact/DkfRYLpyusuqYy6ErqQe6f), Sam: *"mock up looks good"*) and reads `program_source_registry` and `program_requirement_records` live. Four views: Catalogs, Program records (the four checks; the display build's CPL figure), Sequences, and Procedures (each college's procedure record). Sierra docks at the top (sheet 38 card 5; Sam: *"Sierra at the top"*): a collapsible Sierra AI section mounts the CPL Assistant (`CPL_CHAT.mountInto(host, "program-requirements")`); `cpl-chat` reads the surface as unscoped until `KNOWN_SURFACES` names it (a deploy). Cerritos's Ironworker A.S. reads 0 MAP credit recs (its credit is exhibit articulation, in CER).

**Catalog addenda** (`program_source_addenda`; 79 listed at 52 colleges; the eight amending loaded colleges read, S387-S388; the other 71 as the reader reaches their colleges): lessons, *Moved from the lane (S394 compaction)*.

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
[CPL Pathways ROEP](https://claude.ai/artifact/8hkej9jHsmLRX6cZYxrXbM). ✅ **Ported (S334):** the pathway selector lists every catalog record (Beta draft); each opens By requirement (tiles, an option fork, CPL in three kinds in words, the checks, the outcomes, the gaps read-only) or By term (the map's status, every course in the tray), for the College or Student or public viewer. Guard `tests/cpl_pathways_roep_view.test.js`; a11y targets `cpl-pathways-roep` and `-dark`.

**Sam's sheets 29 and 32 (2026-10-04)** (Sierra's "required"; "up to" and CPL in three kinds): lessons, S422 compaction.

**The display build** (`kb/_build_roep_display.py`) writes each program's facts once, under one build stamp, to `program_requirement_records.display` (Sierra) and `cpl_pathways_roep_data.js` (the page); guard `tests/roep_display_test.py`. Its history (S327-S336): the lessons doc, *Moved from the lane (S346 compaction)*.

**Outcomes (Sam, 2026-10-04):** course and program outcomes beside the harvested credential skills. `course_outcomes` is live (nine colleges, 7,450 courses); the skills comparison waits for `kb/reference/industry_credential_skills.json`. Detail: lessons, *Moved from the lane (S413 compaction)*.

**CSU LA:** later (Sam, sheet 33 card 3; lessons S336).

**The Cerritos Ironworker proof of concept** (the ladder on CPL Pathways), the reader `kb/_college_page_read.py` with its plans in `kb/college_reads/`, and **one procedure record per college** written through `program_source_procedure_set(college, record, by, expect_md5)` (service role, md5-guarded, history trigger): the lessons doc, *Moved from the lane (S346 compaction)*.

✅ **Sheets 38, 39 and 42's rulings:** lessons, *Moved from the lane (S336 compaction)*. ✅ **The Progress view (S343, #1900):** the tab's first view, from the mock-up Sam approved (*"The mockup looks good to go"*). `MILESTONES` and `PARTS` at its top are definitions; the tables are read live; what anon cannot read comes from **`kb/status/program-requirements.json`** (`kb/queue_status.json` until S418), written at every checkpoint (step 12, `scripts/queue_status.py`), never from a widened policy. **The view is drawn by the Commons' shared module `commons_progress.js` since S419** (the Commons' step 1; [commons lane](commons.md)): this tab keeps its definitions (`MILESTONES`, `PARTS`, `WHOLE`, `HEADLINE`, `PROGRESS`) and its live reads, and lends the module its sections and count controls. Detail: lessons S343. Every count opens what it totals; a card waiting on Sam links where he answers (#2077); a call in `kb/queue_status.json` must carry its answer link (`link`, `view` or `records`) and may name its card (`part`). **Whole harvest** (Sam, 2026-10-13): five parts, confirm left out; `queue_status.py --harvest` stamps it. **Complete (S415, Sam's ask of 2026-10-18 that the headline "doesn't seem quite right"):** an active COCI program whose record passes the three machine checks (`program_record_machine_pass`), counted live from the index against COCI's active programs read by key; it had meant a person's check, which stood at 32 after Sam's 2026-10-17 "trusting your procedures". The 32 stay on the pilot milestone; Sierra quotes every complete record since Sheet 95 card 2 (S416, [sierra lane](sierra-retrieval-corpus.md)). the status file no longer carries the `unchecked` list (3.5 MB to 4 KB); the headline history records `complete` (`queue_status.py --headline-sql`). A status-file note replaces its card's live foot, so delete one the moment it stops being true. **NEXT:** ① Re-read Schedule+ for Spring 2027 once its IWAP sections post. ② The film: re-render when a ladder line it shows changes. ③ The addenda reading agent after the 2026-10-11 apply; Miramar's map (`read: 1`); Butte's ROE definitions; every loaded college holds a procedure record (S395). Maps: 3 of 32 read, 24 mapper hosts refused (lessons S345). Refresh the builder's two dated reads when the harvest adds a college. Later (Sam, ~20:02Z): every program with ROEP in a SkyView view ([skyview lane](skyview-ccr-interface.md)).

**Sheet 50 and the maps (S346-S347):** lessons (S353 compaction).

🔨 **Phase 2, a college at a time: 114 colleges hold records (15,946; S414), every new record unchecked until read.** `kb/_program_requirements_college.py` on `program-requirements-college.yml` (its readers: the catalog sweep, below); `assign()` gives a page to the programs whose award and title it names most fully. A push reads only on `[read]`/`[extract]`; a dispatch runs `step=read`, `load` or `display`. The load is insert-only and commits a receipt naming every inserted key, which is the rollback; a record placing none of its listed courses (another program's page) stays out of the load and the display build. **Loaded:** the newest wave is the catalog sweep's, below; the earlier waves' names and counts: lessons, *Moved from the lane (S399 compaction)* and S401. Procedure records come from `kb/_program_source_procedure_v1.py` (#2146); an existing record gets a v2 merged in SQL. **Display:** each build applies through the display job, which files each row's prior build (the rollback); Sam's standing go (2026-10-10) covers a build that follows a load. **Extraction runs with no card up to $40 a college** (Sam, 2026-10-14, S393; `sam-extraction-standing-go-40-per-college-2026-10-14`); above $40 it is a card. The display job applies the build `cpl_pathways_roep_data.js` carries: run `kb/_build_roep_display.py` and commit its two outputs before dispatching (lessons S385). A program pointing at a retired version of a course the college still offers lists it, placed, no flag (Sam, 2026-10-11, Cerritos 02226). A college must be in the builder's dated reads (`kb/program_requirements_pilot/`, `registry_read.json` and `map_cr_by_course.json`) before its display is built; Earlier colleges' reads and rulings (S385-S398): lessons archive 3, *Moved from the lane (S495 compaction)*. 

🔨 **The reconcile pass (S392; Sam, 2026-10-14: "a secondary search of the catalog text to see if we can reconcile after the initial PR harvest", each catalog's own steps; `cpl_memory` `sam-reconcile-pass-after-harvest-2026-10-14`).** `kb/_program_requirements_reconcile.py` applies a college's steps (`kb/program_requirements_reconcile.json`) at extraction and on filed records (`step=reconcile`, no model call); each change names the words it came from. Orange Coast's and Monterey Peninsula's steps, Cabrillo's and Cerritos's, and Sheet 85's rulings on them (Sam, 2026-10-16, `sam-sheet-85-rulings-2026-10-16`; Victor Valley 37006 and 38352 stay as read, unchecked, shown and flagged): lessons, *Moved from the lane (S402 compaction)*.

Hartnell 83 of 94 and Delta 200 of 203: lessons, *Moved from the lane (S530 compaction)*.
**Glendale (S505, S523-S528; its 2025-26 PDF):** 115 of 226 loaded records pass (S527, from 110). Every course is priced from its own
description (`units_file`; lessons S523, S526), the C-numbers from the runner's parse (S527). Prose totals and the IT Technician pair: lessons S524-S526; the catalog's own sums: S528.
**PARKED (S527, the stopping rule; Sam, 2026-10-30):** two sessions under 3% each. The to-do `glendale-parked-2026-10-30` names what restarts it: [`scheduled_sessions`](../scheduled_sessions.md).
✅ **Sam, Sheet 144 card 2 *floor* (17:50Z 2026-10-30, his own call):** a choose-courses list's printed units are its floor, never its ceiling (`block_units`; `block_units_summed` keeps the reading before it). S529 rescored the filed records (`kb/_program_requirements_floor_rescore.py`): 161 unequal and 28 incomplete to equal, 12 equal and 5 incomplete to unequal; 14 left failing on their degree check. ✅ **Applied live (Sheet 146 card 2, *pasted*, 20:30Z):** Sam ran the receipt's `apply_one` (12 equal to unequal, 27 and 160 to equal, 5 incomplete to unequal); Los Angeles Valley's reread had moved the other two; all 206 read back (S530). NEXT: the display build.
**Los Angeles Valley (S530-S534; its 2026-27 PDF): parked at 202 of 215** (`lavc-parked-2026-10-31`, the stopping rule). Its steps and the 13 left: lessons S530-S534.

**Monterey Peninsula (S535-S536; its 2026-27 CourseLeaf site): 183 of 197 passing**. Its steps: MPC GE 24-34, Cal-GETC 34 (both years' words), the 60 a floor ("electives, if needed"), `or_units`, `and_units` (a lab printed joined to its lecture, "CSIS 50 · & 50L", takes 0). The 14 left: lessons S536. S536 moved 7 (3.6%), so one more session under 3% parks it. **NEXT: Monterey Peninsula's 14.**

🔨 **The catalog sweep (S394-S414; Sam's aim of 2026-10-14: every catalog, then curated audit sweeps).** One branch per college, never two on one host; a wave branch merges the loaded ones, their dated reads and one display build. A free capture-only read (`extract=0`) comes first wherever a host's shape is new to the reader, and a free page read of the host's own outline (`kb/college_reads/`) before any reader change; the session reaches neither college hosts nor run artifacts, so a PDF's text comes from a page read. **Dispatch every read with `college=`** (lessons S402). Extraction runs under the $40 go. **The readers** (CourseLeaf, curriQunet, eLumen, Acalog, Coursedog, the whole-catalog PDF): lessons, *Moved from the lane (S421 compaction)*. The code finder's, the code net's and the scorer's readings of catalog text (#2206, #2207, #2222, S414): lessons, *Moved from the lane (S420 compaction)*. **A reconcile rescores a record only on the page it was extracted from, or on a fresh capture of the same file that prints the record's own heading** (`own_heading_kept`, S530). **The hand-filed step** (Sam's ruling 2, 2026-10-17): `kb/hand_filed_catalogs/` and its README. **Reader invariants** (a PDF step naming its file, Coursedog's heading reads, a kept record from its source's page, a page read's vendor hosts; #2213, #2216): lessons, *Moved from the lane (S421 compaction)*. **Sam's go of 2026-10-17 (`sam-trust-procedures-no-per-item-approval-2026-10-17`):** harvest calls proceed on their procedures without a card, and a write the Supabase guard holds goes through `supabase-migrate.yml` (`kb/migrations/.apply`), never to Sam as a paste. **Each wave's colleges, counts and the per-college rescoring history: lessons S406-S415** (moved from the lane, S419). **No record (4):** North Orange Continuing Education, San Jose City (CourseLeaf), Diablo Valley, Santiago Canyon (eLumen). **S452-S457** (the waves, Hartnell's and Sierra's readings, the `meets` reading): lessons archive 3, *Moved from the lane (S474 compaction)*. **A Coursedog catalog reads from its site by default** (`route=pdf` keeps the PDF step for one run, S451). **`step=display` applies the committed build; it never builds one.** Run `kb/_build_roep_display.py` on the wave branch first (needs `openpyxl`), commit its two outputs, then apply on `main` after the merge (S452). ✅ **Sam's standing rule (Open Asks Sheet 118 card 1, 2026-10-23):** the older-build rows each wave leaves behind are removed at each wave with a before-values receipt by the S456 method, no card. Sheet 118 cards 2 and 3 *keep* (Hartnell's Local GE at 23; Cal-GETC 34 on a local degree whose own tab names it). Sam ruled **narrow** on the scorer's `meets` reading (Sheet 120 card 1). Sheet 115 card 1, the S456 and S459 removals and the S459 rescore: lessons archive 3, *Moved from the lane (S474 compaction)*. Display build e021a2824548's apply (S459) and Hartnell's thirteen still failing (S488): lessons, *Moved from the lane (S530 compaction)*. The two S448 offers wait on Sam's word. **Later (Sam, Sheet 112 card 1, 2026-10-22 11:16Z, his own call):** no note goes to Program Mapper's vendor for the 63 colleges' maps for now (`cpl_memory` `sam-sheet-112-program-mapper-later-2026-10-22`). **List the thin colleges live, and look for a shared cause, first** (S442). On screen the reference is **CPL Pathways** (Sam, 2026-10-21). **Parked for the reader** (nine colleges and two record sets; Ventura and Oxnard read in S442): lessons, *Moved from the lane (S421 compaction)*. **A reconcile step for a figure a local degree never carries reads transfer degrees only (`awards: transfer`, S421):** a local degree's captured page can span the sibling transfer section; where the code-kind gate makes a tab one program's (Hartnell), a second step with `awards: associate` reads the local degree's own tab (S456, Sheet 117 card 3). **Verify a reader change on the catalog's own words before any dispatch** (`kb/college_reads/`; a PDF plan takes `pdf_span` and `pdf_after`, S421). **A renumbered course** maps through `course_renumbers` (S423-S424): lessons archive 3, *Moved from the lane (S495 compaction)*.

**The second reader, Grok** (Sheet 97 card 1; built S421, #2246) waits on the xAI billing moving to the RCCD district card and two Edge Function secrets only Sam sets: lessons, *Moved from the lane (S530 compaction)*.

🔨 **The Records view loads by college (S384; Sam, 2026-10-13, `cpl_memory` `sam-records-load-by-college-filter-2026-10-13`).** The cap, the anon timeout and #2088-#2089: lessons, *Moved from the lane (S385 compaction)*. #2090: a light index for every college (about 0.6 MB), full records only for the colleges the filters reach (S390, #2121, Sam 2026-10-14: District, College, SWP Region and CIP Sector dropdowns; the tab opens on Progress and carries no Sierra window), and every attention link (deep link, call cards, Next waiting, the Progress counts) loading its record on demand with nothing picked. **The index reads stored columns** (S405, guard `tests/program_requirements.test.js` 6e): lessons, *Moved from the lane (S411 compaction)*. **NEXT:** read the CIP filter's first live batches (`coci_college_programs`, 150 a read) in `edge_logs`.

Sheet 77 card 3 (#2093, #2097): lessons (S387 compaction).

✅ **Flags and a person's reading are built (S347; Sam, Sheet 51 card 1).** Confirm or Needs a fix writes `program_record_verdicts` through `program_record_verdict_add`; a trigger keeps a person's reading across a reload. Detail: lessons doc, *Moved from the lane (S356 compaction)*.

