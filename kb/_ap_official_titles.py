#!/usr/bin/env python3
"""_ap_official_titles.py — College Board's official AP exam names, and the reader that folds a
college's AP title under one of them.

Sam, 2026-10-31, adding a CER procedure from the Exhibits tab: "screen all exhibit titles that are
for AP prep or AP course or have an AP course or exam in the title and set the canonical title to
the official College Board AP title. Fold all aligned AP MAP exhibits, whether for AP Course credit
or AP Exam credit under the aligned canonical titles." Then: "the colleges vary in adding A, AB, B,
A/B, A+B, often no AB" and "We can just rely on the official titles from AP, listing all the
variations they offer and folding the locals under as best as is possible--it will be close enough
and infinitely better than it is now--even if its a little wrong".

So the reader:
  - takes a title that opens with AP, A.P., Advanced Placement or College Board AP (an exam word,
    "course" or "prep" after it is decoration), and reads the subject that follows;
  - ignores what colleges append: score bands, HISTORICAL Type notes, Area numbers, local course
    codes, high school codes, "exam" and "test";
  - names the official exam, current or retired (Computer Science AB, Physics B, French
    Literature, Latin Literature keep their own names, since the credit was for that exam);
  - reads the letters as written and joined (A/B, A+B, A B and AB are one), and where the letters
    are missing takes the exam the subject most often means: Calculus is Calculus AB, Computer
    Science is Computer Science A, Government and Politics is the United States exam;
  - reads an AB subscore as Calculus AB, the credit it carries (colleges pair the two: "Calculus AB
    or AB Subscore"), so the BC exam's AB subscore folds under Calculus AB;
  - holds a title that names two exams at once (English Literature and Language, Physics 1 and 2,
    Calculus AB/BC without the subscore, Economics, Physics C or Studio Art with no part named),
    since one title cannot fold under two.

resolve(raw) returns {"title": official} or {"two": reason} or None (not an AP title this reads).
Run it alone for the fold's dry run over the reference and the queue:
  python3 kb/_ap_official_titles.py
"""
import json
import os
import re
import sys
from collections import Counter

ISSUER = "College Board"

# Current exams (College Board's course list) and retired ones a college may still award for.
CURRENT = [
    "AP 2-D Art and Design", "AP 3-D Art and Design", "AP Drawing", "AP Art History", "AP Music Theory",
    "AP English Language and Composition", "AP English Literature and Composition",
    "AP African American Studies", "AP Comparative Government and Politics", "AP European History",
    "AP Human Geography", "AP Macroeconomics", "AP Microeconomics", "AP Psychology",
    "AP United States Government and Politics", "AP United States History", "AP World History: Modern",
    "AP Calculus AB", "AP Calculus BC", "AP Computer Science A", "AP Computer Science Principles",
    "AP Precalculus", "AP Statistics",
    "AP Biology", "AP Chemistry", "AP Environmental Science", "AP Physics 1: Algebra-Based",
    "AP Physics 2: Algebra-Based", "AP Physics C: Electricity and Magnetism", "AP Physics C: Mechanics",
    "AP Chinese Language and Culture", "AP French Language and Culture", "AP German Language and Culture",
    "AP Italian Language and Culture", "AP Japanese Language and Culture", "AP Latin",
    "AP Spanish Language and Culture", "AP Spanish Literature and Culture",
    "AP Research", "AP Seminar",
]
RETIRED = ["AP Computer Science AB", "AP Physics B", "AP French Literature", "AP Latin Literature"]
OFFICIAL = set(CURRENT + RETIRED)

_PREFIX = re.compile(
    r"^\s*(?:college\s+board\s+)?(?:AP\b|A\.\s?P\.|advanced\s+placement\b)"
    r"(?:\s*(?:exam(?:ination)?s?|tests?|course|prep(?:aration)?|program|score)\b)?\s*[:\-–—]?\s*", re.I)
_CS = r"(?:computer\s+science|comp\.?\s*sci\.?\w*|cs)"
_JOIN = r"\s*(?:/|\+|&|and|or|-)?\s*"

# (official title or None for two exams, pattern on the subject text, a word for the two-exam hold).
# Order matters: the narrower reading comes first.
RULES = [
    ("AP Calculus AB", r"^calc\w*\.?\W*.*a\s*b\W*sub\W*score", None),
    (None, r"^english\W+(?:lit\w*\W+(?:and|/)\W+lang\w*|lang\w*\W+(?:and|/)\W+lit\w*)", "English Literature and English Language"),
    ("AP English Literature and Composition", r"^english\W*lit", None),
    ("AP English Language and Composition", r"^english\W*lang", None),
    ("AP Precalculus", r"^(?:calculus\W+)?pre\W*calc", None),
    (None, r"^calc\w*\.?\W*(?:a\s*b%sb\s*c|b\s*c%sa\s*b)\b" % (_JOIN, _JOIN), "Calculus AB and Calculus BC"),
    ("AP Calculus BC", r"^calc\w*\.?\W*b\s*c\b", None),
    ("AP Calculus AB", r"^calc\w*\b", None),
    ("AP Computer Science Principles", r"^%s\W*princ" % _CS, None),
    ("AP Computer Science AB", r"^%s\W*a%sb\b" % (_CS, _JOIN), None),
    ("AP Computer Science A", r"^%s\b" % _CS, None),
    ("AP Statistics", r"^stat", None),
    (None, r"^physics\W*(?:1|i)\W*(?:and|&|/|\+|,|-)\W*(?:2|ii)\b", "Physics 1 and Physics 2"),
    ("AP Physics C: Mechanics", r"^physics\W*(?:c\b\W*)?mech", None),
    ("AP Physics C: Electricity and Magnetism", r"^physics\W*(?:c\b\W*)?(?:e\s*(?:and|&|/)?\s*m\b|elec)", None),
    (None, r"^physics\W*c\b", "Physics C: Mechanics and Physics C: Electricity and Magnetism"),
    ("AP Physics 1: Algebra-Based", r"^physics\W*(?:1|i)\b", None),
    ("AP Physics 2: Algebra-Based", r"^physics\W*(?:2|ii)\b", None),
    ("AP Physics B", r"^physics\W*b\b", None),
    (None, r"^physics\b", "the Physics exams"),
    ("AP Biology", r"^bio", None),
    ("AP Chemistry", r"^chem", None),
    ("AP Environmental Science", r"^environ", None),
    ("AP 2-D Art and Design", r"^(?:studio\s+art\W*)?2\s*-?\s*d\b", None),
    ("AP 3-D Art and Design", r"^(?:studio\s+art\W*)?3\s*-?\s*d\b", None),
    ("AP Drawing", r"^(?:studio\s+art\W*)?drawing\b", None),
    (None, r"^studio\s+art\b", "the three Art and Design portfolios"),
    ("AP Art History", r"^(?:art\s+history|history\s+of\s+art)\b", None),
    ("AP Music Theory", r"^music\b", None),
    ("AP African American Studies", r"^african[\s-]+american", None),
    ("AP Comparative Government and Politics", r"^(?:comp\w*\W+gov|gov\w*\W+(?:and\W+pol\w*\W+)?comp)", None),
    ("AP United States Government and Politics",
     r"^(?:(?:u\.?\s?s\.?|united\s+states|american)\W+gov|gov\w*\b)", None),
    ("AP European History", r"^(?:euro\w*\W+hist|hist\w*\W+euro)", None),
    ("AP World History: Modern", r"^(?:hist\w*\W+)?(?:world\W*(?:hist|modern)|modern\W+world|world\b)", None),
    ("AP United States History", r"^(?:(?:u\.?\s?s\.?|united\s+states|american)\W+hist|hist\w*\W+(?:of\W+)?(?:the\W+)?(?:u\.?\s?s\.?|united\s+states|american))", None),
    ("AP Human Geography", r"^(?:human\W+)?geog", None),
    ("AP Macroeconomics", r"^(?:macro\W*econ|econ\w*\W+macro)", None),
    ("AP Microeconomics", r"^(?:micro\W*econ|econ\w*\W+micro)", None),
    (None, r"^econ", "Macroeconomics and Microeconomics"),
    ("AP Psychology", r"^psyc", None),
    ("AP Chinese Language and Culture", r"^chinese", None),
    ("AP French Literature", r"^french\W+lit", None),
    ("AP French Language and Culture", r"^french", None),
    ("AP German Language and Culture", r"^german", None),
    ("AP Italian Language and Culture", r"^italian", None),
    ("AP Japanese Language and Culture", r"^japanese", None),
    ("AP Latin Literature", r"^latin\W+lit(?!.*\bor\b)", None),
    ("AP Latin", r"^latin", None),
    ("AP Spanish Literature and Culture", r"^span\w*\W+lit", None),
    ("AP Spanish Language and Culture", r"^span(?:ish)?\b", None),
    ("AP Research", r"^research\b", None),
    ("AP Seminar", r"^seminar\b", None),
]
RULES = [(t, re.compile(p, re.I), w) for t, p, w in RULES]


def subject(raw):
    """The text after the AP prefix, lowercased, with & as and and quotes gone; None when the
    title does not open with an AP prefix."""
    t = str(raw or "").replace("\xa0", " ")
    t = t.translate(dict.fromkeys(map(ord, "‐‑‒–—―−"), "-"))
    m = _PREFIX.match(t)
    if not m:
        return None
    s = t[m.end():]
    m2 = _PREFIX.match(s)                      # "AP AP Computer Science Principles"
    if m2 and m2.end():
        s = s[m2.end():]
    s = re.sub(r"[\"“”'‘’]", "", s).replace("&", " and ")
    s = re.sub(r"^(?:exam|test|course)\W+", "", s.strip(), flags=re.I)
    s = re.sub(r"\((?:score|scores)\b[^)]*\)", " ", s, flags=re.I)        # "AP SPAN (score of 3) Language"
    s = re.sub(r"^math\w*\W+(?=(?:pre\W*)?calc|stat)", "", s, flags=re.I)  # "AP Mathematics - Calculus AB"
    # "AP Art: Studio 2D Design", "AP Art Studio 3-D", "AP Art-Studio Drawing"
    s = re.sub(r"^art\W*(?:studio\W*)?(?=(?:studio\W*)?(?:2\s*-?\s*d|3\s*-?\s*d|drawing))", "", s, flags=re.I)
    s = re.sub(r"^studio\W*(?=2\s*-?\s*d|3\s*-?\s*d|drawing)", "studio art ", s, flags=re.I)
    return re.sub(r"\s+", " ", s).strip().lower()


def resolve(raw):
    s = subject(raw)
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
    stamped_moves = 0
    for raw, e in ut.items():
        if not isinstance(e, dict) or subject(raw) is None:
            continue
        r = resolve(raw)
        cur = e.get("unified_title")
        if not r:
            unread.append(raw)
        elif "two" in r:
            two[(cur, r["two"])] += 1
        elif r["title"] == cur:
            stays += 1
        else:
            moves[(cur, r["title"])] += 1
            stamped_moves += 1 if e.get("reviewed_at") else 0
    q = [c["raw_title"] for c in _load("kb/exhibit_audit/latest.json")["title_cards"]
         if "unclassified_in_map" in (c.get("tags") or []) and subject(c["raw_title"]) is not None]
    return {"reference_stays": stays, "reference_moves": moves, "reference_moves_stamped": stamped_moves,
            "reference_two": two, "reference_unread": unread,
            "queue": [(raw, resolve(raw)) for raw in q]}


def main():
    d = dry_run()
    n_move = sum(d["reference_moves"].values())
    print("Reference: %d AP local titles already sit under their official exam; %d would move (%d carry a review stamp);"
          " %d name two exams and stay; %d are not read as AP." % (
              d["reference_stays"], n_move, d["reference_moves_stamped"], sum(d["reference_two"].values()),
              len(d["reference_unread"])))
    for (cur, new), n in sorted(d["reference_moves"].items(), key=lambda kv: (-kv[1], kv[0])):
        print("  %3d  %s  ->  %s" % (n, cur, new))
    for (cur, why), n in sorted(d["reference_two"].items(), key=lambda kv: -kv[1]):
        print("  %3d  held under %s: names %s" % (n, cur, why))
    for raw in d["reference_unread"]:
        print("  not read: %s" % raw)
    print("Queue: %d AP titles waiting." % len(d["queue"]))
    for raw, r in d["queue"]:
        print("  %s  ->  %s" % (raw, (r or {}).get("title") or ("held: names " + r["two"] if r else "not read as AP")))
    return 0


if __name__ == "__main__":
    sys.exit(main())
