#!/usr/bin/env python3
"""How well the no-closed-list lookup's matcher finds a program by title and award, measured on the programs
whose page we already know (S652; #3299 slice A).

The capture looks up a program with no closed list by title and award (ncl_lookup in
kb/_program_requirements_college.py). Before it does, it tries the matcher on the college's closed-list
programs: each looked up as if it had no list, against the pages read (ncl_self_test). This script runs the
same test on the committed captures, so the matcher's recall and its false matches can be read college by
college without a page load: each closed-list program's filed page (sources.json) is the answer, the other
filed pages are the field.

The committed sources hold only the pages some program was filed from, with the heading and title the page
printed, so the field is smaller than a capture's (every program page read) and a false match is likelier in
a capture than here. A college on the PDF route is not looked up in this slice and is listed as such.

  python3 kb/_harvest_ncl_lookup_census.py            # the table
  python3 kb/_harvest_ncl_lookup_census.py --write    # also kb/status/harvest_ncl_lookup_census.json

Guard: tests/harvest_ncl_lookup_census_test.py.
"""
from __future__ import annotations

import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_requirements_college as C  # noqa: E402

OUT = os.path.join(HERE, "status", "harvest_ncl_lookup_census.json")
FOUND_METHODS = ("sitemap_page", "link_search")


def pages_of(sources: list[dict], capture: dict) -> list[dict]:
    """The filed pages, in the shape the capture's reader gives them: a Coursedog tab headed by its program's
    name and award words from the capture's own list (cd_page), a curriQunet page grouped by its codes."""
    platform = capture.get("platform")
    cd = capture.get("coursedog") or {}
    names = {e.get("code"): e.get("name") for e in cd.get("catalog") or []}
    root = cd.get("root") or capture.get("catalog_url") or ""
    out, seen = [], set()
    for s in sources:
        src = s.get("source") or {}
        url = src.get("url")
        if not url or url in seen or s.get("method") not in FOUND_METHODS:
            continue
        seen.add(url)
        pg = {"url": url, "title": src.get("title"), "h1": src.get("h1")}
        if platform == "coursedog":
            code = C.cd_href_code(url.rsplit("/", 1)[0], root)
            name = names.get(code) or code or ""
            pg.update(h1=" ".join(x for x in (name, C.cd_award_words(name)) if x), code=code,
                      code_kind=C.cd_code_kind(code))
        elif platform == "curriqunet":
            pg["group"] = C.cq_group(src.get("title") or "", url)
        out.append(pg)
    C.drop_banner_h1(out)
    return out


def college_census(sources: list[dict], capture: dict) -> dict:
    """One college's self-test: {platform, route, tested, hits, recall, false, false_matches, searches, ncl}."""
    platform = capture.get("platform")
    ncl = sum(1 for s in sources if s.get("method") == "no_closed_list")
    if platform == "pdf" or "pdf" in capture:
        return {"platform": platform, "route": "pdf (not looked up in this slice)", "ncl": ncl}
    programs = [{"control_number": s["control_number"], "title": s.get("title") or "", "award": s.get("award"),
                 "closed_list": [] if s.get("method") == "no_closed_list" else [{}]} for s in sources]
    own = {s["control_number"]: C.page_stem(s["source"]["url"]) for s in sources
           if (s.get("source") or {}).get("url") and s.get("method") in FOUND_METHODS}
    test = C.ncl_self_test(programs, C.ncl_pages(pages_of(sources, capture), capture.get("college")), own,
                           C.ncl_named(sources))
    return dict({"platform": platform, "route": "site", "ncl": ncl}, **test)


def census(base: str = C.COLLEGE_DIR) -> dict:
    colleges = {}
    for slug in sorted(os.listdir(base)):
        d = os.path.join(base, slug)
        try:
            with open(os.path.join(d, "sources.json")) as fh:
                sources = json.load(fh)
            with open(os.path.join(d, "capture.json")) as fh:
                capture = json.load(fh)
        except (OSError, ValueError):
            continue
        colleges[slug] = dict({"college": capture.get("college")}, **college_census(sources, capture))
    site = [c for c in colleges.values() if c["route"] == "site"]
    tested = sum(c["tested"] for c in site)
    hits = sum(c["hits"] for c in site)
    return {"floor": C.NCL_FLOOR, "own_share": C.NCL_OWN, "min_tested": C.NCL_MIN_TESTED,
            "statewide": {"colleges": len(colleges), "site_route": len(site), "tested": tested, "hits": hits,
                          "recall": round(hits / tested, 3) if tested else None,
                          "false": sum(c["false"] for c in site),
                          "colleges_searched": sum(1 for c in site if c["searches"]),
                          "colleges_under_floor": sum(1 for c in site if not c["searches"]),
                          "ncl_searched": sum(c["ncl"] for c in site if c["searches"]),
                          "ncl_not_searched": sum(c["ncl"] for c in colleges.values() if not c.get("searches"))},
            "colleges": colleges}


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--write", action="store_true", help="write %s" % os.path.relpath(OUT, os.path.dirname(HERE)))
    a = ap.parse_args(argv)
    r = census()
    print(json.dumps(r["statewide"]))
    for slug, c in sorted(r["colleges"].items(), key=lambda kv: (kv[1].get("recall") is None, kv[1].get("recall") or 0)):
        if c["route"] == "site":
            print("%-34s %-12s recall %5s (%3d of %3d)  false %d  %s  ncl %d" % (
                slug, c["platform"], c["recall"], c["hits"], c["tested"], c["false"],
                "searched" if c["searches"] else "NOT SEARCHED", c["ncl"]))
    if a.write:
        os.makedirs(os.path.dirname(OUT), exist_ok=True)
        with open(OUT, "w") as fh:
            json.dump(r, fh, indent=1, sort_keys=True)
            fh.write("\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
