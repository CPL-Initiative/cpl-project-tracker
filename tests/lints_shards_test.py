#!/usr/bin/env python3
"""The lints job runs in four shards (S722, 2026-11-24; Sam: "do we need to do lints check on the whole code base every
time?"). One runner took 19.7 min for 303 steps in series; each shard now runs about a quarter.

WHAT THIS GUARDS:
  (1) the matrix is shards 1 to 4 with fail-fast off, so one shard's failure never hides another's;
  (2) the setup steps (checkout, node, npm install, the pip line) run on every shard, and the pip line installs every
      package a later step installs for itself (openpyxl, pypdf, pyyaml), so no step leans on one that ran elsewhere;
  (3) every other step names exactly one shard, and a step's own condition stays beside the shard's;
  (4) every shard carries steps (the assignment was balanced by measured time, so the counts differ);
  (5) `test` still needs `lints` by its job id and reads needs.lints.result, which a matrix sets to success only when
      every shard succeeds.
Run: python3 tests/lints_shards_test.py
"""
import os
import re
import sys

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W = yaml.safe_load(open(os.path.join(ROOT, ".github", "workflows", "js-tests.yml"), encoding="utf-8"))
N = [0]
FAILS = []


def check(name, ok, detail=""):
    N[0] += 1
    print(("PASS " if ok else "FAIL ") + name + ("" if ok else "  " + str(detail)[:300]))
    if not ok:
        FAILS.append(name)


job = W["jobs"]["lints"]
steps = job["steps"]
check("(1) the matrix is shards 1 to 4, fail-fast off",
      job.get("strategy", {}).get("matrix", {}).get("shard") == [1, 2, 3, 4] and job["strategy"].get("fail-fast") is False)
setup = steps[:4]
check("(2) the four setup steps run on every shard", all("if" not in s for s in setup)
      and setup[0].get("uses", "").startswith("actions/checkout") and setup[2].get("run") == "npm install", setup)
pip = setup[3].get("run", "")
wanted = set()
for s in steps[4:]:
    for m in re.finditer(r"pip install --quiet ([^\n]+)", s.get("run") or ""):
        wanted.update(m.group(1).split())
check("(2) the setup pip line installs every package a later step installs", wanted <= set(pip.split()[3:]),
      sorted(wanted - set(pip.split()[3:])))
bad, per = [], {1: 0, 2: 0, 3: 0, 4: 0}
for s in steps[4:]:
    c = str(s.get("if", ""))
    m = re.findall(r"matrix\.shard == (\d)", c)
    if len(m) != 1 or not c.startswith("matrix.shard == ") or int(m[0]) not in per:
        bad.append(s.get("name"))
    else:
        per[int(m[0])] += 1
check("(3) every step past the setup names exactly one shard", not bad, bad[:5])
check("(3) a step's own condition stays beside its shard's",
      any(str(s.get("if", "")).endswith("(github.event_name == 'pull_request')") for s in steps)
      and any("needs.gate.outputs.decision == 'skip'" in str(s.get("if", "")) for s in steps))
check("(4) every shard carries at least 20 steps", min(per.values()) >= 20, per)
t = W["jobs"]["test"]
check("(5) `test` needs lints by its id and reads needs.lints.result",
      "lints" in t["needs"] and "needs.lints.result" in str(t))

print("\n%d of %d checks passed" % (N[0] - len(FAILS), N[0]))
sys.exit(1 if FAILS else 0)
