---
title: CPL Implementation Funding tab — workstream lessons
created: 2026-06-11
updated: 2026-06-11
tags: [lessons, funding, implementation-funding, dashboard-tab, parallel-session]
artifacts:
  - CPL_Dashboard.html / index.html (tab shell — PR #352)
  - funding/CPL_Funding_Model_2026.xlsx (committed source workbook)
  - funding/_build_funding_data.py (one-shot extractor)
  - cpl_funding_data.js (static data artifact, window.CPL_FUNDING)
  - cpl_funding.js (renderer, window.CPL_FUNDING_TAB)
  - tests/cpl_funding.test.js
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-standing-pii-guard]]"
  - "[[docs/cpl_funding_handoff]]"
---

# CPL Implementation Funding tab — lessons

Workstream scratchpad for the **Implementation Funding** dashboard tab
(hash `#implementation-funding`), built 2026-06-11 in a session running
**parallel to an active CCR session** — hence the unusual constraint set:
shell-first, then new-files-only.

## 2026-06-11 — Session 1 (tab shipped)

### What shipped

- **PR #352 (merged)** — the empty tab shell in both HTMLs ONLY: left-rail
  button "Implementation Funding" (after Budget), pane
  `#tab-implementation-funding` with placeholder mount `#cplFundingMount`, and
  an inline boot snippet that lazy-loads `cpl_funding.js` on first activation
  via the existing `CPL_TABS.onActivate`/`loadScript` helpers. `loadScript`
  fails soft, so the shell merged *before the module existed* and showed
  "coming soon" — and every later PR is new-files-only.
- **PR 2** — the tab itself, all new files: committed source workbook
  (`funding/CPL_Funding_Model_2026.xlsx`), one-shot extractor
  (`funding/_build_funding_data.py`), static data artifact
  (`cpl_funding_data.js`, ~54 KB — NOT a daily-cron artifact, same lifecycle
  as `college_short_names.js`), renderer (`cpl_funding.js`: pool cards,
  priority cards, formula explainer, searchable/sortable per-college table
  with the SYSTEM row pinned as a tfoot total), and
  `tests/cpl_funding.test.js` (33 assertions).

### The funding model (decoded + machine-verified)

The workbook is one sheet, two blocks. The extractor re-derives every college
row and asserts it matches the workbook to <1¢ (`max drift 0.01`):

- **Pool**: $9,040,307 (2025-26 remaining one-time) + $35,000,000 (2026-27
  one-time) − $1,200,000 (admin, 2 FTE × 3 yrs) − $8,040,307 (scaling
  projects & tech) = **$34.8M college funding, 3 annual tranches of $11.6M**
  (2026-27 → 2028-29).
- **Per-student rate** = $11.6M ÷ 2,190,740 statewide headcount = **$5.295**.
- **Three priorities**, each `allocation = headcount × rate × factor ×
  $5.295`: P1 completion (rate 5%, factor 6 → 30% share), P2 access (6%, 7 →
  42%), P3 capacity (4.667%, 6 → 28%). Shares sum to exactly 1, so a
  college's total potential allocation **is its headcount share of one
  $11.6M tranche**. SYSTEM row = the statewide totals; average allocation
  $98,682.78/yr across 118 college rows.

### Workbook quirks (handle on the next edition)

- The third year column is **labelled "26-27" again — a source typo for
  28-29**; the pool math (3 × 11.6M = 34.8M) pins the window. Extractor
  documents + corrects.
- The "26-30 TOTAL AVAILABLE COLLEGE FUNDING" value cell is empty (merged
  cell); extractor computes it and asserts the arithmetic.
- `COLLEGE HEADCOUNT PCT CPUNTY TOTAL` (sic) is **internally inconsistent**
  (some rows = pct of county, some duplicate the statewide pct). Extracted
  as `headcount_county_pct` but NOT rendered — don't surface it without
  upstream cleanup.
- 4 colleges carry `*Survey did not estimate counties <65K in population` →
  `working_adults: null`; renderer shows em-dashes (test-guarded against
  NaN).
- **The workbook disagrees with itself by exactly its last list row (found
  2026-06-11, v1.1).** The 118 college rows sum to **2,199,157 heads /
  $11,644,568/yr**, but the pool block's CCC HEADCOUNT — and therefore the
  SYSTEM row and the $5.295 per-student rate — carries **2,190,740 /
  $11,600,000**: short by 8,417, which is exactly **Yuba**, the final row
  before the AVERAGE footer. Classic Excel SUM-range-stops-one-row-early
  artifact; net effect, the per-college allocations over-allocate the
  $11.6M tranche by ~$44,568/yr (0.38%). Also: `HEADCOUNT PCT TOTAL` mixes
  denominators across rows (Alameda ÷ pool figure, Yuba ÷ list sum).
  **Handling: surfaced, never corrected** — extractor prints a build-time
  NOTE, the tab renders a data-driven footnote (auto-disappears when a
  fixed edition is committed), and the test pins conservation against the
  *list* plus a <1% honesty bound vs the SYSTEM pool. **Flag for Sam's
  next workbook edition: extend the pool block's SUM ranges to include the
  last row.**

### PII check (per the standing-PII-guard methodology)

Workbook is **clean**: institutional + U.S. Census aggregates only (college/
district/county names, headcounts in the thousands, dollars). No
person-level columns; nothing to suppress. `tests/pii_guard.test.js` has a
**fixed EMAIL_FILES list** that predates this artifact, so
`tests/cpl_funding.test.js` carries its own mirror scan (email allow-list +
person-level-key regex) over `cpl_funding_data.js`. **Follow-up:** fold
`cpl_funding_data.js` into pii_guard's EMAIL_FILES (1 line) once the
parallel-session shared-file freeze lifts.

### Patterns that worked

- **Shell-first + fail-soft lazy boot** is the right shape for adding a tab
  while another session is active: one tiny HTML PR, then zero shared-file
  contention. The shell survived a full local `excel_to_dashboard.py` regen
  (verified before PR 1 — the §6b bounded-regex catastrophe is the thing to
  check, not assume).
- **Verify the model in the extractor, not the UI**: the builder asserts
  priority shares sum to 1 and re-derives all 3×118 allocations from the
  formula, so a future workbook whose constants drift fails the build
  instead of rendering wrong dollars.
- Scoped CSS injected from JS (CER pattern), `var(--token)` only —
  test-enforced (`no raw hex` assertion).

### Open follow-ups (smallest first)

1. ~~pii_guard EMAIL_FILES fold-in~~ — **DONE PR 3 (2026-06-11)**.
2. ~~Shared-doc rows~~ — **DONE PR 3**: CLAUDE.md §7b tab-table row + §2
   file-inventory rows + `docs/INDEX.md` lessons-table row.
3. `data-sections` sidebar TOC on the pane (the "Sidebar levels" backlog) —
   needs a shell-HTML touch or a JS `setAttribute` before first activation.
4. New workbook editions: drop at `funding/CPL_Funding_Model_2026.xlsx`,
   re-run `python3 funding/_build_funding_data.py`, commit both. If the
   model ever becomes curator-editable, follow the Excel→Supabase Phase 2-4
   five-step shape (seed → read-path → editor → RLS) instead of growing the
   workbook.

### 2026-06-11 (sandbox) — formulas read from the workbook + the what-if layer

Sam asked to make the variables interactive ("this is still in draft form")
and whether the Excel formulas are readable. **They are** (openpyxl,
`data_only=False`); the chain, now formula-confirmed:

```
H3 = I3 = J3 = ((C3 remaining + D3 one-time) − (E3 admin + F3 scaling)) / 3   ← per-year tranche
E3 = 400000*3                                                                  ← admin self-documents ($400K/yr × 3)
K3 = C8 ;  C8 = SUM(C9:C125)        ← THE BUG: the list ends at C126 (Yuba)
L3 = H3 / K3                         ← per-student rate
row: heads_k = C_row × rate_k(row7) ;  dollars_k = heads_k × $L$3 × factor_k(row7)
M3 PROJECTED = K8 (SYSTEM total) ;  N3 BALANCE = H3 − M3
D126 + parts of col P are typed literals, not formulas → the mixed denominators
```

**What-if sandbox SHIPPED** (`cpl_funding.js`): the funding pools, CCC
headcount, per-priority funding factors, and projection % are editable
inputs; everything (hero pool, per-student rate, shares, formula line,
BALANCE card, all 118 college rows, district rollups, drill-ins, average)
recomputes through the same chain. Pristine state renders the committed
workbook values **verbatim** (recompute only after an edit); edits persist
per-browser (`localStorage: cpl_funding_whatif_v1`) with a "● modified /
Reset to workbook" pill; BALANCE goes red + the formula line warns when
edits make shares ≠ 100% (mirrors the workbook's own N3 BALANCE cell). The
workbook-variance footnote is suppressed while modified (it describes the
workbook, not the sandbox). The CCC-headcount input tooltips the corrected
list sum (2,199,157) so testing the fixed model is one paste. Tests 50 → 67.

### 2026-06-11 (actuals) — forks ratified ("Yes on forks"); P2/P3 actual-vs-target SHIPPED

ADR ratified as written + `Potential Student` excluded → the producer ladder
shipped in one PR (producer + consumer, since the consumer is fail-soft
until the artifact exists):

- **Producer** `funding/_build_funding_performance.py` — daily-workflow step
  4a2 over the transient `CustomReport_latest.json`
  (`View_StudentAggregatedValues`): per-college **P2** (distinct students,
  transcribed ≥6) + **P3** (any transcribed), Test/Potential + test-college
  rows excluded, **<5 suppressed producer-side**, statewide computed
  independently (cross-college dedupe — also defeats subtraction recovery of
  suppressed cells). College-name join: MAP canonical/alias →
  `kb/college_short_names.json` short → funding name; unresolved → an
  `unmatched` bucket for visibility. Graceful exit-0 when the fetch fell
  back (keeps the prior artifact).
- **Verification committed**: `tests/cpl_funding_performance.test.js` runs
  the real producer against a SYNTHETIC fixture via `spawnSync(python3)`
  (15 assertions: counting/dedupe/sid-less rows, exclusions, suppression,
  the name join, statewide dedupe, workflow wiring, graceful no-input) +
  committed-artifact PII screens that activate once the first cron
  publishes. pii_guard EMAIL_FILES gained the artifact.
- **Consumer** (`cpl_funding.js`): P2/P3 cards show "Actual N students per
  MAP (as of DATE) — X% of target" (the % uses the CURRENT, possibly
  sandboxed, target — drag a target % and attainment moves); **P1 renders
  the labeled incentive state** ("awaiting completion data"), never a
  blank; new sortable "CPL students†" column (college view; "<5" / "—";
  NOT period-multiplied); drill-ins gain per-priority actual + % of
  target; footer explains basis/suppression/dedupe. All fail-soft: until
  the first cron publishes the artifact, the tab shows "arrives with the
  next daily refresh" hints. Tests 74 → 87; suite 25/25 files.
- **First-cron follow-ups**: audit the `unmatched` bucket (name-join
  reality check) and confirm the committed-artifact screens activate.
- **Viewing is login-free** (Sam shared the tab with colleagues): the PII
  guard is a CI test, not a gate; the sandbox is per-browser. Magic-link
  credentials exist only for CCR/CSR/CER *editing* and go to each
  reviewer's OWN email via `allowed_reviewers` — never share the
  map@rccd.edu inbox/links.

### 2026-06-11 (P1 gap) — fork ② answered; the gap's anatomy + strategy captured as a KB note

Sam answered the P1 fork with the full domain story (completions live in
SIS — Banner/Colleague/PeopleSoft — not MAP; DataMart aggregates untieable;
MAP Student IDs inconsistent until CCCApply; probable fix = periodic
SIS→MAP routine) and the deliberate decision: **the unmeasurable metric
stays, as an incentive to close the gap**, aiming at a CA replication of
the CAEL-WICHE completion effect. Per his ask, the reasons + procedures +
strategies are now first-class project learning:
[`kb-notes/reference-p1-completion-data-gap.md`](kb-notes/reference-p1-completion-data-gap.md)
(identity-first P3 sub-indicator, P1 maturity ladder, CO-level match-back
before 116 SIS integrations, decoupled CAEL replication study, provenance
stamps, labeled dashboard state). Scope doc P1 section updated; forks ① + ③
still open before the P2/P3 producer ships.

### 2026-06-11 (rev2) — recommendations APPLIED: the workbook is now shares-first

Sam: "Great recommendations! Make the changes." All four applied to
`funding/CPL_Funding_Model_2026.xlsx` by the one-shot
`funding/_revise_workbook_2026_06_11.py` (kept for provenance; the original
edition lives in git history at #353):

- **C8 `=SUM(C9:C126)`** — the SUM-range fix. SYSTEM headcount is now
  2,199,157 (the full list incl. Yuba); the variance is GONE, the tab's
  variance footnote auto-disappeared, balance is **$0.0000 by
  construction**. Per-student rate corrected $5.295 → **$5.2747**; every
  college allocation shifted ~−0.38% (Alameda $50,736.83 → $50,542.64) and
  Yuba is now funded *within* the pool ($44,397.56).
- **Shares-first**: row 7 inputs are now the three PRIORITY SHARES
  (30%/42%/28%); dollars = `$D9*E$7*$H$3` (headcount share × priority share
  × tranche). The FUNDING FACTOR is gone; the projection percents remain as
  **PROJECTED HEADCOUNT (TARGET)** columns that move no dollars.
- **One formula per column, filled down** rows 8–126 (D126's literal fixed);
  **column P removed** (inconsistent literals, never rendered, no
  recoverable denominator). Input cells are plain values (`E3` = 1,200,000
  with the `(2 FTE*3 YRS = 400000*3)` derivation moved into the label).
  `J2` header fixed to 28-29. `fullCalcOnLoad` set so Excel recalcs on open.
- **Builder is now input-driven** (`_build_funding_data.py` rewritten):
  openpyxl edits invalidate Excel's cached formula values (and openpyxl
  can't evaluate), so the builder reads ONLY typed inputs and computes the
  chain itself — also making the artifact deterministic and adding a
  structural conservation assert. Artifact: priorities carry
  `share` + `target_rate` (factor dropped), `headcount_county_pct` dropped,
  `model_version 2026-06-11.2`.
- **Tab/sandbox shares-first**: editable = pools + per-priority share % +
  target %; CCC headcount card is now derived (Σ college rows — no longer
  an input, matching the model); drill-ins show
  `headcount share × priority share × tranche`; target edits visibly move
  projected students but never dollars (test-pinned). localStorage key
  bumped to `cpl_funding_whatif_v2` (old factor-shaped saves discarded).
  Tests 67 → 74.
- ⚠️ One nuance for Sam in Excel: edited cells carry no cached values until
  the workbook is opened + saved in Excel once (it will recalc on open).

### Formula review + recommendations (Sam asked; "simple is always preferred")

1. **Make the headcount SUM unbreakable.** Quick fix: `C8 =SUM(C9:C126)`.
   Durable fix: convert the college list to an Excel **Table** and use
   `=SUM(Table[HEADCOUNT])` — Tables auto-expand when a row is added, which
   eliminates exactly this bug class (a row appended below the SUM range).
2. **THE structural one — specify the three shares directly; stop
   back-solving.** Today `share_k = factor_k × rate_k` and the pair is
   hand-tuned to hit 30/42/28 (that's why P3's rate is the awkward
   4.6666666%). Two side-effects: the projection % *looks* like a forecast
   but actually moves money, and every future tweak must keep
   Σ(factor×rate)=1 by hand or the model silently over/under-allocates
   (the sandbox's red BALANCE demonstrates it live). Simpler, equivalent
   model: **inputs = the three shares (30/42/28)**; college dollars =
   `headcount-share × share_k × tranche`. The per-student rate and factors
   drop out of the allocation math entirely; keep "projected headcount
   achieving the metric" as a separate target column (`headcount × rate`)
   that no longer affects dollars. Forecasts become honest forecasts;
   balance is exact *by construction*; same outputs today.
3. **One formula per column, filled down — no literals mid-column.** D126
   and parts of column P are typed literals among formulas; that's where
   the mixed-denominator inconsistencies came from. Fill D9 down; delete
   or formula-ize column P (the tab doesn't render it — it's internally
   inconsistent).
4. Cosmetics: J2's header repeats "26-27" (should read 28-29). E3's
   `=400000*3` is good self-documenting style — keep doing that.
5. **Revision methodology (simple):** iterate scenarios in the tab's
   sandbox (zero risk, per-browser); when one is chosen, type it into the
   workbook → `python3 funding/_build_funding_data.py` → commit. The
   workbook stays the single model-of-record. Only reach for the
   Excel→Supabase editor pattern if the model someday needs multi-user
   collaborative editing — not while it's a draft.

### 2026-06-11 (provenance) — college-headcount lineage (Sam's DataMart note)

Sam identified the headcount column's source: **CCCCO MIS DataMart →
Students → Annual/Term Student Count**
(https://datamart.cccco.edu/Students/Student_Headcount_Term_Annual.aspx),
**Collegewide Search** — the workbook carries the **2022-23 annual** edition
("a bit dated", his words). Baked in three places: the extractor emits
`headcount_label` (vintage read from the workbook's own column header, so a
refreshed edition re-labels the tab automatically) + `headcount_source`
(name/url/selection); the tab footnotes the citation and tooltips the
Headcount column header; the test pins both.

**Refresh caveat (do NOT drop-in swap):** Sam's 2025-26 Collegewide pull
shows far smaller counts (Allan Hancock 6,156; Desert 975) than the 2022-23
figures in the model (Alameda 9,582 scale) — the report's **Headcount
Status** filter (e.g. "A - Credit Student Enrolled") and a partial
in-progress year change values materially, and the per-student rate /
allocations all scale off these counts. Refreshing the vintage is **Sam's
modeling decision inside the workbook**; the pipeline then just needs the
new edition dropped at `funding/CPL_Funding_Model_2026.xlsx` + a builder
re-run. Note the parallel CCR session went active again the same hour
(#357 merged) — this change stayed inside the funding lane's own files.

### 2026-06-11 (later still) — teaser card + v1.1 (Sam: "Go on the teaser card and next steps")

- **Teaser card SHIPPED (PR #355, code-only)** — 4th Dashboard teaser
  (after Budget, rail order) linking `#implementation-funding`; headline
  numbers read from `cpl_funding_data.js` at generate time with a
  number-free fallback. Verified idempotent across two local generator
  runs; published via post-merge `workflow_dispatch` of
  `daily-dashboard.yml` (**dispatch 204 — the Actions grant works from a
  session now**). Process scar: built it on a sibling branch forked from
  the session branch instead of `main`, so the PR briefly double-counted
  the prior PR's files — `git rebase origin/main` dropped the duplicate
  (patch-id match) and the PR collapsed to the real 1-file diff. Fork
  sibling branches FROM `origin/main`. Also: a careless `git checkout -- .`
  while clearing regen noise reverted the uncommitted generator edit —
  commit first, then regen-verify, then reset.
- **v1.1 SHIPPED** (`cpl_funding.js` + test): **Colleges | Districts**
  rollup toggle (73 districts; conservation-tested), **Per year | 2026-30
  total** period toggle (SYSTEM ×3 = $34.8M, header relabels), and
  **click-to-expand drill-ins** (college: per-priority math + county
  context; district: member colleges ranked by allocation). Test grew
  33 → 46 assertions.
- **v1.1's real find: the SYSTEM-row variance** (see workbook quirks
  above) — caught by a *failing conservation assertion*, not by reading
  the sheet. Writing the "obvious" reconciliation test against the
  workbook's own totals is exactly what surfaces a source's internal
  inconsistency.

### 2026-06-11 (later) — freeze lift: CCR-session coordination + shared-file follow-ups

Sam asked to coordinate with the parallel CCR session and move forward.
**Coordination = repo-state check, since sessions can't message each other:**
zero open PRs repo-wide, `main`'s tip was this workstream's #353, and the 17
`claude/*` remote branches are all pre-auto-delete leftovers of merged PRs —
nothing in flight, so the shared-file freeze lifted. Edits were kept to
single disjoint rows/lines so even a CCR push mid-flight rebases cleanly.
Shipped (PR 3): pii_guard EMAIL_FILES + scope-comment line, CLAUDE.md §7b +
§2 rows, INDEX.md row, these doc updates. **Deliberately skipped: the
Dashboard teaser card** — the generator hardcodes teasers for only 3 of 12
tabs (Workplan Goals / Budget / Vision 2030; none of the newer tabs have
one), so a funding teaser isn't the established pattern AND it's the
highest-collision file (the generator is where `export_unified_courses`
lives). Available on request as a small generator edit at the
`teaser_html` block (~line 10076).
