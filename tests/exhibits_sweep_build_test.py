#!/usr/bin/env python3
"""Guards kb/_sweep_exhibit_titles.py, the Exhibits tab's Another look (Sam, 2026-10-31).

His five asks, each on a fixture: the ASE paren (a course named by its test code, an official name, a
code that names another course), Roman numerals (an official name keeps them), the language level
(Beginning and High-Beginning are Elementary 1 and 2; 1B is level 2; Intermediate leads), a course
number left in (only the college's own course, never OSHA 10), and the fold (twins, one title over two
courses at one college, a family's level word). Plus a sixth check his own saves surfaced: a local
title whose level (1A) differs from its canonical's (1B). And the guards: an industry credential and
an exam keep their names, a title waiting in Review is left there, a proposal a person kept never comes
back, and a rerun with nothing new keeps its time stamp.

Runs on a temporary repo; no network. Run from repo root:
    python3 tests/exhibits_sweep_build_test.py
"""
import json
import os
import shutil
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _sweep_exhibit_titles as sw  # noqa: E402

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


CCC = "California Community Colleges"
LPC = "Las Positas College"
SAM = {"reviewed_by": "slee@cccco.edu", "reviewed_at": "2026-10-31T16:00:00+00:00"}
JULY = {"reviewed_by": "map@rccd.edu", "reviewed_at": "2026-07-08T10:00:00+00:00"}

TITLES = {
    # raw: (canonical, who)
    "Noncredit for AUTO A1": ("Engine Repair", SAM),
    "Noncredit for AUTO A8": ("Automotive Technology (ASE A8 Engine Performance Certification)", SAM),
    "Noncredit for AUTO P1": ("Automotive Technology (ASE P1 Medium-Heavy Truck Parts Specialist certification)", SAM),
    "Automotive Service Excellence (ASE) A1 Certificate": ("ASE A1 — Engine Repair", JULY),
    "Brakes - Credit by Exam (ATEC 14 )": ("Brakes - Credit by Exam (ATEC 14)", JULY),
    "OSHA 10 Card": ("OSHA 10 Card", JULY),
    "Class Piano II": ("Class Piano II", JULY),
    "SFT Firefighter II": ("Firefighter II", JULY),
    "CHIN 1: Beginning Chinese": ("Chinese 1", JULY),
    "Credit by Exam SPAN 1B Elementary Spanish": ("Elementary Spanish 1", JULY),
    "SPAN 1 at another": ("Elementary Spanish 1", JULY),
    "SPAN 003: Intermediate Spanish I": ("Spanish I Intermediate", JULY),
    "Spanish Wines": ("Spanish Wines", JULY),
    "Haz Mat Technician 1A: Basic Chemistry": ("Haz Mat Technician 1B: Applied Chemistry", SAM),
    "Haz Mat Technician 1B: Applied Chemistry": ("Haz Mat Technician 1B: Applied Chemistry", SAM),
    "PC Operating System": ("PC Operating System", JULY),
    "PC Operating Systems": ("PC Operating Systems", JULY),
    "PC Operating Systems II": ("PC Operating Systems", JULY),
    "Noncredit for AUTO INT": ("Automotive Technology", SAM),
    "Noncredit for AUTO SMOG": ("Automotive Technology", SAM),
    "Credit by Exam AUTO INTR Automotive Service and Introduction": ("Automotive Service and Introduction", JULY),
    "AP Calculus AB (Score of 3)": ("AP Calculus AB", JULY),
    "AP Calculus AB (Score of 4 or 5)": ("AP Calculus AB", JULY),
    "Guitar I": ("Guitar I", JULY),
    "Watercolor I": ("Watercolor I", JULY),
    "Beginning Automotive Painting I - Credit by Exam": ("Beginning Automotive Painting 1", SAM),
    "Intermediate Automotive Painting I - Credit by Exam": ("Automotive Painting 1 Intermediate", JULY),
}
ISSUER = {"ASE A1 — Engine Repair": "National Institute for Automotive Service Excellence (ASE)",
          "OSHA 10 Card": "Occupational Safety and Health Administration (OSHA)",
          "Firefighter II": "California State Fire Training (SFT)", "AP Calculus AB": "College Board"}
COURSES = {   # raw: (college, code, credit line)
    "Noncredit for AUTO A1": (LPC, "AUTO A1", "4 units in AUTO A1 Engine Repair"),
    "Noncredit for AUTO A8": (LPC, "AUTO A8", "5 units in AUTO A9 Engine Performance"),
    "Noncredit for AUTO P1": (LPC, "AUTO P1", "4 units in AUTO P1 Powertrains: Modifications for Performance"),
    "Brakes - Credit by Exam (ATEC 14 )": ("El Camino College", "ATEC 14", "4 hours in Brakes"),
    "OSHA 10 Card": ("Some College", "OSHA 10", "1 unit in Safety"),
    "Noncredit for AUTO INT": (LPC, "AUTO INT", "2 units in AUTO INT Automotive Service and Introduction Lecture"),
    "Noncredit for AUTO SMOG": (LPC, "AUTO SMOG", "5.5 units in AUTO SMOG Smog Level One and Level Two"),
    "AP Calculus AB (Score of 3)": ("Glendale Community College", "MATH 101", "4 units in College Algebra for STEM"),
    "AP Calculus AB (Score of 4 or 5)": ("Glendale Community College", "MATH 103", "5 units in Calculus 1"),
}


def write(path, obj, js=None):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        if js:
            fh.write("window.%s = %s;\n" % (js, json.dumps(obj)))
        else:
            json.dump(obj, fh)


def fixture(root):
    write(os.path.join(root, "kb", "unified_titles.json"),
          {raw: {"unified_title": t, **who} for raw, (t, who) in TITLES.items()})
    titles = sorted({t for t, _ in TITLES.values()})
    write(os.path.join(root, "kb", "credentials.json"),
          {t: [{"issuing_agency": ISSUER.get(t, CCC)}] for t in titles})
    write(os.path.join(root, "kb", "unclassified_assignments.json"),
          {"assignments": {}, "sweep_kept": {"Guitar I": ["Guitar 1"]}})
    write(os.path.join(root, "kb", "coci_articulations.json"), {"articulations": []})
    write(os.path.join(root, "statewide_data.js"), {"exhibits": [
        {"raw_titles": [raw], "adopter_names": [col], "credit_recs": [{"course": code, "credit": line}]}
        for raw, (col, code, line) in COURSES.items()]}, js="CPL_STATEWIDE")
    write(os.path.join(root, "kb", "exhibits_review.json"), {"held": [{"raw": "Watercolor I"}]})
    write(os.path.join(root, "kb", "unclassified_fold", "2026-10-31", "report.json"), {"held": []})


tmp = tempfile.mkdtemp(prefix="sweep-test-")
try:
    fixture(tmp)
    d = sw.build(tmp)
    by_local = {}
    for c in d["cards"]:
        for loc in c["locals"]:
            by_local[loc["raw"]] = c

    def proposed(raw):
        return (by_local.get(raw) or {}).get("proposed")

    def rules(raw):
        return (by_local.get(raw) or {}).get("rules")

    # ase
    check("a course named by its ASE code takes Automotive Technology and the test in parentheses",
          proposed("Noncredit for AUTO A1") == "Automotive Technology (ASE A1 Engine Repair)"
          and rules("Noncredit for AUTO A1") == ["ase"], by_local.get("Noncredit for AUTO A1"))
    check("an ASE paren with extra words takes the test's official name",
          proposed("Noncredit for AUTO A8") == "Automotive Technology (ASE A8 Engine Performance)")
    check("an ASE paren on a course the code does not name gives way to the course's own title",
          proposed("Noncredit for AUTO P1") == "Powertrains: Modifications for Performance"
          and "not ASE P1" in by_local["Noncredit for AUTO P1"]["why"][0])
    check("the ASE credential itself keeps its name",
          "Automotive Service Excellence (ASE) A1 Certificate" not in by_local)
    # course-code, then ase
    check("a course number and method word come off, and the course then takes its ASE test",
          proposed("Brakes - Credit by Exam (ATEC 14 )") == "Automotive Technology (ASE A5 Brakes)"
          and rules("Brakes - Credit by Exam (ATEC 14 )") == ["ase", "course-code"])
    check("an industry credential's code is its name, never a course number", "OSHA 10 Card" not in by_local)
    # numerals
    check("Roman level numerals become Arabic", proposed("Class Piano II") == "Class Piano 2")
    check("an official name keeps its Roman numeral", "SFT Firefighter II" not in by_local)
    # language
    check("Beginning reads as Elementary, level first", proposed("CHIN 1: Beginning Chinese") == "Elementary Chinese 1")
    check("1B is the second elementary course", proposed("Credit by Exam SPAN 1B Elementary Spanish") == "Elementary Spanish 2"
          and "SPAN 1 at another" not in by_local)
    check("Intermediate leads, and its numeral turns Arabic on the way",
          proposed("SPAN 003: Intermediate Spanish I") == "Intermediate Spanish 1"
          and rules("SPAN 003: Intermediate Spanish I") == ["numerals", "language"])
    check("a language word in another subject is left alone", "Spanish Wines" not in by_local)
    # level differs
    c = by_local.get("Haz Mat Technician 1A: Basic Chemistry") or {}
    check("a local title whose level differs from its canonical's is caught and only it moves",
          c.get("proposed") == "Haz Mat Technician 1A: Basic Chemistry" and c.get("rules") == ["level"]
          and [x["raw"] for x in c.get("locals", [])] == ["Haz Mat Technician 1A: Basic Chemistry"]
          and c.get("moves_all") is False and c.get("current_locals") == 2)
    # fold
    c = by_local.get("PC Operating System") or {}
    check("twin titles fold into the one with more local titles",
          c.get("proposed") == "PC Operating Systems" and c.get("proposed_exists") and c.get("proposed_locals") == 2)
    check("one title over two courses at one college splits: into the credential that already names the course",
          proposed("Noncredit for AUTO INT") == "Automotive Service and Introduction", by_local.get("Noncredit for AUTO INT"))
    check("else in the family's own form, the course in parentheses",
          proposed("Noncredit for AUTO SMOG") == "Automotive Technology (Smog Level One and Level Two)")
    check("an exam over two courses at one college is one credential, never split",
          "AP Calculus AB (Score of 3)" not in by_local)
    check("a family follows the level placement a person chose most recently",
          proposed("Intermediate Automotive Painting I - Credit by Exam") == "Intermediate Automotive Painting 1")
    # guards
    check("a proposal a person kept never comes back", "Guitar I" not in by_local)
    check("a title waiting in Review is left to Review", "Watercolor I" not in by_local)
    check("counts by first rule add up to the cards", sum(d["counts"].values()) == len(d["cards"])
          and d["local_titles"] == sum(len(c["locals"]) for c in d["cards"]))
    check("every card names its issuer and what it moves",
          all("issuer" in c and "moves_all" in c and c["locals"] and c["why"] for c in d["cards"]))
    check("card ids are stable across builds", [c["id"] for c in sw.build(tmp)["cards"]] == [c["id"] for c in d["cards"]])

    out = os.path.join(tmp, "kb", "exhibits_sweep.json")
    sw.main(["--root", tmp, "--quiet"])
    first = json.load(open(out))
    first["generated_at"] = "2026-10-31T00:00:00Z"
    with open(out, "w") as fh:
        json.dump(first, fh)
    sw.main(["--root", tmp, "--quiet"])
    check("a rebuild with nothing new keeps its time stamp, so the run commits nothing",
          json.load(open(out))["generated_at"] == "2026-10-31T00:00:00Z")
finally:
    shutil.rmtree(tmp, ignore_errors=True)

failed = [r for r in results if not r[1]]
for name, ok, why in results:
    print(("PASS " if ok else "FAIL ") + name + ("" if ok else "  " + repr(why)[:500]))
print("%d checks, %d failed" % (len(results), len(failed)))
sys.exit(1 if failed else 0)
