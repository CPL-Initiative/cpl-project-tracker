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
  2. KPI Trends shows the CCC row at the common-title grain. SUPERSEDED IN PART
     by the 2026-07-09 re-grain (Sam's call, docs/cobi_lessons.md "Session 109
     addendum — Common Exhibit Titles"): the Trends row became "CCC Common
     Titles", read from `ccc_common_titles`, and the group-grain keys
     (`ccc_exhibits`, `ccc_collaborative`) keep recording for provenance but
     left Trends. Re-pinned to that ruling by S653b (2026-11-14): the row reads
     `ccc_common_titles`, and neither group-grain value reaches Trends.
  3. With the row's key absent/0 (old history rows) the row is skipped rather
     than silently falling back to another series.

CI runs it in the `lints` job of .github/workflows/js-tests.yml. Run from the
repo root:

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
        "common_titles": 47,       # the common-title grain (Trends since 2026-07-09)
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
check("snapshot ccc_common_titles = CCC common titles (47)", snap.get("ccc_common_titles"), 47)


# ════ 2. Trends CCC row reads ccc_common_titles; the group-grain keys left ════
# Re-grained 2026-07-09 (Sam's call; docs/cobi_lessons.md, Session 109
# addendum). Before then this section pinned a "CCC Collaborative" row reading
# ccc_exhibits; that row left Trends with the re-grain.
def _trends_with(ccc_common_titles, ccc_exhibits, ccc_collaborative):
    today = gen._now_pt().strftime("%Y-%m-%d")
    entry = {
        "date": today,
        "students": 48187, "map_exhibits": 2601,
        "ccc_common_titles": ccc_common_titles,
        "ccc_exhibits": ccc_exhibits,
        "ccc_collaborative": ccc_collaborative,
    }
    return gen.render_kpi_history_card([entry])


# Anchor on the label cell marker; the card legend may name metrics in prose.
ROW = ">CCC Common Titles<"
OLD_ROW = ">CCC Collaborative<"
html = _trends_with(47, 132, 61)
row = html.split(ROW, 1)[1][:400] if ROW in html else ""
check("Trends data row renders 'CCC Common Titles'", ROW in html, True)
check("Trends 'CCC Common Titles' shows 47 (ccc_common_titles)", ">47<" in row, True)
check("Trends 'CCC Common Titles' does NOT show 132 (ccc_exhibits)", ">132<" in row, False)
check("Trends 'CCC Common Titles' does NOT show 61 (adopting cols)", ">61<" in row, False)
check("the group-grain 'CCC Collaborative' row left Trends", OLD_ROW in html, False)

# With ccc_common_titles 0/absent (a pre-re-grain history row) the data row is
# skipped: it does NOT silently fall back to a group-grain value.
html0 = _trends_with(0, 132, 61)
check("no ccc_common_titles → 'CCC Common Titles' data row absent (no fallback)",
      ROW in html0, False)
check("…and no group-grain row appears in its place", OLD_ROW in html0, False)


# ════ Summary ════
print()
if failures:
    print(f"{len(failures)} FAILED: {failures}")
    sys.exit(1)
print("All CCC-metric checks passed.")
