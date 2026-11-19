#!/usr/bin/env python3
"""After a paid re-read, the filed record stays wherever the re-read is worse (S683, d-reread-keep-the-better-s683).

WHY. step=reread replaces each live row with the records one extraction run filed. The reader's page checks hand
some programs a new window, and a paid read from it can come back worse than the record on file, or read another
program's page (p-capture-can-lose-passing-page-s671). kb/_program_reread_keep_better.py compares each record of the
new run with the same file at the base ref and puts the filed file back, byte for byte, where the re-read is worse,
so the reread leaves that row alone. This test guards the failure mode: a filed record replaced by a worse re-read.

  * each step of the order has a case where the filed record wins that step and the re-read wins every later one,
    so any reordering of the steps (or of the arithmetic statuses) fails a check;
  * invented counts (passes_live, right after score.pass); unstated arithmetic ranks by its own pass;
  * a re-read whose heading names another program, or another award, or no heading, is set aside: the filed record
    is restored, and with no filed record the new one goes to held_for_person/ and out of the reread;
  * a checked live row restores the filed record; the checked list comes from by_college[<the college>] only, and
    a missing or malformed list stops the run;
  * the account names the dispatch with the run pinned (force=<run>), "no dispatch" when every record is restored,
    and carries an earlier run's kept records until a reread receipt posts them;
  * a restored file is byte for byte the base's; a record of an earlier run is never touched;
  * COBIx on #3544 (S684): a checked live row whose program the base files no record for is held (moved to
    held_for_person/, named by no dispatch), the check read before anything else; a supplied live_runs whose run
    differs from the filed record's (or names any run where the base files none) holds the row for a person with
    both runs in its why and main's file restored, while an absent live_runs, or one equal to main's runs, leaves
    every outcome as before and the account says "not supplied".

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
COLLEGE = "Fixture College"
TITLE, AWARD, OWN = "Business Administration", "A.S. Degree", "Business Administration, A.S."


def check(cond, msg):
    if not cond:
        FAILS.append(msg)
        print("FAIL:", msg)


def score(passed=False, cov_pass=False, placed=5, listed=10, arith="incomplete", invented=True, arith_pass=None,
          none_placed=None, share=None):
    a = {"status": arith}
    if arith_pass is not None:
        a["pass"] = arith_pass
    return {"pass": passed,
            "coverage": {"placed": placed, "listed": listed,
                         "share": share if share is not None else round(placed / listed, 3),
                         "none_placed": none_placed if none_placed is not None else placed == 0, "pass": cov_pass},
            "invented": {"pass": invented}, "arithmetic": a}


PASS = score(True, True, 10, 10, "equal")
BEST_BELOW = dict(cov_pass=True, placed=10, listed=10, arith="equal")   # wins every step after the one tested


def rec(cn, sc, run, heading=OWN, url="https://x.edu/cat.pdf#page=1"):
    return {"college": COLLEGE, "control_number": cn, "title": TITLE, "award": AWARD, "source_url": url,
            "extracted_run": run, "score": sc,
            "record": {"program": {"section_heading": heading} if heading is not None else {}, "blocks": []}}


# control number: (filed score or None for no filed record, re-read score, expected outcome, re-read heading)
STEP_CASES = {
    # 1. score.pass: the filed record passes it and loses every later step.
    "10001": (score(True, False, 0, 10, "incomplete", invented=False), score(False, **BEST_BELOW), "restored", OWN),
    # 2. passes_live: the filed record passes live; the re-read invents (S683 finding 2) and wins none_placed and share.
    "10002": (score(False, True, 0, 10, "equal", share=0.0, none_placed=True),
              score(False, True, 10, 10, "equal", invented=False), "restored", OWN),
    # 3. coverage.pass: the filed record holds it and loses none_placed, share and arithmetic.
    "10003": (score(False, True, 0, 10, "incomplete", invented=False), score(False, False, 9, 10, "equal"),
              "restored", OWN),
    # 4. none_placed false: the filed record places some; the re-read wins share and arithmetic.
    "10004": (score(False, False, 1, 10, "incomplete"), score(False, False, 0, 10, "equal", share=0.9, none_placed=True),
              "restored", OWN),
    # 5. share: the filed record covers more and loses arithmetic.
    "10005": (score(False, False, 7, 10, "incomplete"), score(False, False, 4, 10, "equal"), "restored", OWN),
    # 6. the arithmetic, each status against the next.
    "10006": (score(False, False, 5, 10, "equal"), score(False, False, 5, 10, "unstated", arith_pass=True),
              "restored", OWN),
    "10007": (score(False, False, 5, 10, "unstated", arith_pass=True), score(False, False, 5, 10, "unequal"),
              "restored", OWN),
    "10008": (score(False, False, 5, 10, "unequal"), score(False, False, 5, 10, "unstated", arith_pass=False),
              "restored", OWN),
    "10009": (score(False, False, 5, 10, "unstated", arith_pass=False), score(False, False, 5, 10, "incomplete"),
              "restored", OWN),
    "10010": (score(False, False, 5, 10, "incomplete"), score(False, False, 5, 10, None), "restored", OWN),
}
OTHER_CASES = {
    "10011": (score(False, False, 0, 10), PASS, "kept", OWN),                       # failing filed, passing re-read
    "10012": (score(False, False, 6, 10, "unequal"), score(False, False, 6, 10, "unequal"), "kept", OWN),  # a tie
    "10013": (None, score(False, False, 0, 10), "new", OWN),                        # no filed record
    "10014": (score(False, False, 2, 10), None, "restored", OWN),                   # the re-read has no score
    "10015": (PASS, PASS, "restored", OWN),                                         # checked live
    "10016": (score(False, False, 8, 10, "unequal"), PASS, "restored", "Accounting, A.S."),   # another program's page
    "10017": (score(False, False, 8, 10, "unequal"), PASS, "restored",                        # another award's section
              "Business Administration Certificate of Achievement"),
    "10018": (score(False, False, 8, 10, "unequal"), PASS, "restored", None),                 # no heading
    "10019": (None, PASS, "held", "Accounting, A.S."),                              # new, another program's page
    "10020": (score(False, False, 4, 10, "equal"), score(False, False, 7, 10, "incomplete"), "kept", OWN),  # share
    "10021": (score(False, False, 5, 10, "unequal"), score(False, False, 5, 10, "equal"), "kept", OWN),     # arith
}
CASES = dict(STEP_CASES, **OTHER_CASES)
OLD, NEW, LATER = 111, 222, 333


def git(cwd, *args):
    subprocess.run(["git", *args], cwd=cwd, check=True, capture_output=True)


def write(path, obj, indent=2):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as fh:
        json.dump(obj, fh, indent=indent)


def new_repo(tmp):
    git(tmp, "init", "-q")
    git(tmp, "config", "user.email", "t@example.com")
    git(tmp, "config", "user.name", "t")
    git(tmp, "checkout", "-q", "-b", "claude/fixture-wave")


def read_bytes(path):
    with open(path, "rb") as fh:
        return fh.read()


def checked_file(tmp, by_college):
    path = os.path.join(tmp, "checked.json")
    write(path, {"read_at": "x", "total_checked": 1, "by_college": by_college, "note": "x"})
    return path


def test_checked_list(tmp):
    path = checked_file(tmp, {"West Los Angeles College": ["17111", "37050"], COLLEGE: ["10015"]})
    check(K.read_checked(path, COLLEGE) == {"10015"}, "the checked set is not by_college[college]")
    check(K.read_checked(path, "Mendocino College") == set(), "a college absent from by_college has checked rows")
    for bad in ({"by_college": {COLLEGE: "10015"}}, {"by_college": {COLLEGE: [{"x": 1}]}}, ["10015"], {"x": 1}):
        p = os.path.join(tmp, "bad.json")
        write(p, bad)
        try:
            K.read_checked(p, COLLEGE)
            check(False, "a malformed checked file was read: %r" % (bad,))
        except SystemExit:
            pass
    for args in ((None, COLLEGE), (path, None)):
        try:
            K.read_checked(*args)
            check(False, "read_checked ran with %r" % (args,))
        except SystemExit:
            pass


def test_folder(tmp):
    new_repo(tmp)
    folder = os.path.join(tmp, "kb", "program_requirements_college", "fixture")
    rdir = os.path.join(folder, "records")
    for cn, (filed, _, _, _) in CASES.items():
        if filed is not None:
            # indent 1 on the base, indent 2 on the re-read: a restore that re-serialized would not match bytes
            write(os.path.join(rdir, cn + ".json"), rec(cn, filed, OLD), indent=1)
    write(os.path.join(rdir, "10099.json"), rec("10099", score(False, False, 0, 10), OLD), indent=1)
    write(os.path.join(folder, "capture.json"), {"run": str(OLD)})
    git(tmp, "add", "-A")
    git(tmp, "commit", "-qm", "base")
    git(tmp, "tag", "base")
    for cn, (_, new, _, heading) in CASES.items():
        write(os.path.join(rdir, cn + ".json"), rec(cn, new, NEW, heading=heading, url="https://x.edu/cat.pdf#page=2"))
    write(os.path.join(folder, "capture.json"), {"run": str(NEW)})
    untouched = read_bytes(os.path.join(rdir, "10099.json"))
    try:
        K.keep_better(folder, base="base", checked=None, out=lambda *_: None)
        check(False, "keep_better ran with no checked list")
    except SystemExit:
        pass
    lines = []
    acct = K.keep_better(folder, base="base", checked={"10015"}, out=lines.append)
    got = {r["control_number"]: r for r in acct["runs"][str(NEW)]["programs"]}
    for cn, (_, _, want, _) in CASES.items():
        check(got.get(cn, {}).get("outcome") == want,
              "%s: %s, expected %s (%s)" % (cn, got.get(cn, {}).get("outcome"), want, got.get(cn, {}).get("why")))
    check("10099" not in got, "a record of an earlier run is listed")
    check(read_bytes(os.path.join(rdir, "10099.json")) == untouched, "a record of an earlier run changed")
    for cn, (_, _, want, _) in CASES.items():
        path = os.path.join(rdir, cn + ".json")
        base = subprocess.run(["git", "show", "base:kb/program_requirements_college/fixture/records/%s.json" % cn],
                              cwd=tmp, capture_output=True).stdout
        if want == "restored":
            check(read_bytes(path) == base, "%s: the restored file is not the base's byte for byte" % cn)
        elif want == "held":
            check(not os.path.exists(path), "%s: a record held for a person is still in records/" % cn)
            check(os.path.isfile(os.path.join(folder, K.HELD_DIR, cn + ".json")), "%s: not in held_for_person/" % cn)
        else:
            check(json.loads(read_bytes(path))["extracted_run"] == NEW, "%s: the re-read was not kept" % cn)
    c = acct["counts"]
    want = {"reread": 21, "kept": 4, "restored": 15, "new": 1, "held_for_person": 1, "restored_not_own_program": 3}
    check(all(c[k] == v for k, v in want.items()), "counts %s" % c)
    check(c["restored_filed_pass"] == 2, "restored filed passes %s" % c["restored_filed_pass"])   # 10002 and 10015
    check(c["plain_reread_would_lose_pass"] == 1, "plain reread losses %s" % c["plain_reread_would_lose_pass"])
    d = acct["dispatch"]
    check(isinstance(d, list) and len(d) == 1 and d[0]["inputs"] == {"college": COLLEGE, "step": "reread",
                                                                     "force": str(NEW)} and d[0]["posts"] == 5
          and d[0]["ref"] == "claude/fixture-wave", "dispatch %r" % (d,))
    check(len(lines) == 23, "one line a program, a total and the dispatch: %d lines" % len(lines))
    # A second pass over the same run keeps every decision, the held one included.
    again = K.keep_better(folder, base="base", checked={"10015"}, out=lambda *_: None)
    check(again["counts"]["restored"] == 15 and again["counts"]["reread"] == 21
          and again["counts"]["held_for_person"] == 1, "a second pass %s" % again["counts"])
    # A second extraction on the branch: 10011 is kept from run NEW as filed, 10020 is read again at LATER.
    for cn in ("10012", "10013", "10021"):
        os.remove(os.path.join(rdir, cn + ".json"))   # the later filing names only what it read or kept
    write(os.path.join(rdir, "10020.json"), rec("10020", PASS, LATER))
    write(os.path.join(folder, "capture.json"), {"run": str(LATER)})
    later = K.keep_better(folder, base="base", checked={"10015"}, out=lambda *_: None)
    runs = sorted(x["inputs"]["force"] for x in later["dispatch"])
    check(runs == [str(NEW), str(LATER)], "a second extraction dropped the first run's kept records: %r" % runs)
    check(later["carried_runs"].get(str(NEW)) == ["10011"], "carried %r" % later["carried_runs"])
    # A reread receipt that posted run NEW retires its dispatch.
    write(os.path.join(tmp, "kb", "receipts", "program_requirement_records_college_reread_fixture_999.json"),
          {"college": COLLEGE, "extracted_run": str(NEW), "error": None})
    posted = K.keep_better(folder, base="base", checked={"10015"}, out=lambda *_: None)
    check([x["inputs"]["force"] for x in posted["dispatch"]] == [str(LATER)], "posted %r" % posted["dispatch"])


def test_all_restored(tmp):
    """Every record of the new run restored: no dispatch, so reread never falls back to main's run."""
    new_repo(tmp)
    folder = os.path.join(tmp, "kb", "program_requirements_college", "fixture")
    rdir = os.path.join(folder, "records")
    write(os.path.join(rdir, "20001.json"), rec("20001", PASS, OLD))
    git(tmp, "add", "-A")
    git(tmp, "commit", "-qm", "base")
    write(os.path.join(rdir, "20001.json"), rec("20001", score(False, False, 3, 10), NEW))
    write(os.path.join(folder, "capture.json"), {"run": str(NEW)})
    lines = []
    acct = K.keep_better(folder, base="HEAD", checked=set(), out=lines.append)
    check(isinstance(acct["dispatch"], str) and acct["dispatch"].startswith("no dispatch"), "dispatch %r" % acct["dispatch"])
    check(lines[-1] == "no dispatch", "the last line is %r" % lines[-1])


def fixture_folder(tmp, filed: dict, reread: dict):
    """A repo whose base files `filed` (cn: score) at run OLD and whose branch re-reads `reread` at run NEW."""
    new_repo(tmp)
    folder = os.path.join(tmp, "kb", "program_requirements_college", "fixture")
    rdir = os.path.join(folder, "records")
    for cn, sc in filed.items():
        write(os.path.join(rdir, cn + ".json"), rec(cn, sc, OLD), indent=1)
    write(os.path.join(folder, "capture.json"), {"run": str(OLD)})
    git(tmp, "add", "-A")
    git(tmp, "commit", "-qm", "base")
    git(tmp, "tag", "base")
    for cn, sc in reread.items():
        write(os.path.join(rdir, cn + ".json"), rec(cn, sc, NEW, url="https://x.edu/cat.pdf#page=2"))
    write(os.path.join(folder, "capture.json"), {"run": str(NEW)})
    return folder, rdir


def dispatched(acct) -> set:
    d = acct["dispatch"]
    return set() if isinstance(d, str) else {cn for x in d for cn in x["control_numbers"]}


def test_checked_unfiled(tmp):
    """COBIx finding 1 on #3544: a checked live row whose program main files no record is held, never posted."""
    folder, rdir = fixture_folder(tmp, {}, {"40001": PASS, "40002": PASS})
    acct = K.keep_better(folder, base="base", checked={"40001"}, out=lambda *_: None)
    got = {r["control_number"]: r for r in acct["runs"][str(NEW)]["programs"]}
    check(got.get("40001", {}).get("outcome") == "held",
          "a checked row with no filed record came out %r" % got.get("40001", {}).get("outcome"))
    check("checked" in (got.get("40001", {}).get("why") or ""), "the held row's why does not name the check")
    check(not os.path.exists(os.path.join(rdir, "40001.json")), "the checked re-read is still in records/")
    check(os.path.isfile(os.path.join(folder, K.HELD_DIR, "40001.json")), "the checked re-read is not held")
    check("40001" not in dispatched(acct), "a dispatch names the checked row: %r" % (acct["dispatch"],))
    check(got.get("40002", {}).get("outcome") == "new" and dispatched(acct) == {"40002"},
          "the unchecked new record: %r, dispatch %r" % (got.get("40002"), acct["dispatch"]))
    again = K.keep_better(folder, base="base", checked={"40001"}, out=lambda *_: None)
    check(again["counts"]["held_for_person"] == 1 and "40001" not in dispatched(again), "a second pass %s" % again["counts"])


def test_live_runs(tmp):
    """COBIx finding 2 on #3544: a live row from a run main does not hold is held for a person."""
    worse = score(False, False, 1, 10, "incomplete")
    folder, rdir = fixture_folder(tmp, {"30001": worse, "30002": worse, "30005": PASS},
                                  {"30001": PASS, "30002": PASS, "30003": PASS, "30004": PASS, "30005": worse})
    # Absent live_runs: today's outcomes, and the account says so.
    plain = K.keep_better(folder, base="base", checked=set(), dry_run=True, out=lambda *_: None)
    want = {"30001": "kept", "30002": "kept", "30003": "new", "30004": "new", "30005": "restored"}
    got = {r["control_number"]: r["outcome"] for r in plain["runs"][str(NEW)]["programs"]}
    check(got == want, "without live_runs the outcomes moved: %r" % got)
    check(plain.get("live_runs") == "not supplied", "the account's live_runs reads %r" % plain.get("live_runs"))
    # A supplied map equal to main's runs changes nothing.
    same = K.keep_better(folder, base="base", checked=set(), dry_run=True, out=lambda *_: None,
                         live_runs={"30001": str(OLD), "30002": OLD, "30005": str(OLD)})
    got = {r["control_number"]: r["outcome"] for r in same["runs"][str(NEW)]["programs"]}
    check(got == want, "live runs equal to main's moved the outcomes: %r" % got)
    base2 = read_bytes_base(tmp, "30002")
    lr = {"30001": str(OLD), "30002": "999", "30003": "999", "30005": "999"}
    acct = K.keep_better(folder, base="base", checked=set(), live_runs=lr, out=lambda *_: None)
    got = {r["control_number"]: r for r in acct["runs"][str(NEW)]["programs"]}
    want = {"30001": "kept", "30002": "held", "30003": "held", "30004": "new", "30005": "held"}
    check({k: v["outcome"] for k, v in got.items()} == want,
          "with live_runs: %r" % {k: v["outcome"] for k, v in got.items()})
    for cn in ("30002", "30005"):
        why = got.get(cn, {}).get("why") or ""
        check("999" in why and str(OLD) in why, "%s: the why does not name both runs: %r" % (cn, why))
    check("999" in (got.get("30003", {}).get("why") or ""), "30003: the why does not name the live run")
    check(read_bytes(os.path.join(rdir, "30002.json")) == base2, "30002: records/ does not hold main's file")
    check(json.loads(read_bytes(os.path.join(folder, K.HELD_DIR, "30002.json")))["extracted_run"] == NEW,
          "30002: the re-read is not in held_for_person/")
    check(not os.path.exists(os.path.join(rdir, "30003.json")), "30003: still in records/")
    check(dispatched(acct) == {"30001", "30004"}, "dispatch %r" % (acct["dispatch"],))
    check(acct.get("live_runs") == {k: str(v) for k, v in lr.items()}, "the account's live_runs %r" % acct.get("live_runs"))


def read_bytes_base(tmp, cn):
    return subprocess.run(["git", "show", "base:kb/program_requirements_college/fixture/records/%s.json" % cn],
                          cwd=tmp, capture_output=True).stdout


def test_live_runs_file(tmp):
    """The conductor's file: live_runs beside by_college, optional; malformed stops the run."""
    path = os.path.join(tmp, "c.json")
    write(path, {"by_college": {COLLEGE: []}, "live_runs": {COLLEGE: {"10001": "38990001", "10002": 38990002},
                                                            "Other College": {"1": "2"}}})
    check(K.read_live_runs(path, COLLEGE) == {"10001": "38990001", "10002": "38990002"}, "live_runs not read")
    check(K.read_live_runs(path, "Mendocino College") == {}, "a college absent from live_runs has live rows")
    write(path, {"by_college": {}})
    check(K.read_live_runs(path, COLLEGE) is None, "an absent live_runs is not None")
    for bad in ({"by_college": {}, "live_runs": []}, {"by_college": {}, "live_runs": {COLLEGE: ["10001"]}},
                {"by_college": {}, "live_runs": {COLLEGE: {"10001": "x"}}},
                {"by_college": {}, "live_runs": {COLLEGE: {"abc": "1"}}}):
        write(path, bad)
        try:
            K.read_live_runs(path, COLLEGE)
            check(False, "a malformed live_runs was read: %r" % (bad,))
        except SystemExit:
            pass


def main():
    for fn in (test_checked_list, test_folder, test_all_restored, test_checked_unfiled, test_live_runs,
               test_live_runs_file):
        tmp = tempfile.mkdtemp(prefix="keep_better_")
        try:
            fn(tmp)
        finally:
            shutil.rmtree(tmp, ignore_errors=True)
    check(K.compare(PASS, PASS)[0] == "reread", "a tie keeps the re-read")
    check(K.compare(None, score())[0] == "reread", "no filed score loses")
    print("%s: %d failure(s)" % ("FAIL" if FAILS else "ok", len(FAILS)))
    return 1 if FAILS else 0


if __name__ == "__main__":
    sys.exit(main())
