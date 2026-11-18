#!/usr/bin/env python3
"""Not-applicable courses and cards: kept for the record, out of every count (Sam's flag-and-hide rule, 2026-11-17;
the Courses bot's ask, #3480 Source 13, item 4).

The title rule is kb/_not_applicable_rule.py: independent or directed study, an internship or work experience, or a
code-only listing. Such a course is set up one student at a time, or carries a number and no title, so it is never
shared across colleges.

  courses   every course in the state's course list (coci_lookup_data.js) that sits on no shared course in the
            Courses List's file (unified_courses_members.js), keyed "college|control number", whose title matches.
            They leave the gap count (the College Matrix line, the List's "No M-ID" and "No identity" counts).
  cards     every live card (not merged; minted, merge target or one-course card, never a C-ID or CCN anchor) with at least one college's course on the List, where EVERY course on it
            matches. A card's own title never decides it.

Nothing is deleted. This writes kb/coci_not_applicable.json; kb/_flags.py reads it.

    python3 kb/_build_not_applicable.py            # write kb/coci_not_applicable.json
    python3 kb/_build_not_applicable.py --check    # exit 1 when the committed file differs from a rebuild
"""
import os
import re
import sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _flags as F  # noqa: E402
import _not_applicable_rule as R  # noqa: E402

ROOT = os.path.dirname(HERE)
OUT = "kb/coci_not_applicable.json"
INPUTS = {
    "coci_courses": "coci_lookup_data.js",
    "list_members": "unified_courses_members.js",
    "curation": "kb/coci_curation.json",
    "cards": "kb/coci_minted_courses.json",
    "one_course_cards": "kb/coci_minted_singletons.json",
}
# coci_lookup_data.js row layout (coci_lookup.js ROW).
COLLEGE, CTRL, SUBJ, NUM, TITLE = 0, 1, 2, 3, 4


def subject_codes(coci):
    return frozenset(re.sub(r"[^A-Z0-9]", "", str(r[SUBJ] or "").upper()) for r in coci.get("rows") or [])


def build(coci, list_members, curation, universe=None):
    """universe: the card ids that may carry the flag (F.card_universe); None allows every card on the List."""
    codes = subject_codes(coci)
    names = [str(c or "").strip() for c in (list_members.get("colleges") or [])]
    members = list_members.get("members") or {}
    by_key, by_cn = set(), set()
    for rows in members.values():
        for m in rows or []:
            if m.get("cn"):
                c = m.get("c")
                by_key.add(F.course_key(names[c] if isinstance(c, int) and c < len(names) else "", m["cn"]))
                by_cn.add(str(m["cn"]))
    colleges = [str(c or "").strip() for c in (coci.get("colleges") or [])]
    courses, gaps = {}, Counter()
    for r in coci.get("rows") or []:
        college, cn = colleges[r[COLLEGE]] if r[COLLEGE] < len(colleges) else "", str(r[CTRL] or "")
        k = F.course_key(college, cn)
        if k in by_key or cn in by_cn:      # the List's join: college and control number, else control number alone
            continue
        kind = R.kind_of(r[TITLE], codes)
        if kind:
            courses[k] = [kind, str(r[TITLE] or "")]
        else:
            gaps["real_gap"] += 1
    cards = {}
    for cid, rows in F.folded_members(members, curation).items():
        if (curation.get(cid) or {}).get("merge_into") or not rows or (universe is not None and cid not in universe):
            continue
        kinds = [R.kind_of(m.get("t"), codes) for m in rows]
        if all(kinds):
            ks = sorted(set(kinds))
            cards[cid] = {"kind": ks[0] if len(ks) == 1 else "mixed", "courses": len(rows),
                          "titles": sorted({str(m.get("t") or "") for m in rows})[:5]}
    return courses, cards, gaps["real_gap"]


def main(argv):
    check = "--check" in argv
    ROOT = argv[argv.index("--root") + 1] if "--root" in argv else globals()["ROOT"]   # a fixture checkout, for tests
    p = lambda k: os.path.join(ROOT, INPUTS[k])  # noqa: E731
    curation = (F._read(ROOT, INPUTS["curation"]) or {}).get("curations") or {}
    universe = F.card_universe((F._read(ROOT, INPUTS["cards"]) or {}).get("courses") or {}, curation,
                               (F._read(ROOT, INPUTS["one_course_cards"]) or {}).get("courses") or {})
    courses, cards, real_gaps = build(F.loadjs(p("coci_courses")), F.loadjs(p("list_members")), curation, universe)
    by_kind = Counter(v[0] for v in courses.values())
    payload = {
        "_about": "Not-applicable courses and cards, kept for the record and out of every count, waiting pile, to-do "
                  "and fetch plan (Sam, 2026-11-17: flag the record, never delete it). Built by "
                  "kb/_build_not_applicable.py; read through kb/_flags.py.",
        "_rule": "kb/_not_applicable_rule.py",
        "_rule_version": R.RULE_VERSION,
        "_course_notes": F.NA_COURSE_NOTES,
        "_card_notes": F.NA_CARD_NOTES,
        "_inputs": {k: {"path": v, "sha256": F.sha256_of(p(k))} for k, v in sorted(INPUTS.items())},
        "_courses_shape": "college|control number -> [kind, title as the state's course list prints it]",
        "counts": {"courses": len(courses), "courses_by_kind": dict(sorted(by_kind.items())),
                   "courses_with_no_card": len(courses) + real_gaps, "real_gaps": real_gaps,
                   "cards": len(cards), "cards_by_kind": dict(sorted(Counter(c["kind"] for c in cards.values()).items()))},
        "courses": courses,
        "cards": cards,
    }
    if check:
        cur = F._read(ROOT, OUT) or {}
        same = cur.get("courses") == courses and cur.get("cards") == cards
        print("%s: %s" % (OUT, "current" if same else "STALE: run python3 kb/_build_not_applicable.py"))
        return 0 if same else 1
    F.write_json(os.path.join(ROOT, OUT), payload)
    c = payload["counts"]
    print("wrote %s: %d courses %s of %d with no card (%d real gaps); %d cards %s"
          % (OUT, c["courses"], c["courses_by_kind"], c["courses_with_no_card"], real_gaps, c["cards"], c["cards_by_kind"]))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
