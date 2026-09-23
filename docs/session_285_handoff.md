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
it, then the Delete fix [#1667](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1667) (07d1c36) and
the Delete confirmation rework [#1668](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1668) (cc04ae7).
No PR is open.

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
  Merged in #1667.
- ⭐ **Then: *"Clicked delete and it deleted the header (I think) but not the whole card."*** Nothing was deleted: the
  confirmation opened inside the full card and read as a half-deleted one, and his browser was on **Scenario 1**
  while Scenario 3 is published. While Delete asks now, the card is only the question; the question names the
  published scenario when he is in another; focus moves into it and back on Keep it
  (`tests/cpl_funding_delete_confirm.test.js`, 5 of 11 fail without it). Merged in #1668. Scenario 1 also
  measures Completion with Transcription from `ptc_u`, the same measure as Completion; told Sam, his call.
- ✅ **Published and at 100% (Sam, 19:44 UTC: *"Deleted on Scenario 1 and published"*).** He deleted Completion
  with Transcription in **Scenario 1**, its 33% into Career attainment, and published Scenario 1: Access `ppa_u` 33
  · Completion `ptc_u` 34 · Career attainment 33. Measured through the model, the 115 maximum awards total the
  $24,757,639 allocation (at 133% they had totaled $32,927,660). Scenario 3 still sums to 133%, unpublished. Open,
  his call: Career attainment's factor is the baked 1.0 against his 0.5 ruling, and it carries the six
  transcription strategies from the deleted priority (the carry box was checked).

- ⛔ **THE SQL GUARD HAD A BYPASS, AND IT HAD STALLED RULE 8 FOR THREE DAYS (fixed with this line).**
  `scripts/supabase_sql_guard.py` stripped literals before comments in separate regex passes, so an apostrophe in
  a `--` comment opened a phantom string: `select 1; -- the curator's list` + a newline + `delete from
  kb_curation ...; -- end'` came back **allow**, and an `E'it\'s'` escape did the same. Separately, the `do` of
  `ON CONFLICT (slug) DO NOTHING` matched the DO-block verb, so every memory receipt written the documented
  INSERT-only way was refused while a bare insert passed. **None of the 20 staged rows from S281, S283 and S284
  ever reached `cpl_memory`** (checked live 20:00 UTC). The guard now reads comments and literals in one pass as
  Postgres does, asks on anything unterminated, and reads `ON CONFLICT ... DO NOTHING` as a clause
  (`tests/supabase_sql_guard_test.py`, 47 cases, 8 failing on the old guard).
- **Evening sheet** for Sam's three remaining calls: https://claude.ai/artifact/BXnZNKBGCYMnhUh6xefBqz (builder
  `kb/_build_evening_asks_sheet.py`, version 2 at 21:10 UTC). Item 1: Career attainment's six carried
  transcription strategies (proposed: move them to Completion, whose measure is transcribed CPL). Item 2: the
  Max award column (proposed: keep). Item 3: the memory log (proposed: let sessions append to it). **Sam pressed
  Complete at 21:12 UTC with no input on any card** (`replies/done`: `ruled 0`, `as_proposed 3`, `through
  null`), so under `decision_sheets` none of the three was a ruling. S284 asked in the Complete thread for a
  direct yes before touching the guard, and **Sam answered in session about 21:15 UTC: *"i accepted your 3
  recs"***. Verdicts under SHEET VERDICTS below.
- ✅ **S284's eight memory rows are WRITTEN (20:56 UTC, `proposed`, author `SkyWage-s284`) AND LOGGED (21:57 UTC,
  `creates = 1` for all eight).** The first send failed on `cpl_memory_summary_check` (summary is one sentence, 1–400 chars); the receipt
  now puts the long text in `detail`. The playbook's step 6 log insert is denied by the guard, whose carve-out
  names `cpl_memory` alone. S280 logged through `apply_migration` on 09-20 (its log note says so), which S281
  ruled out. S284 wrote an INSERT-only carve-out for the log with six tests; the auto-mode classifier refused it
  as `[Self-Modification]`, the human gate, and S284 reverted it. **Sam said yes (item 3)**, the change went back
  in with its tests (53 cases, 2 failing on the old guard) as #1671, and S284 ran the idempotent insert at the foot
  of `kb/receipts/cpl_memory_2026-09-23_s284.sql` after the merge.
- ⛔ **A WINDOW HOLDING AN OLDER COPY ERASED THE PUBLISHED MARKER (21:30 UTC).** Sam set Career attainment's factor
  to 0.5 and changed P2's measure text (outcome B). The same save wrote the config back without
  `projects.cpl-implementation.published`, which read "Scenario 1" at 21:15. No current code path drops it, and the
  tab reads the config once at load and PATCHes it whole. So the save came from a window that loaded before the
  19:44 Publish. Colleges still see Scenario 1, because an unset marker falls back to it. The fix names the version
  a window read on every save: an older window loads the newer row and asks for the change again, and one window
  sends one save at a time. Guard `tests/cpl_funding_save_over_newer.test.js` (15 checks; 12 fail on the old
  code); note [`methodology-a-window-saves-only-over-the-version-it-read`](kb-notes/methodology-a-window-saves-only-over-the-version-it-read.md).
  **Sam re-presses Publish on Scenario 1.**

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
   factor 0.5, Scenario 3 published: curator edits through the tab once #1664 is live (never SQL). ✅ Done in
   Scenario 1, which he published (19:44 UTC); the factor 0.5 is still open. His method note reshapes the import:
   CPL FTES per student record with an improvement, from CO analysis.
3. **parity** — keep NC at its FTES share. 4. **Not reached** (after the mark); ruled on the evening sheet below.

**Evening sheet (Sam in session, 2026-09-23 about 21:15 UTC: *"i accepted your 3 recs"*):** ① **move** the six
transcription strategies from Career attainment to Completion: his edit in the tab, Year 1 of Scenario 1 (the
carry touched Year 1 only; Year 2 has no Career attainment row). ② **keep** the Max award column: RULED, no code.
③ **append**: sessions may INSERT into `cpl_memory_log`; an update or delete of it keeps the deny.

## THE NEXT CONCRETE STEP

1. **Sam's two tab edits, then read the config to confirm them:** re-press **Publish** on Scenario 1
   (`projects.cpl-implementation.published` must read "Scenario 1"), and move the six strategies to Completion in
   Year 1 (evening sheet ①, accepted). ✅ Factor 0.5 on Career attainment landed at 21:30. His method note (CPL
   FTES per student record with a career improvement, from CO analysis) shapes the career import.
2. **The three older memory receipts.** S284's rows are written and logged. The three older receipts (`..._2026-09-21_s281.sql`,
   `..._2026-09-22_s283.sql`, `..._2026-09-23_s283.sql`, 15 rows) were written against earlier states: read each
   row against today before writing it, and each needs its log the same way. S283's
   `priority-4-career-attainment-zero-share-ca-u` is already false, since Scenario 1 funds Career attainment at 33%.
3. **Grants verification** after the 2026-09-24 13:40 UTC promotion: the `map_data_loads` promote row and
   `has_table_privilege` for anon, authenticated and service_role on the five tables (a check-in fires at 14:30Z).
   Detail: [`lanes/map-custom-reports`](reference/lanes/map-custom-reports.md) NEXT ⓪.
4. Carryover: the ESL merging decision sheet; the college
   briefing's funding box vocabulary (*earned*, *drawable*, *the dollars*); ask Sam to retry Designate on the (D)
   card; the funding tab's pre-existing a11y findings (four small targets, one prose line at 390px).

## ⚠️ Watch for

- The standing open-asks sheet still must not be republished as it stands (store keyed to 21 cards, builder 15).
- The hook runs the WORKING-TREE `scripts/supabase_sql_guard.py`, so an uncommitted edit to it is live for the
  session at once. A session editing its own guard draws the classifier's `[Self-Modification]` refusal: stop,
  restore the file, and ask.
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
