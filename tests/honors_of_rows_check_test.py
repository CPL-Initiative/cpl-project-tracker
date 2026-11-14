#!/usr/bin/env python3
"""The Honors rows plan's apply-day check (kb/_honors_of_s653_dryrun.py --check) refuses a stale plan.

WHY. #3315's review: the first --check tested only that each planned id was still live, so a pair the daily
re-cluster dissolved still got its row (a reader moved ANTH M1005's members into ANTH M1006 and --check passed), and
nothing tested that the checkout carried the day's payload. The check now re-measures the pairs and classes on the
checkout's payload and refuses unless the step-2 rows' digest is the reviewed plan's, and refuses a checkout that does
not contain origin/main's head.

The cases:
  1. A dissolved pair (ANTH M1005's courses moved into ANTH M1006): refused, naming the pair gone.
  2. An overlay that still carries the two rows #3304 deleted: refused, saying the checkout predates the delete's sync.
  3. A checkout with no reachable origin: the freshness test refuses rather than passing.
  4. The plan as drawn, on the committed payload with the live overlay: passes, or, once the daily payload has moved,
     refuses with "redraw the plan" (reported, not failed: the payload is rebuilt every day).
Run: python3 tests/honors_of_rows_check_test.py
"""
import json
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _honors_of_s653_dryrun as d  # noqa: E402

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


doc = json.load(open(os.path.join(ROOT, "kb", "honors_of_s653_out", "2026-11-14", "plan.json"), encoding="utf-8"))
committed = json.load(open(os.path.join(ROOT, "kb", "coci_curation.json"), encoding="utf-8"))
deleted_present = all((committed["curations"].get(r["course_id"]) or {}).get(r["field"]) == r["value"]
                      for r in d.S652_DELETED)
live = d.overlay_live(json.loads(json.dumps(committed))) if deleted_present else committed


def run(**kw):
    try:
        d.check_plan(doc, root=ROOT, fresh=False, **kw)
        return None
    except SystemExit as e:
        return str(e)


with tempfile.TemporaryDirectory() as td:
    ov = os.path.join(td, "overlay.json")
    with open(ov, "w", encoding="utf-8") as f:
        json.dump(live, f)

    # 1. A dissolved pair.
    Orig = d.Shim

    class Drift(Orig):
        def __init__(self, members_dir):
            super().__init__(members_dir)
            self.members.setdefault("ANTH M1006", []).extend(self.members.pop("ANTH M1005", []))
    d.Shim = Drift
    try:
        msg = run(overlay=ov)
    finally:
        d.Shim = Orig
    check("a pair the re-cluster dissolved is refused, and named", msg and "('ANTH M1005', 'ANTH M1006')" in msg
          and "redraw the plan" in msg, msg)

    # 2. The overlay before #3304's delete synced.
    if deleted_present:
        msg = run()
        check("an overlay from before the #3304 delete's sync is refused", msg and "predates the delete" in msg, msg)
    else:
        print("note: the committed overlay no longer carries the deleted rows; case 2 reads a rebuilt copy")
        pre = json.loads(json.dumps(committed))
        for r in d.S652_DELETED:
            pre["curations"].setdefault(r["course_id"], {})[r["field"]] = r["value"]
        ov2 = os.path.join(td, "pre.json")
        with open(ov2, "w", encoding="utf-8") as f:
            json.dump(pre, f)
        msg = run(overlay=ov2)
        check("an overlay from before the #3304 delete's sync is refused", msg and "predates the delete" in msg, msg)

    # 3. Freshness without a reachable origin.
    probs = d.freshness_problems(td)
    check("a checkout with no reachable origin fails the freshness test", probs, probs)

    # 4. The plan as drawn.
    msg = run(overlay=ov)
    if msg is None:
        check("the plan as drawn passes the re-measure on the committed payload", True)
    else:
        check("the plan as drawn either passes or asks for a redraw once the payload moved", "redraw the plan" in msg,
              msg)
        print("note: the daily payload has moved since the plan was drawn; the apply needs a redraw: " + msg[:200])

failed = [n for n, ok, _ in results if not ok]
for n, ok, why in results:
    print(("PASS " if ok else "FAIL ") + n + ("" if ok else "\n     " + str(why)[:300]))
print(f"{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
