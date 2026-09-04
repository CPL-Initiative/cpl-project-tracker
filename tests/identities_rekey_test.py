#!/usr/bin/env python3
"""Fixture checks for kb/_identities_rekey_dryrun.py — the rebuild-from-baseline
re-key of kb/coci_articulations.json's `identities` map (1,597 of 2,346 keys
named ids no longer in the catalog on 2026-09-04).

One check per failure the plan must never produce: a ghost moved onto a key that
already carries a live entry (the live entry wins); two ghosts landing on one
live id both kept (the title-agreeing one wins, then colleges, then alphabetical);
a dead key kept (nothing can display it); a chain resolved by iterating within
one map (kb/_rekey_promotions.resolve semantics: one lookup per map, in order);
a re-keyed entry without its old key; a live entry altered; a receipt applied
without a ruling. Then the committed files: every ghost dispositioned, and the
post-state all live.

Run from repo root: python3 tests/identities_rekey_test.py
"""
import copy
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _identities_rekey_dryrun as idr  # noqa: E402

results = []


def check(name, cond):
    results.append((name, bool(cond)))
    print(("PASS  " if cond else "FAIL  ") + name)


def ent(title, colleges=("A",), **kw):
    e = {"identity_system": "M-ID", "title": title, "discipline": "X", "confidence": 0.8, "over_merged": False,
         "colleges_offering": list(colleges), "colleges_offering_count": len(colleges)}
    e.update(kw)
    return e


live = {"MATH M1001", "MATH M1002", "ARCH M1039", "ARCH M1040", "HIST M1001", "PHYS M1001"}
titles = {"MATH M1001": "Calculus I", "MATH M1002": "Calculus II", "ARCH M1039": "Architectural Drawing 1",
          "ARCH M1040": "Studio", "HIST M1001": "World History", "PHYS M1001": "Physics"}
title_of = lambda i: titles.get(i)
identities = {
    "MATH M1001": ent("Calculus I", ("A", "B")),          # live, untouched
    "OLD M1001": ent("Calculus II", ("A",)),              # ghost → MATH M1002 (no entry): rekey
    "ARC M1002": ent("Architectural Drawing I", ("A",)),  # ghost → ARCH M1039 via two maps: rekey (title variant)
    "ARC M1003": ent("Studio", ("A", "B", "C")),          # ghost → ARCH M1040 ; converges with ARC M1004
    "ARC M1004": ent("Studio Old", ("A", "B", "C", "D")),  # loser: title differs though more colleges
    "OLD M1009": ent("World History", ("A",)),            # ghost → HIST M1001 which HAS an entry: collision
    "HIST M1001": ent("World History", ("A", "B")),       # live
    "DEAD M1001": ent("Gone", ("A",)),                    # no map names it: dead
    "OLD M1010": ent("Nowhere", ("A",)),                  # maps to a non-live id: dead
}
maps = [
    {"OLD M1001": "MATH M1002", "ARC M1002": "ARCT M1002", "ARC M1003": "ARCH M1040", "ARC M1004": "ARCH M1040",
     "OLD M1009": "HIST M1001", "OLD M1010": "NOPE M1001"},
    {"ARCT M1002": "ARCH M1039"},
]
plan = idr.compute_plan(copy.deepcopy(identities), live, maps, title_of)

check("a ghost whose live id has no entry is re-keyed", plan["rekey"].get("OLD M1001") == "MATH M1002")
check("a two-map chain resolves (one lookup per map, in order)", plan["rekey"].get("ARC M1002") == "ARCH M1039")
check("a ghost landing on a key that already carries a live entry is dropped (the live entry wins)",
      plan["drop_collision"].get("OLD M1009") == "HIST M1001" and "OLD M1009" not in plan["rekey"])
check("on a convergence the title-agreeing ghost wins even against more colleges",
      plan["rekey"].get("ARC M1003") == "ARCH M1040" and plan["drop_converged"].get("ARC M1004") == "ARCH M1040"
      and plan["winner_basis"]["ARCH M1040"] == "title agrees with the catalog")
check("a key no map names again is dead; a key landing on a non-live id is dead",
      set(plan["drop_dead"]) == {"DEAD M1001", "OLD M1010"})
check("every ghost is dispositioned exactly once",
      plan["validation"]["V1_every_ghost_dispositioned"]["pass"] and plan["ghosts"] == 7)
check("title agreement is counted over the re-keys (Calculus II and Studio agree; Drawing I vs 1 differs)",
      plan["title_agree"] == 2 and [d[0] for d in plan["title_differ"]] == ["ARC M1002"])
check("hops are measured", plan["hops"] == {1: 5, 2: 1})
check("entries after = before - ghosts + rekeyed", plan["entries_after"] == 9 - 7 + 3)
check("all validations pass", all(v["pass"] for v in plan["validation"].values()))

new_ident, stats = idr.apply_plan(copy.deepcopy(identities), plan, "2026-09-04T00:00:00Z")
gates = idr.post_gates(identities, new_ident, plan, live)
for gname, ok in gates.items():
    check("gate: " + gname, ok)
check("a re-keyed entry carries its old key and its content", new_ident["MATH M1002"]["_identities_rekeyed_from"] == "OLD M1001"
      and new_ident["MATH M1002"]["title"] == "Calculus II")
check("the live entry on a collision is the one kept", new_ident["HIST M1001"] == identities["HIST M1001"])
check("ripple: 3 re-keyed, 4 dropped, 2 kept", stats["rekeyed"] == 3 and stats["dropped"] == 4 and stats["kept"] == 2)

# convergence tie-breaks: same titles → more colleges; same colleges → alphabetical
ids2 = {"G1 M1001": ent("Studio", ("A",)), "G2 M1001": ent("Studio", ("A", "B"))}
p2 = idr.compute_plan(ids2, {"ARCH M1040"}, [{"G1 M1001": "ARCH M1040", "G2 M1001": "ARCH M1040"}], title_of)
check("tie on title agreement → more colleges wins", p2["rekey"].get("G2 M1001") == "ARCH M1040" and p2["winner_basis"]["ARCH M1040"] == "more colleges offering")
ids3 = {"G1 M1001": ent("Studio", ("A",)), "G2 M1001": ent("Studio", ("B",))}
p3 = idr.compute_plan(ids3, {"ARCH M1040"}, [{"G1 M1001": "ARCH M1040", "G2 M1001": "ARCH M1040"}], title_of)
check("tie on title and colleges → alphabetical first wins", p3["rekey"].get("G1 M1001") == "ARCH M1040" and p3["winner_basis"]["ARCH M1040"] == "alphabetical first")

# ── the committed files ──────────────────────────────────────────────────────
def load(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return json.load(f)

art = load("kb/coci_articulations.json")
courses = load("kb/coci_minted_courses.json")["courses"]
singles = load("kb/coci_minted_singletons.json")["courses"]
rlive = set(courses) | set(singles)
rtitle = lambda i: (courses.get(i) or singles.get(i) or {}).get("common_title")
ident = art.get("identities") or {}
rplan = idr.compute_plan(ident, rlive, idr.load_maps(), rtitle)
check("committed files: every ghost dispositioned (%d ghosts)" % rplan["ghosts"], rplan["validation"]["V1_every_ghost_dispositioned"]["pass"])
rnew, rstats = idr.apply_plan(ident, rplan, "test")
rgates = idr.post_gates(ident, rnew, rplan, rlive)
check("committed files: the post-state passes every gate (after %d entries, all live)" % len(rnew), all(rgates.values()))
check("committed files: the receipt on disk (if present) matches the recomputed plan",
      (not os.path.exists(os.path.join(ROOT, "kb/identities_rekey_out"))) or all(
          (lambda d: {g: (v["action"], v["new_id"]) for g, v in d["aliases"].items()} ==
           dict({g: ("rekey", n) for g, n in rplan["rekey"].items()},
                **{g: ("drop_collision", n) for g, n in rplan["drop_collision"].items()},
                **{g: ("drop_converged", n) for g, n in rplan["drop_converged"].items()},
                **{g: ("drop_dead", None) for g in rplan["drop_dead"]}))(load(os.path.join("kb/identities_rekey_out", d, "alias_map.json")))
          for d in os.listdir(os.path.join(ROOT, "kb/identities_rekey_out"))
          if os.path.exists(os.path.join(ROOT, "kb/identities_rekey_out", d, "alias_map.json"))))
print("  committed: re-key %d · collision %d · converged %d · dead %d · after %d" % (
    len(rplan["rekey"]), len(rplan["drop_collision"]), len(rplan["drop_converged"]), len(rplan["drop_dead"]), len(rnew)))

passed = sum(1 for _, ok in results if ok)
print("\n%d/%d assertions passed" % (passed, len(results)))
sys.exit(0 if passed == len(results) and results else 1)
