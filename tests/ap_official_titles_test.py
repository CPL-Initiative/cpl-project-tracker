#!/usr/bin/env python3
"""College Board's official AP names and the reader that folds a college's AP title under one
(kb/_ap_official_titles.py; Sam, 2026-10-31, from the Exhibits tab).

Guards: the decoration colleges add never changes the exam (score bands, HISTORICAL Type notes,
Area numbers, local course codes, high school codes, "exam", "test"); the letters read as written
and joined, and missing letters take the usual exam; an AB subscore reads as Calculus AB; a retired
exam keeps its own name; a title naming two exams is held; a title that only starts with the words
Advanced Placement, or names no College Board exam, is not read; the staged lane gives College
Board as the issuer; every name it returns is on the official list.

Run from the repo root: python3 tests/ap_official_titles_test.py
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _ap_official_titles as A  # noqa: E402
import _preseed_unclassified as P  # noqa: E402

results = []


def check(name, cond):
    results.append((name, bool(cond)))


def t(raw):
    return (A.resolve(raw) or {}).get("title")


CASES = [
    ("AP Computer Science A - Score of 3 or higher - HISTORICAL Type 1", "AP Computer Science A"),
    ('AP CS "A" test', "AP Computer Science A"),
    ("AP Computer Science A - CIST 004A1", "AP Computer Science A"),
    ("AP Computer Science A HS-LEUSD", "AP Computer Science A"),
    ("AP Computer Science", "AP Computer Science A"),
    ("AP Computer Science AB (Score of 3, 4 or 5)", "AP Computer Science AB"),
    ("AP Computer Science A/B", "AP Computer Science AB"),
    ("AP Computer Science Principles (AB) -CIST 004B", "AP Computer Science Principles"),
    ("AP AP Computer Science Principles (Score of 4 or 5)", "AP Computer Science Principles"),
    ("AP Calculus", "AP Calculus AB"),
    ("AP Calculus A/B", "AP Calculus AB"),
    ("AP Calculus A+B (Score of 3)", "AP Calculus AB"),
    ("AP Mathematics - Calculus BC Exam", "AP Calculus BC"),
    ("AP Calculus BC/AB Subscore (Score 3-5)", "AP Calculus AB"),
    ("AP Exam: Calculus AB or AB Subscore1", "AP Calculus AB"),
    ("AP Calculus: PreCalculus", "AP Precalculus"),
    ("AP Physics 1", "AP Physics 1: Algebra-Based"),
    ("AP Physics C (Electricity and Magnetism) (Score of 4 or 5)", "AP Physics C: Electricity and Magnetism"),
    ("AP Physics: Mechanics", "AP Physics C: Mechanics"),
    ("AP - Physics B", "AP Physics B"),
    ("AP U.S. History", "AP United States History"),
    ("AP U.S. Government and Politics - Score of 3 or higher - HISTORICAL Type 1", "AP United States Government and Politics"),
    ("AP Government and Politics - Comparative", "AP Comparative Government and Politics"),
    ("AP History – World History (Area A-3)", "AP World History: Modern"),
    ("AP History: World-Modern", "AP World History: Modern"),
    ("AP: History European ", "AP European History"),
    ("AP Studio Art - 3D", "AP 3-D Art and Design"),
    ("AP Art: Studio 2D Design", "AP 2-D Art and Design"),
    ("AP Art-Studio Drawing (Score 3-5)", "AP Drawing"),
    ("AP Art History HS-LEUSD", "AP Art History"),
    ("AP Environ-mental Science", "AP Environmental Science"),
    ("AP PSYC", "AP Psychology"),
    ("AP SPAN (score of 4-5) Language and Culture", "AP Spanish Language and Culture"),
    ("AP Spanish Literature", "AP Spanish Literature and Culture"),
    ("AP Latin: Virgil - Score of 3 or higher - HISTORICAL Type 1", "AP Latin"),
    ("AP Latin Literature or Latin: Vergel", "AP Latin"),
    ("AP French Literature", "AP French Literature"),
    ("Advanced Placement Biology", "AP Biology"),
    ("College Board AP Chemistry Exam", "AP Chemistry"),
    ("AP Exam: Environmental Science", "AP Environmental Science"),
]
for raw, want in CASES:
    check("%r reads as %s" % (raw, want), t(raw) == want)

for raw in ["AP English Literature & Language Comp. - Score of 5", "AP Physics 1 & 2", "AP Exam: Calc AB/BC",
            "AP Economics", "AP Physics C", "AP Studio Art", "AP Physics"]:
    r = A.resolve(raw) or {}
    check("%r names two exams and is held" % raw, "two" in r and "title" not in r)

for raw in ["Advanced Placement in Nursing - Credit by Exam (NURS 149)", "AP Russian Language & Culture",
            "Apprenticeship Carpentry", "Applied Psychology", "CLEP Biology"]:
    check("%r is not read as an official AP exam" % raw, not (A.resolve(raw) or {}).get("title"))

check("every name the reader returns is official", all(t in A.OFFICIAL for t, _p, _w in A.RULES if t))
check("the official list keeps the retired exams", {"AP Computer Science AB", "AP Physics B"} <= A.OFFICIAL)
rec = P.stage_ap("AP Computer Science A - Score of 3 or higher - HISTORICAL Type 1")
check("the staged lane names College Board and the ap lane", rec and rec["issuer"] == "College Board" and rec["via"] == "ap"
      and rec["title"] == "AP Computer Science A")
check("the staged lane passes a two-exam title on", P.stage_ap("AP Physics 1 & 2") is None)
staged, _res = P.build_stage_plan(["AP World History, Area 4", "NCCER Core"], {}, set())
check("the ap lane runs first in the staged plan", staged.get("AP World History, Area 4", {}).get("via") == "ap")

failed = [n for n, ok in results if not ok]
for n, ok in results:
    print(("PASS " if ok else "FAIL ") + n)
print("%d/%d checks passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
