---
title: Excel dependency audit — what still touches CPL_Initiative_Project_List_v3.xlsx, and the fix queue
created: 2026-06-01
updated: 2026-06-01 (P1 done, Session 25)
tags: [reference, excel-to-supabase, retirement, audit, fix-queue, phase-final]
kb-status: published
kb-type: reference
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[excel-retirement-final-scope]]"
  - "[[methodology-verify-consumer-before-migrating]]"
artifacts:
  - excel_to_dashboard.py
  - dashboard_filters.js
  - CPL_Initiative_Project_List_v3.xlsx
---

# Excel dependency audit + fix queue

> **One-sentence summary** — A measure-first catalog of *every* remaining tie to
> `CPL_Initiative_Project_List_v3.xlsx` (the "Update" button that still opens
> Excel was the visible tip), with a prioritized PR queue to cut each one.

## Context

The bulk data migrated to Supabase (Projects #184, Budget read-path #189,
Workplan Goals Phase 1, Personnel, KPI ladder #211/#213). But the `.xlsx` can't
be deleted yet: a curator clicked **Update** on a project card and it opened
**Excel for the Web**. This audit `grep`-walked every `wb` / `EXCEL_FILE` /
`load_workbook` reader, every Excel **writer**, and every client-side Excel
deep-link, so the finale (PR-4 in `[[excel-retirement-final-scope]]`) has a
complete, accurate target list. (That earlier scope doc under-counted — it
listed `read_projects` + budget factors + a few readers but missed the **Update
button**, the **config tables**, the **KPI_Config writer**, the **Update Log**,
and the **`archive_updates_to_log` writer**. This supersedes its reader list.)

## A. Python generator — live Excel READERS (`main()` call order)

| Reader | Reads | Data already in Supabase? | Fix |
|---|---|---|---|
| `read_project_config(wb)` | Project List rows 1–2: dashboard title, description, **attachments_url (cell I1)** → injected as `window.CPL_ATTACHMENTS_URL` | No (small config) | Move to a config home (P2) |
| `load_projects(wb)` → `read_projects(wb)` | 34 projects: **only `excel_row`** (Update deep-link target) + per-project **KPI-ladder Excel fallback** + the **total-outage fallback**. The card data itself is Supabase (#184). | Yes (cards); `excel_row` is Excel-only | `excel_row` dies with the Update button (P1); reader retires in P5 |
| `read_config_overrides(wb)` | **Col AG** KPI tunables/baselines (`BASE_MIL`/`BASE_WF`/`BASE_APP` 2024 baselines, `SAVINGS_DEFAULT`, `V2030_G2_PROGRESS`, …) | No (small config) | Config home (P2) |
| `read_update_log(wb)` | **Update Log sheet** → per-project update *history* shown on cards ("Show all (N)") | Partly — `latest_update` is in Supabase `projects`; the **history** is Excel-only | Migrate or retire history (P3) |
| `load_budget(wb)` → `read_budget_plan(wb)` | Budget **`factors` + `year_labels`** (assumptions) + budget total-outage fallback. Funding/personnel are Supabase (#189). | No (`factors`/`year_labels`) | Config home (P2); reader retires in P5 |
| `read_kpi_parameters(wb)` | **KPI_Config sheet** — algorithm-description tunables | No (small config) | Config home (P2) |
| `ensure_kpi_config_sheet(wb)` | Creates KPI_Config if missing (**writes** — see B) | — | Retire with P2 |

## B. Python generator — Excel WRITERS (mutate the `.xlsx`)

These are the **hard blockers** for deleting the file — the generator currently
*writes back* to it every run:

| Writer | Does | Fix |
|---|---|---|
| `archive_updates_to_log(EXCEL_FILE)` | Copies Project List col P/Q notes into the Update Log tab (`wb.save`) | Retire with the Update Log migration (P3) |
| `ensure_kpi_config_sheet(wb)` + `wb.save(EXCEL_FILE)` | Writes a default KPI_Config sheet back to Excel | Retire with KPI_Config config home (P2) |
| `EXCEL_FILE + ".bak"` backup (main) | `shutil.copy2` backup before edits | Drop with the file (P5) |

## C. UI / client-side Excel deep-links

| Link | Where | Goes to | Fix |
|---|---|---|---|
| **"Update" button** | `_render_single_project_card` (`excel_cell_url(excel_row)`) **and** `render_activity_kpis_html` | **Excel-for-the-Web at cell `P{row}`** — the one the curator hit | **P1 ✅ DONE (#219)** — card button now triggers the inline Latest Update editor; akpi copy dropped |
| `SHARED_EXCEL_URL` rewire | `dashboard_filters.js` (decl line 11; rewires `updateBtn` + card btns lines 322–349) | SharePoint Excel | **P1 ✅ DONE (#219)** — rewire + toolbar button removed |
| **"Attach" button** | card (`window.CPL_ATTACHMENTS_URL` from `read_project_config` I1) | SharePoint **attachments folder** (not the workbook itself) | Keep, but re-source the URL from the config home (P2). NOT a workbook dep once I1 moves. |
| "Report" button | card → `reports/projects/{pid}_Report.docx` | A **generated docx** (no Excel) | None — already Excel-free |

## D. Dead Excel readers (defined, never called — delete on sight)

- `read_annual_goals(wb)` — annual goals now come from `build_workplan_goals_from_supabase()`; only a docstring still names it. **DEAD.**
- `read_workplan_goals(wb)` — no call site. **DEAD.**

(These join the `populate_current_metrics` cluster deleted in #213 — same
"verify the consumer, then delete" pattern: `[[methodology-verify-consumer-before-migrating]]`.)

## E. The file + its resolution

`SHAREPOINT_EXCEL` / `_LOCAL_EXCEL` / `EXCEL_FILE` resolution + `load_workbook`
+ the `openpyxl` import — all retire in the final step once A/B are gone.

---

## Fix queue (prioritized)

**P1 — "Update" button → in-dashboard (user-facing; the reported bug). ✅ DONE
(Session 25, 2026-06-01, PR #219).** Chose option (a): the per-card "Update"
button is now an inline trigger (`<a href="#" class="proj-update-btn">`) that
opens the card's `latest_update` modal editor when signed in, or scrolls-to +
flashes the auth widget when signed out — instead of deep-linking into Excel.
The activity-KPI-card "Update" copy was **dropped** (aggregates, no single
editable row; Report + Attach stay). Removed the Excel deep-link cluster
(`SHAREPOINT_EXCEL_URL` / `EXCEL_SHEET_NAME` / `excel_cell_url()`), the
`dashboard_filters.js` `SHARED_EXCEL_URL` rewire + toolbar "Update Projects"
button, and stopped emitting `excel_row` (gone from `CPL_Data.js` entirely).
*Generator + dashboard_filters.js + projects_editor.js; no data migration; no
Supabase change.* The workbook **path** (read path) still retires in P5.

**P2 — config tables off Excel.** `read_config_overrides` (Col AG), `read_kpi_parameters`
+ `ensure_kpi_config_sheet` (KPI_Config), and `read_project_config` (title /
description / attachments_url) are all small key-value config. **Fork:** a
committed `kb/dashboard_config.json` (pragmatic — these are static-ish, like the
snapshots; zero new infra) vs. a Supabase `app_config` table (aligns with the
source-of-truth trajectory; editable in-tab later). *Rec: committed JSON* —
lowest weight for rarely-edited config, and it kills two **writers**
(`ensure_kpi_config_sheet`) at once. Measure-first: dump the live Col AG +
KPI_Config + row-1 values into the JSON, parity-check the rendered output.

**P3 — Update Log history.** `read_update_log` + `archive_updates_to_log` (a
writer). `latest_update` already lives in Supabase `projects` (editable). **Product
fork:** do we need the *full* per-project history on cards, or is the latest
update enough? If keep → a Supabase `project_update_log` table + an append on
each `latest_update` edit (the editor already writes the field). If retire → drop
the "Show all (N)" history, keep `latest_update`. *Needs Sam's call.*

**P4 — delete the dead readers** (`read_annual_goals`, `read_workplan_goals`).
Trivial; bundle into P1 or P2.

**P5 — the finale: drop the `.xlsx`.** After P1–P3: delete `read_projects`,
`read_budget_plan`, `read_update_log`, `read_config_overrides`,
`read_kpi_parameters`, `ensure_kpi_config_sheet`, `read_project_config`,
`archive_updates_to_log`, the `EXCEL_FILE`/`SHAREPOINT_EXCEL` resolution + `.bak`
backup, and the `openpyxl` import. Remove `CPL_Initiative_Project_List_v3.xlsx`.
Keep a **Supabase→xlsx backup export** job so a portable snapshot still exists
without Excel being a *source*. (`kb/reference/coci_course_list.xlsx` is NOT in
scope — that's the MAP COCI data extract, an input, not the hand-maintained master.)

## Cost

P1 ≈ 1–2 h (the visible win). P2 ≈ 2–3 h (+ a fork). P3 ≈ 2 h (+ a product fork).
P4 ≈ 15 min. P5 ≈ 1–2 h once the rest land + one cron confirms parity. The budget
`total`/`avg` formula layer + personnel editor (from the Session 24 handoff) are
independent and can interleave.
