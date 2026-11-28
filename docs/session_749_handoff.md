---
title: "Session 749 handoff (from SkyStilt, S748, the CPL Queue routine's collection run of 2026-11-28, from 06:12Z)"
created: 2026-11-28
updated: 2026-11-28
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

**Conductor model: Fable 5.2 (claude-fable-5-2), as this run's header reports, matching the routine's form.
get_session is not among this run's tools, so the header is the only readout.**

**Routing, both ways.** A CPL Queue routine firing follows this file. A plain session Sam opens follows the newest
handoff his plain sessions write (748, S747 SkyShearwater's, naming SkyGannet), never this file.
**Numbering.** Handoff 743 (S742 SkyGodwit) named SkyStilt for the routine's next session, to take the next free number.
747 was Sam's plain session in flight at the start, so this run is S748 and writes 749. Handoff 748 calls SkyGannet
"Session 748"; this run took that number first, so Sam's next plain session takes the next free one. The routine's next
session is **SkySandpiper**, to take the next free number at its start.

*(Declaration, written at 06:17Z before any worker started; the sections after the log were written at the checkpoint.)*

## Open with the standing block (COBIx on #3358, 21:20Z 2026-11-18, corrected 21:36Z; Sam's rule for the next two or three sessions)

0. **COBIx's brief is on issue #3358**: read the newest (comment 6894464154, Fri Nov 27, 6:45 PM PT, at this writing),
   and comment 7064588752 (Sam's two rulings of 2026-11-21), before the split.
1. **No COBIx watcher.** Sam, 01:53Z 2026-11-23, to S712: *"No need for the Cobix check ins for now"*
   (`d-cobix-watcher-stopped-on-sam-word-s714`). Read a PR's whole thread before you merge it or apply what it carries.
1a. **Clone light (Sam, 2026-11-19):** `git clone --filter=blob:none` (or `--depth=1` when history is not needed),
   never a full clone. Fetch a branch by name; a worker's push counts once `git ls-remote` shows its head
   (`p-worker-push-proved-by-ls-remote-s731`). Fetch `main` by name first (`p-shared-clone-origin-main-stale-s739`).
   The harness pins each worker to its own worktree (`f-harness-pins-worker-to-worktree-s748`).
2. **Merge rules:** at most 3 open PRs (plus #3511 and dependabot's), the oldest finished first, one update from `main`
   right before its merge, no dependency-map rebuild inside a PR, no full rerun when the input fingerprints match. Stop
   a review after two rounds. Records PRs merge one at a time (`p-records-prs-merge-one-at-a-time-s703`).
2a. **Sam's work order (2026-11-20):** collection comes first, data waves before fixes, and a fix goes ahead of the next
   wave only when it blocks it or would file wrong rows (`r-collection-first-sam-2026-11-20`). Collection serves the
   M-IDs, so its fixes are ranked by the M-ID cards they unblock (`r-collect-for-mids-work-order-sam-2026-11-20`).
3. **Merge order at sign-off:** the land #3945 has merged (`cd464091`); the second land, Mt. San Antonio's eight
   (`claude/s748-land-mtsac`: PR number and merge sha, the conductor fills in), merges next; this checkpoint, #3940,
   merges after it, with one update from `main` right before its merge. Open beside them: COBIx's #3937, #3926 and
   #3917 (Sam's or COBIx's) and dependabot's #3383, which waits.

## The start (06:12Z firing, 2026-11-28)

- Brief: COBIx's on #3358 (comment 6894464154, Fri Nov 27, written 6:45 PM PT, `main` at `205e6cae`). Handoff 747
  (S746) is the newest numbered file; the routine's own is 743. On `main` since the brief: Sam's S747 merges #3933,
  #3936, #3938 and #3939 (the last at 06:05Z), a plain session, which never stands the queue down.
- One writer: no `list_sessions`, `get_trigger` or `get_session` here. Open PRs at 06:15Z: COBIx's #3937 (subject
  titles, 05:04Z), #3926 and #3917 (superseded, Sam's or COBIx's to close) and dependabot's #3383. None is a queue
  session's. Subject titles are the plain session's lane; this run leaves all four.
- Step 0: the night's first firing; no `daily-dashboard.yml` run was created on 2026-11-28 UTC, so it was dispatched on
  `main` at 06:15Z.
- No pause line (handoffs 747 and 743). Three repos attached. `check_hooks_live.py`: ROOT LIVE. No `set_session_tags`.
- `queue_todo_done` since 2026-11-27: none. Rule 8's memory read: no harvest row since S742's eight. Two Library
  requests wait (held in a conductor run, as S727 to S742 held them). Step 11: the outline queue is empty.
- **The display build is already current:** S746's #3927 applied build `229a759101f7` to 18,751 records at 01:29Z
  (run 46092611343), after S742's records closed, so the brief's item 1 needs no build; a census follows this run's
  records.
- Census on `main` (46089216929, 00:44Z): 15,680 of 20,282 pass, 3,927 have no passing record, 675 are collected with
  a named gap.
- **Spend aim:** about $250 for this run, no new worker after about $190.

## The college split (written before any worker started)

Two lanes, never on one college at the same time, one writer per college. Workers run Fable 5.2 at high effort; plan
readers Sonnet; shared-code readers Fable 5.2; pr-gate Haiku. No Opus worker is planned. The conductor alone dispatches
paid reads, rereads, loads and `.apply`, and holds every Supabase call.

- **Lane 1 (collection):**
  - `keys`: San Jose City 18449; San Bernardino Valley 04894; San Diego City 22367 (rule B); the units within-range
    keys, Santa Ana 31859 and 21789, Copper Mountain 43854, 14737 and 20094. Colleges: San Jose City, San Bernardino
    Valley, San Diego City, Santa Ana, Copper Mountain.
  - `readers`: Cuyamaca 18637 (`claude/s742-readers-cuy2`, `284d0270`); Coastline 43057's staging fix
    (`claude/s742-readers-stagepin`, `f3a01a5b`, a Fable second reader first); El Camino 19857; Reedley 30465; Los
    Angeles Pierce 19181; Grossmont 21402; Ventura's `tabs_with_prose` seven; Norco's 11 and 30061. Colleges: Cuyamaca,
    Coastline, El Camino, Reedley, Los Angeles Pierce, Grossmont, Ventura, Norco.
- **Lane 2 (cheap piles, one worker):** `piles`: Orange Coast 08663 and 08626 (the paid read, capture 45999669017) and
  its other holds; the gap plans Butte 14583, Santa Barbara City 43553 and East Los Angeles 31017; the rest of S720's
  and S721's holds (Fullerton, City College of San Francisco, College of the Sequoias, East Los Angeles); discontinued
  flags, units rules and retired courses over its colleges; at its land, the Spend line's builders and the Commons page
  counts. Colleges: Orange Coast, Butte, Santa Barbara City, East Los Angeles, Fullerton, City College of San
  Francisco, College of the Sequoias.
- **Not tonight:** Porterville; Saddleback; West Valley 35588, Southwestern and Pasadena City; Antelope Valley and
  Mission; College of the Desert (robots.txt); Los Medanos; Solano 43134 (a person's); Santa Monica 43767 (a person
  compares); Glendale 44488 and 45068; City College of San Francisco's Cal-GETC dry run (a plain session's); the
  follow-up PR, after the waves if the run has room.

## Split changes during the run

- 06:17Z: the declaration pushed, draft #3940; `keys`, `readers` and `piles` started on Fable 5.2 at high effort.
- 06:50Z: `keys` stop 1 (`claude/s748-keys`, `83f67d9e`): Santa Ana 31859 and 21789 and Copper Mountain 14737 and 20094
  are already collected with named gaps (S741); Copper Mountain 43854 and San Diego City 22367 pass. San Bernardino
  Valley 04894: two reconcile steps of existing kinds (recall over 221 records: 1 fail to pass, 0 pass to fail), to a
  Sonnet second reader before the free reconcile. San Jose City 18449: left unfinished (its four sit outside the Active
  count). `keys` moves to the fresh census's wave over colleges outside both lanes.
- 06:55Z: 04894's second reader (Sonnet): GO (the steps reach 04894 alone over the college's 221 records; six mutations
  turn the test red; MINOR: the two page reads' printed output is not committed). The free reconcile 46118801512
  dispatched on a sibling, `claude/s748-keys-sbvc`, cut at `83f67d9e`.
- 06:56Z: `piles` stop 1 (`claude/s748-piles`, `dbfa9e08`): plan s748a (Butte 14583 `noted_section_cut_off`, Santa
  Barbara City 43553 `total_differs`). Held: East Los Angeles 31017 (no filed kind is true of a sum on both sides of the
  printed 60; a reconcile step is its lever) and Santa Barbara City 30746 (its page does not print PSY 200).
- 07:00Z: `readers` stop 1: Cuyamaca 18637 merged with `main` on `claude/s748-readers-cuy2`; Coastline 43057's staging
  fix on `claude/s748-readers-stagepin` (`b2687880`; recall over 231 held answers: 230 right and 1 wrong before, 231 and
  0 after), to a Fable 5.2 second reader. The conductor's Cuyamaca live read (07:00:13Z): 179 rows, none checked, 18637
  alone at 46003456131.
- 07:03Z: keep-better kept 18637 (`3e2062aa`); the reread, force 46017556328, dispatched on `claude/s748-readers-cuy2`.
- 07:05Z: s748a's reader (Sonnet): APPLY (the real apply and rollback run on a scratch Postgres: a wrong run, a changed
  record, a missing row and a confirm each abort; a checked row is skipped; S742a's output byte-identical under the
  `Batch` change). Clean md5 pre-read 2 of 2. The apply pushed on `claude/s748-apply` (`dc2bc0a0`), migrate 46119599942.
- 07:08Z: s748a's migrate 46119599942 green; live: Butte 14583 `noted_section_cut_off` and Santa Barbara City 43553
  `total_differs`, neither checked; `.apply` restored on `claude/s748-apply` (`655c4fe8`). Cuyamaca's reread
  46119479258 green; 18637 live at 46017556328 with its arithmetic equal. Records collected: 3.
- 07:09Z: the Coastline fix's second reader (Fable 5.2): GO (over 22,335 filed sources and 10 previews the fix changes one
  staging, 43057's; MAJOR for the follow-up: test 4c's oracle restates the rule, so its docstring should say "one case,
  regression pin"; MINOR: a refused program's pinned PDF page would now stage, none today, City College of San
  Francisco 31602, 36964 and 42318 the nearest). The paid read dispatched on a sibling, `claude/s748-readers-coast`
  (`b2687880`; only 43057, sources_from 46008933093, about $0.15).
- 07:20Z: `keys` stop 2 (`b879a3b8`): plan s748k1 (College of the Canyons 38686, 44273, 45610, `no_hours_read`, the
  named-gaps wave pass; recall 1,695 right, 0 wrong). The census's gap ranks Sierra 99, Skyline 93, Allan Hancock 87,
  Mt. San Antonio 83, Marin 71, Golden West 66, Ohlone 65, Cañada 64, mostly no closed list or page not found; 54
  relisted programs sit in college-named gap files (a census change, no write); only three programs are found and not
  extracted (San Bernardino Valley 31858, College of the Canyons 37868, San Jose City 22225, about $0.23 together).
  Split change: `keys` takes Cosumnes River, Alameda, Berkeley City and Lassen for general education unit steps
  (existing kinds, 28 programs), and College of the Canyons.
- 07:21Z: San Bernardino Valley's reconcile 46118801512 green; the conductor's live read (07:21:35Z): 221 rows, none
  checked. A small Fable worker ran keep-better: re-read 5, kept 04894 alone (27-37 against the printed 27-37),
  restored 4 (`2d4dcc03`).
- 07:26Z: s748k1's reader (Sonnet): APPLY (the real SQL on a scratch Postgres; MAJOR for the follow-up: the plan's test
  stays green when a guard is removed; MINOR: 45610 may fit `section_cut_off` better). Clean md5 pre-read 3 of 3. The
  apply pushed on `claude/s748-apply` (`c368dd0e`), migrate 46121263022.
- 07:28Z: San Bernardino Valley's reread, force 46118801512, dispatched on `claude/s748-keys-sbvc`. Coastline's paid
  read 46119872022 green at 07:10Z; 43057 has no live row (live read 07:27:28Z, 141 rows, none checked); a small Fable
  worker runs keep-better before any load.
- 07:31Z: s748k1's migrate 46121263022 green; College of the Canyons 38686, 44273 and 45610 live with `no_hours_read`.
  San Bernardino Valley's reread green: 04894 live at 46118801512, arithmetic equal; the four restored records unmoved.
- 07:33Z: Coastline's keep-better (a small Fable worker, `54d8eddf`): 43057 passes on its own pinned page (9 of 9
  placed, major 18 and degree 60 equal), the read cost $0.06; its load dispatched and live at 46119872022.
  Records collected: 8.
- 07:35Z: `readers` stop 2 (`e056d2bd`): plan s748r1 (El Camino 19857, `total_differs`: free page read 46119948370
  prints 27 under "Required Core: 30 units", then 6, under "Total Units: 36"). Reedley 30465 waits on a reader change
  (its own page found, a pin fails rule A; for a person: 20762 is filed passing from that page). Los Angeles Pierce
  19181 and Grossmont 21402 are already college-named gaps. Ventura's seven and Norco's 12 were collected in S741.
  Split change: `readers` takes Sierra and Skyline; a fourth Fable worker, `gaps`, takes Allan Hancock and Mt. San
  Antonio (the census's largest gaps outside the lanes).
- 07:36Z: `keys` stop 3 (`344d4d2c`): general education unit steps of existing kinds at Lassen (reaches 5, fail to pass
  5, pass to fail 0 over 64 records) and College of Alameda (reaches 1 over 59), to a Sonnet second reader. Berkeley
  City's five and three of Cosumnes River's are the overlap the statewide rule holds by design. Three paid reads
  dispatched on siblings off `main` (`claude/s748-paid-sbvc`, `-coc`, `-sjcc`): San Bernardino Valley 31858, College
  of the Canyons 37868, San Jose City 22225, about $0.23 together.
- 07:37Z: s748r1's reader (Sonnet): APPLY (the record is the certificate's own page, poid 3524; MINOR: the S740 test's
  edit should tie to `total_differs_list()`). Clean md5 pre-read 1 of 1. The apply pushed on `claude/s748-apply`.
- 07:39Z: s748r1's migrate 46122086358 green (El Camino 19857). Records collected: 9.
- 07:41Z: `piles` stop 2 (`4c08ad7c`): plan s748b (Orange Coast 03993 `figure_within_variable_units`, East Los Angeles
  41231 `total_differs`) to a Sonnet plan reader; a new reconcile kind, `list_minimum_units`, for East Los Angeles
  31017 (recall over 136 records: 31017 alone) to a Fable 5.2 second reader. Orange Coast's paid read (only 08663 and
  08626, force 08626, sources_from 45999669017, about $0.15) dispatched on `claude/s748-piles-oc` (`dbfa9e08`).
  `piles`' finding: 33 records statewide fail coverage on a course their own page omits, and 21 would pass; `piles`
  writes it as a named gap for its seven colleges. 16 discontinued flags, none new; units rules move none.
- 07:46Z: Lassen's and Alameda's second reader (Sonnet): GO each (34 is the catalog's printed figure, PDF page 72; MAJOR
  for `keys` before the land: the S731 Saddleback test fails on San Bernardino Valley's `block_sum`; two MINOR test
  pins). The free reconciles dispatched on `claude/s748-keys-lassen` and `-alameda` (`344d4d2c`).
- 07:48Z: the conductor's live read at six colleges (07:47:48Z, no checked row at any; counts and md5 checked) to a
  Fable worker, `post`, which runs keep-better on the three filed paid reads (San Bernardino Valley 46121983588, San
  Jose City 46121988906, Orange Coast 46122364368) and on Lassen's, Alameda's and College of the Canyons' runs as they
  file.
- 07:51Z: s748b's reader (Sonnet): APPLY (the real SQL on a scratch Postgres; each older-test edit is keyed to its own
  rows; part of the mutation check unfinished on a slow machine). Clean md5 pre-read 2 of 2. Migrate 46123111643 green
  at 07:54Z: Orange Coast 03993 and East Los Angeles 41231. Records collected: 11.
- 07:57Z: the `list_minimum_units` second reader (Fable 5.2): NO GO, accepted with no second round (BLOCKING: the pass
  comes from a ceiling the catalog does not print: the page's Subtotal 20-27 gives the degree 54-61 around the printed
  60; the step's exactly-3 passes only because its trial-score gate picks the reading the scorer likes). `piles`
  removes the kind; East Los Angeles 31017 stays held.
- 07:59Z: `gaps` report (`claude/s748-gaps`, `624e286a`): Allan Hancock 87 = no closed list 47, page not found 23,
  unequal 14, incomplete 1, places none 2; Mt. San Antonio 83 = no closed list 41, page not found 28, unequal 13,
  incomplete 1. Plan s748g1 (Allan Hancock 7, Mt. San Antonio 2; 22 held with reasons) to a Sonnet plan reader. A free
  Mt. San Antonio reconcile after the apply may pass eight more.
- 08:01Z: `readers` stop 3 (`aeeb33d2`): Sierra 99 = no closed list 65, no page 20, unequal 7, incomplete 3, coverage 2,
  places none 2; Skyline 93 = no closed list 86, no page 5, places none 1, incomplete 1. Plan s748r2 (Sierra 33639,
  33646, 36718, 39209) to a Sonnet plan reader. Sierra 21525 waits on keep-better and a free reread. **The night's
  largest lever:** the capture's lookup finds the own page of a program with no closed list and nothing files it as
  the source (S652's slice B, never built): 194 programs at 14 colleges, about $14 on the estimator, Skyline's 55 about
  $3.90. `readers` builds it on `claude/s748-readers-found`, off by default, for a Fable second reader.
- 08:07Z: s748g1's reader (Sonnet): APPLY (the real SQL on a scratch Postgres; `kb/collection_lane.py`'s S681 entry for
  Allan Hancock is a lane assignment no session lifted, not a person's hold; MINOR: Allan Hancock 19928's gap may come
  from the reading, HUSV 120 and 170 "may be alternatives", for a person to compare). Clean md5 pre-read 9 of 9.
  Migrate 46124310448 green at 08:08Z; all nine carry their gap live. Records collected: 20.
- 08:09Z: s748r2's reader (Sonnet): APPLY (each kind read from the record's own notes; MINOR: 33639's words ask a reviewer
  to confirm the degree total of 60). Clean md5 pre-read 4 of 4. The apply pushed on `claude/s748-apply`.
- 08:11Z: `keys` stop 4, its last (`da2cc599`): Cosumnes River's local pattern found (PDF pages 84 to 86, seven area
  minimums, 24 in all); a `set` step drafted on `claude/s748-keys-crc` (`6a4fe94a`; reaches 04600, 12792, 45317),
  parked because `tests/program_requirements_reconcile_test.py` pins Cosumnes River free of a `ge_units` set step. The
  census reads college-named gap files (`50bedbf7`: 3,927 becomes 3,849, 78 college-named) and Lassen's guard
  `only_cal_getc` (`b79945f3`, four lines of shared code), both to a Fable 5.2 second reader. The s748k1 test now
  fails on four mutations.
- 08:14Z: s748r2's migrate green; Sierra 33639, 33646, 36718 and 39209 carry their gaps live. Records collected: 24.
- 08:16Z: `gaps`' second report (`dda6c4bf`): Mt. San Antonio's eight read unequal on record and live row while
  today's scorer passes them; a free reconcile dispatched on `claude/s748-gaps-mtsac`. No pin binds at either college
  (department headings); Allan Hancock's 27 found pages wait on the found-page reader change ($2.70).
- 08:17Z: `post`'s report: San Bernardino Valley 31858 passes (28 of 28 placed, $0.09), its load dispatched; Orange
  Coast 08626 passes and 08663 passes the live test ($0.13), the reread force 46122364368 dispatched. San Jose City
  22225 does not pass (2 of 3 placed, a generic heading; the state names two courses under one code, "RealEstateRE"):
  held for a person on `claude/s748-paid-sjcc`, no dispatch ($0.06). College of the Canyons 37868's paid read
  46121986278 failed and is not rerun unexplained. Lassen's capture differs from its recall: 18752 and 18756 pass,
  18758 and 18848 still read incomplete, 18754's window moved; `post` keeps the two that pass and restores the rest.
  `post` goes on to Sierra 21525, Alameda and Mt. San Antonio (live read 08:17:06Z, 385 rows, six checked).
- 08:22Z: `readers` stop 4, its last: the found-pages change on `claude/s748-readers-found` (`e77ff6a8`, off for every
  college; `read_found_pages` in a college's reconcile entry; recall with an oracle independent of the rule: 2,295
  tested at 17 colleges, right 1,916, wrong 0, not found 379) and Skyline's flag on `-found-skyline` (`1f7a211b`), to a
  Fable 5.2 second reader. 194 programs at 14 colleges, $19.40 on the estimator: Skyline 55, Allan Hancock 27, San
  Mateo 21, Diablo Valley 20, San Joaquin Delta 14, Gavilan 12, Glendale 12, Cabrillo 9, Coastline 7, Feather River 6,
  Napa Valley 6, Lemoore 3, Saddleback 1, West Valley 1. Open: a record with an empty closed list passes coverage at 0
  of 0.
- 08:25Z: live: San Bernardino Valley 31858 at 46121983588 and Orange Coast 08626 and 08663 at 46122364368, each with
  its arithmetic equal. Records collected: 27.
- 08:29Z: `piles` stop 3, its last (`239dc152`): `list_minimum_units` removed (`16f341f6`). Plan s748c (Orange Coast
  43100, Fullerton 18749 and 36863) with a new reading, `state_course_not_on_page`, which turns coverage true rather
  than filing a gap (4.2% of its fires wrong over 16,812 records), to a Fable 5.2 second reader. To assign, evidence
  standing: Cerritos 02235; Citrus 02333; Marin 46242; Diablo Valley 39775; Foothill 11827, 43194; Irvine Valley
  44922; Madera 39810; Palomar 08929, 22528; Porterville 33085.
- 08:33Z: `post`'s second report: Lassen 18752 and 18756 pass (degree 52 of 60, electives fill 8) and are kept alone
  (`802f9c1c`); College of Alameda 32765 passes and is kept alone (`d3c4d279`); both rereads dispatched (force
  46122727267 and 46122729926). Sierra 21525 is a tie on every step and neither record passes (18 units, no total, the
  section cut off after IT 0060): no dispatch, since a reread would rewrite twelve live records for no gain
  (`claude/s748-post-sierra`, `f26375bd`). Mt. San Antonio's reconcile 46124747415 still runs.
- 08:35Z: the found-pages second reader (Fable 5.2): **GO WITH, the paid probe held.** BLOCKING: the extract function
  answers 400 on an empty closed list (`chatbox/supabase/functions/program-requirements-extract/index.ts`, lines 480 to
  484), so the paid read cannot work as built; and a record scored against zero listed courses passes on arithmetic
  alone (966 of 974 live-passing records rescored against an empty list still pass; a wrong program's page passes
  equally), so `score()` must set coverage false with a named gap at zero listed. MAJOR: the recall's "wrong 0" is
  structural; the honest figure is 1 wrong in 1,969 found (San Bernardino Valley 22830's page holds two other
  certificates); the opt-in is a hand-edited name set (Glendale: 8 of 165 right). Flag off: 0 differences at 118
  colleges. Round 2 is the next run's. The free Skyline capture dispatched on `claude/s748-readers-found-skyline`
  (`1f7a211b`), as the reader allowed, so the next run has its sources.
- 08:44Z: the census and `only_cal_getc` second reader (Fable 5.2): the census change **FIX THEN LAND, left out of
  tonight's land** (BLOCKING: none of its 78 has a live row or `checks.gaps`: 68 place none of their listed courses, 2
  are extraction errors, 8 have no record; the Commons would read "Passing now" 16,355 as 16,433); `only_cal_getc`
  LAND (0 differences over 37,940 reconciles at 118 colleges).
- 08:47Z: live: Lassen 18752 and 18756 at 46122727267 and College of Alameda 32765 at 46122729926, each equal.
  Records collected: 30.
- 08:50Z: s748c's second reader (Fable 5.2): FIX THEN APPLY, the fix being test pins alone (passing with no gap is honest
  here: 2,658 of 16,913 passing records already pass with a listed course unplaced; the reading is used only in this
  plan; `list_minimum_units` is cleanly gone). Clean md5 pre-read 3 of 3. The apply pushed on `claude/s748-apply`; the
  test pins go into the land.
- 08:54Z: s748c's migrate 46127704066 green; Orange Coast 43100 and Fullerton 18749 and 36863 read coverage true live.
  Records collected: 33. A Fable worker, `land`, builds `claude/s748-land`.
- 09:03Z: Mt. San Antonio's reconcile 46124747415 filed on `claude/s748-gaps-mtsac` (`c43676dc`).
- 10:38Z: `land`'s report: **#3945** ready at `0add7c1e`, `test` green (run 46134498846); 69 test files, 5,513 checks;
  the merged state broke 12 test files, each fixed as a named either-state edit; one plan-code change (`on_live_run()`
  in `kb/_program_piles_s727_canyons.py`, Canyons 43388 alone). The census change, the found-pages branches, Cosumnes
  River's step and Sierra 21525 are left out. The land worker's own edits go to a Sonnet second reader before the merge.
- 10:41Z: Mt. San Antonio's live rows re-measured (10:40:38Z: 385 rows, the 08:17Z md5, the same six checked); `post` runs
  keep-better on its reconcile.
- 10:44Z: `post`: Mt. San Antonio's keep-better kept exactly the expected eight (02990, 08045, 16544, 30762, 36697,
  39709, 39710, 44689), restored 323, the six checked rows untouched (`f546e406`); the reread, force 46124747415,
  dispatched and live, each equal. Records collected: 41.
- 10:47Z: the land's second reader (Sonnet): MERGE (no either-state edit weakens a guard; `on_live_run()`'s change sits
  in the `FROM_HELD` branch, 43388 alone, and writes nothing; San Bernardino Valley's 222 records and 189 passing
  recount; `.apply` and the census file equal `main`'s). #3945's thread is empty, `test` green on `0add7c1e`, `main`
  unmoved since its base.
- 10:48Z: **#3945 merged (`cd464091`, confirmed on `origin/main`).** `post` builds the second land,
  `claude/s748-land-mtsac`, for Mt. San Antonio's eight.

## What shipped

In all: **41 records collected and live**, no outline rows, paid reads about $0.34 on their receipts (Coastline $0.06,
San Bernardino Valley $0.09, San Jose City $0.06, Orange Coast $0.13; College of the Canyons' read failed; page reads
and reconciles free). A **full checkpoint** (data receipts were written and the harvest lane moved). The census at the
start is in *The start* above. The closing census: (run id and counts: the conductor fills in).

**Merged.**
- **#3945, the land** (`claude/s748-land`, merged `cd464091`, 10:48Z, confirmed on `origin/main`): 33 records' plans,
  receipts and reads, Coastline's staging fix, the reconcile steps at San Bernardino Valley, Lassen and College of
  Alameda, Lassen's guard `only_cal_getc`, the plan modules `kb/_program_piles_s748*.py`. `test` green on `0add7c1e`
  (run 46134498846); a Sonnet second reader said MERGE.
- **The second land, Mt. San Antonio's eight** (`claude/s748-land-mtsac`, built by `post`): (PR number and merge sha:
  the conductor fills in).

**Live (each applied, reread or loaded).**
- By guarded plans, 24. Named gaps, 21: s748a Butte 14583, Santa Barbara City 43553; s748k1 College of the Canyons
  38686, 44273, 45610; s748r1 El Camino 19857; s748b Orange Coast 03993, East Los Angeles 41231; s748g1 Allan Hancock 7
  and Mt. San Antonio 2; s748r2 Sierra 33639, 33646, 36718, 39209. Coverage read true, 3: s748c Orange Coast 43100,
  Fullerton 18749 and 36863 (the reading `state_course_not_on_page`).
- By rereads and loads, 17, each with its arithmetic equal: Cuyamaca 18637; San Bernardino Valley 04894 and 31858;
  Coastline 43057; Orange Coast 08626 and 08663; Lassen 18752 and 18756; College of Alameda 32765; Mt. San Antonio
  02990, 08045, 16544, 30762, 36697, 39709, 39710 and 44689.
- The log's running count proves the split: 3, 8, 9, 11, 20, 24, 27, 30, 33, 41.
- Left out of the land, each on its branch (the Ledger): the census change, the found-pages change, Cosumnes River's
  `set` step, Sierra 21525, San Jose City 22225.

## Read in order

1. This file's *Open work*, then `docs/reference/lanes/program-requirements-harvest.md`, *S748's posts* and *NEXT*.
2. `docs/program_requirements_harvest_lessons.md`, *S748* (the refusals, the lessons, the readers' MAJORs and MINORs).
3. `docs/reference/conductor_mode.md`, *Back for collection only*, and COBIx's newest brief on #3358.

## Open work, from the lanes' NEXT lines

1. **`program-requirements-harvest`** (the routine's), by the lane's NEXT:
   - NEXT (2): a display build carrying S748's 41 records, gate college Glendale, then `harvest-gap-census.yml` on
     `main`.
   - NEXT (3): **the found-pages change, round 2**, the largest lever found (`claude/s748-readers-found` `e77ff6a8`;
     Skyline's flag on `claude/s748-readers-found-skyline`, which holds tonight's free capture). The extract function
     must accept an empty closed list (`chatbox/supabase/functions/program-requirements-extract/index.ts`, lines 480 to
     484); `score()` must set coverage false with a named gap at zero listed courses; the opt-in must be tied to a
     per-college open-setting recall. Then a one-program paid probe (Skyline 05809), then 194 programs at 14 colleges
     for about $19 (the list: the log at 08:22Z).
   - NEXT (4): the census reading college-named gap files (`claude/s748-keys` `50bedbf7`, reverted in the land), fixed
     per its reader: keep the 78 in the gap under their own cause; apply only when no live row exists; pin `main()`'s
     hand-in.
   - NEXT (5): Cosumnes River's `set` step (`claude/s748-keys-crc`, `6a4fe94a`; a test pins the college free of it).
   - NEXT (6): the 11 coverage-omits records to assign under `state_course_not_on_page`: Cerritos 02235; Citrus 02333;
     Marin 46242; Diablo Valley 39775; Foothill 11827, 43194; Irvine Valley 44922; Madera 39810; Palomar 08929, 22528;
     Porterville 33085.
   - NEXT (7): College of the Canyons 37868's failed paid read 46121986278: read its log before any rerun.
   - NEXT (8): reader changes: Reedley 30465, Los Angeles Pierce 19181, Grossmont 21402, Mt. San Antonio 43777 and
     43999 (department headings), Sierra's `or_units` step (40181, 31922, 31923).
   - NEXT (9): the follow-up's minors, old and new (tonight's: the s748k1 and s748b test mutation gaps the readers
     named, 45610's kind, the uncommitted page-read outputs; lessons, *S748*, *Readers' MAJORs and MINORs*).
   - NEXT (10) and (11): the holds S748 did not reach and the older queue. Step 11: the outline queue is empty until a
     census, a capture or a verdict row changes (NEXT (1)).
   - **For a person:** San Jose City 22225 (held for a person; "RealEstateRE" names two courses); Allan Hancock 19928
     (HUSV 120 and 170 may be alternatives); Sierra 33639 (confirm the degree total 60); Reedley 20762 (filed passing
     from 30465's page); East Los Angeles 31017 (54-61 around 60); Sierra 21525 (a tie; neither passes).
2. **`common-subjects-reference`** (a plain session's; conductor runs stay on collection): its NEXT (S744) in the
   lane, with `commons`, which Sam's plain sessions hold (handoff 748). None was worked in this run.
3. **A plain session's, each by its lane's NEXT:** `implementation-funding` (27,661 bytes against 20,000: compact
   first); `cer-procedures` (21,633: compact first); the rest as handoff 748 lists them.

## Blocks (Sam's ruling 1: listed here until the Commons' Needs you shows them)

Handoff 743's table stands in every row this run did not clear; the rows below changed.

| Block | Who clears it | Since |
|---|---|---|
| The found-pages change, round 2 (`claude/s748-readers-found`, `e77ff6a8`): the extract function, `score()` at zero listed, the opt-in | Sky, a Fable second reader, then the paid probe | 2026-11-28 (S748) |
| The census reading college-named gap files (`50bedbf7`, reverted in the land) | Sky, the fix its reader named | 2026-11-28 (S748) |
| Cosumnes River's `set` step (`claude/s748-keys-crc`, `6a4fe94a`): a test pins the college free of it | Sky, with a second reader | 2026-11-28 (S748) |
| College of the Canyons 37868: paid read 46121986278 failed, unexplained | Sky, its log first | 2026-11-28 (S748) |
| The 11 coverage-omits records to assign (`state_course_not_on_page`) | Sky, a guarded plan | 2026-11-28 (S748) |
| Reedley 30465; Los Angeles Pierce 19181; Grossmont 21402; Mt. San Antonio 43777, 43999; Sierra 40181, 31922, 31923 | Sky, reader changes with second readers | 2026-11-27 (S742) to 2026-11-28 (S748) |
| San Jose City 22225; Allan Hancock 19928; Sierra 33639; Reedley 20762; East Los Angeles 31017; Sierra 21525 | a person | 2026-11-28 (S748) |
| San Jose City 18449; San Diego City 22352, 38732; Solano 43134 (a person's); Santa Monica 43767 (a person compares) | Sky, shared code; Solano and Santa Monica a person | 2026-11-26 (S740) to 2026-11-27 (S742) |
| The follow-up's minors from S748's readers (lessons *S748*, *Readers' MAJORs and MINORs*) | Sky, the follow-up | 2026-11-28 (S748) |

Cleared tonight: Cuyamaca 18637; Coastline 43057 and its staging fix; Orange Coast 08663 and 08626; the gap plans Butte
14583 and Santa Barbara City 43553; San Bernardino Valley 04894; El Camino 19857; Orange Coast 03993 and 43100; East Los
Angeles 41231; Fullerton 18749 and 36863. Found already collected (S741): Santa Ana 31859 and 21789; Copper Mountain
43854, 14737 and 20094; San Diego City 22367; Ventura's seven; Norco's 12.

## For Sam

Nothing waits on Sam ([Open Asks Sheet 200](https://claude.ai/artifact/5ShC7pGgNuz9bJUhkdsc8Y), current). Every call
tonight was the conductor's, recorded below and reversible. Six records wait on a person's look (the Blocks table).

## Decisions Sam made

None tonight. Sam's words in this session: none. The run acted on his routine prompt of 2026-11-17, his
collect-with-gaps ruling of the same day (`sam-collect-with-gaps-2026-11-17`), his work order of 2026-11-20 and his
cost rules of 2026-11-25.

## Decisions (the conductor's, each reversible)

- `d-no-display-build-at-start-s748`: no display build at the start; S746's build `229a759101f7` was current.
- `d-list-minimum-units-refused-s748`: the new reconcile kind got a NO GO, accepted with no second round, and was
  removed; East Los Angeles 31017 stays held.
- `d-census-change-left-out-s748`: the census reading college-named gap files stays out of the land (FIX THEN LAND).
- `d-found-pages-probe-held-s748`: the paid probe is held until round 2; the free Skyline capture ran.
- `d-sierra-21525-not-reread-s748`: a tie; a reread would rewrite twelve live records for no gain.
- `d-canyons-37868-not-rerun-s748`: the failed paid read is not rerun unexplained.
- `d-hancock-s681-entry-is-lane-assignment-s748`: `kb/collection_lane.py`'s S681 Allan Hancock entry is a lane
  assignment, so s748g1 applied.

Memory rows: `kb/migrations/2026-11-28_s748_cpl_memory_rows.sql` (13 rows, all proposed, INSERT-only with
`ON CONFLICT DO NOTHING`, rollback in its header), drafted by the checkpoint-docs worker, applied by the conductor.

## Patterns that worked

- **Plan, second reader, clean md5 pre-read, one apply, `.apply` restored**, seven times (`claude/s748-apply`); a
  Sonnet reader for plans, a Fable 5.2 reader for shared reader code, and no second round on a NO GO.
- **Rank the census's gap by college** and send workers to the largest (Sierra, Skyline, Allan Hancock, Mt. San
  Antonio): the brief's named lists were largely collected already (`f-yield-from-census-gaps-s748`).
- **A sibling branch for each read** (`-keys-sbvc`, `-keys-lassen`, `-keys-alameda`, `-readers-coast`, `-piles-oc`,
  `-paid-*`, `-gaps-mtsac`), and a small worker, `post`, for keep-better on each filed run.
- **Keep-better from the conductor's live read before every reread**, re-measured when a reconcile files hours later
  (Mt. San Antonio: the 08:17Z md5 held at 10:40Z).
- **A land worker and a second reader on the land worker's own edits** before the merge.

## Findings

- `p-recall-oracle-restates-rule-s748`: twice a recall's oracle restated its rule and twice a test stayed green with a
  guard removed; every brief now asks for an independent oracle and a test that turns red on each guard's removal.
- `f-yield-from-census-gaps-s748`: the yield came from the census's largest gaps, not the brief's named lists.
- `o-found-pages-194-programs-s748`: 194 programs at 14 colleges have a found own page and no closed list.
- `p-worker-handback-repeats-s748`: a worker that leaves background jobs running hands back again; brief readers to
  report once.
- `f-harness-pins-worker-to-worktree-s748`: the harness pins a worker to its own worktree.

## Safety patterns to honor

All of handoff 743's. New tonight: a recall's oracle is independent of the rule it tests; a plan's test turns red when
any guard is removed; a record scored against zero listed courses must never pass on arithmetic alone; a paid read
that failed is not rerun before its log is read; live rows are re-measured before keep-better when a run files late.
Never file a person's name from an outline page anywhere. A permission-check refusal is never routed around.

## Conductor settings

A conductor run for collection only, under Sam's routine prompt of 2026-11-17 (`docs/reference/conductor_mode.md`,
*Back for collection only*; review rounds as his ruling of 2026-11-20 sets them). Settings block (Sam, 2026-11-11, his
latest change; the block copied from `docs/reference/conductor_mode.md`):

- Conductor model: Fable 5.2 (`claude-fable-5-2`), working with COBIx; the routine's form sets the model and ultracode;
  medium effort lives in its prompt. Tonight Fable 5.2 served the conductor, as the form names.
- Ultracode on. The conductor at medium effort.
- Workers on Opus 5.5 (named in each Agent call, `model: opus`); tonight no Opus worker ran: `keys`, `readers`,
  `piles`, `gaps`, `post`, `sbvc`, `coast` and `land` ran Fable 5.2 at high effort, the eight plan readers ran Sonnet,
  the five shared-code readers ran Fable 5.2, and pr-gate was not used (the conductor read #3945 itself).
- A worker building anything that writes shared data or changes an apply runs at **high** effort.
- A review workflow uses **at most 9 agents in all**, readers and second readers together.
- **Cost limits:** $40 per college per run, on the estimate, for program-requirements extraction, and a separate $40 per
  college for SLOs, PLOs and course objectives; per run, never a remaining pot. Paid runs go through the conductor.

Also: two lanes, never on one college; about $750 a day for everything, $10k running total for the whole job; stop rules
from the brief: a day over $300 with fewer than 40 new programs; over $12 per new program or $0.50 per outline row; a
rollback that undoes over 1% of a day's rows; the $10k checkpoint. This run aimed at about $250, with no new worker after
about $190.

## Ledger

| PR or branch | State | Next |
|---|---|---|
| #3940 (`claude/nice-maxwell-ykve9f`) | the declaration, the log and this checkpoint (draft, docs only) | merges at sign-off, after the lands and one update from `main` |
| #3945 (`claude/s748-land`) | merged `cd464091` (10:48Z); the branch is gone | none |
| `claude/s748-land-mtsac` | the second land, Mt. San Antonio's eight, built by `post` | (PR number and merge sha: the conductor fills in) |
| `claude/s748-apply` (`686e6b94`) | s748a, s748k1, s748r1, s748b, s748g1, s748r2 and s748c applied; `.apply` restored | none; in the land |
| `claude/s748-keys` (`da2cc599`) | in the land, less the census change `50bedbf7` (reverted there) | NEXT (4): the census fix |
| `claude/s748-keys-sbvc`, `-keys-lassen`, `-keys-alameda` | reconciles and rereads live (04894; 18752, 18756; 32765) | none; in the land |
| `claude/s748-keys-crc` (`6a4fe94a`) | Cosumnes River's `set` step, parked | NEXT (5) |
| `claude/s748-readers` (`aeeb33d2`), `-readers-cuy2`, `-readers-stagepin` (`b2687880`), `-readers-coast` | Cuyamaca 18637, the staging fix and Coastline 43057 live | none; in the land |
| `claude/s748-readers-found` (`e77ff6a8`) | the found-pages change, off for every college; GO WITH, the probe held | NEXT (3): round 2 |
| `claude/s748-readers-found-skyline` (`b3c087f8`) | Skyline's flag (`1f7a211b`) and tonight's free capture | NEXT (3): the probe's sources |
| `claude/s748-piles` (`239dc152`), `-piles-oc` | s748a, s748b, s748c and Orange Coast's read live; `list_minimum_units` removed | none; in the land |
| `claude/s748-gaps` (`dda6c4bf`) | s748g1 applied | none; in the land |
| `claude/s748-gaps-mtsac` (`d3bd1163`) | Mt. San Antonio's reconcile 46124747415, keep-better's eight, the reread live | the second land |
| `claude/s748-paid-sbvc` | San Bernardino Valley 31858 loaded and live | none; in the land |
| `claude/s748-paid-sjcc` (`6bad0e1a`) | San Jose City 22225 held for a person, no dispatch | a person's look |
| `claude/s748-paid-coc` (`2975e3fd`) | College of the Canyons 37868's paid read 46121986278 failed | NEXT (7): its log first |
| `claude/s748-post-sierra` (`f26375bd`) | Sierra 21525, a tie, no dispatch | a person's look |
| `claude/s742-readers-cuy2`, `claude/s742-readers-stagepin` | superseded by their `s748` copies, in the land | none |
| Harvest gap census on `main` | 46089216929 (00:44Z): 15,680 pass; the closing run: (run id and counts: the conductor fills in) | the next run's first read, after the display build |
| #3937, #3926, #3917 | COBIx's (subject titles; two superseded) | Sam's or COBIx's |
| #3383 | dependabot's | waits |

## Let go

The conductor holds no PR subscription, check-in or artifact watch: it opened no `subscribe_pr_activity` subscription
on #3940 or #3945, no COBIx watcher (stopped by Sam, `d-cobix-watcher-stopped-on-sam-word-s714`) and no scheduled wake,
so none is to drop. Workers end with the session; each branch is pushed. The vault note for this run: (the conductor
fills in its path and PR).

Spend: not available; 2026-11-28T06:12Z to (the conductor fills in the figure, its tags and the end time).

Opening line: *Greetings, you are SkySandpiper (the next free session number at your start; the routine takes it), see SkyStilt's (S748) handoff — `docs/session_749_handoff.md` — let's keep rolling with our queue.*

(Last line: the conductor fills in: conductor model, session cost, records collected, outline rows, substantive PRs merged.)
