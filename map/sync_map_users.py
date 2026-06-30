"""
map/sync_map_users.py — sync MAP "College Users & Roles" into the gated
Supabase table public.map_college_users (StarMax, Session 87).

WHY A RUNNER: the Azure MAP Custom Report API is egress-blocked from the agent
sandbox (runner-as-proxy, like cpl-landing-pages.py / the curation sync). This
fetches View_CollegeUsersRoles_APIDataset with an explicit columnName (no MAP
credential needed — the view is reachable unauthenticated with a column list),
and writes via the Supabase SERVICE KEY through the transactional
map_users_replace() RPC (one atomic delete-all + insert-all).

#1 RULE — PII NEVER LEAVES THE SERVER: this script
  • prints ONLY counts + the (non-PII) RoleName mix — never a name/email/username;
  • writes NOTHING to disk and commits NOTHING;
  • runs only on a runner with SUPABASE_SERVICE_KEY set (the gated table).

The 7 API columns were locked by the value-signature probe (PR #618); MAP is
case-SENSITIVE so the spellings matter. Using an unconfirmed column would 400
the whole request, so this list is exactly the confirmed real columns.

Usage (on a runner):
  python3 map/sync_map_users.py            # dry-run: fetch + summarize, NO write
  python3 map/sync_map_users.py --apply    # write to map_college_users (service key)
"""
import json
import os
import sys
import urllib.error
import urllib.request

MAP_API_URL = "https://mapwebapinew.azurewebsites.net/api/CustomReport/getReport"
MAP_VIEW = "View_CollegeUsersRoles_APIDataset"
SUPABASE_URL = "https://hvuwhnbuahrtptokpqfh.supabase.co"

# API columnName → map_college_users column. CONFIRMED real columns only
# (an unconfirmed name 400s the whole report). MAP is case-sensitive.
FIELD_MAP = [
    ("College",    "college"),
    ("CollegeId",  "college_id"),
    ("FirstName",  "first_name"),
    ("LastName",   "last_name"),
    ("Email",      "email"),
    ("RoleName",   "role_name"),
    ("UserName",   "username"),
]
API_COLUMNS = [a for a, _ in FIELD_MAP]


def _fetch_map_rows():
    """POST the view with the explicit column list; reconstruct row dicts from
    the column-oriented {columnName, columnValue} response."""
    payload = [{"viewName": MAP_VIEW, "columnName": API_COLUMNS}]
    req = urllib.request.Request(
        MAP_API_URL, data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = json.loads(resp.read())
    if not isinstance(data, list) or not data:
        raise SystemExit("MAP API: unexpected response shape (expected a non-empty list).")
    ds = next((d for d in data if d.get("viewName") == MAP_VIEW), data[0])
    code = str(ds.get("responseCode") or "")
    if code not in ("000", "200", "0"):
        raise SystemExit(f"MAP API error: responseCode={code!r} "
                         f"message={ds.get('responseMessage')!r}")
    cols = ds.get("columnName") or API_COLUMNS
    cv = ds.get("columnValue") or []
    rows = []
    for r in cv:
        if isinstance(r, dict):
            api_row = r
        elif isinstance(r, (list, tuple)):
            api_row = dict(zip(cols, r))
        else:
            continue
        rows.append({tgt: api_row.get(api) for api, tgt in FIELD_MAP})
    return rows


def _summarize(rows):
    """PII-SAFE summary: counts + the non-PII RoleName mix only."""
    colleges = {r.get("college") for r in rows if r.get("college")}
    role_mix = {}
    for r in rows:
        role = (r.get("role_name") or "(unspecified)").strip() or "(unspecified)"
        role_mix[role] = role_mix.get(role, 0) + 1
    print(f"  fetched {len(rows):,} user rows across {len(colleges)} colleges")
    print("  RoleName mix (non-PII):")
    for role, n in sorted(role_mix.items(), key=lambda kv: -kv[1]):
        print(f"    - {role}: {n:,}")
    with_email = sum(1 for r in rows if (r.get("email") or "").strip())
    print(f"  rows with an email: {with_email:,}/{len(rows):,}")


def _sb_rpc(fn, body, key):
    """Call a Supabase RPC with the service key. Returns the parsed JSON body.
    On an HTTP error, surface the PostgREST message (the error body describes the
    function/request, not the data rows — no PII; truncated as a guard)."""
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/rpc/{fn}",
        data=json.dumps(body).encode("utf-8"), method="POST",
        headers={"apikey": key, "Authorization": f"Bearer {key}",
                 "Content-Type": "application/json", "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            raw = resp.read()
        return json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        detail = ""
        try:
            detail = e.read().decode("utf-8", "replace")[:400]
        except Exception:
            pass
        raise SystemExit(f"Supabase RPC {fn} → HTTP {e.code}: {detail}")


def main():
    apply = "--apply" in sys.argv[1:]
    print(f"MAP Users sync — {'APPLY' if apply else 'DRY-RUN'} "
          f"(PII-safe: no names/emails/usernames printed; nothing written to disk)")
    rows = _fetch_map_rows()
    if not rows:
        raise SystemExit("No rows returned from the MAP view — aborting (won't wipe the table).")
    _summarize(rows)

    if not apply:
        print("  DRY-RUN — not writing. Re-run with --apply on a runner with "
              "SUPABASE_SERVICE_KEY to refresh map_college_users.")
        return

    key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not key:
        raise SystemExit("SUPABASE_SERVICE_KEY unset — cannot write. (Set it in the workflow env.)")
    n = _sb_rpc("map_users_replace", {"p_rows": rows}, key)
    print(f"  ✓ map_users_replace inserted {n} rows (atomic full refresh).")


if __name__ == "__main__":
    main()
