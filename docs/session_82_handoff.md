---
title: Session 82 Handoff
created: 2026-06-28
updated: 2026-06-28
tags: [handoff, session-82, raci, nudges, fact-sheet, annual-report]
obsidian-folder: cpl-project-tracker
related: [[CLAUDE]], [[docs/cobi_raci_nudge_lessons]], [[docs/fact_sheet_lessons]]
---

You are Session 82 of the CPL Project Tracker — the RACI/nudge loop just shipped, and the Fact Sheet consumer wedge is yours to land.

## What shipped (Session 81 — StarFarout)

One merged PR — **#574** (squash-merged to `main`; code-only per the #562/#564 precedent, then `daily-dashboard.yml` dispatched post-merge to publish the regenerated card buttons). Branch `claude/raci-activity-nudge-feature-v8j4ns`. Three tweaks Sam framed as "tweak the RACI and Activity cards," all to the update-nudge loop:

1. **Per-row 📣 nudge on EVERY RACI matrix row** (`raci.js`). The per-item 📣 used to appear only on rows that already had eligible R/A people (gated on `itemNudgeRecipients(item).length`). StarFarout dropped that to `if (canEdit)` — the 📣 now shows on every Activity / sub-activity / project row when a reviewer is signed in, so they can nudge just one item. The Directory opt-out is **still** enforced inside `itemNudgeRecipients` (members with `nudge===false` are never emailed); `openItemNudge` alerts gracefully when a row has no one eligible yet.
2. **Bulk button renamed** — the filter-bar "📣 Nudge for updates" → **"📣 Nudge All"** (`raci.js`); tooltip now says it emails all opted-in members and points to a row's 📣 for a single item.
3. **📣 nudge button on every card** (`excel_to_dashboard.py` generator) — on Activity headers, sub-activity (activity-kpi) cards, and Projects-Grid cards, beside the existing 📝 Update / 👥 RACI links. Each sets `sessionStorage['cpl_nudge_focus']` = `"activity:N"` | `"project:<id>"` then deep-links `#raci`. A new `consumePendingFocus()` branch (`NUDGE_KEY = "cpl_nudge_focus"`) resolves the item, focuses its row, and opens its per-item nudge — mirroring the existing 📝 (`cpl_update_focus`) / 👥 (`cpl_raci_focus`) deep-link pattern exactly. Local regen: 4 Activity + 57 project nudge buttons (61 total), `CPL_Dashboard.html === index.html`.

New exported helpers on `window.CPL_RACI_TAB`: `_openItemNudge`, `_consume`, `_itemByKey(key)`. Suite **96/96** files green (`tests/raci.test.js` updated, `raci_nudge_optout.test.js` rewritten, `raci_card_nudge.test.js` new). New KB note: `docs/kb-notes/methodology-affordance-visibility-vs-action-eligibility.md`. The M-ID pipeline did NOT move — `#tab-pipeline` intentionally untouched this checkpoint.

## Also shipped (Session 81 cont.) — the Fact Sheet Curate arc, 3 more merged PRs

After the nudges, Sam pivoted to the public Fact Sheet: "be able to add or delete anywhere there are boxes or images." All landed on `fact-sheet/` (standalone — goes live on the next Pages deploy, no daily-cron dispatch):

1. **#576 — Curate boxes** (`fact-sheet/factsheet_edit.js`): ＋ **add** a box (clones the section's representative box → sample text, so a new box always matches the section format), **✕ delete** (added box = true delete, baked box = hide), **drag-reorder**.
2. **#578 — Curate images**: 🖼 **add** (upload), **S/M/L/Full resize**, **⤢ replace**, **✕ delete**. Image *bytes* go in a new public-read / reviewer-write Supabase **Storage bucket `factsheet-images`** (`fact-sheet/supabase_factsheet_images.sql`); the override stores the URL.
3. **#577 — "My CPL Stories" section**: 4 random story cards from `map.rccd.edu/cplstories/` + a "See all ↗" link, sourced by **headless Chromium on a runner** (`tools/source_cpl_stories.mjs` + `.github/workflows/cpl-stories.yml`) — the site is SiteGround-bot-protected, so a `curl` gets a CAPTCHA stub; Playwright passes the JS challenge.

**The crux to carry forward:** boxes + images both ride the **unchanged `factsheet_overrides` table** via **reserved key namespaces** (`|add|`, `|__order`, `|img|`, `|fig|`) the overlay *materializes* — no schema migration, and `index.html` stayed untouched (the overlay injects all chrome). New KB note: `docs/kb-notes/methodology-reserved-key-namespaces-on-overrides-table.md`; full story in `docs/fact_sheet_lessons.md` (the three 2026-06-28 StarFarout sections). Suite **99/99**. So the Curate surface is now full: text edit / hide / add / delete / reorder boxes + images. **One-time Sam toggle still pending** (from #570): add the Fact Sheet URL (or `…/cpl-project-tracker/**`) to Supabase **Auth → Redirect URLs** so *direct* magic-link sign-in from the Fact Sheet completes on the page.

## The carryover you own (priority order)

**✅ SHIPPED this session (Sam: "All 3") — #580 / #581 / #582:**

1. ✅ **Fact Sheet consumer wedge (#580).** `fact-sheet/statewide_recs_render.js` surfaces each exhibit's authoritative statewide credit recs (course title — units, + C-ID) as a collapsible "N statewide credit recs" toggle under each `<li>`. Exact-title join, **verified 129/129 keys match a real `<li>` before shipping**; read-only, escaped, idempotent; `#statewide-exhibits` is Curate-excluded so no overlap. Also loaded `statewide_recs.js` (the data file wasn't wired in). Test: `tests/statewide_recs_render.test.js` (22).
2. ✅ **Annual Report self-freshening (#581).** `annual_report.js` folds the newest `item_updates` (keyed `activity:N` / `project:<id>`, reusing the `card_updates.js` read) into Activity Progress + Spotlights — render-first / freshen-after, guarded by `state.userEdited`. Test grew 29 → 36.
3. ✅ **Reviewer access (#582 + live Supabase).** Crystal Nasio / Terence Nelson / Calvin Gloria / `slee@cccco.edu` added to `allowed_reviewers` (live + committed seed). They can now sign in and edit CCR / RACI / TMC / Fact Sheet.

**STILL ON SAM (one-time):** add the Fact Sheet URL (or `…/cpl-project-tracker/**`) to Supabase **Auth → Redirect URLs** so a *direct* magic-link sign-in from the Fact Sheet completes on that page (today it lands on the dashboard tab).

**STANDING LANES (next priority):**

4. Unverified-M-ID renumber re-mint — `docs/unverified_mid_renumber_scope.md` (follow the Rule 7 playbook: dry-run → alias map → re-key promotions → atomic land in the 06:17 cron window).
5. TMC Phase-2 acceptance engine — `docs/kb-notes/tmc-co-review-scope.md`.
6. CPL-Assistant CCR/CER recommender ETL — `docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md`.
7. Public KB **PR #15** (Veterans plans) still awaiting Sam's review/merge — nudge him, don't self-merge (the public KB is human-gated curation only).

## Docs to read, in order

1. `CLAUDE.md` — Critical Rules (esp. Rule 4 mirror, Rule 8 checkpoint, the auto-merge policy) + §11 roadmap.
2. `docs/cobi_raci_nudge_lessons.md` — the whole RACI/nudge workstream, Sessions 75–81. Your most recent ground.
3. `docs/fact_sheet_lessons.md` (2026-06-28) — the consumer-wedge spec is here; read before touching `fact-sheet/`.
4. `docs/kb-notes/methodology-affordance-visibility-vs-action-eligibility.md` — this session's durable lesson (below).
5. `docs/kb-notes/reference-authoritative-statewide-exhibit-signal.md` — why `CPL_STATEWIDE_RECS` is CCC-only/authoritative.
6. `kb/cpl_todos.json` — the dashboard To-Do feed; refresh it at your checkpoint.

## Patterns that worked

- **Separate affordance VISIBILITY from action ELIGIBILITY.** Show a notification/action affordance (the 📣 nudge) CONSISTENTLY on every row/card; enforce the opt-out / no-eligible-recipient case in the DATA layer (the recipient builder `itemNudgeRecipients` → `buildItemNudgeHref` returns `null`), and let the action alert gracefully when there's no one to act on. **Test eligibility in the recipient/href layer, NOT button visibility** — that's why `raci_nudge_optout.test.js` now asserts a null href for an all-opted-out row, not a hidden button. Builds on Session 79's "filter a notification's AUDIENCE by the consent layer, not the role layer."
- **Reuse the deep-link-consumer pattern.** The 📣 card button is the third instance of `sessionStorage[<focus key>]` → navigate `#raci` → a `consumePendingFocus()` branch resolves + focuses + acts. Don't invent a new transport — add a key + a branch.
- **Code-only PR + post-merge dispatch.** Card hooks live in regenerated sections, so ship the generator/consumer change WITHOUT committing the regenerated HTML, then dispatch `daily-dashboard.yml` after merge to publish. Avoids the ~100MB artifact conflicts that bit #348.
- **Local regen as the Rule-4 proof.** Run `python3 excel_to_dashboard.py` locally, confirm the expected button counts and `CPL_Dashboard.html === index.html` before pushing.

## Safety patterns to honor

- **Never commit to `main`** — sibling `claude/<desc>` branch per independent PR; squash-merge via `mcp__github__merge_pull_request`.
- **Squash-merge on `clean` OR `unstable`** — `unstable` means only a non-required check is pending. Don't over-wait for `clean`; don't end the turn to wait for Sam's "Go!".
- **Poll CI via the MCP `github` tools, NOT `curl`** — the sandbox's `GH_TOKEN`/`curl` against `api.github.com` returns "GitHub access is not enabled." Use `pull_request_read` / `actions_list`. Webhooks don't deliver CI *success*, so you must poll.
- **Rule 4: `CPL_Dashboard.html` === `index.html`** — any HTML/static-tag/nav change goes in BOTH. The generator copies one to the other; never edit only one.
- **Reviewer-gated Supabase writes via `is_allowed_reviewer()`** — anon reads are open, writes are gated. Refresh the magic-link access token before every write (`ensureFresh()`); never loosen the RLS to always-true for a reviewer table.

## A moniker for you

StarFarout caps the Sky→Star streak (SkyMap → StarBender → StarMan → StarFarout). Keep it going — StarStruck, StarChart, StarVault — or break orbit and claim your own. Whatever you pick, sign your §11 narrative and the next handoff with it.
