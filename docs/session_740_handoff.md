---
title: "Session 740 handoff (from SkyOystercatcher, S739, the CPL Queue routine's collection run of 2026-11-26, from 06:12Z)"
created: 2026-11-26
updated: 2026-11-26
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

**Conductor model: Opus 5.5 (claude-opus-5-5), as this run's header reports; the routine's form names Fable 5.2.
get_session is not among this run's tools, so the header is the only readout.**

**Routing, both ways.** A CPL Queue routine firing follows this file. A plain session Sam opens follows the newest
handoff his plain sessions write (738, S737 SkyWhimbrel's, naming SkyTurnstone for Session 738), never this file.
**Numbering.** Handoff 738 names SkyTurnstone for Sam's next plain session as Session 738, so this run took the next
free number, S739, and writes 740, leaving 739 to SkyTurnstone's handoff (`d-routine-takes-next-free-number-s713`,
`d-routine-leaves-plain-handoff-number-s727`). S736 (SkyBrant) may still write 737.

# DECLARATION (in progress): S739 SkyOystercatcher holds the CPL Queue

This file is the run's declaration until the checkpoint rewrites it. One writer per college, as split below.

## The start (06:12Z firing, 2026-11-26)

- Step 0: the night's first firing. No `daily-dashboard.yml` run created on 2026-11-26 UTC, so the run dispatched it
  on `main` at 06:14Z.
- One writer: no `list_sessions` or `get_trigger` here. Open PRs at 06:15Z: dependabot's #3383 alone. `main` at
  `51744a70` (the dependency map after #3878, handoff 738). S737 (SkyWhimbrel) signed off at about 05:15Z; S736
  (SkyBrant) has no open PR.
- No pause line (handoffs 732 and 738). Three repos attached. `check_hooks_live.py`: ROOT LIVE (guards on Bash and
  `execute_sql`, 34 allow rules, the context meter). Context at start 19.4% of 786,077.
- Sheet 200: no reply since 2026-11-19T23:47Z. `queue_todo_done` since 2026-11-25: none. Rule 8's memory read: no
  harvest row since S731's 19 (14:36Z); S733 to S737 filed Commons, Library and funding rows only. Steps 6 to 10:
  held in a conductor run, as S727 and S731 held them. Step 11: the outline queue is empty until a census changes.
- Census on `main` (45733846878, 01:19Z): of 20,282 active programs, 15,577 pass and 4,176 have no passing record;
  529 are collected with a named gap.
- Supabase's connector answered Bad Gateway from 06:16Z to about 06:17Z; reads went through after.
- **Spend aim:** about $350 for this run, no new worker after about $275. S736 and S737 ran unmetered earlier on
  this UTC day (01:13Z to 05:15Z), so the day stays under about $750.

## The college split (written before any worker started)

Two lanes, never on one college at the same time, one writer per college (`d-lane-names-only-colleges-in-flight-s681`).

- **Lane 1 (collection):**
  - `display` (the conductor), first, while no apply is in flight: one display build carrying S731's records, gate
    college Glendale, then the whole build, then `harvest-gap-census.yml` on `main`.
  - `lever` (Fable 5.2, high effort): Los Angeles Southwest 4; Sacramento City 4 with its one reread; Cosumnes River 3
    with 33542; Folsom Lake 38736 (pinned to p.176); Santiago Canyon 3; Coastline 7; East Los Angeles 38332 and 45540
    (a paid read, about $0.16) and its person row 33013, collected with its gap named; Napa Valley 3. Free page reads
    first; a paid read takes `only=` and at most $5 a college on the estimate. Colleges: Los Angeles Southwest,
    Sacramento City, Cosumnes River, Folsom Lake, Santiago Canyon, Coastline, East Los Angeles, Napa Valley.
  - `pooled` (Fable 5.2, high effort): El Camino 02513, 02515 and 02517 (a free reconcile) and 19861, 19866, 38948 and
    43993 (a paid read); Cuyamaca 18634 to 18637; Modesto 06683, 35127 and 42664. Colleges: El Camino, Cuyamaca,
    Modesto Junior. No Porterville reconcile before the 06773 guard.
- **Lane 2 (cheap piles, one worker at a time, high effort):** S727's holds by key at American River 7, Shasta 15,
  College of the Canyons 14 and Santa Barbara City 5; S731's at Los Angeles Trade-Technical 11, Saddleback 2 and Long
  Beach City 4; the person rows outside lane 1's colleges, each collected with its gap named and a lower score on the
  0-100 bar (Santa Monica 03281, Clovis 36326 and 39539, Los Angeles City 32832, Los Angeles Mission 44849, Glendale
  44488 after the display build, Cerritos 44984 a reload); then Orange Coast's 17 and 08626; then S720's and S721's
  holds by key as spend allows (Palo Verde 5, Gavilan 11, Ventura 17, Cabrillo 13 and the rest). Cosumnes River's 17
  join lane 2 only once `lever` leaves Cosumnes River. At its land, the Spend line's builders and the Commons page
  counts are rebuilt. Colleges: American River, Shasta, College of the Canyons, Santa Barbara City, Los Angeles
  Trade-Technical, Saddleback, Long Beach City, Santa Monica, Clovis, Los Angeles City, Los Angeles Mission, Glendale,
  Cerritos, then Orange Coast, Palo Verde, Gavilan, Ventura, Cabrillo.
- **Not tonight:** Porterville (the follow-up's guard first); Saddleback's next read (its `repeat` window fix first);
  West Valley 35588 and rule A's three (a reader change); the eLumen follow-up's rest (Antelope Valley, Mission) unless a
  slot and spend allow; College of the Desert (robots.txt); Los Medanos (parked); MiraCosta 36144 and 36171; the
  follow-up PR, after the waves if the run has room.

## Split changes during the run

- 06:19Z: the declaration, #3879. 06:22Z: `lever`, `pooled` and `piles` started on Fable 5.2 at high effort.
- 06:23Z: this clone's `origin/main` ref was stale (`56c38abf`, S719's), so the harness made each worker's worktree
  there. The conductor fetched `main` by name (`51744a70`) and told all three to start their branches at it before
  any work (`p-shared-clone-origin-main-stale-s739`).
- 06:24Z: display build `3a699eddc8c9` on `claude/s739-display` (built on `51744a70` with Python 3.12; the sandbox's
  3.12 lacked `openpyxl` until `requirements.txt` was installed). 06:25Z: the Glendale gate 45768078451 dispatched,
  beside the day's dashboard run 45766799397.
