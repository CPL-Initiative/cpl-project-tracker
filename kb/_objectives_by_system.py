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
