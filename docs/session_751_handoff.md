---
title: "Session 751 handoff (from SkySandpiper, S750, the CPL Queue routine's collection run of 2026-11-28, from 13:12Z)"
created: 2026-11-28
updated: 2026-11-28
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

**Conductor model: Fable 5.2 (claude-fable-5-2), as this run's header reports, matching the routine's form.
get_session is not among this run's tools, so the header is the only readout.**

**Routing, both ways.** A CPL Queue routine firing follows this file. A plain session Sam opens follows the newest
handoff his plain sessions write, never this file.
**Numbering.** Handoff 749 (S748 SkyStilt) named SkySandpiper for the routine's next session, to take the next free
number. Sam's plain session in flight at the start carries S749 on its PRs (#3948, #3949) and will write 750, so this
run is S750 and writes 751.

*(Declaration, written at 13:16Z before any worker started; the sections after the log are written at the checkpoint.)*

## The start (13:12Z firing, 2026-11-28)

- Brief: COBIx's on #3358 (comment 6894464154, Fri Nov 27, written 6:45 PM PT, `main` at `205e6cae`); it predates
  S748, so handoff 749's *Open work* and the lane's NEXT lead where the two differ.
- One writer: no `list_sessions`, `get_trigger` or `get_session` here. Open PRs at 13:13Z: Sam's S749 drafts #3949
  (common-subject picks, 13:12Z) and #3948 (CIP taxonomy, 13:06Z), a plain session on subjects and CIP, which never
  stands the queue down; COBIx's #3937, #3926 and #3917 (subject titles, Sam's or COBIx's); dependabot's #3383.
  None is a queue session's. S748's checkpoint #3940 merged at 12:22Z. This run leaves all six.
- Step 0: not the night's first firing; the daily dashboard ran (`25706b02`, 06:26Z).
- No pause line (handoff 749). Three repos attached. `check_hooks_live.py`: ROOT LIVE.
- Rule 8's memory read: S748's 13 rows and S749's four; nothing since on the harvest.
- Census on `main` (46141774235, 11:55Z): 15,698 of 20,282 pass, 3,888 have no passing record, 696 are collected with
  a named gap.
- **Spend aim:** about $200 for this run, no new worker after about $150 (S748 spent about $184 of today's $750, and
  Sam's plain sessions are unmetered).

## The college split (written before any worker started)

Two lanes, never on one college at the same time, one writer per college. Workers run Fable 5.2 at high effort; plan
readers Sonnet; shared-code readers Fable 5.2. No Opus worker is planned. The conductor alone dispatches paid reads,
rereads, loads and `.apply`, and holds every Supabase call.

- **Lane 1 (collection):**
  - `found`: the found-pages change, round 2 (lane NEXT (3)), then the one-program probe (Skyline 05809) and the read
    of the found pages. Colleges: Skyline, Allan Hancock, San Mateo, Diablo Valley, San Joaquin Delta, Gavilan,
    Glendale, Cabrillo, Coastline, Feather River, Napa Valley, Lemoore. Saddleback's one and West Valley's one stay out
    (not tonight).
  - `display`: the display build carrying S748's 41 records (NEXT (2)), gate college Glendale, then the census on
    `main`. It runs first, before any apply.
- **Lane 2 (cheap piles, one worker):** `piles`: the coverage-omits records to assign under
  `state_course_not_on_page` (NEXT (6)) at Cerritos 02235, Citrus 02333, Marin 46242, Foothill 11827 and 43194, Irvine
  Valley 44922, Madera 39810, Palomar 08929 and 22528; the census reading college-named gap files (NEXT (4), code
  only); College of the Canyons 37868's failed read, its log (NEXT (7)); discontinued flags, units rules and retired
  courses over its colleges; at its land, the Spend line's builders and the Commons page counts. Colleges: Cerritos,
  Citrus, Marin, Foothill, Irvine Valley, Madera, Palomar, College of the Canyons.
- **Not tonight:** Diablo Valley 39775 (the college is lane 1's tonight); Porterville 33085 (the 06773 guard first);
  Porterville; Saddleback; West Valley 35588, Southwestern and Pasadena City; Antelope Valley and Mission; College of
  the Desert (robots.txt); Los Medanos; Solano 43134 and Santa Monica 43767 (a person's); the six records the Blocks
  table of handoff 749 leaves to a person; Cosumnes River's `set` step and the reader changes of NEXT (8), if the run
  has room after the found pages.

## Split changes during the run

- 13:16Z: the declaration pushed; `found`, `display` and `piles` started on Fable 5.2 at high effort.
- 13:33Z: `display` stop 1, its last (`claude/s750-display`, `52b8a23a`): build `366c5bbc7b2d`, 18,754 statements (two
  programs gain a display: San Bernardino Valley 31858, Coastline 43057), the build code unchanged. The conductor's
  baseline (13:34Z): `229a759101f7` 18,751, older builds 32, none 2. The Glendale step dispatched on the branch.
