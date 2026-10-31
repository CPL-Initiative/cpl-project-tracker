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
            # only in a record measured in hours, never over a figure the reading gave.
            hours = {k: v for k, v in ((course_hours or {}).get("hours") or {}).items() if v}
            filled = fill_course_hours(out, hours) if hours else {}
            if filled:
                notes.append({"field": "course_hours", "was": None, "now": filled,
                              "words": "%s (%s)" % ((course_hours or {}).get("call"), st.get("source_words", ""))})
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
