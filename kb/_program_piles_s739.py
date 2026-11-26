#!/usr/bin/env python3
"""S739, lane 2's cheap piles: the shared plan code for the records earlier plans held, one plan per college.

Sam's ruling (2026-11-17, sam-collect-with-gaps-2026-11-17): never drop a record for failing; collect it with its gaps
noted and confidence scores, a gap noted instead of a reread. His routine prompt of 2026-11-25, as the S739 conductor's
brief carries it: a record held for a gap is collected with its gap named and a lower score on the 0-100 bar, never
held, unless the record is not the program's own (read from another program's or award's page: that one stays held,
with its reason). Confidence is 0-100 (r-confidence-0-100-in-all-commons-procedures-sam-2026-11-25).

S713 to S731's plans held records for reasons that ruling no longer accepts as a hold: a cheaper lever (a wording rule
on a reconcile) would pass it, two gaps sit on one row, the reading is the reader's own, a note is missing though the
record says the same in its heading. Each college's module (kb/_program_piles_s739_<college>.py) reads its earlier
plan's holds again, by key, from the committed record, its notes and today's capture: no catalog read, no reconcile, no
record changed. A Pile below carries what every such plan shares, in S731's shape (kb/_program_piles_s731_lbcc.py):

  KEYS      the earlier plan's holds, by key (its receipt's held list), never a census read.
  PASSED    a record today's scorer passes under one named reading (short_high, meets), rescored where the rescore is
            exact (the S714 rescore's guard).
  REVIEWED  a hand reading of the record's own notes: the gap's kind, the filed figures it was read against, the note's
            words, and the kind's own check. The check is either a reading (ops: the record re-added with the one
            change its note names, which must give the printed total at both ends under today's scorer) or a shape (a
            kind whose sentence says the units cannot be checked: its figures and blocks must show that shape).
  HAND      the hand answer for every key: PASSES, a gap's name, or "held: ..." with its reason.

THE STANDING GUARDS, on every row: scorer_passes (a record today's scorer passes is never gap-filed); on_live_run (the
committed record's run is its live row's, by the college's earlier module, which reads the committed receipts); the
record-rule guard (a row kb/_program_named_gaps.py's record rules name under another kind is refused); collectable
(coverage and invented pass, so the census counts the row collected); and the own-page guard, keyed on the pages the
records were read from (sources.json's source.url and each record's source_url, p-own-page-guard-reads-read-pages-s727).

THE OWN-PAGE GUARD, three forms, each a reviewed entry the code checks (own() below). A record read from a page another
program was read from stands only where one of these shows its section is its own:
  own_section  a note of its own names its own section (S720's form, East Los Angeles's second reader).
  own_heading  the record's section_heading is the reviewed heading, it carries every word of the program's title,
               the capture found the program's heading on the pages read (sources.json source.heading_named, the
               capture's own finding, never the reader's), the record was read from those pages, and no record read
               from the same page carries that heading. S727 held such a record for want of a note; the heading the
               reader read and the capture found is the same fact a note would state.
  own_list     for heading_not_in_text alone, whose sentence already says no page read has confirmed the list is the
               program's: the record places at least half of its own state list, and each record read from the same
               page either holds another course list (under half in common) or is told apart by the award's own unit
               band, the printed total sitting inside this award's band and outside each such page-mate's.
A record none of the three shows to be its own stays held: it is not shown to be the program's own.

THE SELF-RECALL: HAND against the code (precision), the claim check over every row (each course an entry names is among
the codes today's capture found; a course the printed total leaves out is on neither the capture nor the state's
list), and boundary readings (the note's words gone, the stated total one unit off, coverage failing, the reading
against a total one unit off, a shape's own figure moved). A wrong answer anywhere writes no plan.

Guards: tests/program_piles_s739_<college>_test.py, through tests/program_piles_s739_common.py.
"""
from __future__ import annotations

import collections
import contextlib
import copy
import glob
import json
import os
import re
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s713 as P  # noqa: E402
import _program_piles_s714_ccsf as C  # noqa: E402
import _program_piles_s714_fullerton as F  # noqa: E402
import _program_piles_s727_arc as ARC  # noqa: E402
import _program_requirements_score as S  # noqa: E402

ROOT = os.path.dirname(HERE)
PASSES = "passes"
RULING_S739 = ("Sam's routine prompt of 2026-11-25, as the S739 conductor's brief carries it: a record held for a gap "
               "is collected with its gap named and a lower score on the 0-100 bar, never held, unless the record is "
               "not the program's own")
# heading_not_in_text's shape: the record's own heading or first block says the program's heading is not in the text.
HEADING_GONE = re.compile(r"\bnot\s+(?:printed\s+|present\s+)?in\s+the\s+(?:extracted\s+)?text\b"
                          r"|\bheading\b[^.;]{0,40}\b(?:cut\s+off|on\s+(?:an?\s+|the\s+)?(?:earlier|preceding|previous)"
                          r"\s+page|on\s+the\s+page\s+before)\b", re.I)
# An award's unit band, as the state's file words it: "requiring 30S/45Q to fewer than 60S/90Q units", "60+S/90+Q".
BAND = re.compile(r"requiring\s+(\d+(?:\.\d+)?)S/\d+(?:\.\d+)?Q\s+to\s+fewer\s+than\s+(\d+(?:\.\d+)?)S/", re.I)
BAND_OPEN = re.compile(r"requiring\s+(\d+(?:\.\d+)?)\+S/", re.I)
OWN_LIST_SHARE = 0.5


def pair(v):
    if isinstance(v, dict):
        v = [v.get("min"), v.get("max")]
    return None if v is None or v[0] is None else [float(v[0]), float(v[1] if v[1] is not None else v[0])]


def same(a, b) -> bool:
    a, b = pair(a), pair(b)
    if a is None or b is None:
        return a is b
    return all(abs(x - y) <= NG.FIG_EPS for x, y in zip(a, b))


def notes(filed: dict) -> list[str]:
    return [str(n) for n in (filed.get("record") or {}).get("notes") or []]


def blocks(filed: dict, name: str) -> list[dict]:
    return [b for b in (filed.get("record") or {}).get("blocks") or [] if b.get("name") == name]


def course_rows(filed: dict, code: str) -> list[dict]:
    return [c for b in (filed.get("record") or {}).get("blocks") or [] for c in b.get("courses") or []
            if S.norm_code(c.get("code")) == S.norm_code(code)]


def codes(filed: dict) -> set:
    """Every course code the record holds, alternatives among them, normalized."""
    out = set()
    for b in (filed.get("record") or {}).get("blocks") or []:
        for c in b.get("courses") or []:
            out.add(S.norm_code(c.get("code")))
            out |= {S.norm_code(x.get("code")) for x in c.get("alternatives") or [] if isinstance(x, dict)}
    return out - {None, ""}


def scorer_passes(filed: dict) -> bool:
    """Today's scorer passes the record's own arithmetic (S.score with no closed list and no text, so no electives
    fill): such a record is rescored, never gap-filed (#3753's second reader, MAJOR)."""
    a = S.score(filed.get("record") or {}, [], "", filed.get("award")).get("arithmetic") or {}
    return a.get("status") == "equal"


def band(award: str | None):
    """The award's unit band [low, high), high None where the award names no ceiling; None where it names no band."""
    m = BAND.search(str(award or ""))
    if m:
        return float(m.group(1)), float(m.group(2))
    m = BAND_OPEN.search(str(award or ""))
    return (float(m.group(1)), None) if m else None


def in_band(award: str | None, total) -> bool | None:
    b, t = band(award), pair(total)
    if b is None or t is None:
        return None
    return t[0] + NG.FIG_EPS >= b[0] and (b[1] is None or t[1] < b[1] - NG.FIG_EPS)


@contextlib.contextmanager
def reading_off(which: str | None):
    """The scorer with one of today's program-total readings off: short_high (Sam, 2026-11-17) or meets (Sheet 120
    card 1). program_verdict is read from the module at call time, so the wrapper reaches every caller."""
    saved = S.program_verdict

    def verdict(*a, **k):
        v = saved(*a, **k)
        return {"pass": False, "status": "unequal"} if which and v.get(which) else v
    S.program_verdict = verdict
    try:
        yield
    finally:
        S.program_verdict = saved


def arithmetic(filed: dict, off: str | None = None) -> dict:
    """The record's arithmetic against its own state list, with the named reading off."""
    with reading_off(off):
        return C.fresh_score(filed)["arithmetic"]


def _bare(a: dict) -> dict:
    return {k: v for k, v in (a or {}).items() if k != "against"}


def todays(filed: dict, off: str | None = None) -> dict | None:
    """Today's arithmetic where the rescore is exact: the filed arithmetic is today's, or today's with the named
    reading off, "against" aside; else None (an older scorer's, not re-judged)."""
    filed_a = (filed.get("score") or {}).get("arithmetic") or {}
    now = arithmetic(filed)
    if now == filed_a or _bare(now) == _bare(filed_a) or _bare(arithmetic(filed, off)) == _bare(filed_a):
        return now
    return None


# ── a reading: the record re-added with the one change its note names ──────
def _one(rec: dict, name: str) -> dict | None:
    bs = [b for b in rec.get("blocks") or [] if b.get("name") == name]
    return bs[0] if len(bs) == 1 else None


def apply_ops(filed: dict, ops: list) -> dict | None:
    """The record with the entry's ops applied in order, or None where an op does not find exactly what it names.
      ("line", lo[, hi])            a requirement the page prints as a line of units with no course named.
      ("drop", block)               a block the printed total leaves out.
      ("pool", [blocks], lo[, hi])  several blocks the page prints one figure over: one units list at that figure.
      ("merge", [blocks])           the lists of one option, each kept as an alternative of its group: one list at
                                    the sum of their printed figures (S731's reading).
      ("choose", block, lo[, hi])   a block the page prints a units figure for, read without it.
      ("stated", block, lo[, hi])   a block's printed figure, read otherwise.
      ("units", code, lo[, hi])     a course's units as the page prints them.
      ("repeat", code, times)       a course the program takes more than once.
      ("uncount", code)             a course the printed total leaves out.
      ("total", lo[, hi])           the program's printed total, where a note quotes another figure.
      ("alone", block)              a block of an option group that every student takes: it leaves the group."""
    rec = copy.deepcopy(filed.get("record") or {})
    for op in ops:
        kind, args = op[0], list(op[1:])
        bl = rec.get("blocks") or []
        if kind == "line":
            lo, hi = args[0], args[1] if len(args) > 1 else args[0]
            rec["blocks"] = bl + [{"name": "the unit line", "rule": "choose_units", "minimum": lo, "option_group": None,
                                   "stated": {"min": lo, "max": hi}, "courses": []}]
        elif kind == "drop":
            if _one(rec, args[0]) is None:
                return None
            rec["blocks"] = [b for b in bl if b.get("name") != args[0]]
        elif kind in ("pool", "merge"):
            parts = [_one(rec, n) for n in args[0]]
            if any(p is None for p in parts) or len(parts) < 2:
                return None
            if kind == "merge":
                if len({p.get("option_group") for p in parts}) != 1 or parts[0].get("option_group") is None \
                        or any(pair(p.get("stated")) is None for p in parts):
                    return None
                lo = sum(pair(p.get("stated"))[0] for p in parts)
                hi = sum(pair(p.get("stated"))[1] for p in parts)
            else:
                lo, hi = args[1], args[2] if len(args) > 2 else args[1]
            one = {"name": " + ".join(args[0]), "rule": "choose_units", "minimum": lo, "stated": {"min": lo, "max": hi},
                   "option_group": parts[0].get("option_group"),
                   "courses": [c for p in parts for c in p.get("courses") or []]}
            rec["blocks"] = [b for b in bl if not any(b is p for p in parts[1:])]
            rec["blocks"][[i for i, b in enumerate(rec["blocks"]) if b is parts[0]][0]] = one
        elif kind in ("choose", "stated"):
            b = _one(rec, args[0])
            if b is None:
                return None
            lo, hi = args[1], args[2] if len(args) > 2 else args[1]
            b["stated"] = {"min": lo, "max": hi}
            if kind == "choose":
                b["rule"], b["minimum"] = "choose_units", lo
        elif kind == "units":
            rows = [c for b in bl for c in b.get("courses") or [] if S.norm_code(c.get("code")) == S.norm_code(args[0])]
            if len(rows) != 1:
                return None
            rows[0]["units"] = args[1]
            rows[0]["units_max"] = args[2] if len(args) > 2 else None
        elif kind == "repeat":
            rows = [c for b in bl for c in b.get("courses") or [] if S.norm_code(c.get("code")) == S.norm_code(args[0])]
            if len(rows) != 1 or S._num(rows[0].get("units")) is None:
                return None
            for b in bl:
                b["courses"] = [x for c in b.get("courses") or [] for x in
                                ([c] + [dict(c, code="%s (repeat %d)" % (c["code"], i)) for i in range(2, args[1] + 1)]
                                 if S.norm_code(c.get("code")) == S.norm_code(args[0]) else [c])]
        elif kind == "uncount":
            rows = [c for b in bl for c in b.get("courses") or [] if S.norm_code(c.get("code")) == S.norm_code(args[0])]
            if len(rows) != 1:
                return None
            for b in bl:
                b["courses"] = [c for c in b.get("courses") or [] if S.norm_code(c.get("code")) != S.norm_code(args[0])]
        elif kind == "total":
            lo, hi = args[0], args[1] if len(args) > 1 else args[0]
            rec.setdefault("program", {})["total_units"] = {"min": lo, "max": hi}
        elif kind == "alone":
            b = _one(rec, args[0])
            if b is None or b.get("option_group") is None:
                return None
            b["option_group"] = None
        else:
            raise SystemExit("an unknown op: %r" % (kind,))
    return rec


def closes(filed: dict, record: dict | None) -> bool:
    """Today's scorer, against the record's own state list, gives the printed total at both ends."""
    if record is None:
        return False
    a = C.fresh_score(dict(filed, record=record))["arithmetic"]
    return a.get("status") == "equal" and same(a.get("computed"), a.get("stated"))


# ── a shape: a kind whose sentence says the units cannot be checked ────────
def shape_open(filed: dict, e: dict) -> bool:
    """lists_not_closed: the named choice list prints no figure of its own (no minimum, no stated figure)."""
    bs = blocks(filed, e["open"])
    return len(bs) == 1 and bs[0].get("rule") in ("choose_courses", "choose_units") \
        and bs[0].get("minimum") is None and S._span(bs[0].get("stated")) is None


def shape_depends(filed: dict, e: dict) -> bool:
    """lists_not_closed: the named list's figure depends on another choice, and the record adds short of the total."""
    bs = blocks(filed, e["depends"])
    a = (filed.get("score") or {}).get("arithmetic") or {}
    comp, st = pair(a.get("computed")), pair(a.get("stated"))
    return len(bs) == 1 and bs[0].get("rule") in ("choose_courses", "choose_units") and comp is not None \
        and st is not None and comp[0] + NG.FIG_EPS < st[0]


def shape_heading_gone(filed: dict, e: dict) -> bool:
    """heading_not_in_text: the record's own section_heading, or its first block's name, says the program's heading is
    not in the text the read held; and the record places a course (a list was read)."""
    rec = filed.get("record") or {}
    first = ((rec.get("blocks") or [{}])[0] or {}).get("name") or ""
    said = HEADING_GONE.search(str((rec.get("program") or {}).get("section_heading") or "")) or HEADING_GONE.search(first)
    return bool(said) and bool(((filed.get("score") or {}).get("coverage") or {}).get("placed"))


def shape_cut(filed: dict, e: dict) -> bool:
    """noted_section_cut_off: the record adds short of its stated total at the low end, or states none."""
    return ARC.cut_short(filed)


def shape_no_total(filed: dict, e: dict) -> bool:
    """noted_no_total, option_lists_read_apart with no award total: the record states no total."""
    return (filed.get("score") or {}).get("arithmetic", {}).get("stated") is None


def shape_option_lists(filed: dict, e: dict) -> bool:
    """option_lists_read_apart: one option group whose concentration names put two or more lists under one
    concentration (kb/_program_piles_s727_arc.py option_lists, the kind's own statewide self-recall)."""
    return ARC.option_lists(filed)


SHAPES = {"open": shape_open, "depends": shape_depends, "heading_gone": shape_heading_gone, "cut": shape_cut,
          "no_total": shape_no_total, "option_lists": shape_option_lists}


class Pile:
    """One college's plan over its earlier plan's holds."""

    def __init__(self, *, college: str, slug: str, tag: str, name: str, prior, keys: tuple, reviewed: dict,
                 hand: dict, passed: dict | None = None, held_by: str = "", shapes: dict | None = None):
        self.college, self.slug, self.tag, self.name, self.prior = college, slug, tag, name, prior
        self.keys, self.reviewed, self.passed, self.hand = tuple(keys), reviewed, passed or {}, hand
        self.held_by = held_by
        self.shapes = dict(SHAPES, **(shapes or {}))
        self._sources = None
        self._read_pages = None
        for cn, e in reviewed.items():
            if e["gap"] not in NG.GAPS or e["gap"] not in NG.ARITH_SCORE:
                raise SystemExit("%s: %s is no filed kind" % (cn, e["gap"]))
            if not (e.get("ops") or e.get("shape") or e.get("rule")):
                raise SystemExit("%s: an entry names its kind's own check (ops, shape or rule)" % cn)

    # ── files ──
    def path(self, cn: str) -> str:
        return os.path.join(NG.COLLEGE_DIR, self.slug, "records", cn + ".json")

    def load(self, cn: str) -> dict | None:
        if not os.path.isfile(self.path(cn)):
            return None
        with open(self.path(cn), encoding="utf-8") as fh:
            return json.load(fh)

    def sources(self) -> dict:
        if self._sources is None:
            with open(os.path.join(NG.COLLEGE_DIR, self.slug, "sources.json"), encoding="utf-8") as fh:
                self._sources = {str(x.get("control_number")): x for x in json.load(fh)}
        return self._sources

    def read_pages(self) -> dict:
        """{control number: {read page urls}}: sources.json's source.url and the record file's source_url.
        capture.json's shared_pages is not read (p-own-page-guard-reads-read-pages-s727)."""
        if self._read_pages is not None:
            return self._read_pages
        out: dict = collections.defaultdict(set)
        for cn, s in self.sources().items():
            u = (s.get("source") or {}).get("url") if isinstance(s.get("source"), dict) else None
            if u:
                out[cn].add(u)
        for path in glob.glob(os.path.join(NG.COLLEGE_DIR, self.slug, "records", "*.json")):
            try:
                with open(path, encoding="utf-8") as fh:
                    f = json.load(fh)
            except (OSError, ValueError):
                continue
            if isinstance(f, dict) and f.get("source_url"):
                out[str(f.get("control_number"))].add(f["source_url"])
        self._read_pages = dict(out)
        return self._read_pages

    def shared_with(self, cn: str) -> list[str]:
        pages = self.read_pages()
        mine = pages.get(str(cn)) or set()
        return sorted(k for k, v in pages.items() if k != str(cn) and v & mine)

    def on_live_run(self, filed: dict, skip: tuple = ()) -> bool:
        """The committed record's run is the run the latest committed receipt posted for the row: the college's
        earlier module reads the receipts (its loads, rereads and every applied plan)."""
        return bool(self.prior.on_live_run(filed, skip))

    # ── the own-page guard ──
    def own(self, filed: dict, e: dict) -> str | None:
        """How the record is shown to be its program's own, or None. A record whose page no other program was read
        from needs no showing."""
        cn = str(filed.get("control_number"))
        mates = self.shared_with(cn)
        if not mates:
            return "its page is its own"
        rec = filed.get("record") or {}
        if e.get("own_section") and any(e["own_section"] in n for n in notes(filed)):
            return "own_section"
        heading = str((rec.get("program") or {}).get("section_heading") or "")
        if e.get("own_heading") and heading == e["own_heading"]:
            src = (self.sources().get(cn) or {}).get("source") or {}
            words = set(re.findall(r"[a-z0-9]+", str(filed.get("title") or "").lower()))
            others = [str(((self.load(m) or {}).get("record") or {}).get("program", {}).get("section_heading") or "")
                      for m in mates]
            if words and words <= set(re.findall(r"[a-z0-9]+", heading.lower())) \
                    and src.get("heading_named") is True and src.get("url") == filed.get("source_url") \
                    and heading not in others and not HEADING_GONE.search(heading):
                return "own_heading"
        if e.get("own_list") and e["gap"] == "heading_not_in_text":
            share = ((filed.get("score") or {}).get("coverage") or {}).get("share")
            if share is None or float(share) < OWN_LIST_SHARE:
                return None
            mine = codes(filed)
            st = ((filed.get("score") or {}).get("arithmetic") or {}).get("stated")
            for m in mates:
                g = self.load(m)
                if g is None:
                    continue
                theirs = codes(g)
                if len(mine & theirs) < OWN_LIST_SHARE * max(len(mine), 1):
                    continue
                # The same list: the award's own unit band tells them apart, or nothing does.
                if in_band(filed.get("award"), st) is not True or in_band(g.get("award"), st) is not False:
                    return None
            return "own_list"
        return None

    # ── the rescore ──
    def passing_score(self, filed: dict, skip: tuple = ()) -> tuple[dict, str] | None:
        """(the filed score with today's arithmetic, the note's words) where the PASSED entry stands: its words are
        the record's, the rescore is exact with its reading off, its reading and no other moves it, and the score
        passes as the live table counts it."""
        e = self.passed.get(str(filed.get("control_number")))
        if not e or filed.get("college") != self.college:
            return None
        words = next((n for n in notes(filed) if e["words"] in n), None)
        if not words or not self.on_live_run(filed, skip):
            return None
        if S.passes_live(filed.get("score")) and (filed.get("score") or {}).get("arithmetic") != arithmetic(filed):
            return None
        now = todays(filed, e["reading"])
        if now is None or not now.get(e["reading"]) or arithmetic(filed, e["reading"]).get("status") == "equal":
            return None
        sc = copy.deepcopy(filed.get("score") or {})
        sc["arithmetic"] = now
        sc["pass"] = C._overall(sc)
        return (sc, words) if S.passes_live(sc) else None

    # ── a named gap ──
    def words(self, filed: dict, e: dict) -> str | None:
        """The record's own words the gap files: the note holding the entry's words (words_at 'heading': the
        section_heading; 'missing': a missing_explained reason), and a second note where the entry names one."""
        rec = filed.get("record") or {}
        at = e.get("words_at")
        if at == "heading":
            pool = [str((rec.get("program") or {}).get("section_heading") or "")]
        elif at == "missing":
            pool = [str(m.get("why")) for m in rec.get("missing_explained") or [] if isinstance(m, dict)]
        else:
            pool = notes(filed)
        first = next((n for n in pool if e["words"] in n), None)
        if not first:
            return None
        if e.get("also_words"):
            second = next((n for n in notes(filed) if e["also_words"] in n), None)
            if not second:
                return None
            return first if second == first else first + " | " + second
        return first

    def kind_closes(self, filed: dict, e: dict) -> bool:
        if e.get("ops") and not closes(filed, apply_ops(filed, e["ops"])):
            return False
        shapes = e.get("shape") or []
        for sh in [shapes] if isinstance(shapes, str) else shapes:
            if not self.shapes[sh](filed, e):
                return False
        return bool(e.get("ops") or shapes or e.get("rule"))

    def _rule(self, filed: dict, arith: dict) -> tuple | None:
        sc = {k: v for k, v in (filed.get("score") or {}).items() if k not in ("gaps", "confidence")}
        sc["arithmetic"] = arith
        return NG.answer(dict(filed, score=sc))

    def gap_noted(self, filed: dict, reviewed: dict | None = None, skip: tuple = ()) -> tuple[str, str] | None:
        """(gap, words) where a reviewed entry stands on the record as it is filed; else None."""
        e = (self.reviewed if reviewed is None else reviewed).get(str(filed.get("control_number")))
        if not e or filed.get("college") != self.college:
            return None
        sc = filed.get("score") or {}
        a = sc.get("arithmetic") or {}
        if not NG.collectable(sc) or a.get("pass") or S.passes_live(sc):
            return None
        now = arithmetic(filed)
        # The record-rule guard, on the filed arithmetic and on today's: a row the rules name under another kind is
        # refused, and a rule entry stands only where the rule names its kind (its words are the rule's own).
        for arith in (a, now):
            rr = self._rule(filed, arith)
            if rr and rr[0] != e["gap"]:
                return None
        if e.get("rule"):
            rr = self._rule(filed, now)
            if not rr or rr[0] != e["gap"]:
                return None
            words = rr[1]
        else:
            words = self.words(filed, e)
            if not words:
                return None
        if not same(a.get("computed"), e["computed"]) or not same(a.get("stated"), e["stated"]):
            return None
        if now.get("status") == "equal" or scorer_passes(filed) or not self.on_live_run(filed, skip):
            return None
        if not self.kind_closes(filed, e):
            return None
        return e["gap"], words

    def claim(self, filed: dict, src: dict | None = None) -> str:
        cn = str(filed.get("control_number"))
        e = self.reviewed.get(cn) or self.passed.get(cn)
        s = (self.sources() if src is None else src).get(cn)
        if not e or not s:
            return "no capture"
        if self.own(filed, e) is None:
            return "the page is shared and nothing shows the record's own section"
        found = {S.norm_code(x) for x in s.get("codes_found") or []}
        if any(S.norm_code(c) not in found for c in e.get("courses") or []):
            return "a named course not found"
        listed = {S.norm_code(c.get("code")) for c in C.closed_list(self.college, cn)}
        if any(S.norm_code(c) in found | listed for c in e.get("outside") or []):
            return "a course the printed total leaves out is on the state's list"
        return "stands"

    def outcome(self, filed: dict, src: dict | None = None, skip: tuple = ()) -> tuple:
        """(answer, words, claim, rescored score): answer is a gap's name, PASSES, or 'none'."""
        cn = str(filed.get("control_number"))
        if cn in self.passed:
            j = self.passing_score(filed, skip)
            if not j:
                return "none", None, "the rescore does not stand", None
            c = self.claim(filed, src)
            return (PASSES, j[1], c, j[0]) if c == "stands" else ("none", None, c, None)
        j = self.gap_noted(filed, skip=skip)
        if not j:
            return "none", None, "no entry stands", None
        c = self.claim(filed, src)
        return (j[0], j[1], c, None) if c == "stands" else ("none", None, c, None)

    # ── the self-recall ──
    def precision(self, skip: tuple = ()) -> dict:
        out = {"read": 0, "right": 0, "wrong": [], "no_record_file": 0, "not_hand_held": 0,
               "by_answer": collections.Counter()}
        src = self.sources()
        for cn in self.keys:
            if cn not in self.hand:
                out["not_hand_held"] += 1
                continue
            f = self.load(cn)
            truth = "none" if self.hand[cn].startswith("held") else self.hand[cn]
            out["read"] += 1
            out["by_answer"][truth] += 1
            if f is None:
                out["no_record_file"] += 1
                got = "none"
            else:
                got = self.outcome(f, src, skip)[0]
            if got == truth:
                out["right"] += 1
            else:
                out["wrong"].append([cn, truth, got])
        out["by_answer"] = dict(out["by_answer"])
        return out

    def claim_checks(self) -> dict:
        out, not_standing = collections.Counter(), []
        src = self.sources()
        for cn in self.keys:
            f = self.load(cn)
            if f is None or not (self.gap_noted(f) or (cn in self.passed and self.passing_score(f))):
                continue
            c = self.claim(f, src)
            out[c] += 1
            if c != "stands":
                not_standing.append([cn, c])
        return {"counts": dict(out), "not_standing": not_standing}

    def boundaries(self) -> dict:
        out, wrong = collections.Counter(), []

        def tally(name, ok, cn):
            out["%s %s" % (name, "right" if ok else "wrong")] += 1
            if not ok:
                wrong.append([cn, name])

        def no_words(g, e):
            w = [e["words"]] + ([e["also_words"]] if e.get("also_words") else [])
            r = g["record"]
            for x in w:
                r["notes"] = [str(n).replace(x, "") for n in r.get("notes") or []]
                if e.get("words_at") == "heading":
                    r["program"]["section_heading"] = str(r["program"].get("section_heading") or "").replace(x, "")
                if e.get("words_at") == "missing":
                    r["missing_explained"] = [dict(m, why=str(m.get("why")).replace(x, ""))
                                              for m in r.get("missing_explained") or []]
            return g

        for cn in self.keys:
            f = self.load(cn)
            if f is None:
                continue
            if cn in self.passed and self.passing_score(f):
                e = self.passed[cn]
                tally("the note's words gone", self.passing_score(no_words(copy.deepcopy(f), e)) is None, cn)
                with reading_off(e["reading"]):
                    tally("its reading off",
                          not S.passes_live(dict(f["score"], arithmetic=C.fresh_score(f)["arithmetic"])), cn)
                g = copy.deepcopy(f)
                tp = pair(g["record"]["program"]["total_units"])
                g["record"]["program"]["total_units"] = {"min": tp[0] + 1, "max": tp[1] + 1}
                tally("the printed total one unit off", self.passing_score(g) is None, cn)
                continue
            if not self.gap_noted(f):
                continue
            e = self.reviewed[cn]
            if not e.get("rule"):
                tally("the note's words gone", self.gap_noted(no_words(copy.deepcopy(f), e)) is None, cn)
            g = copy.deepcopy(f)
            a = g["score"]["arithmetic"]
            a["stated"] = [a["stated"][0] + 1, a["stated"][1] + 1] if a.get("stated") is not None else [1.0, 1.0]
            tally("the stated total one unit off", self.gap_noted(g) is None, cn)
            g = copy.deepcopy(f)
            g["score"]["coverage"] = dict(g["score"]["coverage"], **{"pass": False})
            tally("coverage failing", self.gap_noted(g) is None, cn)
            if e.get("ops"):
                # The reading against a printed total one unit off no longer closes the record.
                g = copy.deepcopy(f)
                tp = pair(g["record"]["program"].get("total_units"))
                if tp is not None:
                    g["record"]["program"]["total_units"] = {"min": tp[0] + 1, "max": tp[1] + 1}
                    tally("the reading against a total one unit off", not self.kind_closes(g, e), cn)
            shapes = e.get("shape") or []
            for sh in [shapes] if isinstance(shapes, str) else shapes:
                g = self.break_shape(copy.deepcopy(f), e, sh)
                if g is not None:
                    tally("the %s shape broken" % sh, not self.kind_closes(g, e), cn)
            if self.shared_with(cn):
                g = copy.deepcopy(f)
                g["record"]["notes"] = [n for n in notes(g) if not (e.get("own_section") and e["own_section"] in n)]
                g["record"]["program"]["section_heading"] = "another heading"
                g["score"]["coverage"] = dict(g["score"]["coverage"], share=0.0)
                tally("its own section not shown", self.own(g, e) is None, cn)
        return {"counts": dict(out), "wrong": wrong}

    def break_shape(self, g: dict, e: dict, sh: str) -> dict | None:
        """The record with the shape's own figure moved, or None where the shape has no such reading here."""
        rec = g["record"]
        if sh == "open":
            for b in rec["blocks"]:
                if b.get("name") == e["open"]:
                    b["minimum"] = 1
        elif sh == "depends":
            g["score"]["arithmetic"]["computed"] = list(g["score"]["arithmetic"]["stated"])
        elif sh == "heading_gone":
            rec["program"]["section_heading"] = str(g.get("title"))
            if rec.get("blocks"):
                rec["blocks"][0]["name"] = "Required Courses"
        elif sh == "cut":
            if g["score"]["arithmetic"].get("stated") is None:
                return None
            g["score"]["arithmetic"]["computed"] = list(g["score"]["arithmetic"]["stated"])
        elif sh == "no_total":
            g["score"]["arithmetic"]["stated"] = [1.0, 1.0]
        elif sh == "option_lists":
            for b in rec["blocks"]:
                b["option_group"] = None
        else:
            return None
        return g

    # ── the plan ──
    def plan(self, write: bool) -> dict:
        rows, held, hits = [], [], []
        src = self.sources()
        with open(os.path.join(NG.COLLEGE_DIR, self.slug, "capture.json"), encoding="utf-8") as fh:
            year = json.load(fh).get("catalog_year")
        images = NG._load_images({self.college})
        for cn in self.keys:
            f = self.load(cn)
            if f is None:
                held.append({"control_number": cn, "why": self.hand.get(cn, "no record file")})
                continue
            if S.passes_live(f.get("score")) or (f.get("score") or {}).get("gaps"):
                continue
            gap, words, c, rescored = self.outcome(f, src)
            if gap == "none":
                held.append({"control_number": cn, "why": self.hand.get(cn, "not hand-held"), "claim": c})
                continue
            img = images.get((self.college, cn))
            if img is None or F.row_passes(img["checks"]):
                held.append({"control_number": cn, "why": "the load leaves it out, or its image passes"})
                continue
            if gap == PASSES:
                score = rescored
            else:
                s = src.get(cn) or {}
                score = copy.deepcopy(f["score"])
                # Today's arithmetic where the rescore is exact; else the filed one.
                score["arithmetic"] = todays(f) or f["score"]["arithmetic"]
                score["gaps"] = [{"gap": gap, "label": NG.GAPS[gap], "words": words}]
                score["confidence"] = NG.confidence(dict(f, score=score), gap, s.get("method"),
                                                    (s.get("catalog_year") or year) == year)
            hits.append((cn, f, score, gap, words, img))
        for cn, f, score, gap, words, img in hits:
            e = self.reviewed.get(cn) or self.passed.get(cn) or {}
            row = {"college": self.college, "control_number": cn, "award": f.get("award"),
                   "extracted_run": f.get("extracted_run"), "moves_to": gap, "words": words,
                   "confidence": score.get("confidence"), "own": self.own(f, e),
                   "path": os.path.relpath(self.path(cn), ROOT)}
            if e.get("lever"):
                row["lever"] = e["lever"]
            if gap == PASSES:
                row["reading"] = self.passed[cn]["reading"]
            if write:
                row["before_image"] = {k: img[k] for k in ("program_title", "award", "catalog_year", "source_url",
                                                           "measure", "total_min", "total_max", "record", "checks",
                                                           "extracted_run")}
                with open(self.path(cn), "w", encoding="utf-8") as fh:
                    json.dump(dict(f, score=score), fh, ensure_ascii=False, indent=1)
                    fh.write("\n")
            rows.append(row)
        if write and rows:
            after = NG._load_images({self.college})
            for r in rows:
                img = after[(self.college, r["control_number"])]
                want = [] if r["moves_to"] == PASSES else [r["moves_to"]]
                if img["record"] != r["before_image"]["record"] or (img["checks"].get("gaps") or []) != want:
                    raise SystemExit("%s: the record changed, or its image does not carry the gap" % r["control_number"])
                if r["moves_to"] == PASSES and not F.row_passes(img["checks"]):
                    raise SystemExit("%s: the rescored image does not pass" % r["control_number"])
                r["after_image"] = {"checks": img["checks"]}
        for i, r in enumerate(rows, 1):
            r["i"] = i
        return {"rows": rows, "held": held}

    def receipt_path(self, day: str, tag: str | None = None) -> str:
        return os.path.join(NG.RECEIPTS, "program_requirement_records_piles_s739_%s_%s_%s.json"
                            % (self.slug, day, tag or self.tag))

    def main(self, argv=None, doc: str = "") -> int:
        import argparse
        ap = argparse.ArgumentParser(description=(doc or __doc__).splitlines()[0])
        ap.add_argument("--dry-run", action="store_true")
        ap.add_argument("--tag", default=self.tag)
        a = ap.parse_args(argv)
        pr, cc, bd = self.precision(), self.claim_checks(), self.boundaries()
        print("precision: %s" % json.dumps(pr))
        print("claim checks: %s" % json.dumps(cc))
        print("boundaries: %s" % json.dumps(bd))
        if pr["wrong"] or pr["not_hand_held"] or bd["wrong"] or cc["not_standing"]:
            raise SystemExit("the self-recall reads a wrong answer: no plan is written")
        res = self.plan(write=not a.dry_run)
        by = dict(collections.Counter(r["moves_to"] for r in res["rows"]))
        print("plan: %d rows %s; held %d" % (len(res["rows"]), by, len(res["held"])))
        for r in res["rows"]:
            print("  %s %s (%s)" % (r["control_number"], r["moves_to"], r["own"]))
        if a.dry_run or not res["rows"]:
            return 0
        rows = res["rows"]
        stamp = time.gmtime()
        day = time.strftime("%Y-%m-%d", stamp)
        path = self.receipt_path(day, a.tag)
        gaps = sorted(g for g in by if g != PASSES)
        body = {"rule": "%s; %s; S739: %s's records %s held, read again by key: passed by a rescore where today's "
                        "scorer's one reading moves them, else collected with their gaps named where the record is "
                        "the program's own (no reread, no reconcile)" % (NG.RULING, RULING_S739, self.name, self.held_by),
                "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", stamp), "college": self.college,
                "keys": {"from": self.held_by, "members": list(self.keys)},
                "gaps": {g: NG.GAPS[g] for g in gaps}, "moved": len(rows), "by": by,
                "precision": pr, "claim_checks": cc, "boundaries": bd, "held": res["held"],
                "records": rows,
                "shared_pages": {r["control_number"]: self.shared_with(r["control_number"]) for r in rows
                                 if self.shared_with(r["control_number"])},
                "representation": "checks.gaps and checks.confidence added as the load reads the filed score (a "
                                  "passing row: checks.arithmetic to equal); checks.coverage, invented and the record "
                                  "unchanged",
                "claim_check_reads": ("Today's capture (sources.json): every course an entry names among the codes it "
                                      "found, and a course an entry says the printed total leaves out on neither it "
                                      "nor the state's list. A note's quoted figures are the reader's words, never "
                                      "re-read here."),
                "follow_verdict": P.FOLLOW_VERDICT,
                "pre_read": P.confirm_pre_read(rows), "pre_read_md5": md5_pre_read(rows),
                "apply": P.confirm_guarded_apply(rows, a.tag + " piles"),
                "rollback": NG.rollback_sql(rows, a.tag + " piles rollback")}
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(body, fh, ensure_ascii=False, indent=1)
            fh.write("\n")
        rel = os.path.relpath(path, ROOT)
        hdr = ("-- %s lane 2's cheap piles at %s (%d rows: %s). Each row's checks become the college\n"
               "-- load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or\n"
               "-- checks.arithmetic to equal for a rescore; the record unchanged. Receipt: %s\n"
               "-- (before_image per row).\n" % (a.tag.upper(), self.name, len(rows),
                                                 ", ".join("%s %d" % kv for kv in sorted(by.items())), rel))
        base = os.path.join(HERE, "migrations", "%s_%s_prreq_piles_" % (day, a.tag))
        parts = {
            "preread_md5.sql": ("-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb "
                                "text\n-- (the full before-values, the fallback where a hash does not match, are in "
                                "..._preread.sql).\n" + body["pre_read_md5"]),
            "preread.sql": "-- Pre-read, read-only: one SELECT, one JSON value.\n" + body["pre_read"],
            "apply.sql": ("-- Guarded UPDATE: only where the row holds the filed run, the before-image's record and "
                          "checks,\n-- and no person's check. It aborts, writing nothing, unless it matches the plan's "
                          "%d rows less\n-- those a person checked (listed as skipped_checked), or a row holds a "
                          "matching confirm.\n" % len(rows) + body["apply"]),
            "rollback.sql": ("-- Rollback, NOT applied: the before-image's checks back where the row still holds the\n"
                             "-- after-image, skipping and listing a row a person checked. A rollback lasts only until "
                             "the\n-- next load of that college: revert the record files too (git revert of this "
                             "plan's commit).\n" + body["rollback"]),
        }
        for name, text in parts.items():
            with open(base + name, "w", encoding="utf-8") as fh:
                fh.write(hdr + text + "\n")
        print("receipt %s" % rel)
        return 0


def md5_pre_read(rows: list[dict]) -> str:
    """F.md5_pre_read, its query sent to the local Postgres on stdin (the s730a module's form)."""
    real = F.subprocess.run

    def run(cmd, **kw):
        if "-c" in cmd:
            i = cmd.index("-c")
            return real(cmd[:i] + cmd[i + 2:], input=cmd[i + 1], **kw)
        return real(cmd, **kw)

    F.subprocess.run = run
    try:
        return F.md5_pre_read(rows)
    finally:
        F.subprocess.run = real
