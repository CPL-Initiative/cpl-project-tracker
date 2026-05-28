"""
Load workplan-goals from Supabase as the dashboard generator's source-of-truth,
with a daily-cached snapshot fallback for Supabase-outage resilience.

After PR-4 of the Excel→Supabase Phase 1 migration, excel_to_dashboard.py
calls `load_workplan_goals()` here instead of reading the 10 KPI columns
out of the Excel Project List sheet.

Fallback behavior (Sam's call: subtle):
  - Supabase fetch succeeds → write `kb/workplan_goals_snapshot.json` (the
    daily cron commits it; subsequent runs use it on failure), return rows
    with today's date stamp + source="supabase"
  - Supabase fetch fails AND snapshot exists → read snapshot, log a warning
    to stdout, return rows with the snapshot's `_fetched_at` date stamp +
    source="snapshot" (the rendered tab gets a small "Data as of <date>"
    line so the staleness is visible without being loud)
  - Both fail (no service key OR Supabase down AND no snapshot file) →
    raise RuntimeError (fail loudly — no silent rendering of nothing)

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
SNAPSHOT_PATH = HERE / "workplan_goals_snapshot.json"

SUPABASE_URL = os.environ.get(
    "SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co"
).rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")


def _fetch_supabase() -> list[dict]:
    if not SUPABASE_KEY:
        raise RuntimeError("SUPABASE_SERVICE_KEY not set")
    endpoint = (
        f"{SUPABASE_URL}/rest/v1/workplan_goals"
        "?select=activity_id,name,row_type,"
        "yr_2025_26,yr_2026_27,yr_2027_28,yr_2028_29,yr_2029_30,total"
    )
    req = urllib.request.Request(
        endpoint,
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Accept": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def _write_snapshot(rows: list[dict], fetched_at: str) -> None:
    snapshot = {
        "_about": (
            "Daily-cached snapshot of public.workplan_goals. Written by "
            "kb/_load_workplan_goals.py after a successful Supabase fetch. "
            "Falls back to this file on Supabase outage so the dashboard "
            "regen continues without manual intervention."
        ),
        "_fetched_at": fetched_at,
        "_source_table": "public.workplan_goals",
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
            "Cannot render Workplan Goals."
        )
    snap = json.loads(SNAPSHOT_PATH.read_text(encoding="utf-8"))
    rows = snap.get("rows") or []
    fetched_at = snap.get("_fetched_at") or "unknown"
    return rows, fetched_at


def load_workplan_goals() -> tuple[list[dict], str, str]:
    """
    Returns (rows, fetched_at, source) where source ∈ {"supabase", "snapshot"}.

    fetched_at is "YYYY-MM-DD" — today's date on a successful fresh fetch, or
    the snapshot's stored `_fetched_at` date on fallback.
    """
    try:
        rows = _fetch_supabase()
        fetched_at = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        _write_snapshot(rows, fetched_at)
        print(f"[workplan_goals] Loaded {len(rows)} rows from Supabase (fresh fetch).")
        return rows, fetched_at, "supabase"
    except Exception as e:
        print(
            f"[workplan_goals] Supabase fetch failed: {e}. "
            f"Falling back to snapshot at {SNAPSHOT_PATH}."
        )
        rows, fetched_at = _read_snapshot()
        print(
            f"[workplan_goals] Loaded {len(rows)} rows from snapshot "
            f"(as of {fetched_at})."
        )
        return rows, fetched_at, "snapshot"
