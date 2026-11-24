#!/usr/bin/env python3
"""S721, lane 2's cheap piles at Gavilan: the census's 18 wording-rule records, collected with their gaps named where honest (kb/_program_piles_s721_gavilan.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): never drop a record for failing; collect it with
its gaps noted and confidence scores, a gap noted instead of a reread. Pinned here:

  * each kind the plan files carries a sentence and a unit-arithmetic score in kb/_program_named_gaps.py;
  * precision 18 of 18 against the hand reading of the census members pinned in the fixture
    (p-test-pins-census-members-s714): 10 collected, 8 held;
  * every entry's own figure check holds on its record, and moved one unit it names no gap;
  * the plan: 10 rows named exactly by the receipt and the four SQL files, the confirm guard, a second run plans
    none; the load's image of each committed record is its receipt's after-image, carrying its one gap.

Run from repo root: python3 tests/program_piles_s721_gavilan_test.py
"""
import copy
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CENSUS_AT_PLAN = os.path.join(ROOT, "tests", "fixtures", "harvest_gap_census_s721_gavilan.json")
RECEIPT = os.path.join(ROOT, "kb", "receipts", "program_requirement_records_piles_s721_gavilan_2026-11-24_s721d.json")
MIG = os.path.join(ROOT, "kb", "migrations", "2026-11-24_s721d_prreq_piles_%s.sql")
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s721_gavilan as W  # noqa: E402

COLLEGE = "Gavilan College"
ROWS = {"08460": "noted_figures_differ", "15555": "noted_figures_differ", "19378": "noted_figures_differ",
        "37750": "noted_figures_differ", "38787": "noted_figures_differ", "06129": "pool_figure_not_read",
        "39624": "pool_figure_not_read", "14041": "lists_not_closed", "18453": "lists_not_closed",
        "38119": "lists_not_closed"}
HELD = {"06128", "06132", "08464", "18541", "24369", "37896", "41394", "45357"}
SCORES = {"noted_figures_differ": 40, "pool_figure_not_read": 40, "lists_not_closed": 30}
checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


for g, score in SCORES.items():
    check(g in NG.GAPS and NG.ARITH_SCORE.get(g) == score and g.isidentifier(), "%s has its sentence and score" % g)
check(set(ROWS.values()) <= set(SCORES), "every kind filed is pinned")
# #3762's two kinds are not on this branch: a record that needs one is held with the kind named.
check("figure_within_variable_units" not in W.REVIEWED and "figure_within_variable_units" in W.HAND["06128"],
      "06128 holds with #3762's kind named")

members = W.census_members(CENSUS_AT_PLAN)
check(set(members) == set(ROWS) | HELD and len(members) == 18 and not set(W.PERSON) & set(members),
      "the fixture gives the 18 keys")
pr = W.precision(CENSUS_AT_PLAN)
check(pr["read"] == 18 and pr["right"] == 18 and not pr["wrong"], "precision 18 of 18: %s" % pr["wrong"])
check(pr["by_answer"] == {"none": 8, "noted_figures_differ": 5, "pool_figure_not_read": 2, "lists_not_closed": 3},
      "the hand reading's answers: %s" % pr["by_answer"])

cc = W.claim_checks(CENSUS_AT_PLAN)
check(cc["counts"] == {"stands": 10} and not cc["not_standing"], "10 claims stand")
bd = W.boundaries(CENSUS_AT_PLAN)
check(not bd["wrong"] and sum(bd["counts"].values()) == 40, "every boundary reading names no gap: %s" % bd)

# The figure checks, one per kind, on the records' own figures.
check(all(W.noted_closes(W.REVIEWED[cn]) for cn in ROWS if ROWS[cn] == "noted_figures_differ"),
      "each noted difference is the record's computed less its stated")
check(W.pool_closes(W._load("06129"), W.REVIEWED["06129"]), "06129: 13-15 + 11 + 35-39 is the printed 59-65")
check(W.pool_closes(W._load("39624"), W.REVIEWED["39624"]), "39624: 12-20 + 0-22 is the printed 12-42")
e = copy.deepcopy(W.REVIEWED["39624"])
e["closes"][0][2] = "prints 'Units: 12- 21'"
check(not W.pool_closes(W._load("39624"), e), "39624: a quoted figure the notes lack closes nothing")
check(W.list_open(W._load("14041"), W.REVIEWED["14041"]) and W.list_open(W._load("38119"), W.REVIEWED["38119"]),
      "14041 and 38119 carry their open elective list")
check(W.list_open(W._load("18453"), W.REVIEWED["18453"]), "18453's five lists reach 17, short of 18")

# The held records, each by its own reason.
check(not W.on_live_run(W._load("08464")) and not W._load("08464")["record"].get("notes"),
      "08464 holds: no notes, and its committed run is not its live row's")
c37896 = W._load("37896")["score"]["arithmetic"]
check(c37896["computed"] == [65.0, 72.0] and c37896["stated"] == [64.0, 64.0],
      "37896's high end differs by 8, the core's noted 1 explains only the low end")

with open(RECEIPT, encoding="utf-8") as fh:
    rec = json.load(fh)
got = {r["control_number"]: r["moves_to"] for r in rec["records"]}
check(got == ROWS and rec["moved"] == 10, "the receipt names the 10 rows and their gaps")
check({h["control_number"] for h in rec["held"]} == HELD, "the receipt holds the 8")
check(rec["census"]["members"] == members, "the receipt's keys are the fixture's")
check(rec["local_proof"]["apply"].startswith("returned 10"), "the receipt records the local proof")
for part in ("apply", "preread", "preread_md5", "rollback"):
    with open(MIG % part, encoding="utf-8") as fh:
        sql = fh.read()
    check(all("'%s'" % cn in sql for cn in ROWS) and not any("'%s'" % cn in sql for cn in HELD | set(W.PERSON)),
          "%s names exactly the 10" % part)
    if part == "apply":
        check("confirm guard" in sql and "e(expect) as (values (10))" in sql, "the apply guards a confirm")
check(W.plan(write=False, census_path=CENSUS_AT_PLAN)["rows"] == [], "a second run plans none")
images = NG._load_images({COLLEGE})
for r in rec["records"]:
    img = images[(COLLEGE, r["control_number"])]
    check(img["checks"] == r["after_image"]["checks"], "%s: the load posts the receipt's after-image" % r["control_number"])
    check(img["checks"].get("gaps") == [r["moves_to"]], "%s: the image carries its one gap" % r["control_number"])
    check(img["record"] == r["before_image"]["record"], "%s: the record is unchanged" % r["control_number"])

check(not any(W.scorer_passes(W._load(cn)) for cn in ROWS), "the scorer passes none of the rows (#3753's MAJOR)")
check(all(W.on_live_run(W._load(cn)) for cn in ROWS), "every row is on its live run")
check(not any(W.shared_with(cn) for cn in ROWS), "no row's page is shared")

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
