---
title: A program's CIP labels the program, not the courses it lists
created: 2026-09-25
updated: 2026-09-25
tags: [methodology, cip, top-code, program-course-graph, eacr, data-quality]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-top-is-a-last-in-line-signal]]"
  - "[[eacr_scope_lessons]]"
artifacts:
  - kb/program_course_graph.json
  - kb/_build_program_course_graph.py
  - excel_to_dashboard.py
---

# A program's CIP labels the program, not the courses it lists

> **One-sentence summary** — the CIP on a COCI program is a reliable label for
> that program, but a course takes the field of every program that requires it,
> so voting a course's field from the programs that list it sends Italian to
> Culinary and Calculus to Physical Sciences; read the course's own CIP, and use
> program membership only to corroborate.

## Context

The Exhibit Adoption view files each credential under a CIP sector. Its first
route ran through TOP codes, which colleges enter with no effective check. Sam,
2026-09-25: *"The course CIPs are only partially set now [and] the program CIPs
are almost 100% reliable."* The obvious next route was to read a course's CIP
from the programs that list it. It measured worse than the TOP route it would
have replaced. Full story: [`eacr_scope_lessons`](../eacr_scope_lessons.md).

## The claim

**Program membership describes what a program requires, not what a course is.**
A program lists its own courses, and it also lists the service courses it
requires from other fields: a language for a hospitality degree, calculus for
an engineering degree, word processing for a medical-office certificate, a
general-education history course for every Liberal Arts pattern. A vote across
the programs that list a course therefore returns the course's own field only
when its home program outnumbers the programs that borrow it. Career-technical
courses usually meet that condition, because they live in their own programs.
Academic and general-education courses often do not.

**The program CIP is still a reliable label for the program itself.** Nothing
here disputes Sam's reading of program CIPs. The error enters in the step from
"this program is Culinary Arts" to "every course it lists is culinary".

**For a course, read the course's own CIP.** Where it is not set yet, fall back
to the course's other signals (TOP, last in line), and let program membership
corroborate rather than decide.

## How we got here

Measured 2026-09-25 on the published EACR payload (3,000 matrix rows). The
program route joined each (college, articulated course) pair to the COCI
programs listing that course (`kb/program_course_graph.json`, colleges matched
on the MIS college code, course numbers compared without leading zeros) and
voted the programs' CIP families, with Liberal Arts (24) and Interdisciplinary
(30) programs voting only when no other program listed the course.

- It sectored 2,244 of 3,000 rows, against 2,621 for the TOP route.
- The largest disagreement groups favored it: culinary cards 19 → 12, FAA pilot
  certificates 47 → 49, water treatment 03 → 15, welding and ironworker
  apprenticeships 15 → 48.
- A random 30 of the 682 rows it would have moved: 8 better, 15 worse, 7 no
  different. The worse ones were service courses: Elementary Italian → 12
  Culinary, Beginning Chinese and AP Japanese → 05 Area Studies, Calculus 1 →
  40 Physical Sciences, AP US Government → 22 Legal, Microsoft Word Expert → 51
  Health, Emergency Medical Responder → 43 Fire.

The route was not shipped. The biggest-groups check alone would have shipped
it, because those groups are all career-technical.

## When this applies (and when it doesn't)

- **Applies** whenever a course-level attribute (field, sector, discipline) is
  inferred from the programs that contain the course, including after the fall
  2026 TOP-to-CIP cutover.
- **Does not apply** to questions about programs: a program's CIP answers
  "what field is this program" directly and reliably.
- **Weaker for career-technical courses**, where membership tracks the course's
  field closely; a route restricted to them would do better, but a credential's
  type does not tell you which kind of course it articulates to (an industry
  certification in Microsoft Word articulated to a medical-office course).
- **As a corroborator it is sound**: where the program vote and another
  independent signal agree, both gain weight.

## See also

- [`methodology-top-is-a-last-in-line-signal`](methodology-top-is-a-last-in-line-signal.md): why TOP sits last.
- [`lanes/eacr-exhibit-cr-adoption`](../reference/lanes/eacr-exhibit-cr-adoption.md): what the EACR used instead, title rules for a filter-only sector (Sam, 2026-09-25).
