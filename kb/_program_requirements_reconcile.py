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


def _empty(v) -> bool:
    if isinstance(v, dict):
        return v.get("min") is None and v.get("max") is None
    return v is None or v == 0


def _span_of(v):
    if isinstance(v, dict):
        return (v.get("min"), v.get("max") if v.get("max") is not None else v.get("min"))
    return (v, v)


def awards_match(kind: str | None, award: str | None) -> bool:
    if not kind:
        return True
    if kind == "associate":
        return bool(ASSOCIATE.search(award or "")) and not re.search(r"baccalaureate|certificate", award or "", re.I)
    if kind == "transfer":
        return awards_match("associate", award) and bool(TRANSFER.search(award or ""))
    if kind == "local":
        # A local associate degree (Taft, S422): its general education is the college's own
        # pattern, where a transfer degree's is Cal-GETC.
        return awards_match("associate", award) and not TRANSFER.search(award or "")
    return False


def reconcile(record: dict, text: str | None, college: str, award: str | None = None,
              steps: dict | None = None) -> tuple[dict, list[dict]]:
    """The record with the college's reconcile steps applied to its page text, and
    a note per change: the field, what it was, what it is now, and the words."""
    conf = (steps if steps is not None else load_steps()).get(college)
    if not conf or not text or not isinstance(record, dict) or not awards_match(conf.get("awards"), award):
        return record, []
    out = copy.deepcopy(record)
    prog = out.setdefault("program", {})
    notes = []
    for st in conf.get("steps") or []:
        if not awards_match(st.get("awards"), award):
            continue
        field = st["field"]
        m = re.search(st["pattern"], text)
        if not m:
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
