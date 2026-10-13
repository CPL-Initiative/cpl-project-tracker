#!/usr/bin/env python3
"""Guards for kb/_course_outcomes_read.py (S374; Sam, Open Asks Sheet 70 card 3).

The read keeps each course's SLOs exactly as printed, by college and course. The
failure modes these checks pin: an outcome reworded or merged with the next
section, a slice that drops or repeats a course, and a read that writes a table.
Pure-stdlib python.
"""
import importlib.util
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("reader", os.path.join(ROOT, "kb", "_course_outcomes_read.py"))
reader = importlib.util.module_from_spec(spec)
spec.loader.exec_module(reader)

checks = []


def check(name):
    def wrap(fn):
        checks.append((name, fn))
        return fn
    return wrap


RCCD_LIKE = """Course Outline
Student Learning Outcomes: Upon successful completion of the course, students should be able to demonstrate the following skills:
1. Analyze, explain, solve problems and apply the principles of financial accounting.
2. Identify relevant economic data used in manual and computerized systems.

Course Content:
Lecture topics."""


@check("each outcome is kept exactly as printed, with only its list marker removed, and the next section is left out")
def _():
    got = reader.outcomes_of(RCCD_LIKE)
    assert got["shape"] == "list", got
    assert got["heading"] == "Student Learning Outcomes", got
    assert got["lead"].startswith("Upon successful completion of the course"), got
    assert got["outcomes"] == [
        "Analyze, explain, solve problems and apply the principles of financial accounting.",
        "Identify relevant economic data used in manual and computerized systems."], got


TRIAL = os.path.join(ROOT, "kb", "course_outcomes", "trial_38317539422")


def trial_pages():
    import glob
    import gzip
    for path in sorted(glob.glob(os.path.join(TRIAL, "*.html.gz"))):
        yield (os.path.basename(path)[:-8], gzip.open(path, "rt").read(),
               open(path[:-8] + ".txt").read())


@check("on RCCD's outlines the SLOs are read, never the Course Objectives printed before them under the same lead-in")
def _():
    pages = list(trial_pages())
    assert len(pages) == 12, len(pages)
    for name, page_html, text in pages:
        got = reader.outcomes_from_html(page_html)
        assert got and got["shape"] == "list" and got["heading"] == "Student Learning Outcomes", (name, got)
        assert got["lead"].endswith("the following skills:"), (name, got["lead"])
        obj = text[text.index("Course Objectives:"):text.index("Student Learning Outcomes:")]
        for item in got["outcomes"]:
            assert item not in obj, (name, "an objective read as an SLO", item[:80])
        assert reader.outcomes_of(text)["outcomes"][0] == got["outcomes"][0], name
    acc = reader.outcomes_from_html(dict((n, h) for n, h, _ in pages)["ACC_19"])
    assert acc["outcomes"][0] == ("Demonstrate knowledge and ability in preparing income tax returns, "
                                  "through analysis and preparation of financial documents."), acc["outcomes"][0]


@check("an institutional outcome RCCD prints under an SLO is kept as maps_to, not as an SLO")
def _():
    pages = {n: h for n, h, _ in trial_pages()}
    cis = reader.outcomes_from_html(pages["CIS_11"])
    assert len(cis["outcomes"]) == 2 and "Critical Thinking" not in cis["outcomes"], cis
    assert cis["maps_to"] == [[], ["Critical Thinking"]], cis["maps_to"]
    tags = {"Critical Thinking", "Communication Skills", "Information Competency & Technology Literacy"}
    for name, page_html in pages.items():
        assert not tags & set(reader.outcomes_from_html(page_html)["outcomes"]), name


@check("the colleges an integrated outline names as offering the course are read from its College line")
def _():
    texts = {n: t for n, _, t in trial_pages()}
    assert reader.offered_at(texts["ACC_19"]) == ["RIV", "NOR"], reader.offered_at(texts["ACC_19"])
    assert reader.offered_at(texts["CIS_11"]) == ["RIV", "MOV", "NOR"]


@check("a page with no learning outcomes heading at a line start reads none, not a menu item")
def _():
    got = reader.outcomes_of("Home\nCourses, and Student Learning Outcomes are listed below\nCourse Content:\nx")
    assert got["shape"] == "none" and got["outcomes"] == [], got


@check("the slices cover every wanted course once")
def _():
    idx = json.load(open(os.path.join(ROOT, "kb", "course_outline_index", "index_38313849383.json")))
    courses = reader.wanted_courses(idx, ["riverside_city", "moreno_valley", "norco"])
    assert len(courses) == idx["wanted_with_outline"], (len(courses), idx["wanted_with_outline"])
    of = 4
    seen = [c["code"] for part in range(1, of + 1) for i, c in enumerate(courses) if i % of == part - 1]
    assert sorted(seen) == sorted(c["code"] for c in courses) and len(seen) == len(set(seen))


@check("the read loads pages only and never addresses the database")
def _():
    src = open(os.path.join(ROOT, "kb", "_course_outcomes_read.py")).read()
    assert not re.search(r"supabase|/rest/v1|\.rpc\(|PATCH|execute_sql|SUPABASE_", src, re.I), "database address"


def main():
    failed = 0
    for i, (name, fn) in enumerate(checks, 1):
        try:
            fn()
            print("  ok   %d %s" % (i, name))
        except AssertionError as e:
            failed += 1
            print("  FAIL %d %s\n       %s" % (i, name, str(e)[:400]))
    print("\ncourse_outcomes_read_test.py: %d/%d checks passed" % (len(checks) - failed, len(checks)))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
