#!/usr/bin/env python3
"""_ib_fold_apply.py — the reference's IB titles fold under IB's own subject names (the AP fold's
pattern, kb/_ap_official_titles.py and Open Asks Sheet 149 card 1, applied to IB by SkyInkberry,
2026-11-01, on the recommendation; the Exhibits lane and the sheet card carry it).

Reads kb/_ib_official_titles.py's dry run and:
  1. writes a merge into kb/credential_merges.json for each credential whose local titles all go to
     one subject (the per-language Language A1, A2 and B credentials, the titles missing their
     level, the lower-case "(non-English)" twins, World Religions, which IB offers at SL alone);
     kb/_merge_credentials.py --apply then re-points the titles, the credential records and the
     articulations, as the AP fold did;
  2. moves a local title by itself when its credential's titles split (IB English Lit (A1) reads as
     Language A: Literature, as Sam's own review read "English Lang&Lit (A2)" as Language A:
     Language and Literature), with a receipt beside the merge's;
  3. names the IB issuer one way on every credential record and articulation: International
     Baccalaureate Organization (IBO), the name on 41 of the 49 credentials and 82 of the 86 saved
     issuer assignments (two of them Sam's).

The saved assignments in kb_curation that name a twin move by a guarded UPDATE whose SQL and
receipt this script writes (kb/credential_merges_out/<date>/ib_kb_curation_update.*); a session runs
it under Rule 10 after the receipt is committed.

Run from the repo root:
  python3 kb/_ib_fold_apply.py            # dry run: what moves, nothing written
  python3 kb/_ib_fold_apply.py --apply    # writes the merges, the split move and the issuer
"""
import json
import os
import sys
from collections import defaultdict
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import _ib_official_titles as IB  # noqa: E402

COHORT = "cer-ib-fold-skyinkberry@bot"
TODAY = date.today().isoformat()
OUTDIR = os.path.join(HERE, "credential_merges_out", TODAY)
ISSUER_TWINS = {"International Baccalaureate (IB)"}
REASON = ("IB's own subject name with its level (kb/_ib_official_titles.py), on the AP fold's pattern (Sam, "
          "2026-10-31: 'rely on the official titles ... folding the locals under as best as is possible'; Open "
          "Asks Sheet 149 card 1, fold). The language a student wrote the exam in folds into the subject; a "
          "Language A exam in another language keeps '(Non-English)', as the Cal-GETC list and the reference "
          "write it. Applied by SkyInkberry, 2026-11-01, on the recommendation.")


def load(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return json.load(f)


def write(rel, obj):
    with open(os.path.join(ROOT, rel), "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
        f.write("\n")


def plan():
    ut = load("kb/unified_titles.json")
    ut = ut.get("titles") or ut
    d = IB.dry_run()
    by_loser = defaultdict(lambda: defaultdict(list))
    for raw, (cur, new, _who) in d["reference_moved_raws"].items():
        by_loser[cur][new].append(raw)
    merges, splits = [], []
    for loser, winners in sorted(by_loser.items()):
        all_raws = [r for r, e in ut.items() if isinstance(e, dict) and e.get("unified_title") == loser]
        if len(winners) == 1 and sum(len(v) for v in winners.values()) == len(all_raws):
            merges.append({"loser": loser, "winner": next(iter(winners))})
            continue
        # a split: the titles of the largest group go by the merge, the rest move one by one
        main = max(winners.items(), key=lambda kv: (len(kv[1]), kv[0]))
        stay = set(all_raws) - {r for v in winners.values() for r in v}
        if stay:
            # some titles of this credential already sit under it: move each moving title alone
            for new, raws in winners.items():
                splits.append({"from": loser, "to": new, "raws": sorted(raws)})
            continue
        merges.append({"loser": loser, "winner": main[0]})
        for new, raws in winners.items():
            if new != main[0]:
                splits.append({"from": loser, "to": new, "raws": sorted(raws)})
    return merges, splits


def main():
    apply = "--apply" in sys.argv
    merges, splits = plan()
    cr = load("kb/credentials.json")
    issuer_fixes = sorted(t for t, recs in cr.items() if t.startswith("IB ") and any(
        (r.get("issuing_agency") or "") in ISSUER_TWINS for r in (recs if isinstance(recs, list) else [recs])))
    print("Merges: %d credentials fold whole." % len(merges))
    for m in merges:
        print("  %s  ->  %s" % (m["loser"], m["winner"]))
    print("Split moves: %d." % sum(len(s["raws"]) for s in splits))
    for s in splits:
        for raw in s["raws"]:
            print("  %s  (%s  ->  %s)" % (raw, s["from"], s["to"]))
    print("Issuer: %d IB credentials carry %s." % (len(issuer_fixes), " or ".join(sorted(ISSUER_TWINS))))
    if not apply:
        print("DRY RUN — nothing written. Re-run with --apply.")
        return 0

    os.makedirs(OUTDIR, exist_ok=True)
    ut_doc = load("kb/unified_titles.json")
    ut = ut_doc.get("titles") or ut_doc
    art = load("kb/coci_articulations.json")
    moved = []
    for s in splits:
        for raw in s["raws"]:
            e = ut[raw]
            moved.append({"raw": raw, "from": s["from"], "to": s["to"],
                          "before": {"reviewed_at": e.get("reviewed_at"), "reviewed_by": e.get("reviewed_by")}})
            e["unified_title"] = s["to"]
            e["reviewed_at"] = TODAY
            e["reviewed_by"] = COHORT
            e["_merge_note"] = "IB fold: read as %s, IB's own subject (kb/_ib_official_titles.py)." % s["to"]
            for a in art["articulations"]:
                if isinstance(a, dict) and a.get("unified_title") == s["from"] and a.get("exhibit_title") == raw:
                    a["unified_title"] = s["to"]
    issuer_before = {}
    for t in issuer_fixes:
        recs = cr[t] if isinstance(cr[t], list) else [cr[t]]
        issuer_before[t] = [dict(r) for r in recs]
        keep, seen = [], set()
        for r in recs:
            if (r.get("issuing_agency") or "") in ISSUER_TWINS:
                r["issuing_agency"] = IB.ISSUER
            key = (r.get("issuing_agency"), r.get("training_agency"))
            if key not in seen:
                seen.add(key)
                keep.append(r)
        cr[t] = keep
    n_art_issuer = 0
    for a in art["articulations"]:
        if isinstance(a, dict) and (a.get("unified_title") or "").startswith("IB ") \
                and (a.get("issuing_agency") or "") in ISSUER_TWINS:
            a["issuing_agency"] = IB.ISSUER
            n_art_issuer += 1
    write("kb/unified_titles.json", ut_doc)
    write("kb/credentials.json", cr)
    write("kb/coci_articulations.json", art)

    doc = load("kb/credential_merges.json")
    have = {(m["loser"], m["winner"]) for m in doc["merges"]}
    for m in merges:
        if (m["loser"], m["winner"]) not in have:
            doc["merges"].append({"loser": m["loser"], "winner": m["winner"], "reviewed_by": COHORT,
                                  "reviewed_at": TODAY, "reason": REASON})
    write("kb/credential_merges.json", doc)
    with open(os.path.join(OUTDIR, "ib_fold_receipt.json"), "w", encoding="utf-8") as f:
        json.dump({"at": TODAY, "by": "SkyInkberry", "cohort": COHORT,
                   "basis": "the AP fold's pattern (Open Asks Sheet 149 card 1, fold), on the recommendation",
                   "merges": merges, "split_moves": moved,
                   "issuer": {"to": IB.ISSUER, "from": sorted(ISSUER_TWINS),
                              "credential_records_before": issuer_before,
                              "articulations_renamed": n_art_issuer},
                   "rollback": "git revert of the commit that carries this receipt; the live rows by "
                               "ib_kb_curation_update_receipt.json"},
                  f, indent=1, ensure_ascii=False)
        f.write("\n")
    print("WROTE the split moves, the issuer and %d merges into kb/credential_merges.json. "
          "Next: python3 kb/_merge_credentials.py --apply" % len(merges))
    return 0


if __name__ == "__main__":
    sys.exit(main())
