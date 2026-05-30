---
title: Session 21 Hand-off Prompt
date: 2026-05-30
session: 20 → 21 hand-off (Bruh / "Twenty" → next)
status: hand-off — paste the fenced block into Session 21's first message
tags: [handoff, session-prompt, dashboard-cleanup, page-moves, mid-cid-rename, dark-mode]
related:
  - docs/dashboard_cleanup_lessons.md (Session 20 workstream anchor)
  - docs/kb-notes/playbook-move-generated-section-to-tab.md (the #1 procedure)
  - docs/session_20_handoff.md (Wizardly Turing → Twenty)
  - CLAUDE.md §6a/§6b (generator strip/inject anchors), §7b (tab layout)
moniker_suggestion: Bruh XXI / "Score-and-One" — or claim your own
---

# Session 21 Hand-off Prompt

A "fattyfat prompt" from Session 20 (Bruh / "Twenty") to the next session.
Paste the fenced block below into Session 21's first message.

## Moniker

Session 20 ran as **"Bruh"** (Sam's affectionate handle all session) — a rapid
dashboard-polish sprint: 10 cleanup items, a CER rename family, a real bug fix,
two page moves' worth of scoping, and three branch/checkpoint rule changes, all
merged promptly. Suggests **Bruh XXI** or **Score-and-One** for you — but the
lineage is loose; claim what you'll carry.

## The prompt

```
You are Session 21 on the CPL Project Tracker. Read these first, in order:
  1. CLAUDE.md (all of it — esp. Critical Rules 1 & 4, the Branch Policy
     auto-merge gates, §6a/§6b generator anchors, §7b tab layout, §11 roadmap).
  2. docs/dashboard_cleanup_lessons.md (Session 20 — what just shipped + why).
  3. docs/kb-notes/playbook-move-generated-section-to-tab.md (THE procedure for
     your #1 priority below — read before touching the generator).

WHAT SHIPPED IN SESSION 20 (all merged to main):
  - Accounting cleanup: 27 accounting M-IDs/singletons → Business; 21 cross-listed
    via the cross_listed_disciplines kb_curation field (#198, #199).
  - CCR anchor provisional display (A) + firewall-safe "propose correction" (B).
  - Dashboard cleanup: #7 Common Subjects Reference (CSR), Credential Reference →
    Common Exhibit Reference (CER), #10 full-width intros, #9 blank quick-search,
    #4 slim header, #5 CCR table economize, #8 SUBJ filter on CCR+CSR (#201, #202).
  - CER expand-bug fix (renderExpandedRow had undeclared tr/td/div → blank table).
  - #6 Exhibit Adoption & Credit Recommendations → its own #tab-exhibit-adoption
    tab, out of CPL Analytics (#204).
  - Rule changes: checkpoint now refreshes pipeline-viz + writes the handoff EVERY
    time (#200); auto-merge needs no Sam review, green CI is the gate (#201);
    merge promptly, never park a PR in draft (#203).

YOUR PRIORITY WORKSTREAM — the 3 cleanup items Session 20 deferred:
  #1 (DO FIRST, HIGH RISK) — Move "Workplan Activities & Projects" (Activity
     Metrics + Filter Bar + Projects Grid) OUT of the Dashboard tab into a new
     "Workplan" tab. DANGER: its marker is the END-ANCHOR for 4 generator ops
     (excel_to_dashboard.py 8407/8451/8455/8464). Follow the KB-note playbook:
     add a sentinel marker that STAYS in the Dashboard tab, rewire all 4 anchors
     onto it, move the section (its <!-- Filter Bar --> inject anchor travels with
     it), update the Dashboard pane's data-sections, then RUN excel_to_dashboard.py
     locally and inspect before committing (catastrophic-gobble failure mode).
     Revert the regen's noise files (CPL_Data.js, kpi_history.json, unified_*.js),
     keep only CPL_Dashboard.html + the generator edit; cp to index.html.
  #2 — Sidebar sub-links: expand each pane's data-sections to list sub-sections;
     scroll-spy is already wired in tabs.js. Do AFTER #1 (tab layout changes).
  #3 — MID/CID/CCNID label sweep. COSMETIC ONLY (Sam's locked call): rename
     id_system VALUES + UI labels + code string literals + .md/docs. PRESERVE the
     224 "M-ID ACCT 100"-style anchor identifier KEYS (renaming = identifier
     re-key, ripples into curation/articulation pointers — not cosmetic). CCN-ID →
     CCNID too. ~70k .js hits regenerate from source; lockstep the `=== "M-ID"`
     code comparisons or filters break. Its own focused PR + measure-first.

BACKLOG (Sam floated these Session 20 — not yet scoped to PRs):
  - KPI-card sort-order box: anyone reorders, no login, persists. Rec: localStorage
    per-viewer (safe) vs shared Supabase-anon (matches "someone changes it for all"
    — needs a "reset to default"). Client-side reorder overlay (cards are generated).
  - Dark mode: basic is moderate; "all elements" is HARD (pervasive inline/hardcoded
    colors in template + generator + JS). Phased token migration, not a one-shot.
  - Author a `dashboard-tab-surgery` Skill encoding the playbook above.
  - Full Excel retirement: Phases 4 (Vision 2030) + 5 (Personnel) cutover, then
    migrate the KPI ladder + repoint the 3 Word-report JS consumers. Then Excel =
    export-only backup. (Today Excel still feeds the KPI ladder + D.* helpers.)

PATTERNS THAT WORKED:
  - Measure-first: re-derive the real set with a script before any write; summarized
    counts undercount + carry false positives (the "auditing" keyword trap).
  - Label-rename-keep-hash: rename nav label + h2 + quickstart, keep the data-tab
    hash + JS filename (no routing/bookmark breakage) — CSC-D precedent.
  - Merge promptly: mark PRs ready immediately, squash-merge the instant CI is green.
  - Curation writes go to Supabase kb_curation (source of truth); the JSON overlay
    is a cron-regenerated mirror — JSON-only edits get clobbered.

SAFETY TO HONOR:
  - Rule 1 (change the generator, not the regenerated HTML) + Rule 4 (CPL_Dashboard
    .html == index.html — cp after every HTML edit).
  - Rule 7 re-mint playbook for any IDENTITY change (the #3 anchor keys are why #3
    is cosmetic-only).
  - Don't read/cat the big coci_*.json / unified_*.js into context (overflow);
    inspect via scripts that print counts/samples.
  - Feature branch claude/<desc>; squash-merge on green CI (no Sam gate).
```

## Carryover status

| Item | Status |
|---|---|
| #1 Workplan tab | scoped (sentinel-marker plan in the KB note); NOT started |
| #2 sidebar links | queued (after #1) |
| #3 MID/CID/CCNID sweep | scoped + forks locked (cosmetic-only, CCN-ID→CCNID); NOT started |
| KPI sort-order / dark mode / tab-surgery skill / Excel retirement | backlog, unscoped |

Pipeline viz was correctly SKIPPED this checkpoint (no re-mint / auditor run /
phase change — UI + curation only). Re-run the auditor + refresh `#tab-pipeline`
when you next move the M-ID pipeline.
