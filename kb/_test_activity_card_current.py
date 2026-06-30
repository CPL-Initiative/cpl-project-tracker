"""
Activity-card metric live-sync — assertions (Session 86, SkyGuy).

Wire the Activity Metrics sub-activity card's big number ('metric') to the same
authoritative Current the Annual Workplan tab shows, so the card stops drifting
from the headline KPI:
  * mapped sub-activities (PID_TO_KPI_KEY) → the live MERGED headline KPI value
    (verbatim display string), metric_source='live';
  * unmapped sub-activities with an EXPLICIT workplan_goals.current → that manual
    value, metric_source='workplan';
  * everything else keeps its Excel kpi_metric (no regression).

Also guards the _parse_metric_num k/M/B/$ suffix robustness (without it a
'100k'/'$269M' live string parsed to None and silently disabled the bar).

No Supabase / Excel dependency — everything is fed in-memory.

Run from repo root:  python3 kb/_test_activity_card_current.py
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


# ── _parse_metric_num: magnitude suffixes + the existing plain cases ─────────
check("_parse_metric_num plain", e._parse_metric_num("43,630") == 43630.0)
check("_parse_metric_num k suffix", e._parse_metric_num("100k") == 100000.0)
check("_parse_metric_num M + $", e._parse_metric_num("$269M") == 269000000.0)
check("_parse_metric_num B + decimal", e._parse_metric_num("1.3B") == 1.3e9)
check("_parse_metric_num percent strips", e._parse_metric_num("85%") == 85.0)
check("_parse_metric_num blank -> None", e._parse_metric_num("") is None)
check("_parse_metric_num dash -> None", e._parse_metric_num("—") is None)

# ── apply_live_activity_current ──────────────────────────────────────────────
# activity_kpis shaped like build_activity_kpis() output.
def make_kpis():
    return [
        {"activity_id": "Activity 3", "activity_name": "Activity 3", "kpis": [
            {"id": "3.1", "name": "Offers & Awards", "metric": "43,630", "unit": "students"},
            {"id": "3.9", "name": "Unmapped w/ manual current", "metric": "10", "unit": "things"},
            {"id": "3.8", "name": "Unmapped no current", "metric": "5", "unit": "things"},
            {"id": "3.7", "name": "Unmapped percent", "metric": "50%", "unit": "pct"},
        ]},
        {"activity_id": "Activity 4", "activity_name": "Activity 4", "kpis": [
            {"id": "4.1", "name": "Sprints composite", "metric": "4", "unit": "active sprints"},
        ]},
    ]

kpis = {"cumulative_students": {"value": "48,158"}}
annual_goals = [
    {"id": "3.1", "current": {"total": 43630.0}, "current_manual_explicit": True,
     "is_percentage": False},
    {"id": "3.9", "current": {"total": 9001.0}, "current_manual_explicit": True,
     "is_percentage": False},
    {"id": "3.8", "current": {"total": 5.0}, "current_manual_explicit": False,
     "is_percentage": False},
    {"id": "3.7", "current": {"total": 0.5}, "current_manual_explicit": True,
     "is_percentage": True},
]
ak = make_kpis()
e.apply_live_activity_current(ak, annual_goals, kpis,
                              live_data={"scraped_at": "2026-06-30T04:51:00"})
g3 = ak[0]["kpis"]
by = {k["id"]: k for k in g3}

check("3.1 mapped -> live headline value",
      by["3.1"]["metric"] == "48,158" and by["3.1"].get("metric_source") == "live")
check("3.1 carries the scrape date", by["3.1"].get("metric_as_of") == "2026-06-30")
check("3.9 unmapped+explicit -> manual workplan current",
      by["3.9"]["metric"] == "9,001" and by["3.9"].get("metric_source") == "workplan")
check("3.8 unmapped+NO explicit current -> kept (no regression)",
      by["3.8"]["metric"] == "5" and "metric_source" not in by["3.8"])
check("3.7 percentage sub-activity -> NOT overridden",
      by["3.7"]["metric"] == "50%" and "metric_source" not in by["3.7"])
check("4.1 sprint composite -> untouched",
      ak[1]["kpis"][0]["metric"] == "4" and "metric_source" not in ak[1]["kpis"][0])

# ── Mapped but the KPI has no live value → keep manual (graceful) ────────────
ak2 = make_kpis()
e.apply_live_activity_current(ak2, annual_goals, {"cumulative_students": {"value": ""}})
check("3.1 mapped but empty live value -> kept",
      ak2[0]["kpis"][0]["metric"] == "43,630" and
      "metric_source" not in ak2[0]["kpis"][0])

# ── Empty / None inputs are safe no-ops ──────────────────────────────────────
e.apply_live_activity_current(None, annual_goals, kpis)
e.apply_live_activity_current([], None, None)
check("None/empty inputs are safe", True)

print()
if fails:
    print(f"{len(fails)} FAILED: {fails}")
    sys.exit(1)
print("All activity-card-current assertions passed.")
