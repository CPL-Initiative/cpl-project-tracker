---
title: MAP Custom Reports (3 new) — wiring, reconciliation & lessons
date: 2026-08-19
prs: [1246, 1247, 1248]
tags: [map-api, custom-report, catalog-year, student-detail, pii, reconciliation, probe, itpi, salt-hash]
artifacts:
  - fetch_custom_report.py
  - kb/_probe_new_custom_reports.py
  - kb/_probe_new_custom_reports_followup.py
  - kb/_probe_confirmed_custom_reports.py
  - tests/custom_report_payload_test.py
  - .github/workflows/discover-map-datasets.yml
related:
  - "[[docs/map_dataset_sql_for_malone]]"
  - "[[docs/map_dataset_spec_for_malone]]"
  - "[[docs/student_detail_load_lessons]]"
  - "[[docs/kb-notes/adr-pull-from-the-source-rather-than-accept-a-push]]"
  - "[[docs/kb-notes/methodology-a-negative-result-needs-a-positive-control]]"
  - "[[docs/kb-notes/methodology-falsify-a-claim-when-falsification-is-cheap]]"
---

# MAP Custom Reports (3 new) — wiring, reconciliation & lessons

## 2026-08-19 — Session 170 (SkyFetch)

Sam built three reports in the MAP Custom Report Builder and asked whether a
session could fetch them and test them against Supabase.

### (a) What was learned

**All three are served by the API the daily cron already pulls**, and the API's
`dataCount` matches the report builder **exactly** on all three. Builder and API
are one cut, not two systems — so wiring was a config change, and the ITPI
daily-push offer is declinable on the merits rather than on posture.

| viewName | cols | dataCount |
|---|---:|---:|
| `View_CollegeExhibitCR_APIDataset` | 11 | 174,223 |
| `View_CollegeExhibitCRByCatalogYear_APIDataset` | 13 | 211,005 |
| `View_StudentDetailsCredits_APIDataset` | 30 | 591,820 |

**These reports are our own spec coming back.** The 13-column report is
**Dataset A of `docs/map_dataset_sql_for_malone.md`** — the SQL sent to the MAP
team on 2026-08-09 — same columns, same order, already loaded as
`map_college_cr_unit`. The first job was therefore a *reconciliation*, not a
discovery, and it was found by re-reading a committed doc rather than by
generating anything.

| Report | MAP | ours | delta |
|---|---:|---:|---:|
| By Catalog Year (13 col) | 211,005 | `map_college_cr_unit` 204,714 | +3.07% |
| Exhibit CR (11 col) | 174,223 | same key, year+type collapsed 171,723 | +1.46% |
| Student Details (30 col) | 591,820 | `map_student_credit` 537,908 | +10.02% |

All three run the same direction — **our staleness resolving**, exactly as
`cpl_memory: two-student-counts-disagree-indicator-suspected` predicted. Confirm
per-college; do not file as a defect.

⚠️ **A standing claim was wrong.** §11 and handoff 170 both said *"catalog year
— nothing we hold carries it."* `map_student_credit.catalog_year` is **100%
filled**, 9 distinct values, 2019-20 → 2026-27. What we lack is catalog year at
the **articulation** grain — a narrower and different claim. Checking the premise
took one query.

⚠️ **The spec warns loudest about the wrong field.** It flags `CourseType` as
key-critical ("collided on about 8% of rows"). Measured on the full key:
dropping `course_type` costs **4 rows of 204,714 (0.0%)**; dropping
`catalog_year` costs **32,990 (16.1%)**. The 8% was measured against a narrower
key and does not transfer. Catalog year is the grain — which is why the
11-column report is deliberately **not** fetched: it is derivable from the
13-column one, and pulling both moves ~175k rows to learn nothing.

### (b) The probe was wrong, and the control is the only reason we know

The discovery sweep tried 51 candidate viewNames, got `400 … is not Valid` on
every one, and reported **"NONE exposed."** That verdict was worthless.

`columnName: []` — the enumeration trick that gave up all 27 Exhibit-CRs-Catalog
fields on 2026-08-14 — **has stopped working**. It now returns HTTP 500 on
*known-good* views (`View_CollegeCourses_APIDataset`,
`View_ExhibitCRsCatalog_Dataset`, both 500/0 bytes) while a named column returns
200 with data. So the probe's "columns returned ⇒ view is real" test could never
fire for **any** view. It was structurally guaranteed to report absence, and
without a positive control Sam would have been sent to Pedro on the strength of
a broken instrument.

The run was not useless — it was **backwards**. The API validates the name
first: an invalid name is rejected with 400 before the empty column list can
crash it; a *valid* name passes and then 500s. On that sweep **500 meant real**.
Exactly one candidate got a 500 — `View_StudentDetailsCredits_APIDataset`, the
one real view in the list — and the probe printed it as `✗` and summarised it in
with the rejections.

Two misses, both now encoded in `kb/_probe_new_custom_reports.py` rather than
written down somewhere: it runs its control first and stamps a warning over its
own verdict if the control fails, and it collects 5xx responses under a heading
that says to chase them before reporting absence. The other miss was naming:
`CR`, not `CreditRecommendations` — a UI label **expands** an abbreviation the
identifier keeps, so the short form is swept first.

### (c) PII: the claim was corroborated, not merely accepted

`StudentMAPID` arrives as 64 hex characters. Sam confirmed Pedro hashed them;
Pedro later confirmed they are **salt-hashed**. That was not taken on faith,
because `map_dataset_sql_for_malone.md` names this exact failure and it is cheap
to falsify: *"the ID space is small enough to enumerate."* `StudentMAPID` is a
small integer over 42,346 students, so SHA-256 across **5,000,000 plain decimals
plus eight formatting variants** was run against a sampled hash. No match — not a
bare hash of the id. Two independent signals agree.

⚠️ **One property remains, and it is not a privacy one.** "Salted" does not mean
"salted with the *same* salt every run", which is what the spec asked for. A
rotating salt leaks nothing — it silently makes distinct-student counts
incomparable across refreshes, with no error anywhere. Sam asked Pedro directly.
**Build the key-set overlap check at load time regardless**: an assurance
describes today's behaviour, and `cpl_memory: statewide-is-138-not-84` is the
precedent for a correct ruling sitting unenforced because no consumer changed.

`Notes` is held permanently — free text at student grain, written by staff, read
by nothing.

⚠️ **Three status-shaped fields** ship in that view and they are not
interchangeable: `Status` (workflow stage) · `CPLStatusPlan` (what the college
decided — the entire reason the view was wanted) · `CPLPlanStatus` (**not a
status**; a pipe-delimited checklist, `"CPL Docs |Ed Plan |Analysis |Counselor |"`).

**The payload IS the PII boundary.** `fetch_custom_report.py`'s minimisation is
not a filter or a redactor — it is *what the request does not ask for*, which is
one plausible edit from being undone in a public repo.
`tests/custom_report_payload_test.py` pins the banned contact views, identity-
shaped column names in any view, the held columns, the excluded 11-column
report, and the `.gitignore` line — and was verified to **fail** on re-adding
`Notes` and on adding a `Last Name`, not merely to pass.

### (d) Current state

- `REQUEST_PAYLOAD` = **10 datasets** (was 8). Both new views land on the next cron run.
- Raw pull stays gitignored (`CustomReport_*.json`, which does match the runner's
  `CustomReport_latest.json`); nothing matching is tracked; only aggregated,
  suppressed artifacts are committed.
- Probes commit nothing and request no student identifier beyond the hashed key.

### (e) Next concrete step

**Load the two new views into Supabase and reconcile per-college.** Moreno Valley
(`college_id` 3, our 7,963 rows, 8 catalog years) is the best single test — it
spans more catalog years than most, so it exercises the dimension that carries
the grain. Then the key-set overlap check for salt stability, at load time.

**Parked / open:** Pedro's answer on salt rotation; whether the 11-column report
ever earns a place (currently: no, it is derivable).

---

## 2026-08-19 (later) — both open questions closed

**Pedro Campos (ITPI), via Sam: the salt does NOT rotate — it stays the same
every run.** That was the one property the enumeration test could not reach, and
it is now answered rather than inferred. Consequences worth stating plainly:

- The hashed `StudentMAPID` is **stable across pulls**, so a loader may *rely* on
  it — distinct students dedupe correctly across refreshes and student counts are
  comparable over time. That is exactly what
  `docs/map_dataset_sql_for_malone.md` asked for ("use the same salt each run so
  counts stay comparable over time").
- The key-set overlap check is now a **regression check, not an open question.**
  Build it anyway: an assurance describes today's behaviour, and this failure is
  silent by construction — a rotated salt raises no error, the numbers just
  quietly stop matching. `cpl_memory: statewide-is-138-not-84` is the standing
  precedent for a correct ruling sitting unenforced because no consumer changed.

**Sam has told Pedro the tables are wired into our cron, so no push is needed.**
The ITPI question is now closed *and communicated* —
`adr-pull-from-the-source-rather-than-accept-a-push` is a decision that has been
acted on, not a recommendation awaiting one. It was also settled on the merits
rather than on posture, which is what made it an easy conversation: the reports
were already on the endpoint we pull, so accepting a push would have meant
issuing a credential and creating a second writer to obtain data we were
receiving anyway.

Worth keeping as a pattern: **the strongest version of "no thank you" is one
where the alternative is already working.** The recommendation to decline was
written before the serve-check confirmed the reports were reachable; had they
*not* been, the same recommendation would have been a much weaker argument, and
the honest move would have been to say so.
