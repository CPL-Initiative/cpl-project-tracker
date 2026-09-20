#!/usr/bin/env python3
"""Trial: can Jev reach the Common CR Reference merges no matcher reaches?

THE PROBLEM, measured 2026-09-20 from kb/cr_reference_worklist.json:
  · 1,936 of 2,159 groups sit on rung 5 — nothing decides them today.
  · NONE of them holds more than one wording, so the judgment is ACROSS
    groups, not within one. Brute force is 1,873,080 pairs.
  · Blocking on SHARED CANONICAL cuts that to 280 pairs — 0.015% — reaching
    160 rung-5 groups that carry 20.4% of all articulation rows.

WHY THE SHAPE FITS JEV: every such cluster already contains a rung-1 or rung-2
anchor — a published statewide line or a C-ID match. So each question is a
closed yes/no against an authority, not open-ended matching.

Per pair we ask TWO questions in ONE call (Jev answers a set at once):
  same  — noul  : is this the same recommendation as the anchor?
  care  — score : how much curator attention does this pair deserve?

⚠️ THIS SUGGESTS, IT NEVER MERGES. Rung 5 reads "similarity suggests, never
merges", and Rule 7's TOP doctrine says an unreliable signal must never gate
identity. Output is a ranked worklist for a curator. Nothing is written to
Supabase and nothing is decided here.

Run on a RUNNER — typesafe.ai is egress-blocked from the agent sandbox.
    python3 kb/_typesafe_cr_trial.py --limit 40      # cheap first look
    python3 kb/_typesafe_cr_trial.py                 # all 280
"""

import collections
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _typesafe_smoke import noul, score, system_one  # noqa: E402

WORKLIST = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                        "cr_reference_worklist.json")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "typesafe_cr_trial_out")
ANCHOR_RUNGS = (1, 2, 3)   # mechanically trustworthy: statewide, C-ID, CCR identity


def rec_of(group):
    members = group.get("members") or []
    return (members[0].get("rec") or "").strip() if members else ""


def build_pairs():
    """Cluster by canonical; pair every non-anchor group against its anchor."""
    groups = json.load(open(WORKLIST, encoding="utf-8"))["groups"]
    by_canon = collections.defaultdict(list)
    for g in groups:
        canon = (g.get("canonical") or "").strip()
        if canon:
            by_canon[canon].append(g)

    pairs = []
    for canon, members in by_canon.items():
        if len(members) < 2:
            continue
        anchors = [m for m in members if m.get("rung") in ANCHOR_RUNGS]
        if not anchors:
            continue
        anchor = max(anchors, key=lambda m: m.get("rows") or 0)
        for other in members:
            if other is anchor or other.get("rung") in ANCHOR_RUNGS:
                continue
            pairs.append({
                "canonical": canon,
                "anchor_key": anchor.get("key"),
                "anchor_rec": rec_of(anchor),
                "anchor_rung": anchor.get("rung"),
                "cand_key": other.get("key"),
                "cand_rec": rec_of(other),
                "cand_rung": other.get("rung"),
                "rows": other.get("rows") or 0,
                "colleges": other.get("colleges") or 0,
            })
    # Work the head first: rows are what a merge actually collapses.
    pairs.sort(key=lambda p: -p["rows"])
    return pairs


def ask(pair, key):
    """One call, two questions. State stays tight on purpose — TypeSafe's own
    guidance is that irrelevant detail costs accuracy."""
    state = {
        "published_recommendation": pair["anchor_rec"],
        "candidate_recommendation": pair["cand_rec"],
        "shared_course": pair["canonical"],
    }
    questions = {
        "same": noul(
            "Do these two credit recommendations describe the same course content, "
            "such that one college's award and the other's should be treated as the "
            "same recommendation?",
            {"yes": "Same content. Wording differs only.",
             "no": "Different content, even though both map to the same course code."}),
        "care": score(
            "How much curator attention does this pair deserve before acting?",
            ["Obvious — act without review.",
             "Clear, a glance is enough.",
             "Genuinely arguable — a curator should decide.",
             "Likely wrong to merge — needs a subject expert."]),
    }
    answers = (system_one(state, questions, key).get("answers") or {})
    same = answers.get("same") or {}
    return {
        "same": same.get("noul"),
        "p": same.get("probability", same.get("confidence")),
        "care": (answers.get("care") or {}).get("score"),
    }


def main():
    key = (os.environ.get("TYPESAFE_API_KEY") or "").strip()
    if not key:
        print("❌ TYPESAFE_API_KEY is not set. This runs on a GitHub Actions runner.")
        return 2

    pairs = build_pairs()
    limit = None
    if "--limit" in sys.argv:
        limit = int(sys.argv[sys.argv.index("--limit") + 1])
        pairs = pairs[:limit]

    print(f"{len(pairs)} candidate pair(s) from shared-canonical blocking"
          f"{f' (limited to {limit})' if limit else ''}")
    print(f"rows they cover: {sum(p['rows'] for p in pairs):,}\n")

    results = []
    for i, p in enumerate(pairs, 1):
        try:
            verdict = ask(p, key)
        except SystemExit as e:
            print(f"  stopped at pair {i}: {e}")
            break
        results.append({**p, **verdict})
        mark = {True: "MERGE", False: "keep ", None: "  ?  "}.get(verdict["same"], "  ?  ")
        prob = f"{verdict['p']:.2f}" if isinstance(verdict["p"], (int, float)) else " -- "
        print(f"  {mark} p={prob} care={verdict['care']} "
              f"{p['rows']:>4}r  {p['cand_rec'][:52]:<52} vs {p['anchor_rec'][:40]}")

    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, "trial.json"), "w", encoding="utf-8") as f:
        json.dump({"_doc": "Jev suggestions for Common CR Reference. SUGGESTS, never merges.",
                   "pairs": results}, f, indent=1)

    merges = [r for r in results if r["same"] is True]
    rows = sum(r["rows"] for r in merges)
    print(f"\n{'='*70}")
    print(f"Jev says MERGE on {len(merges)} of {len(results)} pairs, "
          f"covering {rows:,} articulation rows.")
    print(f"Wrote {OUT}/trial.json — a worklist for a curator, not a decision.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
