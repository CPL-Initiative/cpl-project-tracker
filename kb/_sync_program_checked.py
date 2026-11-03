#!/usr/bin/env python3
"""_sync_program_checked.py — which CPL Pathways records a person has confirmed, for the Commons card.

A person's Confirm in CPL Pathways sets `checked` on the record live in Supabase
(public.program_requirement_records); the committed records under kb/program_requirements_*/ never
carry it. The Commons builder reads only committed files, so this daily step commits the list of
checked records: college, control number and the day it was checked. The person's address stays
in the table (the public repo carries no staff email); a `@bot` cohort's check never counts.

Sam, Open Asks Sheet 160 (2026-11-03), and S565's "yes to both, build them for all four": every
common reference counts its person-confirmed units beside complete.

Usage (the daily workflow; the read needs the service key):
  SUPABASE_SERVICE_KEY=... python3 kb/_sync_program_checked.py
Writes kb/status/program-requirements-checked.json. Read-only against Supabase.
"""
import json
import os
import sys
import urllib.request
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _apply_curation import _fetch_json  # noqa: E402  (the retrying fetch the curation sync uses)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "kb", "status", "program-requirements-checked.json")
URL = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co").rstrip("/")
KEY = os.environ.get("SUPABASE_SERVICE_KEY")


def fetch():
    """Every checked record, Range-paginated (PostgREST caps a response at 1,000 rows)."""
    endpoint = (f"{URL}/rest/v1/program_requirement_records?checked=eq.true"
                "&select=college,control_number,checked_by,checked_at&order=college.asc,control_number.asc")
    out, page, start = [], 1000, 0
    while True:
        req = urllib.request.Request(endpoint, headers={
            "apikey": KEY, "Authorization": f"Bearer {KEY}", "Accept": "application/json",
            "Range-Unit": "items", "Range": f"{start}-{start + page - 1}"})
        batch = _fetch_json(req)
        out.extend(batch)
        if len(batch) < page:
            return out
        start += page


def shape(rows):
    """The committed form: [college, control number, day], a person's checks only, in a stable order."""
    keep = [r for r in rows if r.get("checked_by") and not str(r["checked_by"]).endswith("@bot")]
    return sorted([r["college"], str(r["control_number"]), str(r.get("checked_at") or "")[:10]] for r in keep)


def main():
    if not KEY:
        sys.exit("Set SUPABASE_SERVICE_KEY in the environment.")
    checked = shape(fetch())
    doc = {"_about": "CPL Pathways records a person has confirmed (program_requirement_records.checked), "
                     "synced daily by kb/_sync_program_checked.py for the Commons card. No addresses.",
           "_synced_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
           "checked": checked}
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(doc, f, indent=1, ensure_ascii=False)
        f.write("\n")
    print(f"{len(checked)} checked records -> {os.path.relpath(OUT, ROOT)}")


if __name__ == "__main__":
    main()
