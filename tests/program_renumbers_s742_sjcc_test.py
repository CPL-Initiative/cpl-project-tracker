#!/usr/bin/env python3
"""S742: one cited course renumber at San Jose City, JOURN 138 for the state's row 'JournalismJO Work Experience'
(kb/program_requirements_reconcile.json).

WHY. Law, Public Policy, and Society A.A.-T 38499 adds to its printed 30 and fails only on its course list: the
state's Program Course File names one of its rows by a cut-off subject name, 'JournalismJO', where a code belongs,
and the state's course list leaves that control number (CCC000438429) unnamed, so the record's JOURN 138 reads as a
course the state does not list and the state's row as a course the record does not place. S740 filed eleven such
pairs at the college and left this name out for want of a source: the college's fall 2025 course record does not
hold the control number. The program's own page is the source (college-page-read run 46008386875). Pinned here:

  * the pair and its citation: the printed code, the file's name, the title, units, the session, the date, the page
    read, and evidence that names the control number;
  * the state's file lists that control number under that name and the title 'Work Experience', in program 38499
    alone, and no other control number of the college's lists goes by the name (the state's course list names the
    other JournalismJO rows by code);
  * the page's own lines: 'JOURN 138 · Work Experience · 3' beside 'JOURN 150 · Introduction to Public Relations · 3'
    and 'WE 088A · General Work Experience · 3'; the cited title is the one line's, and no other line prints it;
  * 38499's list holds the file's row and not JOURN 138; the record places JOURN 138 once, and JOURN 150 under its
    own listed code;
  * the self-recall over every committed record of the college, each scored fresh (today's scorer, its own state
    list, no page text) without the pair and with it: one record moves, 38499, from failing coverage and invented
    to passing; none turns failing; no other record's score changes at all;
  * no other college's entry carries the pair.

Run from repo root: python3 tests/program_renumbers_s742_sjcc_test.py
"""
import csv
import glob
import gzip
import io
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s714_ccsf as C  # noqa: E402
import _program_requirements_reconcile as R  # noqa: E402
import _program_requirements_score as S  # noqa: E402

SJCC, SLUG, CN = "San Jose City College", "san_jose_city", "38499"
PRINTED, FILE, CCN, TITLE = "JOURN138", "JournalismJO", "CCC000438429", "Work Experience"
RUN = "46008386875"
# The page's table rows naming a JOURN course, a course numbered 138 or WE 088, line for line (a tab between cells).
PAGE_ROWS = ["JOURN 150\tIntroduction to Public Relations\t3", "JOURN 138\tWork Experience\t3",
             "WE 088A\tGeneral Work Experience\t3"]
n, failures = 0, []


def check(cond, msg):
    global n
    n += 1
    if not cond:
        failures.append(msg)


steps = R.load_steps()
conf = steps[SJCC]

# ── the pair and its citation ─────────────────────────────────────────────
check(conf["course_renumbers"].get(PRINTED) == FILE, "San Jose City's entry holds the pair")
cited = [c for c in conf["course_renumbers_cited"] if c["printed"] == PRINTED]
check(len(cited) == 1 and cited[0]["file"] == FILE and cited[0]["title"] == TITLE and cited[0]["units"] == 3
      and cited[0]["session"] == "S742" and cited[0]["date"] == "2026-11-27"
      and cited[0]["catalog_sources"] == ["college_page_read"]
      and RUN in cited[0]["evidence"] and CCN in cited[0]["evidence"],
      "the pair is cited once: its title, units, session, date, the page read and the control number")
check(R.prefix_aliases(SJCC).get(PRINTED) == FILE, "the scorer reads the pair")
check(all(PRINTED not in (c.get("course_renumbers") or {}) for name, c in steps.items()
          if name != SJCC and isinstance(c, dict)), "no other college's entry carries the pair")

# ── the state's file ──────────────────────────────────────────────────────
with gzip.open(os.path.join(ROOT, "kb", "reference", "coci_program_course_file.csv.gz"), "rt",
               encoding="utf-8-sig") as fh:
    rows = [r for r in csv.DictReader(io.StringIO(fh.read())) if r["CollegeCode"] == "472" and r["CrsId"] == FILE]
mine = [r for r in rows if r["CourseControlNumber"] == CCN]
check(mine and {r["Title"].strip() for r in mine} == {TITLE} and {r["ProgramControlNumber"] for r in mine} == {CN},
      "the state's file lists %s as '%s %s' in program %s alone" % (CCN, FILE, TITLE, CN))
check(len({r["CourseControlNumber"] for r in rows}) > 1,
      "the name stands for several control numbers in the file itself")
by_key = {}
for path in glob.glob(os.path.join(NG.COLLEGE_DIR, SLUG, "records", "*.json")):
    cn = os.path.basename(path)[:-len(".json")]
    for c in C.closed_list(SJCC, cn):
        by_key.setdefault(S.norm_code(c.get("code")), {}).setdefault(c.get("ccn"), set()).add(cn)
check(by_key.get(S.norm_code(FILE)) == {CCN: {CN}},
      "in the lists as built the name is one control number, in 38499's list alone: the state's course list names "
      "the others by code (%r)" % by_key.get(S.norm_code(FILE)))

# ── the page's own lines ──────────────────────────────────────────────────
cells = [r.split("\t") for r in PAGE_ROWS]
hit = [c for c in cells if c[1] == TITLE]
check(len(hit) == 1 and S.norm_code(hit[0][0]) == PRINTED and hit[0][2] == "3",
      "the page prints the cited title on one line, JOURN 138's, at 3 units")
check(["JOURN 150", "Introduction to Public Relations", "3"] in cells and all(c[0] != "JOURN 138" or c[1] == TITLE
                                                                               for c in cells),
      "the page's other JOURN line is JOURN 150 Introduction to Public Relations")

# ── the record and its list ───────────────────────────────────────────────
with open(os.path.join(NG.COLLEGE_DIR, SLUG, "records", CN + ".json"), encoding="utf-8") as fh:
    filed = json.load(fh)
listed = {S.norm_code(c.get("code")): c for c in C.closed_list(SJCC, CN)}
check(S.norm_code(FILE) in listed and PRINTED not in listed and "JOURN150" in listed,
      "38499's list holds the file's row and JOURN 150, and not JOURN 138")
placed = [S.norm_code(c.get("printed_code") or c.get("code")) for _, c, _ in S.placed_codes(filed["record"])]
check(placed.count(PRINTED) == 1 and placed.count("JOURN150") == 1, "the record places JOURN 138 and JOURN 150 once each")

# ── the self-recall ───────────────────────────────────────────────────────
base = {k: v for k, v in (R.prefix_aliases(SJCC) or {}).items() if k != PRINTED}
with_pair = dict(base, **{PRINTED: FILE})


def view(f, aliases):
    sc = S.score(f.get("record") or {}, C.closed_list(SJCC, f.get("control_number")), None, f.get("award"), aliases,
                 R.packed_codes(SJCC))
    return {"pass": bool(S.passes_live(sc)), "coverage": sc["coverage"]["pass"], "invented": sc["invented"]["pass"],
            "arithmetic": sc["arithmetic"].get("status"), "computed": sc["arithmetic"].get("computed"),
            "placed": sc["coverage"]["placed"], "unexplained": sc["coverage"]["unexplained"],
            "repeated": sc["repeated"]["pass"]}


records, moved = 0, {}
for path in sorted(glob.glob(os.path.join(NG.COLLEGE_DIR, SLUG, "records", "*.json"))):
    with open(path, encoding="utf-8") as fh:
        f = json.load(fh)
    if not f.get("record"):
        continue
    records += 1
    a, b = view(f, base), view(f, with_pair)
    if a != b:
        moved[str(f["control_number"])] = (a, b)
check(records >= 80 and sorted(moved) == [CN], "over the college's %d records the pair moves 38499 alone (%r)"
      % (records, sorted(moved)))
a, b = moved.get(CN, ({}, {}))
check(a.get("pass") is False and a.get("coverage") is False and a.get("invented") is False
      and a.get("unexplained") == [S.norm_code(FILE)] and a.get("arithmetic") == "equal",
      "without the pair 38499 adds up and fails coverage and invented on the one row (%r)" % a)
check(b.get("pass") is True and b.get("coverage") is True and b.get("invented") is True and not b.get("unexplained")
      and b.get("arithmetic") == "equal" and b.get("computed") == a.get("computed") and b.get("repeated") is True
      and b.get("placed") == a.get("placed", 0) + 1,
      "with it 38499 passes: one more listed course placed, the same units, nothing repeated (%r)" % b)
check(not [cn for cn, (x, y) in moved.items() if x["pass"] and not y["pass"]], "no record turns failing")

print("%d checks, %d failures" % (n, len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
