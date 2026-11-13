#!/usr/bin/env python3
"""cert_naming.py — how an exhibit based on an industry certification is titled.

Sam's ruling, 2026-11-11 (the Exhibits card for "Noncredit for AUTO P1", which kept returning to Another
look): an exhibit based on a certification takes the certification's official name first and its code in
parentheses, "Medium/Heavy Truck Parts Specialist (ASE P1)". The program name does not lead, so
"Automotive Technology (...)" is out: "Students search by the cert name, and colleges adopt by it."

Why a noncredit course with a certification's title can qualify for CPL (his three paths, the rule's
notes, NOTES below): all three end at the same canonical certification title, which is why a
cert-named noncredit title folds under the certification and never under the program.

This module is the one place the format lives. kb/_sweep_exhibit_titles.py (Another look),
kb/_build_exhibits_review.py (Review's proposals), kb/_build_exhibits_related.py (the related-titles
panel and the rename batch) import it.

The canonical title carries the credential's issuer (Sam's ruling 1 on issue #3110, 2026-11-11, which
replaced his note of the same morning, "keep the college as issuer on the P1 title"): a title in the format
is the certification's own, so its issuer is ASE. The college that gives the credit by its own exam shows on
its local exhibit as that exhibit's assessor (kb/exhibit_paths.py), which is how his rulings of 2026-10-31
and 2026-11-07 hold: the college for its own exam, the vendor for the certificate. The design note is
docs/reference/canonical_credential_model.md.

Existing titles are never renamed here. A title in an older form is listed for Sam in the rename batch
(kb/_build_exhibits_related.py) and moves only through his approval and the credential rename apply.
"""
import re

RULE = {
    "id": "cert-name-first",
    "label": "Certification name first",
    "set_by": "Sam",
    "date": "2026-11-11",
    "words": "Use the cert's official name first and the code in parentheses: \"Medium/Heavy Truck Parts "
             "Specialist (ASE P1)\". Don't put the program name in front, so \"Automotive Technology (...)\" "
             "is out. Students search by the cert name, and colleges adopt by it.",
    "tip": "An exhibit based on a certification takes the certification's official name, then its code in "
           "parentheses: Medium/Heavy Truck Parts Specialist (ASE P1). The program name does not lead.",
    "notes": [
        "Why a noncredit course with a certification's title can qualify for CPL. There are three paths.",
        "Credit by exam, mirrored: credit and noncredit faculty agree on the assessment evidence, and the "
        "student is registered in the mirrored credit course and gets a grade.",
        "Credit by exam, not mirrored: the student gets a CX CPL notation and a grade on the credit course.",
        "Industry certification: the student earns the certification, possibly after the noncredit course, "
        "and gets credit through an existing articulation.",
        "All three point to the same canonical certification title, so a cert-named noncredit title folds "
        "under the certification, not under the program.",
    ],
}

ASE_ISSUER = "National Institute for Automotive Service Excellence (ASE)"

# The National Institute for Automotive Service Excellence's test names, by test code.
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

# ASE's Military Tactical Wheeled Vehicle (TWV) test series (Sam, 2026-11-11, from ase.com/tests/mil: "ASE MIL3 test is
# the Military Tactical Wheeled Vehicle (TWV) – Drive Train certification ... adjust the canonical title to match the
# official ASE titles"). Each name carries the series, so "Diesel Engines (ASE MIL2)" never reads as the truck test T2:
# "Military Tactical Wheeled Vehicle – Drive Train (ASE MIL3)". Two choices keep one pair of parentheses in a title, the
# one that holds the code: the series' acronym (TWV) and the tests' own (HVAC, PMCS) are left out, and "&" reads "and",
# as the A7 and T7 names already do here. The series belongs to the automotive subject, never HVAC (Sam, 2026-11-11:
# "so the hvac mil should be in auto not hvac subj"); kb/_build_it_ai_credential_catalog.py's ASE_SERIES_CIP places it.
MIL_SERIES = "Military Tactical Wheeled Vehicle"
MIL = {
    "MIL1": "Military Fundamentals", "MIL2": "Diesel Engines", "MIL3": "Drive Train", "MIL4": "Chassis",
    "MIL5": "Suspension, Steering, and Hydraulics", "MIL6": "Electrical/Electronic Systems",
    "MIL7": "Heating, Ventilation and Air Conditioning", "MIL8": "Preventive Maintenance Checks and Services",
}
ASE.update({code: "%s – %s" % (MIL_SERIES, name) for code, name in MIL.items()})

# The families the format is run for, one rename batch each, in this order. ASE is first; the others
# wait until its batch is decided (Sam, 2026-11-11: "Once ASE is done, run the same check for other
# cert issuers (CompTIA, AWS, NCCER...) as separate batches").
FAMILIES = [
    {"id": "ase", "short": "ASE", "issuer": ASE_ISSUER, "active": True},
    {"id": "comptia", "short": "CompTIA", "issuer": "CompTIA", "active": False},
    {"id": "aws", "short": "AWS", "issuer": "Amazon Web Services (AWS)", "active": False},
    {"id": "nccer", "short": "NCCER", "issuer": "NCCER", "active": False},
]

CODE = r"MIL\d|[A-Z]\d|xEV"
# "Brakes (ASE A5)": the format. Nothing follows the code inside the parentheses.
NEW_FORM = re.compile(r"^(?P<name>.+?)\s*\(ASE\s+(?P<code>" + CODE + r")\)\s*$")
# "Automotive Technology (ASE A5 Brakes)": a name in front, the test and its words in parentheses.
PAREN_FORM = re.compile(r"^(?P<base>.*?)\s*\(ASE\s+(?P<code>" + CODE + r")\b\s*(?P<words>[^)]*)\)\s*$")
# "ASE A5 — Brakes": the code first.
CODE_FIRST = re.compile(r"^ASE\s+(?P<code>" + CODE + r")\s*[—–-]\s*(?P<name>.+?)\s*$")
ANY_CODE = re.compile(r"(?<![A-Za-z0-9])(" + CODE + r")(?![A-Za-z0-9])")
ASE_NAMED = re.compile(r"^\s*(?:ASE\b|Automotive Services? Excellence\b|National Institute for Automotive "
                       r"Service Excellence\b)", re.I)
_STANDARDS_WORDS = re.compile(r"\bstandards?\s*$", re.I)


def is_standards(title):
    """True for "<name> (ASE <code> standards)": a college's course taught to the certification's standard. Sam's ruling A
    (2026-11-11, cpl_memory sam-ic-exhibits-go-to-cert-title-2026-11-11) keeps it apart from the certification: the
    industry-certification exhibits go under the cert title, and only college-exam titles fold into the standards title,
    which he named himself (his saved renames of 15:26Z 2026-11-11). So nothing proposes it in the cert format: the
    rename batch and Another look both read it as standing (#3228, S647). kb/fold_issuer.py's rule 2b reads it here."""
    m = PAREN_FORM.match((title or "").strip())
    return bool(m and _STANDARDS_WORDS.search(m.group("words") or ""))


def cert_title(name, short, code):
    """The format: the certification's official name, then its issuer's short name and code."""
    return "%s (%s %s)" % (name.strip(), short, code)


def ase_title(code):
    return cert_title(ASE[code], "ASE", code) if code in ASE else None


def _words(text):
    return {w for w in re.findall(r"[a-z0-9]+", (text or "").lower())
            if w not in ("and", "the", "of", "in", "for", "ase", "automotive", "auto", "automobile", "systems",
                         "system", "certification", "certificate", "exam", "test")}


def _stem(w):
    for suf in ("ing", "es", "s"):
        if w.endswith(suf) and len(w) - len(suf) >= 4:
            return w[:-len(suf)]
    return w


def codes_named(title):
    """The test codes a title names, in the order it names them ("A1-A8" reads as its two ends, A1 and A8).
    The one code parser: ase_read and kb/test_mix.py (a local exhibit's test mix) both read through it."""
    codes = []
    for c in ANY_CODE.findall(re.sub(r"\b([A-Z])(\d)\s*[–-]\s*\1?(\d)\b", r"\1\2 \1\3", title or "")):
        if c not in codes:
            codes.append(c)
    return codes


def code_by_words(title):
    """The one light-vehicle or truck test a title's words name, or None. A title needs every word of the
    test's name (so "Automotive Braking Systems" reads A5 or T4 and stays unnamed: two tests are Brakes)."""
    have = {_stem(w) for w in _words(re.sub(r"\([^)]*\)", " ", title or ""))}
    if not have:
        return None
    hits = [c for c, name in ASE.items() if {_stem(w) for w in _words(name)} == have]
    return hits[0] if len(hits) == 1 else None


def ase_read(title, issuer=""):
    """How a title stands against the format. Returns None for a title that is not ASE's, else
    {"kind", "codes", "proposed", "why"}:

      fits           already "<Official name> (ASE <code>)"
      code-first     "ASE A5 — Brakes": the code leads
      program-first  "Automotive Technology (ASE A5 Brakes)": a program or course name leads
      wrong-name     in the format, but the name is not the test's official name
      missing-code   ASE issues it and it names no test code
      several        a bundle, a pair or a master status: no single official name, so no proposal
      standards      "Brakes (ASE A5 standards)", a course taught to the standard (is_standards): it stands
    """
    t = (title or "").strip()
    if is_standards(t):
        code = PAREN_FORM.match(t).group("code")
        return {"kind": "standards", "codes": [code], "proposed": "",
                "why": "a course taught to ASE %s's standard, kept apart from the certification (Sam's ruling A, "
                       "2026-11-11)" % code}
    is_ase_issuer = "Automotive Service Excellence" in (issuer or "")
    m = NEW_FORM.match(t)
    if m:
        code = m.group("code")
        want = ase_title(code)
        if want is None or want == t:
            return {"kind": "fits", "codes": [code], "proposed": "", "why": ""}
        return {"kind": "wrong-name", "codes": [code], "proposed": want,
                "why": "ASE %s's official name is %s" % (code, ASE[code])}
    m = PAREN_FORM.match(t)
    if m and not ASE_NAMED.match(t):
        code = m.group("code")
        want = ase_title(code)
        base = m.group("base").strip()
        return {"kind": "program-first", "codes": [code], "proposed": want or "",
                "why": ("“%s” leads; the certification's name is %s" % (base, ASE[code])) if want
                else "ASE %s is not in the table of official names" % code}
    if ASE_NAMED.match(t) or is_ase_issuer:
        codes = codes_named(t)
        cf = CODE_FIRST.match(t)
        if cf and len(codes) == 1:
            code = cf.group("code")
            if code in ASE:
                return {"kind": "code-first", "codes": [code], "proposed": ase_title(code),
                        "why": "the code leads; the certification's name is %s" % ASE[code]}
            name = re.sub(r"\s*\([^)]*\)\s*$", "", cf.group("name")).strip()
            return {"kind": "code-first", "codes": [code], "proposed": cert_title(name, "ASE", code),
                    "why": "the code leads; %s is not in the table of official names, so the name is the "
                           "reference's own" % code}
        if codes or re.search(r"\b(?:Bundle|Master)\b", t):
            return {"kind": "several", "codes": codes, "proposed": "",
                    "why": "names more than one test or a master status; no single official name"}
        code = code_by_words(t)
        return {"kind": "missing-code", "codes": [code] if code else [], "proposed": ase_title(code) if code else "",
                "why": ("names no test code; its words are ASE %s's" % code) if code
                else "names no test code, and its words fit no single test"}
    return None


# CompTIA's exam series: "CV0-004" (Cloud+), "SY0-701" (Security+), "N10-009" (Network+), "220-1101" (A+), "FC0-U61"
# (ITF+), "CLO-002". Read in any case and written back in capitals.
_SERIES = r"(?:220-\d{4}|(?:[A-Z]{1,3}\d{1,2}|CLO|CAS|CNX)-U?\d{2,3})"
SERIES = re.compile(r"(?<![A-Za-z0-9])" + _SERIES + r"(?![A-Za-z0-9])", re.I)
# A list of series: joined by "/", ",", "&", "+", "and" or "or", the second sometimes shortened ("220-1101/1102").
_SERIES_JOIN = r"(?:\s*(?:[/,&+]|\band\b|\bor\b)\s*(?:" + _SERIES + r"|\d{3,4}(?![A-Za-z0-9-])))*"
_SERIES_WORDS = r"(?:(?:version|exams?)\s+)?"
_SERIES_PARENS = re.compile(r"\s*\(\s*" + _SERIES_WORDS + _SERIES + _SERIES_JOIN + r"(?:\s+exams?)?\s*\)", re.I)
_SERIES_BARE = re.compile(r"\s*(?:[—–:-]\s*)?" + _SERIES_WORDS + r"(?<![A-Za-z0-9])" + _SERIES + _SERIES_JOIN
                          + r"(?![A-Za-z0-9])(?:\s+exams?\b)?", re.I)
# What a clean strip never leaves: a joiner at the end, or an empty pair of parentheses.
# ("Cloud+" ends in "+" as a name: only a "+" after a space is a joiner.)
_SERIES_LEFTOVER = re.compile(r"(?:[/,&(]|\s\+|\band|\bor|\bexams?|\bversion)\s*$|\((?:\s|[/,&+]|\band\b|\bor\b)*\)", re.I)
# "220-1101/1102": the second exam of the pair, written short, is "220-1102".
_SHORT_PAIR = re.compile(r"(?<![A-Za-z0-9])(220-)\d{4}((?:\s*(?:[/,&+]|\band\b|\bor\b)\s*\d{4}(?![A-Za-z0-9-]))+)", re.I)


def series_aside(title, issuer=""):
    """(the title without its exam series, [the series it named]) for a CompTIA title; any other title comes back as it
    came, with no series. A CompTIA title is the credential's name, "CompTIA Cloud+", and the exam series is a search
    alias of it, never part of the title: CompTIA retires a series every few years (CV0-003 to CV0-004), while the
    credential's name stands. COBIx on #3223 (2026-11-13, comment 6859080666), applying Sam's bundle ruling of 2026-11-11
    (the family and credential make the title, component codes are aliases) to CompTIA; the S648 conductor took the
    recommendation (cpl_memory d-comptia-series-is-alias-s648).

    A title the strip cannot leave clean comes back as it came, with no series, for a person to name: one that is only a
    series ("SY0-701"), or one that would keep a joiner or an empty pair of parentheses (the review of #3241)."""
    t = (title or "").strip()
    if "comptia" not in (issuer or "").lower() and not t.lower().startswith("comptia"):
        return t, []
    found = [f.upper() for f in SERIES.findall(t)]
    for m in _SHORT_PAIR.finditer(t):
        found += [m.group(1) + d for d in re.findall(r"\d{4}", m.group(2)) if m.group(1) + d not in found]
    if not found:
        return t, []
    bare = _SERIES_BARE.sub("", _SERIES_PARENS.sub("", t))
    bare = re.sub(r"\s{2,}", " ", bare).strip(" -–—:,")
    if not bare or _SERIES_LEFTOVER.search(bare) or SERIES.search(bare):
        return t, []
    return bare, found


def canonical(title, issuer="", series=True):
    """A proposed title put in the format, or the title as it came. Used for new proposals only. A CompTIA title loses
    its exam series (series_aside), unless `series` is False: a local course title goes out as the course has it."""
    if series:
        title = series_aside(title, issuer)[0]
    got = ase_read(title, issuer)
    return got["proposed"] if got and got["proposed"] else title
