---
title: Session 287 handoff — the funding tab review sheet, three funding PRs, and an emergency checkpoint
date: 2026-09-24
session: 286 (SkyTally)
tags: [handoff, implementation-funding, decision-sheets, review-sheet]
status: current
---

# You are Session 287

Your moniker is **SkyLane**. S286 (SkyTally) opened the Implementation Funding tab as a review sheet, shipped two PRs
from Sam's notes and left a third in draft.

⚠️ **EMERGENCY CHECKPOINT (Rule 9a).** It was written at 62,519 tokens left. **Refreshed:** this handoff, the funding lane
file, the memory rows (STAGED below, not written) and the review-sheet tooling (committed). **NOT refreshed:** the §11
session narrative in `CLAUDE.md`, `docs/cpl_funding_lessons.md`, the To-Do feed, the docs lint
(`kb/_docs_audit.py`), the standing open-asks sheet, `docs/reference/decision_sheets.md` (the sheet's new edit-in-place
layer), kb-notes, the CPLBrain session note, and `cpl_memory` itself. **Run a full `/checkpoint` early.**

## ✅ WHAT SHIPPED (main)

- **#1677:** a gold ★ Veteran Star on the college rows (59 flags, `vetStarHtml()`, `--mustard-text`); the drill-in headers
  aligned to their columns (the outer `.cplfund-table th` / `tr.cplfund-detail td` rules were reaching the nested cells); the
  tabs were renamed "2026-28 Funding" / "2025-26 Funding". Guard: `tests/cpl_funding_dtl_align.test.js`.
- **#1678:** the Baseline line now reads "60 of 116 colleges meet this. 59 hold the Veteran Star…" (Calbright meets it with
  certificates); the Timeline note, verbatim, as a `TEXT_BLOCKS.timing_note`; **MAP partner agencies (`entity_kind:
  "partner"` in the identity crosswalk: Launch Apprenticeship, Futuro Health) are skipped at the row by
  `funding/_build_funding_performance.py`**; drill-in first column left, the rest centered. Guard:
  `tests/cpl_funding_review_sheet_s286.test.js`.
- **The review sheet:** https://claude.ai/artifact/Ayp39ynE6Yw9cvsvQbH7eu. It is the live tab, captured from the live config
  and numbered N.k, with reply chips and **in-place line edits** (the `edits` collection: `{ref, before, after}`). Sam
  pressed Complete, **reviewed through item 7**; items 8–10 carry no verdict. Tooling: `scripts/tab_review_sheet/` (capture
  with Playwright plus the snapshot JSON, then `build_sheet.py` on `kb/_decision_sheet_replies.py`). Its paths still point
  at S286's scratchpad, so adjust them before reuse. The artifact comment thread (`c9090ebf…`) is still OPEN: reply with the
  #1679 result, then resolve it.

## ⓪ THE NEXT CONCRETE STEP: finish draft #1679

Branch `claude/funding-lane-tables-card-head` ([#1679](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1679),
draft, already retargeted to main). It carries **7.9a/b**: one drill-in table per lane, in Sam's columns
*"Outcomes; Max FTES; Max Funds; Actual FTES; Actual Funds; Difference"*. Difference = Max Funds − Actual Funds, with the
FTES gap in its hover. It also carries the **one-line card head**, "Priority N · (A) Access", with the pickers inline, the
law on one line, and Rename for a custom title. Sam: *"I like your simplified priority card!"*

1. **Rebase onto main, dropping the old #1678 commit** (`50cc399`): `git rebase --onto origin/main 50cc399`, then
   `--force-with-lease` (a feature branch, allowed).
2. **Suites still red** (the rest are updated and pass):
   - `cpl_funding_outcome_cards` (3 checks): the derived picker option now reads "(A) Access" with `title="Set by the
     metric"`, and the tests want "From the metric" first. Decide the label, then align the test (the restore check too).
   - `cpl_funding_statewide_expand`: 2c/2d count ONE table definition and header row (now one template, used per lane);
     4a–4d read the retired Total Possible hover and Target unit. Rewrite them to the lane tables.
   - `cpl_funding_statutory_goals`: "names its outcome in words rather than a raised letter". Reads the old goal row.
   - `cpl_funding_reorder` B: expects "Priority 1:". The colon is gone ("Priority 1 · …").
   - `cpl_funding_scenarios`: "Alameda's expand shows 777 in its Actual column". The header is now "Actual FTES".
   - `cpl_funding_rollup` and `cpl_funding_row_legibility`: they CRASH, likely on header reads.
3. Then run full `npm test`, raise the floors by hand for the files whose counts changed, regenerate the dependency map,
   run `bash scripts/check_generated.sh` and `npm run a11y cobi:implementation-funding` (only the pre-existing four targets
   plus the 390px line should remain). Mark ready, merge on `test` success, and answer the sheet thread.

## Sam's list: yours to hand him (stored settings, typed in the tab, never SQL)

Rename the sections "CPL Infrastructure and Local Implementation Funding" to **Introduction** and "Baseline Outcomes" to
**Minimum Conditions**. Apply his five timeline edits from the sheet's `edits` store: "Participation Request" becomes
"Confirmation Deadline", and " in MAP" drops from the four disbursement lines. Still open from 2026-09-23: re-press
Publish on Scenario 1, and move the six carried strategies to Completion in Year 1.

## Grants (map-custom-reports NEXT ⓪)

At 14:4x UTC all five rebuilt tables read for anon/authenticated/service_role (goal2 173 rows, credit_summary 113,
cleanup 506, transcribed_gap 279, cx_guidance 232). **Today's promotion had not run.** That cron lands at 17:45–18:55 UTC.
Once `map_data_loads` has a `map_custom_report_promote` row dated 2026-09-24, re-run the same ONE statement
(`has_table_privilege` × 3 roles × 5 tables plus counts) and record it in the lane. A check-in trigger
`trig_01Ng2JuxJVSrQVu2vY7BY2F2` fires into S286's session at 16:32 UTC. Delete it if S286 is gone.

## Memory rows STAGED (write them, one INSERT, with a receipt)

1. Sam, 2026-09-24: MAP partner agencies (Launch Apprenticeship, Futuro Health) are not CCCs and are outside the CCC
   funding model: no count, no mention.
2. Sam, 2026-09-24: the drill-in columns are "Outcomes; Max FTES; Max Funds; Actual FTES; Actual Funds; Difference", with
   one credit table and one noncredit table so "the NCs [don't] get lost in the shuffle".
3. Sam, 2026-09-24: the house table format is to "left justify the 1st column and center justify the rest".
4. Sam, 2026-09-24: on decision sheets he wants to revise text in place ("revise the text in, say, 3.1 in the 3.1 box");
   the sheet's `edits` layer does this.

## ⚠️ Watch for

- Another session is working on the **Exhibit Adoption** COBI tab. The shared files are `tests/check_floor.json` and
  `kb/dependency_map.json`. On a conflict, merge main and regenerate; never pick sides.
- SQL prompts are Sam's pain point: S286 spent two.
- The funding lane is at 20,465 bytes against its 20KB cap; condense before adding.

---

*Greetings, you are Sky**Lane** (Session 287), see Sky**Tally**'s handoff —
`docs/session_287_handoff.md` — let's keep rolling with our queue.
First, run `python3 scripts/check_hooks_live.py --fix` and paste its LIVE line, no investigation.*
