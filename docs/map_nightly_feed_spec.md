---
title: MAP nightly feed — specification for the MAP platform team
date: 2026-08-08
tags: [spec, map-platform, integration, student-data, disposition, veteran-sprint]
artifacts:
  - map_student_credit (Supabase)
  - map_college_goal2 (Supabase)
  - fetch_custom_report.py
related:
  - "[[docs/student_detail_load_lessons]]"
  - "[[docs/kb-notes/adr-student-detail-aggregate-disclosure-control]]"
  - "[[docs/kb-notes/methodology-a-successful-import-is-not-a-correct-one]]"
---

# MAP nightly feed — specification

**Audience:** the MAP platform team (Malone and colleagues).
**Status:** draft for Sam to review before sending.
**Purpose:** define exactly what the CPL Initiative needs published so that
per-college Credit for Prior Learning reporting refreshes **nightly and
unattended**, instead of via a hand-built Microsoft Access export.

---

## Why this is being asked for

The CPL Initiative can currently report *what credit exists* but not *what a
college has acted on*. `CPLStatusPlan` — the per-recommendation disposition —
appears in **none** of the nine `View_*` datasets we fetch today, and
`View_ExhibitCRsCatalog_Dataset` carries the credit funnel only statewide-per-
exhibit, with no college dimension.

That gap is the difference between *"there are X eligible credits statewide"* and
*"at your college, twelve recommendations are sitting at Needs Action."* Only the
second is something a coordinator can act on.

An interim load has been done by hand from an Access export (220,588 rows) and it
works — but it cannot be repeated nightly by a person, and the manual path has
already produced one silent data defect (see *Known pitfalls*, item 7).

---

## What we would do with it

Two Veteran Sprint goals become directly measurable, per college, from one feed:

- **Goal 2** — *award course credit for basic training, not generic elective or
  CSU-GE Area E.* Measured from the `Course Type` suffix.
- **Goal 3** — *work the rest of the JST, not just basic training.* Measured from
  the share of recommendations still carrying no award.

Nothing is published at student grain. Everything reaching a public or
college-facing surface is aggregated, with small-cell suppression applied at
build time (threshold: fewer than 10 distinct students).

---

## Feed 1 — student × credit recommendation detail

**Grain:** one row per (student × college × exhibit × course type × catalog year).
Approximately 220,000 rows statewide today.

| Field | Type | Notes |
|---|---|---|
| `StudentKey` | integer or string | **See "The one hard ask" below.** A stable, non-reversible per-student key, hashed on the MAP side. |
| `CollegeID` | integer | Required. **Not** the college name — see item 6. |
| `DistrictID` | integer | Your API already exposes `DistrictId`/`DistrictName`. |
| `ExhibitID` | string | Nullable; see item 2. |
| `SourceCode` | string | e.g. `ACE`, `MAP`. |
| `CourseType` | string | **The single most valuable field in the feed** — see item 1. |
| `CatalogYear` | string | Required. **Must not be collapsed** — see item 3. |
| `CreditRecommendation` | string | The CR title. |
| `CollegeCourse` | string | Nullable in practice; see item 5. |
| `CPLStatusPlan` | string | The disposition. **Not** `Status` — see item 4. |
| `PotentialCredits` | number | |
| `CreditsInReview` | number | |
| `AppliedCredits` | number | |
| `TranscribedCredits` | number | |
| `CourseCredits` | number | The four destination buckets. |
| `AreaCredits` | number | |
| `ElectiveCredits` | number | |
| `DefaultAreaCredits` | number | |
| `MilitaryCredits` | number | |
| `NonMilitaryCredits` | number | |
| `ApprenticeshipCredits` | number | |
| `ArticulatedCredits` | number | |

## Feed 2 — college × exhibit × credit-recommendation rollup

**Grain:** one row per (college × exhibit × credit recommendation × college course
× disposition), with the credit funnel summed.

This is the feed that lets us state **how many units of already-earned credit are
sitting unawarded**, per college — a figure the CPL Initiative does not currently
have and which is likely to be its strongest single number.

Same fields as Feed 1 minus `StudentKey`, plus:

| Field | Type | Notes |
|---|---|---|
| `DistinctStudents` | integer | A **`COUNT(DISTINCT student)`**, not a sum or a max — see item 8. |

## Feed 3 — college and district reference

**Grain:** one row per college. ~123 rows. Small, and the highest
effort-to-value ratio in this document.

| Field | Type |
|---|---|
| `CollegeID` | integer |
| `CollegeName` | string (MAP's canonical spelling) |
| `DistrictID` | integer |
| `DistrictName` | string |

**Why this matters more than its size suggests:** college *names* vary between
CCC datasets — spelling, punctuation, "College" vs "Community College",
district suffixes. Only the numeric ID is reliable. Every table we hold today
keys on the text name, which means any join between two sources is a fuzzy match
waiting to go wrong. A published id↔name↔district reference removes an entire
class of silent error, permanently.

---

## The one hard ask: a stable per-student key

Without a per-student key we can only count **recommendations**, not **people** —
and one person holding several recommendations under one exhibit, or the same
credential at two colleges, inflates every headcount.

We have confirmed this is a real problem, not a hypothetical: `TotalStudentsForCR`
varies *within* the same `(ExhibitID, CreditRecommendation)` group in **19,461 of
108,911 groups**, so it cannot be summed to a student total.

**What we are asking for:** a per-student value that is
- **stable** — the same person yields the same value in tomorrow's extract, so
  change over time can be measured;
- **non-reversible** — hashed with a salt held on the MAP side. We do not want,
  and will not store, anything that can be turned back into a student identity.

**What we are explicitly not asking for:** name, student ID, SSN, date of birth,
email, or any free-text field. Please omit them from the view rather than
blanking them — a field that arrives populated in a later revision is then
structurally harmless rather than a near miss.

---

## Known pitfalls — please preserve these behaviors

These are things we discovered the hard way in the Access export. They are not
complaints; they are the specific details that make the difference between a feed
that works and one that quietly produces wrong numbers.

1. **`Course Type` is the goal-2 signal, and it must not be normalized away.**
   Where `ExhibitID` is blank it takes exactly one of
   `Credit for Basic Military Service-Course` / `-Area` / `-Elective`, and that
   suffix *is* the answer to "did this college award real course credit or push it
   into Area E?" Elsewhere it carries the award type and amount
   (`Course credit (1)`…`(4)`, `Area credit`, `Elective credit`). Please keep both
   vocabularies verbatim. **It is the only field in the export that colleges do
   not type themselves, which is exactly why we trust it.**

2. **`ExhibitID` blankness is meaningful and inconsistent.** The `-Course`
   variant arrives with `ExhibitID = "Default Credit"`; the `-Area` variant
   arrives blank. We would rather you **keep this as-is** than tidy it — but if
   MAP can supply a stable non-null identifier for the default-credit rows, that
   would be a genuine improvement.

3. **Never collapse `Catalog Year`.** The same basic-military award is **4
   credits in 2024-2025 and 3 in 2025-2026**. Collapsing the year silently
   averages two different awards.

4. **`Status` and `CPLStatusPlan` are different fields** and share exactly one
   value (`Needs Action`). `Status` is the workflow stage; `CPLStatusPlan` is the
   disposition. A tool of ours matched the wrong one and confidently reported a
   statewide disposition rate of 0.0%. If both must be present, a clearer name
   for either would help.

5. **`College Course` is not consistently populated** — it holds a course code at
   one college, a GE area at another, and a literal `"-"` at a third. Please pass
   through whatever the college entered; we no longer depend on it.

6. **Please include `CollegeID` on every row of every feed**, not just the college
   name. See Feed 3.

7. **Row counts, please.** If the delivery can state the row count it believes it
   produced, we can reconcile on arrival. Our manual load silently gained 2,058
   duplicated rows in transit while the loading tool reported success — a 0.93%
   over-count, small enough to look plausible. A source-side count turns that from
   undetectable into a one-line check.

8. **A student count must be `COUNT(DISTINCT student)`.** The Access export
   carried a `MaxOfStudent` column that was `1.00` on every row — `MAX()` of a
   per-row flag. It carried no information.

9. **Credit-recommendation titles vary by case** (`EMT Special Populations` vs
   `Emt Special Populations`), which fragments any grouping on the text. If MAP
   holds a canonical CR identifier, please include it.

---

## Delivery

- **Cadence:** nightly. Full refresh is fine — we truncate and reload; we do not
  need deltas.
- **Mechanism, in order of preference:**
  1. A published API view we can fetch on a schedule, the same way we already
     fetch the nine `View_*` datasets. **This is by far the preferred option**
     and needs no new infrastructure on our side.
  2. A file dropped to an agreed location nightly.
- **Format:** JSON or CSV. If CSV, UTF-8 please.
- **Schema stability:** if a column is renamed or removed, we would appreciate
  notice. Our loaders match column names, and a silent rename is the failure mode
  most likely to produce a confidently wrong number rather than an error.

## Status of the current request

`View_StudentDetailCredits_APIDataset` and two other candidate names currently
return `400 — … is not Valid`, so nothing is published yet under a name we can
find. If a view already exists under a different name, that name alone unblocks
most of this document.

---

*Prepared by the CPL Initiative for the MAP platform team. Questions to Sam.*
