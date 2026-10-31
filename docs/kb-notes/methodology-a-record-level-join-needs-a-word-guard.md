---
title: A join through a record's lists needs a word guard before anything saves on it
created: 2026-10-31
updated: 2026-10-31
tags: [methodology, joins, cer, exhibit-canonicalization, identity]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-an-articulation-college-list-belongs-to-the-group-not-the-course]]"
artifacts:
  - kb/_suggest_unclassified.py
  - kb/_cer_procedures.py
---

# A join through a record's lists needs a word guard before anything saves on it

> **When one record lists several courses and several colleges, pairing every course with every college invents joins; require the joined name to share a word with the source title before a rule saves on it.**

## Context

The CER's high school and ROP rule (Sam, Open Asks Sheet 147 card 2, 2026-10-31) names a held exhibit title by its
aligned course: the course the exhibit's credit recommendation names, joined through the identity layer to its CCN,
C-ID or M-ID. MAP's exhibit feed (`statewide_data.js`) gives each exhibit a list of credit-recommendation courses and a
list of articulating colleges, with no column saying which course belongs to which college. Lessons:
[`cer_v2_redesign_lessons.md`](../cer_v2_redesign_lessons.md) (2026-10-31).

## The claim

A record that carries two parallel lists (courses, colleges) holds their pairing only implicitly. A join that takes the
cross product and looks each pair up in a college-scoped catalog finds real courses that the record never meant:
"Anatomy/Physiology HS-AUSD" joined an entrepreneurship course, because another course on the same exhibit's list
existed at that college. Each joined row looks valid on its own; the error is in the pairing.

The cheap corroboration is the source title itself. Requiring the joined course's name to share one meaningful word with
the title it would name (stop words and method words removed) cut the aligned set from 374 to 209 of 450 titles on
2026-10-31 and removed every wrong join in a fourteen-title sample. The guard holds more than it needs to; a title it
drops goes to a person, which is the right failure for a rule that saves without one.

## How to apply

- Before writing a join, ask whether the source record states the pairing or only lists both sides.
- If it only lists them, add an independent corroboration (a shared word, a matching unit count, a single candidate)
  before any automated write, and count what the guard drops.
- Prefer holding to guessing when the output saves on the rule's word; a display-only proposal can show the unguarded
  join with its source.

## Evidence

- `kb/_suggest_unclassified.py` `aligned_courses()`: the guard and its comment.
- `tests/cer_procedures_test.py`: "a course that shares no word with the title is no alignment".
- Dry run, 2026-10-31: the rule settles 55 school titles and holds 29 on an issuer conflict.
