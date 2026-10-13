---
title: A lead-in sentence is not a section heading
created: 2026-10-12
updated: 2026-10-12
tags: [methodology, course-outlines, harvest]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[program_requirements_harvest_lessons]]"
  - "[[methodology-a-sign-in-form-is-no-proof-of-a-closed-system]]"
artifacts:
  - kb/_course_outcomes_read.py
  - tests/course_outcomes_read_test.py
  - kb/course_outcomes/trial_38317539422/
---

# A lead-in sentence is not a section heading

> A course outline opens its objectives and its student learning outcomes with the same sentence, so a reader that finds the SLOs by that sentence reads the objectives; find the section by its label, and test the reader on pages the host actually served.

## Context

The program requirements harvest reads each course's SLOs exactly as printed (Sam, Open Asks Sheet 70 card 3). Faculty assess a CPL request against those outcomes, and the industry credential skills are matched to them, so reading the wrong list is a quiet error: it looks complete and reads plausibly.

## The claim

Outline systems write a stock lead-in before more than one list. Riverside Community College District's integrated outline prints *Course Objectives* and then *Student Learning Outcomes*, each followed by *"Upon successful completion of the course, students should be able to demonstrate the following …"* (*activities* for the first, *skills* for the second). Any rule that treats the lead-in as the start of the outcomes takes whichever list comes first.

Find the section by its own label: the element whose title reads Student (or Course) Learning Outcomes, and the list inside it. Read the HTML where the host prints structure; fall back to page text only where it does not, and even then take the labeled heading before the lead-in. Expect the list to hold more than outcomes: RCCD nests the institutional outcome each SLO maps to (*Critical Thinking*) as a list inside the item, which a text reader cannot tell from an SLO.

Before reading every course, read a dozen and file what the host served (the page's text and its HTML). Write the parser against those files and keep them as the test's fixtures. A fixture written from memory encodes the same assumption as the parser.

## How we got here

S374's trial (run 38317539422) read twelve RCCD outlines, one per subject, with a parser built on the course outline census's heading rule. Every page came back as a clean list, and every list was the objectives. The filed pages showed the two sections and the nested institutional outcomes; the HTML parser read 38 SLOs from the same twelve, and `tests/course_outcomes_read_test.py` checks that no SLO it reads appears in the objectives section of any filed page. Slice 1 of the full read then parsed all 402 outlines from the HTML.

## When this applies (and when it doesn't)

Any document type with repeated stock phrasing across sections: course outlines on every system (curriQunet, eLumen, CourseLeaf), program pages that open *Program Learning Outcomes* and *Career Opportunities* the same way, catalog entries. It does not apply where a host prints one list with no other section sharing its lead-in, though checking costs one filed trial.

## See also

- [Program requirements harvest lessons, S374](../program_requirements_harvest_lessons.md)
- [A sign-in form is no proof of a closed system](methodology-a-sign-in-form-is-no-proof-of-a-closed-system.md): the other S373-S374 lesson from opening one more page before classifying a host.
