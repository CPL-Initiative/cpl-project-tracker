#!/usr/bin/env python3
"""Write a credential fold's issuer resolutions to kb_curation: one row per folded target.

#3116 redesign (S638 conductor, 2026-11-11). The fold's issuer decision (kb/fold_issuer.py, rules 1, 2,
2b and 3) is stored as ONE row per folded target and never by updating or deleting the issuer rows people
wrote: course_id _CREDENTIAL_REVIEW::<target>, field issuer_resolution, reviewer_email the bot cohort
fold_issuer.COHORT, value the JSON from fold_issuer.resolution_value() (rule, winner, dropped issuers,
kept additionals, decided_at, fold_id). Every reader resolves a title's issuer rows through
fold_issuer.effective_issuer() (issuer_resolution.js in the browser), and the nightly sync enforces it on
kb/credentials.json, so a partial state repairs itself the next night.

Keying: one field name, issuer_resolution, so the overlay sync's exact-name field filter
(kb/_apply_credential_review.py FIELDS) and the browser readers' field=in.(...) queries need one more
name and nothing else, and only the resolution in force is ever stored. The primary key is (course_id,
field), so a later fold onto the same target meets the earlier row: it is replaced by a guarded upsert
restricted to this cohort's own rows (the PATCH matches reviewer_email = the cohort AND the exact stored
value), and the replaced value is logged as the before-row. A row under any other reviewer_email is never
touched: the write fails and the job stops.

Idempotent: a retry finds its own rows (same fold_id) and writes nothing. Runs in its own workflow step
BEFORE the kb files commit and before the row moves; a failure fails the job and nothing commits.

Log: kb/cred_rename_out/<fold>/resolution_log.json, or resolution_log-<UTC>.json on a retry, so no run
overwrites another's before-rows. Undo: kb/_cred_rename_undo.py --supabase-plan deletes the cohort's rows
for the fold and puts back any row this write replaced.

Env: SUPABASE_URL, SUPABASE_SERVICE_KEY (service_role). Run from repo root.
"""
from __future__ import annotations

import json
import os
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import fold_issuer  # noqa: E402
import _cred_rename_apply_supabase as moves  # noqa: E402  (the same snapshot pick)

URL = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co").rstrip("/")
KEY = os.environ.get("SUPABASE_SERVICE_KEY")
OUT_ROOT = os.path.join(HERE, "cred_rename_out")
COLS = "course_id,field,value,reviewer_email,reviewed_at,validated_at,validated_by"


def encode(value):
    """The stored form of a resolution: stable, so the guarded upsert's value match is exact."""
    return json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(",", ":"))


def _req(method, path, body=None, prefer="return=representation"):
    req = urllib.request.Request(
        f"{URL}/rest/v1/{path}", method=method,
        headers={"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json",
                 "Accept": "application/json", "Prefer": prefer},
        data=json.dumps(body).encode("utf-8") if body is not None else None)
    with urllib.request.urlopen(req, timeout=30) as r:
        got = json.load(r)
    return got if isinstance(got, list) else []


def insert_ignore(row):
    """INSERT ... ON CONFLICT DO NOTHING. Returns the rows written (empty when one was there)."""
    return _req("POST", "kb_curation", row, "return=representation,resolution=ignore-duplicates")


def get_row(course_id, field):
    qs = urllib.parse.urlencode({"select": COLS, "course_id": f"eq.{course_id}", "field": f"eq.{field}"})
    rows = _req("GET", f"kb_curation?{qs}")
    return rows[0] if rows else None


def replace_own(course_id, field, old_value, new):
    """The guarded upsert's update half: only this cohort's row holding exactly old_value."""
    qs = urllib.parse.urlencode({"course_id": f"eq.{course_id}", "field": f"eq.{field}",
                                 "reviewer_email": f"eq.{fold_issuer.COHORT}", "value": f"eq.{old_value}"})
    return _req("PATCH", f"kb_curation?{qs}", new)


def write_rows(rows, now):
    """Write each resolution row. Returns (log, failed)."""
    log, failed = [], 0
    for r in rows:
        cid, field = r["course_id"], r["field"]
        body = {"course_id": cid, "field": field, "value": encode(r["value"]),
                "reviewer_email": fold_issuer.COHORT, "reviewed_at": now}
        entry = {"course_id": cid, "field": field, "fold_id": r["value"].get("fold_id")}
        try:
            if insert_ignore(body):
                log.append(dict(entry, op="insert", status="ok", after_row=body))
                continue
            cur = get_row(cid, field)
            if cur is None:
                log.append(dict(entry, op="insert", status="fail", error="insert wrote nothing and no row is there"))
                failed += 1
                continue
            before = {k: cur.get(k) for k in ("value", "reviewer_email", "reviewed_at", "validated_at",
                                               "validated_by")}
            if cur.get("reviewer_email") != fold_issuer.COHORT:
                log.append(dict(entry, op="replace", status="fail", before_row=before,
                                error="the row is not this cohort's; it is never replaced"))
                failed += 1
                continue
            if (fold_issuer.parse_resolution(cur.get("value")) or {}).get("fold_id") == entry["fold_id"]:
                log.append(dict(entry, op="skip", status="ok", reason="already written by this fold"))
                continue
            got = replace_own(cid, field, cur.get("value"),
                              {"value": body["value"], "reviewed_at": now})
            if not got:
                log.append(dict(entry, op="replace", status="fail", before_row=before,
                                error="the guarded update matched nothing (the row changed since it was read)"))
                failed += 1
                continue
            log.append(dict(entry, op="replace", status="ok", before_row=before, after_row=body))
        except Exception as e:  # network or HTTP error: the step fails, nothing commits
            log.append(dict(entry, op="write", status="fail", error=str(e)[:200]))
            failed += 1
    return log, failed


def _log_path(folder):
    first = os.path.join(folder, "resolution_log.json")
    if not os.path.exists(first):
        return first
    return os.path.join(folder, "resolution_log-%s.json" % datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ"))


def main():
    if not KEY:
        sys.exit("Set SUPABASE_SERVICE_KEY (service_role key) in the environment.")
    moves.OUT_ROOT = OUT_ROOT
    snap = moves._find_latest_snapshot()
    if not snap:
        sys.exit("No snapshot under kb/cred_rename_out/; run kb/_cred_rename_apply.py first.")
    stamp, path = snap
    doc = json.load(open(path, encoding="utf-8"))
    rows = doc.get("resolution_rows") or []
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    log, failed = write_rows(rows, now)
    lp = _log_path(os.path.join(OUT_ROOT, stamp))
    with open(lp, "w", encoding="utf-8") as f:
        json.dump({"_written_at": now, "snapshot": path, "rows": len(rows), "failed": failed, "log": log},
                  f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"[cred_fold_resolution_write] {len(rows)} resolution row(s), {failed} failed; log {lp}")
    if failed:
        sys.exit(f"{failed} resolution row(s) not written; the job stops before anything commits.")


if __name__ == "__main__":
    main()
