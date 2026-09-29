---
title: Session 78 handoff — you are Session 78
created: 2026-06-26
updated: 2026-06-26
tags: [handoff, session-78, raci, nudges, update-composer, annual-report]
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/cobi_raci_nudge_lessons]]"
superseded: true
superseded_by: session_132_handoff.md
---

# You are Session 78

Session 77 (**StarPort**) was a hyperglide RACI/nudge sprint with Sam live in the loop — **8 PRs
#556–#562, all merged + live**. Read `docs/cobi_raci_nudge_lessons.md` (the 2026-06-26 "Session 77"
section) first, then this.

## What shipped (Session 77)

| PR | What |
|---|---|
| **#556** | **Copy-RACI** — `⧉ copy` a populated row's R/A/C/I onto any set of other rows (source preview + filterable target checklist + select-all). |
| **#557** | **Annual Report tab** (`#annual-report`, `annual_report.js`) — assembles a 6-section report (Exec Summary · Vision 2030 & Goals · Activity Progress · Statewide Impact · Spotlights · Looking Ahead) from live `CPL_DATA`; editable + live preview + ✨AI polish (proxy) + ⬇Word + 🖨Print. |
| **#558** | **Check-all/clear-all** on the Team-Directory nudge column + a **manual 📣 team nudge** (mailto draft to opted-in members). |
| **#559** | **🐛 THE big fix — RACI saves weren't persisting.** `raci.js` validated the JWT *format* but never *refreshed* it → after ~1h every write 401'd silently while the UI showed "Signed in" (only `activity:1` had saved). `sbWrite` is now **refresh-gated** (renews via `refresh_token`, mirrors `unified_courses.js`) + `saveRaci` rolls back optimistic state on failure. Also lands the **nudge accountability layer**: `last_nudged_at`/`last_response_at` on `team_members`, directory **Last-nudged + Status** columns (✓ responded / ⏳ awaiting Nd, overdue ≥7d), email asks for a reply "even if no activity". |
| **#560** | **Update composer (epic Phase 1)** — per-row **📝** opens a braindump box → ✨"Let CC write it up" (proxy) → Save → appends new **`item_updates`** table (public read, reviewer insert, immutable; keyed `(item_type,item_id)`). + a deep-link consumer: `?update=<key>#raci` / `sessionStorage.cpl_update_focus` opens the composer. |
| **#561** | **Per-item nudge (Phase 2)** — per-row **📣** emails THAT item's R/A people, **quoting the card** + a **direct link to its composer** (`?update=…#raci`). No mailbox, no reply-parsing. |
| **#562** | **📝 Update deep-link on every Activity/Project card (Phase 3)** — mirrors the Session-76 RACI deep-link; retired the old project-card `✎ Update` button (composer supersedes it). Generator change → **dispatched the daily workflow** to publish. |

## The epic, end to end (now LIVE)
**📣 nudge (per-item) → email quotes the card + links to the composer → recipient braindumps → CC
writes it up → saves to `item_updates` → reachable from every card**, with accountability tracking in
the directory. Auth model = signed-in reviewers (magic-link); round-trip = **link-to-form** (Sam's
locked choice), not reply-parsing.

## Carry-over (priority order)

**DECISION-GATED — ask Sam, don't guess:**
1. **3 leads → `allowed_reviewers`** (#3) — Sam said "add now" but the **emails didn't come through**.
   Get Crystal Nasio / Terence Nelson / Calvin/Gloria's exact emails + add Sam's `slee@cccco.edu`. Until
   they're reviewers, only `map@rccd.edu` can post updates / save RACI.
2. **Nudge auto-send** — Sam chose **keep mailto** for now. Only revisit (Teams webhook / Graph sendMail)
   if he asks.
3. **`update_log` (old project-only table)** — vestigial; the new `item_updates` replaces its intent.
   Leave it; don't build on it.

**AUTONOMOUS (epic polish — no decision needed):**
4. **Surface posted `item_updates` ON the card face + in the Annual Report.** Today the composer writes
   to `item_updates` but the card still displays `projects.latest_update` and the Annual Report uses
   creation-era `CPL_DATA` updates. Make the cards + Annual Report show the latest `item_updates` entry
   (the cron has `SUPABASE_SERVICE_KEY`, so the generator *could* read it; or the consumer JS overlays
   it live). This makes the Annual Report self-freshening and closes the "creation-era content" caveat.
5. **De-dup the composer** — it currently lives inline in `raci.js`. If a 2nd surface needs it, extract
   to a shared `item_update.js`. Not urgent (only RACI uses it).

**STANDING LANES (unchanged):** unverified-M-ID renumber re-mint (`docs/unverified_mid_renumber_scope.md`),
TMC Phase-2 acceptance engine (`docs/kb-notes/tmc-co-review-scope.md`), CPL-Assistant CCR/CER recommender
ETL (`docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md`), Fact-Sheet snapshot live-wire.
Public KB **#15** (Veterans plans) still awaiting Sam's review/merge.

## Patterns that worked
- **Refresh the token before EVERY write** — a format-valid-but-expired JWT 401s silently; optimistic UI
  masks it. New KB note: `docs/kb-notes/methodology-refresh-token-before-write.md`.
- **Deep-link into a tab module's modal** via `sessionStorage` + a `cpl-tab-activated` consumer (Session-76
  RACI pattern) — reused for both the 📝 composer and the per-item nudge link. Zero new infra.
- **mailto = the doorbell, COBI = the room.** The round-trip needs no inbox: the email just links to an
  on-dashboard form. Confirm-before-build paid off (Sam reasoned to the same design himself).
- **Static asset = live on merge** (raci.js); only the generator change (#562) needed a workflow dispatch.

## Safety patterns to honor
- Never commit to `main`; sibling `claude/*` branches per PR; squash-merge on `clean`/`unstable`; poll CI
  via MCP `github` tools (not curl). When a commit lands on `main` locally by accident, move it to the
  feature branch + `force-with-lease` (Rule 5: never force-push main) — happened once this session, fixed.
- Additive Supabase migrations only (applied `team_members += last_nudged_at/last_response_at` and new
  `item_updates` live via MCP); commit the SQL to `raci/supabase_raci.sql` for provenance.

## A moniker for you
StarPort docked after a hyperglide ride. Keep the Sky/Star streak or claim your own, Session 78. 🚀
