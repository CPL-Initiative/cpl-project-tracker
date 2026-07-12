"""
Sync CER unclassified-triage assignments from Supabase into the git-canonical
overlay:
  Supabase public.kb_curation (_UNCLASSIFIED::<raw_title> namespace)
    ->  kb/unclassified_assignments.json

The Common Exhibit Reference tab (credential_reference.js, PR-1) lets allowed
reviewers assign a unified credential title (+ optional issuing agency) to each
raw MAP exhibit title the auditor flagged `unclassified_in_map` (a title with no
entry in kb/unified_titles.json yet). Those assignments live in kb_curation
under a dedicated `_UNCLASSIFIED::<raw_title>` namespace:
  - unified_title_assignment      (the credential the reviewer chose / typed)
  - issuing_agency_assignment     (optional, the primary certifying body)
  - issuing_agency_assignment2    (optional, " | "-delimited ADDITIONAL agencies
                                   — Rule 4 multi-issuer, split into a list here)

The dashboard reads them live from Supabase, so the worklist shows progress
immediately. This script keeps a GIT-CANONICAL overlay in sync so the
assignments are durable + reviewable in git (mirrors _apply_credential_review.py
+ _apply_curation.py).

SCOPE (PR-2): this script ONLY records the assignments into the overlay. It does
NOT yet fold them into kb/unified_titles.json / kb/credentials.json — promoting
a raw title into the credential layer changes a curated KB file (and ripples
into kb/coci_articulations.json's inlined unified_title), so the FOLD is its own
dry-run-first PR-3, NOT a routine daily sync. Until then the overlay is the
durable record + the input PR-3 will consume.

Idempotent: if the assignment set is unchanged from the committed overlay, the
file is left untouched (no timestamp churn → no daily commit for an empty/stable
overlay).

Auth: uses the SERVICE-ROLE key (bypasses RLS) — keep it secret. NEVER put it
on the dashboard page; only here, from the environment.

Env:
  SUPABASE_URL          (default https://hvuwhnbuahrtptokpqfh.supabase.co)
  SUPABASE_SERVICE_KEY  (required — the service_role / secret key)

Run from repo root:
  SUPABASE_SERVICE_KEY=... python3 kb/_apply_unclassified_triage.py
Then review the diff and commit kb/unclassified_assignments.json.
"""
import json
import os
import sys
import urllib.request
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "unclassified_assignments.json")
URL = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co").rstrip("/")
KEY = os.environ.get("SUPABASE_SERVICE_KEY")

KEY_PREFIX = "_UNCLASSIFIED::"
FIELD_TITLE = "unified_title_assignment"
FIELD_ISSUER = "issuing_agency_assignment"
# ADDITIONAL issuing agencies (Rule 4 multi-issuer — Sam, 2026-07-11). The CER
# triage row joins extras into ONE " | "-delimited value; we split them into an
# additional_issuing_agencies list on the overlay entry, ready for the PR-3
# credential fold to append each alongside the primary (never clobbering it).
FIELD_ISSUER2 = "issuing_agency_assignment2"


def split_issuers(s):
    return [x.strip() for x in (s or "").split("|") if x.strip()]


def fetch_rows():
    # PostgREST: server-side filter so we only pull our namespace, not all of
    # kb_curation (which also holds the discipline + credential-review overlays).
    # Range-paginated with a stable order — the namespace crossed PostgREST's
    # 1,000-row unordered cap (1,204 rows on 2026-07-09), and a single
    # unpaginated GET silently drops the tail: saved assignments then never
    # fold and sit "awaiting fold" forever. Same fix as
    # _cred_rename_apply_supabase.py / the Session-105 lesson
    # (docs/kb-notes/methodology-paginate-postgrest-reads.md).
    endpoint = (f"{URL}/rest/v1/kb_curation"
                "?select=course_id,field,value,reviewer_email,reviewed_at"
                f"&course_id=like.{KEY_PREFIX}%25"
                "&order=course_id.asc,field.asc")
    page_size = 1000
    rows = []
    start = 0
    while True:
        req = urllib.request.Request(endpoint, headers={
            "apikey": KEY, "Authorization": f"Bearer {KEY}",
            "Accept": "application/json",
            "Range-Unit": "items",
            "Range": f"{start}-{start + page_size - 1}"})
        with urllib.request.urlopen(req, timeout=30) as r:
            page = json.load(r)
        rows.extend(page or [])
        if not page or len(page) < page_size:
            break
        start += page_size
    return rows


def build_assignments(rows):
    """Group kb_curation rows into raw_title -> {unified_title, issuing_agency,
    reviewed_by, reviewed_at}. A row is a valid assignment only once it carries a
    non-empty unified_title_assignment (the issuer alone never classifies)."""
    acc = {}
    skipped_field = skipped_prefix = 0
    for row in rows:
        cid = row.get("course_id") or ""
        if not cid.startswith(KEY_PREFIX):
            skipped_prefix += 1
            continue
        raw = cid[len(KEY_PREFIX):]
        field = (row.get("field") or "").strip()
        if field not in (FIELD_TITLE, FIELD_ISSUER, FIELD_ISSUER2):
            skipped_field += 1
            continue
        entry = acc.setdefault(raw, {})
        if field == FIELD_TITLE:
            entry["unified_title"] = (row.get("value") or "").strip()
        elif field == FIELD_ISSUER:
            entry["issuing_agency"] = (row.get("value") or "").strip()
        elif field == FIELD_ISSUER2:
            extras = split_issuers(row.get("value"))
            if extras:
                entry["additional_issuing_agencies"] = extras
            else:
                entry.pop("additional_issuing_agencies", None)
        # Latest reviewer/timestamp wins (matches _apply_curation.py).
        if (row.get("reviewed_at") or "") >= (entry.get("reviewed_at") or ""):
            entry["reviewed_by"] = row.get("reviewer_email")
            entry["reviewed_at"] = row.get("reviewed_at")

    # Keep only rows that actually assign a unified_title; drop issuer-only stubs.
    assignments = {raw: e for raw, e in acc.items() if e.get("unified_title")}
    return assignments, skipped_field, skipped_prefix


def existing_assignments():
    try:
        with open(OUT, encoding="utf-8") as f:
            return json.load(f).get("assignments", {})
    except (FileNotFoundError, ValueError):
        return None


def main():
    if not KEY:
        sys.exit("Set SUPABASE_SERVICE_KEY (service_role key) in the environment.")
    rows = fetch_rows()
    assignments, skipped_field, skipped_prefix = build_assignments(rows)
    assignments = dict(sorted(assignments.items()))

    # Idempotent: if the assignment set is unchanged, leave the file (and its
    # _synced_at) alone so an empty/stable overlay produces no daily diff.
    if existing_assignments() == assignments:
        print(f"no change: {len(assignments)} assignments "
              f"({len(rows)} rows from Supabase) — overlay left untouched")
        return

    out = {
        "_about": (
            "CER unclassified-triage assignments synced from Supabase kb_curation "
            "(_UNCLASSIFIED::<raw_title> namespace). Each entry assigns a raw MAP "
            "exhibit title a unified credential title (+ optional issuer). "
            "RECORDED here for durability/review; the fold into "
            "kb/unified_titles.json + kb/credentials.json is PR-3 (dry-run-first, "
            "since it mutates the curated credential KB)."
        ),
        "_synced_from": "Supabase project hvuwhnbuahrtptokpqfh, table public.kb_curation",
        "_synced_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "count": len(assignments),
        "assignments": assignments,
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"wrote {OUT}: {len(assignments)} assignments "
          f"({len(rows)} rows from Supabase, "
          f"{skipped_field} unknown-field skipped, "
          f"{skipped_prefix} non-namespace skipped)")
    print("Review the diff, then commit kb/unclassified_assignments.json.")


if __name__ == "__main__":
    main()
