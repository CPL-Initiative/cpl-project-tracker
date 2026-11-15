#!/usr/bin/env python3
"""The Honors rows plan's apply-day check (kb/_honors_of_s653_dryrun.py --check) refuses a stale plan, and on a pass
writes the receipt the migration runner requires.

WHY. #3315's first two reviews: the first --check tested only that each planned id was still live, so a pair the daily
re-cluster dissolved still got its row, and nothing tested that the checkout carried the day's payload. The third
review (finding 8): --date defaulted to today, so the bare command failed from the day after the plan; and the rows
digest covered pairs only, so a mint or fold class could go stale unseen. COBIx (18:47Z): nothing tied a passing
--check to the apply. The check now reads the newest plan folder, re-measures the pairs and classes on the checkout's
payload, refuses unless both digests are the plan's, and writes check_receipt.json, which scripts/supabase_migrate.py
requires before it runs the rows SQL.

The cases:
  1. A dissolved pair (ANTH M1005's courses moved into ANTH M1006): refused, naming the pair gone.
  2. An overlay that still carries the two rows #3304 deleted: refused, saying the checkout predates the delete's sync.
  3. A checkout with no reachable origin: the freshness test refuses rather than passing.
  4. The plan as drawn, on the committed payload: passes, or, once the daily payload has moved, refuses with "redraw
     the plan" (reported, not failed: the payload is rebuilt every day).
  5. The rows unchanged and one class moved (a mint become a hold): refused, naming the class.
  6. A plan.json whose class digest is not its classes: refused by the SQL half.
  7. The plan folder is the newest dated one holding a plan.json, never today's date.
  8. A pass returns the receipt: the SQL's sha256 and the payload's; the runner accepts the rows SQL beside it and
     refuses it once a payload file differs.
Run: python3 tests/honors_of_rows_check_test.py
"""
import json
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
sys.path.insert(0, os.path.join(ROOT, "scripts"))
import _honors_of_s653_dryrun as d  # noqa: E402
import supabase_migrate as M  # noqa: E402

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


PLAN_DIR = d.plan_dir()
doc = json.load(open(os.path.join(PLAN_DIR, "plan.json"), encoding="utf-8"))
committed = json.load(open(os.path.join(ROOT, "kb", "coci_curation.json"), encoding="utf-8"))
live = d.overlay_live(json.loads(json.dumps(committed)))
# The applied state (#3315's fourth review, finding 7): once step 2 applies, the daily run syncs its rows into the
# overlay. The plan reads an honors_of row that names its anchored base as standing, so the re-measure still gives the
# plan's rows and classes; the test says which state it read.
APPLIED = sum(1 for k, v in committed["curations"].items() if v.get("honors_of") and k not in d.STEP1_IDS)
print(f"note: the committed overlay carries {APPLIED} honors_of rows beyond step 1's two: "
      + ("the applied state" if APPLIED else "step 2 not applied"))


def run(plan=None, **kw):
    try:
        return d.check_plan(plan or doc, root=ROOT, fresh=False, receipt=False, **kw)
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
    check("(1) a pair the re-cluster dissolved is refused, and named", isinstance(msg, str)
          and "('ANTH M1005', 'ANTH M1006')" in msg and "redraw the plan" in msg, msg)

    # 2. The overlay before #3304's delete synced.
    pre = json.loads(json.dumps(committed))
    for r in d.S652_DELETED:
        pre["curations"].setdefault(r["course_id"], {})[r["field"]] = r["value"]
    ov2 = os.path.join(td, "pre.json")
    with open(ov2, "w", encoding="utf-8") as f:
        json.dump(pre, f)
    msg = run(overlay=ov2)
    check("(2) an overlay from before the #3304 delete's sync is refused", isinstance(msg, str)
          and "predates the delete" in msg, msg)

    # 3. Freshness without a reachable origin.
    probs = d.freshness_problems(td)
    check("(3) a checkout with no reachable origin fails the freshness test", probs, probs)

    # 4. The plan as drawn.
    got = run(overlay=ov)
    if isinstance(got, dict):
        check("(4) the plan as drawn passes the re-measure on the committed payload", True)
    else:
        check("(4) the plan as drawn either passes or asks for a redraw once the payload moved", "redraw the plan" in got,
              got)
        print("note: the daily payload has moved since the plan was drawn; the apply needs a redraw: " + got[:200])

    # 5. The rows unchanged, one class moved: the plan says a pair mints that the payload holds.
    moved = json.loads(json.dumps(doc))
    p = next(x for x in moved["pairs"] if x["action"] == "held" and x["honors_system"] == "M-ID")
    p["action"] = "none: a class the payload does not give"
    moved["plan_md5"] = d.plan_md5(moved["pairs"])
    msg = run(plan=moved, overlay=ov)
    check("(5) a class that moved with the rows unchanged is refused, and named", isinstance(msg, str)
          and "not its classes" in msg and p["honors_id"] in msg, msg)

    # 6. The class digest is not the plan's classes.
    bad = json.loads(json.dumps(doc))
    bad["plan_md5"] = "0" * 32
    msg = run(plan=bad, sql_only=True)
    check("(6) a plan.json whose class digest is not its classes is refused", isinstance(msg, str)
          and "plan_md5 is not the digest" in msg, msg)

    # 7. The plan folder.
    base = os.path.join(ROOT, "kb", "honors_of_s653_out")
    dated = sorted(n for n in os.listdir(base) if os.path.exists(os.path.join(base, n, "plan.json")))
    check("(7) --check reads the newest plan folder, never today's date", PLAN_DIR == os.path.join(base, dated[-1])
          and doc["date"] == dated[-1], PLAN_DIR)

    # 8. The receipt, and the runner beside it.
    if isinstance(got, dict):
        sql = open(d.ROWS_SQL, encoding="utf-8").read()
        rel = M.RECEIPT_LINE.search(sql).group(1)
        check("(8a) the receipt names the SQL's sha256, both digests and every payload file",
              got["sql_sha256"] == d.sha256_of(d.ROWS_SQL) and got["rows_md5"] == doc["rows_md5"]
              and got["plan_md5"] == doc["plan_md5"] and sorted(got["payload"]) == sorted(d.PAYLOAD)
              and rel == f"kb/honors_of_s653_out/{doc['date']}/{d.RECEIPT}", rel)
        # The runner reads the receipt where the SQL names it: a copy of the checkout's payload in a scratch root.
        root2 = os.path.join(td, "root")
        os.makedirs(os.path.join(root2, os.path.dirname(rel)))
        for f in d.PAYLOAD:
            os.makedirs(os.path.join(root2, os.path.dirname(f)), exist_ok=True)
            with open(os.path.join(ROOT, f), "rb") as a, open(os.path.join(root2, f), "wb") as b:
                b.write(a.read())
        head = "f" * 40   # a check run with fresh=False reads no origin; the receipt is stamped as the real one is
        got = dict(got, origin_main_head=head)
        with open(os.path.join(root2, rel), "w", encoding="utf-8") as f:
            json.dump(got, f)
        trig = os.path.relpath(d.ROWS_SQL, ROOT)
        why = M.check_receipt(sql, root2, trig, head)
        check("(8b) the runner accepts the rows SQL beside a receipt for this file, this payload and main's head",
              why is None and got["sql"] == trig, why)
        why = M.check_receipt(sql, root2, trig, "e" * 40)
        check("(8c) the runner refuses it once main moves after the check", why and "main is at" in why, why)
        with open(os.path.join(root2, "unified_courses_members.js"), "a", encoding="utf-8") as f:
            f.write("\n")
        why = M.check_receipt(sql, root2, trig, head)
        check("(8d) the runner refuses it once the payload moves (the next daily run)", why and "has moved" in why, why)
    else:
        print("note: case 8 needs the plan to pass on today's payload; skipped")

failed = [n for n, ok, _ in results if not ok]
for n, ok, why in results:
    print(("PASS " if ok else "FAIL ") + n + ("" if ok else "\n     " + str(why)[:300]))
print(f"{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
