#!/usr/bin/env python3
"""kb/_program_requirements_reconcile.py: the award filters, and Cañada's Cal-GETC step on
the catalog's own words. A local degree's captured page can span the sibling transfer
section (Cañada, S421: six local records took the 34 on the first run), so a transfer-only
step must leave a local degree alone even when its text carries the line. Stdlib only."""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_requirements_reconcile as R  # noqa: E402
import _program_requirements_score as S  # noqa: E402

results = []


def check(name, cond):
    results.append((name, bool(cond)))


print("awards_match")
for award in ("A.A- T Degree", "A.S. T Degree", "Associate in Arts for Transfer", "AA-T"):
    check("transfer: %s" % award, R.awards_match("transfer", award) and R.awards_match("associate", award))
for award in ("A.A. Degree", "A.S. Degree", "Associate in Science"):
    check("local, not transfer: %s" % award, R.awards_match("associate", award) and not R.awards_match("transfer", award))
for award in ("Certificate of Achievement requiring 16S/24Q to fewer than 30S/45Q units", "Baccalaureate Degree"):
    check("neither: %s" % award, not R.awards_match("associate", award) and not R.awards_match("transfer", award))
check("no kind matches everything", R.awards_match(None, "anything"))

print("Cañada's Cal-GETC step")
steps = R.load_steps()
check("the step reads transfer degrees only",
      steps["Cañada College"]["awards"] == "transfer" and steps["Cañada College"]["steps"][0]["awards"] == "transfer")
page = ("Total Required Major Units: 24 - 25\nCompletion of Cal-GETC (California General\nEducation Transfer "
        "Curriculum)\nElective courses:\nAdditional CSU or UC transferable courses needed to meet\nthe minimum 60 CSU "
        "transferable unit requirement.")
rec = {"program": {"total_units": {"min": 24, "max": 25}, "degree_total": {"min": 60, "max": 60},
                   "ge_units": {"min": None, "max": None}, "electives_fill_degree": True}, "blocks": []}
new, notes = R.reconcile(rec, page, "Cañada College", "A.S. T Degree", steps=steps)
check("a transfer degree takes Cal-GETC's 34 from the catalog's own page",
      new["program"]["ge_units"] == {"min": 34, "max": 34} and notes and notes[0]["field"] == "ge_units"
      and "34 units minimum" in notes[0]["words"] and "#page=79" in notes[0]["words"])
check("a local degree whose page spans the transfer section is left alone",
      R.reconcile(rec, page, "Cañada College", "A.S. Degree", steps=steps)[1] == [])
check("a certificate is left alone", R.reconcile(rec, page, "Cañada College", "Certificate of Achievement", steps=steps)[1] == [])
stem = "Total Required Major Units: 42\nGeneral Education Requirements:*\nCertified Completion of CSU-GE Breadth for STEM Pattern,\n33 units"
check("a STEM pattern page never matches", R.reconcile(rec, stem, "Cañada College", "A.S. T Degree", steps=steps)[1] == [])
filled = json.loads(json.dumps(rec)); filled["program"]["ge_units"] = {"min": 34, "max": 34}
check("a figure already held is not set again", R.reconcile(filled, page, "Cañada College", "A.S. T Degree", steps=steps)[1] == [])

print("Hartnell's pooled subject lists (S487)")
gah = ("Requirements · Completion requirement · For the 18 units required, select courses in List A from at least two "
       "disciplines; from one of the disciplines select at least two courses.")
def lst(name, codes):
    return {"name": name, "rule": "choose_units", "stated": {"min": None, "max": None}, "minimum": None,
            "option_group": None, "courses": [{"code": c, "units": 3} for c in codes]}
rec = {"program": {"total_units": {"min": 18, "max": 18}, "ge_units": {"min": 23, "max": 23}},
       "blocks": [lst("List A: Anthropology", ["ANT2", "ANT20"]), lst("List A: Art", ["ART3"]),
                  lst("List A: History", ["HIS4A", "HIS6"])]}
new, notes = R.reconcile(rec, gah, "Hartnell College", "A.A. Degree", steps=steps)
check("the lists the page gives one 18-unit figure become one choice of 18, courses in order",
      len(new["blocks"]) == 1 and new["blocks"][0]["stated"] == {"min": 18, "max": 18}
      and new["blocks"][0]["minimum"] == 18 and new["blocks"][0]["name"] == "Completion requirement"
      and [c["code"] for c in new["blocks"][0]["courses"]] == ["ANT2", "ANT20", "ART3", "HIS4A", "HIS6"]
      and [n for n in notes if n["field"] == "blocks"][0]["was"][0] == "List A: Anthropology")
check("the original record is left as it was", len(rec["blocks"]) == 3)
one = dict(rec, blocks=[lst("Completion requirement", ["ANT2", "ART3"])])
check("one list is never pooled", not [n for n in R.reconcile(one, gah, "Hartnell College", "A.A. Degree", steps=steps)[1]
                                       if n["field"] == "blocks"])
other = dict(rec, program=dict(rec["program"], total_units={"min": 21, "max": 21}))
check("a record whose total names another figure is left alone",
      not [n for n in R.reconcile(other, gah, "Hartnell College", "A.A. Degree", steps=steps)[1] if n["field"] == "blocks"])
stated = dict(rec, blocks=rec["blocks"][:2] + [dict(lst("List A: History", ["HIS6"]), stated={"min": 3, "max": 3})])
got = R.reconcile(stated, gah, "Hartnell College", "A.A. Degree", steps=steps)[0]
check("a list with a figure of its own stays a list",
      [b["name"] for b in got["blocks"]] == ["Completion requirement", "List A: History"])
check("a certificate is left alone",
      not [n for n in R.reconcile(rec, gah, "Hartnell College", "Certificate of Achievement", steps=steps)[1]
           if n["field"] == "blocks"])

print("Hartnell's lists with floors under one total (S489)")
lphs = "Requirements · Complete a total of 18 units from List A, List B, and List C · List A: Biology"
def floor(name, codes, mn, st=None):
    return dict(lst(name, codes), minimum=mn, stated=st or {"min": None, "max": None})
rec = {"program": {"total_units": {"min": 18, "max": 18}},
       "blocks": [floor("List A: Biology", ["BIO5", "BIO10"], 3), floor("List B: Chemistry", ["CHM22"], 4),
                  floor("List C", ["ANT1", "BIO5", "CHM22", "SOC1"], 10, {"min": 10, "max": 11})]}
new, notes = R.reconcile(rec, lphs, "Hartnell College", "A.A. Degree", steps=steps)
b = new["blocks"]
check("three lists under one printed 18 become one choice of 18",
      len(b) == 1 and b[0]["stated"] == {"min": 18, "max": 18} and b[0]["minimum"] == 18)
check("a course listed in two of the lists is listed once",
      [c["code"] for c in b[0]["courses"]] == ["BIO5", "BIO10", "CHM22", "ANT1", "SOC1"])
check("each list's figure stays in floors",
      [(f["name"], f["minimum"]) for f in b[0]["floors"]] == [("List A: Biology", 3), ("List B: Chemistry", 4), ("List C", 10)])
check("the pooled record passes the scorer's sum", S.program_units(new, {})[0] == (18, 18))
over = json.loads(json.dumps(rec)); over["blocks"][2]["stated"] = {"min": 12, "max": 12}
check("floors that sum past the total are left alone",
      not [n for n in R.reconcile(over, lphs, "Hartnell College", "A.A. Degree", steps=steps)[1] if n["field"] == "blocks"])
check("the figureless step never pools lists with floors",
      not [n for n in R.reconcile(rec, gah, "Hartnell College", "A.A. Degree", steps=steps)[1] if n["field"] == "blocks"])

print("Hartnell's Cal-GETC area totals over sub-areas (S495)")
cal = ("STATC1000: Introduction to Statistics \u00b7 Area 3: Arts and Humanities\n"
       "A total of 6 semester units is required. Two courses required: one from Area 3A (Arts) and one from Area 3B (Humanities).\n"
       "Complete at least 2 of the following Courses:\nART1A: Art History Survey I\n"
       "Area 4: Social and Behavioral Sciences\nA total of 6 semester units is required. Two courses required from two different academic disciplines.\n"
       "Area 5: Physical and Biological Sciences\nA total of 7 semester units is required. Two courses required: one from Area 5A "
       "(Physical Science) and one from Area 5B (Biological Science).\n"
       "Area 5A: Physical Science \u00b7 Complete ANY of the following Courses: \u00b7 ABT90: Soil Science\n"
       "PHY10: Introduction to Physics \u00b7 Area 6: Ethnic Studies\nA total of 3 semester units is required. One course required.")
def area(name, rule, codes, mn, st, units=3):
    return {"name": name, "rule": rule, "minimum": mn, "stated": st,
            "courses": [{"code": c, "units": units} for c in codes]}
NONE = {"min": None, "max": None}
rec = {"program": {"total_units": {"min": 34, "max": 34}},
       "blocks": [area("Area 1: English Communication", "all", ["ENG1A", "ENG2", "COM1"], None, {"min": 9, "max": 9}),
                  area("Area 2: Mathematical Concepts and Quantitative Reasoning", "choose_courses", ["MAT10", "STATC1000"], 1, {"min": 3, "max": 3}),
                  area("Area 3: Arts and Humanities - Area 3A (Arts)", "choose_courses", ["ART1A", "MUS1A"], 1, NONE),
                  area("Area 3: Arts and Humanities - Area 3B (Humanities)", "choose_courses", ["PHL2", "HIS4A"], 1, NONE),
                  area("Area 4: Social and Behavioral Sciences", "choose_courses", ["SOC1", "PSY6", "ECO10"], 2, {"min": 6, "max": 6}),
                  area("Area 5A: Physical Science", "choose_courses", ["PHY10", "CHM1A"], 1, NONE, 4),
                  area("Area 5B: Biological Science", "choose_courses", ["BIO10", "BIO5"], 1, NONE, 4),
                  area("Area 5C: Laboratory", "choose_courses", ["BIO10", "CHM1A", "AST1L"], 1, NONE, 1),
                  area("Area 6: Ethnic Studies", "choose_courses", ["ETH1", "ETH7"], 1, {"min": 3, "max": 3})]}
new, notes = R.reconcile(rec, cal, "Hartnell College", "Certificate of Achievement", steps=steps)
b = new["blocks"]
names = [x["name"] for x in b]
check("Area 3's two sub-areas become one choice of 6, named for the area",
      "Area 3: Arts and Humanities" in names and not [n for n in names if "Area 3A" in n or "Area 3B" in n]
      and [x for x in b if x["name"] == "Area 3: Arts and Humanities"][0]["stated"] == {"min": 6, "max": 6})
a5 = [x for x in b if x["name"] == "Area 5: Physical and Biological Sciences"]
check("Area 5's three sub-areas become one choice of 7, 5C's laboratory kept as a floor",
      len(a5) == 1 and a5[0]["stated"] == {"min": 7, "max": 7}
      and [f["name"] for f in a5[0]["floors"]] == ["Area 5A: Physical Science", "Area 5B: Biological Science", "Area 5C: Laboratory"]
      and all(f["rule"] == "choose_courses" for f in a5[0]["floors"]))
check("a course listed under two sub-areas is listed once",
      [c["code"] for c in a5[0]["courses"]] == ["PHY10", "CHM1A", "BIO10", "BIO5", "AST1L"])
check("areas 1, 2, 4 and 6 are left as read", [x["name"] for x in b if x["name"].startswith(("Area 1", "Area 2", "Area 4", "Area 6"))]
      == [x["name"] for x in rec["blocks"] if x["name"].startswith(("Area 1", "Area 2", "Area 4", "Area 6"))] and len(b) == 6)
check("the pooled record sums to the tab's 34", S.program_units(new, {})[0] == (34, 34))
check("the original record is left as it was", len(rec["blocks"]) == 9)
spaced = cal.replace("\n", " ")
check("the pattern reads the tab's words whether a capture joins them with a newline or a space",
      len(R.reconcile(rec, spaced, "Hartnell College", "Certificate of Achievement", steps=steps)[0]["blocks"]) == 6)
over = json.loads(json.dumps(rec)); over["blocks"][2]["stated"] = {"min": 4, "max": 4}; over["blocks"][3]["stated"] = {"min": 4, "max": 4}
check("sub-areas whose own figures sum past the area's total are left alone",
      len([x for x in R.reconcile(over, cal, "Hartnell College", "Certificate of Achievement", steps=steps)[0]["blocks"]
           if x["name"].startswith("Area 3")]) == 2)

print("Hartnell's Music repeat counts (S497)")
# The filed record carries the step's result (reconcile 40466933762), so the record as read is that one with the
# two fields taken off: no times on any course, the 2-semester list back to the one choice the reading made.
mus = json.load(open(os.path.join(ROOT, "kb", "program_requirements_college", "hartnell", "records", "43887.json")))["record"]
for b in mus["blocks"]:
    if b.pop("repeats", None):
        b["minimum"] = 1
    for c in b["courses"]:
        for e in [c] + c.get("alternatives", []):
            e.pop("times", None)
mus_text = ("Unnamed Rule \u00b7 Complete ALL of the following Courses: \u00b7 MUS 10: Class Piano I (1) or MUS 11: "
            "Applied Piano (0.5) \u00b7 If MUS 11 is chosen, it must be taken for 2 semesters.\n"
            "2 semesters of any of the following Courses: \u00b7 MUS 20: Concert Choir")
check("the record before the step reads 18-19 against 19.5", S.program_units(mus, {})[0] == (18, 19))
new, notes = R.reconcile(mus, mus_text, "Hartnell College", "Certificate of Achievement", steps=steps)
alt = [a for c in new["blocks"][0]["courses"] for a in c["alternatives"] if a["code"] == "MUS 11"]
check("MUS 11, the alternative the page says is taken twice, carries times 2", alt and alt[0]["times"] == 2)
rep = [b for b in new["blocks"] if "2 semesters" in b["name"]][0]
check("the list of 2 semesters becomes 2 enrollments a student may repeat", rep["minimum"] == 2 and rep["repeats"] is True)
check("the record then sums to 19.5-20, its low end the tab's 19.5", S.program_units(new, {})[0] == (19.5, 20))
check("each change is noted with the page's words", sorted(n["field"] for n in notes) == ["blocks", "times"]
      and all(n["words"] for n in notes))
check("the original record is left as it was", "times" not in json.dumps(mus) and "repeats" not in json.dumps(mus))
again = R.reconcile(new, mus_text, "Hartnell College", "Certificate of Achievement", steps=steps)[1]
check("a second run changes nothing", not [n for n in again if n["field"] in ("times", "blocks")])
check("a text without the words changes nothing",
      not [n for n in R.reconcile(mus, "MUS 10: Class Piano I", "Hartnell College", "Certificate of Achievement",
                                  steps=steps)[1] if n["field"] == "times"])
two = json.loads(json.dumps(mus)); two["blocks"][2]["minimum"] = 3
check("a list the reading gave a count above one is left alone",
      [b for b in R.reconcile(two, mus_text, "Hartnell College", "Certificate of Achievement", steps=steps)[0]["blocks"]
       if "2 semesters" in b["name"]][0]["minimum"] == 3)

print("Delta's Caterpillar repeat count (S498)")
cat = json.load(open(os.path.join(ROOT, "kb", "program_requirements_college", "san_joaquin_delta", "records",
                                  "44197.json")))["record"]
for b in cat["blocks"]:
    for c in b["courses"]:
        for e in [c] + c.get("alternatives", []):
            if isinstance(e, dict):
                e.pop("times", None); e.pop("units_total", None)
cat_text = ("CAT 69V Internship: Heavy Equipment-Caterpillar Units: 1-4 Students are required to enroll four times in "
            "CAT 69V for a total of 16 units.\nMinimum Units Required: 55")
cat["program"].pop("total_units_minimum", None)
check("the record before the step reads 40-43 against 55", S.program_units(cat, {})[0] == (40, 43))
new, notes = R.reconcile(cat, cat_text, "San Joaquin Delta College", "Certificate of Achievement", steps=steps)
c69 = [c for b in new["blocks"] for c in b["courses"] if c["code"] == "CAT 69V"][0]
check("CAT 69V carries times 4 and the page's 16 units", c69["times"] == 4 and c69["units_total"] == 16)
check("its printed range is kept", c69["units"] == 1 and c69["units_max"] == 4)
check("the record then sums to the page's 55", S.program_units(new, {})[0] == (55, 55))
check("a second run changes nothing",
      not [n for n in R.reconcile(new, cat_text, "San Joaquin Delta College", "Certificate of Achievement",
                                  steps=steps)[1] if n["field"] == "times"])
check("a count in figures reads too", R._count("4") == 4 and R._count("four") == 4 and R._count(None) is None)

print("unit_line (Delta's Architectural Drafting 22244, S500)")
arch = {"program": {"total_units": {"min": 23, "max": 23}, "total_units_minimum": True},
        "blocks": [{"name": "Core Requirements", "rule": "all", "minimum": None, "stated": {"min": 23, "max": 23},
                    "courses": [{"code": c, "units": u} for c, u in
                                (("ARCH 1", 3), ("ARCH 5", 4), ("ARCH 6", 3), ("ARCH 14", 3), ("ARCH 20", 3), ("ARCH 78", 3))]}]}
arch_text = "ARCH 78 Units: 3\nAssociate Degree Math Requirement Units: 4\nMinimum Units Required: 23"
check("the record before the step reads 19 against 23", S.program_units(arch, {})[0] == (19, 19))
new, notes = R.reconcile(arch, arch_text, "San Joaquin Delta College", "Certificate of Achievement", steps=steps)
check("the line becomes a block of 4 with no courses",
      [b for b in new["blocks"] if b["name"] == "Associate Degree Math Requirement" and b["minimum"] == 4 and not b["courses"]])
check("the record then sums to the page's 23", S.program_units(new, {})[0] == (23, 23))
check("a second run changes nothing",
      not [n for n in R.reconcile(new, arch_text, "San Joaquin Delta College", "Certificate of Achievement",
                                  steps=steps)[1] if n["now"] == "Associate Degree Math Requirement"])
short = R.reconcile(arch, arch_text.replace("Units: 4", "Units: 3"), "San Joaquin Delta College",
                    "Certificate of Achievement", steps=steps)[0]
check("a line that does not close the gap exactly adds nothing", len(short["blocks"]) == 1)

print("or_units, the group's figure on its heading line (S590, Monterey Peninsula 22052)")
acct_text = ("Select one of the following:\t2 · WORK 96 · Professional and Essential Skills · "
             "or WORK 99\tCareer-Focused Work Experience\nor WORK 98\tExploratory Work Experience\n")
acct = {"blocks": [{"name": "Select one of the following:", "rule": "all", "stated": {"min": 2, "max": 2},
                    "courses": [{"code": "WORK 96", "units": None, "units_max": None,
                                 "alternatives": [{"code": "WORK 99", "units": None}, {"code": "WORK 98", "units": None}]}]}],
        "program": {}}
listed = {"WORK96": 1.0, "WORK99": 0.5, "WORK98": 0.5}
steps = {"Monterey Peninsula College": {"steps": [{"kind": "or_units", "parent_from_block": True, "source_words": "x"}]}}
check("before: the state file prices the group at 0.5-1", S.program_units(acct, listed)[0] == (0.5, 1.0))
new, notes = R.reconcile(acct, acct_text, "Monterey Peninsula College", "Certificate of Achievement", steps=steps)
check("the course and its alternatives take the block's 2", S.program_units(new, listed)[0] == (2, 2))
check("both changes are noted", {n["field"] for n in notes} == {"course_units", "alternative_units"})
plain = {"Monterey Peninsula College": {"steps": [{"kind": "or_units", "source_words": "x"}]}}
check("without parent_from_block, a parent without units still gives nothing",
      R.reconcile(acct, acct_text, "Monterey Peninsula College", "Certificate of Achievement", steps=plain)[1] == [])
check("a page with no 'or CODE' row changes nothing",
      R.reconcile(acct, "Select one of the following: 2 WORK 96 WORK 99", "Monterey Peninsula College",
                  "Certificate of Achievement", steps=steps)[1] == [])
two = json.loads(json.dumps(acct))
two["blocks"][0]["stated"] = {"min": 2, "max": 4}
check("a block stating a range changes nothing",
      R.reconcile(two, acct_text, "Monterey Peninsula College", "Certificate of Achievement", steps=steps)[1] == [])

print("Las Positas's local degrees (S634; Sam, Open Asks Sheet 180 card 4: count)")
check("local kinds", R.awards_match("local_aa", "A.A. Degree") and R.awards_match("local_as", "A.S. Degree")
      and not R.awards_match("local_aa", "A.S. Degree") and not R.awards_match("local_as", "A.A. Degree")
      and not R.awards_match("local_aa", "A.A- T Degree") and not R.awards_match("local_as", "A.S. T Degree")
      and not R.awards_match("local", "AA-T") and R.awards_match("local", "Associate in Science"))
lpc_text = ("Total Units for the Major \u00b7 24.0\nAdditional General Education and Elective Units\nSee the Las Positas "
            "College General Education (LPC-GE) pattern or the California General Education Transfer Curriculum "
            "(Cal-GETC) pattern for a listing of areas and courses. Double counting courses in GE and the major is "
            "permissible. Elective units must be degree applicable.\n36.0 \u00b7 Total: 60.0")
lpc = {"program": {"ge_pattern": "LPC-GE or Cal-GETC", "ge_units": {"min": None, "max": None},
                   "degree_total": {"min": 60, "max": 60}, "electives_fill_degree": False}, "blocks": []}
aa, aa_notes = R.reconcile(lpc, lpc_text, "Las Positas College", "A.A. Degree", steps=R.load_steps())
as_, _n = R.reconcile(lpc, lpc_text, "Las Positas College", "A.S. Degree", steps=R.load_steps())
check("an A.A. takes 28, an A.S. 22", aa["program"]["ge_units"] == {"min": 28, "max": 28}
      and as_["program"]["ge_units"] == {"min": 22, "max": 22})
check("the note says the figure is summed from the areas",
      any(n["field"] == "ge_units" and "SUMMED FROM THE AREAS" in n["words"] for n in aa_notes))
check("the page's words set the overlap and the electives fill",
      aa["program"].get("ge_overlap") is True and aa["program"]["electives_fill_degree"] is True)
tr, tr_notes = R.reconcile(lpc, lpc_text, "Las Positas College", "A.A- T Degree", steps=R.load_steps())
check("a transfer degree takes none of the local steps", tr_notes == [])
check("a figure the reading filed stands",
      R.reconcile({"program": dict(lpc["program"], ge_units={"min": 16, "max": 19}), "blocks": []}, lpc_text,
                  "Las Positas College", "A.S. Degree", steps=R.load_steps())[0]["program"]["ge_units"] == {"min": 16, "max": 19})

print("Alameda's semester layouts (S634; Sam, Open Asks Sheet 180 card 2: count)")
def _sem(name, stated, units):
    return {"name": name, "rule": "all", "stated": {"min": stated, "max": stated},
            "courses": [{"code": "X %d" % i, "units": u, "units_max": None} for i, u in enumerate(units)]}
sem = {"program": {"total_units": {"min": None, "max": None}, "degree_total": {"min": None, "max": None}},
       "blocks": [_sem("FIRST SEMESTER", 10, [4, 6]), _sem("SECOND SEMESTER", 12, [4, 4, 4]),
                  {"name": "Recommended prior to enrollment", "rule": "recommended", "courses": []}]}
sem_text = "FIRST SEMESTER ... 10.00 SECOND SEMESTER ... 12.00"
ALA = "College of Alameda"
got, got_notes = R.reconcile(sem, sem_text, ALA, "Certificate of Achievement", steps=R.load_steps())
check("the subtotals' sum is the total, marked summed",
      got["program"]["total_units"] == {"min": 22.0, "max": 22.0} and got["program"].get("total_units_summed") is True
      and "SUMMED FROM THE SEMESTERS" in got_notes[0]["words"])
bad = json.loads(json.dumps(sem)); bad["blocks"][1]["courses"][0]["units"] = 3
check("a semester that does not add to its subtotal changes nothing",
      R.reconcile(bad, sem_text, ALA, "Certificate of Achievement", steps=R.load_steps())[1] == [])
held = json.loads(json.dumps(sem)); held["program"]["degree_total"] = {"min": 61, "max": 64}
check("a record holding a printed total changes nothing",
      R.reconcile(held, sem_text, ALA, "A.S. Degree", steps=R.load_steps())[1] == [])
other = json.loads(json.dumps(sem)); other["blocks"].append({"name": "Electives", "rule": "choose_units", "courses": []})
check("another block asking for units changes nothing",
      R.reconcile(other, sem_text, ALA, "Certificate of Achievement", steps=R.load_steps())[1] == [])
check("a heading the page does not print changes nothing",
      R.reconcile(sem, "FIRST SEMESTER only", ALA, "Certificate of Achievement", steps=R.load_steps())[1] == [])

print("De Anza's GE patterns (S638; college page read 43062313447)")
DA = "De Anza College"
da_text = ("Total Required: 90 Units. De Anza General Education or California General Education Transfer Curriculum "
           "(Cal-GETC) and electives as needed to reach at least 90 units.")
da = {"program": {"ge_pattern": "De Anza General Education or California General Education Transfer Curriculum (Cal-GETC)",
                  "ge_units": {"min": None, "max": None}, "degree_total": {"min": 90, "max": 90},
                  "electives_fill_degree": True}, "blocks": []}
loc, loc_notes = R.reconcile(da, da_text, DA, "A.A. Degree", steps=R.load_steps())
trn, _n = R.reconcile(dict(da, program=dict(da["program"], ge_pattern="Cal-GETC")), "Cal-GETC and electives", DA,
                      "A.A- T Degree", steps=R.load_steps())
check("a local degree keeps the local pattern's printed 29-41, a transfer degree Cal-GETC's 45-58",
      loc["program"]["ge_units"] == {"min": 29, "max": 41} and trn["program"]["ge_units"] == {"min": 45, "max": 58})
check("'electives as needed to reach at least 90 units' makes the 90 a floor; a page without the words keeps it exact",
      loc["program"].get("degree_total_minimum") is True and not trn["program"].get("degree_total_minimum"))
# 46339 (S638): a 64-unit major with the local 29-41 runs past the 90; the page calls the 90 a floor, so it meets it.
big = json.loads(json.dumps(loc)); big["blocks"] = [{"name": "Major", "rule": "all", "courses": [{"code": "X 1", "units": 64}]}]
check("a major past the floor with its GE range meets the 90",
      S.score(big, [{"code": "X 1", "units": 64}], da_text, "A.S. Degree")["arithmetic"]["pass"])
check("the note cites the college's own page", any("29–41 quarter units" in n["words"] for n in loc_notes))
check("a certificate takes neither", R.reconcile(da, da_text, DA, "Certificate of Achievement", steps=R.load_steps())[1] == [])
check("a figure the reading filed stands",
      R.reconcile({"program": dict(da["program"], ge_units={"min": 33, "max": 33}), "blocks": []}, da_text, DA,
                  "A.S. Degree", steps=R.load_steps())[0]["program"]["ge_units"] == {"min": 33, "max": 33})

print("Orange Coast's REQUIREMENTS tab wordings (S639; college page read 43134559539)")
OCC = "Orange Coast College"
SEQ = "\n[Tab: PROGRAM SEQUENCE]\nProgram Sequence\nSemester 1\tUnits\nOCC AS GE AREA 4 - CHOOSE ONE \t3\nUnits\t16\nTotal Units\t60-61\n"
acct = ("[Tab: REQUIREMENTS]\nCIS A111/A111H\tIntroduction to Computer Information Systems\t3\nTotal Major Units\t35\n"
        "OCC AS General Education 1,2\tUp to 21\nTransferable electives as needed to satisfy unit requirements\tvaries\n"
        "Total Minimum Degree Units - OCC AS GE\t60\n1\nSome program major units may also meet GE requirements.\n2\n"
        "Cal-GETC pattern (up to 34 units) may be substituted." + SEQ)
film = ("[Tab: REQUIREMENTS]\nProgram Major Units\t29\nOCC AA General Education and Multicultural Requirements 2,3,4\tUp to 27\n"
        "Degree-applicable electives to satisfy unit requirement\tVaries\nTotal Minimum Degree Units - OCC AA GE\t60" + SEQ)
amt = ("[Tab: REQUIREMENTS]\nAMT A181\tAirframe Communication and Navigation Systems - FAA\t2\nTotal Major Units\t63\n"
       "OCC AS General Education 1\t21\nTotal Units\t84\nProgram approved by the Federal Aviation Administration (FAA).\n"
       "[Tab: PROGRAM SEQUENCE]\nTotal Units\t84-86\n")
radt = ("[Tab: REQUIREMENTS]\nProgram Prerequisites\nCourse List Units\nRADT A100\tRadiologic Physics\t2\nTotal Units\t9.5\n"
        "RADT A275\tRadiographic Positioning and Critique 4\t2\nTotal Program Units\t67.5\n"
        "General Education Breadth for AS Degree: 21 units 2, 3\t18.0\nTotal Units\t85.5\n2\n"
        "subtotal has double-counted units removed\n[Tab: PROGRAM SEQUENCE]\nTotal Units\t85.5-87.5\n")
jour = ("[Tab: REQUIREMENTS]\nTotal Major Units\t19-21\nCalifornia General Education Transfer Curriculum (Cal-GETC) 1\tup to 34\n"
        "Transferable electives as needed to satisfy unit requirement \tVaries\nTotal Degree Units\t60\n"
        "[Tab: PROGRAM SEQUENCE - CAL-GETC]\nTotal Units\t60-64\n")
def occ(ge_pattern, **prog):
    base = {"ge_pattern": ge_pattern, "total_units": {"min": None, "max": None}, "degree_total": {"min": None, "max": None},
            "ge_units": {"min": None, "max": None}, "electives_fill_degree": False}
    base.update(prog)
    return {"program": base, "blocks": []}
def occ_run(rec, text, award):
    return R.reconcile(rec, text, OCC, award, steps=R.load_steps())
got, _n = occ_run(occ("OCC AS General Education", total_units={"min": 35, "max": 35}, degree_total={"min": 60, "max": 60}),
                  acct, "A.S. Degree")
check("Accounting 03960: 'Up to 21' with a capital U gives GE up to 21 and the 60 as a floor",
      got["program"]["ge_units"] == {"min": None, "max": 21} and got["program"].get("degree_total_minimum") is True)
got, _n = occ_run(occ("OCC AS General Education"), acct, "A.S. Degree")
check("the PROGRAM SEQUENCE tab's 'Total Units 60-61' is never the degree total",
      got["program"]["degree_total"] == {"min": 60, "max": 60} and got["program"]["total_units"] == {"min": 35, "max": 35})
got, _n = occ_run(occ("OCC AA General Education", total_units={"min": 29, "max": 29}, degree_total={"min": 60, "max": 60}),
                  film, "A.A. Degree")
check("Film & Television 03967: a local A.A. takes OCC AA GE's 'Up to 27', the 60 as a floor, and electives",
      got["program"]["ge_units"] == {"min": None, "max": 27} and got["program"].get("degree_total_minimum") is True
      and got["program"]["electives_fill_degree"] is True)
check("an A.S. never takes the A.A.'s 27",
      occ_run(occ("OCC AA General Education"), film, "A.S. Degree")[0]["program"]["ge_units"] == {"min": None, "max": None})
got, _n = occ_run(occ("OCC AS GE", degree_total={"min": 84, "max": 84}), amt, "A.S. Degree")
check("Airframe & Powerplant 03977: an exact 'OCC AS General Education 1 21' is 21, and 84 stays exact",
      got["program"]["ge_units"] == {"min": 21, "max": 21} and got["program"]["total_units"] == {"min": 63, "max": 63}
      and not got["program"].get("degree_total_minimum"))
got, _n = occ_run(occ("OCC AS GE"), amt, "A.S. Degree")
check("the Total Units line after the GE line is the degree total, not the sequence's 84-86",
      got["program"]["degree_total"] == {"min": 84, "max": 84})
got, _n = occ_run(occ("OCC AS GE"), radt, "A.S. Degree")
check("Radiologic Technology 04008: the GE Breadth line's printed 18.0 and the 85.5 after it, never the prerequisites' 9.5",
      got["program"]["ge_units"] == {"min": 18, "max": 18} and got["program"]["degree_total"] == {"min": 85.5, "max": 85.5}
      and got["program"]["total_units"] == {"min": 67.5, "max": 67.5})
check("Radiologic Technology adds up: 67.5 and 18.0 make 85.5",
      S.score(dict(got, blocks=[{"name": "Major", "rule": "all", "courses": [{"code": "RADT A100", "units": 67.5}]}]),
              [{"code": "RADT A100", "units": 67.5}], radt, "A.S. Degree")["arithmetic"]["status"] == "equal")
got, _n = occ_run(occ("Cal-GETC", total_units={"min": 19, "max": 21}, degree_total={"min": 60, "max": 60}), jour, "A.A- T Degree")
check("Journalism AA-T 32179: a transfer degree takes Cal-GETC's 'up to 34', and no electives flag",
      got["program"]["ge_units"] == {"min": None, "max": 34} and got["program"]["electives_fill_degree"] is False)
check("a local degree never takes the transfer degree's 34",
      occ_run(occ("Cal-GETC"), jour, "A.S. Degree")[0]["program"]["ge_units"] == {"min": None, "max": None})
# The degree-total step's guards (#3133 review): the "Total Units" line counts only on the line after the GE line (or
# the electives line after it), and only when the figure closes the line. Each page below fills nothing without them.
no_floor = ("[Tab: REQUIREMENTS]\nProgram Prerequisites\nRADT A100\tRadiologic Physics\t2\nTotal Units\t9.5\n"
            "Total Program Units\t67.5\n" + SEQ)
check("a page with no Total Minimum Degree Units line and no Total Units after its GE line leaves the degree total empty",
      occ_run(occ("OCC AS GE"), no_floor, "A.S. Degree")[0]["program"]["degree_total"] == {"min": None, "max": None})
footnote = ("[Tab: REQUIREMENTS]\nTotal Major Units\t63\nOCC AS General Education 1\t21\n1\n"
            "Cal-GETC pattern (up to 34 units) may be substituted.\nTotal Units\t84\n[Tab: PROGRAM SEQUENCE]\n")
check("a GE line, then a footnote, then Total Units: nothing fills the degree total",
      occ_run(occ("OCC AS GE"), footnote, "A.S. Degree")[0]["program"]["degree_total"] == {"min": None, "max": None})
trailing = ("[Tab: REQUIREMENTS]\nTotal Major Units\t63\nOCC AS General Education 1\t21\n"
            "Total Units\t60 or more with electives\n[Tab: PROGRAM SEQUENCE]\n")
check("a Total Units figure the line runs on past is not the degree total (the end-of-line anchor)",
      occ_run(occ("OCC AS GE"), trailing, "A.S. Degree")[0]["program"]["degree_total"] == {"min": None, "max": None})
check("a certificate is left alone", occ_run(occ(None), acct, "Certificate of Achievement")[1] == [])
check("a GE figure the reading filed stands",
      occ_run(occ("OCC AS GE", ge_units={"min": 18, "max": 18}), acct, "A.S. Degree")[0]["program"]["ge_units"] == {"min": 18, "max": 18})

print("Los Angeles City's degree headings (S639; college page read 43134671935)")
LAC = "Los Angeles City College"
LAC_DIR = os.path.join(ROOT, "kb", "program_requirements_college", "los_angeles_city", "records")


def as_read(path):
    """The filed record as the reading left it: a reconcile run files the record with its steps applied
    and each note's prior value (reconcile 43138495821 filed 02718 with the 18-27 and the floor), so the
    tests put each noted field back to what it was."""
    with open(path) as fh:
        filed = json.load(fh)
    prog = filed["record"]["program"]
    for n in filed.get("reconciled") or []:
        if n.get("field") in prog or n.get("field") in ("ge_units", "degree_total_minimum"):
            prog[n["field"]] = n.get("was")
    return filed


bus = as_read(os.path.join(LAC_DIR, "02718.json"))
cin = as_read(os.path.join(LAC_DIR, "02729.json"))
# pdf page 76 as pypdf gives it ("T otal" split), Business Administration's heading over its own certificate's.
bus_text = ("LACC 2026-2027 COLLEGE CATALOG 75\nABOUT OUR CAREER AND ACADEMIC PATHWAYS\nBusiness Administration\n"
            "Associate of Arts (AA) Degree\nMajor Units: 39  T otal Units: Minimum of 60\n"
            "(State Code: 02718; TOP CODE: 050100; Academic Plan: C002718C)\nThe Business Administration curriculum is "
            "designed for students\nPROGRAM STUDENT LEARNING OUTCOMES\nPROGRAM REQUIREMENTS\nMAJOR CORE COURSES (27 UNITS)\n"
            "REAL ES 021 REAL ESTATE ECONOMICS  ......................... 3\nBusiness Administration\n"
            "Certificate of Achievement\nMajor Units: 22\n(State Code: 21609; TOP Code: 050100; Academic Plan: C021609D)")
got, got_notes = R.reconcile(bus["record"], bus_text, LAC, bus["award"], steps=R.load_steps())
gp = got["program"]
check("a local degree's 'Minimum of 60' is a floor and its general education the printed 18-27",
      gp.get("degree_total_minimum") is True and gp["ge_units"] == {"min": 18, "max": 27}
      and all("Minimum of 60" in n["words"] for n in got_notes) and any("18-27 units" in n["words"] for n in got_notes))
deg = S.degree_check(gp, (60.0, 60.0), 39.0, 39.0, [], bus_text, bus["award"])
was = S.degree_check(bus["record"]["program"], (60.0, 60.0), 39.0, 39.0, [], bus_text, bus["award"])
check("Business Administration 02718 reads unequal as filed and equal after", was["status"] == "unequal" and deg["pass"])
check("the certificate below it on the page is left alone",
      R.reconcile(bus["record"], bus_text, LAC, "Certificate of Achievement requiring 16S/24Q to fewer than 30S/45Q units",
                  steps=R.load_steps())[1] == [])
check("a transfer degree's heading takes neither step",
      R.reconcile(bus["record"], bus_text, LAC, "A.A- T Degree", steps=R.load_steps())[1] == [])
# pdf page 185: the Film AS-T's requirements, then Cinema Production's heading. The filed record began past its own
# heading and reads it as "PROGRAM REQUIREMENTS"; the scope from there runs into Cinema's heading, so the record holding
# no degree total is what keeps the step out.
cin_text = ("184 LACC 2026-2027 COLLEGE CATALOG\nABOUT OUR CAREER AND ACADEMIC PATHWAYS\n2. General Education: Completion of "
            "the California General Edu -\ncation Transfer Curriculum (CalGETC) course requirements,\nPROGRAM REQUIREMENTS\n"
            "MAJOR CORE COURSES (SELECT 6 UNITS)\nT V 001 EVOLUTION OF TELEVISION  ........................ 3\nUSED\n"
            "Cinema Production\nAssociate in Arts (AA) Degree\nMajor Units: 36  T otal Units: Minimum of 60\n"
            "(State Code: 02729: TOP Code: 061220; Academic Plan: C002729C)")
check("a record read from past its own heading, holding no degree total, takes nothing from the next heading",
      cin["record"]["program"]["section_heading"] == "PROGRAM REQUIREMENTS"
      and R.reconcile(cin["record"], cin_text, LAC, cin["award"], steps=R.load_steps())[1] == [])
other = json.loads(json.dumps(bus["record"])); other["program"]["section_heading"] = "Journalism Associate of Arts (AA) Degree"
check("a heading the page does not print reads nothing", R.reconcile(other, bus_text, LAC, bus["award"], steps=R.load_steps())[1] == [])
held = json.loads(json.dumps(bus["record"])); held["program"]["ge_units"] = {"min": 21, "max": 21}
check("a figure the reading filed stands",
      R.reconcile(held, bus_text, LAC, bus["award"], steps=R.load_steps())[0]["program"]["ge_units"] == {"min": 21, "max": 21})
check("only_with on a set step: a record without the named field is left alone",
      R.reconcile({"program": {"ge_units": {"min": None, "max": None}}, "blocks": [{"courses": [{"code": "X 1"}]}]}, "Z 9",
                  "T", "A.A. Degree", steps={"T": {"steps": [{"kind": "set", "field": "ge_units", "value": {"min": 1, "max": 1},
                                                             "pattern": "Z 9", "only_with": "degree_total"}]}})[1] == [])

print("Los Angeles City's heading above its State Code line (S639; reconcile 43136137275 held 14 of the 24)")
import _program_requirements_college as C  # noqa: E402
# pdf page 76 as pypdf gives it (page read 43134671935): the running header, then the heading, then the State Code line.
lac_76 = ("LACC 2026-2027 COLLEGE CATALOG 75\nABOUT OUR CAREER AND ACADEMIC PATHWAYS\nBusiness Administration\n"
          "Associate of Arts (AA) Degree\nMajor Units: 39  T otal Units: Minimum of 60\n"
          "(State Code: 02718; TOP CODE: 050100; Academic Plan: C002718C)\nThe Business Administration curriculum is designed\n"
          "PROGRAM STUDENT LEARNING OUTCOMES\nPROGRAM REQUIREMENTS\nMAJOR CORE COURSES (27 UNITS)\n"
          "ACCTG 021 BOOKKEEPING AND ACCOUNTING I  .................. 3\nBUS 001 INTRODUCTION TO BUSINESS  ....... 3\n"
          "BUS 017 COMPUTER USES FOR BUSINESS  ................... 3\n")
lac_prog = {"title": "BUSINESS ADMINISTRATION", "award": "A.A. Degree", "control_number": "02718"}
lac_courses = [{"code": c} for c in ("ACCTG 21", "BUS 1", "BUS 17")]
lac_above = steps_now = R.load_steps()[LAC]["heading_above_code"]
plain = C.pdf_best("https://x.edu/lacc.pdf", [lac_76], lac_prog, lac_courses, "pypdf")
kept = C.pdf_best("https://x.edu/lacc.pdf", [lac_76], lac_prog, lac_courses, "pypdf", None, lac_above)
check("without the college's setting the cut opens on the State Code line, as every other college's does",
      plain and plain["text"].startswith("[page 1]\n(State Code: 02718"))
check("with it the text keeps the title, the award and the 'Minimum of 60' line, and stops at the running header",
      kept and kept["text"].startswith("[page 1]\nBusiness Administration\nAssociate of Arts (AA) Degree\nMajor Units: 39")
      and "ABOUT OUR CAREER" not in kept["text"])
check("the codes the text finds stay the same (only their offsets move)",
      sorted(kept["found"]) == sorted(plain["found"]) and kept["coverage"] == plain["coverage"])
bus_filed = as_read(os.path.join(LAC_DIR, "02718.json"))
got, got_notes = R.reconcile(bus_filed["record"], kept["text"], LAC, bus_filed["award"], steps=R.load_steps())
check("on the kept text the steps fire for Business Administration 02718; on the cut text they cannot",
      got_notes and R.reconcile(bus_filed["record"], plain["text"], LAC, bus_filed["award"], steps=R.load_steps())[1] == [])
# A heading mid-page: the lines above it end the previous program's list; a line naming a listed course stops the walk.
mid = ("ENGLISH 270 SCIENCE FICTION – FANTASY  ....... 3\nOR ANY LIST A COURSE NOT ALREADY USED\nEnglish\n"
       "Associate of Arts (AA) Degree\nMajor Units: 21  T otal Units: Minimum of 60\n(State Code: 02751; TOP Code: 150100)\n")
start = mid.index("(State Code")
at = C.heading_above(mid, start, lac_above, [{"code": "ENGLISH 270"}])
check("the walk stops below a line naming a listed course",
      mid[at:].startswith("OR ANY LIST A COURSE") and "ENGLISH 270" not in mid[at:])
check("no setting, no walk", C.heading_above(mid, start, None, []) == start)
# A listed course two lines above the heading, inside the four-line reach: the walk stops below it.
near = ("ART 370 BEGINNING SCULPTURE  ....... 3\nSculpture Certificate\nMajor Units: 12\n"
        "(State Code: 44962; TOP Code: 100200)\n")
near_at = C.heading_above(near, near.index("(State Code"), lac_above, [{"code": "ART 370"}])
check("a listed course within reach above the heading is left out of the cut",
      near[near_at:].startswith("Sculpture Certificate\n") and "ART 370" not in near[near_at:])
# Six plain lines above the State Code line: the cut keeps exactly the four the college's setting names.
plain6 = "one\ntwo\nthree\nfour\nfive\nsix\n(State Code: 02718; TOP CODE: 050100)\n"
p6_at = C.heading_above(plain6, plain6.index("(State Code"), lac_above, [])
check("the walk keeps exactly its four lines and no more",
      lac_above["lines"] == 4 and plain6[p6_at:].startswith("three\nfour\nfive\nsix\n(State Code"))
rn = as_read(os.path.join(LAC_DIR, "14274.json"))
rn_text = ("Registered Nursing\nAssociate of Science (AS) Degree\nMajor Units: 36  T otal Units: Minimum of 72\n"
           "(State Code: 14274; TOP Code: 123010)\n")
check("Registered Nursing 14274's heading prints 'Minimum of 72': neither step reads it",
      rn["record"]["program"]["degree_total"] == {"min": 72, "max": 72}
      and R.reconcile(rn["record"], rn_text, LAC, rn["award"], steps=R.load_steps())[1] == [])
check("a heading printing 'T otal Units: 72' over 02718's record: neither step reads it",
      R.reconcile(bus_filed["record"], lac_76.replace("Minimum of 60", "72"), LAC, bus_filed["award"],
                  steps=R.load_steps())[1] == [])
check("a heading printing 'T otal Units: 60' with no 'Minimum of': neither step reads it (the floor rests on those words)",
      R.reconcile(bus_filed["record"], lac_76.replace("Minimum of 60", "60"), LAC, bus_filed["award"],
                  steps=R.load_steps())[1] == [])
check("no other college names heading_above_code",
      [k for k, v in R.load_steps().items() if v.get("heading_above_code")] == [LAC])

print("Rio Hondo's transfer degrees (S639; college page reads 43137946308 and 43139467468; the areas summed, Sam's count extended)")
RH = "Rio Hondo College"
# Sociology AA-T 30648 (node 24312), as the capture joins it (read 43137946308).
rh_text = ("SOCIOLOGY - Associate in Arts for Transfer\nRequirements\nRequired Courses\nUnits: 6.0\n"
           "LIST B: Choose ONE of the following courses or one not used above:\nUnits: 3.0\nSOC 105\n"
           "Cal-GETC Pattern (units will vary)\nTransferable Electives as needed to reach 60 transferable units\n"
           "DEGREE TOTAL 60 units\nTotal : 19.0\nSummary\n"
           "Completion of the California General Education Transfer Curriculum (Cal-GETC).")


def _rh(cn):
    """The filed record as the reading left it: a reconcile run's notes undone (each names what it was)."""
    with open(os.path.join(ROOT, "kb/program_requirements_college/rio_hondo/records/%s.json" % cn)) as fh:
        filed = json.load(fh)
    rec = json.loads(json.dumps(filed["record"]))
    for n in reversed(filed.get("reconciled") or []):
        rec["program"][n["field"]] = n["was"]
    return dict(filed, record=rec)


rh_filed = _rh("30648")
rh = rh_filed["record"]
got, got_notes = R.reconcile(rh, rh_text, RH, rh_filed["award"], steps=R.load_steps())
check("a transfer degree naming 'Cal-GETC Pattern (units will vary)' takes the catalog's Cal-GETC figure",
      got["program"]["ge_units"] == {"min": 34, "max": 34} and got_notes and got_notes[0]["field"] == "ge_units")
check("the note cites Rio Hondo's own catalog", any("SUMMED FROM THE AREAS" in n["words"] for n in got_notes))
closed = [{"code": c["code"], "units": None} for b in rh["blocks"] for c in b["courses"]]
check("Sociology AA-T reads equal: 19 + 34 with transferable electives to 60",
      S.score(got, closed, rh_text, rh_filed["award"])["arithmetic"]["pass"]
      and not S.score(rh, closed, rh_text, rh_filed["award"])["arithmetic"]["pass"])
# Social Work 33785: the state file says A.A., its page is the AA-T's (shared with 39982).
sw = _rh("33785")
check("a local A.A. read from a transfer page takes none",
      R.reconcile(sw["record"], rh_text, RH, sw["award"], steps=R.load_steps())[1] == [])
check("a certificate takes none", R.reconcile(rh, rh_text, RH, "Certificate of Achievement", steps=R.load_steps())[1] == [])
check("a page without the line takes none",
      R.reconcile(rh, rh_text.replace("Cal-GETC Pattern (units will vary)", ""), RH, rh_filed["award"],
                  steps=R.load_steps())[1] == [])
check("a figure the reading filed stands",
      R.reconcile({"program": dict(rh["program"], ge_units={"min": 37, "max": 39}), "blocks": rh["blocks"]}, rh_text, RH,
                  rh_filed["award"], steps=R.load_steps())[0]["program"]["ge_units"] == {"min": 37, "max": 39})
# Negative pages (review of #3136): the pattern's two halves, each alone.
check("a page printing 'Cal-GETC Pattern' without '(units will vary)' takes none",
      R.reconcile(rh, rh_text.replace("Cal-GETC Pattern (units will vary)", "Cal-GETC Pattern"), RH, rh_filed["award"],
                  steps=R.load_steps())[1] == [])
check("a page whose 'units will vary' sits on an electives line, with no Cal-GETC line, takes none",
      R.reconcile(rh, rh_text.replace("Cal-GETC Pattern (units will vary)", "Transferable Electives (units will vary)")
                  .replace("(Cal-GETC)", ""), RH, rh_filed["award"], steps=R.load_steps())[1] == [])

failed = [n for n, ok in results if not ok]
for n, ok in results:
    print(("ok   " if ok else "FAIL ") + n)
print("%d/%d checks passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
