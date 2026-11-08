#!/usr/bin/env python3
"""Guard the seed re-check dry run's sort (S612): TOP corroborates a seed discipline, never decides one.

    python3 tests/ccr_seed_recheck_dryrun_test.py

Failure modes, each a check below: a card a person already decided must leave the run (a curated card re-offered is a
done decision asked again); a card with a source already is not a seed card; a tie is no agreement (TOP alone may not
break it); a catch-all TOP code casts no vote (it is not in the map).
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _ccr_seed_recheck_dryrun as dry  # noqa: E402

failures = []


def check(cond, msg):
    if not cond:
        failures.append(msg)


topmap = {"0835.00": "Kinesiology", "0837.00": "Health"}
courses = {
    "KINE M1001": {"discipline": "Kinesiology", "common_title": "Yoga"},
    "KINE M1002": {"discipline": "Kinesiology", "common_title": "Stress Management"},
    "KINE M1003": {"discipline": "Kinesiology", "common_title": "Sports Psychology"},
    "KINE M1004": {"discipline": "Kinesiology", "common_title": "Orientation"},
    "KINE M1005": {"discipline": "Kinesiology", "common_title": "Weight Training", "reviewed_at": "2026-06-01"},
    "KINE M1006": {"discipline": "Kinesiology", "common_title": "Swim", "discipline_source": "top_code"},
    "KINE M1007": {"discipline": "Kinesiology", "common_title": "Golf"},
}
m = lambda t, c="A": {"college": c, "top_code": t + ": x"}  # noqa: E731
mem = {
    "KINE M1001": [m("0835.00"), m("0835.00", "B")],
    "KINE M1002": [m("0837.00"), m("0837.00", "B"), m("0835.00", "C")],
    "KINE M1003": [m("0835.00"), m("0837.00", "B")],
    "KINE M1004": [m("4930.10")],
    "KINE M1005": [m("0837.00")],
    "KINE M1006": [m("0837.00")],
    "KINE M1007": [m("0835.00")],
}
cur = {"KINE M1007": {"merge_into": "KINE M1001"}}
out = dry.classify(courses, mem, topmap, cur)["Kinesiology"]
ids = {k: [r["id"] for r in v] for k, v in out.items()}
check(ids.get("top_agrees") == ["KINE M1001"], "a plurality naming the seed's discipline agrees; got %r" % ids)
check("KINE M1002" in ids.get("top_differs", []), "a plurality naming another discipline differs; got %r" % ids)
check("KINE M1003" in ids.get("top_differs", []), "a tie is no agreement: TOP may not break it; got %r" % ids)
check(ids.get("no_top") == ["KINE M1004"], "a catch-all TOP code casts no vote; got %r" % ids)
everyone = sum(ids.values(), [])
check("KINE M1005" not in everyone and "KINE M1007" not in everyone,
      "a reviewed or curated card leaves the run; got %r" % ids)
check("KINE M1006" not in everyone, "a card with a discipline_source is not a seed card; got %r" % ids)

if failures:
    print("FAIL — %d problem(s):" % len(failures))
    for f in failures:
        print("  ✗ " + f)
    sys.exit(1)
print("OK — the seed re-check sorts by TOP agreement, leaves curated cards out, and never lets TOP break a tie.")
