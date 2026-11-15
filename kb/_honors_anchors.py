#!/usr/bin/env python3
"""The Honors anchors (S654, `d-honors-anchored-rows-s654`): the honors_of rows rest on same-college course pairs.

WHY. Four reviews of #3315 found the lump and sequence class leaking each round. Every design asserted the Honors
relation between two CLUSTERS and tried to certify, by title and sequence rules, that each cluster is one course;
certifying a cluster is the M-ID layer's own unfinished work. The Honors relation is a fact about two courses at ONE
college, so a row rests on those course pairs (its anchors) and carries them. A row on an impure base is the base's
own impurity; the anchors say where the row goes when the base is split. Sam: M-IDs are "low stakes attempts to get
our course clusters as close to right as we can", and the care goes into the rewiring
(`sam-mids-are-ours-trial-and-error-2026-11-14`, `sam-mid-care-goes-into-the-rewiring-2026-11-14`).

RULE 1, an anchor. At one college, an Honors course and a base course whose codes name the same subject and the same
number token exactly once the Honors marker is taken out (`honors_code_base`, a space before the H included; 1AH
pairs with 1A, never 1B; padding zeros dropped after any non-digit, so '(ETH) 027H' meets '(ETH) 27'), and a second
signal at the course level: an Honors word in the Honors course's title. A number pair whose titles disagree is
DOUBTFUL, and so is one whose Honors course carries no Honors word (equal titles, the marker in the number); neither
is an anchor. A trailing H that is a series letter (the college lists the same number with A to G) under a title
with no Honors word is not an Honors course. A base course whose own title carries an Honors word is not a base.
RULE 2, a row. An Honors M-ID gets an honors_of row to base B when it has an anchor and every anchor lands in B.
Anchors in two bases hold it ("anchors split"); any doubtful anchor holds it; no anchor, no row.
RULE 3, a mint (step 4, planned only). The row, and: every member course of the Honors M-ID is the Honors course of an
anchor; B has exactly one Honors M-ID anchored into it; B holds no CCN-coded course, whatever kind of base B is; no
derivation names a second base for the Honors M-ID. An official base mints nothing, so there the CCN clause holds the
row itself (MATH 210 holds MATH C2210 and C2210H).

`drop` names clauses to switch off, for the mutation test in kb/_honors_matcher_recall.py only.
"""
import html
import os
import re
import sys
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _reclustering_s648_dryrun as s648  # noqa: E402

CLAUSES_1 = ("subject_marker", "same_college", "exact_number", "honors_marker", "second_signal", "doubtful", "series_letter",
             "base_not_honors", "unescape")
CLAUSES_2 = ("split", "doubtful_holds", "base_outside", "mostly_honors")
CLAUSES_3 = ("all_members_anchored", "one_honors_per_base", "ccn", "multi_base", "split_candidate")
CCN_CODE = re.compile(r"^[A-Z]+\s*C\d{4}[A-Z]*$")


def clean(title, drop=()):
    """A title as a reader sees it: HTML entities decoded (Glendale's 'Honors&nbsp;World&nbsp;History')."""
    t = (title or "") if "unescape" in drop else html.unescape(title or "")
    return " ".join(t.replace("\xa0", " ").split())


def honors_word(title, drop=()):
    return bool(s648.HONORS_WORD.search(clean(title, drop)))


def titles_agree(honors_title, base_title, drop=()):
    """The matcher's code-and-title test, read on the cleaned titles: stems mostly agree, or the base title
    abbreviates the Honors one; sequence marks that differ never agree."""
    h, b = clean(honors_title, drop), clean(base_title, drop)
    return (s648.title_agree(s648.strip_honors(h), b) >= s648.CODE_TITLE_AGREE
            or s648.abbrev_agree(h, b) >= s648.CODE_ABBREV_AGREE)


def anchor_key(code):
    """A code compared at one college: upper case, every space dropped, and the zeros that pad a number dropped
    wherever they follow a non-digit (#3315's anchors review: San Jose City's '(ETH) 027H' meets '(ETH) 27', and
    'ECON 001H' meets 'ECON 1'). s648.code_key drops them only after a letter; the matcher keeps its own key."""
    return re.sub(r"(?<=\D)0+(?=\d)", "", re.sub(r"\s+", "", (code or "").upper()))


def number_key(code, drop=()):
    k = anchor_key(code)
    if "exact_number" in drop:            # the mutation: digits alone, so 1BH would reach 1A
        m = re.search(r"\d+", k)
        return re.sub(r"\d.*$", "", k) + (m.group(0) if m else "")
    return k


def series_letter(code, college_keys):
    """The H ends a run of series letters at this college (MUS 10A to 10G beside MUS 10H)."""
    k = anchor_key(code)
    return k.endswith("H") and any(k[:-1] + c in college_keys for c in "ABCDEFG")


def subject_untouched(code, base_code):
    """The marker sat in the number, not the subject: the two codes' letters before the first digit agree."""
    # The subject is what comes before the number, an H joined to the number counting as the number's (CHEM H206).
    lead = lambda c: re.sub(r"\s+", "", re.split(r"H?\d", (c or "").upper(), maxsplit=1)[0])  # noqa: E731
    return lead(code) == lead(base_code)


def honors_subject(code, college=None):
    """The subject carries the H as an Honors marker at this college: today only Victor Valley's form (CHEMH 206,
    HISTH 3B). An H-ending subject that names a discipline of its own (ARTH, PSYCH, MATH, ENGLISH, HEALTH) is not one,
    and the same letters at another college are that college's own subject."""
    subj = re.split(r"\s+", (code or "").upper().strip(), maxsplit=1)[0]
    return subj in HONORS_SUBJECTS.get(college, ())


# Subjects whose trailing H is the Honors marker, by college, read from unified_courses_members.js on the 2026-11-15
# 06:19 payload (S655, COBIx's finding 2 on #3315): every course with an Honors word whose subject is another subject
# plus H at its own college. Two, both Victor Valley's: CHEMH 206 (beside CHEM 206) and HISTH 3B (no HIST 3B filed
# today). The other H-ending subjects on an Honors-word course (ANTH, MATH, ARTH, ARCH, ERTH, ETH, HLTH, PSYCH, AH,
# SPCH, HEALTH, PUBH) each name a discipline.
HONORS_SUBJECTS = {"Victor Valley College": frozenset({"CHEMH", "HISTH"})}


def anchor_kind(hrow, brow, college_keys=frozenset(), drop=()):
    """'anchor', 'doubtful' or None for an Honors candidate row and a base row ({college, code, title})."""
    if "same_college" not in drop and hrow["college"] != brow["college"]:
        return None
    if hrow is brow:
        return None
    hb = s648.honors_code_base(hrow["code"])
    if "honors_marker" in drop:
        hb = hb or hrow["code"]
    if not hb or number_key(hb, drop) != number_key(brow["code"], drop):
        return None
    if "subject_marker" not in drop and not subject_untouched(hrow["code"], hb) and not honors_subject(hrow["code"], hrow["college"]):
        # An H that ends the subject is a marker only where the subject is the base's plus H (Victor Valley's CHEMH
        # 206 beside CHEM 206); ARTH beside ART, PSYCH beside PSYC, MATH beside MAT are two subjects, Honors word or
        # not (COBIx on #3315, 03:26Z).
        return None
    if "base_not_honors" not in drop and honors_word(brow["title"], drop):
        return None
    hw = honors_word(hrow["title"], drop)
    agree = titles_agree(hrow["title"], brow["title"], drop)
    if not hw:
        if "series_letter" not in drop and series_letter(hrow["code"], college_keys):
            return None
        if "second_signal" in drop:
            return "anchor"
        # With no Honors word the code alone marks the course. An H ending the subject is no marker (Glendale's ARTH
        # 119 beside ART 119 is one course under two subjects), and titles that differ name two courses (Foothill's
        # LINC 073H Illustrator beside LINC 73 Photoshop): neither is Honors. Equal titles with the marker in the
        # number are at most DOUBTFUL, never an anchor (#3315's anchors review: both such pairs in the data are false;
        # Contra Costa's PHYS 121H differs from PHYS 121 in calculus).
        if not subject_untouched(hrow["code"], hb):
            return None
        if s648.strip_honors(clean(hrow["title"], drop)) != s648.strip_honors(clean(brow["title"], drop)):
            return None
        return "doubtful"
    if not agree and "doubtful" not in drop:
        return "doubtful"
    return "anchor"


def anchors(members, drop=()):
    """Every anchor and doubtful anchor over {identity: [{college, code, title}]}: a list of dicts."""
    at = defaultdict(list)
    for ident, rows in members.items():
        for r in rows:
            at[r["college"]].append((ident, r))
    if "same_college" in drop:
        at = {"*": [x for v in at.values() for x in v]}
    out = []
    for college, rows in sorted(at.items()):
        keys = {anchor_key(r["code"]) for _, r in rows}
        by_key = defaultdict(list)
        for ident, r in rows:
            by_key[number_key(r["code"], drop)].append((ident, r))
        for ident, r in rows:
            hb = s648.honors_code_base(r["code"])
            if "honors_marker" in drop:
                hb = hb or r["code"]
            if not hb:
                continue
            for bident, br in by_key.get(number_key(hb, drop), ()):
                kind = anchor_kind(r, br, keys, drop)
                if kind:
                    out.append({"honors_id": ident, "base_id": bident, "kind": kind, "college": r["college"],
                                "honors_code": r["code"], "base_code": br["code"],
                                "honors_title": clean(r["title"]), "base_title": clean(br["title"])})
    return out


def decide(x, xa, members, anchored_into, other_bases, is_official, drop=(), split_of=None):
    """Rules 2 and 3 for one Honors M-ID x. xa: its anchors (anchor and doubtful). anchored_into: base -> the set of
    Honors M-IDs with an anchor into it. other_bases: bases another derivation names for x. is_official(base).
    split_of(base): the cluster tests' flags on the base (kb/_honors_of_s653_dryrun.py split_flags); a flagged base
    is a split candidate, and its mint waits (COBIx's Q1, `d-honors-no-mint-on-split-candidate-s654`).
    Returns {"base": B or None, "row": bool, "mint": bool, "holds": [...], "no_mint": [...]}."""
    good = [a for a in xa if a["kind"] == "anchor"]
    doubt = [a for a in xa if a["kind"] == "doubtful"]
    bases = sorted({a["base_id"] for a in good})
    res = {"bases": bases, "row": False, "mint": False, "holds": [], "no_mint": []}
    if not good:
        res["holds"].append("doubtful anchors only" if doubt else "no anchor")
        return res
    if x in bases and "base_outside" not in drop:
        res["holds"].append("an anchor's base course sits in the Honors id itself: a split comes before any row")
    ms = members.get(x) or []
    anchored = {(a["college"], a["honors_code"]) for a in xa}
    hon = sum(1 for m in ms if honors_word(m["title"], drop) or (m["college"], m["code"]) in anchored)
    if ms and hon * 2 <= len(ms) and "mostly_honors" not in drop:
        res["holds"].append(f"the id is mostly not Honors courses ({hon} of {len(ms)}): it is not an Honors M-ID, and "
                            "a row would hold its other courses apart from the base")
    if len(bases) > 1 and "split" not in drop:
        res["holds"].append("anchors split: " + ", ".join(bases))
    if doubt and "doubtful_holds" not in drop:
        res["holds"].append("a doubtful anchor (an Honors number pair whose titles disagree): " + "; ".join(
            f"{a['college']} {a['honors_code']} '{a['honors_title']}' beside {a['base_code']} '{a['base_title']}'"
            for a in doubt[:2]))
    b = bases[0]
    res["base"] = b
    ccn = sorted({m["code"] for m in members.get(b) or [] if CCN_CODE.match(" ".join(m["code"].split()))})
    if ccn and is_official(b) and "ccn" not in drop:
        # An official base mints nothing, so its row is the whole step: rule 3's CCN clause holds the row itself
        # (MATH 210 holds MATH C2210 and C2210H; #3315's fourth review, finding 3).
        res["holds"].append(f"the official base holds a CCN-coded course ({', '.join(ccn[:3])}): the CCN record is "
                            "the gold standard")
    if res["holds"]:
        return res
    res["row"] = True
    anchored_codes = {(a["college"], a["honors_code"]) for a in good}
    loose = [m for m in members.get(x) or [] if (m["college"], m["code"]) not in anchored_codes]
    if loose and "all_members_anchored" not in drop:
        res["no_mint"].append(f"{len(loose)} member course(s) of the Honors id are not the Honors course of an anchor: "
                              + "; ".join(f"{m['college']} {m['code']}" for m in loose[:3]))
    peers = sorted(anchored_into.get(b, ()))
    if len(peers) > 1 and "one_honors_per_base" not in drop:
        res["no_mint"].append(f"the base has {len(peers)} Honors M-IDs anchored into it: {', '.join(peers[:4])}")
    if ccn and "ccn" not in drop:
        res["no_mint"].append(f"the base holds a CCN-coded course ({', '.join(ccn[:3])}): the CCN record is the gold "
                              "standard")
    extra = sorted(set(other_bases) - {b})
    if extra and "multi_base" not in drop:
        res["no_mint"].append("another derivation names a second base: " + ", ".join(extra[:3]))
    flags = (split_of(b) if split_of else []) if not is_official(b) else []
    if flags and "split_candidate" not in drop:
        # The row stands on its anchors. The mint names the Honors id after a base that may itself be split or
        # re-minted, and that rewiring is the costly part, so the mint waits for the split (COBIx's Q1 on #3315).
        res["no_mint"].append("the base is a split candidate (" + "; ".join(flags[:2]) + "): the mint waits for the "
                              "split")
    if is_official(b):
        res["no_mint"].append("an official base: C-ID and CCN number their own records, so no H id is minted")
    res["mint"] = not res["no_mint"]
    return res
