#!/usr/bin/env python3
"""Fixture checks for kb/_rekey_crnc_mirrors.py — one per way the re-key could
lie: a key iterated within one map (the telescoping defect), a cross-map chain
not followed, two classes silently merged onto one id (V1), a key left on an id
with no members (V2), a first run without a baseline, a baseline that breaks
the chronological suffix, and the committed file itself once re-keyed.

Run from repo root: python3 tests/rekey_crnc_mirrors_test.py
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _rekey_crnc_mirrors as rk  # noqa: E402

results = []


def check(name, cond):
    results.append((name, bool(cond)))
    print(("PASS  " if cond else "FAIL  ") + name)


def cls(n):
    return {"class": "mirror", "nc_total": n, "nc_mirrored": n, "pairs": [["A", "X 1", "NCX 1"]]}


map1 = {"THEA M1001": {"new_id": "THTR M1001"}, "THTR M1001": {"new_id": "THTR M1009"},   # slot reuse inside ONE map
        "AAA M1001": {"new_id": "BBB M1001"}}
map2 = {"BBB M1001": {"new_id": "CCC M1001"}, "MATH M1001": {"new_id": "MATH M1001"}}      # a cross-map hop; a no-op pair
mirrors = {"THEA M1001": cls(1), "AAA M1001": cls(2), "MATH M1001": cls(3), "KINE M1001": cls(4)}
live = {"THTR M1001", "CCC M1001", "MATH M1001", "KINE M1001", "THTR M1009"}

out, moved, problems = rk.rekey(mirrors, [map1, map2], live)
check("a key is resolved by ONE lookup per map — never iterated within the map",
      "THTR M1001" in out and out["THTR M1001"]["nc_total"] == 1 and "THTR M1009" not in out)
check("a cross-map chain is followed (map1 then map2)", out.get("CCC M1001", {}).get("nc_total") == 2)
check("a key no map names stays, and a no-op pair changes nothing",
      out["MATH M1001"]["nc_total"] == 3 and out["KINE M1001"]["nc_total"] == 4 and set(moved) == {"THEA M1001", "AAA M1001"})
check("the classes ride along untouched (pairs are local codes, never ids)",
      out["CCC M1001"]["pairs"] == [["A", "X 1", "NCX 1"]])
check("V1-V3 clean on the fixture", problems == [])

# V1: two classes converging on one id is an error, not a fold
conv = rk.rekey({"P M1001": cls(1), "Q M1001": cls(2)}, [{"P M1001": {"new_id": "Q M1001"}, "Q M1001": {"new_id": "Q M1001"}}],
                {"Q M1001"})
check("V1: two keys converging on one id are reported, not merged", any(p.startswith("V1") for p in conv[2]))
# V2: a key resolving to an id with no members
dead = rk.rekey({"P M1001": cls(1)}, [{"P M1001": {"new_id": "GONE M1001"}}], {"P M1001"})
check("V2: a key left on an id with no members is reported", any(p.startswith("V2") and "GONE M1001" in p for p in dead[2]))
# idempotency
again, moved_again, _ = rk.rekey(out, [], live)
check("V3: a second pass with no maps is a no-op", again == out and moved_again == {})

# era handling
chain = ["m1", "m2", "m3", "m4"]
check("first run: the baseline names the last folded map and the rest are pending, in order",
      rk.pending_maps([], "m2", chain) == (["m3", "m4"], chain))
check("later run: the doc's era list decides", rk.pending_maps(["m1", "m2", "m3"], None, chain) == (["m4"], chain))
check("nothing pending is fine", rk.pending_maps(chain, None, chain) == ([], chain))
for bad_args, why in ((([], None, chain), "no baseline on a first run"),
                      (([], "zzz", chain), "a baseline not in the chain"),
                      ((["m1", "m3"], None, chain), "an era list that is not a prefix")):
    try:
        rk.pending_maps(*bad_args)
        ok = False
    except SystemExit:
        ok = True
    check(f"refused: {why}", ok)

# the committed file, through the real chain (skipped when the kb files are absent)
mir_path = os.path.join(ROOT, "kb", "crnc_mirrors.json")
mem_path = os.path.join(ROOT, "kb", "coci_minted_memberships.json")
if os.path.exists(mir_path) and os.path.exists(mem_path):
    doc = json.load(open(mir_path, encoding="utf-8"))
    live_real = set(json.load(open(mem_path, encoding="utf-8"))["memberships"])
    through = doc.get("_rekeyed_through") or []
    baseline = None if through else "kb/pols_remint_out/2026-07-10/alias_map.json"
    pending, _ = rk.pending_maps(through, baseline)
    maps = [rk._load_alias(p) for p in pending]
    real_out, real_moved, real_problems = rk.rekey(doc["mirrors"], maps, live_real)
    check("the committed crnc_mirrors.json re-keys through the pending maps with every key live and none converging",
          real_problems == [] and len(real_out) == len(doc["mirrors"]))
    check("once re-keyed and stamped, the committed file has nothing pending or everything pending resolves",
          (not pending) or bool(real_moved) or all(k in live_real for k in doc["mirrors"]))

failed = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
