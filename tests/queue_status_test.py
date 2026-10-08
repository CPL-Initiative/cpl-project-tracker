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
check("the headline's history starts with Sam's ask: 20 of 20,282 on 2026-10-08",
      (Q.get("headline") or [{}])[0] == {"day": "2026-10-08", "active": 20282, "checked": 20, "colleges": 5}, Q.get("headline"))

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
    ("a view that is neither https nor a bare tab hash", lambda q: q["calls"].append({"title": "t", "text": "x", "view": {"href": "#tab=x&y", "text": "See it"}}), "view.href"),
    ("a view with no words", lambda q: q["calls"].append({"title": "t", "text": "x", "view": {"href": "#cpl-pathways"}}), "view.text"),
    # The headline's history (Sam, 2026-10-08): the pair needs a trend, so a checkpoint
    # that drops the list, repeats a day or writes a count as text fails here.
    ("the headline history left out", lambda q: q.pop("headline"), "headline must be a list"),
    ("a headline count written as text", lambda q: q["headline"].append({"day": "2099-01-01", "active": "20282", "checked": 20, "colleges": 5}), "active must be a whole number"),
    ("more checked than active", lambda q: q["headline"].append({"day": "2099-01-01", "active": 10, "checked": 20, "colleges": 5}), "cannot exceed"),
    ("a day recorded twice", lambda q: q["headline"].append(dict(q["headline"][-1])), "must come after"),
]
q = copy.deepcopy(Q)
q["calls"].append({"title": "t", "text": "x", "link": "https://claude.ai/artifact/x", "link_text": "Answer on Open Asks Sheet 50, card 1",
                   "view": {"href": "#cpl-pathways", "text": "See it on CPL Pathways"}})
check("accepts a call with its sheet link, its words, and a tab to view the item", not M.faults(q), M.faults(q))
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
    before = len(s["headline"])
    M.main(["--stamp", "--headline", "20282", "21", "5", "--path", p])
    rc = M.main(["--stamp", "--headline", "20282", "22", "6", "--path", p])
    with open(p, encoding="utf-8") as f:
        s = json.load(f)
    today = [e for e in s["headline"] if e["day"] == s["written_at"][:10]]
    check("--headline records today's pair once; a second stamp the same day replaces it",
          rc == 0 and len(today) == 1 and today[0] == {"day": s["written_at"][:10], "active": 20282, "checked": 22, "colleges": 6}
          and len(s["headline"]) in (before, before + 1), s["headline"])
    check("--headline keeps the earlier days, oldest first",
          s["headline"][0]["day"] == "2026-10-08" and [e["day"] for e in s["headline"]] == sorted(e["day"] for e in s["headline"]), s["headline"])

pass_n = sum(1 for r in results if r[1])
for name, ok, why in results:
    print(("  ok  " if ok else "FAIL  ") + name + ("" if ok or not why else "\n        > " + str(why)))
print("\nqueue_status_test.py: %d/%d checks passed" % (pass_n, len(results)))
sys.exit(0 if pass_n == len(results) else 1)
