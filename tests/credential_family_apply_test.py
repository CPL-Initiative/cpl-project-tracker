#!/usr/bin/env python3
"""Guards kb/_family_tag_apply.py, the reviewed write of the credential family tags (Sam, 2026-11-11, cpl_memory
sam-bundle-family-is-a-field-2026-11-11: each ASE bundle stays its own title and gains the family).

kb_curation is the table Rule 10 protects, so these checks pin the failure modes the S639 review confirmed:
  1. the generator and the applier emit no SQL: no schema statement, no temporary table, only insert rows;
  2. a held title (the four Masters and the emptied title) emits nothing: 26 to write (24 bundles and, since Sheet 181,
     the two any-one-test members), 5 held;
  3. the gate is the SET: a swapped set with an equal count is refused; a conflict is refused; the dry run writes
     nothing and its hash survives the commit (written + to-write is the same set);
  4. the pending receipt exists before the INSERT; the commit refuses without one, or when the live rows changed;
  5. the undo never depends on the INSERT's echo: a POST that committed and was retried (echo []), an exception or a
     cancel after the insert, and a run that died before settling its receipt all roll back every cohort row;
  6. rollback removes only rows still under this cohort with the written value; a row a person changed since, before
     the rollback's read or between its read and its delete, stays and is reported; an abort still writes its receipt;
  7. the read is Range-paged in a stable order and survives a server page cap below PAGE; the read-back re-checks
     conflicts.

The fake is PostgREST, not the applier's logic: it subclasses the real client (app.Rest) and answers its one network
call (_open) by applying the request's own filters strictly (eq., like.<prefix>*, in.(...); any other operator fails
the test), so a delete that dropped a guard would over-delete here too. No network. Run from repo root:
    python3 tests/credential_family_apply_test.py
"""
import glob
import json
import os
import re
import shutil
import socket
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _family_tag_apply as app  # noqa: E402
import _family_tag_plan as ftp  # noqa: E402
import test_mix  # noqa: E402

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


P, FAM, COHORT = ftp.PREFIX, "ASE Certificate Bundles", ftp.CREDENTIAL_FAMILY_COHORT
receipt = json.load(open(os.path.join(ROOT, "kb", "receipts", "credential_family_2026-11-11_s638", "receipt.json"),
                         encoding="utf-8"))
# Sam's saved fold rows as the S638 read found them (the 31 titles), as kb_curation holds them.
FOLDS = [{k: r[k] for k in ("course_id", "field", "value", "reviewer_email", "reviewed_at")}
         for it in receipt["convert"] + receipt["held"] for r in it["rows"]]
OTHER = {"course_id": P + "ASE Bundle — A4, A5", "field": "issuing_agency_override",
         "value": "National Institute for Automotive Service Excellence (ASE)", "reviewer_email": "map@rccd.edu",
         "reviewed_at": "2026-07-09T00:07:00+00:00"}
C1G1 = "ASE C1 or G1 — Service Consultant or Auto Maintenance and Light Repair"
BASE = FOLDS + [OTHER]
# The applier reads the checked-out credential titles so a renamed member's old title reads as gone (Sheet 181's ruled
# renames leave Sam's fold rows on it). The committed file holds every title here; the swap below names a title it does
# not, so the read is pinned off for the gate checks and checked on its own.
_real_titles = app.current_titles()
check("the applier reads the committed credential titles, and they hold every title the S638 read found",
      _real_titles is not None and {x["course_id"][len(P):] for x in FOLDS} <= _real_titles)
check("a title missing from kb/credentials.json reads as gone and takes no tag",
      [it["title"] for it in ftp.plan(BASE, ftp.families(), _real_titles - {"ASE Bundle — A4, A5"})["gone"]]
      == ["ASE Bundle — A4, A5"])
app.current_titles = lambda path=None: None


class Boom(Exception):
    pass


class FakePostgrest(app.Rest):
    """kb_curation behind PostgREST, unique on (course_id, field). Hooks: `post_then_timeout` commits a POST and then
    raises a timeout (the client retries); `post_then_raise` commits a POST and then raises it; `gets_fail` makes
    every GET raise; `after_post` / `before_delete` run a function at that point; `delete_fails_at` raises on the Nth
    DELETE; `cap` is the server's page cap."""

    def __init__(self, rows, receipt_dir=None, cap=None):
        super().__init__("http://fake.invalid", "k", sleep=lambda s: None)
        self.rows = [dict(r) for r in rows]
        self.receipt_dir, self.cap = receipt_dir, cap
        self.posts, self.deletes, self.gets, self.ranged = 0, 0, 0, True
        self.receipt_before_post = None
        self.post_then_timeout = self.post_then_raise = self.gets_fail = False
        self.after_post = self.before_delete = None
        self.delete_fails_at = None

    @staticmethod
    def _match(row, params):
        for k, v in params.items():
            if k in ("select", "order", "on_conflict"):
                continue
            have = row.get(k)
            if v.startswith("eq."):
                if have != v[3:]:
                    return False
            elif v.startswith("like.") and v.endswith("*") and "*" not in v[5:-1]:
                if not (have or "").startswith(v[5:-1]):
                    return False
            elif v.startswith("in.(") and v.endswith(")"):
                if have not in v[4:-1].split(","):
                    return False
            else:
                raise AssertionError("the fake does not know the filter %s=%s" % (k, v))
        return True

    def _open(self, method, params, headers, body):
        assert app.RANGE not in params, "the Range key leaked into the query string"
        if method == "GET":
            self.gets += 1
            if self.gets_fail:
                raise Boom("read-back down")
            rng = headers.get("Range")
            if not rng or headers.get("Range-Unit") != "items":
                self.ranged = False
                raise AssertionError("a GET without a Range header")
            a, b = (int(x) for x in rng.split("-"))
            hit = [r for r in self.rows if self._match(r, params)]
            for col in reversed(params.get("order", "").split(",")):
                if col:
                    hit.sort(key=lambda r, c=col.split(".")[0]: r.get(c) or "")
            n = b - a + 1 if self.cap is None else min(b - a + 1, self.cap)
            cols = params["select"].split(",")
            return [{c: r.get(c) for c in cols} for r in hit[a:a + n]]
        if method == "POST":
            assert params == {"on_conflict": "course_id,field"} and "ignore-duplicates" in (headers.get("Prefer") or "")
            self.posts += 1
            if self.receipt_dir:
                self.receipt_before_post = bool(glob.glob(os.path.join(self.receipt_dir, "applied_*.json")))
            out = []
            for r in body:
                if any(x["course_id"] == r["course_id"] and x["field"] == r["field"] for x in self.rows):
                    continue
                self.rows.append(dict(r, reviewed_at="2026-11-12T00:00:00+00:00"))
                out.append(dict(r))
            if self.after_post:
                self.after_post(self)
            if self.post_then_timeout:
                self.post_then_timeout = False
                raise socket.timeout("timed out after the server committed")
            if self.post_then_raise:
                exc, self.post_then_raise = self.post_then_raise, False
                raise exc
            return out if "return=representation" in headers.get("Prefer", "") else []
        if method == "DELETE":
            self.deletes += 1
            if self.delete_fails_at == self.deletes:
                raise Boom("delete failed part-way")
            if self.before_delete:
                self.before_delete(self, params)
            hit = [r for r in self.rows if self._match(r, params)]
            self.rows = [r for r in self.rows if r not in hit]
            return [dict(r) for r in hit]
        raise AssertionError("unexpected method %s" % method)


def go(mode, rest, d, expect=None):
    lines = []
    code = app.run(mode, rest, out=lines.append, expect=expect, receipt_dir=d)
    return code, lines


def state(rows):
    return sorted(json.dumps(r, sort_keys=True, ensure_ascii=False) for r in rows)


def cohort_rows(rest):
    return [x for x in rest.rows if x.get("reviewer_email") == COHORT]


def receipts(d, kind="applied"):
    return [json.load(open(p, encoding="utf-8")) for p in sorted(glob.glob(os.path.join(d, kind + "_*.json")))]


def dry_hash(rows):
    lines = []
    app.run("dry-run", FakePostgrest(rows), out=lines.append)
    m = re.search(r"expect=([0-9a-f]{12})", lines[-1])
    return m.group(1) if m else None, lines


def committed(d, rows=BASE, **hooks):
    """A fake after prepare + commit with the given hooks; returns (rest, code, lines, error)."""
    r = FakePostgrest(rows, receipt_dir=d)
    h, _ = dry_hash(rows)
    go("prepare", r, d, expect=h)
    for k, v in hooks.items():
        setattr(r, k, v)
    err = None
    try:
        code, lines = go("commit", r, d, expect=h)
    except BaseException as e:  # noqa: BLE001
        code, lines, err = None, [], e
    r.gets_fail = False
    return r, code, lines, err


# ── 1. no SQL anywhere ──────────────────────────────────────────────────────
SCHEMA = re.compile(r"\b(create|drop|alter|truncate)\s+(temp(orary)?\s+)?(table|index|function|schema|view)\b|"
                    r"\bbegin\s*;|\bcommit\s*;", re.I)
for mod in (ftp, app):
    src = open(mod.__file__.replace(".pyc", ".py"), encoding="utf-8").read()
    check("%s holds no schema statement, no temporary table and no transaction" % os.path.basename(mod.__file__),
          not SCHEMA.search(src), SCHEMA.search(src).group(0) if SCHEMA.search(src) else "")

# ── 2. the plan: 26 to write, 5 held, each row one family tag ───────────────
p = ftp.plan(BASE, ftp.families())
tags, written, conflicts = ftp.tag_rows(p, BASE)
held = {h["title"] for h in p["held"]}
check("26 titles take a tag, 5 are held, no conflict", len(tags) == 26 and len(held) == 5 and not conflicts,
      (len(tags), len(held), conflicts))
check("ASE C1 or G1 is an any-one-test member and takes the tag (Sheet 181)", C1G1 not in held and C1G1 not in ftp.HOLD
      and any(t["course_id"] == P + C1G1 for t in tags))
check("a held title emits nothing", not any(t["course_id"][len(P):] in held for t in tags))
check("every emitted row is one family tag, three keys, nothing else",
      all(set(t) == {"course_id", "field", "value"} and t["field"] == "credential_family" and t["value"] == FAM
          for t in tags))

# ── 3. the dry run and the set gate ─────────────────────────────────────────
H, lines = dry_hash(BASE)
check("the dry run reports 26 to write, 5 held, 0 conflicts and the set hash to commit with",
      H and any("26 to write, 0 already written, 5 held for Sam, 0 conflicts; set %s (26 tags)" % H in l
                for l in lines), lines[-1:])
d = tempfile.mkdtemp()
try:
    r = FakePostgrest(BASE, receipt_dir=d)
    start = state(r.rows)
    go("dry-run", r, d)
    check("the dry run writes nothing and leaves no receipt, its reads Range-paged",
          r.posts == 0 and state(r.rows) == start and not os.listdir(d) and r.ranged and r.gets >= 1)
    for bad in (None, "24", H[:-1] + ("0" if H[-1] != "0" else "1")):
        code, lines = go("prepare", r, d, expect=bad)
        check("prepare refuses expect=%r and writes no receipt" % (bad,),
              code == 1 and r.posts == 0 and not os.listdir(d), lines[-1:])

    # A swapped set with an equal count: one converting title's rows move to another bundle title.
    first = tags[0]["course_id"]
    swap_title = "ASE Bundle — A1, A2, A3, A4, A5, A6, A7, A8, L1, T1"
    assert test_mix.from_title(swap_title) and P + swap_title not in {x["course_id"] for x in BASE}
    swapped = [dict(x, course_id=P + swap_title) if x["course_id"] == first else dict(x) for x in BASE]
    sh, slines = dry_hash(swapped)
    check("the swapped live set still gives 26 tags (the count gate would pass it)",
          any("26 to write" in l and "(26 tags)" in l for l in slines), slines[-1:])
    sw = FakePostgrest(swapped, receipt_dir=d)
    code, lines = go("prepare", sw, d, expect=H)
    check("prepare refuses a swapped set with an equal count", code == 1 and sh != H and not os.listdir(d), lines[-1:])
    code, lines = go("commit", sw, d, expect=H)
    check("commit refuses a swapped set with an equal count, and inserts nothing", code == 1 and sw.posts == 0)

    # Conflicts: a pending merge confirm naming a member as its target; a person's other family value.
    fight = FakePostgrest(BASE + [{"course_id": P + "ASE Bundle T2 T8", "field": "unified_title_merge_confirm",
                                   "value": "ASE Bundle — T2, T8", "reviewer_email": "slee@cccco.edu",
                                   "reviewed_at": "2026-11-12T00:00:00+00:00"}], receipt_dir=d)
    code, lines = go("prepare", fight, d, expect=H)
    check("a pending merge confirm naming a member as its target is a conflict, and nothing is written",
          code == 1 and fight.posts == 0 and any("CONFLICT" in l and "ASE Bundle — T2, T8" in l for l in lines))
    other = FakePostgrest(BASE + [{"course_id": P + "ASE Bundle — T5, T8", "field": "credential_family",
                                   "value": "Other", "reviewer_email": "slee@cccco.edu",
                                   "reviewed_at": "2026-11-12T00:00:00+00:00"}], receipt_dir=d)
    code, lines = go("prepare", other, d, expect=H)
    check("a member whose family row a person set to another value is a conflict", code == 1 and other.posts == 0)

    # ── 4. the pending receipt comes first ─────────────────────────────────
    code, lines = go("commit", r, d, expect=H)
    check("commit without a pending receipt for the set is refused", code == 1 and r.posts == 0, lines[-1:])
    code, lines = go("prepare", r, d, expect=H)
    pend = receipts(d)
    check("prepare writes one pending receipt naming the 26 planned rows, the cohort and the expected set, and inserts "
          "nothing", code == 0 and r.posts == 0 and len(pend) == 1 and pend[0]["result"] == "pending"
          and len(pend[0]["rows"]) == 26 and pend[0]["expect"] == H and len(pend[0]["expected_set"]) == 26
          and pend[0]["cohort"] == COHORT and all(x["reviewer_email"] == COHORT for x in pend[0]["rows"]))
    # The live rows change between prepare and commit: refused, receipt marked, nothing inserted.
    late = FakePostgrest(r.rows + [{"course_id": P + "ASE Bundle — T5, T8", "field": "credential_family",
                                    "value": "Other", "reviewer_email": "slee@cccco.edu", "reviewed_at": "x"}],
                         receipt_dir=d)
    code, lines = go("commit", late, d, expect=H)
    check("a commit whose live read changed since the pending receipt refuses and marks the receipt",
          code == 1 and late.posts == 0 and receipts(d)[0]["result"].startswith("refused at commit"))
finally:
    shutil.rmtree(d)

# ── 4b. the commit, the read-back and the re-run ────────────────────────────
d = tempfile.mkdtemp()
try:
    r, code, lines, err = committed(d)
    rec = receipts(d)[-1]
    new = [x for x in r.rows if x["field"] == "credential_family"]
    check("the commit inserts the 26 tags under the cohort, filed as ours by the read-back",
          err is None and code == 0 and len(new) == 26 and all(x["reviewer_email"] == COHORT and x["value"] == FAM
                                                              for x in new)
          and rec["result"] == "written" and len(rec["inserted"]) == 26 and rec["read_back"]["set"] == rec["expect"],
          lines[-1:])
    check("the receipt exists before the INSERT and holds the fold rows read and the five held",
          r.receipt_before_post is True and len(rec.get("fold_rows_read") or []) > 0 and len(rec.get("held")) == 5)
    check("Sam's fold rows and every other row are exactly as they were",
          state([x for x in r.rows if x["field"] != "credential_family"]) == state(BASE))
    before = state(r.rows)
    code, lines = go("commit", r, d, expect=H)
    check("a re-run after the commit is a no-op: nothing to write, no new receipt",
          code == 0 and r.posts == 1 and state(r.rows) == before and len(receipts(d)) == 1
          and any("nothing to write" in l for l in lines), lines[-1:])
    h2, lines = dry_hash(r.rows)
    check("after the commit the dry run reads 0 to write, 26 already written, and the same set hash",
          h2 == H and any("0 to write, 26 already written, 5 held for Sam, 0 conflicts" in l for l in lines))

    # ── 6. rollback: exact, and a person's change survives ─────────────────
    sam_row = {"course_id": P + "ASE Master Automobile Technician", "field": "credential_family", "value": FAM,
               "reviewer_email": "slee@cccco.edu", "reviewed_at": "2026-11-12T01:00:00+00:00"}
    r.rows.append(sam_row)
    mine = cohort_rows(r)
    changed_value = next(x for x in r.rows if x is mine[0])
    changed_value["value"] = "A family Sam chose"            # a person took it with another value
    changed_value["reviewer_email"] = "slee@cccco.edu"
    taken_by = next(x for x in r.rows if x is mine[1])
    taken_by["reviewer_email"] = "map@rccd.edu"              # a person re-saved it with the same value
    keep = state([x for x in r.rows if x.get("reviewer_email") != COHORT])
    code, lines = go("rollback", r, d)
    rb = receipts(d, "rolled_back")[-1]
    check("rollback removes the 24 rows still ours and leaves the 2 a person has taken since, and Sam's own row",
          code == 0 and not cohort_rows(r) and state(r.rows) == keep and len(rb["removed"]) == 24
          and len(rb["taken_since"]) == 2 and rb["aborted"] is None, lines[-1:])
    code, lines = go("rollback", r, d)
    check("a second rollback deletes nothing and still reports the 2 taken since",
          any("0 removed, 24 already gone, 2 taken since" in l for l in lines), lines[-1:])
finally:
    shutil.rmtree(d)

# ── 5. the undo never depends on the INSERT's echo ──────────────────────────
for label, hooks in (
        ("a POST the server committed and the client retried (echo [])", {"post_then_timeout": True}),
        ("an exception raised after the insert committed", {"post_then_raise": Boom("after commit")}),
        ("a cancel after the insert committed", {"post_then_raise": KeyboardInterrupt()}),
        ("a read-back that fails after the insert", {"after_post": lambda s: setattr(s, "gets_fail", True)})):
    d = tempfile.mkdtemp()
    try:
        r, code, lines, err = committed(d, **hooks)
        rec = receipts(d)[-1]
        landed = len(cohort_rows(r))
        check("%s: 26 cohort rows landed and the receipt still names them" % label,
              landed == 26 and len(rec["rows"]) == 26 and rec["result"] != "pending", (landed, rec["result"]))
        if "retried" in label:
            check("the retried POST is filed by the read-back: 26 ours, written, though the INSERT echoed 0",
                  code == 0 and rec["insert_echo"] == 0 and len(rec["inserted"]) == 26 and rec["result"] == "written",
                  (code, rec.get("insert_echo"), rec["result"]))
        else:
            check("%s: the commit does not report success" % label, code != 0, code)
        code, lines = go("rollback", r, d)
        check("%s: rollback removes all 26 cohort rows" % label,
              not cohort_rows(r) and state(r.rows) == state(BASE) and any("26 removed" in l for l in lines),
              lines[-1:])
    finally:
        shutil.rmtree(d)

# A run that died after the insert and before settling: only the pending receipt exists.
d = tempfile.mkdtemp()
try:
    r = FakePostgrest(BASE, receipt_dir=d)
    go("prepare", r, d, expect=H)
    pend = receipts(d)[0]
    r.insert(pend["rows"])                     # the insert happened; the process died before the second write
    check("the dead run left only a pending receipt with no `inserted`",
          pend["result"] == "pending" and "inserted" not in pend and len(cohort_rows(r)) == 26)
    code, lines = go("rollback", r, d)
    check("rollback from a pending receipt removes the 26 cohort rows", not cohort_rows(r)
          and state(r.rows) == state(BASE) and any("26 removed" in l for l in lines), lines[-1:])
finally:
    shutil.rmtree(d)

# A person changes a row between the rollback's read and its delete: the delete's own guard keeps it.
d = tempfile.mkdtemp()
try:
    r, code, lines, err = committed(d)
    victim = cohort_rows(r)[3]

    def race(s, params, v=victim):
        if params.get("course_id") == "eq." + v["course_id"]:
            v["reviewer_email"] = "slee@cccco.edu"

    r.before_delete = race
    code, lines = go("rollback", r, d)
    check("a row a person takes between the rollback's read and its delete is not deleted (the DELETE carries the "
          "cohort and value guards)", victim in r.rows and len(cohort_rows(r)) == 0
          and len(receipts(d, "rolled_back")[-1]["taken_since"]) == 1, lines[-1:])
finally:
    shutil.rmtree(d)

# A rollback that stops part-way still writes its receipt.
d = tempfile.mkdtemp()
try:
    r, code, lines, err = committed(d)
    r.delete_fails_at = 5
    stopped = None
    try:
        go("rollback", r, d)
    except Boom as e:
        stopped = e
    rb = receipts(d, "rolled_back")
    check("a rollback that stops part-way raises, and still writes its receipt with what it removed and what remains",
          stopped is not None and len(rb) == 1 and rb[0]["aborted"] and len(rb[0]["removed"]) == 4
          and len(rb[0]["not_reached"]) == 22, rb[0] if rb else None)
    r.delete_fails_at = None
    code, lines = go("rollback", r, d)
    check("a second rollback finishes the job", not cohort_rows(r) and any("22 removed, 4 already gone" in l
                                                                          for l in lines), lines[-1:])
finally:
    shutil.rmtree(d)

# ── 7. the read-back re-checks conflicts; the paged read ────────────────────
d = tempfile.mkdtemp()
try:
    def merge_lands(s):
        s.rows.append({"course_id": P + "ASE Bundle T2 T8", "field": "unified_title_merge_confirm",
                       "value": "ASE Bundle — T2, T8", "reviewer_email": "slee@cccco.edu", "reviewed_at": "y"})

    r, code, lines, err = committed(d, after_post=merge_lands)
    rec = receipts(d)[-1]
    check("a merge confirm that lands during the insert makes the read-back differ, and the commit fails",
          code == 1 and rec["result"] == "written, but the read-back differs" and rec["read_back"]["conflicts"])
finally:
    shutil.rmtree(d)
capped = FakePostgrest(BASE + [{"course_id": "ASE-elsewhere", "field": "credential_family", "value": FAM,
                                "reviewer_email": "x", "reviewed_at": "z"}], cap=7)
got = capped.family_rows()
READ = [x for x in BASE if x["field"] in ftp.READ_FIELDS]
check("the Range-paged read collects every row past a server page cap below PAGE, only _CREDENTIAL_REVIEW:: rows "
      "of the fields the plan reads", len(got) == len(READ) and capped.gets > 2 and capped.ranged, (len(got), len(READ)))
check("the read orders by the table's unique key, so pages never shift",
      [(x["course_id"], x["field"]) for x in got] == sorted((x["course_id"], x["field"]) for x in READ))

# ── 8. the workflow ────────────────────────────────────────────────────────
wf = open(os.path.join(ROOT, ".github", "workflows", "credential-family-apply.yml"), encoding="utf-8").read()
check("the workflow is dispatch-only and serializes against the daily cron",
      "workflow_dispatch:" in wf and "schedule:" not in wf and "group: daily-dashboard" in wf)
order = [wf.find(s) for s in ("--prepare", "name: Push the pending receipt", "--commit", "name: Push the receipt\n")]
check("the workflow pushes the pending receipt after --prepare and before --commit, and pushes again after",
      all(i > 0 for i in order) and order == sorted(order), order)
check("the final push runs always(), never on a dry run, and nothing force-pushes",
      "always() && inputs.mode != 'dry-run'" in wf and "--force" not in wf and "push -f" not in wf
      and wf.count("git rebase origin/main") == 2)
check("commit takes the set hash, never a count", "[0-9a-f]{12}" in wf and "--commit \"$EXPECT\"" in wf)
gov = json.load(open(os.path.join(ROOT, "kb", "governance_surface_map.json"), encoding="utf-8"))
check("the workflow is mapped in the governance surface map", "workflow:credential-family-apply.yml" in gov["mapped"])

failed = [n for n, ok, _ in results if not ok]
for n, ok, why in results:
    print(("PASS  " if ok else "FAIL  ") + n + ("" if ok or why == "" else "  -- %s" % (why,)))
print("\n%d/%d passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
