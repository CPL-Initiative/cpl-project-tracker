#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Origination feed (`LocID2` -> nc_* + the `origination` block) — builder checks.

The N2 b gate (Sam, ruled 2026-08-31): the noncredit-only institutions draw
ONLY as CPL originating from them posts at a credit college — no advances — so
the origination feed is the gate between those campuses and any funding. The
field contract is the Malone/Pedro instructions doc (CPLBrain
04-projects/cpl-initiative/20260831_MAP_Custom_Reports_Origination_Data_
Instructions.md): `Origin` + `LocID2` on the pulled views, LocID2 NULL when
unknown and NEVER defaulted or guessed.

What this pins, in order of how expensive each would be to get wrong:

  1. ABSENT, NOT ZERO. Without the LocID2 column there is no `origination`
     block and no nc_* key anywhere — srcDelivered() in cpl_funding.js asks
     the artifact for the key, and an emitted zero would flip the noncredit
     shares from the honest "no feed yet" $0 to a measured "posted nothing"
     $0. (The `pa` rule, applied to money that moves on it.)
  2. SCOPE IS RULED, NOT GEOMETRIC. NOCE/SDCCE origination counts only where
     it lands among their district's credit colleges; Calbright's counts
     statewide. The in_scope figures are computed at the student grain so a
     <5-suppressed matrix cell never subtracts from the total the earn-out
     reads.
  3. NEVER GUESSED. An unresolvable LocID2 value surfaces in
     unmatched_origins and moves no measure — a wrong origin misdirects
     funding, not just analytics.

Run: python3 tests/funding_origination_test.py
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
COLUMNS = ["College", "Catalog Year", "Applied Credits", "Eligible Credits",
           "Transcribed Credits", "MAP Internal StudentID",
           "Potential Student", "Test Student", "Origin", "LocID2"]

failures = []
checks = [0]


def check(label, cond, detail=""):
    checks[0] += 1
    if cond:
        print(f"PASS  {label}")
    else:
        print(f"FAIL  {label}" + (f"  — {detail}" if detail else ""))
        failures.append(label)


def row(college, sid, ecr=0, acr=0, tcr=0, potential="", test="", origin="", loc2=""):
    return [college, "2026-2027", str(acr), str(ecr), str(tcr),
            sid, potential, test, origin, loc2]


def run_builder(rows, columns=None):
    payload = [{"viewName": VIEW, "generatedAt": "2026-08-31T00:00:00+00:00",
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
    # ── 1. The column is absent: everything origination is ABSENT, not zero ──
    plain = [row("Bakersfield College", "d1", ecr=10, tcr=5)]
    cols_no_orig = [c for c in COLUMNS if c not in ("Origin", "LocID2")]
    rows_no_orig = [r[:8] for r in plain]
    p0 = run_builder(rows_no_orig, columns=cols_no_orig)
    check("no LocID2 column -> no origination block",
          "origination" not in p0, f"got {sorted(p0.keys())}")
    check("no LocID2 column -> no nc_* key statewide (srcDelivered's question)",
          not any(k.startswith("nc_") for k in p0["statewide"]),
          f"got {[k for k in p0['statewide'] if k.startswith('nc_')]}")
    check("no LocID2 column -> no nc_* key on any college",
          not any(k.startswith("nc_")
                  for r in p0["colleges"].values() for k in r))
    check("no Origin column -> no origin_values histogram",
          "origin_values" not in p0)

    # ── 2. The column is present ─────────────────────────────────────────
    # Ten NOCE-originated students transcribed at Cypress (in NOCE's district
    # scope), one NOCE-originated student transcribed at Bakersfield (OUT of
    # scope — counts in the matrix, not in_scope), ten Calbright-originated
    # students at Bakersfield (statewide scope — all in scope), two SDCCE
    # students at San Diego Mesa and three at San Diego City (cells under the
    # floor of 10 — masked in the matrix, still inside in_scope arithmetic when
    # large enough; two small cells so neither is a lone masked one), one
    # unknown LocID2, one documented student with no origin. Counts sit at
    # 10/11 because the floor rose 5 -> 10 on 2026-09-03.
    rows = []
    for i in range(10):
        rows.append(row("Cypress College", f"n{i}", tcr=6, origin="Landing Page",
                        loc2="NOCE", potential="Yes"))
    rows.append(row("Bakersfield College", "nb", tcr=9, loc2="NOCE"))
    for i in range(10):
        rows.append(row("Bakersfield College", f"c{i}", tcr=3, acr=2,
                        loc2="Calbright College"))
    for i in range(2):
        rows.append(row("San Diego Mesa College", f"s{i}", tcr=4, loc2="SD Cont. Ed"))
    for i in range(3):
        rows.append(row("San Diego City College", f"t{i}", tcr=4, loc2="SD Cont. Ed"))
    rows.append(row("Bakersfield College", "u1", tcr=7, loc2="999"))
    rows.append(row("Bakersfield College", "d1", ecr=10, tcr=5))
    p = run_builder(rows)
    st = p["statewide"]
    og = p.get("origination") or {}

    check("statewide carries nc_pt (the feed now CARRIES the measure)",
          "nc_pt" in st and "nc_pt_u" in st,
          f"got {[k for k in st if k.startswith('nc_')]}")
    check("statewide nc_pt counts every resolved-origin transcribed student (10+1+10+2+3)",
          st.get("nc_pt") == 26, f"got {st.get('nc_pt')}")
    # u1 (unknown LocID2) and d1 (no origin) are ordinary documented students —
    # p3 counts them (18 documented transcribed here) while nc_pt must not.
    check("the unknown-LocID2 and no-origin students are in p3 but NOT nc_pt",
          st.get("nc_pt") == 26 and st.get("p3") == 18,
          f"nc_pt={st.get('nc_pt')} p3={st.get('p3')}")
    check("nc hits ignore Potential Student (Origin/LocID2 replace the flag)",
          p["colleges"]["Cypress"].get("nc_pt") == 10,
          f"got {p['colleges']['Cypress'].get('nc_pt')}")
    check("per-college nc_pt_u sums the receiving college's originated units (10x6)",
          abs((p["colleges"]["Cypress"].get("nc_pt_u") or 0) - 60) < 1e-6,
          f"got {p['colleges']['Cypress'].get('nc_pt_u')}")
    check("a per-college nc COUNT under the floor is masked like the credit rungs",
          p["colleges"]["San Diego Mesa"].get("nc_pt") is None and
          p["colleges"]["San Diego Mesa"].get("nc_pt_suppressed") is True)
    check("...while its nc_pt_u is KEPT — units carry the money (2x4)",
          abs((p["colleges"]["San Diego Mesa"].get("nc_pt_u") or 0) - 8) < 1e-6 and
          not p["colleges"]["San Diego Mesa"].get("nc_pt_u_suppressed"),
          f"got {p['colleges']['San Diego Mesa']!r}")

    # Scope: NOCE in_scope counts Cypress only; the Bakersfield landing sits in
    # the matrix but never in the scoped figure the earn-out reads.
    noce = (og.get("in_scope") or {}).get("NOCE") or {}
    check("NOCE in_scope nc_pt counts its district's colleges only (10, not 11)",
          noce.get("nc_pt") == 10, f"got {noce.get('nc_pt')}")
    check("NOCE in_scope nc_pt_u carries the district units only (60, not 69)",
          abs((noce.get("nc_pt_u") or 0) - 60) < 1e-6, f"got {noce.get('nc_pt_u')}")
    m_noce = (og.get("by_origin") or {}).get("NOCE") or {}
    check("the matrix still shows the out-of-district landing (Bakersfield row)",
          "Bakersfield" in m_noce and "Cypress" in m_noce,
          f"got {sorted(m_noce.keys())}")
    cal = (og.get("in_scope") or {}).get("Calbright") or {}
    check("Calbright's scope is statewide — its Bakersfield landings count (10)",
          cal.get("nc_pt") == 10, f"got {cal.get('nc_pt')}")
    check("scopes name Calbright statewide and NOCE's district colleges",
          (og.get("scopes", {}).get("Calbright", {}).get("scope") == "statewide" and
           "Cypress" in (og.get("scopes", {}).get("NOCE", {}).get("colleges") or [])))

    check("the unknown LocID2 value surfaces in unmatched_origins, masked",
          og.get("unmatched_origins", {}).get("999") == "<10",
          f"got {og.get('unmatched_origins')}")
    check("Origin histogram emitted for verification",
          p.get("origin_values", {}).get("Landing Page") == 10,
          f"got {p.get('origin_values')}")
    check("ppa still rides Potential Student — the cutover has NOT happened",
          st.get("ppa") == 0 and st.get("pp") == 10,
          f"ppa={st.get('ppa')} pp={st.get('pp')}")
    check("the published basis names the NC_* rungs and the origination block",
          "NC_PE" in p["basis"] and "origination" in p["basis"].lower())

    print(f"\n{checks[0] - len(failures)}/{checks[0]} checks passed")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
