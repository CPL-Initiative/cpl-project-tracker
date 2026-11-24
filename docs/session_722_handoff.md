---
title: "Session 722 handoff (from SkySkua, S721, the CPL Queue routine's collection run of 2026-11-24, from 10:41Z)"
created: 2026-11-24
updated: 2026-11-24
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

**Routing, both ways.** A CPL Queue routine firing follows this file. A plain session Sam opens follows the newest
plain-session handoff, `docs/session_720_handoff.md` (S719 SkyShearwater's, for SkyCormorant), never this file.
**Numbering.** This run is S721, the number handoff 721 named, and writes 722. If Sam's SkyCormorant starts while this
runs, it takes the next free number above this run's. The routine's next session is **SkyTropicbird**: it takes the
next free session number at its start and writes the handoff one above the highest on `main`.

# You are SkyTropicbird, the routine's next session

From SkySkua (S721), the CPL Queue routine's 10:12Z firing of 2026-11-24, a conductor run for collection only under
Sam's routine prompt of 2026-11-17 and the COBIx brief on #3358 (Mon Nov 23, written 6:45 PM PT), served by Opus 5.5
(the form names Fable 5.2). **This file is the run's declaration until its checkpoint**: the start and the college
split below were written before any worker started.

## The start (10:12Z firing, 2026-11-24)

- Step 0: not the night's first firing; `daily-dashboard.yml` ran on UTC 2026-11-24 (`29927316`, 06:27Z).
- One writer: no `list_sessions` or `get_trigger` here. Open PRs at 10:14Z: S720 SkyEider's checkpoint #3751 (updated
  10:09Z, its handoff 721 complete to its last line, `test` running) and dependabot's #3383. The firing stayed
  read-only and took the queue when #3751 merged at 10:40Z (`13d93cd1`), as the 10:12Z firing did in S681
  (`d-firing-takes-queue-after-routine-checkpoint-s721`). The rule for a hand-run session's open PR stands as written.
- No pause line (handoffs 720 and 721). Three repos attached. Sheet 200: no reply since 2026-11-19T23:47Z.
  `queue_todo_done` since 2026-11-24: none. Rule 8's memory read: S720's 23 rows are live.
- Steps 6, 7 and 9: the Library's requests are the daytime Library run's; the CER procedure request (2026-11-19) is a
  plain session's; no exhibit re-analysis request is open. Step 8: weekly, Sundays. Step 10, the credential harvest:
  not run since 2026-11-13 (#3210); the conductor runs since 2026-11-17 hold to collection, and this one does too.
- Step 11: `python3 scripts/next_slo_colleges.py --next` says the queue is empty, after the 10:08Z census.
- Census on `main` (run 45371224551, 10:08Z): of 20,282 active programs, 15,498 pass and 4,353 have no passing record;
  431 are collected with a named gap.

## The college split (written before any worker started)

Two lanes, never on one college at the same time, one writer per college (`d-lane-names-only-colleges-in-flight-s681`).

- **Lane 1 (collection):**
  - `display` (the conductor), first, while no apply is in flight: one display build carrying the records S720 applied
    and loaded after `abf1f6396156`, gate college Glendale, then the whole build, then `harvest-gap-census.yml` on
    `main`.
  - `pooled` (Opus, high effort), the fix that keeps a wave from filing wrong gaps: the scorer reads a parent figure
    over nested sub-blocks as one pool (`f-pool-figure-gaps-pass-when-pooled-s720`), with its self-recall and a
    statewide dry run; then Modesto Junior's held plan (`claude/s720-piles-modesto`) under it, and the 16 applied
    `pool_figure_not_read` rows checked against it. Colleges: Modesto Junior, El Camino, Santa Monica, Ventura, City
    College of San Francisco, Clovis, College of the Sequoias, Fullerton.
  - `lever` (Opus, high effort), the census's Next wave: Antelope Valley 10, Saddleback 7, College of the Redwoods 5,
    MiraCosta 5. A free page read and pins first; paid reads with `only=` at most $5 a college on the estimate, which
    the conductor dispatches. Orange Coast's 8 wait until lane 2 leaves that college; College of the Desert's 23 stay
    behind robots.txt.
- **Lane 2 (cheap piles, one worker at a time, high effort):** the census's wording-rule piles, Palo Verde 20, then
  Orange Coast 20, then Porterville 19 if the run has room. Each record is collected with its gap named
  (`sam-collect-with-gaps-2026-11-17`) or passes on a rule its own page prints; a second reader, a pre-read and the
  conductor's apply.

## Split changes during the run

(Filled in at the checkpoint.)

## Conductor settings

A conductor run for collection only, under Sam's routine prompt of 2026-11-17 (`docs/reference/conductor_mode.md`,
*Settings*; review rounds as his ruling of 2026-11-20 sets them): two lanes, never on one college; about $750 a day for
everything, $10k running total for the whole job; workers on Opus 5.5, high effort on any worker that writes shared
data; Sonnet or Haiku for routine reads; reviews at most 9 agents, stopped after two rounds with what is left sent to
Sam or COBIx; $40 per college per run for program requirements and a separate $40 for SLOs, PLOs and course
objectives, per run, never a remaining pot. Stop rules from the brief: a day over $300 with fewer than 40 new programs;
over $12 per new program or $0.50 per outline row; a rollback that undoes over 1% of a day's rows; the $10k
checkpoint. S720 spent about $255 earlier on this UTC day, so this run aims at about $150. The form names Fable 5.2;
this run is served by Opus 5.5.
