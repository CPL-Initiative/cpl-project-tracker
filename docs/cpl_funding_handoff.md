---
title: CPL Implementation Funding — next-session handoff
created: 2026-06-11
updated: 2026-07-23
tags: [handoff, funding, implementation-funding]
related:
  - "[[docs/cpl_funding_lessons]]"
---

# You are the next Implementation-Funding session

## Latest state — 2026-07-23 (SkyFriend), READ THIS FIRST

Three more curator asks landed on top of SkyFunder, one JS-only PR in `cpl_funding.js`:
1. **Uniform fonts** — the whole priority box (desc/nums/metric/strategies) + the Timing
   rows now sit at `.8rem`; only the priority **title** stays 1rem. (The strat/timing rows
   used to inherit the page base because their containers set no `font-size`.)
2. **Actuals follow the METRIC, not the slot.** The old `MEASURABILITY[slot][idx]` map
   misaligned once Sam reordered priorities (the "any transcribed" count showed under the
   statewide-eligibility priority). Replaced by `MEASURES` — ordered `test(metric)`
   predicates, first match wins; the actual/data-gap travels with the metric. Call sites
   (`actualLineHtml`, `collegeDetailHtml`, `ruralAttainment`) pass `p.metric`.
3. **Allocation-balance box** in the Funding Pool area + a clarified Projection-% line.
   The box = `perYear() − perYear()×Σshare` for the viewed year: `$0` at 100% (fully
   apportioned), red **Over-allocated** when shares exceed 100%, surplus under 100%. It's
   the modern N3-BALANCE cell. **Confirmation for Sam:** the **Allocation share** moves the
   money; the **Projection %** is a performance target only (does NOT cap funding — that
   coupling existed in the pre-2026-06-11 model and was deliberately removed). Don't re-couple
   them; read over-allocation off the balance box. `MEASURES` predicates are the only thing to
   revisit if a metric's wording drifts past its matcher (they fail safe to "no measure").

Tests 325 → **337**; full suite **168 files green**. Story: `docs/cpl_funding_lessons.md`
(SkyFriend section). Side-lane — left `cpl_todos.json` + the numbered handoff to the CCR mainline.

## 2026-07-24 (SkyFriend cont. 2) — column show/hide + eligibility audit

Shipped a **⚙ Columns** show/hide menu (native `<details>` of checkboxes; **county hidden by
default**; per-view + persisted `cplfund_cols_v1`). Hiding = injected `nth-child` CSS from the
live `activeCols()` order, with `tbody tr:not(.cplfund-detail)` so a drill-in never collapses;
the identity column (College/District) is never hideable. **Eligibility audit:** the Elig
tooltip + drill-in "Baseline eligibility" line + `eligTitle()` now frame it as the
**participation gate** (coordinator + participation request), **separate from earned funding**.
Tests 357 → **367** (Part F).

**Queued (Sam's same batch, needs a build):** **#5+#6** — relabel Eligible†/Transcribed† →
per-priority **P1/P2/P3** columns, each cell **target-over-actual stacked** (the `.sub` pattern —
NOT two physical rows, which break sort/CSV/SYSTEM row) with a goal+metric hover, so a college
sees its standing inline without a dropdown. Then column **resize** (`table-layout:fixed` +
colgroup + drag) and the big one — **per-column multi-select filters** to retire the separate
view/year toggles. The `activeCols()` + nth-child seam is the foundation. Full recommendation in
`docs/cpl_funding_lessons.md`.

## 2026-07-24 (SkyFriend cont. 3) — per-priority P1/P2/P3 columns + numbered Elig pie

**#5 + #6 shipped** (Sam blessed the stacked-cell direction). The Eligible†/Transcribed†
columns → **three P1/P2/P3 columns** (from `priorities(viewSlot)`, keys `prio0/1/2`), each cell
**stacks target over actual** (`prioCellHtml`: top `target · cap`, bottom `actual · earned · %`)
so a college sees its standing inline, no drill-in; header hover = the priority goal + metric.
Driven by the same `earnFraction` (earned/gap/pending/none/suppressed). CSV → `Pn target`/`Pn
actual`. Compact `fmtCountK`/`fmtMoneyK` keep the cells narrow (full precision in the hover).
**Elig glyph** ✓/◐/○ → a **numbered SVG pie** (`eligGlyph`): one slice per tracked requirement,
green when met — **N-slice not forced-4** (2 today: coordinator + participation; grows as more
per-college-checkable reqs are wired; `eligReqList()` is the seam). Tests 368 → **376** (Part G).

**Still deferred** (Sam OK'd holding): column **resize** + **per-column multi-select filters**.
**Open design note:** a *fixed 4-slice* Elig pie needs 2 more per-college-checkable criteria
defined + wired first (else 2 slices read as failing criteria that don't exist).

## 2026-07-24 (SkyFriend cont.) — achievement-based funding (cap-and-earn)

Sam confirmed the tab must **fund on actual achievement, not headcount** (it never did —
neither tab nor his workbook; I told him so before building). Shipped the **cap-and-earn**
model in `cpl_funding.js`: `earned = cap × min(1, actual ÷ target)`, capped at 100%, unearned
rolls forward. A **Potential ⇄ Earned** basis toggle (default Potential) overlays the same
surfaces (pool Earned/Unearned cards, per-priority earned %, table total → earned-of-cap · %
maxed, drill-in per-priority earned). The projection % is now the achievement **target**.

**The load-bearing rule** (KB note `methodology-achievement-based-funding-cap-and-earn.md`):
the default for an *unmeasured* cell depends on WHY it's unmeasured — **gap** (metric
unmeasurable for anyone) + **pending** (feed not loaded) → advance at full cap; **none** (feed
loaded, college posted nothing) → **$0** (the incentive); **suppressed** (<5) → $0, flagged.
Splitting "can't measure the metric" from "this college didn't do it" is the whole incentive.

Phase-in: only Year-1 "any transcribed CPL" is measurable today, so only it flexes; the rest
advance and light up as feeds land (exhibit linkage · Portal origin · CO MIS match-back).
Tests +20 → **357** (Part E: earned ≤ cap; no-feed ⇒ earned==cap; incentive identity;
overachiever capped; suppressed $0). **Open:** basis is session state — add a `fundingBasis`
config field if a shared/team Earned default is wanted (1 line, same 3-layer resolution).

## Prior state — 2026-07-23 (SkyFunder)

The tab now has a **shared multi-project / multi-scenario** model, an editable
**Report** sub-tab, and a fully **editable Model view** (priority titles/strategies/
timing, eligibility intro, and add/delete/relabel funding-pool boxes). Five merged
PRs (all JS-only in `cpl_funding.js`; **0 HTML**):
- **#878** — Total Available Funds card ($44,040,307, live) · Award-range Avg/Min/Max
  cards · SYSTEM total row moved from `<tfoot>` to a pinned first `<tbody>` row.
- **#879** — the config layer is now `SUPA_CONFIG = { projects: { <pid>: { label, area,
  scenarios: { <name>: <override> } } } }` in the SAME `cpl_funding_config` row (no
  schema change). `SHARED` is a **pointer** into the active project/scenario; every
  `firstDefined(SCENARIO.x, SHARED.x, base().x)` accessor is unchanged. Top control
  strip `[Project ▾ +Add · area badge][Scenario ▾ +New(clone) ✕]`; create/delete are
  curator (team-phrase) actions; anonymous what-if overlays per (project, scenario)
  in `cpl_funding_whatif_v3`. `+New` clones current; `+Project` clones the CPL template
  + tags a COBI area from `window.CPL_ORGS`. `normalizeConfig()` migrates an old flat
  override → CPL/Scenario 1 (no edits lost). Selection persists in
  `cpl_funding_selection_v1`.
- **#880** — the 📄 **Report** sub-tab (`state.subview` model|report; `state.docType`
  memo|letter|report|brief). `buildMemo(docType)` assembles an **ESS-25-82 memo** from
  the live model; `contenteditable` page; exports Copy / PDF (print) / **Word** (docx via
  `memoDocxBlocks` DOM→docx walker over `window.docx`). All memo content is
  model-derived — no LLM/backend.
- **#883** — editable priority **titles** (default Access/Success/Capacity) +
  **Recommended Strategies** list per priority, both **year-specific** (per-slot
  `prioField`/`setPrio`, fallback `DEFAULT_PRIORITY_TITLES`); a **Timing** milestone
  list (`timing` config key, `DEFAULT_TIMING` seed, editable label+date, `.nodate`
  italic); editable **eligibility intro** (`eligIntro`). Reused the eligibility
  bullet/✕/＋ list pattern — that's the template for future *variable-count* priorities.
- **#884** — **editable/add/delete funding-pool boxes**: `CORE_REVENUE`/`CORE_DEDUCTION`
  descriptors, `poolLabels[field]` (editable labels), `hiddenPool[field]` (hide/restore
  core boxes), `customPool[]={label,amount,kind}` (＋Add revenue/deduction + kind
  toggle). Net generalized `grossRevenue()−grossDeduction()−feeder−rural`, **conserved**
  (test-guarded). Delete/hide behind `confirmPoolDelete()`. Carve-outs + computed cards
  non-deletable. Also dropped the duplicate "% of each tranche" priority header.

**Test harness for UI work:** jsdom is `tests/cpl_funding.test.js` (**325 assertions**).
For real render + the docx export, a Chromium harness pattern is in
`docs/cpl_funding_lessons.md` (load `docx.min.js` + data + consumer, stub `CPL_ORGS` +
`CPL_TEAM_PHRASE`, click `[data-subview="report"]`, capture the ⬇ Word download).

**Open (all optional):** per-area memo masthead / real CO seal image (`memoMasthead()`);
persistent memo drafts (store edited HTML per project/scenario); a real non-CPL funding
model if "add project" ever needs different mechanics than the CPL 115-college engine.

---

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
