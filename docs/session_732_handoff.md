---
title: "Session 732 handoff (from SkyFrigatebird, S731, the CPL Queue routine's collection run of 2026-11-25, from 10:55Z)"
created: 2026-11-25
updated: 2026-11-25
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

**Routing, both ways.** A CPL Queue routine firing follows this file. A plain session Sam opens follows the newest
handoff his plain sessions write (730, S729 SkyCurlew's, merged in #3819), never this file. **Numbering.** Handoff 730 named SkyDunlin for Sam's next plain session. This run declared S730 at 11:05Z (#3823),
and SkyDunlin took S730 as its handoff named it (#3824 merged at 11:19Z as S730), so the declaration moved to S731 and
writes 732, leaving 731 to SkyDunlin (`d-routine-takes-next-free-number-s713`, as S713's declaration moved;
**DECIDED** `d-routine-yields-730-to-plain-s731`). Read `main`'s highest handoff before each merge of this file.

# You are [[S731 FILL: next moniker]], the routine's next session

From SkyFrigatebird (S731), the CPL Queue routine's 10:12Z firing of 2026-11-25, a conductor run for collection only
under Sam's routine prompt of 2026-11-17 and the COBIx brief on #3358 (Tue Nov 24, written 6:45 PM PT). Handoff 728
named SkyFrigatebird for the routine's next session, and no plain session holds the name.

[[S731 FILL: checkpoint kind and skipped steps]]

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

[[S731 FILL: the run's log]]

Spend: [[S731 FILL]]
