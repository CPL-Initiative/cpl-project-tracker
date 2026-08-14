---
title: Exhibit CRs Catalog — all 27 fields, measured
created: 2026-08-14
updated: 2026-08-14
tags: [reference, map-platform, custom-report, evidence, sierra, schema]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/military_cr_reference_scope]]"
  - "[[docs/kb-notes/methodology-search-the-awarding-body-not-just-the-name]]"
artifacts:
  - kb/_probe_exhibit_evidence_fields.py
  - fetch_custom_report.py
---

# Exhibit CRs Catalog — all 27 fields, measured

> **One-sentence summary** — `View_ExhibitCRsCatalog_Dataset` exposes 27 fields
> over 271,783 rows; we fetched 9, three of the unfetched ones carry the
> required-evidence text Sierra needs, and six more are redundant encodings of
> fields we already have.

## Context

Sam, 2026-08-14: *"analyze all 27 available fields in Exhibit CRs Catalog and let
me know if we could benefit by adding or deleting anything."*

Measured on the Actions runner (`kb/_probe_exhibit_evidence_fields.py`) — a
session cannot reach the MAP hosts. **271,783 rows · 34,569 exhibits · 37 MB for
13 columns.** Payload matters: every added column costs roughly 2.8 MB.

⚠️ **The API echoes your requested `columnName` back even when the request is
invalid.** A field is real IFF the request returns rows. See
`map-api-echoes-requested-columns` in `cpl_memory`.

## The 27 fields

### Fetched before 2026-08-14 (9)

`ExhibitID` · `SkillLevel` · `CreditRecommendation` · `Title` ·
`TotalEligibleCreditsForCR` · `TotalTranscribedCreditsForCR` ·
`TotalAppliedCreditsForCR` · `TotalCreditsInReviewForCR` · `TotalStudentsForCR`

### Added 2026-08-14 (5)

| Field | Fill | Distinct | Notes |
|---|---:|---:|---|
| `EvidenceDescription` | **2.5%** | 146 | max 349 chars, **not truncated** |
| `EvidenceTypeID` | 2.5% | **11** | controlled vocabulary |
| `SubmissionGuidelines` | **2.1%** | 1,187 | max 1,230 chars; ⚠️ 43 values at exactly 100 |
| `AceID` | high | — | `MOS-44B-002`, `AR-1703-0030` — the ACE exhibit id |
| `CPLTypeCode` | **100%** | 6 | `M` 262,970 · `IC` 3,143 · `SA` 2,795 · `Cx` 2,058 · `PR` 691 · `O` 124 |

### Available, not fetched (13)

| Field | Verdict | Why |
|---|---|---|
| `Issuer` | **ADD next** | 90% of credentials carry an issuer word absent from title and variants (`methodology-search-the-awarding-body-not-just-the-name`) |
| `MilitaryCourseNumber` | consider | 25.1% fill, 19,664 distinct, max 172 — a second military identity anchor |
| `TotalApprenticeshipCreditsForCR` | consider | 11.2% fill but **29,896 of 30,374 values are `0`** — only ~478 rows carry anything, though apprenticeship CPL is a live workstream |
| `CPLTypeDescription`, `CPLTypeID` | **skip** | redundant with `CPLTypeCode` — three encodings of one field |
| `CPLModeofLearningDescription`, `ModeofLearningCode`, `LearningModeID` | **skip** | three encodings of one field (identical counts: 262,238 / `M` / `1`) |
| `CriteriaID` | **skip** | 270,765 distinct over 271,783 rows — a row surrogate key, not data |
| `Level`, `ExhibitType`, `CourseVersion`, `ActiveEvidence` | undecided | not profiled against a named consumer |

## What the evidence fields actually contain

`EvidenceDescription` — **what a student must produce**:

```
1,729×  Exam Scores          264×  Portfolio Review
1,235×  Certificate          253×  Evidence of Work Experience
  758×  Score of 50          200×  Course Grade/Credit
  559×  Other                135×  Performance, Demonstration, Audition
  449×  License              266×  Master Record/Apprenticeship records assessed by counselor
```

`SubmissionGuidelines` — **the actionable half**, and arguably the more useful
of the two:

```
401×  For Active Modesto Junior College Students: must submit MJC CPL Petition Form
123×  Passing exam score
109×  Faculty will determine passing score
 74×  https://rccd.edu/hs_articulation/documents/students/6_Transcript_Review.pdf
 70×  [559 chars] College of the Canyons AP credit chart policy…
```

## ⭐ The evidence fields are empty on military rows BY DESIGN

Every welding/MOS row sampled for Sam's AWS D1.1 case — `Metal Worker`,
`Machinist`, `Welder`, `Marine Hull Repairer` — carried
`EvidenceDescription=`, `EvidenceTypeID=`, `SubmissionGuidelines=` and
`ActiveEvidence=false`, all with `CPLTypeCode=M`.

The 2.5% fill is not sparse data waiting to be corrected. Non-military rows
total **8,811** (`IC`+`SA`+`Cx`+`PR`+`O`), and 6,705 carry evidence — roughly
**76% of the rows where evidence is a meaningful concept.** Colleges define
evidence for the exhibits they assess; ACE-reviewed military training does not
work that way.

⚠️ **So do not report the nulls as a data-quality defect, and do not let Sierra
say "no evidence required" for a military exhibit** — she would be reading an
absent measurement as an answer.

## Truncation

- **`EvidenceDescription` is NOT truncated.** Max 349 chars, lengths vary freely
  (min 5, median 11, p95 58). A value clipped in a JSON viewer is the viewer.
- **`SubmissionGuidelines` is mostly not truncated** — max 1,230 chars — but
  **43 of 5,744 values (0.7%) sit at exactly 100 characters**, so *some* source
  caps at 100. Not a global cap; worth a look if a specific college's guidance
  reads as cut off.

## Caveats

- Fill rates are over all 271,783 catalog rows, which are per
  (exhibit, skill level, criteria/evidence) — finer than per credit
  recommendation. A field can look sparse because the grain is fine.
- `_rollup_exhibit_cr_catalog` indexes columns **by name**, so adding columns is
  safe; it de-dupes to (ExhibitID, SkillLevel, CreditRecommendation) by MAX,
  which the `CriteriaID` finding now confirms is the right shape — the totals
  repeat across the finer evidence rows.
- Nothing here is published to Supabase yet, so **Sierra still cannot see any of
  it**. Fetching is step one.
