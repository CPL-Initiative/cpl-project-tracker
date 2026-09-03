"""
Re-key the LIVE Supabase public.kb_curation table from a committed alias map.

The Rule-7 re-mint playbook re-keys the git overlay (kb/coci_curation.json) AND
the live Supabase source-of-truth in the same cron window. The git side is
deterministic + offline (the *_apply.py scripts). THIS script is the Supabase
side: it reads a committed alias_map.json and applies the same old→new key
rewrite to kb_curation, so the daily cron's Supabase→git rebuild produces the
re-keyed overlay.

Why a script (not hand-run SQL via the MCP): a re-mint alias map is thousands of
arbitrary pairs — far too large to pass faithfully into a one-off SQL string.
Reading the committed file is exact and reusable for every future re-mint.

Why a workflow (not a local session run): the service-role key lives only in
GitHub Actions secrets (SUPABASE_SERVICE_KEY). Run via .github/workflows/
supabase-rekey.yml (workflow_dispatch).

Two rewrite classes, both idempotent (re-run only touches rows still on the old
key — a clean bijection, so re-running is a safe no-op). A CHAINED map (one
pair's old key is another pair's new key) is applied in `order_pairs` order —
the pair vacating the shared key first — and that key is excluded from the
verify, since rows legitimately sit on it afterwards (2026-09-03).
  1. self-keyed rows:  course_id  old → new
  2. merge_into ptrs:  value      old → new   (field = 'merge_into')

Alias map format (the *_dryrun.py / *_apply.py receipt):
  { "aliases": { "<old_id>": { "new_id": "<new>", ... }, ... } }

Env:
  SUPABASE_URL          (default https://hvuwhnbuahrtptokpqfh.supabase.co)
  SUPABASE_SERVICE_KEY  (required for the live re-key; service_role / secret key)

Run:
  python3 kb/_rekey_kb_curation_supabase.py <alias_map.json>            # live re-key
  python3 kb/_rekey_kb_curation_supabase.py <alias_map.json> --check    # offline: load + count only
"""
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

URL = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co").rstrip("/")
KEY = os.environ.get("SUPABASE_SERVICE_KEY")
ENDPOINT = f"{URL}/rest/v1/kb_curation"


def load_alias(path):
    with open(path, encoding="utf-8") as f:
        doc = json.load(f)
    aliases = doc.get("aliases", doc)
    pairs = {}
    for old, v in aliases.items():
        new = v["new_id"] if isinstance(v, dict) else v
        if new and new != old:
            pairs[old] = new
    return pairs


def order_pairs(pairs):
    """The apply order for a CHAINED alias map. When one pair's OLD key is another
    pair's NEW key (2026-09-03: `ARME M10AJ -> FLNG M10AJ` beside
    `ARMN M10AJ -> ARME M10AJ`), the pair that vacates the shared key must run
    first, or the rows arriving on it get rewritten a second time and land on
    the wrong key. Rank = hops downstream; ascending rank vacates before it
    fills. A cycle (a swap) has no safe order without a temporary key: abort."""
    rank = {}

    def _rank(old, trail=()):
        if old in rank:
            return rank[old]
        if old in trail:
            raise SystemExit(f"ABORT — the alias map cycles through {old!r}; a swap needs a temporary key.")
        new = pairs[old]
        rank[old] = (_rank(new, trail + (old,)) + 1) if new in pairs else 0
        return rank[old]

    for old in pairs:
        _rank(old)
    return sorted(pairs.items(), key=lambda kv: (rank[kv[0]], kv[0]))


def verify_surface(pairs):
    """(old keys that must be EMPTY after the re-key, chained keys). An old key
    that is also some pair's new key legitimately carries rows afterwards —
    counting it as a leftover is the false positive that failed run
    33802936877 (2026-09-03) with '2 rows still carry an old key' when every
    row was where the map put it."""
    new_keys = set(pairs.values())
    return [k for k in pairs if k not in new_keys], sorted(k for k in pairs if k in new_keys)


def _req(method, qs, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(f"{ENDPOINT}?{qs}", data=data, method=method, headers={
        "apikey": KEY, "Authorization": f"Bearer {KEY}",
        "Content-Type": "application/json", "Prefer": "return=minimal"})
    last = None
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.status
        except urllib.error.HTTPError as e:
            last = f"HTTP {e.code}: {e.read().decode()[:200]}"
            if e.code in (429, 500, 502, 503, 504):
                time.sleep(2 ** attempt)
                continue
            raise SystemExit(f"ABORT — {method} {qs[:80]}: {last}")
        except Exception as e:                       # transient network
            last = str(e)
            time.sleep(2 ** attempt)
    raise SystemExit(f"ABORT — {method} {qs[:80]} after retries: {last}")


def _count(qs):
    req = urllib.request.Request(f"{ENDPOINT}?{qs}", headers={
        "apikey": KEY, "Authorization": f"Bearer {KEY}",
        "Range-Unit": "items", "Range": "0-0", "Prefer": "count=exact"})
    with urllib.request.urlopen(req, timeout=30) as r:
        cr = r.headers.get("Content-Range", "*/0")    # e.g. "0-0/4053"
        return int(cr.split("/")[-1]) if "/" in cr else 0


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    check = "--check" in sys.argv
    if not args:
        sys.exit("usage: python3 kb/_rekey_kb_curation_supabase.py <alias_map.json> [--check]")
    pairs = load_alias(args[0])
    print(f"alias map: {len(pairs)} old→new pairs from {args[0]}")
    old_only, chained = verify_surface(pairs)
    if chained:
        print(f"chained keys (old AND new — rows legitimately remain on them): {', '.join(chained)}")
    if check:
        ordered = order_pairs(pairs)
        print(f"--check: alias map loads OK; {len(ordered)} pairs in apply order, "
              f"{len(old_only)} old keys on the verify surface; no Supabase writes.")
        return
    if not KEY:
        sys.exit("Set SUPABASE_SERVICE_KEY (service_role key) to run the live re-key.")

    print(f"re-keying {len(pairs)} self-keyed rows + their merge_into pointers …")
    n_self = n_ptr = 0
    for i, (old, new) in enumerate(order_pairs(pairs), 1):
        o = urllib.parse.quote(old, safe="")
        # 1. self-keyed rows: course_id old → new
        _req("PATCH", f"course_id=eq.{o}", {"course_id": new})
        n_self += 1
        # 2. merge_into pointers: value old → new
        _req("PATCH", f"field=eq.merge_into&value=eq.{o}", {"value": new})
        n_ptr += 1
        if i % 500 == 0:
            print(f"  … {i}/{len(pairs)}")
    print(f"PATCHed {n_self} self-key filters + {n_ptr} merge_into filters.")

    # verify: 0 of the alias map's OLD keys remain on the re-key surface — generic
    # since 2026-09-03 (the authority recode + Z-band retirement receipts); the
    # first receipt's `UC-CUR-*` shape was a special case of this.
    left_keys, left_ptrs = _count_old_keys(old_only)
    print(f"VERIFY — old self-keys left: {left_keys} | old merge_into pointers left: {left_ptrs}"
          + (f" (over {len(old_only)} old keys; {len(chained)} chained keys excluded)" if chained else ""))
    if left_keys or left_ptrs:
        sys.exit(f"ABORT — {left_keys + left_ptrs} rows still carry an old key after the re-key.")
    print(f"✓ Supabase kb_curation re-keyed — none of the {len(old_only)} old keys remain on the re-key surface.")


def _in_list(keys):
    """PostgREST `in.(...)` list: each key double-quoted (they carry spaces),
    then URL-encoded."""
    return "in.(" + ",".join(urllib.parse.quote('"' + k.replace('"', '\\"') + '"', safe="") for k in keys) + ")"


def _count_old_keys(old_keys, chunk=200):
    """(self-keyed rows, merge_into pointers) still on any of the old keys."""
    keys = ptrs = 0
    for i in range(0, len(old_keys), chunk):
        part = old_keys[i:i + chunk]
        keys += _count("course_id=" + _in_list(part))
        ptrs += _count("field=eq.merge_into&value=" + _in_list(part))
    return keys, ptrs


if __name__ == "__main__":
    main()
