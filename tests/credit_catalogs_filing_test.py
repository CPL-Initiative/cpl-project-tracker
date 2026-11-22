#!/usr/bin/env python3
"""kb/_file_credit_catalogs.py: Santa Ana's and Mt. San Antonio's credit courses filed beside their noncredit rows
(S701, 2026-11-22, #3655).

Failure modes: a program page's course list read as courses; a sentence or requisite that ends on a code read as a
course; a wrapped C-ID parenthetical read as the title; a Formerly line read as the title; a noncredit course filed
twice, lost or changed; a course filed twice; a heading taken from anything but the line above a course's code; the
pages after the credit list read as more credit courses; a refile that moves a byte; the index entry keeping its
"scope" once the whole catalog is read; a noncredit or A to Z page read as a credit subject page.

Run from repo root: python3 tests/credit_catalogs_filing_test.py
"""
import gzip
import json
import os
import shutil
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _file_credit_catalogs as F  # noqa: E402
import _build_noncredit_subject_titles as NT  # noqa: E402

results = []


def check(name, cond):
    results.append(bool(cond))
    print(("  ok  " if cond else "FAIL  ") + name)


def pdf_log(url, pages):
    out = ["noise", "##### PAGE 1 · answers: courses · read_at: 2026-11-22T06:00:00Z", "url: " + url, "status: 200",
           "kind: pdf", "--- 4 of 9 PDF pages (those naming a keyword) ---"]
    for n, lines in pages:
        out.append("[pdf page %d]" % n)
        out += lines
    out.append("=== COLLEGE PAGE READ JSON BEGIN ===")
    return "\n".join(out)


# ── reading a gh log ─────────────────────────────────────────────────────────
GH = ("read\tRead\t﻿2026-11-22T05:56:20.1234567Z Current runner version\n"
      "read\tRead\t2026-11-22T05:56:51.5495338Z ##### PAGE 1 · answers: courses\n"
      "read\tRead\t2026-11-22T05:56:51.5497160Z url: https://x/c.pdf\n")
clean = F.clean_log(GH)
check("a gh log loses its job, step and timestamp, and each PAGE line gains its read time to the second",
      clean.split("\n")[1] == "##### PAGE 1 · answers: courses · read_at: 2026-11-22T05:56:51Z"
      and clean.split("\n")[2] == "url: https://x/c.pdf")
check("a clean log passes through unchanged", F.clean_log(clean) == clean)

# ── Santa Ana ───────────────────────────────────────────────────────────────
SA = "https://x/SAC_Catalog.pdf"
SA_PAGES = [
    (235, ["Santa Ana College 2026-27 Catalog  – 229", "Welding Technology Certificate: Certificate of Achievement",
           "Course  20.0", "WELD 101 Introduction to Welding 3 .0", "WELD 125", "Intermediate Electric Arc Welding",
           "Total: 20 .0"]),
    (236, ["230 – Santa Ana College 2026-27 Catalog", "Accounting (ACCT)", "ACCT 010", "Accounting Procedures",
           "Unit(s): 3 .000 Class Hours: 54 .000 Lecture total .", "This course introduces the accounting cycle.",
           "ACCT 101 (C-ID ACCT 110)", "Financial Accounting", "Unit(s): 4 .000 Class Hours: 72 .000 Lecture total .",
           "Prerequisite: Completion with a grade of “C” or better or a Passing grade in:", "ACCT 010",
           "The study of accounting, as Accounting 101 and",
           "ACCT 015.", "Accounting as a system.", "CSU/UC",
           "Art (ART)", "ART 198", "Topics", "Corequisite: Completion of or concurrent enrollment in: ART 110 or",
           "ART 199", "Topics of special interest.", "CSU", "ARTH C1100 (C-ID ARTH 110)",
           "Survey of Art from Prehistory", "Formerly: Survey of Western Art History I: Prehistory through the Middle",
           "Ages", "Unit(s): 3 .000 Class Hours: 54 .000 Lecture total .", "Art from the caves on.", "CSU/UC"]),
    (237, ["Santa Ana College 2026-27 Catalog  – 231",
           "Mathematics (MATH)", "MATH C2210 (C-ID MATH 210, C-ID MATH 900S = MATH C2210 +", "MATH C2220)",
           "Calculus I: Early Transcendentals", "Unit(s): 4 .000 Class Hours: 72 .000 Lecture total .",
           "Limits and derivatives.", "Sociology (SOC)", "SOC 150 (SOCI 150)", "Intro to Race and Ethnicity",
           "Unit(s): 3 .000 Class Hours: 54 .000 Lecture total .", "Race and ethnicity.",
           "PHAR 072L-1", "Pharmacy Technology Skills Lab", "Unit(s): 0 .500-1 .000 Class Hours: 27 .000-54 .000 Lab total .",
           "Lab hours.", "DNCE 115A .", "Tap Dance Fundamentals I", "Unit(s): 1 .000 Class Hours: 9 .000 Lecture total .",
           "Tap.", "ABE 010", "Money Matters", "Credit(s): 0 .000 Class Hours: 36 .000 Lecture total .",
           "A noncredit course printed in the credit list."]),
    (238, ["Santa Ana College 2026-27 Catalog  – 232", "Campus map", "WELD 101", "Introduction to Welding",
           "Unit(s): 3 .000 Class Hours: 54 .000 Lecture total ."]),
]
SA_PAGES[3] = (239, SA_PAGES[3][1])          # a gap in the run of Unit(s) pages ends the credit list
rows, info = F.build_credit("santa_ana", [("9", pdf_log(SA, SA_PAGES))])
sa = {r["code"]: r for r in rows}
check("Santa Ana: the credit list is the run of Unit(s) pages from the first, ending at the first gap",
      info["span"] == (236, 237) and "WELD 101" not in sa)
check("Santa Ana: a program page's course list is never read as courses", "WELD 125" not in sa)
check("Santa Ana: the courses, each once",
      sorted(sa) == ["ACCT 010", "ACCT 101", "ART 198", "ARTH C1100", "DNCE 115A", "MATH C2210", "PHAR 072L-1",
                     "SOC 150"] and len(rows) == len(sa))
check("Santa Ana: the heading is the line above the code, and names every course of that subject under it",
      sa["ACCT 010"]["subject_name"] == "Accounting" and sa["ACCT 101"]["subject_name"] == "Accounting"
      and sa["ART 198"]["subject_name"] == "Art" and sa["MATH C2210"]["subject_name"] == "Mathematics")
check("Santa Ana: a course whose subject printed no heading is filed with none, never dropped",
      "ARTH C1100" in sa and sa["ARTH C1100"]["subject_name"] is None and sa["PHAR 072L-1"]["subject_name"] is None)
check("Santa Ana: a requisite's code and a sentence ending on a code are no course, and stay in the entry",
      "ACCT 015" not in sa and sa["ACCT 101"]["requisites"][0].endswith("grade in: ACCT 010")
      and "ACCT 015." in sa["ACCT 101"]["description"] and info["codes_without_measure"] >= 1)
check("Santa Ana: the C-ID parenthetical, wrapped or not, is cid and never the title",
      sa["ACCT 101"]["cid"] == "C-ID ACCT 110" and sa["MATH C2210"]["title"] == "Calculus I: Early Transcendentals"
      and sa["MATH C2210"]["cid"] == "C-ID MATH 210, C-ID MATH 900S = MATH C2210 + MATH C2220")
check("Santa Ana: another parenthetical is code_note; a section suffix and a stray period keep the course",
      sa["SOC 150"]["code_note"] == "SOCI 150" and sa["PHAR 072L-1"]["units"] == "0.500-1.000"
      and sa["DNCE 115A"]["title"] == "Tap Dance Fundamentals I")
check("Santa Ana: a Formerly line and its run-on are formerly, never the title",
      sa["ARTH C1100"]["title"] == "Survey of Art from Prehistory"
      and sa["ARTH C1100"]["formerly"].endswith("the Middle Ages"))
check("Santa Ana: a course printed with no measure line after a transfer line is filed, its title the line below",
      sa["ART 198"]["title"] == "Topics" and sa["ART 198"]["units"] is None and sa["ART 198"]["measure_printed"] is None
      and info["measureless_courses"] == 1)
check("Santa Ana: a code line under a requisite that runs on is the requisite's, no course",
      "ART 199" not in sa and sa["ART 198"]["requisites"] == ["Corequisite: Completion of or concurrent enrollment in: "
                                                              "ART 110 or ART 199"])
check("Santa Ana: a Credit(s) course in the credit list is left to the noncredit section",
      "ABE 010" not in sa and info["noncredit_measures_skipped"] == 1)
check("Santa Ana: units, hours, transfer, description apart",
      sa["ACCT 010"]["units"] == "3.000" and sa["ACCT 010"]["hours"] == "54.000"
      and sa["ACCT 010"]["description"] == "This course introduces the accounting cycle."
      and sa["ARTH C1100"]["transfer"] == "CSU/UC" and "CSU" not in sa["ART 198"]["description"])
check("Santa Ana: every row is marked credit and carries its page, source, read time and run",
      all(r["section"] == "credit" and r["source_url"] == SA and r["run"] == "9" and r["read_at"] and r["pdf_page"]
          for r in rows))

# ── Mt. San Antonio ──────────────────────────────────────────────────────────
MT_URL = "https://catalog.mtsac.edu/programs/coursesaz/anat/"


def html_log(pages):
    out = []
    for n, (url, title, lines) in enumerate(pages, 1):
        out += ["##### PAGE %d · answers: courses · read_at: 2026-11-22T06:1%d:00Z" % (n, n), "url: " + url,
                "status: 200", "title: " + title, "--- the capture's text, innerText+tabs, line for line ---"] + lines
    return "\n".join(out)


MT_PAGES = [
    ("https://catalog.mtsac.edu/programs/coursesaz/", "Courses A-Z < Mt. San Antonio College",
     ["ANAT 10A  Not A Course", "4 Units"]),
    ("https://catalog.mtsac.edu/programs/noncredit-programs/adult-continuing-coursesaz/accs/",
     "Access (ACCS) < Mt. San Antonio College", ["ACCS BMS  Basic Math Skills", "0 Units"]),
    (MT_URL, "Anatomy & Physiology (ANAT) < Mt. San Antonio College",
     ["Anatomy & Physiology (ANAT)", "ANAT 10A  Introductory Human Anatomy", "4 Units", "Lecture: 54",
      "Prerequisite: BIOL 1.", "The structure of the body.", "Course Schedule", "ANAT 99  No Units Line", "Text."]),
]
mrows, minfo = F.build_credit("mt_san_antonio", [("7", html_log(MT_PAGES))])
check("Mt. SAC: only credit subject pages are read; the A to Z page and a noncredit page are not",
      [r["code"] for r in mrows] == ["ANAT 10A"] and len(minfo["pages"]) == 1)
check("Mt. SAC: the heading is the page's own title; hours, requisites, description apart; a code with no Units line "
      "is counted", mrows[0]["subject_name"] == "Anatomy & Physiology" and mrows[0]["units"] == "4"
      and mrows[0]["hours"] == "Lecture: 54" and mrows[0]["requisites"] == ["Prerequisite: BIOL 1."]
      and mrows[0]["description"] == "The structure of the body." and minfo["missed"] == 1
      and mrows[0]["section"] == "credit" and mrows[0]["source_url"] == MT_URL)

# ── the file: noncredit rows kept, credit rows added, refile idempotent ─────
tmp = tempfile.mkdtemp()
try:
    os.makedirs(os.path.join(tmp, F.COURSES))
    nc_rows = [{"college": "Santa Ana College", "catalog_year": "2026-2027", "subject": "ABE",
                "subject_name": "Adult Basic Education", "code": "ABE 010", "title": "Money Matters", "hours": "36.000",
                "requisites": [], "description": "Noncredit.", "pdf_page": 435, "source_url": SA, "run": "1"},
               {"college": "Santa Ana College", "catalog_year": "2026-2027", "subject": "ACCT", "subject_name": None,
                "code": "ACCT 010", "title": "A noncredit twin", "requisites": [], "description": "", "run": "1"}]
    old = {"_what": "Credit courses are not in this file.", "fetched_by": "Sky (S700 worker)",
           "fetched_at": "2026-11-22T01:03:47Z", "college": "Santa Ana College", "catalog_year": "2026-2027",
           "source_url": SA, "mark": "m", "how_read": "h", "parsed_by": "p", "subject_headings": {"ABE": "Adult Basic Education"},
           "missed_upper_bound": 2, "not_read": "Only the SCE.", "pages": [{"url": SA, "status": "200"}], "runs": ["1"],
           "courses": 2, "codes_printed_twice": [], "rows": nc_rows}
    with open(os.path.join(tmp, F.COURSES, "santa_ana.json.gz"), "wb") as f:
        f.write(gzip.compress((json.dumps(old, ensure_ascii=False, indent=1) + "\n").encode(), mtime=0))
    with open(os.path.join(tmp, F.COURSES, "index.json"), "w") as f:
        json.dump({"colleges": [{"slug": "santa_ana", "file": "santa_ana.json.gz", "college": "Santa Ana College",
                                 "scope": "School of Continuing Education", "courses": 2}]}, f)
    logs = [("9", pdf_log(SA, SA_PAGES))]
    doc, _ = F.write("santa_ana", logs, root=tmp)
    first = open(os.path.join(tmp, F.COURSES, "santa_ana.json.gz"), "rb").read()
    F.write("santa_ana", logs, root=tmp)
    second = open(os.path.join(tmp, F.COURSES, "santa_ana.json.gz"), "rb").read()
    with gzip.open(os.path.join(tmp, F.COURSES, "santa_ana.json.gz"), "rt") as f:
        back = json.load(f)
    idx = json.load(open(os.path.join(tmp, F.COURSES, "index.json")))["colleges"][0]
    check("the noncredit rows come first, field for field and in their order",
          back["rows"][:2] == nc_rows and all(r.get("section") != "credit" for r in back["rows"][:2]))
    check("a code filed in both sections stays the noncredit row, once",
          [r["code"] for r in back["rows"]].count("ACCT 010") == 1 and back["credit"]["codes_in_both_sections"] == ["ACCT 010"])
    check("no course is filed twice", len({r["code"] for r in back["rows"]}) == len(back["rows"]) == back["courses"])
    check("the noncredit header's own words move under noncredit; the top level describes the whole file",
          back["noncredit"]["not_read"] == "Only the SCE." and back["noncredit"]["runs"] == ["1"]
          and "credit and noncredit" in back["_what"] and back["runs"] == ["1", "9"]
          and back["subject_headings"]["ABE"] == "Adult Basic Education" and back["subject_headings"]["ACCT"] == "Accounting")
    check("the credit pages are pages_added, the noncredit pages stay pages",
          back["pages"] == old["pages"] and back["pages_added"][0]["section"] == "credit")
    check("a refile writes the same bytes", first == second)
    check("the index entry loses its scope and carries the new count and hash",
          "scope" not in idx and idx["courses"] == back["courses"] and len(idx["sha256_uncompressed"]) == 64)
finally:
    shutil.rmtree(tmp)

# ── the committed files ──────────────────────────────────────────────────────
index = json.load(open(os.path.join(ROOT, F.COURSES, "index.json"), encoding="utf-8"))
for slug in ("santa_ana", "mt_san_antonio"):
    with gzip.open(os.path.join(ROOT, F.COURSES, slug + ".json.gz"), "rt", encoding="utf-8") as f:
        d = json.load(f)
    if "credit" not in d:
        continue
    cr = [r for r in d["rows"] if r.get("section") == "credit"]
    nc = [r for r in d["rows"] if r.get("section") != "credit"]
    entry = [c for c in index["colleges"] if c["slug"] == slug][0]
    check("%s: the noncredit rows are the noncredit header's count, ahead of every credit row" % slug,
          len(nc) == d["noncredit"]["courses"] and d["rows"][:len(nc)] == nc and cr and len(cr) == d["credit"]["courses"])
    check("%s: no code twice, every credit row with a code, title and source" % slug,
          len({r["code"] for r in d["rows"]}) == len(d["rows"]) and all(r["code"] and r["title"] and r["source_url"]
                                                                        for r in cr))
    check("%s: the index entry has no scope and matches the file" % slug,
          "scope" not in entry and entry["courses"] == len(d["rows"]))
    prog = {r["code"]: r for r in NT.read_program(ROOT, slug)}
    check("%s: the noncredit title list reads the noncredit rows alone" % slug,
          sorted(prog) == sorted({r["subject"].upper() for r in nc})
          and sum(r["catalog_courses"] for r in prog.values()) == len(nc))

print("\n%d of %d checks passed" % (sum(results), len(results)))
sys.exit(0 if all(results) else 1)
