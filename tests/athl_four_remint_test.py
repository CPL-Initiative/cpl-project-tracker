#!/usr/bin/env python3
"""Checks for kb/_athl_four_remint.py, card 9 of open-asks sheet 4 (Sam, 2026-09-29:
"Move them to ATHL"). One per failure the re-mint must never produce: a pinned id
that drifted since the ruling moved anyway (merged away, stamped from another
ETHS id, retitled), a fifth id swept in, the kept number taken over an occupied
slot, the record losing its ETHS origin stamp when it gains this one, a second
apply, and, on the committed receipt once applied, a stored id that does not
reach the ATHL course through the one chain (kb/alias_chain.py).

Run from repo root: python3 tests/athl_four_remint_test.py
"""
import copy
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _athl_four_remint as a4  # noqa: E402
import _eths_remint as er  # noqa: E402
import alias_chain as ac  # noqa: E402

results = []


def check(name, cond):
    results.append((name, bool(cond)))
    print(("PASS  " if cond else "FAIL  ") + name)


def rec_(cid, title, eths):
    return {"course_id": cid, "common_title": title, "subject_4letter": cid.split(" ")[0],
            "discipline": "Kinesiology", "top_code": "0835.00", er.STAMP: eths}


def fixture():
    singletons = {
        "KINE M12OI": rec_("KINE M12OI", "Adv Techniques & Strategies of Baseball", "ETHS M10BI"),
        "KINE M12OJ": rec_("KINE M12OJ", "Adv Techniques & Strategies of Football", "ETHS M10BK"),
        "KINE M12OK": rec_("KINE M12OK", "Adv Techniques & Strategies-Water Polo", "ETHS M10BN"),
        "KINE M12OL": rec_("KINE M12OL", "Adv Techniques & Strategies of Softball", "ETHS M10BO"),
        # Occupied: the kept number is not free for any of the four.
        "ATHL M12OI": rec_("ATHL M12OI", "Conditioning for Women's Soccer", None),
        "ATHL M12OJ": rec_("ATHL M12OJ", "Conditioning for Women's Softball", None),
        "ATHL M12OK": rec_("ATHL M12OK", "Sport Techniques & Conditioning", None),
        "ATHL M12OL": rec_("ATHL M12OL", "Skills and Conditioning for Team Sports", None),
        # A fifth family title on KINE that the ruling does not name.
        "KINE M12OM": rec_("KINE M12OM", "Adv Techniques & Strategies of Golf", "ETHS M10ZZ"),
    }
    return {}, singletons, {}


def plan_on(courses, singletons, curations):
    return a4.compute_plan(courses, singletons, curations, {})


# ── the four move, and only the four ──
c, s, cur = fixture()
p = plan_on(c, s, cur)
check("the four pinned ids move and pass every gate",
      sorted(p["moves"]) == sorted(a4.PINNED) and all(v.get("pass") for v in p["validation"].values()))
check("a fifth family title the ruling does not name stays on KINE", "KINE M12OM" not in p["moves"])
check("every new id is on ATHL and none takes an occupied slot",
      all(n.startswith("ATHL ") for n in p["alias"].values())
      and not set(p["alias"].values()) & set(s))
check("the discipline stays Kinesiology (the umbrella's two codes)",
      all(v["discipline"] == "Kinesiology" for v in p["moves"].values()))

# ── a pinned id that drifted since the ruling refuses ──
for label, mutate in (
        ("merged away", lambda c, s, cur: cur.update({"KINE M12OK": {"merge_into": "KINE M1001"}})),
        ("stamped from another ETHS id", lambda c, s, cur: s["KINE M12OJ"].update({er.STAMP: "ETHS M10XX"})),
        ("retitled", lambda c, s, cur: s["KINE M12OL"].update({"common_title": "Beginning Softball Skills"})),
        ("missing from the catalog", lambda c, s, cur: s.pop("KINE M12OI"))):
    c2, s2, cur2 = copy.deepcopy(fixture())
    mutate(c2, s2, cur2)
    check("V0 refuses a pinned id " + label, not plan_on(c2, s2, cur2)["validation"]["V0_pinned_four"]["pass"])

# ── the apply stamps this move and keeps the ETHS origin ──
c, s, cur = fixture()
docs = {"courses": {"courses": c}, "singletons": {"courses": s}, "memberships": {"memberships": {}},
        "articulations": {"articulations": [], "identities": {}}, "curation": {"curations": cur}}
p = plan_on(c, s, cur)
saved, er.STAMP = er.STAMP, a4.STAMP
try:
    docs2, counts = er.apply_plan(copy.deepcopy(docs), p)
finally:
    er.STAMP = saved
moved = {nk: docs2["singletons"]["courses"][nk] for nk in p["alias"].values()}
check("apply: each moved record carries _athl_remint_from = the KINE id it left",
      all(moved[p["alias"][k]].get(a4.STAMP) == k for k in p["alias"]))
check("apply: and keeps _eths_remint_from, where it began",
      all(moved[p["alias"][k]].get(er.STAMP) == a4.PINNED[k][0] for k in p["alias"]))
check("apply: the module's own stamp is restored after the apply", er.STAMP == "_eths_remint_from")
check("apply: nothing is left on a KINE id", not set(p["alias"]) & set(docs2["singletons"]["courses"]))
p2 = plan_on({}, docs2["singletons"]["courses"], {})
check("P0: a second run refuses (the stamps say it moved)",
      not p2["validation"]["P0_not_applied"]["pass"] and not p2["moves"])

# ── the committed receipt, once applied and registered ──
receipts = [q for q in ac.ALIAS_MAPS if q.startswith("kb/athl_remint_out/")]
if not receipts:
    check("committed: no card 9 receipt registered yet (the dry run is all that exists)", True)
else:
    rp = receipts[-1]
    with open(os.path.join(ROOT, rp), encoding="utf-8") as f:
        receipt = json.load(f)
    alias = {k: ac.step(v) for k, v in receipt["aliases"].items()}
    check("committed: the registered receipt is applied, and moves the four pinned ids",
          bool(receipt.get("_applied_at")) and sorted(alias) == sorted(a4.PINNED))
    maps = ac.load_maps(ac.ALIAS_MAPS)
    chain = list(ac.ALIAS_MAPS)
    k = chain.index(rp)
    k43 = next(i for i, q in enumerate(chain) if q.startswith("kb/eths_remint_out/2026-09-29/"))
    ok_eths, ok_kine = [], []
    for old, new in alias.items():
        eths = a4.PINNED[old][0]
        # A reference stored between the 43's apply and this one names the KINE id.
        ok_kine.append(ac.resolve_id(old, maps[k43 + 1:k + 1]) == new)
        # A reference stored before the 43's apply names the ETHS id.
        ok_eths.append(ac.resolve_id(eths, maps[k43:k + 1]) == new)
    check("committed: a stored KINE id reaches its ATHL course through the chain", all(ok_kine))
    check("committed: a stored ETHS id reaches it too, through both re-mints", all(ok_eths))
    with open(os.path.join(ROOT, "kb", "coci_minted_singletons.json"), encoding="utf-8") as f:
        live = json.load(f)["courses"]
    check("committed: every new id is in the catalog with both stamps",
          all(live.get(n, {}).get(a4.STAMP) == o and live.get(n, {}).get(er.STAMP) == a4.PINNED[o][0]
              for o, n in alias.items()))

passed = sum(1 for _, ok in results if ok)
print(f"\n{passed}/{len(results)} checks passed")
sys.exit(0 if passed == len(results) else 1)
