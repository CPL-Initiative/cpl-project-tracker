---
title: "Program requirements harvest — lane state"
created: 2026-10-03
updated: 2026-11-19
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

**Sam's ruling (2026-10-04): no Governance pass**, everything is public record; the tab shows its records marked **Beta draft** (vault braindump `braindump-2026-10-04-1115-program-requirements-tab-public-record.md`). The paragraph as it stood: lessons, *Moved from the lane (S684 checkpoint)*.

**The tab is in COBI** (Beta draft, #1860, `program_requirements.js`; five views: Progress, Catalogs, Sequences, Procedures and the List; no Sierra, Sam 2026-10-14): the paragraph as it stood, lessons, *Moved from the lane (S681 checkpoint)*.

**The List (`#program-requirements/list`):** one row per active COCI program, read only, and the workspace (a program's side panel carries its record's card). The paragraph as it stood: lessons, *Moved from the lane (S680 checkpoint)*.

**Catalog addenda** (`program_source_addenda`; 79 listed at 52 colleges; the eight amending loaded colleges read, S387-S388; the other 71 as the reader reaches their colleges): lessons, S394.

**CPL Pathways reads the ROEP record (Sam, 2026-10-04 ~17:20Z):** every record shows, checked or not, each marked; no record is edited by hand. The paragraph as it stood: lessons, *Moved from the lane (S653 checkpoint)*.

**The display build** (`kb/_build_roep_display.py`) writes each program's facts once, under one build stamp, to `program_requirement_records.display` (Sierra) and `cpl_pathways_roep_data.js` (the page); guard `tests/roep_display_test.py`. Its history (S327-S336): the lessons doc, *Moved from the lane (S346 compaction)*.

**Outcomes (Sam, 2026-10-04):** course and program outcomes beside the harvested credential skills, in `course_outcomes`, read nightly (below); the skills comparison waits for `kb/reference/industry_credential_skills.json` (lessons, S413).

**Course objectives, collected with every SLO read (Sam, 2026-11-02; `sam-data-collection-six-asks-2026-11-13`):** filed as `course_outcomes.kind` `objective`, one host at a time, never replacing an SLO row; the `objectives_reread_plan` has no step left since Golden West (S680). **PITFALL:** an objectives `.load` is written by hand. The paragraph as it stood: lessons, *Moved from the lane (S680 checkpoint)*.

**The nightly SLO read (Sam, 2026-11-01):** step 11 of [`scheduled_sessions`](../scheduled_sessions.md), pages only, no cost; De Anza and College of Marin held. **Next:** the day's full read and preparation run, as `--next` names them; S684's outline steps are NEXT (6). **PITFALL** `p-outcome-load-without-standing-test-s681` stands (the standing test before `.load`). The paragraph as it stood, with S683's Chabot load: lessons, *Moved from the lane (S684 checkpoint)*.

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

**No display receipt is committed (S680, #3495):** a session runs `kb/_build_roep_display.py` on a branch and commits the page alone; `step=display` stores the receipt in the private bucket `cpl-receipts` ([repo-size](repo-size.md)); build `545de21a6edc` (S681) is live. The paragraph as it stood: lessons, *Moved from the lane (S683 checkpoint)*.
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

**The passing dry run (#3293 closed and parked as issue #3525, branch kept; nothing applied; `d-passing-dry-run-held-for-cobix-s651` stands):** a plain session decides from the issue without COBIx (NEXT (6)). The paragraph as it stood: lessons, *Moved from the lane (S680 checkpoint)*.

**The display's gaps as structured fields** ([`reference/roep_display_structured_fields_design`](../roep_display_structured_fields_design.md), #3296): the paragraph as it stood, `docs/program_requirements_harvest_lessons.md`, *Moved from the lane (S667 checkpoint)*; the structured-fields migration's step 1 is NEXT (6).

**Cheap piles (S680 to S684; Sam, relayed by COBIx on #3358: *"my priority is completion and will find the funding to make it happen"*).** Two lanes, never on one college; collect with gaps. S683's two applies (#3497's 99 named-gap rows, #3508's 14 A4 rows), `d-note-pair-off-s683`, the undo order and the S683 lists (`kb/program_requirements_cheap_piles_s683.json`): lessons, *Moved from the lane (S684 checkpoint)*. **S684, #3548:** the named-gaps pass over the S683 re-read records labeled 2 rows (Santa Rosa Junior 44788 `no_units_read`, City College of San Francisco 41049 `catalog_figures_differ`; pre-read 44513271094, apply 44515993146 returned 2, none skipped; `m-named-gaps-reread-applied-s684`); its `held_out` list carries each row's run and a `wave_reread` flag. Undo newest first: #3548's rollback, then the 99-row plan's, then S680's.

**The unblocker step (Sam, 2026-11-18 about 10:43 AM PT, relayed by COBIx on #3510, comment 6988133754):** before a document goes on Sam's hand-fetch list, the session tries the college's other public routes: its HTML catalog index pages, and a plain browser-like page read when the curl reader is blocked. A college read that way is marked *Sky can read 2026-27 HTML*. Never script around a WAF or a bot check, and never ignore robots.txt. The procedure: [`scheduled_sessions`](../scheduled_sessions.md) step 12; a refused read still follows [`blocked_sources`](../blocked_sources.md). #3536 (on `main` with the S683 wave) stops the reader at a WAF challenge and at a challenged robots.txt; its follow-up: JSON calls file as `refused` and should read `challenged`. **Pending:** the Southwestern and NOCE previews (captures 38563578596, 43342034608).

**The reader's page checks (#3514) and the reread waves.** Rules A to C check the pages a record placing no courses was read from (`CPL_READER_PAGE_CHECKS`, on); rule D is off unless the dispatch input `rule_d` sets it. Plan `kb/program_requirements_reread_plan_s683.json`: 444 records at 73 colleges. **DECIDED** `d-reread-keep-the-better-s683`, `d-reread-then-load-s683`, `d-lane-workers-dispatch-reread-load-s683`, `d-desert-skipped-s683`; the S683 wave at 15 colleges (#3544, `main` 8baace0f): lessons, *Moved from the lane (S684 checkpoint)*. **The guard, #3547 (`main` 94a02499; COBIx on #3544):** keep-the-better reads the checked list first, holds a live run `main` lacks (`live_runs`), and takes only five-digit control numbers, as strings (`p-control-number-leading-zero-s684`). **Two items stay open for COBIx:** a second pass after a post holds the row (no second pass at a college until that fix lands), and a CourseLeaf page that heads its list *REQUIREMENTS* or *Course List* passes the own-program test on the heading alone (Ventura 31298 and 44186; `f-courseleaf-generic-heading-restores-good-rereads-s684`; evidence `kb/program_requirements_college/ventura/reread_keep_better.json` on `claude/reread-wave-s684`). **S684's batch, ten colleges** (`claude/reread-wave-s684`, `-b`, `-c`; previews skipped under the plan's ceiling, `d-skip-preview-under-ceiling-s684`): FILL-W2. **FINDING** `f-reread-drops-files-live-rows-stay-s684`: at single-PDF catalogs rule A sets aim records `not_found` and the filing drops their failing record files (160 left `main` with S683's wave, more in S684), while their live rows stay; under `live_runs` a later re-read of one is held for a person. Rule D and the discontinued capture are the path that labels them.

**NEXT, in order:** (0) The RCCD pilot (#3438, S671; `d-rccd-pilot-no-blind-force-s671`) stands: never force a re-extraction blind, read the failing pages for free first. (1) **The display build, once, with S684's records** (`d-no-display-tonight-s684`: an hour-long two-step apply with a live count gate, kept clear of the 12:17Z daily slot): on a branch, `kb/_build_roep_display.py`, commit only `cpl_pathways_roep_data.js`, then `step=display`; it carries Lassen's five, #3497's and #3508's writes, both waves and #3548. Then dispatch `harvest-gap-census.yml` on `main` and report the shrink against 5,395. (2) **Keep-the-better's two open items** (above), with COBIx, before any second pass at a college. (3) **The reread plan's second ten**, once the first ten's loads have filed: Copper Mountain, Woodland, MiraCosta, American River, Yuba, Cerritos, Grossmont, Imperial Valley, Modesto Junior and Skyline; keep-the-better then a load at each, dispatches batched (`p-runner-pool-starves-migrate-s683`, `p-hung-size-jobs-starve-the-pool-s684`). Then rule D through `rule_d` for CCSF, Santa Rosa and College of the Desert, and `kb/_program_discontinued.py --capture` (run in neither S683 nor S684). (4) Southwestern and NOCE previews on fresh branches off `main`; #3536's `challenged` follow-up. (5) Cheap piles: the narrower A5 (three limits) with a self-check that compares the sum A5 changes; the `no_units_printed` matcher's missing wording (9 records); the six `NOTE_PAIR_ON` records to a person; #3508's finding 4 (25 single "or" alternatives); Sierra's reader of `together` (`cpl-chat/index.ts`, a plain session). (6) Step 11 ([`scheduled_sessions`](../scheduled_sessions.md)), outline readers, each on its `claude/slo-*` branch. **College of the Siskiyous is loaded** (full read 44508568959, 315 of 315 pages, standing test 26 of 26; load 44512255004 inserted 366 rows, 247 `slo` and 119 `objective`, error null; receipt on `claude/slo-college_of_the_siskiyous`, head 9769a585; 68 pages print no outcomes; `m-siskiyous-outlines-loaded-s684`): merge the branch. **Crafton Hills:** trial 44508733573 parsed 12 of 12 (59 SLOs, 204 objectives) and moved to a full read; then the standing test and the load. **Rio Hondo:** discover 44508907581 shows the index needs a reader change (it makes no NewSearch request until Search is pressed), a plain session's. Peralta: the reader fix (one code holds up to four colleges' records), then a 12-page trial. Mt. San Antonio (#3537): the parser fix. Saddleback and Irvine Valley: status words other than *Active*. CCSF's outline index (report 28). A plain session adds the standing test to `course-outcomes-load.yml`. (7) Lassen: the structured-fields migration's step 1, Lassen first; 31297, 35106 and 41912 held. (8) Cosumnes River (#3500): the paid read waits on a named-programs-only input. (9) #3293, parked as issue #3525: decide in a plain session. (10) #3502's reader changes, cheapest first (A10 with a sibling, 38 records, $3.84; the wider page window, 94, $9.67; aimed lists, 260 at 74 colleges, $26.20), with the two changed-page records ($0.20: Berkeley City 31984, Los Angeles Pierce 32620). (11) Ruling 3's self-recall run (`CPL_GE_AREA_SLOT_FILL=1`), then a PR sets the default on. (12) The `NCL_EXTRACT` switch after the Commons sidecars hold `no_state_list` records back; then #3414's refusal probe. (13) The teach-out rule (#3491), after a runner capture. (14) Los Medanos's and Los Angeles Valley's program rules, with a person. (15) Confirm the harvest card shows #3465's `spent_usd`. **For a person:** West Los Angeles 38677 (`held_for_person`); Los Angeles Mission 44849 (no live row); Los Angeles City 32832 (live run 39006380342, `main` files 43212072618; its record file dropped by the post, never re-read). Older lists: lessons, S653, S666 and *Moved from the lane (S684 checkpoint)*.
🔨 **The catalog sweep (S394-S414):** its standing rules: lessons, *Moved from the lane (S648)*.

**Grok (waits on billing), the light index, flags:** lessons archive 5, *Moved from the lane (S645)*.
