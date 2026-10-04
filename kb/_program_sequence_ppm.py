#!/usr/bin/env python3
"""The program requirements pilot, sequence pass: read a program's term-by-term map.

Phase 1 of the program requirements harvest
(docs/reference/lanes/program-requirements-harvest.md). Sam's call 4 on sheet
23 (2026-10-03) takes sequencing in the pilot only from Miramar's Program
Pathways Mapper: the Fire Technology A.S. (05100). The capture pass
(kb/_program_requirements_pilot.py) reads the program's requirements from the
catalog; this pass reads the order a college recommends for them.

Finding the mapper. A Program Pathways Mapper has no fixed address: the census
found them at <slug>.programmapper.ws|.com|.org, programmap.<domain> and a
college's own hosts (pm.hartnell.edu, mypath.contracosta.edu). It found no
mapper link on Miramar's pages (S320-S322), and S324's four guessed hosts
answered 403 or did not resolve. A web search (2026-10-04, S325) found the
college's own Program Mapper page, sdmiramar.edu/program-mapper, and a Fire
Protection Technology page that names a mapper link. This pass starts there and
follows the link or iframe that leads to the mapper itself.

Inside the mapper. A mapper is a JavaScript application: its pages fill in
after load and its programs sit under pathway pages. The reader follows links
by the program's title words, explores pathway pages when none names it, and
clicks a "Program Map" item when the program's page holds its courses but no
term. It accepts a page that names half the courses the state's Program Course
File lists for the program AND at least two terms ("Semester 1", "Fall
Semester", "Year 2"). It also files what the application fetched as JSON from
the mapper's host, so a later pass can read a sequence without a browser where
the mapper serves one.

It writes nothing. It prints a JSON object per program between markers, which a
session reads from the job log through the GitHub MCP. The reads follow the
census's rules (Sam's call 5 on sheet 23): robots.txt first for every host,
CENSUS_DELAY_MS between loads, the census user agent, and MAX_LOADS loads.

Run (on the runner):
    python3 kb/_program_sequence_ppm.py
The pure functions are tested in tests/program_requirements_pilot_test.py
without a browser or a network.
"""
from __future__ import annotations

import json
import os
import re
import sys
import time
import urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_requirements_pilot as P  # noqa: E402

# The programs this pass reads, and the college pages it enters the mapper
# from. Sam's call 4 on sheet 23 names one: Miramar's Fire Technology A.S.
PPM_PROGRAMS = {("San Diego Miramar College", "05100")}
PPM_START = {
    "San Diego Miramar College": [
        "https://sdmiramar.edu/program-mapper",
        "https://sdmiramar.edu/programs/fire-protection-technology",
    ],
}
MAX_LOADS = 16           # page loads and clicks per program
MAX_CLICKS = 3           # "Program Map" items or program cards clicked on one page
API_CAP = 6000           # characters kept of each JSON response from the mapper
API_KEEP = 25            # JSON responses kept per program

MAPPER_HOST = re.compile(r"programmap|mapper", re.I)
MAPPER_TEXT = re.compile(r"program\s+(?:pathways?\s+)?mapper|\bprogram\s+maps?\b", re.I)
# A mapper's pathway pages, under which its programs sit.
PATHWAY_HREF = re.compile(r"/(?:interest-clusters?|pathways?|clusters?|areas?|academics)(?:/|$)", re.I)
MAP_ITEM = re.compile(r"^(?:view\s+)?(?:program\s+map|course\s+map|map|course\s+sequence|"
                      r"roadmap|semester[- ]by[- ]semester|pathway\s+map)$", re.I)
TERM_WORDS = re.compile(
    r"\b(?:semester|term|quarter)\s*(?:[1-9]|one|two|three|four|five|six)\b"
    r"|\b(?:fall|spring|summer|winter)\s+(?:semester|term|quarter)\b"
    r"|\b(?:fall|spring|summer|winter)\s+[1-4]\b"
    r"|\byear\s*[1-4]\b"
    r"|\b(?:first|second|third|fourth)\s+(?:semester|term|quarter|year)\b", re.I)
ACCEPT_TERMS = 2


def host(url: str) -> str:
    return urllib.parse.urlparse(url or "").netloc.lower()


def on_mapper(url: str, known: set | frozenset = frozenset()) -> bool:
    """A mapper application's page: its host names the mapper
    (miramar.programmapper.ws, programmap.cuesta.edu), or a link naming the
    mapper led to its host from another one (pm.hartnell.edu). A page's title
    is no test: the college's own page about the mapper is titled "Program
    Mapper" too, and its links lead around the college's site."""
    return bool(MAPPER_HOST.search(host(url))) or host(url) in known


def mapper_link(text: str, href: str, here: str) -> int:
    """How strongly a link on a college page leads into its mapper. A link to
    a mapper host counts most; words naming the mapper next. The college's own
    page about the mapper (sdmiramar.edu/program-mapper) is a step, not the
    destination, so it counts least."""
    h = (href or "").split("#")[0]
    if not h.startswith("http") or h == (here or "").split("#")[0]:
        return -1
    if P.REFUSE_LINK.search(text or "") or P.REFUSE_LINK.search(h):
        return -1
    score = 0
    if MAPPER_HOST.search(host(h)):
        score += 6
    if MAPPER_TEXT.search(text or ""):
        score += 3
    if not score and MAPPER_HOST.search(urllib.parse.urlparse(h).path):
        score += 1
    return score


def program_link(text: str, href: str, program: dict) -> int:
    """How strongly a link inside the mapper leads to this program. The
    title's words count, as on a catalog; a pathway page with none of them
    counts 1, so the reader explores pathways when no link names the program."""
    if not (href or "").startswith("http"):
        return -1
    s = P.score_link(text, href, program)
    if s > 2:
        return s
    if MAP_ITEM.match((text or "").strip()):
        return 5
    if PATHWAY_HREF.search(urllib.parse.urlparse(href).path) and (text or "").strip():
        return 1
    return -1 if s < 0 else 0


def term_markers(text: str, limit: int = 12) -> list[str]:
    """The terms a page names, in order, each once: "Semester 1", "Fall
    Semester", "Year 2"."""
    out, seen = [], set()
    for m in TERM_WORDS.finditer(text or ""):
        key = re.sub(r"\s+", " ", m.group(0).lower())
        if key not in seen:
            seen.add(key)
            out.append(re.sub(r"\s+", " ", m.group(0)))
            if len(out) >= limit:
                break
    return out


def accepts(found: dict, courses: list[dict], text: str) -> bool:
    """A sequence page names the program's own courses and at least two terms.
    A program's description page names its courses and no term; a mapper's
    front page names terms in its help text and none of the courses."""
    return P.coverage(found, courses) >= P.ACCEPT_SHARE and len(term_markers(text)) >= ACCEPT_TERMS


def map_items(texts: list[str]) -> list[str]:
    """The items on a program's page that open its map, in page order."""
    return [t for t in texts if MAP_ITEM.match((t or "").strip())]


# ── The browser half (runner only) ──────────────────────────────────────────
IFRAMES_JS = """() => Array.from(document.querySelectorAll('iframe[src]'))
  .map(f => ({text: 'iframe ' + (f.title || ''), href: f.src}))"""


# Hosts a page fetches JSON from that are never the mapper's data.
NOISE_HOST = re.compile(r"google|doubleclick|facebook|hotjar|cloudflareinsights|siteimprove|"
                        r"youtube|vimeo|clarity\.ms|newrelic|nr-data|sentry|segment|hubspot", re.I)


class ApiLog:
    """What the mapper application fetched as JSON, read after each load. It
    listens only while the reader is on a mapper page (active)."""

    def __init__(self, page):
        self.pending, self.kept, self.seen, self.active = [], [], set(), False
        page.on("response", self._on)

    def _on(self, resp):
        try:
            if self.active and resp.request.resource_type in ("xhr", "fetch") \
                    and not NOISE_HOST.search(host(resp.url)):
                self.pending.append(resp)
        except Exception:
            pass

    def drain(self):
        pending, self.pending = self.pending, []
        for resp in pending:
            if resp.url in self.seen or len(self.kept) >= API_KEEP:
                continue
            self.seen.add(resp.url)
            ctype = resp.headers.get("content-type") or ""
            if "json" not in ctype:
                continue
            try:
                body = resp.text()
            except Exception as exc:
                body = "(unreadable: %s)" % str(exc).splitlines()[0][:120]
            self.kept.append({"url": resp.url, "status": resp.status, "content_type": ctype[:60],
                              "chars": len(body), "sample": body[:API_CAP]})


def read_page(reader, url: str, cache: dict, api: ApiLog | None, spa: bool) -> dict:
    got = P.load(reader, url, cache, spa)
    if spa and got.get("access") == "ok" and not got.get("_settled"):
        # A mapper fills its program list after the first paint.
        reader.page.wait_for_timeout(4000)
        try:
            got.update(reader.page.evaluate(P.PAGE_JS))
        except Exception:
            pass
        got["_settled"] = True
    if got.get("access") == "ok" and "iframes" not in got:
        try:
            got["iframes"] = reader.page.evaluate(IFRAMES_JS)
        except Exception:
            got["iframes"] = []
    if api:
        api.drain()
    return got


def trail_row(url: str, why: str, got: dict, found: dict, courses: list[dict], text: str) -> dict:
    terms = term_markers(text)
    ok = accepts(found, courses, text)
    return {"url": url, "why": why, "status": got.get("status"), "access": got.get("access"),
            "final_url": got.get("final_url"), "title": (got.get("title") or "")[:120],
            "codes": len(found), "coverage": round(P.coverage(found, courses), 2),
            "terms": terms,
            "iframes": got.get("iframes") or None,
            "link_sample": None if ok else [[(ln.get("text") or "")[:60], ln.get("href")]
                                            for ln in (got.get("links") or [])[:60]],
            "clickables": None if ok else (got.get("clickables") or [])[:40],
            "body_sample": None if ok else (got.get("body") or "")[:1200]}


def page_text(got: dict, courses: list[dict]) -> tuple[str, dict]:
    fb = P.find_codes(got.get("body") or "", courses)
    fc = P.find_codes(got.get("content") or "", courses)
    text, found, _ = P.best_text(got, fb, fc)
    return text, found


def open_map(reader, program: dict, courses: list[dict], trail: list, api: ApiLog) -> dict | None:
    """On a program's page that names its courses and no term, click the item
    that opens its map ("Program Map"), or failing that the program's own card."""
    page = reader.page
    try:
        texts = page.evaluate(P.CLICKABLE_JS)
    except Exception:
        return None
    targets = map_items(texts) or sorted(
        {t for t in texts if P.clickable_candidate(t, program)}, key=lambda t: P.click_rank(t, program))
    for target in targets[:MAX_CLICKS]:
        time.sleep(reader.delay)
        reader.loads += 1
        try:
            page.get_by_text(target, exact=True).first.click(timeout=10000)
            try:
                page.wait_for_load_state("networkidle", timeout=8000)
            except Exception:
                pass
            page.wait_for_timeout(3000)
            got = page.evaluate(P.PAGE_JS)
        except Exception as exc:
            trail.append({"click": target, "error": str(exc).splitlines()[0][:160]})
            continue
        api.drain()
        got.update(status=200, access="ok", final_url=page.url)
        text, found = page_text(got, courses)
        row = trail_row(page.url, "clicked '%s'" % target[:60], got, found, courses, text)
        row["click"] = target
        trail.append(row)
        if accepts(found, courses, text):
            return {"url": page.url, "text": text, "found": found, "got": got}
    return None


def read_sequence(reader, college: str, cn: str, title: str) -> dict:
    prog = P.fetch_program(college, cn)
    rows = P.fetch_courses(college, cn)
    courses = P.closed_from_rows(rows)
    program = {"title": prog.get("program_title") or title, "award": prog.get("award")}
    rec = {"college": college, "control_number": cn, "title": program["title"],
           "award": program["award"], "closed_list": courses,
           "load_id": rows[0]["load_id"] if rows else None,
           "starts": PPM_START.get(college, [])}
    api, cache, trail, seen = ApiLog(reader.page), {}, [], set()
    queue = [(100 - i, u, "a college page about the mapper (web search, 2026-10-04)")
             for i, u in enumerate(PPM_START.get(college, []))]
    loads_before, best, mapper_hosts, known = reader.loads, None, [], set()
    while queue and reader.loads - loads_before < MAX_LOADS:
        queue.sort(key=lambda x: -x[0])
        score, url, why = queue.pop(0)
        if url in seen:
            continue
        seen.add(url)
        inside = on_mapper(url, known)
        api.active = inside
        got = read_page(reader, url, cache, api, spa=inside)
        final = got.get("final_url") or url
        inside = on_mapper(final, known)
        if inside and host(final) not in mapper_hosts:
            mapper_hosts.append(host(final))
        text, found = page_text(got, courses)
        row = trail_row(url, why, got, found, courses, text)
        row["on_mapper"] = inside
        trail.append(row)
        cov = P.coverage(found, courses)
        if best is None or (cov, len(term_markers(text))) > (best["coverage"], len(best["terms"])):
            best = {"url": final, "coverage": cov, "terms": term_markers(text), "text": text,
                    "found": found}
        if accepts(found, courses, text):
            break
        if inside and (cov >= P.ACCEPT_SHARE
                       or P.program_view(got.get("h1") or got.get("title") or "", program)):
            api.active = True
            opened = open_map(reader, program, courses, trail, api)
            if opened:
                best = {"url": opened["url"], "coverage": P.coverage(opened["found"], courses),
                        "terms": term_markers(opened["text"]), "text": opened["text"],
                        "found": opened["found"]}
                break
        links = (got.get("links") or []) + (got.get("iframes") or [])
        for ln in links:
            href = (ln.get("href") or "").split("#")[0]
            if not href.startswith("http") or href in seen:
                continue
            if inside and host(href) == host(final):
                s = program_link(ln.get("text", ""), href, program)
            else:
                s = mapper_link(ln.get("text", ""), href, final) * 10
                if s >= 30 and host(href) != host(final):
                    known.add(host(href))
            if s > 0:
                queue.append((s, href, "link '%s' on %s" % ((ln.get("text") or "")[:60], final)))
    best = best or {}
    found = best.get("found") or {}
    rec.update(trail=trail, mapper_hosts=mapper_hosts,
               accepted=bool(best) and accepts(found, courses, best.get("text") or ""),
               source={"url": best.get("url")}, coverage=round(best.get("coverage") or 0.0, 3),
               codes_found=sorted(found), terms=best.get("terms") or [],
               text=P.text_window(best.get("text") or "", found) if found else "",
               api=api.kept, loads=reader.loads - loads_before)
    return rec


def main() -> int:
    delay = int(os.environ.get("CENSUS_DELAY_MS", "4000"))
    sample = [p for p in P.load_sample() if (p["college"], p["control_number"]) in PPM_PROGRAMS]
    print("program requirements pilot, sequence pass: %d programs, %.1f s between loads, "
          "writes nothing" % (len(sample), delay / 1000), flush=True)
    pw, browser, reader = P.open_reader(delay)
    recs = []
    try:
        for entry in sample:
            t0 = time.time()
            try:
                rec = read_sequence(reader, entry["college"], entry["control_number"], entry["title"])
            except Exception as exc:
                rec = {"college": entry["college"], "control_number": entry["control_number"],
                       "error": str(exc).splitlines()[0][:300]}
            rec["seconds"] = round(time.time() - t0, 1)
            recs.append(rec)
            print("%-28s %-6s accepted %-5s cov %-5s terms %-2s loads %-3s %s" % (
                entry["college"][:28], entry["control_number"], rec.get("accepted"),
                rec.get("coverage"), len(rec.get("terms") or []), rec.get("loads"),
                (rec.get("source") or {}).get("url") or rec.get("error")), flush=True)
    finally:
        browser.close()
        pw.stop()
    print("=== PILOT SEQUENCES JSON BEGIN ===")
    for r in recs:
        print(json.dumps(r, ensure_ascii=False))
    print("=== PILOT SEQUENCES JSON END ===")
    return 0


if __name__ == "__main__":
    sys.exit(main())
