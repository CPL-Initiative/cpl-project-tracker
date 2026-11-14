#!/usr/bin/env python3
"""The no-closed-list lookup's census (kb/_harvest_ncl_lookup_census.py, S652; #3299 slice A).

WHY. The capture looks up a program with no closed list by title and award, and a college is looked up only
when the matcher finds its own closed-list programs on their filed pages (recall at NCL_FLOOR or above, and
none on another program's page). The census runs that test on the committed captures. A second reader of
#3300 measured the first matcher this way and found it 63% statewide and 0% at Cerritos; this file pins the
census's arithmetic on a fixture and its committed figure: no closed-list program in the committed captures
lands on another program's page. Run from repo root: python3 tests/harvest_ncl_lookup_census_test.py
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _harvest_ncl_lookup_census as N  # noqa: E402
import _program_requirements_college as C  # noqa: E402

failures, checks = [], [0]


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


def src(cn, title, award, url=None, method="sitemap_page", label_title=1.0, h1=None):
    return {"control_number": cn, "title": title, "award": award, "method": method if url else "no_closed_list",
            "source": {"url": url, "title": h1 or title, "h1": h1 or title,
                       "label": {"award": 1, "title": label_title}} if url else None}


B = "https://catalog.example.edu/programs/"
sources = [src("1", "Accounting", "A.S. Degree", B + "accounting-as/"),
           src("2", "Biology", "A.S. Degree", B + "biology-as/"),
           src("3", "Chemistry", "A.S. Degree", B + "chemistry-as/"),
           src("4", "History", "A.A. Degree", B + "history-aa/"),
           src("5", "Mathematics", "A.S. Degree", B + "economics-as/", label_title=0.0, h1="Economics"),
           src("6", "Nursing", "A.S. Degree", B + "p6/", h1="Nursing Overview Studies Extra"),
           src("7", "Welding Technology 1", "Certificate of Achievement", B + "welding-technology-1-ca/"),
           src("8", "Welding Technology 2", "Certificate of Achievement", B + "welding-technology-2-ca/"),
           src("9", "Spanish I", "A.A. Degree", B + "spanish-i-aa/"),
           src("10", "Spanish", "A.A. Degree", B + "spanish-aa/"),
           src("11", "Paralegal", "A.S. Degree")]
cap = {"college": "Example College", "platform": "courseleaf"}
r = N.college_census(sources, cap)
check(r["route"] == "site" and r["ncl"] == 1, "a site capture is tested and its no-closed-list programs counted: %r" % r)
check(r["tested"] == 9 and r["hits"] == 8 and r["false"] == 0 and r["recall"] == round(8 / 9, 3),
      "a program whose page the search's own label does not name (Mathematics on Economics) is not tested; one whose "
      "heading carries other words (Nursing) is a miss; numbered and roman siblings each find their own: %r" % r)
check(r["searches"] is (8 / 9 >= C.NCL_FLOOR), "a college at the floor or above is looked up")
r_pdf = N.college_census(sources, {"college": "X", "platform": "pdf"})
check(r_pdf["route"].startswith("pdf") and "tested" not in r_pdf, "a PDF capture is not looked up in this slice")

# The committed captures: the census runs on every one, and no program lands on another program's page.
full = N.census()
sw = full["statewide"]
check(sw["false"] == 0, "no closed-list program in the committed captures is matched to another program's page: %r"
      % [(k, c["false_matches"][:2]) for k, c in full["colleges"].items() if c.get("false")][:3])
check(sw["tested"] > 5000 and sw["recall"] is not None and sw["colleges_searched"] + sw["colleges_under_floor"]
      == sw["site_route"], "the census reads the committed captures whole: %r" % sw)

if failures:
    print("FAIL: harvest ncl lookup census (%d of %d)" % (len(failures), checks[0]))
    for f in failures:
        print("  -", f)
    sys.exit(1)
print("%d/%d checks passed: harvest ncl lookup census" % (checks[0], checks[0]))
