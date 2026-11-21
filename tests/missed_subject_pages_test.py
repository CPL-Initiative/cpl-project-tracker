#!/usr/bin/env python3
"""kb/_file_missed_subject_pages.py: the courses of a subject page the first read missed (S700, #3655).

Failure modes: a course the file already holds filed a second time; a navigation line read as a course; a heading
rule of one college applied to another's page; a page that printed no course dropped from the record; the subject's
name taken from the navigation list instead of the page's own title.

Run from repo root: python3 tests/missed_subject_pages_test.py
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _file_missed_subject_pages as F  # noqa: E402

results = []


def check(name, cond):
    results.append(bool(cond))
    print(("  ok  " if cond else "FAIL  ") + name)


def log(url, title, body):
    return "\n".join(["noise", "##### PAGE 1 · answers: courses · read_at: 2026-11-21T23:00:00Z", "url: " + url,
                      "status: 200", "title: " + title, "--- the capture's text, innerText+tabs, line for line ---"] + body)


CERRITOS = ["Zoology (ZOOL)", "Home›", "Mathematics (MATH & STAT)", "Mathematics (MATH & STAT)", "MATH 80", "4.0 UNITS",
            "Elementary Algebra", "(blank)", "Class Hours: 4.0 Lecture", "Total Contact Hours: 72 Lecture", "(blank)",
            "Prerequisite: MATH 40 or equivalent.", "This course covers algebra.", "Transfer Credit: CSU",
            "STAT C1000", "4.0 UNITS", "Introduction to Statistics", "A first course in statistics.",
            "(blank)", "© 2026-2027 Cerritos College", "(blank)", "Back to top", "MATH 999", "not a course"]
p = F.pages(log("https://x/math/", "Cerritos College Academic Catalog", CERRITOS))
check("a log's page carries its address, status and read time", len(p) == 1 and p[0]["url"] == "https://x/math/" and p[0]["read_at"] == "2026-11-21T23:00:00Z")
name, rows = F.parse_page("cerritos", p[0]["lines"], p[0]["title"])
check("Cerritos: code, units, then title; two codes on one page", [(r["code"], r["units"], r["title"]) for r in rows] ==
      [("MATH 80", "4.0", "Elementary Algebra"), ("STAT C1000", "4.0", "Introduction to Statistics")])
check("a code line with no units line after it is not a course", all(r["code"] != "MATH 999" for r in rows))
check("a requisite is kept whole and leaves the description", rows[0]["requisites"] == ["Prerequisite: MATH 40 or equivalent."] and "Prerequisite" not in rows[0]["description"])
check("the first hours line is hours_printed; a labeled line goes under other", rows[0]["hours_printed"] == "Total Contact Hours: 72 Lecture" and "Transfer Credit: CSU" in rows[0]["other"])
check("a page whose title names the catalog alone takes the heading above its first course", name == "Mathematics")
check("the entry stops at the page's closing line", "©" not in rows[1]["description"])

SW = ["Travel and Tourism (T&T)", "PA 200", "(blank)", "PUBLIC ADMINISTRATION", "(blank)", "3 UNITS", "(blank)", "Grade Only", "(blank)",
      "Lecture 3 hours", "Offered: FALL", "Covers key issues.", "Back to top"]
name, rows = F.parse_page("southwestern", SW, "Public Administration (PA) | Southwestern College Catalog")
check("Southwestern: code, title, then units; grading and hours apart", len(rows) == 1 and rows[0]["title"] == "PUBLIC ADMINISTRATION"
      and rows[0]["units"] == "3" and rows[0]["grading"] == "Grade Only" and rows[0]["hours_printed"] == "Lecture 3 hours")
check("the subject's name is the page title's, never the navigation list's last entry", name == "Public Administration")
check("Cerritos' rule reads no course on a Southwestern page", F.parse_page("cerritos", SW)[1] == [])

LB = ["DSGN 10        3 units", "Survey and Mapping", "36 hours lecture", "Prerequisite: None.", "This course introduces surveying.", "Back to Top"]
name, rows = F.parse_page("long_beach_city", LB, "Design (DSGN) | LBCC")
check("Long Beach City: code and units on one line, the title on the next", len(rows) == 1 and rows[0]["code"] == "DSGN 10"
      and rows[0]["title"] == "Survey and Mapping" and rows[0]["units_line"] == "3 units" and name == "Design")
MP = ["LETP 132 -  Organizational Leadership  (1-4.5 units)  Pass/No Pass (P/NP) Only •  Total hours: 6-56 hours lecture",
      "This course explores leadership.", "Catalog Program Pages Referencing LETP 132"]
name, rows = F.parse_page("monterey_peninsula", MP, "Law Enforcement Training Program (LETP) < Monterey Peninsula College")
check("Monterey Peninsula: code, title and units on one line; the rest of the line opens the entry", len(rows) == 1
      and rows[0]["title"] == "Organizational Leadership" and rows[0]["units"] == "1-4.5"
      and rows[0]["description"].startswith("Pass/No Pass (P/NP) Only") and name == "Law Enforcement Training Program")

report, new = F.add("cerritos", [("1", log("https://x/math/", "Cerritos College Academic Catalog",
                                         ["Accounting (ACCT)", "ACCT 100", "3.0 UNITS", "Introduction to Accounting", "Back to top"]))])
check("a course the file already holds is left as filed, and the page is still reported", new == [] and "1 printed, 0 added" in report[0])
report, new = F.add("cerritos", [("1", log("https://x/zz/", "Cerritos College Academic Catalog", ["Nothing here", "Back to top"]))])
check("a page that printed no course is reported with none", new == [] and "0 printed, 0 added" in report[0])

import gzip, json  # noqa: E402
for slug in ("cerritos", "long_beach_city", "monterey_peninsula", "southwestern"):
    d = json.load(gzip.open(os.path.join(ROOT, F.COURSES, slug + ".json.gz"), "rt", encoding="utf-8"))
    codes = [r["code"] for r in d["rows"]]
    check("%s: no course is filed twice and the count is the rows" % slug, len(codes) == len(set(codes)) == d["courses"] and "missed_pages" in d)

print("%d/%d checks passed" % (sum(results), len(results)))
sys.exit(0 if all(results) else 1)
