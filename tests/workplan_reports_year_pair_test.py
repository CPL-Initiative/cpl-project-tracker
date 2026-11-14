"""
The printed reports name each year's own Current (S649, lane item 0d).

Sam's ruling (`sam-annual-goals-every-year-editable-2026-10-19`): every annual
column on the Annual Goals tab edits, with a Current per year. The reports read
CPL_DATA.projects, so the generator must carry that Current onto each project:

  * _build_wg_ladder exports kpi_current_2526 .. kpi_current_2930 from the GOAL
    row's cur_* columns, blank when null (2025-26 also reads the one-column
    `current` the cur_* columns replaced);
  * a live row (3.1, 3.2, 2.1 ...) takes this fiscal year's Current from the
    live KPI and each closed year's from kpi_history, never from cur_*
    (apply_live_workplan_current, then apply_live_project_current);
  * the data file names the fiscal year (workplan_fy) the reports print beside.

The failure this guards: a report that prints one figure (kpi_metric) as the
Current of every year. Fixtures only, no Supabase or Excel.

Run from repo root:  python3 tests/workplan_reports_year_pair_test.py
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import excel_to_dashboard as e  # noqa: E402
import kb._load_workplan_goals as lwg  # noqa: E402

fails = []


def check(name, cond):
    print(("PASS " if cond else "FAIL ") + name)
    if not cond:
        fails.append(name)


def goal(aid, yrs, curs=None, current=None):
    r = {"kind": "project", "activity_id": aid, "row_type": "GOAL", "current": current}
    for (col, v) in zip(("yr_2025_26", "yr_2026_27", "yr_2027_28", "yr_2028_29", "yr_2029_30"), yrs):
        r[col] = v
    for (col, v) in zip(("cur_2025_26", "cur_2026_27", "cur_2027_28", "cur_2028_29", "cur_2029_30"),
                        curs or (None,) * 5):
        r[col] = v
    return r


def stretch(aid, yrs):
    r = {"kind": "project", "activity_id": aid, "row_type": "STRETCH"}
    for (col, v) in zip(("yr_2025_26", "yr_2026_27", "yr_2027_28", "yr_2028_29", "yr_2029_30"), yrs):
        r[col] = v
    return r


ROWS = [
    # Unmapped: a Current set for 2026-27 only; 2025-26 sits in the legacy column.
    goal("3.9", (0, 2, 4, 4, 4), curs=(None, 3, None, None, None), current="1"),
    stretch("3.9", (0, 4, 8, 8, 8)),
    # Live: cur_2026_27 holds a stale hand value the live KPI must win over.
    goal("3.1", (40000, 90000, 200000, 300000, 380000), curs=(None, 999, None, None, None)),
    stretch("3.1", (45000, 100000, 220000, 380000, 400000)),
    # A ladder with a STRETCH row and no GOAL row.
    dict(stretch("9.9", (1, 1, 1, 1, 1)), cur_2026_27=7),
]

_real = lwg.load_workplan_goals_full
lwg.load_workplan_goals_full = lambda *a, **k: (ROWS, [], "2026-11-14", "fixture")
try:
    ladder = e._build_wg_ladder()
finally:
    lwg.load_workplan_goals_full = _real

# ── the export ──
check("_empty_ladder carries kpi_current_2526 .. kpi_current_2930, blank",
      all(e._empty_ladder().get("kpi_current_" + s) == "" for s in e._LADDER_SUFFIXES))
l39 = ladder.get("3.9", {})
check("3.9: each year's Current comes from its own cur_<year> (2026-27 = 3)",
      l39.get("kpi_current_2627") == "3")
check("3.9: a year with no Current is blank, never another year's figure",
      l39.get("kpi_current_2728") == "" and l39.get("kpi_current_2829") == ""
      and l39.get("kpi_current_2930") == "")
check("3.9: 2025-26 falls back to the one-column `current` it replaced",
      l39.get("kpi_current_2526") == "1")
check("3.9: the goal and stretch ladders are unchanged (2029-30 stretch 8)",
      l39.get("kpi_goal_2930") == "4" and l39.get("kpi_stretch_2930") == "8"
      and l39.get("kpi_stretch_2829") == "8")
check("3.1: the 2029-30 stretch and the 2028-29 stretch stay distinct (400,000 vs 380,000)",
      ladder["3.1"]["kpi_stretch_2930"] == "400,000" and ladder["3.1"]["kpi_stretch_2829"] == "380,000")
check("a STRETCH row writes no Current (GOAL is the store)",
      not any(k.startswith("kpi_current_") for k in ladder.get("9.9", {})))

# ── a live row: this year from the live KPI, closed years from kpi_history ──
projects = []
for aid in ("3.9", "3.1"):
    p = {"id": aid, "kpi_metric": "43,630"}
    p.update(e._empty_ladder())
    p.update(ladder[aid])
    projects.append(p)
annual_goals = [
    {"id": "3.1", "current_kpi_key": "cumulative_students", "current": {}},
    {"id": "3.9", "current": {}},
]
kpis = {"cumulative_students": {"value": "48,142"}}
history = [{"date": "2026-06-30", "students": 45000}, {"date": "2026-11-13", "students": 48000}]
e.apply_live_workplan_current(annual_goals, kpis, {"scraped_at": "2026-11-14T06:00:00Z"},
                              history=history, fy="2026-27")
e.apply_live_project_current(projects, annual_goals)
p31 = projects[1]
check("3.1 (live): this fiscal year's Current is the live KPI, not the stale cur_2026_27",
      p31["kpi_current_2627"] == "48,142")
check("3.1 (live): the closed year 2025-26 reads its kpi_history year-end entry",
      p31["kpi_current_2526"] == "45,000")
check("3.1 (live): a year still ahead is blank",
      p31["kpi_current_2728"] == "" and p31["kpi_current_2930"] == "")
check("3.9 (unmapped): the live stamp leaves its cur_* values alone",
      projects[0]["kpi_current_2627"] == "3" and projects[0]["kpi_current_2526"] == "1")

# ── the fiscal year the reports print beside ──
check("current_workplan_year() is a ladder label the reports parse ('2026-27')",
      re.match(r"^20\d\d-\d\d$", e.current_workplan_year() or "") is not None)
src = open(os.path.join(ROOT, "excel_to_dashboard.py"), encoding="utf-8").read()
check("CPL_DATA carries workplan_fy from current_workplan_year()",
      '"workplan_fy":  current_workplan_year()' in src)
check("main() stamps the live Current onto projects after the workplan sync",
      src.index("\n    apply_live_project_current(projects, annual_goals)\n")
      > src.index("apply_live_workplan_current(annual_goals, kpis, live_data, history=_read_kpi_history())"))

print(f"\n{len(fails)} failure(s)" if fails else "\nall passed")
sys.exit(1 if fails else 0)
