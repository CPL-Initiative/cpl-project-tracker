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
