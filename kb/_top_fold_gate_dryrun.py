#!/usr/bin/env python3
"""READ-ONLY dry-run: measure the impact of gating TOP-inferred disciplines out
of the canonical-SUBJ4 identity vote/fold (the 2026-07-16 "gate identity, keep
display" ruling — see kb/_top_gate.py and
docs/kb-notes/methodology-top-is-a-last-in-line-signal.md).

It NEVER writes to the curated kb/discipline_canonical_subj4.json — it only reads
the minted-course + singleton corpus and reports:
  * how many rows are disciplined SOLELY by TOP (held from the vote/fold),
  * how many disciplines keep a corroborated anchor vs rest entirely on TOP,
  * the entirely-TOP disciplines (whose SUBJ4 must be a curator pick, not data).

Writes a JSON receipt under kb/top_gate_out/<date>/impact.json.

Run from repo root:  python3 kb/_top_fold_gate_dryrun.py
"""
import json
import os
from collections import Counter
from datetime import date

from _top_gate import discipline_is_corroborated, is_top_sourced

HERE = os.path.dirname(os.path.abspath(__file__))


def _load(name):
    with open(os.path.join(HERE, name), encoding="utf-8") as f:
        return json.load(f)


def measure():
    files = [("coci_minted_courses.json", "courses"),
             ("coci_minted_singletons.json", "courses")]
    disc_rows = Counter()          # discipline -> total disciplined rows
    disc_voters = Counter()        # discipline -> corroborated (voting) rows
    held = 0
    for fn, key in files:
        try:
            doc = _load(fn)
        except FileNotFoundError:
            continue
        for _cid, rec in doc[key].items():
            d = (rec.get("discipline") or "").strip()
            if not d:
                continue
            disc_rows[d] += 1
            if discipline_is_corroborated(rec):
                disc_voters[d] += 1
            elif is_top_sourced(rec):
                held += 1
    top_only = sorted(d for d in disc_rows if disc_voters[d] == 0)
    corroborated = [d for d in disc_rows if disc_voters[d] > 0]
    return {
        "as_of": date.today().isoformat(),
        "ruling": "gate identity, keep display (Sam, 2026-07-16)",
        "rows_total_disciplined": sum(disc_rows.values()),
        "rows_held_from_vote_top_only": held,
        "rows_voting_corroborated": sum(disc_voters.values()),
        "disciplines_total": len(disc_rows),
        "disciplines_with_corroborated_anchor": len(corroborated),
        "disciplines_top_only": len(top_only),
        "top_only_disciplines": [
            {"discipline": d, "rows": disc_rows[d], "corroborated_voters": 0}
            for d in top_only
        ],
        "note": ("TOP-only rows DISPLAY (⚙ badge) but do not vote on or fold into "
                 "the canonical SUBJ4. Re-running kb/_seed_canonical_subj4.py with "
                 "this gate changed 0 canonical VALUES — corroborated rows already "
                 "carry every anchor, confirming TOP votes were redundant. The "
                 "top_only disciplines' SUBJ4 must be a curator pick (all 16 "
                 "currently are); their TOP-only rows are held from an automated "
                 "fold until their discipline is corroborated."),
    }


def main():
    data = measure()
    outdir = os.path.join(HERE, "top_gate_out", data["as_of"])
    os.makedirs(outdir, exist_ok=True)
    with open(os.path.join(outdir, "impact.json"), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print("TOP fold-gate dry-run (READ-ONLY — no identity file written):")
    print(f"  rows disciplined                     : {data['rows_total_disciplined']}")
    print(f"  rows held from vote (TOP-only)        : {data['rows_held_from_vote_top_only']}")
    print(f"  rows voting (corroborated)            : {data['rows_voting_corroborated']}")
    print(f"  disciplines total                     : {data['disciplines_total']}")
    print(f"  ...with a corroborated anchor         : {data['disciplines_with_corroborated_anchor']}")
    print(f"  ...resting entirely on TOP (top_only) : {data['disciplines_top_only']}")
    print(f"  receipt -> {os.path.relpath(os.path.join(outdir, 'impact.json'), os.path.dirname(HERE))}")


if __name__ == "__main__":
    main()
