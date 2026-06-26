---
title: COBI Activities/Projects — ownership, nudges & reporting (lessons)
date: 2026-06-26
tags: [lessons, raci, nudges, activities-projects, annual-report, update-composer, session-75, session-76, session-77]
artifacts: [raci.js, annual_report.js, nudges/build_nudges.py, raci/supabase_raci.sql, excel_to_dashboard.py]
related: ["[[CLAUDE]]", "[[docs/session_77_handoff]]", "[[docs/session_78_handoff]]"]
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

## 2026-06-26 (cont.) — Session 76 (SkyTrek), part 2

### The 3-tier RACI matrix (PR #553, merged + live)
Sam: *"add the subactivities to the activity filter and include the projects … a RACI for each,
all under the higher-level Activity."* The matrix went from a **flat** Activity→project list to a
**3-tier tree: Activity → sub-activity → project/work item**, each row independently RACI-able.
- **Data is already client-side** — no generator change. `window.CPL_DATA.activity_kpis` supplies
  the **official sub-activity ids** (drive the filter + the `sub-activity` tag); `…projects` is the
  full 34-item set whose **dotted ids encode the nesting**. `buildItems()` builds the tree by
  **id-prefix parenting**: a project's parent = the longest OTHER project id that is a
  *non-digit-boundary* prefix (`4.1`→`4.1.1`; `3.1.2`→`3.1.2a`; but `4.1`≠parent of `4.10`). A
  project with no numbered sub-activity parent (the `5.x` items) nests directly under its Activity
  (from the `activity` field). Real data → 38 rows, up to 4 levels deep (`3.1`→`3.1.2`→`3.1.2a`).
- **No RACI-key migration (the load-bearing decision).** Non-Activity rows KEEP `item_type:"project"`
  — so any assignments already made on `project:4.1` etc. survive. The sub-activity↔project
  distinction is **visual** (depth indent + a `sub-activity` tag + tier styling) and **drives the
  filter**, NOT the stored key. Changing the item_type would have orphaned live RACI rows.
- **Hierarchical filter** — the Activity dropdown became `<optgroup>`s (one per Activity → "▸ All of
  Activity N" + its sub-activities). Scope = `all` / `act:N` / `sub:ID`. A `sub:` scope shows that
  sub + its descendant projects + the Activity header for context. Each item carries an `ancestors`
  key array (computed in the depth-first emit); **search keeps every match PLUS its ancestor chain**
  so the tree never renders an orphaned deep row.
- **Test-scoping gotcha:** the dropdown `<option>` labels now contain sub-activity names, so a
  `doc.body.innerHTML` assertion false-matches "MAP Platform" via the dropdown. Scope content
  assertions to the **matrix table** (`.raci-table`), not the whole body. (30 jsdom checks, suite 89/89.)
- Beautiful tie-in: `4.1 Sprints → 4.1.4 29 Palms Demo / 4.1.1 Veteran Sprint` now nest under 4.1,
  mirroring the two plans added this session (below).

### Cross-repo: the Veterans Sprint + Military Base plans (vault + public KB)
Sam asked to add the **Veterans Sprint plan** and then its embedded **Military Base CPL Demonstration
Project plan** (29 Palms / Copper Mountain) "to the KB." Locked decisions: **Both** stores, **convert
faithfully** (the dp plan wasn't in any cloned repo, so its format was inferred then confirmed when Sam
shared it). Pattern that worked — **dual-publish**:
- **Vault (full):** `CPLBrain/04-projects/cpl-initiative/{veterans-sprint-plan-2026-06-26, military-base-cpl-demonstration-plan-2026-03-06}.md`
  — every section + table + names + RACI intact; cross-linked both ways; in PROJECT-OVERVIEW → Plans;
  session note `07-session-notes/2026-06-26-veterans-sprint-plan.md`. Merged: CPLBrain #10, #11.
- **Public KB (scrubbed rewrite):** `cpl-knowledge-base/overview/{veterans-sprint-plan, military-base-cpl-demonstration}.md`
  — per `CURATION.md` metrics + held-private rules: **dropped all personnel/RACI names + per-college
  rosters + current-count tables**, added the dashboard banner, kept the replicable model + milestone
  dates + statutory funding + safe-to-cite research findings (49%/27% grad, 17.5 units, $32.5B). A
  **manifest row per plan** (`rewrite`) in the vault for provenance. **Draft PR #15 — left for Sam:
  per CURATION.md, the human review IS the sensitivity audit, so the session does NOT self-merge the
  public KB.** (Vault PRs the session merges — additive private content Sam supplied.)

### Gotchas (new)
- After a squash-merge with **"Automatically delete head branches"** ON, the feature branch is gone on
  origin; `git push --force-with-lease` then fails "stale info." Just `git push -u origin <branch>` to
  recreate it (origin/main hasn't moved).
- The vault is `samueltlee/cplbrain` (lowercase in the API); public KB is `CPL-Initiative/cpl-knowledge-base`.

### Where we are now (pre-Session-77)
RACI tab: filter + per-card deep-links + 3-tier matrix all live. Carry-overs #2/#3/#5 still
decision-gated (nudge channel, lead emails, update_log). Public KB #15 awaiting Sam's review/merge.

---

## 2026-06-26 — Session 77 (StarPort): Copy-RACI, the nudge accountability loop, the braindump→CC→card composer

A hyperglide sprint with Sam live-testing throughout — **8 PRs #556–#562, all merged + live.**

### What shipped
- **Copy-RACI (#556):** `⧉ copy` on a populated matrix row → modal (source R/A/C/I preview + filterable
  target checklist + select-all) → `Promise.all(saveRaci)` to each target. v1 = replace.
- **Annual Report tab (#557):** `annual_report.js` (lazy, static) assembles a 6-section report from live
  `CPL_DATA` (Exec Summary · Vision 2030 & Goals · Activity Progress · Statewide Impact · Spotlights ·
  Looking Ahead); editable + live markdown preview + ✨AI polish (reuses `CPL_REPORT_PROXY_URL`) + ⬇Word
  (`docx.min.js`) + 🖨Print.
- **Check-all/clear-all + manual team nudge (#558):** directory nudge-column master checkbox; a 📣
  filter-bar button drafting a mailto to opted-in members.
- **🐛 THE save-persistence fix (#559):** `raci.js` validated the JWT *format* but never *refreshed* it →
  after the ~1h access-token TTL every write 401'd **silently** while the UI said "Signed in," and the
  optimistic state made it look saved. Supabase showed only ONE `item_raci` row had landed (`activity:1`,
  pre-expiry). Fix: `sbWrite` is **refresh-gated** (`ensureFresh()` renews via the `refresh_token` —
  mirrors `unified_courses.js`), drops a dead session, `saveRaci` **rolls back** optimistic state on
  failure. → KB note `methodology-refresh-token-before-write.md`. Same PR: **nudge accountability** —
  `team_members += last_nudged_at/last_response_at`, directory **Last-nudged + Status** columns (✓
  responded / ⏳ awaiting Nd, overdue ≥7d), email asks for a reply "even if no activity."
- **Update composer — Phase 1 (#560):** per-row 📝 → braindump box → ✨"Let CC write it up" (proxy polish,
  invent-nothing) → Save → appends new **`item_updates`** table (public read, reviewer insert,
  **immutable**; keyed `(item_type,item_id)`). Deep-link consumer: `?update=<key>#raci` OR
  `sessionStorage.cpl_update_focus` opens the composer.
- **Per-item nudge — Phase 2 (#561):** per-row 📣 emails THAT item's R/A people, **quoting the card** +
  a **direct link to its composer**.
- **📝 on every card — Phase 3 (#562):** generator emits a 📝 Update deep-link on each Activity header +
  Project card; retired the old `✎ Update` button. Dispatched the daily workflow to publish.

### The loop, end to end (LIVE)
**📣 per-item nudge → email quotes the card + links to the composer → recipient braindumps → CC writes it
up → saves to `item_updates` → reachable from every card**, with directory accountability tracking.
Round-trip = **link-to-form** (Sam's locked choice), NOT reply-parsing — *"the email is the doorbell,
COBI is the room."*

### Lessons / gotchas
- **Refresh the token before EVERY write.** A format-valid-but-expired JWT 401s silently; optimistic UI
  hides it as a phantom save. *Diagnosis tell:* the DB has far fewer rows than the user "saved" → suspect
  auth, not the write. Canonicalized in the KB note.
- **Confirm-before-build on the round-trip paid off.** Sam dismissed the first decision prompt, then
  reasoned his own way to *exactly* the link-to-form design. A crisp recommendation + short pause beats
  barreling ahead when the user is actively reasoning.
- **One deep-link consumer, many uses:** `consumePendingFocus` now serves RACI-row focus, the 📝 composer,
  and the per-item nudge link — via `sessionStorage` + `cpl-tab-activated`. Zero new module.
- **Pre-existing `update_log` collision:** a vestigial project-only `update_log` blocked
  `create table if not exists update_log`. Named the new one **`item_updates`**, left the old untouched.
- **Accidental commit on `main`** once — moved to the feature branch + `force-with-lease` (Rule 5). Caught
  via the PR's wrong head-SHA/file-count on fetch.

### Where we are now
The update loop is fully live. **Autonomous polish next:** surface the posted `item_updates` *on* the card
face + in the Annual Report (today cards still show `projects.latest_update`; the Report uses creation-era
`CPL_DATA`) — makes the Annual Report self-freshening. **Decision-gated:** the 3 lead emails for
`allowed_reviewers`. Standing lanes unchanged.
