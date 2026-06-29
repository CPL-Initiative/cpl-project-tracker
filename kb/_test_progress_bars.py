"""
Computed Activity-KPI progress bars — assertions (Session 84, SkyScribe).

The Activity KPI card progress bar now computes Goal/Stretch progress from the
current value ÷ the CURRENT FISCAL-YEAR cumulative target (blue Goal + gold
Stretch bars), falling back to the manual percent_complete bar when the data
can't support it. These guard the helper math + the fallback contract.

Run from repo root:  python3 kb/_test_progress_bars.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import excel_to_dashboard as e  # noqa: E402

fails = []


def check(name, cond):
    print(("PASS " if cond else "FAIL ") + name)
    if not cond:
        fails.append(name)


# Fiscal-year mapping (Jul 1 boundary).
check("FY suffix is a valid ladder column", e._current_fy_suffix() in e._FY_SUFFIXES)
check("_fy_label formats 2526 -> 2025-26", e._fy_label("2526") == "2025-26")

# Sam's motivating case — project 1.1: actual 8 vs the 2025-26 ladder (goal 4,
# stretch 8) → Goal 200% (exceeded), Stretch 100% (met).
g11 = {"2526": "4", "2627": "9", "2728": "18", "2829": "22", "2930": "25"}
s11 = {"2526": "8", "2627": "18", "2728": "28", "2829": "36", "2930": "50"}
p = e._compute_dual_progress("8", g11, s11, suffix="2526")
check("1.1: goal_pct = 200 (8/4)", p and p["goal_pct"] == 200)
check("1.1: stretch_pct = 100 (8/8)", p and p["stretch_pct"] == 100)
check("1.1: fy_label = 2025-26", p and p["fy_label"] == "2025-26")

# A big-number metric with commas parses.
g31 = {"2526": "40,000", "2930": "250,000"}
s31 = {"2526": "80,000", "2930": "380,000"}
p31 = e._compute_dual_progress("48,148", g31, s31, suffix="2526")
check("3.1: comma metric parses → goal 120%", p31 and p31["goal_pct"] == 120)
check("3.1: stretch 60%", p31 and p31["stretch_pct"] == 60)

# Fallbacks → None (caller renders the manual % bar). The simplest no-regression.
check("blank metric → None (manual fallback)", e._compute_dual_progress("", g11, s11) is None)
check("N/A metric → None", e._compute_dual_progress("N/A", g11, s11) is None)
check("dash metric → None", e._compute_dual_progress("—", g11, s11) is None)
check("no ladder → None", e._compute_dual_progress("8", {}, {}) is None)

# A blank current-FY column falls back to the latest non-blank target.
pf = e._compute_dual_progress("8", {"2526": "", "2930": "25"}, {"2526": "", "2930": "50"}, suffix="2526")
check("blank current-FY col → falls back to 2030 target (32%)", pf and pf["goal_pct"] == 32)

# Only a stretch ladder (no goal) → a stretch bar only, no goal bar.
po = e._compute_dual_progress("8", {}, {"2526": "8"}, suffix="2526")
check("goal-less ladder → goal_pct None, stretch_pct 100", po and po["goal_pct"] is None and po["stretch_pct"] == 100)

# HTML render: blue (cobalt) Goal + gold Stretch + FY label + a ✓ when met.
h = e._dual_progress_html(p)
check("html: cobalt Goal bar", "var(--cobalt)" in h)
check("html: gold Stretch bar", "var(--gold-accent)" in h)
check("html: 'vs 2025-26 target' label", "2025-26 target" in h)
check("html: ✓ met marker for ≥100%", "✓" in h)
check("html: a goal-less prog omits the Goal bar",
      "Goal" not in e._dual_progress_html(po))

print("\n" + ("ALL PASS" if not fails else f"{len(fails)} FAILED: {fails}"))
sys.exit(1 if fails else 0)
