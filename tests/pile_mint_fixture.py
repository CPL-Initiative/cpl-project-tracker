"""The fixture tests/pile_mint_dryrun_test.py and tests/pile_mint_apply_test.py share: a small course list, an identity
file and the minted files, built so each route of kb/_pile_mint_dryrun.py has one case that passes and one that holds.
Not a test itself."""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _pile_mint_dryrun as pm  # noqa: E402

COLLEGES = ["A College", "B College", "C College", "D College"]
A, B, C, D = 0, 1, 2, 3
TOP = "1701.00: Mathematics, General"


def row(ci, ctrl, subj, title, credit="C", units=3, top=TOP):
    return [ci, ctrl, subj, "100", title, units, credit, top, "", "", ""]


def fixture(top=TOP):
    rows = [
        # route (i) at its floor (MATH: 12 holders, all read right)
        row(A, "P1", "MATH", "College Algebra", top=top),
        row(B, "P2", "MATH", "College Algebra", units=4, top=top),
        row(C, "P3", "MATH", "College Algebra", credit="N", units=0, top=top),  # noncredit twin: its own record
        row(A, "F1", "MATH", "Pre-Algebra", top=top),                           # folds with F2 (punctuation)
        row(B, "F2", "MATH", "Prealgebra", top=top),
        row(A, "N1", "MATH", "Algebra I", top=top),                             # a numeral pair: never folds
        row(B, "N2", "MATH", "Algebra 1", top=top),
        row(A, "P7", "MATH", "TRIGONOMETRY", top=top),                          # twin of MATH M1001: Assign
        # route (i) below its floor (BIOL: half its holders sit under ENVS)
        row(A, "P20", "BIOL", "Ecology Basics", top=top),
        # route (ii): college A's LRNC courses are EDUC
        row(A, "P11", "LRNC", "Learning Lab", top=top),
        # an unmapped code and a short code with no votes: held
        row(A, "P8", "ZZZ", "Mystery Course", top=top),
        row(C, "P4", "ES", "Ethnic Course", top=top),
        # the shell conventions
        row(A, "S1", "BUS", "Internship in Business", top=top),                 # internship: WEXP, one record
        row(B, "S2", "MKT", "Internship in Business", top=top),                 # statewide, two local subjects
        row(C, "S3", "ART", "Internship", top=top),
        row(D, "S4", "MATH", "Math Practicum", top=top),                        # practicum: no convention
        row(B, "S5", "BIOL", "Biology Seminar", top=top),                       # seminar: one college's convention
        row(C, "S6", "BUS", "Work Experience", top=top),                        # one common course: Assign
        # the ruled kind: tutoring under LSKL (d-tutoring-under-lskl-2026-11-21)
        row(A, "T1", "TUTR", "Supervised Tutoring", credit="N", units=0, top=top),  # bare, noncredit: one record
        row(B, "T2", "LRNA", "SUPERVISED TUTORING", credit="E", units=0, top=top),  # statewide with T1
        row(C, "T3", "EDUC", "Supervised Tutoring", top=top),                      # bare, credit: its own band
        row(D, "T4", "MATH", "Supervised Tutoring in Mathematics", credit="N", units=0, top=top),  # names a subject
        row(D, "T5", "ENGL", "Tutoring", credit="N", units=0, top=top),            # twin of LSKL M90AA: Assign
        # the left-outs
        row(A, "P5", "MATH", "Special Topics in Math", top=top),
        row(A, "P6", "MATH", "Strong Match Course", top=top),
        row(A, "P9", "MATH", "Twice Listed", top=top),
        row(B, "P9", "MATH", "Twice Listed", top=top),
        row(A, "P10", "MATH", "Re-homed Course", top=top),
    ]
    members = {}
    catalog = {"MATH M1001": {"common_title": "Trigonometry", "credit_status": "Credit", "discipline": "Mathematics"},
               "LSKL M9001": {"common_title": "Study Skills", "credit_status": "Noncredit"}}
    singletons = {"LSKL M90AA": {"common_title": "Tutoring", "credit_status": "Noncredit", "control_number": "X1"}}

    def hold(ci, cn, subj, title, mid):
        rows.append(row(ci, cn, subj, title, top=top))
        members.setdefault(mid, []).append({"c": ci, "n": subj + " 1", "t": title, "u": 3, "p": top[:7], "cn": cn})
    for i in range(12):
        hold(A + i % 3, f"HM{i}", "MATH", f"Math Course {i}", f"MATH M1{i + 100:03d}")
    for i in range(10):
        hold(B, f"HB{i}", "BIOL", f"Biology Course {i}", f"BIOL M1{i + 100:03d}")
        hold(B, f"HE{i}", "BIOL", f"Environment Course {i}", f"ENVS M1{i + 100:03d}")
    for i in range(60):
        hold(A, f"HL{i}", "LRNC", f"Learning Skills {i}", f"EDUC M1{i + 1:03d}")
        hold(A, f"HS{i}", "ES", f"Ethnic Course {i}", f"ETHS M1{i + 1:03d}")
    for i, ci in enumerate([A] * 5 + [B] * 4 + [C] * 3):
        hold(ci, f"HI{i}", "ACCT", f"Internship in Accounting {i}", "WEXP M1001" if ci != C else "WEXP M1002")
    for i, ci in enumerate([A] * 5 + [B] * 4 + [D] * 3):
        hold(ci, f"HW{i}", "BUS", "Work Experience", "WEXP M1500")
    for i in range(12):
        hold(A, f"HR{i}", "HIST", "Research Seminar", "IDST M1001")
    for mid in members:
        catalog.setdefault(mid, {"common_title": members[mid][0]["t"], "credit_status": "Credit"})
    canon_doc = {"disciplines": {
        "Mathematics": {"canonical_subj4": "MATH"}, "Ethnic Studies": {"canonical_subj4": "ETHS"},
        "Education": {"canonical_subj4": "EDUC"}, "Biology": {"canonical_subj4": "BIOL"},
        "Environmental Studies": {"canonical_subj4": "ENVS"}, "Nursing": {"canonical_subj4": "NRSR"},
        "Work Experience Instructors": {"canonical_subj4": "WEXP"},
        "Interdisciplinary Studies": {"canonical_subj4": "IDST"},
        "Learning Assistance or Learning Skills": {"canonical_subj4": "LSKL"},
        "Kinesiology": {"canonical_subj4": "KINE", "is_umbrella": True}}}
    L = {"colleges": COLLEGES, "rows": rows}
    return {
        "L": L, "courses": pm.lookup_courses(L), "members": members,
        "descs": {"P1": "Short.", "P2": "A longer description."},
        "na": {}, "closest": {"measure": {"levels": [{"key": "strong", "bands": [5, 6]},
                                                     {"key": "possible", "bands": [3, 4]},
                                                     {"key": "none", "bands": [0, 1, 2]}]},
                              "rows": {"P6": [0.93, 5, [["MATH M1001", 0.9, 1, 2, None]]],
                                       "P8": [0.2, 1, [["MATH M1001", 0.3, 0, 2, None]]]}},
        "catalog": catalog, "singletons": singletons,
        "curations": {"MATH M1003": {"unified_title": "x"}, "CN:P10": {"merge_into": "MATH M1001"},
                      "X": {"merge_into": "MATH M1005"}},
        "identities": {}, "common": {}, "membership_keys": sorted(members), "membership_cns": [], "singleton_cns": [],
        "disc_map": {"MATH": "Mathematics", "ES": "Ethnic Studies", "KIN": "Kinesiology", "BIOL": "Biology"},
        "canon_map": {"Mathematics": "MATH", "Ethnic Studies": "ETHS", "Education": "EDUC", "Nursing": "NRSR",
                      "Biology": "BIOL", "Environmental Studies": "ENVS", "Work Experience Instructors": "WEXP",
                      "Interdisciplinary Studies": "IDST", "Learning Assistance or Learning Skills": "LSKL"},
        "canon_doc": canon_doc, "disc_aliases": {},
        "fl_doc": {"languages": {"Spanish": {"subj4": "SPAN", "subjects": ["SPAN"]}}, "residual_subj4": "FLNG"},
        # MATH 004 by a C-ID; WEXP M10AA returned by a rolled-back mint (kb/_subj4_dryrun.py add_reserved_ids)
        "reservations": {("MATH", "1"): {4}, ("WEXP", "1"): {"0AA"}, ("*", "ids"): {"WEXP M10AA"}},
        "alias_ids": ["MATH M1002", "MATH M90AA"],
        "staged_ids": ["MATH M1006", "MATH M10AA"],
        "provenance": {"fixture": True},
    }
