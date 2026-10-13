#!/usr/bin/env python3
"""Course outline index: from a course code to its public course outline, host by host.

Sam, Open Asks Sheet 70 card 3 (2026-10-12 20:42Z): "Every course in the loaded
records": the harvest reads each course's SLOs exactly as printed and keeps them
by college and course. Then, in chat to S373 (~21:40Z): "start the Riverside
course index". Riverside City, Moreno Valley and Norco share one curriQunet host
(rccd.curriqunet.com), whose dashboard lists a public outline report per course
(course outline census probe run 38302465625: Report/Course/GetReport/<id>?
reportId=97, each printing Student Learning Outcomes).

Step 1, --discover URL: how the host lists its courses. It opens the page with the
census's polite Reader (robots first, a delay before every load, the user agent
that names the CPL Initiative) and records the page's report links with the text
of the row each sits in, the table headers, the controls that page or filter the
list, the forms, the JSON calls the page makes while loading (and after one scroll
to the bottom), and the head of one outline report, so the index step can be
written against what the host serves. Pages only; no model call, no table write.
Output: kb/course_outline_index/discover_<run>.json.

The course codes to index come from the program records loaded for the host's
colleges (kb/program_requirements_college/<slug>/records/), one code per course
(norm_code: "ACC 1A" and "ACC-1A" are one course).

Step 2, --index URL (curriQunet): discovery run 38312406074 showed the dashboard is a
public search backed by JSON. The page posts /Search/NewSearch (25 rows a page; RCCD
reports TotalRows 14,292, every proposal in every status), and each row names its
CourseId, SubjectCode, CourseNumber, Title, StatusTitle, ProposalTypeTitle and
MetaReports; a course's outline is /Report/Course/GetReport/<CourseId>?reportId=<id>
("Course Outline", 97 at RCCD), an integrated outline naming the colleges that offer
it. A Cloudflare check runs on the page, so the index loads the dashboard, captures
the page's own NewSearch request, and replays it from inside the page with a larger
page size, the census's delay between pages, robots read first. It keeps Active rows
that are not a distance education addendum (ACC-1ADE), keyed by norm_code, and
measures how many of the loaded records' courses have an active outline report.
Output: kb/course_outline_index/index_<run>.json.

The report's address form is the host's own. Discovery run 38347883491 found SDCCD's
dashboard posts the same NewSearch (2,750 Active rows) but links each outline as
DynamicReports/AllFieldsReportByEntity/<CourseId>?entityType=Course&reportId=493
("Course Outline Report"), where RCCD links Report/Course/GetReport/<CourseId>?
reportId=97. The index reads the page's own outline links after the load and takes
the form of one whose path holds a CourseId the search returned, with the course and
report ids as slots (report_form); with no such link it keeps RCCD's form.

Usage (runner): python3 kb/_course_outline_index.py --discover https://rccd.curriqunet.com/
                python3 kb/_course_outline_index.py --index https://rccd.curriqunet.com/
"""
from __future__ import annotations

import argparse
import glob
import importlib.util
import json
import os
import re
import sys
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(HERE, "course_outline_index")

_spec = importlib.util.spec_from_file_location(
    "program_source_census", os.path.join(HERE, "_program_source_census.py"))
census = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(census)

# A course code as catalogs and outline lists print it: a one-word subject of
# letters (& and / allowed), then a number with an optional letter
# before it (RCCD's KIN-A11) and an optional suffix (COS-60A1).
CODE = re.compile(r"\b([A-Z][A-Z&/]{1,6})[ \-]?([A-Z]?\d{1,4}(?:[A-Z]{1,3}\d{0,2})?)\b")

# The page's report links, each with the text of the row that holds it.
ROWS_JS = """() => {
  const links = Array.from(document.querySelectorAll('a[href]'))
    .filter(a => /Report|DynamicReports|Outline/i.test(a.href + ' ' + (a.innerText || '')));
  const rowOf = a => a.closest('tr') || a.closest('li') || a.closest('[class*=row]')
                     || (a.parentElement && a.parentElement.parentElement) || a.parentElement;
  return {count: links.length,
          rows: links.slice(0, 40).map(a => ({href: a.href, text: (a.innerText || '').trim(),
                    row: ((rowOf(a) || {}).innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 300)}))};
}"""
STRUCTURE_JS = """() => {
  const txt = el => (el.innerText || el.value || el.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim();
  return {
    headers: Array.from(document.querySelectorAll('th')).slice(0, 30).map(txt),
    tables: Array.from(document.querySelectorAll('table')).map(t => ({rows: t.rows.length,
             id: t.id, cls: t.className})).slice(0, 10),
    controls: Array.from(document.querySelectorAll('a, button, li, span'))
      .filter(e => /^(next|previous|prev|more|load more|show more|\\d{1,3}|»|›|first|last)$/i.test(txt(e))
                   || /pag(e|ination)|length|show \\d+ entries/i.test((e.className || '') + ' ' + txt(e)))
      .slice(0, 30).map(e => ({tag: e.tagName, text: txt(e).slice(0, 60), cls: String(e.className).slice(0, 80),
                               href: e.href || null})),
    inputs: Array.from(document.querySelectorAll('input, select, textarea')).slice(0, 30)
      .map(e => ({tag: e.tagName, type: e.type || null, name: e.name || null, id: e.id || null,
                  placeholder: e.placeholder || null,
                  options: e.tagName === 'SELECT' ? Array.from(e.options).slice(0, 15).map(o => o.text) : null})),
    forms: Array.from(document.querySelectorAll('form')).slice(0, 10)
      .map(f => ({action: f.action, method: f.method, id: f.id})),
    scripts: Array.from(document.querySelectorAll('script[src]')).map(s => s.src).slice(0, 30),
  };
}"""


def norm_code(text: str) -> str | None:
    """One spelling per course: 'ACC-1A', 'ACC 1A' and 'acc 1a' read 'ACC 1A'."""
    m = CODE.search((text or "").upper())
    return "%s %s" % (m.group(1).strip(), m.group(2)) if m else None


def record_codes(slugs: list[str]) -> dict[str, list[str]]:
    """Every course the loaded program records name, per college slug, normalized."""
    out = {}
    for slug in slugs:
        codes = set()
        for path in glob.glob(os.path.join(HERE, "program_requirements_college", slug, "records", "*.json")):
            text = json.dumps((json.load(open(path)) or {}).get("record") or {})
            for raw in re.findall(r'"(?:code|course_code|course)"\s*:\s*"([^"]+)"', text):
                c = norm_code(raw)
                if c:
                    codes.add(c)
        out[slug] = sorted(codes)
    return out


def discover(reader, url: str) -> dict:
    seen = []  # responses; bodies are read after the load, never inside the handler

    def on_response(resp):
        try:
            if resp.request.resource_type in ("xhr", "fetch"):
                seen.append(resp)
        except Exception:
            pass

    def calls_from(resps):
        out = []
        for resp in resps:
            req = resp.request
            ctype = resp.headers.get("content-type", "")
            head = ""
            if "json" in ctype or "text" in ctype:
                try:
                    head = resp.text()[:1500]
                except Exception:
                    head = ""
            out.append({"method": req.method, "url": req.url, "status": resp.status,
                        "content_type": ctype, "post": (req.post_data or "")[:500], "head": head})
        return out

    reader.page.on("response", on_response)
    page = reader.load(url)
    out = {"url": url, "final_url": page.get("final_url"), "status": page.get("status"),
           "title": page.get("title"), "access": page.get("access")}
    if not page.get("status"):
        out["calls"] = calls_from(seen)
        return out
    out["rows_at_load"] = reader.page.evaluate(ROWS_JS)
    out["structure"] = reader.page.evaluate(STRUCTURE_JS)
    at_load = len(seen)
    try:
        reader.page.evaluate("() => window.scrollTo(0, document.body.scrollHeight)")
        reader.page.wait_for_timeout(4000)
    except Exception:
        pass
    out["rows_after_scroll"] = reader.page.evaluate(ROWS_JS)["count"]
    reader.page.remove_listener("response", on_response)
    out["calls_at_load"] = calls_from(seen[:at_load])
    out["calls_after_scroll"] = calls_from(seen[at_load:])
    out["body_head"] = (reader.page.evaluate("() => document.body ? document.body.innerText : ''") or "")[:4000]
    # The head of one outline report: where it prints the course's code and title.
    first = next((r["href"] for r in out["rows_at_load"]["rows"]
                  if re.search(r"GetReport|AllFieldsReportByEntity", r["href"])), None)
    if first:
        rep = reader.load(first)
        text = ""
        try:
            text = reader.page.evaluate("() => document.body ? document.body.innerText : ''") or ""
        except Exception:
            pass
        out["report_sample"] = {"url": first, "status": rep.get("status"), "title": rep.get("title"),
                                "head": text[:2500], "code": norm_code(text[:600])}
    return out


SEARCH_PAGE_SIZE = 200
MAX_SEARCH_PAGES = 150
FETCH_JS = """async ([url, body, headers]) => {
  const r = await fetch(url, {method: 'POST', headers, body, credentials: 'same-origin'});
  return {status: r.status, text: await r.text()};
}"""
DROP_HEADERS = {"cookie", "user-agent", "host", "content-length", "origin", "referer", "connection",
                "accept-encoding"}


def with_page(post: str, size: int, page: int) -> str:
    """The captured NewSearch body with this page's size and number."""
    parts = []
    for kv in (post or "").split("&"):
        k = kv.split("=", 1)[0]
        if k in ("options%5Bpagesize%5D", "options[pagesize]"):
            kv = "%s=%d" % (k, size)
        elif k in ("options%5Bpage%5D", "options[page]"):
            kv = "%s=%d" % (k, page)
        parts.append(kv)
    return "&".join(parts)


def keep_row(row: dict) -> bool:
    """An active course outline: Active status, not a distance education addendum."""
    if (row.get("StatusTitle") or "") != "Active":
        return False
    if re.search(r"distance education", row.get("ProposalTypeTitle") or "", re.I):
        return False
    return True


# RCCD's form (discovery run 38312406074); a host whose own links say otherwise wins.
LEGACY_FORM = "Report/Course/GetReport/{course_id}?reportId={report_id}"
LINK_FORM = re.compile(r"^([A-Za-z]+(?:/[A-Za-z]+)*/)(\d+)(\?(?:[^#]*&)?reportId=)(\d+)([^#]*)$")

# The page's own outline links, read after the load (SDCCD: "Course Outline Report").
OUTLINE_LINKS_JS = """() => Array.from(document.querySelectorAll('a[href]'))
  .filter(a => /outline/i.test(a.innerText || ''))
  .slice(0, 50).map(a => a.href)"""


def report_form(hrefs: list[str], rows: list[dict], base: str) -> str | None:
    """The address form of the page's own outline links, the course and report ids as slots.

    A link counts only when it sits on this host, its path ends in a CourseId the
    search returned, and its query names a reportId; the first such link decides."""
    ids = {str(r.get("CourseId")) for r in rows if r.get("CourseId") is not None}
    for href in hrefs or []:
        if not href.startswith(base):
            continue
        m = LINK_FORM.match(href[len(base):])
        if m and m.group(2) in ids:
            return m.group(1) + "{course_id}" + m.group(3) + "{report_id}" + m.group(5)
    return None


def outline_reports(row: dict, base: str, form: str = LEGACY_FORM) -> list[str]:
    """The row's outline report addresses (a MetaReport titled for the outline)."""
    out = []
    for rep in row.get("MetaReports") or []:
        if re.search(r"outline", rep.get("Title") or "", re.I):
            out.append(base + form.format(course_id=row.get("CourseId"), report_id=rep.get("Id")))
    return out


def build_index(rows: list[dict], base: str, form: str = LEGACY_FORM) -> dict:
    """norm_code -> the active outline rows for it."""
    index = {}
    for row in rows:
        if not keep_row(row):
            continue
        code = norm_code("%s %s" % (row.get("SubjectCode") or "", row.get("CourseNumber") or ""))
        if not code:
            continue
        index.setdefault(code, []).append({
            "course_id": row.get("CourseId"), "title": row.get("Title"),
            "proposal_type": row.get("ProposalTypeTitle"), "reports": outline_reports(row, base, form)})
    return index


def search_all(reader, url: str, delay_ms: int) -> dict:
    """Load the dashboard, capture its NewSearch request, page through every row."""
    captured = {}

    def on_request(req):
        if "/Search/NewSearch" in req.url and req.method == "POST" and "url" not in captured:
            captured.update(url=req.url, post=req.post_data or "", headers=dict(req.headers))

    reader.page.on("request", on_request)
    page = reader.load(url)
    reader.page.wait_for_timeout(3000)
    reader.page.remove_listener("request", on_request)
    out = {"url": url, "status": page.get("status"), "title": page.get("title")}
    try:
        out["outline_links"] = reader.page.evaluate(OUTLINE_LINKS_JS) or []
    except Exception:
        out["outline_links"] = []
    if not captured:
        out["error"] = "the page made no NewSearch request"
        return out
    if not census.robots_allows(reader._robots_for(captured["url"]), captured["url"]):
        out["error"] = "robots.txt disallows the search address"
        return out
    headers = {k: v for k, v in captured["headers"].items()
               if k.lower() not in DROP_HEADERS and not k.lower().startswith("sec-")}
    rows, total, pages = [], None, 0
    for n in range(MAX_SEARCH_PAGES):
        if n:
            reader.page.wait_for_timeout(delay_ms)
        got = reader.page.evaluate(FETCH_JS, [captured["url"], with_page(captured["post"], SEARCH_PAGE_SIZE, n), headers])
        pages += 1
        if got.get("status") != 200:
            out["error"] = "page %d answered %s" % (n, got.get("status"))
            break
        data = json.loads(got.get("text") or "{}")
        total = data.get("TotalRows", total)
        batch = data.get("results") or []
        rows += batch
        if not batch or (total is not None and len(rows) >= total):
            break
    out.update(total_rows=total, rows_read=len(rows), search_pages=pages,
               page_size=SEARCH_PAGE_SIZE, rows=rows)
    return out


def write_index(url: str, searched: dict, wanted: dict, loads: int) -> int:
    base = url if url.endswith("/") else url + "/"
    rows = searched.pop("rows", [])
    learned = report_form(searched.get("outline_links"), rows, base)
    form = learned or LEGACY_FORM
    index = build_index(rows, base, form)
    union = set().union(*wanted.values()) if wanted else set()
    with_report = {c for c, v in index.items() if any(x["reports"] for x in v)}
    coverage = {slug: {"courses": len(codes), "with_outline": sum(1 for c in codes if c in with_report)}
                for slug, codes in wanted.items()}
    run = os.environ.get("GITHUB_RUN_ID", "local")
    out = {"run": run, "at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "url": url,
           "search": searched, "loads": loads,
           "report_form": form, "report_form_from": "the page's own outline links" if learned else "RCCD's default",
           "sample_row": {k: (rows[0] if rows else {}).get(k) for k in
                          ("CourseId", "SubjectCode", "CourseNumber", "StatusTitle", "ProposalTypeTitle", "MetaReports")},
           "active_codes": len(index), "active_with_report": len(with_report),
           "wanted_union": len(union), "wanted_with_outline": len(union & with_report),
           "coverage": coverage, "missing": sorted(union - with_report), "index": index}
    os.makedirs(OUT_DIR, exist_ok=True)
    path = os.path.join(OUT_DIR, "index_%s.json" % run)
    with open(path, "w") as f:
        json.dump(out, f, indent=1)
    print(json.dumps({k: out[k] for k in ("active_codes", "active_with_report", "wanted_union",
                                          "wanted_with_outline", "coverage", "report_form")}, indent=1))
    print("search:", {k: v for k, v in searched.items()})
    print("wrote", os.path.relpath(path, os.path.dirname(HERE)))
    return 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--discover", default="")
    ap.add_argument("--index", default="")
    ap.add_argument("--slugs", default="riverside_city,moreno_valley,norco")
    ap.add_argument("--delay", type=int, default=int(os.environ.get("CENSUS_DELAY_MS", "3000")))
    a = ap.parse_args(argv)
    if not (a.discover or a.index):
        ap.error("--discover URL or --index URL")
    wanted = record_codes([s for s in a.slugs.split(",") if s])

    from playwright.sync_api import sync_playwright  # runner only
    with sync_playwright() as p:
        browser = p.chromium.launch()
        probe = browser.new_page()
        ua = probe.evaluate("navigator.userAgent").replace("HeadlessChrome", "Chrome")
        probe.close()
        ctx = browser.new_context(user_agent=ua + " " + census.UA_SUFFIX, accept_downloads=False)
        reader = census.Reader(ctx.new_page(), ctx.request, a.delay)
        if a.index:
            searched = search_all(reader, a.index, a.delay)
        else:
            found = discover(reader, a.discover)
        browser.close()

    if a.index:
        return write_index(a.index, searched, wanted, reader.loads)

    run = os.environ.get("GITHUB_RUN_ID", "local")
    listed = {norm_code(r["row"]) for r in (found.get("rows_at_load") or {}).get("rows", [])} - {None}
    out = {"run": run, "at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "loads": reader.loads,
           "wanted": {k: len(v) for k, v in wanted.items()},
           "wanted_union": len(set().union(*wanted.values())) if wanted else 0,
           "sample_rows_with_code": len(listed), "discover": found}
    os.makedirs(OUT_DIR, exist_ok=True)
    path = os.path.join(OUT_DIR, "discover_%s.json" % run)
    with open(path, "w") as f:
        json.dump(out, f, indent=1)
    print(json.dumps({k: out[k] for k in ("loads", "wanted", "wanted_union", "sample_rows_with_code")}, indent=1))
    print("report links at load:", (found.get("rows_at_load") or {}).get("count"),
          "after scroll:", found.get("rows_after_scroll"), "json calls:", len(found.get("calls_at_load") or []))
    print("wrote", os.path.relpath(path, os.path.dirname(HERE)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
