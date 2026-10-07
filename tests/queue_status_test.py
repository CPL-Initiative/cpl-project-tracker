#!/usr/bin/env python3
"""Guard for kb/queue_status.json and scripts/queue_status.py (S343).

The Progress view on the Program Requirements tab reads the harvest's tables live and
takes what no browser read can know from this file: the records waiting on a person's
check, the session that last worked the queue, the routine's next firing, the next step,
the calls waiting on Sam and what changed. A checkpoint that writes a malformed file
leaves the view saying it could not read it; this guard fails first.

Run from repo root: python3 tests/queue_status_test.py
"""
import copy
import json
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "scripts"))
import queue_status as M  # noqa: E402

results = []


def check(name, ok, why=""):
    results.append((name, bool(ok), why))


# ── 1. the committed file is what the view reads ───────────────────────────
with open(M.PATH, encoding="utf-8") as f:
    Q = json.load(f)
bad = M.faults(Q)
check("the committed status file is sound", not bad, "; ".join(bad))
check("it names the handoff of the session that wrote it",
      Q.get("handoff") and os.path.exists(os.path.join(ROOT, Q["handoff"])))

# ── 2. the parts it may annotate are the view's own ────────────────────────
ids = M.part_ids()
check("the view's eight parts are read from program_requirements.js",
      ids == ["census", "reading", "checks", "maps", "procedures", "addenda", "figures", "sierra"], ids)


def faulted(mut, fragment):
    q = copy.deepcopy(Q)
    mut(q)
    out = M.faults(q)
    return any(fragment in b for b in out), out


cases = [
    ("a missing written_at", lambda q: q.pop("written_at"), "written_at"),
    ("a local time in written_at", lambda q: q.__setitem__("written_at", "2026-10-07T13:15:50-07:00"), "written_at"),
    ("a handoff that does not exist", lambda q: q.__setitem__("handoff", "docs/session_9999_handoff.md"), "handoff"),
    ("unchecked left out (the view cannot count them itself)", lambda q: q.pop("unchecked"), "unchecked"),
    ("an unchecked record with no load date", lambda q: q["unchecked"].append({"college": "X College", "program": "Y", "control_number": "1"}), "loaded"),
    ("a note for a part the view does not have", lambda q: q.setdefault("notes", {}).__setitem__("funding", "x"), "names no part"),
    ("a glyph in a call", lambda q: q["calls"].append({"title": "Check ✅", "text": "x"}), "glyph"),
    ("markdown in the next step", lambda q: q["next_step"].__setitem__("text", "**Bold** words"), "markdown"),
    ("a change with no time", lambda q: q["changes"].append({"text": "x"}), "changes"),
    ("a link that is not https", lambda q: q["calls"].append({"title": "t", "text": "x", "link": "http://example.org"}), "link"),
]
for name, mut, frag in cases:
    hit, out = faulted(mut, frag)
    check("refuses " + name, hit, out)

# ── 3. --stamp owns the clock and the routine's next firing ────────────────
with tempfile.TemporaryDirectory() as d:
    p = os.path.join(d, "q.json")
    q = copy.deepcopy(Q)
    q["written_at"] = "2000-01-01T00:00:00Z"
    with open(p, "w", encoding="utf-8") as f:
        json.dump(q, f)
    rc = M.main(["--stamp", "--next-run", "2026-10-09T15:07:00.000+00:00", "--path", p])
    with open(p, encoding="utf-8") as f:
        s = json.load(f)
    check("--stamp exits clean on a sound file", rc == 0, rc)
    check("--stamp sets written_at to now", s["written_at"] > "2026-01-01" and s["written_at"].endswith("Z"), s["written_at"])
    check("--stamp writes the routine's next firing in UTC", s["next_run"]["at"] == "2026-10-09T15:07:00Z", s["next_run"])

pass_n = sum(1 for r in results if r[1])
for name, ok, why in results:
    print(("  ok  " if ok else "FAIL  ") + name + ("" if ok or not why else "\n        > " + str(why)))
print("\nqueue_status_test.py: %d/%d checks passed" % (pass_n, len(results)))
sys.exit(0 if pass_n == len(results) else 1)
