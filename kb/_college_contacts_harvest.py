#!/usr/bin/env python3
"""The college contacts harvest's runner: each college's leadership pages, cut to the lines near a title.

Step 8, piece 3, of the CPL queue routine (docs/reference/scheduled_sessions.md; the lane:
docs/reference/lanes/map-users-student-contact.md, *The weekly contacts harvest*). Sam, 2026-10-31:
"harvest the contacts when it sends runners out to collect our catalog data". A session cannot reach
college sites, so a GitHub runner reads them and commits what it read; the session reads those files
(piece 4) and writes one record a person found through college_contacts_harvest_apply().

On the census's terms (kb/_program_source_census.py, Sam's call 5 on sheet 23):

  * one page at a time, HARVEST_DELAY_MS between loads (default 4 s);
  * the browser's user agent carries a CPLInitiativeContactsHarvest token and the dashboard URL;
  * robots.txt is read first for every host, for that token, and a disallowed page is never loaded;
  * no page behind a sign-in: a page that lands on a login form is kept as `sign_in` with no text.

From each college's homepage it follows the links whose words name leadership (LEADERSHIP_WORDS), on
the college's own site, at most MAX_PAGES pages a site. A homepage link whose words name the district
and that leaves the college's site opens the district's site, read the same way once a run.

What it writes: kb/contacts_harvest/<run>/<slug>.json, one a college: each page's address, title and
access, its excerpts (the lines around a line that names a title from Sam's variants, POSITION_SIGNS,
with the position each names) and the page's mailto addresses. It writes nothing to Supabase: the
read is the session's, and the apply carries its own receipt.

Batch: `--colleges "A;B"` or `--batch N`, the N colleges read longest ago, never-read first, from the
run folders already committed under kb/contacts_harvest/.

The pure functions are tested by tests/college_contacts_harvest_runner_test.py over saved pages.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.robotparser
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from _program_source_census import (LINKS_JS, load_colleges, registrable,  # noqa: E402
                                    site_root)

OUT_DIR = os.path.join(HERE, "contacts_harvest")
UA_TOKEN = "CPLInitiativeContactsHarvest"
UA_SUFFIX = (UA_TOKEN + "/1.0 (California Community Colleges CPL Initiative; "
             "+https://cpl-initiative.github.io/cpl-project-tracker/)")
MAX_PAGES = 12
NAV_TIMEOUT_MS = 30000
CONTEXT_LINES = 3          # lines kept on each side of a line that names a title
MAX_EXCERPTS = 80          # a page's excerpts, so one long directory cannot fill the file
BODY_CHARS = 200000

# The step's words (scheduled_sessions.md step 8, piece 3), matched on a link's own words.
LEADERSHIP_WORDS = re.compile(
    r"\b(administration|administrators|leadership|president'?s office|office of the president|cabinet|"
    r"chancellor|directory|admissions (?:and|&) records|veterans?|articulation)\b", re.I)
DISTRICT_WORDS = re.compile(r"\bdistrict\b", re.I)
SKIP_HREF = re.compile(r"^(mailto:|tel:|javascript:)|\.(pdf|docx?|xlsx?|pptx?|jpe?g|png|gif|mp4|zip)(\?|#|$)", re.I)
SIGN_IN = re.compile(r"\b(sign[ -]?in|log[ -]?in|single sign-on|password)\b", re.I)

# Sam's positions and title variants (lane, *Positions* and *Title variants to match*). Order matters:
# the first sign that matches a line names its position, so the narrower titles come first
# ("Associate Vice Chancellor" before "Vice Chancellor" before "Chancellor").
POSITION_SIGNS: list[tuple[str, re.Pattern]] = [
    ("assoc_vice_chancellor", re.compile(r"\bassociate vice[- ]chancellor\b", re.I)),
    ("vice_chancellor", re.compile(r"\b(?:vice|deputy)[- ]chancellor\b", re.I)),
    ("assoc_vp", re.compile(r"\bassociate vice[- ]president\b", re.I)),
    ("vpaa", re.compile(
        r"\bvice[- ]president,?\s+(?:of\s+)?(?:academic affairs|instruction(?:al services)?"
        r"(?:\s+(?:and|&)\s+student services)?)\b|\bprovost\b|\bchief instructional officer\b|\bCIO\b",
        re.I)),
    ("vpss", re.compile(
        r"\bvice[- ]president,?\s+(?:of\s+)?student (?:services|affairs|success|support)\b|"
        r"\bchief student services officer\b|\bCSSO\b", re.I)),
    ("vpbs", re.compile(
        r"\bvice[- ]president,?\s+(?:of\s+)?(?:business|administrative|finance)\b|"
        r"\bchief business officer\b|\bCBO\b", re.I)),
    ("dean_cte", re.compile(
        r"\bdean\b[^.\n]{0,40}\b(?:career (?:and )?technical|career education|CTE|workforce)\b", re.I)),
    ("dean_ar", re.compile(
        r"\b(?:dean|director)\b[^.\n]{0,40}\badmissions\s+(?:and|&)\s+records\b", re.I)),
    ("dean_instruction", re.compile(r"\bdean\b,?\s+(?:of\s+)?instruction\b", re.I)),
    ("vrc", re.compile(
        r"\bveterans?\b[^.\n]{0,40}\b(?:director|coordinator)\b|"
        r"\b(?:director|coordinator)\b[^.\n]{0,40}\bveterans?\b", re.I)),
    ("articulation_officer", re.compile(r"\barticulation (?:officer|coordinator|specialist)\b", re.I)),
    ("college_ceo", re.compile(
        r"\bsuperintendent\s*[/-]\s*president\b|(?<![-\w])(?<!vice )(?<!vice-)(?<!student body )"
        r"(?<!associated students )(?<!past )president\b", re.I)),
    ("district_ceo", re.compile(r"(?<!vice )(?<!vice-)(?<!deputy )(?<!'s )\bchancellor\b(?!'s office)", re.I)),
]

EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")

BODY_JS = "() => (document.body ? document.body.innerText : '').slice(0, %d)" % BODY_CHARS
MAILTO_JS = """() => Array.from(document.querySelectorAll('a[href^="mailto:"]')).slice(0, 800)
  .map(a => ({text: (a.innerText || a.textContent || '').trim(), href: a.getAttribute('href')}))"""
PASSWORD_JS = "() => !!document.querySelector('input[type=password]')"


def slug(college: str) -> str:
    s = unicodedata.normalize("NFKD", college).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "_", s).strip("_")


def position_of(line: str) -> str | None:
    """The first of Sam's positions a line names, or None. A line naming no title is never guessed."""
    for pos, sign in POSITION_SIGNS:
        if sign.search(line):
            return pos
    return None


def excerpts(text: str, context: int = CONTEXT_LINES, cap: int = MAX_EXCERPTS) -> list[dict]:
    """The lines around each line that names a title, merged where windows touch.
    Each excerpt keeps its lines and the positions its title lines name."""
    lines = [ln.strip() for ln in (text or "").splitlines()]
    lines = [ln for ln in lines if ln]
    hits = [(i, position_of(ln)) for i, ln in enumerate(lines)]
    hits = [(i, p) for i, p in hits if p]
    out: list[dict] = []
    for i, pos in hits:
        lo, hi = max(0, i - context), min(len(lines), i + context + 1)
        if out and lo <= out[-1]["_hi"]:
            out[-1]["_hi"] = max(out[-1]["_hi"], hi)
            if pos not in out[-1]["positions"]:
                out[-1]["positions"].append(pos)
        else:
            out.append({"_lo": lo, "_hi": hi, "positions": [pos]})
    res = []
    for e in out[:cap]:
        chunk = lines[e["_lo"]:e["_hi"]]
        res.append({"positions": e["positions"], "lines": chunk,
                    "emails": sorted(set(EMAIL.findall(" ".join(chunk))))})
    return res


def leadership_links(links: list[dict], home_url: str) -> list[str]:
    """The homepage's links on the college's own site whose words name leadership, in page order."""
    host = registrable(urllib.parse.urlparse(home_url).netloc)
    seen, out = set(), []
    for ln in links or []:
        text, href = (ln.get("text") or "").strip(), (ln.get("href") or "").strip()
        if not href or SKIP_HREF.search(href) or not LEADERSHIP_WORDS.search(text):
            continue
        u = urllib.parse.urlparse(href)
        if u.scheme not in ("http", "https") or registrable(u.netloc) != host:
            continue
        key = u._replace(fragment="").geturl()
        if key.rstrip("/") == home_url.rstrip("/") or key in seen:
            continue
        seen.add(key)
        out.append(key)
    return out


def district_link(links: list[dict], home_url: str) -> str | None:
    """A homepage link whose words name the district and that leaves the college's site."""
    host = registrable(urllib.parse.urlparse(home_url).netloc)
    for ln in links or []:
        text, href = (ln.get("text") or "").strip(), (ln.get("href") or "").strip()
        if not DISTRICT_WORDS.search(text) or SKIP_HREF.search(href):
            continue
        u = urllib.parse.urlparse(href)
        if u.scheme in ("http", "https") and u.netloc and registrable(u.netloc) != host:
            return site_root(href)
    return None


def mailtos(items: list[dict]) -> list[dict]:
    out, seen = [], set()
    for m in items or []:
        addr = urllib.parse.unquote((m.get("href") or "")[7:].split("?")[0]).strip()
        if not EMAIL.fullmatch(addr) or addr.lower() in seen:
            continue
        seen.add(addr.lower())
        out.append({"email": addr, "text": (m.get("text") or "")[:120]})
    return out


def is_sign_in(final_url: str, has_password: bool, title: str) -> bool:
    return has_password or bool(re.search(r"/(login|signin|sso|cas/login|adfs)\b", final_url or "", re.I)) \
        or bool(SIGN_IN.search(title or "") and len(title or "") < 60)


def page_record(url: str, raw: dict) -> dict:
    """What a page's file entry keeps: no page text beyond the excerpts."""
    rec = {"url": url, "final_url": raw.get("final_url"), "status": raw.get("status"),
           "access": raw.get("access"), "title": (raw.get("title") or "")[:200]}
    if raw.get("access") == "ok":
        rec["excerpts"] = excerpts(raw.get("body", ""))
        rec["mailto"] = mailtos(raw.get("mailto"))
    if raw.get("error"):
        rec["error"] = raw["error"]
    return rec


def last_read(out_dir: str = OUT_DIR) -> dict[str, str]:
    """Each college's newest committed run folder name (the runs sort by time)."""
    seen: dict[str, str] = {}
    if not os.path.isdir(out_dir):
        return seen
    for run in sorted(os.listdir(out_dir)):
        d = os.path.join(out_dir, run)
        if not os.path.isdir(d):
            continue
        for f in os.listdir(d):
            if f.endswith(".json"):
                seen[f[:-5]] = run
    return seen


def pick_batch(colleges: list[dict], n: int, read: dict[str, str]) -> list[dict]:
    """The n colleges read longest ago: never read first (by name), then the oldest run."""
    return sorted(colleges, key=lambda c: (read.get(slug(c["college"]), ""), c["college"]))[:n]


class Reader:
    """One polite browser: robots for our token first, a delay before every load."""

    def __init__(self, page, request, delay_ms: int):
        self.page, self.request, self.delay = page, request, delay_ms / 1000.0
        self.robots: dict[str, str | None] = {}
        self.loads = 0

    def allowed(self, url: str) -> bool:
        root = site_root(url)
        if root not in self.robots:
            try:
                r = self.request.get(root + "robots.txt", timeout=15000)
                self.robots[root] = r.text() if r.ok else None
            except Exception:
                self.robots[root] = None
        txt = self.robots[root]
        if not txt:
            return True
        rp = urllib.robotparser.RobotFileParser()
        rp.parse(txt.splitlines())
        return rp.can_fetch(UA_TOKEN, url)

    def load(self, url: str) -> dict:
        if not self.allowed(url):
            return {"access": "robots_disallow", "status": None}
        time.sleep(self.delay)
        self.loads += 1
        try:
            resp = self.page.goto(url, wait_until="domcontentloaded", timeout=NAV_TIMEOUT_MS)
            try:
                self.page.wait_for_load_state("networkidle", timeout=8000)
            except Exception:
                pass
            status = resp.status if resp else None
            ctype = resp.headers.get("content-type", "") if resp else ""
            out = {"status": status, "final_url": self.page.url}
            if "html" not in ctype:
                out["access"] = "not_html"
                return out
            out["title"] = self.page.title() or ""
            if is_sign_in(self.page.url, self.page.evaluate(PASSWORD_JS), out["title"]):
                out["access"] = "sign_in"
                return out
            out["access"] = "ok" if status and status < 400 else "http_%s" % status
            out["links"] = self.page.evaluate(LINKS_JS)
            out["body"] = self.page.evaluate(BODY_JS) or ""
            out["mailto"] = self.page.evaluate(MAILTO_JS)
            return out
        except Exception as exc:
            return {"status": None, "access": "unreachable", "error": str(exc).splitlines()[0][:200]}


def read_site(reader: Reader, root_url: str, kind: str) -> tuple[dict, list[dict]]:
    home = reader.load(root_url)
    pages = [page_record(root_url, home)]
    links = home.get("links") or []
    for url in leadership_links(links, home.get("final_url") or root_url)[:MAX_PAGES - 1]:
        pages.append(page_record(url, reader.load(url)))
    return {"root": root_url, "kind": kind, "pages": pages}, links


def harvest_one(reader: Reader, college: str, homepage_url: str, districts_read: set) -> dict:
    site, links = read_site(reader, homepage_url, "college")
    sites = [site]
    d = district_link(links, homepage_url)
    if d and d not in districts_read:
        districts_read.add(d)
        sites.append(read_site(reader, d, "district")[0])
    elif d:
        sites.append({"root": d, "kind": "district", "pages": [], "read_with": "an earlier college this run"})
    return {"college": college, "homepage_url": homepage_url, "sites": sites}


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--colleges", default="", help="names separated by ';'")
    ap.add_argument("--batch", type=int, default=0, help="the N colleges read longest ago")
    ap.add_argument("--out", default=OUT_DIR)
    args = ap.parse_args(argv)

    colleges = load_colleges()
    if args.colleges:
        want = [w.strip().lower() for w in args.colleges.split(";") if w.strip()]
        colleges = [c for c in colleges if any(w in c["college"].lower() for w in want)]
    elif args.batch:
        colleges = pick_batch(colleges, args.batch, last_read(args.out))
    else:
        print("name --colleges or --batch")
        return 2
    if not colleges:
        print("no college matched")
        return 2
    run_id = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    run_dir = os.path.join(args.out, run_id)
    os.makedirs(run_dir, exist_ok=True)
    delay = int(os.environ.get("HARVEST_DELAY_MS", "4000"))
    print("contacts harvest %s: %d colleges, %.1f s between loads" % (run_id, len(colleges), delay / 1000))

    from playwright.sync_api import sync_playwright  # runner only
    districts_read: set = set()
    with sync_playwright() as p:
        browser = p.chromium.launch()
        probe = browser.new_page()
        ua = probe.evaluate("navigator.userAgent").replace("HeadlessChrome", "Chrome")
        probe.close()
        ctx = browser.new_context(user_agent=ua + " " + UA_SUFFIX, accept_downloads=False)
        reader = Reader(ctx.new_page(), ctx.request, delay)
        for i, c in enumerate(colleges, 1):
            try:
                rec = harvest_one(reader, c["college"], c["homepage_url"], districts_read)
            except Exception as exc:
                rec = {"college": c["college"], "homepage_url": c["homepage_url"], "sites": [],
                       "error": str(exc).splitlines()[0][:300]}
            rec.update(run=run_id, read_at=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"))
            with open(os.path.join(run_dir, slug(c["college"]) + ".json"), "w", encoding="utf-8") as f:
                json.dump(rec, f, indent=1, ensure_ascii=False)
                f.write("\n")
            pages = [pg for s in rec["sites"] for pg in s["pages"]]
            n_ex = sum(len(pg.get("excerpts") or []) for pg in pages)
            print("%3d/%d %-40s %2d pages %3d excerpts" % (i, len(colleges), c["college"][:40], len(pages), n_ex),
                  flush=True)
        browser.close()
    print("read %d pages" % reader.loads)
    return 0


if __name__ == "__main__":
    sys.exit(main())
