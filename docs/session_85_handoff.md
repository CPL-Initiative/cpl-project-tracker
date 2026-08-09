---
superseded: true
superseded_by: session_132_handoff.md
---

# Session 85 handoff — you are Session 85

You are **Session 85** of the CPL Project Tracker (COBI) build. Session 84
(**SkyScribe**) shipped a project **soft-delete** system, **fixed + leaned the
GitHub Pages deploy**, and added **computed Goal/Stretch progress bars** — then
scoped (Sam's call) the next big piece: the **Annual Workplan tab as the
authoritative source**. Pick your own moniker.

## TL;DR of what Session 84 shipped (6 PRs, all merged + live)

1. **Project soft-delete (#600, #605)** — a reviewer / team-phrase user can
   **Table** (pause) or **Archive** (close) a project. It leaves the live priority
   surfaces and moves to a collapsed **"Tabled & Archived"** section; reversible
   (♻ Restore). Supabase **`project_lifecycle`** overlay (absence = active; write
   `is_allowed_reviewer() OR team_pass_ok()`) + committed `kb/project_lifecycle.json`
   ledger + static `project_lifecycle.js` (the `card_updates.js` overlay pattern).
   **Removed from ALL surfaces** — grid card, Annual Workplan tables, Activity
   Metrics cards, and the **RACI matrix** (the generator excludes tabled from
   `build_activity_kpis`; `raci.js` filters `buildItems` by the overlay live).
2. **Pages fixed + leaned (#601, #602)** — `.nojekyll` unstuck the hung Jekyll
   build; a **custom lean `pages.yml`** publishes only browser-served files
   (**~553 → ~192 MB, −65%**, 0 served files dropped). Source is now **"GitHub
   Actions"**. Triggers = push + **`workflow_run` on "Daily CPL Dashboard"** + dispatch.
3. **Computed progress bars (#604)** — Activity KPI card bar = **Goal (blue) +
   Stretch (gold)** from `current ÷ current-FY target`; manual fallback otherwise.
4. **Card-metrics recommendations (#603)** + the **authoritative-source scope** (#605 doc).

## Read these first (in order)
1. **`docs/annual_workplan_authoritative_scope.md`** — **YOUR PRIORITY** (below).
2. **`docs/project_lifecycle_lessons.md`** — the soft-delete arc + the RACI/activity wire-in.
3. **`docs/pages_lean_deploy_scope.md`** — the lean Pages workflow + the `workflow_run` insight.
4. **`docs/dashboard_card_metrics_recommendations.md`** — item 1 (KPI sync) folds INTO your priority.
5. **`CLAUDE.md`** §11 "Session 84" + §8 (`project_lifecycle`) + the `project_lifecycle.js` File Inventory row.

## Priority workstream — Annual Workplan tab = authoritative source (SCOPED, decisions locked)
Build `docs/annual_workplan_authoritative_scope.md`. Two parts, Sam's decisions locked:
1. **Hybrid "Current" column.** The Annual Workplan "Current" is `project.kpi_metric`
   (manual) while the headline KPI is the live scrape → they drift (3.2: 96,449 vs
   ~100k). Build: **KPI-mapped sub-activities** (the `pid_to_kpi_key` 5) pull the
   **live** value read-only (+ `live · as of` badge); **unmapped** ones become
   **manually editable in the Annual Workplan tab** (new `workplan_goals.current`
   Supabase column + a CURRENT-row editor in `workplan_goals.js`). **Verify the 3.2
   mapping** (eligible vs transcripted units). This also fixes the card-vs-KPI item.
2. **Editable, single-source titles.** Titles live in two stores (`projects.name`
   vs `workplan_goals.name`). Pick **`projects.name`** as the one store, add
   **title editing** to the Annual Workplan tab, render from it.
   Exact files/lines are in the scope doc.

## Carryover / standing lanes (unchanged)
- **Unverified-M-ID renumber** — `docs/unverified_mid_renumber_scope.md` (#494).
- **TMC Phase-2 acceptance engine** — `docs/kb-notes/tmc-co-review-scope.md`.
- **CPL-Assistant CCR/CER recommender ETL** — `docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md`.
- **Strategy NOW lane** — institution-owned GitHub/Supabase, `cobi-auth.js` consolidation, a11y CI, DSA paperwork.

## Patterns that worked (reuse them)
- **Soft-delete a generated entity via an overlay table** (absence = active) +
  default-include/explicit-remove + a must-exist assertion — `docs/kb-notes/playbook-soft-delete-generated-entity-via-overlay.md`.
- **Lean Pages: `git archive` + prune + ASSERT served paths** so an over-aggressive
  exclude fails the build loudly instead of shipping a broken site.
- **`GITHUB_TOKEN`-pushes don't self-trigger workflows** → a cron-committed deploy
  needs a **`workflow_run`** trigger, not just `push` (else the site goes silently stale).
- **Affordance-visibility vs action-eligibility** — show the 🗄/edit control to
  everyone; gate the *write* in the popup (so the unlock is reachable).
- **Self-contained overlay module** mounted globally, host renderer untouched
  (`project_lifecycle.js` didn't change `raci.js`'s render; raci's 70-check suite stayed green).

## Safety patterns to honor
- **Rule 4** (`CPL_Dashboard.html` === `index.html`), **Rule 5** (never force-push main),
  **Rule 8** (checkpoint). Merge-on-green (clean OR unstable), squash, ready→merge.
- **Pages source is now "GitHub Actions"** — if a deploy breaks, the `pages.yml`
  served-path **assertion** is the guard; rollback = flip Source back to branch (`.nojekyll` keeps it fast).
- After a generator/code merge, **dispatch `daily-dashboard.yml`** to publish (it → `workflow_run` → lean Pages deploy).
- Tabled-project test setup: `raci.js` `ACTIVITIES` is **1–4** only; nest test projects under an emitted activity.

## Moniker
Session 84 was **SkyScribe**. The Sky/Star streak lives on — claim your own.
