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
