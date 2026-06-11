---
title: CPL Implementation Funding — next-session handoff
created: 2026-06-11
updated: 2026-06-11
tags: [handoff, funding, implementation-funding]
related:
  - "[[docs/cpl_funding_lessons]]"
---

# You are the next Implementation-Funding session

You're resuming the **CPL Implementation Funding** tab workstream
(`#implementation-funding`). It shipped 2026-06-11 in two PRs from a session
that ran parallel to an active CCR session, under a deliberate constraint:
**PR 1 = tab shell in both HTMLs only; everything after = new files only**
(no `export_unified_courses`, no `unified_courses*.js`, nothing under
`kb/coci_*` / `kb/promotions.json`). Honor that constraint unless Sam says
the parallel-session freeze is over.

## Read in order

1. `docs/cpl_funding_lessons.md` — the model math, workbook quirks, PII
   verdict, and the open follow-up list. Everything load-bearing is there.
2. CLAUDE.md §7b (tab layout) + the merge-on-green branch policy — you merge
   your own PRs (squash) the moment required checks pass (`clean` OR
   `unstable`); never park a PR in draft.
3. `docs/kb-notes/methodology-standing-pii-guard.md` — before adding ANY new
   data column to the artifact.

## What exists

- **Shell** (PR #352, in both HTMLs): rail button after Budget, pane
  `#tab-implementation-funding`, mount `#cplFundingMount`, inline boot that
  lazy-loads `cpl_funding.js` (fails soft → placeholder). You should never
  need to touch the HTMLs for behavior changes — `cpl_funding.js` owns the
  pane after first activation, and its CSS is injected from JS.
- **Data**: `cpl_funding_data.js` (`window.CPL_FUNDING`) ← built by
  `funding/_build_funding_data.py` ← `funding/CPL_Funding_Model_2026.xlsx`
  (committed, PII-clean). STATIC — the daily cron neither builds nor commits
  it. New workbook edition = overwrite the xlsx, re-run the builder, commit
  both, done.
- **Renderer**: `cpl_funding.js` (`window.CPL_FUNDING_TAB.boot()`): pool
  cards, 3 priority cards, formula explainer, searchable/sortable college
  table, SYSTEM tfoot total, footnotes.
- **Test**: `tests/cpl_funding.test.js` (33 assertions: Rule-4 parity, shell
  wiring, lazy-only loading, model-math invariants, PII scan, render/search/
  sort/empty-state). Run `npm test` before every push; extend it with every
  behavior you add.

## Priority queue

1. ~~pii_guard fold-in~~ + ~~shared-doc registration~~ — **DONE 2026-06-11
   PR 3** (#354), after the coordination check found nothing in flight.
2. ~~Teaser card~~ — **DONE #355** (Sam asked); code-only generator change,
   published via post-merge `workflow_dispatch` (dispatch works — 204).
3. ~~3-year view / district rollups / drill-in~~ — **DONE v1.1** (same
   day): view + period toggles, drill-in detail rows, 46-assertion test.
   **v1.1 found a source-workbook variance** — the college list outsums
   the workbook's own SYSTEM/pool row by exactly the last row (Yuba: 8,417
   heads / $44.6K/yr; SUM range stops early). Surfaced via build NOTE +
   data-driven tab footnote + test honesty-bound. **Ask Sam to fix the SUM
   ranges in the next workbook edition** — the footnote auto-disappears.
4. **The interesting v2 — MAP performance vs the three priority metrics.**
   Scope before building: P1 (completion w/ ≥6 transcribed CPL units), P2
   (enrollment w/ ≥6), P3 (any transcribed CPL) are MAP-derivable, but the
   current daily pull carries college-level aggregates, not the ≥6-unit
   per-student cuts — check the MAP CustomReport categories (the 151-field
   pull, `reference-daily-dashboard-data-pipeline.md`) for a usable view
   first. **Privacy ADR required before any new committed artifact**
   (aggregate counts only + small-cell suppression per
   `methodology-standing-pii-guard.md`); join key = college name → funding
   rows (watch name drift: "Alameda" vs "College of Alameda" — reuse
   `college_short_names`/`college_lookup` rather than a new map).
5. **xlsx export button** — mostly covered: the tab already links the
   committed source workbook. Only build a derived export if Sam asks for
   the on-screen view (then pre-generate; never ship a client xlsx lib).
6. **If the model becomes editable** (allocations negotiated, factors
   tuned): do NOT grow the workbook — follow the Excel→Supabase Phase 2-4
   five-step shape (seed table → read-path cutover → inline editor → RLS
   tighten) that Budget/Projects used.

## Safety patterns to honor

- Rule 4 (both HTMLs identical) — but you shouldn't need to edit them.
- Run `python3 excel_to_dashboard.py` locally after ANY HTML edit and
  verify your markup survives; discard the regen noise (code-only PRs).
- The data artifact is committed-static: if you regenerate it, the diff
  should be exactly your intended change (the builder is deterministic, no
  timestamps).
- PII: aggregate counts only; anything person-level never enters
  `funding/` or the artifact.

Moniker suggestion: **Tranche One** (claim your own if you like).
