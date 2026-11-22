#!/usr/bin/env python3
"""Guards for kb/_course_outcomes_read.py (S374; Sam, Open Asks Sheet 70 card 3).

The read keeps each course's SLOs exactly as printed, by college and course. The
failure modes these checks pin: an outcome reworded or merged with the next
section, a slice that drops or repeats a course, and a read that writes a table.
Pure-stdlib python.
"""
import gzip
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
        slo = {k: v for k, v in got.items() if not k.startswith("objectives")}
        assert "groups" not in got and slo == {**reader.outcomes_from_html(page_html),
                                               "fingerprint": reader.fingerprint(got["outcomes"])}, name


@check("course objectives are read beside the SLOs, each as printed, and end at the next section (Sam, 2026-11-02)")
def _():
    oc = os.path.join(ROOT, "kb", "course_outcomes")
    acc = reader.objectives_of(open(os.path.join(oc, "trial_38317539422", "ACC_19.txt")).read())
    assert acc["objectives"] == ["Prepare State income tax returns for individuals and families with limited income.",
                                 "Prepare Federal income tax returns for individuals and families with limited income."]
    assert acc["objectives_heading"] == "Course Objectives" and acc["objectives_lead"].startswith("Upon successful")
    # The Coast district's numbered list ends before Lecture Content, markers removed.
    cccd = reader.objectives_of(open(os.path.join(oc, "trial_38508460207", "ACCT_C100.txt")).read())
    assert len(cccd["objectives"]) == 17 and cccd["objectives"][0] == "Describe the purpose and process of accounting."
    # SDCCD's two reports print the same objectives: the outline report ends at Section II, the All Fields report
    # keeps each Objective Text field whole (its text breaks CISC 106's long ones across lines).
    for code in ("AAPI_124", "CISC_106", "GEOG_101"):
        a = reader.objectives_of(open(os.path.join(oc, "trial_38350133448", code + ".txt")).read())["objectives"]
        stem = os.path.join(oc, "trial_38350787486", code)
        b = reader.objectives_block(gzip.open(stem + ".html.gz", "rt").read(), open(stem + ".txt").read())
        assert a == b["objectives"], (code, len(a), len(b["objectives"]))
    # Las Positas lists the heading again in its DE section with nothing under it: the first with items wins.
    lp = reader.objectives_of(open(os.path.join(oc, "trial_41595084107", "AF_1.txt")).read())
    assert lp["objectives"][-1].startswith("Perform methods of aerobic assessment"), lp["objectives"][-1]
    assert reader.objectives_of("Student Learning Outcomes:\n1. Do a thing.\nCourse Content:\nx")["objectives"] == []


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


@check("an eLumen college's index names each course's catalog page the way its program pages link it")
def _():
    # College page read 38504338656 (S387): Cabrillo's Astronomy A.S. links ASTRO 8A
    # at 2026-2027/course/astro8a, and the content call for astro3 printed the course.
    ix = reader.elumen_index("cabrillo")
    assert ix["url"].startswith("https://cabrillo.elumenapp.com/catalog/2026-2027/"), ix["url"]
    want = {c["code"]: c for c in reader.wanted_courses(ix, ["cabrillo"])}
    assert want["ASTRO 8A"]["report"] == ("https://api-prod.elumenapp.com/catalog/sites/publish/content/"
                                          "2026-2027,course,astro8a?tenant=cabrillo.elumenapp.com"), want["ASTRO 8A"]
    assert want["ASTRO 8A"]["named_by"] == ["cabrillo"]
    assert reader.host_slug(ix["url"]) == "cabrillo"
    mjc = {c["code"]: c for c in reader.wanted_courses(reader.elumen_index("modesto_junior"), ["modesto_junior"])}
    assert mjc["AG 115"]["report"].endswith("/2026-2027,course,ag115?tenant=mjc.elumenapp.com"), mjc["AG 115"]
    # Palo Verde moved to an Acalog catalog for 2026-2027 (the census of 2026-10-18; S449,
    # S451), so its course pages are no longer eLumen's and the reader says so.
    try:
        reader.elumen_index("palo_verde")
    except SystemExit as exc:
        assert "names no eLumen catalog" in str(exc), exc
    else:
        raise AssertionError("palo_verde reads an Acalog catalog now; the eLumen index must refuse it")


EL_MJC = os.path.join(ROOT, "kb", "course_outcomes", "trial_38505894485")   # Modesto: SLO: over a list
EL_CAB = os.path.join(ROOT, "kb", "course_outcomes", "trial_38506174617")   # Cabrillo: a lead-in over a table


def filed(folder, stem):
    import gzip
    return (gzip.open(os.path.join(folder, stem + ".html.gz"), "rt").read(),
            open(os.path.join(folder, stem + ".txt")).read())


@check("an eLumen course page's outcomes are read from its Learning Outcomes box, as printed (Modesto's list)")
def _():
    got = reader.parse_page(*filed(EL_MJC, "ADJU_201"), "elumen")
    assert got["parsed_from"] == "html" and got["heading"] == "Learning Outcomes" and got["lead"] is None, got
    assert got["outcomes"] == [
        "Describe the origin and history of the Criminal Justice system in the United States.",
        "Explain the functions of the police, courts, and corrections in the United States.",
        "Define the concept of crime and the major theories of criminal behavior."], got


@check("Cabrillo's table rows are outcomes with their numbers removed, its lead-in is kept, and the next accordion's Toggle is never an outcome")
def _():
    got = reader.parse_page(*filed(EL_CAB, "ACCT_151A"), "elumen")
    assert got["parsed_from"] == "html", got
    assert got["lead"] == "Upon successful completion of this course, students should be prepared to:", got
    assert got["outcomes"] == [
        "Analyze and synthesize information necessary to complete the full accounting cycle.",
        "Construct fully classified financial statements for a sole proprietorship in a service and/or "
        "merchandise business."], got
    for folder in (EL_MJC, EL_CAB):
        for name in os.listdir(folder):
            if name.endswith(".html.gz"):
                g = reader.parse_page(*filed(folder, name[:-8]), "elumen")
                assert g["parsed_from"] == "html" and g["outcomes"], (folder, name)
                assert not any(re.match(r"toggle|\d+\.", o, re.I) for o in g["outcomes"]), (name, g["outcomes"])


@check("a Coast district college's index names each course's outline of record by its code, filed under the district")
def _():
    # College page read 38507237083 (S387): Coastline's ACCT C116 at /courses/acct-c116/.
    ix = reader.catalog_index("coastline_community")
    want = {c["code"]: c for c in reader.wanted_courses(ix, ["coastline_community"])}
    assert want["ACCT C116"]["report"] == "https://catalog.cccd.edu/courses/acct-c116/", want["ACCT C116"]
    assert ix["host"] == "cccd" and reader.page_system(want["ACCT C116"]["report"]) == "courseleaf"
    assert reader.page_system(reader.catalog_index("cabrillo")["url"]) == "elumen"


CCCD = os.path.join(ROOT, "kb", "course_outcomes", "trial_38508460207")   # Coastline: outlines of record


@check("a Coast district outline's SLOs are the list under Course Level Student Learning Outcome(s), never its objectives")
def _():
    got = reader.parse_page(*filed(CCCD, "ACCT_C100"), "courseleaf")
    assert got["parsed_from"] == "html" and got["heading"] == "Course Level Student Learning Outcome(s)", got
    assert got["outcomes"] == [
        "Complete an accounting cycle for sole proprietorship according to Generally Accepted Accounting Principles (GAAP).",
        "Analyze and record in applicable journals, post to a general ledger, and prepare financial statements: "
        "Statement of Income, Statement of Owner's Equity, and Balance Sheet.",
        "Generate and record payroll-related transactions in accordance with state and federal laws and regulations."], got
    # A common course number the district files elsewhere answers 404: no outcomes, never a guess.
    assert reader.parse_page(*filed(CCCD, "ARTH_C1100"), "courseleaf")["outcomes"] == []


@check("a CourseLeaf list's first item 'Course outcomes:' is the lead, never outcome 1 (Golden West, S665)")
def _():
    # COBIx on #3389: 3 live Golden West SLO rows (CS G154, ACCT G212, BUS G121) filed it as their first outcome.
    page = ("<div><h3>Course Level Student Learning Outcome(s)</h3><ol><li>Course Outcomes:</li>"
            "<li>Apply complex data storage mechanisms.</li><li>Develop programs that use abstract data structures.</li>"
            "</ol><h3>Course Content</h3></div>")
    got = reader.parse_page(page, "", "courseleaf")
    assert got["lead"] == "Course Outcomes:" and got["outcomes"] == [
        "Apply complex data storage mechanisms.", "Develop programs that use abstract data structures."], got
    # A real outcome that ends in a colon (Orange Coast's MUS A111) stays an outcome.
    real = "Create 2 musical compositions that demonstrate competency in the following techniques:"
    page2 = ("<div><h3>Course Level Student Learning Outcome(s)</h3><ol><li>%s</li><li>Mix a track.</li></ol></div>" % real)
    got2 = reader.parse_page(page2, "", "courseleaf")
    assert got2["lead"] is None and got2["outcomes"][0] == real, got2


@check("the read workflow hands a catalog= (or elumen=) line to the reader in place of an index")
def _():
    wf = open(os.path.join(ROOT, ".github", "workflows", "course-outcomes-read.yml")).read()
    assert "catalog=$(sed -n 's/^catalog=//p' kb/course_outcomes/.run)" in wf
    assert "elumen=$(sed -n 's/^elumen=//p' kb/course_outcomes/.run)" in wf and "catalog=${catalog:-$elumen}" in wf
    assert 'args=(--catalog "$catalog")' in wf


@check("the read loads pages only and never addresses the database")
def _():
    src = open(os.path.join(ROOT, "kb", "_course_outcomes_read.py")).read()
    assert not re.search(r"supabase|/rest/v1|\.rpc\(|PATCH|execute_sql|SUPABASE_", src, re.I), "database address"


SAC = os.path.join(ROOT, "kb", "course_outcomes", "trial_41436124244")   # Santa Ana: report 267, plain fields


@check("Santa Ana's outline prints its SLO heading alone in a section, and the text reader reads the list after it (S549)")
def _():
    got = reader.parse_page(*filed(SAC, "ASL_110"), "curriqunet")
    assert got["lead"] == "At the conclusion of this course, the student should be able to:", got
    assert got["outcomes"] == [
        "Students will utilize American Sign Language to express and receive information about a variety of topics "
        "at a beginner level.",
        "Students will demonstrate accuracy and proficiency in the use of learned structures and vocabulary.",
        "Students will differentiate the unique cultural aspects of American Deaf culture from the unique cultural "
        "aspects of other cultures."], got
    pharm = reader.parse_page(*filed(SAC, "PHAR_048"), "curriqunet")
    assert len(pharm["outcomes"]) == 8 and not any("Course Objectives" in x for x in pharm["outcomes"]), pharm


CUESTA = os.path.join(ROOT, "kb", "course_outcomes", "trial_42573515439")  # All Fields outline, S616


@check("Cuesta's All Fields outline: the SLO block reads though another section holds a data list, and only the labeled lines are objectives")
def _():
    pages = pages_in(CUESTA)
    assert len(pages) == 12, len(pages)
    for name, (page_html, text) in pages.items():
        assert reader.groups_from_html(page_html) is None, name
        got = reader.parse_page(page_html, text)
        lines = text.split("\n")
        start = lines.index("Student Learning Outcomes")
        stop = next(i for i in range(start + 1, len(lines)) if lines[i].strip() == "Course Content")
        printed = [x.strip() for x in lines[start + 1:stop] if x.strip()]
        assert got["outcomes"] == printed, (name, len(got["outcomes"]), len(printed))
        labeled = [x for x in lines if x.startswith("Objective ")]
        assert len(got["objectives"]) == len(labeled), (name, len(got["objectives"]), len(labeled))
        assert not any(x in ("Written/Typed Homework", "Term or Other Papers") for x in got["objectives"]), name


@check("Las Positas' lead-in 'Upon the completion of this course, ...' is the lead, never the first outcome (S664)")
def _():
    # COBIx on #3386: 505 live Las Positas SLO rows filed the lead-in as outcome 1. The filed trial page is the case.
    folder = os.path.join(ROOT, "kb", "course_outcomes", "trial_41595084107")
    text = open(os.path.join(folder, "AF_1.txt")).read()
    page = gzip.open(os.path.join(folder, "AF_1.html.gz"), "rt").read()
    for got in (reader.outcomes_of(text), reader.parse_page(page, text, "curriqunet")):
        assert got["lead"] == "Upon the completion of this course, the student should be able to:", got["lead"]
        assert got["outcomes"][0] == "Compare and contrast various methods of evaluating exercise intensity.", got
        assert len(got["outcomes"]) == 3, got["outcomes"]
    # A full-sentence outcome that opens like a lead-in stays an outcome when a lead-in already stands.
    got = reader.outcomes_of("Student Learning Outcomes\nUpon the completion of this course, the student should be "
                             "able to:\nStudents will be able to swim.\nCourse Content:\nx")
    assert got["outcomes"] == ["Students will be able to swim."], got


CHABOT = os.path.join(ROOT, "kb", "course_outcomes", "trial_44258605342")


@check("Chabot's 'Measurable Objectives:' are its objectives and '3. Student Learning Outcomes' its SLOs, never the "
       "objectives filed as SLOs (S681, trial 44258605342)")
def _():
    # A real Chabot page (All Fields report 347). The reader before S681 read 0 objectives here and filed the six
    # Measurable Objectives as the SLOs, because the numbered SLO heading did not match and the lead-in did.
    text = open(os.path.join(CHABOT, "ADMJ_40.txt")).read()
    page = gzip.open(os.path.join(CHABOT, "ADMJ_40.html.gz"), "rt").read()
    got = reader.parse_page(page, text, "curriqunet")
    assert got["objectives_heading"] == "Measurable Objectives", got["objectives_heading"]
    assert got["objectives_lead"] == "Upon completion of this course, the student should be able to:", got
    assert got["objectives"] == [
        "critically analyze and describe the juvenile justice system and its context in the criminal justice system;",
        "apply California laws pertaining to juvenile delinquency and dependency to case studies;",
        "critically distinguish between delinquency, status offenses, and dependency;",
        "critically analyze the distinctions between adult and juvenile justice systems;",
        "critically evaluate constitutional protections extended to juveniles through judicial decisions;",
        "critically appraise and analyze juvenile court dispositions.",
    ], got["objectives"]
    assert got["heading"] == "Student Learning Outcomes", got["heading"]
    assert got["lead"] == "Upon the completion of this course, the student should be able to:", got["lead"]
    assert got["outcomes"] == [
        "analyze and explain the distinctions between adult and juvenile justice systems;",
        "apply California laws pertaining to juvenile delinquency and dependency to case studies;",
        "explain constitutional protections extended to juveniles through judicial decisions.",
    ], got["outcomes"]
    # Every filed Chabot page: both kinds, neither one standing in for the other.
    d = json.load(open(os.path.join(CHABOT, "read.json")))
    assert len(d["rows"]) == 12
    for row in d["rows"]:
        stem = re.sub(r"[^A-Za-z0-9]+", "_", row["code"])
        g = reader.parse_page(gzip.open(os.path.join(CHABOT, stem + ".html.gz"), "rt").read(),
                              open(os.path.join(CHABOT, stem + ".txt")).read(), "curriqunet")
        assert g["heading"] == "Student Learning Outcomes" and g["outcomes"], (row["code"], g["heading"])
        assert g["objectives_heading"] == "Measurable Objectives" and g["objectives"], row["code"]
        # The two lists may share a line as printed (ADMJ 40 prints one in both), never the whole list.
        assert g["outcomes"] != g["objectives"], row["code"]
        assert row["outcomes"] == g["outcomes"] and row["objectives"] == g["objectives"], ("reparse", row["code"])
    # A numbered heading keeps its words without the number; an objectives heading's lead-in is never an SLO heading.
    got = reader.outcomes_of("Measurable Objectives:\nUpon completion of this course, the student should be able "
                             "to:\nswim;\nCourse Content:\nx")
    assert got["outcomes"] == [] and got["shape"] == "none", got


PERALTA_RECALL = os.path.join(ROOT, "kb", "course_outcomes", "peralta_recall.json")
PERALTA_SHAPE = os.path.join(ROOT, "kb", "course_outline_index", "shape_45025388165.json")
PERALTA_INDEX = os.path.join(ROOT, "kb", "course_outline_index", "index_45025388165.json")
PERALTA_SLUGS = ["laney", "merritt", "college_of_alameda", "berkeley_city"]
LAN = "https://lan.curriqunet.com/DynamicReports/AllFieldsReportByEntity/%d?entityType=Course&reportId=416"
_lspec = importlib.util.spec_from_file_location("load", os.path.join(ROOT, "kb", "_course_outcomes_load.py"))
load = importlib.util.module_from_spec(_lspec)
_lspec.loader.exec_module(load)
STAFF = "Pat Q. Example"


def _sec(name: str, body: str) -> str:
    return ('<div class="rendered-section row section-body meta-renderable meta-section"><div class="col-md-12">'
            '<div class="h4 section-name"><span class="bold">%s</span></div></div><div class="col-md-12"><div '
            'class="row"><div class="meta-field"><div class="field-value"><div class="querytext-result-row '
            'display-block">%s</div></div></div></div></div></div>' % (name, body))


def peralta_page(college: str, slos: list, objectives: str, logo_attrs: str | None = None) -> str:
    """An Outcome Outline page in report 416's shape (shape trial 45026998155): the college logo, an Originator
    field, the Exit Skills objectives, each SLO in bold with its methods after a break, and the CB data elements."""
    logo = logo_attrs if logo_attrs is not None else 'class="college-logo" src="/x.png" title="%s"' % college
    slo = "".join("<li><b>%s</b><br>%s</li>" % (o, m) for o, m in slos)
    return ('<html><body><div class="college-logo-wrapper"><img %s></div><h1 class="report-title h1">Outcome '
            'Outline</h1>%s%s%s%s</body></html>' % (
                logo, _sec("Originator:", STAFF), _sec("Student Performance Objectives (Exit Skills):", objectives),
                _sec("STUDENT LEARNING OUTCOMES:", '<ol style="list-stype-type: decimal;">%s</ol>' % slo),
                _sec("", "<table><tr><th>CB 004:</th><td>D - Credit - Degree Applicable</td></tr></table>")))


def _ol(items: list) -> str:
    return '<ol style="list-style-type: decimal;">%s</ol>' % "".join("<li>%s</li>" % i for i in items)


# Shape trial 45026998155's five pages in their counted shape: (course id, college slug, printed college, SLOs,
# objectives), the counts in peralta_recall.json.
PERALTA_PAGES = [(22154, "merritt", "Merritt College", 3, 4), (22262, "berkeley_city", "Berkeley City College", 3, 4),
                 (22279, "college_of_alameda", "College of Alameda", 3, 6), (22604, "laney", "Laney College", 3, 8),
                 (19484, "berkeley_city", "Berkeley City College", 2, 3)]


def _peralta_rows() -> list[dict]:
    """The five pages read as read_courses files them: read_one's base parse, then apply_sections."""
    rows = []
    for cid, slug, college, n_slo, n_obj in PERALTA_PAGES:
        code = "ART 024" if cid == 19484 else "ART 001"
        page = peralta_page(college, [("Outcome %d of %s." % (i, college), "exam, essay") for i in range(n_slo)],
                            _ol(["Objective %d of %s." % (i, college) for i in range(n_obj)]))
        r = {"code": code, "title": "Art", "course_id": cid, "report": LAN % cid, "named_by": [slug],
             "row_college": slug, "status": 200}
        r.update(reader.parse_page(page, "", reader.page_system(r["report"]), r["report"]))
        rows.append(reader.apply_sections(reader.file_row(r), page))
    return rows


@check("Peralta: a shared code is read once per college, each from the row its proposal type names; the 21 codes a "
       "college's records name that the index holds only under another college are named, never read (S703)")
def _():
    got = reader.wanted_courses(json.load(open(PERALTA_SHAPE)), PERALTA_SLUGS)
    assert sorted((c["code"], c["row_college"]) for c in got) == [
        ("ART 001", "berkeley_city"), ("ART 001", "college_of_alameda"), ("ART 001", "laney"), ("ART 001", "merritt"),
        ("ART 024", "berkeley_city")], got
    assert all(c["named_by"] == [c["row_college"]] for c in got)
    assert len({reader.page_stem(c) for c in got}) == 5
    other = {"url": "https://example.curriqunet.com/", "index": json.load(open(PERALTA_SHAPE))["index"]}
    once = reader.wanted_courses(other, PERALTA_SLUGS)
    assert [c["code"] for c in once] == ["ART 001", "ART 024"] and not any("row_college" in c for c in once), once
    assert reader.shared_code_unread(other, PERALTA_SLUGS) == []
    full = json.load(open(PERALTA_INDEX))
    unread = reader.shared_code_unread(full, PERALTA_SLUGS)
    read_pairs = {(c["row_college"], c["code"]) for c in reader.wanted_courses(full, PERALTA_SLUGS)}
    assert len(unread) == 21 and not {(u["college"], u["code"]) for u in unread} & read_pairs, len(unread)
    assert {u["college"] for u in unread} == set(PERALTA_SLUGS)


@check("Peralta's Outcome Outline parses by its sections, as counted off shape trial 45026998155's pages (5 of 5): "
       "the bold outcome without its assessment methods, no CB data element, the Exit Skills objectives, and the "
       "college the page prints; the row files no page text and no Originator")
def _():
    want = {"%s | %s" % ("ART 024" if cid == 19484 else "ART 001", college): {"course_id": cid, "slo": s, "objective": o}
            for cid, _slug, college, s, o in PERALTA_PAGES}
    rows = {reader.recall_key(r): r for r in _peralta_rows()}
    assert set(rows) == set(want), sorted(rows)
    for key, eye in want.items():
        r = rows[key]
        assert r["course_id"] == eye["course_id"] and r["college_printed"] == key.split(" | ")[1], key
        assert (len(r["outcomes"]), len(r["objectives"])) == (eye["slo"], eye["objective"]), (key, r)
        assert not any(o.startswith("CB 0") or "exam" in o for o in r["outcomes"]), r["outcomes"]
        assert r["fingerprint"] == reader.fingerprint(r["outcomes"]) and \
            r["objectives_fingerprint"] == reader.fingerprint(r["objectives"]), key
        assert STAFF not in json.dumps(r) and set(r) <= set(reader.OUTCOMES_ONLY_KEYS), sorted(r)
    assert reader.section_host(LAN % 1) and reader.outcomes_only(LAN % 1) and \
        not reader.section_host("https://saddleback.curriqunet.com/DynamicReports/AllFieldsReportByEntity/1")


@check("Peralta's objectives keep their whole item: a bold word inside one, a line break inside one, and paragraph "
       "items with no list each file as printed; an SLO keeps its bold outcome and drops the methods after its break "
       "(second reader on 206e481a)")
def _():
    def objectives(body):
        return reader.sections_from_html(peralta_page("Laney College", [("Explain X.", "exam")], body))["objective"]
    assert objectives(_ol(["Analyze <strong>primary</strong> sources"]))["items"] == ["Analyze primary sources"]
    assert objectives(_ol(["Compare A<br>and B"]))["items"] == ["Compare A and B"]
    assert objectives("<p>Describe X.</p><p>Explain Y.</p><p>  </p><p>Apply Z.</p>")["items"] == [
        "Describe X.", "Explain Y.", "Apply Z."]
    slo = reader.sections_from_html(peralta_page("Laney College", [("Explain <i>X</i>.", "exam, essay")], ""))["slo"]
    assert slo["items"] == ["Explain X."], slo
    plain = reader.sections_from_html(
        peralta_page("Laney College", [], "").replace("<ol style=\"list-stype-type: decimal;\"></ol>",
                                                      _ol(["Explain X.<br>exam, essay"])))["slo"]
    assert plain["items"] == ["Explain X."], plain


@check("printed_college reads the college-logo image's title among other classes and in either quote; a page with "
       "no college logo prints none")
def _():
    assert reader.printed_college('<img src="/a.png" class="college-logo" title="Laney College">') == "Laney College"
    assert reader.printed_college("<img class='wide college-logo' title='College of Alameda'>") == "College of Alameda"
    assert reader.printed_college('<img class="college-logo-wrapper" title="Not It"><img class="logo" title="X">') \
        is None
    assert reader.printed_college("<img class=\"college-logo\" title=\"Merritt &amp; College\">") == \
        "Merritt & College"


@check("Peralta's excerpt log covers the SLO and Exit Skills sections and names no person: the Originator line sits "
       "outside both")
def _():
    host = "lan.curriqunet.com"
    text = ("Outcome Outline\nOriginator:\t" + STAFF + "\nStudent Performance Objectives (Exit Skills):\nDescribe X.\n"
            "Explain Y.\nCourse Content:\nLecture.\nSTUDENT LEARNING OUTCOMES:\nExplain X.\nexam, essay\n"
            "CB 004:\tD - Credit - Degree Applicable\n")
    assert reader.excerpt_key(LAN % 1) == host
    assert reader.slo_excerpt(text, host) == ["Explain X.", "exam, essay"]
    assert reader.objectives_excerpt(text, host) == ["Describe X.", "Explain Y."]
    assert STAFF not in reader.excerpt_log("ART 001", reader.slo_excerpt(text, host), host)


@check("the Peralta section parse moves lan.curriqunet.com's parser fingerprint alone: every other host keeps "
       "2629a09a, read_courses (which applies it) is among lan's parts, and no section part is in the base parse "
       "(d-lan-parse-parts-in-lan-fingerprint-only-s703)")
def _():
    base = "2629a09aeac9be1183829d0cea92009f"
    for host in (None, "saddleback.curriqunet.com", "https://riohondo.curriqunet.com/", "ccsf.curricunet.com",
                 "sdccd.curriqunet.com", "https://rccd.curriqunet.com/Report/Course/GetReport/1?reportId=97"):
        assert reader.parser_fingerprint(host) == base, (host, reader.parser_fingerprint(host))
    lan = reader.parser_fingerprint(LAN % 1)
    assert lan != base and lan == reader.parser_fingerprint("lan.curriqunet.com"), lan
    assert "read_courses" in reader.SECTION_PARTS and not set(reader.SECTION_PARTS) & set(reader.PARSER_PARTS)
    other = {"report": "https://saddleback.curriqunet.com/x", "status": 200, "outcomes": ["Kept."]}
    assert reader.apply_sections(other, "<div class=\"rendered-section\"></div>") is other


@check("rows_recall counts a shared-code host's rows by code and printed college, so one code's four pages are four "
       "counted rows, never one")
def _():
    import tempfile
    rows = _peralta_rows()
    want = {"slugs": ",".join(PERALTA_SLUGS), "pages": {
        reader.recall_key(r): {"slo": len(r["outcomes"]), "objective": len(r["objectives"]), "by": "fixture",
                               "from": "the fixture page", "at": "2026-11-22T13:28:47Z"} for r in rows}}
    with tempfile.TemporaryDirectory() as tmp:
        os.makedirs(os.path.join(tmp, "trial_7"))
        json.dump({"parser_fingerprint": reader.parser_fingerprint(LAN % 1), "slugs": want["slugs"], "rows": rows},
                  open(os.path.join(tmp, "trial_7", "read.json"), "w"))
        path = os.path.join(tmp, "count.json")
        json.dump(dict(want, trial="7", parser_fingerprint=reader.parser_fingerprint(LAN % 1)), open(path, "w"))
        got = reader.rows_recall(path, tmp, host="lan.curriqunet.com")
    assert got["pages"] == 5 and got["right"] == 5 and not got["wrong"], got


@check("Peralta's gate: trial 45030224450's count by eye opens the full read for the four colleges together, 11 of 12 "
       "(ARTH C1100 files 'Part 2' as an objective), and never for one college's slugs alone")
def _():
    want = json.load(open(PERALTA_RECALL))
    assert reader.recall_path("lan.curriqunet.com", want["slugs"]) == PERALTA_RECALL
    assert want["parser_fingerprint"] == reader.parser_fingerprint("lan.curriqunet.com")
    rc = reader.recall_for("lan.curriqunet.com", want["slugs"], json.load(open(PERALTA_INDEX)))
    assert rc["ok"] and rc["pages"] == 12 and rc["right"] == 11, rc
    assert [w[0] for w in rc["wrong"]] == ["ARTH C1100 | Laney College"], rc["wrong"]
    assert not reader.recall_for("lan.curriqunet.com", "laney")["ok"]


@check("Peralta: a shared code's rows go to the college its page prints, never the code's other colleges; a page "
       "that prints another college whose records name the code goes to that college; one that prints none, or a "
       "college whose records do not name the code, loads nothing (S703)")
def _():
    import tempfile
    rows = _peralta_rows()
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
        json.dump({"run": "45026998155", "system": "curriqunet", "rows": rows}, f)
    got, skipped = load.rows_from([f.name], "lan")
    by = {}
    for r in got:
        by.setdefault((r["course_code"], r["kind"]), []).append(r["college"])
    for kind in ("slo", "objective"):
        assert sorted(by[("ART 001", kind)]) == ["Berkeley City College", "College of Alameda", "Laney College",
                                                  "Merritt College"], by
        assert by[("ART 024", kind)] == ["Berkeley City College"], by
    laney = next(r for r in got if r["college"] == "Laney College" and r["course_code"] == "ART 001"
                 and r["kind"] == "objective")
    assert len(laney["outcomes"]) == 8 and laney["source_url"] == LAN % 22604
    assert not skipped, skipped
    swap = [dict(r) for r in rows]
    m = next(r for r in swap if r["course_id"] == 22154)
    m.update(college_printed="Laney College", named_by=["laney", "merritt"])
    next(r for r in swap if r["course_id"] == 19484).update(college_printed="Merritt College")
    next(r for r in swap if r["course_id"] == 22279).update(college_printed=None)
    with open(f.name, "w") as g:
        json.dump({"run": "45026998155", "system": "curriqunet", "rows": swap}, g)
    got, skipped = load.rows_from([f.name], "lan")
    cols = sorted({(r["course_code"], r["college"], r["source_url"].split("/")[-1].split("?")[0]) for r in got})
    assert cols == [("ART 001", "Berkeley City College", "22262"), ("ART 001", "Laney College", "22154"),
                    ("ART 001", "Laney College", "22604")], cols
    why = {s["course_id"]: s["why"] for s in skipped}
    assert why == {19484: "the page prints Merritt College, whose records do not name the code",
                   22279: "the page prints no college"}, why
    os.unlink(f.name)


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
