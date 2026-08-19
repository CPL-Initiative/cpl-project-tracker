#!/usr/bin/env python3
"""Guard the one SQL idiom in this repo that silently does nothing.

    python3 tests/supabase_function_grants_test.py

`revoke ... on function f() from anon, authenticated;` READS like it closes a
function to the API roles. It does not. Postgres grants EXECUTE to **PUBLIC** on
every function at creation, anon and authenticated are members of PUBLIC, and
privileges are additive — so revoking from a member role leaves the PUBLIC grant
standing and the function stays callable with the published anon key.

Measured on the live project 2026-08-19: SIX security-definer functions carried
`revoke ... from anon, authenticated` in their .sql and
`has_function_privilege('anon', …)` returned TRUE for every one. Each of them
truncates or drops a live table, including the two the published dashboards
read. The correct form was already in this repo twice
(`cpl_funding_optin_review`, `gr_pass_check`) — it names `public`.

So: every `revoke ... on function` here must name `public`. Naming anon and
authenticated as well is documentation, not protection.
"""

from __future__ import annotations

import glob
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REVOKE = re.compile(r"^revoke\b.*\bon\s+function\b", re.I)

failures: list[str] = []


def statements(sql: str):
    """One statement per `;`, whitespace collapsed. Splitting on the terminator
    rather than regex-matching across the file matters: a pattern that can span
    statements happily swallows a whole function body and reports the wrong
    line."""
    for raw in sql.split(";"):
        line = " ".join(raw.split())
        if line:
            yield line + ";"


for path in sorted(glob.glob(os.path.join(ROOT, "kb", "*.sql"))):
    for stmt in statements(open(path, encoding="utf-8").read()):
        if not REVOKE.match(stmt):
            continue
        parts = stmt.lower().rsplit(" from ", 1)
        if len(parts) != 2:
            failures.append(f"{os.path.basename(path)}: revoke with no FROM: {stmt}")
            continue
        roles = {r.strip().strip(";") for r in parts[1].split(",")}
        if "public" not in roles:
            failures.append(
                f"{os.path.basename(path)}: `{stmt}` does NOT revoke from "
                "PUBLIC, so anon and authenticated keep EXECUTE through the "
                "PUBLIC grant and the statement protects nothing")

if failures:
    print(f"FAIL — {len(failures)} problem(s):")
    for f in failures:
        print(f"  ✗ {f}")
    sys.exit(1)

print("OK — every `revoke ... on function` in kb/*.sql names PUBLIC, which is "
      "the grant that actually holds the door open.")
