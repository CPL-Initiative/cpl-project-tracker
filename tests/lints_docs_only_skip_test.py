#!/usr/bin/env python3
"""On a docs-only diff, the heavy lint steps that read no docs file skip (S737, 2026-11-26; the Commons lane's CI item,
"skip the generator lint steps on a docs-only PR"). The list is tests/lints_docs_only_skip.json: each step there was
run under strace and opened no docs-shaped path for reading. Main's push run and every code PR run them all.

WHAT THIS GUARDS:
  (1) every listed step carries `&& (needs.gate.outputs.decision == 'run')` after its shard, and no step outside the
      list does, so a step joins the skip only through the list;
  (2) the steps the trace caught reading docs (the dependency map, the Commons data dashboard pair, the apply-workflow
      group check) are not on the list and do not skip;
  (3) the docs-reading jsdom step still runs on the skip decision, and the `test` job still reports on every run;
  (4) the list names only steps the workflow holds, each once.
Run: python3 tests/lints_docs_only_skip_test.py
"""
import json
import os
import sys

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W = yaml.safe_load(open(os.path.join(ROOT, ".github", "workflows", "js-tests.yml"), encoding="utf-8"))
LIST = json.load(open(os.path.join(ROOT, "tests", "lints_docs_only_skip.json"), encoding="utf-8"))
RUN = "&& (needs.gate.outputs.decision == 'run')"
FAILS, N = [], [0]


def check(name, ok, detail=""):
    N[0] += 1
    print(("PASS " if ok else "FAIL ") + name + ("" if ok else "  " + str(detail)[:300]))
    if not ok:
        FAILS.append(name)


steps = W["jobs"]["lints"]["steps"]
by_name = {}
for s in steps:
    by_name.setdefault(s.get("name"), []).append(s)
skip = [x["name"] for x in LIST["skip"]]
readers = [x["name"] for x in LIST["read_docs_so_they_run"]]

check("(4) every listed step is in the lints job, once",
      all(len(by_name.get(n, [])) == 1 for n in skip + readers) and len(set(skip)) == len(skip),
      [n for n in skip + readers if len(by_name.get(n, [])) != 1])
check("(1) every listed step skips on a docs-only diff",
      all(str(by_name[n][0].get("if", "")).endswith(RUN) for n in skip if n in by_name),
      [n for n in skip if n in by_name and not str(by_name[n][0].get("if", "")).endswith(RUN)])
check("(1) no step outside the list carries the skip",
      not [s.get("name") for s in steps if RUN in str(s.get("if", "")) and s.get("name") not in skip],
      [s.get("name") for s in steps if RUN in str(s.get("if", "")) and s.get("name") not in skip])
check("(2) the steps that read docs are not on the list and run on every diff",
      not (set(readers) & set(skip)) and all(RUN not in str(by_name[n][0].get("if", "")) for n in readers if n in by_name)
      and len(readers) >= 4, readers)
docs_step = [s for s in steps if "governance_docs_panel" in (s.get("run") or "")]
check("(3) the docs-reading jsdom step still runs on the skip decision",
      len(docs_step) == 1 and "needs.gate.outputs.decision == 'skip'" in str(docs_step[0].get("if", "")), docs_step)
check("(3) the `test` job reports on every run (no if:, or !cancelled())",
      str(W["jobs"]["test"].get("if", "")).replace(" ", "") in ("", "${{!cancelled()}}", "!cancelled()"), W["jobs"]["test"].get("if"))

print(f"\n{N[0] - len(FAILS)} of {N[0]} checks passed")
sys.exit(1 if FAILS else 0)
