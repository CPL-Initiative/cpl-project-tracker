---
title: "Reference — TMC / ADT data model & the C-ID auto-match"
kb-status: published
kb-type: reference
date: 2026-06-16
tags: [reference, tmc, adt, c-id, coci, articulation, transfer]
related:
  - docs/tmc_builder_lessons.md
  - "§10 CLAUDE.md — C-ID / CCN numbering conventions"
  - kb/reference/cid_descriptors.json
---

# TMC / ADT data model & the C-ID auto-match

Distilled reference for anyone touching the **TMC Builder** tab or reasoning
about Transfer Model Curricula in this project.

## The transfer chain (who defines what)

```
C-ID descriptor  →  TMC (Transfer Model Curriculum)  →  ADT (AA-T / AS-T)
(one course,         (a discipline's required course      (the local degree a
 faculty-defined      set, built FROM C-ID descriptors,     college offers, built
 minimum content)     intersegmental CCC+CSU faculty)       to match a TMC)
```

- A **TMC** is a fixed, statewide template: *Required Core* + *List A/B/C*, each
  listing C-ID-described courses (and occasionally a "non-C-ID" requirement) with
  a minimum-units figure and a select-count ("select one", "select two").
- A college earns the **ADT** by mapping a **local course** to each TMC slot. The
  local course is legitimate when it **articulates to that C-ID** — i.e. it is
  C-ID-approved for the descriptor, matching content + **units + contact hours**.
- An **AA-T** (Associate in Arts for Transfer) vs **AS-T** (Associate in Science
  for Transfer) is a per-discipline designation carried on the TMC.

> ⚠ **Not the M-ID/MC lane.** This is the *real* ASCCC transfer process (UC/CSU
> transferability via CIAC). It is distinct from the project's M-ID → **MC**
> (Model Curriculum, NOT TMC) CPL pathway in §11 — that lane deliberately avoids
> the transferability claim. The TMC Builder tab is the genuine transfer artifact;
> keep the two framings separate.

## The two authoritative data sources (both already in-repo)

| Need | File | Key fields |
|---|---|---|
| Left column (fixed C-ID slot labels) | `kb/reference/cid_descriptors.json` | 495 records `{descriptor:"ANTH 110", title, description}` |
| Right column (a college's own courses) | `kb/reference/coci_course_list.xlsx` | 141,738 rows `College, Subject, Course_Number, CourseTitle, UnitValue, CIDNumber, …` |

**The join is trivial because the keys are identical.** COCI's `CIDNumber` is
byte-for-byte the same string as the descriptor key (`"ANTH 110"`, `"PSY 205 B"`)
— 12,738 / 12,792 non-null COCI C-IDs match a descriptor exactly. So a college
course "already carries" a TMC slot's C-ID iff
`normalize(course.CIDNumber) == normalize(slot.cid)` (normalize = trim, upper,
collapse spaces). No fuzzy matching, no descriptor-text NLP.

## The auto-match rule (safe-by-construction)

Pre-fill a slot **only** on an exact C-ID match (the slot's `cid` or any of its
`alts`). Never auto-fill by title similarity — a wrong auto-fill on a curriculum
submission is worse than an empty slot. Title/subject similarity is reserved for
*ranking the manual picker*, where the human confirms.

## Gotchas

- **C-ID coverage in COCI is uneven.** ~1/4 of colleges record few/no C-IDs in
  the MAP extract (a *reporting* gap, not an articulation gap). Auto-match is
  sparse for them; the manual picker carries the load.
- **No contact hours in COCI.** Only `UnitValue`. Units-in-range is the
  machine-checkable legitimacy signal; contact-hour parity is a faculty step.
- **TOP/units vary by college** (see §9) — the same course can carry different
  units across colleges, so a units-range tolerance (not equality) is correct.
- **`cid_descriptors.json` keys can carry a trailing token** ("PSY 205 B",
  "ANTH 115 L", "ADS 110 X") — keep the whole string; it's part of the key.
