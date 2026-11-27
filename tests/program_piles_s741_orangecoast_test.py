#!/usr/bin/env python3
"""S741, lane 2's cheap piles at Orange Coast: the eleven records s739j still held, three passed by a rename and one
collected with a named gap (kb/_program_piles_s741_orangecoast.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): a record with a true gap is collected with the gap
named, never held. s739j held 19473, 19474 and 08628 as not collectable on two codes the page prints as cross-listed
('ARCH/CNST A196', 'ARCH/CNST A197') where the state's file lists CNST A196 and CNST A197: each record's own note says
so, and the rename (S721's at Porterville) passes each. S740's read filed 08664 again, and its note quotes the two
figures that explain its sum. The shared checks are tests/program_piles_s739_common.py's. Pinned here:

  * the eleven keys are s739j's holds less 03954 and 31217, which S740's read passed; 4 collected, 7 held;
  * the three rename rows: each record prints both cross-listed codes and no listed one, the state's file lists CNST
    A196 and A197 and neither printed code, the filed score missed exactly those two, and its arithmetic was equal;
    one rename alone does not pass a row, and a rename of a code the record does not print stands for nothing;
  * 08628's page is its own: no other record was read from it, and the page read's committed plan names its page
    (the read printed 'Control Number: 08628' under the college's newer title);
  * 08664: the list at its heading's 20.5 closes the record at the printed 38.5-40, and at 21 it does not; its
    record is read 45858495107's, posted by its reread;
  * 42331: today's scorer passes it on its record, so no gap is filed (a closed-list rescore);
  * 08626 is no key, and it passes as filed.

Run from repo root: python3 tests/program_piles_s741_orangecoast_test.py
"""
import copy
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s741 as B8  # noqa: E402
import _program_piles_s741_orangecoast as M  # noqa: E402

W = M.W
B, NG, S = B8.B, B8.NG, B8.S
ROOT = T.ROOT
RENAMED = ("08628", "19473", "19474")
ROWS = {cn: B.PASSES for cn in RENAMED}
ROWS["08664"] = "noted_figures_differ"
HELD = {"03993": ["a reread"], "08663": ["not the program's own", "Control Number: 08663", "a site_pages pin"],
        "08670": ["Minimum 60 units"], "32790": ["44747523200"], "36032": ["Varies"],
        "42331": ["today's scorer passes it", "a closed-list rescore"], "43100": ["PSYC A160"]}

with open(os.path.join(ROOT, M.HELD_BY), encoding="utf-8") as fh:
    s739j = {h["control_number"] for h in json.load(fh)["held"]}
PASSED_SINCE = {"03954", "31217"}   # S740's read 45858495107
t = T.run(W, rows=ROWS, held=HELD, scores={"noted_figures_differ": 40}, day="2026-11-27", boundaries=13,
          prior_held=s739j - PASSED_SINCE)
check = t.check

check(s739j == set(M.KEYS) | PASSED_SINCE and all(S.passes_live(W.load(cn)["score"]) for cn in PASSED_SINCE),
      "the keys are s739j's holds less 03954 and 31217, which pass since S740's read")

with open(W.receipt_path("2026-11-27"), encoding="utf-8") as fh:
    receipt = {r["control_number"]: r for r in json.load(fh)["records"]}
listed_all = {cn: {S.norm_code(c.get("code")) for c in B.C.closed_list(M.COLLEGE, cn)} for cn in RENAMED}
table = {S.norm_code(k): S.norm_code(v) for k, v in M._CROSS.items()}
for cn in RENAMED:
    f, e, r = W.load(cn), M.PASSED[cn], receipt[cn]
    bc = r["before_image"]["checks"]
    check(r["reading"] == "renames" and r["renamed"] == M._CROSS and bc.get("coverage") is False
          and bc.get("invented") is False and bc.get("arithmetic") == "equal",
          "%s: the row failed coverage and invented with its arithmetic equal, and the plan passes it by the rename"
          % cn)
    check(set(table) <= B.codes(f) and not set(table.values()) & B.codes(f)
          and set(table.values()) <= listed_all[cn] and not set(table) & listed_all[cn],
          "%s: the record prints both cross-listed codes and neither listed one; the state's file lists CNST A196 "
          "and A197 and neither printed code" % cn)
    check(any(e["words"] in n for n in B.notes(f)), "%s: its own note names the two codes and the listed courses" % cn)
    got = {(S.norm_code(x.get("printed")), S.norm_code(x.get("listed"))) for x in f["score"].get("course_renumbers") or []}
    check(got == set(table.items()) and S.passes_live(f["score"]) and not f["score"].get("gaps"),
          "%s: the filed score carries exactly the two renames, passes, and carries no gap" % cn)
    check(not W.shared_with(cn), "%s: no other record was read from its page" % cn)
    # The record as it stood before the plan (its rescore taken off), under one rename alone.
    one = dict(M.PASSED[cn], renames={"ARCH/CNST A196": "CNST A196"})
    saved = W.passed
    try:
        W.passed = dict(saved, **{cn: one})
        g = copy.deepcopy(f)
        g["score"].pop("course_renumbers", None)
        g["score"]["coverage"] = dict(g["score"]["coverage"], **{"pass": False})
        g["score"]["pass"] = False
        check(W.renamed_score(g) is None, "%s: one rename alone does not pass the row" % cn)
        W.passed = dict(saved, **{cn: dict(M.PASSED[cn], renames={"ARCH/CNST A999": "CNST A196"})})
        check(W.renamed_score(f) is None, "%s: a rename of a code the record does not print stands for nothing" % cn)
    finally:
        W.passed = saved

c = M.CONTROL_08628
with open(os.path.join(ROOT, c["plan"]), encoding="utf-8") as fh:
    plan = json.load(fh)
f = W.load("08628")
check(c["run"] == M.CONTROL_READ and any(p["url"] == f["source_url"] and p.get("why") == "08628"
                                         and p.get("capture_view") for p in plan["pages"])
      and f["record"]["program"]["section_heading"] == c["heading"] and c["prints"].endswith("08628"),
      "08628: the page read's committed plan names its page, read as the capture reads it, under the heading its "
      "record carries")

f, e = W.load("08664"), M.REVIEWED["08664"]
words = f["score"]["gaps"][0]["words"]
bare = copy.deepcopy(f)
bare["score"].pop("gaps")
bare["score"].pop("confidence")
check(W.gap_noted(bare) == ("noted_figures_differ", words) and e["words"] in words and NG.answer(bare) is None,
      "08664: the entry stands on the record as it was filed, with its note's words, and no record rule names a kind")
check(B.closes(bare, B.apply_ops(bare, e["ops"]))
      and not B.closes(bare, B.apply_ops(bare, [("choose", M._PREREQ, 21)])),
      "08664: the prerequisite list at its heading's 20.5 closes the record at 38.5-40; at 21 it does not")
block = B.blocks(bare, M._PREREQ)[0]
check(B.same(block["stated"], [22, 22]) and "(20.5 Units)" in block["name"] and str(f["extracted_run"]) == M.READ,
      "08664: the record holds the list at 22 under a heading that prints 20.5, as read 45858495107 filed it")
with open(os.path.join(NG.RECEIPTS, "program_requirement_records_piles_s739_orange_coast_2026-11-26_s739j.json"),
          encoding="utf-8") as fh:
    sister = next(r for r in json.load(fh)["records"] if r["control_number"] == "43362")
check(sister["moves_to"] == "noted_figures_differ", "43362, its sister certificate, carries the same gap (s739j)")

f = W.load("42331")
check(B.scorer_passes(f) and not f["score"].get("gaps") and W.gap_noted(f, {"42331": {
    "gap": B8.WITHIN, "words_from": "figures", "shape": ["within"], "computed": [11.5, 16], "stated": [9.5, 16]}}) is None,
      "42331: today's scorer passes it on its record, so the within-range kind is refused and it carries no gap")
f = W.load("08626")
check("08626" not in M.KEYS and S.passes_live(f["score"]) and "airframe-powerplant" in f["source_url"],
      "08626 is no key: it passes as filed, read from the Airframe & Powerplant page")

sys.exit(t.done())
