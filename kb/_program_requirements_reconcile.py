#!/usr/bin/env python3
"""Reconcile a program record with its page text: a second search after extraction.

Sam, 2026-10-14, after marking Cabrillo's Biology A.S. (06328) Needs a fix
("missing the Cabrillo College General Education credits required: 24 and the 6
units of Elective. Both are noted on the catalog."):

    "I'm thinking to just use the confirm process to find gaps in our procedures
    and as we close those, I won't need the confirm step."
    "Seems like our procedure should attempt to close gaps by doing a secondary
    search of the catalog text to see if we can reconcile after the initial PR
    harvest."
    "we are configuring procedures for each catalog, right. So Cabrillo's
    procedure might require steps that others do not."

So each college's reading procedure may carry reconcile steps
(kb/program_requirements_reconcile.json): after the model reads a page, each step
searches the same text for a figure the record lacks and fills it, and every
change names the words it came from. A step never overwrites a figure the reading
holds, except the one kind that says which words the reading took a figure from
(clear_minimum: "at least 30 units in the major" is no major total). A set step
fills a figure the catalog prints once for every degree on another page (Cerritos's
general education units), where the program page's words point to it, and cites
both the page's words and the catalog page's.

It runs in two places, both free of model calls:
  * the extraction (kb/_program_requirements_college.py extract): every record a
    run reads is reconciled before it is scored;
  * a reconcile run (the same script's reconcile step, dispatched with
    step=reconcile): a capture reads the pages again, and each filed record with
    fresh text is reconciled and rescored. A record that changed is stamped with
    the run, so step=reread posts it.

Pure: no network. Tested by tests/program_requirements_pilot_test.py.
"""
from __future__ import annotations

import copy
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
STEPS = os.path.join(HERE, "program_requirements_reconcile.json")
ASSOCIATE = re.compile(r"\bA\.?\s?[AS]\b\.?|\bassociate\b", re.I)
# A transfer degree (AA-T, AS-T; COCI's "A.A- T Degree" and "A.S. T Degree"): Cal-GETC is
# its pattern, never a local degree's, and a local degree's captured page can span the
# sibling transfer section on the same page (Cañada, S421: six local degrees took the 34).
TRANSFER = re.compile(r"\bA\.?\s?[AS]\.?\s?-?\s?T\b|\bfor\s+transfer\b", re.I)


def load_steps(path: str = STEPS) -> dict:
    with open(path) as fh:
        return json.load(fh).get("colleges") or {}


def _num(s):
    return None if s is None else (int(float(s)) if float(s).is_integer() else float(s))


_COUNTS = {"two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "twice": 2}


def _count(s):
    """A repeat count as the page prints it: a figure or a word (Delta's "four times", S498)."""
    if s is None:
        return None
    return _COUNTS.get(s.strip().lower()) or _num(s)


def _empty(v) -> bool:
    if isinstance(v, dict):
        return v.get("min") is None and v.get("max") is None
    return v is None or v == 0


def _heading_end(text, heading):
    """Where the program's heading ends on the page, or None. Letters and digits only, case kept: the PDF
    prints 'COMPUTER SUPPORT TECHNICIAN · CERTIFICATE NON-DEGREE' and 'ADV ANCED ESL: ... PAT H WAY' for
    headings the reading gives plainly, and a description's mixed-case 'The Advanced ESL' is not one."""
    want = "".join(ch for ch in (heading or "") if ch.isalnum())
    if not want or not text:
        return None
    pos = [i for i, ch in enumerate(text) if ch.isalnum()]
    at = "".join(text[i] for i in pos).find(want)
    return None if at < 0 else pos[at + len(want) - 1] + 1


def _span_of(v):
    if isinstance(v, dict):
        return (v.get("min"), v.get("max") if v.get("max") is not None else v.get("min"))
    return (v, v)


def prefix_aliases(college: str, steps: dict | None = None) -> dict | None:
    """The college's subject prefixes as its catalog prints them, mapped to the state file's
    (the scorer's aliases; kb/_program_requirements_score.py with_prefix_aliases), and its
    renumbered courses, a whole printed code mapped to the file's (Merced's MECH22A for
    AGMA 11, S423). A key with a digit is a course; one without, a prefix."""
    conf = (steps if steps is not None else load_steps()).get(college) or {}
    out = dict(conf.get("prefix_aliases") or {})
    out.update(conf.get("course_renumbers") or {})
    return out or None


def packed_codes(college: str, steps: dict | None = None) -> bool:
    """Whether the college's catalog packs its course codes (De Anza's eLumen feed, S637-S638),
    so the scorer reads a filed record's packed code as the listed course it names."""
    conf = (steps if steps is not None else load_steps()).get(college) or {}
    return bool(conf.get("packed_codes"))


def numbers_after(college: str, steps: dict | None = None) -> bool:
    """Whether the college's catalog PDF prints each program's control number AFTER the program
    (Santiago Canyon, S645), so the PDF reader binds a program to the block that ends at its own
    number line (kb/_program_requirements_college.py pdf_best). Set by the college's entry alone,
    with the votes that are its evidence (pdf_numbers_after_votes); the reader's own count of the
    habit measures and never switches it (p-gate-free-text-reading-per-college-s644)."""
    conf = (steps if steps is not None else load_steps()).get(college) or {}
    return conf.get("pdf_numbers_after") is True


def course_renumbers(college: str, steps: dict | None = None) -> dict:
    """{the file's code, normalized: the catalog's code, its subject spaced from its number}:
    what the capture looks for on the page in place of a renumbered listed course. The space
    is load-bearing: code_pattern() reads "CPSC17" as letters C-P-S then "C17", which never
    matches the page's "CPSC-17" (Merced's Drone Technology and Equine pages, S423)."""
    from _program_requirements_pilot import norm_code
    conf = (steps if steps is not None else load_steps()).get(college) or {}
    return {norm_code(v): re.sub(r"^([A-Z&]+)(?=\d)", r"\1 ", norm_code(k))
            for k, v in (conf.get("course_renumbers") or {}).items()}


def awards_match(kind: str | None, award: str | None) -> bool:
    if not kind:
        return True
    if kind == "associate":
        return bool(ASSOCIATE.search(award or "")) and not re.search(r"baccalaureate|certificate", award or "", re.I)
    if kind == "transfer":
        return awards_match("associate", award) and bool(TRANSFER.search(award or ""))
    if kind == "local":
        return awards_match("associate", award) and not TRANSFER.search(award or "")
    if kind in ("local_aa", "local_as"):
        # A local degree by its letters (Las Positas, S634: LPC-GE asks an A.A. for two areas an
        # A.S. never takes), never a transfer degree.
        letter = "A" if kind == "local_aa" else "S"
        return (awards_match("local", award)
                and bool(re.search(r"\bA\.?\s?%s\b" % letter, award or "", re.I)))
    if kind == "noncredit":
        # A noncredit program by the state file's award ("Noncredit program", S644): the no-colon hours
        # total's flag reads these alone.
        return bool(re.search(r"\bnon-?\s?credit\b", award or "", re.I))
    return False


def fill_course_units(out: dict, units: dict) -> dict:
    """{code: [min, max]} for each course (and alternative) in the record whose units are
    empty and whose code the vendor's answer prices, filled in place."""
    from _program_requirements_pilot import norm_code
    filled = {}
    # A noncredit course carries 0 credit hours (Hartnell's BUS 650, run 39946676559): no units,
    # and a program measured in hours never takes a unit figure.
    if (out.get("program") or {}).get("measure") not in (None, "units"):
        return filled
    units = {k: v for k, v in units.items() if v and (v[0] or v[1])}
    for block in out.get("blocks") or []:
        for course in block.get("courses") or []:
            for entry in [course] + [a for a in course.get("alternatives") or [] if isinstance(a, dict)]:
                span = units.get(norm_code(entry.get("code")))
                if not span or entry.get("units") is not None or entry.get("units_max") is not None:
                    continue
                entry["units"] = span[0]
                if span[1] is not None and span[1] != span[0]:
                    entry["units_max"] = span[1]
                filled[entry["code"]] = list(span)
    return filled


def fill_course_hours(out: dict, hours: dict) -> dict:
    """{code: [min, max]} for each course (and alternative) in a record measured in hours whose
    figure is empty and whose code the vendor's answer gives hours, filled in place. In such a
    record a course's "units" hold its hours (the scorer's reading). A course takes the top of
    its range: the tab's "Non Credit - Total hours" sums the tops (ENGM620 144 and ENGM622 72 to
    216, page read 40273805437), the bottoms a shorter term."""
    from _program_requirements_pilot import norm_code
    filled = {}
    if (out.get("program") or {}).get("measure") != "hours":
        return filled
    hours = {k: v for k, v in hours.items() if v and (v[0] or v[1])}
    for block in out.get("blocks") or []:
        for course in block.get("courses") or []:
            for entry in [course] + [a for a in course.get("alternatives") or [] if isinstance(a, dict)]:
                span = hours.get(norm_code(entry.get("code")))
                if not span or entry.get("units") is not None or entry.get("units_max") is not None:
                    continue
                entry["units"] = span[1] if span[1] is not None else span[0]
                filled[entry["code"]] = entry["units"]
    return filled


def reconcile(record: dict, text: str | None, college: str, award: str | None = None,
              steps: dict | None = None, course_units: dict | None = None,
              course_hours: dict | None = None, title: str | None = None,
              siblings: list | None = None) -> tuple[dict, list[dict]]:
    """The record with the college's reconcile steps, then the statewide ones (statewide_cal_getc), applied to
    its page text, and a note per change: the field, what it was, what it is now, and the words. A college's own
    step runs first, so a figure its catalog prints is set before a statewide figure is asked for. title is the
    program's title and siblings the college's other filed programs ([{"control_number", "title",
    "section_heading"}]), which the statewide rule reads; without siblings it fills nothing."""
    out, notes = _college_steps(record, text, college, award, steps, course_units, course_hours)
    out, more = statewide_cal_getc(out, text, award, title=title, siblings=siblings)
    return (out, notes + more) if (notes or more) else (record, [])


# Sam, Open Asks Sheet 187 card 5, 13:19:50Z 2026-11-13, "Use 34 statewide" (cpl_memory
# sam-sheet-187-calgetc-34-statewide-2026-11-13): where a catalog names Cal-GETC and prints no unit figure, the
# record takes the statewide 34 units, named as its source. The rule fills only on positive evidence (the S644
# lesson, gate first; the conductor's direction after the review of #3244):
#   * the program: a transfer degree by its award, whose record's degree total is exactly 60 (the semester total
#     of an associate degree for transfer: a quarter-unit 90, Lake Tahoe, or a UC-transfer 72-75, Los Angeles
#     City 40232, is held), never a partial Cal-GETC (a "UCTP" or "UC Transfer" heading or title, or a Cal-GETC
#     line naming an Area, "one course" or "for STEM"), and never the legacy number of a pair that reads one
#     "2.0" section (calgetc_legacy_of);
#   * the record: Cal-GETC alone as its pattern (CAL_GETC_ONLY), no general education units;
#   * the section, from the record's heading to the next sibling program's heading (no siblings given: held,
#     since the words could be a later program's): a Cal-GETC name, no figure printed for it (calgetc_figure:
#     on the line, after a tab or colon, ending the line, in the cell below with or without a "Units:" label, or
#     alone on the line above; a footnote that does not repeat the name is not read), and no other pattern
#     (OTHER_GE_PATTERN, "Cal-GETC or ...");
#   * the sum: the record's major units + 34 + its stated electives reach 60 exactly ("exact"), or fall below
#     it with the record saying electives fill the rest ("under"); a sum past 60 ("overlap") is held for a
#     person unless the section's own words state double counting (DOUBLE_COUNT). The scorer's overlap reading
#     passes such a sum with no bound, so a passing score is no evidence that 34 is right.
CAL_GETC_UNITS = {"min": 34, "max": 34}
CAL_GETC_SOURCE = "statewide Cal-GETC, 34 units; Sam, Sheet 187 card 5, 2026-11-13"
ADT_DEGREE_TOTAL = 60
_CAL_GETC = r"(?:cal\s*-?\s*getc|california\s+general\s+education\s+transfer\s+curriculum)"
CAL_GETC_ONLY = re.compile(r"^\s*%s(?:\s*\(\s*%s\s*\))?(?:\s+pattern)?\s*$" % (_CAL_GETC, _CAL_GETC), re.I)
CAL_GETC_NAME = re.compile(_CAL_GETC, re.I)
_FIG = r"\d{1,2}(?:\.\d{1,2})?(?:\s*(?:-|–|to)\s*\d{1,2}(?:\.\d{1,2})?)?"
_UNIT_WORD = r"(?:semester\s+|quarter\s+)?(?:units?|credits?|hours?)"
FIG_WITH_UNIT = re.compile(r"(?<![\d.])%s\s*%s\b" % (_FIG, _UNIT_WORD), re.I)
FIG_ENDS_LINE = re.compile(r"(?<![\w.])%s\s*(?:%s)?\s*\.?\s*$" % (_FIG, _UNIT_WORD), re.I)
FIG_AFTER_MARK = re.compile(r"[\t:]\s*%s\b" % _FIG, re.I)
FIG_ALONE = re.compile(r"^\s*(?:(?:units?|credits?)\s*:?\s*)?%s\s*(?:%s)?\s*$" % (_FIG, _UNIT_WORD), re.I)
UNITS_LABEL = re.compile(r"^\s*(?:units?|credits?)\s*:?\s*$", re.I)
PARTIAL_TITLE = re.compile(r"\bUCTP\b|\bUC\s+Transfer\b", re.I)
PARTIAL_LINE = re.compile(r"\bAreas?\b|\bone\s+course\b|\bfor\s+STEM\b", re.I)
OTHER_GE_PATTERN = re.compile(
    r"\bIGETC\b|\bCSU\s*-?\s*GE\b|\bGE\s*-?\s*Breadth\b|\bCSU\s+Breadth\b|\bCSU\s+General\s+Education"
    r"|Intersegmental\s+General\s+Education|California\s+State\s+University\s+General\s+Education"
    r"|%s\s*(?:\([^)]*\)\s*)?or\b|\bor\s+(?:the\s+)?%s" % (_CAL_GETC, _CAL_GETC), re.I)
DOUBLE_COUNT = re.compile(r"double[\s-]+count|count(?:ed|s)?\s+(?:toward|towards|for)\s+both"
                          r"|satisf(?:y|ies)\s+both|also\s+(?:be\s+used\s+to\s+)?(?:meet|satisfy)\s+(?:the\s+)?"
                          r"(?:general\s+education|Cal-?GETC)", re.I)


def _alnum_find(text: str, heading: str | None, frm: int = 0) -> tuple[int, int] | None:
    """(start, end) of a heading in text at or after frm, letters and digits only, case kept (as _heading_end)."""
    want = "".join(ch for ch in (heading or "") if ch.isalnum())
    if not want or not text:
        return None
    pos = [i for i, ch in enumerate(text) if ch.isalnum() and i >= frm]
    at = "".join(text[i] for i in pos).find(want)
    return None if at < 0 else (pos[at], pos[at + len(want) - 1] + 1)


def calgetc_section(text: str, heading: str | None, siblings: list | None) -> str | None:
    """The record's own section: from its heading to the first sibling program's heading after it (a sibling
    whose heading is this one's reads the same section), or None when the heading is not printed or the
    siblings are not known."""
    if siblings is None:
        return None
    here = _alnum_find(text, heading)
    if here is None:
        return None
    own = "".join(ch for ch in (heading or "") if ch.isalnum())
    ends = [hit[0] for s in siblings
            if "".join(ch for ch in (s.get("section_heading") or "") if ch.isalnum()) not in ("", own)
            for hit in [_alnum_find(text, s.get("section_heading"), here[1])] if hit]
    return text[here[1]:min(ends) if ends else len(text)]


def calgetc_figure(sec: str) -> str | None:
    """The first printed figure for Cal-GETC in a section, as its line reads, or None: a figure with a unit word
    on a Cal-GETC line, a figure after a tab or colon there, a figure ending it, a figure alone in the cell below
    (a "Units:" label first, or alone a line further on under a bare label), or a figure alone on the line above."""
    lines = sec.split("\n")
    for i, line in enumerate(lines):
        if not CAL_GETC_NAME.search(line):
            continue
        if FIG_WITH_UNIT.search(line) or FIG_AFTER_MARK.search(line) or FIG_ENDS_LINE.search(line):
            return line.strip()
        below = lines[i + 1] if i + 1 < len(lines) else ""
        if FIG_ALONE.match(below):
            return (line.strip() + " / " + below.strip())
        if UNITS_LABEL.match(below) and i + 2 < len(lines) and FIG_ALONE.match(lines[i + 2]):
            return (line.strip() + " / " + below.strip() + " " + lines[i + 2].strip())
        # A figure alone above reads as Cal-GETC's only where nothing labels it from above: in a table printed
        # label-then-figure ("List A: choose two" over "6" over "General Education: Cal-GETC Pattern") the 6 is
        # List A's, and only a figure-then-label layout puts a row's figure over its own label.
        if i > 0 and FIG_ALONE.match(lines[i - 1]) and (i < 2 or FIG_ALONE.match(lines[i - 2]) or not lines[i - 2].strip()):
            return (lines[i - 1].strip() + " / " + line.strip())
    return None


def _lo_hi(v):
    if isinstance(v, dict):
        lo, hi = v.get("min"), v.get("max")
        lo = hi if lo is None else lo
        hi = lo if hi is None else hi
        return (None, None) if lo is None else (float(lo), float(hi))
    return (None, None) if v is None else (float(v), float(v))


def calgetc_standing(prog: dict) -> dict:
    """How a record stands with 34 filled: major (total_units) + 34 + stated electives (open_elective_units,
    degree_elective_units) against the degree total of 60. exact: 60 lies within the sum; under: the sum is
    below 60 and the record says electives fill the degree (electives_fill_degree); overlap: the sum is past
    60; short: below 60 with nothing stated to fill it; unknown: no major units."""
    maj = _lo_hi(prog.get("total_units"))
    if maj[0] is None:
        return {"standing": "unknown", "major": None}
    el = [_lo_hi(prog.get(k)) for k in ("open_elective_units", "degree_elective_units")]
    el_lo = sum(e[0] for e in el if e[0] is not None)
    el_hi = sum(e[1] for e in el if e[1] is not None)
    lo, hi = maj[0] + 34 + el_lo, maj[1] + 34 + el_hi
    total = ADT_DEGREE_TOTAL
    if lo <= total <= hi:
        st = "exact"
    elif hi < total:
        st = "under" if prog.get("electives_fill_degree") else "short"
    else:
        st = "overlap"
    return {"standing": st, "major": list(maj), "electives": [el_lo, el_hi], "sum": [lo, hi], "degree_total": total}


def calgetc_legacy_of(title: str | None, heading: str | None, siblings: list | None) -> str | None:
    """The sibling control number whose "2.0" this record's section is, when this record is the legacy one: the
    two share one section heading, the heading names "2.0", and this record's title does not (Lassen 31297 and
    42300 on "Business Administration for Transfer 2.0"; Diablo Valley 32015 and 46234 on "A.S. in Physics for
    Transfer 2.0")."""
    own = "".join(ch for ch in (heading or "") if ch.isalnum()).lower()
    if not own or not re.search(r"\b2\.0\b", heading or "") or re.search(r"\b2\.0\b", title or ""):
        return None
    for s in siblings or []:
        if "".join(ch for ch in (s.get("section_heading") or "") if ch.isalnum()).lower() == own \
                and re.search(r"\b2\.0\b", s.get("title") or ""):
            return s.get("control_number")
    return None


def calgetc_hold(record, text: str | None, award: str | None, title: str | None = None,
                 siblings: list | None = None) -> tuple[str | None, dict]:
    """(why the statewide rule holds this record, or None to fill; what it read: section words, standing)."""
    if not isinstance(record, dict) or not text:
        return "no record or no page text", {}
    if not awards_match("transfer", award):
        return "not a transfer degree", {}
    prog = record.get("program") or {}
    if not _empty(prog.get("ge_units")):
        return "the record holds general education units", {}
    if not CAL_GETC_ONLY.match(prog.get("ge_pattern") or ""):
        return "the record's pattern is not Cal-GETC alone", {}
    if _lo_hi(prog.get("degree_total")) != (float(ADT_DEGREE_TOTAL), float(ADT_DEGREE_TOTAL)):
        return "the degree total is not exactly 60 (quarter units, or not a 60-unit transfer degree)", {}
    if PARTIAL_TITLE.search(prog.get("section_heading") or "") or PARTIAL_TITLE.search(title or ""):
        return "a UC transfer pattern asks part of Cal-GETC", {}
    legacy = calgetc_legacy_of(title, prog.get("section_heading"), siblings)
    if legacy:
        return "the legacy number of a pair reading one 2.0 section (%s)" % legacy, {"pair": legacy}
    sec = calgetc_section(text, prog.get("section_heading"), siblings)
    if sec is None:
        return ("the section's end is unknown (no sibling headings), or its heading is not printed: the words "
                "could be a later program's"), {}
    named = [ln for ln in sec.split("\n") if CAL_GETC_NAME.search(ln)]
    if not named:
        return "the section does not name Cal-GETC", {}
    if any(PARTIAL_LINE.search(ln) for ln in named):
        return "a Cal-GETC line asks part of it (an Area, one course, for STEM)", {"words": named[0].strip()}
    fig = calgetc_figure(sec)
    if fig:
        return "the page prints a figure for it: %s" % fig[:120], {"words": fig}
    other = OTHER_GE_PATTERN.search(sec)
    if other:
        return "the section names another pattern: %s" % other.group(0), {}
    stand = calgetc_standing(prog)
    read = {"words": named[0].strip()[:160], "standing": stand}
    if stand["standing"] == "overlap":
        dc = DOUBLE_COUNT.search(sec)
        if not dc:
            return "the sum passes 60 and the section states no double counting", read
        read["double_count"] = dc.group(0)
    elif stand["standing"] not in ("exact", "under"):
        return "the sum is %s" % stand["standing"], read
    return None, read


def statewide_cal_getc(record, text: str | None, award: str | None, title: str | None = None,
                       siblings: list | None = None) -> tuple[dict, list[dict]]:
    """The record with ge_units set to the statewide Cal-GETC 34 where calgetc_hold finds no reason to hold, and
    its note (words: the section's Cal-GETC words and the ruling as source; statewide: cal_getc_34, kept by a
    later reconcile run); else the record unchanged and no note."""
    why, read = calgetc_hold(record, text, award, title, siblings)
    if why is not None:
        return record, []
    out = copy.deepcopy(record)
    out.setdefault("program", {})["ge_units"] = copy.deepcopy(CAL_GETC_UNITS)
    note = {"field": "ge_units", "was": (record.get("program") or {}).get("ge_units"),
            "now": copy.deepcopy(CAL_GETC_UNITS), "words": "%s (%s)" % (read["words"], CAL_GETC_SOURCE),
            "statewide": "cal_getc_34", "standing": read["standing"]["standing"]}
    if read.get("double_count"):
        note["double_count"] = read["double_count"]
    return out, [note]


def _college_steps(record: dict, text: str | None, college: str, award: str | None = None,
                   steps: dict | None = None, course_units: dict | None = None,
                   course_hours: dict | None = None) -> tuple[dict, list[dict]]:
    """The record with the college's reconcile steps applied to its page text, and
    a note per change: the field, what it was, what it is now, and the words.
    course_units is the page's own course data where the reader kept it
    ({"call": the vendor's address, "units": {code: [min, max]}}, cd_pages); course_hours the
    same answer's hours for a noncredit course ({"call": ..., "hours": {code: [min, max]}}, S484)."""
    conf = (steps if steps is not None else load_steps()).get(college)
    if not conf or not text or not isinstance(record, dict) or not awards_match(conf.get("awards"), award):
        return record, []
    out = copy.deepcopy(record)
    prog = out.setdefault("program", {})
    notes = []
    for st in conf.get("steps") or []:
        if not awards_match(st.get("awards"), award):
            continue
        if st["kind"] == "course_units":
            # A course the page lists without units, priced by the course data the page's own
            # scripts fetched (Hartnell's Coursedog Requirements tab, S455): never a course the
            # reading gave units, and only from the call the page made, which the note names.
            # A catalog that prints each course's units only in its course descriptions (Glendale's
            # 2025-2026 PDF, S523) carries them in the step itself ("units", from a committed page read
            # its source_words name); the page's own call, where there is one, wins a code both give.
            given = dict(st.get("units") or {})
            if st.get("units_file"):
                # A catalog-wide map is its own committed file beside the reads it came from (S523).
                with open(os.path.join(HERE, st["units_file"])) as fh:
                    given.update(json.load(fh).get("units") or {})
            units = {k: v for k, v in given.items() if v}
            units.update({k: v for k, v in ((course_units or {}).get("units") or {}).items() if v})
            filled = fill_course_units(out, units) if units else {}
            if filled:
                call = (course_units or {}).get("call") or st.get("read")
                notes.append({"field": "course_units", "was": None, "now": filled,
                              "words": "%s (%s)" % (call, st.get("source_words", ""))})
            continue
        if st["kind"] == "course_hours":
            # A noncredit program's course listed without hours, given them by the same call (S484):
            # only in a record measured in hours, never over a figure the reading gave. A catalog
            # that prints each course's hours only in its course descriptions (Victor Valley's
            # CourseLeaf, S639) carries them in a committed file beside the read that printed them
            # (hours_file), as Glendale's units_file does for units; the page's own call wins a code
            # both give.
            given = dict(st.get("hours") or {})
            if st.get("hours_file"):
                with open(os.path.join(HERE, st["hours_file"])) as fh:
                    given.update(json.load(fh).get("hours") or {})
            hours = {k: v for k, v in given.items() if v}
            hours.update({k: v for k, v in ((course_hours or {}).get("hours") or {}).items() if v})
            filled = fill_course_hours(out, hours) if hours else {}
            if filled:
                call = (course_hours or {}).get("call") or st.get("read")
                notes.append({"field": "course_hours", "was": None, "now": filled,
                              "words": "%s (%s)" % (call, st.get("source_words", ""))})
            continue
        if st["kind"] == "or_units":
            # A CourseLeaf course list prints an alternative as its own row, "or WORK 99<tab>Career-Focused
            # Work Experience", with no units: the units on the first row are the group's, and the page's
            # total counts them once (Monterey Peninsula's Business - Leadership 39261: "WORK 96 ... 2 · or
            # WORK 99 · or WORK 98 · or WORK 97 · Total Units 17"; S535). An alternative the reading left
            # without units, printed so, takes its parent's; never one the reading gave units, and never a
            # parent without them.
            filled = {}
            parents = {}
            if st.get("parent_from_block"):
                # S590: the group's figure printed on its heading line, not its first row (Monterey
                # Peninsula's Business - Accounting 22052: "Select one of the following:<tab>2 · WORK 96 ·
                # Professional and Essential Skills · or WORK 99 ..."). A block of one course and its
                # alternatives, read "all" with one figure stated, gives that figure to a course the
                # reading left without units, so its alternatives take it below; only where the page
                # prints an alternative as its own "or CODE" row.
                for block in out.get("blocks") or []:
                    courses = block.get("courses") or []
                    stated = block.get("stated") or {}
                    lo, hi = _num(stated.get("min")), _num(stated.get("max"))
                    if (block.get("rule") != "all" or len(courses) != 1 or lo is None or lo != hi
                            or _num(courses[0].get("units")) is not None or courses[0].get("units_max") is not None):
                        continue
                    alts = [a for a in courses[0].get("alternatives") or [] if isinstance(a, dict) and a.get("code")]
                    if not alts or not any(re.search(r"\bor\s+%s\t" % r"\s*".join(
                            re.escape(ch) for ch in re.sub(r"\s+", "", a["code"])), text) for a in alts):
                        continue
                    courses[0]["units"] = lo
                    parents[courses[0]["code"]] = lo
            if parents:
                notes.append({"field": "course_units", "was": None, "now": parents,
                              "words": st.get("source_words", "")})
            for block in out.get("blocks") or []:
                for course in block.get("courses") or []:
                    if _num(course.get("units")) is None:
                        continue
                    for alt in course.get("alternatives") or []:
                        if not isinstance(alt, dict) or not alt.get("code"):
                            continue
                        if alt.get("units") is not None or alt.get("units_max") is not None:
                            continue
                        code = r"\s*".join(re.escape(ch) for ch in re.sub(r"\s+", "", alt["code"]))
                        if not re.search(r"\bor\s+%s\t[^\t\n\u00b7]*(?=\u00b7|\n|$)" % code, text):
                            continue
                        alt["units"] = course["units"]
                        if _num(course.get("units_max")) is not None:
                            alt["units_max"] = course["units_max"]
                        filled[alt["code"]] = [course["units"], course.get("units_max")]
            if filled:
                notes.append({"field": "alternative_units", "was": None, "now": filled,
                              "words": st.get("source_words", "")})
            continue
        if st["kind"] == "and_units":
            # A CourseLeaf course list prints a lecture and its lab as one row, "CSIS 50 · & 50L<tab>MS Office
            # Applications · and MS Office Applications Lab<tab>3": the row's units are the pair's, and the
            # page's total counts them once (Monterey Peninsula's Medical Assisting 03635, "TOTAL MAJOR UNITS
            # 37-40"; S536). The joined course the reading listed as its own entry with no units takes 0, so
            # the scorer stops pricing it from the state file a second time. Only where the page prints the
            # two codes joined by "&" (the prefix may be left off), only where the course before it in the
            # same list carries a figure, and never a course the reading gave units.
            def _code_re(code, bare=False):
                code = re.sub(r"\s+", "", code or "")
                m = re.match(r"([A-Za-z]+)(.*)$", code)
                pre, rest = (m.group(1), m.group(2)) if m else ("", code)
                body = r"\s*".join(re.escape(ch) for ch in rest)
                if not pre:
                    return body
                pre = r"\s*".join(re.escape(ch) for ch in pre)
                return r"(?:%s\s*)?%s" % (pre, body) if bare else r"%s\s*%s" % (pre, body)
            filled = {}
            for block in out.get("blocks") or []:
                courses = block.get("courses") or []
                for i, course in enumerate(courses):
                    prev = courses[i - 1] if i else None
                    if not prev or not course.get("code") or not prev.get("code"):
                        continue
                    if course.get("units") is not None or course.get("units_max") is not None:
                        continue
                    if _num(prev.get("units")) is None:
                        continue
                    pat = r"\b%s\s*·?\s*&\s*%s(?![0-9A-Za-z])" % (_code_re(prev["code"]), _code_re(course["code"], bare=True))
                    if not re.search(pat, text):
                        continue
                    course["units"] = 0
                    filled[course["code"]] = prev["code"]
            if filled:
                notes.append({"field": "joined_units", "was": None, "now": filled,
                              "words": st.get("source_words", "")})
            continue
        if st["kind"] == "pool_areas":
            # A total the page prints over each area's sub-areas (Hartnell's CalGETC 45096, S491: "A total of
            # 6 semester units is required" over Area 3A and 3B; "A total of 7" over 5A, 5B and 5C). Each
            # match names one area and its figure; that area's sub-area blocks become one choice of the
            # figure, each sub-area kept in floors (its rule says whether its minimum counts courses or
            # units), and a course listed under two sub-areas listed once (5C's laboratory repeats 5A's and
            # 5B's courses). Only two or more blocks, and never where a sub-area's own printed figures sum
            # past the area's.
            for m in re.finditer(st["pattern"], text):
                area, n = m.group("area"), _num(m.group("n"))
                named = re.compile(st["block_pattern"].replace("{area}", re.escape(area)))
                blocks = out.get("blocks") or []
                pool = [i for i, b in enumerate(blocks) if named.match(b.get("name") or "")
                        and b.get("rule") in ("choose_courses", "choose_units") and not b.get("floors")]
                if n is None or len(pool) < 2:
                    continue
                if sum(_span_of(blocks[i].get("stated"))[0] or 0 for i in pool) > n:
                    continue
                courses, seen = [], set()
                for i in pool:
                    for c in blocks[i].get("courses") or []:
                        k = re.sub(r"\s+", "", (c.get("code") or "")).upper()
                        if k and k in seen:
                            continue
                        seen.add(k)
                        courses.append(c)
                title = (m.groupdict().get("title") or "").strip()
                name = st.get("name", "Area {area}").replace("{area}", area).replace("{title}", title)
                merged = {"name": name, "rule": "choose_units",
                          "minimum": n, "option_group": None, "stated": {"min": n, "max": n}, "courses": courses,
                          "floors": [{"name": blocks[i].get("name"), "rule": blocks[i].get("rule"),
                                      "minimum": blocks[i].get("minimum"), "stated": blocks[i].get("stated")}
                                     for i in pool]}
                notes.append({"field": "blocks", "was": [blocks[i].get("name") for i in pool],
                              "now": merged["name"], "words": m.group(0).strip()})
                out["blocks"] = [merged if i == pool[0] else b for i, b in enumerate(blocks) if i not in pool[1:]]
            continue
        if st["kind"] == "unit_line":
            # A requirement the page prints as a line with units and no course (Delta's Architectural
            # Drafting 22244, S500: "Associate Degree Math Requirement: Units 4" in a list of courses
            # summing 19 under "Complete 23 units"). The line becomes a choose_units block of its figure
            # with no courses, only where no block carries the label already and only where the
            # record's sum falls short of its printed total by exactly that figure: the same words sit
            # elsewhere at Delta as an alternative inside an area, or beside a total that leaves them out.
            from _program_requirements_score import program_units
            tu = _span_of(prog.get("total_units"))
            for m in re.finditer(st["pattern"], text):
                label, n = m.group("label").strip(), _num(m.group("n"))
                blocks = out.get("blocks") or []
                if n is None or tu[0] is None or any(label.lower() in (b.get("name") or "").lower() for b in blocks):
                    continue
                (lo, _hi), why = program_units(out, {})
                if why or abs(tu[0] - lo - n) > 1e-9:
                    continue
                block = {"name": label, "rule": "choose_units", "minimum": n, "option_group": None,
                         "stated": {"min": n, "max": n}, "courses": []}
                notes.append({"field": "blocks", "was": None, "now": label, "words": m.group(0).strip()})
                out["blocks"] = blocks + [block]
            continue
        if st["kind"] == "fill_to":
            # A list the page says fills the program to a total (Los Angeles Valley's Economics 02984,
            # French 02965 and Geology 08560, S534: "... FOR A MINIMUM OF 18 UNITS", "... TO COMPLETE 36
            # TOTAL UNITS"): block_pattern's n on the block's name gives fills_to, which the scorer reads
            # as the least the program sums to. range_pattern's n and m on a choose_courses block's name
            # ("COMPLETE 3-4 COURSES") give the count's top as maximum where the reading kept n alone.
            for key, pat in (("fills_to", st.get("block_pattern")), ("maximum", st.get("range_pattern"))):
                named = re.compile(pat) if pat else None
                for block in (out.get("blocks") or []) if named else []:
                    bm = named.search(block.get("name") or "")
                    if not bm or block.get(key) is not None:
                        continue
                    if key == "fills_to":
                        # Only the program's own printed total: "FOR A MINIMUM OF 3 UNITS" over one list's
                        # activity areas (Kinesiology 32854) is that list's floor.
                        n = _num(bm.group("n"))
                        if n is None or _span_of(prog.get("total_units"))[0] != n:
                            continue
                    else:
                        lo_n, n = _num(bm.group("n")), _num(bm.group("m"))
                        if (block.get("rule") != "choose_courses" or not n or not lo_n or n <= lo_n
                                or _num(block.get("minimum")) != lo_n):
                            continue
                    if not n:
                        continue
                    block[key] = n
                    notes.append({"field": "blocks", "was": None, "now": {block.get("name"): {key: n}},
                                  "words": bm.group(0).strip()})
            continue
        if st["kind"] == "semester_sum":
            # Sam, Open Asks Sheet 180 card 2 ("count", 2026-11-10): a program the page lays out by
            # semester, each semester's courses adding to the subtotal it prints, with no total over
            # them (College of Alameda's Diesel Mechanics 19827), carries the sum of the subtotals as
            # its total, marked total_units_summed. Only where the record holds no total of either kind, every
            # semester block is rule all and adds to its own printed figure, the page prints each
            # semester's heading, and no other block asks for units.
            named = re.compile(st["block_pattern"], re.I)
            blocks = out.get("blocks") or []
            sems = [b for b in blocks if named.search(b.get("name") or "")]
            rest = [b for b in blocks if b not in sems]
            if (not _empty(prog.get("total_units")) or not _empty(prog.get("degree_total")) or len(sems) < 2
                    or any(b.get("rule") != "recommended" for b in rest)):
                continue
            total, parts = 0.0, []
            for b in sems:
                span = _span_of(b.get("stated"))
                units = [c.get("units") for c in b.get("courses") or []]
                if (b.get("rule") != "all" or not span or span[0] is None or span[0] != span[1] or not units
                        or any(not isinstance(u, (int, float)) or c.get("units_max") not in (None, u)
                               for u, c in zip(units, b["courses"]))
                        or abs(sum(units) - span[0]) > 0.01
                        or not re.search(re.escape(b["name"].strip()), text, re.I)):
                    break
                total += span[0]
                parts.append("%s %g" % (b["name"].strip(), span[0]))
            else:
                now = {"min": total, "max": total}
                notes.append({"field": "total_units", "was": prog.get("total_units"), "now": now,
                              "words": "SUMMED FROM THE SEMESTERS, no total is printed: " + " + ".join(parts)})
                prog["total_units"] = now
                prog["total_units_summed"] = True
            continue
        if st["kind"] == "repeat":
            # A course or a list the page says is taken more than once (Hartnell's Music 43887, S497):
            # "If MUS 11 is chosen, it must be taken for 2 semesters" gives that course (or alternative)
            # times 2; a choose_courses block the reading named "2 semesters of any of the following
            # Courses" and read as one choice becomes 2 enrollments from a list a student may repeat.
            # Never a figure the reading already gave.
            from _program_requirements_pilot import norm_code
            # Delta's Caterpillar 44197 (S498) words the count and prints the sum: "Students are required
            # to enroll four times in CAT 69V for a total of 16 units" (a 1-4 unit course); the total group
            # keeps that sum as units_total, so the scorer reads 16 rather than four times the range.
            for m in re.finditer(st.get("pattern") or r"(?!)", text):
                code, n = norm_code(m.group("code")), _count(m.group("n"))
                total = _num(m.group("total")) if "total" in m.re.groupindex and m.group("total") else None
                for block in out.get("blocks") or []:
                    for course in block.get("courses") or []:
                        for entry in [course] + [a for a in course.get("alternatives") or [] if isinstance(a, dict)]:
                            if n and n > 1 and norm_code(entry.get("code")) == code and entry.get("times") is None:
                                entry["times"] = n
                                now = {entry["code"]: n}
                                if total is not None:
                                    entry["units_total"] = total
                                    now = {entry["code"]: {"times": n, "units_total": total}}
                                notes.append({"field": "times", "was": None, "now": now,
                                              "words": m.group(0).strip()})
            named = re.compile(st["block_pattern"]) if st.get("block_pattern") else None
            for block in (out.get("blocks") or []) if named else []:
                bm = named.search(block.get("name") or "")
                n = _num(bm.group("n")) if bm else None
                # The reading may already have the count right and miss only the repeat ("COMPLETE 4
                # COURSES FROM THE FOLLOWING: (COURSES MAY BE REPEATED)", Los Angeles Valley's Music
                # 02962, S533): a minimum equal to n takes the repeat; any other figure stays the reading's.
                if (not n or n < 2 or block.get("rule") != "choose_courses" or block.get("repeats")
                        or _num(block.get("minimum")) not in (None, 1, n)):
                    continue
                notes.append({"field": "blocks", "was": block.get("minimum"), "now": {block["name"]: n},
                              "words": bm.group(0).strip()})
                block["minimum"], block["repeats"] = int(n), True
            continue
        field = st["field"]
        scope = text
        if st.get("before"):
            # Only the words ahead of the program's first list (Glendale's PDF, S524): a page that
            # prints no total of its own runs on into the next program's paragraph, which does.
            # A record placing no course read another program's page (the not-found records): the
            # words ahead of that page's first list are someone else's.
            if not any(b.get("courses") for b in out.get("blocks") or []):
                continue
            # And only from the program's own heading (S525): the page's first list belongs to the first
            # program on it, so a program further down took that one's total (Computer Support Technician
            # read IT Technician II's 32). A heading the page does not print fills nothing.
            start = _heading_end(text, prog.get("section_heading"))
            if start is None:
                continue
            bm = re.compile(st["before"]).search(text, start)
            if not bm:
                continue
            scope = text[start:bm.start()]
        m = re.search(st["pattern"], scope)
        if not m:
            continue
        if st["kind"] == "pool_lists":
            # One unit figure the page prints over several subject lists, each "Complete ANY of the
            # following Courses" (Hartnell's General Studies, S487): the lists are one choice of n
            # units. Only lists the reading gave no figure of their own, and only two or more.
            # with_floors (S489): lists that carry floors of their own under one total the page prints
            # over them all (Hartnell's Liberal Arts 17924, "Complete a total of 18 units from List A,
            # List B, and List C"); each floor stays on the pooled block, and a course listed twice once.
            n = _num(m.group("n"))
            floors = bool(st.get("with_floors"))
            prefix = st.get("block_prefix") or ""
            named = re.compile(st["block_pattern"]) if st.get("block_pattern") else None
            pool = [i for i, b in enumerate(out.get("blocks") or [])
                    if b.get("rule") == "choose_units"
                    and (floors or (_num(b.get("minimum")) is None and not _span_of(b.get("stated"))[0]))
                    and (named.match(b.get("name") or "") if named else (b.get("name") or "").startswith(prefix))]
            tu = _span_of(prog.get("total_units"))
            if n is None or len(pool) < 2 or (tu[0] is not None and tu != (n, n)):
                continue
            blocks = out["blocks"]
            lows = [_span_of(blocks[i].get("stated"))[0] or _num(blocks[i].get("minimum")) for i in pool]
            if floors and sum(v or 0 for v in lows) > n:
                continue
            courses, seen = [], set()
            for i in pool:
                for c in blocks[i].get("courses") or []:
                    k = re.sub(r"\s+", "", (c.get("code") or "")).upper()
                    if floors and k and k in seen:
                        continue
                    seen.add(k)
                    courses.append(c)
            merged = {"name": st.get("name") or "Completion requirement", "rule": "choose_units",
                      "minimum": n, "option_group": None, "stated": {"min": n, "max": n}, "courses": courses}
            if floors:
                merged["floors"] = [{"name": blocks[i].get("name"), "minimum": blocks[i].get("minimum"),
                                     "stated": blocks[i].get("stated")} for i in pool]
            notes.append({"field": "blocks", "was": [blocks[i].get("name") for i in pool],
                          "now": merged["name"], "words": m.group(0).strip()})
            out["blocks"] = [merged if i == pool[0] else b for i, b in enumerate(blocks) if i not in pool[1:]]
            continue
        if st["kind"] == "fill":
            if not _empty(prog.get(field)):
                continue
            if st.get("only_without") and not _empty(prog.get(st["only_without"])):
                continue
            if st.get("only_with") and _empty(prog.get(st["only_with"])):
                continue
            lo = _num(m.group("min"))
            hi = _num(m.groupdict().get("max")) if m.groupdict().get("max") else lo
            if st.get("skip_if_equal") and _span_of(prog.get(st["skip_if_equal"])) == (lo, hi):
                continue
            now = lo if field == "open_elective_units" else {"min": lo, "max": hi}
            notes.append({"field": field, "was": prog.get(field), "now": now, "words": m.group(0).strip()})
            prog[field] = now
        elif st["kind"] == "set":
            # A figure the catalog prints once for every degree, on its own page (Cerritos's general
            # education pattern): set where the program page's words point to it, citing both.
            if not _empty(prog.get(field)):
                continue
            if st.get("only_without") and not _empty(prog.get(st["only_without"])):
                continue
            # A rule about a figure the reading already took (Los Angeles City, S639: the 60 a heading
            # prints is a floor only where the record holds that 60): a record without it is left alone.
            # Victor Valley's Cal-GETC (S639) too: a transfer degree that names the 60, never one
            # that holds its major alone. A list names fields that must all be set (S644: a pattern's units
            # go only to a record that names the pattern and the degree total it counts toward).
            needs = st.get("only_with") or []
            if any(_empty(prog.get(n)) or prog.get(n) == "" for n in ([needs] if isinstance(needs, str) else needs)):
                continue
            words = m.group(0).strip()
            if st.get("source"):
                words = "%s (%s: %s)" % (words, st["source"], st["source_words"])
            notes.append({"field": field, "was": prog.get(field), "now": st["value"], "words": words})
            prog[field] = copy.deepcopy(st["value"])
        elif st["kind"] == "clear_minimum":
            n = _num(m.group("n"))
            if _span_of(prog.get(field)) != (n, n) or _empty(prog.get("degree_total")):
                continue
            notes.append({"field": field, "was": prog.get(field), "now": {"min": None, "max": None},
                          "words": m.group(0).strip()})
            prog[field] = {"min": None, "max": None}
    return (out, notes) if notes else (record, [])
