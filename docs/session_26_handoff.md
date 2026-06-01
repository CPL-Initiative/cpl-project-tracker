---
title: Session 26 Hand-off Prompt
date: 2026-06-01
session: 25 → 26 hand-off ("Bruh 25" → next)
status: hand-off — paste the fenced block into Session 26's first message
tags: [handoff, session-prompt, excel-retirement, data-pipeline, supabase]
related:
  - docs/kb-notes/excel-dependency-audit.md (the Excel-retirement P1–P5 plan; P1/P2/P4 now ✅)
  - docs/kb-notes/reference-daily-dashboard-data-pipeline.md (NEW — the daily-dataset accounting)
  - docs/excel_to_supabase_lessons.md (read the Session 25 section)
  - CLAUDE.md §11 roadmap (Excel→Supabase row — Session 25 status)
moniker_suggestion: Bruh 26 / "Two-Six" / "Deuce-Six" — or claim your own
---

# Session 26 Hand-off Prompt

A capsule from Session 25 ("Bruh 25" — shipped 3 Excel-retirement steps + a
daily-pipeline accounting doc; 5 PRs merged). Paste the fenced block into Session 26.

## The prompt

```
You are Session 26 on the CPL Project Tracker. Read these first, in order:
  1. CLAUDE.md (all of it — esp. Critical Rules 1 & 4, the Branch Policy
     auto-merge gates, §6/§6b Supabase + daily cron, §11 roadmap + the
     Session-25 Excel-retirement status).
  2. docs/kb-notes/excel-dependency-audit.md — the Excel-retirement P1–P5 plan
     (P1/P2/P4 now ✅ DONE; P3 parked; P5 + carve-outs remain). START HERE for
     the workstream.
  3. docs/kb-notes/reference-daily-dashboard-data-pipeline.md — NEW this session:
     the accounting of the whole daily dataset (7 sources, every KPI's lineage,
     the 9 CustomReport categories, the committed daily artifacts).
  4. docs/excel_to_supabase_lessons.md — read the "Session 25" section (measure-
     first + A/B-parity discipline); skim Session 24 above it.

WHAT SHIPPED IN SESSION 25 (all merged to main):
  - Excel P1 (#219) — the card "Update" button was a SharePoint Excel-for-the-Web
    deep-link (the reported bug: a curator clicked it and Excel opened). Repointed:
    now <a class="proj-update-btn"> that projects_editor.js intercepts → opens the
    card's Latest Update modal (signed-in) or nudges sign-in (signed-out). Dropped
    the akpi copy, the dashboard_filters.js SHARED_EXCEL_URL rewire + toolbar
    "Update Projects" button, the excel_cell_url cluster; stopped emitting excel_row.
  - Excel P4 (#220) — deleted dead readers read_annual_goals + read_workplan_goals
    (148 lines; zero call sites, measure-first). One stale docstring repointed.
  - Excel P2 (#221) — config off Excel into a committed kb/dashboard_config.json
    (new load_dashboard_config(); read_project_config/read_config_overrides/
    read_kpi_parameters rewritten, drop wb). DELETED the ensure_kpi_config_sheet
    WRITER — the master .xlsx is NO LONGER WRITTEN on any run (writer-blockers 2→1).
    Measure-first: Col AG empty + KPI_Config == code defaults, so the JSON holds
    only the 4 real project_config fields. Parity-proven (byte-identical readers +
    full A/B regen). Budget factors/year_labels carved out to P5.
  - Daily data-pipeline reference doc (#222 + §5 #223) — Sam commissioned an
    accounting of the daily dataset now that Excel is being abandoned. Maps all 7
    sources, every headline KPI's lineage, the 9-pulled/7-consumed CustomReport
    datasets, the committed daily artifacts, inspection commands. Sam's screenshot
    confirmed the Custom Reporting Module offers exactly 9 categories, all pulled
    (151 fields) — only College Contacts + College Users & Roles are fetched-but-
    UNUSED.
  - Docs: CLAUDE.md §11, the lessons doc, INDEX.md, this handoff.

YOUR PRIORITY WORKSTREAM — finish Excel retirement (audit doc is the plan). The
master .xlsx is already never written; closing it out is now about the remaining
READERS. Pick from (no hard ordering — confirm with Sam if unsure):
  (A) DECISION FROM THE PIPELINE DOC §5 — College Contacts (32 fields) + College
     Users & Roles (11) are fetched into the 91 MB CustomReport blob but UNUSED.
     Sam to choose: drop both from fetch_custom_report.py REQUEST_PAYLOAD (tiny
     edit, stops fetching unused personnel PII — my rec) OR wire a per-college
     contacts panel (AO / CPL Coordinator / VRC official are in the payload).
  (B) P5 BUDGET FACTORS — migrate read_budget_plan's factors/year_labels (Excel
     rows 75-81) into kb/dashboard_config.json. Same measure-first + A/B-parity
     shape as P2. This + the remaining readers (read_projects KPI-ladder/outage
     fallback, read_update_log) are the last things gating the .xlsx delete (P5).
  (C) P3 UPDATE LOG (PARKED) — Sam DISMISSED the fork 2026-06-01. Don't re-raise
     unless he asks. Measured: 38 projects / 120 stale entries (latest 2026-04-08);
     options = read-only snapshot / retire (keep latest_update) / Supabase
     project_update_log table.
  (D) INDEPENDENT — Budget total=Σyears/avg formula layer (+ total read-only; Sam
     wants it). Personnel editor is BLOCKED on the 26→13 dedupe row-identity.
  (E) OPTIONAL BUILD — an on-dashboard "Data Pipeline" tab (the pipeline doc's §1
     source table + live scraped_at / dataCount / kpi_history counts). Offered to
     Sam; pending his call.

PATTERNS THAT WORKED THIS SESSION:
  - MEASURE-FIRST before any migration: dump the live values; a "migrate 3 tables
    + a writer" can collapse to "move 4 fields" once you see Col AG is empty and
    the sheet == code defaults. Run excel_to_dashboard.py locally with
    `pip install openpyxl pandas` (snapshot fallbacks cover the missing Supabase
    key); read live config via `load_workbook(EXCEL_FILE, data_only=True)`.
  - A/B RENDER PARITY is the cutover proof: render twice from the SAME committed
    HTML (old source vs new), diff with timestamps + blank lines filtered →
    "identical". Reader-output byte-identity is the faster pre-check.
  - GENERATOR-ONLY ships for a tight diff: prove the regen locally, then RESTORE
    the regenerated artifacts (git checkout the *.html/*.js/exports) so the commit
    is just the generator (+ any new committed input like dashboard_config.json).
    The daily cron regenerates the data files (Rule 1).
  - DOCUMENT FROM THE CODE, not the summary — grep daily-dashboard.yml + the
    loaders for the authoritative lineage.

SAFETY TO HONOR:
  - Rule 1 (change the generator, not regenerated HTML/JS) + Rule 4
    (CPL_Dashboard.html == index.html) + Rule 5 (never force-push main).
  - Live Supabase is shared: only kb_curation/allowed_reviewers/workplan_goals/
    projects/budget*/personnel tables in scope; snapshot before a data fix; schema
    migrations + destructive ops need Sam's nod (he pre-authorizes via the
    AskUserQuestion that opens the PR).
  - Don't read/cat the big coci_*.json / unified_*.js / CustomReport_latest.json
    (91 MB) / coci_course_list.xlsx into context — inspect via scripts.
  - Feature branch claude/<desc>; open PR as DRAFT → mark ready immediately →
    squash-merge on green CI (TruffleHog is the only required PR check; CodeQL is
    push/weekly). After a squash-merge, `git fetch origin main && git rebase
    origin/main` (the merged commits drop as "already upstream") then continue —
    the remote feature branch needs a --force-with-lease push afterward.
  - MERGE POLICY (CLAUDE.md Branch Policy, refreshed 2026-06-01): **autonomous
    engineering PRs merge on green WITHOUT waiting for a comment/"Go!"** — and
    "green" = `mergeable_state` **`clean` OR `unstable`** (both mean required
    checks pass; a pending *required* check reads `blocked`). Don't end the turn
    waiting for `unstable`→`clean`. BUT **a deliverable Sam commissioned, where
    his input completes it (a screenshot, a decision), SHOULD be held ready (not
    draft) for his reply** — he confirmed that's the right call (#222). The line:
    your own work → merge on green; a thing he asked for + would eyeball → hold
    ready, present, merge on his nod. Never park in *draft*. (Sam merges FAST,
    often "Go!" — he may merge before you do.)

SEPARATE TRACK (not Excel retirement):
  - Over-merge re-mint apply (Session 18) is STAGED + gated on Sam's
    workflow_dispatch — leave it unless he asks. Pipeline viz (#tab-pipeline) +
    the auditor: refresh only when you next move the M-ID pipeline (not this
    workstream — correctly skipped this checkpoint).
```

## Carryover status

| Item | Status |
|---|---|
| Excel P1 ("Update→Excel" → inline editor) | **DONE + MERGED** (#219) |
| Excel P2 (config → kb/dashboard_config.json; writer deleted) | **DONE + MERGED** (#221) |
| Excel P4 (dead readers deleted) | **DONE + MERGED** (#220) |
| Daily data-pipeline reference doc (+ §5 screenshot inventory) | **DONE + MERGED** (#222/#223) |
| **P5 budget factors/year_labels → JSON** | **NEXT-tier** — carve-out from P2; same shape |
| **CustomReport Contacts/Users&Roles — drop or wire** | **DECISION (Sam)** — pipeline doc §5; rec drop |
| P3 Update Log history | **PARKED** — Sam dismissed the fork 2026-06-01; don't re-raise |
| P5 finale (drop the .xlsx) | blocked on the remaining readers (read_projects, read_budget_plan, read_update_log) |
| Budget total/avg formula (+ total read-only) | queued — Sam wants its own PR (independent) |
| Personnel editor | queued (BLOCKER: 26→13 dedupe row identity) |
| On-dashboard "Data Pipeline" view | offered, pending Sam's call |
| over-merge re-mint apply (Session 18) | STAGED, gated on Sam's dispatch (separate track) |

Pipeline viz correctly SKIPPED this checkpoint (no re-mint / auditor run / M-ID
phase change — Excel retirement + pipeline docs are a separate workstream).
