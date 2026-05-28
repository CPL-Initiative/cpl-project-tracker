"""
Validate parity between the Excel-derived project records and the Supabase
public.projects table — the Phase 2 read-only diff that has to land green before
we cut excel_to_dashboard.py over to Supabase as source-of-truth for project
metadata. Mirrors kb/_validate_workplan_goals.py (Phase 1).

Excel-side derivation (the projects-table unit; Sam's call 2026-05-28):
  * The unit is EVERY real project in the Project List, i.e. every row from
    row 4 to the first blank id, EXCLUDING `D.*` dashboard-metric rows.
  * We do NOT apply the workplan-goals "A+" non-zero-KPI filter here. The
    projects table feeds every card on the dashboard grid, including the 7
    Activity-5 projects that track qualitatively (no KPI ladder). Those cards
    stay — Sam confirmed "keep the cards with 0 KPI" (2026-05-28). The A+
    (non-zero-KPI) count is still reported for cross-reference, since that's the
    workplan_goals unit (Phase 1) and the two deliberately differ.
  * No parent/child aggregation — each project is its own row (`4.1` and
    `4.1.1`-`4.1.4` each stand alone), same as Phase 1.

What it checks (per project id):
  * Coverage      — every Excel project has a row in Supabase public.projects
  * Value parity  — for overlapping ids, every mapped column matches
  * Orphans       — Supabase project rows whose id is not in the Excel set

Column mapping (Excel read_projects() field -> Supabase column). 8 renames,
3 type changes; `override`/`excel_row` dropped (Excel-side artifacts, not data);
the 10 KPI ladder columns handled out-of-band (they live in workplan_goals,
joined back into CPL_Data.js at generator time — see the Phase 2 scope doc);
`kpi_target_2026/2030` are schema-only (no Excel source, left NULL);
`created_at/updated_at` are server-managed and not compared.

Auth:
  * SUPABASE_URL          (default https://hvuwhnbuahrtptokpqfh.supabase.co)
  * SUPABASE_SERVICE_KEY  (required for REST fetch)
  * --supabase-json PATH  (alt: read rows from a JSON file dumped via the MCP
    or a prior REST fetch; lets the script run without the service key)

Outputs:
  * kb/projects_validation.md  (human-reviewable report)
  * exit 0 if perfectly in sync; exit 1 if any mismatch / missing / orphan.
    (Pre-seed this is EXPECTED to exit 1 with N missing — Supabase is empty.
    Post-seed it's the PR-3 V4 gate and must exit 0.)

Run from repo root:
  SUPABASE_SERVICE_KEY=... python3 kb/_validate_projects.py
  python3 kb/_validate_projects.py --supabase-json archive/projects_supabase_<date>_pre-seed.json
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.request
from datetime import date, datetime, timezone
from pathlib import Path

from openpyxl import load_workbook

REPO_ROOT = Path(__file__).resolve().parent.parent
EXCEL_PATH = REPO_ROOT / "CPL_Initiative_Project_List_v3.xlsx"
OUT_PATH = REPO_ROOT / "kb" / "projects_validation.md"

# read_projects() lives in excel_to_dashboard.py at the repo root — reuse it so
# the validator compares EXACTLY what the dashboard reads (no re-implementation
# of the 28-field mapping / {KPI} substitution / pct + date formatting).
sys.path.insert(0, str(REPO_ROOT))
import excel_to_dashboard as xl  # noqa: E402  (needs REPO_ROOT on sys.path first)

SUPABASE_URL = os.environ.get(
    "SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co"
).rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

# Excel read_projects() field -> (Supabase column, kind). Order = report order.
# kind ∈ {text, num, date, int}. Renames are flagged inline.
FIELD_MAP = [
    ("id",             "id",                 "text"),
    ("name",           "name",               "text"),
    ("desc",           "description",        "text"),   # rename
    ("activity",       "workplan_activity",  "text"),   # rename
    ("v2030",          "vision_2030_action", "text"),   # rename
    ("goal",           "cpl_goal",           "text"),   # rename
    ("budget_source",  "budget_source",      "text"),
    ("budget",         "budget",             "text"),   # kept text ("$2.5M")
    ("lead",           "lead",               "text"),
    ("team",           "team",               "text"),
    ("status",         "status",             "text"),
    ("pct",            "percent_complete",   "num"),    # rename + int->numeric
    ("start",          "start_date",         "date"),   # rename + str->date
    ("end",            "end_date",           "date"),   # rename + str->date
    ("milestones",     "milestones",         "text"),
    ("update",         "latest_update",      "text"),   # rename
    ("update_date",    "update_date",        "date"),   # str->date
    ("kpi_metric",     "kpi_metric",         "text"),
    ("kpi_unit",       "kpi_unit",           "text"),
    ("workplan_notes", "wp_notes",           "text"),   # rename
    ("kpi_order",      "kpi_order",          "int"),
]

# Dropped from Excel (not project data): override, excel_row.
# Out-of-band (live in workplan_goals, not in projects schema):
LADDER_KEYS = [
    "kpi_goal_2526", "kpi_stretch_2526", "kpi_goal_2627", "kpi_stretch_2627",
    "kpi_goal_2728", "kpi_stretch_2728", "kpi_goal_2829", "kpi_stretch_2829",
    "kpi_goal_2930", "kpi_stretch_2930",
]

# Treat |a - b| < EPS as equal for numeric comparison
EPS = 1e-6

# Lenient date formats (fork #1, 2026-05-28): try in order, unparseable -> None.
DATE_FORMATS = ("%Y-%m-%d", "%m/%d/%Y", "%Y/%m/%d", "%d-%b-%Y", "%m/%d/%y", "%d/%m/%Y")


def parse_num(val) -> float:
    if val is None or val == "":
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
    s = str(val).strip().replace(",", "").replace("+", "").replace("$", "")
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


def parse_date(val):
    """Lenient (fork #1). Returns (iso_str_or_None, parse_failed_bool).
    datetime/date pass straight through; blank -> None (no failure);
    unparseable non-blank -> (None, True) so the caller logs a warning."""
    if val is None:
        return None, False
    if isinstance(val, (datetime, date)):
        return val.strftime("%Y-%m-%d"), False
    s = str(val).strip()
    if not s:
        return None, False
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(s, fmt).strftime("%Y-%m-%d"), False
        except ValueError:
            continue
    return None, True


def norm_text(val) -> str:
    """None/blank -> '' so a NULL Supabase cell and a blank Excel cell match."""
    if val is None:
        return ""
    return str(val).strip()


def norm_int(val):
    if val is None or val == "":
        return None
    if isinstance(val, bool):
        return None
    if isinstance(val, (int, float)):
        return int(val)
    s = str(val).strip()
    try:
        return int(float(s))
    except ValueError:
        return None


def _has_nonzero_kpi(p: dict) -> bool:
    return any(parse_num(p.get(k)) != 0 for k in LADDER_KEYS)


def _normalize_record(get, source_is_excel: bool):
    """Build a normalized {sb_col: value} dict + a list of date-parse warnings.
    `get(ex_key, sb_col)` returns the raw value for the field from either side."""
    rec, warnings = {}, []
    for ex_key, sb_col, kind in FIELD_MAP:
        raw = get(ex_key, sb_col)
        if kind == "text":
            rec[sb_col] = norm_text(raw)
        elif kind == "num":
            rec[sb_col] = parse_num(raw)
        elif kind == "int":
            rec[sb_col] = norm_int(raw)
        elif kind == "date":
            iso, failed = parse_date(raw)
            rec[sb_col] = iso
            if failed and source_is_excel:
                warnings.append({"field": sb_col, "value": str(raw)})
    return rec, warnings


def derive_excel_projects():
    """
    Returns (records, warnings, aplus_count, zero_kpi_rows).
      records      = {pid: {sb_col: normalized_value, ...}}  (all 34 real projects)
      warnings     = [{"id", "field", "value"}]  unparseable dates
      aplus_count  = how many of the 34 carry a non-zero KPI ladder (== the
                     workplan_goals A+ unit; for cross-reference only)
      zero_kpi_rows= [(pid, name)] the projects KEPT here but excluded by A+
    """
    wb = load_workbook(EXCEL_PATH, data_only=True)
    projects = xl.read_projects(wb)

    records, warnings, zero_kpi = {}, [], []
    aplus_count = 0
    for p in projects:
        pid = str(p["id"]).strip()
        if pid.startswith("D."):
            continue
        rec, recw = _normalize_record(
            lambda ex_key, _sb: p.get(ex_key), source_is_excel=True
        )
        records[pid] = rec
        for w in recw:
            warnings.append({"id": pid, **w})
        if _has_nonzero_kpi(p):
            aplus_count += 1
        else:
            zero_kpi.append((pid, norm_text(p.get("name"))))
    return records, warnings, aplus_count, zero_kpi


def reshape_supabase(rows: list[dict]):
    """{pid: {sb_col: normalized_value}} from raw Supabase projects rows."""
    out = {}
    for row in rows:
        pid = str(row.get("id", "")).strip()
        if not pid:
            continue
        rec, _ = _normalize_record(
            lambda _ex, sb_col: row.get(sb_col), source_is_excel=False
        )
        out[pid] = rec
    return out


def _eq(ev, sv, kind: str) -> bool:
    if kind == "num":
        return abs(parse_num(ev) - parse_num(sv)) < EPS
    return ev == sv


def compare(excel: dict, supabase: dict):
    """Returns (matches, mismatches, missing, orphans)."""
    matches, mismatches, missing = [], [], []
    for pid, ex in excel.items():
        sb = supabase.get(pid)
        if sb is None:
            missing.append({"id": pid, "name": ex.get("name", "")})
            continue
        diffs = []
        for _ex_key, sb_col, kind in FIELD_MAP:
            if not _eq(ex.get(sb_col), sb.get(sb_col), kind):
                diffs.append(
                    {"field": sb_col, "excel": ex.get(sb_col), "supabase": sb.get(sb_col)}
                )
        entry = {"id": pid, "name": ex.get("name", ""), "diffs": diffs}
        (mismatches if diffs else matches).append(entry)

    ex_ids = set(excel)
    orphans = [
        {"id": pid, "name": supabase[pid].get("name", "")}
        for pid in supabase
        if pid not in ex_ids
    ]
    return matches, mismatches, missing, orphans


def _read_snapshot_rows(path: Path) -> list[dict]:
    """Accept a flat list[dict] OR a snapshot dict {"rows": [...]}."""
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, dict):
        return data.get("rows") or []
    return data


def fetch_supabase_rows() -> list[dict]:
    if not SUPABASE_KEY:
        sys.exit(
            "Set SUPABASE_SERVICE_KEY in the env, or pass --supabase-json PATH"
            " to read rows from a file."
        )
    cols = ",".join(sb for _ex, sb, _k in FIELD_MAP)
    endpoint = f"{SUPABASE_URL}/rest/v1/projects?select={cols}"
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


def fmt_val(v) -> str:
    if v is None:
        return "∅"
    if v == "":
        return "(blank)"
    s = str(v)
    return s if len(s) <= 60 else s[:57] + "…"


def render_report(
    excel, supabase, matches, mismatches, missing, orphans,
    warnings, aplus_count, zero_kpi,
) -> str:
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    in_sync = not (mismatches or missing or orphans)

    L = []
    L.append("---")
    L.append("title: Projects — Excel vs Supabase Validation")
    L.append(f"date: {today}")
    L.append("tags: [projects, supabase, excel-migration, validation, phase-2]")
    L.append("related:")
    L.append("  - kb/_validate_projects.py")
    L.append("  - CPL_Initiative_Project_List_v3.xlsx (Project List sheet)")
    L.append("  - public.projects (Supabase)")
    L.append("  - docs/kb-notes/phase-2-projects-migration-scope.md")
    L.append("---")
    L.append("")
    L.append("# Projects — Excel vs Supabase Validation")
    L.append("")
    L.append(f"**Status:** {'✅ in sync' if in_sync else '⚠ drift detected'}")
    L.append("")
    L.append("## Summary")
    L.append("")
    L.append(f"- Excel real projects (all rows, excl. `D.*`): **{len(excel)}**")
    L.append(
        f"  - of which carry a non-zero KPI ladder (the workplan_goals A+ unit, "
        f"for cross-reference): **{aplus_count}**"
    )
    L.append(
        f"  - of which track qualitatively (0 KPI ladder) — **KEPT** per Sam "
        f"2026-05-28: **{len(zero_kpi)}**"
    )
    L.append(f"- Supabase `projects` rows: **{len(supabase)}**")
    L.append(f"- Matches (all mapped columns agree): **{len(matches)}**")
    L.append(f"- Mismatches (shared id, ≥1 column disagrees): **{len(mismatches)}**")
    L.append(f"- Missing in Supabase (Excel project with no Supabase row): **{len(missing)}**")
    L.append(f"- Orphans in Supabase (row whose id isn't an Excel project): **{len(orphans)}**")
    L.append(f"- Unparseable dates (lenient parse -> NULL + warning): **{len(warnings)}**")
    L.append("")

    if zero_kpi:
        L.append("## Zero-KPI projects kept (in the table, not in A+)")
        L.append("")
        L.append("These are real project cards with no quantitative KPI ladder. "
                 "They belong in `projects` (every grid card) but are NOT in the "
                 "`workplan_goals` A+ set. Keeping them is intentional.")
        L.append("")
        L.append("| id | name |")
        L.append("|---|---|")
        for pid, name in zero_kpi:
            L.append(f"| `{pid}` | {name} |")
        L.append("")

    if warnings:
        L.append("## Date parse warnings")
        L.append("")
        L.append("Lenient parser (fork #1) could not read these date cells; they "
                 "will seed as NULL. Confirm the source cell or fix the format.")
        L.append("")
        L.append("| id | field | raw value |")
        L.append("|---|---|---|")
        for w in warnings:
            L.append(f"| `{w['id']}` | {w['field']} | {fmt_val(w['value'])} |")
        L.append("")

    if missing:
        L.append("## Missing in Supabase")
        L.append("")
        L.append("Excel projects with no `public.projects` row. These will be "
                 "INSERTed by the seed step (PR-2 plan / PR-3 apply).")
        L.append("")
        L.append("| id | name |")
        L.append("|---|---|")
        for m in missing:
            L.append(f"| `{m['id']}` | {m['name']} |")
        L.append("")

    if orphans:
        L.append("## Orphans in Supabase")
        L.append("")
        L.append("`public.projects` rows whose id is NOT an Excel project. The "
                 "seed step will DELETE these so Supabase matches Excel exactly.")
        L.append("")
        L.append("| id | name |")
        L.append("|---|---|")
        for o in orphans:
            L.append(f"| `{o['id']}` | {o['name']} |")
        L.append("")

    if mismatches:
        L.append("## Value Mismatches")
        L.append("")
        L.append("Shared ids where ≥1 mapped column disagrees. Excel A+ wins by "
                 "construction at seed time.")
        L.append("")
        for mm in mismatches:
            L.append(f"### `{mm['id']}` — {mm['name']}")
            L.append("")
            L.append("| column | Excel | Supabase |")
            L.append("|---|---|---|")
            for d in mm["diffs"]:
                L.append(f"| `{d['field']}` | {fmt_val(d['excel'])} | {fmt_val(d['supabase'])} |")
            L.append("")

    L.append("## How to read this")
    L.append("")
    L.append("- **Missing** rows will be INSERTed by the seed step.")
    L.append("- **Mismatches** will be UPDATEd by the seed step (Excel wins).")
    L.append("- **Orphans** will be DELETEd by the seed step.")
    L.append("- Pre-seed, this report is EXPECTED to show every Excel project as "
             "**missing** (the `projects` table is empty) and exit 1. Post-seed "
             "(PR-3 V4 gate) it must be all-matches / exit 0.")
    L.append("")
    L.append("Re-run: `python3 kb/_validate_projects.py` "
             "(or `--supabase-json <snapshot>` offline).")
    L.append("")
    return "\n".join(L)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--supabase-json", type=Path, default=None,
        help="Read Supabase projects rows from this JSON file instead of REST.",
    )
    args = ap.parse_args()

    rows = (
        _read_snapshot_rows(args.supabase_json)
        if args.supabase_json
        else fetch_supabase_rows()
    )

    excel, warnings, aplus_count, zero_kpi = derive_excel_projects()
    supabase = reshape_supabase(rows)
    matches, mismatches, missing, orphans = compare(excel, supabase)

    report = render_report(
        excel, supabase, matches, mismatches, missing, orphans,
        warnings, aplus_count, zero_kpi,
    )
    OUT_PATH.write_text(report, encoding="utf-8")

    print(f"wrote {OUT_PATH.relative_to(REPO_ROOT)}")
    print(f"  excel real projects: {len(excel)} "
          f"(A+ non-zero-KPI: {aplus_count}, zero-KPI kept: {len(zero_kpi)}); "
          f"supabase rows: {len(supabase)}")
    print(f"  matches={len(matches)} mismatches={len(mismatches)} "
          f"missing={len(missing)} orphans={len(orphans)} "
          f"date_warnings={len(warnings)}")

    if mismatches or missing or orphans:
        sys.exit(1)


if __name__ == "__main__":
    main()
