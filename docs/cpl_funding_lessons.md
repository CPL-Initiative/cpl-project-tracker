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
