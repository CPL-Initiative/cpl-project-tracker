#!/usr/bin/env python3
"""Worklist signature SEGMENT-fold measurement (Session 58, Sam 2026-06-16).

Task 2: "When I type 'algebra' into the [override] search it shows a good number
of likely merges — adjust the rules so those appear in the initial Suggested
Merges … for all courses with an obvious keyword that signals strong alignment."

The worklist groups identities by `_sug_sig` (excel_to_dashboard.py): a level-
COLLAPSING title signature (drops articles, level words, roman/word/digit
ordinals, bare a–h section letters; sorts the rest). It UNDER-grouped because
STRUCTURAL DIVIDER words survived — "Algebra 1-2, Semester 1" → sig "algebra
semester", "Elementary Algebra, Part 1" → "algebra part", but "Algebra 3-4" →
"algebra". Same family, three signatures. Folding the divider words (part /
semester / module / half / level) collapses the whole keyword family to one
signature so the worklist surfaces it as ONE curator-confirmable group.

This is the measure-first receipt for that change: it replicates the generator's
`_sug_sig` (CURRENT) and the proposed segment-folding variant over the minted
parents + Stand-Alone singletons (the worklist's member pool), and prints the
regrouping impact + the biggest proposed groups (the over-merge guard). It is a
MEASUREMENT ONLY — the worklist is suggestions-only / curator-confirmed, so the
change never auto-applies a merge.

Run from repo root: python3 kb/_sug_segment_dryrun.py
"""
import json
import os
import re
from collections import Counter, defaultdict

SD = os.path.dirname(os.path.abspath(__file__))

# ── mirrors excel_to_dashboard.py `_sug_sig` vocabulary ─────────────────────
DROP = {"the", "of", "to", "and", "for", "with", "in", "a", "an", "on", "at", "as"}
ROMAN = {"i": "1", "ii": "2", "iii": "3", "iv": "4", "v": "5", "vi": "6", "vii": "7",
         "viii": "8", "ix": "9", "x": "10", "one": "1", "two": "2", "three": "3",
         "four": "4", "five": "5", "six": "6", "seven": "7", "eight": "8",
         "nine": "9", "ten": "10"}
LEVEL = {"beginning", "beginner", "elementary", "introductory", "introduction",
         "intro", "first", "basic", "preparatory", "prep", "developmental",
         "intermediate", "second", "advanced", "third", "fourth"}
# TIGHT high-confidence segment-divider set (almost never a content noun).
# EXCLUDED as too risky: section (Conic Sections), unit/units (Intensive Care
# Unit), course(s), series/sequence/term/quarter/block/phase.
SEGMENT = {"part", "semester", "module", "half", "level", "levels"}


def sig(t, fold_segment):
    t = re.sub(r"\([^)]*\)", " ", str(t or "").lower())
    t = re.sub(r"[^a-z0-9 ]+", " ", t)
    toks = []
    for w in t.split():
        if w in DROP or w in LEVEL or w in ROMAN:
            continue
        if fold_segment and w in SEGMENT:
            continue
        if w.isdigit():
            continue
        if len(w) == 1 and "a" <= w <= "h":
            continue
        toks.append(w)
    return " ".join(sorted(set(toks)))


def main():
    mem = {}  # id -> title
    for cid, rec in json.load(open(os.path.join(SD, "coci_minted_courses.json")))["courses"].items():
        mem[cid] = rec.get("common_title")
    for cid, rec in json.load(open(os.path.join(SD, "coci_minted_singletons.json")))["courses"].items():
        mem[cid] = rec.get("common_title")

    def groups(fold):
        g = defaultdict(list)
        for cid, t in mem.items():
            s = sig(t, fold)
            if s:
                g[s].append(cid)
        return {k: v for k, v in g.items() if len(v) >= 2}

    cur, prop = groups(False), groups(True)

    def line(g, label):
        sizes = Counter("2" if len(v) == 2 else "3-5" if len(v) <= 5 else "6-10"
                        if len(v) <= 10 else "11-25" if len(v) <= 25 else "26+"
                        for v in g.values())
        covered = sum(len(v) for v in g.values())
        mx = max((len(v) for v in g.values()), default=0)
        print(f"  {label}: {len(g):>5} groups | {covered:>6} covered | max {mx:>3} | "
              + "  ".join(f"{k}:{sizes[k]}" for k in ("2", "3-5", "6-10", "11-25", "26+")))

    print(f"Worklist signature SEGMENT-fold dry-run — segment set {sorted(SEGMENT)}")
    line(cur, "CURRENT ")
    line(prop, "PROPOSED")
    print(f"  net identities pulled into multi-member groups: "
          f"+{sum(len(v) for v in prop.values()) - sum(len(v) for v in cur.values())}")
    print("\n  Biggest PROPOSED groups (over-merge guard — should be coherent families):")
    for s, ids in sorted(prop.items(), key=lambda kv: -len(kv[1]))[:10]:
        seen = list(dict.fromkeys(mem[i] for i in ids))
        print(f"    [{len(ids):>3}] {s!r}: " + " | ".join(repr(x) for x in seen[:4])
              + (" …" if len(seen) > 4 else ""))
    print("\n  MEASUREMENT ONLY — the worklist is suggestions-only / curator-confirmed.")


if __name__ == "__main__":
    main()
