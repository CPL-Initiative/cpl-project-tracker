---
title: "Program requirements harvest — lane state"
created: 2026-10-03
updated: 2026-11-16
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

**Course objectives, collected with every SLO read (Sam, 2026-11-02; `sam-data-collection-six-asks-2026-11-13`):** filed as `course_outcomes.kind` `objective` (`kb/_objectives_by_system.py`; guard `tests/course_outcomes_objectives_standing_test.py`). **DECIDED** `d-objectives-reread-order-s649` (one host at a time, never replacing an SLO row; [plan](../../../kb/course_outcomes/objectives_reread_plan.json)), `d-contra-costa-commented-objectives-unread-s649`, `d-chaffey-objectives-only-read-next-s649`, `d-rccd-objectives-loaded-s649`, `d-sdccd-objectives-loaded-s651`. De Anza and Marin held. **PITFALL:** an objectives `.load` is written by hand. As it stood: lessons, *Moved from the lane (S652 checkpoint)*. Santa Ana (load 43684986821, 1,362 rows) and Las Positas (#3386, load 43825849738, 776 rows) are loaded. **NEXT:** Coastline, then Golden West (one host, `cccd`). The S664 and S665 lead-in and heading fixes (#3389, #3391; `d-laspositas-lead-fix-in-place-s664`, `d-goldenwest-subhead-fix-in-place-s665`) are done: no SLO row is left whose first outcome is a lead-in or heading, and Golden West's reread may run. As they stood: lessons, *Moved from the lane (S666 checkpoint)*.

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

**The course-id rescore at six colleges (#3352, S655):** 159 rows replaced, 0 held, each `kb/receipts/program_requirement_records_college_reread_*` receipt holds its `rollback`; display build `58b763170559` live. **PITFALL** `p-sources-from-wants-the-capture-run-s653`. The paragraph as it stood: lessons, *Moved from the lane (S666 checkpoint)*.

**A GE-pattern page has one owner (#3324, S654; `d-ge-page-one-owner-s653`, `d-ge-control-number-needs-title-s654`, `d-control-number-district-format-s654` stand).** **DECIDED by Sam** (`d-both-versions-by-catalog-year-sam-2026-11-15`): *"the 2.0 is for the new calgetc version that took effect this fall. students still have catalog rights to the original version in previous catalog years... both need to be in our collection with catalog years associated to them."* So a plain program and its 2.0 each keep a record, each read from its own catalog year; a prior-year record is scored against that year's renumbers (`course_renumbers_by_year`, #3385). **Riverside City's four plain siblings, as they stand (S666):** Mathematics 32692 is filed from its 2025-2026 page (reread 43822316519). Physics 32745 keeps its current record: draft #3393 closed after a free `prior` dispatch with `step=reconcile` (run 43880453260, no model call) printed `cal-getc 32745 held: the sum passes 60 and the section states no double counting` (28 + 34 = 62). Business Administration 33829 and Communication Studies 30578 keep theirs: the archive 7 (2024-2025) read (run 43889274787, $0.078, branch `claude/rcc-archive7-prior-s666`, no PR) matched 33829 to `archive/7/iq/918/943/1068`, titled *Business Administration 2.0*, so that catalog already printed the successor (the record fails coverage), and found no page for 30578 (near miss `.../1086`, 1 of 14 codes). **DECIDED** `d-rcc-originals-predate-curriqunet-s666`: both current records stay; the plain originals sit in the 2023-2024 or older PDF catalogs on rcc.edu, which the `prior` route (curriQunet only) cannot read. **PROCEDURE** `p-prior-rescore-route-is-prior-plus-reconcile-s666`: `sources_from=<prior run>` is refused, because `stage_sources` accepts only `capture.json`/`capture_preview.json` accounts, never `prior_<year>.json`; the free rescore of a prior read is a `prior` dispatch with `step=reconcile`, whose log carries `calgetc_trace`. Standing constraints (COBIx on #3367): `ncl_past_year` refuses a page whose catalog years are all older than the capture's, so a prior read sets its own `catalog_year`; a load upserts on `(college, control_number)`, so a second year of one program needs `catalog_year` in the key or a side table first. 44469, 37474, the 99 pairs statewide, and Sam's later diff table of programs that changed between catalog years: lessons, *Moved from the lane (S666 checkpoint)*.

**Slice A, the no-closed-list lookup (#3300; `ncl_lookup` in `kb/_program_requirements_college.py`, default 1; census `kb/_harvest_ncl_lookup_census.py`; `d-ncl-lookup-not-listed-needs-catalog-list-s652`).** **PITFALL** `p-new-matcher-needs-self-recall-test-s652` ([note](../../kb-notes/methodology-a-new-matcher-is-gated-by-a-self-recall-test.md)). Skyline records 46296 and 32337 are wrong on `main`; the 23 empty-heading pages stay `found` with a named-course minimum the session sets (unset). Skyline's counts, #3328's `FRAGMENT_PATH` and its follow-up: lessons, *Moved from the lane (S666 checkpoint)*.

**The extraction gate and one spend meter (S653 to S655).** `d-extraction-gate-every-run-s653` and **DECIDED** `d-one-spend-meter-s654` stand: `kb/_spend_meter.py` prices usage and holds the $40 stop for the pilot, the college workflow and the second reader; `X.CALL_MAX_USD` $1.55, recomputed by `tests/model_run_gates_test.py`. **It reached `main` only with #3351 (`c0cf44b9`, S655):** #3330 had merged into its stacked base and #3327 closed unmerged (`p-3330-merged-into-stack-base-s655`). Card 10's three callers: the [governance lane](governance-team-enablement.md). The paragraph as it stood: lessons, *Moved from the lane (S655 checkpoint)*.

**Slice B** (the completeness base counts catalog-listed Active programs; COCI-only rows get a chip). **RULED (Sam, Sheet 197 card 4, 14:38Z 2026-11-14):** *"go"*, with the four guards; the lookup runs at each college first; COBIx answered the empty-heading question (found, with a named-course minimum the conductor sets first).

**The passing dry run (draft #3293, head `cb60a1b0`; nothing applied; `d-passing-dry-run-held-for-cobix-s651` stands):** COBIx has not reviewed it; it folds in after slice A's first captures, then one migration and one rescore. The paragraph with the electives-fill census (#3297): lessons, *Moved from the lane (S653 checkpoint)*.

**The display's gaps as structured fields** ([`reference/roep_display_structured_fields_design`](../roep_display_structured_fields_design.md), #3296, #3303; writes only `program_requirement_records.display`): **DECIDED** `d-lassen-stale-note-known-defect-s652`. The paragraph as it stood: lessons, *Moved from the lane (S653 checkpoint)*.

**NEXT, in order:** (1) Step 11 (UTC Nov 17): Coastline's objectives reread is the full read, then Golden West (`cccd`), plus one preparation run; College of the Redwoods (#3387) and Allan Hancock (#3284) are read and wait their turn. (2) Monterey Peninsula 03653, 22098 and 39361: Active in COCI with no live row since 2026-11-09 and no deletion receipt; **DECIDED** `d-mpc-reload-three-s666`, `step=load` run 43892853333 (insert-only) inserted 3 and kept 197 (receipt `kb/receipts/program_requirement_records_college_monterey_peninsula_43892853333.json`); merge draft #3399 on a green `test`, and the next display build carries them. (3) Riverside City 30578 and 33829 stay as filed, with no PDF-catalog route built for two records (**DECIDED** `d-rcc-two-left-no-pdf-route-s667`; reopen on new source evidence); next, the other colleges' plain/2.0 pairs on curriQunet. (4) Slice B: **the named-course minimum is one course, applied at extraction, never at `found`** (**DECIDED** `d-named-course-minimum-one-s667`). Measured over the 19,137 filed records: 9 name exactly one course, every one a real single-course certificate (Victor Valley CJ 80, EMS 60 and EMS 84; American River FIRE 1500; Yuba AJ 51 and AJ 52; Siskiyous FIRE0950; Las Positas HNRS 1; Los Angeles Valley LING 001), so two would refuse real programs. A page that names none is not extracted; it stays `found`, since a program whose courses sit in a tab or a PDF is still listed. Then Skyline 46296 and 32337; the self-test recall that fell 27 to 26 of 28 (name the program). (5) #3293 (keep; waits COBIx and slice A's captures); Cosumnes River's seven follow it. (6) Lassen: a capture pinned to main's pages for 31132, 33263, 33729, 33730 and 42300, then the `set` step with a per-record hold; the structured-fields migration's step 1, Lassen first. (7) Los Medanos and Los Angeles Valley, their rules first, with a person. (8) The standing list: lessons, *Moved from the lane (S653 checkpoint)*, the S652 NEXT line; the course-id rescore's 315 moved rows and the reconcile reader gaps: lessons, *Moved from the lane (S666 checkpoint)*.
🔨 **The catalog sweep (S394-S414):** its standing rules: lessons, *Moved from the lane (S648)*.

**Grok (waits on billing), the light index, flags:** lessons archive 5, *Moved from the lane (S645)*.
