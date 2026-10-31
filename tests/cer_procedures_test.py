#!/usr/bin/env python3
"""Guards kb/_cer_procedures.py, the CER's nightly procedures run.

Sam, 2026-10-18: "I want to be able to add more procedures to have you classify and complete
common exhibit titles and elements as we go." These checks pin what keeps the run honest: every
procedure carries its words and date; a lane written for July's queue never settles a title, it
only hints; the quality gate holds a title left with a dangling word, a method word or a course
code; two procedures that disagree are held; the identity lookup refuses another college's
course; a house family is kept as written while a new title is styled by Rule 5g; a failed
classifier call is retried once; and a dry run writes nothing.

Saving (Sam, Open Asks Sheet 94 card 2, 2026-10-18): a pre-fill a reason holds never saves; a
title and its issuer save as two rows under the cohort of the procedure that decided it; a live
row for the raw, whoever wrote it, holds the save; the receipt exists before the INSERT; the
INSERT ignores duplicates; the live read is Range-paginated; --undo deletes by one procedure's
cohort and nothing else; a preview writes no row and no receipt; and the fold's held assignments
join the Needs-you list.

No network: the classifier is a stand-in. Run from repo root:
    python3 tests/cer_procedures_test.py
"""
import glob
import io
import json
import os
import shutil
import sys
import tempfile
from contextlib import redirect_stdout

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _cer_procedures as cp  # noqa: E402

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


# ── the procedures file ──────────────────────────────────────────────────────
KNOWN_LANES = {"family", "ap", "statewide", "nccer", "cslb", "journeyman", "carpenters", "ironworker",
               "single", "identity", "school"}
procs = cp.load_procedures()
check("every procedure in force names who, when and their words",
      all(p["source"]["who"] and p["source"]["date"] and p["source"]["words"] for p in procs))
check("every rule procedure's lanes are lanes the run knows",
      all(set(p["lanes"]) <= KNOWN_LANES for p in procs if p["kind"] == "rule"),
      [p["lanes"] for p in procs if p["kind"] == "rule"])
check("no hint lane is owned by a rule procedure",
      not (set(cp.lane_owners(procs)) & cp.HINT_LANES))

check("an official AP exam name stands as written (it may end in a letter: Computer Science A)",
      cp.residue("AP Computer Science A", "College Board", "ap") == [] and cp.residue("Welding A", "", "") != [])

with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
    json.dump({"procedures": [{"id": "x", "name": "X", "kind": "rule", "on": True, "rule": "r",
                               "lanes": ["family"], "source": {"who": "Sam", "date": "2026-10-18"}}]}, f)
try:
    cp.load_procedures(f.name)
    check("a procedure with no words is refused", False)
except ValueError:
    check("a procedure with no words is refused", True)
os.unlink(f.name)

a = cp.procedures_hash(procs)
b = cp.procedures_hash(procs + [dict(procs[-1], id="new-one", rule="something new")])
check("adding a procedure changes the hash the classifier's answers are keyed to", a != b)

# ── the quality gate ─────────────────────────────────────────────────────────
CCC = cp.ISSUER_CCC
check("'for MUS 27' is held", cp.residue("for MUS 27", CCC, "cx"))
check("a left-in method word and code is held",
      cp.residue("Suspension and Four Wheel Alignment - Credit by Exam (ATEC 16 )", CCC, "cx"))
check("a high school district code is held", cp.residue("History of Video Games HS-CNUSD", CCC, "hs"))
check("a dangling 'and' is held", cp.residue("Beginning Guitar- Credit by Exam and", CCC, "cx"))
check("shouting capitals are held for a CCC title", cp.residue("ADVANCED MEDICAL NURSING", CCC, "hs"))
check("a clean course title passes", cp.residue("Pipe Welding", CCC, "cx") == [])
check("an NCCER level keeps its number", cp.residue("NCCER HVACR Level 3", "NCCER", "nccer") == [])
check("a CSLB code stands with its issuer",
      cp.residue("C-20 Warm-Air Heating, Ventilating and Air-Conditioning Contractor",
                 "Contractors State License Board (CSLB)", "cslb") == [])
check("an AP family title passes", cp.residue("AP Physics 1: Algebra-Based", "College Board", "family") == [])

# ── the rule procedures ──────────────────────────────────────────────────────
owners = cp.lane_owners(procs)
sug = {
    "HIST 035: History of African Americans in the United States":
        [{"kind": "cid", "id": "HIST 180", "title": "Western Civilization II", "code": "HIST 35"}],
    "CRIM-11 Introduction to Corrections":
        [{"kind": "cid", "id": "AJ 200", "title": "Introduction to Corrections", "code": "CRIM 11"}],
    "AGMA-06 SMALL ENGINE REPAIR AND MAINTENANCE":
        [{"kind": "course", "title": "SMALL ENGINE REPAIR AND MAINTENANCE", "code": "AGMA 6"}],
    "Accounting 1- HS CE(MVUSD)": [{"kind": "course", "title": "Accounting 1", "code": "ACCT 1"}],
    "AR-1728-0188 U.S. Army Civilian Police Academy":
        [{"kind": "course", "title": "Basic Military Police", "code": "AR 1728"}],
    "ART 009: Beginning Printmaking": [{"kind": "course", "title": "Beginning Printmaking", "code": "ART 9"}],
}
lanes = {
    "Portfolio for MUS 27": {"title": "for MUS 27", "issuer": CCC, "via": "cx", "confidence": 0.75},
    "EMT-405 Kaiser High School": {"title": "Kaiser High School", "issuer": CCC, "via": "cx", "confidence": 0.7},
    "AP Statistics Exam": {"title": "AP Statistics", "issuer": "College Board", "via": "family", "confidence": 0.8},
    "AR-1728-0188 U.S. Army Civilian Police Academy":
        {"title": "0167 Basic Military Police", "issuer": CCC, "via": "hs", "confidence": 0.65},
    "CRIM-11 Introduction to Corrections":
        {"title": "Corrections", "issuer": "College Board", "via": "family", "confidence": 0.8},
}
waiting = sorted(set(sug) | set(lanes))
settled, hints, held = cp.settle(waiting, lanes, sug, owners)
check("a hint lane never settles a title, even one the gate passes",
      "EMT-405 Kaiser High School" not in settled and "Portfolio for MUS 27" not in settled)
check("a hint lane's proposal reaches the classifier as a hint",
      any(h["title"] == "Kaiser High School" for h in hints.get("EMT-405 Kaiser High School", [])))
check("a brand family settles under its procedure",
      settled.get("AP Statistics Exam", {}).get("procedure") == "brand-family")
check("the identity lookup refuses another college's course",
      "HIST 035: History of African Americans in the United States" not in settled)
check("a title naming a school goes to the classifier (Rule 5f)", "Accounting 1- HS CE(MVUSD)" not in settled)
check("a military course number is never read as a high school code",
      not any(h.get("via") == "hs" for h in hints.get("AR-1728-0188 U.S. Army Civilian Police Academy", [])))
check("an identity title in shouting capitals is title-cased",
      settled.get("AGMA-06 SMALL ENGINE REPAIR AND MAINTENANCE", {}).get("title") == "Small Engine Repair and Maintenance")
check("an identity title takes Rule 5g's level order",
      settled.get("ART 009: Beginning Printmaking", {}).get("title") == "Printmaking Beginning",
      settled.get("ART 009: Beginning Printmaking"))
check("two procedures that disagree are held, not settled",
      "CRIM-11 Introduction to Corrections" in held
      and "CRIM-11 Introduction to Corrections" not in settled
      and held["CRIM-11 Introduction to Corrections"]["why"] == "two procedures disagree")

conf = cp.issuer_conflicts({"x": {"title": "AP Statistics", "issuer": "Somebody Else"}},
                           {"AP Statistics": {"College Board"}})
check("a proposal that would join two issuers is held", "x" in conf)

# ── the classifier ───────────────────────────────────────────────────────────
rec = {"raw_title": "r", "unified_title": "Advanced Floral Design", "issuing_agency": CCC,
       "training_agency": None, "confidence_title": 0.9, "confidence_issuer": 0.7,
       "confidence_trainer": 0.0, "procedures": ["level-words-last"], "_notes": "n"}
p = cp.as_proposal(rec, {})
check("a classifier proposal's confidence is the lower of title and issuer", p["confidence"] == 0.7)
check("a new classifier title takes Rule 5g's level order", p["title"] == "Floral Design Advanced")
p2 = cp.as_proposal(dict(rec, unified_title="Advanced Placement Biology"), {})
check("Advanced Placement keeps its name", p2["title"] == "Advanced Placement Biology")
p3 = cp.as_proposal(dict(rec, unified_title="Advanced Welding"), {"Advanced Welding": set()})
check("a house family is kept as written", p3["title"] == "Advanced Welding")

calls = []


def fake(body, key):
    calls.append(len(body["rows"]))
    if len(calls) == 1:
        return {"error": "HTTP 401: unauthorized"}
    return {"model": "m", "usage": {"input_tokens": 10, "output_tokens": 10},
            "records": [dict(rec, raw_title=r["raw_title"]) for r in body["rows"]]
            + [dict(rec, raw_title="never asked")]}


cp.time.sleep = lambda s: None
rows = [{"raw_title": "t%d" % i} for i in range(20)]
got, log = cp.classify(rows, "rules", "key", chunk=15, workers=1, call=fake)
check("the classifier is asked in chunks", calls[1:] == [15, 5], calls)
check("a failed call is retried once", calls[0] == 15 and len(calls) == 3)
check("every asked title is answered after the retry", len(got) == 20)
check("an answer for a title nobody asked about is dropped", "never asked" not in got)


def nbsp_back(body, key):
    # The model returns "ATEC 24\xa0)" as "ATEC 24 )" (105 titles on the first pass).
    return {"records": [dict(rec, raw_title=" ".join(r["raw_title"].replace("\xa0", " ").split()))
                        for r in body["rows"]]}


nb = "Advanced Engine Performance - Credit by Exam (ATEC 24\xa0)"
got2, _ = cp.classify([{"raw_title": nb}], "rules", "key", chunk=15, workers=1, call=nbsp_back)
check("an answer whose spacing the model normalized is kept, keyed by the title as asked",
      list(got2) == [nb] and got2[nb]["raw_title"] == nb, got2)

# ── the college's own course, for a code-only title ─────────────────────────
check("a trailing course code is read", cp.code_only("Discipline Exam - CS 119") == ("CS", "119"))
check("'Examination for' is not part of the subject",
      cp.code_only("Examination for JAMS 12") == ("JAMS", "12"))
check("a two-word subject is read", cp.code_only("Discipline Exam - ADM JUS 104") == ("ADM JUS", "104"))
check("a College of the Canyons noncredit code is read",
      cp.code_only("NC.BUS-117A at College of the Canyons") == ("BUS", "117A"))
check("an exam brand's target course is never its identity",
      cp.code_only("AP Calculus AB - MATH 110A") is None and cp.code_only("AP Chemistry (CHEM 1A)") is None)
check("a score is never a course code", cp.code_only("Agile Score of 3") is None)
check("a title that describes its course needs no lookup",
      cp.code_only("Pediatric Nursing - Credit by Exam (NURS 234)") is None)
from collections import Counter  # noqa: E402
fake = {("ELACCOLLEGE", "CS", "119"): {"titles": Counter({"PROGRAMMING IN PYTHON": 3})},
        ("TWOCOLLEGEA", "MUS", "10"): {"titles": Counter({"Music Theory": 1})},
        ("TWOCOLLEGEB", "MUS", "10"): {"titles": Counter({"Guitar I": 1})}}
ch = cp.catalog_hints(["Discipline Exam - CS 119", "Examination for MUS 10", "Portfolio for ART 9"],
                      {"Discipline Exam - CS 119": {"colleges": ["ELAC College"]},
                       "Examination for MUS 10": {"colleges": ["Two College A", "Two College B"]},
                       "Portfolio for ART 9": {"colleges": ["Nowhere"]}}, index=fake)
check("the college's own title is handed on, title-cased",
      ch.get("Discipline Exam - CS 119", {}).get("title") == "Programming in Python"
      and ch["Discipline Exam - CS 119"]["via"] == "catalog")
check("two colleges naming the course differently give no hint", "Examination for MUS 10" not in ch)
check("a code the catalog does not hold gives no hint", "Portfolio for ART 9" not in ch)
check("a changed hint changes the key a title was asked under",
      cp.hints_key([{"title": "a", "via": "cx"}]) != cp.hints_key([{"title": "a", "via": "cx"}, ch["Discipline Exam - CS 119"]]))

# ── the high school and ROP rule (Sam, Open Asks Sheet 147 card 2, 2026-10-31) ─
AL = {"3D Digital Modeling HS-CNUSD": {"kind": "mid", "id": "MULT M1019", "title": "3D Digital Modeling",
                                       "code": "GAM 6A", "college": "Norco College"},
      "Residential Construction 2 High School Articulation": {"kind": "mid", "id": "CNST M1130",
                                       "title": "Residential Construction Skills 2", "code": "CEM 178B",
                                       "college": "Cabrillo College"},
      "AP Computer Science A HS-LEUSD": {"kind": "cid", "id": "COMP 122", "title": "Java Programming",
                                         "code": "CS 5", "college": "Norco College"},
      "Welding Basics Training Center": {"kind": "course", "id": "WELD M10LB", "title": "Welding Basics",
                                         "code": "WELD 1", "college": "Norco College"},
      "Business Law HS-CNUSD": {"kind": "cid", "id": "BUS 125", "title": "Business Law", "code": "BUS 18A",
                                "college": "Norco College", "ambiguous": ["BUS 125", "BUS 126"]}}
sp = cp.school_proposal("3D Digital Modeling HS-CNUSD", AL,
                        {"issuing_agency": "Corona-Norco Unified School District (CNUSD)"})
check("a high school title takes its aligned course's name, and the district issues it",
      sp and sp["title"] == "3D Digital Modeling" and sp["issuer"] == "Corona-Norco Unified School District"
      and sp["via"] == "school", sp)
check("an unnamed high school stays Local High School, as the classifier read it",
      (cp.school_proposal("Residential Construction 2 High School Articulation", AL,
                          {"issuing_agency": "Local High School"}) or {}).get("issuer") == "Local High School")
check("an AP exam keeps its own name", cp.school_proposal(
    "AP Computer Science A HS-LEUSD", AL, {"issuing_agency": "College Board"}) is None)
check("a training center stays with the classifier", cp.school_proposal(
    "Welding Basics Training Center", AL, {"issuing_agency": "Some Training Center"}) is None)
check("two aligned courses in the best tier hold the title", cp.school_proposal(
    "Business Law HS-CNUSD", AL, {"issuing_agency": "Corona-Norco Unified School District"}) is None)
check("no issuer named holds the title", cp.school_proposal(
    "3D Digital Modeling HS-CNUSD", AL, {"issuing_agency": ""}) is None)
check("a title with no aligned course holds", cp.school_proposal(
    "Floral Design HS-CNUSD", AL, {"issuing_agency": "Corona-Norco Unified School District"}) is None)

# ── the aligned course (kb/_suggest_unclassified.py; Sam, 2026-10-30) ────────
import _suggest_unclassified as su  # noqa: E402
check("a leading zero folds, so MAP's ADJUS 023 meets COCI's ADJUS 23",
      su.split_code("ADJUS 023") == su.split_code("ADJUS 23") == ("ADJUS", "23"))
check("a two-word subject and a lettered number split", su.split_code("ADM JUS 8") == ("ADMJUS", "8")
      and su.split_code("CEM 178A") == ("CEM", "178A"))
sw = {"exhibits": [{"raw_titles": ["Intro to Digital Photography High School Articulation", "AP Biology HS-X"],
                    "adopter_names": ["Cabrillo College"],
                    "credit_recs": [{"course": "AP 6"}, {"course": "BIO 1"}]},
                   {"raw_titles": ["Anatomy/Physiology HS-AUSD"], "adopter_names": ["Norco College"],
                    "credit_recs": [{"course": "BUS 50"}]}]}
arts = su.articulated(["Intro to Digital Photography High School Articulation", "AP Biology HS-X",
                       "Anatomy/Physiology HS-AUSD"], sw)
idx = {("CABRILLOCOLLEGE", "AP", "6"): {("ARTS M1351", "Intro to Digital Photography")},
       ("CABRILLOCOLLEGE", "BIO", "1"): {("BIOL 135", "General Biology")},
       ("NORCOCOLLEGE", "BUS", "50"): {("BUSI M1284", "Entrepreneurship")}}
got = su.aligned_courses(arts, idx, {}, {"BIOL 135": "General Biology"},
                         {"ARTS M1351": "Introduction to Digital Photography", "BUSI M1284": "Entrepreneurship"})
check("the exhibit's credit recommendation names the aligned course, by its M-ID title",
      got.get("Intro to Digital Photography High School Articulation", {}).get("title")
      == "Introduction to Digital Photography", got)
check("an exam brand never takes an aligned course", "AP Biology HS-X" not in got)
check("a course that shares no word with the title is no alignment", "Anatomy/Physiology HS-AUSD" not in got)

# ── the whole run, against the committed queue ───────────────────────────────
wrote = []
real_open = open


def guarded_open(path, mode="r", *a, **k):
    if any(ch in mode for ch in "wa"):
        wrote.append(path)
    return real_open(path, mode, *a, **k)


cp.open = guarded_open
with redirect_stdout(io.StringIO()):
    report, stage = cp.run(dry_run=True, catalog=False)
check("a dry run writes nothing", wrote == [], wrote)
# Every waiting title in the committed queue is proposed, held for a person, or not yet asked (an unsure
# proposal is both pre-filled and held, so the three can add to more). The count itself is the data's:
# Sam's saves of 2026-10-31 folded the queue from 468 to 1, and a check on "more than none" failed on main.
check("the run accounts for every waiting title in the committed queue",
      report["waiting"] <= report["proposed"] + report["needs_you_count"] + report["not_yet_asked"]
      and report["queue"] >= report["waiting"], report)
check("no pre-fill comes from a hint lane",
      not any((v.get("procedure") or "").startswith("lane-") or v.get("via") in cp.HINT_LANES
              for v in stage["staged"].values()))
check("no pre-fill carries residue",
      not [r for r, v in stage["staged"].items() if cp.residue(v["title"], v.get("issuer", ""), v.get("via", ""))])
check("a title the high school rule settles is counted under the rule, never the classifier",
      all(v.get("procedure") == "high-school-rop" for r, v in stage["staged"].items() if v.get("via") == "school")
      and next(p for p in report["procedures"] if p["id"] == "classifier")["settled"]
      == sum(1 for r, v in stage["staged"].items() if v.get("procedure") == "classifier"
             and r not in {n["raw_title"] for n in report["needs_you"]}))
check("the report tallies every procedure in force",
      {p["id"] for p in procs} <= {p["id"] for p in report["procedures"]})
try:
    with redirect_stdout(io.StringIO()):
        cp.run(classify_n=5, dry_run=True, key=None, catalog=False)
    check("asking the classifier without the service key stops the run", False)
except SystemExit:
    check("asking the classifier without the service key stops the run", True)
cp.open = real_open

# ── saving under a procedure (Sheet 94 card 2) ───────────────────────────────
check("a procedure's cohort names it",
      cp.cohort_of("brand-family") == "cer-procedure-brand-family@bot"
      and cp.cohort_of("classifier") == "cer-procedure-classifier@bot"
      and cp.cohort_of(None) == "cer-procedure-classifier@bot")
U = cp.UNCLASS
stage_t = {"staged": {
    "AP Statistics Exam": {"title": "AP Statistics", "issuer": "College Board", "procedure": "brand-family",
                           "confidence": 0.8},
    "Pipe Welding-Credit by Exam": {"title": "Pipe Welding", "issuer": CCC, "procedure": "classifier",
                                    "confidence": 0.9},
    "Phlebotomy Tech I": {"title": "Phlebotomy Technician I", "issuer": "", "procedure": "classifier",
                          "confidence": 0.62},
    "No Issuer Named": {"title": "Forklift Operator", "issuer": "", "procedure": "classifier", "confidence": 0.9},
    "Saved Already": {"title": "Something", "issuer": "X", "procedure": "classifier", "confidence": 0.95},
}}
report_t = {"procedures_hash": "abc",
            "needs_you": [{"raw_title": "Phlebotomy Tech I", "why": "the classifier is unsure (0.62)"}]}
rows = cp.sure_rows(stage_t, report_t)
check("a pre-fill a reason holds never saves", not any(r["course_id"] == U + "Phlebotomy Tech I" for r in rows))
ap_rows = [r for r in rows if r["course_id"] == U + "AP Statistics Exam"]
check("a title and its issuer save as two rows under the procedure's cohort",
      sorted(r["field"] for r in ap_rows) == [cp.FIELD_ISSUER, cp.FIELD_TITLE]
      and all(r["reviewer_email"] == "cer-procedure-brand-family@bot" for r in ap_rows))
check("a proposal with no issuer saves its title alone",
      [r["field"] for r in rows if r["course_id"] == U + "No Issuer Named"] == [cp.FIELD_TITLE])


class FakeCuration:
    def __init__(self, live):
        self.live = live
        self.inserted = []
        self.deleted = []
        self.receipt_before_insert = None

    def saved(self):
        return dict(self.live)

    def insert(self, rows):
        self.receipt_before_insert = bool(glob.glob(os.path.join(cp.SAVED_DIR, "saved_*.json")))
        self.inserted.extend(rows)
        return [dict(r) for r in rows]

    def undo(self, cohort):
        self.deleted.append(cohort)
        return [{"course_id": U + "x", "field": cp.FIELD_TITLE, "value": "v", "reviewer_email": cohort}]


saved_dir_real = cp.SAVED_DIR
tmpd = tempfile.mkdtemp(prefix="cer-save-")
cp.SAVED_DIR = tmpd
fake = FakeCuration({"Saved Already": {"course_id": U + "Saved Already", "field": cp.FIELD_TITLE,
                                       "value": "The Curator's Title", "reviewer_email": "map@rccd.edu"}})
with redirect_stdout(io.StringIO()):
    summ = cp.save_sure(stage_t, report_t, fake, run_id="1", preview=True)
check("a preview writes no row and no receipt",
      not fake.inserted and not os.listdir(tmpd) and summ["to_save"] == 3 and summ["held_live"] == 1, summ)
with redirect_stdout(io.StringIO()):
    summ = cp.save_sure(stage_t, report_t, fake, run_id="1")
check("a live row holds the raw, whoever wrote it",
      not any(r["course_id"] == U + "Saved Already" for r in fake.inserted) and summ["held_live"] == 1)
check("the receipt exists before the insert", fake.receipt_before_insert is True)
check("the save writes the sure rows and nothing else", len(fake.inserted) == 5
      and {r["course_id"] for r in fake.inserted}
      == {U + "AP Statistics Exam", U + "Pipe Welding-Credit by Exam", U + "No Issuer Named"})
rec = json.load(open(summ["receipt"], encoding="utf-8"))
check("the receipt names the ruling, every row, its cohort and the live hold",
      rec["ruling"].startswith("Open Asks Sheet 94 card 2") and len(rec["rows"]) == 5
      and rec["result"] == "written" and len(rec["inserted"]) == 5
      and rec["cohorts"] == ["cer-procedure-brand-family@bot", "cer-procedure-classifier@bot"]
      and rec["held_live"][0]["by"] == "map@rccd.edu")
with redirect_stdout(io.StringIO()):
    u = cp.undo_procedure("brand-family", fake)
check("undo deletes by the procedure's cohort and nothing else", fake.deleted == ["cer-procedure-brand-family@bot"])
check("undo leaves a receipt naming what it removed",
      os.path.basename(u["receipt"]).startswith("undo_")
      and json.load(open(u["receipt"], encoding="utf-8"))["removed"][0]["reviewer_email"] == "cer-procedure-brand-family@bot")
shutil.rmtree(tmpd)
cp.SAVED_DIR = saved_dir_real

sent = []


def transport(req, timeout):
    sent.append(req)
    return []


cur = cp.Curation("k", transport=transport, sleep=lambda s: None)
cur.saved()
cur.insert([{"course_id": U + "a", "field": cp.FIELD_TITLE, "value": "A", "reviewer_email": "c@bot"}])
cur.undo("cer-procedure-x@bot")
check("the live read is Range-paginated and scoped to the unclassified title rows",
      sent[0].get_header("Range") == "0-999" and sent[0].get_header("Range-unit") == "items"
      and "_UNCLASSIFIED" in sent[0].full_url and "unified_title_assignment" in sent[0].full_url)
check("the insert ignores duplicates on (course_id, field)",
      "ignore-duplicates" in sent[1].get_header("Prefer") and "on_conflict=course_id" in sent[1].full_url)
check("the undo deletes by cohort within the unclassified namespace",
      sent[2].get_method() == "DELETE" and "reviewer_email=eq.cer-procedure-x%40bot" in sent[2].full_url
      and "_UNCLASSIFIED" in sent[2].full_url)


class Flaky:
    def __init__(self):
        self.n = 0

    def __call__(self, req, timeout):
        self.n += 1
        if self.n == 1:
            raise cp.urllib.error.HTTPError(req.full_url, 503, "busy", {}, None)
        return []


fl = Flaky()
cp.Curation("k", transport=fl, sleep=lambda s: None).saved()
check("a transient error is retried", fl.n == 2)

try:
    with redirect_stdout(io.StringIO()):
        cp.run(dry_run=False, key=None, catalog=False, save="on")
    check("saving without the service key stops the run", False)
except SystemExit:
    check("saving without the service key stops the run", True)
except Exception as exc:  # the run must stop at the key check, before any write
    check("saving without the service key stops the run", False, repr(exc))

# ── the fold's holds ─────────────────────────────────────────────────────────
tmpf = tempfile.mkdtemp(prefix="fold-held-")
os.makedirs(os.path.join(tmpf, "2026-10-17"))
os.makedirs(os.path.join(tmpf, "2026-10-18"))
json.dump({"conflict": [{"raw": "Old Style", "assigned": "A", "why": "old"}]},
          open(os.path.join(tmpf, "2026-10-17", "report.json"), "w"))
json.dump({"held": [{"raw": "ADJU 232", "assigned": "Juvenile Justice Procedures", "issuer": "",
                     "reviewed_by": "map@rccd.edu", "kind": "conflict",
                     "why": "human-reviewed classification stands: 'ADJU 232' -> 'Juvenile Law and Procedures'"}]},
          open(os.path.join(tmpf, "2026-10-18", "report.json"), "w"))
fh = cp.fold_held(tmpf)
check("the newest fold report's held assignments become Needs-you entries",
      len(fh) == 1 and fh[0]["raw_title"] == "ADJU 232" and fh[0]["why"].startswith("the fold held the saved assignment")
      and fh[0]["proposal"]["title"] == "Juvenile Justice Procedures" and "map" in fh[0]["proposal"]["procedure"], fh)
os.remove(os.path.join(tmpf, "2026-10-18", "report.json"))
check("a report from before the per-item hold is read by its conflict list",
      [h["raw_title"] for h in cp.fold_held(tmpf)] == ["Old Style"])
shutil.rmtree(tmpf)
check("no fold directory means nothing held", cp.fold_held(os.path.join(tmpf, "none")) == [])

# ── a rule built for the Exhibits tab waits for Turn on (Sheet 149 card 2) ─────
store = json.load(open(cp.PROCEDURES, encoding="utf-8"))
tmps = tempfile.mkdtemp(prefix="cer-store-")
off_path = os.path.join(tmps, "cer_procedures.json")
built = {"id": "test-built", "name": "A built rule", "kind": "rule", "on": False,
         "rule": "A test rule the routine built.", "lanes": ["nccer"],
         "request": cp.REQUEST_PREFIX + "2026-10-31T19:00:00Z-ab12",
         "source": {"who": "Sam", "date": "2026-10-31", "words": "a test"}}
store_off = dict(store, procedures=[dict(p, on=False) if p["id"] == "nccer-verbatim" else p
                                    for p in store["procedures"]] + [built])
json.dump(store_off, open(off_path, "w"))
check("an off procedure is not in force", "test-built" not in {p["id"] for p in cp.load_procedures(off_path)})
check("include turns one off procedure on for a dry run",
      "test-built" in {p["id"] for p in cp.load_procedures(off_path, include=("test-built",))})
check("a lane only off procedures name goes quiet; one an on procedure names stays",
      cp.off_lanes(off_path) == {"nccer"} and cp.off_lanes(off_path, include=("test-built",)) == set())
check("the store today quiets no lane", cp.off_lanes() == set(), cp.off_lanes())
try:
    cp.load_procedures(off_path, include=("no-such-rule",))
    check("include names an unknown procedure: the run stops", False)
except ValueError:
    check("include names an unknown procedure: the run stops", True)
bad = dict(store, procedures=store["procedures"] + [dict(built, request="not-a-request-row")])
json.dump(bad, open(off_path, "w"))
try:
    cp.read_procedures(off_path)
    check("a request that is not a request row stops the run", False)
except ValueError:
    check("a request that is not a request row stops the run", True)
shutil.rmtree(tmps)
try:
    cp.run(include=("brand-family",))
    check("an off procedure runs only in a dry run", False)
except SystemExit:
    check("an off procedure runs only in a dry run", True)

# The dry run the routine writes back: one procedure against tonight's run without it.
tr = cp.try_procedure("brand-family")
check("--try reads a rule over the queue and the reference",
      tr["kind"] == "rule" and set(tr["queue"]) >= {"waiting", "settled", "held", "changed", "examples"}
      and tr["reference"]["read"] >= tr["reference"]["differ"] >= 0
      and all(len(e) == 3 for e in tr["reference"]["examples"]), tr)
tg = cp.try_procedure("ase-paren")
check("--try counts a guidance procedure's re-asks and reads no reference",
      tg["kind"] == "guidance" and "reference" not in tg and isinstance(tg["reasks"], int), tg)
try:
    cp.try_procedure("no-such-rule")
    check("--try on an unknown procedure stops", False)
except ValueError:
    check("--try on an unknown procedure stops", True)

# Step 7 of the scheduled sessions page tells the CPL queue routine how to work a request.
sched = open(os.path.join(os.path.dirname(cp.HERE), "docs", "reference", "scheduled_sessions.md"), encoding="utf-8").read()
check("the scheduled sessions page tells the routine how to work a request (step 7)",
      "Rules sent from the Exhibits tab" in sched and "_CER\\_PROCEDURE\\_REQUEST::" in sched and "--try" in sched
      and "cer_procedure_built" in sched and "cer_procedure_switch" in sched and "never set `on` without a switch row" in sched)

failed = [r for r in results if not r[1]]
for name, ok, why in results:
    print(("PASS " if ok else "FAIL ") + name + ("" if ok else "  " + repr(why)[:300]))
print("%d checks, %d failed" % (len(results), len(failed)))
sys.exit(1 if failed else 0)
