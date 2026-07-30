---
title: CPL Implementation Funding tab — workstream lessons
created: 2026-06-11
updated: 2026-07-28
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

## Session checkpoint — 2026-06-11 (Rule 8; session end)

**(a) Learned:** the committed-workbook-model discipline (one-shot revision
scripts; input-driven builder since openpyxl invalidates caches;
`insert_rows` doesn't adjust ranges; extent by structural marker; edit
generated files at the generator source; no derived values hardcoded in
tests) — distilled to
[`kb-notes/methodology-committed-workbook-models.md`](kb-notes/methodology-committed-workbook-models.md).
Plus: a failing conservation test is how you find a source's internal
inconsistency; an unmeasurable funded metric needs a maturity ladder, not
silence; no-horizontal-scroll is now a standing UI rule.

**(b) State:** 13 PRs merged (#352–#368), all green, nothing open. The tab
is live + DRAFT-chipped: shares-first rev2 workbook (119 colleges, balance
$0 structural), what-if sandbox, district rollups + period toggle +
drill-ins, P2/P3 actuals vs target (first artifact: 27 colleges, P2 4,635 /
P3 16,151), P1 labeled incentive gap, provenance footnotes, no-scroll
table. ADR ratified; suite 26/26 files (94 + 15 funding assertions).

**(c) Roadmap:** Sam's 25-26 headcount table (mechanical refresh) · P1
ladder (ID-coverage report → CO match-back → CAEL replication study) ·
first-cron `unmatched` audits stay quiet unless non-empty (then the footer
shows them) · Excel→Supabase only if the model needs multi-user editing.

**(d) Next concrete step:** when Sam sends the 25-26 table — drop into the
workbook, fix the vintage header (auto-relabels the tab), re-run builder,
commit. Until then: nothing blocked on us.

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

### 2026-06-11 (first data + Sam's screenshot pass) — artifact live; roster edits; the no-scroll rule

- **First actuals published** (dispatched run): 27 colleges carry MAP
  transcribed-student records; statewide **P2 = 4,635 / P3 = 16,151**; 12
  suppressed cells; **`unmatched` = {} — every MAP name resolved**, which is
  why Sam "didn't see" the bucket. The UI now surfaces it whenever it's
  NON-empty (footer ⚠ line listing the unmatched MAP names; included in
  statewide, no college row).
- **Roster edits** (workbook revision #2, `_revise_workbook_2026_06_11_b.py`):
  "Chabot Hayward" → **"Chabot"** — changed at the TRUE source everywhere in
  lockstep: the workbook, AND `kb/_seed_college_short_names.py`'s RAW table
  (the seeder REGENERATES the json — editing `college_short_names.json`
  directly gets overwritten on the next seed; old short kept as an alias so
  stored data still resolves) → reseeded json + `college_short_names.js`
  (chips everywhere now read "Chabot"). **"Mt San Antonio Noncredit"
  added** (order 119, after Mt San Antonio, district/county copied) with
  **headcount 0 PENDING Sam's DataMart number** — allocates $0 until the
  2022-23 annual headcount is typed into the workbook C-cell + builder
  re-run. openpyxl `insert_rows` does NOT adjust formula references — the
  revision script re-fills the uniform formulas + C8 SUM + the AVERAGE
  range for the new extent (the exact bug class the rev2 fix addressed).
  Builder hardened: the college extent is now detected by the numeric
  ORDER column (no fixed last-row constant to forget), and it warns on
  0-headcount rows.
- **UI pass from Sam's screenshot**: priority-card variable lines + METRIC
  left-justified (the page shell centers text); college table fits without
  horizontal scroll — tighter padding/`.82rem`, district names folded to
  "… CCD" in truncating cells (full name in `title`), `P1/P2/P3` headers
  with explanatory titles. **Sam made no-horizontal-scroll a standing
  rule** → added to CLAUDE.md "Engineering & UI practices". Tests 89 → 94.

### 2026-06-11 (Mt SAC split) — noncredit headcount landed; mixed-vintage flag

Sam: NC = **35,363**, credit = **41,950** (replacing Mt San Antonio's prior
66,445). Applied to the workbook (two C-cells), rebuilt: statewide
2,199,157 → **2,210,025**, per-student **$5.2488**, NC row allocates
**$185,614/yr**, credit **$220,188/yr**, balance $0. **Vintage story (Sam, on the flag):** Mt SAC's pair is from **24-25 MIS
totals**; he believes the rest of the table is actually **23-24** (despite
the column header reading "2022-2023" — MIS trails by up to a year). Mixed
vintage by one row is accepted for now; **Sam will supply a complete
25-26 revised table once all numbers report** — that refresh should also
correct the column header (which auto-relabels the tab footnote). Two
test assertions that had hardcoded headcount-derived numbers ($5.27 rate,
219,916 projected) now derive from the live data — headcount edits can't
break the suite again.

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

## 2026-07-03 — Session 2 (Chancellor-facing rework: 2-year selectable window + year-specific priorities + noncredit-feeder carve-out + team-phrase config)

**(a) Learned.** Once a "data extract" tab becomes a knob the audience *plays*
with, the year-specific policy fields (metrics, factors, selected years, the
feeder carve-out) stop being workbook cells and become **config**, not data.
The clean split: the builder keeps emitting the stable data-derived facts (pool
inputs, college + system headcounts, census context) as DEFAULTS; the policy
layer lives in a Supabase config blob (team-phrase editable) + a per-browser
what-if. So the workbook stays untouched, and the renderer computes every dollar
live from the effective config (the baked per-college dollar columns were
dropped — they'd be stale the instant a year / share / carve-out changes; the
builder still recomputes the workbook chain to SELF-CHECK the extract, it just
doesn't ship the derived cells). Three-layer resolution, per field:
`SCENARIO ?? SHARED ?? BASE`.

**(b) State.** Shipped in one PR:
- `funding/supabase_cpl_funding_config.sql` + live migration `cpl_funding_config`
  — single-row JSONB config, anon SELECT, `is_allowed_reviewer() OR team_pass_ok()`
  write. Seeded `{}` so the client PATCHes.
- Builder rewrite (`_build_funding_data.py`, model version `2026-07-03.1`):
  `year_options` (2026-27…2029-30) + `default_years` (**2** — 2026-27 + 2027-28),
  `year_priorities` (slot 1 & 2, each 3 priorities with Sam's Year-1/Year-2 metric
  text; shares/targets default from the workbook row-7 values), `feeders` (NOCE /
  SD Cont. Ed / Mt. SAC NC / Calbright — **editable headcount estimates**),
  `pool.feeder_carveout` ($1M default) + `feeder_metric`.
- Renderer rewrite (`cpl_funding.js` v2): two **year dropdowns**, a **Year 1 /
  Year 2 filter** (switches the priority metrics + the college P1/P2/P3 columns),
  **editable priority metric/description/share/target** + **editable feeder
  headcount/metric** + editable pool inputs, a **noncredit-feeder section** (pool
  = carve-out ÷ years, split by headcount), a **team-phrase auth bar**
  (`CPL_TEAM_PHRASE.unlockRow`; unlocked edits PATCH the shared config, locked
  edits are a local scenario), Supabase load/save with rollback on RLS no-op.
  Kept the college table format, drill-ins, district rollup, period toggle, and
  P2/P3 actuals.
- Teaser in `excel_to_dashboard.py` re-pointed to the renamed pool field
  (`college_funding_before_feeder`); try/except means the cron never breaks on it.
- Tests: `tests/cpl_funding.test.js` rewritten (110 assertions — schema, year
  window/filter, feeder split, editable text, the 3-layer merge, team-phrase
  shared edits via a mock, actuals, empty-state). Full suite green.

**(c) Roadmap.** Feeder headcounts are placeholder estimates — Sam/Chancellor
true them up in-tab (an explicit edit drops the `est.` flag). Admin cost label
still reads "2 FTE × 3 YRS" while the default is a 2-year window — the pool
inputs are editable, so adjust in-tab or re-label the workbook next edition.
The actuals feed (`cpl_funding_performance.js`) is keyed by stable p1/p2/p3
slots; its metric text no longer matches every year's metric, so actuals are
surfaced as "per MAP" against whichever year is shown (honest, not year-matched).

**(d) Next concrete step.** Hand the tab to the Chancellor for scenario play;
if a base model wants to be shared, unlock with the team phrase and configure.
Consider: a 3rd/4th year toggle (the renderer already divides by
`selectedYears().length`); real noncredit MIS headcounts for the feeders.

### 2026-07-03 follow-up — Excel workbook RETIRED

Sam: "We don't need that excel book anymore." Confirmed the only thing still
sourced from `funding/CPL_Funding_Model_2026.xlsx` was the 119-college roster
(2022-23 MIS headcount + district/county + census working-adults) — and that was
already **baked into the committed `cpl_funding_data.js`**; nothing at runtime
(incl. the daily cron, which only builds the P2/P3 *actuals* via
`_build_funding_performance.py`) reads the `.xlsx`. Deleted the workbook + the
one-shot builder (`_build_funding_data.py`) + the two `_revise_workbook_*` scripts.
`cpl_funding_data.js` is now a **committed hand-maintained snapshot** (header
rewritten; `source` re-labeled; `sheet` dropped from the render line). A future
headcount refresh = edit the roster in the data file directly; the builder lives
in git history for a full re-derive. Kept: `_build_funding_performance.py` (cron
actuals — reads the MAP CustomReport, not the workbook) + the new
`supabase_cpl_funding_config.sql`.

### 2026-07-03 follow-up 2 — 2025-26 headcount refresh + feeders out of the college table

Sam supplied the **Annual 2025-2026 student counts** (76 institutions). Applied
directly to the hand-maintained `cpl_funding_data.js` (model `2026-07-03.2`):

- **74 college rows → 2025-26** (name aliases handled: Chabot Hayward→Chabot,
  Coalinga College→West Hills Coalinga, Lemoore College→West Hills Lemoore);
  the **41 colleges not in the update keep 2022-23**, stamped per-row
  `hc_vintage` — the tab renders a data-driven honesty note ("41 of 115 college
  rows await a 2025-26 headcount") that disappears once the refresh completes.
- **The 4 feeder institutions were MOVED OUT of the college table** (they were
  in the MIS roster as CalBright / Mt San Antonio Noncredit / North Orange
  Adult / San Diego Adult — drawing college allocations against CPL metrics
  they can't earn). They now live only in the `feeders` roster with REAL
  headcounts (NOCE 15,560 + SD Cont. Ed 21,561 per Sam's 2025-26 table; Mt. SAC
  NC 35,363 + Calbright 2,484 from their 2022-23 MIS rows) — `estimate` flags
  gone, per-feeder `vintage` shown in the feeder table.
- Roster 119 → **115 colleges**; SYSTEM headcount 2,210,025 → **2,258,784**;
  `headcount_pct` recomputed over the new roster; `headcount_label` re-labeled
  (drives the column tooltip + footnote automatically).

### 2026-07-03 follow-up 3 — year columns · combined headcount · measurability map (Sam's 4 items)

① **Measurability analysis** of the six new metrics → the vault note
`docs/kb-notes/reference-funding-metrics-measurability.md` + a `MEASURABILITY`
map in the renderer: Y1-P1 (any transcribed) is live NOW (the daily builder's
distinct-student count — the old "awaiting completion data" label was stale
under the new metric set); Y2-P1/Y2-P2's units halves are a small builder
extension; Y1-P2 needs exhibit linkage in the Custom Report; Y1-P3 needs origin
tracking baked into the Student-Portal launch (~2 weeks — time-critical);
Y2-P2 completion + Y2-P3 both ride the CO MIS match-back. ② The headcount pool
card now shows **colleges (allocation basis) + noncredit feeders = CCC total**.
③ The college table's P1/P2/P3 columns → **one column per funding year (Yr 1 /
Yr 2, actual years in the tooltip) + a window Total**; per-priority math stays
in the drill-in for the filtered year; the Per-year/Total period toggle is
retired (both are columns now); the feeder table gains Support/yr + window
Total. ④ Sam's future ask noted: a PUBLIC "current metrics + allocations vs
potential" college view once the model finalizes — colleges see where they
stand (and each other). Tests 125; suite green.

## 2026-07-06 — Session 3 (StarHaarland: the equity refinements — front-load · floor · rural allowance · eligibility badges)

**(a) Learned.** The team's "yearly allocations are too small for 1–2 FTE"
complaint decomposed into a TIMING problem and a SIZE problem once the
distribution was computed: 65 of 115 colleges sit under a ~$150K/yr 1-FTE
grant **per year**, but only 23 under it **per window** — so front-loading
(a pure re-timing) fixes 42 colleges for free, and a minimum-viable floor
fixes the residual 23 for ~3% of the pool. Cheap floor math: a per-college
minimum funded *within* the pool is an iterative waterfall (floored colleges
get exactly the floor; the remainder renormalizes over the other colleges'
headcount — a re-split can push the next-smallest college under, so iterate;
converges in a few passes, Σ = net pool by construction). A flat base grant
to all 115 would have cost 17–34% of the pool — rejected. Also: the "rural
designation" has NO single authoritative CCCCO list (only 13 campuses meet
the federal definition); the honest seed is the CCCCO **Rural College
Transfer Collaborative** cohort (10 colleges), DRAFT-labeled + overridable.

**(b) State.** Shipped in one PR (all four team asks, per Sam's "Build all 4"):
- **Front-load toggle** (`disbursement` even ⇄ frontload, three-layer config):
  Yr 1 column carries the full window; later years render `↻ carryover`;
  feeder pool front-loads too; window note + formula + footer explain the
  roll-forward + close-out year (window end + 1, computed by `nextFy`).
  Timing only — totals + per-year targets unchanged.
- **Minimum-viable floor** (`pool.floor_window`, default $150K, 0 disables):
  `allocModel()` waterfall + floor pool card (live top-up count/cost),
  ⬆ row chips, drill-in "Floor applied" line (proportional-vs-floored),
  formula renormalization sentence. At current defaults: ~24 colleges topped
  up for ≈$1.2M within the $32.8M pool.
- **Rural allowance** (`pool.rural_carveout` $1M deducted top-of-pool,
  `rural_threshold` 50% editable, per-college `rural` flags + in-tab
  override when unlocked): each rural college can EARN carve-out ÷ #rural by
  reaching ≥ threshold of its measurable Year-1 priority targets
  (`ruralAttainment` — per-MAP actuals ÷ target, suppressed/absent = pending,
  never a silent zero); rural section table + 🌲 chips; qualifier count in
  the tfoot. Roster = the 10 RCTC colleges, DRAFT provenance in-data.
- **Eligibility badges** (informational — dollars unchanged): ① CPL
  Coordinator in MAP — live via the new PII-free anon
  `map_coordinator_summary()` RPC (boolean per college; names/emails stay
  reviewer-gated); the sync now pulls `CPL Coordinator (+Email)` from the
  Contacts view (field-map + PII-safe coverage count). ② Participation
  request by 2026-09-01 (editable) — new `cpl_funding_participation` table
  (anon read; write + DELETE team-phrase/reviewer — the waa DELETE-widening
  precedent; the tab re-fetches after every write per #598). Elig column
  (✓/◐/○), summary block with live counts, drill-in opt-in + rural-flag
  buttons when unlocked. Name join through `cplCollegeShort()` short-name
  space on both sides.
- Migrations applied live: `map_contacts_cpl_coordinator`,
  `map_coordinator_summary_rpc`, `cpl_funding_participation`. Schemas of
  record updated/added (`map/supabase_map_contacts.sql`,
  `funding/supabase_cpl_funding_participation.sql`).
- Tests: `tests/cpl_funding.test.js` 125 → **182** assertions (Part D:
  waterfall conservation/floor/proportionality, front-load timing +
  three-layer resolution, rural gate + threshold edit + overrides,
  eligibility badges + never-move-dollars). Full suite green.

**(c) Roadmap.** ① The rural roster is a DRAFT — Sam's team trues it up
(in-tab override or the data file). ② The eligibility gate is badge-only;
when the policy finalizes, an "exclude ineligible + hold in reserve" toggle
is a small extension of `allocModel()`. ③ Coordinator coverage populates on
the next `map-users-sync` run — the real N-of-115 number then informs how
hard a Sept-1 deadline bites. ④ Rural attainment currently measures only
Y1-P1 (the one measurable metric) — it widens automatically as
MEASURABILITY feeds land.

**(d) Next concrete step.** Dispatch `map-users-sync.yml` (done post-merge)
→ read the coordinator coverage count → tell Sam whether Sept 1 is a cliff
or a formality.

### 2026-07-06 evening — Session 3 continued (Sam's 8 + 3 refinements)

One more batch, same session, all shipped together:

1. **County column hidden** (college table) — the data stays in the drill-in
   "County context" line, the search haystack, and the CSV export.
2. **Count note** now reads "… · plus 4 noncredit campuses (74,968 students)
   funded via the $1,000,000 carve-out" — computed live from the feeder
   roster, never hardcoded.
3. **Eligible† column** next to **Transcribed†** (relabeled from "CPL
   students†"): the perf builder gained **PE = distinct students with
   Eligible Credits > 0** (context metric, NOT a priority; same suppression);
   "Eligible Credits" was already in the fetched view — zero new PII surface.
   Cells show "—" until the next daily cron publishes the new artifact.
4. **Floor ≠ higher targets, clarified in-tab** (Sam's SC): targets are
   headcount-based (`target % × the college's own MAP headcount`) — the floor
   raises funding, not the bar. Note added to the formula box + the floored
   drill-in line.
5. **⬇ Excel + ⬇ PDF** toolbar buttons: CSV (BOM, meta line, includes the
   hidden County/working-adults + rural/floor/eligibility flags; SYSTEM row
   carries the noncredit-inclusive headcount) and a **print-window** export
   (clone the live tab, flatten inputs to text, strip chrome → browser
   Print → Save as PDF — the fact-sheet pattern; literal seal-blue in the
   transient doc since it can't see the app's tokens). No xlsx library added.
6. **CO Monitor's note** per college in the drill-in — new gated
   `cpl_funding_notes` table (**read AND write** reviewer/team-phrase; the
   page is public, candid commentary isn't). Editable textarea when
   team-editing is on; read-only text for phrase-holders; invisible to
   anonymous visitors. Flip `cfn_select` to `using(true)` if the team ever
   wants them public.
7. **Seal-blue retheme**: the glass theme had redefined `--navy-primary` to
   `#1C1C1A` (charcoal — reads black), so every "navy" background on the tab
   was black. Backgrounds (hero card, table headers, active seg, authbar
   buttons, tfoot rule) now use the existing **`--seal-blue` (#002F6D)**
   token. Text usages stay charcoal per the theme.
8. **Named scenarios**: localStorage store v2 (`cpl_funding_scenarios_v2`,
   `{active, scenarios:{name → override}}`), v1 auto-migrates into
   "Scenario 1"; authbar selector + ＋ New (blank slate = shared model) +
   ✕ Delete; blank slots evaporate; the phrase-unlock promotion flow is
   unchanged and promotes the ACTIVE scenario. Per-browser by design —
   shared/team scenario slots would live in `cpl_funding_config` keyed by
   name (recommended later if the team wants cross-device scenarios).
9. **Alignment polish** (Sam's screenshot): pool-card values centered
   (incl. the editable inputs), priority labels left with the tranche share
   staying right, priority-box numeric inputs centered.

Tests 184 → **218**. Post-merge: dispatch `daily-dashboard.yml` so the perf
artifact picks up PE same-day.

## 2026-07-23 — Session (SkyFunder): the COBI funding-tab reorg — 6 asks, 3 PRs

Sam wanted six modifications to the Implementation Funding tab, delivered as three
merged PRs — **all JS-only in `cpl_funding.js` (+ its test), zero HTML touched**, so
no Rule-4 mirror and zero collision with a parallel Fact Sheet session.

**(a) Learned.**
- The 3-layer config (`SCENARIO ?? SHARED ?? BASE`) generalizes cleanly to a
  **multi-project / multi-scenario** model *without* touching the accessor layer:
  keep `SHARED` and `SCENARIO` as the two override objects, just change what fills
  them — `SHARED` = a **pointer into** `SUPA_CONFIG.projects[pid].scenarios[sid]`,
  `SCENARIO` = the per-browser what-if for that `(project, scenario)`. Every existing
  `firstDefined(SCENARIO.x, SHARED.x, base().x)` accessor kept working unchanged. The
  only real refactor was load/save/reset/promote (snapshot the WHOLE config for
  rollback, re-point `SHARED` after any structural edit) + the UI + migration.
- **No schema change was needed** for shared projects/scenarios — the existing
  single-row `cpl_funding_config` JSONB just holds a richer blob. `normalizeConfig()`
  wraps a legacy flat override as the CPL project's Scenario 1 (no team edits lost),
  and only persists the new shape on the first curator save.
- A **structured template document generator beats an LLM** for a memo that must
  match a house format exactly (ESS 25-82): the numbers are the model's, the sections
  are fixed, editing is a `contenteditable` page, and **Word export is a small
  DOM→docx walker** over the edited content using the repo's already-loaded
  `docx.min.js` (`window.docx`; `ensureDocx` lazy-loads if absent). Verified in real
  Chromium — the ⬇ Word button produced a valid 10.8 KB `.docx`.
- **The Letters tab is not a document engine** — it's an iframe into the *separate*
  `cpl-knowledge-base` repo/Supabase (a legislative-campaign tool), unreachable from a
  tracker session. Reusing it for the memo would have meant cross-repo edits; the
  native sub-tab + the repo's docx stack was the right call (Sam agreed via the fork).

**(b) State.** Shipped + merged:
- **PR-1 (#878):** Total Available Funds card (`remaining_2025_26 + one_time_2026_27`
  = $44,040,307, live) · Award range cards (Avg / Min / Max per-college window total;
  Min names the floored-college count) · SYSTEM total row moved `<tfoot>` → pinned
  first `<tbody>` row.
- **PR-2 (#879):** the shared project + scenario layer. Top control strip
  `[Project ▾ +Add | area badge] [Scenario ▾ +New(clone) ✕]`; projects/scenarios
  persist in `cpl_funding_config` (curator/team-phrase to create/delete; anonymous
  what-if still overlays); `+New` **clones the current scenario**; `+Project` clones
  the CPL template + tags a COBI **area** (CPL/C&I/CIP/GR from `window.CPL_ORGS`);
  backward-safe migration + legacy per-browser-scenario fold-in.
- **PR-3 (#880):** the 📄 **Report** sub-tab — an editable **ESS-25-82 memo** generated
  from the active project/scenario (masthead · MEMORANDUM · TO/FROM/RE · Funding
  Overview · Priority Outcomes · Allowable Use · Allocation table · Reporting ·
  Conclusion · cc), doc-type toggle **Memo/Letter/Report/Brief**, exports 📋 Copy /
  ⬇ PDF (print) / ⬇ Word (docx). Tests 266 → **292**; full suite 168 files green.

**(c) Roadmap / follow-ups (all optional).**
- The memo's FROM/contact default to generic role titles (not names) and ESS number
  is a `ESS __-__` placeholder — deliberately editable; Sam fills the specifics.
- Per-project **data isolation** is still deferred (Rule 9) — a non-CPL project reuses
  the CPL 115-college engine as a template; "add project" is a labeled container +
  clone, not a distinct allocation model. Defining a real non-CPL funding model is the
  next architectural step *if* a second project needs different mechanics.
- Inline memo edits are export-only (reset on Regenerate / doc-type switch). If Sam
  wants persistent memo drafts, store the edited HTML per (project, scenario) in the
  config — small extension.
- Word/docx: the DOM→docx walker handles h1/h2/p/ul/li/table/strong + recurses
  containers; a fancier memo (page numbers, real letterhead image) would need the
  docx section/header API.

**(d) Next concrete step.** Nothing blocked on us — hand the tab to Sam for live
testing. If he wants the memo's masthead to carry the real CO seal image or a
per-area masthead (C&I/CIP/GR), that's a focused follow-up in `memoMasthead()`.

---

## 2026-07-23 (SkyFunder rounds 2 & 3) — editable narrative fields + generalized pool boxes

Two more rounds of curator asks after the initial reorg (#878–#880), both JS-only in
`cpl_funding.js`.

### Round 2 — #883: editable priority titles + strategies + timing + eligibility intro

- **Priority titles** (default Access / Success / Capacity) and **Recommended Strategies**
  (editable bulleted list per priority) are **year-specific** — Sam's call: *"the next year
  priorities may shift depending on how colleges do in Year 1 … strategies will also change
  each year as colleges mature."* So both ride the existing per-slot `prioField`/`setPrio`
  path (same layers as metric/share/target); no new config path, and they re-render when the
  Year 1/Year 2 filter flips. Default title falls back to a JS `DEFAULT_PRIORITY_TITLES`
  constant when the per-slot value is null.
- **Timing** is a new top-level `timing` config key (array of `{label, date}`), seeded from a
  `DEFAULT_TIMING` constant (Sam's 9 milestones); editable label + optional right-aligned date
  with add/delete, undated rows render italic (`.nodate`). **Eligibility intro** became a
  single editable `eligIntro` field (lost the inline bold, gained full editability — Sam OK'd).
- Reused the eligibility-requirement **bullet/✕/＋ list pattern** verbatim for strategies and
  timing — that pattern is now the template for the future *variable-count priority boxes*
  (Sam flagged wanting 2/4/5 priorities later; the title/strategies keying by `slot:idx`
  already extends to any count).

### Round 3 — #884: editable / add / delete funding pool boxes + header trim

- **The pool model generalized.** Core boxes stay named (`CORE_REVENUE` / `CORE_DEDUCTION`),
  but now: editable **labels** (`poolLabels[field]`), **hide/restore** core boxes
  (`hiddenPool[field]`), and **custom boxes** (`customPool[]` = `{label, amount, kind}`) added
  as revenue or deduction with a per-box kind toggle. Net generalized to
  `Σrevenue − Σdeduction − feeder − rural`.
- **Conservation is the keystone.** With no custom boxes and nothing hidden, `grossRevenue() −
  grossDeduction()` is *identical* to the old `remaining+one_time−admin−scaling`, so every
  existing allocation number is unchanged — guarded by an explicit test
  (`net == remaining+one_time−admin−scaling−feeder−rural`). This is the pattern for
  generalizing any hardcoded calc: **make the general form reduce to the old form, then assert
  it.** Custom revenue also flows into the Total Available Funds card.
- **Scope boundary (Sam-approved pushback):** carve-outs (feeder/rural/floor) + computed cards
  (Total Available, net hero, headcount, per-student) are **non-deletable** — structural or
  derived; you disable a carve-out by zeroing it. Delete/hide are behind a `confirm()` warning
  (*"changes the funding calculations"*); a "Hidden boxes" strip restores core boxes.
- **Bug caught in Chromium, not jsdom:** `&mdash;` in an editable label DEFAULT rendered
  literally ("&mda…") because an `<input value>` is plain text, not HTML — jsdom doesn't
  surface it, real Chromium did. **Lesson: any string that lands in an input `value` must use
  real characters (—), never HTML entities.** Fixed + added a hover-`title` so clipped labels
  stay readable.
- Dropped the duplicate **"% of each tranche"** chip from the priority header (Sam: *"save real
  estate"*) — the share stays editable in the Allocation-share line below; removed the dead
  `.share` CSS + its test clause too.

**Method note landed:** `docs/kb-notes/methodology-generalize-a-calc-conserve-the-baseline.md`
(the "reduce-to-old-form + assert conservation" pattern). Tests 292 → **325**; real-Chromium
verified each round (0 console errors, no horizontal scroll). Side-lane — left `cpl_todos.json`
+ the numbered handoff to the CCR mainline.

## 2026-07-23 (SkyFriend) — uniform box fonts · metric-keyed actuals · the allocation-balance box

Three more curator asks, one JS-only PR in `cpl_funding.js` (+ its test).

**(a) Learned.**
- **A position-indexed lookup silently breaks the moment the curator reorders the
  things it indexes.** The `MEASURABILITY` map was keyed `[slot][idx]`, so when Sam
  swapped Access ⇄ Success the "any transcribed" ACTUAL (16,807) stayed pinned to
  slot 0 while the metric there was now statewide-eligibility — the number showed
  under the wrong priority. The durable fix is to key the lookup to the **content
  that identifies the situation** (the metric text), not the ordinal. New `MEASURES`
  array = ordered `test(metric)` predicates, most-specific first (portal → eligible/
  statewide → matched-MIS → completion → units → any-transcribed), first match wins.
  The measure now *travels with the metric* wherever the curator drops it, and the
  default order still resolves identically (all prior assertions green). **General
  rule: when a curator can reorder N things, don't index them by position — resolve
  by an intrinsic key.**
- **"Confirm this for me" is a real deliverable — answer it, don't just build.** Sam
  believed the Projection % *both* sizes the affected population *and* caps funding.
  That was true of the ORIGINAL (pre-#360) model where `share = factor × rate` so the
  projection rate moved dollars — but the 2026-06-11 shares-first redesign (which Sam
  approved) **decoupled them on purpose** precisely because the projection % "looked
  like a forecast but moved money." Today: **Allocation share = the money lever;
  Projection % = a performance target only, moves/caps nothing.** So the honest
  "are the percentages within budget?" check is about the SHARES, not the projection —
  which is exactly what the new balance box measures. Confirmed in the reply + a
  clarified in-box line; did **not** silently re-couple them on a mistaken premise.

**(b) State.** Shipped (one PR):
1. **Uniform fonts** — `.cplfund-prio .p` desc/nums/metric + `.cplfund-strat` +
   `.cplfund-timing` + `.cplfund-ed-s` all → `.8rem` (the smaller size already in use);
   only the priority **title** (h4 + `.cplfund-prio-title-input`) stays 1rem. The strat
   & timing rows previously inherited the page base (~1rem) because their containers set
   no size — setting the container size makes the `font-size:inherit` ed-t inputs fall
   in line, so the whole box reads as one block.
2. **Metric-keyed measurability** (`MEASURES` + `measurability(metric)`), call sites in
   `actualLineHtml` / `collegeDetailHtml` / `ruralAttainment` now pass `p.metric`; the two
   hardcoded "Year-1 Priority-1 metric" column titles de-positioned.
3. **Allocation-balance box** in the Funding Pool area: `perYear() − perYear()×Σshare =
   remainder`, using the viewed year's shares. `$0` (fully apportioned) at 100%; a red
   `.balance.over` **Over-allocated** state naming the overage when shares exceed 100%;
   an unallocated-surplus state under 100%. It's the modern N3-BALANCE cell — recomputes
   live with every pool/share/year edit. Projection-% line reworded to "performance
   target only … does not move or cap the funding, which is set by the Allocation share."

Tests 325 → **337** (reorder-follows-metric with a perf artifact, balance $0/over-allocated,
projection clarify text, font-uniformity CSS guards). Full suite **168 files green**. No
Chromium module in this sandbox, but the new entities all live in innerHTML (not input
`value`s — the Round-3 gotcha doesn't apply); verified via a jsdom render dump.

**(c) Roadmap / advice for Sam.** If he ever *wants* the Projection % to also cap funding
(his original mental model), that's a deliberate re-coupling — I'd advise against it (it
reintroduces the exact confusion the shares-first redesign removed); keep shares = money,
projection = target, and read over-allocation off the balance box. The `MEASURES` predicates
are the one thing to touch if a metric's wording changes enough to miss its matcher — they
match distinctive phrases (`portal`, `credit recommendation`, `completion`, …), fail safe to
"no measure mapped" (never a wrong number).

**(d) Next concrete step.** Hand to Sam for live testing. Side-lane — left `cpl_todos.json`
+ the numbered handoff to the CCR mainline (per the SkyFunder precedent).

## 2026-07-24 (SkyFriend cont.) — achievement-based funding: the cap-and-earn model

The projection-% confirmation opened the real ask. Sam's model of the tab turned out
to be *not what the code did* — and I had to say so plainly before building. Two truths
established first (see the dialog): (1) the per-priority per-college allocation IS a
CAP (confirmed against his actual workbook formulas — `E8 = F8*$L$3*E7` = projected-
headcount × per-student × funding-factor; `F8 = C8*F7` = the % capping counted
headcount; so the effective share = `factor × %`, tuned to 30/42/28, identical to
today's shares-first model; his `N3 BALANCE` cell = the Allocation-balance box shipped
above). (2) Funding on **actual achieved headcount** was **never** intact — neither the
tab nor the workbook ever tied dollars to achievement; both are deterministic on
headcount. I told him that directly rather than let the misconception stand. He then
confirmed the intent and the mechanics (AskUserQuestion, both answered): **build
achievement-based**, **phase in as feeds land**, **capped at target/cap**, and — the
clincher — *"safeguard them from needing to achieve the full target to receive funding"*
(⇒ proportional, not all-or-nothing) and *"incentivize local investment … some not
implementing at all yet"* (⇒ a non-participant earns $0 on a measurable metric).

**The model shipped** (`cpl_funding.js`, JS-only): `earned = cap × min(1, actual ÷
target)`; unearned rolls forward. A **Potential ⇄ Earned** basis toggle (default
Potential — no change for current viewers); earned mode overlays the same surfaces
(pool Earned-so-far/Unearned cards, per-priority earned %, table total → earned-of-cap
· % maxed, drill-in per-priority earned). The projection % finally earns a job — it's
the achievement **target** the actuals divide by.

**The load-bearing decision** was the *default for unmeasured cells* — full doctrine in
the new KB note `methodology-achievement-based-funding-cap-and-earn.md`. Four distinct
states, not one: **gap** (metric unmeasurable for anyone → advance full cap),
**pending** (feed not loaded this cycle → advance), **none** (feed loaded, this college
posted nothing → **$0**, the incentive), **suppressed** (<5 privacy floor → $0, flagged).
My first cut wrongly advanced *every* no-datum cell (system earned read 99.87%); the fix
— split "metric can't be measured" from "this college didn't do it" via a feed-loaded
check + a per-college-datum check — dropped it to a truthful 85% (the unearned Year-1 P1
of non-participants rolls forward). That distinction is the whole incentive.

**Invariants test-guarded (Part E, +20 → 357):** earned ≤ cap always; no-feed / all-gap
⇒ earned == cap (non-destructive overlay); the incentive identity (absent-from-feed
college earns exactly `cap − its measurable-metric slice`); overachiever capped at 100%;
suppressed = $0 + flagged; CSV gains Earned + % of cap columns. Verified via jsdom render
dump (Laney: $197,550 earned of $222,555 cap; system 85% with only ~2 synthetic feed
colleges).

**Phase-in reality:** today only Year-1 "any transcribed CPL" is measurable, so only it
flexes; the other two Year-1 priorities + all of Year 2 advance at full cap and light up
automatically as their feeds land (exhibit linkage · Student Portal origin · CO MIS
match-back) — the same measurability ladder the `MEASURES` resolver already drives.

**Roadmap / open:** the basis is session state (default Potential) — if Sam wants a
shared/team default of Earned, add a `fundingBasis` config field (one line, same 3-layer
resolution as everything else). Suppression policy (<5 → $0-flagged) is conservative;
revisit if small colleges need crediting. The "advance for data-gap priorities" is
generous by design (phase-in) — as feeds land the advances shrink to real earned.

## 2026-07-24 (SkyFriend cont. 2) — column show/hide + the eligibility-tooltip audit

Sam's "rug left in the context" batch of 6 asks; shipped the two unambiguous ones + a
recommendation on the rest. **Column show/hide** (`cpl_funding.js`): a **⚙ Columns**
dropdown (native `<details>`) of checkboxes; **county (Working adults) hidden by
default**; per-view + persisted (`localStorage cplfund_cols_v1`, keyed `{college:{},
district:{}}`). The neat trick that avoided a row-render refactor: **hide via injected
`nth-child` CSS computed from the live `activeCols()` order** — `.cplfund-table thead
th:nth-child(N)` + `tbody tr:not(.cplfund-detail) td:nth-child(N)`. The `:not(.cplfund-
detail)` is load-bearing: detail (drill-in) rows are a single `colspan` cell, so without
the exclusion, hiding column 1 would collapse the whole drill-in. CSS-hiding is also
transparent to jsdom (cells stay in the DOM), so it didn't disturb any existing test.
The view's **identity column (College/District) is never hideable** (row anchor). Toggling
`refreshTable()`s only — the menu lives in the toolbar so it stays open across a toggle.
**Eligibility audit (#4):** clarified the Elig tooltip + the drill-in "Baseline
eligibility" line + `eligTitle()` to frame eligibility as the **participation gate**
(CPL Coordinator in MAP + participation request), explicitly **separate from earned
funding** — a needed clarification now that funding is achievement-based. Tests 357 →
**367** (Part F).

**Recommendation for #6 (target vs actual layout) — DON'T use two physical rows per
college.** Doubling 115 → 230 rows breaks sorting (rows must stay paired), the pinned
SYSTEM row, zebra striping, and CSV, for a big complexity cost. **Recommend instead:
stack target-over-actual *within each priority column's cell*** (the `.sub` two-line
pattern already used by the earned Total cell) — a college sees `target / actual (%)` at
a glance, no dropdown, no row-doubling, and it composes with sort/CSV/print. This pairs
directly with **#5** (relabel Eligible†/Transcribed† → per-priority **P1/P2/P3** columns,
each cell = that priority's target/actual stacked, hover = the priority goal + metric).
Only the measurable priority shows a real actual today; the others show "—/gap" until
their feeds land (same `MEASURES` gating). **Deferred with a note:** column **resize**
(needs `table-layout:fixed` + a colgroup + drag handles — bigger, and it fights the
no-horizontal-scroll rule) and Sam's dream of **per-column multi-select dropdown filters**
("could eliminate redundant tab filters") — a real product direction worth a dedicated
build: a filter row under the header, each column a multi-select of its distinct values,
AND/OR across columns, replacing the separate view/year toggles. Both are the next
session's build; the column model (`activeCols()` + the nth-child hook) is the seam.

## 2026-07-24 (SkyFriend cont. 3) — per-priority P1/P2/P3 columns (target/actual stacked) + the numbered Elig pie

Sam blessed the stacked-cell recommendation ("love your direction"), so **#5 + #6 shipped**.
The two context columns (Eligible†/Transcribed†) are **replaced by three per-priority
P1/P2/P3 columns** built from `priorities(state.viewSlot)` (so they follow the Year 1/Year 2
filter; stable keys `prio0/1/2`). Each cell **stacks target over actual** (`prioCellHtml`):
top = `{target students} · {cap}` (muted), bottom = `{actual students} · {earned} · {%}`
(bold) — a college sees its standing **inline, no drill-in**. Header hover = the priority
**goal + metric** (#5). Reuses the achievement engine: `earnFraction` drives the actual line
(`earned` → number+%, `gap`/`pending` → advance, `none` → 0, `suppressed` → <5), so the
columns light up as feeds land. Sort by a priority column = the posted actual. CSV swaps
Eligible/Transcribed for per-priority `Pn target`/`Pn actual`. **Width guard:** a compact
`fmtCountK` (797 · 16.8K · 113K) + `fmtMoneyK` ($33.4K · $4.9M) keep the dense cells narrow
(full precision stays in the cell hover) so the extra column doesn't force horizontal scroll
— and everything's hideable now anyway.

**The Elig pie (Sam's bonus ask):** the ✓/◐/○ glyph → a **numbered SVG pie** (`eligGlyph`
rewritten): one slice per tracked requirement, numbered 1..N, **filled green when the college
satisfies it** (muted otherwise), ~22px. Built **N-slice, not a forced 4** — the honest
version of Sam's "4 slices" idea: today there are **2** data-backed requirements (coordinator
+ participation), so 2 slices; it grows toward 4 automatically as more *per-college-checkable*
requirements are wired (extra free-text requirements aren't per-college tracked, so they're
not sliced). `eligReqList()` is the new seam (the ordered, met-stamped requirement list);
`eligParts`/`eligScore` now derive from it. Recommendation delivered: **want a fixed 4 slices?**
we'd first need to define + wire the data for 2 more per-college criteria — otherwise 2 slices
would always sit gray and read as "failing" criteria that don't exist.

Tests 368 → **376** (Part G: 3 columns, target/actual stacked, %, gap, funding, header hover;
pie is an SVG with N numbered green-when-met slices). Full suite green. Real-DOM dump verified
(Laney P1 200/$8.4K of 797/$33.4K = 25.1%; pie 2/2 green "12"). **Deferred, unchanged:** column
resize + per-column multi-select filters (Sam: "no problem holding … not a big priority now").

---

## 2026-07-27 (SkyMoney) — collapsible sections · per-student rate · P1/P3 metric wiring

Three curator asks on the Implementation Funding tab, one PR (**#901**, `cpl_funding.js`
+ `funding/_build_funding_performance.py` + tests; **0 HTML**). Sam answered the two
genuine design forks up front via a focused question (per-student shown *inside each
P-cell*; wire P3's portal count *now*), so the build proceeded without a prototype round.

### 1. Collapsible sections

Every top-level section is a native `<details open>` whose `<summary>` **is** its `h3`
(8: Funding window · Funding pools · Baseline eligibility · The three funding priorities ·
How an allocation is computed · Potential allocation by college · Noncredit feeder support ·
Rural college allowance). Two helpers:

- `section(id, title, body)` — the inline sections (I already have title + body).
- `collapseH3(id, html)` — for the sub-generators (`ruralSectionHtml`/`feederSectionHtml`)
  that emit their **own** leading `<h3>…</h3>`; a small regex lifts that h3 into the
  `<summary>` and wraps the rest as the body. This avoided refactoring those functions'
  internals (and their early `return ""` empty-state).

**The load-bearing bit is persistence.** An edit re-renders the whole `#cplFundingMount`
innerHTML, and a fresh native `<details>` defaults back to `open` — so without persistence
every keystroke-commit would re-open every section the curator had folded. Fix: a
`cplfund_sections_v1` localStorage map (default open), read by `sectionOpen(id)` when
building each `<details>` and written by a `toggle` listener attached in `wire()`. Same
lesson the ⚙ Columns menu already learned (`cplfund_cols_v1`). In-memory `SEC_STATE`
carries it across renders within a session; localStorage carries it across reloads.

### 2. Per-student funding rate (replaces "% of headcount")

The curator now types **$/student**; the reach (# students + % of headcount) is **derived**
= `share × perYear ÷ per_student`. The clean part: **`per_student` is the stored source of
truth, and `target_rate` is derived from it in the ONE place priority objects are built
(`priorities()`)** — so every downstream `p.target_rate` reader keeps **reading it
unchanged**; the input flip required **no consumer re-wiring**. (Precision: `ruralAttainment`
and `collegeAlloc` are literally untouched; `earnFraction`, `prioCellHtml`, `prioritiesHtml`
(the `sysHeads` reader) and the CSV cells WERE edited in this same PR — but for the
per-student *display* and the separate `advancing` feature, not to change how they consume
`target_rate`.) Full write-up:
KB note `methodology-invert-an-input-derive-at-the-single-seam.md`. Highlights:

- No schema change — `per_student` is a new key in the config JSON; `setPrio(..., "per_student", $)` persists it.
- Legacy rows (only `target_rate`) fall back and expose the *implied* per-student, so the
  tab self-migrates the moment Sam edits a rate.
- The `applyEdit` branch is `perstudent` and stores a **raw dollar** (not `/100` like share/target).
- Guarded divide-by-zero + clamped `target_rate` to ≤ 1.0 (a very low $/student can't target
  > 100% of headcount).
- Checked for recursion first: `priorities()` calls `perYear()`/`totalHeads()`, which read
  pool config only (no path back into `priorities()`).

**Sam's math confirmed:** P3 $4,164,651 ÷ 67,764 = **$61.46**. The inverse is what the tests
assert (Part H): halving `$/student` ~doubles the student target, while the **dollar
allocation is unchanged** (dollars come from the *share*, never the rate) — the clean proof
the derivation is wired without touching the money.

**Judgment call (a): the per-cell `$/stu` is the UNIFORM policy rate**, the number Sam sets,
the same down each column — *not* each college's `cap ÷ target`. Why it matters: with the
minimum-viable floor active, the floor renormalizes the split, so a non-floored college's
realized `cap ÷ target` sits ~10% below the policy rate and floored colleges sit above it.
Showing the uniform policy rate reads as one clear policy number matching the priority card;
showing per-college realized rate would be self-consistent within a row but wouldn't equal
the $61.46 Sam typed. Left it uniform; noted the flip for Sam (it's a one-liner in
`prioCellHtml` — `perStu = target > 0 ? cap/target : 0` instead of `p.per_student`).

### 3. P1/P3 metric wiring — closing the data gaps

The measurability engine is `MEASURES` (ordered `test(metric)` predicates, metric-keyed so it
follows a reordered priority — SkyFriend's fix). Two additions:

- **P1 → `pe`.** Sam reworded P1 to *"eligible for at least one course offered through CPL."*
  The eligible-students count (`pe`, **~43,000 statewide** — 43,284 on the 2026-07-27 feed; it
  drifts daily) was **already in the daily feed**
  (the builder computes it from `Eligible Credits > 0`; it was collected as "context"). The
  only gap was a matcher — so a plain-**"eligible"** predicate → `src: "pe"`, placed **after**
  the statewide-eligible gap (`eligible` + `statewide`/`credit recommendation` → still the
  exhibit-linkage gap, which genuinely needs exhibit linkage). **Zero pipeline change** — the
  data was there all along. (The find: read what the feed *already carries* before assuming a
  gap needs a new build.)
- **P3 → `pp` + `advance`.** P3's metric is portal/landing-page origin, which the feed didn't
  stamp and which excludes "Potential Student = Yes" rows (Sam's "~4, mostly test"; the real
  post-dispatch count is **pp = 5**, across 3 privacy-suppressed colleges — Modesto/Solano/West
  LA). Sam chose "wire the ~4 now." The builder now emits a new `pp` = distinct Potential-Student rows with
  transcribed CPL (I stopped `continue`-ing on Potential rows and route them to `pp`; pe/p2/p3
  still exclude them, so those counts are byte-identical). Verified against a synthetic
  CustomReport: pp counts, and potential-without-transcribed + test rows are excluded.

  **The trap I avoided:** a naive wiring makes P3 measurable, so in **Earned mode** every
  college with `pp = 0` (i.e. everyone but the handful) flips from "advance at full cap" to `none`
  → **$0 earned** — silently gutting P3 funding on a not-yet-live Portal. Fix: the portal
  measure carries `advance: true`, and `earnFraction` returns a new status **`advancing`**
  (f = 1) — it **surfaces the count for display** but **pays full cap** during phase-in, so
  P3 isn't zeroed. `earnedLineHtml`, `prioCellHtml`, `actualLineHtml`, and the CSV all learned
  the `advancing` status. **Flip `advance` off once the Portal is live** and P3 becomes fully
  achievement-based automatically. (Judgment call (b) — flagged for Sam.)

### State & verification

Tests **376 → 390** (Part H: per-student derive + inverse, collapsible render + persistence,
pe/pp wiring; the old P3-as-gap assertions updated to the wired behavior). Full suite green
(**173 files** post-rebase onto #904). Real-Chromium render: 8 collapsible sections, per-student
input + `$/stu` cells present, section collapse works on click, **0 console errors, no horizontal
scroll**. `pp` **published** into `cpl_funding_performance.js` via the post-merge
`daily-dashboard.yml` dispatch — statewide **pp = 5** (2026-07-27), so P3 now shows the count
(advancing) instead of "arrives next refresh."

**Next concrete steps:** (1) ~~confirm `pp` landed~~ DONE — pp = 5 statewide (2026-07-27 feed);
(2) if Sam wants it, flip either judgment call (per-college `$/stu`; P3 zeroing) — both
1-liners; (3) when the CPL Student Portal ships (~2 weeks), remove `advance:true` so P3 goes
fully achievement-based. Side-lane — left `cpl_todos.json` + the numbered CCR handoff alone.

---

## 2026-07-27 (SkyMore) — front-load-aware formula box · cell re-weight · feeder 2-batch cadence · rural/feeder advice

Four curator asks on the Implementation Funding tab. Three shipped as a JS-only PR
(`cpl_funding.js` + its test; **0 HTML**); two (feeder measurables, rural spread) are
**advisory** — Sam said "propose"/"advise" — captured here + surfaced to him with a
focused question.

### 1. "How an allocation is computed" is now RESPONSIVE to the Even ⇄ Front-load toggle

The box read as an even-tranche explainer even when Front-load was ON — the core sentence
said "the same again in each of the N years" regardless. Root cause: the disbursement cadence
was a **trailing appended sentence** (`flSentence`, only added when front-loaded) on top of a
hardcoded even-tranche clause. Fix: replaced both with **one `cadenceSentence` that branches**
on `frontloaded()` and tells the whole timing story for its mode:
- **Even:** "That same {tranche} disburses again in each of the N years ({window}), in **equal
  annual amounts**."
- **Front-load:** "Under **front-loaded** timing the full {window} window ({window total}) is
  disbursed **up front in Year 1** ({y0}) … while Years 2+ are carryover only (unspent funds
  roll forward, closing out by {closeout}). Front-loading is timing only: a college's window
  total is unchanged."
The floor + basis + balance sentences are unchanged. **Lesson (again): a toggle's explanatory
text must branch at the point the toggle changes the story — don't bolt a second sentence onto
a clause written for the other mode.** (The footer + window note already branched; only the
formula box lagged.)

### 2. Priority cell re-weight — the earned dollar is the focal point

Sam: "de-bold the percentage and student count and bold instead the dollar amount they are
currently receiving." The bottom (actual) line of each P-cell was `{count}` (bold navy) ·
`{earned $}` (faint, normal) · `{%}` (bold green) — the eye landed on the count + %, not the
money. **CSS-only** flip (3 rules): `.cf-a` (container, holds the count) → `font-weight:400` +
`--text-muted`; `.cf-u` (earned $) → `font-weight:700` + `--navy-primary`; `.cf-pct` (%) →
`font-weight:400`. Now the **earned dollar** is the bold navy focal point and the count + %
recede. No markup change (weights only), so every `.cf-a`/`.cf-u`/`.cf-pct` text assertion
stayed green.

### 3. Noncredit feeder rows reflect the 2-batch-per-year disbursement (like the colleges)

Sam: the feeder support "should be distributed in 2 batches — same as the colleges (see Timing
section)." The Timing section already shows **two disbursements per funding year** (Feb + Jul)
"based on cumulative CPL in MAP." Reflected it in the feeder table: a `feederBatchNote(amount)`
helper prints a muted **"2 batches · ${amount/2} ea"** sub-line under each feeder row's Support
cell **and** the FEEDER POOL footer; the intro gained a sentence tying the cadence to the
Timing section and to "the cumulative eligible CPL these campuses stand up in MAP." Batch =
support ÷ 2 in **both** modes (even: per-year pool halved; front-load: the whole carve-out lands
in Year 1, still paid in two batches). Kept the "front-loaded" thead label (test-pinned).

### 4 (ADVISORY) — feeder measurables + rural per-priority spread

**Feeder measurables (Sam: "give it a think, suggest any measurables we could build in").**
NC campuses can't transcribe (colleges do that) and aren't obligated to collect JST (their
service members mostly don't claim GI Bill), so the college P2/P3/Veteran-Star metrics don't
port. What DOES port, in build order:
- **F1 — Eligible headcount** (measurable soonest): distinct NC students with an **exhibit
  attached to their NC student record in MAP** showing ≥1 eligible unit. This is the direct
  analog of the colleges' P1 **`pe`** (eligible) count — the daily builder already computes
  `pe` from `Eligible Credits > 0`; the only lift is teaching the builder to bucket NC-campus
  student records. **Recommend this as the metric the 2-batch feeder disbursement tracks** —
  makes the feeder pool achievement-based exactly like the college pool.
- **F2 — Noncredit-certificate CPL waivers** (the one "award-like" metric they OWN): count of
  noncredit certificates where a course/requirement was **waived on work experience (CPL)** —
  the NC campus issues its own noncredit certificates, so this is a transcription-equivalent
  it controls, and it's the CPL work they've expressed interest in. Measurable if the waiver is
  recorded against the exhibit in MAP.
- **F3 (phase-2, stretch) — CPL-ready hand-offs that transcribe at a partner credit college**:
  the feeder's true value metric, but it needs the same cross-campus identity match-back the
  colleges' P3-portal / CO-MIS work rides. Propose once that infra lands.
- **NOT** JST/Veteran-Star (no obligation) and **NOT** portal-origin (credit-college facing).

**Rural per-priority spread (Sam: "adding the $110k to spread across their 3 priorities …
advise").** Current mechanism (`ruralAttainment` + `ruralSectionHtml`): each rural college
earns its **full** per-college allowance by clearing a **binary ≥50%-of-average-Year-1-
attainment** gate — all-or-nothing, and inconsistent with the main pool, which already earns
**per-priority proportionally** (`earned = cap × min(1, actual/target)` per priority, summed).
Recommendation: **align rural with the main model** — split each rural college's allowance by
the 3 priority shares and earn each slice proportionally (`Σ_k allowance×share_k×min(1,
actual_k/target_k)`, capped). Removes the arbitrary 50% cliff (40% attainment earns 40%, not
$0), gives one mental model, and stays phase-in-aware. **The $110k needs a decision:** today
$1M ÷ 10 rural colleges = **$100k each**; **$110k each ⇒ the carve-out must rise to $1.1M**
(−$100k off the college pool). Surfaced both (mechanism + amount) to Sam via AskUserQuestion;
build is a follow-up in `ruralSectionHtml`/`ruralAttainment` (mirror `earnFraction`'s per-
priority cap-and-earn) once he picks.

**State & verification.** Tests **390 → 411** (Part J: formula-box even/front-load branch, the
three cell-weight CSS guards, feeder 2-batch row + pool per-batch even & front-load). Full
funding suite green; `retheme_tokens`/`pii_guard`/`cpl_funding_performance` green (the only
other tests touching `cpl_funding.js`). Render dump confirmed the even/front-load prose swap +
the "$X · 2 batches · $Y ea" feeder cells. **Shipped #908.**

### SkyMore round 2 — the advisory items BUILT (Sam's AskUserQuestion picks)

Sam answered the three forks: **rural = per-priority with a ≥50% FLOOR** (hybrid), **keep $100k
each**, **build F1 + F2**. Shipped as a second PR (branch restarted from the merged `main` since
#908 was squash-merged — the harness's fresh-change rule).

**4a — Rural allowance now earns PER PRIORITY with a floor (was a binary ≥50%-of-average gate).**
`ruralEarned(c)` splits each rural college's allowance by the 3 Year-1 priority shares; each
slice **unlocks** once that priority clears ≥ the floor (`ruralThreshold`, still editable, default
50%) of its Year-1 target, then pays **in proportion** to attainment (`slice × min(1,
actual/target)`), capped. It **reuses `earnFraction`** — the exact per-priority engine the main
pool uses — so rural and the main pool now share one mental model (Sam's "incorporating it that
way"). Unmeasurable priorities are *pending* (not paid, not zeroed); the old `ruralAttainment`
(average) was **deleted** (dead after both call sites moved to `ruralEarned`). The rural table's
"Yr-1 target attainment" column → **"Earned so far"** ($ earned) + a **"By priority"** column of
compact `.cf-rchip` chips (green = unlocked & earning, muted = below floor / nothing posted,
faint = pending feed; `P1/P2/P3` short labels for the no-scroll rule). Tfoot → "N of 10 **earning**
on current data" + the earned pool total. The college drill-in mirrors it. **Amount unchanged**
($1M ÷ 10 = $100k each). **Key property:** removes the 50% cliff — 40% attainment on a priority
now earns 40% of that slice instead of $0 for the whole allowance.

**4b — Noncredit feeder measurables F1 + F2 (the "give it a think" build, done honestly).**
- **F1 (Eligible headcount) is LIVE-WIRED, not faked.** The daily builder
  (`_build_funding_performance.py`) gained a **feeder name resolver** (`_feeder_resolver`, MAP
  name → feeder short) + per-feeder eligible bucketing (the same `pe` measure — `Eligible Credits
  > 0`, Potential/Test excluded, <5 suppressed) → a new top-level **`feeders: {short: {pe}}`** in
  the perf artifact. **Zero fabrication:** it's empty today (the feed carries no NC-campus records
  yet) and lights up the instant campuses attach exhibits to their NC records in MAP. The consumer
  reads `perf().feeders` — a per-feeder "· N eligible in MAP" sub-note in each feeder row + an F1
  line in the new **measurables ladder** (`feederMeasurablesHtml`). This is the metric the 2-batch
  disbursement is framed to track.
- **F2 (Noncredit-certificate CPL waivers) is a labeled placeholder** — the one award a NC campus
  issues itself (a course waived on work experience). There's **no feed for it** (it's not in
  `View_StudentAggregatedValues`), so it's honestly shown "awaiting a data source — recorded when a
  campus posts the waiver in MAP." Not faked into a number.
- The ladder also states what is **NOT** tracked: transcription (colleges do that) and JST/Veteran
  Star (NC campuses aren't obligated to collect JST) — Sam's own framing, on the tab.
- **The pre-existing `feederMetric` free-text line** (default "CPL-ready noncredit completions
  handed off to a partner credit college") is effectively **F3** (the hand-off metric) — left in
  place; F3 proper needs the cross-campus identity match-back the colleges' portal/MIS path rides.

**Method note — the honest way to "build" a metric with no data yet:** wire the *computation* +
the *display* end-to-end (builder emits the key, consumer reads it, tests prove the bucketing on a
synthetic row) but let it resolve to a **pending state** until real data lands — never seed a fake
count. F1 is a live pathway; F2 is a committed placeholder. This is the feeder analog of the
colleges' measurability ladder (`MEASURES`).

**State & verification.** `tests/cpl_funding.test.js` **411 → 422** (Part K: rural per-priority
earn + green-chip unlock + floor-locks-all + drill-in chips; feeder F1/F2 ladder + pending state +
live F1 count). Builder test **16 → 19** (F1 NOCE=5 distinct, Calbright <5 suppressed, feeders
don't leak to `unmatched`) — fixture gained an "Eligible Credits" column + feeder rows. Full suite
green (173 files). Render dump confirmed the rural per-priority chips + "Earned so far" + the F1
"42 eligible in MAP" row note + the ladder. **F1 publishes empty until the daily cron runs against
a feed carrying NC records.** Side-lane — left `cpl_todos.json` + the numbered CCR handoff alone.

## 2026-07-27 — SkyMore, cont. 3: the js-tests OOM (test-infra fix)

**Symptom.** After #908/#910 grew `cpl_funding.test.js` to 422 assertions, the non-required
**js-tests** check went red on CI (`FATAL ERROR: Reached heap limit — JavaScript heap out of
memory`, ~4GB) — while the suite stayed green locally. It's a non-required check, so it never
gated the merges, but a red suite erodes signal.

**Root cause (measured, not guessed).** `cpl_funding.test.js` runs **53 `freshDom()` + `boot()`**
cycles, each `new JSDOM(..., {runScripts})` evaling the ~54KB data + consumer and rendering the
full 118-row tab. jsdom's **per-window `vm` context is not reclaimable mid-run** — proven: adding
`window.close()`, clearing the prior window's DOM + evaled globals, and even a forced `global.gc()`
(`--expose-gc`) **all still OOM at 400–2048 MB**. So ~53 windows × ~75 MB ≈ 4 GB accumulate with
no way to free them. It passed locally only because dev machines default to a ~8 GB heap
(`heap_size_limit` = 8240 MB here); CI's runner auto-defaults to ~4 GB → right at the cliff → GC
thrash → intermittent OOM. Reproduced deterministically: `NODE_OPTIONS=--max-old-space-size=4096
node tests/cpl_funding.test.js` → EXIT 134.

**Fix.** `tests/run.js` already runs each file in its own sequential child process — so raise the
child ceiling: `spawnSync("node", ["--max-old-space-size=8192", file])`. The explicit flag
overrides a lower ambient default (verified: 8240 MB effective even under `NODE_OPTIONS=2048`);
files run one at a time so only one child holds memory; the cap only permits growth, so the 172
small files are unaffected. Post-fix: `…=4096` ambient + the flag → 422/422, full suite 173 green.

**Lesson.** A jsdom test file that spins up dozens of windows in a loop will accumulate
un-reclaimable `vm` contexts; you cannot `close()`/`gc()` your way out. Either give the child
process a bigger heap (done — matches how the file already passed locally) or split the file so
each half runs in its own process. If assertions keep growing, prefer the split next.

---

## 2026-07-28 — SkyHigh: readability + equitable cells + the rural fold + the pool-framing cascade

Three merged PRs (#914 readability/full-width/mobile+a11y · #916 rural fold + pool reconciliation ·
#921 the 13 federally-rural roster + muted 🌲). The durable lessons:

**1. Showing a per-unit RATE inline can read as inequitable the moment it varies.** The cell used
to show `$38/stu` uniformly — but the $150k floor (and later the rural bump) make each small
college's *effective* $/student higher ($47, $64, $274…). Put side by side, "$38 vs $274/stu" reads
as unequal even though it's the floor *protecting* small colleges. **Fix: drop the varying rate from
the cell; lead with the ONE yardstick every college shares — % of its own target — keep the real
dollars, and move the effective rate + WHY it differs into the hover.** (`prioCellHtml`, Option "D".)
The cell became `Tgt N stu · $cap` / `Now N stu · $earned · %`; the hover carries the effective
$/student + the floor/rural reason. Equity is often about what you *don't* show side by side.

**2. Folding a carve-out into the distribution is a two-layer change — the policy layer fights back.**
Folding the rural allowance into each rural college's row (`W = mainW + ruralWindow`, assume the
≥50% unlock) made the DISTRIBUTION total $33.8M (main + rural). But the POLICY layer (priority
cards' "statewide $ ÷ rate = target" identity, `perYear()`, the balance box) is main-pool. Keep
those on the main pool; fold rural only into the distribution surfaces (`collegeAlloc`, `systemAlloc`
via `netCollegeWithRural()`, the Yr/Total, `earnAgg.winCap`) — but NOT `earnAgg.perPrio` (it feeds
the policy cards). The boundary is: *distribution folds the carve-out; policy cards don't.*

**3. …and the cascade reaches every surface that names the pool.** The adversarial review caught
that the hero pool card, the report `collegePool`, and the printed narrative still read $32.8M while
the SYSTEM row + Earned card now read $33.8M — a $1M contradiction. **Lesson: when you change what a
headline total means, grep every surface that displays it.** Resolution (Sam's call): ONE number
($33.8M) everywhere, with a note breaking out "$32.8M main + $1M rural," and the rural pool card
reframed from a *deduction* to an *earmark within the pool*. `netCollege()` stays for the main
proportional split; the hero shows `netCollegeWithRural()`.

**4. Derive parameters, don't hardcode them — it makes policy swaps free.** The per-college rural
bump is `carve-out ÷ N(rural)`, never a literal. So switching the roster from the 10-college demo
cohort to the 13 federally-rural colleges was a **data-only** flip in `cpl_funding_data.js`; the
bump auto-became $1M/13 ≈ $76,923 with zero code/math change. The only test churn was the hardcoded
"10"/anchor colleges (Butte→non-rural, Copper Mountain→rural). Every N-dependent display derived
from the roster, so the model just re-balanced.

**5. Adversarial review earned its keep twice.** Two structural reviews caught what 460 green tests
didn't: (a) keyboard focus was silently dropped to `<body>` on every sort/expand (the innerHTML
re-render destroys the focused node — WCAG 2.4.3), and (b) the $1M pool-framing cascade above.
Tests guard behaviors you thought to assert; a skeptic re-derives the ones you didn't.

**Next (PR4, queued for SkyHighness):** combine the floor with the rural bump — back-fill rural
colleges to $150k from the rural carve-out FIRST (frees ~$752k of main-pool money for non-floored
colleges; ~$248k rural remainder on top). The load-bearing decision: the floor is a *guarantee* but
the rural bump is *performance-earned* — so the carve-out splits into a guaranteed backfill + an
earned remainder. Lock that split with Sam before building; it couples `allocModel()` +
`collegeAlloc` + `ruralEarned`.

## 2026-07-28 — SkyHighness: PR4 — combine the floor with the rural bump (the guaranteed floor-fill model)

Shipped PR4. Sam's decision (AskUserQuestion, grounded in the live-computed split): **Option B —
guarantee the whole $1M rural allowance** (floor-fill + bonus, no performance gate). That was the
simpler *and* the more coherent call: it let me retire the entire ≥50%-per-priority rural-earning
machinery (`ruralEarned`/`ruralChip`/`ruralThreshold`/`rural_threshold`/`cf-rchip`) that had become
self-contradictory the moment the allowance stopped being "performance-earned."

**The mechanism — a reduced main-pool floor.** The clean way to make the rural carve-out fund a rural
college's floor *first* is not a second waterfall grafted onto the first — it's **one waterfall with a
per-college floor.** A rural college's MAIN-pool floor becomes `max(0, floor − ruralPer)` ≈ $73,077;
non-rural colleges keep the full $150k. Because the reduced floor guarantees `mainW ≥ floor − ruralPer`,
`mainW + ruralPer ≥ floor` **always** — so the guaranteed rural slice always covers the remaining gap and
there is **never a main-pool leftover top-up** (the edge case SkyHigh anticipated — "a floor gap > the
slice" — provably cannot arise in this formulation). The main-pool dollars the reduced floors free
re-split proportionally to the (mostly non-rural) unfloored colleges, and **`Σ mainW` still equals
`netCollege()`** (conservation is untouched — the reduced floors change the *split*, never the total).

**The equity truth I surfaced to Sam before building.** PR4 does *not* just move money's source — it
**reduces the smallest rural colleges' totals**: the 5 tiniest (Columbia, Copper Mountain, Feather
River, Lassen, Siskiyous) land at **exactly $150k** because their rural allowance is fully consumed by
their own floor (today they'd get $150k + $77k = $227k). That's the intended "no double-dip"
redistribution — but it's a real pull-down on the tiniest colleges, so I put the computed effect in
front of Sam *with* the decision, not buried. **Lesson: when a re-plumbing changes who wins and who
loses, compute the winners/losers on the live data and show them — don't frame it as a pure
source-swap.** Live split: floor-fill **$654,148** + on-top bonus **$345,852** = the $1M (conserved);
Σ college totals = **$33.8M** = `netCollege + carve` (SYSTEM total unchanged).

**The earned-basis decoupling was the subtle correctness bit.** Before PR4, `collegeAlloc`/`prioCellHtml`
computed earned as `(mainW + ruralW) × share/ny × earnFraction.f` — i.e. the folded rural *flexed* with
achievement (the #916 "assume unlocked" simplification). Guaranteed means it must **not** flex: earned =
`ruralW × shareSum/ny` (added in full) **+** `Σ priorities mainW × share/ny × fr.f` (only the main part
flexes). Same split in `prioCellHtml` (`mainCap = cap − ruralBump`; `earned = mainCap × fr.f +
ruralBump`) and in the SYSTEM row (`ruralBump = ruralCarve × share/ny`). This **resolves** the
adversarial-review note SkyHigh had logged as an accepted simplification — rural is now genuinely
guaranteed in Earned mode, not advance-credited. Guarded by a Part N test that toggles the rural flag
off under an underperforming feed and asserts earned drops by ~the full allowance.

**Disclosure gotcha caught in Chromium (not jsdom).** The per-priority hover listed "raised to the $150k
floor" AND "boosted by a rural allowance" as two independent reasons — for a floored *rural* college that
reads as $150k + rural = double-count, when the real total is exactly $150k (rural IS part of that floor).
Fixed to ONE combined reason for the floored-and-rural case. **Lesson (again): a hover that concatenates
independent "why" clauses silently double-counts when two of them are actually the same dollar.**

**State.** One PR (`cpl_funding.js` + `cpl_funding_data.js` + test; **0 HTML**). Rural section rewritten
to a **Guaranteed allowance → Floor-fill → On-top bonus → Window total** table (tfoot "N of 13 funding
their floor"); pool card + hero note + drill-in floor/rural lines all reworded to "guaranteed." Tests
**460 → 475 → 484** (new Part N: reduced-floor + guaranteed-split conservation, freed-pool,
earned-decoupling; Part O: the review fixes; Parts D1/D3/K/M4/M5 updated). Full suite 173 files green;
real-Chromium clean (no h-scroll desktop/mobile, 0 console errors).

**The adversarial review earned its keep — it caught a THIRD earned site I missed.** 475 green tests +
a live-conservation proof + Chromium all passed, yet a 4-diverse-lens skeptic pass (Workflow) found
three real defects before merge: (1) **MAJOR — the per-priority DRILL-IN earned line was a third earned
site.** I decoupled the guaranteed rural in `collegeAlloc` (row/pool) and `prioCellHtml` (collapsed
cell) but the drill-in `earnSeg` still computed `earned = capYr × fr.f` on the rural-*inclusive* cap, so
in Earned mode it flexed the guaranteed rural to $0 — contradicting the same row's cell/column/pool for
every rural college. **Lesson: when a value is computed at N call sites, a decoupling change must sweep
ALL N — grep the formula (`× fr.f`, `c[p.key]`), don't trust that the two you edited are the whole set.**
(2) MINOR — the cell hover claimed "funds this college's floor first" for the 3 rural colleges already
above the floor (floorFill=$0), contradicting their own drill-in; gated the phrasing on the actual
floorFill. (3) MINOR (pre-existing) — an empty rural roster stranded the $1M carve-out; `netCollege` now
deducts what's actually distributed (`ruralPer × roster`), a no-op on real data that returns the earmark
to the main pool when there are no rural colleges. **Fixing (2) surfaced a latent `prioCellHtml` crash:**
my earlier edit had made `ruralBump` system-aware (>0 for the SYSTEM row), so the reasons block would
dereference the null system `c` — scoped the reasons to a college-only bump. The review's own
edge-harness independently re-confirmed conservation across floor=0 / carve=0 / empty-roster /
ruralPer>floor / degrade. **A skeptic re-derives the invariants your tests didn't think to assert.**

**Follow-up shipped — the display rename.** The roster keys `"West Hills Coalinga"`/`"Imperial"` are also
the **join keys** to `cpl_funding_performance.js` (actuals) via the short-name space, so I renamed
display-only: a `display` field per row (`"Coalinga College"` / `"Imperial Valley College"`) + a cached
`dispName()` helper wrapped around every human-readable site (table row + aria-label, rural section,
district drill-in, memo/report table, award min/max card, CSV name column, CO-Monitor aria-label) and
**added to the search haystack** so "Imperial Valley"/"Coalinga College" match. `c.college` stays the key
everywhere. **Lesson: separate the join key from the display label the moment they diverge — a `display`
override + one `dispName()` seam beats renaming a key that N other systems join on.** The existing tests
kept passing because the new names are superstrings of the old short keys ("Imperial" ⊂ "Imperial Valley
College"), but Part P guards it explicitly (display shown, old key gone, key still resolves, search works).
Tests 484 → **490**.

## 2026-07-29 — SkyHighness cont.: reframe to the $35M apportionment (CBO workshop)

Sam is presenting the model to a CBO at the CO budget workshop. Two reframes landed:
- **The tab now models the 2026-27 $35M one-time apportionment**, not the combined $9M+$35M
  pool. `$35M = $26,240,307 three-priority college pool (incl. $1M rural) + $1,000,000 NC feeder
  + $1,200,000 CO Administration + $6,559,693 CPL Projects & Innovation` — ties out to the penny.
  The 2025-26 **remaining ~$9M is a separate topic** (the $15M appropriation), so it's dropped from
  the $35M model's revenue (`CORE_REVENUE` = one_time only). `scaling_projects_tech` → "CPL Projects
  & Innovation" ($6,559,693); admin label → "CO Administration". Hero → **$26,240,307**; Total
  Available → **$35M**; award range **avg $228,177 / min $150,000 / max $694,273** (all recomputed).
- **Reconciliation lesson:** Sam's authoritative anchor ($26,240,307, with its min/max/avg) is
  precise; his "~$8M for Projects & Innovation" was the round figure for **admin + P&I** ($7.76M).
  Preserve the precise anchor, derive the P&I line as the residual ($6.56M) — don't let a rounded
  side-figure move the anchor (it would have broken the min/max/avg the CBO answer is built on).
- **Test churn from a smaller pool:** dropping $9M shrank the pool 33.8M→26.24M, which re-floored
  colleges (Imperial fell below the floor; only Shasta stays above) and dropped the max (East LA
  $694k). Lesson: **assert pool-*dependent* facts by deriving from the model, not hardcoding**
  (East LA = the max & > 3× floor; the "N of 13 funding their floor" count computed from `_model()`).
- **Sandbox-slow ≠ hang:** the local suite crossed ~120s and read as a hang; it was the throttled
  sandbox (the *baseline* timed out too). Confirm with a progress trace + a generous timeout before
  chasing a phantom infinite loop.

### 2026-07-29 cont. — the $15M Distributions sub-view + ESS 25-82 outcome tracking (#934)

The CBO question ("what are the factors in the allocation formula?") cascaded into a reporting
question Sam raised himself: *the Legislature will ask how we used the $15M **and** the $35M.* So the
tab now carries both appropriations, in separate sub-views —
`[$35M Funding model | $15M Distributions | 📄 Report]`.

**What the $15M view is.** The ESS 25-82 receipt: **$50,000 × 118 institutions = $5,900,000**
(114 colleges + the **4 noncredit campuses** — ESS 25-82 funded noncredit institutions too, a detail
easy to miss), with **Sequoias** shown as *declined — pending further review* rather than as a
recipient. The **remaining $9,040,307** sits alongside it, which is where the $9M dropped from the
$35M model now honestly lives.

**Reading the source beat inferring it.** Sam sent the actual ESS 25-82 PDF. Two things only the memo
gave up: (a) the $50k was tied to a **CIO certification by Jan 15, 2026** — a *commitment* to advance
the outcomes, with achievement then "tracked through MAP plus MIS," so the columns are honestly
**progress**, not compliance; (b) outcome 1's bar is "**at least the number** of enrolled veterans
reported to MIS" — i.e. 100%, not the 75% Veteran Star we compute daily. That gap gets stated inline
rather than papered over. **Lesson: when a deliverable turns on a policy document, read the document —
the KB summary had the outcomes but not the certification mechanism or the exact threshold.**

**All three outcomes turned out measurable** (I expected at least one true data gap):
- **1 · JSTs** → `vet_star` (already in the daily perf artifact): **51 of 110** colleges at ≥75%.
- **2 · Statewide recs** → the one real lift. The signal lives in the CER: a college has adopted when
  it carries ≥1 local articulation on a `statewide`-flagged credential. The CER is **2.9 MB** — far too
  heavy to load in the funding tab for one boolean per college — so a new producer
  (`funding/_build_funding_ess.py`) rolls it into a **2.3 KB** sidecar (`cpl_funding_ess.js`):
  **84 statewide credentials → 71 adopting colleges**. **Lesson: the rollup-to-a-sidecar pattern
  (`cpl_coci_course_keys.js`, `vet_star`) is the standing answer to "I need one field from a huge
  artifact."** Getting the join right mattered: the first run left **14 unmatched** real colleges
  (East Los Angeles, City College of San Francisco…) because `college_short_names.json` nests its
  records under `colleges`, not `records` — fixed → **0 unmatched**.
- **3 · Proactive CPL** → `pe` / `p3` (already wired): 98 / 95 colleges.

**Two honesty mechanics worth keeping.** (a) **Fail-open marks**: no feed → ⏳ *pending*, never a
false "not met" — and the legend says outright that *a dash is not a finding that a college failed to
use its funds*. A compliance-looking table published against a partial feed would defame colleges by
omission. (b) **State the residual**: $5.9M + $9,040,307 = **$14,940,307** of the $15M, so the view
names the **$59,693** gap and flags confirming it before external reporting, rather than rounding the
two figures into "$15M."

Tests 490 → **515** (Part Q, incl. the no-feed fail-open asserting zero false ✓). PII guard extended
to the new artifact. Chromium desktop + mobile clean. Live: **51 · 70 · 94**, with **38 meeting all
three** outcomes.

## 2026-07-30 — SkyReconcile: establishing which document is authoritative

Sam: *"reconcile the differences between the budget table I just gave him and the funding tab —
needing to establish which is authoritative."* Resolved in one session; the model now ties to the
Sept-2026 BOG amendment to the penny.

### The methodological lesson: I got it wrong first, from a real-looking coincidence

Before reading the source I built a bridge that appeared to prove the two documents agreed:

```
tab   admin 1,200,000 + P&I 6,559,693 + feeder 1,000,000 + rural 1,000,000 = 9,759,693
amdt  admin   800,000 + P&I 8,959,692                                      = 9,759,692
→ tab main pool 25,240,307  vs  amendment "to institutions" 25,240,308   (Δ $1)
```

That $1 is real arithmetic — but it compares the tab's **main proportional pool** (after stripping
BOTH $1M carve-outs) against the amendment's **institution total**. Different quantities. On what
actually reaches institutions the two differ by **$1,999,999**, exactly the two earmarks. The
identity only holds *if you already accept* that the carve-outs are project money — which was the
very question. **A reconciliation that assumes the answer looks like a proof of it.** The tell I
should have caught: a "$1 agreement" between two independently-authored documents is far more likely
to be a definitional artifact than a coincidence, and the $2M gap sitting right beside it was the
thing to explain, not to net out.

Sam answered the fork on that faulty framing. The correction had to be made and the question
re-put — the source settled it in one line.

### Read the source; a summary of a budget is not the budget

The workbook is explicit where every summary was ambiguous:
`$35M Part: 115 Colleges & 4 Noncredit — 12,620,154 | 12,620,154 | 0 | 25,240,308`. The noncredit
campuses are *inside* the institution pool and there is no rural line at all. Same lesson as the ESS
25-82 memo a day earlier (*read the policy PDF, don't infer it*) — two for two.

### Reproducing a source's own numbers is a defect detector

Porting `allocModel()` to Python and validating it against three published figures
(avg $228,177 / min $150,000 / max $694,273 — exact) turned the model into an instrument that could
*audit the source*. It found two errors in a workbook bound for the Board of Governors:

- **`Total All CPL Initiative Funding $74,000,000` overstates by $3,000,000.** It sums
  $35M + the $18M project subtotal + $21M ongoing, but that $18M *is* $8,959,692 (of the $35M) +
  $9,040,308 (of the $15M): double-counts the former, omits the $5,959,692 already spent from the
  latter. `+8,959,692 − 5,959,692 = +3,000,000`, exactly. True total **$71,000,000**.
- **`Max Award $665,971` is not reproducible from the amendment's own pool.** Over 119 institutions
  at a $150K floor the max is $635,116; $665,971 is a transposition of **$665,791**, the max when
  only the **115 colleges** share $25,240,308 — while its average ($212,103) is that pool ÷ **119**.
  The header pairs a 119-recipient average with a 115-recipient maximum. Ruled out an alternative
  floor: the floor producing $665,971 over 119 is $128,631, contradicting the printed $150,000 min.

**Pattern worth keeping: when a source states summary statistics (avg/min/max/total), recompute them
from the source's own line items. Where they disagree, the disagreement localizes the error** — here
the avg/max split pinpointed exactly which recipient count each figure was built on.

### What shipped
Data-only (`cpl_funding_data.js` pool block + a provenance header), **zero consumer changes** —
nothing downstream had hardcoded a pool figure, which is the #931 "derive, don't hardcode" discipline
paying off a second time. New **Part R** pins each pool line to a workbook line. Supabase Scenario 1
re-pointed ($8,000,000 → $8,959,692) under a guarded UPDATE after a fresh read; Scenario 2 untouched.

### The four tests the smaller pool broke — and why that was correct
$25.24M → $23.24M main pool re-floors 39 → **46** colleges, and drops Shasta ($144,128) below the
full floor, so **no rural college's main share clears $150K any more**. Four assertions had encoded
the old pool's *shape* (`floorCount < 40`; "Shasta is the above-floor rural case"). Rewritten to
derive: bound the floored set by an invariant (a minority, all below mean headcount), pick the
largest-`W` rural college and assert *whichever branch the model is in* (both branches assert
floor-fill + bonus = the allowance), and replace N4's before/after delta — which silently assumed the
college stays unfloored with rural off — with the pool-independent invariant **unearned ≤ main_w**
(if rural were flexed, unearned would exceed it). O2 became a correspondence check across all 13.
**A test that names a specific college as "the above-floor case" is a hardcoded pool fact wearing a
data costume.** 515 → **531**.

## 2026-07-30 cont. — SkyReconcile: the Budget tab becomes the CPL ledger

Sam: *"consolidating the Budget and Implementation Funding tabs together under Budget — making sure
everything stays wired with clear authoritative sources and workspaces."* Shipped the Budget half in
one day (#938/#940/#941/#942); the Implementation Funding sub-view merge is still ahead.

### The unlock was Sam's funding history, not the schema

He offered the full 2017-forward history and judged it "distracting from the work at hand." It was
the opposite — it carried the **organizing insight the whole tab now hangs on**: both major asks were
funded in **two installments**, and 2026-27 is the year the Legislature made good on each.

| Original ask | 2025 | 2026 | Now |
|---|---|---|---|
| $50M implementation one-time | $15M | + $35M | **fully funded** |
| $7M ongoing operations | $5M | + $2M | **$7M/yr** |

A flat list of six appropriations hides that. Grouped by *ask*, the tab tells the real story in two
rows — and "the Legislature made good on both original requests" is a far better headline for a BOG
or CBO audience than an inventory of Prop 98 line items. **Lesson: when a curator offers context they
think is peripheral, take it. The organizing principle for a view often lives in the history, not in
the current-state data.**

It also *solved* two open puzzles for free: the row-5 anomaly (`total` = the $2M increment × 4;
year cells = the combined $7M/yr — two concepts in one row, never a typo), and the $59,692
(`$1,345,236` from the $6M + `$59,692` from the $15M = the `$1,404,928` N2N project).

### Nothing had to be deleted — the existing rows were already the parents

The plan called for archiving the two $6M rows and adding the history separately. Checking first
showed the seven $6M allocations split *exactly* across them (CO `2,254,764`, RCCD `3,745,236`), so
the history **nests under rows that already existed**. **Lesson: before repurposing or deleting
curator data, test whether the new structure is already latent in it.** Ten seconds of arithmetic
turned a lossy migration into a lossless one.

### The double-count trap, three times in one day

The amendment's `$74M`; then my own mockup, built to *explain* that error, which listed the $18M pool
alongside the appropriation shares it comes from; then my own seeded data (all-archived `23,307,440`
vs parents-only `17,307,440`). **Knowing about a trap does not protect you from it — only an enforced
invariant does.** Now enforced in the read path, the renderer, and both test suites, with the tests
asserting *both* the right total and that the naive sum is larger. Distilled:
[`methodology-parent-child-ledger-totals`](kb-notes/methodology-parent-child-ledger-totals.md).

### Computed totals earn their keep as detectors

`total = Σ years`, read-only where a row has years; editable only where the source gives no split.
Within a minute of existing it caught the `$15M` **source** row still carrying its old *spend*
schedule in the out-years (`2,808,450.40 + 2,136,854.53 + 2,013,327.01 + 2,081,675.46 = 9,040,307.40`)
— it would have displayed **$24,040,307**. The stored `total` had been masking it. **A source row
carries the appropriation once, never the appropriation plus its own spend plan.** Post-fix every row
with years satisfies `Σ years == total`; that one query is now the standing post-bulk-edit check.

### Two process notes
- **A test-harness failure is not a product failure.** Two assertions failed because jsdom reports
  `readyState: "loading"`, so the module's own `DOMContentLoaded` boot never fired. The module was
  right; the harness had to boot it the way the page does. Diagnose before "fixing" the code.
- **The stop-hook went stale twice in one session** — `~/.claude/` sits outside the repo, so any merge
  carrying a hook fix (here #939) silently leaves the installed copy behind. The tell is the hook
  firing on a `noreply@github.com` committer: that is always GitHub's squash-merge, which is on `main`
  and must never be amended (Rule 5). The fix is always re-copy, never amend.

### State + next
Live and merged. `budget_funding` = 45 rows; `budget_ledger.js` renders four sections with inline
editing on every non-total field. Open with Sam: the two $5M rows (one appropriation seen twice?).
Recommended next steps are enumerated in `docs/cpl_funding_handoff.md`.

---

## 2026-07-30 — SkyQueue: the basis toggle retired, the baseline gate built, districts folded into one table (#946, #947)

Picked up SkyReconcile's queued block of Sam's four asks. Three of the four shipped
(#1, #1b, #2); #3 (the public college page) and the Budget consolidation are still open.

### The load-bearing lesson: a mode toggle is where two scopes go to hide

Both retired toggles failed the same way, and it's worth naming as a class.

**The Potential⇄Earned basis toggle (#1).** Sam reported that the toggle "reads wrong."
It did — but the toggle was innocent. Two *scope* mismatches sat underneath it:

1. **Year vs window.** The P1/P2/P3 cells render the **viewed year**. The front-load
   "Yr 1" money column renders the **whole window** (`out.y1 = out.total` when `fl`).
   So the P-cells summed to *half* of Yr 1 and could never reconcile. Verified on Allan
   Hancock: P-cells `$33,534 + $46,948 + $31,299 = $111,781` = the per-year cap;
   Yr 1 = `$223,562` = the window. In even-tranche mode they reconcile exactly, which is
   why this survived so long.
2. **Earned silently spanned both years.** `earned_total` sums every selected year, and
   Year-2's metrics are mostly data gaps that **advance at full cap**. So the Earned
   figure was dominated by Year-2 advances the curator could not see anywhere in the
   Year-1 cells.

A toggle *guarantees* you can never see the two numbers at once, so a scope mismatch
between them is structurally invisible. Putting both in the cell — cap on top, earned
beneath, the shape the P-cells already used — makes the mismatch impossible to hide.
**When a toggle "reads wrong," suspect the scopes it separates, not the toggle's logic.**

**The Colleges⇄Districts view toggle (#2)** is the same failure in a different key: it
swapped the *unit of analysis*, so asking for district context deleted the per-college
rows the curator was comparing. Grouping only ADDS header rows; nothing disappears.

Durable form of both: `docs/kb-notes/methodology-retire-a-mode-toggle-by-coexistence.md`.

### What "honest" cost, concretely

Splitting earned into **measured / advance / guaranteed** at the source (`collegeAlloc`)
was ~15 lines, and it immediately surfaced the real number: on a typical college today
**~95% of the "earned" figure is an ADVANCE** — full cap paid provisionally because MAP
cannot measure that priority's metric yet. That was always true; it was just unnamed.
An `adv $X` chip plus the hover now says so. *A figure that aggregates two different
kinds of confidence needs to name the split, or it silently overstates the stronger one.*

### The baseline gate (#1b) — Sam's four rulings, taken BEFORE building

The handoff flagged four decisions as "decide with Sam before building." Asked all four
in one batch; he took every recommendation:

| Decision | Ruling |
|---|---|
| Which quals gate | **Only the 2 baseline reqs** (coordinator + participation request). Veteran Star / ESS outcomes stay performance measures that flex the *amount*. |
| Timing | **Once cleared, cleared for the window** — no clawback. |
| Scope | **Only the performance-earned main allocation.** Guaranteed rural passes through; the cap (incl. the $150K floor) always shows in full. |
| Withheld dollars | **Held in reserve, roll forward, never redistributed.** |

Two design properties fell out of those rulings and are worth keeping:

- **The gate FAILS OPEN.** No coordinator feed ⇒ nothing withheld. Same standing rule as
  every other mark on this tab: missing data must never render as a negative finding.
- **A gated cell reads `withheld · $X held`, never a bare `$0`.** A plain zero would
  claim the college *posted no CPL* — a different, and unfair, accusation. The wording
  carries which claim is being made.

Sam's own framing was the tell: gate the money, hold the dollars, keep it reversible.
That is a **prompt**, not a penalty — and it's the difference between a gate colleges
respond to and one they appeal.

### State

- **Tests 531 → 552.** Part E rewritten (stacked cells + the 3-way split); **new Part S**
  covers the gate end-to-end; the old district-view assertions became grouping assertions
  that additionally guard `Σ district subtotals == Σ college allocations`.
- Full suite **174 files green**; real-Chromium at 1440px clean both times (0 console
  errors, no horizontal scroll, 72 district headers over 115 college rows).
- **Dead code removed** with the view toggle: `COLS_DISTRICT`, `districtRowHtml`,
  `districtDetailHtml`, `districts()` + its cache.

### Next concrete step

**Ask #3 — the public college-audience page.** Build a standalone lean page (precedent:
`college_activity_template.html`), NOT a `?view=` flag: a flag is cosmetic, since the nav
and every other tab still load. Be plain with Sam that it is **audience separation, not
security** — the data files are already public on Pages and PII-free by design.

Then the **Budget consolidation**: fold Implementation Funding in as a Budget sub-view
and — the part that actually pays — have the funding model read `one_time_2026_27` from
the ledger's `$35M` row instead of holding its own copy in `cpl_funding_data.js`. That
single-source wiring permanently kills the drift class that cost a day this week.
