---
title: "CPL Implementation Funding tab — archived lessons, part 2 (2026-09-22 onward)"
date: 2026-10-24
updated: 2026-10-24
tags: [lessons, archive, funding, implementation-funding, dashboard-tab]
related:
  - "[[cpl_funding_lessons]]"
  - "[[cpl_funding_lessons_archive]]"
---

# CPL Implementation Funding — archived lessons, part 2

Sections moved verbatim from [`cpl_funding_lessons.md`](cpl_funding_lessons.md) when it passed its budget; the first
archive, [`cpl_funding_lessons_archive.md`](cpl_funding_lessons_archive.md), is over its own. Read these only for the
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
