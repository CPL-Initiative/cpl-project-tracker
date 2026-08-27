#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""`ppa` — APPLIED units among portal-origin students — generator-side checks.

Sam, 2026-08-27, on how the Access metric should be scored today:

    "we need to read the 'Potential Student', which returns either 'Yes' or
     'No' and is our temporary field indicating it was submitted from a landing
     page or the portal ... count every instance of Yes in 'Potential Student'
     field as meeting these metrics."

THE FINDING THIS EXISTS TO PIN, because it inverts the obvious fix. Every other
metric in the builder carries `and not is_potential` — pe / pa / p2 / p3 all
DESCRIBE THE DOCUMENTED COHORT AND EXCLUDE portal-origin students. `pp` was the
only measure of that population and it is gated on TRANSCRIBED credit. So:

  * there was no applied-among-portal-origin figure at all, and
  * scoring the Access priority on `pa` would have measured precisely the
    students the metric's own wording excludes.

`pa` and `ppa` are therefore DISJOINT cohorts, not a superset and a subset. A
future session "simplifying" one into a filter of the other would silently swap
the population under an $8M priority, so the disjointness is asserted directly.

Run: python3 tests/funding_portal_applied_test.py
"""
import json
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
BUILDER = os.path.join(ROOT, "funding", "_build_funding_performance.py")
VIEW = "View_StudentAggregatedValues_APIDataset"
COLLEGE = "Bakersfield College"
FUNDING_NAME = "Bakersfield"
COLUMNS = ["College", "Catalog Year", "Applied Credits", "Eligible Credits",
           "Transcribed Credits", "MAP Internal StudentID",
           "Potential Student", "Test Student"]

failures = []
checks = [0]


def check(label, cond, detail=""):
    checks[0] += 1
    if cond:
        print(f"PASS  {label}")
    else:
        print(f"FAIL  {label}" + (f"  — {detail}" if detail else ""))
        failures.append(label)


def row(sid, ecr, acr, tcr, potential="", test=""):
    return [COLLEGE, "2025-2026", str(acr), str(ecr), str(tcr),
            sid, potential, test]


def run_builder(rows, columns=None):
    payload = [{"viewName": VIEW, "generatedAt": "2026-08-27T00:00:00+00:00",
                "columnName": list(columns or COLUMNS), "columnValue": rows}]
    with tempfile.TemporaryDirectory() as td:
        src = os.path.join(td, "CustomReport_latest.json")
        out = os.path.join(td, "out.js")
        with open(src, "w", encoding="utf-8") as f:
            json.dump(payload, f)
        proc = subprocess.run([sys.executable, BUILDER, src, "--out", out],
                              capture_output=True, text=True, cwd=td)
        if proc.returncode != 0:
            raise AssertionError(f"builder exited {proc.returncode}\n{proc.stderr}")
        text = open(out, encoding="utf-8").read()
    return json.loads(text[text.index("{"):text.rindex("};") + 1])


def main():
    # Three portal-origin students with APPLIED credit (the cohort Sam named),
    # three documented students with applied credit, one portal student with
    # only transcribed credit (pp but not ppa), one test student (excluded).
    rows = []
    for sid, acr in (("p1", 10), ("p2", 20), ("p3", 30)):
        rows.append(row(sid, ecr=40, acr=acr, tcr=0, potential="Yes"))
    for sid, acr in (("d1", 5), ("d2", 7), ("d3", 9)):
        rows.append(row(sid, ecr=40, acr=acr, tcr=0))
    rows.append(row("p4", ecr=0, acr=0, tcr=6, potential="Yes"))
    rows.append(row("t1", ecr=99, acr=99, tcr=99, potential="Yes", test="Yes"))
    p = run_builder(rows)
    st = p["statewide"]
    col = p["colleges"][FUNDING_NAME]

    check("ppa counts the three portal-origin students with applied credit",
          st.get("ppa") == 3, f"got {st.get('ppa')}")
    check("ppa_u sums THEIR applied units only (10+20+30)",
          abs(st.get("ppa_u", 0) - 60) < 1e-6, f"got {st.get('ppa_u')}")

    # The finding: pa is the COMPLEMENT, not the superset.
    check("pa excludes portal-origin students entirely (3 documented only)",
          st.get("pa") == 3, f"got {st.get('pa')}")
    check("pa_u carries only the documented cohort's units (5+7+9)",
          abs(st.get("pa_u", 0) - 21) < 1e-6, f"got {st.get('pa_u')}")
    check("pa and ppa are DISJOINT — neither contains the other",
          st.get("pa") == 3 and st.get("ppa") == 3 and
          abs(st.get("pa_u", 0) - st.get("ppa_u", 0)) > 1e-6)

    # ppa is applied-gated, pp is transcribed-gated: same cohort, different rung.
    check("pp counts the portal student with transcribed credit, not the applied ones",
          st.get("pp") == 1, f"got {st.get('pp')}")
    check("ppa does NOT count a portal student with zero applied credit",
          st.get("ppa") == 3)

    check("the test student is excluded from ppa",
          abs(st.get("ppa_u", 0) - 60) < 1e-6)
    check("per-college ppa matches statewide for a single-college fixture",
          col.get("ppa") == 3 and abs(col.get("ppa_u", 0) - 60) < 1e-6)

    # Suppression: ppa rides with pp, so a small portal cohort still earns.
    small = [row("s1", ecr=0, acr=4, tcr=0, potential="Yes")]
    p2 = run_builder(small)
    c2 = p2["colleges"][FUNDING_NAME]
    check("a 1-student ppa cell is NOT <5-suppressed (it would read as $0 earned)",
          c2.get("ppa") == 1 and not c2.get("ppa_suppressed"),
          f"got {c2.get('ppa')} suppressed={c2.get('ppa_suppressed')}")

    # OMIT, DON'T ZERO — the rule pa already follows.
    cols = [c for c in COLUMNS if c != "Applied Credits"]
    rows_no_acr = [[r[0], r[1], r[3], r[4], r[5], r[6], r[7]] for r in rows]
    p3o = run_builder(rows_no_acr, columns=cols)
    check("with no Applied Credits column, ppa is ABSENT rather than zero",
          "ppa" not in p3o["statewide"] and "ppa_u" not in p3o["statewide"],
          f"got {[k for k in p3o['statewide'] if k.startswith('ppa')]}")

    check("the published basis names ppa and says it is not a subset of pa",
          "PPA" in p["basis"] and "disjoint" in p["basis"].lower())

    print(f"\n{checks[0] - len(failures)}/{checks[0]} checks passed")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
