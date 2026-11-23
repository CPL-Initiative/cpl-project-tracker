#!/usr/bin/env python3
"""S714's Los Rios pins: each program the gap census filed under reader_page_assignment reads its own section.

    python3 tests/program_requirements_rios_pins_s714_test.py

WHY. The census (run 45161770730) filed 22 Sacramento City, 19 Cosumnes River and 3 Folsom Lake programs (and 5 at
American River) whose extraction placed none of the state's listed courses: the picker handed each a sibling award's
section, the department's list of awards or the course descriptions. S714 pins 37 of them to their own sections in
kb/program_requirements_reconcile.json (pdf_pages: page, words, through, until; printed_title once) and files 7 as
named gaps (named_gaps_s714.json; 30620 among them, its pin dropped on PR #3715's second reader). The pages are the hand-filed 2026-27 catalogs as college-page-read run 45167465999
printed them (tests/fixtures/program_requirements_rios_pins_s714.json.gz).

  1. Every pin binds on the filed pages, and the window the capture reads (pdf_best, with the college's printed forms
     from with_renumbers) opens on the pin's words, ends before its until words, prints one total line, every title
     word and at least the accept share of the listed courses, and holds no other pinned program's heading.
  2. A degree and its certificate that share a title keep their own pages: Sacramento City's Mechanical-Electrical
     Technology A.S. 07345 (pp.525-526, its degree requirements) and certificate 23019 (pp.527-528, its certificate
     requirements); and two certificates that share a stem keep their own text where they share a page: Cosumnes
     River's Automotive Heating and Air Conditioning 35363 (Total Units: 17) and its Ford ASSET twin 35358 (13).
  3. until, by itself: it ends the window at the start of its line; words printed nowhere after the opening, or only
     before it, bind nothing; the cut ignores the kept-codes guard that leaves an unpinned window open at the page's
     top; it may end the window on the pinned page though through names a later one. printed_title may drop the
     state title's words and never add one. A pin without until reads exactly as before.
  4. The named gaps: each program once, a defined reason, never pinned, and with the pins it covers the lever's list.
  5. Sacramento City's HVAC pair: the capture looks for HVAC 351 where the file lists MET 351, and the scorer reads a
     placed HVAC code as the listed MET course, never one the file lists as HVAC. Its self-recall: every table row in
     the three MET windows that the scorer renames is checked against the catalog's own MET course description
     (pp.528-533), a field the pair never reads: the same number (or, for OEHS 110, the renumber's MET 350), the same
     title and the same units. 42 rows, 0 wrong.
Pure stdlib.
"""
import gzip
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_requirements_college as C  # noqa: E402
import _program_requirements_reconcile as R  # noqa: E402
import _program_requirements_score as S  # noqa: E402

FAILS = []
N = [0]


def check(ok, what):
    N[0] += 1
    print(("ok   " if ok else "FAIL ") + what)
    if not ok:
        FAILS.append(what)


FIX = json.load(gzip.open(os.path.join(ROOT, "tests", "fixtures", "program_requirements_rios_pins_s714.json.gz"), "rt",
                          encoding="utf-8"))
STEPS = R.load_steps()
RUN = FIX["run"]
TOTAL = re.compile(r"^\s*Total(?: Units|\s*$)", re.M)
URL = "https://example.edu/c.pdf"
# The census lever's members (run 45161770730), each pinned or a named gap.
LEVER = {
    "Sacramento City College": ("sacramento_city", "04670 07334 07345 15498 15573 23005 23019 23027 23035 30361 30407 "
                                "30409 30412 30519 30520 30620 32661 40117 40211 42373 42462 46086"),
    "Cosumnes River College": ("cosumnes_river", "07315 07320 11330 11336 35072 35097 35354 35358 35360 35361 35362 "
                               "35363 35364 35367 35374 35408 37285 37842 39131"),
    "Folsom Lake College": ("folsom_lake", "21193 38898 45568"),
}


def pages_of(college):
    fx = FIX["colleges"][college]
    return [fx["pages"].get(str(i + 1), "") for i in range(fx["pages_total"])]


def program(college, cn):
    p = FIX["colleges"][college]["programs"][cn]
    prog = {"control_number": cn, "title": p["title"], "closed_list": [{"code": c} for c in p["codes"]]}
    conf = STEPS.get(college) or {}
    return C.with_renumbers([prog], R.course_renumbers(college), conf.get("prefix_aliases"))[0]


def s714_pins(college):
    return {cn: p for cn, p in ((STEPS.get(college) or {}).get("pdf_pages") or {}).items() if RUN in p.get("evidence", "")}


def flat(s):
    return " ".join(s.split())


windows = {}
# ── 1. every pin binds and reads its own section ─────────────────────────────────────────────────────────────────
for college in FIX["colleges"]:
    pages, pins = pages_of(college), s714_pins(college)
    check(set(pins) == set(FIX["colleges"][college]["programs"]),
          "%s: the reconcile entry's S714 pins are the fixture's %d programs" % (college, len(pins)))
    bad = []
    for cn, pin in sorted(pins.items()):
        prog = program(college, cn)
        head, why = C.pdf_pinned_heading(pages, prog, pin)
        got = C.pdf_best(URL, pages, prog, prog["closed_list"], "pypdf", head) if head else None
        if not got:
            bad.append("%s refused (%s)" % (cn, why))
            continue
        body = re.sub(r"\[page \d+\]\n", "", got["text"])
        windows[(college, cn)] = (got, body)
        others = [o for o, op in pins.items() if o != cn and flat(op["words"]) in flat(body)]
        title_ok = C._titled(body, [re.compile(r"\b" + re.escape(w) + r"\b") for w in
                                    C.P.title_tokens(pin.get("printed_title") or prog["title"])])
        problems = [k for k, ok in (
            ("opens", flat(body).startswith(flat(pin["words"]))),
            ("until", not pin.get("until") or flat(pin["until"]) not in flat(body)),
            ("one total", len(TOTAL.findall(body)) == 1),
            ("title", title_ok),
            ("share", got["coverage"] >= C.P.ACCEPT_SHARE),
            ("alone", not others),
            ("moved", got["pages"][0] != FIX["colleges"][college]["programs"][cn]["filed_page"]
             or got["pages"] != [FIX["colleges"][college]["programs"][cn]["filed_page"]])) if not ok]
        if problems:
            bad.append("%s %s" % (cn, problems))
    check(not bad, "%s: each of %d pins opens on its words, ends before its until words, prints one total, its title "
                   "and the accept share, and no other pin's heading (%s)" % (college, len(pins), bad))

# ── 2. a degree and its certificate keep their own pages ─────────────────────────────────────────────────────────
SCC, CRC = "Sacramento City College", "Cosumnes River College"
deg, cert = windows.get((SCC, "07345")), windows.get((SCC, "23019"))
check(deg and cert and deg[0]["pages"] == [525, 526] and cert[0]["pages"] == [527, 528]
      and "Degree Requirements" in deg[1] and "Certificate Requirements" not in deg[1]
      and "Certificate Requirements" in cert[1] and "Degree Requirements" not in cert[1]
      and "Mechanical Systems Technician" not in deg[1].split("Total Units")[0][-2000:],
      "Mechanical-Electrical Technology: the A.S. reads pp.525-526 and its degree requirements, the certificate "
      "pp.527-528 and its certificate requirements (%s, %s)" % (deg and deg[0]["pages"], cert and cert[0]["pages"]))
mst = windows.get((SCC, "04670"))
check(mst and mst[0]["pages"] == [526, 527] and "Total Units: 24" in mst[1] and "Total Units: 48" not in mst[1],
      "the Mechanical Systems Technician certificate, printed between them, reads its own 24 units on pp.526-527")
ac, ford = windows.get((CRC, "35363")), windows.get((CRC, "35358"))
check(ac and ford and 189 in ac[0]["pages"] and ford[0]["pages"] == [189]
      and "Total Units: 17" in ac[1] and "Total Units: 13" not in ac[1] and "(Ford ASSET)" not in ac[1]
      and "Total Units: 13" in ford[1] and "Total Units: 17" not in ford[1],
      "Automotive Heating and Air Conditioning and its Ford ASSET twin share p.189 and each reads only its own text")

# ── 3. until, by itself ──────────────────────────────────────────────────────────────────────────────────────────
filler = ["Course descriptions\nWELD 1 Intro (3)"] * 3
page = ("Welding A.S.\nWELD 1 Intro 3\nWELD 5 Pipe 3\nTotal Units: 6\n"
        "Welding Technology Certificate\nCertificate Requirements\nWELD 1 Intro 3\nWELD 2 More 3\nWELD 3 Most 3\n"
        "Total Units: 9\nCareer Information\nWelders.\nWelding Inspection Certificate\nWELD 4 Inspect 3\nTotal Units: 3\n")
pages = filler + [page] + filler
weld = {"control_number": "1", "title": "Welding Technology",
        "closed_list": [{"code": c} for c in ("WELD 1", "WELD 2", "WELD 3", "WELD 5")]}
words = "Welding Technology Certificate Certificate Requirements"
h0, _ = C.pdf_pinned_heading(pages, weld, {"page": 4, "words": words})
plain = C.pdf_best(URL, pages, weld, weld["closed_list"], "pypdf", h0)
check(h0 == {"page": 3, "at": page.index("Welding Technology Certificate"), "pinned": True}
      and plain["text"].startswith("[page 4]\nWelding A.S.") and "Welding Inspection" in plain["text"],
      "3 without until the window is the page from its top, the kept-codes guard leaving the degree above in, as before")
h1, why1 = C.pdf_pinned_heading(pages, weld, {"page": 4, "words": words, "until": "Welding Inspection Certificate"})
cut = C.pdf_best(URL, pages, weld, weld["closed_list"], "pypdf", h1)
body = cut["text"].split("\n", 1)[1]
check(why1 is None and h1["until"] == {"page": 3, "at": page.index("Welding Inspection")} and h1["through"] == 3
      and body.startswith("Welding Technology Certificate") and body.endswith("Welders.\n")
      and cut["pages"] == [4] and cut["coverage"] == 0.75 and "WELD 5" not in body,
      "3 until cuts the window at both named ends, whatever listed codes the lines outside print (%s)" % why1)
for bad, want in ((" ", "names no words"), ("Plumbing Certificate", "are not on PDF page 4 after its words"),
                  ("Welding A.S.", "are not on PDF page 4 after its words")):
    h, w = C.pdf_pinned_heading(pages, weld, {"page": 4, "words": words, "until": bad})
    check(h is None and want in (w or ""), "3 an until of %r binds nothing (%s)" % (bad, w))
two = filler + [page.split("Career Information")[0], "Career Information\nWelders.\nWelding Inspection Certificate\n"] + filler
h2, _ = C.pdf_pinned_heading(two, weld, {"page": 4, "words": words, "through": 5, "until": "Welding Inspection"})
got2 = C.pdf_best(URL, two, weld, weld["closed_list"], "pypdf", h2)
check(got2["pages"] == [4, 5] and got2["text"].rstrip().endswith("Welders."),
      "3 until on the page through names reads across the break and stops at the words (%s)" % got2["pages"])
h3, _ = C.pdf_pinned_heading(pages, weld, {"page": 4, "words": words, "through": 6, "until": "Welding Inspection"})
check(h3 and h3["through"] == 3 and C.pdf_best(URL, pages, weld, weld["closed_list"], "pypdf", h3)["pages"] == [4],
      "3 until printed on the pinned page ends the window there though through names p.6")
web = {"control_number": "2", "title": "CIS - Web Developer", "closed_list": [{"code": "CISW 300"}]}
wp = filler + ["A.S. in Web Developer\nCISW 300 HTML 3\nTotal Units: 3\nNext A.S.\n"] + filler
hw, ww = C.pdf_pinned_heading(wp, web, {"page": 4, "words": "A.S. in Web Developer", "until": "Next A.S."})
hp, wpw = C.pdf_pinned_heading(wp, web, {"page": 4, "words": "A.S. in Web Developer", "until": "Next A.S.",
                                         "printed_title": "Web Developer"})
hx, wx = C.pdf_pinned_heading(wp, web, {"page": 4, "words": "A.S. in Web Developer", "until": "Next A.S.",
                                        "printed_title": "Web Developer Associate"})
check(hw is None and "every title word" in (ww or "") and hp is not None and wpw is None
      and hx is None and "words dropped" in (wx or ""),
      "3 printed_title stands in for the state's title when it drops words, never when it adds one (%s; %s)" % (ww, wx))

# ── 4. the named gaps ────────────────────────────────────────────────────────────────────────────────────────────
for college, (slug, members) in LEVER.items():
    members = set(members.split())
    path = os.path.join(ROOT, "kb", "program_requirements_college", slug, "named_gaps_s714.json")
    gaps = json.load(open(path)) if os.path.exists(path) else {"programs": [], "reasons": {}}
    cns = [p["control_number"] for p in gaps["programs"]]
    pins = set(s714_pins(college))
    check(len(cns) == len(set(cns)) and not set(cns) & pins and set(cns) | pins == members,
          "%s: the %d named gaps and %d pins are the lever's %d programs, each once" % (college, len(cns), len(pins),
                                                                                       len(members)))
    check(all(p["reason"] in gaps["reasons"] for p in gaps["programs"])
          and set(gaps["reasons"]) == {p["reason"] for p in gaps["programs"]}
          and (not cns or (gaps.get("written") and RUN in gaps.get("page_reads", []))),
          "%s: every reason is defined and used, and the file names its page read" % college)

# ── 5. Sacramento City's HVAC pair ───────────────────────────────────────────────────────────────────────────────
met = program(SCC, "04670")
printed = {c["code"]: c.get("printed") for c in met["closed_list"]}
check(printed.get("MET 351") == "HVAC 351" and printed.get("MET 350") == "OEHS 110",
      "the capture looks for HVAC 351 for MET 351 and OEHS 110 for MET 350 (%s)" % printed)
aliases = R.prefix_aliases(SCC)
rec = {"blocks": [{"courses": [{"code": "HVAC 351"}, {"code": "HVAC 388"}, {"code": "OEHS 110"}]}]}
listed = {S.norm_code(c): 1 for c in ("MET 351", "HVAC 388", "MET 350")}
renamed = [c["code"] for c in S.with_prefix_aliases(rec, listed, aliases)["blocks"][0]["courses"]]
check(renamed == ["MET351", "HVAC 388", "MET350"] or [S.norm_code(c) for c in renamed] == ["MET351", "HVAC388", "MET350"],
      "the scorer reads HVAC 351 as MET 351 and OEHS 110 as MET 350, and keeps HVAC 388, which the file lists (%s)"
      % renamed)
# The self-recall: each renamed row against the catalog's own MET description, which the pair never reads.
desc = {}
dl = [ln.strip() for q in sorted(FIX["colleges"][SCC]["description_pages"], key=int)
      for ln in FIX["colleges"][SCC]["description_pages"][q].split("\n")]
for k, ln in enumerate(dl):
    m = re.match(r"^MET (\d+) (.+)$", ln)
    if not m or re.search(r"\s\d+(\.\d+)?$", ln):
        continue
    title, j = [m.group(2)], k + 1
    while j < len(dl) and j < k + 4 and not dl[j].startswith(("Units:", "Same As:")):
        title.append(dl[j])
        j += 1
    while j < len(dl) and not dl[j].startswith("Units:"):
        j += 1
    if j < len(dl):
        desc["MET" + m.group(1)] = ("".join(title).replace("-", "").replace(" ", "").lower(),
                                    dl[j].split(":", 1)[1].strip())
right, wrong = 0, []
for cn in ("04670", "07345", "23019"):
    listed = {S.norm_code(c): 1 for c in FIX["colleges"][SCC]["programs"][cn]["codes"]}
    for ln in windows[(SCC, cn)][1].split("\n"):
        m = re.match(r"^((?:HVAC|OEHS) \d+) (.+?) (\d+(?:\.\d+)?)$", ln.strip())
        if not m:
            continue
        r = {"blocks": [{"courses": [{"code": m.group(1)}]}]}
        to = S.norm_code(S.with_prefix_aliases(r, listed, aliases)["blocks"][0]["courses"][0]["code"])
        if to == S.norm_code(m.group(1)):
            continue          # the file lists the printed code; nothing is renamed
        d = desc.get(to)
        if d and d[0] == m.group(2).replace("-", "").replace(" ", "").lower() and d[1] == m.group(3):
            right += 1
        else:
            wrong.append("%s %s -> %s (%s)" % (cn, m.group(1), to, d))
check(right == 42 and not wrong,
      "the HVAC pair's self-recall: %d renamed rows match the catalog's own MET number, title and units, %d do not %s"
      % (right, len(wrong), wrong[:3]))
check(any(c.get("printed") == "HVAC" and c.get("file") == "MET" and c.get("session") == "S714"
          for c in (STEPS.get(SCC) or {}).get("prefix_aliases_cited") or []),
      "the HVAC pair carries its citation")

print("\n%d/%d checks passed" % (N[0] - len(FAILS), N[0]))
sys.exit(1 if FAILS else 0)
