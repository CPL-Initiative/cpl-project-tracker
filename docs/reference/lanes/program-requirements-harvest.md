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

**Course objectives, collected with every SLO read (Sam, 2026-11-02):** `course_outcomes.kind` `objective`, never replacing an SLO row; the `objectives_reread_plan` has no step left; an objectives `.load` is written by hand. The paragraph as it stood: lessons, *Moved from the lane (S687 checkpoint)*.

**The nightly SLO read (Sam, 2026-11-01):** step 11 of [`scheduled_sessions`](../scheduled_sessions.md); the standing test runs before any `.load` (`p-outcome-load-without-standing-test-s681`). The paragraph as it stood: lessons, *Moved from the lane (S687 checkpoint)*.

**The Cerritos Ironworker proof of concept, the page reader (`kb/_college_page_read.py`) and one procedure record per college** (`program_source_procedure_set`): lessons, *Moved from the lane (S668 checkpoint)*.

✅ **Sheets 38, 39 and 42's rulings, the Progress view (S343, #1900, its status file written at step 12) and the older NEXT** (Schedule+ for Spring 2027, the film, the addenda reading agent, SkyView ROEP): lessons, *Moved from the lane (S653 checkpoint)*.

🔨 **Phase 2, a college at a time:** the load, the display and the $40 go: lessons archive 4, *Moved from the lane (S648, Glendale loaded)*.

🔨 **The reconcile pass (S392; `sam-reconcile-pass-after-harvest-2026-10-14`):** `kb/_program_requirements_reconcile.py` applies each college's steps (`kb/program_requirements_reconcile.json`) at extraction and on filed records (`step=reconcile`, no model call). The paragraph as it stood: lessons, *Moved from the lane (S647)*.

🔨 **Sam's rulings of 2026-11-17 (#3461, final; [`sam_rulings`](../sam_rulings.md)), carried out in #3478 and applied by run 44224714543 (S679; 243 records; rollback committed, NOT applied: `kb/migrations/2026-11-18_s679_prreq_rescore_rollback.sql`).** The general education open slot stays OFF behind `GE_AREA_SLOT_FILL` until its self-recall run (NEXT (11)). The paragraph as it stood: lessons, *Moved from the lane (S680 checkpoint)*.

**Parked, displayed or standing as filed earlier** (Los Angeles Valley and Los Medanos parked; eleven colleges, Monterey Peninsula to Butte; Redwoods and De Anza open, their NEXT is (8) below; a choose-courses list's printed units are its floor, Sheet 144 card 2): lessons, *Moved from the lane (S644)*. **A refused read follows [`blocked_sources`](../blocked_sources.md) before any card.**

**Decisions of S639 that stand:** `d-lacc-heading-minimum-60-s639`, `d-occ-up-to-ge-maximum-s639`, `d-hours-meets-top-term-length-s639`, `d-rio-hondo-cal-getc-areas-count-s639`, `d-west-valley-cal-getc-areas-count-s639` (Sam's go of 2026-11-11: lessons, *Moved from the lane (S668 checkpoint)*).
**Running a college:** `program-requirements-college.yml` (`college`, `extract` default `1`, so leaving it out spends; `limit`, `step`, `force` adds programs and never limits; `route`). A run files to the branch it ran on: a paid run goes on the college's branch, never `ref main`.
**Standing decisions of S640 and S641, throughput (S644-S647) and the gap census** (`d-passes-live-stays-equal-only-s644` stands): lessons archive 4, *Moved from the lane (S648 checkpoint)*.
**A wave** (`program-requirements-wave.yml`, #3191): up to eight colleges on distinct hosts, one branch, one PR, one filing job, no table written (lessons, *Running a wave*). **DECIDED** `d-wave-one-branch-hard-stop-s644`, `d-wave-price-rate-floor-s644`.
**The display apply (#3190, #3204, #3495):** `step=display` writes the whole build, `display_college` one college; no display receipt is committed (the private bucket `cpl-receipts` holds it). The two paragraphs as they stood: lessons, *Moved from the lane (S687 checkpoint)*.

**Display build `3361e3aa5b7d` is live, confirmed on its own read** (S687, #3567 `52d85a7e`; 18,380 statements; one college, the gate, the whole build, the closing count, run ids in lessons, *S687*). The confirming read pages by key, never by offset (#3564 `bc0bf6ee`; a page with no new key stops it; **DECIDED** `d-display-keyset-confirm-s687`). The gap census of 2026-11-19 (run 44604899544, `main` `ab6bf57b`): 5,145 left of 20,282, passing 15,044 (`m-census-5145-s687`).
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

**Cheap piles (S680 to S685; Sam, relayed by COBIx on #3358: *"my priority is completion and will find the funding to make it happen"*):** collect with gaps; undo newest first (#3548's rollback, then the 99-row plan's, then S680's). The paragraph as it stood: lessons, *Moved from the lane (S687 checkpoint)*.

**The unblocker step (Sam, 2026-11-18, relayed by COBIx on #3510):** try a college's other public routes before Sam's hand-fetch list; never script around a WAF or a bot check, never ignore robots.txt ([`scheduled_sessions`](../scheduled_sessions.md) step 12). The paragraph as it stood: lessons, *Moved from the lane (S687 checkpoint)*.

**The reader's page checks (#3514) and the reread waves.** Rules A to C check the pages a record placing no courses was read from (`CPL_READER_PAGE_CHECKS`, on); rule D is off unless the dispatch input `rule_d` sets it. Plan `kb/program_requirements_reread_plan_s683.json`: 444 records at 73 colleges; its per-college ceilings price only the aim rows, and the stop is $40 per college per run (**DECIDED** `d-reads-stop-is-forty-dollars-s685`). Earlier waves and #3547's guard: lessons, *Moved from the lane (S685 checkpoint)*. **Keep-the-better** (#3553, `main` 95f85b1e): a generic CourseLeaf heading passes the own-program test only on the program's own page (`page_is_own`); a live run equal to this run is `posted`; a failing re-read whose live row holds this run goes to a person (the rule as it stood: lessons, *Moved from the lane (S687 checkpoint)*). #3557 (`995d7c41`: a stripped award ending passes only when `slug_awards` names the program's award kind; `award_tail` on the decision row) and #3558 (`741129e5`: with `live_runs`, a run is named whenever a kept or new record is not live at it) are on `main`. **FINDING** `f-reread-drops-files-live-rows-stay-s684` stands.

**S687's posts at nine colleges (#3565 `b63a4ba9`; `m-nine-colleges-posted-s687`):** 164 rows replaced and 45 inserted, every receipt's error null; the live read through the migrate runner, keep-the-better with `--checked`, then `step=reread` with each run pinned and `step=load`. Cerritos 44984 went to `held_for_person`. Skyline skipped (**DECIDED** `d-skyline-skipped-compare-page-s687`: both candidates point at `_compare.new.programs.php`, a page comparing many programs). Feather River's full read and the Feather River and Palomar trials stay on their `claude/slo-*` branches (**DECIDED** `d-feather-palomar-trials-off-wave-s687`). Per college: lessons, *S687*.

**Rule D (S687, #3569 `3cbf7012`; **DECIDED** `d-rule-d-from-committed-previews-s687`):** `kb/_program_discontinued.py` `committed_not_printed` reads rule D's marks from the committed capture files, each college's newest read by run only. Run at College of the Desert (8 not printed in the 2026-2027 catalog, 20 with no own page), City College of San Francisco (none in scope) and Santa Rosa Junior (2, no own page); `kb/status/program_discontinued.json` holds 9 flagged and 8 not printed, and a not-printed program is a candidate for a prior-year read (`CAPTURE_PRIOR`), never a flag. **FINDING** `f-rule-d-cannot-reach-dropped-records-s687`: rule D reads only committed records that place none, so programs whose files S683's filing dropped while their live rows stayed (CCSF's 20 no-page programs) are out of its reach. Runs and control numbers: lessons, *S687*.

**NEXT, in order:** (0) The RCCD pilot (#3438, S671; `d-rccd-pilot-no-blind-force-s671`) stands: never force a re-extraction blind, read the failing pages for free first. (1) Read a PR's whole thread before its merge or any apply of a file it carries (`p-apply-before-thread-read-s685`); the S685 and S687 wave, #3557 and #3558 are landed. (2) **Rule D's next step:** a prior-year read (`CAPTURE_PRIOR`) for College of the Desert's 8; after it, `--capture` is no longer needed. COBIx's third point on #3569 is fixed (S688): `committed_not_printed` walks a college's reads newest first, and an older read's mark stands for a control number no newer read covered (`read_covers`: fingerprinted, not found, claimed or challenged); a read filed before fingerprints counts as the whole college. (3) **The reread plan's third ten:** Sierra, Barstow, Pasadena City, Rio Hondo, Los Angeles Harbor, College of San Mateo, College of the Sequoias, Fresno City, Contra Costa and Madera; the stop is $40 per college per run (`d-reads-stop-is-forty-dollars-s685`); space the dispatches out, one pending run per concurrency group (`p-read-dispatches-share-group-s687`, `p-runner-pool-starves-migrate-s683`); a `sources_from` read needs the branch to file that run's preview (`p-sources-from-needs-filed-preview-s687`). (4) **Keep-the-better's follow-ups, a plain session's:** `needs_load` (a record with no live row names `step=load`, never a reread; compare run ids rather than test inequality; print the live read's time beside `receipt_on_branch`; COBIx on #3558); a no-ending address two awards share counts as the program's own only when no other program at the college with the same bare title has another award kind (replay the 292; COBIx on #3557); teach `slug_awards` the endings (`-certificate` 567, `-ca` 204, `-cert` 84, `-for-transfer` 76 of 1,708). (5) **The display:** the keyset confirm is done and build `3361e3aa5b7d` is confirmed; the next build after the next posts, then `harvest-gap-census.yml` on `main` against 5,145. (6) Copper Mountain's catalog address answers 404: find the current one; #3536's `challenged` follow-up. (7) Cheap piles: the narrower A5 with its self-check; the `no_units_printed` wording (9 records); the six `NOTE_PAIR_ON` records to a person; #3508's finding 4; Sierra's reader of `together` (a plain session). (8) Step 11 ([`scheduled_sessions`](../scheduled_sessions.md)), outline readers, each on its `claude/slo-*` branch (`p-helper-reads-only-newest-file-s685`). **Reader fixes first, then re-add the trials** (`f-outline-readers-need-header-fixes-s685`): Feather River (`claude/slo-feather_river` 98a47f9a; full read 44535960153, 337 pages; 336 of 2,072 SLOs are the *Learning Outcomes* table header; standing test 24 of 26) and Palomar (`claude/slo-palomar` 78edbf37; trial 44536105509 filed the objectives section and table headers as SLOs). **The index search:** San Diego College of Continuing Education (reindex 44536348461, 0 of 242) and Rio Hondo (discover 44508907581): `search_all` in `kb/_course_outline_index.py` presses Search when no NewSearch request arrives. **CCSF:** COBIx's comment 7015803401 on #3533 gives an anonymous route, `ccsf.curricunet.com` `POST /Search/NewSearch` with clientIds [57] and clientEntityTypeId 150 (1,975 Active courses; report 28 prints SLOs); `route_of` must accept `curricunet.com` and its census row must name that host. Peralta (one code holds up to four colleges' records), Mt. San Antonio (#3537), Saddleback and Irvine Valley (status words other than *Active*). A plain session adds the standing test to `course-outcomes-load.yml`. (9) Lassen: the structured-fields migration's step 1, Lassen first; 31297, 35106 and 41912 held. (10) Cosumnes River (#3500): the paid read waits on a named-programs-only input. (11) #3293, parked as issue #3525: decide in a plain session. (12) #3502's reader changes, cheapest first, with the two changed-page records (figures: lessons, *Moved from the lane (S685 checkpoint)*). (13) Ruling 3's self-recall run (`CPL_GE_AREA_SLOT_FILL=1`), then a PR sets the default on. (14) The `NCL_EXTRACT` switch after the Commons sidecars hold `no_state_list` records back; then #3414's refusal probe. (15) The teach-out rule (#3491), after a runner capture. (16) Los Medanos's and Los Angeles Valley's program rules, with a person. (17) Confirm the harvest card shows #3465's `spent_usd`. **For a person:** Cerritos 44984 (`held_for_person`, S687); West Los Angeles 38677 (`held_for_person`); Los Angeles Mission 44849 (no live row); Los Angeles City 32832 (live run 39006380342, `main` files 43212072618); Ventura 45355 and Shasta 18153 (`held_for_person/`, S684). Older lists: lessons, S653, S666 and *Moved from the lane (S684 checkpoint)* and *(S685 checkpoint)*.
🔨 **The catalog sweep (S394-S414):** its standing rules: lessons, *Moved from the lane (S648)*.

**Grok (waits on billing), the light index, flags:** lessons archive 5, *Moved from the lane (S645)*.
