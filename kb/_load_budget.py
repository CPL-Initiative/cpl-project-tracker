"""
Load the budget tables from Supabase as the dashboard generator's
source-of-truth, with a daily-cached snapshot fallback for Supabase-outage
resilience. Mirrors kb/_load_projects.py (Phase 2) and kb/_load_workplan_goals.py
(Phase 1).

Phase 3 (Budget) cutover: excel_to_dashboard.py renders the Budget tab from
`public.budget_funding` + `public.personnel` instead of the Excel
"20260324 CPL Budget" sheet. This was forced by measure-first: that Excel sheet
is a zeroed-out husk (funding 7/48 non-zero cells, no formulas) — it rendered
"$0 Total Allocation" on the live dashboard — while Supabase already holds the
correct funding (6 rows) + personnel data.

Deliberately NOT loaded here (Phase 3 scope, Sam's call 2026-05-29):
  - `budget_expenditures` — the table is empty AND the Excel expenditure dollar
    columns are gutted (budget totals understate actual spend ~3x), so seeding
    would publish misleading numbers. Held empty; the Budget tab shows an
    "expenditure detail pending" note. Sam re-runs accurate budget values
    (incl. expenditures) once the infrastructure is in place.
  - `factors` (FTE / COLA / indirect / platform-maint info cards) + `year_labels`
    — no Supabase table; stay Excel-sourced (enriched by build_budget_from_supabase
    from read_budget_plan), like the D.* helper rows in Phase 2.

Personnel dedupe: the live `personnel` table holds 13 distinct positions that
were DOUBLE-SEEDED into 26 rows (ids 1-13 @17:03, 14-26 @17:17, identical data).
load_budget_full() dedupes on the full data tuple (title + 5 FTEs + total_comp),
so the render shows 13 regardless of the table cleanup state. (The table cleanup
itself is a gated write deferred to the editor PR.)

Fallback behavior (mirrors kb/_load_projects.py):
  - Supabase fetch succeeds → write `kb/budget_snapshot.json` (deduped), return
    rows with today's date stamp + source="supabase".
  - Supabase fetch fails AND snapshot exists → read snapshot, return rows with
    the snapshot's `_fetched_at` date stamp + source="snapshot".
  - Both fail → raise RuntimeError (the generator then falls back to the Excel
    read_budget_plan() as the ultimate safety net — see excel_to_dashboard.py).

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
SNAPSHOT_PATH = HERE / "budget_snapshot.json"

SUPABASE_URL = os.environ.get(
    "SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co"
).rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

FUNDING_COLUMNS = (
    "id,name,category,source_code,yr_2025_26_budget,yr_2025_26_expense,"
    "yr_2026_27,yr_2027_28,yr_2028_29,yr_2029_30,total,avg_yearly"
)
PERSONNEL_COLUMNS = (
    "id,title,fte_2025_26,fte_2026_27,fte_2027_28,fte_2028_29,fte_2029_30,total_comp"
)


def _fetch_table(table: str, columns: str) -> list[dict]:
    endpoint = f"{SUPABASE_URL}/rest/v1/{table}?select={columns}&order=id"
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
    if not isinstance(rows, list):
        raise RuntimeError(f"Supabase {table} returned a non-list response")
    return rows


def _fetch_supabase() -> tuple[list[dict], list[dict]]:
    """Fetch budget_funding + personnel. Raises on any failure."""
    if not SUPABASE_KEY:
        raise RuntimeError("SUPABASE_SERVICE_KEY not set")
    funding = _fetch_table("budget_funding", FUNDING_COLUMNS)
    personnel = _fetch_table("personnel", PERSONNEL_COLUMNS)
    if not funding:
        raise RuntimeError("Supabase budget_funding returned 0 rows")
    return funding, personnel


_PERSONNEL_KEY = (
    "title", "fte_2025_26", "fte_2026_27", "fte_2027_28",
    "fte_2028_29", "fte_2029_30", "total_comp",
)


def _dedupe_personnel(rows: list[dict]) -> list[dict]:
    """Collapse exact-duplicate personnel rows (the 26-row table is 13 positions
    double-seeded). Keys on the full data tuple so genuinely distinct rows — e.g.
    the three different-comp 'Professional Expert' lines — are preserved; only
    byte-identical duplicates are dropped. Keeps the first (lowest-id) occurrence."""
    seen, out = set(), []
    for row in sorted(rows, key=lambda r: r.get("id", 0)):
        key = tuple(row.get(k) for k in _PERSONNEL_KEY)
        if key in seen:
            continue
        seen.add(key)
        out.append(row)
    return out


def _write_snapshot(funding: list[dict], personnel: list[dict], fetched_at: str) -> None:
    snapshot = {
        "_about": (
            "Daily-cached snapshot of public.budget_funding + public.personnel. "
            "Written by kb/_load_budget.py after a successful Supabase fetch. "
            "Falls back to this file on a Supabase outage. Personnel is stored "
            "deduped. budget_expenditures intentionally omitted (held empty)."
        ),
        "_fetched_at": fetched_at,
        "_source_tables": ["public.budget_funding", "public.personnel"],
        "row_counts": {"budget_funding": len(funding), "personnel": len(personnel)},
        "budget_funding": funding,
        "personnel": personnel,
    }
    SNAPSHOT_PATH.write_text(
        json.dumps(snapshot, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def _read_snapshot() -> tuple[list[dict], list[dict], str]:
    if not SNAPSHOT_PATH.exists():
        raise RuntimeError(
            f"Supabase fetch failed AND no snapshot at {SNAPSHOT_PATH}. "
            "Cannot load budget from Supabase."
        )
    snap = json.loads(SNAPSHOT_PATH.read_text(encoding="utf-8"))
    funding = snap.get("budget_funding") or []
    personnel = snap.get("personnel") or []
    if not funding:
        raise RuntimeError(f"Snapshot at {SNAPSHOT_PATH} has no budget_funding rows.")
    fetched_at = snap.get("_fetched_at") or "unknown"
    return funding, personnel, fetched_at


def load_budget_full() -> tuple[list[dict], list[dict], str, str]:
    """
    Returns (funding_rows, personnel_rows, fetched_at, source) where source ∈
    {"supabase", "snapshot"}. personnel_rows are deduped. Raises RuntimeError if
    BOTH the live fetch and the snapshot are unavailable — the generator catches
    that and falls back to the Excel read_budget_plan().

    fetched_at is "YYYY-MM-DD" — today on a successful fresh fetch, or the
    snapshot's stored `_fetched_at` on fallback.
    """
    try:
        funding, personnel = _fetch_supabase()
        personnel = _dedupe_personnel(personnel)
        fetched_at = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        _write_snapshot(funding, personnel, fetched_at)
        print(f"[budget] Loaded {len(funding)} funding + {len(personnel)} personnel "
              f"from Supabase (fresh fetch).")
        return funding, personnel, fetched_at, "supabase"
    except Exception as e:
        print(f"[budget] Supabase fetch failed: {e}. Falling back to snapshot at {SNAPSHOT_PATH}.")
        funding, personnel, fetched_at = _read_snapshot()
        personnel = _dedupe_personnel(personnel)
        print(f"[budget] Loaded {len(funding)} funding + {len(personnel)} personnel "
              f"from snapshot (as of {fetched_at}).")
        return funding, personnel, fetched_at, "snapshot"
