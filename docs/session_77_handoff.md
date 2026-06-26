---
title: Session 77 handoff — you are Session 77
created: 2026-06-26
updated: 2026-06-26
tags: [handoff, session-77, raci, nudges, activities-projects, annual-report]
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/cobi_raci_nudge_lessons]]"
  - "[[docs/session_76_handoff]]"
---

# You are Session 77

Session 76 (**SkyTrek**) cleared the two Team & RACI **navigation** carry-overs from
SkyMaster's ownership/nudge build. One PR (#550) shipped, merged, and the daily workflow
was dispatched to publish the regenerated card HTML. Read
`docs/cobi_raci_nudge_lessons.md` (the 2026-06-26 §) first, then this.

## What shipped (PR #550 — merged + cron-dispatched)

| Carry-over | What |
|---|---|
| **#1 — matrix filter** | A filter bar above the RACI matrix: **All Activities / Activity 1–4** dropdown + a **search box** (Activity or Project name/id) + **Clear** + a `Showing N of M projects` count. Project hits keep their parent Activity header for context; the table refreshes **in place** so the search box keeps focus. Matrix-only; Directory untouched. `raci.js` only. |
| **#4 — per-card deep-link** | Each project card → a `👥 RACI` button; each Activity header → a `👥 RACI` link. Click sets `sessionStorage['cpl_raci_focus']="project:<id>"\|"activity:<n>"` then navigates `#raci`. `raci.js` consumes it on **every** `cpl-tab-activated` for `raci` **and** at first-boot render, switches to matrix view, clears the filter, scrolls + flashes the row (gold pulse). Generator emits the links (`_render_single_project_card` + `render_activity_kpis_html`) — **code-only**, published by the dispatch. |

`tests/raci.test.js` = **24 checks** (15 base + 5 filter + 4 deep-link). Full suite **89/89**.

## Key gotchas learned this session (save yourself the time)

- **`onActivate` fires its callback ONCE** (`tabs.js` ~269). A deep-link click after the tab
  was already booted will NOT re-run `boot()`. Robust deep-link consume = a module-level
  `cpl-tab-activated` listener in the consumer JS, re-checking the focus key each time, **plus**
  a consume at first-boot render for the cold case. `hashchange→activate` fires the event every
  time (~249), so a plain `href="#raci"` is enough.
- **The sandbox's `GH_TOKEN`/`curl` has NO GitHub access** (`api.github.com` → *"GitHub access
  is not enabled for this session"*). Only the **MCP `github` server** reaches it. A `Monitor`
  that curls the GitHub API to watch CI **silently times out**. Poll CI via the MCP
  `actions_list` tool and parse its saved tool-result file with python (it's too big to read
  inline).
- **Merge mechanics:** `mergeable_state: unstable` = mergeable on green (required TruffleHog
  passed, only the non-required JS-tests check still running). The auto-merge tool refuses
  `unstable`, so squash-merge manually via `merge_pull_request {merge_method:"squash"}`. After
  merging a code-only generator change, **dispatch `daily-dashboard.yml`** (`actions_run_trigger`
  `{method:"run_workflow"}`) to publish the regenerated HTML same-hour.

## Carry-over (priority order) — the remaining RACI/report wave

**DECISION-GATED (ask Sam, don't guess):**
1. **Nudge SEND channel (#2)** — today `nudges/build_nudges.py` only generates drafts. Pick:
   (a) Sam forwards the per-lead emails from Outlook (zero infra), (b) a Teams **Power Automate**
   webhook (`TEAMS_NUDGE_WEBHOOK` secret), or (c) Graph `sendMail` (Entra app + admin consent).
   Plus a weekly `.github/workflows/cpl-nudges.yml` cron (OFF until a secret exists). The
   sam-raci-decisions To-Do item already asks for his call.
2. **3 leads → `allowed_reviewers` (#3)** — needs the actual emails (Crystal Nasio, Terence
   Nelson, Calvin/Gloria) + Sam's go. Sam also to add his own `slee@cccco.edu` via the editable
   Email cell.
3. **`update_log` (#5/P1)** — ⚠ **product-gated:** CLAUDE.md §11 records Sam **dismissed/parked**
   the Update-Log decision (2026-06-01). Do NOT build it without his explicit go. It's the
   foundation for fresh reports (today's activities/projects haven't been updated since
   ~2026-04-08), and **#6 (Annual Report tab) depends on it.**

**AUTONOMOUS (no decision needed):**
4. **Annual Report TAB (#6/P5)** — the capstone, but blocked on #5 for *fresh* content. The
   draft structure is delivered (Exec Summary · Vision 2030 & 3 Goals · Activity Progress · Statewide
   Impact · Spotlights · Looking Ahead). Reuse `report_generator.js`'s Claude proxy for ✨AI draft
   + `college_report_generator.js` `buildDocx` for ⬇Word.
5. **Activity 4 sub-lanes (#7)** — collapsed Sprints/Targeted Projects/Partnerships/Enabling;
   extract a shared activity-card renderer. Pure refactor, no decision.

## Standing lanes (beyond RACI — from earlier handoffs, still open)
- **Fact-Sheet snapshot live-wire** + the tech-landscape diagram → live HTML (`docs/fact_sheet_lessons.md`).
- **Unverified-M-ID renumber re-mint** — when the merge wave settles, NOT per-merge
  (`docs/unverified_mid_renumber_scope.md`; dry-run, Sam's go, Supabase re-key).
- **TMC Phase-2 acceptance engine** in `tmc_builder.js` (`docs/kb-notes/tmc-co-review-scope.md`).
- **CPL-Assistant CCR/CER recommender ETL** (`docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md`).

## Patterns that worked
- **Two tightly-coupled features sharing one file → one PR** (filter + deep-link both in `raci.js`).
  Avoids a guaranteed rebase conflict between two open PRs on the same file.
- **Code-only generator PR + post-merge cron dispatch** to publish artifacts (artifact policy).
- **Commit the test** — every `raci.js` change added jsdom checks that guard the *behavior*
  (focus consume, empty state), run by the non-required `js-tests` CI.

## A moniker for you
SkyTrek kept the Sky streak. Claim your own or carry it forward (SkyForge, SkyAnchor, SkyVault…).
