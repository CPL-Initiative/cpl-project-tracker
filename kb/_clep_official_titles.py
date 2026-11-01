#!/usr/bin/env python3
"""_clep_official_titles.py — College Board's CLEP exams, and the reader that folds a college's CLEP
title under one of them. The AP rule's pattern (kb/_ap_official_titles.py), applied to CLEP after IB
(kb/_ib_official_titles.py).

Sam ruled on Open Asks Sheet 150 card 2, 2026-11-01 ("fold"): one credential per CLEP exam, its
levels folded in as score bands, named as College Board names it with Arabic numerals and no period
subtitle: CLEP Spanish Language, CLEP Spanish with Writing, CLEP History of the United States 1. The
AP rule it extends (Sam, 2026-10-31): "We can just rely on the official titles from AP, listing all
the variations they offer and folding the locals under as best as is possible--it will be close
enough and infinitely better than it is now--even if its a little wrong".

So the reader:
  - takes a title that opens with CLEP or College-Level Examination Program (an exam word after it is
    decoration), and reads the exam that follows;
  - ignores what colleges append: score bands (ACE Recommended Score of 50, Required Score of 63),
    HISTORICAL Type notes, the unit notes (CSU Semester Units, SAC Associate Degree Units, max of 10
    units awarded), term notes (prior to F06, after FA15), "Complete both", footnote marks and a
    local course code;
  - folds a world language exam's levels into the exam, since College Board gives one exam and two
    score bands (French Language (Levels 1 and 2)): CLEP French Language Level II, Level III and
    Levels 1 and 2 are all CLEP French Language;
  - names the History of the United States and Western Civilization exams by their number in Arabic
    numerals, the period subtitle dropped (History of the United States I: Early Colonization to
    1877 is CLEP History of the United States 1), and reads the subtitle alone where the number is
    missing;
  - takes College Board's current name for a renamed exam (Information Systems and Computer
    Applications is CLEP Information Systems; Pre-Calculus is CLEP Precalculus) and keeps a retired
    exam's own name, since the credit was for that exam (College Algebra-Trigonometry, Trigonometry,
    English Composition);
  - holds a title that names two exams at once (History of the United States I and II,
    Macroeconomics and Microeconomics).

resolve(raw) returns {"title": official} or {"two": reason} or None (not a CLEP title this reads).
Run it alone for the fold's dry run over the reference and the queue:
  python3 kb/_clep_official_titles.py
"""
import json
import os
import re
import sys
from collections import Counter

ISSUER = "College Board"

# College Board's 34 current CLEP exams, then the retired ones a college may still award for. The
# names carry Arabic numerals and no period subtitle (Sheet 150 card 2); a world language exam's
# levels are score bands of the one exam.
CURRENT = [
    "CLEP American Literature", "CLEP Analyzing and Interpreting Literature", "CLEP College Composition",
    "CLEP College Composition Modular", "CLEP English Literature", "CLEP Humanities",
    "CLEP French Language", "CLEP German Language", "CLEP Spanish Language", "CLEP Spanish with Writing",
    "CLEP American Government", "CLEP History of the United States 1", "CLEP History of the United States 2",
    "CLEP Human Growth and Development", "CLEP Introduction to Educational Psychology",
    "CLEP Introductory Psychology", "CLEP Introductory Sociology", "CLEP Principles of Macroeconomics",
    "CLEP Principles of Microeconomics", "CLEP Social Sciences and History", "CLEP Western Civilization 1",
    "CLEP Western Civilization 2",
    "CLEP Biology", "CLEP Calculus", "CLEP Chemistry", "CLEP College Algebra", "CLEP College Mathematics",
    "CLEP Natural Sciences", "CLEP Precalculus",
    "CLEP Financial Accounting", "CLEP Information Systems", "CLEP Introductory Business Law",
    "CLEP Principles of Management", "CLEP Principles of Marketing",
]
RETIRED = ["CLEP College Algebra-Trigonometry", "CLEP Trigonometry", "CLEP English Composition"]
OFFICIAL = set(CURRENT + RETIRED)

_PREFIX = re.compile(
    r"^\s*(?:CLEP\b|college[\s-]+level\s+examination\s+program\b(?:\s*\(CLEP\))?)"
    r"(?:\s*(?:exam(?:ination)?s?|tests?|subject\s+exam(?:ination)?s?|score)\b)?\s*[:\-–—]?\s*", re.I)

# Decoration colleges add, removed from the exam text before it is read.
_DECOR = [
    r"\((?:[^()]*\b(?:score|scores|units?|csu|uc\b|area|ge\b|prior|before|after|until|only|taken|f\s?'?\s?\d\d|fa\d\d)\b[^()]*)\)",
    r"\b(?:ace\s+)?(?:recommended\s+|required\s+|minimum\s+(?:passing\s+)?)?scores?\s+(?:of\s+)?\d[^,;:()]*",
    r"\bhistorical\s+type\s+\d\b",
    r"\bprior\s+to\b.*$",
    r"-\s*complete\s+both\b.*$",
    r"\[\d+\]",
    r"\*+",
    r"\s-\s*[A-Z]{2,6}\s*\d{1,3}[A-Z]?\s*$",       # a local course code ("- MATH 52")
]
_DECOR = [re.compile(p, re.I) for p in _DECOR]
_LANG_WORDS = r"french|german|spanish"
_NUM = r"(?:1|2|3|i{1,3}|l{2,3}|one|two|three)"

# (official title or None for two exams, pattern on the cleaned exam text, a word for the two-exam
# hold). Order matters: the narrower reading comes first.
_US = r"(?:(?:history\W+(?:of\W+)?(?:the\W+)?)?(?:u\W?s\W?|united\W+states|american)\W*(?:history\W*)?)"
_WC = r"(?:western\W+civ\w*)"
_PRINC = r"(?:princ\w*\.?\W+(?:of\W+)?)?"
RULES = [
    (None, r"^%s\W*(?:1|i)\W*(?:and|&|/|or|,|-)\W*(?:2|ii)\b" % _US,
     "History of the United States 1 and History of the United States 2"),
    (None, r"^%s\W*(?:1|i)\W*(?:and|&|/|or|,|-)\W*(?:2|ii)\b" % _WC, "Western Civilization 1 and Western Civilization 2"),
    ("CLEP History of the United States 1", r"^%s\W*(?:1|i)\b|^%s.*\b(?:colonization|1877)\b" % (_US, _US), None),
    ("CLEP History of the United States 2", r"^%s\W*(?:2|ii)\b|^%s.*\b(?:1865|present)\b" % (_US, _US), None),
    # a bare "History I" is the United States exam, as the reference reads it
    ("CLEP History of the United States 1", r"^history\W*(?:1|i)$", None),
    ("CLEP History of the United States 2", r"^history\W*(?:2|ii)$", None),
    ("CLEP Western Civilization 1", r"^%s\W*(?:1|i)\b|^%s.*\bancient\b" % (_WC, _WC), None),
    ("CLEP Western Civilization 2", r"^%s\W*(?:2|ii)\b|^%s.*\bpresent\b" % (_WC, _WC), None),
    ("CLEP Spanish with Writing", r"^spanish\b\W*(?:language\W+)?(?:with|and|&)\W+writing\b", None),
    ("CLEP French Language", r"^(?:college\W+)?french\b", None),
    ("CLEP German Language", r"^(?:college\W+)?german\b", None),
    ("CLEP Spanish Language", r"^(?:college\W+)?spanish\b", None),
    ("CLEP College Algebra-Trigonometry", r"^college\W+algebra\b.*\btrig", None),
    ("CLEP College Algebra", r"^college\W+algebra\b", None),
    ("CLEP Trigonometry", r"^trig", None),
    ("CLEP Precalculus", r"^pre\W*calc", None),
    ("CLEP Calculus", r"^calc", None),
    ("CLEP College Mathematics", r"^college\W+math", None),
    ("CLEP College Composition Modular", r"^college\W+comp\w*\W+modular\b", None),
    ("CLEP College Composition", r"^college\W+comp", None),
    ("CLEP English Composition", r"^english\W+comp", None),
    ("CLEP American Literature", r"^american\W+lit", None),
    ("CLEP English Literature", r"^(?:college\W+)?english\W+lit", None),
    ("CLEP Analyzing and Interpreting Literature", r"^analy\w*\W+(?:and\W+)?interp", None),
    ("CLEP Humanities", r"^humanities\b", None),
    ("CLEP American Government", r"^(?:american\W+|u\W?s\W?\W+)?gov", None),
    ("CLEP Human Growth and Development", r"^human\W+growth", None),
    ("CLEP Introduction to Educational Psychology", r"^(?:intro\w*\W+(?:to\W+)?)?educational\W+psyc", None),
    ("CLEP Introductory Psychology", r"^(?:intro\w*\W+(?:to\W+)?)?psyc", None),
    ("CLEP Introductory Sociology", r"^(?:intro\w*\W+(?:to\W+)?)?socio", None),
    (None, r"^%s(?:macro\w*\W+(?:and|&|/)\W+micro|micro\w*\W+(?:and|&|/)\W+macro)" % _PRINC,
     "Principles of Macroeconomics and Principles of Microeconomics"),
    ("CLEP Principles of Macroeconomics", r"^%s(?:intro\w*\W+)?macro\W*econ" % _PRINC, None),
    ("CLEP Principles of Microeconomics", r"^%s(?:intro\w*\W+)?micro\W*econ" % _PRINC, None),
    ("CLEP Social Sciences and History", r"^social\W+sci", None),
    ("CLEP Natural Sciences", r"^natural\W+sci", None),
    ("CLEP Biology", r"^(?:general\W+)?bio", None),
    ("CLEP Chemistry", r"^(?:general\W+)?chem", None),
    ("CLEP Financial Accounting", r"^(?:financial|%sintro\w*|%s)\W*acc" % (_PRINC, _PRINC), None),
    ("CLEP Information Systems", r"^info\w*\W+sys", None),
    ("CLEP Introductory Business Law", r"^(?:intro\w*\W+(?:to\W+)?)?business\W+law\b", None),
    ("CLEP Principles of Management", r"^%smanagement\b" % _PRINC, None),
    ("CLEP Principles of Marketing", r"^%smarketing\b" % _PRINC, None),
]
RULES = [(s, re.compile(p, re.I), w) for s, p, w in RULES]


def _clean(raw):
    """The exam text lowercased; None without a CLEP prefix."""
    t = str(raw or "").replace("\xa0", " ").replace("\t", " ")
    t = t.translate(dict.fromkeys(map(ord, "‐‑‒–—―−"), "-")).translate(dict.fromkeys(map(ord, "’‘`"), "'"))
    m = _PREFIX.match(t)
    if not m:
        return None
    s = t[m.end():]
    s = re.sub(r"^(?:exam(?:ination)?|test)\W+", "", s.strip(), flags=re.I)
    for pat in _DECOR:
        s = pat.sub(" ", s)
    s = re.sub(r"\b(%s)\d\b" % _LANG_WORDS, r"\1", s, flags=re.I)   # "German1": a footnote digit
    s = s.replace("&", " and ")
    s = re.sub(r"\(\s*\)", " ", s)
    s = re.sub(r"\s+", " ", s).strip(" -,;:()").lower()
    return s


def resolve(raw):
    s = _clean(raw)
    if not s:
        return None
    for title, pat, two in RULES:
        if pat.search(s):
            return {"two": two} if title is None else {"title": title}
    return None


def is_official(title):
    return title in OFFICIAL


def _load(rel):
    with open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), rel), encoding="utf-8") as f:
        return json.load(f)


def dry_run():
    """The fold over the reference's local titles and the CER queue: what moves where."""
    ut = _load("kb/unified_titles.json")
    ut = ut.get("titles") or ut
    moves, stays, two, unread = Counter(), 0, Counter(), []
    stamped_moves, moved_raws = 0, {}
    for raw, e in ut.items():
        if not isinstance(e, dict) or _clean(raw) is None:
            continue
        r = resolve(raw)
        cur = e.get("unified_title")
        if not r:
            unread.append((raw, cur))
        elif "two" in r:
            two[(cur, r["two"])] += 1
        elif r["title"] == cur:
            stays += 1
        else:
            moves[(cur, r["title"])] += 1
            moved_raws[raw] = (cur, r["title"], e.get("reviewed_by"))
            stamped_moves += 1 if e.get("reviewed_at") else 0
    q = [c["raw_title"] for c in _load("kb/exhibit_audit/latest.json")["title_cards"]
         if "unclassified_in_map" in (c.get("tags") or []) and _clean(c["raw_title"]) is not None]
    return {"reference_stays": stays, "reference_moves": moves, "reference_moves_stamped": stamped_moves,
            "reference_moved_raws": moved_raws, "reference_two": two, "reference_unread": unread,
            "queue": [(raw, resolve(raw)) for raw in q]}


def main():
    d = dry_run()
    n_move = sum(d["reference_moves"].values())
    print("Reference: %d CLEP local titles already sit under their exam; %d would move (%d carry a review stamp);"
          " %d name two exams and stay; %d are not read as CLEP." % (
              d["reference_stays"], n_move, d["reference_moves_stamped"], sum(d["reference_two"].values()),
              len(d["reference_unread"])))
    for (cur, new), n in sorted(d["reference_moves"].items(), key=lambda kv: (-kv[1], kv[0])):
        print("  %3d  %s  ->  %s" % (n, cur, new))
    for (cur, why), n in sorted(d["reference_two"].items(), key=lambda kv: -kv[1]):
        print("  %3d  held under %s: names %s" % (n, cur, why))
    for raw, cur in d["reference_unread"]:
        print("  not read: %s  (under %s)" % (raw, cur))
    if "-v" in sys.argv:
        for raw, (cur, new, who) in sorted(d["reference_moved_raws"].items()):
            print("  moved: %-70s %s -> %s [%s]" % (raw, cur, new, who or "-"))
    print("Queue: %d CLEP titles waiting." % len(d["queue"]))
    for raw, r in d["queue"]:
        print("  %s  ->  %s" % (raw, (r or {}).get("title") or ("held: names " + r["two"] if r else "not read as CLEP")))
    return 0


if __name__ == "__main__":
    sys.exit(main())
