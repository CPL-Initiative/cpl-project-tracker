---
title: Session 24 Hand-off Prompt
date: 2026-05-31
session: 23 → 24 hand-off ("Bruh 23" → next)
status: hand-off — paste the fenced block into Session 24's first message
tags: [handoff, session-prompt, excel-retirement, kpi-ladder, supabase]
related:
  - docs/excel_to_supabase_lessons.md (the active workstream notebook — read the Session 23 section)
  - docs/kb-notes/excel-retirement-final-scope.md (the 4-PR retirement plan + forks)
  - docs/kb-notes/methodology-parity-test-cutover-proof.md (the cutover proof discipline)
  - docs/dashboard_cleanup_lessons.md (Session 23: #2 + #3 close-out)
  - CLAUDE.md §11 roadmap (Excel→Supabase + the Session 23 row)
moniker_suggestion: Bruh 24 / "Two-Four" — or claim your own
---

# Session 24 Hand-off Prompt

A capsule from Session 23 ("Bruh 23" — cleared the last cleanup carryover, then
broke Excel's grip on the KPI ladder). Paste the fenced block into Session 24.

## Moniker

Session 23 ran fast and clean: four PRs merged + a measure-first Excel-retirement
keystone. Pick your own moniker — the lineage is loose.

## The prompt

```
You are Session 24 on the CPL Project Tracker. Read these first, in order:
  1. CLAUDE.md (all of it — esp. Critical Rules 1 & 4, the Branch Policy
     auto-merge gates, §6/§6b Supabase + daily cron, §11 roadmap + the
     Session 23 row).
  2. docs/excel_to_supabase_lessons.md — read the "Session 23" section (the
     active workstream).
  3. docs/kb-notes/excel-retirement-final-scope.md — the 4-PR retirement plan
     + the 5 forks (3 already answered by Sam, see below).

WHAT SHIPPED IN SESSION 23 (all merged to main):
  - #2 sidebar sub-links (PR #208): data-sections expanded on Activities &
    Projects (Activity Metrics #activityKpiSection + Projects #projectsGrid)
    and Budget (5-Year Funding / Expenditure / Personnel — 4 stable ids added
    to the generator's budget divs). tabs.js scroll-spy already wired.
  - #3 MID/CID/CCNID (PR #209): DISPLAY-ONLY (Sam's call — "just cosmetic, not
    touching keys"). idSysLabel/id_sys_label maps the value at ~9 render sites
    (CCR filter/modal/badges/Unify, CER badge, Articulations-by-Course chips).
    Stored id_system value + the 224 anchor keys UNTOUCHED. The data-value
    rename on roadmap row 1e-5d is SUPERSEDED.
  - Excel retirement SCOPE (PR #210): docs/kb-notes/excel-retirement-final-scope.md.
    Corrected stale roadmap: Personnel already Supabase, Vision 2030 is static/
    computed — NEITHER needs migration.
  - Excel PR-1 — KPI-ladder keystone (PR #211): the ladder (kpi_goal_2526…
    kpi_stretch_2930) in CPL_Data.js now sources from Supabase workplan_goals,
    NOT Excel. New _build_wg_ladder() + load_projects() enrichment (Excel ladder
    kept as per-project fallback). PARITY EXACT: regenerated CPL_Data.js
    byte-identical across all 49 projects (0 diffs). The blank-vs-0 crux was
    EXACTLY 11 cells — fixed live in Supabase workplan_goals (UPDATE…=NULL;
    project 1.4's two real 0s kept). Pre-fix snapshot archived at
    archive/workplan_goals_2026-05-31_pre-ladder-nullfix.json (reversible).

⚠ LIVE DB CHANGE you should know about: I NULLed 11 workplan_goals cells
  (5.1 GOAL yrs 1-4 + STRETCH all 5; 4.1.3 & 4.1.4 final-year STRETCH) so NULL
  means "no goal" vs a literal 0. Reversible from the archived pre-fix snapshot.
  The committed kb/workplan_goals_snapshot.json was synced to match; the daily
  cron re-fetches it from live going forward.

YOUR PRIORITY WORKSTREAM — finish Excel retirement (it's now small + mechanical):
  PR-2 — migrate the 15 D.* cohort-helper rows off Excel. Sam's fork answer
     (recommended): kind='kpi_helper' in workplan_goals (reuses table/RLS/loader/
     snapshot — no new migration). Repoint build_activity_kpis() +
     derive_core_activity_ids() (both currently read D.* from read_projects).
     Validator + dry-run + apply mirror Phase 1/2 gates (tiny — 15 rows).
  KPI-ladder inline editor — Sam chose a DASHBOARD inline editor (not Supabase-
     direct) for editing ladder year-targets. Build on the Workplan Goals tab
     (cells already render there); mirror workplan_goals.js's editor.
  Budget inline editor — optional, independent, no fork; mirrors projects_editor.js.
  PR-4 — sunset read_projects() + drop the .xlsx, keep a Supabase→xlsx backup
     export. Only after the above land + one cron confirms parity.

  Vision 2030 + Personnel need NO migration (confirmed in PR-1 recon).

PATTERNS THAT WORKED THIS SESSION:
  - Measure-first beats the summarized count: the "blank-vs-0 gap" sounded big;
    a cell-by-cell Excel-vs-Supabase compare showed it was 11 cells, 0 mismatches.
  - Supabase MCP execute_sql (read-only) is your measure-first tool when there's
    no SUPABASE_SERVICE_KEY in the container. project_id = hvuwhnbuahrtptokpqfh.
  - Run excel_to_dashboard.py locally (pip install openpyxl pandas; snapshot
    fallbacks cover the missing key). Parity gate = regen + diff the field vs
    the old source; byte-identical = ship. Idempotency = run twice, timestamp-
    only diff. Ship structure-only (revert data-file churn) for a tight diff.
  - For a "cosmetic rename," prefer a display-label map at render sites over a
    stored-value rename (zero data/key risk; safe against prose/glossary).
  - Open PR as draft → mark ready immediately → squash-merge on green CI
    (TruffleHog is the only required PR check; CodeQL is push/weekly). Sam often
    hits merge himself fast.

SAFETY TO HONOR:
  - Rule 1 (change the generator, not regenerated HTML) + Rule 4 (CPL_Dashboard
    .html == index.html). Rule 5 (never force-push main).
  - Live Supabase is shared: only kb_curation/allowed_reviewers/workplan_goals/
    projects/budget tables in scope; snapshot before a data fix (reversibility);
    schema migrations + destructive ops need Sam's nod (he pre-authorizes via
    the AskUserQuestion that starts the PR).
  - Don't read/cat the big coci_*.json / unified_*.js into context (overflow) —
    inspect via scripts that print counts/samples.
  - Feature branch claude/<desc>; squash-merge on green CI (no Sam gate, alpha).
```

## Carryover status

| Item | Status |
|---|---|
| #2 sidebar sub-links | **DONE + MERGED** (PR #208) |
| #3 MID/CID/CCNID (display-only) | **DONE + MERGED** (PR #209) |
| Excel retirement scope | **DONE + MERGED** (PR #210) |
| Excel PR-1 (KPI-ladder keystone) | **DONE + MERGED** (PR #211) |
| Excel PR-2 (D.* helpers → kind='kpi_helper') | **NEXT** — not started |
| KPI-ladder inline editor (dashboard) | queued (Sam chose dashboard editor) |
| Budget inline editor | queued (optional, independent) |
| Excel PR-4 (sunset read_projects + drop xlsx) | queued (after PR-2 + editors) |
| over-merge re-mint apply (Session 18) | STAGED, gated on Sam's dispatch (separate track) |

Pipeline viz correctly SKIPPED this checkpoint (no re-mint / auditor run / M-ID
phase change — Excel retirement is a separate workstream). Re-run the auditor +
refresh #tab-pipeline when you next move the M-ID pipeline.
