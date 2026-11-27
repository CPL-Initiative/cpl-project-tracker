#!/usr/bin/env python3
"""Read a named list of one college's pages from a runner and print what they say.

WHY. A curated line on CPL Pathways marked *To confirm* waits on a page this
container cannot reach (the egress proxy blocks college sites; a runner reaches
them). Sam, sheet 33 card 5 (2026-10-04): the agent exhausts its own reading
before anyone drafts a request to a college. This is that reading for a fixed
question list: each page in kb/college_reads/<plan>.json names the line it
answers, and the job log carries the page's text for a session to read back
through the GitHub MCP. What the read reaches and what it is refused becomes
the college's procedure record (sheet 34 card 2: one per college, kept with its
history on the college's program_source_registry row). The reader loads that
record before each run, prints it, and leaves alone a host the record marks
refused, unreached or gone unless the plan's page says retry.

Polite by construction, as the census and the pilot capture are: the census's
Reader reads robots.txt first for every host, waits CENSUS_DELAY_MS before every
load and names the CPL Initiative in its user agent (Sam's sheet-23 call 5).
It WRITES NOTHING and runs on no schedule. A page may open its collapsed
sections first ("expand"), print a long table's matching rows ("rows"), and
may also submit one of its
forms (a public search such as a class schedule, never a sign-in): robots.txt
for the form's action first, the same delay, and the fields it sent printed.
A page with "network": true also prints the data its own scripts fetched from
its own host while it loaded (no request of the reader's own), and from each
vendor host its "network_hosts" names (a catalog on the college's domain whose
scripts call the vendor's: Merced's catalog.mccd.edu calls app.coursedog.com),
and, for each string its "network_find" names, the stretch of a body around it.
A page with "cq_view": true and "cq_catalog" reads a curriQunet entry through the
catalog's own JSON exactly as the harvest's capture reads it (cq_view_read).

Usage (runner): python3 kb/_college_page_read.py kb/college_reads/cerritos_ironworker_ladder.json
"""
import hashlib
import json
import os
import re
import sys
import time
import urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

HTML_FULL_CAP = 40000    # an HTML page this short prints whole
HEAD_CAP = 3000          # else its opening, then the excerpts
FOLD_UNDER = 45          # consecutive lines shorter than this print as one line
# The GitHub MCP returns at most 5,000 lines of a job log (measured S329: the
# first read printed 5,826 and lost its first two pages, the Field Ironwork page
# among them). A menu, a course table and a 240-language picker are each a run
# of short lines, so folding them is what keeps a whole read inside the window.
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


def fold(text: str, under: int = FOLD_UNDER) -> str:
    """Runs of short lines become one line joined by ' · '; blank lines drop.
    The words stay in order, so a course table still reads code, title, units."""
    out, run = [], []
    for line in (text or "").split("\n"):
        t = line.strip()
        if not t:
            continue
        if len(t) < under:
            run.append(t)
            continue
        if run:
            out.append(" · ".join(run))
            run = []
        out.append(t)
    if run:
        out.append(" · ".join(run))
    return "\n".join(out)


def matching_links(links: list[dict], pattern: str | None, cap: int = 40) -> list[dict]:
    """Links on any host whose words or address match: printed, never followed,
    so a session learns where a page points (a statewide database, a vendor)
    and names that host in the next plan with its reason."""
    if not pattern:
        return []
    rx = re.compile(pattern, re.I)
    out, seen = [], set()
    for ln in links or []:
        href = (ln.get("href") or "").split("#")[0]
        if not href.startswith("http") or href in seen:
            continue
        if rx.search(ln.get("text") or "") or rx.search(href):
            out.append({"text": (ln.get("text") or "")[:120], "href": href})
            seen.add(href)
        if len(out) >= cap:
            break
    return out


# A page's forms, for a site that chooses by form rather than by link (Cerritos's
# Schedule+ picks a department from a list): the action, the method, and each
# field's name with its first options, so a later plan can name the query.
FORMS_JS = """() => Array.from(document.forms).slice(0, 5).map(f => ({
  action: f.action, method: f.method,
  fields: Array.from(f.elements).slice(0, 60).map(e => ({
    name: e.name || '', type: e.type || '', value: (e.value || '').slice(0, 60),
    options: e.options ? Array.from(e.options).slice(0, 160)
      .map(o => o.value + '=' + (o.text || '').trim().slice(0, 40)) : null}))}))"""


# Every <select> on a page, whole (S736): a class schedule search lists each subject code beside its title in one
# dropdown (LACCD's PeopleSoft guest search, "ACCTG - Accounting"), and FORMS_JS's caps (5 forms, 60 fields, 160
# options of 40 characters) cut a PeopleSoft page's list short. A page with "selects": true prints each select's id,
# name and every option, value and words.
SELECTS_CAP = 800
SELECTS_JS = """(cap) => Array.from(document.querySelectorAll('select')).slice(0, 40).map(e => ({
  id: e.id || '', name: e.name || '', label: ((e.labels && e.labels[0] && e.labels[0].textContent) || '').trim().slice(0, 80),
  options: Array.from(e.options).slice(0, cap).map(o => [o.value, (o.text || '').trim().slice(0, 120)]),
  total: e.options.length}))"""


# A plan's page may submit one of its forms (read 4: Schedule+ lists a term's
# sections for the departments ticked on its form). The spec names the form by
# the end of its action, the fields to set (each name maps to the values that
# end up checked or selected; every other box of that name is cleared), and
# optionally a pattern for the submit button's name or words. Fields it does not
# name keep the page's defaults. The reader prints what it sent.
SUBMIT_PREP_JS = """(spec) => {
  document.querySelectorAll('[data-cpl-read]').forEach(x => x.removeAttribute('data-cpl-read'));
  if (spec.link) {
    // A PeopleSoft page acts by links that run its own submit (javascript:submitAction_win0): the spec names the
    // link by its words, and the reader clicks it as a person would.
    const rx = new RegExp(spec.link);
    const a = Array.from(document.querySelectorAll('a')).find(x => rx.test((x.textContent || '').trim()));
    if (!a) return {error: 'no link whose words match ' + spec.link};
    a.setAttribute('data-cpl-read', 'link');
    const f = a.closest('form') || document.forms[0];
    return {action: f ? f.action : location.href, method: f ? (f.method || 'get').toUpperCase() : 'GET', sent: [],
            button: 'link ' + (a.id || '') + '=' + (a.textContent || '').trim().slice(0, 60), buttons: []};
  }
  const f = Array.from(document.forms).find(x => !spec.action ||
    (x.getAttribute('action') || '').endsWith(spec.action) || x.action.endsWith(spec.action));
  if (!f) return {error: 'no form whose action ends with ' + spec.action};
  const set = spec.set || {};
  for (const e of Array.from(f.elements)) {
    if (!e.name || !(e.name in set)) continue;
    const want = set[e.name].map(String);
    if (e.type === 'checkbox' || e.type === 'radio') e.checked = want.includes(e.value);
    else if (e.tagName === 'SELECT') Array.from(e.options).forEach(o => { o.selected = want.includes(o.value); });
    else if (e.type !== 'submit' && e.type !== 'button' && want.length) e.value = want[0];
  }
  const buttons = Array.from(f.querySelectorAll('input[type=submit], button[type=submit], button:not([type])'));
  const rx = spec.button ? new RegExp(spec.button, 'i') : null;
  const btn = rx ? buttons.find(b => rx.test(b.name || '') || rx.test(b.value || b.textContent || '')) : null;
  document.querySelectorAll('[data-cpl-read]').forEach(x => x.removeAttribute('data-cpl-read'));
  f.setAttribute('data-cpl-read', 'form');
  if (btn) btn.setAttribute('data-cpl-read', 'button');
  return {action: f.action, method: (f.method || 'get').toUpperCase(),
          sent: Array.from(new FormData(f)).slice(0, 120).map(([k, v]) => k + '=' + String(v).slice(0, 60)),
          button: btn ? ((btn.name || '') + '=' + (btn.value || btn.textContent || '').trim().slice(0, 60)) : null,
          buttons: buttons.slice(0, 12).map(b => (b.name || '') + '=' + (b.value || b.textContent || '').trim().slice(0, 60))};
}"""

SUBMIT_GO_JS = """() => {
  const a = document.querySelector('a[data-cpl-read=link]');
  if (a) { a.click(); return; }
  const f = document.querySelector('form[data-cpl-read=form]');
  const b = document.querySelector('[data-cpl-read=button]');
  if (b && f.requestSubmit) f.requestSubmit(b); else HTMLFormElement.prototype.submit.call(f);
}"""


def submit_specs(target: dict) -> list[dict]:
    """A page's submit field as a list: one spec, several, or none."""
    s = target.get("submit")
    if not s:
        return []
    return [s] if isinstance(s, dict) else list(s)


def submit_form(reader, spec: dict) -> dict:
    """Fill and submit a form on the page the reader is on, under the same rules
    as a load: robots.txt for the form's action first, then the delay. Returns a
    record shaped like read_one's, with what was sent."""
    from _program_source_census import NAV_TIMEOUT_MS, classify_access, robots_allows
    prep = reader.page.evaluate(SUBMIT_PREP_JS, spec)
    out = {"url": prep.get("action") or spec.get("action") or "", "kind": "html", "submitted": prep}
    if prep.get("error"):
        out.update(access="no_form", error=prep["error"])
        return out
    action = prep["action"]
    if not robots_allows(reader._robots_for(action), action):
        out.update(access="robots_disallow", status=None)
        return out
    time.sleep(reader.delay)
    reader.loads += 1
    try:
        with reader.page.expect_navigation(wait_until="domcontentloaded",
                                           timeout=NAV_TIMEOUT_MS) as nav:
            reader.page.evaluate(SUBMIT_GO_JS)
        resp = nav.value
        try:
            reader.page.wait_for_load_state("networkidle", timeout=8000)
        except Exception:
            pass
        status = resp.status if resp else None
        out.update(status=status, final_url=reader.page.url,
                   content_type=(resp.headers.get("content-type", "") if resp else ""),
                   title=reader.page.title() or "")
        out["access"] = classify_access(status, out["title"])
        reader.page.wait_for_timeout(1500)
        page = reader.page.evaluate(TEXT_JS)
        out["text"], out["links"] = page.get("text") or "", page.get("links") or []
    except Exception as exc:
        out.update(status=None, access="unreachable", error=str(exc).splitlines()[0][:200])
    return out


# A host the record marks gone answers, but not as the site the college names
# (read 4, 2026-10-04: statewidepathways.org redirects to a domain-for-sale page).
SKIP_ACCESS = {"refused", "unreached", "gone"}


def skipped_hosts(procedure: dict | None) -> dict:
    """host -> the record's note, for every host it marks refused, unreached or gone."""
    out = {}
    for h in (procedure or {}).get("hosts") or []:
        if h.get("host") and h.get("access") in SKIP_ACCESS:
            out[h["host"].lower()] = h.get("note") or h["access"]
    return out


def load_procedure(college: str) -> dict | None:
    """The college's procedure record, read with the public key. A missing row,
    a missing column or a failed read returns None and the read goes on."""
    from _program_requirements_pilot import _get, q
    try:
        rows = _get("program_source_registry?select=procedure,procedure_by,procedure_at"
                    "&college=eq.%s" % q(college))
    except Exception as exc:
        print("procedure record: not read (%s)" % str(exc).splitlines()[0][:160])
        return None
    row = rows[0] if rows else {}
    if not row.get("procedure"):
        print("procedure record: none on the registry row yet")
        return None
    proc = row["procedure"]
    print("procedure record: %d hosts, %d steps, %d nuances; last changed %s by %s" % (
        len(proc.get("hosts") or []), len(proc.get("steps") or []),
        len(proc.get("nuances") or []), row.get("procedure_at"), row.get("procedure_by")))
    for h in proc.get("hosts") or []:
        print("  host %-34s %-10s %s" % (h.get("host"), h.get("access"), h.get("note") or ""))
    return proc


def pdf_pages_to_print(pages: list[str], pattern: re.Pattern,
                       cap: int = PDF_PAGE_CAP, span: list | None = None, after: int = 0) -> list[int]:
    """Page indexes with a keyword hit, in order; the first page when none hit.
    span ([first, last], 1-based, inclusive) keeps the search to a part of the
    catalog, so a word the front matter repeats (Cal-GETC) does not spend the cap
    before the program pages; after prints that many pages following each hit,
    for a catalog whose requirement block sits on the page after its heading
    (Cañada, S421). Both come from the plan (pdf_span, pdf_after)."""
    lo, hi = (span or [1, len(pages)])[:2]
    lo, hi = max(1, int(lo or 1)), min(len(pages), int(hi or len(pages)))
    hit = [i for i, p in enumerate(pages) if lo - 1 <= i <= hi - 1 and pattern.search(p or "")]
    out: list[int] = []
    for i in hit:
        for j in range(i, min(i + 1 + max(0, int(after or 0)), len(pages))):
            if j not in out:
                out.append(j)
    return (out or ([0] if pages else []))[:cap]


# The page's main region when it marks one (a college site wraps every page in a
# menu, a footer and a language picker); the whole body when it does not, or when
# the main region is nearly empty.
TEXT_JS = """() => {
  const m = document.querySelector('main, [role=main], #main-content, #main, #content');
  const body = document.body ? document.body.innerText : '';
  const main = m ? m.innerText : '';
  return {text: main.length >= 200 ? main : body,
  links: Array.from(document.querySelectorAll('a[href]')).slice(0, 2500)
    .map(a => ({text: (a.innerText || a.textContent || a.getAttribute('aria-label')
                       || a.title || '').trim().slice(0, 160), href: a.href}))};
}"""


# A page may keep its answer in a collapsed section (read 6, 2026-10-04: Cerritos's
# CCAP page closes "Participating High Schools" in an accordion, and innerText
# skips what is not shown). A plan's page with "expand": true opens every
# <details>, clicks every collapsed toggle that stays on the page (a button,
# or a link to a fragment) and every unselected tab naming a panel on the page,
# then reads. A panel still not shown after its click is read by textContent.
# Never a link to another address: that would be a load.
EXPAND_JS = """() => {
  const root = document.querySelector('main, [role=main], #main-content, #main, #content') || document.body;
  let opened = 0;
  root.querySelectorAll('details:not([open])').forEach(d => { d.open = true; opened++; });
  const toggles = Array.from(root.querySelectorAll(
    'button[aria-expanded="false"], [role=button][aria-expanded="false"], a[aria-expanded="false"], [data-toggle=collapse], [data-bs-toggle=collapse]'))
    .filter(b => b.tagName !== 'A' || (b.getAttribute('href') || '#').startsWith('#')).slice(0, 40);
  toggles.forEach(b => { try { b.click(); opened++; } catch (e) {} });
  // A page's own tabs (S366: Long Beach City keeps Program Requirements in a role=tab
  // panel, its tab bar in a <nav> outside <main>): click each unselected tab that names
  // a panel on this page, so the panels it holds are read below.
  const tabs = Array.from(document.querySelectorAll('[role=tab]'))
    .filter(t => t.getAttribute('aria-selected') !== 'true')
    .filter(t => t.getAttribute('aria-controls') || (t.getAttribute('href') || '').startsWith('#'))
    .slice(0, 12);
  tabs.forEach(t => { try { t.click(); opened++; } catch (e) {} });
  toggles.push(...tabs);
  return {opened: opened, ids: toggles.map(b => b.getAttribute('aria-controls') ||
    ((b.getAttribute('href') || '').startsWith('#') ? b.getAttribute('href').slice(1) : '') ||
    (b.getAttribute('data-target') || b.getAttribute('data-bs-target') || '').replace(/^#/, '')).filter(Boolean)};
}"""

HIDDEN_JS = """(ids) => ids.map(id => document.getElementById(id)).filter(e => e && e.getClientRects().length === 0)
  .map(e => (e.textContent || '').replace(/\\s+/g, ' ').trim()).filter(t => t.length > 0).join('\\n')"""


# A page may hold its answer as rows of one long table (read 9, 2026-10-05: the
# archived Statewide Career Pathways list runs 419,364 characters, every college's
# agreements in one table, and the log keeps 24 excerpts). A plan's page with
# "rows": "<regex>" prints every table row whose text matches, one line per row,
# its cells and the links in it, up to ROWS_CAP.
ROWS_CAP = 600
ROWS_JS = """(src) => {
  const rx = new RegExp(src);
  const out = [];
  for (const tr of document.querySelectorAll('tr')) {
    if (tr.querySelector('tr')) continue;   // a layout row wrapping a whole table
    const text = (tr.innerText || tr.textContent || '');
    if (!rx.test(text)) continue;
    out.push({cells: Array.from(tr.children).map(c => (c.innerText || c.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 300)),
              links: Array.from(tr.querySelectorAll('a[href]')).map(a => ({text: (a.innerText || '').trim().slice(0, 120), href: a.href}))});
    if (out.length >= %d) break;
  }
  return out;
}""" % ROWS_CAP


# A JavaScript catalog draws its outline from data its own scripts fetch (S357:
# curriQunet's views are paths of outline ids, /catalog/alias/rcc-catalog/iq/5852/
# 6117/5941, and draw their menus without links). A plan's page with
# "network": true records each response the page's own scripts fetched from its
# own host while it loaded and printed: the address, the status, the type and the
# opening of the body. The reader requests nothing more; the browser made these
# requests for the page.
NETWORK_CAP = 40         # responses printed per page
NETWORK_BODY = 1500      # characters of each body printed
# "network_find": a body longer than NETWORK_BODY hides what sits past its opening (S458: ENGM 622's
# hours in Hartnell's courses/search answer). Each string the plan names prints the stretch around each
# place it occurs in a body, up to NETWORK_FIND_CAP places a string, NETWORK_FIND_SPAN characters a side.
NETWORK_FIND_CAP = 6
NETWORK_FIND_SPAN = 600


def network_kept(url: str, resource_type: str, page_url: str, hosts: tuple = ()) -> bool:
    """A fetch or XHR the page made to its own host, or to a vendor host the plan
    names. Merced's Coursedog catalog sits on catalog.mccd.edu and fetches its
    program list and its PDF from app.coursedog.com, so a read kept to the page's
    own domain printed none of those calls (run 39077970234, S409)."""
    host = (urllib.parse.urlparse(url).hostname or "").lower()
    return resource_type in ("xhr", "fetch") and (same_site(url, page_url) or host in hosts)


def network_listen(page, page_url: str, hosts: tuple = ()) -> tuple[list, object]:
    got: list = []

    def on_response(resp):
        try:
            if network_kept(resp.url, resp.request.resource_type, page_url, hosts) and len(got) < NETWORK_CAP:
                got.append(resp)
        except Exception:
            pass
    page.on("response", on_response)
    return got, on_response


def network_find(body: str, find: tuple = ()) -> list[dict]:
    """The stretches of body around each string the plan names (network_find)."""
    out = []
    for word in find:
        start = 0
        for _ in range(NETWORK_FIND_CAP):
            at = body.find(word, start)
            if at < 0:
                break
            out.append({"find": word, "at": at,
                        "text": body[max(0, at - NETWORK_FIND_SPAN):at + len(word) + NETWORK_FIND_SPAN]})
            start = at + len(word)
    return out


def network_read(got: list, find: tuple = ()) -> list[dict]:
    out = []
    for resp in got:
        rec = {"url": resp.url, "status": resp.status, "method": resp.request.method,
               "content_type": (resp.headers or {}).get("content-type")}
        try:
            body = resp.text()
            rec["bytes"], rec["body"] = len(body), body[:NETWORK_BODY]
            if find:
                rec["found"] = network_find(body, find)
        except Exception as exc:
            rec["error"] = str(exc).splitlines()[0][:160]
        out.append(rec)
    return out


# "capture_view": true reads a page as the harvest's capture reads it: the pilot's PAGE_JS,
# then the visible text with the hidden tab panels appended, as best_text() composes
# "innerText+tabs". The log prints it line for line, a run of blank lines as one
# "(blank)", because section_award() reads a heading over two ADJACENT short lines and
# fold() drops the blank line that parts them. MiraCosta's discipline pages kept one
# claimant each (page_claimed 82, S444) and the capture keeps none of the text it read.
CAPTURE_LINES = 1400     # lines of one page's capture view printed
# A filing read prints every course a page holds (S690: NOCE's Kids College page runs past 1,400 lines), so a plan
# may raise the capture view's line cap ("capture_lines") and the PDF page cap ("pdf_page_cap"), never lower them and
# never past these ceilings. A session downloads the whole log (`gh run view --log`), which the MCP's 5,000-line window
# would otherwise cut.
CAPTURE_LINES_MAX = 20000
PDF_PAGE_CAP_MAX = 1000


LINKS_SHOWN = 40               # matching links printed from one page
LINKS_SHOWN_MAX = 400
SUBJECT_CONTEXT_BEFORE = 5     # lines kept above a subject's first course
SUBJECT_CONTEXT_BEFORE_MAX = 12


def subject_context(pages: list[str], heading: str, before: int = SUBJECT_CONTEXT_BEFORE,
                    start_page: int = 1, units: str | None = None, units_inline: str | None = None,
                    within: int = 3) -> list[dict]:
    """For each subject code, the lines printed above its first course (S698, #3655).

    A filed catalog keeps each course from its heading line down, so the subject heading above a subject's
    first course ("ACCOUNTING", "Mathematics (MATH & STAT)") was never kept. `heading` is the file's own
    course-heading pattern with a `subj` group. The first course of each code is taken in page order from
    `start_page` (1-based); the non-empty lines above it, up to `before` and never past the course before
    it, are returned as printed. One entry per code: {subj, page, line, before}.

    `units` and `units_inline` are the file's own units patterns. Where a plan names either, a heading line
    is a course only when it carries its units (units_inline) or a units line follows within `within` lines,
    as the filed parse reads it; a code named in a degree table or an honors list ahead of the course
    descriptions then opens no subject."""
    rx = re.compile(heading)
    ux = re.compile(units) if units else None
    ix = re.compile(units_inline) if units_inline else None
    before = max(1, min(int(before or SUBJECT_CONTEXT_BEFORE), SUBJECT_CONTEXT_BEFORE_MAX))
    lines: list[tuple[int, str]] = []
    for i, text in enumerate(pages or []):
        if i + 1 < int(start_page or 1):
            continue
        for raw in (text or "").splitlines():
            line = " ".join(raw.split())
            if line:
                lines.append((i + 1, line))

    def is_course(k: int) -> bool:
        if not (ux or ix):
            return True
        if ix and ix.search(lines[k][1]):
            return True
        return bool(ux) and any(ux.search(lines[n][1]) for n in range(k + 1, min(len(lines), k + 1 + max(1, int(within or 3)))))

    seen: dict = {}
    out: list[dict] = []
    tail: list[str] = []          # the non-empty lines since the last course heading, across pages
    for k, (page, line) in enumerate(lines):
        m = rx.match(line)
        if not m or not is_course(k):
            tail.append(line)
            tail = tail[-SUBJECT_CONTEXT_BEFORE_MAX:]
            continue
        subj = " ".join((m.group("subj") or "").split())
        if subj and subj not in seen:
            seen[subj] = True
            out.append({"subj": subj, "page": page, "line": line, "before": tail[-before:]})
        tail = []
    return out


def print_subject_context(pages: list[str], spec: dict) -> None:
    got = subject_context(pages, spec["heading"], spec.get("before") or SUBJECT_CONTEXT_BEFORE,
                          spec.get("start_page") or 1, units=spec.get("units"),
                          units_inline=spec.get("units_inline"), within=spec.get("within") or 3)
    print("--- subject context: the lines above each subject's first course (%d subjects) ---" % len(got))
    for g in got:
        print("[subject %s · page %d]" % (g["subj"], g["page"]))
        for b in g["before"]:
            print("  | " + b[:200])
        print("  > " + g["line"][:200])


def plan_cap(plan: dict | None, key: str, default: int, ceiling: int) -> int:
    """The plan's own cap for key, between the default and the ceiling; the default when it names none."""
    try:
        own = int((plan or {}).get(key) or 0)
    except (TypeError, ValueError):
        own = 0
    return min(max(default, own), ceiling)


def capture_text(got: dict) -> str:
    from _program_requirements_pilot import hidden_tabs_text
    tabs = hidden_tabs_text(got)
    return (got.get("body") or "") + ("\n\n" + tabs if tabs else "")


DROPPED_CAP = 3000       # characters of each tab panel the capture leaves out, printed


def dropped_panels(got: dict) -> list[list]:
    """The tab panels hidden_tabs_text() leaves out (no course named, or a course index),
    so a read shows what the capture never sees: MiraCosta's Computer Studies Degrees tab
    (689 characters, S445) was one."""
    from _program_requirements_pilot import hidden_tabs_text
    return [[(t.get("label") or t.get("id") or "")[:60], (t.get("text") or "")[:DROPPED_CAP]]
            for t in got.get("tabPanels") or [] if not hidden_tabs_text({"tabPanels": [t]})]


def unfolded(text: str, cap: int = CAPTURE_LINES) -> str:
    """Every line as the capture splits it; a run of blank lines prints once as (blank)."""
    out: list[str] = []
    for line in (text or "").split("\n"):
        t = line.strip()
        if not t:
            if out and out[-1] != "(blank)":
                out.append("(blank)")
            continue
        out.append(t)
    if len(out) > cap:
        out = out[:cap] + ["(%d more lines)" % (len(out) - cap)]
    return "\n".join(out)


# "cq_view": true reads a curriQunet entry as the capture reads it (S449). A rendered
# view of an iq address shows the Summary tab alone, because the catalog draws its other
# tabs from JSON on a click (S447, read 39793778941), so capture_view cannot show what
# cq_pages() reads. This view makes the capture's own calls: the entry's navigation
# record under its section (its title, whether it has child pages, the siblings whose
# title key is the same, which cq_distinct() would fold into one), its page, its child
# pages as cq_children() takes them (a Requirements tab first, CQ_MAX_CHILDREN), and the
# text cq_page() joins, with the codes the coarse net reads from it. The address is the
# entry's iq view, .../iq/<root>/<section>/<node>; the plan's page names the catalog id
# ("cq_catalog", the capture's curriqunet.catalog). No browser render, no model call.
CQ_VIEW_PATH = re.compile(r"/iq/(\d+)/(\d+)/(\d+)/?$")


def cq_view_ids(url: str) -> tuple[int, int] | None:
    """(section, node) of an entry's iq address, or None when it names no entry."""
    m = CQ_VIEW_PATH.search(urllib.parse.urlparse(url or "").path)
    return (int(m.group(2)), int(m.group(3))) if m else None


def cq_view_read(reader, url: str, catalog: int, errors: list) -> dict:
    """The capture's reading of one curriQunet entry, as cq_pages() would make it."""
    import _program_requirements_college as C
    ids = cq_view_ids(url)
    if not ids:
        return {"error": "cq_view needs an entry's iq address, .../iq/<root>/<section>/<node>"}
    section, node = ids
    root, prefix = C.cq_base(url)
    get = lambda u: C.cq_json(reader, u, errors)  # noqa: E731
    siblings = (get("%s/Catalog/_getNavigation?id=%d&parentId=%d" % (root, catalog, section)) or {}).get("navs") or []
    entry = next((n for n in siblings if n.get("id") == node), None)
    out = {"section": section, "node": node, "siblings": len(siblings), "entry_listed": entry is not None}
    entry = entry or {"id": node, "text": ""}
    key = C.cq_title_key(entry)
    out["entry"] = {"id": entry.get("id"), "text": entry.get("text"), "aliaspath": entry.get("aliaspath"),
                    "haschildbodynavs": bool(entry.get("haschildbodynavs")), "is_program": C.cq_is_program(entry),
                    "hidden": C.cq_hidden(entry), "title_key": key}
    out["twins"] = [{"id": n.get("id"), "text": n.get("text"), "aliaspath": n.get("aliaspath")}
                    for n in siblings if n.get("id") != node and C.cq_title_key(n) == key]
    page = get("%s/Catalog/_getPage?catalogId=%d&id=%d" % (root, catalog, node))
    out["page_read"] = page is not None
    out["lists"] = [{"id": nl.get("id"), "text": nl.get("text")} for nl in C.cq_lists(page)] if page else []
    children, more = C.cq_children(get, catalog, root, page) if page else ([], [])
    out["children"] = [C.cq_page_text(c)[0] for c in children]
    out["more_programs"] = [{"id": m.get("id"), "text": m.get("text")} for m in more]
    pg = C.cq_page(entry, page, prefix, children) if page else None
    out["text"] = pg["body"] if pg else ""
    out["codes"] = sorted(pg["codes"]) if pg else []
    # S741: how rule B types the entry page by page (kb/_reader_page_checks.py entry_less_descriptions), and how the
    # rows of its curriculum blocks nest (cq_rows: where a "Select one" group ends).
    import _reader_page_checks as RC
    out["page_type"] = RC.page_type(out["text"])
    out["parts"] = [{"title": p.get("title"), "child": bool(p.get("child")), "chars": len(p.get("text") or ""),
                     "type": RC.page_type(p.get("text"))}
                    for p in ((pg or {}).get("got") or {}).get(RC.OWN_PARTS) or []]
    out["rows"] = cq_row_outline(([page] if page else []) + children)
    return out


CQ_ROWS_SHOWN = 240      # rows of one entry's curriculum blocks printed
CQ_ROW_FLAG = re.compile(r"\bdata-([a-z-]+)\s*=\s*[\"']true[\"']", re.I)


def cq_row_outline(pages: list[dict]) -> list[str]:
    """Each curriculum block's rows as cq_rows nests them, one line a row: its depth, whether it opens a group and
    with how many members, whether it follows a group, whether another group holds it, the row tag's true flags and
    the row's first words."""
    import _program_requirements_college as C
    lines: list[str] = []
    for p in pages:
        for bi, b in enumerate((p or {}).get("body") or []):
            html_text = b.get("text") or ""
            rows = C.cq_rows(html_text)
            if rows is None:
                lines.append("block %d: its div tags do not balance, so its rows read flat" % bi)
                continue
            for r in rows:
                tag = C.CQ_DIV.match(html_text, r["at"])
                flags = ",".join(CQ_ROW_FLAG.findall(tag.group(2))) if tag else ""
                words = " · ".join(C.cq_text(html_text[r["at"]:r["at"] + 3000]).split("\n")[:3])[:90]
                lines.append("block %d depth %d %s%s%s [%s] %s" % (
                    bi, r["depth"], "GROUP of %d" % r["members"] if r["group"] else "row",
                    " AFTER A GROUP" if r["after_group"] else "", " IN A GROUP" if r["inside"] else "", flags, words))
    return lines


def read_one(reader, url: str, pattern: re.Pattern, cache: dict, expand: bool = False,
             rows: str | None = None, network: bool = False, network_hosts: tuple = (),
             network_find: tuple = (), capture_view: bool = False, cq_catalog: int = 0,
             selects: bool = False) -> dict:
    """One page through the census's Reader (or the pilot's PDF reader), with
    its text, its links and the excerpts around the plan's keywords."""
    from _program_requirements_pilot import read_pdf, pdfminer_pages
    out = {"url": url}
    if cq_catalog:
        errors: list = []
        view = cq_view_read(reader, url, cq_catalog, errors)
        out.update(kind="html", status=200 if view.get("page_read") else None,
                   access="ok" if view.get("page_read") else "unreached",
                   error=view.get("error") or ("; ".join(errors[:6]) or None),
                   text=view.get("text") or "", cq_view=view, links=[])
        return finish(out, pattern)
    if not is_pdf(url):
        heard, listener = network_listen(reader.page, url, network_hosts) if network else ([], None)
        got = reader.load(url)
        out.update({k: got.get(k) for k in ("status", "final_url", "content_type",
                                             "access", "error", "title")})
        if got.get("access") == "ok" and not is_pdf(url, got.get("content_type")):
            try:
                reader.page.wait_for_timeout(1500)   # a script-built page fills in late
                if network:
                    reader.page.wait_for_timeout(3500)   # its data calls finish
                    reader.page.remove_listener("response", listener)
                    out["network"] = network_read(heard, network_find)
                opened = None
                if expand:
                    opened = reader.page.evaluate(EXPAND_JS)
                    out["expanded"] = opened.get("opened", 0)
                    reader.page.wait_for_timeout(1200)
                if capture_view:
                    from _program_requirements_pilot import PAGE_JS
                    page = reader.page.evaluate(PAGE_JS)
                    out["text"], out["capture_view"] = capture_text(page), True
                    out["h1"] = page.get("h1")   # the heading a site_pages pin binds on (S720)
                    out["tab_panels"] = [[(t.get("label") or t.get("id") or "")[:60], len(t.get("text") or "")]
                                         for t in page.get("tabPanels") or []]
                    out["dropped_panels"] = dropped_panels(page)
                else:
                    page = reader.page.evaluate(TEXT_JS)
                    out["text"] = page.get("text") or ""
                out["links"] = page.get("links") or []
                if rows:
                    out["rows"] = reader.page.evaluate(ROWS_JS, rows)
                    out["rows_pattern"] = rows
                if opened and opened.get("ids"):
                    hidden = reader.page.evaluate(HIDDEN_JS, opened["ids"])
                    if hidden:
                        out["text"] += "\n[collapsed sections, read by textContent]\n" + hidden
                out["forms"] = reader.page.evaluate(FORMS_JS)
                if selects:
                    out["selects"] = reader.page.evaluate(SELECTS_JS, SELECTS_CAP)
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


def read_hand_filed_copy(college: str, url: str, pattern: re.Pattern) -> dict:
    """The college's hand-filed catalog, read as the harvest's capture reads it (S714): the file its provenance record
    (kb/hand_filed_catalogs/<slug>.json) names, fetched from its copy_url with the hand-filed-copy user agent and
    refused unless its sha256 is the record's (hand_filed in kb/_program_requirements_college.py), then pypdf's text
    (read_hand_filed). American River's catalog answers the census and page-read user agent 404 and the hand-filed
    copy agent 200 (COBIx, #3096; Sam's ruling 1 there, 2026-11-11), so a page "hand_filed": true reads the very
    bytes every American River record was extracted from, page for page, and no other address: the plan's page must
    name the record's url or copy_url."""
    import _program_requirements_college as C
    found = C.hand_filed_meta(college)
    if not found:
        return finish({"url": url, "kind": "pdf", "access": "no_hand_filed_record",
                       "error": "%s has no record under kb/hand_filed_catalogs" % college}, pattern)
    if url not in (found[1].get("url"), found[1].get("copy_url")):
        return finish({"url": url, "kind": "pdf", "access": "not_the_hand_filed_copy",
                       "error": "the page names neither the hand-filed record's url nor its copy_url"}, pattern)
    hf = C.hand_filed(college)
    pdf = C.read_hand_filed(hf)
    pages = pdf.get("pages") or []
    out = {"url": pdf.get("url"), "kind": "pdf", "status": pdf.get("status"), "access": pdf.get("access"),
           "error": pdf.get("error"), "bytes": pdf.get("bytes"), "extractor": pdf.get("extractor"),
           "pages": pages, "text": "\n\n".join(pages)}
    return finish(out, pattern)


def finish(out: dict, pattern: re.Pattern) -> dict:
    text = out.get("text") or ""
    out["chars"] = len(text)
    out["sha256"] = hashlib.sha256(text.encode("utf-8")).hexdigest()[:16] if text else None
    out["excerpts"] = excerpts(text, pattern)
    return out


def print_page(n: int, rec: dict, pattern: re.Pattern, plan: dict | None = None) -> None:
    how = "submitted from" if rec.get("submitted") else "followed from"
    print("\n##### PAGE %d · answers: %s%s" % (n, ", ".join(rec.get("answers") or []),
          (" · %s page %d" % (how, rec["from"])) if rec.get("from") else ""))
    for k in ("url", "final_url", "status", "access", "kind", "content_type", "chars",
              "sha256", "bytes", "extractor", "title", "h1", "expanded", "error"):
        if rec.get(k) not in (None, ""):
            print("%s: %s" % (k, rec[k]))
    if rec.get("links_shown"):
        print("--- links matching the plan's pattern (shown, not followed) ---")
        for f in rec["links_shown"]:
            print("- %s -> %s" % (f["text"], f["href"]))
    for f in rec.get("forms_shown") or []:
        print("--- form: %s %s ---" % ((f.get("method") or "").upper(), f.get("action")))
        for e in f.get("fields") or []:
            opts = e.get("options")
            print("  %s [%s]%s%s" % (e.get("name"), e.get("type"),
                  (" value=" + e["value"]) if e.get("value") and not opts else "",
                  (" options: " + " | ".join(opts)) if opts else ""))
    for e in rec.get("selects") or []:
        print("--- select id=%s name=%s label=%s (%d options%s) ---" % (
            e.get("id"), e.get("name"), e.get("label") or "-", e.get("total") or 0,
            ", the first %d printed" % SELECTS_CAP if (e.get("total") or 0) > SELECTS_CAP else ""))
        for v, t in e.get("options") or []:
            print("  %s = %s" % (v, t))
    sub = rec.get("submitted")
    if sub and sub.get("action"):
        print("--- form submitted: %s %s ---" % (sub.get("method"), sub.get("action")))
        print("sent: " + " & ".join(sub.get("sent") or []))
        print("button: %s · buttons on the form: %s" % (sub.get("button") or "none (no submitter)",
              " | ".join(sub.get("buttons") or []) or "none"))
    if rec.get("rows_pattern"):
        got = rec.get("rows") or []
        print("--- table rows matching %s (%d%s) ---" % (rec["rows_pattern"], len(got),
              ", the cap" if len(got) >= ROWS_CAP else ""))
        for r in got:
            links = "; ".join("%s -> %s" % (l["text"], l["href"]) for l in r.get("links") or [])
            print(" | ".join(c for c in r.get("cells") or [] if c) + ((" [" + links + "]") if links else ""))
    if "network" in rec:
        print("--- data the page's own scripts fetched (%d) ---" % len(rec["network"]))
        for r in rec["network"]:
            print("%s %s -> %s %s, %s bytes" % (r.get("method"), r.get("url"), r.get("status"),
                  r.get("content_type"), r.get("bytes")))
            if r.get("body"):
                print(fold(r["body"]))
            for f in r.get("found") or []:
                print("  -- %r at %d --" % (f["find"], f["at"]))
                print(fold(f["text"]))
            if r.get("error"):
                print("  error: " + r["error"])
    if rec.get("followed"):
        print("--- links followed ---")
        for f in rec["followed"]:
            print("- %s -> %s" % (f["text"], f["href"]))
    text = rec.get("text") or ""
    if (plan or {}).get("subject_context") and (rec.get("pages") or text):
        # A headings read (S698): nothing but the lines above each subject's first course, so a whole
        # catalog fits the 5,000 lines the GitHub MCP returns of a job log.
        print_subject_context(rec.get("pages") or [text], plan["subject_context"])
        return
    if rec.get("kind") == "pdf" and rec.get("pages"):
        plan = plan or {}
        idx = pdf_pages_to_print(rec["pages"], pattern, cap=plan_cap(plan, "pdf_page_cap", PDF_PAGE_CAP, PDF_PAGE_CAP_MAX),
                                 span=plan.get("pdf_span"), after=plan.get("pdf_after") or 0)
        print("--- %d of %d PDF pages (those naming a keyword%s) ---" % (
            len(idx), len(rec["pages"]), ", and the page after each" if plan.get("pdf_after") else ""))
        for i in idx:
            print("[pdf page %d]" % (i + 1))
            # A filing read keeps each line as the extractor split it ("pdf_unfolded"), so a course heading
            # shorter than FOLD_UNDER is not joined to the lines around it (S690).
            print(unfolded(rec["pages"][i], cap=CAPTURE_LINES_MAX) if plan.get("pdf_unfolded") else fold(rec["pages"][i]))
        return
    if not text:
        return
    if rec.get("cq_view"):
        v = rec["cq_view"]
        e = v.get("entry") or {}
        print("--- the entry, as its section lists it (%d siblings%s) ---" % (
            v.get("siblings") or 0, "" if v.get("entry_listed") else "; this node is not among them"))
        print("id %s · %s · aliaspath %s · child pages: %s · a program entry: %s · hidden: %s · title key: %s" % (
            e.get("id"), e.get("text") or "(no title)", e.get("aliaspath"),
            "yes" if e.get("haschildbodynavs") else "no (the capture reads no child page)",
            e.get("is_program"), e.get("hidden"), e.get("title_key")))
        for t in v.get("twins") or []:
            print("twin (one title key, folded by cq_distinct): id %s · %s · aliaspath %s" % (t.get("id"), t.get("text"), t.get("aliaspath")))
        print("--- lists on its page: %s ---" % (", ".join("%s (%s)" % (l.get("text") or "(no title)", l.get("id")) for l in v.get("lists") or []) or "none"))
        print("--- child pages read, in the capture's order: %s ---" % (", ".join(v.get("children") or []) or "none"))
        for m in v.get("more_programs") or []:
            print("a program entry among its children: id %s · %s" % (m.get("id"), m.get("text")))
        if v.get("parts"):
            print("--- rule B's type of the entry, whole: %s; page by page: %s ---" % (v.get("page_type"), "; ".join(
                "%s%s %s (%d characters)" % (p.get("title") or "(no title)", " [child]" if p.get("child") else "",
                                             p.get("type"), p.get("chars") or 0) for p in v["parts"])))
        if v.get("rows"):
            print("--- rows of its curriculum blocks, as their div tags nest them (%d) ---" % len(v["rows"]))
            for line in v["rows"][:CQ_ROWS_SHOWN]:
                print(line)
        print("--- the capture's text, as cq_page joins it ---")
        print(unfolded(text))
        print("--- codes the coarse net reads from it (%d) ---" % len(v.get("codes") or []))
        print(", ".join(v.get("codes") or []) or "none")
        return
    if rec.get("capture_view"):
        print("--- tab panels the capture reads (label, characters) ---")
        for label, n in rec.get("tab_panels") or []:
            print("- %s: %d" % (label or "(no label)", n))
        print("--- the capture's text, innerText+tabs, line for line ---")
        print(unfolded(text, cap=plan_cap(plan, "capture_lines", CAPTURE_LINES, CAPTURE_LINES_MAX)))
        for label, body in rec.get("dropped_panels") or []:
            print("--- a tab panel the capture leaves out: %s ---" % (label or "(no label)"))
            print(unfolded(body))
        return
    if len(text) <= HTML_FULL_CAP:
        print("--- text (whole page) ---")
        print(fold(text))
        return
    print("--- text (first %d characters of %d) ---" % (HEAD_CAP, len(text)))
    print(fold(text[:HEAD_CAP]))
    print("--- excerpts around the keywords (%d) ---" % len(rec.get("excerpts") or []))
    for e in rec.get("excerpts") or []:
        print("… " + e + " …")


def plan_delay(plan: dict, env: str | None) -> int:
    """Milliseconds between loads: the workflow's CENSUS_DELAY_MS (4 s), or the plan's own "delay_ms" where
    that is longer, never shorter. Glendale's Coursedog catalog answers a bot check under load and its reads
    go at 12 s (S646); a plan of its tabs says so (S647)."""
    base = int(env or "4000")
    try:
        own = int(plan.get("delay_ms") or 0)
    except (TypeError, ValueError):
        own = 0
    return max(base, own)


def main(argv: list[str] | None = None) -> int:
    argv = sys.argv[1:] if argv is None else argv
    if not argv:
        print(__doc__)
        return 2
    plan = json.load(open(argv[0]))
    pattern = keyword_re(plan["keywords"])
    from _program_requirements_pilot import open_reader
    delay = plan_delay(plan, os.environ.get("CENSUS_DELAY_MS"))
    pw, browser, reader = open_reader(delay)
    procedure = load_procedure(plan.get("college") or "")
    skip = skipped_hosts(procedure)
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
                host = (urllib.parse.urlparse(url).hostname or "").lower()
                if target.get("hand_filed") and not parent:
                    # The provenance record names the file and its address (read_hand_filed_copy), so the
                    # procedure's skip, which is about this reader's own user agent, does not apply.
                    rec = read_hand_filed_copy(plan.get("college") or "", url, pattern)
                elif host in skip and not target.get("retry"):
                    rec = {"url": url, "access": "skipped_by_procedure",
                           "error": "the procedure record marks %s: %s" % (host, skip[host])}
                else:
                    rec = read_one(reader, url, pattern, cache,
                                   expand=bool(target.get("expand")) and not parent,
                                   rows=None if parent else target.get("rows"),
                                   network=bool(target.get("network")) and not parent,
                                   network_hosts=tuple(h.lower() for h in target.get("network_hosts") or ()),
                                   network_find=tuple(target.get("network_find") or ()),
                                   capture_view=bool(target.get("capture_view")) and not parent,
                                   cq_catalog=int(target.get("cq_catalog") or 0) if target.get("cq_view") and not parent else 0,
                                   selects=bool(target.get("selects")) and not parent)
                rec["answers"] = target.get("answers") or []
                if parent:
                    rec["from"] = parent
                records.append(rec)
                n = len(records)
                if not parent:
                    # "links_cap" (S698): a course-descriptions index lists 90 to 130 subjects, each with its own
                    # address, and the first 40 left the rest to be guessed from the code (Cerritos /pols/, a 404).
                    rec["links_shown"] = matching_links(rec.get("links"), target.get("links"),
                                                        cap=plan_cap(target, "links_cap", LINKS_SHOWN, LINKS_SHOWN_MAX))
                    if target.get("forms"):
                        rec["forms_shown"] = rec.get("forms") or []
                    fol = follow_links(rec.get("links"), target.get("follow"),
                                       rec.get("final_url") or url, seen)
                    rec["followed"] = fol
                    queue.extend((f["href"], n) for f in fol)
                print_page(n, rec, pattern, plan)
                if parent or rec.get("access") != "ok" or rec.get("kind") != "html":
                    continue
                # Submit while the browser is still on the form's page; a second
                # spec reloads the page first (a load like any other).
                for i, spec in enumerate(submit_specs(target)):
                    if i and reader.load(url).get("access") != "ok":
                        break
                    sub = finish(submit_form(reader, spec), pattern)
                    sub["answers"], sub["from"] = rec["answers"], n
                    records.append(sub)
                    print_page(len(records), sub, pattern, plan)
                    # "then" (S736): further submits or link clicks on the page the last one reached, in order, so a
                    # lookup that opens on one action and pages by letter (LACCD's subject list, A to Z) reads whole.
                    for nxt in spec.get("then") or []:
                        if sub.get("access") != "ok":
                            break
                        sub = finish(submit_form(reader, nxt), pattern)
                        sub["answers"], sub["from"] = rec["answers"], n
                        records.append(sub)
                        print_page(len(records), sub, pattern, plan)
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
