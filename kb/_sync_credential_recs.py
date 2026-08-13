#!/usr/bin/env python3
"""Publish the credit-recommendation layer to Supabase (`chatbox_credential_recs`).

Companion to `kb/_build_credential_recs.py`, which does all the judgment; this
script only moves the built rows. Same shape as `_sync_credential_catalog.py`
so the two can run back to back from the daily workflow.

Run:
    python3 kb/_build_credential_recs.py
    python3 kb/_sync_credential_recs.py            # needs SUPABASE_URL + SERVICE_KEY

The sandbox cannot reach *.supabase.co (CLAUDE.md Rule 10c), so this is a
runner/cron path — from a session, load through the Supabase MCP instead.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILT = os.path.join(REPO, "kb", "credential_recs.json")
TABLE = "chatbox_credential_recs"
BATCH = 200


def load_built(path: str = BUILT) -> list:
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)["rows"]


def upsert(rows: list, url: str, key: str) -> int:
    endpoint = f"{url.rstrip('/')}/rest/v1/{TABLE}?on_conflict=unified_title"
    sent = 0
    for i in range(0, len(rows), BATCH):
        chunk = rows[i:i + BATCH]
        req = urllib.request.Request(
            endpoint,
            data=json.dumps(chunk).encode("utf-8"),
            method="POST",
            headers={
                "apikey": key,
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates,return=minimal",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                if resp.status not in (200, 201, 204):
                    raise SystemExit(f"FATAL: batch {i}: HTTP {resp.status}")
        except urllib.error.HTTPError as exc:
            raise SystemExit(f"FATAL: batch {i}: HTTP {exc.code} {exc.read()[:400]!r}")
        sent += len(chunk)
        print(f"  upserted {sent}/{len(rows)}")
    return sent


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="report, write nothing")
    args = ap.parse_args()

    if not os.path.exists(BUILT):
        print(f"NOTE: {BUILT} absent — run kb/_build_credential_recs.py first.")
        return 0

    rows = load_built()
    sw = [r for r in rows if r["rec_kind"] == "statewide_authoritative"]

    # The statewide sets are the whole reason this table exists. If a source
    # change ever drops them the local sets would still populate the table and
    # it would look healthy while answering POST with one college's wording.
    if not sw:
        raise SystemExit("FATAL: no statewide authoritative sets in the build — refusing to publish.")

    print(f"rows: {len(rows)}  (statewide {len(sw)}, local {len(rows) - len(sw)})")
    if args.dry_run:
        print("dry run — nothing written.")
        return 0

    # Same default as _sync_credential_catalog.py — the two run back to back and
    # must never end up pointed at different projects.
    url = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co")
    key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SERVICE_KEY")
    if not key:
        print("NOTE: SUPABASE_SERVICE_KEY unset — nothing written.")
        return 0

    n = upsert(rows, url, key)
    print(f"done: {n} rows upserted into {TABLE}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
