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
