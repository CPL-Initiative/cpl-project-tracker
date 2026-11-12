#!/usr/bin/env python3
"""chatbox/sync_chatbox_exhibits.py: refresh Supabase `chatbox_exhibits` from the daily MAP pull.

WHY: `chatbox_exhibits` was loaded once (about May 2026) and never refreshed.
Sierra searches it and the funding model's noncredit exhibit count reads it
(kb/supabase_cpl_funding_nc_counts.sql). On 2026-11-12 Malone found Las Positas
at 9 noncredit exhibits on the public funding page against 47 in MAP: 30 were
not in the table and it carried no mode of learning. This runs in the daily
build, before the funding actuals, so both read today's exhibits.

INPUT   CustomReport_latest.json (View_ArticulatedMAPExhibits_APIDataset), the
        transient daily pull; TOP_Code_Lookup.xlsx for the discipline.
OUTPUT  one row per (Articulation College, Exhibit Title), the table's own grain
        (its unique key), staged in chunks and promoted in one transaction by
        chatbox_exhibits_promote(), which refuses a short pull
        (kb/migrations/2026-11-12_chatbox_exhibits_refresh.sql).

No PII: exhibit catalog rows only. Prints counts.

Usage:
  python3 chatbox/sync_chatbox_exhibits.py [CustomReport_latest.json]            # dry run: counts, no write
  python3 chatbox/sync_chatbox_exhibits.py [CustomReport_latest.json] --apply    # write (SUPABASE_SERVICE_KEY)
  ... --out FILE   also write the rows to FILE (tests)
"""
import collections
import json
import os
import sys
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VIEW = "View_ArticulatedMAPExhibits_APIDataset"
SUPABASE_URL = "https://hvuwhnbuahrtptokpqfh.supabase.co"
CHUNK = 1000        # rows per staging request (the 8 s PostgREST limit: sync_coci_offerings.py)
MIN_CHUNK = 250
SAMPLE = 5          # sample_courses / sample_credit_recs keep five, as the first load did
COURSES_CAP = 120   # every target course, bounded
MIN_ROWS = 2000     # the same floor chatbox_exhibits_promote() holds
# excel_to_dashboard.py's _TEST_COLLEGES: MAP's sandbox colleges never reach Sierra.
TEST_COLLEGES = {"RivTest City College", "MorTest City College", "Nortest City College",
                 "CA MAP INITIATIVE COLLEGE", "RivTest", "MorTest", "Nortest"}


def load_top_disciplines(path=None):
    """MAP's integer TOP id -> CCC discipline title (TOP_Code_Lookup.xlsx, the
    lookup excel_to_dashboard.py reads). Missing workbook -> {} and no discipline."""
    path = path or os.path.join(ROOT, "TOP_Code_Lookup.xlsx")
    if not os.path.exists(path):
        return {}
    from openpyxl import load_workbook
    ws = load_workbook(path, data_only=True, read_only=True)["TOP Code Lookup"]
    out = {}
    for row in ws.iter_rows(min_row=2, max_col=3, values_only=True):
        if row[0] is not None and row[2]:
            out[str(row[0]).strip()] = str(row[2]).strip()
    return out


def collab_label(raw):
    """The table's four values. A blank Collaborative Type is a college's own exhibit."""
    raw = (raw or "").strip()
    if "CCC" in raw:
        return "CCC"
    if "industry" in raw.lower():
        return "Industry"
    return "Other" if raw else "Local"


def _most_common(values):
    values = [v for v in values if v]
    return collections.Counter(values).most_common(1)[0][0] if values else None


def _distinct(values, cap):
    seen, out = set(), []
    for v in values:
        if v and v not in seen:
            seen.add(v)
            out.append(v)
            if len(out) >= cap:
                break
    return out


def build_rows(report, disciplines=None):
    """The exhibit view -> one row per (Articulation College, Exhibit Title)."""
    disciplines = disciplines or {}
    ds = next((r for r in report if r.get("viewName") == VIEW), None)
    if not ds:
        raise SystemExit(f"{VIEW} is not in this pull")
    cm = {c: i for i, c in enumerate(ds.get("columnName") or [])}
    need = ["Exhibit Title", "Articulation College", "ExhibitID", "Course"]
    missing = [c for c in need if c not in cm]
    if missing:
        raise SystemExit(f"{VIEW} is missing columns: {missing}")

    def cell(row, name):
        i = cm.get(name)
        v = row[i] if i is not None and i < len(row) else None
        return str(v).strip() if v is not None else ""

    groups = collections.OrderedDict()
    for row in ds.get("columnValue") or []:
        college = cell(row, "Articulation College")
        title = cell(row, "Exhibit Title")
        if not college or not title or college in TEST_COLLEGES:
            continue
        groups.setdefault((college, title), []).append(row)

    rows = []
    for (college, title), grp in groups.items():
        top = next((cell(r, "TOP Code") for r in grp if cell(r, "TOP Code")), "")
        ids = sorted({cell(r, "ExhibitID") for r in grp if cell(r, "ExhibitID")})
        courses = [cell(r, "Course") for r in grp]
        rows.append({
            "college": college,
            "exhibit_title": title,
            "exhibit_id": ids[0] if ids else None,
            "cpl_type": _most_common(cell(r, "CPL Type Description") for r in grp) or "Other",
            "collaborative_type": collab_label(_most_common(cell(r, "Collaborative Type") for r in grp)),
            "top_code": top,
            "rec_count": len(grp),
            "sample_courses": _distinct(courses, SAMPLE),
            "sample_credit_recs": _distinct((cell(r, "Credit Recommendation") for r in grp), SAMPLE),
            "discipline": disciplines.get(top) or None,
            "learning_mode": _most_common(cell(r, "CPL Mode of Learning") for r in grp),
            "courses": sorted(_distinct(courses, COURSES_CAP)),
        })
    return rows


def summarize(rows):
    modes = collections.Counter(r["learning_mode"] or "(none)" for r in rows)
    nc = [r for r in rows if (r["learning_mode"] or "").rstrip().endswith("(N)")]
    return {"rows": len(rows), "colleges": len({r["college"] for r in rows}),
            "noncredit_mode_rows": len(nc), "noncredit_mode_colleges": len({r["college"] for r in nc}),
            "with_mode": len(rows) - modes.get("(none)", 0)}


class _RpcError(Exception):
    def __init__(self, fn, code, detail):
        super().__init__(f"Supabase RPC {fn} -> HTTP {code}: {detail}")
        self.fn, self.code, self.detail = fn, code, detail


def _is_statement_timeout(err):
    return '"57014"' in err.detail or "statement timeout" in err.detail


def _sb_rpc(fn, body, key, urlopen=None):
    urlopen = urlopen or urllib.request.urlopen
    url = os.environ.get("SUPABASE_URL", SUPABASE_URL)
    req = urllib.request.Request(
        f"{url}/rest/v1/rpc/{fn}", data=json.dumps(body).encode("utf-8"), method="POST",
        headers={"apikey": key, "Authorization": f"Bearer {key}",
                 "Content-Type": "application/json", "Accept": "application/json"})
    try:
        with urlopen(req, timeout=180) as resp:
            raw = resp.read()
        return json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        detail = ""
        try:
            detail = e.read().decode("utf-8", "replace")[:400]
        except Exception:
            pass
        raise _RpcError(fn, e.code, detail)


def stage(rows, key, rpc=_sb_rpc, chunk=CHUNK):
    """Stage every row; the first chunk empties staging. A canceled chunk retries
    at half the size. Returns the rows staged."""
    total, i, size, truncate = 0, 0, chunk, True
    while i < len(rows):
        part = rows[i:i + size]
        try:
            n = rpc("chatbox_exhibits_stage", {"p_rows": part, "p_truncate": truncate}, key)
        except _RpcError as e:
            if _is_statement_timeout(e) and size > MIN_CHUNK:
                size = max(MIN_CHUNK, size // 2)
                continue
            raise
        total += n or 0
        i += len(part)
        truncate = False
    return total


def main(argv):
    args = [a for a in argv[1:] if not a.startswith("--")]
    out = argv[argv.index("--out") + 1] if "--out" in argv else None
    if out in args:
        args.remove(out)
    src = args[0] if args else os.path.join(ROOT, "CustomReport_latest.json")
    if not os.path.exists(src):
        print(f"chatbox-exhibits: {src} not found; the live table stands.")
        return 0
    with open(src, encoding="utf-8") as f:
        report = json.load(f)
    rows = build_rows(report, load_top_disciplines())
    s = summarize(rows)
    print(f"chatbox-exhibits: {s['rows']} rows at {s['colleges']} colleges; "
          f"{s['with_mode']} carry a mode of learning; "
          f"{s['noncredit_mode_rows']} Noncredit (N) at {s['noncredit_mode_colleges']} colleges.")
    if out:
        with open(out, "w", encoding="utf-8") as f:
            json.dump(rows, f, ensure_ascii=False)
    if "--apply" not in argv:
        print("chatbox-exhibits: dry run (pass --apply to write).")
        return 0
    if s["rows"] < MIN_ROWS:
        print(f"chatbox-exhibits: only {s['rows']} rows (a fallback pull?); the live table stands.")
        return 0
    key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not key:
        print("chatbox-exhibits: SUPABASE_SERVICE_KEY unset; the live table stands.")
        return 0
    staged = stage(rows, key)
    print(f"chatbox-exhibits: staged {staged} rows.")
    result = _sb_rpc("chatbox_exhibits_promote", {"p_expected": len(rows)}, key)
    print(f"chatbox-exhibits: promoted {json.dumps(result)}")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main(sys.argv))
    except _RpcError as e:
        raise SystemExit(f"chatbox-exhibits: {e}")
