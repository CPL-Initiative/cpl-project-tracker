#!/usr/bin/env python3
"""The S683 cheap-piles lists (kb/program_requirements_cheap_piles_s683.json) name what they say they name.

WHY. The file is what a later session acts on before more units-rule work: A5's wrong answers by cause, and the 33
records S681's second reader held out of #3497's plan, each with the gap that fits. A list that drifts from the
self-check it reports, or that names a record that does not exist, sends that session after the wrong rows.

  * the builder's record-by-record repeat of the self-check counts what self_check() counts for A5, so the keys it
    lists are the self-check's own;
  * while the records A5 applies to are the ones the file was built from (its population digest), the file's misses
    are exactly the self-check's wrong answers, key for key; once those records move, each listed miss still names
    a record, and the notice says to rebuild;
  * every cause is one of the fixed set, and the counts by cause add to the list;
  * each of the 33 names a committed record, sits in #3502's plan lanes, and takes a gap name from
    kb/_program_named_gaps.py's GAPS or none.

Run from repo root: python3 tests/program_requirements_cheap_piles_s683_test.py
"""
import collections
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_requirements_cheap_piles_s683 as C  # noqa: E402
import _program_requirements_units_rules as U  # noqa: E402

# kb/_program_named_gaps.py's GAPS keys (#3497, not on main when this was written).
GAP_NAMES = {"major_total_differs", "no_units_printed", "no_units_read", "no_hours_read", "catalog_figures_differ",
             "noncredit_names_only"}

checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


with open(C.OUT, encoding="utf-8") as fh:
    D = json.load(fh)
a5, held = D["a5"], D["held_out"]

# ── A5 ─────────────────────────────────────────────────────────────────────
pop = list(C.a5_population())
kinds = collections.Counter(k for _, _, k, _, _ in pop)
files = [d for _, d in U.load_files()]
own = U.self_check(files, U.college_ge_totals(files))["A5"]
for k in ("right", "wrong", "not_exact"):
    check(kinds[k] == own[k], "the builder's repeat counts %d %s, self_check() counts %d" % (kinds[k], k, own[k]))
check(sum(kinds.values()) == own["applies"], "the builder's repeat applies to %d, self_check() to %d"
      % (sum(kinds.values()), own["applies"]))

wrong_now = {(f["college"], str(f["control_number"])) for _, f, k, _, _ in pop if k == "wrong"}
listed = {(m["college"], m["control_number"]) for m in a5["misses"]}
check(len(listed) == len(a5["misses"]), "a miss is listed twice")
check(len(a5["misses"]) == a5["self_check"]["wrong"], "the file lists %d misses against its self-check's %d wrong"
      % (len(a5["misses"]), a5["self_check"]["wrong"]))
if C._digest([p for p, _, _, _, _ in pop]) == a5["population_digest"]:
    check(listed == wrong_now, "the file's A5 misses differ from the self-check's wrong answers: listed only %s; "
          "wrong only %s" % (sorted(listed - wrong_now)[:5], sorted(wrong_now - listed)[:5]))
else:
    print("notice: the records A5 applies to have moved since the file was built; rebuild it with "
          "python3 kb/_program_requirements_cheap_piles_s683.py")
for m in a5["misses"]:
    check(os.path.exists(os.path.join(ROOT, m["path"])), "A5 miss %s %s names no record" % (m["college"], m["control_number"]))
    check(m["cause"] in C.A5_CAUSES, "A5 miss %s %s has a cause outside the set: %r"
          % (m["college"], m["control_number"], m["cause"]))
check(sum(a5["by_cause"].values()) == len(a5["misses"]), "A5's counts by cause do not add to its list")
check(set(a5["a narrower A5 excludes"]) <= set(C.A5_NARROWER), "a cause a narrower A5 excludes is not one of A5's own")

# ── the 33 ────────────────────────────────────────────────────────────────
recs = held["records"]
check(len(recs) == 33, "the held-out list holds %d records, not 33" % len(recs))
check({(r["college"], r["control_number"]) for r in recs} == set(C.VERDICTS), "the file's 33 differ from VERDICTS")
plan = C.plan_keys()
for r in recs:
    key = "%s %s" % (r["college"], r["control_number"])
    path = os.path.join(ROOT, r["path"] or "")
    check(bool(r["path"]) and os.path.exists(path), "%s names no committed record" % key)
    if r["path"] and os.path.exists(path):
        with open(path, encoding="utf-8") as fh:
            f = json.load(fh)
        check((f.get("college"), str(f.get("control_number"))) == (r["college"], r["control_number"]),
              "%s's path holds another record" % key)
    check((r["college"], r["control_number"]) in plan, "%s is not in #3502's plan lanes" % key)
    check(r["labeled"] in ("catalog_figures_differ", "no_units_printed"), "%s carries no plan label" % key)
    check(r["cause"] in C.HELD_CAUSES, "%s has a cause outside the set: %r" % (key, r["cause"]))
    check(r["true_gap"] is None or r["true_gap"] in GAP_NAMES, "%s names a gap GAPS lacks: %r" % (key, r["true_gap"]))
    check(bool(r["why"]), "%s gives no reason" % key)
check(sum(held["by_cause"].values()) == len(recs), "the held-out counts by cause do not add to its list")
check(sum(held["by_true_gap"].values()) == len(recs), "the held-out counts by gap do not add to its list")

if failures:
    for f in failures:
        print("FAIL:", f)
    print("%d check(s), %d failure(s)" % (checks[0], len(failures)))
    sys.exit(1)
print("ok: %d checks, 0 failures" % checks[0])
