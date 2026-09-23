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
label on the wrong figure. [#1664](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1664) merged
(e8b3582); the grants follow-up [#1665](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1665) (b5719bb)
and the fixture fix [#1666](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1666) (dd63838) merged after
it. The Delete fix below is the one PR still open.

## ✅ WHAT SHIPPED (in #1664, merged e8b3582)

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

## AFTER THE CHECKPOINT (2026-09-23, 17:40–18:40 UTC)

- **`main` went red, and it was ours.** The first daily run after #1664 published `ptc_u`, and the counselor suite
  had read the feed WITHOUT the key as its "before" state. #1666 sets the feed state in the fixture; ported into
  #1665, both merged. A generated artifact's absence is a pinned figure too.
- ⭐ **Sam: *"I tried to delete the P3 to assign P3 to Career Attainment but the Delete button doesn't fire."***
  Reproduced in Chromium: he had just typed a share; pressing Delete blurred the field, the field committed and the
  tab redrew under the pressed button, so the release reached a new button and no click fired (a second press works;
  Enter or Tab first avoids it). Fix: `render()` waits while a press begun in the mount is open (selects exempt,
  1.5 s fallback), guard `tests/cpl_funding_press_hold.test.js` (mutation-checked, 6 of 11 fail without it).
- ⛔ **Scenario 3 is published and its shares sum to 133%** (config saved 17:42:36 UTC): P1 Access 33 · P2
  Completion `ptc_u` 34 · P3 Career attainment 33 (factor still the baked 1.0) · P4 Completion with Transcription
  33. An award is W × Σshares, so the 115 maximum awards total **$32,927,660 against $24,757,639** on the public
  explainer and the college briefing until Sam's Delete lands. Given to him in session: Career attainment to 0 and
  Enter, Delete P4 into Career attainment (clear the six transcription strategies unless wanted), factor 0.5.

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

1. **Merge the Delete fix once `test` succeeds on its head** (auto-merge doctrine), squash. Then ask Sam to retry
   his Delete if he has not finished it by hand.
2. **Sam's Scenario 3 edits, through the tab** (never SQL): Delete Completion with Transcription into Career
   attainment so the shares return to 100%, and Career attainment's factor to 0.5 (his sheet ruling). Re-read the
   config afterward and confirm Σshares = 100% and the maximum awards total the allocation. His method note (CPL
   FTES per student record with a career improvement, from CO analysis) shapes the career import.
3. **Grants verification** after the 2026-09-24 13:40 UTC promotion: the `map_data_loads` promote row and
   `has_table_privilege` for anon, authenticated and service_role on the five tables (a check-in fires at 14:30Z).
   Detail: [`lanes/map-custom-reports`](reference/lanes/map-custom-reports.md) NEXT ⓪.
4. Carryover: the Max award column (unruled, past the mark twice); the ESL merging decision sheet; the college
   briefing's funding box vocabulary (*earned*, *drawable*, *the dollars*); ask Sam to retry Designate on the (D)
   card; the funding tab's pre-existing a11y findings (four small targets, one prose line at 390px).

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
