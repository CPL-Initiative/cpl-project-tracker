---
title: Session 80 handoff — you are Session 80
created: 2026-06-28
updated: 2026-06-28
tags: [handoff, session-80, raci, fact-sheet, statewide-recs, annual-report]
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/cobi_raci_nudge_lessons]]"
  - "[[docs/fact_sheet_lessons]]"
---

# You are Session 80

Session 79 (**StarBender**) ran two threads, Sam live-testing throughout — **6 PRs #567–#571, all merged +
live.** Read `docs/cobi_raci_nudge_lessons.md` (the 2026-06-28 "StarBender" section) and
`docs/fact_sheet_lessons.md` (same date) first, then this.

## What shipped (Session 79)

| PRs | What |
|---|---|
| **#567–#570** | **RACI becomes the card's source of truth.** Card **Lead** now derives from the RACI **Responsible** (not the stale `projects.lead`) via a new read-only overlay **`card_raci.js`** (the `card_updates.js` pattern) + a **hover roster** on the 👥 button. The 27 remaining `projects.lead` values **seeded** into `item_raci` as Responsible (Beth Kay dropped — left the org; titles' embedded orgs kept over seed placeholders). **Nudge made opt-OUT-gated** — `itemNudgeRecipients()` drops `nudge===false` members (fixed wrongful nudges firing for unchecked members) + cleared the stale ⏳awaiting tags. **Sortable matrix + directory columns** (click-to-sort; the tree flattens on sort, `⤺ tree view` restores). Tests: `card_raci`(23) / `raci_sortable`(13) / `raci_nudge_optout`(3). |
| **#571** | **Statewide Fact Sheet credit recs from our own data — no scraping.** Producer adds an additive per-exhibit `authoritative_recs` collected from raw `Collaborative Type == "CCC"` rows ONLY (the one MAP-published statewide exhibit); builder `fact-sheet/_build_statewide_recs.py` → `fact-sheet/statewide_recs.js` (daily cron). **129 exhibits / 329 recs live**; POST Basic Academy = the canonical **10** (was inflated to 42). No-CCC list = 3 (DLPT-Russian, HRCM 001, NCCER CORE — fix in MAP). KB note: `reference-authoritative-statewide-exhibit-signal.md`. Tests: `statewide_recs_test`(12). |

## The carryover you own (priority order)

**AUTONOMOUS — top of the list:**
1. **Fact Sheet consumer wedge — NOW UNBLOCKED.** `fact-sheet/statewide_recs.js` is live but nothing
   renders it yet. The concurrent editable-Fact-Sheet PR **#570 already merged** (the collision we were
   waiting on is gone). Build the additive overlay: a default-collapsed `<details>` under each statewide
   exhibit `<li>` in `fact-sheet/index.html` (`.sw-list li`) rendering `window.CPL_STATEWIDE_RECS[title]`
   → C-ID badge / title / units, plus the `<script src="statewide_recs.js">` tag. Match by exhibit title
   (the PDF and dataset titles match — Sam confirmed). Rebase onto fresh main first (#570 touched
   `fact-sheet/index.html` + added `factsheet.js` editable bits — read them before splicing). Designed as
   the `card_raci.js` pattern: read-only, additive, escapes untrusted text. Commit a jsdom/py test.
2. **Surface `item_updates` into the Annual Report (`annual_report.js`).** STILL OPEN from Session 78/79 —
   cards self-freshen, the Report doesn't. Fold newest `item_updates` per item into the Activity-Progress +
   Spotlight sections (reuse the `card_updates.js` reduce-to-newest-per-key read; `annual_report.js` is
   static+lazy, fetch on open). Commit a jsdom test. Closes the "creation-era content" caveat for good.

**DECISION-GATED — ask Sam, don't guess:**
3. **3 leads → `allowed_reviewers`.** Sam still owes the exact emails for Crystal Nasio / Terence Nelson /
   Calvin/Gloria + his own `slee@cccco.edu`. Until they're reviewers, only `map@rccd.edu` can POST updates
   (everyone already SEES them). Re-ask — the earlier "add now" emails didn't come through.

**STANDING LANES (unchanged):** unverified-M-ID renumber re-mint (`docs/unverified_mid_renumber_scope.md`),
TMC Phase-2 acceptance engine (`docs/kb-notes/tmc-co-review-scope.md`), CPL-Assistant CCR/CER recommender
ETL (`docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md`), Fact-Sheet snapshot live-wire. Public
KB **#15** (Veterans plans) still awaiting Sam's review/merge.

## Docs to read, in order
1. `docs/fact_sheet_lessons.md` (2026-06-28) — the statewide-recs story + the no-scrape decision.
2. `docs/kb-notes/reference-authoritative-statewide-exhibit-signal.md` — the `Collaborative Type == "CCC"`
   signal you'll lean on; how the producer/builder/probe fit.
3. `docs/cobi_raci_nudge_lessons.md` (2026-06-28) — RACI-as-source-of-truth + the `card_raci.js` pattern.
4. `CLAUDE.md` §2 (File Inventory: `card_raci.js`, `raci.js`, `statewide_data.js`, `fact-sheet/`) +
   §9 (EACR identity — context for why the unified grouping over-counts).

## Patterns that worked
- **Probe the raw columns for the discriminating flag; don't dedup by similarity.** The statewide
  over-count was a *provenance* problem (`Collaborative Type == "CCC"`), not a fuzzy-match one. One exact
  equality beat any normalization heuristic.
- **Runner-as-proxy for egress-blocked APIs.** The MAP API is 403 from the sandbox; a GitHub Actions
  runner reaches it. Curriculum data only, no PII; the probe commits nothing.
- **Stamp the hook in the generator, overlay the value in static JS.** `card_raci.js` / `card_updates.js`:
  one file, both HTMLs, live the instant a row is written, strictly read-only.
- **Make the consent layer win over the role layer.** A nudge's audience = RACI role ∩ opt-in; the
  directory toggle gates, not the membership.
- **Code-only PR + post-merge `actions_run_trigger` dispatch** for producer changes (artifacts live in the
  daily cron); static JS + script tags go live on merge.

## Safety patterns to honor
- Never commit to `main`; sibling `claude/*` branch per PR; squash-merge on `clean`/`unstable`; poll CI via
  MCP `github` tools (not curl — the sandbox token can't reach GitHub). Rule 4: both HTMLs byte-identical.
- Additive Supabase only. `authoritative_recs` is additive (EACR's `credit_recs` untouched). Never re-key
  or relabel MAP's raw `Collaborative Type` — we read it, never write it.
- When another session is touching the same file (Fact Sheet had a concurrent editor), coordinate via Sam
  and keep your change additive + rebased onto their merge.

## A moniker for you
StarBender bent two threads into one trip. Keep the Sky/Star streak or claim your own, Session 80. 🛰️
