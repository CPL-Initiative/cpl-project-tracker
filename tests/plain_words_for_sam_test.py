#!/usr/bin/env python3
"""Plain words in what Sam reads (Sam, 2026-11-16, relayed by COBIx on #3395, item 1).

Sam pasted a Commons card he could not interpret: "Should a program checked against its college's own course list
count in the headline? 1,604 active programs have no closed course list in the state's Program Course File..." and
asked what "closed course list" and "the headline" mean. Insider terms make his answers come out unsure. So a term
on the list below may not appear in anything he is asked to read unless the same sentence defines it: a parenthetical
right after the term, or the word "means".

What it reads:
  * every open call (no answer yet) in kb/status/*.json: its title, text and if_no_reply, the words the Commons
    shows him on "Your next batch" and in "decisions wait on you";
  * the visible strings of commons.js (`text: "..."`), the Commons' own copy.
An answered call is history and keeps its words. Decision-sheet HTML lives in the private vault
(CPLBrain/decision-sheets/) and is linted there by the same TERMS when its builder imports this file.

Pure stdlib. Run from repo root:
    python3 tests/plain_words_for_sam_test.py
"""
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# COBIx's list (#3395, 2026-11-16), each a term Sam has had to ask about or that only the sessions use.
TERMS = ["closed course list", "headline", "carry-basis", "re-clustering", "re-cluster", "lane", "payload",
         "receipt", "held", "person-settled"]


def sentences(text):
    return [s for s in re.split(r"(?<=[.?!])\s+", text or "") if s.strip()]


def defined(sentence, term):
    """The sentence defines the term: '(' right after it, or 'means' in the sentence."""
    m = re.search(r"\b%s\b" % re.escape(term), sentence, re.I)
    after = sentence[m.end():m.end() + 3] if m else ""
    return after.lstrip().startswith("(") or re.search(r"\bmeans\b", sentence, re.I) is not None


def offenses(text):
    out = []
    for s in sentences(text):
        for t in TERMS:
            if re.search(r"\b%s\b" % re.escape(t), s, re.I) and not defined(s, t):
                out.append((t, s.strip()[:140]))
    return out


def open_call_texts(root):
    for path in sorted(glob.glob(os.path.join(root, "kb", "status", "*.json"))):
        try:
            d = json.load(open(path, encoding="utf-8"))
        except (OSError, ValueError):
            continue
        if not isinstance(d, dict):
            continue
        for c in d.get("calls") or []:
            if (c.get("answer") or {}).get("words"):
                continue
            for k in ("title", "text", "if_no_reply"):
                if c.get(k):
                    yield "%s calls[%r].%s" % (os.path.relpath(path, root), (c.get("title") or "")[:40], k), c[k]


def commons_texts(root):
    src = open(os.path.join(root, "commons.js"), encoding="utf-8").read()
    for m in re.finditer(r'\btext:\s*"((?:[^"\\]|\\.)*)"', src):
        yield "commons.js:%d" % (src[:m.start()].count("\n") + 1), m.group(1)


results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


# The rule itself, on fixtures.
check("Sam's own example fails", offenses("1,604 active programs have no closed course list in the state's file.")
      and offenses("Should it count in the headline?"))
check("a parenthetical right after the term defines it",
      not offenses("1,604 programs have no closed course list (the courses the state's file names for a program)."))
check("'means' in the sentence defines it", not offenses("The headline means the share of programs complete."))
check("a word that only contains a term is not the term", not offenses("The planet's elane and thelda withheld nothing."))

found = []
for where, text in list(open_call_texts(ROOT)) + list(commons_texts(ROOT)):
    for t, s in offenses(text):
        found.append("%s: %r in %r" % (where, t, s))
check("no open call and no Commons string uses an insider term undefined", not found, found[:12])

failed = [r for r in results if not r[1]]
for name, ok, why in results:
    print(("PASS " if ok else "FAIL ") + name + ("" if ok else "\n    " + "\n    ".join(map(str, why)) if isinstance(why, list) else "  " + str(why)))
print("%d/%d checks passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
