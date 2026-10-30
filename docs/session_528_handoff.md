---
title: "Session 528 handoff: Glendale parked at 115 of 226 under Sam's stopping rule; Mark done alerts the queue"
date: 2026-10-30
session: 527 (SkyLoganberry, the CPL Queue routine)
tags: [handoff, program-requirements, glendale]
status: current
---

# You are Session 528

Your moniker is **SkyMulberry**. Session 527 (SkyLoganberry) was the CPL Queue routine's 11:12Z firing on 2026-10-30. This is a **full checkpoint**: the run wrote a data receipt (Glendale's reread). It skipped `kb/README.md`, `README.md` and the pipeline view (none moved), and no KB note crossed the bar. No decision sheet was rebuilt: nothing new waits on Sam, and Sheet 143 (built, unpublished) still goes out with the next new card. At the start #2577 had already merged (2ff0fec8) and no PR was open. Today's UI pass was done (Sierra, S523).

## What shipped (PR #2578, draft until `test` passes)

- **The state's C-numbered descriptions name no code in their body.** "C1000 · INTRODUCTION TO STATISTICS · 4.0 Units · (Previously MATH 136) · This course is ..." gave `kb/_description_units.py` nothing to key, and its number pattern took three digits at most (now four). These led the unpriced list: STAT C1000 on 15 records, ENGL 101 on 13, PSYC C1000 on 11, ENGL 104 on 11.
- **A read can parse itself on the runner.** A plan with `"parse_units": true` makes `college-page-read.yml` run the parser over its own read and print the result, plus each C-numbered description it cannot key (`unkeyed`: page, number, title, units, old number, footer). Read 41048730638 (`kb/college_reads/glendale_cnumber_descriptions.json`) printed all eleven in eleven lines, where the log runs about 900. Guard: `program_requirements_pilot_test`.
- **The eleven, keyed by hand in the units file** under COMM, ENGL, POLS, PSYC and STAT, each with its words, and the old number each note prints aliased to it (MATH 136+ takes STAT C1000E's 5.0, ENGL 101 takes ENGL C1000's 4.0).
- **Reconcile 41049220135** (free) filled 118 course units on 47 records and changed nothing else (checked field by field). **Reread 41050126747** replaced the 47 rows (receipt `kb/receipts/program_requirement_records_college_reread_glendale_community_41050126747.json`). Glendale live: **115 equal (from 110), 65 incomplete, 46 unequal**; none lost a pass.

## Open work, in order

0. **At the start, read `queue_todo_done`** (scheduled_sessions, step 5): a to-do Sam marked done is your first item.
1. **Land #2579** (the stopping rule, Glendale's to-do and Mark done) if it is still open: `test` green on its head, then squash-merge.
2. **Glendale is parked** (Sam's stopping rule, 2026-10-30): its to-do `glendale-parked-2026-10-30` on the Progress view names what restarts it. Do no Glendale work unless that to-do is marked done.
3. **The next largest gap: Los Angeles Valley College**, 114 of 204 passing (90 failing; then Monterey Peninsula 87, Las Positas 85, De Anza 84). Run the unpriced-codes query for it and read one failing record against its page before any step. Apply the stopping rule from here on: two sessions under 3% each parks a college.
4. **Sam's Quick Adopt ask (Sierra lane):** links for courses not yet approved; a Sierra deploy, after the Summit unless he says sooner.
5. **Carryover:** Sierra's first-text latency (22 s on the Bakersfield turn); `credential_alignment_for_college` as the next slow read; the college short-name editor and the public page's Contents (after the Summit); the lints' checkout time (about 2 min a job).
6. **Library queue:** nothing new (the IACA regenerate names no change and no sources; the two noncredit notes describe a summit that has passed).

## Sam's decisions this run

- **The stopping rule** (2026-10-30, ~12:20Z, *"good to go with 3"*, after *"I want to automate everything but not at all costs..."*): park a college whose catalog stops paying for itself and list what a person could do to restart it. The session proposed 1% a session and then found 1% would not park Glendale (5 of 226 is 2.2%); it set **3%** on his intent and says so on the to-do. Reply to reverse.
- **A to-do list on the Catalog Commons that shows on Sam's to-dos, with Mark done alerting the queue** (same exchange). Built in #2579: the call carries `todo_id`; Mark done writes `queue_todo_done` (reviewers only, insert-only); the next scheduled session reads it first.

## Read first

`docs/program_requirements_harvest_lessons.md` (*S527*, *S526*), `docs/reference/lanes/program-requirements-harvest.md`.

## Lessons to honor

- **A page read's " · " is the reader folding short lines;** key a PDF read on the text's line breaks (S527's first read matched nothing).
- **Give a description read `"parse_units": true`** and read the last lines of its log, not the whole log.
- **A parser's misses show as the unpriced codes in the live records** (S526). Run that query after any units step.

## Let go

S527 holds no PR subscription, check-in or artifact watch. #2578 merged (20be9ced); #2579 is the session's last PR. The CPL Queue routine (`trig_01L8K64ZKYb5eALdT4HW6NAV`) fires again at 12:12Z and 13:12Z.
