---
title: EACR — college scope, the CER fold, and the accessibility pass
created: 2026-08-16
updated: 2026-08-16
tags: [lessons, eacr, exhibit-adoption, filters, accessibility, cer]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[exhibit_canonicalization_lessons]]"
  - "[[common_cr_reference_lessons]]"
artifacts:
  - statewide_interactive.js
  - excel_to_dashboard.py
  - tests/eacr_scope.test.js
  - tests/eacr_a11y.test.js
---

# EACR — college scope, the CER fold, and the accessibility pass

Workstream scratchpad for the Exhibit & CR Adoption tab (`#tab-exhibit-adoption`,
`statewide_interactive.js`). Started 2026-08-16 rather than appended to
`exhibit_canonicalization_lessons.md`, which the docs lint already flags at
1.26× its lane budget.

---

## 2026-08-16 (Sky162) — the filter was answering a different question

Sam, opening the session:

> *"Check the College filter and make sure it filters for colleges that have
> adopted the exhibit. I believe it's now filtering for any college that has
> adopted or could adopt. Think about that and recommend a strategy. Sometime I
> might want to sort for colleges that could adopt as an option — perhaps a
> toggle?"*

Plus three more: check the CER wiring, advise on the three collapsible views, and
a goal — *"one stop shopping to view all the exhibits and their credit
recommendations and a convenient view to see the colleges that could adopt."*

Then, mid-session: *"While you're doing the redesign make sure everything is
accessible and mobile friendly."*

### (a) What was learned

**The filter was 93.6% noise, and the number is the argument.** He was right that
it unioned adopters with potentials. What the wording understates is the ratio.
Measured over the live payload:

| | pairs |
|---|---:|
| (card, college) **adopter** pairs | 8,436 |
| (card, college) **potential** pairs | 122,836 |

Per college, filtering to Pasadena City College returned **1,790 cards, 44
adopted (2.5%)**; Bakersfield 1,762 / 129; Santa Rosa 1,734 / 70. The median card
carries **1 adopter and 41 potentials**. Across all 122 colleges, **6.4%** of
College-filter hits were adoptions.

**"Potential" is a TOP-derived claim, which Rule 7 forbids as a primary
determination.** From `excel_to_dashboard.py`:

```
potential = (colleges with a program of study under ANY of this exhibit's TOP codes
             ∪ colleges teaching a course with a matching C-ID) − adopters
```

The TOP branch is why the number is 41: a welding exhibit names every college
with a welding program. That is a *lead*, not a match, and it had been carrying
the word "Potential Adopters" in a column header, a Word report and a CSV.

**The better signal already existed and drove nothing.**
`statewide_prescriptive.js` (`CPL_STATEWIDE_PRESCRIPTIVE`, the M-ID
adoption-leverage layer) holds **739 titles / 4,972 college-pairs** — 25× tighter
than potential — and it *names the local course the college already teaches*. It
rendered inside a `<details>` block on each card and was not reachable by any
filter. This is the recurring shape of this repo's best catches: **the right
value existed and the consumer never asked** (`cpl_memory`
`the-classifier-existed-and-the-consumer-never-asked`, 2026-08-13).

**So: three scopes, not the two-position toggle Sam proposed.** A binary would
have pooled the strong signal with the TOP guesses, which is the very conflation
being fixed. Recorded as Sam's ask, answered one notch differently, with the
reason stated:

| Scope | Source | Pairs | Claim |
|---|---|---:|---|
| **Adopted** (default) | `adopter_names` | 8,436 | Has articulated it |
| **Adopted + likely** | prescriptive M-ID layer | 4,972 | Already teaches the mapping course, course named |
| **Adopted + any** | TOP/C-ID overlap | 122,836 | Same program area — a lead |

**Checked before choosing an adopted-only default.** Sam's standing doctrine
(`cpl_memory` `unadopted-exhibits-are-deliberate-and-must-stay-prominent`) is
that zero-adopter exhibits must stay prominent. Verified: **all 137 statewide
cards have adopters**, so an adopted-only default hides nothing on the
ready-to-adopt shelf. (Two statewide cards match no college at all — zero
adopters *and* zero potential — but they are empty records with no credit recs, a
separate data question.)

**The CER wiring was sound; three gaps sat on top of it.** All **1,745 of 1,745**
classified EACR titles resolve to a `credential_reference_data.js` credential,
zero missing — the identity layer (`kb/unified_titles.json` + `kb/credentials.json`)
is genuinely shared. But:

- **8 credentials rendered as TWO cards.** The card grain is
  `(unified_title, issuer, CPL type)`; the CER's grain is the title. In all 8
  cases one side carried the issuer and was classified, the other had a **blank**
  issuer and was not — and unclassified cards sort to the bottom, so a curator
  saw *Firefighter I* (NFPA, 2 adopters) and never learned of the unclassified
  twin (1 adopter). **A blank issuer means UNKNOWN, not DIFFERENT**, so it folds
  into the title's named issuer — while two genuinely different *named* issuers
  stay separate rather than invent a merge. No such case exists today; the rule
  is what keeps it honest when one appears.
- **`exhibit_ids` was in the payload and rendered nowhere** — grep count zero.
  5,135 MAP exhibit IDs fold into 2,673 cards and none were visible. That was
  exactly Sam's "list all the different aligned exhibits under the common title".
- **4 more titles exist ONLY as unclassified cards** while the CER knows the
  credential. A curation input, not fixed in code.

**Three views → two sub-tabs, and the third was never a view.** The Student view
used the *same* `(unified_title, issuer)` grouping as the Credential view under a
different framing; its one unique asset was the near-me classification, which is
precisely the "who could adopt" answer Sam asked for in goal 4. So it became a
**mode** of the Credentials view rather than a third place to look. Sub-tabs also
fixed a real cost: all three `<details>` sections re-rendered on **every
keystroke** over 2,673 cards regardless of what was open.

**The export layer was outside the loop I had just built.** Found by re-reading
the work against Sam's stated goal rather than against my own diff. #1221 made
the filter and the could-adopt *column* share one scope; Excel, JSON and the Word
report still read `e.potential_names` directly. So whichever scope was on screen,
the file that left the tab carried the full 41-college overlap — **and that is the
layer that reaches a college by email.** A spreadsheet outlives the screen that
produced it.

**The accessibility pass found more defects in day-old work than in inherited
code.** Four of the five were mine, shipped hours earlier:

1. **A partial ARIA tab pattern** — `role="tablist"`/`role="tab"` with no
   `aria-selected`, no `aria-controls`, no `tabpanel`, no arrow keys. It
   *announces* an interaction contract and then does not honour it.
2. **The scope control exposed no selected state at all** — three styled
   `<button>`s. Replaced with **native radios in a `<fieldset>`**: arrow keys,
   "2 of 3, selected" and the focus ring come free, and a hand-rolled radiogroup
   is exactly the thing to get subtly wrong a second time.
3. **Colour-only meaning (WCAG 1.4.1)** — likely-match vs broad-lead separated by
   an *outline colour*. Now two text-labelled groups; the label carries the
   distinction, styling only reinforces it.
4. **`collegeChip` hid the full college name in a `title` on a `<span>`** —
   inconsistently announced, and unreachable on touch. Now `<abbr title>`.

Plus one pre-existing: **"+N more" had never worked.** The handler wrote
`state.expanded[eid + "_pot"]`; the renderer read `state.expanded[eid]`. Clicking
re-rendered identically. It was also a mouse-only `<span>`.

**Mobile: the tab shipped with no responsive rules of its own.** The one thing
that genuinely broke is `.sw-filter-dropdown` — `position:absolute`,
`min-width:220px`, anchored to a ~90px button, so near a phone's right edge it
opened off-screen. Dropdowns now anchor to the filter *bar*.

**The harness trap bit a third time, and `val()` was not enough.** Handoff 161
explicitly warned that the "check that never registers" trap would recur and
prescribed `val()`. It recurred anyway: the first pre-fix run of
`eacr_a11y.test.js` printed **zero checks**, because `val()` guards check
*expressions* while the failure was in an imperative *driver* —
`more().dispatchEvent(...)` where `more()` was null on the pre-fix source. **A
missing element must fail its own check, never take the file down.** Drivers are
now null-safe and `run()` is wrapped so a throw reports as a failed check.

**The one red file on main was not mine.** `team_phrase_sites.test.js` had been
failing since 2026-08-15 — the only red file in 224. It asserted
`/PHRASES = \[[\s\S]{0,900}id: "fin"/`, and Sky160's `raci`→`team` rename added a
~600-char comment *inside* the array, pushing `id: "fin"` to **1,458 chars** from
the anchor. **The property was never violated.** A fixed character window
measures how much *prose* sits above a thing — and it punished precisely the
commit that documented its own reasoning well. This is the rule `cpl_memory`
recorded on **2026-08-14** (`a-test-bound-rots-when-the-code-legitimately-changes`);
the row existed, the check predated it, nobody re-swept.

### (b) Current state

Four PRs merged, Pages deployed, **all 224 test files pass** — main fully green
for the first time since 2026-08-15.

| PR | What |
|---|---|
| **#1221** | Three college scopes, CER fold, aligned exhibits, two sub-tabs |
| **#1222** | Exports re-keyed to the active scope |
| **#1223** | Accessibility + mobile |
| **#1224** | The stale test bound on main (sibling branch, unrelated) |

`tests/eacr_scope.test.js` 49 checks · `tests/eacr_a11y.test.js` 44 checks (40
reproduce against the pre-fix source).

### (c) Strategic roadmap

The tab now answers Sam's goal 4 in one place: a common-reference card carrying
its aligned MAP exhibits, its credit recommendations, its adopters, and — scoped
— who could adopt with the local course named.

Parked / open, in value order:

1. **The 4 unclassified-only titles the CER knows** — a curation fix in
   `kb/unified_titles.json`, not code. Folding them removes 4 orphan cards.
2. **The 2 statewide cards matching no college at all** (zero adopters, zero
   potential, no credit recs) — likely empty records worth a data question.
3. **A sweep for other `{0,N}` character-window test bounds**, which #1224 shows
   rot silently and go red on the wrong commit.
4. **The credential view caps at 50 groups** with a "narrow with filters" note.
   Fine for curation, a real limit for browsing "all the exhibits".

### (d) Next concrete step

Sam uses the tab with the new default and says whether **Adopted** is the right
thing to open on — it is a visible behaviour change, and anyone used to the old
counts will see far fewer rows. Everything else here is downstream of that.

---

## 2026-08-17 (Sky163) — the matrix, and the number that could not be published

Sam, opening: *"I like how the EACR is arranged now and want to add a new subtab
view"* — a screenshot of an Excel pivot (COCI course titles down the side,
college names rotated across the top, counts in the cells). His goal: *"see at a
system or regional or district level all the possibilities for adoption"*, with
drill-down on the unit totals. Then, mid-run, three additions:

> *"show the possible adopted CR units for each college that has not yet
> adopted—maybe in a brown font and for those that have already adopted units in
> green font."*
> *"OK to use short names for colleges…"*
> *"CAlbright, etc. should only be in once and CAMAP can be left out
> altogether—it's our sandbox."*

His opening line also **closes Sky162's one carried item** — he has used the tab
and likes the arrangement, so the "confirm Adopted is the right default" question
is answered.

### (a) What was learned

**The obvious brown number would have been a promise we cannot keep.** This is
the finding of the run. Brown = *"units still available"* looks like a
subtraction against the credential's own recommendation lines. Measured first:

| | |
|---|---:|
| adoptions that are **partial** | **83%** |
| lines a college typically claims | **3.07 of 9.26** |
| colleges ever reaching the line total | **0** |

AP Biology carries 12 lines / 36 units; the median adopter claims **4**, the best
in the state **12**. A brown `36.0` would have told a college it could obtain
~3× what the strongest college in California has ever obtained — **in a column
that leaves the tab as a CSV**. Brown is now `peer_units_median`. Durable note:
[`methodology-an-opportunity-figure-must-be-what-peers-achieved`](kb-notes/methodology-an-opportunity-figure-must-be-what-peers-achieved.md).

It also surfaced a bigger opportunity than the one asked for: **among colleges
that HAVE adopted, ~2/3 of available lines are unclaimed.** The partial adopters
are more tractable than the non-adopters and no view had shown it.

**The natural units source was a lossy reconstruction.**
`chatbox_peer_articulations` covers **2,653 of 8,155** (title, college) adoption
pairs — **32.5%** — because it JOINS two half-sources, neither carrying both the
college and the recommendation (`kb/_build_peer_articulations.py` says so in its
own docstring). Shipping the matrix on it would have rendered **5,502 real
adoptions as blank opportunity cells** — a college told to go get credit it
already grants. The raw `View_ArticulatedMAPExhibits` row carries **Articulation
College + Course + Credit Recommendation together**; the generator was collapsing
that attribution. `adopter_units` is now a straight re-emission at 100% coverage,
no Supabase dependency, no sign-in. Units parse from the rec text at **100%**.

**Not `map_college_cr_unit`** — reviewer/team-gated, no k-anonymity of its own,
and it measures student *disposition* rather than the articulation catalogue.

**The sketch was arithmetically impossible, and saying so with a number was the
deliverable.** A legible 2–3 digit cell needs ~26px; 122 of them plus a title
column is ~3,500px, roughly 2× a desktop. Even a 12px dot overflows; only 9px
fits, and 9px cannot render "3.0". Reported as measurement, not opinion.

**Sam's sandbox ruling fixed a live public number.** `CA MAP INITIATIVE COLLEGE`
(`entity_kind='test'`) was counted as a real adopter on the statewide card
**California Real Estate Broker License** — **7 adopters published where the
truth is 6**. Keyed on `entity_kind` rather than the name, because the field
already tags **8** test orgs; measured that the other seven are not leaking.
Third instance in this workstream of *the right classifier existed and the
consumer never asked*.

**The fold is a SUM even though nothing is at stake.** All six twin spellings
(Calbright / North Orange CE / San Diego CE, each `X` and `X Credit`) carry
**zero** adoptions. A fold that DROPS is silently wrong the first day one of them
articulates something, and that day will not announce itself.

**The short-name gap was already solved in the repo.** 19 of 122 payload
spellings had no `college_short_names.js` entry — Mt. San Antonio, MiraCosta,
City College of San Francisco, Southwestern, every "College of the …". SkyLink's
committed crosswalk (`kb/college_identity/2026-08-12/crosswalk.json`) resolved
**15**, taking fallbacks to **zero** (longest header 18 chars). Fourth session
running where the best catch was a thing already committed and unwired.

**A pre-existing JS defect, superseded rather than fixed.** `TEST_ORGS` in
`statewide_interactive.js` lists truncated names (`"CabTest"` vs the real
`"CabTest College"`) and matches with exact `indexOf`, so it only ever caught 3
of 8. The build-time fix supersedes it; left in place as belt-and-braces.

### (b) Current state

**#1226 merged** — generator only, per the artifact policy; `daily-dashboard.yml`
dispatched to republish `statewide_data.js`.

New payload fields per card: `adopter_units` · `adopter_lines` ·
`peer_units_median` · `peer_units_max` · `rec_units_total`.
New reference: `kb/reference/map_college_roster_rules.json`.
`tests/eacr_matrix_payload_test.py` — **40 checks, 31 fail against the pre-fix
source** (verified by stashing the diff, not assumed).

**Column axis = 118 = 115 credit + 3 noncredit.** 115 credit is Sam's number
exactly. He expects **4** noncredit; **Mt. SAC Noncredit has no separate identity**
in `map_colleges` or the exhibits export, so it cannot be a column until MAP
carries it — Learning Partners item 1 surfacing as a blocker here.

**Sam's four design rulings, all locked:**

| | Ruling |
|---|---|
| brown number | **peer benchmark** (not the line total) |
| column grain | **open on colleges** (overrode the region-first recommendation) |
| default rows | **≥2 adopters** (434 rows) |
| brown coverage | **credible cells only** — the M-ID *likely* tier, not every non-adopter |

Default view measures **434 × 118 = 51,212 cells, 17.0% inked** (12.3% green /
4.7% brown), **59% of rows carrying an opportunity** — legible, unlike the full
2,345-row grid at 2.85%.

Mock (real data, interactive):
`https://claude.ai/code/artifact/8b1ca444-ec5b-48b1-a1be-4f993f275428`

### (c) Strategic roadmap

1. **Build `buildMatrixView()`** in `statewide_interactive.js` — the third
   sub-tab, against the republished payload.
2. The four curation items carried from Sky162 (4 unclassified-only titles; 2
   statewide cards matching no college; `{0,N}` test-bound sweep; the 50-group cap).
3. **Mt. SAC Noncredit** — a MAP data question, not a code one.

### (d) Next concrete step

Confirm the dispatched run published `adopter_units`, then write
`buildMatrixView()` + `tests/eacr_matrix.test.js`. The rendering logic is already
proven in the mock; the port is mechanical.

---

## 2026-08-17 — Session 165 (Sky165): the view, and the column that was there twice

### (a) What was learned

**The session before this one lost its work, and the recovery cost was nearly
zero — because the SPEC had been written down and the CODE had not.** Session
164 built this view and never pushed it: no branch, no PR, no stash, nothing on
disk. What survived was `docs/session_164_handoff.md`, the `_expected_axis`
tripwire in `map_college_roster_rules.json`, four `cpl_memory` rows carrying
Sam's rulings, and the published payload itself. That was enough to rebuild to
the same measured numbers — 434 × 118, 17.0% inked — in one sitting.

The lesson is not "push more often" (though: push more often). It is that **the
handoff discipline is what made a lost session survivable**, and the parts of it
that paid were the specific, checkable ones: a committed tripwire with expected
counts, rulings recorded as rulings, and figures stated with their measurement.
A handoff that had said "build the matrix view, the design is agreed" would have
lost the design.

**A fold at the label layer is not a fold.** The axis measured **119** where the
tripwire said **118**. The extra column was Cañada College entered twice —
`Cañada College` and `CaÃ±ada College`, the latter being the former read as
latin-1 and re-encoded. Both come out of `excel_to_dashboard.py`, on different
paths: the correct spelling into `potential_names` (634 cards), the mangled one
into `statewide_prescriptive.js` (26 college-pairs).

It had been invisible because **the only consumer resolving these names ran them
through `cplCollegeShort()`, whose `normalize()` folds `Ã±` → `n`**. So the
LABEL count read 118 over a 119-row axis: the number was right and the reason was
wrong. Nothing was measuring the axis itself. Had it shipped, the grid would have
carried two Cañada columns, one holding all 26 of its opportunities and the other
empty — which is indistinguishable, by looking, from a college that has no data.

Fixed in `kb/reference/map_college_roster_rules.json`, beside the sandbox rule
and the `" Credit"` twins, as a SUM. Durable version:
[`methodology-a-fold-at-the-label-layer-is-not-a-fold`](kb-notes/methodology-a-fold-at-the-label-layer-is-not-a-fold.md).

**The fold also moves a count Sam sees.** Four adopter spellings where one is the
sandbox and two are one institution is **two** adopters. Same shape as the
7-vs-6 on California Real Estate Broker License: an identity defect surfacing as
a credibility defect in a number a college reads.

**The row grain is the unified TITLE, and `credentialKey()` is the wrong tool.**
Sky163 measured 434 rows; grouping by `credentialKey()` (title + issuer, with a
blank issuer folded into a lone named one) gives **431**, because a title with
two *named* issuers stays split. Sam asked for CER titles down the side, and the
CER grain is the title — so two cards of one credential are one row and a
college's units sum across them. Reusing the neighbouring view's grouping would
have been the natural move and quietly wrong by three rows.

**The peer benchmark is recomputed per ROW, not read from the payload.**
`peer_units_median` is computed per CARD; a row may fold several. Recomputing
from the row's own adopter values keeps the brown number and the green numbers
beside it the same quantity. For a single-card title the two agree exactly, and
the test asserts that rather than trusting it.

**Two neighbouring tests were bounds, not guards.** `eacr_scope` asserted
"exactly two sub-tabs render" and `eacr_a11y` drove ArrowRight from `tabs()[1]`
expecting `tabs()[0]` — which is only *wrapping* when the bar has exactly two
tabs. Adding a third broke both while the roving-tabindex handler was correct
throughout (it wraps modulo the count). Rescoped to the property: sub-tabs by
NAME, and wrap driven from the LAST tab. The a11y file gained a check on the way
(ArrowLeft backwards-wrap, which nothing covered). This is the third instance in
this workstream of the `a-test-bound-rots-when-the-code-legitimately-changes`
class — it is worth assuming any count-shaped assertion is one.

### (b) Current state

**#1229** — `buildMatrixView()` in `statewide_interactive.js`, a third sub-tab
beside Credentials and Adoption table, plus the roster-rules fold.

Measured by rendering the **live payload** through jsdom, not predicted:

| | |
|---|---:|
| credentials (rows, default) | **434** |
| colleges (columns) | **118** |
| cells | 51,212 |
| green (adopted) | 6,301 · 12.3% |
| brown (still available) | 2,411 · 4.7% |
| inked | **17.0%** |
| rows carrying an opportunity | 258 · **59%** |
| render | 1.59s, only on tab selection |
| distinct header labels | 118, zero blank, zero duplicate |

`tests/eacr_matrix.test.js` — **62 checks, 49 failing against the pre-fix file**
(verified by stashing the diff). Drivers wrapped as well as assertions, per the
`val()`-guards-the-check lesson.

Sam's four rulings all hold and are each carried by a check. Brown is the peer
median; a check asserts no brown cell can display `rec_units_total`.

### (c) Strategic roadmap

1. **A matrix CSV export.** The design explicitly anticipates this number
   leaving as a spreadsheet — that is *why* brown is a benchmark rather than the
   line total. The standing rule is that a filter, its column and its exports
   share one scope, so the export must carry the same peer-benchmark semantics
   and the same 118-column axis.
2. **Fix the mojibake at source** in `_build_statewide_prescriptive()`. The fold
   is a safety net; a generator emitting two encodings of one name is a defect.
3. The four Sky162 curation items, still open.
4. **Mt. SAC Noncredit** — the axis is 115 credit + 3 noncredit where Sam expects
   4. A MAP data question (Learning Partners item 1), not a code one.

### (d) Next concrete step

Sam looks at the grid on the deployed site and says whether the density reads.
Then the CSV export, which is the half that reaches colleges.

### (e) Addendum — Session 164 left three memory rows, and one is unshipped work

Found *after* the build, by querying `cpl_memory` for the checkpoint rather than
before it. **Session 164's code died but its `cpl_memory` writes survived**, and
they were substantive. This is the Rule 8 lesson landing on the session that was
already writing about it: the table was queried at the start of this run with
tags `eacr`/`matrix`/`adoption`, and these three rows carry `event_date = null`,
so they sorted last and were not read. **Filter on `author` and `created_at` too
when picking up directly after another session.**

| Sky164 row | What Sky165 did |
|---|---|
| `prescriptive-layer-never-got-the-roster-rules` | **Corroborated → `verified`.** It found the same three mismatched spellings, including the mojibake, one hour before this session rediscovered them independently. It did not have the reason nobody had noticed (the resolver hid it), which is what the new KB note adds. |
| `re-measure-an-inherited-blocker-against-what-shipped` | **Corroborated → `verified`.** It caught that handoff 164's own "19 of 122 spellings need the identity crosswalk" was stale — `college_short_names.js` alone now resolves all of them. Sky165 measured 0 unresolved independently and did not wire the crosswalk in. |
| `partial-adopters-are-the-larger-cpl-opportunity` | **Re-measured, NOT shipped, escalated to Sam.** |

**On the two competing fixes.** Sky164 proposed canonicalising the join through
`cplCollegeShort(name,'full')`; this session folded in the roster rules instead.
Both work today. The explicit fold keeps each identity decision listed and
reviewable rather than making it a side effect of a display function, and the
Python generator inherits it — but it cannot catch a *new* duplicate without a
new entry, which is exactly what Sky164's approach would have handled
automatically. **The resolution is that the two are complementary:** the explicit
fold plus the `no two columns share a label` collision check gives both the audit
trail and the automatic detection. That check is in the shipped test.

**The partial-adopter finding is the one to act on.** Every EACR framing to date
asks *"who has not adopted this"*, which hides partial adopters completely — and
they are the more tractable half, because the articulation relationship, the
faculty contact and the credential review already exist. Re-measured here:

| | |
|---|---:|
| green cells below their row's peer median | **349** (Sky164 said 337) |
| credentials affected | **172** of 434 |
| units between those colleges and their peers | **~1,106** |

349 vs 337 is definitional (row-recomputed median vs the payload's per-card
`peer_units_median`; strict vs non-strict), not a contradiction — **restate the
measure when quoting it.** Deliberately not shipped: it puts a second number
inside green cells, changing the density and semantics of the view Sam approved
from a mock, and he has not seen this variant. Sky164 also supplied the argument
that makes it defensible — **the two browns are justified differently**: a
non-adopter's is gated on the M-ID *likely* tier (Sam's ruling 4), an adopter's
needs no gate because that college is already in the peer cohort.

### (f) Addendum 2 — Sam supplied Session 164's patch, and it was better

After #1229 merged, Sam produced a patch file of Session 164's lost work. It was
better than what had just shipped, and the harvest is **#1230**.

**What it had that #1229 did not:** `exportMatrixCSV()`; a shared `matrixCell()`
called by *both* the grid and the CSV; the partial-adopter gap on green cells;
row thresholds 1/2/5/10; a Both/Adopted-only/Opportunity-only cell filter;
column narrowing under a college-shaped filter; an exhibit-record drill-down;
and a published density line.

⭐ **The `matrixCell()` sharing is the part worth stealing as a habit.** Sky162's
lesson — *a filter, the column that justifies it, and the exports must derive
from one scope* — was carried in #1229 as a **discipline** and a note in the
handoff. Session 164 made it **structural**: one function returns what a cell
says, and the CSV cannot drift from the screen because there is nothing to drift
from. A rule enforced by architecture outlives a rule enforced by remembering.

⚠️ **A CORRECTION THAT RUNS AGAINST THIS SESSION.** Sky165 measured the
partial-adopter population at **349** and recorded that Sky164's **337** "needed
restating". Against the rule that actually shipped it is **337 exactly**. 349
counted every green cell below its row median; the shipped rule ignores a gap
under **0.5 units**, which is right — a 0.2-unit gap is not an opportunity.
**Sky164 was right and the correction runs the other way.** The `cpl_memory` row
has been rewritten and both rows promoted to `verified`.

The lesson is narrow and worth keeping: *re-measuring a predecessor's number is
right, but a disagreement is not automatically theirs.* The first question is
whether the two measures are the same measure. Here they were not, and the
predecessor's was the better-chosen one.

**What did NOT come across, deliberately.** Session 164 keyed identity through
`cplCollegeShort(name,'full')` alone. #1229's roster-rules fold stays and now
runs FIRST, inside `mxName()`. Its approach absorbs a duplicate nobody has
listed; the explicit list keeps an audit trail and is read by the Python
generator. Neither is sufficient alone — the resolver is what hid the Cañada
duplicate for a day — so both run, plus the collision check.

**On adopting its test wholesale:** Session 164's 76-check harness passed
**76/76 on first run** against the adaptation. That is the strongest evidence the
port was faithful, and much stronger than a harness written by the same session
that wrote the code. 7 roster-layer checks were added (it had none); 83 total,
49 failing against `main`.

⚠️ **Minor regression to note:** the Cañada column's display name now reads
`Canada College` without the tilde, because that is the `canonical` field in the
curator-provided `college_short_names.js`. One column, all cells land — but the
tilde is worth restoring in that file.


## 2026-08-19 — history retired from the §11 roadmap cell (Sky169 checkpoint)

Moved verbatim out of `CLAUDE.md` §11 under Rule 8 step 0a: a roadmap cell states
CURRENT truth, and the cell had reached 5,629 chars. Nothing here is superseded —
it is settled history that no longer needs to load on every session.

**CSV export + partial-adopter gap (#1230)** — harvested from **Session 164's lost
patch, which Sam supplied after #1229 merged and which was BETTER than what had
shipped**. A partial adopter now shows BOTH what it has and the gap to its peers
(**337 cells**; Sam approved 2026-08-17): a non-adopter needs the M-ID gate, an
adopter needs none because it is already in the peer cohort. Also shipped: row
thresholds 1/2/5/10, a Both/Adopted-only/Opportunity-only filter, an exhibit
drill-down, and published density.

**⚠️ A correction against Sky165.** It measured 349 partial adopters and said
Sky164's 337 needed restating; against the shipped rule (gaps under 0.5 units
ignored) it is **337 exactly** — **Sky164 was right**. *Re-measuring a
predecessor's number is right, but a disagreement is not automatically theirs —
first ask whether the two are the same measure.*

**⭐ One college was two columns — a fold at the LABEL layer is not a fold.**
`CaÃ±ada College` is `Cañada College` read as latin-1, and `excel_to_dashboard.py`
emits BOTH (correct → `potential_names`, mangled → `statewide_prescriptive.js`, 26
pairs). The axis was **119** — invisible because every consumer counted these names
*through* `cplCollegeShort()`, whose `normalize()` folds `Ã±`→`n`, so the label
count was right for the wrong reason. It would have rendered two Cañada columns,
one holding all 26 opportunities and the other **empty — indistinguishable by eye
from a college with no data**. The fold also moves a count Sam sees: four adopter
spellings, one sandbox and two one institution, is **two** adopters. Session 164's
identity approach (key through `cplCollegeShort` alone) was NOT taken; the roster
fold runs FIRST inside `mxName()`, both layers plus the collision check. The
upstream encoding defect is **still unfixed at source**.

**⚠️ `chatbox_peer_articulations` is the WRONG units source** (32.5% coverage — a
join of two half-sources). The raw `View_ArticulatedMAPExhibits` row carries
college + course + rec together, so `adopter_units` is a straight read at 100%.
NOT `map_college_cr_unit` (reviewer-gated, no k-anonymity, measures student
disposition).

**⚠️ 118 numeric columns cannot fit** (~3,500px, ~2× a desktop) — the frozen title
column + rotated short-caps headers + h-scroll are load-bearing, not a preference.

**Row grain is the unified TITLE, not `credentialKey()`** (which gives 431 — it
splits titles carrying two *named* issuers); the peer benchmark is recomputed per
ROW, since `peer_units_median` is per CARD and a row may fold several.
