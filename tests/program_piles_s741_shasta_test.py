#!/usr/bin/env python3
"""S741, lane 2's cheap piles at Shasta: 32162 collected under the units within-range kind, its own-page guard cleared
on the page's own lines (kb/_program_piles_s741_shasta.py, kb/_program_piles_s741.py own_lines).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): a record with a true gap is collected with the gap
named, never held, unless the record is not the program's own. S740 held 32162 on the own-page guard: its heading
sits on the page before the one its read held, and 18094 was read from the same page. College-page-read run
45837455365 prints that page: the record's three lists sit between a sentence and a totals line that both name the
Associate in Arts in Kinesiology for Transfer, and 18094's section opens only after them. The shared checks are
tests/program_piles_s739_common.py's. Pinned here:

  * the two keys are s740i's holds; 32162 collected, 18625 held;
  * 32162 files the kind's own words, from its figures (23-27 inside the printed 22-27), by reviewed key;
  * own_lines stands only on what the committed files show: the page read's plan is committed and reads the record's
    own catalog file and page; the record's heading and the closing line both carry the title and name the award;
    the closing line prints the record's stated total; no page-mate's title is inside it. Each of those moved, the
    guard does not show the record its own: another heading, another page, a closing line without the total or
    without the award, a plan that is not committed, a closing line that also carries the page-mate's title;
  * S739's three forms still do not show it (the heading says it sits on the page before), so the form is the one
    that clears the guard;
  * 18094 and 18095, the page-mates, hold other sections: each its own University Studies heading and another total.

Run from repo root: python3 tests/program_piles_s741_shasta_test.py
"""
import copy
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s741 as B8  # noqa: E402
import _program_piles_s741_shasta as M  # noqa: E402

W = M.W
B, NG, B7 = B8.B, B8.NG, B8.B7
ROOT = T.ROOT
HELD = {"18625": ["not the program's own"]}

t = T.run(W, rows={"32162": B8.WITHIN}, held=HELD, scores={B8.WITHIN: 50}, day="2026-11-27", boundaries=6,
          own={"32162": "own_lines"})
check = t.check

f, e = W.load("32162"), M.REVIEWED["32162"]
words = f["score"]["gaps"][0]["words"]
check(len(f["score"]["gaps"]) == 1 and f["score"]["gaps"][0]["gap"] == B8.WITHIN
      and words == "the courses' units add to 23-27, within the printed 22-27 units",
      "32162: the gap files the kind's own words, from its figures")
bare = copy.deepcopy(f)
bare["score"].pop("gaps")
bare["score"].pop("confidence")
check(W.gap_noted(bare) == (B8.WITHIN, words) and NG.answer(bare) is None
      and NG.units_within_printed_range(bare) is not None,
      "32162: the entry stands on the record as it was filed, and no record rule names a kind for it")

# The guard's form.
o = M.OWN_32162
with open(os.path.join(ROOT, o["plan"]), encoding="utf-8") as fh:
    plan = json.load(fh)
check(o["run"] == M.PAGE_READ and plan["college"] == M.COLLEGE and plan["pdf_span"][0] <= o["page"] <= plan["pdf_span"][1]
      and bare["source_url"] == plan["pages"][0]["url"] + "#page=%d" % o["page"],
      "the page read's plan is committed, and it reads the record's own catalog file over the page the record was "
      "read from")
check(W.shared_with("32162") == ["18094", "18095"] and W.own(bare, e) == "own_lines" and W.own_lines(bare, e),
      "its page was also read for 18094 and 18095, and the page's own lines show its section its own")
check(B7.Pile.own(W, bare, e) is None and B.HEADING_GONE.search(bare["record"]["program"]["section_heading"]),
      "S739's three forms do not show it: its heading says it sits on the page before")
check(set(B._words(bare["title"])) <= set(B._words(o["closes"])) and "22-27" in o["closes"]
      and B.same(bare["score"]["arithmetic"]["stated"], [22, 27])
      and B.award_kind(bare["award"]) == "transfer" and "transfer" in B.kinds_named(o["closes"]),
      "the closing line names the title and the award and prints the record's stated total")


def moved(change):
    g, x = copy.deepcopy(bare), copy.deepcopy(e)
    change(g, x)
    return W.own(g, x)


def heading(g, x):
    g["record"]["program"]["section_heading"] = "Physical Education University Studies – 18 Unit Emphasis"


def page(g, x):
    g["source_url"] = g["source_url"].replace("#page=100", "#page=101")


def total(g, x):
    x["own_lines"] = dict(o, closes=o["closes"].replace("22-27", "18"))


def award(g, x):
    x["own_lines"] = dict(o, closes="KINESIOLOGY DEGREE REQUIREMENTS: Major 22-27")


def no_plan(g, x):
    x["own_lines"] = dict(o, plan="kb/college_reads/no_such_plan.json")


def mate(g, x):
    x["own_lines"] = dict(o, closes=o["closes"] + " University Studies - Physical Education")


def stated(g, x):
    g["score"]["arithmetic"]["stated"] = [18, 18]


for name, change in (("another heading", heading), ("another page", page),
                     ("a closing line without the record's total", total),
                     ("a closing line that names no award", award), ("a plan that is not committed", no_plan),
                     ("a closing line that also carries the page-mate's title", mate),
                     ("a stated total the closing line does not print", stated)):
    check(moved(change) is None, "32162: with %s the record is not shown to be its own" % name)

for mate, title in (("18094", "University Studies - Physical Education"),
                    ("18095", "University Studies: Physical Sciences")):
    g = W.load(mate)
    check(g["title"] == title and not set(B._words(g["title"])) <= set(B._words(o["closes"]))
          and not B.same(g["score"]["arithmetic"].get("stated"), [22, 27])
          and "University Studies" in g["record"]["program"]["section_heading"],
          "%s, a page-mate, carries another title, another total and a University Studies heading" % mate)

check(W.hand["18625"].startswith("held") and not W.load("18625")["score"].get("gaps"),
      "18625: held, and it carries no gap")

sys.exit(t.done())
