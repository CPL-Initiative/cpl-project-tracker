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
- **Sheet item 1, built** (after the verdicts arrived): `ptc`/`ptc_u`, transcribed CPL for students whose
  `Counselor_Verified` is checked, in the builder and the registry (rung `transcribed`, so (B), NC pairs `nc_pt_u`).
  The Metric wiring checks the Counselor step on its own axis, so P2's `p3_u` pin now reads as the gap it is.
  Today's feed carries the column (2,856 students, 25,037 applied units, 23 colleges): `ptc_u` fills on the first
  daily run after merge. Tests: builder part E (mutation-checked), counselor suite §7.
- **Focus rings**: the tab's seven `:focus { outline: none }` rules canceled COBI's own ring on 62 fields; removed.
  `npm run a11y` on the funding tab: no field lacks a ring, and the PR adds no finding. Four small targets and one
  prose line overflowing at 390px predate it (identical on `main`).
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

## SHEET VERDICTS (Sam, 2026-09-23 14:50Z, reviewed through item 3)

1. **build** the combined measure — *"We have the transcribed CPL in the dataset as well as the counselor step
   boolean indicator, so combining them should work"*. ✅ BUILT in #1664 (`ptc_u`); Sam picks "Transcribed CPL with
   the Counselor step checked" on P2's card after the first daily run.
2. **publish** — *"Set P3 to 33% and .5 and I think we'll calculate the CPL FTES for each student record that
   demonstrates a career attainment improvement based on CO analysis ported to you."* Career attainment 33%,
   factor 0.5, Scenario 3 published: curator edits through the tab once #1664 is live (never SQL). His method
   note reshapes the import: CPL FTES per student record with an improvement, from CO analysis.
3. **parity** — keep NC at its FTES share. 4. **Not reached** (after the mark): the Max award column stays as
   shipped, UNRULED.

## THE NEXT CONCRETE STEP

1. **Merge #1664 once `test` succeeds on its head** (auto-merge doctrine), squash, then dispatch
   `daily-dashboard.yml` so the builder emits `ptc_u` and the NOCE/Calbright fold. All 23 re-aimed suites pass
   locally, and the whole funding family ran locally beside CI.
2. **Sam's edits through the tab, in Scenario 3** (never SQL): P2's picker → "Transcribed CPL with the Counselor step
   checked"; Delete "Completion with Transcription" moving its 33% to Career attainment; Career attainment factor 0.5;
   Publish. His method note (CPL FTES per student record with a career improvement, from CO analysis) shapes the
   career import.
3. **Supabase grants before 2026-10-30** — [`lanes/map-custom-reports`](reference/lanes/map-custom-reports.md)
   NEXT ⓪. The live read (2026-09-23) found every existing table holding its grants; the exposure is
   `rebuild_map_college_goal2()` and `rebuild_map_college_credit_summary()`, which DROP and CREATE their tables in
   every nightly promotion and grant nothing. Add grants to both bodies and their schema-of-record files, re-apply
   the two functions live (a DDL write: Sam's OK), and add `tests/supabase_table_grants_test.py`. Its own PR.
4. Carryover: the ESL merging decision sheet; the college briefing's funding box vocabulary (*earned*, *drawable*,
   *the dollars*); ask Sam to retry Designate on the (D) card; the funding tab's pre-existing a11y findings (above).

## ⚠️ Watch for

- The standing open-asks sheet still must not be republished as it stands (store keyed to 21 cards, builder 15).
- The lessons doc sits at ~115 KB of a 120 KB budget; archive the oldest section before the next append.
- `CLAUDE.md` is 61.5 KB against 60 KB (pre-existing).
- The funding lane file sits at 19,996 B of its 20,000 B budget: condense before adding.
- `lanes/map-custom-reports` said the six lifecycle booleans were gone; they came back 2026-09-10 and the fetch
  requests `Counselor_Verified` (corrected 2026-09-23). Read the feed, not the lane, before building on a column.

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
