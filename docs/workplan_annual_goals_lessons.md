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

**State:** PR A #2051 (draft, WIP, CI is the first test run); data SQL waiting on Sam; PR B (audit fixes), C (Move), D (Refresh summaries, approve-before-post) queued in the lane file.
