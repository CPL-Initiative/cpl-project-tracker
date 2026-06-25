#!/usr/bin/env python3
"""Sync college CPL landing-page links into chatbox_college_profiles.landing_page_url.

SOURCE: the MAP "College Landing Page" API (the same one the public page's
script calls) — a single POST that returns every college's landing URL:

    POST https://map-collegelanding-pages-bkh3ffghf4cqd7fu.westus-01.azurewebsites.net
         /api/mapcollegelanding/GetData      body {}      (no auth)

Each record is {College, CollegeLandingURL} (or {name, url}); the response may be
a bare array or wrapped in {colleges:[…]} / {data:[…]}. Like the page script, we
rewrite the old base `http(s)://map.rccd.edu/cpl-student-portal/<code>` to the
live dashboard base `https://cpldashboardcccco.azurewebsites.net/<code>` and
store that — the exact link the official page's buttons use.

This replaced an earlier scrape of the page HTML, which was reading a STALE
inline fallback blob (2025-08-18); the API is the fresh runtime source.

RUNS ON A RUNNER because the Azure API host is egress-blocked from the agent
sandbox. No browser/WAF handling needed — it's a plain JSON POST. The cpl-chat
Edge Function joins chatbox_college_profiles on the college name to surface these
links in chat answers (live read — no redeploy).

⚠ INTERIM: Sam is adding these URLs to the MAP Custom Report so the daily cron
can publish them with no separate call. When that lands, retire this file +
.github/workflows/cpl-landing-pages.yml and source landing_page_url from there.

Usage: python3 chatbox/scrape_landing_pages.py [--apply] [--url URL]
"""
import argparse
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone

API_URL = ("https://map-collegelanding-pages-bkh3ffghf4cqd7fu.westus-01."
           "azurewebsites.net/api/mapcollegelanding/GetData")
OUT_JSON = os.path.join(os.path.dirname(__file__), "college_landing_pages.json")
SUPABASE_URL = "https://hvuwhnbuahrtptokpqfh.supabase.co"
PROFILE_TABLE = "chatbox_college_profiles"
UA = "cpl-project-tracker landing-sync/1.0"
MIN_RECORDS = 100  # safety: never apply off a truncated response

OLD_BASE_RE = re.compile(r"^https?://map\.rccd\.edu/cpl-student-portal/", re.I)
NEW_BASE = "https://cpldashboardcccco.azurewebsites.net/"
# Placeholder codes in the source that must never overwrite a real URL.
PLACEHOLDER = {"test", "", "chancellor", "dashboard"}
# API college names that differ from the chatbox table name.
NAME_ALIAS = {"Los Angeles Trade-Tech College": "Los Angeles Trade Technical College"}


def fetch_records(url: str):
    req = urllib.request.Request(url, data=b"{}", method="POST", headers={
        "User-Agent": UA, "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        j = json.loads(resp.read().decode("utf-8"))
    if isinstance(j, list):
        rows = j
    elif isinstance(j, dict):
        rows = j.get("colleges") or j.get("data") or []
    else:
        rows = []
    print(f"[api] {resp.status} — {len(rows)} records")
    return rows


def normalize_url(u: str) -> str:
    """Rewrite the old MAP base to the live dashboard base (the page does this),
    then percent-encode the path so a raw space ('EL C') or 'ñ' yields a valid,
    clickable URL — matching the page's rendered (browser-encoded) buttons."""
    u = OLD_BASE_RE.sub(NEW_BASE, (u or "").strip())
    p = urllib.parse.urlsplit(u)
    return urllib.parse.urlunsplit(
        (p.scheme, p.netloc, urllib.parse.quote(p.path), p.query, p.fragment))


def code_of(u: str) -> str:
    return urllib.parse.urlparse(u).path.rstrip("/").rsplit("/", 1)[-1].lower()


def parse_records(rows):
    out, seen = [], set()
    for c in rows:
        name = (c.get("College") or c.get("name") or "").strip()
        raw = (c.get("CollegeLandingURL") or c.get("url") or "").strip()
        if not name or not raw:
            continue
        url = normalize_url(raw)
        if code_of(url) in PLACEHOLDER:
            print(f"[skip] placeholder: {name} -> {url}")
            continue
        name = NAME_ALIAS.get(name, name)
        if name.lower() in seen:
            continue
        seen.add(name.lower())
        out.append({"college": name, "url": url})
    return out


# ── reconcile against the live table ───────────────────────────────────
def nkey(name: str) -> str:
    s = re.sub(r"[^a-z]", "", name.lower())
    return re.sub(r"(communitycollege|college)$", "", s)


def sb(method: str, path: str, key: str, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/{path}", data=data, method=method, headers={
            "apikey": key, "Authorization": f"Bearer {key}",
            "Content-Type": "application/json", "Prefer": "return=minimal"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        raw = resp.read().decode("utf-8")
        return resp.status, (json.loads(raw) if raw.strip() else None)


def reconcile(records, key: str):
    _, profiles = sb("GET", f"{PROFILE_TABLE}?select=college,landing_page_url", key)
    by_nk = {}
    for p in profiles:
        by_nk.setdefault(nkey(p["college"]), p)
    updates, inserts = [], []
    for r in records:
        prof = by_nk.get(nkey(r["college"]))
        if prof:
            if prof.get("landing_page_url") != r["url"]:
                updates.append({"college": prof["college"], "url": r["url"],
                                "old_url": prof.get("landing_page_url")})
        else:
            inserts.append(r)
    return updates, inserts, len(profiles)


def apply(updates, inserts, key: str):
    for u in updates:
        q = urllib.parse.quote(u["college"], safe="")
        sb("PATCH", f"{PROFILE_TABLE}?college=eq.{q}", key, {"landing_page_url": u["url"]})
        print(f"[apply] update {u['college']} -> {u['url']}")
    for i in inserts:
        sb("POST", PROFILE_TABLE, key, {"college": i["college"], "landing_page_url": i["url"]})
        print(f"[apply] insert {i['college']} -> {i['url']}")
    return len(updates), len(inserts)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default=API_URL)
    ap.add_argument("--apply", action="store_true",
                    help="write changes to chatbox_college_profiles")
    args = ap.parse_args()

    records = parse_records(fetch_records(args.url))
    records.sort(key=lambda r: r["college"].lower())
    print(f"[parse] {len(records)} landing records")
    # A page-side data error puts a bare domain in the slug (e.g. Cerritos).
    flagged = [r["college"] for r in records
               if re.search(r"/(www\.|[^/]+\.(edu|com|org))$", r["url"], re.I)]
    if flagged:
        print("[flag] page-side broken slugs (report to MAP):", flagged)

    payload = {
        "_source": args.url,
        "_scraped_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "_note": ("Landing links from the MAP College Landing Page API, base "
                  "rewritten to cpldashboardcccco/<code>. INTERIM — superseded "
                  "by the MAP Custom Report when it carries landing URLs."),
        "_count": len(records),
        "_flagged_page_errors": flagged,
        "records": records,
    }
    if len(records) < MIN_RECORDS:
        payload["_error"] = f"only {len(records)} records (<{MIN_RECORDS}) — not applying"
        print(f"::error::{payload['_error']}")

    key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if key and len(records) >= MIN_RECORDS:
        updates, inserts, n_prof = reconcile(records, key)
        payload["reconciliation"] = {"profile_rows": n_prof,
                                     "would_update": len(updates),
                                     "would_insert": len(inserts)}
        payload["updates"], payload["inserts"] = updates, inserts
        print(f"[reconcile] {len(updates)} update, {len(inserts)} insert "
              f"({len(records)} records vs {n_prof} rows)")
        if args.apply:
            nu, ni = apply(updates, inserts, key)
            payload["_applied"] = {"updated": nu, "inserted": ni,
                                   "at": datetime.now(timezone.utc).isoformat(timespec="seconds")}
            print(f"[apply] updated {nu}, inserted {ni}")
        else:
            print("[apply] dry-run (pass --apply to write)")
    elif not key:
        print("[reconcile] SUPABASE_SERVICE_KEY unset — fetch only")

    with open(OUT_JSON, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2, ensure_ascii=False)
        fh.write("\n")
    print(f"[write] {OUT_JSON}")
    if len(records) < MIN_RECORDS:
        sys.exit(1)


if __name__ == "__main__":
    main()
