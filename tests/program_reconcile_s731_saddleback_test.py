#!/usr/bin/env python3
"""S731, lane 2: Saddleback's repeat steps fire on the seven S730 held on the reconcile lever, and on no other record (kb/_program_reconcile_s731_saddleback.py).

WHY. S730's plan s730b held seven Saddleback records on the reconcile lever (p-gap-filing-leaves-census-lever-s721):
each page prints 'The following course must be taken twice for a total of two units: 2.0' over ETT 142 or MUS 50 at 1
unit, and the reading lists the course once. Pinned here:

  * the config: Saddleback carries two repeat steps with block_sum, so the reconcile module's guard moves no record
    elsewhere. One other college carries it since S748, named here with its reason: San Bernardino Valley, one
    repeat step for local A.A. degrees whose pattern names its own heading words and its own pair ('Complete 4
    semesters totaling 2 units' over MUS 141X2 & MUS 241X2, Music A.A. 04894;
    tests/program_reconcile_s748_sbvc_test.py holds its self-recall). Any third carrier, a second San Bernardino
    Valley step, or that step read wider than those words, fails here;
  * the self-recall: over every committed Saddleback record, with a stand-in text printing the words over both
    courses, the steps fire on the seven alone (a fire on an eighth record fails here), each fire counts its course
    twice once, and today's scorer then passes it; the five other records that carry either course stay as filed;
  * block_sum is load-bearing: without it the same steps fire on Commercial Music 41419 and Music 33565;
  * every boundary reading (the words gone, three times, the block's figure off, a choose list, a count set, a course
    with no units, the course an alternative) fires nothing;
  * keep-only refuses a base that is the run's own filing (p-keep-only-trusts-base-s727) and a target the run did
    not carry, and keeps all seven against an earlier base;
  * it holds before the reconcile run and after keep-only (each target then carries the count and passes).

Run from repo root: python3 tests/program_reconcile_s731_saddleback_test.py
"""
import copy
import glob
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_reconcile_s731_saddleback as W  # noqa: E402

SEVEN = {"19050", "19051", "41420", "41422", "41423", "41425", "41426"}
checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


conf = W.R.load_steps()
sts = W.steps()
check(len(sts) == 2 and all(s.get("block_sum") is True and s.get("pattern") for s in sts)
      and len(conf[W.COLLEGE]["steps"]) == 2, "Saddleback carries two repeat steps with block_sum")
others = {c: [s for s in v.get("steps") or [] if s.get("block_sum")] for c, v in conf.items()
          if c != W.COLLEGE and isinstance(v, dict) and any(s.get("block_sum") for s in v.get("steps") or [])}
# S748: San Bernardino Valley's one step, for Music A.A. 04894's applied pair, is the only other carrier.
SBVC = "San Bernardino Valley College"
check(sorted(others) == [SBVC], "one other college carries block_sum, San Bernardino Valley: %s" % sorted(others))
sb = (others.get(SBVC) or [{}])
# The pattern is pinned whole (the second reader, S748): a substring test passed a pattern widened around those
# words. Any change to it is a new step, with its own recall.
SBVC_PATTERN = (r"Complete\s+4\s+semesters\s+totaling\s+2\s+units\s+(?P<code>MUS\s*141X(?P<n>2))"
                "\\s*\u00b7?\\s*&\\s*MUS\\s*241X2(?![0-9A-Za-z])")
check(len(sb) == 1 and sb[0].get("kind") == "repeat" and sb[0].get("block_sum") is True
      and sb[0].get("awards") == "local_aa" and sb[0].get("pattern") == SBVC_PATTERN
      and not sb[0].get("name_pattern") and not sb[0].get("block_pattern"),
      "San Bernardino Valley's is one repeat step for local A.A. degrees, on its own heading words and its own pair, "
      "its pattern as filed to the character: %r" % sb[0].get("pattern"))
check(set(W.TARGETS) == SEVEN and not set(W.KEPT) & SEVEN, "the seven, and the five kept apart")

n_records = len(glob.glob(os.path.join(W.COLLEGE_DIR, W.SLUG, "records", "*.json")))
rc = W.recall()
check(rc["read"] == n_records and rc["right"] == n_records and not rc["wrong"], "recall right on every record: %s"
      % rc["wrong"])
check(set(rc["fired"]) == SEVEN and len(rc["fired"]) == 7, "the steps fire on the seven alone: %s" % rc["fired"])
check(not rc["after_not_passing"], "today's scorer passes each after: %s" % rc["after_not_passing"])
check(set(rc["carriers_kept"]) == set(W.KEPT), "the five other carriers stay as filed: %s" % rc["carriers_kept"])

# block_sum is load-bearing: the same steps without it fire beyond the seven.
loose = [dict(s, block_sum=False) for s in sts]
fired = set()
for p in glob.glob(os.path.join(W.COLLEGE_DIR, W.SLUG, "records", "*.json")):
    with open(p, encoding="utf-8") as fh:
        f = json.load(fh)
    if isinstance(f.get("record"), dict) and W.run_steps(W._before_image(f), sts=loose)[1]:
        fired.add(str(f["control_number"]))
check({"33565", "41419"} <= fired - SEVEN, "without block_sum the steps fire on 33565 and 41419: %s" % sorted(fired - SEVEN))

bd = W.boundaries()
check(not bd["wrong"] and sum(bd["counts"].values()) == 7 * 8, "every boundary reading fires nothing: %s" % bd["wrong"])

for cn in SEVEN:
    o = W.outcome(cn)
    e = W.TARGETS[cn]
    check(o["before"][0] == "unequal" and o["before"][1] == [float(x) for x in e["before"]]
          and o["before"][2] == [float(x) for x in e["stated"]], "%s: before, its sum short by one" % cn)
    check(o["after"][0] == "equal" and o["after"][1] == [float(x) for x in e["stated"]] and o["times"] == [2],
          "%s: after, %s taken twice and the printed total read" % (cn, e["code"]))

# keep-only: the plan against a synthetic run (no file is written).
RUN = "99999999999"
current, base = {}, {}
for cn in SEVEN:
    b = W._before_image(W._load(cn))
    base[cn] = json.dumps(dict(b, extracted_run=38843470509))
    rec = W.run_steps(b)[0]
    f = dict(b, record=rec, extracted_run=RUN, reconciled=W.run_steps(b)[1],
             score=dict(b["score"], arithmetic=dict(W.arith(rec, b.get("award")), **{"pass": True})))
    current[cn] = f
other = W._load("41419")
current["41419"] = dict(other, extracted_run=RUN)
base["41419"] = json.dumps(other)
plan = W.keep_only_plan(RUN, current, base)
check(sorted(plan["kept"]) == sorted(SEVEN) and not plan["held"] and list(plan["restore"]) == ["41419"],
      "keep-only keeps the seven and restores 41419 against an earlier base: %s" % plan["held"])
own = dict(base, **{cn: json.dumps(current[cn]) for cn in SEVEN})
plan = W.keep_only_plan(RUN, current, own)
check(len(plan["held"]) == 7 and all("base" in h[1] for h in plan["held"]), "keep-only refuses the run's own base")
plan = W.keep_only_plan(RUN, dict(current, **{"41420": dict(current["41420"], extracted_run="1")}), base)
check(["41420", "the run did not carry it"] in plan["held"], "keep-only refuses a target the run did not carry")
g = copy.deepcopy(current["41422"])
g["record"]["notes"] = g["record"]["notes"] + ["changed"]
plan = W.keep_only_plan(RUN, dict(current, **{"41422": g}), base)
check(["41422", "the run changed more than the course's times"] in plan["held"], "keep-only refuses another change")

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
