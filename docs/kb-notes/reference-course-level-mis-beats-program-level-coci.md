---
title: For "which colleges offer X", start at the course file, not the program file
created: 2026-08-12
updated: 2026-08-12
tags: [reference, coci, mis, top-codes, data-sources, crosswalk, noncredit]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-a-source-file-that-abbreviates-titles-fakes-an-absence]]"
  - "[[docs/futuro_hth_crosswalk_lessons]]"
artifacts:
  - kb/_build_futuro_hth_crosswalk.py
  - tmc/source_data/coci_program_export_2026-06-17.csv
---


# For "which colleges offer X", start at the course file, not the program file

## The measurement

Asked *"which California Community Colleges offer a CNA program?"*, the two
statewide inventories disagree by nearly 2×:

| Source | Grain | Colleges found |
|---|---|---:|
| `tmc/source_data/coci_program_export_2026-06-17.csv` | **program / award** | **32** |
| `kb/reference/cb_course_basic_fall2025.csv` | **course** | **61** |

Same TOP code (1230.30, Certified Nurse Assistant), same state, same year.
153 courses across those 61 colleges; 57 COCI program records across 32.

## Why the program file under-counts

A COCI program record exists only when a college created a **certificate or
degree** around the training. Many colleges deliver a state-regulated
occupational course **as a course** — very often **noncredit** — with no award
wrapped around it. In the CNA data, 34 of the 57 program records are noncredit
programs, and the colleges that never built an award simply do not appear.

This is not a data-quality defect in COCI. The two files answer different
questions:

- **COCI programs** → *"what credential can a student earn here?"*
- **MIS course basic** → *"what is actually taught here?"*

A partner asking where their people can get training, or where a credit
recommendation could land, is asking the **second** question.

## The rule

**Start at `cb_course_basic` for existence; use COCI for the award level.**
Report both — the award column is genuinely useful ("noncredit certificate" vs
"course only" changes the conversation with the college), but it must not be the
filter that decides whether a college is on the list at all.

Reporting only the program-level answer would have dropped **29 colleges** from a
statewide deliverable, and — worse — dropped them *silently*, since a shorter
list looks like a cleaner list.

## Caveats worth carrying

- `cb_course_basic` is a **term snapshot** (fall 2025 here). It shows what was on
  the books that term, not the live catalog. Say so in any deliverable.
- Neither file is the authority for **regulated occupational programs**. CNA
  training programs are approved by **CDPH**, not by the Chancellor's Office, so
  the true roster of approved CNA providers lives with CDPH. Both files here
  measure *the community college system's* footprint, which is the right scope
  for a CPL question and the wrong scope for "where can I train in California".
- `CB_CREDIT_STATUS` (`D` degree-applicable credit / `C` credit not
  degree-applicable / `N` noncredit) is the useful delivery split, and noncredit
  is heavily represented in exactly these occupational areas.
