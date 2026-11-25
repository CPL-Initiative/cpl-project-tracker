---
title: "Session 728 handoff (from SkyTropicbird, S727, the CPL Queue routine's collection run of 2026-11-25, from 06:12Z)"
created: 2026-11-25
updated: 2026-11-25
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

**Routing, both ways.** A CPL Queue routine firing follows this file. A plain session Sam opens follows the newest
handoff his plain sessions write (726, SkyAvocet's, or 727 once S726 writes it), never this file. **Numbering.** Sam's
plain session S726 (SkyAvocet) merged #3802, #3805 and #3806 before this firing and has not written handoff 727, so
this run takes S727, the next free number, and writes 728, leaving 727 to S726 (`d-routine-takes-next-free-number-s713`).

# DRAFT: the declaration (S727 is working; this file is finished at its checkpoint)

From SkyTropicbird (S727), the CPL Queue routine's 06:12Z firing of 2026-11-25, a conductor run for collection only
under Sam's routine prompt of 2026-11-17 and the COBIx brief on #3358 (Tue Nov 24, written 6:45 PM PT). Handoff 722
named SkyTropicbird for the routine's next session, and no plain session holds the name.

## The start (06:12Z firing, 2026-11-25)

- Step 0: the night's first firing. No successful `daily-dashboard.yml` run on UTC 2026-11-25 (the newest, 45501998997,
  ran at 22:33Z on 11-24), so the firing dispatched one on `main` at 06:14Z (run 45559142493).
- One writer: no `list_sessions` or `get_trigger` here. Open PRs at 06:15Z: dependabot's #3383 alone. `main` at
  `f790f9f1` (S726's #3806, 03:18Z). S726 left no open PR, and a plain session never stands the queue down (Sam,
  Nov 22, in the brief).
- No pause line (handoffs 722 and 726). Three repos attached. `check_hooks_live.py`: ROOT LIVE (the guards, the context
  meter, the merge-read and clock guards). Context at start 26.5% of 786,077.
- Sheet 200: no reply since 2026-11-19T23:47Z. `queue_todo_done` since 2026-11-24: none. Rule 8's memory read: S721's
  rows are live. Steps 6 and 7: the Library's 2 requests and 3 revise requests are the daytime Library run's; conductor
  runs hold to collection. Step 10, the credential harvest: held, as in every conductor run since 2026-11-17
  (`d-credential-watch-held-in-conductor-runs-s721`). Step 11: the outline queue is empty until a census changes.
- Census on `main` (run 45526918442, 01:40Z): of 20,282 active programs, 15,524 pass and 4,289 have no passing
  record; 469 are collected with a named gap.

## The college split (written before any worker started)

Two lanes, never on one college at the same time, one writer per college (`d-lane-names-only-colleges-in-flight-s681`).

- **Lane 1 (collection):**
  - `display` (the conductor), first, while no apply is in flight: one display build carrying S721's records after
    `6de40ebdf2fd` (#3763's 12 loads, #3764's 15 rows, #3769's 42), gate college Glendale, then the whole build, then
    `harvest-gap-census.yml` on `main`.
  - `pooled` (Opus, high effort), the pooled reading's next: Modesto Junior's 5 s720j holds that pass under it (08104,
    08111, 33944, 37300, 38067), El Camino 02513, 02515 and 02517, and the flips at Rio Hondo 3, Cuyamaca 2 and Golden
    West 1. Colleges: Modesto Junior, El Camino, Rio Hondo, Cuyamaca, Golden West.
  - `elumen` (Opus, high effort), the lever: the eLumen sister-award swap, a reader fix to `assign()` with its
    self-recall, then free page reads and a paid read with `only=`, at most $5 a college on the estimate, which the
    conductor dispatches (Antelope Valley about 47; Redwoods 42895, 45557, 45595), and Antelope Valley 43028 collected
    with its gap named. Colleges: Antelope Valley, College of the Redwoods.
  - `lever` (Opus, high effort): San Bernardino Valley 32317's paid read; Orange Coast's 8 on the reader-page lever;
    then the census's Next wave, Los Angeles Southwest 4, North Orange Continuing Education 4, Sacramento City 4 (with
    its one reread), Cosumnes River 3 (with 33542) and Folsom Lake 38736, then Allan Hancock, Moorpark, Pasadena City,
    Santiago Canyon, Southwestern and West Valley as spend allows. Colleges: San Bernardino Valley, Orange Coast, Los
    Angeles Southwest, North Orange Continuing Education, Sacramento City, Cosumnes River, Folsom Lake, Allan Hancock,
    Moorpark, Pasadena City, Santiago Canyon, Southwestern, West Valley.
- **Lane 2 (cheap piles, a fresh worker per college, high effort):** the census's `reconcile_steps` piles, College of
  the Canyons 20 (with 43388), then American River 19, Shasta 19 (with 18153) and Santa Barbara City 18 (with 05934);
  then the Butte reconcile that reads the map's elective line (01362, 07269, 11136, 31042, 31941, 32469, 33199, 40923,
  43453); then the records held for a person, each collected with its gap named under Sam's collect-with-gaps ruling
  (De Anza 45499; Santa Monica 03281, 10345, 43765; Glendale 44488; Clovis 33501, 36326, 39539; East Los Angeles 33013;
  Cerritos 44984; Contra Costa 01417; West Los Angeles 46261, 38677; Napa Valley 19126, 31158, 36528; Los Angeles Harbor
  44947; Los Angeles City 32832; Ventura 45355). Colleges: College of the Canyons, American River, Shasta, Santa
  Barbara City, Butte, De Anza, Santa Monica, Glendale (after the display gate), Clovis, East Los Angeles, Cerritos,
  Contra Costa, West Los Angeles, Napa Valley, Los Angeles Harbor, Los Angeles City, Ventura. Each plan gets a second
  reader, a clean md5 pre-read and the conductor's apply.
- **Not tonight:** Orange Coast's 17 piles (lane 1 holds Orange Coast for its 8); College of the Desert (robots.txt);
  Los Medanos (parked); MiraCosta 36144 and 36171 (a wider text window is a capture change, the follow-up's); the
  follow-up PR, after the waves if the run has room. **Spend aim:** about $250 for this run against the $750 day (Sam's
  plain sessions S725 and S726 ran earlier on this UTC day, unmetered).

## Split changes during the run

- 06:24Z: the declaration, #3807. 06:26Z: `pooled`, `elumen`, `lever` and the College of the Canyons and American River
  piles started on Opus 5.5 at high effort, a fresh worker each.
- 06:31Z to 06:40Z: display build `f4b48370bc11` (#3808; 18,712 records, built on `main` `d4a7899a` after the daily
  run 45559142493): the Glendale gate 45561297276 (242 rows), then the whole build 45561786292; live after it, 18,711
  rows at the build, the same 32 at older builds and none without a display.
- 06:32Z: San Bernardino Valley 32317's paid read 45561301147 on `claude/s727-lever` (`only=32317`, about $0.07).
- 06:45Z: `test` on #3808 failed on `tests/statewide_subject_codes_test.py` check (5): the daily build reads LAWEN as
  settled by a person's statewide filing (CRIM), which outranks the named-code rule the check pinned. Fixed on #3808
  (`46a3d804`), since it failed every PR from `d4a7899a`.
- 06:55Z: American River's plan s727b (14 collected with named gaps, one new kind, `option_lists_read_apart`; 5
  held) to an Opus reader; the pooled plan s727p (11 to passing: Modesto Junior 5, Rio Hondo 3, Cuyamaca 2, Golden
  West 1; El Camino's three held) to a Sonnet reader; Shasta's piles started.
- 06:58Z: College of the Canyons's plan s727a (9 collected with named gaps, 43388 inserted, a new kind
  `heading_not_in_text`; 12 held) to an Opus reader; Santa Barbara City's piles started. `lever`'s Orange Coast work
  (#3811: 3 pins, 5 named gaps, a reader change to `site_heading_names`) to an Opus reader before its paid read.
- 06:59Z to 07:03Z: s727p's Sonnet reader said APPLY (one minor: the test also compares the load image with the
  receipt's after-image; its independent checks stand); clean md5 pre-read (11 of 11), migrate 45564723291 returned 11,
  all 11 live at their after-images; `.apply` restored (`ba6dbb2c`).
- 06:58Z: San Bernardino Valley 32317's read filed (`5ab12497`, own page, 11 of 11 placed, passing, $0.075); its load
  45565240210 (07:04Z to 07:05Z) put it live, passing.
- 07:08Z: #3808 merged (`0b13c85c`); census 45565884062 on `main` (07:13Z): 15,536 of 20,282 pass, 4,277 without a
  passing record, 469 collected with a named gap.
- 07:10Z: `elumen`'s fix is ready (#3810, `682f216d`: `label_score()` reads the award from the heading; self-recall 1,043
  right, 0 wrong at 15 eLumen colleges; binds move at Antelope Valley 47, Redwoods 10, Mission 8), with plan s727v for
  43028 (a new kind, `ge_figures_other_pattern`), to an Opus reader before any read uses it. Of the 47 at Antelope
  Valley, 43 already have live rows read from the sister page; 20166, 20184, 20186 and 43150 have none.
- 07:17Z: `lever`'s reader (Opus) said DISPATCH for Orange Coast's read, with three findings that gate #3811's merge
  (a js-tests step without a shard; no committed self-recall for the title cut; 42115 and 42117 printed by reference,
  not differing). Orange Coast's read 45567337117 (`only=04007,22394,33569`, `force=04007,33569`, about $0.22) and
  Southwestern 33642's (45567354959, `sources_from=44529722751`, about $0.07) dispatched. The worker fixed all three
  (`4d9f5ece`; `list_by_reference` for 42115 and 42117).
- 07:20Z: American River's reader: FIX THEN APPLY (the own-page guard read a re-paginated capture, so 12238 holds;
  12191 passes on a cheaper `unit_line` step, so it holds). Canyons's reader: FIX THEN APPLY (the rollback broke on a
  verdict on the inserted 43388; the delete needed its own expect line; 02277 and 15477 pass on cheaper readings).
  Shasta's reader (Sonnet): no blocker; its `commons_data.json` is regenerated at the land.
- 07:27Z: Shasta's plan s727c applied after a clean md5 pre-read (migrate 45568232574, 4 live with named gaps);
  `.apply` restored (`66790a5d`). Santa Barbara City's plan s727d (13: 7 passing, 6 named gaps, a new kind
  `required_list_outside_total`) to an Opus reader; Butte's reconcile worker started.
- 07:40Z: American River fixed at 12 rows (a second new kind, `noted_total_cut_off`, for 20130) to round 2 with its
  reader. Canyons fixed at 7 rows; the conductor asked for a course-list cap of 50 on `heading_not_in_text` before
  round 2, since 43388's list cannot be told from its page's other lists.
