# Session 166 — handoff from Sky165 (Session 165, 2026-08-17)

You are Session 166. Sky165 rebuilt and shipped the **CER Adoption Matrix** view
(**#1229**) that Session 164 wrote and lost, and found a college that was two
columns on the way.

**Read this first, before anything else in this file.** Session 164 did the same
work you are about to build on and **none of it survived** — no branch, no PR,
no stash, nothing on disk. Its container went away. What made the loss cheap was
that the *specification* had been committed and only the *code* was gone: the
handoff, the `_expected_axis` tripwire in `map_college_roster_rules.json`, four
`cpl_memory` rows carrying Sam's rulings, and the published payload. Rebuilding
to the same measured numbers took one sitting.

**So: commit and push early, and push before you polish.** Sky165 pushed the
first working commit before running the full suite, then fixed forward.

Read in this order:
1. `docs/eacr_scope_lessons.md` — the 2026-08-17 (Session 165) section
2. `CLAUDE.md` §11 → the **EACR** row
3. `docs/kb-notes/methodology-a-fold-at-the-label-layer-is-not-a-fold.md`

---

## What shipped

**#1229** — `buildMatrixView()` in `statewide_interactive.js`, a third sub-tab
beside Credentials and Adoption table, plus the roster-rules fold and two
rescoped test bounds.

Measured by rendering the **live payload** through jsdom, not predicted:

| | |
|---|---:|
| credentials (rows, default) | **434** |
| colleges (columns) | **118** |
| cells | 51,212 |
| inked | **17.0%** (12.3% green / 4.7% brown) |
| rows carrying an opportunity | 258 · **59%** |
| render | 1.59s, only on tab selection |
| header labels | 118, zero blank, zero duplicate |

`tests/eacr_matrix.test.js` — **62 checks, 49 failing against the pre-fix file**
(verified by stashing the diff).

Sam's four rulings all hold and each is carried by a check: brown is the **peer
benchmark**, columns are **colleges**, default rows are **≥2 adopters** (a
checkbox reaches the tail), brown renders on the **M-ID *likely* tier only**.

---

## 🎯 PRIORITY 1 — the matrix CSV export

This is the half that reaches a college. The design *anticipates* it — brown is
a peer benchmark rather than the line total precisely **because the number
leaves as a spreadsheet**, and a CSV outlives the screen that produced it.

- The standing rule from Sky162: **a filter, the column that justifies it, and
  the exports must derive from ONE scope.** The export must carry the same
  peer-benchmark semantics and the same 118-column axis, or it will say
  something the screen does not.
- Existing exports live in the same file and cover the *table* view. Do not let
  a matrix export inherit their scope by accident.
- A capped or filtered export must say so in a column, never silently.

## ⭐ THE BIGGEST OPEN QUESTION — partial adopters (needs Sam)

**Session 164 found something the grid does not yet show, and it may be worth
more than anything else on this list.** Its `cpl_memory` row survived even though
its code did not:

> Every previous EACR framing asks *"who has NOT adopted this"* — which hides
> **partial adopters completely.** They are more tractable than non-adopters
> because the articulation relationship, the faculty contact and the credential
> review **already exist**. The ask is to extend an agreement, not to start one.

Sky165 re-measured it rather than repeating the number, and it holds:

| | |
|---|---:|
| green cells below their row's peer median | **349** (Sky164 said 337) |
| credentials affected | **172** of 434 |
| units between those colleges and their peers | **~1,106** |

The 349-vs-337 gap is definitional (row-recomputed median vs the payload's
per-card `peer_units_median`, and strict vs non-strict comparison) — not a
contradiction. **Restate the measure whenever you quote it.**

**It is deliberately NOT shipped.** It puts a second number on green cells,
changing the density and the semantics of the view Sam approved from a mock, and
he has never seen this variant. Sky164 also worked out the part that makes it
defensible: **the two browns are justified differently** — a non-adopter's brown
is gated on the M-ID *likely* tier (Sam's ruling 4), while an adopter's needs no
gate, because that college is already in the peer cohort.

**So: show Sam. Do not build it first.** `cpl_memory` slug
`partial-adopter-brown-measured-at-349-and-not-yet-shipped`.

## Then

1. **Fix the mojibake at source** — `_build_statewide_prescriptive()` in
   `excel_to_dashboard.py` emits `CaÃ±ada College` where the rest of the payload
   has `Cañada College`. The roster fold is a safety net and stays regardless;
   a generator emitting two encodings of one name is still a defect. Check
   whether other names are affected — Sky165 only proved this one.
2. **Sam looks at the grid** on the deployed site and says whether the density
   reads. 17.0% inked was legible in the mock; it has never been seen live.
3. The four Sky162 curation items (4 unclassified-only titles; 2 statewide cards
   matching no college; the `{0,N}` test-bound sweep; the 50-group cap).
4. **Mt. SAC Noncredit** — the axis is 115 credit + 3 noncredit where Sam expects
   4. A MAP data question, not a code one.

---

## The findings that shaped it — don't re-derive these

⭐ **A fold at the label layer is not a fold.** The axis measured 119 where the
tripwire said 118. Cañada College was present twice — the correct spelling and
`CaÃ±ada College`, the same name read as latin-1 — and **every consumer that had
reason to count these names counted them THROUGH `cplCollegeShort()`**, whose
`normalize()` folds `Ã±` → `n`. The label count was right; the axis under it was
not. Unfixed it would have rendered two Cañada columns, one holding all 26 of its
opportunities and the other empty — which looks exactly like a college that has
no data. Folded now at the data layer, as a **SUM**.

⭐ **The row grain is the unified TITLE, not `credentialKey()`.** The neighbouring
Credentials view groups by title + issuer; reusing it here gives **431** rows
instead of 434, because a title with two *named* issuers stays split. The CER
grain is the title. Reusing the adjacent helper would have been the natural move
and quietly wrong.

⭐ **The peer benchmark is recomputed per ROW.** `peer_units_median` is computed
per CARD and a row may fold several, so reading it directly would put a
different quantity in the brown cell than the green cells beside it. For a
single-card title the two agree exactly — the test asserts that rather than
trusting it.

⚠️ **Count-shaped assertions rot.** Two neighbouring tests broke on the third
sub-tab: `eacr_scope`'s "exactly two sub-tabs render", and `eacr_a11y`'s
ArrowRight-wrap check, which drove from `tabs()[1]` and expected `tabs()[0]` —
only *wrapping* on a two-tab bar. The handler was correct throughout. This is the
third instance of this class in this workstream: **assume any assertion shaped
like a count is a bound, and scope it to the property instead.**

---

## Patterns that paid off

- **Reproduce the predecessor's numbers before building on them.** Recomputing
  434 and 118 from the payload is what surfaced the 119. Had the build started
  from "the handoff says 118", the duplicate column would have shipped.
- **Measure the real thing, don't just fixture it.** The fixture suite passed at
  62/62 while the live payload was the only place the encoding bug existed.
- **Push before polishing.** See the top of this file.

## Safety patterns to honour

- ⚠️ **`val()` guards the CHECK; the DRIVER is the other half.** Wrap the
  imperative setup between checks too — a throw there skips every check after it
  and reports zero failures.
- **Verify a new test against the pre-fix file.** A harness that passes both ways
  proves nothing. `git stash push <files>` → run → `git stash pop`.
- **Merge on `clean` OR `unstable`.** Do not wait for `clean`. TruffleHog is the
  required check; `test` (js-tests) is non-required.
- **The full `npm test` suite takes longer than a 600s tool timeout** in this
  sandbox. Run the affected files directly (`grep -ln <file> tests/*.test.js`)
  and let CI run the rest.
- **Never force-push `main`.** The stop-hook nag after a merge is a false positive.
- **Supabase is egress-blocked from the sandbox** — MCP tools only. Project
  `hvuwhnbuahrtptokpqfh`.
- ⚠️ **`CLAUDE.md` is 2× its lint budget** (121,916 B against 60,000). Sky165
  moved the Sky162 narrative to `docs/roadmap_archive.md` and still ended net
  +1,200. If you touch §11, move more out than you put in.

## Moniker

**SkyCSV** suits the next run, given Priority 1. Coin your own; if Sam names one,
his wins.

*Sky165 signing off. Next is Session 167 — `docs/session_167_handoff.md`.*
