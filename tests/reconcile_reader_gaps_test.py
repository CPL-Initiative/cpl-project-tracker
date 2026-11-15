#!/usr/bin/env python3
"""The reconcile route's three reader gaps, closed (S658; found on #3352, S655).

(a) A record the filed capture holds (would_extract.held_worse_window / held_no_gain) is never reconciled from the
    held page, and both hold lists go back on the run's capture so the filing keeps them (American River 07206).
(b) A record the reconcile leaves as filed keeps the sources.json entry it was read from (Santiago Canyon's 18).
(c) The arithmetic.rescored marker a ruling's rescore wrote survives: a score equal but for the marker stays
    whole; a fresh passing arithmetic carries it; a fresh failing one keeps the filed score.

    python3 tests/reconcile_reader_gaps_test.py
"""
from __future__ import annotations

import json
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_requirements_college as C  # noqa: E402

FAILS: list[str] = []


def check(ok: bool, what: str) -> None:
    print(("ok   " if ok else "FAIL ") + what)
    if not ok:
        FAILS.append(what)


def put(path: str, obj) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as fh:
        json.dump(obj, fh)


def get(path: str):
    with open(path) as fh:
        return json.load(fh)


tmp = tempfile.mkdtemp()
COLLEGE = "Test College"
C.COLLEGE_DIR = os.path.join(tmp, "colleges")
dest = os.path.join(C.COLLEGE_DIR, C.slug_of(COLLEGE))
out = os.path.join(tmp, "out")

held_row = {"control_number": "07206", "url": "https://x/429", "coverage": 0.6}
put(os.path.join(dest, "capture.json"), {"college": COLLEGE, "run": 1, "would_extract": {
    "list": [], "held_worse_window": [held_row], "held_no_gain": [{"control_number": "07207"}]}})
filed_07206 = {"control_number": "07206", "title": "CIS", "extracted_run": 39047245752,
               "record": {"program": {}}, "score": {"arithmetic": {"status": "unequal", "pass": False}}}
filed_09999 = {"control_number": "09999", "title": "Other", "extracted_run": 111,
               "record": {"program": {}}, "score": {}}
put(os.path.join(dest, "records", "07206.json"), filed_07206)
put(os.path.join(dest, "records", "09999.json"), filed_09999)
put(os.path.join(dest, "sources.json"), [{"control_number": "07206", "source": {"url": "https://x/428"}, "old": True},
                                          {"control_number": "09999", "source": {"url": "https://x/1"}, "old": True}])
# The staged capture: holds recomputed empty, 07206 back on the list.
put(os.path.join(out, "capture.json"), {"college": COLLEGE, "run": 1, "would_extract": {
    "list": [held_row], "held_worse_window": [], "held_no_gain": []}})
put(os.path.join(out, "sources", "07206.json"), {"control_number": "07206", "text": "PAGE 429 TEXT",
                                                  "source": {"url": "https://x/429"}, "closed_list": []})
put(os.path.join(out, "sources", "09999.json"), {"control_number": "09999", "source": {"url": "https://x/2"}})

# ── (a) holds ────────────────────────────────────────────────────────────────────────────────
check(C.filed_holds(dest) == {"07206": "held_worse_window", "07207": "held_no_gain"}, "filed_holds reads both lists")
rc = C.reconcile_filed(COLLEGE, out, "43693265189", dest)
check(rc == 0, "reconcile_filed returns 0")
check(get(os.path.join(out, "records", "07206.json")) == filed_07206, "(a) the held record is written as filed")
we = get(os.path.join(out, "capture.json"))["would_extract"]
check(we["held_worse_window"] == [held_row] and we["held_no_gain"] == [{"control_number": "07207"}],
      "(a) both hold lists are back on the run's capture")
check(we["list"] == [], "(a) a held record leaves the extract list")
kept = get(os.path.join(out, C.RECONCILE_KEPT))["programs"]
check(kept == ["07206", "09999"], "(b) the kept list names the held record and the unread one: %s" % kept)

# ── (b) file_run keeps their sources.json entries ─────────────────────────────────────────────
C.file_run(COLLEGE, out, "43693265189")
idx = {e["control_number"]: e for e in get(os.path.join(dest, "sources.json"))}
check(idx["07206"].get("old") and idx["09999"].get("old"), "(b) a kept record keeps the entry it was read from")
check(get(os.path.join(dest, "capture.json"))["would_extract"]["held_worse_window"] == [held_row],
      "(a) the filing keeps the hold list")

# ── (c) the rescore marker ─────────────────────────────────────────────────────────────────────
marked = {"coverage": {"pass": True}, "arithmetic": {"status": "equal", "pass": True, "rescored": "Open Asks Sheet 81"}}
bare = {"coverage": {"pass": True}, "arithmetic": {"status": "equal", "pass": True}}
check(C.keep_rescored_marker("x", marked, bare) is marked, "(c) equal but for the marker: the filed score, whole")
moved = {"coverage": {"pass": False}, "arithmetic": {"status": "equal", "pass": True, "why": ["new"]}}
got = C.keep_rescored_marker("x", marked, moved)
check(got["arithmetic"].get("rescored") == "Open Asks Sheet 81" and got["coverage"] == {"pass": False},
      "(c) a fresh passing arithmetic carries the marker")
failing = {"coverage": {"pass": True}, "arithmetic": {"status": "unequal", "pass": False}}
check(C.keep_rescored_marker("x", marked, failing) is marked, "(c) a fresh failing arithmetic keeps the filed score")
check(C.keep_rescored_marker("x", bare, failing) is failing, "(c) no marker: the fresh score")

print("\n%d failed" % len(FAILS) if FAILS else "\nall passed")
sys.exit(1 if FAILS else 0)
