"""
map/probe_users_schema.py — PII-SAFE one-off schema probe for View_CollegeUsersRoles
====================================================================================
MAP "College Users & Roles" (the user roster a COBI MAP-Users tab would manage)
is category #9 of the MAP Custom Reporting Module. It was deliberately DROPPED
from the daily fetch (PII data-minimization, Session 34) so staff names/emails
never land on the Action runner or the public repo. Before designing a *gated*
user-management tab we need its SCHEMA — the exact fields + the role vocabulary.

This probe fetches ONLY that one view on a GitHub Actions runner (the Azure MAP
API is egress-blocked from the agent sandbox) and prints, to the Actions log:
  • the COLUMN NAMES (the ~11 fields),
  • the row count,
  • per field: non-null count, value type, value-length range,
  • per field: the DISTINCT VALUES *only* for low-cardinality, NON-PII fields
    (roles / statuses / categories) — so we learn the role vocabulary.

PII safety (load-bearing):
  • Raw names / emails / phones are NEVER printed.
  • Nothing is written to disk (no artifact, no commit).
  • A field's distinct values are shown ONLY when cardinality ≤ MAX_ENUM AND the
    field name isn't on a PII denylist AND no sampled value contains '@'. Staff
    names/emails are ~unique (high cardinality) → always masked.

This is a controlled ONE-OFF (workflow_dispatch only,
.github/workflows/map-users-schema-probe.yml). It does NOT re-add the view to
the daily payload (fetch_custom_report.py REQUEST_PAYLOAD stays minimized).

Run (on a runner):  python3 map/probe_users_schema.py
"""
import json
import os
import urllib.error
import urllib.request

API_URL = "https://mapwebapinew.azurewebsites.net/api/CustomReport/getReport"
VIEW = "View_CollegeUsersRoles"
# Field-name substrings that mark a field as PII → never enumerate its values.
PII_NAME_HINT = ("name", "email", "phone", "first", "last", "user", "login", "contact")
MAX_ENUM = 25  # show distinct values only for low-cardinality (enum-like) fields


def _headers():
    """Content-Type + the optional MAP_API_KEY (no-op today; the endpoint is
    unauthenticated). Mirrors fetch_custom_report.py so it survives MAP's auth
    rollout without an edit."""
    h = {"Content-Type": "application/json"}
    key = os.environ.get("MAP_API_KEY", "").strip()
    if key:
        name = os.environ.get("MAP_API_AUTH_HEADER", "").strip() or "Authorization"
        scheme = os.environ.get("MAP_API_AUTH_SCHEME", "Bearer").strip()
        h[name] = (scheme + " " + key).strip() if scheme else key
    return h


def main():
    body = json.dumps([{"viewName": VIEW}]).encode("utf-8")
    req = urllib.request.Request(API_URL, data=body, headers=_headers(), method="POST")
    print(f"Probing {VIEW} @ {API_URL}")
    print("(PII-safe: no raw names/emails/phones printed; nothing written to disk)")
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read())
    except (urllib.error.HTTPError, urllib.error.URLError) as e:
        print(f"  ERROR fetching: {e}")
        raise SystemExit(1)

    if not isinstance(data, list):
        print(f"  ERROR: expected a list of datasets, got {type(data).__name__}")
        raise SystemExit(1)
    ds = next((d for d in data if d.get("viewName") == VIEW), None)
    if ds is None:
        print(f"  ERROR: {VIEW} not in response. Views returned: "
              f"{[d.get('viewName') for d in data]}")
        raise SystemExit(1)

    # Find the rows list (auto-detect the row key, whatever it's called).
    rows = None
    for v in ds.values():
        if isinstance(v, list) and v and isinstance(v[0], dict):
            rows = v
            break
    if not rows:
        print(f"  {VIEW}: dataCount={ds.get('dataCount')} but no row list found. "
              f"Dataset keys: {list(ds.keys())}")
        raise SystemExit(1)

    # Field order = first-seen across rows (handles rows with missing keys).
    fields = []
    for r in rows:
        for k in r.keys():
            if k not in fields:
                fields.append(k)

    print(f"\n=== {VIEW}: {len(rows):,} rows · {len(fields)} fields ===")
    print("FIELDS:", fields)
    print("\nPer-field (PII-safe):")
    for f in fields:
        vals = [r.get(f) for r in rows]
        nonnull = [v for v in vals if v not in (None, "")]
        types = sorted({type(v).__name__ for v in nonnull}) or ["null"]
        lens = [len(str(v)) for v in nonnull]
        lo, hi = (min(lens), max(lens)) if lens else (0, 0)
        distinct = {str(v) for v in nonnull}
        looks_pii = (any(h in f.lower() for h in PII_NAME_HINT)
                     or any("@" in str(v) for v in nonnull[:200]))
        if len(distinct) <= MAX_ENUM and not looks_pii:
            tail = "values=" + json.dumps(sorted(distinct), ensure_ascii=False)
        else:
            tail = f"distinct≈{len(distinct)} (MASKED — high-cardinality or PII)"
        print(f"  - {f}: nonnull={len(nonnull)}/{len(rows)} "
              f"type={','.join(types)} len[{lo}..{hi}] {tail}")

    print("\nDone. No raw names/emails/phones printed; nothing written to disk.")


if __name__ == "__main__":
    main()
