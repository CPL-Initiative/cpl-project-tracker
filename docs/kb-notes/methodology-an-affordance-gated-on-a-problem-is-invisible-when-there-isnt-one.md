---
title: An affordance gated on a problem is invisible when there isn't one
created: 2026-08-11
updated: 2026-08-11
tags: [methodology, cip, cobi, ui, curation, top-cip]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[cip_crosswalk_lessons]]"
  - "[[CLAUDE]]"
artifacts:
  - cip_crosswalk.js
  - tests/cip_crosswalk.test.js
---

# An affordance gated on a problem is invisible when there isn't one

> **One-sentence summary** — The CIP tab put its "choose a different code" picker inside the
> `needs revision` branch, so the 91% of TOP codes with more than one approved CIP looked
> single-valued to every college whose current code happened to be valid — and *valid* is not
> the same as *right*.

## Context

The Programs view of the CIP Coder flags a program whose assigned CIP is not in the current
TOP→CIP crosswalk, and offers a picker to fix it. Jenni (Chancellor's Office, who will own the
tab) reported that Child Development appeared to map to exactly one CIP — `19.0709`, CTE —
when the crosswalk approves 17, and many colleges need `19.0706`, Non-CTE, because the program's
designation is changing in the Fall 2026 transition.

The data was never wrong. `topcip["1305.00"]` held all 17 codes the whole time. The picker that
would have shown them was written as part of the error path.

## The claim

**When a control is rendered only inside a failure branch, its absence silently asserts that
there is nothing to decide.** The user cannot distinguish "the tool has nothing else to offer"
from "the tool has plenty to offer and is not showing you." Both look like one option.

This is worse than a missing feature, because the gate is *plausible*: revising a code you were
told is broken is obviously useful, so the branch reads as correct when you write it. The case
it excludes — a value that passes validation but is not the one you want — is the larger
population by far. Here, of the 600 statewide programs on TOP 1305.00, **205 sat on a valid
`19.0709` and saw no alternatives at all**; only the ones already flagged could see the list.

The general shape:

- Validation answers *is this allowed?*
- The user is asking *which of the allowed things should I pick?*

An interface that only surfaces choices when validation fails answers the first question and
hides the second. **Gate the warning on the problem; never gate the choice.**

## How to spot it

Ask of any picker, panel, or "change this" control: *what condition renders it?* If the answer
names a defect (`needsRevision`, `hasError`, `isStale`, `mismatch`), check what the population
looks like on the healthy side. If a user on the healthy side would still reasonably want the
control, the gate is wrong — invert it, and let the defect decide only whether the control
opens **expanded** rather than whether it exists.

That is the fix that shipped: the option list renders on every program row, and the
needs-revision flag now only decides whether it starts open.

## Corroborating detail worth keeping

- **91% of TOP codes map to more than one CIP** (381 of 419; median 5, median 3 excluding the two
  universal noncredit boilerplate codes). Single-valued is the exception, not the rule — so a
  UI that reads as single-valued is wrong almost everywhere it appears.
- **Reproducing an authority's own table is a cheap, strong check.** Rendering TOP 1305.00 and
  comparing it line-by-line against the Chancellor's Office's published TOP↔CIP table matched
  on all 17 codes, titles, and CTE categories — which localised the remaining difference to one
  column (peer college counts, 11 of 17 exact, the rest slightly higher) and identified it as a
  vintage difference in our COCI export rather than a defect. **Name the source and date of a
  column that nearly-but-not-exactly matches an authority's;** an undated near-match invites
  doubt about the whole surface, a dated one invites reconciliation.

## See also

- [[cip_crosswalk_lessons]] — the workstream story, 2026-08-11 section.
- [[methodology-top-is-a-last-in-line-signal]] — why the crosswalk proposes and never decides.
