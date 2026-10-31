#!/usr/bin/env python3
"""_sweep_exhibit_titles.py — Another look: exhibit titles that look settled but still differ.

Sam, 2026-10-31, after his pass through the Exhibits tab's Review queue: "I noticed some things I want
you to build an audit process as part of the overall procedure to look for opportunities to take
another look at exhibits that look the same but still have differences and things we can fold and
correct". His five asks, each a rule here:

  ase        "Auto exhibits are most often aligned with ASE cert titles and I started adding those to
             later exhibit titles in parens after the title ... the local course corresponds to the ASE
             cert, so those should have the ASE parens." A local course named by an ASE test code
             (Las Positas's AUTO A1 to L3), or whose title is an ASE test's name, gets
             "(ASE <code> <official name>)"; a paren that names the wrong test or adds words to the
             official name is corrected.
  numerals   "Many exhibits use I, II, III and I skipped adjusting some of those to 1,2,3 for
             consistency." Roman level numerals become Arabic, except where an issuer's official name
             carries them (State Fire Training's Firefighter I, Fire Officer, Fire Inspector ...).
  language   "look for beginning labels that should be elementary (our canonical term for 1,2 or
             1A,1B and intermediate should be often 2,3 or 2A,2B". A world-language course title
             becomes Elementary <Language> 1 or 2, or Intermediate <Language> 1 or 2, the level word
             first, as C-ID's descriptors name them (Elementary Spanish I, Intermediate Spanish I).
  course-code "Looks for any exhibits where I didn't take off the local course number". A canonical
             title still carrying its course's code or a method word (Credit by Exam, Cx, Completion)
             loses it; a title that was nothing but a code takes the course's own title.
  fold       "Compare to all the exhibit titles in the whole data set and let's see if we can take
             another sweep through to adjust and fold". Three checks: twins (two canonical titles
             that differ only in case, punctuation, word order, numerals or a plural), one title
             over different courses at one college (it takes each course's own title, or the
             existing credential that already carries that course title), and a family whose level
             word sits in two places (it follows the placement a person chose most recently).

A local title's proposal runs through the rules in that order, so one card can carry several reasons.
Cards group the local titles that share a current and a proposed title: one decision moves them all.

What it reads, all committed files:
  kb/unified_titles.json              each local title's canonical title (the reference)
  kb/unclassified_assignments.json    titles saved since the last fold, and the proposals a person
                                      kept the current title against (title_sweep_kept), which never
                                      come back
  kb/credentials.json                 each credential's issuer, and whether a proposal exists yet
  kb/coci_articulations.json          each exhibit's local courses and credit lines
  statewide_data.js                   the credit lines and colleges of the titles the articulation file
                                      does not carry
  kb/exhibits_review.json             the titles waiting in Review, left to Review
  kb/unclassified_fold/<newest>/report.json   the held conflicts, left to Review

Writes kb/exhibits_sweep.json, which the Exhibits tab's Review draws as the Another look step. The
tab's Change to Proposed Title saves each local title's _UNCLASSIFIED::<local title> assignment and,
beside it, unified_title_supersedes (the title it replaces), so the nightly fold re-points a title a
person already approved only when that title still stands (kb/_fold_unclassified.py, the revise lane).
Keep Current Title saves title_sweep_kept, the proposal declined.

Runs nightly at the end of cer-procedures.yml and daily after the fold in daily-dashboard.yml.

Usage, from the repo root:
  python3 kb/_sweep_exhibit_titles.py [--root DIR] [--out PATH] [--quiet]
"""
import argparse
import collections
import datetime as dt
import glob
import hashlib
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

SCHEMA = 1
OUT = "kb/exhibits_sweep.json"

RULES = [
    {"id": "ase", "label": "ASE",
     "words": "Auto exhibits are most often aligned with ASE cert titles and I started adding those to "
              "later exhibit titles in parens after the title",
     "tip": "An automotive course that prepares for an ASE test gets the test in parentheses after the title: "
            "Automotive Technology (ASE A7 Heating and Air Conditioning)."},
    {"id": "numerals", "label": "Numerals",
     "words": "Many exhibits use I, II, III and I skipped adjusting some of those to 1,2,3 for consistency.",
     "tip": "Roman level numerals become 1, 2, 3. Official names that carry them, such as Firefighter I, keep them."},
    {"id": "language", "label": "Language level",
     "words": "look for beginning labels that should be elementary (our canonical term for 1,2 or 1A,1B and "
              "intermediate should be often 2,3 or 2A,2B",
     "tip": "A world-language course is Elementary or Intermediate, then the language, then 1 or 2: "
            "Elementary Spanish 1, Intermediate Spanish 2."},
    {"id": "course-code", "label": "Course number",
     "words": "Looks for any exhibits where I didn't take off the local course number",
     "tip": "The canonical title still carries a college's course number or a method word such as Credit by Exam."},
    {"id": "level", "label": "Level differs",
     "words": "exhibits that look the same but still have differences",
     "tip": "The local title names one level (1A, Year 5, Level 2) and its canonical title another. "
            "Often a title accepted with its neighbor's name."},
    {"id": "fold", "label": "Fold",
     "words": "Compare to all the exhibit titles in the whole data set and let's see if we can take another "
              "sweep through to adjust and fold",
     "tip": "Two canonical titles that differ only in spelling, one title over different courses at one college, "
            "or a family whose level word sits in two places."},
]
RULE_IDS = [r["id"] for r in RULES]
RULE_IDS_ORDER = RULE_IDS

# ── ASE (the National Institute for Automotive Service Excellence's test names) ──────────────────
ASE = {
    "A1": "Engine Repair", "A2": "Automatic Transmission/Transaxle", "A3": "Manual Drive Train and Axles",
    "A4": "Suspension and Steering", "A5": "Brakes", "A6": "Electrical/Electronic Systems",
    "A7": "Heating and Air Conditioning", "A8": "Engine Performance", "A9": "Light Vehicle Diesel Engines",
    "G1": "Auto Maintenance and Light Repair", "L1": "Advanced Engine Performance Specialist",
    "L2": "Electronic Diesel Engine Diagnosis Specialist", "L3": "Light Duty Hybrid/Electric Vehicle Specialist",
    "L4": "Advanced Driver Assistance Systems Specialist", "C1": "Automobile Service Consultant",
    "P1": "Medium/Heavy Truck Parts Specialist", "P2": "Automobile Parts Specialist", "X1": "Exhaust Systems",
    "F1": "Alternate Fuels", "T1": "Gasoline Engines", "T2": "Diesel Engines", "T3": "Drive Train",
    "T4": "Brakes", "T5": "Suspension and Steering", "T6": "Electrical/Electronic Systems",
    "T7": "Heating, Ventilation and Air Conditioning", "T8": "Preventive Maintenance Inspection",
    "B2": "Painting and Refinishing", "B3": "Non-Structural Analysis and Damage Repair",
    "B4": "Structural Analysis and Damage Repair", "B5": "Mechanical and Electrical Components",
    "B6": "Damage Analysis and Estimating",
}
# A course title matched to a test by its words alone reaches the light-vehicle tests only; a truck or
# collision test needs its code named.
ASE_BY_WORDS = ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "G1"]
AUTO_SUBJ = re.compile(r"^(?:AUTO\w*|AUT|AT|ATEC|AUTEC|AUTOTEC|AUTORTK|AUME|AUTOMO|AST|A S T|VAUTO|AUBDY|ACRP)$", re.I)
ASE_PAREN = re.compile(r"\s*\(ASE\s+([A-Z]\d|xEV)\b\s*([^)]*)\)\s*$")
ASE_BASE = "Automotive Technology"
# Words that say only that a title is automotive; a base made of nothing else adds nothing to the test's name.
AUTO_GENERIC = {"automotive", "auto", "automobile", "system", "systems", "technology", "service", "services",
                "and", "the", "of", "in", "for", "ase", "certification", "certificate", "exam", "credit", "by"}

# ── numerals ─────────────────────────────────────────────────────────────────────────────────────
ROMAN = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6}
ROMAN_TOKEN = re.compile(r"(?<=[A-Za-z)\]] )(I{1,3}|IV|VI?)(?=$|[\s/,:;)\-–—])")
# Official names that carry a Roman numeral as part of the credential's own name.
ROMAN_KEEP = re.compile(r"\b(?:Fire\s*fighter|Fire Officer|Fire Inspector|Fire Instructor|Fire Investigator|"
                        r"Fire Marshal|Fire Prevention Officer|Company Officer|Chief Officer|Instructor|"
                        r"Driver/Operator|Hazardous Materials|Plans Examiner|World War|Title|Phase|"
                        r"Medicare|Medicaid|Fire Apparatus|Wildland)\b", re.I)

# ── world languages ──────────────────────────────────────────────────────────────────────────────
LANGUAGES = ["American Sign Language", "Spanish", "French", "German", "Italian", "Japanese", "Chinese",
             "Mandarin", "Cantonese", "Korean", "Vietnamese", "Arabic", "Armenian", "Russian", "Portuguese",
             "Tagalog", "Filipino", "Farsi", "Persian", "Hebrew", "Latin", "Greek", "Hindi", "Punjabi",
             "Hmong", "Khmer", "Thai", "Turkish", "Swedish", "Polish", "Dutch"]
LANG_ALIAS = {"ASL": "American Sign Language", "SPAN": "Spanish", "SPA": "Spanish", "FREN": "French",
              "FRENCH": "French", "GERMAN": "German", "GERM": "German", "GER": "German", "ITAL": "Italian",
              "JAPAN": "Japanese", "JAPN": "Japanese", "JPN": "Japanese", "CHIN": "Chinese", "KOR": "Korean",
              "VIET": "Vietnamese", "ARAB": "Arabic", "ARMEN": "Armenian", "RUSS": "Russian",
              "PORT": "Portuguese", "HMONG": "Hmong", "TAGA": "Tagalog", "FIL": "Filipino"}
LANG_RE = re.compile(r"\b(" + "|".join(re.escape(x) for x in LANGUAGES + list(LANG_ALIAS)) + r")\b", re.I)
EXAM_BRAND = re.compile(r"^\s*(?:AP|IB|CLEP|DSST|AICE|DLPT)\b|Defense Language|Proficiency Test|\bScore\b", re.I)
# Words a plain language-level title may carry; any other content word (Wines, Heritage, Grammar) keeps it out.
LANG_LEVEL_WORDS = {"elementary", "beginning", "high", "intermediate", "level", "first", "second", "third",
                    "fourth", "semester", "quarter", "language", "credit", "by", "exam", "examination", "cx",
                    "cbe", "industry", "certification", "portfolio", "review", "for", "and", "of", "the",
                    "noncredit", "challenge", "completion", "administered", "nvc"}

# ── course codes and method words ────────────────────────────────────────────────────────────────
METHOD = re.compile(r"\s*[-–—:]?\s*\b(?:Credit\s*by\s*(?:Industry\s+)?(?:Exam(?:ination)?|Industry\s+Certification)"
                    r"|Industry\s+Certification|Portfolio\s+Review|Noncredit\s+for|Industry\s+for|"
                    r"Examination\s+for|CBE|Cx)\b\s*[-–—:]?\s*", re.I)
LEVEL_WORDS = ("Beginning", "Intermediate", "Advanced", "Elementary")
ISSUER_CCC = "California Community Colleges"   # kb/_preseed_unclassified.py: a college's own course


def iso_now():
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_json(path, default=None):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, ValueError):
        return default


def load_js(path):
    """A generated `window.X = {...};` file as its object, or {} when it is absent."""
    try:
        with open(path, encoding="utf-8") as f:
            src = f.read()
    except FileNotFoundError:
        return {}
    m = re.search(r"window\.\w+\s*=\s*\{", src)
    if not m:
        return {}
    return json.loads(src[m.end() - 1:src.rindex("}") + 1])


def clean(t):
    """Collapse spacing, drop the marks a strip leaves dangling."""
    t = (t or "").replace("\xa0", " ").replace("\t", " ")
    t = re.sub(r"\(\s*\)|\[\s*\]", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    t = re.sub(r"^[-–—:,;/&\s]+|[-–—:,;/&\s]+$", "", t)
    t = re.sub(r"\s+([,:;)])", r"\1", t)
    t = re.sub(r"\(\s+", "(", t)
    return t.strip()


def stem(w):
    """A plural and a few endings off, so Brakes meets Brake and Electricity meets Electrical."""
    w = w.lower()
    if len(w) > 3 and w.endswith("s") and not w.endswith("ss"):
        w = w[:-1]
    for suf in ("ing", "ity", "er", "al"):
        if len(w) > len(suf) + 4 and w.endswith(suf):
            return w[:-len(suf)]
    return w


def content(t, drop=()):
    return {stem(w) for w in re.findall(r"[A-Za-z]+", t or "") if w.lower() not in drop and len(w) > 1}


def norm_code(subj, num):
    return re.sub(r"[^A-Z]", "", (subj or "").upper()), (num or "").upper().lstrip("0") or "0"


CODE_IN = re.compile(r"\b([A-Z][A-Za-z&]{0,9}(?:[ .][A-Z]{1,3})?)[\s.\-]*0*(\d{1,4}[A-Z]{0,2})\b")


# ── evidence: each local title's courses and credit lines ────────────────────────────────────────

def evidence(ut_keys, arts, statewide):
    """raw (stripped) -> {"courses": [(subj, num, title)], "credit": [text], "colleges": [name]}.

    The articulation file pairs each exhibit with its local courses. The statewide file pools a
    credential's credit lines: a line speaks for a local title when the credential has no other, or
    when that local title alone names the line's course code."""
    ev = {}

    def slot(raw):
        return ev.setdefault(raw.strip(), {"courses": [], "credit": [], "colleges": []})

    for a in (arts or {}).get("articulations", []) or []:
        raw = (a.get("exhibit_title") or "").strip()
        if not raw:
            continue
        s = slot(raw)
        for lc in a.get("local_courses") or []:
            c = ((lc.get("subject") or "").strip(), (lc.get("number") or "").strip(), (lc.get("title") or "").strip())
            if c[0] and c not in s["courses"]:
                s["courses"].append(c)
        for line in a.get("credit_recommendations") or []:
            if line and line not in s["credit"]:
                s["credit"].append(line)
        for c in a.get("earned_by_colleges") or []:
            if c and c not in s["colleges"]:
                s["colleges"].append(c)
    for x in (statewide or {}).get("exhibits", []) or []:
        raws = sorted({r.strip() for r in x.get("raw_titles") or [] if r and r.strip()})
        if not raws:
            continue
        recs = x.get("credit_recs") or []
        if len(raws) == 1:
            one = slot(raws[0])
            for c in x.get("adopter_names") or []:
                if c and c not in one["colleges"]:
                    one["colleges"].append(c)
        by_rec = collections.defaultdict(list)
        for college, idx in (x.get("adopter_rec_idx") or {}).items():
            for i in idx or []:
                by_rec[i].append(college)
        for i, rec in enumerate(recs):
            code = (rec.get("course") or "").strip()
            line = (rec.get("credit") or "").strip()
            if len(raws) == 1:
                owners = raws
            else:
                # A credential's pooled lines: a line belongs to the local title that names its course code
                # ("Noncredit for AUTO INT" and AUTO INT, never AUTO INTL).
                pat = re.compile(r"(?<![A-Za-z0-9])" + r"\s*".join(map(re.escape, code.split())) + r"(?![A-Za-z0-9])", re.I) if code else None
                owners = [r for r in raws if pat and pat.search(r)]
                if len(owners) != 1:
                    continue
            s = slot(owners[0])
            for c in by_rec.get(i) or []:
                if c and c not in s["colleges"]:
                    s["colleges"].append(c)
            m = re.match(r"^(.*?)[\s\-]*0*(\d{1,4}[A-Za-z]{0,2}|[A-Z]{1,4}\d?)$", code)
            title = re.sub(r"^[\d.\-–or ]+(?:hours?|units?|semester units?)\s+in\s+", "", line, flags=re.I)
            if code and m:
                parts = code.rsplit(" ", 1)
                subj, num = (parts[0], parts[1]) if len(parts) == 2 else (code, "")
                # "AUTO A1" -> (AUTO, A1); the line names the course: "4 units in AUTO A1 Engine Repair"
                title = re.sub(r"^" + re.escape(code) + r"\s*", "", title).strip()
                c = (subj.strip(), num.strip(), title)
                if not any(norm_code(k[0], k[1]) == norm_code(c[0], c[1]) for k in s["courses"]):
                    s["courses"].append(c)
            if line and line not in s["credit"]:
                s["credit"].append(line)
    return ev


def course_codes(ev_one):
    """The codes of the college courses an exhibit's credit lines name. A code in the raw title alone is
    not enough: OSHA 10, ICS 400, C-36 and Fire Inspector 1C are credentials' own names."""
    out = set()
    for subj, num, _ in (ev_one or {}).get("courses", []):
        if subj and num:
            out.add(norm_code(subj, num))
    return out


def title_case(t):
    """An all-capitals course title (PLANT PROPAGATION) in title case."""
    letters = [c for c in t if c.isalpha()]
    if letters and sum(c.isupper() for c in letters) / len(letters) > 0.85:
        small = {"and", "of", "the", "for", "in", "to", "a", "an", "or", "with", "on", "at"}
        return " ".join(w if (i and w in small) else (w if re.fullmatch(r"[IVX]+|[A-Z]{2,4}\d*", w) and len(w) <= 3
                        else w[:1].upper() + w[1:].lower()) if not (i and w.lower() in small) else w.lower()
                        for i, w in enumerate(t.split()))
    return t


def course_title(ev_one):
    """The course's own title, the first local course that names one."""
    for _, _, t in (ev_one or {}).get("courses", []):
        # a cross-listed code run: "/CIS 66 Networking Fundamentals" after CNT 52 came off
        t = re.sub(r"^(?:[/\s]*[A-Z]{2,8}[\s\-]?\d{1,4}[A-Z]{0,2})+\s*[:\-–]?\s+", "", t or "")
        if t and len(re.findall(r"[A-Za-z]{3,}", t)) >= 1:
            return title_case(clean(t))
    return ""


# ── the rules: each takes (raw, title, ev) and returns (new title, why) or None ──────────────────

def rule_course_code(raw, title, ev_one, local=True):
    """Strip the exhibit's own college course number, and a method word, from a local course's title.

    Only a title the colleges issue (a credit-by-exam or noncredit course) is read this way; an
    industry credential's or an exam's title is its issuer's own name."""
    if not local or EXAM_BRAND.search(title):
        return None
    codes = course_codes(ev_one)
    t = title
    why = []
    for m in list(CODE_IN.finditer(t)):
        if LANG_RE.fullmatch(m.group(1).strip()):
            continue   # "French 2" is a language level, read by the language rule
        if norm_code(m.group(1), m.group(2)) in codes:
            t = t.replace(m.group(0), " ")
            why.append(f"the course number {clean(m.group(0))}")
    t2 = METHOD.sub(" ", t)
    if t2 != t and not re.match(r"^\s*Generic\b", title):
        why.append("a method word")
        t = t2
    if not why:
        return None
    t = clean(t)
    if len(re.findall(r"[A-Za-z]{3,}", t)) < 2:
        if not course_title(ev_one):
            return None   # "Construction" says less than the title it came from
        t = course_title(ev_one)
        if not t:
            return None
        why.append("takes the course's own title")
    if t == title:
        return None
    return t, "drops " + " and ".join(why)


def to_arabic(title):
    if ROMAN_KEEP.search(title):
        return title
    return ROMAN_TOKEN.sub(lambda m: str(ROMAN[m.group(1)]), title)


def rule_numerals(raw, title, ev_one):
    t = to_arabic(title)
    if t == title:
        return None
    return t, "Roman numerals become Arabic"


def _language_of(*texts):
    for t in texts:
        m = LANG_RE.search(t or "")
        if m:
            w = m.group(1)
            for full in LANGUAGES:
                if full.lower() == w.lower():
                    return full
            return LANG_ALIAS.get(w.upper())
    return None


def _level(text, lang):
    """(stage, n) a language course title or code names, or None."""
    t = " " + (text or "") + " "
    low = t.lower()
    stage = None
    if "high-beginning" in low or "high beginning" in low:
        return ("Elementary", 2)
    if re.search(r"\bintermediate\b", low):
        stage = "Intermediate"
    elif re.search(r"\b(?:elementary|beginning|first semester|first quarter)\b", low):
        stage = "Elementary"
    n = None
    m = re.search(r"\b(?:level\s+)?(I{1,3}|IV|[1-4])\b(?!\s*(?:units?|hours?))", t[t.lower().find(lang.lower()):] if lang.lower() in low else t)
    if m:
        n = ROMAN.get(m.group(1)) or int(m.group(1))
    code = re.search(r"\b(?:" + "|".join(LANG_ALIAS) + r")[\s\-]*0*(\d{1,3})([AB])?\b", t, re.I)
    if code:
        num, half = int(code.group(1)), (code.group(2) or "").upper()
        if half:            # 1A 1B elementary, 2A 2B intermediate
            if num in (1, 2):
                return (stage or ("Elementary" if num == 1 else "Intermediate"), 1 if half == "A" else 2)
        else:
            if num >= 100:
                num = num % 100 if num % 100 else num // 100
            if not stage and num in (1, 2, 3, 4):
                return ("Elementary", num) if num <= 2 else ("Intermediate", num - 2)
            if stage and not n and num in (1, 2, 3, 4):
                n = num if stage == "Elementary" or num <= 2 else num - 2
    if stage is None:
        if n in (1, 2):
            return ("Elementary", n)
        if n in (3, 4):
            return ("Intermediate", n - 2)
        return None
    if stage == "Intermediate" and n in (3, 4):
        n -= 2
    return (stage, n or 1) if n or stage == "Elementary" else (stage, None)


def rule_language(raw, title, ev_one):
    if EXAM_BRAND.search(title) or EXAM_BRAND.search(raw):
        return None
    lang = _language_of(title, raw)
    if not lang:
        return None
    rest = content(LANG_RE.sub(" ", title), drop=LANG_LEVEL_WORDS | {"i", "ii", "iii", "iv"})
    rest_raw = content(re.sub(r"\b[A-Z]{2,6}[\s\-]*\d{1,3}[AB]?\b", " ", LANG_RE.sub(" ", raw)),
                       drop=LANG_LEVEL_WORDS | {"i", "ii", "iii", "iv"})
    if rest or rest_raw - {stem("spanish"), "a", "b"}:
        return None   # Spanish for Heritage Speakers, Spanish Wines, Spanish Grammar and Composition
    lvl = _level(raw, lang) or _level(title, lang)
    if not lvl:
        return None
    stage, n = lvl
    t = f"{stage} {lang}" + (f" {n}" if n else "")
    if t == title:
        return None
    return t, f"“{clean(raw)}” reads as {stage.lower()}" + (f" level {n}" if n else "")


def _ase_code_for(raw, ev_one):
    """The ASE test a course is named by: an automotive course code that is a test code."""
    for subj, num, _ in (ev_one or {}).get("courses", []):
        if AUTO_SUBJ.match(subj or "") and (num or "").upper() in ASE:
            return num.upper()
    m = re.search(r"\bAUTO\s+([A-Z]\d)\b", raw or "")
    if m and m.group(1) in ASE:
        return m.group(1)
    return None


def _ase_by_words(text):
    words = content(re.sub(r"\([^)]*\)", " ", text or ""), drop=AUTO_GENERIC)
    if not words:
        return None
    for code in ASE_BY_WORDS:
        name = content(ASE[code], drop=AUTO_GENERIC)
        if words <= name and (len(words) >= 2 or len(name) == 1 or words == name):
            return code
    return None


def _is_auto(raw, ev_one, title):
    if any(AUTO_SUBJ.match(s or "") for s, _, _ in (ev_one or {}).get("courses", [])):
        return True
    return bool(re.search(r"\bauto(?:motive)?\b", (raw or "") + " " + (title or ""), re.I))


def rule_ase(raw, title, ev_one, local=True):
    """Name the ASE test a course prepares for, after the title, the way Sam wrote it."""
    if not local or title.startswith("ASE ") or EXAM_BRAND.search(title):
        return None   # the ASE credential itself, another issuer's credential, or an exam brand
    have = ASE_PAREN.search(title)
    code = _ase_code_for(raw, ev_one)
    ctitle = course_title(ev_one)
    if code:
        # The code must agree with the course: Las Positas's AUTO P1 is Powertrains, not the parts test.
        if ctitle and not (content(ctitle, AUTO_GENERIC) & content(ASE[code], AUTO_GENERIC)):
            if have:
                return clean(ctitle), (f"{code} at this college is “{ctitle}”, not ASE {code} "
                                       f"{ASE[code]}; the course's own title in its place")
            return None
        how = f"the course is {code}, named for the ASE test"
    else:
        if not _is_auto(raw, ev_one, title):
            return None
        # The title or the local title must name the test; the course title may only agree. A credit line
        # pooled across a credential's exhibits is too loose to name one alone.
        named = {_ase_by_words(ASE_PAREN.sub("", title)), _ase_by_words(raw)} - {None}
        course = _ase_by_words(ctitle)
        if len(named) != 1 or (course and course not in named):
            return None
        code = named.pop()
        how = f"the course is named for ASE {code}"
    paren = f"(ASE {code} {ASE[code]})"
    base = clean(ASE_PAREN.sub("", title))
    if not (content(base, AUTO_GENERIC) - content(ASE[code], AUTO_GENERIC)) and not re.search(r"\b\d\b", base):
        base = ASE_BASE
    t = f"{base} {paren}"
    if t == title:
        return None
    if have and have.group(1) == code:
        return t, f"ASE {code}'s official name is {ASE[code]}"
    return t, how


LEVEL_TOKEN = re.compile(r"(?<![\d.])\b(?:(?P<code>[1-9][A-H])|(?P<kind>Year|Level|Period|Module|Part|Phase|Grade)\s+"
                         r"(?P<val>\d{1,2}|[A-H]|I{1,3}|IV))\b", re.I)


def level_tokens(t):
    """{kind: value} a title names: a lettered course level (1A, 2D) or a labeled one (Year 5, Level 2)."""
    out = {}
    for m in LEVEL_TOKEN.finditer((t or "").replace("\xa0", " ")):
        if m.group("code"):
            out.setdefault("code", m.group("code").upper())
        else:
            v = m.group("val").upper()
            out.setdefault(m.group("kind").lower(), str(ROMAN.get(v, v)))
    return out


def rule_level(raw, title, ev_one, titles=()):
    """The local title names one level and the canonical another: propose the canonical title that names
    the local's level, else the local title itself, cleaned."""
    if EXAM_BRAND.search(raw) or EXAM_BRAND.search(title):
        return None
    mine, theirs = level_tokens(raw), level_tokens(title)
    clash = [k for k in mine if k in theirs and mine[k] != theirs[k]]
    if not clash:
        return None
    k = clash[0]
    words = content(raw)
    best, score = None, 0
    for t in titles:
        if level_tokens(t).get(k) == mine[k]:
            sc = len(words & content(t))
            if sc > score:
                best, score = t, sc
    if not best or score < 2:
        best = clean(METHOD.sub(" ", title_case(clean(raw))))
    if best == title:
        return None
    label = {"code": ""}.get(k, k.title() + " ")
    return best, f"the local title is {label}{mine[k]}, the canonical title {label}{theirs[k]}"


PIPELINE = [("course-code", rule_course_code), ("numerals", rule_numerals),
            ("language", rule_language), ("ase", rule_ase)]


def propose(raw, title, ev_one, local=True):
    """Run a local title's canonical title through the rules; (proposal, [(rule, why)])."""
    t, why = title, []
    for rid, fn in PIPELINE:
        got = fn(raw, t, ev_one, local) if rid in ("course-code", "ase") else fn(raw, t, ev_one)
        if got and got[0] and got[0] != t:
            t, w = got
            why.append((rid, w))
    return t, why


# ── fold: twins, one title over different courses, a family's level word ─────────────────────────

SECTION_WORDS = {"lecture", "lab", "laboratory", "hand", "hands", "on", "theory", "activity", "practicum"}


def same_course(ct, current, titles):
    """An existing title that names the same course, read without the words the current title shares
    and a lecture or lab tag: AUTO SDR's Specified Diagnostic and Repair is Automotive Specified
    Diagnostic and Repair under Automotive Technology."""
    drop = content(current) | {stem(w) for w in SECTION_WORDS}
    want = content(ct) - drop
    if len(want) < 2:
        return None
    hits = [x for x in titles if x != current and content(x) - drop == want]
    return min(hits, key=len) if len(hits) == 1 or hits else None


def twin_key(t):
    t = to_arabic(t or "")
    t = re.sub(r"\bintro\b", "introduction", t, flags=re.I).replace("&", " and ")
    return " ".join(sorted(stem(w) for w in re.findall(r"[A-Za-z0-9]+", t.lower()) if w != "and"))


def family_key(t):
    base = re.sub(r"\b(?:%s)\b" % "|".join(LEVEL_WORDS), " ", to_arabic(t or ""), flags=re.I)
    return " ".join(base.split()).lower()


def level_first(t):
    return bool(re.match(r"^(?:%s)\b" % "|".join(LEVEL_WORDS), t or ""))


def restyle_level(t, first):
    """Move a title's level word to the front or the end."""
    m = re.search(r"\b(%s)\b" % "|".join(LEVEL_WORDS), t)
    if not m:
        return t
    word = m.group(1)
    rest = clean((t[:m.start()] + " " + t[m.end():]))
    return f"{word} {rest}" if first else f"{rest} {word}"


# ── the sweep ────────────────────────────────────────────────────────────────────────────────────

def newest_fold_report(root):
    paths = sorted(glob.glob(os.path.join(root, "kb", "unclassified_fold", "*", "report.json")))
    return load_json(paths[-1], {}) if paths else {}


def build(root="."):
    p = lambda rel: os.path.join(root, rel)  # noqa: E731
    ut = load_json(p("kb/unified_titles.json"), {}) or {}
    overlay = load_json(p("kb/unclassified_assignments.json"), {}) or {}
    assignments = overlay.get("assignments") or {}
    kept = {k.strip(): (v if isinstance(v, list) else [v]) for k, v in (overlay.get("sweep_kept") or {}).items()}
    cr = load_json(p("kb/credentials.json"), {}) or {}
    arts = load_json(p("kb/coci_articulations.json"), {}) or {}
    statewide = load_js(p("statewide_data.js"))
    review = load_json(p("kb/exhibits_review.json"), {}) or {}
    fold = newest_fold_report(root)

    # The current canonical title of every local title: the reference, then a title saved since.
    current, reviewed = {}, {}
    for raw, e in ut.items():
        t = (e.get("unified_title") or "").strip()
        if raw.strip() and t:
            current[raw.strip()] = t
            reviewed[raw.strip()] = e.get("reviewed_at") or ""
    held = {(h.get("raw") or "").strip() for h in review.get("held") or []}
    held |= {(h.get("raw") or "").strip() for h in fold.get("held") or []}
    for raw, a in assignments.items():
        r = raw.strip()
        if r in held:
            continue
        t = (a.get("unified_title") or "").strip()
        if t and (r not in current or (a.get("reviewed_at") or "") > (reviewed.get(r) or "")):
            current[r], reviewed[r] = t, a.get("reviewed_at") or ""
    for r in held:
        current.pop(r, None)

    ev = evidence(current.keys(), arts, statewide)
    by_title = collections.defaultdict(list)
    for raw, t in current.items():
        by_title[t].append(raw)

    # A local course exhibit: the colleges issue it (or no issuer is set yet). Only these lose a course
    # number, take an ASE paren, or split by course; an industry credential's title is its issuer's.
    issuers = {t: ((recs or [{}])[0].get("issuing_agency") or "").strip() for t, recs in cr.items()}

    def is_local(raw):
        got = issuers.get(current[raw])
        if got:
            return got == ISSUER_CCC   # the primary issuer; CompTIA Security+ also lists the colleges
        a = assignments.get(raw) or assignments.get(raw + " ") or {}
        return (a.get("issuing_agency") or ISSUER_CCC) == ISSUER_CCC

    local = {raw: is_local(raw) for raw in current}
    moves = {}   # raw -> (proposed, [(rule, why)])
    all_titles = sorted(by_title)
    for raw, t in sorted(current.items()):
        got = rule_level(raw, t, ev.get(raw), all_titles)
        if got:
            new, why = propose(raw, got[0], ev.get(raw), local[raw])
            moves[raw] = (new, [("level", got[1])] + why)
            continue
        new, why = propose(raw, t, ev.get(raw), local[raw])
        if why:
            moves[raw] = (new, why)

    def title_after(raw):
        return moves[raw][0] if raw in moves else current[raw]

    # One title over different courses at one college: each takes its course's own title, or the
    # credential that already carries that course title.
    after = collections.defaultdict(list)
    for raw in current:
        after[title_after(raw)].append(raw)
    by_ckey = {}
    for t in after:
        by_ckey.setdefault(twin_key(t), t)
    for t, raws in after.items():
        if len(raws) < 2 or EXAM_BRAND.search(t):
            continue
        raws = [r for r in raws if local[r]]
        per_college = collections.defaultdict(set)
        for raw in raws:
            e = ev.get(raw) or {}
            codes = {norm_code(s, n) for s, n, _ in e.get("courses", []) if s and n}
            for c in e.get("colleges", [])[:1]:
                if len(codes) == 1:
                    per_college[c].add(next(iter(codes)))
        split = {c for c, codes in per_college.items() if len(codes) > 1}
        if not split:
            continue
        for raw in raws:
            e = ev.get(raw) or {}
            if not (set(e.get("colleges", [])[:1]) & split):
                continue
            ct = course_title(e)
            if not ct or content(ct) <= content(t):
                continue
            ct = propose(raw, ct, e, True)[0]
            target = by_ckey.get(twin_key(ct)) or same_course(ct, t, after) or (
                f"{t} ({ct})" if any(x.startswith(t + " (") for x in after) else ct)
            if target == t:
                continue
            prev = moves.get(raw, (current[raw], []))
            moves[raw] = (target, prev[1] + [("fold", f"“{t}” holds different courses at {e['colleges'][0]}; "
                                                      f"this one is “{ct}”"
                                                      + (", a credential already" if target != ct else ""))])

    # Twins: canonical titles that differ only in case, punctuation, order, numerals or a plural.
    after = collections.defaultdict(list)
    for raw in current:
        after[title_after(raw)].append(raw)
    groups = collections.defaultdict(list)
    for t in after:
        groups[twin_key(t)].append(t)
    for key, ts in groups.items():
        if len(ts) < 2:
            continue
        def weight(t):
            latest = max((reviewed.get(r) or "") for r in after[t])
            return (len(after[t]), latest, -len(t))
        win = max(ts, key=weight)
        for t in ts:
            if t == win:
                continue
            for raw in after[t]:
                prev = moves.get(raw, (current[raw], []))
                moves[raw] = (win, prev[1] + [("fold", f"“{t}” and “{win}” differ only in spelling; "
                                                      f"“{win}” has {len(after[win])} local title"
                                                      + ("s" if len(after[win]) != 1 else ""))])

    # A family whose level word sits in two places follows the placement a person chose most recently.
    after = collections.defaultdict(list)
    for raw in current:
        after[title_after(raw)].append(raw)
    fams = collections.defaultdict(list)
    for t in after:
        if re.search(r"\b(?:%s)\b" % "|".join(LEVEL_WORDS), t) and not EXAM_BRAND.search(t) \
                and not re.match(r"^Advanced (?:Placement|EMT|Cardiac|Cardiovascular)", t):
            fams[family_key(t)].append(t)
    for key, ts in fams.items():
        places = {level_first(t) for t in ts}
        if len(places) < 2:
            continue
        settled = [t for t in ts if any(current[r] == t for r in after[t])]
        if not settled:
            continue
        lead = max(settled, key=lambda t: max((reviewed.get(r) or "") for r in after[t]))
        first = level_first(lead)
        for t in ts:
            if level_first(t) == first:
                continue
            new = restyle_level(t, first)
            for raw in after[t]:
                prev = moves.get(raw, (current[raw], []))
                moves[raw] = (new, prev[1] + [("fold", f"its family puts the level word "
                                                      f"{'first' if first else 'last'}, as in “{lead}”")])

    # Drop what a person already kept, and anything that ended where it began.
    for raw in list(moves):
        new, why = moves[raw]
        if new == current[raw] or new in (kept.get(raw) or []):
            del moves[raw]

    # Cards: the local titles that share a current and a proposed title.
    issuer = {t: ((recs or [{}])[0].get("issuing_agency") or "") for t, recs in cr.items()}
    cards = collections.OrderedDict()
    for raw in sorted(moves, key=lambda r: (current[r].lower(), r.lower())):
        new, why = moves[raw]
        key = (current[raw], new)
        c = cards.get(key)
        if not c:
            c = cards[key] = {"current": current[raw], "proposed": new, "rules": [], "why": [], "locals": []}
        for rid, w in why:
            if rid not in c["rules"]:
                c["rules"].append(rid)
            if w not in c["why"]:
                c["why"].append(w)
        e = ev.get(raw) or {}
        c["locals"].append({"raw": raw, "colleges": e.get("colleges", [])[:6],
                            "course": " ".join(x for x in (e.get("courses") or [("", "", "")])[0][:2] if x),
                            "credit": (e.get("credit") or [""])[0]})

    out = []
    for (cur_t, new), c in cards.items():
        c["rules"].sort(key=RULE_IDS.index)
        under_cur = len(by_title.get(cur_t, []))
        c["id"] = hashlib.sha1(json.dumps([cur_t, new, sorted(x["raw"] for x in c["locals"])]).encode()).hexdigest()[:12]
        c["issuer"] = issuer.get(cur_t, "")
        c["proposed_exists"] = new in cr or new in by_title
        c["proposed_locals"] = len(by_title.get(new, []))
        c["proposed_issuer"] = issuer.get(new, "")
        c["current_locals"] = under_cur
        c["moves_all"] = len(c["locals"]) == under_cur
        out.append(c)
    out.sort(key=lambda c: (RULE_IDS.index(c["rules"][0]), c["current"].lower()))
    counts = {r: sum(1 for c in out if c["rules"][0] == r) for r in RULE_IDS}
    return {
        "schema": SCHEMA,
        "generated_at": iso_now(),
        "generated_by": "kb/_sweep_exhibit_titles.py",
        "rules": RULES,
        "counts": counts,
        "local_titles": sum(len(c["locals"]) for c in out),
        "cards": out,
    }


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--root", default=".")
    ap.add_argument("--out", default=OUT)
    ap.add_argument("--quiet", action="store_true")
    a = ap.parse_args(argv)
    data = build(a.root)
    path = os.path.join(a.root, a.out) if not os.path.isabs(a.out) else a.out
    old = load_json(path, {}) or {}
    if old.get("cards") == data["cards"]:
        data["generated_at"] = old.get("generated_at", data["generated_at"])
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=1, ensure_ascii=False)
        f.write("\n")
    if not a.quiet:
        print(f"wrote {a.out}: {len(data['cards'])} cards, {data['local_titles']} local titles "
              + ", ".join(f"{k} {v}" for k, v in data["counts"].items()))
    return 0


if __name__ == "__main__":
    sys.exit(main())
