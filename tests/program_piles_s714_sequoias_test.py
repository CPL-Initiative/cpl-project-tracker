#!/usr/bin/env python3
"""S714, lane 2's cheap piles at College of the Sequoias: the page's double-count figure as a capped overlap, its
self-recall and the plan (kb/_program_piles_s714_sequoias.py).

WHY. The S714 conductor's brief: the 22 reconcile_steps records at the college into passing records or named gaps by
free rule work, each rule with a claim check (the notes and today's capture), boundary readings and a precision count.
Pinned here:

  * the college's fill step reads "3 units may double count above in COS-GE", "0-3 units may double count" and "13
    units may be double counted above in Cal-GETC" and files the figure as ge_overlap, a span;
  * the scorer reads a span as the most a student counts twice: the printed total must lie between the sum less the
    figure and the sum (a sum past by more stays unequal); a flag of true keeps the uncapped overlap, and a transfer
    degree keeps its own overlap;
  * precision 22 of 22 against the hand reading on the run's filed records; no claim against; the boundary readings;
  * the plan's rows, each a hand-read passing record, named exactly by the receipt and the three SQL files.

Run from repo root: python3 tests/program_piles_s714_sequoias_test.py
"""
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CENSUS_AT_PLAN = os.path.join(ROOT, "tests", "fixtures", "harvest_gap_census_s714_sequoias.json")
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_piles_s714_sequoias as Q  # noqa: E402
import _program_requirements_score as S  # noqa: E402

checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


# ── the step ──
with open(os.path.join(ROOT, "kb", "program_requirements_reconcile.json"), encoding="utf-8") as fh:
    conf = json.load(fh)["colleges"]["College of the Sequoias"]
st = conf["steps"][0]
check(st["kind"] == "fill" and st["field"] == "ge_overlap" and st["awards"] == "local", "the fill step")
pat = re.compile(st["pattern"])
for words, want in (("Courses meet General Education requirements and 3 units may double count above in COS-GE.",
                     ("3", None)),
                    ("Course(s) meet General Education requirement and 0-3 units may double count above in COS-GE.",
                     ("0", "3")),
                    ("Course(s) meets General Education requirement and 13 units may be double counted above in "
                     "Cal-GETC.", ("13", None))):
    m = pat.search(words)
    check(m and (m.group("min"), m.group("max")) == want, "the step reads %r" % words[:60])
check(not pat.search("Courses meet General Education requirements."), "no figure, no fill")


# ── the scorer ──
def deg(lo_courses, total, overlap, award="A.S. Degree"):
    return {"program": {"total_units": {"min": None, "max": None}, "degree_total": {"min": total[0], "max": total[1]},
                        "ge_units": {"min": 25, "max": 25}, "ge_overlap": overlap},
            "blocks": [{"name": "REQUIRED MAJOR COURSES", "rule": "all",
                        "courses": [{"code": "X %d" % i, "units": u} for i, u in enumerate(lo_courses)]}]}


def arith(rec, award="A.S. Degree"):
    return S.score(rec, [], None, award)["arithmetic"]


check(arith(deg([20, 21], (60, 60), {"min": 6, "max": 6}))["pass"], "66 less 6 is 60: passes")
check(not arith(deg([20, 21], (60, 60), {"min": 5, "max": 5}))["pass"], "66 less 5 is 61: unequal")
check(arith(deg([20, 17], (60, 62), {"min": 0, "max": 3}))["pass"], "62 against 60-62 with 0-3: passes")
check(not arith(deg([20, 21], (60, 60), None))["pass"], "no figure: unequal")
check(arith(deg([20, 30], (60, 60), True))["pass"], "a flag of true keeps the uncapped overlap (75 against 60)")
check(not arith(deg([20, 30], (60, 60), {"min": 3, "max": 3}))["pass"], "a span caps it: 75 less 3 is 72, unequal")
check(not arith(deg([10, 10], (60, 60), {"min": 6, "max": 6}))["pass"], "a sum short of the total stays unequal")

# ── the self-recall, on the run's filed records ──
pr = Q.precision(CENSUS_AT_PLAN)
check(pr["read"] == 22 and pr["right"] == 22 and not pr["wrong"] and pr["by_answer"] == {"passes": 14, "none": 8},
      "precision: %r" % pr)
cc = Q.claim_checks(CENSUS_AT_PLAN)
check(not cc["not_standing"] and "against" not in cc["notes"] and cc["capture"] == {"stands": 14},
      "the claim checks: %r" % cc)
bd = Q.boundaries(CENSUS_AT_PLAN)
check(not bd["wrong"] and bd["counts"].get("total's top one past the sum right") == 14, "boundaries: %r" % bd)

# ── the plan ──
receipts = sorted(glob.glob(os.path.join(ROOT, "kb", "receipts", "program_requirement_records_piles_sequoias_*.json")))
check(receipts, "a receipt")
receipt = {"records": []}
if receipts:
    with open(receipts[-1], encoding="utf-8") as fh:
        receipt = json.load(fh)
rows = receipt["records"]
keys = {r["control_number"] for r in rows}
check(keys <= {cn for cn, w in Q.HAND_HELD.items() if w.startswith("passes")} and rows, "every row is a hand-read pass")
tag = os.path.basename(receipts[-1]).rsplit("_", 1)[1][:-5] if receipts else "none"
for part in ("apply", "preread", "rollback"):
    p = glob.glob(os.path.join(ROOT, "kb", "migrations", "*_%s_prreq_piles_%s.sql" % (tag, part)))
    check(p, "the %s file" % part)
    if p:
        text = open(p[0], encoding="utf-8").read()
        sql_keys = set(re.findall(r"^\s*\(\d+, 'College of the Sequoias', '(\d{5})', \d+,", text, re.M))
        check(sql_keys == keys, "the %s names exactly the plan's rows (%d of %d)" % (part, len(sql_keys), len(keys)))

if failures:
    for m in failures:
        print("FAIL:", m)
    sys.exit(1)
print("%d/%d checks passed: S714 College of the Sequoias piles (double count, the plan)" % (checks[0], checks[0]))
