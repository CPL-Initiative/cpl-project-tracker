#!/usr/bin/env python3
"""Guards for Sierra's program -> course membership (chatbox/build_program_courses.py
and chatbox/sync_program_courses.py).

    python3 tests/program_courses_build_test.py

Pure stdlib, synthetic rows. Each check names the failure it prevents.
"""
from __future__ import annotations

import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "chatbox"))

import build_program_courses as B  # noqa: E402
import sync_program_courses as S  # noqa: E402

FAILS: list = []


def check(name, cond, detail=""):
    print(("  ok   " if cond else "  FAIL ") + name + (f" — {detail}" if detail and not cond else ""))
    if not cond:
        FAILS.append(name)


def mrow(code, prog, course, pstat="Active", cstat="Active", crs="NURS101", title="Nursing I"):
    return {"CollegeCode": code, "ProgramControlNumber": prog, "CourseControlNumber": course,
            "ProgramStatus": pstat, "CourseStatus": cstat, "CrsId": crs, "Title": title}


def crow(college, code="NURS 101", title="Nursing I", units=4.0, cid=""):
    return {"college": college, "code": code, "title": title, "units": units, "cid": cid}


print("1. the college crosswalk needs two signals that agree")
mem = [mrow("851", "08086", "C1"), mrow("851", "08087", "C2"), mrow("863", "09000", "C3"),
       mrow("001", "NULL", "C9")]
pc = {"08086": {"Mt. San Antonio College"}, "08087": {"Mt. San Antonio College"},
      "09000": {"North Orange Continuing Education"}}
cc = {"C1": {"Mt. San Antonio College"}, "C2": {"Mt. San Antonio College"},
      "C3": {"North Orange Continuing Education Credit"}}
xw, rep = B.college_crosswalk(mem, pc, cc)
check("agreeing signals map the code", xw.get("851") == "Mt. San Antonio College")
check("the course list's ' Credit' spelling is one institution, not a disagreement",
      xw.get("863") == "North Orange Continuing Education" and "863" in rep["credit_spelling"])
check("a code with no program is dropped and reported, never guessed",
      "001" not in xw and "001" in rep["no_program_signal"])
try:
    B.college_crosswalk([mrow("851", "08086", "C1")], pc, {"C1": {"Citrus College"}})
    check("a real disagreement stops the build", False, "no SystemExit")
except SystemExit:
    check("a real disagreement stops the build", True)

print("2. assemble keeps current programs and courses Sierra can find")
xw = {"851": "Mt. San Antonio College", "961": "Riverside City College", "931": "College of the Desert"}
programs = {("Mt. San Antonio College", "08086"), ("Riverside City College", "07000"),
            ("College of the Desert", "35793")}
courses = {
    "C1": [crow("Mt. San Antonio College", "ANAT 35", "Human Anatomy", 5.0, "BIOL 110 B")],
    "C2": [crow("Mt. San Antonio College")],
    "C4": [crow("Norco College", "MAT 12", "Statistics", 4.0)],
    "C5": [crow("Citrus College", "AUTO 10", "Introduction to Automotive Technology", 3.0)],
}
mem = [
    mrow("851", "08086", "C1"),
    mrow("851", "08086", "C1"),                       # a second proposal row
    mrow("851", "08086", "C2", cstat="Inactive"),     # a retired course
    mrow("851", "08099", "C1", pstat="Deleted"),      # a deleted program
    mrow("851", "08100", "C1"),                       # a program Sierra cannot find
    mrow("851", "08086", "C3", crs="KIN101", title="Fitness"),  # no course-list row
    mrow("961", "07000", "C4"),                       # a sister college's course
    mrow("931", "35793", "C5"),                       # course list misfiles it; MIS does not
    mrow("851", "NULL", "C1"),
]
rows, st = B.assemble(mem, xw, programs, courses, {"C5": "931", "C4": "963"})
keys = [(r["college"], r["program_control_number"], r["course_control_number"]) for r in rows]
check("one row per (college, program, course)", len(keys) == len(set(keys)) and st["skip_duplicate"] == 1)
check("an Inactive course is dropped and counted", st["skip_course_status"] == 1
      and ("Mt. San Antonio College", "08086", "C2") not in keys)
check("a Deleted program is dropped", st["skip_program_status"] == 1)
check("a program absent from the catalog is counted, not loaded", st["skip_program_not_in_catalog"] == 1)
check("the NULL program control is dropped", st["skip_no_program_control"] == 1)
by = {(r["program_control_number"], r["course_control_number"]): r for r in rows}
r1 = by[("08086", "C1")]
check("display fields come from the course list", r1["course_code"] == "ANAT 35"
      and r1["units"] == 5.0 and r1["cid"] == "BIOL 110 B" and r1["course_college"] is None)
r3 = by[("08086", "C3")]
check("a course missing from the course list falls back to the membership's own code and title",
      r3["course_code"] == "KIN101" and r3["course_title"] == "Fitness" and r3["units"] is None)
check("MIS overrules the course list on which college owns a course",
      by[("35793", "C5")]["course_college"] is None and st["course_list_college_overruled_by_mis"] == 1)
check("a sister college's course names that college",
      by[("07000", "C4")]["course_college"] is not None)
check("every row has the table's keys",
      all(set(r) | {"load_id"} == S.KEYS for r in rows))

print("3. the loader re-sends a batch safely and refuses a malformed one")
calls = []


def flaky(fails):
    seq = list(fails)

    def post(path, body, key, prefer=None):
        calls.append(len(body))
        if seq:
            code, detail = seq.pop(0)
            raise S._HttpError(path, code, detail)
    return post


rows = S.with_load_id([dict(r) for r in rows], "L1")
S.CHUNK, S.MIN_CHUNK = 4, 2
calls.clear()
sent = S.upsert_all(rows, "k", post=flaky([(502, "bad gateway")]), sleep=lambda s: None)
check("a 5xx batch is re-sent at the same size and every row lands once",
      sent == len(rows) and calls[0] == calls[1] == 4, str(calls))
calls.clear()
sent = S.upsert_all(rows, "k", post=flaky([(500, '{"code":"57014"}')]), sleep=lambda s: None)
check("a statement timeout halves the batch", sent == len(rows) and calls[:2] == [4, 2], str(calls))
calls.clear()
try:
    S.upsert_all(rows, "k", post=flaky([(400, "PGRST102")]), sleep=lambda s: None)
    check("a 4xx stops the load", False, "no SystemExit")
except SystemExit:
    check("a 4xx stops the load", True)
calls.clear()
try:
    S.upsert_all(rows, "k", post=flaky([(503, "x")] * 4), sleep=lambda s: None)
    check("retries are bounded", False, "no SystemExit")
except SystemExit:
    check("retries are bounded", len(calls) == S.RETRIES + 1, str(calls))
try:
    S.with_load_id([{"college": "x"}], "L1")
    check("a row with the wrong keys stops the load before any write", False)
except SystemExit:
    check("a row with the wrong keys stops the load before any write", True)

print("4. the prune deletes only after an exact count of this load")
seen = []


def fake(count_total, deleted=7):
    def request(method, path, body, key, prefer=None):
        seen.append((method, path))
        if method == "GET":
            return None, f"0-0/{count_total}"
        return None, f"*/{deleted}"
    return request


seen.clear()
check("an exact count deletes the earlier loads' rows",
      S.prune("20260716-1", 10, "k", request=fake(10)) == 7
      and seen[1] == ("DELETE", "coci_program_courses?load_id=neq.20260716-1"), str(seen))
seen.clear()
try:
    S.prune("20260716-1", 10, "k", request=fake(9))
    check("a short count deletes nothing", False, "no SystemExit")
except SystemExit:
    check("a short count deletes nothing", [m for m, _ in seen] == ["GET"], str(seen))
def settling(fail_first, total=10, deleted=0):
    """The first `fail_first` calls die on the statement timeout, as the first
    load's count did beside autovacuum."""
    state = {"n": 0}

    def request(method, path, body, key, prefer=None):
        state["n"] += 1
        seen.append(method)
        if state["n"] <= fail_first:
            raise S._HttpError(path, 500, '{"code":"57014"}')
        return None, (f"0-0/{total}" if method == "GET" else f"*/{deleted}")
    return request


seen.clear()
check("a count that times out beside autovacuum is retried, then the prune runs",
      S.prune("L", 10, "k", request=settling(2), sleep=lambda s: None) == 0
      and seen == ["GET", "GET", "GET", "DELETE"], str(seen))
seen.clear()
try:
    S.prune("L", 10, "k", request=settling(S.PRUNE_TRIES), sleep=lambda s: None)
    check("the prune's retries are bounded and delete nothing", False, "no error")
except S._HttpError:
    check("the prune's retries are bounded and delete nothing",
          seen == ["GET"] * S.PRUNE_TRIES, str(seen))


def refusing(method, path, body, key, prefer=None):
    seen.append(method)
    raise S._HttpError(path, 401, "JWT expired")


seen.clear()
try:
    S.prune("L", 10, "k", request=refusing, sleep=lambda s: None)
    check("a 4xx on the prune is not retried", False, "no error")
except S._HttpError:
    check("a 4xx on the prune is not retried", seen == ["GET"], str(seen))
try:
    S.range_total("0-0/*")
    check("a missing exact count stops the prune", False)
except SystemExit:
    check("a missing exact count stops the prune", True)

print("5. an unchanged payload writes nothing; a failed read never skips a load")
base = [{"college": "A", "program_control_number": "1", "course_control_number": "C1", "course_code": "X 1",
         "course_title": "T", "units": 3.0, "cid": None, "course_college": None},
        {"college": "A", "program_control_number": "1", "course_control_number": "C2", "course_code": "X 2",
         "course_title": "U", "units": 4.0, "cid": None, "course_college": None}]
lid = S.content_load_id("2026-07-16", base)
check("the load id is the content: same rows, same id, in any order",
      lid == S.content_load_id("2026-07-16", list(reversed(base))) and lid.startswith("20260716-"), lid)
changed = [dict(base[0], course_title="T2"), base[1]]
check("a changed row changes the id", S.content_load_id("2026-07-16", changed) != lid)
check("the id is filter-safe (letters, digits, a dash)", all(ch.isalnum() or ch == "-" for ch in lid), lid)


def live_store(count, others, fail=False):
    def request(method, path, body, key, prefer=None):
        if fail:
            raise S._HttpError(path, 500, '{"code":"57014"}')
        if "load_id=eq." in path:
            return None, f"0-0/{count}"
        return ([{"load_id": "old"}] if others else []), ""
    return request


check("this load already live and alone -> skip", S.already_live("L", 10, "k", request=live_store(10, False)) is True)
check("a short count -> load", S.already_live("L", 10, "k", request=live_store(9, False)) is False)
check("another load still present -> load", S.already_live("L", 10, "k", request=live_store(10, True)) is False)
check("a failed read -> load, never skip", S.already_live("L", 10, "k", request=live_store(10, False, fail=True)) is False)

print()
if FAILS:
    print(f"FAILED {len(FAILS)}: {FAILS}")
    sys.exit(1)
print("OK — program course membership guards pass.")
