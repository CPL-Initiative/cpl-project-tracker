---
title: Session 284 handoff — the funding tab is ready for leadership, and career attainment has a measure
date: 2026-09-22
session: 283 (SkyFund)
tags: [handoff, implementation-funding, decision-sheets, edd, career-attainment]
status: current
---

# You are Session 284

Your moniker is **SkyWage**. S283 (SkyFund, named by Sam in his greeting; the S283 handoff had
suggested SkyRung) spent the whole run on Sam's last edits to the Implementation Funding tab before
he reviews it with CO leadership, and on what he said mid-run: the CO can measure career attainment
from EDD wage data. The wage measure is the lane's next build, once he rules on how it enters the
model.

## ✅ WHAT SHIPPED — merged

| PR | What |
|---|---|
| [#1660](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1660) | The leadership-review pass (`14db2d8`), plus the funding review decision sheet. Pages deployed 23:20 UTC |
| [CPLBrain#169](https://github.com/samueltlee/CPLBrain/pull/169) | Sam's EDD statement, captured verbatim |

**Funding review sheet (4 items, awaiting replies):** https://claude.ai/artifact/9MfbN6jqio8as9mY4LwPB2
· builder `kb/_build_funding_review_decision_sheet.py` · store empty as of 23:31 UTC.

## SAM'S DECISIONS THIS RUN

- **Summary:** lead with the total allocated and end on local confirmation; fold the reserve bullet
  in; correct the noncredit bullet (*"going to 3 stand alone NC programs but also to all NC
  programs"*); add a base-and-cap bullet for the model's equity.
- **Voice, extended:** *"start with positive and avoid statements like 'this, not that' or follow on
  restatements in other words"*; the allocation prose in *"academic rather than commercial
  language"*.
- **"should be 116 college, including Calbright"**: the baseline counts, not 115.
- **Funding Breakdown:** *"change red font to black and revise 'deducted' to something positive."*
  AI Apprenticeship Tools partners are **SCC and American River College (was Norco)**.
- **Notes under the table:** *"trim the notes to a sources line."* Project updates: *"an expandable
  title--default closed."* Explainer: text headers, never "Step 1, 2, 3".
- ⭐ **Career attainment (C), verbatim:** *"we can use EDD wage data to measure this. Recommend how
  we should revise this... This would not be reported by the colleges but instead measured by the CO
  and reflected on our funding model with periodic updates (imports) of the data. The Opportunities
  section would stay as is."*
- **Drill-in:** *"we should be able to eliminate or really simplify and consolidate the circled
  items"* (the three prose cells in each institution's expand). Advice is item 4 on the sheet.

## THE NEXT CONCRETE STEP

1. **Read the funding review sheet's `replies`** (ArtifactData `list`, collection `replies`), apply
   the high-water rule ([`decision_sheets`](reference/decision_sheets.md)), and tell Sam what his
   verdicts commit you to before building. A `send_later` re-reads it at 00:32 UTC and once more
   after.
2. **Build what he rules.** The session's proposals: the (C) card shows the wage measure from its
   **first import** and funding moves onto it only by a later ruling; CO research's definition,
   one masked student count per college; Priority 2 keeps (B)+(C); the drill-in opens on one status
   line. ⚠️ `srcDelivered()` reads an undelivered measure as **$0**: never pin a funded priority to
   the wage measure before an import lands.
3. **Then the ESL merging decision sheet** Sam asked for on 2026-09-21 *"in the next session"*. S283
   spent the run on the funding tab at his direction, so it is still owed. Start from
   [`lanes/esl-packaging`](reference/lanes/esl-packaging.md); cover what is in use AND what is queued.

## ⚠️ THE STANDING OPEN-ASKS SHEET MUST NOT BE REPUBLISHED AS IT STANDS

Its `replies` store is keyed to the **21 cards** Sam answered (Complete, `through: "18"`); #1659
dropped the executed cards and the builder now emits **15**. A republish pins every reply on the
wrong card with nothing erroring. Fresh `SHEET_ID` and artifact, or migrate the store by title,
before any rebuild ([`decision_sheets`](reference/decision_sheets.md) § open-asks). Two of his replies
on it still wait on a session: **item 7** *"Keep as 1 course but name the unit variation (1-3u). I
think this should be a rule for all merges and mints. Advise"* and **item 18** (he offers to ask Pedro
for a MAP report of locations with their regions).

## Carryover

| Item | State |
|---|---|
| Register fix: project 1.1.2's team still reads *Norco College* | **Sam's edit in Activities**; sessions cannot write `projects` |
| Tab a11y findings (55 inputs with no focus ring, 4-12px goal superscripts, the mirror checkbox, a prose block past 390px) | Identical on `main`; not this run's. `node scripts/a11y.js cobi:implementation-funding` |
| `cpl_memory` rows | **STAGED, not written**: `kb/receipts/cpl_memory_2026-09-22_s283.sql` (6 rows) beside S281's. The guard blocks `execute_sql` writes |
| `CLAUDE.md` | 61,598 B against a 60,000 budget (1.03×), pre-existing; this run shrank it by 34 B |
| CCR cross-list items 4, 5, 6, 12 · the item-3 re-mint · item 10 | Unchanged since the S283 handoff: [`lanes/discipline-crosslist`](reference/lanes/discipline-crosslist.md) |
| Rungs for the CER, CSR and CCRR · CCR decisions table · scanner re-run | Unchanged; see the To-Do feed |

## Read in order

This file · [`lanes/implementation-funding`](reference/lanes/implementation-funding.md) ·
`docs/cpl_funding_lessons.md` § 2026-09-22 · [`decision_sheets`](reference/decision_sheets.md) ·
the S283 handoff for the CCR lineage.

## Things that worked

- **Sam's screenshots were the ground truth.** The local render runs on baked defaults and showed
  $10.9M demonstrated where his signed-in scenario showed $0 and a reserve line. Every Summary edit
  was checked against his screen.
- **Baselining a11y on `main` in a worktree** before calling anything pre-existing.
- **Asserting the fact, not the phrase.** Ten suites broke on a wording ruling because they pinned
  sentences; each now asserts what the sentence meant.

## Safety patterns to honor

- Rule 4 (both HTMLs) · Rule 5 (never force-push `main`) · Rule 10 (fresh read, INSERT-only,
  receipt; the MCP guard blocks writes).
- House voice on every outward sentence: positive first, no restatement, the model as the actor.
- A `check_suite.completed` wake can name a superseded head; match `head_sha` to `git rev-parse HEAD`.
- After a squash merge, reset the branch to `origin/main` and `git remote prune origin`, or the
  stop hook counts the squash commit as unpushed.

---

*Greetings, you are Sky**Wage** (Session 284), see Sky**Fund**'s handoff —
`docs/session_284_handoff.md` — let's keep rolling with our queue.
First, run `python3 scripts/check_hooks_live.py --fix` and paste its LIVE
line, no investigation.*
