#!/usr/bin/env python3
"""S720, lane 2's cheap piles at Clovis: the 8 records S713 held for Sky (S713's Clovis receipt), collected with their gaps named where honest (kb/_program_piles_s720_clovis.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): never drop a record for failing; collect it with
its gaps noted and confidence scores, a gap noted instead of a reread. Pinned here:

  * each kind the plan files carries a sentence and a unit-arithmetic score in kb/_program_named_gaps.py;
  * precision 8 of 8 against the hand reading of the census members pinned in the fixture
    (p-test-pins-census-members-s714): 3 collected, 5 held;
  * the claim check holds a record whose named course the capture did not find; every boundary reading names no gap;
  * the plan: 3 rows named exactly by the receipt and the four SQL files, the confirm guard, a second run plans
    none; the load's image of each committed record is its receipt's after-image, carrying its one gap.

Run from repo root: python3 tests/program_piles_s720_clovis_test.py
"""
import copy
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CENSUS_AT_PLAN = os.path.join(ROOT, "tests", "fixtures", "harvest_gap_census_s720_clovis.json")
RECEIPT = os.path.join(ROOT, "kb", "receipts", "program_requirement_records_piles_s720_clovis_2026-11-24_s720v.json")
MIG = os.path.join(ROOT, "kb", "migrations", "2026-11-24_s720v_prreq_piles_%s.sql")
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s720_clovis as W  # noqa: E402

COLLEGE = 'Clovis Community College'
ROWS = {'33489': 'pool_figure_not_read', '36050': 'lists_not_closed', '43015': 'pair_read_as_alternatives'}
HELD = {'33431', '37227', '33506', '33432', '45325'}

# S721's plan s721p (kb/_program_pooled_s721.py) reads the one figure these rows' pages print over several lists as one
# pool. MOVED_S721P: the scorer now passes them, so S720's reading files no gap on them, and s721p moves their live rows
# to passing with no gap. RESCORED_S721P: the reading moves the sum and the record still fails, so its filed gap and
# its image stand while S720's reading of the old sum no longer does. These sets pin only the keys s721p moved;
# every other key stays pinned to S720's reading as before.
MOVED_S721P = {'33489'}
RESCORED_S721P = set()
LEFT_S721P = MOVED_S721P | RESCORED_S721P
with open(os.path.join(ROOT, "kb", "receipts", "program_requirement_records_pooled_s721_2026-11-24_s721p.json"),
          encoding="utf-8") as fh:
    S721P_AFTER = {r["control_number"]: r["after_image"]["checks"] for r in json.load(fh)["records"]
                   if r["college"] == COLLEGE}
SCORES = {'lists_not_closed': 30, 'pool_figure_not_read': 40, 'pair_read_as_alternatives': 50}
checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


for g, score in SCORES.items():
    check(g in NG.GAPS and NG.ARITH_SCORE.get(g) == score and g.isidentifier(), "%s has its sentence and score" % g)
check(set(ROWS.values()) <= set(SCORES), "every kind filed is pinned")

members = W.census_members(CENSUS_AT_PLAN)
check(set(members) == set(ROWS) | HELD and len(members) == 8 and not set(W.PERSON) & set(members),
      "the fixture gives the 8 keys")
pr = W.precision(CENSUS_AT_PLAN)
check(pr["read"] == 8 and pr["right"] == 8 - len(LEFT_S721P) and sorted(w[0] for w in pr["wrong"]) == sorted(LEFT_S721P), "precision 8 of 8: %s" % pr["wrong"])

cc = W.claim_checks(CENSUS_AT_PLAN)
check(cc["counts"] == {"stands": 3 - len(LEFT_S721P)} and not cc["not_standing"], "3 claims stand")
src = W._sources()
s2 = copy.deepcopy(src)
s2['43015']["codes_found"] = [c for c in s2['43015']["codes_found"] if c != 'CHEM1B']
check(W.claim(W._load('43015'), s2) == "a named course not found", "a named course the capture lacks holds it")

bd = W.boundaries(CENSUS_AT_PLAN)
check(not bd["wrong"] and sum(bd["counts"].values()) == 9 - 3 * len(LEFT_S721P), "every boundary reading names no gap: %s" % bd)

with open(RECEIPT, encoding="utf-8") as fh:
    rec = json.load(fh)
got = {r["control_number"]: r["moves_to"] for r in rec["records"]}
check(got == ROWS and rec["moved"] == 3, "the receipt names the 3 rows and their gaps")
check({h["control_number"] for h in rec["held"]} == HELD, "the receipt holds the 5")
check(rec["census"]["members"] == members, "the receipt's keys are the fixture's")
for part in ("apply", "preread", "preread_md5", "rollback"):
    with open(MIG % part, encoding="utf-8") as fh:
        sql = fh.read()
    check(all("'%s'" % cn in sql for cn in ROWS) and not any("'%s'" % cn in sql for cn in HELD | set(W.PERSON)),
          "%s names exactly the 3" % part)
    if part == "apply":
        check("confirm guard" in sql and "e(expect) as (values (3))" in sql, "the apply guards a confirm")
check(W.plan(write=False, census_path=CENSUS_AT_PLAN)["rows"] == [], "a second run plans none")
images = NG._load_images({COLLEGE})
for r in rec["records"]:
    img = images[(COLLEGE, r["control_number"])]
    if r["control_number"] in MOVED_S721P:
        check(img["checks"] == S721P_AFTER[r["control_number"]] and not img["checks"].get("gaps")
              and img["checks"].get("arithmetic") == "equal",
              "%s: the load posts s721p's after-image, passing with no gap" % r["control_number"])
        check(img["record"] == r["before_image"]["record"], "%s: the record is unchanged" % r["control_number"])
        continue
    check(img["checks"] == r["after_image"]["checks"], "%s: the load posts the receipt's after-image" % r["control_number"])
    check(img["checks"].get("gaps") == [r["moves_to"]], "%s: the image carries its one gap" % r["control_number"])
    check(img["record"] == r["before_image"]["record"], "%s: the record is unchanged" % r["control_number"])

check(not any(W.scorer_passes(W._load(cn)) for cn in ROWS if cn not in MOVED_S721P), "the scorer passes none of the rows (#3753's MAJOR)")
check(set(rec.get("shared_pages") or {}) <= set(ROWS), "the receipt lists the rows' shared pages")

check(all(W.scorer_passes(W._load(cn)) for cn in MOVED_S721P), "the pooled reading passes the rows s721p moves")

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
