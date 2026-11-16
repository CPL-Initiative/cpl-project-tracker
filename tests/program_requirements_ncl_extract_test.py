#!/usr/bin/env python3
"""A found page with no closed list, read for its requirements (S668; #3299 slice B, its first part).

WHY. A program the state's Program Course File lists no course for (1,699 Active statewide) has no closed list, so
the capture never read it. Slice A's lookup (ncl_lookup) finds its catalog page by title and award and files the
answer; this part files the found page's text and the codes it names (ncl_source), lists it for the extraction
(would_extract's ncl_found), scores its record without the two checks a list would judge (basis no_state_list), and
holds it from the load until the tab shows it. The failure modes this file guards:

  - a page naming no course (its courses in a tab or a PDF) is never sent, and still reads found
    (d-named-course-minimum-one-s667); a page naming one course is sent (Victor Valley CJ 80's shape);
  - the coarse net's noise ("SB 1440", "PLO 1") never counts as a course: only a college subject does;
  - a record with no closed list never counts passing (passes_live, the tab's rule), is never dropped as placing
    none, and never loads;
  - a closed-list record scores exactly as before (one pilot record's whole score pinned);
  - the named-course net's self-recall on the committed records stays at its floor
    (p-new-matcher-needs-self-recall-test-s652).

Run from repo root: python3 tests/program_requirements_ncl_extract_test.py
"""
import glob
import hashlib
import json
import os
import shutil
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_requirements_college as C  # noqa: E402
import _program_requirements_pilot as P  # noqa: E402
import _program_requirements_score as S  # noqa: E402

failures, checks = [], [0]


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


COLLEGE = "Test College"
REG = {"catalog_url": "https://catalog.test.edu/", "catalog_year": "2026-2027", "catalog_platform": "custom_html"}


def prog(cn, title, award, codes=()):
    return {"control_number": cn, "title": title, "award": award, "status": "Active", "shape": "degree",
            "load_id": 1, "closed_list": [{"code": c, "title": "", "units": 3} for c in codes]}


def page(url, h1, body):
    got = {"final_url": url, "title": h1, "h1": h1, "body": body, "content": body, "status": 200, "access": "ok",
           "links": []}
    return {"url": url, "title": h1, "h1": h1, "body": body, "content": body, "got": got, "codes": C.page_net(got)}


# The college's closed lists name its subjects: ACCT, BUS, CJ, MATH and STAT (a C-ID number, STAT C1000).
PROGRAMS = [
    prog("10001", "Business Administration", "A.S. Degree", ["BUS 100", "BUS 120", "ACCT 100", "STAT C1000"]),
    prog("10002", "Administration of Justice", "A.S. Degree", ["CJ 1", "CJ 2", "MATH 110"]),
    prog("20001", "Accounting", "A.S. Degree"),
    prog("20002", "Real Estate", "Certificate of Achievement"),
    prog("20003", "Basic Peace Officer", "Certificate of Achievement"),
]
BY_CN = {p["control_number"]: p for p in PROGRAMS}
BUS_URL = "https://catalog.test.edu/programs/business-administration-as.php"
ACCT_URL = "https://catalog.test.edu/programs/accounting-as.php"
RE_URL = "https://catalog.test.edu/programs/real-estate-ca.php"
CJ_URL = "https://catalog.test.edu/programs/basic-peace-officer-ca.php"
PAGES = [
    page(BUS_URL, "Business Administration, A.S.",
         "Business Administration A.S.\nRequired courses\nBUS 100 Introduction to Business 3\nBUS 120 Business Law 3\n"
         "ACCT 100 Bookkeeping 3\nSTAT C1000 Introduction to Statistics 4\nTotal Units 13"),
    # A found no-list page naming two courses, beside the net's noise: the law an ADT page cites, an outcome's label
    # and the college's address.
    page(ACCT_URL, "Accounting, A.S.",
         "Accounting A.S.\nThis degree meets SB 1440.\nProgram Requirements\nACCT 101 Financial Accounting 4\n"
         "BUS 120 Business Law 3\nTotal Units 7\nPLO 1: prepare financial statements.\nSan Bruno, CA 94066"),
    # A found no-list page naming no course: its courses sit in a tab the capture did not read.
    page(RE_URL, "Real Estate, Certificate of Achievement",
         "Real Estate Certificate of Achievement\nSee the Requirements tab. Per SB 1440 and PLO 1.\nSan Bruno, CA 94066"),
    # A one-course certificate (Victor Valley CJ 80's shape, d-named-course-minimum-one-s667).
    page(CJ_URL, "Basic Peace Officer, Certificate of Achievement",
         "Basic Peace Officer Certificate of Achievement\nRequired course\nCJ 80 Basic Peace Officer Academy 6\n"
         "Total Units 6"),
]


def lookup_recs():
    """The records as capture() holds them after the lookup: closed-list ones from their pages, the rest filed
    no_closed_list with their answer."""
    recs = []
    for p in PROGRAMS:
        if p["closed_list"]:
            pg = PAGES[0] if p["control_number"] == "10001" else None   # Administration of Justice: no page read
            if pg:
                fb = P.find_codes(pg["body"], p["closed_list"])
                best = {"url": pg["url"], "coverage": P.coverage(fb, p["closed_list"]), "found": fb,
                        "text": pg["body"], "field": "innerText", "got": pg["got"], "label": {"title": 1.0}}
                recs.append(C.source_record(COLLEGE, p, REG, best, "sitemap_page"))
            else:
                recs.append(C.source_record(COLLEGE, p, REG, None, "not_found"))
            continue
        r = C.source_record(COLLEGE, p, REG, None, "no_closed_list")
        url = {"20001": ACCT_URL, "20002": RE_URL, "20003": CJ_URL}[p["control_number"]]
        r["catalog_lookup"] = {"result": "found", "page": {"url": url, "h1": "x", "awards": ["as"]}}
        recs.append(r)
    return recs


# ── capture: the found page's source ──────────────────────────────────────────────────────────────────────
subjects = C.college_subjects(PROGRAMS)
check(subjects == {"BUS", "ACCT", "STAT", "CJ", "MATH"},
      "the college's subjects are every closed list's, a C-ID number's C set aside (STAT C1000 is STAT's): %r"
      % sorted(subjects))
acct_page = PAGES[1]
check({"SB1440", "PLO1"} <= acct_page["codes"],
      "the capture's coarse net reads the law an ADT page cites and an outcome's label as codes: %r"
      % sorted(acct_page["codes"]))
env = os.environ.get(C.NCL_EXTRACT_ENV)

# ── THE PRECONDITION FOR TURNING NCL_EXTRACT ON (S668 second reader on #3414) ────────────────────────────────────
# kb/_build_roep_display.py must leave out a record read with no state list (its synthetic x_20001 reached
# cpl_pathways_roep_data.js). Until it does, the runner refuses NCL_EXTRACT=1: nothing is filed or sent. This check
# fails if the switch is ever honored while the display build would show such a record.
os.environ[C.NCL_EXTRACT_ENV] = "1"
C._NCL_REFUSAL_SAID[0] = True   # the refusal's warning is the runner's; the test reads the answer
holds = C.display_holds_no_state_list()
check(C.ncl_extract_on() == holds,
      "NCL_EXTRACT=1 is honored only once the display build holds a no_state_list record out (it holds: %s)" % holds)
if not holds:
    print("precondition unmet: kb/_build_roep_display.py would show a no_state_list record, so the runner refuses "
          "NCL_EXTRACT=1")
# The rest of this file reads the switch as the runner will once the precondition holds.
REAL_PROBE = C.display_holds_no_state_list
C.display_holds_no_state_list = lambda: True

# With NCL_EXTRACT off (the default until the function's version 13 deploys), the records and their files stay as
# before slice B (the Commons reads a filed source's address as the program's page; S668 second reader on #3414):
# the found pages are read for the account alone.
os.environ[C.NCL_EXTRACT_ENV] = "0"
recs_off = lookup_recs()
before = json.dumps(recs_off, sort_keys=True)
test_off, read_off = C.ncl_read_found(COLLEGE, recs_off, PROGRAMS, PAGES, REG)
check(json.dumps(recs_off, sort_keys=True) == before and sorted(r["control_number"] for r in read_off)
      == ["20001", "20002", "20003"] and all(r.get("ncl_source") for r in read_off),
      "with the switch off, no record changes, and the three found pages come back for the account alone")
os.environ[C.NCL_EXTRACT_ENV] = "1"
recs = lookup_recs()
test, read_on = C.ncl_read_found(COLLEGE, recs, PROGRAMS, PAGES, REG)
by = {r["control_number"]: r for r in recs}
check(test == test_off and read_on == [] and [r for r in recs if r.get("ncl_source")] == read_off,
      "the switch changes where the found pages go (the records, or the account alone), never what is read or measured")
a = by["20001"]
check(a["method"] == "no_closed_list" and a.get("ncl_source") is True and a["source"]["url"] == ACCT_URL
      and a["coverage"] == 0.0 and a["codes_found"] == [] and a["catalog_lookup"]["result"] == "found",
      "a found no-list page files its source beside the answer; method stays no_closed_list, coverage 0.0 and no "
      "listed code found: %r" % {k: a.get(k) for k in ("method", "ncl_source", "coverage", "codes_found")})
check(a["codes_named"] == ["ACCT101", "BUS120"],
      "codes_named holds the codes the page prints under the college's subjects, never SB 1440 or PLO 1: %r"
      % a["codes_named"])
check("ACCT 101 Financial Accounting" in a["text"] and "BUS 120" in a["text"] and a["source"]["text_from"],
      "the text window holds the page's requirements, as a closed-list program's does")
r2 = by["20002"]
check(r2.get("ncl_source") and r2["codes_named"] == [] and r2["catalog_lookup"]["result"] == "found",
      "a found page naming no course has codes_named [] and its answer still reads found: %r" % r2.get("codes_named"))
r3 = by["20003"]
check(r3["codes_named"] == ["CJ80"] and C.ncl_extractable(r3),
      "a one-course certificate page names its one course and is extractable (Victor Valley CJ 80's shape)")
check(by["10001"].get("ncl_source") is None and by["10001"]["method"] == "sitemap_page",
      "a closed-list program's source is untouched")
check(test == {"programs": 1, "listed_found": 4, "named": 4, "recall": 1.0},
      "the capture measures the named-course net on its own closed-list pages (the self-recall): %r" % test)

# ── the extraction's one rule and would_extract ───────────────────────────────────────────────────────────
tmp = tempfile.mkdtemp()
try:
    os.environ[C.NCL_EXTRACT_ENV] = "0"
    check(not C.extractable(a, 0.5) and C.extractable(by["10001"], 0.5),
          "with NCL_EXTRACT off (the default until the function's version 13 deploys) only closed-list windows go")
    off = C.would_extract(COLLEGE, recs_off, folder=tmp, ncl=read_off)
    check(off["ncl_found"]["sent"] is False and off["ncl_found"]["programs"] == 2
          and off["ncl_found_no_course"]["programs"] == 1 and [x["control_number"] for x in off["list"]] == ["10001"],
          "would_extract lists the found pages from the account whether or not this run sends them: %r"
          % off["ncl_found"])
    os.environ[C.NCL_EXTRACT_ENV] = "1"
    check(C.extractable(a, 0.5) and C.extractable(r3, 0.5) and not C.extractable(r2, 0.5),
          "with NCL_EXTRACT on, a found page naming at least one course goes; one naming none never does")
    wx = C.would_extract(COLLEGE, recs, folder=tmp)
    check(wx["ncl_found"]["sent"] is True and [x["control_number"] for x in wx["ncl_found"]["list"]] == ["20001", "20003"]
          and wx["ncl_found_no_course"]["programs"] == 1
          and wx["ncl_found_no_course"]["list"][0]["control_number"] == "20002",
          "ncl_found lists the two pages naming a course, ncl_found_no_course the one naming none: %r"
          % {k: wx[k] for k in ("ncl_found", "ncl_found_no_course")})
    check([x["control_number"] for x in wx["list"]] == ["10001"],
          "the closed-list list is unchanged: no found no-list page joins it: %r" % wx["list"])
    # A later capture of the same page, naming the same codes, keeps the filed record (unchanged and filed_from).
    os.makedirs(os.path.join(tmp, "records"))
    json.dump([dict({k: a.get(k) for k in ("control_number", "source", "coverage", "codes_found")},
                    ncl_source=True, codes_named=a["codes_named"])], open(os.path.join(tmp, "sources.json"), "w"))
    json.dump({"record": {"blocks": []}, "source_url": ACCT_URL}, open(os.path.join(tmp, "records", "20001.json"), "w"))
    again = C.would_extract(COLLEGE, recs, folder=tmp)
    check(again["ncl_found"]["kept"] == 1 and [x["control_number"] for x in again["ncl_found"]["list"]] == ["20003"],
          "a found page read again with the same codes keeps its filed record and is not sent twice: %r"
          % again["ncl_found"])
    moved = dict(a, codes_named=a["codes_named"] + ["ACCT102"])
    check(not C.unchanged(json.load(open(os.path.join(tmp, "sources.json")))[0], moved),
          "a found page naming other codes is read again")
finally:
    if env is None:
        os.environ.pop(C.NCL_EXTRACT_ENV, None)
    else:
        os.environ[C.NCL_EXTRACT_ENV] = env
    shutil.rmtree(tmp, ignore_errors=True)

# The price step counts the found pages only when the capture sent them (kb/_program_requirements_wave.py).
import _program_requirements_wave as W  # noqa: E402
check(W.ncl_priced(wx) == 2 and W.ncl_priced(off) == 0 and W.ncl_priced({}) == 0,
      "the price counts the found pages the capture sends, and none it does not")
check(W.price(wx["programs"] + W.ncl_priced(wx), 0.08, 40.0, True)["price_usd"] == 0.3,
      "one closed-list window and two found pages at the default rate with the margin price $0.30, under the gate")

# ── scoring: a record with no closed list ─────────────────────────────────────────────────────────────────
record = {"program": {"section_heading": "Program Requirements", "measure": "units",
                      "total_units": {"min": 7, "max": 7}, "open_elective_units": None,
                      "degree_elective_units": {"min": None, "max": None}, "ge_pattern": None,
                      "degree_total": {"min": None, "max": None}, "ge_units": {"min": None, "max": None},
                      "electives_fill_degree": False, "outcomes": [], "careers": []},
          "blocks": [{"name": "Program Requirements", "rule": "all", "minimum": None, "option_group": None,
                      "stated": None,
                      "courses": [{"code": "ACCT 101", "units": 4, "units_max": None, "alternatives": [],
                                   "catalog_addition": True},
                                  {"code": "BUS 120", "units": 3, "units_max": None, "alternatives": [],
                                   "catalog_addition": True}]}],
          "course_outcomes": [], "missing_explained": [], "notes": ""}
sc = S.score(record, [], a["text"], "A.S. Degree")
check(sc["coverage"]["pass"] is None and sc["coverage"]["basis"] == "no_state_list"
      and sc["invented"]["pass"] is None and sc["invented"]["basis"] == "no_state_list",
      "coverage and invented read pass None, basis no_state_list: %r" % {k: sc[k] for k in ("coverage", "invented")})
check(sc["arithmetic"]["status"] == "equal" and sc["repeated"]["pass"] and sc["outcomes"]["pass"]
      and sc["pass_without_list"] is True,
      "the arithmetic, repeats and outcomes are checked as for any record: %r" % sc["arithmetic"])
check(not S.passes_live(sc) and sc["pass"] is None,
      "a record with no closed list never passes live, and its whole pass is no verdict")
flat = {"coverage": sc["coverage"]["pass"], "invented": sc["invented"]["pass"],
        "arithmetic": sc["arithmetic"]["status"]}
check(not S.counts_passing_on_tab(flat), "the tab's rule never counts it passing")
check(not S.places_none(sc), "places_none never drops it: it has no listed course to place")
sc_none = S.score(dict(record, blocks=[]), [], "Real Estate", "Certificate of Achievement")
check(sc_none["coverage"]["basis"] == "no_state_list" and not S.places_none(sc_none),
      "a record placing no course, with no list, is scored on the same basis and never dropped as placing none")

# ── the load holds it until the tab shows it ──────────────────────────────────────────────────────────────
parent = tempfile.mkdtemp()
folder = os.path.join(parent, C.slug_of(COLLEGE))
try:
    os.makedirs(os.path.join(folder, "records"))
    json.dump({"college": COLLEGE, "catalog_year": "2026-2027"}, open(os.path.join(folder, "capture.json"), "w"))
    base = {"college": COLLEGE, "title": "Accounting", "award": "A.S. Degree", "source_url": ACCT_URL,
            "extracted_run": "43900000000", "error": None, "record": record}
    json.dump(dict(base, control_number="20001", score=sc, no_state_list=True),
              open(os.path.join(folder, "records", "20001.json"), "w"))
    # The score's basis alone holds it too, whatever the row carries.
    json.dump(dict(base, control_number="20004", score=sc), open(os.path.join(folder, "records", "20004.json"), "w"))
    closed_sc = {"coverage": {"pass": True, "placed": 4, "listed": 4}, "invented": {"pass": True},
                 "arithmetic": {"status": "equal"}, "pass": True}
    json.dump(dict(base, control_number="10001", score=closed_sc, source_url=BUS_URL),
              open(os.path.join(folder, "records", "10001.json"), "w"))
    rows, skipped = C.load_rows(COLLEGE, folder=folder)
    check([r["control_number"] for r in rows] == ["10001"]
          and {s["control_number"]: s["why"] for s in skipped}
          == {"20001": "no state course list: held until the tab shows it",
              "20004": "no state course list: held until the tab shows it"},
          "the load skips a record read with no state list, with the reason, and loads the closed-list one: %r"
          % skipped)
    summ = C.summarize([dict(base, score=sc, no_state_list=True), dict(base, score=closed_sc)], {"college": COLLEGE})
    check(summ["failed"]["coverage"] == 0 and summ["failed"]["invented"] == 0 and summ["passed_machine_checks"] == 1
          and summ["no_state_list"] == 1 and summ["extracted"] == 1,
          "the summary counts a check not taken as no failure, names the records read with no list, and counts only "
          "closed-list records as extracted (the Commons' Records extracted, beside found): %r" % summ)
finally:
    shutil.rmtree(parent, ignore_errors=True)

# The gap census keeps such a program no_closed_list, read and held, never not_loaded (S668 second reader).
import _harvest_gap_census as G  # noqa: E402
col = {"read": True, "preview_only": False, "methods": {"20001": "no_closed_list"}, "records": {"20001": sc},
       "college": COLLEGE}
for live in (False, True):
    cause, sub = G.assign({"control_number": "20001", "college": COLLEGE}, col, None, live, {})
    check(cause == "no_closed_list" and sub == "read, held until the tab shows it"
          and G.lever_of(cause, sub, COLLEGE, None)[0] == "program_course_file_check",
          "the gap census reads a filed no-list record as no_closed_list, read and held (live=%s): %r"
          % (live, (cause, sub)))
cause, sub = G.assign({"control_number": "20001", "college": COLLEGE}, dict(col, records={}), None, True, {})
check((cause, sub) == ("no_closed_list", None), "one never read stays no_closed_list as before: %r" % ((cause, sub),))

# A reconcile that finds the program now has a list drops the flag (listed_now): it rescored against the list.
flagged = {"control_number": "20001", "no_state_list": True, "score": sc}
check("no_state_list" not in C.listed_now(flagged, {"closed_list": [{"code": "ACCT 101"}]})
      and C.listed_now(flagged, {"closed_list": []}) is flagged and C.listed_now(flagged, None) is flagged
      and C.listed_now({"control_number": "1"}, {"closed_list": [{"code": "X 1"}]}) == {"control_number": "1"},
      "the flag goes only when the fresh source gives the program a closed list")

# ── citations the net reads as codes (S668 second reader on #3414) ───────────────────────────────────────────────
# AB is Auto Body at Allan Hancock, Butte, Cerritos and Palomar, and AB 705 is the placement law; AP 4235 is a district's
# procedure on credit for prior learning. Under those letters a code counts only when the college lists that course.
AB_PROGS = [prog("30001", "Auto Body", "Certificate of Achievement", ["AB 101", "AB 102"]),
            prog("30002", "Accounting", "A.S. Degree", ["AP 120"])]
ab = page("https://catalog.test.edu/programs/collision-repair-ca.php", "Collision Repair",
          "Collision Repair\nAB 101 Auto Body I 4\nAB 140 Frame Repair 3\nPlacement follows AB 705, AB 1705 and AB 928.\n"
          "Credit for prior learning follows AP 4235 and BP 4235. SB 1440. AP 120 Payroll 3")
named = C.ncl_codes_named(ab, C.college_subjects(AB_PROGS), C.college_listed(AB_PROGS))
check(named == ["AB101", "AP120"],
      "under a citation's letters only a listed course counts (AB 101, AP 120); AB 705, AB 1705, AB 928, AP 4235 and "
      "an unlisted AB 140 do not: %r" % named)
check(C.ncl_codes_named(ab, {"MATH"}, set()) == [], "a page naming none of the college's subjects names no course")

# The pilot's real page text (kb/program_requirements_pilot/sources, 22 pages with their closed lists): the net's
# recall of the listed codes the exact search finds there, and how many citation-shaped codes survive the filter.
pilot = os.path.join(ROOT, "kb", "program_requirements_pilot")
by_college = {}
for path in glob.glob(os.path.join(pilot, "sources", "*.json")):
    with open(path) as fh:
        x = json.load(fh)
    by_college.setdefault(x["college"], []).append({"closed_list": x["closed_list"]})
p_listed = p_hits = p_cites = p_raw_cites = p_pages = 0
for path in sorted(glob.glob(os.path.join(pilot, "sources", "*.json"))):
    if not os.path.exists(path.replace("/sources/", "/records/")):
        continue
    with open(path) as fh:
        x = json.load(fh)
    progs = by_college[x["college"]]
    net = {"codes": C.page_codes(x["text"])}
    got = set(C.ncl_codes_named(net, C.college_subjects(progs), C.college_listed(progs)))
    found = set(P.find_codes(x["text"], x["closed_list"]))
    p_pages += 1
    p_listed += len(found)
    p_hits += len(found & got)
    p_cites += sum(1 for c in got if C.code_subject(c) in C.CITATION_SUBJECTS and c not in C.college_listed(progs))
    p_raw_cites += sum(1 for c in net["codes"] if C.code_subject(c) in C.CITATION_SUBJECTS)
check(p_pages == 22 and p_listed == 328 and p_hits >= 323 and p_cites == 0,
      "on the pilot's 22 real pages the net reads %d of the %d listed codes found (floor 323), and %d citation-shaped "
      "codes survive (none may; %d read before the filter)" % (p_hits, p_listed, p_cites, p_raw_cites))

# ── a closed-list record scores exactly as before (S668 pin, measured on main's scorer: 22 of 22 pilot fixtures
# score identically) ──────────────────────────────────────────────────────────────────────────────────────────
pilot = os.path.join(ROOT, "kb", "program_requirements_pilot")
r = json.load(open(os.path.join(pilot, "records", "cerritos_42158.json")))
s = json.load(open(os.path.join(pilot, "sources", "cerritos_42158.json")))
pin = S.score(r["record"], s["closed_list"], s["text"], s.get("award"))
check(hashlib.md5(json.dumps(pin, sort_keys=True).encode()).hexdigest() == "a05c18e397db9b43e01d5cc6e4183e72"
      and pin["pass"] is True and "basis" not in pin["coverage"],
      "Cerritos 42158's closed-list score is unchanged, whole: %s" % hashlib.md5(
          json.dumps(pin, sort_keys=True).encode()).hexdigest())

# ── the named-course net's self-recall on the committed records (p-new-matcher-needs-self-recall-test-s652) ──────
# No committed file holds page text, so the input is each record's codes as the extraction transcribed them from
# its page; the answer held is the listed codes the capture found on that page (sources.json codes_found). Codes a
# page prints in a renumbered or aliased form, or that the transcription left out, read as misses, so this is a
# floor on the net's recall over real pages. Measured S668: 18,652 records, 244,744 of 260,513 codes (93.9%).
NET_RECALL_FLOOR = 0.93
NET_RECORDS_FLOOR = 15000
n_rec = listed = hits = 0
for d in sorted(glob.glob(os.path.join(C.COLLEGE_DIR, "*"))):
    try:
        with open(os.path.join(d, "sources.json")) as fh:
            src = {x["control_number"]: x for x in json.load(fh)}
    except (OSError, ValueError):
        continue
    subj = {C.code_subject(c) for x in src.values() for c in x.get("codes_found") or []} - {None}
    for path in glob.glob(os.path.join(d, "records", "*.json")):
        with open(path) as fh:
            rec = json.load(fh)
        e = src.get(rec.get("control_number"))
        if not e or not isinstance(rec.get("record"), dict) or (e.get("source") or {}).get("url") != rec.get("source_url"):
            continue
        found = set(e.get("codes_found") or [])
        if not found:
            continue
        printed = [x.get("code") or "" for b in rec["record"].get("blocks") or [] for c in b.get("courses") or []
                   for x in [c] + list(c.get("alternatives") or [])]
        named = set(C.ncl_codes_named({"codes": C.page_codes("\n".join(printed))}, subj, found))
        n_rec += 1
        listed += len(found)
        hits += len(found & named)
recall = hits / listed if listed else 0.0
check(n_rec >= NET_RECORDS_FLOOR and recall >= NET_RECALL_FLOOR,
      "the named-course net reads at least %.0f%% of the listed codes the capture found, over at least %d committed "
      "records: %d of %d over %d records (%.3f)" % (NET_RECALL_FLOOR * 100, NET_RECORDS_FLOOR, hits, listed, n_rec,
                                                    recall))

C.display_holds_no_state_list = REAL_PROBE
print("pilot pages: %d of %d listed codes named, %d citation-shaped codes read by the net, %d kept" % (p_hits, p_listed, p_raw_cites, p_cites))

if failures:
    print("FAIL: program requirements ncl extract (%d of %d)" % (len(failures), checks[0]))
    for f in failures:
        print("  -", f)
    sys.exit(1)
print("%d/%d checks passed: program requirements ncl extract (net self-recall %d of %d, %.3f, over %d records)"
      % (checks[0], checks[0], hits, listed, recall, n_rec))
