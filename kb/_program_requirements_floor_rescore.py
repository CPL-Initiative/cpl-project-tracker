#!/usr/bin/env python3
"""Rescore the filed program records under the printed floor, and write the receipt that moves the live rows.

Sam, Open Asks Sheet 144 card 2 "floor" (17:50Z 2026-10-30, his own call): a choose-courses list's printed
units are its floor, never its ceiling (block_units in kb/_program_requirements_score.py). S529 read the 44
records the plainer "printed" reading would unpass and found most of them faithful: the list prints the low
end of a range the program's own total carries.

kb/_program_requirements_rescore.py re-reads how a record's stored sum meets its printed total and never
re-adds the blocks, so it cannot apply a block-level rule. This one re-adds each record's blocks twice, as the
blocks summed (block_units_summed) and under the floor (block_units), against the program total the page
prints, and moves only a record whose stored arithmetic status agrees with the summed reading, so a record the
filed run scored on its closed list's units is never re-judged on the record's own. It leaves alone a record
whose arithmetic carries a figure the program check does not make (general education, an electives fill, a
total-only page) and one whose degree check fails.

    python3 kb/_program_requirements_floor_rescore.py          # rewrite the moved records, write the receipt
    python3 kb/_program_requirements_floor_rescore.py --check  # fail when a filed record would move

The receipt (kb/receipts/program_requirement_records_floor_rescore_<date>_<tag>.json) names every moved
record with its run, one guarded UPDATE per move (only where the live row still holds that run and still reads
the old status) and the UPDATE that takes it back (Rule 10 a2).
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
import _program_requirements_score as s  # noqa: E402

ROOT = os.path.dirname(HERE)
GLOB = os.path.join(HERE, "program_requirements_college", "*", "records", "*.json")
RECEIPTS = os.path.join(HERE, "receipts")
RULE = 'Open Asks Sheet 144 card 2 "floor", Sam, 2026-10-30'
# Figures score() adds outside the program check; a record carrying one is left as filed.
OUTSIDE = ("ge_included", "fill", "total_only")


def _status(rec: dict, prog: dict, stated: tuple, units) -> tuple[str, tuple, dict | None]:
    saved = s.block_units
    s.block_units = units
    try:
        (lo, hi), why = s.program_units(rec, {})
    finally:
        s.block_units = saved
    if why:
        return "incomplete", (lo, hi), None
    v = s.program_verdict(prog, stated, lo, hi)
    return v["status"], (lo, hi), v


def move(filed: dict) -> tuple[str, dict | None]:
    """(why it stays, None) or ("", the new arithmetic)."""
    rec = filed.get("record") or {}
    if not any(b.get("rule") == "choose_courses" and s._span(b.get("stated")) for b in rec.get("blocks") or []):
        return "no printed list", None
    prog = rec.get("program") or {}
    stated = s._span(prog.get("total_units"))
    arith = (filed.get("score") or {}).get("arithmetic") or {}
    if not stated or arith.get("against") not in ("program", None):
        return "no program total", None
    before, _, _ = _status(rec, prog, stated, s.block_units_summed)
    after, (lo, hi), v = _status(rec, prog, stated, s.block_units)
    if before == after:
        return "unmoved", None
    if arith.get("status") != before:
        return "filed status differs", None
    if any(arith.get(k) for k in OUTSIDE):
        return "a figure outside the program check", None
    if after == "equal" and arith.get("degree") and not arith["degree"].get("pass"):
        return "its degree check fails", None
    new = {k: arith[k] for k in ("degree", "major") if k in arith}
    if v is None:
        new.update({"pass": False, "status": "incomplete", "computed": [lo, hi], "stated": list(stated),
                    "against": "program", "why": ["a list's courses cannot be added"]})
    else:
        new.update(v)
        new.update({"computed": [lo, hi], "stated": list(stated), "against": "program"})
        new.setdefault("why", [])
    new["rescored"] = RULE
    return "", new


def passes(score: dict) -> bool:
    return all((score.get(k) or {}).get("pass") for k in ("coverage", "invented", "arithmetic", "repeated", "outcomes"))


def run(write: bool) -> tuple[list[dict], dict]:
    moved, kept = [], {}
    for path in sorted(glob.glob(GLOB)):
        with open(path) as fh:
            filed = json.load(fh)
        why, new = move(filed)
        if new is None:
            kept[why] = kept.get(why, 0) + 1
            continue
        old = filed["score"]["arithmetic"]["status"]
        moved.append({"college": filed["college"], "control_number": filed["control_number"],
                      "extracted_run": filed.get("extracted_run"), "from": old, "to": new["status"],
                      "computed": new["computed"], "stated": new["stated"], "path": os.path.relpath(path, ROOT)})
        if write:
            filed["score"]["arithmetic"] = new
            filed["score"]["pass"] = passes(filed["score"])
            with open(path, "w") as fh:
                json.dump(filed, fh, ensure_ascii=False, indent=1)
                fh.write("\n")
    return moved, kept


def _q(v: str) -> str:
    return "'%s'" % str(v).replace("'", "''")


def update_sql(rows: list[dict], to: str, frm: str) -> str:
    vals = ",\n  ".join("(%s, %s, %s)" % (_q(r["college"]), _q(r["control_number"]), int(r["extracted_run"]))
                        for r in rows)
    return ("update public.program_requirement_records r\n"
            "   set checks = jsonb_set(r.checks, '{arithmetic}', '\"%s\"')\n"
            "  from (values\n  %s) as v(college, control_number, extracted_run)\n"
            " where r.college = v.college and r.control_number = v.control_number\n"
            "   and r.extracted_run = v.extracted_run and r.checks->>'arithmetic' = '%s'\n"
            "returning r.college, r.control_number;" % (to, vals, frm))


def one_statement(pairs: dict, back: bool = False) -> str:
    """Every move in one guarded statement that returns one row, a count per move, for the SQL editor (which
    shows only a script's last result). back=True takes each move back."""
    ctes, cols = [], []
    for i, ((frm, to), rows) in enumerate(sorted(pairs.items())):
        a, b = (to, frm) if back else (frm, to)
        vals = ",".join("(%s,%s,%d)" % (_q(r["college"]), _q(r["control_number"]), int(r["extracted_run"]))
                        for r in rows)
        ctes.append("u%d as (update public.program_requirement_records r set checks = jsonb_set(r.checks,"
                    "'{arithmetic}','\"%s\"') from (values %s) as v(college,control_number,extracted_run) "
                    "where r.college=v.college and r.control_number=v.control_number and "
                    "r.extracted_run=v.extracted_run and r.checks->>'arithmetic'='%s' returning 1)" % (i, b, vals, a))
        cols.append("(select count(*) from u%d) as \"%s->%s\"" % (i, a, b))
    return "with " + ",\n".join(ctes) + "\nselect " + ", ".join(cols) + ";"


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--check", action="store_true", help="fail when a filed record would move; write nothing")
    ap.add_argument("--tag", default="s529", help="the receipt's session tag")
    args = ap.parse_args(argv)
    moved, kept = run(write=not args.check)
    pairs: dict = {}
    for m in moved:
        pairs.setdefault((m["from"], m["to"]), []).append(m)
    for (frm, to), rows in sorted(pairs.items()):
        print("%-10s -> %-10s %4d records" % (frm, to, len(rows)))
    print("left as filed: " + ", ".join("%s %d" % (k, v) for k, v in sorted(kept.items())))
    if args.check:
        if moved:
            print("%d filed records score differently under the printed floor: run "
                  "kb/_program_requirements_floor_rescore.py" % len(moved))
            return 1
        print("every filed record is scored under the printed floor")
        return 0
    if not moved:
        print("nothing to rescore")
        return 0
    path = os.path.join(RECEIPTS, "program_requirement_records_floor_rescore_%s_%s.json"
                        % (time.strftime("%Y-%m-%d", time.gmtime()), args.tag))
    receipt = {"rule": RULE, "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "moved": len(moved),
               "by_move": {"%s->%s" % k: len(v) for k, v in sorted(pairs.items())},
               "records": moved,
               "apply": [update_sql(rows, to, frm) for (frm, to), rows in sorted(pairs.items())],
               "rollback": [update_sql(rows, frm, to) for (frm, to), rows in sorted(pairs.items())],
               "apply_one": one_statement(pairs), "rollback_one": one_statement(pairs, back=True),
               "applied": None}
    with open(path, "w") as fh:
        json.dump(receipt, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    print("%d records rescored; receipt %s" % (len(moved), os.path.relpath(path, ROOT)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
