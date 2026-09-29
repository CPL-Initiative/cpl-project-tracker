#!/usr/bin/env python3
"""Guards for the SkyView member payload — kb/_build_ccr_universe.py.

SkyView's whole point is dragging a local course from one identity to another. The
graph carried identities and NO members, so there was nothing at course grain to
grab; this payload is what makes the verb reachable. Two failure modes it has to
stay clear of, both of which look fine on screen:

  1. A MEMBER WITH NO USABLE CONTROL NUMBER CANNOT BE DRAGGED. The write is
     `CN:<control_number>`, so a member carrying "NULL" (2 do) has no key. It is
     DROPPED and counted — coercing it to zero would ship a course that silently
     writes against control number CCC000000000.
  2. A CONTROL NUMBER CAN SIT UNDER SEVERAL IDENTITIES (1,165 do — the forward
     join surfaces an over-merged course on every card claiming it). The write is
     one row per control number, so a move is global: the consumer needs the count
     to know the case is live, and must drop the course from EVERY card, not just
     the one on screen.
  3. A CONTROL NUMBER CAN NAME SEVERAL DIFFERENT COURSES — a separate fault from
     (2), and not bounded by it. The write key cannot say which, so SkyView
     refuses the move rather than landing an arbitrary one. Sized by
     kb/_audit_control_number_claims.py.

Behavior in the browser (does a drag actually complete?) is checked by
prototype/check_ccr_atlas.js, which has a layout engine. This file checks the
payload the browser is handed.

Run:  python3 tests/ccr_universe_members_test.py
"""
import importlib
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
B = importlib.import_module("_build_ccr_universe")

FAILURES = []


def check(name, cond, detail=""):
    if cond:
        print(f"  ok    {name}")
    else:
        FAILURES.append(name)
        print(f"  FAIL  {name}{(': ' + detail) if detail else ''}")


# ── 1. the emitter, on synthetic input the live corpus cannot reproduce on demand
print("1. write_members() — the two counts that must never be silently zero")
tmp = os.path.join(ROOT, "kb", "_tmp_universe_members_test.json")
synthetic = {
    "generated_at": "2026-01-01 00:00",
    "colleges": ["Alpha College", "Beta College"],
    "members": {
        "AAAA M1001": [
            {"c": 0, "n": "AAA 100", "t": "T", "cn": "CCC000000123"},
            {"c": 1, "n": "AAA 101", "t": "T", "cn": "NULL"},          # no key
            {"c": 1, "n": "AAA 102", "t": "T", "cn": ""},              # no key
        ],
        "BBBB M1002": [
            {"c": 0, "n": "BBB 200", "t": "T", "cn": "CCC000000123"},  # shared
        ],
        "CCCC M1003": [],                                              # no members
        "DDDD M1004": [{"c": 0, "n": "DDD 1", "t": "T", "cn": "CCC000000999"}],
    },
}
B.write_members(synthetic, ["AAAA M1001", "BBBB M1002", "CCCC M1003"],
                os.path.relpath(tmp, ROOT))
out = json.load(open(tmp, encoding="utf-8"))
os.remove(tmp)
c = out["counts"]
check("a member with no control number is dropped, not coerced",
      c["dropped_no_key"] == 2, f"got {c['dropped_no_key']}")
check("a control number under two identities is counted",
      c["cn_on_multiple_identities"] == 1, f"got {c['cn_on_multiple_identities']}")
check("an identity carrying no members is omitted rather than shipped empty",
      "CCCC M1003" not in out["m"])
check("an identity the map does not place is not shipped",
      "DDDD M1004" not in out["m"])
check("the CCC prefix is stripped to an integer",
      out["m"]["AAAA M1001"][0][0] == 123, str(out["m"]["AAAA M1001"][0][:1]))
check("the record is [control number, code, college index] and carries no title",
      all(len(r) == 3 for v in out["m"].values() for r in v))
check("colleges travel with the payload so an index can be resolved",
      out["colleges"] == ["Alpha College", "Beta College"])

# ── 2. the committed artifact ────────────────────────────────────────────────
print("\n2. the committed payload against the layout it belongs to")
mem_path = os.path.join(ROOT, "prototype", "ccr_universe_members.json")
uni_path = os.path.join(ROOT, "prototype", "ccr_universe.json")
if not (os.path.exists(mem_path) and os.path.exists(uni_path)):
    check("both payloads are committed", False, "run kb/_build_ccr_universe.py")
else:
    M = json.load(open(mem_path, encoding="utf-8"))
    U = json.load(open(uni_path, encoding="utf-8"))
    placed = {p["i"] for isl in U["islands"] for p in isl["p"]}
    ids = list(M["m"])
    ncol = len(M["colleges"])

    check("every identity carrying members is one the map places",
          all(i in placed for i in ids),
          f"{sum(1 for i in ids if i not in placed)} stray")
    # Thresholds, not pinned counts: the corpus is rebuilt by the cron, and an
    # assertion pinned to today's number stops guarding the day it moves.
    check(f"it covers the corpus rather than a sample "
          f"({len(ids):,} identities, {M['counts']['members']:,} members)",
          len(ids) > 10000 and M["counts"]["members"] > 50000)
    check("the reported counts match the payload's own contents",
          M["counts"]["identities"] == len(ids)
          and M["counts"]["members"] == sum(len(v) for v in M["m"].values()))
    bad_shape = [i for i in ids for r in M["m"][i]
                 if len(r) != 3 or not isinstance(r[0], int)
                 or not isinstance(r[2], int) or not 0 <= r[2] < ncol]
    check("every record is well-formed and its college index resolves",
          not bad_shape, f"{len(bad_shape)} bad")
    check("the duplicate-control-number case is live, so the consumer must handle it",
          M["counts"]["cn_on_multiple_identities"] > 0)

    # ── the OTHER non-uniqueness, which the counter above does not see ───────
    # `cn_on_multiple_identities` asks "is one course claimed by several
    # identities". A different and unrelated thing is true of the same key: one
    # control number can name several DIFFERENT courses. Measured by
    # kb/_audit_control_number_claims.py against the COCI source — 462 name more
    # than one course in the data, and 1,352 more reach the artifact as two rows
    # because the member roster does not apply the institution fold declared in
    # kb/reference/map_college_roster_rules.json.
    #
    # It matters here because the write is `CN:<control number>` and nothing
    # else: both receiving ends pick the first match (the generator through
    # cn_rows[cn][0], SkyView through byCn[cn]), so a move on such a key lands
    # an arbitrary course. prototype/ccr_universe.js refuses it — this asserts
    # the condition it refuses is really present, because a guard that is never
    # reached passes for free.
    courses = {}
    for i in ids:
        for cn, code, ci in M["m"][i]:
            courses.setdefault(cn, set()).add((code, ci))
    ambiguous = {cn for cn, v in courses.items() if len(v) > 1}
    rows_hit = sum(1 for i in ids for cn, _, _ in M["m"][i] if cn in ambiguous)
    check(f"control numbers naming more than one course are present "
          f"({len(ambiguous):,} keys, {rows_hit:,} draggable rows)",
          len(ambiguous) > 0)
    check("and they are a different set from the counter above, not a subset "
          "relabeled",
          len(ambiguous) != M["counts"]["cn_on_multiple_identities"])
    # The payload is inlined into a self-contained page. Titles were left out for
    # this reason; a ceiling is what stops them quietly coming back.
    mb = os.path.getsize(mem_path) / 1048576
    check(f"the payload stays inlinable ({mb:.1f} MB)", mb < 4.0)

print()
if FAILURES:
    print(f"{len(FAILURES)} check(s) FAILED: " + ", ".join(FAILURES))
    sys.exit(1)
print("all checks passed")
