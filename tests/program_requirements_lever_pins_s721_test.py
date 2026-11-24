#!/usr/bin/env python3
"""S721's pins: the reader_page_assignment lever at Antelope Valley, Redwoods, MiraCosta and Saddleback.

    python3 tests/program_requirements_lever_pins_s721_test.py

WHY. The gap census (run 45371224551) filed 27 programs at four colleges whose extraction placed none of the state's
listed courses. Antelope Valley's and Redwoods' eLumen catalogs and Saddleback's curriQunet catalog are not on the
sitemap road, where S720's site_pages pins were the only ones loaded, and Redwoods heads a degree page with its title
alone over its award line, which S720's heading test refused. S721 loads the pins on both roads and binds such a
heading through site_award_subheading (kb/_program_requirements_college.py).

  1. The capture loads site_pages on the curriQunet and eLumen roads too (a source check: the capture needs a browser).
  2. Antelope Valley's 8 pins bind on their own pages as page read 45381304038 printed them, never on the page the
     filed record was read from, at the accept share; a pin to the sister award's page ('Title Cert' for a degree) is
     refused on its heading. Every program here is marked (RC.MARK), as the capture marks each whose record places
     none, so rules B, C and A run: AVC's degree pages print their GE map ("Any AVC GE Area 2"), rule B reads them as
     general-education pages, and a pin whose heading names its program passes that check (RC.PIN_HEADING) while the
     same page unpinned is refused (S721 second reader, round 1, finding 1). A pin to a course-descriptions page is
     still refused, its reason naming rule B. 20184 needs no pin: capture 45133183717 reads it from its own page.
  3. Redwoods' 3 pins bind on the pages page read 45381629186 printed; Automotive Technology A.S. 01816 binds through
     the award line under its heading; a degree pinned to its sister certificate's page and a certificate pinned to its
     A.S. page (13559, the catalog's only Early Childhood page) are refused.
  4. site_award_line reads a line that prints the award and nothing else, and never a line that names a program.
  5. The rule's self-recall on Redwoods' 71 filed pages (page read in the fixture): every program filed alone on its own
     page with a record that places its courses binds there, and no program binds on another program's page.
  6. The lever's members, pinned here (p-test-pins-census-members-s714), are each a pin, a named gap
     (named_gaps_s721.json, a defined reason, never pinned), a forced re-read, or a program the capture already reads
     from its own page, once.
The pages are in tests/fixtures/program_requirements_lever_pins_s721.json.gz. Pure stdlib.
"""
import gzip
import inspect
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_requirements_college as C  # noqa: E402

FAILS = []
N = [0]


def check(ok, what):
    N[0] += 1
    print(("ok   " if ok else "FAIL ") + what)
    if not ok:
        FAILS.append(what)


FIX = json.load(gzip.open(os.path.join(ROOT, "tests", "fixtures", "program_requirements_lever_pins_s721.json.gz"),
                          "rt", encoding="utf-8"))

# The census lever's members (run 45371224551), never read from the live census.
LEVER = {
    "Antelope Valley College": ("antelope_valley", "02145 02149 02153 11647 11648 12161 14414 15404 20184 35818"),
    "Saddleback College": ("saddleback", "04054 22844 22895 22896 22897 36224 36225"),
    "College of the Redwoods": ("college_of_the_redwoods", "01816 13559 22666 30811 42928"),
    "MiraCosta College": ("miracosta", "07863 15183 22006 36144 36171"),
}
FORCED = {"MiraCosta College": {"07863"}}
CAPTURED = {"Antelope Valley College": {"20184"}}   # capture 45133183717's would_extract reads it from its own page


def page(url, h1, body):
    got = {"url": url, "final_url": url, "title": h1, "h1": h1, "body": body, "content": body, "links": []}
    return {"url": url, "title": h1, "h1": h1, "body": body, "content": body, "got": got, "codes": C.page_net(got)}


def prog(cn, p, marked=True):
    # The capture marks each lever member (RC.mark: its committed record places none), so rules B, C and A apply.
    return {"control_number": cn, "title": p["title"], "award": p["award"], "shape": "x", "status": "Active",
            "closed_list": [{"code": c} for c in p["codes"]], "load_id": "1", C.RC.MARK: marked}


# ── 1. the capture loads the pins on every road ─────────────────────────────────────────────────
src = inspect.getsource(C.capture)
cq = src.split('if platform == "curriqunet":', 1)[1].split('elif platform == "elumen":', 1)
el = cq[1].split('elif platform == "coursedog":', 1)[0]
check("site_pins = site_pin_entries(college)" in cq[0] and "site_pins = site_pin_entries(college)" in el,
      "1 the curriQunet and eLumen roads load the college's site_pages pins")
check('urls += [pin["url"]' in el, "1 the rendered eLumen road queues each pin's page, as the sitemap road does")
check("site_pinned(programs, pages, site_pins)" in src, "1 the pins bind through site_pinned() after assign()")

# ── 2 and 3. each college's pins on its pages ───────────────────────────────────────────────────
for college, want_sub in (("Antelope Valley College", set()), ("College of the Redwoods", {"01816", "42928"})):
    part = FIX["colleges"][college]
    pins = C.site_pin_entries(college)
    pages = [page(u, p["h1"], p["text"]) for u, p in part["pages"].items()]
    progs = [prog(cn, p) for cn, p in part["programs"].items()]
    check(set(pins) == set(part["programs"]), "2 %s pins the fixture's %d programs (%s)" % (college, len(pins), sorted(pins)))
    got = C.site_pinned(progs, pages, pins)
    bad = []
    for cn, p in sorted(part["programs"].items()):
        b = (got.get(cn) or {}).get("best") or {}
        if not b or b["coverage"] < C.P.ACCEPT_SHARE or b["url"] == p["filed_url"] or b["url"] != pins[cn]["url"]:
            bad.append("%s %s cov %s" % (cn, (got.get(cn) or {}).get("why", ""), b.get("coverage")))
    check(not bad, "2 each of %s's %d pins binds on its own page, never the filed one, at the accept share (%s)"
          % (college, len(pins), bad))
    by_url = {pg["url"]: pg for pg in pages}
    # Rule B: the pinned pages a general-education page to the rules, refused unpinned, bound pinned.
    ge = sorted(cn for cn in pins if C.RC.page_type(by_url[pins[cn]["url"]]["body"]) == "ge")
    unpinned = sorted(cn for cn in ge if C.candidates(prog(cn, part["programs"][cn]), [by_url[pins[cn]["url"]]],
                                                      progs, {}))
    check(not unpinned and (college != "Antelope Valley College" or len(ge) >= 6),
          "2 %s: %d pinned pages read as general-education pages to rule B (%s); unpinned, none is a candidate (%s), "
          "pinned, each binds" % (college, len(ge), ge, unpinned))
    sub = {cn for cn, p in part["programs"].items()
           if not C.RC.heading_line([by_url[pins[cn]["url"]]["h1"]], p["title"], p["award"]) >= 0}
    check(sub == want_sub, "3 %s: the pins that bind through the award line under the heading are %s (%s)"
          % (college, sorted(want_sub), sorted(sub)))
    for cn, wrong, what in part["refusals"]:
        p = part["programs"].get(cn) or part["others"][cn]
        r = C.site_pinned([prog(cn, p)], pages, {cn: {"url": wrong}}).get(cn) or {}
        check("best" not in r and "heading" in (r.get("why") or ""),
              "2 %s %s pinned to %s is refused on its heading (%s)" % (college, cn, what, r.get("why")))

# A pin never lifts rule B's course-descriptions check, and its refusal names the rule.
avc = FIX["colleges"]["Antelope Valley College"]
cn0, p0 = "02145", avc["programs"]["02145"]
desc_body = "Computer Applications AS\n" + "".join(
    "%s - Course %d\nUnits: 3\nLecture Hours: 54\nPrerequisite: None\nTransfer: CSU\nAdvisory: None\n" % (c, k)
    for k, c in enumerate(p0["codes"] * 2))
desc = page("https://avc.elumenapp.com/catalog/2026-27/program/x-descriptions", "Computer Applications AS", desc_body)
got = C.site_pinned([prog(cn0, p0)], [desc], {cn0: {"url": desc["url"]}}).get(cn0) or {}
check(C.RC.page_type(desc_body) == "descriptions" and "best" not in got and "rule B" in (got.get("why") or ""),
      "2 a pin to a course-descriptions page is refused, and its reason names rule B (%s)" % got.get("why"))

# ── 4. the award line ───────────────────────────────────────────────────────────────────────────
COA = "Certificate of Achievement requiring 30S/45Q to fewer than 60S/90Q units"
for line, award, want in (("A.S. Degree ( 60.0 Credits )", "A.S. Degree", True),
                          ("A.S. Degree ( 39.0 - 45.0 Credits )", "A.S. Degree", True),
                          ("Certificate of Achievement ( 39.0 Credits )", COA, True),
                          ("A.S. Degree ( 27.0 Credits )", COA, False),
                          ("A.A. Degree", "A.S. Degree", False),
                          ("Accounting Associate of Arts Degree", "A.A. Degree", False),
                          ("Associate in Science Degree for Transfer", "A.S. Degree", False),
                          ("This program prepares students for careers (60 units)", "A.S. Degree", False)):
    check(C.site_award_line(line, award) is want, "4 %r for %s reads as %s" % (line, award[:12], want))
dept = page("https://x.example.edu/department/accounting", "Accounting",
            "Accounting\nAccounting Associate of Arts Degree\nACCT 1 Financial 3\n")
check(C.site_heading_names(dept, {"title": "Accounting", "award": "A.A. Degree"})[0] is False,
      "4 a department page whose next line names one of its programs never binds on the award-line rule")

# ── 5. the rule's self-recall on Redwoods' filed pages ──────────────────────────────────────────
# Each program's own page is the one whose opening prints its title and award (own_url): its filed page, or its sister
# award's for the six the capture swapped (01816 and 22666, 42895 and 42928, 45557 and 45595). 13559 and 30811 have no
# page of their certificate award, and Personal and Academic ESL 33453's page prints another title: none.
REC = FIX["recall"]
pg_of = {u: page(u, p["h1"], p["text"]) for u, p in REC["pages"].items()}
own = [e for e in REC["programs"] if e["own_url"] in pg_of]
none = [e for e in REC["programs"] if e["own_url"] is None]
missed = [e["control_number"] for e in own if not C.site_heading_names(pg_of[e["own_url"]], e)[0]]
false = [(e["control_number"], u.rsplit("/", 1)[1]) for e in REC["programs"] for u in pg_of
         if u != e["own_url"] and C.site_heading_names(pg_of[u], e)[0]]
sub = [e["control_number"] for e in own if C.RC.heading_line([pg_of[e["own_url"]]["h1"]], e["title"], e["award"]) < 0]
check(len(pg_of) == 71 and len(own) >= 60 and not missed,
      "5 each of Redwoods' %d programs with a page of their own binds on it, %d of them through the award line (%s refused)"
      % (len(own), len(sub), missed))
check(not false, "5 no Redwoods program binds on a page not its own: 0 false binds in %d pairs (%s)"
      % (len(REC["programs"]) * (len(pg_of) - 1), false[:6]))
check({e["control_number"] for e in none} == {"13559", "30811", "33453"},
      "5 the three with no page of their own award or title bind nowhere")

# ── 6. the members: a pin, a named gap or a forced re-read, once ────────────────────────────────
for college, (slug, members) in LEVER.items():
    members = set(members.split())
    pins = set(C.site_pin_entries(college))
    path = os.path.join(ROOT, "kb", "program_requirements_college", slug, "named_gaps_s721.json")
    ng = json.load(open(path)) if os.path.exists(path) else {"programs": [], "reasons": {}}
    gaps = [g["control_number"] for g in ng["programs"]]
    forced = FORCED.get(college, set())
    captured = CAPTURED.get(college, set())
    sets = [pins, set(gaps), forced, captured]
    covered = set().union(*sets)
    check(len(gaps) == len(set(gaps)) and all(g["reason"] in ng["reasons"] for g in ng["programs"])
          and sum(len(s) for s in sets) == len(covered),
          "6 %s: each named gap once with a defined reason, and no member in two of pins, gaps, forced, captured" % college)
    check(covered <= members and (covered == members or college in FIX["open"]),
          "6 %s: pins %d, named gaps %d, forced %d, captured %d cover the lever's %d%s"
          % (college, len(pins), len(gaps), len(forced), len(captured), len(members),
             "" if covered == members else " (open: %s)" % sorted(members - covered)))

print("\n%d checks, %d failed" % (N[0], len(FAILS)))
sys.exit(1 if FAILS else 0)
