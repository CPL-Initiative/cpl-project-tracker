#!/usr/bin/env python3
"""The no-closed-list lookup's census (kb/_harvest_ncl_lookup_census.py, S652; #3299 slice A).

WHY. The capture looks up a program with no closed list by title and award, and a college is looked up only
when the matcher finds its own closed-list programs on their filed pages (recall at NCL_FLOOR or above, and
none on another program's page). The census runs that test on the committed captures. A second reader of
#3300 measured the first matcher this way and found it 63% statewide and 0% at Cerritos; this file pins the
census's arithmetic on a fixture and its committed figure: no closed-list program in the committed captures
lands on another program's page. It also pins the pages the lookup gives back (ncl_yield, S668): none moves a
holder whose filed record passes live. Run from repo root: python3 tests/harvest_ncl_lookup_census_test.py
"""
import json
import os
import sys
import tempfile

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
check(r["false_off_own"] == 0 and r["searches"] is False,
      "nine tested is under the minimum of ten, so the college is not looked up whatever its recall: %r" % r)
r10 = N.college_census(sources + [src("12", "Geology", "A.S. Degree", B + "geology-as/")], cap)
check(r10["tested"] == 10 and r10["hits"] == 9 and r10["searches"] is True,
      "ten tested at 90%% with no false match opens the lookup: %r" % r10)
r_pdf = N.college_census(sources, {"college": "X", "platform": "pdf"})
check(r_pdf["route"].startswith("pdf") and "tested" not in r_pdf, "a PDF capture is not looked up in this slice")

# The committed captures: the census runs on every one, and no program lands on another program's page.
full = N.census()
sw = full["statewide"]
check(sw["false"] == 0 and sw["false_off_own"] == 0,
      "no closed-list program in the committed captures is matched to another program's page, nor found anywhere "
      "when its own page is set aside (the #3300 review's stricter measure; Diablo Valley's transfer pages): %r"
      % [(k, c["false_matches"][:2]) for k, c in full["colleges"].items() if c.get("false") or c.get("false_off_own")][:3])
check(sw["conversion"]["found_wrong"] == 0 and sw["conversion"]["converted"] > 1000,
      "a third of the closed-list programs, turned into programs with no list and their pages unclaimed, are never "
      "found on a wrong page (the second reader's real-use test): %r" % sw["conversion"])
check(full["colleges"]["merced"]["catalog_list"]["files_not_listed"] is False,
      "Merced's catalog list misses closed-list programs whose pages were read, so it files no not_listed")
check(sw["tested"] > 5000 and sw["recall"] is not None and sw["colleges_searched"] + sw["colleges_under_floor"]
      == sw["site_route"], "the census reads the committed captures whole: %r" % sw)

# The pages the lookup gives back (ncl_yield, S668), counted the way a capture would: a no-closed-list program takes
# its one page from the one closed-list program holding it when the page does not name the holder and the holder's
# filed record, read from that page, fails live. Skyline's Dance A.A. (10546) on dance-aa.php, held by Musical
# Theater (46296), is the shape.
FAIL = {"coverage": {"pass": False}, "invented": {"pass": True}, "arithmetic": {"status": "unequal"}}
PASS = {"coverage": {"pass": True}, "invented": {"pass": True}, "arithmetic": {"status": "equal"}}
y_sources = sources + [src("12", "Geology", "A.S. Degree", B + "geology-as/"),
                       src("13", "Musical Theater", "Certificate of Achievement", B + "dance-aa/", label_title=0.0,
                           h1="Dance Associate in Arts Degree Program"),
                       src("14", "Dance", "A.A. Degree")]


def yield_census(score, cap_extra=None, record=True):
    with tempfile.TemporaryDirectory() as td:
        os.makedirs(os.path.join(td, "records"))
        if record:
            with open(os.path.join(td, "records", "13.json"), "w") as fh:
                json.dump({"control_number": "13", "source_url": B + "dance-aa/", "record": {}, "score": score}, fh)
        return N.college_census(y_sources, dict(cap, **(cap_extra or {})), td)


ry = yield_census(FAIL)
check(ry["searches"] and [(y["holder"], y["taker"], y["url"], y["holder_passes_live"]) for y in ry["yields"]]
      == [("13", "14", B + "dance-aa/", False)] and ry["yield_unjudged"] == 0 and ry["yield_refused_passing"] == 0,
      "a holder whose filed record from the page fails gives the page to the program it names: %r" % ry["yields"])
rp = yield_census(PASS)
check(rp["yields"] == [] and rp["yield_refused_passing"] == 1 and rp["yield_held"][0]["holder"] == "13",
      "a holder whose filed record passes live keeps its page (Lemoore 43533): %r" % rp["yield_held"])
ru = yield_census(FAIL, record=False)
check(ru["yields"] == [] and ru["yield_unjudged"] == 1, "a holder with no filed record keeps its page, unjudged")
check(yield_census(FAIL, {"prior": {"catalog_year": "2025-2026"}})["yields"] == []
      and yield_census(FAIL, {"reread": {"codes": []}})["yields"] == []
      and N.college_census(y_sources, cap)["yields"] == [],
      "a prior-year read, a re-read and a census without the filed records yield nothing")
check(N.college_census(sources, cap, "/nonexistent")["yields"] == [] and r["searches"] is False,
      "a college under the self-test's floor yields nothing")

# The committed captures (the self-recall test): every page given back is one whose holder's filed record, read from
# that page, fails live, and whose readings name the taker and not the holder. The conductor counted 15 failing holders
# on pages that name a no-closed-list program word for word (S668); more than that is a yield outside the measured set.
check(sw["yields_passing_moved"] == 0, "no holder whose filed record passes live loses its page: %r"
      % [y for y in sw["yield_list"]][:5])
bad = []
for slug, c in full["colleges"].items():
    if not c.get("yields"):
        continue
    d = os.path.join(C.COLLEGE_DIR, slug)
    with open(os.path.join(d, "sources.json")) as fh:
        srcs = json.load(fh)
    with open(os.path.join(d, "capture.json")) as fh:
        capj = json.load(fh)
    feats = C.ncl_pages(N.pages_of(srcs, capj), capj.get("college"), capj.get("catalog_year"))
    by = {s["control_number"]: s for s in srcs}
    for y in c["yields"]:
        pg = next(f for f in feats if C.page_stem(y["url"]) in f["keys"])
        rec = C._filed(os.path.join(d, "records", y["holder"] + ".json"))
        if (C._passing_filed_rec(rec) or not C.ncl_read_from(rec, pg) or C.ncl_match(pg, by[y["holder"]])
                or not C.ncl_match(pg, by[y["taker"]]) or by[y["taker"]].get("method") != "no_closed_list"
                or not c["searches"]):
            bad.append((slug, y["holder"], y["taker"]))
check(not bad, "every committed yield moves a failing record off a page that names the taker, not the holder: %r" % bad)
moved = {(y["college"], y["holder"], y["taker"]) for y in sw["yield_list"]}
check({("skyline", "46296", "10546"), ("skyline", "32337", "10529")} <= moved
      and sw["yields"] == len(moved) <= 15,
      "Skyline's Dance A.A. and Automotive Advanced Engine Performance Technology take their pages back, and the census "
      "yields no more than the 15 the conductor measured: %r" % sorted(moved))

if failures:
    print("FAIL: harvest ncl lookup census (%d of %d)" % (len(failures), checks[0]))
    for f in failures:
        print("  -", f)
    sys.exit(1)
print("%d/%d checks passed: harvest ncl lookup census" % (checks[0], checks[0]))
