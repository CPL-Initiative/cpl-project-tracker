#!/usr/bin/env python3
"""A record that fails a check is collected with its gap named and scored, and the census counts it collected.

WHY. Sam, 2026-11-17 (relayed by COBIx on #3358): never drop a record for failing; collect it with gaps noted
and confidence scores. kb/_program_named_gaps.py names the gap (score.gaps, checks.gaps) and scores it
(score.confidence, checks.confidence); kb/_harvest_gap_census.py counts the row collected. A rule that named a
gap on a record that passes, or a census that counted a named gap whose coverage fails, would hide real work.
Pinned on fixtures:

  * a local degree the overlap ruling would pass but for a major that differs is collected, unit arithmetic 30;
  * a degree whose major matches exactly is never flagged;
  * a required course with no units names no_units_printed when the notes say the catalog prints none (40),
    else no_units_read (20); a record failing for another reason too takes neither;
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


check(NG.judge(no_units(["EMED 135 is printed with no units and marked current."]))[0] == "no_units_printed",
      "notes saying the catalog prints no units name no_units_printed")
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

# The SQL guards.
row = {"i": 1, "college": "O'Neill College", "control_number": "1", "extracted_run": "9",
       "before": {"arithmetic": "unequal"}, "after": {"gaps": ["major total differs from catalog"]},
       "confidence": {"unit_arithmetic": 30}}
up, rb, pre = NG.update_sql([row]), NG.rollback_sql([row]), NG.pre_read_sql([row])
check("r.extracted_run = v.extracted_run" in up and "r.checks->>'arithmetic' = v.arith_before" in up
      and "not (r.checks ? 'gaps')" in up, "the UPDATE is guarded on run, before-value and no gaps yet")
check("r.checks->'gaps' = v.gaps" in rb and "- 'confidence'" in rb, "the rollback removes only what it wrote")
check("O''Neill" in up and pre.startswith("with v(") and "json_build_object" in pre, "quoting and one JSON value")
check(CL.held("Chabot College") and not CL.held("Butte College"), "the collection lane's colleges are held")

if failures:
    for m in failures:
        print("FAIL:", m)
    sys.exit(1)
print("%d/%d checks passed: program named gaps" % (checks[0], checks[0]))
