#!/usr/bin/env python3
"""S741's page pins (lane 2's cheap piles): eight held records that were read from another program's page, each
pinned to its own page in kb/program_requirements_reconcile.json from free page reads.

WHY. S739 and S740 held these records as not the program's own; a named gap is never filed on another program's list.
Free page reads (college-page-read runs 45953358884, 45955333186 and 45961506725) found each program's own page:

  American River 39731, 39732  (pdf_pages) Refrigeration Service Technician Apprenticeship Level I and Level II. Both
      records were read from PDF p.211, the tail of the Level IV certificate. Each is pinned from its own heading to
      the next award's heading (until), so a window never holds a neighbour's list.
  Orange Coast 08663, 08626    (site_pages) each page prints its Control Number.
  Fullerton 36798, 35174       (site_pages) each page prints its PROGRAM CODE, 2S and the control number.
  El Camino 19883              (site_pages) Programs of Study links 'Photography Certificate of Achievement', poid 3640.
  Butte 14583                  (site_pages) the Nursing section's 'AS Degree in Registered Nursing', node 28324.

Pinned here (the second reader's two MINORs among them):
  1. American River's two windows, on page text quoted line for line from the page reads: the Level I window opens
     on its own heading and ends where Level II's opens; the Level II window opens on its own heading, not on Level
     I's tail above it on the same page, and ends where Level III's opens. A window with its `until` words gone
     binds nothing, and neither does a page without the heading.
  2. The capture bound both pins on those pages (free capture 45961227651, then the paid read's filed capture
     45962123468, pdf.pinned), and each record that read filed carries its own heading and adds to its printed total.
  3. Each site pin: its address is no filed record's address, it differs from the address the held record was read
     from, no two pins share one, and its evidence names its page read. Fullerton's two page titles name the program
     with its award (C.site_heading_names), and the UC Transfer page's title names neither.

Run from repo root: python3 tests/program_requirements_pins_s741_test.py
"""
import glob
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_requirements_college as C  # noqa: E402

FAILS, N = [], [0]


def check(ok, what):
    N[0] += 1
    print(("  ok  " if ok else "FAIL  ") + what)
    if not ok:
        FAILS.append(what)


with open(os.path.join(ROOT, "kb", "program_requirements_reconcile.json"), encoding="utf-8") as fh:
    COLLEGES = json.load(fh)["colleges"]
DIR = os.path.join(ROOT, "kb", "program_requirements_college")


def filed_urls(slug):
    out = {}
    for path in glob.glob(os.path.join(DIR, slug, "records", "*.json")):
        with open(path, encoding="utf-8") as fh:
            f = json.load(fh)
        out[str(f.get("control_number"))] = str(f.get("source_url") or "")
    return out


# ── 1. American River's two windows ─────────────────────────────────────────
ARC = COLLEGES["American River College"]["pdf_pages"]
H = "Refrigeration Service Technician\nApprenticeship Level %s Certificate\n"
LIST = "Certificate Requirements\nCourse\nCode Course Title Units\nA minimum of %d units from the following: %d\nHVACR\n101 Electrical Theory I (2)\n"
WORK = "A minimum of %d units from the following: %d\nHVACR\n298 Work Experience in HVAC, & Refrigeration (0.5 - 6)\n"
# PDF pp.206-209 (index 205-208), as page reads 45955333186 and 45953358884 print them: p.207 opens Level I, p.208
# holds Level I's work experience list and then opens Level II, p.209 holds Level II's and then opens Level III.
pages = [""] * 211
pages[205] = "Refrigeration Service Technician\nApprenticeship Certificate\n" + LIST % (40, 40) + WORK % (16, 16)
pages[206] = "Total Units: 56\n" + H % "I" + "This certificate includes the first period training\n" + LIST % (8, 8)
pages[207] = WORK % (4, 4) + "Total Units: 12\n" + H % "II" + "This certificate includes the second period training\n" + LIST % (16, 16)
pages[208] = WORK % (8, 8) + "Total Units: 24\n" + H % "III" + "This certificate includes the third period training\n" + LIST % (24, 24)


def window(cn, title, pgs=None, pin=None):
    pgs = pages if pgs is None else pgs
    head, why = C.pdf_pinned_heading(pgs, {"control_number": cn, "title": title}, ARC[cn] if pin is None else pin)
    if head is None:
        return None, why
    i, last = head["page"], head.get("through", head["page"])
    end = head.get("until") or {}
    text = "\n".join((pgs[j])[head["at"] if j == i else 0:end.get("at") if j == end.get("page") else None]
                     for j in range(i, last + 1))
    return text, why


T1, T2 = "Refrigeration Service Technician Apprenticeship Level I", "Refrigeration Service Technician Apprenticeship Level II"
check((ARC["39731"]["page"], ARC["39731"]["through"]) == (207, 208) and (ARC["39732"]["page"], ARC["39732"]["through"]) == (208, 209)
      and ARC["39731"]["until"] == ARC["39732"]["words"] and ARC["39732"]["until"].endswith("Level III Certificate"),
      "1 Level I is pinned p.207 through p.208 until Level II's heading; Level II p.208 through p.209 until Level III's")
w1, _ = window("39731", T1)
check(w1 is not None and w1.startswith("Refrigeration Service Technician\nApprenticeship Level I Certificate")
      and "A minimum of 8 units" in w1 and "A minimum of 4 units" in w1 and "Total Units: 12" in w1
      and "Level II Certificate" not in w1 and "A minimum of 16 units" not in w1 and "Total Units: 56" not in w1,
      "1 the Level I window opens on its own heading, holds its 8 and 4 units and 'Total Units: 12', and ends where "
      "Level II's heading opens")
w2, _ = window("39732", T2)
check(w2 is not None and w2.startswith("Refrigeration Service Technician\nApprenticeship Level II Certificate")
      and "A minimum of 16 units" in w2 and "A minimum of 8 units" in w2 and "Total Units: 24" in w2
      and "Total Units: 12" not in w2 and "A minimum of 4 units" not in w2 and "Level III Certificate" not in w2,
      "1 the Level II window opens on its own heading, not on Level I's tail above it on p.208, and ends where Level "
      "III's heading opens")
# 39341, the apprenticeship certificate itself: s739a filed it from p.211, which is the Level IV certificate's tail,
# and its own section opens on p.206. Its window opens on its own heading and ends where Level I's opens.
w0, _ = window("39341", "Refrigeration Service Technician Apprenticeship")
check((ARC["39341"]["page"], ARC["39341"]["through"]) == (206, 207) and ARC["39341"]["until"] == ARC["39731"]["words"]
      and w0 is not None and w0.startswith("Refrigeration Service Technician\nApprenticeship Certificate")
      and "A minimum of 40 units" in w0 and "A minimum of 16 units" in w0 and "Total Units: 56" in w0
      and "Level I Certificate" not in w0 and "A minimum of 8 units" not in w0,
      "1 the apprenticeship certificate's window (39341) opens on its own heading on p.206, holds its 40 and 16 units, "
      "and ends where Level I's heading opens")
gone = list(pages)
gone[208] = gone[208].replace("Apprenticeship Level III Certificate", "Apprenticeship Certificate")
check(window("39732", T2, gone)[0] is None, "1 with Level III's heading gone the Level II pin binds nothing")
gone = list(pages)
gone[206] = gone[206].replace("Apprenticeship Level I Certificate", "Apprenticeship Certificate")
check(window("39731", T1, gone)[0] is None, "1 on a page without its heading the Level I pin binds nothing")
check(window("39731", T1, pin=dict(ARC["39731"], page=208))[0] is None,
      "1 pinned to p.208, where only Level II's heading prints, the Level I pin binds nothing")

# ── 2. the free capture bound both ──────────────────────────────────────────
# Free capture 45961227651 bound both (its preview was filed, then replaced by the paid read's capture, 45962123468,
# staged from it): the filed capture holds the same two bindings, and a later capture must still bind both.
with open(os.path.join(DIR, "american_river", "capture.json"), encoding="utf-8") as fh:
    capture = json.load(fh)
got = (capture.get("pdf") or {}).get("pinned") or {}
if str(capture.get("run")) == "45962123468":
    check(got.get("39731") == {"page": 207, "bound": True, "through": 208, "until_page": 208}
          and got.get("39732") == {"page": 208, "bound": True, "through": 209, "until_page": 209},
          "2 the filed capture (45962123468) bound Level I at p.207 through p.208 and Level II at p.208 through p.209")
else:
    check(all((got.get(cn) or {}).get("bound") is True for cn in ("39731", "39732")),
          "2 a later capture (%s) still binds both pins" % capture.get("run"))
for cn, page, total in (("39731", 207, 12), ("39732", 208, 24)):
    with open(os.path.join(DIR, "american_river", "records", cn + ".json"), encoding="utf-8") as fh:
        f = json.load(fh)
    if str(f.get("extracted_run")) == "45962123468":
        a = f["score"]["arithmetic"]
        check(f["source_url"].endswith("#page=%d" % page) and a["status"] == "equal"
              and a["computed"] == [total, total] == a["stated"]
              and "Level I%s Certificate" % ("I" if cn == "39732" else "") in f["record"]["program"]["section_heading"],
              "2 %s, read from its pinned page (45962123468), carries its own heading and adds to its printed %d"
              % (cn, total))

# ── 3. the site pins ────────────────────────────────────────────────────────
SITE = (("Orange Coast College", "orange_coast", ("08663", "08626"), "45953358884"),
        ("Fullerton College", "fullerton", ("36798", "35174"), "45955333186"),
        ("El Camino College", "el_camino", ("19883",), "45953358884"),
        ("Butte College", "butte", ("14583",), "45961506725"))
for college, slug, cns, run in SITE:
    pins = COLLEGES[college]["site_pages"]
    filed = filed_urls(slug)
    norm = lambda u: u.rstrip("/").lower().replace("//iq", "/iq").replace("/catalog//", "/catalog/")  # noqa: E731
    urls = [norm(p["url"]) for p in pins.values()]
    check(len(set(urls)) == len(urls), "3 %s: no two pins share an address" % college)
    for cn in cns:
        p = pins[cn]
        check(run in p["evidence"] and cn in p["evidence"], "3 %s %s: its evidence names its page read" % (college, cn))
        check(norm(p["url"]) != norm(filed[cn]) and norm(p["url"]) not in {norm(u) for u in filed.values()},
              "3 %s %s: the pinned address is not the one its record was read from, nor any filed record's"
              % (college, cn))
FU = COLLEGES["Fullerton College"]["site_pages"]
AST = {"title": "Chemistry", "award": "A.S. T Degree"}
AS = {"title": "Chemistry", "award": "A.S. Degree"}
for prog, cn, title in ((AST, "36798", "Chemistry Associate in Science Degree for Transfer < Fullerton College"),
                        (AS, "35174", "Chemistry Associate in Science Degree < Fullerton College")):
    check(C.site_heading_names({"h1": "", "title": title}, prog)[0] is True and "PROGRAM CODE: 2S%s" % cn in FU[cn]["evidence"],
          "3 Fullerton %s: its page's title names the program with its award, and its evidence quotes its PROGRAM CODE"
          % cn)
check(FU["36798"]["url"].endswith("/chemistry-associate-in-science-degree-for-transfer/")
      and FU["35174"]["url"].endswith("/chemistry-associate-science-degree/")
      and all("uc-transfer" in filed_urls("fullerton")[cn] for cn in ("36798", "35174")),
      "3 Fullerton: each is pinned to its own award's page, and both filed records were read from the UC Transfer page")
check(C.site_heading_names({"h1": "", "title": "Chemistry Associate in Science Degree < Fullerton College"}, AST)[0] is False,
      "3 Fullerton: the A.S. page's title does not name the A.S.-T")

print("%d checks, %d failed" % (N[0], len(FAILS)))
sys.exit(1 if FAILS else 0)
