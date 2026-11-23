#!/usr/bin/env python3
"""S703's apprenticeship prefix aliases at San Joaquin Delta (census lever 7, f-sjdelta-apprenticeship-coarse-net-s691).

    python3 tests/program_requirements_sjdelta_aliases_s703_test.py

The fixture holds the six apprenticeship program pages college-page-read run 45026053479 printed. Each prints its
courses with a hyphenated prefix (A-IND 78A, A-ELE 75A, A-MEC 74A). The coarse net's code tokens read A-IND 78A as
IND 78A, so without the college's IND, ELE and MEC pairs the net names none of a page's codes; with them it names
every one. The closed lists here are the codes each page prints (the state's lists are read on the runner, and the
pricing run tests them). Pure stdlib.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_requirements_college as C  # noqa: E402
import _program_requirements_reconcile as R  # noqa: E402

FAILS = []
N = [0]


def check(ok, what):
    N[0] += 1
    print(("ok   " if ok else "FAIL ") + what)
    if not ok:
        FAILS.append(what)


COLLEGE = "San Joaquin Delta College"
FX = json.load(open(os.path.join(ROOT, "tests", "fixtures", "program_requirements_sjdelta_apprenticeship_s703.json")))
CONF = R.load_steps()[COLLEGE]
ALIASES = CONF["prefix_aliases"]
PAIRS = {"IND": "A-IND", "ELE": "A-ELE", "MEC": "A-MEC"}

check(all(ALIASES.get(k) == v for k, v in PAIRS.items()), "the entry maps IND, ELE and MEC to A-IND, A-ELE and A-MEC")
check(all(any(c.get("printed") == k and c.get("file") == v and "45026053479" in c.get("source", "")
              for c in CONF.get("prefix_aliases_cited") or []) for k, v in PAIRS.items()),
      "each pair is cited with the page read that printed its codes")
check(sorted(FX["pages"]) == ["14594", "14595", "14597", "14598", "14599", "37611"],
      "the fixture holds the six apprenticeship pages")

for cn, page in sorted(FX["pages"].items()):
    text = page["text"]
    codes = sorted(set(re.findall(r"\bA-[A-Z]{2,4} \d{1,3}[A-Z]?\b", text)))
    plain = C.with_renumbers([{"closed_list": [{"code": c} for c in codes]}], {}, None)[0]["closed_list"]
    aliased = C.with_renumbers([{"closed_list": [{"code": c} for c in codes]}], {}, ALIASES)[0]["closed_list"]
    net = C.page_codes(text)
    check(codes and C.net_hits(plain, net) == 0,
          "%s: without the pairs the coarse net names 0 of the %d codes its page prints" % (cn, len(codes)))
    check(C.net_hits(aliased, net) == len(codes) and len(C.P.find_codes(text, aliased)) == len(codes),
          "%s: with the pairs the net and the exact test name all %d" % (cn, len(codes)))

# The pairs touch only A- courses: a listed course under any other prefix carries no printed form from them.
others = C.with_renumbers([{"closed_list": [{"code": c} for c in ("ELEC 30", "IND 78A", "MECH 10", "ACCT 1A")]}],
                          {}, {k: ALIASES[k] for k in PAIRS})[0]["closed_list"]
check(not any(c.get("printed") for c in others), "ELEC, IND, MECH and ACCT courses take no printed form from the pairs")

print("\n%d/%d checks passed" % (N[0] - len(FAILS), N[0]))
sys.exit(1 if FAILS else 0)
