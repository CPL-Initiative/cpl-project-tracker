"""
Sync curator edits from Supabase into kb/discipline_canonical_subj4.json.

The Canonical SUBJ4 curator tab (canonical_subj4.js) writes per-discipline
edits to Supabase public.kb_curation with a synthesized course_id namespace
`_CANON_SUBJ4::<discipline>` and fields `canonical_subj4` / `canonical_subj4_notes`.
The main `_apply_curation.py` ignores these rows (they aren't in its FIELDS
whitelist), so this script folds them into the canonical seed file instead.

The seed file's variant counts (`variants_observed`, `total_mids`, `data_modal`,
etc.) are preserved as-is — they're frozen at seed time so the curator's choice
is auditable against the data snapshot it was made against. Only the curator-
owned fields are updated: `canonical_subj4`, `_notes`, `reviewed_at`,
`reviewed_by`, `source`, `needs_review`.

Auth: service-role key (bypasses RLS). Same pattern as kb/_apply_curation.py.

Env:
  SUPABASE_URL          (default https://hvuwhnbuahrtptokpqfh.supabase.co)
  SUPABASE_SERVICE_KEY  (required — service_role key)

Run from repo root:
  SUPABASE_SERVICE_KEY=... python3 kb/_apply_canonical_subj4.py
Then review the diff and commit kb/discipline_canonical_subj4.json.
"""
from __future__ import annotations

import json
import os
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
SEED_PATH = os.path.join(HERE, "discipline_canonical_subj4.json")
URL = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co").rstrip("/")
KEY = os.environ.get("SUPABASE_SERVICE_KEY")

KEY_PREFIX = "_CANON_SUBJ4::"
FIELD_CANON = "canonical_subj4"
FIELD_NOTES = "canonical_subj4_notes"
SUBJ4_RE = re.compile(r"^[A-Z]{4}$")


def fetch_rows():
    # PostgREST `like` filter with %-suffix to scope to our namespace.
    qs = urllib.parse.urlencode({
        "select": "course_id,field,value,reviewer_email,reviewed_at",
        "course_id": f"like.{KEY_PREFIX}%",
    })
    endpoint = f"{URL}/rest/v1/kb_curation?{qs}"
    req = urllib.request.Request(endpoint, headers={
        "apikey": KEY, "Authorization": f"Bearer {KEY}", "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def main():
    if not KEY:
        sys.exit("Set SUPABASE_SERVICE_KEY (service_role key) in the environment.")
    if not os.path.exists(SEED_PATH):
        sys.exit(f"Missing {SEED_PATH} — run kb/_seed_canonical_subj4.py first.")

    rows = fetch_rows()
    # Group rows by discipline: latest reviewer/timestamp across fields wins.
    by_disc: dict[str, dict] = {}
    for r in rows:
        cid = r.get("course_id") or ""
        if not cid.startswith(KEY_PREFIX):
            continue
        d = cid[len(KEY_PREFIX):]
        if not d:
            continue
        field = (r.get("field") or "").strip()
        rec = by_disc.setdefault(d, {})
        rec[field] = r.get("value")
        if (r.get("reviewed_at") or "") >= rec.get("reviewed_at", ""):
            rec["reviewed_by"] = r.get("reviewer_email")
            rec["reviewed_at"] = r.get("reviewed_at")

    with open(SEED_PATH, "r", encoding="utf-8") as f:
        seed = json.load(f)
    disciplines = seed.get("disciplines", {})

    applied = 0
    invalid = []
    unknown_disc = []
    for d, rec in by_disc.items():
        if d not in disciplines:
            unknown_disc.append(d)
            continue
        entry = disciplines[d]
        canon = rec.get(FIELD_CANON)
        notes = rec.get(FIELD_NOTES)
        if canon is not None:
            canon_norm = canon.strip().upper() if canon else None
            if canon_norm and not SUBJ4_RE.match(canon_norm):
                invalid.append((d, canon))
                continue
            entry["canonical_subj4"] = canon_norm or None
            entry["source"] = "curator_override" if canon_norm else None
            entry["needs_review"] = not bool(canon_norm)
        if notes is not None:
            entry["_notes"] = notes or None
        if rec.get("reviewed_at"):
            entry["reviewed_at"] = rec["reviewed_at"]
            entry["reviewed_by"] = rec.get("reviewed_by")
            # If the curator cleared canonical_subj4 (set to "") we don't claim
            # the row is reviewed yet — the canonical is required for review.
            if entry.get("canonical_subj4"):
                entry["needs_review"] = False
        applied += 1

    # Refresh counts.
    needs_review_count = sum(1 for e in disciplines.values() if e.get("needs_review"))
    seed.setdefault("_counts", {})
    seed["_counts"]["needs_review"] = needs_review_count
    seed["_counts"]["seeded_default"] = len(disciplines) - needs_review_count
    seed["_synced_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    seed["_synced_from"] = (f"Supabase project (kb_curation, course_id like "
                            f"'{KEY_PREFIX}%')")
    seed["disciplines"] = dict(sorted(disciplines.items()))

    with open(SEED_PATH, "w", encoding="utf-8") as f:
        json.dump(seed, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"applied {applied} curator edits from Supabase to {SEED_PATH}")
    print(f"  rows fetched:         {len(rows)}")
    print(f"  disciplines touched:  {applied}")
    print(f"  invalid canonical:    {len(invalid)}")
    for d, v in invalid:
        print(f"    SKIPPED {d!r}: invalid SUBJ4 {v!r} (must be 4 letters)")
    print(f"  unknown disciplines:  {len(unknown_disc)}")
    for d in unknown_disc:
        print(f"    SKIPPED {d!r} (not in seed file — re-seed?)")
    print(f"  needs_review now:     {needs_review_count}")
    print("Review the diff and commit kb/discipline_canonical_subj4.json.")


if __name__ == "__main__":
    main()
