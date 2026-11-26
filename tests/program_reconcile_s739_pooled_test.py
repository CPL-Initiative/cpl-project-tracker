#!/usr/bin/env python3
"""S739 (the pooled reading's next): Modesto Junior's reconcile entry, on the page's own words.

WHY. Plan s731p held Modesto Junior 06683 and 42664 with no gap kind naming either. Each has a college-scoped lever
(kb/program_requirements_reconcile.json, "Modesto Junior College"):

  * Respiratory Care A.S. 06683. The page prints 'Respiratory Care (Total 75.5 - 77.5)' over three parts, and the
    reading left out the third, 'TO EARN AN ASSOCIATE IN SCIENCE DEGREE IN RESPIRATORY CARE (Total 15)', whose lines
    are the college's general education areas. A fill step files that block's own total as ge_units, and the scorer's
    ge_included adds it to the printed total. The page text is the college page read's (run 45768981024,
    kb/college_reads/modesto_pooled_next_s739.json), quoted here line for line.
  * Law, Public Policy, and Society AA-T 42664. The catalog prints BUSAD 249A, 249B and 249C where the state's file
    lists one row, BUSAD 249ABC; course_renumbers names the three as that row.

Pinned here:
  * the step on the page's words: it files 15, the block's own total, and the record then adds to 75.5-77.5;
  * the wrong joins it must refuse: another block's total (18 - 20, 42.5, 8), a 'to earn an associate' sentence with
    no total, a totaled block that holds courses and no general education areas, a transfer degree, a record that
    names a degree total, and a record that already holds its general education units;
  * the renumbers: 42664 places its listed row and no unlisted course, with no repeat; a program whose list lacks
    the row keeps its three codes as printed;
  * the self-recall over every committed Modesto Junior record (the S652 review rule, counting what the entry joins
    as well as the verdicts): the renumbers rename codes in 42664 alone and move its verdict alone; and filing 15
    units of general education on any local degree the step could reach turns no passing record into a failing one.

A record another open branch may move is read in either state: the test strips ge_units from its own copy of 06683
before the step runs, so it reads the same before and after a reconcile files the fill.

Run from repo root: python3 tests/program_reconcile_s739_pooled_test.py
"""
import copy
import glob
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_piles_s714_ccsf as C  # noqa: E402
import _program_requirements_reconcile as R  # noqa: E402
import _program_requirements_score as S  # noqa: E402

MJC = "Modesto Junior College"
FOLDER = os.path.join(ROOT, "kb", "program_requirements_college", "modesto_junior", "records")
STEPS = R.load_steps()
checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


def filed(cn):
    with open(os.path.join(FOLDER, cn + ".json"), encoding="utf-8") as fh:
        return json.load(fh)


def score(f, record=None, text=None, aliases="own"):
    al = R.prefix_aliases(MJC, year=f.get("catalog_year")) if aliases == "own" else aliases
    return S.score(record if record is not None else f["record"], C.closed_list(MJC, f["control_number"]), text,
                   f.get("award"), al, R.packed_codes(MJC))


# ── the page's own words (college page read 45768981024, page 1, the requirements table, line for line) ─────────
PAGE = """Associate Degree Requirements
Program Requirements
Respiratory Care (Total 75.5 - 77.5)
Complete all of the following
PROGRAM PREREQUISITES (Total 18 - 20)
Complete all of the following
PROGRAM PREREQUISITES (Total 12)
Complete all of the following
ANAT125 - Human Anatomy 4
MICRO101 - Microbiology 4
PHYSO101 - Introductory Human Physiology 4
PROGRAM PREREQUISITES (Total 3)
Complete the following number of credits: 3
PSYCC1000 - Introduction to Psychology 3
PSYCH141 - Human Lifespan Development 3
PROGRAM PREREQUISITES (Total 3 - 5)
Complete the following number of credits: 3-5
ENGLC1000 - Academic Reading and Writing 3
ENGLC1000E - Academic Reading and Writing 5
REQUIRED COURSES (RESPIRATORY CARE) (Total 42.5)
Complete all of the following
REQUIRED COURSES - FIRST SEMESTER (Total 10.5)
Complete all of the following
RSCR220 - Introduction to Respiratory Care 5
RSCR222 - Cardiopulmonary Anatomy and Physiology 3
RSCR230 - Clinical 1 2.5
REQUIRED COURSES - SECOND SEMESTER (Total 13)
Complete all of the following
RSCR224 - Respiratory Care Theory 2 5
RSCR232 - Clinical 2 3.5
RSCR240 - Advanced Cardiopulmonary Physiology 4.5
REQUIRED COURSES - THIRD SEMESTER (Total 11)
Complete all of the following
RSCR242 - Critical Care Procedures 4.5
RSCR244 - Neonatal-Pediatric Respiratory Care 2
RSCR250 - Clinical 3 3.5
RSCR251 - Neonatal & Pediatric Clinical Practice I 1
REQUIRED COURSES - FOURTH SEMESTER (Total 8)
Complete all of the following
RSCR246 - Current Issues in Respiratory Care 3
RSCR252 - Physician Rounds for Respiratory Care 0.5
RSCR255 - Clinical 4 2
RSCR257 - Clinical Preceptorship 2.5
TO EARN AN ASSOCIATE IN SCIENCE DEGREE IN RESPIRATORY CARE (Total 15)
Complete all of the following
CONSULT WITH AN EDUCATIONAL COUNSELOR FOR SELECTION OF THE FOLLOWING MJC REQUIREMENTS: 0
AREA 1B: ORAL COMMUNICATION AND CRITICAL THINKING 3
AREA 2: MATHEMATICAL CONCEPTS AND QUANTITATIVE REASONING 3
AREA 3: ARTS AND HUMANITIES 3
AREA 6: ETHNIC STUDIES 3
AREA 7: THE EMPOWERED INDIVIDUAL IN SOCIETY 3
Total Units: 75.5 - 77.5 Units
"""
GE_BLOCK = PAGE[PAGE.index("TO EARN AN ASSOCIATE"):PAGE.index("Total Units:")]

f83 = filed("06683")
rec83 = copy.deepcopy(f83["record"])
rec83["program"].pop("ge_units", None)          # either state: before or after a reconcile filed the fill
for b in rec83.get("blocks") or []:
    check("TO EARN" not in str(b.get("name") or "").upper(), "06683: the record holds no block for the 15 (its note)")


def recon(record, text, award="A.S. Degree"):
    return R.reconcile(record, text, MJC, award, title="Respiratory Care", control_number="06683", steps=STEPS)


print("the step on the page's own words")
new, notes = recon(rec83, PAGE)
check([n["field"] for n in notes] == ["ge_units"], "06683: one note, on ge_units (%r)" % [n["field"] for n in notes])
check(new["program"].get("ge_units") == {"min": 15, "max": 15}, "06683: the fill is the block's own 15")
check(notes and notes[0]["words"].startswith("TO EARN AN ASSOCIATE IN SCIENCE DEGREE IN RESPIRATORY CARE (Total 15)"),
      "06683: the note quotes the block's heading with its total")
before, after = score(f83, rec83, PAGE)["arithmetic"], score(f83, new, PAGE)["arithmetic"]
check(not before["pass"] and before["computed"] == [60.5, 62.5] and before["stated"] == [75.5, 77.5],
      "06683: without the fill the blocks add to 60.5-62.5 against 75.5-77.5 (%r)" % before)
check(after["pass"] and after.get("ge_included") == [15.0, 15.0] and after["computed"] == [75.5, 77.5],
      "06683: with it the record adds to the printed 75.5-77.5 as ge_included (%r)" % after)
check(S.passes_live(score(f83, new, PAGE)), "06683: the record passes as the live table counts it")
for join, name in ((" · ", "a middle dot"), ("\t", "a tab"), ("  ", "two spaces")):
    got = recon(rec83, PAGE.replace("\n", join))[0]["program"].get("ge_units")
    check(got == {"min": 15, "max": 15}, "06683: the same fill where the capture joins lines with %s (%r)" % (name, got))

print("the wrong joins")
no_block = PAGE.replace(GE_BLOCK, "")
check(recon(rec83, no_block)[1] == [], "a page without the block fills nothing (never 18 - 20, 42.5 or 8)")
for wrong in (42.5, 8, 18, 20, 12, 13, 11, 10.5):
    check((new["program"]["ge_units"]["min"], new["program"]["ge_units"]["max"]) != (wrong, wrong),
          "the fill is never another block's %s" % wrong)
sentence = no_block + ("To earn an Associate in Science degree in Medical Assisting the student must complete the MJC "
                       "Associate Degree Requirements.\nTO EARN AN ASSOCIATE IN SCIENCE DEGREE IN MEDICAL ASSISTING\n"
                       "REQUIRED COURSES (MEDICAL ASSISTING) - SECOND SEMESTER (Total 14)\n")
check(recon(rec83, sentence)[1] == [], "a 'to earn an associate' line with no total of its own takes no later total")
courses = no_block + ("TO EARN AN ASSOCIATE IN SCIENCE DEGREE IN RESPIRATORY CARE (Total 15)\nComplete all of the "
                      "following\nRSCR246 - Current Issues in Respiratory Care 3\nRSCR255 - Clinical 4 2\n")
check(recon(rec83, courses)[1] == [], "a totaled block of courses, naming no general education area, fills nothing")
far = no_block + ("TO EARN AN ASSOCIATE IN SCIENCE DEGREE IN RESPIRATORY CARE (Total 15)\n" + "RSCR246 - A course 3\n" * 12
                  + "CONSULT WITH AN EDUCATIONAL COUNSELOR FOR SELECTION OF THE FOLLOWING MJC REQUIREMENTS: 0\nAREA 1B: X 3\n")
check(recon(rec83, far)[1] == [], "the areas must follow the block's heading, never a list of courses first")
check(recon(rec83, PAGE, award="A.A- T Degree")[1] == [], "a transfer degree is left alone")
check(recon(rec83, PAGE, award="Certificate of Achievement: 18  or greater semester units")[1] == [],
      "a certificate is left alone")
with_degree = copy.deepcopy(rec83)
with_degree["program"]["degree_total"] = {"min": 60, "max": 60}
check(recon(with_degree, PAGE)[1] == [], "a record naming a degree total is left alone (its general education is the "
      "degree's, never part of the program total)")
held = copy.deepcopy(rec83)
held["program"]["ge_units"] = {"min": 21, "max": 21}
check(recon(held, PAGE)[1] == [] and recon(held, PAGE)[0]["program"]["ge_units"] == {"min": 21, "max": 21},
      "a record that holds its general education units keeps them")
check(R.reconcile(rec83, PAGE, "Merced College", "A.S. Degree", steps=STEPS)[0]["program"].get("ge_units") in (None, {}),
      "the step is Modesto Junior's alone")

print("the renumbers: BUSAD 249A, 249B and 249C are the file's BUSAD 249ABC")
ALIASES = R.prefix_aliases(MJC) or {}
check({S.norm_code(k): S.norm_code(v) for k, v in ALIASES.items()}
      == {"BUSAD249A": "BUSAD249ABC", "BUSAD249B": "BUSAD249ABC", "BUSAD249C": "BUSAD249ABC"},
      "Modesto Junior's renumbers are the three codes, each to BUSAD 249ABC (%r)" % ALIASES)
f64 = filed("42664")
listed = {S.norm_code(c.get("code")) for c in C.closed_list(MJC, "42664")}
check("BUSAD249ABC" in listed and not listed & {"BUSAD249A", "BUSAD249B", "BUSAD249C"},
      "42664: the state's file lists BUSAD 249ABC and none of the three printed codes")
off, on = score(f64, aliases=None), score(f64)
check(not off["coverage"]["pass"] and off["coverage"]["missing"] == ["BUSAD249ABC"]
      and {"BUSAD249A", "BUSAD249B", "BUSAD249C"} <= set(off["invented"]["codes"]) and not off["invented"]["pass"],
      "42664 without the renumbers: the listed row reads missing and the three codes unlisted")
check(on["coverage"]["pass"] and on["coverage"]["missing"] == [] and on["invented"]["pass"]
      and not set(on["invented"]["codes"]) & {"BUSAD249A", "BUSAD249B", "BUSAD249C", "BUSAD249ABC"},
      "42664 with them: the listed row is placed and no unlisted course is left unflagged (%r)" % on["invented"])
check(on["repeated"]["pass"] and on["arithmetic"]["pass"] and on["arithmetic"]["computed"] == off["arithmetic"]["computed"],
      "42664: one entry and its two alternatives are no repeat, and the units add as before")
check(S.passes_live(on) and not S.passes_live(off), "42664: the record passes as the live table counts it")
check(set(on["invented"]["flagged"]) == {"COMM130", "PSYCH121"},
      "42664: its two catalog additions stay flagged as additions")

print("the self-recall over every committed Modesto Junior record")
renamed, moved, unpassed, reached = [], [], [], 0
for path in sorted(glob.glob(os.path.join(FOLDER, "*.json"))):
    with open(path, encoding="utf-8") as fh:
        f = json.load(fh)
    if not isinstance(f.get("record"), dict):
        continue
    cn = str(f["control_number"])
    closed = {S.norm_code(c.get("code")): c.get("units") for c in C.closed_list(MJC, cn)}
    al = R.prefix_aliases(MJC, year=f.get("catalog_year"))
    joined = S.with_prefix_aliases(f["record"], closed, al)
    if any(e.get("printed_code") for _, e, _ in S.placed_codes(joined)):
        renamed.append(cn)
    a, b = S.passes_live(score(f, aliases=None)), S.passes_live(score(f))
    if a != b:
        moved.append((cn, a, b))
    # What the step could write: 15 units of general education on a local degree with no degree total and none
    # filed. ge_included reads it only where the record's own sum falls short by exactly that, so no pass is lost.
    prog = f["record"].get("program") or {}
    if (R.awards_match("local", f.get("award")) and R._empty(prog.get("degree_total"))
            and R._empty(prog.get("ge_units"))):
        reached += 1
        trial = copy.deepcopy(f["record"])
        trial.setdefault("program", {})["ge_units"] = {"min": 15, "max": 15}
        if S.passes_live(score(f)) and not S.passes_live(score(f, trial)):
            unpassed.append(cn)
check(renamed == ["42664"], "the renumbers rename codes in 42664 alone (%r)" % renamed)
check(moved == [("42664", False, True)], "and move 42664's verdict alone, fail to pass (%r)" % moved)
check(reached >= 1 and unpassed == [],
      "a 15-unit fill on any of the %d local degrees the step could reach unpasses none (%r)" % (reached, unpassed))
for cn in ("06644", "06647", "06649"):
    f = filed(cn)
    check(score(f, aliases=None) == score(f), "%s, whose list lacks the row, scores the same with the renumbers" % cn)

FLOOR = 40
check(checks[0] >= FLOOR, "at least %d checks run (%d)" % (FLOOR, checks[0]))
print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
