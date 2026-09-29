#!/usr/bin/env python3
"""The ESL sheet applier against an in-memory kb_curation: holds, guarded writes, receipts, rollback.

Sam, 2026-09-27: he does not run SQL, so kb/_esl_sheet_apply.py carries the sheet's writes through
a workflow. These checks guard what made the SQL safe to hand over: a row a curator moved is left
alone, a curator's row is never touched, a re-run changes nothing, and the receipt undoes exactly
what the apply wrote.

Run:  python3 tests/esl_sheet_apply_test.py
"""
import copy
import json
import os
import sys
import tempfile

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "kb"))
import _esl_sheet_apply as A  # noqa: E402

FAIL = []


def check(name, cond):
    print(("  ok    " if cond else "  FAIL  ") + name)
    if not cond:
        FAIL.append(name)


def vals(s):  # 'in.("a","b")' -> {'a','b'}
    return {v.strip('"') for v in s[4:-1].split(",")}


class FakeRest:
    """Honors the filters the applier sends: eq., in. and the pending-confirm or=(...)."""

    def __init__(self, rows):
        self.t = {(r["course_id"], r["field"]): dict(r) for r in rows}
        self.writes = 0

    def _match(self, r, p):
        for k, v in p.items():
            if k in ("select", "order", "or"):
                continue
            if v.startswith("eq.") and r.get(k) != v[3:]:
                return False
            if v.startswith("in.") and r.get(k) not in vals(v):
                return False
        if "or" in p:
            inner = p["or"][1:-1]
            s = vals(inner[len("course_id."):inner.index(",value.")])
            return r["course_id"] in s or r["value"] in s
        return True

    def select(self, p):
        return [dict(r) for r in self.t.values() if self._match(r, p)]

    def patch(self, p, body):
        hit = [r for r in self.t.values() if self._match(r, p)]
        for r in hit:
            r.update(body)
        self.writes += len(hit)
        return [dict(r) for r in hit]

    def insert(self, rows):
        out = []
        for r in rows:
            if (r["course_id"], r["field"]) not in self.t:
                self.t[(r["course_id"], r["field"])] = dict(r)
                out.append(dict(r))
        self.writes += len(out)
        return out

    def delete(self, p):
        hit = [k for k, r in self.t.items() if self._match(r, p)]
        out = [self.t.pop(k) for k in hit]
        self.writes += len(out)
        return out


def row(cid, value, who, field="merge_into"):
    return {"course_id": cid, "field": field, "value": value, "reviewer_email": who,
            "reviewed_at": "2026-08-24T13:34:50+00:00"}


BASE = [row("ESOL A", "ESOL M9168", "package-esl-s187@bot"),        # update goes
        row("ESOL B", "ESOL M9256", "package-esl-s187@bot"),        # moved since: plan says M9168
        row("ESOL C", "ESOL M9168", "map@rccd.edu"),                # a curator's row
        row("FTVE F", "ESOL M1152", "automerge-v1@bot"),            # the delete
        row("ESOL P", "ESOL M9023", "sam@x", field="unified_title_merge_confirm")]  # pending confirm
PLAN = {"updates": [
            {"item": 3, "id": "ESOL A", "from": "ESOL M9168", "to": "ESOL M91IL", "cohort": "esl-health-s294@bot",
             "before_reviewer": "package-esl-s187@bot"},
            {"item": 6, "id": "ESOL B", "from": "ESOL M9168", "to": "ESOL M1141", "cohort": "esl-ladder-s294@bot",
             "before_reviewer": "package-esl-s187@bot"},
            {"item": 6, "id": "ESOL C", "from": "ESOL M9168", "to": "ESOL M9256", "cohort": "esl-ladder-s294@bot",
             "before_reviewer": "map@rccd.edu"}],
        "inserts": [{"item": 5, "id": "ESOL N", "to": "ESOL M9168", "cohort": "esl-newfold-s294@bot"},
                    {"item": 5, "id": "ESOL P", "to": "ESOL M9023", "cohort": "esl-newfold-s294@bot"}],
        "deletes": [{"item": 9, "id": "FTVE F", "value": "ESOL M1152", "reviewer": "automerge-v1@bot"}]}

with tempfile.TemporaryDirectory() as d:
    json.dump(PLAN, open(os.path.join(d, "plan.json"), "w"))
    fake = FakeRest(copy.deepcopy(BASE))
    before = copy.deepcopy(fake.t)

    print("1. a dry run reads and writes nothing")
    A.main([d], rest=fake)
    check("no writes", fake.writes == 0 and fake.t == before)

    print("2. commit: guarded writes, holds, and a receipt")
    A.main([d, "--commit"], rest=fake)
    rec = json.load(open([os.path.join(d, f) for f in os.listdir(d) if f.startswith("applied_")][0]))
    st = {r["id"]: r["state"] for r in rec["rows"]}
    check("the update lands", fake.t[("ESOL A", "merge_into")]["value"] == "ESOL M91IL" and st["ESOL A"] == "applied")
    check("a row moved since the read is held", st["ESOL B"] == "held" and
          fake.t[("ESOL B", "merge_into")]["value"] == "ESOL M9256")
    check("a curator's row is held and untouched", st["ESOL C"] == "held" and
          fake.t[("ESOL C", "merge_into")]["reviewer_email"] == "map@rccd.edu")
    check("the insert lands", st["ESOL N"] == "applied" and ("ESOL N", "merge_into") in fake.t)
    check("a pending merge confirm holds its id", st["ESOL P"] == "held" and ("ESOL P", "merge_into") not in fake.t)
    check("the delete lands", st["FTVE F"] == "applied" and ("FTVE F", "merge_into") not in fake.t)
    check("the receipt keeps before-values", [r for r in rec["rows"] if r["id"] == "ESOL A"][0]["before"]["value"]
          == "ESOL M9168")

    print("3. a second commit changes nothing")
    w = fake.writes
    A.main([d, "--commit"], rest=fake)
    check("no new writes", fake.writes == w)

    print("4. rollback restores exactly what the apply changed")
    A.main([d, "--rollback"], rest=fake)
    check("the table is back to its start", fake.t == before)

    print("5. refusals")
    json.dump({"inserts": [{"id": "X", "to": "Y", "cohort": "map@rccd.edu"}]}, open(os.path.join(d, "plan.json"), "w"))
    try:
        A.main([d, "--commit"], rest=FakeRest([]))
        check("a non-bot cohort is refused", False)
    except SystemExit as e:
        check("a non-bot cohort is refused", "REFUSED" in str(e))

print()
if FAIL:
    print(f"{len(FAIL)} FAILED: {FAIL}")
    sys.exit(1)
print("all checks passed")
