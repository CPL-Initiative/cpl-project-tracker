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

    python3 kb/_program_requirements_rescore.py           # rewrite the records it passes, write the receipt
    python3 kb/_program_requirements_rescore.py --check   # fail when a filed record would change

The receipt (kb/receipts/program_requirement_records_rescore_<date>_<tag>.json)
names every record it passed with its run, and carries the guarded UPDATE that
moves the live row's checks.arithmetic from "unequal" to "equal" (only where the
row still holds that run and still reads "unequal") and the UPDATE that takes it
back (Rule 10 a2). The display build follows, through the display job.
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
    new.setdefault("why", [])
    new["rescored"] = ("Open Asks Sheet 120 card 1" if v.get("meets")
                       else "Open Asks Sheet 82" if v.get("overlap") else "Open Asks Sheet 81")
    return new


def arith_against(filed: dict) -> str | None:
    return (((filed.get("score") or {}).get("arithmetic") or {}).get("against"))


def how(new: dict) -> str:
    for k in ("meets", "within", "overlap", "transfer", "minimum"):
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
            filed["score"]["arithmetic"] = new
            filed["score"]["pass"] = passes(filed["score"])
            with open(path, "w") as fh:
                json.dump(filed, fh, ensure_ascii=False, indent=1)
                fh.write("\n")
    return changed


def update_sql(changed: list[dict], to: str, frm: str) -> str:
    vals = ",\n  ".join("(%s, %s, %s)" % (_q(c["college"]), _q(c["control_number"]), int(c["extracted_run"]))
                        for c in changed)
    return ("update public.program_requirement_records r\n"
            "   set checks = jsonb_set(r.checks, '{arithmetic}', '\"%s\"')\n"
            "  from (values\n  %s) as v(college, control_number, extracted_run)\n"
            " where r.college = v.college and r.control_number = v.control_number\n"
            "   and r.extracted_run = v.extracted_run and r.checks->>'arithmetic' = '%s'\n"
            "returning r.college, r.control_number;" % (to, vals, frm))


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--check", action="store_true", help="fail when a filed record would change; write nothing")
    ap.add_argument("--tag", default="s392", help="the receipt's session tag")
    args = ap.parse_args(argv)
    changed = run(write=not args.check)
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
                       "Sheet 120 card 1 (narrow: a printed total the low end meets exactly passes as meets), Sam, 2026-10-23",
               "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
               "rescored": len(changed), "records": changed,
               "apply": update_sql(changed, "equal", "unequal"),
               "rollback": update_sql(changed, "unequal", "equal"),
               "applied": None}
    with open(path, "w") as fh:
        json.dump(receipt, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    print("%d records rescored; receipt %s" % (len(changed), os.path.relpath(path, ROOT)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
