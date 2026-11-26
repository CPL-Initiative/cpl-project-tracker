#!/usr/bin/env python3
"""S740, lane 1 at San Jose City after the reconcile's reread: the two records s740c4 held, each with its gap named.

WHY. kb/_program_piles_s740_sjcc2.py reads 32078 and 08859 again once the reread of the free reconcile 45840981324
posted their rows. The reconcile reads their course lists, and each still fails on its units. The shared checks are
tests/program_piles_s739_common.py's; the keys are s740c4's two holds, read from its committed receipt.

Pinned here beside them:
  * each row is at the reconcile's run, and the committed reread receipt posted that run for it;
  * 32078: the page's own words (college-page-read run 45835049303): 'Total Units 31-32' closes the major before the
    'Approved Program Electives (as needed to reach 60 units)' list, and the degree's table counts those electives at 2
    beside the major; without the list the record adds to 31-32, and the degree's 2 elective units stay on the record;
  * 08859: the page's own words: 'Required 15', 'Approved Major Electives 9', 'Total Units 36'; the list entry holds
    those figures, the record rule names total_differs, and a record reading another sum takes nothing.

Run from repo root: python3 tests/program_piles_s740_sjcc2_test.py
"""
import copy
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402

import _program_piles_s739 as B  # noqa: E402
import _program_piles_s740_sjcc2 as M  # noqa: E402

W = M.W
S, NG = B.S, B.NG
ROWS = {"32078": "required_list_outside_total", "08859": "total_differs"}
SCORES = {"required_list_outside_total": 70, "total_differs": 50}
t = T.run(W, rows=ROWS, held={}, scores=SCORES, day="2026-11-26", boundaries=6)
check = t.check

with open(os.path.join(B.ROOT, M.REREAD), encoding="utf-8") as fh:
    reread = json.load(fh)
posted = {str(k) for k in (reread.get("replaced_keys") or []) + (reread.get("carried_keys") or [])}
for cn in ROWS:
    f = W.load(cn)
    check(str(f["extracted_run"]) == M.RECONCILE == str(reread["extracted_run"]) and cn in posted,
          "%s is at the reconcile's run, and the committed reread receipt posted it" % cn)

# ── the pages' own words (college-page-read run 45835049303; a tab between a row's cells) ────────────────────
CLINICAL = """Required Courses:\t24
Complete one of the following BUS courses:\t3
Complete one of the following courses:\t4-5
BIOL 020\tHuman Biology\t4
BIOL 071\tHuman Anatomy\t5
MA 004\tStructure and Function of the Human Body\t4
Total Units\t31-32
Approved Program Electives (as needed to reach 60 units)
Course List
ADS 071\tPharmacology/Physiology of Addiction\t3
CA 005\tComputer Literacy\t2
AS Degree Requirements
Major Requirements\t31-32
General Education Requirements\t27
Approved Program Electives\t2
Total Units\t60
"""
check(CLINICAL.index("Total Units\t31-32") < CLINICAL.index(M.ELECTIVES)
      and "Major Requirements\t31-32\nGeneral Education Requirements\t27\nApproved Program Electives\t2\nTotal Units\t60"
      in CLINICAL and 24 + 3 + 4 == 31 and 24 + 3 + 5 == 32,
      "32078: the page closes the major at 31-32 before the electives list, and counts the electives at 2 for the degree")
f = W.load("32078")
e = M.REVIEWED["32078"]
dropped = B.apply_ops(f, e["ops"])
check(B.closes(f, dropped, major=True) and [b["name"] for b in dropped["blocks"]] == [
    "Required Courses:", "Complete one of the following BUS courses:", "Complete one of the following courses:"],
      "32078: without the electives list the record adds to the printed 31-32")
check(f["record"]["program"]["degree_elective_units"] == {"min": 2, "max": 2}
      and len(B.blocks(f, M.ELECTIVES)) == 1 and B.blocks(f, M.ELECTIVES)[0]["minimum"] == 2,
      "32078: the record holds the 2 units twice, as the degree's electives and as the list's minimum")
check(not B.closes(f, copy.deepcopy(f["record"]), major=True), "32078: as read the record does not add to its total")

CERT = """Required\t15
CNSTR 101A\tTools, Materials, and Safety\t2
CNSTR 101B\tResidential Construction Framing\t3
CNSTR 102A\tResidential Plumbing Systems\t3
CNSTR 102B\tResidential/Commercial Wiring\t3
CNSTR 110\tBuilding Information Modeling (BIM) 101\t3
CNSTR 117\tOSHA Construction Safety Standards\t1
Approved Major Electives\t9
Complete 3 non-duplicated units from the following approved major electives:
CNSTR 103\tRoof Framing Systems\t3
Total Units \t36
"""
required = CERT.split("Approved Major Electives")[0]
units = [float(x) for x in re.findall(r"^CNSTR \d+[A-Z]?\t[^\t]+\t(\d+)$", required, re.M)]
check(sum(units) == 15.0 and "Required\t15" in CERT and "Approved Major Electives\t9" in CERT
      and "Total Units \t36" in CERT, "08859: the page prints Required 15 (its courses add to 15), electives 9 and Total Units 36")
entry = NG.total_differs_list().get((M.COLLEGE, "08859")) or {}
check(entry.get("printed_total") == [36, 36] and entry.get("printed_sum") == [24, 24] and entry.get("run") == "45835049303"
      and entry.get("words") == "Total Units 36", "08859 is listed with the page's two figures and its run")
f = W.load("08859")
bare = dict(f, score={k: v for k, v in f["score"].items() if k not in ("gaps", "confidence")})
check(NG.answer(bare) == ("total_differs", NG.total_differs(bare)) and "45835049303" in NG.total_differs(bare),
      "08859: the record rule names total_differs, with its run")
off = copy.deepcopy(bare)
off["score"]["arithmetic"]["computed"] = [27.0, 27.0]
check(NG.total_differs(off) is None, "a record that reads another sum takes no total_differs")
sys.exit(t.done())
