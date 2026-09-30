#!/usr/bin/env python3
"""Guards kb/_course_title_cleanup_apply.py, the removal of the stale mojibake twins.

Sam's verdict of 2026-09-27 (open-asks card 7) authorizes one removal of the garbled rows
that sit beside their repaired twins in chatbox_college_courses. A removal is the one write
the rollback doctrine lets through only with FULL row images in the receipt, so these checks
pin what makes it safe: the set it removes must be the reviewed set, each row must still have
a clean twin at write time, the receipt exists before the first removal, a row that changed
since the read stays, and --rollback puts the rows back.

Runs against an in-memory table; no network. Run from repo root:
    python3 tests/course_title_cleanup_apply_test.py
"""
import contextlib
import glob
import io
import json
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _course_title_cleanup_apply as app  # noqa: E402
import _text_repair  # noqa: E402

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


def row(i, title, college="Sample College", subject="ENGL", number="1", units=3.0, **kw):
    r = {"id": i, "college": college, "subject": subject, "course_number": number,
         "course_title": title, "units": units, "credit_type": "Credit", "top_code": "1501.00",
         "top_title": "English", "cid": None, "control_number": "CCC-%s-%s" % (subject, number),
         "synced_at": "2026-08-13T13:52:23+00:00"}
    r.update(kw)
    return r


class FakeRest:
    """chatbox_college_courses in memory, answering the calls the applier makes."""

    def __init__(self, rows, plan_dir=None):
        self.rows = [dict(r) for r in rows]
        self.plan_dir = plan_dir
        self.removed_calls = 0
        self.receipt_seen_first = None
        self.before_remove = None

    def candidates(self):
        return [dict(r) for r in self.rows
                if any(m in (r["course_title"] or "") for m in app.LEAD_MARKS)]

    def siblings(self, r):
        return [dict(x) for x in self.rows if x["id"] != r["id"]
                and all(x[c] == r[c] for c in app.KEY)]

    def remove(self, r):
        if self.removed_calls == 0 and self.plan_dir:
            got = glob.glob(os.path.join(self.plan_dir, "removed_*.json"))
            self.receipt_seen_first = bool(got) and json.load(open(got[0]))["status"] == "intended"
        self.removed_calls += 1
        if self.before_remove:
            self.before_remove(self, r)
        hit = [x for x in self.rows if x["id"] == r["id"] and x["course_title"] == r["course_title"]]
        self.rows = [x for x in self.rows if x not in hit]
        return hit

    def present(self, r):
        return [x for x in self.rows if x["id"] == r["id"] or
                (all(x[c] == r[c] for c in app.KEY) and x["course_title"] == r["course_title"])]

    def insert(self, rows):
        self.rows.extend(dict(r) for r in rows)
        return rows


GARBLED = [
    row(10, "ChildrenÃ¢â‚¬â„¢s Literature", number="47"),
    row(11, "Survey of Art Ã¢â‚¬â€œ Asian Art", number="B38"),
    row(12, "IntroductionÃ‚Â toÃ‚Â Poetry", number="114"),
]
TWINS = [
    row(20, "Children’s Literature", number="47", synced_at="2026-09-18T13:20:00+00:00"),
    row(21, "Survey of Art – Asian Art", number="B38", synced_at="2026-09-18T13:20:00+00:00"),
    row(22, "Introduction to Poetry", number="114", synced_at="2026-09-18T13:20:00+00:00"),
]
OTHER = [
    row(30, "Âme et corps", subject="FREN", number="3"),          # genuine text with a lead mark
    row(31, "Composition", number="1A"),                          # an ordinary row
    row(32, "WomenÃ¢â‚¬â„¢s Health", number="243"),                 # garbled, but no twin
]
TABLE = GARBLED + TWINS + OTHER


def plan_dir_for(expected):
    d = tempfile.mkdtemp()
    json.dump({"table": app.TABLE, "verdict": "test", "expected": expected},
              open(os.path.join(d, "plan.json"), "w"))
    return d


def run(argv, rest):
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        code = app.main(argv, rest=rest, stamp="2026-09-27T20:00:00+00:00")
    return code, buf.getvalue()


REVIEWED = app.fingerprint([10, 11, 12])

# ── one detector, the loader's ───────────────────────────────────────────────
check("⭐ the applier uses the loader's detector, not a copy",
      app._MOJI_RE is _text_repair._MOJI_RE,
      "two detectors drift; the one that repairs the rows must be the one that finds them")

# ── the rule ─────────────────────────────────────────────────────────────────
t, why = app.judge(GARBLED[0], [TWINS[0]])
check("a garbled row with one clean twin qualifies", t is not None and t["id"] == 20, why)
check("a flattened no-break space still matches its twin's words",
      app.judge(GARBLED[2], [TWINS[2]])[0] is not None,
      "the round trip cannot repair it, so the rule compares words, not a repaired string")
check("a row with no marks stays", app.judge(OTHER[1], [TWINS[0]])[0] is None)
check("a row with no twin stays", app.judge(OTHER[2], [])[0] is None)
check("a row with two siblings stays", app.judge(GARBLED[0], [TWINS[0], TWINS[1]])[0] is None)
check("a garbled sibling is no twin", app.judge(GARBLED[0], [GARBLED[1]])[0] is None)
check("a sibling with other words is no twin",
      app.judge(GARBLED[0], [dict(TWINS[0], course_title="Adolescent Literature")])[0] is None)
check("⭐ a sibling that differs on any other column is no twin",
      app.judge(GARBLED[0], [dict(TWINS[0], units=4.0)])[0] is None,
      "a removed row must lose nothing but its garbled title")

# The constant is what Postgres returned on 2026-09-27 for
# encode(sha256(convert_to(string_agg(x::text, ',' order by x), 'UTF8')), 'hex') over 3, 1, 2,
# the formula that measured the plan's fingerprint. A drift in either formula fails here.
fp = app.fingerprint([3, 1, 2])
check("⭐ the fingerprint matches the SQL formula that measured the plan",
      fp == {"count": 3, "id_sum": 6, "id_min": 1, "id_max": 3,
             "ids_sha256": "8a6ae15122001229edb8866f56e342af12ae8187203c3e3b33931743e7c0c48d"},
      str(fp))

# ── a dry run reads and writes nothing ───────────────────────────────────────
d = plan_dir_for(REVIEWED)
fake = FakeRest(TABLE, d)
code, out = run([d], fake)
check("a dry run on the reviewed set passes", code == 0, out[-400:])
check("a dry run writes nothing", len(fake.rows) == len(TABLE) and not glob.glob(os.path.join(d, "removed_*")))
check("the genuine and twinless rows are reported, never removed",
      '"held": 2' in out and "held: 30 " in out and "held: 32 " in out, out[-400:])

# ── a set that moved is refused ──────────────────────────────────────────────
d2 = plan_dir_for(app.fingerprint([10, 11]))
fake2 = FakeRest(TABLE, d2)
code, out = run([d2, "--commit"], fake2)
check("⭐ a commit REFUSES when the set differs from the reviewed plan",
      code == 2 and len(fake2.rows) == len(TABLE) and not glob.glob(os.path.join(d2, "removed_*")),
      "a set that moved was never reviewed; nothing may be written")

# ── a commit removes exactly the stale twins, receipt first ──────────────────
d3 = plan_dir_for(REVIEWED)
fake3 = FakeRest(TABLE, d3)
code, out = run([d3, "--commit"], fake3)
left = {r["id"] for r in fake3.rows}
check("a commit removes exactly the garbled rows with twins",
      code == 0 and left == {20, 21, 22, 30, 31, 32}, str(sorted(left)))
check("⭐ the receipt exists, marked intended, before the first removal", fake3.receipt_seen_first is True)
rec = json.load(open(glob.glob(os.path.join(d3, "removed_*.json"))[0]))
check("⭐ the receipt carries full row images",
      rec["status"] == "applied" and len(rec["rows"]) == 3
      and all(set(app.COLS) <= set(r) for r in rec["rows"])
      and {r["id"]: r["course_title"] for r in rec["rows"]}[10] == GARBLED[0]["course_title"],
      "a DELETE's receipt must hold the whole row (data_write_rollback)")
check("the receipt names each row's twin", {r["id"]: r["twin_id"] for r in rec["rows"]} == {10: 20, 11: 21, 12: 22})

# ── a row that changed since the read stays ──────────────────────────────────
d4 = plan_dir_for(REVIEWED)
fake4 = FakeRest(TABLE, d4)


def _edit(self, r):
    if r["id"] == 11 and self.removed_calls == 2:
        for x in self.rows:
            if x["id"] == 11:
                x["course_title"] = "Survey of Art (edited since the read)"


fake4.before_remove = _edit
code, out = run([d4, "--commit"], fake4)
rec4 = json.load(open(glob.glob(os.path.join(d4, "removed_*.json"))[0]))
check("⭐ a row changed since the read is left alone and reported",
      code == 1 and 11 in {r["id"] for r in fake4.rows} and rec4["not_removed_ids"] == [11],
      "the removal is guarded on the title as read")

# ── rollback puts them back, once ────────────────────────────────────────────
code, out = run([d3, "--rollback"], fake3)
back = {r["id"] for r in fake3.rows}
check("⭐ --rollback re-inserts every removed row", code == 0 and {10, 11, 12} <= back, out)
restored = {r["id"]: r for r in fake3.rows}
check("the re-inserted row is the image, not a repair",
      restored[10]["course_title"] == GARBLED[0]["course_title"] and restored[10]["synced_at"] == GARBLED[0]["synced_at"])
code, out = run([d3, "--rollback"], fake3)
check("a second rollback inserts nothing", '"reinserted": 0' in out and len(fake3.rows) == len(TABLE), out)

# ── the real client sends the guards ─────────────────────────────────────────
# FakeRest applies the title guard itself, so these checks read what Rest puts on
# the wire: a removal that dropped its title filter would pass every check above.
calls = []


class Wire(app.Rest):
    def _call(self, method, params, body=None, prefer=None, rng=None):
        calls.append((method, dict(params), prefer, rng))
        return []


w = Wire("https://example.invalid", "k")
w.remove(GARBLED[0])
m, p, prefer, _ = calls[-1]
check("⭐ a removal is guarded on the id AND the title as read",
      m == "DELETE" and p.get("id") == "eq.10"
      and p.get("course_title") == "eq." + GARBLED[0]["course_title"]
      and prefer == "return=representation", str(calls[-1]))
w.siblings(GARBLED[0])
m, p, _, _ = calls[-1]
check("a sibling read matches the whole key and excludes the row itself",
      m == "GET" and p.get("id") == "neq.10" and p.get("college") == "eq.Sample College"
      and p.get("subject") == "eq.ENGL" and p.get("course_number") == "eq.47", str(p))
w.candidates()
m, p, _, rng = calls[-1]
check("the candidate read is ordered and Range-paginated (Rule 10b)",
      m == "GET" and p.get("order") == "id.asc" and rng == "0-999"
      and all(("like.*%s*" % mk) in p.get("or", "") for mk in app.LEAD_MARKS), str(p))
w.insert([GARBLED[0]])
check("a rollback insert sends the full image, id included",
      calls[-1][0] == "POST" and calls[-1][2] == "return=representation")
# title_norm is a GENERATED column since 2026-09-30 (chatbox/supabase_program_
# typical_courses.sql). A DELETE's representation carries it into the receipt,
# and an INSERT naming it fails, so the rollback image is built from COLS alone.
check("the rollback image never names the generated title_norm column",
      "title_norm" not in app.COLS)

# ── a transient failure is retried; a real one is not ────────────────────────
# ⚠️ MEASURED, NOT IMAGINED: the first commit run (2026-09-27) died on one
# "Connection reset by peer" among some 800 requests, before its first write.
import urllib.error  # noqa: E402


class Flaky(app.Rest):
    """_send answers from a script: an exception instance is raised, anything else returned."""

    def __init__(self, script):
        super().__init__("https://example.invalid", "k", sleep=lambda s: None)
        self.script, self.sent = list(script), []

    def _send(self, method, params, body=None, prefer=None, rng=None):
        self.sent.append((method, dict(params)))
        nxt = self.script.pop(0)
        if isinstance(nxt, BaseException):
            raise nxt
        return nxt


reset = urllib.error.URLError(ConnectionResetError(104, "Connection reset by peer"))
f = Flaky([reset, [{"id": 1}]])
check("⭐ a reset connection is retried, and the answer comes back",
      f._call("GET", {}) == [{"id": 1}] and f.retried and len(f.sent) == 2)
f = Flaky([urllib.error.HTTPError("u", 400, "bad request", {}, None)])
try:
    f._call("GET", {})
    raised = False
except urllib.error.HTTPError:
    raised = True
except Exception:  # a retried 400 runs the script dry; report it as a failure, not a crash
    raised = False
check("a 400 from PostgREST fails at once, unretried", raised and len(f.sent) == 1)
f = Flaky([reset] * app.ATTEMPTS)
try:
    f._call("GET", {})
    raised = False
except urllib.error.URLError:
    raised = True
check("a failure that persists gives up after the last attempt",
      raised and len(f.sent) == app.ATTEMPTS)

f = Flaky([reset, [], []])
check("⭐ a retried delete that finds nothing, and a row already gone, counts as removed",
      f.remove(GARBLED[0]) == [GARBLED[0]] and f.sent[-1][0] == "GET",
      "the first attempt removed the row and its answer was lost; the receipt must say removed")
f = Flaky([reset, [], [{"id": 10}]])
check("a retried delete that finds nothing, with the row still there, counts as not removed",
      f.remove(GARBLED[0]) == [])
f = Flaky([[]])
check("an unretried delete that finds nothing asks nothing more",
      f.remove(GARBLED[0]) == [] and len(f.sent) == 1)

# ── the committed plan is the reviewed one ───────────────────────────────────
plans = glob.glob(os.path.join(ROOT, "kb", "course_title_cleanup_out", "*", "plan.json"))
check("the committed plan exists", bool(plans))
for p in plans:
    pl = json.load(open(p, encoding="utf-8"))
    check("plan %s names the table and a full fingerprint" % os.path.relpath(p, ROOT),
          pl.get("table") == app.TABLE and set(pl.get("expected", {})) ==
          {"count", "id_sum", "id_min", "id_max", "ids_sha256"})

passed = 0
for name, ok, why in results:
    print(f"{'  ok' if ok else 'FAIL'}  {name}" + ("" if ok else f"  — {why}"))
    passed += ok
print(f"\n{passed}/{len(results)} checks passed")
sys.exit(0 if passed == len(results) else 1)
