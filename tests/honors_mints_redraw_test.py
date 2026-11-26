#!/usr/bin/env python3
"""The Honors step-4 redraw (S737): once step 2 is applied, --plan refuses (it would rewrite the applied migration),
and --redraw's comparison against the applied plan names every pair that left, arrived or changed action, with where
the alias chain sends a pair that left. Fixture plans only: no payload read, nothing written. Pure-stdlib python."""
import json
import os
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _honors_of_s653_dryrun as d  # noqa: E402

FAILS = []


def check(name, ok, got=None):
    print(("ok   " if ok else "FAIL ") + name + ("" if ok else f"  (got {got!r})"))
    if not ok:
        FAILS.append(name)


def pair(h, b, action, holds=()):
    return {"honors_id": h, "base_id": b, "action": action, "holds": list(holds)}


def main():
    # 1. --plan refuses while step 2's receipt stands, before it measures anything.
    check("(1) step 2's receipt is committed", os.path.exists(d.STEP2_RECEIPT), d.STEP2_RECEIPT)
    r = subprocess.run([sys.executable, os.path.join(ROOT, "kb", "_honors_of_s653_dryrun.py"), "--plan"],
                       capture_output=True, text=True, cwd=ROOT, timeout=120)
    check("(1b) --plan refuses once step 2 is applied", r.returncode != 0 and "--redraw" in (r.stderr + r.stdout),
          (r.returncode, r.stderr[-200:]))

    # 2. The applied plan is the one step 2 ran: its rows digest is the receipt's.
    applied = d.jload(os.path.join(ROOT, "kb", "honors_of_s653_out", d.STEP2_PLAN, "plan.json"))
    rec = d.jload(d.STEP2_RECEIPT)
    check("(2) STEP2_PLAN's rows md5 is the digest the receipt's run inserted", applied["rows_md5"] in rec["response"],
          applied["rows_md5"])

    # 3. The comparison, on fixture plans.
    old = {"pairs": [pair("AAAA M10AS", "AAAA M10AF", "row and mint"), pair("BBBB M1001H", "BBBB M1001", "held"),
                     pair("CCCC M10AB", "CCCC M1002", "row and mint")], "summary": {"mints": 2}, "alias_era": "x"}
    new = {"pairs": [pair("BBBB M1001H", "BBBB M1001", "row and mint"), pair("CCCC M10AB", "CCCC M1002",
                                                                            "row and mint"),
                     pair("DDDD M10AC", "DDDD M1003", "none")], "summary": {"mints": 2}, "alias_era": "y"}
    with tempfile.TemporaryDirectory() as td:
        os.makedirs(os.path.join(td, "honors_of_s653_out", d.STEP2_PLAN))
        with open(os.path.join(td, "honors_of_s653_out", d.STEP2_PLAN, "plan.json"), "w") as f:
            json.dump(old, f)
        here = d.HERE
        d.HERE = td
        try:
            got = d.against_applied(new)
        finally:
            d.HERE = here
    check("(3a) a pair that left is named, with where the chain sends it",
          [(g["honors_id"], g["was"]) for g in got["left"]] == [("AAAA M10AS", "row and mint")]
          and set(got["left"][0]["now"]) == {"honors_id", "base_id"}, got["left"])
    check("(3b) a pair that arrived is named", [a["honors_id"] for a in got["arrived"]] == ["DDDD M10AC"], got)
    check("(3c) a changed action is named with both actions",
          [(m["honors_id"], m["was"], m["now"]) for m in got["changed_action"]]
          == [("BBBB M1001H", "held", "row and mint")], got["changed_action"])
    check("(3d) the counts agree", got["counts"] == {"left": 1, "arrived": 1, "changed_action": 1, "mints": [2, 2]},
          got["counts"])

    # 4. The committed redraw (when present) never sits in step 2's folder.
    base = os.path.join(ROOT, "kb", "honors_of_s653_out")
    newest = sorted(n for n in os.listdir(base) if os.path.exists(os.path.join(base, n, "plan.json")))[-1]
    check("(4) step 2's newest plan folder is still the applied plan", newest == d.STEP2_PLAN, newest)

    print(f"\n{'FAILED ' + str(len(FAILS)) if FAILS else 'all passed'}")
    return 1 if FAILS else 0


if __name__ == "__main__":
    sys.exit(main())
