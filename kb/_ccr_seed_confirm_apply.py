#!/usr/bin/env python3
"""Apply: stamp the seed cards both second signals confirm, one discipline at a time (S615).

Sam's Open Asks Sheet 174 card 1 (2026-11-09 02:25Z, *confirm*): Kinesiology's 627 cards, where the catalog
description fits the seed discipline with a clear margin and TOP's plurality names the same discipline
(`kb/_ccr_seed_recheck_dryrun.py`, verdict `confirmed_by_description_and_top`).

Each confirmed card in kb/coci_minted_courses.json gets

  discipline_source      "description_and_top"  (the seed, confirmed by two signals; the auditor scores it
                                                  inferred-high, as it scores the subject map)
  discipline_confidence  0.8                    (the subject map's)
  _seed_confirm_from     {ruling, run, date, desc, top}

The discipline itself never changes. TOP stays a corroborator: it counts only beside a description that agrees.
Cards that are curated, already sourced, or any other verdict are left alone; the 8 for a curator are the Courses
List's *Discipline in doubt* job.

  python3 kb/_ccr_seed_confirm_apply.py --discipline Kinesiology             dry run: prints the count
  python3 kb/_ccr_seed_confirm_apply.py --discipline Kinesiology --expect 627 --apply
  python3 kb/_ccr_seed_confirm_apply.py --undo kb/ccr_seed_confirm_out/<date>/<slug>.json

--apply refuses unless the recomputed count equals --expect (the number Sam confirmed). The receipt holds each
card's before-values, so --undo restores them exactly (Rule 10 a2). Nothing in Supabase moves.
"""
import argparse
import json
import os
import re
import sys
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
COURSES = os.path.join(HERE, "coci_minted_courses.json")
OUT = os.path.join(HERE, "ccr_seed_confirm_out")
SOURCE = "description_and_top"
CONF = 0.8
STAMP = "_seed_confirm_from"
FIELDS = ("discipline_source", "discipline_confidence", STAMP)
VERDICT = "confirmed_by_description_and_top"


def read(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def write(path, obj):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
        f.write("\n")


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def confirmed(discipline):
    """The discipline's cards whose verdict is confirmed_by_description_and_top, recomputed now."""
    import _ccr_seed_recheck_dryrun as R
    import _ccr_desc_signal as S
    from _alias_canon import alternate_to_canonical, resolve_target
    rev = alternate_to_canonical()
    topmap = {c: resolve_target(d, rev, "top_discipline_map[%s]" % c)
              for c, d in R.load("top_discipline_map.json")["map"].items()}
    courses = R.load("coci_minted_courses.json")["courses"]
    mem = R.load("coci_minted_memberships.json")
    mem = mem.get("memberships", mem)
    cur = R.load("coci_curation.json").get("curations", {})
    desc = S.load_descriptions()
    singles = R.load("coci_minted_singletons.json")["courses"]
    train = S.trusted(courses, singles, cur, mem, desc)
    model = S.Model([(d, t) for _c, d, t, _b in train])
    rows = R.classify(courses, mem, topmap, cur, model, desc).get(discipline) or {}
    return sorted((r for k in ("top_agrees", "top_differs", "no_top") for r in rows.get(k, [])
                   if R.combine(k, r.get("desc_kind", "no_desc")) == VERDICT), key=lambda r: r["id"])


def apply(discipline, expect, ruling, run):
    rows = confirmed(discipline)
    if expect is None or len(rows) != expect:
        print("refusing: %d cards confirmed now, --expect %s" % (len(rows), expect))
        return 2
    doc = read(COURSES)
    courses = doc["courses"]
    today = date.today().isoformat()
    before = {}
    for r in rows:
        rec = courses[r["id"]]
        if rec.get("discipline") != discipline or rec.get("discipline_source"):
            print("refusing: %s changed under the run" % r["id"])
            return 2
        before[r["id"]] = {k: rec.get(k) for k in FIELDS if k in rec}
        rec["discipline_source"] = SOURCE
        rec["discipline_confidence"] = CONF
        rec[STAMP] = {"ruling": ruling, "run": run, "date": today,
                      "desc": [[d, round(float(x), 4)] for d, x in (r.get("desc") or [])[:2]],
                      "top": r.get("votes")}
    write(COURSES, doc)
    os.makedirs(os.path.join(OUT, today), exist_ok=True)
    receipt = os.path.join(OUT, today, slug(discipline) + ".json")
    write(receipt, {"_about": "kb/_ccr_seed_confirm_apply.py receipt: the cards stamped and their before-values. "
                              "Undo: python3 kb/_ccr_seed_confirm_apply.py --undo <this file>.",
                    "discipline": discipline, "ruling": ruling, "run": run, "date": today, "source": SOURCE,
                    "confidence": CONF, "count": len(rows), "before": before})
    print("stamped %d %s cards; receipt %s" % (len(rows), discipline, os.path.relpath(receipt, os.path.dirname(HERE))))
    return 0


def undo(path):
    rec = read(path)
    doc = read(COURSES)
    courses = doc["courses"]
    n = 0
    for cid, prev in rec["before"].items():
        c = courses.get(cid)
        if not c or c.get("discipline_source") != rec["source"]:
            continue
        for k in FIELDS:  # in place, so the file reads back byte for byte
            if k in prev:
                c[k] = prev[k]
            else:
                c.pop(k, None)
        n += 1
    write(COURSES, doc)
    print("restored %d of %d cards" % (n, len(rec["before"])))
    return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--discipline")
    ap.add_argument("--expect", type=int)
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--undo")
    ap.add_argument("--ruling", default="Open Asks Sheet 174 card 1 (Sam, 2026-11-09: confirm)")
    ap.add_argument("--run", default="S615")
    a = ap.parse_args()
    if a.undo:
        return undo(a.undo)
    if not a.discipline:
        ap.error("--discipline is required")
    if a.apply:
        return apply(a.discipline, a.expect, a.ruling, a.run)
    print("dry run: %d %s cards confirmed by description and TOP" % (len(confirmed(a.discipline)), a.discipline))
    return 0


if __name__ == "__main__":
    sys.exit(main())
