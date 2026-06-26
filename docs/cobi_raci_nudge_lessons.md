---
title: COBI Activities/Projects — ownership, nudges & reporting (lessons)
date: 2026-06-26
tags: [lessons, raci, nudges, activities-projects, annual-report, session-75, session-76]
artifacts: [raci.js, nudges/build_nudges.py, raci/supabase_raci.sql, excel_to_dashboard.py]
related: ["[[CLAUDE]]", "[[docs/session_76_handoff]]", "[[docs/session_77_handoff]]"]
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

## 2026-06-26 — Session 76 (SkyTrek)

### What shipped (PR #550, merged + cron-dispatched)
Two tightly-coupled Team & RACI navigation features, one coherent PR (both touch `raci.js`):
- **Carry-over #1 — matrix Activity/search filter** (Sam's last ask). A filter bar above the
  matrix: an **All Activities / Activity 1–4** dropdown + a **search box** (matches Activity or
  Project name/id) + **Clear** + a `Showing N of M projects` count. A project hit keeps its
  parent Activity header for context; an Activity hit (or dropdown pick) shows all its projects.
  Table refreshes **in place** (`fillMatrixTable(holder)`) so the search box keeps focus while
  typing. No-match → inline empty-state row. Matrix-only; Directory untouched. State in
  `state.mfilter = { activity, q }`.
- **Carry-over #4 — per-card RACI deep-link.** Each project card gets a `👥 RACI` button
  (next to Report/Update/Attach in `_render_single_project_card`); each Activity header gets a
  `👥 RACI` link (next to Targets ↗ in `render_activity_kpis_html`). Click sets
  `sessionStorage['cpl_raci_focus'] = "project:<id>" | "activity:<n>"` then navigates `#raci`.

### What was learned
- **`onActivate` fires its callback ONCE** (first activation only — `tabs.js` line ~269). So a
  deep-link click *after* the RACI tab was already booted will NOT re-run `boot()`. The robust
  consume is a module-level `window.addEventListener("cpl-tab-activated", …)` in `raci.js` that
  re-checks `cpl_raci_focus` on **every** navigation to `#raci`, **plus** a consume at the end
  of the first `boot()` render (the cold deep-link case, where the activation event fired before
  `raci.js` loaded and the listener missed it). `consumePendingFocus()` guards on `state.loaded`
  so an early activation leaves the key for boot.
- **`focusItem(type,id)`** resets to matrix view + clears `mfilter` (so a filtered-out row is
  reachable), re-renders, then scrolls + flashes the row (gold `raciFocusFade` pulse). Each
  matrix `<tr>` now carries `data-raci-key="type:id"` for the lookup.
- **`hashchange → activate` fires `cpl-tab-activated` every time** (`tabs.js` line ~249), so a
  plain `href="#raci"` is enough to trigger the consumer — no `CPL_TABS.navigate` call needed.
- **The agent sandbox's `GH_TOKEN`/`curl` has NO GitHub access** — `api.github.com` returns
  *"GitHub access is not enabled for this session."* Only the **MCP `github` server** can reach
  it. ⇒ A `Monitor` that curls the GitHub API to watch CI **silently times out** (it never gets
  data). Poll CI via the MCP `actions_list` tool instead; its output is large, so parse the
  saved tool-result file with python (slice/`json.load`), don't read it inline.
- **`git reset --hard` after a squash-merge ate uncommitted doc edits.** A `git stash push
  <paths>` that includes an **untracked** file fails the WHOLE command (pathspec no-match) → no
  stash is created → the following `reset --hard` discards everything. To rebase a post-squash
  branch onto fresh `main` while preserving WIP docs: `git add -A && git stash` (no pathspecs),
  or commit the docs first. Untracked files survive `reset --hard`; tracked modifications don't.

### Current state
- Live on merge + the dispatched regen: the `raci.js` filter + deep-link consumer AND the
  per-card links in the regenerated HTML (38 `cpl_raci_focus` anchors per HTML, Rule 4 holds).
  `tests/raci.test.js` = **24 checks** (15 base + 5 filter + 4 deep-link). Suite 89/89.
- Carry-overs #1 + #4 DONE. #2/#3 are **decision-gated** (nudge channel; lead emails + go). #5
  (`update_log`) is **product-gated** — §11 records Sam **dismissed/parked** the Update-Log
  decision 2026-06-01; don't build it without his explicit go. #6 (Report tab) depends on #5.

### Next concrete step
Get Sam's calls to unblock the next wave: (a) nudge **send channel** (Outlook drafts now /
Teams Power Automate webhook / Graph sendMail); (b) the 3 lead **emails** for `allowed_reviewers`
(#3); (c) confirm the **`update_log`** product direction (#5) before #6. Then #7 (Activity-4
sub-lanes) is a pure refactor that needs no decision.
