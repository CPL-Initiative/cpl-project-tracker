#!/usr/bin/env python3
"""A college's subject code history (kb/subject_code_history.py; Sam, 2026-11-23: "do we have a correct way of
documenting the formerly codes and titles? it happens all the time...", then "yes, build it").

WHAT THIS GUARDS:
  (1) every committed history file passes --check: it names its college, its slug, and every change's source and
      recorder, and no code is renamed twice or in a cycle;
  (2) resolve follows a rename, and a chain of renames, by slug or by college, and leaves any other code as it is;
  (3) a title change alone (ECE was Child Development) is kept apart from the renames;
  (4) the check refuses a change with no source, a code renamed twice and a cycle;
  (5) the statewide list counts a renamed code's courses under the new code at that college: Clovis's ANTHRO pair
      is under ANTH, and its COTR and WKEXP courses are one pair.
Run from repo root: python3 tests/subject_code_history_test.py
"""
import json
import os
import shutil
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import subject_code_history as H  # noqa: E402

FAILS = []


def check(name, cond):
    print(("PASS " if cond else "FAIL ") + name)
    if not cond:
        FAILS.append(name)


check("(1) every committed history file passes the check", H.check(ROOT) == [])
hist = H.load(ROOT)
check("(2) a rename resolves by slug", H.resolve(hist, "clovis_community", "anthro") == "ANTH")
check("(2) a rename resolves by college", H.resolve(hist, "clovis community college", "COTR", by="by_college") == "WKEXP")
check("(2) any other code comes back as it is", H.resolve(hist, "clovis_community", "ART") == "ART" and H.resolve(hist, "nowhere", "PSY") == "PSY")
check("(3) a title change alone is kept apart from the renames", "ECE" not in hist["by_slug"]["clovis_community"]
      and hist["titles"]["clovis_community"]["ECE"][0]["from_title"] == "Child Development")

root = tempfile.mkdtemp()
try:
    d = os.path.join(root, H.DIR)
    os.makedirs(d)
    base = {"catalog_year": "2026-2027", "printed": "x", "source": "y", "recorded_by": "Sam", "recorded_at": "2026-11-23",
            "from_title": "A", "to_title": "A"}

    def write(changes):
        with open(os.path.join(d, "alpha.json"), "w") as f:
            json.dump({"college": "Alpha College", "slug": "alpha", "changes": [dict(base, **c) for c in changes]}, f)

    write([{"from_code": "AA", "to_code": "BB"}, {"from_code": "BB", "to_code": "CC"}])
    check("(2) a chain of renames resolves to its end", H.resolve(H.load(root), "alpha", "AA") == "CC" and H.check(root) == [])
    write([{"from_code": "AA", "to_code": "BB", "source": ""}])
    check("(4) a change with no source is refused", any("lacks source" in p for p in H.check(root)))
    write([{"from_code": "AA", "to_code": "BB"}, {"from_code": "AA", "to_code": "CC"}])
    check("(4) a code renamed twice is refused", any("renamed twice" in p for p in H.check(root)))
    write([{"from_code": "AA", "to_code": "BB"}, {"from_code": "BB", "to_code": "AA"}])
    check("(4) a cycle is refused, and resolve stops", any("cycle" in p for p in H.check(root)) and H.resolve(H.load(root), "alpha", "AA") in ("AA", "BB"))
finally:
    shutil.rmtree(root)

sw = json.load(open(os.path.join(ROOT, "kb", "status", "statewide_subject_codes.json")))
by = {c["code"]: c for c in sw["codes"]}
at = lambda code: [x for x in (by.get(code) or {}).get("colleges", []) if x[0] == "Clovis Community College"]
check("(5) ⭐ Clovis's ANTHRO courses count under ANTH, never under ANTHRO", at("ANTH") and not at("ANTHRO") and "ANTHRO" in by["ANTH"]["spellings"])
check("(5) ⭐ Clovis's COTR and WKEXP courses are one pair", len(at("WKEXP")) == 1 and not at("COTR"))
check("(5) the list names the code history among its sources", sw["_sources"].get("code_history") == "kb/reference/subject_code_history")

print(("FAILED " + str(len(FAILS))) if FAILS else "all passed")
sys.exit(1 if FAILS else 0)
