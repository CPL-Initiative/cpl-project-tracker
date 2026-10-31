#!/usr/bin/env python3
"""Score a program requirements record against the state's closed course list.

The program requirements harvest (docs/reference/lanes/program-requirements-harvest.md)
tests every record before anything reads it. The plan (Sam's Claude Doc, section
"Testing against the catalog") names four checks; three run without a person,
because the Data Mart Program Course File (coci_program_courses) names every
course the program lists, and Sam's review added a structural one:

  coverage       the listed courses the record places in a block, out of all
                 of them. Bar: 100%, or each missing course explained, and at
                 least one placed (a record placing none read other text).
  invented       courses the record places that the list lacks. Bar: 0, or
                 each one flagged as a catalog addition.
  arithmetic     required units plus each block's minimum plus open electives,
                 against the catalog's stated total. Bar: equal.
  repeated       a course placed twice in one block. Bar: none. Sam's review of
                 the 20 pilot records (2026-10-04, card 5) ruled Mt. San Antonio
                 Fire's elective block, which listed FIRE 86 twice, a fix; a
                 repeat inflates a choose block's options and double-counts an
                 all-required block, so the scorer now refuses it.

  outcomes       every program and course outcome the record carries appears
                 in the catalog text word for word. Bar: none reworded. Sam's
                 sheet 33 card 4 (2026-10-04, as proposed): record shape
                 version 3 keeps outcomes exactly as printed, and the scorer
                 checks they are verbatim. A page that prints an outcomes
                 heading while the record carries none is reported
                 (heading_without_outcomes) but does not fail: Mt. San Antonio
                 prints the heading over a tab the capture never opens, so the
                 gap is the reading procedure's, not the record's.

The plan's fourth, agreement with a person, is Sam's reading of the same 20
programs: on 2026-10-04 he passed 18 as matching the catalog and ruled two fixes
(kb/program_requirements_pilot/review_2026-10-04.json).

THE RECORD, version 2 (one per program per catalog year; the extractor writes it):

    {"program": {"measure": "units" | "hours",
                 "total_units": 30.5 | {"min": 27, "max": 29} | null,
                 "open_elective_units": 0, ...},
     "blocks": [{"name": "Required Courses",
                 "rule": "all" | "choose_courses" | "choose_units" | "recommended",
                 "minimum": null | number,       # N courses or N units
                 "option_group": null | "Option",  # blocks sharing one are alternatives
                 "stated": {"min": 6, "max": 22},  # the block total the catalog prints
                 "courses": [{"code": "CUL 36", "units": 8.5, "units_max": null,
                              "alternatives": [{"code": "CUL 36H", "units": 8.5,
                                                "catalog_addition": false}],
                              "catalog_addition": false}]}]}

A course with alternatives (an honors pair, "MATH 1 or MATH 1H") counts as one
choice whose units run from its smallest option to its largest; a course
printed with a range ("MICR 1 4-5") runs from units to units_max. Units come
from the record first (the catalog's own number) and the closed list second.
Version 1 wrote alternatives as bare codes; the scorer still reads them, and a
bare code takes its parent's catalog_addition.

Extraction run 1 (37167619551, 7 of 16 passed) named what version 1 could not
hold, and version 2 adds one field for each:
  measure        a noncredit program states hours, not units (Cerritos Energy
                 Corps, Riverside Food Service). With hours, course "units"
                 hold hours and the closed list's 0 units are never used.
  option_group   the student completes one of several whole blocks (Cerritos
                 Ironworker: Reinforcing or Structural). The group runs from
                 its smallest block to its largest.
  stated         the block total the catalog prints ("6-22 units", List B
                 "6-7"). It stands for the block when a course's units are
                 missing or the rule picks units.
  units_max      the top of a range printed beside a course.

Version 3 (S334) adds the outcomes, which no check above reads:
  program.outcomes   each program or student learning outcome the catalog
                     prints for the award, as printed, one string each.
  course_outcomes    [{"code": "CUL 36", "outcomes": [...]}] for outcomes the
                     text prints under a single course.
Versions 1 and 2 carry neither, and their outcomes check passes with nothing
to read. requirements_md5() fingerprints everything but the outcomes, so a
person's reading follows the requirements it read
(kb/program_requirements_pilot/reviewed_readings.json).

Version 5 (S389; Sam, Open Asks Sheet 78 card 2, 2026-10-14, "Record both
figures") reads a page that prints the degree total with general education and
no total for the major (Palo Verde's Automotive Technology A.S.: Total 64 - 68 =
a 24-unit core, 6 units of electives and CalGETC 34 - 38; Cabrillo's
"Complete the following number of credits: 60"). Before it, 79 records at the
two colleges failed arithmetic as "incomplete" though their pages add up:
  program.degree_total   the total the page prints for the whole award with
                         general education in it, as printed, never computed.
  program.ge_units       the units the page prints for its general education
                         pattern (CalGETC 34 - 38, Cabrillo College General
                         Education 24).
  program.electives_fill_degree
                         true when the page says electives make up the rest of
                         the degree total and prints no figure for them
                         (Psychology AA-T: "Total 60" = a 19-21-unit major,
                         CalGETC 34-38 and transferable electives).
When the record carries no major total and does carry a degree total, the check
adds the blocks, the open electives and the general education units against
the degree total (arithmetic "against": "degree"). With electives filling the
rest, it passes when every end of that sum fits under the degree total, and
"fill" names the units the electives make up. A major total, when printed, is
still the one checked ("against": "program").

Sam's Open Asks Sheet 81 (2026-10-14, both his own call) counts two more such
records as adding up, each "equal" with a field that says how:
  card 1, "Count it"   the degree total sits inside the span the blocks, open
                       electives and general education allow (Cabrillo prints
                       general electives as a range that takes up the rest of
                       60; the record keeps them as one number, so the sum reads
                       57-60 against 60): "within": true.
  card 2, "adt"        an associate degree for transfer whose page prints its
                       total and no electives: 60 units by statute (Ed. Code
                       66746(a)), with transferable electives making up what the
                       major and general education leave, so every end of the
                       sum must fit under the total: "transfer": true and "fill".
degree_verdict() holds both, and kb/_program_requirements_rescore.py applies it
to the records already filed.

When the catalog prints no figure at all (Mt. San Antonio's Vocational Nursing
names no hours, no units and no total), there is nothing to add. Arithmetic is
then "unstated", and it passes only when all three hold: the record carries no
figure, the closed list stores no units (a noncredit program's 0s), and the
catalog text names no hours or units. A reader that drops printed hours still
fails, and so does a credit record with no total, because the state file holds
its units.

Pure: no network, no model. Tested by tests/program_requirements_pilot_test.py.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _program_requirements_pilot import norm_code  # noqa: E402

TOL = 0.01


def _num(v) -> float | None:
    try:
        return None if v is None else float(v)
    except (TypeError, ValueError):
        return None


def _span(total) -> tuple[float, float] | None:
    if isinstance(total, dict):
        lo, hi = _num(total.get("min")), _num(total.get("max"))
        if lo is None and hi is None:
            return None
        return (lo if lo is not None else hi, hi if hi is not None else lo)
    v = _num(total)
    return None if v is None else (v, v)


# A figure of hours or units printed in catalog text ("136 Hours", "4.5-9 hours",
# "6 units"). Used only to confirm that a page states no figure at all.
FIGURE = re.compile(r"\b\d+(?:\.\d+)?(?:\s*[-\u2013]\s*\d+(?:\.\d+)?)?\s*(?:hours?|hrs?|units?)\b", re.I)


def alternatives(course: dict) -> list[dict]:
    """A course's alternatives as objects. Version 1 wrote bare codes; a bare
    code carries no units and takes its parent's catalog_addition."""
    out = []
    for a in course.get("alternatives") or []:
        if isinstance(a, dict):
            if a.get("code"):
                out.append(a)
        elif a:
            out.append({"code": a, "units": None,
                        "catalog_addition": bool(course.get("catalog_addition"))})
    return out


def listed_key(code: str | None, listed: dict) -> str:
    """A placed code's key in the closed list: its normal form, or the listed code it
    names once a subject's slash is set aside. The state's file stores some slashed
    subjects without the slash (Crafton Hills' CNAN633, which its page prints CNA/N 633,
    S413), and the two would read as one course missing and another invented. Others
    it stores with the letters after the slash dropped (THART124X2 for the page's
    THART/S 124X2, S414); that reading is tried only when the first finds none."""
    k = norm_code(code)
    if k in listed or "/" not in k:
        return k
    bare = k.replace("/", "")
    for lk in listed:
        if lk.replace("/", "") == bare:
            return lk
    m = re.match(r"([A-Z&]+)/[A-Z]+(\d.*)$", k)
    if m and m.group(1) + m.group(2) in listed:
        return m.group(1) + m.group(2)
    return k


def with_prefix_aliases(record: dict, listed: dict, aliases: dict | None) -> dict:
    """The record with each code the state's file lists only under another subject prefix
    named by it (San Joaquin Delta, S422: the catalog prints ANTH 2L, ENGL 35, ARTH 2 and
    COMM 7 where the file keeps ANTHR 2L, ENG 35, ART 2 and COM ST 7, same number and title).
    aliases maps the page's prefix to the file's, one college's at a time
    (kb/program_requirements_reconcile.json, prefix_aliases); a code the file lists as
    printed is never renamed."""
    if not aliases:
        return record
    table = {norm_code(k): norm_code(v) for k, v in aliases.items()}
    # A key naming a whole course (it has a digit) is a renumbered course: Merced prints
    # MECH22A Diesel Engines 4 where the file lists AGMA 11 Diesel Engines 4 (S423).
    courses = {k: v for k, v in table.items() if re.search(r"\d", k)}

    def rename(entry: dict) -> None:
        k = norm_code(entry.get("code"))
        if not k or k in listed:
            return
        if k in courses and courses[k] in listed:
            entry["code"] = courses[k]
            entry["printed_code"] = k
            return
        m = re.match(r"([A-Z&]+)(\d.*)$", k)
        if m and m.group(1) in table and table[m.group(1)] + m.group(2) in listed:
            entry["code"] = table[m.group(1)] + m.group(2)
            entry["printed_code"] = k

    out = json.loads(json.dumps(record))
    for b in out.get("blocks") or []:
        for c in b.get("courses") or []:
            rename(c)
            for a in c.get("alternatives") or []:
                if isinstance(a, dict):
                    rename(a)
    return out


def placed_codes(record: dict) -> list[tuple[str, dict, dict]]:
    """(normalized code, the entry naming it, block) for every code the record
    places, alternatives included. The entry carries that code's own
    catalog_addition."""
    out = []
    for b in record.get("blocks") or []:
        for c in b.get("courses") or []:
            for entry in [c] + alternatives(c):
                if entry.get("code"):
                    out.append((norm_code(entry["code"]), entry, b))
    return out


def measure(record: dict) -> str:
    return (record.get("program") or {}).get("measure") or "units"


def choice_units(course: dict, listed: dict, hours: bool = False) -> tuple[float, float] | None:
    """The units one choice carries: the record's own number (and the top of a
    printed range), else the closed list's; an alternatives group runs from its
    smallest option to its largest. In hours, the closed list is never read."""
    vals = []
    for entry in [course] + alternatives(course):
        # A course the page says is taken more than once ("If MUS 11 is chosen, it must be taken
        # for 2 semesters", Hartnell's Music 43887, S497) carries times: its units count that often.
        times = _num(entry.get("times")) or 1
        own = [v * times for v in (_num(entry.get("units")), _num(entry.get("units_max"))) if v is not None]
        if _num(entry.get("units_total")) is not None:
            # The page prints the repeats' sum ("four times in CAT 69V for a total of 16 units", Delta 44197,
            # S498): that figure, never the course's range times the count.
            own = [_num(entry["units_total"])]
        if own:
            vals += own
        elif not hours:
            u = listed.get(listed_key(entry.get("code"), listed))
            if u is not None:
                vals.append(u * times)
    if not vals:
        return None
    return (min(vals), max(vals))


def block_units(block: dict, listed: dict, hours: bool = False
                ) -> tuple[tuple[float, float] | None, list[str]]:
    """The units a block contributes to the program, and why it could not be
    computed when it cannot. A choose-courses list's printed units are its floor,
    never its ceiling (Sam, Open Asks Sheet 144 card 2 "floor", 2026-10-30): each end
    is the larger of what the courses add to and what the list prints, and the
    printed figure stands alone where the courses cannot be added. Before it, a
    list printing "Select one course (5 units)" over a 3-unit course carried the
    program's low end under the page; with it in place of the courses, a list
    printing "Select two courses (6 units)" over courses of 6 to 7 dropped the top
    the program's own total carries (S529 read the 44 that reading unpassed)."""
    span, why = block_units_summed(block, listed, hours)
    stated = _span(block.get("stated"))
    if block.get("rule") == "choose_courses" and stated:
        return ((max(span[0], stated[0]), max(span[1], stated[1])) if span else stated), []
    return span, why


def block_units_summed(block: dict, listed: dict, hours: bool = False
                       ) -> tuple[tuple[float, float] | None, list[str]]:
    """block_units before the printed floor: what the block's courses add to. The
    block total the catalog prints stands in when a course's units are missing or
    the rule picks units. kb/_program_requirements_floor_rescore.py reads it to
    find the records the floor moves."""
    rule, minimum = block.get("rule"), _num(block.get("minimum"))
    # Courses the catalog recommends count toward nothing (Sam's rule 4, 2026-10-11:
    # "The recommended Electives should be added with blocks").
    if rule == "recommended":
        return (0.0, 0.0), []
    stated = _span(block.get("stated"))
    spans = [choice_units(c, listed, hours) for c in block.get("courses") or []]
    if rule == "all":
        if any(s is None for s in spans):
            if stated:
                return stated, []
            return None, ["a required course in '%s' has no units" % block.get("name")]
        return (sum(s[0] for s in spans), sum(s[1] for s in spans)), []
    if rule == "choose_units":
        if stated:
            return stated, []
        if minimum is None:
            return None, ["'%s' chooses units but names no minimum" % block.get("name")]
        return (minimum, minimum), []
    if rule == "choose_courses":
        if minimum is None:
            return None, ["'%s' chooses courses but names no minimum" % block.get("name")]
        known = [s for s in spans if s is not None]
        n = int(minimum)
        if len(known) < len(spans) and stated:
            return stated, []
        if len(known) < n:
            return None, ["'%s' chooses %d courses but %d carry units"
                          % (block.get("name"), n, len(known))]
        if block.get("repeats"):
            # n enrollments from a list a student may repeat ("2 semesters of any of the following
            # Courses", Music 43887, S497): the least course n times, the largest n times.
            if not known:
                return None, ["'%s' chooses %d courses but none carries units" % (block.get("name"), n)]
            return (min(s[0] for s in known) * n, max(s[1] for s in known) * n), []
        lows = sorted(s[0] for s in known)[:n]
        # A count printed as a range ("COMPLETE 3-4 COURSES FROM THE FOLLOWING", Los Angeles Valley's
        # French 02965, S534) keeps its top as maximum: the high end takes that many.
        top = max(n, int(_num(block.get("maximum")) or n))
        highs = sorted((s[1] for s in known), reverse=True)[:top]
        return (sum(lows), sum(highs)), []
    return None, ["'%s' has no rule the scorer knows (%r)" % (block.get("name"), rule)]


def program_units(record: dict, listed: dict) -> tuple[tuple[float, float], list[str]]:
    """Every block's units summed; the blocks of one option_group count once,
    from the group's smallest block to its largest."""
    hours = measure(record) == "hours"
    lo = hi = 0.0
    reasons: list[str] = []
    groups: dict[str, list[tuple[float, float]]] = {}
    for b in record.get("blocks") or []:
        span, why = block_units(b, listed, hours)
        if span is None:
            reasons += why
            continue
        g = b.get("option_group")
        if g:
            groups.setdefault(g, []).append(span)
        else:
            lo += span[0]
            hi += span[1]
    for spans in groups.values():
        lo += min(s[0] for s in spans)
        hi += max(s[1] for s in spans)
    # A list the page says completes the program to a total ("3-5 UNITS CHOSEN FROM THE FOLLOWING FOR
    # A MINIMUM OF 18 UNITS", "COMPLETE 7-14 UNITS FROM THE FOLLOWING COURSES TO COMPLETE 36 TOTAL UNITS",
    # Los Angeles Valley, S534) carries fills_to: a student takes from it until the sum reaches that
    # figure, so neither end falls below it.
    fills = [_num(b.get("fills_to")) for b in record.get("blocks") or [] if _num(b.get("fills_to"))]
    if fills and not reasons:
        lo, hi = max(lo, max(fills)), max(hi, max(fills))
    return (lo, hi), reasons


def has_figure(record: dict) -> bool:
    """Whether the record carries any number to add: a total, a block total,
    or a course's units."""
    prog = record.get("program") or {}
    if (_span(prog.get("total_units")) or _num(prog.get("open_elective_units"))
            or _span(prog.get("degree_total")) or _span(prog.get("ge_units"))):
        return True
    for b in record.get("blocks") or []:
        if _span(b.get("stated")) or (b.get("rule") == "choose_units" and _num(b.get("minimum"))):
            return True
        for c in b.get("courses") or []:
            for entry in [c] + alternatives(c):
                if _num(entry.get("units")) or _num(entry.get("units_max")):
                    return True
    return False


def repeated(record: dict) -> list[str]:
    """Codes placed more than once inside one block, alternatives included.
    The same course in two blocks is legitimate (Miramar Entrepreneurship's
    BUSE 155 sits in the required list and both elective lists)."""
    out = []
    for b in record.get("blocks") or []:
        seen: dict[str, int] = {}
        for c in b.get("courses") or []:
            for entry in [c] + alternatives(c):
                k = norm_code(entry.get("code"))
                if k:
                    seen[k] = seen.get(k, 0) + 1
        out += ["%s in '%s'" % (k, b.get("name")) for k, n in seen.items() if n > 1]
    return out


# ── Outcomes (record shape v3) ───────────────────────────────────────────────
# A catalog's outcomes heading: "Program Learning Outcomes", "Program Student
# Learning Outcomes", "Student Learning Outcomes", "Program Outcomes", and
# Miramar's "Learning Outcome(s):" (the form S327's count of 13 of 20 missed).
OUTCOMES_HEADING = re.compile(
    r"\b(?:program\s+(?:student\s+)?learning|student\s+learning|program|learning)\s+outcome(?:s\b|\(s\)|\b)",
    re.I)

# Glyph forms a reader cannot see as a different word: curly and straight
# quotes, dashes, a soft hyphen. Folded on both sides before comparing; the
# words, spelling, capitals and punctuation marks themselves must match.
_FOLD = str.maketrans({"‘": "'", "’": "'", "“": '"', "”": '"',
                       "–": "-", "—": "-", " ": " ", "­": None})


_LIGATURES = {"Ɵ": "ti", "Ʃ": "tt", "Ō": "ft", "ﬁ": "fi", "ﬂ": "fl", "ﬀ": "ff", "ﬃ": "ffi", "ﬄ": "ffl"}
_LIGATURE = re.compile("[%s]" % "".join(_LIGATURES))
_UNSPACED = "\x00"   # marks the reading with no spaces
_SPACED_LETTERS = re.compile(r"(?:\b\w \b){5,}\w\b")   # "T h i s  d e g r e e"
_SPACED_PUNCT = re.compile(r"\w [;,:](?= |$)")         # "occupations ;"
_LINE_END_MARKER = re.compile(r"[ \t]+(?:\d{1,2}\.|[a-z]\))[ \t]*(?=\n|$)")


def _flat(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").translate(_FOLD)).strip()


def _readings(text: str) -> list[str]:
    """The catalog text flattened, plus the two ways a PDF's line-end hyphen
    reads ("self-\\nemployed" as "self-employed" and as "selfemployed"), so an
    outcome copied across a line break still matches."""
    flat = _flat(text)
    # East LA's PDF breaks a word with a hyphen spaced on both sides ("tech - nicians",
    # "profe - sional"); 82 of its 120 records failed the outcomes check on that (run 39011319511).
    readings = [flat, re.sub(r"(\w)- (\w)", r"\1-\2", flat), re.sub(r"(\w)- (\w)", r"\1\2", flat),
                re.sub(r"(\w) - (\w)", r"\1\2", flat)]
    # Solano's PDF prints its ligatures as stand-in glyphs with a space beside them ("IntroducƟ on",
    # "draŌ  landscape plan", "Iden Ɵ ﬁ caƟ on"); 135 of its 162 records failed the outcomes check on that
    # (run 39035226783; page read 39036135577). Which space is the word's own cannot be told ("draŌ  landscape",
    # "aŌ er"), so such text gets one more reading: the ligatures spelled out and every space dropped, which
    # outcomes_check compares with the outcome's own letters, spaces dropped too.
    # Glendale's PDF (S505) breaks a word after a ligature and at a line end in one sentence ("Fulﬁ ll
    # requirements for transfer to a col-\nlege"), spaces a line letter by letter ("b e  a b l e  t o"),
    # and spaces a semicolon from its word ("occupations ;"); 54 of its records failed the outcomes check.
    # The same no-space reading serves all three, and it is read once more with the line-end hyphens joined.
    if _LIGATURE.search(flat) or _SPACED_LETTERS.search(flat) or _SPACED_PUNCT.search(flat):
        spelled = _LIGATURE.sub(lambda m: _LIGATURES[m.group(0)], flat)
        readings.append(_UNSPACED + re.sub(r"\s", "", spelled))
        readings.append(_UNSPACED + re.sub(r"\s", "", re.sub(r"(\w)- (\w)", r"\1\2", spelled)))
    # Ohlone's PDF prints a numbered outcome's number at the end of its first line ("Demonstrate knowledge
    # of real estate listings, deposit receipts, escrows, 2.\nand financing."); 125 of its 146 records failed
    # the outcomes check on that (run 39061732843; page read 39062425296). One more reading drops a list
    # marker printed at a line's end.
    unmarked = _flat(_LINE_END_MARKER.sub("", text or ""))
    if unmarked != flat:
        readings.append(unmarked)
    return readings


def outcome_entries(record: dict) -> list[tuple[str | None, str]]:
    """(course code or None for the program, outcome) for every outcome the
    record carries. Versions 1 and 2 carry none."""
    out = [(None, o) for o in ((record.get("program") or {}).get("outcomes") or [])]
    for c in record.get("course_outcomes") or []:
        out += [(c.get("code"), o) for o in (c.get("outcomes") or [])]
    return out


def outcomes_check(record: dict, text: str | None) -> dict:
    entries = outcome_entries(record)
    heading = bool(OUTCOMES_HEADING.search(text or ""))
    if text is None:
        bad = [o for _, o in entries]
        why = ["no catalog text came to check the outcomes against"] if bad else []
    else:
        readings = _readings(text)
        bad, why = [], []
        for code, o in entries:
            f = _flat(o if isinstance(o, str) else "")
            if not f:
                bad.append(o)
                why.append("an empty outcome%s" % (" under %s" % code if code else ""))
            elif not any((re.sub(r"\s", "", f) if r.startswith(_UNSPACED) else f) in r for r in readings):
                bad.append(o)
                why.append("not in the catalog text as printed%s: %s"
                           % (" (%s)" % code if code else "", f[:80]))
    program_n = len((record.get("program") or {}).get("outcomes") or [])
    return {"program": program_n,
            "courses": len([c for c in record.get("course_outcomes") or [] if c.get("outcomes")]),
            "count": len(entries), "not_verbatim": bad, "why": why,
            "heading_printed": heading, "heading_without_outcomes": heading and not program_n,
            "pass": not bad}


def requirements_md5(record: dict) -> str:
    """A fingerprint of the requirements a person reads (the program's figures
    and every block), leaving out the outcomes and the careers, which the
    scorer checks word for word. A rerun that changes the requirements changes
    it; one that only adds outcomes or careers does not. The server's
    program_record_fp (chatbox/supabase_program_record_verdicts.sql) leaves out
    the same two."""
    program = {k: v for k, v in (record.get("program") or {}).items() if k not in ("outcomes", "careers")}
    body = {"program": program, "blocks": record.get("blocks") or []}
    return hashlib.md5(json.dumps(body, sort_keys=True, ensure_ascii=False,
                                  separators=(",", ":")).encode()).hexdigest()


def careers_check(record: dict, text: str | None) -> dict:
    """Each career the record keeps (record shape v4, Sam's rule 5) must appear in
    the catalog text as printed, as an outcome must. Reported beside the checks;
    it holds no record back."""
    careers = [c for c in ((record.get("program") or {}).get("careers") or [])]
    if text is None:
        return {"count": len(careers), "not_verbatim": list(careers), "pass": not careers}
    readings = [r.lower() for r in _readings(text)]
    bad = [c for c in careers if not _flat(c if isinstance(c, str) else "") or
           not any(_flat(c).lower() in r for r in readings)]
    return {"count": len(careers), "not_verbatim": bad, "pass": not bad}


def places_none(score: dict | None) -> bool:
    """A scored record that places none of its program's listed courses: the model
    read another program's page or a course-description listing. Sam, Open Asks
    Sheet 62 card 1 (2026-10-11, "remove them"): such a record leaves the live
    table, and each program shows no record until its college's reading
    procedure finds its own page, so the load and the display build leave it out."""
    cov = (score or {}).get("coverage") or {}
    return bool(cov.get("listed")) and cov.get("placed") == 0


ELECTIVE = re.compile(r"\belectives?\b", re.I)
# An associate degree for transfer, by the state file's award ("A.A- T Degree",
# "A.S. T Degree") or the page's heading ("AA-T in Sociology for Transfer").
TRANSFER = re.compile(r"\bA\.?\s?[AS]\.?[-\s]*T\b|\bfor transfer\b", re.I)


# An associate degree by the state file's award ("A.S. Degree", "A.A- T Degree").
ASSOCIATE = re.compile(r"\bA\.?\s?[AS]\b\.?|\bassociate\b", re.I)


def degree_reading(record: dict, award: str | None) -> dict:
    """Whether an associate degree's record reads the degree or the major alone.
    Sam, 2026-10-14 (Cabrillo Biology 06328, Needs a fix): the record held the
    30-unit major, and the page prints the degree's 60, its general education 24
    and 6 units of electives. An associate degree carries at least 60 units
    (Title 5 section 55063), so a record naming no degree total and no general
    education units holds the major only; the display names it as the reading
    procedure's gap, with no person reading the record to find it."""
    if not ASSOCIATE.search(award or "") or re.search(r"baccalaureate|certificate", award or "", re.I):
        return {"status": "n/a"}
    prog = record.get("program") or {}
    if _span(prog.get("degree_total")) or _span(prog.get("ge_units")):
        return {"status": "read"}
    return {"status": "major only",
            "why": ["the record names no degree total and no general education units"]}


def transfer_degree(award: str | None, prog: dict) -> bool:
    return bool(TRANSFER.search(award or "") or TRANSFER.search(prog.get("section_heading") or ""))


def degree_verdict(prog: dict, degree: tuple[float, float], lo: float, hi: float,
                   award: str | None = None) -> dict:
    """How a sum of the blocks, open electives and general education (lo-hi)
    meets the degree total the page prints: pass, status, and how it passed."""
    if (transfer_degree(award, prog) or prog.get("ge_overlap")) and lo > degree[0] + TOL and hi > degree[1] + TOL:
        # Sheet 82 card 2 ("overlap", Sam, 2026-10-14): a course counts toward the major and
        # Cal-GETC both, so a transfer degree's sum runs past the total it prints. A local degree
        # whose page says the same ("Students can double-count required courses and courses for
        # General Education", Hartnell's nursing tabs, S486) carries ge_overlap from its reconcile step.
        return {"pass": True, "status": "equal", "overlap": True, "why": []}
    if prog.get("degree_total_minimum"):
        # The page prints the degree total as a floor (Cerritos: "Complete a minimum of 60 units to
        # include (1) the above major requirements, (2) the General Education requirements, and (3)
        # electives as needed"): electives make up a sum short of it, and a sum past it meets it.
        # A floor alone says as much (San Joaquin Delta, S415: "Minimum Degree Units Required: 60"
        # and no word for electives), so a short sum needs no electives_fill_degree beside it.
        short = [round(max(0.0, degree[0] - hi), 2), round(max(0.0, degree[0] - lo), 2)]
        return {"pass": True, "status": "equal", "minimum": True, "fill": short if short[1] > 0 else None, "why": []}
    fits = lo <= degree[0] + TOL and hi <= degree[1] + TOL
    fill = [round(max(0.0, degree[0] - hi), 2), round(max(0.0, degree[1] - lo), 2)]
    if prog.get("electives_fill_degree"):
        if not fits and abs(lo - degree[0]) <= TOL and hi > degree[1] + TOL:
            # S457 (Sheet 120 card 1 "narrow", Sam, 2026-10-23): the low end meets the total the
            # electives fill, and a choice or a variable-unit course carries the high end past it. A
            # student taking each choice at its least reaches the total; nothing is left to fill.
            return {"pass": True, "status": "equal", "meets": True, "fill": None, "why": []}
        return {"pass": fits, "status": "equal" if fits else "unequal", "fill": fill if fits else None,
                "why": [] if fits else ["the blocks and general education come to %s-%s, past the %s-%s the "
                                        "catalog prints for the degree" % (lo, hi, degree[0], degree[1])]}
    if abs(lo - degree[0]) <= TOL and abs(hi - degree[1]) <= TOL:
        return {"pass": True, "status": "equal", "why": []}
    if lo <= degree[0] + TOL and degree[1] <= hi + TOL:
        # Sheet 81 card 1: the printed total is one the requirements allow.
        return {"pass": True, "status": "equal", "within": True, "why": []}
    if fits and transfer_degree(award, prog) and not _num(prog.get("open_elective_units")):
        # Sheet 81 card 2: transferable electives make up a transfer degree's 60.
        return {"pass": True, "status": "equal", "transfer": True, "fill": fill, "why": []}
    return {"pass": False, "status": "unequal",
            "why": ["the blocks and general education sum to %s-%s; the catalog prints %s-%s "
                    "for the degree" % (lo, hi, degree[0], degree[1])]}


def program_verdict(prog: dict, stated: tuple[float, float], lo: float, hi: float) -> dict:
    """How the blocks' sum (lo-hi) meets the program total the page prints: pass,
    status and how. The rescorer reads it too (kb/_program_requirements_rescore.py),
    so it never re-adds the blocks."""
    if abs(lo - stated[0]) <= TOL and abs(hi - stated[1]) <= TOL:
        return {"pass": True, "status": "equal"}
    # The page prints the program total as a floor (San Joaquin Delta, S422: "Minimum Units
    # Required: 24", "Minimum Major Units Required: 18"): a one-unit alternative, a block printed
    # as a range or a variable-unit course carries the sum's high end past it, and the low end
    # meets it. Only the low end meeting the floor passes; a low end past it is still a misread.
    if prog.get("total_units_minimum") and abs(lo - stated[0]) <= TOL and hi >= stated[1] - TOL:
        return {"pass": True, "status": "equal", "minimum": True}
    # S457 (Sheet 120 card 1 "narrow", Sam, 2026-10-23): a printed total the requirements' low end
    # meets exactly, a choice or a variable-unit course carrying the high end past it (Hartnell's
    # ABT 99 at 1-8 units), passes as meets: the printed total is one the requirements allow, as
    # Sheet 81 card 1 reads a degree's span, and a student taking each choice at its least reaches
    # it. A low end short of or past the total stays a misread. Measured 2026-10-23: 258 program
    # totals and 9 electives-filled degrees read so; any total inside the span would pass 738.
    if abs(lo - stated[0]) <= TOL and hi > stated[1] + TOL:
        return {"pass": True, "status": "equal", "meets": True}
    return {"pass": False, "status": "unequal"}


def degree_check(prog: dict, degree: tuple[float, float], lo: float, hi: float,
                 reasons: list[str], text: str | None, award: str | None = None) -> dict:
    """The blocks, the open electives and the general education units against
    the degree total the page prints (record shape 5). A degree that names a
    general education pattern and no units for it cannot be added up."""
    ge = _span(prog.get("ge_units"))
    out = {"pass": False, "status": "incomplete", "computed": [round(lo, 2), round(hi, 2)],
           "stated": list(degree), "against": "degree", "ge": list(ge) if ge else None, "why": list(reasons)}
    if ge is None and prog.get("ge_pattern"):
        out["why"].append("the record names the degree total and the %s pattern, but no units for it"
                          % prog["ge_pattern"])
    if out["why"]:
        return out
    g = ge or (0.0, 0.0)
    lo, hi = round(lo + g[0], 2), round(hi + g[1], 2)
    out["computed"] = [lo, hi]
    if prog.get("electives_fill_degree") and text is not None and not ELECTIVE.search(text):
        out["why"] = ["the record says electives fill the degree total, but the catalog text names no electives"]
        return out
    out.update(degree_verdict(prog, degree, lo, hi, award))
    return out


# "Total Contact Hours: 288", "Hours: 54": an hours figure printed after its label.
HOURS_LABEL = re.compile(r"\b(Total\s+(?:Contact\s+)?)?Hours?\s*:\s*(\d+(?:\.\d+)?)", re.I)


def hours_total_only(record: dict, stated: tuple[float, float] | None, text: str | None) -> bool:
    """A noncredit program whose page prints its total hours and no hours for any course
    (San Joaquin Delta, S422: "Total Contact Hours: 288" and "Units: 0" beside each course):
    there is nothing to add, as 'unstated' passes a page with no figure. The record must carry
    no course or block figure, and every hours figure on the page must be a total equal to the
    one the record states, so a reading that dropped printed course hours still fails."""
    if measure(record) != "hours" or stated is None or not text or FIGURE.search(text):
        return False
    for b in record.get("blocks") or []:
        if _span(b.get("stated")):
            return False
        for c in b.get("courses") or []:
            for entry in [c] + alternatives(c):
                if _num(entry.get("units")) or _num(entry.get("units_max")):
                    return False
    labels = list(HOURS_LABEL.finditer(text))
    return bool(labels) and all(m.group(1) and abs(float(m.group(2)) - stated[0]) <= TOL for m in labels)


def score(record: dict, closed: list[dict], text: str | None = None, award: str | None = None,
          aliases: dict | None = None) -> dict:
    """The automatic bars. text is the catalog text the record was read
    from; without it a record that states no figure cannot pass. award is the
    state file's award, which names an associate degree for transfer. aliases is the
    college's prefix_aliases (with_prefix_aliases)."""
    listed = {}
    for c in closed:
        k = norm_code(c.get("code"))
        if k:
            listed[k] = _num(c.get("units"))
    record = with_prefix_aliases(record, listed, aliases)
    placed = [(listed_key(e.get("code"), listed), e, b) for _, e, b in placed_codes(record)]
    placed_keys = {k for k, _, _ in placed}

    missing = sorted(k for k in listed if k not in placed_keys)
    explained = {norm_code(m.get("code")): m.get("why")
                 for m in record.get("missing_explained") or [] if m.get("code")}
    unexplained = [k for k in missing if not explained.get(k)]

    invented = sorted({k for k, c, _ in placed if k not in listed})
    flagged = sorted({k for k, c, _ in placed
                      if k not in listed and c.get("catalog_addition")})
    unflagged = [k for k in invented if k not in flagged]

    (lo, hi), reasons = program_units(record, listed)
    prog = record.get("program") or {}
    oe = _num(prog.get("open_elective_units")) or 0.0
    lo, hi = lo + oe, hi + oe
    stated = _span(prog.get("total_units"))
    degree = _span(prog.get("degree_total"))
    de = _span(prog.get("degree_elective_units")) or (0.0, 0.0)
    if stated is None and degree is not None:
        arith = degree_check(prog, degree, lo + de[0], hi + de[1], reasons, text, award)
    elif stated is None and not has_figure(record) and not any(listed.values()):
        figures = [m.group(0) for m in FIGURE.finditer(text or "")]
        ok = text is not None and not figures
        arith = {"pass": ok, "status": "unstated", "computed": None, "stated": None, "against": None,
                 "why": ["the catalog prints no total, no hours and no units"] if ok else
                        ["the record states no figure, but the catalog text names %s"
                         % ", ".join(figures[:4])] if figures else
                        ["the record states no figure, and no catalog text came to check it against"]}
    elif stated is None:
        arith = {"pass": False, "status": "incomplete", "computed": [lo, hi], "stated": None,
                 "against": None, "why": reasons + ["the record names no total"]}
    elif reasons and hours_total_only(record, stated, text):
        arith = {"pass": True, "status": "equal", "total_only": True, "computed": None, "stated": list(stated),
                 "against": "program", "why": []}
    elif reasons:
        arith = {"pass": False, "status": "incomplete", "computed": [lo, hi],
                 "stated": list(stated), "against": "program", "why": reasons}
    else:
        pv = program_verdict(prog, stated, lo, hi)
        ok = pv["pass"]
        # A certificate whose printed total includes the general education units it names
        # (San Joaquin Delta 05630, S424: "Minimum Units Required: 51" over a 35-unit major and
        # "16 units of courses from the ... General Education Pattern areas", recorded in
        # ge_units): the record carries no degree total, so the degree check never adds them.
        ge = _span(prog.get("ge_units")) if degree is None else None
        ge_included = (not ok and ge is not None
                       and abs(lo + ge[0] - stated[0]) <= TOL and abs(hi + ge[1] - stated[1]) <= TOL)
        # A certificate whose page says electives make up its total (San Joaquin Delta 11970,
        # S424: "Complete elective units to meet the minimum 60 unit requirement for this
        # certificate", electives_fill_degree on a record with no degree total): a sum short of
        # the total passes with the fill named, as degree_verdict reads a degree's. The same
        # guard: a text naming no electives keeps the record failing.
        fill = None
        if (not ok and not ge_included and degree is None and prog.get("electives_fill_degree")
                and hi <= stated[0] + TOL and (text is None or ELECTIVE.search(text))):
            fill = [round(stated[0] - hi, 2), round(stated[1] - lo, 2)]
        ok = ok or ge_included or fill is not None
        arith = {"pass": ok, "status": "equal" if ok else "unequal",
                 "computed": [round(lo, 2), round(hi, 2)], "stated": list(stated), "against": "program",
                 "why": [] if ok else ["the blocks sum to %s-%s; the catalog states %s-%s"
                                       % (round(lo, 2), round(hi, 2), stated[0], stated[1])]}
        if pv.get("minimum"):
            arith["minimum"] = True
        if pv.get("meets"):
            arith["meets"] = True
        if ge_included:
            arith["ge_included"] = list(ge)
            arith["computed"] = [round(lo + ge[0], 2), round(hi + ge[1], 2)]
        if fill is not None:
            arith["fill"] = fill
        if degree is not None:
            # Record shape 6: a page printing the major's total and the degree's checks both,
            # and the record names the one it misses (the major first).
            deg = degree_check(prog, degree, lo + de[0], hi + de[1], [], text, award)
            arith = dict(arith, degree=deg) if not ok or deg["pass"] else dict(deg, major=arith)

    rep_codes = repeated(record)
    outs = outcomes_check(record, text)
    n = len(listed)
    # A record that places none of the listed courses read some other text:
    # explaining every course away is no reading of the program. Long Beach
    # City's capture gave the model a hidden course index, and 89 records with
    # no block passed on "appears only in the course index" (S362).
    none_placed = bool(n) and len(missing) == n
    cov_ok = not unexplained and not none_placed
    return {
        "measure": measure(record),
        "coverage": {"placed": n - len(missing), "listed": n,
                     "share": round((n - len(missing)) / n, 3) if n else None,
                     "missing": missing, "unexplained": unexplained,
                     "none_placed": none_placed,
                     "pass": cov_ok},
        "invented": {"count": len(invented), "codes": invented, "flagged": flagged,
                     "pass": not unflagged},
        "arithmetic": arith,
        "repeated": {"codes": rep_codes, "pass": not rep_codes},
        "outcomes": outs,
        "careers": careers_check(record, text),
        "degree": degree_reading(record, award),
        "pass": (cov_ok and not unflagged and arith["pass"] and not rep_codes
                 and outs["pass"]),
    }
