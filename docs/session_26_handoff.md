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
daily-pipeline accounting doc + a merge-policy refinement; **7 PRs merged**; then
ran a **strategy session** with Sam that locked a 6-item roadmap + 4 decisions —
see "SESSION 26 STRATEGIC QUEUE" below). Paste the fenced block into Session 26.

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
  - Docs: CLAUDE.md §11, the lessons doc, INDEX.md, this handoff. Plus #224
    (Rule-8 checkpoint) + #225 (merge-policy refinement: hold for input ONLY with
    a concrete reason — default is merge-on-green even for commissioned docs).

═══ SESSION 26 STRATEGIC QUEUE (approved by Sam, 2026-06-01) ═══
Sam ran a strategy session and approved a 6-item roadmap + 4 locked decisions.
**KICK OFF SESSION 26 with the /workflow audit** (item 1) — Sam explicitly OK'd
using the built-in `/workflow` feature for it (it fans subagents out across the
codebase in parallel; the textbook use case). Then work the rest in sequence.

  1. **CODEBASE AUDIT via `/workflow`** (read-only → findings report). Fan out
     subagents over excel_to_dashboard.py (~8,200-line monolith), the kb/
     generators, the JS layer, the daily pipeline — each hunts ONE class:
     (a) dead code (we keep finding it — read_annual_goals, populate_current_metrics…),
     (b) the **blank-line idempotency bug** (the generator accretes ~7 blank lines/run
     in the refresh-button injection — reproducible on main, REAL Rule-2-style defect),
     (c) perf hotspots (profile the 91 MB CustomReport parse + unified-courses export
     before optimizing), (d) simplification/duplication, (e) security. Output ONE
     KB-note findings report; Sam green-lights specific fixes. **Do NOT blind-refactor.**
     Do NOT move the daily cron to a /schedule routine (GitHub Actions is fine).
  2. **KPI CARD REORDER** — login-free drag-to-rearrange on the **Activity-KPI grid**
     (the 19+ cards; Sam's pick), persisted **per-viewer in localStorage** (NO auth,
     NO backend, NO generator-data dep). New static JS module + a script tag + a
     "Reset to default order" link. A curated *default* order (auth-gated, via the
     existing kpi_order field) is a LATER add — localStorage-only first.
  3. **STUDENT ELIGIBILITY COUNTS on the EACR (#5)** — Sam's highest-impact item;
     data is already in the daily pull (View_StudentAggregatedValues StudentID +
     View_ArticulatedCollegeCourses Students). **Count semantics (Sam's call):
     BOTH per-college AND deduped-statewide** per exhibit identity. **PRIVACY ADR
     FIRST** (write it, get sign-off before building): aggregate counts ONLY, NEVER
     a StudentID/PII in any committed or public artifact (it's a public Pages repo —
     hard no). Then prototype the join offline, prove counts vs a known college,
     surface read-only counts on EACR + CER.
  4. **CONTACTS PANEL (#A / pipeline §5)** — Sam chose **WIRE** (not drop): build a
     per-college contacts surface from View_CollegeContacts (AO / CPL Coordinator /
     VRC official / CEO — already in the 91 MB pull). College Users & Roles stays
     fetched (revisit). Mind PII display (these are staff contacts, public-ish).
  5. **EACR↔CER CONVERGENCE (#7)** — the EACR ALREADY groups by unified/CE title +
     has an "Also entered as N variants" local-titles disclosure (Session 8). Gap to
     close: (a) make _build_statewide_adoption() apply the **CER curator overrides**
     (credential_review_overlay.json — unified_title_override/issuer/quality) so CER
     fixes flow to the EACR grouping; (b) enrich the disclosure with **per-local-title
     college counts**; (c) optional CER↔EACR cross-link.
  6. **PROJECT→ACTIVITY CONSOLIDATION (#4)** — Sam chose **FOLD the project's rich
     fields into the activity card + ARCHIVE the project row** (reversible, nothing
     lost — NOT hard-delete). **Write the playbook first**
     (docs/kb-notes/playbook-project-activity-consolidation.md): snapshot → move
     fields onto/under the activity → archive the project row → re-key
     workplan_activity_associations → leave an alias. Get sign-off, THEN build UI.
  + **SIDEBAR LEVELS (#6, interleave anytime)** — (a) add data-sections to the
     curator tabs that have NONE (CCR/CER/CSR/Exhibit-Adoption) for scroll-spy
     sub-links; (b) a true 2nd nesting level only where a tab is deep (CPL Analytics'
     6 cards; Pipeline phases). tabs.js already renders one nested <ul>; 2nd level is
     contained. Mock the tree for Sam before building (b).
  + **REPO SETTING (Sam-side)** — flip on Settings → Pull Requests → **Allow
     auto-merge** so a session can `enable_pr_auto_merge` (squash) right after marking
     ready (tried on #220, failed: not enabled). Until then, merge manually on green.

EXCEL RETIREMENT (continues underneath the queue — audit doc is the plan):

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
  - MERGE POLICY (CLAUDE.md Branch Policy, refreshed 2026-06-01): **merge on green
    WITHOUT waiting for a comment/"Go!"** — "green" = `mergeable_state` **`clean`
    OR `unstable`** (both mean required checks pass; a pending *required* check
    reads `blocked`). Don't end the turn waiting for `unstable`→`clean`. **Hold a
    PR for Sam's input ONLY when you have a concrete reason** — a known gap pending
    something only he supplies (e.g. #222's §5 placeholder for his screenshot) or
    an embedded decision only he can make. Being a thing he commissioned is NOT
    itself a reason; no reason → merge, even if he asked for it. When you hold:
    ready (never draft), state the reason, merge on his nod. (Sam merges FAST,
    often "Go!" — he may beat you to it.)

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
| **STRATEGY QUEUE item 1 — codebase audit via `/workflow`** | **SESSION 26 KICKOFF** (approved) — read-only findings report; Sam green-lights fixes |
| **item 2 — KPI reorder (Activity-KPI grid, localStorage, login-free)** | approved + scoped; static JS, no auth |
| **item 3 — student eligibility counts on EACR** | approved — BOTH per-college + deduped-statewide; **privacy ADR first** |
| **item 4 — Contacts panel (WIRE View_CollegeContacts)** | **DECIDED: wire** (not drop); Users&Roles stays fetched |
| **item 5 — EACR↔CER convergence (apply CER overrides + local-title counts)** | approved; EACR already CE-grouped (Session 8), close the gap |
| **item 6 — project→activity consolidation** | **DECIDED: fold into activity card + archive project row**; playbook first |
| sidebar levels (#6, interleave) | approved — data-sections on CCR/CER/CSR + optional 2nd level |
| repo "Allow auto-merge" | **Sam-side** — flip it on so sessions can enable_pr_auto_merge |
| **P5 budget factors/year_labels → JSON** | carve-out from P2; same shape — feeds the .xlsx delete |
| P3 Update Log history | **PARKED** — Sam dismissed the fork 2026-06-01; don't re-raise |
| P5 finale (drop the .xlsx) | blocked on the remaining readers (read_projects, read_budget_plan, read_update_log) |
| Budget total/avg formula (+ total read-only) | queued — Sam wants its own PR (independent) |
| Personnel editor | queued (BLOCKER: 26→13 dedupe row identity) |
| On-dashboard "Data Pipeline" view | offered, pending Sam's call |
| over-merge re-mint apply (Session 18) | STAGED, gated on Sam's dispatch (separate track) |

Pipeline viz correctly SKIPPED this checkpoint (no re-mint / auditor run / M-ID
phase change — Excel retirement + pipeline docs are a separate workstream).
