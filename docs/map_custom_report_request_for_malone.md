---
title: MAP Custom Reports — what the CPL daily feed needs (request for the MAP platform team)
date: 2026-08-09
tags: [spec, map-platform, integration, custom-reports, daily-feed, disposition]
artifacts:
  - fetch_custom_report.py
  - docs/map_nightly_feed_spec.md
related:
  - "[[docs/map_nightly_feed_spec]]"
  - "[[docs/student_detail_load_lessons]]"
  - "[[docs/kb-notes/adr-student-detail-aggregate-disclosure-control]]"
---

# MAP Custom Reports — what the CPL daily feed needs

**For:** Malone / the MAP platform team
**From:** the CPL Initiative (Sam Lee)
**Companion doc:** `map_nightly_feed_spec.md` — the full grain-level spec. This
one is the short version: what we call today, what we need added, and why.

---

## First, a correction to how this is usually described

There is **no SQL** on our side. We do not query a database — we POST a JSON
body to MAP's Custom Reporting endpoint naming the views and columns we want:

```
POST https://mapwebapinew.azurewebsites.net/api/CustomReport/getReport
Content-Type: application/json
```

```json
[
  { "viewName": "View_ArticulatedMAPExhibits_APIDataset",
    "columnName": ["College", "ExhibitID", "Exhibit Title", "..."] },
  { "viewName": "View_ExhibitCRsCatalog_Dataset",
    "columnName": ["ExhibitID", "SkillLevel", "CreditRecommendation", "..."] }
]
```

So the deliverable for Malone is **a view name and its column list**, not a
query. That JSON payload *is* the specification. Ours lives in
`fetch_custom_report.py` → `REQUEST_PAYLOAD`.

The endpoint is **unauthenticated today**. Our fetcher already has a no-op auth
path staged (`MAP_API_KEY`, `MAP_API_AUTH_HEADER`, `MAP_API_AUTH_SCHEME`) so
that a credential can be switched on without a code change when MAP is ready.

---

## "Should we use an API rather than fetch?"

**We already use the API** — the fetch *is* an API call, run once a day from a
GitHub Actions runner. So the real question is a different one, and it's worth
stating precisely because it's the actual decision in front of Malone:

| Option | What it means | Verdict |
|---|---|---|
| **A. Keep assembling from general views** | We pull 9 broad `View_*` datasets and reconstruct the grain we need on our side | Works, but we cannot build what isn't published — and the field we need most isn't |
| **B. One purpose-built view** | MAP publishes a view shaped to this question; we add ~4 lines to `REQUEST_PAYLOAD` | **This is what we're asking for** |
| **C. A bespoke REST service** | MAP builds new endpoints for us | Not needed. Costs Malone more and buys us nothing |

**Recommendation: B.** The Custom Reporting Module is already the right
mechanism — it's proven, it's a one-line change for us, no new infrastructure,
no new credentials, no new failure mode. What's missing is a *view*, not a
*protocol*.

---

## What we call today (9 datasets)

| View | What we use it for |
|---|---|
| `View_ArticulatedMAPExhibits_APIDataset` | the exhibit/articulation spine |
| `View_ArticulatedCollegeCourses_APIDataset` | course-level articulation detail |
| `View_CollegeCourses_APIDataset` | college catalog |
| `View_CreditDistributionByCollege_APIDataset` | credit distribution |
| `View_PointInTime_StudentAggregatedValues_APIDataset` | point-in-time student aggregates |
| `View_ProgramsofStudy_APIDataset` | programs of study |
| `View_StudentAggregatedValues_APIDataset` | student aggregates |
| `View_ExhibitCRsCatalog_Dataset` | per-exhibit credit funnel (statewide only) |

Two further views — `View_CollegeContacts` and `View_CollegeUsersRoles` — are
**deliberately not fetched**. They carry staff names, emails and phone numbers
the dashboard never reads, so leaving them out of the payload means that PII
never lands on our runner at all. Please keep any new view free of student or
staff PII for the same reason.

---

## The gap

**`CPLStatusPlan` — the per-recommendation disposition — is in none of the nine
views above.** `View_ExhibitCRsCatalog_Dataset` carries the credit funnel but
**statewide per exhibit, with no college dimension**.

That single missing field is the difference between:

- *"There are X eligible credits statewide"* — what we can say today, and
- *"At your college, twelve recommendations are sitting at Needs Action, and
  four of them are against credentials you have already articulated"* — what a
  coordinator can actually act on.

We have proven the value of the second by loading it **by hand** from an Access
export (220,588 rows, reconciled exactly). It works — the headline it produced
is that **~1.05M units of credit sit at Needs Action statewide, ~64,000 of them
against articulations colleges have already built.** But a hand load cannot run
nightly, and the manual path has already produced one silent data defect.

---

## The ask

**One view, at the grain below, published through the Custom Reporting Module.**

**Grain:** one row per *(student × college × exhibit × course type × catalog
year)* — the same grain as the Access export.

**Columns needed:**

| Column | Why |
|---|---|
| a stable per-student key | see below — this is the one design decision we need from you |
| College / CollegeID | the dimension the whole ask exists for |
| ExhibitID | joins to the exhibit spine |
| CreditRecommendation | what was recommended |
| **CPLStatusPlan** | **the disposition — the missing field** |
| Course Type | its suffix is how Sprint goal 2 is measured |
| Catalog Year | trend + cohort |
| PotentialCredits / CreditsInReview / AppliedCredits / TranscribedCredits | the funnel; these sum, unlike students |

**No names, no student identifiers, no contact fields.** Nothing we publish is
at student grain — everything reaching a college- or public-facing surface is
aggregated with small-cell suppression applied at build time (fewer than 10
distinct students ⇒ suppressed).

### The one thing only MAP can decide: the student key

We need to count *distinct students* and to tell one extract from the next. Two
options, and we have a recommendation:

- **Recommended — a persistent surrogate key.** An opaque, stable ID minted by
  MAP, meaningless outside MAP, reused across extracts.
- **Not recommended — a salted hash of a student ID.** The ID space is small and
  enumerable, so a hash inverts for anyone holding the salt. It reads as
  anonymisation without being it.

Please also include a **key version stamp**, so that if the mapping is ever
regenerated we can *detect* it rather than silently compare two extracts that
are no longer comparable.

*(Note: `docs/map_nightly_feed_spec.md` still says "salted hash" — this
supersedes it, pending Sam's confirmation.)*

---

## What we need from Malone, concretely

1. **The exact `viewName` string.** This is the current blocker — three
   candidates all return `400 … is not Valid`, and a single-column retry gives
   the identical error, so it is the *name* we have wrong, not the column list.
2. **The exact `columnName` strings** (spelling and spacing as the API expects —
   several existing views use spaces, e.g. `"Exhibit Title"`, and one ends
   `_Dataset` rather than `_APIDataset`).
3. **Confirmation of the student-key choice** above.
4. **Refresh cadence** — when the view is rebuilt, so we can schedule our pull
   after it.
5. Whether a credential will be required, and if so which header — our fetcher
   supports `Authorization: Bearer`, `Ocp-Apim-Subscription-Key`, and `x-api-key`
   already, with no code change.

On our side this is a **~4-line change** to `REQUEST_PAYLOAD` in
`fetch_custom_report.py`. The cron already runs daily and already pulls from
this endpoint. Nothing else is needed.

---

## One caution worth passing on

Fields that MAP *generates* have proven reliable for us. Fields that **colleges
type in themselves** have broken in every load so far — `College Course` arriving
as `-`, a destination value migrating between columns, `Status` arriving empty.

Where a value can be either derived by MAP or entered by a college, **please
derive it.** It is the difference between a measure we can trust unattended and
one that needs a human to sanity-check every month.
