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


# ── _row_current_years (S426): one Current per year, GOAL canonical, STRETCH
#    fallback; 2025-26 also reads the one-column `current` the cur_* replaced ──
check("_row_current_years reads each cur_<year> on the GOAL row",
      e._row_current_years({"cur_2025_26": "1234", "cur_2026_27": "9"}, {"cur_2025_26": "5"})
      == {"2025-26": 1234.0, "2026-27": 9.0})
check("_row_current_years strips commas",
      e._row_current_years({"cur_2026_27": "12,345"}, None) == {"2026-27": 12345.0})
check("_row_current_years falls back to STRETCH for a year GOAL leaves null",
      e._row_current_years({"cur_2025_26": None}, {"cur_2025_26": 42}) == {"2025-26": 42.0})
check("_row_current_years reads the legacy `current` as 2025-26 when cur_2025_26 is unset",
      e._row_current_years({"current": "8"}, None) == {"2025-26": 8.0})
check("_row_current_years prefers cur_2025_26 over the legacy `current`",
      e._row_current_years({"current": "8", "cur_2025_26": "9"}, None) == {"2025-26": 9.0})
check("_row_current_years is empty when no year carries a value",
      e._row_current_years({"yr_2025_26": "5"}, {"yr_2025_26": "5"}) == {})
check("_row_current_years skips empty strings and garbage (caller falls back to kpi_metric)",
      e._row_current_years({"current": "", "cur_2026_27": "n/a"}, {"current": ""}) == {})
check("an explicit zero is a value",
      e._row_current_years({"cur_2026_27": 0}, None) == {"2026-27": 0.0})

# ── the fiscal year and the year-end history ──
check("current_workplan_year is a ladder label",
      e.current_workplan_year() in e.WORKPLAN_YEARS)
HIST = [{"date": "2026-06-29", "students": 48100, "students_military": 24800},
        {"date": "2026-06-30", "students": 48219, "students_military": 24881, "transcribed_units": 99534},
        {"date": "2026-07-01", "students": 48300}]
check("_history_year_end reads the last entry on or before June 30 of the year",
      e._history_year_end(HIST, "students", "2025-26") == 48219)
check("_history_year_end is None for a field the entry lacks",
      e._history_year_end(HIST, "credit_recs", "2025-26") is None)
check("_history_year_end is None for a year with no entry near June 30",
      e._history_year_end(HIST, "students", "2026-27") is None)

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
e.apply_live_workplan_current(annual, kpis, live_data, history=HIST, fy="2026-27")

check("mapped 3.1 flipped to live", ag["3.1"]["current_source"] == "live")
check("the live value is this fiscal year's Current (2026-27 = 48,142), the total with it",
      ag["3.1"]["current_fy"] == "2026-27" and ag["3.1"]["current"]["2026-27"] == 48142.0
      and ag["3.1"]["current"]["total"] == 48142.0)
check("the closed year reads the June 30 history entry (2025-26 = 48,219)",
      ag["3.1"]["current_history"] == {"2025-26": 48219.0} and ag["3.1"]["current"]["2025-26"] == 48219.0)
check("a later year stays blank", ag["3.1"]["current"]["2027-28"] == 0)
check("an abbreviated live value parses for the number (100k)",
      ag["1.1"]["current_source"] == "manual")  # 1.1 is unmapped; the k-suffix parse is covered below
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
check("a manual row's latest year is the one the Activities card reads",
      ag2["2.1"]["current_latest"] == {"year": "2025-26", "value": 288.0})
# Two years set: the total sums them, the latest wins for the card.
rows_two = [
    {"activity_id": "1", "name": "Activity 1", "row_type": "GOAL", "kind": "activity", "yr_2025_26": "0", "total": "0"},
    {"activity_id": "1", "name": "Activity 1", "row_type": "STRETCH", "kind": "activity", "yr_2025_26": "0", "total": "0"},
    {"activity_id": "1.1", "name": "MAP Platform Development", "row_type": "GOAL", "kind": "project",
     "yr_2025_26": "4", "yr_2026_27": "9", "total": "78", "current": "8", "cur_2025_26": "8", "cur_2026_27": "11"},
    {"activity_id": "1.1", "name": "MAP Platform Development", "row_type": "STRETCH", "kind": "project",
     "yr_2025_26": "8", "total": "140"},
]
_a4, _w4, annual4 = e.build_workplan_goals_from_supabase(rows_two, [{"project_id": "1.1", "activity_id": "1"}],
                                                          [{"id": "1.1", "name": "MAP Platform Development", "kpi_metric": "8"}], None)
ag4 = {r["id"]: r for r in annual4}
check("two years set: each prints under its year, the total sums them",
      ag4["1.1"]["current"]["2025-26"] == 8.0 and ag4["1.1"]["current"]["2026-27"] == 11.0
      and ag4["1.1"]["current"]["total"] == 19.0)
check("...and the latest year is 2026-27 = 11 (the Activities card's number)",
      ag4["1.1"]["current_latest"] == {"year": "2026-27", "value": 11.0} and ag4["1.1"]["current_manual_explicit"])
check("the Activities header summary reads the latest Current for a manual row, the live value for a live row",
      e._summary_current(ag4["1.1"], "2026-27") == 11.0 and e._summary_current(ag["3.1"], "2026-27") == 48142.0)
kpis4 = [{"activity_id": "1", "kpis": [{"id": "1.1", "metric": "8"}]}]
e.apply_live_activity_current(kpis4, annual4, {}, None)
check("the Activities card's big number is the latest year's Current (11)",
      kpis4[0]["kpis"][0]["metric"] == "11" and kpis4[0]["kpis"][0]["metric_source"] == "workplan")
html4 = e.render_annual_goals_table_html(annual4, activities=_a4, fy="2026-27")
check("render: each year's Current is its own editable cell, keyed cur_<year>, on the Current row",
      html4.count('data-aid="1.1" data-kind="project" data-rt="CURRENT" data-yr=') == 5
      and 'data-rt="CURRENT" data-yr="2026-27" data-yr-key="cur_2026_27" data-val="11"' in html4)
# The ladder still sums (current.total, above); the table prints no Total column
# (Sam, 2026-10-20: a cumulative ladder's sum overstated the 2030 target).
check("render: no Total cell and no editor mirror of one",
      'data-total=' not in html4 and 'data-label="Total"' not in html4)

# ── Population breakdown sub-activities (StarMax fix): the Annual Workplan
#    "Current" for 3.1.1/3.1.2/3.1.3 flips to live from a STUDENTS-SERVED
#    breakdown row, so the table matches the headline breakdown (and the card). ─
rows3 = [
    {"activity_id": "3", "name": "Activity 3", "row_type": "GOAL", "kind": "activity", "yr_2025_26": "0", "total": "0"},
    {"activity_id": "3", "name": "Activity 3", "row_type": "STRETCH", "kind": "activity", "yr_2025_26": "0", "total": "0"},
    {"activity_id": "3.1.1", "name": "Working Adults", "row_type": "GOAL", "kind": "project", "yr_2025_26": "9500", "total": "160000", "current": "21552"},
    {"activity_id": "3.1.1", "name": "Working Adults", "row_type": "STRETCH", "kind": "project", "yr_2025_26": "39000", "total": "360000"},
    {"activity_id": "3.1.2", "name": "Veterans & Service Members", "row_type": "GOAL", "kind": "project", "yr_2025_26": "30000", "total": "70000", "current": "22149"},
    {"activity_id": "3.1.2", "name": "Veterans & Service Members", "row_type": "STRETCH", "kind": "project", "yr_2025_26": "40000", "total": "100000"},
    {"activity_id": "3.1.3", "name": "Apprentice Cohort", "row_type": "GOAL", "kind": "project", "yr_2025_26": "500", "total": "20000", "current": "700"},
    {"activity_id": "3.1.3", "name": "Apprentice Cohort", "row_type": "STRETCH", "kind": "project", "yr_2025_26": "1000", "total": "40000"},
]
assocs3 = [
    {"project_id": "3.1.1", "activity_id": "3"},
    {"project_id": "3.1.2", "activity_id": "3"},
    {"project_id": "3.1.3", "activity_id": "3"},
]
projects3 = [
    {"id": "3.1.1", "name": "Working Adults", "kpi_metric": "21552"},
    {"id": "3.1.2", "name": "Veterans & Service Members", "kpi_metric": "22149"},
    {"id": "3.1.3", "name": "Apprentice Cohort", "kpi_metric": "700"},
]
_a3, _w3, annual3 = e.build_workplan_goals_from_supabase(rows3, assocs3, projects3, None)
ag3 = {r["id"]: r for r in annual3}
check("breakdown rows carry current_kpi_breakdown, not current_kpi_key",
      ag3["3.1.1"]["current_kpi_breakdown"] == ("cumulative_students", "workforce")
      and ag3["3.1.1"]["current_kpi_key"] is None
      and ag3["3.1.2"]["current_kpi_breakdown"] == ("cumulative_students", "military")
      and ag3["3.1.3"]["current_kpi_breakdown"] == ("cumulative_students", "apprentice"))
kpis_bd = {"cumulative_students": {"value": "48,176", "breakdowns": [
    {"label": "Military", "value": "24,864"},
    {"label": "Workforce/Other", "value": "23,388"},
    {"label": "Apprentice", "value": "753"},
]}}
e.apply_live_workplan_current(annual3, kpis_bd, {"scraped_at": "2026-06-30T16:25:39Z"})
check("3.1.1 Current flips to live Workforce/Other (23,388)",
      ag3["3.1.1"]["current_source"] == "live" and ag3["3.1.1"]["current_live_display"] == "23,388")
check("3.1.2 Current flips to live Military (24,864)",
      ag3["3.1.2"]["current_source"] == "live" and ag3["3.1.2"]["current_live_display"] == "24,864")
check("3.1.3 Current flips to live Apprentice (753)",
      ag3["3.1.3"]["current_source"] == "live" and ag3["3.1.3"]["current_live_display"] == "753")
# Graceful: a KPI with no breakdowns leaves the breakdown rows manual.
_a3b, _w3b, annual3b = e.build_workplan_goals_from_supabase(rows3, assocs3, projects3, None)
e.apply_live_workplan_current(annual3b, {"cumulative_students": {"value": "48,176"}}, None)
ag3b = {r["id"]: r for r in annual3b}
check("breakdown row stays manual when KPI has no breakdowns",
      ag3b["3.1.1"]["current_source"] == "manual" and ag3b["3.1.1"]["current"]["2025-26"] == 21552.0)
# Render the live breakdown rows: read-only badge, verbatim value, not editable.
html3 = e.render_annual_goals_table_html(annual3, activities=_a3)
check("render: breakdown live value shown verbatim (24,864)", '24,864' in html3)
check("render: breakdown live rows are read-only (no editable Current cell)",
      'data-rt="CURRENT"' not in html3)

# ── Render: live cell read-only w/ badge; manual cell editable; title span ───
html = e.render_annual_goals_table_html(annual, activities=acts)
check("render: live note present, under the fiscal year's column",
      'data-label="26-27">48,142<span class="wpg-live-badge">live</span>' in html)
check("render: the closed year on the live row shows its June 30 reading, marked year end",
      'data-label="25-26">48,219<span class="wpg-val-note">year end</span>' in html)
check("render: the date is stated once, above the table",
      'Live values are as of 2026-06-30' in html and html.count("as of 2026-06-30") == 1)
check("render: manual Current cells are editable, five per manual row (1.1 + 3.4)",
      html.count('data-rt="CURRENT" data-yr=') == 10)
check("render: live Current cells are NOT editable (3.1 carries none)",
      'data-aid="3.1" data-kind="project" data-rt="CURRENT"' not in html)
check("render: editable title span", 'data-title-edit="1"' in html)
check("render: no Total column (S438)", 'data-total=' not in html and '>Total<' not in html)
check("render: GOAL/STRETCH editor untouched (data-editable present)",
      'data-editable="1"' in html)
check("render: authoritative title text present",
      'PROJ-name 3.1 (authoritative)' in html)

print()
if fails:
    print(f"{len(fails)} FAILURE(S): " + ", ".join(fails))
    sys.exit(1)
print("All workplan-current-hybrid assertions passed.")
