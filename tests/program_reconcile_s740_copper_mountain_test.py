#!/usr/bin/env python3
"""S740 (lane 1, reads): Copper Mountain's renumbered courses, on the catalog's own words.

WHY. Kinesiology A.A.-T 43132 was a named gap with no record (catalog_renumbered,
kb/program_requirements_college/copper_mountain/named_gaps_s739.json): its own page in the catalog's reissue of
2026-11-18 (PDF p.107) prints BIOL 023 and six KINE courses where the state's file lists BI 23 and six PE courses, so
the page named 4 of its 11 listed courses and the capture refused it. Each course description in the reissue names its
former code ('Formerly known as PE 052.'), and the college's entry (kb/program_requirements_reconcile.json, "Copper
Mountain College", course_renumbers) now carries the seven pairs, each cited by that sentence.

The page text is quoted line for line: p.107 from college page read 45783372680 (S739,
kb/college_reads/s739a_copper_mountain_pages.json) and the course descriptions from 45835379921
(kb/college_reads/s740_reads_copper_mountain_renumbers.json).

Pinned here:
  * each pair on the catalog's words: the description prints the new code, its title and units, and the former code,
    which is the code the state's file lists for 43132;
  * the lever: without the pairs p.107 names 4 of 43132's 11 listed courses, with them all 11;
  * what a pair must never do: rename a code the state's file lists as printed;
  * the self-recall over every committed Copper Mountain record (the S652 review rule, counting what the pairs
    rename as well as the verdicts): the pairs reach 43132 and Liberal Arts: Mathematics and Science 18520 (BI 23)
    alone, and no record's verdict moves.

Run from repo root: python3 tests/program_reconcile_s740_copper_mountain_test.py
"""
import copy
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_piles_s714_ccsf as C  # noqa: E402
import _program_requirements_college as K  # noqa: E402
import _program_requirements_pilot as P  # noqa: E402
import _program_requirements_reconcile as R  # noqa: E402
import _program_requirements_score as S  # noqa: E402

CMC = "Copper Mountain College"
FOLDER = os.path.join(ROOT, "kb", "program_requirements_college", "copper_mountain", "records")
STEPS = R.load_steps()
WITHOUT = copy.deepcopy(STEPS)
WITHOUT[CMC] = {k: v for k, v in (WITHOUT.get(CMC) or {}).items() if not k.startswith("course_renumbers")}
checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


# ── the catalog's own words ─────────────────────────────────────────────────────────────────────────────────────
# PDF p.107, the program's own page (page read 45783372680), its requirement list line for line.
P107 = """Dept. /No.  Title                         Units
Required Core Courses:
KINE 101   Introduction to Kinesiology ....................................................3
BIOL 022  Human Anatomy..........................................................................4
BIOL 023  Human Physiology ......................................................................4
Movement Based Courses
Select one (1) course from three different areas (minimum of 3 units
total):
Team Sports
KINE 058A  Beginning Badminton ...............................................................1
KINE 54A  Beginning Basketball ..................................................................1
KINE 057A  Beginning Volleyball ...................................................................1
Dance
KINE 032A  Beginning Dance Aerobics ......................................................1
Fitness
KINE 039A  Beginning Weight Training .....................................................1
KINE 047A  Beginning Yoga .............................................................................1
Restricted Electives - Choose two courses from the following:
CH 001A, STAT C1000 or SOCI 003 (not both), PH 002A or PH 004A
(not both), PSYC C1000, or SOCI C1000
Total Units for the Major ............................................................................. 21-25
Cal-GETC General Education Units .................................................................34
Transferable elective units as needed.
MINIMUM TRANSFERABLE UNITS ..........................................................59-62
Advisor:   K. Avila, M. Salomon
KINESIOLOGYKINESIOLOGY
Associate in Arts in KINESIOLOGY
for transfer
"""
# The course descriptions (page read 45835379921, pp.135 and 159 to 161): each course's heading lines and the
# sentence that names its former code, as printed ('...' marks the description's lines left out).
DESCRIPTIONS = {
    "BIOL 023": ("BIOL 023\nHUMAN PHYSIOLOGY\n4 Units\n...\nstudents are advised to take BIOL 005 and BIOL 006 rather "
                 "than BIOL\n022 and BIOL 023. Formerly known as BI 023.", "BI 023", "BI 23"),
    "KINE 032A": ("KINE 032A\nBEGINNING DANCE AEROBICS\n1 Unit\n...\ntopics are also covered. Formerly known as PE "
                  "052.", "PE 052", "PE 52"),
    "KINE 039A": ("KINE 039A\nBEGINNING WEIGHT TRAINING\n1 Unit\n...\nown program for the other half of the required "
                  "hours. Formerly\nknown as PE 096.", "PE 096", "PE 96"),
    "KINE 047A": ("KINE 047A\nBEGINNING YOGA\n1 Unit\n...\non life-long health and wellness. Formerly known as PE 098.",
                  "PE 098", "PE 98"),
    "KINE 054A": ("KINE 054A\nBEGINNING BASKETBALL\n1 Unit\n...\nimpact on life-long health and wellness. Formerly "
                  "known as PE 045.", "PE 045", "PE 45"),
    "KINE 057A": ("KINE 057A\nBEGINNING VOLLEYBALL\n1 Unit\n...\nfitness and their impact on life-long health and "
                  "wellness. Formerly\nknown as PE 091.", "PE 091", "PE 91"),
    "KINE 058A": ("KINE 058A\nBEGINNING BADMINTON\n1 Unit\n...\nimpact on life-long health and wellness. Formerly "
                  "known as PE 043.", "PE 043", "PE 43"),
}

conf = STEPS.get(CMC) or {}
pairs = conf.get("course_renumbers") or {}
cited = {c.get("printed"): c for c in conf.get("course_renumbers_cited") or []}
closed = C.closed_list(CMC, "43132")
listed = {S.norm_code(c.get("code")) for c in closed}

print("each pair on the catalog's words")
check(set(pairs) == set(DESCRIPTIONS) and len(pairs) == 7, "the entry holds the seven pairs: %s" % sorted(pairs))
for printed, (words, former, filed) in DESCRIPTIONS.items():
    flat = re.sub(r"\s+", " ", words)
    check(pairs.get(printed) == filed, "%s is the file's %s" % (printed, filed))
    check(words.startswith(printed + "\n") and ("Formerly known as %s." % former) in flat,
          "%s: its description names its former code %s" % (printed, former))
    check(S.norm_code(former) == S.norm_code(filed) and S.norm_code(filed) in listed,
          "%s: the former code is the code the state's file lists for 43132" % printed)
    check(S.norm_code(printed) not in listed, "%s: the file does not list the printed code" % printed)
    c = cited.get(printed) or {}
    check(c.get("file") == filed and ("Formerly known as %s." % former) in str(c.get("evidence"))
          and c.get("session") == "S740", "%s: the pair is cited by that sentence" % printed)
    check(re.search(r"\b%s\b" % re.escape(printed.replace("054A", "54A")), P107) is not None,
          "%s: the program's own page prints it" % printed)

print("the lever: the program's own page")


def coverage(steps):
    ren = R.course_renumbers(CMC, steps)
    progs = K.with_renumbers([{"control_number": "43132", "closed_list": copy.deepcopy(closed)}], ren,
                             (steps.get(CMC) or {}).get("prefix_aliases"))
    found = P.find_codes(P107, progs[0]["closed_list"])
    return sorted(found), P.coverage(found, progs[0]["closed_list"])


found0, cov0 = coverage(WITHOUT)
found1, cov1 = coverage(STEPS)
check(len(closed) == 11 and found0 == ["PH2A", "PH4A", "PSYCC1000", "SOCIC1000"] and cov0 < P.ACCEPT_SHARE,
      "without the pairs p.107 names 4 of the 11 listed courses, under the accept share: %s" % found0)
check(len(found1) == 11 and cov1 == 1.0, "with the pairs p.107 names all 11: %s" % found1)

print("a pair never renames a code the file lists as printed")
ren = R.course_renumbers(CMC, STEPS)
check(set(ren) == {S.norm_code(v) for v in pairs.values()} and not set(ren) & {S.norm_code(k) for k in pairs},
      "the pairs are keyed by the file's codes, none of them a printed code")
same = K.with_renumbers([{"control_number": "x", "closed_list": [{"code": "KINE 032A", "units": 1.0}]}], ren, None)
check(not P.printed_forms(same[0]["closed_list"][0]), "a list that holds the printed code is read as printed")

print("the self-recall over every committed Copper Mountain record")


def score(f, steps):
    return S.score(f["record"], C.closed_list(CMC, f["control_number"]), None, f.get("award"),
                   R.prefix_aliases(CMC, steps), R.packed_codes(CMC, steps))


read, reached, down, up = 0, [], [], []
for path in sorted(glob.glob(os.path.join(FOLDER, "*.json"))):
    with open(path, encoding="utf-8") as fh:
        f = json.load(fh)
    if not isinstance(f.get("record"), dict):
        continue
    read += 1
    mine = {S.norm_code(c.get("code")) for c in C.closed_list(CMC, f["control_number"])}
    if mine & set(ren):
        reached.append(f["control_number"])
    a, b = score(f, WITHOUT), score(f, STEPS)
    if a["pass"] and not b["pass"]:
        down.append(f["control_number"])
    if b["pass"] and not a["pass"]:
        up.append(f["control_number"])
    if not mine & set(ren):
        check(a == b, "%s: a record that lists none of the seven scores the same" % f["control_number"])
check(read >= 48, "the recall read the college's records (%d)" % read)
check(sorted(reached) == ["18520", "43132"], "the pairs reach 18520 and 43132 alone: %s" % sorted(reached))
check(not down, "no passing record turns failing: %s" % down)
# 43132's filed record placed none of its courses (read from course-description pages); once a read from p.107 files
# it, the pairs are what place its courses, so it alone may pass with them and fail without.
check(set(up) <= {"43132"}, "the pairs newly pass no record but 43132, the lever's own: %s" % up)

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
