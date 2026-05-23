"""
Phase 1e SUBJ4 apply — Supabase kb_curation key renames.

Consumes kb/subj4_apply/alias_map.json (the frozen copy written by
kb/_subj4_apply.py) and issues PATCH kb_curation SET course_id = new_id
WHERE course_id = old_id, one alias at a time.

Best-effort per record with verbose logging — a single transient failure
doesn't strand the apply; operator can re-run from kb/subj4_apply/supabase_log.json.

Env:
  SUPABASE_URL          (default https://hvuwhnbuahrtptokpqfh.supabase.co)
  SUPABASE_SERVICE_KEY  (required — service_role key bypasses RLS)

Output: kb/subj4_apply/supabase_log.json — ok/fail counts + per-alias log.

Idempotent: re-running on already-applied state finds zero rows to update
per alias (the old course_ids are gone from kb_curation) and logs ok=0
rows-affected=0 for each.

Run from repo root:  SUPABASE_SERVICE_KEY=... python3 kb/_subj4_apply_supabase.py
"""
from __future__ import annotations

import json
import os
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
APPLY_OUT = os.path.join(HERE, "subj4_apply")
ALIAS_PATH = os.path.join(APPLY_OUT, "alias_map.json")
LOG_PATH = os.path.join(APPLY_OUT, "supabase_log.json")

URL = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co").rstrip("/")
KEY = os.environ.get("SUPABASE_SERVICE_KEY")


def patch_one(old_id: str, new_id: str) -> dict:
    """Issue a PATCH on kb_curation WHERE course_id = old_id, setting
    course_id = new_id. PostgREST returns the affected rows in the body
    (Prefer: return=representation) so we can count rows-affected."""
    qs = urllib.parse.urlencode({"course_id": f"eq.{old_id}"})
    req = urllib.request.Request(
        f"{URL}/rest/v1/kb_curation?{qs}",
        method="PATCH",
        headers={
            "apikey": KEY,
            "Authorization": f"Bearer {KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        },
        data=json.dumps({"course_id": new_id}).encode("utf-8"),
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            body = json.load(r)
            n = len(body) if isinstance(body, list) else 0
        return {"old": old_id, "new": new_id, "status": "ok", "rows_affected": n}
    except Exception as e:
        return {"old": old_id, "new": new_id, "status": "fail", "error": str(e)[:200]}


def main():
    if not KEY:
        sys.exit("Set SUPABASE_SERVICE_KEY (service_role key) in the environment.")
    if not os.path.exists(ALIAS_PATH):
        sys.exit(f"Missing {ALIAS_PATH} — run kb/_subj4_apply.py first.")
    with open(ALIAS_PATH, encoding="utf-8") as f:
        doc = json.load(f)
    aliases = doc.get("aliases") or {}
    if not aliases:
        sys.exit(f"No aliases in {ALIAS_PATH}.")

    print(f"[subj4_apply_supabase] {datetime.now(timezone.utc).isoformat()}")
    print(f"  aliases to PATCH: {len(aliases)}")

    log = []
    ok = fail = skipped = touched = 0
    for old_id, rec in aliases.items():
        new_id = rec["new_id"]
        if new_id == old_id:
            skipped += 1
            log.append({"old": old_id, "new": new_id, "status": "skip", "reason": "no_change"})
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

    os.makedirs(APPLY_OUT, exist_ok=True)
    with open(LOG_PATH, "w", encoding="utf-8") as f:
        json.dump({
            "_about": ("Per-alias Supabase kb_curation.course_id rename log. "
                       "'rows_affected' > 0 means a curated row was actually re-keyed; "
                       "0 means the alias's old_id had no live curation entry "
                       "(common — most M-IDs don't have curation rows)."),
            "_applied_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "totals": {"ok": ok, "fail": fail, "skipped_no_change": skipped,
                        "rows_affected": touched, "aliases_total": len(aliases)},
            "log": log,
        }, f, indent=2)
        f.write("\n")

    print(f"  ok={ok} fail={fail} skipped(no_change)={skipped} "
          f"(rows actually re-keyed in Supabase: {touched})")
    print(f"  log: {LOG_PATH}")
    if fail > 0:
        # Exit non-zero so the workflow surfaces it but only AFTER writing the
        # log so the operator can reproduce / retry.
        sys.exit(2)


if __name__ == "__main__":
    main()
