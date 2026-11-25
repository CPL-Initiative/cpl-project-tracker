---
title: "Session 731 handoff (from SkyFrigatebird, S730, the CPL Queue routine's collection run of 2026-11-25, from 10:55Z)"
created: 2026-11-25
updated: 2026-11-25
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

**Routing, both ways.** A CPL Queue routine firing follows this file. A plain session Sam opens follows the newest
handoff his plain sessions write (730, S729 SkyCurlew's, merged in #3819), never this file. **Numbering.** Handoff 730
names SkyDunlin for Sam's next plain session and tells it to take the next free number when it starts; no session has
started under 730, so this run takes S730, the next free number, and writes 731, one above the highest on `main`
(`d-routine-takes-next-free-number-s713`, as S720 did). Sam's next plain session takes the next free number, S731 or
above, and writes the handoff one above the highest on `main`.

# You are [[S730 FILL: next moniker]], the routine's next session

From SkyFrigatebird (S730), the CPL Queue routine's 10:12Z firing of 2026-11-25, a conductor run for collection only
under Sam's routine prompt of 2026-11-17 and the COBIx brief on #3358 (Tue Nov 24, written 6:45 PM PT). Handoff 728
named SkyFrigatebird for the routine's next session, and no plain session holds the name.

[[S730 FILL: checkpoint kind and skipped steps]]

## The start (10:12Z firing, 2026-11-25)

- 10:14Z: S727 (SkyTropicbird) was live: its checkpoint #3807 took a push at 10:11:38Z while Butte's #3821 waited on
  `test`, so the firing ended in one line. Sam, about 10:55Z, in this session: *"You should be clear to go"*. #3807
  merged at 10:51:45Z (`56c21b96`), and the run took the queue then.
- Step 0: not the night's first firing; S727 dispatched the day's `daily-dashboard.yml` (45559142493) at 06:14Z.
- One writer: no `list_sessions` or `get_trigger` here. Open PRs at 10:57Z: dependabot's #3383 alone. `main` at
  `56c21b96` (#3807, handoff 728).
- No pause line (handoffs 728 and 730). Three repos attached. `check_hooks_live.py`: ROOT LIVE (guards on Bash and
  `execute_sql`, 34 allow rules, the context meter). Context at start 18.7% of 786,077.
- Sheet 200: no reply since 2026-11-19T23:47Z. `queue_todo_done` since 2026-11-25: none. Rule 8's memory read: no row
  since S727's 22 (09:47Z). Steps 6 to 10: held in a conductor run, as S727 held them. Step 11: the outline queue is
  empty until a census changes.
- Census on `main` (45586922147, 09:39Z, `3f04de68`): of 20,282 active programs, 15,551 pass and 4,227 have no passing
  record; 504 are collected with a named gap.
- **Spend aim:** about $200 for this run. S727 spent about $314 earlier on this UTC day, and Sam's plain sessions S725,
  S726 and S729 ran unmetered, so the day stays under about $750. No new worker after about $150.

## The college split (written before any worker started)

Two lanes, never on one college at the same time, one writer per college (`d-lane-names-only-colleges-in-flight-s681`).

- **Lane 1 (collection):**
  - `display` (the conductor), first, while no apply is in flight: one display build carrying S727's records after
    `f4b48370bc11`, gate college Glendale, then the whole build, then `harvest-gap-census.yml` on `main`.
  - `elumen2` (Opus, high effort), the eLumen follow-up: Antelope Valley's 38 that bind their own page and were
    `held_no_gain` (a `step=reread` with `force`, only where the own-page reading passes), Redwoods 45557 and 45595,
    and Antelope Valley 43150's pin. Colleges: Antelope Valley, College of the Redwoods.
  - `lever` (Opus, high effort): West Valley 06276, 32021 and 35588 first (why its load inserted nothing; never a blind
    rerun); #3811's holds, Allan Hancock 42208, 42210 and 43770, Southwestern 32693 and 36634, Pasadena City 31599;
    then Los Angeles Southwest 4, Sacramento City 4 with its one reread, Cosumnes River 3 with 33542, Folsom Lake
    38736, Santiago Canyon 3, East Los Angeles 3 and Napa Valley 3, as spend allows. A paid read takes `only=` and at
    most $5 a college on the estimate. Colleges: West Valley, Allan Hancock, Southwestern, Pasadena City, Los Angeles
    Southwest, Sacramento City, Cosumnes River, Folsom Lake, Santiago Canyon, East Los Angeles, Napa Valley.
  - `pooled` (Opus, high effort), once a slot frees: El Camino 02513, 02515 and 02517, with El Camino's 4 from the
    census wave; Modesto Junior's 8 other s720j holds; Cuyamaca 18635; the real pools refused at Porterville 06773 and
    30235 and Cuyamaca 18634, 18636 and 18637. Colleges: El Camino, Modesto Junior, Cuyamaca, Porterville.
- **Lane 2 (cheap piles, a fresh worker per college, high effort):** the 07:13Z census's piles, Los Angeles
  Trade-Technical 17, Saddleback 17 and Long Beach City 16; then, as spend allows, S727's holds by key at American
  River 7, Shasta 15, College of the Canyons 14 and Santa Barbara City 5. Colleges: Los Angeles Trade-Technical,
  Saddleback, Long Beach City, then American River, Shasta, College of the Canyons, Santa Barbara City. Each plan gets
  a second reader, a clean md5 pre-read and the conductor's apply.
- **Not tonight:** Cosumnes River's 17 piles (lane 1 holds Cosumnes River); Orange Coast (its 17 piles and 08626 wait
  for a run with room); College of the Desert (robots.txt); Los Medanos (parked); MiraCosta 36144 and 36171 (a capture
  change); the follow-up PR, after the waves if the run has room.

## Split changes during the run

[[S730 FILL: the run's log]]

Spend: [[S730 FILL]]
