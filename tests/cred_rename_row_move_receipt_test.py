#!/usr/bin/env python3
"""The credential rename's kb_curation row move files what landed from a fresh read, and its undo works from the
planned moves, never from a write's echo (S639 review of #3127).

The failure modes, each run through the REAL clients (kb/_cred_rename_apply_supabase.py and kb/_cred_rename_undo.py)
over a PostgREST-level fake that applies each request's own filters, unique on (course_id, field):
  1. a PATCH that commits and loses its response is filed as landed (the row sits at the new key with the same field,
     value, reviewer and save time), and the undo moves it back;
  2. every planned move, with its before_row, is in the log BEFORE the first write;
  3. a run that dies part-way, then a rerun: the rerun carries what landed, plans what did not, and writes a complete
     log; the undo from the logs puts every row back, each move reversed once;
  4. a family tag the rename moved goes back to the old title with the undo; Sam's fold rows into the family title
     never move.

No network. Run from the repo root: python3 tests/cred_rename_row_move_receipt_test.py
"""
import contextlib
import io
import json
import os
import shutil
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _cred_rename_apply_supabase as sup  # noqa: E402
import _cred_rename_undo as undo  # noqa: E402

CHECKS = []


def check(name, cond, why=""):
    CHECKS.append((name, bool(cond), why))


P = "_CREDENTIAL_REVIEW::"
FAM = "ASE Certificate Bundles"
SAM, MAP, BOT = "slee@cccco.edu", "map@rccd.edu", "credential-family-s638@bot"
COLS = ("course_id", "field", "value", "reviewer_email", "reviewed_at", "validated_at", "validated_by")


class Killed(BaseException):
    """The runner stopped mid-run (not an Exception: the client's own handlers do not catch it)."""


class Resp:
    def __init__(self, body, status=200):
        self.body, self.status = json.dumps(body).encode("utf-8"), status

    def read(self, *a):
        return self.body

    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False


class FakePostgrest:
    """kb_curation behind PostgREST. lose: {(method, n)} commits the n-th such request and raises as a lost response;
    kill_at: (method, n) raises Killed before the n-th such request; before_write: a function run before each write."""

    def __init__(self, rows):
        self.rows = [dict({c: None for c in COLS}, **r) for r in rows]
        self.n = {}
        self.lose, self.kill_at, self.before_write = set(), None, None

    @staticmethod
    def _match(row, params):
        for k, v in params.items():
            if k in ("select", "order", "on_conflict"):
                continue
            have = row.get(k)
            if v == "is.null":
                ok = have is None
            elif v.startswith("eq."):
                ok = have == v[3:]
            elif v.startswith("like.") and v.endswith("%") and "%" not in v[5:-1]:
                ok = (have or "").startswith(v[5:-1])
            else:
                raise AssertionError("the fake does not know the filter %s=%s" % (k, v))
            if not ok:
                return False
        return True

    def urlopen(self, req, timeout=None):
        method = req.get_method()
        url = urllib.parse.urlsplit(req.full_url)
        assert url.path.endswith("/rest/v1/kb_curation"), url.path
        params = dict(urllib.parse.parse_qsl(url.query, keep_blank_values=True))
        body = json.loads(req.data.decode("utf-8")) if req.data else None
        self.n[method] = self.n.get(method, 0) + 1
        if self.kill_at == (method, self.n[method]):
            raise Killed("runner stopped")
        if method != "GET" and self.before_write:
            self.before_write(self, method)
        out = self._do(method, params, body, {k.lower(): v for k, v in req.header_items()})
        if (method, self.n[method]) in self.lose:
            raise urllib.error.URLError("the response was lost after the server committed")
        return Resp(out)

    def _do(self, method, params, body, headers):
        if method == "GET":
            hit = [r for r in self.rows if self._match(r, params)]
            hit.sort(key=lambda r: (r["course_id"], r["field"]))
            rng = headers.get("range")
            if rng:
                a, b = (int(x) for x in rng.split("-"))
                hit = hit[a:b + 1]
            cols = params.get("select", ",".join(COLS)).split(",")
            return [{c: r.get(c) for c in cols} for r in hit]
        if method == "DELETE":
            hit = [r for r in self.rows if self._match(r, params)]
            self.rows = [r for r in self.rows if r not in hit]
            return [dict(r) for r in hit]
        if method == "PATCH":
            hit = [r for r in self.rows if self._match(r, params)]
            for r in hit:
                new = dict(r, **body)
                if any(x is not r and (x["course_id"], x["field"]) == (new["course_id"], new["field"]) for x in self.rows):
                    raise urllib.error.HTTPError("http://fake", 409, "Conflict", {}, io.BytesIO(b"{}"))
            for r in hit:
                r.update(body)
            return [dict(r) for r in hit]
        if method == "POST":
            rows = body if isinstance(body, list) else [body]
            out = []
            for r in rows:
                if any((x["course_id"], x["field"]) == (r["course_id"], r["field"]) for x in self.rows):
                    continue
                self.rows.append(dict({c: None for c in COLS}, **r))
                out.append(dict(r))
            return out
        raise AssertionError(method)


def state(rows):
    return sorted(json.dumps({c: r.get(c) for c in COLS}, sort_keys=True) for r in rows)


OLD, NEW = "ASE Bundle — A4, A5", FAM + ": A4 + A5"
SIB, LEAD_NEW = "ASE Bundle — T5, T8", FAM + ": T5 + T8"
SEED = [
    # Sam's fold into the family title on each member: a family tag, kept in place by the move.
    {"course_id": P + OLD, "field": "unified_title_override", "value": FAM, "reviewer_email": SAM,
     "reviewed_at": "2026-11-11T15:26:55.029+00:00"},
    {"course_id": P + OLD, "field": "unified_title_merge_confirm", "value": FAM, "reviewer_email": SAM,
     "reviewed_at": "2026-11-11T15:26:55.029+00:00"},
    {"course_id": P + OLD, "field": "credential_family", "value": FAM, "reviewer_email": BOT,
     "reviewed_at": "2026-11-11T23:38:21+00:00"},
    {"course_id": P + OLD, "field": "issuing_agency_override", "value": "ASE", "reviewer_email": MAP,
     "reviewed_at": "2026-07-09T00:07:00+00:00"},
    # A second title: its own fulfilled rename row and an issuer row.
    {"course_id": P + SIB, "field": "unified_title_override", "value": LEAD_NEW, "reviewer_email": SAM,
     "reviewed_at": "2026-11-11T16:00:00+00:00"},
    {"course_id": P + SIB, "field": "quality_flag_override", "value": "ok", "reviewer_email": MAP,
     "reviewed_at": "2026-07-09T00:08:00+00:00"},
    {"course_id": P + SIB, "field": "credential_family", "value": FAM, "reviewer_email": BOT,
     "reviewed_at": "2026-11-11T23:38:21+00:00"},
]


class Env:
    def __init__(self):
        self.dir = tempfile.mkdtemp()
        self.snap = os.path.join(self.dir, "2026-11-12")
        os.makedirs(self.snap)
        json.dump({"renames": {OLD: NEW, SIB: LEAD_NEW}, "merges": {}, "_applied_at": "2026-11-12T00:00:00Z"},
                  open(os.path.join(self.snap, "alias_map.json"), "w"))
        self.db = FakePostgrest(SEED)
        self.real = (sup.OUT_ROOT, sup.KEY, undo.KEY, urllib.request.urlopen)
        sup.OUT_ROOT, sup.KEY, undo.KEY = self.dir, "k", "k"
        urllib.request.urlopen = self.db.urlopen

    def run_move(self):
        try:
            with contextlib.redirect_stdout(io.StringIO()):
                sup.main()
            return 0
        except SystemExit as e:
            return e.code
        except Killed:
            return "killed"

    def logs(self):
        return undo._logs(self.snap, "supabase_log")

    def run_undo(self):
        ops, cannot = undo.supabase_ops(self.logs())
        return undo.run_supabase(ops), cannot

    def close(self):
        sup.OUT_ROOT, sup.KEY, undo.KEY, urllib.request.urlopen = self.real
        shutil.rmtree(self.dir, ignore_errors=True)


# ── 1 and 2. a lost response, and the receipt before the first write ─────────────────────────────────────
env = Env()
try:
    start = state(env.db.rows)
    seen_pending = []

    def look(db, method):
        if not seen_pending:
            got = env.logs()
            seen_pending.append(got[-1] if got else None)

    env.db.before_write = look
    env.db.lose = {("PATCH", 1)}          # the first move commits and its response is lost
    code = env.run_move()
    pend = seen_pending[0] or {}
    planned = [e for e in pend.get("log") or [] if e.get("op") in ("patch", "delete")]
    check("before the first write the log names every planned move with its before_row",
          pend.get("_state") == "pending" and len(planned) == 5
          and all(e.get("before_row") and e.get("status") == "planned" for e in planned), pend.get("_state"))
    log = env.logs()[-1]
    lost = [e for e in log["log"] if e.get("op") == "patch" and e.get("echo_status") == "fail"]
    check("the move whose response was lost is filed as landed from the fresh read",
          code == 0 and len(lost) == 1 and lost[0]["filed"] == "landed" and lost[0]["status"] == "ok", log.get("fail"))
    check("the family tag moved to the new title with the rename",
          any(r["course_id"] == P + NEW and r["field"] == "credential_family" for r in env.db.rows))
    check("Sam's fold rows into the family title stay where they were",
          sum(1 for r in env.db.rows if r["course_id"] == P + OLD and r["reviewer_email"] == SAM) == 2)
    res, cannot = env.run_undo()
    check("the undo moves every row back, the lost-response move included, and puts the fulfilled rename row back",
          state(env.db.rows) == start and not cannot and all(x["status"] in ("ok", "already") for x in res),
          [x for x in res if x["status"] not in ("ok", "already")])
finally:
    env.close()

# ── 3. a run that dies part-way, then a rerun ────────────────────────────────────────────────────────────
env = Env()
try:
    start = state(env.db.rows)
    env.db.kill_at = ("PATCH", 2)          # dies before the second move
    first = env.run_move()
    after_first = env.logs()
    check("the run that died left its pending log on disk", first == "killed" and len(after_first) == 1
          and after_first[0].get("_state") == "pending")
    env.db.kill_at = None
    env.db.lose = {("PATCH", 3)}          # and the rerun's first move loses its response too
    code = env.run_move()
    logs = env.logs()
    newest = logs[-1]
    landed = {(e["op"], e.get("course_id") or e.get("old_course_id"), e["field"])
              for e in newest["log"] if e.get("filed") == "landed"}
    check("the rerun writes a complete, filed log: what the first run moved is carried, the rest is moved now",
          code == 0 and len(logs) == 2 and newest.get("_state") == "filed" and newest.get("carried", 0) >= 1
          and len(landed) == 5 and newest.get("fail") == 0, (code, newest.get("fail"), sorted(landed)))
    res, cannot = env.run_undo()
    oks = [x for x in res if x["status"] == "ok"]
    check("the undo from both logs puts every row back, reversing each move once",
          state(env.db.rows) == start and len(oks) == 5 and not cannot, (len(oks), [x["status"] for x in res]))
    sql, _ = undo.supabase_plan(logs)
    check("the SQL reversal names each move once and never a fold row of Sam's",
          sql.count("update kb_curation set course_id") == 4 and "'unified_title_merge_confirm'" not in sql)
finally:
    env.close()

failed = [(n, w) for n, ok, w in CHECKS if not ok]
for n, ok, w in CHECKS:
    print(("PASS  " if ok else "FAIL  ") + n + ("" if ok or not w else "  -- %s" % (w,)))
print(f"\n{len(CHECKS) - len(failed)}/{len(CHECKS)} passed")
sys.exit(1 if failed else 0)
