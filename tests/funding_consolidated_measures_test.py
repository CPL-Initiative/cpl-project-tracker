"""The two measure sources the consolidated three bands need (Sam, 2026-09-01).

Sam's restructure re-aims the same three priorities into three statutory bands —
Eligible under Access, Accepted and Transcribed under Success — and two of the
three need sources the builder did not emit:

  ppe / ppe_u   ELIGIBLE units among PORTAL-ORIGIN students. Sam ruled "filter
                now" on the Access measure. Needs no new column: Potential
                Student is already in the pull.
  pac / pac_u   APPLIED units on an ACCEPTED Student CPL Plan — the MAP CPL
                lifecycle attestation. The column does not exist yet (Sam ->
                Pedro, 2026-09-01), so it is OMITTED, never zeroed.

⚠️ WHAT THIS SUITE PROTECTS, AND WHY IT IS A SEPARATE FILE FROM THE ppa ONE.
Two distinct traps, both of which have already cost this project once:

  1. `ppe` IS NOT `pe` FILTERED. Every pe/pa/p2/p3 hit carries
     `and not is_potential`, so those metrics EXCLUDE portal-origin students.
     `ppe` is pe's DISJOINT SIBLING, exactly as `ppa` is pa's. A future session
     "simplifying" one into a filter of the other would silently swap the
     population under the largest band — the same swap
     tests/funding_portal_applied_test.py was written to stop at the applied rung.

  2. AN ABSENT COLUMN MUST PRODUCE ABSENT KEYS, NOT ZEROS. A present-but-zero
     `pac` reads to earnFraction() in cpl_funding.js as "the feed published and
     this college posted nothing" — which pays every college $0 on a measure
     nobody was ever asked for, and looks identical on screen to a college that
     genuinely did no work. Absent keys are what make srcDelivered() able to say
     "undelivered" instead. This is the `pa` / `nc_*` pattern and it is the
     difference between an honest zero and a silent one.

Run: python3 tests/funding_consolidated_measures_test.py
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
BASE_COLUMNS = ["College", "Catalog Year", "Applied Credits", "Eligible Credits",
                "Transcribed Credits", "MAP Internal StudentID",
                "Potential Student", "Test Student"]
ACCEPT_COLUMN = "Counselor Step"

failures = []
checks = [0]


def check(label, cond, detail=""):
    checks[0] += 1
    if cond:
        print(f"PASS  {label}")
    else:
        print(f"FAIL  {label}" + (f"  — {detail}" if detail else ""))
        failures.append(label)


def row(sid, ecr, acr, tcr, potential="", test="", accepted=None):
    r = [COLLEGE, "2025-2026", str(acr), str(ecr), str(tcr), sid, potential, test]
    if accepted is not None:
        r.append(accepted)
    return r


def run_builder(rows, columns):
    payload = [{"viewName": VIEW, "generatedAt": "2026-09-01T00:00:00+00:00",
                "columnName": list(columns), "columnValue": rows}]
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
    # ── part A: ppe, with no attestation column in the pull ────────────────
    # Three portal-origin students with eligible credit, three documented ones
    # with different eligible totals, one test student (excluded throughout).
    rows = []
    for sid, ecr in (("p1", 10), ("p2", 20), ("p3", 30)):
        rows.append(row(sid, ecr=ecr, acr=5, tcr=0, potential="Yes"))
    for sid, ecr in (("d1", 1), ("d2", 2), ("d3", 3)):
        rows.append(row(sid, ecr=ecr, acr=5, tcr=0))
    rows.append(row("t1", ecr=99, acr=99, tcr=99, potential="Yes", test="Yes"))
    p = run_builder(rows, BASE_COLUMNS)
    st = p["statewide"]

    check("ppe counts the three portal-origin students with eligible credit",
          st.get("ppe") == 3, f"got {st.get('ppe')}")
    check("ppe_u sums THEIR eligible units only (10+20+30)",
          abs(st.get("ppe_u", 0) - 60) < 1e-6, f"got {st.get('ppe_u')}")

    # The trap: pe is the COMPLEMENT, not the superset.
    check("pe excludes portal-origin students entirely (3 documented only)",
          st.get("pe") == 3, f"got {st.get('pe')}")
    check("pe_u carries only the documented cohort's units (1+2+3)",
          abs(st.get("pe_u", 0) - 6) < 1e-6, f"got {st.get('pe_u')}")
    check("pe and ppe are DISJOINT — neither contains the other",
          st.get("pe") == 3 and st.get("ppe") == 3 and
          abs(st.get("pe_u", 0) - st.get("ppe_u", 0)) > 1e-6)
    check("a test student is excluded from ppe as it is from pe",
          st.get("ppe") == 3 and st.get("pe") == 3)

    # The absent-keys contract, which is what lets the tab say "undelivered".
    check("pac is OMITTED — not zeroed — when the pull has no attestation column",
          "pac" not in st, f"got {st.get('pac')!r}")
    check("pac_u is likewise absent rather than 0.0",
          "pac_u" not in st, f"got {st.get('pac_u')!r}")
    check("the per-college record omits pac too, not just the statewide roll-up",
          "pac" not in p["colleges"][FUNDING_NAME])

    # ── part B: pac, once the attestation column arrives ───────────────────
    # The cutover has to work with NO consumer edit, so this proves the same
    # builder emits the key the moment the column is present.
    cols = BASE_COLUMNS + [ACCEPT_COLUMN]
    rows = [
        # Portal-origin AND attested — proves pac spans both cohorts.
        row("p1", ecr=10, acr=11, tcr=0, potential="Yes", accepted="True"),
        # Documented and attested.
        row("d1", ecr=10, acr=13, tcr=0, accepted="Yes"),
        row("d2", ecr=10, acr=17, tcr=0, accepted="1"),
        # Applied credit but NOT attested — the whole point of the measure.
        row("d3", ecr=10, acr=99, tcr=0, accepted="False"),
        row("d4", ecr=10, acr=99, tcr=0, accepted=""),
        # Attested but no applied credit — nothing to count.
        row("d5", ecr=10, acr=0, tcr=0, accepted="True"),
        # A test student is excluded even when attested.
        row("t1", ecr=99, acr=99, tcr=99, accepted="True", test="Yes"),
    ]
    p2 = run_builder(rows, cols)
    st2 = p2["statewide"]

    check("pac appears once the pull carries the attestation column",
          "pac" in st2 and "pac_u" in st2)
    check("pac counts only students with applied credit AND an attestation",
          st2.get("pac") == 3, f"got {st2.get('pac')}")
    check("pac_u sums THEIR applied units only (11+13+17)",
          abs(st2.get("pac_u", 0) - 41) < 1e-6, f"got {st2.get('pac_u')}")
    # This is the divergence from pa/ppa and it is deliberate: the attestation is
    # something done for one student regardless of how that student arrived, so
    # the measure must not pick a side of the potential partition.
    check("pac SPANS both cohorts — the portal-origin student is counted",
          st2.get("pac") == 3 and st2.get("ppa") == 1,
          f"pac={st2.get('pac')} ppa={st2.get('ppa')}")
    check("an un-attested student with applied credit is NOT counted",
          st2.get("pac") == 3 and st2.get("pa") == 4,
          f"pac={st2.get('pac')} pa={st2.get('pa')}")
    check("an attested student with no applied credit is NOT counted",
          st2.get("pac") == 3)
    check("a test student is excluded even when attested", st2.get("pac") == 3)
    # Truthiness is a closed set: an unexpected value must read False and show up
    # as a missing measure rather than as a silently inflated one.
    p3 = run_builder([row("x1", ecr=10, acr=10, tcr=0, accepted="maybe")], cols)
    check("an unrecognized attestation value reads False, never truthy",
          p3["statewide"].get("pac", 0) == 0, f"got {p3['statewide'].get('pac')}")

    print()
    print(f"{checks[0] - len(failures)}/{checks[0]} checks passed")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
