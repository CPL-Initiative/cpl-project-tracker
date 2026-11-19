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

**The nightly SLO read (Sam, 2026-11-01):** step 11 of [`scheduled_sessions`](../scheduled_sessions.md), pages only, no cost; De Anza and College of Marin held. The paragraph as it stood: lessons, *Moved from the lane (S647, Sheet 191)*. **Next:** the day's full read and preparation run, as `--next` names them. **S683:** Chabot read again with the fixed reader (read 44472580748, 3 parts), standing test 26 of 26 on the branch, then load run 44484699264: 1,013 `slo` and 1,013 `objective` rows, ids 34631 to 36656 (receipt `kb/receipts/course_outcomes_chabot_44484699264.json` on `claude/slo-chabot`; `course_outcomes` 32,347; `m-chabot-loaded-both-kinds-s683`). **PITFALL** `p-outcome-load-without-standing-test-s681` stands (the standing test before `.load`). S681's Chabot rollback: lessons, *Moved from the lane (S683 checkpoint)*.

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

**Cheap piles (S680 to S683; Sam, relayed by COBIx on #3358: *"my priority is completion and will find the funding to make it happen"*).** Two lanes, never on one college; collect with gaps. Applied in S683 under Sam's go of 2026-11-18 (7:08 AM PT, relayed by COBIx): #3497's 99-row named-gaps plan (pre-read 44472420629, apply 44474531589 returned 99; `m-named-gaps-99-applied-s683`) and #3508's A4 write, 14 rows with Long Beach City 44747 (pre-read 44473918412, apply 44483137614 returned 14; `m-a4-14-applied-s683`), landing with the CPL Pathways reader for a `together` group (`d-a4-apply-with-pathways-reader-s683`). **DECIDED** `d-note-pair-off-s683`: `NOTE_PAIR_ON = False`, since its self-check took its answer from the rule's own pattern; six records start a hand-held list. Both branches ride the wave. Undo order: the 99-row plan's rollback first, then S680's named-gaps and units-rules rollbacks (each aborts out of order); #3508's rollback sits beside its plan. The lists (`kb/program_requirements_cheap_piles_s683.json`, `claude/cheap-piles-s683`, no table write): A5's 31 wrong answers are 20 misses of the self-check and 11 of A5's own, which three limits exclude while all 69 right answers still land; of the 33 held-out records, 9 fit `no_units_printed` in words its matcher misses and 24 fit no named gap. Earlier text: lessons archive 6 and lessons, *Moved from the lane (S683 checkpoint)*.

**The unblocker step (Sam, 2026-11-18 about 10:43 AM PT, relayed by COBIx on #3510, comment 6988133754):** before a document goes on Sam's hand-fetch list, the session tries the college's other public routes: its HTML catalog index pages, and a plain browser-like page read when the curl reader is blocked (Southwestern and NOCE first). A college read that way is marked *Sky can read 2026-27 HTML*. Never script around a WAF or a bot check, and never ignore robots.txt. The procedure: [`scheduled_sessions`](../scheduled_sessions.md) step 12; a refused read still follows [`blocked_sources`](../blocked_sources.md). **S683:** none of the eight hand-fetched colleges is refused by the program reader; the blocks belong to the outline reader (`f-hand-fetched-colleges-read-fine-s683`). #3536 (in the wave; COBIx agreed) stops the reader at a WAF challenge and at a challenged robots.txt; its follow-up: JSON calls file as `refused` and should read `challenged`. **Pending check:** Southwestern and NOCE, *Sky can read 2026-27 HTML* (captures 38563578596, 43342034608); their previews wait on #3536.

**The reader's page checks (#3514, `main` 326b95ce):** rules A to C check the pages a record placing no courses was read from (`CPL_READER_PAGE_CHECKS`, on); rule D is off unless the dispatch input `rule_d` sets it. Plan `kb/program_requirements_reread_plan_s683.json`: 444 records at 73 colleges. **The S683 wave:** the gate held (Mendocino `own_page` 17; CCSF 40432 on page 148). **DECIDED** `d-reread-keep-the-better-s683` (pay within $40, then `kb/_program_reread_keep_better.py` restores a re-read that is worse or does not name its own program), `d-reread-then-load-s683` (a reread never inserts), `d-lane-workers-dispatch-reread-load-s683`, `d-desert-skipped-s683` (72 programs, 63 passing, 0 aim rows). 15 colleges, every receipt `error` null (the colleges: `m-reread-wave-15-colleges-s683`; no run is in flight): cheap piles 114 replaced and 53 inserted, collection 19 and 19; `program_requirement_records` 18,240 to 18,312; filed run costs $25.20. **FINDING** `f-reread-replaces-labeled-rows-s683`: the rereads replaced labeled rows, live `catalog_figures_differ` 19 of 21. For a person: West Los Angeles 38677 (`held_for_person`); Los Angeles Mission 44849 has no live row (it places none of its courses). Long Beach City's preview run 44474831635 looked stuck. About 45 colleges remain.

**NEXT, in order:** (0) The RCCD pilot (#3438, S671; `d-rccd-pilot-no-blind-force-s671`) stands: never force a re-extraction blind, read the failing pages for free first. (0a) **After the wave merges** (`claude/wave-s683`): a named-gaps pass over the S683 re-read records (`f-reread-replaces-labeled-rows-s683`), then the display build (1). (0b) **The reread plan's next batch:** about 45 colleges, 10 to a batch, never 17 dispatches at once (`p-runner-pool-starves-migrate-s683`); keep-the-better, then a load, at each. Rule D only through `rule_d`, for CCSF, Santa Rosa and College of the Desert, then `kb/_program_discontinued.py --capture` (not run in S683). (0c) **Southwestern and NOCE** previews on fresh branches off `main` once #3536 lands; #3536's `challenged` follow-up. (1) **The display build** (Lassen's five, #3497's and #3508's writes, the S683 wave): on a branch, `kb/_build_roep_display.py`, commit only `cpl_pathways_roep_data.js`, then `step=display`; then the harvest gap census, reporting the shrink against 5,395. (2) Cheap piles: the narrower A5 (three limits) with a self-check that compares the sum A5 changes; the `no_units_printed` matcher's missing wording (9 records); the six `NOTE_PAIR_ON` records to a person; #3508's finding 4 (25 single "or" alternatives that carry their row's units); Sierra's reader of `together` (`cpl-chat/index.ts`, finding 3, a plain session). (3) Step 11 ([`scheduled_sessions`](../scheduled_sessions.md)), outline readers, each on its `claude/slo-*` branch: Peralta (re-indexed, report 416): the reader fix (one code holds up to four colleges' records), then a 12-page trial; Crafton Hills (566 of 579 wanted, SLOs on report 343): a 12-page trial; Rio Hondo: a `discover=` run (the index made no search request); College of the Siskiyous (9 of 12 trial pages): the full read; Mt. San Antonio (#3537): the parser takes the course-list menu, the outcomes sit under *Outcomes:* after *Course Number:*; Saddleback and Irvine Valley: the index keeps only *Active*, this host uses other status words; CCSF's outline index (report 28), now released. The census recheck (#3538): none of its six joins the queue. A plain session adds the standing test to `course-outcomes-load.yml`. (4) Lassen: done but the structured-fields migration's step 1, Lassen first (untouched in S683); 31297, 35106 and 41912 held. (5) Cosumnes River (#3500): the paid read waits on a named-programs-only input. (6) #3293, parked as issue #3525: decide without COBIx in a plain session (drop the own-list part, rerun the dry run on `main`). (7) #3502's reader changes, cheapest first (A10 with a sibling, 38 records, $3.84; the wider page window, 94, $9.67; aimed lists, 260 at 74 colleges, $26.20), each priced before its run; the two changed-page records ($0.20: Berkeley City 31984, Los Angeles Pierce 32620) with them. (8) Ruling 3's self-recall run: the general education slot on captured pages with `CPL_GE_AREA_SLOT_FILL=1`, committed and reviewed, then a PR sets the default on. (9) The `NCL_EXTRACT` switch waits on the Commons sidecars holding `no_state_list` records back; then #3414's refusal probe covers both, with the minor (`errors` counts no-list records) and COBIx's #3408 nit. (10) The teach-out rule (#3491), after a runner capture. (11) Los Medanos's and Los Angeles Valley's program rules, with a person. (12) Confirm the harvest card shows #3465's `spent_usd`, then strike this item. Older lists: lessons, S653, S666 and *Moved from the lane (S683 checkpoint)*.
🔨 **The catalog sweep (S394-S414):** its standing rules: lessons, *Moved from the lane (S648)*.

**Grok (waits on billing), the light index, flags:** lessons archive 5, *Moved from the lane (S645)*.
