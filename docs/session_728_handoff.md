---
title: "Session 728 handoff (from SkyTropicbird, S727, the CPL Queue routine's collection run of 2026-11-25, from 06:12Z)"
created: 2026-11-25
updated: 2026-11-25
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

**Routing, both ways.** A CPL Queue routine firing follows this file. A plain session Sam opens follows the newest
handoff his plain sessions write (727, S726 SkyAvocet's, merged in #3815 at 08:42Z), never this file. **Numbering.** Sam's
plain session S726 (SkyAvocet) merged #3802, #3805 and #3806 before this firing and has not written handoff 727, so
this run takes S727, the next free number, and writes 728, leaving 727 to S726 (`d-routine-takes-next-free-number-s713`).
The routine's next session is **SkyFrigatebird**: it takes the next free session number at its start and writes the
handoff one above the highest on `main` (`d-routine-leaves-plain-handoff-number-s727`).

# You are SkyFrigatebird, the routine's next session

From SkyTropicbird (S727), the CPL Queue routine's 06:12Z firing of 2026-11-25, a conductor run for collection only
under Sam's routine prompt of 2026-11-17 and the COBIx brief on #3358 (Tue Nov 24, written 6:45 PM PT). Handoff 722
named SkyTropicbird for the routine's next session, and no plain session holds the name. A **full checkpoint** (the
harvest lane moved; Rule 10 data writes ran: seven guarded applies, the lever's and the eLumen fix's loads and rereads,
a display build and the memory rows), written by the checkpoint-docs worker from 08:23Z and finished after the last
merge with the conductor's final facts. The conductor applied the memory rows (migrate 45588204442, 22 rows) and
stamped step 12 (`2e947e1b`). Skipped: step 2 (tonight's code sits in the harvest's own named-gap file, reader and reconcile,
which the lane and lessons document), step 3 (no user-facing surface changed), step 7 (no re-mint, no roadmap status
change, no auditor counts moved) and step 9 (the UI pass is its own queue item). The start and the college split below
were written before any worker started.

## Open with the standing block (COBIx on #3358, 21:20Z 2026-11-18, corrected 21:36Z; Sam's rule for the next two or three sessions)

0. **COBIx's brief is on issue #3358**: read the newest (Tue Nov 24, 6:45 PM PT, at this writing), and comment
   7064588752 (Sam's two rulings of 2026-11-21), before the split.
1. **No COBIx watcher.** Sam, 01:53Z 2026-11-23, to S712: *"No need for the Cobix check ins for now"*
   (`d-cobix-watcher-stopped-on-sam-word-s714`). Read a PR's whole thread before you merge it or apply what it carries.
1a. **Clone light (Sam, 2026-11-19):** `git clone --filter=blob:none` (or `--depth=1` when history is not needed),
   never a full clone. Workers share one shallow clone, so fetch a branch by name with `--shallow-since` or `--deepen`,
   never `--depth` (`p-shared-shallow-clone-reshallows-s713`); a new branch gets a fresh worker.
2. **Merge rules:** at most 3 open PRs (plus #3511 and dependabot's), the oldest finished first, one update from `main`
   right before its merge, no dependency-map rebuild inside a PR, no full rerun when the input fingerprints match. Stop
   a review after two rounds. Records PRs merge one at a time (`p-records-prs-merge-one-at-a-time-s703`).
2a. **Sam's work order (2026-11-20):** collection comes first, data waves before fixes, and a fix goes ahead of the next
   wave only when it blocks it or would file wrong rows (`r-collection-first-sam-2026-11-20`). Collection serves the
   M-IDs, so its fixes are ranked by the M-ID cards they unblock (`r-collect-for-mids-work-order-sam-2026-11-20`).
3. **Merge order at sign-off:** every substantive PR of tonight's has merged (#3808, #3812, #3810, #3816, #3811). This
   checkpoint, #3807, merges at sign-off, with one update from `main` right before its merge. Open PRs at sign-off:
   #3807 and dependabot's #3383, which waits. Butte's branch has no PR yet (open work, below).

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
- 07:33Z: American River fixed at 12 rows (a second new kind, `noted_total_cut_off`, for 20130) to round 2 with its
  reader. Canyons fixed at 7 rows; the conductor asked for a course-list cap of 50 on `heading_not_in_text` before
  round 2, since 43388's list cannot be told from its page's other lists.
- 07:36Z: American River's round 2, APPLY; clean md5 pre-read (12 of 12); migrate 45569505474 returned 12, all live;
  `.apply` restored (`618bca45`). 07:41Z: Canyons's round 2, APPLY; clean md5 pre-read (6 of 6; 43388 absent, no
  verdicts); migrate 45570064450 returned 6 and inserted 43388; `.apply` restored (`f8223804`).
- 07:42Z: Butte's reconcile reading (`clear_conditional`, a new reconcile kind in shared code; self-recall 21 fire, 0
  wrong) to an Opus reader before its reconcile run; the records-held-for-a-person worker started (twelve colleges);
  the `land` worker started (`claude/s727-land`: the pooled, Shasta, American River and Canyons branches as one PR).
- 07:46Z: `elumen`'s reader, round 1: FIX THEN DISPATCH (the change moved binds off the eLumen road, El Camino's ten
  certificates among them: limit it to eLumen addresses; the exact-heading rank must check the award; s727v moves to
  its own branch, `claude/s727-avc43028`). Santa Barbara City's reader, round 1: FIX THEN APPLY (08565 refiled
  `no_units_read`; 05934 keeps S714's hold).
- Orange Coast's read 45567337117 is still in its Capture step at this writing (from 07:21Z).
- 07:57Z: spend about $165; no new workers from here (`d-no-new-workers-after-0757z-s727`). The conductor lifted the
  workers' dispatch limit in words for loads, rereads and js-tests on #3810's and #3811's branches
  (`d-workers-dispatch-loads-in-words-s727`).
- 07:57Z to 08:00Z: #3810's round 1 fixes (`8677f108`: the heading readings on `elumenapp.com` alone; the exact-heading
  rank checks the award; a check over every other road's 13,939 filed pages reads 18,377 labels and changes none;
  self-recall 2,086 of 2,086 in both orders); plan s727v on its own branch (`99d06a97`).
- 08:00Z to 08:05Z: Orange Coast's read filed (`5fb87dd6`, about $0.22); `site_heading_names` cuts the site name with
  `TITLE_SPLIT` (`71eb8026`); its load 45573129578 put 04007, 22394 and 33569 live, passing on their pins.
- 08:01Z to 08:13Z: Southwestern 33642's read filed (`089096c8`, $0.048); its load 45574052184 put it live, passing.
- 08:03Z: Santa Barbara City's round 2 (`d4259376`: 12 rows, 08565 `no_units_read`, 05934 back on S714's hold); the
  persons plan s727f (`ae0e974c`: 7 updates, 7 named gaps) to its reader.
- 08:07Z to 08:16Z: s727d applied after a clean md5 pre-read: migrate 45573614115 returned 12 (6 passing, 6 named
  gaps); `.apply` restored (`26ff1b4b`). Southwestern's load ran beside it at another college, on disjoint rows
  (`d-loads-beside-applies-disjoint-s727`).
- 08:14Z to 08:20Z: West Valley's read 45574056664 filed only `capture_preview.json` (`d9a810ed`), and its load
  45575119022 inserted nothing: a follow-up, never a blind rerun (`d-west-valley-no-blind-rerun-s727`).
- 08:17Z: #3812 merged (`3b2bf062`), the land PR: s727p, s727c, s727b and s727a.
- 08:18Z to 08:21Z: s727v applied (migrate 45575092684 returned 1: Antelope Valley 43028, `ge_figures_other_pattern`);
  `.apply` restored (`9d03a837`). West Valley's load ran beside it.
- 08:23Z: Butte's round 1 fixes (`745f6940`: the fill window, an anchored figure, keep-only that refuses a wrong base;
  recall over 18,961 records, 0 wrong, no other college fires).
- 08:24Z: Sam's plain session's #3813 merged (`77e9903a`, the Commons cards' titles), one writer per file.
- 08:26Z: the persons plan's round 1 fixes (`56153e5b`: hold 33013, 39539, 32832 and 44984; De Anza 45499 takes
  `unit_line_not_read`).
- 08:27Z: Butte's reconcile run 45576373568 dispatched on `claude/s727-butte` (`745f6940`); at 09:59Z it was still
  capturing.
- 08:42Z: S726's checkpoint #3815 merged (`e335cd9c`): handoff 727, for Sam's next plain session.
- Before #3810's merge: Antelope Valley's read 45574354887 ($0.77) and load 45578200792 (20166, 20184 and 20186
  live), its reread 45579427195 (8 rows replaced); Redwoods' read 45574359765 ($0.09) and reread 45579562962 (42895
  replaced). The persons plan s727f applied (migrate 45577450381): 5 live with named gaps, 6 named gaps with no
  record. Moorpark 43405 and Pasadena City 33404 and 33699 read and loaded on #3811.
- 09:05Z: #3810 merged (`0da3b19a`). 09:24Z: #3816 merged (`c8e04d10`), the second land PR: s727d, s727f and s727v.
- 09:35Z: step 12 stamped (`2e947e1b`: 15,551 of 20,282 complete at 118 colleges; the next firing taken from the hourly
  schedule, no `get_trigger` here).
- 09:39Z: the closing census 45586922147 on `main` (`3f04de68`): 15,551 of 20,282 pass, 4,227 without a passing
  record, 504 collected with a named gap.
- 09:44Z to 09:47Z: the memory rows applied (migrate 45588204442, 22 rows); `.apply` restored (`76e4f2b0`).
- 09:48Z: Sam's plain session's #3817 merged (`023f21f7`). 09:57Z: #3811 merged (`a079e472`) without a final update
  from `main`, which had moved only by #3817, touching none of its files (`d-lever-merged-without-main-update-s727`).

## What shipped

- **#3808 `0b13c85c` (07:08Z):** display build `f4b48370bc11` (18,712 records), 18,711 rows live at the build, the same
  32 at older builds and none without a display; `tests/statewide_subject_codes_test.py` check (5) accepts a code a
  person's statewide filing settles (`d-subject-codes-test-person-filing-s727`).
- **#3812 `3b2bf062` (08:17Z), the land PR**, four plans, every one applied and live before the merge, each with a
  second reader, a clean md5 pre-read and the conductor's apply, `.apply` restored after each run:
  - the pooled reading's next, s727p (migrate 45564723291): 11 to passing, Modesto Junior 08104, 08111, 33944, 37300
    and 38067, Rio Hondo 19274 to 19276, Cuyamaca 18629 and 18631, Golden West 19461; 12 held, El Camino's three among
    them;
  - Shasta, s727c (45568232574): 4 named gaps (09113, 35607, 37774, 45360); 15 held; 18153 a named gap with no record;
  - American River, s727b (45569505474): 12 named gaps (8 `noted_section_cut_off`, 2 `pair_read_as_alternatives`,
    12180 `option_lists_read_apart` and 20130 `noted_total_cut_off`, both new); 7 held;
  - College of the Canyons, s727a (45570064450): 6 named gaps, and 43388 inserted with `heading_not_in_text` (new; its
    course list capped at 50, `d-heading-not-in-text-cap-s727`); 14 held.
- **#3810 `0da3b19a` (09:05Z), the eLumen fix:** each award binds its own page, on `elumenapp.com` alone (self-recall
  2,086 right, 0 wrong; 0 of 18,377 labels move on other roads). Antelope Valley: 20166, 20184 and 20186 live (read
  45574354887, $0.77; load 45578200792) and 8 rows replaced by reread 45579427195 (02139 and 20148 read unequal,
  collected with no gap); 38 bound their own page but were `held_no_gain`, keeping passing records read from the
  sister page. Redwoods: 42895 replaced (read 45574359765, $0.09; reread 45579562962); 45557 and 45595 `held_no_gain`.
- **#3816 `c8e04d10` (09:24Z), the second land PR**, three plans, every one applied and live before the merge:
  - Santa Barbara City, s727d (migrate 45573614115): 12, of which 6 pass under the floor reading (05913, 10661, 19099,
    31338, 38595, 43539), 4 `repeat_read_once`, 08565 `no_units_read` and 05924 `required_list_outside_total` (new);
    5 held, and 05934 on S714's hold;
  - the records held for a person, s727f (45577450381): 5 live with named gaps (De Anza 45499 `unit_line_not_read`;
    Santa Monica 10345 `noted_no_total`; Santa Monica 43765 and Clovis 33501 `lists_not_closed`; Contra Costa 01417
    `entry_path_range`, new); 6 named gaps with no record, `no_own_page_found`; held 33013, 39539, 32832 and 44984 (a
    reload), with Santa Monica 03281, Glendale 44488 and Clovis 36326, each reason in its receipt;
  - Antelope Valley 43028, s727v (45575092684): `ge_figures_other_pattern` (new).
- **#3811 `a079e472` (09:57Z), the lever:** 8 live on their own pages, all passing, for about $0.52 of paid reads: San
  Bernardino Valley 32317; Orange Coast 04007, 22394 and 33569 (on `site_pages` pins; `site_heading_names` cuts a title's
  site name with `TITLE_SPLIT`); Southwestern 33642; Moorpark 43405; Pasadena City 33404 and 33699. 11 named gaps for
  programs with no record: Orange Coast 5 (03970 and 22389 `list_printed_as_range`; 42115 and 42117 `list_by_reference`;
  32235 `successor_printed`), North Orange Continuing Education 4 and Moorpark 2 (12383, 45352). Held: Pasadena City
  31599; Southwestern 32693 and 36634; Allan Hancock 42208, 42210 and 43770; West Valley 35588, 06276 and 32021.

**Tonight's count:** 72 records collected and live: the seven applied plans' 52 (the pooled reading's 11, all passing;
lane 2's 35 at Shasta, American River, College of the Canyons and Santa Barbara City, 29 with named gaps and 6
passing; the records held for a person, 5 with named gaps; Antelope Valley 43028, a named gap); the lever's 8, all
passing; the eLumen fix's 12 (3 new, 9 reread from their own pages). Besides: 18 named gaps for programs with no
record. 0 outline rows (step 11's queue is empty). Paid reads about $1.38 (the lever about $0.52, Antelope Valley $0.77,
Redwoods $0.09).

**The closing census on `main`:** run 45586922147 (09:39Z, `3f04de68`): 15,551 of 20,282 active programs pass and
4,227 have no passing record (4,289 at this run's start, 62 fewer); 504 are collected with a named gap (469 at the
start). Step 12's headline: 15,551 of 20,282 at 118 colleges (15,524 at the start).

Read in order: this file; the NEXT of [`program-requirements-harvest`](reference/lanes/program-requirements-harvest.md);
`docs/program_requirements_harvest_lessons.md`, *S727*; `docs/reference/conductor_mode.md`, *What went wrong in S727*;
[`methodology-a-reader-fix-moves-rows-it-was-not-aimed-at`](kb-notes/methodology-a-reader-fix-moves-rows-it-was-not-aimed-at.md),
*S727*.

## Open work, from the lanes' NEXT lines

1. **`program-requirements-harvest`** (the routine's):
   - Butte's reconcile (`claude/s727-butte`, head `745f6940`, no PR): its run 45576373568 was still capturing at
     09:59Z. When it has filed: `python3 kb/_program_reconcile_s727_butte.py keep-only --run 45576373568 --base
     745f6940`, commit with both Commons builders, push, dispatch `step=reread` for Butte College, confirm from its
     receipt that only the nine moved, then a PR. If the run failed, redispatch `step=reconcile extract=0` once (NEXT (2)).
   - Then the display build carrying tonight's records, gate college Glendale, then `harvest-gap-census.yml` on `main`
     (NEXT (2)).
   - Lane 1: West Valley 06276, 32021 and 35588 first (find why its load inserted nothing; never a blind rerun); the
     eLumen follow-up (Antelope Valley's 38 `held_no_gain`, a `step=reread` with `force`; Antelope Valley 43150's pin);
     the holds on #3811 (Allan Hancock 42208, 42210, 43770; Southwestern 32693, 36634; Pasadena City 31599); then Los
     Angeles Southwest 4, Sacramento City 4 with its one reread, Cosumnes River 3 with 33542, Folsom Lake 38736,
     Santiago Canyon 3, El Camino 4, East Los Angeles 3 and Napa Valley 3; then a fresh census's wave (NEXT (3)).
   - The pooled reading's next: El Camino 02513, 02515 and 02517; Modesto's 8 other s720j holds; Cuyamaca 18635; the
     real pools it refuses at Porterville and Cuyamaca (NEXT (4)).
   - Lane 2, the census's next piles: Los Angeles Trade-Technical 17, Saddleback 17, Long Beach City 16, Cosumnes River
     17 once lane 1 leaves it (NEXT (5)).
   - The one follow-up PR, after the waves (NEXT (6)): S713's minors (SDCCE's 6 SLO-label rows first), COBIx's minors,
     Cerritos 35166's pin, the free rules, S721's minors and tonight's three: `find_codes` and a slash cross-listing's
     first code, a self-recall before `noted_total_cut_off` files beyond 20130, and the census reading a college's own
     named-gap files.
   - Step 11: the outline queue is empty until a census, a capture or a verdict row changes (NEXT (1)).
2. **A plain session's, each by its lane's NEXT.** They wait because conductor runs stay on collection (Sam's routine
   prompt of 2026-11-17: *"No new UI, tooling or governance work in conductor runs."*):
   - `commons` and `common-subjects-reference`: Sam's plain sessions hold them (S726's #3813 merged at 08:24Z; the
     `commons` lane is 22,178 bytes against 20,000 and waits on its next compaction); then the CSR lane's NEXT (1), the
     re-point of the folded local codes;
   - `implementation-funding` (25,555 bytes against 20,000: compact the lane first, then its NEXT), `cer-procedures`
     (compact first, 21,633 bytes), `my-college-action-page`, `repo-size`, `governance-team-enablement`, `library`,
     `sierra-page-redesign` and `common-cr-reference`, each by its lane's NEXT;
   - the brief's slimming items (`d-slimming-left-to-plain-session-s720`).

## Blocks (Sam's ruling 1: listed here until the Commons' Needs you shows them)

| Block | Who clears it | Since |
|---|---|---|
| West Valley 06276, 32021 and 35588: read 45574056664 filed only `capture_preview.json`; load 45575119022 inserted nothing | Sky, a follow-up, never a blind rerun | 2026-11-25 (S727) |
| Held on #3811: Allan Hancock 42208, 42210, 43770; Southwestern 32693, 36634; Pasadena City 31599 (no award word beside its title) | Sky, lane 1 | 2026-11-25 (S727) |
| Tonight's holds by key, each reason in its plan's receipt: American River 7 (07207, 12191, 12238, 30595, 39341, 39731, 39732); Shasta 15; College of the Canyons 14; Santa Barbara City 5 (19012, 30746, 43553, 45452, 46520) | Sky, lane 2 | 2026-11-25 (S727) |
| Santa Barbara City 05934: on S714's hold until `find_codes` reads a slash cross-listing's first code (0 of 97 found) | Sky, the follow-up (a capture fix) | 2026-11-23 (S714), S727 |
| The pooled reading's next: El Camino 02513, 02515, 02517; Modesto's 8 other s720j holds; Cuyamaca 18635 (a wording rule); real pools refused at Porterville 06773, 30235 and Cuyamaca 18634, 18636, 18637 | Sky | 2026-11-24 (S721), S727 |
| `noted_total_cut_off` fires on 664 failing records statewide: a self-recall before it files beyond 20130 | Sky, the follow-up | 2026-11-25 (S727) |
| The census ignores a college's own named-gap files (14 programs relisted) | Sky, the follow-up | 2026-11-25 (S727) |
| Orange Coast 08626, filed from the Airframe & Powerplant A.S. page; a title heading check alone passes a successor's page (32235) | Sky, lane 1 | 2026-11-25 (S727) |
| The eLumen follow-up (#3810 merged): Antelope Valley's 38 that bind their own page were `held_no_gain`, keeping passing records read from the sister page (a `step=reread` with `force`); Redwoods 45557 and 45595 `held_no_gain`; Antelope Valley 43150 needs a pin; 02139 and 20148 reread unequal, collected with no gap; Mission's 8 binds move at its next capture | Sky, lane 1 | 2026-11-25 (S727) |
| Butte's nine (01362, 07269, 11136, 31042, 31941, 32469, 33199, 40923, 43453): `clear_conditional` on `claude/s727-butte`, its reconcile run 45576373568 still capturing at 09:59Z; 01312, 14583, 33579 | Sky, the Butte reconcile (open work, item 1) | 2026-11-24 (S721), S727 |
| S721's holds by key, each reason in its plan's receipt: Orange Coast 17 (08670 `degree_total_minimum` and 32737's substitution list among them); Palo Verde 5 (17998, 17999, 41227, 41242, 45359); Porterville 4 (09528, 35229, 35449, 45511); Gavilan 11 (08460, 19378, 38787 among them) | Sky, lane 2 | 2026-11-24 (S721) |
| MiraCosta 36144 and 36171 (`text_window_cut`: their section prints past the capture's 16,000 characters) | Sky, a wider text window | 2026-11-24 (S721) |
| The follow-up's minors: a kept `degree_within_map_range` is not checked against `within_map`; a certificate's heading check accepts a plural department heading; #3764's `live_flips` reads the filed arithmetic for rescored rows, and "List A requires 9 units together with its lab" still pools | Sky, the follow-up | 2026-11-24 (S721) |
| S720's holds by key, each reason in its plan's receipt: Fullerton 7, City College of San Francisco 9, Santa Monica 3, College of the Sequoias 2 (06770, 45030), Clovis 5, East Los Angeles 6 (33013 among them), Glendale 1 (45068), Ventura 17, Cabrillo 13, Contra Costa 6, El Camino 8 | Sky, lane 2 (a person for 33013) | 2026-11-24 (S720) |
| The free rules: City College of San Francisco 17615 to 17618 (own-option reading); Cabrillo 06352, 06380, 06381, 44992 (recommended lists); Fullerton 33680, 42143 and Ventura 30587 (a closed-list rescore); Cerritos 35166 (a pin, the whole-major exception) | Sky, the follow-up | 2026-11-24 (S720) |
| Sacramento City: 26 course-id gains and 4 kept `ge_units_not_read` gaps (04662, 17873, 17875, 42894) | Sky, one reread | 2026-11-24 (S720) |
| Cosumnes River 33542 (Option II's two blocks read as alternatives), held on `main`'s filing; Folsom Lake 38736, not rescored by its reconcile | Sky | 2026-11-23 (S714), S720 |
| Fullerton: 15 of its 296 passing records are not on their own page | Sky, a page read | 2026-11-24 (S720) |
| East Los Angeles's bound is unmeasured on capture text (41097 likely; 36345, 37924, 43632, 45935 possible) | Sky, a free reconcile before its next text run | 2026-11-23 (S714) |
| The 30-day artifact `course-outcomes-45026998155-part1` holds trial pages that print a staff name: delete it | a person | 2026-11-22 (S703) |
| Records held for a person that s727f held, each reason in its receipt: Santa Monica 03281, Glendale 44488, Clovis 36326 and 39539, East Los Angeles 33013, Los Angeles City 32832, Cerritos 44984 (a reload); Los Angeles Mission 44849 (no live row) | Sky for the reload; a person for the rest | S653 to S727 |
| Santa Rosa Junior 06566 and 32298, held: the second reader found the wrong cause | Sky, a reread or a rule | 2026-11-23 (S713) |
| Las Positas 01037 (passes only by double counting) and 09227; Antelope Valley 39295 | Sky, lane 2 | 2026-11-23 (S713) |
| College of Marin: its program URLs changed form, so the moved-page guard stopped its general education step (19789, 19791) | Sky, a capture or guard fix | 2026-11-23 (S713) |
| The next follow-up's minors (S703 and S713's list, lessons, *Moved from the lane (S714 checkpoint)*, NEXT (2)), SDCCE's 6 SLO-label rows first | Sky, the next follow-up | 2026-11-22 (S703) |
| COBIx's minors: `f-cobix-minors-s713`; `f-cobix-minors-s714` | COBIx | 2026-11-23 (S713, S714) |
| City College of San Francisco's Cal-GETC dry run (32080, 33652, 46300): the permission check refused it twice | a plain session | 2026-11-21 (S691) |
| Golden West's 476 outline header rows: the guarded correction | a plain session's review | 2026-11-20 (S690) |
| Cerritos 20504: its run also holds 44984, held for a person | a person, on 44984 | 2026-11-21 (S697) |
| College of the Desert: its 8 keep their gap and its 23 on the reader-page lever wait (the prior catalog sits behind robots.txt) | the college, or another source | 2026-11-20 (S689) |

Cleared tonight: handoff 722's San Bernardino Valley 32317 row (passing); Modesto Junior's 5 s720j holds and the flips
at Rio Hondo, Cuyamaca and Golden West (s727p); Orange Coast's 8 on the reader-page lever (3 passing, 5 named gaps);
Antelope Valley 43028 (s727v); College of the Canyons 43388 (inserted with its gap named) and Shasta 18153 (a named gap
with no record); the records held for a person, 5 collected with named gaps and 6 named with no record (s727f); the
eLumen sister-award swap (#3810: 3 new, 9 reread from their own pages); the census's piles at College of the Canyons, American River, Shasta and Santa Barbara City.

## For Sam

Nothing waits on Sam ([Open Asks Sheet 200](https://claude.ai/artifact/5ShC7pGgNuz9bJUhkdsc8Y), current; no reply
since 2026-11-19T23:47Z). Every call tonight was the conductor's, recorded below and reversible.

## Decisions Sam made

None tonight. The run acted on his routine prompt of 2026-11-17 (*"Conductor mode is back for collection only."*;
*"Two lanes, never on the same college"*; *"Stop a review after two rounds and send what is left to Sam or COBIx."*)
and his collect-with-gaps ruling of the same day.

## Decisions (the conductor's, each reversible)

- `d-routine-leaves-plain-handoff-number-s727`: S726 had written no handoff 727, so the routine took S727 and wrote 728.
- `d-subject-codes-test-person-filing-s727`: check (5) of `tests/statewide_subject_codes_test.py` accepts LAWEN as
  settled by a person's statewide filing; fixed on #3808, since it failed every PR.
- `d-heading-not-in-text-cap-s727`: a course-list cap of 50 on `heading_not_in_text` before 43388's insert.
- `d-sbcc-08565-no-units-read-s727`: Santa Barbara City 08565 takes the kind its record rules name.
- `d-sbcc-05934-keeps-hold-s727`: 05934 keeps S714's hold until the slash cross-listing fix.
- `d-west-valley-no-blind-rerun-s727`: West Valley's empty load goes to a follow-up, never a blind rerun.
- `d-loads-beside-applies-disjoint-s727`: Southwestern's and West Valley's loads ran beside s727d's and s727v's applies
  at other colleges, on disjoint rows, a recorded departure from one write per table at a time.
- `d-workers-dispatch-loads-in-words-s727`: workers dispatched loads, rereads and js-tests on #3810's and #3811's
  branches, by the conductor's word, to save its context; applies stayed the conductor's.
- `d-no-new-workers-after-0757z-s727`: at about $165 at 07:57Z the run started no new worker.
- `d-lever-merged-without-main-update-s727` (a DECIDED line only, no memory row): #3811 merged without a final update
  from `main`, which had moved only by the plain session's #3817, touching none of its files.

Memory rows: `kb/migrations/2026-11-25_s727_cpl_memory_rows.sql` (22 rows, rollback in its header), applied by migrate
45588204442 (receipt `kb/receipts/migration_s727_cpl_memory_rows_45588204442.json`; `.apply` restored at `76e4f2b0`).
DECIDED lines: the harvest lane.

## Patterns that worked

- **An own-page guard reads the pages the records were read from** (`p-own-page-guard-reads-read-pages-s727`):
  `sources.json`'s `source.url` and each record's `source_url`, never `capture.json`'s `shared_pages`, which another run
  built from American River's re-paginated file.
- **An insert's rollback leaves a row a verdict touched** and lists it; its delete takes its own expect line
  (`p-insert-rollback-leaves-touched-row-s727`).
- **A reader fix is scoped to the road it was aimed at** and checked over every other road's filed pages
  (`p-reader-fix-scoped-to-its-road-s727`; the kb-note above, *S727*).
- **Keep-only refuses a base that is not an earlier run's** (`p-keep-only-trusts-base-s727`).
- One display build first, while no apply was in flight, then the census on `main`; four applied plans landed as one
  PR (#3812); a second reader on every plan, a local Postgres 16 proof, a clean md5 pre-read and the conductor's apply.

## Findings

- `f-find-codes-misses-slash-first-code-s727`: 0 of 97 first codes of a slash cross-listing found at Santa Barbara City.
- `f-census-ignores-college-named-gaps-s727`: 14 programs with filed named gaps relisted.
- `f-noted-total-cut-off-needs-recall-s727`: the new kind fires on 664 failing records statewide.
- `f-occ-08626-wrong-page-s727`: Orange Coast 08626 is filed from the Airframe & Powerplant A.S. page.
- `f-heading-passes-successor-page-s727`: a title heading check alone passes a successor's page (Orange Coast 32235).
- `f-mission-binds-move-s727`: 8 binds move at Mission College's next capture under #3810.
- `f-cuyamaca-18635-wording-rule-s727`: Cuyamaca 18635 waits on a wording rule.
- `f-porterville-cuyamaca-real-pools-refused-s727`: the pooled reading refuses five real pools.

## Safety patterns to honor

All of handoff 722's: a plan's test true before and after its own apply and beside any PR it does not depend on; a
record a cheaper lever passes stays on that lever; one dispatch at a time per branch; a fresh worker per branch; one
writer of `.apply` per branch, the conductor, and a worker pulls before it commits once the conductor has touched its
branch; `on_live_run`, the own-page guard and `scorer_passes` on every plan; a reconcile keeps only the records it was
for. New tonight: the own-page guard keys on the pages the records were read from; an insert's rollback is proved
against a verdict on the inserted row; a reader fix names the road it serves in code. Each apply put `.apply` back to
`main`'s value after its run, so no merge carries a live trigger. Never file a person's name from an outline page
anywhere. A permission-check refusal is never routed around.

## Conductor settings

A conductor run for collection only, under Sam's routine prompt of 2026-11-17 (`docs/reference/conductor_mode.md`,
*Back for collection only*; review rounds as his ruling of 2026-11-20 sets them): two lanes, never on one college; about
$750 a day for everything, $10k running total for the whole job; workers on Opus 5.5, high effort on any worker that
writes shared data; Sonnet or Haiku for routine reads; reviews at most 9 agents, stopped after two rounds with what is
left sent to Sam or COBIx; $40 per college per run for program requirements and a separate $40 for SLOs, PLOs and
course objectives, per run, never a remaining pot. Stop rules from the brief: a day over $300 with fewer than 40 new
programs; over $12 per new program or $0.50 per outline row; a rollback that undoes over 1% of a day's rows; the $10k
checkpoint. Sam's plain sessions S725 and S726 ran earlier on this UTC day, unmetered, so this run aimed at about $250.

## Ledger

| PR or branch | State | Next |
|---|---|---|
| #3807 (`claude/awesome-fermat-gyx5ec`) | the declaration and this checkpoint | merges at sign-off |
| #3808 (`claude/s727-display`) | merged `0b13c85c` (07:08Z); display build `f4b48370bc11` live | none |
| #3812 (`claude/s727-land`) | merged `3b2bf062` (08:17Z): s727p, s727c, s727b and s727a, all applied and live | none |
| #3810 (`claude/s727-elumen`) | merged `0da3b19a` (09:05Z); 3 new and 9 reread live | the eLumen follow-up (lane 1) |
| #3816 (`claude/s727-land2`) | merged `c8e04d10` (09:24Z): s727d, s727f and s727v, all applied and live | none |
| #3811 (`claude/s727-lever`) | merged `a079e472` (09:57Z); 8 live, all passing | West Valley's follow-up, then lane 1's holds |
| `claude/s727-butte` | head `745f6940`, no PR; reconcile run 45576373568 still capturing at 09:59Z | keep-only, the reread, then a PR (open work, item 1) |
| `claude/s727-pooled`, `-piles-shasta`, `-piles-arc`, `-piles-canyons`, `-piles-sbcc`, `-persons`, `-avc43028` | landed in #3812 and #3816 | none |
| Harvest gap census on `main` | run 45565884062 (07:13Z): 15,536 pass, 4,277 without; the closing run 45586922147 (09:39Z): 15,551 pass, 4,227 without | the next after tonight's display build |
| #3813, #3815, #3817 | Sam's plain session's, merged `77e9903a` (08:24Z), `e335cd9c` (08:42Z), `023f21f7` (09:48Z) | none |
| #3383 | dependabot's | waits |

## Let go

No PR subscription, scheduled check-in or artifact watch was opened tonight: the run gated each PR by reads, so there is
none to drop. No COBIx watcher ran (Sam's word of 2026-11-23). Workers end with the
session; each branch is pushed. The local Postgres 16 used for the apply proofs stops at sign-off. The vault note for
this run is `CPLBrain/07-session-notes/2026-11-25-s727-skytropicbird-collection.md`, on the vault's branch
`claude/pensive-archimedes-gyx5ec` (draft PR samueltlee/CPLBrain#864, which merges on its checks).

Spend: $303.30 (a token-count estimate at list prices, kb/_spend_meter.py's rates; no cost readout here); collection $303.30; 2026-11-25T06:13Z to 2026-11-25T10:20Z. The conductor about $68 (about $8 of it the close), 31 agents about $235. The paid reads' own cost, about $1.38 on their meter, is listed apart. Stop rules: none fired (72 records, about $4.21 each; no outline rows; no rollback).

Opening line: *Greetings, you are SkyFrigatebird (the next free session number; Sam's plain session S726 holds 727), see SkyTropicbird's (S727) handoff — `docs/session_728_handoff.md` — let's keep rolling with our queue.*

Session cost about $303 (a token-count estimate; get_session is not available here); 72 records collected and live, plus 18 named gaps for programs with no record; 0 outline rows added; 5 substantive PRs merged (#3808, #3812, #3810, #3816, #3811), not counting checkpoints.
