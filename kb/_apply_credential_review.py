"""
Sync Credential Reference curator edits from Supabase into the git-canonical
overlay:
  Supabase public.kb_curation (_CREDENTIAL_REVIEW::<unified_title> namespace)
    ->  kb/credential_review_overlay.json

The Credential Reference tab (credential_reference.js) lets allowed reviewers
override 4 fields per unified_title row:
  - unified_title_override   (DISPLAY-ONLY by PR-4 design; identity stays)
  - issuing_agency_override
  - training_agency_override
  - quality_flag_override
  - (plus the "reviewed_marker" sentinel from PR-B's Mark Initiated)

The dashboard reads the overlay live from Supabase, so curator edits show
immediately on the Credential Reference tab. This script keeps the GIT-CANONICAL
overlay in sync so the BAKED `credential_reference_data.js` payload (and any
other consumer reading the JSON files directly) carries the same edits.

What's applied (Mode A — this script):
  - issuing_agency_override, training_agency_override, quality_flag_override
  - reviewed_marker
  These are SAFE edits — they don't ripple into the identity key
  (`unified_title`) or into kb/coci_articulations.json. The overlay is
  consumed by excel_to_dashboard.py:export_credential_reference().

What's RECORDED but NOT APPLIED (Mode B — Cred-Ref PR-5b):
  - unified_title_override — a rename ripples into kb/unified_titles.json key,
    kb/credentials.json key, AND kb/coci_articulations.json's inlined
    unified_title field. That's a re-mint, NOT a routine sync. It needs the
    full playbook from docs/coursecontrolnumber_remint.md: dry-run → alias
    map committed → atomic land within the 10:17 UTC cron window → Supabase
    override row cleared in lock-step. Until that ships, the rename-overrides
    are recorded in the overlay (so curators get audit visibility) but not
    folded into the JSON files.

Auth: uses the SERVICE-ROLE key (bypasses RLS) — keep it secret. NEVER put it
in the dashboard page; only here, from the environment.

Env:
  SUPABASE_URL          (default https://hvuwhnbuahrtptokpqfh.supabase.co)
  SUPABASE_SERVICE_KEY  (required — the service_role / secret key)

Run from repo root:
  SUPABASE_SERVICE_KEY=... python3 kb/_apply_credential_review.py
Then review the diff and commit kb/credential_review_overlay.json.
"""
import json
import os
import sys
import urllib.request
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "credential_review_overlay.json")
URL = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co").rstrip("/")
KEY = os.environ.get("SUPABASE_SERVICE_KEY")

KEY_PREFIX = "_CREDENTIAL_REVIEW::"
# Fields we copy verbatim into the overlay (every field PR-4 + PR-B can write).
# unified_title_override is recorded but NOT applied by the JSON-merge consumer
# (excel_to_dashboard.py:export_credential_reference()) — see Mode B above.
FIELDS = {
    "unified_title_override",
    "issuing_agency_override",
    "training_agency_override",
    "quality_flag_override",
    "reviewed_marker",
}


def fetch_rows():
    # PostgREST: ?course_id=like.PREFIX%25 filters server-side so we don't pull
    # every row in kb_curation (which includes the discipline overlay too).
    endpoint = (f"{URL}/rest/v1/kb_curation"
                "?select=course_id,field,value,reviewer_email,reviewed_at"
                f"&course_id=like.{KEY_PREFIX}%25")
    req = urllib.request.Request(endpoint, headers={
        "apikey": KEY, "Authorization": f"Bearer {KEY}", "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def main():
    if not KEY:
        sys.exit("Set SUPABASE_SERVICE_KEY (service_role key) in the environment.")
    rows = fetch_rows()

    overrides = {}
    skipped_field = 0
    skipped_prefix = 0
    rename_count = 0
    for row in rows:
        cid = row.get("course_id") or ""
        if not cid.startswith(KEY_PREFIX):
            skipped_prefix += 1
            continue
        ut = cid[len(KEY_PREFIX):]
        field = (row.get("field") or "").strip()
        if field not in FIELDS:
            skipped_field += 1
            continue
        entry = overrides.setdefault(ut, {})
        entry[field] = row.get("value")
        if field == "unified_title_override" and row.get("value"):
            rename_count += 1
        # Latest reviewer/timestamp wins (matches _apply_curation.py).
        if row.get("reviewed_at", "") >= entry.get("reviewed_at", ""):
            entry["reviewed_by"] = row.get("reviewer_email")
            entry["reviewed_at"] = row.get("reviewed_at")

    out = {
        "_about": (
            "Credential-Reference curator overrides synced from Supabase "
            "kb_curation (_CREDENTIAL_REVIEW::<unified_title> namespace). "
            "Applied by excel_to_dashboard.py:export_credential_reference() "
            "for issuer/trainer/quality_flag/reviewed_marker. "
            "unified_title_override is RECORDED here but NOT applied as a "
            "rename — that's Cred-Ref PR-5b with the re-mint playbook."
        ),
        "_synced_from": "Supabase project hvuwhnbuahrtptokpqfh, table public.kb_curation",
        "_synced_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "count": len(overrides),
        "rename_overrides_recorded_not_applied": rename_count,
        "overrides": dict(sorted(overrides.items())),
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"wrote {OUT}: {len(overrides)} unified_titles with overrides "
          f"({len(rows)} rows from Supabase, "
          f"{skipped_field} unknown-field skipped, "
          f"{skipped_prefix} non-credential-review skipped, "
          f"{rename_count} rename overrides recorded-not-applied)")
    print("Review the diff, then commit kb/credential_review_overlay.json.")


if __name__ == "__main__":
    main()
