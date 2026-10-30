---
title: "Session 526 handoff: S524's Glendale prose totals were borrowed; rolled back, and the fill starts at the heading"
date: 2026-10-30
session: 525 (SkyTayberry, the CPL Queue routine)
tags: [handoff, program-requirements, glendale]
status: current
---

# You are Session 526

Your moniker is **SkyJostaberry**. Session 525 (SkyTayberry) was the CPL Queue routine's 08:12Z firing on 2026-10-30, Summit day. This is a **full checkpoint**: the run wrote a data receipt (a rollback). It skipped `kb/README.md`, `README.md`, the pipeline view (none moved) and a KB note (none crossed the bar). No decision sheet was rebuilt: nothing new waits on Sam, and Sheet 143 (built, unpublished) still goes out with the next new card. #2575 had merged before the firing; no PR was open and no session live.

## What shipped (PR #2576)

- **S524's 8 prose totals were borrowed.** Page read 41025920825 (`kb/college_reads/glendale_unequal_sums.json`, free) printed the pages: S524's `before` cut each page at its first list, which belongs to the page's first program, so Computer Support Technician took IT Technician II's 32, the Advanced ESL Business and Health pair took 21 and Grip and Lighting (an 8-to-16-unit certificate) took 18-20. None of the four prints a total.
- **The fill reads from the record's own heading** (`_heading_end` in `kb/_program_requirements_reconcile.py`: letters and digits only, case kept) to the next list; a heading the page does not print fills nothing. Guard: `program_requirements_pilot_test` (the page-97 shape, the letter-spaced ESL heading).
- **Rolled back:** the 8 filed records restored from 59938a29; the live rows through `supabase-migrate.yml` run 41027518131 with S524's own receipt rollback (`kb/receipts/program_requirement_records_glendale_prose_total_rollback_s525.{sql,json}`), read back live: 8 rows, no total, run 41012563119. Glendale live: **105 equal, 74 incomplete, 47 unequal**.
- **Reconcile 41028129478** (free, the fixed step) was dispatched at 08:41Z to fill the totals the pages do print. Its outcome is under *Open work* 1.
- Lessons: `docs/program_requirements_harvest_lessons.md` *S525*. Lane: Glendale's line. Memory: `harvest-prose-total-starts-at-heading-2026-10-30` (supersedes S524's row).

## Open work, in order

1. **#2576 and reconcile 41028129478.** RECONCILE_STATE
2. **IT Technician II 36598/36599 and III 36600/36601.** The pages print 10 courses "to a total of 32" and 13 to 42; the records sum 31 and 38 (BUSAD 204 reads 1 unit; CS/IS 187 is unpriced). Read BUSAD 204's and CS/IS 187's descriptions before any step.
3. **Grip and Lighting 44572:** FTVM 132 and 137 carry no units; the description windows (S523) may hold them.
4. **Unix-Linux 19366:** its heading prints "UNIX/LINUX"; a read with that keyword shows its list.
5. **Sam's Quick Adopt ask (Sierra lane):** links for courses not yet approved; a Sierra deploy, after the Summit unless he says sooner.
6. **Carryover:** Sierra's first-text latency (22 s on the Bakersfield turn); `credential_alignment_for_college` as the next slow read; the college short-name editor and the public page's Contents (after the Summit); the lints' checkout time (about 2 min a job tonight).
7. **Library queue:** nothing new (the IACA regenerate names no change and no sources; the two noncredit notes describe a summit that has passed).

## Sam's decisions this run

None; Sam was not in this session.

## Read first

`docs/program_requirements_harvest_lessons.md` (*S525*, *S524*), `docs/reference/lanes/program-requirements-harvest.md`.

## Lessons to honor

- **Check a fill's figures against the page before the reread.** S524 checked which records changed and never compared a figure with its page; a borrowed figure looks like a found one.
- **A whole-catalog PDF page holds several programs:** anything read off it is scoped to the program's own heading, never the page's top.
- **A guarded rollback already sits in every reread receipt.** `rollback` plus `before` is the reverse; run it through `kb/migrations/.apply`.

## Let go

S525 holds no PR subscription, check-in or artifact watch. The CPL Queue routine (`trig_01L8K64ZKYb5eALdT4HW6NAV`) fires again at 09:12Z and hourly to 13:12Z.
