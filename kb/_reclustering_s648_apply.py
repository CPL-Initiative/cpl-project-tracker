#!/usr/bin/env python3
"""Re-clustering S648: the apply half for case 2 alone, from the frozen plan. Nothing runs by default.

THE RULING. Sam's "All six as recommended" (Open Asks Sheet 186 card 6, 13:16Z 2026-11-13,
sam-sheet-186-six-cases-as-recommended-2026-11-13). The S648 conductor sent one case forward (2026-11-13):
  case 2  FIRE M1274 folds into FIRE 130 X: one kb_curation row (FIRE M1274, merge_into, FIRE 130 X).
Held: cases 1, 3 and 5 (for Sam), case 4 (its merge carries a mis-filed articulation) and case 6 (the clean route
removes a row the title-matching bot saved, which needs Sam's word). kb/reclustering_s648_out/2026-11-13/plan.md
carries each, and its "For the sheet" section asks them.

WHAT EACH MODE WRITES.
  --sql           writes the migration and its rollback under kb/migrations/ from the plan (deterministic; the
                  committed pair must equal what this writes: --check).
  --overlay PATH  folds the cohort's row into a COPY of kb/coci_curation.json the way kb/_apply_curation.py does
                  (the latest row wins reviewed_by and reviewed_at), to simulate the post-apply state locally.

The row lands through .github/workflows/supabase-migrate.yml: a push to a claude/** branch that changes
kb/migrations/.apply to the migration's file and name. The workflow runs on that push and does not need main.
This file never edits kb/migrations/.apply.

Run (from repo root):
  python3 kb/_reclustering_s648_apply.py --sql [--check]
  python3 kb/_reclustering_s648_apply.py --overlay /tmp/kb_copy/coci_curation.json
"""
from __future__ import annotations

import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

PLAN = os.path.join(HERE, "reclustering_s648_out", "2026-11-13", "plan.json")
COHORT = "reclustering-s648@bot"
MIGRATION = "kb/migrations/2026-11-13_s648_reclustering_cohort.sql"
ROLLBACK = "kb/migrations/2026-11-13_s648_reclustering_cohort_rollback.sql"
READY = (2,)  # the conductor, 2026-11-13: case 2 alone; 1, 3, 4, 5 and 6 held (plan.md)


def load_plan(path=PLAN):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def rows_from_plan(plan):
    """The cohort's rows, (course_id, field, value). Refuses a plan where a ready case is held or is not a merge."""
    by_n = {c["n"]: c for c in plan["cases"]}
    out = []
    for n in READY:
        c = by_n[n]
        if not c["ready"]:
            raise SystemExit(f"ABORT: case {n} is not ready in the plan: {c['blockers']}")
        if c["op"] != "merge":
            raise SystemExit(f"ABORT: case {n} is a {c['op']}; this apply writes merges only")
        out.append((c["folds"], "merge_into", c["survivor"]))
    return out


def sql_text(plan):
    rows = rows_from_plan(plan)
    q = lambda s: "'" + str(s).replace("'", "''") + "'"
    keys = ", ".join(q(r[0]) for r in rows)
    match = f"course_id = {q(rows[0][0])}" if len(rows) == 1 else f"course_id in ({keys})"
    n = len(rows)
    head = [
        f"-- Re-clustering S648, case 2: {n} row (kb/reclustering_s648_out/2026-11-13/plan.md).",
        "-- Sam, Open Asks Sheet 186 card 6, 13:16Z 2026-11-13: \"All six as recommended\"",
        "-- (sam-sheet-186-six-cases-as-recommended-2026-11-13); the S648 conductor sent case 2 alone forward.",
        f"-- INSERT-only under the cohort {COHORT} (Rule 10a): a taken (course_id, field) slot is skipped,",
        "-- never overwritten. Written by kb/_reclustering_s648_apply.py --sql.",
        f"-- Rollback: {ROLLBACK} (deletes this row alone, by cohort, field and key; it",
        "-- needs no before-values because nothing here overwrites). One plain statement; RETURNING puts the row",
        "-- that landed into the runner's receipt (kb/receipts/migration_s648_reclustering_cohort_<run>.json,",
        "-- its `response`), so a session that did not do the write can read what landed and roll it back.",
        "",
        "insert into public.kb_curation (course_id, field, value, reviewer_email)",
        "values",
    ]
    vals = ",\n".join(f"  ({q(a)}, {q(b)}, {q(c)}, {q(COHORT)})" for a, b, c in rows)
    tail = ["on conflict (course_id, field) do nothing", "returning course_id, field, value, reviewer_email;", "",
            f"-- Read back: expect {n} row under {COHORT}.",
            f"--   select course_id, field, value from public.kb_curation where reviewer_email = {q(COHORT)};", ""]
    rb = [f"-- Rollback for {os.path.basename(MIGRATION)}: removes exactly the row it wrote.",
          f"delete from public.kb_curation where reviewer_email = {q(COHORT)} and field = 'merge_into'"
          f" and {match}",
          "returning course_id, field, value, reviewer_email;",
          f"-- Read back: expect 0.  select count(*) from public.kb_curation where reviewer_email = {q(COHORT)}"
          f" and field = 'merge_into' and {match};", ""]
    return "\n".join(head) + "\n" + vals + "\n" + "\n".join(tail), "\n".join(rb)


def do_sql(plan, check=False):
    mig, rb = sql_text(plan)
    stale = []
    for rel, text in ((MIGRATION, mig), (ROLLBACK, rb)):
        p = os.path.join(ROOT, rel)
        if check:
            cur = open(p, encoding="utf-8").read() if os.path.exists(p) else None
            if cur != text:
                stale.append(rel)
        else:
            with open(p, "w", encoding="utf-8") as f:
                f.write(text)
            print("wrote " + rel)
    if check:
        if stale:
            raise SystemExit("STALE: " + ", ".join(stale) + " (run --sql)")
        print("migration pair current")


def do_overlay(plan, path, at=None):
    """kb/_apply_curation.py's fold for the cohort's rows: the field is set, and the newest row wins the entry's
    reviewed_by / reviewed_at, so an id a person curated earlier reads as the cohort's afterward (their row itself
    is untouched in the table)."""
    doc = json.load(open(path, encoding="utf-8"))
    cur = doc["curations"]
    stamp = at or (plan["date"] + "T23:59:59+00:00")
    added = 0
    for cid, field, value in rows_from_plan(plan):
        entry = cur.setdefault(cid, {})
        if field in entry:
            continue
        entry[field] = value
        if stamp >= entry.get("reviewed_at", ""):
            entry["reviewed_by"], entry["reviewed_at"] = COHORT, stamp
        added += 1
    doc["count"] = len(cur)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(doc, f, indent=1, ensure_ascii=False)
    print(f"overlay {path}: {added} row folded in")


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--sql", action="store_true")
    g.add_argument("--overlay", metavar="PATH")
    ap.add_argument("--check", action="store_true", help="with --sql: fail when the committed pair differs")
    ap.add_argument("--plan", default=PLAN)
    a = ap.parse_args()
    plan = load_plan(a.plan)
    if a.sql:
        do_sql(plan, check=a.check)
    else:
        if os.path.realpath(a.overlay) == os.path.realpath(os.path.join(HERE, "coci_curation.json")):
            raise SystemExit("--overlay writes a copy, never the committed overlay")
        do_overlay(plan, a.overlay)
    return 0


if __name__ == "__main__":
    sys.exit(main())
