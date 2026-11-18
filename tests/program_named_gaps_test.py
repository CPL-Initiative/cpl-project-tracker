#!/usr/bin/env python3
"""A record that fails a check is collected with its gap named and scored, and the census counts it collected.

WHY. Sam, 2026-11-17 (relayed by COBIx on #3358): never drop a record for failing; collect it with gaps noted
and confidence scores. kb/_program_named_gaps.py names the gap (score.gaps, checks.gaps) and scores it
(score.confidence, checks.confidence); kb/_harvest_gap_census.py counts the row collected. A rule that named a
gap on a record that passes, or a census that counted a named gap whose coverage fails, would hide real work.
Pinned on fixtures:

  * a local degree the overlap ruling would pass but for a major that differs is collected, unit arithmetic 30;
  * a degree whose major matches exactly is never flagged;
  * a required course with no units names no_units_read (20); no_units_printed is off, its note matcher failing
    its self-recall; a record failing for another reason too takes neither;
  * each new matcher's self-recall on held answers (noncredit awards; required courses that carry units);
  * the live row ends as the college load posts the committed record (load_rows carries checks.gaps);
  * the census takes a row with checks.gaps out of the gap only when coverage and invented pass;
  * the guarded UPDATE adds the keys only where the run, the arithmetic and the absence of gaps still hold,
    and the rollback removes only what it wrote;
  * the collection lane's colleges are left out.

Run from repo root: python3 tests/program_named_gaps_test.py
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402
import _harvest_gap_census as G  # noqa: E402
import collection_lane as CL  # noqa: E402

checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


def local_degree(major_computed, major_stated):
    arith = {"pass": False, "status": "unequal", "against": "degree", "computed": [63.0, 63.0],
             "stated": [60.0, 60.0], "ge": [21.0, 21.0],
             "major": {"pass": major_computed == major_stated, "status": "equal" if major_computed == major_stated
                       else "unequal", "computed": major_computed, "stated": major_stated}}
    return {"college": "Butte College", "control_number": "1", "award": "A.S. Degree", "extracted_run": "9",
            "record": {"program": {"degree_total": {"min": 60, "max": 60}, "ge_units": {"min": 21, "max": 21}}},
            "score": {"coverage": {"pass": True, "share": 0.9}, "invented": {"pass": True}, "arithmetic": arith}}


f = local_degree([42.0, 42.0], [40.0, 40.0])
check(NG.judge(f) and NG.judge(f)[0] == "major_total_differs", "a major that differs names the gap")
check(NG.confidence(f, "major_total_differs")["unit_arithmetic"] == 30, "unit arithmetic scores 30")
check(NG.confidence(f, "major_total_differs")["course_list_match"] == 90, "course-list match is the placed share")
check(NG.judge(local_degree([42.0, 42.0], [42.0, 42.0])) is None, "an exact major is never flagged")
f2 = local_degree([42.0, 42.0], [40.0, 40.0])
f2["score"]["coverage"]["pass"] = False
check(NG.judge(f2) is None, "a record whose coverage fails takes no gap")


def no_units(notes, extra_why=()):
    return {"college": "Butte College", "control_number": "2", "award": "Certificate of Achievement", "extracted_run": "9",
            "record": {"notes": notes, "program": {"total_units": {"min": 12, "max": 12}},
                       "blocks": [{"name": "Required", "rule": "all", "courses": [{"code": "EMED 135"}, {"code": "EMED 101", "units": 6}]}]},
            "score": {"coverage": {"pass": True, "share": 1.0}, "invented": {"pass": True},
                      "arithmetic": {"pass": False, "status": "incomplete",
                                     "why": ["a required course in 'Required' has no units"] + list(extra_why)}}}


check(not NG.NO_UNITS_PRINTED_ON and NG.judge(no_units(["EMED 135 is printed with no units."]))[0] == "no_units_read",
      "no_units_printed is off: a note saying the catalog prints none still names no_units_read")
check(NG.judge(no_units(["The page was cut off."]))[0] == "no_units_read", "otherwise no_units_read")
check(NG.judge(no_units([], ["'Electives' chooses courses but names no minimum"])) is None,
      "a record failing for another reason too takes neither")
passing = local_degree([42.0, 42.0], [42.0, 42.0])
passing["score"]["arithmetic"] = {"pass": True, "status": "equal"}
check(all(c["wrong"] == 0 for c in NG.self_check([passing]).values()), "the self-check names no gap on a passing record")

# The census counts a named gap collected only with coverage and invented passing.
check(G.collected_with_gaps({"coverage": True, "invented": True, "arithmetic": "unequal", "gaps": ["x"]}) == ["x"],
      "a row with checks.gaps is collected")
check(not G.collected_with_gaps({"coverage": False, "invented": True, "arithmetic": "unequal", "gaps": ["x"]}),
      "not when coverage fails")
check(not G.collected_with_gaps({"coverage": True, "invented": True, "arithmetic": "unequal"}), "not without gaps")
check(G.flat_checks({"coverage": {"pass": True}, "invented": {"pass": True}, "arithmetic": {"status": "unequal"},
                     "gaps": [{"gap": "major total differs from catalog"}]})["gaps"] == ["major total differs from catalog"],
      "a filed score's gaps reach the flat checks by name")

# The SQL guards (kb/_guarded_sql.py, the shape #3496's review settled).
row = {"i": 1, "college": "O'Neill College", "control_number": "1", "extracted_run": "9",
       "before_image": {"record": {"a": 1}, "checks": {"arithmetic": "unequal"}},
       "after_image": {"checks": {"arithmetic": "unequal", "gaps": ["x"]}}}
up, rb, pre = NG.update_sql([row]), NG.rollback_sql([row]), NG.pre_read_sql([row])
check("r.extracted_run = v.extracted_run" in up and "r.checks = v.before_checks" in up and "r.record = v.before_record" in up
      and "r.checked is not true" in up and "e(expect) as (values (1))" in up and "::int::text::json" in up,
      "the UPDATE is guarded on run, the before-image and a person's check, and aborts off its count")
check("r.checks = v.after_checks" in rb and "r.checked is not true" in rb and "A partial rollback" in rb,
      "the rollback takes back only the after-image, skips a checked row, and aborts off its count")
check("O''Neill" in up and pre.startswith("with v(") and "json_build_object" in pre, "quoting and one JSON value")

# Self-recall of the new matchers on held answers, from the committed files.
import glob  # noqa: E402
import json  # noqa: E402
files = []
for p_ in glob.glob(os.path.join(ROOT, "kb", "program_requirements_college", "*", "records", "*.json")):
    with open(p_, encoding="utf-8") as fh:
        d = json.load(fh)
    if isinstance(d.get("score"), dict) and not CL.held(d.get("college")):
        files.append(d)
mr = NG.matcher_recall(files)
check(mr["noncredit"]["wrong"] == 0 and mr["noncredit"]["missed"] == 0,
      "NONCREDIT against the state's award: %s" % mr["noncredit"])
check(mr["printed_no_units"]["wrong"] > 0 and not NG.NO_UNITS_PRINTED_ON,
      "PRINTED_NO_UNITS fails its self-recall (%s), so its rule stays off" % mr["printed_no_units"])
print("matcher recall: noncredit %(held)d held, right %(right)d, wrong %(wrong)d, missed %(missed)d" % mr["noncredit"]
      + "; printed_no_units %(held)d held, right %(right)d, wrong %(wrong)d (rule off)" % mr["printed_no_units"])

# The live row ends as the college load posts the committed record.
RECEIPT = os.path.join(ROOT, "kb", "receipts", "program_requirement_records_named_gaps_2026-11-18_s680.json")
if os.path.isfile(RECEIPT):
    import _program_requirements_college as C  # noqa: E402
    with open(RECEIPT, encoding="utf-8") as fh:
        rc = json.load(fh)
    imgs = {}
    for college in sorted({r["college"] for r in rc["records"]}):
        for r in C.load_rows(college)[0]:
            imgs[(college, str(r["control_number"]))] = r
    same = sum(1 for r in rc["records"] if imgs.get((r["college"], str(r["control_number"])), {}).get("checks")
               == r["after_image"]["checks"] and imgs[(r["college"], str(r["control_number"]))]["record"]
               == r["before_image"]["record"])
    check(same == len(rc["records"]), "the load posts the after-image for %d of %d rows" % (same, len(rc["records"])))
    check(all(r["after_image"]["checks"].get("gaps") and r["before_image"]["checks"].get("gaps") is None
              for r in rc["records"]), "every row gains its gap and had none")
    check(not any(CL.held(r["college"]) for r in rc["records"]), "no collection-lane college in the plan")

check(CL.held("Chabot College") and not CL.held("Butte College"), "the collection lane's colleges are held")

if failures:
    for m in failures:
        print("FAIL:", m)
    sys.exit(1)
print("%d/%d checks passed: program named gaps" % (checks[0], checks[0]))
