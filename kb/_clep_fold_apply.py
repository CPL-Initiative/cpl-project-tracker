#!/usr/bin/env python3
"""_clep_fold_apply.py — the reference's CLEP titles fold under College Board's exam names (Sam's
ruling on Open Asks Sheet 150 card 2, 2026-11-01: "fold"), on the AP and IB folds' pattern
(kb/_ap_official_titles.py, kb/_ib_official_titles.py).

Reads kb/_clep_official_titles.py's dry run and:
  1. writes a merge into kb/credential_merges.json for each credential whose local titles all go to
     one exam (the level-split language credentials, the Roman and Arabic twins of Spanish with
     Writing, the prefix-less "(Levels 1 and 2)" credentials, Pre-Calculus, and Information Systems
     and Computer Applications, College Board's former name for Information Systems);
     kb/_merge_credentials.py --apply then re-points the titles, the credential records and the
     articulations. Where a winner is new, the record of a person-reviewed loser moves to it first;
  2. moves a local title by itself when its credential's titles split (none today; the plan says so).

The issuer is College Board on every CLEP record already, so no issuer changes.

The live side: the saved assignments in kb_curation that name a folded credential, and the
credential panel's rows keyed by one, move by a guarded UPDATE. `--live ROWS.json` takes a fresh
read of those rows (course_id, field, value, reviewer_email, reviewed_at) and writes the SQL and its
receipt (kb/credential_merges_out/<date>/clep_kb_curation_update.*). A panel row moves only where the
winner holds no row for that field, so nothing is deleted; a row left in place is named in the
receipt.

Run from the repo root:
  python3 kb/_clep_fold_apply.py                  # dry run: what moves, nothing written
  python3 kb/_clep_fold_apply.py --apply          # writes the merges (and any split move)
  python3 kb/_clep_fold_apply.py --live rows.json # writes the guarded UPDATE and its receipt
"""
import json
import os
import sys
from collections import defaultdict
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import _clep_official_titles as CLEP  # noqa: E402

COHORT = "cer-clep-fold-skyteaberry@bot"
TODAY = date.today().isoformat()
OUTDIR = os.path.join(HERE, "credential_merges_out", TODAY)
PANEL = "_CREDENTIAL_REVIEW::"
REASON = ("College Board's CLEP exam name (kb/_clep_official_titles.py): one credential per exam, its levels "
          "folded in as score bands, Arabic numerals and no period subtitle (Sam, Open Asks Sheet 150 card 2, "
          "2026-11-01: 'fold'), on the AP fold's pattern (Sheet 149 card 1). Applied by SkyTeaberry, 2026-11-01.")


def load(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return json.load(f)


def write(rel, obj):
    with open(os.path.join(ROOT, rel), "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
        f.write("\n")


def plan():
    """(merges, splits). A merge per credential whose titles all go to one exam; for a new winner the
    loser whose record a person reviewed goes first (the one-exam "(Levels 1 and 2)" record before a
    single level's), so its record is the one that moves."""
    ut = load("kb/unified_titles.json")
    ut = ut.get("titles") or ut
    cr = load("kb/credentials.json")
    d = CLEP.dry_run()
    by_loser = defaultdict(lambda: defaultdict(list))
    for raw, (cur, new, _who) in d["reference_moved_raws"].items():
        by_loser[cur][new].append(raw)
    merges, splits = [], []
    for loser, winners in by_loser.items():
        all_raws = [r for r, e in ut.items() if isinstance(e, dict) and e.get("unified_title") == loser]
        moving = {r for v in winners.values() for r in v}
        if len(winners) == 1 and len(moving) == len(all_raws):
            merges.append({"loser": loser, "winner": next(iter(winners)), "n": len(all_raws)})
            continue
        for new, raws in winners.items():
            splits.append({"from": loser, "to": new, "raws": sorted(raws)})

    def person_reviewed(t):
        recs = cr.get(t) or []
        recs = recs if isinstance(recs, list) else [recs]
        return any((r.get("reviewed_by") or "") and "@bot" not in (r.get("reviewed_by") or "") for r in recs)

    merges.sort(key=lambda m: (m["winner"], not person_reviewed(m["loser"]), "(Levels 1 and 2)" not in m["loser"],
                               -m["n"], m["loser"]))
    return merges, splits


def live(rows_path):
    """The guarded UPDATE for the live rows that name a folded credential, and its receipt."""
    merges, _splits = plan()
    done = {m["loser"]: m["winner"] for m in load("kb/credential_merges.json")["merges"]
            if m.get("reviewed_by") == COHORT}
    to = {**done, **{m["loser"]: m["winner"] for m in merges}}
    with open(rows_path, encoding="utf-8") as f:
        rows = json.load(f)
    assign, panel, left = [], [], []
    # a panel row of the one-exam "(Levels 1 and 2)" credential moves before a single level's
    for r in sorted(rows, key=lambda r: (r["field"], "(Levels 1 and 2)" not in r["course_id"], r["course_id"])):
        cid, field, val = r["course_id"], r["field"], r["value"]
        before = {"value": val, "reviewer_email": r["reviewer_email"], "reviewed_at": r["reviewed_at"]}
        if field == "unified_title_assignment" and val in to:
            assign.append({"course_id": cid, "field": field, "before": before, "after": {"value": to[val]}})
        elif cid.startswith(PANEL) and cid[len(PANEL):] in to:
            new_cid = PANEL + to[cid[len(PANEL):]]
            if (new_cid, field) in {(p["after"]["course_id"], p["field"]) for p in panel}:
                left.append({"course_id": cid, "field": field, "value": val, "reviewer_email": r["reviewer_email"],
                             "why": "the winner %r already holds a %s row; a second cannot sit under the same key "
                                    "and nothing is deleted" % (to[cid[len(PANEL):]], field)})
                continue
            panel.append({"course_id": cid, "field": field, "before": before, "after": {"course_id": new_cid}})
    humans = [x for x in assign + panel if "@bot" not in (x["before"]["reviewer_email"] or "")]

    def q(s):
        return "'" + str(s).replace("'", "''") + "'"
    sql = ["-- The CLEP fold's live side (SkyTeaberry, 2026-11-01; Sam's ruling, Open Asks Sheet 150 card 2, 'fold').",
           "-- 1. Re-points %d saved title assignments from a folded credential to College Board's exam name." % len(assign),
           "-- 2. Moves %d credential panel rows to the exam's key, only where that key holds no row for the field." % len(panel),
           "-- Guarded: a row changes only while it still holds its before-value. Before-values and the rollback:",
           "-- clep_kb_curation_update_receipt.json beside this file. Expect %d + %d rows returned." % (len(assign), len(panel))]
    if assign:
        vals = ",".join("(%s,%s,%s,%s)" % (q(a["course_id"]), q(a["field"]), q(a["before"]["value"]), q(a["after"]["value"]))
                        for a in assign)
        sql.append("with m(course_id,field,before,after) as (values %s) update kb_curation k set value=m.after, "
                   "reviewer_email=%s, reviewed_at=now() from m where k.course_id=m.course_id and k.field=m.field "
                   "and k.value=m.before returning k.course_id, k.field, k.value;" % (vals, q(COHORT)))
    if panel:
        vals = ",".join("(%s,%s,%s,%s)" % (q(p["course_id"]), q(p["field"]), q(p["before"]["value"]), q(p["after"]["course_id"]))
                        for p in panel)
        sql.append("with m(course_id,field,before,after) as (values %s) update kb_curation k set course_id=m.after "
                   "from m where k.course_id=m.course_id and k.field=m.field and k.value=m.before and not exists "
                   "(select 1 from kb_curation t where t.course_id=m.after and t.field=m.field) "
                   "returning k.course_id, k.field, k.value, k.reviewer_email;" % vals)
    os.makedirs(OUTDIR, exist_ok=True)
    with open(os.path.join(OUTDIR, "clep_kb_curation_update.sql"), "w", encoding="utf-8") as f:
        f.write("\n".join(sql) + "\n")
    receipt = {
        "table": "kb_curation", "kind": "guarded UPDATE", "at": TODAY, "by": "SkyTeaberry", "cohort": COHORT,
        "basis": "Sam's ruling on Open Asks Sheet 150 card 2 (2026-11-01 01:50Z): fold. One credential per CLEP "
                 "exam, levels folded in, Arabic numerals, no period subtitle.",
        "human_rows": ("%d of the rows are a person's: %s. The ruling folds the levels and the prefix-less "
                       "'(Levels 1 and 2)' credentials into the exam, so each moves with the rest; Sam's own save "
                       "already read Spanish with Writing as one exam with both levels." % (
                           len(humans), "; ".join("%s (%s)" % (h["course_id"], h["before"]["reviewer_email"]) for h in humans))),
        "guard": {"assignments": "UPDATE ... SET value=<after>, reviewer_email=cohort, reviewed_at=now() WHERE "
                                 "course_id=<id> AND field=<field> AND value=<before>",
                  "panel": "UPDATE ... SET course_id=<after> WHERE course_id=<id> AND field=<field> AND value=<before> "
                           "AND no row holds (<after>, <field>); reviewer_email and reviewed_at stay the person's"},
        "rollback": {"assignments": "for each row: UPDATE kb_curation SET value=<before.value>, reviewer_email="
                                    "<before.reviewer_email>, reviewed_at=<before.reviewed_at> WHERE course_id=<id> AND "
                                    "field=<field> AND reviewer_email='%s'" % COHORT,
                     "panel": "for each row: UPDATE kb_curation SET course_id=<course_id> WHERE course_id="
                              "<after.course_id> AND field=<field> AND reviewer_email=<before.reviewer_email>"},
        "assignments": assign, "panel_moves": panel, "panel_left_in_place": left,
    }
    with open(os.path.join(OUTDIR, "clep_kb_curation_update_receipt.json"), "w", encoding="utf-8") as f:
        json.dump(receipt, f, indent=1, ensure_ascii=False)
        f.write("\n")
    print("WROTE clep_kb_curation_update.sql and its receipt: %d assignments, %d panel moves, %d left in place, "
          "%d a person's." % (len(assign), len(panel), len(left), len(humans)))
    return 0


def main():
    if "--live" in sys.argv:
        return live(sys.argv[sys.argv.index("--live") + 1])
    apply = "--apply" in sys.argv
    merges, splits = plan()
    print("Merges: %d credentials fold whole." % len(merges))
    for m in merges:
        print("  %3d  %s  ->  %s" % (m["n"], m["loser"], m["winner"]))
    print("Split moves: %d." % sum(len(s["raws"]) for s in splits))
    for s in splits:
        for raw in s["raws"]:
            print("  %s  (%s  ->  %s)" % (raw, s["from"], s["to"]))
    if splits:
        print("A credential's titles split; write its move on the IB fold's pattern before applying.")
        return 1
    if not apply:
        print("DRY RUN — nothing written. Re-run with --apply.")
        return 0
    doc = load("kb/credential_merges.json")
    have = {(m["loser"], m["winner"]) for m in doc["merges"]}
    added = 0
    for m in merges:
        if (m["loser"], m["winner"]) not in have:
            doc["merges"].append({"loser": m["loser"], "winner": m["winner"], "reviewed_by": COHORT,
                                  "reviewed_at": TODAY, "reason": REASON})
            added += 1
    write("kb/credential_merges.json", doc)
    print("WROTE %d merges into kb/credential_merges.json. Next: python3 kb/_merge_credentials.py --apply" % added)
    return 0


if __name__ == "__main__":
    sys.exit(main())
