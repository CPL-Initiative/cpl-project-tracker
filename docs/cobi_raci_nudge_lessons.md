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

---

## 2026-06-26 — Session 78 (SkyMap): posted updates on the card face

A tight one-PR follow-on (**#564**, merged + live) that closed the first half of Session-77 carryover #4
— surfacing the `item_updates` a curator posts via the RACI 📝 composer onto the Activity / sub-activity /
project **cards** themselves (until now they showed there only inside the RACI tab).

### What shipped
- **📝 + 👥 on sub-activity cards.** The deep-links were on the Activity header (`activity:N`) and the
  Projects-Grid cards (`project:<id>`) but NOT the `activity-kpi` sub-activity cards (1.1/1.2/…). Added both.
  Key insight: a sub-activity **IS** a `project:<id>` RACI row (the ids 1.1–5.1 are in both
  `CPL_DATA.activity_kpis` and `CPL_DATA.projects`), so the composer + focus already worked — only the
  card affordance was missing.
- **`card_updates.js` — a read-only live overlay.** The generator stamps a hidden
  `<div class="cpl-live-update" data-update-key="activity:N|project:<id>">` hook on every card + marks the
  creation-era "Latest Update" line `.cpl-static-update`. The overlay fetches `item_updates` (anon read,
  newest-first), reduces to the newest row per key, fills each matching hook with **body + date + author**,
  and **hides the static line in that same card** (`closest('.activity-kpi-card,.project-card,.activity-group')`).
  Runs on load + re-applies on `cpl-tab-activated`.

### Lessons / gotchas
- **Live-overlay > generator-bake for live data on regenerated cards.** The cron *could* read `item_updates`
  (it has `SUPABASE_SERVICE_KEY`) and bake the text in, but a static JS overlay wins: one file covers both
  HTMLs (no Rule-4 mirror), it's live the instant a curator posts (no waiting for the next cron), and it
  stays read-only. The generator's only job is to stamp a stable **`data-update-key` hook** = the exact
  `item_type:item_id` the writer used. Canonicalized in the KB note.
- **One key, two surfaces.** Reusing the RACI key (`project:1.1`) for the card hook means the card overlay,
  the RACI matrix, the deep-link focus, and the nudge email all address the same row with one string — no
  new id space. The sub-activity-vs-project distinction stays purely visual (handoff S76 decision held).
- **Escape the body.** `item_updates.body` is reviewer-written but still untrusted on a public page — the
  overlay HTML-escapes before injecting (guarded by a test that feeds an `<img onerror>` payload).
- **Code-only + post-merge dispatch** (the #562 pattern) — the hooks live in regenerated sections, so the
  PR shipped generator + JS + script-tags only; dispatched `daily-dashboard.yml` after merge to publish.

### Where we are now
The card face now self-freshens from `item_updates`. **The mirror half is still open:** `annual_report.js`
assembles from creation-era `CPL_DATA` — fold the latest `item_updates` per item into the Activity-Progress
+ Spotlight sections so the Annual Report self-freshens too (carryover #4, second half). **Decision-gated**
still: the 3 lead emails for `allowed_reviewers` (only `map@rccd.edu` can post until then). Standing lanes
unchanged.

### 2026-06-27 addendum (SkyMap) — edit + delete prior updates

Sam posted a "Test" update to verify the loop, then wanted to remove it. `item_updates` was
**append-only by design** (reviewer INSERT, no UPDATE/DELETE — "immutable history"). He asked for
edit + delete, so we lifted the immutability:
- **Schema:** added a nullable `edited_at` + reviewer-gated `iu_update` / `iu_delete` RLS policies
  (`is_allowed_reviewer()`, mirroring `iu_insert`). Additive migration `item_updates_edit_delete`,
  applied live + committed to `raci/supabase_raci.sql`.
- **Composer:** each history row now carries **✏️ Edit** (inline textarea → `PATCH …?id=eq.<id>`
  `{body, edited_at}`) and **🗑 Delete** (`confirm()` → `DELETE …?id=eq.<id>`) for signed-in reviewers;
  both refresh-gated via `sbWrite`. An edited row shows "· edited".
- **The card-revert gotcha:** deleting the *last* update for a key leaves the card's live hook showing
  a now-gone update. `card_updates.js applyTo` now handles `_latest[key] === undefined` on a
  previously-filled hook → clears + hides the hook and **re-shows the creation-era `.cpl-static-update`
  line**. And the idempotency key moved from `created_at` to `id@(edited_at||created_at)` so an **edit**
  (same created_at, new edited_at) repaints. Both guarded by tests.
- Edit/delete fire `cpl-item-updated`, so the card reflects the change immediately (same event the
  Session-78 refetch fix added). Authoritative `id` comes from the `select=*` load + the POST
  `return=representation`; the affordances no-op when a just-posted row lacks an `id` (rare).

Decision note: we chose a **hard delete** (Sam wants the entry gone), not a soft-delete tombstone —
the table isn't an audit-of-record, and the `raw` braindump column already preserves provenance for
kept rows.

### 2026-06-28 (StarBender, Session 79) — RACI becomes the card's source of truth

Sam was testing the update loop on sub-activity 1.1 and caught that the card said
**lead = Terence Nelson** while the RACI **Responsible = Malone Dunlavy**. Two
sources of truth for "who owns this." We made RACI the single one and added a few
adjacent polish items. Five threads, all merged + live:

- **Card Lead now derives from RACI (`card_raci.js`, NEW).** A static, read-only,
  anon-Supabase overlay (the `card_updates.js` pattern): the generator stamps a
  `<span class="cpl-raci-lead" data-raci-key="project:<id>|activity:N">` on every
  Activity / sub-activity / project card (seeded with the OLD `projects.lead` text
  as graceful fallback); the overlay fetches `item_raci`, resolves each card's
  **Responsible → Accountable → old lead** and rewrites the span. **Lesson:** the
  precedence matters — R is "does the work" (the right card lead); fall back to A
  only when R is empty, and to the creation-era lead only when the row is
  un-RACI'd. One file, both HTMLs, no Rule-4 mirror beyond the `<script>` tag.
- **Hover roster.** Sam: "on hover over the RACI button, show the members so folks
  don't have to open the card." `card_raci.js` builds a `rosterHtml` tooltip
  (R/A/C/I names grouped) on the 👥 RACI affordance, reusing the same `item_raci`
  fetch. Exports (`leadNames`/`byKey`/`rosterHtml`/`roleNames`) are unit-tested
  (`tests/card_raci.test.js`, 23).
- **Lead seeding — "Seed all."** The 27 remaining `projects.lead` values were
  migrated into `item_raci` as **Responsible** so the matrix isn't blank where a
  card historically had a lead. Two cleanups Sam called mid-seed: **drop Beth Kay**
  (no longer with the org) and **use the titles' embedded orgs** rather than the
  seeded org placeholders (ASCCC / RP Group / CO MIS / MAP Team). Lesson: seed
  from the richest existing field, but let the human prune as it lands — the seed
  is a starting point, not the truth.
- **Nudge opt-out bug (real bug, real fix).** Sam had only himself checked, yet 3
  nudges fired (him, Malone, James Todd). Root cause: the per-item nudge built its
  recipient list from the **RACI R/A membership**, ignoring the Team Directory's
  per-member **Nudge** toggle. Fix: `itemNudgeRecipients()` now drops any member
  with `nudge === false` — **the nudge is opt-OUT-gated, the directory toggle wins.**
  Then cleared the stale "⏳ awaiting" tags those wrongful nudges had stamped.
  `tests/raci_nudge_optout.test.js` (3) guards it. Lesson: a notification's
  audience must be filtered by the *consent* layer, not just the *role* layer.
- **Sortable matrix + directory columns.** Click a header to sort. The RACI matrix
  is a 3-tier tree, so sorting **flattens** it (a `⤺ tree view` chip restores the
  hierarchy); the directory sorts a copy. Helpers `natCmp`/`cmpVals`/`sortableTh`/
  `statusRank` + `state.msort/dsort`; `tests/raci_sortable.test.js` (13). Lesson:
  sorting a tree means choosing flatten-vs-stay — we flatten and offer one-click
  back, rather than sort-within-parent (which reads as "nothing happened" on a
  small matrix).

### 2026-06-28 (StarFarout, Session 81) — 📣 nudge everywhere: separating affordance visibility from action eligibility

One merged PR (#574, squash to `main`; `daily-dashboard.yml` dispatched post-merge to publish the card buttons). Branch `claude/raci-activity-nudge-feature-v8j4ns`. Three tweaks Sam asked for, framed as "tweak the RACI and Activity cards."

### What shipped
- **Per-row 📣 nudge on EVERY RACI matrix row** (`raci.js`) — dropped the old `itemNudgeRecipients(item).length` gate to a plain `if (canEdit)`, so the 📣 shows on every Activity / sub-activity / project row when a reviewer is signed in (nudge just one item). The Team Directory **opt-out is still enforced inside `itemNudgeRecipients`** (`nudge===false` members never emailed); `openItemNudge` alerts gracefully when a row has no one eligible yet.
- **Bulk button renamed** — filter-bar "📣 Nudge for updates" → **"📣 Nudge All"** (`raci.js`); tooltip now says it emails ALL opted-in members and points to a row's 📣 for a single item.
- **📣 nudge button on EVERY card** (`excel_to_dashboard.py` generator) — on Activity headers, sub-activity (activity-kpi) cards, and Projects-Grid cards, next to the existing 📝 Update / 👥 RACI links. Each sets `sessionStorage['cpl_nudge_focus'] = "activity:N" | "project:<id>"` then deep-links `#raci`. New `consumePendingFocus()` branch (`NUDGE_KEY = "cpl_nudge_focus"`) resolves the item, focuses its row, opens its per-item nudge — mirrors the existing 📝 (`cpl_update_focus`) / 👥 (`cpl_raci_focus`) pattern exactly. Local regen: 4 Activity + 57 project buttons (61), and `CPL_Dashboard.html === index.html` (Rule 4 holds).

### Lessons / gotchas
- **Separate affordance VISIBILITY from action ELIGIBILITY.** Show the 📣 affordance consistently on every row/card; enforce the opt-out / no-eligible-recipient case in the **data layer** (`itemNudgeRecipients` → `buildItemNudgeHref` returns `null`), and let the action **alert gracefully** when there's no one to act on. **Test eligibility in the recipient/href layer, NOT button visibility** — hence the rewritten `raci_nudge_optout.test.js` asserts a `null` nudge href for an all-opted-out row (not a hidden button). Builds on Session 79's "filter a notification's AUDIENCE by the consent layer, not the role layer." New KB note: `docs/kb-notes/methodology-affordance-visibility-vs-action-eligibility.md` (methodology).
- **Tests** (jsdom, `npm test` — 96/96 files pass): `raci.test.js` updated (📣 now on a row with no R/A; opt-out asserted via null href); `raci_nudge_optout.test.js` rewritten (button on every signed-in row; opt-out → null href, mailto targets the opted-in member); new `raci_card_nudge.test.js` (per-card deep-link consumer + "Nudge All" rename + anon behaviour — no bulk/per-row 📣 signed out, deep-link still routes). New exports on `window.CPL_RACI_TAB`: `_openItemNudge`, `_consume`, `_itemByKey`.
- **Artifact policy** — code-only PR (no regenerated HTML), per the #562/#564 precedent: card hooks live in regenerated sections, so dispatch the workflow after merge. The `raci.js` per-row nudge + "Nudge All" rename are live on merge; card buttons go live on the regen.
- **Pipeline untouched** — this is the RACI/nudge workstream, so the `#tab-pipeline` viz is intentionally NOT refreshed this checkpoint.

### Where we are now
Carryover (Session 82), unchanged from the prior handoff:
1. **(AUTONOMOUS, top) Fact Sheet consumer wedge** — render `window.CPL_STATEWIDE_RECS` (`fact-sheet/statewide_recs.js`, 129 exhibits, live) as a default-collapsed `<details>` under each statewide exhibit `<li>` (`.sw-list li` in `fact-sheet/index.html`), C-ID/title/units. Additive, read-only, escape untrusted text, commit a test. See `docs/fact_sheet_lessons.md` (2026-06-28).
2. **(AUTONOMOUS) Annual Report self-freshening** — fold the newest `item_updates` per item into `annual_report.js` (Activity-Progress + Spotlights); cards already self-freshen via `card_updates.js`, the Report doesn't yet.
3. **(DECISION-GATED — ask Sam)** the 3 lead emails for `allowed_reviewers`: Crystal Nasio / Terence Nelson / Calvin Gloria + Sam's own slee@cccco.edu. Until then only map@rccd.edu can write (everyone SEES edits).
4. **(STANDING LANES)** unverified-M-ID renumber re-mint (`docs/unverified_mid_renumber_scope.md`); TMC Phase-2 acceptance engine (`docs/kb-notes/tmc-co-review-scope.md`); CPL-Assistant CCR/CER recommender ETL (`docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md`). Public KB PR #15 (Veterans plans) still awaiting Sam's review/merge.
