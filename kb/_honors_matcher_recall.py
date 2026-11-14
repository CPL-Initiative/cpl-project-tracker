#!/usr/bin/env python3
"""The Honors pair matcher's self-recall test (S653): an independent derivation of the Honors pairs, set against
`measure_honors` (kb/_reclustering_s648_dryrun.py), with the right, wrong and missed counts.

WHY. The S652 review rule: a matcher ships only after it runs against records whose answer is already held, and
reports its right and wrong counts (.claude/skills/conductor-brief/SKILL.md, *Review rules*). The S648 fixtures
pinned each precision gate, and nothing pinned recall: the readers of #3313 found Honors courses with an M-ID
Honors side that got no row and no hold (abbreviated base titles such as "Hist Of Arch 2", the HNRS spelling, the
CHEM H206 number form), and one wrong pair (Glendale MATH 103H matched Calculus II by title).

THE DERIVATION, written apart from the matcher and sharing none of its helpers. At one college:
  * code path: a course whose title says Honors (honors, honours, HNRS) and whose number carries the H marker
    (1AH, A290H, 102HF, H206, or a subject ending in H) sits beside a course whose code is that code without the H,
    in the same subject, and whose title does not say Honors;
  * title path: a course whose title says Honors sits beside a course in the same subject whose title is the same
    once the Honors word is struck.
A pair is (the Honors course's identity, the base course's identity) when the two differ. The derivation is
looser than the matcher on purpose (the title path takes an ambiguous title, which the matcher refuses), so a
pair it alone finds is a candidate, and the hand labels below say which candidates are real.

COUNTS. "right" = matcher pairs not labeled wrong; "wrong" = matcher pairs labeled wrong by hand (WRONG);
"missed" = code-path pairs with an M-ID Honors side the matcher does not find, less those labeled not real or
uncertain by hand (NOT_MISSES). Every count is of identity pairs on the committed members file
(unified_courses_members.js, "local courses").

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

WORD = re.compile(r"\b(honou?rs?|hnrs)\b", re.I)
M_SIDE = re.compile(r"^[A-Z]{1,6} [MZ][0-9A-Z]{4}H?$")

# Hand labels, each read from the course rows on 2026-11-14 (S653).
WRONG = {
    ("MATH 211", "MATH 221"): "Glendale MATH 103H 'Honors Calculus and Analytic Geometry' is the Honors twin of MATH 103 "
                              "'CALC/ANAL GEOM' (inside MATH 211), not of MATH 104, Calculus II",
}
NOT_MISSES = {
    ("COUN M10UC", "IDST M1144"): "uncertain: Mt. SAC COUN 7H 'Planning for Transfer Success - Honors' beside COUN 7 "
                                  "'Introduction to the Transfer Process'; the titles share one word, and the title gate "
                                  "holds such a pair out by design",
}
# The pairs the #3313 readers named as missed, which the matcher must find (kb/_reclustering_s648_dryrun.py).
MUST_FIND = [
    ("ARCH M10AP", "ARCH M10AN"), ("ARCH M10BP", "ARCH M10BD"), ("BUSI M10TV", "BUSI M10UK"),
    ("CHEM M1033", "CHEM M10DH"), ("HIST M10KJ", "HIST M1220"), ("ARTS M10UM", "ARTS M10UN"),
    ("ARTS M10UU", "ARTS M10UV"), ("ASTR M10AC", "PHSC M1003"), ("HIST M10UO", "HIST C1001"),
    ("ANTH M1015", "ETHS M10JD"), ("ENGL M1269", "ENGL M11CK"), ("ETHS M1266", "ETHS M1218"),
    ("MATH M1330", "MATH M10FF"),
]
# Self-contained rows (copied from the members file), so the matcher's answer on each is pinned whatever the
# day's file holds: (name, honors row, pool at the college, expected base code or None).
FIXTURES = [
    ("an abbreviated base title, Orange Coast ARCH A296H",
     ("Orange Coast College", "ARCH A296H", "History of Architecture 2 Honors"),
     [("Orange Coast College", "ARCH A296", "Hist Of Arch 2")], "ARCH A296"),
    ("an abbreviated base title, Orange Coast BUS A118H",
     ("Orange Coast College", "BUS A118H", "Introduction to International Business Honors"),
     [("Orange Coast College", "BUS A118", "Intro to Intl Business")], "BUS A118"),
    ("an abbreviated base title, El Camino HIST 122H",
     ("El Camino College", "HIST 122H", "Honors United States Social History: Cultural Pluralism in America"),
     [("El Camino College", "HIST 122", "U.S. Social History/Cultrl Plural Amer")], "HIST 122"),
    ("an abbreviated base title, Orange Coast MATH A285H",
     ("Orange Coast College", "MATH A285H", "Introduction to Linear Algebra and Differential Equations Honors"),
     [("Orange Coast College", "MATH A285", "Intro Lin Alg/Diff Equa")], "MATH A285"),
    ("U.S. spelled out, Mt. SAC HIST 1H",
     ("Mt. San Antonio College", "HIST 1H", "HISTORY OF U.S. - HONORS"),
     [("Mt. San Antonio College", "HIST 1", "History of the United States")], "HIST 1"),
    ("the H206 number form, Victor Valley CHEM H206",
     ("Victor Valley College", "CHEM H206", "HONORS INTRODUCTION TO CHEMISTRY II:  ORGANIC CHEMISTRY"),
     [("Victor Valley College", "CHEM 206", "Intro Chem I I: Organic Chem")], "CHEM 206"),
    ("the HNRS spelling, Glendale ASTRO 110H",
     ("Glendale Community College", "ASTRO 110H", "HNRS ASTRO: THE SOLAR SYSTEM"),
     [("Glendale Community College", "ASTRO 110", "Astronomy Of The Solar System")], "ASTRO 110"),
    ("the code base wins over a title twin, Glendale MATH 103H (the wrong pair)",
     ("Glendale Community College", "MATH 103H", "Honors Calculus and Analytic Geometry"),
     [("Glendale Community College", "MATH 103", "CALC/ANAL GEOM"),
      ("Glendale Community College", "MATH 104", "Calculus and Analytic Geometry")], "MATH 103"),
    ("a code match whose title names another course stays apart",
     ("A", "ENGL 1AH", "Honors Freshman Composition"),
     [("A", "ENGL 1A", "Creative Writing Workshop")], None),
    ("a code match with one shared word stays apart, Mt. SAC COUN 7H",
     ("Mt. San Antonio College", "COUN 7H", "Planning for Transfer Success - Honors"),
     [("Mt. San Antonio College", "COUN 7", "Introduction to the Transfer Process")], None),
]
HNRS_TITLES = ["HNRS ART HIST: PREHIST-GOTHIC", "HNRS ART HIST: RENAISS-MODERN", "HNRS ASTRO: THE SOLAR SYSTEM"]


def _code(c):
    c = " ".join((c or "").upper().split())
    if " " not in c:
        return None, c
    s, n = c.rsplit(" ", 1)
    return s.replace(" ", ""), (n.lstrip("0") or "0")


def _without_h(c):
    s, n = _code(c)
    if s is None:
        return None
    m = re.fullmatch(r"([A-Z]?\d+[A-Z]?)H([A-Z]?)", n) or re.fullmatch(r"H(\d+[A-Z]?)()", n)
    if m:
        return s, (m.group(1) + m.group(2)).lstrip("0") or "0"
    if s.endswith("H") and len(s) > 2:
        return s[:-1], n
    return None


def _struck(t):
    return " ".join(re.sub(r"[^a-z0-9]+", " ", WORD.sub(" ", (t or "").lower())).split())


def derive(members):
    """(honors identity, base identity) -> set of paths ('code', 'title')."""
    by = defaultdict(list)
    for ident, rs in members.items():
        for r in rs:
            by[r["college"]].append((ident, r["code"], r["title"] or ""))
    out = defaultdict(set)
    for rs in by.values():
        codes, titles = defaultdict(list), defaultdict(list)
        for ident, code, title in rs:
            codes[_code(code)].append((ident, title))
            if not WORD.search(title):
                titles[(_code(code)[0], _struck(title))].append(ident)
        for ident, code, title in rs:
            if not WORD.search(title):
                continue
            wh = _without_h(code)
            for bi, bt in codes.get(wh, []) if wh else []:
                if not WORD.search(bt) and bi != ident:
                    out[(ident, bi)].add("code")
            for bi in titles.get((_code(code)[0], _struck(title)), []):
                if bi != ident:
                    out[(ident, bi)].add("title")
    return out


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
    return pairs


def fixtures():
    import _reclustering_s648_dryrun as s648
    res = []
    for name, (col, code, title), pool, want in FIXTURES:
        row = {"college": col, "code": code, "title": title}
        b, how = s648.find_base(row, [{"college": c, "code": k, "title": t} for c, k, t in pool])
        got = b["code"] if b else None
        res.append({"name": name, "expected": want, "got": got, "pass": got == want})
    for t in HNRS_TITLES:
        k = s648.is_honors(t, "ART 101H")[0]
        res.append({"name": "an HNRS title is Honors: " + t, "expected": "honors", "got": k, "pass": k == "honors"})
    return res


def measure(members):
    m = matcher_pairs(members)
    d = derive(members)
    mset, dset = set(m), set(d)
    code_m = {p for p in dset if "code" in d[p] and M_SIDE.match(p[0])}
    missed = sorted(p for p in code_m - mset if p not in NOT_MISSES)
    wrong = sorted(p for p in mset if p in WRONG)
    return {
        "measure": "identity pairs on unified_courses_members.js (local courses); a pair is (Honors identity, base "
                   "identity) at one college",
        "matcher_pairs": len(mset), "matcher_course_rows": sum(m.values()), "derivation_pairs": len(dset),
        "both": len(mset & dset), "matcher_only": len(mset - dset), "derivation_only": len(dset - mset),
        "right": len(mset) - len(wrong), "wrong": len(wrong), "wrong_pairs": [list(p) for p in wrong],
        "missed": len(missed), "missed_pairs": [list(p) for p in missed],
        "code_path_m_id_pairs": len(code_m),
        "not_misses": [[a, b, NOT_MISSES[(a, b)]] for a, b in sorted(code_m - mset) if (a, b) in NOT_MISSES],
        "must_find_missing": [list(p) for p in MUST_FIND if p not in mset],
        "fixtures": fixtures(),
    }


def main():
    import _mid_outcomes_compare as cmp
    members, gen = cmp.load_members(ROOT)
    res = measure(members)
    res["members_generated_at"] = gen
    if "--json" in sys.argv:
        print(json.dumps(res))
        return 0
    print(f"matcher {res['matcher_pairs']} pairs ({res['matcher_course_rows']} course rows); right {res['right']}, "
          f"wrong {res['wrong']}, missed {res['missed']} (code-path pairs with an M-ID Honors side: "
          f"{res['code_path_m_id_pairs']})")
    for p in res["missed_pairs"]:
        print("  missed:", p)
    for f in res["fixtures"]:
        print(("  ok  " if f["pass"] else "  FAIL ") + f["name"])
    return 0


if __name__ == "__main__":
    sys.exit(main())
