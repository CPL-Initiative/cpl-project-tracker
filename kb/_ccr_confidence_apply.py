#!/usr/bin/env python3
"""Apply: stamp the confidence scorer's decisions on the seedless cards, one rule at a time (S683; issues 3454 and
3480, Sources 14 and 15).

kb/_ccr_confidence_score.py decides, read-only, which seedless cards the machine accepts and why. This script writes
those decisions where the scorer's machine decisions live: on the card in kb/coci_minted_courses.json, the same store
kb/_ccr_seed_confirm_apply.py stamps and kb/_row_audit.py reads. Each decided card gets

  discipline_source      confidence_v1     the guess kept (the base scorer, rule G, rule M's keeps)
                         past_rulings_v1   moved to a narrower field by "follow past rulings"
                         music_split_v1    moved from Music to Commercial Music by rule M
  discipline             the new field, only for the two moves
  discipline_confidence  the score over 100 when the guess is kept; 0.8 (the auditor's machine-decided weight) on a
                         move, since the score measured the old guess
  _confidence_from       {rule, run, date, score, agreeing_signals, reasons, note, from (a move's old field)}

`rule` is "base", "FPR", "G" or "M", so each rule's cards are found and undone apart from the others. Rules W and D
are held on main (the second reader on #3467) and this script refuses them.

A person always wins. The scorer never decides a ruled, merged or person-curated card, and kb/_row_audit.py reads a
person's overlay discipline (kb/coci_curation.json) as curated over any stamp, so a later ruling by Sam or a curator
replaces the stamp on the next fold. kb/_row_audit.py counts every stamp here as machine-decided, never as a person's
confirmation.

  python3 kb/_ccr_confidence_apply.py --rule G [--fill-members]                  dry run: the count and a sample
  python3 kb/_ccr_confidence_apply.py --rule G --fill-members --expect N --apply --run S684
  python3 kb/_ccr_confidence_apply.py --undo --rule G                            restores rule G's cards only

The write is guarded (Rule 10): --apply refuses unless the recomputed count equals --expect, and refuses when any
card changed under the run (its discipline is not the guess, or it already carries a source). The receipt,
kb/ccr_confidence_out/<date>/receipt.json, keeps each card's before-values, so --undo --rule X puts back exactly the
cards whose `_confidence_from.rule` is X and whose stamp is still the one this receipt wrote; every other card,
including one a later run or a person changed, is left alone. Nothing in Supabase moves.
"""
import argparse
import contextlib
import glob
import io
import json
import os
import sys
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
COURSES = os.path.join(HERE, "coci_minted_courses.json")
OUT = os.path.join(HERE, "ccr_confidence_out")
STAMP = "_confidence_from"
FIELDS = ("discipline", "discipline_source", "discipline_confidence", STAMP)
RULES = ("base", "FPR", "G", "M")
REFUSED = ("W", "D")
MOVE_CONF = 0.8


def read(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def write(path, obj):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
        f.write("\n")


def now():
    return datetime.now(timezone.utc)


def source_for(rule, row):
    """The discipline_source a decision writes."""
    if row["discipline"] == row["guess"]:
        return "confidence_v1"
    return {"FPR": "past_rulings_v1", "M": "music_split_v1"}[rule]


def decisions(rule, fill_members=False):
    """The scorer's auto-accepted cards for one rule, recomputed now: [(cid, row)]."""
    import _ccr_confidence_score as M
    quiet = io.StringIO()
    with contextlib.redirect_stdout(quiet):
        inp = M.Inputs(fill_members=fill_members)
        rows = M.run(inp, M.DEFAULT_RULES)
    want = "" if rule == "base" else rule
    return sorted(((c, r) for c, r in rows
                   if r["band"] == "auto_accept" and r["rule"] == want
                   and (rule != "base" or r["base"] == "auto_accept")), key=lambda x: x[0])


def stamp(row, rule, run, day):
    moved = row["discipline"] != row["guess"]
    out = {"discipline_source": source_for(rule, row),
           "discipline_confidence": MOVE_CONF if moved else round(int(row["score"]) / 100.0, 2),
           STAMP: {"rule": rule, "run": run, "date": day, "score": int(row["score"]),
                   "agreeing_signals": int(row["agree"]), "reasons": row.get("reasons") or "",
                   "note": row.get("note") or ""}}
    if moved:
        out["discipline"] = row["discipline"]
        out[STAMP]["from"] = row["guess"]
    return out


def apply(rule, rows, expect, run, courses_path=COURSES, out_dir=OUT, fill_members=False):
    """Stamp `rows` (the scorer's decisions for `rule`) on the cards; write the receipt. Returns 0, or 2 on a refusal."""
    if expect is None or len(rows) != expect:
        print("refusing: %d %s cards decided now, --expect %s" % (len(rows), rule, expect))
        return 2
    doc = read(courses_path)
    courses = doc["courses"]
    t = now()
    day = t.date().isoformat()
    before = {}
    for cid, row in rows:
        rec = courses.get(cid)
        if not rec or rec.get("discipline") != row["guess"] or rec.get("discipline_source"):
            print("refusing: %s changed under the run" % cid)
            return 2
        before[cid] = {k: rec[k] for k in FIELDS if k in rec}
    wrote = {}
    for cid, row in rows:
        new = stamp(row, rule, run, day)
        courses[cid].update(new)
        wrote[cid] = new
    write(courses_path, doc)
    os.makedirs(os.path.join(out_dir, day), exist_ok=True)
    path = os.path.join(out_dir, day, "receipt.json")
    receipt = read(path) if os.path.exists(path) else {
        "_about": "kb/_ccr_confidence_apply.py receipt: each apply's cards, their before-values and what it wrote. "
                  "Undo one rule: python3 kb/_ccr_confidence_apply.py --undo --rule <rule>.",
        "applies": []}
    receipt["applies"].append({"rule": rule, "run": run, "date": day, "at": t.strftime("%Y-%m-%dT%H:%M:%SZ"),
                               "fill_members": fill_members, "count": len(rows), "before": before, "wrote": wrote})
    write(path, receipt)
    print("stamped %d rule %s cards; receipt %s" % (len(rows), rule, os.path.relpath(path, os.path.dirname(HERE))))
    return 0


def undo(rule, receipts, courses_path=COURSES):
    """Restore the cards one rule's applies stamped, from their receipts. Returns (restored, skipped)."""
    doc = read(courses_path)
    courses = doc["courses"]
    restored = skipped = 0
    for path in receipts:
        rec = read(path)
        for entry in rec.get("applies", []):
            if entry.get("rule") != rule:
                continue
            for cid, prev in entry["before"].items():
                c = courses.get(cid)
                wrote = (entry.get("wrote") or {}).get(cid) or {}
                # Only a card whose stamp is still this apply's: never a card a later run or a person changed.
                if not c or (c.get(STAMP) or {}).get("rule") != rule or any(c.get(k) != v for k, v in wrote.items()):
                    skipped += 1
                    continue
                for k in FIELDS:  # in place, so the file reads back byte for byte
                    if k in prev:
                        c[k] = prev[k]
                    else:
                        c.pop(k, None)
                restored += 1
    write(courses_path, doc)
    print("rule %s: restored %d cards, left %d alone" % (rule, restored, skipped))
    return restored, skipped


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--rule", required=True, help="base, FPR, G or M (W and D are held and refused)")
    ap.add_argument("--fill-members", action="store_true", help="score with the membership fix, as the scorer does")
    ap.add_argument("--expect", type=int, help="--apply refuses unless the decided count equals this")
    ap.add_argument("--apply", action="store_true", help="write the stamps and the receipt (a dry run without it)")
    ap.add_argument("--run", default="", help="the session that applies, stamped on each card (e.g. S684)")
    ap.add_argument("--undo", action="store_true", help="restore this rule's cards from the receipts")
    ap.add_argument("--receipt", action="append", help="a receipt to undo from (default: every receipt under %s)"
                                                       % os.path.relpath(OUT, os.path.dirname(HERE)))
    a = ap.parse_args()
    if a.rule in REFUSED:
        ap.error("rule %s is held on main and is never applied" % a.rule)
    if a.rule not in RULES:
        ap.error("--rule must be one of %s" % ", ".join(RULES))
    if a.undo:
        receipts = a.receipt or sorted(glob.glob(os.path.join(OUT, "*", "receipt.json")))
        undo(a.rule, receipts)
        return 0
    rows = decisions(a.rule, a.fill_members)
    if a.apply:
        if not a.run:
            ap.error("--apply needs --run")
        return apply(a.rule, rows, a.expect, a.run, fill_members=a.fill_members)
    moves = sum(1 for _c, r in rows if r["discipline"] != r["guess"])
    print("dry run: rule %s decides %d cards (%d keep the guess, %d move)%s" % (
        a.rule, len(rows), len(rows) - moves, moves, " with the membership fix" if a.fill_members else ""))
    for cid, r in rows[:10]:
        print("  %s  %s  %s -> %s" % (cid, (r["title"] or "")[:60], r["guess"], r["discipline"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
