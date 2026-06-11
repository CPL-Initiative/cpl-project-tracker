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
(`#implementation-funding`), built 2026-06-11 across **13 merged PRs
(#352–#368)** by "Tranche One", parallel to an active CCR session. The
original new-files-only freeze is OVER (coordination checks + surgical
disjoint edits became the working mode), but the instinct stands: keep to
the funding lane's files; never touch `export_unified_courses`,
`unified_courses*.js`, `kb/coci_*`, `kb/promotions.json`; coordinate via
repo state (open PRs / branches) before shared-file edits.

**The arc, in order:** #352 shell (fail-soft lazy boot) → #353 data +
renderer + test → #354 registration/pii_guard → #355 teaser → #356 v1.1
(districts/period/drill-ins; found the SUM-range variance) → #358 DataMart
provenance → #359 what-if sandbox (formulas read from the xlsx) → #360
**rev2 shares-first workbook** (SUM fix, input-driven builder) → #361 v2
scope + privacy ADR → #363 P1-gap KB note → #364 **P2/P3 actuals vs target**
(ADR ratified) + DRAFT chip → #367 roster edits + **no-scroll standing
rule** + unmatched surfacing → #368 Mt SAC credit/NC split. Sam's verdict:
"hotter than a two-dollar pistol."

## Read in order

1. `docs/cpl_funding_lessons.md` — the model math, workbook quirks, PII
   verdict, and the open follow-up list. Everything load-bearing is there.
2. CLAUDE.md §7b (tab layout) + the merge-on-green branch policy — you merge
   your own PRs (squash) the moment required checks pass (`clean` OR
   `unstable`); never park a PR in draft.
3. `docs/kb-notes/methodology-standing-pii-guard.md` — before adding ANY new
   data column to the artifact.

## What exists (post-checkpoint state)

- **Shell** (#352, both HTMLs — never needs touching): rail button, pane
  `#tab-implementation-funding`, mount, fail-soft lazy boot of
  `cpl_funding.js`. CSS injected from JS; DRAFT chip injected from JS too.
- **Workbook** `funding/CPL_Funding_Model_2026.xlsx` — **rev2 shares-first**
  (inputs = pools + 3 priority SHARES + projection TARGETS; dollars =
  headcount share × share × tranche; balance $0 by construction;
  `C8=SUM(C9:C127)`; 119 colleges incl. Mt San Antonio Noncredit). Revision
  history = the committed one-shots `funding/_revise_workbook_*.py`. ⚠ It
  shows blank derived cells until next opened+saved in Excel
  (fullCalcOnLoad set). Vintage: roster believed 23-24 MIS (header says
  2022-23), Mt SAC pair is 24-25 — **Sam owes a full 25-26 table**.
- **Builder** `funding/_build_funding_data.py` — INPUT-DRIVEN (computes the
  chain; never reads cached formulas; extent via numeric ORDER col; warns
  on 0-headcount rows) → `cpl_funding_data.js` (static, committed).
- **Actuals** `funding/_build_funding_performance.py` — daily workflow step
  4a2 over transient `CustomReport_latest.json` → `cpl_funding_performance.js`
  (cron artifact, in git-add): per-college P2/P3 distinct students, <5
  suppressed (RATIFIED ADR), unmatched bucket (footer-surfaced when
  non-empty). First data: 27 colleges, P2 4,635 / P3 16,151.
- **Renderer** `cpl_funding.js`: pool cards (4 editable), priority cards
  (share/target inputs + actual-vs-target lines; P1 = labeled incentive
  gap), formula explainer (warns when shares ≠ 100%), what-if sandbox
  (localStorage `cpl_funding_whatif_v2`, Reset pill), Colleges|Districts +
  Per-year|2026-30 toggles, drill-ins, no-scroll table (CCD-folded
  districts, P1/P2/P3 headers), provenance + actuals footnotes.
- **Tests**: `tests/cpl_funding.test.js` (94) + `tests/cpl_funding_performance.test.js`
  (15, runs the real producer on a synthetic fixture). Extend with every
  behavior; never hardcode data-derived expectations.

## Priority queue

1. ~~pii_guard fold-in~~ + ~~shared-doc registration~~ — **DONE 2026-06-11
   PR 3** (#354), after the coordination check found nothing in flight.
2. ~~Teaser card~~ — **DONE #355** (Sam asked); code-only generator change,
   published via post-merge `workflow_dispatch` (dispatch works — 204).
3a. ~~Interactive variables~~ — **DONE (what-if sandbox)**, then
   ~~formula recommendations~~ — **APPLIED (rev2, Sam-approved)**: the
   workbook itself is now shares-first (30/42/28 inputs; projections are
   targets that move no dollars; `C8=SUM(C9:C126)` fixed; column P
   removed), revised by `funding/_revise_workbook_2026_06_11.py`. The
   builder is input-driven (computes the chain; never reads cached
   formula values) and the sandbox edits pools + shares + targets
   (localStorage key `cpl_funding_whatif_v2`). Balance is $0 by
   construction; the variance footnote retired itself. NOTE: the workbook
   shows stale/blank derived cells until first opened+saved in Excel
   (fullCalcOnLoad is set).
3. ~~3-year view / district rollups / drill-in~~ — **DONE v1.1** (same
   day): view + period toggles, drill-in detail rows, 46-assertion test.
   **v1.1 found a source-workbook variance** — the college list outsums
   the workbook's own SYSTEM/pool row by exactly the last row (Yuba: 8,417
   heads / $44.6K/yr; SUM range stops early). Surfaced via build NOTE +
   data-driven tab footnote + test honesty-bound. **Ask Sam to fix the SUM
   ranges in the next workbook edition** — the footnote auto-disappears.
4. **The interesting v2 — MAP performance vs the three priority metrics:
   SCOPED 2026-06-11, build gated on Sam's 3 forks.** Read
   [`funding_priority_metrics_scope.md`](funding_priority_metrics_scope.md) +
   the PROPOSED
   [`adr-funding-priority-metrics-privacy.md`](kb-notes/adr-funding-priority-metrics-privacy.md).
   Recon verdict: **P2 + P3 derivable today** from the already-fetched
   pseudonymous `View_StudentAggregatedValues` (`Transcribed Credits` per
   student); **P1 (completion) is a data gap** — no award field anywhere in
   the 9-category pull; completions live in MIS. **All forks ANSWERED
   ("Yes on forks", 2026-06-11): ① ADR RATIFIED; ② P1 gap kept deliberately
   ([`kb-notes/reference-p1-completion-data-gap.md`](kb-notes/reference-p1-completion-data-gap.md));
   ③ `Potential Student` EXCLUDED. Producer + consumer SHIPPED same day**
   (`funding/_build_funding_performance.py` — workflow step 4a2 + git-add,
   pii_guard fold-in, fixture-driven producer test — and the tab's
   actual-vs-target UI: priority-card actuals, "CPL students†" column,
   drill-in vs-target, P1 labeled incentive state, DRAFT header chip).
   **Pending the first daily cron**: the artifact publishes and the hints
   flip to actuals — then audit the `unmatched` bucket (name-join reality
   check) and confirm the committed-artifact PII screens activated. P1
   build resumes only when a completion source lands.
5. **xlsx export button** — mostly covered: the tab already links the
   committed source workbook. Only build a derived export if Sam asks for
   the on-screen view (then pre-generate; never ship a client xlsx lib).
5b. **Headcount vintage refresh** — the headcounts are the 2022-23 CCCCO
   DataMart annual pull (provenance baked into data + tab footnote,
   2026-06-11). A refresh is **Sam's modeling decision in the workbook**
   (DataMart Headcount Status filter + partial years shift counts
   materially — see the lessons doc); pipeline-side it's just: new
   workbook edition → re-run builder → commit. The vintage label updates
   itself from the workbook header.
6. **If the model becomes editable** (allocations negotiated, factors
   tuned): do NOT grow the workbook — follow the Excel→Supabase Phase 2-4
   five-step shape (seed table → read-path cutover → inline editor → RLS
   tighten) that Budget/Projects used.

## ~~Open item — Mt San Antonio Noncredit headcount~~ CLOSED (2026-06-11)

Sam supplied the split: **Noncredit 35,363 / credit 41,950** (replacing the
row's prior 66,445). Statewide headcount 2,199,157 → **2,210,025**;
per-student rate → **$5.2488**; every college's share shifted ~−0.49%.
**Vintage (Sam):** Mt SAC's pair is **24-25 MIS**; the rest of the table
is believed **23-24** (the "2022-2023" column header notwithstanding —
MIS trails by up to a year). Accepted for now. **Standing expectation: Sam
delivers a complete 25-26 revised table when all numbers report** — drop
it in the workbook, fix the column header (auto-relabels the tab
footnote), re-run the builder, commit.

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
