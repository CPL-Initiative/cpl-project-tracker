---
title: "Annual Workplan Goals — lessons"
date: 2026-10-12
tags: [lessons, workplan, annual-goals, activities]
artifacts:
  - workplan_goals.js
  - excel_to_dashboard.py
  - kb/supabase_projects_count_note.sql
  - kb/receipts/workplan_2026-10-12_s372_add_3_9_move_1_1_2.sql
  - tests/workplan_goals_add_flow.test.js
related:
  - "[[workplan-annual-goals]]"
  - "[[reference-workplan-activity-project-linking-model]]"
  - "[[methodology-an-option-list-read-from-the-page-dies-with-the-renderer]]"
---

# Annual Workplan Goals — lessons

## 2026-10-12 — SkyLedger (parallel session): the add flow that could not add, and the asks behind it

Sam asked for four things on Annual Goals (move AI Apprenticeship CPL Tools under Apprenticeship Sprint; edit goals whose cells look gray; generate the four activity-level updates from a Refresh control; an AA / mobile / First Light audit), then reported that adding 3.9 Futuro Behavioral Healthcare Project failed, then asked for notes defining what each goal number counts, wired to the Activities tab and the report generator.

**What we learned**
- **The add dialog had two independent faults.** Its Activity list came from `[data-kind="activity"]`, a marker printed only by the grouped Workplan Goals renderer, which the Annual table replaced in the same AWG markers (#909's Path A era); the list came back empty and every sub-activity prefix failed. And a sub-activity add wrote only `workplan_goals`, never the `projects` row the table iterates, so even a valid add never rendered. Neither shows in a test that builds its own fixture with the old marker.
- **`project_add.js` lost both mount points** (`#projectCount`, `#awgProjectsAddSlot` are gone from the page), so there was no working add path anywhere. Its jsdom test still passes because the fixture supplies the anchors.
- **The tree is the id.** `projects` has no parent column; nesting is the id's depth. Moving 1.1.2 under 4.2 is a re-key of five live rows (projects, item_raci, item_updates, two association rows; no ladder). The only FK on `projects(id)` is `update_log`.
- **"Grayed" had four causes**, none of them a lock: the Goal/Stretch row fill; no at-rest edit cue once unlocked; eight ladderless rows whose cells really are read-only with nothing saying so; and no keyboard route to any cell.
- **The a11y tool passes the tab** (contrast, targets, layout at 390/1440 signed out and in the editor seeds) and misses keyboard reachability, `th scope`, raw hex in inline styles and the plain-words/green rules. A pass is not an audit.
- **Activity-level updates are rare:** 2 ever (Activities 1 and 3, late June) against 39 sub-activity updates. Sam's Refresh idea matches the use.
- **`projects.kpi_unit` already is "what it counts"** (the cards print it beside the number); the longer definition had no home, so `count_note` was added. Making `kpi_unit` editable exposed an unescaped interpolation on the card.
- **The repo guard blocks every session data write except cpl_memory** (`scripts/supabase_sql_guard.py`); a reviewed write goes to Sam as a paste for the SQL editor. `apply_migration` stays the DDL path.

**State at the time:** PR A #2051 (draft, WIP, CI is the first test run); data SQL waiting on Sam; PR B (audit fixes), C (Move), D (Refresh summaries, approve-before-post) queued in the lane file.

## 2026-10-12/13 — SkyTally (S375): PR A merged, PR B (the UI audit) built

**What we learned**
- **A scanner sees only a literal.** PR A's add wrote three tables through `post(table)`, which built `"/rest/v1/" + table`. The static scan behind the Admin tab's surface map and the dependency map could not see the association insert, and the rebuilt map listed it as a read. Shard 1 caught it only because `cobi_admin_surface.js` was stale. The fix names each table beside its `method: "POST"`; a helper may check the response, never build the URL.
- **jsdom passed a keyboard path that Chrome failed.** Removing a focused field fires its `blur` in Chrome, and the cell editors commit on blur, so Escape restored the cell twice and threw ("the node to be removed is no longer a child") before focus could return. The old code threw on every save and every Escape; the save itself still went out once. A `done` guard (the shared text editor already had one) closes each field once; the return of focus is deferred one tick. `npm run a11y`'s functional keyboard check found it; jsdom never fires that blur.
- **Making a word keyboard-reachable brings it under the 24x24 target rule.** The editable names and "Add" prompts were never measured as targets while they were mouse-only spans; with `role="button"` and `tabindex` they are, and 126 failed. They now grow to 24px.
- **`--on-accent` is not white in dark.** It turns near-black there while `--seal-blue` stays the navy, so the header text read 1.43:1. Text on `--seal-blue` takes `--white` (as the statewide tabs already do).
- **The gray page band is the First Light background** (`#cplfl-bg`, fixed, 100vh). It scrolls with the reader; only a full-page capture shows it stopping. Not this tab's fault, and not a defect a reader meets.
- **A preview needs no cron.** The committed `kb/workplan_goals_snapshot.json` plus `CPL_Data.js` feed `build_workplan_goals_from_supabase`, and the rendered table spliced into a scratch copy of `index.html` lets the a11y tool measure a renderer change before the cron publishes it.
