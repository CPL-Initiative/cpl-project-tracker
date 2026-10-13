"""The workplan charts survive a ladderless row named like a series (S377).

Dashboard run 585 died with ZeroDivisionError in render_workplan_charts_html:
the charts pick the apprentice series by name, the last match wins, and once
1.1.2 "AI Apprenticeship CPL Tools" (no goal ladder, so all zeros) moved to
4.2.1 it sorted after the real apprentice rows. A zero ladder now names no
series, and the trajectory guards an all-zero sum.

Run from the repo root: python3 tests/workplan_charts_zero_ladder_test.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import excel_to_dashboard as gen  # noqa: E402

results = []


def check(name, ok):
    results.append((name, bool(ok)))


def row(name, goal, stretch, gt, st):
    return {"name": name, "goal": goal, "stretch": stretch, "goal_total": gt, "stretch_total": st}


GOALS = [
    row("Military CPL", [30000] * 5, [30000] * 5, 70000, 100000),
    row("CPL Offers & Awards Tracking — Apprentices and Journey Workers",
        [500, 2500, 7500, 10000, 20000], [1000, 5000, 15000, 30000, 40000], 40500, 91000),
    row("Apprenticeship Sprint", [1, 2, 3, 4, 5], [2, 4, 6, 8, 10], 15, 30),
    # The moved row: ladderless, sorting last.
    row("AI Apprenticeship CPL Tools", [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], 0, 0),
]

try:
    html = gen.render_workplan_charts_html(60000, {"military": 21866, "workforce": 21526, "apprentice": 681}, GOALS, {})
    threw = None
except Exception as e:  # noqa: BLE001
    html, threw = "", e
check("a ladderless apprentice row sorting last does not crash the charts (" + repr(threw) + ")", threw is None)
check("the apprentice target comes from a row with a ladder, never the zero row",
      '"app_target": 0' not in html.replace(" ", "").replace('"app_target":0', '"app_target": 0'))

try:
    gen.render_workplan_charts_html(60000, {}, [row("Apprentices", [0, 0, 0, 0, 0], [0] * 5, 0, 0)], {})
    threw2 = None
except Exception as e:  # noqa: BLE001
    threw2 = e
check("only zero ladders: the defaults draw, no crash (" + repr(threw2) + ")", threw2 is None)

passed = sum(1 for _, ok in results if ok)
for name, ok in results:
    print(("ok   " if ok else "FAIL ") + name)
print(f"\n{passed}/{len(results)} passed")
sys.exit(0 if passed == len(results) else 1)
