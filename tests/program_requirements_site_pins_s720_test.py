#!/usr/bin/env python3
"""S720's site_pages pins: a program on a site catalog reads the page a person named for it, and nothing else moves.

    python3 tests/program_requirements_site_pins_s720_test.py

WHY. The gap census (run 45319725062) filed 15 San Bernardino Valley programs under reader_page_assignment: assign()
handed each certificate its sister degree's page or the department's landing page, and extraction placed none of
the state's listed courses. CourseLeaf gives each certificate a page of its own. site_pages in the college's reconcile
entry names it, per program (kb/_program_requirements_college.py site_pin_entries, site_pinned; the capture reads a
pinned page whether or not its sitemap listed it).

  1. A pin binds where the page was read, its h1 prints the program's title with its award, and candidates()
     accepts the page for the program; the bound candidate is marked pinned.
  2. A pin refuses: a page whose h1 is a sister award's (the degree page that lists the certificate in its body), a
     page not read, and a page that prints too few of the listed courses. Each refusal says why.
  3. Only the pinned program moves: assign() gives every other program the page it gave before, the pinned page
     included, and a program with no pin is never read by site_pinned().
  4. The capture wires it: the pin's page is queued, the bound candidate replaces assign()'s, a refused pin reads
     the program from no page, and the source says pinned (a source check, since the capture needs a browser).
  5. San Bernardino Valley's 16 pins on their pages as capture-view read 45344701810 printed them
     (tests/fixtures/program_requirements_site_pins_s720.json.gz): each binds on its own page, never the filed one,
     at the accept share with one total; 32317's CDEV codes read as the file's CD ones (course_renumbers).
Pure stdlib.
"""
import inspect
import re
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


BASE = "https://catalog.example.edu/degree-certificate-program-index/accounting/"
CODES = ["ACCT 200", "ACCT 201", "ACCT 47", "BUSAD 100", "BUSAD 210", "ECON 208"]


def page(url, h1, body):
    got = {"url": url, "final_url": url, "title": h1 + " | Academic Catalog", "h1": h1, "body": body,
           "content": body, "links": []}
    return {"url": url, "title": got["title"], "h1": h1, "body": body, "content": body, "got": got,
            "codes": C.page_net(got)}


def table(codes):
    return "Required Courses\n" + "".join("%s Course %d 3\n" % (c, k) for k, c in enumerate(codes)) + "Total 18\n"


def prog(cn, title, award, codes):
    return {"control_number": cn, "title": title, "award": award, "shape": "certificate", "status": "Active",
            "closed_list": [{"code": c} for c in codes], "load_id": "1"}


AA = page(BASE + "accounting-aa-degree/", "Accounting Associate of Arts Degree",
          "Accounting Associate of Arts Degree\nThe department also offers the Accounting Certificate of Achievement.\n"
          + table(CODES) + "General education 21\n")
DEPT = page(BASE, "Accounting", "Accounting\nAccounting Associate of Arts Degree\nAccounting Certificate of Achievement\n"
            + table(CODES))
CERT = page(BASE + "accounting-certificate-achievement/", "Accounting Certificate of Achievement",
            "Accounting Certificate of Achievement\n" + table(CODES))
THIN = page(BASE + "accounting-thin-certificate-achievement/", "Accounting Certificate of Achievement",
            "Accounting Certificate of Achievement\n" + table(CODES[:1]))
PAGES = [AA, DEPT, CERT, THIN]
COA = "Certificate of Achievement requiring 16S/24Q to fewer than 30S/45Q units"
P_AA = prog("04864", "Accounting", "A.A. Degree", CODES)
P_CERT = prog("22732", "Accounting", COA, CODES)
P_OTHER = prog("22733", "Accounting", COA, CODES)
PROGS = [P_AA, P_CERT]

# ── 1. a pin binds ─────────────────────────────────────────────────────────────────────────────
got = C.site_pinned(PROGS, PAGES, {"22732": {"url": CERT["url"].rstrip("/"), "evidence": "test"}})
best = (got.get("22732") or {}).get("best") or {}
check(best.get("url") == CERT["url"] and best.get("pinned") is True and best.get("coverage") == 1.0,
      "1 the certificate's pin binds on its own page (trailing slash aside), marked pinned, coverage 1.0 (%s)" % best.get("url"))
check(C._page_key("https://Catalog.Example.edu/a/b/#x") == C._page_key("https://catalog.example.edu/a/b"),
      "1 a pin compares addresses without the host's case, a fragment or the trailing slash")

# ── 2. a pin refuses ─────────────────────────────────────────────────────────────────────────────
for url, want, what in (
        (AA["url"], "heading", "the degree page, whose body names the certificate"),
        (DEPT["url"], "heading", "the department's landing page, its h1 the department alone"),
        (BASE + "never-read/", "not read", "a page the capture did not read"),
        (THIN["url"], "no candidate", "a page printing 1 of 6 listed courses")):
    got = C.site_pinned(PROGS, PAGES, {"22732": {"url": url}})
    why = (got.get("22732") or {}).get("why") or ""
    check("best" not in got.get("22732", {}) and want in why, "2 refused: %s (%s)" % (what, why))

# ── 3. only the pinned program moves ─────────────────────────────────────────────────────────────
before = C.assign(PROGS + [P_OTHER], PAGES)
pins = {"22732": {"url": CERT["url"]}}
got = C.site_pinned(PROGS + [P_OTHER], PAGES, pins)
check(set(got) == {"22732"}, "3 site_pinned() reads only the pinned program (%s)" % sorted(got))
after = dict(before, **{cn: {"best": g["best"]} for cn, g in got.items() if "best" in g})
check(all((after[cn].get("best") or {}).get("url") == (before[cn].get("best") or {}).get("url")
          for cn in before if cn != "22732"),
      "3 every other program keeps assign()'s page")
check(C.site_pinned(PROGS, PAGES, {}) == {} and C.site_pinned(PROGS, PAGES, {"99999": {"url": CERT["url"]}}) == {},
      "3 no pin, or a pin for a program the state does not list here, moves nothing")
shared = C.site_pinned(PROGS + [P_OTHER], PAGES, {"22732": {"url": CERT["url"]}, "22733": {"url": CERT["url"]}})
check(all("best" in shared[cn] for cn in ("22732", "22733")), "3 two programs pinned to one page both read it")

# ── 4. the capture wires it ──────────────────────────────────────────────────────────────────────
src = inspect.getsource(C.capture)
check("site_pins = site_pin_entries(college)" in src and 'urls += [pin["url"]' in src,
      "4 the capture reads each pin's page whether or not the listing named it")
check("site_pinned(programs, pages, site_pins)" in src and 'given[cn] = {"best": got["best"]}' in src,
      "4 a bound pin replaces assign()'s page for its program")
check("site_pages pin is refused" in src and 'rec["source"]["pinned"] = True' in src,
      "4 a refused pin reads the program from no page, and a bound one's source says pinned")
check(C.site_pin_entries("No Such College") == {}, "4 a college with no entry has no pins")

# ── 5. San Bernardino Valley's 16 pins, on the pages as the capture view read them ───────────────────
import gzip  # noqa: E402
import json  # noqa: E402
import _program_requirements_reconcile as R  # noqa: E402

SB = "San Bernardino Valley College"
FIX = json.load(gzip.open(os.path.join(ROOT, "tests", "fixtures", "program_requirements_site_pins_s720.json.gz"), "rt",
                          encoding="utf-8"))
LEVER = set("04881 09267 19002 22732 22754 22756 22784 22787 22792 22799 22816 22818 22831 32317 41789".split())
SB_PINS = C.site_pin_entries(SB)
check(set(SB_PINS) == LEVER | {"22768"} == set(FIX["programs"]),
      "5 the entry pins the census lever's 15 (run 45319725062) and 22768, found and never extracted, as the fixture does")
sb_pages = [page(url, p["h1"], p["text"]) for url, p in FIX["pages"].items()]
conf = R.load_steps().get(SB) or {}
sb_progs = C.with_renumbers([dict(prog(cn, p["title"], p["award"], p["codes"])) for cn, p in FIX["programs"].items()],
                            R.course_renumbers(SB), conf.get("prefix_aliases"))
got = C.site_pinned(sb_progs, sb_pages, SB_PINS)
bad = []
for cn, p in sorted(FIX["programs"].items()):
    b = (got.get(cn) or {}).get("best") or {}
    totals = len(re.findall(r"^Total Units\t", b.get("text") or "", re.M))
    if not b or b["coverage"] < C.P.ACCEPT_SHARE or totals != 1 or b["url"] == p["filed_url"]:
        bad.append("%s %s cov %s totals %d" % (cn, (got.get(cn) or {}).get("why", ""), b.get("coverage"), totals))
check(not bad, "5 each of 16 pins binds on its own page, not the filed one, at the accept share with one total (%s)" % bad)
ece = next(c for c in sb_progs if c["control_number"] == "32317")
check({c["code"]: c.get("printed") for c in ece["closed_list"]}.get("CD 111") == "CDEV 111"
      and (got["32317"]["best"]["coverage"] == 1.0),
      "5 Early Childhood Education A.S.-T reads its page's CDEV codes as the file's CD ones (course_renumbers)")

print("\n%d checks, %d failed" % (N[0], len(FAILS)))
sys.exit(1 if FAILS else 0)
