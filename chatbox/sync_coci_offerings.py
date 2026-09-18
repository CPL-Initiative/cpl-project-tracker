#!/usr/bin/env python3
"""chatbox/sync_coci_offerings.py — land the COCI *offerings* catalog into Supabase
so Sierra (the shared cpl-chat function) can see what each college TEACHES.

Reads chatbox/coci_offerings_payload.json (built by build_coci_offerings.py) and
writes via the Supabase SERVICE KEY through the chunkable replace RPCs
(coci_offerings_replace / coci_programs_replace / college_geo_replace). Chunked
because the offerings payload (~16k rows) is too large for one request body:
the FIRST chunk truncates, the rest append, and a chunk the database cancels
(57014) is retried at half the size — see _load_chunked for the 2026-09-18
measurement that set the sizes.

Runner-as-proxy pattern (like map/sync_map_users.py / the curation sync). No PII —
these are public course/program catalogs. Prints only counts.

Usage (on a runner, or locally with the key):
  python3 chatbox/build_coci_offerings.py     # build the payload first
  python3 chatbox/sync_coci_offerings.py           # dry-run: report counts, NO write
  python3 chatbox/sync_coci_offerings.py --apply   # write (needs SUPABASE_SERVICE_KEY)
"""
import json
import os
import sys
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAYLOAD = os.path.join(ROOT, "chatbox", "coci_offerings_payload.json")
SUPABASE_URL = "https://hvuwhnbuahrtptokpqfh.supabase.co"
CHUNK = 1000      # rows per request — 4,000 timed out twice on 2026-09-18 (see _load_chunked)
MIN_CHUNK = 250   # the floor a canceled chunk halves down to before the run stops


class _RpcError(Exception):
    """A PostgREST error response: .code is the HTTP status, .detail the body."""

    def __init__(self, fn, code, detail):
        super().__init__(f"Supabase RPC {fn} → HTTP {code}: {detail}")
        self.fn, self.code, self.detail = fn, code, detail


def _is_statement_timeout(err):
    return '"57014"' in err.detail or "statement timeout" in err.detail


def _sb_rpc(fn, body, key):
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/rpc/{fn}",
        data=json.dumps(body).encode("utf-8"), method="POST",
        headers={"apikey": key, "Authorization": f"Bearer {key}",
                 "Content-Type": "application/json", "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            raw = resp.read()
        return json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        detail = ""
        try:
            detail = e.read().decode("utf-8", "replace")[:400]
        except Exception:
            pass
        raise _RpcError(fn, e.code, detail)


def _load_chunked(fn, rows, key, chunk=CHUNK):
    """Chunked replace: the first request truncates, the rest append. Returns the
    total inserted.

    A chunk the database CANCELS is retried at half the size, down to MIN_CHUNK;
    any other error stops the run. Measured 2026-09-18 (runs 35304793635 and
    35305845390): two runs of the 4,000-row chunks died with 57014 — the
    authenticator role's 8 s statement_timeout, which every PostgREST call
    inherits, service key included — on chunks 4 and 3. Each replace RPC is one
    transaction, so the canceled chunk rolled back and the catalog was left LIVE
    at 12,000 and then 8,000 of 16,097 rows, and Sierra answered from it. The GIN
    index on titles_text is what makes a chunk cost seconds; halving the chunk
    halves the statement. A canceled FIRST chunk rolled its truncate back too,
    so the retry truncates again; a canceled later chunk appends on retry.
    """
    total, i, size, truncate = 0, 0, chunk, True
    while i < len(rows):
        part = rows[i:i + size]
        try:
            n = _sb_rpc(fn, {"p_rows": part, "p_truncate": truncate}, key)
        except _RpcError as e:
            if _is_statement_timeout(e) and size > MIN_CHUNK:
                size = max(MIN_CHUNK, size // 2)
                print(f"    {fn}: a {len(part)}-row chunk was canceled (57014); retrying at {size} rows")
                continue
            raise SystemExit(str(e))
        total += n or 0
        print(f"    {fn}: +{n} (rows {i + 1}-{i + len(part)} of {len(rows)})")
        i += len(part)
        truncate = False
    return total


def main():
    apply = "--apply" in sys.argv
    if not os.path.exists(PAYLOAD):
        raise SystemExit(f"payload not found: {PAYLOAD} — run build_coci_offerings.py first")
    p = json.load(open(PAYLOAD, encoding="utf-8"))
    off, prog, geo = p["offerings"], p["programs"], p["geo"]
    print(f"payload: offerings={len(off)} programs={len(prog)} geo={len(geo)} "
          f"(meta: {p['_meta']['course_rows_read']} course rows, {p['_meta']['colleges']} colleges)")

    if not apply:
        print("\nDRY RUN — pass --apply to write. Sample offerings row:")
        print("  ", json.dumps(off[0], ensure_ascii=False)[:300])
        return

    key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not key:
        raise SystemExit("SUPABASE_SERVICE_KEY unset — cannot write. (Set it in the workflow env.)")

    print("\nWriting via service key…")
    try:
        g = _sb_rpc("college_geo_replace", {"p_rows": geo}, key)
    except _RpcError as e:
        raise SystemExit(str(e))
    print(f"  ✓ college_geo_replace: {g} rows")
    o = _load_chunked("coci_offerings_replace", off, key)
    print(f"  ✓ coci_offerings_replace: {o} rows total")
    pr = _load_chunked("coci_programs_replace", prog, key)
    print(f"  ✓ coci_programs_replace: {pr} rows total")
    print("\nDone — Sierra's offerings catalog is live.")


if __name__ == "__main__":
    main()
