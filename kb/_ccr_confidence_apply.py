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

A move needs its code (second reader on #3513). An M-ID carries its field's SUBJ4, and kb/_row_audit.py flags a card
whose SUBJ4 is not its field's most common one. Rule M's 47 MUSI moves would outnumber Commercial Music's 38 MUSC
cards, flip that field's most common code to MUSI and flag the 38 correct cards. So --apply refuses any move whose
card's SUBJ4 is not the new field's code (kb/discipline_canonical_subj4.json, else the field's most common code in
the data), and the dry run's --worklist writes those cards for a re-mint under docs/coursecontrolnumber_remint.md.
Keeps (G, the base scorer, M's keeps) change no field and always pass.

Each receipt entry records the alias era it was written in (kb/alias_chain.py's ALIAS_MAPS at the time). --undo
resolves every receipt id through the maps applied since, so a card re-minted between the apply and the undo is
still found; a card that cannot be found is reported apart from one a person changed, and --undo exits 1.
"""
import argparse
import contextlib
from collections import Counter, defaultdict
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
CANON = os.path.join(HERE, "discipline_canonical_subj4.json")
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
    """Write through a temporary file and os.replace, so a failed write leaves the old file whole."""
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
        f.write("\n")
    os.replace(tmp, path)


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


def field_codes(courses, canon_path=CANON):
    """{discipline: SUBJ4}: the curator-locked code in kb/discipline_canonical_subj4.json, else the field's most
    common code among its M-IDs in the data (ties by code)."""
    locked = {}
    if canon_path and os.path.exists(canon_path):
        locked = {d: v["canonical_subj4"] for d, v in (read(canon_path).get("disciplines") or {}).items()
                  if isinstance(v, dict) and v.get("canonical_subj4")}
    seen = defaultdict(Counter)
    for cid, rec in courses.items():
        if isinstance(rec, dict) and rec.get("discipline") and rec.get("id_system") in (None, "M-ID"):
            seen[rec["discipline"]][code_of(cid, rec)] += 1
    out = {d: sorted(c.items(), key=lambda kv: (-kv[1], kv[0]))[0][0] for d, c in seen.items()}
    out.update(locked)
    return out


def code_of(cid, rec):
    return (rec or {}).get("subject_4letter") or cid.split(" ")[0]


def needs_remint(rows, courses, codes):
    """The moves whose card's SUBJ4 is not the new field's code: each needs a re-mint before its move can land."""
    out = []
    for cid, row in rows:
        if row["discipline"] == row["guess"]:
            continue
        have, want = code_of(cid, courses.get(cid)), codes.get(row["discipline"])
        if have != want:
            out.append({"course_id": cid, "subject_4letter": have, "from": row["guess"], "to": row["discipline"],
                        "field_code": want})
    return out


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


def apply(rule, rows, expect, run, courses_path=COURSES, out_dir=OUT, fill_members=False, canon_path=CANON):
    """Stamp `rows` (the scorer's decisions for `rule`) on the cards; write the receipt. Returns 0, or 2 on a refusal."""
    import alias_chain as AC
    if expect is None or len(rows) != expect:
        print("refusing: %d %s cards decided now, --expect %s" % (len(rows), rule, expect))
        return 2
    doc = read(courses_path)
    courses = doc["courses"]
    off = needs_remint(rows, courses, field_codes(courses, canon_path))
    if off:
        print("refusing: %d moves would land on a field whose code their card does not carry (first: %s %s, %s "
              "is %s); write them with --worklist and re-mint them first" % (
                  len(off), off[0]["course_id"], off[0]["subject_4letter"], off[0]["to"], off[0]["field_code"]))
        return 2
    t = now()
    day = t.date().isoformat()
    before = {}
    for cid, row in rows:
        rec = courses.get(cid)
        if not rec or rec.get("discipline") != row["guess"] or rec.get("discipline_source"):
            print("refusing: %s changed under the run" % cid)
            return 2
        before[cid] = {k: rec[k] for k in FIELDS if k in rec}
    wrote = {cid: stamp(row, rule, run, day) for cid, row in rows}
    os.makedirs(os.path.join(out_dir, day), exist_ok=True)
    path = os.path.join(out_dir, day, "receipt.json")
    receipt = read(path) if os.path.exists(path) else {
        "_about": "kb/_ccr_confidence_apply.py receipt: each apply's cards, their before-values and what it wrote. "
                  "Undo one rule: python3 kb/_ccr_confidence_apply.py --undo --rule <rule>.",
        "applies": []}
    receipt["applies"].append({"rule": rule, "run": run, "date": day, "at": t.strftime("%Y-%m-%dT%H:%M:%SZ"),
                               "fill_members": fill_members, "count": len(rows), "alias_era": list(AC.ALIAS_MAPS),
                               "before": before, "wrote": wrote})
    # The receipt lands first: if the course write then fails, undo finds no stamp on those cards and leaves them be.
    write(path, receipt)
    for cid, new in wrote.items():
        courses[cid].update(new)
    write(courses_path, doc)
    print("stamped %d rule %s cards; receipt %s" % (len(rows), rule, os.path.relpath(path, os.path.dirname(HERE))))
    return 0


def undo(rule, receipts, courses_path=COURSES, chain=None):
    """Restore the cards one rule's applies stamped, from their receipts. Each receipt id resolves through the alias
    maps applied since its apply (kb/alias_chain.py; `chain` defaults to ALIAS_MAPS). Returns (restored, changed,
    missing): changed cards a later run or a person touched are left alone; missing ids are not found at all."""
    import alias_chain as AC
    chain = list(AC.ALIAS_MAPS if chain is None else chain)
    doc = read(courses_path)
    courses = doc["courses"]
    restored = changed = 0
    missing = []
    for path in receipts:
        rec = read(path)
        for entry in rec.get("applies", []):
            if entry.get("rule") != rule:
                continue
            if not entry.get("alias_era"):
                raise SystemExit("ABORT: a rule %s entry in %s carries no alias_era, so its ids cannot be resolved"
                                 % (rule, path))
            pending, _era = AC.pending_maps(entry["alias_era"], chain=chain)
            maps = AC.load_maps(pending)
            for cid, prev in entry["before"].items():
                now_id = AC.resolve_id(cid, maps)
                c = courses.get(now_id)
                if not isinstance(c, dict):
                    missing.append(cid if now_id == cid else "%s (now %s)" % (cid, now_id))
                    continue
                wrote = (entry.get("wrote") or {}).get(cid) or {}
                # Only a card whose stamp is still this apply's: never a card a later run or a person changed.
                if (c.get(STAMP) or {}).get("rule") != rule or any(c.get(k) != v for k, v in wrote.items()):
                    changed += 1
                    continue
                for k in FIELDS:  # in place, so the file reads back byte for byte
                    if k in prev:
                        c[k] = prev[k]
                    else:
                        c.pop(k, None)
                restored += 1
    write(courses_path, doc)
    print("%srule %s: restored %d cards, left %d alone (changed since), %d not found%s" % (
        "PARTIAL undo, " if missing else "", rule, restored, changed, len(missing),
        (": " + ", ".join(missing[:5])) if missing else ""))
    return restored, changed, len(missing)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--rule", required=True, help="base, FPR, G or M (W and D are held and refused)")
    ap.add_argument("--fill-members", action="store_true", help="score with the membership fix, as the scorer does")
    ap.add_argument("--expect", type=int, help="--apply refuses unless the decided count equals this")
    ap.add_argument("--apply", action="store_true", help="write the stamps and the receipt (a dry run without it)")
    ap.add_argument("--run", default="", help="the session that applies, stamped on each card (e.g. S684)")
    ap.add_argument("--undo", action="store_true", help="restore this rule's cards from the receipts")
    ap.add_argument("--worklist", help="dry run: write the moves that need a re-mint first to this JSON file")
    ap.add_argument("--receipt", action="append", help="a receipt to undo from (default: every receipt under %s)"
                                                       % os.path.relpath(OUT, os.path.dirname(HERE)))
    a = ap.parse_args()
    if a.rule in REFUSED:
        ap.error("rule %s is held on main and is never applied" % a.rule)
    if a.rule not in RULES:
        ap.error("--rule must be one of %s" % ", ".join(RULES))
    if a.undo:
        receipts = a.receipt or sorted(glob.glob(os.path.join(OUT, "*", "receipt.json")))
        _restored, _changed, missing = undo(a.rule, receipts)
        return 1 if missing else 0
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
    courses = read(COURSES)["courses"]
    off = needs_remint(rows, courses, field_codes(courses))
    print("%d moves need a re-mint before --apply will take them%s" % (
        len(off), "" if not off else " (%s)" % ", ".join("%s to %s %d" % (k[0], k[1], v) for k, v in
                                                          Counter((o["subject_4letter"], o["field_code"]) for o in off).most_common())))
    if a.worklist:
        write(a.worklist, {"_about": "Moves rule %s decides whose card's SUBJ4 is not the new field's code. Re-mint "
                                     "them under docs/coursecontrolnumber_remint.md before kb/_ccr_confidence_apply.py "
                                     "--apply --rule %s takes them." % (a.rule, a.rule),
                           "rule": a.rule, "fill_members": a.fill_members, "count": len(off), "moves": off})
        print("wrote %s" % a.worklist)
    return 0


if __name__ == "__main__":
    sys.exit(main())
