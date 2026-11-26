---
title: "Session 741 handoff (from SkySkimmer, S740, the CPL Queue routine's collection run of 2026-11-26, from 13:12Z)"
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
**Numbering.** S739 (SkyOystercatcher) wrote 740 and named SkySkimmer for the routine's next session, to take the next
free number: this run is S740 and writes 741. 739 stays SkyTurnstone's (Sam's next plain session), 737 SkyBrant's if it
writes one.

*(Declaration, written at 13:22Z before any worker started. The checkpoint fills the rest.)*

## The start (13:12Z firing, 2026-11-26)

- Brief: COBIx's on #3358 (Wed Nov 25, 6:30 PM PT, updated 02:31Z); the newest comment on the thread is still
  7064588752 (Sam's two rulings of 2026-11-21). Handoff 740 (S739) is the newest; its checkpoint #3879 merged at
  12:23Z (`609c2a2b`, confirmed on `origin/main`).
- One writer: no `list_sessions` or `get_trigger` here. Open PRs at 13:15Z: dependabot's #3383 alone. No commit on
  `main` after `609c2a2b`. S739 let go of everything at sign-off.
- Step 0: not the night's first firing (S739 dispatched the day's dashboard at 06:14Z; `15088513` is on `main`).
- No pause line (handoffs 738 and 740). Three repos attached. `check_hooks_live.py`: ROOT LIVE (guards on Bash and
  `execute_sql`, 34 allow rules, the context meter, the merge-read and clock guards). No `set_session_tags` here.
- Sheet 200: no reply since 2026-11-19T23:47Z. `queue_todo_done` since 2026-11-25: none. Rule 8's memory read: no row
  since S739's 12 (11:29Z). Steps 6 to 10: held in a conductor run, as S727, S731 and S739 held them. Step 11: the
  outline queue is empty until a census, a capture or a verdict row changes.
- Census on `main` (45816008322, 12:06Z): of 20,282 active programs, 15,610 pass and 4,082 have no passing record;
  590 are collected with a named gap. Its `next_wave` (51 colleges, 125 programs, $9.19) is almost all S739's
  relists (`f-census-ignores-college-named-gaps-s727`) and holds, so tonight's collection goes to the levers instead:
  `reconcile_steps` 894 programs at 109 colleges, `reader_page_search` 1,097, `reader_page_assignment` 130.
- **Spend aim:** about $250 for this run, no new worker after about $190. S739 spent about $273 on this UTC day and
  S736 and S737 ran unmetered (01:13Z to 05:15Z), so the day stays under about $750 with room for Sam's plain session.

## The college split (written before any worker started)

Two lanes, never on one college at the same time, one writer per college (`d-lane-names-only-colleges-in-flight-s681`).

- **Lane 1 (collection):**
  - `display` (the conductor), first, while no apply is in flight: one display build carrying S739's records, gate
    college Glendale, then the whole build, then `harvest-gap-census.yml` on `main`.
  - `reads` (Fable 5.2, high effort): Copper Mountain 41085 (the registry names a 404; the reissued catalog is
    `https://www.cmccd.edu/wp-content/uploads/2026/11/Final-26-27-Catalog-11.18.26r1.pdf`), then San Diego City 22367
    and Santa Ana 12242 (long fresh captures), then Santa Ana's `reconcile_steps` pile (13 unequal, 3 incomplete).
    Colleges: Copper Mountain, San Diego City, Santa Ana.
  - `reconcile` (Fable 5.2, high effort): the `reconcile_steps` lever (correction rules from the catalog's own
    wording, a free reconcile, a reread), and a named gap where no rule is true, at San Bernardino Valley, San Jose
    City, Norco and Solano. Colleges: San Bernardino Valley, San Jose City, Norco, Solano.
- **Lane 2 (cheap piles, one worker at a time, high effort):** `piles` (Fable 5.2): the units within-range kind, a twin
  of `hours_within_printed_range` with a self-recall, for Gavilan 08460, 19378, 38787 and 41394, Orange Coast 41373,
  Shasta 32162 and College of the Canyons 36793 (`d-within-range-sums-hold-for-units-kind-s739`); the holds S739 left
  for a reread, each collected with its gap named where the gap is true (gaps noted instead of rereads): American
  River 39731 and 39732, Shasta 18625, Santa Barbara City 30746 and 43553, Los Angeles Trade-Technical 45285 and 31280,
  Long Beach City 37213, Santa Monica 03281, Los Angeles City 32832, Gavilan 45357, Ventura 06948, 08253, 35654, 37415,
  44994 and 44995; the aliases and free reconciles for Shasta 18655 and Los Angeles Trade-Technical 31089 and 41150;
  Cerritos 44984's reload (the conductor dispatches it); then Cabrillo's 13, then S720's rest (Fullerton 7, City
  College of San Francisco 9, Santa Monica 3, College of the Sequoias 2, East Los Angeles 6, Glendale 1, Contra Costa
  6, El Camino 8) and S721's (Butte 3, Orange Coast's 14 and 08626). At its land, the Spend line's builders and the
  Commons page counts are rebuilt. Colleges: Gavilan, Orange Coast, Shasta, College of the Canyons, American River,
  Santa Barbara City, Los Angeles Trade-Technical, Long Beach City, Santa Monica, Los Angeles City, Ventura, Cerritos,
  Cabrillo, Fullerton, City College of San Francisco, College of the Sequoias, East Los Angeles, Glendale, Contra
  Costa, El Camino, Butte.
- **Not tonight:** Porterville (the follow-up's guard first); Saddleback (its `repeat` window first); West Valley
  35588, Southwestern and Pasadena City (reader changes); Antelope Valley and Mission (the eLumen follow-up's rest);
  College of the Desert (robots.txt); Los Medanos (parked); MiraCosta 36144 and 36171; El Camino's four on the Acalog
  road and the other reader changes (Cuyamaca, Cosumnes River 33542, Coastline 43057, Reedley, Los Angeles Pierce,
  Grossmont, Cuesta, Modesto 35127); the follow-up PR, after the waves if the run has room.

## Split changes during the run

- 13:22Z: the declaration (this file's first commit), draft #3885.
- 13:24Z: display build `9e28519af71f` on `claude/s740-display` (built on `609c2a2b` with Python 3.12; the
  sandbox's default 3.11 prints false STALE lines in `check_generated.sh`, so every worker runs a 3.12 shim at
  `/home/user/wt/.py312bin`). 13:28Z: the Glendale gate 45829454750 dispatched; green at 13:31Z: 242 Glendale rows at
  `9e28519af71f`, nothing else moved (live: 18,485 at `3a699eddc8c9`, 16 rows with no display yet). 13:33Z: the whole
  build dispatched on the branch.
- 13:31Z: `piles`, `reads` and `reconcile` started on Fable 5.2 at high effort, each in its own worktree off `609c2a2b`
  (`/home/user/wt/<name>`), told to open no PR (the conductor opens each land) and to leave `.apply` to the conductor.
