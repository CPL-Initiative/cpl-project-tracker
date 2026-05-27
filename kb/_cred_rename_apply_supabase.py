"""
Cred-Ref PR-5b/1 — Supabase row migration for credential renames.

Consumes the frozen alias map at kb/cred_rename_out/<YYYY-MM-DD>/alias_map.json
(written by kb/_cred_rename_apply.py) and migrates the matching rows in
public.kb_curation:

  For each (old_unified_title → new_unified_title) rename:
    1. DELETE rows where course_id = '_CREDENTIAL_REVIEW::<OLD>' AND
       field = 'unified_title_override' (the override has been fulfilled —
       the rename has landed in the JSON files, so the Supabase row that
       triggered it is obsolete).
    2. PATCH the remaining rows (issuing_agency_override,
       training_agency_override, quality_flag_override, reviewed_marker)
       on '_CREDENTIAL_REVIEW::<OLD>' to course_id = '_CREDENTIAL_REVIEW::<NEW>'
       so curator intent on OTHER fields carries over to the new identity.

Why DELETE + PATCH (not single PATCH-all):
  * The unified_title_override row's PURPOSE is fulfilled by the apply —
    keeping it under the new key would re-fire on the next dry-run as a
    self-pointer override ("rename X to X"), filling reports with noise.
  * Other overrides (issuer/trainer/quality_flag/reviewed_marker) are
    *attached to the credential* — they belong on whatever the credential's
    current identity key is, so they migrate to <NEW>.
  * The alias_map.json snapshot at kb/cred_rename_out/<date>/ is the canonical
    audit trail (the supersede-don't-mutate ADR makes the alias map
    load-bearing for history; Supabase doesn't need to also carry it).

Architectural invariant honored: raw college-authored titles in
kb/unified_titles.json dict KEYS are immutable; only the synthetic
unified_title layer (Supabase course_id, credentials.json keys, articulation
values) evolves through this script.

Env:
  SUPABASE_URL          (default https://hvuwhnbuahrtptokpqfh.supabase.co)
  SUPABASE_SERVICE_KEY  (required — service_role key bypasses RLS)

Output: kb/cred_rename_out/<YYYY-MM-DD>/supabase_log.json — per-alias
log + ok/fail counts.

Idempotent: re-running finds zero rows to delete + zero rows to patch
per alias (the old course_ids are gone from kb_curation) and logs
ok=0 rows-affected=0 for each.

Run from repo root:  SUPABASE_SERVICE_KEY=... python3 kb/_cred_rename_apply_supabase.py
"""
from __future__ import annotations

import json
import os
import sys
import urllib.parse
import urllib.request
from datetime import date, datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_ROOT = os.path.join(HERE, "cred_rename_out")
KEY_PREFIX = "_CREDENTIAL_REVIEW::"

URL = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co").rstrip("/")
KEY = os.environ.get("SUPABASE_SERVICE_KEY")


def _find_latest_snapshot():
    """Pick the most recent kb/cred_rename_out/<YYYY-MM-DD>/alias_map.json.
    Allows the workflow to dispatch this script independently of the JSON
    apply (e.g. retry after a transient Supabase error)."""
    if not os.path.isdir(OUT_ROOT):
        return None
    candidates = []
    for name in os.listdir(OUT_ROOT):
        path = os.path.join(OUT_ROOT, name, "alias_map.json")
        if os.path.isfile(path):
            candidates.append((name, path))
    if not candidates:
        return None
    candidates.sort(reverse=True)  # YYYY-MM-DD lex order = chronological
    return candidates[0]


def fetch_credential_review_rows() -> dict:
    """Pull every _CREDENTIAL_REVIEW::* row from kb_curation. Returned as
    {course_id: [{field, value, reviewer_email, reviewed_at}, ...]}.

    Pre-fetching lets us skip aliases whose source rows don't exist in
    Supabase at all (idempotency on re-runs) and detect the unified_title_override
    rows to DELETE vs. PATCH others. PostgREST default page size is 1000;
    this slice is small (today: 0 rows). Add a Range header if the slice
    ever grows past 1000.
    """
    qs = urllib.parse.urlencode({
        "select": "course_id,field,value,reviewer_email,reviewed_at",
        "course_id": f"like.{KEY_PREFIX}%",
    })
    req = urllib.request.Request(
        f"{URL}/rest/v1/kb_curation?{qs}",
        headers={
            "apikey": KEY,
            "Authorization": f"Bearer {KEY}",
            "Accept": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        rows = json.load(r)
    grouped = {}
    for row in rows:
        cid = row.get("course_id") or ""
        if not cid.startswith(KEY_PREFIX):
            continue
        grouped.setdefault(cid, []).append(row)
    return grouped


def delete_row(course_id: str, field: str) -> dict:
    """DELETE kb_curation WHERE course_id = X AND field = Y."""
    qs = urllib.parse.urlencode({
        "course_id": f"eq.{course_id}",
        "field": f"eq.{field}",
    })
    req = urllib.request.Request(
        f"{URL}/rest/v1/kb_curation?{qs}",
        method="DELETE",
        headers={
            "apikey": KEY,
            "Authorization": f"Bearer {KEY}",
            "Prefer": "return=representation",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            body = json.load(r)
            n = len(body) if isinstance(body, list) else 0
        return {"course_id": course_id, "field": field, "op": "delete",
                "status": "ok", "rows_affected": n}
    except Exception as e:
        return {"course_id": course_id, "field": field, "op": "delete",
                "status": "fail", "error": str(e)[:200]}


def patch_row(old_course_id: str, new_course_id: str, field: str) -> dict:
    """PATCH kb_curation WHERE course_id = old AND field = X, setting
    course_id = new. Per-field rather than per-course_id because the
    primary key is (course_id, field) — if new::field already exists,
    a full PATCH would fail; per-field lets us log per-field outcomes."""
    qs = urllib.parse.urlencode({
        "course_id": f"eq.{old_course_id}",
        "field": f"eq.{field}",
    })
    req = urllib.request.Request(
        f"{URL}/rest/v1/kb_curation?{qs}",
        method="PATCH",
        headers={
            "apikey": KEY,
            "Authorization": f"Bearer {KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        },
        data=json.dumps({"course_id": new_course_id}).encode("utf-8"),
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            body = json.load(r)
            n = len(body) if isinstance(body, list) else 0
        return {"old_course_id": old_course_id, "new_course_id": new_course_id,
                "field": field, "op": "patch", "status": "ok", "rows_affected": n}
    except Exception as e:
        return {"old_course_id": old_course_id, "new_course_id": new_course_id,
                "field": field, "op": "patch", "status": "fail",
                "error": str(e)[:200]}


def main():
    if not KEY:
        sys.exit("Set SUPABASE_SERVICE_KEY (service_role key) in the environment.")
    snap = _find_latest_snapshot()
    if not snap:
        sys.exit("No alias_map snapshot found under kb/cred_rename_out/. "
                 "Run kb/_cred_rename_apply.py first.")
    date_stamp, alias_path = snap
    with open(alias_path, encoding="utf-8") as f:
        doc = json.load(f)
    renames = doc.get("renames") or {}
    if not renames:
        sys.exit(f"No renames in {alias_path}.")

    print(f"[cred_rename_apply_supabase] {datetime.now(timezone.utc).isoformat()}")
    print(f"  snapshot: {date_stamp} ({len(renames)} renames)")

    existing = fetch_credential_review_rows()
    print(f"  existing _CREDENTIAL_REVIEW::* course_ids in Supabase: {len(existing)}")

    log = []
    ok = 0
    fail = 0
    no_op = 0
    for old_ut, new_ut in renames.items():
        old_cid = f"{KEY_PREFIX}{old_ut}"
        new_cid = f"{KEY_PREFIX}{new_ut}"
        rows_for_old = existing.get(old_cid, [])
        if not rows_for_old:
            no_op += 1
            log.append({"old_ut": old_ut, "new_ut": new_ut, "op": "skip",
                        "reason": "no_rows_in_supabase"})
            continue
        for row in rows_for_old:
            field = row.get("field") or ""
            if field == "unified_title_override":
                # Override fulfilled — drop it. Per the ADR, the alias_map
                # snapshot at kb/cred_rename_out/<date>/ is the canonical
                # audit trail of "this rename happened on this date."
                res = delete_row(old_cid, field)
            else:
                # Migrate non-rename override to the new key (curator intent
                # on issuer/trainer/quality_flag/reviewed_marker travels with
                # the credential's identity).
                res = patch_row(old_cid, new_cid, field)
            log.append({"old_ut": old_ut, "new_ut": new_ut, **res})
            if res.get("status") == "ok":
                ok += 1
            else:
                fail += 1

    # Persist the per-row log next to the snapshot so a future operator
    # can see exactly what landed (and replay failed rows individually).
    log_path = os.path.join(OUT_ROOT, date_stamp, "supabase_log.json")
    log_payload = {
        "_applied_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "alias_map_snapshot": alias_path,
        "renames_processed": len(renames),
        "ok": ok,
        "fail": fail,
        "no_op": no_op,
        "log": log,
    }
    with open(log_path, "w", encoding="utf-8") as f:
        json.dump(log_payload, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"  ok={ok}  fail={fail}  no_op_aliases={no_op}")
    print(f"  log: {log_path}")
    if fail:
        sys.exit(f"{fail} row operations failed — inspect {log_path}.")


if __name__ == "__main__":
    main()
