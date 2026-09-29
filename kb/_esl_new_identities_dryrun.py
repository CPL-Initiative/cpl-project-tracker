#!/usr/bin/env python3
"""Place the ESL identities the fold has not reached yet: a dry run, nothing written.

  python3 kb/_esl_new_identities_dryrun.py            -> kb/esl_sheet_out/<date>/new_identities.json + a summary

The ESL merging sheet (Sam, 2026-09-26, https://claude.ai/artifact/LaZmu7NYj11DigAEbxsUMS),
item 5: "Fold the 92 under this sheet's answers in one dated cohort, after a dry run that
lists every placement." Item 8 makes it the monthly pass: the same script, run again,
places whatever reached ESL since.

A NEW identity is a published ESL row that no fold, re-level or curator row points
anywhere yet. Each is placed by the rules in force, in their precedence:

  1. purpose first: citizenship -> Civic, health -> Vocational - Healthcare, vocational ->
     Vocational, a culture or leisure frame -> Enrichment (the fold's classifier and the
     apply's Enrichment and Healthcare rules, imported, never copied);
  2. transfer composition stays apart (unruled, as in the first fold);
  3. a level word on the identity title, then its member courses' rungs through Sam's
     per-ladder sets with the noncredit shift (the ladder script's decide(), imported);
  4. Beginning when nothing speaks.

A cluster whose member courses carry a subject the subject map places outside ESL is
held out and listed: a mixed cluster folded into a comprehensive hides its stranger
among a thousand members (the film course in Enrichment, sheet item 9).
"""
import argparse
import collections
import datetime
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _esl_package_dryrun as D          # noqa: E402  the fold's classifier
import _esl_package_apply as A           # noqa: E402  Enrichment and Healthcare
import _esl_ladder_relevel_dryrun as LAD  # noqa: E402  Sam's sets and the vote
import alias_chain as AC                 # noqa: E402  stored ids resolve first (Rule 7)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ESL_DISCIPLINES = D.ESL_DISCIPLINES | {"English as a Second Language (ESL)"}
FOLD_PLAN = "kb/esl_package_out/2026-08-24/esl_apply_plan.json"
FIRST_PLAN = "kb/esl_package_out/2026-07-15/esl_package_plan.json"
# Both plans were written after the 2026-07-10 re-mint, so every map after it is pending
# for their ids (measured 2026-09-26: none of their ESL ids has moved since).
PLAN_ERA = "kb/pols_remint_out/2026-07-10/alias_map.json"
SURVIVOR = {"Beginning ESL": "ESOL M9168", "Intermediate ESL": "ESOL M9256",
            "Advanced ESL": "ESOL M1141", "Vocational ESL": "ESOL M9023",
            "Vocational ESL — Healthcare": "ESOL M91IL", "Civic ESL": "ESOL M9177",
            "Enrichment ESL": "ESOL M1152"}


def load_js(fname):
    return LAD.load_js(fname)


def plan_resolver():
    """A stored plan id -> today's id, through the one alias chain. A plan id compared
    with the live set directly reads a re-minted identity as new (Rule 7)."""
    pending, _ = AC.pending_maps([], baseline_through=PLAN_ERA)
    maps = AC.load_maps(pending)
    return lambda i: AC.resolve_id(i, maps)


def subject_of_cn():
    mm = json.load(open(os.path.join(ROOT, "kb/coci_minted_memberships.json"), encoding="utf-8"))
    out = {}
    for plist in (mm.get("memberships") or mm).values():
        for m in plist:
            cn = str(m.get("control_number") or "").strip().upper()
            if cn and m.get("subject"):
                out[cn] = m["subject"]
    return out


def member_subject(m, subj):
    """The member course's local subject: COCI's, by control number, else the prefix of
    its course number. ESOL M9267 "Optical Technician 1" carries HLTH 614 and NC 311, and
    neither control number is in the memberships file, so without the fallback a clearly
    occupational course passed the mixed-cluster check on missing evidence."""
    s = subj.get(str(m.get("cn") or "").strip().upper())
    if s:
        return s
    n = (m.get("n") or "").strip().upper()
    head = n.split(" ")[0] if " " in n else "".join(ch for ch in n if ch.isalpha())
    return "".join(ch for ch in head if ch.isalpha())


def place(title, members, ladders, table, over):
    """(bucket, how). Purpose first, transfer apart, then the level."""
    bucket, _, signal, _, _ = D.classify(title)
    if signal == "carveout-citizenship":
        return "Civic ESL", "purpose: citizenship"
    if signal in ("carveout-health", "carveout-vesl"):
        return ("Vocational ESL — Healthcare" if A.is_healthcare(title) else "Vocational ESL",
                "purpose: " + ("health" if A.is_healthcare(title) else "vocational"))
    if signal == "carveout-transfer":
        return None, "transfer composition: held apart (unruled)"
    if A.is_enrichment(title):
        return "Enrichment ESL", "purpose: culture or leisure frame"
    row = {"identity_title": title, "members": members}
    band, how, _ = LAD.decide(row, ladders, table, over)
    if band:
        return band + " ESL", "level: " + ("identity title word" if how in ("word", "combo") else "member ladder vote")
    return "Beginning ESL", "level: nothing speaks, Beginning by default"


def build():
    data = load_js("unified_courses_data.js")
    memp = load_js("unified_courses_members.js")
    cols, mem = memp["colleges"], memp["members"]
    subj_map = json.load(open(os.path.join(ROOT, "kb/reference/subject_discipline_map.json"),
                              encoding="utf-8"))["map"]
    subj = subject_of_cn()
    R = plan_resolver()
    folded = {R(f["id"]) for f in json.load(open(os.path.join(ROOT, FOLD_PLAN), encoding="utf-8"))["folds"]}
    # The first plan held transfer composition apart; a title the classifier no longer
    # reads as transfer (ESOL M1239, "Composition, Reading, and Freshman English") keeps
    # that hold rather than falling to Beginning. Item 4 folds the three it names.
    first = {R(i["id"]): i["bucket"] for i in json.load(open(os.path.join(ROOT, FIRST_PLAN),
                                                           encoding="utf-8"))["identities"]}
    _, table, over = LAD.load_sets()
    ladders, _ = LAD.college_ladders()
    survivors = set(SURVIVOR.values())
    out, held = [], []
    for r in data["rows"]:
        if (r.get("disc") or "") not in ESL_DISCIPLINES or r["id"] in survivors or r["id"] in folded:
            continue
        ms = mem.get(r["id"], [])
        members = [{"college": cols[m["c"]], "local_title": m.get("t") or "",
                    "control_number": m.get("cn") or ""} for m in ms]
        outside = sorted({subj_map.get(member_subject(m, subj), None) or ""
                          for m in ms} - {"", "English as a Second Language"})
        rec = {"id": r["id"], "title": r.get("title", ""), "credit": r.get("credit"),
               "members": len(ms), "discipline": r.get("disc")}
        if first.get(r["id"]) == "Transfer-level ESL (review)":
            held.append(dict(rec, why="transfer composition in the first plan: held apart (unruled)"))
            continue
        if outside:
            held.append(dict(rec, why="a member course's subject maps outside ESL: " + ", ".join(outside)))
            continue
        bucket, how = place(r.get("title", ""), members, ladders, table, over)
        if bucket is None:
            held.append(dict(rec, why=how))
            continue
        out.append(dict(rec, bucket=bucket, target=SURVIVOR[bucket], how=how))
    return {"_about": "ESL identities no fold has reached, placed by the rules in force; a dry run.",
            "_generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
            "placements": out, "held": held,
            "counts": {"placed": len(out), "held": len(held),
                       "by_bucket": dict(collections.Counter(p["bucket"] for p in out)),
                       "by_how": dict(collections.Counter(p["how"] for p in out))}}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", default=datetime.date.today().isoformat())
    a = ap.parse_args()
    p = build()
    outdir = os.path.join(ROOT, "kb", "esl_sheet_out", a.date)
    os.makedirs(outdir, exist_ok=True)
    json.dump(p, open(os.path.join(outdir, "new_identities.json"), "w", encoding="utf-8"),
              indent=1, ensure_ascii=False)
    c = p["counts"]
    print(f"placed {c['placed']}, held {c['held']}")
    for k, v in sorted(c["by_bucket"].items(), key=lambda x: -x[1]):
        print(f"  {v:4}  {k}")
    for k, v in sorted(c["by_how"].items(), key=lambda x: -x[1]):
        print(f"  {v:4}  {k}")
    for h in p["held"]:
        print(f"  held {h['id']} {h['title'][:50]!r}: {h['why']}")


if __name__ == "__main__":
    main()
