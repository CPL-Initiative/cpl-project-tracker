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

✅ **PR A merged (#2051, 2026-10-13): one add flow, Set targets, counting notes.**
- **The add bug (Sam, 2026-10-12, adding 3.9):** the dialog read `[data-kind="activity"]`, a marker the Annual table stopped printing when it won the AWG injection, so its Activity list was empty and every sub-activity was refused. And a sub-activity add wrote only `workplan_goals`, never `projects`, which the table iterates (Path A), so a valid add never appeared.
- **The fix:** one dialog (parent picker suggests the next free id; writes projects → workplan_goals → links, home primary, each insert a literal URL so the surface maps see it; reads tabled ids live), opened from Annual Goals and from **Add sub-activity** on each Activities-tab activity header (`window.CPL_WORKPLAN_ADD`). **Set targets** on ladderless rows writes the ladder only. **Counting notes:** `projects.kpi_unit` (Counts) + `projects.count_note` (How it is counted; migration `add_projects_count_note`), edited in place, shown on the cards and sent to `report_generator.js`, `master_report.js`, `generate_reports.js`. `project_add.js` is retired (#2055): it had lost both mount points.
- ⛔ **The tree is keyed by the id itself** (projects has no parent column): a move is a re-key of projects, item_raci, item_updates, workplan_activity_associations, workplan_goals, project_lifecycle, update_log (FK, not deferrable). Miss one and it silently mis-attaches (#872).

✅ **PR B merged (#2054), published by run 582: the UI audit fixes.** Keyboard: every editable value takes Tab for an editor and opens on Enter or Space, the field is named, Escape or Enter returns focus (Chrome's blur-on-removal made the cell editors throw on every Escape and save; a `done` guard closes each field once); the chip line opens its popover from the keyboard with focus inside. Headers: `scope="col"`, each Activity a `<tbody>` with a rowgroup `<th>`, names and Goal/Current/Stretch as row headers. The renderer prints classes; `workplan_goals.js` paints them (no raw hex left in the published table). Goal and Stretch on the plain surface, Current in ink, a cobalt rule under each editable value, dotted underlines under editable words, each 24px tall. Below 560px each sub-activity is a card. An empty description is hidden for a reader and reads **Add description** for an editor. The live Current is muted words; Unlock editing is an underlined word. `npm run a11y workplan-goals-editor` passes on the published page with its functional keyboard and phone-card check. The **gray band** is the First Light background, fixed at the viewport; dismissed. The Add dialog's Activity checkboxes measured 19.9px tall on the published page: **#2057** makes them 24px.

🔨 **PR C built, held (#2056, draft): the Move control.** `workplan_move_sub_activity(old, new, keep_old_link)` (`kb/supabase_workplan_move.sql`) re-keys the seven tables above in one transaction (the projects row is copied under the new id so update_log can follow its FK), makes the new home the primary link and keeps the old Activity's link unless dropped, then scans every public `project_id` / `item_id` / `activity_id` column and rolls back if any still holds the old id. Each move files its before-values in `workplan_id_moves`; the file's header carries the undo. Reviewer sign-in only; closed to anon. The dialog offers "Move" on each sub-activity to a reviewer, never offers the row or its children as a parent, suggests the next free number from the live list. Governance: `tab:workplan-goals` and the RPC map to DR-13, whose `maintained_in` names the function. Verified against Postgres 16 in PGlite (`scripts/verify_workplan_move.js`, 22/22) and in jsdom (`tests/workplan_move.test.js`, 39). **Not applied:** `apply_migration` timed out four times on 2026-10-13, as it did six times for S374. Merge only after the function exists and `has_function_privilege` reads anon false, authenticated true.

⏳ **WAITING ON SAM'S PASTES. Sam ruled 2026-10-13 ~01:18Z (chat): *"Can't find 71 so I'll go with your recommendations"* on [Open Asks Sheet 72](https://claude.ai/artifact/LFbjZXFbHmPTNF8JqW3qMV)** (`cpl_memory` `sam-sheet-72-rulings-2026-10-13`). **Card 4 is settled: Move stays reviewer sign-in only.** Cards 1-3 are his pastes (apply_migration timed out a fifth time at 01:19Z): card 2 adds 3.9 (Goal 0/2/4/4/4, Stretch 0/4/8/8/8, Activity 3) and moves 1.1.2 → 4.2.1 keeping the Activity 1 link (receipt `kb/receipts/workplan_2026-10-12_s372_add_3_9_move_1_1_2.sql`; good read-back 1, 2, 1, 0, "4 home, 1"); card 3 creates the Move function (read-back false, true); card 1 is the other queue's course outcomes table.

**NEXT:**
1. **Check whether Sam pasted.** Card 2: read projects 3.9 / 4.2.1 / 1.1.2 and the 4.2.1 links; if done, dispatch `daily-dashboard.yml`. Card 3: `to_regclass('public.workplan_id_moves')` and `has_function_privilege` (anon false, authenticated true); if done, mark #2056 ready, merge on `test`, dispatch the dashboard. If neither is done, retry `apply_migration` once for card 3, then ask him again in one line.
2. **PR D — Refresh summaries** at the top of the Activities tab: drafts each Activity's summary from the newest sub-activity updates (report proxy), **Sam approves each before it posts** (his pick), posted as item_updates `activity:N` with attribution and sources in `raw`; a staleness line per header; the Update link leaves the four activity headers. Measured: 2 activity-level updates ever (Activities 1, 3, June) vs 39 sub-activity ones. Governance: a generated writer to item_updates (Rule 10 a3).

**Related:** the 50% Law finding for CPL spending (restricted funds sit outside the calculation; `cpl_memory` `fifty-percent-law-restricted-cpl-funds-outside-cee-2026-10-12`; public KB `policy-and-funding/fifty-percent-law-and-cpl-funds.md`) belongs to the funding lane, whose file is at its size limit.
