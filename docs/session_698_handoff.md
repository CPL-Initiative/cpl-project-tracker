---
title: "Session 698 handoff (from SkyPuffin, S697, the CPL Queue routine's 13:12Z firing of 2026-11-21)"
created: 2026-11-21
updated: 2026-11-21
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

**Routing.** This handoff is the CPL Queue routine's. A plain session Sam opens follows `docs/session_696_handoff.md`
(SkyFulmar, from SkyShearwater).

**Declaration (13:17Z).** SkyPuffin (S697), the CPL Queue routine's 13:12Z firing of 2026-11-21, holds the routine's
queue from 13:17Z: a conductor run for collection only. This file is the declaration until the checkpoint fills it in.
A firing that finds this PR updated in the last half hour ends in one line.

## The start

No `list_sessions`, `get_trigger`, `get_session` or `set_session_tags` in this session. Open PRs at 13:14Z: dependabot's
#3383 only. `main` at 9ee488a7 (S691's checkpoint #3632, 12:49Z), so S691 had signed off and no session was live.
`daily-dashboard.yml` had already succeeded on 2026-11-21 (run 44864091313). No pause line. Three repos attached.
No `queue_todo_done` row since 2026-11-21. Hooks: `LIVE (root)` at `/home/user/.claude/settings.json`, merge-read and
clock guards yes. Disk: 58 GB free; one checkout.

## The college split (written before any worker started, 13:17Z)

Two lanes, never on one college at the same time, one writer per college; a college moves between lanes only when its
lane has nothing in flight there (`d-lane-names-only-colleges-in-flight-s681`). Ordered by Sam's work order
(`r-collect-for-mids-work-order-sam-2026-11-20`): outline fills first, by the M-ID cards each fills
(`f-outline-ranking-s691`), program records second.

**Lane 1, collection (Opus 5.5 workers, high effort).**

- **Worker `ivc`:** Irvine Valley's outlines (735 M-ID cards), on Saddleback's curriQunet host: its client filter and
  status words, a 12-page trial and its recall file, the full read. The conductor dispatches the load. College: Irvine
  Valley.
- **Worker `sdce`, after `ivc`'s PR merges** (both touch the outline reader's files): San Diego College of Continuing
  Education's outline index search (191 cards), trial, read. College: San Diego College of Continuing Education.
- **Worker `readerfix`:** the two reader fixes the lane puts before the next paid college read
  (`f-timed-out-read-still-files-s691`, `f-would-extract-relists-same-page-s691`) and the named-programs `only` input
  Cosumnes River's paid read waits on. Code only, no college. Then the conductor runs Cosumnes River's read under the
  $40 cap. College: Cosumnes River.

**Lane 2, the cheap piles (one Opus 5.5 worker, high effort, free rule work).**

- **Worker `piles`:** the `total_not_printed` gap's apply (#3633: Santa Monica 45811 to 45815 and 37885), then the
  census's 11 free rereads (Orange Coast 6, Cerritos 2, Oxnard, Imperial Valley, Hartnell). Colleges: Santa Monica,
  Orange Coast, Cerritos, Oxnard, Imperial Valley, Hartnell. Nothing at a lane 1 college.

**The conductor's own:** the merges, the paid-run checks against the caps, the display build once after the posts,
`harvest-gap-census.yml` against 4,875, and the checkpoint.

**Split changes during the run.** Butte joins lane 1 only if `readerfix` carries its normalized-address compare
(`f-butte-page-addresses-changed-case-s690`). 14:28Z: `piles` finished (#3640 merged) and lane 2's next concern went
to a fresh worker, `piles2`: the census's `reconcile_steps` at Glendale (33) and Clovis (26), catalog-wording rules
with self-recall, free runs only. Its two colleges were written here a minute after it started.

## Progress (refreshed while the run works)

- 13:37Z: the `total_not_printed` gap on Santa Monica 37885 and 45811 to 45815 (#3640's plan, guarded UPDATE, 6 of 6;
  a live read confirmed each row's gap and confidence).
- 13:39Z: the live read before the rereads found no live row better than `main`'s file and none newer. Orange Coast's
  109 rows at 38670927724 give way to `main`'s 39726645292, which passes or ties on all 109.
- 13:40Z: rereads dispatched on `claude/s697-piles`: Orange Coast, Hartnell, Imperial Valley, Oxnard. Cerritos 20504
  waits: its run also holds 44984, held for a person. All four receipts landed by 13:41Z; a closing live read shows
  the nine named programs on `main`'s runs and passing.
- 14:04Z: #3640 ready, waiting on `test`. Irvine Valley's #3642 (index 44908824732: 1,199 current outlines; trial
  44911142170, 12 of 12) waits on its second reader before the full read.
- 14:27Z: #3640 merged (`00e441ce`). The second reader on #3642 gave GO for the full read and the load
  (`slugs=irvine_valley`), with one blocking test fix before the merge and three fixes forward; the full read is out.

**Not tonight:** the plain session's list (handoff 696; brief section 4). Golden West's 476 header rows wait on a plain
session's review. City College of San Francisco's Cal-GETC step stays a plain session's.

## Conductor settings

A conductor run for collection only, under Sam's routine prompt of 2026-11-17 (`docs/reference/conductor_mode.md`,
*Settings*): two lanes, never on one college; about $750 a day for everything, $10k running total for the whole job;
workers on Opus 5.5, cheaper models for routine reads, high effort on any worker that writes shared data; reviews at
most 9 agents, stopped after two rounds with what is left sent to Sam or COBIx; $40 per college per run for program
requirements and a separate $40 for SLOs, PLOs and course objectives, per run, never a remaining pot. The routine's
prompt names Fable 5.2 for tonight's conductor; this session runs as Opus 5.5, the model its form gave it. Stop rules
from the brief: a day over $300 with fewer than 40 new programs; over $12 per new program or $0.50 per outline row; a
rollback that undoes over 1% of a day's rows; the $10k checkpoint.
