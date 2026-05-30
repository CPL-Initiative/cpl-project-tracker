"""
Cross-discipline over-merge re-mint APPLY — Supabase kb_curation key renames.

Consumes the FROZEN plan written by kb/_overmerge_apply.py at
kb/overmerge_apply/<date>/alias_map.json (latest dated dir) and re-points any
kb_curation row whose `course_id` is a SPLIT old M-ID to that split's plurality
piece (the dominant lineage). Held old_mids are unchanged (their id survives).
A "dissolved" (fully-retired) M-ID has no kept id, so its rows route to the
plurality piece too (the largest piece — flagged is_plurality in the plan).

Issues PATCH kb_curation SET course_id = <plurality_new_id> WHERE course_id =
<old_mid>, one split old M-ID at a time.

Best-effort per record with verbose logging — a single transient failure
doesn't strand the apply; the operator can re-run from
kb/overmerge_apply/<date>/supabase_log.json (the frozen alias_map is the source
of truth).

TODAY this is effectively a NO-OP: 0 kb_curation rows reference the flagged set
(verified against kb/coci_curation.json). The script is built for the pattern +
future re-mints (and in case a curator adds a curation row on a flagged M-ID
between the dry-run and the apply).

Env:
  SUPABASE_URL          (default https://hvuwhnbuahrtptokpqfh.supabase.co)
  SUPABASE_SERVICE_KEY  (required — service_role key bypasses RLS; skips
                         gracefully if unset, like the prior apply scripts)

Output: kb/overmerge_apply/<date>/supabase_log.json — ok/fail counts + per-id log.

Idempotent: re-running on already-applied state finds zero rows per old_mid (the
old course_ids are gone from kb_curation) and logs rows-affected=0 for each.

Run from repo root:  SUPABASE_SERVICE_KEY=... python3 kb/_overmerge_apply_supabase.py
                     (default DRY — prints what it WOULD PATCH; --commit to PATCH)
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
APPLY_OUT = os.path.join(HERE, "overmerge_apply")

URL = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co").rstrip("/")
KEY = os.environ.get("SUPABASE_SERVICE_KEY")


def _latest_apply_dir():
    """Return (date_str, abs_path) of the newest YYYY-MM-DD dir under
    kb/overmerge_apply/ that holds an alias_map.json (the frozen plan
    kb/_overmerge_apply.py wrote)."""
    if not os.path.isdir(APPLY_OUT):
        sys.exit(f"Missing {APPLY_OUT} — run kb/_overmerge_apply.py --commit first.")
    dated = [n for n in os.listdir(APPLY_OUT)
             if os.path.isdir(os.path.join(APPLY_OUT, n))
             and re.match(r"^\d{4}-\d{2}-\d{2}$", n)
             and os.path.exists(os.path.join(APPLY_OUT, n, "alias_map.json"))]
    if not dated:
        sys.exit(f"No dated alias_map.json under {APPLY_OUT} — run the apply first.")
    latest = max(dated)
    return latest, os.path.join(APPLY_OUT, latest)


def build_rekey_map(aliases):
    """old_mid → plurality piece new_id, for SPLIT entries only.

    Held entries are skipped (their id survives unchanged, so any curation row
    keyed by a held M-ID needs no re-key). For a split, the plurality piece is
    the one flagged is_plurality (the kept id when non-retired, else the largest
    piece for a dissolved M-ID — matches the plan's is_plurality marking)."""
    out = {}
    for old_mid, rec in aliases.items():
        if rec.get("held"):
            continue
        splits = rec.get("splits") or []
        plur = next((p["new_id"] for p in splits if p.get("is_plurality")), None)
        if plur is None and splits:
            plur = max(splits, key=lambda p: p.get("n_members", 0))["new_id"]
        if plur:
            out[old_mid] = plur
    return out


def fetch_curated_course_ids():
    """Pull the SET of course_id values currently in public.kb_curation.

    The plan re-keys ~1,236 split old M-IDs, but only a handful (today: 0) have
    a curation row. Pre-fetching the curated set lets us PATCH only the old_mids
    that will actually touch a row, instead of fanning out ~1,236 no-op
    round-trips. (Same optimization as kb/_subj4_apply_supabase.py — the SUBJ4
    apply fan-out took 5+ minutes before this was added.)

    PostgREST default page size is 1000; kb_curation is tiny (<100) so one fetch
    suffices. If it ever grows past 1000 rows, add a Range header for paging."""
    qs = urllib.parse.urlencode({"select": "course_id"})
    req = urllib.request.Request(
        f"{URL}/rest/v1/kb_curation?{qs}",
        headers={"apikey": KEY, "Authorization": f"Bearer {KEY}",
                 "Accept": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        rows = json.load(r)
    return {row["course_id"] for row in rows if row.get("course_id")}


def patch_one(old_id, new_id):
    """PATCH kb_curation WHERE course_id = old_id, setting course_id = new_id.
    PostgREST returns the affected rows (Prefer: return=representation) so we can
    count rows-affected."""
    qs = urllib.parse.urlencode({"course_id": f"eq.{old_id}"})
    req = urllib.request.Request(
        f"{URL}/rest/v1/kb_curation?{qs}",
        method="PATCH",
        headers={"apikey": KEY, "Authorization": f"Bearer {KEY}",
                 "Content-Type": "application/json",
                 "Prefer": "return=representation"},
        data=json.dumps({"course_id": new_id}).encode("utf-8"),
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            body = json.load(r)
            n = len(body) if isinstance(body, list) else 0
        return {"old": old_id, "new": new_id, "status": "ok", "rows_affected": n}
    except Exception as e:  # noqa: BLE001 — best-effort, log + continue
        return {"old": old_id, "new": new_id, "status": "fail", "error": str(e)[:200]}


def main(argv=None):
    ap = argparse.ArgumentParser(
        description="Re-key kb_curation rows for the over-merge re-mint.")
    ap.add_argument("--commit", action="store_true",
                    help="Actually PATCH Supabase (default: dry — print only).")
    args = ap.parse_args(argv)

    if not KEY:
        # Graceful skip — mirrors the prior apply scripts + the workflow guard.
        print("SUPABASE_SERVICE_KEY not set — skipping Supabase kb_curation "
              "re-key (no-op). Set it to run.")
        return

    plan_date, plan_dir = _latest_apply_dir()
    with open(os.path.join(plan_dir, "alias_map.json"), encoding="utf-8") as f:
        doc = json.load(f)
    aliases = doc.get("aliases") or {}
    if not aliases:
        sys.exit(f"No aliases in {plan_dir}/alias_map.json.")

    rekey = build_rekey_map(aliases)
    mode = "COMMIT (PATCHing Supabase)" if args.commit else "DRY (no writes)"
    print(f"[overmerge_apply_supabase] {datetime.now(timezone.utc).isoformat()}  mode: {mode}")
    print(f"  plan: kb/overmerge_apply/{plan_date}/alias_map.json")
    print(f"  split old_mids in plan: {len(rekey)}")

    # Pre-fetch the curated course_id set so we only PATCH old_mids with a row.
    try:
        curated_ids = fetch_curated_course_ids()
        print(f"  curated rows in Supabase: {len(curated_ids)}")
    except Exception as e:  # noqa: BLE001
        print(f"  ::warning::pre-fetch failed ({e}); falling back to fan-out (slow)")
        curated_ids = None

    log = []
    ok = fail = no_curated_row = touched = 0
    for old_id, new_id in rekey.items():
        if curated_ids is not None and old_id not in curated_ids:
            no_curated_row += 1
            continue
        if not args.commit:
            # DRY: this old_id HAS a curation row and WOULD be PATCHed.
            log.append({"old": old_id, "new": new_id, "status": "would_patch"})
            print(f"    WOULD PATCH  {old_id} -> {new_id}")
            continue
        result = patch_one(old_id, new_id)
        log.append(result)
        if result["status"] == "ok":
            ok += 1
            if result.get("rows_affected", 0) > 0:
                touched += 1
        else:
            fail += 1
            print(f"    FAIL  {old_id} -> {new_id}: {result.get('error')}")

    # Receipt (written in both modes — a dry log is a useful pre-flight).
    os.makedirs(plan_dir, exist_ok=True)
    log_path = os.path.join(plan_dir, "supabase_log.json")
    with open(log_path, "w", encoding="utf-8") as f:
        json.dump({
            "_about": ("Per-old-M-ID Supabase kb_curation.course_id re-key log "
                       "for the over-merge re-mint. 'rows_affected' > 0 means a "
                       "curated row was actually re-keyed to the split's "
                       "plurality piece; 0 means the old_mid had no live "
                       "curation entry (the common case — today 0 rows "
                       "reference the flagged set)."),
            "_mode": "commit" if args.commit else "dry",
            "_applied_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "totals": {"ok": ok, "fail": fail,
                       "skipped_no_curated_row": no_curated_row,
                       "rows_affected": touched, "split_old_mids": len(rekey)},
            "log": log,
        }, f, indent=2)
        f.write("\n")

    if args.commit:
        print(f"  ok={ok} fail={fail} skipped(no_curated_row)={no_curated_row} "
              f"(rows actually re-keyed in Supabase: {touched})")
    else:
        would = sum(1 for e in log if e.get("status") == "would_patch")
        print(f"  would PATCH {would} old_mid(s); "
              f"skipped(no_curated_row)={no_curated_row}")
    print(f"  log: {log_path}")
    if fail > 0:
        # Exit non-zero so the workflow surfaces it — but only AFTER writing the
        # log so the operator can reproduce / retry.
        sys.exit(2)


if __name__ == "__main__":
    main()
