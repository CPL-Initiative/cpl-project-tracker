#!/usr/bin/env python3
"""How the Honors rows plan reads a course's subject (S655, COBIx's two findings on #3315, 2026-11-15T04:20:20Z).

WHY. (1) `subject_family` in kb/_honors_of_s653_dryrun.py took a subject's first three letters, so ENGL and ENGR, COMM
and COMP, BIOL and BIOT read as one subject, and a base that joins two of those disciplines escaped the "carries N
subjects" split flag, so its mint could go ahead. SUBJECT_FAMILY_APART now reads engineering, computing and
biotechnology apart. (2) `HONORS_SUBJECTS` in kb/_honors_anchors.py held only CHEMH while its comment named BIOLH, and
no college scoped it. It now lists, by college, every subject on the 2026-11-15 payload that is another subject plus H
on an Honors-titled course: Victor Valley's CHEMH and HISTH.

Every expected answer below was read by hand from the code or the record named beside it, never produced by running
the code under test. On the 2026-11-15 06:19 payload the two fixes move no class, anchor or digest of the plan: the
split-flag text of 8 pairs (7 of them rows, all on an official or already-flagged base), and nothing for (2), since
Victor Valley files no HIST 3B beside HISTH 3B.

Run: python3 tests/honors_subject_reading_test.py
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _honors_anchors as am  # noqa: E402
import _honors_of_s653_dryrun as d  # noqa: E402

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


# (1) The subject family, code by code. The left column is a code shape found in unified_courses_members.js.
FAMILY = [
    ("ENGL 1A", "ENG"), ("ENG 101", "ENG"), ("ENGLISH 1A", "ENG"), ("ENGL C1000", "ENG"),
    ("ENGR 10", "ENGR"), ("ENGR B10", "ENGR"),
    ("COMM 1", "COM"), ("COMS 1", "COM"), ("COMM C1000", "COM"),
    ("COMP 122", "CMPT"), ("COMP B12", "CMPT"), ("COMPSCI 2", "CMPT"), ("COMSC 11", "CMPT"),
    ("BIOL 1", "BIO"), ("BIO 101", "BIO"), ("Biology (BIOL) 20", "BIO"), ("BIOL C1000", "BIO"),
    ("BIOT 110", "BIOT"), ("BIOT M10", "BIOT"), ("BIOTECH 1", "BIOT"),
    ("LIB 100 F", "LIB"), ("MATH 1A", "MAT"),
]
for code, want in FAMILY:
    got = d.subject_family(code)
    check(f"(1) subject_family({code!r}) is {want}", got == want, got)


class W:
    def __init__(self, members):
        self.members = members


def r(college, code, title):
    return {"college": college, "code": code, "title": title}


HON = {"ENGL Z1": [r("A", "ENGL 1AH", "Honors Composition")]}
# One title, one number per college, no sequence mark, one Honors title: the subject flag alone can fire.
w = W(dict(HON, **{"ENGL Z2": [r("A", "ENGL 1A", "Composition"), r("B", "ENGR 1A", "Composition")]}))
got = d.split_flags(w, "ENGL Z1", "ENGL Z2")
check("(2) a base joining ENGL and ENGR is a split candidate on its two subjects",
      got == ["the base's courses carry 2 subjects: ENG, ENGR"], got)
w = W(dict(HON, **{"ENGL Z2": [r("A", "ENGL 1A", "Composition"), r("B", "ENGLISH 1A", "Composition"),
                                r("C", "ENG 1A", "Composition")]}))
got = d.split_flags(w, "ENGL Z1", "ENGL Z2")
check("(3) ENGL, ENGLISH and ENG are one subject: no flag", got == [], got)
w = W(dict(HON, **{"ENGL Z2": [r("A", "COMM 1A", "Composition"), r("B", "COMP 1A", "Composition")]}))
got = d.split_flags(w, "ENGL Z1", "ENGL Z2")
check("(4) COMM beside COMP reads as two subjects, named in sorted order",
      got == ["the base's courses carry 2 subjects: CMPT, COM"], got)

# (5) On the committed payload: BIOT 150 X holds Citrus College's BIOT 110 beside BIOL courses (read by hand from
# unified_courses_members.js, 2026-11-15 06:19), so its subjects now name BIOT apart from BIO.
real = d.Shim(ROOT)
base = real.members.get("BIOT 150 X") or []
has = any(m["college"] == "Citrus College" and m["code"] == "BIOT 110" for m in base)
flags = d.split_flags(real, "BIOL M10GV", "BIOT 150 X") if has else []
check("(5) BIOT 150 X's subjects name BIOT apart from BIO (Citrus BIOT 110 beside BIOL courses)",
      not has or any("BIO," in f and "BIOT" in f for f in flags), (has, flags))
if not has:
    print("note: Citrus BIOT 110 has left BIOT 150 X on this payload; case 5 read nothing")

# (6) The Honors subject marker, by college.
VV = "Victor Valley College"
ANCHOR = [
    # The record: Victor Valley CHEMH 206 beside CHEM 206, the one such pair in the payload.
    ((VV, "CHEMH 206", "HONORS INTRODUCTION TO CHEMISTRY II: ORGANIC CHEMISTRY"),
     (VV, "CHEM 206", "Intro Chem I I: Organic Chem"), "anchor"),
    # The same codes at another college: CHEMH is that college's own subject, so no anchor.
    (("Another College", "CHEMH 206", "HONORS INTRODUCTION TO CHEMISTRY II: ORGANIC CHEMISTRY"),
     ("Another College", "CHEM 206", "Intro Chem I I: Organic Chem"), None),
    # Victor Valley's HISTH 3B (the record) beside a HIST 3B the college would file: an anchor.
    ((VV, "HISTH 3B", "HONORS WORLD HISTORY SINCE 1500"), (VV, "HIST 3B", "World History Since 1500"), "anchor"),
    # A subject not on the list stays two subjects at Victor Valley too (BIOLH: COBIx's example, filed nowhere).
    ((VV, "BIOLH 100", "Honors General Biology"), (VV, "BIOL 100", "General Biology"), None),
]
for h, b, want in ANCHOR:
    got = am.anchor_kind(r(*h), r(*b))
    check(f"(6) {h[0]} {h[1]} beside {b[1]} is {want}", got == want, got)

vv = [m for ms in real.members.values() for m in ms if m["college"] == VV]
check("(7) the payload holds Victor Valley's HISTH 3B with an Honors title and no HIST 3B: the listing moves no row",
      any(m["code"] == "HISTH 3B" and am.honors_word(m["title"]) for m in vv)
      and not any(am.anchor_key(m["code"]) == "HIST3B" for m in vv),
      "the payload moved: re-read the HISTH count")

failed = [n for n, ok, _ in results if not ok]
for n, ok, why in results:
    print(("PASS " if ok else "FAIL ") + n + ("" if ok else "\n     " + str(why)[:300]))
print(f"{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
