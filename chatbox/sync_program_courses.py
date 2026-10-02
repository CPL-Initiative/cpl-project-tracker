#!/usr/bin/env python3
"""chatbox/sync_program_courses.py — land the program -> course membership in
Supabase (`coci_program_courses`) so Sierra can list a program's courses.

Reads chatbox/coci_program_courses_payload.json (built by
build_program_courses.py). Public catalog data, no PII; prints only counts.

UPSERT, THEN PRUNE. Every row is upserted under this run's load_id. Then the
loader counts this load's rows, and only if the count is exactly the rows sent
deletes what an earlier load left behind (load_id <> this one). So the table
never holds fewer rows than the last good load: a reader never sees a program
with half its list, which reads as a complete one. A short count deletes
nothing and stops the run; the table then holds this load beside the last one,
a superset. The workflow's concurrency group makes this the only writer.

A RE-SENT BATCH CANNOT DOUBLE. The upsert keys on the primary key, so a batch
re-sent after a gateway error or a statement timeout lands once however many
times it arrives (contrast the MAP loader, whose staging table has no key:
docs/kb-notes/methodology-a-gateway-error-is-not-an-answer.md). A batch is
therefore retried on a 5xx or a 57014, at half the size after a 57014.

Usage (on a runner, or locally with the key):
  python3 chatbox/build_program_courses.py
  python3 chatbox/sync_program_courses.py            # dry run: counts, no write
  python3 chatbox/sync_program_courses.py --apply    # needs SUPABASE_SERVICE_KEY
"""
from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAYLOAD = os.path.join(ROOT, "chatbox", "coci_program_courses_payload.json")
SUPABASE_URL = "https://hvuwhnbuahrtptokpqfh.supabase.co"
TABLE = "coci_program_courses"
CHUNK = 1000
MIN_CHUNK = 250
RETRIES = 3
KEYS = {"college", "program_control_number", "course_control_number", "course_code",
        "course_title", "units", "cid", "course_college", "load_id"}


class _HttpError(Exception):
    def __init__(self, what, code, detail):
        super().__init__(f"{what} -> HTTP {code}: {detail}")
        self.code, self.detail = code, detail


def _request(method, path, body, key, prefer=None):
    """Returns (parsed body or None, the Content-Range header)."""
    headers = {"apikey": key, "Authorization": f"Bearer {key}",
               "Content-Type": "application/json", "Accept": "application/json"}
    if prefer:
        headers["Prefer"] = prefer
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/{path}", data=data,
                                 method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            raw = resp.read()
            return (json.loads(raw) if raw else None), resp.headers.get("Content-Range", "")
    except urllib.error.HTTPError as e:
        detail = ""
        try:
            detail = e.read().decode("utf-8", "replace")[:400]
        except Exception:
            pass
        raise _HttpError(path, e.code, detail)


def _post(path, body, key, prefer=None):
    return _request("POST", path, body, key, prefer)[0]


def range_total(content_range: str) -> int:
    """'0-0/313710' or '*/12' -> the total; PostgREST writes it when asked
    for count=exact."""
    tail = (content_range or "").rsplit("/", 1)[-1]
    if not tail.isdigit():
        raise SystemExit(f"FATAL: no exact count in Content-Range {content_range!r}")
    return int(tail)


# The first statements after a bulk load run beside autovacuum and analyze of
# the table just written. Measured on the first load (run 37047373446,
# 2026-10-02): autovacuum 18:28:38, autoanalyze 18:28:40, and the prune's exact
# count died on the 8 s statement timeout moments later; the same count read
# 93 ms seven minutes after. Both prune statements are safe to repeat (a count
# reads, a delete of earlier loads finds nothing left the second time), so a
# timeout or 5xx on either waits and tries again.
PRUNE_TRIES = 4
PRUNE_WAIT_S = 20


def _patient(request, sleep, method, path, key, prefer):
    for attempt in range(1, PRUNE_TRIES + 1):
        try:
            return request(method, path, None, key, prefer=prefer)
        except _HttpError as e:
            if not is_retryable(e) or attempt == PRUNE_TRIES:
                raise
            wait = PRUNE_WAIT_S * attempt
            print(f"    prune {method}: HTTP {e.code} (try {attempt}/{PRUNE_TRIES}); "
                  f"waiting {wait}s for the table to settle")
            sleep(wait)


def prune(load_id: str, expected: int, key: str, request=_request, sleep=time.sleep) -> int:
    """Count this load's rows; delete the earlier loads' only on an exact match."""
    q = urllib.parse.quote(load_id, safe="")
    _, cr = _patient(request, sleep, "GET", f"{TABLE}?select=college&load_id=eq.{q}&limit=1",
                     key, "count=exact")
    n = range_total(cr)
    if n != expected:
        raise SystemExit(f"prune refused, nothing deleted: load {load_id} holds {n} rows, "
                         f"expected {expected}. The previous load's rows are still there "
                         f"beside this one's, so Sierra reads a superset.")
    _, cr = _patient(request, sleep, "DELETE", f"{TABLE}?load_id=neq.{q}", key,
                     "return=minimal,count=exact")
    return range_total(cr)


def is_timeout(err) -> bool:
    return '"57014"' in err.detail or "statement timeout" in err.detail


def is_retryable(err) -> bool:
    return err.code >= 500 or is_timeout(err)


def with_load_id(rows: list, load_id: str) -> list:
    """Every row carries this run's load_id and the same keys (PostgREST rejects
    a bulk body whose objects differ in shape, PGRST102, and the failure is
    positional: one odd row kills its batch and every batch after it)."""
    out = [dict(r, load_id=load_id) for r in rows]
    for r in out:
        if set(r) != KEYS:
            raise SystemExit(f"FATAL: row keys differ from the table's: {sorted(set(r) ^ KEYS)}")
    return out


def upsert_all(rows: list, key: str, post=_post, sleep=time.sleep) -> int:
    i, size, sent = 0, CHUNK, 0
    tries = 0
    while i < len(rows):
        part = rows[i:i + size]
        try:
            post(f"{TABLE}?on_conflict=college,program_control_number,course_control_number",
                 part, key, prefer="resolution=merge-duplicates,return=minimal")
        except _HttpError as e:
            if is_retryable(e) and tries < RETRIES:
                tries += 1
                if is_timeout(e) and size > MIN_CHUNK:
                    size = max(MIN_CHUNK, size // 2)
                print(f"    {TABLE}: rows {i + 1}-{i + len(part)} -> HTTP {e.code}; "
                      f"re-sending ({tries}/{RETRIES}) at {size} rows — an upsert lands once")
                sleep(5 * tries)
                continue
            raise SystemExit(str(e))
        tries = 0
        sent += len(part)
        i += len(part)
        if (i // CHUNK) % 50 == 0 or i >= len(rows):
            print(f"    {TABLE}: {i} of {len(rows)} upserted")
    return sent


def main() -> int:
    if not os.path.exists(PAYLOAD):
        raise SystemExit(f"payload not found: {PAYLOAD} — run build_program_courses.py first")
    p = json.load(open(PAYLOAD, encoding="utf-8"))
    meta, rows = p["_meta"], p["program_courses"]
    # Digits and a dash only: it travels in a PostgREST filter.
    load_id = (meta["source_as_of"].replace("-", "") + "-"
               + "".join(ch for ch in meta["generated_at"][:19] if ch.isdigit()))
    rows = with_load_id(rows, load_id)
    keys = {(r["college"], r["program_control_number"], r["course_control_number"]) for r in rows}
    if len(keys) != len(rows):
        raise SystemExit(f"FATAL: {len(rows) - len(keys)} duplicate keys in the payload")
    print(f"payload: {len(rows)} rows, {meta['stats']['programs']} programs, "
          f"{meta['stats']['colleges']} colleges; source as of {meta['source_as_of']}; load {load_id}")

    if "--apply" not in sys.argv:
        print("\nDRY RUN — pass --apply to write. Sample row:")
        print("  ", json.dumps(rows[0], ensure_ascii=False)[:300])
        return 0

    key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not key:
        raise SystemExit("SUPABASE_SERVICE_KEY unset — cannot write. (Set it in the workflow env.)")

    print("\nUpserting via service key…")
    sent = upsert_all(rows, key)
    print(f"  ✓ upserted {sent} rows")
    try:
        pruned = prune(load_id, len(rows), key)
    except _HttpError as e:
        raise SystemExit(f"prune failed, read the table before re-running: {e}")
    print(f"  ✓ pruned {pruned} rows an earlier load left behind")
    print("\nDone — Sierra's program course lists are live.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
