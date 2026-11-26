#!/usr/bin/env python3
"""S727, lane 2's cheap piles at Shasta: the census's 19 wording-rule records and 18153 (kb/_program_piles_s727_shasta.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): never drop a record for failing; collect it with
its gaps noted and confidence scores, a gap noted instead of a reread; COBIx's brief of 2026-11-25: a record held for
a person is collected with its gap named. Pinned here:

  * each kind the plan files carries a sentence and a unit-arithmetic score in kb/_program_named_gaps.py;
  * precision 19 of 19 against the hand reading of the census members pinned in the fixture
    (p-test-pins-census-members-s714): 4 collected, 15 held, each held reason in the receipt;
  * the four 'remaining' emphases pass today's scorer read as one pool, and no other member does, so they stay on the
    lever (p-gap-filing-leaves-census-lever-s721);
  * the claim check holds a record whose named course the capture did not find, a record whose capture holds the
    page its note says the read lacked, and a shared page without its own-section words; every boundary reading
    names no gap;
  * the plan: 4 rows named exactly by the receipt and the four SQL files, the confirm guard, a second run plans none;
    the load's image of each committed record is its receipt's after-image, the record unchanged;
  * 18153: its named gap for a program with no record, with its confidence scores, its record still held and out of
    records/. The answers come from the pages and the hand reading, never from the plan's receipt
    (p-test-reads-own-apply-receipt-s721), and the live-run check reads the receipts as they stood before s727c.

Run from repo root: python3 tests/program_piles_s727_shasta_test.py
"""
import copy
import glob
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CENSUS_AT_PLAN = os.path.join(ROOT, "tests", "fixtures", "harvest_gap_census_s727_shasta.json")
RECEIPTS = glob.glob(os.path.join(ROOT, "kb", "receipts", "program_requirement_records_piles_s727_shasta_*_s727c.json"))
MIGS = glob.glob(os.path.join(ROOT, "kb", "migrations", "*_s727c_prreq_piles_*.sql"))
FOLDER = os.path.join(ROOT, "kb", "program_requirements_college", "shasta")
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s727_shasta as W  # noqa: E402

COLLEGE = "Shasta College"
ROWS = {"09113": "noted_section_cut_off", "35607": "lists_not_closed", "37774": "lists_not_closed",
        "45360": "noted_no_total"}
POOLED = {"18080", "18098", "18143", "18144"}
HELD = POOLED | {"18087", "18659", "18625", "18626", "18655", "31845", "32162", "34005", "09501", "35606", "43618"}
SCORES = {"noted_section_cut_off": 20, "lists_not_closed": 30, "noted_no_total": 40}
checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


for g, score in SCORES.items():
    check(g in NG.GAPS and NG.ARITH_SCORE.get(g) == score and g.isidentifier(), "%s has its sentence and score" % g)
check(set(ROWS.values()) <= set(SCORES), "every kind filed is pinned")
check("option_lists_read_apart" not in set(W.REVIEWED[cn]["gap"] for cn in W.REVIEWED),
      "the American River kind is named in a hold, never filed here")

members = W.census_members(CENSUS_AT_PLAN)
check(set(members) == set(ROWS) | HELD and len(members) == 19 and not set(W.PERSON) & set(members),
      "the fixture gives the 19 keys")
pr = W.precision(CENSUS_AT_PLAN)
check(pr["read"] == 19 and pr["right"] == 19 and not pr["wrong"], "precision 19 of 19: %s" % pr["wrong"])
check(pr["by_answer"].get("none") == 15, "15 held")
check(set(W.REVIEWED) == set(ROWS) and not set(W.REVIEWED) & HELD, "the reviewed list is the 4 rows")

# The 'remaining' reading, on a copy: the four pass, no other member does, and the filed records do not.
for cn in members:
    f = W._load(cn)
    check(W.pooled_remaining(f) == (cn in POOLED), "%s: the pooled 'remaining' reading %s" % (
        cn, "passes it" if cn in POOLED else "does not pass it"))
    check(not W.scorer_passes(f), "%s: today's scorer does not pass the filed record" % cn)
for cn in POOLED:
    words = " ".join(W._notes(W._load(cn))) + " " + " ".join(b.get("name") or "" for b in W._load(cn)["record"]["blocks"])
    check("remaining" in words or "additional units" in words, "%s: its second list prints remaining or additional" % cn)

cc = W.claim_checks(CENSUS_AT_PLAN)
check(cc["counts"] == {"stands": 4} and not cc["not_standing"], "4 claims stand: %s" % cc)
src = W._sources()
s2 = copy.deepcopy(src)
s2["35607"]["codes_found"] = [c for c in s2["35607"]["codes_found"] if c != "AGMA42"]
check(W.claim(W._load("35607"), s2) == "a named course not found", "a named course the capture lacks holds it")
s2 = copy.deepcopy(src)
s2["09113"]["source"] = dict(s2["09113"]["source"], pages=[64, 65])
check(W.claim(W._load("09113"), s2) == "the capture holds the page the note says the read lacked",
      "a capture holding page 64 holds 09113")
check((src["09113"].get("source") or {}).get("pages") == [65], "09113's capture holds page 65 alone")
bd = W.boundaries(CENSUS_AT_PLAN)
check(not bd["wrong"] and sum(bd["counts"].values()) == 4 * 4, "every boundary reading names no gap: %s" % bd)

# The own-section guard: every row sits on a shared page and names its own section; the three held on it do not.
for cn in ROWS:
    check(W.shared_with(cn) and any(W.REVIEWED[cn]["own_section"] in n for n in W._notes(W._load(cn))),
          "%s: a shared page, and a note names its own section" % cn)
check(W.shared_with("09501") == ["17479"] and W.shared_with("43618") == ["30580"]
      and W.shared_with("35606") == ["09505", "18063"], "the three own-section holds are on shared pages")
b30580, b43618 = W._load("30580")["record"]["blocks"], W._load("43618")["record"]["blocks"]
check([[c["code"] for c in b["courses"]] for b in b30580] == [[c["code"] for c in b["courses"]] for b in b43618],
      "30580's record is 43618's course for course")

# The live run, read as the receipts stood before this plan's own apply.
before = W.posted_runs(skip=("s727c", "s739b"))
check(all(max(before[cn])[1] == W._load(cn)["extracted_run"] for cn in ROWS),
      "before the apply, every row's latest posted run is its committed run")
check(all(W.on_live_run(W._load(cn)) for cn in ROWS), "every row is on its live run")
check("18655" not in before and "18144" not in before, "a two-run load names no run for 18655 or 18144")

# The plan, once written (the files are absent only on the branch before its own run).
check(len(RECEIPTS) == 1 and len(MIGS) == 4, "one receipt and four SQL files")
if RECEIPTS:
    with open(RECEIPTS[0], encoding="utf-8") as fh:
        rec = json.load(fh)
    got = {r["control_number"]: r["moves_to"] for r in rec["records"]}
    check(got == ROWS and rec["moved"] == 4, "the receipt names the 4 rows and their gaps")
    check({h["control_number"] for h in rec["held"]} == HELD, "the receipt holds the 15")
    check(rec["census"]["members"] == members, "the receipt's keys are the fixture's")
    for r in rec["records"]:
        check(r["confidence"]["unit_arithmetic"] == SCORES[r["moves_to"]], "%s: its arithmetic score is its kind's"
              % r["control_number"])
    check(next(r for r in rec["records"] if r["control_number"] == "09113")["confidence"]["course_list_match"] <= 50,
          "09113: a cut-off section's course-list match is capped at 50")
    images = NG._load_images({COLLEGE})
    for r in rec["records"]:
        img = images[(COLLEGE, r["control_number"])]
        check(img["checks"] == r["after_image"]["checks"], "%s: the load posts the receipt's after-image"
              % r["control_number"])
        check(img["checks"].get("gaps") == [r["moves_to"]], "%s: the image carries its one gap" % r["control_number"])
        check(img["record"] == r["before_image"]["record"], "%s: the record is unchanged" % r["control_number"])
        check(r["before_image"]["extracted_run"] == r["extracted_run"], "%s: the plan keeps its run"
              % r["control_number"])
for path in MIGS:
    with open(path, encoding="utf-8") as fh:
        sql = fh.read()
    check(all("'%s'" % cn in sql for cn in ROWS) and not any("'%s'" % cn in sql for cn in HELD | {"18153"}),
          "%s names exactly the 4" % os.path.basename(path))
    if path.endswith("_apply.sql"):
        check("confirm guard" in sql and "e(expect) as (values (4))" in sql, "the apply guards a confirm")
check(W.plan(write=False, census_path=CENSUS_AT_PLAN)["rows"] == [], "a second run plans none")

# 18153: a named gap for a program with no record, its record held and out of records/.
gaps_file = os.path.join(FOLDER, "named_gaps_s727.json")
check(os.path.isfile(gaps_file), "the no-record named-gap file is written")
if os.path.isfile(gaps_file):
    with open(gaps_file, encoding="utf-8") as fh:
        ng = json.load(fh)
    p = {x["control_number"]: x for x in ng["programs"]}
    check(set(p) == {"18153"} and p["18153"]["reason"] in ng["reasons"], "18153 alone, its reason defined")
    check(p["18153"]["pages"] == [61, 62, 63, 64] and p["18153"]["placed"] == 0 and p["18153"]["listed"] == 54,
          "18153: the pages 61 to 64, none of 54 placed")
    c = p["18153"]["confidence"]
    check(c["unit_arithmetic"] == 0 and c["course_list_match"] == 0 and 0 <= min(v for v in c.values() if v is not None)
          and max(v for v in c.values() if v is not None) <= 100, "18153: lower confidence on the 0-100 bar")
check(os.path.isfile(os.path.join(FOLDER, "held_for_person", "18153.json"))
      and not os.path.isfile(os.path.join(FOLDER, "records", "18153.json")), "18153's record stays held")
check(all(cn in W.shared_with("18153") for cn in W.NO_RECORD["18153"]["bound_there"]),
      "the programs its note names are bound to its pages")
check(not any(c.startswith("CULA") for c in src["18153"].get("codes_found") or []),
      "the pages print none of its Culinary Arts courses")
check(W.no_record_gaps()["programs"][0]["cula_listed"] == 15, "the state lists 15 Culinary Arts courses for 18153")

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
