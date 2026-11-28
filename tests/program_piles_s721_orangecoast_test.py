#!/usr/bin/env python3
"""S721, lane 2's cheap piles at Orange Coast: the census's 20 wording-rule records, collected with their gaps named where honest (kb/_program_piles_s721_orangecoast.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): never drop a record for failing; collect it with
its gaps noted and confidence scores, a gap noted instead of a reread. Pinned here:

  * each kind the plan files carries a sentence and a unit-arithmetic score in kb/_program_named_gaps.py;
  * precision 20 of 20 against the hand reading of the census members pinned in the fixture
    (p-test-pins-census-members-s714): 3 collected, 17 held;
  * the guards are what hold 41373, 43362 (a shared page) and 36732 (on_live_run): each would take its gap without;
  * the free rules: today's scorer passes 08670 and 32737 once their pages' wording is read as a rule, and 42331 as
    it stands, so none is gap-filed;
  * the claim check holds a record whose named course the capture did not find; every boundary reading names no gap;
  * the plan: 3 rows named exactly by the receipt and the four SQL files, the confirm guard, a second run plans
    none; the load's image of each committed record is its receipt's after-image, carrying its one gap.

Run from repo root: python3 tests/program_piles_s721_orangecoast_test.py
"""
import copy
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CENSUS_AT_PLAN = os.path.join(ROOT, "tests", "fixtures", "harvest_gap_census_s721_orangecoast.json")
RECEIPT = os.path.join(ROOT, "kb", "receipts",
                       "program_requirement_records_piles_s721_orangecoast_2026-11-24_s721b.json")
MIG = os.path.join(ROOT, "kb", "migrations", "2026-11-24_s721b_prreq_piles_%s.sql")
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s721_orangecoast as W  # noqa: E402

# S739's plan s739j collects 36732, which this plan held for its live run. Its applied receipt posts that run, so
# this plan's own reading is pinned on the receipts as they stood before it.
W.SKIP = ("s739j",)
import _program_requirements_score as S  # noqa: E402

COLLEGE = "Orange Coast College"
ROWS = {"35182": "noted_figures_differ", "32189": "lists_not_closed", "19547": "unit_line_not_read"}
HELD = {"03954", "03993", "08628", "08663", "08664", "08670", "19473", "19474", "31217", "32737", "32790", "36032",
        "36732", "41373", "42331", "43100", "43362"}
SCORES = {"noted_figures_differ": 40, "lists_not_closed": 30, "unit_line_not_read": 40}
checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


for g, score in SCORES.items():
    check(g in NG.GAPS and NG.ARITH_SCORE.get(g) == score and g.isidentifier(), "%s has its sentence and score" % g)
check(set(ROWS.values()) <= set(SCORES), "every kind filed is pinned")

members = W.census_members(CENSUS_AT_PLAN)
check(set(members) == set(ROWS) | HELD and len(members) == 20 and not set(W.PERSON) & set(members),
      "the fixture gives the 20 keys")
pr = W.precision(CENSUS_AT_PLAN)
check(pr["read"] == 20 and pr["right"] == 20 and not pr["wrong"], "precision 20 of 20: %s" % pr["wrong"])

cc = W.claim_checks(CENSUS_AT_PLAN)
check(cc["counts"] == {"stands": 3} and not cc["not_standing"], "3 claims stand")
src = W._sources()
s2 = copy.deepcopy(src)
s2["35182"]["codes_found"] = [c for c in s2["35182"]["codes_found"] if c != "MATHA185"]
check(W.claim(W._load("35182"), s2) == "a named course not found", "a named course the capture lacks holds it")

bd = W.boundaries(CENSUS_AT_PLAN)
check(not bd["wrong"] and sum(bd["counts"].values()) == 10, "every boundary reading names no gap: %s" % bd)

# The guards hold three records whose notes carry a kind: each would take it without its guard.
SECOND = {
    "41373": {"gap": "noted_figures_differ", "computed": [29, 29], "stated": [28, 29],
              "words": "Catalog prints 'Total Major Units 28-29', but the listed required courses sum to 29 units"},
    "43362": {"gap": "noted_figures_differ", "computed": [40, 41.5], "stated": [38.5, 40],
              "words": "although the prerequisite course list itself sums to a printed 'Total Units 22'"},
    "36732": {"gap": "noted_figures_differ", "computed": [15, 19], "stated": [18, 19],
              "words": "12 core + 3-7 does not match 18-19"},
}
more = dict(W.REVIEWED, **SECOND)
# Either state of one pair, told by 08663's run. As s721b read it 43362's page was 08663's too, so 43362 held.
# S748's paid read (run 46122364368, reread 46125067463) filed 08663 from its own page, the Food and Beverage
# Management certificate's: 43362's page is then its own, and its claim stands. 41373 and 32086 are as they were.
MOVED_08663 = str(W._load("08663").get("extracted_run")) == "46122364368"
for cn in ("41373", "43362"):
    check(W.gap_noted(W._load(cn), more) is not None
          and bool(W.shared_with(cn)) == (not (cn == "43362" and MOVED_08663)), "%s: its notes carry the kind" % cn)
saved = dict(W.REVIEWED)
W.REVIEWED.update(SECOND)
check(W.claim(W._load("41373")) == "the page is shared" and W.shared_with("41373") == ["32086"],
      "41373's page is shared with 32086, so it holds")
check((W.claim(W._load("43362")), W.shared_with("43362"))
      == (("stands", []) if MOVED_08663 else ("the page is shared", ["08663"])),
      "43362's page is shared with 08663, so it holds, until S748's paid read files 08663 from its own page and "
      "43362's claim stands")
W.REVIEWED.clear()
W.REVIEWED.update(saved)
f36732 = W._load("36732")
check(not W.on_live_run(f36732) and W.gap_noted(f36732, more) is None, "36732 holds on on_live_run alone")
W._POSTED = dict(W.posted_runs(), **{"36732": [("9999", str(f36732["extracted_run"]))]})
check(W.gap_noted(f36732, more) == ("noted_figures_differ", next(n for n in f36732["record"]["notes"]
                                                                 if "12 core + 3-7" in n)),
      "36732 takes its gap once a receipt posts its run")
W._POSTED = None

# The free rules and the scorer: never a gap.
f = W._load("08670")
r = copy.deepcopy(f["record"])
r["program"]["degree_total_minimum"] = True
check(not W.scorer_passes(f) and S.score(r, [], "", f["award"])["arithmetic"]["status"] == "equal"
      and any("Minimum 60 units required for the degree" in n for n in f["record"]["notes"]),
      "08670: read as degree_total_minimum, today's scorer passes it")
f = W._load("32737")
r = copy.deepcopy(f["record"])
for b in r["blocks"]:
    if "Substitution Courses" in b["name"]:
        b["rule"] = "recommended"
check(not W.scorer_passes(f) and S.score(r, [], "", f["award"])["arithmetic"]["status"] == "equal",
      "32737: its substitution list read as no requirement, today's scorer passes it")
check(W.scorer_passes(W._load("42331")), "today's scorer passes 42331 as it stands")
# 43100 in either state, told by its committed coverage. As s721b read it coverage failed on PSYC A160. S748's plan
# s748c files the reading state_course_not_on_page (the page does not print the course): the committed score passes
# and keeps the scorer's own failing coverage beside it (coverage.as_scored), which is what this line reads then.
cov_43100 = W._load("43100")["score"]["coverage"]
check((cov_43100["as_scored"] == {"pass": False, "unexplained": ["PSYCA160"]} and cov_43100.get("pass") is True)
      if cov_43100.get("rescored") else not NG.collectable(W._load("43100")["score"]),
      "43100: coverage fails on the state's PSYC A160, as scored; S748's plan s748c explains the course and keeps "
      "that failing coverage in as_scored")
# s741b passes 08628, 19473 and 19474 by a rename of the page's two cross-listed codes
# (kb/_program_piles_s741_orangecoast.py): each fails coverage or invented as s721b read it, or carries that rename.
check(all(not NG.collectable(W._load(cn)["score"])
          or {x.get("printed") for x in W._load(cn)["score"].get("course_renumbers") or []}
          == {"ARCH/CNST A196", "ARCH/CNST A197"} for cn in ("08628", "19473", "19474")),
      "coverage or invented fails on the three, or s741b's rename of the two cross-listed codes passes it since")

# 19547's line is the page's own figures: Subtotal 67 less Program Major Units 49 is the 18 the record leaves out.
check(W.REVIEWED["19547"]["less"] == [-18, -18] and W.line_closes(
    "Program Major Units 49, AS OCC General Education up to 21, Subtotal 67", W.REVIEWED["19547"]),
    "19547's 18 is 67 less 49")
check(not W.line_closes("Program Major Units 49, Subtotal 68", W.REVIEWED["19547"]), "a subtotal not printed fails")

with open(RECEIPT, encoding="utf-8") as fh:
    rec = json.load(fh)
got = {r["control_number"]: r["moves_to"] for r in rec["records"]}
check(got == ROWS and rec["moved"] == 3, "the receipt names the 3 rows and their gaps")
check({h["control_number"] for h in rec["held"]} == HELD, "the receipt holds the 17")
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
    check(r["confidence"]["unit_arithmetic"] == SCORES[r["moves_to"]], "%s: its cap is its kind's" % r["control_number"])

check(not any(W.scorer_passes(W._load(cn)) for cn in ROWS), "the scorer passes none of the rows (#3753's MAJOR)")
check(all(W.on_live_run(W._load(cn)) for cn in ROWS), "every row is on its live run")
check(not any(W.shared_with(cn) for cn in ROWS), "no row's page is shared")

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
