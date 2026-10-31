---
title: "Session 527 handoff: Glendale's description parser reads 70 more courses; 110 of 226 pass"
date: 2026-10-30
session: 526 (SkyJostaberry, the CPL Queue routine)
tags: [handoff, program-requirements, glendale]
status: current
superseded: true
superseded_by: session_533_handoff.md
---

# You are Session 527

Your moniker is **SkyLoganberry**. Session 526 (SkyJostaberry) was the CPL Queue routine's 10:12Z firing on 2026-10-30, Summit day. This is a **full checkpoint**: the run wrote a data receipt (Glendale's reread). It skipped `kb/README.md`, `README.md` and the pipeline view (none moved), and no KB note crossed the bar. No decision sheet was rebuilt: nothing new waits on Sam, and Sheet 143 (built, unpublished) still goes out with the next new card. At the start S525's #2576 was open with `test` green on its head; S526 merged it (6363c6bf). The 09:12Z firing left no trace.

## What shipped (PR #2577, draft until `test` passes)

- **IT Technician II and III are faithful to a catalog whose totals run one unit high.** II's ten courses print "to a total of 32" and sum 31 (BUSAD 204 is 1.0 in its description and the state's file); III sums 38 plus CS/IS 187, which the catalog never describes (page read 41039652111) and the state's file prices at 3.0. Both stay *unequal*: the catalog's own arithmetic. **Unix-Linux 19366** prints no total (page 114), so it stays incomplete.
- **The description parser missed 70 codes** (`kb/_description_units.py`): a `(Previously MEDIA 103)` note between the units and the code, titles starting with a digit (`2-D FOUNDATIONS`), titles with `+`, a curly apostrophe or an accented letter. A reparse of S523's nine logs plus 41039652111 priced 59 more codes and changed none; 11 old numbers (MEDIA 101/103/107/110/112/213, STV 61-64/66) take the new code's units. Guard: `program_requirements_pilot_test`.
- **Reconcile 41040709338** (free) filled 114 course units on 57 records and changed nothing else (checked record by record). **Reread 41041428504** replaced the 57 rows (receipt `kb/receipts/program_requirement_records_college_reread_glendale_community_41041428504.json`, read back live). Glendale live: **110 equal (from 105), 67 incomplete, 49 unequal**; none lost a pass.
- The lessons doc was 3% over budget: S409-S411 moved verbatim to archive 3. Lessons: *S526*. Lane: Glendale's line.

## Open work, in order

1. **Land #2577.** Mark it ready, wait for `test` on the newest head, squash-merge. The runner's filing and receipt commits sit on the branch; if one is the head it has no checks, so push the next real change rather than an empty commit.
2. **Glendale's still-unpriced courses.** Run S526's query (each placed course whose `units` is null, by code, across Glendale's live records). After the reparse the list should be the ones the catalog prints no description for (STAT C1000, PSYC C1000, COMM C1000, ENGL 101/104 under the C-numbers, SPCH 101, CABOT 208): check whether the C-numbered descriptions print in another shape before any step.
3. **The 49 unequal sums.** Read one program's page against its record before any `force=` re-extraction (under the $40 go). The IT Technician pair is settled.
4. **Sam's Quick Adopt ask (Sierra lane):** links for courses not yet approved; a Sierra deploy, after the Summit unless he says sooner.
5. **Carryover:** Sierra's first-text latency (22 s on the Bakersfield turn); `credential_alignment_for_college` as the next slow read; the college short-name editor and the public page's Contents (after the Summit); the lints' checkout time (about 2 min a job).
6. **Library queue:** nothing new (the IACA regenerate names no change and no sources; the two noncredit notes describe a summit that has passed).

## Sam's decisions this run

None; Sam was not in this session.

## Read first

`docs/program_requirements_harvest_lessons.md` (*S526*, *S525*), `docs/reference/lanes/program-requirements-harvest.md`.

## Lessons to honor

- **A parser's misses show as the unpriced codes in the live records, not in its own count.** Run that query after any units step.
- **A record that sums to its own courses' units against a higher printed total is the catalog's arithmetic.** Read every course's description before calling it a missed course.
- **The `display` column is an older display build;** `checks->>'arithmetic'` is the current status (S526 found 8 rows reading *unequal* in checks and *equal* in display).

## Let go

S526 holds no PR subscription, check-in or artifact watch. #2577 is open as a draft; the next session drives it. The CPL Queue routine (`trig_01L8K64ZKYb5eALdT4HW6NAV`) fires again at 11:12Z and hourly to 13:12Z.
