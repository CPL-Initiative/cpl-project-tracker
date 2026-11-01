#!/usr/bin/env python3
"""The college contacts harvest's runner: read leadership pages, keep the text near a title.

Sam, 2026-10-31: "harvest the contacts when it sends runners out to collect our catalog data ...
it might be better in the daily for a while until we get a good dataset"; armed as step 8 of the
CPL queue routine (docs/reference/scheduled_sessions.md, piece 3). Lane:
docs/reference/lanes/map-users-student-contact.md (The weekly contacts harvest).

Two steps, each run from .github/workflows/college-contacts-harvest.yml:

  read   From each college's homepage (the CEO list, kb/reference/ccc_colleges_ceo_2026.json,
         with the census's HOMEPAGE_FIXES) it follows the links whose words name leadership
         (LINK_WORDS), at most MAX_PAGES pages a site, and keeps each page's lines near a title
         from Sam's variants (TITLE_PATTERNS). It writes one file a college to
         kb/contacts_harvest/<run>/<slug>.json, which the workflow commits to the branch that ran
         it. It writes no table. A district's own site is reached through the college's links
         (Chancellor, District), the only way off the college's domain.

  apply  Reads a session's records file (one record a person found: college, position,
         title_as_printed, name, email only when the page prints it, source_url), reads the
         rows already held for those colleges (the before-values), posts the records to
         college_contacts_harvest_apply(jsonb) with the service key, and writes the receipt
         kb/receipts/college_contacts_harvest_<run>.json. The receipt's before-values are how the
         load rolls back (Rule 10 a2).

The census's terms (Sam's call 5 on sheet 23): a user agent naming the CPL Initiative,
robots.txt read for every host and obeyed, HARVEST_DELAY_MS between loads (default 4 s), no page
behind a sign-in. The session never fills a position from a page whose title matches none of the
variants; those lines are kept so the read can list them for Sam.

The pure functions are tested by tests/college_contacts_harvest_runner_test.py over saved pages.
"""
from __future__ import annotations

import argparse
import glob
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser
from datetime import datetime, timezone
from html.parser import HTMLParser

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from _program_source_census import load_colleges, registrable  # noqa: E402

OUT_ROOT = os.path.join(HERE, "contacts_harvest")
RECEIPTS = os.path.join(HERE, "receipts")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co")

UA_TOKEN = "CPLInitiativeContactsHarvest"
UA = ("Mozilla/5.0 (X11; Linux x86_64) " + UA_TOKEN + "/1.0 (California Community Colleges "
      "CPL Initiative; +https://cpl-initiative.github.io/cpl-project-tracker/)")
MAX_PAGES = 12
TIMEOUT_S = 30
CONTEXT_LINES = 3
MAX_EXCERPTS_A_PAGE = 60

# The words on a link that lead to a leadership page (Sam's spec, step 8 piece 3).
LINK_WORDS = re.compile(
    r"\b(administration|administrators|leadership|president'?s office|office of the president|"
    r"cabinet|chancellor|district office|directory|admissions (and|&) records|veterans?|"
    r"articulation|executive team|senior staff|our leaders)\b", re.I)
# A link that leaves the college's domain is followed only to a district or chancellor page.
OFF_DOMAIN_WORDS = re.compile(r"\b(chancellor|district)\b", re.I)
SIGN_IN = re.compile(r"(login|signin|sign-in|sso|cas/|portal\.|myportal|canvas|okta|adfs)", re.I)

# Sam's positions and his title variants (lane, The weekly contacts harvest). Order matters: the
# first pattern a title matches names its position, so the narrower titles come first.
TITLE_PATTERNS: list[tuple[str, re.Pattern]] = [
    ("assoc_vice_chancellor", re.compile(r"\bassociate vice[- ]chancellor\b", re.I)),
    ("vice_chancellor", re.compile(r"\b(vice|deputy|executive vice)[- ]chancellor\b", re.I)),
    ("district_ceo", re.compile(r"\bchancellor\b", re.I)),
    ("assoc_vp", re.compile(r"\bassociate vice[- ]president\b", re.I)),
    # Equity joined to the post counts as the post, and so does Academic Services (Sam, Open Asks Sheet 153 card 2,
    # "count", 2026-11-01): Equity and Instruction, Equity and Student Services, Student Services and Equity.
    ("vpaa", re.compile(r"\b(provost|chief instructional officer|(vice[- ]president|VP),? (of |for )?(equity and )?"
                        r"(academic (affairs|services)|instruction(al services)?( and student services)?))\b|\bCIO\b",
                        re.I)),
    ("vpss", re.compile(r"\b(chief student services officer|(vice[- ]president|VP),? (of |for )?(equity and )?student "
                        r"(services|affairs|success|development))\b|\bCSSO\b", re.I)),
    # Sam's VPBS variants: CBO, VP Business Services (and Facilities), and VP Administrative Services (Open Asks
    # Sheet 151 card 1, "vpbs", 2026-11-01). A title outside the variants is listed for him, never filled.
    ("vpbs", re.compile(r"\b(chief business officer|(vice[- ]president|VP),? (of |for )?(business and )?(business|administrative) services"
                        r"( and facilities)?)\b|\bCBO\b", re.I)),
    ("college_ceo", re.compile(r"\b(superintendent[/ -]+president|president)\b", re.I)),
    ("dean_cte", re.compile(r"\bdean\b[^.\n]{0,60}\b(career (and|&) technical|CTE|workforce|economic development)\b",
                            re.I)),
    ("dean_ar", re.compile(r"\b(dean|director)\b[^.\n]{0,40}\badmissions\b|\bregistrar\b", re.I)),
    ("dean_instruction", re.compile(r"\bdean\b[^.\n]{0,20}\binstruction\b", re.I)),
    ("vrc", re.compile(r"\bveterans?\b[^.\n]{0,40}\b(director|coordinator|resource|center|services)\b", re.I)),
    ("articulation_officer", re.compile(r"\barticulation (officer|specialist|coordinator)\b|\barticulation\b",
                                        re.I)),
]
EMAIL = re.compile(r"[A-Za-z0-9._%+'-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
# A president of a student body or a foundation is not the college's CEO.
NOT_CEO = re.compile(r"\b(student|associated students|ASB|foundation|alumni|club|senate)\b", re.I)


def position_of(title: str) -> str | None:
    """The position a printed title names, or None when it names none of Sam's variants."""
    for pos, pat in TITLE_PATTERNS:
        if pat.search(title):
            if pos == "college_ceo" and (NOT_CEO.search(title) or re.search(r"\bvice\b", title, re.I)):
                return None
            if pos == "district_ceo" and re.search(r"\b(vice|deputy|associate|assistant)\b", title, re.I):
                return None
            return pos
    return None


class _Text(HTMLParser):
    """Visible text with a line break at each block, and every link with its words."""
    BLOCK = {"p", "div", "li", "tr", "td", "th", "h1", "h2", "h3", "h4", "h5", "h6", "br", "section",
             "article", "header", "footer", "dd", "dt", "figcaption", "address", "table", "ul", "ol"}
    SKIP = {"script", "style", "noscript", "svg", "template"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self.links: list[tuple[str, str]] = []
        self._skip = 0
        self._href: str | None = None
        self._words: list[str] = []

    def handle_starttag(self, tag, attrs):
        if tag in self.SKIP:
            self._skip += 1
        if tag in self.BLOCK:
            self.parts.append("\n")
        if tag == "a":
            a = dict(attrs)
            self._href = a.get("href")
            self._words = [a.get("aria-label") or a.get("title") or ""]
            if (a.get("href") or "").lower().startswith("mailto:"):
                self.parts.append(" " + a["href"][7:].split("?")[0] + " ")

    def handle_endtag(self, tag):
        if tag in self.SKIP and self._skip:
            self._skip -= 1
        if tag in self.BLOCK:
            self.parts.append("\n")
        if tag == "a" and self._href:
            self.links.append((self._href, " ".join(w for w in self._words if w).strip()))
            self._href = None

    def handle_data(self, data):
        if self._skip:
            return
        self.parts.append(data)
        if self._href is not None:
            self._words.append(data)


def page_text(html: str) -> tuple[list[str], list[tuple[str, str]]]:
    """The page's non-empty lines, whitespace folded, and its (href, words) links."""
    p = _Text()
    p.feed(html)
    lines = [re.sub(r"\s+", " ", ln).strip() for ln in "".join(p.parts).split("\n")]
    return [ln for ln in lines if ln], p.links


def leadership_links(links: list[tuple[str, str]], base: str, home_host: str) -> list[str]:
    """Absolute URLs of the links whose words name leadership, in page order, no repeats."""
    out, seen = [], set()
    for href, words in links:
        if not href or href.startswith(("mailto:", "tel:", "javascript:", "#")):
            continue
        if not LINK_WORDS.search(words or ""):
            continue
        url = urllib.parse.urljoin(base, href).split("#")[0]
        parts = urllib.parse.urlparse(url)
        if parts.scheme not in ("http", "https") or SIGN_IN.search(url):
            continue
        if re.search(r"\.(pdf|docx?|xlsx?|jpg|png|zip)$", parts.path, re.I):
            continue
        same = registrable(parts.netloc) == registrable(home_host)
        if not same and not (OFF_DOMAIN_WORDS.search(words) and parts.netloc.endswith(".edu")):
            continue
        if url not in seen:
            seen.add(url)
            out.append(url)
    return out


def title_excerpts(lines: list[str]) -> list[dict]:
    """Each line naming a title, with CONTEXT_LINES lines either side: the position it names (or
    None, kept for Sam's list), the line, the window, and any address printed in the window."""
    out = []
    for i, ln in enumerate(lines):
        if len(ln) > 200:
            continue
        pos = position_of(ln)
        if pos is None and not re.search(r"\b(dean|vice[- ]president|chancellor|director|officer|coordinator)\b",
                                         ln, re.I):
            continue
        window = lines[max(0, i - CONTEXT_LINES): i + CONTEXT_LINES + 1]
        out.append({"line": ln, "position": pos, "window": window,
                    "emails": sorted(set(EMAIL.findall(" ".join(window))))})
        if len(out) >= MAX_EXCERPTS_A_PAGE:
            break
    return out


def slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")


# ── Fetching (runner only) ───────────────────────────────────────────────────

class Fetcher:
    def __init__(self, delay_ms: int):
        self.delay = delay_ms / 1000.0
        self.robots: dict[str, urllib.robotparser.RobotFileParser | None] = {}
        self.last = 0.0

    def _get(self, url: str) -> tuple[int, str, str]:
        wait = self.last + self.delay - time.time()
        if wait > 0:
            time.sleep(wait)
        self.last = time.time()
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html"})
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT_S) as r:
                ctype = r.headers.get("Content-Type", "")
                body = r.read(3_000_000).decode(r.headers.get_content_charset() or "utf-8", "replace")
                return r.status, r.geturl(), body if "html" in ctype or not ctype else ""
        except urllib.error.HTTPError as e:
            return e.code, url, ""
        except Exception as e:  # noqa: BLE001 — a site that will not answer is a row, not a crash
            return 0, url, "%s: %s" % (type(e).__name__, e)

    def allowed(self, url: str) -> bool:
        host = urllib.parse.urlparse(url).netloc
        if host not in self.robots:
            status, _, body = self._get("https://%s/robots.txt" % host)
            rp = None
            if status == 200 and body:
                rp = urllib.robotparser.RobotFileParser()
                rp.parse(body.splitlines())
            self.robots[host] = rp
        rp = self.robots[host]
        return rp is None or rp.can_fetch(UA_TOKEN, url)

    def page(self, url: str) -> dict:
        if not self.allowed(url):
            return {"url": url, "status": "robots_disallow"}
        status, final, body = self._get(url)
        if status != 200 or not body or status == 0:
            return {"url": url, "status": status or "unreachable", "error": body[:200] if status == 0 else None}
        if SIGN_IN.search(urllib.parse.urlparse(final).netloc + urllib.parse.urlparse(final).path):
            return {"url": url, "final_url": final, "status": "sign_in"}
        lines, links = page_text(body)
        return {"url": url, "final_url": final, "status": 200, "lines": lines, "links": links}


def read_college(f: Fetcher, college: str, homepage: str) -> dict:
    home_host = urllib.parse.urlparse(homepage).netloc
    pages, queue, done = [], [homepage], set()
    while queue and len(done) < MAX_PAGES:
        url = queue.pop(0)
        if url in done:
            continue
        done.add(url)
        got = f.page(url)
        rec = {k: got.get(k) for k in ("url", "final_url", "status", "error") if got.get(k) is not None}
        if got.get("status") == 200:
            rec["excerpts"] = title_excerpts(got["lines"])
            for nxt in leadership_links(got["links"], got.get("final_url") or url, home_host):
                if nxt not in done and nxt not in queue:
                    queue.append(nxt)
        pages.append(rec)
    return {"college": college, "homepage": homepage,
            "read_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "pages": pages, "unread_links": queue[:40]}


# ── Supabase (runner only) ───────────────────────────────────────────────────

def _rest(path: str, body: dict | None = None):
    key = os.environ["SUPABASE_SERVICE_KEY"]
    req = urllib.request.Request(SUPABASE_URL.rstrip("/") + path,
                                 data=None if body is None else json.dumps(body).encode(),
                                 headers={"apikey": key, "Authorization": "Bearer " + key,
                                          "Content-Type": "application/json"},
                                 method="GET" if body is None else "POST")
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read().decode() or "null")


def batch_order(colleges: list[dict], last_seen: dict[str, str]) -> list[dict]:
    """Colleges never read first (by name), then the ones read longest ago."""
    return sorted(colleges, key=lambda c: (c["college"] in last_seen, last_seen.get(c["college"], ""), c["college"]))


def read_last_seen() -> dict[str, str]:
    if not os.environ.get("SUPABASE_SERVICE_KEY"):
        return {}
    rows = _rest("/rest/v1/college_contacts_harvest?select=college,last_seen&order=last_seen.desc")
    out: dict[str, str] = {}
    for r in rows or []:
        out.setdefault(r["college"], r["last_seen"])
    return out


def read_history(out_root: str) -> dict[str, str]:
    """The day each college was last read, from the committed pages (kb/contacts_harvest/<run>/).

    A college whose read found no one has no row, so ordering by `last_seen` alone put the same
    empty sites (a 404 homepage, a one-page site) first every night (S538)."""
    out: dict[str, str] = {}
    for f in glob.glob(os.path.join(out_root, "*", "*.json")):
        if os.path.basename(os.path.dirname(f)).endswith("_records"):
            continue
        try:
            with open(f, encoding="utf-8") as fh:
                d = json.load(fh)
        except (OSError, ValueError):
            continue
        c, at = d.get("college"), str(d.get("read_at", ""))[:10]
        if c and at and at > out.get(c, ""):
            out[c] = at
    return out


def last_read(last_seen: dict[str, str], history: dict[str, str]) -> dict[str, str]:
    """The later of a college's last row seen and its last read, as a day."""
    out = {c: str(v)[:10] for c, v in last_seen.items()}
    for c, at in history.items():
        if at > out.get(c, ""):
            out[c] = at
    return out


def cmd_read(a) -> int:
    allc = load_colleges()
    if a.colleges:
        want = [w.strip().lower() for w in a.colleges.split(";") if w.strip()]
        chosen = [c for c in allc if any(w in c["college"].lower() for w in want)]
    else:
        chosen = batch_order(allc, last_read(read_last_seen(), read_history(a.out)))[: a.batch]
    out_dir = os.path.join(a.out, a.run)
    os.makedirs(out_dir, exist_ok=True)
    f = Fetcher(int(os.environ.get("HARVEST_DELAY_MS", "4000")))
    for c in chosen:
        doc = read_college(f, c["college"], c["homepage_url"])
        doc["run"] = a.run
        with open(os.path.join(out_dir, slug(c["college"]) + ".json"), "w", encoding="utf-8") as fh:
            json.dump(doc, fh, indent=1, ensure_ascii=False)
        n_ex = sum(len(p.get("excerpts", [])) for p in doc["pages"])
        print("%-45s pages %2d  excerpts %3d" % (c["college"], len(doc["pages"]), n_ex), flush=True)
    return 0


def check_records(doc: dict) -> list[str]:
    """What is wrong with a session's records file, or nothing."""
    errs = []
    known = {c["college"] for c in load_colleges()}
    positions = {p for p, _ in TITLE_PATTERNS}
    for c in doc.get("colleges", []):
        if c not in known:
            errs.append("unknown college %r" % c)
    # A partial load (held rows Sam has since ruled on) read no college whole, so it names none and marks
    # nobody gone; each row's college must still be known.
    partial = bool(doc.get("partial"))
    if partial and doc.get("colleges"):
        errs.append("a partial load names no colleges")
    for i, r in enumerate(doc.get("rows", [])):
        if partial:
            if r.get("college") not in known:
                errs.append("row %d: unknown college %r" % (i, r.get("college")))
        elif r.get("college") not in doc.get("colleges", []):
            errs.append("row %d: college not among the run's colleges" % i)
        if r.get("position") not in positions:
            errs.append("row %d: position %r" % (i, r.get("position")))
        if not str(r.get("source_url", "")).startswith(("http://", "https://")):
            errs.append("row %d: source_url" % i)
        if r.get("email") and not EMAIL.fullmatch(r["email"]):
            errs.append("row %d: email" % i)
        if len(str(r.get("name", ""))) < 2:
            errs.append("row %d: name" % i)
    return errs


def cmd_apply(a) -> int:
    doc = json.load(open(a.records, encoding="utf-8"))
    errs = check_records(doc)
    if errs:
        print("\n".join(errs))
        return 1
    run = doc.get("run") or a.run
    read = sorted({r["college"] for r in doc["rows"]}) if doc.get("partial") else doc["colleges"]
    cols = ",".join('"%s"' % c.replace('"', '') for c in read)
    before = _rest("/rest/v1/college_contacts_harvest?select=*&college=in.(" + urllib.parse.quote(cols) + ")")
    result = _rest("/rest/v1/rpc/college_contacts_harvest_apply",
                   {"p": {"run": run, "colleges": [] if doc.get("partial") else doc["colleges"],
                          "partial": bool(doc.get("partial")), "rows": doc["rows"]}})
    os.makedirs(RECEIPTS, exist_ok=True)
    receipt = {"run": run, "applied_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
               "github_run": os.environ.get("GITHUB_RUN_ID"), "result": result,
               "rollback": "delete the rows whose first_seen is this load's and whose id is not in before; "
                           "restore every before row's title_as_printed, source_url, seen_run, last_seen, gone_since",
               "before": before, "rows": doc["rows"]}
    path = os.path.join(RECEIPTS, "college_contacts_harvest_%s.json" % run)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(receipt, fh, indent=1, ensure_ascii=False)
    print(json.dumps(result))
    return 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    r = sub.add_parser("read")
    r.add_argument("--colleges", default="", help="names (or parts), separated by ';'")
    r.add_argument("--batch", type=int, default=15)
    r.add_argument("--run", required=True)
    r.add_argument("--out", default=OUT_ROOT)
    p = sub.add_parser("apply")
    p.add_argument("--records", required=True)
    p.add_argument("--run", default="")
    a = ap.parse_args(argv)
    return cmd_read(a) if a.cmd == "read" else cmd_apply(a)


if __name__ == "__main__":
    sys.exit(main())
