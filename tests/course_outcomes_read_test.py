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


SD_FIELDS = os.path.join(ROOT, "kb", "course_outcomes", "trial_38350787486")   # All Fields (4)
SD_OUTLINE = os.path.join(ROOT, "kb", "course_outcomes", "trial_38350133448")  # Course Outline Report (493)


def pages_in(folder):
    import glob
    import gzip
    return {os.path.basename(p)[:-8]: (gzip.open(p, "rt").read(), open(p[:-8] + ".txt").read())
            for p in sorted(glob.glob(os.path.join(folder, "*.html.gz")))}


@check("on SDCCD's All Fields report each college's SLOs are kept under its own group, as printed")
def _():
    pages = pages_in(SD_FIELDS)
    assert len(pages) == 12, len(pages)
    geog = reader.groups_from_html(pages["GEOG_101"][0])
    assert [(g["group"], len(g["outcomes"])) for g in geog] == [("Mesa", 4), ("City", 5), ("Miramar", 4)], geog
    assert geog[2]["outcomes"][0].startswith("Compare and Contrast Climate Change: Students will be able"), geog[2]
    libs = reader.groups_from_html(pages["LIBS_101"][0])
    assert libs[1]["outcomes"][2].startswith("Library catalog accessStudents will use"), "as printed, run together"
    phot = reader.groups_from_html(pages["PHOT_100"][0])
    assert [(g["group"], len(g["outcomes"])) for g in phot] == [("City", 5)], "the empty field ahead of the title"
    for name, (page_html, text) in pages.items():
        # The outcomes section only: a college may reuse an objective's words as an SLO
        # (Miramar's HUMA 101), so where a sentence prints decides, not what it says.
        lines = text.split("\n")
        start, stop = lines.index("Student Learning Outcomes"), lines.index("Student Learning Objectives")
        printed = [reader._ws(lines[i + 1]) for i in range(start, stop) if lines[i] == "Outcome Text"
                   and i + 1 < stop and reader._ws(lines[i + 1]) not in ("", "Group Title", "Outcome Text")]
        got = [x for g in reader.groups_from_html(page_html) for x in g["outcomes"]]
        assert got == printed, (name, len(got), len(printed))
        for g in reader.groups_from_html(page_html):
            assert g["fingerprint"] == (reader.fingerprint(g["outcomes"]) if g["outcomes"] else None), name


@check("an SDCCD page that prints objectives only reads no outcomes: All Fields with no group, and the Course Outline Report")
def _():
    fields = pages_in(SD_FIELDS)
    for name in ("AAPI_124", "SDGE_302"):
        got = reader.parse_page(*fields[name])
        assert got["shape"] == "none" and got["groups"] == [] and got["outcomes"] == [], (name, got)
    for name, (page_html, text) in pages_in(SD_OUTLINE).items():
        assert "STUDENT LEARNING OBJECTIVES" in text, name
        got = reader.parse_page(page_html, text)
        assert got["shape"] == "none" and got["outcomes"] == [], (name, got["outcomes"][:2])


@check("RCCD's integrated outline reads as before: no group section, the SLO area")
def _():
    for name, page_html, text in trial_pages():
        got = reader.parse_page(page_html, text)
        assert "groups" not in got and got == {**reader.outcomes_from_html(page_html),
                                               "fingerprint": reader.fingerprint(got["outcomes"])}, name


@check("the slices cover every wanted course once")
def _():
    idx = json.load(open(os.path.join(ROOT, "kb", "course_outline_index", "index_38313849383.json")))
    courses = reader.wanted_courses(idx, ["riverside_city", "moreno_valley", "norco"])
    assert len(courses) == idx["wanted_with_outline"], (len(courses), idx["wanted_with_outline"])
    of = 4
    seen = [c["code"] for part in range(1, of + 1) for i, c in enumerate(courses) if i % of == part - 1]
    assert sorted(seen) == sorted(c["code"] for c in courses) and len(seen) == len(set(seen))


@check("the read and the load run only when the pushed trigger file differs from main's (a merge of main starts nothing)")
def _():
    for name, trigger in (("course-outcomes-read.yml", "kb/course_outcomes/.run"),
                          ("course-outcomes-load.yml", "kb/course_outcomes/.load")):
        text = open(os.path.join(ROOT, ".github", "workflows", name)).read()
        jobs = text.split("\njobs:\n", 1)[1]
        assert jobs.startswith("  gate:\n"), name
        assert "git fetch -q --depth=1 origin main" in jobs and ("git diff --quiet FETCH_HEAD -- %s" % trigger) in jobs, name
        for job in re.findall(r"^  ([a-z_-]+):\s*$", jobs, re.M):
            if job != "gate":
                assert re.search(r"needs: \[?[^\n]*\bgate\b", jobs.split("\n  %s:\n" % job, 1)[1]), (name, job)
        assert "needs.gate.outputs.go == '1'" in jobs, name


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
