#!/usr/bin/env python3
"""S739 wave A: the census wave's pins, named gaps and relists at thirteen colleges.

    python3 tests/program_requirements_wave_a_s739_test.py

WHY. The gap census of 2026-11-26 (run 45771011713) lists 28 programs at thirteen colleges on its Next wave. Wave A
read each against the college's own named-gap files first (f-census-ignores-college-named-gaps-s727), then against
its catalog (college-page-read runs 45781997815 and 45783372680):

  1. RELISTS. Eleven are already named in a college's own named-gap file, so no read was sent for them: North Orange
     Continuing Education's 4, Allan Hancock's 2, College of the Redwoods' 2, Los Angeles Harbor's 44947 and
     Moorpark's 2.
  2. PINS. Three were handed a sister award's page and have a page of their own that names every listed course:
     Grossmont's Photography certificate 32879 and Cuesta's CHILD DEVELOPMENT TEACHER 21050 and AVIATION MECHANIC -
     POWERPLANT 43053 (kb/program_requirements_reconcile.json, site_pages). Rule A binds each own heading and refuses
     the heading of the page the filed capture handed it. Copper Mountain's Hospitality Management A.S.-T 41085 is
     pinned to p.106 of the catalog's reissue of 2026-11-18 (pdf_pages); the fixture
     tests/fixtures/program_requirements_copper_41085_s739.json holds that page, less its advisor line.
  3. NAMED GAPS (named_gaps_s739.json, no record, no paid read): three general-education pattern certificates
     (Citrus 45031, Los Angeles Harbor 33797, Los Angeles Pierce 45035); two whose own page names fewer than half of
     the state's listed courses, so a pin would be refused (Bakersfield 09237, 7 of 16; Citrus 11244, 4 of 9);
     Grossmont's English certificate 21402, which names its degree's major; Copper Mountain's Kinesiology A.A.-T
     43132, whose page prints renumbered codes (4 of 11 by code); and Los Angeles Pierce 19181, whose own
     section prints its list as number runs after one subject, so the code net reads 23 of 227 (the fixture
     tests/fixtures/program_requirements_pierce_19181_s739.json holds the section as the page read printed it).
     None is also pinned.
  4. RECORDS. Each record the wave's reads filed was read from the program's own page, places every listed course
     and passes as the live table counts it; a record another branch moves later may also carry a named gap.
Pure stdlib.
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_requirements_college as C  # noqa: E402
import _program_requirements_reconcile as R  # noqa: E402
from _program_requirements_score import passes_live  # noqa: E402

FAILS = []
N = [0]


def check(ok, what):
    N[0] += 1
    print(("ok   " if ok else "FAIL ") + what)
    if not ok:
        FAILS.append(what)


def gaps_file(slug, tag):
    with open(os.path.join(ROOT, "kb", "program_requirements_college", slug, "named_gaps_%s.json" % tag),
              encoding="utf-8") as fh:
        return json.load(fh)


STEPS = R.load_steps()
COA = "Certificate of Achievement requiring 16S/24Q to fewer than 30S/45Q units"

# ── 1. the relists: each is named in its college's own file ────────────────────────────────────────────
RELISTS = (("north_orange_continuing_education", "s727", {"38320", "39325", "39625", "46253"}),
           ("allan_hancock", "s730", {"42208", "42210"}),
           ("college_of_the_redwoods", "s721", {"13559", "30811"}),
           ("los_angeles_harbor", "s727", {"44947"}),
           ("moorpark", "s727", {"12383", "45352"}))
for slug, tag, want in RELISTS:
    named = {g["control_number"] for g in gaps_file(slug, tag)["programs"]}
    check(want <= named, "%s: named_gaps_%s.json already names %s" % (slug, tag, sorted(want)))

# ── 2. the pins: own heading binds, the handed page's heading is refused ───────────────────────────────
GT = " | Grossmont-Cuyamaca Community College District Academic Catalog"
PINS = (
    ("Grossmont College", "32879", "/visual-performing-arts/photography-cert-achievement/",
     {"title": "Photography", "award": COA},
     {"title": "Photography Certificate of Achievement" + GT, "h1": ""},
     {"title": "Photography Associate in Arts" + GT, "h1": ""}),
    ("Cuesta College", "21050", "/30065/30067/30109",
     {"title": "CHILD DEVELOPMENT TEACHER", "award": COA},
     {"title": "CHILD DEVELOPMENT TEACHER - Certificate of Achievement",
      "h1": "CHILD DEVELOPMENT TEACHER - Certificate of Achievement"},
     {"title": "CHILD DEVELOPMENT MASTER TEACHER - Certificate of Achievement",
      "h1": "CHILD DEVELOPMENT MASTER TEACHER - Certificate of Achievement"}),
    ("Cuesta College", "43053", "/30065/30067/30093",
     {"title": "AVIATION MECHANIC - POWERPLANT", "award": COA},
     {"title": "AVIATION MECHANIC - POWERPLANT - Certificate of Achievement",
      "h1": "AVIATION MECHANIC - POWERPLANT - Certificate of Achievement"},
     {"title": "AVIATION MECHANIC - AIRFRAME & POWERPLANT - Certificate of Achievement",
      "h1": "AVIATION MECHANIC - AIRFRAME & POWERPLANT - Certificate of Achievement"}),
)
for college, cn, tail, prog, own, handed in PINS:
    pin = C.site_pin_entries(college).get(cn) or {}
    check(pin.get("url", "").endswith(tail) and "S739" not in pin.get("url", "") and bool(pin.get("evidence")),
          "%s pins %s to its own page (%s)" % (college, cn, tail))
    named, _ = C.site_heading_names(dict(own, url=pin.get("url"), body=""), prog)
    refused, _ = C.site_heading_names(dict(handed, url="https://example.edu/handed", body=""), prog)
    check(named and not refused, "%s: rule A binds its own heading and refuses the page the filed capture handed it" % cn)
check(sorted(C.site_pin_entries("Grossmont College")) == ["32879"]
      and sorted(C.site_pin_entries("Cuesta College")) == ["21050", "43053"],
      "the wave pins these three alone at Grossmont and Cuesta")
check(len((STEPS.get("Grossmont College") or {}).get("steps") or []) == 2
      and (STEPS.get("Cuesta College") or {}).get("steps") == [],
      "Grossmont's two reconcile steps are as they were, and Cuesta's entry holds no step")

# Copper Mountain 41085: a pdf_pages pin to its own page in the catalog's reissue of 2026-11-18 (p.106). It binds on
# the page as the page read printed it, the window is that page from the section's banner, and it names all 5 listed
# courses; on a file whose p.106 does not print the banner and the title's words the pin is refused.
CMC = "Copper Mountain College"
CFIX = json.load(open(os.path.join(ROOT, "tests", "fixtures", "program_requirements_copper_41085_s739.json"),
                      encoding="utf-8"))
cpins = (STEPS.get(CMC) or {}).get("pdf_pages") or {}
cpin = cpins.get("41085") or {}
check(sorted(cpins) == ["41085"] and cpin.get("page") == 106 and "S739" not in cpin.get("words", "")
      and bool(cpin.get("evidence")), "Copper Mountain's reconcile entry pins 41085 alone, to p.106")
cpages = [CFIX["pages"].get(str(i + 1), "") for i in range(CFIX["pages_total"])]
cprog = {"control_number": "41085", "title": "Hospitality Management", "award": "A.S. T Degree",
         "closed_list": [{"code": c} for c in CFIX["codes"]]}
cprog = C.with_renumbers([cprog], R.course_renumbers(CMC), (STEPS.get(CMC) or {}).get("prefix_aliases"))[0]
chead, cwhy = C.pdf_pinned_heading(cpages, cprog, cpin)
check(chead is not None, "41085: the pin's words and every title word print on p.106 (%s)" % cwhy)
cgot = C.pdf_best("https://example.edu/c.pdf", cpages, cprog, cprog["closed_list"], "pypdf", chead) if chead else None
check(bool(cgot) and cgot["pages"] == [106] and cgot["coverage"] == 1.0
      and "MINIMUM TRANSFERABLE UNITS" in cgot["text"],
      "41085: the window is p.106, names all 5 listed courses and holds the 60-unit total (%s)"
      % (cgot and "%s, %s" % (cgot["pages"], cgot["coverage"])))
moved = [""] * 104 + [cpages[105]] + [""] * (len(cpages) - 105)       # the same text one page earlier
check(C.pdf_pinned_heading(moved, cprog, cpin)[0] is None, "41085: a file whose p.106 is another page refuses the pin")

# ── 3. the named gaps: each once, a defined reason, a note, never also pinned ──────────────────────────
NAMED = (("bakersfield", {"09237": "catalog_list_differs"}),
         ("citrus", {"11244": "catalog_list_differs", "45031": "ge_pattern_certificate"}),
         ("copper_mountain", {"43132": "catalog_renumbered"}),
         ("grossmont", {"21402": "certificate_names_the_major"}),
         ("los_angeles_harbor", {"33797": "ge_pattern_certificate"}),
         ("los_angeles_pierce", {"45035": "ge_pattern_certificate", "19181": "list_printed_as_number_run"}))
CONF_KEYS = {"unit_arithmetic", "course_list_match", "ge_pattern", "catalog_year", "source"}
for slug, want in NAMED:
    ng = gaps_file(slug, "s739")
    got = {g["control_number"]: g["reason"] for g in ng["programs"]}
    check(got == want and len(ng["programs"]) == len(want)
          and all(g["reason"] in ng["reasons"] and g.get("note") for g in ng["programs"]),
          "%s: the named gaps are %s, each once with a defined reason and a note" % (slug, sorted(want)))
    check(all(set(g.get("confidence") or {}) == CONF_KEYS
              and all(v is None or (isinstance(v, int) and 0 <= v <= 100) for v in g["confidence"].values())
              for g in ng["programs"]),
          "%s: each named gap carries the five confidence scores, 0 to 100 or none" % slug)
    check(not (set(got) & set(C.site_pin_entries(ng["college"])))
          and not (set(got) & set(((STEPS.get(ng["college"]) or {}).get("pdf_pages") or {}))),
          "%s: no named gap is also pinned" % slug)

# The two catalog_list_differs gaps: the own page's printed list, as the page reads printed it, names fewer than the
# accept share of the state's listed courses, so a site_pages pin would be refused as no candidate.
DIFFERS = (
    ("Bakersfield 09237",
     ["AGBSB2", "AGRIB1", "ANSCB3", "ANSCB4", "ANSCB5", "ANSCB6", "ANSCB7", "ANSCB84", "ANSCB85", "ANSCB86",
      "ANSCB88", "ANSCB90", "ANSCB92", "ANSCB94", "ANSCB96", "NRESB1"],
     "Animal Science Associate of Science (Total 23 - 24)\nCore Courses (Total 11)\n"
     "AGBSB2 - Agricultural Economics\n3\nAGRIB1 - Agriculture, Environment and Society\n3\n"
     "ANSCB1 - Introduction to Animal Science\n3\nAGRIB49 - Agriculture Leadership Training\n2\n"
     "Select two from the following: (Total 6)\nANSCB2 - Beef Production\n3\nANSCB3 - Sheep Production\n3\n"
     "ANSCB4 - Dairy Production\n3\nANSCB5 - Swine Production\n3\nANSCB10 - Horse Production\n3\n"
     "Select two from the following: (Total 6 - 7)\nANSCB6 - Applied Animal Nutrition\n4\n"
     "ANSCB7 - Animal Diseases\n3\nANSCB11 - Livestock Selection/Evaluation\n3\n", 7),
    ("Citrus 11244",
     ["ITIS130", "MATH150", "PUB155", "PUB159", "PUB160", "PUB161", "PUB164", "PUB165", "PUB166"],
     "Code\tTitle\tUnits\nRequired courses:\nPUB 151\tStreet Construction and Maintenance\t3\n"
     "PUB 155\tPublic Works Construction Inspection\t3\nPUB 157\tAsphalt and Portland Cement Concrete\t3\n"
     "PUB 161\tCalifornia Occupational Safety and Health\t3\nPUB 164\tPlan Reading and Cost Estimating\t3\n"
     "PUB 166\tSupervision in Public Works\t3\nTotal Units\t18\n", 4),
)
for name, listed, text, want in DIFFERS:
    found = C.P.find_codes(text, [{"code": c} for c in listed])
    check(len(found) == want and want / len(listed) < C.P.ACCEPT_SHARE,
          "%s: its own page names %d of the %d listed courses, below the accept share (read %d)"
          % (name, want, len(listed), len(found)))

# Los Angeles Pierce 19181: a pin binds its own section's heading, and the code net reads too few of its courses.
FIX = json.load(open(os.path.join(ROOT, "tests", "fixtures", "program_requirements_pierce_19181_s739.json"),
                     encoding="utf-8"))
LAPC = "Los Angeles Pierce College"
pages = [FIX["pages"].get(str(i + 1), "") for i in range(FIX["pages_total"])]
prog = {"control_number": "19181", "title": "General Studies: Arts and Humanities", "award": "A.A. Degree",
        "closed_list": [{"code": c} for c in FIX["codes"]]}
prog = C.with_renumbers([prog], R.course_renumbers(LAPC), (STEPS.get(LAPC) or {}).get("prefix_aliases"))[0]
trial = {"page": 118, "through": 119, "words": "GENERAL STUDIES: ARTS AND", "until": "GENERAL STUDIES: GENDER STUDIES",
         "evidence": "a trial pin, never filed"}
head, why = C.pdf_pinned_heading(pages, prog, trial)
check(head is not None, "19181: a trial pin's words, its until words and every title word print on pp.118-119 (%s)" % why)
got = C.pdf_best("https://example.edu/c.pdf", pages, prog, prog["closed_list"], "pypdf", head) if head else None
check(bool(got) and got["pages"] == [118, 119] and "(STATE CODE 19181)" in got["text"]
      and "EMPHASIS TOTAL UNITS" in got["text"],
      "19181: the window is its own section, pp.118-119, from its state code to its 18-unit total")
check(bool(got) and len(FIX["codes"]) == 227 and got["coverage"] < C.P.ACCEPT_SHARE,
      "19181: the code net reads fewer than the accept share of the 227 listed courses there (%s)"
      % (got and round(got["coverage"], 3)))
check("19181" not in ((STEPS.get(LAPC) or {}).get("pdf_pages") or {}), "19181: the trial pin is not filed")

# ── 4. the records the wave's reads filed ───────────────────────────────────────────────────────────────
RECORDS = (
    # De Anza: found by the capture of 2026-11-11 and never extracted (read 45781602148, load 45787324054).
    ("de_anza", "41327", "/program/film-tv-animation-fall-2024"),
    # Las Positas: each read again from its own entry, whose first read named a total and no course
    # (read 45787030902, load 45787511741).
    ("las_positas", "18813", "/1637/1646"),
    ("las_positas", "36449", "/1853/1858"),
    # Cuesta: read from its own entry on its pin (read 45787691549).
    ("cuesta", "21050", "/30065/30067/30109"),
    # Grossmont: read from its own page on its pin (read 45799536686, load 45802387023).
    ("grossmont", "32879", "/visual-performing-arts/photography-cert-achievement/"),
)
for slug, cn, page in RECORDS:
    path = os.path.join(ROOT, "kb", "program_requirements_college", slug, "records", cn + ".json")
    with open(path, encoding="utf-8") as fh:
        rec = json.load(fh)
    score = rec.get("score") or {}
    cov = score.get("coverage") or {}
    check(page in (rec.get("source_url") or ""), "%s %s: read from its own page (%s)" % (slug, cn, page))
    check(isinstance(rec.get("record"), dict) and cov.get("placed", 0) > 0 and not cov.get("none_placed"),
          "%s %s: the record places its listed courses (%s of %s)" % (slug, cn, cov.get("placed"), cov.get("listed")))
    check(passes_live(score) or bool(score.get("gaps")),
          "%s %s: it passes as the live table counts it, or carries a named gap" % (slug, cn))

# De Anza 31504 is collected with its failing check: read from the Certificate of Achievement-Advanced page, which
# 23067 (64 listed courses) also holds, it places its 12 listed courses and names no total, since its text ends
# mid-list. A later pass may name its gap or read a total; a record that places none again is the wrong record.
with open(os.path.join(ROOT, "kb", "program_requirements_college", "de_anza", "records", "31504.json"),
          encoding="utf-8") as fh:
    rec = json.load(fh)
score = rec.get("score") or {}
cov = score.get("coverage") or {}
check(cov.get("placed") == 12 and cov.get("listed") == 12 and "/program/film-tv-production-fall-2026" in rec["source_url"],
      "de_anza 31504: collected from the page the capture bound it to, 12 of 12 listed courses placed")
check(passes_live(score) or bool(score.get("gaps")) or (score.get("arithmetic") or {}).get("status") == "incomplete",
      "de_anza 31504: its arithmetic is incomplete (no total in its text), or a later pass named its gap or passed it")

# Cuesta 43053 is collected with its failing check: read from its own entry on its pin, it places its 9 listed
# courses, and its units read 20 to 25 against the printed 25, since the page prints 'AVMT 110 (5.0) OR AVMT 110A
# (2.5) AND AVMT 110B (2.5)' and the record files the two halves as two alternatives (its own note says they are
# required as a pair). Its sister 41744 fails the same way. A later step may read the pair as one alternative.
with open(os.path.join(ROOT, "kb", "program_requirements_college", "cuesta", "records", "43053.json"),
          encoding="utf-8") as fh:
    rec = json.load(fh)
score = rec.get("score") or {}
cov = score.get("coverage") or {}
check(cov.get("placed") == 9 and cov.get("listed") == 9 and rec["source_url"].endswith("/30065/30067/30093"),
      "cuesta 43053: collected from its own entry, 9 of 9 listed courses placed")
check(passes_live(score) or bool(score.get("gaps")) or (score.get("arithmetic") or {}).get("status") == "unequal",
      "cuesta 43053: its units read unequal (the paired halves), or a later pass named its gap or passed it")

print("\n%d checks, %d failed" % (N[0], len(FAILS)))
sys.exit(1 if FAILS else 0)
