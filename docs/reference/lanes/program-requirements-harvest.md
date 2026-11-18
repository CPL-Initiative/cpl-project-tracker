---
title: "Program requirements harvest — lane state"
created: 2026-10-03
updated: 2026-11-18
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

**A refusal is on the college's record (Sam, sheet 29 card 3, revised 2026-10-17; `sam-sheet-29-revised-refusal-workarounds-2026-10-17`).** ⚠️ **Automated reads still name the CPL Initiative in the user agent and still respect blocks and robots.txt.** The paragraph as it stood: lessons, *Moved from the lane (S653 checkpoint)*.

**Sam's ruling (2026-10-04, 11:1xZ, in chat):** *"No need for governance at this
point. Everything is public record and we can mark the tab and contents as beta
draft."* The harvest's tab shows its records without a Governance pass, marked
**Beta draft** (vault braindump
`braindump-2026-10-04-1115-program-requirements-tab-public-record.md`). Then:
*"Integrate Sierra in the tab design."*

**The tab is in COBI** (Beta draft, #1860, `program_requirements.js`; five views: Progress, Catalogs, Sequences, Procedures and the List; no Sierra, Sam 2026-10-14): the paragraph as it stood, lessons, *Moved from the lane (S681 checkpoint)*.

**The List (`#program-requirements/list`):** one row per active COCI program, read only, and the workspace (a program's side panel carries its record's card). The paragraph as it stood: lessons, *Moved from the lane (S680 checkpoint)*.

**Catalog addenda** (`program_source_addenda`; 79 listed at 52 colleges; the eight amending loaded colleges read, S387-S388; the other 71 as the reader reaches their colleges): lessons, S394.

**CPL Pathways reads the ROEP record (Sam, 2026-10-04 ~17:20Z):** every record shows, checked or not, each marked; no record is edited by hand. The paragraph as it stood: lessons, *Moved from the lane (S653 checkpoint)*.

**The display build** (`kb/_build_roep_display.py`) writes each program's facts once, under one build stamp, to `program_requirement_records.display` (Sierra) and `cpl_pathways_roep_data.js` (the page); guard `tests/roep_display_test.py`. Its history (S327-S336): the lessons doc, *Moved from the lane (S346 compaction)*.

**Outcomes (Sam, 2026-10-04):** course and program outcomes beside the harvested credential skills, in `course_outcomes`, read nightly (below); the skills comparison waits for `kb/reference/industry_credential_skills.json` (lessons, S413).

**Course objectives, collected with every SLO read (Sam, 2026-11-02; `sam-data-collection-six-asks-2026-11-13`):** filed as `course_outcomes.kind` `objective`, one host at a time, never replacing an SLO row; the `objectives_reread_plan` has no step left since Golden West (S680). **PITFALL:** an objectives `.load` is written by hand. The paragraph as it stood: lessons, *Moved from the lane (S680 checkpoint)*.

**The nightly SLO read (Sam, 2026-11-01):** step 11 of [`scheduled_sessions`](../scheduled_sessions.md), pages only, no cost; De Anza and College of Marin held. The paragraph as it stood: lessons, *Moved from the lane (S647, Sheet 191)*. **Next:** the day's full read and preparation run, as `--next` names them. **S681:** Allan Hancock 1,772 rows (run 44285436479) and Santiago Canyon 498 (run 44285667921) loaded; Chabot's 1,013 loaded and rolled back (migrate run 44292682081, 0 Chabot rows live, 30,321 in all), its objectives filed as SLOs (`m-chabot-load-rolled-back-s681`). **PITFALL** `p-outcome-load-without-standing-test-s681`: run `tests/course_outcomes_objectives_standing_test.py` on the branch before pushing `.load`.

**The Cerritos Ironworker proof of concept, the page reader (`kb/_college_page_read.py`) and one procedure record per college** (`program_source_procedure_set`): lessons, *Moved from the lane (S668 checkpoint)*.

✅ **Sheets 38, 39 and 42's rulings, the Progress view (S343, #1900, its status file written at step 12) and the older NEXT** (Schedule+ for Spring 2027, the film, the addenda reading agent, SkyView ROEP): lessons, *Moved from the lane (S653 checkpoint)*.

🔨 **Phase 2, a college at a time:** the load, the display and the $40 go: lessons archive 4, *Moved from the lane (S648, Glendale loaded)*.

🔨 **The reconcile pass (S392; `sam-reconcile-pass-after-harvest-2026-10-14`):** `kb/_program_requirements_reconcile.py` applies each college's steps (`kb/program_requirements_reconcile.json`) at extraction and on filed records (`step=reconcile`, no model call). The paragraph as it stood: lessons, *Moved from the lane (S647)*.

🔨 **Sam's rulings of 2026-11-17 (#3461, final; [`sam_rulings`](../sam_rulings.md)), carried out in #3478 and applied by run 44224714543 (S679; 243 records; rollback committed, NOT applied: `kb/migrations/2026-11-18_s679_prreq_rescore_rollback.sql`).** The general education open slot stays OFF behind `GE_AREA_SLOT_FILL` until its self-recall run (NEXT (8)). The paragraph as it stood: lessons, *Moved from the lane (S680 checkpoint)*.

**Parked, displayed or standing as filed earlier** (Los Angeles Valley and Los Medanos parked; eleven colleges, Monterey Peninsula to Butte; Redwoods and De Anza open, their NEXT is (8) below; a choose-courses list's printed units are its floor, Sheet 144 card 2): lessons, *Moved from the lane (S644)*. **A refused read follows [`blocked_sources`](../blocked_sources.md) before any card.**

**Decisions of S639 that stand:** `d-lacc-heading-minimum-60-s639`, `d-occ-up-to-ge-maximum-s639`, `d-hours-meets-top-term-length-s639`, `d-rio-hondo-cal-getc-areas-count-s639`, `d-west-valley-cal-getc-areas-count-s639` (Sam's go of 2026-11-11: lessons, *Moved from the lane (S668 checkpoint)*).
**Running a college:** `program-requirements-college.yml` (`college`, `extract` default `1`, so leaving it out spends; `limit`, `step`, `force` adds programs and never limits; `route`). A run files to the branch it ran on: a paid run goes on the college's branch, never `ref main`.
**Standing decisions of S640 and S641, throughput (S644-S647) and the gap census** (`d-passes-live-stays-equal-only-s644` stands): lessons archive 4, *Moved from the lane (S648 checkpoint)*.
**A wave** (`program-requirements-wave.yml`, #3191): up to eight colleges on distinct hosts, one branch, one PR, one filing job, no table written (lessons, *Running a wave*). **DECIDED** `d-wave-one-branch-hard-stop-s644`, `d-wave-price-rate-floor-s644`.
**The display apply runs live (#3190, #3204):** `step=display` writes the whole build the page carries, `display_college` one college; `d-display-first-run-one-college-s645`, `d-merge-is-publication-spot-check-first-s645` and `d-display-missing-threshold-s644` stand. The paragraph as it stood: lessons, *Moved from the lane (S680 checkpoint)*.

**No display receipt is committed (S680, #3495).** A session runs `kb/_build_roep_display.py` on a branch and commits the page alone; `step=display` rebuilds the receipt on the runner, stores it in the private bucket `cpl-receipts`, files its index entry under `kb/receipts/index/` and only then applies it. Re-apply, fetch and the limits: [repo-size](repo-size.md). The paragraph as it stood: lessons, *Moved from the lane (S680 checkpoint)*. **First run through the bucket (S681, `m-display-build-through-bucket-s681`):** run 44286209178, build `545de21a6edc`, 18,209 planned and written, 0 errors; the prior build `f0f1ee88c04f` is the rollback.
**Standing from S645 to S648** (the #3193 rescore, the PDF reader, Desert, Glendale, district profiles): lessons, *Moved from the lane (S680 checkpoint)*.
**Headline:** the run log, `kb/status/program-requirements.json`; Sam's rulings of 2026-11-13 stand (`sam-headline-counts-own-list-2026-11-13`): the paragraph as it stood, lessons, *Moved from the lane (S681 checkpoint)*.
**Standing from S648 to S651** (Cal-GETC 34, #3244; Sheet 195's rulings; Cosumnes River, #3288; Lassen, #3291; Sam's `sam-three-colleges-rules-first-2026-11-13` and `sam-noncredit-total-hours-2026-11-13`): every DECIDED slug and pitfall, lessons, *Moved from the lane (S652 final refresh)*.

**Catalog-first collection (Sam's go, 2026-11-14; `sam-catalog-first-collection-2026-11-14`, `d-catalog-first-slice-order-s652`):** the paragraph as it stood, lessons, *Moved from the lane (S681 checkpoint)*.

**Slice C, prefix aliases (#3301), and the course-id route (#3312, S653):** `d-prefix-alias-evidence-rule-s652`, `d-crsid-seven-retire-ten-stay-s653` and **PITFALL** `p-mis-codes-carry-record-id-suffix-s652` stand. The paragraph as it stood: lessons, *Moved from the lane (S681 checkpoint)*.

**The course-id rescore at six colleges (#3352, S655)** is done, display build `58b763170559` live: lessons, *Moved from the lane (S668 checkpoint)*.

**A GE-pattern page has one owner (#3324, S654):** every DECIDED slug and the paragraph as it stood, lessons, *Moved from the lane (S670 checkpoint)*.

**Slice A, the no-closed-list lookup (#3300; `ncl_lookup`, default 1) and the page yield (#3408, S668; `d-ncl-page-yield-s668`)** stand; **PITFALL** `p-new-matcher-needs-self-recall-test-s652`; **PROCEDURE** `p-yield-holder-live-row-after-filing-s668`. The paragraph as it stood: lessons, *Moved from the lane (S680 checkpoint)*.

**The extraction gate and one spend meter** (`d-extraction-gate-every-run-s653`, `d-one-spend-meter-s654`; `kb/_spend_meter.py` holds the $40 stop): the paragraph as it stood, lessons, *Moved from the lane (S680 checkpoint)*.

**Slice B** (the completeness base counts catalog-listed Active programs; #3414's `NCL_EXTRACT`, default off; `d-no-list-record-scored-without-state-list-s668`, `d-named-course-minimum-one-s667`): the paragraph as it stood, lessons, *Moved from the lane (S681 checkpoint)*.

**The passing dry run (draft #3293, head `cb60a1b0`; nothing applied; `d-passing-dry-run-held-for-cobix-s651` stands):** COBIx has not answered in four days; a plain session decides without him (NEXT (6)). The paragraph as it stood: lessons, *Moved from the lane (S680 checkpoint)*.

**The display's gaps as structured fields** ([`reference/roep_display_structured_fields_design`](../roep_display_structured_fields_design.md), #3296): the paragraph as it stood, `docs/program_requirements_harvest_lessons.md`, *Moved from the lane (S667 checkpoint)*; the structured-fields migration's step 1 is NEXT (6).

**Cheap piles (S680 and S681, the CPL Queue routine's conductor nights of 2026-11-18; Sam, relayed by COBIx on #3358: *"my priority is completion and will find the funding to make it happen"*, *"Yes, run both tonight with separate colleges"*).** Two lanes, never on one college. **DECIDED** `d-lane-names-only-colleges-in-flight-s681`: the collection lane names a college only while a run is in flight there (Crafton Hills and College of the Siskiyous left it at 10:51Z, before any write; S680's named-gaps plan holds a Siskiyous row). `main`'s `kb/collection_lane.py` still reads `COLLECTION_LANE_S680` (twelve); #3508 carries five (Lassen, Cosumnes River, Allan Hancock, Chabot, Santiago Canyon), `RELEASED` seven, the old name an alias for one run. **Collect with gaps (Sam, in paraphrase):** never drop a record for failing; collect it with gaps noted and a confidence score; report records collected and confidence gained, never "newly passing". **Live:** #3491's 9 discontinued flags; #3496's units rules on 56 records (rollbacks committed, NOT applied; `d-units-rule-a6-off-s680`, `f-miracosta-21976-live-newer-run-s680`); #3497's first named-gaps apply, 75 rows (run 44273638344), its rollback rebuilt from the 75 returned rows (`kb/migrations/2026-11-18_s680_prreq_named_gaps_rollback.sql`, not applied). `kb/_guarded_sql.py` is the one shape for every apply and rollback; `d-paid-rereads-need-aimed-input-s680` stands. **Reviewed, NOT applied (the stop rule, S681):** (a) **#3497's 99-row plan** (head `d7a205f4`; `kb/migrations/2026-11-18_s681_prreq_named_gaps_{preread,apply,rollback}.sql`, receipt `kb/receipts/program_requirement_records_named_gaps_2026-11-18_s681.json`): A, 73 rows correcting the first apply (`no_hours_read` 52, `no_units_read` 21); B, 21 of #3502's records, `catalog_figures_differ`, unit arithmetic 50; C, the five A5 rows at unit arithmetic 56 with a note (**DECIDED** `d-a5-rows-confidence-56-s681`). **DECIDED** `d-named-gap-labels-corrected-s681`: an hours-measured program takes `no_hours_read`; `ge_pattern` None with no degree total; a may-continue note caps `course_list_match` at 50 by an explicit list of three reviewed records (Fullerton 18166, Santa Ana 34014, Taft 31290), since the matcher had no self-recall; 33 records held out (16 "no units printed", 17 failing the strict sentence check), listed in the receipt. **DECIDED** `d-census-order-s681`: passing, then discontinued, then collected with a named gap, then the piles. Second reader, round two: apply, merge. Undo order: this plan's rollback first, then S680's named-gaps and units-rules rollbacks (each aborts out of order). (b) **#3508's 13-row corrective write** (head `3d6dca1d`; `kb/migrations/2026-11-18_s681_prreq_units_rules_{preread,apply_rows,rollback_rows}.sql`): **DECIDED** `d-a4-pair-members-carry-state-units-s681`: a member of a paired group carries the state course file's units when the file holds every member and they add to the row's units or fall in its printed range; otherwise the group carries `together_units`; `A5_ON = False`; a write names `--college`, `--released` or `--everywhere`. Twelve S680 rows and Coastline 18223; totals and pass states do not change. **PITFALL** `p-self-check-on-totals-misses-per-course-units-s681`: A4 scored 74 of 74 on totals while writing wrong per-course units. The S680 paragraph as it stood: lessons, *Moved from the lane (S681 checkpoint)*.

**NEXT, in order:** (0) The RCCD pilot (#3438, S671; `d-rccd-pilot-no-blind-force-s671`) stands: never force a re-extraction blind, read the failing pages for free first. (1) **The next display build**, after #3497's and #3508's writes land, or at the next session's start for Lassen's five (build `545de21a6edc` ran from `main` before their records landed, so their `display` comes from the older files): on a branch, `kb/_build_roep_display.py`, commit only `cpl_pathways_roep_data.js`, then `step=display`. (2) Cheap piles: #3497's 99-row plan (pre-read, apply, rollback rebuilt from the returned rows, merge); the 33 held-out records read free (Cuesta 32562, De Anza 41861 and 41863 add to the top of a printed range; the strict check stays for now); #3508 after the second reader's findings 1 (`paired_group` takes a sum anywhere in the range, so seven true "or" groups read as pairs, College of the Desert AGEH 095A and AIS 095A: allow the range only when no note says "or", and score the pair call against the record notes) and 2 (Long Beach City 44747: BIO 60L carries 4, the state 1), with the display readers of `together` (Sierra `cpl-chat/index.ts`, CPL Pathways `cpl_pathways.js`; finding 3, a plain session) landing with the write; finding 4, 25 single "or" alternatives that carry their row's units; the named gaps at the seven released colleges through the corrected mechanism; A5's 31 wrong answers by cause (not started). (3) Step 11 ([`scheduled_sessions`](../scheduled_sessions.md)): **Chabot (#3492)** read again with the fixed reader (a new `run=` date in `.run`), the standing test on the branch before `.load`, both kinds loaded, then merge; after a merge `main`'s `.load` reads `host=chabot`, so the re-read's load changes a line in it. The second reader's four MINORs on the fixed reader (none occurs at Chabot) and three Allan Hancock rows that look like course content: lessons, *S681*. Then Crafton Hills (index) and College of the Siskiyous (trial); the helper on the wave: done 24, held 4, index 5, none 6, skip 80, trial 1. A plain session adds the standing test to `course-outcomes-load.yml` before its load step. (4) Lassen (#3499, landed in wave #3509, `main` 5ed58e42): reread run 44263840460 replaced 5 rows; 33729 and 33730 pass, 31132 and 42300 count 58 of 60 and 33263 54 of 60, each collected with the named gap (`f-lassen-five-records-s681`); 31297, 35106 and 41912 held (`hold` in `kb/program_requirements_reconcile.json`). Done but the structured-fields migration's step 1, Lassen first. (5) Cosumnes River (#3500): four clean pins (11338, 04607, 11319, 07305); the paid read waits on a named-programs-only input. (6) #3293: decide without COBIx in a plain session (drop the own-list part, rerun the dry run on `main`). (7) #3502's reader changes, cheapest first (A10 with a sibling, 38 records, $3.84; the wider page window, 94, $9.67; aimed lists, 260 at 74 colleges, $26.20), each priced before its run; the two changed-page records ($0.20: Berkeley City 31984, Los Angeles Pierce 32620) with them. (8) Ruling 3's self-recall run: the general education slot on captured pages with `CPL_GE_AREA_SLOT_FILL=1`, committed and reviewed, then a PR sets the default on. (9) The `NCL_EXTRACT` switch waits on the Commons sidecars holding `no_state_list` records back; then #3414's refusal probe covers both, with the minor (`errors` counts no-list records) and COBIx's #3408 nit. (10) The teach-out rule (#3491), after a runner capture. (11) Los Medanos's and Los Angeles Valley's program rules, with a person. (12) Confirm the harvest card shows #3465's `spent_usd`, then strike this item. Older lists: lessons, S653 and S666.
🔨 **The catalog sweep (S394-S414):** its standing rules: lessons, *Moved from the lane (S648)*.

**Grok (waits on billing), the light index, flags:** lessons archive 5, *Moved from the lane (S645)*.
