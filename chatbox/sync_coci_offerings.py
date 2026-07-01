#!/usr/bin/env python3
"""chatbox/sync_coci_offerings.py — land the COCI *offerings* catalog into Supabase
so Sierra (the shared cpl-chat function) can see what each college TEACHES.

Reads chatbox/coci_offerings_payload.json (built by build_coci_offerings.py) and
writes via the Supabase SERVICE KEY through the chunkable replace RPCs
(coci_offerings_replace / coci_programs_replace / college_geo_replace). Chunked
because the offerings payload (~16k rows) is too large for one request body:
the FIRST chunk truncates, the rest append.

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
CHUNK = 4000  # rows per request (keeps each body well under PostgREST limits)


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
        raise SystemExit(f"Supabase RPC {fn} → HTTP {e.code}: {detail}")


def _load_chunked(fn, rows, key):
    """Chunked replace: first chunk truncates, the rest append. Returns total inserted."""
    total = 0
    for i in range(0, len(rows), CHUNK):
        chunk = rows[i:i + CHUNK]
        n = _sb_rpc(fn, {"p_rows": chunk, "p_truncate": i == 0}, key)
        total += n or 0
        print(f"    {fn}: +{n} (chunk {i // CHUNK + 1})")
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
    g = _sb_rpc("college_geo_replace", {"p_rows": geo}, key)
    print(f"  ✓ college_geo_replace: {g} rows")
    o = _load_chunked("coci_offerings_replace", off, key)
    print(f"  ✓ coci_offerings_replace: {o} rows total")
    pr = _load_chunked("coci_programs_replace", prog, key)
    print(f"  ✓ coci_programs_replace: {pr} rows total")
    print("\nDone — Sierra's offerings catalog is live.")


if __name__ == "__main__":
    main()
