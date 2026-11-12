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

print("Victor Valley's noncredit course hours from the course descriptions (S639; college page read 43134526902)")
VV = "Victor Valley College"
VV_DIR = os.path.join(ROOT, "kb", "program_requirements_college", "victor_valley", "records")


def vv_filed(cn):
    with open(os.path.join(VV_DIR, cn + ".json")) as fh:
        return json.load(fh)


# The page text as the capture reads Career Success 42728 (the read's own lines): a total, 0.0 beside each course.
vv_text = ("[Tab: REQUIREMENTS]\nTotal Certificate Hours: 96.0 - 108.0\nCourse List\nCode\nTitle\nUnits\nRequired Courses\n"
           "WKPR 011\tPersonal Growth, Development and Wellness\t0.0\nWKPR 012\tDecision Making and Problem Solving in the "
           "Workplace\t0.0\nWKPR 014\tComminication Skills in the Workforce\t0.0\nTotal Units\t0")
vv_steps = R.load_steps()
check("Victor Valley's entry has no college-level awards gate (the Redwoods lesson) and one course_hours step",
      not vv_steps[VV].get("awards") and [s["kind"] for s in vv_steps[VV]["steps"]] == ["course_hours"])
with open(os.path.join(ROOT, "kb", vv_steps[VV]["steps"][0]["hours_file"])) as fh:
    vv_hours = json.load(fh)
check("the hours file keeps noncredit courses only: ESL 012A's 108, never ESL 12A's 54 (3.0 Units, one normalized code)",
      vv_hours["hours"].get("ESL12A") == [108.0, 108.0] and vv_hours["hours"].get("WKPR11") == [36.0, 36.0]
      and vv_hours["hours"].get("COSM101") == [279.0, 279.0] and "Lecture Hours: 36.0" in vv_hours["words"]["WKPR11"])
cs = vv_filed("42728")
new, notes = R.reconcile(cs["record"], vv_text, VV, cs["award"], steps=vv_steps)
check("Career Success's three WKPR courses take the 36 hours each description prints",
      [c["units"] for c in new["blocks"][0]["courses"]] == [36.0, 36.0, 36.0]
      and notes and notes[0]["field"] == "course_hours" and "43134526902" in notes[0]["words"])
arith = S.score(new, [], vv_text, cs["award"])["arithmetic"]
check("108 hours of single-figure courses meets the top of 96.0 - 108.0 (meets_top, S639)",
      arith["status"] == "equal" and arith["computed"] == [108.0, 108.0] and arith["pass"] and arith.get("meets_top"))
check("the filed record is left as filed", cs["record"]["blocks"][0]["courses"][0]["units"] is None)

print("meets_top: an hours record's single-figure courses add to its printed range's top (S639)")


def hrs(units, total, measure="hours", extra=None):
    courses = [dict({"code": "WKPR %d" % (10 + i), "units": u}, **(extra or {}).get(i, {})) for i, u in enumerate(units)]
    return {"program": {"measure": measure, "total_units": {"min": total[0], "max": total[1]}},
            "blocks": [{"name": "Required Courses", "rule": "all", "courses": courses}]}


top = S.score(hrs([36, 36, 36], (96, 108)), [], None, "Noncredit program")["arithmetic"]
check("hours, 36 + 36 + 36 against 96 - 108: passes as meets_top", top["pass"] and top.get("meets_top"))
same_units = S.score(hrs([36, 36, 36], (96, 108), measure="units"), [], None, "Certificate of Achievement")["arithmetic"]
check("a units record of the same shape stays unequal (Sheet 120 card 1, narrow, governs units)",
      same_units["status"] == "unequal" and not same_units.get("meets_top"))
inside = S.score(hrs([32, 36, 36], (96, 108)), [], None, "Noncredit program")["arithmetic"]
check("an hours sum inside the range, short of its top (104 of 96 - 108), stays unequal",
      inside["status"] == "unequal" and not inside.get("meets_top"))
var = hrs([36, 36, 36], (96, 108), extra={0: {"units": 32, "units_max": 36}})
check("a variable-hours course (32-36) reads as it does today: 104-108 against 96 - 108 is unequal",
      S.score(var, [], None, "Noncredit program")["arithmetic"]["status"] == "unequal"
      and not S.hours_meets_top(var, (96.0, 108.0), 108.0, 108.0))
rep = hrs([36, 36, 36], (96, 108), extra={0: {"times": 1}})
check("a repeated course is no single figure", not S.hours_meets_top(rep, (96.0, 108.0), 108.0, 108.0))
one = S.score(hrs([108, 108], (216, 216)), [], None, "Noncredit program")["arithmetic"]
check("a total of one figure still reads equal, not meets_top", one["pass"] and not one.get("meets_top"))
check("program_verdict without the record (the rescorers' call) is unchanged",
      S.program_verdict({}, (96.0, 108.0), 108.0, 108.0) == {"pass": False, "status": "unequal"})
import _program_requirements_rescore as RS  # noqa: E402
check("the rescorer moves no filed score: an unequal hours record at its top stays as filed",
      RS.rescore({"award": "Noncredit program", "record": hrs([36, 36, 36], (96, 108)),
                  "score": {"arithmetic": {"status": "unequal", "against": "program", "computed": [108.0, 108.0],
                                           "stated": [96.0, 108.0], "pass": False}}}) is None)
for cn in ("42907", "43736"):
    one = vv_filed(cn)
    got, _n = R.reconcile(one["record"], "Total Certificate Hours: 216.0", VV, one["award"], steps=vv_steps)
    check("%s: two 108-hour ESL courses add to 'Total Certificate Hours: 216.0' and pass arithmetic" % cn,
          S.score(got, [], "Total Certificate Hours: 216.0", one["award"])["arithmetic"]["pass"])
for cn in ("37006", "38352"):
    # Sheet 85 card 4 (Sam, 2026-10-16): AUTO 82.0 printed with no units; stays as read, unchecked, shown, flagged.
    one = vv_filed(cn)
    got, n37 = R.reconcile(one["record"], "AUTO 82.0\tTotal Units\t22", VV, one["award"], steps=vv_steps)
    check("%s (Sheet 85 card 4) is never changed: a credit record is not measured in hours" % cn,
          n37 == [] and got is one["record"]
          and [c["units"] for c in got["blocks"][0]["courses"] if c["code"] == "AUTO 82.0"] == [None])
filled = json.loads(json.dumps(cs["record"]))
filled["blocks"][0]["courses"][0]["units"] = 32
got = R.reconcile(filled, vv_text, VV, cs["award"], steps=vv_steps)[0]
check("an hours figure the reading gave stands", got["blocks"][0]["courses"][0]["units"] == 32
      and got["blocks"][0]["courses"][1]["units"] == 36.0)
units_rec = {"program": {"measure": "units", "total_units": {"min": 3, "max": 3}},
             "blocks": [{"name": "Required", "rule": "all", "courses": [{"code": "ESL 12A", "units": None}]}]}
check("a credit record listing ESL 12A takes no hours", R.reconcile(units_rec, "x", VV, "A.A. Degree", steps=vv_steps)[1] == [])
check("another college's hours record takes no Victor Valley hours",
      R.reconcile(cs["record"], vv_text, "Hartnell College", cs["award"], steps=vv_steps)[1] == [])

failed = [n for n, ok in results if not ok]
for n, ok in results:
    print(("ok   " if ok else "FAIL ") + n)
print("%d/%d checks passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
