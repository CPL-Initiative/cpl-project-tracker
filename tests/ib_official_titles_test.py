#!/usr/bin/env python3
"""IB's Diploma Programme subjects and the reader that folds a college's IB title under one
(kb/_ib_official_titles.py; the AP rule's pattern applied to IB, SkyInkberry, 2026-11-01).

Guards: the decoration colleges add never changes the subject (score bands, Area and Cal-GETC
notes, HISTORICAL Type notes, unit notes, "any region", "prior to"); the level reads as written and
a missing level takes HL, where an SL-only subject takes SL; the exam's language folds into the
subject and a Language A exam in another language carries (Non-English); a Language A title reads
by its words before its letters, as Sam's own review read "Lang&Lit (A2)"; a retired subject keeps
its own name; a title naming two exams is held; IBEW and other words that start with IB are not
read; the staged lane names the IB issuer and runs beside the AP lane; every name it returns is on
the official list; the quality gate lets an official name stand.

Run from the repo root: python3 tests/ib_official_titles_test.py
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _ib_official_titles as I  # noqa: E402
import _preseed_unclassified as P  # noqa: E402
import _cer_procedures as C  # noqa: E402

results = []


def check(name, cond):
    results.append((name, bool(cond)))


def t(raw):
    return (I.resolve(raw) or {}).get("title")


CASES = [
    ("IB : History HL Area 3", "IB History HL"),
    ("IB History (any region) HL (Score of 5-7) (Area 4)", "IB History HL"),
    ("IB History (any region) HL (score 5-7): Cal-GETC Area 3B or 4", "IB History HL"),
    ("IB History - any region HL - Score of 5 or higher - HISTORICAL Type 2", "IB History HL"),
    ("IB History HL, any region (Area 3)", "IB History HL"),
    ("IB History of the Americas HL", "IB History HL"),
    ("IB Exam Biology HL", "IB Biology HL"),
    ("IB Biology SL", "IB Biology SL"),
    ("International Baccalaureate Chemistry Higher Level", "IB Chemistry HL"),
    ("I.B. Physics HL", "IB Physics HL"),
    ("IB Global Politics", "IB Global Politics HL"),
    ("IB World Religions HL", "IB World Religions SL"),
    ("IB Theater HL", "IB Theatre HL"),
    ("IB Social and Cultural Anthropology HL", "IB Social and Cultural Anthropology HL"),
    ("IB Language A: Literature (any language) HL (score 5-7): Cal-GETC Area 3B", "IB Language A: Literature HL"),
    ("IB Language A Literature HL (Score of 4-7)", "IB Language A: Literature HL"),
    ("IB Language A: Literature (any language, except English) HL (score 5-7): Cal-GETC Area 3B",
     "IB Language A: Literature HL (Non-English)"),
    ("IB Language A Literature HL - any language except English", "IB Language A: Literature HL (Non-English)"),
    ("IB Language A Language & Literature HL (Score of 4-7)", "IB Language A: Language and Literature HL"),
    ("IB Language A: Language and Literature (any language except English) HL",
     "IB Language A: Language and Literature HL (Non-English)"),
    ("IB English Lang&Lit (A2) HL (Minimum Passing Score of 4)", "IB Language A: Language and Literature HL"),
    ("IB English Lit (A1) HL (Minimum Passing Score of 4)", "IB Language A: Literature HL"),
    ("IB Exam English A1 HL (Score 4-7)", "IB Language A1 HL"),
    ("IB Exam Language A1 (English) HL", "IB Language A1 HL"),
    ("IB Language A1 (any language) HL (prior to Fall ’13)", "IB Language A1 HL"),
    ("IB Exam Spanish A1 HL (Score 4-7)", "IB Language A1 HL (Non-English)"),
    ("IB Exam Language A1 (any other language) HL", "IB Language A1 HL (Non-English)"),
    ("IB Language A - any language except English HL", "IB Language A1 HL (Non-English)"),
    ("IB Exam Hindi A2 HL (Score 4-7)", "IB Language A2 HL (Non-English)"),
    ("IB Exam English A2 HL (Score 4-7)", "IB Language A2 HL"),
    ("IB Exam Spanish B HL (Score 4-7)", "IB Language B HL"),
    ("IB English B HL (Minimum Passing Score of 4)", "IB Language B HL"),
    ("IB Language B (any language) HL (CSU Semester Transfer Units)", "IB Language B HL"),
    ("IB Language B - any language except English HL", "IB Language B HL"),
    ("IB Spanish ab initio", "IB Language ab initio SL"),
    ("IB Mathematics HL (prior to F ‘22)", "IB Mathematics HL"),
    ("IB Math Higher Level - Score of 4 or higher - HISTORICAL Type 1", "IB Mathematics HL"),
    ("IB Mathematics HL - Analysis and Approaches", "IB Mathematics: Analysis and Approaches HL"),
    ("IB Math Analysis & Approaches HL (Minimum Passing Score of 4)", "IB Mathematics: Analysis and Approaches HL"),
    ("IB Mathematics: Applications & Interpretations HL (Score of 4-7)",
     "IB Mathematics: Applications and Interpretation HL"),
    ("IB Mathematics: Applications and Interpretation HL (score 5-7): Cal-GETC Area 2 (may not be at all UC)",
     "IB Mathematics: Applications and Interpretation HL"),
    ("IB Further Mathematics HL", "IB Further Mathematics HL"),
    ("IB Mathematical Studies", "IB Mathematical Studies SL"),
    ("IB Business and Management HL", "IB Business Management HL"),
    ("IB ITGS HL", "IB Information Technology in a Global Society HL"),
    ("IB Visual Arts HL", "IB Visual Arts HL"),
]
for raw, want in CASES:
    check("%r reads as %s" % (raw, want), t(raw) == want)

for raw in ["IB Language A1 or A2 HL", "IB Mathematics: Analysis and Approaches or Applications and Interpretation HL",
            "IB Biology HL/SL"]:
    r = I.resolve(raw) or {}
    check("%r names two exams and is held" % raw, "two" in r and "title" not in r)

for raw in ["IBEW- Power Lineman Apprenticeship Year 1", "IBM Certified Data Scientist", "Ibuprofen Safety",
            "AP Biology", "IB Diploma"]:
    check("%r is not read as an IB subject" % raw, not (I.resolve(raw) or {}).get("title"))

check("every name the reader returns is official", all(
    t(raw) in I.OFFICIAL for raw, _w in CASES))
check("the official list keeps the retired subjects",
      {"IB Language A1 HL", "IB Language A2 HL (Non-English)", "IB Mathematics HL"} <= I.OFFICIAL)
check("no SL-only subject has an HL name", "IB World Religions HL" not in I.OFFICIAL)
rec = P.stage_ib("IB History (any region) HL (Score of 5-7) (Area 4)")
check("the staged lane names the IB issuer and the ib lane",
      rec and rec["issuer"] == "International Baccalaureate Organization (IBO)" and rec["via"] == "ib"
      and rec["title"] == "IB History HL")
check("the staged lane passes a two-exam title on", P.stage_ib("IB Language A1 or A2 HL") is None)
staged, _res = P.build_stage_plan(["IB Exam Spanish B HL (Score 4-7)", "AP World History, Area 4"], {}, set())
check("the ib lane runs in the staged plan beside the ap lane",
      staged.get("IB Exam Spanish B HL (Score 4-7)", {}).get("via") == "ib"
      and staged.get("AP World History, Area 4", {}).get("via") == "ap")
check("the quality gate lets an official IB name stand",
      C.residue("IB Language A1 HL (Non-English)", I.ISSUER, "ib") == [])
import json  # noqa: E402
procs = json.load(open(os.path.join(ROOT, "kb", "cer_procedures.json")))["procedures"]
check("brand-family names the ib lane", "ib" in next(p for p in procs if p["id"] == "brand-family")["lanes"])

failed = [n for n, ok in results if not ok]
for n, ok in results:
    print(("PASS " if ok else "FAIL ") + n)
print("%d/%d checks passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
