"""
Load workplan-goals from Supabase as the dashboard generator's source-of-truth,
with a daily-cached snapshot fallback for Supabase-outage resilience.

After PR-4 of the Excel→Supabase Phase 1 migration, excel_to_dashboard.py
calls `load_workplan_goals()` here instead of reading the 10 KPI columns
out of the Excel Project List sheet.

PR-A (Activity↔Project N-to-N) added the `kind` column on workplan_goals and
a sibling `workplan_activity_associations` table. The snapshot now carries
both, and `load_workplan_goals_full()` returns them together. The legacy
`load_workplan_goals()` signature stays backwards-compatible.

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


def _fetch_table(path: str) -> list[dict]:
    """Generic Supabase REST fetch for a select query path (excluding base)."""
    if not SUPABASE_KEY:
        raise RuntimeError("SUPABASE_SERVICE_KEY not set")
    endpoint = f"{SUPABASE_URL}/rest/v1/{path}"
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


def _fetch_supabase() -> tuple[list[dict], list[dict]]:
    """
    Returns (workplan_goals_rows, associations_rows).

    PR-A added the `kind` column + the workplan_activity_associations table;
    both are fetched here so the snapshot carries the full picture.
    """
    rows = _fetch_table(
        "workplan_goals"
        "?select=activity_id,name,row_type,kind,"
        "yr_2025_26,yr_2026_27,yr_2027_28,yr_2028_29,yr_2029_30,total"
    )
    # is_primary is added by kb/supabase_activity_associations_add_primary.sql
    # (the Activity↔Project association editor's schema change). Until that
    # migration is applied, selecting the column 400s, so try the richer select
    # first and fall back to the (project_id, activity_id) shape. Once the
    # column lands, the first select succeeds and the snapshot carries
    # is_primary automatically — the renderer + editor light up the primary
    # affordance on the next daily regen.
    try:
        assocs = _fetch_table(
            "workplan_activity_associations"
            "?select=project_id,activity_id,is_primary"
        )
    except Exception:
        assocs = _fetch_table(
            "workplan_activity_associations?select=project_id,activity_id"
        )
    return rows, assocs


def _write_snapshot(
    rows: list[dict], assocs: list[dict], fetched_at: str
) -> None:
    snapshot = {
        "_about": (
            "Daily-cached snapshot of public.workplan_goals + "
            "public.workplan_activity_associations. Written by "
            "kb/_load_workplan_goals.py after a successful Supabase fetch. "
            "Falls back to this file on Supabase outage so the dashboard "
            "regen continues without manual intervention."
        ),
        "_fetched_at": fetched_at,
        "_source_table": "public.workplan_goals",
        "row_count": len(rows),
        "rows": rows,
        "associations": assocs,
    }
    SNAPSHOT_PATH.write_text(
        json.dumps(snapshot, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def _read_snapshot() -> tuple[list[dict], list[dict], str]:
    if not SNAPSHOT_PATH.exists():
        raise RuntimeError(
            f"Supabase fetch failed AND no snapshot at {SNAPSHOT_PATH}. "
            "Cannot render Workplan Goals."
        )
    snap = json.loads(SNAPSHOT_PATH.read_text(encoding="utf-8"))
    rows = snap.get("rows") or []
    assocs = snap.get("associations") or []
    fetched_at = snap.get("_fetched_at") or "unknown"
    return rows, assocs, fetched_at


def load_workplan_goals() -> tuple[list[dict], str, str]:
    """
    Returns (rows, fetched_at, source) where source ∈ {"supabase", "snapshot"}.

    Backwards-compatible shape: returns only workplan_goals rows. Callers that
    need the new associations table should use `load_workplan_goals_full()`.

    fetched_at is "YYYY-MM-DD" — today's date on a successful fresh fetch, or
    the snapshot's stored `_fetched_at` date on fallback.
    """
    rows, _assocs, fetched_at, source = load_workplan_goals_full()
    return rows, fetched_at, source


def load_workplan_goals_full() -> tuple[list[dict], list[dict], str, str]:
    """
    Returns (rows, associations, fetched_at, source).

    PR-A: the new return shape carrying the workplan_activity_associations
    rows alongside the workplan_goals rows. Backwards-compatible callers can
    stick with `load_workplan_goals()`.
    """
    try:
        rows, assocs = _fetch_supabase()
        fetched_at = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        _write_snapshot(rows, assocs, fetched_at)
        print(
            f"[workplan_goals] Loaded {len(rows)} rows + {len(assocs)} "
            f"associations from Supabase (fresh fetch)."
        )
        return rows, assocs, fetched_at, "supabase"
    except Exception as e:
        print(
            f"[workplan_goals] Supabase fetch failed: {e}. "
            f"Falling back to snapshot at {SNAPSHOT_PATH}."
        )
        rows, assocs, fetched_at = _read_snapshot()
        print(
            f"[workplan_goals] Loaded {len(rows)} rows + {len(assocs)} "
            f"associations from snapshot (as of {fetched_at})."
        )
        return rows, assocs, fetched_at, "snapshot"
