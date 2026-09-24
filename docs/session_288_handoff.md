---
title: Session 288 handoff — Sam's ten EACR tweaks land, the matrix becomes a window, ASCCC areas go provisional
date: 2026-09-24
session: 287 (SkyMatrix)
tags: [handoff, eacr, adoption-matrix, cip, asccc, handout, performance]
status: current
---

# You are Session 288

Your moniker is **SkyLedger**. S287 (SkyMatrix) ran BESIDE S286 (SkyTally, the funding tab) on 2026-09-24 and
took Sam's ten tweaks to the Exhibit Adoption & Credit Recommendations view in one PR. S286's emergency
checkpoint (#1680) wrote [`session_287_handoff.md`](session_287_handoff.md) the same afternoon — a parallel
sibling, not a predecessor: read it for the funding lane and the tab review sheet, this one for the EACR.

## ⛔ READ FIRST — what is half-landed on purpose

The consumer half of the EACR change is live the moment the PR merges; the DATA half arrives with the first
`daily-dashboard.yml` run after it (`statewide_data.js` gains `cip_sector`, `top_codes`, `exhibit_records`,
`adopter_rec_idx` on every card and `cip_sectors` on the payload). Until that run the CIP Sectors filter shows the
complete list with every card in "No CIP assigned yet", the drill-down shows raw titles without units, and the
cell panel says the recommendation lines arrive with the next build. **Dispatch the workflow after the merge if
S287 did not** (`actions_run_trigger` on `daily-dashboard.yml`, main) and re-open the tab once it lands.

## ✅ WHAT SHIPPED (the EACR-tweaks PR)

All ten, verified in jsdom and in Chromium; the lane file has the per-item detail:
[`lanes/eacr-exhibit-cr-adoption`](reference/lanes/eacr-exhibit-cr-adoption.md).

- **Generator** (`excel_to_dashboard.py`): `_load_cip_families()` + `_cip_sector_for_tops()` — MAP TOP id → CCC
  4-digit TOP → CIP family (observed map first, the code's own `.00` entry before the fold, published crosswalk last);
  `exhibit_records`, `adopter_rec_idx`, `top_codes`, `cip_sector`, `cip_sectors`. `tests/eacr_matrix_payload_test.py`
  52/52 (its stale "3 fold pairs" expectation fixed to 4).
- **Consumer** (`statewide_interactive.js`): CIP Sectors and ASCCC Area filters, no scope or threshold chips,
  vertical 32px column headers, CIP-sector sections alphabetical within, the drill-down by title + units, the cell
  panel (`role=tooltip`, hover and focus, arrow keys, Escape stopped at the grid), Create Handout → My College with
  the one filtered college as its remembered choice, and **a windowed matrix** (25–40 rows in the DOM; first paint
  ~80 ms; wheel-scroll frames 33 ms median). The chunked version it replaced measured 18–23 s to land and 200–500 ms
  per scroll frame — the note:
  [`methodology-a-grid-past-a-few-hundred-thousand-cells-needs-a-window-not-chunks`](kb-notes/methodology-a-grid-past-a-few-hundred-thousand-cells-needs-a-window-not-chunks.md).
- **ASCCC Area** (`college_lookup.js` `ascccArea`, from `kb/reference/asccc_area_map.json` via
  `kb/_apply_asccc_areas.py`, `--check` in `scripts/check_generated.sh`): PROVISIONAL — 36 of 118 anchored to
  asccc.org text, 82 by the Areas' geographic descriptions. Sam had already ruled *add* on the sheet's ASCCC card
  (2026-09-22) and named MAP as the source; the card now asks him to say yes to Pedro's Custom Report (or paste the
  directory). `cpl_memory` row `asccc-areas-come-from-map-sam-2026-09-22`.
- **Tests**: `eacr_matrix` 114 · `eacr_a11y` 63 · `eacr_scope` 44 (LOWERED from 50: the six checks that drove the
  scope chips went with the chips) · `eacr_filters` 30 · `eacr_handout` 16 (new; pins the storage-key literal to
  `college_briefing.js`) · floors updated by hand. `npm run a11y cobi:exhibit-adoption` passes at 390 and 1440.
- **Docs**: the EACR lane rewritten to current truth; the partner-crosswalks lane's ASCCC line updated; the sheet
  source rebuilt (15 items — NOT republished; its store is keyed to the 21 cards Sam answered); the dependency map
  regenerated; three `cpl_memory` rows under receipt `kb/receipts/cpl_memory_2026-09-24_s287.sql`.

## SAM'S DECISIONS THIS RUN (2026-09-24)

His ten asks are in `cpl_memory` verbatim (`eacr-ten-tweaks-sam-2026-09-24`). Two readings were made as stated
assumptions rather than asked, because his screen showed the answer: **every credential with an adopting college is a
matrix row** (he had "1 adopter" selected when he removed the rows-threshold chips), and **the handout feature is My
College's Report plus its occupation opportunity register** (his "I believe that's the one that has it"). Both are one
constant away from a different reading if he says otherwise.

## THE NEXT CONCRETE STEP

1. **Dispatch `daily-dashboard.yml` after the merge** (see READ FIRST) and confirm the CIP Sectors dropdown fills.
2. **Sam looks at the grid in a browser**: the 52px rows, the two-line title clamp, the 0.62rem cell figures and the
   panel are his to judge; the Adoption table's own rows kept their opportunity-first order and can be sectioned too.
3. **The ASCCC roster**: when Pedro's export or the directory paste arrives, edit the JSON's per-college rows, run
   `python3 kb/_apply_asccc_areas.py`, and retire the provisional wording in both lanes and the sheet card.
4. **Carryover from S286's handoff, unchanged**: the ESL merging decision sheet; the (D) card's Designate retry; the
   funding tab's pre-existing a11y findings; `applyPriorityOrder()`; Pedro's one request; CO research's first
   career-attainment file.

## ⚠️ Watch for

- **Two sessions, one day.** S286 was live on the funding tab throughout; `kb/docs_audit/2026-09-24.*` was left to
  it (this session restored its own lint runs before committing). Its emergency checkpoint took number 287 first,
  so this handoff is 288 and the two are siblings; the docs auditor treats same-day handoffs that way too.
- **`table-layout: fixed` + the colgroup are load-bearing** for the phone's 180px title column and for the window's
  arithmetic; `.mx-table tr.mx-r{height:52px}` is what makes any row's offset computable.
- **The panel replaced the cell `title` attributes.** A test that looks for `td[title]` is looking at the old design.
- `CLAUDE.md` is still over its 60 KB budget (pre-existing); nothing was added to it this run.

## Read in order

This file · [`lanes/eacr-exhibit-cr-adoption`](reference/lanes/eacr-exhibit-cr-adoption.md) ·
[`lanes/partner-crosswalks`](reference/lanes/partner-crosswalks.md) (the ASCCC line) ·
[`decision_sheets`](reference/decision_sheets.md) · S286's handoff for the funding lane.

## Things that worked

- **Measuring before choosing.** Sticky headers and auto table layout were both suspects for the 22-second grid;
  removing each in Chromium changed nothing, which is what pointed at the DOM size and the window.
- **A real browser beside jsdom.** jsdom passed every geometry check while Chromium showed 656 cells overflowing by a
  pixel and a hover target parked under the sticky column; Playwright with the repo's own Chromium found both.
- **One SQL call for three statements** (insert, log, verify), the receipt guard-checked locally first.

## Safety patterns to honor

Rule 4 · Rule 5 · Rule 7 (CIP corroborates, never gates) · Rule 10 (fresh read, INSERT-only, receipt) · plain
words, no glyphs · verify with `npm run a11y`, not by claim · budget SQL in prompts · end the turn during a wait.

---

*Greetings, you are Sky**Ledger** (Session 288), see Sky**Matrix**'s handoff —
`docs/session_288_handoff.md` — let's keep rolling with our queue.
First, run `python3 scripts/check_hooks_live.py --fix` and paste its LIVE
line, no investigation.*
