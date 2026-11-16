#!/usr/bin/env python3
"""How well the no-closed-list lookup's matcher finds a program by title and award, measured on the programs
whose page we already know (S652; #3299 slice A).

The capture looks up a program with no closed list by title and award (ncl_lookup in
kb/_program_requirements_college.py). Before it does, it tries the matcher on the college's closed-list
programs: each looked up as if it had no list, against the pages read (ncl_self_test). This script runs the
same test on the committed captures, so the matcher's recall and its false matches can be read college by
college without a page load: each closed-list program's filed page (sources.json) is the answer, the other
filed pages are the field.

It also counts the pages the lookup would give back (ncl_yield, S668): a no-closed-list program whose one page a
closed-list program holds, though the page does not name the holder and the holder's filed record (records/,
the read filed now) was read from that page and fails live. The census runs the lookup itself (ncl_lookup with
the filed records), gated as a capture is: a college under the self-test's floor, a PDF route, a re-read and a
prior-year read yield nothing. Each yield is checked again on its own: a passing record must never move. A yield a
filing already applied (the #3408 review) counts too: its holder is filed page_claimed, and the filed capture's
account names the yield or the taker's answer names the holder as took_from. Its page is then no filed page, so the
lookup cannot see it again; such a yield is listed with applied true.

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


def college_census(sources: list[dict], capture: dict, folder: str | None = None) -> dict:
    """One college's self-test (ncl_self_test: recall and the three false measures) and, for a Coursedog capture,
    the catalog list's own self-test (ncl_list_test, measured; this slice files no not_listed), the conversion
    test (conversion()), and the pages the lookup gives back (ncl_yield) against folder's filed records (none
    without a folder, and none for a re-read or a prior-year read), each one listed, with the yields the filing
    already applied (applied true): a holder filed page_claimed whose yield the capture's account or the taker's
    took_from names."""
    platform = capture.get("platform")
    ncl = sum(1 for s in sources if s.get("method") == "no_closed_list")
    if platform == "pdf" or "pdf" in capture:
        return {"platform": platform, "route": "pdf (not looked up in this slice)", "ncl": ncl}
    programs = [{"control_number": s["control_number"], "title": s.get("title") or "", "award": s.get("award"),
                 "closed_list": [] if s.get("method") == "no_closed_list" else [{}]} for s in sources]
    own = {s["control_number"]: C.page_stem(s["source"]["url"]) for s in sources
           if (s.get("source") or {}).get("url") and s.get("method") in FOUND_METHODS}
    raw = pages_of(sources, capture)
    pages = C.ncl_pages(raw, capture.get("college"), capture.get("catalog_year"))
    listed = C.ncl_listed_names(capture.get("coursedog")) if platform == "coursedog" else None
    gated = folder is None or capture.get("reread") or capture.get("prior")
    # The lookup as the capture runs it: its self-test, its catalog-list test and its answers (ncl_lookup).
    year = capture.get("catalog_year")
    answers, test = C.ncl_lookup(programs, raw, own, listed, C.ncl_named(sources), capture.get("college"), year,
                                 filed=None if gated else lambda cn: C.kept_year(
                                     C._filed(os.path.join(folder, "records", cn + ".json")), year),
                                 yielded=C.ncl_capture_yields(capture))
    test["conversion"] = conversion(programs, pages, own, C.ncl_named(sources, award=True))
    title = {p["control_number"]: p["title"] for p in programs}
    by = {x["control_number"]: x for x in sources}

    def filed_rec(cn):
        return C._filed(os.path.join(folder, "records", cn + ".json")) if folder else None

    def row(h, cn, url, h1, applied):
        rec = filed_rec(h)
        return {"holder": h, "holder_title": title.get(h), "taker": cn, "taker_title": title.get(cn), "url": url,
                "h1": h1, "applied": applied, "holder_passes_live": C._passing_filed_rec(rec),
                "holder_read_from": (rec or {}).get("source_url")}
    yields = [row(a["took_from"], cn, a["page"]["url"], a["page"].get("h1"), False)
              for cn, a in sorted(answers.items()) if a.get("took_from")]
    # A yield the filing already applied: the holder is filed page_claimed, and the capture's account names the
    # yield, or the taker's filed answer names the holder (took_from).
    done = {}
    for y in (capture.get("catalog_lookup") or {}).get("yields") or []:
        done.setdefault((y.get("holder"), y.get("taker")), (y.get("url"), y.get("h1")))
    for x in sources:
        lk = x.get("catalog_lookup") or {}
        if lk.get("took_from"):
            done.setdefault((lk["took_from"], x["control_number"]), ((lk.get("page") or {}).get("url"),
                                                                     (lk.get("page") or {}).get("h1")))
    live = {(y["holder"], y["taker"]) for y in yields}
    yields += [row(h, cn, url, h1, True) for (h, cn), (url, h1) in sorted(done.items())
               if (h, cn) not in live and (by.get(h) or {}).get("method") == "page_claimed"
               and (by.get(cn) or {}).get("method") == "no_closed_list"]
    held = [dict(a["yield_held"], holder_title=title.get(a["yield_held"]["holder"]), taker=cn,
                 taker_title=title.get(cn), url=a["page"]["url"])
            for cn, a in sorted(answers.items()) if a.get("yield_held")]
    test.update(yields=yields, yield_held=held,
                yield_unjudged=sum(1 for x in held if x["held"] == "unjudged"),
                yield_refused_passing=sum(1 for x in held if x["held"] == "refused_passing"))
    return dict({"platform": platform, "route": "site", "ncl": ncl}, **test)


def conversion(programs: list[dict], pages: list[dict], own: dict[str, str], named: set[str]) -> dict:
    """The second reader's real-use test (#3300, round two): every third closed-list program whose page was read,
    and whose page the closed-list search's own label says names its title and award (`named`, the ground truth),
    becomes a program with no list, its page left unclaimed, and is looked up beside the rest. A found on its own
    page is right; a found anywhere else is wrong. A filed page the label does not name is no ground truth:
    Antelope Valley filed five A.S. and A.A. programs from their certificates' pages, and the lookup found
    each one's own degree page."""
    keys = {k for pg in pages for k in pg["keys"]}
    cns = sorted(cn for cn, stem in own.items() if stem in keys and cn in named)
    turned = set(cns[::3])
    progs = [dict(p, closed_list=[]) if p["control_number"] in turned else p for p in programs]
    claimed = C.ncl_claims({cn: st for cn, st in own.items() if cn not in turned}, pages)
    right, wrong = 0, []
    for p in progs:
        if p["control_number"] not in turned:
            continue
        a = C.ncl_answer(p, pages, claimed, progs)
        if a["result"] == "found":
            if C.page_stem(a["page"]["url"]) == own[p["control_number"]] or own[p["control_number"]] in \
                    next((pg["keys"] for pg in pages if C.page_stem(a["page"]["url"]) in pg["keys"]), set()):
                right += 1
            else:
                wrong.append({"control_number": p["control_number"], "title": p.get("title"), "page": a["page"]["url"]})
    return {"converted": len(turned), "found_right": right, "found_wrong": len(wrong), "wrong": wrong[:10]}


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
        colleges[slug] = dict({"college": capture.get("college")}, **college_census(sources, capture, d))
    site = [c for c in colleges.values() if c["route"] == "site"]
    tested = sum(c["tested"] for c in site)
    hits = sum(c["hits"] for c in site)
    return {"floor": C.NCL_FLOOR, "own_share": C.NCL_OWN, "min_tested": C.NCL_MIN_TESTED,
            "statewide": {"colleges": len(colleges), "site_route": len(site), "tested": tested, "hits": hits,
                          "recall": round(hits / tested, 3) if tested else None,
                          "false": sum(c["false"] for c in site),
                          "false_off_own": sum(c["false_off_own"] for c in site),
                          "false_no_claims": sum(c["false_no_claims"] for c in site),
                          "false_no_claims_at_searched": sum(c["false_no_claims"] for c in site if c["searches"]),
                          "conversion": {k: sum(c["conversion"][k] for c in site)
                                         for k in ("converted", "found_right", "found_wrong")},
                          "catalog_lists_filing_not_listed": sorted(k for k, c in colleges.items()
                                                                    if (c.get("catalog_list") or {}).get("files_not_listed")),
                          "colleges_searched": sum(1 for c in site if c["searches"]),
                          "colleges_under_floor": sum(1 for c in site if not c["searches"]),
                          "ncl_searched": sum(c["ncl"] for c in site if c["searches"]),
                          "ncl_not_searched": sum(c["ncl"] for c in colleges.values() if not c.get("searches")),
                          # The pages the lookup gives back (ncl_yield, S668), and the check that none moved a
                          # holder whose filed record passes live.
                          "yields": sum(len(c["yields"]) for c in site),
                          "yields_passing_moved": sum(1 for c in site for y in c["yields"] if y["holder_passes_live"]),
                          "yield_unjudged": sum(c["yield_unjudged"] for c in site),
                          "yield_refused_passing": sum(c["yield_refused_passing"] for c in site),
                          "yield_list": [dict({"college": k}, **{f: y[f] for f in ("holder", "holder_title", "taker",
                                                                                   "taker_title", "applied")})
                                         for k, c in sorted(colleges.items()) for y in c.get("yields") or []]},
            "colleges": colleges}


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--write", action="store_true", help="write %s" % os.path.relpath(OUT, os.path.dirname(HERE)))
    a = ap.parse_args(argv)
    r = census()
    print(json.dumps(r["statewide"]))
    for slug, c in sorted(r["colleges"].items(), key=lambda kv: (kv[1].get("recall") is None, kv[1].get("recall") or 0)):
        if c["route"] == "site":
            print("%-34s %-12s recall %5s (%3d of %3d)  false %d/%d/%d  %s  ncl %d" % (
                slug, c["platform"], c["recall"], c["hits"], c["tested"], c["false"], c["false_off_own"],
                c["false_no_claims"],
                "searched" if c["searches"] else "NOT SEARCHED", c["ncl"]))
    for y in r["statewide"]["yield_list"]:
        print("yield  %-26s %s (%s) takes the page of %s (%s)" % (y["college"], y["taker"], y["taker_title"],
                                                                 y["holder"], y["holder_title"]))
    if a.write:
        os.makedirs(os.path.dirname(OUT), exist_ok=True)
        with open(OUT, "w") as fh:
            json.dump(r, fh, indent=1, sort_keys=True)
            fh.write("\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
