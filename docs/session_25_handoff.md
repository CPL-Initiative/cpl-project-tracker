---
title: Session 25 Hand-off Prompt
date: 2026-05-31
session: 24 → 25 hand-off ("Bruh 24" → next)
status: hand-off — paste the fenced block into Session 25's first message
tags: [handoff, session-prompt, excel-retirement, kpi-ladder-editor, supabase]
related:
  - docs/excel_to_supabase_lessons.md (the active workstream notebook — read the Session 24 section)
  - docs/kb-notes/excel-retirement-final-scope.md (the retirement plan; D.* fork now resolved = delete)
  - docs/kb-notes/methodology-verify-consumer-before-migrating.md (the Session 24 lesson)
  - docs/kb-notes/methodology-parity-test-cutover-proof.md (the cutover proof discipline)
  - CLAUDE.md §11 roadmap (Excel→Supabase row + the Session 24 PR-2 entry)
moniker_suggestion: Bruh 25 / "Two-Five" / "Quarter" — or claim your own
---

# Session 25 Hand-off Prompt

A capsule from Session 24 ("Bruh 24" — turned a planned migration into a
dead-code deletion by auditing the consumer graph first). Paste the fenced
block into Session 25.

## Moniker

Session 24 was a tight one-PR session: caught that the "migrate the D.* rows"
task was actually "delete 15 vestigial rows + their dead reader." Pick your own
moniker — the lineage is loose.

## The prompt

```
You are Session 25 on the CPL Project Tracker. Read these first, in order:
  1. CLAUDE.md (all of it — esp. Critical Rules 1 & 4, the Branch Policy
     auto-merge gates, §6/§6b Supabase + daily cron, §11 roadmap + the
     Session 24 PR-2 row).
  2. docs/excel_to_supabase_lessons.md — read the "Session 24" section (the
     active workstream); skim Session 23 above it for the ladder repoint.
  3. docs/kb-notes/excel-retirement-final-scope.md — the retirement plan. The
     D.* fork (Fork 3) is now RESOLVED: deleted, not migrated.
  4. docs/kb-notes/methodology-verify-consumer-before-migrating.md — the
     Session 24 lesson (audit who READS a data class's values before migrating).

WHAT SHIPPED IN SESSION 24 (merged to main):
  - Excel PR-2 — D.* rows RETIRED (PR #213, merged b4d1868). The 15 D.*
    sub-population helper rows (Students/Units/Transcribed/Savings/20yr ×
    Military/Workforce/Apprentice) were 100% VESTIGIAL: their only value-reader,
    populate_current_metrics(), has been DEAD CODE since 2026-05-28 (Phase 1
    PR-4 moved annual-goals "Current" to build_workplan_goals_from_supabase();
    the call was dropped, the def left behind). Every other ref EXCLUDES D.*
    (grid/count/leads/derive_core_activity_ids); all 3 JS report gens skip them.
    So: deleted the rows + the dead populate_current_metrics()/_override_int/
    _pmetric_int/_ppct/_pcount cluster. Generator-only.
      · load_projects(): dropped the helper_rows append (projects = the 34 real
        Supabase projects); Excel-outage fallback filters D.* too.
      · read_update_log(): skips D.* pids (no orphaned update_log residue).
      · kb/_test_projects_parity.py: D.* assertion → a no-leak guard.
      · PROVEN: regenerated projects/update_log == committed CPL_Data.js MINUS
        exactly the 15 D.* ids, 34 real project objects byte-identical, on BOTH
        the snapshot AND forced-Excel-fallback paths. CPL_Data.js sheds the 15
        D.* project + 15 D.* update_log entries on the next daily regen.
  - Budget inline editor (PR #215) — click-to-edit dollar cells on the Budget
    tab's 5-Year Funding Plan (budget_editor.js, mirrors projects_editor.js). 7
    cells/row PATCH budget_funding; no total=Σyears/avg formula yet (Sam: later).
    + budget_funding/budget_expenditures/personnel RLS tightened to
    is_allowed_reviewer() live (was loose "Allow auth write"). Found the
    KPI-ladder editor was ALREADY DONE (subsumed by PR-1 + workplan_goals.js) —
    no build needed; 2nd measure-first "already exists" catch this session.
  - Docs: Session 24 lessons entries, the KB methodology note, CLAUDE.md roadmap,
    INDEX.md, this handoff. (PR #213's docs landed as follow-up #214 because Sam
    merged #213 before docs were bundled; the Budget editor's docs are bundled
    INTO #215.)

SESSION 24 ROUND 2 RESOLVED BOTH EDITORS (so the priority shifted — see below):
  - KPI-LADDER INLINE EDITOR = ALREADY DONE (no build needed). Measure-first:
    PR-1 sourced the ladder (kpi_goal_2526…) FROM workplan_goals, and
    workplan_goals.js (Phase 1 PR-5) already edits all 27 of those GOAL/STRETCH
    cells on the Workplan Goals tab. Cross-checked: 27 ladder-bearing projects
    all editable, 7 blank (5.2–5.8), 0 Excel-fallback gaps. Roadmap was stale.
  - BUDGET INLINE EDITOR = BUILT (PR #215). budget_editor.js, 7 dollar cells per
    budget_funding row, mirrors projects_editor.js. NO total=Σyears/avg formula
    yet (Sam: later PR). budget_funding/budget_expenditures/personnel RLS
    tightened to is_allowed_reviewer() live this session.

YOUR PRIORITY WORKSTREAM — the Excel-retirement FINALE (editors are done):
  (1) BUDGET FORMULA LAYER — add total=Σ(5 years) + avg=total/5 to the Budget
     editor (recompute on a year-cell edit, PATCH total+avg, then render total/
     avg READ-ONLY). Sam explicitly wants this as its own PR. The relationship
     is confirmed in budget_funding (total=Σyears, avg=total/5).
  (2) PERSONNEL EDITOR — the 2nd budget table. BLOCKER first: the live personnel
     table is 26 rows deduped to 13 in _load_budget.py (_dedupe_personnel), so a
     displayed row maps to multiple underlying ids — resolve row identity before
     wiring PATCH (e.g. dedupe-by-canonical-id, or collapse the dupes in the
     table). RLS already tightened this session.
  (3) PR-4 — drop the .xlsx. Measure-first AUDIT every remaining reader before
     teardown: read_projects() (fallback + excel_row), read_budget_plan()
     (factors/year_labels — still Excel!), read_update_log(), read_config_
     overrides(), the KPI_Config sheet. Each needs a Supabase/JSON home or a
     deliberate drop. Then sunset them + delete the file, keeping a Supabase→xlsx
     backup export (scope-doc Fork 5). excel_row powers "Open in Excel for the
     Web" deep-links — scope-doc Fork 4 says drop.
  Vision 2030 + Personnel need NO migration (confirmed Session 23 recon).

PATTERNS THAT WORKED THIS SESSION:
  - AUDIT THE CONSUMER GRAPH before migrating. grep the literal ids for readers,
    then `grep -c "funcname("` to prove a def is uncalled. Filter out
    pass-through + exclusion-guard + dead-reader refs; only a live value-read
    justifies a migration. The plan said "D.* feeds build_activity_kpis cohort
    composites" — the code said build_activity_kpis only EXCLUDES them. Trust
    the code over the summarized plan.
  - When the code contradicts the documented plan AND the call is the owner's
    (delete vs preserve data, or a schema change), surface it via ONE
    AskUserQuestion with a clear recommendation. Sam chose delete.
  - Parity-MINUS-X proof: regenerate, then assert new output == committed output
    minus exactly the deleted ids, everything else byte-identical. Run it on
    every fallback path (snapshot AND Excel), not just the happy path.
  - Supabase MCP execute_sql (read-only) is the measure-first tool when there's
    no SUPABASE_SERVICE_KEY in the container. project_id = hvuwhnbuahrtptokpqfh.
    Run excel_to_dashboard.py / harnesses locally with `pip install openpyxl
    pandas` (snapshot fallbacks cover the missing key).
  - Generator-only ships for a tight diff: prove the regen locally, but let the
    daily cron regenerate the data files (Rule 1). Vestigial residue lingering
    one extra day in CPL_Data.js is harmless.

SAFETY TO HONOR:
  - Rule 1 (change the generator, not regenerated HTML/JS) + Rule 4
    (CPL_Dashboard.html == index.html). Rule 5 (never force-push main).
  - Live Supabase is shared: only kb_curation/allowed_reviewers/workplan_goals/
    projects/budget tables in scope; snapshot before a data fix (reversibility);
    schema migrations + destructive ops need Sam's nod (he pre-authorizes via
    the AskUserQuestion that starts the PR). The KPI-ladder editor needs NO
    schema change (the columns exist; RLS exists).
  - Don't read/cat the big coci_*.json / unified_*.js / coci_course_list.xlsx
    into context (overflow) — inspect via scripts that print counts/samples.
  - Feature branch claude/<desc>; open PR as draft → mark ready immediately →
    squash/merge on green CI (TruffleHog is the only required PR check; CodeQL
    is push/weekly). Sam often hits merge himself FAST — if you're bundling docs
    into a PR, push them BEFORE marking ready (he merged #213 before the docs
    landed this session; landed them as a clean follow-up, no harm).

SEPARATE TRACK (not Excel retirement):
  - Over-merge re-mint apply (Session 18) is STAGED + gated on Sam's
    workflow_dispatch — leave it unless he asks. Pipeline viz (#tab-pipeline) +
    the auditor: refresh only when you next move the M-ID pipeline (not this
    workstream).
```

## Carryover status

| Item | Status |
|---|---|
| Excel PR-1 (KPI-ladder keystone) | **DONE + MERGED** (PR #211, Session 23) |
| Excel PR-2 (D.* rows retired) | **DONE + MERGED** (PR #213, Session 24) |
| KPI-ladder inline editor | **ALREADY DONE** (Session 24 measure-first — subsumed by PR-1 + workplan_goals.js; no build) |
| Budget inline editor | **DONE** (PR #215, Session 24) + budget/personnel RLS tighten (live) |
| Budget total/avg formula layer (+ total read-only) | **NEXT** — Sam wants its own PR |
| Personnel editor | queued (BLOCKER: resolve the 26→13 dedupe row identity first) |
| Excel PR-4 (sunset .xlsx + all readers) | queued (after the above; measure-first reader audit first) |
| Vision 2030 / Personnel migration | N/A — confirmed no migration needed |
| over-merge re-mint apply (Session 18) | STAGED, gated on Sam's dispatch (separate track) |

Pipeline viz correctly SKIPPED this checkpoint (no re-mint / auditor run / M-ID
phase change — Excel retirement is a separate workstream). Re-run the auditor +
refresh #tab-pipeline when you next move the M-ID pipeline.
