"""Explicit folds for local subject codes that are not real subjects (COBIx, 2026-11-27; ported S746).

Sam approved a bundle of lightning-round repairs on 2026-11-27 (11:57 AM PT): bad splits of a
two-token code (Glendale's AD ST113 is AD ST 113), a course letter glued onto a subject
(Moorpark's CNSEM 52 is CNSE M52), and truncated department labels at Allan Hancock (BIOLO
1762G titled "BIOL 145" is BIOL 145). The lists are explicit, never a prefix rule, because a
longest-prefix fold would have been wrong in 12 Hancock cases (AGRIB is AGBUS, not AG; PHYSE
is PE, not PHYS) and would have merged Victor Valley's PHYSIO (Physiology) into PHYS (Physics).

A fold lands on the code the college itself uses today (Sam, 2026-11-28, on COBIx's note on
#3917): Hancock's subject index prints compact codes (WLDT, HOEC, POLS), so a label whose
course titles carry an older spaced code (WLD T 189) folds to the compact code and takes its
heading. Glendale's T ART104 (Acting Fundamentals II) is THTR 104 and its AL ST102
(Pharmacology/Alcohol) sits with AD ST. Where no current code matches the old one (Hancock
AGBUS, CE, HONORS, INT ST, IT, SOC SC; Glendale RET S; LA Southwest Q CNTRL) the fold keeps the
code the titles print, and no title is invented.

Chabot's glued codes and Cerro Coso's and Porterville's campus letters live in
kb/coci_campus_letter.py (#3908, #3918); PHEACJUD stays unfolded (d-pheacjud-not-folded-s745).
This module does not touch ICC, slash pairs, ESLNC/MATNC, or sure-under-80 review codes.

Applied by kb/_build_coci_lookup.py after the campus-letter fold, so every reader of
coci_lookup_data.js sees the folded code. kb/subject_decisions.py uses base_code so a person's
save on a split or truncated code carries to the folded one. Placeholders (Cypress C, Golden
West SPTP, LAVC BOTH KIN) are not folded; the Subjects build marks them not_a_subject
(NOT_A_SUBJECT below).
"""

from __future__ import annotations

import csv
import glob
import json
import os
import re

_HERE = os.path.dirname(os.path.abspath(__file__))

# College name exactly as COCI writes it, then slug for Subjects / decisions.
SLUG = {
    "allan_hancock": "Allan Hancock College",
    "glendale_community": "Glendale Community College",
    "moorpark": "Moorpark College",
    "feather_river": "Feather River College",
    "college_of_the_desert": "College of the Desert",
    "los_angeles_southwest": "Los Angeles Southwest College",
    "los_angeles_trade_technical": "Los Angeles Trade Technical College",
}

COLLEGE_OF = {v: k for k, v in SLUG.items()}

# (college, fake_subject) -> (base_subject, suffix prepended to the course number).
# Moorpark: CNSEM 52 -> CNSE M52 (M is the course-number prefix).
PREPEND = {
    "Moorpark College": {
        "CNSEM": ("CNSE", "M"),
    },
}

# (college, fake_subject) -> (target_subject, token stripped off the front of the number).
# Glendale AD ST113 -> AD ST 113; LA Southwest Q CNTRL010 -> Q CNTRL 010.
SPLIT = {
    "Glendale Community College": {
        "AD": ("AD ST", "ST"),
        "AL": ("AD ST", "ST"),   # AL ST102 Pharmacology/Alcohol: Glendale's alcohol and drug studies code is AD ST
        "T": ("THTR", "ART"),    # T ART104 Acting Fundamentals II is THTR 104
        "RET": ("RET S", "S"),   # no current Glendale code for these courses; kept as the titles print it
    },
    "Los Angeles Southwest College": {
        "Q": ("Q CNTRL", "CNTRL"),
    },
    "Los Angeles Trade Technical College": {
        "OFF": ("OFF MCH", "MCH"),
    },
}

# (college, fake_subject) -> (target_subject, replacement number). The listed number field is junk.
SET_NUMBER = {
    "Feather River College": {
        "ENGL005": ("ENGL", "005"),
    },
    "College of the Desert": {
        "CIS 023D": ("CIS", "023D"),
    },
}

# Allan Hancock truncated department labels, second-reader targets, sure 80. If the course title
# is a code and number (BIOLO 1762G titled "BIOL 145"; WELDI titled "WLD T 189"), the fold uses that
# number; otherwise the subject changes and the original number is kept. Never a prefix rule.
# A target is the code Hancock's own subject index prints (kb/hand_filed_catalogs/subjects/
# allan_hancock.json): where the titles carry an older code, TITLE_CODE names it for the parse.
HANCOCK_LABELS = {
    "ACCOU": "ACCT",
    "ADMIN": "AJ",
    "AGRIB": "AGBUS",
    "APPRE": "APRN",
    "AUTOM": "AT",
    "BIOLO": "BIOL",
    "BUSIN": "BUS",
    "CHEMI": "CHEM",
    "COMPU": "CS",
    "COOPE": "CE",
    "DENTA": "DA",
    "ECONO": "ECON",
    "EMERG": "EMS",
    "ENGIT": "ET",
    "ENGLI": "ENGL",
    "ENVI": "ENVT",
    "FACS": "FCS",
    "FRENC": "FRCH",
    "GEOLO": "GEOL",
    "GRAPH": "GRPH",
    "HEALE": "HED",
    "HISTO": "HIST",
    "HOME": "HOEC",
    "HONOR": "HONORS",
    "INATL": "INT ST",
    "INDUS": "IT",
    "LAWEN": "AJ",
    "LEADE": "LDER",
    "MACHI": "MT",
    "MEDIC": "MA",
    "OFFIC": "CBOT",
    "PERSO": "PD",
    "PHYSE": "PE",
    "PHYSI": "PHSC",
    "PHYSS": "PHYS",
    "POLIT": "POLS",
    "SOCIA": "SOC SC",
    "WELDI": "WLDT",
}

# The code a Hancock label's course titles print, where it differs from the target (WLD T 189 -> WLDT 189).
TITLE_CODE = {
    "APPRE": "APPREN",
    "COMPU": "COM SC",
    "FRENC": "FRENCH",
    "GRAPH": "GRAPHI",
    "HEALE": "H ED",
    "HOME": "HO EC",
    "LEADE": "LDRSHP",
    "OFFIC": "OA",
    "PHYSI": "PHY SC",
    "POLIT": "POL SC",
    "WELDI": "WLD T",
}

# Lightning-round placeholders: not folded; the Subjects build marks title_state not_a_subject.
NOT_A_SUBJECT = frozenset({
    ("cypress", "C"),
    ("golden_west", "SPTP"),
    ("los_angeles_valley", "BOTH KIN"),
})


# Whole-code folds a person ruled (Sam, 2026-11-27 and -28; COBIx's #3937, filed S748): the rows of
# kb/subject_title_hunt/*retired_or_fix*.csv whose finding is `fold`, with a fix_to, and whose found_by names a person.
# The code renames to the college's own code; the number is kept, less the target's second token where the code was
# split (Glendale ETH S122 is ETH S 122), or taken from a Hancock-style title that prints target and number. Rows a
# machine found (found_by COBI or COBIx) are never read here: they wait for a person. Keyed by the college name with
# everything but letters and digits dropped, so COCI's and the catalog's spellings meet.
_MACHINE = {"", "COBI", "COBIX"}
_HUNT = os.path.join(_HERE, "subject_title_hunt")

# Person-ruled folds held back, with the reason (S748). The row stays in the CSV; the fold waits for a second look.
HELD_FOLDS = {
    ("losangelessouthwestcollege", "ENG"): "the ENG rows are engineering courses (ELC022 Electrical Circuits, "
                                           "GEN056A Computer Augmented Design), not English",
}

# A Hancock-style row whose title prints another code with its number goes to that code (S748): 8 of SOCIO's 13 rows
# are titled SOC SC 149, which is Social Science, not Sociology.
TITLE_ALT = {
    ("allanhancockcollege", "SOCIO"): ("SOC SC",),
}


def _ckey(s):
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())


def _person_rows():
    whole, nas = {}, set()
    for path in sorted(glob.glob(os.path.join(_HUNT, "*retired_or_fix*.csv"))):
        with open(path, encoding="utf-8", newline="") as f:
            for r in csv.DictReader(f):
                who = (r.get("found_by") or "").strip()
                if who.upper() in _MACHINE:
                    continue
                ck, code = _ckey(r.get("college")), (r.get("local_subject_code") or "").strip().upper()
                finding, to = (r.get("finding") or "").strip(), (r.get("fix_to") or "").strip()
                if not ck or not code:
                    continue
                if finding == "fold" and to and (ck, code) not in HELD_FOLDS:
                    whole.setdefault(ck, {})[code] = to
                elif finding == "not_a_subject":
                    nas.add((ck, code))
    return whole, nas


WHOLE, _PERSON_NOT_A_SUBJECT = _person_rows()


def _subject_colleges():
    """slug -> college name, from the Subjects record (kb/hand_filed_catalogs/subjects/<slug>.json)."""
    out = {}
    for path in glob.glob(os.path.join(_HERE, "hand_filed_catalogs", "subjects", "*.json")):
        try:
            with open(path, encoding="utf-8") as f:
                name = (json.load(f) or {}).get("college")
        except (OSError, ValueError):
            continue
        if name:
            out[os.path.basename(path)[:-5]] = name
    return out


_FOLD_KEYS = set(WHOLE) | {ck for ck, _c in _PERSON_NOT_A_SUBJECT}
for _slug, _name in _subject_colleges().items():
    if _ckey(_name) in _FOLD_KEYS and _slug not in SLUG:
        SLUG[_slug] = _name
NOT_A_SUBJECT = NOT_A_SUBJECT | frozenset(
    (slug, code) for slug, name in SLUG.items() for ck, code in _PERSON_NOT_A_SUBJECT if _ckey(name) == ck)


def _norm(s):
    return (s or "").strip()


def _upper(s):
    return _norm(s).upper()


def _prepend(suffix, number):
    n = _norm(number)
    su = (suffix or "").upper()
    if n.upper().startswith(su):
        return n
    return (suffix or "") + n


def _strip_prefix(prefix, number):
    n = _norm(number)
    pu = (prefix or "").upper()
    if n.upper().startswith(pu):
        return n[len(prefix):]
    return n


def _parse_title(target, title):
    """If the title is the target code plus a number (BIOL 145, H ED 100), return that number."""
    t = _norm(title)
    if not t or not target:
        return None
    m = re.match(r"^" + re.escape(target) + r"\s+(\S+)$", t, re.I)
    return m.group(1) if m else None


def _compact(s):
    return "".join(c for c in _upper(s) if c.isalnum())


def _lookup(table, subj):
    if not table:
        return None
    key, compact = _upper(subj), _compact(subj)
    for k, v in table.items():
        if k == subj or _upper(k) == key or _compact(k) == compact:
            return v
    return None


def fold(college, subject, number, title=None):
    """Return (subject, number) after an explicit fold; anything else unchanged."""
    college = _norm(college)
    subj = _norm(subject)
    num = _norm(number)
    key = _upper(subj)

    spec = _lookup(PREPEND.get(college) or {}, subj)
    if spec:
        base, suffix = spec
        return base, _prepend(suffix, num)

    spec = _lookup(SPLIT.get(college) or {}, subj)
    if spec:
        target, prefix = spec
        return target, _strip_prefix(prefix, num)

    spec = _lookup(SET_NUMBER.get(college) or {}, subj)
    if spec:
        return spec[0], spec[1]

    if college == "Allan Hancock College":
        target = HANCOCK_LABELS.get(key)
        if target:
            parsed = _parse_title(TITLE_CODE.get(key, target), title)
            if parsed is None and key in TITLE_CODE:
                parsed = _parse_title(target, title)
            return target, parsed if parsed is not None else num

    ck = _ckey(college)
    target = (WHOLE.get(ck) or {}).get(key)
    if target:
        for alt in TITLE_ALT.get((ck, key), ()):
            parsed = _parse_title(alt, title)
            if parsed is not None:
                return alt, parsed
        parsed = _parse_title(target, title)
        if parsed is not None:
            return target, parsed
        rest = target[len(subj):].strip() if _upper(target).startswith(key + " ") else ""
        return target, _strip_prefix(rest, num) if rest else num

    return subject, number


def base_code(slug, code):
    """The subject a fake code folds to for a college slug (`chabot`, `PEACLSF` -> `PEAC`), else the code."""
    college = SLUG.get(slug, "")
    if not college:
        return code
    fs, _fn = fold(college, code, "")
    # fold() with an empty number still returns the target subject for every map we have.
    return fs if fs != _norm(code) or _upper(fs) != _upper(code) else code


def is_not_a_subject(slug, code):
    c = _norm(code)
    return (slug, c) in NOT_A_SUBJECT or (slug, _upper(c)) in NOT_A_SUBJECT
