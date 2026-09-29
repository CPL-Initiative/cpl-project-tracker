---
title: A filter, the column that justifies it, and the export must share one source
created: 2026-08-16
updated: 2026-08-16
tags: [methodology, filters, ui, exports, data-quality, provenance]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[eacr_scope_lessons]]"
  - "[[methodology-a-provenance-label-must-say-why-not-what]]"
artifacts:
  - statewide_interactive.js
  - tests/eacr_scope.test.js
---

# A filter, the column that justifies it, and the export must share one source

> **One-sentence summary** — when a filter widens a result set on one signal
> while the column beside it displays a different signal, the row is returned by
> one claim and justified by another, and the export layer is the copy that
> escapes the building.

## Context

The EACR tab's College filter matched on `adopter_names ∪ potential_names`, where
"potential" is *every college with a program of study under the same TOP code*.
Measured: **93.6% of College-filter hits were not adoptions** — filtering to
Pasadena City College returned 1,790 cards, of which it had adopted 44. The
median card carried 1 adopter and 41 potentials.

Fixing the filter is the obvious half. The half that is easy to miss is that the
same conflation lives in at least two more places, and one of them travels.

## The claim

**Three surfaces state the same relationship, and they must be derived from one
function, not three reads of the underlying field.**

1. **The filter** — which rows come back.
2. **The column** — why this row came back.
3. **The export** — the artifact someone forwards.

When these diverge, each failure has a different cost:

- Filter and column disagreeing produces a row the user cannot account for. They
  see a college in the "why" column that is not the college they filtered on, or
  a count that does not match the list beneath it.
- **The export is worse, because it outlives the screen that produced it.** A
  spreadsheet titled "Potential Adopters" reaches a college by email with no
  memory of which toggle was set when it was generated. Nobody who opens it can
  recover the scope.

So the rule has a corollary: **an export must state the scope that produced it,
in the artifact itself.** A CSV gets a provenance line, a JSON gets a `_scope`
field and a `_scope_meaning` sentence, a generated document prints it under the
title. Not a filename convention — filenames get renamed.

**And keep the raw field under its own name.** When the export re-keys
`potential_names` to `could_adopt_names`, ship both. Nothing is lost; the raw
field simply stops masquerading as the answer to a question it does not answer.

## How we got here

Session 162 (2026-08-16), across two PRs — and the second one is the lesson.

**#1221** fixed the filter and the column together: `collegeNamesFor(e, scope)`
drives the filter, `couldAdoptNamesFor(e, scope)` drives the column, both keyed
on one `state.collegeScope`. That felt complete.

**#1222** existed because of a re-read against the *user's stated goal* rather
than against the diff. Sam's goal was "one stop shopping … and a convenient view
to see the colleges that could adopt". Walking the tab as a person pursuing that
goal reached the Export button — and Excel, JSON and the Word report each still
read `e.potential_names` directly. Whichever scope was selected on screen, the
file that left carried the full 41-college TOP overlap.

The test that matters is the cheap one: **scope=adopted must export a strictly
narrower list than scope=any.** It fails on the pre-fix source and passes after.

## Consequences

- When you scope a filter, grep the field you just stopped trusting. If
  `potential_names` appears anywhere outside the one function that now owns it,
  that is a surface still telling the old story.
- Exports are a first-class consumer, not a formatting detail. They deserve the
  same test coverage as the view.
- A column header is an assertion. "Potential Adopters" asserted something the
  data could not support; "Colleges Could Adopt", under a stated scope, can.

## See also

- [[methodology-a-provenance-label-must-say-why-not-what]] — the chip half of the
  same problem: a label must say why a value is what it is.
- [[methodology-top-is-a-last-in-line-signal]] — why the TOP-derived branch could
  not carry the claim in the first place.
