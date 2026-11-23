#!/usr/bin/env python3
"""The scope re-mint dry run (kb/_scope_remint_dryrun.py, S710, #3655) on synthetic inputs, then on the committed data.

WHAT THIS GUARDS (each a way the plan would move an M-ID it should not, or onto a slot it must not take):
  (1) a ready one-code M-ID takes the settled code's prefix and that code's discipline, keeping its number when free;
  (2) a number already taken under the new prefix gap-fills, and never onto a slot an earlier re-mint vacated or one
      SkyView's layout draws (the S436 duplicate-point failure);
  (3) one college's one course under two local codes (same number and title) stays where it is; a split across
      different courses is held for a person, never planned;
  (4) a held M-ID (ready false) is never planned; a code settled to its own prefix stays; a code no single discipline
      holds is held;
  (5) on the committed data: every ready M-ID is accounted for, each new id is unique and free, and the plan never
      moves an id the gate holds.

Run from repo root: python3 tests/scope_remint_dryrun_test.py
"""
import importlib.util
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "kb"))

spec = importlib.util.spec_from_file_location("scope_remint", os.path.join(ROOT, "kb", "_scope_remint_dryrun.py"))
D = importlib.util.module_from_spec(spec)
spec.loader.exec_module(D)

FAILS = []


def check(name, cond, why=""):
    print(("PASS " if cond else "FAIL ") + name + ("" if cond or not why else "  [%s]" % why))
    if not cond:
        FAILS.append(name)


def mid(ready, codes, shape=None, members=1):
    return {"ready": ready, "codes": codes, "members": members,
            "shape": shape or ("one code" if len(codes) == 1 else "splits along code")}


SEED = {"Electricity": {"canonical_subj4": "ELEC"}, "Vocational": {"canonical_subj4": "VOCE"},
        "Twin A": {"canonical_subj4": "TWIN"}, "Twin B": {"canonical_subj4": "TWIN"}}
READINESS = {"scopes": {"t": {"college": "Cerritos College", "code": "AED", "by_mid": {
    "ELEC M90AA": mid(True, {"VOCE": 1}),
    "ELEC M90AB": mid(True, {"VOCE": 1}),
    "ELEC M90AC": mid(True, {"VOCE": 1}),
    "ELEC M9001": mid(True, {"ELEC": 1, "VOCE": 1}, members=2),
    "ELEC M9002": mid(True, {"ELEC": 1, "VOCE": 1}, members=2),
    "ELEC M9003": mid(False, {"VOCE": 1}),
    "ELEC M9004": mid(True, {"ELEC": 1}),
    "ELEC M9005": mid(True, {"TWIN": 1}),
}}}}
MEMBERS = {
    "ELEC M90AA": [{"college": "Cerritos College", "code": "AED 80.08", "title": "Elec Theory"}],
    "ELEC M90AB": [{"college": "Cerritos College", "code": "AED 90.04", "title": "Auto Tools"}],
    "ELEC M90AC": [{"college": "Cerritos College", "code": "AED 39.02", "title": "Painting"}],
    "ELEC M9001": [{"college": "Cerritos College", "code": "ELAP 90.08", "title": "Solar Energy"},
                   {"college": "Cerritos College", "code": "AED 90.08", "title": "Solar  energy"}],
    "ELEC M9002": [{"college": "Cerritos College", "code": "ELAP 90.09", "title": "Solar Panel Installation"},
                   {"college": "Cerritos College", "code": "AED 41.04", "title": "IW Architectural III"}],
    "ELEC M9003": [{"college": "Cerritos College", "code": "AED 1", "title": "Held"}],
    "ELEC M9004": [{"college": "Cerritos College", "code": "AED 2", "title": "Own prefix"}],
    "ELEC M9005": [{"college": "Cerritos College", "code": "AED 3", "title": "Twin"}],
}
SINGLETONS = {k: {"course_id": k, "common_title": MEMBERS[k][0]["title"], "discipline": "Electricity"}
              for k in MEMBERS}
SINGLETONS["VOCE M90AB"] = {"course_id": "VOCE M90AB", "discipline": "Vocational"}   # live: M90AB taken
VACATED = {"VOCE M90AC"}                                                            # an earlier map's slot
DRAWN = {"VOCE M90AE"}                                                              # SkyView still draws it

plan = D.compute_plan("t", READINESS, MEMBERS, {}, SINGLETONS, {}, SEED, {}, vacated=VACATED, drawn=DRAWN)
mv, st, hd = plan["moves"], plan["stays"], plan["held"]

# (1)
check("(1) a free number is kept under the settled code", mv.get("ELEC M90AA", {}).get("new_id") == "VOCE M90AA",
      mv.get("ELEC M90AA"))
check("(1) the discipline follows the code", mv.get("ELEC M90AA", {}).get("discipline") == "Vocational")
# (2)
taken = {v["new_id"] for v in mv.values()}
check("(2) a live key gap-fills", mv.get("ELEC M90AB", {}).get("how") == "gap-filled"
      and mv["ELEC M90AB"]["new_id"] != "VOCE M90AB")
check("(2) a vacated slot is never taken", "VOCE M90AC" not in taken, sorted(taken))
check("(2) a slot SkyView draws is never taken", "VOCE M90AE" not in taken, sorted(taken))
check("(2) new ids are unique", len(taken) == len(mv))
# (3)
check("(3) a cross-listed pair stays", "ELEC M9001" in st and "cross-listed" in st["ELEC M9001"]["why"])
check("(3) a split across two courses is held, not planned", "ELEC M9002" in hd and "ELEC M9002" not in mv)
# (4)
check("(4) an M-ID the gate holds is never planned", all("ELEC M9003" not in x for x in (mv, st, hd)))
check("(4) a code settled to its own prefix stays", "ELEC M9004" in st and "ELEC M9004" not in mv)
check("(4) a code two disciplines claim is held", "ELEC M9005" in hd)
check("(4) every check passes on the synthetic plan", all(v["pass"] for v in plan["validation"].values()),
      {k: v for k, v in plan["validation"].items() if not v["pass"]})

# (5) the committed data
readiness, seed, members, docs, reservations, vacated, drawn = D.load_inputs()
for scope, sc in readiness["scopes"].items():
    p = D.compute_plan(scope, readiness, members, docs["courses"]["courses"], docs["singletons"]["courses"],
                       docs["curation"]["curations"], seed, reservations, vacated=vacated, drawn=drawn)
    ready = {k for k, v in sc["by_mid"].items() if v.get("ready")}
    check("(5) %s: every check passes" % scope, all(v["pass"] for v in p["validation"].values()),
          {k: v for k, v in p["validation"].items() if not v["pass"]})
    check("(5) %s: the plan moves only ready M-IDs" % scope, set(p["moves"]) <= ready)
    check("(5) %s: no new id lands on a vacated or drawn slot" % scope,
          not ({v["new_id"] for v in p["moves"].values()} & (set(vacated) | set(drawn))))

print("\n%d failed" % len(FAILS) if FAILS else "\nall passed")
sys.exit(1 if FAILS else 0)
