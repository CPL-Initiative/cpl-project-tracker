#!/usr/bin/env python3
"""S703's own-page pins at Clovis and Cosumnes River (the harvest lane's NEXT (4), f-clovis-19-left-s697).

    python3 tests/program_requirements_pins_s703_test.py

The fixture holds the pages college-page-read runs 45016537664 and 45017083685 printed, each program's closed list
and the page its filed record was read from before the S703 reread. Each pinned program:

  1. binds its pin on the pinned page, and the window opens there, on the pin's words;
  2. reads from the pinned page in capture_pdf, under the college's real reconcile entry, its source marked pinned;
  3. finds on the pin's window what the filed page lacked (its total, or the core it missed);
  4. cannot bind on its filed page, which does not print the pin's words;
  5. names its pin's page in the filed record once the S703 reread files it (until then the old page).

Two Clovis programs carry no pin, and the test says why, so a pin added without the reader change fails here:
Entrepreneur 33432's core page does not print the title word, and Social Science 33492's total prints on the page
after its window, which names no listed course. Pure stdlib.
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


FX = json.load(open(os.path.join(ROOT, "tests", "fixtures", "program_requirements_s703_pinned_pages.json")))
STEPS = R.load_steps()
URL = "https://x.edu/c.pdf"

# What each pin's window holds and the filed page does not print: the program's own list, its total, or the core
# the filed record missed.
MUST = {
    "33053": ["Core: ENGL 301", "List B: A minimum of 3 units", "List C: A minimum of 3 units"],
    "20227": ["Certificate Requirements Course Code Course Title Units FT 300", "Total Units: 44"],
    "20147": ["VT 100", "Total Units: 36"],
    "20193": ["BUS 215", "MKT 300", "Total Units: 18"],
    "33433": ["Business Administration Core:", "BA 5 Business Communications", "BA 10 Introduction to Business"],
    "33487": ["MANAGEMENT (Major #C.2180.AS)", "Total Units for the Major: 33-34"],
    "33491": ["SMALL BUSINESS MANAGEMENT (Major #C.2030.AS)", "Total Units for the Major: 32-35"],
}
PINNED = {"Cosumnes River College": {"33053": 333, "20227": 367, "20147": 625, "20193": 227},
          "Clovis Community College": {"33433": 106, "33487": 109, "33491": 110}}


def prog(cn, p):
    return {"control_number": cn, "title": p["title"], "award": p["award"], "shape": p["shape"], "status": "Active",
            "closed_list": [{"code": c} for c in p["codes"]], "load_id": "1"}


def as_read(path):
    with open(path) as fh:
        return json.load(fh)


for college, want in PINNED.items():
    col = FX["colleges"][college]
    pages = [col["pages"].get(str(n), "") for n in range(1, col["pages_total"] + 1)]
    pins = (STEPS.get(college) or {}).get("pdf_pages") or {}
    print(college)
    check(all(cn in pins and pins[cn]["page"] == pg for cn, pg in want.items()),
          "%s: the reconcile entry pins %s" % (college, ", ".join("%s to p.%d" % kv for kv in want.items())))
    for cn, page in want.items():
        p, pin = prog(cn, col["programs"][cn]), pins.get(cn) or {}
        head, why = C.pdf_pinned_heading(pages, p, pin)
        got = C.pdf_best(URL, pages, p, p["closed_list"], "pypdf", head) if head else None
        check(why is None and got is not None and got["pages"][0] == page
              and flat(got["text"]).startswith("[page %d] %s" % (page, flat(pin.get("words")))),
              "%s: the pin binds p.%d and the window opens there, on the pin's words" % (cn, page))
        filed = col["programs"][cn]["filed_page"]
        lacks = [m for m in MUST[cn] if flat(m) not in flat(col["pages"][str(filed)])]
        check(got is not None and all(flat(m) in flat(got["text"]) for m in MUST[cn]) and lacks == MUST[cn],
              "%s: the pin's window holds %s, which the filed page p.%d does not print" % (cn, MUST[cn], filed))
        check(filed != page and C.pdf_pinned_heading(pages, p, dict(pin, page=filed))[0] is None,
              "%s: the filed page p.%d does not print the pin's words, so the pin cannot bind there" % (cn, filed))
        rec = as_read(os.path.join(ROOT, "kb", "program_requirements_college", col["slug"], "records", cn + ".json"))
        check(rec["source_url"].rsplit("#page=", 1)[1] in (str(page), str(filed)),
              "%s: the filed record names the pin's p.%d (or, until the S703 reread files it, p.%d)" % (cn, page, filed))

    # capture_pdf reads each pinned program from its pin's page under the real entry, and marks its source pinned.
    programs = [prog(cn, p) for cn, p in col["programs"].items()]
    real_read = C.read_hand_filed
    C.read_hand_filed = lambda hf, _pages=pages: {"url": URL, "access": "hand_filed", "pages": _pages,
                                                   "extractor": "pypdf"}
    real_miner = C.P.pdfminer_pages
    C.P.pdfminer_pages = lambda pdf: {"pages": [], "extractor": "pdfminer"}
    try:
        with tempfile.TemporaryDirectory() as tmp:
            out = os.path.join(tmp, "out")
            os.makedirs(os.path.join(out, "sources"))
            with redirect_stdout(io.StringIO()):
                recs = C.capture_pdf(college, out, programs, {"catalog_url": URL}, {},
                                     {"meta": {"url": URL, "fetched_by": "test", "fetched_at": "2026-11-22",
                                               "sha256": "0"}})
    finally:
        C.read_hand_filed, C.P.pdfminer_pages = real_read, real_miner
    by = {r["control_number"]: r for r in recs}
    check(all((by[cn].get("source") or {}).get("url", "").endswith("#page=%d" % pg)
              and (by[cn].get("source") or {}).get("pinned") is True for cn, pg in want.items()),
          "%s: capture_pdf reads every pinned program from its pin's page, its source marked pinned" % college)
    unpinned = [cn for cn in col["programs"] if cn not in want]
    check(all("pinned" not in (by[cn].get("source") or {}) for cn in unpinned if cn in by),
          "%s: a program with no pin carries no pinned mark (%s)" % (college, ", ".join(unpinned) or "none"))

# The two Clovis programs left unpinned, each for a reason a reader change must clear first.
col = FX["colleges"]["Clovis Community College"]
pages = [col["pages"].get(str(n), "") for n in range(1, col["pages_total"] + 1)]
cl_pins = (STEPS.get("Clovis Community College") or {}).get("pdf_pages") or {}
p32 = prog("33432", col["programs"]["33432"])
check("33432" not in cl_pins and C.pdf_pinned_heading(pages, p32, cl_pins["33433"])
      == (None, "PDF page 106 does not print every title word"),
      "33432 carries no pin: its core's page (p.106) does not print 'Entrepreneur', so a pin there is refused")
p92 = prog("33492", col["programs"]["33492"])
h92, _ = C.pdf_pinned_heading(pages, p92, {"page": 148, "words": "SOCIAL SCIENCE (Major #C.7410.AA)"})
w92 = C.pdf_best(URL, pages, p92, p92["closed_list"], "pypdf", h92)
check("33492" not in cl_pins and w92["pages"] == [148] and "Total Units: 21" in flat(col["pages"]["149"])
      and "Total Units" not in flat(w92["text"]),
      "33492 carries no pin: its own page p.148 is already read, and its total on p.149 is past the window")

print("\n%d/%d checks passed" % (N[0] - len(FAILS), N[0]))
sys.exit(1 if FAILS else 0)
