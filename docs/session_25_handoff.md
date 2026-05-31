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
  - Docs PR (this session's checkpoint): Session 24 lessons entry, the new KB
    methodology note above, CLAUDE.md roadmap row, INDEX.md, this handoff.
    (Landed as a small follow-up because #213 merged before docs were bundled —
    no harm; the code was clean.)

YOUR PRIORITY WORKSTREAM — finish Excel retirement (2 pieces + the sunset left):
  KPI-LADDER INLINE EDITOR (next, Sam's locked choice = a DASHBOARD editor, not
     Supabase-direct). The ladder cells (kpi_goal_2526 … kpi_stretch_2930)
     already RENDER on the Workplan Goals tab. The data now lives in Supabase
     workplan_goals as kind='project' GOAL/STRETCH rows (PR-1). Build per-cell
     click-to-edit mirroring workplan_goals.js (shared cpl_sb magic-link auth,
     PATCH workplan_goals?activity_id=eq.{pid}&row_type=eq.{GOAL|STRETCH}&
     kind=eq.project, optimistic paint + rollback). The Activity-Metrics KPI
     cards + the project cards read the SAME ladder off CPL_Data.js, so a live
     edit only persists to Supabase; the rendered ladder refreshes on the next
     daily regen (same model as the other editors). RLS on workplan_goals
     already gates writes to is_allowed_reviewer() (Phase 1 RLS-tighten).
  BUDGET INLINE EDITOR (optional, independent, no fork; mirrors
     projects_editor.js / workplan_goals.js). Budget read-path already cut over
     (PR #189). RLS on budget_funding/personnel — verify before wiring writes.
  PR-4 — sunset read_projects() + drop the .xlsx, keep a Supabase→xlsx backup
     export. ONLY after the editors land + one daily cron confirms parity with
     D.* gone. read_projects() still supplies excel_row + the total-outage
     fallback + the per-project Excel ladder fallback — so its removal also
     retires those (the ladder fallback is moot post-PR-1; excel_row powers the
     "Open in Excel for the Web" deep-links — decide its fate, scope-doc Fork 4
     says drop).
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
| Session 24 docs (lessons/KB-note/roadmap/INDEX/handoff) | follow-up docs PR (this checkpoint) |
| KPI-ladder inline editor (dashboard) | **NEXT** — not started (Sam chose dashboard editor) |
| Budget inline editor | queued (optional, independent) |
| Excel PR-4 (sunset read_projects + drop xlsx) | queued (after editors + 1 cron parity) |
| Vision 2030 / Personnel migration | N/A — confirmed no migration needed |
| over-merge re-mint apply (Session 18) | STAGED, gated on Sam's dispatch (separate track) |

Pipeline viz correctly SKIPPED this checkpoint (no re-mint / auditor run / M-ID
phase change — Excel retirement is a separate workstream). Re-run the auditor +
refresh #tab-pipeline when you next move the M-ID pipeline.
