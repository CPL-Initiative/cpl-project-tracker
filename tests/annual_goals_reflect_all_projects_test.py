#!/usr/bin/env python3
"""Annual Workplan Goals — reflect EVERY Activities-tab project + nest X.Y.Z rows.

Guards the 2026-07-27 change (SkyElemental): the Annual Workplan Goals table used
to iterate only the `workplan_goals` ladder rows, so any project on the Activities
tab that lacked a ladder row (the ex-"Activity 5" items 1.1.1/1.1.2/1.1.3, 3.7,
3.8, 4.4.1, 4.7, and the net-new 3.1.4) was invisible here. Path A makes the table
iterate the SAME `projects` set the Activities tab renders, overlaying the ladder
when present. And a three-level id (X.Y.Z, e.g. 4.1.1 "29 Palms" under 4.1 "Veteran
Sprint") renders SUBSIDIARY to its X.Y parent (indent + accent border + "↳") while
staying its own row.

Run:  python3 tests/annual_goals_reflect_all_projects_test.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import excel_to_dashboard as gen

failures = []


def check(label, actual, expected):
    if actual == expected:
        print(f"PASS  {label}")
    else:
        print(f"FAIL  {label}\n        expected: {expected!r}\n        actual:   {actual!r}")
        failures.append(label)


YEAR_KEYS = ["yr_2025_26", "yr_2026_27", "yr_2027_28", "yr_2028_29", "yr_2029_30"]
ACT = {"1": "Activity 1: AI-Enhanced CPL Infrastructure",
       "4": "Activity 4: Coordinate CPL Sprints, Projects, Learning & Partnerships"}


def _goal_pair(aid, name, kind, ladder=0):
    rows = []
    for rt in ("GOAL", "STRETCH"):
        r = {k: ladder for k in YEAR_KEYS}
        r.update({"activity_id": aid, "name": name, "row_type": rt,
                  "kind": kind, "description": "", "current": None})
        rows.append(r)
    return rows


# projects (Activities-tab source). Some have a ladder row, some DON'T.
PROJECTS = [
    ("1.1",   "MAP Platform Development", "1", True),
    ("1.1.1", "AI Certification-to-Course Matching", "1", False),   # X.Y.Z, no ladder
    ("4.1",   "Veteran Sprint", "4", True),
    ("4.1.1", "29 Palms Marine Corps Base Demo", "4", True),        # X.Y.Z, has ladder
    ("4.7",   "CPL Legislative Advocacy (2026 Session)", "4", False),  # no ladder
]

supabase_rows = []
for aid, nm in ACT.items():
    supabase_rows += _goal_pair(aid, nm, "activity")
for pid, nm, home, has_ladder in PROJECTS:
    if has_ladder:
        supabase_rows += _goal_pair(pid, nm, "project", ladder=5)

projects = [{"id": pid, "name": nm, "activity": ACT[home],
             "description": f"{pid} brief", "kpi_metric": 0}
            for pid, nm, home, _ in PROJECTS]
associations = []  # none — exercises the prefix-backfill path too

activities, workplan_goals, annual_goals = gen.build_workplan_goals_from_supabase(
    supabase_rows, associations, projects)
ag_by_id = {r["id"]: r for r in annual_goals}

# 1. EVERY project is reflected — including the two with no ladder row.
check("all 5 projects appear in annual_goals",
      sorted(ag_by_id.keys()), ["1.1", "1.1.1", "4.1", "4.1.1", "4.7"])
check("no-ladder project 4.7 IS reflected", "4.7" in ag_by_id, True)
check("no-ladder project 1.1.1 IS reflected", "1.1.1" in ag_by_id, True)

# 2. No-ladder projects overlay a blank (zeroed) ladder; laddered ones keep theirs.
check("4.7 (no ladder) goal total is 0", ag_by_id["4.7"]["goal"]["total"], 0)
check("1.1.1 (no ladder) goal total is 0", ag_by_id["1.1.1"]["goal"]["total"], 0)
check("4.1 (has ladder) goal total is non-zero", ag_by_id["4.1"]["goal"]["total"] > 0, True)

# 3. No-ladder projects still carry their editable title + description.
check("4.7 keeps its project name", ag_by_id["4.7"]["name"],
      "CPL Legislative Advocacy (2026 Session)")
check("4.7 keeps its project description", ag_by_id["4.7"]["description"], "4.7 brief")

# 4. Render: X.Y.Z rows nest (↳ + accent border) under their X.Y parent; X.Y don't.
html = gen.render_annual_goals_table_html(annual_goals, activities)
check("every project id renders as a row",
      all(pid in html for pid, *_ in PROJECTS), True)
check("nesting marker '↳' appears exactly once per X.Y.Z row (2)", html.count("↳ "), 2)
check("nesting accent border appears exactly twice (the 2 X.Y.Z rows)",
      html.count("border-left:3px solid var(--seal-blue);"), 2)

# 5. Order nests each subsidiary right after its parent.
order = [r["id"] for r in annual_goals]
check("1.1.1 immediately follows 1.1", order.index("1.1.1") == order.index("1.1") + 1, True)
check("4.1.1 immediately follows 4.1", order.index("4.1.1") == order.index("4.1") + 1, True)

# 6. Blank-ladder rows are NOT ladder-editable (an edit would PATCH 0 wg rows and
#    silently revert); their title + description STAY editable (they PATCH projects).
check("no-ladder 4.7 has no editable year cell",
      'data-editable="1" data-aid="4.7"' in html, False)
check("no-ladder 1.1.1 has no editable year cell",
      'data-editable="1" data-aid="1.1.1"' in html, False)
check("no-ladder 4.7 has no manual-current editor",
      'data-current-edit="1" data-aid="4.7"' in html, False)
check("laddered 4.1 keeps its editable year cell",
      'data-editable="1" data-aid="4.1"' in html, True)
check("no-ladder 4.7 title stays editable",
      'data-title-edit="1" data-pid="4.7"' in html, True)
check("no-ladder 4.7 description stays editable",
      'data-desc-edit="1" data-pid="4.7"' in html, True)
# 7. A zeroed ladder is NOT mis-flagged as a percentage.
check("no-ladder 4.7 is_percentage is False", ag_by_id["4.7"]["is_percentage"], False)


if failures:
    print(f"\n{len(failures)} FAILURE(S): {failures}")
    sys.exit(1)
print(f"\nAll {20} checks passed.")
