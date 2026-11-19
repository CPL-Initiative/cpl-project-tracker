#!/usr/bin/env python3
"""A card with no college course is never ready (kb/_row_audit.py; the Courses bot's scorer finding, #3480 Source 13,
item 3).

The failure it guards: the auditor scored a card on its stored fields alone, and those fields survive after every
college's course has moved off the card, so 270 emptied cards scored faculty-ready on 2026-11-17 while the Courses
List showed none of their courses. The count now comes from the List's own file (unified_courses_members.js), with
merged cards' courses folded into their target. Offline fixture:
  ARTS M1101  stored fields that score 1.0; its two minted courses re-homed to a C-ID card -> not ready, tagged
  ARTS M1102  the same fields, never had a course                                  -> not ready, tagged
  ARTS M1103  the same fields and one live course                                  -> ready, untagged
  ARTS M1104  merged into ARTS M1103                                               -> untouched (counts on its target)
  ARTS M1105  no course of its own, but a merged card's courses fold into it        -> ready, untagged

Run: python3 tests/row_audit_zero_members_test.py   (exit 0 = all pass)
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _row_audit as RA  # noqa: E402

results = []


def check(name, cond):
    results.append((name, bool(cond)))


LIST = {"colleges": ["Alpha College", "Beta College"], "members": {
    "ART 101": [{"c": 0, "cn": "CCC1", "t": "Drawing"}, {"c": 1, "cn": "CCC2", "t": "Drawing I"}],  # the C-ID card
    "ARTS M1103": [{"c": 0, "cn": "CCC3", "t": "Painting"}],
    "ARTS M1104": [{"c": 1, "cn": "CCC4", "t": "Painting I"}],
    "ARTS M1106": [{"c": 1, "cn": "CCC6", "t": "Glass"}],
}}
CURATION = {"ARTS M1104": {"merge_into": "ARTS M1103"}, "ARTS M1106": {"merge_into": "ARTS M1105"}}
full = {k: {"state": "curated", "value": "x"} for k in RA.FACULTY_WEIGHTS}

counts = RA._list_member_counts(LIST, CURATION)
check("the List's counts fold a merged card's courses into its target",
      counts["ARTS M1103"] == 2 and counts["ARTS M1105"] == 1 and "ARTS M1104" not in counts)
check("no List file means no cap (the rule cannot fire without its evidence)",
      RA._list_member_counts(None, CURATION) is None)

out = {}
for cid in ("ARTS M1101", "ARTS M1102", "ARTS M1103", "ARTS M1104", "ARTS M1105"):
    f_score, _ = RA._compute_scores(full, RA._virtual_mc({}), tags=[])
    tags = []
    f_score = RA._no_member_cap(cid, tags, f_score, counts, CURATION)
    out[cid] = (RA.tier_of(f_score), tags, f_score)

check("the fixture's stored fields score 1.0 before the cap", RA._compute_scores(full, RA._virtual_mc({}), tags=[])[0] == 1.0)
for cid in ("ARTS M1101", "ARTS M1102"):
    check(cid + " (no college course) is not ready", out[cid][0] != "ready")
    check(cid + " carries the zero-courses tag", out[cid][1] == [RA.NO_MEMBER_TAG])
    check(cid + " keeps the rest of its score (capped, not zeroed)", out[cid][2] == RA.NO_MEMBER_CAP)
check("ARTS M1103 (one live course) is ready", out["ARTS M1103"][0] == "ready" and out["ARTS M1103"][1] == [])
check("ARTS M1104 (merged) is left alone", out["ARTS M1104"][0] == "ready" and out["ARTS M1104"][1] == [])
check("ARTS M1105 (a merged card's courses on it) is ready", out["ARTS M1105"][0] == "ready" and out["ARTS M1105"][1] == [])
check("the cap sits just below ready", RA.tier_of(RA.NO_MEMBER_CAP) == "needs_review")

# Wiring: main() applies the cap to every Course row, after the score and before the tier.
src = open(os.path.join(ROOT, "kb", "_row_audit.py"), encoding="utf-8").read()
body = src[src.index("def main():"):src.index("def _build_cluster_fix")]
i_score = body.index("f_score, m_score = _compute_scores(faculty")
i_cap = body.index("_no_member_cap(course_id, tags, f_score, list_counts, curation)")
i_tier = body.index('"faculty_readiness":   tier_of(f_score)')
check("main() caps each Course row between its score and its tier", i_score < i_cap < i_tier)
check("main() reads the Courses List's file for the count", "unified_courses_members.js" in body)

failed = [n for n, ok in results if not ok]
for n, ok in results:
    print(("PASS  " if ok else "FAIL  ") + n)
print("\n%d/%d passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
