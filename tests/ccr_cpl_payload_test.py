#!/usr/bin/env python3
"""SkyView's CPL payload (prototype/ccr_cpl.json, kb/_build_ccr_cpl.py) — the
contracts the map's CPL face and articulations light stand on.

  · The join reaches EXACTLY the points that carry `ar`: the light and the
    face are counted from the same crosswalk, so they can never disagree.
  · Every identity in the payload is on the map.
  · The coverage line's two numbers come from ONE universe: the numerator is
    a subset of the denominator.
  · No student-grain figure enters the payload (structural counts only).
  · The training agency is carried only where it differs from the issuer.
  · The committed file is a fresh build (stale is a failure, like the
    dependency map).

Pure stdlib, no network. Run from repo root:
    python3 tests/ccr_cpl_payload_test.py
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _build_ccr_cpl as B  # noqa: E402

FAILS = []


def check(name, cond, why=""):
    print(("PASS  " if cond else "FAIL  ") + name + (("  — " + str(why)) if (not cond and why) else ""))
    if not cond:
        FAILS.append(name)


def main():
    payload, report = B.build()
    c = payload["counts"]
    uni = json.load(open(os.path.join(ROOT, "prototype", "ccr_universe.json"), encoding="utf-8"))
    pts = {p["i"]: p for I in uni["islands"] for p in I["p"]}
    with_ar = {i for i, p in pts.items() if p.get("ar")}

    check("the join reaches exactly the points that carry `ar`",
          set(payload["by"]) == with_ar, f"{len(set(payload['by']) ^ with_ar)} differ")
    check("the counts say the same", c["identities_reached"] == c["identities_with_ar"] == len(with_ar),
          f"{c['identities_reached']} / {c['identities_with_ar']} / {len(with_ar)}")
    check("every identity in the payload is on the map", all(i in pts for i in payload["by"]))
    check("the number of records per identity equals its `ar`",
          all(sum(len(rows) for _, rows in payload["by"][i]) == pts[i]["ar"] for i in payload["by"]))

    check("the coverage line's numerator is inside its denominator",
          0 < c["exhibits_on_map"] <= c["exhibits_articulated"], f"{c['exhibits_on_map']} of {c['exhibits_articulated']}")
    check("the denominator is the articulated feed unioned with the crosswalk, never the credit funnel",
          c["exhibits_articulated"] >= c["exhibits_in_feed"] and c["exhibits_articulated"] != c["funnel"]["exhibits"])
    check("a crosswalk exhibit missing from today's feed is flagged, never dropped",
          c["exhibits_on_map_not_in_feed"] == len(report["stale"]) ==
          len({r[0] for rows in payload["by"].values() for _, ex in rows for r in ex if len(r) > 5 and r[5]}))

    text = json.dumps(payload).lower()
    check("no student-grain figure enters the payload",
          not any(k in text for k in ("distinct_students", "student_key", "students_served", "sum_applied", "sum_transcribed")))
    check("the funnel block is structural and dated",
          set(c["funnel"]) >= {"rows", "exhibits", "colleges"} and c.get("funnel_read_at"))

    creds = payload["creds"]
    check("every credential has a name", all(x[0] for x in creds))
    check("the training agency is carried only where it differs from the issuer",
          all((x[2] is None) or (x[2] != x[1]) for x in creds))
    check("the credential count matches", c["credentials"] == len(creds))

    # ── the committed file is current ─────────────────────────────────────────
    try:
        committed = json.load(open(B.OUT, encoding="utf-8"))
        current = B.strip_volatile(committed) == B.strip_volatile(payload)
    except (OSError, ValueError) as e:
        committed, current = None, False
        print("   " + str(e))
    check("prototype/ccr_cpl.json is a fresh build (run python3 kb/_build_ccr_cpl.py and commit it)", current)

    print(f"\n{len(FAILS)} failure(s)" if FAILS else "\nall payload checks passed")
    return 1 if FAILS else 0


if __name__ == "__main__":
    sys.exit(main())
