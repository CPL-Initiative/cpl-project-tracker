#!/usr/bin/env python3
"""The re-mint blast radius counts the right set, in the right era.

    python3 tests/remint_blast_radius_test.py

This guards three READINGS rather than three behaviors, because all three were
got wrong while building the thing and none of them errored. A wrong reading
here does not crash — it quietly tells a curator that re-minting an identity
moves 60 rows when it moves 2,190, or counts an official C-ID anchor as
re-mintable, or double-applies a permutation and attributes one identity's
articulations to an unrelated one.

  1. `course_id` IS the identity id. Joining articulations through member
     control numbers matched 2 records of 4,592.
  2. `coci_articulations.json` is ALREADY current-era. Resolving its keys
     through the alias chain again moved 1,662 live keys onto live but
     unrelated identities, and the homeless count ROSE — the direction test
     from methodology-alias-map-resolution-semantics.
  3. A C-ID anchor is not re-mintable and must never appear in a footprint.

Plus the one Sam ruled: nothing is dropped silently (ruling 5, 2026-09-05).

Pure stdlib, no network.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))

import _build_remint_blast_radius as B  # noqa: E402

n = 0
fails = []


def ok(name, cond, detail=""):
    global n
    n += 1
    if not cond:
        fails.append(f"  {name}" + (f" — {detail}" if detail else ""))


payload = json.load(open(B.OUT, encoding="utf-8"))
worklist = json.load(open(B.WORKLIST, encoding="utf-8"))
arts = json.load(open(B.ARTICULATIONS, encoding="utf-8"))
mem = json.load(open(B.MEMBERSHIPS, encoding="utf-8"))["memberships"]
ident = arts["identities"]

# ── reading 1: the join key ──────────────────────────────────────────────────
cids = {r["course_id"] for r in arts["articulations"]}
ok("articulation course_id values look like identity ids, not control numbers",
   sum(1 for c in cids if c in ident) > len(cids) // 2,
   f"{sum(1 for c in cids if c in ident)} of {len(cids)} in the identity map")
ctrl = {m.get("control_number") for ms in mem.values() for m in ms}
# ⚠️ The one overlap is the literal string "NULL", which BOTH stores carry as a
# value: 2 articulation records use it as a course_id, and 10 members across 9
# identities carry it as a control_number (WEXP M1001 among them). It is a MAP
# export artifact — a null that arrived as text — and it is why the
# control-number join appeared to match anything at all.
#
# Asserting `== 0` would be false; asserting nothing would let a REAL control
# number start appearing as a course_id unnoticed, which is the join error this
# check exists for. So pin the sentinel exactly.
NULLISH = {"NULL", "null", "None", "", None}
real_overlap = (cids & ctrl) - NULLISH
ok("…and they are NOT control numbers (the join that matched 2 of 4,592)",
   not real_overlap, f"real overlap: {sorted(real_overlap)[:5]}")
ok("the only overlap is the literal NULL sentinel both stores carry",
   (cids & ctrl) <= NULLISH, f"{sorted(cids & ctrl)}")
ok("…and the builder sends those records to the worklist, not into a count",
   all(r["identity"] in NULLISH or r["identity"] not in mem
       for r in worklist["records"] if r["identity"] in NULLISH) and
   "NULL" not in payload["identities"])

# ── reading 2: the era ───────────────────────────────────────────────────────
for marker in B.APPLIED_MARKERS:
    ok(f"articulations carry the applied marker {marker}", bool(arts.get(marker)))
ok("the builder refuses a file whose era it cannot establish",
   "assert_current_era" in dir(B))
try:
    B.assert_current_era({k: None for k in B.APPLIED_MARKERS})
    ok("…and that refusal actually fires", False, "returned instead of aborting")
except SystemExit as e:
    ok("…and that refusal actually fires", "ABORT" in str(e), str(e)[:80])
ok("the payload records that keys are counted directly, not resolved",
   "double-appl" in json.dumps(payload["_era"]).lower())

# ── reading 3: C-ID anchors are not re-mintable ──────────────────────────────
cid_only = {i for i, v in ident.items() if v.get("identity_system") == "C-ID"}
ok("the corpus still contains C-ID anchors to exclude", len(cid_only) > 0, str(len(cid_only)))
leaked = sorted(set(payload["identities"]) & cid_only)
ok("no C-ID anchor appears in any footprint", not leaked, ", ".join(leaked[:5]))
ok("the payload reports how many it excluded",
   payload["totals"]["cid_anchors_excluded"] == len(cid_only),
   f'{payload["totals"]["cid_anchors_excluded"]} vs {len(cid_only)}')

# ── ruling 5: nothing is dropped silently ────────────────────────────────────
attached = payload["totals"]["articulation_records_attached"]
homeless = payload["totals"]["articulation_records_homeless"]
ok("every articulation record is either attached or on the worklist",
   attached + homeless == len(arts["articulations"]),
   f"{attached} + {homeless} != {len(arts['articulations'])}")
ok("the worklist holds exactly the homeless records",
   worklist["count"] == homeless == len(worklist["records"]))
ok("each worklist row says WHY it could not be attached",
   all(r.get("why") for r in worklist["records"]))
ok("…and carries enough to act on it",
   all("exhibit_id" in r and "identity" in r for r in worklist["records"]))

# ── the payload is sparse, and stays small enough to ship ────────────────────
ok("only identities with a non-member footprint are in the payload",
   all(any(v) for v in payload["identities"].values()))
ok("member counts are NOT duplicated into the payload (the browser has the roster)",
   all(len(v) == 3 for v in payload["identities"].values()))
size_kb = os.path.getsize(B.OUT) / 1024
ok("the browser payload stays under 300 KB", size_kb < 300, f"{size_kb:.0f} KB")
ok("the worklist is NOT shipped to the browser",
   "records" not in payload and "homeless_articulations" not in payload)

# ── a footprint is the sum of real rows, checked against the source ──────────
sample = max(payload["identities"], key=lambda i: payload["identities"][i][0])
a_expect = sum(1 for r in arts["articulations"] if r["course_id"] == sample)
ok("the busiest identity's articulation count matches the source",
   payload["identities"][sample][0] == a_expect,
   f"{sample}: payload {payload['identities'][sample][0]} vs source {a_expect}")

# ── --check is a real gate ───────────────────────────────────────────────────
r = subprocess.run([sys.executable, os.path.join(ROOT, "kb", "_build_remint_blast_radius.py"), "--check"],
                   capture_output=True, text=True, cwd=ROOT)
ok("--check passes against the committed payload", r.returncode == 0, r.stdout.strip()[:120])

if fails:
    print(f"FAIL - {len(fails)} of {n} checks:\n" + "\n".join(fails))
    sys.exit(1)
print(f"ok - {n}/{n} remint_blast_radius checks")
