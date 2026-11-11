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
BEFORE the kb files commit and before the row moves. A row written here is inert until its fold's receipt
is on main (fold_issuer.applied_fold_ids). When the apply does not land (this step fails, or the push
does), the workflow's failure step runs `--rollback <receipt>`, which takes these rows back and marks the
receipt apply_failed.json, and commits the receipt alone so the undo can read its logs.

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


def delete_own(course_id, field, value):
    """DELETE this cohort's row holding exactly value; returns the rows deleted."""
    qs = urllib.parse.urlencode({"course_id": f"eq.{course_id}", "field": f"eq.{field}",
                                 "reviewer_email": f"eq.{fold_issuer.COHORT}", "value": f"eq.{value}"})
    return _req("DELETE", f"kb_curation?{qs}")


def _logs(folder):
    """Every resolution_log*.json in a receipt folder, oldest first."""
    names = sorted(n for n in os.listdir(folder) if n.startswith("resolution_log") and n.endswith(".json"))
    names.sort(key=lambda n: (n != "resolution_log.json", n))
    return [json.load(open(os.path.join(folder, n), encoding="utf-8")) for n in names]


def rollback(folder):
    """Take back what this apply wrote when the apply did not land (the workflow's failure step): every
    resolution row its logs wrote, newest first. An inserted row is deleted, a replaced one put back to its
    before-value, each guarded on the cohort and the value this apply wrote, so a row someone changed since
    is left and reported. Then marks the folder apply_failed.json, which keeps the fold's id out of
    fold_issuer.applied_fold_ids, so a row this could not remove stays inert. Returns the log."""
    out = []
    for doc in reversed(_logs(folder)):
        for e in reversed(doc.get("log") or []):
            if e.get("status") != "ok" or e.get("op") not in ("insert", "replace"):
                continue
            cid, field, after = e["course_id"], e["field"], (e.get("after_row") or {}).get("value")
            entry = {"course_id": cid, "field": field, "op": "rollback_" + e["op"]}
            try:
                if e["op"] == "insert":
                    got = delete_own(cid, field, after)
                else:
                    b = e.get("before_row") or {}
                    got = replace_own(cid, field, after, {"value": b.get("value"), "reviewed_at": b.get("reviewed_at")})
                out.append(dict(entry, status="ok" if got else "left",
                                **({} if got else {"why": "the row no longer holds what this apply wrote"})))
            except Exception as ex:  # reported; the apply_failed mark below still makes the row inert
                out.append(dict(entry, status="fail", error=str(ex)[:200]))
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    with open(os.path.join(folder, "resolution_rollback_log.json"), "w", encoding="utf-8") as f:
        json.dump({"_written_at": now, "log": out}, f, indent=2, ensure_ascii=False)
        f.write("\n")
    with open(os.path.join(folder, fold_issuer.APPLY_FAILED), "w", encoding="utf-8") as f:
        json.dump({"_written_at": now,
                   "_about": "This apply did not land on main (a step failed or the push did). Its receipt is "
                             "committed so the undo can read it; its issuer_resolution rows were taken back "
                             "(resolution_rollback_log.json) and, any that remain, no reader enforces. Row moves "
                             "in supabase_log*.json, if any, reverse with kb/_cred_rename_undo.py."},
                  f, indent=2)
        f.write("\n")
    return out


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


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    if not KEY:
        sys.exit("Set SUPABASE_SERVICE_KEY (service_role key) in the environment.")
    if argv[:1] == ["--rollback"]:
        if len(argv) < 2 or not os.path.isdir(argv[1]):
            sys.exit("--rollback needs this run's receipt folder")
        log = rollback(argv[1])
        bad = [e for e in log if e["status"] != "ok"]
        print(f"[cred_fold_resolution_write] rollback: {len(log)} row(s), {len(bad)} left or failed; "
              f"{argv[1]} marked {fold_issuer.APPLY_FAILED}")
        for e in bad:
            print(f"  {e['status']}: {e['course_id']} {e.get('why') or e.get('error')}")
        return
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
