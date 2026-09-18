---
title: "Typical" is a count of colleges across the whole catalog — generalize when the visitor's college is unnamed
created: 2026-09-18
updated: 2026-09-18
tags: [methodology, sierra, retrieval, catalog, prospective-credit, aggregation]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-the-record-cannot-say-which-credential-is-held]]"
  - "[[methodology-what-might-qualify-is-a-different-question-from-who-already-grants-it]]"
  - "[[methodology-an-index-is-a-write-path-cost-until-measured]]"
artifacts:
  - chatbox/supabase_program_typical_courses.sql
  - chatbox/verify_program_typical_courses.sql
  - chatbox/supabase/functions/cpl-chat/index.ts
  - tests/sierra_prospective_credit.test.js
---

# "Typical" is a count of colleges across the whole catalog — generalize when the visitor's college is unnamed

> **One-sentence summary** — When a visitor names the credential they hold but not where they earned it, the answer generalizes from the whole state: for each course name, how many of the colleges teaching the program list it, counted in colleges after the title is normalized, aggregated in the database because a PostgREST read silently stops at 1,000 rows.

## Context

Sam, reading cpl-chat v71's answer to his Orange County question
(2026-09-18): *"a quick list view of the typical CNA course next to typical
LVN courses. The user did not say where they did their CNA, so being able to
generalize is an added skill level for Sierra."* The prospective-credit block
already read the full course lists of the three colleges nearest the visitor.
It could say what Long Beach City teaches. It could not say what a CNA
program typically covers, because the visitor's own CNA came from a college
nobody named.

## The claim

A "typical course" in a program is a statement about the state, and it has
a measurement: the number of colleges teaching the program whose catalog lists
a course of that name. Three consequences follow.

**Count colleges, never rows.** A college that lists Theory, Lab and Clinical
sections of one course lists one course. `count(distinct college)` per
normalized title is the unit; the program's own college count is the
denominator the reader needs beside it (48 of 65, not 48).

**Normalize the title before counting, and keep the words that carry
meaning.** Faculty type titles: Nurse Assistant, Nursing Assistant, Certified
Nursing Assistant, NURSE ASSISTANT TRAINING PROGRAM, Nurse Assistant Theory —
one course to a counselor and five to GROUP BY. The normalizer folds
nurse/nursing, assistant/assisting, foundations/fundamentals, intro/
introduction, and drops the words that split a course into its delivery parts
and levels (theory, lab, clinical, I/II, A/B, training, program, certified).
It keeps the level words (fundamentals, introduction, basic, advanced): they
are what separates the entry course a credential holder can ask about from
the advanced one they cannot. Measured live: the fold took the CNA program's
leading family from seven titles at 11 colleges to one family at 48 of 65.

**Aggregate where the data is.** PostgREST caps a read at 1,000 rows and
says nothing when it cuts. Registered Nursing alone is 1,544 rows over 80
colleges; a raw read would return an alphabetical half of the state and call
it typical. A SQL function returns one row per program × title family (174
rows for CNA + LVN + RN together) in tens of milliseconds, with the colleges
array so a caller can fold further and still count colleges exactly.

## How we got here

`program_typical_courses()` and `cpl_course_title_norm()`
(`chatbox/supabase_program_typical_courses.sql`) were designed from the live
measurement on 2026-09-18 and verified by nine self-asserting checks
(`chatbox/verify_program_typical_courses.sql`): one signature, the grants, the
normalizer's folds, the CNA family at a threshold of 30 colleges (48
measured), counts never exceeding the denominator, the caps, the fail-safe
shapes, and the cost. cpl-chat v72 renders the result as a QUICK LIST in the
prospective block and the rule asks for a two-column table right after the
first paragraph: what the credential covers, beside what to ask about.

## When this applies (and when it doesn't)

It applies whenever the question names a program but no college: the held
credential's program, and the flyer's related programs. It does not replace
the course list at a named college, which is the course-level answer the
visitor acts on; the typical list is the counselor's orientation before it.
The thresholds in the tests are thresholds, never counts: a catalog refresh
moves the numbers and must not move the assertion.

## See also

- `docs/cpl_assistant_lessons.md` (2026-09-18, S276) — the session that built it.
- [[methodology-the-record-cannot-say-which-credential-is-held]] — why the held
  program is known at all.
- [[methodology-an-index-is-a-write-path-cost-until-measured]] — why there is
  no index on `top_code`.
