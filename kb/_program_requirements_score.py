#!/usr/bin/env python3
"""Score a program requirements record against the state's closed course list.

The program requirements harvest (docs/reference/lanes/program-requirements-harvest.md)
tests every record before anything reads it. The plan (Sam's Claude Doc, section
"Testing against the catalog") names four checks; three run without a person,
because the Data Mart Program Course File (coci_program_courses) names every
course the program lists:

  coverage       the listed courses the record places in a block, out of all
                 of them. Bar: 100%, or each missing course explained.
  invented       courses the record places that the list lacks. Bar: 0, or
                 each one flagged as a catalog addition.
  arithmetic     required units plus each block's minimum plus open electives,
                 against the catalog's stated total. Bar: equal.

The fourth, agreement with a person, is Sam's reading of the same 20 programs.

THE RECORD (one per program per catalog year; the extractor writes it):

    {"program": {"total_units": 30.5 | {"min": 27, "max": 29} | null,
                 "open_elective_units": 0, ...},
     "blocks": [{"name": "Required Courses",
                 "rule": "all" | "choose_courses" | "choose_units",
                 "minimum": null | number,       # N courses or N units
                 "courses": [{"code": "CUL 36", "units": 8.5,
                              "alternatives": ["CUL 36H"],   # count as one
                              "catalog_addition": false}]}]}

A course with alternatives (an honors pair, "MATH 1 or MATH 1H") counts as one
choice whose units run from its smallest option to its largest. Units come
from the record first (the catalog's own number) and the closed list second.

Pure: no network, no model. Tested by tests/program_requirements_pilot_test.py.
"""
from __future__ import annotations

import os
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


def placed_codes(record: dict) -> list[tuple[str, dict, dict]]:
    """(normalized code, course, block) for every code the record places,
    alternatives included."""
    out = []
    for b in record.get("blocks") or []:
        for c in b.get("courses") or []:
            for code in [c.get("code")] + list(c.get("alternatives") or []):
                if code:
                    out.append((norm_code(code), c, b))
    return out


def choice_units(course: dict, listed: dict) -> tuple[float, float] | None:
    """The units one choice carries: the record's own number, else the closed
    list's; an alternatives group runs from its smallest option to its largest."""
    vals = []
    own = _num(course.get("units"))
    if own is not None:
        vals.append(own)
    for code in [course.get("code")] + list(course.get("alternatives") or []):
        u = listed.get(norm_code(code))
        if u is not None and (own is None or code != course.get("code")):
            vals.append(u)
    if not vals:
        return None
    return (min(vals), max(vals))


def block_units(block: dict, listed: dict) -> tuple[tuple[float, float] | None, list[str]]:
    """The units a block contributes to the program, and why it could not be
    computed when it cannot."""
    rule, minimum = block.get("rule"), _num(block.get("minimum"))
    spans = [choice_units(c, listed) for c in block.get("courses") or []]
    if rule == "all":
        if any(s is None for s in spans):
            return None, ["a required course in '%s' has no units" % block.get("name")]
        return (sum(s[0] for s in spans), sum(s[1] for s in spans)), []
    if rule == "choose_units":
        if minimum is None:
            return None, ["'%s' chooses units but names no minimum" % block.get("name")]
        return (minimum, minimum), []
    if rule == "choose_courses":
        if minimum is None:
            return None, ["'%s' chooses courses but names no minimum" % block.get("name")]
        known = [s for s in spans if s is not None]
        n = int(minimum)
        if len(known) < n:
            return None, ["'%s' chooses %d courses but %d carry units"
                          % (block.get("name"), n, len(known))]
        lows = sorted(s[0] for s in known)[:n]
        highs = sorted((s[1] for s in known), reverse=True)[:n]
        return (sum(lows), sum(highs)), []
    return None, ["'%s' has no rule the scorer knows (%r)" % (block.get("name"), rule)]


def score(record: dict, closed: list[dict]) -> dict:
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

    lo = hi = 0.0
    reasons: list[str] = []
    for b in record.get("blocks") or []:
        span, why = block_units(b, listed)
        if span is None:
            reasons += why
            continue
        lo += span[0]
        hi += span[1]
    oe = _num((record.get("program") or {}).get("open_elective_units")) or 0.0
    lo, hi = lo + oe, hi + oe
    stated = _span((record.get("program") or {}).get("total_units"))
    if stated is None:
        arith = {"pass": False, "computed": [lo, hi], "stated": None,
                 "why": reasons + ["the record names no total"]}
    elif reasons:
        arith = {"pass": False, "computed": [lo, hi], "stated": list(stated), "why": reasons}
    else:
        ok = abs(lo - stated[0]) <= TOL and abs(hi - stated[1]) <= TOL
        arith = {"pass": ok, "computed": [round(lo, 2), round(hi, 2)],
                 "stated": list(stated),
                 "why": [] if ok else ["the blocks sum to %s-%s; the catalog states %s-%s"
                                       % (round(lo, 2), round(hi, 2), stated[0], stated[1])]}

    n = len(listed)
    return {
        "coverage": {"placed": n - len(missing), "listed": n,
                     "share": round((n - len(missing)) / n, 3) if n else None,
                     "missing": missing, "unexplained": unexplained,
                     "pass": not unexplained},
        "invented": {"count": len(invented), "codes": invented, "flagged": flagged,
                     "pass": not unflagged},
        "arithmetic": arith,
        "pass": not unexplained and not unflagged and arith["pass"],
    }
