---
title: "CPL Implementation Funding tab — archived lessons, part 4 (2026-09-22 onward)"
date: 2026-10-24
updated: 2026-10-25
tags: [lessons, archive, funding, implementation-funding, dashboard-tab]
related:
  - "[[cpl_funding_lessons]]"
  - "[[cpl_funding_lessons_archive]]"
---

# CPL Implementation Funding — archived lessons, part 4

Sections moved verbatim from [`cpl_funding_lessons.md`](cpl_funding_lessons.md) when it passed its budget; it reads after the first
archive, [`cpl_funding_lessons_archive.md`](cpl_funding_lessons_archive.md), and its parts 2 and 3 (split 2026-10-25). Read these only for the
reasoning behind a decision you are about to change.

## 2026-09-22 — S283 (SkyFund): the leadership-review pass

Sam's last content edits before he reviews the tab with CO leadership, shipped in #1660; the four
calls still his ride the [funding review sheet](https://claude.ai/artifact/9MfbN6jqio8as9mY4LwPB2).

### "$0 demonstrated" was true of one number and false of the program

In Sam's signed-in scenario every institution was gated (0 of 118 confirmed), so `winEarned` read
$0 while $2,174,757 sat in `winHeld`: funding MAP had demonstrated, reserved until confirmation. The
Summary printed *"$0 demonstrated so far"* over a reserve bullet saying the opposite. The allocation
bullet now counts `winEarned + winHeld` as demonstrated and ends on local confirmation, which is the
one fact the reserve line carried. **A figure that excludes gated funding reads as nothing
happened.**

### One word, two figures

The formula box called the per-priority ceiling *"the cap"*, and the next bullet called the
$400,000 bound *"Cap"*. A leadership reader has no way to tell them apart. The per-priority figure is
now the **max award**, Sam's own term for it (2026-09-01), and *cap* names the bound alone.

### The fifth identity-join miss

The baseline counts ran over `base().colleges` (115) and so left out Calbright, which Sam counts as a
college (116). The coordinator match had the same blind spot: its roster came from the same list, so
no noncredit-only row could ever match, and MAP spells the institution *"Calbright College Credit"*
and *"Calbright College Non-Credit"*. It changed nothing today (neither has a coordinator), which is
exactly how a join failure stays invisible. `eligColleges()` is the one list now.

### Ten suites pinned phrasing, not facts

A style ruling (positive-first, no "this, not that") broke ten suites, because each asserted the
retired sentence: *"not its targets"*, *"placed on the table"*, *"rather than a carve-out line"*,
*"the annual tranche buys"*. Each now asserts the FACT the phrase carried (*targets stay proportional
to the pre-cap share*), so the next wording ruling costs a sentence, not a suite.

### Verify against Sam's screen

The local render runs on baked defaults (no remote config on localhost), so it showed $10.9M
demonstrated where Sam's scenario showed $0 and a reserve line. His screenshots were the ground
truth for every Summary edit; the local render verified layout only. The tab's a11y failures were
measured against `origin/main` in a worktree before any were called pre-existing.


## 2026-09-23 — S283 (SkyFund), second pass: a fourth priority, and a button that saved nothing

Sam's P2/P3/P4 asks, shipped in #1662. The detail is in the lane file and the PR.

### A count typed as three broke eighteen suites and two live surfaces

Adding Priority 4 broke every test that had assumed three priorities, and it would also have broken two
live surfaces the tests did not cover. The briefing's count gate would have sent every college's steps to
the standalone list. The explainer typed "three" in three sentences. Sam's stored `[0, 2, 1]` failed
`isPermutation(v, 4)` and fell back to the natural order, which swaps P2 and P3 with nothing on screen to
say so. **An order written before a priority existed is extended, not reset**, in `cpl_funding.js` and
`college_briefing.js` alike. Tests count from `NPRIO`.

### Read the request log before the handler

Sam said the (D) card's Designate button did nothing. In jsdom the code worked. The edge logs showed nine
200 PATCHes, the last four his releases, and **no request after them**, so the click never reached a
save. The likeliest cause is that nothing was selected in the list when he clicked, and the button returned
without a word. It now says what it needs. The log split the problem in two (the client never sent a
request, or the server refused it) before any code was read.
[note](kb-notes/methodology-a-control-that-does-nothing-read-the-request-log-first.md)

### A ruling superseded by the same person is replaced, and says so

The (C) note quoted Sam's 2026-08-30 *"not measurable at this time, and may never be"*, and a test pinned
it. His 2026-09-22 EDD ruling replaces it on the page with both dates named, and `cpl_memory` records the
supersession explicitly.

### Three rulings, built the same hour

He held P4 at 0% until the first import, let CO research define the outcome, and took the drill-in
consolidation as proposed. The follow-up PR shipped the one-line Baseline and the import receiver.

## 2026-09-23 — S284 (SkyWage): Scenario 3, a base that read $149k, and a scenario nobody published

**What Sam asked.** Scenario 3 matches the statute's four outcomes: delete the second completion priority, number
Career attainment P3, retitle the (D) card "Innovation Projects" as P4, a per-card "show on college rows" toggle,
an editable Measured-from list, plain-language Metric wiring, the NOCE/Calbright unmatched note, the ~$149k at the
base, a tighter drill-in, and a check that a new scenario stays wired to every surface. Shipped as #1664.

- **The ~$149k was a label on the wrong figure.** All 51 institutions at the base receive exactly $150,000; the
  table showed only the credit share ($149,321 at Clovis) beside "(at base)" and the NC share beside it. The base
  binds the COMBINED award, so the fix is a Max award column carrying the bound word and the one qualifying line.
  It brings back a combined column R6/R7 retired on 2026-08-31, so it is item 4 on his sheet.
  [note](kb-notes/methodology-label-a-bound-where-it-binds.md)
- **A new scenario was NOT wired to the public.** Every surface read the scenario the viewer's browser had
  selected: a college (no selection) saw Scenario 1 on the explainer, Sam's browser showed his working scenario
  there, and `college_briefing.js` named "Scenario 1" in code. A stored `published` name per project now decides
  what the explainer, the briefing and an unchosen browser read, with a Publish control on the strip; unset keeps
  Scenario 1. The report writer says when it drafts from an unpublished scenario.
- **A deleted share must move.** An award is W times the SUM of the shares, so a share deleted in place removes
  that part of the funding from every award; Delete asks which priority takes it, and the totals row now warns
  whenever the shares stop adding up to 100%. Sam, mid-session: *"I want to put the 33% into Career Attainment"*
  (not into Completion). Measured on Scenario 3, the statewide Current Total goes from $2,613,990 to $1,354,241,
  because Career attainment waits on the first EDD import; the sheet proposes holding Scenario 1 published until then.
- **His NC base/cap idea is the live model.** Per-lane bounds proportional to each institution's NC FTES share,
  the NC base taken from the CR base, reproduce every award to $0.00. NC gets parity (7.12% of FTES, 7.07% of the
  funding); the cap on the combined award trims Mt. SAC's NC share to $115,102 against $237,441 proportional.
  A weight is the clean lever (x1.25 gives $2,106,330). Calbright's data file says 21,438 NC FTES, which is 8.6 per
  student and stays behind the 1,000 stand-in.
- **The unmatched note was a lane-word gap in the builder.** MAP spells the credit locations "North Orange
  Continuing Education Credit" and "Calbright College Credit"; `_feeder_resolver` now folds the trailing word, as
  the shared identity file already does. The artifact moves on the next daily run.
- **One numbering, two card kinds.** A reported card is still no entry in `priorities(slot)`; the label reads a
  STORED unified order (`cardOrder` + an explicit `reportedCards`), because deriving the reported set inside
  `priorities()` recurses. `priorityOrder()` stays the truth for the measured cards' relative order.
- **Tests read columns by header now.** Thirteen suites indexed drill-in and row cells by position; the Max award
  column and the six-column drill-in broke them for layout reasons alone.
- **Supabase notice (Sam, 2026-09-23):** from 2026-10-30 a NEW table in `public` needs explicit grants for the Data
  API. Next session: grants in every table-creating SQL file, and a lint beside the function-grants one.
