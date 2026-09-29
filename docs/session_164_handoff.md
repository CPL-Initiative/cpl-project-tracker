---
superseded: true
superseded_by: session_166_handoff.md
---

# Session 164 — handoff from Sky163 (Session 163, 2026-08-17)

You are Session 164. Sky163 scoped the **CER Adoption Matrix** sub-tab with Sam,
shipped the generator half (**#1226**), and left the view itself unbuilt —
deliberately, because it depends on a payload the cron had not yet published.

**Your first task is well-specified and mostly mechanical. All four design
decisions are Sam's and already made.**

Read in this order:
1. `docs/eacr_scope_lessons.md` — the 2026-08-17 section, written this run
2. `CLAUDE.md` §11 → the **EACR** row (the matrix paragraph)
3. `docs/kb-notes/methodology-an-opportunity-figure-must-be-what-peers-achieved.md`
4. The mock, which Sam approved ("looks fantastic") —
   `https://claude.ai/code/artifact/8b1ca444-ec5b-48b1-a1be-4f993f275428`

---

## Sam's rulings — these are INPUTS, not suggestions

| | Ruling |
|---|---|
| **brown number** | **peer benchmark** — what adopting colleges actually got |
| **column grain** | **open on colleges** (he overrode the region-first recommendation) |
| **default rows** | **≥2 adopters** — 434 rows |
| **brown coverage** | **credible cells only** — the M-ID *likely* tier, NOT every non-adopter |

Plus, earlier in the run:
- **"CAlbright, etc. should only be in once and CAMAP can be left out
  altogether—it's our sandbox."** → shipped in #1226.
- **"OK to use short names for colleges…"** → rotated ALL-CAPS headers.
- **Green = adopted, brown = still available.** Parentheses on the brown numbers
  as well as color — WCAG 1.4.1, and the standing a11y expectation from 08-16.

His opening line — *"I like how the EACR is arranged now"* — **closes Sky162's
carried question** about the `Adopted` default. Don't re-ask it.

---

## What shipped

**#1226** — generator only (artifact policy; `daily-dashboard.yml` dispatched).

New per-card payload fields: `adopter_units` · `adopter_lines` ·
`peer_units_median` · `peer_units_max` · `rec_units_total`.
New reference file: `kb/reference/map_college_roster_rules.json`.

`tests/eacr_matrix_payload_test.py` — **40 checks, 31 fail pre-fix** (verified by
stashing the diff; a harness that passes both ways proves nothing).

✅ **The payload is LIVE and verified — you do not need to re-check it.**
The cron published on `4ac7e52` and the result was confirmed against the served
`statewide_data.js`, not predicted:

| | |
|---|---|
| cards carrying `adopter_units` | **2,607** of 2,673 |
| California Real Estate Broker License | **6 adopters** (was 7 — sandbox gone) |
| distinct college names | **118** — exactly 115 credit + 3 noncredit |
| the three `" Credit"` twins | folded, all absent |

`peer_units_median`, `peer_units_max` and `rec_units_total` are present per card.
**Build straight against it.**

---

## 🎯 PRIORITY 1 — build `buildMatrixView()`

In `statewide_interactive.js`. A third sub-tab beside Credentials / Adoption table.
The rendering logic is already proven in the mock; the port is mechanical.

- Sub-tabs are rendered **from JS** (~line 835), so **no HTML edit and no Rule-4
  mirror** — inject CSS from the tab's JS per the house pattern.
- `presByTitle` (~line 182) already indexes the M-ID *likely* layer by
  title → college → courses. That is your brown-cell gate.
- `renderRows()` (~line 1030) dispatches the visible view; only the active view
  renders (all three used to rebuild on every keystroke over 2,673 cards).
- Frozen title column + rotated short-caps headers + horizontal scroll. Short
  names must go through **both** `college_short_names.js` **and** the crosswalk at
  `kb/college_identity/2026-08-12/crosswalk.json` — 19 of 122 spellings have no
  entry in the first file and the crosswalk resolves 15 of them.
- Commit `tests/eacr_matrix.test.js` and **verify it against the pre-fix file**.

---

## The three findings that shaped it — don't re-derive these

⭐ **Brown cannot be the line total.** 83% of adoptions are partial (median
**3.07 of 9.26** lines) and **no college has ever reached the total** — AP Biology
is 36 units where the median adopter gets 4 and the best gets 12. The line total
would promise ~3× the strongest peer **in a column that leaves as a CSV**.

⭐ **`chatbox_peer_articulations` is the WRONG units source** — 32.5% coverage,
because it JOINS two half-sources. The raw `View_ArticulatedMAPExhibits` row
carries college + course + rec **on one line**. Not `map_college_cr_unit` either
(reviewer-gated, no k-anonymity, measures student disposition).

⭐ **118 numeric columns cannot fit** — ~3,500px, ~2× a desktop. Horizontal
scroll with sticky panes is correct here and Sam accepted it.

---

## Carryover

- **Mt. SAC Noncredit has no identity** in `map_colleges` or the export, so the
  axis is 115 credit + **3** noncredit where Sam expects 4. A MAP data question.
- Sky162's four curation items are still open (4 unclassified-only titles; 2
  statewide cards matching no college; the `{0,N}` test-bound sweep; the 50-group
  credential-view cap).
- `TEST_ORGS` in `statewide_interactive.js` lists truncated names and matches
  exactly, so it only ever caught 3 of 8. Superseded by the build-time fix; left
  as belt-and-braces.

## Patterns that paid off

- **Measure before recommending.** The 83%-partial figure is what turned "brown =
  remaining units" into a design that can survive an export.
- **Check whether the repo already answered it.** The short-name gap was solved by
  a committed crosswalk nobody had wired. Fourth session running.
- **Say "impossible" with a number.** The 3,500px calculation was more useful than
  any amount of hedging about density.

## Safety patterns to honour

- ⚠️ **`val()` guards the CHECK; the DRIVER is the other half.** Null-guard every
  driver and wrap `run()` so a throw reports as a failed check.
- **Merge on `clean` OR `unstable`.** Do not wait for `clean`.
- **Never force-push `main`.** The stop-hook nag after a merge is a false positive.
- **Supabase is egress-blocked from the sandbox** — MCP tools only. Project
  `hvuwhnbuahrtptokpqfh`.
- **`CLAUDE.md` is 2× its lint budget.** Trim your additions; move a narrative out.

## Moniker

**SkyGrid** suits the next run. Coin your own; if Sam names one, his wins.

*Sky163 signing off. Next is Session 165 — `docs/session_165_handoff.md`.*
