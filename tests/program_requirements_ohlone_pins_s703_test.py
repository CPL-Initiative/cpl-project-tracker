#!/usr/bin/env python3
"""S703's own-page pins at Ohlone (census lever 6, page not found) and the gaps filed beside them.

    python3 tests/program_requirements_ohlone_pins_s703_test.py

The fixture holds PDF pages 46, 47, 96 and 97 of Ohlone's 2026-2027 chapter 7 guide as college-page-read run
45024779831 printed them. Each pinned program:

  1. binds its pin on the pinned page, and the window opens there, on the pin's words;
  2. holds its list and its total, which print on the page after the heading;
  3. cannot bind on that next page, which does not print the pin's words;
  4. reads from the pinned page in capture_pdf, under the college's real reconcile entry, its source marked pinned.

And the named gaps (kb/program_requirements_college/ohlone/no_record_s703.json) file every other program the
filed capture read as not_found, once each, never a pinned one, each with a reason the file defines. The closed
lists here are the codes the pages print (the state's lists are read on the runner), so check 4 tests the
reader's path, and the pricing run tests the coverage. Pure stdlib.
"""
import io
import json
import os
import re
import sys
import tempfile
from contextlib import redirect_stdout

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_requirements_college as C  # noqa: E402
import _program_requirements_reconcile as R  # noqa: E402

FAILS = []
N = [0]


def check(ok, what):
    N[0] += 1
    print(("ok   " if ok else "FAIL ") + what)
    if not ok:
        FAILS.append(what)


def flat(text):
    return re.sub(r"\s+", " ", text or "").strip()


COLLEGE = "Ohlone College"
URL = "https://x.edu/c.pdf"
FX = json.load(open(os.path.join(ROOT, "tests", "fixtures", "program_requirements_ohlone_pins_s703.json")))
PAGES = [FX["pages"].get(str(n), "") for n in range(1, FX["pages_total"] + 1)]
PINS = (R.load_steps().get(COLLEGE) or {}).get("pdf_pages") or {}
FOLDER = os.path.join(ROOT, "kb", "program_requirements_college", "ohlone")

PROGRAMS = {
    "33319": {"title": "Information Technology",
              "award": "Certificate of Achievement requiring 16S/24Q to fewer than 30S/45Q units", "shape": "certificate",
              "page": 46,
              "codes": ["CNET 146", "CNET 155A", "CNET 162", "CNET 170", "CNET 105", "CNET 108"],
              "must": ["MAJOR FIELD", "CNET-146 Introduction to Linux", "CNET-170", "Total Required Units: 18.0-21.0"]},
    "46035": {"title": "Esports Entrepreneurship and Live Production - Game Design", "award": "Noncredit program",
              "shape": "noncredit", "page": 96, "codes": ["ESPTS 901", "ESPTS 902", "ESPTS 903", "ESPTS 910A"],
              "must": ["ESPTS-901 Introduction to Esports", "SUPPORTING COURSES", "DAID-922",
                       "Total Required Hours: 378.0"]},
}


def prog(cn):
    p = PROGRAMS[cn]
    return {"control_number": cn, "title": p["title"], "award": p["award"], "shape": p["shape"],
            "status": "Active",
            "closed_list": [{"code": c} for c in p["codes"]], "load_id": "1"}


check(sorted(PINS) == sorted(PROGRAMS) and all(PINS[cn]["page"] == p["page"] for cn, p in PROGRAMS.items()),
      "Ohlone's reconcile entry pins 33319 to p.46 and 46035 to p.96, and nothing else")
check(all(PINS[cn].get("words") and "45024779831" in PINS[cn].get("evidence", "") for cn in PINS),
      "each pin names its words and the page read that printed them")

for cn, p in PROGRAMS.items():
    pr, pin = prog(cn), PINS.get(cn) or {}
    head, why = C.pdf_pinned_heading(PAGES, pr, pin)
    got = C.pdf_best(URL, PAGES, pr, pr["closed_list"], "pypdf", head) if head else None
    check(why is None and got is not None and got["pages"][0] == p["page"]
          and flat(got["text"]).startswith("[page %d] %s" % (p["page"], flat(pin.get("words")))),
          "%s: the pin binds p.%d and the window opens there, on the pin's words" % (cn, p["page"]))
    nxt = flat(FX["pages"][str(p["page"] + 1)])
    check(got is not None and all(flat(m) in flat(got["text"]) for m in p["must"])
          and all(flat(m) not in flat(FX["pages"][str(p["page"])]) for m in p["must"][-1:])
          and flat(p["must"][-1]) in nxt,
          "%s: the window holds its list and total %r, which print on p.%d" % (cn, p["must"][-1], p["page"] + 1))
    check(C.pdf_pinned_heading(PAGES, pr, dict(pin, page=p["page"] + 1))[0] is None,
          "%s: p.%d does not print the pin's words, so the pin cannot bind there" % (cn, p["page"] + 1))

# capture_pdf reads each pinned program from its pin's page under the real entry, and marks its source pinned.
programs = [prog(cn) for cn in PROGRAMS]
real_read, real_miner = C.read_hand_filed, C.P.pdfminer_pages
C.read_hand_filed = lambda hf: {"url": URL, "access": "hand_filed", "pages": PAGES, "extractor": "pypdf"}
C.P.pdfminer_pages = lambda pdf: {"pages": [], "extractor": "pdfminer"}
try:
    with tempfile.TemporaryDirectory() as tmp:
        out = os.path.join(tmp, "out")
        os.makedirs(os.path.join(out, "sources"))
        with redirect_stdout(io.StringIO()):
            recs = C.capture_pdf(COLLEGE, out, programs, {"catalog_url": URL}, {},
                                 {"meta": {"url": URL, "fetched_by": "test", "fetched_at": "2026-11-22", "sha256": "0"}})
finally:
    C.read_hand_filed, C.P.pdfminer_pages = real_read, real_miner
by = {r["control_number"]: r for r in recs}
check(all((by[cn].get("source") or {}).get("url", "").endswith("#page=%d" % p["page"])
          and (by[cn].get("source") or {}).get("pinned") is True for cn, p in PROGRAMS.items()),
      "capture_pdf reads both pinned programs from their pin's page, each source marked pinned")

# The named gaps: every other not_found program of the filed capture, once each.
cap = json.load(open(os.path.join(FOLDER, "capture.json")))
gaps = json.load(open(os.path.join(FOLDER, "no_record_s703.json")))
nf = [n["control_number"] for n in cap["not_found"]]
filed = [g["control_number"] for g in gaps["programs"]]
check(str(cap.get("run")) == "44515665022" and gaps["capture"] == "44515665022",
      "the gap file names the capture it reads, 44515665022")
check(sorted(filed) == sorted(set(nf) - set(PROGRAMS)) and len(filed) == len(set(filed)) == 34,
      "the gap file names the capture's 34 other not_found programs, once each")
check(not set(filed) & set(PINS), "no pinned program is filed as a gap")
check(all(g["reason"] in gaps["reasons"] for g in gaps["programs"])
      and all((g["reason"] == "noncredit_not_in_guide") == ("noncredit" in g["award"].lower())
              for g in gaps["programs"]),
      "each gap carries a defined reason, noncredit by the state's award")
check(not any(os.path.exists(os.path.join(FOLDER, "records", cn + ".json")) for cn in filed),
      "no gap program has a record file")

print("\n%d/%d checks passed" % (N[0] - len(FAILS), N[0]))
sys.exit(1 if FAILS else 0)
