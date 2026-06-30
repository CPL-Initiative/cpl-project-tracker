#!/usr/bin/env python3
"""CCC Collaborative metric — KPI Trends ⟷ MAP Exhibits card agreement.

Guards the Session-88 fix (Sam, 2026-06-30): the KPI Trends "CCC Collaborative"
row was reading `ccc_collaborative` = adopting_colleges (61) while the MAP
Exhibits card's "CCC Collaborative" breakdown shows the statewide-exhibit count
(`unique_exhibits` = 132). The two surfaces disagreed under the same label.

The fix introduces a NEW history key `ccc_exhibits` (= the exhibit count) and
repoints the Trends row to it, leaving the legacy `ccc_collaborative`
(adopting-colleges) series intact for provenance.

  1. log_daily_snapshot stamps ccc_exhibits = ccc_collaborative.unique_exhibits
     and keeps ccc_collaborative = adopting_colleges.
  2. The Trends "CCC Collaborative" row reads ccc_exhibits (132), so it matches
     the card — NOT the adopting-colleges value (61).
  3. With ccc_exhibits absent/0 (old history rows) the row reads "—"/is skipped
     rather than silently falling back to the adopting-colleges number.

Not wired into `npm test` (the JS runner only discovers *.test.js) because it
imports the Python pipeline. Run from the repo root:

    python3 tests/ccc_metric_test.py
"""
import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import excel_to_dashboard as gen

failures = []


def check(label, actual, expected):
    if actual == expected:
        print(f"PASS  {label}")
    else:
        print(f"FAIL  {label}: expected {expected!r}, got {actual!r}")
        failures.append(label)


# ════ 1. Snapshot stamps both keys from the right source ════
EXHIBIT = {
    "total_credit_recs": 12532,
    "unique_exhibits": 2601,
    "articulation_colleges": 102,
    "ccc_collaborative": {
        "unique_exhibits": 132,    # the statewide-exhibit count (card)
        "adopting_colleges": 61,   # colleges articulating ≥1 (legacy Trends)
    },
}
LIVE = {"raw": {}, "tiers": {}, "active_college_count": 100, "star_college_count": 50}

_real_history_file = gen.HISTORY_FILE
with tempfile.TemporaryDirectory() as td:
    gen.HISTORY_FILE = os.path.join(td, "kpi_history.json")
    try:
        history = gen.log_daily_snapshot(LIVE, EXHIBIT)
    finally:
        gen.HISTORY_FILE = _real_history_file

snap = history[-1]
check("snapshot ccc_exhibits = exhibit count (132)", snap.get("ccc_exhibits"), 132)
check("snapshot ccc_collaborative = adopting colleges (61)", snap.get("ccc_collaborative"), 61)
check("snapshot map_exhibits unchanged", snap.get("map_exhibits"), 2601)


# ════ 2. Trends row reads ccc_exhibits (matches the card), not adopting cols ════
def _trends_with(ccc_exhibits, ccc_collaborative):
    today = gen._now_pt().strftime("%Y-%m-%d")
    entry = {
        "date": today,
        "students": 48187, "map_exhibits": 2601,
        "ccc_exhibits": ccc_exhibits,
        "ccc_collaborative": ccc_collaborative,
    }
    return gen.render_kpi_history_card([entry])


# The data-row label cell is `>CCC Collaborative</td>`; the card legend also
# names the metric in prose, so anchor on the cell marker `>CCC Collaborative<`.
ROW = ">CCC Collaborative<"
html = _trends_with(132, 61)
row = html.split(ROW, 1)[1][:400] if ROW in html else ""
check("Trends data row renders 'CCC Collaborative'", ROW in html, True)
check("Trends 'CCC Collaborative' shows 132 (exhibit count)", ">132<" in row, True)
check("Trends 'CCC Collaborative' does NOT show 61 (adopting cols)", ">61<" in row, False)

# With ccc_exhibits 0/absent (a pre-fix history row) the data row is skipped —
# it does NOT silently fall back to the adopting-colleges value.
html0 = _trends_with(0, 61)
check("no ccc_exhibits → 'CCC Collaborative' data row absent (no fallback)",
      ROW in html0, False)


# ════ Summary ════
print()
if failures:
    print(f"{len(failures)} FAILED: {failures}")
    sys.exit(1)
print("All CCC-metric checks passed.")
