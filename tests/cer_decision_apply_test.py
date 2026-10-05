#!/usr/bin/env python3
"""Guards kb/_cer_decision_apply.py, the reviewed write of a curator's ruled CER decisions.

Sam's verdict of 2026-10-02 (open-asks sheet 19, card 1, "Write them for me") lets a session write
the kb_curation rows the Credential Reference would have written. kb_curation is the table Rule 10
protects, so these checks pin what keeps the write from ever overriding a curator: a row a curator
already wrote with another value is held and nothing is written; a pending merge confirm naming a
row's source holds it; the INSERT ignores duplicates; the receipt exists before the INSERT; and
--rollback removes only rows still carrying this cohort and the value it wrote.

Runs against an in-memory table; no network. Run from repo root:
    python3 tests/cer_decision_apply_test.py
"""
import copy
import glob
import json
import os
import shutil
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _cer_decision_apply as app  # noqa: E402

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


P = "_CREDENTIAL_REVIEW::"
PLAN = {"ruling": "test ruling", "cohort": "partner-crosswalks-s0@bot", "rows": [
    {"course_id": P + "Old A", "field": "unified_title_override", "value": "New A"},
    {"course_id": P + "Old A", "field": "unified_title_merge_confirm", "value": "New A"},
    {"course_id": P + "Old B (X-1)", "field": "unified_title_override", "value": "Old B"},
]}


class FakeRest:
    """kb_curation in memory, answering the applier's reads, INSERT (ignore duplicates) and DELETE."""

    def __init__(self, rows=(), plan_dir=None):
        self.rows = [dict(r) for r in rows]
        self.plan_dir = plan_dir
        self.inserts = 0
        self.receipt_before_insert = None

    def rows_for(self, course_id):
        return [dict(r) for r in self.rows if r["course_id"] == course_id]

    def merge_confirms(self):
        return [dict(r) for r in self.rows if r["course_id"].startswith(P)
                and r["field"] == "unified_title_merge_confirm"]

    def insert(self, rows):
        self.inserts += 1
        if self.plan_dir:
            self.receipt_before_insert = bool(glob.glob(os.path.join(self.plan_dir, "applied_*.json")))
        out = []
        for r in rows:
            if any(x["course_id"] == r["course_id"] and x["field"] == r["field"] for x in self.rows):
                continue
            self.rows.append(dict(r))
            out.append(dict(r))
        return out

    def replace(self, course_id, field, old_value, old_email, body):
        hit = [x for x in self.rows if x["course_id"] == course_id and x["field"] == field
               and x["value"] == old_value and x.get("reviewer_email") == old_email]
        for x in hit:
            x.update(body)
        return [dict(x) for x in hit]

    def delete(self, row, cohort):
        hit = [x for x in self.rows if x["course_id"] == row["course_id"] and x["field"] == row["field"]
               and x["value"] == row["value"] and x.get("reviewer_email") == cohort]
        self.rows = [x for x in self.rows if x not in hit]
        return hit


def plan_dir(plan=PLAN):
    d = tempfile.mkdtemp()
    with open(os.path.join(d, "plan.json"), "w", encoding="utf-8") as fh:
        json.dump(plan, fh)
    return d


def run(d, mode, rest):
    lines = []
    code = app.run(d, mode, rest, out=lines.append)
    return code, lines


# ── dry run writes nothing and reports each row ──────────────────────────────
d = plan_dir()
r = FakeRest(plan_dir=d)
code, lines = run(d, "dry-run", r)
check("a dry run over an empty table reports 3 to write and writes nothing",
      code == 0 and r.inserts == 0 and any("3 to write" in l for l in lines), lines)
shutil.rmtree(d)

# ── commit writes, receipt first, read back ──────────────────────────────────
d = plan_dir()
r = FakeRest(plan_dir=d)
code, lines = run(d, "commit", r)
rec = json.load(open(glob.glob(os.path.join(d, "applied_*.json"))[0]))
check("commit inserts all three rows under the cohort",
      code == 0 and len(r.rows) == 3 and all(x["reviewer_email"] == PLAN["cohort"] for x in r.rows), lines)
check("the receipt exists before the INSERT", r.receipt_before_insert is True)
check("the receipt records the ruling, the rows and a written read-back",
      rec["ruling"] == "test ruling" and len(rec["inserted"]) == 3 and rec["result"] == "written")
code2, lines2 = run(d, "commit", r)
check("a second commit writes nothing: every row already holds its value",
      code2 == 0 and r.inserts == 1 and any("nothing to write" in l for l in lines2), lines2)

# ── rollback removes only this cohort's rows, still as written ───────────────
r.rows.append({"course_id": P + "Other", "field": "unified_title_override", "value": "Z",
               "reviewer_email": "curator@rccd.edu"})
code, lines = run(d, "rollback", r)
check("rollback removes the three rows and leaves a curator's row",
      code == 0 and len(r.rows) == 1 and r.rows[0]["reviewer_email"] == "curator@rccd.edu", lines)
shutil.rmtree(d)

# ── a curator's different value holds the plan ───────────────────────────────
d = plan_dir()
r = FakeRest([{"course_id": P + "Old A", "field": "unified_title_override", "value": "Curator's A",
               "reviewer_email": "curator@rccd.edu"}], plan_dir=d)
code, lines = run(d, "commit", r)
check("a curator's row with another value holds the whole plan; nothing written",
      code == 1 and r.inserts == 0 and any("REFUSED" in l for l in lines), lines)
code, lines = run(d, "dry-run", r)
check("the dry run names the held row and exits 1",
      code == 1 and any(l.strip().startswith("held") and "Curator's A" in l for l in lines), lines)
shutil.rmtree(d)

# ── a pending merge confirm naming the source holds the row ──────────────────
d = plan_dir()
r = FakeRest([{"course_id": P + "Something", "field": "unified_title_merge_confirm", "value": "Old A",
               "reviewer_email": "curator@rccd.edu"}], plan_dir=d)
code, lines = run(d, "commit", r)
check("a pending merge confirm that targets a plan row's source holds it",
      code == 1 and r.inserts == 0, lines)
shutil.rmtree(d)

# ── a duplicate added between read and write is skipped, not overwritten ─────
d = plan_dir()


class RacingRest(FakeRest):
    def insert(self, rows):
        self.rows.append({"course_id": P + "Old B (X-1)", "field": "unified_title_override",
                          "value": "Racer", "reviewer_email": "curator@rccd.edu"})
        return FakeRest.insert(self, rows)


r = RacingRest(plan_dir=d)
code, lines = run(d, "commit", r)
racer = [x for x in r.rows if x["course_id"] == P + "Old B (X-1)"]
check("a curator's row added between the read and the INSERT wins, and the read-back says so",
      code == 1 and len(racer) == 1 and racer[0]["value"] == "Racer"
      and any("read-back differs" in l for l in lines), lines)
shutil.rmtree(d)

# ── S333: a guarded REPLACE of a curator's row, only where the plan names it ──
U = "_UNCLASSIFIED::"
OSHA = "U.S. Occupational Safety and Health Administration (OSHA)"
RPLAN = {"ruling": "sheet 39 card 2", "cohort": "program-requirements-harvest-s0@bot", "rows": [
    {"course_id": U + "OSHA 30 Raw", "field": "issuing_agency_assignment", "value": OSHA,
     "replaces": {"value": "U.S. Department of Labor", "reviewer_email": "curator@rccd.edu"}},
    {"course_id": P + "OSHA 10-hour X", "field": "training_agency_override", "value": "CTCNC"},
]}
CURATOR_ROW = {"course_id": U + "OSHA 30 Raw", "field": "issuing_agency_assignment",
               "value": "U.S. Department of Labor", "reviewer_email": "curator@rccd.edu",
               "reviewed_at": "2026-07-07T19:37:38Z"}
d = plan_dir(RPLAN)
r = FakeRest([CURATOR_ROW], plan_dir=d)
code, lines = run(d, "dry-run", r)
check("a dry run reports 1 to write and 1 to replace, and writes nothing",
      code == 0 and r.inserts == 0 and any("1 to write, 1 to replace" in l for l in lines)
      and r.rows[0]["value"] == "U.S. Department of Labor", lines)
code, lines = run(d, "commit", r)
rec = json.load(open(glob.glob(os.path.join(d, "applied_*.json"))[0]))
swapped = [x for x in r.rows if x["course_id"] == U + "OSHA 30 Raw"][0]
check("commit replaces the named row under the cohort and inserts the new one",
      code == 0 and swapped["value"] == OSHA and swapped["reviewer_email"] == RPLAN["cohort"]
      and len(r.rows) == 2, lines)
check("the receipt keeps the curator's before-value, reviewer and date",
      rec["replaced"] and rec["replaced"][0]["before"] == {"value": "U.S. Department of Labor",
                                                           "reviewer_email": "curator@rccd.edu",
                                                           "reviewed_at": "2026-07-07T19:37:38Z"}
      and rec["result"] == "written", rec)
code, lines = run(d, "rollback", r)
back = [x for x in r.rows if x["course_id"] == U + "OSHA 30 Raw"]
check("rollback restores the curator's value, reviewer and date, and removes the insert",
      code == 0 and len(r.rows) == 1 and back[0]["value"] == "U.S. Department of Labor"
      and back[0]["reviewer_email"] == "curator@rccd.edu"
      and back[0]["reviewed_at"] == "2026-07-07T19:37:38Z", lines)
shutil.rmtree(d)

d = plan_dir(RPLAN)
r = FakeRest([dict(CURATOR_ROW, value="Something newer")], plan_dir=d)
code, lines = run(d, "commit", r)
check("a replace holds when the curator's row changed since the plan; nothing written",
      code == 1 and r.inserts == 0 and r.rows[0]["value"] == "Something newer", lines)
shutil.rmtree(d)

d = plan_dir(RPLAN)
r = FakeRest([dict(CURATOR_ROW, reviewer_email="someone-else@rccd.edu")], plan_dir=d)
code, lines = run(d, "commit", r)
check("a replace holds when another reviewer holds the row", code == 1 and r.inserts == 0, lines)
shutil.rmtree(d)

d = plan_dir(RPLAN)
r = FakeRest([], plan_dir=d)
code, lines = run(d, "commit", r)
check("a replace holds when the row it names is gone", code == 1 and r.inserts == 0, lines)
shutil.rmtree(d)

for label, mutate in [
    ("an _UNCLASSIFIED:: title assignment", lambda p: p["rows"][0].update(field="unified_title_assignment")),
    ("replaces without a reviewer_email", lambda p: p["rows"][0]["replaces"].pop("reviewer_email")),
    ("replaces naming the new value itself", lambda p: p["rows"][0]["replaces"].update(value=OSHA)),
    ("an agency field outside the CER and unclassified namespaces",
     lambda p: p["rows"][1].update(course_id="ESOL M9267")),
]:
    bad = copy.deepcopy(RPLAN)
    mutate(bad)
    d = plan_dir(bad)
    try:
        app.load_plan(d)
        refused = False
    except SystemExit:
        refused = True
    check("the plan refuses " + label, refused)
    shutil.rmtree(d)

# ── the plan is validated before anything is read ────────────────────────────
for label, mutate in [
    ("a cohort that is not <lane>-s<N>@bot", lambda p: p.update(cohort="curator@rccd.edu")),
    ("a course_id outside the CER namespace", lambda p: p["rows"][0].update(course_id="ESOL M9267")),
    ("a field other than the title fields", lambda p: p["rows"][0].update(field="merge_into")),
    ("a merge confirm naming a different target than its override",
     lambda p: p["rows"][1].update(value="Something else")),
    ("an empty value", lambda p: p["rows"][2].update(value=" ")),
]:
    bad = copy.deepcopy(PLAN)
    mutate(bad)
    d = plan_dir(bad)
    try:
        app.load_plan(d)
        refused = False
    except SystemExit:
        refused = True
    check("the plan refuses " + label, refused)
    shutil.rmtree(d)

# ── the committed plans are valid ones ───────────────────────────────────────
plans = glob.glob(os.path.join(ROOT, "kb", "cer_decisions_out", "*", "plan.json"))
check("a committed plan exists", bool(plans))
for p in plans:
    name = os.path.relpath(p, ROOT)
    try:
        pl = app.load_plan(os.path.dirname(p))
        ok = bool(pl["ruling"]) and pl["cohort"].endswith("@bot")
    except SystemExit as e:
        ok, pl = False, str(e)
    check("%s loads: ruling, a bot cohort, CER and unclassified rows only" % name, ok, pl)

passed = 0
for name, ok, why in results:
    print(f"{'  ok' if ok else 'FAIL'}  {name}" + ("" if ok else f"  — {why}"))
    passed += ok
print(f"\n{passed}/{len(results)} checks passed")
sys.exit(0 if passed == len(results) else 1)
