---
title: Trace a data finding to what students received before raising it with a college
created: 2026-10-05
updated: 2026-10-05
tags: [methodology, cleanup, map-data, college-facing, measure-first]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/program_requirements_harvest_lessons]]"
  - "[[methodology-verify-consumer-before-migrating]]"
artifacts:
  - kb/_build_roep_display.py
  - kb/_seed_coci_articulations.py
---

# Trace a data finding to what students received before raising it with a college

> **One-sentence summary**: before a finding about a college's MAP data goes to the college, find the
> rows it comes from in each MAP view that holds it, and check the student-grain table for what was
> actually awarded; the difference decides what the college is told.

## Context

Eight session handoffs (S327 to S334) carried one line: *raise Miramar's AUTO 156G articulations (EMT,
Driver Operator 1B) in the clean-up lane.* The display build had shown an EMT Certification and a Driver
Operator 1B credential on Miramar's AUTO 156G Engine and Related Systems, and the line read as "Miramar
awards EMT credit on an engine course." S335 traced it before writing anything to the college
(lessons doc, S335).

## The claim

MAP keeps the same articulation in more than one view, and the views can disagree. A finding drawn from
one view is a lead until the other views agree with it.

1. **Find the source row.** `kb/coci_articulations.json` reads one course per row of MAP's
   articulated-exhibit view (`_seed_coci_articulations.py`), so a course it lists came from a MAP row,
   not from a join. Miramar's two credentials sat on AUTO 156G there.
2. **Check what students received.** `map_college_cr_unit` (student grain, aggregated) put both
   exhibits on EMGM-106 and FIPT-321P at 0.25 hours, the courses whose titles match the
   recommendations. No student received either credit through AUTO 156G.
3. **Say the difference, not the first reading.** MAP's 0.3-hour versions of the two recommendations
   list AUTO 156G beside the right course. That is a record for the college to tidy. Writing "AUTO 156G
   carries EMT credit" would have sent the college looking for awards that do not exist.

The test that found it generalizes, with one guard that matters. "The recommendation shares no word
with the course title, and another course at the college does" matched 18 rows statewide, mostly
right; requiring the stray course to sit in another subject than the matching course left three
(`second_courses()` in `kb/_build_roep_display.py`). A record shared by several colleges is skipped,
because merged records carry other colleges' course codes.

## How we got here

S327 saw the credential on the display and called it a clean-up item. Nobody opened the student-grain
table for eight sessions, because the line already named the action. S335 queried
`map_college_cr_unit` for the two exhibit ids before drafting, which took one read.

## Where this applies

Any college-facing finding drawn from MAP data: clean-up worklist classes, harvest-tab drafts, My
College to-dos, Sierra's gaps. Run the student-grain read first; it is one query and it changes the
sentence the college receives.
