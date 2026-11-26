---
title: "Program requirements harvest lessons — archive 9 (S714 onward)"
created: 2026-11-25
updated: 2026-11-26
tags: [lessons, archive, program-requirements, catalog-harvest]
kb-status: internal
obsidian-folder: cpl-project-tracker/lessons
related:
  - docs/program_requirements_harvest_lessons.md
  - docs/program_requirements_harvest_lessons_archive_8.md
---

# Program requirements harvest lessons — archive 9

Sections moved verbatim from [the lessons doc](program_requirements_harvest_lessons.md) when it neared its budget (S731 checkpoint compaction). Archive 8 holds S687 to S713. The S720 and S721 sections moved here at the S739 checkpoint.

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

## Moved from the lane (S720 checkpoint, 2026-11-24)

Verbatim from `docs/reference/lanes/program-requirements-harvest.md`, as the lane stood before the S720 checkpoint (relative links re-pointed to this folder); the lane keeps the current text.

**Display build `da3198af6b98` is live, confirmed by its closing count** (S713, #3708 `02c44ae4`; the gate at Cosumnes River 45144424595, then the whole build 45146020705): 18,628 rows at the build and the same 32 at older builds, 18,660. The confirming read pages by key, never by offset (**DECIDED** `d-display-keyset-confirm-s687`). The latest census: handoff 716.

**S714's posts** (`m-collection-s714`; #3714 `f0d84966`, #3716 `890eb465`, #3715 `a72f9516`, #3719 `5b4c057a`; #3721 at the checkpoint): 93 records live, 90 passing, for $4.13 of paid reads. Wording rules: City College of San Francisco 8 (migrate 45176130201), East Los Angeles 15 with 45602 a `total_differs` named gap (45186909162), `option_parts` 9 at six colleges (45188487600) and Fullerton 11 (45191999745), the last two in #3719. Los Rios 37 loaded from three paid reads (#3715: Sacramento City 18, Cosumnes River 16, Folsom Lake 3; loads 45198701869, 45199218981, 45199758327), 35 passing, with 7 named gaps filed. College of the Sequoias 13 (#3721; migrate 45212444064), 06770 held on a misread sum. No outline rows. Run ids: lessons, *S714*.

**Decisions of S714** (the conductor's, each reversible; rows in `cpl_memory`): **DECIDED** `d-four-checkouts-on-measured-disk-s714`, `d-apply-before-reach-fix-s714`, `d-optparts-holds-05934-claim-check-s714`, `d-elective-fill-rereads-held-s714`, `d-fullerton-rides-3719-s714`, `d-sonnet-reader-for-scoped-plans-s714` and `d-cobix-watcher-stopped-on-sam-word-s714` (Sam, 01:53Z 2026-11-23, to S712: *"No need for the Cobix check ins for now"*). S713's decisions stand: the paragraph as it stood, lessons, *Moved from the lane (S714 checkpoint)*.

**NEXT, in order** (Sam's work order of Nov 20 ranks collection by the M-ID cards each fix unblocks, `r-collect-for-mids-work-order-sam-2026-11-20`: outline fills first, program records second, **DECIDED** `d-mid-ranking-orders-lane-1-s690`; every block is listed until the Commons shows it, `r-a-block-is-a-block-sam-2026-11-21`): (0) Standing: never force a re-extraction blind (`d-rccd-pilot-no-blind-force-s671`); read a PR's whole thread before its merge or any apply of a file it carries (`p-apply-before-thread-read-s685`); revert a timestamp-only bot commit on a PR head (`d-revert-stamp-commit-for-test-s688`); on a bot receipt head push a real change or dispatch `js-tests.yml` on the branch, never an empty commit (`p-bot-receipt-head-runs-no-test-s697`, `p-bot-receipt-head-dispatch-js-tests-s713`); build a generated file with Python 3.12 ([note](kb-notes/methodology-a-generated-file-is-built-with-the-runners-python.md)); after a records change run both Commons builders and `tests/commons_data_status_build_test.py`, which `check_generated.sh` does not (`p-check-generated-misses-commons-data-s697`, `p-commons-files-conflict-between-prs-s697`); merge records PRs one at a time (`p-records-prs-merge-one-at-a-time-s703`); a new rule's self-recall holds answers its own fields did not supply: a claim check on the record's notes against today's capture, boundary readings and a precision count (`p-self-recall-reads-rule-fields-s703`, `p-claim-check-reads-current-capture-s713`, [note](kb-notes/methodology-a-test-must-not-take-its-rule-as-the-truth.md)); a pre-read counts matching and carried confirms and the apply aborts above 0 (`p-confirm-verdict-marks-checked-at-apply-s713`), and it may compare md5 hashes in place of before-values (`p-compact-preread-by-md5-s713`); a merge-commit head starts no page read, so dispatch by plan name (`p-merge-head-push-starts-no-read-s703`); `test` appears only after `lints` (`p-test-check-after-lints-s703`); fetch the shared clone with `--shallow-since` or `--deepen` (`p-shared-shallow-clone-reshallows-s713`); dispatch one run per branch at a time, since a newer pending run cancels the older (`p-one-pending-run-per-branch-s714`); start a fresh worker for each new branch (`p-harness-keeps-worker-in-its-worktree-s714`); a load inserts only records with no live row and skips any that places none of its courses (`p-load-skips-places-none-s714`). (1) **Outline readers** (step 11, [`scheduled_sessions`](reference/scheduled_sessions.md)), by the M-ID cards each improves (`f-outline-ranking-s691`): the queue is empty (S714; census 44695851118) and opens when a census, a harvest capture or a verdict row changes; De Anza, Palo Verde, College of Marin and Antelope Valley each wait on a reader. **For a person:** delete the 30-day artifact `course-outcomes-45026998155-part1`, whose shape-trial pages print an Originator's name (`p-lan-not-outcomes-only-filed-names-s703`). Then the standing test in `course-outcomes-load.yml` and the staff-names question (`q-trial-pages-file-staff-names-s689`). The 12 still-taught courses' hand-ins carry no outline text (`f-still-taught-hand-ins-no-outline-text-s691`). **Golden West's 476 header rows** (`f-golden-west-476-header-rows-s690`, `d-golden-west-before-values-filed-s691`; plan on `claude/s690-goldenwest-header` 0995d8b5): the guarded correction waits on a plain session's review. (2) **Before the next reconcile at any college** (it would file wrong rows): **FINDING** `f-elective-fill-passes-cut-off-windows-s714`: `main`'s program-level fill (`kb/_program_requirements_score.py`, about line 1478: `electives_fill_degree`, no degree total, `hi <= stated`, "elective" anywhere in the text) passed 8 Los Rios records whose notes say the table opens mid-page with rows cut off. Measure it statewide first. S655's guard `tests/reconcile_window_fill_test.py` reads six colleges and a note pattern that matches none of the 8 (*cut off*, *begins mid-table*, *not supplied*): widen both. The class is S650's (`p-degree-electives-fill-false-pass-s650`, Cosumnes River 04614 both times; [note](kb-notes/methodology-a-fill-must-check-what-it-fills.md)). **FINDING** `f-rescore-drops-ge-units-not-read-gaps-s714`: the rescore drops named `ge_units_not_read` gaps (16 at Los Rios, put back to `main`'s filings): fix the reader, or put them back the same way. The 9 held (`d-elective-fill-rereads-held-s714`: Sacramento City 04656, 07350, 21418; Cosumnes River 04602, 04614, 33542; Folsom Lake 15368, 39574, 42612) are not reread before the fix. (3) **The night's one follow-up** (after the waves): S713's list with its ids (SDCCE's 6 SLO-label rows, which the Commons shows as outcomes, first; lessons, *Moved from the lane (S714 checkpoint)*, NEXT (2); handoff 716's blocks); COBIx's `f-cobix-minors-s713`, and `f-cobix-minors-s714` (the same-figure guard reads true parts that print one figure as alternatives; the database rows carry no `notes` or `missing_explained`, so a rescore from a receipt alone fails coverage on 4 `option_parts` rows; Fullerton's CRTV 196 F prints 0.5-3 units; East Los Angeles's bound is unmeasured on capture text, so a free reconcile there, `extract=0`, goes before its next text run: 41097 likely, 36345, 37924, 43632 and 45935 possible). (4) **City College of San Francisco:** 8 pass (#3714); 26 held by key in #3714's receipt: 20 of the census's 28 (the six CNIT options 17614 to 17619 wait on an own-option step; 16990, 16991 and 38267 on a wrapper-fill step; 33208 and 37781 cut off; 9 others, each with its reason) and S713's six (17954; 09178, 17952, 31602, 36964, 42318). 20 not printed stay unnamed (`d-ccsf-20-not-named-s691`); its Cal-GETC dry run (32080, 33652, 46300), refused twice by the permission check, is a plain session's and a block. College of the Desert's 8 keep their gap (`f-desert-prior-catalog-behind-robots-s689`). (5) **Program records' open levers:** the census's *a reader change hands it its own page, then extraction*, done at Los Rios (#3715), next at San Bernardino Valley 15, Los Angeles Southwest 9, Mendocino 6 and Santiago Canyon 6: a free page read, each program's own page pinned or a named gap, then a paid read with `only=` at most $5 a college on the estimate. American River's 5 are blocked (`f-american-river-hand-filed-sha-mismatch-s714`: its host serves a file whose sha256 differs from the hand-filed record). Los Rios' two failing new records: Sacramento City 07334 (short of its GE units) and Cosumnes River 35364 (outcomes). Glendale 38973 is `page_challenged` (#3675). Page-finding: `levers` next at Mt. San Antonio, Santa Barbara City and Orange Coast where #3686 did not reach, and Santa Ana's program pages from its filed credit catalog (#3669). College of Marin's program URLs changed form, so the moved-page guard stopped its general education step on 19789 and 19791: a capture or guard fix first. Cerritos 20504 waits on 44984 (`d-cerritos-20504-waits-on-44984-s697`). Copper Mountain's catalog moved (`f-copper-mountain-catalog-moved-s689`). (6) **Cheap piles** (free rule work, each rule in lessons, *S714*): College of the Sequoias' 13 are applied (#3721, the page's own double-count figure read as a cap); its 9 held wait for a later rule; 8 held there, 36073 among them. Held by key in S714: East Los Angeles 02430, 08252, 21157, 02456, 31017, 41231, 38168, 37510 and 33013 (a person); Fullerton's 13, each named in its receipt; Santa Barbara City 05934 (a read settles ENVS 112 and ENVS 115). S713's holds and older (Santa Rosa Junior, Santa Monica, Las Positas, Antelope Valley, Glendale, Clovis; S703's general education, hours and lists holds; Lake Tahoe's 13 on quarter units): the list as it stood, lessons, *Moved from the lane (S714 checkpoint)*, NEXT (5). Los Medanos stays parked. (7) **The printed-course files** (`m-printed-catalog-courses-s690`, **DECIDED** `d-course-rows-gzipped-s690`): 17,341 printed courses at 16 colleges; no committed pipeline yet fills an M-ID card's missing description from them; the rest of the item: lessons, *Moved from the lane (S703 checkpoint)*. (8) **The display and the census:** S713's build is live (above); the next build, once #3715 and #3719 merge and no apply is in flight, carries the 27 records applied after it and S714's 80, gate college Glendale, then `harvest-gap-census.yml` on `main`. (9) Lassen: the structured-fields migration's step 1 ([`reference/roep_display_structured_fields_design`](reference/roep_display_structured_fields_design.md), #3296); 31297, 35106 and 41912 held. (10) #3293, parked as issue #3525 (`d-passing-dry-run-held-for-cobix-s651`): a plain session decides from the issue. (11) #3502's reader changes, cheapest first. (12) Ruling 3's self-recall run (`CPL_GE_AREA_SLOT_FILL=1`), then the default on. (13) The `NCL_EXTRACT` switch after the Commons sidecars hold `no_state_list` records back; then #3414's refusal probe. (14) The teach-out rule (#3491), after a runner capture. (15) Los Medanos's and Los Angeles Valley's program rules, with a person. (16) Confirm the harvest card shows #3465's `spent_usd`. **For a person:** the artifact above (S703); Antelope Valley 43028 and De Anza 45499, Santa Monica 03281, 10345 and 43765, Glendale 44488, Clovis 33501, 36326 and 39539 (S713); East Los Angeles 33013 (S714); College of the Canyons 43388 and West Los Angeles 46261 (S691); Napa Valley 19126, 31158 and 36528 (S690); Los Angeles Harbor 44947; Cerritos 44984; West Los Angeles 38677; Los Angeles Mission 44849 (no live row); Los Angeles City 32832; Ventura 45355 and Shasta 18153. Older lists: lessons, S653, S666, *Moved from the lane (S684 checkpoint)* to *(S714 checkpoint)*.

## S720 (SkyEider, the CPL Queue routine's 06:12Z collection run of 2026-11-24): 126 records, the fill fixed, named-gap piles at eleven colleges

The routine's 06:12Z firing, a conductor run for collection only under Sam's routine prompt of 2026-11-17 and COBIx's
brief on #3358 (Mon Nov 23, 6:45 PM PT), served by Opus 5.5 (the form names Fable 5.2). Handoff 721 holds the
declaration, the college split and its changes. Counts below are at the checkpoint's writing (about 09:00Z); the
handoff's last line carries the final ones.

**Merged.**
- **#3754 (`79a534fb`), the display build `abf1f6396156`** (18,666 records, 38 more than `da3198af6b98`): the gate at
  Glendale 45340786385 (242 rows), then the whole build 45341895811 (18,423 rows); 18,665 rows at the build and the
  same 32 at older builds. The census on `main` followed (45345225943, 07:08Z): of 20,282 active programs, 15,467
  pass and 4,495 have no passing record; 320 are collected with a named gap.
- **#3753 (`949c3194`), Fullerton:** of S714's 13 held, 6 collected with named gaps (03853, 03866, 08420, 08422,
  18163, 42394; migrate 45346957909), 7 held. Four kinds joined `kb/_program_named_gaps.py`: `noted_figures_differ`,
  `noted_unit_floor`, `lists_not_closed` and `no_own_page_total`.
- **#3756 (`35854487`), the fill fix:** the scorer's two electives fills (the program total's in `score()`, the
  degree total's in `degree_verdict`) read the record's own words first; `window_cut` returns the reader's sentence
  saying the requirements run outside the text, and the fill is refused with `fill_refused` naming `section_cut_off`.
  `reconcile_filed` keeps a filed named gap while the fresh score fails and the gap's rule still names it
  (`keep_named_gaps`). The statewide dry run over 18,960 committed records takes away 15 passes and adds none; its
  second reader pinned Cypress 37246, Riverside 43896, Folsom Lake 33791 and Cerritos 20493 as negatives. It closes
  `f-elective-fill-passes-cut-off-windows-s714` and `f-rescore-drops-ge-units-not-read-gaps-s714`.

**Applied and live, in open PRs.**
- **#3758 (`claude/s720-piles-land`), the ten piles branches, 95 records** (`d-piles-land-as-one-pr-s720`): College
  of the Sequoias 7 (45347712879), Clovis 3 (45348350867), Glendale 2 (45349804682), East Los Angeles 3
  (45350919054), City College of San Francisco 17 (45351319471), Santa Monica 20 (45352015658), Ventura 5
  (45353655553), Cabrillo 8 (45354440999), Contra Costa 16 (45357364157) and El Camino 14 (45357874656). #3755, City
  College of San Francisco's own PR, closes with a pointer to #3758. Each plan carried a precision count, claim checks
  on today's capture, boundary readings and a local Postgres 16 proof (it writes N; a rerun and a matching confirm
  abort; the rollback restores), then a second reader, a pre-read of N before-images with 0 confirms, the
  conductor's apply and `.apply` back at `main`'s value.
- **#3759 (`claude/s720-rios`, head `5941ee65`):** American River 04544's checks-only correction (45353104736) and
  three free reconciles, Sacramento City 45353709365, Cosumnes River 45355422235 and Folsom Lake 45356831201, each
  keeping only the records it was for (`d-rios-reconcile-keeps-only-targets-s720`); then nine `section_cut_off`
  named gaps (Sacramento City 04656, 04688, 07350, 21418; Cosumnes River 04602, 04614; Folsom Lake 15368, 39574,
  42612; plan s720r, migrate 45358426469). Its records differ from `main` only in those ten rows. Cosumnes River left
  `kb/collection_lane.py`'s collection lane, a stale S681 hold that kept it out of every named-gaps pass.
- **#3752 (`claude/s720-lever`), the reader-page lever:** free page read 45341735139 pinned 14 programs at Los
  Angeles Southwest, Mendocino and Santiago Canyon to their own sections and filed 7 named gaps (Los Angeles Southwest
  4, Santiago Canyon 3); reads 45341899083 and 45344701810 pinned American River's 5 in its refiled catalog and San
  Bernardino Valley's 16 to their own pages.
  Paid reads and loads: Mendocino 45348021173 ($0.35), load 45350191169; Los Angeles Southwest 45349617908 ($0.25),
  load 45351605402; American River 45353541681 ($0.30), load 45355395211; 16 records, all passing. San Bernardino
  Valley's read of 15 (45355976381, $0.93) was filed at 08:52Z, its load next. American River's catalog record moved
  to `retired/`, and a new one names the file its address serves. A new pin for site catalogs, `site_pages`, binds a
  program only on a read page whose h1 prints its title with its award (San Bernardino Valley's self-recall: 169 own
  award pages bind, 0 false binds in 28,392 pairs).

**Gap kinds filed tonight**, each named from the record's own notes under Sam's collect-with-gaps ruling: Fullerton's
four (above); City College of San Francisco's `pool_figure_not_read`, `one_option_of_shared_page`,
`pair_read_as_alternatives`, `noted_no_total` and `noted_section_cut_off`; Santa Monica's `repeat_read_once`; the
Sequoias branch's `prerequisites_counted`; the East Los Angeles branch's `unit_line_not_read`; Contra Costa's
`degree_summary_ge_none`. Cabrillo's `recommended_lists_only` was dropped by its reader.

**Lessons.**
- **A pre-read catches an older live extraction** (`p-preread-catches-older-live-extraction-s720`): East Los Angeles
  02456's live row sat on an older extraction than its committed record, so the plan went from 4 rows to 3. Plans
  since check `on_live_run` before the second reader; Cabrillo 11293 and Ventura 06973, 31298, 32834 were held on it.
- **A shared page is never a record's own** (`p-own-page-guard-shared-pages-s720`): #3753's second reader held
  Fullerton 35174, which was read from a page `capture.json`'s `shared_pages` lists with another program (the
  UC-transfer page, with 36798). Later plans ran the own-section guard and listed their shared pages in the receipt.
- **A record today's scorer passes is never gap-filed** (`p-scorer-passes-guard-s720`): Fullerton 33680 and 42143
  pass under the printed floor, so they wait for a closed-list rescore; every later plan ran the `scorer_passes`
  guard (Ventura 30587 held on it).
- **A gap's score cap lives in `confidence()`** (`p-cap-lives-in-confidence-s720`): City College of San Francisco's
  `noted_section_cut_off` cap moved from its plan into `confidence()`, and Contra Costa's general education cap for
  `degree_summary_ge_none` went there too, because #3756's `keep_named_gaps` recomputes a kept gap through
  `confidence()` and would lift a cap set anywhere else.
- **One writer of `.apply` per branch** (`p-one-apply-writer-per-branch-s720`, `d-conductor-owns-applies-s720`): on
  `claude/s720-rios` the conductor restored `.apply` (`af952282`) while the worker had a commit staged that still
  carried the plan's `.apply`; its push fired migrate 45358888504, and the plan's guard aborted it with nothing
  written ("the UPDATE matched 0 rows, the plan names 9"). A worker pulls before it commits once the conductor has
  touched its branch.
- **Pooled parent figures** (`f-pool-figure-gaps-pass-when-pooled-s720`): 7 of Modesto Junior's 8
  `pool_figure_not_read` records pass today's scorer once the parent figure is read as one pool, so its plan is held
  unapplied for the rule (`d-modesto-held-pooled-rule-s720`); the rows applied elsewhere under that kind may pass
  under it too.
- **Free rules left for tomorrow:** City College of San Francisco's own-option reading, which keeps each CNIT
  program's OPTION block scores 17615 to 17618 equal and needs no page text (`f-ccsf-own-option-reading-s720`);
  Cabrillo's recommended lists, under which today's scorer passes 06352, 06380, 06381 and 44992 with their
  "Recommended" blocks read as choose-units, as it does 17 other Cabrillo records with that wording
  (`f-cabrillo-recommended-lists-rule-s720`).
- **Fullerton's shared pages:** 15 of its 296 passing records are not on their own page
  (`f-fullerton-shared-page-passing-s720`).
- **A registry row can change under a pin** (`f-scc-registry-file-changed-s720`): Santiago Canyon's row now names
  `SCC_2026_2027_Catalog_accessible.pdf` (1,165 pages), so paid read 45350768246 refused the three pins of the
  374-page file before any extraction; page read 45352138673 moved them to PDF pp.406, 407 and 415 of the new file.
- **San Bernardino Valley 32317** (`f-sbvc-32317-rule-b-s720`): its page prints CDEV where the Program Course File
  lists CD (a `course_renumbers` entry for its nine codes); rule B of the reader's page checks skips it, so the paid
  read ran on 15 without it (`d-sbvc-without-32317-s720`), and the skip and its test's marking go to the follow-up.
- **Sacramento City's course-id gains** (`f-sacramento-city-course-id-gains-s720`): its reconcile restamped 34
  records, none changing its verdict; 26 with real course-id route gains and the 4 whose `ge_units_not_read` gap the
  reconcile kept (04662, 17873, 17875, 42894) went back to `main`'s filing for one reread.
- **The follow-up's minor:** pin Cerritos 35166, the whole-major exception.

## Moved from the lane (S721 checkpoint, 2026-11-24)

Verbatim from `docs/reference/lanes/program-requirements-harvest.md`, as the lane stood before the S721 checkpoint (relative links re-pointed to this folder); the lane keeps the current text.

**Display build `abf1f6396156` is live, confirmed by its closing count** (S720, #3754 `79a534fb`; the gate at Glendale 45340786385, 242 rows, then the whole build 45341895811, 18,423 rows): 18,665 rows at the build and the same 32 at older builds. The confirming read pages by key, never by offset (**DECIDED** `d-display-keyset-confirm-s687`). The latest census: handoff 721.

**S720's posts** (`m-collection-s720`; #3753 `949c3194`, #3754 `79a534fb` and #3756 `35854487` merged; #3752, #3758 and #3759 open at the checkpoint): 126 records live at the checkpoint's writing, for $0.90 of paid reads: 101 collected with named gaps at eleven colleges under Sam's collect-with-gaps ruling (`sam-collect-with-gaps-2026-11-17`), Fullerton 6 (#3753) and ten colleges' piles landing in #3758; 9 `section_cut_off` named gaps at Los Rios (#3759); 16 passing loads on the reader-page lever (#3752). American River 04544's false pass is corrected (#3759). No outline rows. Each college's count and run id: lessons, *S720*.

**Decisions of S720** (the conductor's, each reversible; rows in `cpl_memory`, one line each in handoff 721): **DECIDED** `d-routine-moniker-fresh-on-collision-s720`, `d-slimming-left-to-plain-session-s720`, `d-piles-land-as-one-pr-s720`, `d-conductor-owns-applies-s720`, `d-rios-reconcile-keeps-only-targets-s720`, `d-sbvc-without-32317-s720`, `d-fill-merged-after-local-main-merge-s720`, `d-modesto-held-pooled-rule-s720` and `d-display-merged-without-main-update-s720`. S714's and S713's decisions stand: lessons, *Moved from the lane (S720 checkpoint)* and *(S714 checkpoint)*.

**NEXT, in order** (Sam's work order of Nov 20 ranks collection by the M-ID cards each fix unblocks, `r-collect-for-mids-work-order-sam-2026-11-20`: outline fills first, program records second, **DECIDED** `d-mid-ranking-orders-lane-1-s690`; every block is listed until the Commons shows it, `r-a-block-is-a-block-sam-2026-11-21`): (0) Standing: never force a re-extraction blind (`d-rccd-pilot-no-blind-force-s671`); read a PR's whole thread before its merge or any apply of a file it carries (`p-apply-before-thread-read-s685`); revert a timestamp-only bot commit on a PR head (`d-revert-stamp-commit-for-test-s688`); build a generated file with Python 3.12 ([note](kb-notes/methodology-a-generated-file-is-built-with-the-runners-python.md)); after a records change run both Commons builders and `tests/commons_data_status_build_test.py`, which `check_generated.sh` does not (`p-check-generated-misses-commons-data-s697`, `p-commons-files-conflict-between-prs-s697`); a new rule's self-recall holds answers its own fields did not supply: a claim check on the record's notes against today's capture, boundary readings and a precision count (`p-self-recall-reads-rule-fields-s703`, `p-claim-check-reads-current-capture-s713`, [note](kb-notes/methodology-a-test-must-not-take-its-rule-as-the-truth.md)); a pre-read counts matching and carried confirms and the apply aborts above 0 (`p-confirm-verdict-marks-checked-at-apply-s713`), and it may compare md5 hashes in place of before-values (`p-compact-preread-by-md5-s713`); `test` appears only after `lints` (`p-test-check-after-lints-s703`); a load inserts only records with no live row and skips any that places none of its courses (`p-load-skips-places-none-s714`); the process rules (bot receipt heads, records PRs one at a time, merge-commit heads, the shared clone's fetch, one dispatch per branch, a fresh worker per branch) are in [`conductor_mode`](reference/conductor_mode.md) and lessons, *Moved from the lane (S720 checkpoint)*. S720's: one writer of `.apply` per branch, the conductor, after an APPLY verdict and a clean pre-read (`d-conductor-owns-applies-s720`, `p-one-apply-writer-per-branch-s720`); a plan holds a record whose live row is an older extraction (`on_live_run`, `p-preread-catches-older-live-extraction-s720`); a page `shared_pages` lists with another program is never a record's own (`p-own-page-guard-shared-pages-s720`); a record today's scorer passes is never gap-filed (`p-scorer-passes-guard-s720`); a named gap's cap lives in `confidence()` (`p-cap-lives-in-confidence-s720`); a reconcile keeps only the records it was for (`d-rios-reconcile-keeps-only-targets-s720`). (1) **Outline readers** (step 11, [`scheduled_sessions`](reference/scheduled_sessions.md)), by the M-ID cards each improves (`f-outline-ranking-s691`): the queue is empty (at S720's start) and opens when a census, a harvest capture or a verdict row changes; De Anza, Palo Verde, College of Marin and Antelope Valley each wait on a reader. **For a person:** delete the 30-day artifact `course-outcomes-45026998155-part1`, whose shape-trial pages print an Originator's name (`p-lan-not-outcomes-only-filed-names-s703`). Then the standing test in `course-outcomes-load.yml` and the staff-names question (`q-trial-pages-file-staff-names-s689`). The 12 still-taught courses' hand-ins carry no outline text (`f-still-taught-hand-ins-no-outline-text-s691`). **Golden West's 476 header rows** (`f-golden-west-476-header-rows-s690`, `d-golden-west-before-values-filed-s691`; plan on `claude/s690-goldenwest-header` 0995d8b5): the guarded correction waits on a plain session's review. (2) **The fill and the reconcile, fixed** (#3756 `35854487`; [note](kb-notes/methodology-a-fill-must-check-what-it-fills.md)): no electives fill over a cut-off window (`fill_refused`, `section_cut_off`), and a reconcile keeps a filed named gap its rule still names; the statewide rescore takes away 15 false passes and adds none. #3759 carries American River 04544's correction and the nine `section_cut_off` gaps. Open: Cosumnes River 33542 held on `main`'s filing (Option II's two blocks read as alternatives); Folsom Lake 38736, not rescored by its reconcile; Sacramento City's 26 course-id gains and 4 kept `ge_units_not_read` gaps (04662, 17873, 17875, 42894) wait for one reread (`f-sacramento-city-course-id-gains-s720`). (3) **The night's one follow-up** (after the waves): S713's list (SDCCE's 6 SLO-label rows first; lessons, *Moved from the lane (S714 checkpoint)*, NEXT (2)); COBIx's `f-cobix-minors-s713` and `f-cobix-minors-s714` (lessons, *Moved from the lane (S720 checkpoint)*, NEXT (3)), East Los Angeles's free reconcile (`extract=0`) among them; Cerritos 35166's pin (the whole-major exception); the free rules the plans leave for tomorrow, City College of San Francisco's own-option reading for 17615 to 17618 (`f-ccsf-own-option-reading-s720`) and Cabrillo's recommended lists for 06352, 06380, 06381 and 44992 (`f-cabrillo-recommended-lists-rule-s720`); San Bernardino Valley 32317's rule-B skip and its test's marking (`f-sbvc-32317-rule-b-s720`). (3a) **Modesto Junior's pooled rule:** its plan of 8 `pool_figure_not_read` gaps (`claude/s720-piles-modesto`) is held unapplied, since 7 of the 8 pass today's scorer once the parent figure is read as one pool (`d-modesto-held-pooled-rule-s720`, `f-pool-figure-gaps-pass-when-pooled-s720`). Write the rule, then check the `pool_figure_not_read` rows applied elsewhere against it. (4) **City College of San Francisco:** 17 collected with named gaps (#3758), the six CNIT options as `one_option_of_shared_page`; 9 held by key in its receipt (19037; 17954; 32079, 41315; S713's 09178, 17952, 31602, 36964, 42318); #3755 closes with a pointer to #3758. 20 not printed stay unnamed (`d-ccsf-20-not-named-s691`); the Cal-GETC dry run (32080, 33652, 46300) is a plain session's and a block. College of the Desert's 8 keep their gap (`f-desert-prior-catalog-behind-robots-s689`). (5) **Program records' open levers:** *a reader change hands it its own page, then extraction* is done at Mendocino 6, Los Angeles Southwest 5 and American River 5 (#3752, all passing, $0.90 of paid reads; American River's catalog refiled as the file its address serves), with 7 named gaps filed at Los Angeles Southwest and Santiago Canyon. San Bernardino Valley's paid read of 15, without 32317 (`d-sbvc-without-32317-s720`), is filed (45355976381, $0.93), its load next; Santiago Canyon's 3 pins moved to the accessible catalog its registry row now names (`f-scc-registry-file-changed-s720`), its paid read pending. Next, the census's Next wave: Antelope Valley 10, Orange Coast 8, Saddleback 7, College of the Redwoods 5, MiraCosta 5 (a free page read; each program's own page pinned or a named gap; a paid read with `only=`, at most $5 a college on the estimate). Los Rios' two failing new records: Sacramento City 07334 and Cosumnes River 35364. Older levers (Glendale 38973; page-finding at Mt. San Antonio, Santa Barbara City and Orange Coast; Santa Ana; College of Marin's moved-page guard, 19789 and 19791; Cerritos 20504; Copper Mountain): lessons, *Moved from the lane (S720 checkpoint)*, NEXT (5). (6) **Cheap piles** (each rule and each hold's reason in its plan's receipt on its branch): held tonight, Fullerton 7 (36798, 35174, 33680, 42143, 18166, 18749, 36863), City College of San Francisco 9, Santa Monica 3 (41797, 43767, 21026), College of the Sequoias 2 (06770, 45030), Clovis 5 (33431, 33432, 33506, 37227, 45325), East Los Angeles 6 (02456, 31017, 33013, 37510, 38168, 41231), Glendale 1 (45068), Ventura 17, Cabrillo 13, Contra Costa 6, El Camino 8. Fullerton: 15 of its 296 passing records are not on their own page (`f-fullerton-shared-page-passing-s720`). Next: Palo Verde 20, Orange Coast 20, then Modesto's 10 unread holds. Still held: Santa Barbara City 05934 (ENVS 112, ENVS 115); Las Positas 01037, 09227; Antelope Valley 39295; Santa Rosa Junior 06566, 32298; older holds: lessons, *Moved from the lane (S714 checkpoint)*, NEXT (5). Los Medanos stays parked. (7) **The printed-course files** (`m-printed-catalog-courses-s690`, **DECIDED** `d-course-rows-gzipped-s690`): 17,341 printed courses at 16 colleges; no committed pipeline yet fills an M-ID card's missing description from them; the rest of the item: lessons, *Moved from the lane (S703 checkpoint)*. (8) **The display and the census:** S720's build is live (above); the next build carries tonight's records once #3758 and #3759 merge and no apply is in flight, gate college Glendale, then `harvest-gap-census.yml` on `main`. (9) to (16), the older queue, each as it stood in lessons, *Moved from the lane (S720 checkpoint)*: Lassen's structured fields ([`reference/roep_display_structured_fields_design`](reference/roep_display_structured_fields_design.md); 31297, 35106, 41912 held); #3293 as issue #3525; #3502's reader changes; ruling 3's self-recall run; the `NCL_EXTRACT` switch and #3414's probe; the teach-out rule (#3491); Los Medanos's and Los Angeles Valley's rules; #3465's `spent_usd` on the card. **For a person:** the artifact above (S703); Antelope Valley 43028 and De Anza 45499, Santa Monica 03281, 10345 and 43765, Glendale 44488, Clovis 33501, 36326 and 39539 (S713); East Los Angeles 33013 (S714); Contra Costa 01417, two entry paths (S720); College of the Canyons 43388 and West Los Angeles 46261 (S691); Napa Valley 19126, 31158 and 36528 (S690); Los Angeles Harbor 44947; Cerritos 44984; West Los Angeles 38677; Los Angeles Mission 44849 (no live row); Los Angeles City 32832; Ventura 45355 and Shasta 18153. Older lists: lessons, S653, S666, *Moved from the lane (S684 checkpoint)* to *(S720 checkpoint)*.

## S721 (SkySkua, the CPL Queue routine's 10:12Z collection run of 2026-11-24): 65 records, five colleges' piles, the reader-page lever, the pooled reading

The routine's 10:12Z firing, a conductor run for collection only under Sam's routine prompt of 2026-11-17 and COBIx's
brief on #3358 (Mon Nov 23, 6:45 PM PT), served by Opus 5.5 (the form names Fable 5.2). It stayed read-only while
S720's checkpoint #3751 was open and took the queue when it merged at 10:40Z (`13d93cd1`). Handoff 722 holds the
declaration, the college split and its changes. In all: 65 records collected and live (lane 2's 45, 44 with named
gaps; the lever's 12, 11 passing; the pooled reading's 8 at Modesto, 7 passing), 7 moved from a named gap to passing,
14 named gaps for programs with no record, no outline rows, $0.89 of paid reads. The closing census and the spend are
in the handoff's last lines.

**Merged.**
- **#3761 (`21ebe65d`, 11:28Z), the display build `6de40ebdf2fd`** (18,700 records, 34 more than `abf1f6396156`): the
  gate at Glendale 45378640148 (242 rows), then the whole build 45379239301 (18,457 rows); 18,699 rows at the build and
  the same 32 at older builds. The census on `main` followed (45384590964, `3c2df00b`, 11:33Z): of 20,282 active
  programs, 15,498 pass and 4,350 have no passing record; 434 are collected with a named gap.
- **#3765 (`5a653136`, 12:09Z), Orange Coast** (plan s721b): 3 of the census's 20 collected with named gaps (35182
  `noted_figures_differ`, 32189 `lists_not_closed`, 19547 `unit_line_not_read`; migrate 45384449239), 17 held. Two
  wording rules wait for a later run: 08670's `degree_total_minimum` and 32737's substitution list
  (`f-orange-coast-wording-rules-s721`).
- **#3769 (`3d39f29b`, 13:10Z), the land PR** (`d-piles-land-as-one-pr-s721`; #3762 and #3767 closed with pointers;
  Gavilan and Butte pushed without PRs under the cap), 42 records, every one applied and live before the merge, which
  went without an update from `main` since S722's `23a03d6c` touched none of its files
  (`d-land-merged-without-main-update-s721`):
  - Palo Verde (plan s721a, migrate 45387462655): 15 named gaps. 12 `figure_within_variable_units` (new: Fire Science
    certificates whose required list's figure falls inside FST 090's 0.25-12 range, the list figures adding to the
    printed 30); 2 `degree_electives_not_printed` (new: 18000 and 18045, Liberal Arts degrees whose emphasis and
    Cal-GETC add to 52-56 against 60-61, with no electives figure printed); 22484 `noted_figures_differ`. Held 17998,
    17999, 41227, 41242 and 45359.
  - Porterville (s721c, 45386964248): 43554 passes on its catalog's misprint CGRAP P152 for the listed CGRA P152,
    renamed in the plan only; 14 named gaps (`noted_no_total` 9, `pool_figure_not_read` 2, `noted_section_cut_off`,
    `noted_figures_differ`, `repeat_read_once`). Held 09528, 35229 and 35449 (the own-section guard) and 45511 (not
    collectable).
  - Gavilan (s721d, 45389821901): 7 named gaps (`noted_figures_differ` 15555, 37750; `pool_figure_not_read` 06129,
    39624; `lists_not_closed` 14041, 18453, 38119); 11 held, among them 08460, 19378, 38787 and 06128.
  - Butte (s721e, 45394922393): 5 named gaps, `degree_within_map_range` (new: 01305, 01358, 07258 and 45652, whose
    degree units as read fall strictly inside the sample term map's range from the printed 60) and
    `pool_figure_not_read` 31000 (List B's "(6.00 overall)"); 12 held.
  Each plan had a second reader (Palo Verde and Butte on Opus; Orange Coast, Porterville and Gavilan on Sonnet), a local
  Postgres 16 proof, a clean md5 pre-read and the conductor's apply, with `.apply` back at `main`'s value after each run.

**Applied and loaded, in PRs still open at the checkpoint's writing** (the handoff's ledger carries their merges).
- **#3763 (`claude/s721-lever`, head `45ae3364`), the census's `reader_page_assignment` wave.** `site_pages` pins load on the eLumen and
  curriQunet roads too; `site_award_subheading` binds a page headed by its title alone over its award line;
  `RC.PIN_HEADING` lets a pin bound on its own heading pass rule B's general education check. Free page reads:
  Antelope Valley 45381304038, Redwoods 45381629186, MiraCosta 45382513707, Saddleback 45382520936, Redwoods' heading
  recall 45383284426 (70 bind on their own page, 24 through the award line, 0 false binds in 5,110 pairs) and
  Saddleback's A-Z navigation 45383732976. Redwoods' paid read 45390207374 ($0.25 against $0.30), load 45392331223:
  01816 and 22666 pass, 42928 collected with its failing check named. MiraCosta's forced re-read of 07863, 45392607854
  ($0.08 against $0.11), load 45397967009, passing (`d-miracosta-force-07863-only-s721`). Antelope Valley's paid read
  45399693231 ($0.56 against $0.80) put its 8 live on that run, arithmetic equal, all passing (02145, 02149, 02153,
  11647, 11648, 12161, 14414, 15404); 20184 is already read from its own page. In all, 12 collected and live, 11
  passing (Redwoods 42928 fails its arithmetic: blocks of 29-35 under its printed "Total 25 - 28"), for $0.89 against
  $1.21 estimated. Named gaps: Antelope
  Valley 35818; Redwoods 13559, 30811; MiraCosta 15183 and 22006 (the state lists CDEV 212 alone and the Teacher list
  does not print it), 36144 and 36171 (`text_window_cut`); Saddleback's 7, `not_in_catalog`, found nowhere in its
  2026-2027 catalog's Credit Programs navigation. Reviews: round 1 FIX THEN DISPATCH, round 2 DISPATCH; one minor open
  (`f-cert-heading-accepts-plural-department-s721`). Cross-impact: San Bernardino Valley 32317's S720 pin now binds
  (`f-sbvc-32317-rule-b-s720`). Beyond the lever, both eLumen colleges hand programs their sister award's page
  (Antelope Valley about 47; Redwoods 42895, 45557, 45595; `f-elumen-sister-award-swap-s721`): a reader fix to
  `assign()`, unbuilt, is lane 1's next lever.
- **#3764 (`claude/s721-pooled`), the pooled reading.** The scorer reads one printed figure over named lists as one
  pool. Its statewide self-recall: 28 fail to pass, 0 pass to fail (Modesto 12, El Camino 3, Santa Monica 2, Ventura 2,
  Clovis 1, Sequoias 1, Fullerton 1; Rio Hondo 3, Cuyamaca 2 and Golden West 1 left for the next run,
  `f-pooled-flips-elsewhere-s721`). Plan s721p, 15 rows: 14 to passing (Modesto 06639, 08103, 30675, 32226, 33945,
  35276, 35277; Ventura 20576, 06957; Santa Monica 03263, 32792; Clovis 33489; Sequoias 35415; Fullerton 18163) and
  Modesto 06642 to `pool_figure_not_read`; El Camino 02513, 02515 and 02517 held (an electives fill needs the page
  text). Round 1 was FIX THEN MERGE AND APPLY, with a blocker (the recall test read its own receipt and could never
  fail) and a major (hedged, negated or restating sentences read as a pool); the fix runs the recall live against a
  hand answer for each record the reading fires on (55 read, 55 right) and refuses those sentences. Round 2, MERGE AND
  APPLY: the live recall now fails when the rule breaks, every round-1 adversarial sentence refuses, and 133 checks and
  79 related CI tests pass; two minors go to the follow-up (`live_flips` reads the filed arithmetic for rescored rows;
  "List A requires 9 units together with its lab" still pools, though no committed record reads so). After a clean
  pre-read of 15, migrate 45404108418 returned 15 at 13:31Z: 14 pass with no gap, and Modesto 06642 carries
  `pool_figure_not_read`. It merges after #3763. It supersedes S720's held s720j: never merge
  `claude/s720-piles-modesto`. Five of s720j's holds pass under the pooled reading
  (08104, 08111, 33944, 37300, 38067; `f-modesto-s720j-holds-pass-pooled-s721`).

**Lessons.**
- **A test that reads its plan's own receipt** (`p-test-reads-own-apply-receipt-s721`;
  [note](kb-notes/methodology-a-test-must-not-take-its-rule-as-the-truth.md), *S721*): #3764's recall took its answers
  from the plan's own receipt and could never fail. Porterville's test passed before its apply and failed after it,
  because its live-run check read the receipt the apply itself posts. The recall now runs live against hand answers,
  and the live-run check reads the receipts as they stood before the plan's own apply (`posted_runs(skip=...)`).
- **A test that asserts another PR's change absent** (`p-test-asserts-other-pr-absent-s721`): Butte's test held 01312
  by asserting Palo Verde's `degree_electives_not_printed` absent, which turned false once both landed in #3769; it now
  asserts 01312 is not among the reviewed records.
- **A record a cheaper lever passes stays on it** (`p-gap-filing-leaves-census-lever-s721`,
  `f-butte-nine-pass-on-elective-line-s721`): Butte's second reader held nine of its 13 `degree_within_map_range`
  records (01362, 07269, 11136, 31042, 31941, 32469, 33199, 40923, 43453). Each passes today's scorer once the map's
  "Only necessary if the 60 units needed to graduate have not been completed" line reads as electives that fill the
  degree, and a named gap would have taken it off the reconcile lever that passes it.
- **A sum inside a printed range is no disagreement** (Gavilan 08460, 19378, 38787): `noted_closes` gained an in-range
  test, S703's hold (`d-lists-gap-holds-range-sums-s703`). `noted_figures_differ` needs the record's sum and its
  stated total to be the two figures (Palo Verde 41227), and `spans_figure` counts a variable course by its own
  `units_max`, never an "or" alternative.
- **A record's own notes carry its reason** (`d-palo-verde-41242-held-own-notes-s721`): Palo Verde 41242 holds, since
  none of its own notes says its 17.25 depends on FST 090's range, 17998's standard.
- **A pin test marks its members as production does** (`p-pin-test-sets-production-mark-s721`): Antelope Valley's
  degree pages print their general education map, and with every lever member marked (`RC.MARK`) rule B refused 8 of
  its pins in production while the unmarked test passed. The test marks its programs as the capture does.
- **A named gap's test states only what its page prints** (`p-named-gap-asserts-only-the-page-s721`): MiraCosta's
  CDEV 212 prints in the Early Intervention list, not Associate Teacher, and the fixture holds the capture's own
  award-line form.
- **A forced re-read needs a text window that reaches the section** (`p-force-reread-needs-text-window-s721`):
  MiraCosta 36144 and 36171's section prints past the 16,000 characters the capture sends, so a forced re-read would
  send the same cut text; both are named gaps.
- **A push that touches a plan file starts a page read** (`p-plan-file-push-starts-page-read-s721`): a push touching
  `kb/college_reads/*.json` starts a read, so the read's commit goes last on its push, and a third queued run cancels
  the pending one.
- **A kept gap goes unchecked** (`f-degree-within-map-range-keep-unchecked-s721`): a reconcile keeps
  `degree_within_map_range` without checking `within_map`; the follow-up's.
- **Two lanes, one college:** lane 2 held Orange Coast, so its 8 on the reader-page lever wait
  (`d-orange-coast-lever-waits-s721`). Once spend passed about $110 at 12:22Z the run started no new worker and landed
  what was in flight (`d-no-new-workers-after-12z-s721`).
