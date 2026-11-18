---
title: "Program requirements harvest — lane state"
created: 2026-10-03
updated: 2026-11-17
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

**The tab is in COBI** (Beta draft, #1860, Reference & Curation): `program_requirements.js` ports the approved mock-up ([v3](https://claude.ai/artifact/DkfRYLpyusuqYy6ErqQe6f), Sam: *"mock up looks good"*) and reads `program_source_registry` and `program_requirement_records` live. Five views: Progress, Catalogs, Sequences, Procedures (each college's procedure record) and the List; no Sierra (Sam, 2026-10-14, guard `(4b)`). Two early notes (the unscoped surface, Cerritos's Ironworker): lessons, *Moved from the lane (S542 compaction)*.

**The List (2026-11-01, `#program-requirements/list`):** one row per active COCI program (20,282), read only, and the workspace: a program's side panel carries its record's card and drafts the message to the college; program records retired into it (SkyLoquat, 2026-11-04). Guards `tests/program_requirements_list.test.js`, `tests/program_requirements_list_panel.test.js`, `tests/program_requirements_list_record_port.test.js` and `tests/program_requirements.test.js`. The paragraph as it stood: lessons, *Moved from the lane (S639 side session)*.

**Catalog addenda** (`program_source_addenda`; 79 listed at 52 colleges; the eight amending loaded colleges read, S387-S388; the other 71 as the reader reaches their colleges): lessons, S394.

**CPL Pathways reads the ROEP record (Sam, 2026-10-04 ~17:20Z):** every record shows, checked or not, each marked; no record is edited by hand. The paragraph as it stood: lessons, *Moved from the lane (S653 checkpoint)*.

**The display build** (`kb/_build_roep_display.py`) writes each program's facts once, under one build stamp, to `program_requirement_records.display` (Sierra) and `cpl_pathways_roep_data.js` (the page); guard `tests/roep_display_test.py`. Its history (S327-S336): the lessons doc, *Moved from the lane (S346 compaction)*.

**Outcomes (Sam, 2026-10-04):** course and program outcomes beside the harvested credential skills, in `course_outcomes`, read nightly (below); the skills comparison waits for `kb/reference/industry_credential_skills.json` (lessons, S413).

**Course objectives, collected with every SLO read (Sam, 2026-11-02; `sam-data-collection-six-asks-2026-11-13`):** filed as `course_outcomes.kind` `objective` (`kb/_objectives_by_system.py`; guard `tests/course_outcomes_objectives_standing_test.py`). **DECIDED** `d-objectives-reread-order-s649` (one host at a time, never replacing an SLO row; [plan](../../../kb/course_outcomes/objectives_reread_plan.json)), `d-contra-costa-commented-objectives-unread-s649`, `d-chaffey-objectives-only-read-next-s649`, `d-rccd-objectives-loaded-s649`, `d-sdccd-objectives-loaded-s651`. De Anza and Marin held. **PITFALL:** an objectives `.load` is written by hand. As it stood: lessons, *Moved from the lane (S652 checkpoint)*. Santa Ana (load 43684986821, 1,362 rows), Las Positas (#3386, load 43825849738, 776 rows) and Coastline (#3420, load 44006629705, 522 rows) are loaded. **DECIDED** `d-outcomes-slice-keys-college-set-s670`: the loader keeps one slice per college set, part and split, and a college re-read in a different number of parts drops its older split (`read_files`; checks 19 of the objectives test and 9 of `course_outcomes_load_test.py`). Before it, Coastline's new slices would have replaced Golden West's in an unfiltered `cccd` load. No row was lost: the load only inserts (COBIx on #3420). **NEXT:** Golden West (`cccd`, plan step 1). The S664 and S665 lead-in and heading fixes are done (`d-laspositas-lead-fix-in-place-s664`, `d-goldenwest-subhead-fix-in-place-s665`): lessons, *Moved from the lane (S668 checkpoint)*.

**The nightly SLO read (Sam, 2026-11-01):** step 11 of [`scheduled_sessions`](../scheduled_sessions.md), pages only, no cost; De Anza and College of Marin held. The paragraph as it stood: lessons, *Moved from the lane (S647, Sheet 191)*. **Next:** the day's full read and preparation run, as `--next` names them.

**The Cerritos Ironworker proof of concept, the page reader (`kb/_college_page_read.py`) and one procedure record per college** (`program_source_procedure_set`): lessons, *Moved from the lane (S668 checkpoint)*.

✅ **Sheets 38, 39 and 42's rulings, the Progress view (S343, #1900, its status file written at step 12) and the older NEXT** (Schedule+ for Spring 2027, the film, the addenda reading agent, SkyView ROEP): lessons, *Moved from the lane (S653 checkpoint)*.

🔨 **Phase 2, a college at a time:** the load, the display and the $40 go: lessons archive 4, *Moved from the lane (S648, Glendale loaded)*.

🔨 **The reconcile pass (S392; `sam-reconcile-pass-after-harvest-2026-10-14`):** `kb/_program_requirements_reconcile.py` applies each college's steps (`kb/program_requirements_reconcile.json`) at extraction and on filed records (`step=reconcile`, no model call). The paragraph as it stood: lessons, *Moved from the lane (S647)*.

**Parked, displayed or standing as filed earlier** (Los Angeles Valley and Los Medanos parked; eleven colleges, Monterey Peninsula to Butte; Redwoods and De Anza open, their NEXT is (8) below; a choose-courses list's printed units are its floor, Sheet 144 card 2): lessons, *Moved from the lane (S644)*. **A refused read follows [`blocked_sources`](../blocked_sources.md) before any card.**

**Decisions of S639 that stand:** `d-lacc-heading-minimum-60-s639`, `d-occ-up-to-ge-maximum-s639`, `d-hours-meets-top-term-length-s639`, `d-rio-hondo-cal-getc-areas-count-s639`, `d-west-valley-cal-getc-areas-count-s639` (Sam's go of 2026-11-11: lessons, *Moved from the lane (S668 checkpoint)*).
**Running a college:** `program-requirements-college.yml` (`college`, `extract` default `1`, so leaving it out spends; `limit`, `step`, `force` adds programs and never limits; `route`). A run files to the branch it ran on: a paid run goes on the college's branch, never `ref main`.
**Standing decisions of S640 and S641, throughput (S644-S647) and the gap census** (`d-passes-live-stays-equal-only-s644` stands): lessons archive 4, *Moved from the lane (S648 checkpoint)*.
**A wave** (`program-requirements-wave.yml`, #3191): up to eight colleges on distinct hosts, one branch, one PR, one filing job, no table written (lessons, *Running a wave*). **DECIDED** `d-wave-one-branch-hard-stop-s644`, `d-wave-price-rate-floor-s644`.
**The display apply runs live (#3190, #3204).** `step=display` writes the whole committed build; `display_college` runs one college. First runs and live counts: lessons, *Running a display, one college first (S645)*. **DECIDED (`d-display-first-run-one-college-s645`):** a new apply's first live run goes out on one college, the whole build after its record is confirmed. **DECIDED (`d-merge-is-publication-spot-check-first-s645`):** merging a college PR publishes its display build, so COBIx's five-record spot-check comes before the merge. `d-display-missing-threshold-s644` stands.
**Standing from S645 to S648** (the #3193 rescore, the PDF reader, Desert #3240, Glendale #3202, district profiles #3198; COBIx: run 43421133593's artifact must never be reposted for Desert 10195): every DECIDED slug and the paragraph as it stood, lessons, *Moved from the lane (S653 checkpoint)*.
**Headline:** the run log, `kb/status/program-requirements.json`. Sam's rulings of 2026-11-13 stand (the display go at every college, Cal-GETC 34, the 503 change, and `sam-headline-counts-own-list-2026-11-13`): the paragraph as it stood, lessons, *Moved from the lane (S648 checkpoint)*. The 503 change is merged and deployed (#3227); its post-deploy checks: lessons, *Moved from the lane (S649 final refresh)*.
**Standing from S648 to S651** (Cal-GETC 34, #3244; Sheet 195's rulings; Cosumnes River, #3288; Lassen, #3291; Sam's `sam-three-colleges-rules-first-2026-11-13` and `sam-noncredit-total-hours-2026-11-13`): every DECIDED slug and pitfall, lessons, *Moved from the lane (S652 final refresh)*.

**Catalog-first collection (Sam's go, 2026-11-14, relayed by COBIx on #3299; `sam-catalog-first-collection-2026-11-14`):** *"nothing stops the collection bus from rolling."* **DECIDED** `d-catalog-first-slice-order-s652`: slices C, then A, then B. Slice B's four guards (#3299, comment 6877610924): each not-listed records its basis; the headline shows both bases side by side; a chipped program with awards in the last three years says so on the chip; `page_claimed` and `not_found` on closed-list programs stay in Still to pass until the second look has run for that college. Sam's four steps: lessons, *Moved from the lane (S654 checkpoint)*.

**Slice C, prefix aliases (#3301), and the course-id route (#3312, S653).** `d-prefix-alias-evidence-rule-s652` and `d-crsid-seven-retire-ten-stay-s653` stand: the prefix comes from the Program Course File's course id first (`kb/_course_id_route.py`), 7 pairs retire and 10 stay; Crafton Hills, Moreno Valley and Norco keep theirs (COCI carries HIS, never HIST). At the next reread of American River and Santiago Canyon, check for BMET and PASV codes that show up as invented. **PITFALL** `p-mis-codes-carry-record-id-suffix-s652`: ENGL304-2507 reads as ENGL 304. The paragraph as it stood: lessons, *Moved from the lane (S654 checkpoint)*.

**The course-id rescore at six colleges (#3352, S655)** is done, display build `58b763170559` live: lessons, *Moved from the lane (S668 checkpoint)*.

**A GE-pattern page has one owner (#3324, S654):** every DECIDED slug and the paragraph as it stood, lessons, *Moved from the lane (S670 checkpoint)*.

**Slice A, the no-closed-list lookup (#3300; `ncl_lookup` in `kb/_program_requirements_college.py`, default 1; census `kb/_harvest_ncl_lookup_census.py`; `d-ncl-lookup-not-listed-needs-catalog-list-s652`).** **PITFALL** `p-new-matcher-needs-self-recall-test-s652` ([note](../../kb-notes/methodology-a-new-matcher-is-gated-by-a-self-recall-test.md)). **The page yield (#3408 `929e1e6c`, S668; `d-ncl-page-yield-s668`):** a no-list program whose only match is a page held by exactly one closed-list program, under a heading that does not name the holder, takes the page when the holder's filed record, read from that page in the lookup's catalog year, fails `passes_live`; a passing holder keeps its page wherever read. A yield persists in `capture.json`'s `catalog_lookup.yields` with its `catalog_year` and lapses in another year. S668's census: 13 yields at 8 colleges (holders Cabrillo 20410, Chaffey 18435, College of San Mateo 32203, Crafton Hills 11766, Feather River 36176, Gavilan 21284, 33048, 45720 and 46046, Lemoore 10954 and 19305, Skyline 32337 and 46296), 0 passing moved, 7 refused passing; 9 still yield (S676 and S677 resolved 36176, 46046, 19305 and 18435); Contra Costa 31021 and Foothill 06104 and 45656 sit under the self-test floor. **PROCEDURE** `p-yield-holder-live-row-after-filing-s668`: a holder's live row comes out with a receipt only after its college's filing drops the record (the load is insert-only, so an earlier removal lets a later load reinsert it). The paragraph as it stood: lessons, *Moved from the lane (S668 checkpoint)*.

**The extraction gate and one spend meter (S653 to S655).** `d-extraction-gate-every-run-s653` and **DECIDED** `d-one-spend-meter-s654` stand: `kb/_spend_meter.py` prices usage and holds the $40 stop for the pilot, the college workflow and the second reader; `X.CALL_MAX_USD` $1.55, recomputed by `tests/model_run_gates_test.py`. Card 10's three callers: the [governance lane](governance-team-enablement.md). The paragraph as it stood: lessons, *Moved from the lane (S668 checkpoint)*.

**Slice B** (the completeness base counts catalog-listed Active programs; COCI-only rows get a chip). **RULED (Sam, Sheet 197 card 4, 14:38Z 2026-11-14):** *"go"*, with the four guards; the lookup runs at each college first; COBIx answered the empty-heading question (found, with a named-course minimum the conductor sets first). **Part 1, #3414** (`claude/slice-b-ncl-extract-s668`, head `7f4e8613`; second reader: merge): extracts a found no-list program's page behind `NCL_EXTRACT`, default off, which stays off until the display build (S669, `claude/s669-adopt-chip`) and the Commons sidecars both hold `no_state_list` records back; Edge Function `program-requirements-extract` v13 takes an empty list only with `no_state_list: true`; minor carried: `errors` still counts no-list records. **DECIDED** `d-no-list-record-scored-without-state-list-s668`: such a record scores coverage and invented as `no_state_list`, never counts as passing, and the load holds it until the tab shows it; extraction needs at least one named course (`d-named-course-minimum-one-s667`).

**The passing dry run (draft #3293, head `cb60a1b0`; nothing applied; `d-passing-dry-run-held-for-cobix-s651` stands):** COBIx has not reviewed it; it folds in after slice A's first captures, then one migration and one rescore. The paragraph with the electives-fill census (#3297): lessons, *Moved from the lane (S653 checkpoint)*.

**The display's gaps as structured fields** ([`reference/roep_display_structured_fields_design`](../roep_display_structured_fields_design.md), #3296): the paragraph as it stood, `docs/program_requirements_harvest_lessons.md`, *Moved from the lane (S667 checkpoint)*; the structured-fields migration's step 1 is NEXT (6).

**NEXT, in order:** (0) The repeated-course-row lever and the RCCD and Butte items S672 to S675 settled: lessons, *Moved from the lane (S676 checkpoint)*. The RCCD pilot (#3438, S671; `d-rccd-pilot-no-blind-force-s671`) stands: never force a re-extraction blind, read the failing pages for free first. (1) Step 11 (UTC Nov 18): Golden West's objectives reread is the full read (`cccd`, a new branch `claude/slo-objectives-golden-west`), and Diablo Valley (#3421, trial 43984100155 parsed 11 of 12) moves to its full read on another day, one host a day; College of the Redwoods (#3387) and Allan Hancock (#3284) wait their turn. (2) The curriQunet prior reads are done: Gavilan (#3411), Butte (#3426), Rio Hondo 32258 (#3433, reread 44007311695) and Santa Ana 32062 and 32989 (#3434, reread 44007316281), each passing on its own 2025-2026 catalog. **DECIDED** `d-bcc-41778-keeps-current-s668` (row applied, #3435): Berkeley City 41778 keeps `main`'s passing record (it passes, degree 60 of 60, S675). (3) Slice B is done at seven colleges: Skyline (#3423, #3436); Cabrillo, College of San Mateo, Crafton Hills, Feather River, Gavilan and Lemoore (S676, #3456, display build 71b67268c567, passing +22); Chaffey (S677, #3462: read 44090894573, reread 44168346810 replaced 13 unchecked rows, load 44169840117 kept 191, display build cdd185495ce4; passing 181 to 182 of 192). **DECIDED** `d-slice-b-six-no-live-holder-rows-s676`: none of the six colleges' 14 dropped records held a live row. **DECIDED** `d-chaffey-18435-not-found-no-live-row-s677`: Chaffey's fresh capture files Physical Science 18435 under `not_found` (it had been read from the Cal-GETC page), so S668's yield 18435 to 45032 is gone (`RESOLVED_BY_NOT_FOUND_S677` in the census test); neither holds a live row, so no delete. **FACT** `f-skyline-self-test-miss-38299-pace-s677`: the self-test's one miss, rebuilt from committed sources, is Skyline 38299 PACE, Certificate of Achievement, not matched against its own page; recall reads 26 of 28, above the floor. The `NCL_EXTRACT` switch waits on the Commons sidecars holding `no_state_list` records back (the display build does, since #3424); then #3414's refusal probe covers both, and the minor (`errors` counts no-list records) and COBIx's #3408 nit (`ncl_filed_yields`' return annotation) ride along. (4) #3293 (keep; waits COBIx and slice A's captures); Cosumnes River's seven follow it. (5) Lassen: a capture pinned to main's pages for 31132, 33263, 33729, 33730 and 42300, then the `set` step with a per-record hold; the structured-fields migration's step 1, Lassen first. (6) Los Medanos and Los Angeles Valley, their rules first, with a person. (7) done (S678, #3465 `7dc362df`): the Commons statewide figures carry `spent_usd` and `spent_runs`, from the read receipts' `cost_usd_run`, beside `cost_usd` ([commons](commons.md)). The standing list: lessons, *Moved from the lane (S653 checkpoint)*, the S652 NEXT line; the course-id rescore's 315 moved rows and the reconcile reader gaps: lessons, *Moved from the lane (S666 checkpoint)*. Monterey Peninsula's three reloaded records (#3399) reach the tab with the next display build.
🔨 **The catalog sweep (S394-S414):** its standing rules: lessons, *Moved from the lane (S648)*.

**Grok (waits on billing), the light index, flags:** lessons archive 5, *Moved from the lane (S645)*.
