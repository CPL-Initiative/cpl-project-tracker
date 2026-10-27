#!/usr/bin/env python3
"""Record which exhibits MAP's public CPL Opportunities page lists, and the college that built each.

WHY. The CPL opportunity workbook on My College (college_cpl_workbook.js) puts a
"Could Adopt - View in MAP" link beside every statewide credit recommendation a
college has not adopted (Ashley, 2026-10-20: "Only include verified, working
links"). MAP's public dashboard has no URL that opens one exhibit card: the
CPL Opportunities page (/insights/exhibit-courses, where Quick Adopt lives)
keeps its search in page state, never in the URL (read from its bundle,
2026-10-20). So the closest verified link is that page plus the exhibit's ID
and title, and "verified" means the page's own API lists that exhibit ID.

The API sends no CORS header, so a COBI page cannot ask it live; this script
asks it once and writes the answer to kb/reference/map_cpl_opportunities_verified.json.
It WRITES NOTHING to MAP and submits nothing (Quick Adopt stays a signed-in
action on MAP itself).

Usage: python3 kb/_verify_map_exhibit_links.py [--statewide statewide_data.js]
       python3 kb/_verify_map_exhibit_links.py --recheck   (ask MAP's search for each ID
       the last run did not find, and for IDs it never checked; no full paging)
"""
import argparse
import json
import os
import re
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
API = "https://cpldashboardcccco.azurewebsites.net/api/collaborative-exhibits"
PAGE_URL = "https://cpldashboardcccco.azurewebsites.net/insights/exhibit-courses"
OUT = os.path.join(HERE, "reference", "map_cpl_opportunities_verified.json")
UA = "cpl-project-tracker map-link-verify/1.0 (CPL Initiative)"


def load_js(path):
    s = open(path, encoding="utf-8").read()
    i = re.search(r"window\.\w+\s*=\s*", s).end()
    return json.JSONDecoder().raw_decode(s[i:])[0]


def fetch(page, size=100):
    """One page, retried; MAP answers an occasional 500 under load."""
    for attempt in range(4):
        try:
            req = urllib.request.Request(f"{API}?page={page}&pageSize={size}", headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=90) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception:
            if attempt == 3:
                raise
            time.sleep(2 ** (attempt + 1))


def search(aid):
    """MAP's own search for one exhibit ID; the row it returns, or None."""
    req = urllib.request.Request(f"{API}?searchTerm={urllib.parse.quote(aid)}&page=1&pageSize=10",
                                 headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=90) as r:
        d = json.loads(r.read().decode("utf-8"))
    for row in d.get("data", []):
        if (row.get("AceID") or "").strip().upper() == aid:
            return row
    return None


def record(row):
    """What the workbook keeps of one listed exhibit: its MAP title and id, and the
    college MAP names as its owner (the `college` field), which the Could Adopt chips show."""
    return {"title": row.get("Title"), "map_id": row.get("id"),
            "college": (row.get("college") or "").strip(), "college_id": row.get("CollegeID")}


def by_title(sw, found):
    """Common title -> its exhibit IDs MAP lists, for the surfaces that name a credential but
    hold no exhibit ID (CPL Pathways, My College, CER; Sam, Open Asks Sheet 134 card 2, "build").
    Builders stay in `found`, so a title's chips read one record per ID."""
    out = {}
    for e in sw["exhibits"]:
        ids = [i.upper() for i in e.get("exhibit_ids", []) if i.upper() in found]
        if ids:
            out.setdefault(e["unified_title"], [])
            out[e["unified_title"]] += [i for i in ids if i not in out[e["unified_title"]]]
    return dict(sorted((t, sorted(v)) for t, v in out.items()))


def write(out):
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=1, ensure_ascii=False)
        f.write("\n")


def retitle(sw):
    """Rebuild by_title from the last run's `found` and today's statewide_data.js, with no call
    to MAP: the daily data can rename a common title between MAP checks."""
    out = json.load(open(OUT, encoding="utf-8"))
    out["by_title"] = by_title(sw, out["found"])
    write(out)
    print(f"{OUT}: by_title rebuilt, {len(out['by_title'])} titles")


def recheck(wanted, sw):
    out = json.load(open(OUT, encoding="utf-8"))
    todo = [i for i in wanted if i not in out["found"]]
    for aid in todo:
        row = search(aid)
        if row:
            out["found"][aid] = record(row)
        time.sleep(0.25)
    out["found"] = dict(sorted(out["found"].items()))
    out["not_found"] = sorted(i for i in wanted if i not in out["found"])
    out["checked"] = len(wanted)
    out["rechecked_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%MZ")
    out["by_title"] = by_title(sw, out["found"])
    write(out)
    print(f"{OUT}: rechecked {len(todo)}; {len(out['found'])} listed, {len(out['not_found'])} not")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--statewide", default=os.path.join(ROOT, "statewide_data.js"))
    ap.add_argument("--recheck", action="store_true")
    ap.add_argument("--retitle", action="store_true")
    a = ap.parse_args()
    sw = load_js(a.statewide)
    if a.retitle:
        retitle(sw)
        return
    # Every exhibit ID the statewide data holds: the workbook links its statewide credit
    # recommendations, and EACR links any exhibit a college could adopt (Sam, 2026-10-26:
    # the MAP link on every public surface that suggests an adoption).
    wanted = {}
    for e in sw["exhibits"]:
        for i in e.get("exhibit_ids", []):
            wanted[i.upper()] = e["unified_title"]
    if a.recheck:
        recheck(wanted, sw)
        return

    listed, total, page, skipped = {}, None, 1, []
    while True:
        try:
            d = fetch(page)
        except Exception:
            # A page MAP cannot serve at 100 rows: read its rows 20 at a time.
            rows = []
            for sub in range((page - 1) * 5 + 1, page * 5 + 1):
                try:
                    rows += fetch(sub, 20)["data"]
                except Exception:
                    skipped.append(f"{sub}x20")
            d = {"data": rows, "pagination": {"totalPages": total or page + 1}}
        total = d["pagination"]["totalPages"]
        for r in d["data"]:
            aid = (r.get("AceID") or "").strip().upper()
            if aid and aid not in listed:
                listed[aid] = record(r)
        if page >= total:
            break
        page += 1
        time.sleep(0.25)

    found = {i: listed[i] for i in wanted if i in listed}
    out = {
        "_about": "Every exhibit ID in statewide_data.js checked against MAP's public CPL Opportunities "
                  "page API. found = listed there, with the college MAP names as each exhibit's owner; the page "
                  "opens searched for an ID with ?Exhibit=<ID> (Malone, 2026-10-26).",
        "_built_by": "kb/_verify_map_exhibit_links.py",
        "checked_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%MZ"),
        "page_url": PAGE_URL,
        "api": API,
        "listed_total": len(listed),
        "checked": len(wanted),
        "found": dict(sorted(found.items())),
        "not_found": sorted(i for i in wanted if i not in listed),
        "pages_unread": skipped,
    }
    out["by_title"] = by_title(sw, out["found"])
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=1, ensure_ascii=False)
        f.write("\n")
    print(f"{OUT}: {len(found)} of {len(wanted)} exhibit IDs listed ({len(listed)} exhibits on the page)")


if __name__ == "__main__":
    main()
