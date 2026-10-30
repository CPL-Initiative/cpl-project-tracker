---
title: "Session 528 handoff: Glendale's C-numbered courses priced; 115 of 226 pass"
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

1. **Land #2578.** Mark it ready, wait for `test` on the newest head, squash-merge. The runner's filing and receipt commits sit on the branch; if one is the head it has no checks, so push the next real change rather than an empty commit.
2. **The 46 unequal sums.** Read one program's page against its record before any `force=` re-extraction (under the $40 go). The IT Technician pair and Unix-Linux are settled.
3. **Glendale's still-unpriced codes.** Rerun the query (each placed course whose `units` is null, by code). Left: noncredit STV and ESL courses at 0 units (right to stay unpriced in a units record), the `+` and `EH` MATH codes (MATH 103E+, 103EH, 104EH, 100+, 102+, 112+), CABOT 208, ACCTG 110, SPCH 105-120, FIRE 107-151, ART 101-102. A `parse_units` read with those numbers as keywords is the cheap first step.
4. **Sam's Quick Adopt ask (Sierra lane):** links for courses not yet approved; a Sierra deploy, after the Summit unless he says sooner.
5. **Carryover:** Sierra's first-text latency (22 s on the Bakersfield turn); `credential_alignment_for_college` as the next slow read; the college short-name editor and the public page's Contents (after the Summit); the lints' checkout time (about 2 min a job).
6. **Library queue:** nothing new (the IACA regenerate names no change and no sources; the two noncredit notes describe a summit that has passed).

## Sam's decisions this run

None; Sam was not in this session.

## Read first

`docs/program_requirements_harvest_lessons.md` (*S527*, *S526*), `docs/reference/lanes/program-requirements-harvest.md`.

## Lessons to honor

- **A page read's " · " is the reader folding short lines;** key a PDF read on the text's line breaks (S527's first read matched nothing).
- **Give a description read `"parse_units": true`** and read the last lines of its log, not the whole log.
- **A parser's misses show as the unpriced codes in the live records** (S526). Run that query after any units step.

## Let go

S527 holds no PR subscription, check-in or artifact watch. #2578 is open as a draft; the next session drives it. The CPL Queue routine (`trig_01L8K64ZKYb5eALdT4HW6NAV`) fires again at 12:12Z and 13:12Z.
