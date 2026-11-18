#!/usr/bin/env python3
"""The reader's page checks (rules A to D) pick a program's own page by its heading, and leave every other program alone.

WHY. 725 programs sat in the College Data Collection pile "read, but no courses placed" on 2026-11-17: the reader
handed each a page that printed half its course codes, and the page was a sister award's section, a
general-education list or the course descriptions (#3480 Source 7; the rule tests are file set 1 on #3510).
kb/_reader_page_checks.py holds the rules; kb/_program_requirements_college.py applies them to a program whose
filed record places none of its courses. This test ports the Courses bot's two rule tests to fixtures shaped from
its evidence (the committed files keep no catalog text, and today's session fetches no catalog):

  * Mendocino College: Business-Management certificate read from page 117 (no heading) moves to page 121,
    "BUSINESS MANAGEMENT CERTIFICATE OF ACHIEVEMENT"; Theatre Arts A.A. read from page 333 (a general-education
    list) moves to page 222 (rule B, then A);
  * City College of San Francisco: Microsoft Office Specialist no longer matches its own descriptions page,
    page 564 (rule B), and finds its program page;
  * a table-of-contents line is never a heading; "such as" never names an A.S.;
  * rule D is off by default; on, a title no line prints gets the named gap, and a title the contents print does not;
  * a site page: a descriptions page and a sister award's page are refused, the program's own page is read with
    every tab (rule C);
  * scope: only a program whose filed record places none is marked; a general-education pattern program never is;
    an unmarked program reads exactly as before, and CPL_READER_PAGE_CHECKS=0 turns the rules off;
  * the discontinued-program check lists rule D's programs as candidates, never as flags.

Run from repo root: python3 tests/reader_page_checks_test.py
"""
import json
import os
import shutil
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
os.environ.pop("CPL_READER_PAGE_CHECKS", None)
os.environ.pop("CPL_RULE_D_NOT_PRINTED", None)
import _program_requirements_college as C  # noqa: E402
import _program_requirements_pilot as P  # noqa: E402
import _reader_page_checks as RC  # noqa: E402
import _program_discontinued as D  # noqa: E402

checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


def prog(cn, title, award, codes, marked=True):
    return {"control_number": cn, "title": title, "award": award, "shape": "certificate", "status": "Active",
            "closed_list": [{"code": c} for c in codes], "load_id": None, RC.MARK: marked}


def catalog(n, pages):
    """A catalog of n pages, blank but for a running header, with the pages given by number (1-based)."""
    out = ["MENDOCINO COLLEGE CATALOG 2026-2027\n" for _ in range(n)]
    for num, txt in pages.items():
        out[num - 1] = out[num - 1] + txt
    return out


BUS = ["BUS 101", "BUS 102", "BUS 120", "BUS 130"]
THA = ["THA 110", "THA 120", "THA 130", "THA 140"]
GE_PAGE = ("GENERAL EDUCATION PATTERNS\nIGETC Area 1A English Composition\nIGETC Area 1B Critical Thinking\n"
           "Cal-GETC Area 3A Arts\nCSU GE Area 3A Arts: THA 110 Introduction to Theatre 3 units\nTHA 120 Acting I\n"
           "Theatre Arts courses meet Area 3A: THA 130, THA 140\nAssociate in Arts degrees require Area 4\n")
MENDO = catalog(340, {
    117: ("BUSINESS\nThe department offers degrees in management and business.\nBUSINESS ADMINISTRATION ASSOCIATE IN "
          "SCIENCE\nBUS 101 Introduction to Business 3\nBUS 102 Business Law 3\nBUS 120 Management 3\n"
          "BUS 130 Marketing 3\n"),
    121: ("BUSINESS MANAGEMENT CERTIFICATE OF ACHIEVEMENT\nRequired Courses\nBUS 101 Introduction to Business 3\n"
          "BUS 102 Business Law 3\nBUS 120 Principles of Management 3\nBUS 130 Marketing 3\nTotal Units 12\n"),
    222: ("THEATRE ARTS ASSOCIATE IN ARTS\nRequired Courses\nTHA 110 Introduction to Theatre 3\nTHA 120 Acting I 3\n"
          "THA 130 Stagecraft 3\nTHA 140 Theatre Production 3\n"),
    333: GE_PAGE,
    5: ("TABLE OF CONTENTS\nBusiness Management Certificate of Achievement ........ 121\n"
        "Theatre Arts Associate in Arts .......... 222\n"),
})


def run_pdf(program, pages):
    rule = RC.pdf_page(pages, program, "2026-2027")
    best = C.pdf_best("https://example.edu/catalog.pdf", pages, program, program["closed_list"], "pypdf",
                      rule["heading"]) if rule["heading"] else None
    return rule, best


# ── rule A: Mendocino's Business-Management certificate, page 117 to page 121 ────────────────────────────────────
bm = prog("21969", "Business-Management", "Certificate of Achievement requiring 16S/24Q to fewer than 30S/45Q units", BUS)
rule, best = run_pdf(bm, MENDO)
check(rule["page_number"] == 121, "rule A: Business-Management reads page 121, its own heading, got %r" % rule)
check(best and best["pages"][0] == 121 and best["named"] and best["coverage"] == 1.0,
      "rule A: the window opens on page 121 and names every listed code, got %r" % (best and best["pages"]))
check(best and best["text"].split("\n")[1].startswith("BUSINESS MANAGEMENT CERTIFICATE"),
      "rule A: the window's text opens on the program's heading")
check(RC.heading_at(MENDO[116], bm["title"], bm["award"]) < 0, "rule A: page 117 prints no heading of the program")

# ── rule B then A: Theatre Arts A.A., the GE list on page 333 to its own page 222 ───────────────────────────────
ta = prog("03442", "Theatre Arts", "A.A. Degree", THA)
check(RC.page_type(GE_PAGE) == "ge", "rule B: page 333 reads as a general-education page")
check(P.coverage(P.find_codes(GE_PAGE, ta["closed_list"]), ta["closed_list"]) == 1.0,
      "fixture: the GE page prints every listed code, which is why codes alone chose it")
rule, best = run_pdf(ta, MENDO)
check(rule["page_number"] == 222 and best["pages"][0] == 222, "rule B then A: Theatre Arts reads page 222, got %r" % rule)

# A catalog with the GE page alone: rule B refuses its heading-like lines and nothing stands.
only_ge = catalog(340, {333: "THEATRE ARTS\nAssociate in Arts\n" + GE_PAGE})
rule = RC.pdf_page(only_ge, ta)
check(rule["heading"] is None and rule["refused_b"] == 1 and "rule B" in rule["why"],
      "rule B: a heading on a GE page never stands, got %r" % rule)

# ── rule B: CCSF Microsoft Office Specialist and its own descriptions page, page 564 ────────────────────────────
MOS = ["CS 101A", "CS 101B", "CS 101C", "CS 101D", "CS 101E"]
DESC = ("COURSE DESCRIPTIONS\nComputer Science (CS)\n"
        + "".join("CS 101%s Microsoft Office Specialist Part %s 1 unit\nPrerequisite: none. Advisory: CS 100.\n"
                  "Transfer: CSU. Repeatability: 0. Grading: letter.\n" % (x, x) for x in "ABCDE")
        + "These courses prepare for the Microsoft Office Specialist Certificate of Achievement.\n")
OWN = ("MICROSOFT OFFICE SPECIALIST\nCertificate of Achievement\nRequired Courses\n"
       + "".join("CS 101%s Microsoft Office Part %s 1\n" % (x, x) for x in "ABCDE"))
ccsf = ["CCSF CATALOG 2026/27\n"] * 600
ccsf = list(ccsf)
ccsf[563] = ccsf[563] + DESC
ccsf[431] = ccsf[431] + OWN
ms = prog("40432", "Microsoft Office Specialist", "Certificate of Achievement requiring 16S/24Q to fewer than 30S/45Q units", MOS)
check(RC.page_type(DESC) == "descriptions", "rule B: page 564 reads as course descriptions")
check(RC.heading_at(DESC, ms["title"], ms["award"]) >= 0,
      "fixture: page 564 prints the title beside the award, which is why rule A alone would take it")
rule, best = run_pdf(ms, ccsf)
check(rule["page_number"] == 432, "rule B: Microsoft Office Specialist no longer matches page 564, got %r" % rule)
desc_only = list(ccsf)
desc_only[431] = "CCSF CATALOG 2026/27\n"
rule = RC.pdf_page(desc_only, ms)
check(rule["heading"] is None and rule["refused_b"] >= 1, "rule B: with only page 564, no page stands, got %r" % rule)

# ── what never counts as a heading ──────────────────────────────────────────────────────────────────────────────
check(RC.heading_at(MENDO[4], bm["title"], bm["award"]) < 0, "rule A: a table-of-contents line is never a heading")
check(RC.heading_at("Geology\nCourses such as GEOL 101 transfer.\n", "Geology", "A.S. Degree") < 0,
      "rule A: 'such as' never names an A.S.")
check(RC.heading_at("GEOLOGY, A.S.\nGEOL 101\n", "Geology", "A.S. Degree") == 0, "rule A: 'Geology, A.S.' is a heading")
check(RC.heading_at("Geology Associate in Science for Transfer\n", "Geology", "A.S. Degree") < 0,
      "rule A: a transfer degree's heading is never the local A.S.'s")
check(RC.heading_at("Geology A.S.-T Degree\n", "Geology", "A.S. T Degree") == 0, "rule A: 'A.S.-T' names a transfer degree")
check(RC.heading_at("Radiologic Technology (AS)\n", "Radiologic Technology", "A.S. Degree") == 0,
      "rule A: 'Radiologic Technology (AS)' is a heading")

check(RC.heading_at("Viticulture Level 1 - Certificate of Achievement\n", "Viticulture Level 2",
                    "Certificate of Achievement") < 0, "rule A: Level 1's heading is never Level 2's")
check(RC.heading_at("Viticulture Level 2 - Certificate of Achievement\n", "Viticulture Level 2",
                    "Certificate of Achievement") == 0, "rule A: Level 2's own heading stands")
check(RC.heading_at("SPANISH I\nAssociate in Arts\n", "Spanish II", "A.A. Degree") < 0, "rule A: Spanish I is never Spanish II")

# ── rule D: off by default; on, an unprinted title is a named gap ───────────────────────────────────────────────
gone = prog("09001", "Computer Accounting", "Certificate of Achievement requiring 16S/24Q to fewer than 30S/45Q units",
            ["ACCT 101", "ACCT 102"])
rule = RC.pdf_page(MENDO, gone, "2026-2027")
check(rule["heading"] is None and "gap" not in rule and rule["rule"] == "A", "rule D: off by default, got %r" % rule)
os.environ["CPL_RULE_D_NOT_PRINTED"] = "1"
rule = RC.pdf_page(MENDO, gone, "2026-2027")
check(rule.get("gap") == "not printed in the 2026-2027 catalog" and rule["rule"] == "D",
      "rule D: on, a title no line prints gets the named gap, got %r" % rule)
toc_only = catalog(10, {2: "CONTENTS\nComputer Accounting Certificate ........ 9\n"})
check("gap" not in RC.pdf_page(toc_only, gone, "2026-2027"), "rule D: a title the contents print is printed")
del os.environ["CPL_RULE_D_NOT_PRINTED"]

# ── a site catalog: rules B, C and A in candidates() ────────────────────────────────────────────────────────────
ACC = ["ACCT 101", "ACCT 102", "ACCT 103"]


def site(url, h1, body, tabs=()):
    got = {"title": h1 + " | Catalog", "h1": h1, "body": body, "content": body + "".join(t for _, t in tabs),
           "tabPanels": [{"label": l, "text": t} for l, t in tabs]}
    return {"url": url, "title": got["title"], "h1": h1, "body": body, "content": got["content"], "got": got,
            "codes": C.page_net(got)}


acc_codes = "ACCT 101 Financial Accounting 4\nACCT 102 Managerial Accounting 4\nACCT 103 Tax 3\n"
desc_pg = site("https://cat.example.edu/course-descriptions/acct/", "Accounting (ACCT)",
               "".join("%s\nPrerequisite: none\nAdvisory: none\nTransfer: CSU\nGrading: letter\n" % c for c in ACC)
               + "Accounting Certificate of Achievement\n")
as_pg = site("https://cat.example.edu/programs/accounting-as/", "Accounting, A.S.", "Program Requirements\n" + acc_codes)
own_pg = site("https://cat.example.edu/programs/accounting-certificate-achievement/",
              "Accounting, Certificate of Achievement", "Overview: ACCT 101 and ACCT 102 open the program.\n",
              tabs=[("Requirements", "Required Courses\n" + acc_codes + "Total Units 11")])
cert = prog("31000", "Accounting", "Certificate of Achievement requiring 8S/12Q to fewer than 16S/24Q units", ACC)
plain = dict(cert, **{RC.MARK: False})
pages = [desc_pg, as_pg, own_pg]
got = C.candidates(cert, pages)
check([c["url"] for c in got] == [own_pg["url"]], "rules B and A: only the certificate's own page stands, got %r"
      % [c["url"] for c in got])
check(got and got[0]["field"] == "innerText+tabs" and "Total Units 11" in got[0]["text"],
      "rule C: the own page is read with every tab")
before = C.candidates(plain, pages)
check(len(before) >= 2, "scope: an unmarked program keeps today's candidates (%d)" % len(before))
os.environ["CPL_READER_PAGE_CHECKS"] = "0"
off = C.candidates(cert, pages)
check([c["url"] for c in off] == [c["url"] for c in before], "switch: CPL_READER_PAGE_CHECKS=0 reads as today")
check(C.pdf_page_check(bm, MENDO, None, None, {}, None) is None, "switch: off, the PDF checks do not run")
del os.environ["CPL_READER_PAGE_CHECKS"]

# ── capture_pdf's gate: a pin, a code heading, the printed numbers, or no mark keep their own binding ──────────
check(C.pdf_page_check(bm, MENDO, None, None, {}, None) is not None, "gate: a marked program is read by the rules")
check(C.pdf_page_check(dict(bm, **{RC.MARK: False}), MENDO, None, None, {}, None) is None,
      "gate: an unmarked program is read as today")
check(C.pdf_page_check(bm, MENDO, None, None, {"21969": {"page": 3}}, None) is None, "gate: a curator's pin wins")
check(C.pdf_page_check(bm, MENDO, None, None, {}, {"21969": None}) is None, "gate: a code-headed catalog keeps its codes")
check(C.pdf_page_check(bm, MENDO, None, {"uniform": True}, {}, None) is None, "gate: printed numbers keep their binding")

# ── scope: mark() reads the committed records ───────────────────────────────────────────────────────────────────
tmp = tempfile.mkdtemp()
try:
    os.makedirs(os.path.join(tmp, "records"))

    def rec(cn, placed):
        with open(os.path.join(tmp, "records", cn + ".json"), "w") as fh:
            json.dump({"control_number": cn, "score": {"coverage": {"listed": 4, "placed": placed}}}, fh)
    rec("21969", 0)
    rec("03442", 3)
    rec("18118", 0)
    ps = [prog("21969", "Business-Management", "Certificate of Achievement", BUS, None),
          prog("03442", "Theatre Arts", "A.A. Degree", THA, None),
          prog("18118", "IGETC", "Certificate of Achievement", BUS, None),
          prog("55555", "Welding", "A.S. Degree", ["WELD 1"], None)]
    n = RC.mark(ps, tmp)
    check(n == 1 and [p[RC.MARK] for p in ps] == [True, False, False, False],
          "scope: only the record placing none is marked; a placing record, a GE pattern and no record are not, got %r"
          % [p[RC.MARK] for p in ps])

    # ── the discontinued-program check lists rule D's programs as candidates ─────────────────────────────────────
    cap = os.path.join(tmp, "out")
    os.makedirs(os.path.join(cap, "sources"))
    with open(os.path.join(cap, "capture.json"), "w") as fh:
        json.dump({"college": "City College of San Francisco"}, fh)
    with open(os.path.join(cap, "sources", "09001.json"), "w") as fh:
        json.dump({"college": "City College of San Francisco", "control_number": "09001", "title": "Computer Accounting",
                   "method": "not_found", "text": "", "gap": "not printed in the 2026-2027 catalog"}, fh)
    d = D.build([cap], base=tmp)
    check(d["flagged"] == 0 and [r["control_number"] for r in d.get("not_printed") or []] == ["09001"],
          "rule D: the discontinued check lists the program as a candidate, never a flag, got %r" % d.get("not_printed"))
    check("not_printed" not in D.build([], base=tmp), "rule D: with no capture the committed file keeps its shape")
finally:
    shutil.rmtree(tmp)

for f in failures:
    print("FAIL:", f)
print("%d/%d checks passed: reader page checks" % (checks[0] - len(failures), checks[0]))
sys.exit(1 if failures else 0)
