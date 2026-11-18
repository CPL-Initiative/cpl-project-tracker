---
title: A new matcher is gated by a self-recall test on records whose answer is already held
created: 2026-11-14
updated: 2026-11-14
tags: [methodology, program-requirements, catalog-harvest, matching]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/program_requirements_harvest_lessons]]"
  - "[[docs/reference/lanes/program-requirements-harvest]]"
artifacts:
  - kb/_harvest_ncl_lookup_census.py
---

# A new matcher is gated by a self-recall test on records whose answer is already held

> **Before a new matcher may say "not found" about anything, run it on records whose answer you already hold; where it
> misses those, its silence means nothing, so it records "not searched" instead.**

## Context

S652 built a lookup (slice A of issue #3299, draft #3300) that searches a college's catalog pages by program title and
award for the programs the Program Course File gives no closed course list. Sam's rule for catalog-first collection
says a program still not found after one second look is flagged "on COCI, not listed in the catalog" and leaves Still
to pass. That flag removes a program from a public base, so a false "not found" costs a program its place in the
count. Lessons: [`program_requirements_harvest_lessons`](../program_requirements_harvest_lessons.md), *S652*.

## The claim

A matcher's "no match" is evidence only where the matcher has shown it finds what is there. The test that shows it is
cheap and needs no labeling: the committed captures already hold thousands of program pages whose program is known.
Run the new matcher on those, and per college count how many it finds (recall) and whether it ever names a wrong page
(a false match).

Then gate the result on the test, college by college:

- A college whose self-test clears a recall floor (80% here) with no false match may report `not_matched` for an empty
  search, and that program stays in Still to pass.
- `not_listed`, the answer that moves a program out of the base, needs more than an empty search: the catalog's own
  program list, read, without the program on it.
- A college under the floor, or with any false match, reports `not_searched`. Its programs keep their old state.

## How we got here

The first title rule was strict. On the committed captures it found only 63% of the program pages the captures already
held. Had it shipped, about a third of the programs it searched for would have read as missing from catalogs that
print them. A second reader also found two structural faults the test exposed: Acalog pages folded to one address, and
twin programs on one page. After the fixes the same test finds 9,982 of 11,702 (85.3%) with no false match (Skyline 24
of 25, El Camino 97 of 102, Riverside City 138 of 140). The floor still holds back 23 of 83 site-read colleges, among
them Cerritos at 199 of 263; those colleges report `not_searched` until their own recall rises. The census script is
`kb/_harvest_ncl_lookup_census.py`.

## When this applies (and when it doesn't)

It applies to any matcher whose negative result changes a record, a count or a public figure: a title lookup, an
alias rule, a crosswalk join. It needs a held answer set from the same sources the matcher will read; a test on another
source's records measures another matcher. It does not apply where a miss costs nothing and is retried (a search box a
person reads), and a passing test does not license a matcher on a college it was not measured on.

## See also

- [`methodology-a-fill-must-check-what-it-fills`](methodology-a-fill-must-check-what-it-fills.md), the same caution for a
  rule that adds rather than removes.
- Issue #3299 (catalog-first collection; slices A, B and C); draft #3300 (slice A).

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
