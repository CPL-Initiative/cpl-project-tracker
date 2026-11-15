---
title: "Program requirements harvest — lane state"
created: 2026-10-03
updated: 2026-11-15
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

**Course objectives, collected with every SLO read (Sam, 2026-11-02; `sam-data-collection-six-asks-2026-11-13`):** filed as `course_outcomes.kind` `objective` (`kb/_objectives_by_system.py`; guard `tests/course_outcomes_objectives_standing_test.py`). **DECIDED** `d-objectives-reread-order-s649` (one host at a time, never replacing an SLO row; [plan](../../../kb/course_outcomes/objectives_reread_plan.json)), `d-contra-costa-commented-objectives-unread-s649`, `d-chaffey-objectives-only-read-next-s649`, `d-rccd-objectives-loaded-s649`, `d-sdccd-objectives-loaded-s651`. De Anza and Marin held. **PITFALL:** an objectives `.load` is written by hand. As it stood: lessons, *Moved from the lane (S652 checkpoint)*. **NEXT:** read Santa Ana's run (#3344, pushed 2026-11-15); then laspositas, Coastline, Golden West.

**The nightly SLO read (Sam, 2026-11-01):** step 11 of [`scheduled_sessions`](../scheduled_sessions.md), pages only, no cost; De Anza and College of Marin held. The paragraph as it stood: lessons, *Moved from the lane (S647, Sheet 191)*. **Next:** the day's full read and preparation run, as `--next` names them.

**The Cerritos Ironworker proof of concept** (the ladder on CPL Pathways), the reader `kb/_college_page_read.py` with its plans in `kb/college_reads/`, and **one procedure record per college** written through `program_source_procedure_set(college, record, by, expect_md5)` (service role, md5-guarded, history trigger): the lessons doc, *Moved from the lane (S346 compaction)*.

✅ **Sheets 38, 39 and 42's rulings, the Progress view (S343, #1900, its status file written at step 12) and the older NEXT** (Schedule+ for Spring 2027, the film, the addenda reading agent, SkyView ROEP): lessons, *Moved from the lane (S653 checkpoint)*.

🔨 **Phase 2, a college at a time:** the load, the display and the $40 go: lessons archive 4, *Moved from the lane (S648, Glendale loaded)*.

🔨 **The reconcile pass (S392; `sam-reconcile-pass-after-harvest-2026-10-14`):** `kb/_program_requirements_reconcile.py` applies each college's steps (`kb/program_requirements_reconcile.json`) at extraction and on filed records (`step=reconcile`, no model call). The paragraph as it stood: lessons, *Moved from the lane (S647)*.

**Parked, displayed or standing as filed earlier** (Los Angeles Valley and Los Medanos parked; eleven colleges, Monterey Peninsula to Butte; Redwoods and De Anza open, their NEXT is (8) below; a choose-courses list's printed units are its floor, Sheet 144 card 2): lessons, *Moved from the lane (S644)*. **A refused read follows [`blocked_sources`](../blocked_sources.md) before any card.**

**The numbered handoff carries the lane** ([`session_655_handoff`](../../session_655_handoff.md)). **DECIDED (Sam, 7:13 PM PT 2026-11-11, relayed by COBIx on #3110; `sam-harvest-next-steps-tonight-2026-11-11`):** "Yes, pick them up tonight." Decisions that stand: `d-lacc-heading-minimum-60-s639`, `d-occ-up-to-ge-maximum-s639`, `d-hours-meets-top-term-length-s639`, `d-rio-hondo-cal-getc-areas-count-s639`, `d-west-valley-cal-getc-areas-count-s639`.
**Running a college:** `program-requirements-college.yml` (`college`, `extract` default `1`, so leaving it out spends; `limit`, `step`, `force` adds programs and never limits; `route`). A run files to the branch it ran on: a paid run goes on the college's branch, never `ref main`.
**Standing decisions of S640 and S641, throughput (S644-S647) and the gap census** (`d-passes-live-stays-equal-only-s644` stands): lessons archive 4, *Moved from the lane (S648 checkpoint)*.
**A wave** (`program-requirements-wave.yml`, #3191): up to eight colleges on distinct hosts, one branch, one PR, one filing job, no table written (lessons, *Running a wave*). **DECIDED** `d-wave-one-branch-hard-stop-s644`, `d-wave-price-rate-floor-s644`.
**The display apply runs live (#3190, #3204).** `step=display` writes the whole committed build; `display_college` runs one college. First runs and live counts: lessons, *Running a display, one college first (S645)*. **DECIDED (`d-display-first-run-one-college-s645`):** a new apply's first live run goes out on one college, the whole build after its record is confirmed. **DECIDED (`d-merge-is-publication-spot-check-first-s645`):** merging a college PR publishes its display build, so COBIx's five-record spot-check comes before the merge. `d-display-missing-threshold-s644` stands.
**Standing from S645 to S648** (the #3193 rescore, the PDF reader, Desert #3240, Glendale #3202, district profiles #3198; COBIx: run 43421133593's artifact must never be reposted for Desert 10195): every DECIDED slug and the paragraph as it stood, lessons, *Moved from the lane (S653 checkpoint)*.
**Headline:** the run log, `kb/status/program-requirements.json`. Sam's rulings of 2026-11-13 stand (the display go at every college, Cal-GETC 34, the 503 change, and `sam-headline-counts-own-list-2026-11-13`): the paragraph as it stood, lessons, *Moved from the lane (S648 checkpoint)*. The 503 change is merged and deployed (#3227); its post-deploy checks: lessons, *Moved from the lane (S649 final refresh)*.
**Standing from S648 to S651** (Cal-GETC 34, #3244; Sheet 195's rulings; Cosumnes River, #3288; Lassen, #3291; Sam's `sam-three-colleges-rules-first-2026-11-13` and `sam-noncredit-total-hours-2026-11-13`): every DECIDED slug and pitfall, lessons, *Moved from the lane (S652 final refresh)*.

**Catalog-first collection (Sam's go, 2026-11-14, relayed by COBIx on #3299; `sam-catalog-first-collection-2026-11-14`):** *"nothing stops the collection bus from rolling."* **DECIDED** `d-catalog-first-slice-order-s652`: slices C, then A, then B. Slice B's four guards (#3299, comment 6877610924): each not-listed records its basis; the headline shows both bases side by side; a chipped program with awards in the last three years says so on the chip; `page_claimed` and `not_found` on closed-list programs stay in Still to pass until the second look has run for that college. Sam's four steps: lessons, *Moved from the lane (S654 checkpoint)*.

**Slice C, prefix aliases (#3301), and the course-id route (#3312, S653).** `d-prefix-alias-evidence-rule-s652` and `d-crsid-seven-retire-ten-stay-s653` stand: the prefix comes from the Program Course File's course id first (`kb/_course_id_route.py`), 7 pairs retire and 10 stay; Crafton Hills, Moreno Valley and Norco keep theirs (COCI carries HIS, never HIST). At the next reread of American River and Santiago Canyon, check for BMET and PASV codes that show up as invented. **PITFALL** `p-mis-codes-carry-record-id-suffix-s652`: ENGL304-2507 reads as ENGL 304. The paragraph as it stood: lessons, *Moved from the lane (S654 checkpoint)*.

**The course-id rescore at six colleges (#3352, S655; wave branch `claude/course-id-rescore-s655`; `d-rescore-wave-one-branch-s654` and `d-rescore-five-after-crsid-merge-s653` stand).** Free reconciles from the filed pages, then six rereads, 159 rows replaced, 0 held (each `kb/receipts/program_requirement_records_college_reread_*` receipt holds its `rollback`). Fail to pass: American River 12189 and 12190, Diablo Valley 37558; nothing falls; statewide passing 15,856 to 15,859 of 22,335 on committed files. 07206 and 25 other American River records the capture held keep `main`'s copies. Display build `58b763170559` on the branch, not applied. **PITFALL** `p-sources-from-wants-the-capture-run-s653`: `sources_from` takes the run the filed `capture.json` names. The S654 paragraph: lessons, *Moved from the lane (S655)*.

**A GE-pattern page has one owner (#3324 `3ec83566`, S654).** `d-ge-page-one-owner-s653`, `d-ge-control-number-needs-title-s654` and `d-control-number-district-format-s654` (#3346 `4684b31c`, S655) stand. **The Riverside City capture is read (S655; run 43670221611, filed as `f3b80958`; `riverside-city-capture-240-of-268-s655`):** of 268 programs, sitemap_page 205 to 240, page_claimed 40 to 9, not_found 17 to 13; 35 of 41 transfer degrees claim their own page. Six stay page_claimed (30578, 32692, 32745, 33829, 37474, 44469): area-of-emphasis degrees (18108 to 18114), Chemistry 38838 or American Studies 31163 hold their pages, a separate fault (a NEXT). 31218's page moved `.../5953` to `.../5950`: check. curriQunet colleges may capture again. The paragraph as it stood: lessons, *Moved from the lane (S655 checkpoint)*.

**Slice A, the no-closed-list lookup (#3300 merged `7e248b76`; runs in every capture: `ncl_lookup` in `kb/_program_requirements_college.py`, default 1; census `kb/_harvest_ncl_lookup_census.py`).** Its rules as built (`d-ncl-lookup-not-listed-needs-catalog-list-s652`) and the census: lessons, *Moved from the lane (S653 checkpoint)*. **PITFALL** `p-new-matcher-needs-self-recall-test-s652` ([note](../../kb-notes/methodology-a-new-matcher-is-gated-by-a-self-recall-test.md)). **Skyline** (`skyline-ncl-first-merged-capture-s653`, run 43619276697): 52 `found`, 34 `not_matched` of 86; records 46296 (filed on `dance-aa.php`) and 32337 (the Advanced Engine page) are wrong on `main`. `d-skyline-estimate-5-20-s653` stands (about $5.20; nothing extracts a found program until slice B). COBIx (#3299, 6885498680): the 23 empty-heading pages stay `found` with a named-course minimum before extraction; the conductor sets the number (unset). **#3328 merged `d6ec2bed` (S654):** a catalog header fragment is never a program page, on all three code paths (`FRAGMENT_PATH`). COBIx, 02:35Z, not blocking: `FRAGMENT_PATH` matches only when the keyword ends the folder name; the follow-up PR widens it (`[^/]*` before the lookahead, a gone case, a measure). The paragraph as it stood: lessons, *Moved from the lane (S654 checkpoint)*.

**The extraction gate and one spend meter (S653 to S655).** `d-extraction-gate-every-run-s653` and **DECIDED** `d-one-spend-meter-s654` stand: `kb/_spend_meter.py` prices usage and holds the $40 stop for the pilot, the college workflow and the second reader; `X.CALL_MAX_USD` $1.55, recomputed by `tests/model_run_gates_test.py`. **It reached `main` only with #3351 (`c0cf44b9`, S655):** #3330 had merged into its stacked base and #3327 closed unmerged (`p-3330-merged-into-stack-base-s655`). Card 10's three callers: the [governance lane](governance-team-enablement.md). The paragraph as it stood: lessons, *Moved from the lane (S655 checkpoint)*.

**Slice B** (the completeness base counts catalog-listed Active programs; COCI-only rows get a chip). **RULED (Sam, Sheet 197 card 4, 14:38Z 2026-11-14):** *"go"*, with the four guards; the lookup runs at each college first; COBIx answered the empty-heading question (found, with a named-course minimum the conductor sets first).

**The passing dry run (draft #3293, head `cb60a1b0`; nothing applied; `d-passing-dry-run-held-for-cobix-s651` stands):** COBIx has not reviewed it; it folds in after slice A's first captures, then one migration and one rescore. The paragraph with the electives-fill census (#3297): lessons, *Moved from the lane (S653 checkpoint)*.

**The display's gaps as structured fields** ([`reference/roep_display_structured_fields_design`](../roep_display_structured_fields_design.md), #3296, #3303; writes only `program_requirement_records.display`): **DECIDED** `d-lassen-stale-note-known-defect-s652`. The paragraph as it stood: lessons, *Moved from the lane (S653 checkpoint)*.

**NEXT, in order:** (1) Read the Riverside City capture (above); then curriQunet colleges may capture again. (2) The course-id rescore (#3352): display build `58b763170559` is live (Diablo Valley run 43716540931, then the whole build, run 43716933187). S658 diffed every row against its live `before` build. Of the 315 rows that moved outside the six colleges, 93 are FIRE 130 X's wider peer lists (case 2, FIRE M1274 into FIRE 130 X, #3245; the identities apply, #3298), 195 drop *(Honors)* from a base title and 4 follow the HUMA M10ME and BUSI M10XW splits (Honors step 1, #3329; Sheets 195 and 197), and 34 are the S654 wave's checks and gaps (#3345). Each was ruled and applied before this wave, so the apply holds. A builder item: Cerro Coso 18917's `identity.title` still reads *(Honors)*. Before the next reconcile from filed pages, fix its three gaps in the reader. The reader code that built 07206's fill-over-window pass is unchanged; the branch was mended by hand from `main`. (a) It rescores held records: `stage_sources` recomputes `would_extract` against a `sources.json` that already names the capture's page, so `held_worse_window` and `held_no_gain` come back empty, and `reconcile_filed` never reads them (26 American River records restored, 07206 among them: `p-degree-electives-fill-false-pass-s650`, `tests/reconcile_window_fill_test.py`). (b) `file_run` rewrites `sources.json` from the staged sources, so a record kept from an earlier run loses its page (Santiago Canyon, 18 restored). (c) It drops `arithmetic.rescored` (Sheet 120 card 1, Sheet 144 card 2; 13 CCSF and Barstow records mended). (3) Step 11 (**DECIDED** `d-step11-runs-2026-11-15`: Allan Hancock's 12-page trial on #3284, commit 63a449b7; Santa Ana's objectives reread on #3344, commit 3ab3fef7; pushed 02:09Z): read each with `python3 scripts/next_slo_colleges.py --all` on its branch, load when every slice is filed; next hosts laspositas, Coastline, Golden West; College of the Redwoods' trial. (4) Slice B: set the named-course minimum first; Skyline 46296 and 32337; the self-test recall that fell 27 to 26 of 28 (name the program). (5) #3293 (keep; waits COBIx and slice A's captures); Cosumnes River's seven follow it. (6) Lassen: a capture pinned to main's pages for 31132, 33263, 33729, 33730 and 42300, then the `set` step with a per-record hold; the structured-fields migration's step 1, Lassen first. (7) Los Medanos, Monterey Peninsula and Los Angeles Valley, their rules first, with a person. (8) The standing list: lessons, *Moved from the lane (S653 checkpoint)*, the S652 NEXT line.
🔨 **The catalog sweep (S394-S414):** its standing rules: lessons, *Moved from the lane (S648)*.

**Grok (waits on billing), the light index, flags:** lessons archive 5, *Moved from the lane (S645)*.
