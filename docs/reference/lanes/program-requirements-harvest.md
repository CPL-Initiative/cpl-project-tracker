---
title: "Program requirements harvest — lane state"
created: 2026-10-03
updated: 2026-11-14
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

**CPL Pathways reads the ROEP record (Sam, 2026-10-04 ~17:20Z; vault braindump 2026-10-04 17:20):** the harvest tab runs the reading and CPL Pathways shows every record, checked or not, each marked. No record is edited by hand: a misread is filed against the college's reading procedure, and a place where the catalog and the Program Course File disagree goes to the college. The map names the pick inside a choice; the catalog keeps the rule. Ported S334; guard `tests/cpl_pathways_roep_view.test.js`; a11y targets `cpl-pathways-roep` and `-dark`. His words and the mock-up: lessons archive 5, *Moved from the lane (S641)*.

**The display build** (`kb/_build_roep_display.py`) writes each program's facts once, under one build stamp, to `program_requirement_records.display` (Sierra) and `cpl_pathways_roep_data.js` (the page); guard `tests/roep_display_test.py`. Its history (S327-S336): the lessons doc, *Moved from the lane (S346 compaction)*.

**Outcomes (Sam, 2026-10-04):** course and program outcomes beside the harvested credential skills, in `course_outcomes`, read nightly (below); the skills comparison waits for `kb/reference/industry_credential_skills.json` (lessons, S413).

**Course objectives, collected with every SLO read (Sam, 2026-11-02; `sam-data-collection-six-asks-2026-11-13`):** filed as `course_outcomes.kind` `objective` (`kb/_objectives_by_system.py`; guard `tests/course_outcomes_objectives_standing_test.py`). **DECIDED** `d-objectives-reread-order-s649` (one host at a time, never replacing an SLO row; [plan](../../../kb/course_outcomes/objectives_reread_plan.json)), `d-contra-costa-commented-objectives-unread-s649`, `d-chaffey-objectives-only-read-next-s649`, `d-rccd-objectives-loaded-s649`, `d-sdccd-objectives-loaded-s651`. De Anza and Marin held. **PITFALL:** an objectives `.load` is written by hand. As it stood: lessons, *Moved from the lane (S652 checkpoint)*. **NEXT:** sac, laspositas, Coastline, Golden West.

**The nightly SLO read (Sam, 2026-11-01):** step 11 of [`scheduled_sessions`](../scheduled_sessions.md), pages only, no cost; De Anza and College of Marin held. The paragraph as it stood: lessons, *Moved from the lane (S647, Sheet 191)*. **Next:** the day's full read and preparation run, as `--next` names them.

**The Cerritos Ironworker proof of concept** (the ladder on CPL Pathways), the reader `kb/_college_page_read.py` with its plans in `kb/college_reads/`, and **one procedure record per college** written through `program_source_procedure_set(college, record, by, expect_md5)` (service role, md5-guarded, history trigger): the lessons doc, *Moved from the lane (S346 compaction)*.

✅ **Sheets 38, 39 and 42's rulings:** lessons, *Moved from the lane (S336 compaction)*. ✅ **The Progress view (S343, #1900), drawn by `commons_progress.js`, its status file written at step 12:** lessons archive 4, *Moved from the lane (S598)*. **NEXT:** ① Re-read Schedule+ for Spring 2027 once its IWAP sections post. ② The film: re-render when a ladder line it shows changes. ③ The addenda reading agent after the 2026-10-11 apply; Miramar's map (`read: 1`); Butte's ROE definitions; every loaded college holds a procedure record (S395). Refresh the builder's two dated reads when the harvest adds a college. Later (Sam, ~20:02Z): every program with ROEP in a SkyView view ([skyview lane](skyview-ccr-interface.md)).

🔨 **Phase 2, a college at a time:** the load, the display and the $40 go: lessons archive 4, *Moved from the lane (S648, Glendale loaded)*.

🔨 **The reconcile pass (S392; `sam-reconcile-pass-after-harvest-2026-10-14`):** `kb/_program_requirements_reconcile.py` applies each college's steps (`kb/program_requirements_reconcile.json`) at extraction and on filed records (`step=reconcile`, no model call). The paragraph as it stood: lessons, *Moved from the lane (S647)*.

**Parked, displayed or standing as filed earlier** (Los Angeles Valley and Los Medanos parked; eleven colleges, Monterey Peninsula to Butte; Redwoods and De Anza open, their NEXT is (8) below; a choose-courses list's printed units are its floor, Sheet 144 card 2): lessons, *Moved from the lane (S644)*. **A refused read follows [`blocked_sources`](../blocked_sources.md) before any card.**

**The numbered handoff carries the lane** ([`session_653_handoff`](../../session_653_handoff.md)). **DECIDED (Sam, 7:13 PM PT 2026-11-11, relayed by COBIx on #3110; `sam-harvest-next-steps-tonight-2026-11-11`):** "Yes, pick them up tonight." Decisions that stand: `d-lacc-heading-minimum-60-s639`, `d-occ-up-to-ge-maximum-s639`, `d-hours-meets-top-term-length-s639`, `d-rio-hondo-cal-getc-areas-count-s639`, `d-west-valley-cal-getc-areas-count-s639`.
**Running a college:** `program-requirements-college.yml` (`college`, `extract` default `1`, so leaving it out spends; `limit`, `step`, `force` adds programs and never limits; `route`). A run files to the branch it ran on: a paid run goes on the college's branch, never `ref main`.
**Standing decisions of S640 and S641, throughput (S644-S647) and the gap census** (`d-passes-live-stays-equal-only-s644` stands): lessons archive 4, *Moved from the lane (S648 checkpoint)*.
**A wave** (`program-requirements-wave.yml`, #3191): up to eight colleges on distinct hosts, one branch, one PR, one filing job, no table written (lessons, *Running a wave*). **DECIDED** `d-wave-one-branch-hard-stop-s644`, `d-wave-price-rate-floor-s644`.
**The display apply runs live (#3190, #3204).** `step=display` writes the whole committed build; `display_college` runs one college. First runs and live counts: lessons, *Running a display, one college first (S645)*. **DECIDED (`d-display-first-run-one-college-s645`):** a new apply's first live run goes out on one college, the whole build after its record is confirmed. **DECIDED (`d-merge-is-publication-spot-check-first-s645`):** merging a college PR publishes its display build, so COBIx's five-record spot-check comes before the merge. `d-display-missing-threshold-s644` stands.
**Standing from S645 to S648** (the #3193 rescore, merged and displayed; the PDF reader #3201, #3214, #3218; College of the Desert #3240; Glendale #3202; district profiles #3198): **DECIDED** `d-rescore-text-checked-from-artifacts-s647`, `d-pdf-reader-number-line-design-s645`, `d-pdf-refused-method-s646`, `d-pdf-own-heading-exact-s646`, `d-desert-10195-hold-main-s648`, `d-keep-passing-record-no-read-s647`, `d-glendale-tab-control-number-s648`, `d-glendale-load-plan-s648`, `d-district-profiles-files-first-s645`; pitfall `p-filing-step-keep-all-refuted-s646`. **COBIx: run 43421133593's artifact must never be reposted for Desert 10195.** The paragraphs as they stood: lessons, *Moved from the lane (S651 checkpoint)*.
**Headline:** the run log, `kb/status/program-requirements.json`. Sam's rulings of 2026-11-13 stand (the display go at every college, Cal-GETC 34, the 503 change, and `sam-headline-counts-own-list-2026-11-13`): the paragraph as it stood, lessons, *Moved from the lane (S648 checkpoint)*. The 503 change is merged and deployed (#3227); its post-deploy checks: lessons, *Moved from the lane (S649 final refresh)*.
**Standing from S648 to S651** (Cal-GETC 34, #3244; Sheet 195's rulings; Cosumnes River, #3288; Lassen, #3291; Sam's `sam-three-colleges-rules-first-2026-11-13` and `sam-noncredit-total-hours-2026-11-13`): every DECIDED slug and pitfall, lessons, *Moved from the lane (S652 final refresh)*.

**Catalog-first collection (Sam's go, "Nov 14, 2026, about 4:55 AM PT", relayed by COBIx on #3299; `sam-catalog-first-collection-2026-11-14`):** *"nothing stops the collection bus from rolling."* His four steps: start from the published catalog; compare back to COCI; take one second look in the catalog by title and award; if the program is still not found, flag it "on COCI, not listed in the catalog" and move on, never in Still to pass. **DECIDED** `d-catalog-first-slice-order-s652`: three slices, C, then A, then B. Slice B moves a public figure, so it waits on Sam's go and the conductor's four guards (#3299, comment 6877610924): each not-listed records its basis; the headline shows both bases side by side; a chipped program with awards in the last three years says so on the chip; `page_claimed` and `not_found` on closed-list programs stay in Still to pass until the second look has run for that college.

**Slice C, prefix aliases (#3301 merged `c6e0b893`; plan `kb/program_requirements_reconcile_out/prefix_aliases_2026-11-14/plan.json`).** **DECIDED** `d-prefix-alias-evidence-rule-s652`: a college gets a `prefix_aliases` pair only on its own committed evidence, at least three courses matching on number, suffix and title, no counterexample; 17 pairs at 13 colleges. **Riverside City, rescored from its filed pages** (reconcile run 43605883626, `sources_from=38108461470`, no page loaded; reread run 43608708424; receipt: 244 posted, 240 replaced, 4 held: 22804, 31456, 39033, 40061): the conductor's live reads 222 of 244 passing at 15:10Z, 230 at 15:15Z. Newly passing 32938, 41757, 42719, 43695, 43897, 44155, 44363, 44469; 41749 and 43896 pass coverage and still fail arithmetic; 31892's sum (21 to 42 against 24) is a scorer question. Draft #3305 (`claude/riverside-city-prefix-rescore-filed-s652`) carries the status rebuild (failing programs 2,863 to 2,855) and display build `ae03886f128e` (16 rows); the display run waits on COBIx's spot-check of 32938, 42719, 43897, 44155, 44469 (#3299, comment 6879661422). The other five colleges' free filed-pages reconciles were dispatched about 15:23Z, one `claude/<college>-prefix-rescore-filed-s652` branch each. Never reread from `claude/riverside-city-prefix-rescore-s652` (a short fresh capture). **The `cq_distinct` fault:** `kb/_program_requirements_college.py` drops curriQunet index entries whose title key repeats (Riverside City 191 of 435), so two programs sharing a title lose a page; it comes first among reader fixes. **PITFALL** `p-mis-codes-carry-record-id-suffix-s652`: ENGL304-2507 reads as ENGL 304.

**Slice A, the no-closed-list lookup (draft #3300, head `5e1657c3`).** The capture looks up a program with no closed list by title and award over the pages it already read, with no model call; the method stays `no_closed_list`, so no count moves. **DECIDED** `d-ncl-lookup-not-listed-needs-catalog-list-s652`, as built after three reader rounds and COBIx's review (comment 6879508862): one page gives `found` to at most one program; the whole title matches both ways; a transfer degree is its own award; landing, index and archived pages are refused; the page search runs before the catalog list, and `absent_from_catalog_list` is only a `not_matched` reason (the pages found nothing and the list passed its 95% gate); `not_listed` is not filed in this slice; a college under the 80% floor is `not_searched`. Census: recall 81.1% (9,493 of 11,702), no false match by either measure, the conversion test 2,961 right and 0 wrong of 3,988; 54 of 83 site colleges searched. **PITFALL** `p-new-matcher-needs-self-recall-test-s652` ([note](../../kb-notes/methodology-a-new-matcher-is-gated-by-a-self-recall-test.md)). A fresh free Skyline capture on `5e1657c3` was dispatched about 15:21Z.

**Slice B** (the completeness base counts catalog-listed Active programs; COCI-only rows get a chip) follows slice A. **RULED (Sam, Sheet 197 card 4, 14:38Z 2026-11-14):** *"go"*, with the four guards.

**The passing dry run (draft #3293, head `cb60a1b0`; nothing applied; `d-passing-dry-run-held-for-cobix-s651` stands).** COBIx has not reviewed it. His statewide count is delivered (#3297 `e713ee10`; `kb/status/electives_fill_section_census_2026-11-14.json`; #3111, comment 6877317551): of 749 passing records that pass on a fill behind the word guard, the match sits inside the section in 314, in the program's own window in 356, and outside in 31 at most (College of the Desert 23, Canada 5, Lassen 2, American River 1); 48 have an unknown span. Only Lassen 32083 and Canada 35834 have no electives word anywhere in the record, and Lassen 30947 may be a third: about 2. The 31 is an upper bound: the census measures by page. The own-list rule depends on slice A: the dry run folds in after A's first capture, then one migration and one rescore.

**The display's gaps as structured fields (design merged, #3296 `19ed0958`; COBIx's review folded in, #3303 `3b2d9b38`):** [`reference/roep_display_structured_fields_design`](../roep_display_structured_fields_design.md). The migration writes only `program_requirement_records.display`. COBIx decided Q1: show `borrowed`, and re-base it as `statewide` once the college's own words show none. **DECIDED** `d-lassen-stale-note-known-defect-s652`: Lassen's stale "no units printed" note on 30947, 31015, 31037, 31379 and 32083 stays published as a known defect until the migration (answered on #3291, comment 6877180917).

**NEXT, in order:** (1) Slice A: merge `main` into #3300, read the new Skyline preview (count by value, 05809 `found`, each `found` checked by heading and award), merge on a green `test`; then Skyline's extraction estimate. (2) Riverside City's display after COBIx's spot-check (#3305); the five colleges' compares (`compare(load_records(main), load_records(branch))` in `kb/_program_requirements_wave.py`), then `step=reread` with `force=<its reconcile run id>`, the two status builders, a PR, COBIx's spot-check, the display. (3) The `cq_distinct` fix (dedupe by page id or award code), with a count of the curriQunet colleges it affects and a second reader. (4) The `CrsId` route: 11 of the 17 pairs retire. (5) Slice B, on Sam's go: after slice A merges and its second look has run per college; both bases side by side. (6) #3293 after slice A; Cosumnes River's seven follow it. (7) Allan Hancock on #3284 (`index=kb/course_outline_index/index_43566318943.json`, `slugs=allan_hancock`, `trial=12`) and objectives sac, both due 2026-11-15; then laspositas, Coastline, Golden West. (8) Lassen: a capture pinned to main's pages for 31132, 33263, 33729, 33730 and 42300, then the `set` step with a per-record hold; the structured-fields migration's step 1, Lassen first. (9) Los Medanos, Monterey Peninsula and Los Angeles Valley, their rules first, in a session with a person. (10) The standing list: Cerro Coso 40922 and Grossmont 46141 held (Sheet 82), Chaffey's objectives-only read, the RCCD district profile (#3237), COBIx's three Glendale follow-ups, a stored hold for Desert 10195, the reading-procedure check, the PDF reader's wrapped headings, the free GE page reads at sixteen colleges, the district phase 0 builder (#3198), the wave sample, De Anza, Redwoods. The detail of each: lessons, *Moved from the lane (S652 checkpoint)* and *(S652 final refresh)*.
🔨 **The catalog sweep (S394-S414):** its standing rules: lessons, *Moved from the lane (S648)*.
**Slice A's mechanics (#3300):** `ncl_lookup` in `kb/_program_requirements_college.py`; census `kb/_harvest_ncl_lookup_census.py`; flag `ncl_lookup` (default `1`).

**Grok (waits on billing), the light index, flags:** lessons, *Moved from the lane (S645)*.
