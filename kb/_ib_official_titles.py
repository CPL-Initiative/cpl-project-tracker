#!/usr/bin/env python3
"""_ib_official_titles.py — the International Baccalaureate's Diploma Programme subjects, and the
reader that folds a college's IB title under one of them. The AP rule's pattern
(kb/_ap_official_titles.py), applied to IB.

Sam, 2026-10-31, for AP: "We can just rely on the official titles from AP, listing all the
variations they offer and folding the locals under as best as is possible--it will be close enough
and infinitely better than it is now--even if its a little wrong". The handoffs since carried "IB
on the AP pattern" as the next step of the same rule.

So the reader:
  - takes a title that opens with IB, I.B. or International Baccalaureate (an exam word after it is
    decoration), and reads the subject that follows;
  - ignores what colleges append: score bands, Area and Cal-GETC notes, HISTORICAL Type notes, the
    unit notes (CSU Semester Transfer Units, Associate Degree Units), "prior to Fall '13", "any
    region" and the region names a History title carries;
  - names the subject as the reference and the Cal-GETC IB list write it, IB's own subject with its
    level: IB Biology HL, IB Language A: Literature HL, IB Mathematics: Analysis and Approaches HL;
  - reads the level as written (HL, SL, Higher Level, Standard Level) and, where the level is
    missing, takes HL, the exam colleges award IB credit for; a subject IB offers at SL alone
    (World Religions, Literature and Performance, Language ab initio, Mathematical Studies) takes
    SL;
  - keeps a retired subject's own name, since the credit was for that exam: Language A1 and A2
    (until 2013), Mathematics HL and SL and Further Mathematics HL (until 2021), Information
    Technology in a Global Society, Latin and Classical Greek;
  - folds the language a student wrote the exam in into the subject (IB Exam Spanish B HL is IB
    Language B HL), keeping the one split the Cal-GETC list and the reference make: a Language A
    exam in a language other than English carries "(Non-English)";
  - reads a Language A title by its words before its letters: "Lang&Lit (A2)" is Language A:
    Language and Literature (Sam's own review), "Lit (A1)" is Language A: Literature, and a bare
    "Language A" is Language A1 (his review of "IB Language A - any language except English HL");
  - holds a title that names two exams at once (Language A1 or A2, both Mathematics courses).

resolve(raw) returns {"title": official} or {"two": reason} or None (not an IB title this reads).
Run it alone for the fold's dry run over the reference and the queue:
  python3 kb/_ib_official_titles.py
"""
import json
import os
import re
import sys
from collections import Counter

ISSUER = "International Baccalaureate Organization (IBO)"
NON_ENGLISH = " (Non-English)"

# (subject, levels IB offers). Current Diploma Programme subjects, then the retired ones a college may
# still award for. The reference's spelling and case; "Theatre" is IB's own name for the subject.
CURRENT = [
    ("Language A: Literature", "HS"), ("Language A: Language and Literature", "HS"),
    ("Literature and Performance", "S"),
    ("Language B", "HS"), ("Language ab initio", "S"), ("Classical Languages", "HS"),
    ("Business Management", "HS"), ("Digital Society", "HS"), ("Economics", "HS"), ("Geography", "HS"),
    ("Global Politics", "HS"), ("History", "HS"), ("Philosophy", "HS"), ("Psychology", "HS"),
    ("Social and Cultural Anthropology", "HS"), ("World Religions", "S"),
    ("Biology", "HS"), ("Chemistry", "HS"), ("Computer Science", "HS"), ("Design Technology", "HS"),
    ("Physics", "HS"), ("Sports, Exercise and Health Science", "HS"),
    ("Environmental Systems and Societies", "HS"),
    ("Mathematics: Analysis and Approaches", "HS"), ("Mathematics: Applications and Interpretation", "HS"),
    ("Dance", "HS"), ("Film", "HS"), ("Music", "HS"), ("Theatre", "HS"), ("Visual Arts", "HS"),
]
RETIRED = [
    ("Language A1", "HS"), ("Language A2", "HS"),
    ("Mathematics", "HS"), ("Further Mathematics", "H"), ("Mathematical Studies", "S"),
    ("Information Technology in a Global Society", "HS"), ("Latin", "HS"), ("Classical Greek", "HS"),
]
LEVELS = dict(CURRENT + RETIRED)
NON_ENGLISH_SUBJECTS = {"Language A: Literature", "Language A: Language and Literature", "Language A1",
                        "Language A2"}


def _names():
    out = set()
    for subj, levels in LEVELS.items():
        for lv in levels:
            name = "IB %s %sL" % (subj, lv)
            out.add(name)
            if subj in NON_ENGLISH_SUBJECTS:
                out.add(name + NON_ENGLISH)
    return out


OFFICIAL = _names()

_PREFIX = re.compile(
    r"^\s*(?:I\.\s?B\.?|IB\b|international\s+baccalaureate\b(?:\s*\(IB\))?)"
    r"(?:\s*(?:exam(?:ination)?s?|tests?|course|program(?:me)?|score)\b)?\s*[:\-–—]?\s*", re.I)

LANGUAGES = (r"english|spanish|french|german|italian|portuguese|chinese|mandarin|cantonese|japanese|korean"
             r"|arabic|hebrew|hindi|urdu|russian|greek|latin|vietnamese|tagalog|filipino|dutch|swedish"
             r"|norwegian|danish|polish|turkish|persian|farsi|armenian|punjabi|bengali|tamil|thai|indonesian"
             r"|malay|swahili")
_LANG = re.compile(r"\b(%s)\b" % LANGUAGES, re.I)

# Decoration colleges add, removed from the subject before it is read.
_DECOR = [
    r"\((?:[^()]*\b(?:score|scores|area|cal-?getc|igetc|csu|uc\b|units?|ge\b|prior|before|after|passing)\b[^()]*)\)",
    r"\bscores?\s+of\s+\d[^,;:()]*",
    r"\bscores?\s+\d\s*(?:-|to|or)\s*\d",
    r"\bscore\s+\d\b",
    r"\bminimum\s+passing\s+score\s+of\s+\d",
    r"\b(?:cal-?getc|igetc|local\s+ge|ge)\s+area\b.*$",
    r"\barea\s+[a-z]?-?\d?[a-z]?\b.*$",
    r"\bhistorical\s+type\s+\d\b",
    r"\bprior\s+to\b.*$",
    r"\(?\bmay\s+not\s+be\s+at\s+all\s+uc\)?",
    r"\b(?:any|all)\s+regions?\b",
]
_DECOR = [re.compile(p, re.I) for p in _DECOR]
_ROUTE = re.compile(r"\bhistory\s+of\s+(?:the\s+)?(?:americas|europe(?:\s+and\s+the\s+middle\s+east)?"
                    r"|asia(?:\s+and\s+oceania)?|africa(?:\s+and\s+the\s+middle\s+east)?)\b", re.I)
_LEVEL = re.compile(r"\(?\b(HL|SL|higher\s+level|standard\s+level)\b\)?", re.I)
_EXCEPT_ENGLISH = re.compile(
    r"\b(?:except|other\s+than|not)\s+english\b|\bany\s+other\s+language\b|\bnon-?\s?english\b", re.I)

# (subject or None for two exams, pattern on the cleaned subject text, a word for the two-exam hold).
# Order matters: the narrower reading comes first.
RULES = [
    (None, r"\ba\s*1\W*(?:or|and|/|&)\W*a\s*2\b", "Language A1 and Language A2"),
    (None, r"^math\w*\W.*analysis.*\b(?:or|and|/)\b.*applications?|^math\w*\W.*applications?.*\b(?:or|and|/)\b.*analysis",
     "Mathematics: Analysis and Approaches and Mathematics: Applications and Interpretation"),
    ("Language A: Language and Literature", r"\blang\w*\W*(?:and|&)\W*lit", None),
    ("Literature and Performance", r"\blit\w*\W+(?:and|&)\W+perform", None),
    ("Language A: Literature", r"(?:\blanguage\W+a\W+|\b(?:%s)\W+)lit" % LANGUAGES, None),
    ("Language A: Literature", r"^lit\w*\b", None),
    ("Language A1", r"\ba\s*1\b", None),
    ("Language A2", r"\ba\s*2\b", None),
    ("Language ab initio", r"\bab\W*initio\b", None),
    ("Language B", r"\blanguage\W+b\b|\b(?:%s)\W+b\b" % LANGUAGES, None),
    ("Language A1", r"\blanguage\W+a\b", None),
    ("Classical Languages", r"^classical\W+lang", None),
    ("Classical Greek", r"^classical\W+greek\b", None),
    ("Latin", r"^latin\b", None),
    ("Mathematics: Analysis and Approaches", r"^math\w*\b.*\banalysis\b", None),
    ("Mathematics: Applications and Interpretation", r"^math\w*\b.*\bapplications?\b", None),
    ("Further Mathematics", r"^further\W+math", None),
    ("Mathematical Studies", r"^math\w*\W+studies\b", None),
    ("Mathematics", r"^math\w*\b", None),
    ("Business Management", r"^business\b", None),
    ("Digital Society", r"^digital\W+soc", None),
    ("Information Technology in a Global Society", r"^(?:itgs\b|information\W+tech\w*\W+(?:in\W+)?(?:a\W+)?global)", None),
    ("Economics", r"^econ", None),
    ("Geography", r"^geog", None),
    ("Global Politics", r"^global\W+pol", None),
    ("History", r"^hist", None),
    ("Philosophy", r"^philos", None),
    ("Psychology", r"^psyc", None),
    ("Social and Cultural Anthropology", r"^(?:social\W+(?:and\W+)?cultural\W+)?anthro", None),
    ("World Religions", r"^world\W+relig", None),
    ("Environmental Systems and Societies", r"^environ", None),
    ("Biology", r"^bio", None),
    ("Chemistry", r"^chem", None),
    ("Computer Science", r"^comp\w*\W+sci", None),
    ("Design Technology", r"^design\W+tech", None),
    ("Physics", r"^physics\b", None),
    ("Sports, Exercise and Health Science", r"^sports?\W+(?:exercise|and)", None),
    ("Dance", r"^dance\b", None),
    ("Film", r"^film\b", None),
    ("Music", r"^music\b", None),
    ("Theatre", r"^theat(?:re|er)\b", None),
    ("Visual Arts", r"^(?:visual\W+)?arts?\b", None),
]
RULES = [(s, re.compile(p, re.I), w) for s, p, w in RULES]


def _clean(raw):
    """(subject text lowercased, level 'H'/'S'/None, non-English flag); None without an IB prefix."""
    t = str(raw or "").replace("\xa0", " ")
    t = t.translate(dict.fromkeys(map(ord, "‐‑‒–—―−"), "-")).translate(dict.fromkeys(map(ord, "’‘`"), "'"))
    m = _PREFIX.match(t)
    if not m:
        return None
    s = t[m.end():]
    s = re.sub(r"^(?:exam(?:ination)?|test|course)\W+", "", s.strip(), flags=re.I)
    non_english = bool(_EXCEPT_ENGLISH.search(s))
    s = _EXCEPT_ENGLISH.sub(" ", s)
    s = re.sub(r"\b(?:any|all)\s+languages?(?:\s*,?\s*except)?\b", " ", s, flags=re.I)
    levels = {lv.group(1).upper()[0] for lv in _LEVEL.finditer(s)}
    s = _LEVEL.sub(" ", s)
    s = _ROUTE.sub("history", s)      # a History route is the History exam
    for pat in _DECOR:
        s = pat.sub(" ", s)
    s = s.replace("&", " and ")
    s = re.sub(r"[\"“”]", "", s)
    s = re.sub(r"\(\s*\)", " ", s)
    s = re.sub(r"\s+", " ", s).strip(" -,;:()").lower()
    level = levels.pop() if len(levels) == 1 else ("two" if levels else None)
    return s, level, non_english


def resolve(raw):
    c = _clean(raw)
    if not c or not c[0]:
        return None
    s, level, non_english = c
    for subj, pat, two in RULES:
        if not pat.search(s):
            continue
        if subj is None:
            return {"two": two}
        if level == "two":
            return {"two": "%s HL and %s SL" % (subj, subj)}
        offered = LEVELS[subj]
        lv = level if level and level in offered else ("H" if "H" in offered else "S")
        name = "IB %s %sL" % (subj, lv)
        if subj in NON_ENGLISH_SUBJECTS:
            m = _LANG.search(s)
            if non_english or (m and m.group(1).lower() != "english"):
                name += NON_ENGLISH
        return {"title": name}
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
            unread.append(raw)
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
    print("Reference: %d IB local titles already sit under their subject; %d would move (%d carry a review stamp);"
          " %d name two exams and stay; %d are not read as IB." % (
              d["reference_stays"], n_move, d["reference_moves_stamped"], sum(d["reference_two"].values()),
              len(d["reference_unread"])))
    for (cur, new), n in sorted(d["reference_moves"].items(), key=lambda kv: (-kv[1], kv[0])):
        print("  %3d  %s  ->  %s" % (n, cur, new))
    for (cur, why), n in sorted(d["reference_two"].items(), key=lambda kv: -kv[1]):
        print("  %3d  held under %s: names %s" % (n, cur, why))
    for raw in d["reference_unread"]:
        print("  not read: %s" % raw)
    if "-v" in sys.argv:
        for raw, (cur, new, who) in sorted(d["reference_moved_raws"].items()):
            print("  moved: %-70s %s -> %s [%s]" % (raw, cur, new, who or "-"))
    print("Queue: %d IB titles waiting." % len(d["queue"]))
    for raw, r in d["queue"]:
        print("  %s  ->  %s" % (raw, (r or {}).get("title") or ("held: names " + r["two"] if r else "not read as IB")))
    return 0


if __name__ == "__main__":
    sys.exit(main())
