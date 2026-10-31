#!/usr/bin/env python3
"""map/sync_landing_contacts.py — mirror the contacts each college's MAP landing
page lists into the gated table public.map_landing_contacts (SkyCloudberry,
2026-10-31).

WHY: Sam, 2026-10-31, on the funding tab's requests: "check if they are listed
on the college landing page and give info on that as well". The landing page
(cpldashboardcccco.azurewebsites.net/<slug>) is a client-rendered app that reads
its sidebar contacts from the public JSON api/ui-settings/<slug>; a browser on
GitHub Pages cannot read it (no CORS header), so this runs on the MAP users
sync's runner and cpl_funding_requester_context() matches requesters against it.

SOURCE OF SLUGS: chatbox/college_landing_pages.json (the weekly
cpl-landing-pages sync), the last path segment of each record's url.

  • prints ONLY counts and the contact-title mix, never a name or an email;
  • writes nothing to disk and commits nothing;
  • --apply writes through map_landing_contacts_replace() (one atomic
    delete-all + insert-all) with SUPABASE_SERVICE_KEY, and refuses when fewer
    than MIN_PAGES pages answered, so a bad night never empties the mirror.

Usage:
  python3 map/sync_landing_contacts.py            # dry run: fetch + summarize
  python3 map/sync_landing_contacts.py --apply    # write (service key)
"""
import argparse
import collections
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
LANDING_JSON = os.path.join(HERE, "..", "chatbox", "college_landing_pages.json")
UI_SETTINGS = "https://cpldashboardcccco.azurewebsites.net/api/ui-settings/"
SUPABASE_URL = "https://hvuwhnbuahrtptokpqfh.supabase.co"
UA = "cpl-project-tracker landing-contacts/1.0"
MIN_PAGES = 80


def slugs():
    with open(LANDING_JSON, encoding="utf-8") as f:
        recs = json.load(f).get("records") or []
    out = []
    for r in recs:
        path = urllib.parse.urlsplit(r.get("url") or "").path.strip("/")
        s = urllib.parse.unquote(path.split("/")[-1]) if path else ""
        if s and s not in out:
            out.append(s)
    return out


def fetch(slug):
    url = UI_SETTINGS + urllib.parse.quote(slug)
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        j = json.loads(resp.read() or "null")
    return j[0] if isinstance(j, list) and j else (j if isinstance(j, dict) else None)


NOT_A_NAME = re.compile(r"^(n/?a|tbd|tba|none|vacant|-+)$", re.I)
EMAIL = re.compile(r"[A-Za-z0-9._%+'-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")


def split_names(s):
    """One cell, one person each: colleges type "A & B", "A and B", "A; B" or
    "A, B" (a comma splits only when both sides read as full names, so
    "Torres-Benavides, Cari M" stays one person)."""
    parts = re.split(r"\s*(?:&|;|/|\band\b|\n)\s*", s or "")
    out = []
    for p in parts:
        bits = [b.strip() for b in p.split(",")]
        if len(bits) > 1 and all(len(b.split()) >= 2 for b in bits):
            out.extend(bits)
        else:
            out.append(p.strip())
    return [p for p in out if p and not NOT_A_NAME.match(p)]


def rows_for(slug, page):
    """The page's contacts that carry a name, one row per person, in the page's
    own order. Emails pair with names by position when the counts agree, a
    lone email goes with a lone name, and otherwise the row holds none."""
    col = page.get("College") or {}
    college = (col.get("College") or "").strip()
    cid = col.get("CollegeID") or page.get("CollegeID")
    out = []
    if not college:
        return out
    for c in page.get("Contacts") or []:
        names = split_names((c.get("ContactName") or "").strip())
        emails = EMAIL.findall(c.get("ContactEmail") or "")
        for i, name in enumerate(names):
            em = emails[i] if len(emails) == len(names) else ""
            out.append({"slug": slug, "map_college_id": cid if isinstance(cid, int) else None,
                        "college": college, "contact_title": (c.get("ContactTitle") or "").strip(),
                        "contact_name": name, "contact_email": em,
                        "contact_order": c.get("ContactOrder") if isinstance(c.get("ContactOrder"), int) else None})
    return out


def collect():
    rows, answered, failed = [], 0, 0
    for s in slugs():
        try:
            page = fetch(s)
        except Exception:
            failed += 1
            continue
        if not page:
            failed += 1
            continue
        answered += 1
        rows.extend(rows_for(s, page))
        time.sleep(0.1)
    return rows, answered, failed


def apply(rows, key):
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/rpc/map_landing_contacts_replace",
        data=json.dumps({"p_rows": rows}).encode("utf-8"), method="POST",
        headers={"apikey": key, "Authorization": f"Bearer {key}",
                 "Content-Type": "application/json", "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return json.loads(resp.read() or "null")
    except urllib.error.HTTPError as e:
        raise SystemExit(f"map_landing_contacts_replace → HTTP {e.code}: {e.read().decode('utf-8', 'replace')[:300]}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    a = ap.parse_args()
    rows, answered, failed = collect()
    mix = collections.Counter(r["contact_title"] or "(no title)" for r in rows)
    print(f"[landing] {answered} pages answered, {failed} failed, {len(rows)} named contacts")
    for t, n in mix.most_common(12):
        print(f"  {n:4d}  {t}")
    if not a.apply:
        print("dry run: nothing written")
        return
    if answered < MIN_PAGES:
        sys.exit(f"refusing to apply: only {answered} pages answered (< {MIN_PAGES})")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not key:
        sys.exit("SUPABASE_SERVICE_KEY is not set")
    print(f"[apply] map_landing_contacts: {apply(rows, key)} rows")


if __name__ == "__main__":
    main()
