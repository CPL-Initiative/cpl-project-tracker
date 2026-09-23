---
title: Session 284 handoff — Priority 4 carries career attainment, and the funding tab is ready for leadership
date: 2026-09-23
session: 283 (SkyFund)
tags: [handoff, implementation-funding, decision-sheets, edd, career-attainment]
status: current
---

# You are Session 284

Your moniker is **SkyWage**. S283 (SkyFund) spent the run on the Implementation Funding tab before Sam
reviews it with CO leadership. First came his last content edits (#1660). Then came his ruling that the CO
can measure career attainment from EDD wage data, and his asks built on it: P2 on (B) alone, P3 named by
its live title, and a fourth priority for career attainment (#1662). The EDD import is the lane's next build,
once he rules on its definition.

## ✅ WHAT SHIPPED

| PR | What |
|---|---|
| [#1660](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1660) | The leadership-review pass. Pages 23:20 UTC 2026-09-22 |
| [#1661](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1661) | The first checkpoint |
| [#1662](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1662) | **Priority 4**, P2 on (B), live-title headers, the order extension, three Designate fixes |
| [CPLBrain#169](https://github.com/samueltlee/CPLBrain/pull/169) · [#170](https://github.com/samueltlee/CPLBrain/pull/170) | Sam's EDD statement, verbatim · the session note |

**Funding review sheet (3 items, store empty, v2 republished 2026-09-23):**
https://claude.ai/artifact/9MfbN6jqio8as9mY4LwPB2 · builder `kb/_build_funding_review_decision_sheet.py`.

## SAM'S DECISIONS THIS RUN

- ⭐ **Verbatim, 2026-09-22:** *"1. Change P2 B&C Completion to B Completion with Counseling (read from live
  tab--also designated where the metric is derived) 2. Change P3 to Completion with Transcription (read from
  live tab) 3. Add P4 with the same ability to edit as other P cards. Note the Designate Activities button on
  this card isn't working for me"*. The counselor step serves (B) alone. This **supersedes his 2026-09-01
  (B)+(C)** and settles the old sheet item 3.
- ⭐ **Career attainment (C), verbatim:** *"we can use EDD wage data to measure this... This would not be
  reported by the colleges but instead measured by the CO and reflected on our funding model with periodic
  updates (imports) of the data. The Opportunities section would stay as is."* This **supersedes his
  2026-08-30 "not measurable at this time, and may never be"**.
- The #1660 rulings: lead positive with no restatement, 116 colleges with Calbright, black ink for the
  ledger, AI Apprenticeship Tools partners SCC and American River College. Full list in `docs/cpl_funding_lessons.md`.

## THE NEXT CONCRETE STEP

1. **Ask Sam to retry Designate on the (D) card** once #1662 is live. The edge logs for 2026-09-22 show nine
   200 PATCHes and **none after his four releases**, so his click never saved. The likeliest cause is an empty
   selection, and the button now says so. If it still fails, read the logs again
   ([note](kb-notes/methodology-a-control-that-does-nothing-read-the-request-log-first.md)).
2. **Read the funding sheet's `replies`** (ArtifactData `list`, collection `replies`) and apply the high-water
   rule ([`decision_sheets`](reference/decision_sheets.md)).
   - Item 1: when P4 takes a share. It is at **0% and factor 1.0**; the other three run at 0.5.
   - Item 2: whose wage definition.
   - Item 3: the drill-in consolidation.
3. **Build the EDD import** once he rules on item 2: a committed aggregate that adds `ca_u` / `nc_ca_u`
   (statewide and per college, masked under 10) to `cpl_funding_performance.js`. The model needs no edit;
   `srcDelivered()` picks the measure up.
4. **The ESL merging decision sheet** Sam asked for on 2026-09-21 is still owed. Start from
   [`lanes/esl-packaging`](reference/lanes/esl-packaging.md).

## ⚠️ THE STANDING OPEN-ASKS SHEET MUST NOT BE REPUBLISHED AS IT STANDS

Its `replies` store is keyed to the **21 cards** Sam answered; the builder now emits **15**. Start a fresh
`SHEET_ID` and artifact, or migrate the store by title ([`decision_sheets`](reference/decision_sheets.md)).
Items 7 and 18 of his replies still wait on a session.

## Carryover

| Item | State |
|---|---|
| Project 1.1.2's team still reads *Norco College* | **Sam's edit in Activities** |
| The college briefing's funding box says *earned*, *drawable*, *the dollars* | Sweep to the funding vocabulary (lane NEXT ⓪b) |
| Tab a11y: 62 inputs with no focus ring (55 + P4's 7), goal superscripts, a prose block past 390px | Same kinds as `main`; the explainer passes clean |
| `cpl_memory` rows | **STAGED:** `kb/receipts/cpl_memory_2026-09-22_s283.sql` + `..._2026-09-23_s283.sql`; the guard blocks writes |
| `CLAUDE.md` | 61,592 B against 60,000, pre-existing |

## Read in order

This file · [`lanes/implementation-funding`](reference/lanes/implementation-funding.md) ·
`docs/cpl_funding_lessons.md` § 2026-09-22 and 2026-09-23 · [`decision_sheets`](reference/decision_sheets.md).

## Things that worked

- **The request log before the code.** One `query_logs` call split the Designate report into "never sent"
  and "refused", which three rounds of reading the handler could not.
- **Reading the live config before writing a fixture.** The lane file said slot 1 was unpinned; the config
  said `p3_u`.
- **Counting from the data.** `NPRIO` in the harness; eighteen suites stopped assuming three.

## Safety patterns to honor

- Rule 4 · Rule 5 · Rule 10 (fresh read, INSERT-only, receipt; the MCP guard blocks writes).
- House voice on every outward sentence: positive first, no restatement, the model as the actor.
- Match a `check_suite.completed` wake's `head_sha` to `git rev-parse HEAD`. After a squash merge, reset the
  branch to `origin/main` and `git remote prune origin`.

---

*Greetings, you are Sky**Wage** (Session 284), see Sky**Fund**'s handoff —
`docs/session_284_handoff.md` — let's keep rolling with our queue.
First, run `python3 scripts/check_hooks_live.py --fix` and paste its LIVE
line, no investigation.*
