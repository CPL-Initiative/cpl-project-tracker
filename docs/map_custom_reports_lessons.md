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
one real view in the list — and the probe printed it as `✗` and summarized it in
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
describes today's behavior, and `cpl_memory: statewide-is-138-not-84` is the
precedent for a correct ruling sitting unenforced because no consumer changed.

`Notes` is held permanently — free text at student grain, written by staff, read
by nothing.

⚠️ **Three status-shaped fields** ship in that view and they are not
interchangeable: `Status` (workflow stage) · `CPLStatusPlan` (what the college
decided — the entire reason the view was wanted) · `CPLPlanStatus` (**not a
status**; a pipe-delimited checklist, `"CPL Docs |Ed Plan |Analysis |Counselor |"`).

**The payload IS the PII boundary.** `fetch_custom_report.py`'s minimization is
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
  Build it anyway: an assurance describes today's behavior, and this failure is
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
pins all four columns, and the mutation back to the old behavior fails on all
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
fields are 0 on unapproved rows. That is correct behavior, not missing data."*

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

---

## 2026-08-19 (Session 172) — the cron would have failed tonight, before any gate

**The queue said "watch the first unattended 13:40 UTC run."** Watching it meant
looking at what had already run, and the most recent dispatch — run 4, 21:30
UTC, on the merged code — had **failed**. Not the promotion. The step before it.

### (a) What broke: a mass DELETE the promotion had already stopped using

```
File "kb/_sync_map_custom_reports.py", line 442, in truncate
    _request("DELETE", f"{table}?college_id=not.is.null", key)
urllib.error.HTTPError: HTTP Error 500: Internal Server Error
```

The Postgres log for that second says what the 500 does not:
**`canceling statement due to statement timeout`**, 21:34:39.193, ~370 ms before
the client saw the error. Emptying `stg_map_student_credit` by DELETE means
writing **591,820 dead tuples**, and that does not fit the role's default
timeout.

⭐ **The fix already existed a few lines away, in the same workstream, written
the same day.** `map_promote_custom_reports()` swaps live with TRUNCATE and says
why in its own comments — *"TRUNCATE, not DELETE: … does not write ~800k dead
tuples, which is what pushed the first attempt past a minute."* Session 171
learned it for the **live** half under a client timeout, fixed it there, and the
**staging** half kept the DELETE. A lesson recorded inside one function is not a
lesson applied to the pipeline.

⚠️ **It failed at the step BEFORE the gated one, so no gate could have caught
it.** G1–G9 all measure staging against live; they cannot fire when the run dies
on its way to filling staging. **A gate protects what is downstream of it, which
is exactly why the undefended half is the half to look at.**

⚠️ **And it would have failed EVERY night from now on.** Runs 1–3 passed because
staging was still small or empty; run 4 was the first to meet a **full** staging
table, and staging is full after every successful run. This is the shape of a
defect that arrives on the day automation starts running unattended: the
successful manual runs are not evidence, because they ran in a state the cron
never sees again.

### (b) The fix, and the safety property that came free

`map_clear_custom_report_staging()` — `truncate table stg_map_college_cr_unit,
stg_map_student_credit`, returning what it cleared so the log says so. Measured
on the same 802,825 rows that timed out: **5.3 s**, most of it the two counts.

⭐ **It takes NO ARGUMENT, and that is the point.** The Python `truncate(table,
key)` it replaces took a table name and defended itself with `assert
table.startswith("stg_")` — a good guard, but it means the pipeline's one
destructive call was one bad string away from a reviewer-gated student-grain
table. The two staging tables are written into the SQL body now, so **there is
no argument to get wrong.** Same shape as `cpl_memory:
the-safest-version-of-a-dangerous-step-is-one-that-does-not-exist`.

⚠️ **The failure printed as a bare urllib traceback**, unlike `insert()` and
`promote()`, which decorate theirs. That is why the log reads as a mystery 500
instead of naming the step. `clear_staging()` now says what failed, and that
**nothing live has changed** — true by construction, since it runs before the
promotion.

### (c) Verification

- Test §8 rewritten: one request, `POST rpc/map_clear_custom_report_staging`
  pinned to the **literal** (comparing a module against its own constant follows
  the constant wherever it is pointed), no table name in the path, and a
  source-level check that **no `DELETE` in the loader names anything but the
  sketch table**.
- **Three mutations, all caught**: a table name back in the path, a reintroduced
  live-table DELETE, and the RPC renamed away from the SQL function.
- The function was applied to Supabase and run against the full staging tables
  before any of this was merged. Live was never touched.

### (c2) And then the ACL, which is the finding that outranks the outage

Adding the new function meant writing the same `revoke ... from anon,
authenticated` line the workstream already used. Checking whether it worked —
rather than trusting it — turned up this:

```
proacl: {=X/postgres,postgres=X/postgres,service_role=X/postgres}
         ^^ empty grantee = PUBLIC holds EXECUTE
select has_function_privilege('anon','public.map_promote_custom_reports()','execute')  ->  true
```

⚠️ **`revoke ... from anon, authenticated` does not remove a PUBLIC grant.**
Postgres grants EXECUTE to PUBLIC at creation, anon and authenticated are
members of PUBLIC, and privileges are additive. The statement succeeds, reports
nothing, and protects nothing.

**Six security-definer functions were callable with the published anon key** —
`map_promote_custom_reports` (truncates both live tables and rebuilds the
published aggregates), `rebuild_map_college_goal2`,
`rebuild_map_college_credit_summary`, `rebuild_map_cleanup_worklist`,
`rebuild_map_transcribed_gap`, and the new staging clear. The anon key ships in
the dashboard JS in a public repo.

⭐ **The correct idiom was already in this repo, twice** —
`cpl_funding_optin_review` and `gr_pass_check` both name `public`. Two spellings
of one intent, one of which silently does nothing, is a lint rather than a style
preference: `tests/supabase_function_grants_test.py` now fails the build on the
wrong one, and runs in the js-tests check.

⚠️ **Verified `service_role` held an EXPLICIT grant on all six BEFORE revoking
PUBLIC.** If its privilege had come only from PUBLIC, the fix would have broken
the nightly load — the revoke is the same statement either way, and only the
check tells them apart. Post-revoke: anon `false`, service_role `true` on all six.

⚠️ This is **not** an RLS question. RLS gates the rows a query sees; a
`security definer` function bypasses it by design. **The EXECUTE grant is the
only thing between a destructive definer function and the internet.**

### (c3) Then the next queue item turned out to be about to say something false

The queue's next step was *"work P1 as one instruction to ~100 colleges."*
Reading the rows before drafting the instruction, rather than after:

| what the class said | what the rows say |
|---|---|
| *"Rule these Not Applicable. ACE has already said no credit is recommended."* — 17,594 rows, `one rule`, ~100 colleges | `0 hours in Credit may be granted on the basis of an individualized assessment of the student` — **3,970 rows / 95 colleges** |
| | `0 hours in Additional swimming on the Basis of Institutional Evaluation` — **1,075 / 86** |
| | `0 hours in Credit in surveying on the basis of institutional evaluation` — **171 / 57** |

⭐ **ACE is deferring to the college, not refusing.** The class was assembled from
a *predicate* — zero-unit recommendation — and then named after the commonest
reason a recommendation carries zero units. **Zero units is the mechanism of a
deferral, not evidence of a denial.** One instruction to ~100 colleges would have
closed **5,311 rows at 101 colleges** on a stated ground that contradicts the
recommendation itself.

⚠️ **A false zero nobody can report.** Unlike a search that returns nothing, a
college told the door was closed never files feedback about it — the same failure
mode as the Cerritos ironworker zero, one step further upstream, because here we
would have been the ones saying it.

Now split: **P1 12,283** (ACE no-credit 11,926 · expired window 137 · residue
220) keeps `one rule` and is safe to send; **P5 `credit MAY be available if the
college evaluates`** — 5,311 / 3,898 students / 101 colleges, `effort_shape:
needs a ruling`, owner Sam — states the facts and **prescribes nothing**. Its
rank is READINESS, not value: it is the only class in the worklist that could
still become credit for a student. Conservation: 12,283 + 5,311 = 17,594.

⚠️ **Two matcher misses only text inspection finds**, both now covered: the
corpus contains `Credit Is Not Recommeded` (26 rows, missed by
`ilike '%recommended%'`) and `individual assessment` without the *-ized* (20).

⚠️ **Every large P1 college carried a substantial share** — CCSF 284 of 899,
San Diego City 223, Long Beach 204, Mesa 190, Miramar 188. It was not a tail.

⚠️ **The docs lint caught my own first fix.** Writing the correction *as a
correction* into `CLAUDE.md` §11 pushed the cell to 4,374 chars and tripped
`stacked_roadmap_cell` — the rule that says a cell states current truth, not a
log. The history belongs in this doc and in
[`docs/map_cleanup_worklist.md`](map_cleanup_worklist.md); the cell now states
what is true today, and is 1,100 chars shorter than before the session.

### (d) Next concrete step

1. **The 13:40 UTC run tomorrow is still the proof.** It is the first firing on
   its own schedule *and* the first exercise of the new clear step in the cron.
2. **Sam rules on P5** — is Not Applicable right when no evaluation has been
   done, does it stay Needs Action, or does MAP need a state it does not have?
   Nothing about those rows should reach a college first.
3. Carryover unchanged: Ashley's Delta outcome, the statewide engine's second
   occupation list, `CLAUDE.md` at 2× budget.

---

## 2026-08-20 (Session 172, later) — the cron ran itself, and the ruling beat the options

### (a) The first unattended run

Fired on its own schedule and succeeded. The line that matters, from the runner:

```
staging cleared (was 211,005 + 591,820 rows)
```

That is the new step meeting a **full** staging table with nobody watching — the
exact condition that broke the night before — and clearing it in seconds.
`map_college_cr_unit` 211,005 → **213,447**, aggregates + worklist + transcribed
gap rebuilt in the same transaction, salt-rotation overlap **1.000**, no gate
fired.

⚠️ **It fired at 14:18 UTC, not 13:40.** GitHub's scheduler drift, already
documented for this repo. Do not "fix" the cron expression for it.

⚠️ **One odd one out, carried as a lead rather than a tally entry.**
`map_student_credit` came back **byte-identical** — 591,820 rows, 47,804
students, and the same distribution on every measure in the log — while the
catalog-year view grew by 2,442. Two candidate explanations: MAP refreshes the
two views on different cadences, or the change is confined to the catalog-year
dimension, which only the other table carries. **Two data points cannot separate
them.** If a third run repeats it, ask ITPI.

### (b) Sam's ruling went past the options it was given

The brief offered three dispositions. He picked none of them and named a
mechanism instead: *"presented to students as Credit by Exam options for them —
not ruled out by college staff (unless they don't permit Cx for that particular
course)."*

⭐ **It was never a disposition problem.** Asking "what does a college record"
already assumes the row is something to be closed. It is an **offer nobody was
making**.

⭐ **The expensive-looking option was free.** Option C had been framed as *MAP
needs a state it doesn't have* — ITPI dev work on someone else's timeline. It
doesn't: Credit by Exam is an existing CPL type and the **largest in the curated
corpus, 798 credentials**, ahead of Industry Certification's 671. Checking that
before writing the ruling down is what turned a platform request into a
presentation change.

⭐ **The grounding is a one-line measurement:** all 5,311 rows carry an **empty
`course_type`**. They are *untyped*, not refused — and an untyped row reads
exactly like a closed one, which is the whole reason this class looked dead.

⭐ **A well-chosen rule dissolves the question it was asked.** The brief argued
this needed *two* rulings, because swimming (95% cumulative) might not rule with
individualized assessment (75%). Under Cx it never comes up: **the college's own
Cx policy for that course decides swimming**, which is where that judgment
belonged. When an answer makes a sub-question disappear rather than answering it,
that is evidence the frame was wrong, not that the answer was lucky.

⚠️ **The rank is now stale in the other direction.** P5 meant *readiness*, and
readiness is resolved; it is the highest-**value** class in the worklist. The
number is left alone deliberately — the team refers to these classes by number —
and flagged for Sam rather than changed unilaterally.

### (c) Visuals now survive the session

Sam: *"Many are so useful I find myself wanting to go back to them."* They were
published as artifacts — a URL outside the repo, outside the vault, outside every
search either of us runs. `docs/visuals/` now holds the HTML with a dated
filename and an index. It sits in the `docs/` lane the sparse vault clone
materialises, so they reach Obsidian with nothing to file.

⚠️ **The first rule of that folder applies to its first file:** a visual that
asked a question keeps its answer. This one was updated the same day to record
the ruling instead of still posing the choice.

### (d) Then Sam read the visual and asked what it had not asked

*"Is the CR for many of these just a vague 'College may grant credit based on its
own assessment' — no reference to a discipline or course? The swimming example is
a good Cx opportunity, but if there is no course or discipline, it's meaningless
and a copout on ACE's part. Students can request Cx at any time provided the
catalog allows for it for the particular course."*

**Right about three quarters of it.**

| shape | rows | exhibits | colleges |
|---|---:|---:|---:|
| names a subject — swimming, surveying, First Aid and Fire Science, Anatomy and Physiology, Gas Turbine Technology | **1,310** | 26 | 89 |
| names no course at all | **4,001** | 225 | 95 |

⭐ **The failure mode is one level below the P1 split, and I walked straight into
it.** The P1 fix checked whether a class shared a *reason*. This asks whether the
rows share **usable content** — and the answer was no. I had even quoted the
uniformity of *"Credit may be granted on the basis of an individualized assessment
of the student"* (75% of the class, one sentence) as evidence the ruling would be
cheap, without noticing the sentence says nothing. **A string being identical
everywhere is not the same as it being informative anywhere.**

⭐ **A Cx offer has to name a course to challenge.** Without one it collapses into
*"you may request Cx"*, which every student can already do — so the row adds
nothing it did not already have. Sam's framing is exact: a copout in the source
data.

⭐ **The row is not empty; the RECOMMENDATION is.** Each still carries the exhibit
— the training ACE reviewed. And `fetch_custom_report.py` **already asks the
exhibit catalog for `AceID` and `Title`** and stores neither, while
`map_student_credit.exhibit_id` is in the ACE namespace. *Minimization happens
twice*, and this is the cost side of it: a column dropped for having no consumer
is invisible until something needs it.

⚠️ **The join rate is deliberately unmeasured.** The catalog is fetched on the
runner and never written down, so it can only be counted on the next run. Stated
as an open number rather than an assumed one.

⚠️ **The 0-of-225 in `chatbox_exhibits` was checked against a positive control
before being believed** — 785 of 6,330 exhibit ids DO join, so the join works and
that corpus simply has no ACE military exhibits. A zero from a join is a claim
about two tables, not one.

---

## 2026-08-20 (Session 172, SkySwap) — the Cx ruling, and two corrections to my own build

### (a) Sam's rulings this run

1. **The deferrals are Credit by Exam offers.** *"These should be presented to
   students as Credit by Exam options for them — not ruled out by college staff
   (unless they don't permit Cx for that particular course). Later, as I curate
   the CCRR table I will normalize these ACE CRs as Cx for specific courses on
   the CCR."*
2. **Then he challenged his own ruling and was right.** *"Is the CR for many of
   these just a vague 'College may grant credit based on its own assessment' — no
   reference to a discipline or course? … if there is no course or discipline,
   it's meaningless and a copout on ACE's part."* → **4,001 of 5,311 name no
   course.** Split into `cx-course-named` (1,310, sendable) and
   `cx-no-course-named` (4,001, not sendable).
3. **He asked for the list plus an alignment indicator** — *"a short list of the
   no course CRs + the title of their ACE exhibit (e.g., Corpsman, Hospitalman,
   Rifleman, MP)… tag the generic Cx opportunity with an indicator of where their
   training might align with a course."*

### (b) The titles: 97.3%, after I read the wrong key

`fetch_custom_report.py` had asked the catalog for `AceID` **and** `Title`
since 2026-08-14 and stored neither. **25,794 titles now load; 219 of 225
exhibits resolve.**

⚠️ **The first run returned zero, and everything behaved correctly while doing
so.** `ace_titles()` read `ds.get("data")`; the API returns rows under
`columnValue` — as this same file does 200 lines further down. The run passed,
the gate declined to blank live titles, the log said *"no titles parsed"*.

⭐ **The test could not have caught it: its fixture carried the same wrong
assumption.** A fixture invented alongside the code it tests cannot falsify that
code's premise — which is why this file's header says fixtures are built from the
real column contracts. Fixed structurally: `rows_of(ds)` is the one place the key
lives, and a `data`-keyed payload must yield **nothing** rather than being
tolerated.

### (c) The alignment tier was mostly one blanket mapping

First cut: tier 1 = a course named by ≥2 colleges. That shipped a tier 1 where
**11 of 14 exhibits pointed at `MAG-51 Elements of Supervision`** — Infantryman,
Combat Medic, Cook, Truck Driver and HR Specialist alike.

⭐ **Counting colleges cannot tell corroboration from a blanket mapping.** Three
colleges blanket-mapping any military service to a supervision course is
indistinguishable, *by college count*, from three colleges independently
agreeing. I designed that floor as the safety mechanism and it was the wrong
axis.

The discriminator is **specificity** — how many distinct exhibits a course spans:

| course | spans |
|---|---:|
| `MAG-51 Elements of Supervision` | **33** |
| `MAG-200 Management Work Experience` | 10 |
| `AUTOCOR-114 BASIC WELDING THEORY` | 8 |
| `ADJ-1 Intro to Administration of Justice` | **1** (Military Police) |

Re-tiered on ≥2 colleges **and** <4 spans: **3 / 47 / 175 exhibits** (689 / 2,282
/ 1,030 rows). All of tier 1 is Military Police → ADJ-1, HR Specialist → MAG-56 +
CIS-001, and Marine Combat Training → `CPL-3 Elective Course Credits` — a
**placeholder**.

⭐ **Honest read: the titles are the deliverable; peer precedent is mostly
noise.** Two exhibits carry a pointer worth acting on. Reported as two rather
than fourteen.

⚠️ **A CCRR finding in its own right:** three colleges have mapped `MAG-51`
against **33 distinct military exhibits**.

### (d) Next concrete step

1. **Sam decides the surface** — the guidance list is live and invisible. The MAP
   Data Quality tab fits (already team-phrase gated, already the "what's wrong
   and who fixes it" surface), but as a **lookup panel behind the P5 row**, not
   another queue: 225 exhibits is reference, not 225 to-dos.
2. **Does tier 2 earn its place?** That decides whether the panel shows one tier
   or three.
3. Send the **1,310 `cx-course-named`** rows as the Cx offer.
4. Unchanged carryover: Ashley's Delta outcome, the second occupation list.

## 2026-08-26 (Session 197, SkyVerdict) — three nights of failure, and the answer was in a field nothing read

**Sam, from memory:** *"I got a message in a session yesterday … something like
double records and that it might heal itself on the next cron."*

It did not heal. **Runs 12, 13 and 14 all failed** — 24, 25 and 26 August. Last
clean run was 23 August at 13:57 UTC.

### What the runs said, and why it pointed at the wrong view

Every failing run reported the same shape: 10 datasets returned,
`View_StudentDetailsCredits_APIDataset` listed **twice**, and
`View_CollegeExhibitCRByCatalogYear_APIDataset` **absent**. So the obvious
reading — and the one three nights of logs supported — was that the *exhibit* view
had been renamed or retired.

I reasoned my way further down that path than I should have. The payload had
halved (341 MB → 157 MB), and between 25 and 26 August the two duplicate slots
each grew by 820 rows while the payload grew 233,321 bytes — **142 bytes/row**,
which back-solves the student row to ~357 bytes. Conclusion: both slots carry
exhibit-CR data and the student data is gone. The second half was right. The
first half was inference dressed as measurement.

### Sam pulled the report by hand and MAP answered in one sentence

```
"columnValue": null,
"responseCode": "400",
"responseMessage": "View_StudentDetailsCredits_APIDataset is not Valid"
```

⭐ **MAP had been saying exactly what was wrong, per dataset, every night.**
`fetch_custom_report.py` read neither `responseCode` nor `responseMessage`. It
printed `dataCount` — MAP's **claim** — rather than the rows it parsed, which is
how an empty dataset advertised "204,491 rows" for three nights running.

⚠️ **And the dead view was the STUDENT one, not the exhibit one.** The batch
response's labels are precisely what cannot be trusted here: one invalid view
makes MAP put the invalid name on a *neighbour's* dataset, so the name that
vanished belonged to a healthy view. My byte arithmetic was sound and my
conclusion from the labels was not.

### The fix, and the part of it that is not obvious (#1358)

`summarize_response()` is pure, so the outage reproduces as a fixture rather than
a live request. Three checks:

- **`responseCode`** — an ABSENT code is normal; only a PRESENT non‑2xx fails.
  Treating absence as an error would fail every healthy pull (mutation M2).
- **`dataCount` is a claim.** Rows are counted from `columnValue`; disagreement
  prints as `[MAP claims N]`.
- **A duplicate `viewName` is fatal**, because every consumer keys on it.

⭐ **PRINTING IS UNCONDITIONAL, FAILING IS OPT‑IN, and the split is load-bearing.**
`daily-dashboard.yml` runs the *same* fetcher and falls back on a non-zero exit,
while consuming **none** of the views involved. Failing by default would have
dropped the public dashboard to its fallback path over datasets it never reads —
a regression caused by the fix. `--strict` is passed only by the Supabase load.

Six mutations, all caught. All 21 funding suites and the three custom-report
suites green.

### What Sam asked ITPI, and the second ask

Pedro has both requests and will correct the report overnight. The second is the
one that matters for the noncredit funding lane: **an origination LocID** on the
student-detail view.

⭐ **Framed as the identity of a route MAP already records the type of** — the
credit P1 metric already says "originating from either CPL Portal, College CPL
Landing Page, or batch upload". That is a field addition to an existing concept,
not a request to build noncredit tracking.

Three requirements, each earned: same namespace as `CollegeID`; **NULL when
unknown, never defaulted to the enrolling college** (a default silently
manufactures credit-lane attribution); and on the **catalog-year view too**, or
NC earning can only ever be computed at student grain.

⚠️ **One question only ITPI can answer:** can a college have a second, noncredit
landing page with its own LocID, or is that only available to standalone
entities like NOCE and SDCCE? That decides whether this reaches the ~108 credit
colleges carrying noncredit FTES or only the standalone few.

⚠️ **`course_type` cannot substitute.** All ten values in `map_student_credit`
are credit types (Course credit, Area credit, Elective credit, Credit for Basic
Military Service ×3). There is no noncredit marker anywhere in the data we hold.

### Durable

- [`methodology-read-the-per-item-verdict-not-just-the-envelope`] — `cpl_memory`
  `read-the-per-item-verdict-not-just-the-envelope`.
