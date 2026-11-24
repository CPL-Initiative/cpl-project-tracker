#!/usr/bin/env python3
"""S720's pins: each program the gap census filed under reader_page_assignment at three colleges reads its own section.

    python3 tests/program_requirements_lever_pins_s720_test.py

WHY. The census (run 45319725062) filed 9 Los Angeles Southwest, 6 Mendocino and 6 Santiago Canyon programs whose
extraction placed none of the state's listed courses: the picker handed each a sibling award's section or the course
descriptions. S720 pins 14 of them to their own sections in kb/program_requirements_reconcile.json (pdf_pages: page,
words, through, until) and files 7 as named gaps (named_gaps_s720.json), and pins American River's 5 in its
hand-filed catalog as refiled in S720. The pages are the 2026-27 catalog PDFs as college-page-read run 45341735139
printed them, and American River's as run 45344701810 did (tests/fixtures/program_requirements_lever_pins_s720.json.gz). The
lever's members are pinned here, never read from the live census (p-test-pins-census-members-s714).

  1. Every pin binds on the filed pages, and the window the capture reads (pdf_best, with the college's printed forms
     from with_renumbers and the course-id route) opens on the pin's words, ends before its until words, prints every
     title word and at least the accept share of the listed courses, holds no other pinned program's heading, and is
     not the page the filed record was read from (on Santiago Canyon's, which prints each program's control number
     after it, the window ends at the program's own number).
  2. A degree and its certificate keep their own pages: Mendocino's Administration of Justice A.S. 03454 (p.91) and
     certificate 21973 (p.92); Santiago Canyon's Construction Administration A.S. 11909 (p.406) and certificate 21673
     (p.407) of its accessible file, each closed by its own printed control number.
  3. Santiago Canyon's Public Administration A.S. 42990 prints PASV 150 to 153 and 155 for the state's PBLC codes: the
     course-id route (the Program Course File's own ids) reads them, so its window carries all six.
     3b. Under Santiago Canyon's uniform pdf_numbers_after, capture_pdf itself reads the 3 pins: each source is
     pinned and never after_unbound (S720 second reader, finding 3), so a forced read sends them.
  4. The named gaps: each program once, a defined reason, never pinned, and with the pins they cover the lever's list.
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

FAILS = []
N = [0]


def check(ok, what):
    N[0] += 1
    print(("ok   " if ok else "FAIL ") + what)
    if not ok:
        FAILS.append(what)


FIX = json.load(gzip.open(os.path.join(ROOT, "tests", "fixtures", "program_requirements_lever_pins_s720.json.gz"), "rt",
                          encoding="utf-8"))
STEPS = R.load_steps()
RUN = FIX["run"]
URL = "https://example.edu/c.pdf"
# The census lever's members (run 45319725062), each pinned or a named gap.
LEVER = {
    "Los Angeles Southwest College": ("los_angeles_southwest", "02862 02877 10738 19186 24277 33868 38597 40275 40947"),
    "Mendocino College": ("mendocino", "03454 03461 12278 18732 21973 43366"),
    "Santiago Canyon College": ("santiago_canyon", "11909 18117 18118 21673 37073 42990"),
    "American River College": ("american_river", "16946 18005 20109 20134 44412"),
}


def pages_of(college):
    fx = FIX["colleges"][college]
    return [fx["pages"].get(str(i + 1), "") for i in range(fx["pages_total"])]


def program(college, cn):
    p = FIX["colleges"][college]["programs"][cn]
    prog = {"control_number": cn, "title": p["title"],
            "closed_list": [dict({"code": c}, **({"crsid": p["crsid"][c]} if c in p.get("crsid", {}) else {}))
                            for c in p["codes"]]}
    conf = STEPS.get(college) or {}
    return C.with_renumbers([prog], R.course_renumbers(college), conf.get("prefix_aliases"))[0]


def s720_pins(college):
    return {cn: p for cn, p in ((STEPS.get(college) or {}).get("pdf_pages") or {}).items() if FIX["colleges"][college]["run"] in p.get("evidence", "")}


def flat(s):
    return " ".join(s.split())


windows = {}
# ── 1. every pin binds and reads its own section ──────────────────────────────────────────────
for college in FIX["colleges"]:
    pages, pins = pages_of(college), s720_pins(college)
    check(set(pins) == set(FIX["colleges"][college]["programs"]),
          "%s: the reconcile entry's S720 pins are the fixture's %d programs" % (college, len(pins)))
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
            ("title", title_ok),
            ("share", got["coverage"] >= C.P.ACCEPT_SHARE),
            ("alone", not others),
            # Off the page the filed record was read from, or, where the catalog prints each program's control
            # number after it (Santiago Canyon), on that page but cut at the program's own number.
            ("moved", got["pages"] != [FIX["colleges"][college]["programs"][cn]["filed_page"]]
             or pin.get("until") == "Control Number: %s" % cn)) if not ok]
        if problems:
            bad.append("%s %s" % (cn, problems))
    check(not bad, "%s: each of %d pins opens on its words, ends before its until words, prints its title and the "
                   "accept share, and no other pin's heading (%s)" % (college, len(pins), bad))

# ── 2. a degree and its certificate keep their own pages ───────────────────────────────────────
MEN, SCC = "Mendocino College", "Santiago Canyon College"
deg, cert = windows.get((MEN, "03454")), windows.get((MEN, "21973"))
check(deg and cert and deg[0]["pages"] == [91] and cert[0]["pages"] == [92]
      and "Total Major Units 18" in deg[1] and "Certificate of Achievement" not in deg[1].split("Career")[0][60:]
      and "Total units required for Certificate 30" in cert[1] and "Total Major Units" not in cert[1],
      "Administration of Justice: the A.S. reads p.91 and its 18 major units, the certificate p.92 and its 30")
deg, cert = windows.get((SCC, "11909")), windows.get((SCC, "21673"))
check(deg and cert and deg[0]["pages"] == [406] and cert[0]["pages"] == [407]
      and flat(deg[1]).startswith("Construction Administration for Public Works, AS")
      and flat(cert[1]).startswith("Construction Administration for Public Works, CA")
      and "Control Number" not in deg[1] and "Control Number" not in cert[1] and ", CA" not in deg[1],
      "Construction Administration: the A.S. reads p.406 and the certificate p.407 of the accessible file, each cut at its own control number")

# ── 3. the course-id route reads 42990's PASV codes ──────────────────────────────────────────
pa = windows.get((SCC, "42990"))
printed = {c["code"]: c.get("printed") for c in program(SCC, "42990")["closed_list"]}
check(printed.get("PBLC 150") == "PASV 150" and printed.get("PBLC 154") is None,
      "42990's PBLC 150 is looked for as the Program Course File's PASV 150; PBLC 154, printed as listed, is not (%s)"
      % printed)
check(pa and pa[0]["coverage"] == 1.0, "42990's window places all six listed courses (%s)" % (pa and pa[0]["coverage"]))

# ── 3b. a pin under Santiago Canyon's uniform pdf_numbers_after is bound, never unbound ─────────────────
# capture_pdf reads the college's gate from its entry and the votes from the pages; the fixture holds five pages, so
# the votes are those the entry records for the whole catalog (182 after, 0 before). Before S720's fix every pinned
# source came back after_unbound "no_window", and a forced read kept the failing records it was meant to replace.
import io  # noqa: E402
import tempfile  # noqa: E402
from contextlib import redirect_stdout  # noqa: E402

_votes = (STEPS[SCC].get("pdf_numbers_after_votes") or {})
check(STEPS[SCC].get("pdf_numbers_after") is True and _votes.get("after", 0) >= C.PDF_UNIFORM_AFTER
      and _votes.get("before") == 0, "Santiago Canyon's entry gates pdf_numbers_after on uniform votes (%s)" % _votes)
_pages = pages_of(SCC)
_real_votes, _real_hf, _real_miner = C.pdf_numbers_after, C.read_hand_filed, C.P.pdfminer_pages
C.pdf_numbers_after = lambda pg, programs: dict(_real_votes(pg, programs), after=_votes["after"],
                                                before=_votes["before"], after_mode=True)
C.read_hand_filed = lambda hf: {"url": URL, "access": "hand_filed", "pages": _pages, "extractor": "pypdf"}
C.P.pdfminer_pages = lambda pdf: {"pages": [], "extractor": "pdfminer"}
_progs = [dict(program(SCC, cn), award=FIX["colleges"][SCC]["programs"][cn]["award"], shape="degree", status="Active",
               load_id="1") for cn in sorted(FIX["colleges"][SCC]["programs"])]
_out = tempfile.mkdtemp()
os.makedirs(os.path.join(_out, "sources"))
_report = {}
try:
    with redirect_stdout(io.StringIO()):
        _recs = C.capture_pdf(SCC, _out, _progs, {"catalog_url": URL}, _report,
                              {"meta": {"url": URL, "fetched_by": "test", "fetched_at": "2026-11-24", "sha256": "0"}})
finally:
    C.pdf_numbers_after, C.read_hand_filed, C.P.pdfminer_pages = _real_votes, _real_hf, _real_miner
_na = (_report.get("pdf") or {}).get("numbers_after") or {}
check(_na.get("read") == "number_after" and _na.get("binding") == "number_line",
      "the capture reads Santiago Canyon by the number line, as the live catalog does (%s)" % _na)
check(all(r["method"] == "pdf_pages" and (r.get("source") or {}).get("pinned") is True and not r.get("after_unbound")
          and not (r.get("source") or {}).get("after_unbound") and r["coverage"] >= C.P.ACCEPT_SHARE for r in _recs)
      and len(_recs) == 3,
      "each of the 3 pinned programs reads its pin's window, marked pinned and never after_unbound (%s)"
      % [(r["control_number"], (r.get("source") or {}).get("after_unbound")) for r in _recs])

# ── 4. the named gaps ─────────────────────────────────────────────────────────────────────
for college, (slug, members) in LEVER.items():
    members = set(members.split())
    path = os.path.join(ROOT, "kb", "program_requirements_college", slug, "named_gaps_s720.json")
    gaps = json.load(open(path)) if os.path.exists(path) else {"programs": [], "reasons": {}}
    cns = [p["control_number"] for p in gaps["programs"]]
    pins = set(s720_pins(college))
    check(len(cns) == len(set(cns)) and not set(cns) & pins and set(cns) | pins == members,
          "%s: the %d named gaps and %d pins are the lever's %d programs, each once" % (college, len(cns), len(pins),
                                                                                       len(members)))
    check(all(p["reason"] in gaps["reasons"] for p in gaps["programs"])
          and set(gaps["reasons"]) == {p["reason"] for p in gaps["programs"]}
          and (not cns or (gaps.get("written") and RUN in gaps.get("page_reads", []))),
          "%s: every reason is defined and used, and the file names its page read" % college)

print("\n%d checks, %d failed" % (N[0], len(FAILS)))
sys.exit(1 if FAILS else 0)
