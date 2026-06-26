---
title: COBI Activities/Projects — ownership, nudges & reporting (lessons)
date: 2026-06-26
tags: [lessons, raci, nudges, activities-projects, annual-report, session-75]
artifacts: [raci.js, nudges/build_nudges.py, raci/supabase_raci.sql, excel_to_dashboard.py]
related: ["[[CLAUDE]]", "[[docs/session_76_handoff]]"]
---

# COBI Activities/Projects — ownership, nudges & reporting

Workstream scratchpad. Goal (Sam, Session 75): make Activities & Projects **easily
updatable**, **nudge** leads to update, and **roll updates into reports** — culminating in an
ever-fresh Annual Report, and eventually a CO-division **Plan Builder**.

## 2026-06-26 — Session 75 (SkyMaster)

### What was learned
- **The dashboard inverted the workplan.** The CPL Workplan is top-down (3 Goals → 4
  Activities → work items; "Projects" = Activity 4's portfolio). The generator grouped the
  Activity Metrics view by **project-ID prefix** (`pid.split('.')[0]`), manufacturing a
  phantom "Activity 5" from legacy `5.x` ids — even though every project's `workplan_activity`
  field already re-homes them to Activities 1–4. Fix was a one-line grouping change
  (`_activity_num_from_workplan()`), verified offline against the committed snapshots. Data
  was already correct; only the rendering rule was wrong.
- **Reports are only as fresh as updates.** The activities/projects haven't been updated since
  creation (latest `update_date` ~2026-04-08), so the Annual Report draft reflects creation-era
  snapshots until the update loop + nudges are live. This reframed the priority mid-session
  from "report tab" to "ownership + nudge loop first."
- **The repo is PUBLIC.** Staff emails must never be committed. They ARE already public on the
  Fact Sheet (`fact-sheet/index.html`), so the right design is to source them at runtime from
  there (parsed per-person so a no-email teammate can't borrow the next person's address) /
  Supabase / a gitignored local file — never a committed directory.
- **RACI is the unifying spine.** Sam's asks (per-card RACI link → a Team & RACI tab → a
  "Nudge for Updates" toggle → editable cells) converged on one idea: a people registry +
  per-item RACI that drives BOTH ownership and nudge targeting, and later the CO-division Plan
  Builder. The `org`/`scope` tenant columns make multi-division a filter, not a migration.

### Current state
- Live: workplan alignment (#545), Team & RACI tab + registry (#546), nudge toggle + test
  modes (#547), editable Directory cells (#548). Annual Report draft delivered (not a tab yet).
- Nudge generator built + PII-safe + RACI-aware, but **no send channel wired** — it produces
  drafts only.

### Strategic roadmap
Update loop (P1 `update_log` + shared editor) → first-class updatable Activities (P2) →
nudge SEND channel + `allowed_reviewers` → per-card RACI links → Annual Report **tab** (P5) →
Phase 6 Plan Builder / CO-division scaling. Full plan + carry-over: `docs/session_76_handoff.md`.

### Next concrete step
The RACI-matrix **activity/project filter** (Sam's last ask), then wire the nudge send channel
(Outlook drafts now / Teams Power Automate webhook next).

### Gotchas
- `map.rccd.edu` + `*.supabase.co` are egress-blocked from the agent sandbox (403) → the nudge
  generator's Supabase read falls back gracefully; test Supabase-touching code on a runner.
- The auto-merge tool refuses `unstable` PRs (wants `clean`); squash-merge manually once
  required TruffleHog is green.
- `excel_to_dashboard.py` needs `pip install openpyxl python-docx` to import in the sandbox;
  exercise generator functions via a small harness on the committed snapshots (fast + offline).
