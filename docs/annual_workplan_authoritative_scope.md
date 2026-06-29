---
title: Annual Workplan Targets as the authoritative source — scope (Current hybrid + editable titles)
date: 2026-06-29
session: 84 (SkyScribe) — scoped; build in a fresh session
status: SCOPED · decisions locked · ready to build
tags: [cobi, dashboard, kpi, workplan-goals, supabase, scope]
artifacts:
  - excel_to_dashboard.py
  - workplan_goals.js
  - kb/_load_workplan_goals.py
related:
  - docs/dashboard_card_metrics_recommendations.md
---

# Annual Workplan Targets as the authoritative source

As the team began updating activities/projects, two needs surfaced (Sam,
2026-06-29). Both are about making the **Annual Workplan Targets tab the single
authoritative store** and ending value/title drift across surfaces. Sam picked
the approach below; **build in a fresh session** (this one's context is long).

## Decisions locked (Sam)
1. **Current values = HYBRID** — *live for KPI-mapped sub-activities (read-only),
   manually editable for the rest.*
2. **Titles** — *the Annual Workplan tab is authoritative; titles editable there,
   single store, cards read from it.*

---

## Issue 1 — "Current" column ≠ KPI cards (the 96,449 vs 100k mismatch)

**Root cause (verified):** in `build_workplan_goals_from_supabase()`
(`excel_to_dashboard.py` ~L9810-9818) the Annual Workplan **Current** value is set
from the project's **manual** `kpi_metric`:
```python
current_metric = float(project.kpi_metric)   # manual
current_dict["2025-26"] = current_metric
current_dict["total"]   = current_metric
```
The headline KPI cards instead show the **live scrape** (`merge_live_metrics` →
`kpis[key]['value']`). Same metric, two sources → drift (3.2 Current 96,449 vs the
~100k live TRANSCRIPTED UNITS card). A `pid_to_kpi_key` map already exists
(`excel_to_dashboard.py` ~L10696: `3.1→cumulative_students`, `3.2→eligible_units`,
`2.1→credit_recommendations`, `3.3→active_colleges`, `4.1.1→veteran_sprint`) but is
used only for KPI card **ordering**, not value sync.

**Build (hybrid):**
1. **Mapped sub-activities** (the `pid_to_kpi_key` ids) → set `current_dict` from the
   **live** KPI value (`kpis[kpi_key]['value']`, comma-stripped to a number), NOT
   `kpi_metric`. Render **read-only** with a small `live · as of <scrape date>`
   badge. This makes **Annual Workplan Current == headline KPI == project/activity
   card number** by construction — and folds in the earlier "card ≠ KPI" item
   (`docs/dashboard_card_metrics_recommendations.md` #1): drive ALL surfaces of a
   mapped metric from the one live value.
   - Extend `pid_to_kpi_key` if more sub-activities should be live-mapped (confirm
     3.2 maps to transcripted vs eligible units — the screenshot shows 3.2 = "CPL
     Units Transcription" against the TRANSCRIPTED UNITS card; today it's
     `eligible_units` — likely needs `transcripted_units`. **Verify the mapping.**)
2. **Unmapped sub-activities** (manual, e.g. **1.1 MAP Feature Enhancements**) →
   make **Current editable in the Annual Workplan tab**: add a CURRENT-row editor
   to `workplan_goals.js` (mirror the GOAL/STRETCH `data-editable` cells; the
   CURRENT row currently has no `data-editable`), writing to a **new
   `workplan_goals.current` column** (Supabase). Render an `✎ manual` marker.
   - **Supabase change:** add `current numeric` to `public.workplan_goals` (reviewer
     RLS already on the table). `build_workplan_goals_from_supabase` reads it for
     unmapped ids; `kb/_load_workplan_goals.py` SELECT must include it.
3. **Generator:** `current_dict` source becomes: `live KPI value if id in
   pid_to_kpi_key else workplan_goals.current (manual)`. Mark each `current` with a
   `source: 'live'|'manual'` flag so the renderer can badge + gate editability.

**Open verify:** the exact `pid_to_kpi_key` mapping for 3.2 (eligible vs
transcripted units) — fix it so the right live value lands.

---

## Issue 2 — authoritative, editable titles (+ targets) from the Annual Workplan tab

**Root cause (verified):** titles live in **two** stores —
- `projects.name` (edited on the project cards via `projects_editor.js`), and
- `workplan_goals.name` (the `data["name"]` rendered in the Annual Workplan table
  via `render_annual_goals_table_html`) —

which can drift. Targets (GOAL/STRETCH) are already editable + authoritative in the
tab (`workplan_goals.js`); **titles are not editable there**.

**Build:**
1. **Pick one store** = `projects.name` (covers all 34 items, already card-editable).
   Repoint the Annual Workplan table's name cell to render `projects.name` (join by
   id) instead of `workplan_goals.name` — OR keep `workplan_goals.name` but **sync
   the two on write**. Recommend: single store `projects.name`.
2. **Add title editing** to the Annual Workplan tab (`workplan_goals.js`): make the
   sub-activity name cell `data-editable` → PATCH `projects.name` (same field the
   card editor writes). Then a title edited in either place updates the one source,
   and all surfaces reflect it.
3. Activities (the 5 Activity headers) similarly edit `activities.name` (already the
   case for the activity label via the association editor — confirm + extend if
   project titles need the same).

---

## Files / functions to touch
| File | What |
|---|---|
| `excel_to_dashboard.py` `build_workplan_goals_from_supabase` (~L9810) | `current_dict` source → live-KPI-or-manual hybrid + a `source` flag |
| `excel_to_dashboard.py` `pid_to_kpi_key` (~L10696) | the authoritative id→live-KPI map; verify 3.2; pass it into the workplan-goals build |
| `excel_to_dashboard.py` `render_annual_goals_table_html` (~L1316 CURRENT row, name cell) | badge live vs `✎ manual`; make CURRENT (manual) + name `data-editable` |
| `workplan_goals.js` | CURRENT-row editor (manual only) + title editor; gate live cells read-only |
| `kb/_load_workplan_goals.py` | SELECT the new `current` column |
| Supabase | `alter table public.workplan_goals add column current numeric;` |

## Verification (next session)
- A jsdom test that the live-mapped CURRENT is read-only + manual CURRENT is
  editable + a title edit PATCHes `projects.name`.
- Parity: Annual Workplan Current for a mapped id == the headline KPI value.
- Confirm no regression to the existing `workplan_goals.js` GOAL/STRETCH editor.
