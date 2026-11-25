#!/usr/bin/env python3
"""S730, lane 2's cheap piles at Saddleback: the census's 17 wording-rule records, 8 collected with gaps named (kb/_program_piles_s730_saddleback.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): never drop a record for failing; collect it with
its gaps noted and confidence scores, a gap noted instead of a reread; a record a cheaper lever passes is held on it
(p-gap-filing-leaves-census-lever-s721). Pinned here:

  * each kind the plan files carries a sentence and a unit-arithmetic score in kb/_program_named_gaps.py, the new
    waived_course_counted (50) among them;
  * precision 17 of 17 against the hand reading of the census members pinned in the fixture
    (p-test-pins-census-members-s714): 8 collected, 9 held; each shape check reads 17 of 17 right, and each fires on
    exactly the statewide records tests/fixtures/saddleback_shapes_statewide_s730.json pins, the waiver shape leaving
    out Los Angeles City 02746, whose note names prerequisites;
  * the seven repeat records stay on the reconcile lever: with the course taken twice, as a repeat step writes it,
    today's scorer reads the printed total, and none takes a gap;
  * each kind's own figures: read as the scorer's option parts, the specialty and pattern records give the printed
    total; read at 0 to its units, the waived course gives the printed range; 04073 needs two readings and holds;
  * the own-page guard keys on the pages the records were read from (each record its own curriQunet page), and the
    claim check holds a record whose named course the capture did not find; every boundary reading names no gap;
  * the plan: 8 rows named exactly by the receipt and the four SQL files, the confirm guard, a second run plans none;
    the load's image of each committed record is its receipt's after-image, carrying its one gap;
  * every row is on its live run both as the receipts stood before this plan's own apply (posted_runs(skip=...)) and
    after it, so the test holds before and after the conductor's apply (p-test-reads-own-apply-receipt-s721).

Run from repo root: python3 tests/program_piles_s730_saddleback_test.py
"""
import copy
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CENSUS_AT_PLAN = os.path.join(ROOT, "tests", "fixtures", "harvest_gap_census_s730_saddleback.json")
RECEIPT = os.path.join(ROOT, "kb", "receipts",
                       "program_requirement_records_piles_s730_saddleback_2026-11-25_s730b.json")
MIG = os.path.join(ROOT, "kb", "migrations", "2026-11-25_s730b_prreq_piles_%s.sql")
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s730_saddleback as W  # noqa: E402

COLLEGE = "Saddleback College"
OPT = ("30206", "30207", "36628", "40322")
WAIVED = ("04069", "22874", "41673", "41674")
ROWS = dict({cn: "option_lists_read_apart" for cn in OPT}, **{cn: "waived_course_counted" for cn in WAIVED})
LEVER = {"19050", "19051", "41420", "41422", "41423", "41425", "41426"}
HELD = LEVER | {"04073", "36625"}
SCORES = {"option_lists_read_apart": 40, "waived_course_counted": 50}
checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


for g, score in SCORES.items():
    check(g in NG.GAPS and NG.ARITH_SCORE.get(g) == score and g.isidentifier(), "%s has its sentence and score" % g)
check(set(ROWS.values()) == set(SCORES), "every kind filed is pinned")
check(W.NEW_KINDS == {"waived_course_counted": 50}, "the one new kind")

members = W.census_members(CENSUS_AT_PLAN)
check(set(members) == set(ROWS) | HELD and len(members) == 17 and not set(W.PERSON) & set(members),
      "the fixture gives the 17 keys")
pr = W.precision(CENSUS_AT_PLAN)
check(pr["read"] == 17 and pr["right"] == 17 and not pr["wrong"], "precision 17 of 17: %s" % pr["wrong"])
sr = W.self_recall(CENSUS_AT_PLAN)
check(all(v["right"] == 17 and not v["wrong"] for v in sr.values()), "each shape check reads 17 of 17: %s" % sr)
ff = W.fixture_fires()
check(ff == {k: set(v) for k, v in W.STATEWIDE.items()}, "each shape fires on its pinned statewide records")
check(len(W.STATEWIDE["option_key"]) == 4 and len(W.STATEWIDE["waived_shape"]) == 15
      and ("San Bernardino Valley College", "22784") in W.STATEWIDE["waived_shape"], "4 and 15 statewide fires")
lacc = [r for r in W.fixture_records() if r["control_number"] == "02746"]
check(len(lacc) == 1 and not W.waived_shape(lacc[0])
      and W.waived_shape(dict(lacc[0], record=dict(lacc[0]["record"], notes=[
          n.replace("PREREQUISITES", "").replace("prerequisites", "") for n in lacc[0]["record"]["notes"]]))),
      "02746 is left out by its prerequisite words alone")

lv = W.lever(CENSUS_AT_PLAN)
check(lv == {"right": 7, "wrong": []}, "the seven repeat records pass on the lever's reading: %s" % lv)
for cn in LEVER:
    f = W._load(cn)
    e = W.ON_LEVER[cn]
    a = W._arith(W.as_repeated(f["record"], e["code"], 2), f["award"])
    check(a["status"] == "equal" and not W.scorer_passes(f) and W.gap_noted(f) is None and cn not in W.REVIEWED,
          "%s: with %s taken twice today's scorer passes it; it takes no gap" % (cn, e["code"]))
    moved = dict(e, times=3)
    check(not W.repeat_passes(f, moved), "%s: taken three times it does not close" % cn)

cc = W.claim_checks(CENSUS_AT_PLAN)
check(cc["counts"] == {"stands": 8} and not cc["not_standing"], "8 claims stand")
src = W._sources()
s2 = copy.deepcopy(src)
s2["41673"]["codes_found"] = [c for c in s2["41673"]["codes_found"] if W.S.norm_code(c) != "CUL171"]
check(W.claim(W._load("41673"), s2) == "a named course not found", "a named course the capture lacks holds it")
check(not any(W.shared_with(cn) for cn in ROWS), "every row was read from its own page")
pages = W.read_pages()
check(all(len(pages[cn]) == 1 for cn in ROWS) and len({next(iter(pages[cn])) for cn in ROWS}) == 8,
      "eight rows, eight read pages")
W._READ_PAGES = dict(pages, **{"99999": set(pages["30206"])})
check(W.claim(W._load("30206"), src) != "stands", "a read page shared with another program holds the row")
W._READ_PAGES = pages

bd = W.boundaries(CENSUS_AT_PLAN)
check(not bd["wrong"] and sum(bd["counts"].values()) == 8 * 3 + 4 * 2 + 4 * 3, "every boundary reading names no gap: %s"
      % bd)

# The kinds' own figures, read on the record as the page prints it (the reader's notes).
for cn in OPT:
    f = W._load(cn)
    check(W.option_key(f) and W.parts_close(f) and not W.scorer_passes(f),
          "%s: read as option parts today's scorer gives the printed total" % cn)
for cn in WAIVED:
    f = W._load(cn)
    check(W.waived_shape(f) and W.waiver_closes(f, W.REVIEWED[cn]),
          "%s: read at 0 to its units the waived course gives the printed range" % cn)
f = W._load("04073")
a = W._arith(f["record"], f["award"])
rec = copy.deepcopy(f["record"])
for b in rec["blocks"]:
    if b["name"] == "Select one":
        for c in b["courses"]:
            c["units_max"], c["units"] = c["units"], 0
a0 = W._arith(rec, f["award"])
check(W.waived_shape(f) and a0["status"] == "unequal" and a0["computed"] == [21.0, 34.0]
      and a0["stated"] == [20.0, 34.0] and "04073" not in W.REVIEWED,
      "04073: the piano blocks at 0 alone read 21-34 against 20-34 (two gaps at once)")
f = W._load("36625")
check(any("appears to be the sum of listed courses" in n for n in W._notes(f)) and "36625" not in W.REVIEWED
      and W.gap_noted(f) is None, "36625 takes no gap: its pathway figures are course sums")

with open(RECEIPT, encoding="utf-8") as fh:
    rec = json.load(fh)
got = {r["control_number"]: r["moves_to"] for r in rec["records"]}
check(got == ROWS and rec["moved"] == 8, "the receipt names the 8 rows and their gaps")
check({h["control_number"] for h in rec["held"]} == HELD, "the receipt holds the 9")
check(rec["census"]["members"] == members and rec["census"]["run"] == "45586922147", "the receipt's keys are the "
      "fixture's")
check(rec["shared_pages"] == {}, "no row shares its read page")
for r in rec["records"]:
    check(r["confidence"]["unit_arithmetic"] == SCORES[r["moves_to"]], "%s: its arithmetic score is its kind's"
          % r["control_number"])
for part in ("apply", "preread", "preread_md5", "rollback"):
    with open(MIG % part, encoding="utf-8") as fh:
        sql = fh.read()
    check(all("'%s'" % cn in sql for cn in ROWS) and not any("'%s'" % cn in sql for cn in HELD | set(W.PERSON)),
          "%s names exactly the 8" % part)
    if part == "apply":
        check("confirm guard" in sql and "e(expect) as (values (8))" in sql, "the apply guards a confirm")
check(W.plan(write=False, census_path=CENSUS_AT_PLAN)["rows"] == [], "a second run plans none")
images = NG._load_images({COLLEGE})
for r in rec["records"]:
    img = images[(COLLEGE, r["control_number"])]
    check(img["checks"] == r["after_image"]["checks"], "%s: the load posts the receipt's after-image" % r["control_number"])
    check(img["checks"].get("gaps") == [r["moves_to"]], "%s: the image carries its one gap" % r["control_number"])
    check(img["record"] == r["before_image"]["record"], "%s: the record is unchanged" % r["control_number"])

check(not any(W.scorer_passes(W._load(cn)) for cn in ROWS), "the scorer passes none of the rows (#3753's MAJOR)")
check(all(NG.answer(W._load(cn)) in (None,) or NG.answer(W._load(cn))[0] == ROWS[cn] for cn in ROWS),
      "no record rule names another kind on a row")
# On its live run as the receipts stood before this plan's own apply, and as they stand now.
check(all(W.on_live_run(W._load(cn), skip=(W.TAG,)) for cn in ROWS), "every row is on its live run before the apply")
check(all(W.on_live_run(W._load(cn)) for cn in ROWS), "every row is on its live run")
check(W.precision(CENSUS_AT_PLAN, skip=(W.TAG,))["right"] == 17, "precision holds on the receipts before the apply")

why = {h["control_number"]: h["why"] for h in rec["held"]}
check(all("repeat kind" in why.get(cn, "") and "reconcile_steps" in why.get(cn, "") for cn in LEVER),
      "the seven hold on the repeat lever")
check("two gaps at once" in why.get("04073", ""), "04073 holds: two gaps at once")
check("course sum" in why.get("36625", ""), "36625 holds: its pathway figures are course sums")

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
