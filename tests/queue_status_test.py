#!/usr/bin/env python3
"""Guard for kb/status/program-requirements.json and scripts/queue_status.py (S343; the file was
kb/queue_status.json until S419 moved every common reference's status file under kb/status/).

The Progress view on the Program Requirements tab reads the harvest's tables live and
takes what no browser read can know from this file: the session that last worked the
queue, the routine's next firing, the next step, the calls waiting on Sam and what changed. A checkpoint that writes a malformed file
leaves the view saying it could not read it; this guard fails first.

Run from repo root: python3 tests/queue_status_test.py
"""
import copy
import json
import os
import re
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
# The unchecked list (S415): no record waits on a person since Sam's 2026-10-17 ruling, and the
# view counts every record itself. At 15,914 rows the list made this file 3.5 MB, read on
# every visit to the tab.
check("the committed file carries no unchecked list and stays small",
      "unchecked" not in Q and os.path.getsize(M.PATH) < 200000, os.path.getsize(M.PATH))
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
    ("an unchecked list that is not a list", lambda q: q.__setitem__("unchecked", "15914"), "unchecked must be a list"),
    ("an unchecked record with no load date", lambda q: q.__setitem__("unchecked", [{"college": "X College", "program": "Y", "control_number": "1"}]), "loaded"),
    ("a note for a part the view does not have", lambda q: q.setdefault("notes", {}).__setitem__("funding", "x"), "names no part"),
    ("a glyph in a call", lambda q: q["calls"].append({"title": "Check ✅", "text": "x"}), "glyph"),
    ("markdown in the next step", lambda q: q["next_step"].__setitem__("text", "**Bold** words"), "markdown"),
    ("a change with no time", lambda q: q["changes"].append({"text": "x"}), "changes"),
    ("a link that is not https", lambda q: q["calls"].append({"title": "t", "text": "x", "link": "http://example.org"}), "link"),
    ("a view that is neither https nor a bare tab hash", lambda q: q["calls"].append({"title": "t", "text": "x", "view": {"href": "#tab=x&y", "text": "See it"}}), "view.href"),
    ("a view with no words", lambda q: q["calls"].append({"title": "t", "text": "x", "view": {"href": "#cpl-pathways"}}), "view.text"),
    # A call that names records (S354): the card answers each through the verdict RPC,
    # which takes the college and the control number, so a record missing either fails.
    ("a call's record with no control number", lambda q: q["calls"].append({"title": "t", "text": "x", "records": [{"college": "Cerritos College"}]}), "records[0].control_number"),
    ("a call naming an empty list of records", lambda q: q["calls"].append({"title": "t", "text": "x", "records": []}), "non-empty"),
    # Where Sam answers it (Sam, 2026-10-13): S380's three calls carried no link, so on his
    # phone each card named a question with nowhere to tap.
    ("a call with nowhere to answer it", lambda q: q["calls"].append({"title": "t", "text": "x"}), "needs a place to answer it"),
    ("a call placed on a part the view does not have", lambda q: q["calls"].append({"title": "t", "text": "x", "link": "https://claude.ai/artifact/x", "part": "funding"}), "part names no part"),
    # The headline's history (Sam, 2026-10-08): the pair needs a trend, so a checkpoint
    # that drops the list, repeats a day or writes a count as text fails here.
    ("the headline history left out", lambda q: q.pop("headline"), "headline must be a list"),
    ("a headline count written as text", lambda q: q["headline"].append({"day": "2099-01-01", "active": "20282", "checked": 20, "colleges": 5}), "active must be a whole number"),
    ("more checked than active", lambda q: q["headline"].append({"day": "2099-01-01", "active": 10, "checked": 20, "colleges": 5}), "cannot exceed"),
    ("more complete than active", lambda q: q["headline"].append({"day": "2099-01-01", "active": 10, "complete": 20, "colleges": 5}), "complete cannot exceed"),
    ("an entry that counts neither complete nor checked", lambda q: q["headline"].append({"day": "2099-01-01", "active": 10, "colleges": 5}), "needs complete"),
    ("a day recorded twice", lambda q: q["headline"].append(dict(q["headline"][-1])), "must come after"),
]
q = copy.deepcopy(Q)
q["calls"].append({"title": "t", "text": "x", "link": "https://claude.ai/artifact/x", "link_text": "Answer on Open Asks Sheet 50, card 1",
                   "view": {"href": "#cpl-pathways", "text": "See it on CPL Pathways"}})
check("accepts a call with its sheet link, its words, and a tab to view the item", not M.faults(q), M.faults(q))
q = copy.deepcopy(Q)
q["calls"].append({"title": "t", "text": "x", "records": [{"college": "Cerritos College", "control_number": "02201", "label": "Architectural Technology A.A."}]})
check("accepts a call naming the records it asks about", not M.faults(q), M.faults(q))
q = copy.deepcopy(Q)
q["calls"].append({"title": "t", "text": "x", "link": "https://claude.ai/artifact/x", "part": "checks"})
check("accepts a call placed on one of the view's parts", not M.faults(q), M.faults(q))
check("every call in the committed file says where Sam answers it",
      all(c.get("link") or c.get("view") or c.get("records") for c in Q.get("calls") or []), Q.get("calls"))
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
          rc == 0 and len(today) == 1 and today[0] == {"day": s["written_at"][:10], "active": 20282, "complete": 22, "colleges": 6}
          and len(s["headline"]) in (before, before + 1), s["headline"])
    check("--headline keeps the earlier days, oldest first",
          s["headline"][0]["day"] == "2026-10-08" and [e["day"] for e in s["headline"]] == sorted(e["day"] for e in s["headline"]), s["headline"])

# The headline's query: complete is an active program whose record passes the server's own
# reading of the machine checks, the same three the view's machineFails() reads.
check("the headline query counts active programs whose record passes the machine checks",
      "status = 'Active'" in M.HEADLINE_SQL and "program_record_machine_pass(r.checks)" in M.HEADLINE_SQL
      and " complete" in M.HEADLINE_SQL and "checked" not in M.HEADLINE_SQL, M.HEADLINE_SQL)

# ── 4. the whole-harvest block (Sam, 2026-10-13: "an overall measure ... how far we are
#       through the whole harvest process", the confirm step left out) ────────────────
ROW = {"colleges": 118, "catalog_links": 118, "cms_links": 118, "ppm_links": 112, "active_programs": 20282,
       "roep_programs": 2568, "coci_compared": 2568, "plo_read": 2568, "careers_read": 1518,
       "program_courses": 89192, "slo_courses": 4123}
hb = M.harvest_block(ROW, "2026-10-13", 308)
check("the harvest block holds the five parts the view draws, each a [have, of] pair",
      set(hb["parts"]) == {"links", "roep", "coci", "outcomes", "careers"} and hb["parts"]["links"]["ppm"] == [112, 118]
      and hb["parts"]["outcomes"] == {"slo": [4123, 89192], "plo": [2568, 20282]} and hb["parts"]["careers"] == [1518, 20282], hb)
check("filed gaps count toward ROEP data (a program accounted for), never past the active programs",
      hb["parts"]["roep"] == [2876, 20282] and M.harvest_block(ROW, "2026-10-13", 99999)["parts"]["roep"] == [20282, 20282], hb["parts"]["roep"])
check("a sound harvest block passes", M.harvest_faults(hb) == [], M.harvest_faults(hb))
bad = copy.deepcopy(hb)
bad["parts"]["coci"] = [30000, 20282]
bad["parts"].pop("careers")
fs = M.harvest_faults(bad)
check("have past of, and a missing part, are named", any("coci" in f for f in fs) and any("careers" in f for f in fs), fs)
check("the query reads every key the block needs, and the active programs from COCI",
      all(k in M.HARVEST_SQL for k in M.HARVEST_KEYS) and "status = 'Active'" in M.HARVEST_SQL, M.HARVEST_SQL[:80])
check("the view draws the same five parts the block holds",
      set(re.findall(r'\{ id: "([a-z]+)", title: "[^"]+", note:', open(os.path.join(ROOT, "program_requirements.js"), encoding="utf-8").read()))
      == set(M.WHOLE_PARTS), sorted(M.WHOLE_PARTS))
with tempfile.TemporaryDirectory() as d:
    p = os.path.join(d, "q.json")
    q = copy.deepcopy(Q)
    q["written_at"] = "2000-01-01T00:00:00Z"
    with open(p, "w", encoding="utf-8") as f:
        json.dump(q, f)
    rc = M.main(["--harvest", json.dumps([ROW]), "--path", p])
    with open(p, encoding="utf-8") as f:
        s = json.load(f)
    check("--harvest writes the block from the query's row and never moves written_at",
          rc == 0 and s["written_at"] == "2000-01-01T00:00:00Z" and s["harvest"]["parts"]["coci"] == [2568, 20282]
          and isinstance(s["harvest"]["gaps"], int), (rc, s.get("written_at"), s.get("harvest")))

pass_n = sum(1 for r in results if r[1])
for name, ok, why in results:
    print(("  ok  " if ok else "FAIL  ") + name + ("" if ok or not why else "\n        > " + str(why)))
print("\nqueue_status_test.py: %d/%d checks passed" % (pass_n, len(results)))
sys.exit(0 if pass_n == len(results) else 1)
