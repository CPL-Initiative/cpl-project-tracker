---
title: Project lifecycle — Table / Archive a project (soft-delete) lessons
date: 2026-06-29
session: 84 (SkyScribe)
tags: [cobi, projects, soft-delete, supabase-overlay, raci, lessons]
artifacts:
  - kb/supabase_project_lifecycle.sql
  - kb/_load_projects.py (load_project_lifecycle)
  - kb/project_lifecycle.json (committed ledger)
  - excel_to_dashboard.py (render_tabled_archived_section + the 3 filter points)
  - project_lifecycle.js
  - dashboard_filters.js (data-lifecycle guard)
  - tests/project_lifecycle.test.js
related:
  - docs/kb-notes/playbook-project-lifecycle-soft-delete.md
  - docs/kb-notes/methodology-server-enforced-shared-password-gate.md
  - CLAUDE.md §8 (project_lifecycle) + File Inventory (project_lifecycle.js)
---

# Project lifecycle — Table / Archive a project (soft-delete)

## The ask (Sam, 2026-06-29)

> "I need a way to delete a project (screenshot) and have it noted as deleted or
> tabled in our KB (so it doesn't come up as a priority or is mentioned in
> anything). Recommendations?"

The screenshot was project **5.1 AI-Ready California Demonstration** — *NOT
STARTED, contingent on funding* — shown both as a project card AND in the Annual
Workplan Goals ladder table.

Locked with Sam via AskUserQuestion: **soft-delete with two states (Tabled /
Archived) + a collapsed "Tabled & Archived" section**, and **build it this
session** (not hard delete; not a recommendation-only doc).

## Why soft-delete, not hard delete

A hard `DELETE` on `public.projects` would orphan the project's RACI assignments
(`item_raci`) + update history (`item_updates`) and be irreversible. It also
collides with the off-limits guardrail on the `projects` table. Instead this is
a **separate overlay table** (`public.project_lifecycle`) — the same idiom as
`liftoff_state` / `factsheet_overrides` / `item_updates`: the core table is
untouched, and the absence of a row = the project is active.

This also matched a pre-existing locked decision (Session-25 strategic item #6:
*"ARCHIVE the project row — reversible, never hard-delete"*).

## Design — overlay + two layers (generator bake + live JS), like card_updates.js

```
public.project_lifecycle (project_id pk → state, reason, updated_by, updated_at)
  │  anon read · write = is_allowed_reviewer() OR team_pass_ok()
  ├─ kb/_load_projects.py:load_project_lifecycle()  → writes kb/project_lifecycle.json (the ledger)
  │
  ├─ excel_to_dashboard.py  (the daily bake-in — durable)
  │    • render_projects_grid_html: tabled cards render HIDDEN (data-lifecycle + display:none)
  │    • render_tabled_archived_section: a collapsed <details> with reason/date + ♻ Restore
  │    • CPL_DATA.projects + workplan_goals tables EXCLUDE tabled → drops from RACI / Annual
  │      Report / custom reports / the Workplan Goals ladder ("not mentioned in anything")
  │
  └─ project_lifecycle.js  (the live overlay — reconciles drift since the last regen)
       • anon-reads the overlay; hides a just-tabled card + builds its entry; restores one
         that left the overlay
       • 🗄 Table/Archive control on active cards + ♻ Restore on entries (reviewer / team-phrase)
```

The **"noted in the KB"** part is satisfied two ways: the overlay row carries
`reason / updated_by / updated_at` (the record), and the committed
`kb/project_lifecycle.json` ledger syncs into the Obsidian vault — so a removed
project reads as *"5.1 — TABLED 2026-06-29: contingent on funding"*, never as an
active priority.

## Decisions that kept the blast radius small

- **Three late, display-only filter points** (grid / `CPL_DATA.projects` +
  `workplan_goals` table renders). **Untouched:** `build_activity_kpis`,
  `render_workplan_charts_html`, `activity_kpis`. Rationale: a tabled project
  shouldn't retroactively rewrite an Activity's goal ladder or the student-count
  trend charts — those are Activity-level, not per-project lifecycle.
- **Tabled cards render HIDDEN in the grid (not removed)** with `data-lifecycle`,
  so a live **Restore** can un-hide the full card in the same session (a removed
  card couldn't be reconstructed client-side). `dashboard_filters.js` got a
  2-line guard so a filter-clear never un-hides a tabled card and never counts it.
- **CPL_DATA exclusion is the single lever** that drops a tabled project from
  every JS consumer at once (RACI `buildItems`, Annual Report, custom report
  generator all read `CPL_DATA.projects`). The chatbot was already safe — it only
  ingests `live_metrics.json`, never project text.
- **Gate = `is_allowed_reviewer() OR team_pass_ok()`** (the newest Session-83
  gate) so Malone & team can table via the shared phrase, reviewers via magic
  link. Client mirrors raci.js's `headersFor` exactly (anon key as the bearer —
  never an empty `Bearer ` — + `x-team-pass` header).

## Gotchas / carryover

- **⚠ The live team-phrase write path is unverified from the sandbox** (Supabase
  is egress-blocked → 403 at the proxy), same caveat as the Session-83 gate. Sam
  to confirm in a browser: Activities & Projects → sign in (or unlock the team
  phrase) → 🗄 on a card → Table with a reason → reload → it sits in the
  "Tabled & Archived" section + is gone from RACI/Annual Report; then ♻ Restore.
- **A just-tabled project leaves the live grid immediately** (the JS overlay) but
  only **bakes** into the collapsed section + drops from `CPL_DATA` on the next
  daily regen. Restoring a project that was baked-tabled at the last regen
  reappears in the grid on the next regen (instant feedback: its entry vanishes).
- Whole-goal-tabled is an unhit edge case — header counts already reflect active
  only; the hidden cards remain in the DOM for Restore.

## Tests

`tests/project_lifecycle.test.js` (25 checks): Rule 4 + both HTMLs include the
script; `indexOverlay` drops malformed rows; `entryHtml` escapes name+reason
(XSS) + carries the badge/Restore; `reconcile` hides an overlay card (incl. a
card-less pid) and restores a baked-tabled card no longer in the overlay; the
controls are auth-gated. Full suite: **108 files green**.

---

## 2026-06-29 (Session 84 checkpoint wrap) — wired across all surfaces + the deploy lane

(a) **What's been learned.** A soft-delete only feels "done" when the entity
disappears from *every* surface. The project fanned out further than the grid:
the **RACI matrix** and **Activity Metrics cards** both read
`CPL_DATA.activity_kpis` (built by `build_activity_kpis()` from the *full*
project list), so the `CPL_DATA.projects` exclusion didn't reach them. Fix:
feed `build_activity_kpis()` **active-only** projects (baked) + `raci.js`
`buildItems()` filters by the overlay (live). Headline KPIs come from live
metrics, not `activity_kpis`, so they're untouched. Same lesson as the goals
table — enumerate *all* consumers of the shared data structure, not just the
obvious one.

(b) **Current state.** Tabling a project now removes it from: the grid card, the
Annual Workplan targets table, the Activity Metrics cards, AND the RACI matrix —
live (client overlays + `raci.js` filter) and baked (generator). Reversible via
♻ Restore. The team-phrase/reviewer write path was confirmed live (Sam tabled
5.1 "Not considering this project at this time" + it persisted). Tests: 28
(`project_lifecycle`) + 7 (`raci_tabled`); suite 109 green.

(c) **Deploy lane (same session).** The Pages deploy was hung (Jekyll over 553 MB);
`.nojekyll` unstuck it, then a custom lean `pages.yml` (`git archive` + prune +
served-path assertion) cut the published site to ~192 MB. **Load-bearing insight:**
a cron commit made with `GITHUB_TOKEN` does **not** self-trigger a `push` workflow,
so the Pages deploy needs a **`workflow_run`** trigger on "Daily CPL Dashboard" —
else the daily regen silently leaves a stale site. Verified the `workflow_run`
→ deploy path green. KB note: `playbook-lean-custom-github-pages-deploy.md`.

(d) **Next step.** The Annual Workplan tab as the authoritative source — hybrid
Current (live for the `pid_to_kpi_key` 5, manual-editable otherwise) + editable
single-source titles. Scoped + locked: `docs/annual_workplan_authoritative_scope.md`.
