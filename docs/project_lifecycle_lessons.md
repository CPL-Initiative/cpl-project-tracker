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

---

## 2026-07-02 (Session 95) — the Activity ⇄ Project mixup: separation + the Archive-radio bug

### What happened

Sam tabled **23 cards in one morning sweep** (15:26–15:34 UTC) because they
looked "redundant with Activity cards" — and the Activity cards vanished with
them. Root cause is structural: the Activity-metrics KPI cards and the
Projects-Grid cards are the SAME `public.projects` rows rendered twice, and
Session 84 had *deliberately* wired the lifecycle overlay to hide the Activity
card too (lesson (b) above). 22 of the 23 were official sub-activities
(`1.1–1.4, 2.1–2.4, 3.1–3.6 incl. the 3.1.x population breakdowns, 4.1–4.5`);
one (`5.8`) was a real project caught in the sweep. All 23 rows landed as
`state='tabled'`, `reason=null`, `updated_by='(team)'` — which exposed a second
bug (below).

### The fixes (PR #652, squash-merged 2026-07-02; site rebuilt via post-merge dispatch)

1. **Restore** — the 23 mistaken Supabase rows were DELETED (receipt: ids above,
   all `updated_at` 2026-07-02 15:26–15:34 UTC). `5.1` (tabled 2026-06-29 with a
   reason, deliberately) was kept.
2. **Activity ⇄ Project separation (the invariant).** The **activity layer** =
   `derive_core_activity_ids(projects)` MINUS the legacy `5.x` family — i.e. the
   official 1.x–4.x workplan sub-activities that render Activity-metrics KPI
   cards. These ids are now **IMMUNE to `project_lifecycle`** at every consumer:
   - generator `main()` scrubs overlay rows on activity-layer ids right after
     `load_project_lifecycle()` (logged, ignored);
   - `project_lifecycle.js` mirrors the rule (`activityLayerIds()` from
     `CPL_DATA.activity_kpis`, minus `5.x`): reconcile skips them, no 🗄 control
     mounts on them (covers pre-regen HTML), stale entries are removed;
   - `raci.js` `load()` ignores overlay rows on immune ids.
   The `5.x` carve-out matters: **`5.1` carries a KPI ladder** (so it appears in
   `activity_kpis` when active) but is a REAL project Sam deliberately tabled —
   a first draft without the carve-out silently resurrected it (caught by the
   local regen A/B).
3. **Card dedup (Sam: "no redundant activity or project cards").** The Projects
   Grid no longer repeats activity-layer rows: grid = real work items only
   (`4.1.x` sprint children + `5.x` initiatives → 11 active + tabled 5.1). The
   Activity card already carried every affordance the grid card had (Latest
   Update / Workplan Note / history / Report / Attach / RACI / Update / Nudge),
   so nothing is lost. `CPL_DATA.projects` still ships ALL active rows (RACI
   tree + Annual Report need the sub-activities) — the dedup is render-only.
4. **The Archive-radio bug.** `project_lifecycle.js`'s document-level CAPTURE
   click handler walked ancestors and matched `.plc-modal-overlay` from ANY
   click inside the modal — so picking the Archive radio (or clicking the
   reason box) dismissed the modal instantly. Confirm "worked" only because the
   event's dispatch path is precomputed: the button's own listener still fired
   after the capture handler removed the overlay — always saving the DEFAULT
   `tabled` with an EMPTY reason. (That's why all 23 mixup rows were
   tabled/no-reason.) Fix: close only when `e.target` IS the backdrop.
   **Reusable lesson:** an overlay-click-closes handler must compare the click
   TARGET to the backdrop, never walk ancestors from an inner element.

### Verification

`tests/project_lifecycle.test.js` grew 28 → 42 checks (activity-card no-hide;
immunity end-to-end incl. the 5.x carve-out; modal survives inner clicks;
Confirm saves `archived` + reason; backdrop click still closes). Suite 124
green. Local regen A/B: grid = `4.1.1–4.1.4, 5.1(hidden/tabled), 5.2–5.8`,
activity_kpis = 22 (all restored), Tabled section = `5.1` only, Rule-4 mirror
byte-identical.

### Known edge (accepted)

A ladder-bearing `5.x` (today: only `5.1`) renders BOTH an Activity card and a
grid card when active — the one residual redundancy, invisible today because
5.1 is tabled. If Sam restores 5.1 and dislikes the double card, either move
its ladder out of `workplan_goals` or re-home the id under 1–4.

---

## 2026-07-02 (Session 95, continued) — Sam's poke-around round: charts, phantom row, add-project, AWG Projects section

Live feedback while Sam poked the rebuilt tabs, all landed the same afternoon
(second PR of the session):

1. **Path-to-2030 charts → CPL Analytics (Dashboard tab).** Sam: "move the 2
   graph charts to the CPL Analysis tab." `render_exhibit_analysis_html` gained
   `extra_top_html`; the Goal/Stretch trajectory charts now render at the top of
   the CPL Analytics body and left the Workplan Activity Metrics section (its
   bounded strip regex removes the previously-baked copy). Note: the charts now
   ride the analytics injection, which is skipped when no `CustomReport_*.json`
   exists (sandbox runs) — on the runner the data is always fetched. Verified
   via a stub-tables unit call (placement body → charts → cards-grid).
2. **The 4.1 Sprints phantom row.** The synthetic 4.1 composite in
   `build_activity_kpis` never inherited the real 4.1 row's `goal`, so it fell
   into the goal-less "Other" bucket — which renders as its OWN
   `.activity-kpi-grid`, visually a half-empty row + a lone card below. Fix:
   composite inherits the real row's goal (Goal 1).
3. **Add-project flow (`project_add.js`, NEW static asset).** "＋ Add project"
   next to the Projects (N) header + in the AWG Projects section header. Modal
   INSERTs `public.projects` (ID auto-suggested = next free `5.N` from the LIVE
   id list so tabled rows can't collide; Name/Description/Activity/CPL
   Goal/Lead/Status/Timeline). Auth = reviewer magic-link OR team phrase —
   `projects` INSERT/UPDATE policies widened to `is_allowed_reviewer() OR
   team_pass_ok()` (migration `projects_write_team_phrase_widen`, applied live;
   DELETE stays reviewer-only; schema of record
   `kb/supabase_projects_rls_tighten.sql`). Escaped optimistic card; modal
   closes on backdrop only (the lesson above, applied from birth). Tests:
   `tests/project_add.test.js` (24).
4. **AWG Projects section.** `render_awg_projects_section_html` + an injection
   with its own paired markers placed AFTER `<!-- End Annual Workplan Goals -->`
   (everything BETWEEN the AWG markers is overwritten by the annual-goals
   injection every run — the scout's key finding). Columns: ID · Project ·
   Activity chip (full text in title) · CPL Goal · Lead (live `card_raci.js`
   hook → RACI Responsible) · Status · Progress · Timeline. 11 work-item rows
   (4.1.x + 5.2–5.8); tabled excluded.
5. **Bonus idempotency fix.** The Projects-Grid replacement accreted **+1 blank
   line per regen** (198 had piled up inside the pane since the tab move — the
   replace emitted its own trailing newline while leaving the old one in the
   remainder). The replace now swallows the trailing blank-line run; a double
   regen is **byte-identical modulo the two timestamp lines** — the first time
   this file has been able to claim that.

### Verification

Suite **125** test files green (project_add 24 new). Double-run regen A/B:
byte-idempotent modulo timestamps; AWG Projects = 11 rows, single copy,
placed after End-AWG; grid still 11 projects / 22 sub-activities as Activity
cards; 4.1 inside the Goal 1 sub-grid.
