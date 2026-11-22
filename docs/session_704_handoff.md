---
title: "Session 704 handoff (from SkyDovekie, S703, the CPL Queue routine's 10:12Z firing of 2026-11-22) — DRAFT, the declaration"
created: 2026-11-22
updated: 2026-11-22
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

**Routing.** This handoff is the CPL Queue routine's. A plain session Sam opens follows `docs/session_702_handoff.md`
(SkyMurre's, S701) or the newer plain handoff that session writes. **Numbered 704, not 703:** Sam's next plain session
(SkyRazorbill, S702, named by handoff 702) writes `docs/session_703_handoff.md`, so this run takes S703 and the moniker
SkyDovekie, and its handoff takes 704.

**DRAFT.** This file is the run's declaration and its college split, written before any worker started. The
checkpoint rewrites it.

## The start

The 10:12Z firing found S701 (Sam's plain session) live: it pushed #3671 at 10:12:50Z, with no declared side-session
scope, so the firing stood down. S701 signed off at 11:00Z (checkpoint #3672, `main` 660218c6). At about 11:03Z Sam
said, live: *"/coord and keep going. I will be starting another session but don't let that stop the queue."* This run
proceeds as the routine's conductor, beside the plain session he starts.

No `list_sessions`, `get_trigger`, `get_session` or `set_session_tags` in this session; no peer in `ListAgents`.
Open PRs at 11:04Z: dependabot's #3383 only. `daily-dashboard.yml` ran on 2026-11-22 (`e547f007`, 06:22Z); the Pages
deploys after #3669 and #3670 succeeded, so the brief's failed deploy (run 44973859667) is superseded. No pause line.
Three repos attached. No `queue_todo_done` row since 2026-11-21. Hooks: `LIVE (root)`, merge-read and clock guards
yes. Disk: 58 GB free.

## Scope (for /coord: the plain session reads this)

Collection only, under handoff 699's NEXT and the COBIx brief of 2026-11-21 on #3358. Files: the program-requirements
harvest's readers and records (`kb/_program_requirements_*.py`, `kb/college_reads/`, `kb/program_requirements/`,
`kb/receipts/`), the outline readers and their gates, `kb/status/program-requirements.json`, the harvest lane and
lessons, and the Commons data files a records change rebuilds (`kb/_build_commons_status.py`,
`kb/_build_commons_data_status.py` outputs). Shared ground: `program_requirement_records` and the outline tables
through their workflows; no cron change, no public page, no public KB. **One writer per file:** the plain session keeps
the Subjects and Commons page files (`commons_subjects.js`, `kb/*subject*`, `lanes/commons.md`); this run keeps the
harvest files. On a conflicted Commons data file, take `main`'s side and rerun both builders
(`p-commons-files-conflict-between-prs-s697`).

## The college split (written before any worker started, 11:08Z)

Two lanes, never on one college at the same time, one writer per college; a college moves between lanes only when its
lane has nothing in flight there (`d-lane-names-only-colleges-in-flight-s681`). Ordered by Sam's work order
(`r-collect-for-mids-work-order-sam-2026-11-20`): outline fills first, program records second.

**Lane 1, collection (Opus 5.5 workers, high effort).**

- **Worker `outlines`:** City College of San Francisco's outline recall gate refreshed on `main` (8c95dee8 against the
  trial's d5cef493, `f-ccsf-outline-gate-stale-on-main-s691`), then San Diego College of Continuing Education's
  outline index search (191 cards), a 12-page trial with its recall file, and the full read. The conductor dispatches
  the paid read and the load. Colleges: City College of San Francisco (the gate only), San Diego College of Continuing
  Education.
- **Worker `pins`:** Clovis Business 33432, 33433, 33487, 33491 and Social Science 33492 (a page-break pin and a
  reread), and Cosumnes River 20147, 20193 and 20227 (their own page) and 33053 (a pin). Free pricing with `only`
  first; the conductor runs each paid read under $40 per college. Colleges: Clovis, Cosumnes River.
- **Worker `glendale`:** Glendale's 11 with no record file (40846, 40847, 21302, 38973, 24377, 24327, 37070, 36599,
  36601, 11155, 21303), then Butte's read now that its address compare landed (#3641). Free pricing first; paid reads
  under $40 per college. Colleges: Glendale, Butte.

**Lane 2, the cheap piles (one Opus 5.5 worker, high effort, free rule work).**

- **Worker `piles`:** lever 2, the general education pattern's units rule (192 statewide), and lever 3, the noncredit
  hours total (100), applied at every college except the lane 1 colleges above while they are in flight; the
  catalog-wording rules at Santa Monica (30) and Santa Rosa Junior (27). Each new matcher runs its self-recall test
  first. Colleges: every college the two rules touch, less City College of San Francisco, San Diego College of
  Continuing Education, Clovis, Cosumnes River, Glendale and Butte.

**The conductor's own:** the merges, the paid-run checks against the caps, the display build once after the posts,
`harvest-gap-census.yml` against 4,839, the Spend line and the checkpoint.

**Held to a later slot in this run:** the free page-finding levers (Ohlone 36, San Joaquin Delta 30, Mt. San Antonio
28, Santa Barbara City 28, Orange Coast 27, then City College of San Francisco 53) go to a fresh lane 1 worker when a
checkout frees; Glendale's 28, Clovis's 14 and City College of San Francisco's 28 wording rules go to lane 2 after
lane 1 signs off at those colleges. Each move is written here before it starts.

## Split changes during the run

(none yet)
