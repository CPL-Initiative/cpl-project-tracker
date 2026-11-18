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

**The tab is in COBI** (Beta draft, #1860, Reference & Curation): `program_requirements.js` ports the approved mock-up ([v3](https://claude.ai/artifact/DkfRYLpyusuqYy6ErqQe6f), Sam: *"mock up looks good"*) and reads `program_source_registry` and `program_requirement_records` live. Five views: Progress, Catalogs, Sequences, Procedures (each college's procedure record) and the List; no Sierra (Sam, 2026-10-14, guard `(4b)`). Two early notes (the unscoped surface, Cerritos's Ironworker): lessons, *Moved from the lane (S542 compaction)*.

**The List (`#program-requirements/list`):** one row per active COCI program, read only, and the workspace (a program's side panel carries its record's card). The paragraph as it stood: lessons, *Moved from the lane (S680 checkpoint)*.

**Catalog addenda** (`program_source_addenda`; 79 listed at 52 colleges; the eight amending loaded colleges read, S387-S388; the other 71 as the reader reaches their colleges): lessons, S394.

**CPL Pathways reads the ROEP record (Sam, 2026-10-04 ~17:20Z):** every record shows, checked or not, each marked; no record is edited by hand. The paragraph as it stood: lessons, *Moved from the lane (S653 checkpoint)*.

**The display build** (`kb/_build_roep_display.py`) writes each program's facts once, under one build stamp, to `program_requirement_records.display` (Sierra) and `cpl_pathways_roep_data.js` (the page); guard `tests/roep_display_test.py`. Its history (S327-S336): the lessons doc, *Moved from the lane (S346 compaction)*.

**Outcomes (Sam, 2026-10-04):** course and program outcomes beside the harvested credential skills, in `course_outcomes`, read nightly (below); the skills comparison waits for `kb/reference/industry_credential_skills.json` (lessons, S413).

**Course objectives, collected with every SLO read (Sam, 2026-11-02; `sam-data-collection-six-asks-2026-11-13`):** filed as `course_outcomes.kind` `objective`, one host at a time, never replacing an SLO row; the `objectives_reread_plan` has no step left since Golden West (S680). **PITFALL:** an objectives `.load` is written by hand. The paragraph as it stood: lessons, *Moved from the lane (S680 checkpoint)*.

**The nightly SLO read (Sam, 2026-11-01):** step 11 of [`scheduled_sessions`](../scheduled_sessions.md), pages only, no cost; De Anza and College of Marin held. The paragraph as it stood: lessons, *Moved from the lane (S647, Sheet 191)*. **Next:** the day's full read and preparation run, as `--next` names them.

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
**The display apply runs live (#3190, #3204).** `step=display` writes the whole build the page carries; `display_college` runs one college. First runs and live counts: lessons, *Running a display, one college first (S645)*. **DECIDED (`d-display-first-run-one-college-s645`):** a new apply's first live run goes out on one college, the whole build after its record is confirmed. **DECIDED (`d-merge-is-publication-spot-check-first-s645`):** merging a college PR publishes its display build, so COBIx's five-record spot-check comes before the merge. `d-display-missing-threshold-s644` stands.

**No display receipt is committed (S680, #3495).** A session runs `kb/_build_roep_display.py` on a branch and commits the page alone; `step=display` rebuilds the receipt on the runner, stores it in the private bucket `cpl-receipts`, files its index entry under `kb/receipts/index/` and only then applies it. Re-apply, fetch and the limits: [repo-size](repo-size.md). The paragraph as it stood: lessons, *Moved from the lane (S680 checkpoint)*.
**Standing from S645 to S648** (the #3193 rescore, the PDF reader, Desert #3240, Glendale #3202, district profiles #3198; COBIx: run 43421133593's artifact must never be reposted for Desert 10195): every DECIDED slug and the paragraph as it stood, lessons, *Moved from the lane (S653 checkpoint)*.
**Headline:** the run log, `kb/status/program-requirements.json`. Sam's rulings of 2026-11-13 stand (the display go at every college, Cal-GETC 34, the 503 change, and `sam-headline-counts-own-list-2026-11-13`): the paragraph as it stood, lessons, *Moved from the lane (S648 checkpoint)*. The 503 change is merged and deployed (#3227); its post-deploy checks: lessons, *Moved from the lane (S649 final refresh)*.
**Standing from S648 to S651** (Cal-GETC 34, #3244; Sheet 195's rulings; Cosumnes River, #3288; Lassen, #3291; Sam's `sam-three-colleges-rules-first-2026-11-13` and `sam-noncredit-total-hours-2026-11-13`): every DECIDED slug and pitfall, lessons, *Moved from the lane (S652 final refresh)*.

**Catalog-first collection (Sam's go, 2026-11-14, relayed by COBIx on #3299; `sam-catalog-first-collection-2026-11-14`):** *"nothing stops the collection bus from rolling."* **DECIDED** `d-catalog-first-slice-order-s652`: slices C, then A, then B, with slice B's four guards (#3299). The paragraph as it stood: lessons, *Moved from the lane (S679 checkpoint)*.

**Slice C, prefix aliases (#3301), and the course-id route (#3312, S653).** `d-prefix-alias-evidence-rule-s652` and `d-crsid-seven-retire-ten-stay-s653` stand: the prefix comes from the Program Course File's course id first (`kb/_course_id_route.py`), 7 pairs retire and 10 stay; Crafton Hills, Moreno Valley and Norco keep theirs (COCI carries HIS, never HIST). At the next reread of American River and Santiago Canyon, check for BMET and PASV codes that show up as invented. **PITFALL** `p-mis-codes-carry-record-id-suffix-s652`: ENGL304-2507 reads as ENGL 304. The paragraph as it stood: lessons, *Moved from the lane (S654 checkpoint)*.

**The course-id rescore at six colleges (#3352, S655)** is done, display build `58b763170559` live: lessons, *Moved from the lane (S668 checkpoint)*.

**A GE-pattern page has one owner (#3324, S654):** every DECIDED slug and the paragraph as it stood, lessons, *Moved from the lane (S670 checkpoint)*.

**Slice A, the no-closed-list lookup (#3300; `ncl_lookup`, default 1) and the page yield (#3408, S668; `d-ncl-page-yield-s668`)** stand; **PITFALL** `p-new-matcher-needs-self-recall-test-s652`; **PROCEDURE** `p-yield-holder-live-row-after-filing-s668`. The paragraph as it stood: lessons, *Moved from the lane (S680 checkpoint)*.

**The extraction gate and one spend meter** (`d-extraction-gate-every-run-s653`, `d-one-spend-meter-s654`; `kb/_spend_meter.py` holds the $40 stop): the paragraph as it stood, lessons, *Moved from the lane (S680 checkpoint)*.

**Slice B** (the completeness base counts catalog-listed Active programs; COCI-only rows get a chip; Sam's go with four guards, Sheet 197 card 4, 2026-11-14). **Part 1, #3414** extracts a found no-list program's page behind `NCL_EXTRACT`, default off, until the display build and the Commons sidecars both hold `no_state_list` records back. **DECIDED** `d-no-list-record-scored-without-state-list-s668` and `d-named-course-minimum-one-s667`. The paragraph as it stood: lessons, *Moved from the lane (S679 checkpoint)*.

**The passing dry run (draft #3293, head `cb60a1b0`; nothing applied; `d-passing-dry-run-held-for-cobix-s651` stands):** COBIx has not answered in four days; the S680 worker recommends deciding without him: drop the own-list part and rerun the dry run on `main`. A plain-session decision (NEXT (6)). The paragraph as it stood: lessons, *Moved from the lane (S680 checkpoint)*.

**The display's gaps as structured fields** ([`reference/roep_display_structured_fields_design`](../roep_display_structured_fields_design.md), #3296): the paragraph as it stood, `docs/program_requirements_harvest_lessons.md`, *Moved from the lane (S667 checkpoint)*; the structured-fields migration's step 1 is NEXT (6).

**Cheap piles (S680, the CPL Queue routine's conductor night; Sam, relayed by COBIx on #3358: *"my priority is completion and will find the funding to make it happen"*, *"Yes, run both tonight with separate colleges"*).** Two lanes, never on one college: the collection lane held twelve colleges (Golden West, Coastline, Orange Coast, Cosumnes River, Lassen, Los Medanos, Diablo Valley, College of the Redwoods, Allan Hancock, Chabot, Antelope Valley, Santiago Canyon), listed in `COLLECTION_LANE_S680` in `kb/collection_lane.py`; the cheap-pile rules skipped them and reach them the next night. **Collect with gaps (Sam, relayed by COBIx in paraphrase):** never drop a record for failing; collect it with its gaps noted and a confidence score, and report records collected and confidence gained, never "newly passing". (a) #3491 merged (`main` e50a87fb): 9 discontinued programs flagged out of the gap census (Butte 2, Gavilan 2, Rio Hondo 1, Riverside City 2, Santa Ana 2), no data write; the teach-out rule needs a runner capture. (b) #3496, units rules A1, A4 and A5: **APPLIED** 17 rows checks only (`supabase-migrate.yml` run 44259625861) and 39 full row (run 44261575737), none skipped, after pre-read run 44258162212; both rollbacks rebuilt from the returned rows, committed, NOT applied (`kb/migrations/2026-11-18_s680_prreq_units_rules_rollback_{checks,rows}.sql`); 49 active programs move from failing to passing on the Commons count. `kb/_guarded_sql.py` is the one shape for every apply and rollback: it skips rows a person checked and aborts unless the count matches the plan. **DECIDED** `d-units-rule-a6-off-s680`: A6 is off (0 of 4 right on held answers). **FACT** `f-miracosta-21976-live-newer-run-s680`: the pre-read found MiraCosta 21976 live on run 38748842603 while its filed record is run 39726634443, so it was left out. (c) #3497, named gaps: 75 rows, all `no_units_read` ("A required course carries no units as read", unit arithmetic 20), stored as `checks.gaps` and `checks.confidence`; second reader's four findings fixed; pre-read queued; the apply follows. (d) #3502, the paid reread plan: **DECIDED** `d-paid-rereads-need-aimed-input-s680`: no blind paid reads; the extractor has no input aimed at one list, and the same page and prompt give the same blocks (`d-rccd-pilot-no-blind-force-s671`). Two records have a changed page ($0.20: Berkeley City 31984, Los Angeles Pierce 32620). Waiting on reader changes: aimed lists 260 records at 74 colleges ($26.20), a wider page window 94 ($9.67), A10 with a passing same-title sibling 38 ($3.84), other A10 210 ($21.20). **DECIDED (the S680 conductor, on Sam's rule):** "the catalog's own figures do not add up" takes a named gap with no page read (38 records), with 16 that print no units for a required course: 54 records, through #3497's mechanism (NEXT (2)).

**NEXT, in order:** (0) The RCCD pilot (#3438, S671; `d-rccd-pilot-no-blind-force-s671`) stands: never force a re-extraction blind, read the failing pages for free first. (1) **The display build through the new path** (no display build ran in S680): on a branch, run `kb/_build_roep_display.py`, commit only `cpl_pathways_roep_data.js`, then dispatch `step=display` (the runner builds, stores and applies the receipt; [repo-size](repo-size.md)). `main`'s records build `ee6d9daa5226` while the page and the table carry `cdd185495ce4`; Monterey Peninsula's three reloaded records (#3399) and S680's 56 rescored records reach the tab with it. (2) The 54 named-gap records of #3502 through #3497's mechanism, the first cheap-piles item; then the cheap-pile rules (units rules, discontinued flags, named gaps) at the collection lane's twelve colleges, emptying `COLLECTION_LANE_S680`. (3) Step 11 ([`scheduled_sessions`](../scheduled_sessions.md)): on a funded night one full read per host (S680, 2,452 rows loaded: Diablo Valley 946, Los Medanos 483, College of the Redwoods 443, Golden West 580 objectives, so the `objectives_reread_plan` is done; Antelope Valley `held` after its trial parsed 0 of 12, as College of Marin). Still reading: Allan Hancock (#3284, 2 of 3 slices), Chabot (#3492, full read run 44264136885), Santiago Canyon (#3494, run 44258693099); load each once its slices file complete. (4) Lassen (#3499): five records pinned to `main`'s pages; reconcile 44259115005 passes 33729 and 33730, and 31132, 33263 and 42300 carry `ge_units` 34 and still fail short of 60 with the gap named (passing 40 to 42 of 64); read reread run 44263840460, then the `set` step with a per-record hold; the structured-fields migration's step 1, Lassen first. (5) Cosumnes River (#3500): four clean pins (11338, 04607, 11319, 07305); the pins for 04602 and 04614 were dropped (they sent a neighboring program's list to the paid read); the paid read waits on a named-programs-only input, since the free preview lists programs beyond the pinned set. (6) #3293: decide without COBIx in a plain session (drop the own-list part, rerun the dry run on `main`). (7) #3502's reader changes, cheapest first (A10 with a sibling, the wider page window, aimed lists), each priced before its run; the two changed-page records ($0.20) with them. (8) Ruling 3's self-recall run: the general education slot on captured pages with `CPL_GE_AREA_SLOT_FILL=1`, committed and reviewed, then a PR sets the default on. (9) The `NCL_EXTRACT` switch waits on the Commons sidecars holding `no_state_list` records back (the display build does, since #3424); then #3414's refusal probe covers both, with the minor (`errors` counts no-list records) and COBIx's #3408 nit. (10) The teach-out rule (#3491) after a runner capture. (11) Los Medanos's and Los Angeles Valley's program rules, with a person. (12) Confirm the harvest card shows #3465's `spent_usd`, then strike this item. Older standing lists: lessons, *Moved from the lane (S653 checkpoint)* and *(S666 checkpoint)*.
🔨 **The catalog sweep (S394-S414):** its standing rules: lessons, *Moved from the lane (S648)*.

**Grok (waits on billing), the light index, flags:** lessons archive 5, *Moved from the lane (S645)*.
