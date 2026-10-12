---
title: "Annual Workplan Goals / adding, moving and counting sub-activities — lane state"
created: 2026-10-12
updated: 2026-10-12
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
  - "[[workplan_annual_goals_lessons]]"
  - "[[reference-workplan-activity-project-linking-model]]"
---

# Annual Workplan Goals: adding, moving and counting sub-activities

> **Always-current lane state, not an archive.** Story: [`docs/workplan_annual_goals_lessons.md`](../../workplan_annual_goals_lessons.md).

**What this lane is:** the Annual Workplan Goals tab as the one editor of the workplan's structure (add, move, set targets, say what each number counts), wired to the Activities tab and the report generator, plus the Activities tab's generated activity summaries.

## Status

🔨 **PR A OPEN (#2051, draft, WIP): one add flow, Set targets, counting notes.** Tests (`tests/workplan_goals_add_flow.test.js`) had not run locally (no jsdom in the sandbox): read CI on #2051 first, fix, then merge. The renderer half reaches the page only on the cron's regeneration.
- **The add bug (Sam, 2026-10-12, adding 3.9):** the dialog read `[data-kind="activity"]`, a marker the Annual table stopped printing when it won the AWG injection, so its Activity list was empty and every sub-activity was refused. And a sub-activity add wrote only `workplan_goals`, never `projects`, which the table iterates (Path A), so a valid add never appeared. `project_add.js`'s **+ Add project** has no mount point left on either tab (`#projectCount`, `#awgProjectsAddSlot` absent); it is dead code until retired.
- **PR A's fix:** one dialog (parent picker suggests the next free id; writes projects → workplan_goals → links, home primary; reads tabled ids live), opened from Annual Goals and from **Add sub-activity** on each Activities-tab activity header (`window.CPL_WORKPLAN_ADD`). **Set targets** on ladderless rows writes the ladder only. **Counting notes:** `projects.kpi_unit` (Counts) + new `projects.count_note` (How it is counted; migration `add_projects_count_note` applied, receipt `kb/supabase_projects_count_note.sql`), edited in place, shown on the cards (unit now escaped: it became curator-editable) and sent to `report_generator.js`, `master_report.js`, `generate_reports.js`.
- ⛔ **The tree is keyed by the id itself** (projects has no parent column): a move is a re-key of projects, item_raci, item_updates, workplan_activity_associations, workplan_goals, project_lifecycle, update_log (FK). Miss one and it silently mis-attaches (#872).

⏳ **DATA, WAITING ON SAM'S PASTE:** add 3.9 Futuro Behavioral Healthcare Project (Goal 0/2/4/4/4, Stretch 0/4/8/8/8, Activity 3) and move 1.1.2 → 4.2.1 under Apprenticeship Sprint (home Activity 4, keeps the Activity 1 link). SQL + before-values + rollback: `kb/receipts/workplan_2026-10-12_s372_add_3_9_move_1_1_2.sql` (on #2051). The repo guard (`scripts/supabase_sql_guard.py`) blocks session writes except cpl_memory, so Sam runs it in the SQL editor; then verify (1, 2, 1, 0, 2) and dispatch `daily-dashboard.yml`.

**NEXT (Sam's rulings, 2026-10-12):**
1. **PR B — UI audit fixes on Annual Goals** (the a11y tool passes it; these it cannot see): editable cells unreachable by keyboard (no tabindex/Enter); no `th scope`, names not row headers; 715 raw hexes in the table's inline styles; gray Goal/Stretch fill reads disabled, no at-rest edit cue; Current values green (green is for action); Unlock editing boxed (controls are underlined words); phone width shows only Sub-Activity, Type and part of 2025-26 (cards below 560px); the "—" empty description (make it Add description for editors); solid blue live badge (muted text); the gray page band stops at screen height. ★ ✎ ↳ stay (ruled).
2. **PR C — Move control** on each sub-activity row: pick the new parent; one SECURITY DEFINER function re-keys every table above atomically; a test fails when a new table stores the id but the function misses it; governance surface map entry; decide reviewer-only vs team phrase.
3. **PR D — Refresh summaries** at the top of the Activities tab: drafts each Activity's summary from the newest sub-activity updates (report proxy), **Sam approves each before it posts** (his pick), posted as item_updates `activity:N` with attribution and sources in `raw`; a staleness line per header; the Update link leaves the four activity headers. Measured: 2 activity-level updates ever (Activities 1, 3, June) vs 39 sub-activity ones. Governance: a generated writer to item_updates (Rule 10 a3).
4. Retire `project_add.js` (or point it at the one dialog) once PR A lands.

**Related:** the 50% Law finding for CPL spending (restricted funds sit outside the calculation; `cpl_memory` `fifty-percent-law-restricted-cpl-funds-outside-cee-2026-10-12`; public KB `policy-and-funding/fifty-percent-law-and-cpl-funds.md`) belongs to the funding lane, whose file is at its size limit.
