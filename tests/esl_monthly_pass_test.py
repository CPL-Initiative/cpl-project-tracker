#!/usr/bin/env python3
"""The ESL monthly pass: what it applies, what it lists for Sam, what it never re-asks.

Sam's verdict on item 8 of the ESL merging sheet (2026-09-26): "A monthly pass: a session
dry-runs the fold over new ESL identities, applies what a level or purpose word places, and
lists the rest for you." These checks pin that split, the identities he ruled to keep apart,
the skip of ids an earlier receipt applied, the plan's fit with the applier, and the refusal
to overwrite a plan.

Run:  python3 tests/esl_monthly_pass_test.py
"""
import json
import os
import sys
import tempfile

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "kb"))
import _esl_monthly_pass as P   # noqa: E402
import _esl_sheet_apply as A    # noqa: E402

FAIL = []


def check(name, cond):
    print(("  ok    " if cond else "  FAIL  ") + name)
    if not cond:
        FAIL.append(name)


def pl(i, how, bucket="Beginning ESL", target="ESOL M9168"):
    return {"id": i, "title": f"title of {i}", "credit": "Credit", "members": 2,
            "discipline": "English as a Second Language", "bucket": bucket, "target": target,
            "how": how}


PLACEMENT = {
    "_generated_at": "2026-10-27T00:00:00+00:00",
    "placements": [
        pl("ESOL MA001", "level: identity title word", "Intermediate ESL", "ESOL M9256"),
        pl("ESOL MA002", "level: member ladder vote", "Advanced ESL", "ESOL M1141"),
        pl("ESOL MA003", "purpose: citizenship", "Civic ESL", "ESOL M9177"),
        pl("ESOL MA004", "purpose: vocational", "Vocational ESL", "ESOL M9023"),
        pl("ESOL MA005", "level: nothing speaks, Beginning by default"),
        pl("ESOL MA006", "level: identity title word"),          # an earlier receipt applied it
        pl("ESOL M9309", "level: identity title word"),          # ruled apart, even if placed
    ],
    "held": [
        {"id": "ESOL M1205", "title": "ESL College Composition and Reading", "members": 2,
         "why": "transfer composition in the first plan: held apart (unruled)"},
        {"id": "ESOL MA007", "title": "Optics for ESL", "members": 1,
         "why": "a member course's subject maps outside ESL: Health"},
    ],
}

apart = P.resolve_apart()
plan = P.split(PLACEMENT, apart, {"ESOL MA006"}, 301)
ins = {i["id"]: i for i in plan["inserts"]}
listed = {x["id"] for x in plan["listed"]}
ruled = {x["id"] for x in plan["ruled_apart"]}

print("the split follows the verdict")
check("a level word on the identity title is applied", "ESOL MA001" in ins)
check("a level from the member courses' ladder vote is applied", "ESOL MA002" in ins)
check("a purpose word is applied (citizenship, vocational)", {"ESOL MA003", "ESOL MA004"} <= set(ins))
check("Beginning by default is listed, never applied", "ESOL MA005" in listed and "ESOL MA005" not in ins)
check("an unruled held identity is listed", "ESOL MA007" in listed)
check("each insert targets its bucket's survivor", ins["ESOL MA003"]["to"] == "ESOL M9177")

print("settled questions stay settled")
check("the six identities Sam kept apart all resolve", len(apart) == 6)
check("a ruled-apart identity is never listed, held or placed",
      {"ESOL M1205", "ESOL M9309"} <= ruled and not ({"ESOL M1205", "ESOL M9309"} & (listed | set(ins))))
check("the ruling travels with it", all(x["ruling"] for x in plan["ruled_apart"]))
check("an id an earlier receipt applied is skipped",
      "ESOL MA006" not in ins and "ESOL MA006" in {s["id"] for s in plan["skipped"]})
check("the counts add up to every input",
      sum(plan["counts"].values()) == len(PLACEMENT["placements"]) + len(PLACEMENT["held"]))

print("the plan fits the applier")
check("the cohort names the pass and the session", ins["ESOL MA001"]["cohort"] == "esl-monthly-s301@bot")
check("the cohort passes the applier's pattern", all(A.COHORT_RE.match(i["cohort"]) for i in ins.values()))
with tempfile.TemporaryDirectory() as d:
    json.dump(dict(plan, _about="test"), open(os.path.join(d, "plan.json"), "w"))
    ups, inss, dels = A.load_plan(d)
    check("the applier loads it: inserts only", len(inss) == 4 and not ups and not dels)
    acts = A.decide(ups, inss, dels, {}, set())
    check("on an empty table every insert is ready to go", all(a["state"] == "go" for a in acts))

print("receipts on disk")
with tempfile.TemporaryDirectory() as d:
    rd = os.path.join(d, "kb", "esl_sheet_out", "2026-09-26")
    os.makedirs(rd)
    json.dump({"rows": [{"id": "ESOL MB001", "state": "applied"},
                        {"id": "ESOL MB002", "state": "held"}]},
              open(os.path.join(rd, "applied_2026-09-27T115648Z.json"), "w"))
    got = P.applied_ids(d)
    check("an applied row counts as done", "ESOL MB001" in got)
    check("a held row does not", "ESOL MB002" not in got)

print("a pass never overwrites a plan")
with tempfile.TemporaryDirectory() as d:
    pd = os.path.join(d, "kb", "esl_sheet_out", "2026-10-27-monthly")
    os.makedirs(pd)
    open(os.path.join(pd, "plan.json"), "w").write("{}")
    saved, P.ROOT = P.ROOT, d
    try:
        P.main(["--session", "301", "--date", "2026-10-27"])
        check("an existing plan.json is refused", False)
    except SystemExit as e:
        check("an existing plan.json is refused", "REFUSED" in str(e))
    finally:
        P.ROOT = saved

print()
if FAIL:
    print(f"{len(FAIL)} FAILED: {FAIL}")
    sys.exit(1)
print("all checks passed")
