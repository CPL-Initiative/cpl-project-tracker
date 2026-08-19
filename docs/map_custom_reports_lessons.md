---
title: MAP Custom Reports (3 new) — wiring, reconciliation & lessons
date: 2026-08-19
prs: [1246, 1247, 1248, 1251, 1252, 1253, 1254]
tags: [map-api, custom-report, catalog-year, student-detail, pii, reconciliation, probe, itpi, salt-hash]
artifacts:
  - fetch_custom_report.py
  - kb/_probe_new_custom_reports.py
  - kb/_probe_new_custom_reports_followup.py
  - kb/_probe_confirmed_custom_reports.py
  - tests/custom_report_payload_test.py
  - kb/_sync_map_custom_reports.py
  - kb/supabase_map_custom_report_staging.sql
  - tests/map_custom_report_sync_test.py
  - .github/workflows/map-custom-report-load.yml
  - .github/workflows/discover-map-datasets.yml
related:
  - "[[docs/map_custom_report_load]]"
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


---

## 2026-08-19 (later still) — Session 171 (SkyLoad): the load, and what the data said

Sam supplied the definitions the previous session had had to infer, and asked to
continue the queue. Merged **#1251** — loader, staging tables, runbook,
dispatch-only workflow. Full procedure: [`docs/map_custom_report_load.md`](map_custom_report_load.md).

### (a) The views had never been fetched — and the timeline says why

Handoff 171's first instruction was to check that they arrived. They had not.
The payload change merged at **13:15–13:42 PDT**; the day's last cron ran at
**13:12 UTC**, on a commit whose `fetch_custom_report.py` still carried eight
datasets. Nothing was broken — the merge simply missed the window, and the next
natural arrival was the following morning.

Worth keeping as a habit rather than a fact: **"it is wired" and "it has run"
are different claims,** and the gap between them is one cron window wide. The
check cost two commands (`list_workflow_runs`, then `git show <sha>:file`).

### (b) Sam's definitions, and the two dimensions we did not have

| field | Sam, 2026-08-19 | stored as |
|---|---|---|
| `Status` | the **articulation approval stage** the row is at, e.g. `Initiator` | `status` |
| `CPLStatusPlan` | the **action taken** on the CR — `Not Applicable`, `Needs Action` | `cpl_status_plan` |
| `CPLPlanStatus` | **the lifecycle checks, which can be multiple** — `CPL Docs \|Transcribed` | `cpl_plan_status` |

The previous session read `Status` as "the workflow stage", which was not wrong
so much as unspecific; *approval* stage is what makes its values MAP
approval-cascade roles rather than states of a record.

**The substantive point is that two of the three are dimensions no table we hold
carries.** `CPLStatusPlan` we have had since the Access import. `Status` and
`CPLPlanStatus` arrive only with this view — so freshness is the *lesser* reason
to load it, and the roadmap had been describing the smaller half of the value.

### (c) What the first full pull actually says

Both views parsed exactly to their `dataCount` — 211,005 and 591,820.

**`Status` is 91.2% BLANK** — 539,894 of 591,820, and they are empty strings
rather than nulls (the first measurement said NULL; that was the loader before
#1252 stopped it collapsing `""`). Its top value is not the one in Sam's example:

| Status | rows |
|---|---:|
| *(null)* | 539,894 |
| Implementation | 45,302 |
| Faculty | 3,294 |
| Initiator | 2,918 |
| Articulation Officer | 412 |

Four non-null values across 591,820 rows. **It cannot be a segmentation of the
backlog** — a chart faceted on approval stage would describe 8.8% of the data
while looking like it described all of it. An absent stage is not a stage.

**`CPLPlanStatus` holds six checks, not the two the example showed:** CPL Docs
477,287 · Transcribed 82,235 · Ed Plan 45,529 · Analysis 36,489 · Counselor
23,106 · **Student** 20,457, across 41 combinations. Its formatting is
inconsistent — most values are pipe-*terminated* (`"CPL Docs |"`) but 29,902
rows carry a bare `Transcribed` with no pipe at all, so a parser must split and
strip rather than assume a trailing delimiter.

⚠️ **The Transcribed fork.** `Transcribed` is both a lifecycle check and a
numeric column, and they disagree by 3.2×:

```
rows with the CHECK    82,235
rows with UNITS > 0    25,621
rows with both         25,621     <- the units set is a STRICT SUBSET
```

So 56,614 rows are marked transcribed in the lifecycle with zero transcribed
units. This is the same shape as `applied-measure-fork-55-percent`, where Sam's
ruling was **publish both and name the gap**. The containment is cleaner here,
which makes the two readings easy to state: the check says *a college marked the
step done*; the units say *a quantity was recorded against this row*. Neither is
wrong; "transcribed" unqualified is a 3.2× difference. **Needs Sam:** which one
the Course Credit tab and the $50k disposition work should mean.

### (d) The reconciliation is not uniformly staleness resolving

The totals run the predicted direction — 211,005 vs 204,714 (+3.07%), 47,804
distinct students vs 42,346 (+12.9%). But **Moreno Valley went DOWN**: 7,771
incoming against 7,963 live, −192.

MVC was chosen as the test *because* it spans eight catalog years where most
colleges have five. It is the one that disagrees, and in the direction staleness
cannot explain. The incoming pull also carries **112 colleges against 111 live**
(one new college, none lost). §(d3) explains it — a catalog-year roll-forward.

**The rule this earns: a one-directional total does not license a swap.** An
aggregate matching the prediction can hide a subset contradicting it, and the
subset is where a defect would live. `SQL 1` in the runbook makes the per-college
pass a gate rather than a courtesy.

### (d2) The staging gate earned its keep on the first run

Reconciling staging against live surfaced a defect **in this session's own
loader**, which no amount of re-reading would have found:

```
                     live      staging
catalog_year ""       414            0      -> 414 NULL
exhibit_id   ""       348            0      -> 355 NULL
college_course ""  196,044           0      -> 202,196 NULL
source_code  ""       619            0      -> 1,335 NULL
```

`_clean()` mapped the empty string to `None`. Its own docstring claimed to
honour `map_dataset_sql_for_malone` caveat 2 — *blankness is inconsistent and
that is data* — and it did preserve `"-"` and `"Default Credit"` while breaking
exactly the case the caveat names: **the `-Area` variant arrives empty.**

The second count is the one that would have hurt. **The live table stores `""`.**
Swapping in NULLs changes the representation of blankness on ~200k rows during
what is billed as a refresh, and `count(distinct catalog_year)` silently goes
**9 to 8** — which is what first looked like a missing catalog year.

**A load must reproduce its source, not improve it.** NULL is arguably the
better representation of absent; that is a separate change, argued on its own,
not a side effect of a refresh. `_clean()` now passes `""` through, the test
pins all four columns, and the mutation back to the old behaviour fails on all
four.

### (d3) The decreases are a catalog-year ROLL-FORWARD, not deletions

Only **two of 112 colleges** went down — and both are RCCD: college 2 (−493) and
Moreno Valley (−192). Every other college is flat or up. By catalog year,
statewide:

| catalog year | live | staging | delta |
|---|---:|---:|---:|
| 2020-2021 | 223 | 208 | −15 |
| 2021-2022 | 106 | 102 | −4 |
| 2022-2023 | 7,067 | 6,951 | −116 |
| 2023-2024 | 19,407 | 18,797 | −610 |
| 2024-2025 | 65,010 | 65,630 | +620 |
| 2025-2026 | 96,980 | 99,417 | +2,437 |
| 2026-2027 | 15,494 | 19,472 | **+3,978** |

Every older year shrinks and every newer year grows. Rows are being **re-keyed
forward in catalog year**, not removed; colleges 2 and 3 net negative only
because their forward growth did not offset their older-year losses (MVC:
2023-24 −514, 2026-27 +427).

⚠️ **Consequence worth stating: a per-catalog-year time series off this table is
not stable.** Last year's figure changes when you re-pull, because rows move
between years. Anyone charting adoption by catalog year needs to know that the
x-axis is mutable.

### (e) Two design decisions worth carrying

**Staging, not a live write.** Both live tables are reviewer-gated, feed the
Course Credit tab, the College Action page and the published aggregates, and one
is 537,908 rows at student grain. Putting a replace on a runner means a
half-finished insert blanks a live tab. The runner fills staging; the swap is a
gated SQL step. The workflow deliberately has **no schedule** — a daily automatic
reload of a student-grain table is Sam's call, not a default.

**The student key could not be carried over, and did not need to be.** Live
`student_key` is a dense surrogate 1..42,346 from the Access `tblStudentKey`
sequence; the API sends a 64-hex salted hash. They cannot be joined in either
direction. That looked like a blocker until the consumers were checked:
`student_key` appears in exactly three SQL files, always inside
`count(distinct …)`. A distinct-count is invariant under relabelling, so the
loader assigns a fresh dense surrogate per pull and discards the hash.
**Checking the consumers turned a blocking design question into a non-issue in
one grep** — the same move as `methodology-verify-consumer-before-migrating`.

### (f) New durable notes

- [`methodology-minimisation-happens-twice`](kb-notes/methodology-minimisation-happens-twice.md)
  — the request boundary and the storage boundary are different decisions.
  Twelve fetched columns had no consumer; they are dropped and *listed*, because
  an omission reads as an oversight to the next person.
- [`methodology-a-guard-test-must-not-be-able-to-fire-the-guarded-action`](kb-notes/methodology-a-guard-test-must-not-be-able-to-fire-the-guarded-action.md)
  — found by mutation-testing this session's own suite. With the truncate guard
  removed the test reached `urlopen`; it passed locally **only because the
  sandbox blocks egress**, and the workflow runs it on a runner that does not.
  A sandbox restriction masked a defect and read as a green test.

### (g) Next concrete step

1. **Reconcile per-college from staging** (runbook SQL 1) and explain the
   colleges moving the wrong way, MVC first. That is the gate.
2. Then swap A and B, restore RLS **separately** — the two tables do not share a
   policy, and restoring the articulation table's onto the student table hands
   537,908 student-grain rows to every team-phrase holder.
3. Ask Sam which "transcribed" the tabs should mean.
4. Decide whether this ever gets a schedule.


---

## 2026-08-19 (Session 171, part 2) — Sam took the human out of the loop

> *"This will run in the daily cron so just making sure I don't have to do a
> staging to live approval every day."*

Merged **#1254**. The load is live and runs itself at **13:40 UTC** daily.

### (a) Removing a human means replacing what they were doing, not deleting it

The staging design was right; the *human* in it was the part that did not scale.
So each thing the approval step was providing became a machine check, and every
one fails closed:

| the human was catching | what catches it now |
|---|---|
| a half-finished insert blanking a live tab | **one transaction** |
| **the RLS-restore trap** | **gone as a step** — contents are replaced, never the table |
| a truncated or broken pull | G1–G6, measured against the live table being replaced |
| publishing a recoverable suppression | G7/G8, blocking |
| published and unsuppressed drifting apart | both aggregates rebuild in the same transaction |

The second row is the one worth dwelling on. The runbook written that morning
had a step saying *restore these two policies separately, and if you restore the
wrong one you hand 537,908 student-grain rows to every phrase holder and the tab
looks completely normal afterwards.* Automating that step faithfully would have
automated the hazard. **Replacing `DROP TABLE`/`CREATE TABLE` with a contents
swap deleted the hazard instead of scheduling it.** The safest version of a
dangerous step is the one that no longer exists.

### (b) The gates were tested by breaking them

Claiming "fails closed" without firing one would have been exactly the sin this
session already caught itself in. `student_key = 999999999` inserted into
staging:

```
ERROR: G5 surrogate key is not dense 1..N (min=1, max=999999999, distinct=47805, nulls=0)
       - refusing to promote
```

Live was byte-identical afterwards — and the junk row rolled back with it,
because the check and the insert were in the same transaction.

A **client timeout** then proved the same property by accident: the MCP gave up
at 60s mid-promotion, and live was unchanged with nothing logged. The fix was
`TRUNCATE` over `DELETE` (fully transactional in Postgres, and it does not write
~800k dead tuples) plus `statement_timeout` set **on the function** — the runner
reaches it through PostgREST and inherits the role setting, not the client's
patience.

### (c) Two contract mismatches, both caught with live untouched

**Blank vs NOT NULL, and it is per-table.** `map_college_cr_unit` is NOT NULL on
every numeric; the API sends blanks. The blanks are not scattered —
`sum_applied_credits` is blank on **exactly** the 26,953 `Not Applicable` rows
and on no other disposition. That is caveat 4 of the spec: *"all four credit
fields are 0 on unapproved rows. That is correct behaviour, not missing data."*

But `map_student_credit` is *nullable* on `applied_credits`/`transcribed_credits`
and **holds nulls** (31,467 / 19,533). So a house-style rule would have been
wrong on one table whichever way it pointed. **Each table's contract is mirrored
separately**, the test pins both directions, and staging now carries the live
NOT NULL constraints so a mismatch fails at load rather than at promotion.

### (d) The headline moved, and a number was reported wrong first

| measure | was | now |
|---|---:|---:|
| dormant units, **published** | 1,051,870 | **1,183,569** (+12.5%) |
| dormant units, unsuppressed | 1,052,531 | 1,184,787 |
| already articulated + waiting, published | 63,991 | **72,501** |
| distinct students | 42,346 | 47,804 |
| suppressed colleges | 13 | 14 |

⚠️ **A `+6.9%` was reported mid-session and was wrong for this purpose** — it was
`sum(potential_credits)` over the **student grain**, while the published headline
comes from `map_college_cr_unit` scoped `entity_kind='college'`. Both numbers are
real; only one is the one Sam quotes. **When a project has a canonical pair,
compute the pair, not a plausible neighbour** — and the number policy already
said published and unsuppressed move together, which is the same instruction
seen from the other side.

### (e) Next concrete step

1. **Sam rules on "transcribed"** — the check is 3.2× the units and strictly
   contains them. Nothing should quote either until he picks.
2. **Watch the first unattended 13:40 UTC run.** Proven by dispatch, not yet by
   the schedule firing on its own.
3. A `G`-numbered failure is a gate working. **Fix the pull, never the gate.**
