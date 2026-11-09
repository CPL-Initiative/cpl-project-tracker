#!/usr/bin/env python3
"""The seed cards both second signals confirm (kb/_ccr_seed_confirm_apply.py; Sam, Open Asks Sheet 174 card 1). Guards:
  (1) every card the receipt names carries description_and_top, its discipline unchanged, and its before-values had
      no source (the seed only, never a curated or inferred card);
  (2) the auditor scores the source inferred-high, so the cards leave seed_untouched_discipline;
  (3) --undo restores the before-values exactly (Rule 10 a2), on a copy;
  (4) --apply refuses a count other than the one confirmed.
Pure stdlib; run from the repo root: python3 tests/ccr_seed_confirm_test.py
"""
import glob
import json
import os
import shutil
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _ccr_seed_confirm_apply as A  # noqa: E402
import _row_audit as RA  # noqa: E402

results = []


def check(name, cond):
    results.append((name, bool(cond)))


courses = json.load(open(A.COURSES, encoding="utf-8"))["courses"]
receipts = sorted(glob.glob(os.path.join(ROOT, "kb", "ccr_seed_confirm_out", "*", "*.json")))
check("(1) a receipt exists", receipts)
for path in receipts:
    rec = json.load(open(path, encoding="utf-8"))
    ids = list(rec["before"])
    check("(1) %s: the receipt's count is its cards" % os.path.basename(path), rec["count"] == len(ids))
    check("(1) %s: every card carries the source and keeps its discipline" % os.path.basename(path),
          all(courses[i].get("discipline_source") == A.SOURCE and courses[i].get("discipline") == rec["discipline"]
              and courses[i].get(A.STAMP, {}).get("ruling") == rec["ruling"] for i in ids))
    check("(1) %s: no card had a source before" % os.path.basename(path),
          all(not b.get("discipline_source") for b in rec["before"].values()))
check("(1) no card carries the source without a receipt",
      sum(1 for r in courses.values() if isinstance(r, dict) and r.get("discipline_source") == A.SOURCE)
      == sum(json.load(open(p, encoding="utf-8"))["count"] for p in receipts))

state = RA._classify_mid_discipline({"discipline": "Kinesiology", "discipline_source": A.SOURCE})
check("(2) the auditor scores description_and_top inferred-high", state["state"] == "inferred-high")
check("(2) a seed with no source is still seed-untouched",
      RA._classify_mid_discipline({"discipline": "Kinesiology"})["state"] == "seed-untouched")

d = tempfile.mkdtemp()
old = A.COURSES
try:
    cid = "KINE M9999"
    A.COURSES = os.path.join(d, "c.json")
    A.write(A.COURSES, {"courses": {cid: {"discipline": "Kinesiology", "discipline_source": A.SOURCE,
                                           "discipline_confidence": A.CONF, A.STAMP: {"run": "t"}},
                                     "KINE M9998": {"discipline": "Kinesiology", "discipline_source": "subject_map"}}})
    rpath = os.path.join(d, "r.json")
    A.write(rpath, {"source": A.SOURCE, "before": {cid: {}, "KINE M9998": {}}})
    A.undo(rpath)
    back = A.read(A.COURSES)["courses"]
    check("(3) undo removes the stamp and restores the before-values", back[cid] == {"discipline": "Kinesiology"})
    check("(3) undo leaves a card another source owns", back["KINE M9998"]["discipline_source"] == "subject_map")
finally:
    A.COURSES = old
    shutil.rmtree(d)

orig = A.confirmed
A.confirmed = lambda disc: [{"id": "X"}] * 3
try:
    check("(4) --apply refuses a count other than --expect", A.apply("Kinesiology", 627, "r", "t") == 2)
    check("(4) --apply refuses with no --expect", A.apply("Kinesiology", None, "r", "t") == 2)
finally:
    A.confirmed = orig

failed = [n for n, ok in results if not ok]
for n, ok in results:
    print(("  ✓ " if ok else "  ✗ ") + n)
print("ccr_seed_confirm_test.py: %d/%d checks passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
