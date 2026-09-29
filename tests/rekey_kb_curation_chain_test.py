#!/usr/bin/env python3
"""Guards for kb/_rekey_kb_curation_supabase.py's handling of a CHAINED alias
map — one pair's old key is another pair's new key. On 2026-09-03 the recode
map carried `ARME M10AJ -> FLNG M10AJ` beside `ARMN M10AJ -> ARME M10AJ`:
the run re-keyed every row correctly (sorted order happened to vacate first)
and then its verify counted the two chained keys as leftovers and failed
(run 33802936877, "2 rows still carry an old key"). Pins: the vacating pair
runs first whatever the sort order, the chained key leaves the verify
surface, a swap aborts instead of looping, and an unchained map is untouched.

Run from repo root: python3 tests/rekey_kb_curation_chain_test.py
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _rekey_kb_curation_supabase as rk  # noqa: E402

results = []


def check(name, cond):
    results.append((name, bool(cond)))
    print(("PASS  " if cond else "FAIL  ") + name)


# --- the 2026-09-03 shape: sorted order already vacates first ----------------
pairs = {"ARME M10AJ": "FLNG M10AJ", "ARMN M10AJ": "ARME M10AJ", "THEA M1087": "THTR M1087"}
order = [old for old, _ in rk.order_pairs(pairs)]
check("the pair vacating ARME M10AJ runs before the pair filling it",
      order.index("ARME M10AJ") < order.index("ARMN M10AJ"))
old_only, chained = rk.verify_surface(pairs)
check("the chained key leaves the verify surface", "ARME M10AJ" not in old_only)
check("the unchained old keys stay on the verify surface",
      set(old_only) == {"ARMN M10AJ", "THEA M1087"})
check("the chained keys are named", chained == ["ARME M10AJ"])

# --- the same chain where the sort order would FILL before it VACATES --------
pairs2 = {"ZZZ M1": "AAA M1", "AAA M1": "BBB M1"}     # sorted: AAA->BBB first — fine
pairs3 = {"AAA M1": "ZZZ M1", "ZZZ M1": "BBB M1"}     # sorted: AAA->ZZZ first — WRONG
order3 = [old for old, _ in rk.order_pairs(pairs3)]
check("a chain the sort order would apply backwards is still vacated first",
      order3 == ["ZZZ M1", "AAA M1"])

# --- a three-hop chain ---------------------------------------------------------
pairs4 = {"D": "C", "C": "A", "A": "B", "X": "Y"}
order4 = [old for old, _ in rk.order_pairs(pairs4)]
check("a three-hop chain applies from the far end", order4.index("A") < order4.index("C") < order4.index("D"))
check("the unchained pair keeps rank 0 and sorts by key", order4[:2] == ["A", "X"])
old4, chained4 = rk.verify_surface(pairs4)
check("every chained key leaves the surface, the ends stay",
      set(old4) == {"D", "X"} and chained4 == ["A", "C"])

# --- a swap has no safe order ------------------------------------------------
try:
    rk.order_pairs({"A": "B", "B": "A"})
    swapped = False
except SystemExit as e:
    swapped = "cycles" in str(e)
check("a swap aborts instead of looping", swapped)

# --- an unchained map is untouched ------------------------------------------
plain = {"THEA M1087": "THTR M1087", "ECED M1001": "CDEV M1001"}
check("an unchained map keeps sorted order",
      [o for o, _ in rk.order_pairs(plain)] == sorted(plain))
old_p, ch_p = rk.verify_surface(plain)
check("an unchained map keeps every old key on the surface", set(old_p) == set(plain) and ch_p == [])

failed = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
