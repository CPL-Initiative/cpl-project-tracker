#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Career attainment (goal C) — the Chancellor's Office import, builder checks.

Sam, 2026-09-22: "we can use EDD wage data to measure this ... This would not be
reported by the colleges but instead measured by the CO and reflected on our
funding model with periodic updates (imports) of the data." His 2026-09-23
funding-review ruling (item 2, "CO research defines it"): the import carries,
per college, the CPL units of students awarded CPL who reach CO research's
outcome, with student counts under 10 masked before the figure reaches the model.

What this pins, in order of how expensive each would be to get wrong:

  1. ABSENT, NOT ZERO. With no import file there is no ca_u / nc_ca_u key and no
     career_attainment block. srcDelivered() in cpl_funding.js asks the artifact
     for the key, and an emitted zero would turn "awaiting measurement" into a
     measured nothing for every college.
  2. UNITS ONLY REACH THE ARTIFACT. Student counts may ride in the import for CO
     research's own record; the model funds on units, so no count is published.
  3. AN UNMASKED SMALL COUNT STOPS THE IMPORT, and the COMMITTED file is linted
     here too, so a count under 10 cannot land in the repository at all.
  4. NEVER GUESSED. A name that does not resolve surfaces in `unmatched` (the
     name alone) and moves no figure.
  5. A BAD IMPORT NEVER STOPS THE MAP BUILD. It is skipped with its reasons.

Run: python3 tests/funding_career_import_test.py
"""
import importlib.util
import json
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
BUILDER = os.path.join(ROOT, "funding", "_build_funding_performance.py")
COMMITTED = os.path.join(ROOT, "funding", "career_attainment_import.json")
VIEW = "View_StudentAggregatedValues_APIDataset"
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


def row(college, sid, ecr=0, acr=0, tcr=0):
    return [college, "2026-2027", str(acr), str(ecr), str(tcr), sid, "", ""]


MAP_ROWS = [row("Bakersfield College", f"b{i}", ecr=12, tcr=6) for i in range(12)] + \
           [row("Cypress College", f"c{i}", ecr=9, tcr=3) for i in range(12)]


def run_builder(career=None, raw=None):
    """Build from a small MAP pull, with `career` (a dict, written as JSON) or
    `raw` (text, written as-is) as the import, or neither (no file at all)."""
    payload = [{"viewName": VIEW, "generatedAt": "2026-09-23T00:00:00+00:00",
                "columnName": COLUMNS, "columnValue": MAP_ROWS}]
    with tempfile.TemporaryDirectory() as td:
        src = os.path.join(td, "CustomReport_latest.json")
        out = os.path.join(td, "out.js")
        imp = os.path.join(td, "career_attainment_import.json")
        with open(src, "w", encoding="utf-8") as f:
            json.dump(payload, f)
        if career is not None:
            with open(imp, "w", encoding="utf-8") as f:
                json.dump(career, f)
        elif raw is not None:
            with open(imp, "w", encoding="utf-8") as f:
                f.write(raw)
        proc = subprocess.run([sys.executable, BUILDER, src, "--out", out, "--career-import", imp],
                              capture_output=True, text=True, cwd=td)
        if proc.returncode != 0:
            raise AssertionError(f"builder exited {proc.returncode}\n{proc.stderr}")
        text = open(out, encoding="utf-8").read()
    return json.loads(text[text.index("{"):text.rindex("};") + 1]), proc.stdout


def good_import(**over):
    ci = {
        "as_of": "2027-02-01",
        "source": "CCCCO Research, EDD unemployment-insurance wage records",
        "definition": "Employed in the second fiscal quarter after the CPL award",
        "colleges": {
            "Bakersfield College": {"cpl_units": 318.5, "students": 42, "nc_cpl_units": 12.0},
            "Cypress College": {"cpl_units": 27.0, "students": None},
        },
    }
    ci.update(over)
    return ci


def all_keys(obj, out=None):
    out = set() if out is None else out
    if isinstance(obj, dict):
        for k, v in obj.items():
            out.add(k)
            all_keys(v, out)
    elif isinstance(obj, list):
        for v in obj:
            all_keys(v, out)
    return out


def main():
    # ── 1. no import: ABSENT, never zero ────────────────────────────────────
    p, _ = run_builder()
    keys = all_keys(p)
    check("1a: with no import file there is no ca_u or nc_ca_u anywhere in the artifact",
          "ca_u" not in keys and "nc_ca_u" not in keys, f"keys={sorted(k for k in keys if 'ca' in k)}")
    check("1b: …and no career_attainment block", "career_attainment" not in p)
    check("1c: the MAP measures still build", p["statewide"].get("p3", 0) > 0)

    # ── 2. a good import: units in, counts out ──────────────────────────────
    p, log = run_builder(good_import())
    st, cols = p["statewide"], p["colleges"]
    check("2a: statewide ca_u is the sum of the per-college units",
          abs(st.get("ca_u", -1) - 345.5) < 1e-6, f"got {st.get('ca_u')}")
    check("2b: each college carries its own ca_u under its funding name",
          cols.get("Bakersfield", {}).get("ca_u") == 318.5 and cols.get("Cypress", {}).get("ca_u") == 27.0,
          f"got {cols.get('Bakersfield', {}).get('ca_u')} / {cols.get('Cypress', {}).get('ca_u')}")
    check("2c: the noncredit-origin units arrive as nc_ca_u, statewide and per college",
          st.get("nc_ca_u") == 12.0 and cols.get("Bakersfield", {}).get("nc_ca_u") == 12.0)
    text = json.dumps(p)
    check("2d: no student count from the import reaches the artifact",
          "students" not in all_keys(p) and '"ca":' not in text and "42" not in json.dumps(p.get("career_attainment")))
    ca = p.get("career_attainment") or {}
    check("2e: the block carries the import's date, source and CO research's definition",
          ca.get("as_of") == "2027-02-01" and "EDD" in ca.get("source", "") and
          ca.get("definition", "").startswith("Employed in the second fiscal quarter"))
    check("2f: …and says how many colleges it covers, with nothing unmatched",
          ca.get("colleges") == 2 and ca.get("unmatched") == [])
    check("2g: the build log names the import", "career attainment from the 2027-02-01 import" in log)

    # ── 3. masking: an unmasked small count stops the import ────────────────
    bad = good_import()
    bad["colleges"]["Cypress College"] = {"cpl_units": 27.0, "students": 4}
    p, log = run_builder(bad)
    check("3a: an unmasked count under 10 stops the whole import — no ca_u is written",
          "ca_u" not in all_keys(p) and "career_attainment" not in p)
    check("3b: …the log says why, naming the row", "Cypress College: students must be a whole count" in log)
    check("3c: …and the MAP measures still build", p["statewide"].get("p3", 0) > 0)

    # ── 4. never guessed ────────────────────────────────────────────────────
    odd = good_import()
    odd["colleges"]["Nowhere Community College"] = {"cpl_units": 99.0, "students": 15}
    p, _ = run_builder(odd)
    ca = p.get("career_attainment") or {}
    check("4a: a name that does not resolve surfaces in unmatched, by name only",
          ca.get("unmatched") == ["Nowhere Community College"])
    check("4b: …and moves no figure", abs(p["statewide"].get("ca_u", -1) - 345.5) < 1e-6)

    # ── 5. absent noncredit stays absent ────────────────────────────────────
    cr_only = good_import()
    cr_only["colleges"] = {"Bakersfield College": {"cpl_units": 10.0}}
    p, _ = run_builder(cr_only)
    check("5a: an import with no noncredit units leaves nc_ca_u ABSENT, not zero",
          "nc_ca_u" not in all_keys(p) and p["statewide"].get("ca_u") == 10.0)

    # ── 6. a malformed file never stops the build ───────────────────────────
    p, log = run_builder(raw="{ not json")
    check("6a: an unreadable import is skipped and the MAP measures still build",
          "ca_u" not in all_keys(p) and p["statewide"].get("p3", 0) > 0 and "unreadable" in log)
    p, log = run_builder(good_import(as_of="soon", definition=""))
    check("6b: a missing date or definition is named in the log and nothing is imported",
          "ca_u" not in all_keys(p) and "as_of must be" in log and "definition must name" in log)

    # ── 7. the COMMITTED import, if there is one, passes the same checks ────
    spec = importlib.util.spec_from_file_location("fpb", BUILDER)
    fpb = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(fpb)
    if os.path.exists(COMMITTED):
        with open(COMMITTED, encoding="utf-8") as f:
            problems = fpb._career_import_problems(json.load(f))
        check("7a: the committed funding/career_attainment_import.json is well formed and masked",
              problems == [], "; ".join(problems[:5]))
    else:
        check("7a: no import is committed yet, so the tab reads awaiting measurement", True)
    check("7b: the builder reads the import from funding/career_attainment_import.json",
          os.path.normpath(fpb.CAREER_IMPORT) == os.path.normpath(COMMITTED))

    print(f"\n{checks[0] - len(failures)}/{checks[0]} checks passed")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
