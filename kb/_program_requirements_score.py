#!/usr/bin/env python3
"""Score a program requirements record against the state's closed course list.

The program requirements harvest (docs/reference/lanes/program-requirements-harvest.md)
tests every record before anything reads it. The plan (Sam's Claude Doc, section
"Testing against the catalog") names four checks; three run without a person,
because the Data Mart Program Course File (coci_program_courses) names every
course the program lists, and Sam's review added a structural one:

  coverage       the listed courses the record places in a block, out of all
                 of them. Bar: 100%, or each missing course explained.
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
                 "rule": "all" | "choose_courses" | "choose_units",
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
    if _span(prog.get("total_units")) or _num(prog.get("open_elective_units")):
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
    and every block), leaving out the outcomes, which the scorer checks word
    for word. A rerun that changes the requirements changes it; one that only
    adds outcomes does not."""
    program = {k: v for k, v in (record.get("program") or {}).items() if k != "outcomes"}
    body = {"program": program, "blocks": record.get("blocks") or []}
    return hashlib.md5(json.dumps(body, sort_keys=True, ensure_ascii=False,
                                  separators=(",", ":")).encode()).hexdigest()


def score(record: dict, closed: list[dict], text: str | None = None) -> dict:
    """The automatic bars. text is the catalog text the record was read
    from; without it a record that states no figure cannot pass."""
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
    oe = _num((record.get("program") or {}).get("open_elective_units")) or 0.0
    lo, hi = lo + oe, hi + oe
    stated = _span((record.get("program") or {}).get("total_units"))
    if stated is None and not has_figure(record) and not any(listed.values()):
        figures = [m.group(0) for m in FIGURE.finditer(text or "")]
        ok = text is not None and not figures
        arith = {"pass": ok, "status": "unstated", "computed": None, "stated": None,
                 "why": ["the catalog prints no total, no hours and no units"] if ok else
                        ["the record states no figure, but the catalog text names %s"
                         % ", ".join(figures[:4])] if figures else
                        ["the record states no figure, and no catalog text came to check it against"]}
    elif stated is None:
        arith = {"pass": False, "status": "incomplete", "computed": [lo, hi], "stated": None,
                 "why": reasons + ["the record names no total"]}
    elif reasons:
        arith = {"pass": False, "status": "incomplete", "computed": [lo, hi],
                 "stated": list(stated), "why": reasons}
    else:
        ok = abs(lo - stated[0]) <= TOL and abs(hi - stated[1]) <= TOL
        arith = {"pass": ok, "status": "equal" if ok else "unequal",
                 "computed": [round(lo, 2), round(hi, 2)], "stated": list(stated),
                 "why": [] if ok else ["the blocks sum to %s-%s; the catalog states %s-%s"
                                       % (round(lo, 2), round(hi, 2), stated[0], stated[1])]}

    rep_codes = repeated(record)
    outs = outcomes_check(record, text)
    n = len(listed)
    return {
        "measure": measure(record),
        "coverage": {"placed": n - len(missing), "listed": n,
                     "share": round((n - len(missing)) / n, 3) if n else None,
                     "missing": missing, "unexplained": unexplained,
                     "pass": not unexplained},
        "invented": {"count": len(invented), "codes": invented, "flagged": flagged,
                     "pass": not unflagged},
        "arithmetic": arith,
        "repeated": {"codes": rep_codes, "pass": not rep_codes},
        "outcomes": outs,
        "pass": (not unexplained and not unflagged and arith["pass"] and not rep_codes
                 and outs["pass"]),
    }
