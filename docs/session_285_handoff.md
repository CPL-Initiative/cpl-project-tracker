---
title: Session 285 handoff — Scenario 3's controls, a published scenario, and the base that read $149k
date: 2026-09-23
session: 284 (SkyWage)
tags: [handoff, implementation-funding, decision-sheets, supabase-grants]
status: current
---

# You are Session 285

Your moniker is **SkyGrant**. S284 (SkyWage) built the controls Sam asked for so Scenario 3 can match the statute's
four outcomes, found that a new scenario never reached the public page, and traced the "~$149k at base" report to a
label on the wrong figure. The work is [#1664](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1664),
a DRAFT under watch; this checkpoint was taken at the context warning line.

## ✅ WHAT SHIPPED (in #1664, not yet merged)

- **Add / Delete a priority** per scenario; Delete asks which priority takes the share (an award is W × Σshares);
  Restore; a totals-row warning whenever shares ≠ 100%.
- **One numbering**: the reported (D) card is "Priority N" with its own number picker and an editable title; the
  heading's number is the picker; the outcome line carries key + citation once.
- **Show on college rows** per card; **editable Measured-from wording**; **Metric wiring in plain words**.
- **Max award column** (combined figure, bound word, one qualifying line); **six-column drill-in**, one line per
  priority. Clovis now reads $150,000 at the base.
- **Published scenario** per project; explainer, college briefing and unchosen browsers read it; Publish on the strip.
- **Builder**: MAP's "… Credit" names fold onto NOCE and Calbright; Launch stays unmatched.
- **Sheet**: `docs/visuals/2026-09-23-funding-scenario-3.html` (4 items), builder
  `kb/_build_funding_scenario3_decision_sheet.py`; published at https://claude.ai/artifact/3Fe1kqZKhzeKCQvtKAaB8U (store `replies`, empty at publish).

## SAM'S WORDS THIS RUN

- ⭐ *"I want to put the 33% into Career Attainment"* — delete Completion with Transcription, its 33% to Career
  attainment (not Completion). Reverses his morning hold-at-0% ruling for Scenario 3. Measured: statewide Current
  Total $2,613,990 → $1,354,241 until the first EDD import. Sheet item 2 proposes holding Scenario 1 published.
- ⭐ NC question: *"the allocations for NC seem too low"* and his base/cap idea (*"Advise if I'm nuts"*). Answer:
  his idea IS the live model ($0.00 difference); NC gets parity; the combined cap trims Mt. SAC and Santa Ana. Item 3.
- ⭐ **Supabase notice (forwarded 2026-09-23), for ACTION:** from **2026-10-30** a NEW table in `public` gets no
  automatic Data API grant; existing tables keep theirs. Every migration that creates a table must carry
  `grant select … to anon; grant select, insert, update, delete … to authenticated, service_role;` as the table's
  RLS intends. ⚠️ Grant only what RLS already gates, and honor Rule 10 (b2).

## THE NEXT CONCRETE STEP

1. **Get #1664 green and merge it** (auto-merge doctrine: `test` must succeed on the head). 13 suites were
   re-aimed by header. **Ten more failed on the pre-fix run and still need re-aiming to the new layout** (Max award
   cell first in `td.cf-award`; six-column drill-in; number picker in the h4; outcome name in the picker):
   `one_pool`, `metric_pin`, `pool`, `outcome_cards`, `row_legibility`, `reorder`, `rollup`, `scenarios`,
   `statewide_expand`, `render` (all `tests/cpl_funding_*.test.js`). Run each with `node`, read its FAIL lines,
   re-aim by header or class, never by position. Then merge squash and dispatch `daily-dashboard.yml` so the
   builder's NOCE/Calbright fold reaches the note.
2. **Read the sheet's `replies` store before acting** (item 1: build the transcribed + Counselor measure — a new
   rung `tcr > 0 and accepted` in `funding/_build_funding_performance.py`, registry entry in `METRIC_SOURCES`).
3. **Supabase grants**: grep `kb/`, `funding/`, `raci/` etc. for `create table` in `public`; add explicit grants;
   write `tests/supabase_table_grants_test.py` beside `supabase_function_grants_test.py` and wire it in
   `js-tests.yml`.
4. Carryover from S284's handoff still open: the ESL merging decision sheet; the college briefing's funding box
   vocabulary (*earned*, *drawable*, *the dollars*); ask Sam to retry Designate on the (D) card.

## ⚠️ Watch for

- The standing open-asks sheet still must not be republished as it stands (store keyed to 21 cards, builder 15).
- The lessons doc sits at ~115 KB of a 120 KB budget; archive the oldest section before the next append.
- `CLAUDE.md` is 61.5 KB against 60 KB (pre-existing).

## Read in order

This file · [`lanes/implementation-funding`](reference/lanes/implementation-funding.md) ·
`docs/cpl_funding_lessons.md` § 2026-09-23 S284 · [`decision_sheets`](reference/decision_sheets.md) ·
[`methodology-label-a-bound-where-it-binds`](kb-notes/methodology-label-a-bound-where-it-binds.md).

## Things that worked

- **A local Chromium copy of the tab with every Supabase call intercepted**, signed in via a sessionStorage
  session: the whole delete-and-move flow ran against the live dials with nothing written.
- **Measuring Sam's proposal against the engine** before answering it: identical to the dollar settled it in one run.
- **Reading a test's cited ruling before rewriting the test**: R6/R7 turned a layout fix into sheet item 4.

## Safety patterns to honor

Rule 4 · Rule 5 · Rule 10 (fresh read, INSERT-only, receipt; the MCP guard blocks writes) · curator edits through
the tab, never SQL · house voice on outward prose · run long test batches in the background so Sam can interject.

---

*Greetings, you are Sky**Grant** (Session 285), see Sky**Wage**'s handoff —
`docs/session_285_handoff.md` — let's keep rolling with our queue.
First, run `python3 scripts/check_hooks_live.py --fix` and paste its LIVE
line, no investigation.*
