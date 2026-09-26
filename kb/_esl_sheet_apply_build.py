#!/usr/bin/env python3
"""The ESL merging sheet's data changes, as one reviewed paste: plan, apply SQL, rollback SQL.

  python3 kb/_esl_sheet_apply_build.py --read-sql            -> the live read to run first (read-only)
  python3 kb/_esl_sheet_apply_build.py --live <read.json>    -> kb/esl_sheet_out/<date>/: plan.json,
                                                                apply.sql, rollback.sql, report.md

Sam's ESL merging procedure sheet (2026-09-26, https://claude.ai/artifact/LaZmu7NYj11DigAEbxsUMS)
came back with all nine items as proposed and none ruled individually. Under the cross-list
precedent (lanes/discipline-crosslist.md), an as-proposed item that changes stored curation
waits for an explicit go, and the SQL guard keeps kb_curation writes with Sam in any case, so
the changes travel as this paste: running it in the SQL editor is the go.

Every change, re-measured at build time (never the sheet's own counts):
  item 3  health-titled folds sitting in a level group move to Vocational ESL - Healthcare
  item 2  default-Beginning folds whose catalog names another band, where NO standard reached
          them (the per-ladder vote decides every row it reaches; Sam 2026-08-24: the
          statewide standard wins over local catalog wording)
  item 6  the ladder re-levels his rulings clear: two or more member courses, and no reversal
          of the 32 he kept
  item 4  the three transfer-held identities that are not transfer courses fold into Advanced
  item 5  the new identities, placed by kb/_esl_new_identities_dryrun.py
  item 9  the film course comes out of Enrichment ESL
Precedence where one row meets two items: purpose (3) first, then the ladder (6), then the
catalog (2).

Rule 10: a fresh live read at build time; UPDATEs are guarded on the row's current value AND
cohort, so a row a curator touched since is left alone; INSERTs are ON CONFLICT DO NOTHING;
every write lands under a dated cohort and the rollback restores each row's before-values.
"""
import argparse
import collections
import datetime
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _esl_package_dryrun as D            # noqa: E402
import _esl_ladder_relevel_dryrun as LAD   # noqa: E402
import _esl_new_identities_dryrun as N     # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FOLD_PLAN = "kb/esl_package_out/2026-08-24/esl_apply_plan.json"
FIRST_PLAN = "kb/esl_package_out/2026-07-15/esl_package_plan.json"
SPOTCHECK = "kb/esl_fold_spotcheck/2026-08-24/worklist.json"
FOLD_COHORTS = ("package-esl-s187@bot", "relevel-esl-s188@bot")
LEVEL = {"Beginning": "ESOL M9168", "Intermediate": "ESOL M9256", "Advanced": "ESOL M1141"}
HEALTH_SURVIVOR = "ESOL M91IL"
TRANSFER_THREE = ("ESOL M10AD", "ESOL M91BQ", "ESOL M9192")
FILM = ("FTVE M1018", "ESOL M1152", "automerge-v1@bot")
COHORT = {3: "esl-health-s294@bot", 2: "esl-catalog-s294@bot", 6: "esl-ladder-s294@bot",
          4: "esl-transfer-s294@bot", 5: "esl-newfold-s294@bot"}


def sets():
    R = N.plan_resolver()  # the plans' stored ids, resolved before they meet the live set
    fold = [dict(f, id=R(f["id"])) for f in
            json.load(open(os.path.join(ROOT, FOLD_PLAN), encoding="utf-8"))["folds"]]
    title = {R(i["id"]): i["title"] for i in
             json.load(open(os.path.join(ROOT, FIRST_PLAN), encoding="utf-8"))["identities"]}
    level_ids = {f["id"] for f in fold if f["bucket"] in LAD.LEVEL_BUCKETS}
    health = {f["id"]: HEALTH_SURVIVOR for f in fold
              if f["bucket"] in LAD.LEVEL_BUCKETS and D.HEALTHCARE.search(title.get(f["id"], ""))}
    ladder = LAD.build("build")
    undecided = {u["id"] for u in ladder["undecided"]}
    six = {c["id"]: c["target"] for c in ladder["changes"]
           if c["voters"] >= 2 and not c["reverts_applied_32"] and c["id"] not in health}
    spot = [dict(r, id=R(r["id"])) for r in
            json.load(open(os.path.join(ROOT, SPOTCHECK), encoding="utf-8"))["rows"]]
    two = {r["id"]: LEVEL[r["proposed_band"]] for r in spot
           if r["fold_signal"] == "default-beginning"
           and r["category"] in ("contradicts", "weak-contradicts")
           and r["id"] not in health and r["id"] in undecided and r["id"] in level_ids}
    new = N.build()
    five = {p["id"]: p["target"] for p in new["placements"]}
    return {"titles": title, "health": health, "ladder": six, "catalog": two,
            "transfer": {i: LEVEL["Advanced"] for i in TRANSFER_THREE}, "new": five,
            "new_detail": new, "ladder_counts": ladder["counts"]}


def read_sql(S):
    ids = sorted(set(S["health"]) | set(S["ladder"]) | set(S["catalog"]) | set(S["transfer"])
                 | set(S["new"]) | {FILM[0]})
    targets = sorted(set(LEVEL.values()) | {HEALTH_SURVIVOR, "ESOL M9023", "ESOL M9177", "ESOL M1152"})
    lit = lambda xs: ",".join("'" + x.replace("'", "''") + "'" for x in xs)
    return ("select json_build_object(\n"
            "  'rows', (select coalesce(json_agg(json_build_object('course_id', course_id, 'field', field,"
            " 'value', value, 'reviewer_email', reviewer_email, 'reviewed_at', reviewed_at)), '[]'::json)\n"
            f"           from kb_curation where course_id in ({lit(ids)})),\n"
            "  'pending_merge_confirm', (select coalesce(json_agg(json_build_object('course_id', course_id,"
            " 'value', value, 'reviewer_email', reviewer_email)), '[]'::json)\n"
            "           from kb_curation where field = 'unified_title_merge_confirm'\n"
            f"             and (value in ({lit(ids + targets)}) or course_id in ({lit(ids + targets)}))),\n"
            "  'read_at', now()) as live;")


def q(x):
    return "NULL" if x is None else "'" + str(x).replace("'", "''") + "'"


def build(S, live, date):
    rows = collections.defaultdict(dict)
    for r in live["rows"]:
        rows[r["course_id"]][r["field"]] = r
    held, updates, inserts, deletes = [], [], [], []

    def human(cid):
        """A curator's MERGE row holds the identity: his rows always win (Rule 10). His
        title rows ride along untouched: the first fold merged identities that carry
        them too, and a level move changes the merge target, never the title."""
        r = rows[cid].get("merge_into")
        return ["merge_into"] if r and not str(r.get("reviewer_email") or "").endswith("@bot") else []

    pending = {p["value"] for p in live.get("pending_merge_confirm", [])} | \
              {p["course_id"] for p in live.get("pending_merge_confirm", [])}
    # UPDATE items, in precedence order: a row takes the first item that claims it
    claimed = set()
    for item, key in ((3, "health"), (6, "ladder"), (2, "catalog")):
        for cid, target in sorted(S[key].items()):
            if cid in claimed:
                continue
            claimed.add(cid)
            cur = rows[cid].get("merge_into")
            if cid in pending or target in pending:
                held.append({"item": item, "id": cid, "why": "a pending unified_title_merge_confirm names it"})
            elif human(cid):
                held.append({"item": item, "id": cid, "why": "a curator row sits on it: " + ", ".join(human(cid))})
            elif not cur or cur["reviewer_email"] not in FOLD_COHORTS:
                held.append({"item": item, "id": cid, "why": "no fold-cohort merge row to move (live: %s)"
                             % (cur and cur["reviewer_email"])})
            elif cur["value"] == target:
                held.append({"item": item, "id": cid, "why": "already at " + target})
            else:
                updates.append({"item": item, "id": cid, "from": cur["value"], "to": target,
                                "before_reviewer": cur["reviewer_email"],
                                "before_reviewed_at": cur["reviewed_at"], "cohort": COHORT[item]})
    # INSERT items: an identity no merge row points anywhere yet
    for item, key in ((4, "transfer"), (5, "new")):
        for cid, target in sorted(S[key].items()):
            if rows[cid].get("merge_into"):
                held.append({"item": item, "id": cid, "why": "already carries a merge row: "
                             + rows[cid]["merge_into"]["value"]})
            elif cid in pending or human(cid):
                held.append({"item": item, "id": cid, "why": "a curator row or a pending confirm sits on it"})
            else:
                inserts.append({"item": item, "id": cid, "to": target, "cohort": COHORT[item]})
    # item 9
    film = rows[FILM[0]].get("merge_into")
    if film and film["value"] == FILM[1] and film["reviewer_email"] == FILM[2]:
        deletes.append({"item": 9, "id": FILM[0], "value": film["value"],
                        "reviewer": film["reviewer_email"], "reviewed_at": film["reviewed_at"]})
    else:
        held.append({"item": 9, "id": FILM[0], "why": "the June merge row is not as read: %s" % film})

    apply = [f"-- ESL merging sheet, 2026-09-26: the data changes Sam's verdicts allow. Built {live['read_at']}.",
             "-- Guarded: an UPDATE touches a row only while it still holds the value and cohort read at build",
             "-- time, so a row a curator moved since is left alone. Run once; a second run changes nothing.",
             "begin;"]
    for u in updates:
        apply.append(f"update kb_curation set value = {q(u['to'])}, reviewer_email = {q(u['cohort'])}, reviewed_at = now()"
                     f" where course_id = {q(u['id'])} and field = 'merge_into' and value = {q(u['from'])}"
                     f" and reviewer_email = {q(u['before_reviewer'])};  -- item {u['item']}")
    for i in inserts:
        apply.append(f"insert into kb_curation (course_id, field, value, reviewer_email, reviewed_at)"
                     f" values ({q(i['id'])}, 'merge_into', {q(i['to'])}, {q(i['cohort'])}, now())"
                     f" on conflict do nothing;  -- item {i['item']}")
    for d in deletes:
        apply.append(f"delete from kb_curation where course_id = {q(d['id'])} and field = 'merge_into'"
                     f" and value = {q(d['value'])} and reviewer_email = {q(d['reviewer'])};  -- item 9")
    apply.append("commit;")
    apply.append("select reviewer_email, count(*) from kb_curation where reviewer_email like 'esl-%-s294@bot'"
                 " group by 1 order by 1;")
    rollback = ["-- Undo the ESL merging sheet's data changes of 2026-09-26, from the before-values read at build.",
                "begin;"]
    for u in updates:
        rollback.append(f"update kb_curation set value = {q(u['from'])}, reviewer_email = {q(u['before_reviewer'])},"
                        f" reviewed_at = {q(u['before_reviewed_at'])} where course_id = {q(u['id'])}"
                        f" and field = 'merge_into' and reviewer_email = {q(u['cohort'])};")
    rollback.append("delete from kb_curation where reviewer_email in ("
                    + ",".join(q(COHORT[k]) for k in (4, 5)) + ") and field = 'merge_into';")
    for d in deletes:
        rollback.append(f"insert into kb_curation (course_id, field, value, reviewer_email, reviewed_at)"
                        f" values ({q(d['id'])}, 'merge_into', {q(d['value'])}, {q(d['reviewer'])},"
                        f" {q(d['reviewed_at'])}) on conflict do nothing;")
    rollback.append("commit;")
    counts = {"updates": dict(collections.Counter(u["item"] for u in updates)),
              "inserts": dict(collections.Counter(i["item"] for i in inserts)),
              "deletes": len(deletes), "held": dict(collections.Counter(h["item"] for h in held))}
    return {"_about": __doc__.split("\n")[0], "_read_at": live["read_at"], "counts": counts,
            "updates": updates, "inserts": inserts, "deletes": deletes, "held": held,
            "ladder_counts": S["ladder_counts"], "new_identities": S["new_detail"]["counts"],
            "new_held": S["new_detail"]["held"]}, "\n".join(apply) + "\n", "\n".join(rollback) + "\n"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--read-sql", action="store_true")
    ap.add_argument("--live")
    ap.add_argument("--lines", help="course_id|field|value|reviewer|reviewed_at, one row per line, "
                    "as the read's md5 check returned them")
    ap.add_argument("--read-at")
    ap.add_argument("--date", default=datetime.date.today().isoformat())
    a = ap.parse_args()
    S = sets()
    if a.read_sql:
        print(read_sql(S))
        return
    if a.lines:
        rows = []
        for ln in open(a.lines, encoding="utf-8").read().splitlines():
            cid, field, value, rev, at = ln.split("|")
            rows.append({"course_id": cid, "field": field, "value": value,
                         "reviewer_email": rev, "reviewed_at": at})
        live = {"rows": rows, "pending_merge_confirm": [], "read_at": a.read_at}
    else:
        live = json.load(open(a.live, encoding="utf-8"))
        live = live.get("live", live)
    plan, apply_sql, rollback_sql = build(S, live, a.date)
    out = os.path.join(ROOT, "kb", "esl_sheet_out", a.date)
    os.makedirs(out, exist_ok=True)
    json.dump(plan, open(os.path.join(out, "plan.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    open(os.path.join(out, "apply.sql"), "w", encoding="utf-8").write(apply_sql)
    open(os.path.join(out, "rollback.sql"), "w", encoding="utf-8").write(rollback_sql)
    c = plan["counts"]
    print(json.dumps(c))
    for h in plan["held"]:
        print("  held", h)


if __name__ == "__main__":
    main()
