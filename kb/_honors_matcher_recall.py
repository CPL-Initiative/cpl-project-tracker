#!/usr/bin/env python3
"""Self-recall for the Honors rows plan (S653): each derivation of the pairs, the course-title test and the lump test,
measured against hand labels in both directions.

WHY. The S652 review rule: a matcher ships only after it runs against records whose answer is already held, and
reports its right and wrong counts (.claude/skills/conductor-brief/SKILL.md). #3315's second review found the first
version of this file measured nothing: its derivation shared the matcher's blind spot (a space before Fullerton's
college letter), and its "right" was the matcher's pairs less a list of wrong ones, so it could not fall.

WHAT IS MEASURED, and how each count is defined.
  * The pairs, on the members file (unified_courses_members.js, local courses): the matcher
    (kb/_reclustering_s648_dryrun.py measure_honors) and the second derivation (kb/_honors_pairs_second.py), which
    share no code. For each: right = labeled-real pairs it finds; wrong = labeled-not-real pairs it finds; missed =
    labeled-real pairs it does not find; held out = labeled-not-real pairs it does not find. Unlabeled pairs are counted
    apart, never as right. The plan writes a row only where both find a pair.
  * The course-title test (kb/_honors_of_s653_dryrun.py one_course), on labeled title pairs: right and wrong.
  * The lump test (lump_reasons), on labeled bases: right and wrong.
Every label was read by hand from the course rows on 2026-11-14, most by #3313's and #3315's readers.

Run: python3 kb/_honors_matcher_recall.py [--json]
"""
import json
import os
import re
import sys
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

M_SIDE = re.compile(r"^[A-Z]{1,6} [MZ][0-9A-Z]{4}H?$")

# (Honors identity, base identity): True when the Honors course is the base course's Honors twin.
PAIR_LABELS = {
    # The pairs #3313's readers named as missed (abbreviated base titles, HNRS, H206, second bases).
    ("ARCH M10AP", "ARCH M10AN"): True, ("ARCH M10BP", "ARCH M10BD"): True, ("BUSI M10TV", "BUSI M10UK"): True,
    ("CHEM M1033", "CHEM M10DH"): True, ("HIST M10KJ", "HIST M1220"): True, ("ARTS M10UM", "ARTS M10UN"): True,
    ("ARTS M10UU", "ARTS M10UV"): True, ("ASTR M10AC", "PHSC M1003"): True, ("HIST M10UO", "HIST C1001"): True,
    ("ANTH M1015", "ETHS M10JD"): True, ("ENGL M1269", "ENGL M11CK"): True, ("ETHS M1266", "ETHS M1218"): True,
    ("MATH M1330", "MATH M10FF"): True, ("ENGL M1408", "ENGL M1122"): True,
    # The pairs #3315's readers named as missed (a space before the college letter; POL S; Honors Leadership).
    ("HUMA M1084", "PHIL M1003"): True, ("COMM M10CE", "COMM M10CF"): True, ("ENGL M11CL", "ENGL M11CH"): True,
    ("POLS M1060", "POLS 140"): True, ("COUN M10UB", "BUSI M1381"): True, ("PHS 103", "SOCI M10AA"): True,
    # Pairs the readers read by hand and found right.
    ("HUMA M10ME", "HUMA M1110"): True, ("LIBR M10CJ", "LIBR M1040"): True, ("ANTH M1005", "ANTH M1006"): True,
    ("ENGL M11FG", "ENGL M1353"): True, ("PHSC M10BO", "ASTR M1014"): True, ("ETHS M10IR", "ETHA M1002"): True,
    ("FTVE M1003", "FTVE M1002"): True, ("ETHS M1012", "ETHS M1011"): True, ("MUSI M1236", "MUSI M1237"): True,
    ("MATH 220", "MATH M1162"): True, ("CHEM M1052", "CHEM M1054"): True,
    # Not real: Glendale MATH 103H "Honors Calculus and Analytic Geometry" is MATH 103's twin (inside MATH 211), not
    # MATH 104's, Calculus II, which carries the same words.
    ("MATH 211", "MATH 221"): False,
}
UNCERTAIN = {
    ("COUN M10UC", "IDST M1144"): "Mt. SAC COUN 7H 'Planning for Transfer Success - Honors' beside COUN 7 'Introduction "
                                  "to the Transfer Process': one number, titles sharing one word",
}
# (title, title): True when they name one course.
TITLE_LABELS = [
    ("Women and Literature", "Women's Literature", True),
    ("American Indian Literature", "American Indian Literature (formerly ENGL 240H)", True),
    ("Media & Information Literacy", "Information and Media Literacy", True),
    ("Astronomy Laboratory", "Introduction to Astronomy Laboratory", True),
    ("US History", "United States History", True),
    ("General Chemistry", "Chemistry", True),
    ("Elementary French", "Elementary French I", True),
    ("Intermediate French 1", "Intermediate French I", True),
    ("English Composition", "College Composition", True),
    ("Modern Fiction", "Introduction to Fiction", False),
    ("Popular Fiction", "Introduction to Fiction", False),
    ("Survey of Music History and Literature: Greek Antiquity to 1750",
     "Survey of Music History and Literature: 1750 to the Present", False),
    ("History of Latin America to 1820", "History of Latin America since 1820", False),
    ("The Global Economy", "International Political Economy", False),
    ("Calculus 1", "Calculus 2", False),
    ("Calculus I", "Calculus II", False),
    ("Chemistry A", "Chemistry B", False),
    ("American Sign Language 1", "American Sign Language 2", False),
    ("Elementary French", "Elementary French 2", False),
    ("Phil of Science", "Physical Science", False),
    ("Hist of the Americas", "Histology of the Americas", False),
    ("Macroeconomics", "Microeconomics", False),
    ("Calculus", "Precalculus", False),
    ("History of Art: Prehistory through Middle Ages", "History of Western Art from the Middle Ages to the Renaissance",
     False),
]
# (base, Honors id): True when the base, or the Honors id, holds more than one course.
LUMP_LABELS = {
    ("ENGL M1258", "ENGL M11BL"): True, ("MUSI M1002", "MUSI M10BT"): True, ("ECON M1026", "ECON M1029"): True,
    ("CHEM M1044", "PHYS M10EV"): True, ("ENGL M1298", "ENGL M1282"): True, ("HIST M1096", "HIST M10HN"): True,
    ("HIST M1107", "HIST M10NY"): True, ("HIST M1196", "HIST M10AV"): True, ("THTR M1269", "ARTS M10PL"): True,
    ("HIST M1201", "HIST M1200"): True, ("ARTS M1566", "ARTS M10LJ"): True, ("ARTS M1074", "ARTS M10NC"): True,
    ("HUMA M1110", "HUMA M10ME"): False, ("ENGL M1353", "ENGL M11FE"): False, ("ASTR M1014", "ASTR M10BC"): False,
    ("LIBR M1040", "LIBR M10CI"): False, ("ANTH M1006", "ANTH M1005"): False, ("ETHA M1002", "ENGL M10DS"): False,
}
# Self-contained rows for the matcher's find_base, so its answer is pinned whatever the day's file holds.
FIXTURES = [
    ("an abbreviated base title, Orange Coast ARCH A296H",
     ("Orange Coast College", "ARCH A296H", "History of Architecture 2 Honors"),
     [("Orange Coast College", "ARCH A296", "Hist Of Arch 2")], "ARCH A296"),
    ("an abbreviated base title, El Camino HIST 122H",
     ("El Camino College", "HIST 122H", "Honors United States Social History: Cultural Pluralism in America"),
     [("El Camino College", "HIST 122", "U.S. Social History/Cultrl Plural Amer")], "HIST 122"),
    ("U.S. spelled out, Mt. SAC HIST 1H",
     ("Mt. San Antonio College", "HIST 1H", "HISTORY OF U.S. - HONORS"),
     [("Mt. San Antonio College", "HIST 1", "History of the United States")], "HIST 1"),
    ("the H206 number form, Victor Valley CHEM H206",
     ("Victor Valley College", "CHEM H206", "HONORS INTRODUCTION TO CHEMISTRY II:  ORGANIC CHEMISTRY"),
     [("Victor Valley College", "CHEM 206", "Intro Chem I I: Organic Chem")], "CHEM 206"),
    ("the HNRS spelling, Glendale ASTRO 110H",
     ("Glendale Community College", "ASTRO 110H", "HNRS ASTRO: THE SOLAR SYSTEM"),
     [("Glendale Community College", "ASTRO 110", "Astronomy Of The Solar System")], "ASTRO 110"),
    ("a space before the college letter, Fullerton PHIL 225HF beside PHIL 225 F",
     ("Fullerton College", "PHIL 225HF", "Honors American Religious Experience"),
     [("Fullerton College", "PHIL 225 F", "The American Religious Experience")], "PHIL 225 F"),
    ("a space inside the subject, Glendale POL S103H beside POLS 103",
     ("Glendale Community College", "POL S103H", "Honors American Political Institutions"),
     [("Glendale Community College", "POLS 103", "American Political Institutions")], "POLS 103"),
    ("the code base wins over a title twin, Glendale MATH 103H",
     ("Glendale Community College", "MATH 103H", "Honors Calculus and Analytic Geometry"),
     [("Glendale Community College", "MATH 103", "CALC/ANAL GEOM"),
      ("Glendale Community College", "MATH 104", "Calculus and Analytic Geometry")], "MATH 103"),
    ("a code match whose title names another course stays apart",
     ("A", "ENGL 1AH", "Honors Freshman Composition"), [("A", "ENGL 1A", "Creative Writing Workshop")], None),
    ("a code match with one shared word stays apart, Mt. SAC COUN 7H",
     ("Mt. San Antonio College", "COUN 7H", "Planning for Transfer Success - Honors"),
     [("Mt. San Antonio College", "COUN 7", "Introduction to the Transfer Process")], None),
]
SEQUENCE_NEGATIVES = [("Calculus I Honors", "Calculus II"), ("Physics 1", "Physics 2"), ("Chemistry A", "Chemistry B"),
                      ("US History to 1877", "US History since 1877")]


def matcher_pairs(members):
    import _reclustering_s648_dryrun as s648

    class W:
        pass
    w = W()
    w.members = members
    w.id_system = lambda i: "M-ID" if M_SIDE.match(i) else "C-ID"
    w.discipline = lambda i: "(not read)"
    w.voice = lambda c: c
    w.provenance = lambda *a: {}
    _, _, rows, _ = s648.measure_honors(w)
    pairs = defaultdict(int)
    for r in rows:
        if r.get("base_identity") and r["base_identity"] != r["identity"]:
            pairs[(r["identity"], r["base_identity"])] += 1
    return dict(pairs)


def score(found):
    found = set(found)
    pos = {p for p, v in PAIR_LABELS.items() if v}
    neg = {p for p, v in PAIR_LABELS.items() if not v}
    return {"right": len(found & pos), "wrong": len(found & neg), "missed": len(pos - found),
            "held_out": len(neg - found), "unlabeled_found": len(found - pos - neg),
            "wrong_pairs": sorted(map(list, found & neg)), "missed_pairs": sorted(map(list, pos - found))}


def fixtures():
    import _reclustering_s648_dryrun as s648
    res = []
    for name, (col, code, title), pool, want in FIXTURES:
        b, _ = s648.find_base({"college": col, "code": code, "title": title},
                              [{"college": c, "code": k, "title": t} for c, k, t in pool])
        got = b["code"] if b else None
        res.append({"name": name, "expected": want, "got": got, "pass": got == want})
    for a, b in SEQUENCE_NEGATIVES:
        v = s648.abbrev_agree(a, b)
        res.append({"name": f"a sequence never abbreviates: {a} / {b}", "expected": 0.0, "got": v, "pass": v == 0.0})
    for t in ("HNRS ART HIST: PREHIST-GOTHIC", "HNRS ASTRO: THE SOLAR SYSTEM"):
        k = s648.is_honors(t, "ART 101H")[0]
        res.append({"name": "an HNRS title is Honors: " + t, "expected": "honors", "got": k, "pass": k == "honors"})
    return res


def titles_score():
    import _honors_of_s653_dryrun as dr
    out = []
    for a, b, want in TITLE_LABELS:
        got = dr.one_course(a, b)
        out.append({"a": a, "b": b, "expected": want, "got": got, "pass": got == want})
    return {"right": sum(x["pass"] for x in out), "wrong": sum(not x["pass"] for x in out), "pairs": out}


def lumps_score(members_dir):
    import _honors_of_s653_dryrun as dr
    w = dr.Shim(members_dir)
    out = []
    for (b, h), want in sorted(LUMP_LABELS.items()):
        got = bool(dr.lump_reasons(w, h, b))
        out.append({"base": b, "honors_id": h, "expected": want, "got": got, "pass": got == want})
    return {"right": sum(x["pass"] for x in out), "wrong": sum(not x["pass"] for x in out), "bases": out}


def measure(members, members_dir=None):
    import _honors_pairs_second as second
    m, s = matcher_pairs(members), second.derive(members)
    both = set(m) & set(s)
    res = {
        "measure": "identity pairs on unified_courses_members.js (local courses); a pair is (Honors identity, base "
                   "identity) at one college; right, wrong and missed are against the hand labels in "
                   "kb/_honors_matcher_recall.py",
        "labels": {"real": sum(PAIR_LABELS.values()), "not_real": sum(1 for v in PAIR_LABELS.values() if not v),
                   "uncertain": [[a, b, why] for (a, b), why in UNCERTAIN.items()]},
        "matcher": dict(score(m), pairs=len(m)), "second": dict(score(s), pairs=len(s)),
        "both": dict(score(both), pairs=len(both)),
        "matcher_only": sorted(map(list, set(m) - set(s))), "second_only": sorted(map(list, set(s) - set(m))),
        "fixtures": fixtures(), "titles": titles_score(),
    }
    if members_dir:
        res["lumps"] = lumps_score(members_dir)
    return res


def main():
    import _mid_outcomes_compare as cmp
    members, gen = cmp.load_members(ROOT)
    res = measure(members, ROOT)
    res["members_generated_at"] = gen
    if "--json" in sys.argv:
        print(json.dumps(res))
        return 0
    for k in ("matcher", "second", "both"):
        r = res[k]
        print(f"{k}: {r['pairs']} pairs; right {r['right']}, wrong {r['wrong']}, missed {r['missed']}, held out "
              f"{r['held_out']}, unlabeled {r['unlabeled_found']}")
    print(f"titles: right {res['titles']['right']}, wrong {res['titles']['wrong']}; lumps: right "
          f"{res['lumps']['right']}, wrong {res['lumps']['wrong']}")
    for f in res["fixtures"]:
        if not f["pass"]:
            print("  FAIL " + f["name"])
    return 0


if __name__ == "__main__":
    sys.exit(main())
