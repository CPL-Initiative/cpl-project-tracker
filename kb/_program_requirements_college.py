#!/usr/bin/env python3
"""Phase 2 of the program requirements harvest: every program at one college.

Sam, 2026-10-09 (S353, as proposed): the first full-college read is Cerritos,
every active program that carries a state course list (288 of 292), by the
method that passed the pilot (20 of 20, all four checks). Records load
unchecked (Beta draft); the three machine checks run on each; Sam reads a
sample for the fourth. About $19 in model calls. Lane:
docs/reference/lanes/program-requirements-harvest.md.

The pilot found one program's page at a time by following links from the
catalog's front page (kb/_program_requirements_pilot.py, up to eight loads a
program), and a session filed each page from the job log by hand. Neither
scales to a college. So this pass turns the search around:

  capture    lists the college's active programs and their closed course lists
             (coci_college_programs, coci_program_courses, read with the anon
             key), lists the catalog's program pages ONCE (its sitemap.xml, else
             the program index the catalog's own front page links), reads each
             page once, and gives each program the page that names the largest
             share of its listed courses, the pilot's acceptance test, with the
             award and title words on the page breaking a tie (an A.A. and the
             certificate inside it name the same courses). A program no page
             accepts gets the pilot's own link search, from the shared cache.
             Writes OUT/sources/<control number>.json in the pilot's source shape
             and OUT/capture.json, the account of the run.
  extract    posts one shard of the sources to the program-requirements-extract
             Edge Function and scores each record (the pilot's extraction and
             scorer, unchanged), writing OUT/records/<control number>.json.
  file       copies the records and the run's account into the repository
             (kb/program_requirements_college/<slug>/), which the workflow
             commits to the branch that ran it: no session reads a job log.

The reads follow the census's rules, as the pilot's do (Sam's call 5 on sheet
23): robots.txt first for every host, CENSUS_DELAY_MS between loads, the census
user agent that names the CPL Initiative. A host on record as refused is never
retried under another name.

The pure functions are tested by tests/program_requirements_college_test.py
without a browser or a network.
"""
from __future__ import annotations

import argparse
import glob
import json
import os
import re
import sys
import time
import urllib.parse
import xml.etree.ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_requirements_pilot as P  # noqa: E402

PAGE_SIZE = 1000          # PostgREST answers at most this many rows a request
MAX_PAGES = 900           # program pages read at one college, at most
FALLBACK_LOADS = 4        # the pilot's link search, per program no page accepted
MAX_FALLBACKS = 40        # programs given that search in one run (160 loads at most)
COLLEGE_DIR = os.path.join(HERE, "program_requirements_college")

# A sitemap address names the program pages by their path. These words mark a
# catalog's program sections; these mark everything else it lists.
PROGRAM_PATH = re.compile(
    r"degree|certificate|program|major|pathway|noncredit|award|transfer|career|"
    r"academic-and-career|areas-of-study|aos|-a-?a|-a-?s|-ast?\b|-aat?\b", re.I)
NOT_PROGRAM_PATH = re.compile(
    r"course-?descriptions?|/courses?/|coursesaz|/archive|/previous|/policies|/policy|"
    r"/services|/student-services|/admission|/calendar|/faculty|/staff|/search|/pdf/|"
    r"\.pdf$|/general-information|/administration|/glossary|/index\.html?$|/addend", re.I)


# ── the college's programs, from the state's files ─────────────────────────
def fetch_all(path_qs: str) -> list[dict]:
    """Every row of a PostgREST read, a page at a time."""
    out, offset = [], 0
    while True:
        rows = P._get("%s&limit=%d&offset=%d" % (path_qs, PAGE_SIZE, offset))
        out.extend(rows)
        if len(rows) < PAGE_SIZE:
            return out
        offset += PAGE_SIZE


def college_programs(college: str) -> list[dict]:
    """The college's active programs (Active and Active - Teachout Only), each
    with its closed list, in control-number order. A program the state's file
    lists no course for is kept, marked, and never read."""
    progs = fetch_all("coci_college_programs?select=control_number,program_title,award,status,top_code"
                      "&college=eq.%s&status=like.Active*&order=control_number" % P.q(college))
    rows = fetch_all("coci_program_courses?select=program_control_number,course_control_number,"
                     "course_code,course_title,units,cid,course_college,load_id"
                     "&college=eq.%s&order=program_control_number,course_code" % P.q(college))
    return group_programs(progs, rows)


def group_programs(progs: list[dict], rows: list[dict]) -> list[dict]:
    by_cn: dict[str, list[dict]] = {}
    for r in rows:
        by_cn.setdefault(str(r.get("program_control_number")), []).append(r)
    out, seen = [], set()
    for p in progs:
        cn = str(p.get("control_number"))
        if cn in seen:
            continue
        seen.add(cn)
        mine = by_cn.get(cn, [])
        out.append({"control_number": cn, "title": p.get("program_title") or "", "award": p.get("award"),
                    "status": p.get("status"), "top_code": p.get("top_code"),
                    "shape": shape_of(p.get("award")),
                    "closed_list": P.closed_from_rows(mine),
                    "load_id": mine[0].get("load_id") if mine else None})
    return out


def shape_of(award: str | None) -> str:
    """The pilot's four shapes, named from the award alone: the extraction and
    the display read `shape`, and a full college has no hand-picked slot."""
    kind = P.award_kind(award)
    return {"adt": "adt", "as": "degree", "aa": "degree", "bs": "degree",
            "coa": "certificate", "noncredit": "noncredit"}.get(kind, "other")


# ── the catalog's program pages ────────────────────────────────────────────
def sitemap_urls(xml_text: str) -> tuple[list[str], list[str]]:
    """(page addresses, nested sitemap addresses) a sitemap or sitemap index
    lists. Malformed XML reads as none, never as an error."""
    try:
        root = ET.fromstring(xml_text.encode() if isinstance(xml_text, str) else xml_text)
    except ET.ParseError:
        return [], []
    pages, nested = [], []
    for el in root.iter():
        tag = el.tag.rsplit("}", 1)[-1]
        if tag != "loc" or not (el.text or "").strip():
            continue
        url = el.text.strip()
        parent_is_index = root.tag.rsplit("}", 1)[-1] == "sitemapindex"
        (nested if parent_is_index else pages).append(url)
    return pages, nested


def program_candidates(urls: list[str], start: str) -> list[str]:
    """The sitemap's pages that sit in a program section of this catalog: the
    catalog's own host, a path a program section uses, and nothing a course
    list, policy, archive or PDF uses. Deduplicated, in the sitemap's order."""
    out, seen = [], set()
    for u in urls:
        u = u.split("#")[0]
        if not P.same_site(u, start) or u in seen:
            continue
        path = urllib.parse.urlparse(u).path or "/"
        if path.count("/") < 2 or NOT_PROGRAM_PATH.search(path) or not PROGRAM_PATH.search(path):
            continue
        seen.add(u)
        out.append(u)
    return out


# ── giving each program its page ───────────────────────────────────────────
CODE_TOKEN = re.compile(r"\b([A-Z][A-Z&]{0,7})[\s\-]?(C?\d{1,4}(?:\.\d{1,2})?[A-Z]{0,2})\b")
CODE_TOKEN_2 = re.compile(r"\b([A-Z][A-Z&]{0,7}\s[A-Z&]{1,6})[\s\-]?(C?\d{1,4}(?:\.\d{1,2})?[A-Z]{0,2})\b")


def page_codes(text: str) -> set[str]:
    """Every course-code-like token on a page, in the pilot's normal form, read
    with a one-word subject (HED 100) and a two-word one (REAL ES 7) both, since
    "A.S.-T HED 100" would otherwise read as subject "T HED". A coarse net: it
    only decides which programs are worth the exact test, so it may over-reach."""
    t = text or ""
    return ({P.norm_code(a + " " + b) for a, b in CODE_TOKEN.findall(t)} |
            {P.norm_code(a + " " + b) for a, b in CODE_TOKEN_2.findall(t)})


def label_score(page: dict, program: dict) -> tuple[int, int]:
    """(award words named, title words named) by the page's heading, title and
    address: the tie-break between pages that pass the coverage test."""
    words = " ".join([page.get("h1") or "", page.get("title") or "",
                      urllib.parse.unquote(urllib.parse.urlparse(page.get("url") or "").path).replace("-", " ")]).lower()
    kind = P.award_kind(program.get("award"))
    award_hit = int(any(re.search(p, words) for p in P.AWARD_WORDS.get(kind, [])))
    tokens = P.title_tokens(program.get("title") or "")
    title_hit = sum(1 for w in tokens if re.search(r"\b" + re.escape(w) + r"\b", words))
    return award_hit, title_hit


def choose_page(program: dict, pages: list[dict]) -> dict | None:
    """The page this program's record is read from: among the pages naming at
    least ACCEPT_SHARE of its listed courses, the one whose label names its
    award, then the most title words, then the highest coverage. None when no
    page passes."""
    courses = program["closed_list"]
    if not courses:
        return None
    want = {P.norm_code(c.get("code") or "") for c in courses}
    best, best_key = None, None
    for pg in pages:
        if len(want & pg["codes"]) < P.ACCEPT_SHARE * len(want) * 0.8:   # the coarse net, with slack
            continue
        fb = P.find_codes(pg.get("body") or "", courses)
        fc = P.find_codes(pg.get("content") or "", courses)
        text, found, field = P.best_text(pg["got"], fb, fc)
        cov = P.coverage(found, courses)
        if cov < P.ACCEPT_SHARE:
            continue
        award_hit, title_hit = label_score(pg, program)
        key = (award_hit, title_hit, round(cov, 3))
        if best_key is None or key > best_key:
            best_key = key
            best = {"url": pg["url"], "coverage": cov, "found": found, "text": text,
                    "field": field, "got": pg["got"], "label": {"award": award_hit, "title": title_hit}}
    return best


def source_record(college: str, program: dict, reg: dict, best: dict | None, method: str) -> dict:
    """The pilot's source shape, so its extraction, scorer and filer read a
    full college's sources unchanged."""
    rec = {"college": college, "control_number": program["control_number"], "shape": program["shape"],
           "title": program["title"], "award": program["award"], "status": program["status"],
           "catalog_url": reg.get("catalog_url"), "catalog_year": reg.get("catalog_year"),
           "platform": reg.get("catalog_platform"), "format": reg.get("catalog_format"),
           "closed_list": program["closed_list"], "load_id": program["load_id"]}
    if not best:
        rec.update(method=method, source=None, coverage=0.0, codes_found=[], text="")
        return rec
    got = best.get("got") or {}
    rec.update(method=method,
               source={"url": best["url"], "title": got.get("title"), "h1": got.get("h1"),
                       "text_from": best.get("field"), "label": best.get("label")},
               coverage=round(best["coverage"], 3),
               codes_found=sorted(best["found"]),
               text=P.with_outcome_tabs(P.text_window(best.get("text") or "", best["found"]),
                                        got.get("outcomeTabs")),
               courseleaf_lists=P.courseleaf_lists(got, program["closed_list"])
               if reg.get("catalog_platform") == "courseleaf" else [])
    return rec


def shard_of(items: list, shard: int, shards: int) -> list:
    """Every shards-th item from the shard-th: the shards share the work evenly
    and every item lands in exactly one."""
    return [x for i, x in enumerate(items) if i % shards == shard]


def slug_of(college: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", college.lower().replace(" college", "")).strip("_")


# ── the passes ─────────────────────────────────────────────────────────────
def read_sitemap(reader, start: str) -> dict:
    """The catalog's sitemap.xml, robots first and the census's delay before
    each request; a sitemap index is followed one level."""
    from _program_source_census import robots_allows, site_root
    root = site_root(start)
    out = {"url": root + "sitemap.xml", "pages": [], "nested": [], "status": None}
    todo, done = [out["url"]], set()
    while todo and len(done) < 12:
        url = todo.pop(0)
        if url in done:
            continue
        done.add(url)
        if not robots_allows(reader._robots_for(url), url):
            out.setdefault("refused", []).append(url)
            continue
        time.sleep(reader.delay)
        reader.loads += 1
        try:
            resp = reader.request.get(url, timeout=60000)
            if url == out["url"]:
                out["status"] = resp.status
            if not resp.ok:
                continue
            pages, nested = sitemap_urls(resp.text())
            out["pages"].extend(pages)
            out["nested"].extend(nested)
            todo.extend(nested)
        except Exception as exc:
            out.setdefault("errors", []).append("%s: %s" % (url, str(exc).splitlines()[0][:160]))
    return out


def index_links(reader, start: str, cache: dict) -> list[str]:
    """Without a sitemap: the catalog's front page, and each program index it
    links (the pilot's hub words), read once; every same-site link they hold."""
    front = P.load(reader, start, cache, False)
    hubs = [ln.get("href") for ln in front.get("links") or []
            if P.HUB_WORDS.search(ln.get("text") or "") and not P.NOT_HUB.search(ln.get("text") or "")
            and P.same_site(ln.get("href") or "", start)][:6]
    urls = [ln.get("href") for ln in front.get("links") or []]
    for h in hubs:
        got = P.load(reader, h, cache, False)
        urls.extend(ln.get("href") for ln in got.get("links") or [])
    return [u for u in urls if u]


def capture(college: str, out_dir: str, limit: int = 0) -> int:
    t0 = time.time()
    programs = college_programs(college)
    if limit:
        programs = programs[:limit]
    reg = P.fetch_registry(college)
    start = reg.get("catalog_url")
    report = {"college": college, "catalog_url": start, "platform": reg.get("catalog_platform"),
              "catalog_year": reg.get("catalog_year"), "programs": len(programs),
              "with_closed_list": sum(1 for p in programs if p["closed_list"]),
              "started": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    os.makedirs(os.path.join(out_dir, "sources"), exist_ok=True)
    if not start or reg.get("catalog_platform") != "courseleaf":
        # Phase 2 opens on CourseLeaf (Cerritos); another platform names its own enumeration first.
        report["stopped"] = "this pass enumerates CourseLeaf catalogs; %s reads %s" % (college, reg.get("catalog_platform"))
        _write(os.path.join(out_dir, "capture.json"), report)
        print(report["stopped"])
        return 1
    delay = int(os.environ.get("CENSUS_DELAY_MS", "4000"))
    pw, browser, reader = P.open_reader(delay)
    cache: dict = {}
    try:
        sm = read_sitemap(reader, start)
        urls = program_candidates(sm["pages"], start)
        report["sitemap"] = {"url": sm["url"], "status": sm["status"], "listed": len(sm["pages"]),
                             "nested": len(sm["nested"]), "program_pages": len(urls),
                             "refused": sm.get("refused"), "errors": sm.get("errors")}
        if len(urls) < 0.3 * report["with_closed_list"]:
            urls = program_candidates(index_links(reader, start, cache), start)
            report["index_fallback"] = len(urls)
        urls = urls[:MAX_PAGES]
        pages = []
        print("%s: %d programs (%d with a course list), %d candidate pages, %.1f s between loads"
              % (college, len(programs), report["with_closed_list"], len(urls), delay / 1000), flush=True)
        for i, u in enumerate(urls):
            got = P.load(reader, u, cache, False)
            if got.get("access") != "ok":
                continue
            got["links"] = (got.get("links") or [])[:300]   # a program page's menus need not ride in memory
            pages.append({"url": got.get("final_url") or u, "title": got.get("title"), "h1": got.get("h1"),
                          "body": got.get("body"), "content": got.get("content"), "got": got,
                          "codes": page_codes((got.get("body") or "") + "\n" + (got.get("content") or ""))})
            if i % 50 == 49:
                print("  read %d of %d pages" % (i + 1, len(urls)), flush=True)
        report["pages_read"] = len(pages)
        recs, fallback = [], 0
        P.MAX_LOADS = FALLBACK_LOADS      # the link search, shorter here: most programs already have a page
        for prog in programs:
            if not prog["closed_list"]:
                rec = source_record(college, prog, reg, None, "no_closed_list")
            else:
                best = choose_page(prog, pages)
                method = "sitemap_page"
                if best is None and fallback < MAX_FALLBACKS:
                    fallback += 1
                    res = P.locate_html(reader, {"title": prog["title"], "award": prog["award"]},
                                        prog["closed_list"], start, cache, False)
                    b = res["best"] or {}
                    if b.get("coverage", 0.0) >= P.ACCEPT_SHARE:
                        best, method = dict(b, label=None), "link_search"
                rec = source_record(college, prog, reg, best, method if best else "not_found")
            recs.append(rec)
            _write(os.path.join(out_dir, "sources", prog["control_number"] + ".json"), rec)
            print("%-6s %-12s cov %-5s %s" % (prog["control_number"], rec["method"][:12], rec["coverage"],
                                              (rec.get("source") or {}).get("url") or ""), flush=True)
    finally:
        browser.close()
        pw.stop()
    urls_used: dict[str, list[str]] = {}
    for r in recs:
        if r.get("source"):
            urls_used.setdefault(r["source"]["url"], []).append(r["control_number"])
    report.update(
        loads=reader.loads, seconds=round(time.time() - t0, 1),
        found=sum(1 for r in recs if r.get("source")),
        by_method={m: sum(1 for r in recs if r["method"] == m)
                   for m in sorted({r["method"] for r in recs})},
        shared_pages={u: cns for u, cns in urls_used.items() if len(cns) > 1},
        not_found=[{"control_number": r["control_number"], "title": r["title"], "award": r["award"]}
                   for r in recs if r["method"] == "not_found"],
        coverage_bands={band: sum(1 for r in recs if r.get("source") and lo <= r["coverage"] < hi)
                        for band, lo, hi in (("0.5-0.8", .5, .8), ("0.8-1.0", .8, 1.0), ("1.0", 1.0, 9))})
    _write(os.path.join(out_dir, "capture.json"), report)
    print(json.dumps({k: v for k, v in report.items() if k not in ("not_found", "shared_pages")}, indent=1))
    return 0


def extract(out_dir: str, shard: int, shards: int, run_id: str | None, workers: int = 6) -> int:
    import _program_requirements_extract as X
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not key:
        print("SUPABASE_SERVICE_KEY is not set; the Edge Function takes only the service key.")
        return 2
    sources = []
    for path in sorted(glob.glob(os.path.join(out_dir, "sources", "*.json"))):
        with open(path) as fh:
            src = json.load(fh)
        if (src.get("coverage") or 0) >= X.MIN_COVERAGE and src.get("text"):
            sources.append(src)
    mine = shard_of(sources, shard, shards)
    os.makedirs(os.path.join(out_dir, "records"), exist_ok=True)
    print("extraction, shard %d of %d: %d of %d sources, %d at a time"
          % (shard + 1, shards, len(mine), len(sources), workers), flush=True)

    def one(src: dict) -> None:
        t0 = time.time()
        got = X.call(src, key)
        rec = got.get("record")
        try:
            sc = X.score(rec, src["closed_list"], src["text"]) if isinstance(rec, dict) else None
        except Exception as exc:   # one record the scorer cannot read never stops the others
            sc, got = None, dict(got, error="score: " + str(exc).splitlines()[0][:200])
        row = {"college": src["college"], "control_number": src["control_number"], "shape": src["shape"],
               "title": src["title"], "award": src.get("award"),
               "source_url": (src.get("source") or {}).get("url"), "record_shape": X.RECORD_SHAPE,
               "model": got.get("model"), "stop_reason": got.get("stop_reason"), "usage": got.get("usage"),
               "cost_usd": X.cost(got.get("model"), got.get("usage")), "ms": got.get("ms"),
               "seconds": round(time.time() - t0, 1), "error": got.get("error"), "score": sc,
               "record": rec, "extracted_run": run_id}
        _write(os.path.join(out_dir, "records", src["control_number"] + ".json"), row)
        print("%-6s %s cov %-5s arith %-10s $%s %s" % (
            src["control_number"], "PASS" if sc and sc["pass"] else "fail",
            sc and sc["coverage"]["share"], sc and sc["arithmetic"]["status"],
            row["cost_usd"], row["error"] or ""), flush=True)

    # Each call waits on the model for about 15 s; six at once keep a college
    # inside one job, and the function answers each call on its own.
    from concurrent.futures import ThreadPoolExecutor
    with ThreadPoolExecutor(max_workers=max(1, workers)) as pool:
        list(pool.map(one, mine))
    return 0


def summarize(records: list[dict], capture_report: dict) -> dict:
    """The run in numbers, for the session that reads the commit and for Sam."""
    passed = [r for r in records if r.get("score") and r["score"].get("pass")]
    def fails(check):
        return sum(1 for r in records if r.get("score") and not r["score"].get(check, {}).get("pass", True))
    total = sum(r.get("cost_usd") or 0 for r in records)
    return {"college": capture_report.get("college"), "programs": capture_report.get("programs"),
            "with_closed_list": capture_report.get("with_closed_list"), "found": capture_report.get("found"),
            "extracted": len(records), "errors": sum(1 for r in records if r.get("error")),
            "passed_machine_checks": len(passed),
            "failed": {c: fails(c) for c in ("coverage", "invented", "arithmetic", "repeated", "outcomes")},
            "cost_usd": round(total, 2), "cost_per_program": round(total / len(records), 4) if records else None,
            "not_found": capture_report.get("not_found")}


def file_run(college: str, out_dir: str, run_id: str | None) -> int:
    """Copy the run's records and account into the repository."""
    dest = os.path.join(COLLEGE_DIR, slug_of(college))
    os.makedirs(os.path.join(dest, "records"), exist_ok=True)
    with open(os.path.join(out_dir, "capture.json")) as fh:
        report = json.load(fh)
    report["run"] = run_id
    records = []
    for path in sorted(glob.glob(os.path.join(out_dir, "records", "*.json"))):
        with open(path) as fh:
            row = json.load(fh)
        records.append(row)
        _write(os.path.join(dest, "records", os.path.basename(path)), row)
    # Which page each program was read from, and how well it matched. The
    # catalog text itself stays in the run's artifact (the workflow keeps it 90
    # days): a college's worth of page text is megabytes, and a re-read is free.
    index = []
    for path in sorted(glob.glob(os.path.join(out_dir, "sources", "*.json"))):
        with open(path) as fh:
            src = json.load(fh)
        index.append(dict({k: src.get(k) for k in ("control_number", "title", "award", "shape", "method",
                                                   "coverage", "codes_found", "source")},
                          listed=len(src.get("closed_list") or []), text_chars=len(src.get("text") or "")))
    _write(os.path.join(dest, "sources.json"), index)
    _write(os.path.join(dest, "capture.json"), report)
    if records:
        _write(os.path.join(dest, "summary.json"), dict(summarize(records, report), run=run_id))
    print("filed %d records and %d sources under %s" % (len(records), len(index), os.path.relpath(dest, os.path.dirname(HERE))))
    return 0


def _write(path: str, obj) -> None:
    with open(path, "w") as fh:
        json.dump(obj, fh, ensure_ascii=False, indent=1)
        fh.write("\n")


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("step", choices=["capture", "extract", "file"])
    ap.add_argument("--college", default="Cerritos College")
    ap.add_argument("--out", default="out")
    ap.add_argument("--shard", type=int, default=0)
    ap.add_argument("--shards", type=int, default=1)
    ap.add_argument("--workers", type=int, default=6, help="extraction calls at once")
    ap.add_argument("--limit", type=int, default=0, help="the first N programs only (a trial)")
    ap.add_argument("--run", default=os.environ.get("GITHUB_RUN_ID"))
    args = ap.parse_args(argv)
    if args.step == "capture":
        return capture(args.college, args.out, args.limit)
    if args.step == "extract":
        return extract(args.out, args.shard, args.shards, args.run, args.workers)
    return file_run(args.college, args.out, args.run)


if __name__ == "__main__":
    sys.exit(main())
