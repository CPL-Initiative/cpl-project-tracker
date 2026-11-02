#!/usr/bin/env python3
"""The credential reference's statewide flag counts the Fact Sheet's statewide set.

Sam, 2026-11-01: "count all canonical exhibit titles that include a statewide as
based on a statewide, whether local or not." The reference's flag read only
articulation lines and marked 84 credentials where MAP's CCC Collaborative
exhibits with a recommendation name 152 (the Fact Sheet and the Exhibits List's
Basis column). excel_to_dashboard.py now seeds the flag from
fact-sheet/_build_statewide_recs.py's own build().

  1. A fixture: a CCC group with a recommendation counts; a CCC group with none
     and a local group with one do not (Sam, 2026-10-30: "Exhibits need at
     least one credit recommendation to show here").
  2. The committed files: every statewide title the reference carries as a row
     is flagged, and _stats.statewide_titles counts the flagged rows.

Run from the repo root: python3 tests/credential_reference_statewide_basis_test.py
"""
import json
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import excel_to_dashboard as gen  # noqa: E402

failures, checks = [], [0]


def check(label, cond, detail=""):
    checks[0] += 1
    if not cond:
        failures.append(f"{label}: {detail}")


def write_js(path, glob, doc):
    with open(path, "w", encoding="utf-8") as f:
        f.write(f"window.{glob} = " + json.dumps(doc) + ";\n")


def read_js(path):
    s = open(path, encoding="utf-8").read()
    return json.loads(s[s.index("{"):].rstrip().rstrip(";"))


# 1. The fixture.
with tempfile.TemporaryDirectory() as d:
    rec = [{"credit": "3 units in Introduction to Fire Technology", "cid": "", "eids": ["X1"]}]
    write_js(os.path.join(d, "statewide_data.js"), "CPL_STATEWIDE", {"exhibits": [
        {"unified_title": "With a statewide recommendation", "collaborative_type": "CCC Collaborative",
         "exhibit_ids": ["X1"], "authoritative_recs": rec},
        {"unified_title": "Statewide, no recommendation", "collaborative_type": "CCC Collaborative",
         "exhibit_ids": ["X2"], "authoritative_recs": []},
        {"unified_title": "Local with a recommendation", "collaborative_type": "Local",
         "exhibit_ids": ["X3"], "authoritative_recs": rec},
    ]})
    got = gen._statewide_basis_titles(d)
    check("fixture: only the CCC group with a recommendation", got == {"With a statewide recommendation"}, repr(got))

# 2. The committed files, regenerated into a scratch directory.
basis = gen._statewide_basis_titles()
check("committed statewide set is not empty", len(basis) > 0, "statewide_data.js gave no titles")
with tempfile.TemporaryDirectory() as d:
    os.environ["UC_OUT_DIR"] = d
    try:
        gen.export_credential_reference()
    finally:
        del os.environ["UC_OUT_DIR"]
    doc = read_js(os.path.join(d, "credential_reference_data.js"))
    rows = next(v for v in doc.values() if isinstance(v, list) and v and isinstance(v[0], dict) and "ut" in v[0])
    unflagged = sorted(r["ut"] for r in rows if r["ut"] in basis and not r.get("statewide"))
    check("every statewide title the reference carries is flagged", not unflagged,
          f"{len(unflagged)} read as local, e.g. {unflagged[:3]}")
    flagged = sum(1 for r in rows if r.get("statewide"))
    check("_stats.statewide_titles counts the flagged rows",
          doc["_stats"]["statewide_titles"] == flagged, f'{doc["_stats"]["statewide_titles"]} vs {flagged}')
    in_rows = len(basis & {r["ut"] for r in rows})
    check("the flag reaches past the articulation lines", flagged >= in_rows, f"{flagged} < {in_rows}")

if failures:
    print(f"FAIL {len(failures)} of {checks[0]}")
    for f in failures:
        print("  -", f)
    sys.exit(1)
print(f"ok {checks[0]} checks: the reference flags {flagged} statewide titles ({len(basis)} in the Fact Sheet's set)")
