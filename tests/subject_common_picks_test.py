#!/usr/bin/env python3
"""COBI's common-subject picks (kb/subject_decisions.py, S749; Sam's alignment rulings of 2026-11-28, relayed by COBIx).

WHAT THIS GUARDS:
  (1) a pick sets a row's common code ahead of a person's statewide filing and the subject map;
  (2) a person's college save stands ahead of a pick (Person-settled wins);
  (3) a pick on the other of credit and whole stands, marked moved;
  (4) refused and listed: a noncredit band, a code the canonical file does not hold (SPAN, WKPR until theirs exist),
      a confidence outside 0-100, a row with no finder, a college with no slug;
  (5) a pick never routes a mint: for_course reads the college save alone;
  (6) the Subjects build writes common_source cobi, its common_confidence, and no decision, and counts it;
  (7) a pick on a code COCI folds (Moorpark CNSEM, CNSE with M in its number) lands on the folded code.
Run from repo root: python3 tests/subject_common_picks_test.py
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "kb"))
import subject_decisions as SD  # noqa: E402

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


CANON = {"disciplines": {
    "Accounting": {"canonical_subj4": "ACCT"}, "Business": {"canonical_subj4": "BUSI"},
    "Sociology": {"canonical_subj4": "SOCI"}, "Ethnic Studies": {"canonical_subj4": "ETHS"},
}}
DOC = {
    "decisions": [{"key": "SUBJ:beta|SOC|credit", "common_code": "ETHS", "who": "a reviewer", "at": "2026-11-28T00:00:00."}],
    "statewide": [{"key": "_SUBJ_DISC::ACCT", "code": "ACCT", "discipline": "Business", "who": "a reviewer"}],
}


def pick(**kw):
    row = {"college": "Beta College", "local_subject_code": "ACCT", "band": "credit", "common_code": "ACCT",
           "confidence": "95", "found_by": "COBI", "basis": "Sam's ruling 1", "_file": "t.csv", "_line": 2}
    row.update(kw)
    return row


SLUGS = {"beta": "beta", "beta college": "beta", "moorpark": "moorpark"}
picks = [pick(),
         pick(local_subject_code="SOC", common_code="SOCI", _line=3),
         pick(local_subject_code="ACTG", band="whole", _line=4),
         pick(local_subject_code="NC1", band="nc:short-term-vocational", _line=5),
         pick(local_subject_code="SPAN", common_code="SPAN", _line=6),
         pick(local_subject_code="BAD1", confidence="140", _line=7),
         pick(local_subject_code="BAD2", found_by="", _line=8),
         pick(college="Nowhere College", _line=9),
         pick(college="moorpark", local_subject_code="CNSEM", common_code="ACCT", _line=10)]
d = SD.Decisions(DOC, CANON, picks=picks, slugs=SLUGS)

r, src = d.resolve("beta", "ACCT", "credit")
check("(1) a pick stands ahead of a statewide filing", src == "cobi_pick" and r["common_code"] == "ACCT" and r["confidence"] == 95,
      (src, r))
r, src = d.resolve("beta", "SOC", "credit")
check("(2) a person's college save stands ahead of a pick", src == "subject_decision" and r["common_code"] == "ETHS", (src, r))
r, src = d.resolve("beta", "ACTG", "credit")
check("(3) a whole pick stands on the credit row, marked moved", src == "cobi_pick" and r["moved"] is True, (src, r))
whys = {x["key"]: x["why"] for x in d.refused}
check("(4) a noncredit band is refused", "noncredit" in whys.get("t.csv:5", ""), whys)
check("(4) a code the canonical file lacks is refused (SPAN waits for its code)", "not a canonical SUBJ" in whys.get("t.csv:6", ""), whys)
check("(4) a confidence outside 0-100 is refused", "0 to 100" in whys.get("t.csv:7", ""), whys)
check("(4) a row with no finder is refused", "finder" in whys.get("t.csv:8", ""), whys)
check("(4) a college with no slug is refused", "no slug" in whys.get("t.csv:9", ""), whys)
check("(5) a pick never routes a mint", d.for_course("beta", "ACCT", "Y") is None)
check("(7) a pick on a folded code lands on the folded code", ("moorpark", "CNSE", "credit") in d.picks, sorted(d.picks))

# (6) the build on the committed files: every cobi row carries a confidence and no decision; the count adds up.
B = json.load(open(os.path.join(ROOT, "kb", "status", "local_subject_titles.json"), encoding="utf-8"))
cols = B["columns"]
check("(6) the build has a common_confidence column", "common_confidence" in cols, cols)
ix = {k: i for i, k in enumerate(cols)}
cobi = [r for c in B["colleges"] for r in c["rows"] if r[ix["common_source"]] == "cobi"]
check("(6) every cobi row carries a 0-100 confidence and no decision",
      all(isinstance(r[ix["common_confidence"]], int) and 0 <= r[ix["common_confidence"]] <= 100 and r[ix["decision"]] is None
          for r in cobi), cobi[:2])
check("(6) the totals count the cobi rows", B["totals"].get("common_by_cobi") == len(cobi), (B["totals"].get("common_by_cobi"), len(cobi)))
live = SD.load(ROOT)
check("(6) the committed picks are all applied or listed", len(live.picks) + sum(1 for x in live.refused if ".csv:" in str(x["key"]))
      == len(SD.read_picks(ROOT)))

fail = 0
for n, ok, why in results:
    print(("PASS " if ok else "FAIL ") + n + ("" if ok else "\n     " + str(why)[:400]))
    fail += 0 if ok else 1
print("%d/%d checks passed" % (len(results) - fail, len(results)))
sys.exit(1 if fail else 0)
