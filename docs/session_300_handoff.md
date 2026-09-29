---
title: Session 299 handoff — the College Dashboard ported, two calls for Sam, Sierra Training next
date: 2026-09-29
session: 299 (SkyTrellis)
tags: [handoff, implementation-funding, college-dashboard, sierra-training, mockup, ui]
status: current
superseded: true
superseded_by: session_301_handoff.md
---

# You are Session 300

Your moniker is **SkyLoom**. SkyTrellis (S299) took the queue from
[`session_299_handoff.md`](session_299_handoff.md). S298's port branch had died with its
container, so S299 redid the College Dashboard port from the locked mockup alone and ran
a Rule 9a WARN checkpoint at 107,635 tokens left.

## ⚠️ First thing: reconcile PR #1731 with #1729, which merged first

S298's own port reached main as
[#1729](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1729) after S299 began
(S299's start-of-session check saw no branch), and
[#1730](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1730) rewrote
`session_299_handoff.md` on main with "the College Dashboard's five follow-ups". #1731
(this branch) is a second port of the same mockup and is held in draft. Do NOT merge it.
Read main's `session_299_handoff.md` first, diff #1731 against #1729, and carry into a
fresh PR off `main` only what #1729 lacks. Candidates:
- the explainer's color fallbacks (credit header, pie fills);
- scoping the fixed table layout off the grants table;
- the reading-note formula wrapping at 390px;
- statewide Actual Funds as the qualifying figure;
- the TBA sweep;
- the guard suite `cpl_funding_college_dashboard.test.js`.
Then close #1731.

FTES, asked by Sam 2026-09-29: the fresh DataMart pull (Annual 2025-26, pulled
2026-09-24) is in production since #1690 (2026-09-24); Calbright keeps its 1,000 stand-in.

## Then (once reconciled): land the port

[#1731](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1731) is the port,
ready for review, with this checkpoint on the same branch. Poll `get_check_runs` on the
current head; merge (squash) once `test` succeeds. If `test` is red, the likeliest cause
is a suite S299 did not run locally: every file that loads `cpl_funding.js` passed one at
a time, but the full suite ran only in CI. Fix by reading cells by column key (the pattern
the PR uses), never by class position.

What the port did (spec: [mockup round 7](https://claude.ai/artifact/2V1aWwtjwob5gSM6TEkfyQ)):
- the row: pie, star, name; Max CR · Curr CR · Max NC · Curr NC · Total Funds (Base/Cap
  chip) · Curr Total Funds; "Confirm by MM-DD-YY", "Confirm now" after the deadline;
  Statewide with "N of 118 meet all conditions";
- the drill-in: Minimum Conditions line of three boxes, no Max Funds line, no credit
  caption, lane-named headers, Reject alone for the CO;
- no reserve figure anywhere on screen; statewide Actual Funds = what institutions
  qualify for; TBA replaces "awaiting measurement" (CLAUDE.md line updated);
- prefs key `cplfund_cols_v2`; colgroup and spans follow the visible columns; explainer
  token fallbacks; the reading note's formula wraps on a phone.

## Then: Sam's two calls (put them on the open-asks sheet)

1. **"Current Total" now names two figures.** The Priority Outcomes cards report what
   institutions have DEMONSTRATED ($758,725 in the mockup data); the dashboard's Curr
   Total and statewide Actual Funds report what they QUALIFY for ($338). Options: the
   cards read the qualifying figure too; the cards say "Demonstrated"; or both stand.
2. **The CO opt-in review lane** in Minimum Conditions still offers Confirm (outside the
   mockup). Delete it there too, or keep it as the CO's record check? The college-facing
   thank-you still says the CO "will acknowledge it".

S299 did not rebuild the open-asks sheet (context): add both as cards via
`kb/_build_open_asks_decision_sheet.py`, publish under a fresh `SHEET_ID`, hand Sam the link.

## Then: Sierra Training

Sam approved [round 1](https://claude.ai/artifact/Agmbu7UNGRcdEf48Sx5PTi) on 2026-09-28.
Port it to `sierra_training.js` the same way: a background consumer map first, then the
port, tests by key, `npm run a11y`, mutation-test the new guard.

## Read in order

1. This file. 2. [`ui_mockup_lessons`](ui_mockup_lessons.md) (S299's section). 3. The
funding lane's status line ([`lanes/implementation-funding`](reference/lanes/implementation-funding.md)).

## Waiting on Sam

The two calls above · the Sierra Training rounds · the open-asks sheet cards 1 to 3 · the
timeline label · whether S298's three test queries asked him to Allow.

## The queue after Sierra

Jev · SkyView's phone opening · cue the narrated video · the ETHS answer · ESL monthly
after 2026-10-28 · governance for the two write surfaces · the unit-range display check.

## Patterns that worked

- **A consumer map beside the port** caught two defects before CI (the grants table,
  the explainer's missing tokens).
- **Mutation-test a new guard**: plant the regression, watch it go red, restore.
- **Check the live config before changing a default**: `cpl_funding_config` held no
  `college_intro` or `reading` override, so the new defaults show.

## Safety patterns

- A check floor counts assertions (`tests/check_floor.json`): merging two checks can
  drop a file below it. Add a meaningful check; never lower the floor to pass.
- Never run a mutation beside the background suite without re-running what it overlapped.
- The docs lint flags `lanes/implementation-funding.md` at 1.23× its 20 KB budget:
  compact it (move settled history to the lessons archive) before appending.

## Carryover

- Not refreshed this checkpoint (WARN, context): `kb/README.md` (no structure change),
  the Pipeline tab (the pipeline did not move), the open-asks decision sheet (above),
  the lane file's compaction (above).
- Pre-existing a11y findings on the COBI funding tab, outside the dashboard: four
  targets under 24px (`a.cplfund-sanity`, two `a.cplfund-goalsup`, `#cplFundMirror`).

## Emergency close (after the checkpoint)

S299 hit the Rule 9a EMERGENCY line (48,674 tokens left) after the checkpoint above, while
answering Sam's FTES question and finding #1729. Nothing else was lost; still open:
- the vault note PR [samueltlee/CPLBrain#191](https://github.com/samueltlee/CPLBrain/pull/191)
  (draft, one new note): mark ready and merge;
- #1731: held in draft. Reconcile it as above, then close it with one comment naming the PR
  that carries its remaining changes;
- two more `cpl_memory` rows went in: `fresh-ftes-pull-in-production-2026-09-24`,
  `a-parallel-session-can-merge-the-work-you-are-redoing-2026-09-29`.
