#!/usr/bin/env python3
"""S730's lever pins: Folsom Lake 38736 reads its own section, opening on p.176.

    python3 tests/program_requirements_lever_pins_s730_test.py

WHY. Folsom Lake's Business Analyst/Data Analytics A.A. 38736 is live and failing: its filed record (run
39046850071) was read from p.177 alone, and its own notes say the text "begins mid-table at the top of page 177", so
it summed 28 of the stated 36 units. Its heading and first three required courses print at the foot of p.176. S730
pins it in kb/program_requirements_reconcile.json (pdf_pages: page 176, through 177, until the next degree's
heading). The pages are the hand-filed 2026-27 catalog as S714's page read printed them
(tests/fixtures/program_requirements_folsom_38736_s730.json).

  1. The reconcile entry holds the pin, and it binds on the fixture's pages: the window the capture reads (pdf_best)
     is pp.176-177, opens on the pin's words, ends before its until words, prints one total line (36), every title
     word and at least the accept share of the listed courses, and moves off the filed p.177.
  2. The pin moves no other program: Folsom Lake's three S714 pins are as they were.
  3. Allan Hancock: Agricultural Science A.S. 43770 is pinned to its own curriQunet entry (28876/31144), whose title
     rule A binds and the Agricultural Business A.S.-T entry the filed capture handed it does not; Viticulture
     Levels 2 and 3 (42208, 42210) and East Los Angeles's Cal-GETC certificate 45028 are named gaps, each once, with
     a defined reason and a note, and none is also pinned.
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


FIX = json.load(open(os.path.join(ROOT, "tests", "fixtures", "program_requirements_folsom_38736_s730.json"),
                     encoding="utf-8"))
FLC = "Folsom Lake College"
STEPS = R.load_steps()
TOTAL = re.compile(r"^\s*Total(?: Units|\s*$)", re.M)


def flat(s):
    return " ".join(s.split())


# ── 1. the pin binds and reads its own section ───────────────────────────────────────────────────────────────────
pins = (STEPS.get(FLC) or {}).get("pdf_pages") or {}
pin = pins.get("38736")
check(bool(pin) and pin.get("page") == 176 and pin.get("through") == 177 and "S730" in pin.get("evidence", ""),
      "Folsom Lake's reconcile entry pins 38736 to pp.176-177 (S730)")
pages = [FIX["pages"].get(str(i + 1), "") for i in range(FIX["pages_total"])]
prog = {"control_number": "38736", "title": "Business Analyst/Data Analytics",
        "closed_list": [{"code": c} for c in FIX["codes"]]}
conf = STEPS.get(FLC) or {}
prog = C.with_renumbers([prog], R.course_renumbers(FLC), conf.get("prefix_aliases"))[0]
head, why = C.pdf_pinned_heading(pages, prog, pin or {})
check(head is not None, "the pin's words, its until words and every title word print in the fixture (%s)" % why)
got = C.pdf_best("https://example.edu/c.pdf", pages, prog, prog["closed_list"], "pypdf", head) if head else None
body = re.sub(r"\[page \d+\]\n", "", (got or {}).get("text") or "")
check(bool(got) and got["pages"] == [176, 177], "the window is pp.176-177 (%s)" % (got and got["pages"]))
check(flat(body).startswith(flat((pin or {}).get("words", "-"))), "the window opens on the pin's words")
check(flat((pin or {}).get("until", "-")) not in flat(body), "the window ends before the next degree's heading")
check(TOTAL.findall(body) == ["Total Units"] and "Total Units: 36" in body, "the window prints one total, 36 units")
check(all(c in body for c in ("ACCT 301", "ACCT 311", "ACCT 341", "MGMT 362")),
      "the window holds the three courses p.176 prints and the last of p.177's list")
check(bool(got) and got["coverage"] >= C.P.ACCEPT_SHARE,
      "the window places at least the accept share of the 18 listed courses (%s)" % (got and round(got["coverage"], 3)))

# ── 2. no other program moves ────────────────────────────────────────────────────────────────────────────────────
check(sorted(pins) == ["21193", "38736", "38898", "45568"]
      and [pins[cn]["page"] for cn in ("21193", "38898", "45568")] == [184, 382, 395],
      "Folsom Lake's S714 pins (21193, 38898, 45568) are as they were")

# ── 3. Allan Hancock: 43770's pin names its own entry; Levels 2 and 3 are named gaps ─────────────────────────────
AHC = "Allan Hancock College"
hpins = C.site_pin_entries(AHC)
check(sorted(hpins) == ["43770"] and hpins["43770"]["url"].endswith("/28545/28876/31144"),
      "Allan Hancock's reconcile entry pins 43770 alone, to entry 28876/31144")
own = {"url": hpins.get("43770", {}).get("url"), "title": "Agricultural Science - Associate in Science",
       "h1": "Agricultural Science - Associate in Science", "body": ""}
named, _ = C.site_heading_names(own, {"title": "Agricultural Science", "award": "A.S. Degree"})
other = dict(own, title="Agricultural Business - Associate in Science for Transfer",
             h1="Agricultural Business - Associate in Science for Transfer")
refused, _ = C.site_heading_names(other, {"title": "Agricultural Science", "award": "A.S. Degree"})
check(named and not refused, "rule A binds 43770 on its own entry's heading and refuses the Agricultural Business "
                             "A.S.-T entry the filed capture handed it")
for slug, want in (("allan_hancock", {"42208", "42210"}), ("east_los_angeles", {"45028"})):
    with open(os.path.join(ROOT, "kb", "program_requirements_college", slug, "named_gaps_s730.json")) as fh:
        ng = json.load(fh)
    got_cns = [g["control_number"] for g in ng["programs"]]
    check(sorted(got_cns) == sorted(want) and all(g["reason"] in ng["reasons"] and g.get("note") for g in ng["programs"]),
          "%s: the named gaps are %s, each once with a defined reason and a note" % (slug, sorted(want)))
    check(not (set(got_cns) & set(C.site_pin_entries(ng["college"])))
          and not (set(got_cns) & set(((STEPS.get(ng["college"]) or {}).get("pdf_pages") or {}))),
          "%s: no named gap is also pinned" % slug)

print("\n%d checks, %d failed" % (N[0], len(FAILS)))
sys.exit(1 if FAILS else 0)
