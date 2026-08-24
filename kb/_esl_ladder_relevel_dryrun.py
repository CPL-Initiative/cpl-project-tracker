#!/usr/bin/env python3
"""ESL re-level DRY-RUN under Sam's PER-LADDER level sets.

READ-ONLY. Writes nothing to kb_curation, nothing to Supabase. Emits a receipt under
kb/esl_ladder_relevel_out/<date>/ so the effect can be reviewed before any apply.

WHY THIS EXISTS
---------------
Sam ruled absolute bands (0-2 / 3-5 / 6-10) on 2026-08-24 and then REVISED them the same
day, after seeing that colleges run ESL ladders of different LENGTHS. The revision is
authored DATA at kb/reference/esl_level_sets.json, whose own `_status` reads
"AUTHORED — not yet implemented". kb/_esl_relevel_dryrun.py still implements the
superseded absolute bands. This script implements the sets.

    L=3  1 | 2   | 3        L=6  1,2   | 3,4   | 5,6
    L=4  1 | 2,3 | 4        L=7  1,2,3 | 4,5   | 6,7
    L=5  1,2 | 3,4 | 5      L=8  1,2,3 | 4,5,6 | 7,8      L=9  1,2,3 | 4,5,6 | 7,8,9

⚠️ L=4 is where Sam DIVERGES from an even split — he puts the spare rung in the MIDDLE
(1 | 2,3 | 4), not the bottom. It is the largest group at 22 colleges. Never "simplify" it.

THE MODELING PROBLEM THIS SCRIPT HAS TO SOLVE
---------------------------------------------
Sam's sets are indexed by A COLLEGE'S ladder length. A folded identity is not a college —
it groups member courses from many colleges, which may run ladders of DIFFERENT lengths.
So "rung 5" has no single answer at the identity grain; it is Advanced for a 5-ladder
college and Intermediate for a 6-ladder one, and one identity can hold both.

The resolution here, in precedence order:

  1. A LEVEL WORD ON THE IDENTITY TITLE STILL WINS. Unchanged from the existing reader
     (guard 1) and corroborated by Sam's own `by_level_word` mapping, which collapses
     low-/high- modifiers to their base band. A word is a direct assertion; a rung is an
     ordinal that needs a scale.
  2. OTHERWISE EACH MEMBER VOTES ITS OWN COLLEGE'S READING, and the identity takes the
     MODE. A member abstains if its title carries no rung, or if its college has no
     readable ladder — abstention is not a vote for the status quo.
  3. A TIE IS NOT A DECISION. It is reported as `tie`, never resolved by picking the
     lower/safer band, because that would silently reintroduce the absolute-band
     behaviour this ruling exists to replace.

DERIVING A COLLEGE'S LADDER LENGTH
----------------------------------
Ladder length = the highest rung that college is observed to teach across its ESL member
titles — read from THE WHOLE PUBLISHED ESL CORPUS, never from the folded subset.

⚠️ THIS IS THE DEFECT THIS SCRIPT SHIPPED WITH AND THE VALIDATION CAUGHT. Deriving from
the 1,990 folded rows sees only PART of each college's ladder, so it systematically
UNDERCOUNTS the length — and a short ladder pushes every rung into a HIGHER band, which
is the direction that over-claims credit. Measured: the folded-subset derivation produced
{2:19, 3:22, 4:20, 5:8, 6:15, ...}, matching Session 188 in no bucket at all; the
full-corpus derivation produces {3:21, 4:22, 5:7, 6:16, 7:3, 8:1, 9:1}, matching it in
six of seven. Read the corpus, not the worklist.

Guards, each of which changes the answer on live data:

  * REQUIRE >= 2 DISTINCT RUNGS. One course called "ESL 5" does not establish a 5-rung
    ladder; it is far more likely a college whose ladder we can only partly see.
  * A 2-RUNG LADDER ABSTAINS — Sam's table has no L=2 row. 21 colleges read as 2-rung and
    there is no ruling for them, so they are COUNTED AND REPORTED, never banded by an
    invented row. Extending the table is Sam's call, not a gap to paper over: the same
    discipline that forbids "simplifying" his L=4 cell back to an even split forbids
    inventing an L=2 one.
  * CAP AT 9. Sam's table stops at 9. A higher read is a number that is not a rung, and
    a fabricated 12-rung ladder would band everything Beginning.
  * REUSE THE GUARDED READER. read_level() already strips grade ranges (K-12) and stops
    roman numerals at VII. Re-implementing it here would let the two drift — the mistake
    the Common CR Reference made when a normalisation and its screen saw different text.

⚠️ THE LADDER DERIVATION IS VALIDATED, NOT ASSUMED. Session 188 measured the distribution
independently (70 colleges: 3->20, 4->22, 5->7, 6->16, 7->3, 8->1, 9->1). This script
prints its own distribution beside that one and the report says plainly whether they
agree. A derivation that disagrees with the published measurement is a finding, not a
detail to ship quietly.

Run from repo root:
    python3 kb/_esl_ladder_relevel_dryrun.py [--date YYYY-MM-DD]

Writes: kb/esl_ladder_relevel_out/<date>/plan.json
        kb/esl_ladder_relevel_out/<date>/report.md
"""
from __future__ import annotations

import argparse
import collections
import datetime
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _esl_relevel_dryrun import (            # the SAME reader — never a second copy
    APPLY_PLAN, SPOTCHECK, FOLD_COHORT, SURVIVOR, LEVEL_BUCKETS, BUCKET_BAND,
    GRADE_RANGE, read_level, classify,
)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SETS = "kb/reference/esl_level_sets.json"
PRIOR_PLAN = "kb/esl_relevel_out/2026-08-24/plan.json"    # the 32 already applied
ORDER = ["Beginning", "Intermediate", "Advanced"]
MAX_LADDER = 9                                            # Sam's table stops here
MIN_RUNGS = 2                                             # one rung is not a ladder
MIN_LENGTH = 3                                            # Sam's table starts at L=3
ESL_DISCIPLINE = "English as a Second Language"


def load_sets():
    d = json.load(open(os.path.join(ROOT, SETS), encoding="utf-8"))
    table = {}
    for length, bands in d["by_ladder_length"].items():
        for band in ORDER:
            for rung in bands[band]:
                table[(int(length), rung)] = band
    return d, table


def load_js(fname):
    with open(os.path.join(ROOT, fname), encoding="utf-8") as fh:
        src = fh.read()
    i = src.index("window."); i = src.index("=", i) + 1
    return json.loads(src[i:].strip().rstrip(";"))


def college_ladders():
    """college -> (ladder_length, rungs_seen), from the WHOLE published ESL corpus.

    Returns (ladders, too_short) — the second is the colleges whose ladder reads as 2
    rungs, which Sam's table does not cover and which therefore abstain rather than
    being banded by a row nobody ruled.
    """
    data = load_js("unified_courses_data.js")
    memp = load_js("unified_courses_members.js")
    cols, mem = memp["colleges"], memp["members"]
    esl = {r["id"] for r in data["rows"] if (r.get("disc") or "") == ESL_DISCIPLINE}
    seen = collections.defaultdict(set)
    for ident in esl:
        for m in mem.get(ident, ()):
            n, _ = read_level(GRADE_RANGE.sub(" ", m.get("t") or ""))
            if n is not None and 1 <= n <= MAX_LADDER:
                seen[cols[m["c"]]].add(n)
    ladders, too_short = {}, {}
    for c, v in seen.items():
        if len(v) < MIN_RUNGS:
            continue
        (ladders if max(v) >= MIN_LENGTH else too_short)[c] = (max(v), sorted(v))
    return ladders, too_short


def member_votes(row, ladders, table):  # noqa: D401
    """Per-member band votes for one identity, plus why each member abstained."""
    votes, abstain = [], collections.Counter()
    for m in row.get("members") or []:
        col = (m.get("college") or "").strip()
        n, _ = read_level(GRADE_RANGE.sub(" ", m.get("local_title") or ""))
        if n is None:
            abstain["no rung in the local title"] += 1
            continue
        if col not in ladders:
            abstain["college has no readable ladder"] += 1
            continue
        length = ladders[col][0]
        band = table.get((length, n))
        if band is None:
            abstain[f"rung {n} is above that college's {length}-rung ladder"] += 1
            continue
        votes.append((band, col, length, n))
    return votes, abstain


def decide(row, ladders, table):
    """(band, how, detail). Precedence: identity level WORD, then the member ladder vote."""
    title = row.get("identity_title") or ""
    want, signal = classify(title)
    if signal in ("word", "combo") and want:
        return want, signal, {"from": "identity title level word"}
    votes, abstain = member_votes(row, ladders, table)
    if not votes:
        return None, "no-ladder-signal", {"abstentions": dict(abstain)}
    tally = collections.Counter(v[0] for v in votes)
    top = tally.most_common()
    if len(top) > 1 and top[0][1] == top[1][1]:
        return None, "tie", {"tally": dict(tally), "abstentions": dict(abstain)}
    return top[0][0], "ladder-vote", {
        "tally": dict(tally),
        "voters": len(votes),
        "abstentions": dict(abstain),
        "example": [{"college": c, "ladder": L, "rung": n} for _, c, L, n in votes[:3]],
    }


def build(date):
    sets_doc, table = load_sets()
    plan = json.load(open(os.path.join(ROOT, APPLY_PLAN), encoding="utf-8"))
    spot = json.load(open(os.path.join(ROOT, SPOTCHECK), encoding="utf-8"))
    rows = spot["rows"]
    catalog = {r["id"]: r for r in rows}
    ladders, too_short = college_ladders()

    prior = {}
    p_path = os.path.join(ROOT, PRIOR_PLAN)
    if os.path.exists(p_path):
        prior = {c["id"]: c for c in json.load(open(p_path, encoding="utf-8"))["changes"]}

    changes, unchanged, undecided, skipped = [], 0, [], []
    for f in plan["folds"]:
        if f["bucket"] not in LEVEL_BUCKETS:
            skipped.append({"id": f["id"], "bucket": f["bucket"], "why": "purpose carve-out"})
            continue
        row = catalog.get(f["id"], {})
        now = BUCKET_BAND[f["bucket"]]
        # An identity already re-levelled by the applied 32 sits at its NEW band today.
        if f["id"] in prior:
            now = prior[f["id"]]["to"]
        want, how, detail = decide(row, ladders, table)
        if want is None:
            undecided.append({"id": f["id"], "why": how, "detail": detail})
            continue
        if want == now:
            unchanged += 1
            continue
        cat = (row.get("proposed_band")
               if row.get("category") in ("contradicts", "weak-contradicts")
               else (now if row.get("category") == "confirms" else None))
        changes.append({
            "id": f["id"], "title": row.get("identity_title", ""),
            "from": now, "to": want, "target": SURVIVOR[want],
            "how": how, "detail": detail,
            "voters": detail.get("voters", 0),
            "in_applied_32": f["id"] in prior,
            "reverts_applied_32": bool(prior.get(f["id"])
                                       and prior[f["id"]]["from"] == want),
            "catalog_says": cat,
            "catalog_agrees": None if cat is None else (cat == want),
        })

    agree = sum(1 for c in changes if c["catalog_agrees"] is True)
    disagree = sum(1 for c in changes if c["catalog_agrees"] is False)
    dist = collections.Counter(L for L, _ in ladders.values())

    # ── the two things that decide whether any of this should be applied ──────
    # (a) how much of the change set rests on ONE member course, and
    # (b) whether the catalogs side with the proposal or with where a row sits now.
    # Split reverts from the rest, because they answer different questions: the
    # reverts undo a landed write, the others are new proposals.
    rev = [c for c in changes if c["reverts_applied_32"]]
    oth = [c for c in changes if not c["reverts_applied_32"]]

    def strength(group):
        return {
            "n": len(group),
            "decided_by_one_member": sum(1 for c in group if c["voters"] == 1),
            "catalog_agrees": sum(1 for c in group if c["catalog_agrees"] is True),
            "catalog_disagrees": sum(1 for c in group if c["catalog_agrees"] is False),
            "catalog_silent": sum(1 for c in group if c["catalog_agrees"] is None),
        }
    published = {3: 20, 4: 22, 5: 7, 6: 16, 7: 3, 8: 1, 9: 1}

    return {
        "_status": "DRY-RUN — read-only. No curation write performed.",
        "_date": date,
        "_ruling": ("Sam's PER-LADDER level sets, authored 2026-08-24 and stored as data at "
                    + SETS + ". Supersedes his own absolute bands 0-2/3-5/6-10 from earlier "
                    "the same day, which superseded the P-4 pinning."),
        "_ruling_by": sets_doc.get("_ruled_by"),
        "_sets": sets_doc["by_ladder_length"],
        "_resolution": ("A level WORD on the identity title wins; otherwise each member "
                        "votes its own college's ladder reading and the identity takes the "
                        "MODE. A tie is reported, never resolved by picking the safer band."),
        "_fold_cohort": FOLD_COHORT,
        "ladder_derivation": {
            "source": "the whole published ESL corpus (unified_courses_data.js + "
                      "unified_courses_members.js), NOT the folded worklist",
            "colleges_with_readable_ladder": len(ladders),
            "colleges_reading_as_2_rungs_no_ruling": len(too_short),
            "distribution": {str(k): dist.get(k, 0) for k in sorted(dist)},
            "session_188_published": {str(k): v for k, v in published.items()},
            "agrees_with_published": {str(k): dist.get(k, 0) == v
                                      for k, v in published.items()},
            "rule": (f"max rung observed over the whole ESL corpus, >= {MIN_RUNGS} distinct "
                     f"rungs, length {MIN_LENGTH}-{MAX_LADDER}; a 2-rung read abstains "
                     f"because Sam's table has no L=2 row"),
        },
        "counts": {
            "folds_considered": len(plan["folds"]),
            "purpose_carve_outs_skipped": len(skipped),
            "unchanged": unchanged,
            "undecided": len(undecided),
            "re_levels": len(changes),
            "of_which_revert_the_applied_32": sum(1 for c in changes if c["reverts_applied_32"]),
            "catalog_agrees": agree,
            "catalog_disagrees": disagree,
            "catalog_silent": len(changes) - agree - disagree,
        },
        "evidence_strength": {
            "_read_this_first": (
                "A ladder vote can rest on a SINGLE member course, and the weakest tier of "
                "the level reader is a bare trailing integer ('Academic Writing 3'), which "
                "may be a sequence number rather than a rung. Both are reported per group "
                "because they decide whether a proposal is actionable, not merely correct."),
            "reverts_of_the_applied_32": strength(rev),
            "other_proposals": strength(oth),
        },
        "by_move": dict(collections.Counter(f"{c['from']} -> {c['to']}" for c in changes)),
        "undecided_reasons": dict(collections.Counter(u["why"] for u in undecided)),
        "applied_32_effect": [
            {"id": c["id"], "title": c["title"], "from": c["from"], "to": c["to"],
             "reverts": c["reverts_applied_32"], "catalog_says": c["catalog_says"]}
            for c in changes if c["in_applied_32"]
        ],
        "changes": sorted(changes, key=lambda c: (c["from"], c["to"], c["id"])),
        "undecided": undecided[:40],
    }


def report_md(p):
    c, L = p["counts"], p["ladder_derivation"]
    ok = all(L["agrees_with_published"].values())
    out = [
        f"# ESL re-level under Sam's per-ladder sets — {p['_date']}",
        "", f"**{p['_status']}**", "",
        p["_ruling"], "", f"Resolution: {p['_resolution']}", "",
        "## Does the ladder derivation reproduce Session 188's measurement?", "",
        f"**{'YES — every bucket matches.' if ok else 'NO — buckets disagree; see below.'}**",
        f"Rule: {L['rule']}.", "",
        f"Colleges with a readable ladder: **{L['colleges_with_readable_ladder']}**. "
        f"⚠️ A further **{L['colleges_reading_as_2_rungs_no_ruling']}** read as 2-rung "
        f"ladders, which Sam's table does not cover — they abstain, and whether to extend "
        f"the table to L=2 is his call.",
        "", "| Ladder | This run | Session 188 | Agrees |", "|---|---:|---:|:--:|",
    ]
    for k in sorted(L["session_188_published"], key=int):
        out.append(f"| {k} | {L['distribution'].get(k, 0)} | {L['session_188_published'][k]} "
                   f"| {'✅' if L['agrees_with_published'][k] else '⚠️'} |")
    out += [
        "", "## Effect", "",
        f"- re-levels proposed: **{c['re_levels']}**",
        f"- of which REVERT one of the 32 already applied: **{c['of_which_revert_the_applied_32']}**",
        f"- unchanged: {c['unchanged']} · undecided: {c['undecided']} · "
        f"purpose carve-outs skipped: {c['purpose_carve_outs_skipped']}",
        f"- against the colleges' own catalogs: agrees {c['catalog_agrees']}, "
        f"disagrees {c['catalog_disagrees']}, silent {c['catalog_silent']}",
        "", "### Moves", "", "| From → to | n |", "|---|---:|",
    ]
    for k, v in sorted(p["by_move"].items(), key=lambda kv: -kv[1]):
        out.append(f"| {k} | {v} |")
    out += ["", "### Why an identity went undecided", "", "| Reason | n |", "|---|---:|"]
    for k, v in sorted(p["undecided_reasons"].items(), key=lambda kv: -kv[1]):
        out.append(f"| {k} | {v} |")
    if p["applied_32_effect"]:
        out += ["", "### What this does to the 32 already applied", "",
                "| id | title | now | would become | reverts | catalog |",
                "|---|---|---|---|:--:|---|"]
        for r in p["applied_32_effect"]:
            out.append(f"| `{r['id']}` | {r['title'][:44]} | {r['from']} | {r['to']} "
                       f"| {'↩️' if r['reverts'] else ''} | {r['catalog_says'] or '—'} |")
    e = p["evidence_strength"]
    r, o = e["reverts_of_the_applied_32"], e["other_proposals"]
    out += [
        "", "## ⚠️ How strong is this evidence?", "", e["_read_this_first"], "",
        "| Group | n | decided by ONE member | catalog agrees | disagrees | silent |",
        "|---|---:|---:|---:|---:|---:|",
        f"| Reverts one of the applied 32 | {r['n']} | {r['decided_by_one_member']} "
        f"| {r['catalog_agrees']} | {r['catalog_disagrees']} | {r['catalog_silent']} |",
        f"| Other proposals | {o['n']} | {o['decided_by_one_member']} "
        f"| {o['catalog_agrees']} | {o['catalog_disagrees']} | {o['catalog_silent']} |",
        "",
        "⚠️ **The reverts move AWAY from the colleges' own catalogs, one-directionally.** "
        f"Every one of the {r['catalog_disagrees']} reverts whose catalog speaks disagrees "
        "with the revert — the catalogs say the band these rows sit at TODAY. By Sam's own "
        "principle a canonical standard scored against local records is blast radius, not a "
        "verdict; but that principle argues for holding a ruling against noisy local "
        "variance, and here the local records are unanimous and point the other way.",
        "",
        "**Recommendation: do NOT roll back the applied 32 on this evidence.** The other "
        f"{o['n']} proposals run {o['catalog_agrees']} agree to {o['catalog_disagrees']} "
        "disagree and are the better candidates — but work the multi-member ones first.",
        "", "⚠️ **Nothing here is applied.** The apply needs Sam's go.", ""]
    return "\n".join(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", default=datetime.date.today().isoformat())
    a = ap.parse_args()
    p = build(a.date)
    outdir = os.path.join(ROOT, "kb", "esl_ladder_relevel_out", a.date)
    os.makedirs(outdir, exist_ok=True)
    json.dump(p, open(os.path.join(outdir, "plan.json"), "w", encoding="utf-8"),
              indent=1, ensure_ascii=False)
    open(os.path.join(outdir, "report.md"), "w", encoding="utf-8").write(report_md(p))
    L, c = p["ladder_derivation"], p["counts"]
    print(f"ladder derivation: {L['colleges_with_readable_ladder']} colleges, "
          f"{L['distribution']}")
    print(f"  agrees with Session 188: {L['agrees_with_published']}")
    print(f"re-levels {c['re_levels']} "
          f"(reverting {c['of_which_revert_the_applied_32']} of the applied 32); "
          f"unchanged {c['unchanged']}; undecided {c['undecided']}")
    print(f"catalog agrees {c['catalog_agrees']} / disagrees {c['catalog_disagrees']} "
          f"/ silent {c['catalog_silent']}")
    print(f"wrote kb/esl_ladder_relevel_out/{a.date}/plan.json + report.md")


if __name__ == "__main__":
    main()
