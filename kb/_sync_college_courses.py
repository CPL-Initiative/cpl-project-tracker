#!/usr/bin/env python3
"""Publish the per-college COURSE CATALOGUE to Supabase (`chatbox_college_courses`).

Companion to `kb/_build_college_courses.py`, which does all the judgment; this
script only moves the built rows. Same shape as `_sync_credential_recs.py` so the
three credential syncs run back to back from one workflow.

Run:
    python3 kb/_build_college_courses.py
    python3 kb/_sync_college_courses.py         # needs SUPABASE_URL + SERVICE_KEY

The sandbox cannot reach *.supabase.co (CLAUDE.md Rule 10c), so this is a
runner/cron path — from a session, load through the Supabase MCP instead.

WHAT THIS PUBLISHES
-------------------
Every COCI course at per-course grain (~141,700 rows, ~120 colleges) so a
college's own course TITLES can be ranked against a credit recommendation.

It does NOT replace `coci_college_offerings` — that rollup answers "does this
college teach construction?" cheaply and is the right instrument for it. This
answers "which exact course of theirs matches this recommendation?", which the
rollup structurally cannot: it caps titles_text at 900 chars and sample_courses
at 8, so Cerritos Welding shows 8 of 121 courses and `WELD 214L` never appears.
"""

from __future__ import annotations

import argparse
import json
import os
import urllib.error
import urllib.request

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILT = os.path.join(REPO, "kb", "college_courses_payload.json")
TABLE = "chatbox_college_courses"
BATCH = 500

# The build emits uniform keys by construction, but assert it rather than trust
# it: PostgREST rejects a bulk payload whose objects differ in shape (PGRST102,
# "All object keys must match") and the failure is POSITIONAL — one odd row in
# 9,000 kills its batch and every batch after it, leaving the table looking
# populated. That is exactly how chatbox_credential_recs landed two-thirds full
# on 2026-08-13.
EXPECTED_KEYS = {
    "college", "subject", "course_number", "course_title", "units",
    "credit_type", "top_code", "top_title", "cid", "control_number",
}


def load_built(path: str = BUILT) -> list:
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)["college_courses"]


def normalize_keys(rows: list) -> list:
    """Give every row the SAME keys, filling absences with None."""
    keys: set = set()
    for r in rows:
        keys.update(r.keys())
    return [{k: r.get(k) for k in sorted(keys)} for r in rows]


def upsert(rows: list, url: str, key: str) -> int:
    endpoint = (f"{url.rstrip('/')}/rest/v1/{TABLE}"
                "?on_conflict=college,subject,course_number,course_title")
    rows = normalize_keys(rows)
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
        print(f"NOTE: {BUILT} absent — run kb/_build_college_courses.py first.")
        return 0

    rows = load_built()

    shapes = {tuple(sorted(r.keys())) for r in rows}
    if len(shapes) != 1 or set(shapes.pop()) != EXPECTED_KEYS:
        raise SystemExit("FATAL: rows are not key-uniform — refusing to publish "
                         "(a positional PGRST102 would leave the table half-loaded).")

    colleges = len({r["college"] for r in rows})
    titled = sum(1 for r in rows if (r.get("course_title") or "").strip())

    # This table exists so a college's own course TITLES can be ranked against a
    # credit recommendation. A build that lost the titles would still fill the
    # table, still count 141k rows, and be unable to align anything.
    if titled != len(rows):
        raise SystemExit(f"FATAL: {len(rows) - titled} rows have no course_title — refusing to publish.")
    # Guard the shape too: the COCI extract covers ~120 colleges. A collapse to a
    # handful means the College column moved or the moji repair broke, which a
    # row count alone would never show.
    if colleges < 100:
        raise SystemExit(f"FATAL: only {colleges} colleges in the build (expected ~120) — refusing to publish.")

    print(f"rows: {len(rows)}  colleges {colleges}")
    if args.dry_run:
        print("dry run — nothing written.")
        return 0

    url = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co")
    key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SERVICE_KEY")
    if not key:
        print("NOTE: SUPABASE_SERVICE_KEY unset — nothing written.")
        return 0

    sent = upsert(rows, url, key)
    # Assert the load against the build. SkyPeak's batch-9 failure left a table
    # two-thirds full and looking populated; only a count comparison catches it.
    print(f"done: {sent} rows sent to {TABLE}")
    if sent != len(rows):
        raise SystemExit(f"FATAL: sent {sent} but built {len(rows)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
