#!/usr/bin/env python3
"""The college page read keeps to the college's own site and prints the part
of a page that answers the question.

WHY. kb/_college_page_read.py reads a named list of one college's pages from a
runner for the curated lines marked *To confirm* (first use: the Cerritos
Ironworker ladder, S329). Its output is a job log a session reads back, so two
pure pieces decide whether the read is worth reading:

  * follow_links reads one level deeper from a page. A link off the college's
    registrable domain (a vendor, a news site, a social account) must never be
    followed, nor a page already read, nor more than the cap.
  * excerpts and pdf_pages_to_print choose what reaches the log from a long
    page or PDF. Overlapping windows merge, so one paragraph naming three
    keywords prints once; a PDF prints the pages naming a keyword, and its
    first page when none does.

Also pinned: every page in each committed plan is an https address (or http on
a host the plan names with its reason) on a host the plan's college owns or a
named outside host, and names a question the plan defines; a form a plan
submits posts to the page's own site. Run from repo root: python3 tests/college_page_read_test.py
"""
import contextlib
import glob
import io
import json
import os
import re
import sys
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _college_page_read as cpr  # noqa: E402

FAILS = []


def check(cond, msg):
    print(("  ok  " if cond else "  FAIL ") + msg)
    if not cond:
        FAILS.append(msg)


base = "https://www.cerritos.edu/academics/aed/apprenticeship-programs/Field_Ironwork.htm"
links = [
    {"text": "Field Ironworker Supervision (B.S.)", "href": "https://www.cerritos.edu/baccalaureate/ironworker.htm#top"},
    {"text": "Bachelor's degrees", "href": "https://www.cerritos.edu/baccalaureate/ironworker.htm"},
    {"text": "Ironworkers Local 433", "href": "https://www.ironworkers433.org/"},
    {"text": "Catalog", "href": "https://cerritos-public.courseleaf.com/field-ironworkers-aa/"},
    {"text": "Flyer", "href": "https://www.cerritos.edu/aed/_includes/docs/Flyer_ua.pdf"},
    {"text": "Email us", "href": "mailto:aed@cerritos.edu"},
    {"text": "Bachelor news", "href": "https://www.facebook.com/cerritoscollege/bachelor"},
]
got = cpr.follow_links(links, r"bachelor|baccalaureate|supervis|local 4|\.pdf", base, set())
hrefs = [g["href"] for g in got]
print("follow_links")
check(hrefs[0] == "https://www.cerritos.edu/baccalaureate/ironworker.htm",
      "a fragment is dropped, and the same page is not queued twice")
check(hrefs.count("https://www.cerritos.edu/baccalaureate/ironworker.htm") == 1,
      "one address, one read")
check("https://www.ironworkers433.org/" not in hrefs, "an outside host is never followed")
check(not any("facebook" in h for h in hrefs), "a social account is never followed")
check(not any(h.startswith("mailto") for h in hrefs), "a mail link is never followed")
check("https://www.cerritos.edu/aed/_includes/docs/Flyer_ua.pdf" in hrefs,
      "a same-site PDF named by the pattern is followed")
check(cpr.follow_links(links, None, base, set()) == [], "no pattern, no follow")
check(cpr.follow_links(links, r".", base, set(), cap=1) and
      len(cpr.follow_links(links, r".", base, set(), cap=1)) == 1, "the cap holds")
check(cpr.follow_links(links, r"bachelor", base,
                       {"https://www.cerritos.edu/baccalaureate/ironworker.htm"}) == [],
      "a page already read is not read again")
check(cpr.same_site("https://hsarticulation.cerritos.edu/About", base),
      "a subdomain of the college's own domain is its own site")

print("excerpts")
pat = cpr.keyword_re(["ironwork", "bachelor", r"B\.S\."])
text = ("x" * 2000) + " The Field Ironworker Supervision bachelor program, a B.S., opens " + ("y" * 2000) + " ironworkers " + ("z" * 50)
ex = cpr.excerpts(text, pat, radius=100)
check(len(ex) == 2, "three hits in one paragraph merge into one window; a far hit is its own (%d)" % len(ex))
check("bachelor" in ex[0] and "B.S." in ex[0], "the merged window keeps every hit")
check(cpr.excerpts("", pat) == [], "an empty page has no excerpts")
check(len(cpr.excerpts(" ironwork ".join(["a" * 900] * 40), pat, radius=50, cap=5)) == 5,
      "the excerpt cap holds")

print("pdf_pages_to_print")
check(cpr.pdf_pages_to_print(["cover", "welding only", "Ironworker A.S."], pat) == [2],
      "only the pages naming a keyword")
check(cpr.pdf_pages_to_print(["cover", "nothing"], pat) == [0], "the first page when none hits")
check(cpr.pdf_pages_to_print([], pat) == [], "an empty PDF prints nothing")
check(cpr.pdf_pages_to_print(["Ironworker", "x", "Ironworker", "y", "z"], pat, span=[3, 5]) == [2],
      "pdf_span keeps the search to the pages named")
check(cpr.pdf_pages_to_print(["Ironworker", "x", "Ironworker", "y", "z"], pat, after=1) == [0, 1, 2, 3],
      "pdf_after prints the page after each hit, once")
check(cpr.pdf_pages_to_print(["x", "y", "Ironworker"], pat, after=2) == [2],
      "pdf_after stops at the catalog's end")
check(cpr.is_pdf("https://x.edu/a/Roadmap_ua.PDF") and cpr.is_pdf("https://x.edu/view", "application/pdf; q=1")
      and not cpr.is_pdf("https://x.edu/page.htm", "text/html"), "a PDF by address or by type")

print("fold")
folded = cpr.fold("Home\nAbout\n\nIWAP 40.07\tFIW-Orientation\t4.0\n" + "A long sentence that runs well past the fold width of forty-five characters.\nZulu")
check(folded.split("\n")[0] == "Home · About · IWAP 40.07\tFIW-Orientation\t4.0",
      "a run of short lines folds into one, in order, blank lines dropped")
check(folded.split("\n")[1].startswith("A long sentence") and folded.split("\n")[2] == "Zulu",
      "a long line stays its own line; a trailing short run is kept")
check(cpr.fold("") == "", "an empty page folds to nothing")
langs = "\n".join(["Abkhaz", "Acehnese", "Acholi"] * 80)
check(cpr.fold(langs).count("\n") == 0, "a 240-entry language picker is one line, not 240")

print("matching_links")
ml = cpr.matching_links(links + [{"text": "Statewide Career Pathways", "href": "https://www.example.org/pathways#x"}],
                        r"statewide|local 4")
check([m["href"] for m in ml] == ["https://www.ironworkers433.org/", "https://www.example.org/pathways"],
      "links on any host are shown when they match, fragment dropped, in page order")
check(cpr.matching_links(links, None) == [], "no pattern, nothing shown")
many = [{"text": "Subject %d" % i, "href": "https://catalog.example.edu/course-descriptions/s%d/" % i} for i in range(130)]
check(len(cpr.matching_links(many, r"/course-descriptions/")) == cpr.LINKS_SHOWN, "40 matching links print by default")
check(len(cpr.matching_links(many, r"/course-descriptions/", cap=cpr.plan_cap({"links_cap": 300}, "links_cap", cpr.LINKS_SHOWN, cpr.LINKS_SHOWN_MAX))) == 130,
      "a plan's links_cap prints every subject an index lists")
check(cpr.plan_cap({"links_cap": 99999}, "links_cap", cpr.LINKS_SHOWN, cpr.LINKS_SHOWN_MAX) == cpr.LINKS_SHOWN_MAX, "links_cap has a ceiling")

print("skipped_hosts")
proc = {"hosts": [{"host": "hsarticulation.cerritos.edu", "access": "unreached", "note": "no DNS record"},
                  {"host": "www.cerritos.edu", "access": "open"},
                  {"host": "Mapper.Example.edu", "access": "refused"},
                  {"host": "www.statewidepathways.org", "access": "gone", "note": "a parked domain"}]}
sk = cpr.skipped_hosts(proc)
check(set(sk) == {"hsarticulation.cerritos.edu", "mapper.example.edu", "www.statewidepathways.org"},
      "a host the record marks unreached, refused or gone is left alone; an open one is read")
check(sk["mapper.example.edu"] == "refused", "a host with no note carries its access word")
check(cpr.skipped_hosts(None) == {} and cpr.skipped_hosts({}) == {}, "no record, nothing skipped")

print("submit_specs")
check(cpr.submit_specs({}) == [] and cpr.submit_specs({"submit": None}) == [], "no submit, no form step")
one = {"action": "courses.cgi", "set": {"Depts": ["AED"]}}
check(cpr.submit_specs({"submit": one}) == [one], "one spec becomes a list of one")
check(cpr.submit_specs({"submit": [one, one]}) == [one, one], "several specs keep their order")

print("expand")
# A collapsed section is opened by a click; a click on a link to another address
# would be a load the plan never named, outside robots.txt and the delay.
check("startsWith('#')" in cpr.EXPAND_JS and "b.tagName !== 'A'" in cpr.EXPAND_JS,
      "expand clicks a link only when it points inside the page")
check("getClientRects().length === 0" in cpr.HIDDEN_JS,
      "a panel still not shown after its click is read by textContent")

print("rows")
check("tr.querySelector('tr')" in cpr.ROWS_JS and "%d" not in cpr.ROWS_JS,
      "rows skips a layout row that wraps a whole table, and carries its cap")

print("committed plans")
print("cq_view_ids")
check(cpr.cq_view_ids("https://bcc.curriqunet.com/catalog/iq/39711/39966/40048") == (39966, 40048),
      "an entry's iq address gives (section, node)")
check(cpr.cq_view_ids("https://bcc.curriqunet.com/Catalog/_getPage?catalogId=10327&id=40048") is None,
      "a JSON call's address names no entry")

plans = sorted(glob.glob(os.path.join(ROOT, "kb", "college_reads", "*.json")))
# ── a headings read (S698, #3655): the lines above each subject's first course ──
print("subject_context")
HEAD = r"^(?P<subj>[A-Z][A-Z &.]{0,11}?) (?P<num>\d{3}[A-Z]{0,3}) (?P<title>[A-Z].*)$"
PAGES = ["front matter\nnothing here",
         "ACCOUNTING\n(See also Business)\nACCTG 001 INTRODUCTORY ACCOUNTING I\n5 UNITS\nA description.\nACCTG 002 INTRODUCTORY ACCOUNTING II\n",
         "Still accounting text\n\nADMINISTRATION OF JUSTICE\nADM JUS 001 INTRODUCTION TO ADMINISTRATION OF JUSTICE\n3 UNITS\n",
         "ACCTG 021 BOOKKEEPING\nMathematics (MATH & STAT)\nMATH 105 ARITHMETIC\n"]
sc = cpr.subject_context(PAGES, HEAD, before=4)
check([g["subj"] for g in sc] == ["ACCTG", "ADM JUS", "MATH"], "one entry per subject code, in page order (%s)" % [g["subj"] for g in sc])
check(sc[0]["before"] == ["front matter", "nothing here", "ACCOUNTING", "(See also Business)"] and sc[0]["page"] == 2,
      "the lines above the first course are kept as printed, across the page break (%s)" % sc[0])
check(sc[1]["before"] == ["5 UNITS", "A description.", "Still accounting text", "ADMINISTRATION OF JUSTICE"][-4:] or
      sc[1]["before"][-1] == "ADMINISTRATION OF JUSTICE", "the heading right above the first course is the last line kept")
check(sc[1]["before"][0] != "ACCTG 002 INTRODUCTORY ACCOUNTING II" and "ACCTG 002 INTRODUCTORY ACCOUNTING II" not in sc[1]["before"],
      "a course line is never kept as context: the lines stop at the course before")
check(sc[2]["before"] == ["Mathematics (MATH & STAT)"], "a later course of a code already seen resets the lines (%s)" % sc[2]["before"])
check(cpr.subject_context(PAGES, HEAD, start_page=3)[0]["subj"] == "ADM JUS", "start_page skips the front of the catalog")
check(len(cpr.subject_context(PAGES, HEAD, before=99)[0]["before"]) <= cpr.SUBJECT_CONTEXT_BEFORE_MAX, "the lines kept are capped")
front = ["Honors list\nACCTG 001 INTRODUCTORY ACCOUNTING I\nMATH 105 ARITHMETIC\nmore front matter"] + PAGES
check(cpr.subject_context(front, HEAD)[0]["before"] == ["Honors list"], "with no units pattern the first mention opens the subject")
uc = cpr.subject_context(front, HEAD, units=r"^\d+ UNITS?$", within=2)
check([g["subj"] for g in uc] == ["ACCTG", "ADM JUS"] and uc[0]["page"] == 3 and uc[0]["before"][-2:] == ["ACCOUNTING", "(See also Business)"],
      "with the file's units pattern a code named ahead of the course descriptions opens no subject (%s)" % uc)
check([g["subj"] for g in cpr.subject_context(["Math\nMATH 105 ARITHMETIC (3) UC:CSU\n"], r"^(?P<subj>[A-Z]+) (?P<num>\d{3}) (?P<title>.*)$",
                                              units_inline=r"\(\d+\)")] == ["MATH"], "units carried on the heading line count")
check(cpr.subject_context([], HEAD) == [] and cpr.subject_context([""], HEAD) == [], "an empty catalog gives nothing")
buf = io.StringIO()
with contextlib.redirect_stdout(buf):
    cpr.print_page(1, {"url": "https://x.edu/c.pdf", "kind": "pdf", "pages": PAGES, "text": "\n\n".join(PAGES), "answers": ["h"]},
                   re.compile("UNITS"), {"subject_context": {"heading": HEAD, "before": 2}})
printed = buf.getvalue()
check("(3 subjects)" in printed and "[subject ADM JUS · page 3]" in printed and "  | ADMINISTRATION OF JUSTICE" in printed
      and "[pdf page" not in printed, "a headings read prints the context and no whole page")
for path in sorted(glob.glob(os.path.join(ROOT, "kb", "college_reads", "*_subject_headings.json"))):
    sp = json.load(open(path)).get("subject_context") or {}
    check("(?P<subj>" in (sp.get("heading") or "") and re.compile(sp["heading"]) and 1 <= int(sp.get("before") or 0) <= cpr.SUBJECT_CONTEXT_BEFORE_MAX,
          "%s names a course-heading pattern with a subj group" % os.path.basename(path))

check(len(plans) >= 1, "at least one plan is committed")
OUTSIDE = {"regionalcte.org"}   # the regional program record, named on purpose
for path in plans:
    plan = json.load(open(path))
    name = os.path.basename(path)
    declared = plan.get("outside_hosts") or {}
    check(all(isinstance(v, str) and len(v) > 20 for v in declared.values()),
          "%s: every outside host the plan names carries its reason" % name)
    qs = set(plan.get("questions") or {})
    cpr.keyword_re(plan["keywords"])   # every keyword compiles
    hosts = set()
    for p in plan["pages"]:
        u = urllib.parse.urlparse(p["url"])
        hosts.add(u.hostname)
        http_ok = (plan.get("http_hosts") or {}).get(u.hostname)
        check(u.scheme == "https" or (u.scheme == "http" and isinstance(http_ok, str) and len(http_ok) > 20),
              "%s: %s is https, or http on a host the plan names with its reason" % (name, p["url"]))
        for spec in cpr.submit_specs(p):
            sets = spec.get("set") or {}
            check(isinstance(spec.get("action"), str) and spec["action"] and sets and
                  all(isinstance(v, list) and all(isinstance(x, str) for x in v) for v in sets.values()),
                  "%s: %s submits a named form with each field's values as a list" % (name, p["url"]))
            target = urllib.parse.urljoin(p["url"], spec["action"])
            check(cpr.same_site(target, p["url"]),
                  "%s: the form posts to the page's own site (%s)" % (name, target))
            if spec.get("button"):
                re.compile(spec["button"])
        if p.get("rows") is not None:
            check(isinstance(p["rows"], str) and p["rows"] and re.compile(p["rows"]),
                  "%s: %s names its rows pattern as a regex" % (name, p["url"]))
        check(isinstance(p.get("expand", False), bool),
              "%s: %s names expand as true or false" % (name, p["url"]))
        check(set(p.get("answers") or []) and set(p["answers"]) <= qs,
              "%s: %s names a question the plan defines" % (name, p["url"]))
    from _program_source_census import registrable
    own = {registrable(h) for h in hosts} - OUTSIDE - set(declared)
    # A plan reads one college's own domain, or only named outside hosts on that
    # college's behalf (read 10: the archive's copy of a statewide list), or only
    # that college's catalog on its vendor's host (read 13: two course-description
    # pages on cerritos-public.courseleaf.com, one subdomain).
    catalog_only = own == {"courseleaf.com"} and len(
        {h.split(".")[0] for h in hosts if registrable(h) == "courseleaf.com"}) == 1
    check(len(own - {"courseleaf.com"}) == 1 or (not own and declared) or catalog_only,
          "%s: one college domain, plus its catalog vendor and the named outside hosts (%s)" % (name, sorted(own)))

# ── a page's own data calls (S357, "network": true) ──────────────────────────
print("network")
page_url = "https://rccd.curriqunet.com/catalog/alias/rcc-catalog/iq/5852/6117"
check(cpr.network_kept("https://rccd.curriqunet.com/Catalog/GetOutline?id=1", "xhr", page_url),
      "a data call to the page's own host is kept")
check(not cpr.network_kept("https://www.google-analytics.com/collect", "fetch", page_url),
      "a call to another host is never kept")
check(not cpr.network_kept("https://rccd.curriqunet.com/Content/site.css", "stylesheet", page_url),
      "a stylesheet or image is not a data call")
# S411: Merced's Coursedog catalog (catalog.mccd.edu) fetches its PDF from app.coursedog.com.
mc_url, mc_pdf = "https://catalog.mccd.edu/programs", "https://app.coursedog.com/api/v1/ca/pdf-reports/catalogs/x"
check(cpr.network_kept(mc_pdf, "fetch", mc_url, ("app.coursedog.com",))
      and not cpr.network_kept(mc_pdf, "fetch", mc_url)
      and not cpr.network_kept("https://cdn.coursedog.com/a.json", "fetch", mc_url, ("app.coursedog.com",))
      and not cpr.network_kept("https://app.coursedog.com/logo.png", "image", mc_url, ("app.coursedog.com",)),
      "a vendor host the plan names is kept, only its data calls, and no other host of the vendor's")
for path in plans:
    name, plan = os.path.basename(path), json.load(open(path))
    for p in plan["pages"]:
        for h in p.get("network_hosts") or []:
            from _program_source_census import registrable
            check({h.lower(), registrable(h.lower())} & {x.lower() for x in plan.get("outside_hosts") or {}},
                  "%s: a network host (%s) is one the plan names with its reason" % (name, h))


class _Req:
    def __init__(self, rt, method="GET"):
        self.resource_type, self.method = rt, method


class _Resp:
    def __init__(self, url, rt, body, status=200, fail=False):
        self.url, self.request, self.status = url, _Req(rt), status
        self.headers, self._body, self._fail = {"content-type": "application/json"}, body, fail

    def text(self):
        if self._fail:
            raise RuntimeError("body gone\nsecond line")
        return self._body


class _Page:
    def __init__(self):
        self.handlers = {}

    def on(self, ev, fn):
        self.handlers[ev] = fn

    def remove_listener(self, ev, fn):
        if self.handlers.get(ev) is fn:
            del self.handlers[ev]


pg = _Page()
heard, fn = cpr.network_listen(pg, page_url)
for i in range(cpr.NETWORK_CAP + 5):
    pg.handlers["response"](_Resp("https://rccd.curriqunet.com/api/%d" % i, "xhr", "x" * 4000))
pg.handlers["response"](_Resp("https://cdn.example.com/a.json", "fetch", "{}"))
pg.remove_listener("response", fn)
check(len(heard) == cpr.NETWORK_CAP and "response" not in pg.handlers,
      "at most NETWORK_CAP responses are kept, and the listener comes off after the load")
read = cpr.network_read(heard[:1] + [_Resp("https://rccd.curriqunet.com/x", "xhr", "", fail=True)])
check(read[0]["bytes"] == 4000 and len(read[0]["body"]) == cpr.NETWORK_BODY,
      "a body prints its opening and reports its whole length")
check(read[1]["error"] == "body gone", "an unreadable body is reported, never raised")

print("capture view")
# S445: the capture's text for one page, innerText then its hidden tab panels, printed so a
# blank line between two short heading lines stays visible (section_award() needs them adjacent).
got = {"body": "Horticulture\n\nOverview text",
       "tabPanels": [{"label": "Degrees and Certificates", "text": "Certificate of Achievement\nLandscape Architecture\nHORT 100\tIntro\t3"},
                     {"label": "Search", "text": "Search the catalog for anything at all"}]}
ct = cpr.capture_text(got)
check(ct.startswith("Horticulture\n\nOverview text\n\n[Tab: Degrees and Certificates]\nCertificate of Achievement")
      and "Search the catalog" not in ct,
      "the capture view is the visible text with the course-bearing tab panels appended, as best_text reads it")
check(cpr.unfolded("A\n\n\n  \nB\nC") == "A\n(blank)\nB\nC",
      "a run of blank lines prints once as (blank), short lines stay one a line")
check(cpr.unfolded("\n".join("x%d" % i for i in range(5)), cap=3).endswith("x2\n(2 more lines)"),
      "a long page prints its first CAPTURE_LINES lines and says how many it left")
# A filing read (S690, NOCE's Kids College page past 1,400 lines) raises the caps from its plan, within ceilings.
check(cpr.plan_cap({}, "capture_lines", cpr.CAPTURE_LINES, cpr.CAPTURE_LINES_MAX) == cpr.CAPTURE_LINES,
      "a plan that names no cap keeps the default")
check(cpr.plan_cap({"capture_lines": 5000}, "capture_lines", cpr.CAPTURE_LINES, cpr.CAPTURE_LINES_MAX) == 5000,
      "a plan raises the capture view's line cap")
check(cpr.plan_cap({"capture_lines": 10}, "capture_lines", cpr.CAPTURE_LINES, cpr.CAPTURE_LINES_MAX) == cpr.CAPTURE_LINES,
      "a plan never lowers a cap")
check(cpr.plan_cap({"pdf_page_cap": 10 ** 6}, "pdf_page_cap", cpr.PDF_PAGE_CAP, cpr.PDF_PAGE_CAP_MAX) == cpr.PDF_PAGE_CAP_MAX,
      "a plan never passes the ceiling")
check(cpr.plan_cap({"pdf_page_cap": "x"}, "pdf_page_cap", cpr.PDF_PAGE_CAP, cpr.PDF_PAGE_CAP_MAX) == cpr.PDF_PAGE_CAP,
      "a cap that is not a number keeps the default")
_many = ["Ironworker %d" % i for i in range(30)]
check(len(cpr.pdf_pages_to_print(_many, pat)) == cpr.PDF_PAGE_CAP
      and len(cpr.pdf_pages_to_print(_many, pat, cap=cpr.plan_cap({"pdf_page_cap": 30}, "pdf_page_cap",
                                                                  cpr.PDF_PAGE_CAP, cpr.PDF_PAGE_CAP_MAX))) == 30,
      "a raised PDF page cap prints every page that names a keyword")
_lines = "\n".join("x%d" % i for i in range(1500))
_buf = io.StringIO()
with contextlib.redirect_stdout(_buf):
    cpr.print_page(1, {"url": "https://x.edu/kids/", "kind": "html", "capture_view": True, "text": _lines},
                   pat, {"capture_lines": 2000})
check("x1499" in _buf.getvalue() and "more lines" not in _buf.getvalue(),
      "print_page prints a capture view whole under the plan's raised cap")
_buf = io.StringIO()
with contextlib.redirect_stdout(_buf):
    cpr.print_page(1, {"url": "https://x.edu/kids/", "kind": "html", "capture_view": True, "text": _lines}, pat, {})
check("(100 more lines)" in _buf.getvalue(), "print_page keeps the default cap for a plan that names none")
_pdf = {"url": "https://x.edu/catalog.pdf", "kind": "pdf", "pages": ["Ironworker\nACCT 1\nAccounting I\n3 Units"]}
_buf = io.StringIO()
with contextlib.redirect_stdout(_buf):
    cpr.print_page(1, _pdf, pat, {"pdf_unfolded": True})
check("ACCT 1\nAccounting I\n3 Units" in _buf.getvalue(), "pdf_unfolded prints a PDF page line for line")
_buf = io.StringIO()
with contextlib.redirect_stdout(_buf):
    cpr.print_page(1, _pdf, pat, {})
check("ACCT 1 · Accounting I · 3 Units" in _buf.getvalue(), "a plan without pdf_unfolded keeps the folded PDF print")
dp = cpr.dropped_panels(got)
check([d[0] for d in dp] == ["Search"] and dp[0][1].startswith("Search the catalog"),
      "the capture view lists each tab panel the capture leaves out, with its text")

# ── network_find (S484): the stretch of a long body around each string the plan names ──
body = "x" * 3000 + '"code":"ENGM 622","lectureHours":{"min":108}' + "y" * 3000 + '"lectureHours":0'
found = cpr.network_find(body, ("lectureHours", "absent"))
check([f["find"] for f in found] == ["lectureHours", "lectureHours"]
      and "ENGM 622" in found[0]["text"] and len(found[0]["text"]) <= 2 * cpr.NETWORK_FIND_SPAN + len("lectureHours"),
      "network_find prints each place a named string occurs, with the stretch around it, past NETWORK_BODY")
check(len(cpr.network_find("ab" * 50, ("ab",))) == cpr.NETWORK_FIND_CAP,
      "network_find stops at NETWORK_FIND_CAP places a string")

# ── plan_delay (S647): a plan may slow its read, never speed it ──
check(cpr.plan_delay({}, None) == 4000 and cpr.plan_delay({}, "4000") == 4000,
      "a plan naming no delay reads at the workflow's 4 s")
check(cpr.plan_delay({"delay_ms": 12000}, "4000") == 12000,
      "Glendale's tab read names 12 s and reads at 12 s")
check(cpr.plan_delay({"delay_ms": 500}, "4000") == 4000 and cpr.plan_delay({"delay_ms": "x"}, "4000") == 4000,
      "a plan never reads faster than the workflow's delay, and a delay that is no number is ignored")

if FAILS:
    print("\n%d FAILED" % len(FAILS))
    sys.exit(1)
print("\nall passed")
