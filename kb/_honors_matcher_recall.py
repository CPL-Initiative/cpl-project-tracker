#!/usr/bin/env python3
"""Self-recall for the Honors rows plan (S653, S654): each derivation of the pairs, the course-title test and the narrow
rule, measured against hand labels in both directions.

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
  * The narrow rule (kb/_honors_of_s653_dryrun.py narrow_reasons, without the plan's named lists), on labeled pairs:
    positives that must hold (every base #3315's third review named in findings 1 and 2, the six one-signal rows, two
    more read by hand) and negatives that must pair (plain one-course bases). Right and wrong on each side. It
    replaces the lump test, whose 12 positives were lumps the rule already caught, so it scored 18 of 18 while the
    review's lumps minted (finding 3).
Every label was read by hand from the course rows, on 2026-11-14 (most by #3313's and #3315's readers) and 2026-11-15.

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
# The anchored rows (S654, kb/_honors_anchors.py), labeled by hand on 2026-11-15 at two levels; never from the rule's
# output, and no label shares its parser (p-snapshot-test-pins-the-rule-s653).
#
# ANCHOR_LABELS, rule 1: (Honors row, base row, the college's other codes, expected kind). Rows are (college, code,
# title). Expected: "anchor", "doubtful", or None.
ANCHOR_LABELS = [
    # True same-college Honors pairs, the space-before-H shapes among them.
    (("Compton College", "ECON 101 H", "Honors Principles of Economics: Macroeconomics"),
     ("Compton College", "ECON 101", "Principles of Economics: Macroeconomics"), (), "anchor"),
    (("Cypress College", "LING 101 HC", "Honors Introduction to Language"),
     ("Cypress College", "LING 101 C", "Introduction to Language"), (), "anchor"),
    (("A", "MATH 1A H", "Honors Calculus I"), ("A", "MATH 1A", "Calculus I"), (), "anchor"),
    (("Fullerton College", "PHIL 225HF", "Honors American Religious Experience"),
     ("Fullerton College", "PHIL 225 F", "The American Religious Experience"), (), "anchor"),
    (("Orange Coast College", "ARCH A296H", "History of Architecture 2 Honors"),
     ("Orange Coast College", "ARCH A296", "Hist Of Arch 2"), (), "anchor"),
    (("Victor Valley College", "CHEM H206", "HONORS INTRODUCTION TO CHEMISTRY II:  ORGANIC CHEMISTRY"),
     ("Victor Valley College", "CHEM 206", "Intro Chem I I: Organic Chem"), (), "anchor"),
    (("De Anza College", "ECON 001H", "Principles of Macroeconomics - HONORS"),
     ("De Anza College", "ECON 1", "Principles of Macroeconomics"), (), "anchor"),
    (("Glendale Community College", "HIST 101H", "Honors&nbsp;World&nbsp;History"),
     ("Glendale Community College", "HIST 101", "World History"), (), "anchor"),
    # The padding zero (#3315's anchors review): San Jose City's 020H meets 20.
    (("San Jose City College", "Biology (BIOL) 020H", "Honors Human Biology"),
     ("San Jose City College", "Biology (BIOL) 20", "Human Biology"), (), "anchor"),
    # Up to three letters before the H: De Anza's online section F TV 2CWH beside F TV 02CW.
    (("De Anza College", "F TV 2CWH", "Contemporary World Cinema - HONORS"),
     ("De Anza College", "F TV 02CW", "Contemporary World Cinema"), (), "anchor"),
    # An entity inside the Honors word: read once html.unescape has run.
    (("E", "MATH 1H", "H&#111;nors Calculus"), ("E", "MATH 1", "Calculus"), (), "anchor"),
    # Doubtful: the marker in the number and equal titles, but no Honors word (Contra Costa's PHYS 121H shape).
    (("B", "MATH 5H", "Calculus"), ("B", "MATH 5", "Calculus"), (), "doubtful"),
    # False: a part I beside a part II, either way round.
    (("A", "MATH 1AH", "Honors Calculus I"), ("A", "MATH 1B", "Calculus II"), (), None),
    (("A", "MATH 1BH", "Honors Calculus II"), ("A", "MATH 1A", "Calculus I"), (), None),
    # False: a series letter H with no Honors word (MUS 10A to 10G at the college).
    (("C", "MUS 10H", "Piano"), ("C", "MUS 10", "Piano"), ("MUS 10A", "MUS 10B", "MUS 10C"), None),
    # A number pair whose titles disagree: doubtful with an Honors word, not Honors at all without one.
    (("A", "ENGL 1AH", "Honors Freshman Composition"), ("A", "ENGL 1A", "Creative Writing Workshop"), (), "doubtful"),
    (("D", "AUTO 060H", "Advanced Drivability and Onboard Diagnostics"), ("D", "AUTO 060", "Engine Performance"), (),
     None),
    (("Foothill College", "LINC 073H", "ADOBE ILLUSTRATOR OVERVIEW"),
     ("Foothill College", "LINC 73", "ADOBE PHOTOSHOP OVERVIEW"), (), None),
    # False: an H ending the subject with no Honors word is one course under two subjects (Glendale ART and ARTH).
    (("Glendale Community College", "ARTH 119", "Contemporary Art"),
     ("Glendale Community College", "ART 119", "CONTEMPORARY ART"), (), None),
    # False: two colleges; no Honors marker in the code; a base that is itself Honors.
    (("A", "ENGL 1AH", "Honors Composition"), ("B", "ENGL 1A", "Composition"), (), None),
    (("S", "HIST 17", "History of the United States - Honors"), ("S", "HIST 17", "History of the United States"), (),
     None),
    (("A", "ENGL 1AH", "Honors Composition"), ("A", "ENGL 1A", "Composition - Honors"), (), None),
]

# CLUSTER_FIXTURES, rules 2 and 3, self-contained: members, the Honors id, other bases another derivation names, and
# the expected row and mint. Ids are synthetic Z ids.
def _r(college, code, title):
    return {"college": college, "code": code, "title": title}


CLUSTER_FIXTURES = [
    ("anchors in two bases hold the row", {
        "ENGL Z9001": [_r("A", "ENGL 1AH", "Honors Composition"), _r("B", "ENGL 2H", "Honors Composition")],
        "ENGL Z9002": [_r("A", "ENGL 1A", "Composition")], "ENGL Z9003": [_r("B", "ENGL 2", "Composition")]},
     "ENGL Z9001", (), False, False),
    ("a doubtful anchor holds the row beside a good one", {
        "ENGL Z9011": [_r("A", "ENGL 1AH", "Honors Composition"), _r("B", "ENGL 5H", "Honors Poetry")],
        "ENGL Z9012": [_r("A", "ENGL 1A", "Composition"), _r("B", "ENGL 5", "Creative Writing Workshop")]},
     "ENGL Z9011", (), False, False),
    ("an unanchored member rides along: a row, no mint", {
        "HIST Z9021": [_r("A", "HIST 1H", "Honors United States History"), _r("C", "HIST 99", "Honors Seminar in History")],
        "HIST Z9022": [_r("A", "HIST 1", "United States History")]},
     "HIST Z9021", (), True, False),
    ("two Honors ids anchored into one base: a row, no mint", {
        "PSYC Z9031": [_r("A", "PSYC 1H", "Honors General Psychology")],
        "PSYC Z9032": [_r("B", "PSYC 1H", "Honors General Psychology")],
        "PSYC Z9033": [_r("A", "PSYC 1", "General Psychology"), _r("B", "PSYC 1", "General Psychology")]},
     "PSYC Z9031", (), True, False),
    ("an M-ID base holding a CCN-coded course: a row, no mint", {
        "MATH Z9041": [_r("A", "MATH 1H", "Honors Calculus")],
        "MATH Z9042": [_r("A", "MATH 1", "Calculus"), _r("B", "MATH C2210", "Calculus I")]},
     "MATH Z9041", (), True, False),
    ("an official base holding a CCN-coded course: held (MATH 210's shape)", {
        "MATH Z9051": [_r("A", "MATH 1H", "Honors Calculus")],
        "MATH 210": [_r("A", "MATH 1", "Calculus"), _r("B", "MATH C2210", "Calculus I")]},
     "MATH Z9051", (), False, False),
    ("another derivation names a second base: a row, no mint", {
        "ARTS Z9061": [_r("A", "ART 1H", "Honors Art History")], "ARTS Z9062": [_r("A", "ART 1", "Art History")]},
     "ARTS Z9061", ("ARTS Z9069",), True, False),
    ("an anchor's base course inside the Honors id itself holds the row (COUN M1144's shape)", {
        # Two Honors courses beside the base, so the mostly-not-Honors hold does not hide this one.
        "COUN Z9081": [_r("A", "COUN 1H", "Honors Academic Planning"), _r("B", "COUN 3H", "Honors Leadership Seminar"),
                       _r("A", "COUN 1", "Academic Planning")]},
     "COUN Z9081", (), False, False),
    ("an id mostly not Honors courses holds the row", {
        "IDST Z9091": [_r("A", "IDST 2H", "Honors Research Methods"), _r("B", "IDST 40", "Directed Research"),
                       _r("C", "IDST 41", "Applied Research Experience"), _r("D", "IDST 42", "Research Seminar")],
        "IDST Z9092": [_r("A", "IDST 2", "Research Methods")]},
     "IDST Z9091", (), False, False),
    ("a clean pair: a row and a mint", {
        "ARTS Z9071": [_r("A", "ART 2H", "Honors Modern Art")], "ARTS Z9072": [_r("A", "ART 2", "Modern Art")]},
     "ARTS Z9071", (), True, True),
]

# CLUSTER_LABELS, real ids the four reviews named, with what the anchored rule does and why (read by hand from the
# course rows on 2026-11-15). (Honors id, base, expected action, a phrase the reason carries.)
CLUSTER_LABELS = [
    # Fullerton LIB 100HF anchors to LIB 100 F; the base's other "Introduction to Research" courses (Cuesta MATH 290,
    # San Diego City BIOL 161) are the base's own impurity, and the anchor says where the row goes at a split.
    ("LIBR M10CL", "LIBR M1026", "row and mint", ""),
    # Mission BIO 017H anchors to BIO 17; Cosumnes BIOL 485 "Honors Seminar in Genetics" has no H in its number, so it
    # rides along unanchored and the mint waits.
    ("BIOL M1317", "BIOL M1318", "row, mint held", "not the Honors course of an anchor"),
    # Citrus HIST 160H, Fullerton HIST 270HF and Mt. San Jacinto HIST 115H all anchor into HIST M1191.
    ("HIST M1165", "HIST M1191", "row and mint", ""),
    # Irvine Valley HUM 1H anchors to HUM 1.
    ("HUMA M10LS", "HUMA M1088", "row and mint", ""),
    # San Jose City "Mathematics (MATH) 071H" anchors to "Mathematics (MATH) 71" once the padding zero drops (the
    # anchors review); MATH 210 holds MATH C2210 and C2210H, so the row holds on the CCN clause.
    ("MATH M10NA", "MATH 210", "held", "CCN-coded course"),
    # San Jose City "(ETH) 027H" meets "(ETH) 27" in ETHS M1213 beside El Camino's anchor into ETHS M1218: split.
    ("ETHS M1266", "ETHS M1213", "held", "anchors split"),
    # Contra Costa PHYS 121H "General College Physics" has no Honors word: a doubtful anchor, held.
    ("PHYS M1015", "PHYS 110", "held", "doubtful anchors only"),
    # Antelope Valley MATH 150H and Saddleback MATH 3AH anchor into C-ID MATH 210, which holds MATH C2210 and C2210H.
    ("MATH M1333", "MATH 210", "held", "CCN-coded course"),
    # Step 1's two rows stand. Each base has a second Honors M-ID anchored into it, so neither mints: LIBR M1040 takes
    # LIBR M10CI; HUMA M1110 takes PHIL M1124, itself held because its anchors split over HUMA M1034, HUMA M1110 and
    # two PHIL ids.
    ("HUMA M10ME", "HUMA M1110", "row, mint held", "Honors M-IDs anchored into it"),
    ("LIBR M10CJ", "LIBR M1040", "row, mint held", "Honors M-IDs anchored into it"),
]
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
    # A space before the H marker (#3315's third review, finding 4): honors_code_base joins it to the number. The
    # base titles are abbreviated, so only the code route finds them (the title route needs the exact title).
    ("a space before a lone H, Compton ECON 101 H",
     ("Compton College", "ECON 101 H", "Honors Principles of Economics: Macroeconomics"),
     [("Compton College", "ECON 101", "Prin of Econ: Macroeconomics")], "ECON 101"),
    ("a space before the H and the college letter, Cypress LING 101 HC",
     ("Cypress College", "LING 101 HC", "Honors Introduction to Language"),
     [("Cypress College", "LING 101 C", "Intro to Language")], "LING 101 C"),
    ("a space before the H and the college letter, Fullerton PHIL 225 HF",
     ("Fullerton College", "PHIL 225 HF", "Honors American Religious Experience"),
     [("Fullerton College", "PHIL 225 F", "Amer Religious Experience")], "PHIL 225 F"),
    ("a space before the H after a letter, MATH 1A H",
     ("A", "MATH 1A H", "Honors Calculus I"), [("A", "MATH 1A", "Calc I")], "MATH 1A"),
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
# honors_code_base, read directly: the Honors code and the base code it names (None: the code carries no marker).
CODE_BASES = [("ECON 101 H", "ECON 101"), ("LING 101 HC", "LING 101C"), ("PHIL 225 HF", "PHIL 225F"),
              ("MATH 1A H", "MATH 1A"), ("ENGL 1AH", "ENGL 1A"), ("CHEM H206", "CHEM 206"), ("HIST 484", None),
              ("ART 10 A", None)]
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
    for code, want in CODE_BASES:
        got = s648.honors_code_base(code)
        res.append({"name": f"the base code of {code}", "expected": want, "got": got, "pass": got == want})
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


def _row(t):
    return {"college": t[0], "code": t[1], "title": t[2]}


def anchors_score(drop=()):
    import _honors_anchors as A
    out = []
    for h, b, keys, want in ANCHOR_LABELS:
        import _reclustering_s648_dryrun as s648
        ck = {A.anchor_key(k) for k in keys} | {A.anchor_key(h[1]), A.anchor_key(b[1])}
        got = A.anchor_kind(_row(h), _row(b), ck, drop)
        out.append({"honors": f"{h[0]} {h[1]}", "base": b[1], "expected": want, "got": got, "pass": got == want})
    return {"labels": len(out), "right": sum(x["pass"] for x in out), "wrong": sum(not x["pass"] for x in out),
            "wrong_labels": [f"{x['honors']} / {x['base']}: {x['got']}" for x in out if not x["pass"]], "pairs": out}


def cluster_fixtures_score(drop=()):
    import _honors_anchors as A
    import honors_of as ho
    out = []
    for name, members, x, other, want_row, want_mint in CLUSTER_FIXTURES:
        an = A.anchors(members, drop)
        into = {}
        for a in an:
            if a["kind"] == "anchor" and a["base_id"] != a["honors_id"]:
                into.setdefault(a["base_id"], set()).add(a["honors_id"])
        dec = A.decide(x, [a for a in an if a["honors_id"] == x], members, into, other,
                       lambda i: not ho.is_m_id(i), drop)
        ok = (dec["row"], dec["mint"]) == (want_row, want_mint)
        out.append({"name": name, "expected": [want_row, want_mint], "got": [dec["row"], dec["mint"]], "pass": ok})
    return {"labels": len(out), "right": sum(x["pass"] for x in out), "wrong": sum(not x["pass"] for x in out),
            "wrong_labels": [x["name"] for x in out if not x["pass"]], "fixtures": out}


LABEL_ERA = "kb/anchor_rekey_out/2026-11-08/alias_map.json"   # the last applied map when the labels were written


def label_maps():
    import alias_chain
    pending, _ = alias_chain.pending_maps(None, baseline_through=LABEL_ERA)
    return alias_chain.load_maps(pending)


def clusters_score(plan, maps=None):
    """CLUSTER_LABELS against the plan. Each label id resolves through kb/alias_chain.py's pending maps (the plan's
    own era) and fails when it is not in the plan's pairs: a label never passes with no rows behind it."""
    import alias_chain
    pmaps = label_maps() if maps is None else maps
    by = {(p["honors_id"], p["base_id"]): p for p in plan}
    out = []
    for h, b, want, why in CLUSTER_LABELS:
        rh, rb = alias_chain.resolve_id(h, pmaps), alias_chain.resolve_id(b, pmaps)
        p = by.get((rh, rb))
        got = p["action"] if p else "(no such pair: the label's ids are gone)"
        reasons = " ".join((p or {}).get("holds", []) + (p or {}).get("no_mint", []))
        ok = bool(p) and got.split(":")[0] == want.split(":")[0] and got.startswith(want) and why in reasons
        out.append({"honors_id": rh, "base": rb, "expected": want, "got": got, "pass": ok})
    return {"labels": len(out), "right": sum(x["pass"] for x in out), "wrong": sum(not x["pass"] for x in out),
            "wrong_labels": [f"{x['honors_id']} / {x['base']}: {x['got']}" for x in out if not x["pass"]],
            "pairs": out}


def label_resolution_selftest(plan):
    """A label whose id a later alias map renamed still scores against the renamed pair, and one whose id a map sent
    nowhere live fails (#3315's anchors review: the alias pass never fired while the pending maps were empty)."""
    p = next(x for x in plan if x["honors_id"] == "LIBR M10CL")
    renamed = [dict(x, honors_id="LIBR M19ZZ") if x is p else x for x in plan]
    a = clusters_score(renamed, maps=[{"LIBR M10CL": "LIBR M19ZZ"}])
    b = clusters_score(plan, maps=[{"LIBR M10CL": "LIBR M19YY"}])
    hit = lambda r: next(x for x in r["pairs"] if x["base"] == "LIBR M1026")  # noqa: E731
    return [{"name": "a renamed label resolves to its new id and passes", "pass": hit(a)["pass"]
             and hit(a)["honors_id"] == "LIBR M19ZZ"},
            {"name": "a label renamed to an id the plan does not hold fails", "pass": not hit(b)["pass"]}]


def mutation():
    """Drop each clause of rules 1 to 3 in turn: a label must fail for each, or the clause guards nothing."""
    import _honors_anchors as A
    res = []
    for c in A.CLAUSES_1 + A.CLAUSES_2 + A.CLAUSES_3:
        a, f = anchors_score((c,)), cluster_fixtures_score((c,))
        res.append({"clause": c, "caught": bool(a["wrong"] or f["wrong"]),
                    "failing": (a["wrong_labels"] + f["wrong_labels"])[:3]})
    return res


def measure(members, members_dir=None, plan=None):
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
    res["anchors"] = anchors_score()
    res["cluster_fixtures"] = cluster_fixtures_score()
    res["mutation"] = mutation()
    if plan is None and members_dir:
        import _honors_of_s653_dryrun as dr
        import _reclustering_s648_dryrun as s648
        w = dr.Shim(members_dir)
        _, _, rows, _ = s648.measure_honors(w)
        cur = dr.jload(os.path.join(HERE, "coci_curation.json"))["curations"]
        plan = dr.plan_pairs(w, rows, members_dir, cur, second.derive(w.members))
    if plan is not None:
        cl = clusters_score(plan)
        fx = res["cluster_fixtures"]
        res["clusters"] = {"labels": cl["labels"] + fx["labels"], "right": cl["right"] + fx["right"],
                           "wrong": cl["wrong"] + fx["wrong"], "wrong_labels": cl["wrong_labels"] + fx["wrong_labels"],
                           "real": cl, "fixtures": fx}
        res["label_resolution"] = label_resolution_selftest(plan)
    return res


def main():
    """--plan-file <plan.json> scores the cluster labels against that committed plan (the JS test passes the newest
    one), so a routine re-cluster of the payload cannot turn main red; the live re-score stays in --plan's ABORT gate
    (kb/_honors_of_s653_dryrun.py), where it belongs (#3315's anchors review)."""
    import _mid_outcomes_compare as cmp
    members, gen = cmp.load_members(ROOT)
    plan = None
    if "--plan-file" in sys.argv:
        with open(sys.argv[sys.argv.index("--plan-file") + 1], encoding="utf-8") as f:
            plan = json.load(f)["pairs"]
    res = measure(members, ROOT, plan)
    res["members_generated_at"] = gen
    if "--json" in sys.argv:
        print(json.dumps(res))
        return 0
    for k in ("matcher", "second", "both"):
        r = res[k]
        print(f"{k}: {r['pairs']} pairs; right {r['right']}, wrong {r['wrong']}, missed {r['missed']}, held out "
              f"{r['held_out']}, unlabeled {r['unlabeled_found']}")
    a, c = res["anchors"], res["clusters"]
    print(f"titles: right {res['titles']['right']}, wrong {res['titles']['wrong']}; anchors: {a['labels']} labels, "
          f"right {a['right']}, wrong {a['wrong']}; clusters: {c['labels']} labels, right {c['right']}, wrong "
          f"{c['wrong']}")
    for x in a["wrong_labels"] + c["wrong_labels"]:
        print("  wrong: " + x)
    for m in res["mutation"]:
        print(f"  mutation {m['clause']}: {'caught by ' + '; '.join(m['failing']) if m['caught'] else 'NOT CAUGHT'}")
    for f in res["fixtures"]:
        if not f["pass"]:
            print("  FAIL " + f["name"])
    return 0


if __name__ == "__main__":
    sys.exit(main())
