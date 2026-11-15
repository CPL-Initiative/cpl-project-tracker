#!/usr/bin/env python3
"""tests/cdc_sharing_build_test.py — kb/_build_cdc_sharing.py's rules, one fixture each (S654).

The builder's --check runs on the live hand-kept files in tests/commons_data_sharing.test.js; that proves the live
files sound, never that a rule bites. Here each rule is broken in a small fixture repo of its own, and the builder
must exit 1 and name the fault in words. A non-object row is a problem, never an AttributeError.

  (0)  a sound fixture builds and then reads current;
  (1)  a join key id defined twice;
  (2)  no element at all;
  (3)  a per-college slug that is no college in the identity crosswalk;
  (4)  evidence outside the repo (an absolute path, ../);
  (5)  an element row that is not an object;
  (6)  a class that says the public site does not serve its fields, for a file the Pages allowlist publishes;
  (7)  a source file the repo does not hold;
  (7)  ... and a source file outside the repo, a directory, or not a string;
  (8)  a missing registry, with its stale output left behind;
  (9)  held roles that are not a list of names;
  (10) a row of a class the site never serves (restricted, or agreement) that names a published file or no place.

Run from repo root: python3 tests/cdc_sharing_build_test.py
"""
import atexit
import copy
import json
import os
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILDER = os.path.join(ROOT, "kb", "_build_cdc_sharing.py")

DICT = {
    "schema": 1, "about": "fixture", "updated": "2026-11-15",
    "classes": {
        "public": {"word": "Public", "definition": "Published.", "public_site": "may serve"},
        "aggregate": {"word": "Aggregate, not PII", "definition": "Counts.", "public_site": "may serve"},
        "agreement": {"word": "Needs an agreement", "definition": "Under an agreement.", "public_site": "does not serve"},
        "held": {"word": "Held for the team", "definition": "For the team.", "public_site": "may serve"},
        "restricted": {"word": "Restricted", "definition": "Never served.", "public_site": "does not serve"},
    },
    "systems": {"cobi": {"name": "COBI", "holder": "The team"}},
    "elements": [
        {"id": "a", "name": "Field A", "labels": ["A"], "definition": "A field.", "system": "cobi", "class": "held",
         "source_file": "kb/status/served.json", "join_key": "k1"},
        {"id": "b", "name": "Field B", "labels": ["B"], "definition": "B field.", "system": "cobi", "class": "agreement",
         "source_file": "kb/private.csv"},
    ],
    "held_not_shown": [{"id": "roster", "name": "A roster", "definition": "Staff.", "system": "cobi", "class": "restricted",
                        "where": "a gated table", "outside_share": "Never.", "lives_in": ["table:a_roster"]}],
    "join_keys": [{"id": "k1", "name": "Key one", "definition": "Joins.", "public_side": "One", "other_side": "Two",
                   "other_class": "agreement"}],
    "agreements": [{"id": "ag", "name": "An agreement", "parties": "Two parties", "status": "not recorded", "covers": "Things."}],
    "containers": [],
}
REG = {
    "schema": 1, "updated": "2026-11-15",
    "statuses": {"live": "x", "in progress": "x", "proposed": "x", "not started": "x"},
    "roles": {"r": "A role"},
    "integrations": [
        {"id": "s", "name": "Statewide", "scope": "statewide", "status": "live", "replaces": "x", "owner": "r",
         "agreement": "ag", "evidence": ["kb/status/served.json"]},
        {"id": "p", "name": "Per college", "scope": "per_college", "status": "proposed", "replaces": "x", "owner": "r"},
    ],
    "per_college": {"default": [{"integration": "p", "state": "none known"}], "colleges": {}},
}
CROSSWALK = {"colleges": [{"college_id": 1, "college_name": "Fixture College"}]}


def repo(d, r, extra=None):
    t = tempfile.mkdtemp(prefix="cdc_build_")
    atexit.register(shutil.rmtree, t, True)
    files = {
        "kb/cdc_data_dictionary.json": json.dumps(d),
        ".github/pages_allowlist.txt": "# fixture\npublish kb/status\nwithhold kb/private.csv\n",
        "kb/status/served.json": "{}\n",
        "kb/private.csv": "a\n",
        "kb/college_identity/2026-01-01/crosswalk.json": json.dumps(CROSSWALK),
        "docs/reference/.keep": "",
    }
    if r is not None:
        files["kb/cdc_integrations.json"] = json.dumps(r)
    files.update(extra or {})
    for rel, text in files.items():
        p = os.path.join(t, rel)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        with open(p, "w", encoding="utf-8") as f:
            f.write(text)
    return t


def run(root, check=True):
    args = [sys.executable, "-I", BUILDER, "--root", root] + (["--check"] if check else [])
    p = subprocess.run(args, capture_output=True, text=True)
    return p.returncode, p.stdout + p.stderr


results = []


def expect(name, d, r, needle, extra=None):
    root = repo(d, r, extra)
    rc, out = run(root)
    ok = rc == 1 and needle in out and "Traceback" not in out
    results.append((name, ok, "" if ok else "rc=%s; %s" % (rc, out.strip()[-300:])))


# (0) a sound fixture builds, then reads current.
root = repo(DICT, REG)
rc1, out1 = run(root, check=False)
rc2, out2 = run(root, check=True)
results.append(("(0) a sound fixture builds and then reads current", rc1 == 0 and rc2 == 0 and "(current)" in out2,
                out1 + out2))

d = copy.deepcopy(DICT)
d["join_keys"].append(dict(d["join_keys"][0]))
expect("(1) a join key id defined twice is named", d, REG, "join key id k1 is defined twice")

d = copy.deepcopy(DICT)
d["elements"] = []
expect("(2) a file with no element is named", d, REG, "elements lists no field")

r = copy.deepcopy(REG)
r["per_college"]["colleges"] = {"no-such-college": [{"integration": "p", "state": "connected"}]}
expect("(3) a per-college slug outside the crosswalk is named", DICT, r, "'no-such-college', which is no college's slug")
r = copy.deepcopy(REG)
r["per_college"]["colleges"] = {"fixture-college": [{"integration": "p", "state": "connected"}]}
root = repo(DICT, r)
rc, out = run(root, check=False)
results.append(("(3) a slug the crosswalk holds passes", rc == 0, out))

for bad in ("/etc/passwd::root", "../../../etc/hostname"):
    r = copy.deepcopy(REG)
    r["integrations"][0]["evidence"] = [bad]
    expect("(4) evidence outside the repo (%s) is never evidence" % bad, DICT, r, "cites evidence %r" % bad)

d = copy.deepcopy(DICT)
d["elements"].append("not an object")
expect("(5) a non-object element is a problem, never an AttributeError", d, REG, "elements row 3 is str, not an object")

d = copy.deepcopy(DICT)
d["elements"][1]["source_file"] = "kb/status/served.json"
expect("(6) a class that does not serve, on a file the allowlist publishes, is named", d, REG,
       "element b is class agreement, which the public site does not serve")
root = repo(DICT, REG)
rc, out = run(root, check=False)
results.append(("(6) the same class on a withheld file passes", rc == 0, out))

d = copy.deepcopy(DICT)
d["elements"][0]["source_file"] = "kb/status/gone.json"
expect("(7) a source file the repo does not hold is named", d, REG, "names source file 'kb/status/gone.json'")

for bad in ("../../../etc/hostname", "/etc/hostname", "kb"):
    d = copy.deepcopy(DICT)
    d["elements"][0]["source_file"] = bad
    expect("(7) a source file outside the repo or a directory (%s) is named" % bad, d, REG, "names source file %r" % bad)
d = copy.deepcopy(DICT)
d["elements"][0]["source_file"] = 7
expect("(7) a source file that is not a string is a problem, never a TypeError", d, REG, "has source_file 7")
r = copy.deepcopy(REG)
r["integrations"][0]["evidence"] = ["kb"]
expect("(4) a directory is never evidence", DICT, r, "cites evidence 'kb'")
d = copy.deepcopy(DICT)
d["held_not_shown"][0]["lives_in"] = ["table:a_roster", "file:kb/status/served.json"]
expect("(10) a restricted row naming a file the allowlist publishes is named", d, REG,
       "held item roster is class restricted, which the public site does not serve, but .github/pages_allowlist.txt publishes kb/status/served.json")
d = copy.deepcopy(DICT)
del d["held_not_shown"][0]["lives_in"]
expect("(10) a restricted row that names no table or file is named", d, REG, "held item roster is class restricted")
d = copy.deepcopy(DICT)
d["held_not_shown"][0]["lives_in"] = ["somewhere"]
expect("(10) a lives_in entry that is neither table: nor file: is named", d, REG, "has lives_in entry 'somewhere'")
d = copy.deepcopy(DICT)
d["held_not_shown"][0]["lives_in"] = ["file:kb/private.csv"]
root = repo(d, REG)
rc, out = run(root, check=False)
results.append(("(10) a restricted row in a withheld file passes", rc == 0, out))
root = repo(DICT, REG)
rc, out = run(root, check=False)
results.append(("(10) a held status field naming a published file passes (element a, kb/status/served.json)",
                rc == 0 and "2 rows the site never serves checked" in out, out))

d = copy.deepcopy(DICT)
d["held_not_shown"] = [{"id": "h", "name": "H", "definition": "x", "where": "x", "outside_share": "x", "system": "cobi",
                        "class": "held", "roles": "CEO"}]
expect("(9) held roles must be a list of names", d, REG, "has roles 'CEO'")

root = repo(DICT, REG)
run(root, check=False)
os.remove(os.path.join(root, "kb", "cdc_integrations.json"))
rc, out = run(root, check=True)
results.append(("(8) a missing registry fails --check while its output is left behind",
                rc == 1 and "kb/cdc_integrations.json is missing" in out, out))

fails = [r for r in results if not r[1]]
for name, ok, why in results:
    print(("  ok   " if ok else "  FAIL ") + name + ("" if ok else "\n       " + why))
print("\n%d/%d checks passed" % (len(results) - len(fails), len(results)))
sys.exit(1 if fails else 0)
