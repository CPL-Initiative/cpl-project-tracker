"""
map/probe_users_schema.py — PII-SAFE one-off schema probe for the MAP user/contact views
========================================================================================
MAP "College Users & Roles" (the user roster a COBI MAP-Users tab would manage)
is category #9 of the MAP Custom Reporting Module. It — and "College Contacts"
(needed later for the per-college refresh *nudge*) — were deliberately DROPPED
from the daily fetch (PII data-minimization, Session 34) so staff names/emails
never land on the Action runner or the public repo. Before designing a *gated*
user-management tab we need their SCHEMA — the exact fields + the role vocabulary.

This probe fetches ONLY those views on a GitHub Actions runner (the Azure MAP
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

View-NAME resolution (the Session-86 probe bug): every valid MAP view name ends
in the **`_APIDataset`** suffix (see fetch_custom_report.py — `View_*_APIDataset`).
A bare `View_CollegeUsersRoles` returns responseCode 400 "… is not Valid". So we
try a small CANDIDATE list per logical view and use the first the API accepts.

PII safety (load-bearing):
  • Raw names / emails / phones are NEVER printed.
  • Nothing is written to disk (no artifact, no commit).
  • A field's distinct values are shown ONLY when cardinality ≤ MAX_ENUM AND the
    field name isn't on a PII denylist AND no sampled value contains '@'. Staff
    names/emails are ~unique (high cardinality) → always masked.

workflow_dispatch only (.github/workflows/map-users-schema-probe.yml). Does NOT
re-add any view to the daily payload.

Run (on a runner):  python3 map/probe_users_schema.py
"""
import json
import os
import urllib.error
import urllib.request

API_URL = "https://mapwebapinew.azurewebsites.net/api/CustomReport/getReport"

# Each logical view → candidate viewName strings to try, MOST-LIKELY first.
# Valid MAP views carry the `_APIDataset` suffix; the bare name is kept as a
# fallback in case this view follows the `_Dataset` exception (View_ExhibitCRsCatalog_Dataset).
VIEW_SETS = [
    ("College Users & Roles", [
        "View_CollegeUsersRoles_APIDataset",
        "View_CollegeUsersandRoles_APIDataset",
        "View_CollegeUserRoles_APIDataset",
        "View_CollegeUsersRoles_Dataset",
        "View_CollegeUsersRoles",
    ]),
    ("College Contacts", [
        "View_CollegeContacts_APIDataset",
        "View_CollegeContacts_Dataset",
        "View_CollegeContacts",
    ]),
]

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


def _dataset(data, view):
    if not isinstance(data, list):
        raise SystemExit(f"  ERROR: expected a list of datasets, got {type(data).__name__}")
    ds = next((d for d in data if d.get("viewName") == view), None)
    # Some responses echo a single dataset without matching viewName — fall back to [0].
    if ds is None and data:
        ds = data[0]
    return ds


def _is_valid(ds):
    """The API returns responseCode 400 + '… is not Valid' for an unknown viewName."""
    if ds is None:
        return False
    code = str(ds.get("responseCode") or "")
    msg = str(ds.get("responseMessage") or "")
    if "not valid" in msg.lower():
        return False
    if code and code not in ("200", "0", ""):
        return False
    return bool(ds.get("columnName"))


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


# Non-PII columns near-certain to exist on a per-college user/contact view — used
# ONLY as a *reachability* seed when the no-columnName discovery 500s, to tell
# "view needs an explicit column list" apart from "view is auth-gated".
SEED_COLUMNS = ["College"]


def _try(view, column_name=None):
    """One POST. Returns {http, ds} (http=200 + ds on success; http=code, ds=None
    on an HTTPError; http=None on a URLError)."""
    payload = {"viewName": view}
    if column_name:
        payload["columnName"] = column_name
    try:
        return {"http": 200, "ds": _dataset(_post([payload]), view)}
    except urllib.error.HTTPError as e:
        return {"http": e.code, "ds": None, "err": str(e)}
    except urllib.error.URLError as e:
        return {"http": None, "ds": None, "err": str(e)}


def _resolve(label, candidates):
    """Try each candidate viewName (pass 1, no columnName); return (view, columns, ds)
    for the first the API ACCEPTS. A clean 400 '… is not Valid' = wrong name → next.
    An HTTP 500 = the name is RECOGNIZED but the server errored building the report
    without columns → seed-probe with SEED_COLUMNS to classify auth-gated vs
    needs-columns, then report. Returns (None, [], None) if nothing was accepted."""
    print(f"\n########## {label} ##########")
    recognized = None  # first candidate that 500'd (recognized name, blocked)
    for view in candidates:
        r = _try(view)
        if r["http"] == 200 and _is_valid(r["ds"]):
            cols = r["ds"].get("columnName") or []
            print(f"  ✓ {view}: VALID — {len(cols)} fields "
                  f"(responseCode={r['ds'].get('responseCode')!r} "
                  f"dataCount={r['ds'].get('dataCount')!r})")
            return view, cols, r["ds"]
        if r["http"] in (500, 502, 503):
            # Recognized name (the validity check passed) but the no-column build
            # errored server-side. Not "is not Valid" — keep it as the real name.
            print(f"  ⚠ {view}: HTTP {r['http']} (RECOGNIZED name — server errored "
                  f"building report without columns)")
            recognized = recognized or view
            continue
        if r["http"] != 200:
            print(f"  ✗ {view}: ERROR fetching: HTTP {r['http']}")
            continue
        ds = r["ds"]
        print(f"  ✗ {view}: responseCode={ds.get('responseCode')!r} "
              f"responseMessage={ds.get('responseMessage')!r}")

    if recognized:
        # Reachability seed: name a non-PII column and see if the server returns
        # data. Success → view works WITH columns (just no self-describe); still
        # 500/4xx → likely auth-gated (needs MAP_API_KEY) or otherwise blocked.
        print(f"  → recognized name '{recognized}' but no-column discovery failed. "
              f"Seed-probing with columnName={SEED_COLUMNS} …")
        seed = _try(recognized, SEED_COLUMNS)
        if seed["http"] == 200 and seed["ds"]:
            ds = seed["ds"]
            rows = _rows(ds, SEED_COLUMNS)
            print(f"    seed responseCode={ds.get('responseCode')!r} "
                  f"dataCount={ds.get('dataCount')!r} rows={len(rows)}")
            if rows:
                print(f"    → REACHABLE with an explicit column list "
                      f"(no auth needed). Field NAMES still need the MAP Custom "
                      f"Report Builder UI or the no-column discovery (auth?).")
            else:
                print("    → accepted the column but returned no rows.")
        else:
            print(f"    seed HTTP {seed['http']} → still blocked. Likely AUTH-GATED "
                  f"(set MAP_API_KEY) — consistent with these being the PII views.")
        return None, [], None

    print(f"  → no candidate accepted for {label}.")
    return None, [], None


def _analyze(view, columns, ds1):
    print(f"\n=== {view}: {len(columns)} FIELDS ===")
    print("FIELDS:", columns)

    rows = _rows(ds1, columns)
    if not rows and columns:
        # Pass 2 — re-request WITH the discovered columns to pull the rows.
        print(f"\n(no values in pass 1 — re-requesting with the {len(columns)} columns…)")
        try:
            ds2 = _dataset(_post([{"viewName": view, "columnName": columns}]), view)
            print(f"pass2 dataCount={ds2.get('dataCount')!r} "
                  f"responseCode={ds2.get('responseCode')!r}")
            rows = _rows(ds2, columns)
        except (urllib.error.HTTPError, urllib.error.URLError) as e:
            print(f"  ERROR fetching pass 2: {e}")

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


def main():
    print(f"Probing MAP user/contact views @ {API_URL}")
    print("(PII-safe: no raw names/emails/phones printed; nothing written to disk)")
    for label, candidates in VIEW_SETS:
        view, columns, ds1 = _resolve(label, candidates)
        if view:
            _analyze(view, columns, ds1)
    print("\nDone. No raw names/emails/phones printed; nothing written to disk.")


if __name__ == "__main__":
    main()
