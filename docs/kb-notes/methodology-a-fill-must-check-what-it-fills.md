---
title: A fill must check the units it fills, not the word that licenses it
created: 2026-11-14
updated: 2026-11-14
tags: [methodology, program-requirements-harvest, scorer, guards]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/program_requirements_harvest_lessons]]"
  - "[[methodology-a-record-level-join-needs-a-word-guard]]"
artifacts:
  - kb/_program_requirements_score.py
  - kb/_program_requirements_reconcile.py
---

# A fill must check the units it fills, not the word that licenses it

> **When a scorer lets "electives" fill the gap between a record's placed units and a total, the guard must measure the gap against what the catalog leaves open; a guard that only looks for the word passes any program that mentions electives anywhere.**

## Context

The harvest's scorer lets a degree record pass the arithmetic check when electives fill the rest of the degree total
(`electives_fill_degree`). Its guard, `electives_named` in `kb/_program_requirements_score.py`, accepts the record when
the catalog text contains the word *elective* (or a filed sentence that says the same). See
[[docs/program_requirements_harvest_lessons]], *S650*.

## The claim

A fill closes a gap. The guard on it must ask whether the gap is one the catalog leaves to the student, and how big it
is: the major's units placed against the major's printed total, with the open units the catalog names. A word match
answers a different question (whether the page mentions electives), and nearly every degree page does. So the word
guard passes records whose major is incomplete because the reader missed courses, and the fill hides the miss.

## How we got here

S650's second reader, reading the Cosumnes River plan before its free capture (#3288), reproduced the class: the
program-total fill filled a degree's major total, and 11338 (6 of 24 major units placed) and 04614 (ten course codes
missing) would have passed on the rescore alone. The conductor held the seven rescore-only passes for the one dry run of
the passing-function changes, which carries the fix (`p-degree-electives-fill-false-pass-s650`).

## When this applies (and when it doesn't)

Any rule that lets a named slack (electives, "as needed to reach 60", GE double counting) close an arithmetic gap.
A fill to the degree total after a complete major, where the catalog prints *"electives as needed to reach 60"*, is
the case the fill was built for, and the word guard serves it. The fault is the fill reaching inside the major.

## See also

- `[[docs/program_requirements_harvest_lessons]]`: S650, the Cosumnes River plan
- PR `#3288`: the two pinned rows loaded, the seven held
- `[[methodology-a-record-level-join-needs-a-word-guard]]`: a word guard where a word is the right test

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
