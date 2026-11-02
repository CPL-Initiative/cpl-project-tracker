#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""The funding builder's college join: every row of the funding roster is reached by exactly one college.

funding/_build_funding_performance.py joins MAP's college names to the funding roster through
kb/college_short_names.json. A college the join misses lands in `unmatched`: its CPL outcomes count toward no
award, and its JST condition reads not yet met. Sam's short-name corrections of 2026-10-30 (#2598) made the
shorts of City College of San Francisco and College of the Desert whole, while the roster still names them
"San Francisco" and "Desert"; the builder matched on the short and canonical alone, so from the 2026-10-31 run
both colleges fell to `unmatched` (1,842 and 469 awarded CPL records, both JST conditions met in MAP). Sierra's
answer to Sam's JST question on 2026-11-02 showed it: "no counts shown" for both (S544).

What this pins, against the committed roster and identity file, so a short-name change cannot do it again:

  1. Every funding roster row is reached by one identity record, and no two records reach one row.
  2. The records the join leaves out are the noncredit feeders, which _feeder_resolver joins.
  3. CCSF and College of the Desert reach "San Francisco" and "Desert", through the aliases.
  4. Every name in the committed veteran_jst.json reaches a roster row, except the non-CCC institutions.

Run: python3 tests/funding_name_resolver_test.py
"""
import collections
import importlib.util
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


spec = importlib.util.spec_from_file_location("bfp", os.path.join(ROOT, "funding", "_build_funding_performance.py"))
bfp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bfp)

resolve = bfp._name_resolver()
feeder = bfp._feeder_resolver()
records = json.load(open("kb/college_short_names.json", encoding="utf-8"))["colleges"]
src = open("cpl_funding_data.js", encoding="utf-8").read()
funding = json.loads(re.search(r"window\.CPL_FUNDING = (\{.*\});\s*$", src, re.S).group(1))
roster = [c["college"] for c in funding["colleges"]]

reached = collections.defaultdict(list)
left = []
for r in records:
    t = resolve(r["canonical"])
    if t:
        reached[t].append(r["canonical"])
    else:
        left.append(r["canonical"])

# (1)
missing = [f for f in roster if f not in reached]
check("(1) every funding roster row is reached by an identity record", not missing, "unreached: %s" % missing)
twice = {k: v for k, v in reached.items() if len(v) > 1}
check("(1) no two identity records reach one roster row", not twice, json.dumps(twice))
stray = [t for t in reached if t not in roster]
check("(1) the join reaches only roster rows", not stray, json.dumps(stray))

# (2)
not_feeders = [c for c in left if not feeder(c)]
check("(2) the records the join leaves out are the noncredit feeders", not not_feeders, "neither: %s" % not_feeders)

# (3)
check("(3) City College of San Francisco reaches San Francisco", resolve("City College of San Francisco") == "San Francisco",
      repr(resolve("City College of San Francisco")))
check("(3) College of the Desert reaches Desert", resolve("College of the Desert") == "Desert", repr(resolve("College of the Desert")))
check("(3) a short alone still reaches its row (Chabot's prior short)", resolve("Chabot Hayward") == "Chabot", repr(resolve("Chabot Hayward")))

# (4)
non_ccc = set()
if os.path.exists("kb/non_ccc_institutions.json"):
    nc = json.load(open("kb/non_ccc_institutions.json", encoding="utf-8"))
    items = nc.get("institutions", nc) if isinstance(nc, dict) else nc
    for it in items if isinstance(items, list) else []:
        for k in ("name", "map_name", "canonical"):
            if isinstance(it, dict) and it.get(k):
                non_ccc.add(it[k])
vj = json.load(open("veteran_jst.json", encoding="utf-8")).get("colleges", {})
off = [n for n in vj if not resolve(n) and not feeder(n) and n not in non_ccc and "State University" not in n]
check("(4) every college in the committed veteran_jst.json reaches a roster row", not off, "unmatched: %s" % off)

passed = 0
for name, ok, why in results:
    print(("PASS " if ok else "FAIL ") + name + ("" if ok or not why else "\n     " + why))
    passed += ok
print("\n%d/%d passed" % (passed, len(results)))
sys.exit(0 if passed == len(results) else 1)
