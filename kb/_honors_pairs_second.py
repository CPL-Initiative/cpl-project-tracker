#!/usr/bin/env python3
"""The second derivation of the Honors pairs (S653): built from course numbers and titles directly, sharing no code
with the matcher in kb/_reclustering_s648_dryrun.py (measure_honors, find_base, code_key, honors_code_base). The rows
plan writes a row only where both find a pair (kb/_honors_of_s653_dryrun.py, "two signals or hold"; the conductor's
brief after #3315's review). A pair one alone finds is held and listed with the derivation that found it.

THE RULE, at one college. A course is Honors when its title carries the word (honors, honours, honor, HNRS). Its base
is a course whose title does not, found either way:
  * by number: the two codes match once every character but letters and digits is dropped, leading zeros in a
    number are dropped, and one H standing beside a number is taken out of the Honors code (225HF, 1H, 02AH, H206,
    CHEMH206);
  * by title: the Honors title with the word struck equals the base's title, letters and digits only, and no other
    course at the college carries that title.
The number rule asks nothing of the titles; the matcher's code match does. Where they part, a pair is held.

Run: python3 kb/_honors_pairs_second.py   (prints the pair count on the committed members file)
"""
import os
import re
import sys
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

HONORS = re.compile(r"(?<![a-z])(?:honou?rs?|hnrs)(?![a-z])", re.I)


def compact(code):
    """Letters and digits only, upper case, leading zeros of each number dropped: 'ECON 001H' -> 'ECON1H'."""
    s = re.sub(r"[^A-Z0-9]", "", (code or "").upper())
    return re.sub(r"(?<!\d)0+(?=\d)", "", s)


def without_one_h(code):
    """Every key the code names with one H beside a digit taken out."""
    k = compact(code)
    out = set()
    for i, ch in enumerate(k):
        after_number = i > 0 and (k[i - 1].isdigit() or (i > 1 and k[i - 1].isalpha() and k[i - 2].isdigit()))
        if ch == "H" and (after_number or (i + 1 < len(k) and k[i + 1].isdigit())):
            out.add(re.sub(r"(?<!\d)0+(?=\d)", "", k[:i] + k[i + 1:]))
    return out


def plain(title, strike=False):
    t = (title or "").lower()
    if strike:
        t = HONORS.sub(" ", t)
    return " ".join(re.findall(r"[a-z0-9]+", t))


def derive(members):
    """{(honors identity, base identity): set of 'number' / 'title'} over {identity: [{college, code, title}]}."""
    at = defaultdict(list)
    for ident, rows in members.items():
        for r in rows:
            at[r["college"]].append((ident, r.get("code") or "", r.get("title") or ""))
    out = defaultdict(set)
    for rows in at.values():
        by_code, by_title = defaultdict(set), defaultdict(set)
        for ident, code, title in rows:
            if not HONORS.search(title):
                by_code[compact(code)].add(ident)
                by_title[plain(title)].add((ident, code))
        for ident, code, title in rows:
            if not HONORS.search(title):
                continue
            for key in without_one_h(code):
                for b in by_code.get(key, ()):
                    if b != ident:
                        out[(ident, b)].add("number")
            want = plain(title, strike=True)
            hits = by_title.get(want) or set()
            if want and len(hits) == 1:
                b = next(iter(hits))[0]
                if b != ident:
                    out[(ident, b)].add("title")
    return dict(out)


def main():
    sys.path.insert(0, HERE)
    import _mid_outcomes_compare as cmp
    members, gen = cmp.load_members(ROOT)
    d = derive(members)
    print(f"{len(d)} pairs on unified_courses_members.js (generated {gen}); by number "
          f"{sum(1 for v in d.values() if 'number' in v)}, by title {sum(1 for v in d.values() if 'title' in v)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
