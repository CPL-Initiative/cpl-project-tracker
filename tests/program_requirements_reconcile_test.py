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

failed = [n for n, ok in results if not ok]
for n, ok in results:
    print(("ok   " if ok else "FAIL ") + n)
print("%d/%d checks passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
