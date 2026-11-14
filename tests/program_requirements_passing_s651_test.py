#!/usr/bin/env python3
"""The S651 passing-function changes, behind their flag, and the dry run that measures them.

WHY. The program-total electives fill filled a degree's major total, and its guard accepted any word
"elective", so Cosumnes River 11338 (6 of 24 major units placed, its only "elective" a block heading) and
04614 (ten codes missing, 18 of 39 units) would pass on a rescore (p-degree-electives-fill-false-pass-s650;
docs/kb-notes/methodology-a-fill-must-check-what-it-fills.md). A false pass is worse than a miss, so the
guard is pinned here on fixtures shaped like the two records, beside a true fill that must keep passing.
The same flag carries Sam's noncredit Total Hours reading (sam-noncredit-total-hours-2026-11-13) and
COBIx's GE-pattern certificate rule (#3229 comment 6869816372, its 89 positives' title shapes and its 7
negatives). With the flag off, every score is what main files today; the existing pins in
tests/program_requirements_pilot_test.py hold that side. Every fixture is written here: nothing reads a
live file's size or count.

Run from repo root: python3 tests/program_requirements_passing_s651_test.py
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_requirements_score as S  # noqa: E402
import _program_requirements_passing_dryrun as D  # noqa: E402

checks = [0]
failures = []


def check(cond, why):
    checks[0] += 1
    if not cond:
        failures.append(why)


def both(fn):
    """fn() with the flag off, then on; the flag returns to where it was."""
    prev = S.set_passing_s651(False)
    try:
        off = fn()
        S.set_passing_s651(True)
        on = fn()
    finally:
        S.set_passing_s651(prev)
    return off, on


check(S.PASSING_S651 is False, "the flag is off by default, so main's scores are unchanged")

# ── Change 4: the degree electives-fill guard ──
# Art - Design 11338 as filed: an A.A. whose record total is the 24-unit major, one required course and an
# 'Art History Electives' choose-3-units block; the page's only 'elective' is that heading.
ART_LIST = [{"code": "ART 300", "units": 3}] + [{"code": "ARTH %d" % n, "units": 3} for n in (300, 302, 304, 306, 308)]
art = {"program": {"measure": "units", "total_units": {"min": 24, "max": 24}, "electives_fill_degree": True,
                   "degree_total": {"min": None, "max": None}, "ge_units": {"min": None, "max": None}},
       "blocks": [{"name": "Degree Requirements", "rule": "all", "courses": [{"code": "ART 300", "units": 3}]},
                  {"name": "Art History Electives", "rule": "choose_units", "minimum": 3,
                   "courses": [{"code": "ARTH %d" % n, "units": 3} for n in (300, 302, 304, 306, 308)]}]}
ART_TEXT = ("A.A. in Art - Design\nDegree Requirements\nART 300 Beginning Design 3\nArt History Electives\n"
            + "\n".join("ARTH %d Art History 3" % n for n in (300, 302, 304, 306, 308)) + "\nTotal Units: 24")
off, on = both(lambda: S.score(art, ART_LIST, ART_TEXT, "A.A. Degree")["arithmetic"])
check(off["pass"] and off.get("fill") == [18.0, 18.0],
      "without the flag the fill passes 11338 on 6 of 24 units (the false pass the guard closes): %s" % json.dumps(off))
check(not on["pass"] and on["status"] == "unequal" and "fill" not in on,
      "with the flag 11338 fails: a degree's major total is never filled: %s" % json.dumps(on))

# Art - Studio Art 04614: 18 of 39 major units read, ten listed codes missing (each explained, so coverage
# passes), and a page that does print the word 'electives' in prose.
studio_list = [{"code": "ART %d" % n, "units": 3} for n in range(300, 306)]
studio = {"program": {"measure": "units", "total_units": {"min": 39, "max": 39}, "electives_fill_degree": True},
          "blocks": [{"name": "A minimum of 12 units from the following:", "rule": "all",
                      "courses": [{"code": "ART %d" % n, "units": 3} for n in range(300, 306)]}],
          "missing_explained": []}
STUDIO_TEXT = "A.A. in Art - Studio Art\n" + "\n".join("ART %d 3" % n for n in range(300, 306)) + \
              "\nStudents may choose electives from the list.\nTotal Units: 39"
off, on = both(lambda: S.score(studio, studio_list, STUDIO_TEXT, "A.A. Degree")["arithmetic"])
check(off["pass"], "without the flag 04614's 18 of 39 passes on the fill: %s" % json.dumps(off))
check(not on["pass"], "with the flag 04614 fails, though its page names electives: %s" % json.dumps(on))
off, on = both(lambda: S.score(studio, studio_list, STUDIO_TEXT, "A.A.-T Degree")["arithmetic"])
check(off["pass"] and not on["pass"], "a transfer degree's major total is a major total too")

# A true fill keeps passing: San Joaquin Delta 11970's certificate, "Complete elective units to meet the
# minimum 60 unit requirement for this certificate" (S424).
CERT_LIST = [{"code": "ECE 26", "units": 3}, {"code": "ECE 29", "units": 3}]
cert = {"program": {"measure": "units", "total_units": {"min": 60, "max": 60}, "electives_fill_degree": True},
        "blocks": [{"name": "Required Courses", "rule": "all",
                    "courses": [{"code": "ECE 26", "units": 3}, {"code": "ECE 29", "units": 3}]}]}
CERT_TEXT = "ECE 26\nECE 29\nComplete elective units to meet the minimum 60 unit requirement for this certificate"
off, on = both(lambda: S.score(cert, CERT_LIST, CERT_TEXT, "Certificate of Achievement")["arithmetic"])
check(off["pass"] and on["pass"] and on.get("fill") == [54.0, 54.0],
      "a certificate whose page says electives fill its total passes both ways: %s" % json.dumps(on))
# The heading half of the guard: the same certificate whose only 'elective' is a block heading.
cert_h = json.loads(json.dumps(cert))
cert_h["blocks"].append({"name": "General Electives", "rule": "recommended", "courses": []})
HEAD_TEXT = "ECE 26\nECE 29\nGeneral Electives (as advised)\nMinimum Units Required: 60"
off, on = both(lambda: S.score(cert_h, CERT_LIST, HEAD_TEXT, "Certificate of Achievement")["arithmetic"])
check(off["pass"] and not on["pass"],
      "with the flag a block heading never licenses the fill: off %s, on %s" % (off["pass"], on["pass"]))
off, on = both(lambda: S.score(cert_h, CERT_LIST, HEAD_TEXT + "\nComplete electives to reach 60 units.",
                               "Certificate of Achievement")["arithmetic"])
check(on["pass"], "the catalog's own sentence beside the heading still licenses it")
# The degree-total fill, the case the fill was built for, is untouched: Psychology AA-T, a 19-unit major,
# Cal-GETC 34 and transferable electives to 60.
psy = {"program": {"measure": "units", "degree_total": {"min": 60, "max": 60}, "ge_units": {"min": 34, "max": 34},
                   "ge_pattern": "Cal-GETC", "electives_fill_degree": True},
       "blocks": [{"name": "Required Core", "rule": "all", "courses": [{"code": "PSYC 1", "units": 19}]}]}
off, on = both(lambda: S.score(psy, [{"code": "PSYC 1", "units": 19}],
                               "PSYC 1\nCal-GETC 34\nTransferable electives as needed to reach 60", "A.A.-T Degree")["arithmetic"])
check(off["pass"] and on["pass"] and on.get("against") == "degree", "the degree-total fill passes both ways")

# The dry run reads filed sums the same way (no text): a filed degree pass on the fill flips, a filed
# failing degree record stays failing, a filed certificate fill stays passing.
def filed(award, computed, stated, status, fill=None, cov=True):
    arith = {"pass": status == "equal", "status": status, "computed": computed, "stated": stated, "against": "program"}
    if fill is not None:
        arith["fill"] = fill
    return {"college": "Cosumnes River College", "control_number": "11338", "award": award,
            "record": {"program": {"electives_fill_degree": True, "total_units": {"min": stated[0], "max": stated[1]}},
                       "blocks": []},
            "score": {"coverage": {"pass": cov}, "invented": {"pass": True}, "arithmetic": arith}}


held = filed("A.A. Degree", [6.0, 6.0], [24.0, 24.0], "unequal")
check(D.program_total_ok(held, False) is True and D.program_total_ok(held, True) is False,
      "11338 as filed: the current fill would pass it on a rescore, the guard keeps it failing")
flips = filed("A.A.-T Degree", [24.0, 24.0], [30.0, 30.0], "equal", fill=[6.0, 6.0])
check(D.program_total_ok(flips, False) is True and D.program_total_ok(flips, True) is False,
      "a filed transfer-degree pass on the program-total fill flips to fail")
keeps = dict(filed("Certificate of Achievement", [6.0, 6.0], [60.0, 60.0], "equal", fill=[54.0, 54.0]),
             college="San Joaquin Delta College", control_number="11970")
check(D.program_total_ok(keeps, True) is True, "a filed certificate fill keeps passing")
check(D.program_total_ok(filed("A.A. Degree", [6.0, 6.0], [24.0, 24.0], "incomplete"), False) is None,
      "an incomplete sum never reaches the fill")
check(D.program_total_ok(filed("A.A. Degree", [24.0, 24.0], [24.0, 24.0], "equal"), True) is None,
      "a sum that equals its total does not rest on the fill")

# ── Change 1: noncredit Total Hours, wherever the page prints it ──
HEAD = "Job Readiness Skills Certificate of Completion"
NC_TEXT = (HEAD + "\nRequired Courses:\nVOCED 600\tJob Search Skills\t0\nVOCED 601\tResume Writing\t0\nTotal Hours\t48-54")
nc = {"program": {"measure": "hours", "total_units": {"min": 48, "max": 54}, "section_heading": HEAD},
      "blocks": [{"name": "Required Courses:", "rule": "all",
                  "courses": [{"code": "VOCED 600", "units": None}, {"code": "VOCED 601", "units": None}]}]}
NC_LIST = [{"code": "VOCED 600", "units": 0}, {"code": "VOCED 601", "units": 0}]
off, on = both(lambda: S.score(nc, NC_LIST, NC_TEXT, "Noncredit program")["arithmetic"])
check(off["status"] == "incomplete" and on["status"] == "equal" and on.get("total_only"),
      "a college whose step names no reading takes it with the flag: off %s, on %s" % (off["status"], on["status"]))
off, on = both(lambda: S.score(nc, NC_LIST, NC_TEXT.replace("48-54", "48-54 per course"), "Noncredit program")["arithmetic"])
check(on["status"] == "incomplete", "the page's evidence is still read: a per-course total fails")
off, on = both(lambda: S.score(nc, NC_LIST, NC_TEXT.replace("48-54", "48-60"), "Noncredit program")["arithmetic"])
check(on["status"] == "incomplete", "a printed total that is not the record's fails")
cand = {"record": nc, "score": {"coverage": {"pass": True}, "invented": {"pass": True},
                                "arithmetic": {"status": "incomplete", "against": "program"}}}
check(D.total_hours_candidate(cand), "the dry run names a figureless hours record as a candidate")
cand_flag = json.loads(json.dumps(cand))
cand_flag["record"]["program"]["hours_total_printed"] = True
check(not D.total_hours_candidate(cand_flag), "a record whose college already reads the total is no candidate")

# ── Change 3: GE-pattern completion certificates (COBIx, #3229) ──
COA = "Certificate of Achievement requiring 30S/45Q to fewer than 60S/90Q units"
for title, want in (("Cal-GETC", "Cal-GETC"), ("California General Education Transfer Curriculum", "Cal-GETC"),
                    ("IGETC – CSU", "IGETC"), ("IGETC: UC or CSU", "IGETC"), ("CSU General Education", "CSU-GE"),
                    ("CSU-GE", "CSU-GE"), ("California State University General Education-Breadth", "CSU-GE")):
    check(S.ge_pattern_certificate(title, COA, False) == want, "%r is a %s certificate" % (title, want))
for title, award in (("University Transfer", "A.A. Degree"), ("University Studies", "A.A. Degree"),
                     ("Liberal Arts", "A.A. Degree"), ("Transfer Studies", "A.A. Degree"),
                     ("University Preparation in a Specific Major", "A.A. Degree"),
                     ("GENERAL EDUCATION DIPLOMA", ""), ("GENERAL EDUCATION DIPLOMA - BILINGUAL", "")):
    check(S.ge_pattern_certificate(title, award, False) is None, "COBIx's negative %r does not match" % title)
check(S.ge_pattern_certificate("Cal-GETC", "A.A. Degree", False) is None, "a degree naming Cal-GETC is no certificate")
check(S.ge_pattern_certificate("Cal-GETC", COA, True) is None, "a program with a closed list does not match")
check(S.ge_pattern_certificate("IGETC or CSU-GE", COA, False) is None, "a title naming two patterns does not match")
cfg = {"ge_pattern_certificates": {"45033": {"pattern": "Cal-GETC", "evidence": "p.88 'Cal-GETC Certificate'"}}}
check(S.ge_pattern_evidence(cfg, "45033", "Cal-GETC") and not S.ge_pattern_evidence(cfg, "45033", "IGETC")
      and not S.ge_pattern_evidence({}, "45033", "Cal-GETC"), "criterion 4 asks for the quote under the same pattern")
row = {"checked_against": "ge_pattern", "pattern_evidence": "quoted"}
off, on = both(lambda: S.counts_passing_on_tab(row))
check(not off and on, "a GE-pattern row counts only with the flag")
off, on = both(lambda: S.counts_passing_on_tab(dict(row, pattern_evidence="none")))
check(not on, "a GE-pattern row with no quote never counts")
off, on = both(lambda: S.counts_passing_on_tab({"coverage": True, "invented": True, "arithmetic": "equal"}))
check(off and on, "an ordinary row counts both ways")

# The dry run end to end on pinned inputs.
census = {"basis": "fixture", "written_at": "2026-11-14",
          "programs_by_college": {"Allan Hancock College": {"45033": "no_closed_list", "05844": "no_closed_list"},
                                  "Monterey Peninsula College": {"45371": "parked_college|no_closed_list"}}}
export = {("Allan Hancock College", "45033"): {"TITLE": "Cal-GETC", "AWARD": COA},
          ("Allan Hancock College", "05844"): {"TITLE": "Management", "AWARD": "A.A. Degree"},
          ("Monterey Peninsula College", "45371"): {"TITLE": "Cal-GETC", "AWARD": COA}}
r = D.dry_run([held, dict(flips, control_number="04602"), keeps], census, export,
              {"colleges": {"Allan Hancock College": cfg}})
t = r["totals"]
check((t["records"], t["before"], t["after"]) == (3, 2, 2),
      "one degree fill flips and one GE certificate with its quote counts: %s" % json.dumps(t))
check(t["rule4_pass_to_fail"] == 1 and t["rule4_held"] == 1 and t["rule3_candidates"] == 2
      and t["rule3_quoted"] == 1 and t["rule2_programs_unread"] == 1, "the totals by rule: %s" % json.dumps(t))
check(r["cosumnes_river_holds"]["11338"] == {"filed": "fail", "current_function_rescore": "pass", "after": "fail",
                                             "award": "A.A. Degree"}, "the held record's before and after")
check(r["rules"]["2"]["coded"] is False, "the own-list rule is reported, not coded")
md = D.summary_md(r)
check(len(md.splitlines()) < 60 and "nothing applied" in md and "11338" in md, "the summary fits a comment")

# The live reconcile names a college whose table differs from its files, and only that one.
diff = D.reconcile_live({"A": {"records": 10, "before": 8}, "B": {"records": 5, "before": 5}},
                        {"A": {"live_rows": 10, "live_passing": 8}, "B": {"live_rows": 6, "live_passing": 5},
                         "C": {"live_rows": 1, "live_passing": 0}})
check([d["college"] for d in diff] == ["B", "C"], "the reconcile names B and C: %s" % json.dumps(diff))

# The migration is drafted and not applied.
apply_path = os.path.join(ROOT, "kb", "migrations", ".apply")
check(not os.path.exists(apply_path) or "s651_passing_function" not in open(apply_path, encoding="utf-8").read(),
      "kb/migrations/.apply does not name the S651 migration")
sql = open(os.path.join(ROOT, "kb", "migrations", "2026-11-14_s651_passing_function.sql"), encoding="utf-8").read()
check("'ge_pattern'" in sql and "pattern_evidence" in sql and "('equal', 'unstated')" in sql,
      "the migration's function keeps the ordinary rule and adds the GE-pattern branch the mirror reads")
check(S.PASSING_S651 is False, "the flag is back off after the test")

if failures:
    print("FAIL: %d" % len(failures))
    for f in failures:
        print("  -", f)
    sys.exit(1)
print("%d/%d checks passed: program requirements passing S651" % (checks[0], checks[0]))
