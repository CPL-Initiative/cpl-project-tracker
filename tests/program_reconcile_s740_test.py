#!/usr/bin/env python3
"""S740 (the census's reconcile_steps lever, lane 1): three colleges' reconcile entries, on the catalog's own words.

WHY. The gap census of 2026-11-26 12:06Z lists records at San Bernardino Valley, San Jose City and Solano that fail the
course-list check on a course the catalog prints under one code and the state's file lists under another. Each
college's entry (kb/program_requirements_reconcile.json) reads the catalog's code as the file's row, one course at a
time, each pair cited:

  * San Bernardino Valley. The catalog prints CDEV 160 and SOCI 110, 110H, 130, 141 and 141H where the file lists CD 160
    and SOC 110, 110H, 130, 141 and 141H. The state's file carries each successor (CDEV160, SOCI110 ...) under the same
    title on a new control number. The S652 census held both prefixes on one counterexample each (CDEV 272, SOCI 120),
    so the prefix stays unaliased and the six courses are renumbered alone.
  * San Jose City. The state's file carries a cut-off subject name where a code belongs ('AccountingAC',
    'SolarRenewab'); the rows the state's course list leaves unnamed, or names by a cut-off number (KINPE 2 for KINPE
    023), fail coverage. Eleven courses are renumbered, each by its control number in the college's own course record
    or by the one title the page and the file both print (college-page-read run 45835049303). One course_units step:
    the Medical Assisting: Clinical certificate's page prints its last choice with no units beside the courses, the
    degree's page prints them, and BIOL 020 takes the 4 the catalog prints for it.
  * Solano. The 2026-27 catalog prints SOCI 002, 023, 040, 045 and 075, each description ending '(Formerly SOC 0nn)',
    where the file lists SOC 2, 23, 40, 45 and 75 (the same read, PDF page 430).

Pinned here:
  * each entry as written: its pairs, each with its citation, and nothing else of the college's entry moved;
  * the page's own words, quoted line for line from the read: each printed code beside the title its citation names;
  * the course_units step on the certificate's page: BIOL 020 takes 4, the choice carries 4-5 and the record adds to
    the printed 31-32; the wrong joins it refuses (a course the reading priced, a program measured in hours, another
    college);
  * the wrong joins a renumber refuses: a list that holds the printed code keeps it, a list without the file's row
    renames nothing, and the cut-off names that stand for several courses (ComputerGrap, RealEstateRE) are no pair;
  * the self-recall over every committed record of each college (the S652 review rule, counting what the entry joins
    as well as the verdicts): which records the entry moves from failing to passing on coverage, invented and
    arithmetic, and that it turns no passing record into a failing one.

A record a reconcile run has already rescored is read in either state: the test scores each record itself, against its
own state list, with the entry and without it, and takes back a course_units fill the run filed before it does.

Run from repo root: python3 tests/program_reconcile_s740_test.py
"""
import copy
import csv
import glob
import gzip
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_piles_s714_ccsf as C  # noqa: E402
import _program_requirements_reconcile as R  # noqa: E402
import _program_requirements_score as S  # noqa: E402

SBVC, SJCC, SOLANO = "San Bernardino Valley College", "San Jose City College", "Solano Community College"
SLUG = {SBVC: "san_bernardino_valley", SJCC: "san_jose_city", SOLANO: "solano_community"}
STEPS = R.load_steps()
checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


def norm(table):
    return {S.norm_code(k): S.norm_code(v) for k, v in (table or {}).items()}


# ── the entries as written ─────────────────────────────────────────────────
SBVC_PAIRS = {"CDEV160": "CD160", "SOCI110": "SOC110", "SOCI110H": "SOC110H", "SOCI130": "SOC130", "SOCI141": "SOC141",
              "SOCI141H": "SOC141H"}
SBVC_S720 = {"CDEV108": "CD108", "CDEV111": "CD111", "CDEV113": "CD113", "CDEV114": "CD114", "CDEV115": "CD115",
             "CDEV126": "CD126", "CDEV138": "CD138", "CDEV185": "CD185", "CDEV205": "CD205"}
SJCC_PAIRS = {"ACCTG20": "ACCOUNTINGAC", "BUS71": "BUSINESSBUS0", "CA5": "COMPUTERAPPL", "FMT123": "FACILITIESMA",
              "FMT105": S.norm_code("Facilities Maintenance Technology (FMT)"), "THEAT33": "THEATREARTST",
              "SOLAR102": "SOLARRENEWAB", "CIS24A": "COMPUTERINFO", "KINPE23": "KINPE2", "KINPE41": "KINPE4",
              "KINPE56": "KINPE9B"}
SOLANO_PAIRS = {"SOCI2": "SOC2", "SOCI23": "SOC23", "SOCI40": "SOC40", "SOCI45": "SOC45", "SOCI75": "SOC75"}
# Either state (p-older-pile-tests-pin-runs-later-plans-move-s739): S742 adds one pair at San Jose City, JOURN 138 for
# the state's one unnamed row 'JournalismJO Work Experience' (CCC000438429, in 38499's list alone), cited by the line
# the program's own page prints (tests/program_renumbers_s742_sjcc_test.py). S740 left the name out for want of a
# source; its eleven pairs stand as written.
SJCC_S742 = {"JOURN138": "JOURNALISMJO"}

print("the entries as written")
sb, sj, so = (STEPS.get(c) or {} for c in (SBVC, SJCC, SOLANO))
check(norm(sb.get("course_renumbers")) == dict(SBVC_S720, **SBVC_PAIRS),
      "San Bernardino Valley's renumbers are S720's nine and S740's six (%r)" % norm(sb.get("course_renumbers")))
check(sb.get("prefix_aliases") == {"ANTH": "ANTHRO", "ARTH": "ART"}, "its prefix aliases stay S652's two")
check(norm(sj.get("course_renumbers")) in (SJCC_PAIRS, dict(SJCC_PAIRS, **SJCC_S742)) and not sj.get("prefix_aliases"),
      "San Jose City's renumbers are the eleven (and S742's one), and no prefix is aliased (%r)"
      % norm(sj.get("course_renumbers")))
check(norm(so.get("course_renumbers")) == SOLANO_PAIRS and not so.get("prefix_aliases") and so.get("steps") == [],
      "Solano's renumbers are the five, with no prefix alias and no step (%r)" % norm(so.get("course_renumbers")))
for college, conf, pairs in ((SBVC, sb, SBVC_PAIRS), (SJCC, sj, SJCC_PAIRS), (SOLANO, so, SOLANO_PAIRS)):
    cited = {S.norm_code(c["printed"]): c for c in conf.get("course_renumbers_cited") or []
             if c.get("session") != "S742"}
    check(set(cited) == set(pairs) and all(S.norm_code(c["file"]) == pairs[k] for k, c in cited.items()),
          "%s: each S740 pair carries its citation" % college)
    check(all(c.get("title") and c.get("units") and c.get("session") == "S740" and c.get("date") == "2026-11-26"
              and len(c.get("evidence") or "") > 80 for c in cited.values()),
          "%s: each citation names its title, units, session, date and evidence" % college)
steps = sj.get("steps") or []
check(len(steps) == 1 and steps[0].get("kind") == "course_units" and steps[0].get("units") == {"BIOL20": [4, 4]}
      and "45835049303" in steps[0].get("read", ""),
      "San Jose City's one step prices BIOL 020 at 4 from the page read (%r)" % [s.get("kind") for s in steps])

# ── the state's own files ──────────────────────────────────────────────────
print("the state's files")
ROWS = {}                                  # {(college code, CrsId): {(control number, title, status)}}
with gzip.open(os.path.join(ROOT, "kb", "reference", "coci_program_course_file.csv.gz"), "rt", encoding="utf-8-sig") as fh:
    for r in csv.DictReader(fh):
        if r["CollegeCode"] in ("982", "472", "281"):
            ROWS.setdefault((r["CollegeCode"], r["CrsId"].strip()), set()).add(
                (r["CourseControlNumber"], r["Title"].strip(), r["CourseStatus"]))
for printed, listed in SBVC_PAIRS.items():
    new, old = ROWS.get(("982", printed)) or set(), ROWS.get(("982", listed)) or set()
    check(new and old and {t for _c, t, _s in new} == {t for _c, t, _s in old}
          and not {c for c, _t, _s in new} & {c for c, _t, _s in old},
          "San Bernardino Valley: the file carries %s and %s under one title, on two control numbers" % (printed, listed))
with open(os.path.join(ROOT, "kb", "program_requirements_reconcile_out", "prefix_aliases_2026-11-14", "plan.json"),
          encoding="utf-8") as fh:
    PLAN = json.load(fh)["colleges"]
held = {h["catalog_prefix"]: h for h in PLAN[SBVC]["held"]}
check(held["SOCI"]["reason"] == "counterexample" and held["CDEV"]["reason"] == "counterexample"
      and [c["catalog"] for c in held["SOCI"]["counterexamples"]] == ["SOCI 120"]
      and [c["catalog"] for c in held["CDEV"]["counterexamples"]] == ["CDEV 272"],
      "the S652 census held San Bernardino Valley's SOCI and CDEV prefixes on SOCI 120 and CDEV 272")
check("SOCI120" not in norm(sb.get("course_renumbers")) and "CDEV272" not in norm(sb.get("course_renumbers")),
      "neither counterexample is renumbered")
held = {h["catalog_prefix"]: h for h in PLAN[SOLANO]["held"]}
check(held["SOCI"]["reason"] == "no_catalog_title" and held["SOCI"]["file_prefix"] == "SOC",
      "the S652 census held Solano's SOCI prefix for want of a catalog title")
MIS = {}                                   # {control number: (course id, title)} at San Jose City
with open(os.path.join(ROOT, "kb", "reference", "cb_course_basic_fall2025.csv"), encoding="utf-8-sig") as fh:
    for r in csv.DictReader(fh):
        if r["CB_COLLEGE_ID"].strip() == "472":
            MIS[r["CB_CONTROL_NUMBER"].strip()] = (r["CB_COURSE_ID"].strip(), r["CB_TITLE"].strip())
for ccn, course, title in (("CCC000581494", "ACCTG-020", "Financial Accounting"),
                           ("CCC000379206", "BUS-071", "Legal Environment of Business"),
                           ("CCC000515305", "CA-005", "Computer Literacy"),
                           ("CCC000345877", "FMT-123", "Intermediate Programmable Logic Controllers"),
                           ("CCC000603685", "THEAT-033", "Technical Theatre in Production"),
                           ("CCC000529761", "KINPE-041", "Pilates Mat Workout"),
                           ("CCC000529719", "KINPE-056", "Beginning Weight Training"),
                           ("CCC000280422", "BIOL-020", "Human Biology")):
    check(MIS.get(ccn) == (course, title), "San Jose City's course record names %s %s %s (%r)" % (ccn, course, title, MIS.get(ccn)))
for crs, ccn, title in (("SolarRenewab", "CCC000534929", "Introduction to Photovoltaic Installation"),
                        ("ComputerInfo", "CCC000438382", "Perl Programming"),
                        ("FacilitiesMa", "CCC000083667", "Introduction to Industrial Electronics and Controls"),
                        ("KinesiologyP", "CCC000532184", "Cardio Kickboxing")):
    check(any(c == ccn and t == title for c, t, _s in ROWS.get(("472", crs)) or ()),
          "the state's file lists %s as '%s %s'" % (ccn, crs, title))
for crs in ("SOC002", "SOC023", "SOC040", "SOC045", "SOC075"):
    check(("281", crs) in ROWS, "the state's file lists %s at Solano" % crs)

# ── the pages' own words (college-page-read run 45835049303, line for line; a tab between a row's cells) ────────
print("the pages' own words")
SJ_LINES = {
    "SOLAR102": "SOLAR 102\tIntroduction to Photovoltaic Installation\t3.5",          # Construction Technology A.S. 06202
    "CIS24A": "CIS 024A\tPerl Programming\t3",                                         # Emerging Tech Entrepreneurship 2
    "FMT123": "FMT 123\tIntermediate Programmable Logic Controllers\t4",               # Air Conditioning & Refrigeration 3
    "FMT105": "Select one of the following:\t2-2.5\nAIRC 145\nSheet Metal Principles\nFMT 105\n"
              "Introduction to Industrial Electronics and Controls",
    "KINPE23": "KINPE 023\tCardio Kickboxing\t1",                                      # Kinesiology certificate 39391
    "KINPE41": "KINPE 041\tPilates Mat Workout\t1",
    "KINPE56": "KINPE 056\tBeginning Weight Training\t1",
    "CA5": "CA 005\tComputer Literacy\t2",                                             # Medical Assisting: Clinical A.S.
}
cited = {S.norm_code(c["printed"]): c for c in sj.get("course_renumbers_cited") or []}
for k, line in SJ_LINES.items():
    c = cited.get(k) or {}
    code = re.match(r"(?:.*\n)*?([A-Z]+ \d+[A-Z]?)(?:\t|\n)", line + "\n")
    last = line.split("\n")[-1]
    check(c.get("title", "\0") in line and S.norm_code(last.split("\t")[0] if "\t" in last else line.split("\n")[-2]) == k,
          "San Jose City: the page prints %s beside the title its citation names (%r)" % (k, code and code.group(1)))
# Solano's catalog PDF, page 430, the sociology course descriptions (pypdf's text: 'ti' prints as a ligature).
SO_PAGE = """SOCI C1000     IntroducƟ on to Sociology                 3.0 Units
(Formerly SOC 001)
SOCI 002     Social Issues and Problems                   3.0 Units
insƟ tuƟ ons. (Formerly SOC 002)
SOCI 023     Sociology of African Americans            3.0 Units
relaƟ onships, and social problems. (Formerly SOC 023)
SOCI 040     Sociology of the Family                          3.0 Units
alternaƟ ve family styles. (Formerly SOC 040)
SOCI 045     Sociology of Religion                              3.0 Units
(Formerly SOC 045)
SOCI 075     IntroducƟ on to Sociology of Sport      3.0 Units
the work place. (Formerly SOC 075)
"""
heads = re.findall(r"^SOCI (\d{3})\s+(.+?)\s+3\.0 Units$", SO_PAGE, re.M)
formerly = re.findall(r"\(Formerly SOC (\d{3})\)", SO_PAGE)
check([n for n, _t in heads] == formerly[1:] and formerly[0] == "001",
      "Solano: each SOCI course's description ends with the SOC number it was, the same number")
cited = {S.norm_code(c["printed"]): c for c in so.get("course_renumbers_cited") or []}
for n, title in heads:
    c = cited.get(S.norm_code("SOCI " + n)) or {}
    check(c.get("title", "\0").replace("ti", "Ɵ ") == title or c.get("title") == title,
          "Solano: SOCI %s is cited under the title the page prints (%r)" % (n, title))
    check("(Formerly SOC %s)" % n in (c.get("evidence") or ""), "Solano: SOCI %s's citation quotes its line" % n)
check("SOCIC1000" not in norm(so.get("course_renumbers")),
      "SOCI C1000 (formerly SOC 001) is no pair: the file lists the common course as printed")


# ── scoring a filed record with an entry and without it ────────────────────
def records(college):
    out = []
    for p in sorted(glob.glob(os.path.join(ROOT, "kb", "program_requirements_college", SLUG[college], "records", "*.json"))):
        with open(p, encoding="utf-8") as fh:
            f = json.load(fh)
        if isinstance(f.get("record"), dict):
            out.append(f)
    return out


def unfilled(f):
    """The record as the reading left it: a course_units fill a reconcile run filed is taken back."""
    rec = copy.deepcopy(f["record"])
    codes = {S.norm_code(k) for n in f.get("reconciled") or [] if n.get("field") == "course_units"
             for k in (n.get("now") or {})}
    for b in rec.get("blocks") or []:
        for c in b.get("courses") or []:
            for e in [c] + [a for a in c.get("alternatives") or [] if isinstance(a, dict)]:
                if S.norm_code(e.get("code")) in codes:
                    e["units"], e["units_max"] = None, None
    return rec


def without(college):
    """The steps file with S740's part of the college's entry taken out."""
    st = copy.deepcopy(STEPS)
    if college == SBVC:
        st[SBVC]["course_renumbers"] = {k: v for k, v in st[SBVC]["course_renumbers"].items()
                                        if S.norm_code(k) not in SBVC_PAIRS}
    else:
        st.pop(college, None)
    return st


def verdict(f, steps, rec=None):
    college = f["college"]
    rec = unfilled(f) if rec is None else rec
    rec = R._college_steps(rec, " ", college, f.get("award"), steps=steps, control_number=f.get("control_number"))[0]
    sc = S.score(rec, C.closed_list(college, f["control_number"]), None, f.get("award"),
                 R.prefix_aliases(college, steps, year=f.get("catalog_year")), R.packed_codes(college, steps))
    return sc, all(bool((sc.get(k) or {}).get("pass")) for k in ("coverage", "invented", "arithmetic"))


def recall(college):
    base = without(college)
    to_pass, to_fail, collectable = [], [], []
    for f in records(college):
        a, pa = verdict(f, base)
        b, pb = verdict(f, STEPS)
        if pb and not pa:
            to_pass.append(f["control_number"])
        if pa and not pb:
            to_fail.append(f["control_number"])
        if not pb and b["coverage"]["pass"] and b["invented"]["pass"] and not (a["coverage"]["pass"] and a["invented"]["pass"]):
            collectable.append(f["control_number"])
    return to_pass, to_fail, collectable


print("the self-recall over every committed record")
for college, want_pass, want_collect in (
        (SBVC, ["40833", "41756"], []),
        (SJCC, ["06185", "06202", "18921", "22220", "22237", "32214", "38113", "38498", "39391", "41473", "44596"],
         ["08859", "32078"]),
        (SOLANO, ["06555", "08337", "19450", "30678", "35213", "43144"], ["42041"])):
    to_pass, to_fail, collectable = recall(college)
    check(to_fail == [], "%s: the entry turns no passing record into a failing one (%r)" % (college, to_fail))
    # Either state: with S742's pair filed, San Jose City's entry also passes 38499.
    check(to_pass == want_pass or (college == SJCC and to_pass == sorted(want_pass + ["38499"])
                                   and SJCC_S742.items() <= norm(sj.get("course_renumbers")).items()),
          "%s: the entry passes %r (%r)" % (college, want_pass, to_pass))
    check(collectable == want_collect,
          "%s: with its course list read, %r still fail on their units (%r)" % (college, want_collect, collectable))

# ── the course_units step on the certificate's page ────────────────────────
print("the course_units step on the certificate's own page")
CERT = """[Tab: Requirements]
Certificate Requirements
Course List
Course
Title
Credits
Major Requirements
HSCI 008\tMedical Terminology\t3
MA 005\tMedical Office Emergencies\t2
MA 006\tIntroduction to Medical Assisting\t3
MA 020\tPhysical Examination Procedures\t3
MA 021\tMedical Office Laboratory Procedures\t3
MA 022\tMedical Asepsis and Surgical Procedures\t3
MA 023\tMedication Administration for Medical Assistants\t3
MA 024\tMedical Assisting Clinical Practicum Experience\t4
Complete one BUS course from the following\t3
BUS 007A\tBusiness Language Skills\t3
or BUS 008\tBusiness Communication
Select one of the following courses:\t3
BIOL 020
Human Biology
BIOL 071
Human Anatomy
MA 004
Structure and Function of the Human Body 1
Total Units\t31-32
"""
DEGREE = """Complete one of the following courses:\t4-5
BIOL 020\tHuman Biology\t4
BIOL 071\tHuman Anatomy\t5
MA 004\tStructure and Function of the Human Body\t4
Total Units\t31-32
"""
check("BIOL 020\tHuman Biology\t4" in DEGREE and "BIOL 020\nHuman Biology\n" in CERT,
      "the degree's page prints BIOL 020 at 4, and the certificate's page prints it with no units")
f14 = next(f for f in records(SJCC) if f["control_number"] == "32214")
rec14 = unfilled(f14)
rows = [c for b in rec14["blocks"] for c in b["courses"] if S.norm_code(c["code"]) in ("BIOL20", "BIOL71", "MA4")]
check(len(rows) == 3 and all(c.get("units") is None for c in rows), "32214: the reading lists the three courses without units")
new, notes = R.reconcile(rec14, CERT, SJCC, f14["award"], title=f14["title"], control_number="32214", steps=STEPS)
units = [n for n in notes if n["field"] == "course_units"]
check(len(units) == 1 and units[0]["now"] == {"BIOL 020": [4, 4]} and "45835049303" in units[0]["words"],
      "32214: one fill, BIOL 020 at 4, and its note names the read (%r)" % [(n["field"], n["now"]) for n in notes])


def score14(rec):
    return S.score(rec, C.closed_list(SJCC, "32214"), CERT, f14["award"], R.prefix_aliases(SJCC, STEPS), False)


before, after = score14(rec14)["arithmetic"], score14(new)["arithmetic"]
check(not before["pass"] and before["computed"] == [30.0, 30.0] and before["stated"] == [31.0, 32.0],
      "32214: without the fill the record adds to 30 against the printed 31-32 (%r)" % before)
check(after["pass"] and after["computed"] == [31.0, 32.0],
      "32214: with it the choice carries 4-5 and the record adds to the printed 31-32 (%r)" % after)
block = next(b for b in new["blocks"] if any(S.norm_code(c["code"]) == "BIOL20" for c in b["courses"]))
check(block["stated"] == {"min": 3, "max": 3}, "32214: the 3 the page prints beside the choice stays as read")
priced = copy.deepcopy(rec14)
for b in priced["blocks"]:
    for c in b["courses"]:
        if S.norm_code(c["code"]) == "BIOL20":
            c["units"] = 3
got = R.reconcile(priced, CERT, SJCC, f14["award"], control_number="32214", steps=STEPS)[1]
check(not any(n["field"] == "course_units" for n in got), "a course the reading gave units keeps them")
hours = copy.deepcopy(rec14)
hours["program"]["measure"] = "hours"
got = R.reconcile(hours, CERT, SJCC, f14["award"], control_number="32214", steps=STEPS)[1]
check(not any(n["field"] == "course_units" for n in got), "a program measured in hours takes no units")
got = R.reconcile(rec14, CERT, SOLANO, f14["award"], control_number="32214", steps=STEPS)[1]
check(not any(n["field"] == "course_units" for n in got), "the step is San Jose City's alone")
filled = sorted(f["control_number"] for f in records(SJCC)
                if R._college_steps(unfilled(f), " ", SJCC, f.get("award"), steps=STEPS)[1])
check(filled == ["32214", "38426"], "across San Jose City's records the step fills BIOL 020 in two (%r)" % filled)

# ── the wrong joins a renumber refuses ─────────────────────────────────────
print("the wrong joins")


def placed(codes_, listed_codes, college):
    rec = {"program": {}, "blocks": [{"name": "Required", "rule": "all", "courses": [{"code": c, "units": 3} for c in codes_]}]}
    listed = {S.norm_code(c): 3.0 for c in listed_codes}
    out = S.with_prefix_aliases(rec, listed, R.prefix_aliases(college, STEPS))
    return [c["code"] for c in out["blocks"][0]["courses"]]


check(placed(["SOCI 002"], ["SOC 2"], SOLANO) == ["SOC2"], "Solano: SOCI 002 reads as the listed SOC 2")
check(placed(["SOCI 002"], ["SOC 2", "SOCI 002"], SOLANO) == ["SOCI 002"], "a list that holds the printed code keeps it")
check(placed(["SOCI 002"], ["SOC 23"], SOLANO) == ["SOCI 002"], "a list without the file's row renames nothing")
check(placed(["SOCI 010"], ["SOC 10"], SOLANO) == ["SOCI 010"], "a sociology course the entry does not name keeps its code")
check(placed(["SOCI 120"], ["SOC 120"], SBVC) == ["SOCI 120"], "San Bernardino Valley: SOCI 120 is not SOC 120")
check(placed(["SOCI 110"], ["SOC 110"], SBVC) == ["SOC110"], "San Bernardino Valley: SOCI 110 reads as the listed SOC 110")
check(placed(["SOCI 002"], ["SOC 2"], SJCC) == ["SOCI 002"], "Solano's pairs are Solano's alone")
check(placed(["ACCTG 020"], ["AccountingAC"], SJCC) == ["ACCOUNTINGAC"], "San Jose City: ACCTG 020 reads as the file's row")
vals = set(norm(sj.get("course_renumbers")).values())
check(not vals & {"COMPUTERGRAP", "REALESTATERE", "COSMETOLOGYC"}
      and ("JOURNALISMJO" not in vals or any(c.get("session") == "S742" and S.norm_code(c["printed"]) == "JOURN138"
                                             for c in sj.get("course_renumbers_cited") or [])),
      "a cut-off name that stands for several courses, or that no source names, is no pair (JournalismJO only as "
      "S742 cites it from the page's own line)")
by_key = {}
for f in records(SJCC):
    for c in C.closed_list(SJCC, f["control_number"]):
        by_key.setdefault(S.norm_code(c.get("code")), set()).add(c.get("ccn"))
check(all(len(by_key.get(v) or ()) == 1 for v in vals),
      "each file row a San Jose City pair names is one control number across every program's list")

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
