#!/usr/bin/env python3
"""S713: the plan for what the three general education reconcile runs filed (kb/_program_ge_steps_s713.py).

The conductor's d-ge-steps-three-colleges-s713. The free reconcile job (program-requirements-college.yml,
step=reconcile, extract=0) read each college's pages again and filed its records on claude/s713-piles-ge:
Las Positas 45127792228, Antelope Valley 45133183717, College of Marin 45135695869. A record the run changed carries
the run as its extracted_run.

THE PLAN. Every record at the three colleges whose load image (load_rows in kb/_program_requirements_college.py)
moves in its record or its checks between the base commit (BASE, main's records) and the branch's head is one full-row
row: the live row takes the after-image's record, checks and run, only where it still holds the before-image's run,
record and checks and no person has checked it. A record the run restamped and left the same in record and checks
takes no row. The guarded UPDATE aborts, writing nothing, unless it matches the plan's count less the rows a person
checked, and unless no row's latest verdict is a confirm whose fingerprint matches the after-image's record (the
follow_verdict trigger would check such a row at the apply, and the rollback would skip it; #3705's second reader).

    python3 kb/_program_ge_plan_s713.py --base 210837a1f --tag s713ge           # the receipt and the SQL files
    python3 kb/_program_ge_plan_s713.py --base 210837a1f --dry-run

Guard: tests/program_ge_steps_s713_test.py.
"""
from __future__ import annotations

import argparse
import io
import json
import os
import subprocess
import sys
import tarfile
import tempfile
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _guarded_sql as GS  # noqa: E402
import _program_ge_steps_s713 as G  # noqa: E402
import _program_requirements_college as C  # noqa: E402
import _program_requirements_score as S  # noqa: E402

ROOT = os.path.dirname(HERE)
RUNS = {"Las Positas College": "45127792228", "Antelope Valley College": "45133183717",
        "College of Marin": "45135695869"}
# What each run's reconcile step printed (its job log).
RUN_NOTES = {
    "Las Positas College": "the step set LPC-GE's units on 6 local degrees; 5 pass, 09227 adds to 59-61 against 60",
    "Antelope Valley College": "the fill read the printed figure on 5 local degrees; 4 pass, 39295 adds to 57-63 "
                               "against 60",
    "College of Marin": ("'reconcile: 0 filed records changed, 0 rescored, 45 had no fresh page (45 of them on another "
                         "page)': the capture now finds each program at a URL of another form (.../program,a-a-in-... "
                         "where the records were read from .../program/a-a-in-...), and the moved-page guard reads no "
                         "text it did not extract from. The step never ran on 19789 or 19791: no row."),
}
KEYS = ("program_title", "award", "catalog_year", "source_url", "measure", "total_min", "total_max", "record",
        "checks", "extracted_run")


def images_at(base: str, college: str) -> dict:
    """{control number: load image} of the college's committed folder at the commit base."""
    slug = C.slug_of(college)
    rel = "kb/program_requirements_college/%s" % slug
    blob = subprocess.run(["git", "-C", ROOT, "archive", "--format=tar", base, rel], capture_output=True, check=True)
    with tempfile.TemporaryDirectory() as tmp:
        with tarfile.open(fileobj=io.BytesIO(blob.stdout)) as tf:
            tf.extractall(tmp, filter="data")
        rows = C.load_rows(college, os.path.join(tmp, rel))[0]
    return {str(r["control_number"]): r for r in rows}


def images_now(college: str) -> dict:
    return {str(r["control_number"]): r for r in C.load_rows(college)[0]}


def _passes(img: dict) -> bool:
    c = img.get("checks") or {}
    return c.get("coverage") is True and c.get("invented") is True and c.get("arithmetic") == "equal"


def plan(base: str) -> dict:
    rows, restamped, counts_only, same_verdict = [], [], [], []
    for college in RUNS:
        before, after = images_at(base, college), images_now(college)
        for cn in sorted(after):
            b, a = before.get(cn), after[cn]
            if b is None:
                continue
            if b["record"] == a["record"]:
                # The run's rescore with today's closed list moved only the placed and listed counts (18018: 71 to
                # 73), or nothing: no step wrote the record, so the row stays out of this plan.
                if b["checks"] != a["checks"]:
                    counts_only.append([college, cn, _passes(b), _passes(a)])
                elif b["extracted_run"] != a["extracted_run"]:
                    restamped.append([college, cn])
                continue
            if _passes(b) == _passes(a):
                # The conductor (S713): the plan writes only what changes a verdict. A step wrote the record (09227
                # and 39295 took their general education units) and it still fails, so the live row keeps its old
                # record until the college's next reread posts the committed one.
                same_verdict.append([college, cn, _passes(a), (a.get("checks") or {}).get("arithmetic")])
                continue
            rows.append({"college": college, "control_number": cn, "award": a.get("award"),
                         "passes_before": _passes(b), "passes_after": _passes(a),
                         "target": cn in G.TARGETS.get(college, {}),
                         "before_image": {k: b[k] for k in KEYS}, "after_image": {k: a[k] for k in KEYS}})
    for i, r in enumerate(rows, 1):
        r["i"] = i
    return {"rows": rows, "restamped_not_planned": restamped, "counts_only_not_planned": counts_only,
            "record_written_verdict_same_not_planned": same_verdict}


def _q(s) -> str:
    return "'%s'" % str(s).replace("'", "''")


def _jb(v) -> str:
    return "%s::jsonb" % _q(json.dumps(v, ensure_ascii=False, sort_keys=True, separators=(",", ":")))


V = ("with v(i, college, control_number, before_run, before_record, before_checks, after_run, after_record, "
     "after_checks) as (values\n  %s)")


def _values(rows: list[dict]) -> str:
    return ",\n  ".join("(%d, %s, %s, %d, %s, %s, %d, %s, %s)" % (
        r["i"], _q(r["college"]), _q(r["control_number"]), int(r["before_image"]["extracted_run"]),
        _jb(r["before_image"]["record"]), _jb(r["before_image"]["checks"]), int(r["after_image"]["extracted_run"]),
        _jb(r["after_image"]["record"]), _jb(r["after_image"]["checks"])) for r in rows)


def _update(to: str, frm: str) -> str:
    return ("update public.program_requirement_records r\n"
            "   set record = v.%s_record, checks = v.%s_checks, extracted_run = v.%s_run\n"
            "  from v\n"
            " where r.college = v.college and r.control_number = v.control_number\n"
            "   and r.extracted_run = v.%s_run and r.record = v.%s_record and r.checks = v.%s_checks"
            % (to, to, to, frm, frm, frm))


LATEST = ("join lateral (select pv.verdict, pv.requirements_fp from public.program_record_verdicts pv\n"
          "                       where pv.college = v.college and pv.control_number = v.control_number\n"
          "                       order by pv.id desc limit 1) lv on true")
CONFIRM_CTE = ("f as (select count(*) as n, coalesce(json_agg(v.i order by v.i), '[]'::json) as keys\n"
               "        from v " + LATEST + "\n"
               "       where lv.verdict = 'confirm' and lv.requirements_fp = public.program_record_fp(v.after_record))")


def apply_sql(rows: list[dict], tag: str) -> str:
    sql = GS.guarded(V % _values(rows), _update("after", "before"), len(rows), tag)
    head = "e(expect) as (values (%d)),\n" % len(rows)
    tail = "select case when s.n = e.expect - c.n\n"
    assert sql.count(head) == 1 and sql.count(tail) == 1 and sql.count("  from s, c, e;") == 1
    sql = sql.replace(head, CONFIRM_CTE + ",\n" + head)
    sql = sql.replace(tail, "select case when f.n > 0\n"
                            "            then ('%s confirm guard: ' || f.n || ' rows hold a confirm verdict matching "
                            "the new record ' || f.keys::text)::int::text::json\n"
                            "            when s.n = e.expect - c.n\n" % tag)
    return sql.replace("  from s, c, e;", "  from s, c, e, f;")


def rollback_sql(rows: list[dict], tag: str) -> str:
    return GS.guarded(V % _values(rows), _update("before", "after"), len(rows), tag + " rollback", rollback=True)


def pre_read_sql(rows: list[dict]) -> str:
    return (V % _values(rows) + "\n"
            "select json_build_object(\n"
            "  'listed', (select count(*) from v),\n"
            "  'on_run', count(*) filter (where r.extracted_run = v.before_run),\n"
            "  'both_before', count(*) filter (where r.extracted_run = v.before_run and r.record = v.before_record "
            "and r.checks = v.before_checks),\n"
            "  'already_after', count(*) filter (where r.extracted_run = v.after_run and r.record = v.after_record "
            "and r.checks = v.after_checks),\n"
            "  'checked_now', count(*) filter (where r.checked),\n"
            "  'confirm_matches_after', count(*) filter (where lv.verdict = 'confirm' "
            "and lv.requirements_fp = public.program_record_fp(v.after_record)))\n"
            "  from v join public.program_requirement_records r\n"
            "    on r.college = v.college and r.control_number = v.control_number\n"
            "  left " + LATEST + ";")


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--base", required=True)
    ap.add_argument("--tag", default="s713ge")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--measured", help="the step measure written before the runs (kb/_program_ge_steps_s713.py --json)")
    a = ap.parse_args(argv)
    res = plan(a.base)
    rows = res["rows"]
    by = {}
    for r in rows:
        k = "%s: %s" % (r["college"], "passes" if r["passes_after"] else "fails")
        by[k] = by.get(k, 0) + 1
    print("plan: %d rows (%s); restamped, no row: %d; counts only, no row: %d (a pass state moved: %s)" % (
        len(rows), json.dumps(by), len(res["restamped_not_planned"]), len(res["counts_only_not_planned"]),
        [x for x in res["counts_only_not_planned"] if x[2] != x[3]]))
    for r in rows:
        print("  %(i)d %(college)s %(control_number)s pass %(passes_before)s -> %(passes_after)s target %(target)s" % r)
    if a.dry_run or not rows:
        return 0
    day = time.strftime("%Y-%m-%d", time.gmtime())
    measured = None
    if a.measured:
        with open(a.measured, encoding="utf-8") as fh:
            measured = json.load(fh)
    path = os.path.join(HERE, "receipts", "program_requirement_records_ge_steps_%s_%s.json" % (day, a.tag))
    body = {"rule": "d-ge-steps-three-colleges-s713: three general education reconcile steps",
            "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "base": a.base, "runs": RUNS,
            "run_notes": RUN_NOTES,
            "held_for_person": [list(k) + [v] for k, v in G.HELD_FOR_PERSON.items()],
            "measured_before_the_runs": measured, "by": by, "rows": len(rows),
            "restamped_not_planned": res["restamped_not_planned"],
            "counts_only_not_planned": res["counts_only_not_planned"],
            "record_written_verdict_same_not_planned": res["record_written_verdict_same_not_planned"],
            "records": rows,
            "follow_verdict": ("The record changes, so a confirm given on the old record no longer matches. The apply "
                               "aborts, writing nothing, if any row's latest verdict is a confirm matching the new "
                               "record's fingerprint; the pre-read counts them (confirm_matches_after)."),
            "pre_read": pre_read_sql(rows), "apply": apply_sql(rows, a.tag), "rollback": rollback_sql(rows, a.tag)}
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(body, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    rel = os.path.relpath(path, ROOT)
    hdr = ("-- %s: the three general education reconcile steps (Las Positas, Antelope Valley, College of Marin), %d\n"
           "-- full-row rows: record, checks and run to the reconcile run's filing. Receipt: %s.\n"
           % (a.tag.upper(), len(rows), rel))
    base = os.path.join(HERE, "migrations", "%s_%s_prreq_ge_steps_" % (day, a.tag))
    for name, text in (("preread.sql", "-- Pre-read, read-only: one SELECT, one JSON value.\n" + body["pre_read"]),
                       ("apply.sql", "-- Guarded UPDATE; aborts unless %d rows less those a person checked, and "
                                     "unless no confirm matches the new record.\n" % len(rows) + body["apply"]),
                       ("rollback.sql", "-- Rollback, NOT applied: the before-image back where the row holds the "
                                        "after-image. Revert the record files too.\n" + body["rollback"])):
        with open(base + name, "w", encoding="utf-8") as fh:
            fh.write(hdr + text + "\n")
    print("receipt %s" % rel)
    return 0


if __name__ == "__main__":
    sys.exit(main())
