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
  • the COLUMN NAMES (the fields),
  • the row count,
  • per field: non-null count, value type, value-length range,
  • per field: the DISTINCT VALUES *only* for low-cardinality, NON-PII fields
    (roles / statuses / categories) — so we learn the role vocabulary.

The MAP API is COLUMN-ORIENTED: each dataset is
{viewName, dataCount, columnName:[...field names...], columnValue:[...rows...],
 responseCode, responseMessage}. A request with no columnName returns the field
list but no values, so we do a 2-pass probe: (1) discover columnName, then
(2) re-request WITH those columns to get the rows.

PII safety (load-bearing):
  • Raw names / emails / phones are NEVER printed.
  • Nothing is written to disk (no artifact, no commit).
  • A field's distinct values are shown ONLY when cardinality ≤ MAX_ENUM AND the
    field name isn't on a PII denylist AND no sampled value contains '@'. Staff
    names/emails are ~unique (high cardinality) → always masked.

workflow_dispatch only (.github/workflows/map-users-schema-probe.yml). Does NOT
re-add the view to the daily payload.

Run (on a runner):  python3 map/probe_users_schema.py
"""
import json
import os
import urllib.error
import urllib.request

API_URL = "https://mapwebapinew.azurewebsites.net/api/CustomReport/getReport"
VIEW = "View_CollegeUsersRoles"
PII_NAME_HINT = ("name", "email", "phone", "first", "last", "user", "login", "contact")
MAX_ENUM = 25


def _headers():
    h = {"Content-Type": "application/json"}
    key = os.environ.get("MAP_API_KEY", "").strip()
    if key:
        name = os.environ.get("MAP_API_AUTH_HEADER", "").strip() or "Authorization"
        scheme = os.environ.get("MAP_API_AUTH_SCHEME", "Bearer").strip()
        h[name] = (scheme + " " + key).strip() if scheme else key
    return h


def _post(payload):
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(API_URL, data=body, headers=_headers(), method="POST")
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read())


def _dataset(data):
    if not isinstance(data, list):
        raise SystemExit(f"  ERROR: expected a list of datasets, got {type(data).__name__}")
    ds = next((d for d in data if d.get("viewName") == VIEW), None)
    if ds is None:
        raise SystemExit(f"  ERROR: {VIEW} not in response. Views: "
                         f"{[d.get('viewName') for d in data]}")
    return ds


def _rows(ds, columns):
    """Reconstruct row dicts from the column-oriented {columnValue} shape (a list
    of per-row value-lists aligned to `columns`), or pass through a list-of-dicts."""
    cv = ds.get("columnValue")
    if not isinstance(cv, list) or not cv:
        return []
    if isinstance(cv[0], dict):
        return cv
    if isinstance(cv[0], (list, tuple)):
        return [dict(zip(columns, r)) for r in cv]
    return []


def main():
    print(f"Probing {VIEW} @ {API_URL}")
    print("(PII-safe: no raw names/emails/phones printed; nothing written to disk)")
    try:
        # Pass 1 — discover the field list (no columnName → schema, usually no values).
        ds1 = _dataset(_post([{"viewName": VIEW}]))
        columns = ds1.get("columnName") or []
        print(f"\nresponseCode={ds1.get('responseCode')!r} "
              f"responseMessage={ds1.get('responseMessage')!r} "
              f"dataCount={ds1.get('dataCount')!r}")
        print(f"\n=== {VIEW}: {len(columns)} FIELDS ===")
        print("FIELDS:", columns)

        rows = _rows(ds1, columns)
        if not rows and columns:
            # Pass 2 — re-request WITH the discovered columns to pull the rows.
            print(f"\n(no values in pass 1 — re-requesting with the {len(columns)} columns…)")
            ds2 = _dataset(_post([{"viewName": VIEW, "columnName": columns}]))
            print(f"pass2 dataCount={ds2.get('dataCount')!r} "
                  f"responseCode={ds2.get('responseCode')!r}")
            rows = _rows(ds2, columns)
    except (urllib.error.HTTPError, urllib.error.URLError) as e:
        print(f"  ERROR fetching: {e}")
        raise SystemExit(1)

    if not rows:
        print("\n  No row values returned — field names captured above; "
              "value/role analysis skipped.")
        return

    print(f"\n=== {len(rows):,} rows · per-field (PII-safe) ===")
    for f in columns:
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
