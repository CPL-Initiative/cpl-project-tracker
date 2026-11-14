"""
The printed reports name, for each year, the Current the Annual Goals tab shows
for that row and year (S649, lane item 0d).

Sam's ruling (`sam-annual-goals-every-year-editable-2026-10-19`): every annual
column on the Annual Goals tab edits, with a Current per year. The reports read
CPL_DATA.projects, so the generator stamps projects[].kpi_current_<year> from
the tab's own row, by the tab's one rule (apply_project_current):

  * a manual row reads its current_years (_row_current_years: the GOAL row,
    falling back to STRETCH; kpi_metric under 2025-26 only when no year carries
    a value); a stored 0 is blank, as the tab prints it;
  * a live row (3.1, 3.2, 2.1 ...) reads this fiscal year from the live KPI and
    each closed year from its kpi_history year-end; every other year is blank,
    whatever its cur_* holds;
  * the data file names the fiscal year (workplan_fy) the reports print beside.

The failure this guards: a report printing a Current the tab does not show for
that year. Fixtures only, no Supabase or Excel; everything runs through
build_workplan_goals_from_supabase, the function that builds the tab's rows.

Run from repo root:  python3 tests/workplan_reports_year_pair_test.py
"""
import inspect
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import excel_to_dashboard as e  # noqa: E402

fails = []


def check(name, cond):
    print(("PASS " if cond else "FAIL ") + name)
    if not cond:
        fails.append(name)


YR = ("yr_2025_26", "yr_2026_27", "yr_2027_28", "yr_2028_29", "yr_2029_30")
CUR = ("cur_2025_26", "cur_2026_27", "cur_2027_28", "cur_2028_29", "cur_2029_30")


def wg(aid, rtype, yrs, curs=(None,) * 5, current=None):
    r = {"kind": "project", "activity_id": aid, "row_type": rtype, "name": aid, "current": current}
    r.update(zip(YR, yrs))
    r.update(zip(CUR, curs))
    return r


ROWS = [
    # Manual: 2026-27 set; 2025-26 sits in the one-column `current` it replaced;
    # 2027-28 holds a stored 0, which the tab prints blank.
    wg("3.9", "GOAL", (0, 2, 4, 4, 4), curs=(None, 3, 0, None, None), current="1"),
    wg("3.9", "STRETCH", (0, 4, 8, 8, 8)),
    # Manual: last year set, this year blank -> this year blank, never last year's.
    wg("2.2", "GOAL", (5, 10, 15, 20, 25), curs=(6, None, None, None, None)),
    # The STRETCH row is the fallback when GOAL leaves a year null.
    wg("9.9", "GOAL", (1, 1, 1, 1, 1)),
    dict(wg("9.9", "STRETCH", (1, 1, 1, 1, 1)), cur_2026_27=7),
    # Live: stale hand values under 2026-27 and 2027-28 that must not print.
    wg("3.1", "GOAL", (40000, 90000, 200000, 300000, 380000), curs=(None, 999, 555, None, None)),
    wg("3.1", "STRETCH", (45000, 100000, 220000, 380000, 400000)),
    # Live, a closed year with no kpi_history entry (3.2's 2025-26).
    wg("3.2", "GOAL", (90000, 195000, 300000, 600000, 930000), curs=(777, None, None, None, None)),
]


def proj(pid, kpi_metric=""):
    p = {"id": pid, "name": "Project " + pid, "activity": "Activity " + pid.split(".")[0],
         "kpi_metric": kpi_metric, "kpi_unit": "", "desc": "", "count_note": ""}
    p.update(e._empty_ladder())
    return p


# 1.5 has no ladder row and no Current anywhere but kpi_metric (2025-26 fallback).
projects = [proj("3.9", "9,999"), proj("2.2", "6"), proj("9.9"), proj("3.1", "43,630"),
            proj("3.2", "96,449"), proj("1.5", "17")]
_activities, _wg, annual_goals = e.build_workplan_goals_from_supabase(ROWS, [], projects, None)
kpis = {"cumulative_students": {"value": "48,142"}, "transcripted_units": {"value": "101,000"}}
history = [{"date": "2026-06-30", "students": 45000}, {"date": "2026-11-13", "students": 48000}]
e.apply_live_workplan_current(annual_goals, kpis, {"scraped_at": "2026-11-14T06:00:00Z"},
                              history=history, fy="2026-27")
e.apply_project_current(projects, annual_goals)
P = {p["id"]: p for p in projects}


def cur(pid, sfx):
    return P[pid]["kpi_current_" + sfx]


check("every project has an annual_goals row (the table iterates projects)",
      {r["id"] for r in annual_goals} == set(P))
check("_empty_ladder carries kpi_current_2526 .. kpi_current_2930, blank",
      all(e._empty_ladder().get("kpi_current_" + s) == "" for s in e._LADDER_SUFFIXES))
check("_build_wg_ladder derives no Current (the tab's rule is the one place)",
      "cur_" not in inspect.getsource(e._build_wg_ladder)
      and "kpi_current_" not in inspect.getsource(e._build_wg_ladder))

# ── manual rows ──
check("3.9: each year's Current is its own cur_<year> (2026-27 = 3)", cur("3.9", "2627") == "3")
check("3.9: 2025-26 reads the one-column `current` it replaced", cur("3.9", "2526") == "1")
check("3.9: a stored 0 is blank, as the tab prints it", cur("3.9", "2728") == "")
check("3.9: a year with no Current is blank", cur("3.9", "2829") == "" and cur("3.9", "2930") == "")
check("2.2: last year's Current stays under last year; this year is blank",
      cur("2.2", "2526") == "6" and cur("2.2", "2627") == "")
check("9.9: the STRETCH row's cur_2026_27 is the fallback the tab shows (7)", cur("9.9", "2627") == "7")
check("1.5: no Current anywhere -> kpi_metric under 2025-26 only",
      cur("1.5", "2526") == "17" and cur("1.5", "2627") == "")
check("3.9: kpi_metric never prints when a year carries a value",
      "9,999" not in [cur("3.9", s) for s in e._LADDER_SUFFIXES])

# ── live rows ──
check("3.1 (live): this fiscal year is the live KPI, not the stale cur_2026_27",
      cur("3.1", "2627") == "48,142")
check("3.1 (live): the closed year 2025-26 reads its kpi_history year-end", cur("3.1", "2526") == "45,000")
check("3.1 (live): a stale cur_2027_28 does not print; the year is blank", cur("3.1", "2728") == "")
check("3.1 (live): years still ahead are blank", cur("3.1", "2829") == "" and cur("3.1", "2930") == "")
check("3.2 (live): a closed year with no kpi_history entry is blank, not its cur_2025_26",
      cur("3.2", "2526") == "" and cur("3.2", "2627") == "101,000")

# ── the fiscal year the reports print beside ──
check("current_workplan_year() is a ladder label the reports parse ('2026-27')",
      re.match(r"^20\d\d-\d\d$", e.current_workplan_year() or "") is not None)
src = open(os.path.join(ROOT, "excel_to_dashboard.py"), encoding="utf-8").read()
check("CPL_DATA carries workplan_fy from current_workplan_year()",
      '"workplan_fy":  current_workplan_year()' in src)
check("main() stamps the Current onto projects after the workplan sync",
      src.index("\n    apply_project_current(projects, annual_goals)\n")
      > src.index("apply_live_workplan_current(annual_goals, kpis, live_data, history=_read_kpi_history())"))

print(f"\n{len(fails)} failure(s)" if fails else "\nall passed")
sys.exit(1 if fails else 0)
