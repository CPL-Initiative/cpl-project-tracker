---
title: Session 23 Hand-off Prompt
date: 2026-05-31
session: 22 → 23 hand-off ("Bruh Sentinel" → next)
status: hand-off — paste the fenced block into Session 23's first message
tags: [handoff, session-prompt, tabs, sidebar-subnav, mid-cid-rename, generator-anchors]
related:
  - docs/dashboard_cleanup_lessons.md (the page-move workstream anchor)
  - docs/kb-notes/playbook-move-generated-section-to-tab.md (the playbook used for #1)
  - docs/session_21_handoff.md (Twenty → Sess 22)
  - CLAUDE.md §6b (sentinel anchors), §7b (tab layout), §11 roadmap
moniker_suggestion: Bruh XXIII / "Twenty-Three" — or claim your own
---

# Session 23 Hand-off Prompt

A capsule from Session 22 ("Bruh Sentinel" — the sentinel-marker move) to the
next session. Paste the fenced block below into Session 23's first message.

## Moniker

Session 22 ran as **"Bruh Sentinel"** — a single high-value sprint: executed the
deferred HIGH-RISK #1 page move (Workplan → its own tab) cleanly, verified by
running the generator locally, merged, then doc-synced. The name nods to the
sentinel marker that made the hard-case move safe. Pick your own — the lineage
is loose.

## The prompt

```
You are Session 23 on the CPL Project Tracker. Read these first, in order:
  1. CLAUDE.md (all of it — esp. Critical Rules 1 & 4, the Branch Policy
     auto-merge gates, §6b sentinel anchors, §7b tab layout, §11 roadmap).
  2. docs/dashboard_cleanup_lessons.md (the page-move + cleanup workstream).
  3. docs/kb-notes/playbook-move-generated-section-to-tab.md (the playbook —
     read if you touch generator-managed sections / tab moves).

WHAT SHIPPED IN SESSION 22 (merged to main, PR #206):
  - #1 (the deferred HIGH-RISK page move) DONE: "Workplan Activities & Projects"
    (Activity Metrics + Filter Bar + Projects Grid) moved OUT of the Dashboard
    tab into its own top-level "Activities & Projects" tab
    (#tab-activities-projects, hash activities-projects).
  - The hard part: that section's marker was the END-ANCHOR for 4 generator ops.
    Fix = a permanent SENTINEL `<!-- ═══ Dashboard Sections End ═══ -->` that
    STAYS in the Dashboard tab; all 4 ops (KPI Summary replace 8407, MAP
    Articulation strip 8453, CPL Analytics strip 8457, CPL Analytics insert 8466)
    re-anchor on it. Inner anchors (Filter Bar / Projects Grid / activityKpiSection)
    travelled with the content so Ops 5/6/7 relocate via html.find().
  - VERIFIED by running excel_to_dashboard.py locally TWICE (you CAN run it:
    `pip install openpyxl pandas`, then it falls back to kb/*_snapshot.json when
    SUPABASE_SERVICE_KEY is unset; live_metrics.json + the project xlsx are
    present). All 7 ops fire; output idempotent (only timestamp/whitespace diffs);
    correct pane placement; marker counts = 1 (no gobble). Shipped structure-only
    HTML (no data churn) for a tight 3-file diff. Sam merged + approved the label.
  - Doc-sync: CLAUDE.md §6b (now "own tab", sentinel anchors), §7b (tab table +
    activities-projects row), §11 roadmap row.

YOUR PRIORITY WORKSTREAM — the 2 cleanup items still open from Session 20:
  #2 (NOW UNBLOCKED by #1) — Sidebar sub-links: expand each pane's data-sections
     to list its sub-sections; tabs.js scroll-spy is ALREADY wired (reads
     data-sections, IntersectionObserver highlights current). Today most panes
     have a single or coarse data-sections. The new #tab-activities-projects pane
     has `[{slug:projects,id:workplanProjectsWrapper,label:Activities & Projects}]`
     — could split into Activity Metrics (#activityKpiSection) + Projects (give the
     projectsGrid a stable id). Dashboard already has kpis+analytics. Lower-risk,
     but you can't eyeball scroll-spy without rendering — verify in a browser or
     ask Sam to glance. Per-pane, additive, no generator risk (data-sections is
     static template).
  #3 — MID/CID/CCNID label sweep. COSMETIC ONLY (Sam's locked call): rename
     id_system VALUES + UI labels + code string literals + .md/docs. PRESERVE the
     224 "M-ID ACCT 100"-style anchor identifier KEYS (renaming = identifier
     re-key → ripples into curation/articulation pointers, NOT cosmetic). CCN-ID →
     CCNID too. ~70k .js hits regenerate from source; lockstep every `=== "M-ID"`
     code comparison / filter or they break. Its own focused PR + measure-first.

BACKLOG (Sam floated these; not yet scoped to PRs):
  - KPI-card sort-order box: anyone reorders, persists, no login. Rec: localStorage
    per-viewer (safe) vs shared Supabase-anon (matches "changes it for everyone" —
    needs a reset-to-default). Cards are generated → client-side reorder overlay.
  - Dark mode: basic = moderate; "all elements" = HARD (pervasive inline/hardcoded
    colors in template + generator + JS). Phased token migration, not a one-shot.
  - Author a `dashboard-tab-surgery` Skill encoding the playbook (you just have a
    fresh, proven instance to encode).
  - Full Excel retirement: Phases 4 (Vision 2030) + 5 (Personnel) cutover, then
    migrate the KPI ladder + repoint the 3 Word-report JS consumers. (Today Excel
    still feeds the KPI ladder + D.* helpers.)

PATTERNS THAT WORKED THIS SESSION:
  - You CAN run the generator locally — that turns a "blind, high-risk" edit into a
    verified one. Always do it for generator-managed structural changes.
  - Marker-based surgery script (not line numbers) with COUNT ASSERTIONS that fail
    loudly — robust to whitespace/line drift on a 10k-line HTML.
  - Idempotency test = run the generator twice, diff the two outputs; a clean move
    diffs to only timestamps. This is THE safety check for Rule-1 regex anchors.
  - Ship structure-only HTML (revert the regen's data files) for a focused diff;
    the next daily cron refreshes data cleanly on top.
  - Merge promptly: ready immediately, squash-merge on green CI (TruffleHog is the
    only required PR check — CodeQL is push/weekly only).

SAFETY TO HONOR:
  - Rule 1 (change the generator, not the regenerated HTML) + Rule 4 (CPL_Dashboard
    .html == index.html — cp after every HTML edit).
  - For ANY generator-managed section move: classify the marker first (end-anchor
    or not). End-anchor → sentinel + local regen verify (catastrophic-gobble mode).
  - Rule 7 re-mint playbook for any IDENTITY change (the #3 anchor keys are why #3
    is cosmetic-only).
  - Don't read/cat the big coci_*.json / unified_*.js into context (overflow);
    inspect via scripts that print counts/samples.
  - Feature branch claude/<desc>; squash-merge on green CI (no Sam gate, alpha mode).
```

## Carryover status

| Item | Status |
|---|---|
| #1 Workplan → own tab | **DONE + MERGED** (PR #206, this session) |
| #2 sidebar sub-links | **NOW UNBLOCKED** (was "after #1"); not started |
| #3 MID/CID/CCNID cosmetic sweep | scoped + forks locked; not started |
| KPI sort-order / dark mode / tab-surgery Skill / Excel retirement | backlog, unscoped |

Pipeline viz correctly SKIPPED this checkpoint (UI move only — no re-mint /
auditor run / phase change). Re-run the auditor + refresh `#tab-pipeline` when you
next move the M-ID pipeline. The dashboard_cleanup_lessons.md doc carries the
Session 22 append for the page-move workstream detail.
