"""
Annual Workplan "Current" hybrid + authoritative titles — assertions
(Session 85, SkyLight).

The Annual Workplan tab is now the authoritative source:
  * mapped sub-activities (PID_TO_KPI_KEY) drive "Current" from the LIVE merged
    headline KPI value (read-only, matches the headline card by construction);
  * unmapped sub-activities use a manual Current stored in
    workplan_goals.current (GOAL row), falling back to Excel kpi_metric;
  * sub-activity titles render from projects.name (single store).

These guard the generator helpers + the build + the render, with NO Supabase
or Excel dependency (everything is fed in-memory).

Run from repo root:  python3 kb/_test_workplan_current_hybrid.py
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


# ── _row_current: GOAL canonical, STRETCH fallback, None when absent ─────────
check("_row_current reads GOAL.current",
      e._row_current({"current": "1234"}, {"current": "9"}) == 1234.0)
check("_row_current strips commas",
      e._row_current({"current": "12,345"}, None) == 12345.0)
check("_row_current falls back to STRETCH when GOAL null",
      e._row_current({"current": None}, {"current": 42}) == 42.0)
check("_row_current None when neither has it",
      e._row_current({"yr_2025_26": "5"}, {"yr_2025_26": "5"}) is None)
check("_row_current None on empty string",
      e._row_current({"current": ""}, {"current": ""}) is None)
check("_row_current None on garbage (caller falls back to kpi_metric)",
      e._row_current({"current": "n/a"}, None) is None)

# ── Build the goals from in-memory Supabase-shaped rows ──────────────────────
# 3.1 = mapped (cumulative_students), manual current present (43630) as the
#       baseline; 1.1 = unmapped, manual current present (8); 3.4 = unmapped,
#       NO current column → falls back to Excel kpi_metric.
rows = [
    {"activity_id": "3", "name": "Activity 3", "row_type": "GOAL", "kind": "activity",
     "yr_2025_26": "0", "total": "0"},
    {"activity_id": "3", "name": "Activity 3", "row_type": "STRETCH", "kind": "activity",
     "yr_2025_26": "0", "total": "0"},
    {"activity_id": "1", "name": "Activity 1", "row_type": "GOAL", "kind": "activity",
     "yr_2025_26": "0", "total": "0"},
    {"activity_id": "1", "name": "Activity 1", "row_type": "STRETCH", "kind": "activity",
     "yr_2025_26": "0", "total": "0"},
    {"activity_id": "3.1", "name": "WPG-name 3.1", "row_type": "GOAL", "kind": "project",
     "yr_2025_26": "40000", "total": "716000", "current": "43630"},
    {"activity_id": "3.1", "name": "WPG-name 3.1", "row_type": "STRETCH", "kind": "project",
     "yr_2025_26": "80000", "total": "1260000"},
    {"activity_id": "1.1", "name": "MAP Platform Development", "row_type": "GOAL", "kind": "project",
     "yr_2025_26": "4", "total": "78", "current": "8"},
    {"activity_id": "1.1", "name": "MAP Platform Development", "row_type": "STRETCH", "kind": "project",
     "yr_2025_26": "8", "total": "140"},
    {"activity_id": "3.4", "name": "Student Impact Rate Survey", "row_type": "GOAL", "kind": "project",
     "yr_2025_26": "0.7", "total": "4.05"},
    {"activity_id": "3.4", "name": "Student Impact Rate Survey", "row_type": "STRETCH", "kind": "project",
     "yr_2025_26": "0.8", "total": "4.45"},
]
assocs = [
    {"project_id": "3.1", "activity_id": "3"},
    {"project_id": "1.1", "activity_id": "1"},
    {"project_id": "3.4", "activity_id": "3"},
]
# projects.name is authoritative — 3.1's projects.name differs from the wpg name
# to prove the repoint wins. 3.4 has NO current column, kpi_metric=0.65 fallback.
projects = [
    {"id": "3.1", "name": "PROJ-name 3.1 (authoritative)", "kpi_metric": "999"},
    {"id": "1.1", "name": "MAP Platform Development", "kpi_metric": "111"},
    {"id": "3.4", "name": "Student Impact Rate Survey", "kpi_metric": "0.65"},
]

acts, wpg, annual = e.build_workplan_goals_from_supabase(rows, assocs, projects, live_data=None)
ag = {r["id"]: r for r in annual}

check("annual_goals has the 3 project rows", set(ag) == {"3.1", "1.1", "3.4"})
check("title repointed to projects.name (3.1)",
      ag["3.1"]["name"] == "PROJ-name 3.1 (authoritative)")
check("current_kpi_key stamped on mapped 3.1",
      ag["3.1"]["current_kpi_key"] == "cumulative_students")
check("current_kpi_key None on unmapped 1.1",
      ag["1.1"]["current_kpi_key"] is None)
check("manual current baseline from workplan_goals.current (1.1 == 8)",
      ag["1.1"]["current"]["2025-26"] == 8.0 and ag["1.1"]["current"]["total"] == 8.0)
check("manual current falls back to Excel kpi_metric when column absent (3.4 == 0.65)",
      abs(ag["3.4"]["current"]["2025-26"] - 0.65) < 1e-9)
check("mapped 3.1 manual baseline uses its current column, NOT kpi_metric (43630)",
      ag["3.1"]["current"]["2025-26"] == 43630.0)
check("current_source defaults to manual before live pass",
      all(r["current_source"] == "manual" for r in annual))
check("3.4 flagged is_percentage", ag["3.4"]["is_percentage"] is True)

# ── Live post-pass: mapped rows flip to live; unmapped untouched ─────────────
kpis = {
    "cumulative_students": {"value": "48,142"},
    "transcripted_units": {"value": "100k"},
    # credit_recommendations intentionally absent → 2.1 would stay manual
}
live_data = {"scraped_at": "2026-06-30T23:35:27.181Z"}
e.apply_live_workplan_current(annual, kpis, live_data)

check("mapped 3.1 flipped to live", ag["3.1"]["current_source"] == "live")
check("live display = verbatim KPI string (48,142)",
      ag["3.1"]["current_live_display"] == "48,142")
check("live as_of trimmed to date", ag["3.1"]["current_as_of"] == "2026-06-30")
check("unmapped 1.1 stays manual after live pass",
      ag["1.1"]["current_source"] == "manual")
check("unmapped 3.4 stays manual after live pass",
      ag["3.4"]["current_source"] == "manual")

# A mapped id whose KPI has no live value stays manual (graceful degrade).
rows2 = rows + [
    {"activity_id": "2", "name": "Activity 2", "row_type": "GOAL", "kind": "activity", "yr_2025_26": "0", "total": "0"},
    {"activity_id": "2", "name": "Activity 2", "row_type": "STRETCH", "kind": "activity", "yr_2025_26": "0", "total": "0"},
    {"activity_id": "2.1", "name": "Statewide Credit Recommendations", "row_type": "GOAL", "kind": "project", "yr_2025_26": "200", "total": "3000", "current": "288"},
    {"activity_id": "2.1", "name": "Statewide Credit Recommendations", "row_type": "STRETCH", "kind": "project", "yr_2025_26": "400", "total": "8000"},
]
assocs2 = assocs + [{"project_id": "2.1", "activity_id": "2"}]
projects2 = projects + [{"id": "2.1", "name": "Statewide Credit Recommendations", "kpi_metric": "288"}]
_a, _w, annual2 = e.build_workplan_goals_from_supabase(rows2, assocs2, projects2, None)
e.apply_live_workplan_current(annual2, kpis, live_data)  # no credit_recommendations key
ag2 = {r["id"]: r for r in annual2}
check("mapped 2.1 with no live KPI value stays manual (288)",
      ag2["2.1"]["current_source"] == "manual" and ag2["2.1"]["current"]["2025-26"] == 288.0)

# ── Render: live cell read-only w/ badge; manual cell editable; title span ───
html = e.render_annual_goals_table_html(annual, activities=acts)
check("render: live badge present", 'wpg-live-badge' in html and '>live' in html)
check("render: live value shown verbatim", '48,142' in html)
check("render: manual Current cell is editable (data-current-edit)",
      'data-current-edit="1"' in html)
check("render: live Current cell is NOT editable",
      html.count('data-current-edit="1"') == 2)  # only 1.1 + 3.4 (manual); 3.1 live
check("render: editable title span", 'data-title-edit="1"' in html)
check("render: title-total mirror marker", 'data-current-total="1"' in html)
check("render: GOAL/STRETCH editor untouched (data-editable present)",
      'data-editable="1"' in html)
check("render: authoritative title text present",
      'PROJ-name 3.1 (authoritative)' in html)

print()
if fails:
    print(f"{len(fails)} FAILURE(S): " + ", ".join(fails))
    sys.exit(1)
print("All workplan-current-hybrid assertions passed.")
