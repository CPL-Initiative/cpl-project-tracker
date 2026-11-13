#!/usr/bin/env python3
"""The Exhibits tab's Review queue builder (kb/_build_exhibits_review.py).

Sam, Open Asks Sheet 147 card 1 (2026-10-31): one Exhibits tab replaces the CER and Exhibit Adoption,
Review first. exhibits.js draws whatever this builder writes, so the contract guarded here is the
file: each held title in its CER step; an aligned course names the proposal ("if there's a M-ID title
aligned show it and let it determine the proposed classifyer", 2026-10-30) with the classifier's title
kept beside it; a conflict proposes the reference's person-reviewed title; could-adopt colleges hold a
course of the same identity, else teach a course mapped to the proposed credential (the prescriptive
layer), and never come from EACR's TOP and C-ID overlap (`potential_names`, off every screen since Sam's
ruling of 2026-09-24; Rule 7); a title the fold settled since the run leaves the queue; and no student
count is ever written to this public file (the student-detail ADR: students are a reviewer-only read).

The same run writes kb/exhibits_adoption.json, Exhibit Adoption's per-credential view folded into the
credential panel: what each college articulated (its distinct lines, units by EACR's own rule), the
courses each could-adopt college already teaches, the exhibits, the CIP sector and the peer median.

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
STATEWIDE = {"generated_at": "2026-10-31T06:00:00", "cip_sectors": {"11": "Computer and Information Sciences"}, "exhibits": [
    {"exhibit_ids": ["MAPCXH-ITDM-1-001"], "raw_titles": [DM], "adopter_names": ["Cabrillo College"],
     "potential_names": ["Chabot College", "Cabrillo College"]},
    {"exhibit_ids": ["MAPSAS-ACSA20-1-001"], "raw_titles": [AP], "adopter_names": ["Los Angeles Pierce College"],
     "potential_names": ["Norco College", "Chabot College"]},
    {"exhibit_id": "MAPCXS-A2-J-1-001|MAPCxS-JLAP-1-001", "raw_titles": [JUV], "adopter_names": ["Norco College", "Modesto Junior College"],
     "potential_names": ["Chabot College"]},
    # Two classified cards of one credential: Norco in both (its lines merge, units by distinct line).
    {"exhibit_ids": ["MAPCXI-CS-1-001"], "raw_titles": ["CompTIA Security+"], "unified_title": "CompTIA Security+",
     "is_classified": True, "cip_sector": "11", "adopter_names": ["Norco College", "Chabot College"],
     "potential_names": ["Cabrillo College", "Modesto Junior College"],
     "credit_recs": [{"course": "CIS 75", "credit": "3 hours in Security Fundamentals"},
                     {"course": "CNT 69", "credit": "2 hours in Network Security"}],
     "adopter_rec_idx": {"Norco College": [0], "Chabot College": [1]},
     "exhibit_records": [{"id": "MAPCXI-CS-1-001", "title": "CompTIA Security+", "units": 3.0}]},
    {"exhibit_ids": ["MAPCBEN-SF(-1-001"], "raw_titles": ["Security Fund. (Security+)"], "unified_title": "CompTIA Security+",
     "is_classified": True, "cip_sector": "", "adopter_names": ["Norco College"],
     "credit_recs": [{"course": "CIS 75", "credit": "3 hours in Security Fundamentals"},
                     {"course": "CIS 76", "credit": "1.5 hours in Security Lab"}],
     "adopter_rec_idx": {"Norco College": [0, 1]},
     "exhibit_records": [{"id": "MAPCBEN-SF(-1-001", "title": "Security Fund. (Security+)", "units": 4.5}]},
    {"exhibit_ids": ["MAPX-UNCL-1-001"], "raw_titles": ["Industry for EMS 70"], "unified_title": "Industry for EMS 70",
     "is_classified": False, "adopter_names": ["Norco College"], "credit_recs": [], "adopter_rec_idx": {}},
]}
PRESCRIPTIVE = {
    "AP Computer Science A": {"colleges": [{"college": "Norco College", "courses": [{"subject": "CIS", "number": "5", "units": 4}]},
                                           {"college": "Los Angeles Pierce College", "courses": [{"subject": "CS", "number": "101", "units": 3}]}],
                              "n_colleges": 2, "withheld": 0},
    "CompTIA Security+": {"colleges": [{"college": "CaÃ±ada College", "courses": [{"subject": "CIS", "number": "60", "units": 3},
                                                                                  {"subject": "CIS", "number": "60", "units": 3}]},
                                       {"college": "Norco College", "courses": [{"subject": "CIS", "number": "75", "units": 3}]}],
                          "n_colleges": 2, "withheld": 3},
}
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
    write(root, "statewide_prescriptive.js", PRESCRIPTIVE, js="CPL_STATEWIDE_PRESCRIPTIVE")
    data, courses, adoption = B.build(root)
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
    with open(os.path.join(root, "kb", "exhibits_adoption.json"), encoding="utf-8") as f:
        written_adoption = json.load(f)
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


# The names an issuer or training-site box offers (Sam, 2026-10-31): every issuer and trainer the
# reference's records give, once each, A to Z.
creds_fix = FIX.get("kb/credentials.json") or {}
want_iss = sorted({" ".join(str(r.get("issuing_agency") or "").split()) for recs in creds_fix.values()
                   for r in (recs if isinstance(recs, list) else []) if isinstance(r, dict)} - {""}, key=str.lower)
check("the file lists the reference's issuers to pick from", data["issuers"] == want_iss and len(want_iss) > 0, data["issuers"])
check("and its training sites, once each, A to Z", data["sites"] == sorted(set(data["sites"]), key=str.lower), data["sites"])

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
check("no aligned course: the classifier's proposal, and the colleges that teach a course mapped to it",
      ap["title"] == "AP Computer Science A" and ap["from"] == "the classifier" and not ap["same"]
      and named(ap["could"]) == ["Norco College"] and ap.get("courses_key") == "teaches:AP Computer Science A",
      (ap["from"], named(ap["could"]), ap.get("courses_key")))
check("the articulating college is left out of the teaching colleges", "Los Angeles Pierce College" not in named(ap["could"]))
check("the courses file holds the teaching colleges' courses under the credential's key",
      courses["courses"]["teaches:AP Computer Science A"][str(names.index("Norco College"))] == [["CIS 5", "", 4]],
      courses["courses"].get("teaches:AP Computer Science A"))
# Rule 7 and Sam's 2026-09-24 ruling: the TOP and C-ID overlap reaches no screen.
check("no could-adopt college comes from potential_names",
      "Chabot College" not in named(ap["could"]) and not any("Chabot College" in named(h["could"]) for h in data["held"]),
      {k: named(v["could"]) for k, v in held.items()})
check("a title with no identity course and no teaching college names none, and carries no courses key",
      named(held[CODE]["could"]) == [] and "courses_key" not in held[CODE] and named(held[WORD]["could"]) == [])
check("a same-identity title's courses key is its identity", dm.get("courses_key") == "ARTS 250")

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

cr = adoption["credentials"]
an = adoption["colleges"]


def by_name(d):
    return {an[int(k)]: v for k, v in (d or {}).items()}


sec = cr.get("CompTIA Security+") or {}
check("the adoption file: schema 1, a stamp, one college list, the CIP vocabulary",
      adoption["schema"] == 1 and adoption["written_at"].endswith("Z") and adoption["cip_sectors"] == {"11": "Computer and Information Sciences"}
      and an == sorted(an, key=str.lower))
check("an unclassified card is not a credential here", "Industry for EMS 70" not in cr)
check("a college in two cards: its distinct lines merge, units by EACR's rule (3 + 1.5)",
      by_name(sec.get("a")).get("Norco College") == [4.5, [["CIS 75", "3 hours in Security Fundamentals"], ["CIS 76", "1.5 hours in Security Lab"]]],
      by_name(sec.get("a")))
check("each articulating college carries its own lines", by_name(sec.get("a")).get("Chabot College") == [2.0, [["CNT 69", "2 hours in Network Security"]]])
check("could adopt: the prescriptive layer's courses, deduplicated, the articulating college left out, the name cleaned",
      by_name(sec.get("c")) == {"Cañada College": [["CIS 60", "", 3]]}, by_name(sec.get("c")))
check("the over-merged colleges are counted, never named", sec.get("w") == 3)
check("potential_names reaches no could-adopt list", "Modesto Junior College" not in by_name(sec.get("c"))
      and "Cabrillo College" not in by_name(sec.get("c")))
check("the exhibits, the first CIP sector a card names, and the peer median",
      sec.get("x") == [["MAPCBEN-SF(-1-001", "Security Fund. (Security+)", 4.5], ["MAPCXI-CS-1-001", "CompTIA Security+", 3.0]]
      and sec.get("s") == "11" and sec.get("p") == 3.25, (sec.get("x"), sec.get("s"), sec.get("p")))
check("a credential only the prescriptive layer knows still has an entry", by_name(cr.get("AP Computer Science A", {}).get("c")) ==
      {"Los Angeles Pierce College": [["CS 101", "", 3]], "Norco College": [["CIS 5", "", 4]]}, cr.get("AP Computer Science A"))
check("the written adoption file matches the build", written_adoption["credentials"].keys() == cr.keys())
check("no student figure is written to the adoption file", "student" not in json.dumps(
    {k: v for k, v in written_adoption.items() if k != "_about"}).lower())
check("rec_units reads the leading figure, else 0", B.rec_units("4.5 hours in Ethical Hacking") == 4.5 and B.rec_units("Credit") == 0.0)

check("basis_of names the identity, else the course",
      B.basis_of({"kind": "ccn", "id": "POLS C1000"}) == "CCN POLS C1000" and B.basis_of({"kind": "course", "code": "MATH 110"}) == "the course MATH 110")

# ── #3223 (S647): the local course title, and a proposal that kept a course code ──
# Sam, 4:57 AM PT 2026-11-13, on the Las Positas card "Industry Training Evidence for CNT 7285": "the local course title has
# been the most helpful thing for me to see ... it should be taken into account when suggesting proposed titles for
# exhibits that appear to be for cx or noncredit" and "for those appearing to be for industry certs, the proposed title
# should attempt to be the official cert title". On main the card proposed "Computer Networking Technology (CNT 7285)".
MEM = {"colleges": ["Las Positas College", "Hartnell College"], "members": {"M1": [
    {"c": 0, "n": "CNT 7285", "t": "Cloud Infrastructure: CompTIA Cloud+ Certification", "u": 3, "cn": "CCC000589345"},
    {"c": 1, "n": "ABT 133", "t": "Facility Management for Food Safety", "u": 1.5, "cn": "CCC1"},
    {"c": 0, "n": "AJ 54", "t": "Investigative Report Writing", "u": 3, "cn": "CCC2"}]}}
CIX = B.course_index(MEM)
IDX = [{"t": "CompTIA Cloud+", "issuer": "CompTIA", "locals": 3, "adopted": 5},
       {"t": "Cloud Computing", "issuer": "California Community Colleges", "locals": 9, "adopted": 9}]
ex_cnt = {"ids": ["MAPICI-IFC7-1-001"], "art": ["Las Positas College"], "types": [],
          "recs": [["CNT 7285", "3 units in CNT 7285 Cloud Infrastructure: CompTIA Cloud+ Certification"]]}
lc = B.local_courses(ex_cnt, CIX)
check("a card carries its local course: college, code, title, units, control number and credit line",
      lc == [["Las Positas College", "CNT 7285", "Cloud Infrastructure: CompTIA Cloud+ Certification", 3, "CCC000589345",
              "3 units in CNT 7285 Cloud Infrastructure: CompTIA Cloud+ Certification", ""]], lc)
prop = {"title": "Computer Networking Technology (CNT 7285)", "issuer": "California Community Colleges", "alternates": []}
got = B.leftover_code_proposal(prop, ex_cnt, lc, IDX, "Industry Training Evidence for CNT 7285")
check("a proposal left with its course code takes the industry credential its course title names",
      got and got["title"] == "CompTIA Cloud+" and got["issuer"] == "CompTIA"
      and got["alternates"][0] == "Computer Networking Technology (CNT 7285)", got)
ex_abt = {"ids": ["MAPCXI-CBEC2-1-001"], "art": ["Hartnell College"], "types": [], "recs": [["ABT 133", "1.5 units"]]}
got = B.leftover_code_proposal({"title": "Agricultural Business and Technology (ABT 133)", "issuer": "California Community Colleges"},
                               ex_abt, B.local_courses(ex_abt, CIX), IDX, "Credit by Exam-- CFPL ABT 133")
check("a credit-by-exam card left with its course code takes the local course title",
      got and got["title"] == "Facility Management for Food Safety" and got["source"] == B.SRC_COURSE, got)
ex_aj = {"ids": ["MAPICI-IFA5-1-001"], "art": ["Las Positas College"], "types": [], "recs": [["AJ 54", "3 units"]]}
check("an industry-certification card whose course names no credential is left as it stands (a ruling, not a guess)",
      B.leftover_code_proposal({"title": "Administration of Justice (AJ 54)", "issuer": ""}, ex_aj,
                               B.local_courses(ex_aj, CIX), IDX, "Industry Training Evidence for AJ 54") is None)
MEM["members"]["M2"] = [{"c": 0, "n": "ESL 120A", "t": "Intermediate Grammar for Reading and Writing", "u": 3, "cn": "CCC3"}]
CIX = B.course_index(MEM)
ex_esl = {"ids": ["MAPCXS-CBEE-1-001"], "art": ["Las Positas College"], "types": [], "recs": [["ESL 120A", "3 units in ESL 120A"]]}
esl_prop = {"title": "English as a Second Language (ESL 220A)", "issuer": "California Community Colleges"}
check("a noncredit card held for its code, whose credit line names the mirrored credit course, takes that course's title",
      (B.leftover_code_proposal(esl_prop, ex_esl, B.local_courses(ex_esl, CIX), IDX, "Noncredit Course for ESL 220A", wording=True)
       or {}).get("title") == "Intermediate Grammar for Reading and Writing"
      and B.leftover_code_proposal(esl_prop, ex_esl, B.local_courses(ex_esl, CIX), IDX, "Noncredit Course for ESL 220A") is None)
# Sam's ruling of 2026-11-12: a course title stays off an industry-certification exhibit, whatever its units say.
MEM["members"]["M3"] = [{"c": 0, "n": "FIRE 50", "t": "Fire Academy Skills", "u": None, "cn": "CCC4"}]
CIX = B.course_index(MEM)
fire_prop = {"title": "Fire Technology (FIRE 50)", "issuer": "California Community Colleges"}
for ids, label in ((["MAPICI-IFF5-1-001"], "an industry-certification exhibit"),
                   (["MAPICI-IFF5-1-001", "MAPCXS-IFF5-1-001"], "a mix of paths that includes industry certification")):
    ex_fire = {"ids": ids, "art": ["Las Positas College"], "types": [], "recs": [["FIRE 50", "3 units"]]}
    lcf = B.local_courses(ex_fire, CIX)
    check(label + " whose course has no units keeps its proposal: no course title",
          lcf and lcf[0][3] is None
          and B.leftover_code_proposal(fire_prop, ex_fire, lcf, IDX, "Noncredit Industry Evidence for FIRE 50", wording=True) is None)
ex_t = {"ids": [], "art": ["Las Positas College"], "types": ["Industry Certification"], "recs": [["FIRE 50", "3 units"]]}
check("with no path in its ids, MAP's CPL type Industry Certification holds the course title off too",
      B.leftover_code_proposal(fire_prop, ex_t, B.local_courses(ex_t, CIX), IDX, "Industry for FIRE 50", wording=True) is None)
IDX2 = IDX + [{"t": "Emergency Medical Technician", "issuer": "National Registry of Emergency Medical Technicians (NREMT)",
               "locals": 9, "adopted": 9}]
MEM["members"]["M4"] = [{"c": 0, "n": "EMS 20", "t": "Emergency Medical Technician", "u": None, "cn": "CCC5"}]
CIX = B.course_index(MEM)
ex_ems = {"ids": ["MAPICI-IFE20-1-001"], "art": ["Las Positas College"], "types": [], "recs": [["EMS 20", "7 units"]]}
got_ems = B.leftover_code_proposal({"title": "Emergency Medical Services (EMS 20)", "issuer": ""}, ex_ems,
                                   B.local_courses(ex_ems, CIX), IDX2, "Industry Training Evidence for EMS 20", wording=True)
got_cnt = B.leftover_code_proposal(prop, ex_cnt, lc, IDX2, "Industry Training Evidence for CNT 7285", wording=True)
check("an industry certification still takes the official credential its course names: CNT 7285 and EMS 20",
      got_cnt and got_cnt["title"] == "CompTIA Cloud+" and got_cnt["source"] == B.SRC_OFFICIAL
      and got_ems and got_ems["title"] == "Emergency Medical Technician" and got_ems["source"] == B.SRC_OFFICIAL, (got_cnt, got_ems))
check("a proposal with no course code left is never touched",
      B.leftover_code_proposal({"title": "Firefighter 1", "issuer": "x"}, ex_cnt, lc, IDX, "raw") is None)
check("a college-issued title never counts as a named credential, nor does a one-word one",
      B.named_credential(["Intro to Cloud Computing"], IDX) is None and B.named_credential([""], IDX) is None)

failed = [n for n, ok in results if not ok]
print("\n%d/%d checks passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
