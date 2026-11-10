#!/usr/bin/env python3
"""The exhibit re-analysis code checks (scheduled_sessions.md step 9).

  1. A generic first word (Introduction to ...) makes no title stem, so unrelated
     courses are never called siblings.
  2. A shared stem before a colon is the stem.
  3. An issuer's parenthetical acronym and punctuation do not split one spelling.
  4. On the built reference, the 2026-11-10 run's spelling finding still reproduces:
     Wildland Fire-Basics' issuer is flagged beside California State Fire Training (SFT).

Run from the repo root: python3 tests/exhibit_reanalysis_checks_test.py
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "kb"))
import _exhibit_reanalysis_checks as X  # noqa: E402

fails = []


def check(label, cond):
    print(("ok   " if cond else "FAIL ") + label)
    if not cond:
        fails.append(label)


check("1 generic first word makes no stem", X.stem("Introduction to Geographic Information Systems") is None)
check("1b a stopword second makes no stem", X.stem("Principles of Accounting Two") is None)
check("2 colon stem", X.stem("Haz Mat Specialist 1F: Specialized Mitigation") == "haz mat specialist 1f")
check("3 acronym and punctuation", X.norm_issuer("State Fire Training (SFT)") == X.norm_issuer("State Fire-Training"))
saves = [{"course_id": "_CREDENTIAL_REVIEW::Wildland Fire-Basics", "field": "issuing_agency_override",
          "value": "State Fire Training (SFT)", "reviewed_at": "2026-11-01"}]
f = X.run(saves, [])
row = f[0]
if row.get("issuer_now") == ["State Fire Training (SFT)"]:
    sp = [c for c in row["checks"] if c["check"] == "issuer_spellings"]
    check("4 spelling finding reproduces", bool(sp) and "California State Fire Training (SFT)" in sp[0]["also_spelled"])
else:
    print("skip 4: the issuer was corrected since 2026-11-10 (%s)" % row.get("issuer_now"))
sys.exit(1 if fails else 0)
