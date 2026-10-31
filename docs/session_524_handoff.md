---
title: "Session 524 handoff: Glendale 80 to 105 passing, every course priced from its own description; Sierra's UI pass clean"
date: 2026-10-30
session: 523 (SkyBarberry, the CPL Queue routine)
tags: [handoff, program-requirements, glendale, ui-pass, sierra]
status: current
superseded: true
superseded_by: session_533_handoff.md
---

# You are Session 524

Your moniker is **SkyCranberry**. Session 523 (SkyBarberry) was the CPL Queue routine's 05:12Z firing on 2026-10-30, the morning of the 7th Annual CPL Summit. This is a **full checkpoint**: the run wrote a data receipt (Glendale's reread). It skipped `kb/README.md`, `README.md` and the pipeline view (none moved), and no KB note crossed the bar. No decision sheet was rebuilt: nothing new waits on Sam, and Sheet 143 (built, unpublished) still goes out with the next new card.

## What shipped (PR #2574, draft until `test` passes)

- **UI pass: Sierra.** All 14 Sierra targets (light and dark) pass `npm run a11y` at nine widths; tokens only; no figure Sierra shares with a COBI tab. Ledger recorded, no fix needed.
- **Glendale 80 to 105 of 260 filed records passing.** The catalog prints a course's units only in its description. Fifteen free windowed page reads (`kb/college_reads/glendale_course_desc_01..15`, plus `glendale_course_units_{a,a2,b,c}`) printed every description page; `kb/_description_units.py` parsed the saved logs into `kb/program_requirements_units/glendale_community.json` (1,278 codes). Glendale's `course_units` reconcile step names it as `units_file` (a new option in `kb/_program_requirements_reconcile.py`, guarded in `program_requirements_pilot_test`). Reconcile 41012563119; reread 41013222978 replaced 212 rows, held 0 (receipt `kb/receipts/program_requirement_records_college_reread_glendale_community_41013222978.json`, read back live: 212 rows on run 41012563119). No model call.
- Lessons: `docs/program_requirements_harvest_lessons.md` *S523* (S446 moved to archive 3 to keep the file under its cap). Lane: `program-requirements-harvest.md`, Glendale's line.

## Open work, in order

1. **Land #2574.** Mark it ready, wait for `test` on the newest head, squash-merge. The runner's filing and receipt commits sit on the branch; if one is the head it has no checks, so push the next real change rather than an empty commit.
2. **Display build for Glendale** after the merge, if the lane's wave practice wants one now: `kb/_build_roep_display.py` on a branch, then `step=display` on `main` (lane, *The catalog sweep*).
3. **Glendale's next cause (the harvest's NEXT):** 71 of 155 arithmetic failures name no program total; read the totals the program pages print (`glendale_program_totals` is the S505 read), then the 48 unequal sums. Thirteen of the state's unpriced courses print no description in this catalog (ART 144-255, AT 138, ESL 155, MATH 111, MATH 134, NS 213, PE 217, POLS 110, THTR 192-193).
4. **Sam's Quick Adopt ask (Sierra lane):** links for courses not yet approved. A Sierra deploy, after the Summit unless he says sooner.
5. **Carryover:** Sierra's first-text latency (22 s on the Bakersfield turn); `credential_alignment_for_college` as the next slow read; the college short-name editor and the public page's Contents (after the Summit); the lints' checkout time (1 min 30 s to 1 min 50 s on every page read tonight).
6. **Library queue:** nothing new (the IACA regenerate names no change and no sources; the two noncredit notes describe a summit that has passed).

## Sam's decisions this run

None; Sam was not in this session.

## Read first

`docs/program_requirements_harvest_lessons.md` (*S523*), `docs/reference/lanes/program-requirements-harvest.md`.

## Lessons to honor

- **The state's file is not the whole course list.** A program page places courses the file never lists for that program; price from the catalog itself.
- **A page read prints 14 PDF pages whole; window a long section and parse the saved logs locally.** Three plans a push keeps a job inside get_job_logs' 5,000 lines.
- **Only one run waits per concurrency group.** A second push while one waits cancels the first.
- **A JSON file under `kb/college_reads/` runs as a read when pushed.** Keep derived maps elsewhere.
- **Anchor a log parser on its fixed token and look backward**; nested quantifiers hung for minutes.

## Let go

S523 holds no PR subscription, check-in or artifact watch. #2574 is open as a draft; the next session drives it. The CPL Queue routine (`trig_01L8K64ZKYb5eALdT4HW6NAV`) fires again at 06:12Z and hourly to 13:12Z.
