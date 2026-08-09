---
superseded: true
superseded_by: session_132_handoff.md
---

# Session 86 handoff — you are Session 86

You are **Session 86** of the CPL Project Tracker (COBI) build. Session 85
(**SkyLight**) made the **Annual Workplan tab the authoritative source** — the
"Current" column is now a live/manual hybrid and titles are editable there. Pick
your own moniker (Sky/Star streak).

## TL;DR of what Session 85 shipped (1 code-only PR)
The scoped priority (`docs/annual_workplan_authoritative_scope.md`), now BUILT:
1. **"Current" column HYBRID** — ended the 96,449-vs-~100k drift. `PID_TO_KPI_KEY`
   is now a module const in `excel_to_dashboard.py` (and **3.2 fixed**
   `eligible_units`→`transcripted_units`). The 5 mapped sub-activities
   (3.1/3.2/2.1/3.3/4.1.1) drive "Current" from the **live** headline KPI
   (read-only, verbatim string + `live · as of` badge → matches the card by
   construction); the rest store an **editable manual** value in the new
   `workplan_goals.current` Supabase column (falls back to Excel `kpi_metric`).
   Sequencing: build runs before the KPI merges, so the live sync is a post-pass
   `apply_live_workplan_current()` after both merges.
2. **Authoritative titles** — the Annual Workplan table renders `projects.name`
   (single store) and the title cell is click-to-edit → PATCH `projects.name`.
3. Editors in `workplan_goals.js` (`saveCurrent`/`saveTitle`, magic-link `cpl_sb`);
   live cells carry no edit attr (read-only by construction).

Tests: `kb/_test_workplan_current_hybrid.py` (30) + `tests/workplan_goals_authoritative.test.js`
(26); **110 files green**; full generator run EXIT 0. Code-only PR → the
post-merge `daily-dashboard.yml` dispatch publishes the HTML.

## Read these first (in order)
1. `docs/annual_workplan_authoritative_lessons.md` — the full Session-85 story + pitfalls.
2. `docs/kb-notes/methodology-live-vs-manual-hybrid-column.md` — the reusable pattern.
3. `docs/dashboard_card_metrics_recommendations.md` — item 1's grid-card sync is the open follow-on.
4. `CLAUDE.md` §11 "Session 85" + §8 (`workplan_goals.current` / `projects.name`).

## First things to check
- **Confirm the publish landed.** After the PR merged, the dispatch should have
  regenerated the HTML. Open `#workplan-goals`: the 5 mapped Current rows show the
  live value + `live · as of` badge (read-only); every other Current cell + the
  titles are click-to-edit when signed in. If the dispatch didn't fire, dispatch
  `daily-dashboard.yml`.
- **Sam's confirm item** is in the To-Do feed (`annual-workplan-confirm`).

## Open follow-on for THIS workstream (small)
- **Grid-card big number sync** (`docs/dashboard_card_metrics_recommendations.md`
  item 1): the project-GRID card's `kpi_metric` (e.g. 3.1 shows 43,630) still
  drifts from the live headline. Could reuse `PID_TO_KPI_KEY` + a post-pass the
  same way IF Sam wants the grid cards driven live (it'd remove the editable
  `kpi_metric` affordance on those 5 — confirm first). Deferred this session.

## Carryover / standing lanes (unchanged)
- **Unverified-M-ID renumber** — `docs/unverified_mid_renumber_scope.md` (#494).
- **TMC Phase-2 acceptance engine** — `docs/kb-notes/tmc-co-review-scope.md`.
- **CPL-Assistant CCR/CER recommender ETL** — `docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md`.
- **Strategy NOW lane** — institution-owned GitHub/Supabase, `cobi-auth.js` consolidation, a11y CI, DSA paperwork.

## Patterns that worked (reuse them)
- **Live-vs-manual hybrid column** — per-row `source` flag, live cells render
  verbatim + carry NO edit attr (read-only by construction), manual cells get the
  editor; the live sync is a **post-pass after the merges**, not inlined in the
  build that runs before them. `docs/kb-notes/methodology-live-vs-manual-hybrid-column.md`.
- **Single-store titles** — repoint the render to the authoritative store
  (`projects.name`) + add an editor on the new surface PATCHing that same field.
- **Code-only PR + post-merge dispatch** — never commit the heavy regenerated
  artifacts; let `daily-dashboard.yml` publish the HTML (Session-41 artifact policy).

## Safety patterns to honor
- **Rule 4** (`CPL_Dashboard.html` === `index.html`) — untouched here (the JS is
  already wired into both; verify if you edit HTML). **Rule 5** (never force-push
  main). **Rule 8** (checkpoint). Merge-on-green (clean OR unstable), squash, ready→merge.
- `build_workplan_goals_from_supabase` runs **before** `merge_live_metrics` +
  `merge_exhibit_metrics` — anything needing merged `kpis` is a post-pass.
- Live KPI values are sometimes abbreviated strings (`"100k"`, `"$321M"`) — render
  verbatim; don't reformat.
- jsdom `runScripts:"outside-only"` leaves `readyState="loading"` → dispatch
  `DOMContentLoaded` so a deferred IIFE's `init()` binds in the test.

## Moniker
Session 85 was **SkyLight**. Claim your own.
