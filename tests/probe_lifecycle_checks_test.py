"""Guard kb/_probe_lifecycle_checks.py's pure parts — hermetic, no network.

The probe runs on the Actions runner against MAP; what can be proven here is
that its instrument reads a truncated response correctly, that its boolean and
token logic matches the shapes the wire is known to carry, that a student key
used for grouping NEVER reaches the log, and that a value carried by fewer than
MIN_ROWS rows is withheld. Each of those is a failure the run log could not
reveal on its own.

Run: python3 tests/probe_lifecycle_checks_test.py
"""
import contextlib
import io
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "kb"))
sys.path.insert(0, ROOT)

import _probe_lifecycle_checks as P  # noqa: E402

failures = []
checks = [0]


def check(label, cond, detail=""):
    checks[0] += 1
    if cond:
        print(f"PASS  {label}")
    else:
        print(f"FAIL  {label}" + (f"  — {detail}" if detail else ""))
        failures.append(label)


# ── 1. reading a truncated response ─────────────────────────────────────
full = ('[{"viewName":"View_X_APIDataset","responseCode":"000","responseMessage":"",'
        '"dataCount":3,"columnName":["CollegeID","Counselor Step"],'
        '"columnValue":[["3","True"],["3","False"]]}]')
h = P.header_of(full)
check("header: viewName lifted", h["viewName"] == "View_X_APIDataset")
check("header: dataCount lifted as int", h["dataCount"] == 3)
check("header: columns lifted", h["columns"] == ["CollegeID", "Counselor Step"])
check("rows_started on a response with rows", P.rows_started(full))
clipped = full[: full.index('"Counselor Step"') + 5]
check("header: a clipped column list is NOT read as a short one",
      P.header_of(clipped)["columns"] is None)
empty = full.replace('[["3","True"],["3","False"]]', "[]")
check("rows_started false on an empty columnValue", not P.rows_started(empty))
nulled = full.replace('[["3","True"],["3","False"]]', "null")
check("rows_started false on a null columnValue", not P.rows_started(nulled))
h400 = P.header_of('[{"viewName":"V","responseCode":"400","responseMessage":"V is not Valid",'
                   '"dataCount":0,"columnName":["A"],"columnValue":null}]')
check("header: responseCode/Message lifted", h400["responseCode"] == "400"
      and h400["responseMessage"] == "V is not Valid")

# ── 2. boolean spellings and JSON bools ─────────────────────────────────
for v in ("True", "true", " YES ", "y", "1", "t", True):
    check(f"truthy({v!r})", P.truthy(v))
for v in ("False", "no", "0", "", None, False, "maybe"):
    check(f"not truthy({v!r})", not P.truthy(v))
check("is_boolean_shaped on True/False strings", P.is_boolean_shaped(["True", "False", ""]))
check("is_boolean_shaped on JSON bools", P.is_boolean_shaped([True, False]))
check("not boolean-shaped on free text", not P.is_boolean_shaped(["True", "Pending"]))
check("not boolean-shaped when all blank", not P.is_boolean_shaped(["", None]))

# ── 3. tokens and kinds ─────────────────────────────────────────────────
check("checks_in splits and strips a pipe-terminated value",
      P.checks_in("CPL Docs |Ed Plan |Analysis |Counselor |") ==
      {"CPL Docs", "Ed Plan", "Analysis", "Counselor"})
check("checks_in on a bare Transcribed (no pipe)", P.checks_in("Transcribed") == {"Transcribed"})
check("checks_in on blank/None", P.checks_in("") == set() and P.checks_in(None) == set())
for name, kind in (("Counselor Step", "lifecycle"), ("CPLPlanAccepted", "lifecycle"),
                   ("CollegeID2", "origin"), ("LocID2", "origin"), ("Origin", "origin"),
                   ("Widget", "other")):
    check(f"kind_of({name!r}) == {kind}", P.kind_of(name) == kind)

# ── 4. the PII denylist ─────────────────────────────────────────────────
for name in ("Counselor Name", "AttestedBy", "Attested By", "Notes", "StudentID",
             "Counselor Email", "Modified By User", "BirthDate"):
    check(f"PII_DENY withholds {name!r}", bool(P.PII_DENY.search(name)))
for name in ("Counselor Step", "CollegeID2", "LocID2", "Origin", "CPL Docs", "Ed Plan",
             "Accepted", "Transcribed"):
    check(f"PII_DENY allows {name!r}", not P.PII_DENY.search(name))

# ── 5. the diff against what the daily fetch requests ───────────────────
live = P.known_columns(P.STUDENT_DETAIL) + ["Counselor Step", "CollegeID2"]
new, gone = P.diff_columns(P.STUDENT_DETAIL, live)
check("diff: new columns found", new == ["Counselor Step", "CollegeID2"], repr(new))
check("diff: held columns are not reported as new", "StudentMAPID" not in new and "Notes" not in new)
check("diff: nothing reported gone", gone == [], repr(gone))
_, gone2 = P.diff_columns(P.STUDENT_DETAIL, [c for c in live if c != "CPLPlanStatus"])
check("diff: a vanished requested column is reported gone", gone2 == ["CPLPlanStatus"], repr(gone2))

# ── 5b. the watch list names columns the daily fetch actually requests ──
check("WATCH columns are all in the daily request for the aggregated view",
      set(P.WATCH[P.STUDENT_AGG]) <= set(P.known_columns(P.STUDENT_AGG)),
      repr(set(P.WATCH[P.STUDENT_AGG]) - set(P.known_columns(P.STUDENT_AGG))))

# ── 6. profile_rows on a synthetic column-oriented dataset ──────────────
# 30 students x 2 rows. Ed Plan sits on students 0-14, Analysis on 0-11 and
# Counselor on 0-9 (nested, like the live checklist), so no two tokens tie.
# The boolean agrees with the Counselor check on every row but ONE (student
# 5, row 2), so agreement < 100%, TRUE = 19, and constancy = 29 of 30.
# CollegeID2 is blank on 40 rows, a foreign location on 10, and EQUAL to the
# enrolling college on 10 — every value under MIN_ROWS so both must be
# withheld from the log.
rcols = ["CollegeID", "Catalog Year", "CPLStatusPlan", "CPLPlanStatus", "AppliedCredits",
         "TranscribedCredits", "Counselor Step", "CollegeID2", "StudentMAPID"]
KEY = {i: f"a1b2{i:02d}" + "c" * 58 for i in range(30)}
rows = []
for i in range(30):
    for j in range(2):
        counselor = i < 10
        flag = "True" if counselor and not (i == 5 and j == 1) else "False"
        plan = ("CPL Docs |" + ("Ed Plan |" if i < 15 else "") + ("Analysis |" if i < 12 else "")
                + ("Counselor |" if counselor else ""))
        college = "7" if i >= 25 else "3"
        loc2 = "" if i < 20 else ("9001" if i < 25 else "7")
        tcr = "3" if i < 5 else "0"
        rows.append([college, "2025-2026", "Applied to CPL Plan" if counselor else "Needs Action",
                     plan, "3" if counselor else "0", tcr, flag, loc2, KEY[i]])

buf = io.StringIO()
with contextlib.redirect_stdout(buf):
    facts = P.profile_rows(P.STUDENT_DETAIL, rcols, rows, ["Counselor Step", "CollegeID2"],
                           group_key="StudentMAPID")
out = buf.getvalue()

f = facts["Counselor Step"]
check("profile: Counselor Step is boolean-shaped", f["boolean"])
check("profile: TRUE count", f["true"] == 19, str(f.get("true")))
check("profile: best token is Counselor, untied", f["best_token"][0] == "Counselor"
      and f["tied_tokens"] == ["Counselor"], repr(f.get("best_token")) + repr(f.get("tied_tokens")))
check("profile: agreement 95.0% (19 both, 1 check-only)",
      abs(f["best_token"][1] - 95.0) < 0.05 and f["best_token"][2:] == (19, 0, 1),
      repr(f.get("best_token")))
check("profile: constant within student = 29 of 30", f["constant_within_student"] == (29, 30))
check("profile: TRUE with transcribed units = 10", f["true_with_transcribed_units"] == 10)
check("profile: TRUE by disposition", f["by_disposition"] == {"Applied to CPL Plan": 19})
check("profile: colleges with any TRUE = 1", f["colleges_true"] == 1)
check("profile: baseline CPLPlanStatus constancy = 30 of 30",
      facts["plan_status_constant_within_student"] == (30, 30))
g = facts["CollegeID2"]
check("profile: CollegeID2 kind origin, fill 20", g["kind"] == "origin" and g["fill"] == 20)
check("profile: CollegeID2 equals enrolling on 10", g["equals_enrolling"] == 10)
check("profile: no student key value reaches the log",
      not any(k in out for k in KEY.values()) and "a1b2" not in out)
check("profile: a value under MIN_ROWS is withheld", "9001" not in out and "withheld" in out)
check("profile: the builder's sweep spelling check is reachable", "Counselor Step" in P.BUILDER_SWEEP)

# Two boolean columns: the overlap block must say how they nest. In the
# fixture the Student flag is TRUE on exactly the rows where the Counselor
# flag is TRUE for students 0-4 (10 rows), so Student sits WITHIN Counselor.
rcols_o = rcols + ["Student_Verified"]
rows_o = [r + ["1" if (idx // 2) < 5 else "0"] for idx, r in enumerate(rows)]
with contextlib.redirect_stdout(io.StringIO()):
    fo = P.profile_rows(P.STUDENT_DETAIL, rcols_o, rows_o, ["Counselor Step", "Student_Verified"],
                        group_key="StudentMAPID")
ov = fo["_overlaps"][("Counselor Step", "Student_Verified")]
check("profile: pairwise overlap counts (both 10, A-only 9, B-only 0, B within A)",
      ov == (10, 9, 0, "B within A"), repr(ov))

# JSON bools on the wire are the case the builder cannot survive — the probe
# must report the type so the verdict can say so.
rows_b = [[r[0], r[1], r[2], r[3], r[4], r[5], (r[6] == "True"), r[7], r[8]] for r in rows]
with contextlib.redirect_stdout(io.StringIO()):
    fb = P.profile_rows(P.STUDENT_DETAIL, rcols, rows_b, ["Counselor Step"], group_key="StudentMAPID")
check("profile: JSON bools are boolean-shaped and typed as bool",
      fb["Counselor Step"]["boolean"] and fb["Counselor Step"]["types"].get("bool") == 60
      and fb["Counselor Step"]["true"] == 19)

# A degenerate checklist (every check on the same rows) must be reported as a
# TIE, never as a pick — the first token in the list is not a finding.
rows_t = [[r[0], r[1], r[2], ("CPL Docs |Ed Plan |Analysis |Counselor |" if r[3].count("|") > 1 else "CPL Docs |"),
           r[4], r[5], r[6], r[7], r[8]] for r in rows]
with contextlib.redirect_stdout(io.StringIO()):
    ft = P.profile_rows(P.STUDENT_DETAIL, rcols, rows_t, ["Counselor Step"], group_key="StudentMAPID")
check("profile: a tie is reported as a tie", len(ft["Counselor Step"]["tied_tokens"]) >= 2,
      repr(ft["Counselor Step"].get("tied_tokens")))

print()
if failures:
    print(f"FAILED {len(failures)} of {checks[0]} checks:")
    for x in failures:
        print(f"  - {x}")
    sys.exit(1)
print(f"OK — {checks[0]} checks; the probe's instrument, boolean logic, denylist, "
      f"diff and privacy posture hold.")
