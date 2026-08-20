---
title: Session 171 handoff — the MAP Custom Reports are wired; load and reconcile
created: 2026-08-19
updated: 2026-08-19
tags: [handoff, session-171, map-api, custom-report, catalog-year, student-detail, pii, reconciliation]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/map_custom_reports_lessons]]"
  - "[[docs/session_170_handoff]]"
superseded: true
superseded_by: session_174_handoff.md
---

# Session 171 handoff

You are **Session 171**. Session 170 was **SkyFetch**, single-lane: the three new
MAP Custom Reports. The Delta/SJCOE lane from handoff 170 is **untouched and
still open** — see §A below.

⚠️ **Sam frequently runs several sessions at once.** Check `git log origin/main`
before assuming your branch is the only work in flight.

---

## What shipped (#1246, #1247, #1248 — all merged)

**All three reports are served by the API the daily cron already pulls**, and the
API `dataCount` matches the report builder **exactly** on all three:

```
View_CollegeExhibitCR_APIDataset               11 cols   174,223
View_CollegeExhibitCRByCatalogYear_APIDataset  13 cols   211,005
View_StudentDetailsCredits_APIDataset          30 cols   591,820
```

`REQUEST_PAYLOAD` is now **10 datasets** (was 8): the by-catalog-year report and
the student-detail view. **They land on the next cron run** — the first thing to
check is that they actually arrived.

The 11-column report is **deliberately not fetched**: it is the 13-column one
with the grain collapsed and is derivable from it.

---

## Read in this order

1. `docs/map_custom_reports_lessons.md` — the whole story, the numbers, the traps.
2. `docs/map_dataset_sql_for_malone.md` — **the spec these reports implement.**
   Read it before touching the data; its caveats section is load-bearing.
3. `CLAUDE.md` §11 → **MAP Custom Reports** row.
4. `cpl_memory` FIRST though (Rule 8), tags `map-api` / `custom-report` / `pii`.

---

## Priority: load the two new views and reconcile per-college

The fetch is done; **nothing is loaded into Supabase yet.** That is the job.

Deltas measured this run, all one direction:

| Report | MAP | ours | delta |
|---|---:|---:|---:|
| By Catalog Year | 211,005 | `map_college_cr_unit` 204,714 | +3.07% |
| Exhibit CR (11 col) | 174,223 | same key collapsed 171,723 | +1.46% |
| Student Details | 591,820 | `map_student_credit` 537,908 | +10.02% |

⚠️ **A disagreement here is expected and is probably not a defect.** `cpl_memory:
two-student-counts-disagree-indicator-suspected` records Sam's own explanation —
the MAP team was pulling records off MAP to correct Exhibit references and
reload them, so **our staleness resolving** is the predicted outcome. Confirm it
per-college; don't file it.

**Best single test:** Moreno Valley (`college_id` 3, our 7,963 rows, **8 catalog
years** where most colleges have 5) — it exercises the dimension that carries the
grain.

---

## Decisions and rulings made this run (do not re-litigate)

- **Sam, 2026-08-19:** Pedro (CEO, ITPI) confirmed the MAP student ids are
  **salt-hashed**. Recorded in `cpl_memory` as `map-student-ids-are-salt-hashed`,
  `verified`, with Pedro in `verified_by`.
- **Pedro, via Sam, 2026-08-19: the salt does NOT rotate — it stays the same every
  run.** So the hashed key is stable across pulls and a loader may RELY on it:
  students dedupe correctly across refreshes and counts are comparable over time.
  Recorded at the call site and in `cpl_memory`.
- **Sam has told Pedro the tables are wired into our cron, so no push is needed.**
  The ITPI push question is now closed and communicated, not merely recommended.
- **ITPI's daily-push offer: declined, and Sam has told Pedro so** — the tables are
  wired into our cron, so no push is needed. `adr-pull-from-the-source-rather-than-accept-a-push`
  is now a decision that has been ACTED ON, not a recommendation awaiting one.

---

## Carryover

- **§A · Ashley's Delta crosswalk (from handoff 170) — untouched.** Record which
  of the 42 Priority-1 rows Delta accepted / rejected / **corrected**;
  corrections go straight into `kb/delta_offering_map.json`. And the statewide
  engine's **second occupation list is still outstanding** — four sessions now,
  the oldest unpaid debt in that workstream.
- **Salt-rotation detector, at LOAD time — now a REGRESSION check, not an open
  question.** Pedro confirmed the salt is stable, so build it to catch a future
  change rather than to answer one: compare the incoming key set against the
  previous pull (stable ⇒ large overlap, rotated ⇒ ~zero). This failure is silent
  by construction, so nothing else would surface it.
- **`CLAUDE.md` is 2.0× its budget** (119,962 / 60,000, `always_loaded`). Move
  prose to `docs/reference/`; do not inflate §11.
- Auth `role` column, repo split, GR sensitivity flips — all still on Sam.

---

## Patterns that worked

- **Check the premise before answering the question.** "Catalog year is the
  genuinely new dimension" was in §11 *and* the handoff, and was wrong —
  `map_student_credit.catalog_year` is 100% filled. One query.
- **Read our own committed docs first.** The single biggest finding — that these
  reports *are* `map_dataset_sql_for_malone.md` Dataset A — came from re-reading
  a doc, not from generating anything.
- **Measure the thing the doc warns about.** The spec flags `CourseType` as
  key-critical; on the full key it costs 4 rows of 204,714 while `catalog_year`
  costs 32,990.
- **Prove the instrument before reporting absence** (below).

---

## Safety patterns to honour

- ⚠️ **A negative result needs a positive control IN THE SAME RUN.** The probe
  reported "NONE exposed" for all three reports; `columnName: []` had silently
  stopped enumerating and now 500s on known-good views, so its success condition
  could not fire for *any* view. Only the control caught it.
  `methodology-a-negative-result-needs-a-positive-control`.
- ⚠️ **An odd one out is a lead, not a tally entry.** On that same sweep 500 meant
  *real* and 400 meant absent; the single 500 was the real view, printed as `✗`.
- ⚠️ **The payload IS the PII boundary.** `fetch_custom_report.py`'s minimisation
  is the *absence* of entries — one plausible edit from being undone in a PUBLIC
  repo. `tests/custom_report_payload_test.py` pins it; it was verified to FAIL,
  not just to pass. Keep it that way.
- ⚠️ **Three status-shaped fields** in the student view: `Status` = workflow
  stage · `CPLStatusPlan` = what the college DECIDED (the point) ·
  `CPLPlanStatus` = **not a status**, a pipe-delimited checklist.
- ⚠️ **`Notes` stays held** — free text, student grain, no consumer.
- ⚠️ Raw pull stays gitignored (`CustomReport_*.json`). Public repo, student rows.
- ⚠️ **An RLS-filtered read returns 200 + `[]`.** Empty is not proof of empty.
- ⚠️ **The sandbox cannot reach `mapwebapinew.azurewebsites.net`** (egress 403) or
  `*.supabase.co`. MAP probes run on the runner via
  `.github/workflows/discover-map-datasets.yml`; Supabase goes through the MCP.
- Rule 4 (both HTMLs identical), Rule 1 (change the generator), Rule 5 (never
  force-push `main`), Rule 7 (TOP corroborates, never gates), Rule 10.

---

## Moniker

Session 170 was **SkyFetch**. Take **SkyLoad** if you do the Supabase load and
reconciliation, **SkyClaim** if you take Ashley's Delta outcome, or coin your own.

Next after you: `docs/session_172_handoff.md`.
