---
title: "Session 742 handoff (from SkyWillet, S741, the CPL Queue routine's collection run of 2026-11-27, from 06:12Z)"
created: 2026-11-27
updated: 2026-11-27
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_747_handoff.md
---

**Conductor model: Opus 5.5 (claude-opus-5-5), as this run's header reports; the routine's form names Fable 5.2.
get_session is not among this run's tools, so the header is the only readout.**

**Routing, both ways.** A CPL Queue routine firing follows this file. A plain session Sam opens follows the newest
handoff his plain sessions write (738, S737 SkyWhimbrel's, naming SkyTurnstone for Session 738), never this file.
**Numbering.** S740 (SkySkimmer) wrote 741 and named SkyWillet for the routine's next session, to take the next free
number: this run is S741 and writes 742. 739 stays SkyTurnstone's (Sam's next plain session).

*(Declaration, written at 06:24Z before any worker started.)*

## Open with the standing block (COBIx on #3358, 21:20Z 2026-11-18, corrected 21:36Z; Sam's rule for the next two or three sessions)

0. **COBIx's brief is on issue #3358**: read the newest (Thu Nov 26, 6:50 PM PT, at this writing), and comment
   7064588752 (Sam's two rulings of 2026-11-21), before the split.
1. **No COBIx watcher.** Sam, 01:53Z 2026-11-23, to S712: *"No need for the Cobix check ins for now"*
   (`d-cobix-watcher-stopped-on-sam-word-s714`). Read a PR's whole thread before you merge it or apply what it carries.
1a. **Clone light (Sam, 2026-11-19):** `git clone --filter=blob:none` (or `--depth=1` when history is not needed),
   never a full clone. Workers share one shallow clone, so fetch a branch by name with `--shallow-since` or `--deepen`,
   never `--depth` (`p-shared-shallow-clone-reshallows-s713`); a new branch gets a fresh worker. A worker's push counts
   once `git ls-remote` shows its head (`p-worker-push-proved-by-ls-remote-s731`). Fetch `main` by name first
   (`p-shared-clone-origin-main-stale-s739`).
2. **Merge rules:** at most 3 open PRs (plus #3511 and dependabot's), the oldest finished first, one update from `main`
   right before its merge, no dependency-map rebuild inside a PR, no full rerun when the input fingerprints match. Stop
   a review after two rounds. Records PRs merge one at a time (`p-records-prs-merge-one-at-a-time-s703`).
2a. **Sam's work order (2026-11-20):** collection comes first, data waves before fixes, and a fix goes ahead of the next
   wave only when it blocks it or would file wrong rows (`r-collection-first-sam-2026-11-20`). Collection serves the
   M-IDs, so its fixes are ranked by the M-ID cards they unblock (`r-collect-for-mids-work-order-sam-2026-11-20`).
3. **Merge order at sign-off:** #3900 (`2d0fa074`) and #3898 (`de24433f`, the display build) have merged; the land
   (`claude/s741-land`): #3902 merged at 10:57Z as `63000a44`, confirmed on `origin/main` (`test` green on `7a0ccb67`, after a re-run past an npm registry lag and the S727 pooled test's either-state edit for Cuyamaca). This checkpoint, #3897, merges at sign-off, with one update from `main` right before its
   merge. Open PRs at sign-off: #3897 and dependabot's #3383, which waits.

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
- 07:31Z: the conductor's live read of lane 2's 56 held keys (55 with a live row, 51 on the filed run, 0 checked),
  committed whole on `claude/s741-piles` (`c3af2661`) as the live-run proof `piles` asked for. Piles batch 1 (s741a
  Shasta 32162 under a new own-page form `own_lines`, s741b Orange Coast 4, s741c El Camino 2, s741d East Los Angeles
  38168; 8 records) to a Sonnet reader.
- 07:32Z: `keys` report 5 (head `0d808898`): keep-better against the 07:28Z read (9 re-read, 9 kept, 0 restored, none
  a person's); the Copper Mountain reread dispatched on `claude/s741-keys` (force 45957316339); s741k4 (Solano 30184,
  30185, 38591, `total_differs`; 43134 held) to a Sonnet reader.
- 07:32Z: `readers` reported (head `13512bd7`): rule B's `entry_less_descriptions` for San Diego City 22367 (on held
  text it admits 22367 alone: right 1, wrong 0), Ventura's `window_keeps_tabs` (7 of 174 pages move, the tabs right on
  all 7; Victor Valley 04967 moves at its next capture), Norco's `cq_group_ends` (58 lists at three curriQunet
  colleges: 16 close only with group ends marked, 0 close only flat; no filed result moves). The three to one second
  reader on Fable 5.2 (**DECIDED** `d-shared-reader-change-reader-on-fable-s741`: a shared reader-code change gets
  the collection model as its reader, Sonnet stays the plan reader, and Opus stays for workers that write shared data
  or change an apply, under Sam's cost rules of 2026-11-25).
- 07:34Z: #3898 merged (`de24433f`, confirmed on `origin/main`; `test` green on `9594732f`, `main` unmoved since its
  update). The census dispatched on `main`.
- 07:33Z: the Copper Mountain reread 45959225234 (receipt `e9d7729c`): live at 07:35Z, 43854 and 14751 equal at
  45957316339 (passing); 16657 keeps `prerequisites_counted`; 14710, 14737 and 45594 at the reconciled run with no
  gap, for s741k2's rebuild. Records collected: 6.
- 07:35Z: s741k4's reader (Sonnet): APPLY (Mechatronics 36 against each award's own 37-unit major, unlike Palomar's
  case; ASL 18 against 27; 43134 stays out). MINOR for the follow-up: 38591's notes say its section is cut off, which
  its page contradicts. Clean md5 pre-read 3 of 3; `.apply` pushed (`4e7f4b4e`), migrate 45959650737 queued.
- 07:39Z: the census after the display build, 45959377512 on `main` (`473dc192`, live at 07:38Z): 15,642 of 20,282
  pass, 3,996 have no passing record, 644 collected with a named gap (6 moved since 01:12Z: tonight's 6).
- 07:41Z: s741k4's migrate 45959650737 returned 3, none skipped; `.apply` restored (`7de8af25`). Records collected: 9.
- 07:42Z: the reader of `readers`' three changes (Fable 5.2): rule B GO (a true descriptions page stays refused in
  three shapes; MINOR, its recall test counts reach, not what it admits); `window_keeps_tabs` FIX THEN GO (MAJOR: the
  `VISIBLE_KEPT_MIN` floor lets the window run into the panels, which would make Victor Valley 04967 worse);
  `cq_group_ends` FIX THEN GO (MAJOR: a group-end line inside an outer group's child, the worker's own Drafting 5169
  fixture, reads 12 against the printed 6). San Diego City's fresh read dispatched at 07:43Z on
  `claude/s741-readers-sdcity` (cut at the reviewed `13512bd7`; only and force 22367); the two fixes back to `readers`.
- 07:42Z: piles batch 1's reader (Sonnet): s741a, s741b, s741c APPLY; s741d FIX THEN APPLY (its `plan_code` rule
  holds for 90 of 92 East Los Angeles headings and needs the count pinned; no data change). Clean pre-reads 1 of 1, 4
  of 4, 2 of 2; s741a's `.apply` pushed at 07:44Z (`3a7e9b0b`).
- 07:45Z: `keys` report 6 (head `63852115`): s741k2 rebuilt on the reread's rows, and a `site_pages` pin for San
  Bernardino Valley 22821; both to the round-1 reader, its second and last round.
- 07:44Z to 07:51Z, one apply at a time (the migrate queue is global: a second pending run cancels the first): s741a
  45960496863 returned 1; s741b 45960762506 returned 4; s741c 45960978175 returned 2; s741k2 45961174423 returned 4
  (round 2: rebuilt on the reread's rows, APPLY); none skipped. `keys`' `.apply` restored (`c0438e51`). Records
  collected: 20.
- 07:46Z: s741k2's round-2 reader: APPLY, and the San Bernardino Valley 22821 `site_pages` pin GO. 22821's paid read
  dispatched on a sibling branch, `claude/s741-keys-sbvc` (cut at the reviewed `63852115`; only 22821, about $0.07, about
  32 minutes), so `keys`' branch stays free for its free runs.
- 07:52Z: `piles` batch 2 (head `18cafe6e`): s741d's recall pinned; s741e (Contra Costa 01400, 40761) and seven
  `site_pages` pins (American River 39731, 39732; Orange Coast 08663, 08626; Fullerton 36798, 35174; El Camino 19883)
  to the batch-1 reader. s741d's clean pre-read 1 of 1; `.apply` pushed (`b6d43195`).
- 07:53Z: s741d 45961440406 returned 1, none skipped; `piles`' `.apply` restored (`e1480164`). Records collected: 21.
  Spend at 07:54Z: about $110 at the repo's rates.
- 07:55Z: piles batch 2's reader: s741e APPLY (01400's summary prints GE "None"; 40761 at CIS099's noted 2 units gives
  the printed 22), the seven pins GO as a set (MINOR: no test yet pins American River's Level I and II windows or
  Fullerton's two). s741e's clean pre-read 2 of 2; migrate 45961856192 returned 2, none skipped; `.apply` restored
  (`d4b0d71d`). Records collected: 23.
- 07:58Z: American River's two pins bind in free capture 45961227651 (39731 at p.207-208, 39732 at p.208-209, each its
  own page, coverage 1.0; both were read from p.211, the Level IV tail); the paid read dispatched on
  `claude/s741-piles` (sources_from 45961227651, only 39731 and 39732, about $0.20). `piles`' step 3 over its colleges
  filed nothing (16 discontinued flags, none new; the units rules' dry run moves 0 rows).
- 08:00Z: `keys` report 7: its list is done or blocked, 13 collected (Santa Ana 2; San Bernardino Valley 35833, 22784;
  Copper Mountain 43854, 14751, 14737, 20094, 45594, 14710; Solano 30184, 30185, 38591). Held, each needing shared code:
  San Bernardino Valley 17829 (keep-better ranks a degree's "incomplete" below the filed "unequal"), 04873 (the page
  lists fewer courses than its lists ask; no kind names it), 04894 (the scorer adds MUS 141X2 and MUS 241X2 at 1.5 where
  the heading's pair totals 2), 39483 (no reading adds to the printed 27-30); Solano 43134 (the state lists World
  Languages A.A. twice, with 06538: a person's); San Jose City 18449, 38499 (cut-off names standing for several courses).
  **Split change:** `keys` takes Cuyamaca, Cosumnes River and Cuesta (lane NEXT (3)'s reader and scorer changes:
  Cuyamaca 18634 to 18637, Cosumnes River 33542, Cuesta 43053 and 41744); no other lane holds them.
- 08:10Z: American River's paid read 45962123468 filed 39731 (12 against 12) and 39732 (24 against 24) from their own
  pages ($0.16), nothing else moved; `piles` found 39341 (filed by s739a from p.211, the Level IV tail) opens on p.206
  and pinned it, with Butte 14583's pin, for the next reader. 08:12Z: the reread (force 45962123468) queued on
  `claude/s741-piles` behind Fullerton's free capture; no person's check at American River.
- 08:12Z: `readers` round 2 (head `f45aba82`): the window floor fixed (Victor Valley 04967 no longer moves; Ventura's
  seven are the only pages of 174 that differ), group ends inside another group take no line (Norco whole: 74 of 185
  pages carry 107 lines, no program moves), rule B's recall pinned. To the same reader, its last round.
- 08:16Z: the readers' round 2 (Fable 5.2): `window_keeps_tabs` GO and `cq_group_ends` GO (both MAJORs closed; NIT
  for the follow-up: 2,501 to 2,561 visible characters ahead of the panels cost up to 38 tab characters). 08:17Z:
  Ventura's paid read on `claude/s741-readers` (sources_from 45955854213, seven `only=`, force 06948 and 08253, about
  $0.70) and Norco's on a sibling, `claude/s741-readers-norco` (cut at the reviewed `f45aba82`; sources_from
  45961548900, twelve `only=` and `force=`, about $1.20).
- 08:12Z: American River's reread 45963855075 posted 39731 and 39732; live at 08:18Z, both equal at 45962123468
  (passing). Records collected: 25. 08:11Z: San Bernardino Valley 22821's read 45960735042 finished on the sibling;
  08:18Z, its keep-better live read (no person's check, 221 rows) handed to `keys`. 08:17Z to 08:18Z: Ventura's read
  45964322406 and Norco's 45964327019 finished; their results go to `readers`.
- 08:21Z: San Bernardino Valley 22821 filed passing (read 45960735042: 7 of 7 placed, 20 against the printed 20);
  keep-better against the 08:18Z read kept it (1 re-read, none restored); the reread (force 45960735042) dispatched on
  `claude/s741-keys-sbvc`.
- 08:24Z: 22821 live and passing at 45960735042. Records collected: 26.
- 08:28Z: piles batch 3's reader: s741f APPLY (Orange Coast 32790's text stops mid-row in Area 5A with no total; the
  run proved by the 07:31Z read) and the Butte 14583 and American River 39341 pins GO. s741f's clean pre-read 1 of 1;
  migrate 45966052595 returned 1, none skipped; `.apply` restored (`1e0d3c84`). Records collected: 27.
- 08:32Z: `keys` report 10 (head `e8ae2194`): Cuyamaca 18634 to 18636 fail on the degree alone, so the change is a
  per-college reconcile step (`degree_total_minimum` from "Complete 60 transferable units"; recall over the college's
  180 records: 4 flagged, right 4, wrong 0, none fails), to the Sonnet reader. 18637's record is Grossmont's page;
  keep-better's word test ("Science" against "Sciences") is the shared change, next.
- 08:33Z: Cuyamaca's step GO (Sonnet): the real reconcile flags 18634, 18635 and 18636; the recall's fourth, 18637,
  stays as filed under the moved-page guard (its record is Grossmont's page) until a read of its own page. `keys`
  dispatches the free reconcile.
- 08:45Z: `readers` reported (head `841c1110`, the Norco sibling merged in): Ventura's seven all pass; Norco's twelve:
  seven pass, 32830, 37311 and 44961 read incomplete with the major equal to its printed total (`ge_units_not_read`),
  39998 and 40064 unequal. Its keep-better ranking change (an "incomplete, major equal" re-read above a filed
  "unequal": 210 such records statewide) to the Fable reader; Norco's reread waits for its GO, Ventura's goes first.
  Keep-better's live read at 08:46Z: no person's check at Ventura, Norco or San Diego City.
- 08:48Z: Fullerton's two pins bind in free capture 45963792185 (36798 and 35174 each on its own Chemistry page; 314
  kept); the paid read dispatched on `claude/s741-piles` (sources_from 45963792185, only 36798 and 35174, about
  $0.20), pending behind American River's second free capture (39341's pin). East Los Angeles 02456, 31017, 37510
  (live on runs older than the committed reconcile 45176404274) and Santa Monica 43767 go to `piles` next.
- 08:50Z: the keep-better ranking's reader (Fable 5.2): FIX THEN GO (MAJOR: a re-read that lost the GE units would
  beat a filed record holding them; 79 filed records at 27 colleges are unequal at the degree with the major equal;
  fix: the new rank holds only where the filed record's own major is not equal). Norco's three keep their choice under
  the fix. Back to `readers`.
- 08:54Z: East Los Angeles and Santa Monica: keep-better says no dispatch at either (East Los Angeles: 12 already
  live at 45176404274, 8 for a person's reason, 4 restored as filed on a generic "(Academic Plan E0...)" heading;
  Santa Monica: 210 live, 4 for a person's reason, 43767 among them); 02456's plan waits with them. Finding
  (`f-ela-committed-passes-live-older-s741`): ten East Los Angeles records whose committed file is the reconcile
  45176404274 sit live on older runs, eight passing in the committed files (35087, 35088, 35888, 37510, 38337, 41132,
  43725, 45987), so the census counts them passed where the live table may not; keep-better's generic-heading test
  refuses "(Academic Plan E002456C)", which carries the record's own number (the follow-up, with a reader).
- 08:53Z: `readers` (head `eb049d29`): the keep-better fix made (a filed unequal record whose major equals stays
  above), to its reader's second round; Ventura's account keeps all seven, and its reread dispatched (force
  45964322406). Spend at 08:53Z: about $187.
- 08:54Z: the keep-better fix's round 2 (Fable 5.2): GO (all 79 major-equal unequal records keep their filed record).
  Ventura's reread 45969224515 posted the seven; live at 08:56Z, all equal at 45964322406 (passing). Records
  collected: 34. Cuyamaca's free reconcile 45966682528 filed at 08:53Z on `claude/s741-keys`.
- 08:58Z: Norco's keep-better account (head `6df4a2bd`) keeps all twelve re-reads; the reread dispatched (force
  45964327019) and posted: seven equal (30061, 30091, 33751, 33854, 40079, 41680, 44792), 32830, 37311 and 44961
  incomplete and 39998 and 40064 unequal, for a gap plan. Records collected: 41.
- 09:00Z: American River 39341's pin binds in free capture 45968461070 (p.206 to p.207, its own page; it had been read
  from p.211); its paid read queued on `claude/s741-piles` behind Fullerton's (only 39341, about $0.08). Butte's and
  Orange Coast's free captures fall to the next session, their pins in place.
- 09:01Z: Fullerton's paid read 45968499315 filed 36798 (36 against 36, 9 of 9) and 35174 (20 against 20) from their
  own Chemistry pages, nothing else moved; the reread (force 45968499315) queued behind 39341's read 45970104024.
- 09:10Z: Fullerton's reread posted 36798 and 35174 (live, equal at 45968499315). Records collected: 43. American River
  39341's paid read 45970104024 filed it passing on its own page (56 against 56, 34 of 34); its reread (force
  45970104024) dispatched, replacing s739a's wrong-page gap row with the passing record (an upgrade, not a new record).
  `piles` prepares its branch for the land.
- 09:10Z: the OPTION_PART reader (Fable 5.2): the scorer change GO (its own recall over 18,970 records: 4 newly named, 2
  parts moved, 0 pass to fail; Imperial Valley 01873 moves fail to pass at its next rescore), with one test to repair
  before the land (`tests/program_piles_s740_sbvc_test.py` refuses 22784 now that s741k3 posts it). Back to `keys`
  with the order to wrap up: Cuyamaca's reread, Cosumnes River's reconcile, then the branch green.
- 09:10Z: `readers` plan s741r1 (head `60b7a885`; Norco 32830, 37311, 44961 `ge_units_not_read`, 39998 and 40064
  `noted_figures_differ`; recall 5 of 5) to a Sonnet reader.
- 09:15Z: s741r1's reader (Sonnet): APPLY. Clean md5 pre-read 5 of 5; migrate 45971839433 returned 5, none skipped;
  `.apply` restored (`96a83de6`). American River 39341 live and passing at 45970104024 (its reread). Records
  collected: 48.
- 09:18Z: Cuyamaca's keep-better keeps its three (18634, 18635, 18636 pass by the degree's floor); the reread
  dispatched on a sibling, `claude/s741-keys-cuy` (cut at `3d3bb35f`; force 45966682528), since Cosumnes River's
  free reconcile 45972311864 (OPTION_PART) holds `claude/s741-keys`. Its keep-better live read at 09:18Z (no
  person's check). The 18637 word test (recall: 44 answers move at 24 colleges, right 44, wrong 0) sits unreviewed on
  `claude/s741-keys-wordtest` (`302c12c5`) for the next session; nothing of it lands tonight.
- 09:20Z: Cuyamaca's reread posted 18634, 18635 and 18636, live and equal at 45966682528 (passing). Records collected:
  51. San Diego City's fresh read 45960365618 finished at 09:16Z on `claude/s741-readers-sdcity`.
- 09:32Z: Cosumnes River's free reconcile 45972311864 filed 8 (33542 passes 19 of 19 by OPTION_PART); keep-better kept
  3 and restored 5 filed passes; but the college's compiled PDF repaginated (Marketing p.474 to p.473), so the fresh
  capture moves 04596 and 35899 and two S739 tests (Cosumnes, the lever) go red. **DECIDED**
  `d-crc-filing-parked-for-moved-pdf-s741`: the filing is parked on `claude/s741-keys-crc` and reverted on
  `claude/s741-keys`; 33542 waits for the next session (either-state edits to the two tests, then the reread).
- 09:36Z: San Diego City's load posted 22367 alone (live, equal at 45960365618; 24 against 24 from its own entry).
  Records collected: 52. All three lanes' lists done; `land` (Sonnet) started on `claude/s741-land` off `main`
  (`473dc192`), to merge `claude/s741-keys` (`91950220`), `claude/s741-keys-sbvc` (`a57c13c8`),
  `claude/s741-keys-cuy` (`303ea541`), `claude/s741-readers` (`33b6e622`, holding the Norco and San Diego
  City siblings) and `claude/s741-piles` (`6705512e`); parked and left out: `claude/s741-keys-wordtest`,
  `claude/s741-keys-crc`.
- 09:37Z: the checkpoint-docs worker (Sonnet) started; step 12's headline and harvest reads at 09:40Z (15,669 of
  20,282 active programs complete, at 118 colleges). 09:44Z: the checkpoint pushed (`6b1cd442`); 09:46Z: the memory
  rows, migrate 45976492793, 9 rows, all proposed; `.apply` restored (`01aabd81`). 09:50Z: the vault note merged as
  samueltlee/CPLBrain#874 (`9e6933e0`), under Sam's ruling of 2026-11-21.
- 09:55Z: the land (head `662a5933`): generated files rebuilt with their builders, hand-written lists keep both sides,
  no record or receipt conflict, `.apply` equal to `main`'s; two San Bernardino Valley tests assumed 22821's old hold
  and now accept either state (`eb16fb5b`). 10:16Z: #3902 opened from `claude/s741-land` and marked ready.
- 10:30Z: #3902's `test` failed at `npm install` on every suite shard (`No matching version found for
  tldts-core@^7.6.2`: the registry had published tldts 7.6.2 before the tldts-core it needs). By 10:30Z the registry
  lists tldts-core 7.6.2, so the failed jobs of run 45980615825 were re-run (a transient external failure; no code
  change). If it recurs, pin `tldts` to 7.6.1 with `overrides` (troubleshooting: pin exactly).

## What shipped

In all: 52 records collected and live (28 passing, 24 named gaps by guarded plans), no outline rows, paid reads about $3
on their estimates. Census and headline: the closing census, run 45986575262 on `main`, dispatched at 10:58Z after the land (its numbers are the next session's first read); the census after the display build, 45959377512 (07:38Z): 15,642 of 20,282 pass, 3,996 without, 644 with a named gap. The headline's pair at 09:40Z: 15,669 of 20,282 active programs
complete at 118 colleges.

**Merged.**
- **#3900 (`2d0fa074`, 07:07Z), `main` green again:** `tests/subject_decisions_noncredit_test.py` assumed its injected
  Los Angeles Pierce OLD noncredit save adds one applied decision, and the sync had carried a person's save of that key;
  the two checks now expect one more only while no live save holds the key.
- **#3898 (`de24433f`, 07:34Z), the display build `a143061a2ae2`** (18,746 rows; the gate at Glendale 45951236087, then
  the whole build 45951699122); the census after it, 45959377512: 15,642 pass, 3,996 without, 644 with a named gap.
- **The land** `claude/s741-land`: #3902 merged at 10:57Z as `63000a44`, confirmed on `origin/main` (`test` green on `7a0ccb67`, after a re-run past an npm registry lag and the S727 pooled test's either-state edit for Cuyamaca).

**Live (each applied, reread or loaded).**
- Keys 17: Santa Ana 31859, 21789 (s741k1); San Bernardino Valley 35833, 22784 (s741k3), 22821 (read 45960735042);
  Copper Mountain 43854, 14751 (the degree-floor step, reread 45959225234), 14737, 20094, 45594, 14710 (s741k2); Solano
  30184, 30185, 38591 (s741k4); Cuyamaca 18634, 18635, 18636 (the degree-floor step, reread on `claude/s741-keys-cuy`).
- Readers 20: Ventura 06948, 08253, 35654, 37415, 40179, 44994, 44995 (reread 45969224515); Norco 30061, 30091, 33751,
  33854, 40079, 41680, 44792 passing and 32830, 37311, 44961, 39998, 40064 named gaps (s741r1, reread 45969610504, migrate
  45971839433); San Diego City 22367 (read 45960365618, load).
- Piles 15: s741a Shasta 32162; s741b Orange Coast 08628, 19473, 19474, 08664; s741c El Camino 31319, 42541; s741d East
  Los Angeles 38168; s741e Contra Costa 01400, 40761; s741f Orange Coast 32790; American River 39731, 39732 and Fullerton
  36798, 35174 by pins and paid reads. American River 39341 moved from a wrong-page gap to passing (an upgrade, not counted).
- New code: rule B `entry_less_descriptions`, `window_keeps_tabs`, `cq_group_ends`, the keep-better ranking, OPTION_PART
  Roman numerals, the Copper Mountain and Cuyamaca `degree_total_minimum` steps, site and pdf pins (American River 39731,
  39732, 39341; Fullerton 36798, 35174; Orange Coast 08663, 08626; El Camino 19883; Butte 14583; San Bernardino Valley
  22821), `own_lines`; each passed its reader (verdicts in the log above).
- Parked, not landed: `claude/s741-keys-wordtest` (`302c12c5`) and `claude/s741-keys-crc` (`49e6c644`).

## Open work, from the lanes' NEXT lines

1. **`program-requirements-harvest`** (the routine's), by the lane's NEXT:
   - NEXT (2): the display build carrying S741's records, gate college Glendale, then `harvest-gap-census.yml` on `main`.
   - NEXT (3), lane 1: review and land `claude/s741-keys-wordtest` (then a paid read of Cuyamaca `only=18637`); Cosumnes
     River's `claude/s741-keys-crc` (either-state edits to the two S739 tests, then reread force 45972311864); the pins
     awaiting free captures (Butte 14583, Orange Coast 08663 and 08626, El Camino 19883); the holds by key (San
     Bernardino Valley 17829, 04873, 04894, 39483; Solano 43134; San Jose City 18449, 38499; Cuesta 43053, 41744; San Diego
     City 38732, 22352; East Los Angeles 02456, 35088, 35888, 37510; Santa Monica 43767); the reader and scorer changes
     still open (El Camino's four, Modesto 35127, Coastline 43057, Reedley 30465, Los Angeles Pierce 19181, Grossmont 21402).
   - NEXT (5), lane 2: tonight's holds by key (lessons *S741*), S740's remaining ones, then S720's and S721's rest.
   - NEXT (6), the follow-up PR: the Porterville 06773 guard first, then S731's, S739's, S740's and S741's minors.
   - Step 11: the outline queue is empty until a census, a capture or a verdict row changes (NEXT (1)).
2. **A plain session's, each by its lane's NEXT** (conductor runs stay on collection): `common-subjects-reference` and
   `commons` (Sam's plain sessions hold them); `implementation-funding` (27,661 bytes against 20,000: compact first);
   `cer-procedures` (21,633 bytes: compact first); `my-college-action-page`; `nc-learning-partners`; `repo-size`;
   `governance-team-enablement`, `library`, `sierra-page-redesign` and `common-cr-reference`; the brief's slimming items
   (`d-slimming-left-to-plain-session-s720`). None was worked tonight.

## Blocks (Sam's ruling 1: listed here until the Commons' Needs you shows them)

Handoff 741's table stands in every row this run did not clear; the rows below changed.

| Block | Who clears it | Since |
|---|---|---|
| Cosumnes River 33542: filing parked for the repaginated PDF (`claude/s741-keys-crc`, `49e6c644`) | Sky, either-state test edits, then a reread | 2026-11-27 (S741) |
| Cuyamaca 18637: the plural fold (`claude/s741-keys-wordtest`, `302c12c5`, unreviewed) | Sky, a second reader, then a paid read | 2026-11-27 (S741) |
| Pins awaiting a free capture: Butte 14583, Orange Coast 08663 and 08626, El Camino 19883 | Sky, lane 2 | 2026-11-27 (S741) |
| San Bernardino Valley 17829, 04873, 04894, 39483; Solano 43134 (a person's); San Jose City 18449, 38499 | Sky, shared code; Solano 43134 a person | 2026-11-26 (S740), 2026-11-27 (S741) |
| Cuesta 43053, 41744; San Diego City 38732, 22352; East Los Angeles 02456, 35088, 35888, 37510; Santa Monica 43767 | Sky, lane 1 (keep-better says no dispatch at the last five) | 2026-11-27 (S741) |
| Reader and scorer changes: El Camino 19861, 19866, 38948, 43993; Modesto 35127; Coastline 43057; Reedley 30465; Los Angeles Pierce 19181; Grossmont 21402; 26 curriQunet catalogs awaiting a capture | Sky, reader changes with second readers | 2026-11-26 (S740), 2026-11-27 (S741) |
| The follow-up's minors from S741's readers (lessons *S741*, *Readers' MINORs*) | Sky, the follow-up | 2026-11-27 (S741) |

Cleared tonight: Santa Ana 31859, 21789; Copper Mountain 43854, 14751, 14737, 20094, 45594, 14710; San Bernardino Valley
35833, 22784, 22821; Solano 30184, 30185, 38591; Cuyamaca 18634 to 18636; San Diego City 22367; Ventura's seven; Norco's
twelve (seven passing, five named); Shasta 32162; American River 39731, 39732, 39341; Fullerton 36798, 35174; the Orange
Coast, El Camino, East Los Angeles and Contra Costa piles above.

## For Sam

Nothing waits on Sam ([Open Asks Sheet 200](https://claude.ai/artifact/5ShC7pGgNuz9bJUhkdsc8Y), current; no reply
since 2026-11-19T23:47Z). Every call tonight was the conductor's, recorded below and reversible.

## Decisions Sam made

None tonight. Sam's words in this session: none. The run acted on his routine prompt of 2026-11-17, his
collect-with-gaps ruling of the same day (`sam-collect-with-gaps-2026-11-17`), his work order of 2026-11-20 and his cost
rules of 2026-11-25.

## Decisions (the conductor's, each reversible)

- `d-reread-before-rebuilt-plan-s741`: the reread of the reconciled run first, then s741k2 rebuilt on its rows.
- `d-shared-reader-change-reader-on-fable-s741`: a shared reader-code change gets the collection model as its reader;
  Sonnet stays the plan reader, Opus stays for workers that write shared data or change an apply.
- `d-crc-filing-parked-for-moved-pdf-s741`: Cosumnes River's filing parked on a branch and reverted on `claude/s741-keys`.

Memory rows: `kb/migrations/2026-11-27_s741_cpl_memory_rows.sql` (9 rows, all proposed, INSERT-only with
`ON CONFLICT DO NOTHING`, rollback in its header), drafted by the checkpoint-docs worker, applied by the conductor.

## Patterns that worked

- **Plan, second reader, clean md5 pre-read, one apply, `.apply` restored**, for every plan; a Sonnet reader for plans and
  a Fable 5.2 reader for shared reader code.
- **A sibling branch for each long read** (`claude/s741-keys-sbvc`, `-keys-cuy`, `-readers-norco`, `-readers-sdcity`), so a
  worker's branch stays free for its free runs.
- **Keep-better from the conductor's live read before every reread**; the conductor's own live read of lane 2's held
  keys, committed whole as the live-run proof.
- **A per-college reconcile step for a degree-floor gap** (`degree_total_minimum`), with a recall over the college's
  whole record set (Cuyamaca: 4 flagged, right 4, wrong 0).

## Findings

- `p-noncredit-test-injected-key-collides-with-live-save-s741`: a test that injects a key goes red when the sync carries a
  person's save of it, and `main`'s red blocks every merge.
- `p-conductor-apply-from-detached-head-s741`: apply from a detached HEAD and push `HEAD:<branch>`.
- `p-migrate-queue-global-pending-cancels-s741`: one apply at a time; a second pending run cancels the first.
- `f-ela-committed-passes-live-older-s741`: ten East Los Angeles records pass in their committed files and sit live on
  older runs.
- `f-keep-better-major-equal-rank-s741`: an "incomplete, major equal" re-read outranks a filed "unequal" only where the
  filed record's own major is not equal.

## Safety patterns to honor

All of handoff 741's. New tonight: a reread of a reconciled run comes before a plan rebuilt on its rows; apply from a
detached HEAD; one apply in flight; a plan test that injects a key waits on no live save of it; a shared reader-code change
takes the collection model as its second reader; a filing whose fresh capture moves other records parks on a branch.
Never file a person's name from an outline page anywhere. A permission-check refusal is never routed around.

## Conductor settings

A conductor run for collection only, under Sam's routine prompt of 2026-11-17 (`docs/reference/conductor_mode.md`,
*Back for collection only*; review rounds as his ruling of 2026-11-20 sets them). Settings block (Sam, 2026-11-11, his
latest change; the block copied from `docs/reference/conductor_mode.md`):

- Conductor model: Fable 5.2 (`claude-fable-5-2`), working with COBIx; the routine's form sets the model and ultracode;
  medium effort lives in its prompt. Tonight Opus 5.5 served the conductor (the form names Fable 5.2).
- Ultracode on. The conductor at medium effort.
- Workers on Opus 5.5 (named in each Agent call, `model: opus`); tonight no Opus worker ran: `keys`, `readers` and `piles`
  ran Fable 5.2 at high effort, the plan readers and the land ran Sonnet, the shared and scorer readers ran Fable 5.2, and
  pr-gate ran Haiku.
- A worker building anything that writes shared data or changes an apply runs at **high** effort.
- A review workflow uses **at most 9 agents in all**, readers and second readers together.
- **Cost limits:** $40 per college per run, on the estimate, for program-requirements extraction, and a separate $40 per
  college for SLOs, PLOs and course objectives; per run, never a remaining pot. Paid runs go through the conductor.

Also: two lanes, never on one college; about $750 a day for everything, $10k running total for the whole job; stop
rules from the brief: a day over $300 with fewer than 40 new programs; over $12 per new program or $0.50 per outline row;
a rollback that undoes over 1% of a day's rows; the $10k checkpoint. This run aimed at about $275, with no new worker
after about $210; the repo's rates read about $187 at 08:53Z.

## Ledger

| PR or branch | State | Next |
|---|---|---|
| #3897 (`claude/awesome-fermat-e6ozhd`) | the declaration, the log and this checkpoint (draft) | merges at sign-off, after one update from `main` |
| #3898 (`claude/s741-display`) | merged `de24433f` (07:34Z); display build `a143061a2ae2` live | none |
| #3900 (`claude/s741-main-red`) | merged `2d0fa074` (07:07Z) | none |
| `claude/s741-keys`, `-keys-sbvc`, `-keys-cuy`, `claude/s741-readers`, `-readers-norco`, `-readers-sdcity`, `claude/s741-piles` | s741k1 to s741k4, s741r1, s741a to s741f applied; reads and rereads live | the land `claude/s741-land`: #3902 merged at 10:57Z as `63000a44`, confirmed on `origin/main` (`test` green on `7a0ccb67`, after a re-run past an npm registry lag and the S727 pooled test's either-state edit for Cuyamaca) |
| `claude/s741-keys-wordtest` (`302c12c5`), `claude/s741-keys-crc` (`49e6c644`) | parked, unreviewed | the next session (NEXT (3)) |
| Harvest gap census on `main` | 45920941316 (01:12Z); after the display build 45959377512 (07:38Z): 15,642 pass | the closing census: the closing census, run 45986575262 on `main`, dispatched at 10:58Z after the land (its numbers are the next session's first read); the census after the display build, 45959377512 (07:38Z): 15,642 of 20,282 pass, 3,996 without, 644 with a named gap |
| #3383 | dependabot's | waits |

## Let go

No PR subscription, artifact watch or COBIx watcher was opened tonight, and the run's fallback timers have all fired with
none pending, so there is none to drop. Workers end with the session; each branch is pushed. The vault note for this run is
`CPLBrain/07-session-notes/2026-11-27-s741-skywillet-collection.md` (merged as samueltlee/CPLBrain#874, `9e6933e0`, under Sam's ruling of 2026-11-21 that vault note drafts merge on their own).

Spend: $255.25 estimate (Opus 5.5 $43.29, Fable 5.2 $193.44, Sonnet $18.05, Haiku $0.48); collection $255.25; 2026-11-27T06:12Z to 2026-11-27T11:04Z. (A token-count estimate at the repo's list
prices; the conductor fills the final figure. The paid reads' own cost, about $3 on their estimates, is apart.)

Opening line: *Greetings, you are SkyGodwit (the next free session number at your start; the routine takes it, so Session 742 and the run after it writes 743), see SkyWillet's (S741) handoff — `docs/session_742_handoff.md` — let's keep rolling with our queue.*

Conductor model: Opus 5.5 (the form names Fable 5.2); session cost about $255.25 (a token-count estimate; get_session is not available here); 52 records collected and live (28 passing, 24 named gaps); 0 outline rows added; 3 substantive PRs merged (#3900, #3898, #3902 merged at 10:57Z as `63000a44`, confirmed on `origin/main` (`test` green on `7a0ccb67`, after a re-run past an npm registry lag and the S727 pooled test's either-state edit for Cuyamaca)), not counting checkpoints.
