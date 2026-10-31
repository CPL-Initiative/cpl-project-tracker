---
title: "Session 525 handoff: Glendale's prose totals, 8 records now name their total; 105 still pass"
date: 2026-10-30
session: 524 (SkyCranberry, the CPL Queue routine)
tags: [handoff, program-requirements, glendale]
status: current
superseded: true
superseded_by: session_533_handoff.md
---

# You are Session 525

Your moniker is **SkyTayberry**. Session 524 (SkyCranberry) was the CPL Queue routine's 07:12Z firing on 2026-10-30, the day of the 7th Annual CPL Summit. This is a **full checkpoint**: the run wrote a data receipt (Glendale's reread). It skipped `kb/README.md`, `README.md` and the pipeline view (none moved), and no KB note crossed the bar. No decision sheet was rebuilt: nothing new waits on Sam, and Sheet 143 (built, unpublished) still goes out with the next new card. The 06:12Z firing left no trace (no PR, no commit); S523 merged its own #2574 at 06:55Z.

## What shipped (PR #2575, draft until `test` passes)

- **Glendale's program totals are prose.** The program pages print no "Total Units" line; the description says "for a total of 19 - 21 units", "totaling 17-18 units", "for a minimum of 9 units" (page read 40690480267). A reconcile step may now name `before` (`kb/_program_requirements_reconcile.py`): its pattern reads only the words ahead of that match, so a program printing none never takes the next program's figure. It also skips a record that places no course. Guard in `program_requirements_pilot_test`.
- **The first reconcile (41020193189) misfired on four not-found records** (45396, 45397, 30032, 02587, none loaded); the filing was reverted on the branch, the guard added, and reconcile 41021155698 filed 8 records. Reread 41021975265 replaced 8 rows (receipt `kb/receipts/program_requirement_records_college_reread_glendale_community_41021975265.json`, read back live: 8 rows on run 41021155698).
- **Result:** all 8 sum short of their total, so passing stays 105 of 226 loaded; the 8 moved incomplete to unequal. Live: 105 equal, 66 incomplete (33 with no total), 55 unequal. No model call.
- Lessons: `docs/program_requirements_harvest_lessons.md` *S524* (two lane paragraphs moved there to keep the lane under budget). Lane: Glendale's line.

## Open work, in order

1. **Land #2575.** Mark it ready, wait for `test` on the newest head, squash-merge. The runner's filing and receipt commits sit on the branch; if one is the head it has no checks, so push the next real change rather than an empty commit.
2. **Glendale's unequal sums (55).** Computer Support Technician 11163 sums 22 against 32, Unix-Linux 19366 14 against 20, the Advanced ESL pair 44360/44484 16 against 21, Grip and Lighting 44572 12 against 18-20: courses the reading left out. Read one program's list with a free page read (`kb/college_reads/`, `pdf_span`) before any `force=` re-extraction (under the $40 go).
3. **The 33 still with no total** (Liberal Arts, Machinist, the Physical Sciences, Fire Technology): their pages print none ahead of the list; read one to see whether a total prints after it.
4. **Sam's Quick Adopt ask (Sierra lane):** links for courses not yet approved. A Sierra deploy, after the Summit unless he says sooner.
5. **Carryover:** Sierra's first-text latency (22 s on the Bakersfield turn); `credential_alignment_for_college` as the next slow read; the college short-name editor and the public page's Contents (after the Summit); the lints' checkout time (about 2 min on every run tonight).
6. **Library queue:** nothing new (the IACA regenerate names no change and no sources; the two noncredit notes describe a summit that has passed).

## Sam's decisions this run

None; Sam was not in this session.

## Read first

`docs/program_requirements_harvest_lessons.md` (*S524*, *S523*), `docs/reference/lanes/program-requirements-harvest.md`.

## Lessons to honor

- **A total read from page text needs a boundary.** A whole-catalog PDF prints several programs on a page; read only the words ahead of the program's first list.
- **Check which records a reconcile changed before the reread.** The four borrowed totals showed as records with no placed course; reverting the filing on the branch let the second reconcile start clean.
- **A filled total can lower nothing and still help:** incomplete becomes unequal, and the gap names the missing courses.
- **Only one run waits per concurrency group.** A second push while one waits cancels the first.

## Let go

S524 holds no PR subscription, check-in or artifact watch. #2575 is open as a draft; the next session drives it. The CPL Queue routine (`trig_01L8K64ZKYb5eALdT4HW6NAV`) fires again at 08:12Z and hourly to 13:12Z.
