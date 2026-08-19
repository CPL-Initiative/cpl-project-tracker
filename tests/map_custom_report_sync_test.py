#!/usr/bin/env python3
"""Guard the MAP Custom Report loader's mapping, minimisation and key derivation.

    python3 tests/map_custom_report_sync_test.py

Every check here guards a FAILURE MODE that would survive review, not a happy
path. The loader turns positional API rows into two Supabase tables, and three
of the ways that goes wrong are silent:

  * picking the wrong one of three status-shaped fields (they are plausible
    substitutes for each other and share a value),
  * a renamed upstream column landing as a NULL column instead of an error,
  * a student attribute we chose not to keep drifting back in.

Verified to FAIL, not merely to pass: each check was confirmed to trip when the
behaviour it guards is broken.
"""

from __future__ import annotations

import importlib.util
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location(
    "sync_map", os.path.join(ROOT, "kb", "_sync_map_custom_reports.py"))
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)

failures: list[str] = []


def check(cond, msg):
    if not cond:
        failures.append(msg)


# ── Fixtures ───────────────────────────────────────────────────────────────
# Built from the real column contracts so a contract edit reaches the fixture
# automatically rather than leaving the test asserting against a stale shape.

CR_NAMES = list(sync.CR_UNIT_COLUMNS.keys())
ST_NAMES = list(sync.STUDENT_COLUMNS.keys()) + [sync.STUDENT_KEY_COLUMN] + [
    "Location", "CPL Mode", "CPL Program", "Program", "ProgramGoal",
    "Transfer Destination", "College Course", "Source Code",
    "CourseCredits", "AreaCredits", "ElectiveCredits", "DefaultAreaCredits",
]


def cr_row(**over):
    base = {
        "CollegeID": "3", "Source Code": "ACE", "ExhibitID": "AR-2201-0552",
        "Credit Recommendation": "Orienteering", "College Course": "-",
        "CPLStatusPlan": "Needs Action", "Catalog Year": "2025-2026",
        "Course Type": "Elective", "Student Count": "12",
        "Potential Credits": "3.0", "Articulated Credits": "0",
        "Applied Credits": "0", "Transcribed Credits": "0",
    }
    base.update(over)
    return [base[n] for n in CR_NAMES]


def st_row(**over):
    base = {n: "" for n in ST_NAMES}
    base.update({
        "CollegeID": "3", "ExhibitID": "AR-2201-0552", "Course Type": "Elective",
        "Catalog Year": "2025-2026", "Credit Recommendation": "Orienteering",
        "CPLStatusPlan": "Needs Action",
        "Status": "Initiator",
        "CPLPlanStatus": "CPL Docs |Transcribed",
        "PotentialCredits": "3.0", "CreditsInReview": "0", "AppliedCredits": "0",
        "TranscribedCredits": "0", "ArticulatedCredits": "0",
        "MilitaryCredits": "3.0", "NonMilitaryCredits": "0",
        "ApprenticeshipCredits": "0",
        sync.STUDENT_KEY_COLUMN: "f" * 64,
        "Location": "Moreno Valley College", "Program": "Business AS",
        "ProgramGoal": "Transfer", "Transfer Destination": "UCR",
        "CPL Mode": "JST", "CPL Program": "Veteran",
    })
    base.update(over)
    return [base[n] for n in ST_NAMES]


def cr_ds(rows):
    return {"viewName": sync.CR_UNIT_VIEW, "columnName": CR_NAMES,
            "columnValue": rows, "dataCount": len(rows)}


def st_ds(rows):
    return {"viewName": sync.STUDENT_VIEW, "columnName": ST_NAMES,
            "columnValue": rows, "dataCount": len(rows)}


# ── 1. The three status-shaped fields land in three different columns ──────
# Sam, 2026-08-19: Status = the articulation APPROVAL STAGE ("Initiator");
# CPLStatusPlan = the action taken on the CR (the disposition); CPLPlanStatus =
# not a status at all but the lifecycle CHECKS, which can be several.
# They are plausible substitutes for one another and Status/CPLStatusPlan share
# the value "Needs Action", so a wrong pick reads as correct.
rows, _ = sync.map_rows(st_ds([st_row()]), sync.STUDENT_COLUMNS, sync.STUDENT_VIEW,
                        extra_needed=(sync.STUDENT_KEY_COLUMN,))
r = rows[0]
check(r.get("status") == "Initiator",
      f"Status must land in `status` as the approval stage; got {r.get('status')!r}")
check(r.get("cpl_status_plan") == "Needs Action",
      f"CPLStatusPlan must land in `cpl_status_plan`; got {r.get('cpl_status_plan')!r}")
check(r.get("cpl_plan_status") == "CPL Docs |Transcribed",
      f"CPLPlanStatus must land in `cpl_plan_status`; got {r.get('cpl_plan_status')!r}")
check(sync.STUDENT_COLUMNS.get("Status") != sync.STUDENT_COLUMNS.get("CPLStatusPlan"),
      "Status and CPLStatusPlan map to the same column — they are different facts.")

# The checklist is stored VERBATIM. Splitting it in the loader would fix its
# grain before anyone has measured it.
check("|" in (r.get("cpl_plan_status") or ""),
      "cpl_plan_status was split or normalised; it must be stored verbatim, "
      "pipes intact, until the lifecycle checks have been given fields.")

# ── 2. A renamed upstream column must ERROR, never null-fill ───────────────
# The spec asked MAP to flag renames because we would not notice one. A loader
# that maps by position, or that tolerates a missing name, writes a column of
# nulls over live data and looks like it worked.
bad_names = [n if n != "CPLStatusPlan" else "CPL Status Plan" for n in ST_NAMES]
try:
    sync.map_rows({"columnName": bad_names, "columnValue": [st_row()]},
                  sync.STUDENT_COLUMNS, sync.STUDENT_VIEW)
    failures.append("a renamed column did not raise — it would have loaded as NULL")
except SystemExit:
    pass

# ── 3. Held columns must not reach a stored row ────────────────────────────
# fetch_custom_report.py decides what we ASK for; the loader decides what we
# KEEP, and it keeps less. Every held name is a student attribute with no
# consumer, which is exactly the kind of column that drifts back in.
stored = set(rows[0].keys())
for held in ("Location", "Program", "ProgramGoal", "Transfer Destination",
             "CPL Mode", "CPL Program"):
    check(held not in sync.STUDENT_COLUMNS,
          f"{held} was added to the stored contract; it is a student attribute "
          "with no consumer. Minimisation happens twice.")
    check(held in sync.HELD_COLUMNS,
          f"{held} is no longer listed in HELD_COLUMNS — the decision to drop "
          "it must stay visible, not merely be an omission.")

# ── 4. The per-student identifier must never be stored ────────────────────
# It is salt-hashed (Pedro Campos, ITPI, via Sam 2026-08-19), but the spec we
# sent MAP is explicit: "we only ever count distinct students — we never look
# one up." So it derives a surrogate and is discarded.
check(sync.STUDENT_KEY_COLUMN not in sync.STUDENT_COLUMNS,
      "StudentMAPID is in the stored contract — it must derive student_key and "
      "then be discarded, never land in a column.")
check(not any("f" * 64 == v for v in rows[0].values()),
      "the hashed StudentMAPID reached a stored value")

# ── 5. The surrogate is dense, 1..N, and counts distinct students ──────────
# student_key is only ever count(distinct ...) in this codebase, so it does not
# need to be stable across pulls — but it does have to be right within one.
many = [st_row(**{sync.STUDENT_KEY_COLUMN: h}) for h in
        ["c" * 64, "a" * 64, "b" * 64, "a" * 64, "c" * 64]]
ds = st_ds(many)
mrows, midx = sync.map_rows(ds, sync.STUDENT_COLUMNS, sync.STUDENT_VIEW,
                            extra_needed=(sync.STUDENT_KEY_COLUMN,))
mrows, stats = sync.assign_student_keys(ds, mrows, midx)
keys = [r["student_key"] for r in mrows]
check(stats["distinct_students"] == 3,
      f"distinct student count wrong: {stats['distinct_students']} (expected 3)")
check(sorted(set(keys)) == [1, 2, 3],
      f"surrogate must be dense 1..N; got {sorted(set(keys))}")
check(keys[1] == keys[3] and keys[0] == keys[4],
      "the same hash must get the same surrogate within a pull")

# A row with no student id keeps its data and gets a null key rather than being
# silently dropped — the row still carries credit.
ds2 = st_ds([st_row(**{sync.STUDENT_KEY_COLUMN: ""})])
r2, i2 = sync.map_rows(ds2, sync.STUDENT_COLUMNS, sync.STUDENT_VIEW,
                       extra_needed=(sync.STUDENT_KEY_COLUMN,))
r2, s2 = sync.assign_student_keys(ds2, r2, i2)
check(len(r2) == 1 and r2[0]["student_key"] is None and s2["rows_without_key"] == 1,
      "a row with no StudentMAPID must survive with a null key, not vanish")

# ── 6. ExhibitID blankness is DATA — do not normalise it away ─────────────
# map_dataset_sql_for_malone caveat 2: the -Course variant arrives as
# "Default Credit", the -Area variant empty, at least one college sends "-".
# The difference tells us which path the credit took.
variants = sync.map_rows(cr_ds([
    cr_row(ExhibitID="Default Credit"), cr_row(ExhibitID="-"),
    cr_row(ExhibitID=""), cr_row(ExhibitID="  AR-2201-0552  "),
]), sync.CR_UNIT_COLUMNS, sync.CR_UNIT_VIEW)[0]
got = [v["exhibit_id"] for v in variants]
check(got == ["Default Credit", "-", "", "AR-2201-0552"],
      f"ExhibitID variants were normalised away: {got!r}")

# "" must stay "" and must NOT become None. The live table stores empty strings
# (414 catalog_year, 348 exhibit_id, 196,044 college_course, 619 source_code on
# map_college_cr_unit), so a load that emits NULL changes the representation of
# blankness on ~200k rows during what is meant to be a refresh — and
# count(distinct catalog_year) silently goes 9 to 8. Caught by the staging gate
# on the first real pull, not by reading the code.
blanks = sync.map_rows(cr_ds([cr_row(**{"Catalog Year": "", "College Course": "",
                                        "Source Code": ""})]),
                       sync.CR_UNIT_COLUMNS, sync.CR_UNIT_VIEW)[0][0]
for col in ("catalog_year", "college_course", "source_code"):
    check(blanks[col] == "",
          f"{col} blank became {blanks[col]!r}; the live table stores \"\" and a "
          "load must reproduce its source, not improve it")

# Numeric columns are the exception: "" is not a number, so coercing it to None
# is a type conversion rather than a normalisation of meaning.
nums = sync.map_rows(cr_ds([cr_row(**{"Potential Credits": "", "Student Count": ""})]),
                     sync.CR_UNIT_COLUMNS, sync.CR_UNIT_VIEW)[0][0]
check(nums["sum_potential_credits"] is None and nums["distinct_students"] is None,
      "an empty numeric must coerce to None, not to an empty string")

# ── 7. The by-catalog-year contract IS map_college_cr_unit, column for column ─
CRU_LIVE = ["college_id", "source_code", "exhibit_id", "credit_rec",
            "college_course", "cpl_status_plan", "catalog_year", "course_type",
            "distinct_students", "sum_potential_credits",
            "sum_articulated_credits", "sum_applied_credits",
            "sum_transcribed_credits"]
check(list(sync.CR_UNIT_COLUMNS.values()) == CRU_LIVE,
      "the by-catalog-year contract no longer matches map_college_cr_unit's "
      f"columns in order: {list(sync.CR_UNIT_COLUMNS.values())}")

crr = sync.map_rows(cr_ds([cr_row()]), sync.CR_UNIT_COLUMNS, sync.CR_UNIT_VIEW)[0][0]
check(crr["college_id"] == 3 and isinstance(crr["college_id"], int),
      "CollegeID must coerce to int")
check(crr["sum_potential_credits"] == 3.0,
      "credit columns must coerce to numeric")
check(crr["distinct_students"] == 12,
      "Student Count must land in distinct_students as an int")

# ── 7b. Blank numerics zero-fill ONLY where the live table says NOT NULL ──
# The two live tables genuinely disagree and each contract is mirrored
# separately. map_college_cr_unit is NOT NULL on every numeric and holds 0;
# map_student_credit is NULLABLE on applied_credits / transcribed_credits and
# actually HOLDS nulls (31,467 / 19,533), so zero-filling there would be the
# same representation change #1252 removed, pointing the other way.
zf = sync.map_rows(cr_ds([cr_row(**{"Applied Credits": "", "Transcribed Credits": "",
                                    "Student Count": ""})]),
                   sync.CR_UNIT_COLUMNS, sync.CR_UNIT_VIEW,
                   zero_fill=sync.CR_UNIT_ZERO_FILL)[0][0]
check(zf["sum_applied_credits"] == 0 and zf["sum_transcribed_credits"] == 0
      and zf["distinct_students"] == 0,
      f"cr_unit blank numerics must zero-fill (live is NOT NULL): {zf['sum_applied_credits']!r}")

st_zf = sync.map_rows(st_ds([st_row(**{"AppliedCredits": "", "TranscribedCredits": "",
                                       "PotentialCredits": ""})]),
                      sync.STUDENT_COLUMNS, sync.STUDENT_VIEW,
                      extra_needed=(sync.STUDENT_KEY_COLUMN,),
                      zero_fill=sync.STUDENT_ZERO_FILL)[0][0]
check(st_zf["applied_credits"] is None and st_zf["transcribed_credits"] is None,
      "map_student_credit.applied_credits/transcribed_credits are NULLABLE live and "
      "hold nulls — zero-filling them is a representation change, not a fix")
check(st_zf["potential_credits"] == 0,
      "map_student_credit.potential_credits is NOT NULL live — it must zero-fill")

# The two sets must stay disjoint from the nullable columns, or the contract
# drifts silently the next time someone adds a column.
check("applied_credits" not in sync.STUDENT_ZERO_FILL
      and "transcribed_credits" not in sync.STUDENT_ZERO_FILL,
      "a nullable live column was added to STUDENT_ZERO_FILL")

# ── 8. Clearing staging names no table from Python ────────────────────────
# The one destructive step in the loader. It used to take a table name and
# defend itself with an assert on the "stg_" prefix, which left the
# reviewer-gated student-grain table one bad string away. It is now an RPC with
# NO ARGUMENT, so the tables live in SQL and there is nothing here to get wrong.
#
# It also stopped being a mass DELETE, which is what actually broke: 591,820
# deleted rows timed out and returned a bare HTTP 500, at the step BEFORE the
# gated one, where no gate could catch it.
_calls: list = []
_real_request = sync._request
sync._request = lambda *a, **k: (_calls.append(a) or (200, b'{"cr_unit_was":1,"student_was":2}'))
try:
    was = sync.clear_staging("key")
    check(len(_calls) == 1,
          f"clear_staging() made {len(_calls)} requests; it must be the ONE RPC")
    method, path = _calls[0][0], _calls[0][1]
    # Pinned to the LITERAL, not to sync.CLEAR_STAGING_RPC: comparing a module
    # against its own constant would follow the constant wherever it was pointed.
    check(method == "POST" and path == "rpc/map_clear_custom_report_staging",
          f"clear_staging() called {method} {path}, not POST "
          "rpc/map_clear_custom_report_staging — the name must match the "
          "function in kb/supabase_map_custom_report_staging.sql")
    check("map_student_credit" not in path and "map_college_cr_unit" not in path,
          "clear_staging() put a table name in the request path — the tables "
          "belong in the SQL function body, where there is no argument to get wrong")
    check(was.get("student_was") == 2,
          "clear_staging() must return what it cleared, so the log says so")
finally:
    sync._request = _real_request

# No DELETE anywhere in the loader may name anything but the sketch table, which
# is deleted per pull_date and is a bounded sample, never student rows.
_src = open(os.path.join(ROOT, "kb", "_sync_map_custom_reports.py"),
            encoding="utf-8").read()
for _line in _src.splitlines():
    if '_request("DELETE"' in _line:
        check("map_student_key_sketch" in _line,
              f"a DELETE names something other than the sketch table: {_line.strip()}")

# ── 9. The salt-rotation sketch stays a sketch ────────────────────────────
# A hash per student would be a persistent pseudonymous record of every student;
# a bounded sample is enough to tell a stable salt from a rotated one.
check(sync.SKETCH_N <= 5000,
      f"SKETCH_N is {sync.SKETCH_N} — the detector needs a SAMPLE, not a "
      "student map. Raising this turns a rotation check into a stored identifier set.")
big = [st_row(**{sync.STUDENT_KEY_COLUMN: f"{i:064x}"}) for i in range(sync.SKETCH_N + 50)]
dsb = st_ds(big)
rb, ib = sync.map_rows(dsb, sync.STUDENT_COLUMNS, sync.STUDENT_VIEW,
                       extra_needed=(sync.STUDENT_KEY_COLUMN,))
_, sb = sync.assign_student_keys(dsb, rb, ib)
check(len(sb["sketch"]) == sync.SKETCH_N,
      f"sketch must be capped at SKETCH_N; got {len(sb['sketch'])}")

if failures:
    print(f"FAIL — {len(failures)} problem(s):")
    for f in failures:
        print(f"  ✗ {f}")
    sys.exit(1)
print("OK — status-field mapping, rename guard, minimisation, surrogate keys, "
      "ExhibitID variants, live-table guard and sketch bound all hold.")
