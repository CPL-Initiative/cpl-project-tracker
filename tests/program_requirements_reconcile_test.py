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
mus = json.load(open(os.path.join(ROOT, "kb", "program_requirements_college", "hartnell", "records", "43887.json")))["record"]
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

failed = [n for n, ok in results if not ok]
for n, ok in results:
    print(("ok   " if ok else "FAIL ") + n)
print("%d/%d checks passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
