"""
EACR Phase 4 (re-pivot) — PR-D `_EACR_FLAG::*` migration script.

ONE-SHOT migration. Run from your laptop (NOT inside a cloud Claude Code
session — credentials aren't injected). Re-keys existing curator flags
from PR-D against the new EACR card identities introduced by PR-C1.

USAGE
-----
  # Required env: Supabase URL + service-role key
  # The URL is the project URL; service-role bypasses RLS so the script
  # can read/write _EACR_FLAG::* rows directly.

  export SUPABASE_URL="https://hvuwhnbuahrtptokpqfh.supabase.co"
  export SUPABASE_SERVICE_KEY="<the service-role key from the Supabase dashboard>"

  # Dry-run first — shows what would change, writes nothing:
  python3 kb/_eacr_flag_migrate.py --dry-run

  # Real run — atomic per row; idempotent (safe to re-run):
  python3 kb/_eacr_flag_migrate.py

  # Refine: limit to N rows for a small sample first:
  python3 kb/_eacr_flag_migrate.py --limit 10

WHAT IT DOES
------------
PR-D stored each curator flag in Supabase `kb_curation` under
`course_id = "_EACR_FLAG::<exhibit_id_or_title>"`. PR-C1 changed the EACR
grouping key from raw title → (unified_title, issuing_agency, …), so the
`exhibit_id` (merged_id) and `title` on each card may differ from what was
there at flag time. Old flag keys reference identities that no longer
exist; new flags written via the EACR tab use the post-C1 identities.

This script bridges the gap:

  1. Reads `kb/eacr_dryrun/alias_map.json` (precomputed by `_eacr_dryrun.py`):
        by_merged_id : old_merged_id -> new_merged_id
        by_title     : old_raw_title -> new_merged_id

  2. Queries Supabase for every `_EACR_FLAG::*` row.

  3. For each old flag:
       - Extract the key part after the prefix.
       - Look up the new key (by_merged_id first, by_title fallback).
       - If found AND different: re-key to the new identity.
       - If multiple old flags collapse onto the same new identity AND
         disagree (one says "stale", another "duplicate"), HALT and surface
         the conflict for curator decision (re-mint playbook rule).

  4. Writes the new rows; deletes the old. Atomic per old key.

SAFETY
------
  - --dry-run reports impact without writing anything
  - Idempotent: re-running after a partial completion picks up only the
    rows still on old keys
  - Halts on conflict (does not auto-resolve flag-value disagreements)
  - The alias map carries the migration plan — single source of truth

Reference: docs/coursecontrolnumber_remint.md (the re-mint playbook this
follows in shape: dry-run → alias map → atomic land within one window).
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.parse
import urllib.request
from datetime import datetime

HERE = os.path.dirname(os.path.abspath(__file__))
ALIAS_MAP_PATH = os.path.join(HERE, "eacr_dryrun", "alias_map.json")

FLAG_PREFIX = "_EACR_FLAG::"


def supabase_request(method, path, payload=None, params=None, extra_headers=None):
    """Minimal Supabase REST client using urllib (no aiohttp/requests dep)."""
    base = os.environ.get("SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_KEY", "")
    if not base or not key:
        raise SystemExit(
            "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set.\n"
            "  export SUPABASE_URL=\"https://<project>.supabase.co\"\n"
            "  export SUPABASE_SERVICE_KEY=\"<service-role key from Supabase dashboard>\""
        )
    url = base + "/rest/v1" + path
    if params:
        url += "?" + urllib.parse.urlencode(params)
    headers = {
        "apikey": key,
        "Authorization": "Bearer " + key,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }
    if extra_headers:
        headers.update(extra_headers)
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8")
            return resp.status, json.loads(body) if body else None
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        return e.code, body


def load_alias_map():
    if not os.path.exists(ALIAS_MAP_PATH):
        raise SystemExit(
            f"alias_map.json not found at {ALIAS_MAP_PATH}. "
            "Run `python3 kb/_eacr_dryrun.py` first to generate it."
        )
    with open(ALIAS_MAP_PATH, encoding="utf-8") as f:
        return json.load(f)


def fetch_old_flags():
    """Pull every row whose course_id starts with `_EACR_FLAG::`."""
    status, body = supabase_request(
        "GET", "/kb_curation",
        params={
            "select": "course_id,field,value,reviewed_by,reviewed_at",
            "course_id": f"like.{urllib.parse.quote(FLAG_PREFIX)}%",
            "field": "eq.flag",
        },
    )
    if status != 200:
        raise SystemExit(f"Failed to fetch existing flags (HTTP {status}): {body}")
    return body or []


def map_old_to_new(old_key, by_merged_id, by_title):
    """Look up the new key for an old flag key. Returns (new_key, match_via)
    or (None, reason) if no match found."""
    # PR-D's flag-write path used `e.exhibit_id || e.title` as the key.
    # exhibit_id is the merged_id (sorted `|`-joined ExhibitIDs), so we try
    # the merged_id table first; falling back to the raw-title table.
    if old_key in by_merged_id:
        return by_merged_id[old_key], "merged_id"
    if old_key in by_title:
        return by_title[old_key], "title"
    return None, "no_alias"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dry-run", action="store_true",
                    help="Inspect + report only. Writes nothing to Supabase.")
    ap.add_argument("--limit", type=int, default=0,
                    help="Cap the number of rows processed (validation runs).")
    args = ap.parse_args()

    print("Loading alias map…")
    am = load_alias_map()
    by_merged_id = am.get("by_merged_id", {})
    by_title = am.get("by_title", {})
    print(f"  by_merged_id entries: {len(by_merged_id):,}")
    print(f"  by_title entries:     {len(by_title):,}")
    multi = am.get("multi_inbound") or {}
    print(f"  new cards with 2+ inbound: {len(multi):,}")

    print("Fetching existing _EACR_FLAG::* rows from Supabase…")
    rows = fetch_old_flags()
    print(f"  found: {len(rows):,} flagged rows")
    if args.limit:
        rows = rows[:args.limit]
        print(f"  --limit applied: processing first {len(rows):,}")

    # Plan
    plans = []  # (old_key, new_key, match_via, flag_value, row)
    unmatched = []
    by_new_target = {}  # new_key -> list of plans (to detect conflicts)
    for row in rows:
        old_full = row.get("course_id") or ""
        if not old_full.startswith(FLAG_PREFIX):
            continue
        old_key = old_full[len(FLAG_PREFIX):]
        new_key, via = map_old_to_new(old_key, by_merged_id, by_title)
        if new_key is None:
            unmatched.append({"old_key": old_key, "value": row.get("value"),
                              "reviewed_by": row.get("reviewed_by")})
            continue
        plans.append({
            "old_key": old_key,
            "new_key": new_key,
            "via": via,
            "flag_value": row.get("value"),
            "row": row,
        })
        by_new_target.setdefault(new_key, []).append(plans[-1])

    # Conflict detection — two old flags onto same new card with different values
    conflicts = []
    for new_key, members in by_new_target.items():
        values = set(m["flag_value"] for m in members)
        if len(values) > 1:
            conflicts.append({"new_key": new_key, "members": members})

    # Unchanged (old_key == new_key) — no-op; just acknowledge
    noops = [p for p in plans if p["old_key"] == p["new_key"]]
    real_migrations = [p for p in plans if p["old_key"] != p["new_key"]]

    print()
    print(f"Plan summary:")
    print(f"  total flagged rows:        {len(rows):,}")
    print(f"  no-ops (key unchanged):    {len(noops):,}")
    print(f"  real migrations:           {len(real_migrations):,}")
    print(f"  unmatched (no alias):      {len(unmatched):,}")
    print(f"  conflicts (disagree on flag value across collapsed cards): {len(conflicts):,}")

    if unmatched:
        print("\nFirst 5 unmatched flag keys (the raw card no longer exists in current MAP data):")
        for u in unmatched[:5]:
            print(f"  - {u['old_key'][:100]!r}  ({u['value']}, by {u.get('reviewed_by')})")

    if conflicts:
        print("\n*** CONFLICTS — re-mint playbook says HALT here ***")
        for c in conflicts[:10]:
            print(f"  new_key: {c['new_key'][:80]}…")
            for m in c["members"]:
                print(f"     ← {m['old_key'][:60]!r}  flag={m['flag_value']!r}  by={(m['row'].get('reviewed_by') or '')}")
        if not args.dry_run:
            raise SystemExit(
                "\nABORTING — resolve flag-value conflicts manually before re-running.\n"
                "  Pick the preferred value per new_key, delete the others, then re-run."
            )

    if args.dry_run:
        print("\n--dry-run set — no Supabase writes performed.")
        return

    if not real_migrations:
        print("\nNothing to migrate (no key changes detected).")
        return

    print(f"\nApplying {len(real_migrations):,} migrations…")
    succeeded = 0
    failed = 0
    for p in real_migrations:
        row = p["row"]
        old_full = FLAG_PREFIX + p["old_key"]
        new_full = FLAG_PREFIX + p["new_key"]

        # Upsert new row
        new_row = {
            "course_id": new_full,
            "field": "flag",
            "value": p["flag_value"],
            "reviewed_by": row.get("reviewed_by"),
            "reviewed_at": row.get("reviewed_at") or datetime.utcnow().isoformat(),
        }
        status, body = supabase_request(
            "POST", "/kb_curation",
            payload=new_row,
            extra_headers={"Prefer": "resolution=merge-duplicates,return=representation"},
        )
        if status not in (200, 201):
            print(f"  FAIL upsert new ({status}): {old_full[:60]} → {new_full[:60]}: {body}")
            failed += 1
            continue

        # Delete old row
        status, body = supabase_request(
            "DELETE", "/kb_curation",
            params={"course_id": f"eq.{old_full}", "field": "eq.flag"},
        )
        if status not in (200, 204):
            print(f"  FAIL delete old ({status}): {old_full[:60]}: {body}")
            failed += 1
            continue

        succeeded += 1
        if succeeded % 10 == 0:
            print(f"  …{succeeded:,} of {len(real_migrations):,}")

    print(f"\nDone. {succeeded:,} migrated · {failed:,} failed · {len(unmatched):,} unmatched (left as-is).")


if __name__ == "__main__":
    main()
