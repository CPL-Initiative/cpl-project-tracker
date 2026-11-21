#!/usr/bin/env python3
"""A code's noncredit courses are counted under the category the COCI export names, apart from its credit courses
(S698, #3655; Sam, 2026-11-21: noncredit and credit disciplines are separate in the MQs).

Failure modes: a credit course counted as noncredit (or the reverse); a category invented for a course the export
gives none; a code compared loosely; a band guessed for a course with no CreditType; a rerun that writes other bytes.

Run from repo root: python3 tests/noncredit_categories_test.py
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _build_noncredit_categories as N  # noqa: E402

results = []


def check(name, cond):
    results.append(bool(cond))
    print(("  ok  " if cond else "FAIL  ") + name)


ROWS = [("Alpha College", "aed ", "Non-Enhanced Funding", "Short-term Vocational"),
        ("Alpha College", "AED", "Other Noncredit Enhanced Funding", "Short-term Vocational"),
        ("Alpha College", "AED", "Workforce Preparation Enhanced Funding", "Workforce  Preparation"),
        ("Alpha College", "AED", "Non-Enhanced Funding", None),
        ("Alpha College", "ESL", "Credit Course", None), ("Alpha College", "ESL", "Non-Enhanced Funding", "English as a Second Language (ESL)"),
        ("Alpha College", "MATH", "Credit Course", "Short-term Vocational"),
        ("Alpha College", "ZZZ", "", "Parenting"),
        ("Beta College", "ART", "Credit Course", None)]
d = N.build(ROWS)
A = {c[0]: c for c in d["colleges"][0]["codes"]}
check("a code is the export's Subject, trimmed and upper-cased", "AED" in A and A["AED"][2] == 4)
check("noncredit courses are counted under each category, most first", A["AED"][3][0] == ["Short-term Vocational", 2] and ["Workforce Preparation", 1] in A["AED"][3])
check("a course the export gives no category is counted as such, never placed", [N.NO_CATEGORY, 1] in A["AED"][3])
check("credit and noncredit under one code are counted apart", A["ESL"][1] == 1 and A["ESL"][2] == 1)
check("a credit course is never counted as noncredit, whatever its category column holds", "MATH" not in A)
check("a course with no CreditType is left out: no band is guessed", "ZZZ" not in A)
check("a college with no noncredit course is not listed", [c["college"] for c in d["colleges"]] == ["Alpha College"])
T = d["totals"]
check("the totals add up", T["codes_with_noncredit"] == 2 and T["noncredit_only"] == 1 and T["credit_and_noncredit"] == 1
      and T["noncredit_courses"] == 5 and T["codes_in_two_or_more_categories"] == 1)
check("two runs write the same bytes", N.dump(N.build(ROWS)) == N.dump(N.build(list(ROWS))))
check("the committed file names its source and columns", os.path.exists(os.path.join(ROOT, N.OUT))
      and '"columns":["code","credit_courses","noncredit_courses","categories"]' in open(os.path.join(ROOT, N.OUT), encoding="utf-8").read())

print("%d/%d checks passed" % (sum(results), len(results)))
sys.exit(0 if all(results) else 1)
