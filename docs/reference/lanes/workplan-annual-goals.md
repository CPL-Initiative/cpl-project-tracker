---
title: "Annual Workplan Goals / adding, moving and counting sub-activities — lane state"
created: 2026-10-12
updated: 2026-10-13
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

✅ **PR A merged (#2051, 2026-10-13): one add flow, Set targets, counting notes.** The renderer half reaches the page on the cron's regeneration.
- **The add bug (Sam, 2026-10-12, adding 3.9):** the dialog read `[data-kind="activity"]`, a marker the Annual table stopped printing when it won the AWG injection, so its Activity list was empty and every sub-activity was refused. And a sub-activity add wrote only `workplan_goals`, never `projects`, which the table iterates (Path A), so a valid add never appeared. `project_add.js`'s **+ Add project** has no mount point left on either tab (`#projectCount`, `#awgProjectsAddSlot` absent); it is dead code until retired.
- **The fix:** one dialog (parent picker suggests the next free id; writes projects → workplan_goals → links, home primary, each insert a literal URL so the surface maps see it; reads tabled ids live), opened from Annual Goals and from **Add sub-activity** on each Activities-tab activity header (`window.CPL_WORKPLAN_ADD`). **Set targets** on ladderless rows writes the ladder only. **Counting notes:** `projects.kpi_unit` (Counts) + `projects.count_note` (How it is counted; migration `add_projects_count_note`, receipt `kb/supabase_projects_count_note.sql`), edited in place, shown on the cards (unit escaped: it became curator-editable) and sent to `report_generator.js`, `master_report.js`, `generate_reports.js`.
- ⛔ **The tree is keyed by the id itself** (projects has no parent column): a move is a re-key of projects, item_raci, item_updates, workplan_activity_associations, workplan_goals, project_lifecycle, update_log (FK). Miss one and it silently mis-attaches (#872).

🔨 **PR B (the UI audit fixes), S375 SkyTally.** Keyboard: every editable value takes Tab for an editor and opens on Enter or Space, the field is named, Escape or Enter returns focus (Chrome's blur-on-removal made the cell editors throw on every Escape and save; a `done` guard closes each field once); the chip line opens its popover from the keyboard with focus inside. Headers: `scope="col"`, each Activity a `<tbody>` with a rowgroup `<th>`, names and Goal/Current/Stretch as row headers. The renderer prints classes; `workplan_goals.js` paints them (no raw hex left in the table). Goal and Stretch on the plain surface, Current in ink, a cobalt rule under each editable value, dotted underlines under editable words, each 24px tall. Below 560px each sub-activity is a card (the year above each Goal value). An empty description is hidden for a reader and reads **Add description** for an editor. The live Current is muted words. Unlock editing is an underlined word on this tab. Verified on a real-data preview: `npm run a11y` passes light, dark and signed out at 390 and 1440, plus the new functional keyboard and phone-card check. The **gray band** is the First Light background, fixed at the viewport; dismissed.

⏳ **DATA, WAITING ON SAM'S PASTE:** add 3.9 Futuro Behavioral Healthcare Project (Goal 0/2/4/4/4, Stretch 0/4/8/8/8, Activity 3) and move 1.1.2 → 4.2.1 under Apprenticeship Sprint (home Activity 4, keeps the Activity 1 link). SQL + before-values + rollback: `kb/receipts/workplan_2026-10-12_s372_add_3_9_move_1_1_2.sql`; before-values re-read live 2026-10-12 23:45Z, unchanged. The repo guard (`scripts/supabase_sql_guard.py`) blocks session writes except cpl_memory, so Sam runs it in the SQL editor; then verify (1, 2, 1, 0, links "4 home, 1") and dispatch `daily-dashboard.yml`.

**NEXT (Sam's rulings, 2026-10-12):**
1. **PR B — merge it**, then dispatch `daily-dashboard.yml` so the page carries the new table; `npm run a11y workplan-goals-editor` then passes its phone-card check (it fails, by name, on a page the cron has not rebuilt). ★ ✎ ↳ stay (ruled).
2. **PR C — Move control** on each sub-activity row: pick the new parent; one SECURITY DEFINER function re-keys every table above atomically; a test fails when a new table stores the id but the function misses it; governance surface map entry; decide reviewer-only vs team phrase.
3. **PR D — Refresh summaries** at the top of the Activities tab: drafts each Activity's summary from the newest sub-activity updates (report proxy), **Sam approves each before it posts** (his pick), posted as item_updates `activity:N` with attribution and sources in `raw`; a staleness line per header; the Update link leaves the four activity headers. Measured: 2 activity-level updates ever (Activities 1, 3, June) vs 39 sub-activity ones. Governance: a generated writer to item_updates (Rule 10 a3).
4. Retire `project_add.js` (or point it at the one dialog) once PR A lands.

**Related:** the 50% Law finding for CPL spending (restricted funds sit outside the calculation; `cpl_memory` `fifty-percent-law-restricted-cpl-funds-outside-cee-2026-10-12`; public KB `policy-and-funding/fifty-percent-law-and-cpl-funds.md`) belongs to the funding lane, whose file is at its size limit.
