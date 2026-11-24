---
title: A fill must check the units it fills, not the word that licenses it
created: 2026-11-14
updated: 2026-11-24
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
  - tests/reconcile_window_fill_test.py
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

## S714: the same fill over a window the reader cut off

The fill has a second branch: a record with no degree total whose sum falls short of the program total
(`electives_fill_degree`, `hi <= stated`) passes when *elective* appears anywhere in the text, about line 1478 of
`kb/_program_requirements_score.py`. On 2026-11-23 three free reconciles at the Los Rios colleges rescored records
outside the programs they were run for, and nine newly passed. A second reader found eight of them passing only
through that branch, while each record's own notes said its table opened mid-page with rows cut off: Sacramento City
04656, 07350 and 21418; Cosumnes River 04602 and 04614; Folsom Lake 15368, 39574 and 42612
(`f-elective-fill-passes-cut-off-windows-s714`). 04614 was one of S650's seven, so the same record reached a pass through a
fill twice, nine days apart, and was held both times. All nine went back to `main`'s filings unread (`d-elective-fill-rereads-held-s714`).

S655 had found the class at American River (07206: 20 of 32 courses placed, the window opening mid-table on page 429)
and pinned it in `tests/reconcile_window_fill_test.py`. That guard did not see the eight. It reads only the six
colleges of S655's wave, and its note pattern (*start of the table*, *not included*, *likely on page N*) matches none
of their notes, which say *cut off*, *begins mid-table* and *not supplied*. A guard keyed to one college's wording and
one wave's colleges is a self-recall test of the case that made it, and it reports nothing about the next one.

So the claim widens. A short sum has two causes the arithmetic cannot tell apart: units the catalog leaves to the
student, and rows the reader never saw. A fill must rule out the second before it claims the first, from what the
record says about its own window, and a guard on the fill must read every college, since the next reconcile can land
anywhere.

## S720: the fill reads the record's own window first

#3756 (`35854487`, 2026-11-24) put the claim into the scorer. Both electives fills, the program total's in `score()`
and the degree total's in `degree_verdict`, now read the record's own words before they fill: `window_cut` returns the
reader's sentence saying the requirements run outside the text (a table opening mid-page, rows cut off or on the
previous page, a missing course placed on another page), and the fill is refused with `fill_refused` naming
`section_cut_off`. A cut counts only beside a listed course the record explains as missing, and a sentence saying
nothing was lost is read first, so Cypress 37246, Riverside 43896, Folsom Lake 33791 and Cerritos 20493 keep their
passes and are pinned as negatives. The guard reads every college: a dry run over 18,960 committed records took away
15 passes and added none. American River 04544 was the one filed false pass; its correction and the nine Los Rios
records' `section_cut_off` named gaps went live the same night (#3759). The reconcile now keeps a filed named gap
while its rule still names it (`keep_named_gaps`), so a rescore no longer drops one.

## When this applies (and when it doesn't)

Any rule that lets a named slack (electives, "as needed to reach 60", GE double counting) close an arithmetic gap.
A fill to the degree total after a complete major, where the catalog prints *"electives as needed to reach 60"*, is
the case the fill was built for, and the word guard serves it. The fault is the fill reaching inside the major.

## See also

- `[[docs/program_requirements_harvest_lessons]]`: S650, the Cosumnes River plan
- PR `#3288`: the two pinned rows loaded, the seven held
- `[[docs/program_requirements_harvest_lessons]]`: S714, the reconciles that reached past the pins
- PR `#3715`: the nine held back to `main`'s filings
- PR `#3756`: the fill reads the record's window; `keep_named_gaps`
- PR `#3759`: American River 04544 and the nine `section_cut_off` named gaps
- `[[methodology-a-record-level-join-needs-a-word-guard]]`: a word guard where a word is the right test

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
