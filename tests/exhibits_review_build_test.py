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
# Every run of the builder here is a fixture run: the caller's service key never reaches it, so no test reads
# live kb_curation (#3260 review).
ENV = {k: v for k, v in os.environ.items() if k != "SUPABASE_SERVICE_KEY"}


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
                       capture_output=True, text=True, timeout=120, env=ENV)
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
                        capture_output=True, text=True, timeout=120, env=ENV)
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
# COBIx's review of #3233: the credential branch ran on every path. Ruling A (2026-11-11): a college's exam title stays
# apart from the certification, so a credit-by-exam card whose course names a credential keeps the college's title and issuer.
ex_cx = {"ids": ["MAPCXS-CNT7-1-001"], "art": ["Las Positas College"], "types": [],
         "recs": [["CNT 7285", "3 units in CNT 7285 Cloud Infrastructure: CompTIA Cloud+ Certification"]]}
got_cx = B.leftover_code_proposal(dict(prop), ex_cx, B.local_courses(ex_cx, CIX), IDX2, "Credit by Exam CNT 7285", wording=True)
check("a credit-by-exam card whose course title names a certification keeps a college title and the college as issuer",
      got_cx and got_cx["title"] == "Cloud Infrastructure: CompTIA Cloud+ Certification"
      and got_cx["issuer"] == "California Community Colleges" and got_cx["source"] == B.SRC_COURSE, got_cx)
check("a proposal with no course code left is never touched",
      B.leftover_code_proposal({"title": "Firefighter 1", "issuer": "x"}, ex_cnt, lc, IDX, "raw") is None)
check("a college-issued title never counts as a named credential, nor does a one-word one",
      B.named_credential(["Intro to Cloud Computing"], IDX) is None and B.named_credential([""], IDX) is None)

# COBIx on #3233 (6856966574): one shared ordinary word let an issuer's generic titles match on phrase alone. A title now
# carries its issuer only by one of its tags, every word of a one- or two-word name, or half the words of a longer one
# (issuer_named); the 11 proposals of #3233 rest on CNT 7285 (CompTIA, its one word) and EMS 20 (three of NREMT's five
# words), and both still match.
GENERIC = [{"t": "Water Treatment 1", "issuer": "California State Water Resources Control Board (SWRCB)", "locals": 4, "adopted": 3},
           {"t": "Fire Inspector I", "issuer": "International Fire Service Accreditation Congress (IFSAC) / Pro Board",
            "locals": 2, "adopted": 2},
           {"t": "Traffic Control", "issuer": "American Traffic Safety Services Association (ATSSA)", "locals": 3, "adopted": 2}]
check("a generic title shares one ordinary word with its issuer: it no longer counts as named",
      all(B.named_credential([g["t"] + " for technicians"], GENERIC) is None for g in GENERIC)
      and all(B._brand_words(g["issuer"]) & {w.lower() for w in g["t"].split()} for g in GENERIC))
check("a title carrying its issuer's short tag or half its name still counts",
      B.issuer_named("CompTIA Cloud+", "CompTIA")
      and B.issuer_named("Emergency Medical Technician", "National Registry of Emergency Medical Technicians (NREMT)")
      and B.issuer_named("ASE A5 — Brakes", "National Institute for Automotive Service Excellence (ASE)")
      and B.issuer_named("Certified Pharmacy Technician (CPhT)", "Pharmacy Technician Certification Board (PTCB)")
      and not B.issuer_named("Water Treatment 1", GENERIC[0]["issuer"]))
check("a title sharing no word or tag with its issuer never passes",
      not B.issuer_named("Cloud Computing Basics", "CompTIA") and not B.issuer_named("Brakes", "(ASE)"))

# The review of #3241, and the conductor's rule: each issuer's tags are data (kb/reference/issuer_tags.json); a title
# carries one as whole tokens, or every word of a one- or two-word name, or half the words of a longer one.
TAGS = {"National Fire Protection Association (NFPA)": ["NFPA"], "American Welding Society (AWS)": ["AWS"],
        "International Code Council (ICC)": ["ICC"], "California State Fire Training (SFT)": ["SFT"],
        "IPC — Association Connecting Electronics Industries": ["IPC"], "The Walt Disney Company": ["Disney"],
        "U.S. Green Building Council (USGBC) / Green Business Certification Inc. (GBCI)": ["USGBC", "GBCI", "LEED"],
        "California Department of Forestry and Fire Protection (CAL FIRE)": ["CAL FIRE"],
        "National Registry of Emergency Medical Technicians (NREMT)": ["NREMT"], "CompTIA": []}
check("one ordinary word of a name the joining words leave short no longer names it (NFPA, AWS, ICC, SFT)",
      not any(B.issuer_named(t, i, TAGS) for t, i in (
          ("Fire Inspector 1", "National Fire Protection Association (NFPA)"),
          ("Shielded Metal Arc Welding (SMAW)", "American Welding Society (AWS)"),
          ("California Residential Code", "International Code Council (ICC)"),
          ("Fire Inspector 1A", "California State Fire Training (SFT)"))))
check("a parenthetical of many words is no tag: 'Fire Officer II' is not Pro Board's on 'fire'",
      not B.issuer_named("Fire Officer II", "Pro Board (National Board on Fire Service Professional Qualifications)", TAGS)
      and B.issuer_named("Pro Board Fire Officer II", "Pro Board (National Board on Fire Service Professional Qualifications)", TAGS))
check("a brand the data names counts as whole tokens: IPC, Disney, LEED, CAL FIRE; and only by the data",
      B.issuer_named("IPC Soldering Certification", "IPC — Association Connecting Electronics Industries", TAGS)
      and B.issuer_named("Disney Human Resource Management", "The Walt Disney Company", TAGS)
      and B.issuer_named("LEED Green Associate", "U.S. Green Building Council (USGBC) / Green Business Certification Inc. (GBCI)", TAGS)
      and B.issuer_named("CAL FIRE Ethical Leadership", "California Department of Forestry and Fire Protection (CAL FIRE)", TAGS)
      and not B.issuer_named("Disney Human Resource Management", "The Walt Disney Company", {})
      and not B.issuer_named("Fire Ethical Leadership", "California Department of Forestry and Fire Protection (CAL FIRE)", TAGS)
      and not B.issuer_named("DisneyLand Tour", "The Walt Disney Company", TAGS))
check("CompTIA and NREMT still name theirs: a one-word name whole, three of five words of a longer one",
      B.issuer_named("CompTIA Cloud+", "CompTIA", TAGS)
      and B.issuer_named("Emergency Medical Technician", "National Registry of Emergency Medical Technicians (NREMT)", TAGS))
DATA_TAGS = B.issuer_tags()
def _all(issuer):
    e = DATA_TAGS.get(issuer) or {}
    return (e.get("tags") or []) + (e.get("acronyms") or [])


check("the committed tag list carries the brands the review named, and drops the generic ones",
      "Disney" in _all("The Walt Disney Company") and "IPC" in _all("IPC — Association Connecting Electronics Industries")
      and "LEED" in _all("U.S. Green Building Council (USGBC) / Green Business Certification Inc. (GBCI)")
      and not any(t in ("ROP", "HS", "DUI", "GIS", "varies") for k in DATA_TAGS for t in _all(k)))
check("an unreadable tag file gives no tags, never an error", B.issuer_tags("/nonexistent-root") == {})
# The conductor on #3241: a real credential of its issuer that the rule dropped is a regression. The committed list
# restores each (its own abbreviations and certification tracks) and leaves the generic titles out.
SFT, EMSA = "California State Fire Training (SFT)", "California Emergency Medical Services Authority (EMSA)"
REAL = [("Portfolio Management Professional (PfMP)", "Project Management Institute (PMI)"),
        ("Program Management Professional (PgMP)", "Project Management Institute (PMI)"),
        ("PCAP — Certified Associate in Python Programming", "Python Institute"),
        ("Registered Dental Assistant (RDA) License", "Dental Board of California"),
        ("Registered Dental Hygienist (RDH) License", "Dental Hygiene Board of California"),
        ("Certified Occupational Therapy Assistant (COTA)", "National Board for Certification in Occupational Therapy (NBCOT)"),
        ("Certified Payroll Professional (CPP)", "American Payroll Association (PayrollOrg)"),
        ("Emergency Medical Technician (EMT) Certification", EMSA), ("Emergency Medical Responder (EMR)", EMSA),
        ("Fire Inspector 1A", SFT), ("Fire Officer — Company Officer 2A", SFT), ("Chief Fire Officer 3A — Human Resource Management", SFT),
        ("Fire Apparatus Driver/Operator 1A", SFT), ("Fire Investigation 1B", SFT), ("Training Instructor 1A", SFT),
        ("Defense Language Proficiency Test (DLPT) — Spanish", "Defense Language Institute Foreign Language Center (DLIFLC)"),
        ("Fire CDF Academy", "California Department of Forestry and Fire Protection (CAL FIRE)"),
        ("Cosmetology License", "California Board of Barbering and Cosmetology"),
        ("Biodynamic Farmer Foundation Year Certificate", "Biodynamic Association")]
GENERIC_REF = [("Fire Technology", SFT), ("Fire Investigation", SFT), ("Fire Academy Conditioning", SFT),
               ("Shielded Metal Arc Welding (SMAW)", "American Welding Society (AWS)"),
               ("California Residential Code", "International Code Council (ICC)"),
               ("Fire Inspector 1", "National Fire Protection Association (NFPA)"),
               ("Architecture/Green Design: Principles and Practices", "U.S. Green Building Council (USGBC)"),
               ("Agriculture Occupational Safety", "U.S. Occupational Safety and Health Administration (OSHA)"),
               ("Basic Escrow Procedures", "California Escrow Association (CEA)")]
check("every real credential the rule had dropped counts as named again under the committed list",
      all(B.issuer_named(t, i) for t, i in REAL), [t for t, i in REAL if not B.issuer_named(t, i)])
# The second readers of #3241: a name of three words or more needs a strict majority, so two of four words ("Dental
# Assisting", DBCA) or a subject phrase (DRE's "Real Estate Finance") no longer name the issuer; a capitals tag matches
# only in capitals; and the issuers' own credential abbreviations name their credentials.
GENERIC_REF += [("Dental Assisting", "Dental Assisting Board of California (DBCA)"),
                ("Real Estate Finance", "California Department of Real Estate (DRE)"),
                ("Real Estate Principles and Practices", "California Department of Real Estate (DRE)"),
                ("Fire Service In-Service Training — EMS", SFT),
                ("Post Production Workflow", "California Commission on Peace Officer Standards and Training (POST)"),
                ("Smart Home Installer", "International Association of Sheet Metal, Air, Rail and Transportation Workers (SMART)"),
                ("Bar Management Basics", "California Bureau of Automotive Repair (BAR)"),
                ("Fire Officer II", "Pro Board (National Board on Fire Service Professional Qualifications)")]
REAL += [("California Real Estate Broker License", "California Department of Real Estate (DRE)"),
         ("Cisco Certified Network Associate (CCNA)", "Cisco"), ("CCNA Cybersecurity", "Cisco"),
         ("Certified Ethical Hacker (CEH)", "EC-Council"), ("Computer Hacking Forensic Investigator (CHFI)", "EC-Council"),
         ("Certified Nursing Assistant (CNA)", "California Department of Public Health (CDPH)"),
         ("Basic Life Support (BLS) Certification", "American Heart Association (AHA)"),
         ("LVN License", "California Board of Vocational Nursing and Psychiatric Technicians (BVNPT)"),
         ("Licensed Clinical Social Worker (LCSW)", "California Board of Behavioral Sciences (BBS)"),
         ("Licensed Marriage and Family Therapist (LMFT)", "California Board of Behavioral Sciences (BBS)"),
         ("Licensed Professional Clinical Counselor (LPCC)", "California Board of Behavioral Sciences (BBS)"),
         ("Certified SOLIDWORKS Associate (CSWA)", "Dassault Systèmes"),
         ("ServSafe Food Protection Manager Certification", "National Restaurant Association"),
         ("Class A Contractor License", "Contractors State License Board (CSLB)"),
         ("Certified Pharmacy Technician (CPhT)", "Pharmacy Technician Certification Board (PTCB)"),
         ("California Smog Check Repair Technician License", "California Bureau of Automotive Repair (BAR)"),
         ("POST Basic Course", "California Commission on Peace Officer Standards and Training (POST)")]
check("the issuers' own credential abbreviations name their credentials (round 2)",
      all(B.issuer_named(t, i) for t, i in REAL), [t for t, i in REAL if not B.issuer_named(t, i)])
ACR = {"X Commission (POST)": {"tags": [], "acronyms": ["POST"]}, "Food Group": {"tags": ["ServSafe"], "acronyms": []},
       "Dassault Systèmes": {"tags": ["SOLIDWORKS"], "acronyms": ["CSWA"]},
       "California Department of Forestry and Fire Protection (CAL FIRE)": {"tags": ["CAL FIRE"], "acronyms": ["CDF"]}}
check("an acronym the data marks matches only as written; a phrase tag in any case (COBIx, 17:42Z)",
      B.issuer_named("POST Basic Course", "X Commission (POST)", ACR)
      and not B.issuer_named("Post Basic Course", "X Commission (POST)", ACR)
      and B.issuer_named("servsafe manager", "Food Group", ACR)
      and B.issuer_named("Certified SolidWorks Associate", "Dassault Systèmes", ACR)
      and B.issuer_named("Cal Fire Ethical Leadership", "California Department of Forestry and Fire Protection (CAL FIRE)", ACR)
      and not B.issuer_named("Fire cdf academy", "California Department of Forestry and Fire Protection (CAL FIRE)", ACR))
check("the committed data marks the acronyms: POST is one, SOLIDWORKS and CAL FIRE are phrase tags",
      "POST" in (DATA_TAGS["California Commission on Peace Officer Standards and Training (POST)"]["acronyms"])
      and "SOLIDWORKS" in DATA_TAGS["Dassault Systèmes"]["tags"]
      and "CAL FIRE" in DATA_TAGS["California Department of Forestry and Fire Protection (CAL FIRE)"]["tags"])
# COBIx on #3241 (17:42Z) and the conductor: a generic subject phrase is no SFT tag; a numbered course is.
check("'Fire Prevention Technology' names no issuer; 'Fire Prevention 1A' and 'Fire Control 6' still name SFT",
      not B.issuer_named("Fire Prevention Technology", SFT) and B.issuer_named("Fire Prevention 1A", SFT)
      and B.issuer_named("Fire Control 6: Wildland Firefighting Essentials", SFT)
      and not B.issuer_named("Fire Management Basics", SFT) and B.issuer_named("Fire Management 1", SFT)
      and B.issuer_named("Fire Investigation 1B", SFT) and not B.issuer_named("Fire Investigation", SFT))
# A title several issuers carry (case, spacing and I/1 folded) names none of them unless the text carries that
# issuer's acronym (the conductor's decision on COBIx's finding: "a bare title several issuers share goes to a person").
SH_TAGS = {SFT: {"tags": ["Fire Inspector", "Fire Instructor"], "acronyms": ["SFT"]},
           "National Fire Protection Association (NFPA)": {"tags": [], "acronyms": ["NFPA"]},
           "International Fire Service Accreditation Congress (IFSAC) / Pro Board": {"tags": ["Fire Instructor"], "acronyms": ["IFSAC"]}}
SH_IDX = [{"t": "Fire Instructor 1", "issuer": SFT, "locals": 5, "adopted": 3},
          {"t": "Fire Inspector 1", "issuer": SFT, "locals": 5, "adopted": 3}]
SH_CREDS = {"Fire Instructor 1": [{"issuing_agency": SFT}, {"issuing_agency": "International Fire Service Accreditation Congress (IFSAC) / Pro Board"}],
            "Fire Inspector 1": [{"issuing_agency": SFT}], "Fire Inspector I": [{"issuing_agency": "National Fire Protection Association (NFPA)"}],
            "Fire Instructor 2": [{"issuing_agency": SFT}, {"issuing_agency": "California Community Colleges"}]}
SHARED = B.shared_titles(SH_CREDS, SH_IDX)
check("titles fold for case, spacing and I/1; a college-issued twin is no second issuer",
      B.title_key("Fire  Inspector I") == B.title_key("fire inspector 1") and B.title_key("CompTIA A+") != B.title_key("CompTIA A")
      and len(SHARED[B.title_key("Fire Inspector 1")]) == 2 and len(SHARED[B.title_key("Fire Instructor 2")]) == 1)
check("a bare shared title names no one; the text's own acronym picks its issuer",
      B.named_credential(["Fire Instructor 1"], SH_IDX, SH_TAGS, SHARED) is None
      and B.named_credential(["Fire Inspector 1 for company officers"], SH_IDX, SH_TAGS, SHARED) is None
      and (B.named_credential(["SFT Fire Instructor 1"], SH_IDX, SH_TAGS, SHARED) or {}).get("issuer") == SFT
      and B.named_credential(["sft Fire Instructor 1"], SH_IDX, SH_TAGS, SHARED) is None)
# COBIx on #3241 (6860799161, 6860780079): only a credential's issuer makes a title shared (a school or trainer twin
# does not, and two spellings of one issuer are one); the acronym that settles a shared title counts only in the
# course's own title, and "NFPA 1041" there is a standard's number, not the issuer's mark.
CNT_TAGS = {SFT: {"tags": ["Fire Instructor"], "acronyms": ["SFT"]}, "Fontana High School": {"tags": [], "acronyms": []},
            "National Fire Protection Association (NFPA)": {"tags": [], "acronyms": ["NFPA"]},
            "International Fire Service Accreditation Congress (IFSAC) / Pro Board": {"tags": [], "acronyms": ["IFSAC"]}}
COUNTS = B.credential_issuers(CNT_TAGS, ["Some Vendor"])
TW_CREDS = {"Fire Instructor 1": [{"issuing_agency": SFT}, {"issuing_agency": "Fontana High School"}],
            "Fire Instructor 2": [{"issuing_agency": SFT}, {"issuing_agency": "International Fire Service Accreditation Congress (IFSAC) / Pro Board"}],
            "Certified Payroll Professional (CPP)": [{"issuing_agency": "American Payroll Association (PayrollOrg)"}, {"issuing_agency": "PayrollOrg"}],
            "Vendor Cert": [{"issuing_agency": "Some Vendor"}, {"issuing_agency": SFT}]}
TW = B.shared_titles(TW_CREDS, [], COUNTS)
check("a school twin is no second issuer; a catalog issuer is; two spellings of one issuer are one",
      len(TW.get(B.title_key("Fire Instructor 1"), ())) == 1 and len(TW[B.title_key("Fire Instructor 2")]) == 2
      and len(TW[B.title_key("Vendor Cert")]) == 2 and len(B.shared_titles(TW_CREDS, [])[B.title_key("Certified Payroll Professional (CPP)")]) == 1
      and B.issuer_key("PayrollOrg", {"PayrollOrg": "American Payroll Association (PayrollOrg)"}) == B.issuer_key("American Payroll Association (APA)"))
LIVE_COUNTS = B.credential_issuers()
check("NREMT and EMSA both still count, so Emergency Medical Technician stays shared (EMS 20 goes to a person)",
      B.issuer_key("National Registry of Emergency Medical Technicians (NREMT)") in LIVE_COUNTS
      and B.issuer_key("California Emergency Medical Services Authority (EMSA)") in LIVE_COUNTS
      and B.issuer_key("Fontana High School") not in LIVE_COUNTS and B.issuer_key("Riverside County Office of Education") not in LIVE_COUNTS)
SH2 = B.shared_titles({"Fire Instructor 1": [{"issuing_agency": SFT}, {"issuing_agency": "National Fire Protection Association (NFPA)"}]},
                      SH_IDX, COUNTS)
check("the settling acronym counts only in the course's own title, and an acronym before a standard's number is no mark",
      B.named_credential(["Fire Instructor 1", "3 units, SFT Fire Instructor 1"], SH_IDX, SH_TAGS, SH2, own=["Fire Instructor 1"]) is None
      and (B.named_credential(["SFT Fire Instructor 1"], SH_IDX, SH_TAGS, SH2, own=["SFT Fire Instructor 1"]) or {}).get("issuer") == SFT
      and not B._own_acronym("NFPA 1041 Fire Instructor 1", "NFPA", "Fire Instructor 1")
      and B._own_acronym("NFPA Fire Instructor 1", "NFPA", "Fire Instructor 1")
      and B._own_acronym("NFPA 1670 Swiftwater", "NFPA", "Swiftwater & Flood Rescue Operations (NFPA 1670)"))
check("a name of three or four words needs a strict majority: two of four is not enough, three of four is",
      not B.issuer_named("Dental Assisting", "Dental Assisting Board of California (DBCA)", {})
      and B.issuer_named("Dental Assisting Board Exam", "Dental Assisting Board of California (DBCA)", {}))
check("…and the generic titles stay out", not any(B.issuer_named(t, i) for t, i in GENERIC_REF),
      [t for t, i in GENERIC_REF if B.issuer_named(t, i)])
# CLEP and DSST titles now count as named (their tags), but a credit-by-exam card never asks named_credential
# (d-exhibits-course-title-gate-s647): it keeps its course title and the college as issuer.
IDX_CLEP = [{"t": "CLEP College Algebra", "issuer": "College Board", "locals": 3, "adopted": 3}]
ex_clep = {"ids": ["MAPCXS-CA1-1-001"], "art": ["Las Positas College"], "types": [],
           "recs": [["CNT 7285", "3 units in CNT 7285 CLEP College Algebra"]]}
got_clep = B.leftover_code_proposal(dict(prop), ex_clep, B.local_courses(ex_clep, CIX), IDX_CLEP, "Credit by Exam CNT 7285", wording=True)
check("a credit-by-exam card whose credit line names a CLEP exam keeps its course title, never the CLEP title",
      B.issuer_named("CLEP College Algebra", "College Board") and got_clep and got_clep["source"] == B.SRC_COURSE
      and got_clep["title"] != "CLEP College Algebra", got_clep)

# The review of #3241 on the series strip: Network+, a list joined by "+", "or" or a short second number, any case, a
# trailing "Exam" or leading "Version"; a title that is only a series, or one the strip would leave a joiner in, stays.
SA = B.cert_naming.series_aside
check("Network+, lists, short pairs, case, Exam and Version all strip clean",
      SA("CompTIA Network+ N10-009", "CompTIA") == ("CompTIA Network+", ["N10-009"])
      and SA("CompTIA A+ 220-1101 + 220-1102") == ("CompTIA A+", ["220-1101", "220-1102"])
      and SA("CompTIA Cloud+ (CV0-003 or CV0-004)") == ("CompTIA Cloud+", ["CV0-003", "CV0-004"])
      and SA("CompTIA A+ 220-1101/1102") == ("CompTIA A+", ["220-1101", "220-1102"])
      and SA("CompTIA CySA+ cs0-003") == ("CompTIA CySA+", ["CS0-003"])
      and SA("CompTIA Cloud+ CV0-004 Exam") == ("CompTIA Cloud+", ["CV0-004"])
      and SA("CompTIA Security+ Version SY0-701") == ("CompTIA Security+", ["SY0-701"]))
check("a title that is only a series, or one left with a joiner or empty parentheses, comes back as it came, no alias",
      SA("SY0-701", "CompTIA") == ("SY0-701", []) and SA("Exam SY0-701", "CompTIA") == ("Exam SY0-701", [])
      and SA("CompTIA A+ 220-1101 or") == ("CompTIA A+ 220-1101 or", [])
      and SA("CompTIA A+ (220-1101 and)") == ("CompTIA A+ (220-1101 and)", []))
check("round 2: the issuer and a series alone come back as they came; an Exam beside the parentheses strips with them",
      SA("CompTIA N10-009", "CompTIA") == ("CompTIA N10-009", []) and SA("CompTIA SY0-701") == ("CompTIA SY0-701", [])
      and SA("CompTIA 220-1101/1102") == ("CompTIA 220-1101/1102", [])
      and SA("CompTIA Network+ Exam (N10-009)") == ("CompTIA Network+", ["N10-009"])
      and SA("CompTIA Security+ Certification Exam (SY0-701)") == ("CompTIA Security+ Certification", ["SY0-701"])
      and SA("CompTIA A+ Certification (220-1101, 220-1102) Exams") == ("CompTIA A+ Certification", ["220-1101", "220-1102"]))
check("round 2: only CompTIA's shapes are a series, and every series CompTIA's catalog rows carry still is",
      SA("CompTIA A+ Room B2-104") == ("CompTIA A+ Room B2-104", [])
      and all(B.cert_naming.SERIES.fullmatch(k) for k in ("FC0-U71", "CLO-002", "SY0-701", "CY0-001", "SOT-001",
                                                            "DA0-002", "DY0-001", "DS0-002", "N10-009", "220-1102", "CV0-004")))
check("a course title is never stripped: canonical(series=False) leaves it as the course has it",
      B.cert_naming.canonical("CompTIA Security+ SY0-701 Prep", "", series=False) == "CompTIA Security+ SY0-701 Prep"
      and B.cert_naming.canonical("CompTIA Security+ SY0-701 Prep", "") == "CompTIA Security+ Prep")

# The review of #3241: an official name taken from the reference reads partial though settle() gave it no in_use.
check("record_name_source: an official name in the reference reads partial, one outside it limited, a course title none",
      B.record_name_source({"title": "Emergency Medical Technician", "issuer": "NREMT", "source": B.SRC_OFFICIAL}, {},
                           {"Emergency Medical Technician"}) == {"url": "", "level": "partial"}
      and B.record_name_source({"title": "New Cert", "issuer": "X", "source": B.SRC_OFFICIAL}, {}, set()) == {"url": "", "level": "limited"}
      and B.record_name_source({"title": "A Course", "source": B.SRC_COURSE}, {}, {"A Course"}) is None
      and B.record_name_source({}, None, None) is None)
check("the 11 proposals of #3233 hold: CNT 7285 and EMS 20 still take their official credential",
      (B.leftover_code_proposal(prop, ex_cnt, lc, IDX2 + GENERIC, "Industry Training Evidence for CNT 7285", wording=True) or {}).get("title")
      == "CompTIA Cloud+"
      and (B.leftover_code_proposal({"title": "Emergency Medical Services (EMS 20)", "issuer": ""}, ex_ems,
                                    B.local_courses(ex_ems, CIX), IDX2 + GENERIC, "Industry Training Evidence for EMS 20",
                                    wording=True) or {}).get("title") == "Emergency Medical Technician")

# COBIx on #3223 (6859080666), taken by the S648 conductor: a CompTIA exam series is a search alias, never in the title.
SER = "CompTIA Cloud+ CV0-004 Exam"
fix2 = json.loads(json.dumps(FIX))
fix2["kb/cer_procedures_out/latest.json"]["needs_you"].append(
    {"raw_title": SER, "why": "the classifier is unsure (0.80)", "colleges": ["Norco College"],
     "proposal": {"title": "CompTIA Cloud+ (CV0-004)", "issuer": "CompTIA", "confidence": 0.8,
                  "alternates": ["CompTIA Cloud+ CV0-004", "Cloud+ Certification"]}})
fix2["kb/exhibit_audit/latest.json"]["title_cards"].append({"raw_title": SER, "unified_title": None, "tags": ["unclassified_in_map"]})
with tempfile.TemporaryDirectory() as root2:
    for rel, obj in fix2.items():
        write(root2, rel, obj)
    write(root2, "statewide_data.js", STATEWIDE, js="CPL_STATEWIDE")
    write(root2, "unified_courses_members.js", MEMBERS, js="CPL_UNIFIED_MEMBERS")
    write(root2, "statewide_prescriptive.js", PRESCRIPTIVE, js="CPL_STATEWIDE_PRESCRIPTIVE")
    ser = {h["raw"]: h for h in B.build(root2)[0]["held"]}.get(SER) or {}
check("a CompTIA proposal loses its exam series to series_aliases, and no alternate carries one",
      ser.get("title") == "CompTIA Cloud+" and ser.get("series_aliases") == ["CV0-004"]
      and not any("CV0" in a for a in ser.get("alternates") or []) and ser.get("proposal_source") != B.SRC_OFFICIAL, ser)
check("a title from any other issuer keeps a code that looks like a series",
      B.cert_naming.series_aside("Cisco CCNA 200-301", "Cisco") == ("Cisco CCNA 200-301", [])
      and B.cert_naming.series_aside("CompTIA A+ 220-1101 and 220-1102") == ("CompTIA A+", ["220-1101", "220-1102"])
      and B.cert_naming.canonical("CompTIA Security+ — SY0-701", "CompTIA") == "CompTIA Security+")

# The name source (COBIx on #3223, taken by the S648 conductor: d-official-name-source-confidence-s648). A fixture catalog:
# the issuer's own page, an aggregator's page, and a row with no link.
CAT = {"credentials": [
    {"issuer": "CompTIA", "name": "CompTIA Cloud+", "url": "https://www.comptia.org/en-us/certifications/cloud/"},
    {"issuer": "Some Board (SB)", "name": "Board Certified Tech", "url": "https://www.careeronestop.org/x?id=1"},
    {"issuer": "Other Body", "name": "Other Cert", "url": ""}]}
URLS = B.official_urls(CAT)
check("strong: the catalog holds the issuer's own page for the name (case and spacing folded, issuer tag dropped)",
      B.name_source("compTIA  cloud+", "CompTIA", URLS) == {"url": "https://www.comptia.org/en-us/certifications/cloud/", "level": "strong"}
      and B.name_source("Board Certified Tech", "Some Board", URLS)["level"] != "strong", URLS)
check("an aggregator's link or no link is no issuer page: partial when a sibling exhibit carries it, else limited",
      B.name_source("Board Certified Tech", "Some Board (SB)", URLS, {"title": "Board Certified Tech", "locals": 3})
      == {"url": "", "level": "partial"}
      and B.name_source("Other Cert", "Other Body", URLS) == {"url": "", "level": "limited"})
check("a record with no source reads limited, never strong, and never raises",
      all(B.name_source(t, i, u, iu) == {"url": "", "level": "limited"}
          for t, i, u, iu in (("", "", {}, None), (None, None, None, None), ("CompTIA Cloud+", "CompTIA", None, None),
                              ("CompTIA Cloud+", "", URLS, None)))
      and B.official_urls(None) == {} and B.official_urls({"credentials": [{}]}) == {})
check("the record's level is one of three words", set(B.NAME_SOURCE_LEVELS) == {"strong", "partial", "limited"})
fix3 = json.loads(json.dumps(fix2))
fix3[B.CATALOG] = CAT
# A course title that names a CompTIA series goes out as the course has it (the review of #3241).
PREP = "Security Plus Prep Course"
fix3["kb/cer_procedures_out/latest.json"]["needs_you"].append(
    {"raw_title": PREP, "why": "the classifier is unsure (0.80)", "colleges": ["Norco College"],
     "proposal": {"title": "", "issuer": "California Community Colleges", "confidence": 0.8}})
fix3["kb/unclassified_suggestions.json"]["aligned"][PREP] = {"kind": "mid", "id": "CSIS M1999",
                                                              "title": "CompTIA Security+ SY0-701 Prep", "code": "CIS 60",
                                                              "college": "Norco College"}
fix3["kb/exhibit_audit/latest.json"]["title_cards"].append({"raw_title": PREP, "unified_title": None, "tags": ["unclassified_in_map"]})
with tempfile.TemporaryDirectory() as root3:
    for rel, obj in fix3.items():
        write(root3, rel, obj)
    sw3 = json.loads(json.dumps(STATEWIDE))
    sw3["exhibits"].append({"exhibit_ids": ["MAPICI-CCX-1-001"], "raw_titles": [SER], "adopter_names": ["Norco College"],
                            "potential_names": [], "credit_recs": [], "adopter_rec_idx": {}})
    write(root3, "statewide_data.js", sw3, js="CPL_STATEWIDE")
    write(root3, "unified_courses_members.js", MEMBERS, js="CPL_UNIFIED_MEMBERS")
    write(root3, "statewide_prescriptive.js", PRESCRIPTIVE, js="CPL_STATEWIDE_PRESCRIPTIVE")
    h3 = {h["raw"]: h for h in B.build(root3)[0]["held"]}
srcd = [h for h in h3.values() if "name_source" in h]
check("the builder marks only an official name or a title in use, each with a level, and the CompTIA card reads strong",
      all(h["proposal_source"] in B.NAMED_SOURCES and h["name_source"]["level"] in B.NAME_SOURCE_LEVELS for h in srcd)
      and all("name_source" not in h for h in h3.values() if h["proposal_source"] not in B.NAMED_SOURCES)
      and h3[SER]["proposal_source"] == B.SRC_OFFICIAL and h3[SER]["name_source"]["level"] == "strong"
      and h3[SER]["name_source"]["url"].startswith("https://www.comptia.org/"),
      [(h["raw"], h["proposal_source"], h.get("name_source")) for h in h3.values()])
check("a course-title proposal keeps the series its course names, with no series alias",
      h3.get(PREP, {}).get("title") == "CompTIA Security+ SY0-701 Prep" and h3[PREP]["proposal_source"] == B.SRC_COURSE
      and "series_aliases" not in h3[PREP], h3.get(PREP))

# A decided card stays decided (#3223, S649). Sam saved titles on Review; a rebuild on an overlay synced before
# those saves put the cards back. The live set replaces the overlay (a save drops a card, a clear brings it back);
# the file lists the titles it left out as decided; and a build from an overlay that would bring one of them back
# refuses to write the Review file. The guard compares content: the sync leaves `_synced_at` alone when nothing
# changed, so a time cannot say the overlay is stale (#3260 review).
import yaml  # noqa: E402

with tempfile.TemporaryDirectory() as root4:
    for rel, obj in FIX.items():
        write(root4, rel, obj)
    write(root4, "statewide_data.js", STATEWIDE, js="CPL_STATEWIDE")
    write(root4, "unified_courses_members.js", MEMBERS, js="CPL_UNIFIED_MEMBERS")
    write(root4, "statewide_prescriptive.js", PRESCRIPTIVE, js="CPL_STATEWIDE_PRESCRIPTIVE")
    live_at = "2026-11-13T21:00:00Z"
    d_live = B.build(root4, ({DM: {"unified_title": "Digital Media Basics"}}, live_at))[0]
    live_held = {h["raw"] for h in d_live["held"]}
    check("a live save drops its card though the overlay never heard of it", DM not in live_held, sorted(live_held))
    check("a live clear brings back a card the stale overlay still holds", SAVED in live_held, sorted(live_held))
    check("the conflict stays whatever the live set holds", JUV in live_held)
    check("the file says it read the live set, when, and which held titles it left out as decided",
          d_live["sources"]["assignments"] == {"read": "live", "at": live_at, "decided": [DM]}, d_live["sources"].get("assignments"))
    d_over = B.build(root4)[0]
    check("with no live set the overlay decides and the file says so",
          d_over["sources"]["assignments"]["read"] == "overlay" and d_over["sources"]["assignments"]["decided"] == [SAVED]
          and SAVED not in {h["raw"] for h in d_over["held"]}, d_over["sources"].get("assignments"))

    # The guard, by content.
    check("an overlay build that would bring back a title the committed file left out as decided is refused",
          DM in B.stale_assignments(d_live, d_over), B.stale_assignments(d_live, d_over))
    check("a live build is never refused", B.stale_assignments(d_live, d_live) == "")
    check("a file with no assignments stamp (written before #3223) is not a reason to refuse",
          B.stale_assignments({"sources": {}}, d_over) == "")
    # The finding: an overlay with an old _synced_at but the same decided set as a live-stamped file.
    write(root4, "kb/unclassified_assignments.json", {"_synced_at": "2026-11-13T16:56:14Z",
                                                      "assignments": {DM: {"unified_title": "Digital Media Basics"}}})
    same = B.build(root4)[0]
    check("an overlay build over a live-stamped file with the same decided set is allowed, whatever its _synced_at",
          B.stale_assignments(d_live, same) == "", B.stale_assignments(d_live, same))

    out4 = os.path.join(root4, "kb", "exhibits_review.json")

    def run4(*extra):
        return subprocess.run([sys.executable, os.path.join(ROOT, "kb", "_build_exhibits_review.py"), "--root", root4]
                              + list(extra), capture_output=True, text=True, timeout=120, env=ENV)

    with open(out4, "w", encoding="utf-8") as f:
        f.write(B.dump(d_live, "held"))
    r5 = run4()
    with open(out4, encoding="utf-8") as f:
        after = json.load(f)
    check("the builder exits 0 and writes over a live-stamped file when its overlay holds the same decisions",
          r5.returncode == 0 and after["sources"]["assignments"]["read"] == "overlay", (r5.returncode, r5.stdout[-300:]))

    write(root4, "kb/unclassified_assignments.json", FIX["kb/unclassified_assignments.json"])
    with open(out4, "w", encoding="utf-8") as f:
        f.write(B.dump(d_live, "held"))
    r4 = run4()
    with open(out4, encoding="utf-8") as f:
        kept = json.load(f)
    check("the builder exits 3, says why once, and leaves the committed file when a decided card would come back",
          r4.returncode == 3 and r4.stdout.count("::warning") == 1 and "would come back" in r4.stdout
          and kept["sources"]["assignments"]["read"] == "live" and DM not in {h["raw"] for h in kept["held"]},
          (r4.returncode, r4.stdout[-300:]))
    check("a live read's time alone is not a change worth writing",
          B._unstamped(d_live, "written_at") == B._unstamped(dict(d_live, sources=dict(d_live["sources"],
                                                     assignments=dict(d_live["sources"]["assignments"], at="2026-11-14T01:00:00Z"))), "written_at"))

    # The live read itself, in process: the --live gate, the tab's anon key, the read, and a short or failed read
    # falling back, said aloud.
    saved_rows, saved_env = B.live_rows, os.environ.get("SUPABASE_ANON_KEY")
    rows = [{"course_id": "_UNCLASSIFIED::" + DM, "field": "unified_title_assignment", "value": "Digital Media Basics"},
            {"course_id": "_UNCLASSIFIED::" + SAVED, "field": "unified_title_assignment", "value": "  "}]
    try:
        os.environ.pop("SUPABASE_ANON_KEY", None)
        check("the key is the anon key the tab ships (cpl_session.js), never the service key",
              json.loads(__import__("base64").urlsafe_b64decode(B.anon_key().split(".")[1] + "==")).get("role") == "anon")
        check("without --live, no read", B.live_assignments(False) == (None, None))
        seen = []
        B.live_rows = lambda key: (seen.append(key), rows)[1]
        got, at = B.live_assignments(True)
        check("with --live the builder reads the live set by the tab's rule (an empty value is a clear)",
              got == {DM: {"unified_title": "Digital Media Basics"}} and at and seen == [B.anon_key()], got)
        import io
        import contextlib

        def short(key):
            raise ValueError("short read")
        B.live_rows = short
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            fell = B.live_assignments(True)
        check("a read shorter than the exact count falls back to the overlay, said aloud", fell == (None, None)
              and "short read" in buf.getvalue(), buf.getvalue())

        def boom(key):
            raise RuntimeError("Bearer some-key-text refused")
        B.live_rows = boom
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            failed_read = B.live_assignments(True)
        check("a failed read falls back to the overlay and names the error's type, never its text", failed_read == (None, None)
              and "RuntimeError" in buf.getvalue() and "some-key-text" not in buf.getvalue(), buf.getvalue())
        B.live_rows = lambda key: rows
        write(root4, "kb/unclassified_assignments.json", FIX["kb/unclassified_assignments.json"])
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            rc = B.main(["--root", root4, "--quiet", "--live"])
        with open(out4, encoding="utf-8") as f:
            via_main = json.load(f)
        check("main() with --live builds from the live read and stamps it",
              rc == 0 and via_main["sources"]["assignments"]["read"] == "live"
              and DM not in {h["raw"] for h in via_main["held"]}, (rc, via_main["sources"].get("assignments")))

        # live_rows against a stub server: Range-paged, the exact count asked on the first page, a short read raises.
        import http.server
        import threading
        asked = []

        class Stub(http.server.BaseHTTPRequestHandler):
            def do_GET(self):  # noqa: N802
                asked.append((self.path, self.headers.get("Range"), self.headers.get("Prefer"), self.headers.get("apikey")))
                lo = int(self.headers.get("Range").split("-")[0])
                n = max(0, min(B.LIVE_PAGE, Stub.total - lo))
                body = json.dumps([{"course_id": "_UNCLASSIFIED::t%d" % (lo + i), "field": "unified_title_assignment",
                                    "value": "x"} for i in range(n)]).encode()
                self.send_response(206)
                self.send_header("Content-Range", "%d-%d/%d" % (lo, lo + n - 1, Stub.claimed))
                self.end_headers()
                self.wfile.write(body)

            def log_message(self, *a):
                pass
        srv = http.server.HTTPServer(("127.0.0.1", 0), Stub)
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        saved_url, B.LIVE_URL = B.LIVE_URL, "http://127.0.0.1:%d" % srv.server_port
        B.live_rows = saved_rows
        prox = {k: os.environ.pop(k) for k in list(os.environ) if k.lower() in ("http_proxy", "https_proxy", "all_proxy")}
        os.environ["NO_PROXY"] = os.environ["no_proxy"] = "127.0.0.1"
        try:
            Stub.total = Stub.claimed = 1500
            got_rows = B.live_rows("anon-test")
            check("live_rows reads every page, asks the exact count on the first, and reads by the given key",
                  len(got_rows) == 1500 and [a[1] for a in asked] == ["0-999", "1000-1999"] and asked[0][2] == "count=exact"
                  and asked[1][2] is None and asked[0][3] == "anon-test" and "field=eq.unified_title_assignment" in asked[0][0]
                  and "select=course_id,field,value&" in asked[0][0], asked)
            Stub.total, Stub.claimed = 900, 1000
            try:
                B.live_rows("anon-test")
                raised = ""
            except ValueError as e:
                raised = str(e)
            check("a read shorter than the exact count raises", raised == "short read", raised)
        finally:
            srv.shutdown()
            B.LIVE_URL = saved_url
            os.environ.update(prox)
    finally:
        B.live_rows = saved_rows
        if saved_env is None:
            os.environ.pop("SUPABASE_ANON_KEY", None)
        else:
            os.environ["SUPABASE_ANON_KEY"] = saved_env

# The daily's overlay was synced in the same run, so a failed live read there must not freeze the file: a clear Sam
# made since the committed file, synced into the overlay, puts the card back (#3260 round 2).
with tempfile.TemporaryDirectory() as root5:
    for rel, obj in FIX.items():
        write(root5, rel, obj)
    write(root5, "statewide_data.js", STATEWIDE, js="CPL_STATEWIDE")
    write(root5, "unified_courses_members.js", MEMBERS, js="CPL_UNIFIED_MEMBERS")
    write(root5, "statewide_prescriptive.js", PRESCRIPTIVE, js="CPL_STATEWIDE_PRESCRIPTIVE")
    prior5 = B.build(root5, ({DM: {"unified_title": "Digital Media Basics"}}, "2026-11-13T21:00:00Z"))[0]
    out5 = os.path.join(root5, "kb", "exhibits_review.json")
    write(root5, "kb/unclassified_assignments.json", {"_synced_at": "2026-11-12T08:00:00Z", "assignments": {}})

    def run5(*extra):
        with open(out5, "w", encoding="utf-8") as f:
            f.write(B.dump(prior5, "held"))
        r = subprocess.run([sys.executable, os.path.join(ROOT, "kb", "_build_exhibits_review.py"), "--root", root5] + list(extra),
                           capture_output=True, text=True, timeout=120, env=ENV)
        with open(out5, encoding="utf-8") as f:
            return r, json.load(f)
    r_guard, kept5 = run5()
    check("a local build on that overlay is still refused", r_guard.returncode == 3 and DM not in {h["raw"] for h in kept5["held"]},
          r_guard.returncode)
    r_fresh, wrote5 = run5("--overlay-fresh")
    check("with --overlay-fresh the build writes, and the cleared title is a card again",
          r_fresh.returncode == 0 and DM in {h["raw"] for h in wrote5["held"]}
          and wrote5["sources"]["assignments"]["read"] == "overlay", (r_fresh.returncode, r_fresh.stdout[-300:]))

# The anon key is read whatever quote style or declaration the script uses.
check("the anon key parses from var, let or const, in double, single or back quotes",
      B.anon_key_in('var SUPABASE_ANON = "a.b.c";') == "a.b.c" and B.anon_key_in("const SUPABASE_ANON='a.b.c'") == "a.b.c"
      and B.anon_key_in("  let SUPABASE_ANON =\n `a.b.c`;") == "a.b.c")
try:
    B.anon_key_in("var SUPABASE_URL = 'x';")
    no_key = ""
except ValueError as e:
    no_key = str(e)
check("a script with no anon key raises, so the build falls back to the overlay", no_key == "no anon key in cpl_session.js")

# Both runs that rebuild the Review file read live with --live, take no secret for it, and read exit 3 as the
# builder's own refusal.
with open(os.path.join(ROOT, ".github", "workflows", "cer-procedures.yml"), encoding="utf-8") as f:
    wf = yaml.safe_load(f)
step = [s for j in wf["jobs"].values() for s in j.get("steps") or [] if s.get("name") == "Build the Exhibits review queue"]
check("cer-procedures.yml's Review step reads live with no secret, and reads exit 3 as a refusal",
      len(step) == 1 and not step[0].get("env") and "--live" in step[0]["run"] and '[ "$rc" != 3 ]' in step[0]["run"], step)
with open(os.path.join(ROOT, "scripts", "daily_build.sh"), encoding="utf-8") as f:
    daily = f.read()
check("daily_build.sh's Review step reads live with no secret, and reads exit 3 as a refusal",
      'step "Build the Exhibits review queue" <<\'STEP\'' in daily
      and 'rc=0; python3 kb/_build_exhibits_review.py --live --overlay-fresh --quiet || rc=$?' in daily and '[ "$rc" != 3 ]' in daily)
check("only the daily, whose step 3 synced the overlay, turns the stale guard off; cer-procedures.yml keeps it",
      "--overlay-fresh" not in step[0]["run"])

failed = [n for n, ok in results if not ok]
print("\n%d/%d checks passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
