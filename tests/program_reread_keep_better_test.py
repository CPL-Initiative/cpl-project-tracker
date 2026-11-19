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
  * S685, a generic heading (REQUIREMENTS, Course List, Major Requirements, Requirements: the scorer's
    heading_content_words reads none as naming a program) is kept and dispatched on the program's own page, shown by
    the address's last segment or the capture's sources.json entry (heading_named, page title); it is set aside with
    no such evidence, on another program's or another award's address, on a directory alone, or on an entry for
    another page; a heading naming another program is set aside even on the program's address; a blank heading
    still fails. Real cases: Ventura 31298, 45831, 35207 (its own page, lost on coverage), 45355 (the C-ID page) and
    Evergreen Valley 06154, 46262 (tests/fixtures/program_reread_keep_better_s685.json);
  * S685 round 1: the address holds exactly the title's words (five committed addresses of a longer title's program
    show nothing; a term suffix is stripped); 2.0 is a word of its own (Moorpark 31614 restored, Citrus 41679 kept
    on its page title); a capture title or h1 naming another award shows nothing, heading_named beside it included
    (Santa Rosa Junior 16986, the AA-T's window for the A.A.);
  * S685, the order (COBIx on #3547): the checked list wins over everything; a re-read that is not its own
    program's is held where the live row already holds this run (a wrong record live, the run in the why), and
    restored where the live run is a third one; a live run equal to this run is already posted: kept on the branch,
    named by no dispatch, a second pass after the post changes no file; a live run other than the filed one is held;
  * COBIx on #3553: an award ending stripped from the address shows nothing unless the reader's slug_awards reads it
    as the program's kind (College of the Redwoods 01821, the A.S. on the certificate's -ca page; an A.A. on an
    -aa-t-degree page), an ending naming the program's kind still passes, an address with no ending reads as on
    main, and the decision row carries the stripped ending as award_tail;
  * with live_runs absent, the every-branch fixture's outcomes, files and dispatch equal main's script at 94a02499
    (tests/fixtures/program_reread_keep_better_main_snapshot.json).

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


def stops(fn, *args, **kw) -> bool:
    try:
        fn(*args, **kw)
    except SystemExit:
        return True
    return False


def test_control_number_shape(tmp):
    """Second reader on #3547, finding 1: a control number keeps its leading zeros, or a guard compares nothing."""
    path = os.path.join(tmp, "c.json")
    for bad in ({"by_college": {COLLEGE: [5839]}}, {"by_college": {COLLEGE: ["5839"]}},
                {"by_college": {COLLEGE: ["058390"]}}):
        write(path, bad)
        check(stops(K.read_checked, path, COLLEGE), "read_checked read %r" % (bad,))
    for bad in ({"by_college": {}, "live_runs": {COLLEGE: {"5839": "999"}}},
                {"by_college": {}, "live_runs": {COLLEGE: {"058390": "999"}}}):
        write(path, bad)
        check(stops(K.read_live_runs, path, COLLEGE), "read_live_runs read %r" % (bad,))
    worse = score(False, False, 1, 10, "incomplete")
    folder, rdir = fixture_folder(tmp, {"05839": worse, "05840": worse}, {"05839": PASS, "05840": PASS})
    write(path, {"by_college": {COLLEGE: ["05839"]}, "live_runs": {COLLEGE: {"05840": "999"}}})
    acct = K.keep_better(folder, base="base", checked=K.read_checked(path, COLLEGE),
                         live_runs=K.read_live_runs(path, COLLEGE), out=lambda *_: None)
    got = {r["control_number"]: r["outcome"] for r in acct["runs"][str(NEW)]["programs"]}
    check(got == {"05839": "restored", "05840": "held"}, "leading-zero control numbers: %r" % got)
    check(not dispatched(acct), "a dispatch names a guarded row: %r" % (acct["dispatch"],))


def test_ascii_runs(tmp):
    """Second reader on #3547, finding 3: a run is ASCII digits; another script's digits stop the run."""
    path = os.path.join(tmp, "c.json")
    write(path, {"by_college": {}, "live_runs": {COLLEGE: {"10001": "٣٨٩"}}})
    check(stops(K.read_live_runs, path, COLLEGE), "read_live_runs read a run in Arabic-Indic digits")
    folder, _ = fixture_folder(tmp, {}, {"60001": PASS})
    check(stops(K.keep_better, folder, base="base", run="٢٢٢", checked=set(), dry_run=True,
                out=lambda *_: None), "keep_better took a run in Arabic-Indic digits")


# ---- S685: a generic heading on the program's own page, a second pass, the order of the checks -----------------

CL_URL = "https://catalog.x.edu/programs-courses/business/business-administration-as/"   # a CourseLeaf address
OTHER_URL = "https://catalog.x.edu/programs-courses/business/accounting-as/"
SNAPSHOT = os.path.join(ROOT, "tests", "fixtures", "program_reread_keep_better_main_snapshot.json")
REAL = os.path.join(ROOT, "tests", "fixtures", "program_reread_keep_better_s685.json")
WORSE = score(False, False, 1, 10, "incomplete")


def source_entry(cn, url, title="", h1="2026-2027\nAcademic Catalog", heading_named=None):
    src = {"url": url, "title": title, "h1": h1}
    if heading_named is not None:
        src["heading_named"] = heading_named
    return {"control_number": cn, "title": TITLE, "award": AWARD, "source": src}


def generic_folder(tmp, cases, sources=()):
    """cases: cn -> (filed score or None, re-read score, heading, source_url). The base files each filed score."""
    new_repo(tmp)
    folder = os.path.join(tmp, "kb", "program_requirements_college", "fixture")
    rdir = os.path.join(folder, "records")
    for cn, (filed, _, _, _) in cases.items():
        if filed is not None:
            write(os.path.join(rdir, cn + ".json"), rec(cn, filed, OLD), indent=1)
    write(os.path.join(folder, "capture.json"), {"run": str(OLD)})
    git(tmp, "add", "-A")
    git(tmp, "commit", "-qm", "base")
    git(tmp, "tag", "base")
    for cn, (_, new, heading, url) in cases.items():
        write(os.path.join(rdir, cn + ".json"), rec(cn, new, NEW, heading=heading, url=url))
    write(os.path.join(folder, "capture.json"), {"run": str(NEW)})
    write(os.path.join(folder, "sources.json"), list(sources))
    return folder, rdir


def outcomes(acct):
    return {r["control_number"]: r["outcome"] for r in acct["runs"][str(NEW)]["programs"]}


def test_generic_heading_scorer(tmp):
    """The four headings a CourseLeaf page prints name no program by the scorer's own reading (S684's 17)."""
    from _program_requirements_score import heading_content_words
    for h in ("REQUIREMENTS", "Course List", "Major Requirements", "Requirements"):
        check(heading_content_words(h) == [], "the scorer reads %r as naming a program: %r" % (h, heading_content_words(h)))
    check(heading_content_words("Accounting, A.S.") == ["accounting"], "another program's heading reads silent")


def test_generic_heading(tmp):
    """S685, item (b): a generic heading passes only on a page the committed files show is the program's own."""
    cases = {
        "50001": (WORSE, PASS, "REQUIREMENTS", CL_URL),                          # by the address
        "50002": (WORSE, PASS, "Major Requirements", "https://x.edu/p.php?id=9"),  # by the capture's page title
        "50003": (WORSE, PASS, "Course List", "https://x.edu/cat.pdf#page=4"),     # by the capture's heading_named
        "50004": (WORSE, PASS, "Requirements", "https://x.edu/p.php?id=7"),        # no evidence at all
        "50005": (WORSE, PASS, "Accounting, A.S.", CL_URL),                      # another program's heading
        "50006": (WORSE, PASS, "REQUIREMENTS", OTHER_URL),                       # the address names another program
        "50007": (WORSE, PASS, "Requirements",                                   # the directory names it, the page not
                  "https://catalog.x.edu/business-administration/office-assistant/"),
        "50008": (WORSE, PASS, "REQUIREMENTS",                                   # the address names another award
                  "https://catalog.x.edu/programs-courses/business/business-administration-ast/"),
        "50009": (WORSE, PASS, "Requirements", "https://x.edu/p.php?id=11"),       # the entry is for another page
        "50010": (None, PASS, "REQUIREMENTS", CL_URL),                           # new, on its own page
        "50011": (None, PASS, "REQUIREMENTS", OTHER_URL),                        # new, on another's page
        "50012": (WORSE, PASS, "", CL_URL),                                      # a blank heading still fails
        "50013": (WORSE, PASS, "Requirements",                                   # the reader's slug_awards: a COA
                  "https://catalog.x.edu/programs-courses/business/business-administration-coa/"),
    }
    sources = [
        source_entry("50002", "https://x.edu/p.php?id=9",
                     title="Business Administration - Associate in Science | Fixture College Catalog"),
        source_entry("50003", "https://x.edu/cat.pdf", heading_named=True),
        source_entry("50004", "https://x.edu/p.php?id=7", title="Program Search | Fixture College Catalog"),
        source_entry("50009", "https://x.edu/p.php?id=12",
                     title="Business Administration - Associate in Science | Fixture College Catalog"),
    ]
    folder, rdir = generic_folder(tmp, cases, sources)
    acct = K.keep_better(folder, base="base", checked=set(), out=lambda *_: None)
    got = {r["control_number"]: r for r in acct["runs"][str(NEW)]["programs"]}
    want = {"50001": "kept", "50002": "kept", "50003": "kept", "50004": "restored", "50005": "restored",
            "50006": "restored", "50007": "restored", "50008": "restored", "50009": "restored", "50010": "new",
            "50011": "held", "50012": "restored", "50013": "restored"}
    check({k: v["outcome"] for k, v in got.items()} == want,
          "generic headings: %r" % {k: (v["outcome"], v["why"][:70]) for k, v in got.items() if v["outcome"] != want[k]})
    for cn in ("50001", "50002", "50003", "50010"):
        check(bool(got[cn].get("own_page")), "%s: the account names no page evidence" % cn)
        check(json.loads(read_bytes(os.path.join(rdir, cn + ".json")))["extracted_run"] == NEW, "%s: re-read not kept" % cn)
    check(dispatched(acct) == {"50001", "50002", "50003", "50010"}, "dispatch %r" % (acct["dispatch"],))
    for cn in ("50004", "50006", "50007", "50008", "50009", "50013"):
        check("generic" in got[cn]["why"] and "own" in got[cn]["why"], "%s: the why %r" % (cn, got[cn]["why"]))
        check(read_bytes(os.path.join(rdir, cn + ".json")) == read_bytes_base(tmp, cn), "%s: not restored" % cn)
    check("shares no word" in got["50005"]["why"], "50005: %r" % got["50005"]["why"])
    check("no heading" in got["50012"]["why"], "50012: %r" % got["50012"]["why"])
    check(acct["counts"]["kept_on_own_page"] == 4, "kept on its own page %r" % acct["counts"]["kept_on_own_page"])
    # No sources.json at all: the address alone still shows the page.
    os.remove(os.path.join(folder, "sources.json"))
    check(K.own_program(rec("50001", PASS, NEW, heading="REQUIREMENTS", url=CL_URL)) is None,
          "the address alone does not pass a generic heading")


def test_order(tmp):
    """S685, item (a), COBIx on #3547: checked, own program, a live run equal to this run, a live run that differs."""
    cases = {
        "51001": (WORSE, PASS, OWN, CL_URL),             # live holds this run: already posted, kept, no dispatch
        "51002": (WORSE, PASS, "Accounting, A.S.", CL_URL),   # live holds this run, not its own program: held
        "51003": (None, PASS, "Accounting, A.S.", CL_URL),    # the same with no filed record
        "51004": (WORSE, PASS, OWN, CL_URL),             # checked, and live holds this run: the check wins
        "51005": (WORSE, PASS, "Accounting, A.S.", CL_URL),   # checked, not its own: the check wins
        "51006": (WORSE, PASS, OWN, CL_URL),             # live holds a third run: held
        "51007": (WORSE, PASS, "Accounting, A.S.", CL_URL),   # live holds a third run, not its own: restored
        "51008": (WORSE, PASS, OWN, CL_URL),             # live equals the filed run: better decides, kept
        "51009": (None, PASS, OWN, CL_URL),              # live holds this run, no filed record: posted
    }
    folder, rdir = generic_folder(tmp, cases)
    lr = {"51001": str(NEW), "51002": str(NEW), "51003": str(NEW), "51004": str(NEW), "51005": str(NEW),
          "51006": "999", "51007": "999", "51008": str(OLD), "51009": str(NEW)}
    acct = K.keep_better(folder, base="base", checked={"51004", "51005"}, live_runs=lr, out=lambda *_: None)
    got = {r["control_number"]: r for r in acct["runs"][str(NEW)]["programs"]}
    want = {"51001": "posted", "51002": "held", "51003": "held", "51004": "restored", "51005": "restored",
            "51006": "held", "51007": "restored", "51008": "kept", "51009": "posted"}
    check({k: v["outcome"] for k, v in got.items()} == want,
          "the order: %r" % {k: (v["outcome"], v["why"][:70]) for k, v in got.items() if v["outcome"] != want[k]})
    for cn in ("51001", "51009"):
        check(json.loads(read_bytes(os.path.join(rdir, cn + ".json")))["extracted_run"] == NEW,
              "%s: an already-posted record left the branch" % cn)
        check(not os.path.exists(os.path.join(folder, K.HELD_DIR, cn + ".json")), "%s: an already-posted record is held" % cn)
    for cn in ("51002", "51003"):
        why = got[cn]["why"]
        check(str(NEW) in why and "wrong record" in why, "%s: the why does not name the live run: %r" % (cn, why))
        check(os.path.isfile(os.path.join(folder, K.HELD_DIR, cn + ".json")), "%s: not in held_for_person/" % cn)
    check(read_bytes(os.path.join(rdir, "51002.json")) == read_bytes_base(tmp, "51002"), "51002: main's file not back")
    check(not os.path.exists(os.path.join(rdir, "51003.json")), "51003: still in records/")
    for cn in ("51004", "51005"):
        check("checked" in got[cn]["why"], "%s: the check did not decide: %r" % (cn, got[cn]["why"]))
    check("999" in got["51006"]["why"] and str(OLD) in got["51006"]["why"], "51006: %r" % got["51006"]["why"])
    check(dispatched(acct) == {"51008"}, "dispatch %r" % (acct["dispatch"],))
    check(acct["dispatch"][0].get("already_live") == ["51001", "51009"],
          "the dispatch does not name the records riding along: %r" % (acct["dispatch"],))
    check(acct["counts"]["already_live"] == 2, "already live %r" % acct["counts"]["already_live"])


def test_second_pass(tmp):
    """S685, item (a): after the reread posts, a second pass with a refreshed live read keeps the branch's records
    and adds the run to no dispatch."""
    folder, rdir = generic_folder(tmp, {"52001": (WORSE, PASS, OWN, CL_URL), "52002": (None, PASS, OWN, CL_URL),
                                        "52003": (PASS, WORSE, OWN, CL_URL)})
    first = K.keep_better(folder, base="base", checked=set(), live_runs={"52001": str(OLD), "52003": str(OLD)},
                          out=lambda *_: None)
    check(outcomes(first) == {"52001": "kept", "52002": "new", "52003": "restored"}, "first pass %r" % outcomes(first))
    check(dispatched(first) == {"52001", "52002"}, "first dispatch %r" % (first["dispatch"],))
    before = {cn: read_bytes(os.path.join(rdir, cn + ".json")) for cn in ("52001", "52002", "52003")}
    # The reread posted run NEW on a branch whose receipt this checkout does not hold: the live read now says so.
    again = K.keep_better(folder, base="base", checked=set(),
                          live_runs={"52001": str(NEW), "52002": str(NEW), "52003": str(OLD)}, out=lambda *_: None)
    check(outcomes(again) == {"52001": "posted", "52002": "posted", "52003": "restored"},
          "second pass %r" % outcomes(again))
    check(all(read_bytes(os.path.join(rdir, cn + ".json")) == b for cn, b in before.items()),
          "a second pass changed the branch's records")
    check(not os.path.isdir(os.path.join(folder, K.HELD_DIR)), "a second pass held a record")
    check(isinstance(again["dispatch"], str) and again["dispatch"].startswith("no dispatch"),
          "a second pass dispatched again: %r" % (again["dispatch"],))


def every_branch_snapshot(tmp, module) -> dict:
    """The every-branch fixture of test_folder run through `module`: outcomes, each record file's bytes as sha256,
    and the dispatch (without its ref), so main's script and this one can be compared."""
    import hashlib
    global K
    saved, K = K, module
    try:
        new_repo(tmp)
        folder = os.path.join(tmp, "kb", "program_requirements_college", "fixture")
        rdir = os.path.join(folder, "records")
        for cn, (filed, _, _, _) in CASES.items():
            if filed is not None:
                write(os.path.join(rdir, cn + ".json"), rec(cn, filed, OLD), indent=1)
        write(os.path.join(folder, "capture.json"), {"run": str(OLD)})
        git(tmp, "add", "-A")
        git(tmp, "commit", "-qm", "base")
        git(tmp, "tag", "base")
        for cn, (_, new, _, heading) in CASES.items():
            write(os.path.join(rdir, cn + ".json"), rec(cn, new, NEW, heading=heading, url="https://x.edu/cat.pdf#page=2"))
        write(os.path.join(folder, "capture.json"), {"run": str(NEW)})
        acct = module.keep_better(folder, base="base", checked={"10015"}, out=lambda *_: None)
    finally:
        K = saved
    files = {}
    for sub in ("records", "held_for_person"):
        d = os.path.join(folder, sub)
        for name in sorted(os.listdir(d)) if os.path.isdir(d) else []:
            files["%s/%s" % (sub, name)] = hashlib.sha256(read_bytes(os.path.join(d, name))).hexdigest()
    return {"outcomes": {r["control_number"]: r["outcome"] for r in acct["runs"][str(NEW)]["programs"]},
            "files": files, "dispatch": [{k: v for k, v in x.items() if k != "ref"} for x in acct["dispatch"]]}


def test_matches_main(tmp):
    """With live_runs absent, the every-branch fixture's outcomes, files and dispatch are main's script's at
    94a02499 (#3547), pinned in tests/fixtures/program_reread_keep_better_main_snapshot.json."""
    with open(SNAPSHOT) as fh:
        want = json.load(fh)["snapshot"]
    got = every_branch_snapshot(tmp, K)
    for key in ("outcomes", "files", "dispatch"):
        check(got[key] == want[key], "the every-branch fixture's %s moved from main's: %r" % (key, {
            k: (got[key].get(k), want[key].get(k)) for k in set(got[key]) | set(want[key])
            if got[key].get(k) != want[key].get(k)} if isinstance(want[key], dict) else got[key]))


def test_real_cases(tmp):
    """Real S684 re-reads set aside on the word test alone (Ventura, Evergreen Valley), and Ventura's C-ID page."""
    with open(REAL) as fh:
        cases = json.load(fh)["cases"]
    want = {"31298": "kept", "45831": "kept", "06154": "kept", "46262": "kept",
            "35207": "restored",   # its own page, and the filed record holds coverage.pass: better decides
            "45355": "held",       # Cal-GETC read from the C-ID page: no filed record, and nothing shows the page
            # S685 round 1: heading_named on a PDF window whose first line names the AA-T, for the A.A.
            "16986": "restored",
            # Communication Studies on the Communication Studies 2.0 page: 2.0 is a word of its own
            "31614": "restored",
            # Business Administration 2.0 on business-administration-adt: the address lacks 2.0, the page title has it
            "41679": "kept"}
    for case in cases:
        sub = os.path.join(tmp, case["control_number"])
        os.makedirs(sub, exist_ok=True)
        new_repo(sub)
        folder = os.path.join(sub, "kb", "program_requirements_college", case["slug"])
        rdir = os.path.join(folder, "records")
        cn = case["control_number"]
        base = {"college": case["college"], "control_number": cn, "title": case["title"], "award": case["award"]}
        if case["filed"]:
            write(os.path.join(rdir, cn + ".json"), dict(base, **case["filed"], record={"program": {}}), indent=1)
        write(os.path.join(folder, "capture.json"), {"run": "1"})
        git(sub, "add", "-A")
        git(sub, "commit", "-qm", "base", "--allow-empty")
        git(sub, "tag", "base")
        write(os.path.join(rdir, cn + ".json"),
              dict(base, source_url=case["source_url"], extracted_run=int(case["run"]), score=case["reread_score"],
                   record={"program": {"section_heading": case["heading"]}, "blocks": []}))
        write(os.path.join(folder, "capture.json"), {"run": case["run"]})
        write(os.path.join(folder, "sources.json"), [case["sources_entry"]])
        lr = {cn: case["live_run"]} if case["live_run"] else {}
        acct = K.keep_better(folder, base="base", checked=set(), live_runs=lr, out=lambda *_: None)
        row = acct["runs"][case["run"]]["programs"][0]
        check(row["outcome"] == want[cn], "%s %s: %s (%s), expected %s"
              % (case["college"], cn, row["outcome"], row["why"][:90], want[cn]))
        if want[cn] == "kept":
            check(dispatched(acct) == {cn}, "%s: dispatch %r" % (cn, acct["dispatch"]))
            check(bool(row.get("own_page")), "%s: no page evidence named" % cn)
        elif cn == "35207":
            check(row.get("own_page") and "coverage.pass" in row["why"], "35207: %r" % row["why"][:120])
        else:
            check("generic" in row["why"], "%s: set aside for another reason: %r" % (cn, row["why"][:120]))
    check({c["control_number"] for c in cases} == set(want), "the real cases are not the ones expected")
    check("page title" in (K.page_is_own(dict(next(c for c in cases if c["control_number"] == "41679"),
                                                record={}),
                                           next(c for c in cases if c["control_number"] == "41679")["sources_entry"])
                           or ""), "41679 passes on something other than its page title")


def test_address_cases(tmp):
    """S685 round 1, finding 2: the address names the title and nothing else. Five committed addresses of a longer
    title's program (Ventura, Antelope Valley) show nothing for the shorter title; the programs' own addresses,
    a term suffix (-fall-2026) included, still do."""
    with open(REAL) as fh:
        cases = json.load(fh)["address_cases"]
    check(sum(not c["own_address"] for c in cases) == 5, "the five addresses are not all in the fixture")
    for c in cases:
        got = K.page_is_own({"control_number": c["control_number"], "title": c["title"], "award": c["award"],
                             "source_url": c["source_url"]})
        if c["own_address"]:
            check(got is not None and "address" in got, "%s %s on its own address %s: %r"
                  % (c["control_number"], c["title"], c["source_url"], got))
        else:
            check(got is None, "%s %s passes on %s: %r" % (c["control_number"], c["title"], c["source_url"], got))
    words = K.page_words
    check(words("communication-2-studies") == words("Communication Studies 2.0") != words("Communication Studies"),
          "2 and 2.0 are not one version word")


def test_capture_names_another_award(tmp):
    """S685 round 1, findings 1 and 4: a page title, or the window line beside heading_named, naming another award
    shows nothing, though it names every title word."""
    url = "https://x.edu/p.php?id=9"
    r = {"control_number": "53001", "title": TITLE, "award": AWARD, "source_url": url}
    aat = "Business Administration - Associate in Arts for Transfer | Fixture College Catalog"
    own = "Business Administration - Associate in Science | Fixture College Catalog"
    check(K.page_is_own(r, source_entry("53001", url, title=own)) is not None, "the program's own page title fails")
    check(K.page_is_own(r, source_entry("53001", url, title=aat)) is None, "a page title naming the AA-T passes")
    check(K.page_is_own(r, source_entry("53001", url, title="", h1=aat)) is None, "an h1 naming the AA-T passes")
    line = "Students completing the Associate in Arts for Transfer in Business Administration at"
    check(K.page_is_own(r, source_entry("53001", url, title=line, h1=line, heading_named=True)) is None,
          "heading_named passes beside a window line naming the AA-T")
    check(K.page_is_own(r, source_entry("53001", url, title="Business Administration", heading_named=True))
          is not None, "heading_named fails beside a line naming no award")


def test_award_ending(tmp):
    """COBIx on #3553, finding 1: an award ending stripped from the address must be one the reader's slug_awards reads
    as the program's kind, or the address shows nothing. Real addresses: College of the Redwoods 01821 (the A.S. on
    the certificate's welding-technology-ca-fall-2025), an A.A. on San Bernardino Valley's studio-arts-aa-t-degree;
    an ending naming the program's own kind still passes, and an address with no ending reads as on main. Finding 2:
    the stripped ending is on the decision row as award_tail, "" when none."""
    with open(REAL) as fh:
        cases = json.load(fh)["award_ending_cases"]
    check(sum(not c["own_address"] and c["award_tail"] in ("-ca", "-aa-t-degree") for c in cases) >= 2 and
          any(c["own_address"] and c["award_tail"] for c in cases) and
          any(c["own_address"] and not c["award_tail"] for c in cases), "the award-ending cases are not all there")
    for c in cases:
        note = {}
        got = K.page_is_own({"control_number": c["control_number"], "title": c["title"], "award": c["award"],
                             "source_url": c["source_url"]}, None, note)
        check((got is not None) == c["own_address"], "%s %s (%s) on %s: %r"
              % (c["control_number"], c["title"], c["award"][:20], c["source_url"], got))
        check(note.get("award_tail") == c["award_tail"], "%s: award_tail %r, expected %r"
              % (c["control_number"], note.get("award_tail"), c["award_tail"]))
    # Through keep_better, with the fixture's Business Administration A.S.
    base = "https://catalog.x.edu/programs-courses/business/"
    folder_cases = {
        "54001": (WORSE, PASS, "REQUIREMENTS", base + "business-administration-ca-fall-2025/"),  # the certificate's
        "54002": (WORSE, PASS, "Course List", base + "business-administration-aa-t-degree/"),    # the AA-T's
        "54003": (WORSE, PASS, "REQUIREMENTS", CL_URL),                                          # -as: its own kind
        "54004": (WORSE, PASS, "Requirements", base + "business-administration/"),               # no ending
        "54005": (WORSE, PASS, "Requirements", "https://x.edu/business-administration-ca"),     # the page title shows it
        "54006": (WORSE, PASS, OWN, base + "business-administration-ca/"),                       # a heading naming it
    }
    sources = [source_entry("54005", "https://x.edu/business-administration-ca",
                            title="Business Administration - Associate in Science | Fixture College Catalog")]
    folder, rdir = generic_folder(tmp, folder_cases, sources)
    acct = K.keep_better(folder, base="base", checked=set(), out=lambda *_: None)
    got = {r["control_number"]: r for r in acct["runs"][str(NEW)]["programs"]}
    want = {"54001": ("restored", "-ca"), "54002": ("restored", "-aa-t-degree"), "54003": ("kept", "-as"),
            "54004": ("kept", ""), "54005": ("kept", "-ca"), "54006": ("kept", None)}
    for cn, (outcome, tail) in want.items():
        check(got[cn]["outcome"] == outcome, "%s: %s (%s), expected %s" % (cn, got[cn]["outcome"],
                                                                           got[cn]["why"][:90], outcome))
        check(got[cn].get("award_tail") == tail, "%s: award_tail %r, expected %r"
              % (cn, got[cn].get("award_tail"), tail))
    for cn in ("54001", "54002"):
        check("generic" in got[cn]["why"], "%s: set aside for another reason: %r" % (cn, got[cn]["why"][:120]))
        check(read_bytes(os.path.join(rdir, cn + ".json")) == read_bytes_base(tmp, cn), "%s: not restored" % cn)
    check("address" in got["54003"].get("own_page", "") and "address" in got["54004"].get("own_page", ""),
          "54003/54004 kept on something other than the address")
    check("page title" in got["54005"].get("own_page", ""), "54005: %r" % got["54005"].get("own_page"))
    # The listing finding 2 asks for: rows kept on address evidence whose address carried an award ending.
    listed = {cn for cn, r in got.items() if r["outcome"] == "kept" and r.get("award_tail")
              and r.get("own_page", "").startswith("the address")}
    check(listed == {"54003"}, "kept on an address with an award ending: %r" % sorted(listed))


def main():
    for fn in (test_checked_list, test_folder, test_all_restored, test_checked_unfiled, test_live_runs,
               test_live_runs_file, test_control_number_shape, test_ascii_runs, test_generic_heading_scorer,
               test_generic_heading, test_order, test_second_pass, test_matches_main, test_real_cases,
               test_address_cases, test_capture_names_another_award, test_award_ending):
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
