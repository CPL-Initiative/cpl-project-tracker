#!/usr/bin/env python3
"""md5 of a JSON value as Postgres prints it: `select md5(col::text)` on a jsonb column.

    python3 scripts/pg_jsonb_md5.py live_config.json

Why: the sandbox cannot reach *.supabase.co, and a large jsonb value read through the
MCP must never be hand-transcribed into a file (scripts/funding_effective.js). Rebuild
it instead from a committed snapshot plus the committed edit receipts, then compare
this hash with the live `md5(config::text)`. Equal hashes mean the file IS the live
value. jsonb prints object keys shortest first (then bytewise), with ", " between
items and ": " after keys, and non-ASCII as itself. Verified 2026-10-02 (S316): the
e21658f9 fixture plus plans 2026-10-02 and 2026-10-02-2 hashed to the live 764fd264.
See docs/kb-notes/methodology-rebuild-a-jsonb-from-receipts-and-check-its-md5.md.
"""
import hashlib
import json
import sys


def jsonb_text(v):
    if isinstance(v, dict):
        keys = sorted(v, key=lambda k: (len(k.encode()), k.encode()))
        return "{" + ", ".join(json.dumps(k, ensure_ascii=False) + ": " + jsonb_text(v[k]) for k in keys) + "}"
    if isinstance(v, list):
        return "[" + ", ".join(jsonb_text(x) for x in v) + "]"
    if isinstance(v, bool):
        return "true" if v else "false"
    if v is None:
        return "null"
    return json.dumps(v, ensure_ascii=False)


def jsonb_md5(v):
    return hashlib.md5(jsonb_text(v).encode()).hexdigest()


if __name__ == "__main__":
    with open(sys.argv[1], encoding="utf8") as f:
        print(jsonb_md5(json.load(f)))
