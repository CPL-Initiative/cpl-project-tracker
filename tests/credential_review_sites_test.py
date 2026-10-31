"""The credential panel's training sites (the Exhibits tab, Sheet 147's order, step 2).

Sam, 2026-10-30: "could be multiple training sites"; "would want to be able to set and change both
issuer and training site from here". The panel saves training_sites_override (a JSON list of
{site, college}) and training_agency_override (the sites joined) under _CREDENTIAL_REVIEW::<title>.
kb/_apply_credential_review.py decides which of the two stands and exhibits.js decides the same way,
so this test runs one table of cases through both.

  - parse_sites drops blanks and repeats, folds spaces, and reads anything but a list as None;
  - resolve_sites keeps the list unless a later one-trainer edit says something else;
  - Mode A3 fills an empty trainer with the list's first site, never with the joined text, and never
    overwrites a trainer already on the record;
  - the bake emits `trainers` from the resolved list.

Run from repo root: python3 tests/credential_review_sites_test.py
"""
import importlib.util
import json
import os
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("acr", os.path.join(ROOT, "kb", "_apply_credential_review.py"))
A = importlib.util.module_from_spec(spec)
spec.loader.exec_module(A)

results = []


def check(name, cond, detail=""):
    results.append((name, bool(cond), detail))


L = json.dumps
check("parse_sites folds spaces, drops blanks and repeats, keeps order and colleges",
      A.parse_sites(L([{"site": " A  B "}, {"site": ""}, {"site": "A B"}, {"site": "C", "college": "Norco College"}, "x"]))
      == [{"site": "A B"}, {"site": "C", "college": "Norco College"}])
check("parse_sites reads a value that is not a list as None", A.parse_sites("{}") is None and A.parse_sites("nope") is None
      and A.parse_sites(None) is None)
check("parse_sites reads an empty list as no sites", A.parse_sites("[]") == [])
check("join_sites names each site once", A.join_sites([{"site": "A"}, {"site": "A", "college": "X"}, {"site": "B"}]) == "A; B")

# One table of cases, run through Python here and through exhibits.js below.
CASES = [
    ("no list", {"training_agency_override": "A"}, {}, None),
    ("the panel's save: the list and its joined text, the trainer a moment later",
     {"training_sites_override": L([{"site": "A", "college": "Norco College"}, {"site": "B"}]), "training_agency_override": "A; B"},
     {"training_sites_override": "2026-10-31T01:00:00.100+00:00", "training_agency_override": "2026-10-31T01:00:00.300+00:00"},
     [{"site": "A", "college": "Norco College"}, {"site": "B"}]),
    ("a later, different one-trainer edit stands the list down",
     {"training_sites_override": L([{"site": "A"}]), "training_agency_override": "Z"},
     {"training_sites_override": "2026-10-01", "training_agency_override": "2026-10-20"}, None),
    ("an older, different trainer leaves the list standing",
     {"training_sites_override": L([{"site": "A"}]), "training_agency_override": "Z"},
     {"training_sites_override": "2026-10-20", "training_agency_override": "2026-10-01"}, [{"site": "A"}]),
    ("an empty list stands: no site named", {"training_sites_override": "[]", "training_agency_override": ""},
     {"training_sites_override": "2", "training_agency_override": "3"}, []),
    ("a malformed list is ignored", {"training_sites_override": "{\"site\": \"A\"}"}, {}, None),
]
for name, entry, stamps, want in CASES:
    got = A.resolve_sites(entry, stamps)
    check("resolve_sites: " + name, got == want, repr(got))

# exhibits.js answers the same table.
node = r"""
const fs = require("fs");
global.window = {}; global.document = {};
new Function(fs.readFileSync(process.argv[1], "utf8"))();
const M = window.CPL_EXHIBITS;
const cases = JSON.parse(process.argv[2]);
console.log(JSON.stringify(cases.map(function (c) {
  const e = c[0], st = c[1];
  return M._resolveSites({ sites: e.training_sites_override, sitesAt: st.training_sites_override,
    trainer: e.training_agency_override, trainerAt: st.training_agency_override });
})));
"""
r = subprocess.run(["node", "-e", node, os.path.join(ROOT, "exhibits.js"),
                    json.dumps([[e, s] for _, e, s, _ in CASES])], capture_output=True, text=True, timeout=60)
try:
    js = json.loads(r.stdout)
except ValueError:
    js = None
check("exhibits.js runs the same cases", js is not None, r.stderr[-300:])
for (name, _, _, want), got in zip(CASES, js or []):
    check("exhibits.js agrees: " + name, got == want, repr(got))

# Mode A3: the first site fills an empty trainer; the joined text never lands; a trainer on file stays.
with tempfile.TemporaryDirectory() as tmp:
    cr_path = os.path.join(tmp, "credentials.json")
    cr = {
        "IBEW Electrician Apprenticeship": [{"issuing_agency": "IBEW", "training_agency": None, "reviewed_by": None}],
        "Medical Core": [{"issuing_agency": "Canyon High School", "training_agency": "Canyon High School", "reviewed_by": "map@rccd.edu"}],
        "Old Style": [{"issuing_agency": "X", "training_agency": None, "reviewed_by": None}],
        "Cleared": [{"issuing_agency": "Y", "training_agency": None, "reviewed_by": None}],
    }
    with open(cr_path, "w", encoding="utf-8") as f:
        json.dump(cr, f)
    A.CR_PATH = cr_path
    overrides = {
        "IBEW Electrician Apprenticeship": {"training_agency_override": "Kern JATC; Inland JATC",
                                            "training_sites": [{"site": "Kern JATC", "college": "Bakersfield College"}, {"site": "Inland JATC"}],
                                            "reviewed_by": "reviewer@example.org", "reviewed_at": "2026-10-31T01:00:00Z"},
        "Medical Core": {"training_agency_override": "Orange High School; Canyon High School",
                         "training_sites": [{"site": "Orange High School"}, {"site": "Canyon High School"}]},
        "Old Style": {"training_agency_override": "Plain Site"},
        "Cleared": {"training_agency_override": "", "training_sites": []},
        "Not A Credential Yet": {"training_sites": [{"site": "Somewhere"}]},
    }
    fills, missing = A.promote_trainers(overrides)
    with open(cr_path, encoding="utf-8") as f:
        after = json.load(f)
check("A3 fills an empty trainer with the list's first site, never the joined text",
      after["IBEW Electrician Apprenticeship"][0]["training_agency"] == "Kern JATC", after["IBEW Electrician Apprenticeship"])
check("A3 never overwrites a trainer already on the record", after["Medical Core"][0]["training_agency"] == "Canyon High School")
check("A3 still fills from a one-trainer edit with no list", after["Old Style"][0]["training_agency"] == "Plain Site")
check("A3 fills nothing from an empty list", after["Cleared"][0]["training_agency"] is None)
check("A3 names a title not yet in the reference as missing", missing == ["Not A Credential Yet"], missing)
check("A3 reports what it filled", [f["title"] for f in fills] == ["IBEW Electrician Apprenticeship", "Old Style"], fills)

# The bake: `trainers` comes from the resolved list (the overlay's training_sites).
src = open(os.path.join(ROOT, "excel_to_dashboard.py"), encoding="utf-8").read()
check("the bake carries the resolved list as trainers", 'row["trainers"] = ov["training_sites"]' in src)
check("the bake lists a credential's record sites when it has more than one",
      '**({"trainers": trainer_all} if len(trainer_all) > 1 else {})' in src)

failed = [r for r in results if not r[1]]
for name, ok, detail in results:
    print(("PASS " if ok else "FAIL ") + name + ("" if ok or not detail else "  " + detail))
print(f"\n{len(results) - len(failed)}/{len(results)} checks passed")
sys.exit(1 if failed else 0)
