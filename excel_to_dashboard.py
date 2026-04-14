"""
Excel -> Dashboard Sync Script
==============================
Reads the CPL_Initiative_Project_List.xlsx and regenerates CPL_Data.js
so the HTML dashboard picks up any changes you made in Excel.

Usage:
    python excel_to_dashboard.py

Requirements:
    pip install openpyxl

The script reads from the Excel file in the same folder and overwrites CPL_Data.js.
Open (or refresh) CPL_Dashboard.html in your browser to see updated data.
"""

import json, os, re, sys
from datetime import datetime
from openpyxl import load_workbook

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# ── Excel source: prefer SharePoint-synced copy, fall back to local ──
# The SharePoint-synced folder is the single source of truth for the Excel.
# Set SHAREPOINT_EXCEL to the path of your synced file. If it exists, the
# pipeline reads from there; otherwise it falls back to the local copy.
SHAREPOINT_EXCEL = os.path.join(
    os.path.expanduser("~"),
    "Riverside Community College District",
    "California MAP Initiative - Documents",
    "CPL Workplan Dashboard",
    "CPL_Initiative_Project_List_v3.xlsx",
)
_LOCAL_EXCEL = os.path.join(SCRIPT_DIR, "CPL_Initiative_Project_List_v3.xlsx")
EXCEL_FILE = SHAREPOINT_EXCEL if os.path.exists(SHAREPOINT_EXCEL) else _LOCAL_EXCEL
OUTPUT_FILE = os.path.join(SCRIPT_DIR, "CPL_Data.js")
HTML_FILE   = os.path.join(SCRIPT_DIR, "CPL_Dashboard.html")
LIVE_FILE   = os.path.join(SCRIPT_DIR, "live_metrics.json")

# ── MAP Exhibit / Custom Report data source ─────────────────────────
# The Custom Reporting Module (customreportingmodule.azurewebsites.net) exports
# a combined JSON file containing multiple datasets.  The pipeline reads all
# available datasets and extracts KPIs from each.
#
# Search order for the JSON file:
#   1. User's Documents folder (Windows native path)
#   2. Cowork sandbox mount path (sibling project folder)
#   3. Local CPL Project Tracker folder (fallback)
_EXHIBIT_LOCATIONS = [
    os.path.join(os.path.expanduser("~"), "Documents", "Claude", "Projects", "MAP Exhibit Project"),
    os.path.join(os.path.dirname(SCRIPT_DIR), "..", "MAP Exhibit Project"),  # sibling mount in Cowork
    SCRIPT_DIR,  # fallback: same folder as pipeline
]

def _find_exhibit_json(folder):
    """Find the most recent CustomReport_*.json file in a folder.
    Prefers combined multi-dataset exports (largest file) over single-view exports.
    """
    if not os.path.isdir(folder):
        return None
    candidates = [f for f in os.listdir(folder)
                  if f.startswith("CustomReport_") and f.endswith(".json")]
    if not candidates:
        # Also check for Articulations-prefixed exports (older naming convention)
        candidates = [f for f in os.listdir(folder)
                      if f.startswith("Articulations_CustomReport_") and f.endswith(".json")]
    if not candidates:
        return None
    # Sort by date-stamp in filename (newest first)
    candidates.sort(reverse=True)
    return os.path.join(folder, candidates[0])

EXHIBIT_FILE = None
for _loc in _EXHIBIT_LOCATIONS:
    EXHIBIT_FILE = _find_exhibit_json(_loc)
    if EXHIBIT_FILE:
        break

# ── Column map (1-indexed) ──────────────────────────────────────────
COL_ID          = 1
COL_NAME        = 2
COL_DESC        = 3
COL_ACTIVITY    = 4
COL_V2030       = 5
COL_GOAL        = 6
COL_BUDGET_SRC  = 7
COL_BUDGET      = 8
COL_LEAD        = 9
COL_TEAM        = 10
COL_STATUS      = 11
COL_PCT         = 12
COL_START       = 13
COL_END         = 14
COL_MILESTONES  = 15
COL_UPDATE      = 16
COL_UPDATE_DATE = 17
COL_KPI_METRIC  = 18   # R
COL_KPI_UNIT    = 19   # S  — KPI Unit (single column for all years)
COL_KPI_G2526   = 20   # T  — KPI Goal 25-26
COL_KPI_S2526   = 21   # U  — KPI Stretch 25-26
COL_KPI_G2627   = 22   # V  — KPI Goal 26-27
COL_KPI_S2627   = 23   # W  — KPI Stretch 26-27
COL_KPI_G2728   = 24   # X  — KPI Goal 27-28
COL_KPI_S2728   = 25   # Y  — KPI Stretch 27-28
COL_KPI_G2829   = 26   # Z  — KPI Goal 28-29
COL_KPI_S2829   = 27   # AA — KPI Stretch 28-29
COL_KPI_G2930   = 28   # AB — KPI Goal 29-30 (Vision 2030)
COL_KPI_S2930   = 29   # AC — KPI Stretch 29-30
COL_WP_NOTES    = 30   # AD
COL_KPI_ORDER   = 31   # AE — display order for headline KPI cards (lower = first)


def scan_attachments(attachments_dir):
    """Scan a local attachments directory with subfolders and return counts.
    Expected structure:
      Attachments/
        Activity 1/         ← activity-level attachments
        Activity 2/
        1.1 MAP Platform Development/  ← project-level attachments
        2.1 Credit Recommendations/
        (root-level files count toward total only)
    Returns dict:
      {"total": N, "root_files": N,
       "by_activity": {"1": N, "2": N, ...},
       "by_project": {"1.1": N, "2.1": N, ...}}
    """
    import re as _re
    result = {"total": 0, "root_files": 0, "by_activity": {}, "by_project": {}}
    if not attachments_dir or not os.path.isdir(attachments_dir):
        return result

    def _count_files(folder):
        """Count non-hidden files in a directory (non-recursive)."""
        if not os.path.isdir(folder):
            return 0
        return sum(1 for f in os.listdir(folder)
                   if os.path.isfile(os.path.join(folder, f)) and not f.startswith('.'))

    for entry in os.listdir(attachments_dir):
        fpath = os.path.join(attachments_dir, entry)
        if entry.startswith('.'):
            continue
        if os.path.isfile(fpath):
            result["root_files"] += 1
            result["total"] += 1
        elif os.path.isdir(fpath):
            count = _count_files(fpath)
            result["total"] += count
            # Match "Activity N" folders
            m_act = _re.match(r'^Activity\s+(\d+)', entry, _re.IGNORECASE)
            if m_act:
                result["by_activity"][m_act.group(1)] = count
                continue
            # Match "N.N Project Name" folders
            m_proj = _re.match(r'^(\d+\.\d+)', entry)
            if m_proj:
                pid = m_proj.group(1)
                result["by_project"][pid] = count
                # Also roll up to activity
                act_num = pid.split(".")[0]
                result["by_activity"][act_num] = result["by_activity"].get(act_num, 0) + count
    return result


def ensure_attachment_subfolders(attachments_dir, projects):
    """Create subfolders for each Activity and Project if they don't exist.
    Called during pipeline run to auto-create folders for new projects.
    """
    if not attachments_dir or not os.path.isdir(attachments_dir):
        return 0
    created = 0
    activities_seen = set()
    for p in projects:
        pid = p.get("id", "")
        name = p.get("name", "")
        if not pid:
            continue
        act_num = pid.split(".")[0]
        # Create Activity folder
        if act_num not in activities_seen:
            activities_seen.add(act_num)
            act_folder = os.path.join(attachments_dir, f"Activity {act_num}")
            if not os.path.exists(act_folder):
                os.makedirs(act_folder, exist_ok=True)
                created += 1
        # Create project folder (skip sub-population rows like 3.1.1)
        if pid.count(".") == 1 and name:
            # Sanitize folder name
            safe_name = "".join(c for c in name if c.isalnum() or c in " -_&().").strip()
            proj_folder = os.path.join(attachments_dir, f"{pid} {safe_name}")
            if not os.path.exists(proj_folder):
                os.makedirs(proj_folder, exist_ok=True)
                created += 1
    return created


def read_project_config(wb):
    """Read project configuration from rows 1-2 of the Project List tab.
    Layout:
      A1='Project Title:', B1=title, E1='Project ID:', F1=id,
      H1='Attachments URL:', I1=url
      A2='Description:', B2=description text
    Returns dict with keys: title, project_id, description, attachments_url
    """
    ws = wb["Project List"]
    config = {
        "title": str(ws.cell(1, 2).value or "CPL Initiative").strip(),
        "project_id": str(ws.cell(1, 6).value or "").strip(),
        "attachments_url": str(ws.cell(1, 9).value or "").strip(),
        "description": str(ws.cell(2, 2).value or "").strip(),
    }
    return config


# ── Official CPL Workplan Goal Definitions ─────────────────────────
# Source: CCCCO Vision 2030 Credit for Prior Learning Workplan
CPL_GOALS = {
    "Goal 1": {
        "title": "Expand Equitable CPL Access & Boost Student Success",
        "target": "By 2030, expand CPL opportunities for at least 250,000 Californians, including 220,000 working adults and apprentices, and 30,000 veterans.",
        "bullets": [
            "Offer or award CPL using 1,000 statewide credit recommendations from 25 faculty/industry workgroups",
            "80% of CPL recipients report improvements in savings, belonging, well-being, completion, and career prospects",
            "500 personal success stories documented in MAP",
        ],
        "stretch": "Stretch: Serve 500,000 learners (450K adults + 50K veterans); 3,000 credit recommendations from 40 workgroups; 90% reporting improvements; 1,000 success stories",
    },
    "Goal 2": {
        "title": "Build a Unified, Interoperable, Student-Centered CPL System",
        "target": "By 2030, build a unified statewide CPL system with CPL-embedded outreach pathways, interoperable data, and seamless student experiences.",
        "bullets": [
            "MAP platform serving all 116 colleges with AI-enhanced tools and credential matching",
            "Full interoperability with CCCApply, eTranscript, MIS, and Credential Engine",
            "Statewide CPL data infrastructure tracking offers, awards, transcription, and student outcomes",
        ],
        "stretch": "",
    },
    "Goal 3": {
        "title": "Sustainable Policies, Resources & Professional Learning",
        "target": "By 2030, establish clear CPL policies, sustainable resources, professional development, and best practices across all colleges.",
        "bullets": [
            "Permanent CPL operational funding secured ($5\u20137.5M ongoing)",
            "Title 5 \u00a755050 regulatory updates reducing residency and access barriers",
            "1,000+ staff, faculty, and administrators trained in CPL implementation",
            "Scalable technical assistance model for all 116 colleges",
        ],
        "stretch": "",
    },
}


def fmt_date(val):
    if isinstance(val, datetime):
        return val.strftime("%Y-%m-%d")
    return str(val) if val else ""


def fmt_number(val):
    """Format a number with commas for display (e.g. 42620 -> '42,620').
    Handles both numeric types and string representations of numbers.
    """
    if val is None or val == "":
        return ""
    # If it's already numeric, format directly
    if isinstance(val, (int, float)):
        if float(val) == int(val):
            return f"{int(val):,}"
        return f"{val:,.1f}"
    # Try to parse string as number (e.g. '42620' -> 42,620)
    s = str(val).strip().replace(",", "")
    try:
        n = float(s)
        if n == int(n):
            return f"{int(n):,}"
        return f"{n:,.1f}"
    except ValueError:
        return str(val)


def fmt_dollars(val):
    """Format a numeric value as dollars with smart scaling.
    - Millions: $X.XM (e.g., 6000000 -> $6.0M)
    - Thousands: $XXK (e.g., 50000 -> $50K)
    - Exact: $XXX (e.g., 999 -> $999)
    Handles None and non-numeric gracefully (returns $0).
    """
    if val is None or val == "":
        return "$0"
    # Convert to float
    try:
        if isinstance(val, str):
            num = float(val.replace(",", "").replace("$", "").strip())
        else:
            num = float(val)
    except (ValueError, AttributeError):
        return "$0"

    if num == 0:
        return "$0"

    # Determine scaling
    abs_num = abs(num)
    if abs_num >= 1_000_000:
        # Millions
        return f"${num / 1_000_000:.1f}M".rstrip('0').rstrip('.')
    elif abs_num >= 1_000:
        # Thousands
        return f"${num / 1_000:.0f}K"
    else:
        # Exact dollars
        return f"${num:,.0f}"


def substitute_kpi(text, kpi_value):
    """Replace {KPI} tokens in text with the formatted KPI metric value."""
    if not text or not kpi_value:
        return text or ""
    formatted = fmt_number(kpi_value)  # handles both numeric and string values
    return str(text).replace("{KPI}", formatted)


def cell_val(ws, row, col, default=""):
    v = ws.cell(row=row, column=col).value
    return v if v is not None else default


def archive_updates_to_log(excel_path):
    """Auto-archive: copy current Project List notes (col P/Q) into the Update Log tab.
    Only adds a row if the project ID + date + note combo doesn't already exist.
    This runs before the read-only passes so the log is always up to date.
    """
    from openpyxl import load_workbook as _lwb
    try:
        wb = _lwb(excel_path)
    except Exception as e:
        print(f"  (Skipping update archive — cannot open Excel for writing: {e})")
        return

    # Ensure Update Log tab exists with headers
    if "Update Log" not in wb.sheetnames:
        ws_log = wb.create_sheet("Update Log")
    else:
        ws_log = wb["Update Log"]

    # Set up headers if missing or wrong
    # Col 4 = Type: "update" or "workplan" to distinguish note sources
    if ws_log.cell(1, 1).value != "Project ID" or ws_log.cell(1, 4).value != "Type":
        ws_log.cell(1, 1, "Project ID")
        ws_log.cell(1, 2, "Date")
        ws_log.cell(1, 3, "Note")
        ws_log.cell(1, 4, "Type")
        # Bold headers
        from openpyxl.styles import Font
        bold = Font(bold=True)
        for c in range(1, 5):
            ws_log.cell(1, c).font = bold

    # Read existing log entries to avoid duplicates
    # Also track the most recent note text per project per type for auto-stamp detection
    existing = set()
    latest_by_pid = {}  # pid -> {"update": (date, note), "workplan": (date, note)}
    for r in range(2, ws_log.max_row + 1):
        eid = str(ws_log.cell(r, 1).value or "").strip()
        edate = ws_log.cell(r, 2).value
        enote = str(ws_log.cell(r, 3).value or "").strip()
        etype = str(ws_log.cell(r, 4).value or "update").strip()
        if isinstance(edate, datetime):
            edate = edate.strftime("%Y-%m-%d")
        else:
            edate = str(edate or "").strip()
        existing.add((eid, edate, enote, etype))
        # Track latest note per project per type
        if eid not in latest_by_pid:
            latest_by_pid[eid] = {}
        prev = latest_by_pid[eid].get(etype)
        if prev is None or edate >= prev[0]:
            latest_by_pid[eid][etype] = (edate, enote)

    # Read Project List and archive notes from both col P (update) and col V (workplan)
    # Auto-stamp col Q if either P or V changed since last log entry
    ws_pl = wb["Project List"]
    today_str = datetime.now().strftime("%Y-%m-%d")
    archived = 0
    auto_stamped = 0
    for r in range(4, ws_pl.max_row + 1):
        pid = cell_val(ws_pl, r, COL_ID, "")
        if not pid:
            continue
        pid = str(pid).strip()
        update_note = str(cell_val(ws_pl, r, COL_UPDATE, "")).strip()
        wp_note = str(cell_val(ws_pl, r, COL_WP_NOTES, "")).strip()

        if not update_note and not wp_note:
            continue

        # Check if either note changed → auto-stamp column Q
        pid_latest = latest_by_pid.get(pid, {})
        prev_update = pid_latest.get("update")
        prev_wp = pid_latest.get("workplan")
        changed = False
        if update_note and (prev_update is None or update_note != prev_update[1]):
            changed = True
        if wp_note and (prev_wp is None or wp_note != prev_wp[1]):
            changed = True

        if changed:
            ws_pl.cell(row=r, column=COL_UPDATE_DATE, value=today_str)
            auto_stamped += 1
            date_str = today_str
        else:
            date_val = cell_val(ws_pl, r, COL_UPDATE_DATE, "")
            if isinstance(date_val, datetime):
                date_str = date_val.strftime("%Y-%m-%d")
            else:
                date_str = str(date_val or "").strip()
            if not date_str:
                ws_pl.cell(row=r, column=COL_UPDATE_DATE, value=today_str)
                auto_stamped += 1
                date_str = today_str

        # Archive update note (col P)
        if update_note:
            key = (pid, date_str, update_note, "update")
            if key not in existing:
                next_row = ws_log.max_row + 1
                ws_log.cell(next_row, 1, pid)
                ws_log.cell(next_row, 2, date_str)
                ws_log.cell(next_row, 3, update_note)
                ws_log.cell(next_row, 4, "update")
                existing.add(key)
                archived += 1

        # Archive workplan note (col V)
        if wp_note:
            key = (pid, date_str, wp_note, "workplan")
            if key not in existing:
                next_row = ws_log.max_row + 1
                ws_log.cell(next_row, 1, pid)
                ws_log.cell(next_row, 2, date_str)
                ws_log.cell(next_row, 3, wp_note)
                ws_log.cell(next_row, 4, "workplan")
                existing.add(key)
                archived += 1

    needs_save = archived > 0 or auto_stamped > 0
    if needs_save:
        try:
            wb.save(excel_path)
            if archived > 0:
                print(f"  Archived {archived} new note(s) to Update Log")
            if auto_stamped > 0:
                print(f"  Auto-stamped {auto_stamped} date(s) in column Q")
        except PermissionError:
            print(f"  (Skipping update archive — Excel file is locked)")
    else:
        print(f"  Update Log up to date (no new notes)")
    wb.close()


def read_update_log(wb):
    """Read the Update Log tab and return a dict of project_id -> list of
    {date, note, type}, sorted from newest to oldest.
    Type is 'update' (col P) or 'workplan' (col V)."""
    log = {}
    if "Update Log" not in wb.sheetnames:
        return log

    ws = wb["Update Log"]
    for r in range(2, ws.max_row + 1):
        pid = str(ws.cell(r, 1).value or "").strip()
        if not pid:
            continue
        date_val = ws.cell(r, 2).value
        note = str(ws.cell(r, 3).value or "").strip()
        ntype = str(ws.cell(r, 4).value or "update").strip()
        if not note:
            continue
        if isinstance(date_val, datetime):
            date_str = date_val.strftime("%Y-%m-%d")
        else:
            date_str = str(date_val or "").strip()
        log.setdefault(pid, []).append({"date": date_str, "note": note, "type": ntype})

    # Sort each project's notes newest-first
    for pid in log:
        log[pid].sort(key=lambda x: x["date"], reverse=True)

    return log


def read_projects(wb):
    ws = wb["Project List"]
    projects = []

    for r in range(4, ws.max_row + 1):
        pid = cell_val(ws, r, COL_ID, None)
        if not pid:
            break

        # ── percentage ──
        pct_raw = cell_val(ws, r, COL_PCT, 0)
        if isinstance(pct_raw, (int, float)):
            pct = int(round(pct_raw * 100)) if pct_raw <= 1 else int(pct_raw)
        else:
            pct = 0

        # ── KPI columns ──
        kpi_metric = cell_val(ws, r, COL_KPI_METRIC, None)
        kpi_unit   = cell_val(ws, r, COL_KPI_UNIT, "")
        kpi_g2526  = cell_val(ws, r, COL_KPI_G2526, "")
        kpi_s2526  = cell_val(ws, r, COL_KPI_S2526, "")
        kpi_g2627  = cell_val(ws, r, COL_KPI_G2627, "")
        kpi_s2627  = cell_val(ws, r, COL_KPI_S2627, "")
        kpi_g2728  = cell_val(ws, r, COL_KPI_G2728, "")
        kpi_s2728  = cell_val(ws, r, COL_KPI_S2728, "")
        kpi_g2829  = cell_val(ws, r, COL_KPI_G2829, "")
        kpi_s2829  = cell_val(ws, r, COL_KPI_S2829, "")
        kpi_g2930  = cell_val(ws, r, COL_KPI_G2930, "")
        kpi_s2930  = cell_val(ws, r, COL_KPI_S2930, "")
        wp_notes   = cell_val(ws, r, COL_WP_NOTES, "")
        kpi_order  = cell_val(ws, r, COL_KPI_ORDER, None)

        # ── raw text fields (before substitution) ──
        desc_raw       = str(cell_val(ws, r, COL_DESC, ""))
        milestones_raw = str(cell_val(ws, r, COL_MILESTONES, ""))
        update_raw     = str(cell_val(ws, r, COL_UPDATE, ""))

        # ── {KPI} substitution ──
        desc       = substitute_kpi(desc_raw, kpi_metric)
        milestones = substitute_kpi(milestones_raw, kpi_metric)
        update     = substitute_kpi(update_raw, kpi_metric)

        projects.append({
            "id":            str(pid),
            "name":          cell_val(ws, r, COL_NAME, ""),
            "desc":          desc,
            "activity":      cell_val(ws, r, COL_ACTIVITY, ""),
            "v2030":         cell_val(ws, r, COL_V2030, ""),
            "goal":          cell_val(ws, r, COL_GOAL, ""),
            "budget_source": cell_val(ws, r, COL_BUDGET_SRC, ""),
            "budget":        cell_val(ws, r, COL_BUDGET, ""),
            "lead":          cell_val(ws, r, COL_LEAD, ""),
            "team":          cell_val(ws, r, COL_TEAM, ""),
            "status":        cell_val(ws, r, COL_STATUS, ""),
            "pct":           pct,
            "start":         fmt_date(cell_val(ws, r, COL_START, "")),
            "end":           fmt_date(cell_val(ws, r, COL_END, "")),
            "milestones":    milestones,
            "update":        update,
            "update_date":   fmt_date(cell_val(ws, r, COL_UPDATE_DATE, "")),
            "kpi_metric":    fmt_number(kpi_metric) if kpi_metric is not None else "",
            "kpi_unit":      str(kpi_unit),
            "kpi_goal_2526": fmt_number(kpi_g2526) if isinstance(kpi_g2526, (int, float)) else str(kpi_g2526) if kpi_g2526 else "",
            "kpi_stretch_2526": fmt_number(kpi_s2526) if isinstance(kpi_s2526, (int, float)) else str(kpi_s2526) if kpi_s2526 else "",
            "kpi_goal_2627": fmt_number(kpi_g2627) if isinstance(kpi_g2627, (int, float)) else str(kpi_g2627) if kpi_g2627 else "",
            "kpi_stretch_2627": fmt_number(kpi_s2627) if isinstance(kpi_s2627, (int, float)) else str(kpi_s2627) if kpi_s2627 else "",
            "kpi_goal_2728": fmt_number(kpi_g2728) if isinstance(kpi_g2728, (int, float)) else str(kpi_g2728) if kpi_g2728 else "",
            "kpi_stretch_2728": fmt_number(kpi_s2728) if isinstance(kpi_s2728, (int, float)) else str(kpi_s2728) if kpi_s2728 else "",
            "kpi_goal_2829": fmt_number(kpi_g2829) if isinstance(kpi_g2829, (int, float)) else str(kpi_g2829) if kpi_g2829 else "",
            "kpi_stretch_2829": fmt_number(kpi_s2829) if isinstance(kpi_s2829, (int, float)) else str(kpi_s2829) if kpi_s2829 else "",
            "kpi_goal_2930": fmt_number(kpi_g2930) if isinstance(kpi_g2930, (int, float)) else str(kpi_g2930) if kpi_g2930 else "",
            "kpi_stretch_2930": fmt_number(kpi_s2930) if isinstance(kpi_s2930, (int, float)) else str(kpi_s2930) if kpi_s2930 else "",
            "workplan_notes": substitute_kpi(str(wp_notes), kpi_metric),
            "kpi_order": int(kpi_order) if isinstance(kpi_order, (int, float)) and kpi_order else None,
            "excel_row": r,
        })

    return projects


def read_annual_goals(wb):
    """
    Read the 'Annual Workplan Goals' tab.
    Returns a list of dicts, one per sub-activity, each with:
      id, name, activity_label, goal/stretch/current for each year, and totals.
    Activity header rows (no ID) are kept as group separators.
    """
    if "Annual Workplan Goals" not in wb.sheetnames:
        print("  WARNING: 'Annual Workplan Goals' tab not found — skipping")
        return []

    ws = wb["Annual Workplan Goals"]
    year_cols = ["2025-26", "2026-27", "2027-28", "2028-29", "2029-30"]

    rows = []
    current_activity = ""
    r = 2  # skip header row
    while r <= ws.max_row:
        pid = cell_val(ws, r, 1, "")
        name = cell_val(ws, r, 2, "")
        row_type = str(cell_val(ws, r, 3, "")).strip().upper()

        # Activity header row (no ID, no row type)
        if not pid and not row_type and name:
            current_activity = str(name)
            r += 1
            continue

        if not pid or row_type != "GOAL":
            r += 1
            continue

        # Read GOAL row
        goal_vals = {}
        for ci, yr in enumerate(year_cols, start=4):
            v = cell_val(ws, r, ci, 0)
            goal_vals[yr] = float(v) if isinstance(v, (int, float)) else 0
        goal_vals["total"] = float(cell_val(ws, r, 9, 0) or 0)

        # Next row should be CURRENT
        current_vals = {}
        if r + 1 <= ws.max_row and str(cell_val(ws, r + 1, 3, "")).strip().upper() == "CURRENT":
            for ci, yr in enumerate(year_cols, start=4):
                v = cell_val(ws, r + 1, ci, 0)
                current_vals[yr] = float(v) if isinstance(v, (int, float)) else 0
            current_vals["total"] = float(cell_val(ws, r + 1, 9, 0) or 0)

        # Next row should be STRETCH
        stretch_vals = {}
        if r + 2 <= ws.max_row and str(cell_val(ws, r + 2, 3, "")).strip().upper() == "STRETCH":
            for ci, yr in enumerate(year_cols, start=4):
                v = cell_val(ws, r + 2, ci, 0)
                stretch_vals[yr] = float(v) if isinstance(v, (int, float)) else 0
            stretch_vals["total"] = float(cell_val(ws, r + 2, 9, 0) or 0)

        rows.append({
            "id": str(pid),
            "name": str(name),
            "activity": current_activity,
            "goal": goal_vals,
            "current": current_vals,
            "stretch": stretch_vals,
        })
        r += 3  # skip GOAL/CURRENT/STRETCH triplet

    return rows


def populate_current_metrics(annual_goals, projects):
    """
    Fill in the 'current' 2025-26 column for each annual goal row
    using actual metrics from the Project List and live data.
    """
    proj_map = {p["id"]: p for p in projects}
    # Sub-population data rows
    dpop = {p["id"]: p for p in projects if p["id"].startswith("D.")}

    # Mapping: annual goal ID → how to compute current metric
    # Most map to the Project List KPI metric for the matching or related project ID
    metric_map = {
        "1.1": lambda: 1,  # MAP platform operational = 1
        "1.2": lambda: _pcount(proj_map, "1.2"),
        "1.3": lambda: 1 if _ppct(proj_map, "1.3") >= 50 else 0,
        "1.4": lambda: _pmetric_int(proj_map, "1.4"),
        "2.1": lambda: _pmetric_int(proj_map, "2.1"),
        "2.2": lambda: _pmetric_int(proj_map, "2.2"),  # pathway templates ~ workgroups for now
        "2.3": lambda: _pmetric_int(proj_map, "2.3"),
        "2.4": lambda: 1 if _ppct(proj_map, "5.1") > 0 else 0,  # AI-Ready = project 5.1
        "3.1": lambda: _pmetric_int(proj_map, "3.1"),
        "3.1.1": lambda: _pmetric_int(dpop, "D.1"),
        "3.1.2": lambda: _pmetric_int(dpop, "D.2"),
        "3.1.2b": lambda: _pmetric_int(dpop, "D.3"),
        "3.2": lambda: _pmetric_int(proj_map, "3.2"),
        "3.3": lambda: _pmetric_int(proj_map, "3.3"),
        "3.4": lambda: _pmetric_int(proj_map, "3.5"),  # stories
        "4.1": lambda: 2,  # Title 5 regulatory updates in progress
        "4.2": lambda: 5,  # $5M ongoing secured
        "4.3": lambda: _pmetric_int(proj_map, "4.3"),  # trainings
        "4.4": lambda: _pmetric_int(proj_map, "4.3"),  # TA & college support ~ trainings delivered
        "4.5": lambda: _pmetric_int(proj_map, "5.4"),  # research = RP Group survey
    }

    for row in annual_goals:
        getter = metric_map.get(row["id"])
        if getter:
            try:
                val = getter()
            except Exception:
                val = 0
            row["current"]["2025-26"] = val
            row["current"]["total"] = val  # only first year has actuals so far


def _pmetric_int(pmap, pid):
    """Extract integer metric from a project map entry."""
    p = pmap.get(pid)
    if not p:
        return 0
    m = p.get("kpi_metric", "")
    try:
        return int(str(m).replace(",", "").replace("k", "000").replace("K", "000").rstrip("+"))
    except (ValueError, TypeError):
        return 0


def _ppct(pmap, pid):
    p = pmap.get(pid)
    return p.get("pct", 0) if p else 0


def _pcount(pmap, pid):
    """Count non-empty integrations for a project."""
    p = pmap.get(pid)
    if not p:
        return 0
    m = p.get("kpi_metric", "")
    try:
        return int(str(m).replace(",", ""))
    except (ValueError, TypeError):
        return 0


def render_annual_goals_table_html(annual_goals):
    """
    Render the Annual Workplan Goals as a static HTML table
    at the bottom of the dashboard. Shows GOAL, CURRENT, STRETCH for each row.
    """
    if not annual_goals:
        return ""

    year_cols = ["2025-26", "2026-27", "2027-28", "2028-29", "2029-30"]

    html = '''        <div style="margin:2rem 0;padding:1.5rem;background:#fff;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
            <h2 style="color:#0A2240;margin:0 0 1rem 0;">Annual Workplan Goals</h2>
            <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:0.82rem;">
                <thead>
                    <tr style="background:#0A2240;color:#fff;">
                        <th style="padding:0.5rem 0.6rem;text-align:left;white-space:nowrap;border:1px solid #163A5F;">Sub-Activity</th>
                        <th style="padding:0.5rem 0.4rem;text-align:center;width:55px;border:1px solid #163A5F;">Type</th>
'''
    for yr in year_cols:
        html += f'                        <th style="padding:0.5rem 0.4rem;text-align:right;white-space:nowrap;border:1px solid #163A5F;">{yr}</th>\n'
    html += '                        <th style="padding:0.5rem 0.4rem;text-align:right;border:1px solid #163A5F;">TOTAL</th>\n'
    html += '                    </tr>\n                </thead>\n                <tbody>\n'

    current_activity = ""
    for row in annual_goals:
        # Activity group header
        if row["activity"] != current_activity:
            current_activity = row["activity"]
            html += (f'                    <tr style="background:#163A5F;color:#fff;">\n'
                     f'                        <td colspan="8" style="padding:0.5rem 0.6rem;font-weight:700;border:1px solid #0A2240;">{current_activity}</td>\n'
                     f'                    </tr>\n')

        # Three rows per sub-activity: GOAL, CURRENT, STRETCH
        for rtype, vals, style in [
            ("Goal", row["goal"], "background:#FAF8F4;font-weight:600;color:#0A2240;"),
            ("Current", row["current"], "background:#fff;color:#2A7D4F;font-weight:700;"),
            ("Stretch", row["stretch"], "background:#FAF8F4;color:#C9A84C;font-style:italic;"),
        ]:
            is_first = rtype == "Goal"
            name_cell = ""
            if is_first:
                name_cell = (f'<td rowspan="3" style="padding:0.4rem 0.6rem;border:1px solid #ddd;'
                             f'vertical-align:top;font-weight:600;background:#fff;">'
                             f'<span style="color:#888;font-size:0.75rem;">{row["id"]}</span> {row["name"]}</td>')

            html += f'                    <tr style="{style}">\n'
            html += f'                        {name_cell}\n'
            html += (f'                        <td style="padding:0.3rem 0.4rem;text-align:center;border:1px solid #ddd;'
                     f'font-size:0.75rem;">{rtype}</td>\n')
            for yr in year_cols:
                v = vals.get(yr, 0)
                # Format: integers as commas, decimals with 1 place
                if isinstance(v, float) and v == int(v):
                    v = int(v)
                disp = fmt_number(v) if v else ""
                # Highlight current year (2025-26) with special styling
                yr_style = "font-weight:700;" if yr == "2025-26" and rtype == "Current" and v else ""
                html += (f'                        <td style="padding:0.3rem 0.4rem;text-align:right;border:1px solid #ddd;{yr_style}">'
                         f'{disp}</td>\n')
            total = vals.get("total", 0)
            if isinstance(total, float) and total == int(total):
                total = int(total)
            html += (f'                        <td style="padding:0.3rem 0.4rem;text-align:right;border:1px solid #ddd;font-weight:700;">'
                     f'{fmt_number(total) if total else ""}</td>\n')
            html += '                    </tr>\n'

    html += '                </tbody>\n            </table>\n            </div>\n        </div>\n'
    return html


def build_activity_kpis(projects):
    """
    Build 19 activity-level KPI cards from the core sub-activities (1.1-4.5).
    Groups them by Activity 1-4 for the dashboard.
    """
    # Core sub-activity IDs in order (19 Workplan sub-activities)
    # Note: 4.1 is represented by 4.1a-4.1d in the project list (sprint components)
    core_ids = [
        "1.1", "1.2", "1.3", "1.4",
        "2.1", "2.2", "2.3", "2.4",
        "3.1", "3.2", "3.3", "3.4", "3.5", "3.6",
        "4.1",  # aggregated from 4.1a-4.1d
        "4.2", "4.3", "4.4", "4.5",
    ]

    # Sub-IDs that compose 4.1
    sprint_ids = ["4.1a", "4.1b", "4.1c", "4.1d"]

    activity_labels = {
        "1": "Activity 1: Build AI-Enhanced CPL Infrastructure",
        "2": "Activity 2: Faculty Workgroups & Credit Recommendations",
        "3": "Activity 3: Build CPL Data Infrastructure",
        "4": "Activity 4: Sprints, Projects, Partnerships & Scale",
    }

    # Build a lookup by project ID
    proj_map = {p["id"]: p for p in projects}

    # Build composite entry for 4.1 (Sprints) from 4.1a-4.1d
    sprint_projects = [proj_map[sid] for sid in sprint_ids if sid in proj_map]
    if sprint_projects:
        sprint_details = "; ".join(
            f"{sp['id']} {sp['name']}: {sp['kpi_metric'] or 'N/A'} {sp['kpi_unit']}"
            for sp in sprint_projects
        )
        # Use the first sprint with a workplan note, or compose one
        wp_note = next((sp["workplan_notes"] for sp in sprint_projects if sp["workplan_notes"]), "")
        composite_41 = {
            "id": "4.1",
            "name": "Sprints (Veteran, Apprenticeship, Adoption, 29 Palms)",
            "kpi_metric": str(len(sprint_projects)),
            "kpi_unit": "active sprints",
            "kpi_goal_2526": "",
            "kpi_stretch_2526": "",
            "kpi_goal_2627": "",
            "kpi_stretch_2627": "",
            "kpi_goal_2728": "",
            "kpi_stretch_2728": "",
            "kpi_goal_2829": "",
            "kpi_stretch_2829": "",
            "kpi_goal_2930": "",
            "kpi_stretch_2930": "",
            "workplan_notes": wp_note or f"Components: {sprint_details}",
            "status": "In Progress",
            "pct": sum(sp["pct"] for sp in sprint_projects) // len(sprint_projects),
            "excel_row": sprint_projects[0].get("excel_row", 0),
            "sprint_components": [
                {
                    "id": sp["id"],
                    "name": sp["name"],
                    "metric": sp["kpi_metric"],
                    "unit": sp["kpi_unit"],
                    "status": sp["status"],
                    "pct": sp["pct"],
                }
                for sp in sprint_projects
            ],
        }
        proj_map["4.1"] = composite_41

    groups = {}  # key = "1","2","3","4"
    for pid in core_ids:
        p = proj_map.get(pid)
        if not p:
            continue
        act_num = pid.split(".")[0]
        if act_num not in groups:
            groups[act_num] = {
                "activity_id": f"Activity {act_num}",
                "activity_name": activity_labels.get(act_num, f"Activity {act_num}"),
                "kpis": [],
            }
        entry = {
            "id":            p["id"],
            "name":          p.get("name", ""),
            "goal":          p.get("goal", ""),
            "metric":        p.get("kpi_metric", ""),
            "unit":          p.get("kpi_unit", ""),
            "goal_2526":   p.get("kpi_goal_2526", ""),
            "stretch_2526":  p.get("kpi_stretch_2526", ""),
            "goal_2627":   p.get("kpi_goal_2627", ""),
            "stretch_2627":  p.get("kpi_stretch_2627", ""),
            "goal_2728":   p.get("kpi_goal_2728", ""),
            "stretch_2728":  p.get("kpi_stretch_2728", ""),
            "goal_2829":   p.get("kpi_goal_2829", ""),
            "stretch_2829":  p.get("kpi_stretch_2829", ""),
            "goal_2930":   p.get("kpi_goal_2930", ""),
            "stretch_2930":  p.get("kpi_stretch_2930", ""),
            "workplan_notes": p.get("workplan_notes", ""),
            "update":        p.get("update", ""),
            "update_date":   p.get("update_date", ""),
            "status":        p.get("status", ""),
            "pct":           p.get("pct", 0),
            "excel_row":     p.get("excel_row", 0),
        }
        # Include sprint components for 4.1
        if pid == "4.1" and "sprint_components" in p:
            entry["sprint_components"] = p["sprint_components"]
        groups[act_num]["kpis"].append(entry)

    # Return as ordered list
    return [groups[k] for k in sorted(groups.keys()) if k in groups]


def render_kpi_section_html(kpis, kpi_display_order=None):
    """
    Generate static HTML for the headline KPI cards section,
    including LIVE badges, subtitles, and population breakdowns.
    kpi_display_order: list of KPI keys in desired display order.
    """
    default_order = ['cumulative_students', 'eligible_units', 'transcripted_units',
                     'credit_recommendations', 'map_exhibits', 'ccc_collaborative',
                     'active_colleges', 'articulation_colleges',
                     'estimated_savings', 'veteran_sprint', 'twenty_year_impact']
    display_keys = kpi_display_order if kpi_display_order else default_order

    cards_html = ""
    for key in display_keys:
        kpi = kpis.get(key)
        if not kpi:
            continue

        # ── Standard KPI card rendering ──
        live_badge = ' <span class="kpi-live-badge">LIVE</span>' if kpi.get("live") else ""
        sub_html = ""
        if kpi.get("sub"):
            sub_html = f'<div class="kpi-sub" style="font-size:0.75rem;opacity:0.85;margin-top:2px;color:#fff;">{kpi["sub"]}</div>'
        bd_html = ""
        if kpi.get("breakdowns"):
            rows = ""
            for bd in kpi["breakdowns"]:
                note_html = f' <span class="kpi-bd-note">({bd["note"]})</span>' if bd.get("note") else ""
                rows += (f'<div class="kpi-bd-row">'
                         f'<span class="kpi-bd-label">{bd["label"]}{note_html}</span>'
                         f'<span class="kpi-bd-value">{bd["value"]}</span>'
                         f'</div>\n')
            bd_html = f'<div class="kpi-breakdowns">{rows}</div>'

        # Footnote (e.g. tier criteria for Active Colleges)
        fn_html = ""
        if kpi.get("footnote"):
            fn_items = "".join(f'<div class="kpi-fn-item">{item}</div>' for item in kpi["footnote"])
            fn_html = f'<div class="kpi-footnote">{fn_items}</div>'

        cards_html += (
            f'        <div class="kpi-card">\n'
            f'            <div class="kpi-number">{kpi["value"]}{live_badge}</div>\n'
            f'            <div class="kpi-label">{kpi["label"]}</div>\n'
            f'            {sub_html}\n'
            f'            {bd_html}\n'
            f'            {fn_html}\n'
            f'        </div>\n'
        )
    return cards_html


def _att_badge(attachments, act_num=None, project_id=None):
    """Return a small count badge HTML if there are attachments for an activity or project."""
    if not attachments:
        return ""
    count = 0
    if project_id:
        count = attachments.get("by_project", {}).get(str(project_id), 0)
    elif act_num:
        count = attachments.get("by_activity", {}).get(str(act_num), 0)
    if count <= 0:
        return ""
    return (f' <span style="background:#C9A84C;color:#0A2240;font-size:0.6rem;'
            f'font-weight:700;padding:1px 5px;border-radius:8px;margin-left:2px;">'
            f'{count}</span>')


def render_activity_kpis_html(activity_kpis, annual_goals=None, update_log=None, attachments=None):
    """
    Generate static HTML for the 19 activity-level KPI cards section.
    KPI cards are grouped under Goal sub-headers within each Activity.
    annual_goals: list from read_annual_goals() — used to show 2025-26 targets.
    """
    if not activity_kpis:
        return ""

    # Build a lookup: activity number → list of annual goal rows for that activity
    ag_by_activity = {}
    if annual_goals:
        for ag in annual_goals:
            act_num = ag["id"].split(".")[0]
            ag_by_activity.setdefault(act_num, []).append(ag)

    html = '            <h2>Workplan Activity Metrics</h2>\n'

    # Activity-level goals for progress bars
    activity_goals = {
        "Activity 1": "AI-enhanced MAP platform with student portal, integrations, and credential registry",
        "Activity 2": "1,000 statewide credit recommendations from 25 faculty/industry workgroups",
        "Activity 3": "Statewide CPL data infrastructure tracking 250K students across 116 colleges",
        "Activity 4": "Scale CPL through sprints, partnerships, training, policy, and sustainable funding",
    }

    for group in activity_kpis:
        act_id = group["activity_id"]
        act_name = group["activity_name"].replace(act_id + ": ", "")
        act_num = act_id.replace("Activity ", "")

        # Compute average progress across sub-activities in this group
        pcts = [kpi.get("pct", 0) for kpi in group["kpis"]]
        avg_pct = round(sum(pcts) / len(pcts)) if pcts else 0
        completed = sum(1 for p in pcts if p >= 100)
        total_kpis = len(pcts)
        act_goal_text = activity_goals.get(act_id, "")

        # Determine bar color based on avg progress
        if avg_pct >= 75:
            bar_color = "#2A7D4F"  # green
        elif avg_pct >= 50:
            bar_color = "#C9A84C"  # gold
        elif avg_pct >= 25:
            bar_color = "#4A90D9"  # blue
        else:
            bar_color = "#888"     # gray

        # Build 2025-26 annual goals summary for this activity
        ag_items = ag_by_activity.get(act_num, [])
        annual_summary = ""
        if ag_items:
            parts = []
            for ag in ag_items:
                g_val = ag["goal"].get("2025-26", 0)
                c_val = ag["current"].get("2025-26", 0)
                if g_val:
                    g_int = int(g_val) if float(g_val) == int(g_val) else g_val
                    c_int = int(c_val) if float(c_val) == int(c_val) else c_val
                    # Shorten name for display
                    short_name = ag["name"]
                    if len(short_name) > 30:
                        short_name = short_name[:28] + "…"
                    parts.append(f'{short_name}: <strong>{fmt_number(c_int)}</strong>/{fmt_number(g_int)}')
            if parts:
                annual_summary = (
                    '<div style="margin-top:0.3rem;display:flex;flex-wrap:wrap;gap:0.3rem 1rem;">'
                    + ''.join(f'<span style="font-size:0.7rem;color:#555;">{p}</span>' for p in parts)
                    + '</div>'
                )

        html += f'            <div class="activity-group">\n'
        html += (f'            <div class="activity-group-header">\n'
                 f'                <h3><span style="color:#888;font-weight:600;">{act_id}:</span> {act_name}</h3>\n'
                 f'            </div>\n')
        # Activity progress bar with goal + annual targets
        html += (f'            <div style="padding:0 0.5rem 0.6rem 0.5rem;">\n'
                 f'                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem;">\n'
                 f'                    <span style="font-size:0.75rem;color:#555;">{act_goal_text}</span>\n'
                 f'                    <span style="font-size:0.75rem;font-weight:700;color:{bar_color};white-space:nowrap;margin-left:0.5rem;">{avg_pct}% avg &middot; {completed}/{total_kpis} complete (toward 2030 goal)</span>\n'
                 f'                </div>\n'
                 f'                <div style="height:6px;background:#e8e8e8;border-radius:3px;overflow:hidden;">\n'
                 f'                    <div style="height:100%;width:{avg_pct}%;background:{bar_color};border-radius:3px;transition:width 0.3s;"></div>\n'
                 f'                </div>\n'
                 f'            </div>\n')
        # Insert 2025-26 annual goal summary below progress bar
        if annual_summary:
            html += f'            <div style="padding:0 0.5rem 0.3rem 0.5rem;">{annual_summary}</div>\n'

        # Group KPIs by their primary Goal
        goal_groups = {}
        for kpi in group["kpis"]:
            goal_raw = kpi.get("goal", "")
            # Extract first goal (e.g., "Goal 1" from "Goal 1; Goal 2")
            primary_goal = ""
            if goal_raw:
                gm = re.match(r'(Goal\s*\d+)', goal_raw)
                if gm:
                    primary_goal = gm.group(1)
            if not primary_goal:
                primary_goal = "Other"
            goal_groups.setdefault(primary_goal, []).append(kpi)

        # Sort goal groups: Goal 1, Goal 2, Goal 3, then Other
        sorted_goals = sorted(goal_groups.keys(),
                              key=lambda g: (0, int(re.search(r'\d+', g).group())) if re.search(r'\d+', g) else (1, 0))

        for goal_key in sorted_goals:
            goal_kpis = goal_groups[goal_key]
            goal_info = CPL_GOALS.get(goal_key, {})
            goal_title = goal_info.get("title", "")
            if goal_key != "Other" and goal_title:
                html += (f'            <div class="goal-subheader" style="margin:1rem 0 0.5rem 0;padding:0.5rem 0.8rem;'
                         f'background:linear-gradient(90deg,#163A5F 0%,#0A2240 100%);border-radius:6px;">\n'
                         f'                <div style="display:flex;align-items:center;gap:0.6rem;">\n'
                         f'                    <span style="color:#C9A84C;font-weight:700;font-size:0.85rem;white-space:nowrap;">{goal_key}</span>\n'
                         f'                    <span style="color:#fff;font-size:0.8rem;font-weight:600;">{goal_title}</span>\n'
                         f'                </div>\n')
                # Add target text
                target = goal_info.get("target", "")
                if target:
                    html += f'                <div style="color:rgba(255,255,255,0.75);font-size:0.72rem;margin-top:0.2rem;line-height:1.3;">{target}</div>\n'
                html += f'            </div>\n'

            html += '            <div class="activity-kpi-grid">\n'

            for kpi in goal_kpis:
                has_metric = kpi.get("metric") and kpi["metric"] not in ("0", "")
                card_class = "has-metric" if has_metric else "no-metric"
                status_raw = kpi.get("status", "")
                status_class = status_raw.lower().replace(" ", "-")

                html += f'            <div class="activity-kpi-card {card_class}">\n'
                html += (f'                <div class="akpi-header">\n'
                         f'                    <span class="akpi-id">{kpi["id"]}</span>\n'
                         f'                    <span class="akpi-status status-badge status-{status_class}" '
                         f'style="margin:0;font-size:0.7rem;padding:0.15rem 0.5rem;">{status_raw}</span>\n'
                         f'                </div>\n')
                html += f'                <div class="akpi-name">{kpi["name"]}</div>\n'

                # 2030 Goal & Stretch subtitle
                g2930 = kpi.get("goal_2930", "")
                s2930_val = kpi.get("stretch_2930", "")
                if g2930:
                    sub_parts = [f'2030 Goal: {g2930}']
                    if s2930_val:
                        sub_parts.append(f'Stretch: {s2930_val}')
                    html += (f'                <div style="font-size:0.7rem;color:#666;margin:-0.2rem 0 0.3rem 0;">'
                             f'{" &nbsp; ".join(sub_parts)}</div>\n')

                if has_metric:
                    html += (f'                <div class="akpi-metric-row">\n'
                             f'                    <span class="akpi-metric-value">{kpi["metric"]}</span>\n'
                             f'                    <span class="akpi-metric-unit">{kpi["unit"]}</span>\n'
                             f'                </div>\n')
                else:
                    html += (f'                <div class="akpi-metric-row">\n'
                             f'                    <span class="akpi-metric-unit" style="opacity:0.5;">{kpi["unit"]}</span>\n'
                             f'                </div>\n')

                # Annual cumulative goals — mini table: Year / Goal / Stretch
                g2526 = kpi.get("goal_2526", "")
                g2627 = kpi.get("goal_2627", "")
                g2728 = kpi.get("goal_2728", "")
                g2829 = kpi.get("goal_2829", "")
                g2930_v = kpi.get("goal_2930", "")
                s2526 = kpi.get("stretch_2526", "")
                s2627 = kpi.get("stretch_2627", "")
                s2728 = kpi.get("stretch_2728", "")
                s2829 = kpi.get("stretch_2829", "")
                s2930 = kpi.get("stretch_2930", "")
                any_goal = g2526 or g2627 or g2728 or g2829 or g2930_v
                if any_goal:
                    tbl_style = ('font-size:0.65rem;border-collapse:collapse;width:100%;'
                                 'margin-top:0.3rem;text-align:center;')
                    th_style = 'padding:2px 4px;color:#666;font-weight:600;border-bottom:1px solid #ddd;'
                    td_style = 'padding:2px 4px;'
                    html += f'                <table style="{tbl_style}">\n'
                    # Header row: YEAR
                    html += '                  <tr>\n'
                    html += f'                    <td style="{th_style}font-weight:700;text-align:left;">YEAR</td>\n'
                    for yr in ['2526', '2627', '2728', '2829', '2930']:
                        html += f'                    <td style="{th_style}">{yr}</td>\n'
                    html += '                  </tr>\n'
                    # Goal row
                    html += '                  <tr>\n'
                    html += f'                    <td style="{td_style}font-weight:600;text-align:left;color:#0A2240;">GOAL</td>\n'
                    for v in [g2526, g2627, g2728, g2829, g2930_v]:
                        html += f'                    <td style="{td_style}">{v}</td>\n'
                    html += '                  </tr>\n'
                    # Stretch row
                    html += '                  <tr>\n'
                    html += f'                    <td style="{td_style}font-weight:600;text-align:left;color:#C9A84C;">STRETCH</td>\n'
                    for v in [s2526, s2627, s2728, s2829, s2930]:
                        html += f'                    <td style="{td_style}color:#C9A84C;">{v}</td>\n'
                    html += '                  </tr>\n'
                    html += '                </table>\n'
                    html += ('                <div style="font-size:0.55rem;color:#999;'
                             'font-style:italic;margin-top:0.15rem;">Note: All values are cumulative</div>\n')

                # Progress bar with percentage label
                pct = kpi.get("pct", 0)
                if pct >= 75:
                    pbar_color = "#2A7D4F"
                elif pct >= 50:
                    pbar_color = "#C9A84C"
                elif pct >= 25:
                    pbar_color = "#4A90D9"
                else:
                    pbar_color = "#888"
                html += (f'                <div class="akpi-progress" style="margin-top:0.5rem;">\n'
                         f'                    <div style="display:flex;justify-content:space-between;font-size:0.7rem;margin-bottom:0.15rem;">\n'
                         f'                        <span style="color:#666;">Progress</span>\n'
                         f'                        <span style="font-weight:700;color:{pbar_color};">{pct}%</span>\n'
                         f'                    </div>\n'
                         f'                    <div style="height:5px;background:#e8e8e8;border-radius:3px;overflow:hidden;">\n'
                         f'                        <div style="height:100%;width:{pct}%;background:{pbar_color};border-radius:3px;"></div>\n'
                         f'                    </div>\n'
                         f'                </div>\n')

                # Sprint components for 4.1
                if kpi.get("sprint_components"):
                    html += '                <div class="akpi-sprint-components" style="margin-top:0.5rem;font-size:0.75rem;">\n'
                    for sc in kpi["sprint_components"]:
                        sc_status_class = sc.get("status", "").lower().replace(" ", "-")
                        html += (f'                    <div style="display:flex;justify-content:space-between;padding:0.2rem 0;border-bottom:1px solid rgba(0,0,0,0.05);">\n'
                                 f'                        <span><strong>{sc["id"]}</strong> {sc["name"]}</span>\n'
                                 f'                        <span class="status-badge status-{sc_status_class}" style="font-size:0.65rem;padding:0.1rem 0.4rem;">{sc.get("status","")}</span>\n'
                                 f'                    </div>\n')
                    html += '                </div>\n'

                # ── Notes section: Last updated + Latest Update + Workplan Note + history toggle ──
                kpi_update = kpi.get("update", "")
                kpi_wp = kpi.get("workplan_notes", "")
                kpi_date = kpi.get("update_date", "")
                kpi_pid = kpi["id"]
                kpi_notes_list = (update_log or {}).get(kpi_pid, [])

                if kpi_update or kpi_wp:
                    # Toggle for full history
                    toggle_part = ""
                    if len(kpi_notes_list) > 1:
                        toggle_part = (
                            f'                        <label style="display:inline-flex;align-items:center;gap:0.3rem;'
                            f'font-size:0.68rem;color:#163A5F;cursor:pointer;margin-left:auto;">'
                            f'<input type="checkbox" class="notes-history-toggle" data-pid="{kpi_pid}" '
                            f'style="accent-color:#C9A84C;cursor:pointer;"> '
                            f'Show all ({len(kpi_notes_list)})</label>\n'
                        )

                    html += (f'                <div style="margin-top:0.5rem;border-top:1px solid #e8e8e8;padding-top:0.4rem;">\n'
                             f'                    <div style="display:flex;align-items:center;margin-bottom:0.3rem;">\n'
                             f'                        <span style="font-size:0.7rem;color:#888;">Last updated: '
                             f'<strong style="color:#0A2240;">{kpi_date}</strong></span>\n'
                             f'{toggle_part}'
                             f'                    </div>\n')

                    # Latest Update (col P)
                    if kpi_update:
                        html += (f'                    <div style="font-size:0.75rem;color:#444;line-height:1.4;margin-bottom:0.3rem;">'
                                 f'<span style="font-size:0.62rem;font-weight:600;background:#163A5F;color:#fff;'
                                 f'padding:0.1rem 0.3rem;border-radius:3px;margin-right:0.25rem;">Latest Update</span>'
                                 f'{kpi_update}</div>\n')

                    # Workplan Note (col V)
                    if kpi_wp:
                        html += (f'                    <div style="font-size:0.75rem;color:#444;line-height:1.4;margin-bottom:0.3rem;">'
                                 f'<span style="font-size:0.62rem;font-weight:600;background:#C9A84C;color:#0A2240;'
                                 f'padding:0.1rem 0.3rem;border-radius:3px;margin-right:0.25rem;">Workplan Note</span>'
                                 f'{kpi_wp}</div>\n')

                    # Full history (hidden by default)
                    if len(kpi_notes_list) > 1:
                        type_badge_css = {
                            "update":   "background:#163A5F;color:#fff;",
                            "workplan": "background:#C9A84C;color:#0A2240;",
                        }
                        type_labels = {"update": "Progress Update", "workplan": "Workplan Note"}
                        html += (f'                    <div class="notes-history" data-pid="{kpi_pid}" '
                                 f'style="display:none;margin-top:0.3rem;max-height:200px;overflow-y:auto;'
                                 f'border-left:3px solid #C9A84C;padding-left:0.5rem;">\n')
                        for n in kpi_notes_list:
                            ntype = n.get("type", "update")
                            badge_style = type_badge_css.get(ntype, type_badge_css["update"])
                            badge_label = type_labels.get(ntype, "Update")
                            html += (f'                        <div style="margin-bottom:0.4rem;">'
                                     f'<span style="font-size:0.68rem;font-weight:700;color:#0A2240;'
                                     f'background:#f0f0f0;padding:0.1rem 0.35rem;border-radius:3px;">{n["date"]}</span>'
                                     f' <span style="font-size:0.6rem;font-weight:600;{badge_style}'
                                     f'padding:0.1rem 0.3rem;border-radius:3px;">{badge_label}</span>'
                                     f'<div style="font-size:0.73rem;color:#444;margin-top:0.1rem;line-height:1.3;">{n["note"]}</div>'
                                     f'</div>\n')
                        html += '                    </div>\n'

                    html += '                </div>\n'

                # Report + Update buttons
                safe_id = kpi_pid.replace(".", "_")
                excel_row = kpi.get("excel_row", 0)
                btn_style = ('display:inline-flex;align-items:center;gap:0.3rem;margin-top:0.5rem;'
                             'font-size:0.7rem;text-decoration:none;font-weight:600;'
                             'padding:0.25rem 0.5rem;border:1px solid #ddd;border-radius:4px;'
                             'cursor:pointer;transition:background 0.2s;margin-right:0.4rem;')
                html += (f'                <a href="reports/projects/{kpi_pid}_Report.docx" '
                         f'download class="report-btn" '
                         f'style="{btn_style}color:#163A5F;background:#fafafa;"'
                         f' onmouseover="this.style.background=\'#e8e8e8\'" onmouseout="this.style.background=\'#fafafa\'">'
                         f'<span style="font-size:0.8rem;">&#128196;</span> Report</a>'
                         f'<a href="CPL_Initiative_Project_List_v3.xlsx" '
                         f'class="update-btn" data-row="{excel_row}" data-col="P" '
                         f'style="{btn_style}color:#FFFFFF;background:#C9A84C;"'
                         f' onmouseover="this.style.background=\'#b89540\'" onmouseout="this.style.background=\'#C9A84C\'"'
                         f' title="Open Excel to update cell P{excel_row}">'
                         f'<span style="font-size:0.8rem;">&#9998;</span> Update</a>'
                         f'<a href="#" '
                         f'class="attach-btn" '
                         f'data-folder="{kpi_pid} {kpi["name"]}" '
                         f'style="{btn_style}color:#163A5F;background:#fafafa;"'
                         f' onmouseover="this.style.background=\'#e8e8e8\'" onmouseout="this.style.background=\'#fafafa\'"'
                         f' title="Open SharePoint folder — use Upload or drag &amp; drop to add files">'
                         f'<span style="font-size:0.8rem;">&#128206;</span> Attach'
                         f'{_att_badge(attachments, act_num)}</a>\n')

                html += '            </div>\n'  # close activity-kpi-card

            html += '            </div>\n'  # close activity-kpi-grid (per goal)

        html += '            </div>\n'  # close activity-group

    return html


def render_workplan_goals_html(workplan_goals):
    """
    Render the Annual Workplan Goals as a dashboard section with
    grouped tables showing year-by-year goals and stretch goals.
    Activities are grouped by their primary number (1.x, 2.x, 3.x, 4.x).
    """
    if not workplan_goals:
        return ""

    activity_group_labels = {
        "1": "Activity 1: Build AI-Enhanced CPL Infrastructure",
        "2": "Activity 2: Faculty Workgroups & Credit Recommendations",
        "3": "Activity 3: Build CPL Data Infrastructure",
        "4": "Activity 4: Sprints, Projects, Partnerships & Scale",
    }

    # Group by activity number
    groups = {}
    for act in workplan_goals:
        grp = act["id"].split(".")[0]
        groups.setdefault(grp, []).append(act)

    html = '''        <div class="workplan-goals-section" style="margin:2.5rem 0;">
            <h2 style="color:#0A2240;margin-bottom:0.5rem;">Annual Workplan Goals & Stretch Targets</h2>
            <p style="color:#666;font-size:0.85rem;margin-bottom:1.5rem;">Five-year trajectory from the CCCCO CPL Workplan — Goal and Stretch targets per activity per year.</p>
'''

    for grp_num in sorted(groups.keys()):
        acts = groups[grp_num]
        grp_label = activity_group_labels.get(grp_num, f"Activity {grp_num}")

        html += f'''            <div style="margin-bottom:2rem;">
            <div style="background:linear-gradient(135deg,#163A5F 0%,#0A2240 100%);border-radius:8px 8px 0 0;padding:0.6rem 1rem;">
                <span style="color:#C9A84C;font-weight:700;font-size:0.9rem;">{grp_label}</span>
            </div>
            <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:0.8rem;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.06);border-radius:0 0 8px 8px;table-layout:fixed;">
                <colgroup>
                    <col style="width:30%;">
                    <col style="width:8%;">
                    <col style="width:10.4%;">
                    <col style="width:10.4%;">
                    <col style="width:10.4%;">
                    <col style="width:10.4%;">
                    <col style="width:10.4%;">
                    <col style="width:10%;">
                </colgroup>
                <thead>
                    <tr style="background:#f0f4f8;">
                        <th style="text-align:left;padding:0.5rem 0.7rem;border-bottom:2px solid #ddd;">Activity</th>
                        <th style="text-align:center;padding:0.5rem 0.4rem;border-bottom:2px solid #ddd;color:#666;">Type</th>
                        <th style="text-align:right;padding:0.5rem 0.4rem;border-bottom:2px solid #ddd;">2025-26</th>
                        <th style="text-align:right;padding:0.5rem 0.4rem;border-bottom:2px solid #ddd;">2026-27</th>
                        <th style="text-align:right;padding:0.5rem 0.4rem;border-bottom:2px solid #ddd;">2027-28</th>
                        <th style="text-align:right;padding:0.5rem 0.4rem;border-bottom:2px solid #ddd;">2028-29</th>
                        <th style="text-align:right;padding:0.5rem 0.4rem;border-bottom:2px solid #ddd;">2029-30</th>
                        <th style="text-align:right;padding:0.5rem 0.7rem;border-bottom:2px solid #ddd;font-weight:700;">Total</th>
                    </tr>
                </thead>
                <tbody>
'''
        for i, act in enumerate(acts):
            is_pct = act.get("is_percentage", False)
            bg = "#fff" if i % 2 == 0 else "#fafbfc"

            def fmt_val(v, pct=False):
                if pct and isinstance(v, (int, float)):
                    return f"{int(v * 100)}%"
                if isinstance(v, (int, float)):
                    if float(v) == int(v):
                        return f"{int(v):,}"
                    return f"{v:,.1f}"
                return str(v) if v else "—"

            # GOAL row
            html += f'''                    <tr style="background:{bg};">
                        <td rowspan="2" style="padding:0.5rem 0.7rem;border-bottom:1px solid #eee;vertical-align:top;font-weight:600;color:#0A2240;">{act["id"]} {act["name"]}</td>
                        <td style="text-align:center;padding:0.3rem 0.4rem;color:#163A5F;font-weight:600;font-size:0.72rem;">GOAL</td>
'''
            for v in act["goal"]:
                html += f'                        <td style="text-align:right;padding:0.3rem 0.4rem;">{fmt_val(v, is_pct)}</td>\n'
            html += f'                        <td style="text-align:right;padding:0.3rem 0.7rem;font-weight:700;color:#0A2240;">{fmt_val(act["goal_total"], is_pct)}</td>\n'
            html += '                    </tr>\n'

            # STRETCH row
            html += f'''                    <tr style="background:{bg};">
                        <td style="text-align:center;padding:0.3rem 0.4rem;border-bottom:1px solid #eee;color:#C9A84C;font-weight:600;font-size:0.72rem;">STRETCH</td>
'''
            for v in act["stretch"]:
                html += f'                        <td style="text-align:right;padding:0.3rem 0.4rem;border-bottom:1px solid #eee;color:#C9A84C;">{fmt_val(v, is_pct)}</td>\n'
            html += f'                        <td style="text-align:right;padding:0.3rem 0.7rem;border-bottom:1px solid #eee;font-weight:700;color:#C9A84C;">{fmt_val(act["stretch_total"], is_pct)}</td>\n'
            html += '                    </tr>\n'

        html += '''                </tbody>
            </table>
            </div>
            </div>
'''

    html += '        </div>\n'
    return html


def _render_single_project_card(p, update_log=None, attachments=None):
    """Render a single project card HTML string with full notes history."""
    pid = p["id"]
    status = p.get("status", "")
    status_class = status.lower().replace(" ", "-")
    status_css_map = {
        "goal-met": "completed",
        "stretch-met": "completed",
        "on-track": "on-track",
        "in-progress": "in-progress",
        "foundational-year": "foundational",
        "not-started": "not-started",
        # Legacy fallbacks
        "completed": "completed",
        "exceeded-target": "completed",
        "ahead-of-schedule": "on-track",
        "strong-progress": "on-track",
        "active": "in-progress",
        "at-risk": "at-risk",
        "not-yet-started": "not-started",
        "proposed": "not-started",
    }
    css_class = status_css_map.get(status_class, "in-progress")
    pct = p.get("pct", 0)
    activity = p.get("activity", "")
    v2030 = p.get("v2030", "")
    goal = p.get("goal", "")
    lead = p.get("lead", "")

    # ── Current notes (always visible) ──
    update_text = p.get("update", "")
    wp_text = p.get("workplan_notes", "")
    update_date = p.get("update_date", "")

    # Current update + workplan note section
    current_notes_html = ""
    if update_text:
        current_notes_html += (
            f'            <div style="font-size:0.8rem;color:#444;line-height:1.4;margin-bottom:0.35rem;">'
            f'<span style="font-size:0.65rem;font-weight:600;background:#163A5F;color:#fff;'
            f'padding:0.1rem 0.35rem;border-radius:3px;margin-right:0.3rem;">Latest Update</span>'
            f'{update_text}</div>\n'
        )
    if wp_text:
        current_notes_html += (
            f'            <div style="font-size:0.8rem;color:#444;line-height:1.4;margin-bottom:0.35rem;">'
            f'<span style="font-size:0.65rem;font-weight:600;background:#C9A84C;color:#0A2240;'
            f'padding:0.1rem 0.35rem;border-radius:3px;margin-right:0.3rem;">Workplan Note</span>'
            f'{wp_text}</div>\n'
        )

    # ── Full history toggle (hidden by default, shown via JS checkbox) ──
    all_notes = (update_log or {}).get(pid, [])
    history_html = ""
    if len(all_notes) > 1:
        type_badge_css = {
            "update":   "background:#163A5F;color:#fff;",
            "workplan": "background:#C9A84C;color:#0A2240;",
        }
        type_labels = {"update": "Progress Update", "workplan": "Workplan Note"}
        history_html += (
            f'            <div class="notes-history" data-pid="{pid}" '
            f'style="display:none;margin-top:0.4rem;max-height:240px;overflow-y:auto;'
            f'border-left:3px solid #C9A84C;padding-left:0.6rem;">\n'
        )
        for n in all_notes:
            ntype = n.get("type", "update")
            badge_style = type_badge_css.get(ntype, type_badge_css["update"])
            badge_label = type_labels.get(ntype, "Update")
            history_html += (
                f'                <div style="margin-bottom:0.5rem;">'
                f'<span style="font-size:0.72rem;font-weight:700;color:#0A2240;'
                f'background:#f0f0f0;padding:0.1rem 0.4rem;border-radius:3px;">{n["date"]}</span>'
                f' <span style="font-size:0.65rem;font-weight:600;{badge_style}'
                f'padding:0.1rem 0.35rem;border-radius:3px;">{badge_label}</span>'
                f'<div style="font-size:0.8rem;color:#444;margin-top:0.15rem;line-height:1.4;">{n["note"]}</div>'
                f'</div>\n'
            )
        history_html += '            </div>\n'

    # Combine into notes section
    notes_html = ""
    if current_notes_html or history_html:
        toggle_html = ""
        if len(all_notes) > 1:
            toggle_html = (
                f'                <label style="display:inline-flex;align-items:center;gap:0.3rem;'
                f'font-size:0.72rem;color:#163A5F;cursor:pointer;margin-left:auto;">'
                f'<input type="checkbox" class="notes-history-toggle" data-pid="{pid}" '
                f'style="accent-color:#C9A84C;cursor:pointer;"> '
                f'Show all ({len(all_notes)})</label>\n'
            )
        notes_html = (
            f'            <div style="margin-top:0.5rem;border-top:1px solid #e8e8e8;padding-top:0.5rem;">\n'
            f'                <div style="display:flex;align-items:center;margin-bottom:0.35rem;">\n'
            f'                    <span style="font-size:0.75rem;color:#888;">Last updated: '
            f'<strong style="color:#0A2240;">{update_date}</strong></span>\n'
            f'{toggle_html}'
            f'                </div>\n'
            f'{current_notes_html}'
            f'{history_html}'
            f'            </div>\n'
        )

    return f'''        <div class="project-card" data-activity="{activity}" data-v2030="{v2030}" data-goal="{goal}" data-status="{status}" data-lead="{lead}">
            <div class="project-name">{p.get("name", "")}</div>
            <div class="project-desc">{p.get("desc", "")}</div>
            <span class="status-badge status-{css_class}">{status}</span>
            <div class="progress-container">
                <div class="progress-label">
                    <span>Progress</span>
                    <span>{pct}%</span>
                </div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width:{pct}%;--progress-width:{pct}%;"></div>
                </div>
            </div>
            <div style="font-size:0.85rem;color:#555;margin-bottom:0.5rem;">
                <strong>Lead:</strong> {lead}
            </div>
            <div style="font-size:0.85rem;color:#555;margin-bottom:0.5rem;">
                <strong>Activity:</strong> {activity}
            </div>
            <div style="font-size:0.85rem;color:#555;margin-bottom:0.5rem;">
                <strong>Budget:</strong> {p.get("budget", "")} ({p.get("budget_source", "")})
            </div>
{notes_html}            <div style="display:flex;gap:0.4rem;flex-wrap:wrap;margin-top:0.5rem;">
                <a href="reports/projects/{pid}_Report.docx" download class="report-btn"
                    style="display:inline-flex;align-items:center;gap:0.3rem;
                    font-size:0.75rem;color:#163A5F;text-decoration:none;font-weight:600;
                    padding:0.3rem 0.6rem;border:1px solid #ddd;border-radius:4px;
                    background:#fafafa;cursor:pointer;transition:background 0.2s;"
                    onmouseover="this.style.background='#e8e8e8'" onmouseout="this.style.background='#fafafa'">
                    <span style="font-size:0.85rem;">&#128196;</span> Report</a>
                <a href="CPL_Initiative_Project_List_v3.xlsx"
                    class="update-btn" data-row="{p.get('excel_row', 0)}" data-col="P"
                    style="display:inline-flex;align-items:center;gap:0.3rem;
                    font-size:0.75rem;color:#FFFFFF;text-decoration:none;font-weight:600;
                    padding:0.3rem 0.6rem;border:1px solid #b89540;border-radius:4px;
                    background:#C9A84C;cursor:pointer;transition:background 0.2s;"
                    onmouseover="this.style.background='#b89540'" onmouseout="this.style.background='#C9A84C'"
                    title="Open Excel to update cell P{p.get('excel_row', '')}">
                    <span style="font-size:0.85rem;">&#9998;</span> Update</a>
                <a href="#" class="attach-btn"
                    data-folder="{pid} {p['name']}"
                    style="display:inline-flex;align-items:center;gap:0.3rem;
                    font-size:0.75rem;color:#163A5F;text-decoration:none;font-weight:600;
                    padding:0.3rem 0.6rem;border:1px solid #ddd;border-radius:4px;
                    background:#fafafa;cursor:pointer;transition:background 0.2s;"
                    onmouseover="this.style.background='#e8e8e8'" onmouseout="this.style.background='#fafafa'"
                    title="Open SharePoint folder — use Upload or drag &amp; drop to add files">
                    <span style="font-size:0.85rem;">&#128206;</span> Attach{_att_badge(attachments, project_id=pid)}</a>
            </div>
        </div>
'''


def render_projects_grid_html(projects, update_log=None, attachments=None):
    """
    Generate static HTML for the projects grid with cards,
    grouped under Goal headers (Goal 1, Goal 2, Goal 3).
    Excludes subpopulation rows (D.x IDs).
    Each card has data attributes for JS filtering.
    Multi-goal projects appear under their primary (first) goal.
    """
    # Group projects by primary goal
    goal_groups = {}
    for p in projects:
        if p["id"].startswith("D."):
            continue
        goal_raw = p.get("goal", "")
        primary_goal = ""
        if goal_raw:
            gm = re.match(r'(Goal\s*\d+)', goal_raw)
            if gm:
                primary_goal = gm.group(1)
        if not primary_goal:
            primary_goal = "Other"
        goal_groups.setdefault(primary_goal, []).append(p)

    # Sort: Goal 1, Goal 2, Goal 3, then Other
    sorted_goals = sorted(goal_groups.keys(),
                          key=lambda g: (0, int(re.search(r'\d+', g).group())) if re.search(r'\d+', g) else (1, 0))

    html = ""
    for goal_key in sorted_goals:
        goal_projects = goal_groups[goal_key]
        goal_info = CPL_GOALS.get(goal_key, {})
        goal_title = goal_info.get("title", "")
        goal_target = goal_info.get("target", "")
        goal_bullets = goal_info.get("bullets", [])
        goal_stretch = goal_info.get("stretch", "")

        # Goal header bar with full workplan content
        if goal_key != "Other" and goal_title:
            bullets_html = ""
            if goal_bullets:
                bullets_html = '<ul style="margin:0.3rem 0 0 1.2rem;padding:0;list-style:disc;">'
                for b in goal_bullets:
                    bullets_html += f'<li style="color:rgba(255,255,255,0.8);font-size:0.75rem;margin-bottom:0.15rem;line-height:1.3;">{b}</li>'
                bullets_html += '</ul>'
            stretch_html = ""
            if goal_stretch:
                stretch_html = f'<div style="color:#C9A84C;font-size:0.7rem;margin-top:0.25rem;font-style:italic;">{goal_stretch}</div>'

            html += (f'        <div class="goal-header" data-goal-key="{goal_key}" style="margin:1.5rem 0 0.75rem 0;padding:0.75rem 1rem;'
                     f'background:linear-gradient(135deg,#163A5F 0%,#0A2240 100%);border-radius:8px;">\n'
                     f'            <div style="display:flex;align-items:center;gap:0.8rem;margin-bottom:0.3rem;">\n'
                     f'                <span style="color:#C9A84C;font-weight:700;font-size:1rem;white-space:nowrap;">{goal_key}</span>\n'
                     f'                <span style="color:#fff;font-size:0.95rem;font-weight:600;">{goal_title}</span>\n'
                     f'                <span style="color:rgba(255,255,255,0.5);font-size:0.8rem;margin-left:auto;white-space:nowrap;">'
                     f'{len(goal_projects)} projects</span>\n'
                     f'            </div>\n'
                     f'            <div style="color:rgba(255,255,255,0.75);font-size:0.78rem;line-height:1.3;">{goal_target}</div>\n'
                     f'            {bullets_html}\n'
                     f'            {stretch_html}\n'
                     f'        </div>\n')
        else:
            html += (f'        <div class="goal-header" data-goal-key="Other" style="margin:1.5rem 0 0.75rem 0;padding:0.6rem 1rem;'
                     f'background:#888;border-radius:8px;color:#fff;font-weight:700;">\n'
                     f'            Other Projects ({len(goal_projects)})\n'
                     f'        </div>\n')

        # Project cards grid for this goal
        html += '        <div class="projects-grid goal-project-group">\n'
        for p in goal_projects:
            html += _render_single_project_card(p, update_log, attachments=attachments)
        html += '        </div>\n'

    return html


def render_workplan_charts_html(current_students, sub_pops=None, workplan_goals=None):
    """
    Render two side-by-side canvas-based trend charts:
      Left:  Goal trajectory (250K target)
      Right: Stretch trajectory (500K target)
    Lines are solid for actual data (up to current year) and dashed for projections.
    Charts are rendered to <canvas> so users can right-click → Copy Image.
    """
    import json as _json

    def parse_int(v, fallback=0):
        try:
            return int(str(v).replace(",", ""))
        except (ValueError, TypeError):
            return fallback

    sub_pops = sub_pops or {}
    mil_now = parse_int(sub_pops.get("military", 21866))
    wf_now = parse_int(sub_pops.get("workforce", 21526))
    app_now = parse_int(sub_pops.get("apprentice", 681))
    total_now = parse_int(current_students, mil_now + wf_now + app_now)

    BASE_MIL, BASE_WF, BASE_APP = 8248, 9181, 196

    # ── Look up workplan goal entries by name ──
    mil_wg, wf_wg, app_wg = {}, {}, {}
    for wg in (workplan_goals or []):
        name_l = wg.get("name", "").lower()
        if "military" in name_l:
            mil_wg = wg
        elif "apprentice" in name_l:
            app_wg = wg
        elif "working" in name_l or "workforce" in name_l:
            wf_wg = wg

    def get_wg(wg_dict, def_goal, def_stretch, def_gt, def_st):
        return (
            wg_dict.get("goal", def_goal),
            wg_dict.get("stretch", def_stretch),
            int(wg_dict.get("goal_total", def_gt)),
            int(wg_dict.get("stretch_total", def_st)),
        )

    mil_goal, mil_str, mil_gt, mil_st = get_wg(mil_wg, [30000]*5, [30000]*5, 70000, 100000)
    wf_goal, wf_str, wf_gt, wf_st = get_wg(wf_wg, [5000]*5, [10000]*5, 150000, 320000)
    app_goal, app_str, app_gt, app_st = get_wg(app_wg, [500]*5, [1000]*5, 20000, 80000)

    def build_trajectory(baseline, annual_vals, endpoint):
        pts = [(2024, baseline)]
        if not annual_vals:
            return pts
        is_cumulative = all(annual_vals[i] >= annual_vals[i-1] for i in range(1, len(annual_vals)) if annual_vals[i] > 0)
        if is_cumulative and annual_vals[-1] > annual_vals[0]:
            pts.append((2025, int((baseline + annual_vals[0]) / 2)))
            for i, val in enumerate(annual_vals):
                pts.append((2026 + i, int(val)))
        else:
            annual_sum = sum(annual_vals) if annual_vals else 1
            delta = endpoint - baseline
            pts.append((2025, int(baseline + delta * (annual_vals[0] * 0.5) / annual_sum)))
            cumul_prop = 0
            for i, val in enumerate(annual_vals):
                cumul_prop += val / annual_sum
                pts.append((2026 + i, int(baseline + delta * cumul_prop)))
        return pts

    # Build GOAL trajectories
    mil_goal_traj = build_trajectory(BASE_MIL, mil_goal, mil_gt)
    wf_goal_traj = build_trajectory(BASE_WF, wf_goal, wf_gt)
    app_goal_traj = build_trajectory(BASE_APP, app_goal, app_gt)

    # Build STRETCH trajectories
    mil_str_traj = build_trajectory(BASE_MIL, mil_str, mil_st)
    wf_str_traj = build_trajectory(BASE_WF, wf_str, wf_st)
    app_str_traj = build_trajectory(BASE_APP, app_str, app_st)

    # Actuals up to current year
    mil_actual = [[2024, BASE_MIL], [2025, 18500], [2026, mil_now]]
    wf_actual = [[2024, BASE_WF], [2025, 19200], [2026, wf_now]]
    app_actual = [[2024, BASE_APP], [2025, 300], [2026, app_now]]
    total_actual = [[2024, BASE_MIL + BASE_WF + BASE_APP], [2025, 38000], [2026, total_now]]

    def val_at(series, yr):
        for y, v in series:
            if y == yr:
                return v
        return 0

    def merge_series(actual, proj):
        merged = [list(a) for a in actual]
        last_yr = actual[-1][0]
        for yr, val in proj:
            if yr > last_yr:
                merged.append([yr, val])
        return merged

    all_years = list(range(2024, 2031))

    # Total goal / stretch trajectories
    total_goal_traj = [[yr, val_at(mil_goal_traj, yr) + val_at(wf_goal_traj, yr) + val_at(app_goal_traj, yr)] for yr in all_years]
    total_str_traj = [[yr, val_at(mil_str_traj, yr) + val_at(wf_str_traj, yr) + val_at(app_str_traj, yr)] for yr in all_years]

    # Full series for each (actual + projected)
    mil_goal_full = merge_series(mil_actual, mil_goal_traj)
    wf_goal_full = merge_series(wf_actual, wf_goal_traj)
    app_goal_full = merge_series(app_actual, app_goal_traj)
    total_goal_full = merge_series(total_actual, total_goal_traj)

    mil_str_full = merge_series(mil_actual, mil_str_traj)
    wf_str_full = merge_series(wf_actual, wf_str_traj)
    app_str_full = merge_series(app_actual, app_str_traj)
    total_str_full = merge_series(total_actual, total_str_traj)

    # Compute totals for targets
    goal_total = mil_gt + wf_gt + app_gt
    stretch_total = mil_st + wf_st + app_st

    # Serialize data for JS
    chart_data = {
        "goal": {
            "total": total_goal_full, "military": mil_goal_full,
            "workforce": wf_goal_full, "apprentice": app_goal_full,
            "target": goal_total,
            "mil_target": mil_gt, "wf_target": wf_gt, "app_target": app_gt,
        },
        "stretch": {
            "total": total_str_full, "military": mil_str_full,
            "workforce": wf_str_full, "apprentice": app_str_full,
            "target": stretch_total,
            "mil_target": mil_st, "wf_target": wf_st, "app_target": app_st,
        },
        "currentYear": 2026,
    }

    data_json = _json.dumps(chart_data)

    html = f'''        <div style="margin:2rem 0;padding:1.5rem;background:#fff;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
            <h3 style="color:#0A2240;margin:0 0 0.25rem 0;font-size:1.1rem;">CPL Workplan Progress — Path to 2030</h3>
            <p style="color:#888;font-size:0.8rem;margin:0 0 1rem 0;">Solid lines = actuals &middot; Dashed lines = projected &middot; Right-click any chart to copy image</p>
            <div style="display:flex;gap:1.5rem;flex-wrap:wrap;">
                <div style="flex:1;min-width:340px;">
                    <h4 style="color:#0A2240;font-size:0.9rem;margin:0 0 0.5rem 0;text-align:center;">Goal Trajectory (250K Target)</h4>
                    <canvas id="goalChart" width="640" height="400" style="width:100%;height:auto;border-radius:6px;background:#FAF8F4;"></canvas>
                </div>
                <div style="flex:1;min-width:340px;">
                    <h4 style="color:#0A2240;font-size:0.9rem;margin:0 0 0.5rem 0;text-align:center;">Stretch Trajectory (500K Target)</h4>
                    <canvas id="stretchChart" width="640" height="400" style="width:100%;height:auto;border-radius:6px;background:#FAF8F4;"></canvas>
                </div>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:0.8rem 1.5rem;margin-top:0.8rem;font-size:0.8rem;color:#555;align-items:center;">
                <span><span style="display:inline-block;width:20px;height:3px;background:#0A2240;vertical-align:middle;margin-right:4px;"></span> Total</span>
                <span><span style="display:inline-block;width:20px;height:3px;background:#C9A84C;vertical-align:middle;margin-right:4px;"></span> Military</span>
                <span><span style="display:inline-block;width:20px;height:3px;background:#4A90D9;vertical-align:middle;margin-right:4px;"></span> Workforce/Other</span>
                <span><span style="display:inline-block;width:20px;height:3px;background:#2A7D4F;vertical-align:middle;margin-right:4px;"></span> Apprentice</span>
                <span style="color:#aaa;">&mdash; Solid = actual &nbsp; - - - Dashed = projected</span>
            </div>
        </div>
        <script>
        (function() {{
            var D = {data_json};
            var COLORS = {{total:'#0A2240',military:'#C9A84C',workforce:'#4A90D9',apprentice:'#2A7D4F'}};
            var SERIES = ['total','military','workforce','apprentice'];
            var LABELS = {{total:'Total',military:'Military',workforce:'Workforce',apprentice:'Apprentice'}};

            function drawChart(canvasId, data, targetVal) {{
                var canvas = document.getElementById(canvasId);
                if (!canvas) return;
                var dpr = window.devicePixelRatio || 1;
                var W = 640, H = 400;
                canvas.width = W * dpr;
                canvas.height = H * dpr;
                canvas.style.width = '100%';
                canvas.style.height = 'auto';
                var ctx = canvas.getContext('2d');
                ctx.scale(dpr, dpr);

                var PAD_L = 55, PAD_R = 20, PAD_T = 20, PAD_B = 35;
                var CW = W - PAD_L - PAD_R;
                var CH = H - PAD_T - PAD_B;
                var START_YR = 2024, END_YR = 2030, SPAN = 6;
                var maxVal = Math.max(targetVal * 1.15, 300000);

                // Round maxVal up to a nice number
                var step = maxVal > 300000 ? 100000 : 50000;
                maxVal = Math.ceil(maxVal / step) * step;

                function xPos(yr) {{ return PAD_L + (yr - START_YR) / SPAN * CW; }}
                function yPos(val) {{ return PAD_T + CH - (val / maxVal * CH); }}
                function fmtK(v) {{
                    if (v >= 1000) {{
                        var k = v / 1000;
                        return (k === Math.floor(k)) ? k + 'K' : k.toFixed(1) + 'K';
                    }}
                    return '' + v;
                }}

                // Background
                ctx.fillStyle = '#FAF8F4';
                ctx.fillRect(0, 0, W, H);

                // Grid lines
                ctx.strokeStyle = '#e8e8e8';
                ctx.lineWidth = 0.7;
                ctx.font = '10px Calibri, sans-serif';
                ctx.fillStyle = '#999';
                ctx.textAlign = 'right';
                for (var tick = 0; tick <= maxVal; tick += step) {{
                    var yy = yPos(tick);
                    ctx.beginPath();
                    ctx.moveTo(PAD_L, yy);
                    ctx.lineTo(PAD_L + CW, yy);
                    ctx.stroke();
                    ctx.fillText(fmtK(tick), PAD_L - 6, yy + 3);
                }}

                // Year labels
                ctx.textAlign = 'center';
                ctx.fillStyle = '#888';
                for (var yr = 2024; yr <= 2030; yr++) {{
                    ctx.fillText('' + yr, xPos(yr), H - 10);
                }}

                // Target ceiling line
                ctx.strokeStyle = '#0A2240';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([8, 4]);
                ctx.globalAlpha = 0.3;
                ctx.beginPath();
                ctx.moveTo(PAD_L, yPos(targetVal));
                ctx.lineTo(PAD_L + CW, yPos(targetVal));
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.globalAlpha = 1;
                ctx.fillStyle = '#0A2240';
                ctx.textAlign = 'right';
                ctx.font = 'bold 10px Calibri, sans-serif';
                ctx.fillText(fmtK(targetVal) + ' Target', PAD_L + CW - 4, yPos(targetVal) - 5);

                // "Now" vertical marker
                ctx.strokeStyle = '#0A2240';
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);
                ctx.globalAlpha = 0.15;
                ctx.beginPath();
                ctx.moveTo(xPos(D.currentYear), PAD_T);
                ctx.lineTo(xPos(D.currentYear), PAD_T + CH);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.globalAlpha = 1;
                ctx.font = '9px Calibri, sans-serif';
                ctx.fillStyle = 'rgba(10,34,64,0.5)';
                ctx.textAlign = 'center';
                ctx.fillText('Now', xPos(D.currentYear), PAD_T - 4);

                // Draw each series
                for (var si = 0; si < SERIES.length; si++) {{
                    var key = SERIES[si];
                    var pts = data[key];
                    var color = COLORS[key];
                    var lw = key === 'total' ? 3 : 2.2;

                    if (!pts || pts.length < 2) continue;

                    // Split into actual (up to currentYear) and projected (after)
                    var actualPts = [];
                    var projPts = [];
                    for (var i = 0; i < pts.length; i++) {{
                        if (pts[i][0] <= D.currentYear) {{
                            actualPts.push(pts[i]);
                        }}
                        if (pts[i][0] >= D.currentYear) {{
                            projPts.push(pts[i]);
                        }}
                    }}

                    // Draw actual (solid)
                    if (actualPts.length >= 2) {{
                        ctx.strokeStyle = color;
                        ctx.lineWidth = lw;
                        ctx.setLineDash([]);
                        ctx.beginPath();
                        ctx.moveTo(xPos(actualPts[0][0]), yPos(actualPts[0][1]));
                        for (var i = 1; i < actualPts.length; i++) {{
                            ctx.lineTo(xPos(actualPts[i][0]), yPos(actualPts[i][1]));
                        }}
                        ctx.stroke();
                    }}

                    // Draw projected (dashed)
                    if (projPts.length >= 2) {{
                        ctx.strokeStyle = color;
                        ctx.lineWidth = lw;
                        ctx.setLineDash([8, 5]);
                        ctx.beginPath();
                        ctx.moveTo(xPos(projPts[0][0]), yPos(projPts[0][1]));
                        for (var i = 1; i < projPts.length; i++) {{
                            ctx.lineTo(xPos(projPts[i][0]), yPos(projPts[i][1]));
                        }}
                        ctx.stroke();
                        ctx.setLineDash([]);
                    }}

                    // Data dots
                    var dotR = key === 'total' ? 4 : 3;
                    for (var i = 0; i < pts.length; i++) {{
                        ctx.fillStyle = color;
                        ctx.beginPath();
                        ctx.arc(xPos(pts[i][0]), yPos(pts[i][1]), dotR, 0, Math.PI * 2);
                        ctx.fill();
                    }}

                    // Value labels from currentYear onward
                    ctx.font = 'bold 9px Calibri, sans-serif';
                    ctx.fillStyle = color;
                    ctx.textAlign = 'center';
                    for (var i = 0; i < pts.length; i++) {{
                        if (pts[i][0] >= D.currentYear) {{
                            var dy = (key === 'total' || key === 'military') ? -10 : 14;
                            ctx.fillText(fmtK(pts[i][1]), xPos(pts[i][0]), yPos(pts[i][1]) + dy);
                        }}
                    }}

                    // Endpoint label at 2030
                    var lastPt = pts[pts.length - 1];
                    if (lastPt[0] === 2030) {{
                        ctx.font = 'bold 9.5px Calibri, sans-serif';
                        ctx.fillStyle = color;
                        ctx.textAlign = 'left';
                        // Only show label if total — sub-pop labels via value labels already
                    }}
                }}
            }}

            drawChart('goalChart', D.goal, D.goal.target);
            drawChart('stretchChart', D.stretch, D.stretch.target);
        }})();
        </script>
'''
    return html


def compute_headline_kpis(projects, budget):
    """
    Compute the 6 headline KPIs from sub-activity data.
    Falls back to hardcoded values if sub-activity data is missing.
    """
    proj_map = {p["id"]: p for p in projects}

    def get_metric(pid, fallback=""):
        p = proj_map.get(pid)
        return p["kpi_metric"] if p and p["kpi_metric"] else fallback

    students   = get_metric("3.1", "42,620")
    units      = get_metric("3.2", "96,449")
    recs       = get_metric("2.1", "576")
    colleges   = get_metric("3.3", "84")

    # Estimated savings — derived from eligible units (189,000 * ~$1,424 avg)
    # Use a static value unless we have a dedicated field
    savings = "$269M"

    return {
        "cumulative_students": {
            "value": students,
            "label": "Cumulative CPL Students",
            "sub": "Target: 250,000 by 2030"
        },
        "transcripted_units": {
            "value": units,
            "label": "Transcripted Units",
            "sub": "Target: 85,000 (exceeded)"
        },
        "credit_recommendations": {
            "value": recs,
            "label": "Credit Recommendations",
            "sub": "281 adopted this year"
        },
        "active_colleges": {
            "value": colleges,
            "label": "Active Colleges",
            "sub": "of 116 system colleges"
        },
        "estimated_savings": {
            "value": savings,
            "label": "Estimated Savings",
            "sub": "Eligible units, Beacon Economics"
        },
        "veteran_sprint": (lambda: {
            "value": next((p["kpi_metric"] for p in projects if p["id"] == "4.1a"), "47"),
            "label": "VETERAN SPRINT",
            "sub": "Star Colleges",
            "breakdowns": [
                {"label": "JST Credits", "value": "{jst_credits} / 30,000"},
                {"label": "Basic Training Credit", "value": f'{next((p["kpi_metric"] for p in projects if p["id"] == "4.1a"), "47")} Colleges'},
                {"label": "Eligible CPL", "value": "{eligible_cpl} Units"},
            ],
        })(),
    }


def read_live_metrics():
    """
    Read live_metrics.json (written by the daily scraper agent).
    Returns the metrics dict or None if the file doesn't exist.
    Format: {
        "scraped_at": "2026-04-01T09:00:00",
        "metrics": [
            {"title": "STUDENTS SERVED", "value": "43,321",
             "breakdowns": [{"label":"Military","value":"21,866"}, ...]},
            ...
        ]
    }
    """
    if not os.path.exists(LIVE_FILE):
        return None
    try:
        with open(LIVE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError) as e:
        print(f"WARNING: Could not read {LIVE_FILE}: {e}")
        return None


def merge_live_metrics(kpis, live_data):
    """
    Merge live dashboard metrics into the headline KPIs,
    adding population breakdowns.
    """
    if not live_data or "metrics" not in live_data:
        return kpis

    # Map live metric titles to our KPI keys
    title_map = {
        "STUDENTS SERVED": "cumulative_students",
        "ELIGIBLE UNITS": "eligible_units",
        "TRANSCRIBED UNITS": "transcripted_units",
        "SAVINGS": "estimated_savings",
        "20-YEAR IMPACT": "twenty_year_impact",
        "ACTIVE COLLEGES": "active_colleges",
    }

    for metric in live_data["metrics"]:
        title = metric.get("title", "").upper().strip()
        key = title_map.get(title)
        if not key:
            continue

        breakdowns = []
        for b in metric.get("breakdowns", []):
            bd_entry = {"label": b["label"], "value": b["value"]}
            if b.get("note"):
                bd_entry["note"] = b["note"]
            breakdowns.append(bd_entry)

        if key in kpis:
            # Update existing KPI with live value + breakdowns
            kpis[key]["value"] = metric["value"]
            kpis[key]["breakdowns"] = breakdowns
            kpis[key]["live"] = True
        else:
            # Add new KPI (eligible_units, twenty_year_impact, active_colleges)
            kpis[key] = {
                "value": metric["value"],
                "label": metric.get("title", title.title()),
                "sub": f"Source: MAP CPL Dashboard",
                "breakdowns": breakdowns,
                "live": True,
            }

        # Preserve footnote (e.g. Active Colleges criteria list)
        if metric.get("footnote"):
            kpis[key]["footnote"] = metric["footnote"]

    # Update Veteran Sprint card from live scraped values
    if "veteran_sprint" in kpis:
        vs_bds = kpis["veteran_sprint"].get("breakdowns", [])
        # JST Credits = Military students count
        if "cumulative_students" in kpis:
            mil_students = [b for b in kpis["cumulative_students"].get("breakdowns", [])
                            if b["label"].lower().startswith("military")]
            if mil_students:
                for bd in vs_bds:
                    if "{jst_credits}" in bd["value"]:
                        bd["value"] = bd["value"].replace("{jst_credits}", str(mil_students[0]["value"]))
        # Eligible CPL = Military eligible units
        if "eligible_units" in kpis:
            mil_units = [b for b in kpis["eligible_units"].get("breakdowns", [])
                         if b["label"].lower().startswith("military")]
            if mil_units:
                for bd in vs_bds:
                    if "{eligible_cpl}" in bd["value"]:
                        bd["value"] = bd["value"].replace("{eligible_cpl}", str(mil_units[0]["value"]))
        kpis["veteran_sprint"]["live"] = True

    kpis["_live_updated"] = live_data.get("scraped_at", "")
    return kpis


# ── MAP Exhibit Metrics ─────────────────────────────────────────────

def read_exhibit_metrics():
    """
    Read the combined CustomReport JSON exported from the MAP Custom Reporting Module.
    The file contains multiple datasets (views) in a single JSON array.

    Recognized datasets:
      - View_ArticulatedMAPExhibits_APIDataset      → exhibit-level credit recs + Collaborative Type
      - View_ArticulatedCollegeCourses_APIDataset    → course-level articulation detail
      - View_CreditDistributionByCollege_APIDataset  → per-college credit breakdown
      - View_StudentAggregatedValues_APIDataset      → student-level credit data
      - View_PointInTime_StudentAggregatedValues_APIDataset → student aggregates by year/type
      - View_CollegeCourses_APIDataset               → college course catalog
      - View_ProgramsofStudy_APIDataset              → programs of study

    Returns a dict of computed KPIs or None if file unavailable.
    """
    if not EXHIBIT_FILE or not os.path.exists(EXHIBIT_FILE):
        return None
    try:
        with open(EXHIBIT_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (json.JSONDecodeError, IOError) as e:
        print(f"WARNING: Could not read exhibit file {EXHIBIT_FILE}: {e}")
        return None

    if not data or not isinstance(data, list):
        print("WARNING: Exhibit JSON has unexpected structure")
        return None

    # ── Index datasets by view name ──
    datasets = {}
    for report in data:
        view = report.get("viewName", "")
        if view and report.get("columnValue"):
            col_map = {c: i for i, c in enumerate(report.get("columnName", []))}
            datasets[view] = {
                "rows": report["columnValue"],
                "col_map": col_map,
                "generated_at": report.get("generatedAt", ""),
                "count": report.get("dataCount", len(report["columnValue"])),
            }
            print(f"  Dataset: {view} ({len(report['columnValue']):,} rows)")

    if not datasets:
        print("WARNING: No usable datasets in exhibit JSON")
        return None

    generated_at = data[0].get("generatedAt", "")

    # ── Parse exhibits from ArticulatedMAPExhibits (preferred — has Collaborative Type) ──
    exhibits_result = _parse_exhibits(datasets)

    # ── Parse credit distribution by college ──
    credit_dist = _parse_credit_distribution(datasets)

    # ── Combine into unified result ──
    result = exhibits_result or {}
    result["source_file"] = os.path.basename(EXHIBIT_FILE)
    result["generated_at"] = generated_at
    result["datasets_found"] = list(datasets.keys())

    if credit_dist:
        result["credit_distribution"] = credit_dist

    return result if result.get("total_credit_recs") else None


def _parse_exhibits(datasets):
    """Extract exhibit metrics from available datasets.
    Prefers View_ArticulatedMAPExhibits (has Collaborative Type column).
    Falls back to View_ArticulatedCollegeCourses if needed.
    """
    # ── Primary source: ArticulatedMAPExhibits (has Collaborative Type) ──
    ds = datasets.get("View_ArticulatedMAPExhibits_APIDataset")
    if ds:
        rows = ds["rows"]
        cm = ds["col_map"]

        i_college = cm.get("College", 0)
        i_exhibit = cm.get("ExhibitID", 1)
        i_artic = cm.get("Articulation College", 4)
        i_collab = cm.get("Collaborative Type", 7)
        i_cpl = cm.get("CPL Type Description", 13)

        exhibit_ids = set()
        originating_colleges = set()
        articulation_colleges = set()
        ccc_credit_recs = 0
        ccc_exhibit_ids = set()
        ccc_artic_colleges = set()
        cpl_type_counts = {}

        for row in rows:
            college = (row[i_college] or "").strip()
            exhibit_id = (row[i_exhibit] or "").strip()
            artic_college = (row[i_artic] or "").strip()
            collab_type = (row[i_collab] or "").strip()
            cpl_type = (row[i_cpl] or "").strip()

            exhibit_ids.add(exhibit_id)
            if college:
                originating_colleges.add(college)
            if artic_college:
                articulation_colleges.add(artic_college)

            if "CCC" in collab_type:
                ccc_credit_recs += 1
                ccc_exhibit_ids.add(exhibit_id)
                ccc_artic_colleges.add(artic_college)

            if cpl_type:
                cpl_type_counts[cpl_type] = cpl_type_counts.get(cpl_type, 0) + 1

        local_credit_recs = len(rows) - ccc_credit_recs
        local_exhibit_ids = exhibit_ids - ccc_exhibit_ids

        return {
            "total_credit_recs": len(rows),
            "unique_exhibits": len(exhibit_ids),
            "originating_colleges": len(originating_colleges),
            "articulation_colleges": len(articulation_colleges),
            "articulation_college_names": sorted(articulation_colleges),
            "ccc_collaborative": {
                "credit_recs": ccc_credit_recs,
                "unique_exhibits": len(ccc_exhibit_ids),
                "adopting_colleges": len(ccc_artic_colleges),
                "college_names": sorted(ccc_artic_colleges),
            },
            "local": {
                "credit_recs": local_credit_recs,
                "unique_exhibits": len(local_exhibit_ids),
            },
            "cpl_type_breakdown": cpl_type_counts,
        }

    # ── Fallback: ArticulatedCollegeCourses (no Collaborative Type) ──
    ds = datasets.get("View_ArticulatedCollegeCourses_APIDataset")
    if ds:
        rows = ds["rows"]
        cm = ds["col_map"]

        i_college = cm.get("College", 0)
        i_exhibit = cm.get("ExhibitID", 15)
        i_cpl = cm.get("CPL Type Description", 11)

        exhibit_ids = set()
        colleges = set()
        cpl_type_counts = {}

        for row in rows:
            college = (row[i_college] or "").strip()
            exhibit_id = (row[i_exhibit] or "").strip()
            cpl_type = (row[i_cpl] or "").strip()
            if exhibit_id:
                exhibit_ids.add(exhibit_id)
            if college:
                colleges.add(college)
            if cpl_type:
                cpl_type_counts[cpl_type] = cpl_type_counts.get(cpl_type, 0) + 1

        return {
            "total_credit_recs": len(rows),
            "unique_exhibits": len(exhibit_ids),
            "originating_colleges": len(colleges),
            "articulation_colleges": len(colleges),
            "articulation_college_names": sorted(colleges),
            "ccc_collaborative": {
                "credit_recs": 0,
                "unique_exhibits": 0,
                "adopting_colleges": 0,
                "college_names": [],
            },
            "local": {
                "credit_recs": len(rows),
                "unique_exhibits": len(exhibit_ids),
            },
            "cpl_type_breakdown": cpl_type_counts,
        }

    return None


def _parse_credit_distribution(datasets):
    """Parse View_CreditDistributionByCollege for per-college credit metrics.
    Returns a dict with system totals and per-college detail, or None.
    """
    ds = datasets.get("View_CreditDistributionByCollege_APIDataset")
    if not ds:
        return None

    rows = ds["rows"]
    cm = ds["col_map"]

    i_college = cm.get("College", 0)
    i_eligible = cm.get("Eligible Credits", 7)
    i_transcribed = cm.get("Transcribed Credits", 9)
    i_applied = cm.get("Applied Credits", 2)
    i_students = cm.get("Students Awarded", 8)

    total_eligible = 0
    total_transcribed = 0
    total_applied = 0
    total_students = 0
    per_college = []

    for row in rows:
        college = (row[i_college] or "").strip()
        eligible = float(row[i_eligible] or 0)
        transcribed = float(row[i_transcribed] or 0)
        applied = float(row[i_applied] or 0)
        students = int(float(row[i_students] or 0))

        total_eligible += eligible
        total_transcribed += transcribed
        total_applied += applied
        total_students += students

        per_college.append({
            "college": college,
            "eligible_credits": eligible,
            "transcribed_credits": transcribed,
            "applied_credits": applied,
            "students_awarded": students,
        })

    return {
        "colleges": len(per_college),
        "total_eligible_credits": total_eligible,
        "total_transcribed_credits": total_transcribed,
        "total_applied_credits": total_applied,
        "total_students_awarded": total_students,
        "per_college": sorted(per_college, key=lambda x: -x["eligible_credits"]),
    }


def _fmt_int(n):
    """Format an integer with comma separators."""
    return f"{n:,}"


def merge_exhibit_metrics(kpis, exhibit_data):
    """
    Merge exhibit metrics into headline KPIs.
    Updates credit_recommendations and adds MAP Exhibits, CCC Collaborative,
    and Articulating Colleges cards.  Optionally enriches with credit distribution data.
    """
    if not exhibit_data:
        return kpis

    ccc = exhibit_data["ccc_collaborative"]

    # ── 1. Replace/enhance CREDIT RECOMMENDATIONS KPI ──
    kpis["credit_recommendations"] = {
        "value": _fmt_int(exhibit_data["total_credit_recs"]),
        "label": "Credit Recommendations",
        "sub": "Source: MAP Custom Reporting Module",
        "breakdowns": [
            {"label": "CCC Collaborative", "value": _fmt_int(ccc["credit_recs"]),
             "note": "statewide faculty workgroups"},
            {"label": "Local", "value": _fmt_int(exhibit_data["local"]["credit_recs"]),
             "note": "individual college articulations"},
        ],
        "live": False,
    }

    # ── 2. MAP EXHIBITS KPI ──
    kpis["map_exhibits"] = {
        "value": _fmt_int(exhibit_data["unique_exhibits"]),
        "label": "MAP Exhibits",
        "sub": f"{_fmt_int(exhibit_data['originating_colleges'])} originating colleges",
        "breakdowns": [
            {"label": "CCC Collaborative", "value": _fmt_int(ccc["unique_exhibits"]),
             "note": "statewide exhibits"},
            {"label": "Local", "value": _fmt_int(exhibit_data["local"]["unique_exhibits"]),
             "note": "college-created exhibits"},
        ],
    }

    # ── 3. CCC COLLABORATIVE ADOPTION KPI ──
    kpis["ccc_collaborative"] = {
        "value": _fmt_int(ccc["adopting_colleges"]),
        "label": "CCC Collaborative Adoption",
        "sub": "Colleges adopting statewide exhibits",
        "breakdowns": [
            {"label": "Collaborative Exhibits", "value": _fmt_int(ccc["unique_exhibits"])},
            {"label": "Collaborative Credit Recs", "value": _fmt_int(ccc["credit_recs"])},
        ],
    }

    # ── 4. ARTICULATING COLLEGES KPI ──
    kpis["articulation_colleges"] = {
        "value": _fmt_int(exhibit_data["articulation_colleges"]),
        "label": "Articulating Colleges",
        "sub": "Colleges with MAP exhibits",
        "breakdowns": [
            {"label": "Originating Colleges", "value": _fmt_int(exhibit_data["originating_colleges"]),
             "note": "created exhibits"},
            {"label": "Adopting CCC Collaborative", "value": _fmt_int(ccc["adopting_colleges"]),
             "note": "statewide exhibits"},
        ],
    }

    # ── CPL Type breakdown in footnote on Credit Recs card ──
    cpl_types = exhibit_data.get("cpl_type_breakdown", {})
    if cpl_types:
        sorted_types = sorted(cpl_types.items(), key=lambda x: -x[1])
        fn = [f"{name}: {_fmt_int(count)}" for name, count in sorted_types[:5]]
        kpis["credit_recommendations"]["footnote"] = fn

    # ── Enrich with credit distribution data if available ──
    cd = exhibit_data.get("credit_distribution")
    if cd:
        # Add Applied Credits breakdown to Transcribed Units card (if it exists)
        if "transcripted_units" in kpis:
            existing_bds = kpis["transcripted_units"].get("breakdowns", [])
            # Add applied credits as a breakdown if not already present
            has_applied = any("applied" in (b.get("label", "").lower()) for b in existing_bds)
            if not has_applied:
                existing_bds.append({
                    "label": "Applied Credits",
                    "value": _fmt_int(int(cd["total_applied_credits"])),
                    "note": "posted to student records",
                })
                kpis["transcripted_units"]["breakdowns"] = existing_bds

    kpis["_exhibit_updated"] = exhibit_data.get("generated_at", "")
    kpis["_exhibit_source"] = exhibit_data.get("source_file", "")
    kpis["_exhibit_datasets"] = exhibit_data.get("datasets_found", [])
    return kpis


# ── MAP Articulation Analysis Tables ─────────────────────────────────────

def _load_top_code_lookup():
    """Load MAP TOP Code → CCC Discipline mapping from TOP_Code_Lookup.xlsx.
    Searches the same locations as the exhibit JSON."""
    for folder in _EXHIBIT_LOCATIONS:
        path = os.path.join(folder, "TOP_Code_Lookup.xlsx")
        if os.path.exists(path):
            break
    else:
        return {}
    try:
        wb = load_workbook(path, data_only=True)
        ws = wb["TOP Code Lookup"]
        lookup = {}
        for row in ws.iter_rows(min_row=2, max_col=3, values_only=True):
            code = str(row[0]).strip() if row[0] is not None else ""
            disc = str(row[2]).strip() if row[2] else "Unknown"
            if code:
                lookup[code] = disc
        wb.close()
        return lookup
    except Exception as e:
        print(f"  WARNING: Could not load TOP_Code_Lookup.xlsx: {e}")
        return {}


def build_exhibit_analysis_tables(exhibit_data):
    """
    Compute analysis tables from the combined CustomReport JSON.
    Uses View_ArticulatedMAPExhibits as the primary data source.
    Returns a dict of analysis tables ready for dashboard rendering.
    """
    if not exhibit_data or not EXHIBIT_FILE:
        return None

    try:
        with open(EXHIBIT_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        return None

    # Find the ArticulatedMAPExhibits dataset (preferred)
    ds = None
    for report in data:
        if report.get("viewName") == "View_ArticulatedMAPExhibits_APIDataset":
            ds = report
            break
    if not ds:
        return None

    rows = ds["columnValue"]
    cm = {c: i for i, c in enumerate(ds.get("columnName", []))}
    top_lookup = _load_top_code_lookup()

    i_college = cm.get("College", 0)
    i_exhibit = cm.get("ExhibitID", 1)
    i_title = cm.get("Exhibit Title", 2)
    i_artic = cm.get("Articulation College", 4)
    i_course = cm.get("Course", 5)
    i_collab = cm.get("Collaborative Type", 7)
    i_top = cm.get("TOP Code", 8)
    i_cid = cm.get("CID Number", 9)
    i_mol = cm.get("CPL Mode of Learning", 11)
    i_cpl = cm.get("CPL Type Description", 13)

    from collections import defaultdict

    # ── By College ──
    by_college = defaultdict(lambda: {"recs": 0, "exhibits": set(), "disciplines": set(),
                                      "ccc": 0, "industry": 0})
    # ── By Discipline ──
    by_disc = defaultdict(lambda: {"recs": 0, "exhibits": set(), "courses": set(),
                                   "colleges": set(), "ccc": 0})
    # ── By CPL Type ──
    by_cpl = defaultdict(lambda: {"recs": 0, "exhibits": set(), "colleges": set()})
    # ── By Mode of Learning ──
    by_mol = defaultdict(lambda: {"recs": 0, "exhibits": set(), "colleges": set()})
    # ── Top Exhibits ──
    by_exhibit_title = defaultdict(lambda: {"recs": 0, "courses": set(), "colleges": set(),
                                            "cpl_type": "", "disc": ""})
    # ── Collaborative Analysis ──
    by_collab = defaultdict(lambda: {"recs": 0, "exhibits": set(), "colleges": set(),
                                     "disciplines": set()})

    total_recs = len(rows)

    for row in rows:
        college = (row[i_college] or "").strip()
        eid = (row[i_exhibit] or "").strip()
        title = (row[i_title] or "").strip()
        artic = (row[i_artic] or "").strip()
        course = (row[i_course] or "").strip()
        collab = (row[i_collab] or "").strip()
        top_code = (row[i_top] or "").strip()
        mol = (row[i_mol] or "").strip() or "Unknown"
        cpl = (row[i_cpl] or "").strip() or "Other"

        disc = top_lookup.get(top_code, "Not Mapped")
        is_ccc = "CCC" in collab
        is_industry = cpl == "Industry Certification"

        # Collaborative category
        if is_ccc:
            collab_cat = "CCC Collaborative"
        elif collab in ("", "Other"):
            collab_cat = "Local"
        else:
            collab_cat = "Industry/Other"

        # By College
        if artic:
            c = by_college[artic]
            c["recs"] += 1
            c["exhibits"].add(eid)
            c["disciplines"].add(disc)
            if is_ccc: c["ccc"] += 1
            if is_industry: c["industry"] += 1

        # By Discipline
        d = by_disc[disc]
        d["recs"] += 1
        d["exhibits"].add(eid)
        d["courses"].add(course)
        d["colleges"].add(artic)
        if is_ccc: d["ccc"] += 1

        # By CPL Type
        t = by_cpl[cpl]
        t["recs"] += 1
        t["exhibits"].add(eid)
        t["colleges"].add(artic)

        # By Mode of Learning
        m = by_mol[mol]
        m["recs"] += 1
        m["exhibits"].add(eid)
        m["colleges"].add(artic)

        # Top Exhibits
        e = by_exhibit_title[title]
        e["recs"] += 1
        e["courses"].add(course)
        e["colleges"].add(artic)
        if not e["cpl_type"]: e["cpl_type"] = cpl
        if not e["disc"] or e["disc"] == "Not Mapped": e["disc"] = disc

        # Collaborative
        cc = by_collab[collab_cat]
        cc["recs"] += 1
        cc["exhibits"].add(eid)
        cc["colleges"].add(artic)
        cc["disciplines"].add(disc)

    # ── Serialize to JSON-friendly format ──
    def pct(n): return round(n / total_recs * 100, 1) if total_recs else 0

    tables = {
        "by_college": sorted([
            {"college": k, "credit_recs": v["recs"], "exhibits": len(v["exhibits"]),
             "disciplines": len(v["disciplines"]), "ccc_collaborative": v["ccc"],
             "industry_certs": v["industry"], "pct": pct(v["recs"])}
            for k, v in by_college.items()
        ], key=lambda x: -x["credit_recs"]),

        "by_discipline": sorted([
            {"discipline": k, "credit_recs": v["recs"], "exhibits": len(v["exhibits"]),
             "courses": len(v["courses"]), "colleges": len(v["colleges"]),
             "ccc_collaborative": v["ccc"], "pct": pct(v["recs"])}
            for k, v in by_disc.items()
        ], key=lambda x: -x["credit_recs"]),

        "by_cpl_type": sorted([
            {"cpl_type": k, "credit_recs": v["recs"], "exhibits": len(v["exhibits"]),
             "colleges": len(v["colleges"]), "pct": pct(v["recs"])}
            for k, v in by_cpl.items()
        ], key=lambda x: -x["credit_recs"]),

        "by_mode_of_learning": sorted([
            {"mode": k, "credit_recs": v["recs"], "exhibits": len(v["exhibits"]),
             "colleges": len(v["colleges"]), "pct": pct(v["recs"])}
            for k, v in by_mol.items()
        ], key=lambda x: -x["credit_recs"]),

        "top_exhibits": sorted([
            {"title": k, "credit_recs": v["recs"], "courses": len(v["courses"]),
             "colleges": len(v["colleges"]), "cpl_type": v["cpl_type"], "discipline": v["disc"]}
            for k, v in by_exhibit_title.items()
        ], key=lambda x: -x["credit_recs"])[:50],

        "collaborative_analysis": sorted([
            {"category": k, "credit_recs": v["recs"], "exhibits": len(v["exhibits"]),
             "colleges": len(v["colleges"]), "disciplines": len(v["disciplines"]),
             "pct": pct(v["recs"])}
            for k, v in by_collab.items()
        ], key=lambda x: -x["credit_recs"]),

        "total_credit_recs": total_recs,
        "generated_at": exhibit_data.get("generated_at", ""),
    }

    # ── Statewide Exhibit Adoption Analysis ──
    # Cross-reference CCC Collaborative exhibits with College Courses to find potential adopters
    statewide_adoption = _build_statewide_adoption(data, rows, cm)
    if statewide_adoption:
        tables["statewide_adoption"] = statewide_adoption

    print(f"  Built exhibit analysis tables: {len(tables['by_college'])} colleges, "
          f"{len(tables['by_discipline'])} disciplines, {len(tables['by_cpl_type'])} CPL types, "
          f"{len(tables['by_mode_of_learning'])} modes, {len(tables['top_exhibits'])} top exhibits"
          + (f", {len(statewide_adoption)} statewide exhibits" if statewide_adoption else ""))

    return tables


def _build_statewide_adoption(all_data, exhibit_rows, exhibit_cm):
    """
    For each CCC Collaborative exhibit, identify:
      - Colleges that have already adopted it
      - Colleges that could adopt it (have matching courses by CID or TOP code)

    Uses View_CollegeCourses and TOP_Code_Lookup.xlsx for matching.
    Returns a sorted list of exhibit dicts, or None.
    """
    from collections import defaultdict

    # ── Load MAP TOP Code → CCC 4-digit code mapping ──
    top_lookup = _load_top_code_lookup()  # MAP code → discipline name
    # Need MAP code → CCC 4-digit code for course matching
    map_to_ccc4 = {}
    for folder in _EXHIBIT_LOCATIONS:
        path = os.path.join(folder, "TOP_Code_Lookup.xlsx")
        if os.path.exists(path):
            try:
                wb = load_workbook(path, data_only=True)
                ws = wb["TOP Code Lookup"]
                for row in ws.iter_rows(min_row=2, max_col=5, values_only=True):
                    map_code = str(row[0]).strip() if row[0] is not None else ""
                    ccc_4digit = str(row[3]).strip() if row[3] else ""
                    if map_code and ccc_4digit:
                        map_to_ccc4[map_code] = ccc_4digit
                wb.close()
            except Exception:
                pass
            break

    # ── Find College Courses dataset ──
    courses_ds = None
    for report in all_data:
        if report.get("viewName") == "View_CollegeCourses_APIDataset":
            courses_ds = report
            break
    if not courses_ds:
        return None

    course_rows = courses_ds["columnValue"]
    ccm = {c: i for i, c in enumerate(courses_ds.get("columnName", []))}

    # Build CID → colleges and CCC4 TOP → colleges lookups from College Courses
    cid_to_colleges = defaultdict(set)
    ccc4_to_colleges = defaultdict(set)

    for row in course_rows:
        college = (row[ccm.get("College", 0)] or "").strip()
        cid = (row[ccm.get("CID Number", 1)] or "").strip()
        top_raw = (row[ccm.get("Top Code", 6)] or "").strip()
        # Extract 4-digit code from "0948.00: Automotive Technology"
        ccc4 = top_raw.split(".")[0] if "." in top_raw else ""
        if college and cid:
            cid_to_colleges[cid].add(college)
        if college and ccc4:
            ccc4_to_colleges[ccc4].add(college)

    # ── Gather CCC Collaborative exhibits ──
    i_collab = exhibit_cm.get("Collaborative Type", 7)
    i_eid = exhibit_cm.get("ExhibitID", 1)
    i_title = exhibit_cm.get("Exhibit Title", 2)
    i_artic = exhibit_cm.get("Articulation College", 4)
    i_cid = exhibit_cm.get("CID Number", 9)
    i_top = exhibit_cm.get("TOP Code", 8)
    i_cpl = exhibit_cm.get("CPL Type Description", 13)

    ccc_exhibits = defaultdict(lambda: {
        "adopters": set(), "cids": set(), "map_top": "",
        "title": "", "cpl_type": "",
    })

    for row in exhibit_rows:
        if "CCC" not in (row[i_collab] or ""):
            continue
        eid = (row[i_eid] or "").strip()
        e = ccc_exhibits[eid]
        e["title"] = (row[i_title] or "").strip()
        artic = (row[i_artic] or "").strip()
        if artic: e["adopters"].add(artic)
        cid = (row[i_cid] or "").strip()
        if cid: e["cids"].add(cid)
        top = (row[i_top] or "").strip()
        if top and not e["map_top"]: e["map_top"] = top
        cpl = (row[i_cpl] or "").strip()
        if cpl and not e["cpl_type"]: e["cpl_type"] = cpl

    # ── Compute potential for each exhibit ──
    results = []
    for eid, e in ccc_exhibits.items():
        adopters = e["adopters"]
        ccc4 = map_to_ccc4.get(e["map_top"], "")

        potential_cid = set()
        for cid in e["cids"]:
            potential_cid.update(cid_to_colleges.get(cid, set()))

        potential_top = ccc4_to_colleges.get(ccc4, set()) if ccc4 else set()
        new_colleges = (potential_cid | potential_top) - adopters

        disc = top_lookup.get(e["map_top"], "Not Mapped")

        results.append({
            "exhibit_id": eid,
            "title": e["title"],
            "cpl_type": e["cpl_type"],
            "discipline": disc,
            "adopters": len(adopters),
            "adopter_names": sorted(adopters),
            "potential": len(new_colleges),
            "potential_names": sorted(new_colleges),
            "total_addressable": len(adopters) + len(new_colleges),
        })

    # Sort: exhibits with most potential first, then by adopters descending
    results.sort(key=lambda x: (-x["potential"], -x["adopters"]))
    return results


def render_exhibit_analysis_html(tables):
    """
    Render exhibit analysis tables as scrollable HTML cards.
    Returns the complete HTML section with toggle button and analysis cards.
    """
    if not tables:
        return ""

    def fmt(n):
        return f"{n:,}" if isinstance(n, int) else str(n)

    def pct_bar(pct_val):
        w = min(pct_val, 100)
        return (f'<div style="display:inline-block;width:60px;height:8px;background:rgba(255,255,255,0.1);'
                f'border-radius:4px;vertical-align:middle;margin-left:6px;">'
                f'<div style="width:{w}%;height:100%;background:#C9A84C;border-radius:4px;"></div></div>')

    # ── Card builder helper ──
    def table_card(card_id, title, subtitle, headers, rows_data, row_renderer):
        header_cells = "".join(f'<th>{h}</th>' for h in headers)
        body_rows = "".join(row_renderer(r) for r in rows_data)
        return (
            f'<div class="exhibit-card" id="{card_id}">\n'
            f'  <div class="exhibit-card-header">\n'
            f'    <div class="exhibit-card-title">{title}</div>\n'
            f'    <div class="exhibit-card-subtitle">{subtitle}</div>\n'
            f'  </div>\n'
            f'  <div class="exhibit-card-body">\n'
            f'    <table class="exhibit-table">\n'
            f'      <thead><tr>{header_cells}</tr></thead>\n'
            f'      <tbody>{body_rows}</tbody>\n'
            f'    </table>\n'
            f'  </div>\n'
            f'</div>\n'
        )

    # ── 1. By College ──
    college_card = table_card(
        "exhibit-by-college",
        "Credit Recommendations by College",
        f"{len(tables['by_college'])} articulating colleges | {fmt(tables['total_credit_recs'])} total credit recs",
        ["#", "College", "Credit Recs", "Exhibits", "Disciplines", "CCC Collab", "Industry Certs", "%"],
        tables["by_college"],
        lambda r: (f'<tr><td>{tables["by_college"].index(r)+1}</td>'
                   f'<td class="exhibit-cell-name">{r["college"]}</td>'
                   f'<td class="exhibit-cell-num">{fmt(r["credit_recs"])}</td>'
                   f'<td class="exhibit-cell-num">{fmt(r["exhibits"])}</td>'
                   f'<td class="exhibit-cell-num">{r["disciplines"]}</td>'
                   f'<td class="exhibit-cell-num">{fmt(r["ccc_collaborative"])}</td>'
                   f'<td class="exhibit-cell-num">{fmt(r["industry_certs"])}</td>'
                   f'<td class="exhibit-cell-pct">{r["pct"]}%{pct_bar(r["pct"])}</td></tr>\n')
    )

    # ── 2. By Discipline ──
    disc_card = table_card(
        "exhibit-by-discipline",
        "Credit Recommendations by CCC Discipline",
        f"{len(tables['by_discipline'])} discipline areas",
        ["Discipline", "Credit Recs", "Exhibits", "Courses", "Colleges", "CCC Collab", "%"],
        tables["by_discipline"],
        lambda r: (f'<tr><td class="exhibit-cell-name">{r["discipline"]}</td>'
                   f'<td class="exhibit-cell-num">{fmt(r["credit_recs"])}</td>'
                   f'<td class="exhibit-cell-num">{fmt(r["exhibits"])}</td>'
                   f'<td class="exhibit-cell-num">{fmt(r["courses"])}</td>'
                   f'<td class="exhibit-cell-num">{r["colleges"]}</td>'
                   f'<td class="exhibit-cell-num">{fmt(r["ccc_collaborative"])}</td>'
                   f'<td class="exhibit-cell-pct">{r["pct"]}%{pct_bar(r["pct"])}</td></tr>\n')
    )

    # ── 3. By CPL Type ──
    cpl_card = table_card(
        "exhibit-by-cpl-type",
        "Credit Recommendations by CPL Type",
        f"{len(tables['by_cpl_type'])} CPL types",
        ["CPL Type", "Credit Recs", "Exhibits", "Colleges", "%"],
        tables["by_cpl_type"],
        lambda r: (f'<tr><td class="exhibit-cell-name">{r["cpl_type"]}</td>'
                   f'<td class="exhibit-cell-num">{fmt(r["credit_recs"])}</td>'
                   f'<td class="exhibit-cell-num">{fmt(r["exhibits"])}</td>'
                   f'<td class="exhibit-cell-num">{r["colleges"]}</td>'
                   f'<td class="exhibit-cell-pct">{r["pct"]}%{pct_bar(r["pct"])}</td></tr>\n')
    )

    # ── 4. By Mode of Learning ──
    mol_card = table_card(
        "exhibit-by-mol",
        "Credit Recommendations by Mode of Learning",
        f"{len(tables['by_mode_of_learning'])} modes",
        ["Mode of Learning", "Credit Recs", "Exhibits", "Colleges", "%"],
        tables["by_mode_of_learning"],
        lambda r: (f'<tr><td class="exhibit-cell-name">{r["mode"]}</td>'
                   f'<td class="exhibit-cell-num">{fmt(r["credit_recs"])}</td>'
                   f'<td class="exhibit-cell-num">{fmt(r["exhibits"])}</td>'
                   f'<td class="exhibit-cell-num">{r["colleges"]}</td>'
                   f'<td class="exhibit-cell-pct">{r["pct"]}%{pct_bar(r["pct"])}</td></tr>\n')
    )

    # ── 5. Collaborative Analysis ──
    collab_card = table_card(
        "exhibit-collaborative",
        "CCC Collaborative vs. Local Exhibits",
        "Statewide faculty workgroup articulations vs. individual college articulations",
        ["Category", "Credit Recs", "Exhibits", "Colleges", "Disciplines", "%"],
        tables["collaborative_analysis"],
        lambda r: (f'<tr><td class="exhibit-cell-name">{r["category"]}</td>'
                   f'<td class="exhibit-cell-num">{fmt(r["credit_recs"])}</td>'
                   f'<td class="exhibit-cell-num">{fmt(r["exhibits"])}</td>'
                   f'<td class="exhibit-cell-num">{r["colleges"]}</td>'
                   f'<td class="exhibit-cell-num">{r["disciplines"]}</td>'
                   f'<td class="exhibit-cell-pct">{r["pct"]}%{pct_bar(r["pct"])}</td></tr>\n')
    )

    # ── 6. Top Exhibits ──
    top_card = table_card(
        "exhibit-top-50",
        "Top 50 Most-Articulated Exhibits",
        "Ranked by total credit recommendations across all colleges",
        ["#", "Exhibit Title", "Credit Recs", "Courses", "Colleges", "CPL Type", "Discipline"],
        tables["top_exhibits"],
        lambda r: (f'<tr><td>{tables["top_exhibits"].index(r)+1}</td>'
                   f'<td class="exhibit-cell-name">{r["title"]}</td>'
                   f'<td class="exhibit-cell-num">{fmt(r["credit_recs"])}</td>'
                   f'<td class="exhibit-cell-num">{r["courses"]}</td>'
                   f'<td class="exhibit-cell-num">{r["colleges"]}</td>'
                   f'<td>{r["cpl_type"]}</td>'
                   f'<td>{r["discipline"]}</td></tr>\n')
    )

    # ── 7. Statewide Exhibit Adoption (dynamic — powered by statewide_data.js) ──
    statewide_card = ""
    statewide_data = tables.get("statewide_adoption", [])
    if statewide_data:
        statewide_card = '<div id="statewide-interactive-container"></div>\n'

    # ── Assemble section ──
    gen_at = tables.get("generated_at", "")
    section = (
        f'<!-- ═══ MAP Articulation Analysis Section ═══ -->\n'
        f'<div class="exhibit-analysis-section" id="exhibitAnalysisSection">\n'
        f'  <div class="exhibit-section-header">\n'
        f'    <h2 style="margin:0;font-size:1.3rem;">MAP Articulation Analysis</h2>\n'
        f'    <div style="font-size:0.75rem;opacity:0.7;margin-top:2px;">'
        f'Source: MAP Custom Reporting Module | Generated: {gen_at}</div>\n'
        f'  </div>\n'
        f'  <div class="exhibit-cards-grid">\n'
        f'    {collab_card}\n'
        f'    {cpl_card}\n'
        f'    {mol_card}\n'
        f'    {disc_card}\n'
        f'    {college_card}\n'
        f'    {top_card}\n'
        f'  </div>\n'
        + (f'  {statewide_card}\n' if statewide_card else '')
        + f'</div>\n'
    )

    return section


# ── CSS for exhibit analysis cards ──
EXHIBIT_ANALYSIS_CSS = """
/* ═══ MAP Articulation Analysis Cards ═══ */
.exhibit-analysis-section {
    display: none;
    margin: 1.5rem auto;
    max-width: 1400px;
    padding: 0 1rem;
}
.exhibit-analysis-section.visible { display: block; }
.exhibit-section-header {
    text-align: center;
    color: #C9A84C;
    margin-bottom: 1.2rem;
}
.exhibit-cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
    gap: 1rem;
}
.exhibit-card {
    background: rgba(10,34,64,0.85);
    border: 1px solid rgba(201,168,76,0.25);
    border-radius: 10px;
    overflow: hidden;
}
.exhibit-card-header {
    padding: 0.8rem 1rem 0.5rem;
    border-bottom: 1px solid rgba(255,255,255,0.08);
}
.exhibit-card-title {
    font-size: 0.95rem;
    font-weight: 700;
    color: #C9A84C;
}
.exhibit-card-subtitle {
    font-size: 0.7rem;
    color: rgba(255,255,255,0.55);
    margin-top: 2px;
}
.exhibit-card-body {
    max-height: 420px;
    overflow: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(201,168,76,0.3) transparent;
}
.exhibit-card-body::-webkit-scrollbar { width: 6px; height: 6px; }
.exhibit-card-body::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.3); border-radius: 3px; }
.exhibit-card-body::-webkit-scrollbar-track { background: transparent; }
.exhibit-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.72rem;
    color: rgba(255,255,255,0.85);
}
.exhibit-table thead {
    position: sticky;
    top: 0;
    z-index: 2;
}
.exhibit-table th {
    background: rgba(10,34,64,0.98);
    color: #C9A84C;
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    padding: 0.45rem 0.5rem;
    text-align: left;
    border-bottom: 1px solid rgba(201,168,76,0.3);
    white-space: nowrap;
}
.exhibit-table td {
    padding: 0.35rem 0.5rem;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    vertical-align: top;
}
.exhibit-table tbody tr:hover {
    background: rgba(201,168,76,0.06);
}
.exhibit-cell-name {
    max-width: 280px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.exhibit-cell-num {
    text-align: right;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}
.exhibit-cell-pct {
    text-align: right;
    white-space: nowrap;
    color: rgba(255,255,255,0.6);
}
/* Full-width card (statewide adoption) */
.exhibit-card-full {
    grid-column: 1 / -1;
}
/* College name tags */
.sw-college-list {
    line-height: 1.8;
    max-width: 500px;
}
.sw-college {
    display: inline-block;
    font-size: 0.62rem;
    padding: 1px 6px;
    border-radius: 3px;
    margin: 1px 2px;
    white-space: nowrap;
}
.sw-adopted {
    background: rgba(42,125,79,0.25);
    color: #6fcf97;
    border: 1px solid rgba(42,125,79,0.4);
}
.sw-potential {
    background: rgba(201,168,76,0.12);
    color: #C9A84C;
    border: 1px solid rgba(201,168,76,0.25);
}
/* Toggle button */
.exhibit-toggle-btn {
    display: inline-block;
    margin: 1.2rem auto;
    padding: 0.75rem 2.5rem;
    background: #0A2240;
    border: 2px solid #1a3a60;
    border-radius: 8px;
    color: #fff;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
    letter-spacing: 0.02em;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
.exhibit-toggle-btn:hover {
    background: #122d4f;
    border-color: #2a5a8f;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
/* ═══ Interactive Statewide Card ═══ */
#statewide-interactive-container { grid-column: 1 / -1; }
.sw-interactive { background:rgba(10,34,64,0.85); border:1px solid rgba(201,168,76,0.25); border-radius:10px; overflow:hidden; }
.sw-toolbar { padding:0.8rem 1rem; display:flex; flex-wrap:wrap; gap:0.5rem; align-items:center; border-bottom:1px solid rgba(255,255,255,0.08); }
.sw-toolbar input[type=text] { flex:1 1 200px; padding:0.4rem 0.6rem; border:1px solid rgba(255,255,255,0.2); border-radius:5px; background:rgba(255,255,255,0.06); color:#fff; font-size:0.78rem; outline:none; }
.sw-toolbar input[type=text]:focus { border-color:#C9A84C; }
.sw-toolbar input[type=text]::placeholder { color:rgba(255,255,255,0.35); }
.sw-filter-group { position:relative; display:inline-block; }
.sw-filter-btn { padding:0.35rem 0.7rem; border:1px solid rgba(255,255,255,0.2); border-radius:5px; background:rgba(255,255,255,0.06); color:rgba(255,255,255,0.8); font-size:0.72rem; cursor:pointer; white-space:nowrap; }
.sw-filter-btn:hover, .sw-filter-btn.active { border-color:#C9A84C; color:#C9A84C; }
.sw-filter-dropdown { display:none; position:absolute; top:100%; left:0; z-index:100; min-width:220px; max-height:280px; overflow-y:auto; background:#0e2a4a; border:1px solid rgba(201,168,76,0.3); border-radius:6px; box-shadow:0 6px 20px rgba(0,0,0,0.5); margin-top:4px; }
.sw-filter-dropdown.open { display:block; }
.sw-filter-dropdown label { display:flex; align-items:center; gap:0.4rem; padding:0.3rem 0.6rem; font-size:0.7rem; color:rgba(255,255,255,0.8); cursor:pointer; }
.sw-filter-dropdown label:hover { background:rgba(201,168,76,0.1); }
.sw-filter-dropdown input[type=checkbox] { accent-color:#C9A84C; }
.sw-filter-search { width:calc(100% - 1rem); margin:0.4rem 0.5rem; padding:0.3rem 0.5rem; border:1px solid rgba(255,255,255,0.15); border-radius:4px; background:rgba(255,255,255,0.05); color:#fff; font-size:0.68rem; }
.sw-action-bar { padding:0.5rem 1rem; display:flex; flex-wrap:wrap; gap:0.5rem; align-items:center; border-bottom:1px solid rgba(255,255,255,0.06); }
.sw-action-btn { padding:0.35rem 0.9rem; border:1px solid rgba(201,168,76,0.4); border-radius:5px; background:rgba(201,168,76,0.1); color:#C9A84C; font-size:0.72rem; font-weight:600; cursor:pointer; transition:all 0.15s; }
.sw-action-btn:hover { background:rgba(201,168,76,0.25); }
.sw-action-btn.primary { background:#C9A84C; color:#0A2240; border-color:#C9A84C; }
.sw-action-btn.primary:hover { background:#d4b35c; }
.sw-count { font-size:0.7rem; color:rgba(255,255,255,0.5); margin-left:auto; }
.sw-table-wrap { max-height:600px; overflow:auto; scrollbar-width:thin; scrollbar-color:rgba(201,168,76,0.3) transparent; }
.sw-table-wrap::-webkit-scrollbar { width:6px; height:6px; }
.sw-table-wrap::-webkit-scrollbar-thumb { background:rgba(201,168,76,0.3); border-radius:3px; }
.sw-chk { accent-color:#C9A84C; cursor:pointer; }
.sw-row-selected { background:rgba(201,168,76,0.08) !important; }
"""


def read_workplan_goals(wb):
    """
    Read the 'Annual Workplan Goals' sheet.
    Each activity block has 3 rows: GOAL, CURRENT, STRETCH.
    Columns: B=Activity description, C=row type, D-H=years (2025-26 to 2029-30), I=TOTAL.
    Returns list of dicts with annual goal/stretch data per activity.
    CURRENT row values are ignored (placeholder data).
    """
    if "Annual Workplan Goals" not in wb.sheetnames:
        print("  No 'Annual Workplan Goals' sheet found — skipping")
        return []

    ws = wb["Annual Workplan Goals"]
    year_labels = ["2025-26", "2026-27", "2027-28", "2028-29", "2029-30"]
    activities = []
    r = 4  # first data row

    while r <= ws.max_row:
        activity_desc = ws.cell(row=r, column=2).value
        row_type = str(ws.cell(row=r, column=3).value or "").strip().upper()
        if not activity_desc and not row_type:
            r += 1
            continue
        if row_type != "GOAL":
            r += 1
            continue

        # Parse activity ID and name from the description cell
        desc_text = str(activity_desc).strip()
        lines = desc_text.split("\n")
        first_line = lines[0].strip()
        # Extract ID like "1.1", "3.1.1", "3.1.2" from start
        import re as _re
        id_match = _re.match(r'^(\d+\.\d+(?:\.\d+)?)\s+(.+)', first_line)
        if id_match:
            act_id = id_match.group(1)
            act_name = id_match.group(2)
        else:
            act_id = first_line[:3].strip()
            act_name = first_line

        # Read GOAL row values (columns D=4 through H=8, I=9 for total)
        goal_values = []
        for c in range(4, 9):
            v = ws.cell(row=r, column=c).value
            goal_values.append(v if v is not None else 0)
        goal_total = ws.cell(row=r, column=9).value or 0

        # Read STRETCH row (should be r+2, skip CURRENT at r+1)
        stretch_values = []
        stretch_total = 0
        stretch_row = r + 2
        if stretch_row <= ws.max_row:
            stype = str(ws.cell(row=stretch_row, column=3).value or "").strip().upper()
            if stype == "STRETCH":
                for c in range(4, 9):
                    v = ws.cell(row=stretch_row, column=c).value
                    stretch_values.append(v if v is not None else 0)
                stretch_total = ws.cell(row=stretch_row, column=9).value or 0

        # Determine if values are percentages (0-1 range)
        is_pct = all(isinstance(v, float) and 0 < v < 1 for v in goal_values if v)

        activities.append({
            "id": act_id,
            "name": act_name,
            "is_percentage": is_pct,
            "years": year_labels,
            "goal": goal_values,
            "goal_total": goal_total,
            "stretch": stretch_values if stretch_values else [0] * 5,
            "stretch_total": stretch_total,
        })

        r += 3  # skip GOAL, CURRENT, STRETCH rows

    print(f"  Read {len(activities)} activities from Annual Workplan Goals")
    return activities


def build_workplan_goals_from_projects(projects):
    """
    Derive the workplan-goals data structure directly from the Project List tab,
    so the 'Annual Workplan Goals' sheet is no longer required.

    Each project row already carries columns:
        kpi_goal_2526, kpi_stretch_2526, kpi_goal_2627, …, kpi_goal_2930, kpi_stretch_2930

    Returns two things as a tuple:
        workplan_goals – list of dicts compatible with render_workplan_goals_html()
        annual_goals   – list of dicts compatible with render_annual_goals_table_html()
    """
    import re as _re

    year_keys = [
        ("2025-26", "kpi_goal_2526", "kpi_stretch_2526"),
        ("2026-27", "kpi_goal_2627", "kpi_stretch_2627"),
        ("2027-28", "kpi_goal_2728", "kpi_stretch_2728"),
        ("2028-29", "kpi_goal_2829", "kpi_stretch_2829"),
        ("2029-30", "kpi_goal_2930", "kpi_stretch_2930"),
    ]

    # Core sub-activity IDs (same as build_activity_kpis)
    core_ids = [
        "1.1", "1.2", "1.3", "1.4",
        "2.1", "2.2", "2.3", "2.4",
        "3.1", "3.2", "3.3", "3.4", "3.5", "3.6",
        "4.1",  # aggregated from 4.1a-4.1d
        "4.2", "4.3", "4.4", "4.5",
    ]
    sprint_ids = ["4.1a", "4.1b", "4.1c", "4.1d"]

    activity_labels = {
        "1": "Activity 1: Build AI-Enhanced CPL Infrastructure",
        "2": "Activity 2: Faculty Workgroups & Credit Recommendations",
        "3": "Activity 3: Build CPL Data Infrastructure",
        "4": "Activity 4: Sprints, Projects, Partnerships & Scale",
    }

    proj_map = {p["id"]: p for p in projects}

    def _parse_num(val):
        """Parse a formatted number string back to a float."""
        if val is None or val == "":
            return 0
        if isinstance(val, (int, float)):
            return float(val)
        s = str(val).strip().replace(",", "").replace("+", "")
        if s.lower().endswith("k"):
            try:
                return float(s[:-1]) * 1000
            except ValueError:
                return 0
        try:
            return float(s)
        except ValueError:
            return 0

    # ── Build per-sub-activity rows ──
    workplan_goals = []   # for render_workplan_goals_html
    annual_goals = []     # for render_annual_goals_table_html

    for pid in core_ids:
        # For 4.1, aggregate sprint sub-projects
        if pid == "4.1":
            sprint_projs = [proj_map[sid] for sid in sprint_ids if sid in proj_map]
            if not sprint_projs:
                continue
            name = "Sprints (Veteran, Apprenticeship, Adoption, 29 Palms)"
            goal_values = []
            stretch_values = []
            goal_dict = {}
            stretch_dict = {}
            current_dict = {}
            for yr_label, g_key, s_key in year_keys:
                g_sum = sum(_parse_num(sp.get(g_key, 0)) for sp in sprint_projs)
                s_sum = sum(_parse_num(sp.get(s_key, 0)) for sp in sprint_projs)
                goal_values.append(g_sum)
                stretch_values.append(s_sum)
                goal_dict[yr_label] = g_sum
                stretch_dict[yr_label] = s_sum
                current_dict[yr_label] = 0
            current_metric = _parse_num(proj_map.get("4.1a", {}).get("kpi_metric", 0))
        else:
            p = proj_map.get(pid)
            if not p:
                continue
            name = p["name"]
            goal_values = []
            stretch_values = []
            goal_dict = {}
            stretch_dict = {}
            current_dict = {}
            for yr_label, g_key, s_key in year_keys:
                g_val = _parse_num(p.get(g_key, 0))
                s_val = _parse_num(p.get(s_key, 0))
                goal_values.append(g_val)
                stretch_values.append(s_val)
                goal_dict[yr_label] = g_val
                stretch_dict[yr_label] = s_val
                current_dict[yr_label] = 0
            current_metric = _parse_num(p.get("kpi_metric", 0))

        goal_total = sum(goal_values)
        stretch_total = sum(stretch_values)

        # Populate current 2025-26 with actual KPI metric
        current_dict["2025-26"] = current_metric
        current_dict["total"] = current_metric

        # Determine activity group
        act_num = pid.split(".")[0]
        act_label = activity_labels.get(act_num, f"Activity {act_num}")

        # Check if values are percentages
        is_pct = all(0 < v < 1 for v in goal_values if v)

        # workplan_goals format (for render_workplan_goals_html)
        workplan_goals.append({
            "id": pid,
            "name": name,
            "is_percentage": is_pct,
            "years": ["2025-26", "2026-27", "2027-28", "2028-29", "2029-30"],
            "goal": goal_values,
            "goal_total": goal_total,
            "stretch": stretch_values if stretch_values else [0] * 5,
            "stretch_total": stretch_total,
        })

        # annual_goals format (for render_annual_goals_table_html)
        goal_dict["total"] = goal_total
        stretch_dict["total"] = stretch_total
        annual_goals.append({
            "id": pid,
            "name": name,
            "activity": act_label,
            "goal": goal_dict,
            "current": current_dict,
            "stretch": stretch_dict,
        })

    print(f"  Built {len(workplan_goals)} workplan goal rows from Project List")
    return workplan_goals, annual_goals


def read_budget_plan(wb):
    """
    Read comprehensive budget and expenditure data from the "20260324 CPL Budget" tab.

    Structure:
    - Rows 6-11: Funding sources (name, category, type, source, yearly budgets, expense, total)
    - Rows 12-14: Funding subtotals (Operations, Special Projects, Local Funding)
    - Row 15: Grand total
    - Rows 19-52: Expenditure line items
    - Rows 53-56: Summary by type
    - Rows 60-67: Expense categories summary
    - Rows 70-72: Expense areas
    - Rows 75-81: Expenditure factors (FTE, costs, funding, COLA, indirect)
    - Rows 87-99: Personnel plan (positions with FTE and compensation)
    - Row 100: Personnel totals
    """
    # Find the budget sheet (search for "Budget" in name, but not exact "Budget Plan")
    ws = None
    for sheet_name in wb.sheetnames:
        if "budget" in sheet_name.lower() and sheet_name.lower() != "budget plan":
            ws = wb[sheet_name]
            break

    if not ws:
        # Fallback to old sheet name for backward compatibility
        if "Budget Plan" in wb.sheetnames:
            ws = wb["Budget Plan"]
        else:
            # Return empty structure if no budget sheet found
            return {
                "funding_sources": [],
                "funding_subtotals": {},
                "expenditures": [],
                "expense_categories": [],
                "expense_areas": [],
                "factors": {},
                "personnel": [],
                "personnel_totals": {},
                "year_labels": ["2025-26", "2026-27", "2027-28", "2028-29", "2029-30"],
                "grand_total": 0,
            }

    year_labels = ["2025-26", "2026-27", "2027-28", "2028-29", "2029-30"]

    def safe_num(val):
        """Safely convert cell value to number (0 if None or non-numeric)."""
        if val is None:
            return 0
        if isinstance(val, (int, float)):
            return val
        try:
            return float(str(val).replace(",", ""))
        except (ValueError, AttributeError):
            return 0

    # ── FUNDING SOURCES (rows 6-11) ──
    # Cols: B=name, C=category, D=type, E=source, F-K=yearly budgets (5 years), L=total, M=avg
    funding_sources = []
    for r in range(6, 12):
        name = ws.cell(row=r, column=2).value or ""
        if not name:
            break

        source_code = ws.cell(row=r, column=5).value or ""
        budget_by_year = []
        for c in range(6, 11):  # cols F-J = 5 years
            budget_by_year.append(safe_num(ws.cell(row=r, column=c).value))

        expense_2025 = safe_num(ws.cell(row=r, column=7).value)  # col G = expense
        total = safe_num(ws.cell(row=r, column=12).value)  # col L = total
        avg = safe_num(ws.cell(row=r, column=13).value)  # col M = avg

        funding_sources.append({
            "name": name,
            "source_code": source_code,
            "budget_by_year": budget_by_year,
            "expense_2025": expense_2025,
            "total": total,
            "avg": avg,
        })

    # ── FUNDING SUBTOTALS (rows 12-14) ──
    funding_subtotals = {}
    subtotal_labels = ["ops_support", "special_projects", "local_funding"]
    for idx, label in enumerate(subtotal_labels):
        r = 12 + idx
        budget_by_year = []
        for c in range(6, 11):
            budget_by_year.append(safe_num(ws.cell(row=r, column=c).value))
        total = safe_num(ws.cell(row=r, column=12).value)
        funding_subtotals[label] = {
            "budget_by_year": budget_by_year,
            "total": total,
        }

    # ── GRAND TOTAL (row 15, col L) ──
    grand_total = safe_num(ws.cell(row=15, column=12).value)

    # ── EXPENDITURE LINE ITEMS (rows 19-52) ──
    # Cols: B=description, C=category, D=type, E=source, F-K=yearly budgets, G=expense 2025, L=total
    expenditures = []
    for r in range(19, 53):
        description = ws.cell(row=r, column=2).value or ""
        if not description:
            continue

        category = ws.cell(row=r, column=3).value or ""
        exp_type = ws.cell(row=r, column=4).value or ""  # Operations/Special Projects/Local Funding
        source = ws.cell(row=r, column=5).value or ""

        budget_by_year = []
        for c in range(6, 11):  # cols F-J = 5 years
            budget_by_year.append(safe_num(ws.cell(row=r, column=c).value))

        expense_2025 = safe_num(ws.cell(row=r, column=7).value)  # col G = expense
        total = safe_num(ws.cell(row=r, column=12).value)  # col L = total

        expenditures.append({
            "description": description,
            "category": category,
            "type": exp_type,
            "source": source,
            "budget_by_year": budget_by_year,
            "expense_2025": expense_2025,
            "total": total,
        })

    # ── EXPENSE CATEGORIES (rows 60-67) ──
    # Cols: B=name, F-K=yearly budgets, G=expense, L=total, M=avg
    expense_categories = []
    for r in range(60, 68):
        name = ws.cell(row=r, column=2).value or ""
        if not name:
            continue

        budget_by_year = []
        for c in range(6, 11):
            budget_by_year.append(safe_num(ws.cell(row=r, column=c).value))

        expense_2025 = safe_num(ws.cell(row=r, column=7).value)
        total = safe_num(ws.cell(row=r, column=12).value)
        avg = safe_num(ws.cell(row=r, column=13).value)

        expense_categories.append({
            "name": name,
            "budget_by_year": budget_by_year,
            "expense_2025": expense_2025,
            "total": total,
            "avg": avg,
        })

    # ── EXPENSE AREAS (rows 70-72) ──
    expense_areas = []
    for r in range(70, 73):
        name = ws.cell(row=r, column=2).value or ""
        if not name:
            continue

        budget_by_year = []
        for c in range(6, 11):
            budget_by_year.append(safe_num(ws.cell(row=r, column=c).value))

        total = safe_num(ws.cell(row=r, column=12).value)

        expense_areas.append({
            "name": name,
            "budget_by_year": budget_by_year,
            "total": total,
        })

    # ── EXPENDITURE FACTORS (rows 75-81) ──
    factors = {}
    factor_rows = {
        75: "fte",
        76: "platform_maint",
        77: "platform_dev",
        78: "college_funding",
        79: "colleges_eligible",
        80: "cola_rate",
        81: "indirect_rate",
    }

    for r, key in factor_rows.items():
        # Values are in col F (2025-26), H-K (2026-27 through 2029-30)
        year_cols = [6, 8, 9, 10, 11]
        year_vals = [safe_num(ws.cell(row=r, column=c).value) for c in year_cols]
        non_zero = [v for v in year_vals if v != 0]
        factors[key] = sum(non_zero) / len(non_zero) if non_zero else 0

    # ── PERSONNEL PLAN (rows 87-99) ──
    # Cols: B=title, F-K=FTE by year (5 years), G=not used, L=total compensation
    personnel = []
    for r in range(87, 100):
        title = ws.cell(row=r, column=2).value or ""
        if not title:
            continue

        fte_by_year = []
        for c in range(6, 11):  # cols F-J = 5 years
            fte_by_year.append(safe_num(ws.cell(row=r, column=c).value))

        total_comp = safe_num(ws.cell(row=r, column=12).value)  # col L = total comp

        personnel.append({
            "title": title,
            "fte_by_year": fte_by_year,
            "total_comp": total_comp,
        })

    # ── PERSONNEL TOTALS (row 100) ──
    total_fte = safe_num(ws.cell(row=100, column=6).value)  # col F
    total_comp = safe_num(ws.cell(row=100, column=12).value)  # col L
    personnel_totals = {
        "total_fte": total_fte,
        "total_comp": total_comp,
    }

    return {
        "funding_sources": funding_sources,
        "funding_subtotals": funding_subtotals,
        "expenditures": expenditures,
        "expense_categories": expense_categories,
        "expense_areas": expense_areas,
        "factors": factors,
        "personnel": personnel,
        "personnel_totals": personnel_totals,
        "year_labels": year_labels,
        "grand_total": grand_total,
    }


def render_budget_html(budget):
    """
    Generate a complete HTML section for the budget dashboard.
    Replaces content between <!-- Budget Section --> and <!-- Vision 2030 Section -->.

    Includes:
    - Funding Overview with stacked bar chart and source table
    - Expenditure Summary (by category and area)
    - Expenditure Detail (collapsible accordion by type)
    - Personnel Plan with FTE and compensation
    """

    if not budget or not budget.get("funding_sources"):
        # Return minimal section if no budget data
        return '''<!-- Budget Section -->
        <div class="budget-section">
            <h2>CPL Budget & Expenditures</h2>
            <p style="color:#999;">Budget data not available</p>
        </div>
        <!-- End Budget Section -->'''

    # Extract data
    funding_sources = budget.get("funding_sources", [])
    expenditures = budget.get("expenditures", [])
    expense_categories = budget.get("expense_categories", [])
    expense_areas = budget.get("expense_areas", [])
    personnel = budget.get("personnel", [])
    personnel_totals = budget.get("personnel_totals", {})
    factors = budget.get("factors", {})
    year_labels = budget.get("year_labels", ["2025-26", "2026-27", "2027-28", "2028-29", "2029-30"])
    grand_total = budget.get("grand_total", 0)

    # Color scheme
    colors = ["#0A2240", "#163A5F", "#2A7D4F", "#C9A84C", "#9BBCD8"]

    # === SECTION 1: FUNDING OVERVIEW ===
    funding_html = '<div class="budget-funding-overview">\n'
    funding_html += f'        <h3>CPL 5-Year Funding Plan</h3>\n'
    funding_html += f'        <p style="font-size:1.3rem;font-weight:bold;color:#0A2240;margin-bottom:1.5rem;">{fmt_dollars(grand_total)} Total Allocation</p>\n'

    # Stacked bar chart (CSS-based)
    if sum(s.get("total", 0) for s in funding_sources) > 0:
        funding_html += '        <div style="margin-bottom:2rem;">\n'
        funding_html += '            <div style="display:flex;height:40px;border-radius:4px;overflow:hidden;box-shadow:0 2px 4px rgba(0,0,0,0.1);">\n'

        total_funding = sum(s.get("total", 0) for s in funding_sources)
        for idx, source in enumerate(funding_sources):
            source_total = source.get("total", 0)
            pct = (source_total / total_funding * 100) if total_funding > 0 else 0
            color = colors[idx % len(colors)]
            source_label = source.get("name", "")
            funding_html += f'                <div style="flex:{pct:.1f}%;background-color:{color};display:flex;align-items:center;justify-content:center;color:white;font-size:0.75rem;font-weight:bold;text-align:center;" title="{source_label}: {fmt_dollars(source_total)}">'
            if pct > 8:
                funding_html += f'{pct:.0f}%'
            funding_html += '</div>\n'

        funding_html += '            </div>\n'
        funding_html += '            <div style="display:flex;margin-top:0.5rem;font-size:0.8rem;gap:1.5rem;flex-wrap:wrap;">\n'
        for idx, source in enumerate(funding_sources):
            color = colors[idx % len(colors)]
            source_name = source.get("name", "")
            source_total = source.get("total", 0)
            funding_html += f'                <div><span style="display:inline-block;width:12px;height:12px;background-color:{color};border-radius:2px;margin-right:4px;vertical-align:middle;"></span>{source_name}: {fmt_dollars(source_total)}</div>\n'
        funding_html += '            </div>\n'
        funding_html += '        </div>\n'

    # Funding sources table
    funding_html += '        <table style="width:100%;border-collapse:collapse;margin-bottom:2rem;font-size:0.9rem;">\n'
    funding_html += '            <thead>\n'
    funding_html += '                <tr style="background-color:#f5f5f5;border-bottom:2px solid #0A2240;">\n'
    funding_html += '                    <th style="padding:8px;text-align:left;font-weight:bold;">Funding Source</th>\n'
    for year in year_labels:
        funding_html += f'                    <th style="padding:8px;text-align:right;font-weight:bold;">{year}</th>\n'
    funding_html += '                    <th style="padding:8px;text-align:right;font-weight:bold;">2025-26 Expense</th>\n'
    funding_html += '                    <th style="padding:8px;text-align:right;font-weight:bold;border-right:2px solid #0A2240;">Total</th>\n'
    funding_html += '                </tr>\n'
    funding_html += '            </thead>\n'
    funding_html += '            <tbody>\n'

    for source in funding_sources:
        source_name = source.get("name", "")
        budget_by_year = source.get("budget_by_year", [])
        expense_2025 = source.get("expense_2025", 0)
        total = source.get("total", 0)

        funding_html += f'                <tr style="border-bottom:1px solid #ddd;">\n'
        funding_html += f'                    <td style="padding:8px;font-weight:500;">{source_name}</td>\n'
        for budget in budget_by_year:
            funding_html += f'                    <td style="padding:8px;text-align:right;">{fmt_dollars(budget)}</td>\n'
        funding_html += f'                    <td style="padding:8px;text-align:right;color:#666;">{fmt_dollars(expense_2025)}</td>\n'
        funding_html += f'                    <td style="padding:8px;text-align:right;border-right:2px solid #0A2240;font-weight:bold;">{fmt_dollars(total)}</td>\n'
        funding_html += f'                </tr>\n'

    funding_html += '            </tbody>\n'
    funding_html += '        </table>\n'
    funding_html += '    </div>\n'

    # === SECTION 2: EXPENDITURE SUMMARY ===
    summary_html = '    <div class="budget-expenditure-summary" style="margin-top:2rem;">\n'
    summary_html += '        <h3>Expenditure Summary</h3>\n'
    summary_html += '        <div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;margin-bottom:2rem;">\n'

    # By Expense Category
    summary_html += '            <div>\n'
    summary_html += '                <h4 style="margin-bottom:1rem;">By Expense Category</h4>\n'
    summary_html += '                <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">\n'
    summary_html += '                    <tbody>\n'

    for cat in expense_categories[:8]:  # Top 8 categories
        cat_name = cat.get("name", "")
        total = cat.get("total", 0)
        summary_html += f'                        <tr style="border-bottom:1px solid #eee;">\n'
        summary_html += f'                            <td style="padding:6px;text-align:left;">{cat_name}</td>\n'
        summary_html += f'                            <td style="padding:6px;text-align:right;font-weight:bold;">{fmt_dollars(total)}</td>\n'
        summary_html += f'                        </tr>\n'

    summary_html += '                    </tbody>\n'
    summary_html += '                </table>\n'
    summary_html += '            </div>\n'

    # By Expense Area
    summary_html += '            <div>\n'
    summary_html += '                <h4 style="margin-bottom:1rem;">By Expense Area</h4>\n'
    summary_html += '                <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">\n'
    summary_html += '                    <tbody>\n'

    for area in expense_areas:
        area_name = area.get("name", "")
        total = area.get("total", 0)
        summary_html += f'                        <tr style="border-bottom:1px solid #eee;">\n'
        summary_html += f'                            <td style="padding:6px;text-align:left;">{area_name}</td>\n'
        summary_html += f'                            <td style="padding:6px;text-align:right;font-weight:bold;">{fmt_dollars(total)}</td>\n'
        summary_html += f'                        </tr>\n'

    summary_html += '                    </tbody>\n'
    summary_html += '                </table>\n'
    summary_html += '            </div>\n'
    summary_html += '        </div>\n'
    summary_html += '    </div>\n'

    # === SECTION 3: EXPENDITURE DETAIL (Accordion) ===
    detail_html = '    <div class="budget-expenditure-detail" style="margin-top:2rem;">\n'
    detail_html += '        <h3>Expenditure Detail</h3>\n'

    # Group expenditures by type
    exp_by_type = {}
    for exp in expenditures:
        exp_type = exp.get("type", "Other")
        if exp_type not in exp_by_type:
            exp_by_type[exp_type] = []
        exp_by_type[exp_type].append(exp)

    for exp_type in ["Operations & Support", "Special Projects", "Local Funding"]:
        if exp_type not in exp_by_type:
            continue

        items = exp_by_type[exp_type]
        type_total = sum(e.get("total", 0) for e in items)

        detail_html += f'        <details style="margin-bottom:1rem;border:1px solid #ddd;border-radius:4px;padding:1rem;">\n'
        detail_html += f'            <summary style="font-weight:bold;cursor:pointer;padding:0.5rem 0;user-select:none;">\n'
        detail_html += f'                {exp_type} <span style="float:right;color:#666;">{fmt_dollars(type_total)}</span>\n'
        detail_html += f'            </summary>\n'
        detail_html += f'            <div style="margin-top:1rem;overflow-x:auto;">\n'
        detail_html += f'                <table style="width:100%;border-collapse:collapse;font-size:0.8rem;">\n'
        detail_html += f'                    <thead>\n'
        detail_html += f'                        <tr style="background-color:#f9f9f9;border-bottom:1px solid #ddd;">\n'
        detail_html += f'                            <th style="padding:6px;text-align:left;">Description</th>\n'
        detail_html += f'                            <th style="padding:6px;text-align:left;">Category</th>\n'
        detail_html += f'                            <th style="padding:6px;text-align:left;">Source</th>\n'
        for year in year_labels:
            detail_html += f'                            <th style="padding:6px;text-align:right;font-size:0.75rem;">{year}</th>\n'
        detail_html += f'                            <th style="padding:6px;text-align:right;">Total</th>\n'
        detail_html += f'                        </tr>\n'
        detail_html += f'                    </thead>\n'
        detail_html += f'                    <tbody>\n'

        for item in items:
            desc = item.get("description", "")[:50]  # Truncate to 50 chars
            category = item.get("category", "")
            source = item.get("source", "")
            budget_by_year = item.get("budget_by_year", [])
            total = item.get("total", 0)

            detail_html += f'                        <tr style="border-bottom:1px solid #eee;">\n'
            detail_html += f'                            <td style="padding:6px;font-size:0.75rem;">{desc}</td>\n'
            detail_html += f'                            <td style="padding:6px;font-size:0.75rem;">{category}</td>\n'
            detail_html += f'                            <td style="padding:6px;font-size:0.75rem;">{source}</td>\n'
            for budget in budget_by_year:
                detail_html += f'                            <td style="padding:6px;text-align:right;font-size:0.75rem;">{fmt_dollars(budget)}</td>\n'
            detail_html += f'                            <td style="padding:6px;text-align:right;font-weight:bold;font-size:0.75rem;">{fmt_dollars(total)}</td>\n'
            detail_html += f'                        </tr>\n'

        detail_html += f'                    </tbody>\n'
        detail_html += f'                </table>\n'
        detail_html += f'            </div>\n'
        detail_html += f'        </details>\n'

    detail_html += '    </div>\n'

    # === SECTION 4: PERSONNEL PLAN ===
    personnel_html = '    <div class="budget-personnel-plan" style="margin-top:2rem;">\n'
    personnel_html += '        <h3>Personnel Plan</h3>\n'

    if personnel:
        personnel_html += '        <div style="overflow-x:auto;">\n'
        personnel_html += '            <table style="width:100%;border-collapse:collapse;margin-bottom:1.5rem;font-size:0.85rem;">\n'
        personnel_html += '                <thead>\n'
        personnel_html += '                    <tr style="background-color:#f5f5f5;border-bottom:2px solid #0A2240;">\n'
        personnel_html += '                        <th style="padding:8px;text-align:left;font-weight:bold;">Position Title</th>\n'

        for year in year_labels:
            personnel_html += f'                        <th style="padding:8px;text-align:right;font-weight:bold;">FTE {year}</th>\n'

        personnel_html += '                        <th style="padding:8px;text-align:right;font-weight:bold;border-right:2px solid #0A2240;">Total Compensation</th>\n'
        personnel_html += '                    </tr>\n'
        personnel_html += '                </thead>\n'
        personnel_html += '                <tbody>\n'

        for pos in personnel:
            title = pos.get("title", "")
            fte_by_year = pos.get("fte_by_year", [])
            total_comp = pos.get("total_comp", 0)

            personnel_html += f'                    <tr style="border-bottom:1px solid #ddd;">\n'
            personnel_html += f'                        <td style="padding:8px;">{title}</td>\n'

            for fte in fte_by_year:
                personnel_html += f'                        <td style="padding:8px;text-align:right;">{fte:.2f}</td>\n'

            personnel_html += f'                        <td style="padding:8px;text-align:right;border-right:2px solid #0A2240;font-weight:bold;">{fmt_dollars(total_comp)}</td>\n'
            personnel_html += f'                    </tr>\n'

        # Personnel totals
        total_fte = personnel_totals.get("total_fte", 0)
        total_comp = personnel_totals.get("total_comp", 0)

        personnel_html += '                    <tr style="background-color:#f9f9f9;border-top:2px solid #0A2240;border-bottom:2px solid #0A2240;font-weight:bold;">\n'
        personnel_html += f'                        <td style="padding:8px;">TOTAL</td>\n'
        # Calculate totals by year from individual positions
        for year_idx in range(5):
            year_fte = sum(p.get("fte_by_year", [])[year_idx] if year_idx < len(p.get("fte_by_year", [])) else 0 for p in personnel)
            personnel_html += f'                        <td style="padding:8px;text-align:right;">{year_fte:.2f}</td>\n'
        personnel_html += f'                        <td style="padding:8px;text-align:right;border-right:2px solid #0A2240;">{fmt_dollars(total_comp)}</td>\n'
        personnel_html += '                    </tr>\n'

        personnel_html += '                </tbody>\n'
        personnel_html += '            </table>\n'
        personnel_html += '        </div>\n'

    # Key factors as info cards
    if factors:
        personnel_html += '        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:1rem;margin-top:1.5rem;">\n'

        factor_display = [
            ("Avg. Annual FTE", factors.get("fte", 0), lambda x: f"{x:.1f}"),
            ("Avg. COLA Rate", factors.get("cola_rate", 0), lambda x: f"{x:.1%}"),
            ("Avg. Indirect Rate", factors.get("indirect_rate", 0), lambda x: f"{x:.1%}"),
            ("Avg. Platform Maint.", factors.get("platform_maint", 0), fmt_dollars),
        ]

        for label, value, formatter in factor_display:
            try:
                formatted = formatter(value)
            except:
                formatted = str(value)

            personnel_html += f'            <div style="background-color:#f5f5f5;padding:1rem;border-radius:4px;border-left:4px solid #0A2240;">\n'
            personnel_html += f'                <div style="font-size:0.75rem;color:#666;text-transform:uppercase;font-weight:bold;margin-bottom:0.5rem;">{label}</div>\n'
            personnel_html += f'                <div style="font-size:1.3rem;font-weight:bold;color:#0A2240;">{formatted}</div>\n'
            personnel_html += f'            </div>\n'

        personnel_html += '        </div>\n'

    personnel_html += '    </div>\n'

    # ── Combine all sections ──
    budget_section = f'''<!-- Budget Section -->
    <div class="budget-section" style="background-color:#fafafa;padding:2rem;border-radius:8px;margin-bottom:2rem;">
        <h2>CPL Budget & Expenditure Plan</h2>
{funding_html}
{summary_html}
{detail_html}
{personnel_html}
    </div>
    <!-- End Budget Section -->'''

    return budget_section


def sync_goals_to_project_list(excel_file, workplan_goals):
    """
    Write annual workplan goal targets back into the Project List sheet.
    Maps each workplan activity (1.1–4.5) to the matching project row,
    writing the 2025-26 value to KPI Target 2026 (col T) and the
    Total/2030 value to KPI Target 2030 (col U).
    Opens a separate writable workbook to avoid data_only conflicts.
    """
    from openpyxl import load_workbook as _lwb
    wb_w = _lwb(excel_file)  # writable (preserves formulas)
    ws = wb_w["Project List"]

    # Build lookup: project ID → row number
    pid_rows = {}
    for r in range(4, ws.max_row + 1):
        pid = ws.cell(row=r, column=COL_ID).value
        if pid:
            pid_rows[str(pid).strip()] = r

    # Build workplan goal lookup by activity ID
    wg_by_id = {}
    for wg in workplan_goals:
        wg_by_id[wg["id"]] = wg

    updated = 0
    for act_id, wg in wg_by_id.items():
        row = pid_rows.get(act_id)
        if not row:
            continue

        goal_vals = wg.get("goal", [])
        goal_total = wg.get("goal_total", 0)
        stretch_vals = wg.get("stretch", [])
        stretch_total = wg.get("stretch_total", 0)

        # 2025-26 = first annual value (index 0)
        t2026 = goal_vals[0] if goal_vals else None
        # 2030 = total (for cumulative data, this is the last/final target)
        t2030 = goal_total

        if t2026 is not None:
            ws.cell(row=row, column=COL_KPI_G2526, value=t2026)
        if t2030:
            ws.cell(row=row, column=COL_KPI_G2930, value=t2030)
        updated += 1

    if updated:
        wb_w.save(excel_file)
        print(f"  Synced {updated} annual goals from workplan → Project List (cols T/U)")
    else:
        print("  No matching goals to sync")

    wb_w.close()


def main():
    if not os.path.exists(EXCEL_FILE):
        print(f"ERROR: Cannot find {EXCEL_FILE}")
        sys.exit(1)

    # Create a backup before reading (prevents data loss from corruption)
    backup_file = EXCEL_FILE + ".bak"
    try:
        import shutil
        shutil.copy2(EXCEL_FILE, backup_file)
    except Exception:
        pass  # non-critical

    print(f"Reading: {EXCEL_FILE}")

    # Archive current Project List notes to Update Log tab
    archive_updates_to_log(EXCEL_FILE)

    # Read all data from the Project List (single source of truth)
    wb = load_workbook(EXCEL_FILE, data_only=True)
    project_config  = read_project_config(wb)
    print(f"  Project: {project_config['title']} ({project_config['project_id']})")

    # Scan attachments folder (SharePoint sync or local)
    ATTACHMENTS_DIR = os.path.join(
        os.path.expanduser("~"),
        "Riverside Community College District",
        "California MAP Initiative - Documents",
        "CPL Workplan Dashboard",
        "Attachments",
    )
    _LOCAL_ATTACHMENTS = os.path.join(SCRIPT_DIR, "Attachments")
    att_dir = ATTACHMENTS_DIR if os.path.isdir(ATTACHMENTS_DIR) else _LOCAL_ATTACHMENTS
    # Will scan after projects are read (need project list for subfolder creation)
    projects        = read_projects(wb)
    update_log      = read_update_log(wb)
    budget          = read_budget_plan(wb)
    kpis            = compute_headline_kpis(projects, budget)
    activity_kpis   = build_activity_kpis(projects)

    # Build workplan goals & annual goals from the Project List tab
    # (no longer needs the old 'Annual Workplan Goals' sheet)
    workplan_goals, annual_goals = build_workplan_goals_from_projects(projects)

    # Auto-create attachment subfolders for new activities/projects
    new_folders = ensure_attachment_subfolders(att_dir, projects)
    if new_folders:
        print(f"  Created {new_folders} new attachment subfolder(s)")
    attachments = scan_attachments(att_dir)
    print(f"  Attachments: {attachments['total']} files, by activity: {attachments['by_activity']}")

    now             = datetime.now().strftime("%B %d, %Y")

    # ── Build custom KPI display order from column W if present ──
    # Map project IDs to headline KPI keys
    pid_to_kpi_key = {
        "3.1": "cumulative_students",
        "3.2": "eligible_units",
        "2.1": "credit_recommendations",
        "3.3": "active_colleges",
        "4.1a": "veteran_sprint",
    }
    proj_map_for_order = {p["id"]: p for p in projects}
    kpi_order_pairs = []  # (order_val, kpi_key)
    for pid, kpi_key in pid_to_kpi_key.items():
        p = proj_map_for_order.get(pid)
        if p and p.get("kpi_order") is not None:
            kpi_order_pairs.append((p["kpi_order"], kpi_key))
    if kpi_order_pairs:
        # Sort by order value, then append any keys not explicitly ordered
        kpi_order_pairs.sort(key=lambda x: x[0])
        kpi_display_order = [k for _, k in kpi_order_pairs]
        default_keys = ['cumulative_students', 'eligible_units', 'transcripted_units',
                        'credit_recommendations', 'map_exhibits', 'ccc_collaborative',
                        'active_colleges', 'articulation_colleges',
                        'estimated_savings', 'veteran_sprint', 'twenty_year_impact']
        for dk in default_keys:
            if dk not in kpi_display_order:
                kpi_display_order.append(dk)
        print(f"  Custom KPI display order from column W: {kpi_display_order}")
    else:
        kpi_display_order = None  # use default

    # Merge live dashboard metrics (population breakdowns) if available
    live_data = read_live_metrics()
    if live_data:
        kpis = merge_live_metrics(kpis, live_data)
        print(f"Merged live metrics from {live_data.get('scraped_at', 'unknown')}")
    else:
        print("No live_metrics.json found — using Excel data only")

    # Merge MAP Exhibit metrics (credit recommendations, exhibits, CCC Collaborative)
    exhibit_data = read_exhibit_metrics()
    if exhibit_data:
        kpis = merge_exhibit_metrics(kpis, exhibit_data)
        ds_list = exhibit_data.get('datasets_found', [])
        print(f"Merged exhibit metrics from {exhibit_data.get('source_file', 'unknown')} "
              f"({len(ds_list)} datasets, "
              f"{exhibit_data['total_credit_recs']:,} credit recs, "
              f"{exhibit_data['unique_exhibits']:,} exhibits, "
              f"{exhibit_data['ccc_collaborative']['adopting_colleges']} CCC Collaborative colleges)")
    else:
        print("No exhibit data found — skipping exhibit KPIs")

    data = {
        "last_updated": now,
        "data_as_of":   now,
        "kpis":         kpis,
        "activity_kpis": activity_kpis,
        "update_log":   update_log,
        "budget":       budget,
        "vision2030": {
            "actions": [
                {"id": "Action 1a", "desc": "Scale CPL opportunities with focus on military service, apprenticeships, and technical industry certifications."},
                {"id": "Action 5", "desc": "Provide flexible course scheduling and CPL opportunities to optimize working learners' abilities to reach educational goals."},
            ],
            "goals": [
                {
                    "id": "Goal 1",
                    "name": "Expand Equitable Access & Boost Student Success",
                    "target": "250,000 Californians by 2030",
                    "progress": 17,
                    "current": f"{kpis['cumulative_students']['value']} cumulative students",
                },
                {
                    "id": "Goal 2",
                    "name": "Build Unified, Interoperable, Student-Centered System",
                    "target": "CPL embedded in outreach, onboarding, advising",
                    "progress": 55,
                    "current": "MAP at 116 colleges; Dashboard live; Portal launching",
                },
                {
                    "id": "Goal 3",
                    "name": "Sustainable Policies, Resources & Professional Learning",
                    "target": "Faculty-driven policies; ongoing PD; scalable tools",
                    "progress": 60,
                    "current": "AB 123 chaptered; $20M allocated; 1,000+ trained",
                },
            ],
        },
        "projects": projects,
        "workplan_goals": workplan_goals,
    }

    js_content = (
        "/*\n"
        " * CPL Initiative Dashboard -- Live Data File\n"
        " * Auto-generated by excel_to_dashboard.py on " + now + "\n"
        " * Source: CPL_Initiative_Project_List.xlsx\n"
        " *\n"
        " * Includes:\n"
        " *   - 6 headline KPIs (derived from sub-activity data)\n"
        " *   - 19 activity-level KPI cards grouped by Activity 1-4\n"
        " *   - {KPI} token substitution in project text fields\n"
        " *   - Budget data from 5-year plan\n"
        " *   - Vision 2030 alignment\n"
        " */\n\n"
        "window.CPL_DATA = " + json.dumps(data, indent=2, ensure_ascii=False) + ";\n"
    )

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(js_content)

    # ── Write statewide exhibit data as separate JS for interactive card ──
    exhibit_tables = build_exhibit_analysis_tables(exhibit_data) if exhibit_data else None
    if exhibit_tables and exhibit_tables.get("statewide_adoption"):
        sw_js_path = os.path.join(SCRIPT_DIR, "statewide_data.js")
        sw_data = {
            "exhibits": exhibit_tables["statewide_adoption"],
            "analysis": {
                "by_college": exhibit_tables["by_college"],
                "by_discipline": exhibit_tables["by_discipline"],
                "by_cpl_type": exhibit_tables["by_cpl_type"],
                "by_mode_of_learning": exhibit_tables["by_mode_of_learning"],
                "collaborative_analysis": exhibit_tables["collaborative_analysis"],
                "top_exhibits": exhibit_tables["top_exhibits"],
            },
            "generated_at": exhibit_tables.get("generated_at", ""),
            "total_credit_recs": exhibit_tables.get("total_credit_recs", 0),
        }
        sw_js = ("/* Statewide Exhibit Adoption Data — auto-generated */\n"
                 "window.CPL_STATEWIDE = " + json.dumps(sw_data, indent=2, ensure_ascii=False) + ";\n")
        with open(sw_js_path, "w", encoding="utf-8") as f:
            f.write(sw_js)
        print(f"  Exported statewide data to {sw_js_path} ({len(exhibit_tables['statewide_adoption'])} exhibits)")

    # ── Inject data inline AND render static HTML into the dashboard ──
    if os.path.exists(HTML_FILE):
        with open(HTML_FILE, "r", encoding="utf-8") as f:
            html = f.read()

        # ── Update dashboard title from project config ──
        proj_title = project_config.get("title", "CPL Initiative")
        proj_desc = project_config.get("description", "")
        attach_url = project_config.get("attachments_url", "")
        dash_title = f"{proj_title} &mdash; Project Dashboard"

        # Replace <title> tag
        import re
        html = re.sub(r'<title>[^<]*</title>', f'<title>{proj_title} — Project Dashboard</title>', html)
        # Replace <h1> in header
        html = re.sub(
            r'<h1>[^<]*</h1>',
            f'<h1>{proj_title} &mdash; Project Dashboard</h1>',
            html,
            count=1
        )
        # Remove any previously injected description/attachment block
        PROJ_INFO_START = '<!-- PROJ-INFO-START -->'
        PROJ_INFO_END = '<!-- PROJ-INFO-END -->'
        pi_start = html.find(PROJ_INFO_START)
        pi_end = html.find(PROJ_INFO_END)
        if pi_start != -1 and pi_end != -1:
            html = html[:pi_start] + html[pi_end + len(PROJ_INFO_END):]

        # Build description (collapsible, default collapsed) + See Attachments block
        proj_info_parts = [PROJ_INFO_START]
        if proj_desc:
            # Use full description in a collapsible <details> element
            escaped_desc = proj_desc.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            proj_info_parts.append(
                f'<details class="project-description" style="max-width:800px;margin:0.4rem auto 0;'
                f'cursor:pointer;">'
                f'<summary style="font-size:0.82rem;color:#9BBCD8;font-weight:600;'
                f'list-style:none;display:inline-flex;align-items:center;gap:0.3rem;">'
                f'<span class="desc-arrow" style="font-size:0.7rem;transition:transform 0.2s;">&#9654;</span>'
                f' Project Description</summary>'
                f'<div style="font-size:0.82rem;color:#ccc;line-height:1.5;'
                f'margin-top:0.4rem;padding:0.5rem 0.8rem;'
                f'border-left:2px solid rgba(155,188,216,0.3);text-align:left;">'
                f'{escaped_desc}</div></details>'
                f'<style>.project-description[open] .desc-arrow{{transform:rotate(90deg);}}</style>')
        att_count = attachments.get("total", 0)
        badge_html = (f' <span style="background:#C9A84C;color:#0A2240;font-size:0.65rem;'
                      f'font-weight:700;padding:1px 6px;border-radius:8px;margin-left:4px;">'
                      f'{att_count}</span>') if att_count > 0 else ''
        proj_info_parts.append(
            f'<div style="margin-top:0.5rem;">'
            f'<a href="#" class="attach-btn" target="_blank" '
            f'style="display:inline-flex;align-items:center;gap:0.3rem;'
            f'font-size:0.82rem;color:#fff;text-decoration:none;font-weight:600;'
            f'padding:6px 14px;border:1px solid rgba(255,255,255,0.3);border-radius:4px;'
            f'background:rgba(255,255,255,0.1);cursor:pointer;transition:background 0.2s;"'
            f' onmouseover="this.style.background=\'rgba(255,255,255,0.2)\'"'
            f' onmouseout="this.style.background=\'rgba(255,255,255,0.1)\'"'
            f' title="Open SharePoint folder — use Upload or drag &amp; drop to add files">'
            f'&#128206; See Attachments{badge_html}</a></div>')
        proj_info_parts.append(PROJ_INFO_END)
        proj_info_html = '\n        '.join(proj_info_parts)

        # Insert after the subtitle div
        subtitle_end = html.find('</div>', html.find('class="subtitle"'))
        if subtitle_end != -1:
            insert_pos = subtitle_end + len('</div>')
            html = html[:insert_pos] + '\n        ' + proj_info_html + html[insert_pos:]

        print(f"  Updated dashboard title: {proj_title}")

        # ── Inject attachments URL from Excel config into JS global ──
        att_script_marker = '<script src="dashboard_filters.js">'
        att_script_pos = html.find(att_script_marker)
        if att_script_pos != -1 and attach_url:
            escaped_url = attach_url.replace("'", "\\'")
            inject_js = f"<script>window.CPL_ATTACHMENTS_URL='{escaped_url}';</script>\n    "
            # Remove any previously injected CPL_ATTACHMENTS_URL script
            old_marker = "<script>window.CPL_ATTACHMENTS_URL="
            old_pos = html.find(old_marker)
            if old_pos != -1:
                old_end = html.find("</script>", old_pos) + len("</script>")
                html = html[:old_pos] + html[old_end:].lstrip()
                att_script_pos = html.find(att_script_marker)
            html = html[:att_script_pos] + inject_js + html[att_script_pos:]
            print(f"  Injected attachments URL from Excel config")

        # ── Inject statewide interactive scripts (college_lookup, statewide_data, statewide_interactive) ──
        sw_scripts = [
            '<script src="docx.min.js"></script>',
            '<script src="college_lookup.js"></script>',
            '<script src="statewide_data.js"></script>',
            '<script src="statewide_interactive.js"></script>',
        ]
        # Remove any existing statewide script tags first to guarantee correct order
        for sw_tag in sw_scripts:
            html = html.replace('    ' + sw_tag + '\n', '')
        # Insert all in order before </body>
        body_end = html.rfind('</body>')
        if body_end == -1:
            body_end = len(html)
        block = ''.join('    ' + t + '\n' for t in sw_scripts)
        html = html[:body_end] + block + html[body_end:]
        print("  Ensured statewide interactive script tags present (correct order)")

        START_MARKER = "<!-- DATA-START"
        END_MARKER   = "<!-- DATA-END -->"
        i_start = html.find(START_MARKER)
        i_end   = html.find(END_MARKER)

        # ── Self-heal: if DATA-END is missing (file truncated), rebuild from DATA-START ──
        if i_start != -1 and i_end == -1:
            print("  DATA-END marker missing (file truncated) — rebuilding from DATA-START")
            html = html[:i_start]  # discard everything from DATA-START onwards
            # Re-add both markers with minimal content (will be replaced below)
            html += "<!-- DATA-START (auto-replaced by excel_to_dashboard.py — do not edit manually) -->\n"
            html += "    <!-- DATA-END -->\n</body>\n</html>\n"
            i_start = html.find(START_MARKER)
            i_end = html.find(END_MARKER)

        if i_start != -1 and i_end != -1:
            # ── Filter JS is now in external file dashboard_filters.js ──
            # (loaded via <script src="dashboard_filters.js"> in the HTML template)
            # No injection needed — just clean up any old FILTER-JS blocks
            FILTER_START = "<!-- FILTER-JS-START -->"
            FILTER_END   = "<!-- FILTER-JS-END -->"
            fj_start = html.find(FILTER_START)
            fj_end = html.find(FILTER_END)
            if fj_start != -1 and fj_end != -1:
                html = html[:fj_start] + html[fj_end + len(FILTER_END):]
                print("  Removed old inline FILTER-JS block (now external file)")

            # ── Inject data inline (DATA-START block — bottom of file, OK if truncated) ──
            inline_block = (
                "<!-- DATA-START (auto-replaced by excel_to_dashboard.py — do not edit manually) -->\n"
                "    <script>\n"
                "    window.CPL_DATA = " + json.dumps(data, indent=2, ensure_ascii=False) + ";\n"
                "    </script>\n"
                "    "
            )
            html = html[:i_start] + inline_block + html[i_end:]

            # ── Replace the KPI Summary Cards section with fully rendered static HTML ──
            kpi_section_start = html.find('<!-- KPI Summary Cards -->')
            kpi_section_end = html.find('<!-- Filter Bar -->')
            if kpi_section_start != -1 and kpi_section_end != -1:
                kpi_cards_html = render_kpi_section_html(kpis, kpi_display_order)
                new_kpi_section = (
                    '<!-- KPI Summary Cards -->\n'
                    '    <div class="kpi-section">\n'
                    + kpi_cards_html +
                    '    </div>\n\n    '
                )
                html = html[:kpi_section_start] + new_kpi_section + html[kpi_section_end:]
                print("  Rendered static KPI cards with breakdowns")

            # ── Inject Exhibit Analysis section (toggle button + scrollable cards) ──
            exhibit_tables = build_exhibit_analysis_tables(exhibit_data) if exhibit_data else None
            if exhibit_tables:
                exhibit_html = render_exhibit_analysis_html(exhibit_tables)
                # Add toggle button after KPI section, before Filter Bar
                toggle_btn = (
                    '\n    <div style="text-align:center;">'
                    '<button class="exhibit-toggle-btn" onclick="'
                    "var s=document.getElementById('exhibitAnalysisSection');"
                    "s.classList.toggle('visible');"
                    "this.textContent=s.classList.contains('visible')?'Hide Detailed Articulation Data':'Show Detailed Articulation Data';"
                    '">Show Detailed Articulation Data</button></div>\n\n    '
                )
                # Insert toggle + analysis section before the Filter Bar
                filter_marker = '<!-- Filter Bar -->'
                filter_pos = html.find(filter_marker)
                if filter_pos != -1:
                    html = html[:filter_pos] + toggle_btn + exhibit_html + '\n    ' + html[filter_pos:]
                    print(f"  Injected exhibit analysis section ({len(exhibit_tables['by_college'])} college cards, "
                          f"{len(exhibit_tables['top_exhibits'])} top exhibits)")

                # Inject CSS before closing </style> tag
                style_end = html.find('</style>')
                if style_end != -1:
                    html = html[:style_end] + '\n' + EXHIBIT_ANALYSIS_CSS + '\n' + html[style_end:]

            # ── Replace the Activity KPI section with fully rendered static HTML ──
            act_section_start = html.find('<div class="activity-kpi-section" id="activityKpiSection">')
            act_section_end_tag = '</div>\n\n        <!-- Projects Grid -->'
            act_section_end = html.find('<!-- Projects Grid -->')
            if act_section_start != -1 and act_section_end != -1:
                act_html = render_activity_kpis_html(activity_kpis, annual_goals, update_log, attachments=attachments)
                new_act_section = (
                    '<div class="activity-kpi-section" id="activityKpiSection">\n'
                    + act_html +
                    '        </div>\n\n        '
                )
                html = html[:act_section_start] + new_act_section + html[act_section_end:]
                print(f"  Rendered static activity KPI cards ({sum(len(g['kpis']) for g in activity_kpis)} sub-activities)")

            # ── Inject the Annual Workplan Goals section before Projects Grid ──
            workplan_goals_html = render_workplan_goals_html(workplan_goals)
            if workplan_goals_html:
                # Insert before the Projects Grid marker
                wg_marker = '<!-- Projects Grid -->'
                wg_pos = html.find(wg_marker)
                if wg_pos != -1:
                    # Add a section marker for future updates
                    wrapped = ('<!-- Annual Workplan Goals -->\n'
                               + workplan_goals_html
                               + '        <!-- End Annual Workplan Goals -->\n\n        ')
                    # Check if there's already an Annual Workplan Goals section to replace
                    awg_start = html.find('<!-- Annual Workplan Goals -->')
                    awg_end = html.find('<!-- End Annual Workplan Goals -->')
                    if awg_start != -1 and awg_end != -1:
                        html = html[:awg_start] + wrapped + html[awg_end + len('<!-- End Annual Workplan Goals -->'):].lstrip('\n')
                        print(f"  Replaced Annual Workplan Goals section ({len(workplan_goals)} activities)")
                    else:
                        html = html[:wg_pos] + wrapped + html[wg_pos:]
                        print(f"  Injected Annual Workplan Goals section ({len(workplan_goals)} activities)")

            # ── Replace the Projects Grid with fully rendered static HTML ──
            proj_grid_start = html.find('<!-- Projects Grid -->')
            proj_grid_end = html.find('<!-- Budget Section -->')
            if proj_grid_start != -1 and proj_grid_end != -1:
                proj_cards_html = render_projects_grid_html(projects, update_log, attachments=attachments)
                project_count = len([p for p in projects if not p["id"].startswith("D.")])

                # Build the Workplan Progress Chart with sub-population trend lines
                current_students = kpis.get("cumulative_students", {}).get("value", "43,321")
                # Extract sub-population breakdowns from headline KPIs
                bd_list = kpis.get("cumulative_students", {}).get("breakdowns", [])
                sub_pops = {}
                for bd in bd_list:
                    lbl = bd.get("label", "").lower()
                    if "military" in lbl:
                        sub_pops["military"] = bd.get("value", "")
                    elif "workforce" in lbl or "other" in lbl:
                        sub_pops["workforce"] = bd.get("value", "")
                    elif "apprentice" in lbl:
                        sub_pops["apprentice"] = bd.get("value", "")
                charts_html = render_workplan_charts_html(current_students, sub_pops, workplan_goals)

                new_proj_section = (
                    '<!-- Projects Grid -->\n'
                    + charts_html +
                    '        <h2 style="margin-bottom:1.5rem;">Projects <span id="projectCount" style="font-size:0.9rem;color:#888;">(' + str(project_count) + ')</span></h2>\n'
                    '        <div id="projectsGrid">\n'
                    + proj_cards_html +
                    '        </div>\n\n        '
                )
                html = html[:proj_grid_start] + new_proj_section + html[proj_grid_end:]
                print(f"  Rendered static project cards ({project_count} projects, grouped by Goal)")
                print("  Rendered Workplan Progress Chart (3 trend lines)")

            # ── Render and inject the Budget section ──
            budget_section_start = html.find('<!-- Budget Section -->')
            budget_section_end = html.find('<!-- End Budget Section -->')
            budget_html = render_budget_html(budget)

            if budget_section_start != -1 and budget_section_end != -1:
                # Replace existing rendered budget section
                html = html[:budget_section_start] + budget_html + html[budget_section_end + len('<!-- End Budget Section -->'):]
                print("  Injected Budget section")
            elif budget_section_start != -1:
                # First run: replace old static budget through Vision 2030 marker
                v2030_marker = html.find('<!-- Vision 2030 Section -->', budget_section_start)
                if v2030_marker != -1:
                    html = html[:budget_section_start] + budget_html + '\n\n        ' + html[v2030_marker:]
                else:
                    html = html[:budget_section_start] + budget_html + html[budget_section_start:]
                print("  Injected Budget section")

            # ── Populate the Lead filter dropdown with unique leads ──
            leads = sorted(set(p.get("lead", "") for p in projects if p.get("lead") and not p["id"].startswith("D.")))
            lead_options = '<option value="">All</option>\n'
            for lead in leads:
                lead_options += f'                <option value="{lead}">{lead}</option>\n'
            html = re.sub(
                r'(<select id="filterLead">)\s*<option value="">All</option>\s*(</select>)',
                r'\1\n                ' + lead_options + r'            \2',
                html,
                flags=re.DOTALL
            )

            # ── Update the last-updated timestamp ──
            html = re.sub(
                r'(<div class="last-updated">)Last Updated:.*?(</div>)',
                r'\1Last Updated: ' + data["last_updated"] + r'\2',
                html
            )

            # ── Update footer date ──
            html = re.sub(
                r'(<span id="footerDate">).*?(</span>)',
                r'\1' + data["last_updated"] + r'\2',
                html
            )

            # ── Inject Annual Workplan Goals table before Vision 2030 ──
            if annual_goals:
                goals_table_html = render_annual_goals_table_html(annual_goals)
                # Insert before the Vision 2030 section
                v2030_insert = html.find('<!-- Vision 2030 Section -->')
                if v2030_insert == -1:
                    # If Vision 2030 section is missing, insert before DATA-START
                    v2030_insert = html.find('<!-- DATA-START')
                if v2030_insert != -1:
                    # Remove any existing annual goals table first
                    ag_start = html.find('<!-- Annual Workplan Goals -->')
                    ag_end = html.find('<!-- End Annual Workplan Goals -->')
                    if ag_start != -1 and ag_end != -1:
                        html = html[:ag_start] + html[ag_end + len('<!-- End Annual Workplan Goals -->'):]
                        v2030_insert = html.find('<!-- Vision 2030 Section -->')
                        if v2030_insert == -1:
                            v2030_insert = html.find('<!-- DATA-START')
                    wrapped = '<!-- Annual Workplan Goals -->\n' + goals_table_html + '        <!-- End Annual Workplan Goals -->\n\n        '
                    html = html[:v2030_insert] + wrapped + html[v2030_insert:]
                    print(f"  Rendered Annual Workplan Goals table ({len(annual_goals)} rows)")

            # ── Rebuild the Vision 2030 section with updated goal data ──
            v2030_start = html.find('<!-- Vision 2030 Section -->')
            # Find the DATA-START marker (which may be embedded in the truncated V2030 section)
            data_start_marker = html.find('<!-- DATA-START')
            if v2030_start != -1 and data_start_marker != -1:
                # Use live KPI data for progress calculations
                recs_val = int(str(kpis.get("credit_recommendations", {}).get("value", "576")).replace(",", ""))
                students_val = int(str(kpis.get("cumulative_students", {}).get("value", "42620")).replace(",", ""))
                colleges_val = int(str(kpis.get("active_colleges", {}).get("value", "84")).replace(",", ""))
                recs_pct = round(recs_val / 1000 * 100, 1)
                students_pct = round(students_val / 250000 * 100, 1)

                new_v2030 = f'''<!-- Vision 2030 Section -->
        <div class="vision-section">
            <h2>Vision 2030 Alignment</h2>

            <div class="vision-grid">
                <div class="vision-card">
                    <h3>Vision 2030 Action 1a</h3>
                    <p>Develop infrastructure to ensure that multiple pathways to a baccalaureate degree are available to all students, including completion via the community college system, including expansion of CPL and credential recognition.</p>
                </div>

                <div class="vision-card">
                    <h3>Vision 2030 Action 5</h3>
                    <p>Advance equitable and transparent credentialing systems within and across the California higher education systems that recognize both traditional and competency-based learning.</p>
                </div>

                <div class="vision-card">
                    <h3 style="color:#C9A84C;">{CPL_GOALS["Goal 1"]["title"]}</h3>
                    <p style="font-size:0.85rem;">{CPL_GOALS["Goal 1"]["target"]}</p>
                    <ul style="font-size:0.82rem;color:#555;margin:0.3rem 0 0.5rem 1.2rem;padding:0;">'''
                for b in CPL_GOALS["Goal 1"]["bullets"]:
                    new_v2030 += f'\n                        <li style="margin-bottom:0.2rem;">{b}</li>'
                new_v2030 += f'''
                    </ul>
                    <div class="goal-progress">
                        <div class="goal-progress-bar">
                            <div class="goal-progress-fill" style="width:{recs_pct}%;"></div>
                        </div>
                        <span style="font-weight:600;">Credit Recs: {recs_pct}% ({fmt_number(recs_val)}/1,000) &nbsp;|&nbsp; Students: {students_pct}% ({fmt_number(students_val)}/250,000)</span>
                    </div>
                </div>

                <div class="vision-card">
                    <h3 style="color:#C9A84C;">{CPL_GOALS["Goal 2"]["title"]}</h3>
                    <p style="font-size:0.85rem;">{CPL_GOALS["Goal 2"]["target"]}</p>
                    <ul style="font-size:0.82rem;color:#555;margin:0.3rem 0 0.5rem 1.2rem;padding:0;">'''
                for b in CPL_GOALS["Goal 2"]["bullets"]:
                    new_v2030 += f'\n                        <li style="margin-bottom:0.2rem;">{b}</li>'
                new_v2030 += f'''
                    </ul>
                    <div class="goal-progress">
                        <div class="goal-progress-bar">
                            <div class="goal-progress-fill" style="width:{min(colleges_val / 116 * 100, 100):.1f}%;"></div>
                        </div>
                        <span style="font-weight:600;">Active Colleges: {colleges_val} of 116 ({colleges_val / 116 * 100:.0f}%)</span>
                    </div>
                </div>

                <div class="vision-card">
                    <h3 style="color:#C9A84C;">{CPL_GOALS["Goal 3"]["title"]}</h3>
                    <p style="font-size:0.85rem;">{CPL_GOALS["Goal 3"]["target"]}</p>
                    <ul style="font-size:0.82rem;color:#555;margin:0.3rem 0 0.5rem 1.2rem;padding:0;">'''
                for b in CPL_GOALS["Goal 3"]["bullets"]:
                    new_v2030 += f'\n                        <li style="margin-bottom:0.2rem;">{b}</li>'
                new_v2030 += '''
                    </ul>
                    <div class="goal-progress">
                        <div class="goal-progress-bar">
                            <div class="goal-progress-fill" style="width:65%;"></div>
                        </div>
                        <span style="font-weight:600;">1,000+ trained; $5M ongoing secured; Title 5 updates advancing</span>
                    </div>
                </div>
            </div>
        </div>

        '''
                html = html[:v2030_start] + new_v2030 + html[data_start_marker:]
                print("  Rebuilt Vision 2030 section with updated CPL Goal data")

            # ── Remove the old standalone applyFilters script block if present ──
            # (now injected via DATA-START block instead)
            old_filter_start = html.find('// ── Filter & Search for Project Cards ──')
            if old_filter_start != -1:
                # Find the <script> tag before it and </script> tag after
                script_open = html.rfind('<script>', 0, old_filter_start)
                script_close = html.find('</script>', old_filter_start)
                if script_open != -1 and script_close != -1:
                    html = html[:script_open] + html[script_close + len('</script>'):]
                    print("  Removed old standalone applyFilters script block")

            # ── Ensure proper closing tags (survives Cowork sync truncation) ──
            closing_tags = "\n</body>\n</html>\n"
            # Strip any existing closing tags to avoid duplicates
            html = html.rstrip()
            for tag in ['</html>', '</body>']:
                if html.endswith(tag):
                    html = html[:html.rfind(tag)].rstrip()
            html += closing_tags

            with open(HTML_FILE, "w", encoding="utf-8") as f:
                f.write(html)
            print(f"Injected data inline into {HTML_FILE}")
        else:
            print(f"WARNING: DATA-START/DATA-END markers not found in {HTML_FILE}")
            print("  The HTML will not update. Re-add the markers between <!-- DATA-START --> and <!-- DATA-END -->.")
    else:
        print(f"WARNING: {HTML_FILE} not found — skipping inline injection.")

    # ── Summary ──
    print(f"\nExported {len(projects)} projects to {OUTPUT_FILE}")
    print(f"Headline KPIs: Students={kpis['cumulative_students']['value']}, "
          f"Units={kpis['transcripted_units']['value']}, "
          f"Recs={kpis['credit_recommendations']['value']}, "
          f"Colleges={kpis['active_colleges']['value']}")
    for grp in activity_kpis:
        print(f"  {grp['activity_id']}: {len(grp['kpis'])} sub-activity KPIs")

    # Check for {KPI} tokens that weren't substituted (debugging aid)
    unresolved = [p["id"] for p in projects if "{KPI}" in p["desc"] or "{KPI}" in p["update"] or "{KPI}" in p["milestones"]]
    if unresolved:
        print(f"\nWARNING: {len(unresolved)} project(s) still contain unresolved {{KPI}} tokens: {unresolved}")
        print("  These projects have {KPI} in their text but no KPI Metric value in column R.")
    else:
        print("\nAll {KPI} tokens resolved successfully.")

    # ── Generate Word reports ──
    import subprocess
    report_script = os.path.join(SCRIPT_DIR, "generate_reports.js")
    if os.path.exists(report_script):
        try:
            result = subprocess.run(
                ["node", report_script],
                capture_output=True, text=True, timeout=60, cwd=SCRIPT_DIR
            )
            if result.returncode == 0:
                for line in result.stdout.strip().split("\n"):
                    print(line)
            else:
                print(f"  Report generation warning: {result.stderr.strip()}")
        except Exception as e:
            print(f"  (Skipping report generation: {e})")

    print("Done! Refresh CPL_Dashboard.html in your browser to see changes.")


if __name__ == "__main__":
    main()
