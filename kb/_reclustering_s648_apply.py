#!/usr/bin/env python3
"""Re-clustering S648: the apply half for cases 2, 4 and 6, from the frozen plan. Nothing runs by default.

THE RULINGS. Sam's "All six as recommended" (Open Asks Sheet 186 card 6, 13:16Z 2026-11-13,
sam-sheet-186-six-cases-as-recommended-2026-11-13). The S648 conductor sent three cases forward (2026-11-13):
  case 2  FIRE M1274 folds into FIRE 130 X       one kb_curation row (FIRE M1274, merge_into, FIRE 130 X)
  case 4  MATH M1044 folds into MATH M1036       one kb_curation row (MATH M1044, merge_into, MATH M1036)
  case 6  Santa Ana BUS 115 leaves BUSI M1228    one kb_curation row (CN:CCC000609492, merge_into, <new id>) and
          one new catalog record for <new id>, Global Supply Chain and Logistics, Business.
Cases 1, 3 and 5 are held for Sam (kb/reclustering_s648_out/2026-11-13/plan.md, For the sheet).

WHY CASE 6 NEEDS A NEW ID. The course's own stand-alone, BUSI M10XW, already folds into BUSI M1228 by a bot's
merge_into row (automerge-titlelane-v1@bot, 2026-06-13). Deleting a saved curation row is on the hold list whoever
wrote it, and a CN: row pointing at BUSI M10XW would follow that fold straight back (flatten_merge_chains). So the
course re-homes INSERT-only onto a new stand-alone record, and BUSI M10XW stays folded with no member left.

WHAT EACH MODE WRITES.
  --record        adds the case 6 record to kb/coci_minted_courses.json (count + 1, stamp _recluster_s648_from).
                  Gates: P0 the record is not there yet; P1 the id is still free in the catalog, the stand-alones,
                  the curation keys, the live members file and every ALIAS_MAPS id; P2 the plan's case 6 target is
                  this id. Undo: --undo-record, or git revert of its commit.
  --undo-record   removes exactly that record, refusing if it changed.
  --sql           writes the migration and its rollback under kb/migrations/ from the plan (deterministic; the
                  committed pair must equal what this writes: --check).
  --overlay PATH  folds the three cohort rows into a copy of kb/coci_curation.json the way kb/_apply_curation.py
                  would (a local simulation of the post-apply state; never the committed overlay).

The kb_curation rows land through .github/workflows/supabase-migrate.yml: a push to a claude/** branch that changes
kb/migrations/.apply to the migration's file and name. The workflow runs on the branch; it does not need main.
This file never edits kb/migrations/.apply.

Run (from repo root):
  python3 kb/_reclustering_s648_apply.py --sql [--check]
  python3 kb/_reclustering_s648_apply.py --record
  python3 kb/_reclustering_s648_apply.py --overlay /tmp/kb_copy/coci_curation.json
"""
from __future__ import annotations

import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

PLAN = os.path.join(HERE, "reclustering_s648_out", "2026-11-13", "plan.json")
CATALOG = os.path.join(HERE, "coci_minted_courses.json")
COHORT = "reclustering-s648@bot"
STAMP = "_recluster_s648_from"
MIGRATION = "kb/migrations/2026-11-13_s648_reclustering_cohort.sql"
ROLLBACK = "kb/migrations/2026-11-13_s648_reclustering_cohort_rollback.sql"
READY = (2, 4, 6)


def load_plan(path=PLAN):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def rows_from_plan(plan):
    """The cohort's rows, (course_id, field, value), in case order. Refuses a plan where a ready case is held."""
    by_n = {c["n"]: c for c in plan["cases"]}
    out = []
    for n in READY:
        c = by_n[n]
        if not c["ready"]:
            raise SystemExit(f"ABORT: case {n} is not ready in the plan: {c['blockers']}")
        if c["op"] == "merge":
            out.append((c["folds"], "merge_into", c["survivor"]))
        else:
            for m in c["moves"]:
                if m["held"]:
                    raise SystemExit(f"ABORT: case {n} moves a held member")
                out.append(("CN:" + m["control_number"], "merge_into", m["target_id"]))
    return out


def case6_record(plan):
    c = {x["n"]: x for x in plan["cases"]}[6]
    (m,) = c["moves"]
    new_id = m["target_id"]
    own = (m.get("leaf_ids") or [None])[0]
    # TOP and CTE copy the course's own stand-alone record (the export reads members' fields from it), so the new
    # record never reads as TOP-mixed against its one member. TOP decides nothing here.
    leaf = json.load(open(os.path.join(HERE, "coci_minted_singletons.json"), encoding="utf-8"))["courses"].get(own) or {}
    top = leaf.get("top_code") or (m.get("top") or "").split(":")[0].strip() or None
    rec = {
        "course_id": new_id, "id_system": "M-ID", "ccn_id": None, "c_id": None,
        "common_title": m["title"], "common_title_source": "local catalog (the one member's own title)",
        "description": None, "description_source": None,
        "subject": m["code"].split(" ")[0], "subject_4letter": new_id.split(" ")[0],
        "discipline": m["proposed_discipline"], "discipline_provisional": None,
        "typical_units": float(m["units"]) if m.get("units") is not None else None,
        "confidence": None, "corroboration_members": 1, "subject_spread": 1, "source_college_count": 1,
        "classified_at": plan["date"],
        "classified_by": ("kb/_reclustering_s648_apply.py: split out of BUSI M1228 on Sam's 'All six as recommended' "
                          "(Open Asks Sheet 186 card 6, 2026-11-13)"),
        "reviewed_at": None, "reviewed_by": None,
        "_notes": (f"{m['college']} {m['code']} re-homes here by the kb_curation row CN:{m['control_number']} "
                   f"(cohort {COHORT}); its own stand-alone {own} stays folded into BUSI M1228 by a saved row, "
                   "which is never deleted. No membership entry of its own."),
        "credit_status": "Credit", "credit_status_mixed": False,
        "top_code": top, "top_code_mixed": False, "top_code_distribution": {top: 1} if top else {},
        "noncredit_category": None, "noncredit_category_mixed": False, "noncredit_category_distribution": {},
        "cte": leaf.get("cte"), "origin": "curator split", STAMP: own,
    }
    return new_id, rec


def id_taken(new_id):
    import alias_chain
    import _mid_outcomes_compare as cmp
    cat = json.load(open(CATALOG, encoding="utf-8"))["courses"]
    sg = json.load(open(os.path.join(HERE, "coci_minted_singletons.json"), encoding="utf-8"))["courses"]
    cur = json.load(open(os.path.join(HERE, "coci_curation.json"), encoding="utf-8"))["curations"]
    members, _ = cmp.load_members(ROOT)
    used = set(cat) | set(sg) | set(cur) | set(members)
    for p in alias_chain.ALIAS_MAPS:
        m = alias_chain.load_alias(p)
        used |= set(m) | {alias_chain.step(v) for v in m.values() if alias_chain.step(v)}
    return new_id in used


def _dump(path, obj):
    with open(path, "rb") as f:
        f.seek(-1, os.SEEK_END)
        nl = f.read(1) == b"\n"
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
        if nl:
            f.write("\n")
    os.replace(tmp, path)


def do_record(plan, undo=False):
    new_id, rec = case6_record(plan)
    doc = json.load(open(CATALOG, encoding="utf-8"))
    have = doc["courses"].get(new_id)
    if undo:
        if have is None:
            raise SystemExit(f"nothing to undo: {new_id} is not in the catalog")
        if have != rec:
            raise SystemExit(f"ABORT: {new_id} changed since this script wrote it; undo by git revert")
        del doc["courses"][new_id]
        doc["count"] = len(doc["courses"])
        _dump(CATALOG, doc)
        print(f"removed {new_id}; catalog {doc['count']}")
        return
    if have is not None:
        raise SystemExit(f"P0: {new_id} is already in the catalog (applied)")
    if id_taken(new_id):
        raise SystemExit(f"P1: {new_id} is taken since the plan was cut; re-run the dry run for a fresh id")
    if rec["discipline"] != "Business" or not new_id.startswith("BUSI M"):
        raise SystemExit("P2: the id does not carry its discipline's code")
    doc["courses"][new_id] = rec
    doc["count"] = len(doc["courses"])
    _dump(CATALOG, doc)
    print(f"added {new_id} ({rec['common_title']}, {rec['discipline']}); catalog {doc['count']}")


def sql_text(plan):
    rows = rows_from_plan(plan)
    q = lambda s: "'" + str(s).replace("'", "''") + "'"
    keys = ", ".join(q(r[0]) for r in rows)
    head = [
        "-- Re-clustering S648, cases 2, 4 and 6 (kb/reclustering_s648_out/2026-11-13/plan.md).",
        "-- Sam, Open Asks Sheet 186 card 6, 13:16Z 2026-11-13: \"All six as recommended\"",
        "-- (sam-sheet-186-six-cases-as-recommended-2026-11-13); the S648 conductor sent 2, 4 and 6 forward.",
        f"-- INSERT-only under the cohort {COHORT} (Rule 10a); a row whose (course_id, field) slot is taken",
        "-- is skipped, never overwritten. Written by kb/_reclustering_s648_apply.py --sql.",
        "-- Case 6's target id must be in kb/coci_minted_courses.json in the same window",
        "-- (kb/_reclustering_s648_apply.py --record).",
        f"-- Rollback: {os.path.basename(ROLLBACK)} (delete by cohort; takes back only these rows).",
        "",
        "insert into public.kb_curation (course_id, field, value, reviewer_email)",
        "values",
    ]
    vals = ",\n".join(f"  ({q(a)}, {q(b)}, {q(c)}, {q(COHORT)})" for a, b, c in rows)
    tail = ["on conflict (course_id, field) do nothing;", "",
            f"-- Read back: expect {len(rows)} rows, every one under {COHORT}.",
            f"--   select count(*) from public.kb_curation where reviewer_email = {q(COHORT)}"
            f" and field = 'merge_into' and course_id in ({keys});", ""]
    rb = [f"-- Rollback for {os.path.basename(MIGRATION)}: removes exactly the cohort's rows.",
          f"delete from public.kb_curation where reviewer_email = {q(COHORT)};",
          f"-- Read back: expect 0.  select count(*) from public.kb_curation where reviewer_email = {q(COHORT)};", ""]
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


def do_overlay(plan, path):
    doc = json.load(open(path, encoding="utf-8"))
    cur = doc["curations"]
    added = 0
    for cid, field, value in rows_from_plan(plan):
        slot = cur.setdefault(cid, {})
        if field in slot:
            continue
        slot[field] = value
        slot.setdefault("reviewed_by", COHORT)
        slot.setdefault("reviewed_at", plan["date"] + "T00:00:00+00:00")
        added += 1
    doc["count"] = len(cur)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(doc, f, indent=1, ensure_ascii=False)
    print(f"overlay {path}: {added} rows folded in")


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--record", action="store_true")
    g.add_argument("--undo-record", action="store_true")
    g.add_argument("--sql", action="store_true")
    g.add_argument("--overlay", metavar="PATH")
    ap.add_argument("--check", action="store_true", help="with --sql: fail when the committed pair differs")
    ap.add_argument("--plan", default=PLAN)
    a = ap.parse_args()
    plan = load_plan(a.plan)
    if a.record or a.undo_record:
        do_record(plan, undo=a.undo_record)
    elif a.sql:
        do_sql(plan, check=a.check)
    else:
        if os.path.realpath(a.overlay) == os.path.realpath(os.path.join(HERE, "coci_curation.json")):
            raise SystemExit("--overlay writes a copy, never the committed overlay")
        do_overlay(plan, a.overlay)
    return 0


if __name__ == "__main__":
    sys.exit(main())
