---
title: "Program requirements harvest — lane state"
created: 2026-10-03
updated: 2026-11-28
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

**Standing rulings, slices and decisions, S334 to S668** (Sheets 23 to 77; Phase 2; catalog-first collection; slices A, B and C; the course-id rescore; a GE-pattern page's one owner; the catalog sweep; Grok; the passing dry run; the structured-fields design; S639's five decisions): every pointer and slug as it stood, lessons archive 9, *Moved from the lane (S714 checkpoint)*. They stand.

**Older standing pieces** (the pilot, Phase 1: 20 records pass all four checks, capture `kb/_program_requirements_pilot.py`, guard `tests/program_requirements_pilot_test.py`; catalog addenda, `program_source_addenda`; outcomes beside the credential skills; the Cerritos Ironworker proof, the page reader `kb/_college_page_read.py` and `program_source_procedure_set`): each as it stood, lessons archive 9, *Moved from the lane (S714 checkpoint)*.

**A refusal is on the college's record (Sam, sheet 29 card 3, revised 2026-10-17; `sam-sheet-29-revised-refusal-workarounds-2026-10-17`).** ⚠️ **Automated reads still name the CPL Initiative in the user agent and still respect blocks and robots.txt.** The paragraph as it stood: lessons, *Moved from the lane (S653 checkpoint)*.

**Sam's ruling (2026-10-04): no Governance pass**, everything is public record; the tab shows its records marked **Beta draft** (vault braindump `braindump-2026-10-04-1115-program-requirements-tab-public-record.md`). The paragraph as it stood: lessons, *Moved from the lane (S684 checkpoint)*.

**The tab is in COBI** (Beta draft, #1860, `program_requirements.js`; five views: Progress, Catalogs, Sequences, Procedures and the List; no Sierra, Sam 2026-10-14): the paragraph as it stood, lessons, *Moved from the lane (S681 checkpoint)*.

**The List (`#program-requirements/list`):** one row per active COCI program, read only, and the workspace (a program's side panel carries its record's card). The paragraph as it stood: lessons, *Moved from the lane (S680 checkpoint)*.

**CPL Pathways reads the ROEP record (Sam, 2026-10-04 ~17:20Z):** every record shows, checked or not, each marked; no record is edited by hand. The paragraph as it stood: lessons, *Moved from the lane (S653 checkpoint)*.

**CPL Pathways (S744, S745):** verbatim in [`roadmap_archive_8`](../../roadmap_archive_8.md), *Moved from lanes/program-requirements-harvest (S746 checkpoint)*; the record is [`cpl_pathways_lessons`](../../cpl_pathways_lessons.md).
**LIVE (S746, the record: [`cpl_pathways_lessons`](../../cpl_pathways_lessons.md)):** (a) the display build reads
MAP's live view (`kb/exhibits_adoption.json`) as a third CPL-here source (`adoption_index`, #3927): 2,395 programs gain
CPL here, 1,573 from none; Cerritos Field Ironworkers 24 of 24, up to 38 units (`f-cerritos-ironworkers-all-24-cpl-s744`
closed), applied as build `229a759101f7`. (b) *Trained by* on the program card (#3925, `kb/_build_program_certs.py`
`trained_by`): **DECIDED** `d-trained-by-committees-only-s746`, training committees only; a bare JATC takes its issuer's
acronym or the issuer; **FINDING** `f-trainer-field-names-one-site-s746` (the field names one college's site on widely
articulated credentials), so widening waits on a cleaned field. (c) Request Adopt in one form on every view (#3930,
**DECIDED** `r-request-adopt-one-form-sam-2026-11-28`; Sam: *"That looks good. please use it"*, *"yes, that's the way to
go. please roll with it"*): the `adopt_panel.js` chip on catalog cards and featured rows, *Request Adopt (N)* and a
*Request Adopt* per row on the B.S. directory, one sidebar, and each credential's MAP line ONE link to the nearest
college's exhibit (`map_links.js` `nearest()`). **FINDING** `f-coci-description-shards-mojibake-s744`: `coci_lookup_desc_*.js`
carries `_x000D_` and cp1252 mojibake. **NEXT (CPL Pathways):** (none from S747). **DONE (S747):** the 06:26Z daily run lists
Cerritos Field Ironworkers' Trained by as Ironworker JATC with the Reinforcing and Structural Period credentials; the
description shards are cleaned at build (#3942; #3943 moves the repair into `kb/_text_repair.py`): `clean_desc` in `kb/_build_coci_lookup.py` decodes Excel's `_x000D_` (78,796)
and repairs cp1252 mojibake, single and double (26,533 of 130,478 descriptions changed, 7 of them only because the
900-character cut moved past an escape); guard `tests/coci_desc_clean_test.py`. **FINDING (S747)** `f-older-display-builds-are-unrefiled-reads-s747`: the 32 records at older
display builds (De Anza 15, Glendale 15, LACC 1, Mt. SAC 1) are earlier reads that no current capture files, so the
build never reaches them. The 2026–27 re-captures hold De Anza's 15 as `would_extract` (found, not yet extracted) and
the other 17 as `not_found` near misses (Glendale Mass Communications A.S.: 3 of 21 listed courses on the page). They
stay as read, labeled with their catalog year; extraction and recall are the routine's collection. **DONE (S747):** the featured B.S. page counts the A.S. major
the catalog prints, the 19-unit core plus the Structural option, 38 units of CPL (was 31.5: Welding I and the Structural
option sat in an uncounted *in progress* section); Reinforcing shows as the alternate path; guard `tests/cpl_pathways.test.js`.

**The display build** (`kb/_build_roep_display.py`) writes each program's facts once, under one build stamp, to `program_requirement_records.display` (Sierra) and `cpl_pathways_roep_data.js` (the page); guard `tests/roep_display_test.py`. Its history (S327-S336): the lessons doc, *Moved from the lane (S346 compaction)*.

**Course objectives, collected with every SLO read (Sam, 2026-11-02):** `course_outcomes.kind` `objective`, never replacing an SLO row; the `objectives_reread_plan` has no step left; an objectives `.load` is written by hand. The paragraph as it stood: lessons, *Moved from the lane (S687 checkpoint)*.

**The nightly SLO read (Sam, 2026-11-01):** step 11 of [`scheduled_sessions`](../scheduled_sessions.md); the standing test runs before any `.load` (`p-outcome-load-without-standing-test-s681`). The paragraph as it stood: lessons, *Moved from the lane (S687 checkpoint)*.

🔨 **The reconcile pass (S392; `sam-reconcile-pass-after-harvest-2026-10-14`):** `kb/_program_requirements_reconcile.py` applies each college's steps (`kb/program_requirements_reconcile.json`) at extraction and on filed records (`step=reconcile`, no model call). The paragraph as it stood: lessons, *Moved from the lane (S647)*.

🔨 **Sam's rulings of 2026-11-17** (#3461, [`sam_rulings`](../sam_rulings.md); carried out in #3478, applied by run 44224714543, S679): the general education open slot stays OFF behind `GE_AREA_SLOT_FILL` until its self-recall run (NEXT (12)). The paragraph as it stood: lessons, *Moved from the lane (S691 checkpoint)*.

**Parked, displayed or standing as filed earlier** (Los Angeles Valley and Los Medanos parked; eleven colleges, Monterey Peninsula to Butte; Redwoods and De Anza open; a choose-courses list's printed units are its floor, Sheet 144 card 2): lessons, *Moved from the lane (S644)*. **A refused read follows [`blocked_sources`](../blocked_sources.md) before any card.**

**Running a college:** `program-requirements-college.yml` (`college`, `extract` default `1`, so leaving it out spends; `limit`, `step`, `force` adds programs and never limits; `route`). A run files to the branch it ran on: a paid run goes on the college's branch, never `ref main`.
**A wave** (`program-requirements-wave.yml`, #3191): up to eight colleges on distinct hosts, one branch, one PR, one filing job, no table written (lessons, *Running a wave*). **DECIDED** `d-wave-one-branch-hard-stop-s644`, `d-wave-price-rate-floor-s644`.
**The display apply (#3190, #3204, #3495):** `step=display` writes the whole build, `display_college` one college; no display receipt is committed (the private bucket `cpl-receipts` holds it). The two paragraphs as they stood: lessons, *Moved from the lane (S687 checkpoint)*.

**Display build `229a759101f7` is live** (S746, #3927 `8ae97588`, run 46092611343 on `main`): 18,751 records at the build, 32 at three older builds (`0874a3a15f22` 16, `bef8ef819af7` 15, `4c57fd250cce` 1; reads no current capture files, S747). It reads MAP's live view (`kb/exhibits_adoption.json`) beside the dated feed. Cerritos 42158 reads up to 38 units in the table Sierra reads. S748's 41 records wait on the next build (NEXT (2)). The census at S748's start (46089216929 on `main`, 00:44Z 2026-11-28): 15,680 of 20,282 active programs pass at 118 colleges, 3,927 have no passing record, 675 are collected with a named gap. S748's closing census: 46141774235 (2026-11-28 11:55Z): 15,698 of 20,282 pass, 3,888 without a passing record, 696 collected with a named gap.

**Standing pieces moved at the S739 checkpoint** (the extraction gate and one spend meter, `d-extraction-gate-every-run-s653` and `d-one-spend-meter-s654`; cheap piles under Sam's collect-with-gaps ruling, `sam-collect-with-gaps-2026-11-17`; the unblocker step, `scheduled_sessions` step 12; Rule D, `d-rule-d-from-committed-previews-s687`): each as it stood, lessons archive 9, *Moved from the lane (S739 checkpoint)*. They stand.

**The reader's page checks (#3514, #3587, #3590) and the reread waves** (rules A to D and `fold`; `refused_filed`; keep-the-better; the S683 reread plan, worked through row 73 in S691; the $40 stop per college per run, `d-reads-stop-is-forty-dollars-s685`): the paragraph as it stood, with its slugs, lessons archive 9, *Moved from the lane (S714 checkpoint)*.

**S742's posts:** verbatim in [`roadmap_archive_8`](../../roadmap_archive_8.md), *Moved from lanes/program-requirements-harvest.md (S745 checkpoint)*.

**Decisions of S742:** verbatim in [`roadmap_archive_8`](../../roadmap_archive_8.md), *(S745 checkpoint)*.

**S748's posts** (`m-collection-s748`; the land #3945 `cd464091`; Mt. San Antonio's land #3946 `852db460`): 41 records collected and live, no outline rows, paid reads about $0.34. By guarded plans 24: named gaps under s748a, s748k1, s748r1, s748b, s748g1 and s748r2 (21, at Butte, Santa Barbara City, College of the Canyons, El Camino, Orange Coast, East Los Angeles, Allan Hancock, Mt. San Antonio and Sierra) and coverage read true under s748c's reading `state_course_not_on_page` (Orange Coast 43100, Fullerton 18749, 36863). By rereads and loads 17, each with its arithmetic equal: Cuyamaca 18637; San Bernardino Valley 04894, 31858; Coastline 43057; Orange Coast 08626, 08663; Lassen 18752, 18756; College of Alameda 32765; Mt. San Antonio's eight. New code in the land: Coastline's staging fix (a bound pin's page stages as read); reconcile steps at San Bernardino Valley, Lassen and College of Alameda; Lassen's guard `only_cal_getc`; plan modules `kb/_program_piles_s748*.py`. Each count, run id and verdict: lessons, *S748*.

**Decisions of S748** (the conductor's, each reversible; rows in `cpl_memory`, one line each in handoff 749): **DECIDED** `d-no-display-build-at-start-s748`; **DECIDED** `d-list-minimum-units-refused-s748`; **DECIDED** `d-census-change-left-out-s748`; **DECIDED** `d-found-pages-probe-held-s748`; **DECIDED** `d-sierra-21525-not-reread-s748`; **DECIDED** `d-canyons-37868-not-rerun-s748`; **DECIDED** `d-hancock-s681-entry-is-lane-assignment-s748`.

**NEXT, in order** (Sam's work order of Nov 20 ranks collection by the M-ID cards each fix unblocks, `r-collect-for-mids-work-order-sam-2026-11-20`: outline fills first, program records second, **DECIDED** `d-mid-ranking-orders-lane-1-s690`; every block is listed until the Commons shows it, `r-a-block-is-a-block-sam-2026-11-21`): (0) Standing, each with its slug: lessons, *Moved from the lane (S748 checkpoint)* and *(S742 checkpoint)*, NEXT (0), and [`conductor_mode`](../conductor_mode.md). The ones that bite first: never force a re-extraction blind (`d-rccd-pilot-no-blind-force-s671`) and never rerun a read or a load whose result is unexplained (`d-west-valley-no-blind-rerun-s727`); read a PR's whole thread before its merge or any apply of a file it carries (`p-apply-before-thread-read-s685`); a records change reruns both Commons builders (`p-check-generated-misses-commons-data-s697`); the conductor alone writes `.apply`, after an APPLY verdict and a clean pre-read, on its own apply branch (`d-conductor-owns-applies-s720`, `d-applies-on-own-branch-s742`); a paid read goes on a sibling branch (`p-paid-read-on-sibling-avoids-cancel-s742`); a worker's push counts once `git ls-remote` shows its head (`p-worker-push-proved-by-ls-remote-s731`). S748's: a recall's oracle is independent of the rule it tests and a plan's test turns red when a guard is removed, asked for in every brief (`p-recall-oracle-restates-rule-s748`); a reader reports once, after its background jobs end (`p-worker-handback-repeats-s748`). (1) **Outline readers** (step 11, [`scheduled_sessions`](../scheduled_sessions.md)), by the M-ID cards each improves (`f-outline-ranking-s691`): the queue is empty until a census, a harvest capture or a verdict row changes; De Anza, Palo Verde, College of Marin and Antelope Valley each wait on a reader; the standing test in `course-outcomes-load.yml`, the staff-names question and the 12 still-taught hand-ins: lessons, *Moved from the lane (S727 checkpoint)*, NEXT (1). **For a person:** delete the 30-day artifact `course-outcomes-45026998155-part1` (`p-lan-not-outcomes-only-filed-names-s703`). **Golden West's 476 header rows** (`f-golden-west-476-header-rows-s690`; plan on `claude/s690-goldenwest-header` 0995d8b5) wait on a plain session's review. (2) **The display build** carrying S748's 41 records, once no apply is in flight, gate college Glendale, then `harvest-gap-census.yml` on `main`. (3) **The found-pages change, round 2**, the largest lever found (`o-found-pages-194-programs-s748`; `claude/s748-readers-found` `e77ff6a8`, off for every college; Skyline's flag on `claude/s748-readers-found-skyline`, which holds S748's free capture): the capture's lookup finds the own page of a program with no closed list and nothing files it as the source. Before any paid read: the extract function accepts an empty closed list (`chatbox/supabase/functions/program-requirements-extract/index.ts`, lines 480 to 484, answers 400 today); `score()` sets coverage false with a named gap at zero listed courses; the opt-in is tied to a per-college open-setting recall. Then a Fable second reader, a one-program paid probe (Skyline 05809), then 194 programs at 14 colleges for about $19 (the list: handoff 749's log, 08:22Z). **DECIDED** `d-found-pages-probe-held-s748`. (4) **The census reads college-named gap files** (`claude/s748-keys` `50bedbf7`, reverted in the land; **DECIDED** `d-census-change-left-out-s748`), fixed per its reader: keep the 78 in the gap under their own cause; apply only where no live row exists; pin `main()`'s hand-in. (5) **Cosumnes River's `set` step** (`claude/s748-keys-crc` `6a4fe94a`; reaches 04600, 12792, 45317; the local pattern is on PDF pages 84 to 86): `tests/program_requirements_reconcile_test.py` pins the college free of a `ge_units` set step, so the test changes with it, under a second reader. (6) **The 11 coverage-omits records to assign** under the reading `state_course_not_on_page`, evidence standing: Cerritos 02235; Citrus 02333; Marin 46242; Diablo Valley 39775; Foothill 11827, 43194; Irvine Valley 44922; Madera 39810; Palomar 08929, 22528; Porterville 33085. (7) **College of the Canyons 37868:** read the log of the failed paid read 46121986278 before any rerun (**DECIDED** `d-canyons-37868-not-rerun-s748`). (8) **Reader changes:** Reedley 30465; Los Angeles Pierce 19181; Grossmont 21402; Mt. San Antonio 43777 and 43999 (department headings); Sierra's `or_units` step (40181, 31922, 31923); Allan Hancock's 27 found pages ride (3). (9) **The follow-up PR** (after the waves): first the Porterville 06773 guard (`f-porterville-06773-flips-on-reconcile-s731`; no Porterville reconcile before it), then the minors, old (lessons, *Moved from the lane (S748 checkpoint)*, NEXT (6)) and S748's (lessons, *S748*, *Readers' MAJORs and MINORs*). (10) **Holds S748 did not reach** stand as the moved text lists them (lessons, *Moved from the lane (S748 checkpoint)*, NEXT (3) to (5)): San Jose City 18449; San Diego City 22352, 38732; Cabrillo 11293; Contra Costa 33660; East Los Angeles 31017 (54-61 around the printed 60; **DECIDED** `d-list-minimum-units-refused-s748`); Santa Barbara City 30746; Sierra 21525 (a tie, **DECIDED** `d-sierra-21525-not-reread-s748`); West Valley 35588; Southwestern, Pasadena City, Antelope Valley and Mission; Saddleback's `repeat` window before its next read (`f-saddleback-repeat-window-s731`); College of the Desert behind robots.txt; Los Medanos parked; Glendale 44488 the college's call. Then a fresh census's wave over its largest gaps (`f-yield-from-census-gaps-s748`). (11) **Older levers, the printed-course files and the older queue:** lessons, *Moved from the lane (S748 checkpoint)*, NEXT (7) to (16). **For a person:** San Jose City 22225 (held on `claude/s748-paid-sjcc`; the state's "RealEstateRE" names two courses); Allan Hancock 19928 (HUSV 120 and 170 may be alternatives); Sierra 33639 (confirm the degree total 60); Reedley 20762 (filed passing from 30465's page); Solano 43134; Santa Monica 43767; the 30-day artifact above; the records s727f held and the older lists: lessons, *Moved from the lane (S748 checkpoint)*.
