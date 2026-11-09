#!/usr/bin/env python3
"""The Courses List's Discipline in doubt job (kb/_ccr_seed_recheck_dryrun.py --doubt; Sam, 2026-11-09). Guards:
  (1) a card enters when its description points elsewhere (the for_a_curator verdict) or TOP alone does;
  (2) a card the description and TOP confirm, or that stays unsettled with TOP silent, does not;
  (3) the description's cards come first, most colleges first; the counts say which signal put each there;
  (4) the file names its discipline, and the procedures store names the active discipline it reads.
Pure stdlib; run from the repo root: python3 tests/ccr_doubt_test.py
"""
import json
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _ccr_seed_recheck_dryrun as R  # noqa: E402

results = []


def check(name, cond):
    results.append((name, bool(cond)))


def card(i, kind_desc, colleges, votes=None):
    return {"id": "KINE M%04d" % i, "title": "T%d" % i, "colleges": colleges, "members": colleges,
            "desc": [["Biological Sciences", 0.2], ["Kinesiology", 0.1]], "desc_kind": kind_desc, "votes": votes or {}}


rows = {
    "top_agrees": [card(1, "desc_agrees_clear", 9), card(2, "desc_differs_clear", 4, {"Kinesiology": 2})],
    "top_differs": [card(3, "desc_agrees_clear", 7, {"Health": 3}), card(4, "desc_differs_close", 2, {"Health": 1})],
    "no_top": [card(5, "desc_differs_clear", 3), card(6, "desc_agrees_thin", 8), card(7, "desc_differs_clear", 5)],
}
cards = R.doubt_cards("Kinesiology", rows)
ids = [c["id"] for c in cards]
check("(1) the description's cards and TOP's alone enter", set(ids) == {"KINE M0003", "KINE M0004", "KINE M0005", "KINE M0007"})
check("(2) confirmed, TOP-agreed and silent unsettled cards stay out", not {"KINE M0001", "KINE M0002", "KINE M0006"} & set(ids))
check("(3) the description's cards first, most colleges first", ids == ["KINE M0007", "KINE M0005", "KINE M0004", "KINE M0003"])
by = {c["id"]: c for c in cards}
check("(3) a card both signals doubt names both", by["KINE M0004"]["why"] == ["description", "top"])
check("(3) a card TOP alone doubts says so", by["KINE M0003"]["why"] == ["top"])

old = R.HERE
with tempfile.TemporaryDirectory() as d:
    R.HERE = d
    try:
        doc = R.write_doubt("Kinesiology", rows)
        disk = json.load(open(os.path.join(d, "ccr_doubt.json"), encoding="utf-8"))
    finally:
        R.HERE = old
check("(3) the counts split the description's cards from TOP's alone", doc["counts"] == {"description": 3, "top_only": 1} and disk["counts"] == doc["counts"])
check("(4) the file names its discipline", disk["discipline"] == "Kinesiology" and disk["schema"] == 1)
store = json.load(open(os.path.join(ROOT, "kb", "ccr_procedures.json"), encoding="utf-8"))
check("(4) the procedures store names the active discipline", bool(store.get("active_discipline")))
live = json.load(open(os.path.join(ROOT, "kb", "ccr_doubt.json"), encoding="utf-8"))
check("(4) the committed job file is the active discipline's", live.get("discipline") == store.get("active_discipline"))

failed = [n for n, ok in results if not ok]
for n, ok in results:
    print(("  ✓ " if ok else "  ✗ ") + n)
print("ccr_doubt_test.py: %d/%d checks passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
