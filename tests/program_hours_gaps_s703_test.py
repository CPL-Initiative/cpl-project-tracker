#!/usr/bin/env python3
"""The three hours gaps (S703, census lever 3, the noncredit hours total): a program measured in hours whose courses
carry their hours is collected with its gap named, where its one arithmetic reason is the total.

WHY. Sam, 2026-11-17 (relayed by COBIx on #3358): never drop a record for failing; collect it with gaps noted and
confidence scores. The census's lever 3 (100 programs on 2026-11-21) is the record measured in hours that fails its
units check. S652's review rule: a new rule runs first against records whose answer is already held. Pinned here:

  * fixtures: hours_total_not_read (no total read, 40), hours_within_printed_range (the sum inside a printed range,
    50) and hours_total_differs (any other figure, 30); none on a program in units, on hours that add to zero, on a
    printed total of zero, on a second reason, on a failing coverage check, or on a passing record;
  * the self-recall on held answers: every passing hours record the scorer reproduces is read three ways by the
    scorer itself (its total removed, moved past the sum, widened around it), and the rule names the held gap on
    each (wrong 0);
  * the plain recall on every failing record stays wrong 0 with the new rules in it;
  * the s703nc plan names only programs the committed census lists under the two noncredit-hours causes, and its
    guarded UPDATE names exactly the plan's rows;
  * the six colleges lane 1 held on 2026-11-22 and the parked colleges are untouched: no plan row, and no record
    file there carries an hours gap.

Run from repo root: python3 tests/program_hours_gaps_s703_test.py
"""
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402
import _harvest_gap_census as G  # noqa: E402
import _program_requirements_college as C  # noqa: E402

checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


LANE_1_S703 = ("City College of San Francisco", "San Diego College of Continuing Education", "Clovis Community College",
               "Cosumnes River College", "Glendale Community College", "Butte College")
HOURS = ("hours_total_not_read", "hours_within_printed_range", "hours_total_differs")


def hours(computed, stated, measure="hours", why=None, coverage=True, passes=False):
    status = "incomplete" if stated is None else "unequal"
    if why is None:
        why = (["the record names no total"] if stated is None else
               ["the blocks sum to %s-%s; the catalog states %s-%s" % (computed[0], computed[1], stated[0], stated[1])])
    return {"college": "Laney College", "control_number": "39368", "award": "Noncredit program",
            "record": {"program": {"measure": measure}, "blocks": [], "notes": []},
            "score": {"coverage": {"pass": coverage, "share": 1.0}, "invented": {"pass": True},
                      "arithmetic": {"pass": passes, "status": "equal" if passes else status, "computed": computed,
                                     "stated": stated, "against": None if stated is None else "program",
                                     "why": [] if passes else why}}}


def named(f):
    return (NG.answer(f) or (None,))[0], NG.held_answer(f)


check(named(hours([135.0, 135.0], None)) == ("hours_total_not_read",) * 2, "no total read takes hours_total_not_read")
check(named(hours([245.0, 245.0], [172.0, 245.0])) == ("hours_within_printed_range",) * 2,
      "245 inside a printed 172-245 takes hours_within_printed_range")
check(named(hours([252.0, 252.0], [450.0, 450.0])) == ("hours_total_differs",) * 2,
      "252 against a printed 450 takes hours_total_differs")
check("245" in NG.hours_within_printed_range(hours([245.0, 245.0], [172.0, 245.0]))
      and "172-245" in NG.hours_within_printed_range(hours([245.0, 245.0], [172.0, 245.0])),
      "the words name both figures")
f = hours([252.0, 252.0], [450.0, 450.0])
check([NG.confidence(f, g)["unit_arithmetic"] for g in HOURS] == [40, 50, 30], "the scores are 40, 50 and 30")
check(all(g in NG.GAPS for g in HOURS), "each gap has its sentence")
check(named(hours([252.0, 252.0], [450.0, 450.0], measure="units"))[0] not in HOURS,
      "a program in units takes no hours gap")
check(named(hours([0.0, 0.0], [240.0, 240.0])) == (None, None), "hours that add to zero take no gap")
check(named(hours([72.0, 72.0], [0.0, 0.0])) == (None, None), "a printed total of zero takes no gap")
check(named(hours([72.0, 72.0], [90.0, 90.0], why=["a", "b"]))[0] not in HOURS, "a second reason takes no hours gap")
check(named(hours([72.0, 72.0], [90.0, 90.0], coverage=False))[0] is None, "a failing coverage check takes no gap")
check(named(hours([90.0, 90.0], [90.0, 90.0], passes=True))[0] is None, "a passing record takes no gap")

# The self-recall on held answers, and the plain recall, over every committed record.
res = NG.run(write=False, gaps=HOURS, skip=LANE_1_S703)
hr = res["hours_recall"]
check(hr["held"] > 3000 and hr["right"] == hr["held"] and hr["wrong"] == 0
      and set(hr["by_test"]) == set(HOURS),
      "self-recall, three readings of each passing hours record: held %d, right %d, wrong %d (%s)"
      % (hr["held"], hr["right"], hr["wrong"], hr["wrong_keys"][:3]))
rc = res["recall"]
check(rc["wrong"] == 0 and all(rc["by_answer"].get(g, 0) > 0 for g in HOURS),
      "the plain recall with the new rules: right %d, wrong %d" % (rc["right"], rc["wrong"]))
check(not any(m["college"] in LANE_1_S703 for m in res["moved"]), "the dry run moves no record at a lane 1 college")

# The committed plan.
CAUSES = ["units_incomplete|noncredit_hours", "units_unequal|noncredit_hours"]
with open(os.path.join(ROOT, "kb", "receipts", "program_requirement_records_named_gaps_2026-11-22_s703nc.json"),
          encoding="utf-8") as fh:
    plan = json.load(fh)
keys = {(r["college"], str(r["control_number"])) for r in plan["records"]}
census = NG.census_keys(tuple(CAUSES))
check(sorted(plan["only_gaps"]) == sorted(HOURS) and plan["census_causes"] == CAUSES,
      "the plan moves the three hours gaps, at the two census causes")
check(keys and keys <= census, "every plan row is a census lever 3 program (%d of %d)" % (len(keys & census), len(keys)))
check(all(r["gap"] in HOURS and r["after_image"]["checks"].get("gaps") == [r["gap"]]
          and not (r["before_image"]["checks"] or {}).get("gaps") for r in plan["records"]),
      "each row takes its gap, and none filed a gap before")
check(not {c for c, _ in keys} & set(LANE_1_S703), "no plan row at a lane 1 college")
check(not {c for c, _ in keys} & set(G.PARKED), "no plan row at a parked college")
check(set(LANE_1_S703) <= set(plan["held_colleges"]), "the receipt names the six held colleges")
with open(os.path.join(ROOT, "kb", "migrations", "2026-11-22_s703nc_prreq_named_gaps_apply.sql"),
          encoding="utf-8") as fh:
    sql_keys = set(re.findall(r"^\s*\(\d+, '([^']+)', '(\d{5})', \d+,", fh.read(), re.M))
check(sql_keys == keys, "the guarded UPDATE names exactly the plan's rows (%d of %d)" % (len(sql_keys), len(keys)))
for college, cn in sorted(keys):
    with open(os.path.join(ROOT, "kb", "program_requirements_college", C.slug_of(college), "records", cn + ".json"),
              encoding="utf-8") as fh:
        filed = json.load(fh)
    check(len(filed["score"].get("gaps") or []) == 1 and filed["score"]["gaps"][0]["gap"] in HOURS,
          "%s %s: the record files its hours gap" % (college, cn))

# The lane 1 colleges' records carry no hours gap.
for college in LANE_1_S703:
    for p in glob.glob(os.path.join(ROOT, "kb", "program_requirements_college", C.slug_of(college), "records", "*.json")):
        with open(p, encoding="utf-8") as fh:
            sc = json.load(fh).get("score") or {}
        check(not set(HOURS) & {g.get("gap") for g in sc.get("gaps") or [] if isinstance(g, dict)},
              "%s: a lane 1 college's record carries no hours gap" % os.path.relpath(p, ROOT))

if failures:
    for m in failures:
        print("FAIL:", m)
    sys.exit(1)
print("%d/%d checks passed: the hours gaps (S703)" % (checks[0], checks[0]))
