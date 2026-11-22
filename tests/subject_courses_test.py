#!/usr/bin/env python3
"""kb/_build_subject_courses.py: a college's courses under each local subject code (S700, #3655 item 3; Sam,
2026-11-21: credit and noncredit apart).

Failure modes: a course counted twice because the catalog and the state list write its number differently; a
catalog-only course given a band nobody recorded; the enhanced-funding noncredit letter read as a third band; a
title taken from the state list where the catalog prints one; a subject matched loosely; a rerun that writes other bytes;
a committed file the build would rewrite.

Run from repo root: python3 tests/subject_courses_test.py
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _build_subject_courses as B  # noqa: E402

results = []


def check(name, cond):
    results.append(bool(cond))
    print(("  ok  " if cond else "FAIL  ") + name)


STATE = [[0, "C1", "math ", "022A", "ALGEBRA LAB", 1, "C", "", "MATH 151", "", "MATH M1001"],
         [0, "C2", "MATH", "300", "Math Lab", 0, "N", "", "", "", ""],
         [0, "C3", "MATH", "301", "Math Lab II", 0, "E", "", "", "", ""],
         [0, "C4", "MATHS", "1", "Other Subject", 3, "C", "", "", "", ""]]
CAT = [{"subject": "MATH", "code": "MATH 22A", "title": "Algebra Lab", "units": "1"},
       {"subject": "MATH", "code": "MATH 9", "title": "Topics", "units": "2"},
       {"subject": "ES/A", "code": "ES/A 101", "title": "Yoga", "units": "1"}]
d = B.build_college("Alpha College", "alpha", CAT, STATE)
M = {r[0]: dict(zip(d["columns"], r)) for r in d["codes"]["MATH"]}
check("a course is one row where the catalog and the state list write its number apart (22A and 022A)", len(d["codes"]["MATH"]) == 4 and M["022A"]["listed"] == "Both")
check("the title is the catalog's where the catalog lists the course", M["022A"]["title"] == "Algebra Lab" and M["300"]["title"] == "Math Lab")
check("the state list's N and E are both noncredit", M["300"]["band"] == "N" and M["301"]["band"] == "N" and M["022A"]["band"] == "C")
check("a catalog-only course has no band: none is guessed", M["9"]["band"] == "" and M["9"]["listed"] == "Catalog")
check("C-ID, CCN and M-ID are the state list's", M["022A"]["cid"] == "MATH 151" and M["022A"]["mid"] == "MATH M1001")
check("a subject is matched exactly after trimming and upper-casing, nothing looser", "MATHS" in d["codes"] and len(d["codes"]["MATHS"]) == 1)
check("a code that holds a slash keeps its number", d["codes"]["ES/A"][0][0] == "101")
check("rows run in number order", [r[0] for r in d["codes"]["MATH"]] == ["9", "022A", "300", "301"])
check("two builds write the same bytes", B.dump(d) == B.dump(B.build_college("Alpha College", "alpha", list(CAT), list(STATE))))
docs = B.build(ROOT)
stale = [s for s, doc in docs.items() if not os.path.exists(os.path.join(ROOT, B.OUT_DIR, s + ".json"))
         or open(os.path.join(ROOT, B.OUT_DIR, s + ".json"), encoding="utf-8").read() != B.dump(doc)]
check("every committed file is the one the build would write (%d colleges)" % len(docs), len(docs) >= 16 and not stale)
check("no file is filed for a college the build does not name", sorted(f[:-5] for f in os.listdir(os.path.join(ROOT, B.OUT_DIR))) == sorted(docs))

print("%d/%d checks passed" % (sum(results), len(results)))
sys.exit(0 if all(results) else 1)
