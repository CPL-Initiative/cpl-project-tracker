#!/usr/bin/env python3
"""The ESL monthly pass: fold the ESL identities that arrived since the last pass.

  python3 kb/_esl_monthly_pass.py --session N      # place, split, write kb/esl_sheet_out/<date>-monthly/

then dispatch .github/workflows/esl-sheet-apply.yml with that plan_dir, dry-run first, then
commit. The workflow's receipt is the record of the pass and what makes it reversible.

Sam's verdict on item 8 of the ESL merging sheet (2026-09-26, taken as proposed,
https://claude.ai/artifact/LaZmu7NYj11DigAEbxsUMS): "A monthly pass: a session dry-runs the
fold over new ESL identities, applies what a level or purpose word places, and lists the rest
for you." The alternative he did not take, folding each identity the night it appears, would
make the nightly build a writer to curation and needs a Governance mapping first.

The split, in the words of that verdict:

  APPLY    a placement a purpose word or a level word decides: the identity title's own word,
           or its member courses' rungs through the ladder vote (Sam's per-ladder sets). Each is
           a merge_into insert under esl-monthly-s<N>@bot, written by the apply workflow with
           the same holds as every ESL write (fresh read, pending confirms, curator rows).
  LIST     a placement that fell to Beginning because nothing spoke, and every held identity
           Sam has not ruled on. These go to him as a sheet; nothing is written for them.
  APART    identities he ruled to keep apart (KEEP_APART, with the ruling). Counted, never
           re-listed: re-asking a settled question is the failure the ESL merging sheet's
           retired open-asks cards were.

Placement is kb/_esl_new_identities_dryrun.py's, imported: the rules in force, in their
precedence, never copied. An id that any earlier receipt already applied is skipped, because
the published payload lags a write until the next daily run; the applier's own hold on an id
that already carries a merge row covers the rest.
"""
import argparse
import datetime
import glob
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import alias_chain as AC                 # noqa: E402  stored ids resolve first (Rule 7)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_ROOT = os.path.join("kb", "esl_sheet_out")
COHORT_FMT = "esl-monthly-s{}@bot"

# Sam's rulings to keep these apart as transfer composition. Recorded after the 2026-09-03
# prefix fold, so a later map in ALIAS_MAPS re-keys them forward (resolve_apart).
KEEP_APART = {
    "ESOL M1205": "item 4 of the ESL merging sheet, 2026-09-26: transfer composition stays apart",
    "ESOL M1239": "item 4 of the ESL merging sheet, 2026-09-26: transfer composition stays apart",
    "ESOL M10KY": "item 4 of the ESL merging sheet, 2026-09-26: transfer composition stays apart",
    "ESOL M10PO": "item 4 of the ESL merging sheet, 2026-09-26: transfer composition stays apart",
    "ESOL M10PN": "item 4 of the ESL merging sheet, 2026-09-26: transfer composition stays apart",
    "ESOL M9309": "item 1 of the ESL follow-up sheet, 2026-09-27 (his own call): stays apart "
                  "with transfer composition",
}
KEEP_APART_ERA = "kb/prefix_fold_out/2026-09-03/alias_map.json"


def resolve_apart():
    """KEEP_APART keyed by today's ids."""
    pending, _ = AC.pending_maps([], baseline_through=KEEP_APART_ERA)
    maps = AC.load_maps(pending)
    return {AC.resolve_id(k, maps): v for k, v in KEEP_APART.items()}


def applied_ids(root=ROOT):
    """Every id an earlier ESL receipt wrote, as written (see the module note on eras)."""
    out = set()
    for path in glob.glob(os.path.join(root, OUT_ROOT, "*", "applied_*.json")):
        try:
            rows = json.load(open(path, encoding="utf-8")).get("rows") or []
        except (OSError, ValueError):
            continue
        out |= {r["id"] for r in rows if r.get("state") == "applied" and r.get("id")}
    return out


def decided_by_a_word(how):
    """True when a purpose word or a level word placed it (the verdict's 'applies')."""
    return how.startswith("purpose:") or how in ("level: identity title word",
                                                 "level: member ladder vote")


def split(placement, apart, already, session):
    """placement: kb/_esl_new_identities_dryrun.build()'s output. Returns the plan."""
    cohort = COHORT_FMT.format(int(session))
    inserts, listed, ruled, skipped = [], [], [], []
    for p in placement["placements"]:
        if p["id"] in already:
            skipped.append({"id": p["id"], "why": "an earlier receipt already applied it"})
        elif p["id"] in apart:
            ruled.append({"id": p["id"], "title": p["title"], "ruling": apart[p["id"]]})
        elif decided_by_a_word(p["how"]):
            inserts.append({"item": "monthly", "id": p["id"], "to": p["target"], "cohort": cohort,
                            "bucket": p["bucket"], "how": p["how"], "title": p["title"]})
        else:
            listed.append(dict(p, why=p["how"]))
    for h in placement["held"]:
        if h["id"] in already:
            skipped.append({"id": h["id"], "why": "an earlier receipt already applied it"})
        elif h["id"] in apart:
            ruled.append({"id": h["id"], "title": h["title"], "ruling": apart[h["id"]]})
        else:
            listed.append(h)
    return {"inserts": inserts, "updates": [], "deletes": [], "listed": listed,
            "ruled_apart": ruled, "skipped": skipped,
            "counts": {"apply": len(inserts), "listed": len(listed), "ruled_apart": len(ruled),
                       "skipped": len(skipped)}}


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--session", required=True, type=int, help="this session's number, for the cohort")
    ap.add_argument("--date", default=datetime.date.today().isoformat())
    a = ap.parse_args(argv)
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", a.date):
        sys.exit("--date takes YYYY-MM-DD")
    plan_dir = os.path.join(OUT_ROOT, a.date + "-monthly")
    full = os.path.join(ROOT, plan_dir)
    if os.path.exists(os.path.join(full, "plan.json")):
        sys.exit(f"REFUSED: {plan_dir}/plan.json exists; a pass never overwrites a plan that a "
                 "receipt may point at.")
    import _esl_new_identities_dryrun as N  # noqa: E402  heavy: reads the published payload
    placement = N.build()
    plan = split(placement, resolve_apart(), applied_ids(), a.session)
    plan = dict({"_about": "The ESL monthly pass (Sam's verdict on item 8, 2026-09-26): what a "
                           "level or purpose word places is applied; the rest is listed for him.",
                 "_read_at": placement["_generated_at"],
                 "verdict": "https://claude.ai/artifact/LaZmu7NYj11DigAEbxsUMS item 8"}, **plan)
    os.makedirs(full, exist_ok=True)
    json.dump(placement, open(os.path.join(full, "new_identities.json"), "w", encoding="utf-8"),
              indent=1, ensure_ascii=False)
    json.dump(plan, open(os.path.join(full, "plan.json"), "w", encoding="utf-8"),
              indent=1, ensure_ascii=False)
    c = plan["counts"]
    print(f"{plan_dir}: apply {c['apply']} · list for Sam {c['listed']} · "
          f"ruled apart {c['ruled_apart']} · skipped {c['skipped']}")
    for i in plan["inserts"]:
        print(f"  apply  {i['id']} -> {i['to']} ({i['bucket']}; {i['how']})")
    for x in plan["listed"]:
        print(f"  list   {x['id']} {x['title'][:50]!r}: {x['why']}")
    if c["apply"]:
        print(f"next: dispatch esl-sheet-apply.yml with plan_dir={plan_dir}, mode dry-run, then commit")
    return 0


if __name__ == "__main__":
    sys.exit(main())
