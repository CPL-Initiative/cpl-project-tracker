#!/usr/bin/env python3
"""S720, lane 2's cheap piles at Fullerton: S714's 13 held records collected with their gaps named
(kb/_program_piles_s720_fullerton.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): never drop a record for failing; collect it with
its gaps noted and confidence scores, a gap noted instead of a reread. Pinned here, so a later edit cannot quietly
move a record:

  * the four gaps carry a sentence and a unit-arithmetic score in kb/_program_named_gaps.py;
  * precision 13 of 13 against the hand reading of the census members pinned in the fixture (never the live census,
    p-test-pins-census-members-s714): 9 collected, 4 held (36798 by the claim check, its capture reads the UC-transfer
    page; 18166, 18749 and 36863 on coverage);
  * the claim check holds a record whose capture's page is not the one its entry names, and one whose named course
    the capture did not find; every boundary reading names no gap;
  * the plan: 9 rows named exactly by the receipt and the four SQL files, the confirm guard present, a second run
    plans none; the load's image of each committed record is its receipt's after-image, carrying its one gap.

Run from repo root: python3 tests/program_piles_s720_fullerton_test.py
"""
import copy
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CENSUS_AT_PLAN = os.path.join(ROOT, "tests", "fixtures", "harvest_gap_census_s720_fullerton.json")
RECEIPT = os.path.join(ROOT, "kb", "receipts", "program_requirement_records_piles_fullerton_2026-11-24_s720f.json")
MIG = os.path.join(ROOT, "kb", "migrations", "2026-11-24_s720f_prreq_piles_%s.sql")
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s720_fullerton as W  # noqa: E402

COLLEGE = "Fullerton College"
ROWS = {"03853": "lists_not_closed", "03866": "lists_not_closed", "18163": "pool_figure_not_read",
        "08420": "noted_figures_differ", "42394": "noted_unit_floor", "08422": "no_own_page_total"}
HELD = {"35174", "36798", "33680", "42143", "18166", "18749", "36863"}

# S721's plan s721p (kb/_program_pooled_s721.py) reads the one figure these rows' pages print over several lists as one
# pool. MOVED_S721P: the scorer now passes them, so S720's reading files no gap on them, and s721p moves their live rows
# to passing with no gap. RESCORED_S721P: the reading moves the sum and the record still fails, so its filed gap and
# its image stand while S720's reading of the old sum no longer does. These sets pin only the keys s721p moved;
# every other key stays pinned to S720's reading as before.
MOVED_S721P = {'18163'}
RESCORED_S721P = set()
LEFT_S721P = MOVED_S721P | RESCORED_S721P
with open(os.path.join(ROOT, "kb", "receipts", "program_requirement_records_pooled_s721_2026-11-24_s721p.json"),
          encoding="utf-8") as fh:
    S721P_AFTER = {r["control_number"]: r["after_image"]["checks"] for r in json.load(fh)["records"]
                   if r["college"] == COLLEGE}
checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


# The gaps' sentences and scores.
for g, score in (("noted_figures_differ", 40), ("noted_unit_floor", 70), ("lists_not_closed", 30),
                 ("no_own_page_total", 20), ("pool_figure_not_read", 40)):
    check(g in NG.GAPS and NG.ARITH_SCORE.get(g) == score and g.isidentifier(), "%s has its sentence and score" % g)
check(set(W.GAPS) == {"noted_figures_differ", "noted_unit_floor", "lists_not_closed", "no_own_page_total"},
      "the module names the four gaps")

# The census pinned, and the hand reading of every member.
members = W.F.census_members(CENSUS_AT_PLAN)
check(set(members) == set(ROWS) | HELD and len(members) == 13, "the fixture pins the 13 members")
pr = W.precision(CENSUS_AT_PLAN)
check(pr["read"] == 13 and pr["right"] == 13 - len(LEFT_S721P) and sorted(w[0] for w in pr["wrong"]) == sorted(LEFT_S721P) and not pr["not_hand_held"],
      "precision 13 of 13: %s" % pr["wrong"])

# The claim check (#3753's second reader, BLOCKER): capture.json's shared_pages puts 35174 and 36798 on the
# UC-transfer page, so neither page is the record's own.
cc = W.claim_checks(CENSUS_AT_PLAN)
check(cc["not_standing"] == [["35174", "the capture's page is not the program's own"],
                             ["36798", "the capture's page is not the program's own"]], "35174 and 36798 fail the claim")
check(W.shared_with("35174") == ["36798"] and W.shared_with("03853") == [], "shared_pages read from capture.json")
src = W._sources()
f = W.F._load("42394")
s2 = copy.deepcopy(src)
s2["42394"]["codes_found"] = [c for c in s2["42394"]["codes_found"] if c != "NUTR295F"]
check(W.claim(f, s2) == "a named course not found", "a named course the capture did not find holds the record")
# #3753's second reader (MAJOR): today's scorer passes 33680 and 42143 on their own records, so neither takes a gap.
check(W.scorer_passes(W.F._load("33680")) and W.scorer_passes(W.F._load("42143")), "the scorer passes 33680, 42143")
check(W.gap_noted(W.F._load("33680")) is None and W.gap_noted(W.F._load("42143")) is None,
      "a record the scorer passes is never gap-filed")
check(not any(W.scorer_passes(W.F._load(cn)) for cn in ROWS if cn not in MOVED_S721P), "the scorer passes none of the six")
s3 = copy.deepcopy(src)
s3["08422"]["source"]["h1"] = "Musical Theatre Level 1 Certificate"
check(W.claim(W.F._load("08422"), s3) == "the capture's page is not another award's",
      "no_own_page_total needs another award's page")

# The boundary readings.
bd = W.boundaries(CENSUS_AT_PLAN)
check(not bd["wrong"] and sum(bd["counts"].values()) == (8 - len(LEFT_S721P)) * 3 + 1, "every boundary reading names no gap: %s" % bd)

# The plan.
with open(RECEIPT, encoding="utf-8") as fh:
    rec = json.load(fh)
got = {r["control_number"]: r["moves_to"] for r in rec["records"]}
check(got == ROWS and rec["moved"] == 6, "the receipt names the 6 rows and their gaps")
check({h["control_number"] for h in rec["held"]} == HELD, "the receipt holds the 7")
check({r["control_number"]: r["confidence"]["source"] for r in rec["records"]}["08422"] == NG.OTHER_PAGE_SOURCE,
      "no_own_page_total scores its source at 50")
check(rec["census"]["members"] == members, "the receipt's census is the fixture's")
for part in ("apply", "preread", "preread_md5", "rollback"):
    with open(MIG % part, encoding="utf-8") as fh:
        sql = fh.read()
    check(all("'%s'" % cn in sql for cn in ROWS) and not any("'%s'" % cn in sql for cn in HELD),
          "%s names exactly the 6" % part)
    if part == "apply":
        check("confirm guard" in sql and "e(expect) as (values (6))" in sql, "the apply guards a confirm and expects 6")
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

check(all(W.scorer_passes(W.F._load(cn)) for cn in MOVED_S721P), "the pooled reading passes the rows s721p moves")

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
