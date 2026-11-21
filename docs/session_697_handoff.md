---
title: "Session 697 handoff (from SkyPetrel, S691, the CPL Queue routine's conductor night of 2026-11-21) — DECLARATION, rewritten at the checkpoint"
created: 2026-11-21
updated: 2026-11-21
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

**Routing.** This handoff is the CPL Queue routine's. A plain session Sam opens follows `docs/session_696_handoff.md`
(SkyFulmar, from SkyShearwater).

**Status: declaration.** Written at 07:20Z before any worker started, so the college split stands in the repo first
(the routine prompt of 2026-11-17: *"Write the college split into the handoff before any worker starts"*). The
checkpoint rewrites this file.

# The run

SkyPetrel (S691, the moniker handoff 691 names for the routine; S694, a plain session, also signed as SkyPetrel, so
this run always carries its number). The CPL Queue routine's firing of 2026-11-21, first command 07:13Z. A conductor
run for collection only, under Sam's routine prompt of 2026-11-17 and the COBIx brief on #3358 (updated
2026-11-21T02:33Z, `main` at 531c16ba when written).

**The start.** No `list_sessions`, `get_trigger`, `get_session` or `set_session_tags` in this session. Open PRs:
#3602 (draft, last updated 2026-11-20T17:35Z) and dependabot's #3383; `main`'s last commit 08506fa4 at 05:15Z (S695's
checkpoint), so no live session. `daily-dashboard.yml` already succeeded on 2026-11-21 (run 44864091313), so step 0
dispatched nothing. No pause line. Three repos attached. No `queue_todo_done` row since 2026-11-20. Open Asks Sheet
200 is fully answered (card 1 *Apply it*, carried out as run 43889173474), so nothing waits on Sam.

## The college split (written before any worker started, 07:20Z)

Two lanes, never on one college at the same time, one writer per college; a college moves between lanes only when its
lane has nothing in flight there (`d-lane-names-only-colleges-in-flight-s681`). Order by Sam's work order
(`r-collect-for-mids-work-order-sam-2026-11-20`) and the brief's collection list.

**Lane 1, collection (Opus 5.5 workers, high effort).**

- **Worker `reread`:** the reread plan's rows 56 to 73 (`kb/program_requirements_reread_plan_s683.json`), extracted on
  `claude/s690-read-<slug>` and not posted: Cuyamaca, Moreno Valley, Norco, Fullerton, College of the Canyons, San Jose
  City, San Diego City, San Diego Mesa. Keep-the-better, post, load. Merced, Reedley and Sacramento City failed the
  gate and stay. Then College of the Canyons' own levers (census lever 3, 101 programs, a free page read first; lever 8,
  37, its catalog wording), since it holds Canyons all night.
- **Worker `pages`:** the census's free page-finding levers: Ohlone 36, San Joaquin Delta 30, Santa Barbara City 28,
  Mt. San Antonio 28, Fresno City 26, West Los Angeles 24; then Solano 11 and Cañada 3 (the ligature fold). A free
  page read first; paid extraction only for programs whose own page is found.
- **Worker `outlines`:** outline readers, ranked by the M-ID cards each fills: Rio Hondo's index search, Irvine Valley's
  and Saddleback's status words, San Diego College of Continuing Education's index search; the 12 still-taught
  courses' outline text where a person's paste carries it (North Orange Continuing Education, Southwestern,
  Grossmont; Ohlone's four print nothing); then Golden West's before-values file, written first so the rollback
  undoes row by row (COBIx's call in the brief, section 2 item 4). The guarded correction of the 476 rows waits on a
  plain-session review and does not run tonight.

**Lane 2, the cheap piles (one Opus 5.5 worker, high effort, free rule work).**

- **Worker `piles`:** first #3602 (update from `main` once, rebuild `kb/status/commons_data.json`; the conductor gates
  and merges), which files Berkeley City's and Glendale's reread records. Then the census's free rule levers at
  colleges lane 1 does not hold: lever 2 (the general education pattern's units, 192 statewide), lever 4 (a noncredit
  total in hours, 68), the catalog-wording rules at Santa Monica 43, Glendale 33, Santa Rosa Junior 27, Clovis 26 and
  City College of San Francisco 28, and City College of San Francisco's 20 programs still unprinted after the 2025-26
  read (discontinued flags or a named gap). A rescore leaves out every college lane 1 holds. College of the Desert's
  8 stay behind robots.txt; Los Medanos stays parked.

**The conductor's own:** the dispositions of the open PRs, the merges, the paid-run checks against the caps, the
display build once after the night's posts, `harvest-gap-census.yml` against 4,982, and the checkpoint.

**Not tonight** (the plain session's list, brief section 4): repo slimming item 3, `START_HERE.md` and the `CLAUDE.md`
cut, the M-ID mint work, the Library, Rule G, one credential list, the cer-procedures pair apply, the CR exact match,
and the page fixes. The two Library briefs requested on 2026-11-12 stay a plain session's.

## Conductor settings

A conductor run for collection only, under Sam's routine prompt of 2026-11-17 (`docs/reference/conductor_mode.md`,
*Settings*; review rounds as his ruling of 2026-11-20 sets them): two lanes, never on one college; about $750 a day for
everything, $10k running total for the whole job; workers on Opus 5.5, cheaper models for routine reads, high effort on
any worker that writes shared data; reviews at most 9 agents, stopped after two rounds with what is left sent to Sam
or COBIx; $40 per college per run for program requirements and a separate $40 for SLOs, PLOs and course objectives,
per run, never a remaining pot. The routine's prompt names Fable 5.2 for tonight's conductor; this session runs as
Opus 5.5, the model its form gave it. Four checkouts at once on measured disk (1.5 GB a checkout, 58 GB free at
07:18Z), above the three of S653's smaller disk (`d-four-checkouts-on-measured-disk-s691`). Stop rules from the brief:
a day over $300 with fewer than 40 new programs; over $12 per new program or $0.50 per outline row; a rollback that
undoes over 1% of a day's rows; the $10k checkpoint.

## Ledger

| PR or branch | State | Next |
|---|---|---|
| this declaration and checkpoint (`claude/awesome-fermat-8cosoz`) | draft | merges at sign-off |
| #3602 (`claude/s690-follow-up`) | worker `piles` updates it from `main` | gate on `test`, merge |
| #3383 | dependabot's | waits |

Spend: to be filled at the checkpoint.
