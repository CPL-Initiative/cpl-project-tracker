#!/usr/bin/env python3
"""Guards kb/_family_tag_apply.py, the reviewed write of the credential family tags (Sam, 2026-11-11, cpl_memory
sam-bundle-family-is-a-field-2026-11-11: each ASE bundle stays its own title and gains the family).

kb_curation is the table Rule 10 protects, so these checks pin the failure modes:
  1. the generator and the applier emit no SQL: no schema statement, no temporary table, only insert rows;
  2. a held title (the four Masters, the two non-bundles, ASE C1 or G1) emits nothing: 24 to write, 7 held;
  3. the dry run reads live and writes nothing; the commit re-reads and refuses when the live set no longer gives the
     count the dry run showed, or when a pending merge confirm names a member as its target;
  4. the commit inserts only family rows under the cohort, writes the receipt first, and leaves Sam's fold rows
     exactly as they were; a re-run after the commit is a no-op;
  5. --rollback removes exactly the cohort's rows and nothing a person wrote;
  6. the paged read collects every row past one page.

Runs against an in-memory table shaped like tests/cer_decision_apply_test.py's FakeRest (that file runs its checks at
import, so its class cannot be imported); no network. Run from repo root:
    python3 tests/credential_family_apply_test.py
"""
import glob
import json
import os
import re
import shutil
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _family_tag_apply as app  # noqa: E402
import _family_tag_plan as ftp  # noqa: E402

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


P, FAM, COHORT = ftp.PREFIX, "ASE Certificate Bundles", ftp.CREDENTIAL_FAMILY_COHORT
receipt = json.load(open(os.path.join(ROOT, "kb", "receipts", "credential_family_2026-11-11_s638", "receipt.json"),
                         encoding="utf-8"))
# Sam's 61 saved fold rows as the S638 read found them (the 31 titles), as kb_curation holds them.
FOLDS = [{k: r[k] for k in ("course_id", "field", "value", "reviewer_email", "reviewed_at")}
         for it in receipt["convert"] + receipt["held"] for r in it["rows"]]
OTHER = {"course_id": P + "ASE Bundle — A4, A5", "field": "issuing_agency_override",
         "value": "National Institute for Automotive Service Excellence (ASE)", "reviewer_email": "map@rccd.edu",
         "reviewed_at": "2026-07-09T00:07:00+00:00"}
C1G1 = "ASE C1 or G1 — Service Consultant or Auto Maintenance and Light Repair"


class FakeRest:
    """kb_curation in memory: the applier's paged read, INSERT (ignore duplicates) and DELETE by cohort."""

    def __init__(self, rows, receipt_dir=None, page=1000):
        self.rows = [dict(r) for r in rows]
        self.receipt_dir, self.page = receipt_dir, page
        self.inserts, self.reads, self.receipt_before_insert = 0, 0, None

    def family_rows(self):
        self.reads += 1
        got = [dict(r) for r in self.rows if r["course_id"].startswith(P) and r["field"] in ftp.READ_FIELDS]
        return app.Rest.family_rows(_Pager(got, self.page), page=self.page)

    def insert(self, rows):
        self.inserts += 1
        if self.receipt_dir:
            self.receipt_before_insert = bool(glob.glob(os.path.join(self.receipt_dir, "applied_*.json")))
        out = []
        for r in rows:
            if any(x["course_id"] == r["course_id"] and x["field"] == r["field"] for x in self.rows):
                continue
            self.rows.append(dict(r, reviewed_at="2026-11-12T00:00:00+00:00"))
            out.append(dict(r))
        return out

    def delete(self, row, cohort):
        hit = [x for x in self.rows if x["course_id"] == row["course_id"] and x["field"] == row["field"]
               and x["value"] == row["value"] and x.get("reviewer_email") == cohort]
        self.rows = [x for x in self.rows if x not in hit]
        return hit


class _Pager:
    """Answers app.Rest.family_rows' GETs from a list, a page at a time (PostgREST's limit/offset)."""

    def __init__(self, rows, page):
        self.rows = sorted(rows, key=lambda r: (r["course_id"], r["field"]))
        self.calls = 0

    def _call(self, method, params):
        self.calls += 1
        off, lim = int(params["offset"]), int(params["limit"])
        return [dict(r) for r in self.rows[off:off + lim]]


def go(mode, rest, d, expect=None):
    lines = []
    code = app.run(mode, rest, out=lines.append, expect=expect, receipt_dir=d)
    return code, lines


def state(rest):
    return sorted(json.dumps(r, sort_keys=True, ensure_ascii=False) for r in rest.rows)


# ── 1. no SQL anywhere ──────────────────────────────────────────────────────
SCHEMA = re.compile(r"\b(create|drop|alter|truncate)\s+(temp(orary)?\s+)?(table|index|function|schema|view)\b|"
                    r"\bbegin\s*;|\bcommit\s*;", re.I)
for mod in (ftp, app):
    src = open(mod.__file__.replace(".pyc", ".py"), encoding="utf-8").read()
    check("%s holds no schema statement, no temporary table and no transaction" % os.path.basename(mod.__file__),
          not SCHEMA.search(src), SCHEMA.search(src).group(0) if SCHEMA.search(src) else "")

# ── 2. the plan: 24 to write, 7 held, each row one family tag ───────────────
p = ftp.plan(FOLDS + [OTHER], ftp.families())
tags, written, conflicts = ftp.tag_rows(p, FOLDS + [OTHER])
held = {h["title"] for h in p["held"]}
check("24 titles take a tag, 7 are held, no conflict", len(tags) == 24 and len(held) == 7 and not conflicts,
      (len(tags), len(held), conflicts))
check("ASE C1 or G1 is held with the any-one-test titles", C1G1 in held and C1G1 in ftp.HOLD)
check("a held title emits nothing", not any(t["course_id"][len(P):] in held for t in tags))
check("every emitted row is one family tag, three keys, nothing else",
      all(set(t) == {"course_id", "field", "value"} and t["field"] == "credential_family" and t["value"] == FAM
          for t in tags))

# ── 3. dry run, and the commit's guards ─────────────────────────────────────
d = tempfile.mkdtemp()
try:
    r = FakeRest(FOLDS + [OTHER], receipt_dir=d)
    start = state(r)
    code, lines = go("dry-run", r, d)
    check("the dry run reads live, reports 24 to write, 7 held, 0 conflicts, and writes nothing",
          code == 0 and r.inserts == 0 and r.reads == 1 and state(r) == start
          and any("24 to write, 0 already written, 7 held for Sam, 0 conflicts" in l for l in lines)
          and any("--commit 24" in l for l in lines), lines[-1:])
    check("the dry run commits no receipt", not os.listdir(d))

    code, lines = go("commit", r, d)
    check("a commit without the dry run's count is refused", code == 1 and r.inserts == 0, lines[-1:])
    code, lines = go("commit", r, d, expect=25)
    check("a commit whose count the live set no longer gives is refused", code == 1 and r.inserts == 0, lines[-1:])

    # Another title's pending merge confirm names a member as its target: the commit holds the whole write.
    fight = FakeRest(FOLDS + [{"course_id": P + "ASE Bundle T2 T8", "field": "unified_title_merge_confirm",
                               "value": "ASE Bundle — T2, T8", "reviewer_email": "slee@cccco.edu",
                               "reviewed_at": "2026-11-12T00:00:00+00:00"}], receipt_dir=d)
    code, lines = go("commit", fight, d, expect=24)
    check("a pending merge confirm naming a member as its target is a conflict, and nothing is written",
          code == 1 and fight.inserts == 0 and any("CONFLICT" in l and "ASE Bundle — T2, T8" in l for l in lines))
    # A person already set another family on a member.
    other = FakeRest(FOLDS + [{"course_id": P + "ASE Bundle — T5, T8", "field": "credential_family", "value": "Other",
                               "reviewer_email": "slee@cccco.edu", "reviewed_at": "2026-11-12T00:00:00+00:00"}])
    code, lines = go("commit", other, d, expect=24)
    check("a member whose family row a person set to another value is a conflict, and nothing is written",
          code == 1 and other.inserts == 0)

    # ── 4. the commit ──────────────────────────────────────────────────────
    code, lines = go("commit", r, d, expect=24)
    recs = glob.glob(os.path.join(d, "applied_*.json"))
    rec = json.load(open(recs[0], encoding="utf-8")) if recs else {}
    new = [x for x in r.rows if x["field"] == "credential_family"]
    check("the commit inserts the 24 tags under the cohort, read back as written",
          code == 0 and len(new) == 24 and all(x["reviewer_email"] == COHORT and x["value"] == FAM for x in new)
          and rec.get("result") == "written" and len(rec.get("inserted") or []) == 24, lines[-1:])
    check("the receipt exists before the INSERT, and holds the fold rows read and the seven held",
          r.receipt_before_insert is True and len(rec.get("fold_rows_read") or []) > 0 and len(rec.get("held")) == 7)
    check("Sam's fold rows and every other row are exactly as they were",
          state(FakeRest([x for x in r.rows if x["field"] != "credential_family"])) == start)
    before = state(r)
    code, lines = go("commit", r, d, expect=24)
    check("a re-run after the commit is a no-op: nothing to write, no new receipt",
          code == 0 and r.inserts == 1 and state(r) == before and len(glob.glob(os.path.join(d, "applied_*.json"))) == 1
          and any("nothing to write" in l for l in lines), lines[-1:])
    code, lines = go("dry-run", r, d)
    check("the dry run after the commit reads 0 to write, 24 already written",
          any("0 to write, 24 already written, 7 held for Sam, 0 conflicts" in l for l in lines))

    # ── 5. rollback removes exactly the cohort's rows ──────────────────────
    r.rows.append({"course_id": P + "ASE Master Automobile Technician", "field": "credential_family", "value": FAM,
                   "reviewer_email": "slee@cccco.edu", "reviewed_at": "2026-11-12T01:00:00+00:00"})
    person = state(FakeRest([x for x in r.rows if x["reviewer_email"] != COHORT]))
    code, lines = go("rollback", r, d)
    check("rollback removes the 24 cohort rows and nothing a person wrote",
          code == 0 and not any(x["reviewer_email"] == COHORT for x in r.rows) and state(r) == person
          and glob.glob(os.path.join(d, "rolled_back_*.json")), lines[-1:])
    code, lines = go("rollback", r, d)
    check("a second rollback finds every row already gone", any("0 removed, 24 already gone" in l for l in lines))
finally:
    shutil.rmtree(d)

# ── 6. the paged read ──────────────────────────────────────────────────────
pager = _Pager(FOLDS + [OTHER], 7)
got = app.Rest.family_rows(pager, page=7)
check("the paged read collects every row past the first page, and only _CREDENTIAL_REVIEW:: rows",
      len(got) == len(FOLDS) + 1 and pager.calls > 2)

# ── 7. the workflow ────────────────────────────────────────────────────────
wf = open(os.path.join(ROOT, ".github", "workflows", "credential-family-apply.yml"), encoding="utf-8").read()
check("the workflow is dispatch-only and serializes against the daily cron",
      "workflow_dispatch:" in wf and "schedule:" not in wf and "group: daily-dashboard" in wf)
check("the workflow commits its receipt to the cohort's folder, never on a dry run",
      "kb/receipts/credential_family_2026-11-11_s638" in wf and "inputs.mode != 'dry-run'" in wf)
gov = json.load(open(os.path.join(ROOT, "kb", "governance_surface_map.json"), encoding="utf-8"))
check("the workflow is mapped in the governance surface map", "workflow:credential-family-apply.yml" in gov["mapped"])

failed = [n for n, ok, _ in results if not ok]
for n, ok, why in results:
    print(("PASS  " if ok else "FAIL  ") + n + ("" if ok or why == "" else "  -- %s" % (why,)))
print("\n%d/%d passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
