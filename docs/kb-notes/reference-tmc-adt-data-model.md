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

## The authoritative data sources (all already in-repo)

| Need | File | Key fields |
|---|---|---|
| Left column (fixed C-ID slot labels) | `kb/reference/cid_descriptors.json` | 495 records `{descriptor:"ANTH 110", title, description}` |
| Right column (a college's own courses) | `kb/reference/coci_course_list.xlsx` | 141,738 rows `College, Subject, Course_Number, CourseTitle, UnitValue, CIDNumber, …` |
| Right column, C-ID coverage BOOST | `kb/reference/cid_articulations.json` | 28,070 official c-id.net articulations `{cid, college, subject, number, local_title, sequence?}` |

**The join is trivial because the keys are identical.** COCI's `CIDNumber` is
byte-for-byte the same string as the descriptor key (`"ANTH 110"`, `"PSY 205 B"`)
— 12,738 / 12,792 non-null COCI C-IDs match a descriptor exactly. So a college
course "already carries" a TMC slot's C-ID iff
`normalize(course.CIDNumber) == normalize(slot.cid)` (normalize = trim, upper,
collapse spaces). No fuzzy matching, no descriptor-text NLP.

### C-ID coverage doubles with the c-id.net authority (Session 90)

COCI's `CIDNumber` column is **under-reported** — colleges self-report it
unevenly (~1/4 report few/no C-IDs), so a lot of real articulations are missing
from COCI. `cid_articulations.json` is the **official c-id.net approved-courses
export** (same trust tier as COCI's `CIDNumber`, and roughly *doubles* it):

```
(college × C-ID) coverage — distinct pairs
  COCI CIDNumber column        10,627
  c-id.net cid_articulations   20,948
  UNION                        21,300   (+10,673, ≈ +100%)
```

`tmc/_build_college_courses.py` **unions both sources per course**, joined on
`(college, subject, number)` EXACT with a leading-zero-normalized fallback
(`MATH 019 ↔ MATH 19`, +1.9k attaches). `sequence:true` rows (multi-course
articulations) are excluded — one local course is not a standalone match for a
sequence descriptor. Result: a course can now carry **more than one C-ID**, so
`tmc_college_courses.js` rows gain an optional 6th element:

- `[subj, num, title, units, cid]` — single C-ID (unchanged, lean).
- `[subj, num, title, units, cid, xcid[]]` — `cid` = primary/display C-ID
  (COCI's when present, else the first c-id.net one); `xcid[]` = the additional
  C-IDs. The consumer matches a slot against `{cid} ∪ xcid` (`courseCids()` /
  `matchedCid()` in `tmc_builder.js`), and `autoMatch` tracks used courses so one
  physical course can't fill two slots.

**A gap this does NOT close:** ~24% of c-id.net course-keys have no matching
COCI course row (the college doesn't list that course in COCI), so those
articulations can't surface as a pickable course. And a college genuinely
lacking a C-ID-approved course for a slot (e.g. Saddleback's AoJ `AJ 120`)
stays a legitimate blank — no course dataset fills it (the approved-ADT
evidence lives in COCI's *program* export, which carries no course-to-slot map).

## The auto-match rule (safe-by-construction)

Pre-fill a slot **only** on an exact C-ID match (the slot's `cid` or any of its
`alts`). Never auto-fill by title similarity — a wrong auto-fill on a curriculum
submission is worse than an empty slot. Title/subject similarity is reserved for
*ranking the manual picker*, where the human confirms.

## Gotchas

- **C-ID coverage in COCI is uneven.** ~1/4 of colleges record few/no C-IDs in
  the MAP extract (a *reporting* gap, not an articulation gap). **Mitigated
  Session 90** by unioning the c-id.net authority (above) — but the manual picker
  + the approved-ADT title-fill recovery still carry the residual.
- **No contact hours in COCI.** Only `UnitValue`. Units-in-range is the
  machine-checkable legitimacy signal; contact-hour parity is a faculty step.
- **TOP/units vary by college** (see §9) — the same course can carry different
  units across colleges, so a units-range tolerance (not equality) is correct.
- **`cid_descriptors.json` keys can carry a trailing token** ("PSY 205 B",
  "ANTH 115 L", "ADS 110 X") — keep the whole string; it's part of the key.
