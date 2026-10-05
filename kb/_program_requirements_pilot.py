#!/usr/bin/env python3
"""The program requirements pilot, capture pass: find each pilot program's own page.

Phase 1 of the program requirements harvest
(docs/reference/lanes/program-requirements-harvest.md). The pilot reads 20
programs at five colleges (kb/program_requirements_pilot_sample.json) and
scores each record on course coverage, no invented courses, unit arithmetic
and agreement with Sam, who checks the same 20 (sheet 25, 2026-10-03).

This pass finds the page, and nothing else. For each program it starts at the
catalog address the census filed in program_source_registry and follows links
until one page names at least half of the courses the state's Program Course
File lists for that program (coci_program_courses). That closed list is the
acceptance test: a page that names the program's own courses is the program's
page, whatever its title says, and a page that names none of them is not,
however well its title matches. A PDF catalog is read whole and its pages
scored the same way.

It writes nothing. It prints a line per program and one JSON object per
program between markers, which a session reads from the job log through the
GitHub MCP and files as test fixtures. The extraction itself (blocks, rules,
minimums) is the next pass; it reads the fixtures this pass produces.

The reads follow the census's rules, because Sam's call 5 on sheet 23 approves
reading college sites "on a slow schedule that names the CPL Initiative": the
census's Reader (robots.txt first for every host, CENSUS_DELAY_MS between
loads), its user agent, and a cap of MAX_LOADS loads per program. Pages one
college's programs share load once.

The closed list and the registry row are read with the public anon key: both
tables grant anon SELECT, and a read needs no more.

Run (on the runner):
    python3 kb/_program_requirements_pilot.py [--only TEXT]
The pure functions are tested by tests/program_requirements_pilot_test.py
without a browser or a network.
"""
from __future__ import annotations

import argparse
import html
import io
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
SAMPLE_FILE = os.path.join(HERE, "program_requirements_pilot_sample.json")

MAX_LOADS = 8            # page loads per program, shared pages excluded
ACCEPT_SHARE = 0.5       # a page naming this share of the listed codes is the page
TEXT_CAP = 16000         # characters of page text kept per program
HTML_CAP = 60000         # characters of CourseLeaf course-list HTML kept
WINDOW_BEFORE = 2500     # text kept before the first listed code on the page
WINDOW_AFTER = 1500      # and after the last


# ── Course codes ────────────────────────────────────────────────────────────
# The Program Course File writes a code the way the college's curriculum system
# stored it: "REAL ES 1" beside "REALES007", "STAT C1000" beside "STATC1000",
# "IWAP 40.1" for a catalog's "IWAP 40.10". A catalog page writes "REAL ES 7",
# "ADJ-1" or "IWAP 40.10". The two meet at one normal form: upper case, no
# spaces, hyphens or dots, no leading zeros on a number, no trailing zeros after
# a decimal point.
def norm_code(code: str | None) -> str:
    s = (code or "").upper()
    s = re.sub(r"(\.\d*?)0+(?=$|[^0-9])", r"\1", s)    # 40.10 -> 40.1, 40.50 -> 40.5
    s = re.sub(r"\.(?=$|[^0-9])", "", s)                # a dot left bare: 40. -> 40
    s = re.sub(r"[\s\-.]", "", s)
    s = re.sub(r"(?<=[A-Z&])0+(?=\d)", "", s)           # BUS005 -> BUS5
    return s


CODE_PARTS = re.compile(r"^([A-Z&][A-Z&\s]*?)[\s\-]*(C?\d[0-9A-Z.\-]*)$")
NUM_PARTS = re.compile(r"^(C?)(\d+)(?:([.\-])(\d+))?([A-Z]*)$")


def code_pattern(code: str) -> re.Pattern | None:
    """A pattern that finds this course's code in page text however the page
    spaces it: 'REAL ES 7' for REALES007, 'ADJ-1' for ADJ 1, 'IWAP 40.10' for
    IWAP 40.1, 'KIN 251-1'. It refuses a longer code: ADJ 1 is not ADJ 1H,
    ADJ 10 or ADJ 1.5, and KIN 251 is not KIN 251-1. Built from the code as stored, before any normal form,
    because the normal form drops the decimal point a pattern needs."""
    raw = re.sub(r"\s+", " ", (code or "").upper().strip())
    m = CODE_PARTS.match(raw)
    if not m:
        letters = re.sub(r"[^A-Z&]", "", raw)
        if not letters:
            return None
        body = r"[\s\-]?".join(re.escape(ch) for ch in letters)
    else:
        subj = re.sub(r"[^A-Z&]", "", m.group(1))
        n = NUM_PARTS.match(m.group(2))
        if not n:
            num_re = re.escape(m.group(2))
        else:
            c, whole, sep, frac, suffix = n.groups()
            num_re = re.escape(c) + r"0*" + (whole.lstrip("0") or "0")
            if sep == "." and frac.rstrip("0"):
                num_re += r"\." + frac.rstrip("0") + r"0*"
            elif sep == ".":
                num_re += r"(?:\.0*)?"
            elif sep == "-":
                num_re += r"[\s\-]?" + frac
            num_re += suffix
        body = r"[\s\-]?".join(re.escape(ch) for ch in subj) + r"[\s\-]{0,2}" + num_re
    return re.compile(r"(?<![A-Za-z0-9&])" + body + r"(?![0-9A-Za-z]|[.\-]\d)", re.I)


def find_codes(text: str, courses: list[dict]) -> dict[str, list[int]]:
    """{normalized code: [positions]} for each listed course the text names."""
    out: dict[str, list[int]] = {}
    for c in courses:
        pat = code_pattern(c.get("code") or "")
        if pat is None:
            continue
        pos = [m.start() for m in pat.finditer(text or "")]
        if pos:
            out[norm_code(c["code"])] = pos
    return out


def coverage(found: dict, courses: list[dict]) -> float:
    listed = {norm_code(c.get("code")) for c in courses if c.get("code")}
    return len(listed & set(found)) / len(listed) if listed else 0.0


def text_window(text: str, found: dict, from_start: bool = False) -> str:
    """The stretch of page text from a little before the first listed code to
    a little after the last: the requirements, without the site's menus. A
    document that holds one program (a curriQunet export) keeps its top, where
    its heading names the award: Miramar's Fire Technology exports name a
    course in their outcomes, and a window opened there lost the heading
    (capture run 6)."""
    if not found:
        return (text or "")[:TEXT_CAP]
    first = min(p[0] for p in found.values())
    last = max(p[-1] for p in found.values())
    a = 0 if from_start else max(0, first - WINDOW_BEFORE)
    b = min(len(text), last + WINDOW_AFTER)
    return text[a:b][:TEXT_CAP]


def with_outcome_tabs(text: str, tabs: list[dict]) -> str:
    """The captured text with each outcomes tab the page hides appended, under
    a line naming where it came from. A tab whose text the capture already holds
    (Cerritos prints its outcomes in the page) is not added twice, so a page
    without a hidden tab is filed exactly as before."""
    flat = re.sub(r"\s+", " ", text or "")
    out = text or ""
    for t in tabs or []:
        body = (t.get("text") or "").strip()
        if not body or re.sub(r"\s+", " ", body)[:200] in flat:
            continue
        out += "\n\n[the page's outcomes tab, #%s]\n%s" % (t.get("id") or "", body)
    return out


# ── Program titles and awards ───────────────────────────────────────────────
STOP = {"and", "of", "the", "in", "for", "a", "an", "to", "with", "option", "program",
        "programs", "degree", "certificate", "achievement", "level", "&", "-"}


def title_tokens(title: str) -> list[str]:
    words = re.findall(r"[a-z0-9]+", (title or "").lower().replace("2.0", ""))
    return [w for w in words if w not in STOP and len(w) > 1]


def award_kind(award: str | None) -> str:
    a = (award or "").lower()
    if "t degree" in a:
        return "adt"
    if a.startswith("a.s"):
        return "as"
    if a.startswith("a.a"):
        return "aa"
    if a.startswith("certificate of achievement"):
        return "coa"
    if "noncredit" in a:
        return "noncredit"
    if "baccalaureate" in a:
        return "bs"
    return "other"


AWARD_WORDS = {
    "adt": [r"for transfer", r"\ba\.?[as]\.?\s*-\s*t\b", r"\ba[as]-?t\b", r"\btransfer\b"],
    "as": [r"\ba\.\s?s\.", r"associate (?:in|of) science", r"\bas degree\b"],
    "aa": [r"\ba\.\s?a\.", r"associate (?:in|of) arts", r"\baa degree\b"],
    "coa": [r"certificate of achievement", r"\bcertificate\b", r"\bcoa\b"],
    "noncredit": [r"noncredit", r"non-credit", r"certificate of (?:competency|completion)"],
    "bs": [r"bachelor", r"\bb\.\s?s\."],
}
HUB_WORDS = re.compile(
    r"programs? of study|degrees?,? (?:and|&|courses)|areas? of study|degree curricula|"
    r"programs? a-z|academic programs|career (?:and|&) technical|\bmajors?\b|"
    r"noncredit programs?|certificates? (?:and|&|programs?)", re.I)
# Words that name a college's services or policies, never its program index:
# Cerritos's catalog links "Programs & Services" (student services) beside
# "Degrees, Courses & Pathways" (run 2, S323).
NOT_HUB = re.compile(
    r"services|student|admission|enrollment|polic|calendar|fees|counsel|financial|"
    r"personnel|directory|faculty|staff|map of|addend|outcomes?", re.I)
REFUSE_LINK = re.compile(
    r"archiv|previous catalog|past catalog|login|sign in|course descriptions?$|"
    r"mailto:|tel:|javascript:|\.(?:jpg|png|gif|zip|docx?)$", re.I)


def score_link(text: str, href: str, program: dict) -> int:
    """How strongly a link leads to this program's page. The title's words in
    the link text count most, the award's words next; a hub link ("Programs of
    Study", "Degrees & Certificates") counts a little, so a catalog's front page
    leads to its program index."""
    t = (text or "").strip()
    if not t or REFUSE_LINK.search(t) or REFUSE_LINK.search(href or ""):
        return -1
    low = t.lower()
    tokens = title_tokens(program["title"])
    hit = [w for w in tokens if re.search(r"\b" + re.escape(w) + r"\b", low)]
    score = 0
    if tokens and hit:
        score += 4 * len(hit)
        if len(hit) == len(tokens):
            score += 6
    kind = award_kind(program.get("award"))
    if hit and any(re.search(p, low) for p in AWARD_WORDS.get(kind, [])):
        score += 3
    if not hit and HUB_WORDS.search(t) and not NOT_HUB.search(t) and len(t) < 60:
        score += 2
    return score


def same_site(href: str, start: str) -> bool:
    """The catalog's own host. A program's requirements live in the catalog;
    Riverside's reader followed rcc.edu's marketing pages and a Microsoft form
    off the curriQunet front page (run 2, S323)."""
    return urllib.parse.urlparse(href).netloc.lower() == urllib.parse.urlparse(start).netloc.lower()


# Inside a program's view, the requirements may sit behind one more item.
REQ_WORDS = re.compile(r"program requirements|required courses|requirements|course requirements", re.I)
NOT_REQ = re.compile(r"graduation|transfer|admission|general education|prerequisite", re.I)


def click_score(text: str, program: dict) -> int:
    s = score_link(text, "", program)
    if s <= 0 and REQ_WORDS.search(text or "") and not NOT_REQ.search(text or ""):
        s = 1
    return s


def program_view(text: str, program: dict) -> bool:
    """Whether a clicked item is the program's own entry: every word of its
    title is in the item ("Business Administration 2.0 - Associate in Science
    for Transfer Degree: Miramar"). A hub ("Degree Curricula and Certificate
    Programs") names none of them."""
    tokens = title_tokens(program["title"])
    low = (text or "").lower()
    return bool(tokens) and all(re.search(r"\b" + re.escape(w) + r"\b", low) for w in tokens)


# curriQunet prints an "Export Page as PDF" link on every catalog view, for that
# view's own outline (Catalog/Export?id=71&outlineId=20004 on Miramar's Business
# Administration 2.0 view). Miramar's views draw their course lists where the
# page text never names them (run 4, S323), and the export does.
EXPORT_TEXT = re.compile(r"export (?:page )?as pdf", re.I)
EXPORT_HREF = re.compile(r"/catalog/export\?", re.I)


def export_link(links: list[dict]) -> str | None:
    """The view's own PDF export, from the links a page carries."""
    for ln in links or []:
        href = ln.get("href") or ""
        if href.startswith("http") and (EXPORT_HREF.search(href) or EXPORT_TEXT.search(ln.get("text") or "")):
            return href
    return None


def click_rank(text: str, program: dict) -> tuple:
    """The order the reader clicks in: the stronger match first; among equals,
    the item that begins with the program's title, then the shorter item, then
    the words themselves, so no run depends on a set's order. Miramar lists
    "Early Education Entrepreneurship" beside "Entrepreneurship", and both name
    every word of the title: run 6 clicked the right one and run 7 the other."""
    t = re.sub(r"\s+", " ", (text or "").strip().lower())
    title = re.sub(r"\s+", " ", (program.get("title") or "").strip().lower())
    return (-click_score(text, program), not (title and t.startswith(title)), len(t), t)


def clickable_candidate(text: str, program: dict) -> bool:
    """A navigation item, not a sentence: Miramar's click-through went on to
    click the program's learning outcomes ("Describe common business functions
    and practices.") because they share the title's words (run 2, S323)."""
    t = (text or "").strip()
    if not t or t.endswith(".") or len(t.split()) > 16:
        return False
    return click_score(t, program) > 0


# ── PDF pages ───────────────────────────────────────────────────────────────
def pick_pdf_pages(pages: list[str], program: dict, courses: list[dict]) -> list[int]:
    """The run of pages holding the program: the page naming the most listed
    codes with the title's words on it, and the pages after it while they
    still name listed codes (a table broken across pages)."""
    tokens = title_tokens(program["title"])
    best, best_score = None, 0.0
    for i, txt in enumerate(pages):
        found = find_codes(txt, courses)
        if not found:
            continue
        low = (txt or "").lower()
        title_hit = sum(1 for w in tokens if re.search(r"\b" + re.escape(w) + r"\b", low))
        s = len(found) + (2 if tokens and title_hit == len(tokens) else 0)
        if s > best_score:
            best, best_score = i, s
    if best is None:
        return []
    run = [best]
    for j in range(best + 1, min(best + 4, len(pages))):
        if find_codes(pages[j], courses):
            run.append(j)
        else:
            break
    return run


# ── Data: the sample, the closed list, the registry row ─────────────────────
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co").rstrip("/")
# The public anon key the dashboard ships (card_updates.js, kb/_load_projects.py,
# nudges/build_nudges.py). Named here rather than imported, so the dependency
# map does not read this script as a reader of the tables _load_projects reads.
SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dXdobmJ1YWhydHB0b2twcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzI0ODEsImV4cCI6MjA5MTE0ODQ4MX0.p0q-93iTM0GkF2z8_q7Vvl1tsX9SFGMM-W7Wdx7WfmM"


def load_sample(path: str = SAMPLE_FILE) -> list[dict]:
    with open(path) as fh:
        return json.load(fh)["programs"]


def _get(path_qs: str) -> list[dict]:
    req = urllib.request.Request(SUPABASE_URL + "/rest/v1/" + path_qs,
                                 headers={"apikey": SUPABASE_ANON,
                                          "Authorization": "Bearer " + SUPABASE_ANON})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode())


def q(v: str) -> str:
    return urllib.parse.quote(v, safe="")


def fetch_program(college: str, cn: str) -> dict:
    rows = _get("coci_college_programs?select=program_title,award,top_code,status"
                "&college=eq.%s&control_number=eq.%s" % (q(college), q(cn)))
    return rows[0] if rows else {}


def fetch_courses(college: str, cn: str) -> list[dict]:
    return _get("coci_program_courses?select=course_control_number,course_code,"
                "course_title,units,cid,course_college,load_id"
                "&college=eq.%s&program_control_number=eq.%s&order=course_code"
                % (q(college), q(cn)))


def closed_from_rows(rows: list[dict]) -> list[dict]:
    """coci_program_courses rows in the shape every other function here reads.
    Run 2 of the capture (37166104191) passed the raw rows, keyed course_code,
    to a matcher that reads code: no listed code could match any page, the
    PDF probe came back empty, and every program read 0% (S323)."""
    return [{"ccn": r.get("course_control_number"), "code": r.get("course_code"),
             "title": r.get("course_title"), "units": r.get("units"), "cid": r.get("cid"),
             "course_college": r.get("course_college")} for r in rows]


def fetch_registry(college: str) -> dict:
    rows = _get("program_source_registry?select=college,catalog_url,catalog_year,"
                "catalog_platform,catalog_format,sequence_source,sequence_url"
                "&college=eq.%s" % q(college))
    return rows[0] if rows else {}


# ── The browser half (runner only) ──────────────────────────────────────────
PAGE_JS = """() => {
  const links = Array.from(document.querySelectorAll('a[href]')).slice(0, 2500)
    .map(a => ({text: (a.innerText || a.textContent || a.getAttribute('aria-label')
                       || a.title || '').trim().slice(0, 160), href: a.href}));
  const h1 = document.querySelector('h1');
  const lists = Array.from(document.querySelectorAll('table.sc_courselist')).map(t => {
    let head = '', el = t.previousElementSibling, n = 0;
    while (el && n < 4 && !/^H[1-6]$/.test(el.tagName)) { el = el.previousElementSibling; n++; }
    if (el && /^H[1-6]$/.test(el.tagName)) head = el.innerText;
    return {heading: head, html: t.outerHTML};
  });
  const clickables = Array.from(document.querySelectorAll(
      'a:not([href]), [role=link], [role=treeitem], [onclick], [data-href], [ng-click]'))
    .map(e => (e.innerText || e.textContent || '').trim().slice(0, 100))
    .filter(t => t).slice(0, 80);
  // An outcomes panel a catalog keeps in a tab the reader never opens (Mt.
  // San Antonio's CourseLeaf pages, S334): any element whose id names
  // outcomes, outermost only, outside the site's menus.
  const outs = Array.from(document.querySelectorAll('[id*="outcome" i]'))
    .filter(e => !e.closest('nav, header, footer') && (e.textContent || '').trim().length > 40);
  const outcomeTabs = outs.filter(e => !outs.some(o => o !== e && o.contains(e)))
    .map(e => ({id: e.id, text: (e.innerText && e.innerText.trim() ? e.innerText : e.textContent)
                                  .replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, 6000)}));
  return {title: document.title || '', h1: h1 ? h1.innerText : '', links,
          body: document.body ? document.body.innerText : '',
          content: document.body ? document.body.textContent : '',
          courselists: lists, clickables, outcomeTabs};
}"""


def open_reader(delay_ms: int):
    from playwright.sync_api import sync_playwright  # runner only
    from _program_source_census import Reader, UA_SUFFIX
    pw = sync_playwright().start()
    browser = pw.chromium.launch()
    probe = browser.new_page()
    ua = probe.evaluate("navigator.userAgent").replace("HeadlessChrome", "Chrome")
    probe.close()
    ctx = browser.new_context(user_agent=ua + " " + UA_SUFFIX, accept_downloads=False)
    page = ctx.new_page()
    return pw, browser, Reader(page, ctx.request, delay_ms)


def load(reader, url: str, cache: dict, spa: bool) -> dict:
    """One page through the census's Reader (robots, delay), then this pass's
    own reading of it. A page one college's programs share loads once."""
    if url in cache:
        return cache[url]
    got = reader.load(url)
    if got.get("access") == "ok" and "application/pdf" not in (got.get("content_type") or ""):
        if spa:
            reader.page.wait_for_timeout(2500)   # a JavaScript catalog fills in late
        try:
            got.update(reader.page.evaluate(PAGE_JS))
        except Exception as exc:
            got["error"] = str(exc).splitlines()[0][:200]
    got.pop("html", None)
    cache[url] = got
    for alias in (got.get("final_url"),):
        if alias:
            cache.setdefault(alias, got)
    return got


def best_text(got: dict, found_body: dict, found_content: dict) -> tuple[str, dict, str]:
    """innerText is what a reader sees; textContent also holds a hidden tab
    (CourseLeaf keeps Requirements in a tab). Take whichever names more."""
    if len(found_content) > len(found_body):
        return got.get("content") or "", found_content, "textContent"
    return got.get("body") or "", found_body, "innerText"


def locate_html(reader, program: dict, courses: list[dict], start: str, cache: dict,
                spa: bool) -> dict:
    trail, queue, seen = [], [(100, start, "the registry's catalog address")], set()
    loads_before = reader.loads
    best = None
    while queue and reader.loads - loads_before < MAX_LOADS:
        queue.sort(key=lambda x: -x[0])
        score, url, why = queue.pop(0)
        if url in seen:
            continue
        seen.add(url)
        got = load(reader, url, cache, spa)
        fb = find_codes(got.get("body") or "", courses)
        fc = find_codes(got.get("content") or "", courses)
        text, found, field = best_text(got, fb, fc)
        cov = coverage(found, courses)
        trail.append({"url": url, "why": why, "status": got.get("status"),
                      "access": got.get("access"), "title": (got.get("title") or "")[:120],
                      "h1": (got.get("h1") or "")[:120], "codes": len(found),
                      "coverage": round(cov, 2), "links": len(got.get("links") or []),
                      "link_sample": [[(ln.get("text") or "")[:60], ln.get("href")]
                                      for ln in (got.get("links") or [])[:40]]
                      if cov < ACCEPT_SHARE else None,
                      "clickables": (got.get("clickables") or [])[:40]
                      if cov < ACCEPT_SHARE else None})
        if best is None or cov > best["coverage"]:
            best = {"url": got.get("final_url") or url, "coverage": cov, "found": found,
                    "text": text, "field": field, "got": got}
        if cov >= ACCEPT_SHARE:
            break
        for ln in got.get("links") or []:
            href = (ln.get("href") or "").split("#")[0]
            if not href.startswith("http") or href in seen or not same_site(href, start):
                continue
            s = score_link(ln.get("text", ""), href, program)
            if s > 0:
                queue.append((s, href, "link '%s' on %s" % (ln.get("text", "")[:60], url)))
    return {"best": best, "trail": trail}


CLICKABLE_JS = """() => Array.from(document.querySelectorAll(
    'a, [role=link], [role=treeitem], [role=button], li, [onclick], [ng-click], [data-href]'))
  .filter(e => e.offsetParent !== null)
  .map(e => (e.innerText || '').trim())
  .filter(t => t && t.length < 120 && t.indexOf('\\n') < 0)"""


def click_through(reader, program: dict, courses: list[dict], trail: list,
                  max_clicks: int = MAX_LOADS, cache: dict | None = None) -> dict | None:
    """A JavaScript catalog (curriQunet) draws its navigation as items that
    open a section when clicked, without a link to follow. Click the item whose
    words best match the program, or a hub ("Degree Curricula and Certificate
    Programs") until a section names the program's courses. Each click waits
    the census's delay, as a page load does.

    When a click opens the program's own view and its text names too few of
    the courses, read the view's PDF export (robots first, through read_pdf).
    An export that names the courses ends the search. One that does not leaves
    only other program items to click: past a program's view the clicks
    wandered into the catalog's "Academic Requirements" menu (Miramar, run 4)."""
    page, clicked, best, viewed = reader.page, set(), None, False
    cache = {} if cache is None else cache
    for _ in range(max_clicks):
        try:
            texts = page.evaluate(CLICKABLE_JS)
        except Exception:
            break
        pool = {t for t in texts if t not in clicked and clickable_candidate(t, program)}
        if viewed:
            pool = {t for t in pool if program_view(t, program)}
        ranked = sorted(pool, key=lambda t: click_rank(t, program))
        if not ranked:
            break
        target = ranked[0]
        clicked.add(target)
        time.sleep(reader.delay)
        reader.loads += 1
        try:
            page.get_by_text(target, exact=True).first.click(timeout=10000)
            try:
                page.wait_for_load_state("networkidle", timeout=8000)
            except Exception:
                pass
            page.wait_for_timeout(2500)
            got = page.evaluate(PAGE_JS)
        except Exception as exc:
            trail.append({"click": target, "error": str(exc).splitlines()[0][:160]})
            continue
        fb = find_codes(got.get("body") or "", courses)
        fc = find_codes(got.get("content") or "", courses)
        if not fb and not fc:
            # A curriQunet program view can fill its requirements after the
            # first wait: Miramar's views named no listed course at 2.5 s (run 4).
            page.wait_for_timeout(5000)
            try:
                got = page.evaluate(PAGE_JS)
            except Exception:
                pass
            fb = find_codes(got.get("body") or "", courses)
            fc = find_codes(got.get("content") or "", courses)
        text, found, field = best_text(got, fb, fc)
        cov = coverage(found, courses)
        body = got.get("body") or ""
        at = max(0, body.find(target[:30]))
        trail.append({"click": target, "url": page.url, "title": (got.get("title") or "")[:120],
                      "codes": len(found), "coverage": round(cov, 2),
                      "body_sample": body[at:at + 700] if cov < ACCEPT_SHARE else None,
                      "link_sample": [[(ln.get("text") or "")[:60], ln.get("href")]
                                      for ln in (got.get("links") or [])[:40]]
                      if cov < ACCEPT_SHARE else None})
        if best is None or cov > best["coverage"]:
            best = {"url": page.url, "coverage": cov, "found": found, "text": text,
                    "field": field, "got": got}
        if cov >= ACCEPT_SHARE:
            break
        if program_view(target, program):
            exported = read_export(reader, export_link(got.get("links")), courses, cache)
            exported["view"] = page.url
            trail.append({k: v for k, v in exported.items() if k not in ("text", "found")})
            if exported.get("coverage", 0.0) > best["coverage"]:
                best = {"url": exported["url"], "coverage": exported["coverage"],
                        "found": exported["found"], "text": exported["text"],
                        "field": "export_pdf", "view": page.url, "got": got}
            if best["coverage"] >= ACCEPT_SHARE:
                break
            viewed = True
    return best


def read_export(reader, url: str | None, courses: list[dict], cache: dict) -> dict:
    """A curriQunet view's PDF export, read whole: pypdf first, pdfminer when
    pypdf's text names none of the listed codes."""
    if not url:
        return {"export": None, "url": None, "coverage": 0.0,
                "why": "the program's view carries no PDF export link"}
    pdf = read_pdf(reader, url, cache)
    pages, extractor = pdf.get("pages") or [], pdf.get("extractor")
    text = "\n\n".join("[page %d]\n%s" % (i + 1, t) for i, t in enumerate(pages))
    found = find_codes(text, courses)
    if not found and pdf.get("data"):
        alt = pdfminer_pages(pdf)
        alt_text = "\n\n".join("[page %d]\n%s" % (i + 1, t) for i, t in enumerate(alt["pages"]))
        alt_found = find_codes(alt_text, courses)
        if alt_found:
            text, found, extractor = alt_text, alt_found, alt["extractor"]
    return {"export": url, "url": url, "access": pdf.get("access"), "status": pdf.get("status"),
            "bytes": pdf.get("bytes"), "pages_total": len(pages), "extractor": extractor,
            "error": pdf.get("error"), "codes": len(found),
            "coverage": round(coverage(found, courses), 2), "found": found, "text": text}


def read_pdf(reader, url: str, cache: dict) -> dict:
    """The whole PDF, once per college: robots first, the census's delay, then
    pypdf's text for every page."""
    if url in cache:
        return cache[url]
    from _program_source_census import robots_allows
    out = {"url": url}
    if not robots_allows(reader._robots_for(url), url):
        out.update(access="robots_disallow", pages=[])
        cache[url] = out
        return out
    time.sleep(reader.delay)
    reader.loads += 1
    try:
        resp = reader.request.get(url, timeout=180000)
        out.update(status=resp.status, content_type=resp.headers.get("content-type", ""))
        if not resp.ok:
            out.update(access="blocked" if resp.status in (401, 403, 429) else "unreachable",
                       pages=[])
        else:
            from pypdf import PdfReader
            data = resp.body()
            pdf = PdfReader(io.BytesIO(data))
            out.update(access="ok", bytes=len(data), data=data, extractor="pypdf",
                       pages=[(p.extract_text() or "") for p in pdf.pages])
    except Exception as exc:
        out.update(access="unreachable", error=str(exc).splitlines()[0][:200], pages=[])
    cache[url] = out
    return out


def pdfminer_pages(pdf: dict) -> dict:
    """The same bytes read again by pdfminer, which decodes some fonts pypdf
    cannot. Built once per PDF, and only when pypdf's text names no listed
    code: West Los Angeles's catalog gave pypdf 1.5 million characters in which
    no listed subject appears (run 2 of the capture, S323)."""
    if "alt" not in pdf:
        try:
            from pdfminer.high_level import extract_pages
            from pdfminer.layout import LTTextContainer
            pages = []
            for layout in extract_pages(io.BytesIO(pdf.get("data") or b"")):
                pages.append("".join(el.get_text() for el in layout
                                     if isinstance(el, LTTextContainer)))
            pdf["alt"] = {"extractor": "pdfminer", "pages": pages}
        except Exception as exc:
            pdf["alt"] = {"extractor": "pdfminer", "pages": [],
                          "error": str(exc).splitlines()[0][:200]}
    return pdf["alt"]


def text_sample(pages: list[str], at=(0.3, 0.6), n: int = 240) -> list[str]:
    """A few hundred characters from two pages well inside the PDF, so a session
    can see whether the text layer reads as words."""
    out = []
    for frac in at:
        if pages:
            i = min(len(pages) - 1, int(len(pages) * frac))
            out.append("p%d: %r" % (i + 1, (pages[i] or "")[:n]))
    return out


def pdf_probe(pages: list[str], courses: list[dict], n: int = 4) -> list[str]:
    """When no page names a listed code: the words around the first listed
    subject wherever it appears, so a session can see how the PDF spells it."""
    subj = ""
    for c in courses:
        m = re.match(r"^([A-Za-z&]+)", (c.get("code") or "").strip())
        if m and len(m.group(1)) >= 3:
            subj = m.group(1)
            break
    out = []
    if not subj:
        return out
    pat = re.compile(re.escape(subj), re.I)
    for i, txt in enumerate(pages):
        for m in pat.finditer(txt or ""):
            out.append("p%d: %r" % (i + 1, txt[max(0, m.start() - 40):m.end() + 60]))
            if len(out) >= n:
                return out
    return out


def courseleaf_lists(got: dict, courses: list[dict]) -> list[dict]:
    """CourseLeaf's own course tables, kept as HTML: the structure (area
    headers, 'Select one of the following', the totals row) is in the markup,
    and the next pass reads it without a model."""
    keep, size = [], 0
    for cl in got.get("courselists") or []:
        # The tables write codes as NURS&nbsp;114: decode before matching (run 4
        # kept no table at either CourseLeaf college for want of it).
        if not find_codes(html.unescape(re.sub(r"<[^>]+>", " ", cl.get("html") or "")), courses):
            continue
        if size + len(cl["html"]) > HTML_CAP:
            break
        keep.append(cl)
        size += len(cl["html"])
    return keep


def capture(reader, entry: dict, cache: dict) -> dict:
    college, cn = entry["college"], entry["control_number"]
    prog = fetch_program(college, cn)
    rows = fetch_courses(college, cn)
    courses = closed_from_rows(rows)
    reg = fetch_registry(college)
    program = {"title": prog.get("program_title") or entry["title"], "award": prog.get("award")}
    rec = {"college": college, "control_number": cn, "shape": entry["shape"],
           "title": program["title"], "award": program["award"], "status": prog.get("status"),
           "title_in_sample_matches": (prog.get("program_title") or "") == entry["title"],
           "catalog_url": reg.get("catalog_url"), "catalog_year": reg.get("catalog_year"),
           "platform": reg.get("catalog_platform"), "format": reg.get("catalog_format"),
           "closed_list": courses,
           "load_id": rows[0]["load_id"] if rows else None}
    start = reg.get("catalog_url")
    if not start:
        rec.update(found=None, note="the registry holds no catalog address")
        return rec
    if reg.get("catalog_format") in ("single_pdf",) or start.lower().endswith(".pdf"):
        pdf = read_pdf(reader, start, cache)
        pages, extractor = pdf.get("pages") or [], pdf.get("extractor")
        run = pick_pdf_pages(pages, program, courses)
        tried = [{"extractor": extractor, "chars_total": sum(len(p) for p in pages),
                  "empty_pages": sum(1 for p in pages if len(p.strip()) < 40),
                  "probe": [] if run else pdf_probe(pages, courses),
                  "sample": [] if run else text_sample(pages)}]
        if not run and pdf.get("data"):
            alt = pdfminer_pages(pdf)
            alt_run = pick_pdf_pages(alt["pages"], program, courses)
            tried.append({"extractor": alt["extractor"], "error": alt.get("error"),
                          "chars_total": sum(len(p) for p in alt["pages"]),
                          "probe": [] if alt_run else pdf_probe(alt["pages"], courses),
                          "sample": [] if alt_run else text_sample(alt["pages"])})
            if alt_run:
                pages, extractor, run = alt["pages"], alt["extractor"], alt_run
        text = "\n\n".join("[page %d]\n%s" % (i + 1, pages[i]) for i in run)
        found = find_codes(text, courses)
        rec.update(method="pdf_pages", source={"url": start, "access": pdf.get("access"),
                   "status": pdf.get("status"), "bytes": pdf.get("bytes"),
                   "pages_total": len(pages), "pages": [i + 1 for i in run],
                   "extractor": extractor, "tried": tried,
                   "error": pdf.get("error")},
                   coverage=round(coverage(found, courses), 3),
                   codes_found=sorted(found), text=text[:TEXT_CAP])
        return rec
    spa = reg.get("catalog_platform") == "curriqunet"
    res = locate_html(reader, program, courses, start, cache, spa)
    if spa and (res["best"] or {}).get("coverage", 0.0) < ACCEPT_SHARE:
        # Start each program's clicks from the catalog's front page.
        reader.load(start)
        reader.page.wait_for_timeout(2500)
        clicked = click_through(reader, program, courses, res["trail"], cache=cache)
        if clicked and clicked["coverage"] > (res["best"] or {}).get("coverage", 0.0):
            res["best"] = clicked
    best = res["best"] or {}
    got = best.get("got") or {}
    rec.update(method="export_pdf" if best.get("field") == "export_pdf" else "html_page",
               trail=res["trail"],
               source={"url": best.get("url"), "title": got.get("title"), "h1": got.get("h1"),
                       "text_from": best.get("field"), "view": best.get("view")},
               coverage=round(best.get("coverage") or 0.0, 3),
               codes_found=sorted(best.get("found") or {}),
               text=with_outcome_tabs(text_window(best.get("text") or "", best.get("found") or {},
                                                  from_start=best.get("field") == "export_pdf"),
                                      got.get("outcomeTabs")),
               courseleaf_lists=courseleaf_lists(got, courses)
               if reg.get("catalog_platform") == "courseleaf" else [])
    return rec


# A Program Pathways Mapper site has no fixed address: the census found them at
# <slug>.programmapper.ws|.com|.org and programmap.<domain>. Miramar's pages
# named none, so the pilot asks the likely hosts once each.
PPM_PROBES = {
    "San Diego Miramar College": [
        "https://miramar.programmapper.ws/academics",
        "https://sdmiramar.programmapper.ws/academics",
        "https://programmap.sdmiramar.edu/academics",
        "https://programmapper.sdmiramar.edu/academics",
    ],
}


def probe_ppm(reader, college: str, cache: dict) -> list[dict]:
    out = []
    for url in PPM_PROBES.get(college, []):
        got = load(reader, url, cache, True)
        out.append({"url": url, "status": got.get("status"), "access": got.get("access"),
                    "final_url": got.get("final_url"), "title": (got.get("title") or "")[:120],
                    "error": got.get("error"), "links": len(got.get("links") or [])})
        if got.get("access") == "ok" and "programmap" in (got.get("final_url") or "").lower():
            break
    return out


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--only", default="", help="colleges whose name contains this")
    args = ap.parse_args(argv)
    sample = [p for p in load_sample()
              if not args.only or args.only.lower() in p["college"].lower()]
    delay = int(os.environ.get("CENSUS_DELAY_MS", "4000"))
    print("program requirements pilot, capture: %d programs, %.1f s between loads, "
          "writes nothing" % (len(sample), delay / 1000), flush=True)
    pw, browser, reader = open_reader(delay)
    recs, ppm, caches = [], {}, {}
    try:
        for entry in sample:
            cache = caches.setdefault(entry["college"], {})
            t0 = time.time()
            try:
                rec = capture(reader, entry, cache)
            except Exception as exc:
                rec = {"college": entry["college"], "control_number": entry["control_number"],
                       "error": str(exc).splitlines()[0][:300]}
            rec["seconds"] = round(time.time() - t0, 1)
            recs.append(rec)
            print("%-28s %-6s %-22s cov %-5s codes %-3s %s" % (
                entry["college"][:28], entry["control_number"], entry["shape"],
                rec.get("coverage"), len(rec.get("codes_found") or []),
                (rec.get("source") or {}).get("url") or rec.get("error") or rec.get("note")),
                flush=True)
        for college in sorted({p["college"] for p in sample} & set(PPM_PROBES)):
            ppm[college] = probe_ppm(reader, college, caches.setdefault(college, {}))
    finally:
        browser.close()
        pw.stop()
    print("\n=== PILOT PPM PROBES ===")
    print(json.dumps(ppm, indent=1))
    print("=== PILOT SOURCES JSON BEGIN ===")
    for r in recs:
        print(json.dumps(r, ensure_ascii=False))
    print("=== PILOT SOURCES JSON END ===")
    return 0


if __name__ == "__main__":
    sys.exit(main())
