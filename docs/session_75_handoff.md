---
title: Session 75 handoff — you are Session 75
created: 2026-06-25
updated: 2026-06-25
tags: [handoff, session-75, fact-sheet, public-page, ccr, re-mint, tmc, cpl-assistant]
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/fact_sheet_lessons]]"
  - "[[docs/unverified_mid_renumber_scope]]"
  - "[[docs/kb-notes/tmc-co-review-scope]]"
  - "[[docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope]]"
---

# You are Session 75

Session 74 (**SkyBlaster**) was a fast, self-contained product sprint: it built
the **public CPL Fact Sheet** end-to-end with Sam in the loop. Two PRs, both
merged + LIVE: **#537** (the page + the COBI launch link) and **#540** (a
Statewide Exhibits section + a KPI-count reconciliation). Everything else from
the standing engineering lanes is untouched and still queued.

## What shipped this session (Fact Sheet — DONE)

A new public, **standalone** page at
`https://cpl-initiative.github.io/cpl-project-tracker/fact-sheet/` that recreates
the Feb-2026 journalist Fact Sheet PDF, pulls live KPIs from
`../live_metrics.json`, and prints to a clean PDF. It "sits alone" (no COBI nav)
so consultants can be linked to it without reaching the internal tabs. A
`📄 CPL Fact Sheet ↗` link in the COBI nav rail (both HTMLs, Rule 4, a non-tab
anchor) opens it. Cambria prose / Calibri data, 0.4in print margins. The 3 PDF
screenshots are preserved in `fact-sheet/img/`.

**Read first if you touch it:** [`docs/fact_sheet_lessons.md`](fact_sheet_lessons.md)
and [`docs/kb-notes/playbook-standalone-public-page.md`](kb-notes/playbook-standalone-public-page.md).
Files: `fact-sheet/index.html` (content), `factsheet.js` (live binding + print),
`factsheet.css` (theme + print). Static — NOT a daily-cron artifact.

### Fact-Sheet follow-ups (optional, low priority)
1. **Live-wire the snapshot tier.** Only the 6 headline KPIs auto-update (from
   `live_metrics.json`). The 5 exhibit/recommendation KPI cards + the Statewide
   Exhibits per-sector counts are a labeled snapshot from the MAP Custom Reporting
   Module. Have the daily cron write a small committed CustomReport snapshot the
   page can fetch, so those go live too.
2. **Reproduce the "One Knowledge Layer" technology-landscape diagram as live
   HTML/SVG** (sharper + regen-proof than the preserved screenshot).
3. **Semi-static figures** — Sam to confirm/refresh the Vision 2030 workplan SCRs
   (332/889/37.35%/274) and the funding table when they move; they're baked in
   `fact-sheet/index.html`.

## The standing priority lanes (pick these up — unchanged since S72/S73)

Read [`CLAUDE.md`](../CLAUDE.md) §11 + the scope docs, then:

1. **Unverified-M-ID renumber re-mint.** When the CCR merge wave settles (NOT
   per-merge): close numbering gaps + re-sort `001,002…` by title within each
   `(canonical SUBJ4, band)`. Full Rule-7, unverified-only, ONE pass. Scope:
   `docs/unverified_mid_renumber_scope.md`. Dry-run first, Sam's go before apply
   + the Supabase re-key.
2. **TMC Phase-2 acceptance engine** (`tmc_builder.js`; Sam: "Go for A"): per-slot
   verdict from the ASCCC rules (C-ID match ✓ · `slot.flexible` ⚠ accept-with-
   ASSIST · specific C-ID filled by a non-match → faculty review · unfilled ○) +
   a structural checklist + a Ready/N-issues banner. Consume `slot.flexible` +
   `t.flexibility` (#479). Scope: `docs/kb-notes/tmc-co-review-scope.md`.
3. **CPL-Assistant CCR/CER-grounded recommender ETL** (green-lit, queued): build
   the CCR/CER/adoption-leverage ETL into shared Supabase so the Assistant can
   recommend the likely local course + credit rec. Scope:
   `docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md`.

## Patterns that worked this session

- **Hybrid scout-then-build.** Read the source (PDF text/images, `live_metrics`,
  the theme tokens, `kb/statewide_exhibit_categories.json`) before writing a line.
  The statewide exhibit detail was already in the repo — no scrape needed.
- **Sandbox gotchas (documented in the lessons doc):** `poppler`/`apt` unavailable
  → `pip --force-reinstall cffi` then `pdfminer.six` (text) + `pypdf`+`pillow`
  (images). Headless verify via the pre-installed Chromium
  (`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, `--no-sandbox`) over a
  local `http.server` so `../live_metrics.json` resolves. `github.io` + `map.rccd.edu`
  + `wiche.edu` are egress-blocked from the sandbox (403) — verify content on
  `main` via `get_file_contents`, not WebFetch.
- **Reconcile by denominator.** Two KPI cards that disagree usually count
  different things; the per-category breakdown is the proof (here 132/1,101/1,298
  vs 1,304 articulation rows).

## Safety patterns to honor

- **Rule 4** — `index.html` ≡ `CPL_Dashboard.html` byte-for-byte (the nav launch
  link is mirrored in both).
- **Merge-on-green** — squash-merge own PRs when the required **TruffleHog** check
  passes (`clean` OR `unstable`); don't wait for the non-required `test` check.
  For a *public* publish, wait for TruffleHog to actually conclude `success`
  first.
- **Branch** — the assigned branch (`claude/<desc>`) gets auto-deleted on merge;
  rebase a fresh branch off `origin/main` (`git checkout -B <branch> origin/main`)
  before the next change so the PR diff is scoped to just the new work.

## A moniker for you

SkyBlaster went out with a bang. Keep the sky streak if you like (SkyForge,
SkyVault, Skysmith…) or claim your own — Sam enjoys the running bit.
