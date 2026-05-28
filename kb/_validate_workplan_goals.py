"""
Validate parity between the Excel-derived workplan-goals ladder and the Supabase
public.workplan_goals table — the Phase 1 read-only diff that has to land green
before we cut excel_to_dashboard.py over to Supabase as source-of-truth.

What it checks:
  * Coverage      — every Excel core_id has both a GOAL and a STRETCH row in Supabase
  * Value parity  — for overlapping (activity_id, row_type), every year column matches
  * Orphans       — Supabase rows whose activity_id is not in Excel's core_ids
  * Aggregation   — Excel's 4.1 is the SUM of 4.1a-4.1d sprint rows; compared as the sum

Auth:
  * SUPABASE_URL          (default https://hvuwhnbuahrtptokpqfh.supabase.co)
  * SUPABASE_SERVICE_KEY  (required for REST fetch)
  * --supabase-json PATH  (alt: read rows from a JSON file dumped via the MCP
    or a prior REST fetch; lets the script run without the service key)

Outputs:
  * kb/workplan_goals_validation.md  (human-reviewable report)
  * exit 0 if perfectly in sync; exit 1 if any mismatch / missing / orphan

Run from repo root:
  SUPABASE_SERVICE_KEY=... python3 kb/_validate_workplan_goals.py
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

from openpyxl import load_workbook

REPO_ROOT = Path(__file__).resolve().parent.parent
EXCEL_PATH = REPO_ROOT / "CPL_Initiative_Project_List_v3.xlsx"
OUT_PATH = REPO_ROOT / "kb" / "workplan_goals_validation.md"

SUPABASE_URL = os.environ.get(
    "SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co"
).rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

# Excel column indices — mirror excel_to_dashboard.py constants
COL_ID, COL_NAME = 1, 2
COL_KPI_G2526, COL_KPI_S2526 = 20, 21
COL_KPI_G2627, COL_KPI_S2627 = 22, 23
COL_KPI_G2728, COL_KPI_S2728 = 24, 25
COL_KPI_G2829, COL_KPI_S2829 = 26, 27
COL_KPI_G2930, COL_KPI_S2930 = 28, 29

# Core sub-activity IDs in the rendered workplan goals — mirror
# build_workplan_goals_from_projects() in excel_to_dashboard.py.
CORE_IDS = [
    "1.1", "1.2", "1.3", "1.4",
    "2.1", "2.2", "2.3", "2.4",
    "3.1", "3.2", "3.3", "3.4", "3.5", "3.6",
    "4.1", "4.2", "4.3", "4.4", "4.5",
]
SPRINT_IDS = ["4.1a", "4.1b", "4.1c", "4.1d"]  # 4.1 aggregates these

YEAR_COLS = [
    ("yr_2025_26", "2025-26", COL_KPI_G2526, COL_KPI_S2526),
    ("yr_2026_27", "2026-27", COL_KPI_G2627, COL_KPI_S2627),
    ("yr_2027_28", "2027-28", COL_KPI_G2728, COL_KPI_S2728),
    ("yr_2028_29", "2028-29", COL_KPI_G2829, COL_KPI_S2829),
    ("yr_2029_30", "2029-30", COL_KPI_G2930, COL_KPI_S2930),
]

# Treat |a - b| < EPS as equal for numeric comparison
EPS = 1e-6


def parse_num(val) -> float:
    if val is None or val == "":
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
    s = str(val).strip().replace(",", "").replace("+", "")
    if not s:
        return 0.0
    if s.lower().endswith("k"):
        try:
            return float(s[:-1]) * 1000
        except ValueError:
            return 0.0
    try:
        return float(s)
    except ValueError:
        return 0.0


def fetch_supabase_rows() -> list[dict]:
    if not SUPABASE_KEY:
        sys.exit(
            "Set SUPABASE_SERVICE_KEY in the env, or pass --supabase-json PATH"
            " to read rows from a file."
        )
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


def read_supabase_json(path: Path) -> list[dict]:
    return json.loads(path.read_text(encoding="utf-8"))


def read_excel_ladder() -> dict[str, dict[str, dict[str, float]]]:
    """
    {pid: {"name": str, "GOAL": {yr_key: val, ...}, "STRETCH": {yr_key: val, ...}}}

    Covers CORE_IDS only. For 4.1, sums 4.1a-d. Reads from the canonical Excel.
    """
    wb = load_workbook(EXCEL_PATH, data_only=True)
    ws = wb["Project List"]

    by_pid: dict[str, dict] = {}
    for r in range(4, ws.max_row + 1):
        pid = ws.cell(r, COL_ID).value
        if not pid:
            break
        pid_s = str(pid).strip()
        name = ws.cell(r, COL_NAME).value or ""
        goal_row = {}
        stretch_row = {}
        for yr_key, _yr_label, g_col, s_col in YEAR_COLS:
            goal_row[yr_key] = parse_num(ws.cell(r, g_col).value)
            stretch_row[yr_key] = parse_num(ws.cell(r, s_col).value)
        by_pid[pid_s] = {"name": str(name), "GOAL": goal_row, "STRETCH": stretch_row}

    # Project the readable Excel rows onto CORE_IDS, summing the sprint kids into 4.1.
    out: dict[str, dict] = {}
    for pid in CORE_IDS:
        if pid == "4.1":
            sprints = [by_pid[sid] for sid in SPRINT_IDS if sid in by_pid]
            if not sprints:
                continue
            goal_sum = {k: sum(s["GOAL"][k] for s in sprints) for k, *_ in YEAR_COLS}
            stretch_sum = {
                k: sum(s["STRETCH"][k] for s in sprints) for k, *_ in YEAR_COLS
            }
            out[pid] = {
                "name": "Sprints (Veteran, Apprenticeship, Adoption, 29 Palms)",
                "GOAL": goal_sum,
                "STRETCH": stretch_sum,
                "_aggregated_from": SPRINT_IDS,
            }
        else:
            if pid not in by_pid:
                continue
            out[pid] = by_pid[pid]
    return out, by_pid  # also return the raw map for orphan reporting


def reshape_supabase(rows: list[dict]) -> dict[str, dict[str, dict[str, float]]]:
    """{activity_id: {"name": ..., "GOAL": {yr_key: val}, "STRETCH": {yr_key: val}}}"""
    out: dict[str, dict] = {}
    for row in rows:
        aid = row["activity_id"]
        rt = row["row_type"]
        bucket = out.setdefault(aid, {"name": row.get("name", "")})
        bucket[rt] = {k: parse_num(row.get(k)) for k, *_ in YEAR_COLS}
        if not bucket.get("name"):
            bucket["name"] = row.get("name", "")
    return out


def compare_rows(
    excel: dict[str, dict], supabase: dict[str, dict]
) -> tuple[list, list, list, list]:
    """
    Returns (matches, mismatches, missing_in_supabase, orphan_in_supabase).
    Each match/mismatch entry is a dict carrying the diagnostic detail.
    """
    matches, mismatches = [], []
    missing = []

    for pid, ex_data in excel.items():
        sb_data = supabase.get(pid)
        if not sb_data:
            missing.append(
                {"activity_id": pid, "name": ex_data["name"], "reason": "no_supabase_row"}
            )
            continue
        for row_type in ("GOAL", "STRETCH"):
            ex_row = ex_data[row_type]
            sb_row = sb_data.get(row_type)
            if not sb_row:
                missing.append(
                    {
                        "activity_id": pid,
                        "row_type": row_type,
                        "name": ex_data["name"],
                        "reason": f"missing_{row_type.lower()}_row",
                    }
                )
                continue
            diffs = []
            for yr_key, yr_label, *_ in YEAR_COLS:
                ev = ex_row.get(yr_key, 0.0)
                sv = sb_row.get(yr_key, 0.0)
                if abs(ev - sv) >= EPS:
                    diffs.append({"year": yr_label, "excel": ev, "supabase": sv})
            entry = {
                "activity_id": pid,
                "name": ex_data["name"],
                "row_type": row_type,
                "excel": ex_row,
                "supabase": sb_row,
                "diffs": diffs,
            }
            if diffs:
                mismatches.append(entry)
            else:
                matches.append(entry)

    # Orphans: Supabase activity_ids not in Excel CORE_IDS
    orphans = []
    for aid, sb_data in supabase.items():
        if aid not in excel:
            orphans.append(
                {"activity_id": aid, "name": sb_data.get("name", "")}
            )

    return matches, mismatches, missing, orphans


def fmt_num(v: float) -> str:
    if v == int(v):
        return f"{int(v):,}"
    return f"{v:,.2f}"


def render_report(
    excel: dict, supabase: dict, matches, mismatches, missing, orphans, raw_excel
) -> str:
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    in_sync = not (mismatches or missing or orphans)

    lines = []
    lines.append("---")
    lines.append("title: Workplan Goals — Excel vs Supabase Validation")
    lines.append(f"date: {today}")
    lines.append("tags: [workplan-goals, supabase, excel-migration, validation, phase-1]")
    lines.append("related:")
    lines.append("  - kb/_validate_workplan_goals.py")
    lines.append("  - CPL_Initiative_Project_List_v3.xlsx (Project List sheet)")
    lines.append("  - public.workplan_goals (Supabase)")
    lines.append("---")
    lines.append("")
    lines.append("# Workplan Goals — Excel vs Supabase Validation")
    lines.append("")
    status = "✅ in sync" if in_sync else "⚠ drift detected"
    lines.append(f"**Status:** {status}")
    lines.append("")
    lines.append("## Summary")
    lines.append("")
    lines.append(f"- Excel core sub-activities: **{len(excel)}** of {len(CORE_IDS)} expected")
    lines.append(f"- Supabase rows: **{len(supabase)}** distinct activity_ids")
    lines.append(f"- Matches (GOAL+STRETCH × 5 years agree): **{len(matches)}**")
    lines.append(f"- Mismatches (overlapping rows that disagree): **{len(mismatches)}**")
    lines.append(f"- Missing in Supabase (Excel CORE_IDS without a Supabase row): **{len(missing)}**")
    lines.append(f"- Orphans in Supabase (rows whose activity_id isn't in Excel CORE_IDS): **{len(orphans)}**")
    lines.append("")

    # Missing
    if missing:
        lines.append("## Missing in Supabase")
        lines.append("")
        lines.append("Excel core sub-activities that have no row in `workplan_goals`. "
                     "These have to be seeded before Supabase can become source of truth.")
        lines.append("")
        lines.append("| activity_id | name | reason |")
        lines.append("|---|---|---|")
        for m in missing:
            name = m.get("name", "")
            rt = m.get("row_type", "")
            reason = m["reason"] + (f" ({rt})" if rt else "")
            lines.append(f"| `{m['activity_id']}` | {name} | {reason} |")
        lines.append("")

    # Orphans
    if orphans:
        lines.append("## Orphans in Supabase")
        lines.append("")
        lines.append("Supabase `workplan_goals` rows whose `activity_id` is NOT in "
                     "Excel's `CORE_IDS` list. Either the renderer needs to learn "
                     "about these (e.g. add to CORE_IDS), or the rows should be "
                     "removed from Supabase.")
        lines.append("")
        lines.append("| activity_id | name |")
        lines.append("|---|---|")
        for o in orphans:
            lines.append(f"| `{o['activity_id']}` | {o['name']} |")
        lines.append("")

    # Mismatches
    if mismatches:
        lines.append("## Value Mismatches")
        lines.append("")
        lines.append("Overlapping (activity_id, row_type) pairs where the year-by-year "
                     "values disagree between Excel and Supabase. Each table shows the "
                     "drift; you decide which side wins per row.")
        lines.append("")
        for mm in mismatches:
            agg_note = ""
            ex_entry = excel.get(mm["activity_id"], {})
            if ex_entry.get("_aggregated_from"):
                agg_note = (
                    f" *(Excel value is the sum of "
                    f"{', '.join(ex_entry['_aggregated_from'])})*"
                )
            lines.append(
                f"### `{mm['activity_id']}` — {mm['name']} — {mm['row_type']}{agg_note}"
            )
            lines.append("")
            lines.append("| year | Excel | Supabase | Δ |")
            lines.append("|---|---:|---:|---:|")
            for yr_key, yr_label, *_ in YEAR_COLS:
                ev = mm["excel"].get(yr_key, 0.0)
                sv = mm["supabase"].get(yr_key, 0.0)
                delta = sv - ev
                marker = "" if abs(delta) < EPS else " ⚠"
                lines.append(
                    f"| {yr_label} | {fmt_num(ev)} | {fmt_num(sv)} | {fmt_num(delta)}{marker} |"
                )
            lines.append("")

    # Matches summary (one-line per row, no table — keeps the report short)
    if matches:
        lines.append("## In-sync rows (no action needed)")
        lines.append("")
        for m in matches:
            lines.append(f"- `{m['activity_id']}` {m['row_type']} — {m['name']}")
        lines.append("")

    lines.append("## How to read this")
    lines.append("")
    lines.append(
        "- **Missing** rows have to be seeded into Supabase before cutover."
    )
    lines.append(
        "- **Mismatches** need a per-row decision: which side is canonical? "
        "Pick, update the loser to match, re-run this validator until clean."
    )
    lines.append(
        "- **Orphans** suggest the renderer is missing sub-activities, OR "
        "Supabase has stale rows. Decide per orphan."
    )
    lines.append("")
    lines.append("Re-run: `python3 kb/_validate_workplan_goals.py`")
    lines.append("")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--supabase-json",
        type=Path,
        default=None,
        help="Read Supabase rows from this JSON file instead of fetching via REST.",
    )
    args = parser.parse_args()

    if args.supabase_json:
        rows = read_supabase_json(args.supabase_json)
    else:
        rows = fetch_supabase_rows()

    excel, raw_excel = read_excel_ladder()
    supabase = reshape_supabase(rows)
    matches, mismatches, missing, orphans = compare_rows(excel, supabase)

    report = render_report(
        excel, supabase, matches, mismatches, missing, orphans, raw_excel
    )
    OUT_PATH.write_text(report, encoding="utf-8")

    print(f"wrote {OUT_PATH.relative_to(REPO_ROOT)}")
    print(
        f"  excel core_ids: {len(excel)} / {len(CORE_IDS)}; "
        f"supabase activity_ids: {len(supabase)}"
    )
    print(
        f"  matches={len(matches)} mismatches={len(mismatches)} "
        f"missing={len(missing)} orphans={len(orphans)}"
    )

    in_sync = not (mismatches or missing or orphans)
    if not in_sync:
        sys.exit(1)


if __name__ == "__main__":
    main()
