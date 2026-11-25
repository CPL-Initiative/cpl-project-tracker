---
title: A self-check must see what the rule writes
created: 2026-11-18
updated: 2026-11-25
tags: [methodology, self-check, data-quality, rule-10, program-requirements-harvest]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/program_requirements_harvest_lessons]]"
  - "[[docs/engineering_practices_lessons]]"
  - "[[docs/kb-notes/methodology-a-new-matcher-is-gated-by-a-self-recall-test]]"
artifacts:
  - kb/_program_requirements_units_rules.py
  - unified_courses_members.js
  - tests/course_outcomes_objectives_standing_test.py
  - .github/workflows/course-outcomes-load.yml
  - docs/reference/scheduled_sessions.md
---

# A self-check must see what the rule writes

> **A check that gates a write must compare the fields the write changes against an independent source.** A check on
> a total, a count or a "complete" flag passes while every per-row value under it is wrong.

## Context

Two writes on 2026-11-18 (S681) passed their checks and were wrong. Units rule A4 passed a self-check of 74 of 74
while writing wrong units on individual courses. Chabot's outline load ran when its read reported every slice
complete, and posted 1,013 rows whose course objectives were filed as student learning outcomes. Each check was
honest about what it measured, and neither measured what the write changed. Full story:
`docs/program_requirements_harvest_lessons.md` and `docs/engineering_practices_lessons.md`, *S681*.

## The claim

Before trusting a gate, list the fields the write sets, and ask whether the gate reads each one against a source the
rule did not produce. When it reads a derived figure (a total, a count) or a process state (slices filed, a run
succeeded), the gate cannot fail on a wrong per-row value, and a pass says nothing about it.

### Worked example 1: A4's totals

A4 fills units for a paired alternative. On Coastline 18223, SPAN C180A, C180B, C185A and C185B together replace SPAN
C180 (5 units). A4 copied 5 units onto each member; the state course file (`unified_courses_members.js`) stores 2.5
each. The program's 18-unit total is right either way, so the self-check, which scored totals, read 74 of 74. A second
reader compared each member's units with the state file and found the class already live in an applied set. Over 35
A4 records the per-course check read 40 right and 55 wrong before the fix, 66 right and 25 wrong after.

### Worked example 2: a load gated on "slices complete"

The outline workflow loads a college when every slice of its read has filed. Chabot prints objectives under
`Measurable Objectives:` and outcomes under `3. Student Learning Outcomes`; the reader knew neither heading and filed
every course's objectives with `kind` `slo`. Completeness was true, so the load ran. The objectives standing test,
which reads the kinds the load writes, was already red on the read's branch (checks 8 and 9), but a runner's commit
gets no CI and nothing ran it before the load. The rollback deleted exactly the 1,013 rows from the load receipt.

## How we got here

Second readers caught both, after the self-checks had passed: the A4 finding before its corrective write
(#3508), the Chabot finding on the wave pull request after the load (#3509, #3492). The procedure fix runs the
standing test on the branch before `.load` is pushed (`docs/reference/scheduled_sessions.md` step 11); the workflow
guard is open work.

## When this applies (and when it doesn't)

It applies to any gate before a data write: a rule's self-check, a load trigger, a count guard. A count guard (the
`UPDATE` must match exactly N rows) still earns its place: it guards which rows are touched, and it says nothing about
the values written to them. A total is enough only when the total is the field the rule writes. The independent source
must be one the rule did not read to produce its answer, or the check is circular (the second reader's finding on
#3508's pair call scored against its own rule).

## S731: a recall that counted verdicts, and a run that reported success

Two more gates read something other than what the rule wrote, on 2026-11-25.

The pooled reading's change (plan s731p, behind `POOLED_S731`) joins a list heading to the list it continues, as in
"LIST A" and "LIST B CONTINUED". Its self-recall over all 18,962 filed records counted readings and verdicts: 18
records read differently and none moved from passing to failing. The second reader counted the joins: 26, of which 4
were right and 22 joined headings by position alone. The recall's figures had no place to show a wrong join. The join
now needs the first stem word to match, and a "LIST B CONTINUED" after "LIST A" still joins, a finding for the next fix.

At West Valley a read ended green and filed only its preview. Its price step held a capture restaged from before page
counting as partial and skipped extraction; the load after it re-posted 133 rows already live. "The run succeeded" is
the process state this note's claim names, and it said nothing about what the read filed. A fresh read put the two
records live.

The practice gains one line: a recall counts each thing the rule does (here, each join) beside the verdicts, and a
run's result is read from what it filed.

Source: `docs/program_requirements_harvest_lessons.md`, *S731*; `cpl_memory` `p-pooled-change-opus-reader-recall-s731`
and `f-green-read-files-only-preview-s731`.

## See also

- `[[docs/kb-notes/methodology-a-new-matcher-is-gated-by-a-self-recall-test]]`: the sibling rule for matchers
- `[[docs/program_requirements_harvest_lessons]]`, *S681* and *S731*
- PRs `#3508` (A4), `#3492` (Chabot's reader fix and rollback), `#3509` (the wave)

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
