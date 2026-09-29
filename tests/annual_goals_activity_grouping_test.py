#!/usr/bin/env python3
"""Annual Workplan Goals table — Activity grouping / header contiguity guard.

Guards the failure mode fixed 2026-07-27 (SkyElemental follow-up): the
comprehensive Annual Workplan Goals table grouped each row by the SMALLEST
associated Activity id (`activity_ids[0]`) instead of the project's HOME
Activity (its `workplan_activity` spine). A cross-linked project — e.g. 2.3,
whose home is Activity 2 but which contributes to Activities 1-4 — was labeled
"Activity 1", so the section header for an Activity repeated + interleaved
(Activity 1 ×3, Activity 3 ×3 on the real data). The editable Activity headers
(#902) made that visually obvious.

The fix (build_workplan_goals_from_supabase):
  * the group label sources from the HOME Activity (_activity_num_from_workplan
    over projects.workplan_activity — the same authoritative key
    build_activity_kpis uses), NOT activity_ids[0];
  * annual_goals is sorted by (home Activity, natural id) so each Activity
    header renders exactly once even if a project is re-homed across its
    id-prefix boundary;
  * the "Contributes to" chips (activity_ids) still carry ALL associations —
    only the grouping is homed.

Not wired into `npm test` (the JS runner only discovers *.test.js) because it
imports the Python pipeline (openpyxl). Run from the repo root:

    python3 tests/annual_goals_activity_grouping_test.py
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


# ── Fixture: mirrors the real store shape (2026-07-27) ────────────────────────
YEAR_KEYS = ["yr_2025_26", "yr_2026_27", "yr_2027_28", "yr_2028_29", "yr_2029_30"]

ACT_NAMES = {
    "1": "Activity 1: AI-Enhanced CPL Infrastructure",
    "2": "Activity 2: Faculty Workgroups & Credit Recommendations",
    "3": "Activity 3: Scale CPL Access, Awards, and Procedures",
    "4": "Activity 4: Coordinate CPL Sprints, Targeted Projects, Professional "
         "Learning, and Strategic Partnerships",
}


def _goal_pair(aid, name, kind, desc=""):
    """A GOAL + STRETCH workplan_goals row pair with zeroed ladders."""
    base = {k: 0 for k in YEAR_KEYS}
    rows = []
    for rt in ("GOAL", "STRETCH"):
        r = dict(base)
        r.update({"activity_id": aid, "name": name, "row_type": rt,
                  "kind": kind, "description": desc, "current": None})
        rows.append(r)
    return rows


supabase_rows = []
# Activity (kind='activity') rows — the authoritative title/desc store.
for aid, nm in ACT_NAMES.items():
    supabase_rows += _goal_pair(aid, nm, "activity", desc=f"Desc for {aid}")

# Project (kind='project') rows. The id-prefix is NOT authoritative — home
# comes from projects.workplan_activity below.
PROJECTS = [
    # id,     name,                     home Activity (workplan_activity)
    ("1.1", "Platform build",           "1"),
    ("2.1", "Faculty workgroup A",      "2"),
    ("2.3", "Cross-linked workgroup",   "2"),   # the culprit: assoc [1,2,3,4]
    ("3.1", "Data infra",               "3"),
    ("4.3", "Partnership sprint",       "4"),   # assoc [3,4] → was "Activity 3"
    ("9.9", "Re-homed legacy item",     "1"),   # id-prefix 9, HOME Activity 1
]
for pid, nm, _home in PROJECTS:
    supabase_rows += _goal_pair(pid, nm, "project")

# projects table — carries the `activity` (= workplan_activity) home spine.
projects = [
    {"id": pid, "name": nm, "activity": ACT_NAMES[home],
     "description": f"{pid} brief", "kpi_metric": 0}
    for pid, nm, home in PROJECTS
]

# Associations (project_id, activity_id, is_primary) — the N-to-N cross-links.
ASSOC = {
    "1.1": ["1", "2", "3", "4"],
    "2.1": ["2", "4"],
    "2.3": ["1", "2", "3", "4"],
    "3.1": ["3"],
    "4.3": ["3", "4"],
    "9.9": ["1"],
}
HOME_OF = {p[0]: p[2] for p in PROJECTS}
associations = []
for pid, aids in ASSOC.items():
    for aid in aids:
        # Mark the HOME as primary where present (mirrors the backfill).
        associations.append({"project_id": pid, "activity_id": aid,
                             "is_primary": aid == HOME_OF[pid]})

activities, workplan_goals, annual_goals = gen.build_workplan_goals_from_supabase(
    supabase_rows, associations, projects
)

ag_by_id = {r["id"]: r for r in annual_goals}


# ── 1. The cross-linked project groups under its HOME Activity, not [0] ───────
check("2.3 groups under home Activity 2 (not the smallest assoc, Activity 1)",
      ag_by_id["2.3"]["activity"], ACT_NAMES["2"])
check("4.3 groups under home Activity 4 (not the smallest assoc, Activity 3)",
      ag_by_id["4.3"]["activity"], ACT_NAMES["4"])
check("1.1 groups under Activity 1",
      ag_by_id["1.1"]["activity"], ACT_NAMES["1"])

# ── 2. The group label is the LIVE Supabase Activity name (a rename flows) ────
# 2.3's label is the exact store name for Activity 2, so editing the Activity
# title flows into this table's header.
check("2.3 label == the live store Activity-2 name (rename flows)",
      ag_by_id["2.3"]["activity"], ACT_NAMES["2"])

# ── 3. The "Contributes to" chips still carry ALL associations ────────────────
check("2.3 chips still list every association (grouping is homed, chips are not)",
      ag_by_id["2.3"]["activity_ids"], ["1", "2", "3", "4"])
check("4.3 chips still list every association",
      ag_by_id["4.3"]["activity_ids"], ["3", "4"])

# ── 4. Header sequence is contiguous: each Activity header renders once ───────
# Reproduce the renderer's header emission (a header prints whenever
# row["activity"] changes from the previous row).
header_seq = []
current = object()
for r in annual_goals:
    if r["activity"] != current:
        current = r["activity"]
        header_seq.append(current)
check("Activity headers render exactly 4 times (was 9 under the bug)",
      len(header_seq), 4)
check("Header sequence is 1,2,3,4 in order (contiguous, no repeats)",
      header_seq, [ACT_NAMES["1"], ACT_NAMES["2"], ACT_NAMES["3"], ACT_NAMES["4"]])
check("No Activity label appears more than once (no split headers)",
      len(header_seq), len(set(header_seq)))

# ── 5. A re-homed project (id-prefix ≠ home) sorts into its HOME block ─────────
check("9.9 (id-prefix 9) groups under its HOME Activity 1",
      ag_by_id["9.9"]["activity"], ACT_NAMES["1"])
order = [r["id"] for r in annual_goals]
check("9.9 sorts inside the Activity-1 block (before any Activity-2 row)",
      order.index("9.9") < order.index("2.1"), True)

# ── 6. Full row order is (home Activity, natural id) ──────────────────────────
check("annual_goals ordered by (home Activity, natural id)",
      order, ["1.1", "9.9", "2.1", "2.3", "3.1", "4.3"])


if failures:
    print(f"\n{len(failures)} FAILURE(S): {failures}")
    sys.exit(1)
print(f"\nAll {12} checks passed.")
