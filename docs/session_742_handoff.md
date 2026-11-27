---
title: "Session 742 handoff (from SkyWillet, S741, the CPL Queue routine's collection run of 2026-11-27, from 06:12Z)"
created: 2026-11-27
updated: 2026-11-27
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

**Conductor model: Opus 5.5 (claude-opus-5-5), as this run's header reports; the routine's form names Fable 5.2.
get_session is not among this run's tools, so the header is the only readout.**

**Routing, both ways.** A CPL Queue routine firing follows this file. A plain session Sam opens follows the newest
handoff his plain sessions write (738, S737 SkyWhimbrel's, naming SkyTurnstone for Session 738), never this file.
**Numbering.** S740 (SkySkimmer) wrote 741 and named SkyWillet for the routine's next session, to take the next free
number: this run is S741 and writes 742. 739 stays SkyTurnstone's (Sam's next plain session).

*(Declaration, written at 06:24Z before any worker started.)*

## The start (06:12Z firing, 2026-11-27)

- Brief: COBIx's on #3358 (Thu Nov 26, written 6:50 PM PT, `main` at `b896d6f4`); the newest other comment on the
  thread is still 7064588752 (Sam's two rulings of 2026-11-21). Handoff 741 (S740) is the newest; its checkpoint #3885
  merged (`0df08c62`). On `main` since: Sam's S736 #3894 (LACCD schedule search), the dependency map and the census
  45920941316 (01:12Z, `b896d6f4`).
- One writer: no `list_sessions`, `get_trigger` or `get_session` here. Open PRs at 06:15Z: dependabot's #3383 alone.
- Step 0: the night's first firing. No `daily-dashboard.yml` run created on 2026-11-27 UTC (the newest, 45899796749, at
  21:40Z on 11-26), so the conductor dispatched it on `main` at 06:15Z.
- No pause line (handoffs 738 and 741). Three repos attached. `check_hooks_live.py`: ROOT LIVE (guards on Bash and
  `execute_sql`, 34 allow rules, the context meter). No `set_session_tags` here.
- Sheet 200: no reply since 2026-11-19T23:47Z. `queue_todo_done` since 2026-11-26: none. Rule 8's memory read: no row
  since S740's ten and Sam's `r-schedule-tool-first-for-subject-titles-sam-2026-11-26`. Steps 6 to 10: held in a
  conductor run, as S727, S731, S739 and S740 held them (two Library requests and three revise requests wait, as
  before). Step 11: the outline queue is empty until a census, a capture or a verdict row changes.
- Census on `main` (45920941316, 01:12Z): of 20,282 active programs, 15,640 pass and 4,002 have no passing record; 640
  are collected with a named gap.
- **Spend aim:** about $275 for this run, no new worker after about $210. The UTC day began at 00:00Z with no metered
  session before this one, so the day stays under about $750 with room for a later firing and Sam's plain session.

## The college split (written before any worker started)

Two lanes, never on one college at the same time, one writer per college (`d-lane-names-only-colleges-in-flight-s681`).

- **Lane 1 (collection):**
  - `display` (the conductor), first, while no apply is in flight: one display build carrying S740's records
    (`a143061a2ae2` on `claude/s741-display`, built on `b896d6f4` with Python 3.12), gate college Glendale, then the
    whole build, then `harvest-gap-census.yml` on `main`.
  - `keys` (Fable 5.2, high effort): the units kind's reviewed keys, each with a second reader: Santa Ana 31859 and
    21789, Copper Mountain 43854, San Bernardino Valley 35833; then Copper Mountain 14737 and 20094 (`total_differs`);
    then S740's lane-1 leftovers: San Bernardino Valley 04873, 04894, 17829, 22784, 22821, 39483; Solano 30184, 30185,
    43134 (own-page guard), 38591 (page pin); San Jose City 18449, 38499. Colleges: Santa Ana, Copper Mountain, San
    Bernardino Valley, Solano, San Jose City.
  - `readers` (Fable 5.2, high effort): the reader changes that unblock reads, each with a self-recall and a second
    reader before any dispatch on it: rule B for San Diego City 22367, then its 91-minute capture; Ventura's read behind
    a second reader of the `tabs_with_prose` opt-in (06948, 08253, 35654, 37415, 44994, 44995, 40179); Norco's 11 (the
    curriQunet reader change) and 30061 (a paid reread). Colleges: San Diego City, Ventura, Norco.
- **Lane 2 (cheap piles, one worker, high effort):** `piles` (Fable 5.2): the holds by key in lessons *S740* (Shasta
  18625; American River 39731, 39732; Long Beach City 37213; El Camino 19883, 19857, 31319, 42541; Butte 14583, 01312;
  Santa Monica 43767, 21026; Gavilan 08464, 45357; Cabrillo 11293, 45306, 06352, 06380, 06381, 44992; Contra Costa
  01400, 40761, 33660; Los Angeles Trade-Technical 31280, 45285; Santa Barbara City 30746, 43553), each collected with
  its gap named where the gap is true (gaps noted instead of rereads); then S720's and S721's rest (Fullerton 7, City
  College of San Francisco 9, College of the Sequoias 2, East Los Angeles 6, Glendale 1, Orange Coast's 14 and 08626);
  discontinued flags, units rules and retired courses over its colleges. At its land, the Spend line's builders and the
  Commons page counts are rebuilt. Colleges: Shasta, American River, Long Beach City, El Camino, Butte, Santa Monica,
  Gavilan, Cabrillo, Contra Costa, Los Angeles Trade-Technical, Santa Barbara City, Fullerton, City College of San
  Francisco, College of the Sequoias, East Los Angeles, Glendale, Orange Coast.
- **Not tonight:** Porterville (the follow-up's 06773 guard first); Saddleback (its `repeat` window first); West Valley
  35588, Southwestern and Pasadena City (reader changes); Antelope Valley and Mission (the eLumen follow-up's rest);
  College of the Desert (robots.txt); Los Medanos (parked); Shasta 32162 (lane 2's, on its own-page guard); El Camino's
  four on the Acalog road (19861, 19866, 38948, 43993: El Camino is lane 2's tonight); the other reader and scorer
  changes (Cuyamaca, Modesto 35127, Cosumnes River 33542, Coastline 43057, Reedley 30465, Los Angeles Pierce 19181,
  Grossmont 21402, Cuesta 43053 and 41744) unless the run has room once lane 1's three are done; City College of San
  Francisco's Cal-GETC dry run (a plain session's); the follow-up PR, after the waves if the run has room.

## Split changes during the run

- 06:15Z: `daily-dashboard.yml` dispatched on `main` (step 0).
- 06:20Z: display build `a143061a2ae2` pushed on `claude/s741-display` (`f5cf3535`); the Glendale gate dispatched.
- 06:23Z: the declaration pushed (`e8dc9c91`), draft #3897.
- 06:24Z: the Glendale gate 45951236087 green at 06:23Z: 242 Glendale rows at `a143061a2ae2`, nothing else moved (live:
  18,501 at `9e28519af71f`, 16 at `0874a3a15f22`, 15 Glendale rows at `bef8ef819af7`, 3 with no display). 06:24Z: the
  whole build 45951699122 dispatched on the branch.
- 06:25Z: `keys`, `readers` and `piles` started on Fable 5.2 at high effort, each in the harness's own worktree off
  `b896d6f4`, told to open no PR (the conductor opens each land), to dispatch only free runs on their own branch, and to
  leave paid runs, rereads, loads and `.apply` to the conductor.
- 06:31Z: the whole build 45951699122 green: 18,746 rows at `a143061a2ae2` (the 3 with no display now carry one), the
  same 32 at older builds, none without a display. 06:33Z: #3898 opened from `claude/s741-display` and marked ready.
- 06:45Z: `main` red since the daily run of 06:26Z (`2b908677`, JS tests 45951903783, `lints (6)`):
  `tests/subject_decisions_noncredit_test.py` assumed its injected Los Angeles Pierce OLD noncredit save adds one
  applied decision, and the sync had just carried a person's save of that very key (2026-11-26T17:06Z). Every PR's
  `test` runs on its merge with `main`, so this blocks every merge. #3900 (`claude/s741-main-red`, the two
  checks expect one more only while no live save holds the key; opened 06:50Z), reproduced red on `2b908677` and green with the fix.
- 06:48Z: `keys` plan s741k1 (Santa Ana 31859 and 21789, `units_within_printed_range`, head `26272e23`) to a Sonnet
  second reader.
- 06:57Z: s741k1's reader (Sonnet): APPLY (both gaps true: 31859 computes 19-19.5 in the printed 18-19.5, 21789
  24.5-29 in 24-30; 13 of 13 and 18 of 18 placed; nothing else gains the kind). MINOR: 31859's printed low end is
  reachable only through cross-list options the blocks do not encode (its note says so). Clean md5 pre-read 2 of 2;
  migrate 45955369454 returned 2, none skipped; `.apply` restored on `claude/s741-keys` (`3d62e685`). Live: both rows
  carry `units_within_printed_range`. Records collected: 2.
- 07:07Z: #3900 merged (`2d0fa074`, confirmed on `origin/main`; `test` green on `3b59dacd`); `main` green again.
  #3898 updated from `main` for its `test`.
- 07:12Z: `keys` report 3 (head `8aaefff6`): plans s741k2 (Copper Mountain 4: 14737 and 20094 `total_differs`, 45594
  `units_within_printed_range`, 14710 `lists_not_closed` on p.78's own sentence, reversing S740's hold) and s741k3
  (San Bernardino Valley 35833 `units_within_printed_range`, 22784 `waived_course_counted`; 17829, 04873, 04894, 22821,
  39483 held), and a Copper Mountain reconcile step (`degree_total_minimum` from the catalog's "MINIMUM DEGREE UNITS"
  lines: 43854 and 14751 turn passing, none fails; free reconcile 45957316339). All three to one Sonnet reader.
  Pitfall: the conductor's apply worktree had checked out the worker's branch name, so its pushes moved the worker's
  local ref; the conductor now applies from a detached HEAD and pushes `HEAD:<branch>`.
- 07:24Z: the reader of s741k2, s741k3 and the step (Sonnet): s741k3 APPLY (35833 18 + 1-4 in 18.5-22; 22784 16 + 4 in
  16-20, MINOR: its words say "ranges from zero units" where its page prints no "0-4", for the follow-up); the step GO
  (the real run flags 9 records, not the synthetic 28; 43854 and 14751 pass, none fails, no other college moves);
  s741k2 FIX THEN APPLY (MAJOR: the step's reconcile 45957316339 re-filed 14710, 14737 and 45594 on its own run, so
  the plan's test fails at that head and a reread would leave its guard matching none). **DECIDED**
  `d-reread-before-rebuilt-plan-s741`: the reread of the reconciled run first, then s741k2 rebuilt on those rows for
  its second and last round. 07:26Z: s741k3's clean pre-read 2 of 2; migrate 45958459007 returned 2, none skipped;
  `.apply` restored (`512c8a23`). Records collected: 4.
