#!/usr/bin/env python3
"""S739's lever pin: East Los Angeles 38332 reads its own section, and 45540 is a named gap.

    python3 tests/program_requirements_lever_pins_s739_test.py

WHY. Paid read 45769480150 (only=38332,45540) handed each program its sister award's section, so each record placed
none of its listed courses: the Geo-Spatial Engineering and Technologies certificate 38332 was read from PDF
pp.198-199, which print the Associate in Science (Academic Plan E038337C) alone, and the Respiratory Therapy B.S.
45540 from pp.343-345, the Associate in Science (E002458C). Free page read 45771828002 printed each program's own
section (tests/fixtures/program_requirements_ela_pins_s739.json).

  1. 38332 is pinned in kb/program_requirements_reconcile.json (pdf_pages: page 195, through 196, until the next
     certificate's heading). On the fixture's pages the pin binds: the window the capture reads (pdf_best) is
     pp.195-196, opens on the pin's words, ends before its until words, prints one total (20) and all 7 listed
     courses, and holds none of the degree's section (its plan line E038337C, its ENG GEN 212): the wrong page.
  2. 45540 is a named gap with no record, list_by_reference, named once with a defined reason and a note, and it is
     not pinned: its own section (pp.346-348 in the fixture) names 18 of the state's 48 listed courses, the
     upper-division list, under the reader's accept share, so a pin there would bind the heading and the capture
     would still refuse the page.
  3. East Los Angeles's seven reconcile steps and two renumbers are as they were, and the entry holds no other pin.
  4. The committed record of 38332 is read in either state: from p.198 it places none; from p.195 it places all 7.
Pure stdlib.
"""
import json
import os
import re
import sys

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


FIX = json.load(open(os.path.join(ROOT, "tests", "fixtures", "program_requirements_ela_pins_s739.json"),
                     encoding="utf-8"))
ELA = "East Los Angeles College"
DIR = os.path.join(ROOT, "kb", "program_requirements_college", "east_los_angeles")
STEPS = R.load_steps()
TOTAL = re.compile(r"^\s*Total\b", re.M)


def flat(s):
    return " ".join(s.split())


conf = STEPS.get(ELA) or {}
pins = conf.get("pdf_pages") or {}
pages = [FIX["pages"].get(str(i + 1), "") for i in range(FIX["pages_total"])]


def program(cn, title):
    prog = {"control_number": cn, "title": title, "closed_list": [{"code": c} for c in FIX["codes"][cn]]}
    return C.with_renumbers([prog], R.course_renumbers(ELA), conf.get("prefix_aliases"))[0]


# ── 1. the pin binds and reads the certificate's own section ────────────────────────────────────────────────
pin = pins.get("38332")
check(bool(pin) and pin.get("page") == 195 and pin.get("through") == 196 and "S739" in pin.get("evidence", ""),
      "East Los Angeles's reconcile entry pins 38332 to pp.195-196 (S739)")
prog = program("38332", "Geo-Spatial Engineering and Technologies")
check(len(FIX["codes"]["38332"]) == 7, "the state's file lists 7 courses for 38332")
head, why = C.pdf_pinned_heading(pages, prog, pin or {})
check(head is not None, "the pin's words, its until words and every title word print in the fixture (%s)" % why)
got = C.pdf_best("https://example.edu/c.pdf", pages, prog, prog["closed_list"], "pypdf", head) if head else None
body = re.sub(r"\[page \d+\]\n", "", (got or {}).get("text") or "")
check(bool(got) and got["pages"] == [195, 196], "the window is pp.195-196 (%s)" % (got and got["pages"]))
check(flat(body).startswith(flat((pin or {}).get("words", "-"))), "the window opens on the pin's words")
check(flat((pin or {}).get("until", "-")) not in flat(body), "the window ends before the next certificate's heading")
check(len(TOTAL.findall(body)) == 1 and re.search(r"Total[ .]+20\b", body) is not None,
      "the window prints one total, 20 units")
check(all(c in body for c in ("ENG SUP 121", "ENG SUP 225", "ENG SUP 202", "ENG GEN 185", "MATH 241S")),
      "the window holds the certificate's list, first course to last")
check(bool(got) and got["coverage"] == 1.0, "the window places all 7 listed courses (%s)" % (got and got["coverage"]))
check("E038337C" not in body and "ENG GEN 212" not in body and "Associate in Science" not in flat(body)[:400],
      "the window holds none of the degree's section (the page the paid read took)")
# The same pin on a page that lacks the plan line binds nothing: no other page stands in.
moved = dict(pin or {}, page=196)
check(C.pdf_pinned_heading(pages, prog, moved)[0] is None, "the pin moved to p.196 binds nothing")
gone = [p.replace("E038332D", "E038337C") for p in pages]
check(C.pdf_pinned_heading(gone, prog, pin or {})[0] is None,
      "a file printing the degree's plan line in its place binds nothing")

# ── 2. 45540 is a named gap, never pinned ───────────────────────────────────────────────────────────────────
with open(os.path.join(DIR, "named_gaps_s739.json"), encoding="utf-8") as fh:
    ng = json.load(fh)
named = [p["control_number"] for p in ng["programs"]]
check(named == ["45540"] and all(p["reason"] in ng["reasons"] and p.get("note") for p in ng["programs"]),
      "the named gap is 45540, once, with a defined reason and a note")
check(ng["programs"][0]["reason"] == "list_by_reference" and "45540" not in pins,
      "45540 is list_by_reference and is not pinned")
bs = program("45540", "Respiratory Therapy")
own = {"page": 346, "words": "BACHELOR’S DEGREE PROGRAM Respiratory Therapy, Bachelor of Science Degree "
                             "(Academic Plan E045540B)", "through": 348, "until": "Subjects & Course Descriptions"}
head, why = C.pdf_pinned_heading(pages, bs, own)
got = C.pdf_best("https://example.edu/c.pdf", pages, bs, bs["closed_list"], "pypdf", head) if head else None
check(len(FIX["codes"]["45540"]) == 48 and bool(got) and len(got.get("found") or []) == 18,
      "its own section names 18 of the state's 48 listed courses (%s)" % (got and len(got.get("found") or [])))
check(bool(got) and got["coverage"] < C.P.ACCEPT_SHARE,
      "which is under the reader's accept share, so the capture would refuse the page (%s)"
      % (got and round(got["coverage"], 3)))
check("TOTAL UNITS REQUIRED FOR UPPER DIVISION 54" in ((got or {}).get("text") or "")
      and "Required Major Units: 76.5-78.5 Lower Division" in flat((got or {}).get("text") or ""),
      "the section prints the upper division's 54 and names the lower division as a line of units")

# ── 3. nothing else in the entry moved ──────────────────────────────────────────────────────────────────────
check(sorted(pins) == ["38332"], "the entry holds the one pin")
check(len(conf.get("steps") or []) == 7 and len(conf.get("course_renumbers") or []) == 2,
      "East Los Angeles's seven steps and two renumbers are as they were")

# ── 4. the committed record, in either state ────────────────────────────────────────────────────────────────
with open(os.path.join(DIR, "records", "38332.json"), encoding="utf-8") as fh:
    rec = json.load(fh)
cov = rec["score"]["coverage"]
if rec["source_url"].endswith("#page=195"):
    check(cov["placed"] == 7 and cov["listed"] == 7 and rec["score"]["arithmetic"]["status"] == "equal"
          and rec["record"]["program"]["total_units"] == {"min": 20, "max": 20},
          "read from p.195, the record places all 7 and adds to the printed 20")
else:
    check(rec["source_url"].endswith("#page=198") and cov["placed"] == 0,
          "read from p.198, the degree's page, the record places none")

print("\n%d checks, %d failed" % (N[0], len(FAILS)))
sys.exit(1 if FAILS else 0)
