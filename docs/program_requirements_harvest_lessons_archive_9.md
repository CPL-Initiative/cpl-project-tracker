---
title: "Program requirements harvest lessons — archive 9 (S714 onward)"
created: 2026-11-25
updated: 2026-11-25
tags: [lessons, archive, program-requirements, catalog-harvest]
kb-status: internal
obsidian-folder: cpl-project-tracker/lessons
related:
  - docs/program_requirements_harvest_lessons.md
  - docs/program_requirements_harvest_lessons_archive_8.md
---

# Program requirements harvest lessons — archive 9

Sections moved verbatim from [the lessons doc](program_requirements_harvest_lessons.md) when it neared its budget (S731 checkpoint compaction). Archive 8 holds S687 to S713.

## Moved from the lane (S714 checkpoint, 2026-11-23)

Verbatim from `docs/reference/lanes/program-requirements-harvest.md`, as the lane stood before the S714 checkpoint (relative links re-pointed to this folder); the lane keeps the current text.

**Standing rulings and slices, S334 to S668** (Sheets 23 to 77, 38, 39 and 42; Phase 2; S640 to S651's standing decisions; catalog-first collection, `sam-catalog-first-collection-2026-11-14`; slices A, B and C; the course-id rescore; a GE-pattern page's one owner; the catalog sweep; Grok; the passing dry run; the structured-fields design): each pointer as it stood, lessons, *Moved from the lane (S690 checkpoint)*. They stand, with **DECIDED** `d-passes-live-stays-equal-only-s644`, `d-catalog-first-slice-order-s652`, `d-prefix-alias-evidence-rule-s652`, `d-crsid-seven-retire-ten-stay-s653`, `d-ncl-page-yield-s668`, `d-no-list-record-scored-without-state-list-s668`, `d-named-course-minimum-one-s667`, `d-passing-dry-run-held-for-cobix-s651`, **PITFALL** `p-mis-codes-carry-record-id-suffix-s652`, `p-new-matcher-needs-self-recall-test-s652` and **PROCEDURE** `p-yield-holder-live-row-after-filing-s668`.

**The pilot (Phase 1): all 20 records pass all four checks** (Cerritos, Mt. San Antonio, Riverside City, West LA, Miramar; Sam read them, 18 matched and both fixes went in). Capture `kb/_program_requirements_pilot.py`, extraction the `program-requirements-extract` Edge Function, scorer `kb/_program_requirements_score.py`; guard `tests/program_requirements_pilot_test.py`. Detail: lessons, S372.

**Catalog addenda** (`program_source_addenda`; 79 listed at 52 colleges; the eight amending loaded colleges read, S387-S388; the other 71 as the reader reaches their colleges): lessons, S394.

**Outcomes (Sam, 2026-10-04):** course and program outcomes beside the harvested credential skills, in `course_outcomes`, read nightly (below); the skills comparison waits for `kb/reference/industry_credential_skills.json` (lessons, S413).

**The Cerritos Ironworker proof of concept, the page reader (`kb/_college_page_read.py`) and one procedure record per college** (`program_source_procedure_set`): lessons, *Moved from the lane (S668 checkpoint)*.

**Decisions of S639 that stand:** `d-lacc-heading-minimum-60-s639`, `d-occ-up-to-ge-maximum-s639`, `d-hours-meets-top-term-length-s639`, `d-rio-hondo-cal-getc-areas-count-s639`, `d-west-valley-cal-getc-areas-count-s639` (Sam's go of 2026-11-11: lessons, *Moved from the lane (S668 checkpoint)*).

**The reader's page checks (#3514, #3587, #3590) and the reread waves** (rules A to D and `fold`; `refused_filed`; keep-the-better, #3553, #3557 and #3558; the plan `kb/program_requirements_reread_plan_s683.json`, 444 records at 73 colleges, worked through row 73 in S691): the paragraph as it stood, lessons, *Moved from the lane (S691 checkpoint)*. They stand, with **DECIDED** `d-reads-stop-is-forty-dollars-s685` and `d-reread-gate-same-page-calls-s690`, **PITFALL** `p-sources-from-repays-refused-pages-s689` and **FINDING** `f-reread-drops-files-live-rows-stay-s684`.

**S713's posts** (`m-collection-s713`, `m-outlines-s713`; #3705 `1d8b5cfd`, #3707 `7a67b1de`, #3709 `9f529482`, #3710 `62309028`): 42 records applied and live, no paid read: Santa Rosa Junior 15 (5 pass on a common course number printed in parentheses, 10 `section_cut_off`), Las Positas 4 and Antelope Valley 4 by general education steps, Glendale 13 and Clovis 6 by wording rules. Outlines: the four Peralta colleges 3,731 rows, City College of San Francisco 3 new (1,416 kept). City College of San Francisco's 53 page-finding programs: 47 named gaps, 6 held, $0.17. Run ids: lessons, *S713*.

**Decisions of S713** (the conductor's, each reversible; rows in `cpl_memory`): **DECIDED** `d-routine-takes-next-free-number-s713`, `d-peralta-load-cleans-labels-first-s713`, `d-ge-steps-three-colleges-s713`, `d-ge-01037-held-double-count-s713`, `d-plan-rows-change-a-verdict-s713`, `d-srjc-cut-off-holds-two-s713`, `d-glendale-minors-before-apply-s713`, `d-ccsf-45768-existing-gap-s713`, `d-ccsf-one-pr-s713` and `d-cancel-merge-push-page-read-s713`. S703's decisions stand: the paragraph as it stood, lessons, *Moved from the lane (S713 checkpoint)*.

**NEXT, in order** (Sam's work order of Nov 20 ranks collection by the M-ID cards each fix unblocks, `r-collect-for-mids-work-order-sam-2026-11-20`: outline fills first, program records second, **DECIDED** `d-mid-ranking-orders-lane-1-s690`; every block is listed until the Commons shows it, `r-a-block-is-a-block-sam-2026-11-21`): (0) Standing: never force a re-extraction blind (`d-rccd-pilot-no-blind-force-s671`); read a PR's whole thread before its merge or any apply of a file it carries (`p-apply-before-thread-read-s685`); revert a timestamp-only bot commit on a PR head (`d-revert-stamp-commit-for-test-s688`); on a bot receipt head push a real change or dispatch `js-tests.yml` on the branch, never an empty commit (`p-bot-receipt-head-runs-no-test-s697`, `p-bot-receipt-head-dispatch-js-tests-s713`); build a generated file with Python 3.12 ([`methodology-a-generated-file-is-built-with-the-runners-python`](kb-notes/methodology-a-generated-file-is-built-with-the-runners-python.md)); after a records change run both Commons builders and `tests/commons_data_status_build_test.py`, which `check_generated.sh` does not (`p-check-generated-misses-commons-data-s697`, `p-commons-files-conflict-between-prs-s697`); merge records PRs one at a time (`p-records-prs-merge-one-at-a-time-s703`); a new rule's self-recall holds answers its own fields did not supply: a claim check on the record's notes against today's capture, boundary readings and a precision count (`p-self-recall-reads-rule-fields-s703`, `p-claim-check-reads-current-capture-s713`, [`methodology-a-test-must-not-take-its-rule-as-the-truth`](kb-notes/methodology-a-test-must-not-take-its-rule-as-the-truth.md)); a pre-read counts matching and carried confirms and the apply aborts above 0 (`p-confirm-verdict-marks-checked-at-apply-s713`), and it may compare md5 hashes in place of before-values (`p-compact-preread-by-md5-s713`); a merge-commit head starts no page read, so dispatch by plan name (`p-merge-head-push-starts-no-read-s703`); `test` appears only after `lints` (`p-test-check-after-lints-s703`); fetch the shared clone with `--shallow-since` or `--deepen` (`p-shared-shallow-clone-reshallows-s713`). (1) **Outline readers** (step 11, [`scheduled_sessions`](reference/scheduled_sessions.md)), by the M-ID cards each improves (`f-outline-ranking-s691`): Saddleback, Rio Hondo, Irvine Valley, San Diego College of Continuing Education (objectives only) and the four Peralta colleges (#3684, load 45127831747) are loaded. City College of San Francisco's read 45128775065 loaded 3 new rows (load 45148533372; 1,416 match S690's live rows) and rides one PR with the college's 53 (`claude/slo-ccsf`). Next: `python3 scripts/next_slo_colleges.py --next` on `main` once that PR merges. **For a person:** delete the 30-day artifact `course-outcomes-45026998155-part1`, whose shape-trial pages print an Originator's name (`p-lan-not-outcomes-only-filed-names-s703`). Then the standing test in `course-outcomes-load.yml` and the staff-names question (`q-trial-pages-file-staff-names-s689`). The 12 still-taught courses' hand-ins carry no outline text (`f-still-taught-hand-ins-no-outline-text-s691`). **Golden West's 476 header rows** (`f-golden-west-476-header-rows-s690`, `d-golden-west-before-values-filed-s691`; plan on `claude/s690-goldenwest-header` 0995d8b5): the guarded correction waits on a plain session's review. (2) **The night's one follow-up** (after the waves): SDCCE's 6 SLO-label rows, which the Commons shows as outcomes; Peralta's minors (five SCANS lines at COPED 452A and DENTL 222, Merritt ART 080's "For 2/3 units", three latent label shapes and a SCANS run that swallows the line after it, `next_slo_colleges.py`'s skip for `lan`); the lists gap's state-file notes (Los Angeles Harbor 44271, Los Angeles Trade-Technical 44345 and 45670); Orange Coast 03997, 08668 and 12159; the hours reconcile eight (Laney 5, De Anza, Mendocino, Coastline); Mt. San Antonio 43777 and 43999 (capture reach); Glendale's data-names-the-program lever; the coarse-net hyphen (`f-sjdelta-apprenticeship-coarse-net-s691`); the `sources_from` pinned refusal (`p-sources-from-refuses-pinned-refused-s703`); the `through` window's `until` field. COBIx's four: `f-cobix-minors-s713`. (3) **City College of San Francisco:** 20 not printed stay unnamed (`d-ccsf-20-not-named-s691`); its Cal-GETC dry run (32080, 33652, 46300), refused twice by the permission check, is a plain session's and a block. Its 53 page-finding programs: 47 named gaps (`no_record_s713.json`; Cal-GETC 45768 under the existing `ge_pattern_certificate` gap); 7 own pages pinned; 17954 read for $0.17 and held (its lists add to 4.0-13.0 against the printed 18.0); 09178, 17952, 31602, 36964 and 42318 held for a list or wording rule (`held_s713.json`). Its 28 wording rules wait for a later run. College of the Desert's 8 keep their gap (`f-desert-prior-catalog-behind-robots-s689`). (4) **Program records' open levers:** Glendale 38973 is `page_challenged` (#3675, the host's bot check). Page-finding: `levers` next at Mt. San Antonio, Santa Barbara City and Orange Coast where #3686 did not reach, and Santa Ana's program pages from its filed credit catalog (#3669). College of Marin's program URLs changed form, so the moved-page guard stopped its general education step on 19789 and 19791: a capture or guard fix first. Cerritos 20504 waits on 44984 (`d-cerritos-20504-waits-on-44984-s697`). Copper Mountain's catalog moved (`f-copper-mountain-catalog-moved-s689`). (5) **Cheap piles** (free rule work): applied in S713, Santa Rosa Junior 15 (#3705), the general education steps 8 (#3707) and Glendale's 13 (`claude/s713-piles2`), each rule in lessons, *S713*. In review: Clovis's 6 (`s713-piles2-clovis` 2f42cdb9); its `lab_pairs` reading moves 10 records elsewhere, none written. Held by key: Santa Rosa Junior 06566 and 32298; Santa Monica's 26 (6 wait on a runner page-text step, 17 a reread, 3 a person); Las Positas 01037 (double counting), 09227 and Antelope Valley 39295 (still failing after the step, so no plan row); Glendale 32607, 36416 and 45068 (rereads) and 44488; Clovis's 11 (33432 the pinned reread, 33489 a fill step, six rereads, three for a person). The other 10 of S703's 21 general education holds sit at lane 1's colleges; S703's 19 hours and 29 lists holds stand. Lake Tahoe's 13 sit on quarter units with no ruling. Los Medanos stays parked. (6) **The printed-course files** (`m-printed-catalog-courses-s690`, **DECIDED** `d-course-rows-gzipped-s690`): 17,341 printed courses at 16 colleges; no committed pipeline yet fills an M-ID card's missing description from them; the rest of the item: lessons, *Moved from the lane (S703 checkpoint)*. (7) **The display and the census:** S713's build is live (above); the census after the night's merges: handoff 714. The next build carries the 21 records applied after it and Clovis's 6 once applied. (8) Lassen: the structured-fields migration's step 1 ([`reference/roep_display_structured_fields_design`](reference/roep_display_structured_fields_design.md), #3296); 31297, 35106 and 41912 held. (9) #3293, parked as issue #3525 (`d-passing-dry-run-held-for-cobix-s651`): a plain session decides from the issue. (10) #3502's reader changes, cheapest first. (11) Ruling 3's self-recall run (`CPL_GE_AREA_SLOT_FILL=1`), then the default on. (12) The `NCL_EXTRACT` switch after the Commons sidecars hold `no_state_list` records back; then #3414's refusal probe. (13) The teach-out rule (#3491), after a runner capture. (14) Los Medanos's and Los Angeles Valley's program rules, with a person. (15) Confirm the harvest card shows #3465's `spent_usd`. **For a person:** the artifact above (S703); Antelope Valley 43028 and De Anza 45499, Santa Monica 03281, 10345 and 43765, Glendale 44488, Clovis 33501, 36326 and 39539 (S713); College of the Canyons 43388 and West Los Angeles 46261 (S691); Napa Valley 19126, 31158 and 36528 (S690); Los Angeles Harbor 44947; Cerritos 44984; West Los Angeles 38677; Los Angeles Mission 44849 (no live row); Los Angeles City 32832; Ventura 45355 and Shasta 18153. Older lists: lessons, S653, S666, *Moved from the lane (S684 checkpoint)* to *(S713 checkpoint)*.

## S714 (SkyFulmar, the CPL Queue routine's 11:12Z collection run of 2026-11-23): 93 records, Los Rios's three paid reads, the fill over cut-off windows

**What happened.** The 11:12Z firing found S713's checkpoint #3704 updated at 11:11Z, a live session at its last
step, so it waited for that sign-off (merged 11:31Z, `3145d379`) and took the queue then. Sam's plain session S712
(SkyPuffin, #3712) had declared its files and its three probe colleges; the run stayed off them. Handoff 714 named
this session SkyFulmar, Session 714. It declared on draft #3713 holding handoff 715, and moved to 716 when #3712
merged handoff 715 at 11:52Z (`d-routine-takes-next-free-number-s713`). Step 11's outline queue was empty (120
colleges: 39 done, 4 held, 5 none, 72 skipped; census 44695851118), so both lanes worked program records: lane 1
`rios` on the Los Rios colleges' programs whose extraction placed none of the state's courses; lane 2 `piles` and
`piles2` on City College of San Francisco's 28 wording rules, then East Los Angeles, Fullerton and College of the
Sequoias, with the `option_parts` follow-up at seven colleges. The display build waited for a slot and had not run at
the checkpoint. Sam's plain session S715 (SkyAlbatross) opened #3717 and #3718 on the Subjects page beside the run.
Merged on a green `test`, each thread read: #3714 `f0d84966` and #3716 `890eb465`; #3715 and #3719 were open at the
checkpoint. Nothing waited on Sam, and he gave this run no ruling; the run acted on his word to S712 (01:53Z, handoff
715: *"No need for the Cobix check ins for now"*) and stopped its COBIx watcher at 12:58Z
(`d-cobix-watcher-stopped-on-sam-word-s714`). The split changes are in handoff 716.

**The numbers.**
- **Program records, lane 2, no paid read**, each rule with a claim check on today's capture, boundary readings and a
  precision count before its second read:
  - City College of San Francisco (#3714): `course_renumbers` for the file's cross-listed and misprinted codes (LALS 9
    and LGBT 9 for LALS/LGBT 9; CNIT 133I for the file's "CNIT 133l") move 30897, 35690, 40704, 40876, 46323, 46324
    and 46326; `option_parts` (blocks of one option group whose names open with the same "Option N" are one option)
    moves 42228. Precision 29 of 29, claim checks 10 stand, 25 boundary readings right. Applied first
    (`d-apply-before-reach-fix-s714`): migrate 45176130201, 8 of 8 live. The second reader's two majors sat in the
    reach count and the test: scored against each record's own state list, `option_parts` changes 15 records
    elsewhere, 10 to passing, none from passing. 26 held by key (the receipt's `held`): 20 of the census's 28 and
    S713's six.
  - East Los Angeles (#3716): free page reads 45173124249 and 45173349853, reconcile 45176404274. The electives
    sentence read from a record's own plan line (6), a local degree's own double counting (`ge_overlap`, 4), its own
    high-unit waiver (LACCD GE 27 to 21, 2), a course taken twice (1), a printed code (1), and 45602 under
    `total_differs` (the page's courses add to 27 under "Total 24"). Precision 24 of 24, boundaries 30 right. Migrate
    45186909162, 15 of 15 live. The reader's majors: the electives scope ran past the next program's plan line (now
    bounded by `own_section_end`), and the branch needed `main`'s merge; rescoring 18,960 filed records then gave 0
    differences against `main`. 9 held.
  - The `option_parts` follow-up (#3719): the 10 records the reach found at seven colleges, less Santa Barbara City
    05934 (today's capture finds 31 of its option's 33 courses, ENVS 112 and ENVS 115 missing;
    `d-optparts-holds-05934-claim-check-s714`). Migrate 45188487600, 9 of 9 live: Foothill 06047, Glendale 24042,
    Golden West 18423, MiraCosta 18345, Monterey Peninsula 03653 and 22098, Reedley 01773, 18990 and 46449. Five more
    records' arithmetic moves without a verdict change, so they took no row.
  - Fullerton (in #3719, `d-fullerton-rides-3719-s714`): nine `course_renumbers` for the state file's campus-letter
    forms (`F HORT002` for the page's `HORT 002 F`, `CSTR 42` for `CSTR 042 F`) move 11 on coverage alone; the claim
    check reads free page read 45188452002. Migrate 45191999745, 11 of 11 live. Its reader dropped the `PE 248 F`
    renumber before the merge (the state file holds two PE 248 courses and the printed form matches the other one; it
    moved none of the 11 but rewrote 18166's score). 13 held. 18747's state list still names THEA 142 F and 149 F,
    printed now as THEA 148 F and 153 F ("formerly").
  - College of the Sequoias (`claude/s714-piles-sequoias` `51528086`): free reconcile 45194676517 files `ge_overlap`
    from each page's own words ("3 units may double count above in COS-GE"), and 14 move to passing (06715, 06718,
    06720, 06728, 06732, 06740, 06742, 06748, 06751, 06770, 10027, 11572, 19755, 37613); 8 held, 36073 among them (its
    page lacks "above"). Precision 22 of 22. Under its second reader at the checkpoint.
- **Program records, lane 1, Los Rios** (#3715): free page read 45167465999 printed every page of the hand-filed
  2026-27 catalogs; 38 programs pinned to their own pages (with `until`), six named gaps; free estimates $2.15, $1.76
  and $0.33. The second reader on the reader change held its first claim (624 reads on 78 pinned fixtures and 26,000
  fuzz calls, no window changed outside S714's pins) and moved Sacramento City 30620 (Active - Teachout Only) to a
  named gap (`teach_out_successor_printed`). Paid reads: Sacramento City 45181973475 (18 programs, $2.04), Folsom Lake
  45181983194 (3, $0.33) and Cosumnes River 45184653221 (16, $1.76; its first dispatch's pending run 45181979022 was
  canceled, `p-one-pending-run-per-branch-s714`). Free reconciles 45184748331, 45185759855 and 45187906040. 37
  records, 35 passing (Sacramento City 07334 is short of its GE units; Cosumnes River 35364 fails on outcomes). None
  had a live row, so each loaded (`p-load-skips-places-none-s714`): loads 45198701869 (18), 45199218981 (16) and
  45199758327 (3), all unchecked. Seven named gaps filed: Sacramento City 40117 and 46086 (`credit_not_in_catalog`),
  42373 (`ge_pattern_certificate`) and 30620; Cosumnes River 07320, 11330 and 35408 (`credit_not_in_catalog`).
  American River's 5 are blocked (`f-american-river-hand-filed-sha-mismatch-s714`).
- **The reconciles reached past the pins.** They rescored records outside the pinned programs: 16 lost their
  `ge_units_not_read` gaps (`f-rescore-drops-ge-units-not-read-gaps-s714`), so `rios` put back the 49 whose pass
  state did not move and Cosumnes River 07319, which the rescore turned failing. Nine newly passed. A Sonnet reader
  found 8 of them (Sacramento City 04656, 07350, 21418; Cosumnes River 04602, 04614; Folsom Lake 15368, 39574,
  42612) pass only through `main`'s program-level fill while each record's notes say its table opens mid-page with
  rows cut off, so their failing verdicts stand; all 9, 33542 with them, went back to `main`'s filings, never reread
  (`d-elective-fill-rereads-held-s714`).
- **Paid reads:** $4.13 in all, for 37 records. **Outline rows:** 0. **In all:** 93 records live, 90 passing, 1 named
  gap, 2 failing new records.

**Stopped or carried over.** #3715 and #3719 open, and College of the Sequoias' plan under its reader, at the
checkpoint; the display build and the census after the merges: handoff 716. The minors: the lane's NEXT (3).

**Lessons.**
- **The program-level fill passes a window the reader cut off** (`f-elective-fill-passes-cut-off-windows-s714`). The
  rule at about line 1478 of `kb/_program_requirements_score.py` fills a short sum to the program total whenever
  "elective" appears anywhere in the text. It is S650's class (`p-degree-electives-fill-false-pass-s650`; Cosumnes
  River 04614 was among S650's seven) and S655's (American River 07206). S655's guard,
  `tests/reconcile_window_fill_test.py`, reads only the six colleges of S655's wave, and its note pattern (`OUTSIDE`:
  "start of the table", "not included", "likely on page N") matches none of the 8, whose notes say "cut off",
  "begins mid-table" or "not supplied" (measured at the checkpoint on the nine as `rios` filed them at `97c70d84`).
  Measure the class statewide before the next reconcile anywhere:
  [`methodology-a-fill-must-check-what-it-fills`](kb-notes/methodology-a-fill-must-check-what-it-fills.md), *S714*.
- **One running and one pending run per branch** (`p-one-pending-run-per-branch-s714`): three dispatches went in on
  `claude/s714-rios` at once, and Cosumnes River's pending run was canceled four seconds after Folsom Lake's took its
  place, before anything was paid. It is the third time the lane learned it (S655's "the branch is the concurrency
  group"; `p-read-dispatches-share-group-s687`): dispatch one at a time.
- **A worker stays in its own worktree** (`p-harness-keeps-worker-in-its-worktree-s714`): `piles` could not open a
  second one for East Los Angeles, so a fresh worker, `piles2`, started there.
- **A load needs no guarded plan where no row is live** (`p-load-skips-places-none-s714`): `step=load` inserts only
  records with no live row and skips any that places none of its courses, so a paid read's new records go live by the
  load.
- **Apply first, fix forward** (`d-apply-before-reach-fix-s714`), where a reader's majors touch neither the rows, the
  SQL nor the undo: City College of San Francisco and East Los Angeles went live about 40 and 30 minutes before their
  PRs merged, each proved first on a local Postgres 16 (it writes exactly N; aborts on a rerun, a matching confirm or a
  changed before-image; the rollback restores the before state).
- **What worked:** free rule work first, 43 records with no paid read and 37 for $4.13; a second reader on every plan,
  Sonnet where the shared code was already reviewed or none changed (`d-sonnet-reader-for-scoped-plans-s714`); one PR
  for two applied branches under the cap (`d-fullerton-rides-3719-s714`); four checkouts at about 2 GB each on
  measured disk (`d-four-checkouts-on-measured-disk-s714`).
