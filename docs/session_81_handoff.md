---
title: Session 81 handoff — you are Session 81
created: 2026-06-28
updated: 2026-06-28
tags: [handoff, session-81, fact-sheet, statewide-recs, curate, raci, annual-report]
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/fact_sheet_lessons]]"
  - "[[docs/cobi_raci_nudge_lessons]]"
superseded: true
superseded_by: session_132_handoff.md
---

# You are Session 81

Two sessions ran concurrently on 2026-06-28, both merged + live: **Session 79 (StarBender)** — RACI-as-card-source
+ statewide Fact Sheet recs (data layer) — and **Session 80 (StarMan)** — the public Fact Sheet made
**Curate-editable**. Read `docs/fact_sheet_lessons.md` (the two 2026-06-28 sections) and
`docs/cobi_raci_nudge_lessons.md` (StarBender section) first, then this.

## What shipped

| Session / PRs | What |
|---|---|
| **79 StarBender · #567–#571** | **RACI becomes the card's source of truth** — card **Lead** derives from the RACI **Responsible** via `card_raci.js` (read-only overlay) + a hover roster on 👥; 27 leads seeded into `item_raci`; **nudge opt-OUT-gated**; sortable matrix/directory. **Statewide Fact Sheet recs** — additive per-exhibit `authoritative_recs` from raw `Collaborative Type == "CCC"` rows ONLY; `fact-sheet/_build_statewide_recs.py` → `fact-sheet/statewide_recs.js` (daily cron); 129 exhibits/329 recs; POST = canonical 10. |
| **80 StarMan · #570** | **Fact Sheet → Curate-editable.** Standalone `fact-sheet/factsheet_edit.js` overlays reviewer edits (text + hide/show) onto any box, keyed by **DOM-walked stable `data-fsk` keys** (no per-box HTML markup → tiny `index.html` diff), from `public.factsheet_overrides` (anon read, `is_allowed_reviewer()` write). ✎ Curate mode → docked raw-HTML editor (Save/Hide/Reset). Self-contained magic-link auth, refresh-before-write, **allowlist** sanitizer. JST upload card removed. Editing **excludes** `#statewide-exhibits`/`#progress`/`[data-bind]`. 31 jsdom tests. KB note `playbook-curate-editable-standalone-page.md`. |

Sam added the Supabase redirect-URL wildcard (`…/cpl-project-tracker/**`) himself; direct Fact-Sheet sign-in
works. He was live-editing the AB 123 box within minutes.

## The carryover you own (priority order)

**AUTONOMOUS — top of the list:**
1. **Fact Sheet consumer wedge** (StarBender's #1, still unbuilt). `fact-sheet/statewide_recs.js` is live
   (`window.CPL_STATEWIDE_RECS`, 129 exhibits) but nothing renders it. Build the additive overlay: a
   default-collapsed `<details>` under each statewide exhibit `<li>` (`.sw-list li` in `fact-sheet/index.html`)
   rendering `CPL_STATEWIDE_RECS[title]` → C-ID badge / title / units, plus the `<script src="statewide_recs.js">`
   tag. Match by exhibit title (Sam confirmed PDF/dataset titles match). **Read `factsheet_edit.js` first** — it
   DOM-walks `.sw-list` is excluded from Curate, but your new `<details>` will sit inside `#statewide-exhibits`,
   which is fine (that section is excluded from editing). Read-only, additive, escapes untrusted text; commit a test.
2. **Make `#statewide-exhibits` + `#progress` Curate-editable** (StarMan follow-up, now #572 landed). They're in
   `EXCLUDE_SECTIONS` in `factsheet_edit.js` purely because two sessions were editing the Fact Sheet at once.
   Drop them from the exclusion set — BUT keep the per-element `[data-bind]` skip (the live KPI values must stay
   non-editable). One-line change + a test asserting the live KPI numbers still aren't keyed. (Do this AFTER #1, or
   together — both touch the same region.)
3. **Surface `item_updates` into the Annual Report (`annual_report.js`).** STILL OPEN from Session 78/79 — cards
   self-freshen (`card_updates.js`), the Report doesn't. Fold newest `item_updates` per item into Activity-Progress
   + Spotlights (reuse the reduce-to-newest-per-key read). Commit a jsdom test.

**DECISION-GATED — ask Sam, don't guess:**
4. **3 leads → `allowed_reviewers`.** Sam still owes the exact emails for Crystal Nasio / Terence Nelson /
   Calvin Gloria + his own `slee@cccco.edu`. Until then only `map@rccd.edu` can write (everyone SEES edits). Re-ask.

**STANDING LANES (unchanged):** unverified-M-ID renumber re-mint (`docs/unverified_mid_renumber_scope.md`),
TMC Phase-2 acceptance engine (`docs/kb-notes/tmc-co-review-scope.md`), CPL-Assistant CCR/CER recommender ETL
(`docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md`), Fact-Sheet snapshot live-wire. Public KB **#15**
(Veterans plans) still awaiting Sam's review/merge.

## Docs to read, in order
1. `docs/fact_sheet_lessons.md` — both 2026-06-28 sections (statewide-recs no-scrape decision + the Curate overlay).
2. `docs/kb-notes/playbook-curate-editable-standalone-page.md` — the overlay/stable-key/auth pattern you'll touch in #1/#2.
3. `docs/kb-notes/reference-authoritative-statewide-exhibit-signal.md` — the `Collaborative Type == "CCC"` signal behind #1.
4. `CLAUDE.md` §2 (`fact-sheet/`, `card_raci.js`, `statewide_data.js`) + §8 (`factsheet_overrides`).

## Patterns that worked
- **DOM-walk stable keys instead of stamping HTML.** Editability driven from JS keys (`sectionId|slug(text)`)
  meant the `index.html` diff was 3 lines — zero collision with the concurrent Statewide-CRs session. Reuse this.
- **Stamp the hook in the generator / walk it in static JS; overlay live.** `card_raci.js` / `card_updates.js` /
  `factsheet_edit.js` — one file, read-only, additive, live the instant a row is written.
- **Allowlist > blocklist for any public innerHTML.** A security review flagged foreign-content mXSS in a
  blocklist sanitizer; the allowlist (formatting tags only, scheme-checked href) closed the whole class.
- **Probe the raw column for the discriminating flag; don't dedup by similarity** (StarBender's CCC signal).
- **Hold for input ONLY with a concrete reason.** PR #570 was held as a draft because Sam asked to coordinate
  timing with the parallel session — then merged on his "Go!". Collision-safety made the order not matter.

## Safety patterns to honor
- Never commit to `main`; sibling `claude/*` branch per PR; squash-merge on `clean`/`unstable`; poll CI via MCP
  `github` tools (not curl). Rule 4: `CPL_Dashboard.html` ≡ `index.html` (the Fact Sheet is standalone, exempt).
- Additive Supabase only; reviewer-gated writes via `is_allowed_reviewer()`. `factsheet_overrides` html is
  rendered to the public → keep the allowlist sanitizer on any new render path.
- The Fact Sheet's live KPI boxes are `[data-bind]` — never let Curate touch them (they're overwritten on load).

## A moniker for you
StarBender bent two threads into one; StarMan floated the Fact Sheet free to edit itself. Keep the Sky/Star
streak or claim your own, Session 81. 🚀
