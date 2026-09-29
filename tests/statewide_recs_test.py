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

# Units never split an identity (Sam, 2026-09-27): one recommendation the
# statewide rows publish at two figures shows the range it joins. Before
# 2026-09-29 the first figure seen won, and the Fact Sheet and Sierra both
# told a reader "6 units" for an EMT line published at 6 and 7.
check("unit_span: differing figures print low–high", m.unit_span(["7", "6"]) == "6\u20137")
check("unit_span: one figure prints as first published", m.unit_span(["3", "3.0"]) == "3")
check("unit_span: a bare decimal gains its zero", m.unit_span([".5", "1"]) == "0.5\u20131")
check("unit_span: none published prints nothing", m.unit_span([]) == "")
span_sw = {"exhibits": [{
    "unified_title": "EMT Certification", "collaborative_type": "CCC Collaborative",
    "authoritative_recs": [
        {"credit": "6 hours in Emergency Medical Technician National Registry", "cid": ""},
        {"credit": "7 hours in Emergency Medical Technician National Registry", "cid": ""},
        {"credit": "Emergency Medical Technician National Registry", "cid": ""},  # no units: no effect
    ],
}]}
emt = m.build(span_sw)[0].get("EMT Certification", [])
check("a line published at 6 and 7 is one line reading 6–7", len(emt) == 1 and emt[0]["u"] == "6\u20137")

def _load(name, rel):
    sp = importlib.util.spec_from_file_location(name, os.path.join(os.path.dirname(HERE), rel))
    mod = importlib.util.module_from_spec(sp)
    sp.loader.exec_module(mod)
    return mod

# Sierra's statewide lines are built from this builder, so the span reaches her too.
cr = _load("credrecs", os.path.join("kb", "_build_credential_recs.py"))
sierra = cr.statewide_sets(span_sw).get("EMT Certification", [])
check("Sierra's statewide line speaks the span",
      len(sierra) == 1 and sierra[0]["credit"] == "6\u20137 hours in Emergency Medical Technician National Registry"
      and sierra[0]["units"] == "6\u20137")
# The domain crosswalk reads `u` as a number; a span must read low and high, never unknown.
dc = _load("domaincw", os.path.join("kb", "_build_domain_cpl_crosswalk.py"))
pl = dc.parse_line({"t": "All Risk Command Operations for Company Officers", "u": "2\u20133"})
check("the domain crosswalk reads a span as low and high", (pl["lo"], pl["hi"], pl["src"]) == (2.0, 3.0, "u-range"))

failed = 0
for n, ok in results:
    print(("PASS " if ok else "FAIL ") + n)
    if not ok: failed += 1
print(f"\n{len(results)-failed}/{len(results)} passed")
sys.exit(1 if failed else 0)
