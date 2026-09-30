---
title: The floor belongs to each figure
created: 2026-09-30
updated: 2026-09-30
tags: [methodology, privacy, disclosure-control, student-data, suppression]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-small-cell-suppression-must-survive-subtraction]]"
  - "[[docs/kb-notes/adr-student-detail-aggregate-disclosure-control]]"
  - "[[docs/student_detail_load_lessons]]"
artifacts:
  - kb/supabase_map_college_credit_summary.sql
  - kb/supabase_map_promote_custom_reports.sql
  - kb/receipts/map_college_credit_summary_per_figure_2026-09-30.sql
  - tests/college_briefing_withheld_figure.test.js
---

# The floor belongs to each figure

> **One-sentence summary** — a row that passes a small-cell floor can still
> publish a figure that fails it, because each figure on the row stands on its
> own subset of the row's people; test the people behind every figure.

## Context

`map_college_credit_summary` publishes one row per college: CPL students, units
at each disposition, units transcribed. Its suppression tested one number, the
college's student headcount, and published every figure on a row that passed.
On 2026-09-30 that turned out to publish transcribed totals from single students.
Workstream: [`student_detail_load_lessons`](../student_detail_load_lessons.md)
(2026-09-30 section).

## The claim

**A floor is a property of a figure, and a row is a bundle of figures.** Each
figure counts a different subset of the row's people: everyone with CPL credit,
the students whose credit sits on a plan, the few whose credit a college has
transcribed. The row's headcount bounds the largest subset and says nothing
about the smallest.

So the test runs once per published figure, on the distinct people behind that
figure:

- **Count per figure.** Carry a student count beside every unit figure
  (`students_applied` beside `applied_in_plan`), computed from the same rows as
  the figure, so the test and the value cannot drift apart.
- **Withhold the figure and its units together.** At one student, the unit
  figure *is* that student's record.
- **Record what was withheld.** A `withheld` array on the row lets a consumer
  render "<10 students" instead of reading a `null` as zero (My College's
  `num(null)` had been a false zero).
- **Then run the complement.** A withheld figure that a published sibling or
  total recovers by subtraction is still published; see
  [`methodology-small-cell-suppression-must-survive-subtraction`](methodology-small-cell-suppression-must-survive-subtraction.md).
  At 13 colleges, `applied_credits − articulated_waiting` recovered a thin
  in-plan figure after the per-figure test alone.

## How we got here

Measured 2026-09-30: of 99 published colleges, 8 showed transcribed units from
fewer than 10 students (3 from one student) and 3 showed applied units from
fewer than 10. The anon-readable `_pub` copy carried the same figures. Every row
had passed the headcount floor. #1777 rebuilt the summary to count per figure;
the live rebuild withheld transcribed at 8 colleges, applied at 15, applied in
plan at 13, waiting at 2 and dormant at 2, and published 113 rows.

## When this applies (and when it doesn't)

Any grouped publication of person-level data where figures on one row come from
different filters: disposition stages, program subsets, demographic breakouts,
funding measures. It does not apply to a row whose every figure counts the same
people (a pure headcount table), where the row floor and the figure floor
coincide.

## See also

- [`adr-student-detail-aggregate-disclosure-control`](adr-student-detail-aggregate-disclosure-control.md) — the k=10 floor and decision 5 (a withheld remainder under a real total spans two cells and ten students).
- `kb/receipts/map_college_credit_summary_per_figure_2026-09-30.sql` — before/after function definitions and the live result.
- PR #1777 — the rebuild and the My College "<10 students" rendering.

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
