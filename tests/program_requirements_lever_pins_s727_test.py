#!/usr/bin/env python3
"""S727's pins: the reader_page_assignment lever at Orange Coast College.

    python3 tests/program_requirements_lever_pins_s727_test.py

WHY. The gap census (2026-11-25 01:39Z) filed 8 Orange Coast programs whose extraction placed none of the state's
listed courses. College-page-read runs 45562337640 and 45563142044 read each one's own page as the capture reads it.
Three are pinned (kb/program_requirements_reconcile.json, site_pages) and five are named gaps
(kb/program_requirements_college/orange_coast/named_gaps_s727.json). Orange Coast's page titles end
"< Orange Coast College", and site_heading_names now cuts the site's name there as it does after a bar (S727), since
rule A's length slack refused a short title with the name left on (Geology A.S.-T 33569).

  1. site_heading_names cuts a page title at " < " and at a bar (TITLE_SPLIT), and a department title with no award
     still fails.
  2. Each pin binds on its own page, never the filed one, at the accept share, its program marked (RC.MARK) as the
     capture marks each whose record places none. Respiratory Care A.S. 04007's and Geology A.S.-T 33569's own pages
     print a general education table, rule B reads each as a general-education page, and unpinned neither is a
     candidate; pinned, each binds (RC.PIN_HEADING). Powerplant certificate 22394's pin binds, and a pin to the
     Airframe & Powerplant certificate's page or to the Powerplant A.S. page is refused on its heading.
  3. The forced re-reads (04007, 33569; their pages are unchanged since the filed extraction): each pinned page's
     text, as the capture reads it, carries the REQUIREMENTS tab and fits the text the capture sends (TEXT_CAP).
  4. Each named gap states only what its page prints: the page prints the program's Control Number (or, for
     successor_printed, the other one its note names), and names fewer than half of the state's listed courses (a pin
     there would be refused); a list_printed_as_range page prints its range; a list_by_reference page names the
     awards whose listed courses are the ones it leaves out.
  5. The lever's members (pinned here, never read from the live census) are each a pin or a named gap, once.
  6. The Next wave: Moorpark's and Pasadena City's pins bind on their own pages, marked; the named gaps at Moorpark
     and North Orange Continuing Education state only what their pages print; each member is a pin, a gap or held.
  7. The title cut's self-recall on Orange Coast's 255 filed own pages: none stops naming its program, 23 more do, and
     no own page names another program.
The pages are in tests/fixtures/program_requirements_lever_pins_s727.json.gz. Pure stdlib.
"""
import gzip
import json
import os
import re
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
with open(os.path.join(ROOT, "kb", "program_requirements_college", "orange_coast", "sources.json")) as fh:
    OCC_SOURCES = json.load(fh)
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
    if g["reason"] == "list_by_reference":
        # The listed courses the page leaves out are the listed courses of the awards it names (their filed sources'
        # codes, kb/program_requirements_college/orange_coast/sources.json), and it names each of those awards.
        src = {x["control_number"]: x for x in OCC_SOURCES}
        ref = set().union(*(set(src[r].get("codes_found") or []) for r in g["by_reference"]))
        left = {C.P.norm_code(c) for c in FIX["programs"][cn]["codes"]} - set(found)
        ok = (ok and "Complete a specialization certificate listed below" in body and left and left <= ref
              and all(src[r]["title"] in body for r in g["by_reference"]))
    check(ok, "4 %s (%s): its page prints Control Number %s and names %d of %d listed courses; a pin there is refused "
              "(%s)" % (cn, g["reason"], printed, len(found), len(FIX["programs"][cn]["codes"]), r.get("why")))

# ── 5. the lever's members ──────────────────────────────────────────────────────────────────────
both = set(pins) & set(gaps)
check(not both and set(pins) | set(gaps) == set(LEVER) and FORCED <= set(pins),
      "5 pins %d and named gaps %d cover the lever's %d once each (%s)" % (len(pins), len(gaps), len(LEVER), sorted(both)))

# ── 6. the Next wave: Moorpark's and Pasadena City's pins, and the named gaps at Moorpark and NOCE ──────
WAVE_LEVER = {"Moorpark College": "12383 43405 45352", "Pasadena City College": "31599 33404 33699",
              "North Orange Continuing Education": "38320 39325 39625 46253"}
WAVE_HELD = {"Pasadena City College": {"31599"}}   # its own page prints no award word beside its title (rule A)
for college, part in sorted(FIX["wave"].items()):
    wpages = [page(u, p) for u, p in part["pages"].items()]
    wpins = C.site_pin_entries(college)

    def wprog(cn, marked=True):
        p = part["programs"][cn]
        return {"control_number": cn, "title": p["title"], "award": p["award"], "shape": "x", "status": "Active",
                "closed_list": [{"code": c} for c in p["codes"] or []], "load_id": "1", C.RC.MARK: marked}
    got = C.site_pinned([wprog(cn) for cn in part["programs"]], wpages, wpins)
    bad = [cn for cn in wpins if not (((got.get(cn) or {}).get("best") or {}).get("coverage", 0) >= C.P.ACCEPT_SHARE
                                      and got[cn]["best"]["url"] == part["pins"][cn] != part["programs"][cn]["filed_url"])]
    check(set(wpins) == set(part["pins"]) and not bad,
          "6 %s: each of its %d pins %s binds on its own page, never the filed one, marked (%s)"
          % (college, len(wpins), sorted(wpins), bad))
    ng_path = os.path.join(ROOT, "kb", "program_requirements_college", part["slug"], "named_gaps_s727.json")
    wgaps = {}
    if os.path.isfile(ng_path):
        with open(ng_path) as fh:
            ng = json.load(fh)
        wgaps = {g["control_number"]: g for g in ng["programs"]}
        check(all(g["reason"] in ng["reasons"] for g in wgaps.values()),
              "6 %s: each named gap's reason is defined (%s)" % (college, sorted(wgaps)))
    for cn, g in sorted(wgaps.items()):
        texts = [part["pages"][u] for u in part["gap_pages"].get(cn, [])]
        if g["reason"] == "successor_printed":
            nums = [s.strip() for s in g["successor"].split(",")]
            ok = (all(any("3P%s" % n in t["text"] for t in texts) for n in nums)
                  and not any("3P%s" % cn in t["text"] for t in texts))
        elif g["reason"] == "noncredit_not_in_catalog":
            words = {"38320": "information worker", "46253": "personal care"}[cn]
            ok = bool(texts) and texts[0]["links"] and not any(words in ln.lower() for ln in texts[0]["links"])
        elif g["reason"] == "credit_not_in_catalog":
            ok = (any(t["status"] == "404" for t in texts)
                  and not any("media arts, associate" in ln.lower() for t in texts for ln in t["links"]))
        else:
            ok = g["reason"] == "ge_pattern_certificate" and len(part["programs"][cn]["codes"] or []) > 100
        check(ok, "6 %s %s (%s): its pages print what its note says" % (college, cn, g["reason"]))
    members = set(WAVE_LEVER[college].split())
    covered = set(wpins) | set(wgaps) | WAVE_HELD.get(college, set())
    check(covered == members and not set(wpins) & set(wgaps),
          "6 %s: pins %d, named gaps %d and held %d cover its %d on the lever once each"
          % (college, len(wpins), len(wgaps), len(WAVE_HELD.get(college, ())), len(members)))

# ── 7. the title cut's self-recall on Orange Coast's filed sources ──────────────────────────────
# Each program its filed source read alone from a page at the accept share, with that page's filed title and h1 (the
# banner h1 blanked as the capture's drop_banner_h1 blanks it), tested with TITLE_SPLIT (" < " and the bar) and with
# the bar alone, the cut site_heading_names made before S727. Every page that named its program still does, the cut
# names more of them, and no own page names another program.
rpages, on_page, rprogs = {}, {}, {}
for s in OCC_SOURCES:
    src = s.get("source") or {}
    u = src.get("url")
    if not u or not isinstance(src.get("title"), str):
        continue
    rpages.setdefault(u, {"url": u, "title": src["title"], "h1": src.get("h1") or ""})
    on_page.setdefault(u, []).append(s["control_number"])
    rprogs[s["control_number"]] = {"title": s.get("title"), "award": s.get("award"), "url": u,
                                   "cov": s.get("coverage") or 0}
C.drop_banner_h1(list(rpages.values()))
own = {cn: p for cn, p in rprogs.items() if len(on_page[p["url"]]) == 1 and p["cov"] >= C.P.ACCEPT_SHARE}


def recall():
    named = {cn for cn, p in own.items() if C.site_heading_names(rpages[p["url"]], p)[0]}
    false = [(a, b) for a in own for b in own if a != b and C.site_heading_names(rpages[own[b]["url"]], own[a])[0]]
    return named, false


named_new, false_new = recall()
CUT = C.TITLE_SPLIT
C.TITLE_SPLIT = re.compile(r"\s*\|\s*")
try:
    named_bar, false_bar = recall()
finally:
    C.TITLE_SPLIT = CUT
check(len(own) >= 250 and named_bar <= named_new and len(named_new) - len(named_bar) >= 20 and "33569" in named_new
      and "33569" not in named_bar,
      "7 of Orange Coast's %d filed own pages, %d name their program with TITLE_SPLIT and %d with the bar alone; none "
      "stops (%s), and Geology A.S.-T 33569 is among those it adds" % (len(own), len(named_new), len(named_bar),
                                                                        sorted(named_bar - named_new)))
check(not false_new and not false_bar and len(own) * (len(own) - 1) > 60000,
      "7 no own page names another program: 0 false binds in %d pairs (%s)" % (len(own) * (len(own) - 1), false_new[:5]))

print("\n%d checks, %d failed" % (N[0], len(FAILS)))
sys.exit(1 if FAILS else 0)
