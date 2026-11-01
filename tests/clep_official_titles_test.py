#!/usr/bin/env python3
"""College Board's CLEP exams and the reader that folds a college's CLEP title under one
(kb/_clep_official_titles.py; Sam's ruling on Open Asks Sheet 150 card 2, 2026-11-01: one credential
per exam, its levels folded in as score bands, Arabic numerals, no period subtitle).

Guards: the decoration colleges add never changes the exam (score bands, ACE and required scores,
unit notes, HISTORICAL Type, term notes, "Complete both", footnote marks, a local course code); a
world language exam's levels fold into the exam, Roman, Arabic, "ll" and Level III alike; the
numbered exams take Arabic numerals and drop the period subtitle, and the subtitle alone names the
number; a renamed exam takes College Board's current name; a retired exam keeps its own; a title
naming two exams is held; a title that only mentions CLEP later is not read; the staged lane names
College Board and runs beside the AP and IB lanes; every name it returns is official; the quality
gate lets an official name stand; and the reference holds no level-split CLEP credential and no
Roman numeral in a CLEP name.

Run from the repo root: python3 tests/clep_official_titles_test.py
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _clep_official_titles as L  # noqa: E402
import _preseed_unclassified as P  # noqa: E402
import _cer_procedures as C  # noqa: E402

results = []


def check(name, cond):
    results.append((name, bool(cond)))


def t(raw):
    return (L.resolve(raw) or {}).get("title")


CASES = [
    # the world language exams: one exam, its levels score bands
    ("CLEP French Level I", "CLEP French Language"),
    ("CLEP Exam French Language, Level II (Score of 59 or higher)", "CLEP French Language"),
    ("CLEP French Level III", "CLEP French Language"),
    ("CLEP French Language: 2", "CLEP French Language"),
    ("CLEP French [1] Level II", "CLEP French Language"),
    ("CLEP French** Level II", "CLEP French Language"),
    ("CLEP French (max of 10 units awarded) Level II", "CLEP French Language"),
    ("CLEP French Language (Levels 1 and 2) - Complete both", "CLEP French Language"),
    ("CLEP German1 Level II", "CLEP German Language"),
    ("CLEP German II", "CLEP German Language"),
    ("CLEP  German Level I (SAC Associate Degree Units)", "CLEP German Language"),
    ("CLEP Spanish Level II (after FA15)", "CLEP Spanish Language"),
    ("CLEP Spanish Level II (required Score of 63)", "CLEP Spanish Language"),
    ("CLEP Spanish Language: Levels 1 and 2", "CLEP Spanish Language"),
    ("CLEP Spanish with Writing: Levels 1 and 2", "CLEP Spanish with Writing"),
    ("CLEP Spanish with Writing ll", "CLEP Spanish with Writing"),
    ("CLEP Spanish and Writing Level II", "CLEP Spanish with Writing"),
    ("CLEP Spanish** with Writing II", "CLEP Spanish with Writing"),
    ("CLEP Exam Spanish with Writing I (Score of 50 or higher)", "CLEP Spanish with Writing"),
    # the numbered exams: Arabic numerals, no period subtitle
    ("CLEP History of the United States I: Early Colonization to 1877", "CLEP History of the United States 1"),
    ("CLEP History of the United States II: 1865 to the Present", "CLEP History of the United States 2"),
    ("CLEP US History I", "CLEP History of the United States 1"),
    ("CLEP United States II", "CLEP History of the United States 2"),
    ("CLEP History I", "CLEP History of the United States 1"),
    ("CLEP History of the United States: Early Colonization to 1877", "CLEP History of the United States 1"),
    ("CLEP Western Civilization I: Ancient Near East to 1648", "CLEP Western Civilization 1"),
    ("CLEP Western Civilization II: 1648 to the Present", "CLEP Western Civilization 2"),
    ("CLEP Western Civ 2 (Score of 50)", "CLEP Western Civilization 2"),
    # the rest, with what colleges add
    ("CLEP American Government - Score of 50 or higher - HISTORICAL Type 1", "CLEP American Government"),
    ("CLEP Exam College English Literature (Score of 50 or higher)", "CLEP English Literature"),
    ("CLEP Analyzing & Interpreting Literature", "CLEP Analyzing and Interpreting Literature"),
    ("CLEP Exam: College Compositions", "CLEP College Composition"),
    ("CLEP College Composition Modular", "CLEP College Composition Modular"),
    ("CLEP College Mathematics - MATH 52", "CLEP College Mathematics"),
    ("CLEP College Algebra (ACE Recommended Score of 50)", "CLEP College Algebra"),
    ("CLEP College Algebra - Trigonometry (Score of 50 or higher)", "CLEP College Algebra-Trigonometry"),
    ("CLEP College Algebra/Trig", "CLEP College Algebra-Trigonometry"),
    ("CLEP Trigonometry (prior to Fall 2006)", "CLEP Trigonometry"),
    ("CLEP Pre-Calculus (Score of 50)", "CLEP Precalculus"),
    ("CLEP Calculus", "CLEP Calculus"),
    ("CLEP Information Systems and Computer Apps (Score of 50 or higher)", "CLEP Information Systems"),
    ("CLEP Information Systems", "CLEP Information Systems"),
    ("CLEP Principles of Accounting (SAC Associate Degree Units)", "CLEP Financial Accounting"),
    ("CLEP Princ. of Macroecon", "CLEP Principles of Macroeconomics"),
    ("CLEP Principles Marketing", "CLEP Principles of Marketing"),
    ("CLEP Introduction to Educational Psychology", "CLEP Introduction to Educational Psychology"),
    ("CLEP Introductory Psychology", "CLEP Introductory Psychology"),
    ("CLEP Intro to Sociology", "CLEP Introductory Sociology"),
    ("College-Level Examination Program (CLEP) Biology", "CLEP Biology"),
]
for raw, want in CASES:
    check("%r reads as %s" % (raw, want), t(raw) == want)

for raw, why in [("CLEP History of the United States I and II", "History of the United States 1"),
                 ("CLEP Western Civilization I or II", "Western Civilization 1"),
                 ("CLEP Macroeconomics and Microeconomics", "Principles of Macroeconomics")]:
    r = L.resolve(raw) or {}
    check("%r is held as two exams" % raw, "two" in r and why in r["two"])

for raw in ["AP Spanish Language and Culture", "Spanish 1 (CLEP accepted)", "Clepsydra Studies",
            "CLEP General Examination"]:
    check("%r is not read as a CLEP exam" % raw, not t(raw))

check("every name the reader returns is official", all(t(raw) in L.OFFICIAL for raw, _w in CASES))
check("no official name carries a Roman numeral or a level",
      not any(re.search(r"\b(?:I{1,3}|Level)\b", n) for n in L.OFFICIAL))
check("the official list keeps the retired exams",
      {"CLEP College Algebra-Trigonometry", "CLEP Trigonometry"} <= L.OFFICIAL)
check("the official list has College Board's 34 current exams", len(L.CURRENT) == 34 == len(set(L.CURRENT)))
rec = P.stage_clep("CLEP Spanish Level II (Score of 63 or higher)")
check("the staged lane names College Board and the clep lane",
      rec and rec["issuer"] == "College Board" and rec["via"] == "clep" and rec["title"] == "CLEP Spanish Language")
check("the staged lane passes a two-exam title on", P.stage_clep("CLEP History of the United States I and II") is None)
staged, _res = P.build_stage_plan(["CLEP German Level II", "IB Exam Spanish B HL (Score 4-7)",
                                   "AP World History, Area 4"], {}, set())
check("the clep lane runs in the staged plan beside the ap and ib lanes",
      staged.get("CLEP German Level II", {}).get("via") == "clep"
      and staged.get("IB Exam Spanish B HL (Score 4-7)", {}).get("via") == "ib"
      and staged.get("AP World History, Area 4", {}).get("via") == "ap")
check("the quality gate lets an official CLEP name stand",
      C.residue("CLEP Western Civilization 1", L.ISSUER, "clep") == [])
procs = json.load(open(os.path.join(ROOT, "kb", "cer_procedures.json")))["procedures"]
check("brand-family names the clep lane", "clep" in next(p for p in procs if p["id"] == "brand-family")["lanes"])

ut = json.load(open(os.path.join(ROOT, "kb", "unified_titles.json")))
ut = ut.get("titles") or ut
clep_names = {e.get("unified_title") for raw, e in ut.items()
              if isinstance(e, dict) and L._clean(raw) is not None}
check("the reference holds no level-split CLEP credential (the fold applied)",
      not any(re.search(r"\bLevels?\b", n or "") for n in clep_names))
check("every CLEP local title in the reference sits under the name the reader gives it",
      all((L.resolve(raw) or {}).get("title") in (None, e.get("unified_title"))
          for raw, e in ut.items() if isinstance(e, dict) and L._clean(raw) is not None))

failed = [n for n, ok in results if not ok]
for n, ok in results:
    print(("PASS " if ok else "FAIL ") + n)
print("%d/%d checks passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
