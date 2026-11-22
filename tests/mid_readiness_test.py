#!/usr/bin/env python3
"""The re-mint readiness count (kb/_mid_readiness.py, S709, #3655) against the draft gate d-remint-ready-gate-draft-s707.

WHAT THIS GUARDS (each a way the count would call an M-ID ready that is not, or hold one for the wrong reason):
  (1) a person's college-keyed save settles a credit member; the subject map alone never does;
  (2) a statewide filing settles a credit member and never a noncredit one;
  (3) a noncredit save settles only its own category's course; Workforce Preparation (no common code) and a course
      with no category in the export are held by name, never as plain "no settled code";
  (4) a college with no subject_courses file is "college not read", and a read college missing the course is
      "course not found";
  (5) a compare that counts fewer rows than the reads holds every M-ID, however settled;
  (6) a strong or partial Split holds; a limited Split and Not enough text pass (a missing SLO counts against no one);
  (7) two settled codes read "splits along code" and pass;
  (8) the gzipped compare is found and preferred by its date over an older plain one;
  (9) on the committed data, every scope member gets exactly one status, and the counts add up.

Run from repo root: python3 tests/mid_readiness_test.py
"""
import gzip
import importlib.util
import json
import os
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "kb"))

import subject_decisions as sd  # noqa: E402

spec = importlib.util.spec_from_file_location("mid_readiness", os.path.join(ROOT, "kb", "_mid_readiness.py"))
R = importlib.util.module_from_spec(spec)
spec.loader.exec_module(R)

FAILS = []


def check(name, cond, why=""):
    print(("PASS " if cond else "FAIL ") + name + ("" if cond or not why else "  [%s]" % why))
    if not cond:
        FAILS.append(name)


canon = json.load(open(os.path.join(ROOT, sd.CANONICAL), encoding="utf-8"))
NC = sd.nc_codes_table()
SLUGS = sd.read_slugs(ROOT)
doc = {"decisions": [
    {"key": "SUBJ:alpha|BIO|credit", "common_code": "BIOL", "local_title": None, "who": "t", "at": "x"},
    {"key": "SUBJ:alpha|AED|nc:short-term-vocational", "common_code": "VOCE", "local_title": None, "who": "t",
     "at": "x"},
], "statewide": [{"key": "_SUBJ_DISC::HIS", "code": "HIS", "discipline": "History", "who": "t", "at": "x"}]}
D = sd.Decisions(doc, canon, SLUGS, NC)
SLUG_OF = {sd.college_key("Alpha College"): "alpha", sd.college_key("Beta College"): "beta"}
COURSES = {"alpha": {("BIO", "1"): ("C", sd.NO_CATEGORY), ("ART", "1"): ("C", sd.NO_CATEGORY),
                     ("HIS", "1"): ("C", sd.NO_CATEGORY), ("HIS", "2"): ("N", "Courses for Older Adults"),
                     ("AED", "1"): ("N", "Short-term Vocational"), ("AED", "2"): ("N", "Courses for Older Adults"),
                     ("AED", "3"): ("N", "Workforce Preparation"), ("AED", "4"): ("N", sd.NO_CATEGORY)}}
MAP = {"ART": "ARTS", "BIO": "BIOL"}


def st(college, code):
    return R.member_status({"college": college, "code": code}, SLUG_OF, COURSES, D, MAP, NC)


# (1)
check("(1) a person's credit save settles the member", st("Alpha College", "BIO 1")[:2] == ("settled", "BIOL"))
s = st("Alpha College", "ART 1")
check("(1) the subject map alone settles nothing; its draft is shown", s[0] == "no settled code" and s[2].get("map") == "ARTS", s)
# (2)
check("(2) a statewide filing settles a credit member", st("Alpha College", "HIS 1")[:2] == ("settled", "HIST"))
check("(2) a statewide filing never settles a noncredit member", st("Alpha College", "HIS 2")[0] == "no settled code")
# (3)
check("(3) a noncredit save settles its own category", st("Alpha College", "AED 1")[:2] == ("settled", "VOCE"))
check("(3) ... and not another category", st("Alpha College", "AED 2")[0] == "no settled code")
check("(3) Workforce Preparation is held by name", st("Alpha College", "AED 3")[0] == "category has no common code")
check("(3) no category in the export is held by name", st("Alpha College", "AED 4")[0] == "no noncredit category")
# (4)
check("(4) a college with no courses file is not read", st("Gamma College", "AED 1")[0] == "college not read")
check("(4) a read college missing the course is course not found", st("Alpha College", "AED 99")[0] == "course not found")


# (5)-(7): build() on injected members, courses and compare.
def run_build(compare_doc, reads_rows, members):
    saved = (R.load_slugs, R.load_courses, R.load_map, R.newest_compare, R.sd.load, R.SCOPES)
    R.load_slugs, R.load_courses, R.load_map = (lambda root=ROOT: SLUG_OF), (lambda root=ROOT: COURSES), (lambda root=ROOT: MAP)
    R.newest_compare = lambda root=ROOT: ("fixture", compare_doc)
    R.sd.load = lambda root=ROOT: D
    R.SCOPES = {"t": {"college": "Alpha College", "code": "AED", "why": "fixture"}}
    try:
        return R.build(members=members, members_at="fixture", reads_rows=reads_rows)["scopes"]["t"]
    finally:
        R.load_slugs, R.load_courses, R.load_map, R.newest_compare, R.sd.load, R.SCOPES = saved


A = {"college": "Alpha College"}
members = {
    "VOCE M1": [dict(A, code="AED 1")],
    "VOCE M2": [dict(A, code="AED 1"), dict(A, code="BIO 1")],
    "VOCE M3": [dict(A, code="AED 1")],
    "VOCE M4": [dict(A, code="AED 1")],
    "VOCE M5": [dict(A, code="AED 1")],
    "OLAD M1": [dict(A, code="AED 2")],
}
cmp = {"inventory": {"rows": {"slo": 10, "objective": 5}},
       "mids": {"VOCE M3": {"cls": "Split", "level": "strong"}, "VOCE M4": {"cls": "Split", "level": "limited"},
                "VOCE M5": {"cls": "Not enough text", "level": None}}}
stale = run_build(cmp, 16, members)
check("(5) a compare short of the reads holds every M-ID", stale["ready"] == 0 and stale["held"] == 6, stale["ready"])
check("(5) ... and says why", all("not run on the current reads" in " ".join(v["reasons"]) for v in stale["by_mid"].values()))
cur = run_build(cmp, 15, members)
b = cur["by_mid"]
check("(6) a strong split holds", b["VOCE M3"]["ready"] is False and "strong" in " ".join(b["VOCE M3"]["reasons"]))
check("(6) a limited split passes", b["VOCE M4"]["ready"] is True)
check("(6) Not enough text passes", b["VOCE M5"]["ready"] is True)
check("(6) an M-ID the compare does not name passes test 3", b["VOCE M1"]["ready"] is True)
check("(7) two settled codes split along code and pass",
      b["VOCE M2"]["shape"] == "splits along code" and b["VOCE M2"]["ready"] is True, b["VOCE M2"])
check("(1) an unsettled member holds its M-ID", b["OLAD M1"]["ready"] is False and b["OLAD M1"]["held_members"] == {"no settled code": 1})
check("(9) fixture counts add up", cur["ready"] + cur["held"] == cur["mids"] == 6 and cur["ready"] == 4, (cur["ready"], cur["held"]))

# (8) the gzipped compare is read, newest by date
with tempfile.TemporaryDirectory() as t:
    os.makedirs(os.path.join(t, "kb", "status"))
    with open(os.path.join(t, "kb", "status", "mid_outcomes_compare_2026-11-12.json"), "w") as f:
        json.dump({"date": "old"}, f)
    with gzip.open(os.path.join(t, "kb", "status", "mid_outcomes_compare_2026-11-22.json.gz"), "wt") as f:
        json.dump({"date": "new"}, f)
    path, got = R.newest_compare(t)
    check("(8) the newer gzipped compare wins over an older plain one", got == {"date": "new"} and path.endswith(".gz"), path)

# (9) the committed data
committed = os.path.join(ROOT, R.OUT)
if os.path.exists(committed):
    d = json.load(open(committed, encoding="utf-8"))
    for name, sc in d["scopes"].items():
        mids = sc["by_mid"].values()
        check("(9) %s: ready plus held is the scope" % name, sc["ready"] + sc["held"] == sc["mids"] == len(sc["by_mid"]))
        check("(9) %s: each member has one status" % name,
              all(v["settled"] + sum(v["held_members"].values()) == v["members"] for v in mids))
        check("(9) %s: a ready M-ID has every member settled" % name,
              all(v["settled"] == v["members"] for v in mids if v["ready"]))
else:
    check("(9) the committed file exists", False, R.OUT)

print("\n%d failed" % len(FAILS) if FAILS else "\nall passed")
sys.exit(1 if FAILS else 0)
