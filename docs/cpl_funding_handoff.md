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
   PR 3** after the freeze lifted (coordination check: zero open PRs,
   nothing in flight from the CCR session). The Dashboard teaser card was
   **deliberately skipped** — only 3 of 12 tabs have teasers, and it's a
   generator-file edit (highest CCR-collision surface); do it only if Sam
   asks.
2. **Product asks to expect from Sam**: per-college 3-year view (the table
   shows one $11.6M tranche/yr), district rollups, a college detail
   drill-in, xlsx export button (pre-generate, don't ship a client xlsx
   lib), or wiring actual MAP performance against the three priority
   metrics (P1/P2/P3 are MAP-derivable — that's the interesting v2).
3. **If the model becomes editable** (allocations negotiated, factors
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
