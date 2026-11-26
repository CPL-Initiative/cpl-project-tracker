#!/usr/bin/env python3
"""A state-list subject written as its title and code takes its title from the label (S737). San Jose City College's
state list writes "ADAPTED PHYSICAL EDUCATION (APE)" beside the catalog's APE, so 80 such codes read untitled.

WHAT THIS GUARDS: (1) the label pattern reads the title and the code; (2) a plain code, a code with a slash or a code
whose parenthesis is not a code never matches; (3) on the committed status file, every San Jose City label code has a
title, from the label where the catalog gives none.
Run: python3 tests/subject_state_label_title_test.py
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _build_local_subject_titles as B  # noqa: E402

FAILS, N = [], [0]


def check(name, ok, detail=""):
    N[0] += 1
    print(("PASS " if ok else "FAIL ") + name + ("" if ok else "  " + str(detail)[:300]))
    if not ok:
        FAILS.append(name)


def label(s):
    m = B.STATE_LABEL_RE.match(s)
    return (m.group(1), m.group(2)) if m and len(m.group(1)) > len(m.group(2)) else None


check("(1) a title and code label reads both", label("ADAPTED PHYSICAL EDUCATION (APE)") == ("ADAPTED PHYSICAL EDUCATION", "APE"))
check("(1) commas and hyphens stay in the title", label("KINESIOLOGY-ATHLETICS, MEN (KINAM)") == ("KINESIOLOGY-ATHLETICS, MEN", "KINAM"))
for s in ("APE", "GEOL/GEOG", "PE/D", "ESL NC", "CIS 023D", "HVAC/R", "(APE)", "AB (ABCDEFG)"):
    check("(2) no label in " + repr(s), label(s) is None, label(s))
doc = json.load(open(os.path.join(ROOT, "kb", "status", "local_subject_titles.json"), encoding="utf-8"))
cols = doc["columns"]
sj = [dict(zip(cols, r)) for c in doc["colleges"] if c["slug"] == "san_jose_city" for r in c["rows"]]
labels = [r for r in sj if label(r["code"])]
check("(3) San Jose City's label codes all carry a title", len(labels) >= 50 and all(r["printed_name"] for r in labels),
      [r["code"] for r in labels if not r["printed_name"]][:5])
check("(3) a label title names its source", all(r["title_source"] in (B.STATE_LABEL, "course pages", "index", B.DEPARTMENT_TITLE)
      or r["title_state"] != "not_in_catalog" for r in labels), {r["title_source"] for r in labels})

print(f"\n{N[0] - len(FAILS)} of {N[0]} checks passed")
sys.exit(1 if FAILS else 0)
