---
title: Session 76 handoff — you are Session 76
created: 2026-06-26
updated: 2026-06-26
tags: [handoff, session-76, raci, nudges, activities-projects, annual-report]
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/cobi_raci_nudge_lessons]]"
---

# You are Session 76

Session 75 (**SkyMaster**) built the **ownership + nudge + report** layer for COBI's
Activities & Projects, in one long, hands-on session with Sam. Five things shipped to
`main`; several follow-ups are queued. Read `docs/cobi_raci_nudge_lessons.md` first.

## What shipped (all merged + live)

| PR | What |
|---|---|
| **#545** | **Workplan alignment** — `excel_to_dashboard.py` `build_activity_kpis` now groups by `workplan_activity` (new `_activity_num_from_workplan()`), NOT the project-ID prefix. Kills the phantom "Activity 5" (`5.1 AI-Ready CA` now correctly under Activity 4). 4 activities. "Targets ↗ Annual Workplan Goals" link on each activity header. Generator-only. |
| **#546** | **Team & RACI tab** (`#raci`, `raci.js` — static, lazy). RACI Matrix (4 Activities + their projects × R/A/C/I, click a cell → member-picker) + Team Directory. Supabase `team_members` + `item_raci` (schema `raci/supabase_raci.sql`, applied; RLS public-read / `is_allowed_reviewer()`-write; both carry an `org`/`scope` tenant column for the CO-division future). 23 members seeded from the **public Fact Sheet** (`raci/_seed_team_members.py`, 9 with email). Nav+pane+boot mirrored in BOTH HTMLs (Rule 4). |
| **#547** | **"Nudge for Updates"** per-member checkbox in the Directory (reviewer-toggleable; `team_members.nudge` column). The nudge generator reads the live registry and **skips unchecked members**. Plus nudge **test modes** (`--test EMAIL`, `--only NAME`). |
| **#548** | **Editable Directory cells** — signed-in reviewer clicks Name / Role / Email to edit inline (PATCH `team_members`). Adding an email enables that member's nudge checkbox. |
| — | **Annual Report draft** (Word + Markdown) delivered to Sam from live data — structure: Exec Summary · Vision 2030 & 3 Goals · Activity Progress (the 4) · Statewide Impact · Spotlights (Veteran Sprint, 29 Palms) · Looking Ahead. **NOT yet a tab** (that's P5). |
| — | **Nudge generator** `nudges/build_nudges.py` — PII-safe (emails resolved at runtime from the public Fact Sheet / `team_members` / a gitignored local file, NEVER committed; repo is public). 6 leads, 40 items due. |

`tests/raci.test.js` = 15 checks. Supabase project `hvuwhnbuahrtptokpqfh`.

## The model (locked with Sam)

CPL Workplan = **3 Goals → 4 Activities → work items**; "Projects" are specifically
**Activity 4's** portfolio (Sprints / Targeted Projects / Partnerships). The dashboard
now mirrors this. Annual + 2030 **targets live on the Annual Workplan Goals tab** (activity
cards link there, don't re-own ladders).

## Carry-over (in priority order)

1. **Activity/Project filter on the RACI matrix** — Sam's last ask. A dropdown (All /
   Activity 1–4) + maybe a search box above the matrix in `raci.js` `renderMatrix()`;
   filter `state.items`. Small. (Branch `claude/cobi-raci-filter` was created but NOT built.)
2. **Wire the nudge SEND channel** — today it only generates drafts. Options: (a) Sam
   sends the generated per-lead emails from Outlook (zero infra, the "today" path); (b) a
   Teams **Power Automate Workflow** webhook (`TEAMS_NUDGE_WEBHOOK` secret) — NOT a legacy
   O365 connector; (c) Microsoft Graph `sendMail` (needs an Entra app + admin consent).
   Plus a weekly `.github/workflows/cpl-nudges.yml` cron (default OFF until a secret exists).
3. **Add the 3 project leads to `allowed_reviewers`** (Sam's go) so they can self-update —
   Crystal Nasio, Terence Nelson, Calvin/Gloria. (Sam to also add his own email
   `slee@cccco.edu` to his `team_members` row via the now-editable Email cell.)
4. **Per-card RACI link** on each Activity/Project card (deep-link into `#raci` + focus the
   item) — generator change to `_render_single_project_card` + `render_activity_kpis_html`
   emitting `<a href="#raci" onclick="sessionStorage.setItem('cpl_raci_focus','type:id')">`,
   + `raci.js` honoring `cpl_raci_focus` (highlight/scroll the matrix row).
5. **Append-only `update_log`** (P1 in the plan) — so the report reflects real progress, not
   creation-date snapshots. One `public.update_log` table + a shared `item_editor.js`;
   project "Update" appends a log entry + sets `latest_update`. Then **Activity cards become
   updatable** (P2: give the 4 activities narrative fields, or reuse `item_raci`'s sibling).
6. **Annual Report TAB (P5)** — the capstone: `#tab-annual-report`, lazy `annual_report.js`,
   re-pulls live KPIs + activities/projects/updates each open; editable sections + ✨AI draft
   (reuse `report_generator.js`'s Claude proxy) + ⬇Word (reuse `college_report_generator.js`
   `buildDocx`) + 🖨print. Structure = the draft above.
7. **Activity 4 sub-lanes** (collapsed Sprints/Targeted Projects/Partnerships/Enabling) — the
   "tail wagging the dog" fix; deferred from #545 (extract a shared activity-card renderer).

## Phase 6 (Sam's strategic vision — additive, later)

Scale COBI to **all CO divisions**: a **Plan Builder + Goal Setter** (author V2030-anchored
annual+2030 goals per division) + a generalized Report renderer (CO Division Report = the P5
engine at a different scope) + **RACI per item** (project-level + per-Goal "Micro RACI", from
Sam's 29 Palms RACI worksheet). The cheap forward-compat is already baked: the `org`/`scope`
tenant columns on `team_members`/`item_raci`. Canonical PLAN format = the **29 Palms
Demonstration Project** doc (Exec Summary → Why → Mutual Benefits table → Goals + Aspirational
Metrics → Timeline).

## Patterns that worked
- **Code-only PRs + post-merge cron dispatch** for generator changes (#545). Static JS tabs
  (raci.js) edit both HTMLs for nav/pane/boot only (Rule 4), inject own CSS.
- **PII discipline:** the repo is PUBLIC → staff emails never committed; sourced at runtime
  from the already-public Fact Sheet / Supabase / a gitignored local file.
- **Supabase via MCP** (`apply_migration` + `execute_sql`) for new feature tables (non-destructive),
  seeded with a `NOT EXISTS` guard so reviewer edits are never clobbered.
- **Merge on `unstable`** (required TruffleHog green; the auto-merge tool refuses `unstable`,
  so squash-merge manually).

## A moniker for you
SkyMaster signed off mid-flight (context exhaustion after a marathon). Keep the Sky streak
(SkyForge, SkyAnchor…) or claim your own.
