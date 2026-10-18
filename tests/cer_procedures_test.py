#!/usr/bin/env python3
"""Guards kb/_cer_procedures.py, the CER's nightly procedures run.

Sam, 2026-10-18: "I want to be able to add more procedures to have you classify and complete
common exhibit titles and elements as we go." These checks pin what keeps the run honest: every
procedure carries its words and date; a lane written for July's queue never settles a title, it
only hints; the quality gate holds a title left with a dangling word, a method word or a course
code; two procedures that disagree are held; the identity lookup refuses another college's
course; a house family is kept as written while a new title is styled by Rule 5g; a failed
classifier call is retried once; and nothing is ever written outside the run's three files.

No network: the classifier is a stand-in. Run from repo root:
    python3 tests/cer_procedures_test.py
"""
import io
import json
import os
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
KNOWN_LANES = {"family", "statewide", "nccer", "cslb", "journeyman", "carpenters", "ironworker",
               "single", "identity"}
procs = cp.load_procedures()
check("every procedure in force names who, when and their words",
      all(p["source"]["who"] and p["source"]["date"] and p["source"]["words"] for p in procs))
check("every rule procedure's lanes are lanes the run knows",
      all(set(p["lanes"]) <= KNOWN_LANES for p in procs if p["kind"] == "rule"),
      [p["lanes"] for p in procs if p["kind"] == "rule"])
check("no hint lane is owned by a rule procedure",
      not (set(cp.lane_owners(procs)) & cp.HINT_LANES))

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

# ── the whole run, against the committed queue ───────────────────────────────
wrote = []
real_open = open


def guarded_open(path, mode="r", *a, **k):
    if any(ch in mode for ch in "wa"):
        wrote.append(path)
    return real_open(path, mode, *a, **k)


cp.open = guarded_open
with redirect_stdout(io.StringIO()):
    report, stage = cp.run(dry_run=True)
check("a dry run writes nothing", wrote == [], wrote)
check("the run proposes titles from the committed queue", stage["_counts"]["staged"] > 0)
check("no pre-fill comes from a hint lane",
      not any((v.get("procedure") or "").startswith("lane-") or v.get("via") in cp.HINT_LANES
              for v in stage["staged"].values()))
check("no pre-fill carries residue",
      not [r for r, v in stage["staged"].items() if cp.residue(v["title"], v.get("issuer", ""), v.get("via", ""))])
check("the report tallies every procedure in force",
      {p["id"] for p in procs} <= {p["id"] for p in report["procedures"]})
try:
    with redirect_stdout(io.StringIO()):
        cp.run(classify_n=5, dry_run=True, key=None)
    check("asking the classifier without the service key stops the run", False)
except SystemExit:
    check("asking the classifier without the service key stops the run", True)
cp.open = real_open

failed = [r for r in results if not r[1]]
for name, ok, why in results:
    print(("PASS " if ok else "FAIL ") + name + ("" if ok else "  " + repr(why)[:300]))
print("%d checks, %d failed" % (len(results), len(failed)))
sys.exit(1 if failed else 0)
