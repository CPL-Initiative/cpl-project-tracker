---
title: Session 79 handoff — you are Session 79
created: 2026-06-26
updated: 2026-06-26
tags: [handoff, session-79, raci, item-updates, annual-report]
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/cobi_raci_nudge_lessons]]"
superseded: true
superseded_by: session_132_handoff.md
---

# You are Session 79

Session 78 (**SkyMap**) was a short, snappy one-PR trip — **PR #564, merged + live** — that closed the
*first half* of the Session-77 carryover: posted `item_updates` now show ON the Activity / sub-activity /
project **card face**. Read `docs/cobi_raci_nudge_lessons.md` (the 2026-06-26 "Session 78" section) first,
then this. Your job picks up the *second half*.

## What shipped (Session 78)

| PR | What |
|---|---|
| **#564** | **(1) 📝 + 👥 on sub-activity cards.** The `activity-kpi` cards (1.1, 1.2, …) now carry the same 📝 Update + 👥 RACI deep-links the Activity header + Project cards already had. A sub-activity IS a `project:<id>` RACI row, so the composer/focus already worked — only the affordance was missing. **(2) `card_updates.js`** — a static, read-only overlay: the generator stamps a hidden `<div class="cpl-live-update" data-update-key="activity:N\|project:<id>">` hook on every card; the overlay fetches the newest `item_updates` per key (anon read), fills it with **body + date + author**, reveals it, and hides that card's creation-era `.cpl-static-update` line. Code-only PR → dispatched the daily workflow post-merge. Tests: `tests/card_updates.test.js` (17). |

## The carryover you own (priority order)

**AUTONOMOUS — top of the list (the OTHER half of #4):**
1. **Surface `item_updates` into the Annual Report (`annual_report.js`).** Cards now self-freshen, but the
   Annual Report still assembles from creation-era `window.CPL_DATA`. Fold the newest `item_updates` per
   item into the **Activity-Progress** + **Spotlight** sections so the Report self-freshens too. Reuse the
   **exact pattern** from `card_updates.js`: anon Supabase read of `item_updates`, reduce to newest-per-key
   (`item_type:item_id`), splice the body into the section text. `annual_report.js` is static + lazy, so it
   can fetch on open (it already has a CONFIG-ish boot). Commit a jsdom test. This closes the
   "creation-era content" caveat for good.
2. **De-dup the composer (only if a 2nd surface needs it).** The 📝 composer lives inline in `raci.js`. If
   the Annual Report wants an inline composer too, extract to a shared `item_update.js`. Not urgent.

**DECISION-GATED — ask Sam, don't guess:**
3. **3 leads → `allowed_reviewers`.** Sam owes the exact emails for Crystal Nasio / Terence Nelson /
   Calvin/Gloria + his own `slee@cccco.edu`. Until they're reviewers, only `map@rccd.edu` can POST updates
   (everyone can already SEE them on the cards). The earlier "add now" emails didn't come through — re-ask.

**STANDING LANES (unchanged):** unverified-M-ID renumber re-mint (`docs/unverified_mid_renumber_scope.md`),
TMC Phase-2 acceptance engine (`docs/kb-notes/tmc-co-review-scope.md`), CPL-Assistant CCR/CER recommender
ETL (`docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md`), Fact-Sheet snapshot live-wire. Public
KB **#15** (Veterans plans) still awaiting Sam's review/merge.

## Docs to read, in order
1. `docs/cobi_raci_nudge_lessons.md` (Sessions 77 + 78) — the whole update-loop story.
2. `docs/kb-notes/methodology-live-overlay-onto-generated-cards.md` — the pattern you'll reuse for #1.
3. `docs/kb-notes/methodology-refresh-token-before-write.md` — the write-side companion (if you touch saves).
4. `CLAUDE.md` §2 (File Inventory: `card_updates.js`, `raci.js`, `annual_report.js`) + §8 (`item_updates`).

## Patterns that worked
- **Stamp the hook in the generator, overlay the value in static JS.** One JS file covers both HTMLs (no
  Rule-4 mirror), live the instant a row is written, strictly read-only. The generator's only job is the
  stable `data-update-key`. (KB note above.)
- **Reuse the RACI key everywhere.** `project:<id>` / `activity:N` addresses the card, the matrix, the
  deep-link, and the nudge with one string — no new id space. Sub-activity-vs-project stays purely visual.
- **Escape untrusted bodies** before injecting on a public page (test feeds an `<img onerror>` payload).
- **Code-only PR + post-merge workflow dispatch** for generator changes (cards live in regenerated
  sections); static JS + script tags go live on merge.

## Safety patterns to honor
- Never commit to `main`; sibling `claude/*` branch per PR; squash-merge on `clean`/`unstable`; poll CI via
  MCP `github` tools (not curl — the sandbox token can't reach GitHub). Rule 4: both HTMLs byte-identical.
- Additive Supabase only; `item_updates` is anon-SELECT + reviewer-INSERT, immutable (no update/delete).

## A moniker for you
SkyMap charted a clean short hop. Keep the Sky/Star streak or claim your own, Session 79. 🛰️
