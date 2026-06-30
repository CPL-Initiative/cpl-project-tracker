#!/usr/bin/env python3
"""MIL/JST fetch parser — fetch_veteran_jst.build_veteran_jst().

Guards the offline transform of the potential-savings API rows into the
veteran_jst payload (the live HTTP fetch runs only on a runner — the Azure host
is egress-blocked from the sandbox). Star rule: JST ≥ 75% of MIL.

Run from the repo root:

    python3 tests/veteran_jst_test.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import fetch_veteran_jst as fj

failures = []


def check(label, actual, expected):
    if actual == expected:
        print(f"PASS  {label}")
    else:
        print(f"FAIL  {label}: expected {expected!r}, got {actual!r}")
        failures.append(label)


# ── Star rule (JST ≥ 75% of MIL), incl. the MAP-dashboard screenshot cases ──
check("star: 168/535 (Mt. San Jacinto)", fj.is_star(168, 535), True)
check("star: 248/494 (San Joaquin Delta)", fj.is_star(248, 494), True)
check("no star: 724/467 (Fresno City, 64%)", fj.is_star(724, 467), False)
check("no star: 343/176 (Shasta, 51%)", fj.is_star(343, 176), False)
check("no star: 260/174 (Sequoias, 67%)", fj.is_star(260, 174), False)
check("star: 158/146 (Mission, 92%)", fj.is_star(158, 146), True)
check("star at exactly 75%", fj.is_star(100, 75), True)
check("no star at 74%", fj.is_star(100, 74), False)
check("no star: 0/0", fj.is_star(0, 0), False)
check("star: 0 mil but JSTs on file", fj.is_star(0, 5), True)


# ── Full transform on a synthetic potential-savings array (API-notes shape) ──
ROWS = [
    {"Sorder": -1, "College": "Count", "EnrolledMilitaryStudents": 0, "VeteransWithJSTs": 0},
    {"Sorder": 1, "College": "ALL COLLEGES",
     "EnrolledMilitaryStudents": 34135, "VeteransWithJSTs": 23543, "StarCollegeCount": 50},
    {"Sorder": 2, "College": "Mt. San Jacinto College",
     "EnrolledMilitaryStudents": 168, "VeteransWithJSTs": 535},
    {"Sorder": 2, "College": "Fresno City College",
     "EnrolledMilitaryStudents": 724, "VeteransWithJSTs": 467},
    {"Sorder": 2, "College": "Shasta College",
     "EnrolledMilitaryStudents": 343, "VeteransWithJSTs": 176},
    {"Sorder": 2, "College": "  ", "EnrolledMilitaryStudents": 5, "VeteransWithJSTs": 5},  # blank → skipped
]
payload = fj.build_veteran_jst(ROWS, "2026-06-30T00:00:00+00:00")

check("statewide MIL", payload["statewide"]["mil"], 34135)
check("statewide JST", payload["statewide"]["jst"], 23543)
check("statewide star_colleges (MAP authoritative)", payload["statewide"]["star_colleges"], 50)
check("per-college count (blank-name row skipped)", len(payload["colleges"]), 3)
check("Mt. San Jacinto star True", payload["colleges"]["Mt. San Jacinto College"]["star"], True)
check("Fresno City star False", payload["colleges"]["Fresno City College"]["star"], False)
check("Mt. San Jacinto mil/jst preserved",
      (payload["colleges"]["Mt. San Jacinto College"]["mil"],
       payload["colleges"]["Mt. San Jacinto College"]["jst"]), (168, 535))
check("computed_star_colleges (1 of the 3 sample colleges)", payload["computed_star_colleges"], 1)
check("star_threshold recorded", payload["star_threshold"], 0.75)

# Resilience: ALL COLLEGES label drift falls back to data[1].
drift = [ROWS[0], dict(ROWS[1], College="ALL  COLLEGES"), ROWS[2]]
p2 = fj.build_veteran_jst(drift, "2026-06-30T00:00:00+00:00")
check("ALL COLLEGES label drift → data[1] fallback", p2["statewide"]["mil"], 34135)

print()
if failures:
    print(f"{len(failures)} FAILED: {failures}")
    sys.exit(1)
print("All veteran-jst checks passed.")
