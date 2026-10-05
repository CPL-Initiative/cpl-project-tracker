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


# A plan's page may submit one of its forms (read 4: Schedule+ lists a term's
# sections for the departments ticked on its form). The spec names the form by
# the end of its action, the fields to set (each name maps to the values that
# end up checked or selected; every other box of that name is cleared), and
# optionally a pattern for the submit button's name or words. Fields it does not
# name keep the page's defaults. The reader prints what it sent.
SUBMIT_PREP_JS = """(spec) => {
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
                       cap: int = PDF_PAGE_CAP) -> list[int]:
    """Page indexes with a keyword hit, in order; the first page when none hit."""
    hit = [i for i, p in enumerate(pages) if pattern.search(p or "")]
    return (hit or ([0] if pages else []))[:cap]


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
# <details> and clicks every collapsed toggle that stays on the page (a button,
# or a link to a fragment), then reads. A panel still not shown after its click
# is read by textContent. Never a link to another address: that would be a load.
EXPAND_JS = """() => {
  const root = document.querySelector('main, [role=main], #main-content, #main, #content') || document.body;
  let opened = 0;
  root.querySelectorAll('details:not([open])').forEach(d => { d.open = true; opened++; });
  const toggles = Array.from(root.querySelectorAll(
    'button[aria-expanded="false"], [role=button][aria-expanded="false"], a[aria-expanded="false"], [data-toggle=collapse], [data-bs-toggle=collapse]'))
    .filter(b => b.tagName !== 'A' || (b.getAttribute('href') || '#').startsWith('#')).slice(0, 40);
  toggles.forEach(b => { try { b.click(); opened++; } catch (e) {} });
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


def read_one(reader, url: str, pattern: re.Pattern, cache: dict, expand: bool = False,
             rows: str | None = None) -> dict:
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
                opened = None
                if expand:
                    opened = reader.page.evaluate(EXPAND_JS)
                    out["expanded"] = opened.get("opened", 0)
                    reader.page.wait_for_timeout(1200)
                page = reader.page.evaluate(TEXT_JS)
                out["text"], out["links"] = page.get("text") or "", page.get("links") or []
                if rows:
                    out["rows"] = reader.page.evaluate(ROWS_JS, rows)
                    out["rows_pattern"] = rows
                if opened and opened.get("ids"):
                    hidden = reader.page.evaluate(HIDDEN_JS, opened["ids"])
                    if hidden:
                        out["text"] += "\n[collapsed sections, read by textContent]\n" + hidden
                out["forms"] = reader.page.evaluate(FORMS_JS)
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
    how = "submitted from" if rec.get("submitted") else "followed from"
    print("\n##### PAGE %d · answers: %s%s" % (n, ", ".join(rec.get("answers") or []),
          (" · %s page %d" % (how, rec["from"])) if rec.get("from") else ""))
    for k in ("url", "final_url", "status", "access", "kind", "content_type", "chars",
              "sha256", "bytes", "extractor", "title", "expanded", "error"):
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
            print(fold(rec["pages"][i]))
        return
    if not text:
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
                if host in skip and not target.get("retry"):
                    rec = {"url": url, "access": "skipped_by_procedure",
                           "error": "the procedure record marks %s: %s" % (host, skip[host])}
                else:
                    rec = read_one(reader, url, pattern, cache,
                                   expand=bool(target.get("expand")) and not parent,
                                   rows=None if parent else target.get("rows"))
                rec["answers"] = target.get("answers") or []
                if parent:
                    rec["from"] = parent
                records.append(rec)
                n = len(records)
                if not parent:
                    rec["links_shown"] = matching_links(rec.get("links"), target.get("links"))
                    if target.get("forms"):
                        rec["forms_shown"] = rec.get("forms") or []
                    fol = follow_links(rec.get("links"), target.get("follow"),
                                       rec.get("final_url") or url, seen)
                    rec["followed"] = fol
                    queue.extend((f["href"], n) for f in fol)
                print_page(n, rec, pattern)
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
                    print_page(len(records), sub, pattern)
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
