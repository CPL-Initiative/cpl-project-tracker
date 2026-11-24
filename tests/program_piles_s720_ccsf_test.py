#!/usr/bin/env python3
"""S720, lane 2's cheap piles at City College of San Francisco: the 26 keys S714 held (#3714's receipt), collected
with their gaps named (kb/_program_piles_s720_ccsf.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): never drop a record for failing; collect it with
its gaps noted and confidence scores, a gap noted instead of a reread. Pinned here:

  * the five new gaps and #3753's two carry a sentence and a unit-arithmetic score (the setdefault block in
    kb/_program_named_gaps.py, a no-op beside #3753's lines once both merge);
  * precision 26 of 26 against the hand reading, over the census members pinned in the fixture
    (p-test-pins-census-members-s714) and S713's six: 17 collected, 9 held (19037, another program's page; 17954, no
    live row; 32079 and 41315 on coverage; five with no record);
  * the claim check holds a record whose named course the capture did not find, a cut-off record whose capture holds
    the page the note says the read lacked, and a CNIT program whose capture page differs; every boundary reading
    names no gap;
  * the plan: 17 rows named exactly by the receipt and the four SQL files, the confirm guard, a second run plans
    none; the load's image of each committed record is its receipt's after-image, carrying its one gap.

Run from repo root: python3 tests/program_piles_s720_ccsf_test.py
"""
import copy
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CENSUS_AT_PLAN = os.path.join(ROOT, "tests", "fixtures", "harvest_gap_census_s720_ccsf.json")
RECEIPT = os.path.join(ROOT, "kb", "receipts", "program_requirement_records_piles_ccsf_2026-11-24_s720c.json")
MIG = os.path.join(ROOT, "kb", "migrations", "2026-11-24_s720c_prreq_piles_%s.sql")
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s720_ccsf as W  # noqa: E402

COLLEGE = "City College of San Francisco"
ROWS = {"05482": "noted_no_total", "33208": "noted_section_cut_off", "37781": "noted_section_cut_off",
        "38907": "noted_section_cut_off", "16990": "lists_not_closed", "38267": "lists_not_closed",
        "40157": "noted_figures_differ", "41361": "noted_figures_differ", "16991": "pool_figure_not_read",
        "38909": "pool_figure_not_read", "39727": "pair_read_as_alternatives"}
ROWS.update({cn: "one_option_of_shared_page" for cn in ("17614", "17615", "17616", "17617", "17618", "17619")})
HELD = {"19037", "17954", "32079", "41315", "09178", "17952", "31602", "36964", "42318"}
checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


for g, score in (("pool_figure_not_read", 40), ("one_option_of_shared_page", 30), ("pair_read_as_alternatives", 50),
                 ("lists_not_closed", 30), ("noted_figures_differ", 40), ("noted_no_total", 40),
                 ("noted_section_cut_off", 20)):
    check(g in NG.GAPS and NG.ARITH_SCORE.get(g) == score and g.isidentifier(), "%s has its sentence and score" % g)

members = W.census_members(CENSUS_AT_PLAN)
check(set(members) == set(ROWS) | HELD and len(members) == 26, "the fixture and S713's six give the 26 keys")
pr = W.precision(CENSUS_AT_PLAN)
check(pr["read"] == 26 and pr["right"] == 26 and not pr["wrong"] and pr["no_record_file"] == 5,
      "precision 26 of 26: %s" % pr["wrong"])

cc = W.claim_checks(CENSUS_AT_PLAN)
check(cc["counts"] == {"stands": 17} and not cc["not_standing"], "17 claims stand")
src = W._sources()
s2 = copy.deepcopy(src)
s2["39727"]["codes_found"] = [c for c in s2["39727"]["codes_found"] if c != "CHIN3B"]
check(W.claim(W._load("39727"), s2) == "a named course not found", "a named course the capture lacks holds it")
s3 = copy.deepcopy(src)
s3["33208"]["source"]["pages"] = list(s3["33208"]["source"]["pages"]) + [185]
check(W.claim(W._load("33208"), s3).startswith("the capture holds the page"), "a held page withdraws section_cut_off")
s4 = copy.deepcopy(src)
s4["17619"]["source"]["pages"] = [313]
check(W.claim(W._load("17614"), s4) == "the shared programs' capture pages differ", "the CNIT six share one page")

bd = W.boundaries(CENSUS_AT_PLAN)
check(not bd["wrong"] and sum(bd["counts"].values()) == 17 * 3, "every boundary reading names no gap: %s" % bd)

with open(RECEIPT, encoding="utf-8") as fh:
    rec = json.load(fh)
got = {r["control_number"]: r["moves_to"] for r in rec["records"]}
check(got == ROWS and rec["moved"] == 17, "the receipt names the 17 rows and their gaps")
check({h["control_number"] for h in rec["held"]} == HELD, "the receipt holds the 9")
check(rec["census"]["members"] == members, "the receipt's keys are the fixture's")
for part in ("apply", "preread", "preread_md5", "rollback"):
    with open(MIG % part, encoding="utf-8") as fh:
        sql = fh.read()
    check(all("'%s'" % cn in sql for cn in ROWS) and not any("'%s'" % cn in sql for cn in HELD),
          "%s names exactly the 17" % part)
    if part == "apply":
        check("confirm guard" in sql and "e(expect) as (values (17))" in sql, "the apply guards a confirm, expects 17")
check(W.plan(write=False, census_path=CENSUS_AT_PLAN)["rows"] == [], "a second run plans none")
images = NG._load_images({COLLEGE})
for r in rec["records"]:
    img = images[(COLLEGE, r["control_number"])]
    check(img["checks"] == r["after_image"]["checks"], "%s: the load posts the receipt's after-image" % r["control_number"])
    check(img["checks"].get("gaps") == [r["moves_to"]], "%s: the image carries its one gap" % r["control_number"])
    check(img["record"] == r["before_image"]["record"], "%s: the record is unchanged" % r["control_number"])
check(all(r["confidence"]["source"] == NG.OTHER_PAGE_SOURCE for r in rec["records"]
          if r["moves_to"] == "one_option_of_shared_page"), "a shared page's source scores 50 (#3753's second reader)")
check(not any(W.scorer_passes(W._load(cn)) for cn in ROWS), "the scorer passes none of the rows (#3753's MAJOR)")
cut = [r for r in rec["records"] if r["moves_to"] == "noted_section_cut_off"]
check(all((r["confidence"]["course_list_match"] or 0) <= NG.MAY_CONTINUE_CAP for r in cut),
      "a cut-off record's course-list match is capped")

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
