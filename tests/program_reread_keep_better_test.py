#!/usr/bin/env python3
"""After a paid re-read, the filed record stays wherever the re-read is worse (S683, d-reread-keep-the-better-s683).

WHY. step=reread replaces each live row with the record the newest extraction run filed. The reader's page checks
hand some programs a new window, and a paid read from it can come back worse than the record on file
(p-capture-can-lose-passing-page-s671). kb/_program_reread_keep_better.py compares each record of the new run with
the same file at the base ref and puts the filed file back, byte for byte, where the re-read is worse, so the reread
leaves that row alone. This test guards the failure mode: a filed pass replaced by a failing re-read.

  * each step of the order decides alone: score.pass, score.coverage.pass, none_placed, share, arithmetic;
  * a filed pass against a failing re-read restores the filed file, byte for byte the base's;
  * a failing filed record against a passing re-read keeps the re-read; a tie keeps the re-read;
  * no filed record keeps the new one; a record of an earlier run is never touched;
  * a checked live row restores the filed record; a second pass over the same run keeps the first's decisions.

Run from repo root: python3 tests/program_reread_keep_better_test.py
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_reread_keep_better as K  # noqa: E402

FAILS = []


def check(cond, msg):
    if not cond:
        FAILS.append(msg)
        print("FAIL:", msg)


def score(passed=False, cov_pass=False, placed=5, listed=10, arith="incomplete", invented=True):
    return {"pass": passed, "coverage": {"placed": placed, "listed": listed,
                                         "share": round(placed / listed, 3) if listed else None,
                                         "none_placed": bool(listed) and placed == 0, "pass": cov_pass},
            "invented": {"pass": invented}, "arithmetic": {"status": arith}}


PASS = score(True, True, 10, 10, "equal")


def rec(cn, sc, run, url="https://x.edu/cat.pdf#page=1"):
    return {"college": "Fixture College", "control_number": cn, "title": "Program " + cn, "award": "A.S.",
            "source_url": url, "extracted_run": run, "score": sc, "record": {"program": {}, "blocks": []}}


# control number: (filed score or None for no filed record, re-read score, expected outcome)
CASES = {
    "10001": (PASS, score(False, False, 3, 10, "unequal"), "restored"),                # filed pass, failing re-read
    "10002": (score(False, False, 0, 10), PASS, "kept"),                              # failing filed, passing re-read
    "10003": (score(False, False, 6, 10, "unequal"), score(False, False, 6, 10, "unequal"), "kept"),   # a tie
    "10004": (None, score(False, False, 0, 10), "new"),                                # no filed record
    "10005": (score(False, True, 10, 10, "incomplete"), score(False, False, 9, 10, "equal"), "restored"),  # cov.pass
    "10006": (score(False, False, 1, 10), score(False, False, 0, 10, "equal"), "restored"),  # none_placed
    "10007": (score(False, False, 4, 10, "equal"), score(False, False, 7, 10, "incomplete"), "kept"),   # share
    "10008": (score(False, False, 7, 10, "equal"), score(False, False, 4, 10, "equal"), "restored"),   # share
    "10009": (score(False, False, 5, 10, "unequal"), score(False, False, 5, 10, "incomplete"), "restored"),  # arith
    "10010": (score(False, False, 5, 10, "unequal"), score(False, False, 5, 10, "equal"), "kept"),     # arith
    "10011": (score(False, False, 2, 10), None, "restored"),                           # the re-read has no score
    "10012": (PASS, PASS, "restored"),                                                 # checked live: restored
}
CHECKED = {"10012"}
OLD, NEW = 111, 222


def git(cwd, *args):
    subprocess.run(["git", *args], cwd=cwd, check=True, capture_output=True)


def write(path, obj, indent=2):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as fh:
        json.dump(obj, fh, indent=indent)


def main():
    tmp = tempfile.mkdtemp(prefix="keep_better_")
    try:
        git(tmp, "init", "-q")
        git(tmp, "config", "user.email", "t@example.com")
        git(tmp, "config", "user.name", "t")
        folder = os.path.join(tmp, "kb", "program_requirements_college", "fixture")
        rdir = os.path.join(folder, "records")
        for cn, (filed, _, _) in CASES.items():
            if filed is not None:
                # indent 1 on the base, indent 2 on the re-read: a restore that re-serialized would not match bytes
                write(os.path.join(rdir, cn + ".json"), rec(cn, filed, OLD), indent=1)
        write(os.path.join(rdir, "10099.json"), rec("10099", score(False, False, 0, 10), OLD), indent=1)
        write(os.path.join(folder, "capture.json"), {"run": str(OLD)})
        git(tmp, "add", "-A")
        git(tmp, "commit", "-qm", "base")
        git(tmp, "tag", "base")
        for cn, (_, new, _) in CASES.items():
            write(os.path.join(rdir, cn + ".json"), rec(cn, new, NEW, url="https://x.edu/cat.pdf#page=2"))
        write(os.path.join(folder, "capture.json"), {"run": str(NEW)})
        untouched = open(os.path.join(rdir, "10099.json"), "rb").read()
        lines = []
        acct = K.keep_better(folder, base="base", checked=CHECKED, out=lines.append)
        got = {r["control_number"]: r for r in acct["programs"]}
        for cn, (_, _, want) in CASES.items():
            check(got.get(cn, {}).get("outcome") == want,
                  "%s: %s, expected %s (%s)" % (cn, got.get(cn, {}).get("outcome"), want, got.get(cn, {}).get("why")))
        check("10099" not in got, "a record of an earlier run is listed")
        check(open(os.path.join(rdir, "10099.json"), "rb").read() == untouched, "a record of an earlier run changed")
        for cn, (_, _, want) in CASES.items():
            now = open(os.path.join(rdir, cn + ".json"), "rb").read()
            base = subprocess.run(["git", "show", "base:kb/program_requirements_college/fixture/records/%s.json" % cn],
                                  cwd=tmp, capture_output=True).stdout
            if want == "restored":
                check(now == base, "%s: the restored file is not the base's byte for byte" % cn)
            else:
                check(json.loads(now)["extracted_run"] == NEW, "%s: the re-read was not kept" % cn)
        c = acct["counts"]
        check(c["restored"] == 7 and c["kept"] == 4 and c["new"] == 1 and c["reread"] == 12, "counts %s" % c)
        check(c["restored_filed_pass"] == 2, "restored filed passes %s" % c["restored_filed_pass"])
        check(c["plain_reread_would_lose_pass"] == 1, "plain reread losses %s" % c["plain_reread_would_lose_pass"])
        check(acct["checked_sql"] is None and acct["checked"] == ["10012"], "checked list")
        check(len(lines) == 13, "one line a program and a total: %d lines" % len(lines))
        check(os.path.isfile(os.path.join(folder, K.ACCOUNT)), "no account written")
        # A second pass over the same run: the restored records now carry the base's run, and stay listed as decided.
        again = K.keep_better(folder, base="base", checked=CHECKED, out=lambda *_: None)
        check(again["counts"]["restored"] == 7 and again["counts"]["reread"] == 12, "a second pass %s" % again["counts"])
        # With no checked list, the account names the SQL that fetches it.
        dry = K.keep_better(folder, base="base", dry_run=True, out=lambda *_: None)
        check("checked = true" in (dry["checked_sql"] or ""), "no checked SQL without a checked list")
        # The order alone, on scores.
        check(K.compare(PASS, PASS)[0] == "reread", "a tie keeps the re-read")
        check(K.compare(None, score())[0] == "reread", "no filed score loses")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    print("%s: %d failure(s)" % ("FAIL" if FAILS else "ok", len(FAILS)))
    return 1 if FAILS else 0


if __name__ == "__main__":
    sys.exit(main())
