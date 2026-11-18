#!/usr/bin/env python3
"""Rescore the filed program records' degree arithmetic under the current rule.

Sam, Open Asks Sheet 81 (2026-10-14, cards 1 "count" and 2 "adt", both his own
call) counts two more kinds of record as adding up against the degree total a
page prints (kb/_program_requirements_score.py, degree_verdict): a degree total
inside the span the requirements allow, and a transfer degree's 60 filled by
transferable electives where the page names none. Sheet 82 card 2 ("overlap",
the same day) adds a third: a transfer degree whose major and general education
run past its total, because a course counts toward both. Card 1 said what it costs:
"no model call, a rescore of the filed records and a new display build."

A filed record keeps the scorer's sum ("computed": blocks, open electives and
general education) beside the printed degree total ("stated"), so the rescore
re-reads only how the two meet; it never re-adds the blocks, because the closed
list and the page text stay with the run that read them. It touches records
whose arithmetic is "unequal" against the degree total or the program total
(S457, Sam's Sheet 120 card 1 "narrow" of 2026-10-23: a printed total the low end
meets exactly with the high end carried past it passes as "meets", for program
totals and electives-filled degrees; kb/_program_requirements_score.py), and
nothing else. A program record whose degree check also fails stays failing.

Sam's rulings of 2026-11-17 (docs/reference/sam_rulings.md) ride the same pass:
a printed unit range whose low end the sum meets with its high end short passes
as "short_high" (the scorer's short_high), and a local degree whose major
matches the catalog exactly and whose major and general education run past the
degree total takes ge_overlap, with the reconcile stage's statewide note
(local_overlap_hold in kb/_program_requirements_reconcile.py), and passes as
overlap. The general education open slot needs the page text, and its matcher is
off until a self-recall run on captured pages (GE_AREA_SLOT_FILL in
kb/_program_requirements_reconcile.py), so the rescore never adds one.

    python3 kb/_program_requirements_rescore.py           # rewrite the records it passes, write the receipt
    python3 kb/_program_requirements_rescore.py --check   # fail when a filed record would change
    python3 kb/_program_requirements_rescore.py --rollback-from MIGRATE_RECEIPT --receipt RESCORE_RECEIPT
        # after the UPDATE ran: the rollback for the rows it returned, and only those

The receipt (kb/receipts/program_requirement_records_rescore_<date>_<tag>.json)
names every record it passed with its run and its place i in the list, and
carries the guarded UPDATE that moves the live row's checks.arithmetic from
"unequal" to "equal" (only where the row still holds that run and still reads
"unequal"). The UPDATE returns one JSON value: how many rows it moved, their
places, and the places of the rows the follow_verdict trigger then marked checked.
The rollback (Rule 10 a2) is built from that returned value with --rollback-from,
so it moves back only the rows the UPDATE moved, never a row that read "equal"
before it ran. The display build follows, through the display job.
"""
from __future__ import annotations

import argparse
import glob
import json
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from _program_requirements_score import degree_verdict, program_verdict  # noqa: E402
import _program_requirements_reconcile as R  # noqa: E402

ROOT = os.path.dirname(HERE)
GLOBS = [os.path.join(HERE, "program_requirements_college", "*", "records", "*.json")]
RECEIPTS = os.path.join(HERE, "receipts")


def _q(s: str) -> str:
    return "'%s'" % str(s).replace("'", "''")


def rescore(filed: dict) -> dict | None:
    """The filed record's arithmetic under the current rule, or None when it
    does not change."""
    score = filed.get("score") or {}
    arith = score.get("arithmetic") or {}
    comp, stated = arith.get("computed"), arith.get("stated")
    against = arith.get("against")
    if against not in ("degree", "program") or arith.get("status") != "unequal" or not comp or not stated:
        return None
    prog = (filed.get("record") or {}).get("program") or {}
    local_overlap = against == "degree" and R.local_overlap_hold(prog, filed.get("award"), arith) is None
    if local_overlap:
        # Sam's ruling 1 of 2026-11-17: the major counts toward general education for a local degree too.
        prog = dict(prog, ge_overlap=True)
    if against == "degree":
        v = degree_verdict(prog, (float(stated[0]), float(stated[1])), float(comp[0]), float(comp[1]),
                           filed.get("award"))
    else:
        # Record shape 6 (a page printing the major's total and the degree's): the degree check
        # rides as `degree`; where it fails, a passing major still leaves the record failing.
        deg = arith.get("degree")
        if deg and not deg.get("pass"):
            return None
        v = program_verdict(prog, (float(stated[0]), float(stated[1])), float(comp[0]), float(comp[1]))
    if not v["pass"]:
        return None
    new = dict(arith)
    new.update(v)
    # A passing verdict carries no failure reason, as the scorer's passing branches write "why": [].
    new["why"] = list(v.get("why") or [])
    new["rescored"] = (RULING_SHORT_HIGH if v.get("short_high")
                       else RULING_LOCAL_OVERLAP if local_overlap and v.get("overlap")
                       else "Open Asks Sheet 120 card 1" if v.get("meets")
                       else "Open Asks Sheet 82" if v.get("overlap") else "Open Asks Sheet 81")
    return new


RULING_SHORT_HIGH = "Sam's ruling of 2026-11-17, short high end"
RULING_LOCAL_OVERLAP = "Sam's ruling of 2026-11-17, local degree overlap"


def arith_against(filed: dict) -> str | None:
    return (((filed.get("score") or {}).get("arithmetic") or {}).get("against"))


def how(new: dict) -> str:
    for k in ("meets", "short_high", "within", "overlap", "transfer", "minimum"):
        if new.get(k):
            return k
    return "fill"


def passes(score: dict) -> bool:
    return all((score.get(k) or {}).get("pass") for k in ("coverage", "invented", "arithmetic", "repeated", "outcomes"))


def run(write: bool) -> list[dict]:
    changed = []
    for path in sorted(p for g in GLOBS for p in glob.glob(g)):
        with open(path) as fh:
            filed = json.load(fh)
        new = rescore(filed)
        if new is None:
            continue
        changed.append({"college": filed["college"], "control_number": filed["control_number"],
                        "award": filed.get("award"), "extracted_run": filed.get("extracted_run"),
                        "against": arith_against(filed), "how": how(new),
                        "computed": new.get("computed"), "stated": new.get("stated"),
                        "path": os.path.relpath(path, ROOT)})
        if write:
            if new.get("rescored") == RULING_LOCAL_OVERLAP:
                # The record takes the field the scorer read, with the reconcile stage's statewide note.
                rec, notes = R.local_degree_ge_overlap(filed["record"], filed.get("award"), filed["score"]["arithmetic"])
                filed["record"] = rec
                filed["reconciled"] = (filed.get("reconciled") or []) + notes
            filed["score"]["arithmetic"] = new
            filed["score"]["pass"] = passes(filed["score"])
            with open(path, "w") as fh:
                json.dump(filed, fh, ensure_ascii=False, indent=1)
                fh.write("\n")
    return changed


def _values(changed: list[dict]) -> str:
    return ",\n  ".join("(%d, %s, %s, %s)" % (c["i"], _q(c["college"]), _q(c["control_number"]),
                                               int(c["extracted_run"])) for c in changed)


def update_sql(changed: list[dict], to: str, frm: str) -> str:
    """The guarded UPDATE moving checks.arithmetic from frm to to, returning one JSON value: the rows it moved
    ("returned"), their places in the receipt ("keys") and the places of the rows left checked after it, where the
    follow_verdict trigger matched a person's confirm ("checked"). One small value, so the migrate receipt's
    response (its first 4,000 characters) holds all of it. The UPDATE writes checks.arithmetic alone: never the
    record, checked, checked_by or checked_at, which a person's verdict sets through the trigger."""
    return ("with v(i, college, control_number, extracted_run) as (values\n  %s),\n"
            "u as (\n"
            "update public.program_requirement_records r\n"
            "   set checks = jsonb_set(r.checks, '{arithmetic}', '\"%s\"')\n"
            "  from v\n"
            " where r.college = v.college and r.control_number = v.control_number\n"
            "   and r.extracted_run = v.extracted_run and r.checks->>'arithmetic' = '%s'\n"
            "returning v.i, r.college, r.control_number, r.checked)\n"
            "select json_build_object('returned', count(*),\n"
            "       'keys', coalesce(json_agg(u.i order by u.i), '[]'::json),\n"
            "       'checked', coalesce(json_agg(u.i order by u.i) filter (where u.checked), '[]'::json)) as returned\n"
            "  from u;" % (_values(changed), to, frm))


def returned_value(doc) -> dict:
    """The UPDATE's returned value from a migrate receipt ({"response": the API's body}), the API's body itself
    (a list of rows), or the value ({"returned", "keys", "checked"})."""
    if isinstance(doc, dict) and "response" in doc:
        doc = doc["response"]
    if isinstance(doc, str):
        doc = json.loads(doc)
    if isinstance(doc, list):
        if len(doc) != 1:
            raise ValueError("the response holds %d rows, not the UPDATE's one" % len(doc))
        doc = doc[0]
    if isinstance(doc, dict) and "keys" not in doc and len(doc) == 1:
        doc = next(iter(doc.values()))
        if isinstance(doc, str):
            doc = json.loads(doc)
    if not isinstance(doc, dict) or not isinstance(doc.get("keys"), list):
        raise ValueError("no returned keys in the response")
    if int(doc.get("returned", -1)) != len(doc["keys"]):
        raise ValueError("the response says %s rows and lists %d" % (doc.get("returned"), len(doc["keys"])))
    return doc


def rollback_from(receipt: dict, migrate) -> str:
    """The rollback for the rows the UPDATE returned, and only those: it moves them back to "unequal", and the
    follow_verdict trigger then unmarks any it had marked checked."""
    got = returned_value(migrate)
    by_i = {c["i"]: c for c in receipt["records"]}
    missing = [i for i in got["keys"] if i not in by_i]
    if missing:
        raise ValueError("returned places the receipt does not list: %s" % missing[:10])
    rows = [by_i[i] for i in sorted(set(got["keys"]))]
    if not rows:
        return "-- the UPDATE moved no row: nothing to roll back\n"
    return update_sql(rows, "unequal", "equal")


FOLLOW_VERDICT = (
    "The follow_verdict trigger (program_requirement_records_follow_verdict, chatbox/supabase_program_record_verdicts.sql) "
    "runs on this UPDATE. Where a person's latest verdict on the row is a confirm whose fingerprint matches the record, "
    "and the machine checks now pass, it marks the row checked, and a checked row is public. The UPDATE returns those "
    "rows' places as \"checked\". The rollback reverses this: it moves checks.arithmetic back to \"unequal\", the "
    "machine checks fail again, and the trigger unmarks the row.")
PERSON_SETTLED = (
    "Person-settled rows win. The UPDATE writes checks.arithmetic alone, only where the row still holds the filed run "
    "and still reads \"unequal\" (the machine's value). It never writes the record, checked, checked_by or checked_at: "
    "the trigger sets those from a person's verdict, a confirm marks the row checked and any other verdict (needs a "
    "fix) keeps it unchecked. A person's reload or reread changes the run and drops the row out of the guard.")


def pre_read_sql(changed: list[dict]) -> str:
    """One SELECT returning one JSON value: the receipt's rows as they stand live, and each one's latest verdict."""
    return ("with v(i, college, control_number, extracted_run) as (values\n  %s)\n"
            "select json_build_object(\n"
            "  'listed', (select count(*) from v),\n"
            "  'on_run_unequal', count(*) filter (where r.extracted_run = v.extracted_run and r.checks->>'arithmetic' = 'unequal'),\n"
            "  'on_run_equal', count(*) filter (where r.extracted_run = v.extracted_run and r.checks->>'arithmetic' = 'equal'),\n"
            "  'off_run', count(*) filter (where r.extracted_run is distinct from v.extracted_run),\n"
            "  'checked_now', count(*) filter (where r.checked),\n"
            "  'verdict_confirm_fp_match', count(*) filter (where pv.verdict = 'confirm' and pv.requirements_fp = public.program_record_fp(r.record)),\n"
            "  'verdict_other_fp_match', count(*) filter (where pv.verdict <> 'confirm' and pv.requirements_fp = public.program_record_fp(r.record)))\n"
            "  from v join public.program_requirement_records r\n"
            "    on r.college = v.college and r.control_number = v.control_number\n"
            "  left join lateral (select verdict, requirements_fp from public.program_record_verdicts x\n"
            "                      where x.college = r.college and x.control_number = r.control_number\n"
            "                      order by x.id desc limit 1) pv on true;" % _values(changed))


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--check", action="store_true", help="fail when a filed record would change; write nothing")
    ap.add_argument("--tag", default="s392", help="the receipt's session tag")
    ap.add_argument("--rollback-from", help="a migrate receipt (or the UPDATE's returned value): write the rollback for "
                                            "the rows it returned into --receipt")
    ap.add_argument("--receipt", help="the rescore receipt --rollback-from completes")
    args = ap.parse_args(argv)
    if args.rollback_from:
        if not args.receipt:
            ap.error("--rollback-from needs --receipt")
        with open(args.receipt) as fh:
            receipt = json.load(fh)
        with open(args.rollback_from) as fh:
            migrate = json.load(fh)
        got = returned_value(migrate)
        receipt["rollback"] = rollback_from(receipt, migrate)
        receipt["applied"] = {"from": os.path.relpath(os.path.abspath(args.rollback_from), ROOT),
                              "returned": len(got["keys"]), "checked": got.get("checked") or []}
        with open(args.receipt, "w") as fh:
            json.dump(receipt, fh, ensure_ascii=False, indent=1)
            fh.write("\n")
        print("rollback for %d returned rows (%d marked checked) written to %s"
              % (len(got["keys"]), len(got.get("checked") or []), args.receipt))
        return 0
    changed = run(write=not args.check)
    for i, c in enumerate(changed, 1):
        c["i"] = i
    by = {}
    for c in changed:
        by.setdefault((c["college"], c["how"]), []).append(c["control_number"])
    for (college, how), keys in sorted(by.items()):
        print("%s, %s: %d (%s)" % (college, how, len(keys), ", ".join(keys)))
    if args.check:
        if changed:
            print("%d filed records score differently under the current rule: run kb/_program_requirements_rescore.py"
                  % len(changed))
            return 1
        print("every filed record's degree arithmetic is scored by the current rule")
        return 0
    if not changed:
        print("nothing to rescore")
        return 0
    path = os.path.join(RECEIPTS, "program_requirement_records_rescore_%s_%s.json"
                        % (time.strftime("%Y-%m-%d", time.gmtime()), args.tag))
    receipt = {"rule": "Open Asks Sheet 81 cards 1 (count) and 2 (adt) and Sheet 82 card 2 (overlap), Sam, 2026-10-14; "
                       "Sheet 120 card 1 (narrow: a printed total the low end meets exactly passes as meets), Sam, 2026-10-23; "
                       "Sam's rulings of 2026-11-17 (a short high end passes; a local degree's major counts toward "
                       "general education)",
               "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
               "rescored": len(changed), "records": changed,
               "pre_read": pre_read_sql(changed),
               "apply": update_sql(changed, "equal", "unequal"),
               "follow_verdict": FOLLOW_VERDICT,
               "person_settled": PERSON_SETTLED,
               "rollback": None,
               "rollback_how": ("Built from the UPDATE's returned value, after it runs: python3 "
                                "kb/_program_requirements_rescore.py --rollback-from <the migrate receipt> --receipt "
                                "<this file>. It moves back only the rows the UPDATE returned."),
               "applied": None}
    with open(path, "w") as fh:
        json.dump(receipt, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    print("%d records rescored; receipt %s" % (len(changed), os.path.relpath(path, ROOT)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
