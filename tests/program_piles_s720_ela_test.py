#!/usr/bin/env python3
"""S720, lane 2's cheap piles at East Los Angeles: the 9 records S714 held (#3716), collected with their gaps named where honest (kb/_program_piles_s720_ela.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): never drop a record for failing; collect it with
its gaps noted and confidence scores, a gap noted instead of a reread. Pinned here:

  * each kind the plan files carries a sentence and a unit-arithmetic score in kb/_program_named_gaps.py;
  * precision 9 of 9 against the hand reading of the census members pinned in the fixture
    (p-test-pins-census-members-s714): 3 collected, 6 held;
  * the claim check holds a record whose named course the capture did not find; every boundary reading names no gap;
  * the plan: 3 rows named exactly by the receipt and the four SQL files, the confirm guard, a second run plans
    none; the load's image of each committed record is its receipt's after-image, carrying its one gap.

Run from repo root: python3 tests/program_piles_s720_ela_test.py
"""
import copy
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CENSUS_AT_PLAN = os.path.join(ROOT, "tests", "fixtures", "harvest_gap_census_s720_ela.json")
RECEIPT = os.path.join(ROOT, "kb", "receipts", "program_requirement_records_piles_s720_ela_2026-11-24_s720e.json")
MIG = os.path.join(ROOT, "kb", "migrations", "2026-11-24_s720e_prreq_piles_%s.sql")
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s720_ela as W  # noqa: E402

COLLEGE = 'East Los Angeles College'
ROWS = {'02430': 'nested_award_not_read', '08252': 'nested_award_not_read', '21157': 'nested_award_not_read'}
HELD = {'33013', '02456', '41231', '37510', '38168', '31017'}
SCORES = {'nested_award_not_read': 30}
checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


for g, score in SCORES.items():
    check(g in NG.GAPS and NG.ARITH_SCORE.get(g) == score and g.isidentifier(), "%s has its sentence and score" % g)
check(set(ROWS.values()) <= set(SCORES), "every kind filed is pinned")

members = W.census_members(CENSUS_AT_PLAN)
check(set(members) == set(ROWS) | HELD and len(members) == 9 and not set(W.PERSON) & set(members),
      "the fixture gives the 9 keys")
pr = W.precision(CENSUS_AT_PLAN)
check(pr["read"] == 9 and pr["right"] == 9 and not pr["wrong"], "precision 9 of 9: %s" % pr["wrong"])

cc = W.claim_checks(CENSUS_AT_PLAN)
check(cc["counts"] == {"stands": 3} and not cc["not_standing"], "3 claims stand")
src = W._sources()
s2 = copy.deepcopy(src)
s2['21157']["codes_found"] = [c for c in s2['21157']["codes_found"] if c != 'ARC110']
check(W.claim(W._load('21157'), s2) == "a named course not found", "a named course the capture lacks holds it")

bd = W.boundaries(CENSUS_AT_PLAN)
check(not bd["wrong"] and sum(bd["counts"].values()) == 9, "every boundary reading names no gap: %s" % bd)

with open(RECEIPT, encoding="utf-8") as fh:
    rec = json.load(fh)
got = {r["control_number"]: r["moves_to"] for r in rec["records"]}
check(got == ROWS and rec["moved"] == 3, "the receipt names the 3 rows and their gaps")
check({h["control_number"] for h in rec["held"]} == HELD, "the receipt holds the 6")
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
    check(img["checks"] == r["after_image"]["checks"], "%s: the load posts the receipt's after-image" % r["control_number"])
    check(img["checks"].get("gaps") == [r["moves_to"]], "%s: the image carries its one gap" % r["control_number"])
    check(img["record"] == r["before_image"]["record"], "%s: the record is unchanged" % r["control_number"])

W.REVIEWED["38168"] = {"gap": "noted_figures_differ", "words": "COMPLETE FOUR UNITS"}
check(W.claim(W._load("38168")) == "the page is shared and no note names the record's own section",
      "38168 holds on its shared page (the reader's BLOCKER)")
del W.REVIEWED["38168"]
check(not any(W.scorer_passes(W._load(cn)) for cn in ROWS), "the scorer passes none of the rows (#3753's MAJOR)")
check(set(rec.get("shared_pages") or {}) <= set(ROWS), "the receipt lists the rows' shared pages")
# S742's reread 46013175731 (force 45176404274) posted 02456's committed record: an older live extraction as this plan
# found it, or on its live run once that reread's receipt is committed.
_S742_REREAD = os.path.join(ROOT, "kb", "receipts",
                            "program_requirement_records_college_reread_east_los_angeles_46013175731.json")
check((not W.on_live_run(W._load("02456")) or os.path.exists(_S742_REREAD))
      and all(W.on_live_run(W._load(cn)) for cn in ROWS),
      "02456's live row is an older extraction (until S742's reread posts it); the rows are on their live runs")

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
