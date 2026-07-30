---
title: CPL Implementation Funding — next-session handoff
created: 2026-06-11
updated: 2026-07-30
tags: [handoff, funding, implementation-funding]
related:
  - "[[docs/cpl_funding_lessons]]"
---

# You are the next Implementation-Funding session

## ✅ RESOLVED — the Sept-2026 BOG amendment is now the pool authority (2026-07-30, SkyReconcile)

The reconciliation SkyHighness queued is **done**. Sam supplied the source
(`20260729_CPL_Amendment_Sep_BOG.xlsx`, sheet "CPL BOG Sep 2026", + the BOG docx) and made three
rulings: **the amendment governs**, **both $1M earmarks survive**, **2-year window**.

**The amendment's own split is only two lines**, and it names no noncredit or rural line:

| Amendment line | Amount |
|---|---:|
| College CPL Outcomes Awards (CO) | $26,040,308 |
| ↳ `$35M Part: 115 Colleges & 4 Noncredit` ($12,620,154 × 2 yrs) | $25,240,308 |
| ↳ `$35M Part: CO Staff: 2.0 FTE` ($400,000 × 2 yrs) | $800,000 |
| CPL Projects (CO & RCCD) | $8,959,692 |
| **Total** | **$35,000,000** |

**Sam's ruling — the $25,240,308 institution total governs, and the two $1M policy earmarks are
carved FROM INSIDE it** (not riding on top). The live model is now:

```
  $35,000,000  one-time
− $    800,000  CO staff (2.0 FTE × 2 yrs)            ← amendment
− $  8,959,692  CPL Projects & Innovation             ← amendment
= $ 25,240,308  TO INSTITUTIONS                       ← amendment, to the penny
− $  1,000,000  noncredit feeder carve-out            ← carved from inside
− $  1,000,000  rural college allowance (guaranteed)  ← carved from inside
= $ 23,240,308  main proportional pool · 115 colleges · $150K floor
```

Hero (college pool incl. rural) = **$24,240,308**; award range **avg $210,785 / min $150,000 /
max $623,871**. `remaining_2025_26` → the amendment's **$9,040,308**, which makes the $15M view's
N2N residual compute to the amendment's exact **$59,692**. Landed in `cpl_funding_data.js`
(data-only — 0 consumer changes; nothing downstream was hardcoded) + **Part R** in
`tests/cpl_funding.test.js`, which pins every one of those figures to a line in the workbook.
Live Supabase `Scenario 1` was re-pointed (`scaling_projects_tech` $8,000,000 → $8,959,692) so the
default view and the base now agree; **Scenario 2 (Sam's $16M P&I what-if) was left untouched**.

### ⚠️ Two errors IN THE AMENDMENT WORKBOOK — reported to Sam, do not copy forward

1. **"Total All CPL Initiative Funding $74,000,000" overstates by $3,000,000.** It sums
   $35M + the **$18M** "Project Available Funding" subtotal + $21M ongoing — but that $18M is itself
   $8,959,692 (a slice of the $35M) + $9,040,308 (a slice of the $15M). So it double-counts the
   $8,959,692 while omitting the $5,959,692 of the $15M already spent
   (`+8,959,692 − 5,959,692 = +3,000,000`, exactly). **True total: $35M + $15M + $21M = $71,000,000.**
2. **"Max Award $665,971" is not reproducible from the amendment's own model.** With 119 institutions
   sharing $25,240,308 at a $150K floor the max is **$635,116**. $665,971 is a digit transposition of
   **$665,791** — the max when only the **115 colleges** share that pool — while its "Avg Award
   $212,103" is $25,240,308 ÷ **119**. The header therefore pairs a 119-recipient average with a
   115-recipient maximum. A different floor cannot rescue it: the floor yielding $665,971 over 119 is
   $128,631, contradicting the printed Min Award $150,000.

### Consequence worth knowing (surfaced to Sam)
The smaller pool re-floors more colleges: **46 of 115 now land at exactly $150,000** (was 39), and
**no rural college's main share clears the full floor any more** (Shasta was the last, at $144,128) —
so all 13 spend part of their allowance reaching the floor: floor-fill **$848,626** + bonus
**$151,374** = $1M. Four tests had hardcoded the old pool's shape and now derive it instead.

### The full 2026-29 funding plan (from the amendment — the basis for the Budget-tab rework)

**Totals:** $35M 2026 one-time + $15M 2025 one-time + $21M ongoing ($7M × 3) = **$71M all CPL
Initiative funding** (⚠️ the workbook's own summary says **$74M** — that line double-counts the
$8,959,692 project slice; see the errors block above. Use **$71M**). Total CPL Initiative *project*
funding available (CO & RCCD) = **$18M** (= $8,959,692 from the $35M + $9,040,308 from the $15M —
this subtotal is correct, it just must not be added on top of the $35M).

**$15M (2025) — now fully reconciled:** −$5,900,000 the $50k seed grants (CO) · −**$59,692** the
N2N project partial funding (CO) · **$9,040,308** remaining balance (CO & RCCD).

**RCCD amendment projects — $31,556,650 over 2.5 yrs (1/1/27–6/30/29):** $7M Ongoing Operations
×3 = $21,000,000 · CPL Initiative RCCD Projects $10,556,650, comprising **Lightleap AI
Apprenticeship Tools $6,600,000** (1.4/2.0/3.2M) · District Administrative Support $871,650 ·
Credential Engine CTDL & Catalog Pathways $660,000 · Futuro Behavioral Health CPL $800,000 ·
CPL Credential Registry Planning (WestEd) $600,000 · ASCCC Pathways to Credit $500,000 ·
Foundation Event Regional CPL Training $300,000 · Military Base Demonstration Scaling $225,000.

**Additional CPL Initiative Projects (CO or TBA) — $7,443,350:** Lake Tahoe Valid8 Portfolio Builder
& CPL Navigators $2,520,000 · New Project TBA $3,373,350 · Foundation AI Skills to Course $600,000 ·
Capitol Impact Apprenticeship Skills & Advanced CTE Data $380,000 · RP Research Studies $300,000 ·
Noncredit CPL $270,000.

### ✅ DONE (2026-07-30) — the Budget tab is now the CPL ledger

`budget_funding` became the whole ledger (**45 rows**: 4 sources · 7 uses · 16 pool · 18 history) and
**`budget_ledger.js`** renders Sources · Uses · the $18M project pool · the pre-cutoff History, each
with collapsible detail, a Summary⇄Detail preset, and **inline editing on every non-total field
including descriptions**. Live-fetched (public SELECT, reviewer-gated writes) so a curator's edit
re-renders instantly. `total` is **computed = Σ years and read-only** where a row has years, editable
only where the source gives no split (`TOTAL_ALWAYS_EDITABLE` flips it). Sam: *"the tab looks great to
me for now."* PRs #938 · #940 · #941 · #942. Tests `budget_ledger` 34 + `budget_ledger_structure` 21.

### 🎯 RECOMMENDED NEXT STEPS — Budget enhancements (SkyReconcile, 2026-07-30)

Ordered by value-per-effort. **1–3 are the ones I'd actually do next.**

1. **Fold Implementation Funding in as a Budget sub-view** — the original ask, now unblocked. Both
   tabs are JS-rendered, so it is a nav change plus a segmented control:
   `[Sources & Uses | $35M model | $15M Distributions | Report]`. **Do the single-source wiring at the
   same time:** the funding model should read its `one_time_2026_27` from the ledger's `$35M` row
   rather than holding its own copy in `cpl_funding_data.js`. That permanently kills the drift class
   that cost a day this week.
2. **Add / delete / reorder rows.** The editor is edit-only today; a curator cannot add a project or
   retire one without SQL. Needs an ＋Add under each section, a delete behind a `confirm()`, and
   drag-or-arrow reordering writing `sort_order`. This is the biggest gap between "editable" and
   "curatable".
3. **An expenditure lane — budget vs actual.** `budget_expenditures` exists and is deliberately held
   empty ("accurate figures pending"). The ledger's shape (section + parent/child) is exactly what a
   spend-against-plan view needs: a second numeric column per row and a variance chip. Highest
   reporting value of anything on this list, gated on Sam having actuals he trusts.
4. **A Report sub-view for Budget**, mirroring the Implementation Funding memo generator — a
   legislative "how we used the $15M and the $35M" narrative built from the live ledger, exporting
   Word/PDF via the existing `docx.min.js` stack.
5. **Show the drift check in the UI.** `Σ years == total` is a one-query invariant; surface a quiet ⚠
   on any row that violates it rather than only catching it in review.
6. **Per-area isolation before other CO divisions use Budget.** Today both team phrases unlock the
   same tables (Rule 9 / the org-layer ADR). This is the real blocker on Sam's "other CO divisions
   use Budget for their funding" ambition — not the model, the RLS.
7. **The public dashboard** (Sam's stated goal once Implementation Funding is final): a **read-only
   projection of one blessed scenario**, with the what-if sandbox structurally excluded and the
   Potential-vs-Earned basis stated loudly. Design note in the 2026-07-30 session narrative.

**Two open data questions, both Sam's:** the two `$5M` rows in the history (one appropriation seen
twice — the CO's P98 line and the RCCD grant of it?), and whether the ongoing `$7M` should carry a
2029-30 year (the amendment budgets only through 2028-29; the appropriation itself is ongoing).
## ✅ 3 of Sam's 4 asks SHIPPED (2026-07-30, SkyQueue — #946, #947)

**#1 DONE (#946) — the Potential⇄Earned basis toggle is RETIRED.** Both numbers now ride
in every money cell (cap on top, `earned · %` beneath — the shape the P-cells already
used), so nothing has to be toggled to be compared. Also: earned **splits three ways at
the source** (`collegeAlloc` → `earned_measured` / `earned_advance` / `earned_guaranteed`)
with an `adv` chip, because **~95% of a typical college's earned figure is a provisional
ADVANCE**; the front-load first column is relabelled **"Window (front-loaded)"**; pool
Earned/Unearned cards, priority earned lines and the CSV earned columns are unconditional.
Targets were deliberately **NOT** doubled under front-load (timing-only by design).

**#1b DONE (#946) — earned is gated on baseline participation.** Sam's four rulings, all
taken before building: **only the 2 baseline reqs gate** (coordinator + participation
request; Veteran Star/ESS stay performance measures) · **once cleared, cleared for the
window** · **gate only the performance-earned main allocation** (guaranteed rural passes
through, the cap always shows in full) · **held in reserve, rolls forward, never
redistributed**. Fails open (no coordinator feed ⇒ nothing withheld). A gated cell reads
`withheld · $X held`, **never a bare $0** (a plain zero would claim the college posted no
CPL — a different and unfair claim). ⛔ row chip + "Held in reserve" pool card + drill-in
+ CSV column.

**#2 DONE (#947) — "Group by district" replaced the Colleges|Districts view toggle.** The
old toggle *replaced* the college rows; grouping only **adds** district header rows
carrying the subtotal, so every college row stays visible/sortable/expandable. Groups
ordered by subtotal, colleges sorted within groups. CSV interleaves `DISTRICT SUBTOTAL`
lines. Deleted the stranded code: `COLS_DISTRICT`, `districtRowHtml`, `districtDetailHtml`,
`districts()` + cache.

Tests **531 → 552**; full suite **174 files green**; real-Chromium clean both rounds.
Durable learning: **`docs/kb-notes/methodology-retire-a-mode-toggle-by-coexistence.md`** —
when a mode toggle "reads wrong," suspect the *scopes it separates*, not its logic; a
toggle structurally hides a scope mismatch, coexistence is self-policing.

### 🎯 STILL OPEN — the Budget UI consolidation

✅ **#3 DONE (#951) — the public college-audience page.** `cpl_funding_public.html`, a
standalone lean page (NOT a `?view=` flag — a flag is cosmetic, the nav and every other tab
still load). Loads only `cpl_funding_data.js` + `cpl_funding.js` + the two sidecars.
**Public mode** in `cpl_funding.js`: `edText`/`edNum`/`edArea` return static text (which
also closes the ANONYMOUS what-if path), control strip + authbar return "", the Report
sub-tab is dropped AND its body refused, `loadNotes()` skipped — plus
**`stripCurateAffordances()`**, a declarative sweep of a REGISTRY of curate attributes/ids
run from `wire()`/`wireTable()`. The sweep, not each emitter's own check, is the
load-bearing guarantee: a missed call site is the failure mode that matters, and `wire()`
is the single funnel every render path ends with. `?college=Butte` opens + highlights that
row (survives re-render; unknown value ignored). The page says plainly it is a **draft
planning model, not an award notice**.
- **Verified before publishing** (the handoff's gate): `cpl_funding_notes` SELECT is
  `is_allowed_reviewer() OR team_pass_ok()` server-side, so an anonymous reader gets
  nothing from that table regardless — and public mode does not even ask.
- **It is AUDIENCE SEPARATION, NOT SECURITY** — say so to anyone who asks. The data files
  are already public on Pages and PII-free by design.
- Added to the `pages.yml` **served-path assertion** so a future over-aggressive prune
  fails the deploy instead of 404-ing a link handed to colleges.
- ⚠️ **Two defects came from post-build SELF-review, after the adversarial-review workflow
  errored out** (all 4 lenses failed to emit their schema — its "0 findings" was a tooling
  failure, not a clean bill of health): `withheld` was pro-rated by `1/nYears` instead of
  the cell's cap share (wrong under front-load, where year 1 carries the whole window), and
  public mode hid the Report tab without refusing its body. Both fixed + tested (Part V).
  **Lesson: a reviewer that fails silently looks exactly like one that found nothing.**

**The Budget consolidation (Sam's "they're wired together").**

✅ **The single-source wiring is DONE (#949)** — the half that actually pays. Three figures
now read from `budget_funding` instead of being duplicated in `cpl_funding_data.js`:
`one_time_2026_27` ($35M), `scaling_projects_tech` ($8,959,692), `remaining_2025_26`
($9,040,308). New nullable **`budget_funding.model_field`** names the pool field each row
is the source for — **the join is that column, never the row NAME**, because the Budget
editor lets a curator rename rows freely (receipt `kb/supabase_budget_model_field.sql`).
`poolField()` gained ONE layer: `SCENARIO ?? SHARED ?? LEDGER ?? BASE`, so no downstream
reader changed. **Precedence is deliberate:** the ledger replaces the committed BASE
literal only — a scenario what-if still wins (it's a modelling choice, not drift) but a
disagreeing override is now reported inline (`ledgerDrift`) instead of diverging silently.
**Fail-soft:** no fetch / no row / archived row / non-finite ⇒ the committed figure stands,
so an unreachable Supabase can never render a $0 pool. Part T (10 assertions) covers it.
⚠ The sandbox can't reach `*.supabase.co` (Rule 9c), so the **live fetch** is unexercised —
worth eyeballing the pool section on the deployed site once.

⬜ **Still open — the UI consolidation.** Fold Implementation Funding in as a Budget
sub-view: both tabs are JS-rendered, so it is a nav change plus a segmented control
`[Sources & Uses | $35M model | $15M Distributions | Report]`. Now unblocked and lower-risk,
since the two tabs already agree on their numbers.

**Also still open, from the Budget list:** add/delete/reorder ledger rows (the biggest gap
between "editable" and "curatable"); the budget-vs-actual expenditure lane; a Budget Report
sub-view; per-area RLS isolation before other CO divisions use Budget.

*(The pool-figure reconciliation these were queued alongside was already RESOLVED by
SkyReconcile — the amendment governs.)*

## 📋 Original diagnosis of the 4 asks (kept for the reasoning; #1/#1b/#2 now BUILT)

*(The pool-figure reconciliation these were queued alongside is already RESOLVED above by
SkyReconcile — the amendment governs. These four are independent of that.)*

### 1. The Potential/Earned toggle reads wrong in the college rows — retire it

**Root cause is TWO scope mismatches, not the toggle itself:**
- **(a) Year vs window.** The P1/P2/P3 columns show the **viewed year's per-year** cap/actual. The
  **Yr 1 column in FRONT-LOAD mode shows the whole WINDOW** (`out.y1 = out.total` when `fl`). So the
  P-cells sum to *half* of Yr 1 and can never reconcile. In Even-tranche mode they reconcile exactly.
  Verified on Allan Hancock: P-cells $33,534+$46,948+$31,299 = $111,781 = the per-year cap; Yr 1 =
  $223,562 = the window.
- **(b) Earned spans BOTH years, invisibly.** `earned_total` sums every selected year. Year-2's
  metrics differ from Year-1's and are mostly **data gaps → they advance at FULL cap**. So Earned is
  dominated by Year-2 advances the curator cannot see in the Year-1 cells (Allan Hancock earned
  $158,729 while its visible Year-1 P-cells earn ~$4.4K).

**Recommendation (Sam's own two-line idea is right):**
1. **Adopt the stacked money column and RETIRE the basis toggle.** Make Yr/Total cells stack exactly
   like the P-cells already do: **cap on top, earned + % below**. Self-documenting, nothing to
   misread, and it matches the pattern Sam already blessed for the priority cells. (The toggle also
   drives the pool Earned/Unearned cards — keep those, drive them off the same numbers.)
2. **Do NOT double the targets (or the per-student rate) under front-load.** Front-load is
   **timing-only by deliberate design** (decoupled 2026-06-11); the tab explicitly promises
   "per-year performance targets are unchanged — only the cash timing moves." Doubling targets would
   mean a college must do two years of work in Year 1 to earn Year-1 money — a policy change, and it
   would break that promise. Fix the *presentation*, not the model.
3. **Relabel the front-load column** "Yr 1" → **"Window (front-loaded)"**. It *is* the window; naming
   it that kills the "why is Yr 1 double?" question at the source.
4. **Split earned into measured vs advance** (`earned = $X measured + $Y advance`). Today advances
   silently dominate the earned figure; a small "adv" chip or a hover breakdown makes it honest.
5. *Optional:* a **Year 1 / Window scope switch** so the money columns and the P columns always agree
   on scope.

### 1b. Earned should be $0 unless the college meets the baseline quals (Sam, 2026-07-30)

Sam: *"Actual funding total should only be above 0 if they've met all of the quals as well."* Today
**baseline eligibility is badge-only** (the Elig pie: CPL Coordinator in MAP + participation request
by the deadline; the roadmap always anticipated "an *exclude ineligible + hold in reserve* toggle is
a small extension of `allocModel()`"). This makes it real: **the participation gate becomes a
precondition for drawing money**, not just a badge.

**Recommendation — gate EARNED, not the cap:**
- Keep the **cap** (potential allocation) intact so a college can always see what it stands to draw;
  set **earned = $0** while any baseline qual is unmet. That's the incentive, and it's reversible.
- Render it as a **distinct state**, not a plain $0: e.g. `$0 — baseline not met` with the missing
  qual(s) named in the hover. A bare $0 would read as "posted no CPL," which is a different (and
  possibly unfair) claim.
- **Hold, don't redistribute.** Gated dollars should roll forward / sit in reserve so a college that
  qualifies mid-window can still draw — redistributing them immediately makes the gate punitive and
  irreversible. (A "held in reserve" pool card would show the total parked.)
- **Decide with Sam before building:** (i) exactly WHICH quals gate — the 2 baseline requirements
  only, or also the Veteran Star / the 3 ESS outcomes? (ii) is the gate point-in-time or
  once-qualified-always-qualified for the window? (iii) does the gate apply to the **guaranteed**
  rural allowance and the floor, or only to the performance-earned main allocation? (Recommend:
  floor + guaranteed rural are guarantees and should NOT be gated — otherwise "guaranteed" is a
  misnomer and the smallest colleges lose their minimum-viable funding.)
- Pairs naturally with #1's stacked cap-over-earned column: the gate simply drives the lower line.


### 2. District view — retire the toggle, add "Group by district" to ONE table

Today the Districts toggle **replaces** the college rows, so the per-college numbers the curator
actually wants to compare disappear; members are only visible via a drill-in.

**Recommendation:** replace the `Colleges | Districts` toggle with a **"Group by district"** option on
the single college table (Sam's alternative (b), generalized):
- Off (default) = today's flat, sortable college list.
- On = colleges nested under a **district header row carrying the district subtotal**; single-college
  districts render without a header (or a light one) so the list doesn't bloat.
- One table, one mental model; district subtotals stay conservation-tested; the drill-in becomes
  unnecessary because members are visible.
- **Decide explicitly:** how sorting interacts with grouping — recommend sorting *within* groups and
  ordering groups by their subtotal.
- Reuse `districts()` (already computes rollups + members) for the grouped render.

### 3. A public, college-audience view — build a separate lean PAGE, not a URL flag

- A `?view=` flag on the main dashboard is **cosmetic**: the nav and the other tabs still load. Not a
  real boundary.
- **Recommended:** a standalone page (precedent: `college_activity_template.html`,
  `Dashboard_Element_Map.html`) that loads only `cpl_funding_data.js` + `cpl_funding.js`
  (+ perf/ess sidecars) and renders the tab in a **`public` mode**: no left rail, no
  project/scenario strip, no curate affordances, no CO Monitor notes, no Report sub-tab.
- **Be plain with Sam about what it is: audience separation, not security.** The data files are
  already public on Pages and PII-free by design, so this gives colleges a clean focused link — it
  does not prevent someone from finding other files.
- **Nice-to-have:** `?college=Butte` opens with that college expanded/highlighted — a college mostly
  wants its own row.
- **Verify** the CO Monitor notes stay reviewer-gated server-side (they are today) before publishing.

## 🔴 STANDING RULES from 2026-07-30 (SkyQueue) — read before touching the pool boxes

### 1. Public sees less; private sees ALL the calculations (Sam)

Two DIFFERENT hide mechanisms exist and **must not be conflated**:

| | `poolHidden` (✕) | `poolPublicHidden` (👁) |
|---|---|---|
| Nature | **STRUCTURAL** | **DISPLAY-ONLY** |
| Effect | Drops the line item from `grossRevenue()`/`grossDeduction()` | Box not rendered in public mode |
| Moves money? | **YES** | **Never** |
| Use for | A what-if ("what if we had no CO admin cost?") | "Don't show colleges this box" |

⚠️ **The trap:** reusing `poolHidden` to hide the $1.2M CO admin deduction from colleges would
**ADD $1.2M back into the college pool** and overstate every allocation on the public page.
`tests/cpl_funding_public_private.test.js` guards it — W1 asserts the pool + every college's
allocation are IDENTICAL across modes; W3 asserts the structural hide still moves money.
**If those two ever agree, the distinction has collapsed.**

Defaults: `DEFAULT_PUBLIC_HIDDEN` = CO Administration + CPL Projects & Innovation (curator can
flip either with 👁). The seed-funding tab follows the same rule — curator keeps the N2N box +
full reconciliation, public gets one sentence (deleting it entirely would leave the page visibly
not reaching $15M, which invites *more* questions than the box did).

### 2. Front-load — Sam's rulings (2026-07-30), build NOT yet started

- ✅ **Fiscal: funds are in hand and legally distributable at any time.** Front-load is a real
  offer, not a presentation device. (This was my blocker; it's cleared.)
- ✅ **"Rebalance" = HOLD unchanged, do NOT redistribute** (Sam took the recommendation).
  Rationale: redistribution makes every college's cap unknowable until Year 2 (killing the
  "here's your allocation" premise a college plans against), removes a struggling college's
  reason to keep trying, and makes the model zero-sum between peers. Consistent with the
  baseline-gate ruling (held, never redistributed).
- 🎯 **Sam's idea to build: under front-load, DOUBLE the per-student RATE** (not the student
  target — that would make it twice as hard). Same students, twice the money → a college doing
  one year's work draws its two-year cap. Decays to 1× in Year 2, so a late joiner still gets
  its money at a lower rate — a soft penalty that never takes anything away. **The rate, not
  redistribution, is the incentive.**
- ⛔ **BLOCKER, do this FIRST:** today ~95% of "earned" is an ADVANCE (`f = 1` for gap/pending
  metrics), and front-load collapses both years into the Yr-1 cell — so **a college that does
  nothing already shows its full window as earned.** Doubling the rate only moves MEASURED
  metrics, so the incentive wouldn't be felt at all. Decide what an unmeasured metric pays
  during the front-load year before building the doubling. **Question is open with Sam.**
- Note: doubling does NOT over-commit the pool — the cap still binds at 100%, so the model
  stays conserved. Worth saying to a CBO, it's the first thing they'll ask.
- Equity caveat (raised, not disqualifying): the colleges able to sprint in Year 1 are usually
  the already-resourced ones, i.e. not the laggards the bonus targets. Floor + rural blunt it.

## Latest state — 2026-07-29 (SkyHighness cont.), READ THIS FIRST

**The tab now carries BOTH one-time appropriations, in three sub-views:**
`[$35M Funding model | $15M Distributions | 📄 Report]`.

**#931 — the $35M reframe (live).** The model is the **2026-27 $35M** apportionment only; the
2025-26 remaining ~$9M is a separate topic. Ties out to the penny:
`$35M = $26,240,307 three-priority college pool (incl. $1M rural) + $1,000,000 NC feeder
+ $1,200,000 CO Administration + $6,559,693 CPL Projects & Innovation`. Hero = **$26,240,307**;
Total Available = **$35M**; award range **avg $228,177 / min $150,000 / max $694,273**.
`CORE_REVENUE` dropped `remaining_2025_26`; `scaling_projects_tech` → "CPL Projects & Innovation".
⚠ **Sam's precise anchor is $26,240,307** — his "~$8M for Projects & Innovation" was the round figure
for **admin + P&I** ($7.76M); P&I alone is the $6,559,693 residual. Preserve the anchor.

**#934 — the $15M Distributions sub-view (live).** The ESS 25-82 receipt: **$50,000 × 118 =
$5,900,000** (114 colleges + the 4 noncredit campuses; **Sequoias declined**, shown as such), the
**$9,040,307 remaining** balance alongside, an honest reconciliation naming the **$59,693 residual**,
and **progress on the three ESS priority outcomes** per recipient:
- **1 · JSTs** → `vet_star` (≥75% Veteran Star; the memo's bar is 100% — caveat stated inline).
- **2 · Statewide recs** → NEW producer `funding/_build_funding_ess.py` → `cpl_funding_ess.js`
  (2.3KB sidecar off the 2.9MB CER; ≥1 local articulation on a statewide-flagged credential;
  84 credentials → 71 adopters, 0 unmatched). Workflow **step 4a3**, after the CER regen.
- **3 · Proactive CPL** → `pe` / `p3`.
Marks ✓ / ◐ (suppressed <5) / — / n/a / ⏳; **fail-open** (no feed → pending, never a false not-met);
the legend states a dash is NOT a compliance finding. Live: **51 · 70 · 94**, **38 meeting all three**.

Tests **490 → 515** (Part Q). PII guard extended. Chromium desktop+mobile clean.

### Queue / open items
- ~~Confirm the $15M residual~~ **CLOSED 2026-07-30** — the amendment names it (`$50k N2N Project
  Partial Funding (CO) −$59,692`) and the tab now carries the exact figure.
- **🎯 Sam's next ask (2026-07-30): consolidate Budget + Implementation Funding under Budget**, with
  clear authoritative sources and workspaces; then a **simplified public dashboard** off
  Implementation Funding so colleges/districts see potential + current funding in real time; and
  eventually **other CO divisions using Budget for their own funding**. The multi-project /
  multi-scenario config (#879) + the org layer (`cobi_orgs.js`) are the seams this rides on.
- **⚠️ `budget_funding` row 5 was inconsistent — DIAGNOSED + DECIDED 2026-07-30.** Named "$2M P98"
  but carrying $7,000,000 × 4 years in the year cells while `total` said $8,000,000. Not a typo —
  **two concepts in one row**: `total` = the *increment* ($2M × 4 = $8M); the year cells = the
  *combined* ongoing ($5M base + $2M increment = $7M/yr). See the funding-history block below for why.

### 📌 Sam's funding history + the three Budget-rework decisions (2026-07-30)

**The organizing insight (Sam's background, 2026-07-30): both major asks were funded in TWO
installments, and 2026-27 is the year the Legislature made good on each in full.**

| Original ask | 2025 | 2026 | Now |
|---|---|---|---|
| **$7M ongoing operations** | got **$5M** | + the remaining **$2M** | **$7M/yr from 2026-27** |
| **$50M implementation one-time** | got **$15M** | + the remaining **$35M** | **$50M total, fully funded** |

The 2025 shortfall on operations was covered by supplementing to the ~$7.4M actually needed, using
the remainder of a prior **2024-25 $6M allocation** plus the **$59K** from the $15M. **Sam's call:
the $6M era is behind the cutoff — the Budget tab does not show it.** He offered the complete funding
history back to 2017 and judged it distracting for this work; agreed — the place that history would
earn its keep is a public/legislative narrative ("the CPL funding story"), not the working ledger.

✅ **The $59,692 and the N2N project — both CLOSED by Sam, 2026-07-30.**

*The $59,692 label.* Sam's funding history resolves it: AI Apprenticeship CPL drew **$1,345,236**
from the $6M P98 Scaling CPL and **$59,692** from the $15M = **$1,404,928** — "the $1.4M N2N
project". Sam's "supplemented 2025 operations", the amendment's `$50k N2N Project Partial Funding
(CO)` and #936's narrative are all the same fact, and the figure now carries that explanation in its
own `budget_funding.description`.

*The amendment's `Lightleap AI Apprenticeship Tools $1,400,000` in 2026-27 is **NOT** a double count*
— a session flagged it as one; **Sam ruled it is not** (2026-07-30). The original contract was a
**single year**; the amendment's $6.6M over 2026-29 **extends it another year and adds other
colleges**. So the completed $1,404,928 and the forward $6,600,000 are different scopes of the same
project, not the same dollars counted twice. **Do not re-raise this.**

**Sam's three decisions (AskUserQuestion, 2026-07-30) — inputs to the Budget rework:**

1. **Ongoing → ONE consolidated $7M row** starting 2026-27, retiring the separate $5M/$2M future
   years. Matches the amendment (`$7M Ongoing Operations 7,000,000 × 3 = 21,000,000`). The 2025-26
   $5M stays as its own historical row (the cutoff keeps that year).
   - *Sub-ambiguity to resolve at build time:* the amendment budgets the ongoing only **through
     2028-29** (its 2.5-yr term ends 6/30/29), so a literal read puts **$0 in 2029-30** — but the
     money is *ongoing* and conceptually continues. Assumption on file: follow the amendment
     ($21M / 3 years, 2029-30 = 0) and note it, rather than inventing a 4th year.
2. **The amendment's 2-year shape governs the $35M everywhere.** `budget_funding` row 6 splits into
   the amendment's three components: College Implementation Awards `12,620,154 | 12,620,154 | 0`
   (= $25,240,308), CO Staff `400,000 | 400,000 | 0` (= $800,000), CPL Projects (= $8,959,692).
   Budget and Implementation Funding then tell ONE story. Sam accepted the flagged trade-off (losing
   the 2028-29 cash-availability year) — consistent with his stated intent: *"flexibility to add a
   third year if we have unspent funds to roll, but I'm hoping to spend it out in 2 years."* The
   front-load + carryover mode already represents that roll without a schedule change.
   - *Sub-ambiguity to resolve at build time:* the amendment gives a per-year split for the
     **combined $18M** project pool (`5,557,000 | 5,681,000 | 6,762,000`, = RCCD $10,556,650 +
     CO/TBA $7,443,350) but **never splits it by source**, so the $8,959,692 (from the $35M) vs
     $9,040,308 (from the $15M) per-year split is not derivable. Do NOT invent one — carry the
     $8,959,692 as a total and state that projects are budgeted as a combined $18M pool.
3. **Cutoff at 2025-26; ARCHIVE, don't delete.** The two $6M-era rows (CO $2,254,764 + RCCD
   $3,745,235.64) get an `active/archived` flag rather than a `DELETE`, so the ledger still
   reconciles historically and nothing is lost if a legislative report needs it. Requires a small
   `budget_funding` schema addition + a consumer filter in `budget_editor.js`/the Budget read path.
- **⚠️ Scenario 2 breaks the floor** (found 2026-07-30): at P&I $16M the main pool ($16.2M) is smaller
  than the sum of the colleges' floors ($16.25M), so `allocModel()` degrades to its floor-proportional
  branch and the minimum award falls to $149,538 with 102 colleges pinned. If $16M is a live option
  the floor has to come down; the degrade path is graceful but the numbers are not meaningful.
- **Outcome-1 threshold:** if the exact ESS bar (100% of enrolled veterans) is wanted, the raw
  veteran/JST counts would need to ride in the perf artifact beside the boolean.
- The Report/memo currently narrates the $35M model only; extending it to a combined
  $15M+$35M legislative report is a natural follow-up.

## Prior state — 2026-07-28 (SkyHighness), the PR4 build

**PR4 shipped: "combine the floor with the rural bump" — the GUARANTEED floor-fill model.**
Sam's decision (asked, grounded in the live split): **Option B — guarantee the whole $1M rural
allowance** (floor-fill + bonus, no performance gate). One PR (`cpl_funding.js` +
`cpl_funding_data.js` + test; **0 HTML**).

- **Mechanism = one waterfall, per-college floor.** `allocModel()` gives RURAL colleges a REDUCED
  main-pool floor `max(0, floor − ruralPer)` ≈ $73,077 (non-rural keep the full $150k). The
  guaranteed rural allowance funds the top ~$77k of a rural college's floor; the main pool covers
  the rest. The reduced floor guarantees `mainW + ruralPer ≥ floor` **always** — no main-pool
  leftover top-up ever (the "gap > slice" edge case SkyHigh feared can't arise). `Σ mainW` still =
  `netCollege()` (conservation intact); the freed main-pool dollars re-split to unfloored colleges.
- **Guaranteed in Earned mode (the subtle bit).** `collegeAlloc`/`prioCellHtml` now add the rural
  allowance IN FULL to earned (only the MAIN allocation flexes on achievement) — this *resolves*
  the #916 "advance-credited folded rural" simplification. Retired the whole ≥50% machinery
  (`ruralEarned`/`ruralChip`/`ruralThreshold`/`rural_threshold`/`cf-rchip`).
- **Live split (13-college roster):** floor-fill **$654,148** + on-top bonus **$345,852** = $1M
  (conserved); Σ college totals **$33.8M** = `netCollege + carve`. The 5 smallest rural colleges
  (Columbia, Copper Mountain, Feather River, Lassen, Siskiyous) land at **exactly $150k** (rural
  fully consumed by their floor; today they'd get $227k) — I surfaced that pull-down to Sam *with*
  the decision. Rural section rewritten to **Guaranteed allowance → Floor-fill → On-top bonus →
  Window total** (tfoot "10 of 13 funding their floor").
- Tests **460 → 475 → 484** (new **Part N** + **Part O** = the review fixes; Parts D1/D3/K/M4/M5
  updated). Full suite 173 files green; real-Chromium clean (no h-scroll desktop/mobile, 0 console
  errors). **Adversarial review (4 diverse-lens skeptics) caught + fixed 3 real defects pre-merge** —
  incl. a MAJOR one: the per-priority **drill-in** was a *third* earned site still flexing the
  guaranteed rural to $0 in Earned mode (I'd only swept `collegeAlloc` + `prioCellHtml`). Story:
  `docs/cpl_funding_lessons.md` (SkyHighness section).

### ✅ DONE — the display rename (SkyHighness follow-up, PR #PENDING2)
Added a `display` field to the 2 rows ("West Hills Coalinga" → **Coalinga College**, "Imperial" →
**Imperial Valley College**) + a `dispName()` helper; wrapped every human-readable site (table row +
aria-label, rural section, district drill-in, memo/report table, award min/max card, CSV name column,
CO-Monitor aria-label) and **added the display name to the search haystack** (so "Imperial Valley" /
"Coalinga College" match). **`c.college` stays the join key everywhere** — perf actuals, short-name,
rural/note/opt-in lookups unchanged; the 13-college roster tests still key on the short name. Tests
484 → **490** (new Part P). Chromium-verified (both names render, old key gone, no h-scroll/errors).

### Queue is now clear
No open funding items. SkyHigh's remaining note (the Earned-mode "advance-credited folded rural"
simplification) was **resolved** by PR4. Next asks come from Sam.

## Prior state — 2026-07-28 (SkyHigh)

Four curator asks + two follow-ups, **three PRs, all merged** (`cpl_funding.js` /
`cpl_funding_data.js` / test; **0 HTML** — the full-width fix is scoped injected CSS).

**#914 — readability / full-width / equitable cells / mobile + a11y:**
1. **"How an allocation is computed" → a left-justified bulleted `<ul>`** (`formulaHtml()`), one
   idea per bullet.
2. **Full width + left-justify:** injected `#tab-implementation-funding .main-container { max-width:
   none; }` (scoped — other tabs keep the 1400px cap) + `.cplfund { text-align:left }` with
   `.cplfund-card { text-align:center }` to re-center the stat cards.
3. **Mobile + accessible:** keyboard-operable sortable headers (`aria-sort` + Enter/Space keydown),
   a real `<button>` **caret** on rows (`.cplfund-caret` — keeps `<tr>` table semantics, NOT
   `role=button`), `aria-pressed` segmented toggles, table `role=region` + sr-only `<caption>`,
   focus-visible rings, **focus restored after `refreshTable()`'s innerHTML swap** (WCAG 2.4.3 —
   `captureTableFocus`/`restoreTableFocus`), and a `@media (max-width:640px)` block.
4. **Equitable per-priority cells** (`prioCellHtml`): `Tgt N stu · $cap` over `Now N stu · $earned
   · %`. The per-student **rate is NOT inline** (it varies once the floor/rural bump small
   colleges — a $38-vs-$47 spread reads as unequal). Shared yardstick = **% of target**; real
   dollars bold (`.cf-cap`, `.cf-u`), counts + % normal; the effective $/student + WHY it differs
   live in the cell **hover**. (`.cf-rate` removed.)
5. **All sections default COLLAPSED except the college table** (`SEC_STORE` bumped to
   `cplfund_sections_v2`, `SECTION_DEFAULT_OPEN = { college:true }`).

**#916 — rural allowance FOLDED into the rows** (Sam: "assume they hit the ≥50% unlock, note it in
the hover"): `collegeAlloc` uses `W = mainW + ruralWindow(c)` so rural flows uniformly into every
cap / effective rate / Yr / Total; `systemAlloc` + the SYSTEM per-priority cap use
`netCollegeWithRural()` so **Σ rows == the SYSTEM total**. Hover names the `$X/yr rural allowance`
+ the unlock assumption (a floored+rural college lists BOTH reasons via `reasons.join(" and ")`).
`earnAgg.winCap` folds rural in; **`perPrio` stays main-pool** (the priority cards' "statewide $ ÷
rate = target" identity needs the main allocation). **Pool reconciled to ONE number, $33.8M**
(Sam's call): the hero card = `netCollegeWithRural()` with a note "$32.8M main proportional pool +
$1M Rural College allowance"; the **rural pool card is now an EARMARK, not a deduction**; the
brief/memo + report `collegePool` use $33.8M. The PRECISE ≥50%-gated rural earning still lives in
the Rural section + drill-in chips.

**#921 — rural roster → the 13 federally-rural CCCs** (the old 10 were the CCCCO Rural College
Transfer Collaborative *demo* cohort, invitation-based). Data-only flip in `cpl_funding_data.js`;
the per-college bump is **derived** (`carve-out ÷ N`) so it auto-became **$1M/13 ≈ $76,923**.
The 13: Siskiyous, Feather River, Lassen, Redwoods, Shasta (kept) + Columbia, Cerro Coso, Taft,
West Hills Coalinga, Barstow, Palo Verde, Copper Mountain, Imperial (added). **Muted, larger 🌲**
(`.cplfund-tree`: 1.05rem, opacity .5, grayscale .55).

Tests **422 → 460**; full suite (173 files) green each time; real-Chromium verified (light + mobile,
0 console errors, no page-level horizontal scroll). Two adversarial reviews per structural change
(fold correctness + the pool-framing cascade) — all findings folded in. Side-lane — left
`cpl_todos.json` + the numbered CCR handoff alone.

### ✅ PR4 — DONE by SkyHighness (see the Latest state block at the top)
SkyHigh's queued PR4 shipped (Option B — guarantee the whole rural allowance). The "edge case"
SkyHigh feared (a floor gap > the ~$77k slice) provably cannot arise under the reduced-floor
formulation, and the "accepted simplification" adversarial-review note below is now **resolved**
(rural is genuinely guaranteed in Earned mode, not advance-credited).

### Also queued / notes
- **Display rename (now the top queue item — see the Latest state block):** the data still uses
  **"West Hills Coalinga"** (now *Coalinga College*) and **"Imperial"** (*Imperial Valley College*).
  Rename display-only (`display` field), never the join key.

### Read in order (SkyHigh)
1. `docs/cpl_funding_lessons.md` — the SkyHigh section (equitable-cell design, the rural fold, the
   pool-framing cascade, the roster switch).
2. This handoff's PR4 block above.
3. The test harness: `tests/cpl_funding.test.js` (**460 assertions**; Parts L + M are SkyHigh) +
   the throwaway Chromium harness pattern (`/tmp/shot.js` — rebuild `harness.html` from the current
   data + consumer, stub `CPL_TABS.loadScript`/`CPL_TEAM_PHRASE`, `CPL_FUNDING_NO_REMOTE=true`;
   screenshot at 1440/1920/390 + read cell `title`s to verify hovers). Playwright is at
   `/opt/node22/lib/node_modules/playwright`, Chromium under `/opt/pw-browsers`.

Moniker: **SkyHigh** (Sam named the next one **SkyHighness**). Claim your own if you like.

## Prior state — 2026-07-27 (SkyMore)

Four curator asks; **three shipped** in a JS-only PR (`cpl_funding.js` + test; **0 HTML**),
**two are advisory** (proposed to Sam, build pending his call):

1. **"How an allocation is computed" is now RESPONSIVE to the Even ⇄ Front-load toggle.** It
   used to explain even tranches even when front-load was on. Replaced the trailing `flSentence`
   + hardcoded even clause with one `cadenceSentence` that **branches on `frontloaded()`** —
   even → "equal annual amounts in each of the N years"; front-load → "the full window disbursed
   up front in Year 1 … carryover … timing only, window total unchanged." (`formulaHtml()`.)
2. **Priority cell re-weight** (CSS-only, 3 rules): the **earned dollar** (`.cf-u`) is now the
   bold navy focal point; the **student count** (`.cf-a`) and **% of target** (`.cf-pct`) recede
   to normal weight. "Get the focus in the right place."
3. **Feeder rows reflect the 2-batch-per-year disbursement** (like the colleges — Timing
   section): a `feederBatchNote()` helper prints "2 batches · $X ea" under each feeder Support
   cell + the FEEDER POOL footer; intro ties it to Timing + cumulative eligible CPL in MAP.
   Batch = support ÷ 2 in both even & front-load modes.
4. **The two advisory items — Sam picked, then BUILT (second PR).** He answered the
   AskUserQuestion: **rural = per-priority with a ≥50% floor**, **keep $100k each**, **build F1 + F2**.
   - **Rural (`ruralEarned`):** each allowance is split by the 3 Year-1 priority shares; a slice
     **unlocks** at ≥ the floor (`ruralThreshold`, editable) of that priority's target, then pays
     **in proportion** (`slice × min(1, actual/target)`), capped. Reuses `earnFraction` — same engine
     as the main pool. Table: "Earned so far" + a "By priority" `.cf-rchip` column (green unlocked /
     muted below-floor / faint pending); tfoot "N of 10 earning". Old averaging `ruralAttainment`
     **deleted**. Removes the 50% cliff.
   - **Feeder F1 (LIVE-wired, not faked):** builder `_feeder_resolver` + per-feeder eligible
     bucketing → `feeders: {short:{pe}}` in the perf artifact (empty until NC campuses attach
     exhibits; the same `pe`/eligible measure). Consumer: per-row "· N eligible in MAP" + an F1/F2
     **measurables ladder** (`feederMeasurablesHtml`). **F2** (NC-cert CPL waivers) = honest
     "awaiting a data source" placeholder (no feed exists). Ladder also states what's NOT tracked
     (transcription; JST/Veteran-Star). `feederMetric` free-text = the F3 hand-off metric, left in place.

Tests **390 → 411** (#908, Part J) → **422** (Part K); builder **16 → 19**. Side-lane — left
`cpl_todos.json` + the numbered CCR handoff alone.

## Prior state — 2026-07-27 (SkyMoney)

Three curator asks, one PR (**#901** — `cpl_funding.js` +
`funding/_build_funding_performance.py` + tests; **0 HTML**, Rule 4 intact):

1. **Collapsible sections.** Every top-level section is a native `<details>` whose
   `<summary>` is its h3 (8 of them). Two helpers: `section(id, title, body)` for the
   inline sections and `collapseH3(id, html)` for the sub-generators that emit their own
   leading h3 (rural/feeder — it lifts that h3 into the summary). Open/closed persists
   per-browser (`cplfund_sections_v1`, **default open**), re-applied each render; the
   `toggle` listener added in `wire()` saves it. **Why persist:** an edit re-renders the
   whole mount, so native `<details>` springs back open otherwise (same lesson as the ⚙
   Columns menu).

2. **Per-student rate replaces the "% of headcount" input.** Curator types **$/student**;
   the reach (# students, % of headcount) is DERIVED = `share × perYear ÷ per_student`.
   **`per_student` is the stored source of truth; `target_rate` is derived from it inside
   `priorities()` — the ONE seam** — so every consumer (`earnFraction`, `prioCellHtml`,
   `sysHeads`, CSV, rural) keeps reading `p.target_rate` unchanged — **no consumer re-wiring**
   for the inversion (some of those functions were edited in the SAME PR for the per-student
   *display* + the `advancing` feature, but none changed how they consume the rate; only
   `ruralAttainment`/`collegeAlloc` are literally untouched). Legacy rows (only `target_rate`)
   fall back and expose the implied rate, so it
   self-migrates the instant Sam edits one. The edit key is `perstudent` (stores a raw $,
   not `/100`). Rate also shows inside each P-cell (`cf-rate`, top line `target · $X/stu`).
   Pattern: KB note `methodology-invert-an-input-derive-at-the-single-seam.md`.

3. **P1/P3 metric wiring (the data-gap ask).** `MEASURES` (the metric-keyed predicate list)
   gained: a plain-**"eligible"** matcher → `pe` (P1's reworded metric; the eligible count
   **~43,000** — 43,284 on the 2026-07-27 feed, drifts daily — was ALREADY in the daily feed —
   gap closed, **no pipeline change**), placed
   AFTER the statewide-eligible gap so that one still resolves to the exhibit-linkage gap;
   and the **portal/landing** matcher → new `pp` src + **`advance: true`**. The builder now
   emits `pp` (Potential Student = Yes with transcribed CPL). `earnFraction` returns status
   **`advancing`** (f=1) for advance metrics — shows the count but pays full cap during
   phase-in, so the handful of mostly-test portal records (**pp = 5** post-dispatch, across 3
   suppressed colleges) don't zero out P3 in Earned mode. **Flip `advance` off once the Portal
   is live.**

**Two judgment calls (flip either if Sam prefers — both are 1-liners):** (a) the per-cell
`$/stu` is the **uniform policy rate** Sam sets, not each college's floor-adjusted
`cap ÷ target` (most colleges land ~10% under the policy rate because the minimum-viable
floor renormalizes the split); (b) P3 **shows** the pp count but keeps **advancing** (not
zeroing). Both are in the lessons doc.

Tests **376 → 390** (Part H: per-student derive/inverse, collapsible render + persistence,
pe/pp wiring; existing P3-as-gap assertions updated). Full suite green (**173 files**);
real-Chromium render clean (8 sections, 0 console errors, no horizontal scroll, section
collapse works). **Follow-up (DONE):** the post-merge `daily-dashboard.yml` dispatch
published `pp` into `cpl_funding_performance.js` — statewide **pp = 5** (2026-07-27), so P3
now shows the count (advancing) instead of "arrives next refresh". Side-lane — left
`cpl_todos.json` + the numbered handoff to the CCR mainline.

## Prior state — 2026-07-23 (SkyFriend), READ THIS FIRST

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
