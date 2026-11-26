#!/usr/bin/env python3
"""S727, lane 2's cheap piles at College of the Canyons: the census's 20 wording-rule records and 43388
(kb/_program_piles_s727_canyons.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): never drop a record for failing; collect it with
its gaps noted and confidence scores, a gap noted instead of a reread; COBIx's brief of 2026-11-24: a record held for a
person is collected with its gap named and a lower confidence. Pinned here:

  * each kind the plan files carries a sentence and a unit-arithmetic score in kb/_program_named_gaps.py, and the new
    heading_not_in_text takes the other-page source cap of 50;
  * precision 21 of 21 against the hand reading of the census members pinned in the fixture
    (p-test-pins-census-members-s714) and 43388: 7 collected, 14 held;
  * a record a cheaper lever passes stays on it (p-gap-filing-leaves-census-lever-s721; the second reader, round 1):
    02277's nine-unit line and 15477's one unit of WE-186MEA each close the sum, and today's scorer passes each record
    once the rule rewrites it, so neither is gap-filed;
  * 32896's open list, and each named gap's words in its record's own notes (p-named-gap-asserts-only-the-page-s721);
  * the claim check holds 41576 (the capture did not find MUSIC 189 or 190), a record whose capture holds the page its
    note says the read lacked, and a shared page without its own-section words; every boundary reading names no gap;
  * a plan's rows post only once a migrate receipt of its apply returned rows and no rollback receipt did (an aborted
    apply posts nothing); 43388 has no posted row, read as the receipts stood before this plan's own s727a apply
    (p-test-reads-own-apply-receipt-s721), so the test holds after it too;
  * the plan: 7 rows (6 UPDATE, 1 INSERT) named exactly by the receipt and the four SQL files, the confirm and insert
    guards, a rollback that keeps an inserted row a person checked or left a verdict on, with the delete's own expect
    line; a second run plans none; the load's image of each committed record is its receipt's after-image, the UPDATE
    records unchanged, and 43388 moved from held_for_person/ to records/.

Run from repo root: python3 tests/program_piles_s727_canyons_test.py
"""
import copy
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CENSUS_AT_PLAN = os.path.join(ROOT, "tests", "fixtures", "harvest_gap_census_s727_canyons.json")
RECEIPT = os.path.join(ROOT, "kb", "receipts", "program_requirement_records_piles_s727_canyons_2026-11-25_s727a.json")
MIG = os.path.join(ROOT, "kb", "migrations", "2026-11-25_s727a_prreq_piles_%s.sql")
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s727_canyons as W  # noqa: E402

COLLEGE = "College of the Canyons"
ROWS = {"10312": "noted_figures_differ", "16962": "noted_section_cut_off", "32896": "lists_not_closed",
        "37648": "pool_figure_not_read", "40383": "noted_figures_differ", "43549": "noted_figures_differ",
        "43388": "heading_not_in_text"}
HELD = {"10302", "19386", "32723", "33814", "40090", "44260", "44657", "32815", "36793", "40384", "45528", "41576",
        "02277", "15477"}
OTHER_LEVER = {"30837", "31356", "37868", "45284"}
SCORES = {"noted_figures_differ": 40, "noted_section_cut_off": 20, "lists_not_closed": 30, "pool_figure_not_read": 40,
          "heading_not_in_text": 20}
checks, failures = [0], []


def statements(sql):
    """The statements a file runs: its lines that end one, comments aside."""
    return sum(1 for ln in sql.splitlines() if ln.rstrip().endswith(";") and not ln.lstrip().startswith("--"))


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


for g, score in SCORES.items():
    check(g in NG.GAPS and NG.ARITH_SCORE.get(g) == score and g.isidentifier(), "%s has its sentence and score" % g)
check(set(ROWS.values()) <= set(SCORES), "every kind filed is pinned")
check("heading_not_in_text" in NG.OTHER_PAGE_GAPS and "noted_section_cut_off" not in NG.OTHER_PAGE_GAPS,
      "the new kind takes the other-page source cap")

members = W.census_members(CENSUS_AT_PLAN)
check(len(members) == 20 and set(members) == (set(ROWS) | HELD) - set(W.FROM_HELD), "the fixture gives the 20 keys")
check(W.keys(CENSUS_AT_PLAN) == members + ["43388"] and W.FROM_HELD == ("43388",), "43388 joins the 20")
check(not OTHER_LEVER & set(members), "the other levers' records are left alone")
pr = W.precision(CENSUS_AT_PLAN)
check(pr["read"] == 21 and pr["right"] == 21 and not pr["wrong"], "precision 21 of 21: %s" % pr["wrong"])
check(pr["by_answer"].get("none") == 14, "14 held: %s" % pr["by_answer"])

# A cheaper lever passes 02277 and 15477: the entry's figures close, and today's scorer passes the rewritten record.
check(set(W.ON_LEVER) == {"02277", "15477"} and not set(W.ON_LEVER) & set(W.REVIEWED), "the two stay on the lever")
f = W._load("02277")
e = W.ON_LEVER["02277"]
check(any(e["words"] in n for n in W._notes(f)) and W.line_closes(f, e) and e["line"]["adds"] == 9,
      "02277: MATH-211 plus the printed nine-unit line is the list's 14, and 37-38 closes")
g = copy.deepcopy(f)
for b in g["record"]["blocks"]:
    if b.get("name") == e["line"]["block"]:
        b["courses"].append({"code": "CMPSCI-NINE", "units": 9, "units_max": None, "alternatives": [],
                             "catalog_addition": True})
check(not W.scorer_passes(f) and W.scorer_passes(g), "02277: the scorer passes it with the nine units in its list")
f = W._load("15477")
e = W.ON_LEVER["15477"]
check(any(e["words"] in n for n in W._notes(f)) and W.takes_closes(f, e), "15477: one unit of WE-186MEA closes 29")
g = copy.deepcopy(f)
for c in W._course(g, "WE-186MEA"):
    c["units"], c["units_max"] = 1, None
check(not W.scorer_passes(f) and W.scorer_passes(g), "15477: the scorer passes it with WE-186MEA at one unit")
for cn in W.ON_LEVER:
    check(W.HAND[cn].startswith("held: a cheaper lever passes it") and W.gap_noted(W._load(cn)) is None,
          "%s: held, never gap-filed" % cn)

cc = W.claim_checks(CENSUS_AT_PLAN)
check(cc["counts"] == {"stands": 7, "a named course not found": 1}
      and cc["not_standing"] == [["41576", "a named course not found"]], "7 claims stand, 41576 holds: %s" % cc)
src = W._sources()
s2 = copy.deepcopy(src)
s2["16962"]["source"] = dict(s2["16962"]["source"], pages=[83, 84])
check(W.claim(W._load("16962"), s2) == "the capture holds the page the note says the read lacked",
      "a capture holding page 83 holds 16962")
s2 = copy.deepcopy(src)
s2["43388"]["source"] = dict(s2["43388"]["source"], pages=[327, 328])
check(W.claim(W._load("43388"), s2) == "the capture holds the page the note says the read lacked",
      "a capture holding page 327 holds 43388")
s2 = copy.deepcopy(src)
s2["43388"]["codes_found"] = []
check(W.claim(W._load("43388"), s2) == "a named course not found", "a named course the capture lacks holds 43388")
for cn in ("16962", "32896", "40383", "43388"):
    saved = W.REVIEWED[cn]
    W.REVIEWED[cn] = {k: v for k, v in saved.items() if k != "own_section"}
    check(W.claim(W._load(cn)) == "the page is shared and no note names the record's own section",
          "%s: without its own-section words its shared page holds it" % cn)
    W.REVIEWED[cn] = saved
    check(W.claim(W._load(cn)) == "stands" and W.shared_with(cn), "%s: shared, and with them it stands" % cn)
for cn in ("32815", "40384", "45528"):
    check(W.shared_with(cn) and cn not in W.REVIEWED, "%s holds on its shared page" % cn)

bd = W.boundaries(CENSUS_AT_PLAN)
check(not bd["wrong"] and sum(bd["counts"].values()) == 8 * 3 + 3, "every boundary reading names no gap: %s" % bd)
check(W.list_open(W._load("32896"), W.REVIEWED["32896"]), "32896: the option-dependent list is one choose-units list")
for cn, e in W.REVIEWED.items():
    check(any(e["words"] in n for n in W._notes(W._load(cn))), "%s: the gap's words are its own note's" % cn)

# A plan posts only once its apply returned rows, and a rollback that returned rows takes that back.
ok = '[{"returned":{"returned":9,"keys":[1,2,3,4,5,6,7,8,9],"skipped_checked":[]}}]'
aborted = '{"message":"Failed to run sql query: ERROR:  22P02: invalid input syntax for type integer"}'
check(W._returned_rows(json.loads(ok)) and not W._returned_rows(json.loads(aborted)), "an aborted apply wrote nothing")
check(W._returned_rows([{"returned": {"returned": 0, "keys": [], "inserted": ["43388"]}}])
      and not W._returned_rows([{"returned": {"returned": 0, "keys": [], "inserted": []}}]), "an insert alone writes")
check(W.plan_applied("s721a") and W.plan_applied("s720r") and not W.plan_applied("s727zz"),
      "applied plans read applied (s720r's aborted first try beside its applied second)")

with open(RECEIPT, encoding="utf-8") as fh:
    rec = json.load(fh)
got = {r["control_number"]: r["moves_to"] for r in rec["records"]}
check(got == ROWS and rec["moved"] == 7 and rec["updates"] == 6 and rec["inserts"] == 1,
      "the receipt names the 7 rows and their answers")
check({r["control_number"] for r in rec["records"] if r["write"] == "insert"} == {"43388"}, "43388 is the insert")
check({h["control_number"] for h in rec["held"]} == HELD, "the receipt holds the 14")
check(rec["census"]["members"] == members, "the receipt's keys are the fixture's")
for part in ("apply", "preread", "preread_md5", "rollback"):
    with open(MIG % part, encoding="utf-8") as fh:
        sql = fh.read()
    check(all("'%s'" % cn in sql for cn in ROWS) and not any("'%s'" % cn in sql for cn in HELD | OTHER_LEVER),
          "%s names exactly the 7" % part)
    if part == "apply":
        check("confirm guard" in sql and "e(expect) as (values (6))" in sql and "insert guard" in sql
              and "on conflict (college, control_number) do nothing" in sql and statements(sql) == 1,
              "the apply is one statement guarding a confirm and its insert")
    if part == "rollback":
        check("delete guard" in sql and "r.checked is not true" in sql and statements(sql) == 1
              and "de(expect) as (values (1))" in sql and "(select count(*) from del) <> de.expect - nc.n" in sql
              and sql.count("exists (select 1 from public.program_record_verdicts pv") == 2
              and "and not exists (select 1 from public.program_record_verdicts pv" in sql,
              "the rollback keeps an inserted row a person checked or left a verdict on, with its own expect line")
    if part.startswith("preread"):
        check("'insert_present'" in sql and "'insert_verdicts'" in sql, "%s counts the insert's absence" % part)
check(W.plan(write=False, census_path=CENSUS_AT_PLAN)["rows"] == [], "a second run plans none")
images = NG._load_images({COLLEGE})
for r in rec["records"]:
    img = images[(COLLEGE, r["control_number"])]
    check((img["checks"].get("gaps") or []) == [r["moves_to"]], "%s: the image carries its gap" % r["control_number"])
    if r["write"] == "update":
        check(img["checks"] == r["after_image"]["checks"], "%s: the load posts the after-image" % r["control_number"])
        check(img["record"] == r["before_image"]["record"], "%s: the record is unchanged" % r["control_number"])
        check(str(r["before_image"]["extracted_run"]) == str(r["extracted_run"]),
              "%s: the plan keeps its run" % r["control_number"])
    else:
        check({k: img[k] for k in r["after_image"]} == r["after_image"], "43388: the load posts the inserted image")
check(os.path.isfile(W._path("43388")) and not os.path.exists(W._held_path("43388")),
      "43388 moved from held_for_person/ to records/")
c43388 = W._load("43388")["score"]["confidence"]
check(c43388 == {"unit_arithmetic": 20, "course_list_match": 50, "ge_pattern": None, "catalog_year": 100,
                 "source": 50}, "43388's confidence: arithmetic 20, course list and source capped at 50: %s" % c43388)
check(W._load("16962")["score"]["confidence"]["course_list_match"] == 31, "16962's course-list match is 31, under 50")

check(not any(W.scorer_passes(W._load(cn)) for cn in ROWS), "the scorer passes none of the gap rows (#3753's MAJOR)")
check(all(W.scorer_passes(W._load(cn)) for cn in ("10302", "19386", "32723", "33814", "40090", "44260", "44657")),
      "the seven coverage holds pass the scorer's arithmetic, so none is gap-filed")
# Read as the receipts stood before this plan's own apply (its s727a receipts post its rows once migrated).
before = W.posted_runs(skip=("s727a", "s739c"))
check(all(max(before[cn])[1] == str(W._load(cn)["extracted_run"]) for cn in ROWS if cn != "43388"),
      "before the apply, every UPDATE row's latest posted run is its committed run")
check(max(before["15477"]) == ("2026-11-21T08:54:36Z", "44769429877"), "S691's live read posts 15477's run")
check("43388" not in before, "no receipt before this plan posts 43388")
check(all(W.on_live_run(W._load(cn)) for cn in ROWS), "every row is on its live run, or has none (43388)")
check(all(max(W.posted_runs()[r["control_number"]])[1] == str(r["extracted_run"]) for r in rec["records"]
          if r["write"] == "update"), "the posted run is the plan's run, applied or not")
real = W.posted_runs
W.posted_runs = lambda skip=(): {"43388": [("2026-11-25T00:00:00Z", "44886816990")]}
check(not W.on_live_run(W._load("43388")), "a posted 43388 row holds the insert")
W.posted_runs = real

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
