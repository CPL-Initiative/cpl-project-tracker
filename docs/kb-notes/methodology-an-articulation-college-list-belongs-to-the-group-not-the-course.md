---
title: An articulation's college list belongs to the group, not to each course in it
created: 2026-09-14
updated: 2026-09-14
tags: [methodology, cpl, crosswalk, articulation, data-quality, map, coci]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-follow-the-recommendation-to-the-course-that-receives-it]]"
  - "[[methodology-a-liveness-set-must-be-able-to-contain-what-it-judges]]"
  - "[[docs/statewide_fire_electrical_crosswalk_lessons]]"
artifacts:
  - kb/_build_occupation_cpl_crosswalk.py
  - kb/sjcoe_occupation_scope_map.json
---

# An articulation's college list belongs to the group, not to each course in it

> **One-sentence summary** — In `credential_reference_data.js` an articulation
> carries a set of local course variants and a set of colleges, and the colleges
> belong to the articulation as a whole; joining them pairwise invents courses the
> named college does not teach, and the invented rows are indistinguishable from
> the real ones until you check each pair against that college's own catalog.

## Context

A credential's articulation record looks like it hands you the join you want:

```json
{"cid": "FIRE 130 X",
 "local": [{"subj": "FIRE", "num": "104", "t": "Building Construction…",
            "colleges": ["Columbia College", "Glendale Community College", "Santa Ana College"]}]}
```

Read literally, each `local` entry names a course and the colleges that offer it.
That reading is right often enough to pass a spot check — 57% of multi-course
articulations do carry a distinct college list per course — and wrong in exactly
the cases that matter most, the large C-ID-keyed groups where many colleges teach
the same course under many different subject prefixes.

## The claim

**The `colleges` on a `local` entry are the colleges in the ARTICULATION, not the
colleges that list THAT subject and number. Re-attach every course to its college
through the COCI per-college catalog before emitting it.**

Measured 2026-09-14, building the SJCOE Electrical / Fire / Wildland crosswalk.
For one cell — occupation *Fire Apparatus Engineer*, college *San Diego Miramar*,
exhibit *Firefighter 1* — the pairwise join produced **27 course rows**. Miramar's
fire prefix is `FIPT`; it teaches **6** of them. The other 21 were other colleges'
prefixes for the same three receiving courses: `FIRE B1` (Bakersfield),
`FIRETEC 2` (Chaffey), `FT 1`, `FSC 111`, `F SC 53`, `FIR 104`, `FTC 101`.

Across the whole build the pairwise join yielded **7,332 rows**; gating each row on
`(college, subject, number)` appearing in that college's COCI catalog left
**3,207**. **4,106 rows — 56% — named a course at a college that does not offer
it.** Every one carried a real exhibit ID, a real credit recommendation, a real
college and a real course title. Nothing about a phantom row looks wrong.

## Why the bad reading survives a spot check

The tell is inverted from the usual one. Checking a *small* articulation confirms
the literal reading, because a two-college group genuinely does have both colleges
on both courses. The error scales with the size of the group, so **the more
important the credential, the more wrong the join** — Firefighter 1 is the most
adopted fire credential in MAP and the worst offender.

This is the same shape as
[[methodology-a-liveness-set-must-be-able-to-contain-what-it-judges]]: the question
is not whether the field is populated but whether the set it names can mean what
you are about to make it mean. `colleges` can contain "colleges in this
articulation". It was never able to contain "colleges teaching this subject and
number", and no amount of sampling inside the field reveals that.

## What to do instead

1. Join the credential to its colleges through `adopter_names` (did this college
   adopt the exhibit at all?).
2. Join the course to its college through the **COCI per-college catalog**
   (`tmc_college_courses.js`, 120 colleges / 143,646 courses) — does this college
   list this subject and number?
3. Emit only pairs that pass both, and **take the course title from the catalog**,
   so the row shows the student the title their college actually uses.
4. Count what the gate dropped and put the number in the run receipt. A gate whose
   drop count nobody looks at is a gate that can silently stop working.

## Corollary: the discipline on an articulation is the COURSE's, not the credential's

The same record's `disc` describes the unified course, and drifts from the
credential that recommends it — it labeled *CEM 155 Blueprint Reading* under
*General Electrician Certification* as **Welding**. A column answering "the
discipline of the credit recommendation" must come from the credential
(`disc_modal`), with the articulation's value as fallback and not the reverse.

## Corollary: the platform's own taxonomy outranks a regex built to approximate it

MAP publishes its statewide CPL program areas at `map.rccd.edu/statewidecpl/`,
mirrored in `kb/statewide_exhibit_categories.json`. A lane regex written in this
repo is an *approximation* of that taxonomy, and the two disagree on the rows that
matter: MAP files **Firefighter EMT Certificate** and **Fire Fighter Paramedic
Journeyperson Certificate** under **Emergency Medical Services**, a category
distinct from Fire Technology, and its own fallback patterns test
`paramedic` / `emt` / `emergency medical` **before** `fire` precisely so a
fire-shaped title does not capture them. A session reading the titles alone will
put them under Fire and be wrong by the platform's own definition.

Scope an exhibit in MAP's order — explicit assignment, then MAP's patterns, then a
repo regex only for titles MAP's list does not reach (overwhelmingly local
exhibits). ⚠️ **MAP has no Electrical category**: its electrical credentials sit
inside Construction Technology beside masonry, plumbing and carpentry, so that
category needs a trade test on top rather than wholesale inclusion.

## Scope

Applies to any consumer of `credential_reference_data.js` `articulations[].local[]`
that needs a per-college answer: crosswalks, college action pages, Sierra retrieval
over adoption data, and any "which course at my college" surface. It does not
affect counts taken at the credential or college level, which never form the pair.
