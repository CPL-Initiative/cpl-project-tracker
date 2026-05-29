"""
Load the project list from Supabase as the dashboard generator's
source-of-truth, with a daily-cached snapshot fallback for Supabase-outage
resilience.

After PR-4 of the Excel→Supabase Phase 2 migration, excel_to_dashboard.py
loads the 34 "real" projects (the grid cards, ids 1.1 … 5.8) from
`public.projects` instead of reading them out of the Excel Project List sheet.

Two things are deliberately NOT in scope here and stay Excel-sourced during
Phase 2 (they are not project *data* and are not in the Supabase table):
  - The `D.*` KPI-helper rows (D.1 … D.15) — hidden metric rows the cohort
    KPI composites read (D.1/D.2/D.3); merged back in by the generator.
  - `excel_row` — the Excel cell pointer behind the "Open in Excel for the
    Web" deep-link buttons; enriched by the generator from the workbook.
The KPI goal/stretch ladder is sourced from `public.workplan_goals`
(`kind='project'`, the Phase-1 source-of-truth), joined by the generator.

Fallback behavior (mirrors kb/_load_workplan_goals.py — Sam's call: subtle):
  - Supabase fetch succeeds → write `kb/projects_snapshot.json` (the daily
    cron commits it; subsequent runs use it on failure), return rows with
    today's date stamp + source="supabase"
  - Supabase fetch fails AND snapshot exists → read snapshot, log a warning
    to stdout, return rows with the snapshot's `_fetched_at` date stamp +
    source="snapshot" (the rendered projects section gets a small "Data as of
    <date>" line so the staleness is visible without being loud)
  - Both fail (no service key OR Supabase down AND no snapshot file) →
    raise RuntimeError (the generator then falls back to the Excel reader as
    the ultimate safety net — see excel_to_dashboard.py main()).

Auth:
  SUPABASE_URL          (default https://hvuwhnbuahrtptokpqfh.supabase.co)
  SUPABASE_SERVICE_KEY  (required for the fresh fetch path)
"""
from __future__ import annotations

import json
import os
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
SNAPSHOT_PATH = HERE / "projects_snapshot.json"

SUPABASE_URL = os.environ.get(
    "SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co"
).rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

# The 21 data columns the generator needs. kpi_target_2026/2030 (NULL, unused —
# the ladder comes from workplan_goals) and created_at/updated_at are skipped.
SELECT_COLUMNS = (
    "id,name,description,workplan_activity,vision_2030_action,cpl_goal,"
    "budget_source,budget,lead,team,status,percent_complete,"
    "start_date,end_date,milestones,latest_update,update_date,"
    "kpi_metric,kpi_unit,wp_notes,kpi_order"
)


def _fetch_supabase() -> list[dict]:
    """Fetch the projects table from Supabase REST. Raises on any failure."""
    if not SUPABASE_KEY:
        raise RuntimeError("SUPABASE_SERVICE_KEY not set")
    endpoint = f"{SUPABASE_URL}/rest/v1/projects?select={SELECT_COLUMNS}&order=id"
    req = urllib.request.Request(
        endpoint,
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Accept": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        rows = json.load(r)
    if not isinstance(rows, list) or not rows:
        raise RuntimeError(f"Supabase returned {len(rows) if isinstance(rows, list) else '?'} project rows")
    return rows


def _write_snapshot(rows: list[dict], fetched_at: str) -> None:
    snapshot = {
        "_about": (
            "Daily-cached snapshot of public.projects. Written by "
            "kb/_load_projects.py after a successful Supabase fetch. Falls "
            "back to this file on Supabase outage so the dashboard regen "
            "continues without manual intervention."
        ),
        "_fetched_at": fetched_at,
        "_source_table": "public.projects",
        "row_count": len(rows),
        "rows": rows,
    }
    SNAPSHOT_PATH.write_text(
        json.dumps(snapshot, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def _read_snapshot() -> tuple[list[dict], str]:
    if not SNAPSHOT_PATH.exists():
        raise RuntimeError(
            f"Supabase fetch failed AND no snapshot at {SNAPSHOT_PATH}. "
            "Cannot load projects from Supabase."
        )
    snap = json.loads(SNAPSHOT_PATH.read_text(encoding="utf-8"))
    rows = snap.get("rows") or []
    if not rows:
        raise RuntimeError(f"Snapshot at {SNAPSHOT_PATH} has no rows.")
    fetched_at = snap.get("_fetched_at") or "unknown"
    return rows, fetched_at


def load_projects_full() -> tuple[list[dict], str, str]:
    """
    Returns (rows, fetched_at, source) where source ∈ {"supabase", "snapshot"}.

    `rows` are the raw Supabase project dicts (Supabase column names). The
    generator's build_projects_from_supabase() reshapes them to the
    read_projects() field contract. Raises RuntimeError if BOTH the live fetch
    and the snapshot are unavailable — the generator catches that and falls
    back to the Excel reader.

    fetched_at is "YYYY-MM-DD" — today's date on a successful fresh fetch, or
    the snapshot's stored `_fetched_at` date on fallback.
    """
    try:
        rows = _fetch_supabase()
        fetched_at = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        _write_snapshot(rows, fetched_at)
        print(f"[projects] Loaded {len(rows)} projects from Supabase (fresh fetch).")
        return rows, fetched_at, "supabase"
    except Exception as e:
        print(
            f"[projects] Supabase fetch failed: {e}. "
            f"Falling back to snapshot at {SNAPSHOT_PATH}."
        )
        rows, fetched_at = _read_snapshot()
        print(f"[projects] Loaded {len(rows)} projects from snapshot (as of {fetched_at}).")
        return rows, fetched_at, "snapshot"
