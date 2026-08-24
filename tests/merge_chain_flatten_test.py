#!/usr/bin/env python3
"""Merge-chain flattening — generator verification (2026-08-24, Session 187).

Guards flatten_merge_chains() in excel_to_dashboard.py.

THE FAILURE MODE. The curation overlay records one hop per row: "X merges into
Y". A curator can merge X into Y today and merge Y into a comprehensive Z next
month, and then Y is simultaneously a SOURCE and a TARGET. export_unified_courses
skips a row that is a merge source, but its merge-TARGET loop does not skip a
target that is itself a source — so Y rendered as its own row while also being
folded into Z, and X's members stayed attributed to Y instead of reaching Z.

That is not a hypothetical. The Session-187 ESL packaging fold merged 1,990
identities into seven comprehensives; 96 of them had already been merged into by
someone else, so the ESL discipline rendered 169 rows where ~73 was the truth.
The condition predated the fold (340 chains overall — 180 from the title lane,
60 curator-made) and the fold only made it visible.

WHY THE LAST ASSERTION IS THE LOAD-BEARING ONE. Tests 1-4 pin the arithmetic on
fixtures, which is worth having but is only as good as the fixtures I thought to
write. Test 5 states the actual invariant the target loop depends on — after
flattening, NO source is also a target — and test 6 asserts it against the real
committed overlay, so a shape nobody anticipated still fails here.

Run from the repo root:

    python3 tests/merge_chain_flatten_test.py
"""
import importlib.util
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
sys.path.insert(0, os.path.join(ROOT, "kb"))

spec = importlib.util.spec_from_file_location(
    "gen", os.path.join(ROOT, "excel_to_dashboard.py"))
gen = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gen)
flatten = gen.flatten_merge_chains

fails = []


def check(label, got, want):
    ok = got == want
    print(("  ok   " if ok else "  FAIL ") + label + ("" if ok else f"\n         got {got!r}\n         want {want!r}"))
    if not ok:
        fails.append(label)


print("1. a two-hop chain resolves to its end")
m = {"X": "Y", "Y": "Z"}
check("X and Y both land on Z", flatten(dict(m)), {"X": "Z", "Y": "Z"})

print("2. a three-hop chain resolves to its end")
check("depth 3", flatten({"W": "X", "X": "Y", "Y": "Z"}),
      {"W": "Z", "X": "Z", "Y": "Z"})

print("3. direct merges are untouched")
check("two independent one-hop merges",
      flatten({"A": "T1", "B": "T2"}), {"A": "T1", "B": "T2"})

print("4. a cycle terminates instead of hanging the build")
#    A generator that spins is a worse failure than one that renders a stale
#    edge, so the guard stops rather than trying to pick a winner.
out = flatten({"A": "B", "B": "A"})
check("both entries still resolve to something", sorted(out), ["A", "B"])
#    A self-merge would make the row a member of itself — worse than the stale
#    edge, and invisible in a way the stale edge is not. This caught the first
#    cut of the helper, which wrote merge_into[src] = src on exactly this input.
check("no key maps to itself", [k for k, v in out.items() if k == v], [])
check("the recorded hop is kept", out, {"A": "B", "B": "A"})

print("5. the invariant the merge-target loop depends on")
#    Y rendered as its own row because it was a target while also a source.
#    After flattening that set must be empty — this is the actual guard.
m = {"X": "Y", "Y": "Z", "P": "Q", "R": "P", "S": "T"}
out = flatten(dict(m))
check("no source is also a target",
      sorted(set(out) & set(out.values())), [])

print("6. the same invariant against the REAL committed overlay")
path = os.path.join(ROOT, "kb", "coci_curation.json")
cur = (json.load(open(path, encoding="utf-8")) or {}).get("curations", {})
raw = {cid: c["merge_into"] for cid, c in cur.items() if c.get("merge_into")}
if not raw:
    fails.append("overlay carried no merge_into rows — the check proved nothing")
    print("  FAIL overlay carried no merge_into rows — the check proved nothing")
else:
    before = len(set(raw) & set(raw.values()))
    after = flatten(dict(raw))
    print(f"       overlay carries {len(raw)} merges; {before} were mid-chain")
    check("no source is also a target after flattening",
          sorted(set(after) & set(after.values())), [])
    check("every source still points at a real destination",
          [s for s, t in after.items() if t in after], [])

print()
if fails:
    print(f"FAILED ({len(fails)}): " + "; ".join(fails))
    sys.exit(1)
print("all merge-chain checks passed")
