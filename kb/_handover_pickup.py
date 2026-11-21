#!/usr/bin/env python3
"""The reader's pickup for hand-overs: visit the link a person gave, open the file they dropped, call the API address
they asked to test, and answer on the row.

WHY (Sam, 2026-11-20, on the locked Commons order mock: "yes, build it!"; cpl_memory
r-hand-over-in-place-sam-2026-11-20: "item or link and a try the link button"). commons_handover.js lets a signed-in
reviewer hand over a file, a link, pasted data or an API procedure; each is one row in commons_handover, waiting. This
reads the waiting rows with the service key, looks at each one the way the outline reader would, and says on the row
what it found (commons_handover_mark, the service role alone). The page reads the answer back.

WHAT IT DOES, by kind:
  link   One visit by the polite Reader (kb/_program_source_census.py): it names itself (CPLInitiativeCatalogCensus),
         reads robots.txt first, and files a bot check as one. It never tries to pass a check, and after a host
         answers one check in a run it loads nothing more from that host (Sam, 2026-11-18, #3536). A page that reads is
         parsed by the outline reader's own parser (kb/_course_outcomes_read.py parse_page) for a count.
  file   The file is read from the private bucket and its text parsed for the same count. PDF by pypdf; a saved web
         page by the reader's parser; a CSV by its header and row count; any other kind is reported by size alone.
  api    A row asking for a test gets one GET under the reader's name, robots.txt first. A saved procedure with no
         test is left for a session to wire in.
  paste  Nothing to read: it waits for a session to file it.

WHAT IT NEVER KEEPS. A course outline can name faculty (kb/_course_outcomes_read.py OUTCOMES_ONLY_HOSTS;
d-ccsf-outline-trial-no-staff-names-s689). The file stays in the private bucket; nothing here writes it, its name or
its text to the repository, the log or the row. `found` holds counts and the parser's own section-heading words. The
pickup does not read the handed_by or file_name columns at all.

WHAT IT DOES NOT DO YET (each its own guarded step, named in docs/reference/lanes/commons.md): load parsed outcomes
into course_outcomes; save a link that reads as the registry's outline source; wire an API procedure into a read.

Usage (the runner, commons-handover-pickup.yml):
    python3 kb/_handover_pickup.py [--id UUID] [--limit 25] [--dry]
    SUPABASE_SERVICE_KEY in the environment; --dry lists what waits and answers nothing.
"""
from __future__ import annotations

import argparse
import csv
import html.parser
import importlib.util
import io
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co").rstrip("/")
BUCKET = "commons-handover"
# The columns the pickup reads. handed_by and file_name are left out on purpose: it needs neither, and never logs one.
COLUMNS = "id,created_at,dataset,subject_kind,college,course_code,kind,file_path,file_type,file_bytes,link_url,api,status"
LIMIT = 25
PDF_PAGE_CAP = 600
HEADS_CAP = 12
UUID = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.I)


def _load(name: str, file: str):
    spec = importlib.util.spec_from_file_location(name, os.path.join(HERE, file))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


_READERS = {}


def readers():
    """The outline reader (parse_page, section_heads) with the census (the polite Reader) and the outline census
    (load_full) it already loads. One copy of each, loaded on first use."""
    if not _READERS:
        rd = _load("course_outcomes_read", "_course_outcomes_read.py")
        _READERS.update(rd=rd, census=rd.census, cor=rd.cor)
    return _READERS


# ── what a parse found, as counts and heading words only ──
def counts_of(page_html: str, text: str, url: str | None = None) -> dict:
    """The outline parser's count for a page or a file's text: outcomes, objectives, and the section headings the
    parser's own patterns name. Never a line of the text."""
    R = readers()
    rd = R["rd"]
    try:
        got = rd.parse_page(page_html or "", text or "", rd.page_system(url) if url else None, url)
    except Exception:
        got = {}
    outcomes = list(got.get("outcomes") or [])
    for g in got.get("groups") or []:
        outcomes.extend(g.get("outcomes") or [])
    heads = []
    for h in rd.section_heads(text or ""):
        if h not in heads:
            heads.append(h)
    return {"outcomes": len(outcomes), "objectives": len(got.get("objectives") or []),
            "section_heads": [h[:60] for h in heads[:HEADS_CAP]], "chars": len(text or "")}


class _Text(html.parser.HTMLParser):
    """A saved web page's visible text, one block per line."""
    SKIP = {"script", "style", "noscript", "template"}
    BLOCK = {"p", "div", "li", "tr", "br", "h1", "h2", "h3", "h4", "h5", "h6", "section", "article", "td", "th", "dt", "dd"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out, self.skip = [], 0

    def handle_starttag(self, tag, attrs):
        if tag in self.SKIP:
            self.skip += 1
        elif tag in self.BLOCK:
            self.out.append("\n")

    def handle_endtag(self, tag):
        if tag in self.SKIP and self.skip:
            self.skip -= 1
        elif tag in self.BLOCK:
            self.out.append("\n")

    def handle_data(self, data):
        if not self.skip:
            self.out.append(data)


def html_text(page_html: str) -> str:
    p = _Text()
    try:
        p.feed(page_html or "")
    except Exception:
        return ""
    return re.sub(r"\n[ \t]*\n+", "\n", re.sub(r"[ \t]+", " ", "".join(p.out))).strip()


def pdf_text(data: bytes) -> tuple[str, int]:
    """A PDF's text and its page count (pypdf, as the catalog reader uses). Raises when the file is no PDF."""
    from pypdf import PdfReader  # the runner installs it
    reader = PdfReader(io.BytesIO(data))
    pages = reader.pages
    return "\n".join((pg.extract_text() or "") for pg in pages[:PDF_PAGE_CAP]), len(pages)


# ── the three judgments, each a pure function of what was seen ──
def judge_link(page: dict, parsed: dict | None = None) -> tuple[str, str, dict]:
    """(status, note, found) for one visit. `page` is the Reader's load: access, status, waf, title, final_url,
    content_type. A bot check is filed as one; the reader never tries to pass it."""
    R = readers()
    census, cor = R["census"], R["cor"]
    status, access = page.get("status"), page.get("access")
    host = urllib.parse.urlparse(page.get("final_url") or page.get("url") or "").netloc.lower()
    found = {"http_status": status, "final_host": host}
    if page.get("content_type"):
        found["content_type"] = str(page["content_type"]).split(";")[0].strip()[:80]
    if access == "challenge" or page.get("waf"):
        return "bot_check", "The site answered our reader with a bot check (%s)." % (page.get("waf") or "a challenge page"), found
    if access == "robots_disallow":
        return "could_not_read", "The site's robots.txt refuses automated reading of this address.", found
    if status is None:
        return "could_not_read", "The address did not answer.", found
    if status == 401 or cor.access_of(page) == "sign_in":
        return "could_not_read", "The address asks for a sign-in.", found
    if census.BLOCK_TITLE.search(page.get("title") or "") or status in (403, 406, 429, 503):
        return "bot_check", "The site refused or challenged our reader (status %s)." % status, found
    if status in (404, 410):
        return "could_not_read", "The address was not found (status %s)." % status, found
    if status >= 400:
        return "could_not_read", "The address answered with status %s." % status, found
    found.update(parsed or {})
    return "reads", "", found


def judge_file(data: bytes, file_type: str) -> tuple[str, str, dict]:
    """(status, note, found) for a dropped file. Counts and heading words only."""
    t = (file_type or "").lower()
    found = {"bytes": len(data), "file_type": t[:80]}
    if not data:
        return "could_not_read", "The file is empty.", found
    if t == "application/pdf":
        try:
            text, pages = pdf_text(data)
        except Exception:
            return "could_not_read", "The file could not be opened as a PDF.", found
        found["pages"] = pages
        if not text.strip():
            return "could_not_read", "The PDF holds no text our reader can read. It may be a scan.", found
        found.update(counts_of("", text))
        return "reads", "", found
    if t == "text/html":
        page_html = data.decode("utf-8", "replace")
        text = html_text(page_html)
        if not text:
            return "could_not_read", "The saved page holds no text.", found
        found.update(counts_of(page_html, text))
        return "reads", "", found
    if t == "text/plain":
        text = data.decode("utf-8", "replace")
        found.update(counts_of("", text))
        return "reads", "", found
    if t == "text/csv":
        try:
            rows = list(csv.reader(io.StringIO(data.decode("utf-8-sig", "replace"))))
        except Exception:
            return "could_not_read", "The file could not be read as a CSV.", found
        if not rows:
            return "could_not_read", "The CSV holds no rows.", found
        found["rows"] = max(len(rows) - 1, 0)
        found["columns"] = [str(c).strip()[:40] for c in rows[0][:40]]
        return "reads", "", found
    # A spreadsheet, a Word file or a zip: stored and sized; a session opens it.
    return "reads", "Stored. A session opens this kind of file.", found


def judge_api(status: int | None, headers: dict, body: bytes, error: str | None = None) -> tuple[str, str, dict]:
    """(status, note, found) for one GET of an API address."""
    census = readers()["census"]
    found = {"http_status": status, "bytes": len(body or b"")}
    headers = {str(k).lower(): v for k, v in (headers or {}).items()}   # a server spells a header's name any way it likes
    ctype = str(headers.get("content-type") or "").split(";")[0].strip()[:80]
    if ctype:
        found["content_type"] = ctype
    if error or status is None:
        return "could_not_read", "The address did not answer.", found
    waf = census.challenge_header(headers)
    if waf or status in (403, 406, 429, 503):
        return "bot_check", "The address refused or challenged our reader (status %s)." % status, found
    if status == 401:
        return "could_not_read", "The address asks for a key or a sign-in (status 401).", found
    if status >= 400:
        return "could_not_read", "The address answered with status %s." % status, found
    try:
        parsed = json.loads((body or b"").decode("utf-8", "replace"))
        found["json"] = True
        found["top"] = "list of %d" % len(parsed) if isinstance(parsed, list) else (
            "object with %d keys" % len(parsed) if isinstance(parsed, dict) else type(parsed).__name__)
    except Exception:
        found["json"] = False
    return "reads", "", found


# ── the database and the store, with the service key ──
class Api:
    def __init__(self, key: str, url: str = SUPABASE_URL, opener=None):
        self.key, self.url, self.open = key, url, opener or urllib.request.urlopen

    def _req(self, path: str, data: bytes | None = None, method: str = "GET", extra: dict | None = None):
        h = {"apikey": self.key, "Authorization": "Bearer " + self.key}
        h.update(extra or {})
        return urllib.request.Request(self.url + path, data=data, method=method, headers=h)

    def waiting(self, limit: int = LIMIT) -> list[dict]:
        q = "/rest/v1/commons_handover?status=eq.waiting&select=%s&order=created_at.asc&limit=%d" % (COLUMNS, limit)
        with self.open(self._req(q), timeout=60) as r:
            return json.loads(r.read().decode("utf-8"))

    def file(self, path: str) -> bytes:
        with self.open(self._req("/storage/v1/object/%s/%s" % (BUCKET, urllib.parse.quote(path))), timeout=300) as r:
            return r.read()

    def mark(self, row_id: str, status: str, note: str, run: str, found: dict) -> dict:
        body = json.dumps({"p_id": row_id, "p_status": status, "p_note": note or None, "p_run": run or None,
                           "p_found": found}).encode("utf-8")
        req = self._req("/rest/v1/rpc/commons_handover_mark", body, "POST", {"Content-Type": "application/json"})
        with self.open(req, timeout=60) as r:
            return json.loads(r.read().decode("utf-8"))


def pdf_link_counts(reader, url: str) -> dict:
    """A link that is a PDF: its pages and the parser's count, read once through the reader's own request context
    (the same name, the same robots answer already given for this host)."""
    out = {"pdf": True}
    try:
        resp = reader.request.get(url, timeout=120000)
        data = resp.body() if resp.ok else b""
        if data and len(data) <= 52428800:
            text, pages = pdf_text(data)
            out["pages"] = pages
            out.update(counts_of("", text))
    except Exception:
        pass
    return out


def order_rows(rows: list[dict], first_id: str | None) -> list[dict]:
    """The named row first, then the rest as they were handed over."""
    if not first_id:
        return rows
    return [r for r in rows if r.get("id") == first_id] + [r for r in rows if r.get("id") != first_id]


def needs_look(row: dict) -> bool:
    """Whether the pickup has anything to do with a waiting row."""
    kind = row.get("kind")
    if kind in ("link", "file"):
        return True
    return kind == "api" and bool((row.get("api") or {}).get("test"))


def tag(row: dict) -> str:
    """A row as the log names it: never a person, a file name or an address."""
    return "%s %s %s%s" % (str(row.get("id") or "")[:8], row.get("kind"), row.get("college") or row.get("dataset") or "",
                           " " + row["course_code"] if row.get("course_code") else "")


def fetch_api(address: str, ua: str, robots_allows, opener=None):
    """One GET under the reader's name, robots.txt first. Returns (status, headers, body, error, refused)."""
    opener = opener or urllib.request.urlopen
    root = "%s://%s/" % urllib.parse.urlparse(address)[:2]
    try:
        with opener(urllib.request.Request(root + "robots.txt", headers={"User-Agent": ua}), timeout=20) as r:
            robots = r.read().decode("utf-8", "replace") if r.status == 200 else None
    except Exception:
        robots = None
    if not robots_allows(robots, address):
        return None, {}, b"", None, True
    try:
        with opener(urllib.request.Request(address, headers={"User-Agent": ua, "Accept": "application/json, */*"}), timeout=30) as r:
            return r.status, dict(r.headers.items()), r.read(2_000_000), None, False
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers.items()) if e.headers else {}, b"", None, False
    except Exception as e:  # a timeout, a DNS failure
        return None, {}, b"", (str(e).splitlines() or [type(e).__name__])[0][:120], False


def run(api, rows: list[dict], run_id: str, *, make_reader=None, api_get=None, log=print) -> dict:
    """Look at each row and answer it. Returns counts by status."""
    R = readers()
    census, cor = R["census"], R["cor"]
    tally: dict[str, int] = {}
    challenged: set[str] = set()   # hosts that answered a bot check in this run: nothing more is loaded from them
    reader = None
    for row in rows:
        if not needs_look(row):
            tally["left_waiting"] = tally.get("left_waiting", 0) + 1
            continue
        kind = row.get("kind")
        try:
            if kind == "link":
                url = row.get("link_url") or ""
                host = urllib.parse.urlparse(url).netloc.lower()
                if host in challenged:
                    status, note, found = "bot_check", "The site answered a bot check earlier in this run, so our reader loaded nothing more from it.", {"final_host": host}
                else:
                    if reader is None:
                        reader = make_reader()
                    page = cor.load_full(reader, url)
                    parsed = None
                    if page.get("status") and page.get("status") < 400 and "application/pdf" not in (page.get("content_type") or ""):
                        parsed = counts_of(page.get("html") or "", page.get("body") or "", url)
                    elif "application/pdf" in (page.get("content_type") or ""):
                        parsed = pdf_link_counts(reader, url)
                    status, note, found = judge_link(page, parsed)
                    if status == "bot_check":
                        challenged.add(host)
            elif kind == "file":
                status, note, found = judge_file(api.file(row.get("file_path") or ""), row.get("file_type") or "")
            else:
                address = (row.get("api") or {}).get("address") or ""
                st, headers, body, err, refused = (api_get or (lambda a: fetch_api(a, census.UA_SUFFIX, census.robots_allows)))(address)
                if refused:
                    status, note, found = "could_not_read", "The site's robots.txt refuses automated reading of this address.", {}
                else:
                    status, note, found = judge_api(st, headers, body, err)
        except Exception as exc:
            status, note, found = "could_not_read", "Our reader stopped on an error (%s)." % type(exc).__name__, {}
        api.mark(row["id"], status, note, run_id, found)
        tally[status] = tally.get(status, 0) + 1
        log("%s: %s%s" % (tag(row), status, " (" + note + ")" if note else ""))
    return tally


def browser_reader(delay_ms: int = 3000):
    """The polite Reader on a headless browser, as the outline read builds it. Returns (reader, close)."""
    census = readers()["census"]
    from playwright.sync_api import sync_playwright  # runner only
    p = sync_playwright().start()
    browser = p.chromium.launch()
    probe = browser.new_page()
    ua = probe.evaluate("navigator.userAgent").replace("HeadlessChrome", "Chrome")
    probe.close()
    ctx = browser.new_context(user_agent=ua + " " + census.UA_SUFFIX, accept_downloads=False)
    reader = census.Reader(ctx.new_page(), ctx.request, delay_ms)

    def close():
        try:
            browser.close()
        finally:
            p.stop()
    return reader, close


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--id", default="", help="one hand-over to look at first")
    ap.add_argument("--limit", type=int, default=LIMIT)
    ap.add_argument("--dry", action="store_true", help="list what waits; answer nothing")
    ap.add_argument("--run", default=os.environ.get("GITHUB_RUN_ID", "local"))
    a = ap.parse_args(argv)
    if a.id and not UUID.match(a.id):
        print("--id is not a hand-over's id")
        return 2
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not key:
        print("SUPABASE_SERVICE_KEY is not set; the pickup reads and answers with the service role.")
        return 2
    api = Api(key)
    rows = order_rows(api.waiting(max(1, min(a.limit, 100))), a.id or None)
    todo = [r for r in rows if needs_look(r)]
    print("%d hand-over(s) waiting; %d for the reader to look at" % (len(rows), len(todo)))
    if a.dry or not todo:
        for r in rows:
            print("  " + tag(r) + ("" if needs_look(r) else " (waits for a session)"))
        return 0
    closer = []

    def make_reader():
        reader, close = browser_reader(int(os.environ.get("CENSUS_DELAY_MS", "3000")))
        closer.append(close)
        return reader

    try:
        tally = run(api, rows, a.run, make_reader=make_reader)
    finally:
        for close in closer:
            close()
    print("answered: " + (", ".join("%s %d" % kv for kv in sorted(tally.items())) or "none"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
