#!/usr/bin/env python3
"""Guard the anchor re-key dry run's era read (S611): it never runs the whole chain over the anchor.

    python3 tests/anchor_rekey_dryrun_test.py

The first draft resolved the curated anchor's keys through every map in ALIAS_MAPS. The anchor's GRAF M10IB is an id
the 2026-09-03 Z-band retirement re-used, and the 2026-06-12 fold had moved an earlier GRAF M10IB elsewhere, so the
draft sent it to CRIM M11SD. The fix reads the anchor's era from its keys and applies only the maps after it. These
checks fail on that draft: the fixture's key is an input to an early map and an output of a later one.
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _anchor_rekey_dryrun as dry  # noqa: E402

failures = []


def check(cond, msg):
    if not cond:
        failures.append(msg)


early = ("early", {"GRAF M10IB": "CRIM M11SD"})            # an earlier era's GRAF M10IB, folded away
reuse = ("reuse", {"M-ID GRA 106": "GRAF M10IB"})          # the anchor's GRAF M10IB is minted here, re-using the id
recode = ("recode", {"GRAF M10XX": "GFCD M10XX"})          # a later map that never names the anchor's key
chain = [early, reuse, recode]

check(dry.baseline_of(["GRAF M10IB"], chain) == "reuse",
      "the baseline is the latest map that PRODUCED the key, never the first that names it")

anchor = {"GRAF M10IB": {"id_system": "M-ID", "discipline": "Graphic Arts", "common_title": "Photoshop Skills"}}
disc = {"Graphic Arts": {"canonical_subj4": "GFCD"}}
rows = dry.plan(anchor, disc, {}, chain)
check(rows and rows[0]["resolved"] == "GFCD M10IB",
      "the anchor key takes the canonical on its own number; the early map's CRIM M11SD is another era; got %r" % (rows and rows[0]))
check(rows and rows[0]["kind"] == "prefix_swap", "an unused id on the canonical is a prefix swap; got %r" % (rows and rows[0]))

# a key that a map after its producer still names means the anchor skipped that map: refuse, never guess
skip = [("made", {"M-ID A 1": "ABCD M1001"}), ("moves", {"ABCD M1001": "WXYZ M1001"}), ("made2", {"M-ID B 2": "EFGH M1002"})]
try:
    dry.baseline_of(["ABCD M1001", "EFGH M1002"], skip)
    check(False, "an anchor key that is an input to a map at or before the baseline must abort the run")
except SystemExit as e:
    check("not in one era" in str(e), "the abort says why: %s" % e)

# a collision is for a person, with the holder named
live = {"GFCD M10IB": {"title": "Elder Law"}}
rows = dry.plan(anchor, disc, live, chain)
check(rows and rows[0]["kind"] == "ambiguous" and "Elder Law" in rows[0]["why"],
      "a live id on the canonical is a collision for a person, naming its holder; got %r" % (rows and rows[0]))

# S612: a later map that re-uses the anchor's id for ANOTHER record, then a recode that moves that record, is a
# collision, never a re-key. AUTD M10FX (Diesel Engines, from the Z-band retirement) shared its id with an HVAC singleton
# the next day's prefix fold put there; the 2026-11-05 recode took the singleton to DIES M10FX. Following it merges them.
shared = [("zband", {"M-ID DSL 100": "AUTD M10FX"}), ("fold", {"HVAC M10FQ": "AUTD M10FX"}),
          ("recode", {"AUTD M10FX": "DIES M10FX"})]
anchor2 = {"AUTD M10FX": {"id_system": "M-ID", "discipline": "Diesel Mechanics", "common_title": "Diesel Engines"}}
disc2 = {"Diesel Mechanics": {"canonical_subj4": "DIES"}}
rows = dry.plan(anchor2, disc2, {"DIES M10FX": {"title": "Heavy Duty Truck HVAC"}}, shared)
check(rows and rows[0]["kind"] == "ambiguous" and "Heavy Duty Truck HVAC" in rows[0]["why"],
      "a pending map that moved another record sharing the id is a collision naming its holder; got %r" % (rows and rows[0]))

if failures:
    print("FAIL — %d problem(s):" % len(failures))
    for f in failures:
        print("  ✗ " + f)
    sys.exit(1)
print("OK — the dry run reads the anchor's era from its keys, applies only later maps, and refuses a mixed era.")
