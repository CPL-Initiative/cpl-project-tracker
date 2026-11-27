#!/usr/bin/env python3
"""S741, lane 1 (keys) at Solano: the four records S740 held on the own-page guard, 3 collected with total_differs, 1 held (kb/_program_piles_s741_solano.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): a record with a true gap is collected with the gap
named and a lower score, unless the record is not the program's own. College page read 45953233659 prints each
section line for line. The shared checks are tests/program_piles_s739_common.py's. Pinned here:

  * the four keys are s740c2's holds; 3 collected under total_differs (score 50), 43134 held;
  * each row is listed in kb/program_total_differs.json with its page's two figures, from the page read; its record
    reads both exactly; the record rule names the gap, and names nothing with the listing gone;
  * 30184 and 30185 were read from one PDF page, one section printed for both awards: each is shown its own by a note
    of its own (own_section), the listing quotes the page's sentence that each award is earned by the same 37-unit
    major, and with the note gone neither is shown its own (the heading alone, naming both awards, shows neither);
  * 30184 and 30185: ten required courses at 3 and six units of List A, 36 against the printed 37;
  * 38591: no other record was read from its page; its heading is the program's title and award; the one list asks
    for 18 units of nine 3-unit courses under a printed 27; the interpreter awards have their own records on another
    page;
  * 43134 shares its page with 06538, the same title and award, and nothing shows either its own;
  * the plan's test holds before and after its apply (the shared checks' skip).

Run from repo root: python3 tests/program_piles_s741_solano_test.py
"""
import copy
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s739 as B  # noqa: E402
import _program_piles_s741_solano as M  # noqa: E402

W = M.W
NG, S = B.NG, B.S
ROWS = {"30184": "total_differs", "30185": "total_differs", "38591": "total_differs"}
HELD = {"43134": ["06538 and 43134", "the inventory's call"]}
OWN = {"30184": "own_section", "30185": "own_section"}

t = T.run(W, rows=ROWS, held=HELD, scores={"total_differs": 50}, day="2026-11-27", boundaries=8, own=OWN)
check = t.check


def bare(cn):
    f = copy.deepcopy(W.load(cn))
    f["score"].pop("gaps", None)
    f["score"].pop("confidence", None)
    return f


check(W.receipt_path("2026-11-27").endswith("piles_s739_solano_community_2026-11-27_s741k4.json"), "the plan is s741k4")
check(all(e.get("page") for e in M.REVIEWED.values()) and M.PAGE_READ == "45953233659",
      "each entry carries its page's words, from the page read")

listed = NG.total_differs_list()
FIGURES = {"30184": (118, [37, 37], [36, 36]), "30185": (118, [37, 37], [36, 36]), "38591": (342, [27, 27], [18, 18])}
for cn, (page, total, summed) in FIGURES.items():
    e = listed.get((M.COLLEGE, cn)) or {}
    check(e.get("page") == page and e.get("printed_total") == total and e.get("printed_sum") == summed
          and e.get("run") == M.PAGE_READ, "%s is listed with the page's two figures, from the page read" % cn)
    f = bare(cn)
    a = f["score"]["arithmetic"]
    check(a["status"] == "unequal" and a["against"] == "program" and a["computed"] == [float(x) for x in summed]
          and a["stated"] == [float(x) for x in total], "%s: the record reads both figures exactly" % cn)
    rule = NG.answer(f)
    check(rule and rule[0] == "total_differs" and "PDF p.%d" % page in rule[1],
          "%s: the record rule names total_differs and the page" % cn)
    check(NG.total_differs(f, {}) is None, "%s: with the listing gone the rule names nothing" % cn)
    check(W.load(cn)["score"]["gaps"][0]["words"] == rule[1], "%s: the words filed are the rule's own" % cn)

# Mechatronics: one section for both awards.
a, c = bare("30184"), bare("30185")
check(W.shared_with("30184") == ["30185"] and W.shared_with("30185") == ["30184"] and a["source_url"] == c["source_url"],
      "30184 and 30185 were read from one PDF page, and no third record")
for cn in ("30184", "30185"):
    e = listed[(M.COLLEGE, cn)]
    check("The Certificate of Achievement can be obtained by completing the 37-unit major" in e["evidence"]
          and "The Associate in Science Degree can be obtained by completing the 37-unit major" in e["evidence"],
          "%s: the listing quotes the page's sentence that each award is earned by the same major" % cn)
    f = bare(cn)
    check(any(M.REVIEWED[cn]["own_section"] in n for n in B.notes(f)), "%s: its own note names the section as its award's" % cn)
    g = copy.deepcopy(f)
    g["record"]["notes"] = [n for n in B.notes(g) if M.REVIEWED[cn]["own_section"] not in n]
    check(W.own(g, M.REVIEWED[cn]) is None and W.outcome(g)[0] == "none",
          "%s: with the note gone it is not shown its own, and takes no gap" % cn)
    check(W.own(f, dict(M.REVIEWED[cn], own_section=None,
                        own_heading=f["record"]["program"]["section_heading"])) is None,
          "%s: the heading alone, naming both awards, does not show it its own" % cn)
    by = {b["name"].lower(): b for b in f["record"]["blocks"]}
    req, la = by["required courses"], by["list a"]
    check(len(req["courses"]) == 10 and all(x["units"] == 3 for x in req["courses"]) and la["rule"] == "choose_units"
          and la["minimum"] == 6 and B.pair(la["stated"]) == [6.0, 6.0],
          "%s: ten required courses at 3 and six units of List A, 36 in all" % cn)

# American Sign Language: its own page.
f = bare("38591")
check(not W.shared_with("38591") and f["source_url"].endswith("#page=342")
      and f["record"]["program"]["section_heading"] == "American Sign Language Associate in Arts"
      and f["title"] == "American Sign Language" and f["award"] == "A.A. Degree",
      "38591: no other record was read from its page, and its heading is the program's title and award")
blocks = f["record"]["blocks"]
check(len(blocks) == 1 and blocks[0]["rule"] == "choose_units" and blocks[0]["minimum"] == 18
      and [x["units"] for x in blocks[0]["courses"]] == [3] * 9,
      "38591: the one list asks for 18 units of nine 3-unit courses")
for cn in ("36455", "36457"):
    g = W.load(cn)
    check(g is not None and g["title"] == "ASL/English Interpreter Training" and g["source_url"].endswith("#page=343"),
          "%s: the interpreter award has its own record, read from the next page" % cn)

# World Languages: listed twice.
f, g = W.load("43134"), W.load("06538")
check(W.shared_with("43134") == ["06538"] and f["title"] == g["title"] and f["award"] == g["award"]
      and f["record"]["program"]["section_heading"] == g["record"]["program"]["section_heading"]
      and not f["score"].get("gaps"),
      "43134 and 06538 are one title and award read from one section, and 43134 carries no gap")
check(W.own(f, {"gap": "lists_not_closed", "own_heading": f["record"]["program"]["section_heading"]}) is None,
      "43134: its heading does not show it its own")

sys.exit(t.done())
