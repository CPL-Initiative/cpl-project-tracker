#!/usr/bin/env python3
"""The Exhibits tab's Review queue builder (kb/_build_exhibits_review.py).

Sam, Open Asks Sheet 147 card 1 (2026-10-31): one Exhibits tab replaces the CER and Exhibit Adoption,
Review first. exhibits.js draws whatever this builder writes, so the contract guarded here is the
file: each held title in its CER step; an aligned course names the proposal ("if there's a M-ID title
aligned show it and let it determine the proposed classifyer", 2026-10-30) with the classifier's title
kept beside it; a conflict proposes the reference's person-reviewed title; could-adopt colleges hold a
course of the same identity, else Exhibit Adoption's list; a title the fold settled since the run
leaves the queue; and no student count is ever written to this public file (the student-detail ADR:
students are a reviewer-only read).

Run from the repo root: python3 tests/exhibits_review_build_test.py
"""
import importlib.util
import json
import os
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
spec = importlib.util.spec_from_file_location("build_exhibits_review", os.path.join(ROOT, "kb", "_build_exhibits_review.py"))
B = importlib.util.module_from_spec(spec)
spec.loader.exec_module(B)

results = []


def check(name, cond, detail=""):
    results.append((name, bool(cond)))
    print(("PASS " if cond else "FAIL ") + name + ((" — " + str(detail)) if (detail and not cond) else ""))


def write(root, rel, obj, js=None):
    path = os.path.join(root, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        if js:
            f.write("/* {c:collegeIdx} a brace in the header */\nwindow.%s = %s;\n" % (js, json.dumps(obj)))
        else:
            json.dump(obj, f)


DM = "Introduction to Digital Media High School Articulation"
AP = "AP Computer Science A - Score of 3 or higher"
JUV = "ADJU 232 - Juvenile Justice Procedures - Credit by Exam"
CODE = "ADJUS 23 Principles and Procedures of the Justice System"
WORD = "Welding 1 for"
GONE = "Folded Since The Run"
SAVED = "Saved Since The Run"

FIX = {
    "kb/cer_procedures_out/latest.json": {
        "_generated_at": "2026-10-31T07:47:00Z", "saved_not_folded": 2,
        "needs_you": [
            {"raw_title": DM, "why": "the classifier is unsure (0.80)", "colleges": ["Cabrillo College"],
             "proposal": {"title": "Digital Media Basics", "issuer": "Local High School", "confidence": 0.8}},
            {"raw_title": AP, "why": "the classifier's title has a method word left in", "colleges": ["Los Angeles Pierce College"],
             "proposal": {"title": "AP Computer Science A", "issuer": "College Board", "confidence": 0.9}},
            {"raw_title": CODE, "why": "a merge would join two issuers (California Community Colleges; the reference has POST)",
             "colleges": ["Merritt College"], "proposals": [{"procedure": "course-identity", "title": "Principles and Procedures of the Justice System", "issuer": "California Community Colleges"},
                                                            {"procedure": "statewide-catalog", "title": "Justice System Principles", "issuer": ""}]},
            {"raw_title": JUV, "why": "the fold held the saved assignment: human-reviewed classification stands",
             "proposal": {"title": "Juvenile Justice Procedures", "issuer": "", "procedure": "the assignment map saved"},
             "standing": ["Juvenile Law and Procedures"], "kind": "conflict", "fold_report": "2026-10-30", "colleges": []},
            {"raw_title": WORD, "why": "the classifier's title has a dangling word", "colleges": ["Norco College"],
             "proposal": {"title": "Welding 1 for", "issuer": "", "confidence": 0.9}},
            {"raw_title": GONE, "why": "the classifier is unsure (0.70)", "colleges": ["Norco College"],
             "proposal": {"title": "Gone", "issuer": "", "confidence": 0.7}},
            {"raw_title": SAVED, "why": "the classifier is unsure (0.70)", "colleges": ["Norco College"],
             "proposal": {"title": "Saved", "issuer": "", "confidence": 0.7}},
        ]},
    "kb/unclassified_suggestions.json": {
        "_generated_at": "2026-10-31T06:20:00Z",
        "aligned": {DM: {"kind": "cid", "id": "ARTS 250", "title": "Introduction to Digital Art", "code": "DM 1", "college": "Cabrillo College"},
                    JUV: {"kind": "mid", "id": "ADJU M1000", "title": "Never Used For A Conflict", "code": "ADJ 8", "college": "Norco College"}}},
    "kb/unified_titles.json": {
        "DM 2 Intro Digital Art": {"unified_title": "Introduction to Digital Art"},
        "ART 10 Digital Art": {"unified_title": "Introduction to Digital Art"},
        JUV: {"unified_title": "Juvenile Law and Procedures"}},
    "kb/credentials.json": {
        "Introduction to Digital Art": [{"issuing_agency": "California Community Colleges", "training_agency": None}],
        "Juvenile Law and Procedures": [{"issuing_agency": "California Community Colleges", "training_agency": "Regional Academy"}]},
    "kb/exhibit_audit/latest.json": {
        "generated_at": "2026-10-31T06:10:00Z",
        "title_cards": [{"raw_title": t, "unified_title": None, "tags": ["unclassified_in_map"]} for t in (DM, AP, CODE, WORD, SAVED)]
                       + [{"raw_title": GONE, "unified_title": "Gone"}, {"raw_title": JUV, "unified_title": "Juvenile Law and Procedures"}]},
    "kb/unclassified_assignments.json": {"assignments": {SAVED: {"unified_title": "Saved", "reviewed_by": "map@rccd.edu"}}},
    "kb/credential_review_overlay.json": {"overrides": {
        "Introduction to Digital Art": {"training_sites": [{"site": "Cabrillo Media Lab", "college": "Cabrillo College"},
                                                           {"site": "Aptos High School"}]},
        "Juvenile Law and Procedures": {"issuing_agency_override": "California Community Colleges"}}},
}
STATEWIDE = {"generated_at": "2026-10-31T06:00:00", "exhibits": [
    {"exhibit_ids": ["MAPCXH-ITDM-1-001"], "raw_titles": [DM], "adopter_names": ["Cabrillo College"],
     "potential_names": ["Chabot College", "Cabrillo College"]},
    {"exhibit_ids": ["MAPSAS-ACSA20-1-001"], "raw_titles": [AP], "adopter_names": ["Los Angeles Pierce College"],
     "potential_names": ["Norco College", "Chabot College"]},
    {"exhibit_id": "MAPCXS-A2-J-1-001|MAPCxS-JLAP-1-001", "raw_titles": [JUV], "adopter_names": ["Norco College", "Modesto Junior College"],
     "potential_names": ["Chabot College"]},
]}
MEMBERS = {"colleges": ["Cabrillo College", "CaÃ±ada College", "Cypress College ", "Norco College"],
           "members": {"ARTS 250": [{"c": 0, "n": "DM 1", "t": "Intro to Digital Media", "u": 3},
                                    {"c": 1, "n": "ART 10", "t": "Digital Art", "u": 3},
                                    {"c": 2, "n": "ART 20", "t": "Digital Art I", "u": 3},
                                    {"c": 2, "n": "ART 20", "t": "Digital Art I", "u": 3}]}}

with tempfile.TemporaryDirectory() as root:
    for rel, obj in FIX.items():
        write(root, rel, obj)
    write(root, "statewide_data.js", STATEWIDE, js="CPL_STATEWIDE")
    write(root, "unified_courses_members.js", MEMBERS, js="CPL_UNIFIED_MEMBERS")
    data, courses = B.build(root)
    out = os.path.join(root, "kb", "exhibits_review.json")
    r = subprocess.run([sys.executable, os.path.join(ROOT, "kb", "_build_exhibits_review.py"), "--root", root, "--quiet"],
                       capture_output=True, text=True, timeout=120)
    check("the builder exits 0 on a fixture root", r.returncode == 0, r.stderr[-400:])
    with open(out, encoding="utf-8") as f:
        written = json.load(f)
    with open(os.path.join(root, "kb", "exhibits_review_courses.json"), encoding="utf-8") as f:
        written_courses = json.load(f)
    with open(out, encoding="utf-8") as f:
        text = f.read()
    stamp = written["written_at"]
    r2 = subprocess.run([sys.executable, os.path.join(ROOT, "kb", "_build_exhibits_review.py"), "--root", root],
                        capture_output=True, text=True, timeout=120)
    with open(out, encoding="utf-8") as f:
        again = json.load(f)
    check("a second run with nothing new leaves the file alone", "unchanged" in r2.stdout and again["written_at"] == stamp, r2.stdout)

held = {h["raw"]: h for h in data["held"]}
names = data["colleges"]


def named(idx):
    return [names[i] for i in idx]


check("schema 1, a written_at stamp, and the run it read", data["schema"] == 1 and data["written_at"].endswith("Z")
      and data["sources"]["procedures_run"] == "2026-10-31T07:47:00Z")
check("a title folded since the run leaves the queue", GONE not in held)
check("a title saved since the run leaves the queue", SAVED not in held)
check("the conflict stays though the reference holds its raw", JUV in held)
check("settled_since_run counts the two", data["tiles"]["settled_since_run"] == 2, data["tiles"])
check("each reason maps to its CER step",
      held[DM]["step"] == "Proposed" and held[AP]["step"] == "Wording check" and held[WORD]["step"] == "Wording check"
      and held[CODE]["step"] == "Two issuers" and held[JUV]["step"] == "Conflict with the reference",
      {k: v["step"] for k, v in held.items()})
check("the step counts add to the queue", sum(data["steps"].values()) == len(data["held"]) == 5, data["steps"])

dm = held[DM]
check("an aligned course names the proposal, from its identity",
      dm["title"] == "Introduction to Digital Art" and dm["from"] == "C-ID ARTS 250", (dm["title"], dm["from"]))
check("the classifier's own title stays beside it", dm.get("alternates") == ["Digital Media Basics"], dm.get("alternates"))
check("the issuer is the classifier's", dm["issuer"] == "Local High School")
check("the aligned course and its id ride along", dm["course"] == "DM 1" and dm["aligned_id"] == "ARTS 250")
check("could adopt: the same identity's colleges, the articulating one left out",
      dm["same"] and named(dm["could"]) == ["Cañada College", "Cypress College"], named(dm["could"]))
check("a college name as COCI sent it is cleaned (mojibake, trailing space)",
      "Cañada College" in names and "Cypress College" in names and not any(n != n.strip() or "Ã" in n for n in names))
check("the local titles already under the proposal are listed",
      dm.get("under") == ["ART 10 Digital Art", "DM 2 Intro Digital Art"] and dm.get("under_count") == 2, dm.get("under"))
check("a proposal that is already a credential says so", dm.get("exists") is True)
check("the courses file holds the identity's rows per college, deduplicated",
      courses["courses"]["ARTS 250"][str(names.index("Cypress College"))] == [["ART 20", "Digital Art I", 3]], courses["courses"].get("ARTS 250"))
check("the courses file and the review file share one college list", courses["colleges"] == names)

ap = held[AP]
check("no aligned course: the classifier's proposal, and Exhibit Adoption's colleges",
      ap["title"] == "AP Computer Science A" and ap["from"] == "the classifier" and not ap["same"]
      and named(ap["could"]) == ["Chabot College", "Norco College"], (ap["from"], named(ap["could"])))

code = held[CODE]
check("two proposals: the first leads, the second is an alternate, the rule named",
      code["title"] == "Principles and Procedures of the Justice System" and code["from"] == "the course-identity rule"
      and code.get("alternates") == ["Justice System Principles"], (code["from"], code.get("alternates")))
check("a title in no exhibit record falls back to the colleges that typed it",
      named(code["art"]) == ["Merritt College"] and code["ids"] == [])

juv = held[JUV]
check("a conflict proposes the reference's person-reviewed title, never the aligned course",
      juv["title"] == "Juvenile Law and Procedures" and juv["from"] == "the reference, reviewed by a person"
      and "aligned_id" not in juv, juv)
check("a conflict carries the saved assignment it disagrees with", juv.get("saved") == "Juvenile Justice Procedures")
check("a pipe-joined exhibit id splits into its exhibits", juv["ids"] == ["MAPCXS-A2-J-1-001", "MAPCxS-JLAP-1-001"])
check("the reference's training site shows, read-only", juv.get("trainers") == ["Regional Academy"])
check("a curator's training sites stand in for the records', in order, each with its college",
      held[DM].get("trainers") == ["Cabrillo Media Lab (Cabrillo College)", "Aptos High School"], held[DM].get("trainers"))

check("the written file matches the build", [h["raw"] for h in written["held"]] == [h["raw"] for h in data["held"]]
      and written_courses["courses"].keys() == courses["courses"].keys())
check("one held title per line, so a nightly diff reads by title",
      sum(1 for line in text.splitlines() if line.startswith('  {"raw":')) == len(written["held"]))
# The student-detail ADR: this file is public (GitHub Pages); students are a reviewer-only read.
check("no student figure is written to the public file", "student" not in json.dumps(
    {k: v for k, v in written.items() if k != "_about"}).lower())
check("the most widely articulated title leads without students", len(data["held"][0]["art"]) >= len(data["held"][-1]["art"]))

check("basis_of names the identity, else the course",
      B.basis_of({"kind": "ccn", "id": "POLS C1000"}) == "CCN POLS C1000" and B.basis_of({"kind": "course", "code": "MATH 110"}) == "the course MATH 110")

failed = [n for n, ok in results if not ok]
print("\n%d/%d checks passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
