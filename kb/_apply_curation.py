"""
Sync human curation edits from Supabase into the git-canonical overlay:
  Supabase public.kb_curation  ->  kb/coci_curation.json

The dashboard's "Unified Courses" tab lets allowed reviewers assign disciplines
(and later other fields) where blank; those edits are written to Supabase. This
script pulls them and writes the overlay file, which excel_to_dashboard.py applies
on top of the AI-drafted coci_* files (regen-safe). Commit the overlay to git so
it is the canonical record of human curation.

Auth: uses the SERVICE-ROLE key (bypasses RLS) — keep it secret. NEVER put it in
the dashboard page; only here, from the environment.

Env:
  SUPABASE_URL          (default https://hvuwhnbuahrtptokpqfh.supabase.co)
  SUPABASE_SERVICE_KEY  (required — the service_role / secret key)

Run from repo root:
  SUPABASE_SERVICE_KEY=... python3 kb/_apply_curation.py
Then review the diff and commit kb/coci_curation.json.
"""
import json
import os
import sys
import urllib.request
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "coci_curation.json")
URL = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co").rstrip("/")
KEY = os.environ.get("SUPABASE_SERVICE_KEY")

# Fields we fold into the overlay. `merge_into` (member course_id → target
# unified id) + `unified_title` (canonical title on the target) drive the
# reviewer "Generate unified course" consolidation. `description` is the
# editable course description surfaced in the row-details modal.
# `cross_listed_disciplines` (comma-separated MQ disciplines) adds SECONDARY
# disciplines to a row without changing its primary `discipline` — for courses
# that genuinely belong to two areas (e.g. "Agricultural Accounting" =
# Agriculture + Business). Same course number; additive, no re-mint.
FIELDS = {"discipline", "merge_into", "unified_title", "description",
          "cross_listed_disciplines"}


def fetch_rows():
    endpoint = (f"{URL}/rest/v1/kb_curation"
                "?select=course_id,field,value,reviewer_email,reviewed_at")
    req = urllib.request.Request(endpoint, headers={
        "apikey": KEY, "Authorization": f"Bearer {KEY}", "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def main():
    if not KEY:
        sys.exit("Set SUPABASE_SERVICE_KEY (service_role key) in the environment.")
    rows = fetch_rows()

    curations = {}
    skipped = 0
    for row in rows:
        field = (row.get("field") or "").strip()
        if field not in FIELDS:
            skipped += 1
            continue
        cid = row["course_id"]
        entry = curations.setdefault(cid, {})
        entry[field] = row.get("value")
        # latest reviewer/timestamp wins for the course_id
        if row.get("reviewed_at", "") >= entry.get("reviewed_at", ""):
            entry["reviewed_by"] = row.get("reviewer_email")
            entry["reviewed_at"] = row.get("reviewed_at")

    out = {
        "_about": ("Human curation overlay for the COCI staging KB. Git-canonical and "
                   "reviewable. Synced from the Supabase kb_curation table by "
                   "kb/_apply_curation.py, then applied on top of the AI-drafted coci_* files "
                   "by excel_to_dashboard.py (export_unified_courses) so curation is regen-safe. "
                   "Keyed by course_id (M-ID / UC cluster / C-ID). Does NOT touch curated "
                   "common_courses.json / course_crosswalk.json."),
        "_synced_from": "Supabase project hvuwhnbuahrtptokpqfh, table public.kb_curation",
        "_synced_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "count": len(curations),
        "curations": dict(sorted(curations.items())),
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"wrote {OUT}: {len(curations)} curated course_ids "
          f"({len(rows)} rows from Supabase, {skipped} non-overlay fields skipped)")
    print("Review the diff, then commit kb/coci_curation.json.")


if __name__ == "__main__":
    main()
