#!/usr/bin/env python3
"""Apply the leftover-title decisions to kb/unified_titles.json: one raw key's link, nothing else (S678, COBIx's item 2).

Sam, 2026-11-17: "These are local exhibit titles, right? I don't change those, just canonicalized titles they sit
under." A decision is a kb_curation row `_LEFT_MAP::<raw local title>` + left_map_decision, written from the Exhibits
List's leftover-title rows (exhibits.js leftSave):

- keep: nothing changes in the file; the title stays a search name of its canonical title, and the List no longer
  shows it as waiting.
- moved:<canonical title>: that one raw key's unified_title becomes the named canonical title. No articulation is
  reminted, no credential is renamed or retired, and kb/unclassified_fold/retires.json is never written: this is
  deliberately not the fold's path (kb/_fold_unclassified.py) nor the reviewed rename apply (kb/_cred_rename_apply.py).
- removed: the raw key and its history stay (so a college entering the title again links it back rather than landing
  on the review queue); the row gains `left_map: {decision: "removed", from: <canonical>}` and the reference bake
  (excel_to_dashboard.py) leaves it out of that canonical's local titles.

Every applied row gains `left_map: {decision, from, at}`, so `git revert` of the commit undoes it, and the receipt
this script writes beside it lists every before-value.

    python3 kb/_apply_left_map.py --rows ROWS.json            # dry run: what would change
    python3 kb/_apply_left_map.py --rows ROWS.json --apply    # write unified_titles.json and the receipt

ROWS.json is a list of {course_id, value, reviewed_at} read from kb_curation (field left_map_decision).
"""
import argparse
import datetime
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UT = "kb/unified_titles.json"
PREFIX = "_LEFT_MAP::"


def plan(ut, rows, canonicals):
    """[(raw, decision, before, after)] for the rows that change the file; skips with their reason."""
    out, skips = [], []
    for row in rows:
        cid, val = str(row.get("course_id") or ""), str(row.get("value") or "").strip()
        if not cid.startswith(PREFIX):
            continue
        raw = cid[len(PREFIX):]
        ent = ut.get(raw)
        if ent is None:
            skips.append((raw, "no such local title in the reference"))
            continue
        cur = ent.get("unified_title")
        prev = (ent.get("left_map") or {})
        if val == "keep":
            continue
        if val.startswith("moved:"):
            to = val[len("moved:"):].strip()
            if not to or to not in canonicals:
                skips.append((raw, "the canonical title it names is not in the reference: " + to))
                continue
            if cur == to and prev.get("decision") == "moved":
                continue
            out.append((raw, "moved", cur, to, row.get("reviewed_at")))
        elif val == "removed":
            if prev.get("decision") == "removed":
                continue
            out.append((raw, "removed", cur, cur, row.get("reviewed_at")))
        else:
            skips.append((raw, "an unknown decision: " + val))
    return out, skips


def apply(ut, changes):
    for raw, dec, before, after, at in changes:
        ent = ut[raw]
        ent["unified_title"] = after
        ent["left_map"] = {"decision": dec, "from": before, "at": at}
    return ut


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--rows", required=True)
    ap.add_argument("--apply", action="store_true")
    a = ap.parse_args(argv)
    with open(os.path.join(ROOT, UT), encoding="utf-8") as f:
        ut = json.load(f)
    with open(a.rows, encoding="utf-8") as f:
        rows = json.load(f)
    canonicals = {e.get("unified_title") for e in ut.values() if e.get("unified_title")}
    changes, skips = plan(ut, rows, canonicals)
    for raw, why in skips:
        print("skip: %r: %s" % (raw, why))
    for raw, dec, before, after, _ in changes:
        print("%s: %r: %s -> %s" % (dec, raw, before, after))
    if not a.apply:
        print("dry run: %d changes, %d skips" % (len(changes), len(skips)))
        return 0
    apply(ut, changes)
    with open(os.path.join(ROOT, UT), "w", encoding="utf-8") as f:
        f.write(json.dumps(ut, indent=2, ensure_ascii=False) + "\n")
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H%MZ")
    rec = os.path.join(ROOT, "kb", "receipts", "left_map_apply_" + stamp + ".json")
    os.makedirs(os.path.dirname(rec), exist_ok=True)
    with open(rec, "w", encoding="utf-8") as f:
        json.dump({"what": "kb/_apply_left_map.py", "at": stamp, "changes": [
            {"raw": r, "decision": d, "before": b, "after": t} for r, d, b, t, _ in changes]}, f, indent=1, ensure_ascii=False)
    print("applied %d; receipt %s" % (len(changes), os.path.relpath(rec, ROOT)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
