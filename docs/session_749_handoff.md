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
handoff his plain sessions write (747, S746 SkyPetrel's, naming SkyShearwater for Session 747, which is live tonight and
writes 748), never this file.
**Numbering.** Handoff 743 (S742 SkyGodwit) named SkyStilt for the routine's next session, to take the next free number.
747 is Sam's plain session in flight, so this run is S748 and writes 749.

*(Declaration, written at 06:17Z before any worker started.)*

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
