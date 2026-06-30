---
title: Annual Workplan tab as the authoritative source — lessons
date: 2026-06-30
session: 85 (SkyLight)
status: BUILT — hybrid Current + authoritative titles shipped
tags: [cobi, dashboard, kpi, workplan-goals, supabase, lessons]
artifacts:
  - excel_to_dashboard.py
  - workplan_goals.js
  - kb/_load_workplan_goals.py
  - kb/_test_workplan_current_hybrid.py
  - tests/workplan_goals_authoritative.test.js
related:
  - docs/annual_workplan_authoritative_scope.md
  - docs/dashboard_card_metrics_recommendations.md
  - docs/kb-notes/methodology-live-vs-manual-hybrid-column.md
---

# Annual Workplan tab = authoritative source

## 2026-06-30 (Session 85, SkyLight) — built

Shipped the two pieces Sam scoped in Session 84
(`docs/annual_workplan_authoritative_scope.md`). One code-only PR; the daily cron
/ post-merge dispatch publishes the regenerated HTML.

### Issue 1 — "Current" column ≠ KPI cards (96,449 vs ~100k drift) → HYBRID

Root cause was a second source of truth: the Annual Workplan "Current" came from
the project's **manual** `kpi_metric` (last touched 2026-04-08) while the headline
KPI card shows the **live scrape**. Same metric, two sources, guaranteed drift.

The fix makes the live value the single source for the **mapped** sub-activities
and gives the **unmapped** ones a real editable Current:

- **`PID_TO_KPI_KEY`** is now a module-level constant (was a local dict used only
  for KPI-card ordering). It maps `3.1→cumulative_students`,
  **`3.2→transcripted_units`** (was `eligible_units` — a latent mismatch; "CPL
  Units Transcription" is the transcription card, not eligibility),
  `2.1→credit_recommendations`, `3.3→active_colleges`, `4.1.1→veteran_sprint`.
  Fixing 3.2 was safe: the ordering use is a **no-op today** (no project sets
  `kpi_order`), and the value-sync is brand new.
- **Sequencing was the real puzzle.** `build_workplan_goals_from_supabase()` runs
  *before* `merge_live_metrics()` + `merge_exhibit_metrics()`, so the merged
  `kpis` aren't available at build time. Rather than reorder (risky), the build
  only stamps `current_kpi_key` + a manual baseline, and a **post-pass**
  `apply_live_workplan_current(annual_goals, kpis, live_data)` runs *after* both
  merges to flip mapped rows to `current_source='live'` with the **verbatim KPI
  display string** (e.g. `48,142`, `100k`). Verbatim = matches the headline card
  by construction, and sidesteps the fact that live values are sometimes
  abbreviated strings (`"100k"`, `"$321M"`) that don't round-trip through a number
  formatter.
- **Unmapped** sub-activities now store a hand-entered Current in a new
  **`workplan_goals.current`** numeric column (read on the GOAL row, canonical),
  falling back to the legacy Excel `kpi_metric` when null (back-compat + pre-column
  snapshots). Editable in the tab.
- Graceful degrade: a mapped row whose KPI has no live value stays manual.

### Issue 2 — authoritative, editable titles

Titles lived in two stores (`projects.name` vs `workplan_goals.name`). Picked
**`projects.name`** (covers all 34 items, already card-editable). The Annual
Workplan table now **renders `projects.name`** (join by id, fallback to the wpg
name) and the title cell is click-to-edit → **PATCH `projects.name`** — the same
field the Dashboard card editor writes. One store; an edit in either place shows
everywhere after the next regen. (Zero name drift between the two stores today, so
the repoint is a no-op on current data — it just removes the future drift risk.)

### Render + editor

- `render_annual_goals_table_html`: the Current row's 2025-26 cell is either a
  **read-only live value + a `live · as of <date>` badge** (`wpg-live-badge`) or a
  **click-to-edit manual cell** (`data-current-edit` + a `✎` hint); the TOTAL cell
  mirrors it (`data-current-total` for optimistic repaint). The name is wrapped in
  an editable `data-title-edit` span.
- `workplan_goals.js`: `saveCurrent` (PATCH `workplan_goals.current` on the GOAL
  row) + `saveTitle` (PATCH `projects.name`), both on the existing magic-link
  `cpl_sb` session. Live cells carry **no** edit attr, so they're read-only by
  construction — never lit, never clickable.

### RLS reality check

The `workplan_goals.js` header comment claimed an "Allow auth write qual=true" RLS
gap. **Stale** — both `public.workplan_goals` and `public.projects` already gate
writes on `is_allowed_reviewer()` (verified live). No policy change needed; the
anon key alone can't write either table. Updated the comment.

### Verification

- `kb/_test_workplan_current_hybrid.py` (30 checks) — `_row_current` precedence,
  the hybrid build (manual baseline + `current_kpi_key`), the live post-pass
  (flip mapped, leave unmapped, graceful skip when a KPI has no value), the
  authoritative-title repoint, and the render (live badge vs editable manual vs
  read-only).
- `tests/workplan_goals_authoritative.test.js` (26 checks, jsdom) — signed-in
  manual-Current edit → `workplan_goals.current` PATCH on the GOAL row + TOTAL
  mirror repaint; title edit → `projects.name` PATCH; live cell opens no editor
  and fires no write; the legacy GOAL/STRETCH editor still works; signed-out fires
  nothing.
- Full generator run: **EXIT 0**, "Annual Workplan: 5 sub-activities synced to
  live KPI values", 5 live badges + 26 editable currents/titles (27 ladder rows −
  the tabled 5.1). Full jsdom suite: **110/110 files**.

### Pitfalls captured

- The live KPI value is sometimes an **abbreviated display string** (`"100k"`,
  `"$321M"`) — render it **verbatim**, don't reformat. Parity with the headline is
  the whole point.
- `build_workplan_goals_from_supabase` runs **before** the KPI merges — anything
  needing merged `kpis` must be a **post-pass**, not inlined in the build.
- The Annual Workplan table is `render_annual_goals_table_html` (it overwrites
  `render_workplan_goals_html` into the same markers) — only the annual renderer
  needed the Current/title changes; `workplan_goals` rows carry no `current`.
- jsdom `runScripts:"outside-only"` leaves `readyState="loading"`, so an IIFE that
  defers to `DOMContentLoaded` won't bind until you **dispatch that event** in the
  test.

### Next / not done

- The 5 mapped KPIs going live means the headline card ↔ Annual Workplan Current
  agree by construction; the **project-GRID card** big number (`kpi_metric`) is a
  separate surface — `docs/dashboard_card_metrics_recommendations.md` item 1's
  card-sync could reuse `PID_TO_KPI_KEY` the same way if Sam wants the grid cards
  driven live too (deferred — the grid card keeps its editable `kpi_metric`).
- Percentage manual Currents (e.g. 3.4) render the raw decimal in the Python table
  (matches the existing GOAL/STRETCH pct behavior); the JS editor handles `%`
  via `data-pct`. Unifying the Python-side pct display is a pre-existing,
  out-of-scope inconsistency.
