#!/usr/bin/env python3
"""S742: the capture's Acalog road reads site_pages pins, and an Acalog page's heading is its h1 alone.

    python3 tests/program_requirements_acalog_pins_s742_test.py

WHY. El Camino's Acalog catalog gives a certificate a page of its own beside its sister degree's, and assign() handed
five certificates the degree's page (Marketing 19861, Journalism 19866, Entrepreneurial Studies 38948, Hybrid, Electric,
and Alternative Fuels 43993, Photography 19883). Each is pinned to its own page in the college's reconcile entry
(site_pages, S739 and S741), and the pins moved nothing: capture() read site_pin_entries() on the curriQunet, eLumen
and sitemap roads and never on the Acalog one (read 45773663927 filed no site_pins account).

THE CHANGE (kb/_program_requirements_college.py).
  * capture()'s Acalog branch reads the college's pins through ac_site_pins() and queues each pinned page of the
    catalog being read. A pin written for another catalog (another catoid) or for an address that is no program page
    is never queued, so site_pinned() refuses it as not read and the program reads no page.
  * site_heading_names() reads an Acalog program page's heading from its h1 alone. The page title opens with the
    catalog's page-type label ("Degree & Certificate: Journalism, AA-T - El Camino College"), so the label's word
    "Certificate" stood beside every program's name and rule A read a certificate as named on its sister transfer
    degree's page (the finding tests/program_reconcile_s739_pooled_test.py left for the reader's review).

Pinned here:
  1. ac_pin_in_catalog and ac_site_pins on their own: the catalog's own pins take the address the road loads, any
     other pin is left as written and is not queued.
  2. The capture wires it (a source check, since the capture needs a browser).
  3. El Camino's pins on the pages as capture-view read 45772822110 printed them: each of the four binds on its own
     page through site_pinned(), marked pinned, at the accept share, and only the pinned programs move.
  4. The wrong joins: each of the five on the degree page the capture had handed it, a pin for another catalog, a
     pin whose page was not read, and a page with a blank h1.
  5. The heading test's self-recall on El Camino's filed sources (the S652 review rule). The answer held: a program
     whose filed record places its courses, alone on its page, read that page as its own. Counted: own pages that
     name their program (right), own pages refused (each printed; a refused pin reads no page, the safe side), and
     pages that name another program (wrong). With the title read as before S742: 3 wrong; now 0.
  6. Statewide: every filed source on an Acalog program address, the title read as before and as now. What moves is
     printed by college; no own page that named its program stops naming it.
  7. A page on any other platform reads its title as before.
Pure stdlib.
"""
import collections
import glob
import inspect
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_piles_s714_ccsf as PC  # noqa: E402  (closed_list: the state's course list, offline)
import _program_requirements_college as C  # noqa: E402

FAILS = []
N = [0]


def check(ok, what):
    N[0] += 1
    print(("ok   " if ok else "FAIL ") + what)
    if not ok:
        FAILS.append(what)


ELC = "El Camino College"
BASE = "http://catalog.elcamino.edu"
CATOID = 13
FOLDER = os.path.join(ROOT, "kb", "program_requirements_college", "el_camino")
HEAD = "Skip to Content\n\n2026-2027 Catalog\nEl Camino College\n\n%s\nPrint this Page\n\n"
# The four certificates' own pages, as college-page-read run 45772822110 printed the capture's text for each.
OWN = {
    "19861": ("3552", "Marketing Certificate of Achievement",
              "Business Division\n\nCertificate of Achievement\n\n"
              "A Certificate of Achievement in Marketing will be granted upon the completion of all program "
              "requirements. A minimum of 9 units must be completed at El Camino College.\n\nRequired Courses:\n"
              "BUS 108 - Written Business Communications 3 units\nBUS 110 - Marketing 3 units\n"
              "BUS 111 - Digital Marketing 3 units\nBUS 112 - Advertising 3 units\n"
              "BUS 113 - Social Media Marketing 3 units\nTotal Units: 15\n\nPrint this Page\n"),
    "19866": ("3622", "Journalism Certificate of Achievement",
              "Humanities Division\n\nCertificate of Achievement\n\n"
              "A Certificate of Achievement will be granted upon completion of all program requirements. At least 15 "
              "units of the certificate requirements must be completed at El Camino College.\n\nRequired Courses:\n"
              "JOUR 1 - News Writing and Reporting 3 units\n"
              "JOUR 8 - Investigative Reporting, Editing, and Entrepreneurship 3 units\n\n"
              "JOUR 6 - Basic Photojournalism 3 units\n\nor\n\nPHOT 106 - Basic Photojournalism 3 units\n\n"
              "JOUR 9abcd - Nonfiction Storytelling for Magazines and Digital Media 3 units *\n"
              "JOUR 11abcd - News Media Production and Social Media Storytelling 3 units *\n"
              "JOUR 12 - Mass Media and Society 3 units\nJOUR 14abcd - Digital Media Storytelling 3 units *\n"
              "Total Units: 21\n\nPrint this Page\n"),
    "38948": ("3699", "Entrepreneurial Studies Certificate of Achievement",
              "Business Division\n\nRequired Core:\nBUS 111 - Digital Marketing 3 units\n"
              "BUS 113 - Social Media Marketing 3 units\n"
              "BUS 124 - Entrepreneurship Start-up Planning and Funding 3 units\n"
              "BUS 125 - Entrepreneurship Start-up Operations and Management 3 units\n"
              "BUS 127 - Social Entrepreneurship 3 units\nBUS 128 - Think Like an Entrepreneur 1 unit\n"
              "CIS 13 - Computer Information Systems 3 units\n3-4 units from:\n"
              "BUS 126 - Accounting for Small Business 3 units\nBUS 150 - Financial Accounting 4 units\n"
              "3-4 units from:\nBUS 119 - Principles of Retailing Management 3 units\n"
              "BUS 120 - Business Management 3 units\nTotal Units: 19-20\n\nPrint this Page\n"),
    "43993": ("3728", "Hybrid, Electric, and Alternative Fuels Certificate of Achievement",
              "Design and Applied Technology Division\n\nRequired Core: 18 units\n"
              "ATEC 1 - Introduction to Automotive Service 2 units\n\n"
              "ATEC 22B - Electrical, Electronics and Computer Controlled Systems 8 units\n\nor\n\n"
              "ATEC 25 - Automotive Electrical Systems 4 units\n\nand\n\n"
              "ATEC 26 - Automotive Electrical Diagnosis 4 units\n\n"
              "ATEC 51 - Introduction to Alternative Fuel Vehicles 2 units\n"
              "ATEC 52 - Introduction to Hybrid, Electric and Fuel-Cell Vehicle Technology 3 units\n"
              "ATEC 53 - Hybrid, Fuel-Cell and Electric Vehicle Diagnosis & Repair 3 units\nTotal Units: 18\n\n"
              "Print this Page\n"),
}


def url_of(poid, catoid=CATOID):
    return "%s/preview_program.php?catoid=%d&poid=%s&print" % (BASE, catoid, poid)


def page(url, h1, body, title=None):
    title = title if title is not None else "Degree & Certificate: %s - El Camino College" % h1
    got = {"url": url, "final_url": url, "title": title, "h1": h1, "body": body, "content": body, "links": []}
    return {"url": url, "title": title, "h1": h1, "body": body, "content": body, "got": got,
            "codes": C.page_net(got)}


with open(os.path.join(FOLDER, "sources.json"), encoding="utf-8") as fh:
    SOURCES = json.load(fh)
BY_CN = {str(x["control_number"]): x for x in SOURCES}


def program(cn):
    x = BY_CN[cn]
    return {"control_number": cn, "title": x["title"], "award": x["award"], "shape": x.get("shape"),
            "status": "Active", "closed_list": PC.closed_list(ELC, cn), "load_id": "1"}


PINS = C.site_pin_entries(ELC)
FIVE = ["19861", "19866", "19883", "38948", "43993"]

# ── 1. the pins as the Acalog road reads them ─────────────────────────────────────────────────────
print("1. ac_pin_in_catalog and ac_site_pins")
check(sorted(PINS) == FIVE, "El Camino's entry pins the five certificates (%s)" % sorted(PINS))
check(all(C.ac_pin_in_catalog(p["url"], CATOID) for p in PINS.values()),
      "each pin names a program page of the catalog being read (catoid 13)")
check(not C.ac_pin_in_catalog(url_of("3552", 12), CATOID) and not C.ac_pin_in_catalog(url_of("3552"), None)
      and not C.ac_pin_in_catalog(BASE + "/content.php?catoid=13&navoid=771", CATOID)
      and not C.ac_pin_in_catalog(BASE + "/preview_program.php?poid=3552", CATOID),
      "a pin for another catalog, a pin with no catalog read, a menu page and an address with no catoid are not "
      "the catalog's")
check(C.ac_site_pins(PINS, BASE, CATOID) == PINS, "the five pins already carry the address the road loads")
loose = {"19861": {"url": "https://catalog.elcamino.edu/preview_program.php?catoid=13&poid=3552", "evidence": "t"},
         "19866": {"url": url_of("3622", 12), "evidence": "t"},
         "38948": {"url": "https://www.elcamino.edu/academics/entrepreneurial-studies.php", "evidence": "t"}}
got = C.ac_site_pins(loose, BASE, CATOID)
check(got["19861"] == {"url": url_of("3552"), "evidence": "t"},
      "a pin written with https and without &print takes the address the road loads (%s)" % got["19861"]["url"])
check(got["19866"] == loose["19866"] and got["38948"] == loose["38948"],
      "a pin for another catalog, or for an address that is no program page, is left as written")
check(C.ac_site_pins(loose, None, CATOID) == loose and C.ac_site_pins(loose, BASE, None) == loose
      and C.ac_site_pins({}, BASE, CATOID) == {},
      "with no origin or no catalog id read, and with no pins, nothing changes")

# ── 2. the capture wires it ───────────────────────────────────────────────────────────────────────
print("2. the capture's Acalog branch")
src = inspect.getsource(C.capture)
branch = src[src.index('elif platform == "acalog":'):src.index("scope = district_scope(")]
check("site_pins = ac_site_pins(site_pin_entries(college)" in branch,
      "the Acalog branch reads the college's site_pages pins")
check('urls += [pin["url"]' in branch and "ac_pin_in_catalog(pin[\"url\"]" in branch,
      "it queues each pinned page of the catalog being read, and no other")
check("site_pinned(programs, pages, site_pins) if site_pins else {}" in src
      and "with_site_pins(given, pinned_site, site_pins)" in src,
      "the pins bind through site_pinned() and with_site_pins(), as on every other road")

# ── 3. El Camino's pins on their own pages ────────────────────────────────────────────────────────
print("3. the four certificates on their own pages (page read 45772822110)")
programs = [program(cn) for cn in sorted(BY_CN) if PC.closed_list(ELC, cn)]
check(len(programs) >= 130 and all(any(p["control_number"] == cn for p in programs) for cn in FIVE),
      "El Camino's programs with a state course list are read offline (%d)" % len(programs))
own_pages = [page(url_of(poid), h1, HEAD % h1 + body) for poid, h1, body in OWN.values()]
filed_pages = [page(BY_CN[cn]["source"]["url"], BY_CN[cn]["source"]["h1"],
                    HEAD % BY_CN[cn]["source"]["h1"] + OWN[cn][2].replace("Certificate of Achievement", "Degree"))
               for cn in OWN]
pins4 = {cn: p for cn, p in C.ac_site_pins(PINS, BASE, CATOID).items() if cn in OWN}
bound = C.site_pinned(programs, own_pages + filed_pages, pins4)
bad = []
for cn, (poid, h1, body) in sorted(OWN.items()):
    b = (bound.get(cn) or {}).get("best") or {}
    if not (b.get("url") == url_of(poid) and b.get("pinned") is True
            and (b.get("coverage") or 0) >= C.P.ACCEPT_SHARE and b["url"] != BY_CN[cn]["source"]["url"]):
        bad.append((cn, (bound.get(cn) or {}).get("why"), b.get("coverage")))
check(not bad and set(bound) == set(OWN),
      "each of the four binds on its own page, never the filed one, marked pinned, at the accept share (%s)" % bad)
check([round(bound[cn]["best"]["coverage"], 2) for cn in sorted(OWN)] == [1.0, 1.0, 1.0, 1.0],
      "each own page prints every course the state lists for its certificate (%s)"
      % [bound[cn]["best"]["coverage"] for cn in sorted(OWN) if "best" in bound[cn]])
before = C.assign(programs, own_pages + filed_pages)
after, account = C.with_site_pins(before, bound, pins4)
check(all(after[cn] is before[cn] for cn in before if cn not in OWN)
      and all(after[cn]["best"]["url"] == url_of(OWN[cn][0]) for cn in OWN)
      and all(account[cn] == {"url": url_of(OWN[cn][0]), "bound": True} for cn in OWN),
      "only the pinned programs move, and the capture's site_pins account names each as bound")

# ── 4. the wrong joins ────────────────────────────────────────────────────────────────────────────
print("4. the wrong joins")
for cn in FIVE:
    s = BY_CN[cn]["source"]
    named, head = C.site_heading_names({"url": s["url"], "h1": s["h1"], "title": s["title"]}, program(cn))
    check(not named, "%s is not named by the degree page the capture had handed it (%r)" % (cn, head))
sister = {cn: {"url": BY_CN[cn]["source"]["url"], "evidence": "t"} for cn in OWN}
refused = C.site_pinned(programs, own_pages + filed_pages, sister)
check(all("heading" in (refused.get(cn) or {}).get("why", "") for cn in OWN),
      "a pin to the sister degree's page is refused on its heading, Journalism's transfer degree included (%s)"
      % {cn: (refused.get(cn) or {}).get("why", "")[:60] for cn in OWN})
old = C.ac_site_pins({"19861": {"url": url_of("3552", 12)}}, BASE, CATOID)
check(C.site_pinned(programs, own_pages, old)["19861"].get("why") == "the pinned page was not read",
      "a pin for another catalog is never queued, so it is refused as not read and the program reads no page")
check(C.site_pinned(programs, filed_pages, pins4)["19861"].get("why") == "the pinned page was not read",
      "a pinned page the capture did not read is refused")
blank = page(url_of("3552"), "", HEAD % "" + OWN["19861"][2],
             title="Degree & Certificate: Marketing Certificate of Achievement - El Camino College")
check("heading" in C.site_pinned(programs, [blank], pins4)["19861"].get("why", ""),
      "an Acalog page with a blank h1 names nothing: its title carries the page-type label")


# ── 5. the heading test's self-recall on El Camino's filed sources ─────────────────────────────────
def names(src_entry, prog, as_before=False):
    """site_heading_names on a filed source's page; as_before reads the title too, as every road did before S742
    (the page is passed without its address, so the Acalog rule stands aside)."""
    s = src_entry["source"]
    pg = {"url": "" if as_before else s["url"], "h1": s.get("h1"), "title": s.get("title")}
    return C.site_heading_names(pg, {"title": prog["title"], "award": prog["award"]})[0]


def recall(folder):
    """(own, right_now, right_before, refused_now, wrong_now, wrong_before, pairs) over one college's filed sources
    on Acalog program addresses. own: a program alone on its page whose filed record was read from that page and
    places its courses (score.coverage.pass). A wrong answer is an own page naming any other program the state
    lists at the college, one the capture gave no page included."""
    try:
        with open(os.path.join(folder, "sources.json"), encoding="utf-8") as fh:
            everyone = json.load(fh)
    except (OSError, ValueError):
        return None
    srcs = [x for x in everyone if C.AC_PROGRAM.search(((x.get("source") or {}).get("url")) or "")]
    if not srcs:
        return None
    on = collections.Counter(x["source"]["url"] for x in srcs)
    own = []
    for x in srcs:
        try:
            with open(os.path.join(folder, "records", "%s.json" % x["control_number"]), encoding="utf-8") as fh:
                f = json.load(fh)
        except (OSError, ValueError):
            continue
        cov = (f.get("score") or {}).get("coverage") or {}
        if on[x["source"]["url"]] == 1 and cov.get("pass") is True and f.get("source_url") == x["source"]["url"]:
            own.append(x)
    right_now = [x for x in own if names(x, x)]
    right_before = [x for x in own if names(x, x, True)]
    wrong_now, wrong_before, pairs = [], [], 0
    for a in everyone:      # a program the capture gave no page is the one a pin is written for
        for b in own:
            if a["control_number"] == b["control_number"] \
                    or ((a.get("source") or {}).get("url")) == b["source"]["url"]:
                continue
            pairs += 1
            if names(b, a):
                wrong_now.append((a["control_number"], b["control_number"]))
            if names(b, a, True):
                wrong_before.append((a["control_number"], b["control_number"]))
    return {"own": own, "right_now": right_now, "right_before": right_before,
            "refused_now": [x for x in own if x not in right_now], "wrong_now": wrong_now,
            "wrong_before": wrong_before, "pairs": pairs}


print("5. the self-recall on El Camino's filed sources")
r = recall(FOLDER)
print("   own %d, right %d (before %d), refused %d, wrong %d (before %d) in %d pairs"
      % (len(r["own"]), len(r["right_now"]), len(r["right_before"]), len(r["refused_now"]), len(r["wrong_now"]),
         len(r["wrong_before"]), r["pairs"]))
for x in r["refused_now"]:
    print("   refused: %s %r (%s) on %r" % (x["control_number"], x["title"], x["award"][:28], x["source"].get("h1")))
check(len(r["own"]) >= 95 and r["pairs"] > 15000, "the recall reads El Camino's own pages (%d own, %d pairs)"
      % (len(r["own"]), r["pairs"]))
check(not r["wrong_now"], "no own page names another program: 0 wrong in %d pairs (%s)" % (r["pairs"], r["wrong_now"][:5]))
check({b for _, b in r["wrong_before"]} <= {"32333", "31942", "45974"},
      "read with its title, as before S742, a transfer degree's page named its sister certificate (%s)"
      % r["wrong_before"])
check([x["control_number"] for x in r["right_now"]] == [x["control_number"] for x in r["right_before"]],
      "every own page that named its program still names it (%d)" % len(r["right_now"]))
check(len(r["refused_now"]) <= 0.1 * len(r["own"]),
      "the own pages the heading refuses stay under a tenth, each printed above: a renamed program, a noncredit "
      "award, the Cal-GETC page (%d of %d)" % (len(r["refused_now"]), len(r["own"])))

# ── 6. statewide: every filed source on an Acalog program address ──────────────────────────────────
print("6. statewide, the title read as before and as now")
moved, colleges, lost = collections.Counter(), 0, []
for folder in sorted(glob.glob(os.path.join(ROOT, "kb", "program_requirements_college", "*"))):
    rr = recall(folder)
    if rr is None:
        continue
    colleges += 1
    name = os.path.basename(folder)
    lost += [(name, x["control_number"]) for x in rr["right_before"] if x not in rr["right_now"]]
    moved[name] = len(set(rr["wrong_before"]) - set(rr["wrong_now"]))
    print("   %-28s own %3d, right %3d (before %3d), wrong %d (before %d) in %d pairs"
          % (name, len(rr["own"]), len(rr["right_now"]), len(rr["right_before"]), len(rr["wrong_now"]),
             len(rr["wrong_before"]), rr["pairs"]))
    check(not rr["wrong_now"], "%s: no own page names another program (%s)" % (name, rr["wrong_now"][:5]))
check(colleges >= 1 and not lost, "no own page that named its program stops naming it, at %d Acalog colleges (%s)"
      % (colleges, lost[:5]))
steps = C.RC and __import__("_program_requirements_reconcile").load_steps()
pinned_acalog = sorted(c for c, e in steps.items() if (e or {}).get("site_pages")
                       and any(C.AC_PROGRAM.search(p.get("url") or "") for p in e["site_pages"].values()
                               if isinstance(p, dict)))
check(pinned_acalog == [ELC], "El Camino is the one college whose pins name Acalog program pages (%s)" % pinned_acalog)

# ── 7. every other platform reads its title as before ─────────────────────────────────────────────
print("7. other platforms")
COA = "Certificate of Achievement requiring 16S/24Q to fewer than 30S/45Q units"
cl = {"url": "https://catalog.example.edu/accounting/accounting-certificate-achievement/", "h1": "",
      "title": "Accounting Certificate of Achievement | Academic Catalog"}
check(C.site_heading_names(cl, {"title": "Accounting", "award": COA}) == (True, "Accounting Certificate of Achievement"),
      "a CourseLeaf page whose banner h1 the capture blanked still reads its title")

print("\n%d checks, %d failed" % (N[0], len(FAILS)))
sys.exit(1 if FAILS else 0)
