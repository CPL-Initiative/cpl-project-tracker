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

*(Declaration, written at 06:40Z before any worker started.)*

## The start (06:12Z firing, 2026-11-28)

- Brief: COBIx's on #3358 (comment 6894464154, Fri Nov 27, written 6:45 PM PT, `main` at `205e6cae`). Handoff 747
  (S746) is the newest numbered file; the routine's own is 743. On `main` since the brief: Sam's S747 merges #3933,
  #3936, #3938 and #3939 (the last at 06:05Z), a plain session, which never stands the queue down.
- One writer: no `list_sessions`, `get_trigger` or `get_session` here. Open PRs at 06:20Z: COBIx's #3937 (subject
  titles, 05:04Z), #3926 and #3917 (superseded, Sam's or COBIx's to close) and dependabot's #3383. None is a queue
  session's. Subject titles are the plain session's lane; this run leaves all four.
- Step 0: the night's first firing; no `daily-dashboard.yml` run was created on 2026-11-28 UTC, so it was dispatched on
  `main` at 06:17Z.
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

