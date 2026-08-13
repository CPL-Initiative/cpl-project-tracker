#!/usr/bin/env python3
"""Publish the peer-articulation layer to Supabase (`chatbox_peer_articulations`).

Companion to `kb/_build_peer_articulations.py`, which does all the judgment; this
script only moves the built rows. Same shape as `_sync_credential_recs.py` so the
three credential syncs run back to back from one workflow.

Run:
    python3 kb/_build_peer_articulations.py
    python3 kb/_sync_peer_articulations.py         # needs SUPABASE_URL + SERVICE_KEY

The sandbox cannot reach *.supabase.co (CLAUDE.md Rule 10c), so this is a
runner/cron path — from a session, load through the Supabase MCP instead.

WHAT THIS PUBLISHES, AND WHY IT IS A FACT RATHER THAN A PROPOSAL
----------------------------------------------------------------
"How did other colleges articulate this same certificate?" — for each credential
and each of its credit recommendations, the peer colleges that earned it and the
exact local course each used. No matching, no scoring: this is looked up, not
inferred, which is why it ships before the alignment scorer.

The alignment half must ship WITH it, never instead of it: title similarity alone
is systematically biased, because colleges routinely articulate a BROADER course
against a specific recommendation (Santa Ana used `WELD 240 Structural Welding
SMAW` for an **FCAW** rec — no lexical matcher proposes that).
`docs/kb-notes/methodology-two-signals-for-a-judgment-proposal.md`.
"""

from __future__ import annotations

import argparse
import json
import os
import urllib.error
import urllib.request

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILT = os.path.join(REPO, "kb", "peer_articulations_payload.json")
TABLE = "chatbox_peer_articulations"
BATCH = 200

# The build emits uniform keys by construction, but assert it rather than trust
# it: PostgREST rejects a bulk payload whose objects differ in shape (PGRST102,
# "All object keys must match") and the failure is POSITIONAL — one odd row in
# 9,000 kills its batch and every batch after it, leaving the table looking
# populated. That is exactly how chatbox_credential_recs landed two-thirds full
# on 2026-08-13.
EXPECTED_KEYS = {
    "unified_title", "credit_rec", "college", "subject", "course_number",
    "course_title", "course_id", "identity_system", "collaborative_type",
    "issuer", "attribution",
}


def load_built(path: str = BUILT) -> list:
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)["peer_articulations"]


def normalize_keys(rows: list) -> list:
    """Give every row the SAME keys, filling absences with None."""
    keys: set = set()
    for r in rows:
        keys.update(r.keys())
    return [{k: r.get(k) for k in sorted(keys)} for r in rows]


def upsert(rows: list, url: str, key: str) -> int:
    endpoint = (f"{url.rstrip('/')}/rest/v1/{TABLE}"
                "?on_conflict=unified_title,credit_rec,college,subject,course_number")
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
        print(f"NOTE: {BUILT} absent — run kb/_build_peer_articulations.py first.")
        return 0

    rows = load_built()

    shapes = {tuple(sorted(r.keys())) for r in rows}
    if len(shapes) != 1 or set(shapes.pop()) != EXPECTED_KEYS:
        raise SystemExit("FATAL: rows are not key-uniform — refusing to publish "
                         "(a positional PGRST102 would leave the table half-loaded).")

    per_course = sum(1 for r in rows if r["attribution"] == "per_course")
    creds = len({r["unified_title"] for r in rows})
    colleges = len({r["college"] for r in rows})

    # This table exists to answer "who else did this, and with which course?".
    # A build that produced no per-course attribution at all would still fill the
    # table and read as healthy while being unable to answer the question.
    if not per_course:
        raise SystemExit("FATAL: no per_course attribution in the build — refusing to publish.")

    print(f"rows: {len(rows)}  (per_course {per_course}, "
          f"group_wide {len(rows) - per_course})  credentials {creds}  colleges {colleges}")
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
