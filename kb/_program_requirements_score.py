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
        own = [v for v in (_num(entry.get("units")), _num(entry.get("units_max"))) if v is not None]
        if own:
            vals += own
        elif not hours:
            u = listed.get(norm_code(entry.get("code")))
            if u is not None:
                vals.append(u)
    if not vals:
        return None
    return (min(vals), max(vals))


def block_units(block: dict, listed: dict, hours: bool = False
                ) -> tuple[tuple[float, float] | None, list[str]]:
    """The units a block contributes to the program, and why it could not be
    computed when it cannot. The block total the catalog prints stands in when
    a course's units are missing or the rule picks units."""
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
        lows = sorted(s[0] for s in known)[:n]
        highs = sorted((s[1] for s in known), reverse=True)[:n]
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


def _flat(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").translate(_FOLD)).strip()


def _readings(text: str) -> list[str]:
    """The catalog text flattened, plus the two ways a PDF's line-end hyphen
    reads ("self-\\nemployed" as "self-employed" and as "selfemployed"), so an
    outcome copied across a line break still matches."""
    flat = _flat(text)
    return [flat, re.sub(r"(\w)- (\w)", r"\1-\2", flat), re.sub(r"(\w)- (\w)", r"\1\2", flat)]


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
            elif not any(f in r for r in readings):
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
    if transfer_degree(award, prog) and lo > degree[0] + TOL and hi > degree[1] + TOL:
        # Sheet 82 card 2 ("overlap", Sam, 2026-10-14): a course counts toward the major and
        # Cal-GETC both, so a transfer degree's sum runs past the total it prints.
        return {"pass": True, "status": "equal", "overlap": True, "why": []}
    fits = lo <= degree[0] + TOL and hi <= degree[1] + TOL
    fill = [round(max(0.0, degree[0] - hi), 2), round(max(0.0, degree[1] - lo), 2)]
    if prog.get("electives_fill_degree"):
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


def score(record: dict, closed: list[dict], text: str | None = None, award: str | None = None) -> dict:
    """The automatic bars. text is the catalog text the record was read
    from; without it a record that states no figure cannot pass. award is the
    state file's award, which names an associate degree for transfer."""
    listed = {}
    for c in closed:
        k = norm_code(c.get("code"))
        if k:
            listed[k] = _num(c.get("units"))
    placed = placed_codes(record)
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
    elif reasons:
        arith = {"pass": False, "status": "incomplete", "computed": [lo, hi],
                 "stated": list(stated), "against": "program", "why": reasons}
    else:
        ok = abs(lo - stated[0]) <= TOL and abs(hi - stated[1]) <= TOL
        arith = {"pass": ok, "status": "equal" if ok else "unequal",
                 "computed": [round(lo, 2), round(hi, 2)], "stated": list(stated), "against": "program",
                 "why": [] if ok else ["the blocks sum to %s-%s; the catalog states %s-%s"
                                       % (round(lo, 2), round(hi, 2), stated[0], stated[1])]}
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
