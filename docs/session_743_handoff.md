---
title: "Session 743 handoff (from SkyGodwit, S742, the CPL Queue routine's collection run of 2026-11-27, from 12:12Z)"
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
**Numbering.** S741 (SkyWillet) wrote 742 and named SkyGodwit for the routine's next session, to take the next free
number: this run is S742 and writes 743. 739 stays SkyTurnstone's (Sam's next plain session).

*(Declaration, written at 12:21Z before any worker started.)*

## The start (12:12Z firing, 2026-11-27)

- Brief: COBIx's on #3358 (comment 6894464154, Thu Nov 26, written 6:50 PM PT, `main` at `b896d6f4`), the same brief
  S741 worked from; the newest other comment is still 7064588752 (Sam's two rulings of 2026-11-21). Handoff 742 (S741)
  is the newest; its checkpoint #3897 merged at 11:45Z (`ee42134e`). On `main` since: the closing census 45986575262
  (`c9c7cb0c`, 11:03Z) and #3897.
- One writer: no `list_sessions`, `get_trigger` or `get_session` here. Open PRs at 12:16Z: dependabot's #3383 alone.
- Step 0: not the night's first firing (S741 dispatched `daily-dashboard.yml` at 06:15Z).
- No pause line (handoffs 742 and 741). Three repos attached. `check_hooks_live.py`: ROOT LIVE (guards on Bash and
  `execute_sql`, 34 allow rules, the context meter). No `set_session_tags` here.
- Sheet 200: no reply since 2026-11-19T23:47Z. `queue_todo_done` since 2026-11-26: none. Rule 8's memory read: no row
  since S741's nine. Steps 6 to 10: held in a conductor run, as S727 to S741 held them (two Library requests wait).
  Step 11: the outline queue is empty until a census, a capture or a verdict row changes.
- Census on `main` (45986575262, 11:03Z): of 20,282 active programs, 15,669 pass and 3,950 have no passing record; 663
  are collected with a named gap.
- **Spend aim:** about $250 for this run, no new worker after about $190. The UTC day holds S741's $255, so the day stays
  under about $750 with room for Sam's plain session.

## The college split (written before any worker started)

Two lanes, never on one college at the same time, one writer per college (`d-lane-names-only-colleges-in-flight-s681`).

- **Lane 1 (collection):**
  - `display` (the conductor), first, while no apply is in flight: one display build carrying S741's records on
    `claude/s742-display`, built on `ee42134e` with Python 3.12, gate college Glendale, then the whole build, then
    `harvest-gap-census.yml` on `main`.
  - `keys` (Fable 5.2, high effort): Cosumnes River first (`claude/s741-keys-crc`, `49e6c644`: either-state edits to
    the two S739 tests, then the reread force 45972311864 for 33542); then the holds by key, each collected with its gap
    named where the gap is true: San Bernardino Valley 17829 (the S741 keep-better ranking may admit its reconcile),
    04873, 04894, 39483; San Jose City 18449, 38499; Cuesta 43053, 41744 (`pair_read_as_alternatives` for AVMT 110 and
    120); San Diego City 38732, 22352. Colleges: Cosumnes River, San Bernardino Valley, San Jose City, Cuesta, San Diego
    City.
  - `readers` (Fable 5.2, high effort): Cuyamaca 18637 (a Fable second reader of `claude/s741-keys-wordtest`,
    `302c12c5`, then a paid read `only=18637`); then the reader and scorer changes, each with a self-recall and a second
    reader before any dispatch on it: El Camino 19861, 19866, 38948, 43993 and 19883's `site_pages` pin (the Acalog road
    never reads `site_pages`), with 19857; Coastline 43057 (the title rule binds legacy 33014); Modesto 35127; Reedley
    30465 (rule A); Los Angeles Pierce 19181 (number runs); Grossmont 21402. Colleges: Cuyamaca, El Camino, Coastline,
    Modesto, Reedley, Los Angeles Pierce, Grossmont.
- **Lane 2 (cheap piles, one worker, high effort):** `piles` (Fable 5.2): the pins awaiting a free capture (Butte 14583,
  Orange Coast 08663 and 08626); S740's remaining holds by key, each collected with its gap named where the gap is true
  (Long Beach City 37213; Butte 01312; Santa Monica 21026, 43767; Gavilan 08464, 45357; Cabrillo 11293, 45306, 06352,
  06380, 06381, 44992; Contra Costa 33660; Los Angeles Trade-Technical 31280, 45285; Santa Barbara City 30746, 43553,
  32775; Fullerton 33680, 42143); East Los Angeles 02456, 35088, 35888, 37510 (keep-better said no dispatch in S741);
  then S720's and S721's rest (Fullerton 7, City College of San Francisco 9, College of the Sequoias 2, East Los Angeles
  6, Butte's and Orange Coast's others); discontinued flags, units rules and retired courses over its colleges. At its
  land, the Spend line's builders and the Commons page counts are rebuilt. Colleges: Butte, Orange Coast, Long Beach
  City, Santa Monica, Gavilan, Cabrillo, Contra Costa, Los Angeles Trade-Technical, Santa Barbara City, Fullerton, East
  Los Angeles, City College of San Francisco, College of the Sequoias.
- **Not tonight:** Porterville (the follow-up's 06773 guard first); Saddleback (its `repeat` window first); West Valley
  35588, Southwestern and Pasadena City (reader changes); Antelope Valley and Mission (the eLumen follow-up's rest);
  College of the Desert (robots.txt); Los Medanos (parked); Solano 43134 (a person's); Glendale 44488 (the college's
  call) and 45068; City College of San Francisco's Cal-GETC dry run (a plain session's); the follow-up PR, after the
  waves if the run has room.

## Split changes during the run

- 12:16Z: one writer confirmed (open PRs: #3383 alone; `main` unmoved since #3897).
