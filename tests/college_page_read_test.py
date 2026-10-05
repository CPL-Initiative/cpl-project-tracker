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
import glob
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

print("committed plans")
plans = sorted(glob.glob(os.path.join(ROOT, "kb", "college_reads", "*.json")))
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
        check(set(p.get("answers") or []) and set(p["answers"]) <= qs,
              "%s: %s names a question the plan defines" % (name, p["url"]))
    from _program_source_census import registrable
    own = {registrable(h) for h in hosts} - OUTSIDE - set(declared)
    check(len(own - {"courseleaf.com"}) == 1,
          "%s: one college domain, plus its catalog vendor and the named outside hosts (%s)" % (name, sorted(own)))

if FAILS:
    print("\n%d FAILED" % len(FAILS))
    sys.exit(1)
print("\nall passed")
