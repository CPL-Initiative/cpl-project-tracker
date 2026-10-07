#!/usr/bin/env python3
"""Load the harvest's program records into program_requirement_records, for Sierra.

Sam, open-asks sheet 29 card 4 (2026-10-04, "yes"): where a program's record
passed all four checks, Sierra may say a course is required, name each choose
block and give the program total, citing the catalog and its year. This builds
the upsert that puts the filed records where Sierra reads them
(chatbox/supabase_program_requirement_records.sql).

CHECKED means all four checks passed, read from the files, never assumed:
  1-3. the scorer's verdict filed with the record (coverage, no invented course,
       unit arithmetic): record["score"]["pass"];
  4.   Sam's reading (kb/program_requirements_pilot/review_2026-10-04.json): a
       card ruled "ok", or ruled "fix" and re-extracted after his reading (the
       fix is carried out through the shape, the prompt or the scorer, then a
       rerun, never a hand edit; FIXED_BY names the rerun), and only while the
       record's requirements are the ones that verdict covers
       (kb/program_requirements_pilot/reviewed_readings.json, S334): a rerun
       that adds outcomes (record shape 3) keeps the verdict, and one that
       changes a block loses it until a person reads it again.
A record failing any of them loads with checked false, and the public read
never shows it.

It writes SQL and nothing else. A session applies the file (the first load:
migration program_requirement_records_load_2026_10_04). The repo's files are the
source of truth; --check fails when the committed SQL no longer matches them.

    python3 kb/_program_requirements_load.py            # write the SQL
    python3 kb/_program_requirements_load.py --check    # compare, write nothing
"""
from __future__ import annotations

import argparse
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
from _program_requirements_score import requirements_md5  # noqa: E402
PILOT = os.path.join(ROOT, "kb", "program_requirements_pilot")
REVIEW = os.path.join(PILOT, "review_2026-10-04.json")
READINGS = os.path.join(PILOT, "reviewed_readings.json")
OUT = os.path.join(ROOT, "kb", "receipts", "program_requirement_records_load_2026-10-04.sql")

# The rerun that carried out Sam's two fixes (S324, PR #1846): a "fix" card is
# checked only when its filed record came from a run at or after this one.
FIXED_BY = 37195340082

# Words the Supabase connector holds a statement on for a confirmation a
# remote session cannot answer (cpl_memory
# connector-confirm-matches-words-in-quoted-text-2026-10-03). The load must
# name none, or it stalls.
STALL = re.compile(r"\b(drop|delete|revoke|truncate)\b", re.I)


def q(v) -> str:
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return repr(v)
    return "'" + str(v).replace("'", "''") + "'"


def qjson(v) -> str:
    return q(json.dumps(v, ensure_ascii=False, sort_keys=True, separators=(",", ":"))) + "::jsonb"


def verdict_holds(verdict: str | None, run: int | None, read_md5: str | None, record: dict) -> bool:
    """Whether a person's verdict still covers this record: "ok", or "fix" on a
    rerun at or after FIXED_BY, and the requirements are the ones read."""
    ruled = verdict == "ok" or (verdict == "fix" and (run or 0) >= FIXED_BY)
    return bool(ruled and read_md5 and read_md5 == requirements_md5(record))


def record_read(record: dict) -> dict:
    """What a reader renders: the program (its outcomes included, as printed),
    the blocks, and course outcomes where the record carries any (shape 3)."""
    out = {"program": record["program"], "blocks": record.get("blocks") or []}
    if record.get("course_outcomes"):
        out["course_outcomes"] = record["course_outcomes"]
    return out


def rows(folder: str = "records") -> list[dict]:
    """The load's rows from records/. The ROEP display builder also reads
    records_maps/ through this (S340): the records filed there wait on Sam's go
    to enter the table, so the load itself never reads that folder."""
    review = json.load(open(REVIEW))
    verdicts = review.get("verdicts") or {}
    readings = json.load(open(READINGS))["readings"]
    out = []
    for path in sorted(glob.glob(os.path.join(PILOT, folder, "*.json"))):
        key = os.path.splitext(os.path.basename(path))[0]
        rec = json.load(open(path))
        src = json.load(open(os.path.join(ROOT, rec["source_file"])))
        score = rec.get("score") or {}
        verdict = (verdicts.get(key) or {}).get("v")
        run = rec.get("extracted_run")
        human = verdict_holds(verdict, run, (readings.get(key) or {}).get("requirements_md5"),
                              rec["record"])
        program = rec["record"]["program"]
        total = program.get("total_units") or {}
        out.append({
            "college": rec["college"],
            "control_number": rec["control_number"],
            "program_title": src.get("title") or rec.get("title"),
            "award": src.get("award"),
            "catalog_year": src.get("catalog_year"),
            "source_url": (src.get("source") or {}).get("url"),
            "measure": program.get("measure") or "units",
            "total_min": total.get("min"),
            "total_max": total.get("max"),
            # Only what a reader renders: the extraction's working notes and its
            # missing_explained list stay in the repo's file, out of the public read.
            "record": record_read(rec["record"]),
            "checks": {"coverage": (score.get("coverage") or {}).get("pass"),
                       "invented": (score.get("invented") or {}).get("pass"),
                       "arithmetic": (score.get("arithmetic") or {}).get("status"),
                       "reviewer": {"by": review.get("by"), "verdict": verdict,
                                    "sheet": review.get("sheet")}},
            "checked": bool(score.get("pass")) and human,
            "checked_by": review.get("by") if human else None,
            "checked_at": review.get("at") if human else None,
            "extracted_run": run,
        })
    return out


COLS = ["college", "control_number", "program_title", "award", "catalog_year", "source_url",
        "measure", "total_min", "total_max", "record", "checks", "checked", "checked_by",
        "checked_at", "extracted_run"]


def sql(rs: list[dict]) -> str:
    vals = []
    for r in rs:
        cells = [qjson(r[c]) if c in ("record", "checks") else
                 (q(r[c]) + "::timestamptz" if c == "checked_at" and r[c] else q(r[c]))
                 for c in COLS]
        vals.append("  (" + ", ".join(cells) + ")")
    sets = ",\n  ".join("%s = excluded.%s" % (c, c) for c in COLS[2:])
    n_checked = sum(1 for r in rs if r["checked"])
    return ("-- Generated by kb/_program_requirements_load.py from kb/program_requirements_pilot/ "
            "(%d records, %d checked).\n-- Do not edit; rerun the loader.\n"
            "insert into public.program_requirement_records (%s)\nvalues\n%s\n"
            "on conflict (college, control_number) do update set\n  %s,\n  loaded_at = now();\n"
            % (len(rs), n_checked, ", ".join(COLS), ",\n".join(vals), sets))


# ── Record shape 3: the outcomes, as a guarded delta (S334) ─────────────────
# The live rows hold the records as first loaded. Shape 3 adds only the
# outcomes, so the write sets record.program.outcomes (and course_outcomes where
# a record has any) on each row whose record is still the one before them, in
# the insert ... select form the connector carries (a bare UPDATE stalls it,
# lesson S327-2). md5(record::text) before and after is computed here the way
# Postgres prints jsonb, so one read-only query proves either state.
OUTCOMES_DELTA = os.path.join(ROOT, "kb", "receipts", "program_requirement_records_outcomes_2026-10-05.sql")


def without_outcomes(record: dict) -> dict:
    out = json.loads(json.dumps(record))
    out["program"].pop("outcomes", None)
    out.pop("course_outcomes", None)
    return out


def record_md5(record: dict) -> str:
    import hashlib
    from _build_roep_display import jsonb_text
    return hashlib.md5(jsonb_text(record).encode()).hexdigest()


def outcomes_delta_sql(rs: list[dict]) -> str:
    lines = ["-- Generated by kb/_program_requirements_load.py --outcomes-delta. Do not edit; rerun the loader.",
             "-- Record shape 3 (Sam, sheet 33 card 4): each program's outcomes as its catalog prints them,",
             "-- grafted from extraction run 37345734457 onto the records Sam read (kb/_program_requirements_file.py).",
             "-- Sets record.program.outcomes on each row whose record is still the one before them (its md5).",
             "-- Rollback: set record to record #- '{program,outcomes}' on the same keys; the before md5 then matches."]
    for r in rs:
        rec = r["record"]
        before = without_outcomes(rec)
        expr = "jsonb_set(r.record, '{program,outcomes}', %s)" % qjson(rec["program"].get("outcomes") or [])
        if rec.get("course_outcomes"):
            expr = "jsonb_set(%s, '{course_outcomes}', %s)" % (expr, qjson(rec["course_outcomes"]))
        lines.append(
            "insert into public.program_requirement_records (college, control_number, program_title, measure, record, checks, display) "
            "select r.college, r.control_number, r.program_title, r.measure, %s, r.checks, r.display "
            "from public.program_requirement_records r where r.college = %s and r.control_number = %s "
            "and md5(r.record::text) = %s on conflict (college, control_number) do update set record = excluded.record;"
            % (expr, q(r["college"]), q(r["control_number"]), q(record_md5(before))))
    return "\n".join(lines) + "\n"


def outcomes_verify_sql(rs: list[dict]) -> str:
    vals = ",\n  ".join("(%s, %s, %s, %s)" % (q(r["college"]), q(r["control_number"]),
                                               q(record_md5(without_outcomes(r["record"]))), q(record_md5(r["record"])))
                        for r in rs)
    return ("-- Read-only. 'after' on every row once the outcomes are written; 'before' until then.\n"
            "select v.college, v.control_number, case when r.record is null then 'missing' "
            "when md5(r.record::text) = v.after then 'after' when md5(r.record::text) = v.before then 'before' "
            "else 'differs' end as state\nfrom (values\n  %s\n) v(college, control_number, before, after)\n"
            "left join public.program_requirement_records r using (college, control_number)\norder by 3, 1, 2;\n" % vals)


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--check", action="store_true", help="compare with the committed SQL; write nothing")
    ap.add_argument("--outcomes-delta", action="store_true",
                    help="write the guarded outcomes write (record shape 3) and print its verify query")
    args = ap.parse_args(argv)
    rs = rows()
    if args.outcomes_delta:
        text = outcomes_delta_sql(rs)
        hit = STALL.search(text)
        if hit:
            print("REFUSING: the delta names %r, which stalls the Supabase connector." % hit.group(0))
            return 2
        open(OUTCOMES_DELTA, "w").write(text)
        print("wrote %s (%d bytes, %d rows)" % (os.path.relpath(OUTCOMES_DELTA, ROOT), len(text.encode()), len(rs)))
        print(outcomes_verify_sql(rs), end="")
        return 0
    text = sql(rs)
    hit = STALL.search(text)
    if hit:
        print("REFUSING: the load names %r, which stalls the Supabase connector." % hit.group(0))
        return 2
    if args.check:
        cur = open(OUT).read() if os.path.exists(OUT) else ""
        if cur != text:
            print("STALE: %s no longer matches the records; rerun the loader." % os.path.relpath(OUT, ROOT))
            return 1
        print("program requirement records load: current (%d records)" % len(rs))
        return 0
    open(OUT, "w").write(text)
    print("wrote %s: %d records, %d checked" % (os.path.relpath(OUT, ROOT), len(rs),
                                                 sum(1 for r in rs if r["checked"])))
    return 0


if __name__ == "__main__":
    sys.exit(main())
