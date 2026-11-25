#!/usr/bin/env python3
"""S721, lane 2's cheap piles at Porterville: the census's 19 wording-rule records (kb/_program_piles_s721_porterville.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): never drop a record for failing; collect it with
its gaps noted and confidence scores, a gap noted instead of a reread. Pinned here:

  * each kind the plan files carries a sentence and a unit-arithmetic score in kb/_program_named_gaps.py;
  * precision 19 of 19 against the hand reading of the census members pinned in the fixture
    (p-test-pins-census-members-s714): 1 passed by its catalog's misprint, 14 collected, 4 held;
  * the rename: 43554's 'CGRAP P152' read as the listed CGRA P152 passes coverage and invented, and holds without the
    note, without the misprint, on a failing arithmetic, or where the capture found the listed code;
  * the claim check holds a record whose named course the capture did not find, a record whose capture holds the
    page its note says the read lacked, and a shared page without its own-section words; every boundary reading
    names no gap;
  * on_live_run reads a reread's kept keys for the two rows a two-run load inserted (30235, 36704);
  * the plan: 15 rows named exactly by the receipt and the four SQL files, the confirm guard, a second run plans
    none; the load's image of each committed record is its receipt's after-image, the record unchanged.

Run from repo root: python3 tests/program_piles_s721_porterville_test.py
"""
import copy
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CENSUS_AT_PLAN = os.path.join(ROOT, "tests", "fixtures", "harvest_gap_census_s721_porterville.json")
RECEIPT = os.path.join(ROOT, "kb", "receipts",
                       "program_requirement_records_piles_s721_porterville_2026-11-24_s721c.json")
MIG = os.path.join(ROOT, "kb", "migrations", "2026-11-24_s721c_prreq_piles_%s.sql")
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s721_porterville as W  # noqa: E402
import _program_requirements_score as S  # noqa: E402

COLLEGE = "Porterville College"
ROWS = {"06773": "pool_figure_not_read", "30235": "pool_figure_not_read",
        "06797": "noted_no_total", "09520": "noted_no_total", "35256": "noted_no_total", "36704": "noted_no_total",
        "37377": "noted_no_total", "41689": "noted_no_total", "44409": "noted_no_total", "44926": "noted_no_total",
        "45626": "noted_no_total", "06809": "noted_section_cut_off", "35239": "noted_figures_differ",
        "40122": "repeat_read_once", "43554": "passes"}
HELD = {"09528", "35229", "35449", "45511"}
OTHER_LEVER = {"36021", "36022", "36023", "37239", "44014"}
SCORES = {"pool_figure_not_read": 40, "noted_no_total": 40, "noted_section_cut_off": 20, "noted_figures_differ": 40,
          "repeat_read_once": 60}
checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


for g, score in SCORES.items():
    check(g in NG.GAPS and NG.ARITH_SCORE.get(g) == score and g.isidentifier(), "%s has its sentence and score" % g)
check(set(ROWS.values()) <= set(SCORES) | {W.PASSES}, "every kind filed is pinned")

members = W.census_members(CENSUS_AT_PLAN)
check(set(members) == set(ROWS) | HELD and len(members) == 19 and not set(W.PERSON) & set(members),
      "the fixture gives the 19 keys")
check(not OTHER_LEVER & set(members), "the reader_page_search records are another lever")
# S731's plan s731p (tests/fixtures/pooled_s731.json) takes two of the rows forward under its pooled reading: 06773
# and 30235 pass on their 18 over Groups I and II. Their files are s731p's, so this plan's rule no longer names
# their gap (precision reads them "none", and they make no claim and no boundary reading); s731p's test checks them.
with open(os.path.join(ROOT, "tests", "fixtures", "pooled_s731.json"), encoding="utf-8") as fh:
    LATER = {r["control_number"] for r in json.load(fh)["rows"] if r["college"] == COLLEGE}
check(LATER == {"06773", "30235"}, "s731p takes 06773 and 30235 forward (%s)" % sorted(LATER))
pr = W.precision(CENSUS_AT_PLAN)
check(pr["read"] == 19 and pr["right"] == 19 - len(LATER)
      and sorted(pr["wrong"]) == sorted([cn, "pool_figure_not_read", "none"] for cn in LATER),
      "precision 19 of 19, less the two s731p moved: %s" % pr["wrong"])
check(pr["by_answer"].get("none") == 4 and pr["by_answer"].get(W.PASSES) == 1, "4 held, 1 passed")

cc = W.claim_checks(CENSUS_AT_PLAN)
check(cc["counts"] == {"stands": 15 - len(LATER)} and not cc["not_standing"], "13 claims stand: %s" % cc)
src = W._sources()
s2 = copy.deepcopy(src)
s2["40122"]["codes_found"] = [c for c in s2["40122"]["codes_found"] if c != "MUSCP108"]
check(W.claim(W._load("40122"), s2) == "a named course not found", "a named course the capture lacks holds it")
s2 = copy.deepcopy(src)
s2["06809"]["source"] = dict(s2["06809"]["source"], pages=[84, 85])
check(W.claim(W._load("06809"), s2) == "the capture holds the page the note says the read lacked",
      "a capture holding page 85 holds 06809")
s2 = copy.deepcopy(src)
s2["43554"]["codes_found"] = s2["43554"]["codes_found"] + ["CGRAP152"]
check(W.claim(W._load("43554"), s2) == "the capture found the listed code on the page",
      "a capture that found CGRA P152 itself holds the rename")

bd = W.boundaries(CENSUS_AT_PLAN)
check(not bd["wrong"] and sum(bd["counts"].values()) == (14 - len(LATER)) * 3 + 1 + 3,
      "every boundary reading names no gap: %s" % bd)

with open(RECEIPT, encoding="utf-8") as fh:
    rec = json.load(fh)
got = {r["control_number"]: r["moves_to"] for r in rec["records"]}
check(got == ROWS and rec["moved"] == 15, "the receipt names the 15 rows and their answers")
check({h["control_number"] for h in rec["held"]} == HELD, "the receipt holds the 4")
check(rec["census"]["members"] == members, "the receipt's keys are the fixture's")
for part in ("apply", "preread", "preread_md5", "rollback"):
    with open(MIG % part, encoding="utf-8") as fh:
        sql = fh.read()
    check(all("'%s'" % cn in sql for cn in ROWS) and not any("'%s'" % cn in sql for cn in HELD | OTHER_LEVER),
          "%s names exactly the 15" % part)
    if part == "apply":
        check("confirm guard" in sql and "e(expect) as (values (15))" in sql, "the apply guards a confirm")
check(W.plan(write=False, census_path=CENSUS_AT_PLAN)["rows"] == [], "a second run plans none")
images = NG._load_images({COLLEGE})
for r in rec["records"]:
    if r["control_number"] in LATER:
        continue
    img = images[(COLLEGE, r["control_number"])]
    want = [] if r["moves_to"] == W.PASSES else [r["moves_to"]]
    check(img["checks"] == r["after_image"]["checks"], "%s: the load posts the receipt's after-image" % r["control_number"])
    check((img["checks"].get("gaps") or []) == want, "%s: the image carries its gap or none" % r["control_number"])
    check(img["record"] == r["before_image"]["record"], "%s: the record is unchanged" % r["control_number"])
    check(r["before_image"]["extracted_run"] == r["extracted_run"], "%s: the plan keeps its run" % r["control_number"])

# The rename: the filed score passes, the before-image did not, and the record still prints the misprint.
r43554 = next(r for r in rec["records"] if r["control_number"] == "43554")
f43554 = W._load("43554")
check(S.passes_live(f43554["score"]) and not r43554["before_image"]["checks"].get("coverage")
      and r43554["after_image"]["checks"].get("coverage") is True
      and r43554["after_image"]["checks"].get("invented") is True
      and r43554["after_image"]["checks"].get("arithmetic") == "equal", "43554 passes after the rename only")
check(f43554["score"].get("course_renumbers") == [{"printed": "CGRAP P152", "listed": "CGRAP152", "block": "List A"}],
      "43554's score names its one rename")
check(W._course(f43554, "CGRAP P152") and not W._course(f43554, "CGRA P152"), "43554's record prints the misprint")
unscored = copy.deepcopy(f43554)
unscored["score"].pop("course_renumbers")
unscored["score"]["coverage"] = dict(unscored["score"]["coverage"], **{"pass": False, "missing": ["CGRAP152"],
                                                                        "unexplained": ["CGRAP152"]})
unscored["score"]["invented"] = dict(unscored["score"]["invented"], codes=["CGRAPP152"], **{"pass": False})
check(W.renamed(unscored) is not None, "the rename passes the score as it was filed before the plan")
check(W.renamed(unscored, {"43554": dict(W.RENAMED["43554"], listed="CGRAP153")}) is None,
      "a rename to a course the file does not list passes nothing")
other = dict(unscored, control_number="45517")
check(W.renamed(other) is None, "the rename is 43554's alone (45517 lists CGRA P152 too)")

check(not any(W.scorer_passes(W._load(cn)) for cn in ROWS if ROWS[cn] != W.PASSES and cn not in LATER),
      "the scorer passes none of the gap rows (#3753's MAJOR)")
check(all(W.on_live_run(W._load(cn)) for cn in ROWS), "every row is on its live run")
# Read as the receipts stood before this plan's own apply (its s721c receipts post its rows once migrated).
before = W.posted_runs(skip=("s721c",))
check(before.get("30235") == [("2026-11-19T14:34:06Z", "44477695238")]
      and before.get("36704") == [("2026-11-19T14:34:06Z", "44477695238")],
      "the reread's kept keys post 30235 and 36704 at its run")
check(all(max(before[cn])[1] == W._load(cn)["extracted_run"] for cn in ROWS),
      "before the apply, every row's latest posted run is its committed run")
# After the apply, the plan's own rows post the same run, never another.
check(all(max(W.posted_runs()[cn])[1] == r["extracted_run"] for r in rec["records"] for cn in [r["control_number"]]),
      "the posted run is the plan's run, applied or not")
check(W.shared_with("06797") == ["43554"] and W.shared_with("45626") == ["45517"], "the shared pages are read")
e = dict(W.REVIEWED["06797"])
saved = W.REVIEWED["06797"]
e.pop("own_section")
W.REVIEWED["06797"] = e
check(W.claim(W._load("06797")) == "the page is shared and no note names the record's own section",
      "without its own-section words 06797's shared page holds it")
W.REVIEWED["06797"] = saved
check(W.claim(W._load("06797")) == "stands", "with them it stands")
check(W.shared_with("35449") == ["31849", "45634"] and "35449" not in W.REVIEWED, "35449 holds on its shared page")
check(W.shared_with("09528") == ["35227", "35229"] and "09528" not in W.REVIEWED and "35229" not in W.REVIEWED,
      "09528 and 35229, one record on a shared page, hold")

# 40122: MUSC P108 taken four times closes 20-21 to the printed 23-24 at both ends.
e = W.REVIEWED["40122"]
check(W.repeats_close(W._load("40122"), e) and e["repeats"] == [["MUSC P108", 1, 4]], "40122's repeat closes the sum")

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
