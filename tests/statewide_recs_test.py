#!/usr/bin/env python3
"""Test the Fact Sheet statewide credit-rec builder (fact-sheet/_build_statewide_recs.py).

Guards the producer→builder contract:
  - only CCC-Collaborative exhibits with authoritative_recs yield recs;
  - recs dedup by normalized title, units split out, C-ID carried/backfilled;
  - a statewide exhibit with NO authoritative_recs lands in the no_ccc list
    (caveat (a): show recs only where a true CCC exhibit exists).

Run: python3 tests/statewide_recs_test.py
"""
import importlib.util
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
BUILDER = os.path.join(os.path.dirname(HERE), "fact-sheet", "_build_statewide_recs.py")
spec = importlib.util.spec_from_file_location("swrecs", BUILDER)
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

results = []
def check(name, cond): results.append((name, bool(cond)))

# split_units / norm_title
check("split_units pulls units + title", m.split_units("3.0 hours in Criminal Law") == ("3.0", "Criminal Law"))
check("split_units handles no-units", m.split_units("Criminal Law") == ("", "Criminal Law"))
check("norm_title expands intro/admin", m.norm_title("Intro to Admin of Justice") == m.norm_title("Introduction to Administration of Justice"))

# Synthetic statewide_data.js shape (post-producer-change: authoritative_recs present).
sw = {"exhibits": [
    {  # POST-like: CCC, authoritative recs from the one CCC exhibit (dup phrasings + a C-ID backfill)
        "unified_title": "POST Basic Academy", "collaborative_type": "CCC Collaborative",
        "credit_recs": [{"course": "X 1", "credit": "noise"}],  # EACR field — must be IGNORED
        "authoritative_recs": [
            {"credit": "3 hours in Criminal Law", "cid": "AJ 122"},
            {"credit": "3.0 hours in Criminal Law", "cid": ""},          # dup title → collapses, no new cid
            {"credit": "3 hours in Intro to Administration of Justice", "cid": ""},
            {"credit": "3 hours in Introduction to Administration of Justice", "cid": "AJ 110"},  # same course, backfills cid
            {"credit": "3 hours in Physical Training (CSU GE Area E)", "cid": ""},  # no C-ID (GE) — still shown
        ],
    },
    {  # EMT-like: CCC exhibit but NO authoritative recs → no_ccc
        "unified_title": "EMT Certification", "collaborative_type": "CCC Collaborative",
        "credit_recs": [{"course": "EMT 1", "credit": "10 hours in EMT"}],
        "authoritative_recs": [],
    },
    {  # Local exhibit — never considered
        "unified_title": "Local Thing", "collaborative_type": "Local",
        "authoritative_recs": [{"credit": "3 hours in Whatever", "cid": "Z 1"}],
    },
]}
out, no_ccc = m.build(sw)

check("only CCC-with-recs exhibits emitted", set(out.keys()) == {"POST Basic Academy"})
post = out.get("POST Basic Academy", [])
titles = [r["t"] for r in post]
check("POST dedups the two 'Criminal Law' phrasings", titles.count("Criminal Law") == 1)
check("POST dedups the two 'Intro/Introduction to Administration of Justice'",
      sum(1 for t in titles if "dministration of Justice" in t) == 1)
check("POST keeps the no-C-ID GE rec (show all CRs)", any("Physical Training" in t for t in titles))
cl = next((r for r in post if r["t"] == "Criminal Law"), None)
check("Criminal Law carries units", cl and cl["u"] in ("3", "3.0"))
check("Criminal Law carries its C-ID", cl and cl["cid"] == "AJ 122")
aj = next((r for r in post if "dministration of Justice" in r["t"]), None)
check("C-ID backfills onto the deduped AJ rec", aj and aj["cid"] == "AJ 110")
check("EMT (no authoritative recs) is flagged no_ccc", "EMT Certification" in no_ccc)
check("Local exhibit never appears", "Local Thing" not in out and "Local Thing" not in no_ccc)

failed = 0
for n, ok in results:
    print(("PASS " if ok else "FAIL ") + n)
    if not ok: failed += 1
print(f"\n{len(results)-failed}/{len(results)} passed")
sys.exit(1 if failed else 0)
