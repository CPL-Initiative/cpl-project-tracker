"""Whether each outline system's public page prints a Course Objectives section: the one source.

From the filed trials (S649), so an empty objectives column is a fact about the host and never a reader that passed
them over. Read by kb/_course_outcomes_read.py (the SLO reader) and kb/_build_commons_data_status.py (the College Data
Collection builder, its no-objectives list); neither keeps a copy (S650, COBIx on #3286). Held to its trials by
tests/course_outcomes_objectives_standing_test.py; the colleges still to read again: objectives_reread_plan.json.
"""

OBJECTIVES_BY_SYSTEM = {
    "curriqunet": {"printed": True,
                   "evidence": "every page of trials 38317539422 (RCCD), 38350787486 (SDCCD All Fields), 41436124244 "
                               "(Santa Ana), 41595084107 (Las Positas), 42573515439 (Cuesta) and 43157883293 (Shasta)"},
    "courseleaf": {"printed": True,
                   "evidence": "the Coast district's outline: 9 of the 9 trial pages with SLOs (trial 38508460207, "
                               "Coastline); 1,519 of 1,584 pages in Orange Coast's read 42585338847"},
    "elumen": {"printed": "template",
               "evidence": "each college's catalog template decides. None printed on the trial pages of Modesto Junior, "
                           "Cabrillo, Mission or Lake Tahoe (SLOs on 11 or 12 of 12 each). Columbia (12 of 12) and Contra "
                           "Costa (11 of 12) carry Course Objectives inside an HTML comment, not printed, so not read: "
                           "reading a comment is a decision, not a reread; 11 of Contra Costa's 520 pages print an "
                           "Objectives heading in their text (read 42434894498). West Hills Lemoore's and College of "
                           "Marin's trial pages printed neither SLOs nor objectives. De Anza: one trial page answered "
                           "and it printed both (trial 43168229927)."},
}

# A report whose template prints no Course Objectives section, though other reports of its system do. Keyed by the
# report's host and reportId (report_key) and read by the SLO reader, which files no objectives from such a report: a
# line inside another field that reads "Course Objectives" is that field's content, never the section (S689).
REPORTS_WITHOUT_OBJECTIVES = {
    "frc.curriqunet.com/485": "Feather River's All Fields report prints five sections (Cover, Grading Method, Course "
                              "Content/Topics, Student Learning Outcomes, Methods of Evaluation) on 12 of 12 pages of "
                              "trial 44534888428, and no objectives. Read 44535960153's one objectives hit, ENVR 041, "
                              "was 167 lines of its Lecture Topic Outline under a line reading Course Objectives.",
}


def report_key(url):
    """A report's host and reportId (frc.curriqunet.com/485), or None when the address names no reportId."""
    import re
    import urllib.parse
    u = urllib.parse.urlparse(url or "")
    m = re.search(r"(?:^|&)reportId=(\d+)", u.query)
    return "%s/%s" % (u.netloc.lower(), m.group(1)) if m else None


def prints_objectives(url) -> bool:
    """False for a report REPORTS_WITHOUT_OBJECTIVES names; True otherwise, and the system's own record decides."""
    return report_key(url) not in REPORTS_WITHOUT_OBJECTIVES
