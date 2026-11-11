#!/usr/bin/env python3
"""Guards kb/_cer_decision_apply.py's undo against a lost response, a died run, and two rollbacks out of order.

The S639 review held to 9 (PR #3123) found the undo built from each write's echo. Rest._call retries a request whose
response was lost, and the retry echoes nothing for a write that landed: an insert under ignore-duplicates finds its
own row, a guarded PATCH or DELETE no longer matches. So a reinstate, an insert, a replace and a retire that all
committed were filed as skipped or missed, and --rollback, reading those lists, left them in place. These checks pin:
  1. after the writes, the receipt classifies each planned row by a fresh read, never by the echo (all four paths);
  2. --rollback works from the receipt's planned lists, guarded by the live value and reviewer (and stamp where
     named): a row a person saved since stays and is reported; a lost-response step during the rollback is read
     back, not mislabeled;
  3. the receipt is `pending` with the planned lists before the first write; a run that dies part-way rolls back,
     and a re-run after it writes a fresh receipt;
  4. a while_emptied commit runs only on origin/main's kb/unified_titles.json, and the dry run says it reads the
     committed map;
  5. rolling back the restore after rolling back the plan that retired its rows leaves the rows that rollback wants.

The fake is PostgREST, not the applier's logic: it subclasses the real client (app.Rest) and answers its one network
call (_send) by applying the request's own filters strictly (eq., with timestamps compared as instants the way
timestamptz is, and like.<prefix>*; any other operator fails the test), so a guard the applier dropped would
over-write here too. No network. Run from repo root:
    python3 tests/cer_decision_apply_retry_test.py
"""
import glob
import json
import os
import shutil
import socket
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _cer_decision_apply as app  # noqa: E402

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


P = "_CREDENTIAL_REVIEW::"
SAM, MAP = "slee@cccco.edu", "map@rccd.edu"
COHORT = "cer-s639@bot"
STAMP_COLS = ("reviewed_at", "validated_at")


class Boom(Exception):
    pass


class Row(dict):
    def __missing__(self, k):
        return None


class FakePostgrest(app.Rest):
    """kb_curation behind PostgREST, unique on (course_id, field). `lose` names the methods whose next request
    commits and then loses its response (a socket timeout the client retries); `die_on` names a method whose next
    request raises before it commits (a run that dies there)."""

    def __init__(self, rows=()):
        super().__init__("http://fake.invalid", "k", sleep=lambda s: None)
        self.rows = [self._norm(r) for r in rows]
        self.lose, self.die_on = set(), set()
        self.calls = []

    @staticmethod
    def _norm(r):
        r = dict(r)
        for c in STAMP_COLS:
            if r.get(c):
                r[c] = app._instant(r[c]).isoformat()
        return r

    @staticmethod
    def _match(row, params):
        for k, v in params.items():
            if k in ("select", "on_conflict"):
                continue
            have = row.get(k)
            if v.startswith("eq."):
                want = v[3:]
                if k in STAMP_COLS:
                    if app._instant(have) is None or app._instant(have) != app._instant(want):
                        return False
                elif have != want:
                    return False
            elif v.startswith("like.") and v.endswith("*") and "*" not in v[5:-1]:
                if not (have or "").startswith(v[5:-1]):
                    return False
            else:
                raise AssertionError("the fake does not know the filter %s=%s" % (k, v))
        return True

    def _send(self, method, params, body=None, prefer=None):
        self.calls.append(method)
        if method in self.die_on:
            self.die_on.discard(method)
            raise Boom("the run died at a %s" % method)
        if method == "GET":
            cols = params["select"].split(",")
            return [{c: r.get(c) for c in cols} for r in self.rows if self._match(r, params)]
        if method == "POST":
            assert params == {"on_conflict": "course_id,field"} and "ignore-duplicates" in (prefer or "")
            out = []
            for r in body:
                if any(x["course_id"] == r["course_id"] and x["field"] == r["field"] for x in self.rows):
                    continue
                row = self._norm(dict({"reviewed_at": "2026-11-12T01:00:00+00:00"}, **r))
                self.rows.append(row)
                out.append(dict(row))
        elif method == "PATCH":
            hit = [r for r in self.rows if self._match(r, params)]
            for r in hit:
                r.update(self._norm(body))
            out = [dict(r) for r in hit]
        elif method == "DELETE":
            hit = [r for r in self.rows if self._match(r, params)]
            self.rows = [r for r in self.rows if r not in hit]
            out = [dict(r) for r in hit]
        else:
            raise AssertionError("unexpected method %s" % method)
        if method in self.lose:
            self.lose.discard(method)
            raise socket.timeout("timed out after the server committed")
        return out

    def at(self, cid, field):
        """The live row at the key, or an empty (falsy) one whose every column reads None."""
        hit = [r for r in self.rows if r["course_id"] == cid and r["field"] == field]
        return Row(hit[0] if hit else {})


tmp = tempfile.mkdtemp()
real = (app.REPO, app.RECEIPT_ROOT, app.UT_PATH, getattr(app, "ut_matches_main", None))
app.REPO, app.RECEIPT_ROOT = tmp, os.path.join(tmp, "kb", "cer_decisions_out")
app.UT_PATH = os.path.join(tmp, "kb", "unified_titles.json")
os.makedirs(app.RECEIPT_ROOT)
with open(app.UT_PATH, "w", encoding="utf-8") as fh:
    json.dump({"HVAC NC": {"unified_title": "Heating and Air Conditioning (ASE A7 standards)"}}, fh)
app.ut_matches_main = lambda: (True, "")
N = [0]


def plan_dir(plan, name=None):
    N[0] += 1
    d = os.path.join(app.RECEIPT_ROOT, name or "2026-11-%02d" % N[0])
    os.makedirs(d)
    with open(os.path.join(d, "plan.json"), "w", encoding="utf-8") as fh:
        json.dump(plan, fh)
    return d


def run(d, mode, rest):
    lines = []
    try:
        code = app.run(d, mode, rest, out=lines.append)
    except Boom as e:
        code = "died: %s" % e
    return code, lines


def receipts(d, kind="applied"):
    return [json.load(open(p, encoding="utf-8")) for p in sorted(glob.glob(os.path.join(d, kind + "_*.json")))]


def has(lines, text):
    return any(text in line for line in lines)


HAC = P + "Heating and Air Conditioning"
BRK = P + "Automotive Braking Systems"
SAM_ISSUER = {"course_id": HAC, "field": "issuing_agency_override",
              "value": "California Community College Chancellor's Office", "reviewer_email": SAM,
              "reviewed_at": "2026-11-11T15:47:58.805608+00:00"}
SAM_FOLD = {"course_id": BRK, "field": "unified_title_override", "value": "Brakes (ASE A5 standards)",
            "reviewer_email": SAM, "reviewed_at": "2026-11-11T15:26:54.029+00:00"}
MAP_ISSUER = {"course_id": BRK, "field": "issuing_agency_override", "value": "ASE", "reviewer_email": MAP,
              "reviewed_at": "2026-07-09T00:07:00+00:00"}
OTHER = {"course_id": P + "Other", "field": "unified_title_override", "value": "Z", "reviewer_email": "c@rccd.edu",
         "reviewed_at": "2026-11-01T00:00:00+00:00"}


def retire_plan(*rows):
    return {"ruling": "phase 1 (test)", "cohort": "cer-s638@bot", "rows": [],
            "ruling_allows_retire_of_saved_rows": "test ruling", "retires": [dict(r) for r in rows]}


def phase1(*rows, lose=()):
    """A committed phase 1 that retired these person rows: its folder and the live table after it."""
    rest = FakePostgrest(list(rows) + [OTHER])
    d = plan_dir(retire_plan(*rows))
    rest.lose |= set(lose)
    code, lines = run(d, "commit", rest)
    return d, rest, code, lines


def restore_plan(p1, *rows, **extra):
    rel = os.path.relpath(glob.glob(os.path.join(p1, "applied_*.json"))[0], tmp).replace(os.sep, "/")
    return {"ruling": "restore (test)", "cohort": COHORT, "rows": [],
            "reinstates": [dict(r, from_receipt=rel, validated_at=None, validated_by=None, **extra) for r in rows]}


# ── 1c. a retried DELETE: the retire landed, the echo is [] ──────────────────
p1, rest, code, lines = phase1(SAM_ISSUER, SAM_FOLD, lose={"DELETE"})
rec = receipts(p1)[0]
check("a retire whose DELETE response was lost is filed retired, not missed",
      code == 0 and len(rec["retired"]) == 2 and rec["retire_missed"] == [] and rec["result"] == "written", lines)
code, lines = run(p1, "rollback", rest)
check("its rollback reinstates both person rows under their own reviewer and stamp",
      code == 0 and rest.at(HAC, SAM_ISSUER["field"])["reviewer_email"] == SAM
      and app._instant(rest.at(BRK, SAM_FOLD["field"])["reviewed_at"]) == app._instant(SAM_FOLD["reviewed_at"])
      and has(lines, "2 retired rows reinstated, 0 taken since"), lines)

# ── 2. a lost response on the rollback's own re-insert is read back, not mislabeled taken_since ──
p1, rest, code, _ = phase1(SAM_ISSUER)
rest.lose.add("POST")
code, lines = run(p1, "rollback", rest)
check("a rollback re-insert whose response was lost reads back reinstated, not taken since",
      code == 0 and bool(rest.at(HAC, SAM_ISSUER["field"]))
      and has(lines, "1 retired rows reinstated, 0 taken since"), lines)
# a person's row written at the key since the retire stays, reported taken since
p1, rest, code, _ = phase1(SAM_ISSUER)
rest.rows.append(rest._norm(dict(SAM_ISSUER, value="ASE", reviewed_at="2026-11-12T09:00:00Z")))
code, lines = run(p1, "rollback", rest)
check("a row a person saved at the key since the retire stays, reported taken since",
      rest.at(HAC, SAM_ISSUER["field"])["value"] == "ASE" and has(lines, "0 retired rows reinstated, 1 taken since"),
      lines)

# ── 1a. a retried reinstate POST: all 13 would have been filed skipped ───────
p1, rest, code, _ = phase1(SAM_ISSUER, SAM_FOLD, MAP_ISSUER)
p4 = plan_dir(restore_plan(p1, SAM_ISSUER, SAM_FOLD, MAP_ISSUER))
rest.lose.add("POST")
code, lines = run(p4, "commit", rest)
rec = receipts(p4)[0]
check("a reinstate whose POST response was lost is filed put back (3), none skipped, and reads back written",
      code == 0 and len(rec["put_back"]) == 3 and rec["put_back_skipped"] == [] and rec["result"] == "written"
      and has(lines, "3 reinstated, 0 reinstate skipped"), lines)
rest.rows.append(rest._norm(dict(OTHER, course_id=P + "Late", reviewer_email=SAM)))
for r in rest.rows:  # Sam saves the restored fold again: that save is his, and the undo leaves it
    if r["course_id"] == BRK and r["field"] == SAM_FOLD["field"]:
        r["reviewed_at"] = "2026-11-12T09:00:00+00:00"
rest.lose.add("DELETE")
code, lines = run(p4, "rollback", rest)
check("its rollback removes exactly the rows still as put back (a lost DELETE response read back), and leaves "
      "the row Sam saved again",
      code == 0 and not rest.at(HAC, SAM_ISSUER["field"]) and not rest.at(BRK, MAP_ISSUER["field"])
      and str(rest.at(BRK, SAM_FOLD["field"])["reviewed_at"]).startswith("2026-11-12T09")
      and has(lines, "2 reinstated rows removed again, 1 saved again since and left"), lines)
check("the rollback leaves every row it did not write", bool(rest.at(P + "Other", OTHER["field"]))
      and bool(rest.at(P + "Late", OTHER["field"])))

# ── 1b. a retried cohort INSERT: the rows were filed skipped_as_duplicate ────
ins = {"ruling": "insert (test)", "cohort": "exhibits-s0@bot", "rows": [
    {"course_id": P + "Old A", "field": "unified_title_override", "value": "New A"},
    {"course_id": P + "Old B", "field": "unified_title_override", "value": "New B"}]}
rest = FakePostgrest([OTHER])
d = plan_dir(ins)
rest.lose.add("POST")
code, lines = run(d, "commit", rest)
rec = receipts(d)[0]
check("an insert whose POST response was lost is filed inserted (2), none skipped as duplicate",
      code == 0 and len(rec["inserted"]) == 2 and rec["skipped_as_duplicate"] == [], lines)
for r in rest.rows:  # a curator replaces one cohort row since: it is theirs now
    if r["course_id"] == P + "Old B":
        r.update(value="New B by hand", reviewer_email="c@rccd.edu")
code, lines = run(d, "rollback", rest)
check("its rollback removes the cohort row still as written and leaves the curator's",
      code == 0 and not rest.at(P + "Old A", "unified_title_override")
      and rest.at(P + "Old B", "unified_title_override")["value"] == "New B by hand"
      and has(lines, "1 removed, 1 already gone"), lines)

# ── 1d. a retried guarded PATCH: the swap was filed replace_missed ───────────
CUR = {"course_id": "_UNCLASSIFIED::OSHA 10", "field": "issuing_agency_assignment", "value": "OSHA Training Institute",
       "reviewer_email": "c@rccd.edu", "reviewed_at": "2026-10-01T00:00:00+00:00"}
rep = {"ruling": "replace (test)", "cohort": "exhibits-s0@bot", "rows": [
    {"course_id": CUR["course_id"], "field": CUR["field"], "value": "Occupational Safety and Health Administration",
     "replaces": {"value": CUR["value"], "reviewer_email": CUR["reviewer_email"]}}]}
rest = FakePostgrest([CUR])
d = plan_dir(rep)
rest.lose.add("PATCH")
code, lines = run(d, "commit", rest)
rec = receipts(d)[0]
check("a replace whose PATCH response was lost is filed replaced, not missed",
      code == 0 and len(rec["replaced"]) == 1 and rec["replace_missed"] == [], lines)
rest.lose.add("PATCH")
code, lines = run(d, "rollback", rest)
now = rest.at(CUR["course_id"], CUR["field"])
check("its rollback restores the curator's before-value, reviewer and date (a lost PATCH response read back)",
      code == 0 and now["value"] == CUR["value"] and now["reviewer_email"] == CUR["reviewer_email"]
      and app._instant(now["reviewed_at"]) == app._instant(CUR["reviewed_at"]) and has(lines, "1 restored"), lines)

# ── 3. a run that dies between a write and the receipt rewrite ───────────────
both = dict(ins, rows=ins["rows"] + rep["rows"])
rest = FakePostgrest([CUR, OTHER])
d = plan_dir(both)
rest.die_on.add("PATCH")
code, lines = run(d, "commit", rest)
recs = receipts(d)
check("a run that dies at the PATCH leaves a pending receipt naming everything it planned",
      str(code).startswith("died") and len(recs) == 1 and recs[0]["result"] == "pending"
      and len(recs[0]["rows"]) == 2 and len(recs[0]["replaces"]) == 1, (code, recs and recs[0].get("result")))
code, lines = run(d, "commit", rest)
recs = receipts(d)
check("a re-run after the died run writes a fresh receipt and settles",
      code == 0 and len(recs) == 2 and recs[0]["result"] == "pending" and recs[1]["result"] == "written"
      and len(recs[1]["replaced"]) == 1 and recs[1]["rows"] == [], lines)
code, lines = run(d, "rollback", rest)
check("rollback reads the pending receipt too: both cohort rows go and the curator's value comes back",
      code == 0 and not [r for r in rest.rows if r["reviewer_email"] == "exhibits-s0@bot"]
      and rest.at(CUR["course_id"], CUR["field"])["value"] == CUR["value"]
      and bool(rest.at(P + "Other", OTHER["field"])), lines)
rest = FakePostgrest([OTHER])
d = plan_dir(ins)
orig = app.check


def check_then_die(plan, r, ut=None):  # the run dies at its read-back, after every write landed
    if "POST" in r.calls:
        raise Boom("the read-back died")
    return orig(plan, r, ut)


app.check = check_then_die
try:
    code, lines = run(d, "commit", rest)
finally:
    app.check = orig
recs = receipts(d)
code2, lines2 = run(d, "rollback", rest)
check("a run that dies at its read-back rolls back every row it wrote",
      str(code).startswith("died") and recs[0]["result"] == "pending" and code2 == 0
      and not [r for r in rest.rows if r["reviewer_email"] == "exhibits-s0@bot"], lines2)

# ── 4. while_emptied reads the committed map: main's head of it, and the dry run says so ──
with open(app.UT_PATH, "w", encoding="utf-8") as fh:
    json.dump({"HVAC NC": {"unified_title": "Heating and Air Conditioning (ASE A7 standards)"}}, fh)
p1, rest, code, _ = phase1(SAM_ISSUER)
p4 = plan_dir(restore_plan(p1, SAM_ISSUER, while_emptied=True))
code, lines = run(p4, "dry-run", rest)
check("a while_emptied dry run says the reinstate waits on the committed map",
      code == 0 and has(lines, "1 to reinstate, 0 already reinstated; a reinstate is held until the committed "
                               "kb/unified_titles.json shows its title empty"), lines)
app.ut_matches_main = lambda: (False, "kb/unified_titles.json here (abc) is not origin/main's current one (def)")
code, lines = run(p4, "commit", rest)
check("a while_emptied commit on a checkout that is not main's head of the map is refused; nothing written",
      code == 1 and has(lines, "REFUSED") and not receipts(p4) and not rest.at(HAC, SAM_ISSUER["field"]), lines)
app.ut_matches_main = real[3]
ok, why = app.ut_matches_main() if real[3] else (None, "no main-head check")
check("the main-head check fails closed where it cannot read origin/main", ok is False and why, why)
app.ut_matches_main = lambda: (True, "")
with open(app.UT_PATH, "w", encoding="utf-8") as fh:
    json.dump({"HVAC NC": {"unified_title": "Heating and Air Conditioning"}}, fh)
code, lines = run(p4, "dry-run", rest)
check("while a committed raw maps to the title, the dry run holds it and names the committed map",
      code == 1 and has(lines, "held until the committed map shows the title empty"), lines)

# ── 5. two rollbacks out of order: the restore's undo leaves what phase 1's undo wants back ──
for first in ("phase 1", "restore"):
    with open(app.UT_PATH, "w", encoding="utf-8") as fh:
        json.dump({}, fh)
    p1, rest, code, _ = phase1(SAM_ISSUER, SAM_FOLD)
    p4 = plan_dir(restore_plan(p1, SAM_ISSUER, SAM_FOLD))
    run(p4, "commit", rest)
    order = (p1, p4) if first == "phase 1" else (p4, p1)
    outs = [run(x, "rollback", rest) for x in order]
    check("rolling back %s first, then the other, leaves both of Sam's rows as phase 1 found them" % first,
          all(c == 0 for c, _ in outs) and bool(rest.at(HAC, SAM_ISSUER["field"]))
          and bool(rest.at(BRK, SAM_FOLD["field"]))
          and all(app._instant(rest.at(x["course_id"], x["field"])["reviewed_at"]) == app._instant(x["reviewed_at"])
                  for x in (SAM_ISSUER, SAM_FOLD)), [l for _, ls in outs for l in ls])
    if first == "phase 1":
        check("the restore's rollback names the rows it left for phase 1's",
              has(outs[1][1], "2 left for a later rollback that put them back")
              and len(receipts(p4, "rolled_back")[0]["reinstates_left_for_a_later_rollback"]) == 2, outs[1][1])

app.REPO, app.RECEIPT_ROOT, app.UT_PATH, app.ut_matches_main = real
shutil.rmtree(tmp)

passed = 0
for name, ok, why in results:
    print(f"{'  ok' if ok else 'FAIL'}  {name}" + ("" if ok else f"  — {why}"))
    passed += ok
print(f"\n{passed}/{len(results)} passed")
sys.exit(0 if passed == len(results) else 1)
