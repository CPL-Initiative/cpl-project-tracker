---
title: "Reference — TMC / ADT data model & the C-ID auto-match"
kb-status: published
kb-type: reference
date: 2026-06-16
updated: 2026-06-17 (Session 60 — the GE Breadth half of the full ADT: Cal-GETC/IGETC/CSU-GE)
tags: [reference, tmc, adt, c-id, coci, articulation, transfer, ge, cal-getc, igetc]
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

## The full ADT = TMC major + GE Breadth pattern + electives (Session 60)

A TMC major is only **part** of an ADT. The full degree is **60 CSU-transferable
units** = the **TMC major** (≈18–26 units) + a **GE Breadth pattern** + **electives**
to reach 60. The TMC Builder models the GE half in `tmc_ge_patterns.js`.

**Three GE patterns** (`sections[].slots[]`, exactly like a TMC, but each slot is
`ge:true` + `noncid:true`):

| Pattern | Status | Notes |
|---|---|---|
| **Cal-GETC** | **the statewide ADT GE pattern as of Fall 2025 (AB 928)** — primary | the single intersegmental GE pattern; supersedes IGETC/CSU-GE for ADTs |
| **IGETC** | legacy | the historic UC/CSU GE pattern; kept for older catalog years |
| **CSU GE Breadth** | legacy | the historic CSU-only GE pattern |

**Why GE slots are `noncid:true` (no auto-match).** GE areas are **college-certified
to the area** (Area 1A English Composition, Area 3 Arts & Humanities, …) — they are
**not C-ID-keyed**, and COCI carries no GE-area flag. So unlike the TMC major (exact
C-ID auto-match), the GE companion is a **manual picker**: the college maps a local
course to an area, and `units` is treated as a **per-course minimum**, not an exact
match. Status warns only when a pick falls *below* the area minimum.

**Verify each layer against its OWN authority.** A TMC major template (ASCCC
discipline faculty) and a GE Breadth pattern (the CCCCO/ICAS GE standard) are
**different documents from different bodies** — one upload of "the forms" does not
cover both. Cal-GETC was trued up against the **official Cal-GETC Standards v1.3**
(PR #457: Area 3 Arts & Humanities requires **2 courses**, not 1 — the pattern sums
to **34 semester units**). A wrong select-count silently breaks the unit total, so
**pin the pattern's total units in a test** as a tripwire for the next true-up.

**No schema change for GE.** GE selections + the chosen pattern persist into the same
`tmc_submissions.alignments` jsonb the major uses — GE choices live under
`ge:`-prefixed keys plus a `_ge_pattern` meta record. The builder reuses `renderSlot`
(via a `keyPrefix` param) and adds a `renderGeInto()` companion panel + a combined
**Full-ADT total** (major + GE).
