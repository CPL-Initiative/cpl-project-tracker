#!/usr/bin/env python3
"""S727's pins: the reader_page_assignment lever at Orange Coast College.

    python3 tests/program_requirements_lever_pins_s727_test.py

WHY. The gap census (2026-11-25 01:39Z) filed 8 Orange Coast programs whose extraction placed none of the state's
listed courses. College-page-read runs 45562337640 and 45563142044 read each one's own page as the capture reads it.
Three are pinned (kb/program_requirements_reconcile.json, site_pages) and five are named gaps
(kb/program_requirements_college/orange_coast/named_gaps_s727.json). Orange Coast's page titles end
"< Orange Coast College", and site_heading_names now cuts the site's name there as it does after a bar (S727), since
rule A's length slack refused a short title with the name left on (Geology A.S.-T 33569).

  1. site_heading_names cuts a page title at " < " and at a bar, and a department title with no award still fails.
  2. Each pin binds on its own page, never the filed one, at the accept share, its program marked (RC.MARK) as the
     capture marks each whose record places none. Respiratory Care A.S. 04007's and Geology A.S.-T 33569's own pages
     print a general education table, rule B reads each as a general-education page, and unpinned neither is a
     candidate; pinned, each binds (RC.PIN_HEADING). Powerplant certificate 22394's pin binds, and a pin to the
     Airframe & Powerplant certificate's page or to the Powerplant A.S. page is refused on its heading.
  3. The forced re-reads (04007, 33569; their pages are unchanged since the filed extraction): each pinned page's
     text, as the capture reads it, carries the REQUIREMENTS tab and fits the text the capture sends (TEXT_CAP).
  4. Each named gap states only what its page prints: the page prints the program's Control Number (or, for
     successor_printed, the other one its note names), and names fewer than half of the state's listed courses (a pin
     there would be refused); a list_printed_as_range page prints its range.
  5. The lever's members (pinned here, never read from the live census) are each a pin or a named gap, once.
The pages are in tests/fixtures/program_requirements_lever_pins_s727.json.gz. Pure stdlib.
"""
import gzip
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


FIX = json.load(gzip.open(os.path.join(ROOT, "tests", "fixtures", "program_requirements_lever_pins_s727.json.gz"),
                          "rt", encoding="utf-8"))
OCC = "Orange Coast College"
LEVER = "03970 04007 22389 22394 32235 33569 42115 42117".split()   # the census of 2026-11-25 01:39Z
PINNED = {"04007", "22394", "33569"}
FORCED = {"04007", "33569"}


def page(url, p):
    got = {"url": url, "final_url": url, "title": p["title"], "h1": p["h1"], "body": p["text"], "content": p["text"],
           "links": []}
    return {"url": url, "title": p["title"], "h1": p["h1"], "body": p["text"], "content": p["text"], "got": got,
            "codes": C.page_net(got)}


def prog(cn, marked=True):
    p = FIX["programs"][cn]
    return {"control_number": cn, "title": p["title"], "award": p["award"], "shape": "x", "status": "Active",
            "closed_list": [{"code": c} for c in p["codes"]], "load_id": "1", C.RC.MARK: marked}


pages = [page(u, p) for u, p in FIX["pages"].items()]
by_url = {pg["url"]: pg for pg in pages}
progs = [prog(cn) for cn in FIX["programs"]]

# ── 1. the site's name in a page title ──────────────────────────────────────────────────────────
GEO = {"title": "Geology", "award": "A.S. T Degree"}
for title, want in (("Geology, Associate in Science Degree for Transfer (AS-T) < Orange Coast College", True),
                    ("Geology Associate in Science for Transfer Degree | Academic Catalog", True),
                    ("Geology < Orange Coast College", False),
                    ("Geology, Associate in Science Degree for Transfer (AS-T) Orange Coast College Catalog Archive "
                     "Programs", False)):
    got = C.site_heading_names({"h1": "", "title": title}, GEO)
    check(got[0] is want, "1 %r names Geology A.S.-T: %s (tested %r)" % (title, want, got[1]))

# ── 2. each pin on its own page ─────────────────────────────────────────────────────────────────
pins = C.site_pin_entries(OCC)
check(set(pins) == PINNED == set(FIX["pins"]), "2 Orange Coast pins %s (%s)" % (sorted(PINNED), sorted(pins)))
got = C.site_pinned(progs, pages, pins)
bad = []
for cn in sorted(pins):
    b = (got.get(cn) or {}).get("best") or {}
    if (not b or b["coverage"] < C.P.ACCEPT_SHARE or b["url"] == FIX["programs"][cn]["filed_url"] and cn not in FORCED
            or b["url"] != pins[cn]["url"] or pins[cn]["url"] != FIX["pins"][cn]):
        bad.append("%s %s cov %s" % (cn, (got.get(cn) or {}).get("why", ""), b.get("coverage")))
check(not bad, "2 each of the 3 pins binds on its own page at the accept share, marked (%s)" % bad)
ge = sorted(cn for cn in pins if C.RC.page_type(by_url[pins[cn]["url"]]["body"]) == "ge")
unpinned = sorted(cn for cn in ge if C.candidates(prog(cn), [by_url[pins[cn]["url"]]], progs, {}))
check(ge == sorted(FORCED) and not unpinned,
      "2 04007's and 33569's pages read as general-education pages to rule B (%s); unpinned, neither is a candidate "
      "(%s); pinned, each binds" % (ge, unpinned))
for cn, what in (("22392", "the Airframe & Powerplant certificate's page"), ("08626", "the Powerplant A.S. page")):
    r = C.site_pinned([prog("22394")], pages, {"22394": {"url": FIX["sisters"][cn]}}).get("22394") or {}
    check("best" not in r and "heading" in (r.get("why") or ""),
          "2 Powerplant certificate 22394 pinned to %s is refused on its heading (%s)" % (what, r.get("why")))

# ── 3. the forced re-reads ──────────────────────────────────────────────────────────────────────
for cn in sorted(FORCED):
    body = by_url[pins[cn]["url"]]["body"]
    tab = body.find("[Tab: REQUIREMENTS]")
    found = C.P.find_codes(body[tab:], prog(cn)["closed_list"]) if tab >= 0 else {}
    check(tab >= 0 and len(body) <= C.P.TEXT_CAP and len(found) >= C.P.ACCEPT_SHARE * len(FIX["programs"][cn]["codes"]),
          "3 %s's page as the capture reads it carries its REQUIREMENTS tab (%d listed courses there) in %d characters, "
          "inside the %d the capture sends" % (cn, len(found), len(body), C.P.TEXT_CAP))

# ── 4. the named gaps state only what their pages print ─────────────────────────────────────────
with open(os.path.join(ROOT, "kb", "program_requirements_college", "orange_coast", "named_gaps_s727.json")) as fh:
    NG = json.load(fh)
gaps = {g["control_number"]: g for g in NG["programs"]}
check(set(gaps) == set(FIX["gaps"]) and all(g["reason"] in NG["reasons"] for g in gaps.values()),
      "4 the named gaps are %s, each with a defined reason" % sorted(FIX["gaps"]))
for cn, g in sorted(gaps.items()):
    body = by_url[FIX["gaps"][cn]]["body"]
    printed = g.get("successor") or cn
    found = C.P.find_codes(body, prog(cn)["closed_list"])
    share = len(found) / len(FIX["programs"][cn]["codes"])
    r = C.site_pinned([prog(cn)], pages, {cn: {"url": FIX["gaps"][cn]}}).get(cn) or {}
    ok = "Control Number: %s" % printed in body and share < C.P.ACCEPT_SHARE and "best" not in r
    if g["reason"] == "list_printed_as_range":
        ok = ok and "KIN A105-A159, A206-A259" in body
    if g["reason"] == "successor_printed":
        ok = ok and "Control Number: %s" % cn not in body
    check(ok, "4 %s (%s): its page prints Control Number %s and names %d of %d listed courses; a pin there is refused "
              "(%s)" % (cn, g["reason"], printed, len(found), len(FIX["programs"][cn]["codes"]), r.get("why")))

# ── 5. the lever's members ──────────────────────────────────────────────────────────────────────
both = set(pins) & set(gaps)
check(not both and set(pins) | set(gaps) == set(LEVER) and FORCED <= set(pins),
      "5 pins %d and named gaps %d cover the lever's %d once each (%s)" % (len(pins), len(gaps), len(LEVER), sorted(both)))

print("\n%d checks, %d failed" % (N[0], len(FAILS)))
sys.exit(1 if FAILS else 0)
