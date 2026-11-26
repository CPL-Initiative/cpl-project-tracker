---
title: "Session 732 handoff (from SkyFrigatebird, S731, the CPL Queue routine's collection run of 2026-11-25, from 10:55Z)"
created: 2026-11-25
updated: 2026-11-25
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_740_handoff.md
---

**Routing, both ways.** A CPL Queue routine firing follows this file. A plain session Sam opens follows the newest
handoff his plain sessions write (731, S730 SkyDunlin's, merged in #3828 at 12:11Z and naming SkyGodwit), never this
file. **Numbering.** Handoff 730 named SkyDunlin for Sam's next plain session. This run declared S730 at 11:05Z (#3823),
and SkyDunlin took S730 as its handoff named it (#3824 merged at 11:19Z as S730), so the declaration moved to S731 and
writes 732, leaving 731 to SkyDunlin (`d-routine-takes-next-free-number-s713`, as S713's declaration moved;
**DECIDED** `d-routine-yields-730-to-plain-s731`). The routine's next session is **SkyOystercatcher**: it takes the
next free session number at its start (SkyGodwit, Sam's next plain session, takes one too) and writes the handoff one
above the highest on `main` (`d-routine-leaves-plain-handoff-number-s727`). Read `main`'s highest handoff before each
merge of this file.

# You are SkyOystercatcher, the routine's next session

From SkyFrigatebird (S731), the CPL Queue routine's 10:12Z firing of 2026-11-25, a conductor run for collection only
under Sam's routine prompt of 2026-11-17 and the COBIx brief on #3358 (Tue Nov 24, written 6:45 PM PT), served by Opus
5.5 (the routine's form names Fable 5.2). Handoff 728 named SkyFrigatebird for the routine's next session, and no plain
session holds the name.

A **full checkpoint** (the harvest lane moved; Rule 10 data writes ran: four guarded applies, s730a, s730b, s731c and
s731p; the eLumen follow-up's and the lever's loads and rereads; Saddleback's reconcile and reread; a display build;
and the memory rows, drafted for the conductor), written by the checkpoint-docs worker from 13:54Z, before land 2's merge; the conductor's final facts (land
2's merge, the closing census, the Spend line and the last line's numbers) fill the places marked for them. Skipped: step 2 (tonight's code sits in the harvest's own named-gap file,
scorer and reconcile, which the lane and lessons document), step 3 (no user-facing surface changed), step 7 (no
re-mint, no roadmap status change, no auditor counts moved) and step 9 (the UI pass is its own queue item). The start
and the college split below were written before any worker started.

## Open with the standing block (COBIx on #3358, 21:20Z 2026-11-18, corrected 21:36Z; Sam's rule for the next two or three sessions)

0. **COBIx's brief is on issue #3358**: read the newest (Tue Nov 24, 6:45 PM PT, at this writing), and comment
   7064588752 (Sam's two rulings of 2026-11-21), before the split.
1. **No COBIx watcher.** Sam, 01:53Z 2026-11-23, to S712: *"No need for the Cobix check ins for now"*
   (`d-cobix-watcher-stopped-on-sam-word-s714`). Read a PR's whole thread before you merge it or apply what it carries.
1a. **Clone light (Sam, 2026-11-19):** `git clone --filter=blob:none` (or `--depth=1` when history is not needed),
   never a full clone. Workers share one shallow clone, so fetch a branch by name with `--shallow-since` or `--deepen`,
   never `--depth` (`p-shared-shallow-clone-reshallows-s713`); a new branch gets a fresh worker. A worker's push counts
   once `git ls-remote` shows its head (`p-worker-push-proved-by-ls-remote-s731`).
2. **Merge rules:** at most 3 open PRs (plus #3511 and dependabot's), the oldest finished first, one update from `main`
   right before its merge, no dependency-map rebuild inside a PR, no full rerun when the input fingerprints match. Stop
   a review after two rounds. Records PRs merge one at a time (`p-records-prs-merge-one-at-a-time-s703`).
2a. **Sam's work order (2026-11-20):** collection comes first, data waves before fixes, and a fix goes ahead of the next
   wave only when it blocks it or would file wrong rows (`r-collection-first-sam-2026-11-20`). Collection serves the
   M-IDs, so its fixes are ranked by the M-ID cards they unblock (`r-collect-for-mids-work-order-sam-2026-11-20`).
3. **Merge order at sign-off:** every substantive PR of tonight's has merged: #3825 (`9a5deb35`), #3830 (`dafe74c6`),
   #3827 (`334aa4f9`, land 2: the lever, the eLumen follow-up and s731p) and #3833 (`b3a23b5d`, land 3: Saddleback's
   `repeat` steps). This checkpoint, #3823, merges at sign-off, with one update from `main` right before its merge. Open
   PRs at sign-off: #3823 and dependabot's #3383, which waits.
   Dependabot's #3383 waits.

## The start (10:12Z firing, 2026-11-25)

- 10:14Z: S727 (SkyTropicbird) was live: its checkpoint #3807 took a push at 10:11:38Z while Butte's #3821 waited on
  `test`, so the firing ended in one line. Sam, about 10:55Z, in this session: *"You should be clear to go"*. #3807
  merged at 10:51:45Z (`56c21b96`), and the run took the queue then.
- Step 0: not the night's first firing; S727 dispatched the day's `daily-dashboard.yml` (45559142493) at 06:14Z.
- One writer: no `list_sessions` or `get_trigger` here. Open PRs at 10:57Z: dependabot's #3383 alone. `main` at
  `56c21b96` (#3807, handoff 728).
- No pause line (handoffs 728 and 730). Three repos attached. `check_hooks_live.py`: ROOT LIVE (guards on Bash and
  `execute_sql`, 34 allow rules, the context meter). Context at start 18.7% of 786,077.
- Sheet 200: no reply since 2026-11-19T23:47Z. `queue_todo_done` since 2026-11-25: none. Rule 8's memory read: no row
  since S727's 22 (09:47Z). Steps 6 to 10: held in a conductor run, as S727 held them. Step 11: the outline queue is
  empty until a census changes.
- Census on `main` (45586922147, 09:39Z, `3f04de68`): of 20,282 active programs, 15,551 pass and 4,227 have no passing
  record; 504 are collected with a named gap.
- **Spend aim:** about $200 for this run. S727 spent about $314 earlier on this UTC day, and Sam's plain sessions S725,
  S726 and S729 ran unmetered, so the day stays under about $750. No new worker after about $150.

## The college split (written before any worker started)

Two lanes, never on one college at the same time, one writer per college (`d-lane-names-only-colleges-in-flight-s681`).

- **Lane 1 (collection):**
  - `display` (the conductor), first, while no apply is in flight: one display build carrying S727's records after
    `f4b48370bc11`, gate college Glendale, then the whole build, then `harvest-gap-census.yml` on `main`.
  - `elumen2` (Opus, high effort), the eLumen follow-up: Antelope Valley's 38 that bind their own page and were
    `held_no_gain` (a `step=reread` with `force`, only where the own-page reading passes), Redwoods 45557 and 45595,
    and Antelope Valley 43150's pin. Colleges: Antelope Valley, College of the Redwoods.
  - `lever` (Opus, high effort): West Valley 06276, 32021 and 35588 first (why its load inserted nothing; never a blind
    rerun); #3811's holds, Allan Hancock 42208, 42210 and 43770, Southwestern 32693 and 36634, Pasadena City 31599;
    then Los Angeles Southwest 4, Sacramento City 4 with its one reread, Cosumnes River 3 with 33542, Folsom Lake
    38736, Santiago Canyon 3, East Los Angeles 3 and Napa Valley 3, as spend allows. A paid read takes `only=` and at
    most $5 a college on the estimate. Colleges: West Valley, Allan Hancock, Southwestern, Pasadena City, Los Angeles
    Southwest, Sacramento City, Cosumnes River, Folsom Lake, Santiago Canyon, East Los Angeles, Napa Valley.
  - `pooled` (Opus, high effort), once a slot frees: El Camino 02513, 02515 and 02517, with El Camino's 4 from the
    census wave; Modesto Junior's 8 other s720j holds; Cuyamaca 18635; the real pools refused at Porterville 06773 and
    30235 and Cuyamaca 18634, 18636 and 18637. Colleges: El Camino, Modesto Junior, Cuyamaca, Porterville.
- **Lane 2 (cheap piles, a fresh worker per college, high effort):** the 07:13Z census's piles, Los Angeles
  Trade-Technical 17, Saddleback 17 and Long Beach City 16; then, as spend allows, S727's holds by key at American
  River 7, Shasta 15, College of the Canyons 14 and Santa Barbara City 5. Colleges: Los Angeles Trade-Technical,
  Saddleback, Long Beach City, then American River, Shasta, College of the Canyons, Santa Barbara City. Each plan gets
  a second reader, a clean md5 pre-read and the conductor's apply.
- **Not tonight:** Cosumnes River's 17 piles (lane 1 holds Cosumnes River); Orange Coast (its 17 piles and 08626 wait
  for a run with room); College of the Desert (robots.txt); Los Medanos (parked); MiraCosta 36144 and 36171 (a capture
  change); the follow-up PR, after the waves if the run has room.

## Split changes during the run

- 11:05Z: the declaration, #3823. 11:08Z: `lever`, `elumen2` and the Los Angeles Trade-Technical (s730a) and
  Saddleback (s730b) piles started on Opus 5.5 at high effort, a fresh worker each. Long Beach City's piles and
  `pooled` wait for a slot. **DECIDED** `d-lever-dispatches-paid-reads-in-words-s731`: `lever` may dispatch paid reads
  on its own branch with `only=`, at most $5 a college and $15 in all on the estimate, beside the free steps S727
  lifted in words (`d-workers-dispatch-loads-in-words-s727`), to save the conductor's context; applies stay the
  conductor's.
- 11:12Z: display build `2c8507c058b1` (18,724 records, built on `main` `56c21b96` with Python 3.12) on
  `claude/s730-display`; the Glendale gate 45602360120 dispatched at 11:13Z.

- 11:16Z: the Glendale gate 45602360120 green: 242 rows at `2c8507c058b1`, nothing else moved, 12 rows with no display
  (S727's new records). 11:17Z to 11:23Z: the whole build 45602989427: 18,723 rows at `2c8507c058b1`, the same 32 at
  older builds, none without a display. #3825 opened for the merge; the census on `main` follows it.
- 11:19Z: Sam's plain session SkyDunlin merged #3824 as S730, so this run moved to S731 and handoff 732
  (`d-routine-yields-730-to-plain-s731`). One writer per file: it holds the Commons files, this run the harvest's.
- 11:21Z: `elumen2` reported: read 45574354887 never extracted the 38 (`held_no_gain` at the read), so no run holds an
  own-page record and a forced reread has nothing to post; the fix is a paid read with `force=`. Five live rows carry a
  degree's total on a certificate (19460, 20175, 20179, 20181, 45151). All 40 live rows read `checked: false` (11:24Z);
  43150 has no live row and takes a pin (`all-automotive-systems-as-fall-2026`). 11:25Z: the conductor dispatched
  Antelope Valley's read on `claude/s730-elumen2` (`only=` the 38 and 43150, `force=` the 38, about $2.73 on the
  estimate); it files to the branch only, and a Sonnet second reader gates the load and reread
  (**DECIDED** `d-elumen-read-before-reader-s731`).

- 11:28Z: s730a (Los Angeles Trade-Technical, `claude/s730-piles-lattc` `2344333b`): 6 named gaps (`noted_figures_differ`
  3, `noted_section_cut_off` 2, `lists_not_closed` 1), 11 held, no new kind. The Long Beach City piles (s731c) started
  in its slot. 11:31Z: its Sonnet reader said APPLY (one minor: the guards abort through a cast error). 11:32Z: clean md5
  pre-read (6 of 6); migrate 45605350857 returned 6, none skipped; `.apply` restored (`567f3a76`).
- 11:33Z: s730b (Saddleback, `claude/s730-piles-saddleback` `ceff0ef8`): 8 rows, `option_lists_read_apart` 4 and
  `waived_course_counted` 4 (new; self-recall 17 of 17, the shape fires on 15 statewide), 9 held, seven of them on a
  `repeat` reconcile step; to an Opus reader. The same worker builds Saddleback's `repeat` step on
  `claude/s731-saddleback-repeat` (a free reconcile, then keep-only for the seven) and stops before the reread.
- `elumen2`'s commit `0665e817` never reached `claude/s730-elumen2`: the worker reported a push that the remote did not
  hold, so Antelope Valley's read 45603949086 runs on `56c21b96` without the 43150 pin (the 38 still force-read from
  their own pages; 43150 waits for its pin). Briefs from here ask for `git ls-remote` proof of a push
  (`p-worker-push-proved-by-ls-remote-s731`).
- 11:44Z: #3825 merged (`9a5deb35`) without a final update from `main`, which had moved only by the plain session's
  #3824, touching none of its files (`d-display-merged-without-main-update-s731`); the census dispatched on `main`.

- 11:43Z: Antelope Valley's read 45603949086 failed in its `read` job after uploading its artifact (15017413156);
  `elumen2` resumed to find why from the log (never a blind rerun), push its commit, and fix the reader's MAJOR (43150 is
  inserted only when it passes `passes_live`). 11:47Z: `pooled` (s731p) started on Opus 5.5 at high effort.
- 11:55Z: s730b's Opus reader said APPLY: MAJOR 1, its test asserts the seven `repeat` holds still fail, which the
  repeat branch changes, so the test accepts either state before the land; MINOR 2, `waived_course_counted` keeps 50
  (**DECIDED** `d-waived-course-counted-keeps-50-s731`: the figure closes only for a student who holds the waiver);
  MINOR 3, the waiver shape misses six worded otherwise (Saddleback 42644, 19551, 22933; Orange Coast 42331; Madera
  39862; Reedley 18957), for the follow-up. 11:57Z: clean md5 pre-read (8 of 8); migrate 45609196483 returned 8, none
  skipped; `.apply` restored (`a354854b`).
- 11:59Z: s731c (Long Beach City, `claude/s731-piles-lbcc` `6d9d3a92`): 13 rows, 3 passing on a rescore (02678, 20940
  `short_high`; 30650 `meets`) and 10 named gaps; 3 held (43021, 37213, 44848); no new kind. Its loads held two and
  three runs, so the worker proved each row's run from its record file's history on `main`
  (`d-multi-run-load-history-proves-run-s731c`); to a Sonnet reader.

- 11:49Z: the census after the display build, 45606909979 on `main` (`d731f9b8`): 15,562 of 20,282 pass, 4,210 have no
  passing record, 510 are collected with a named gap.
- 12:05Z: s731c's reader, round 1: FIX THEN APPLY: 42970 used `no_units_printed`, a kind switched off since its
  self-recall failed. **DECIDED** `d-lbcc-42970-no-units-read-or-hold-s731`: `no_units_read`'s own check refused it, so
  42970 is held with S681's reason. Round 2 (12:14Z): APPLY. 12:16Z: clean md5 pre-read (12 of 12); migrate 45612147342
  returned 12 (3 passing, 9 named gaps); `.apply` restored (`d8076ba6`).
- 12:15Z: `elumen2`: read 45603949086 had stopped at its price step, before any extraction and with nothing spent
  (`only= refused: 43150 has no text in the capture`, since it ran without the pin). Redwoods: read 45609110977 ($0.12)
  read 45557 and 45595 from their own pages, all courses placed and the arithmetic equal; reread 45612300989 replaced
  both live. The reader's MAJOR is fixed: 43150 is inserted only if it passes `passes_live`. 12:21Z: the conductor
  dispatched Antelope Valley's read again on `claude/s730-elumen2` at `977e3cf3`, with the pin (about $3.90).
- 12:19Z: `land` started: s730a, s730b (with its test fix `c9d3341c`) and s731c as one PR, `claude/s731-land`.

- 12:35Z: #3830 opened (`claude/s731-land` `02bf74de`): s730a, s730b and s731c, each applied and live, `.apply` equal to
  `main`'s. 12:41Z: `lints (4)` failed on S703's `tests/program_lists_past_figure_s703_test.py`: s731c moved Long Beach City
  41220 into the shape that test pins (the log named LATTC 08479 among its counts, but 08479 reads the same before and
  after s730a). `land` pinned 41220's two states whole; mutation runs show any other move still fails it
  (`p-test-asserts-other-pr-absent-s721`).
- 12:38Z: `pooled` (s731p, `claude/s731-pooled` `5f9d346d`) changed the shared scorer behind a `POOLED_S731` flag (four
  new pooled phrasings, LIST and CONTINUED headings joined, no pooling inside an option group); self-recall over all
  18,962 records: 18 read differently, all real pools, none from pass to fail, 5 verdicts moved, all this plan's rows.
  **DECIDED** `d-porterville-06773-keeps-s721c-gap-s731`: 06773's read starts mid-page with no heading, so it stays
  collected with s721c's gap and leaves the plan (7 rows). An Opus reader reads the scorer change before any apply.
- 12:47Z: `elumen2` finished. Antelope Valley's read 45612549421 ($2.76) read the 38 and 43150 from their own pages;
  `decide` replaced 37 and kept 16468 (its own-page record adds to 59 to 61 against a stated 60); load 45616752363
  inserted 43150 (passing); reread 45616970396 replaced exactly the 37. With Redwoods' 2, the eLumen follow-up collected
  40 records (1 new, 39 read again from their own pages) for $2.88 of paid reads; head `a2af6cf1`.

- 13:05Z: s731p's Opus reader, round 1: FIX THEN APPLY. BLOCKER: its test sat on lints shard 5, which does not exist.
  MAJOR: the CONTINUED-heading join went by position alone (26 joins, 4 right, 22 wrong); it now needs the first stem
  word to match. MAJOR: 06773's strike would come undone at its next reconcile under the new scorer; it gets a hold the
  reconcile honors. MAJOR: a conflict with `main` in `kb/status/commons_data.json`. One fix list to the worker; round 2
  is the last.
- 13:28Z: #3830 merged (`dafe74c6`; `test` green on `ac4038fa`; `main` had not moved since its base).
- 13:30Z: `lever` told to finish Allan Hancock and wrap up: West Valley's read 45602612349 and load 45605020450 put
  two records live; Folsom Lake 38736 and Allan Hancock 43770 pinned; three named gaps; Allan Hancock's read
  45605429253 filed at 13:29Z.

- 13:30Z to 13:36Z: Allan Hancock's load 45624313337 put 43770 live, passing on its pin to its own entry; 42208 and
  42210 are named gaps with no record (`list_by_reference`), as is East Los Angeles 45028 (`ge_pattern_certificate`).
  West Valley 35588 is held: its extraction overran the model's output limit even in two parts. Southwestern 32693 and
  36634 and Pasadena City 31599 stay held, since rule A refuses each page's heading (a title with no award word): a
  reader change and a second reader. West Valley's cause, found: S727's read 45574056664 restaged capture 43142245126
  (2026-11-12), which predates page counting, so the price step held it as a partial capture, skipped extraction,
  filed only the preview and ended green; load 45575119022 re-posted 133 rows already live. Nothing in the code was
  wrong, and the fresh read fixed it (`f-green-read-files-only-preview-s731`). Not reached: Los Angeles Southwest,
  Sacramento City (its reread), Cosumnes River (33542), Santiago Canyon, Coastline 7, East Los Angeles 38332 and 45540.
- 13:38Z: the dependency map rebuilt on `main` (`ce8ab3e7`, run 45624524420); `lever` merged `main` `dafe74c6` into
  `claude/s730-lever` (`d28bf245`).
- 13:41Z: Sam's plain session's #3831 merged (`87d745e2`: the local subject titles to find, for COBIx), one writer per
  file.
- 13:47Z to 13:51Z: s731p, after its Opus reader's round 2 APPLY and a clean md5 pre-read (7 of 7): migrate
  45627220481 returned 7, 4 passing (Porterville 30235; Modesto Junior 38869 and 43164; Cuyamaca 18628) and 3 named
  gaps (Modesto 06655, 08109 and 10602); 14 held. Round 2's MAJOR went on to the follow-up, not fixed: under
  `POOLED_S731` a Porterville reconcile would file 06773's fresh arithmetic beside its kept gap
  (`f-porterville-06773-flips-on-reconcile-s731`).
- 13:53Z: Saddleback's reconcile 45606980427 (`claude/s731-saddleback-repeat` `16c24807`, from 11:42Z) finished green;
  next, what it filed, keep-only for the seven, a second reader and the reread.
- 13:54Z: the checkpoint-docs worker started on this checkpoint.
- 14:19Z: Saddleback's `repeat` branch: its Opus second reader said REREAD (statewide only the seven differ over
  18,962 records; keep-only exact; none overlaps s730b's eight), with two minors: the steps' `[\s\S]{0,200}?` window
  can bind a code the words do not name (`f-saddleback-repeat-window-s731`), and a `commons_data` conflict at its
  land. The reread 45632688186 posted 7, replaced 7 and held none: 19050 and 19051 (ETT 142) and 41420, 41422,
  41423, 41425 and 41426 (MUS 50), each now its printed total and machine-passing. The worker had dispatched the free
  reconcile before a reader saw its `block_sum` change to shared reconcile code; the reader gated the reread
  (`d-saddleback-reconcile-before-reader-s731`). The branch lands in its own PR after #3827 merges (land 3).
- 14:29Z: #3827 merged (`334aa4f9`), land 2. 14:36Z: the memory rows applied (migrate 45634855263, 19 rows); `.apply`
  restored (`ffe06247`). 15:00Z: #3833 merged (`b3a23b5d`), land 3. Its Secret scan's one finding is a false positive:
  TruffleHog's Holistic detector paired the word in Saddleback 40320's URL (`pgrm_holistic_ca`) with that page's
  sha256 in `sources.json` (verification unknown, no verified secret), and the same line may flag `main`'s push scan.
  15:06Z: the closing census 45640364214 on `main` (`a8f27f67`). Then step 12's stamp and the sign-off.

## What shipped

- **#3825 `9a5deb35` (11:44Z):** display build `2c8507c058b1` (18,724 records): the Glendale gate 45602360120 (242
  rows), then the whole build 45602989427; 18,723 rows at the build, the same 32 at older builds and none without a
  display. It merged without a final update from `main` (`d-display-merged-without-main-update-s731`).
- **#3830 `dafe74c6` (13:28Z), the land PR**, three plans, every one applied and live before the merge, each with a
  second reader, a clean md5 pre-read and the conductor's apply, `.apply` restored after each run:
  - Los Angeles Trade-Technical, s730a (migrate 45605350857): 6 named gaps (`noted_figures_differ` 08479, 21849 and
    44344; `noted_section_cut_off` 02925 and 21867; `lists_not_closed` 08482); 11 held;
  - Saddleback, s730b (45609196483): 8 named gaps (`option_lists_read_apart` 30206, 30207, 36628 and 40322;
    `waived_course_counted`, new, at confidence 50: 04069, 22874, 41673 and 41674); 9 held, seven of them on the
    `repeat` branch;
  - Long Beach City, s731c (45612147342): 12, 3 passing on a rescore (02678, 20940, 30650) and 9 named gaps; 4 held;
  - S703's lists-past-figure test now pins Long Beach City 41220's two states.
- **#3827 `334aa4f9` (14:29Z), land 2 (`claude/s730-lever`):**
  - the eLumen follow-up (`claude/s730-elumen2`, `a2af6cf1`): Antelope Valley's read 45612549421 ($2.76), load
    45616752363 (43150 inserted, passing) and reread 45616970396 (37 replaced; 16468 kept); Redwoods' read 45609110977
    ($0.12) and reread 45612300989 (45557 and 45595 replaced): 40 records read from their own pages;
  - the pooled reading's next, s731p (`claude/s731-pooled`, migrate 45627220481): 7, 4 passing and 3 named gaps; 14
    held; the shared scorer behind `POOLED_S731`;
  - the lever: West Valley 06276 and 32021 (read 45602612349, $0.15; load 45605020450) and Allan Hancock 43770 (read
    45605429253, $0.08; load 45624313337) live, all passing; 3 named gaps for programs with no record (Allan Hancock
    42208 and 42210; East Los Angeles 45028); Folsom Lake 38736 pinned to p.176.
- **#3833 `b3a23b5d` (15:00Z), land 3 (`claude/s731-saddleback-repeat`):** Saddleback's `repeat`
  steps with the opt-in `block_sum` guard (self-recall over 321 Saddleback records: the seven alone): reconcile
  45606980427 (`extract=0`), keep-only, an Opus reader's REREAD, and reread 45632688186 (14:19Z): 19050, 19051,
  41420, 41422, 41423, 41425 and 41426 replaced, each now its printed total, all passing.

**Tonight's count:** 83 records collected and live: lane 2's piles 26 (Los Angeles Trade-Technical 6, Saddleback 8,
Long Beach City 12; 3 passing, 23 with named gaps); the pooled reading's next 7 (4 passing, 3 named gaps); the eLumen
follow-up 40 (1 new, 39 read again from their own pages); the lever 3, all passing; Saddleback's `repeat` steps 7,
read again and all passing. Besides: 3 named gaps for programs
with no record. 0 outline rows (step 11's queue is empty). Paid reads $3.11 (the eLumen follow-up $2.88, the lever
$0.23).

**The closing census on `main`:** run 45640364214 (15:06Z, `a8f27f67`): 15,577 of 20,282 active programs pass and
4,176 have no passing record (4,227 at this run's start, 51 fewer); 529 are collected with a named gap (504 at the
start). The census after the display build, run 45606909979 (11:49Z, `d731f9b8`), read 15,562, 4,210 and 510. Step
12's headline: 15,577 of 20,282 at 118 colleges (15,551 at the start).

Read in order: this file; the NEXT of [`program-requirements-harvest`](reference/lanes/program-requirements-harvest.md);
`docs/program_requirements_harvest_lessons.md`, *S731*; `docs/reference/conductor_mode.md`, *What went wrong in S731*;
[`methodology-a-self-check-must-see-what-the-rule-writes`](kb-notes/methodology-a-self-check-must-see-what-the-rule-writes.md),
*S731*.

## Open work, from the lanes' NEXT lines

1. **`program-requirements-harvest`** (the routine's):
   - The display build carrying tonight's records, gate college Glendale, then `harvest-gap-census.yml` on `main`
     (NEXT (2)).
   - Lane 1 (NEXT (3)): Los Angeles Southwest 4, Sacramento City 4 with its one reread, Cosumnes River 3 with 33542,
     Folsom Lake 38736 (pinned, not yet read), Santiago Canyon 3, Coastline 7, East Los Angeles 38332 and 45540 (a paid
     read, about $0.16) and Napa Valley 3; the pooled reading's next (El Camino 02513, 02515 and 02517 by a free
     reconcile; El Camino 19861, 19866, 38948 and 43993 by a paid read; Cuyamaca 18634 to 18637; Modesto 06683, 35127
     and 42664), with no Porterville reconcile before the follow-up's guard; the eLumen follow-up's rest (Antelope
     Valley 16468; 02139 and 20148; Mission's 8 binds at its next capture); West Valley 35588 and rule A's three
     (Southwestern 32693 and 36634, Pasadena City 31599) on a reader change; then a fresh census's wave.
   - Saddleback's `repeat` steps (NEXT (4)): the seven are live and passing; land 3 after #3827; before Saddleback's
     next read, put `units:?\s*2(?:\.0+)?\s*` before the code, drop the second step and rerun the recall
     (`f-saddleback-repeat-window-s731`).
   - Lane 2 (NEXT (5)): Cosumnes River's 17 once lane 1 leaves it; S727's holds by key at American River 7, Shasta 15,
     College of the Canyons 14 and Santa Barbara City 5; Orange Coast's 17 and 08626 in a run with room; then a fresh
     census's piles. Tonight's holds by key are in the Blocks below.
   - The one follow-up PR, after the waves (NEXT (6)): the Porterville 06773 guard first, then
     `f-continued-heading-list-b-joins-s731`, `f-waiver-shape-misses-six-s731`, `f-green-read-files-only-preview-s731`
     and `f-follow-up-minors-s731`; then the older items (S713's list with SDCCE's 6 SLO-label rows first, COBIx's
     minors, Cerritos 35166's pin, the free rules, S721's minors and S727's three).
   - Step 11: the outline queue is empty until a census, a capture or a verdict row changes (NEXT (1)).
2. **A plain session's, each by its lane's NEXT.** They wait because conductor runs stay on collection (Sam's routine
   prompt of 2026-11-17: *"No new UI, tooling or governance work in conductor runs."*):
   - `common-subjects-reference` and `commons`: Sam's plain sessions hold them (S730's #3824, #3826 and #3831 merged
     tonight; handoff 731 names SkyGodwit). The common-subjects-reference lane's NEXT: load COBIx's titles into the
     Subjects titles, rescore the stray codes' local subjects with the title leading, then the dry-run re-mint for Sam
     (`r-no-mid-on-a-stray-code-sam-2026-11-25`); then the re-point of the folded local codes;
   - `implementation-funding` (25,555 bytes against 20,000: compact the lane first, then its NEXT), `cer-procedures`
     (compact first, 21,633 bytes), `my-college-action-page`, `repo-size`, `governance-team-enablement`, `library`,
     `sierra-page-redesign` and `common-cr-reference`, each by its lane's NEXT;
   - the brief's slimming items (`d-slimming-left-to-plain-session-s720`).

## Blocks (Sam's ruling 1: listed here until the Commons' Needs you shows them)

| Block | Who clears it | Since |
|---|---|---|
| Porterville 06773: under `POOLED_S731` a Porterville reconcile keeps its gap but files the fresh arithmetic (18 equal to 18), so the census and the tab would count it passing; keep the filed arithmetic for a `GAP_HELD` record (`kb/_program_requirements_college.py`, about line 7884), with a test that 06773 still fails (`f-porterville-06773-flips-on-reconcile-s731`) | Sky, the follow-up, before any Porterville reconcile | 2026-11-25 (S731) |
| Saddleback's `repeat` window: the steps' `[\s\S]{0,200}?` window can bind a code the words do not name; put `units:?\s*2(?:\.0+)?\s*` before the code, drop the second step and rerun the recall (`f-saddleback-repeat-window-s731`) | Sky, before Saddleback's next read | 2026-11-25 (S731) |
| Land 3, `claude/s731-saddleback-repeat`: its own PR after #3827 merges (the seven live; a `commons_data` conflict at its land) | Sky, the conductor | 2026-11-25 (S731) |
| Tonight's holds by key, each reason in its plan's receipt: Los Angeles Trade-Technical 11 (02911, 21855, 31090, 31280, 41150; 31089, 41011, 45285; 18857; 38737; 37706); Saddleback 04073 and 36625; Long Beach City 43021, 37213, 44848 and 42970 | Sky, lane 2 | 2026-11-25 (S731) |
| The pooled reading's next, held in s731p: El Camino 02513, 02515, 02517 (a free reconcile); El Camino 19861, 19866, 38948, 43993 (a paid read; the host is blocked from the sandbox); Cuyamaca 18634, 18635, 18636 (a reconcile step that needs page text) and 18637 (read from Grossmont's page); Modesto 06683, 35127, 42664 | Sky, lane 1 | 2026-11-24 (S721), S727, S731 |
| West Valley 35588: its extraction overran the model's output limit even in two parts | Sky, lane 1 (a reader or capture change) | 2026-11-25 (S727), S731 |
| Southwestern 32693, 36634 and Pasadena City 31599: rule A refuses each page's heading (a title with no award word) | Sky, a reader change and a second reader | 2026-11-25 (S727), S731 |
| The eLumen follow-up's rest: Antelope Valley 16468 keeps its sister-page record (its own page adds to 59 to 61 against a stated 60); 02139 and 20148 read unequal, collected with no gap; Mission's 8 binds move at its next capture | Sky, lane 1 | 2026-11-25 (S727), S731 |
| "LIST A" then "LIST B CONTINUED" still joins, and GE and list-size sentences fire the new pooled phrasings (`f-continued-heading-list-b-joins-s731`) | Sky, the follow-up | 2026-11-25 (S731) |
| The waiver shape misses six: Saddleback 42644, 19551, 22933; Orange Coast 42331; Madera 39862; Reedley 18957 (`f-waiver-shape-misses-six-s731`) | Sky, the follow-up | 2026-11-25 (S731) |
| A read whose price step holds a partial capture skips extraction and still ends green (`f-green-read-files-only-preview-s731`) | Sky, the follow-up | 2026-11-25 (S731) |
| Tonight's minors: the pile SQL guards abort through a `::int` cast error; `js-tests.yml`'s Long Beach City step comment says 10 named gaps and 3 held where the receipt says 9 and 4 (`f-follow-up-minors-s731`) | Sky, the follow-up | 2026-11-25 (S731) |
| S727's holds by key, each reason in its plan's receipt: American River 7 (07207, 12191, 12238, 30595, 39341, 39731, 39732); Shasta 15; College of the Canyons 14; Santa Barbara City 5 (19012, 30746, 43553, 45452, 46520) | Sky, lane 2 | 2026-11-25 (S727) |
| Santa Barbara City 05934: on S714's hold until `find_codes` reads a slash cross-listing's first code (0 of 97 found) | Sky, the follow-up (a capture fix) | 2026-11-23 (S714), S727 |
| `noted_total_cut_off` fires on 664 failing records statewide: a self-recall before it files beyond 20130 | Sky, the follow-up | 2026-11-25 (S727) |
| The census ignores a college's own named-gap files (14 programs relisted) | Sky, the follow-up | 2026-11-25 (S727) |
| Orange Coast 08626, filed from the Airframe & Powerplant A.S. page; a title heading check alone passes a successor's page (32235) | Sky, lane 1 | 2026-11-25 (S727) |
| S721's holds by key, each reason in its plan's receipt: Orange Coast 17 (08670 `degree_total_minimum` and 32737's substitution list among them); Palo Verde 5 (17998, 17999, 41227, 41242, 45359); Porterville 4 (09528, 35229, 35449, 45511); Gavilan 11 (08460, 19378, 38787 among them); Butte 3 (01312, 14583, 33579) | Sky, lane 2 | 2026-11-24 (S721) |
| MiraCosta 36144 and 36171 (`text_window_cut`: their section prints past the capture's 16,000 characters) | Sky, a wider text window | 2026-11-24 (S721) |
| The follow-up's minors: a kept `degree_within_map_range` is not checked against `within_map`; a certificate's heading check accepts a plural department heading; #3764's `live_flips` reads the filed arithmetic for rescored rows, and "List A requires 9 units together with its lab" still pools | Sky, the follow-up | 2026-11-24 (S721) |
| S720's holds by key, each reason in its plan's receipt: Fullerton 7, City College of San Francisco 9, Santa Monica 3, College of the Sequoias 2 (06770, 45030), Clovis 5, East Los Angeles 6 (33013 among them), Glendale 1 (45068), Ventura 17, Cabrillo 13, Contra Costa 6, El Camino 8 | Sky, lane 2 (a person for 33013) | 2026-11-24 (S720) |
| The free rules: City College of San Francisco 17615 to 17618 (own-option reading); Cabrillo 06352, 06380, 06381, 44992 (recommended lists); Fullerton 33680, 42143 and Ventura 30587 (a closed-list rescore); Cerritos 35166 (a pin, the whole-major exception) | Sky, the follow-up | 2026-11-24 (S720) |
| Sacramento City: 26 course-id gains and 4 kept `ge_units_not_read` gaps (04662, 17873, 17875, 42894) | Sky, one reread | 2026-11-24 (S720) |
| Cosumnes River 33542 (Option II's two blocks read as alternatives), held on `main`'s filing; Folsom Lake 38736, pinned to p.176 in S731, not yet read | Sky, lane 1 | 2026-11-23 (S714), S720, S731 |
| Fullerton: 15 of its 296 passing records are not on their own page | Sky, a page read | 2026-11-24 (S720) |
| East Los Angeles's bound is unmeasured on capture text (41097 likely; 36345, 37924, 43632, 45935 possible) | Sky, a free reconcile before its next text run | 2026-11-23 (S714) |
| The 30-day artifact `course-outcomes-45026998155-part1` holds trial pages that print a staff name: delete it | a person | 2026-11-22 (S703) |
| Records held for a person that s727f held, each reason in its receipt: Santa Monica 03281, Glendale 44488, Clovis 36326 and 39539, East Los Angeles 33013, Los Angeles City 32832, Cerritos 44984 (a reload); Los Angeles Mission 44849 (no live row) | Sky for the reload; a person for the rest | S653 to S727 |
| Santa Rosa Junior 06566 and 32298, held: the second reader found the wrong cause | Sky, a reread or a rule | 2026-11-23 (S713) |
| Las Positas 01037 (passes only by double counting) and 09227; Antelope Valley 39295 | Sky, lane 2 | 2026-11-23 (S713) |
| College of Marin: its program URLs changed form, so the moved-page guard stopped its general education step (19789, 19791) | Sky, a capture or guard fix | 2026-11-23 (S713) |
| The next follow-up's minors (S703 and S713's list, lessons archive 9, *Moved from the lane (S714 checkpoint)*, NEXT (2)), SDCCE's 6 SLO-label rows first | Sky, the next follow-up | 2026-11-22 (S703) |
| COBIx's minors: `f-cobix-minors-s713`; `f-cobix-minors-s714` | COBIx | 2026-11-23 (S713, S714) |
| City College of San Francisco's Cal-GETC dry run (32080, 33652, 46300): the permission check refused it twice | a plain session | 2026-11-21 (S691) |
| Golden West's 476 outline header rows: the guarded correction | a plain session's review | 2026-11-20 (S690) |
| Cerritos 20504: its run also holds 44984, held for a person | a person, on 44984 | 2026-11-21 (S697) |
| College of the Desert: its 8 keep their gap and its 23 on the reader-page lever wait (the prior catalog sits behind robots.txt) | the college, or another source | 2026-11-20 (S689) |

Cleared tonight: handoff 728's West Valley row (06276 and 32021 live and passing on a fresh read, the empty load's cause
found; 35588 holds on its own row); Allan Hancock 43770 (live, passing on its own entry), 42208 and 42210 (named gaps
with no record) from the #3811 holds; East Los Angeles 45028 (a named gap with no record); the eLumen follow-up's 38,
Redwoods 45557 and 45595 and 43150's pin (37 replaced and 43150 inserted at Antelope Valley, both Redwoods records
replaced); Modesto's 8 s720j holds (2 passing, 3 named gaps, 3 held), Porterville 30235 and Cuyamaca 18628 passing;
Saddleback's seven on the `repeat` steps (each now its printed total, passing);
the census's piles at Los Angeles Trade-Technical, Saddleback and Long Beach City.

## For Sam

Nothing waits on Sam ([Open Asks Sheet 200](https://claude.ai/artifact/5ShC7pGgNuz9bJUhkdsc8Y), current; no reply
since 2026-11-19T23:47Z). Every call tonight was the conductor's, recorded below and reversible.

## Decisions Sam made

None tonight. Sam's one word in this session, about 10:55Z: *"You should be clear to go"*, after which the run took the
queue. The run acted on his routine prompt of 2026-11-17 (*"Conductor mode is back for collection only."*; *"Two
lanes, never on the same college"*; *"Stop a review after two rounds and send what is left to Sam or COBIx."*) and his
collect-with-gaps ruling of the same day.

## Decisions (the conductor's, each reversible)

- `d-routine-yields-730-to-plain-s731`: the declaration moved from S730 to S731 when Sam's plain session took 730.
- `d-lever-dispatches-paid-reads-in-words-s731`: `lever` dispatched paid reads on its own branch with `only=`, at most
  $5 a college and $15 in all on the estimate.
- `d-elumen-read-before-reader-s731`: the eLumen paid read went before its second reader, since a read files to the
  branch only; the reader gated the load and reread.
- `d-display-merged-without-main-update-s731`: #3825 merged without a final update from `main`, which had moved only by
  the plain session's #3824, touching none of its files.
- `d-waived-course-counted-keeps-50-s731`: the new kind keeps 50; the figure closes only for a student who holds the
  waiver.
- `d-lbcc-42970-no-units-read-or-hold-s731`: 42970 held, since `no_units_read`'s own check refused it.
- `d-multi-run-load-history-proves-run-s731c` (the worker's, confirmed by the second reader): where a load held two or
  three runs, each row's run is proved from its record file's commit history on `main`.
- `d-porterville-06773-keeps-s721c-gap-s731`: 06773 left s731p; it keeps s721c's gap (`NG.GAP_HELD`).
- `d-saddleback-reconcile-before-reader-s731`: the Saddleback worker dispatched the free reconcile (`extract=0`,
  branch only) before a reader saw its `block_sum` change to shared reconcile code; the reader gated the reread.

Memory rows: `kb/migrations/2026-11-25_s731_cpl_memory_rows.sql` (19 rows, all proposed, rollback in its header; run
twice and rolled back in a scratch Postgres 16 database), drafted for the conductor to apply (one `execute_sql` call, or
`supabase-migrate.yml` through `.apply`). DECIDED lines: the harvest lane.

## Patterns that worked

- **A worker's push is proved by `git ls-remote`** before the conductor dispatches on its branch
  (`p-worker-push-proved-by-ls-remote-s731`).
- **A scorer change behind a flag gets an Opus reader and a statewide self-recall** (`p-pooled-change-opus-reader-recall-s731`;
  the kb-note above, *S731*): round 1 found 22 wrong joins of 26 that the recall did not count.
- **A test accepts either state of a record another open branch moves** (`p-test-asserts-other-pr-absent-recurs-s731`).
- **A load that held two or three runs proves each row's run** from its record file's history on `main`
  (`d-multi-run-load-history-proves-run-s731c`).
- **A fresh read, never a rerun,** for a result nobody could explain (West Valley; `d-west-valley-no-blind-rerun-s727`).
- One display build first, while no apply was in flight, then the census on `main`; three applied plans landed as one
  PR (#3830); a second reader on every plan, a clean md5 pre-read and the conductor's apply; Saddleback's seven on an
  opt-in guarded `repeat` step whose reader found only the seven differ statewide.

## Findings

- `f-porterville-06773-flips-on-reconcile-s731`: a Porterville reconcile under `POOLED_S731` would count 06773 passing.
- `f-continued-heading-list-b-joins-s731`: "LIST A" then "LIST B CONTINUED" still joins.
- `f-waiver-shape-misses-six-s731`: six waivers worded otherwise.
- `f-green-read-files-only-preview-s731`: a read that holds a partial capture ends green and files only its preview.
- `f-follow-up-minors-s731`: the pile guards' cast-error abort; `js-tests.yml`'s Long Beach City comment.
- `f-saddleback-repeat-window-s731`: the `repeat` steps' window can bind a code the words do not name.

## Safety patterns to honor

All of handoff 728's: a plan's test true before and after its own apply and beside any PR it does not depend on; a
record a cheaper lever passes stays on that lever; one dispatch at a time per branch; a fresh worker per branch; one
writer of `.apply` per branch, the conductor, and a worker pulls before it commits once the conductor has touched its
branch; `on_live_run`, the own-page guard and `scorer_passes` on every plan; a reconcile keeps only the records it was
for; the own-page guard keys on the pages the records were read from; an insert's rollback is proved against a verdict
on the inserted row; a reader fix names the road it serves in code. New tonight: the conductor reads a branch's head
with `git ls-remote` before it dispatches a read there; a plan's test accepts either state of a record another open
branch moves; a kind switched off after a failed self-recall files nothing, and a record its replacement kind refuses
is held; no Porterville reconcile runs before the `GAP_HELD` arithmetic guard. `.apply` goes back to `main`'s value
after every apply, so no merge carries a live trigger. Never file a person's name from an outline page anywhere. A
permission-check refusal is never routed around.

## Conductor settings

A conductor run for collection only, under Sam's routine prompt of 2026-11-17 (`docs/reference/conductor_mode.md`,
*Back for collection only*; review rounds as his ruling of 2026-11-20 sets them): two lanes, never on one college; about
$750 a day for everything, $10k running total for the whole job; workers on Opus 5.5, high effort on any worker that
writes shared data; Sonnet or Haiku for routine reads; reviews at most 9 agents, stopped after two rounds with what is
left sent to Sam or COBIx; $40 per college per run for program requirements and a separate $40 for SLOs, PLOs and
course objectives, per run, never a remaining pot. Stop rules from the brief: a day over $300 with fewer than 40 new
programs; over $12 per new program or $0.50 per outline row; a rollback that undoes over 1% of a day's rows; the $10k
checkpoint. The conductor ran on Opus 5.5 (the routine's form names Fable 5.2). S727 spent about $314 earlier on this
UTC day and Sam's plain sessions S725, S726 and S729 ran unmetered, with S730 beside this run, so this run aimed at about
$200 and planned no new worker after about $150.

## Ledger

| PR or branch | State | Next |
|---|---|---|
| #3823 (`claude/awesome-fermat-uods25`) | the declaration and this checkpoint | merges at sign-off |
| #3825 (`claude/s730-display`) | merged `9a5deb35` (11:44Z); display build `2c8507c058b1` live | none |
| #3830 (`claude/s731-land`) | merged `dafe74c6` (13:28Z): s730a, s730b and s731c, all applied and live | none |
| #3827 (`claude/s730-lever`), land 2 | merged `334aa4f9` (14:29Z): the lever, the eLumen follow-up and s731p, all live | none |
| `claude/s730-elumen2` | head `a2af6cf1`; 40 records live | lands in #3827 |
| `claude/s731-pooled` | s731p applied (migrate 45627220481, 7 rows) | lands in #3827 |
| `claude/s730-piles-lattc`, `claude/s730-piles-saddleback`, `claude/s731-piles-lbcc` | landed in #3830 | none |
| #3833 (`claude/s731-saddleback-repeat`), land 3 | merged `b3a23b5d` (15:00Z): reconcile 45606980427 (11:42Z to 13:53Z), keep-only, an Opus reader's REREAD; reread 45632688186 (14:19Z): 7 replaced, all passing | none |
| Harvest gap census on `main` | run 45606909979 (11:49Z): 15,562 pass, 4,210 without, 510 with a named gap; the closing run 45640364214 (15:06Z): 15,577 pass, 4,176 without, 529 with a named gap | the next after tonight's display build |
| #3824, #3826, #3828, #3831 | Sam's plain session SkyDunlin's, merged `d012b203` (11:19Z), `d077c4ff` (11:48Z), `1acd0659` (12:11Z), `87d745e2` (13:41Z) | none |
| #3383 | dependabot's | waits |

## Let go

No PR subscription, scheduled check-in, artifact watch or COBIx watcher was opened tonight, so there is none to drop.
Workers end with the session; each branch is pushed. The vault note for this run is
`CPLBrain/07-session-notes/2026-11-25-s731-skyfrigatebird-collection.md`, on the vault's branch
`claude/pensive-archimedes-uods25` (draft PR samueltlee/CPLBrain#867, which merges on its checks).

Spend: $201 (a token-count estimate at list prices, kb/_spend_meter.py's rates; no cost readout here); collection $201; 2026-11-25T10:12Z to 2026-11-25T15:25Z. Opus 5.5 about $195 (the conductor about $31, 22 agents about $164), Sonnet $5.03 (readers), Haiku $0.57 (PR gates). The paid reads' own cost, about $3.11 on their meter, is listed apart. Stop rules: none fired (83 records, about $2.42 each; no outline rows; no rollback).

Opening line: *Greetings, you are SkyOystercatcher (the next free session number at your start; Sam's plain sessions hold 730 and handoff 731), see SkyFrigatebird's (S731) handoff — `docs/session_732_handoff.md` — let's keep rolling with our queue.*

Session cost about $201 (a token-count estimate; get_session is not available here); 83 records collected and live, plus 3 named gaps for programs with no record; 0 outline rows added; 4 substantive PRs merged (#3825, #3830, #3827, #3833), not counting checkpoints.
