---
title: Session 300 handoff — two ports reconciled, Sierra Training redesigned, seven asks on one sheet
date: 2026-09-29
session: 300 (SkyLoom)
tags: [handoff, implementation-funding, college-dashboard, sierra-training, decision-sheet]
status: current
---

# You are Session 301

Your moniker is **SkyShuttle**. SkyLoom (S300) took the queue from
[`session_300_handoff.md`](session_300_handoff.md), which S299 wrote on its closed #1731
branch and S300 carried to main as the record.

## First thing: Sam's answers on the open-asks sheet

The standing sheet is [QiaDezD2AN6XDzctUCSCfw](https://claude.ai/artifact/QiaDezD2AN6XDzctUCSCfw)
(`SHEET_ID` `2026-09-29-open-asks`, seven cards). ⚠️ **Sam pressed Complete at 03:34Z with no card
touched**: `replies/done` reads `ruled: 0, as_proposed: 7, through: null`. By his 2026-09-22 rule
(`decision_sheets`, "A sheet with no input at all has no mark") none of the seven is a ruling,
so S300 held all seven and asked him on the sheet's comment thread (`cbb09f0e…`) to confirm with a
chip or "all seven as proposed". Read the thread (`ArtifactComments`) and the stores
(`ArtifactData`, `replies` and `replies/done`) before anything else; act only on what he confirmed. Cards 1 and 2 are also
cards 3 and 4 of the 2026-09-27 funding asks sheet (`74AfMNmXPQYP5X7XKpjHfH`): read both
stores, and the later answer stands. Carry out each verdict with its lane marker in the same PR.
- **Card 4**: which figure Current Total names. The cards report what institutions demonstrated;
  the Dashboard's Curr columns report what they qualify for.
- **Card 5**: the college thank-you in `optinAffordanceHtml()` still promises that the CO "will
  acknowledge it".
- **Card 6**: the explainer's Step two note (`funding-model/index.html`, the reserve sentence) and
  its "Max award by institution" heading. This is public wording, so ship only what Sam approves.
- **Card 7**: two saved texts in `cpl_funding_config`, both scenarios: the timeline's "Undispersed
  Funds Rolled to Year 2 and Releveled" and the intro "Baseline outcomes to accrue implementation
  funding:". If Sam picks "Write both for me", this is a guarded UPDATE with a receipt of the
  before-values (Rule 10 a2), and the rest of his config stays untouched.

Cards 4–6 rest on measured premises, so the builder refuses to build once their work lands:
remove each card when you carry it out.

## What shipped (S300)

- **#1732** (`f30d9dc`): the College Dashboard follow-ups. It carries what #1731 had that #1729
  lacked, plus S299's five:
  - the fixed layout scoped to `.cplfund-coltable`, so the grants table is auto again;
  - the reading-note formula wrapping at 390px;
  - TBA on every surface;
  - the reading note and allocation sentence;
  - the deadline fallback at 2026-11-01;
  - the CSV's Demonstrated column as qualifying plus held, and the "minimum conditions" header;
  - print fixes: `.cplfund-dtl-sum` removed, "CalbrightNC only", and the explainer's 898px
    printed table.

  It also carries the new open-asks sheet. #1731 is closed with a comment naming #1732.
- **#1733** (`fac9e9a`): Sierra Training round 1, Sam's approved mockup. The five numbers are buttons that
  filter what they count, the list has a "Showing N of M" line, marks became words, the status is
  a segmented control, and the tab uses First Light tokens only. "Try it in: Sierra · My College"
  rides a destination key, `cplSierraTestDest.v1`, which `cpl_chat.js` reads; without it the
  question would have landed in the hidden CPL Assistant input. The guard is
  `tests/sierra_training_round1.test.js` (79 checks, nine mutants).
- CPLBrain#191 (S299's vault note) is merged; S300's note corrects its first line.
- The funding lane was compacted from 25 KB to 19.9 KB. The moved text sits verbatim in
  `cpl_funding_lessons_archive.md`.

## Then: the queue

- **Jev**: S297's ask, a next step for each of the four references (the lane and the S298
  handoff's Jev section).
- SkyView's phone opening.
- Cue the narrated video.
- The ETHS answer (card 3).
- ESL monthly after 2026-10-28.
- Governance for the two write surfaces.
- The unit-range display check.
- The funding lane's NEXT ⓪d and ⓪f: the requirements brief's "Proposed baseline requirements",
  and the CSV percentage that is finer than the public $1,000 rule.

## Waiting on Sam

The seven cards. Whether S298's three test queries asked him to Allow. GR rows #2, #10 and #16.
Two Sierra Training calls, not yet on the sheet: whether the "Try it in" button should read
"CPL Assistant", and what both buttons do when the CPL Assistant tab is hidden.

## Read in order

1. This file.
2. [`ui_mockup_lessons`](ui_mockup_lessons.md), the S300 section.
3. The funding lane's Status and NEEDS SAM paragraphs
   ([`lanes/implementation-funding`](reference/lanes/implementation-funding.md)).

## Patterns that worked

- **Two ports of one change: diff each against their common base, and keep main's wherever it
  did the same job.** Carry a list of what main lacks, never the branch.
- **Measure a claimed defect on main before porting its fix.** The measurement found a third
  defect that neither port knew about.
- **A consumer map can change the design.** It is how the hand-off's destination key came
  about.
- **Delegating a port:** give the worktree agent the spec URL, the consumer map and the
  doctrine. Review its diff for `esc()` and tokens, then cherry-pick onto the fresh base.

## Safety patterns

- `pgrep -f`/`pkill -f` on a string that is in your own command line matches the shell running
  it: the waiter never exits, and pkill kills itself.
- A worktree inside the repo (`.claude/worktrees/`) makes `alias_chain_single_source_test` fail
  locally. CI has no worktree; remove it after the cherry-pick.
- GitHub deletes a branch on merge. `--force-with-lease` against the stale tracking ref is
  rejected, so push plain to recreate the branch.
- **S299's session was still alive** at 02:53Z, when it corrected a memory row after #1731
  closed. Ask Sam whether other sessions are open before shared writes.

## Carryover

- Not refreshed: `kb/README.md` (no structure change) and the Pipeline tab (the pipeline did not
  move).
- The four targets under 24px on the funding tab: lane NEXT ③.
