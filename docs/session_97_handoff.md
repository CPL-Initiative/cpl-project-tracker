---
title: Session 97 handoff — after SkyPress (reports live-data + attach handoff)
created: 2026-07-02
tags: [handoff, session-97, reports, attachments, cobi]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/cobi_lessons]]"
superseded: true
superseded_by: session_132_handoff.md
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

1. **Native attachments — DECIDED, BUILD IT (your headline workstream).**
   Sam, same day (2026-07-02): *"Attachments should be team only. The
   Supabase solution sounds good. I'm thinking we handle this in the next
   session."* The access model is **TEAM-ONLY** — locked, don't re-ask.
   Build spec (adapt as you see fit, honor the boundary):
   - **PRIVATE `project-attachments` Storage bucket** — NO public/anon read
     policy. Reads AND writes on `storage.objects` gated
     `is_allowed_reviewer() OR team_pass_ok()` (the same boundary as
     `item_raci`/`map_college_users`; storage RLS can call those functions —
     the `factsheet-images` bucket already uses `is_allowed_reviewer()` for
     writes). Sanity-cap size (~10 MB?) + MIME allowlist (docs, not
     executables).
   - **`project_attachments` metadata table** (item key `activity:N`/
     `project:<id>`, filename, storage path, size, uploaded_by/at) with the
     same RLS gate, so listing doesn't require bucket enumeration.
   - **Per-card ⬆ Attach** + live listing overlay (the `card_updates.js`
     pattern, but note: the roster is GATED, so the overlay shows a
     sign-in/team-phrase gate to the public — mirror `map_users.js`, not
     `card_updates.js`, for the auth posture).
   - **Download nuance:** a gated object can't be a plain `<a href>` — the
     request must carry the reviewer bearer / `x-team-pass` header. Either
     fetch-with-headers → blob URL client-side (attachments are small), or a
     SECURITY DEFINER RPC that mints short-lived signed URLs. Pick one,
     document why.
   - **KB-markdown ingest** (Sam's stretch ask) rides the same upload event:
     runner-side docx/pdf → md into the vault lane (`docs/kb-notes/`
     candidates / CPLBrain), same shape as the Sierra Phase-3 ingest. Scope
     it in the same PR ladder, even if it ships as PR 2.
   - **SharePoint stays the archive of record** (24 members live there); the
     📎 SharePoint handoff + explainer remain as-is until Sam says otherwise.
   - PII discipline: bucket contents are TEAM data — never commit file bytes
     or names to the repo; the metadata table is Supabase-only.
2. **S96 publish — ALREADY VERIFIED** (post-merge dispatch run #208,
   `89166ff`): "Install node docx" green, `reports/*.docx` in the daily
   commit (first cron-fresh reports ever), charts at the BOTTOM of CPL
   Analytics on live main, `CPL_Data.js` carries `live_updates`. Nothing to
   re-check unless a later cron regresses.
3. **Standing lanes** (unchanged from Session 96's inheritance): Sierra
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
