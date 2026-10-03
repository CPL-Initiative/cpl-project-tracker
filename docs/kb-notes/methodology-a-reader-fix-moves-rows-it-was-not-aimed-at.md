---
title: A reader fix moves rows it was not aimed at, so compare each full read row by row
created: 2026-10-03
updated: 2026-10-03
tags: [methodology, census, scraping, verification]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/program_requirements_harvest_lessons]]"
  - "[[docs/reference/lanes/program-requirements-harvest]]"
artifacts:
  - kb/_program_source_census.py
  - tests/program_source_census_test.py
---

# A reader fix moves rows it was not aimed at, so compare each full read row by row

> **When a rule-based reader changes, keep the last full read and compare every
> row against it before merging; a fix for five rows routinely breaks two
> others, and a summary count hides the swap.**

## Context

The program-source census reads 118 college websites and files one row per
college: the catalog's address, year and platform. S321 changed its rules in
three rounds, each tested in isolation and each checked by a full four-slice
dry run on a GitHub runner. Lessons 12 to 15 in
`docs/program_requirements_harvest_lessons.md` hold the detail.

## The claim

A reader's rules interact through the pages they choose to read. A rule aimed
at one college changes which links count, and that changes which hub pages, which
candidates and which hops every other college sees.

- **Round one** read hidden menu text (`textContent`) to find Compton's and Rio
  Hondo's catalog links. The same change made more hub links match, so Diablo
  Valley read different hub pages and lost its eLumen catalog. Merced gained a
  new "Course Catalog" candidate that led to a 2025-26 addendum PDF instead of
  its Coursedog host.
- **Round two** dropped addenda from a catalog index. Yuba's page lists exactly
  a catalog and its addendum, so the filter left one yearly link, under the
  index's threshold of two, and Yuba lost its 2026-27 PDF.

The totals improved in every round (109, 110, 112, 112 catalog addresses), so a
summary would have passed each regression. Only the row-by-row comparison
named them.

**The practice:**
1. Keep each full read's rows (the census prints them as JSON lines in its job
   log).
2. Diff the new read against the previous one and against the first, keyed by
   the stable name, on the fields that matter (address, year, platform,
   access).
3. Read the evidence for every row that moved the wrong way before writing a
   new rule, and write the rule from that evidence.
4. Merge only when no row is worse than in the first read.

## How we got here

PR #1839 (2026-10-03): runs 37137334059, 37139324090, 37140411314 and
37141321117. Each round's fixes passed a guard in which removing any one rule
fails a check, and each round still regressed rows outside the guard's
fixtures. The guard proves a rule does what it says; only a full read proves
the rules together.

## When this applies (and when it doesn't)

It applies to any heuristic reader run over a fixed population: a scraper, a
classifier re-run over the catalog, a canonicalization pass over exhibit
titles. It matters most where one rule changes what the next rule sees
(candidates, hops, thresholds). A pure function scored row by row in isolation
still benefits, but its regressions stay inside the rows the change targets.

## See also

- `[[docs/program_requirements_harvest_lessons]]`: items 12 to 15
- `[[methodology-the-measuring-browser-can-hide-the-defect]]`: the
  browser-side counterpart
- PR #1839, the four reads above
