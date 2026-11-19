#!/usr/bin/env python3
"""The units rules of the Commons Clarity ask, Part A: free corrections behind a self-check.

COBIx's brief on #3358 (Nov 17, section 2, cheap-piles item 2) carries Commons Clarity's ask (#3480, comment
6967374303; working in 6967375123). A2, A3 and A7 landed in #3478. This module runs the rest on the filed
records (kb/program_requirements_college/<slug>/records/<cn>.json) whose units check reads "unequal":

  A1  rescore only. The current scorer passes the record as filed. Held: a pass that leans on "electives
      fill the total" (the scorer runs with empty page text, so it never grants one here).
  A4  a blank "or" alternative takes its row's units and top-end units; a lab printed with no units right
      after its own lecture (BIOL C1001 then C1001L) counts as 0. A PAIRED ALTERNATIVE (S681 second reader, A):
      A4 never copies a row's units onto each member of a group whose members together replace the row. Two or
      more blank alternatives are such a group when the state's course file holds every member and their units
      add up to the row's units (or fall inside the row's printed range, where no note says "or" about a member
      and each member alone is worth less than the row's low figure: S683, the seven College of the Desert
      work-experience groups), or when a record note says they are taken together; the members then share one
      "together" label, which the scorer reads as one option. Each member carries its own units as the state's
      course file stores them when the file confirms them; otherwise the members carry no units, the group
      carries the row's units ("together_units"), and the record's note says so. A lecture alternative and its
      own blank lab right after it, which a note names as taken together, are such a group too, at the figure
      printed on the lecture (Long Beach City 44747: BIO 60 and BIO 60L, 4 and 1 in the state's file). The
      program total and the pass state are the same either way. A group only a note supports (the "row" call and
      the lab pair) is OFF on every further record (NOTE_PAIR_ON, below). pair_recall scores every pair call
      against a hand-held list (HAND_HELD_PAIRS), and a write stops on a call the list contradicts.
      THE PER-COURSE SELF-CHECK (S683; p-self-check-on-totals-misses-per-course-units-s681): every unit A4 writes
      on a course or an alternative is compared with the state's course file (state_differs). A new record whose
      A4 writes a figure outside what the file holds is left as filed; a correction that would write one stops
      the run. The units an earlier plan wrote that the file does not hold are listed in the receipt
      (state_differs_left) for the later task, never planned here.
  A5  a choose list whose own name or a record note says it may also take any course from List X (or the
      required core) gains that list's courses as options.
  A6  a choose list printed with the sum of every option (Chaffey History's "choose one" groups print 39
      and 21): the printed figure is dropped, so the N cheapest courses count.
  A8  a local degree printing a degree total with no general education units takes the college's own
      general education total, where every other filed local degree at that college carries one figure.

A6 IS OFF (A6_ON; the S680 conductor's ruling on the second reader's F5): it landed 0 of 4 held answers.

THE PLAN IN TWO PARTS (second reader's F1). A1 changes no record: its rows move checks.arithmetic alone. A
correction rewrites the record's blocks under the same run, so its rows take the full image the college load
(load_rows in kb/_program_requirements_college.py) posts for the committed record, guarded on the load's image of
main's record and checks (the before-image, in the receipt). Every apply aborts unless it matches exactly the
plan's count (F3; guard()).

THE SELF-CHECK. A correction is kept only when the corrected record's sum equals the catalog's printed total
exactly at both ends; otherwise the record stays as filed and flagged. A1 changes no record, so it keeps the
scorer's own verdict (meets and short high end included, Sam's rulings).

EXACTNESS. A filed score summed the record with the closed list's units (coci_program_courses), which the
committed files do not carry. So a record is judged only where the sum here is exact: the record (after the
correction) gives every course and option its own units, or this module's sum of the record as filed equals
the filed sum and the correction adds no course without units. Every other record is left alone.

A5 IS OFF ON EVERY FURTHER RECORD (A5_ON; d-a5-five-rows-stay-applied-s680): the five rows S680 applied stay
applied, and A5 moves no other record until its 31 wrong answers on held records are listed by cause.

THE NOTE-PAIR CALL IS OFF ON EVERY FURTHER RECORD (NOTE_PAIR_ON; S683, #3508 round two's second reader): a regex
over the notes made the call and held its answer, so it scored itself right, and it read mixed "and"/"or" choices
as one group (Southwestern 33132). The three S681 rows whose group rests on a note stay as planned (NOTE_PAIR_KEPT:
Citrus 11247 and 36626, Long Beach City 44747); every other record plans no group a note alone supports until a
hand-held list (HAND_HELD_PAIRS; the receipt's hand_held_pairs names the first six records) scores the call.

THE COLLECTION LANE'S COLLEGES are left out tonight: kb/collection_lane.py's COLLECTION_LANE, plus --skip-college
NAME. --college NAME (repeatable) limits the run to the colleges named: S681 runs the rules on the seven S680's
lane held and released (collection_lane.RELEASED), so the plan cannot re-plan a record S680 applied elsewhere.

    python3 kb/_program_requirements_units_rules.py --dry-run     # counts by rule, the self-check; writes nothing
    python3 kb/_program_requirements_units_rules.py --tag s680    # rewrite the records, write the receipt
    python3 kb/_program_requirements_units_rules.py --tag s681 --released   # the seven released colleges alone

The receipt (kb/receipts/program_requirement_records_units_rules_<date>_<tag>.json) lists each moved record
with its run and place i, and carries the pre-read, the guarded UPDATE (checks.arithmetic "unequal" to
"equal", only where the live row holds the filed run and still reads "unequal") and how the rollback is built
(kb/_program_requirements_rescore.py --rollback-from, which reads this receipt's shape).

Guard: tests/program_requirements_units_rules_test.py.
"""
from __future__ import annotations

import argparse
import collections
import copy
import glob
import json
import os
import re
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_requirements_score as S  # noqa: E402
import _program_requirements_reconcile as R  # noqa: E402
import _program_requirements_rescore as RS  # noqa: E402
import collection_lane as CL  # noqa: E402
import _guarded_sql as GS  # noqa: E402

ROOT = os.path.dirname(HERE)
GLOB = os.path.join(HERE, "program_requirements_college", "*", "records", "*.json")
RECEIPTS = os.path.join(HERE, "receipts")
TOL = 1e-6

from collection_lane import COLLECTION_LANE  # noqa: E402  (the one named filter)

ASK = "Commons Clarity's blocker round, Part A (#3480, comments 6967374303 and 6967375123), COBIx's brief on #3358"
RULES = ("A1", "A4", "A5", "A6", "A8")
# A6 is off (S680 conductor's ruling on the second reader's F5): it landed 0 of 4 held answers, and landing is its
# only evidence. Its code stays for the self-check; its records stay as filed, with the note they carry.
A6_ON = False
# A5 is off on every further record (d-a5-five-rows-stay-applied-s680): S680's five A5 rows stay applied, and A5
# moves no other record until its 31 wrong answers on held records are listed by cause. Its code stays for the
# self-check.
A5_ON = False
# The note-pair call is off on every further record (S683, #3508 round two's second reader, the third round of one
# finding class, so the design is replaced): a group that only a record note supports (paired_group's "row" and
# lab_pair) plans no new row until a hand-held list scores it. A regex over the notes both made those calls and
# held their answers, so it scored itself right, and it called mixed "and"/"or" choices one group (Southwestern
# 33132: PHYS 272 and PHYS 273, or CHEM 200). The three S681 rows whose group rests on a note stay as planned
# (NOTE_PAIR_KEPT). The code stays for the self-check.
NOTE_PAIR_ON = False
NOTE_PAIR_KEPT = frozenset({("Citrus College", "11247"), ("Citrus College", "36626"),
                            ("Long Beach City College", "44747")})
# The hand-held list pair_recall scores against: {(college, control_number, row code): (member codes, answer)},
# answer "pair" or "not one group", each entry a person's reading of the catalog. A plain session fills it; the
# S681 receipt's hand_held_pairs names the first six records to read (mixed "and"/"or" choices).
HAND_HELD_PAIRS: dict = {}


def note_pairs_for(college, control_number) -> bool:
    """Whether A4 may plan a group only a note supports at this record."""
    return NOTE_PAIR_ON or (college, str(control_number)) in NOTE_PAIR_KEPT
# The plan's two parts (second reader's F1): A1 changes no record, so its rows move checks.arithmetic alone; a
# correction rewrites the record's blocks, so its rows take the full image the college load would post.
CHECKS_ONLY = ("A1",)
WORDS = {
    "A1": "rescored as filed under today's adding-up rules",
    "A4": "a blank alternative takes its row's units",
    "A5": "a choose list takes the courses of the list it names",
    "A6": "a choose list printed with the sum of every option counts its cheapest courses",
    "A8": "the college's own general education total",
}


# ── the sum ────────────────────────────────────────────────────────────────
def arith(record: dict, award: str | None) -> dict:
    """The scorer's arithmetic for the record with no closed list and empty page text: empty text refuses
    every pass the page would have to confirm (an electives fill)."""
    return S.score(record, [], "", award)["arithmetic"]


def _entries(record: dict):
    for b in record.get("blocks") or []:
        for c in b.get("courses") or []:
            for e in [c] + S.alternatives(c):
                yield e


def _unitless(e: dict) -> bool:
    """No figure of its own, and no paired group's figure (a member of a group the state cannot confirm)."""
    return all(S._num(e.get(k)) is None for k in ("units", "units_max", "units_total", "together_units"))


# ── the state's course file ────────────────────────────────────────────────
MEMBERS_JS = os.path.join(ROOT, "unified_courses_members.js")
_STATE: dict | None = None


def state_units(path: str = MEMBERS_JS) -> dict:
    """{(college, normalized code): units} from the state's course file as unified_courses_members.js carries it
    (COCI's units per member course), only where every listing of the course agrees on one figure."""
    global _STATE
    if _STATE is not None and path == MEMBERS_JS:
        return _STATE
    import subprocess
    out = subprocess.run(["node", "-e", "global.window={};require(process.argv[1]);"
                          "process.stdout.write(JSON.stringify(window.CPL_UC_MEMBERS))", path],
                         capture_output=True, text=True, check=True).stdout
    mem = json.loads(out)
    cols = mem["colleges"]
    seen: dict = collections.defaultdict(set)
    for members in mem["members"].values():
        for m in members:
            u = S._num(m.get("u"))
            if u is not None:
                seen[(cols[m["c"]], S.norm_code(m.get("n")))].add(round(u, 3))
    got = {k: (lambda u: int(u) if u == int(u) else u)(next(iter(v))) for k, v in seen.items() if len(v) == 1}
    if path == MEMBERS_JS:
        _STATE = got
    return got


def units_at(college: str | None, state: dict | None = None):
    """A lookup for one college: code -> the state's units, or None."""
    st = state if state is not None else state_units()
    return lambda code: st.get((college, S.norm_code(code)))


# "both" alone is no pair: Cerritos 38756's note says DANC 131 and 132 "appear both as the 'or' choice" (S681).
PAIRED_NOTE = re.compile(r"\b(?:together|paired|pair)\b", re.I)
# A note that says "or" about a group's members (S683, #3508 round two's item 1): College of the Desert 36127's
# "BUAC 095A and CIS 095A are printed as 'or' options with no units of their own".
OR_NOTE = re.compile(r"\bor\b", re.I)


def _mentions(text: str, code) -> bool:
    """The note names the course: its code as printed, or its subject and its number apart (Long Beach City 44747's
    "BIO 60 & 60L" names BIO 60L)."""
    code = str(code)
    if code in text:
        return True
    parts = code.rsplit(" ", 1)
    return (len(parts) == 2 and bool(re.search(r"\b%s\b" % re.escape(parts[0]), text))
            and bool(re.search(r"(?<![\w.])%s\b" % re.escape(parts[1]), text)))


def _notes_pair(record: dict, codes: list[str]) -> bool:
    """A record note naming every member and saying they are taken together (Coastline 18223: "a paired
    alternative: both courses together replace SPAN C180")."""
    for n in record.get("notes") or []:
        t = str(n)
        if PAIRED_NOTE.search(t) and all(_mentions(t, c) for c in codes):
            return True
    return False


def _notes_or(record: dict, codes: list[str]) -> bool:
    """A record note naming any member and saying "or": the members are choices, so a sum inside the row's printed
    range is no evidence of a pair."""
    for n in record.get("notes") or []:
        t = str(n)
        if OR_NOTE.search(t) and any(_mentions(t, c) for c in codes):
            return True
    return False


def unitless(record: dict) -> collections.Counter:
    return collections.Counter(S.norm_code(e.get("code")) for e in _entries(record) if _unitless(e))


def self_contained(record: dict) -> bool:
    return not unitless(record)


def _pair(v) -> list[float] | None:
    return [round(float(v[0]), 2), round(float(v[1]), 2)] if v else None


def reproduces(filed: dict) -> bool:
    """This module's sum of the record as filed equals the filed sum."""
    a = (filed.get("score") or {}).get("arithmetic") or {}
    now = arith(filed.get("record") or {}, filed.get("award"))
    return _pair(now.get("computed")) == _pair(a.get("computed")) and now.get("against") == a.get("against")


def exact(filed: dict, corrected: dict) -> bool:
    if self_contained(corrected):
        return True
    extra = unitless(corrected) - unitless(filed.get("record") or {})
    return not extra and reproduces(filed)


def lands(a: dict) -> bool:
    """The self-check: the sum equals the printed total exactly at both ends."""
    c, s = a.get("computed"), a.get("stated")
    return bool(a.get("pass") and c and s and abs(float(c[0]) - float(s[0])) <= TOL
                and abs(float(c[1]) - float(s[1])) <= TOL)


# ── the corrections ────────────────────────────────────────────────────────
def _code_key(code) -> str:
    return S.norm_code(code) or ""


def _blank(a) -> bool:
    return (isinstance(a, dict) and bool(a.get("code")) and _unitless(a)) or (isinstance(a, str) and bool(a))


def _code(a) -> str:
    return a["code"] if isinstance(a, dict) else a


def paired_group(record: dict, c: dict, units_of=None, note_pairs: bool = True) -> tuple[str | None, list]:
    """("state", units per member) or ("row", []) when the row's blank alternatives are one group taken together in
    its place, else (None, []). "state": the state's course file holds every member and their units add up to the
    row's units, or fall inside the row's printed range where no record note says "or" about a member and each
    member alone carries less than the row's low figure (S683, #3508 round two's item 1: College of the Desert's
    work-experience rows, AGEH 095A 1-4 with BUAC 095A and CIS 095A at 1 each, are three choices; at 41319 no note
    says so, and each member is worth the row's 1). "row": a record note says so, and the file does not."""
    blanks = [a for a in c.get("alternatives") or [] if _blank(a)]
    if len(blanks) < 2:
        return None, []
    lo = S._num(c.get("units"))
    hi = S._num(c.get("units_max"))
    hi = lo if hi is None else hi
    su = [units_of(_code(a)) if units_of else None for a in blanks]
    codes = [_code(a) for a in blanks]
    if lo is not None and all(u is not None for u in su):
        tot = sum(su)
        in_range = (lo - TOL <= tot <= hi + TOL and not _notes_or(record, codes)
                    and all(u < lo - TOL for u in su))
        if abs(tot - lo) <= TOL or in_range:
            return "state", su
    if note_pairs and _notes_pair(record, codes):
        return "row", []
    return None, []


def lab_pair(record: dict, c: dict, units_of=None, note_pairs: bool = True) -> tuple[str | None, int | None, list]:
    """(kind, j, units) when the row's alternative j carries units and alternative j + 1 is its own lab printed with
    no units (BIO 60, then BIO 60L), and a record note names the two as taken together: the lecture's figure is the
    pair's (Long Beach City 44747: "BIO 60 & 60L is a combined option (both courses together, 5 units printed for the
    pair)"; S683, #3508 round two's item 2). "state": the state's course file holds both and they add up to that
    figure, and each carries its own; "row": the file does not, and the pair carries the figure. Else (None, None,
    [])."""
    alts = c.get("alternatives") or []
    if not note_pairs:
        return None, None, []
    for j in range(len(alts) - 1):
        a, b = alts[j], alts[j + 1]
        if not (isinstance(a, dict) and a.get("code") and not _unitless(a) and not a.get("together")
                and _blank(b) and _code_key(_code(b)) == _code_key(a["code"]) + "L"):
            continue
        if not _notes_pair(record, [a["code"], _code(b)]):
            continue
        lo = S._num(a.get("units"))
        hi = S._num(a.get("units_max"))
        su = [units_of(a["code"]), units_of(_code(b))] if units_of else [None, None]
        if lo is not None and hi in (None, lo) and all(u is not None for u in su) and abs(sum(su) - lo) <= TOL:
            return "state", j, su
        return "row", j, []
    return None, None, []


def state_differs(before: dict, after: dict, units_of) -> list[dict]:
    """Every course or alternative whose units a rule wrote (they differ between the two records) where the state's
    course file holds a figure outside what was written: [{"code", "written": [lo, hi], "state"}]. A member that
    carries no units of its own under its group's figure is no write here (S683, #3508 round two's item 2: Long Beach
    City 44747's BIO 60L read 4-5 units against the file's 1). A written range holds the file's figure when the figure
    lies inside it (ANAT 41 at 4-5, the file's 5)."""
    out = []
    for b, ob in zip(after.get("blocks") or [], before.get("blocks") or []):
        for c, oc in zip(b.get("courses") or [], ob.get("courses") or []):
            for a, oa in [(c, oc)] + list(zip(c.get("alternatives") or [], oc.get("alternatives") or [])):
                if not isinstance(a, dict):
                    continue
                od = oa if isinstance(oa, dict) else {"code": oa}
                lo, hi = S._num(a.get("units")), S._num(a.get("units_max"))
                if lo is None or (lo, hi) == (S._num(od.get("units")), S._num(od.get("units_max"))):
                    continue
                v = units_of(a.get("code")) if units_of else None
                hi = lo if hi is None else hi
                if v is not None and not (lo - TOL <= v <= hi + TOL):
                    out.append({"code": a.get("code"), "written": [lo, hi], "state": v})
    return out


def a4_blank_alternative(record: dict, units_of=None, note_pairs: bool = True) -> tuple[dict, list[dict]]:
    """units_of(code) is the state's units for a course at the record's college (units_at); without it no group
    can be confirmed by the file, and a group a note names carries its row's units."""
    out = copy.deepcopy(record)
    notes = []
    for b in out.get("blocks") or []:
        prev = None
        for c in b.get("courses") or []:
            own = S._num(c.get("units"))
            kind, su = paired_group(out, c, units_of, note_pairs) if own is not None else (None, [])
            if kind:
                blanks = [a for a in c.get("alternatives") or [] if _blank(a)]
                label = " + ".join(_code(a) for a in blanks)
                by_code = dict(zip([_code(a) for a in blanks], su or [None] * len(blanks)))
                alts = []
                for a in c.get("alternatives") or []:
                    if _blank(a):
                        base = dict(a) if isinstance(a, dict) else {
                            "code": a, "catalog_addition": bool(c.get("catalog_addition"))}
                        if kind == "state":
                            base.update(units=by_code[_code(a)], units_max=None, together=label)
                        else:
                            base.update(units=None, units_max=None, together=label,
                                        together_units=c.get("units"), together_units_max=c.get("units_max"))
                        a = base
                    alts.append(a)
                c["alternatives"] = alts
                if kind == "state":
                    words = ("%s together replace %s: each carries its own units from the state's course file "
                             "(%s; %g in all)" % (" and ".join(by_code), c.get("code"),
                                                  ", ".join("%g" % u for u in su), sum(su)))
                else:
                    words = ("%s together replace %s, as the record's note says; the state's course file does not "
                             "confirm each one's units, so the group carries its row's %s and no course carries "
                             "its own" % (" and ".join(by_code), c.get("code"), _span_words(c)))
                notes.append({"rule": "A4", "code": label, "together": kind, "words": words})
                prev = c
                continue
            if own is not None:
                lkind, lj, lsu = lab_pair(out, c, units_of, note_pairs)
                alts = []
                for j, a in enumerate(c.get("alternatives") or []):
                    if lkind and j in (lj, lj + 1):
                        if j == lj:
                            lab_of, fig = _code(c["alternatives"][lj + 1]), (a.get("units"), a.get("units_max"))
                            label = "%s + %s" % (a["code"], lab_of)
                        base = dict(a) if isinstance(a, dict) else {
                            "code": a, "catalog_addition": bool(c.get("catalog_addition"))}
                        if lkind == "state":
                            base.update(units=lsu[j - lj], units_max=None, together=label)
                        else:
                            base.update(units=None, units_max=None, together=label,
                                        together_units=fig[0], together_units_max=fig[1])
                        alts.append(base)
                        if j == lj + 1:
                            lec = c["alternatives"][lj]["code"]
                            words = ("%s and its lab %s together are one option in place of %s, as the record's note "
                                     "says: %s" % (lec, lab_of, c.get("code"),
                                                   "each carries its own units from the state's course file (%s; %g "
                                                   "in all)" % (", ".join("%g" % u for u in lsu), sum(lsu))
                                                   if lkind == "state" else
                                                   "the state's course file does not confirm each one's units, so the "
                                                   "pair carries the %g printed for it" % S._num(fig[0])))
                            notes.append({"rule": "A4", "code": label, "together": lkind, "words": words})
                        continue
                    if isinstance(a, dict) and a.get("code") and _unitless(a):
                        a = dict(a, units=c.get("units"), units_max=c.get("units_max"))
                        notes.append({"rule": "A4", "code": a["code"],
                                      "words": "%s, printed as an alternative to %s with no units, takes its row's %s"
                                               % (a["code"], c.get("code"), _span_words(c))})
                    elif isinstance(a, str) and a:
                        notes.append({"rule": "A4", "code": a,
                                      "words": "%s, printed as an alternative to %s with no units, takes its row's %s"
                                               % (a, c.get("code"), _span_words(c))})
                        a = {"code": a, "units": c.get("units"), "units_max": c.get("units_max"),
                             "catalog_addition": bool(c.get("catalog_addition"))}
                    alts.append(a)
                if alts:
                    c["alternatives"] = alts
            elif (_unitless(c) and prev is not None and S._num(prev.get("units")) is not None
                  and _code_key(c.get("code")) == _code_key(prev.get("code")) + "L"):
                c["units"] = 0
                notes.append({"rule": "A4", "code": c.get("code"),
                              "words": "%s, a lab printed with no units after its lecture %s, counts 0"
                                       % (c.get("code"), prev.get("code"))})
            prev = c
    return out, notes


def _span_words(c: dict) -> str:
    lo, hi = S._num(c.get("units")), S._num(c.get("units_max"))
    return "%g units" % lo if hi is None or hi == lo else "%g-%g units" % (lo, hi)


ANY_FROM = re.compile(r"\bany\s+(?:other\s+|additional\s+)?courses?\s+(?:not\s+(?:already\s+)?(?:used|taken|selected)\s+)?"
                      r"(?:from|in|listed\s+in|listed\s+under)\s+(?:the\s+)?"
                      r"(list\s+[A-Z0-9]{1,2}\b|required\s+core|core|required\s+courses)", re.I)


def _target_blocks(blocks: list[dict], name: str, me: int) -> list[int]:
    n = name.lower()
    out = []
    for j, b in enumerate(blocks):
        if j == me:
            continue
        bn = (b.get("name") or "").lower()
        if n.startswith("list"):
            if re.search(r"\b%s\b" % re.escape(n), bn):
                out.append(j)
        elif b.get("rule") == "all" and re.search(r"\b(?:core|required)\b", bn):
            out.append(j)
    return out


def a5_any_course_from(record: dict) -> tuple[dict, list[dict]]:
    out = copy.deepcopy(record)
    blocks = out.get("blocks") or []
    notes = []
    note_text = " ".join(str(n) for n in (out.get("notes") or []))
    for i, b in enumerate(blocks):
        if b.get("rule") not in ("choose_courses", "choose_units"):
            continue
        said = ANY_FROM.search(b.get("name") or "")
        if not said and b.get("name"):
            for m in ANY_FROM.finditer(note_text):
                # A note counts only when it names this list.
                window = note_text[max(0, m.start() - 120):m.end()]
                if (b.get("name") or "").lower()[:40] in window.lower():
                    said = m
                    break
        if not said:
            continue
        have = {_code_key(c.get("code")) for c in b.get("courses") or []}
        added = []
        for j in _target_blocks(blocks, said.group(1), i):
            for c in blocks[j].get("courses") or []:
                k = _code_key(c.get("code"))
                if k and k not in have:
                    have.add(k)
                    b.setdefault("courses", []).append(copy.deepcopy(c))
                    added.append(c.get("code"))
        if added:
            notes.append({"rule": "A5", "block": b.get("name"),
                          "words": "'%s' says any course from %s: %d courses added as options (%s)"
                                   % (b.get("name"), said.group(1), len(added), ", ".join(map(str, added[:6])))})
    return out, notes


def a6_sum_of_options(record: dict) -> tuple[dict, list[dict]]:
    out = copy.deepcopy(record)
    notes = []
    for b in out.get("blocks") or []:
        if b.get("rule") != "choose_courses":
            continue
        n, courses, st = S._num(b.get("minimum")), b.get("courses") or [], S._span(b.get("stated"))
        if n is None or not st or not courses or n >= len(courses) or st[0] <= 0 or st[0] != st[1]:
            continue
        figs = []
        for c in courses:
            u, um = S._num(c.get("units")), S._num(c.get("units_max"))
            if u is None or (um is not None and um != u) or S.alternatives(c):
                figs = None
                break
            figs.append(u)
        if figs is None or abs(sum(figs) - st[0]) > TOL:
            continue
        b["stated"] = None
        notes.append({"rule": "A6", "block": b.get("name"),
                      "words": "'%s' prints %g, the sum of all %d options; it chooses %d, so its %d cheapest count"
                               % (b.get("name"), st[0], len(courses), int(n), int(n))})
    return out, notes


def college_ge_totals(files: list[dict]) -> dict:
    """{college: (lo, hi)} where every filed local degree carrying general education units carries the same
    single figure, from at least 3 records."""
    seen: dict = collections.defaultdict(set)
    for f in files:
        prog = (f.get("record") or {}).get("program") or {}
        if not R.awards_match("local", f.get("award")) or S.transfer_degree(f.get("award"), prog):
            continue
        ge = S._span(prog.get("ge_units"))
        if ge:
            seen[f["college"]].add(ge)
    counts = collections.Counter(f["college"] for f in files
                                 if S._span(((f.get("record") or {}).get("program") or {}).get("ge_units"))
                                 and R.awards_match("local", f.get("award")))
    return {c: next(iter(v)) for c, v in seen.items() if len(v) == 1 and counts[c] >= 3}


def a8_college_ge(record: dict, award: str | None, ge_total: tuple | None) -> tuple[dict, list[dict]]:
    prog = (record or {}).get("program") or {}
    if (ge_total is None or not R.awards_match("local", award) or S.transfer_degree(award, prog)
            or S._span(prog.get("degree_total")) is None or S._span(prog.get("ge_units")) is not None):
        return record, []
    out = copy.deepcopy(record)
    out["program"]["ge_units"] = {"min": ge_total[0], "max": ge_total[1]}
    return out, [{"rule": "A8", "field": "ge_units", "was": prog.get("ge_units"),
                  "words": "the college's own general education total for local degrees, %g units, printed on "
                           "every other local degree it files" % ge_total[0]}]


# ── one record ─────────────────────────────────────────────────────────────
def judge(filed: dict, ge_totals: dict, state: dict | None = None) -> dict:
    """{"rule", "why", "record", "notes", "arith"}: the first rule whose self-check lands, or why none moved.
    state is the state's course file (state_units(); read once when not given)."""
    a = (filed.get("score") or {}).get("arithmetic") or {}
    rec, award = filed.get("record") or {}, filed.get("award")
    if a.get("status") != "unequal":
        return {"rule": None, "why": "not unequal"}
    now = arith(rec, award)
    if now.get("pass") and now.get("status") == "equal" and exact(filed, rec):
        return {"rule": "A1", "record": rec, "notes": [], "arith": now}
    tried = []
    units_of = units_at(filed.get("college"), state)
    np = note_pairs_for(filed.get("college"), filed.get("control_number"))
    for rule, fn in (("A4", lambda r: a4_blank_alternative(r, units_of, np)), ("A5", a5_any_course_from),
                     ("A6", a6_sum_of_options),
                     ("A8", lambda r: a8_college_ge(r, award, ge_totals.get(filed["college"])))):
        if (rule == "A6" and not A6_ON) or (rule == "A5" and not A5_ON):
            continue
        new, notes = fn(rec)
        if not notes:
            continue
        if not exact(filed, new):
            tried.append(rule + " not exact")
            continue
        if state_differs(rec, new, units_of):
            # The per-course self-check (S683, #3508 round two's item 2): a total that lands proves nothing about
            # a course's own units (p-self-check-on-totals-misses-per-course-units-s681).
            tried.append(rule + " writes units the state's course file does not hold")
            continue
        got = arith(new, award)
        if lands(got):
            return {"rule": rule, "record": new, "notes": notes, "arith": got}
        tried.append(rule + " does not land")
    return {"rule": None, "why": "; ".join(tried) or "no rule applies"}


def held(college: str | None, skip: tuple = ()) -> bool:
    return CL.held(college, skip)


def load_files(skip: tuple = (), only: tuple = ()) -> list[tuple[str, dict]]:
    """The filed records outside the collection lane; with only, at the colleges it names alone."""
    out = []
    for path in sorted(glob.glob(GLOB)):
        with open(path, encoding="utf-8") as fh:
            d = json.load(fh)
        if only and d.get("college") not in only:
            continue
        if not held(d.get("college"), skip):
            out.append((path, d))
    return out


def self_check(files: list[dict], ge_totals: dict, state: dict | None = None) -> dict:
    """Each correction on the records whose answer is already held (their units check reads "equal" today):
    right = the correction applies and the record still lands exactly; wrong = it applies, the sum is exact,
    and the record stops landing. A correction is applied only behind lands(), so a wrong
    here is a record the rule would break as a bare adding-up rule, never one it writes."""
    out = {r: {"applies": 0, "right": 0, "wrong": 0, "not_exact": 0, "state_differs": 0} for r in RULES if r != "A1"}
    for f in files:
        a = (f.get("score") or {}).get("arithmetic") or {}
        rec, award = f.get("record") or {}, f.get("award")
        if a.get("status") != "equal" or not lands(a) or not (self_contained(rec) or reproduces(f)):
            continue
        units_of = units_at(f.get("college"), state)
        for rule, fn in (("A4", lambda r: a4_blank_alternative(r, units_of)), ("A5", a5_any_course_from),
                         ("A6", a6_sum_of_options),
                         ("A8", lambda r: a8_college_ge(r, award, ge_totals.get(f["college"])))):
            new, notes = fn(rec)
            if not notes:
                continue
            out[rule]["applies"] += 1
            if not exact(f, new):
                out[rule]["not_exact"] += 1
                continue
            if state_differs(rec, new, units_of):
                out[rule]["state_differs"] += 1
                continue
            out[rule]["right" if lands(arith(new, award)) else "wrong"] += 1
    return out


def pair_recall(files: list[dict], state: dict | None = None, hand_held: dict | None = None) -> dict:
    """The pair call scored against a hand-held list (S683, #3508 round two's second reader). For every row with two
    or more blank alternatives, or a lecture and its blank lab among them, on every filed record, the call is the one
    the planner would make there (the note-pair call only where note_pairs_for allows it). No regex over the notes
    holds an answer: the old held "pair" came from _notes_pair, the same regex behind the "row" call, so a note pair
    always scored right. Answers come from hand_held (HAND_HELD_PAIRS by default): right or wrong against a person's
    reading. Beside that, a pair the state's file made where a note names a member and says "or" is counted as
    "pair against an or note", evidence to read and not an answer, and a note pair the planner may still make is
    "note pair, unscored". {"tally": {...}, "wrong": [...]}; wrong lists only the hand-held disagreements."""
    held = HAND_HELD_PAIRS if hand_held is None else hand_held
    tally, wrong = collections.Counter(), []
    for f in files:
        rec = f.get("record") or {}
        units_of = units_at(f.get("college"), state)
        np = note_pairs_for(f.get("college"), f.get("control_number"))
        for b in rec.get("blocks") or []:
            for c in b.get("courses") or []:
                if S._num(c.get("units")) is None:
                    continue
                blanks = [_code(a) for a in c.get("alternatives") or [] if _blank(a)]
                calls = []
                if len(blanks) >= 2:
                    calls.append((paired_group(rec, c, units_of, np)[0], blanks))
                lk, lj, _ = lab_pair(rec, c, units_of, np)
                if lk:
                    calls.append(("lab", [c["alternatives"][lj]["code"], _code(c["alternatives"][lj + 1])]))
                for kind, codes in calls:
                    call = "pair" if kind else "or"
                    ans = held.get((f.get("college"), str(f.get("control_number")), c.get("code")))
                    if ans is not None:
                        want = "pair" if ans[1] == "pair" and set(ans[0]) == set(codes) else "or"
                        k = "%s held %s" % (call, "right" if call == want else "wrong")
                        if call != want:
                            wrong.append("%s %s %s (%s, held %s)" % (f.get("college"), f.get("control_number"),
                                                                     " + ".join(codes), call, ans[1]))
                    elif kind in ("row", "lab"):
                        k = "note pair, unscored"
                    elif kind == "state" and _notes_or(rec, codes):
                        k = "pair against an or note"
                    else:
                        k = "%s unheld" % call
                    tally[k] += 1
    return {"tally": dict(sorted(tally.items())), "wrong": wrong}


def _load_images(colleges: set) -> dict:
    """{(college, control_number): the row the college load would post} for the colleges named, built by the load's
    own code (load_rows in kb/_program_requirements_college.py) from the committed files as they stand now."""
    import _program_requirements_college as C
    out = {}
    for college in sorted(colleges):
        rows, _ = C.load_rows(college)
        for r in rows:
            out[(college, str(r["control_number"]))] = r
    return out


def corrections(receipt_path: str, write: bool, skip: tuple = (), state: dict | None = None) -> list[dict]:
    """The rows an applied A4 plan wrote that the paired-alternative rule changes (S681 second reader, A): fixed A4
    reruns on each applied A4 row's record as filed before that plan (its before-image's blocks and program, the
    file's notes), and a row whose blocks come out different is planned again from the row that plan wrote (its
    after-image, the guard's before-image), so the earlier plan's own rollback stays valid behind this one."""
    with open(receipt_path, encoding="utf-8") as fh:
        rc = json.load(fh)
    rel = os.path.relpath(os.path.abspath(receipt_path), ROOT)
    out = []
    for r in rc["records"]:
        if r["rule"] != "A4" or (r.get("applied") or {}).get("part") != "full_row" or held(r["college"], skip):
            continue
        path = os.path.join(ROOT, r["path"])
        with open(path, encoding="utf-8") as fh:
            filed = json.load(fh)
        if (filed["record"].get("blocks") != r["after_image"]["record"].get("blocks")
                or str(filed.get("extracted_run")) != str(r["extracted_run"])):
            raise SystemExit("%s %s moved since %s applied: replan by hand" % (r["college"], r["control_number"], rel))
        orig = copy.deepcopy(filed["record"])
        orig["blocks"] = copy.deepcopy(r["before_image"]["record"]["blocks"])
        orig["program"] = copy.deepcopy(r["before_image"]["record"]["program"])
        units_of = units_at(r["college"], state)
        new, notes = a4_blank_alternative(orig, units_of, note_pairs_for(r["college"], r["control_number"]))
        if new.get("blocks") == filed["record"].get("blocks"):
            continue
        # The per-course self-check on what this write writes: every unit that moves from the row the earlier plan
        # wrote must agree with the state's course file (S683, #3508 round two's item 2).
        bad = state_differs(filed["record"], new, units_of)
        if bad:
            raise SystemExit("%s %s: the correction writes units the state's course file does not hold: %s" % (
                r["college"], r["control_number"], "; ".join("%(code)s %(written)s against %(state)s" % x for x in bad)))
        got = arith(new, filed.get("award"))
        if not lands(got):
            raise SystemExit("%s %s: the paired-alternative rule does not land" % (r["college"], r["control_number"]))
        old = filed["score"]["arithmetic"]
        arith_new = dict(got, rescored="%s; paired alternatives corrected (S681 second reader, A)"
                         % old.get("rescored", "A4"))
        out.append({"college": r["college"], "control_number": r["control_number"], "award": filed.get("award"),
                    "extracted_run": r["extracted_run"], "rule": "A4", "against": got.get("against"),
                    "corrects": {"receipt": rel, "i": r["i"]},
                    "before": {"status": old.get("status"), "computed": old.get("computed"), "stated": old.get("stated")},
                    "after": {"status": got.get("status"), "computed": got.get("computed"), "stated": got.get("stated")},
                    "notes": [n["words"] for n in notes if n.get("together")],
                    "state_differs_left": state_differs(r["before_image"]["record"], new, units_of),
                    "path": r["path"],
                    "before_image": {"record": r["after_image"]["record"], "checks": r["after_image"]["checks"]}})
        if write:
            filed["record"] = new
            filed["reconciled"] = ([n for n in filed.get("reconciled") or [] if n.get("statewide") != "units_rules_A4"]
                                   + [dict(n, statewide="units_rules_A4") for n in notes])
            filed["score"]["arithmetic"] = arith_new
            filed["score"]["pass"] = RS.passes(filed["score"])
            with open(path, "w", encoding="utf-8") as fh:
                json.dump(filed, fh, ensure_ascii=False, indent=1)
                fh.write("\n")
    return out


def applied_differs(receipt_path: str, state: dict | None = None) -> list[dict]:
    """The units an applied plan's A4 rows wrote that the state's course file does not hold, read from the receipt's
    before- and after-images: the later task's worklist (#3508 round two's item 4), listed and never planned here."""
    with open(receipt_path, encoding="utf-8") as fh:
        rc = json.load(fh)
    out = []
    for r in rc["records"]:
        if r["rule"] != "A4" or not r.get("before_image") or not r.get("after_image"):
            continue
        for x in state_differs(r["before_image"]["record"], r["after_image"]["record"], units_at(r["college"], state)):
            out.append(dict(x, college=r["college"], control_number=r["control_number"]))
    return out


def run(write: bool, skip: tuple = (), only: tuple = (), correct_from: str | None = None) -> dict:
    bad = [c for c in only if held(c, skip)]
    if bad:
        raise SystemExit("the collection lane holds %s: never in a plan" % ", ".join(bad))
    pairs = load_files(skip, only)
    files = [d for _, d in pairs]
    ge_totals = college_ge_totals(files)
    why = collections.Counter()
    moved = corrections(correct_from, write, skip) if correct_from else []
    before_images = None
    if write:
        # The load's image of every record at a college a correction touches, from the files before any rewrite.
        hit = {f["college"] for f in files if (judge(f, ge_totals).get("rule") or "A1") not in CHECKS_ONLY}
        before_images = _load_images(hit)
    for path, filed in pairs:
        j = judge(filed, ge_totals)
        if j["rule"] is None:
            if j["why"] != "not unequal":
                why[j["why"]] += 1
            continue
        old = filed["score"]["arithmetic"]
        new = dict(j["arith"])
        new["rescored"] = "%s %s (%s)" % (j["rule"], WORDS[j["rule"]], ASK)
        before_image = None
        if before_images is not None and j["rule"] not in CHECKS_ONLY:
            img = before_images.get((filed["college"], str(filed["control_number"])))
            if img is None:
                raise SystemExit("the load does not post %s %s" % (filed["college"], filed["control_number"]))
            before_image = {k: img[k] for k in ("program_title", "award", "catalog_year", "source_url", "measure",
                                                "total_min", "total_max", "record", "checks", "extracted_run")}
        moved.append({"college": filed["college"], "control_number": filed["control_number"],
                      "award": filed.get("award"), "extracted_run": filed.get("extracted_run"),
                      "rule": j["rule"], "against": new.get("against"),
                      "before": {"status": old.get("status"), "computed": old.get("computed"), "stated": old.get("stated")},
                      "after": {"status": new.get("status"), "computed": new.get("computed"), "stated": new.get("stated")},
                      "notes": [n["words"] for n in j["notes"]],
                      "path": os.path.relpath(path, ROOT)})
        if before_image is not None:
            moved[-1]["before_image"] = before_image
        if write:
            filed["record"] = j["record"]
            if j["notes"]:
                filed["reconciled"] = (filed.get("reconciled") or []) + [dict(n, statewide="units_rules_" + n["rule"])
                                                                         for n in j["notes"]]
            filed["score"]["arithmetic"] = new
            filed["score"]["pass"] = RS.passes(filed["score"])
            with open(path, "w", encoding="utf-8") as fh:
                json.dump(filed, fh, ensure_ascii=False, indent=1)
                fh.write("\n")
    if write:
        # The full-row part: the load's own image of each corrected record after the rewrite.
        full = [m for m in moved if m["rule"] not in CHECKS_ONLY]
        after = _load_images({m["college"] for m in full})
        for m in full:
            img = after.get((m["college"], str(m["control_number"])))
            if img is None:
                raise SystemExit("the load does not post %s %s" % (m["college"], m["control_number"]))
            m["after_image"] = {"record": img["record"], "checks": img["checks"]}
    for i, m in enumerate(moved, 1):
        m["i"] = i
    return {"moved": moved, "left": dict(why.most_common()), "self_check": self_check(files, ge_totals),
            "ge_totals": {c: list(v) for c, v in sorted(ge_totals.items())},
            "by_rule": dict(collections.Counter(m["rule"] for m in moved)),
            "colleges": len({m["college"] for m in moved})}


def _q(s) -> str:
    return "'%s'" % str(s).replace("'", "''")


def _jb(v) -> str:
    return "%s::jsonb" % _q(json.dumps(v, ensure_ascii=False, sort_keys=True, separators=(",", ":")))


def _checks_v(rows: list[dict]) -> str:
    return "with v(i, college, control_number, extracted_run) as (values\n  %s)" % RS._values(rows)


def _arith_update(to: str, frm: str) -> str:
    return ("update public.program_requirement_records r\n"
            "   set checks = jsonb_set(r.checks, '{arithmetic}', '\"%s\"')\n"
            "  from v\n"
            " where r.college = v.college and r.control_number = v.control_number\n"
            "   and r.extracted_run = v.extracted_run and r.checks->>'arithmetic' = '%s'" % (to, frm))


def checks_only_apply(rows: list[dict], tag: str) -> str:
    """A1: checks.arithmetic "unequal" to "equal", never on a row a person checked (round two, R1), aborting
    unless it matches the plan less the checked rows (kb/_guarded_sql.py). An empty part has no statement."""
    if not rows:
        return None
    return GS.guarded(_checks_v(rows), _arith_update("equal", "unequal"), len(rows), tag + " checks-only")


def checks_only_rollback(rows: list[dict], tag: str) -> str | None:
    if not rows:
        return None
    return GS.guarded(_checks_v(rows), _arith_update("unequal", "equal"), len(rows), tag + " checks-only rollback",
                      rollback=True)


def _full_values(rows: list[dict]) -> str:
    return ",\n  ".join("(%d, %s, %s, %d, %s, %s, %s, %s)" % (
        r["i"], _q(r["college"]), _q(r["control_number"]), int(r["extracted_run"]),
        _jb(r["before_image"]["record"]), _jb(r["before_image"]["checks"]),
        _jb(r["after_image"]["record"]), _jb(r["after_image"]["checks"])) for r in rows)


FULL_V = ("with v(i, college, control_number, extracted_run, before_record, before_checks, after_record, after_checks) "
          "as (values\n  %s)")


def _full_update(to: str, frm: str) -> str:
    return ("update public.program_requirement_records r\n"
            "   set record = v.%s_record, checks = v.%s_checks\n"
            "  from v\n"
            " where r.college = v.college and r.control_number = v.control_number\n"
            "   and r.extracted_run = v.extracted_run and r.record = v.%s_record and r.checks = v.%s_checks"
            % (to, to, frm, frm))


def full_row_apply(rows: list[dict], tag: str) -> str:
    """Each corrected row takes the record and checks the college load would post for its committed record, only
    where the live row still holds the filed run and the load's image of main's record and checks (the before-image),
    and no person has checked it."""
    if not rows:
        return None
    return GS.guarded(FULL_V % _full_values(rows), _full_update("after", "before"), len(rows), tag + " full-row")


def full_row_rollback(rows: list[dict], tag: str = "s680") -> str:
    """The before-image back where the row still holds the after-image, skipping (and listing) a row a person
    checked after the apply (round two, R3)."""
    if not rows:
        return None
    return GS.guarded(FULL_V % _full_values(rows), _full_update("before", "after"), len(rows),
                      tag + " full-row rollback", rollback=True)


def pre_read(checks_rows: list[dict], full_rows: list[dict]) -> str:
    """One SELECT, one JSON value: both parts as they stand live. An empty part reads null (a values list cannot be
    empty)."""
    if checks_rows:
        a = RS.pre_read_sql(checks_rows)
        a_with, a_select = a.split("\nselect json_build_object(", 1)
        checks_part = "(%s\nselect json_build_object(%s)" % (a_with, a_select.rstrip().rstrip(";"))
    else:
        checks_part = "(select null::json)"
    full = ("select json_build_object('listed', (select count(*) from v),\n"
            "  'on_run', count(*) filter (where r.extracted_run = v.extracted_run),\n"
            "  'record_is_before', count(*) filter (where r.extracted_run = v.extracted_run and r.record = v.before_record),\n"
            "  'checks_is_before', count(*) filter (where r.extracted_run = v.extracted_run and r.checks = v.before_checks),\n"
            "  'both_before', count(*) filter (where r.extracted_run = v.extracted_run and r.record = v.before_record and r.checks = v.before_checks),\n"
            "  'already_after', count(*) filter (where r.record = v.after_record and r.checks = v.after_checks),\n"
            "  'checked_now', count(*) filter (where r.checked))\n"
            "  from v join public.program_requirement_records r on r.college = v.college and r.control_number = v.control_number")
    full_part = "(%s\n%s)" % (FULL_V % _full_values(full_rows), full) if full_rows else "(select null::json)"
    return "select json_build_object(\n'checks_only', %s,\n'full_row', %s);" % (checks_part, full_part)


def _parts(moved: list[dict]) -> tuple[list[dict], list[dict]]:
    """(checks-only rows, full-row rows); the rescore's rollback builder reads "records" by place i."""
    return ([m for m in moved if m["rule"] in CHECKS_ONLY], [m for m in moved if m["rule"] not in CHECKS_ONLY])


# What the trigger and a person's check do to the full-row part (S683, #3508 round two's minor 3: the receipt
# carried the checks-only part's words alone, RS.FOLLOW_VERDICT and RS.PERSON_SETTLED).
FULL_ROW_FOLLOW_VERDICT = (
    "The follow_verdict trigger (program_requirement_records_follow_verdict, chatbox/supabase_program_record_verdicts.sql) "
    "runs on the full-row UPDATE. A row is checked while a person's latest verdict is a confirm whose fingerprint "
    "matches the record and the machine checks pass. These rows' blocks change, so a confirm given on the old record "
    "no longer matches its fingerprint, and the row stays unchecked until a person confirms the new one. The UPDATE "
    "returns any row the trigger marks checked as \"checked\". The rollback puts back each row's before-image record "
    "and checks, and the trigger runs again on them.")
FULL_ROW_PERSON_SETTLED = (
    "Person-settled rows win. The full-row UPDATE writes the record and checks only where the row still holds the "
    "filed run, the before-image's record and checks, and no person's check: a row a person checked is skipped and "
    "listed as skipped_checked. It never writes checked, checked_by or checked_at. A person's reload or reread "
    "changes the run or the record and drops the row out of the guard.")


def verdict_words(moved: list[dict]) -> tuple[str, str]:
    """(follow_verdict, person_settled) for the parts the plan holds."""
    checks, full = _parts(moved)
    fv = [w for w, rows in ((RS.FOLLOW_VERDICT, checks), (FULL_ROW_FOLLOW_VERDICT, full)) if rows]
    ps = [w for w, rows in ((RS.PERSON_SETTLED, checks), (FULL_ROW_PERSON_SETTLED, full)) if rows]
    return " ".join(fv) or RS.FOLLOW_VERDICT, " ".join(ps) or RS.PERSON_SETTLED


# The first records for the hand-held pair list (HAND_HELD_PAIRS), from the second reader of #3508's round two: each
# a mixed "and"/"or" choice the note-pair call read as one group. A person reads the catalog and files the answer.
HAND_HELD_START = (
    ("Southwestern College", "33132", "BIOL 211", ("PHYS 272", "PHYS 273", "CHEM 200")),
    ("Southwestern College", "43076", "STAT C1000", ("PSYC 270", "PSYC 271", "SOC 270", "SOC 271")),
    ("Foothill College", "46325", "ENGL C1002", ("ENGL C1002H", "ENGL 8", "HIST 3A", "HIST 3B")),
    ("College of the Desert", "36122", "CH 003", ("CH 001A", "BI 013", "BI 014")),
    ("College of the Desert", "45437", "CH 003", ("CH 001A", "BI 013", "BI 014")),
    ("Monterey Peninsula College", "45483", "STAT C1000", ("PSYC 19", "SOCI 19")),
)


def hand_held_start() -> dict:
    return {"how": ("The note-pair call is off on every further record (NOTE_PAIR_ON). These records start the "
                    "hand-held list a plain session fills (HAND_HELD_PAIRS): read each row in the catalog and file "
                    "'pair' with its members, or 'not one group'. None is in this plan."),
            "records": [{"college": c, "control_number": n, "row": r, "read_as_one_group": list(m)}
                        for c, n, r, m in HAND_HELD_START]}


MIGRATIONS = os.path.join(HERE, "migrations")


def replan(receipt: dict, applied_checks: dict | None = None, applied_from: str | None = None,
           drop: tuple = (), why: str | None = None, tag: str = "s680",
           applied_rows: dict | None = None, rows_from: str | None = None) -> dict:
    """The receipt after a live step, in place, without rescoring a record a second time:
      * applied_checks, the checks-only apply's migrate receipt: the rows it returned are marked applied, and the
        checks-only rollback is rebuilt from those rows alone (the guarded shape, kb/_guarded_sql.py);
      * drop, (college, control_number) pairs: each leaves the full-row plan for receipt["held_out"] with why, and
        the full-row apply and rollback are rebuilt from the rows left;
      * applied_rows, the full-row apply's migrate receipt: the rows it returned are marked applied, and the
        full-row rollback is rebuilt from those rows alone.
    Places i never change, so a returned key still names its row."""
    by_i = {r["i"]: r for r in receipt["records"]}
    if applied_checks is not None:
        got = RS.returned_value(applied_checks)
        plan = set(receipt["plan"]["checks_only"])
        stray = [i for i in got["keys"] if i not in plan]
        if stray:
            raise ValueError("returned places outside the checks-only plan: %s" % stray[:10])
        rows = [by_i[i] for i in sorted(set(got["keys"]))]
        for r in rows:
            r["applied"] = {"part": "checks_only", "from": applied_from}
        receipt["applied"] = dict(receipt.get("applied") or {}, checks_only={
            "from": applied_from, "returned": len(rows), "keys": [r["i"] for r in rows],
            "skipped_checked": got.get("skipped_checked") or []})
        receipt["rollback_checks_only"] = checks_only_rollback(rows, tag)
    if drop:
        want = {(c, str(n)) for c, n in drop}
        out = [r for r in receipt["records"] if (r["college"], str(r["control_number"])) in want]
        if len(out) != len(want):
            raise ValueError("a dropped row is not in the receipt")
        if any(r["i"] not in set(receipt["plan"]["full_row"]) for r in out):
            raise ValueError("only a full-row row can leave the plan here")
        receipt["records"] = [r for r in receipt["records"] if r not in out]
        receipt["plan"]["full_row"] = [i for i in receipt["plan"]["full_row"] if i not in {r["i"] for r in out}]
        receipt["held_out"] = (receipt.get("held_out") or []) + [dict(r, why=why) for r in out]
        receipt["by_rule"] = dict(collections.Counter(r["rule"] for r in receipt["records"]))
        receipt["rescored"] = len(receipt["records"])
        full = [by_i[i] for i in receipt["plan"]["full_row"]]
        receipt["apply_full_row"] = full_row_apply(full, tag)
        receipt["rollback_full_row"] = full_row_rollback(full, tag)
    if applied_rows is not None:
        got = RS.returned_value(applied_rows)
        plan = set(receipt["plan"]["full_row"])
        stray = [i for i in got["keys"] if i not in plan]
        if stray:
            raise ValueError("returned places outside the full-row plan: %s" % stray[:10])
        rows = [by_i[i] for i in sorted(set(got["keys"]))]
        for r in rows:
            r["applied"] = {"part": "full_row", "from": rows_from}
        receipt["applied"] = dict(receipt.get("applied") or {}, full_row={
            "from": rows_from, "returned": len(rows), "keys": [r["i"] for r in rows],
            "skipped_checked": got.get("skipped_checked") or []})
        receipt["rollback_full_row"] = full_row_rollback(rows, tag)
    return receipt


NUMBER_WORDS = {1: "one", 2: "two", 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven", 8: "eight", 9: "nine",
                10: "ten", 11: "eleven", 12: "twelve"}


def _header(receipt: dict, receipt_path: str, tag: str) -> str:
    by_i = {r["i"]: r for r in receipt["records"]}
    full = [by_i[i] for i in receipt["plan"]["full_row"]]
    checks = receipt["plan"]["checks_only"]
    nr = collections.Counter(r["rule"] for r in full)
    applied = receipt.get("applied") or {}
    held_n = len(receipt.get("held_colleges") or [])
    only = receipt.get("only_colleges") or []
    return ("-- %s cheap piles, item 2: the units rules. Receipt: %s.\n"
            "-- The plan in two parts (second reader's F1): checks-only, A1 %d rows%s; full-row, %s %d rows (%s)%s.\n"
            "-- A6 is off (F5).%s The collection lane's %s colleges are not in the list (kb/collection_lane.py).\n"
            % (tag.upper(), receipt_path, len(checks),
               (", applied (%s returned %d)" % (applied["checks_only"]["from"], applied["checks_only"]["returned"]))
               if applied.get("checks_only") else "",
               " and ".join(sorted(nr)) or "no correction", len(full),
               ", ".join("%s %d" % kv for kv in sorted(nr.items())) or "none",
               (", applied (%s returned %d)" % (applied["full_row"]["from"], applied["full_row"]["returned"]))
               if applied.get("full_row") else "",
               " A5 is off on every further record." if receipt.get("a5_on") is False else "",
               NUMBER_WORDS.get(held_n, str(held_n)))
            + (("-- Its new rows are at %s alone (--college).\n" if receipt.get("corrects") else
                "-- The plan names records at %s alone (--college).\n") % ", ".join(only) if only else "")
            + _corrects_words(receipt))


def _corrects_words(receipt: dict) -> str:
    src = receipt.get("corrects")
    rows = [r for r in receipt["records"] if r.get("corrects")]
    if not src or not rows:
        return ""
    return ("-- %d of these rows correct rows %s applied (A4's paired alternatives, the second reader's A): each one's\n"
            "-- before-image is the row that apply wrote, and its guard matches that image and its run.\n"
            % (len(rows), src))


def _rollback_order(receipt: dict) -> str:
    src = receipt.get("corrects")
    if not src or not any(r.get("corrects") for r in receipt["records"]):
        return ""
    mig = os.path.basename(src).replace("program_requirement_records_units_rules_", "").replace(".json", "")
    day, tag = mig.split("_", 1)
    return ("-- ORDER: run this rollback first. It puts back the rows %s applied, so that plan's own rollback\n"
            "-- (kb/migrations/%s_%s_prreq_units_rules_rollback_rows.sql) runs after it unchanged, if wanted.\n"
            % (src, day, tag))


def write_migrations(receipt: dict, receipt_path: str, day: str, tag: str) -> None:
    """The committed files of the plan's parts that have not run: the pre-read and the checks-only apply while no
    part has run, the full-row apply until it runs, and each part's rollback. An empty part writes no file (a values
    list cannot be empty)."""
    by_i = {r["i"]: r for r in receipt["records"]}
    full = [by_i[i] for i in receipt["plan"]["full_row"]]
    checks = receipt["plan"]["checks_only"]
    applied = (receipt.get("applied") or {}).get("checks_only")
    rows_applied = (receipt.get("applied") or {}).get("full_row")
    hdr = _header(receipt, receipt_path, tag)
    held = "".join("-- Held out of the full-row plan: %s %s (%s).\n" % (h["college"], h["control_number"], h["why"])
                   for h in receipt.get("held_out") or [])
    base = os.path.join(MIGRATIONS, "%s_%s_prreq_units_rules_" % (day, tag))
    parts = {}
    if not receipt.get("applied") and receipt.get("pre_read"):
        parts["preread.sql"] = ("-- Pre-read, read-only: one SELECT, one JSON value, both parts as they stand live. A row "
                                "off its filed run\n-- leaves the plan (--receipt R --drop COLLEGE:CN --drop-why ...) "
                                "before any apply.\n" + receipt["pre_read"])
    if checks and not applied and receipt.get("apply_checks_only"):
        parts["apply_checks.sql"] = (
            "-- Part 1, applied first: checks.arithmetic \"unequal\" to \"equal\" on the %d A1 rows, where the row holds "
            "the\n-- filed run, still reads \"unequal\" and no person has checked it. The statement aborts, writing "
            "nothing, unless it\n-- matches the plan's %d rows less those a person checked (listed as skipped_checked).\n"
            % (len(checks), len(checks)) + receipt["apply_checks_only"])
    if full and not rows_applied:
        parts["apply_rows.sql"] = (
            held + "-- Part 2: the %d corrected rows take the record and checks the college load (load_rows) "
            "posts for their\n-- committed record, where the row holds the filed run, the load's image of "
            "main's record and checks, and no\n-- person's check. The statement aborts, writing nothing, "
            "unless it matches the plan's %d rows less those a person\n-- checked (listed as "
            "skipped_checked). Before-images: the receipt's before_image per row.\n"
            % (len(full), len(full)) + receipt["apply_full_row"])
        parts["rollback_rows.sql"] = (
            held + _rollback_order(receipt) + "-- Rollback of part 2, NOT applied: the before-image back where the row still "
            "holds the after-image, skipping\n-- and listing a row a person checked; it aborts unless "
            "it matches the plan less those rows (edit expect).\n" + receipt["rollback_full_row"])
    if checks:
        parts["rollback_checks.sql"] = (
            "-- Rollback of part 1, NOT applied: the %d rows the checks-only apply returned, back "
            "from \"equal\" to\n-- \"unequal\", guarded on the run, skipping and listing a row a "
            "person checked; it aborts unless it matches\n-- those rows less the checked ones (edit "
            "its expect line for a partial rollback).\n"
            % (applied["returned"] if applied else len(checks)) + receipt["rollback_checks_only"])
    if rows_applied:
        # The full-row apply ran as committed (its migrate receipt holds the file's sha256): it stays as it ran, and
        # the rollback names the rows it returned.
        parts["rollback_rows.sql"] = (
            held + _rollback_order(receipt) + "-- Rollback of part 2, NOT applied: the %d rows the full-row apply returned (%s), the before-image\n"
            "-- back where the row still holds the after-image, skipping and listing a row a person checked; it aborts\n"
            "-- unless it matches those rows less the checked ones (edit expect for a partial rollback).\n"
            % (rows_applied["returned"], rows_applied["from"]) + receipt["rollback_full_row"])
    for name, text in parts.items():
        with open(base + name, "w", encoding="utf-8") as fh:
            fh.write(hdr + text + "\n")


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--dry-run", action="store_true", help="count and self-check; write nothing")
    ap.add_argument("--tag", default="s680")
    ap.add_argument("--skip-college", action="append", default=[])
    ap.add_argument("--college", action="append", default=[], help="run at the colleges named alone")
    ap.add_argument("--released", action="store_true",
                    help="run at the colleges S680's lane held and released alone (collection_lane.RELEASED)")
    ap.add_argument("--everywhere", action="store_true",
                    help="run at every college outside the collection lane (a write needs a scope: this, --college "
                         "or --released)")
    ap.add_argument("--correct-from", help="an applied units-rules receipt: plan again, from the rows it wrote, each A4 "
                                           "row the paired-alternative rule changes")
    ap.add_argument("--receipt", help="replan this receipt after a live step (no rescoring)")
    ap.add_argument("--applied-checks", help="the checks-only apply's migrate receipt: mark its rows applied and "
                                             "rebuild the checks-only rollback from them")
    ap.add_argument("--applied-rows", help="the full-row apply's migrate receipt: mark its rows applied and rebuild "
                                           "the full-row rollback from them")
    ap.add_argument("--drop", action="append", default=[], help="COLLEGE:CONTROL_NUMBER out of the full-row plan")
    ap.add_argument("--drop-why", help="why the dropped rows leave the plan")
    a = ap.parse_args(argv)
    if a.receipt:
        with open(a.receipt, encoding="utf-8") as fh:
            receipt = json.load(fh)
        mig = None
        if a.applied_checks:
            with open(a.applied_checks, encoding="utf-8") as fh:
                mig = json.load(fh)
        rows_mig = None
        if a.applied_rows:
            with open(a.applied_rows, encoding="utf-8") as fh:
                rows_mig = json.load(fh)
        if a.drop and not a.drop_why:
            ap.error("--drop needs --drop-why")
        rel = lambda p: os.path.relpath(os.path.abspath(p), ROOT) if p else None  # noqa: E731
        replan(receipt, mig, rel(a.applied_checks), tuple(tuple(d.rsplit(":", 1)) for d in a.drop), a.drop_why,
               a.tag, rows_mig, rel(a.applied_rows))
        with open(a.receipt, "w", encoding="utf-8") as fh:
            json.dump(receipt, fh, ensure_ascii=False, indent=1)
            fh.write("\n")
        day = re.search(r"_(\d{4}-\d{2}-\d{2})_", os.path.basename(a.receipt)).group(1)
        write_migrations(receipt, os.path.relpath(os.path.abspath(a.receipt), ROOT), day, a.tag)
        print("replanned: checks-only %d (applied %s), full-row %d, held out %d" % (
            len(receipt["plan"]["checks_only"]), ((receipt.get("applied") or {}).get("checks_only") or {}).get("returned"),
            len(receipt["plan"]["full_row"]), len(receipt.get("held_out") or [])))
        return 0
    only = tuple(a.college) + (tuple(CL.RELEASED) if a.released else ())
    if not a.dry_run and not (a.college or a.released or a.everywhere):
        # A write with no scope re-plans every unequal record outside the lane, a held-out one included (MiraCosta
        # 21976, S680), which the guards would only abort live (S681 second reader, C).
        ap.error("a write names its scope: --college NAME, --released or --everywhere")
    if not a.dry_run and glob.glob(os.path.join(RECEIPTS, "program_requirement_records_units_rules_*_%s.json" % a.tag)):
        # A second write under one tag would rescore records the first already moved and overwrite its receipt.
        raise SystemExit("a units-rules receipt for %s exists: replan it with --receipt, or take a new --tag" % a.tag)
    r = run(write=not a.dry_run, skip=tuple(a.skip_college), only=only, correct_from=a.correct_from)
    print("moved %d at %d colleges: %s" % (len(r["moved"]), r["colleges"],
                                           ", ".join("%s %d" % kv for kv in sorted(r["by_rule"].items()))))
    for rule, c in r["self_check"].items():
        print("self-check %s on records already equal: applies %d, right %d, wrong %d, not exact %d, units the state "
              "does not hold %d" % (rule, c["applies"], c["right"], c["wrong"], c["not_exact"], c["state_differs"]))
    pr = pair_recall([d for _, d in load_files(tuple(a.skip_college))])
    print("pair call against the record notes: %s" % ", ".join("%s %d" % kv for kv in pr["tally"].items()))
    if pr["wrong"]:
        raise SystemExit("the pair call disagrees with %d record notes: %s" % (len(pr["wrong"]), pr["wrong"][:5]))
    left = []
    if a.correct_from:
        # A row this plan corrects keeps only what its correction leaves; every other applied row, what it wrote.
        here = {(m["college"], str(m["control_number"])): m for m in r["moved"] if m.get("corrects")}
        left = [x for x in applied_differs(a.correct_from) if (x["college"], str(x["control_number"])) not in here]
        left += [dict(x, college=m["college"], control_number=m["control_number"]) for m in here.values()
                 for x in m["state_differs_left"]]
        print("units %s's A4 rows wrote that the state's file does not hold, left for a later task: %d at %d records"
              % (os.path.basename(a.correct_from), len(left), len({(x["college"], x["control_number"]) for x in left})))
    if a.dry_run or not r["moved"]:
        return 0
    day = time.strftime("%Y-%m-%d", time.gmtime())
    path = os.path.join(RECEIPTS, "program_requirement_records_units_rules_%s_%s.json" % (day, a.tag))
    receipt = {"rule": ASK, "words": WORDS, "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
               "held_colleges": list(COLLECTION_LANE) + list(a.skip_college),
               "only_colleges": list(only) or None,
               "corrects": os.path.relpath(os.path.abspath(a.correct_from), ROOT) if a.correct_from else None, "a5_on": A5_ON, "a6_on": A6_ON,
               "self_check_scope": ("the held answers at the colleges named in only_colleges" if only
                                    else "the held answers outside the collection lane"),
               "rescored": len(r["moved"]), "by_rule": r["by_rule"], "self_check": r["self_check"],
               "pair_recall": pr, "state_differs_left": left,
               "left_as_filed": r["left"], "ge_totals": r["ge_totals"], "records": r["moved"],
               "plan": {"checks_only": [m["i"] for m in r["moved"] if m["rule"] in CHECKS_ONLY],
                        "full_row": [m["i"] for m in r["moved"] if m["rule"] not in CHECKS_ONLY]},
               "pre_read": pre_read(*_parts(r["moved"])),
               "apply_checks_only": checks_only_apply(_parts(r["moved"])[0], a.tag),
               "apply_full_row": full_row_apply(_parts(r["moved"])[1], a.tag),
               "follow_verdict": verdict_words(r["moved"])[0], "person_settled": verdict_words(r["moved"])[1],
               "note_pair_on": NOTE_PAIR_ON, "note_pair_kept": sorted(list(k) for k in NOTE_PAIR_KEPT),
               "hand_held_pairs": hand_held_start(),
               "rollback_full_row": full_row_rollback(_parts(r["moved"])[1], a.tag),
               "rollback_checks_only": checks_only_rollback(_parts(r["moved"])[0], a.tag),
               "rollback": None,
               "rollback_how": ("rollback_checks_only and rollback_full_row each take back the plan's rows, skip and "
                                "list a row a person checked, and abort unless they match the plan less those rows. "
                                "Where the apply returned fewer rows, edit the rollback's expect line to that count."),
               "applied": None}
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(receipt, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    write_migrations(receipt, os.path.relpath(path, ROOT), day, a.tag)
    print("receipt %s" % os.path.relpath(path, ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
