---
title: "Session 375 handoff — Annual Goals: land PR A, then B, C, D"
date: 2026-10-12
tags: [handoff, workplan, annual-goals, activities, fifty-percent-law]
---

# Session 375 handoff (from SkyLedger, the parallel session of 2026-10-12)

You are **SkyTally (Session 375)**. Two queues are live: **`docs/session_374_handoff.md`** (S373 SkyCypress → SkyJuniper: program requirements and the rest of the main queue) and **this one** (the Annual Workplan Goals work). If Sam opened you with this file, work this queue; read 374's priorities too and agree one writer with any session still holding wakes (`list_sessions`). In this run's receipt and memory names, "s372" means SkyLedger, distinct from S372 SkyRedwood.

## What shipped this run
- **50% Law research for CPL spending** (Sam's ask). Finding: the definitions of instruction leave no room (coordinator, counseling, transcript evaluation, faculty stipends are noninstructional), but **restricted funds sit outside the calculation** (Ed. Code §84362(c); 5 CCR §59204(b)(6); BAM: CEE = Unrestricted General Fund; CDAM §421). ESS 25-82 never says "restricted." Draft FSAU/ESS fiscal advisory + one-page CBO guide: `CPLBrain/04-projects/cpl-initiative/20261012_CPL_Funds_Fifty_Percent_Law_Advisory_and_Guide_Draft_1.html` (private, pre-decisional; Sam sends it to Fiscal Standards with the cover note). Public KB note (research only, Sam's pick): `cpl-knowledge-base/policy-and-funding/fifty-percent-law-and-cpl-funds.md` (#26 merged), portal header now says CPL Initiative (#27 merged), vault #321 merged.
- **Annual Goals PR A — [CPL-Initiative/cpl-project-tracker#2051](https://github.com/CPL-Initiative/cpl-project-tracker/pull/2051), draft, WIP.** One add flow (fixes Sam's failed 3.9 add), Set targets on ladderless rows, counting notes (`kpi_unit` + new `count_note`, migration applied), wired to the Activities cards and the three report builders. **Its jsdom test never ran locally (no jsdom in the sandbox).**

## Docs to read, in order
1. `docs/reference/lanes/workplan-annual-goals.md` — state, the four NEXT items, the invariants.
2. `docs/workplan_annual_goals_lessons.md` — why the add flow failed (two faults) and what "grayed" meant (four causes).
3. `docs/kb-notes/reference-workplan-activity-project-linking-model.md` — home field vs association table.
4. `cpl_memory` rows tagged `workplan`, `fifty-percent-law`.

## Priority, in order
1. **Drive #2051 to green.** Read `get_check_runs`; fix the add-flow test or the code until `test` passes; mark ready; squash-merge (auto-merge authorization). Then `project_add.js`: retire it or point it at `window.CPL_WORKPLAN_ADD`.
2. **The data paste.** Ask Sam whether he ran the SQL (3.9 add + 1.1.2 → 4.2.1). Verify with a read: projects 3.9 = 1, goal rows 3.9 = 2, projects 4.2.1 = 1, projects 1.1.2 = 0, links 4.2.1 = 2 (Activity 4 primary). Then dispatch `daily-dashboard.yml`. If not run, hand him the paste again from the receipt (`kb/receipts/workplan_2026-10-12_s372_add_3_9_move_1_1_2.sql`) — the repo guard blocks session data writes.
3. **PR B — the Annual Goals UI audit fixes** (list in the lane file; keyboard reachability first, it is a Level A failure). Seeds exist: `workplan-goals-editor`, `workplan-goals-add` in `a11y.config.js`; add a phone-card check.
4. **PR C — Move control** (SECURITY DEFINER re-key function + guard test + governance map).
5. **PR D — Refresh summaries** (approve before post; Activities tab; remove the activity-level Update link).

## Sam's rulings this run (also in `cpl_memory`)
- Add 3.9 now; move 1.1.2 → 4.2.1 now, keeping the Activity 1 link; Refresh summaries: **draft, then he approves**; no mockups, just build.
- Counting notes per sub-activity: "define what the numbers will be counting"; and "I will want this all wired to the Activities tab and Report generator."
- Public KB: research only, folder Policy and Funding; HTML, not Word, for the advisory and guide.

## Patterns that worked
- Rendering the tab (signed out and with `cpl_team_pass`) before advising: "grayed" turned out to be four things.
- Counting every row keyed to an id before a re-key (five rows for 1.1.2).
- A receipt with before-values and a rollback before any data write.

## Safety patterns to honor
- The tree is the id: a move re-keys every id-keyed table in one transaction (#872).
- Session data writes go to Sam as a paste (guard); DDL through `apply_migration` with a receipt.
- Renderer changes need the cron (code-only PRs); a reload does not show a new row.
- `kpi_unit` is curator-editable now: escape it everywhere it renders.

## Skipped this checkpoint (and why)
- Pipeline view (7): the pipeline did not move. UI pass (9): no room for a fix PR; the ledger keeps the next view due (Annual Goals was audited in session; its fixes are PR B). `kb/queue_status.json` (12): owned by the concurrent Program Requirements session. `--apply` handoff stamping: not run, so 374 is not marked superseded while it is still live.

## Subscriptions and check-ins
Watching #2051 (draft). No check-ins armed. KB #26, #27 and vault #321 merged; their subscriptions ended.
