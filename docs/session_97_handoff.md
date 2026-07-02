---
title: Session 97 handoff — after SkyPress (reports live-data + attach handoff)
created: 2026-07-02
tags: [handoff, session-97, reports, attachments, cobi]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/cobi_lessons]]"
---

# You are Session 97

You inherit from **Session 96 (SkyPress, 2026-07-02)** — the report-generator
live-data session. Read in this order if you're cold:

1. `CLAUDE.md` — Critical Rules + §7 (Custom Report) + §11 Session 96 narrative
2. `docs/cobi_lessons.md` — the S96 section (full story of what shipped + why)
3. `kb/cpl_todos.json` — the live For-Sam / For-Fable queue
4. This file

## What Session 96 shipped (one PR, code-only)

- **Custom Report live wiring** (`report_generator.js`): fetches newest
  `item_updates` per activity/project + `item_raci` at Generate time, folds
  into the prompt (project Latest Update + date, Lead = R→A, an
  "Latest Activity-Level Updates" block). Fallback chain: live fetch →
  `CPL_DATA.live_updates` → baked fields.
- **Master Report modal** (`master_report.js`, NEW static lazy asset): the
  filter-bar button now opens the same Activities & Projects checkbox tree as
  the Custom Report and builds the Workplan-style docx CLIENT-SIDE from
  live data. Layout is a 1:1 port of `generate_reports.js`. Pre-built
  `reports/CPL_Master_Report.docx` is the modal's fallback link.
- **Stale-reports root cause KILLED**: `.github/workflows/daily-dashboard.yml`
  now runs `npm install --no-save docx@8.0.4` before the pipeline (node
  `docx` was NEVER installed on the runner — `generate_reports.js` failed
  silently every cron since forever) and commits `reports/*.docx` (they were
  never in the `git add` list; the 34 per-card mini-report links + the master
  fallback had been serving whatever a session last committed).
- **Pipeline fold**: `kb/_load_projects.py:load_item_updates()` (service key,
  anon-key fallback, soft-fails to `{}`) + a fold in `main()` — newest
  `project:<id>` update overrides `p.update`/`p.update_date` before ANY
  render/export; whole map ships as `CPL_DATA.live_updates`.
  `generate_reports.js` renders activity-level updates under each Activity
  heading from that map.
- **Tweaks**: RACI 📝 composer shows "✓ Saved." then closes (~0.9s);
  ALL nudge mailtos semicolon-delimit recipients (Outlook rejects commas —
  raci.js ×2 + map_users.js); Path-to-2030 charts moved TOP → BOTTOM of CPL
  Analytics (`extra_top_html` → `extra_bottom_html`).
- **📎 Attach explainer** (`dashboard_filters.js`): first click on any attach
  button shows a 3-step popover (open folder → SharePoint's "＋ Create or
  upload" → count refreshes next daily rebuild), per-browser "Got it"
  (`cplAttachHelp.v1`). Sam reported drag-&-drop was REFUSED by his SharePoint
  — the explainer leads with the upload button on purpose.
- **Tests**: `tests/master_report.test.js` (28) ·
  `tests/report_live_wiring.test.js` (20) · `tests/attach_explainer.test.js`
  (12). Suite 128 files green.

## Priority queue for you

1. **Native attachments decision → build** (Sam-gated). Sam asked for "a more
   efficient way to attach docs" and noted "we used SharePoint because
   Supabase couldn't take attachments" — **it can**: we already run the
   `factsheet-images` Storage bucket (Session 81, public-read/reviewer-write).
   Proposal on the table: a `project-attachments` bucket + `project_attachments`
   table, per-card ⬆ upload gated `is_allowed_reviewer() OR team_pass_ok()`,
   attachments listed live on the card via a `card_updates.js`-pattern overlay
   (no SharePoint hop, no next-day lag). **THE BLOCKER IS THE ACCESS MODEL** —
   public-read URLs vs team-gated (private bucket + signed URLs). Project docs
   may be internal and this repo has PII history: get Sam's explicit pick
   BEFORE building. SharePoint stays the archive of record either way (24
   members already live there).
2. **Attachments → KB markdown** (Sam's stretch idea, same lane): runner-side
   ingest of uploaded docs (docx/pdf → md) into `docs/kb-notes/` candidates /
   the vault. Scope it WITH the native-attachment build — same upload event,
   same storage. Related: the Sierra Phase-3 document-ingest plan
   (`kb/cpl_todos.json` → `sierra-training-p3`).
3. **Verify the daily cron publishes the S96 changes**: after the next
   `daily-dashboard.yml` run, confirm (a) "Install node docx" step green,
   (b) `reports/*.docx` in the daily commit, (c) charts render at the BOTTOM
   of CPL Analytics, (d) `CPL_Data.js` carries `live_updates`, (e) the
   Master Report modal generates (needs `CPL_DATA` + docx.min.js — both live).
4. **Standing lanes** (unchanged from Session 96's inheritance): Sierra
   guidance day-2 + Malone guardrails intro, TMC confidence engine round 2,
   `chatbox_exhibits` dedupe/refresh, the unverified-M-ID renumber re-mint.

## Patterns that worked (keep them)

- **Audit before wiring.** "Make sure it pulls current data" decomposed into
  THREE real defects (client reads bake-time fields; runner missing a dep,
  failing silently; artifacts never committed). The fix landed at all three
  layers — client overlay, pipeline fold, workflow repair — so any one layer
  failing still leaves the others honest.
- **Port, don't reinvent.** `master_report.js` is a faithful port of
  `generate_reports.js` — same layout, same colors, same tables — so the
  client and pipeline documents stay visually identical.
- **Pure-helper exports for tests** (`window.CPL_MASTER_REPORT`,
  `window.CPL_CUSTOM_REPORT`) — the jsdom suite drives the data shaping
  without stubbing docx; `renderDocx` is proven by packing a real buffer with
  the local UMD.
- **Code-only PR + revert regenerated artifacts** — the sandbox regen DROPS
  the CPL Analytics section (no CustomReport fetch locally); never commit a
  sandbox-regenerated HTML. Verified the chart move by unit-calling
  `render_exhibit_analysis_html` instead.

## Safety patterns to honor

- Never edit the regenerated HTML sections by hand (Rule 1); the chart move
  lives in the GENERATOR (`extra_bottom_html`).
- `item_updates` fold: presence wins (mirrors `card_updates.js` — the newest
  posted update IS the latest update, even if `projects.latest_update` was
  edited later via the inline editor). If Sam ever wants date-compare
  semantics, change BOTH the fold and card_updates.js together.
- The public anon key in `kb/_load_projects.py` is the same one already
  committed in the JS — it is NOT a secret; the service key stays env-only.
- Nudge/mailto joins: keep `;` — Outlook is the team's client.

## Moniker

Session 96 went by **SkyPress** (reports off the press). Claim your own —
suggestion: **StarBinder** if you build the native attachments (binding docs
to cards), but the door's open.
