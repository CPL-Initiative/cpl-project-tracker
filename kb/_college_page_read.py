#!/usr/bin/env python3
"""Read a named list of one college's pages from a runner and print what they say.

WHY. A curated line on CPL Pathways marked *To confirm* waits on a page this
container cannot reach (the egress proxy blocks college sites; a runner reaches
them). Sam, sheet 33 card 5 (2026-10-04): the agent exhausts its own reading
before anyone drafts a request to a college. This is that reading for a fixed
question list: each page in kb/college_reads/<plan>.json names the line it
answers, and the job log carries the page's text for a session to read back
through the GitHub MCP. What the read reaches and what it is refused becomes
the college's procedure record (sheet 34 card 2).

Polite by construction, as the census and the pilot capture are: the census's
Reader reads robots.txt first for every host, waits CENSUS_DELAY_MS before every
load and names the CPL Initiative in its user agent (Sam's sheet-23 call 5).
It WRITES NOTHING and runs on no schedule.

Usage (runner): python3 kb/_college_page_read.py kb/college_reads/cerritos_ironworker_ladder.json
"""
import hashlib
import json
import os
import re
import sys
import urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

HTML_FULL_CAP = 20000    # an HTML page this short prints whole
HEAD_CAP = 3000          # else its opening, then the excerpts
PDF_PAGE_CAP = 14        # PDF pages printed whole (those with a keyword hit)
RADIUS = 350             # characters kept on each side of a keyword hit
MAX_EXCERPTS = 24
FOLLOW_CAP = 5           # links read one level deeper from one page


def is_pdf(url: str, content_type: str | None = None) -> bool:
    if content_type and "application/pdf" in content_type.lower():
        return True
    return urllib.parse.urlparse(url).path.lower().endswith(".pdf")


def keyword_re(keywords: list[str]) -> re.Pattern:
    """One case-blind pattern; each keyword is a regex fragment (the plan
    escapes its own dots)."""
    return re.compile("|".join("(?:%s)" % k for k in keywords), re.I)


def excerpts(text: str, pattern: re.Pattern, radius: int = RADIUS,
             cap: int = MAX_EXCERPTS) -> list[str]:
    """Windows around every hit, overlapping windows merged, in page order."""
    spans: list[list[int]] = []
    for m in pattern.finditer(text or ""):
        a, b = max(0, m.start() - radius), min(len(text), m.end() + radius)
        if spans and a <= spans[-1][1]:
            spans[-1][1] = max(spans[-1][1], b)
        else:
            spans.append([a, b])
    return [" ".join(text[a:b].split()) for a, b in spans[:cap]]


def same_site(href: str, base: str) -> bool:
    from _program_source_census import registrable
    h = urllib.parse.urlparse(href).hostname or ""
    b = urllib.parse.urlparse(base).hostname or ""
    return bool(h) and registrable(h) == registrable(b)


def follow_links(links: list[dict], pattern: str | None, base: str,
                 seen: set, cap: int = FOLLOW_CAP) -> list[dict]:
    """Links whose words or address match the page's follow pattern, on the
    college's own registrable domain, not already read, no fragments or mail."""
    if not pattern:
        return []
    rx = re.compile(pattern, re.I)
    out, picked = [], set()
    for ln in links or []:
        href = (ln.get("href") or "").split("#")[0]
        if not href.startswith("http") or href in seen or href in picked:
            continue
        if not same_site(href, base):
            continue
        if rx.search(ln.get("text") or "") or rx.search(href):
            out.append({"text": (ln.get("text") or "")[:120], "href": href})
            picked.add(href)
        if len(out) >= cap:
            break
    return out


def pdf_pages_to_print(pages: list[str], pattern: re.Pattern,
                       cap: int = PDF_PAGE_CAP) -> list[int]:
    """Page indexes with a keyword hit, in order; the first page when none hit."""
    hit = [i for i, p in enumerate(pages) if pattern.search(p or "")]
    return (hit or ([0] if pages else []))[:cap]


TEXT_JS = """() => ({text: document.body ? document.body.innerText : '',
  links: Array.from(document.querySelectorAll('a[href]')).slice(0, 2500)
    .map(a => ({text: (a.innerText || a.textContent || a.getAttribute('aria-label')
                       || a.title || '').trim().slice(0, 160), href: a.href}))})"""


def read_one(reader, url: str, pattern: re.Pattern, cache: dict) -> dict:
    """One page through the census's Reader (or the pilot's PDF reader), with
    its text, its links and the excerpts around the plan's keywords."""
    from _program_requirements_pilot import read_pdf, pdfminer_pages
    out = {"url": url}
    if not is_pdf(url):
        got = reader.load(url)
        out.update({k: got.get(k) for k in ("status", "final_url", "content_type",
                                             "access", "error", "title")})
        if got.get("access") == "ok" and not is_pdf(url, got.get("content_type")):
            try:
                reader.page.wait_for_timeout(1500)   # a script-built page fills in late
                page = reader.page.evaluate(TEXT_JS)
                out["text"], out["links"] = page.get("text") or "", page.get("links") or []
            except Exception as exc:
                out["error"] = str(exc).splitlines()[0][:200]
            out["kind"] = "html"
            return finish(out, pattern)
        if not is_pdf(url, got.get("content_type")):
            out["kind"] = "html"
            return finish(out, pattern)
    pdf = read_pdf(reader, url, cache)
    pages = pdf.get("pages") or []
    extractor = pdf.get("extractor")
    if pdf.get("data") and not "".join(pages).strip():
        alt = pdfminer_pages(pdf)
        pages, extractor = alt.get("pages") or [], alt.get("extractor")
    out.update(kind="pdf", status=pdf.get("status"), access=pdf.get("access"),
               content_type=pdf.get("content_type"), error=pdf.get("error"),
               bytes=pdf.get("bytes"), extractor=extractor, pages=pages,
               text="\n\n".join(pages))
    return finish(out, pattern)


def finish(out: dict, pattern: re.Pattern) -> dict:
    text = out.get("text") or ""
    out["chars"] = len(text)
    out["sha256"] = hashlib.sha256(text.encode("utf-8")).hexdigest()[:16] if text else None
    out["excerpts"] = excerpts(text, pattern)
    return out


def print_page(n: int, rec: dict, pattern: re.Pattern) -> None:
    print("\n##### PAGE %d · answers: %s%s" % (n, ", ".join(rec.get("answers") or []),
          (" · followed from page %d" % rec["from"]) if rec.get("from") else ""))
    for k in ("url", "final_url", "status", "access", "kind", "content_type", "chars",
              "sha256", "bytes", "extractor", "title", "error"):
        if rec.get(k) not in (None, ""):
            print("%s: %s" % (k, rec[k]))
    if rec.get("followed"):
        print("--- links followed ---")
        for f in rec["followed"]:
            print("- %s -> %s" % (f["text"], f["href"]))
    text = rec.get("text") or ""
    if rec.get("kind") == "pdf" and rec.get("pages"):
        idx = pdf_pages_to_print(rec["pages"], pattern)
        print("--- %d of %d PDF pages (those naming a keyword) ---" % (len(idx), len(rec["pages"])))
        for i in idx:
            print("[pdf page %d]" % (i + 1))
            print(rec["pages"][i].strip())
        return
    if not text:
        return
    if len(text) <= HTML_FULL_CAP:
        print("--- text (whole page) ---")
        print(text.strip())
        return
    print("--- text (first %d characters of %d) ---" % (HEAD_CAP, len(text)))
    print(text[:HEAD_CAP].strip())
    print("--- excerpts around the keywords (%d) ---" % len(rec.get("excerpts") or []))
    for e in rec.get("excerpts") or []:
        print("… " + e + " …")


def main(argv: list[str] | None = None) -> int:
    argv = sys.argv[1:] if argv is None else argv
    if not argv:
        print(__doc__)
        return 2
    plan = json.load(open(argv[0]))
    pattern = keyword_re(plan["keywords"])
    from _program_requirements_pilot import open_reader
    delay = int(os.environ.get("CENSUS_DELAY_MS", "4000"))
    pw, browser, reader = open_reader(delay)
    cache: dict = {}
    seen: set = set()
    records: list[dict] = []
    print("college page read: %s, %d pages, %.1f s between loads" % (
        plan.get("college"), len(plan["pages"]), delay / 1000.0))
    try:
        for target in plan["pages"]:
            queue = [(target["url"], None)]
            while queue:
                url, parent = queue.pop(0)
                if url in seen:
                    continue
                seen.add(url)
                rec = read_one(reader, url, pattern, cache)
                rec["answers"] = target.get("answers") or []
                if parent:
                    rec["from"] = parent
                records.append(rec)
                n = len(records)
                if not parent:
                    fol = follow_links(rec.get("links"), target.get("follow"),
                                       rec.get("final_url") or url, seen)
                    rec["followed"] = fol
                    queue.extend((f["href"], n) for f in fol)
                print_page(n, rec, pattern)
    finally:
        browser.close()
        pw.stop()
    print("\n=== COLLEGE PAGE READ JSON BEGIN ===")
    for i, r in enumerate(records, 1):
        print(json.dumps({"n": i, "url": r["url"], "final_url": r.get("final_url"),
                          "from": r.get("from"), "answers": r.get("answers"),
                          "status": r.get("status"), "access": r.get("access"),
                          "kind": r.get("kind"), "chars": r.get("chars"),
                          "sha256": r.get("sha256"), "excerpts": len(r.get("excerpts") or []),
                          "error": r.get("error")}, ensure_ascii=False))
    print("=== COLLEGE PAGE READ JSON END ===")
    print("loads: %d" % reader.loads)
    return 0


if __name__ == "__main__":
    sys.exit(main())
