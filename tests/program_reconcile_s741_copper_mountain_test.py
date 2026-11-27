#!/usr/bin/env python3
"""S741 (lane 1, keys): Copper Mountain's reconcile step, the degree's printed floor, on the page's own words.

WHY. Plan s740r4 held History A.A. 43854 and Fire Technology A.S. 14751. Each major adds to its printed total under
today's scorer, and each fails on the degree alone: 24 and Cal-GETC's 34-43 read 58-67 against 60, and 42-48 with the
college's 21 read 63-69 against 60. The catalog words each degree's units as a floor (college page read 45953233659,
kb/college_reads/s741_keys_copper_mountain_pages.json, PDF pp.57 to 119 printed line for line):

    MINIMUM TRANSFERABLE UNITS .................................................................60      (43854, p.105)
    MINIMUM DEGREE UNITS .................................................................................60      (14751, p.99)

and prints on each program page that 'General education units, transferable electives, and total degree units will
vary for each student'. The college's entry (kb/program_requirements_reconcile.json, "Copper Mountain College")
carries one set step: degree_total_minimum, on an associate degree that already holds a degree total, where the page
prints the words. Read as a floor, electives make up a sum short of it and a sum past it meets it (the scorer's
reading since Cerritos's and San Joaquin Delta's steps, S415).

The page text below is the page read's, quoted line for line (the outcomes and the running header left out).

Pinned here:
  * the step as written, and nothing else of the college's entry moved (its fourteen cited renumbers, its page pin);
  * the step on the page's words: 43854 and 14751 take the flag, and today's scorer then passes each (the major
    equal to its printed total, the degree at or past its floor);
  * the wrong joins it refuses: a page without the words; a certificate, whose section prints 'MINIMUM CERTIFICATE
    UNITS' on the same page as the degree's words (33793 beside 14751, 20094 beside 14737); a degree record that
    holds no degree total; a record that already carries the flag; another college's record;
  * a record whose major fails keeps failing with the flag (14737, 14710, 45594, 16657, 42178): the floor reads the
    degree, never the major;
  * the self-recall over every committed Copper Mountain record (the S652 review rule, counting what the step joins
    as well as the verdicts), with the words put on every record's page: the flag lands on the 28 associate degrees
    and on no certificate or noncredit program; 43854 and 14751 turn passing; no passing record turns failing.

A record a reconcile run has already moved is read in either state: it either takes the flag here or carries it
already, so the test holds before and after a reconcile files the change.

Run from repo root: python3 tests/program_reconcile_s741_copper_mountain_test.py
"""
import copy
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_piles_s714_ccsf as C  # noqa: E402
import _program_requirements_reconcile as R  # noqa: E402
import _program_requirements_score as S  # noqa: E402

CM = "Copper Mountain College"
FOLDER = os.path.join(ROOT, "kb", "program_requirements_college", "copper_mountain", "records")
STEPS = R.load_steps()
FLAG = "degree_total_minimum"
checks, failures = [0], []

# The page read's lines (run 45953233659), each section as the PDF text prints it.
PAGE_105 = """Associate in Arts in
HISTORY
Dept. /No.  Title                           Units
Required Courses:
ANTH 001  Introduction to Physical Anthropology ............................3
HIST 003  History of World Civilizations - I ...........................................3
HIST 004  History of World Civilizations - II .........................................3
HIST C1001 U.S. History to 1877 ....................................................................3
HIST C1002 U.S. History Since 1865 .............................................................3
EGSJ 020  Native American Studies ..........................................................3
PHIL 010  Introduction to Logic .................................................................3
POLS C1000 American Government & Politics ........................................3
Total Units for the Major ......................................................................................24
Minimum Cal-GETC General Education Requirements.................34-43
Transferable elective units as needed.
MINIMUM TRANSFERABLE UNITS .................................................................60
Advisor:   D. Pieper
Students must complete the required courses for their major. General education units, transferable electives, and total degree units will vary for each
student. Some considerations include the courses (and their respective units) chosen to complete a general education area or transferable elective, and
if required courses for the major also count toward a general education area. Students should confer with their counselor to reach their education goals.
"""
PAGE_99_DEGREE = """Associate in Science in
FIRE TECHNOLOGY
with emphasis on employment preparation
Dept. /No.  Title                          Units
Required Courses:
FIRE 001   Fire Protection Organizations  ..............................................3
EMT 084   Emergency Medical Technician
or
EMR 001  Emergency Medical Responder ..................................... 3-9
Select at least thirteen (13) units from the following:
FIRE 006, FIRE 008, FIRE 010, FIRE 058, FIRE 061, FIRE 081,
FIRE 084, FIWE 080 - 083 .....................................................................................13
Select at least eight (8) units from the following:
BIOL 022, BIOL 023, CH 003, CIS 070A, CJ 003, PHIL 013,
COMM C1000...............................................................................................................8
Total Units for the Major ......................................................................................42
CMC General Education Requirement  ........................................................21
MINIMUM DEGREE UNITS .................................................................................60
Advisor:   J. Brakebill
"""
PAGE_99_CERTIFICATE = """Certificate of Achievement in
FIRE TECHNOLOGY
with emphasis on employment preparation
Select at least three (3) units from the following:
BIOL 022, BIOL 023, CH 003, CIS 070A, CJ 003, PHIL 013,
COMM C1000...............................................................................................................3
MINIMUM CERTIFICATE UNITS  .......................................................................30
Advisor:   J. Brakebill
"""
PAGE_99 = PAGE_99_DEGREE + PAGE_99_CERTIFICATE
NO_WORDS = "Total Units for the Major ......24\nTransferable elective units as needed.\nTOTAL UNITS ......60\n"
EVERY = ("Total Units for the Major ......24\nTransferable elective units as needed.\n"
         "MINIMUM TRANSFERABLE UNITS ......60\nMINIMUM DEGREE UNITS ......60\nMINIMUM CERTIFICATE UNITS ......30\n")


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


def filed(cn):
    with open(os.path.join(FOLDER, cn + ".json"), encoding="utf-8") as fh:
        return json.load(fh)


def unflagged(f):
    """The record as it was read: without the flag a filed reconcile may already have set."""
    rec = copy.deepcopy(f["record"])
    rec["program"].pop(FLAG, None)
    return rec


def recon(rec, text, award, cn=None, college=CM):
    return R.reconcile(copy.deepcopy(rec), text, college, award, control_number=cn, steps=STEPS)


def flags(notes):
    return [n for n in notes if n.get("field") == FLAG]


def arith(f, rec):
    return C.fresh_score(dict(f, record=rec))["arithmetic"]


# ── the entry as written ───────────────────────────────────────────────────
print("the entry")
entry = STEPS[CM]
steps = entry.get("steps") or []
check(len(steps) == 1 and steps[0]["kind"] == "set" and steps[0]["field"] == FLAG and steps[0]["value"] is True
      and steps[0]["awards"] == "associate" and steps[0]["only_with"] == "degree_total",
      "one step: the flag, on an associate degree that holds a degree total")
pat = re.compile(steps[0]["pattern"])
check(pat.search(PAGE_105) and pat.search(PAGE_99_DEGREE) and not pat.search(PAGE_99_CERTIFICATE)
      and not pat.search(NO_WORDS) and not pat.search("Minimum Cal-GETC General Education Requirements 34-43"),
      "the pattern reads the degree's two wordings, and neither a certificate's line nor the Cal-GETC line")
check("45953233659" in steps[0]["read"] and "45953233659" in steps[0]["why"] and "Reversible" in steps[0]["why"]
      and "p.105" in steps[0]["source_words"] and "p.99" in steps[0]["source_words"],
      "the step cites its page read and both pages")
check(len(entry.get("course_renumbers") or {}) == 14 and set(entry.get("pdf_pages") or {}) == {"41085"},
      "the entry's fourteen renumbers and its page pin are as they were")

# ── the step on the page's own words ───────────────────────────────────────
print("the step on the page's own words")
for cn, page, why in (("43854", PAGE_105, "MINIMUM TRANSFERABLE UNITS"), ("14751", PAGE_99, "MINIMUM DEGREE UNITS")):
    f = filed(cn)
    rec = unflagged(f)
    before = arith(f, rec)
    check(not before["pass"] and before["against"] == "degree" and (before.get("major") or {}).get("pass") is True,
          "%s: as read, the major adds to its printed total and the degree does not" % cn)
    new, notes = recon(rec, page, f["award"], cn)
    got = flags(notes)
    check(len(got) == 1 and got[0]["now"] is True and why in got[0]["words"] and new["program"][FLAG] is True,
          "%s: the step sets the flag, citing the page's words" % cn)
    check({n.get("field") for n in notes} == {FLAG} and new["blocks"] == rec["blocks"]
          and {k: v for k, v in new["program"].items() if k != FLAG} == rec["program"],
          "%s: the step moves nothing else of the record" % cn)
    after = arith(f, new)
    check(after["pass"] and after["status"] == "equal" and S.passes_live(C.fresh_score(dict(f, record=new))),
          "%s: with the floor today's scorer passes it" % cn)
    again, notes2 = recon(new, page, f["award"], cn)
    check(not flags(notes2) and again["program"][FLAG] is True, "%s: a record that carries the flag is left alone" % cn)
f = filed("43854")
p = f["record"]["program"]
check(p["total_units"] == {"min": 24, "max": 24} and p["ge_units"] == {"min": 34, "max": 43}
      and p["degree_total"] == {"min": 60, "max": 60} and p["electives_fill_degree"] is True,
      "43854: the record holds the page's 24, 34-43 and 60, and electives as needed")
f = filed("14751")
p = f["record"]["program"]
check(p["total_units"] == {"min": 42, "max": 42} and p["ge_units"] == {"min": 21, "max": 21}
      and p["degree_total"] == {"min": 60, "max": 60}, "14751: the record holds the page's 42, 21 and 60")

# ── the wrong joins it refuses ─────────────────────────────────────────────
print("the wrong joins it refuses")
f = filed("43854")
check(not flags(recon(unflagged(f), NO_WORDS, f["award"], "43854")[1]), "a page without the words sets nothing")
for cert, beside in (("33793", PAGE_99), ("20094", EVERY)):
    g = filed(cert)
    check("ertificate" in g["award"] and not flags(recon(unflagged(g), beside, g["award"], cert)[1]),
          "%s: a certificate takes nothing, though its page prints the degree's words" % cert)
bare = unflagged(f)
bare["program"]["degree_total"] = {"min": None, "max": None}
check(not flags(recon(bare, PAGE_105, f["award"], "43854")[1]), "a degree record that holds no degree total takes nothing")
check(not flags(recon(unflagged(f), PAGE_105, f["award"], "43854", college="Solano Community College")[1]),
      "the step is Copper Mountain's alone")

# ── a major that fails keeps failing ───────────────────────────────────────
print("a major that fails keeps failing")
for cn in ("14737", "14710", "45594", "16657", "42178"):
    f = filed(cn)
    new, notes = recon(unflagged(f), EVERY, f["award"], cn)
    a = arith(f, new)
    check(new["program"].get(FLAG) is True and not a["pass"] and a["against"] == "program",
          "%s: with the flag its major still fails" % cn)

# ── the self-recall over every committed record ────────────────────────────
print("the self-recall over every committed Copper Mountain record")
read, flagged, turned_passing, turned_failing, others = 0, [], [], [], []
for path in sorted(glob.glob(os.path.join(FOLDER, "*.json"))):
    with open(path, encoding="utf-8") as fh:
        f = json.load(fh)
    if not isinstance(f.get("record"), dict):
        continue
    read += 1
    cn = f["control_number"]
    rec = unflagged(f)
    new, notes = recon(rec, EVERY, f.get("award"), cn)
    if flags(notes):
        flagged.append(cn)
    if [n for n in notes if n.get("field") != FLAG]:
        others.append(cn)
    before, after = arith(f, rec).get("pass"), arith(f, new).get("pass")
    if after and not before:
        turned_passing.append(cn)
    if before and not after:
        turned_failing.append(cn)
check(read >= 48, "the recall read the college's records (%d)" % read)
degrees = sorted(os.path.basename(p)[:-5] for p in glob.glob(os.path.join(FOLDER, "*.json"))
                 if R.awards_match("associate", filed(os.path.basename(p)[:-5]).get("award")))
check(flagged == degrees and len(flagged) == 28, "the flag lands on the 28 associate degrees and no other record: %d"
      % len(flagged))
check(not others, "the step changes no other field of any record: %s" % others)
check(turned_passing == ["14751", "43854"], "43854 and 14751 turn passing, and no other record: %s" % turned_passing)
check(not turned_failing, "no passing record turns failing: %s" % turned_failing)

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
