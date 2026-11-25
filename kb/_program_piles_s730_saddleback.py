#!/usr/bin/env python3
"""S730, lane 2's cheap piles at Saddleback: the census's 17 wording-rule records, 8 collected with gaps named.

The census on main (kb/status/harvest_gap_census.json, run 45586922147, written 2026-11-25 09:39Z) lists 17
Saddleback College records under the reconcile_steps lever ("correction rules from the catalog's own wording, then a
rescore of the saved record"). Sam's ruling (2026-11-17, sam-collect-with-gaps-2026-11-17): never drop a record for
failing; collect it with its gaps noted and confidence scores, a gap noted instead of a reread. A record a cheaper
lever passes is held on that lever, never gap-filed (p-gap-filing-leaves-census-lever-s721). Saddleback carries no
reconcile steps (kb/program_requirements_reconcile.json), and the capture keeps no page text, so every reading here
works from the committed record, its notes and today's capture. No record is changed; each plan row's score is.

THE REVIEWED LIST (REVIEWED below, a hand reading of each record's own notes), with the standing guards:
scorer_passes (a record today's scorer passes is never gap-filed), on_live_run (the committed record's run is its live
row's), the record-rule guard (NG.answer names no other kind), the own-page guard keyed on the pages the records were
read from (sources.json's source.url and each record's source_url, never capture.json's shared_pages;
p-own-page-guard-reads-read-pages-s727: every Saddleback record here was read from its own curriQunet page) and the
claim check against today's capture. The kinds:

  option_lists_read_apart  (S727's, 40) 30206, 30207, 36628 (Cinema-Television-Radio's specialties) and 40322
                           (Integrative Health's Pattern 3): an option the page prints as two lists (a specialty's
                           Required Courses and its Restricted Electives; Pattern 3's required courses and its 'Select
                           3 units'), every list its own alternative in the one option group, the notes say so. Each
                           entry's own check: the blocks' names key them by option (OPTION_KEY: '<name> Specialty' or
                           'Pattern N'), and read as the scorer's option parts ('Option k: ...'), today's scorer gives
                           the printed total at both ends.
  waived_course_counted    (new, 50) 04069 and 22874 (Drafting Technology: DR 23 or DR 100, printed 0.0-3.0, a
                           student with a year of high school mechanical drafting exempt), 41673 and 41674
                           (Hospitality Management: CUL 171, printed 0.0-2.0, waived for a valid California ServSafe
                           Certification): the record counts the course at its units, so the sum matches the printed
                           range's top and not its low end. No existing kind fits: entry_path_range names an entry path
                           a student is admitted to, noted_unit_floor a minimum above the printed units, and
                           printed_total (the reconcile kind) a test-out whose units the page's own separate total
                           counts. Its score is entry_path_range's 50: in both the page prints a range over two paths
                           and the record holds the full one. The entry's own check: the course appears once at its
                           units, the sum's low end is the printed low end plus those units, and read at 0 to its
                           units, today's scorer gives the printed range.

ON THE LEVER (ON_LEVER, held, never gap-filed): seven records a Saddleback `repeat` step passes (the kind Hartnell,
Norco, Riverside City and East Los Angeles carry): ETT 142 (19050, 19051) and MUS 50 (41420, 41422, 41423, 41425,
41426), each printed under 'The following course must be taken twice for a total of two units: 2.0' and read once.
With the course's times at 2, as the step writes it, today's scorer reads the printed total exactly.

Held (2), each reason in HAND: 04073 (two gaps at once: the four piano 'Select one' blocks, 0.0-2.0 by a
proficiency exam, and the ensemble's 'four semesters (including repeated classes)' read as four courses; only both
readings together give the printed 20-34, and the ensemble's is a `repeat` block_pattern step); 36625 (the record
states each pathway at the course sum printed beside its name, where the page asks 'Complete 3-5 units (1-2 courses)
from one of the following pathways'; no kind names a list's figure read as its course sum, and the note asks a
reviewer to check Pathway 5's figure).

THE SELF-RECALL (the S652 review rule, a new matcher's counts before it ships): each kind's shape check against the
hand reading over the census's 17 (SHAPE_HAND), and statewide over every filed record (STATEWIDE, each fire read by
hand): OPTION_KEY's shape fires on these 4 records alone; the waiver shape fires on 15, every one the shape (CUL 171's
ServSafe waiver at 11 Saddleback awards, 41673 and 41674 among them; DR 100's exemption at 04069 and 22874; the piano
proficiency exam of 04073; San Bernardino Valley 22784's TECALC 087, waived by placing into a transfer-level MATH
course), and leaves out Los Angeles City 02746, whose note names prerequisites
(prerequisites_counted's reading). This plan files Saddleback's census members alone. Boundary readings: the note's
words gone, the stated total one unit off, coverage failing, the record-rule guard, and each kind's own figures moved.
The statewide fires' fields are pinned in tests/fixtures/saddleback_shapes_statewide_s730.json for the test.

    python3 kb/_program_piles_s730_saddleback.py --dry-run
    python3 kb/_program_piles_s730_saddleback.py --tag s730b

Guard: tests/program_piles_s730_saddleback_test.py.
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
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s713 as P  # noqa: E402
import _program_piles_s714_fullerton as F  # noqa: E402
import _program_requirements_score as S  # noqa: E402

ROOT = os.path.dirname(HERE)
COLLEGE = "Saddleback College"
SLUG = "saddleback"
CENSUS = NG.CENSUS
LEVERS = ("reconcile_steps",)
PERSON = ()
TAG = "s730b"

_OPT = {"gap": "option_lists_read_apart", "option_key": True}
REVIEWED = {
    "30206": dict(_OPT, computed=[12, 15], stated=[20, 21],
                  words="but a student completes both blocks of one specialty, not one block"),
    "30207": dict(_OPT, computed=[12, 15], stated=[20, 21],
                  words="A student completes both blocks of a single specialty, not one block from the group"),
    "36628": dict(_OPT, computed=[6, 11], stated=[12, 14],
                  words="a student completes both blocks of one specialty, not one block from the group"),
    "40322": dict(_OPT, computed=[16, 22], stated=[21, 22],
                  words="together they make up the single Pattern 3 option (9 units)"),
    "04069": {"gap": "waived_course_counted", "computed": [36, 36], "stated": [33, 36],
              "waived": {"code": "DR 23", "units": 3},
              "words": "students who completed one year of high school mechanical drafting, or equivalent, are exempt "
                       "from DR 100", "courses": ["DR23", "DR100"]},
    "22874": {"gap": "waived_course_counted", "computed": [36, 36], "stated": [33, 36],
              "waived": {"code": "DR 23", "units": 3},
              "words": "students who completed one year of high school mechanical drafting, or equivalent, are exempt "
                       "from DR 100", "courses": ["DR23", "DR100"]},
    "41673": {"gap": "waived_course_counted", "computed": [20, 20], "stated": [18, 20],
              "waived": {"code": "CUL 171", "units": 2},
              "words": "Students with valid California ServSafe Certification may have CUL 171 waived",
              "courses": ["CUL171"]},
    "41674": {"gap": "waived_course_counted", "computed": [20, 20], "stated": [18, 20],
              "waived": {"code": "CUL 171", "units": 2},
              "words": "students with valid California ServSafe Certification may have this requirement waived",
              "courses": ["CUL171"]},
}

# Records a Saddleback `repeat` step passes (the reconcile lever): the course is read once, the page takes it twice.
_TWICE = "The following course must be taken twice for a total of two units"
ON_LEVER = {
    "19050": {"code": "ETT 142", "times": 2, "computed": [17, 18], "stated": [18, 19],
              "words": "ETT 142 (1 unit) must be taken twice for a total of 2 units"},
    "19051": {"code": "ETT 142", "times": 2, "computed": [27, 28], "stated": [28, 29], "words": _TWICE},
    "41420": {"code": "MUS 50", "times": 2, "computed": [16, 16], "stated": [17, 17], "words": _TWICE},
    "41422": {"code": "MUS 50", "times": 2, "computed": [17.5, 17.5], "stated": [18.5, 18.5], "words": _TWICE},
    "41423": {"code": "MUS 50", "times": 2, "computed": [16, 17], "stated": [17, 18], "words": _TWICE},
    "41425": {"code": "MUS 50", "times": 2, "computed": [21, 21], "stated": [22, 22], "words": _TWICE},
    "41426": {"code": "MUS 50", "times": 2, "computed": [16, 16], "stated": [17, 17], "words": _TWICE},
}
_LEVER = ("held: a cheaper lever passes it (p-gap-filing-leaves-census-lever-s721): the page prints %s under 'The "
          "following course must be taken twice for a total of two units: 2.0' and the record reads it once; a "
          "Saddleback step of the repeat kind (Norco's and Riverside City's) gives it times 2, and today's scorer then "
          "reads %s against the printed %s; it stays on reconcile_steps")
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({cn: _LEVER % (e["code"], S._fig(*e["stated"]), S._fig(*e["stated"])) for cn, e in ON_LEVER.items()})
HAND.update({
    "04073": "held: two gaps at once: the four piano 'Select one' blocks print 0.0-2.0 (the course or a proficiency "
             "exam) and the ensemble list's 'Complete four semesters from the following (including repeated "
             "classes)' is read as four courses; with the piano blocks at 0 alone today's scorer reads 21-34, and "
             "only both readings give the printed 20-34; the ensemble's is a repeat block_pattern step (the "
             "reconcile lever), so the waiver waits on it",
    "36625": "held: the record states each pathway at the course sum printed beside its name (12, 19, 13, 8, 12, "
             "18), where the page asks 'Complete 3-5 units (1-2 courses) from one of the following pathways'; read "
             "at 3-5 the pathways give the printed 12-14, but no kind names a list's figure read as its course sum, "
             "and the note asks a reviewer to check Pathway 5's printed 12.0: a wording rule or a page read",
})

# The new kind's sentence and score (kb/_program_named_gaps.py carries it; the setdefault there is the source).
NEW_KINDS = {"waived_course_counted": 50}


def census_members(path: str = CENSUS) -> list[str]:
    """The keys: the census's members under LEVERS at the college, less PERSON."""
    with open(path, encoding="utf-8") as fh:
        d = json.load(fh)
    out = []
    for lv in d.get("levers") or []:
        if lv.get("lever") in LEVERS and lv.get("scope") == COLLEGE:
            out += [m for m in lv.get("members") or [] if m not in out and m not in PERSON]
    return out


def _path(cn: str) -> str:
    return os.path.join(NG.COLLEGE_DIR, SLUG, "records", cn + ".json")


def _load(cn: str) -> dict | None:
    if not os.path.isfile(_path(cn)):
        return None
    with open(_path(cn), encoding="utf-8") as fh:
        return json.load(fh)


def _pair(v):
    return None if v is None else [float(v[0]), float(v[1])]


def _same(a, b) -> bool:
    a, b = _pair(a), _pair(b)
    if a is None or b is None:
        return a is b
    return all(abs(x - y) <= NG.FIG_EPS for x, y in zip(a, b))


def _notes(filed: dict) -> list[str]:
    return [str(n) for n in (filed.get("record") or {}).get("notes") or []]


def _arith(record: dict, award) -> dict:
    return S.score(record, [], "", award).get("arithmetic") or {}


def scorer_passes(filed: dict) -> bool:
    """Today's scorer passes the record's own arithmetic (S.score with no closed list and no text, so no electives
    fill): such a record is rescored, never gap-filed (#3753's second reader, MAJOR)."""
    return _arith(filed.get("record") or {}, filed.get("award")).get("status") == "equal"


def _closes(a: dict, stated) -> bool:
    return a.get("status") == "equal" and _same(a.get("computed"), stated)


def _entries(record: dict, code: str) -> list[dict]:
    """Every course entry and alternative carrying the code (norm_code), across the record's blocks."""
    out = []
    for b in record.get("blocks") or []:
        for c in b.get("courses") or []:
            for x in [c] + [y for y in c.get("alternatives") or [] if isinstance(y, dict)]:
                if S.norm_code(x.get("code") or "") == S.norm_code(code):
                    out.append(x)
    return out


# ── option_lists_read_apart: the Saddleback form of the shape ──────────────
OPTION_KEY = re.compile(r"^\s*(.{1,60}?\bspecialty|pattern\s+\d{1,2})\s*(?:-|:)", re.I)


def _option_key_groups(record: dict) -> dict:
    """{option group: [(block index, key)]} for the groups whose every block's name opens with an option's key."""
    by = collections.defaultdict(list)
    for i, b in enumerate(record.get("blocks") or []):
        if b.get("option_group"):
            by[b["option_group"]].append(i)
    out = {}
    blocks = record.get("blocks") or []
    for g, ix in by.items():
        ms = [OPTION_KEY.match(str(blocks[i].get("name") or "")) for i in ix]
        if all(ms):
            out[g] = [(i, re.sub(r"\s+", " ", m.group(1)).lower()) for i, m in zip(ix, ms)]
    return out


def option_key(filed: dict) -> bool:
    """option_lists_read_apart's shape at Saddleback: one option group whose every block's name opens with its
    option's key ('Cinema Specialty - Required Courses', 'Pattern 3: And Select 3 units ...'), two or more keys, one
    of them holding two or more lists; and the scorer's option-parts reading (S.option_parts) does not already pair
    them."""
    rec = filed.get("record") or {}
    if S.option_parts(rec):
        return False
    for pairs in _option_key_groups(rec).values():
        c = collections.Counter(k for _, k in pairs)
        if len(c) >= 2 and max(c.values()) >= 2:
            return True
    return False


def as_option_parts(record: dict) -> dict:
    """The record with each keyed group's blocks named as the scorer's option parts ('Option k: <name>'), k by key."""
    out = copy.deepcopy(record)
    for pairs in _option_key_groups(out).values():
        seen: dict = {}
        for i, k in pairs:
            seen.setdefault(k, str(len(seen) + 1))
            out["blocks"][i]["name"] = "Option %s: %s" % (seen[k], out["blocks"][i]["name"])
    return out


def parts_close(filed: dict) -> bool:
    """option_lists_read_apart's figures: read as option parts, today's scorer gives the printed total at both ends."""
    a = (filed.get("score") or {}).get("arithmetic") or {}
    return _closes(_arith(as_option_parts(filed.get("record") or {}), filed.get("award")), a.get("stated"))


# ── waived_course_counted (new) ────────────────────────────────────────────
WAIVE = re.compile(r"\bwaive[ds]?\b|\bwaiver\b|\bexempt(?:ed|ion)?\b|\bproficiency\s+exam", re.I)
PREREQ = re.compile(r"\bprerequisites?\b", re.I)


def waived_shape(filed: dict) -> bool:
    """waived_course_counted's shape: the arithmetic is unequal with the record's top at the printed top and its low
    end above the printed low end, and a note of its own names a waiver, an exemption or a proficiency exam; a note
    naming prerequisites leaves it to prerequisites_counted's reading (Los Angeles City 02746)."""
    a = (filed.get("score") or {}).get("arithmetic") or {}
    comp, st = _pair(a.get("computed")), _pair(a.get("stated"))
    if a.get("pass") or a.get("status") != "unequal" or not comp or not st:
        return False
    if abs(comp[1] - st[1]) > NG.FIG_EPS or not comp[0] > st[0] + NG.FIG_EPS:
        return False
    notes = _notes(filed)
    return any(WAIVE.search(n) for n in notes) and not any(PREREQ.search(n) for n in notes)


def as_waived(record: dict, code: str) -> dict:
    """The record with the waived course (and its alternatives) read at 0 to its units."""
    out = copy.deepcopy(record)
    for x in _entries(out, code):
        x["units_max"], x["units"] = x.get("units"), 0
    return out


def waiver_closes(filed: dict, e: dict) -> bool:
    """waived_course_counted's figures: the course is one entry at its units (an alternative at the same units), the
    record's low end is the printed low end plus those units and its top the printed top, and read at 0 to its
    units, today's scorer gives the printed range."""
    w = e["waived"]
    rec = filed.get("record") or {}
    tops = [c for b in rec.get("blocks") or [] for c in b.get("courses") or []
            if S.norm_code(c.get("code") or "") == S.norm_code(w["code"])]
    if len(tops) != 1 or S._num(tops[0].get("units")) != w["units"] or tops[0].get("units_max") is not None:
        return False
    if any(S._num(x.get("units")) != w["units"] for x in tops[0].get("alternatives") or [] if isinstance(x, dict)):
        return False
    a = (filed.get("score") or {}).get("arithmetic") or {}
    comp, st = _pair(a.get("computed")), _pair(a.get("stated"))
    if abs(comp[0] - w["units"] - st[0]) > NG.FIG_EPS or abs(comp[1] - st[1]) > NG.FIG_EPS:
        return False
    return _closes(_arith(as_waived(rec, w["code"]), filed.get("award")), a.get("stated"))


# ── the lever: a repeat step's reading ─────────────────────────────────────
def as_repeated(record: dict, code: str, times: int) -> dict:
    out = copy.deepcopy(record)
    for x in _entries(out, code):
        x["times"] = times
    return out


def repeat_passes(filed: dict, e: dict) -> bool:
    """The repeat step's reading: the course is one entry at 1 unit with no count, the note quotes the page's words,
    the record falls short of the printed total by its repeats at both ends, and with its times as the step writes
    it, today's scorer reads the printed total."""
    rec = filed.get("record") or {}
    xs = _entries(rec, e["code"])
    if len(xs) != 1 or xs[0].get("times") is not None or S._num(xs[0].get("units")) is None:
        return False
    if not any(e["words"] in n for n in _notes(filed)):
        return False
    a = (filed.get("score") or {}).get("arithmetic") or {}
    if not _same(a.get("computed"), e["computed"]) or not _same(a.get("stated"), e["stated"]):
        return False
    extra = S._num(xs[0]["units"]) * (e["times"] - 1)
    comp, st = _pair(a.get("computed")), _pair(a.get("stated"))
    if any(abs(c + extra - s) > NG.FIG_EPS for c, s in zip(comp, st)):
        return False
    return _closes(_arith(as_repeated(rec, e["code"], e["times"]), filed.get("award")), a.get("stated"))


# ── the read pages (the own-page guard) ────────────────────────────────────
_READ_PAGES = None


def _sources() -> dict:
    with open(os.path.join(NG.COLLEGE_DIR, SLUG, "sources.json"), encoding="utf-8") as fh:
        return {str(x.get("control_number")): x for x in json.load(fh)}


def read_pages() -> dict:
    """{control number: {read page urls}}: sources.json's source.url and the record file's source_url
    (p-own-page-guard-reads-read-pages-s727; capture.json's shared_pages is not read)."""
    global _READ_PAGES
    if _READ_PAGES is not None:
        return _READ_PAGES
    out: dict = collections.defaultdict(set)
    for cn, s in _sources().items():
        u = (s.get("source") or {}).get("url") if isinstance(s.get("source"), dict) else None
        if u:
            out[cn].add(u)
    for path in glob.glob(os.path.join(NG.COLLEGE_DIR, SLUG, "records", "*.json")):
        try:
            with open(path, encoding="utf-8") as fh:
                f = json.load(fh)
        except (OSError, ValueError):
            continue
        if isinstance(f, dict) and f.get("source_url"):
            out[str(f.get("control_number"))].add(f["source_url"])
    _READ_PAGES = dict(out)
    return _READ_PAGES


def shared_with(cn: str) -> list[str]:
    """The other programs read from the record's own read page."""
    pages = read_pages()
    mine = pages.get(str(cn)) or set()
    return sorted(k for k, v in pages.items() if k != str(cn) and v & mine)


# ── on_live_run ────────────────────────────────────────────────────────────
_POSTED = None


def posted_runs(skip: tuple = ()) -> dict:
    """{control number: [(at, extracted_run), ...]} the committed receipts posted to the college's live rows: a load
    (program_requirement_records_college_<slug>_<run>.json: inserted_keys under its one extracted run), a reread
    (..._college_reread_<slug>_<run>.json: replaced_keys and carried_keys; kept_keys for a key no other receipt
    posts) and every applied plan's records (posted only once its migration receipt is filed). skip names plan tags
    whose receipts are left out (the test reads the receipts as they stood before this plan's own apply,
    p-test-reads-own-apply-receipt-s721); a skip is never cached. American River's form (s727b)."""
    global _POSTED
    if _POSTED is not None and not skip:
        return _POSTED
    out: dict = {}
    kept = []
    for path in glob.glob(os.path.join(NG.RECEIPTS, "program_requirement_records_*.json")):
        name = os.path.basename(path)
        try:
            with open(path, encoding="utf-8") as fh:
                d = json.load(fh)
        except (OSError, ValueError):
            continue
        if not isinstance(d, dict):
            continue
        at = str(d.get("at") or "")
        if name.startswith("program_requirement_records_college_reread_%s_" % SLUG):
            for k in (d.get("replaced_keys") or []) + (d.get("carried_keys") or []):
                out.setdefault(str(k), []).append((at, str(d.get("extracted_run"))))
            kept += [(str(k), at, str(d.get("extracted_run"))) for k in d.get("kept_keys") or []]
        elif name.startswith("program_requirement_records_college_%s_" % SLUG):
            runs = [str(r) for r in d.get("extracted_runs") or []]
            for k in d.get("inserted_keys") or []:
                if len(runs) == 1:
                    out.setdefault(str(k), []).append((at, runs[0]))
        else:
            tag = name[:-len(".json")].rsplit("_", 1)[-1]
            if tag in skip:
                continue
            if not glob.glob(os.path.join(NG.RECEIPTS, "migration_%s_prreq_*.json" % tag)):
                continue
            rows = d.get("records") if isinstance(d.get("records"), list) else d.get("moved")
            for r in rows if isinstance(rows, list) else []:
                if isinstance(r, dict) and r.get("college") == COLLEGE and r.get("extracted_run"):
                    out.setdefault(str(r.get("control_number")), []).append((at, str(r["extracted_run"])))
    for k, at, run in kept:
        if k not in out:
            out[k] = [(at, run)]
    if not skip:
        _POSTED = out
    return out


def on_live_run(filed: dict, skip: tuple = ()) -> bool:
    """The committed record's run is the run the latest committed receipt posted for the row (the pre-read class of
    East Los Angeles 02456: a reconcile rewrote the file, and its run never reached the live row)."""
    rows = posted_runs(skip).get(str(filed.get("control_number"))) or []
    return bool(rows) and max(rows)[1] == str(filed.get("extracted_run"))


# ── the rule ───────────────────────────────────────────────────────────────
def gap_noted(filed: dict, reviewed: dict | None = None, skip: tuple = ()) -> tuple[str, str] | None:
    """(gap, words) where a reviewed entry stands on the record as it is filed; else None."""
    e = (REVIEWED if reviewed is None else reviewed).get(str(filed.get("control_number")))
    if not e or filed.get("college") != COLLEGE:
        return None
    sc = filed.get("score") or {}
    a = sc.get("arithmetic") or {}
    words = next((n for n in _notes(filed) if e["words"] in n), None)
    if not words or not NG.collectable(sc) or a.get("pass") or S.passes_live(sc):
        return None
    if not _same(a.get("computed"), e["computed"]) or not _same(a.get("stated"), e["stated"]):
        return None
    if scorer_passes(filed) or not on_live_run(filed, skip):
        return None
    # The record-rule guard (S727 at Santa Barbara City): a row a record rule names under another kind is refused.
    ans = NG.answer(filed)
    if ans and ans[0] != e["gap"]:
        return None
    if e.get("option_key") and not (option_key(filed) and parts_close(filed)):
        return None
    if e.get("waived") and not (waived_shape(filed) and waiver_closes(filed, e)):
        return None
    return e["gap"], words


def claim(filed: dict, src: dict | None = None) -> str:
    cn = str(filed.get("control_number"))
    e = REVIEWED.get(cn)
    s = (_sources() if src is None else src).get(cn)
    if not e or not s:
        return "no capture"
    if shared_with(cn):
        # The own-page guard: every record here was read from its own curriQunet page; a shared read page holds it.
        return "the page is shared with another program"
    found = {S.norm_code(x) for x in s.get("codes_found") or []}
    if any(S.norm_code(c) not in found for c in e.get("courses") or []):
        return "a named course not found"
    return "stands"


def outcome(filed: dict, src: dict | None = None, skip: tuple = ()) -> tuple[str, str | None, str]:
    j = gap_noted(filed, skip=skip)
    if not j:
        return "none", None, "no entry stands"
    c = claim(filed, src)
    return (j[0], j[1], c) if c == "stands" else ("none", None, c)


def precision(census_path: str = CENSUS, skip: tuple = ()) -> dict:
    out = {"read": 0, "right": 0, "wrong": [], "no_record_file": 0, "not_hand_held": 0,
           "by_answer": collections.Counter()}
    src = _sources()
    for cn in census_members(census_path):
        if cn not in HAND:
            out["not_hand_held"] += 1
            continue
        f = _load(cn)
        truth = "none" if HAND[cn].startswith("held") else HAND[cn]
        out["read"] += 1
        out["by_answer"][truth] += 1
        if f is None:
            out["no_record_file"] += 1
            got = "none"
        else:
            got = outcome(f, src, skip)[0]
        if got == truth:
            out["right"] += 1
        else:
            out["wrong"].append([cn, truth, got])
    out["by_answer"] = dict(out["by_answer"])
    return out


def lever(census_path: str = CENSUS, skip: tuple = ()) -> dict:
    """The records held on the reconcile lever: each one's repeat reading passes today's scorer, and none takes a gap."""
    right, wrong = 0, []
    for cn in census_members(census_path):
        if cn not in ON_LEVER:
            continue
        f = _load(cn)
        ok = bool(f) and repeat_passes(f, ON_LEVER[cn]) and not scorer_passes(f) and on_live_run(f, skip) \
            and gap_noted(f, skip=skip) is None
        if ok:
            right += 1
        else:
            wrong.append(cn)
    return {"right": right, "wrong": wrong}


def claim_checks(census_path: str = CENSUS) -> dict:
    out, not_standing = collections.Counter(), []
    src = _sources()
    for cn in census_members(census_path):
        f = _load(cn)
        if f is None or not gap_noted(f):
            continue
        c = claim(f, src)
        out[c] += 1
        if c != "stands":
            not_standing.append([cn, c])
    return {"counts": dict(out), "not_standing": not_standing}


def boundaries(census_path: str = CENSUS) -> dict:
    out, wrong = collections.Counter(), []

    def tally(name, ok, cn):
        out["%s %s" % (name, "right" if ok else "wrong")] += 1
        if not ok:
            wrong.append([cn, name])

    for cn in census_members(census_path):
        f = _load(cn)
        if f is None or not gap_noted(f):
            continue
        e = REVIEWED[cn]
        g = copy.deepcopy(f)
        g["record"]["notes"] = [str(n).replace(e["words"], "") for n in g["record"].get("notes") or []]
        tally("the note's words gone", gap_noted(g) is None, cn)
        g = copy.deepcopy(f)
        a = g["score"]["arithmetic"]
        a["stated"] = [a["stated"][0] + 1, a["stated"][1] + 1]
        tally("the stated total one unit off", gap_noted(g) is None, cn)
        g = copy.deepcopy(f)
        g["score"]["coverage"] = dict(g["score"]["coverage"], **{"pass": False})
        tally("coverage failing", gap_noted(g) is None, cn)
        if e.get("option_key"):
            # Every list its own option (no key takes two lists), then a list of the group taken out: neither closes.
            g = copy.deepcopy(f)
            for i, b in enumerate(g["record"]["blocks"]):
                if b.get("option_group"):
                    b["name"] = "Pattern %d: list" % (i + 1)
            tally("each list its own option", gap_noted(g) is None, cn)
            g = copy.deepcopy(f)
            last = max(i for i, b in enumerate(g["record"]["blocks"]) if b.get("option_group"))
            del g["record"]["blocks"][last]
            tally("a list of the group gone", gap_noted(g) is None, cn)
        if e.get("waived"):
            moved = dict(e, waived=dict(e["waived"], units=e["waived"]["units"] + 1))
            tally("the course one unit more", gap_noted(f, {cn: moved}) is None, cn)
            g = copy.deepcopy(f)
            g["record"]["notes"] = [WAIVE.sub("", n) for n in g["record"]["notes"]]
            tally("no waiver words", gap_noted(g, {cn: dict(e, words=WAIVE.sub("", e["words"]))}) is None, cn)
            g = copy.deepcopy(f)
            g["record"]["notes"] = g["record"]["notes"] + ["JAPAN 001 and 002 are prerequisites to JAPAN 003."]
            tally("a note naming prerequisites", gap_noted(g) is None, cn)
    return {"counts": dict(out), "wrong": wrong}


# The shapes, by hand, over the census's 17.
SHAPE_HAND = {"option_key": frozenset({"30206", "30207", "36628", "40322"}),
              "waived_shape": frozenset({"04069", "22874", "41673", "41674", "04073"})}
SHAPES = {"option_key": option_key, "waived_shape": waived_shape}


def self_recall(census_path: str = CENSUS) -> dict:
    """Each shape check against SHAPE_HAND over the census's members: right and wrong."""
    out = {}
    members = census_members(census_path)
    for kind, fn in SHAPES.items():
        right, wrong = 0, []
        for cn in members:
            f = _load(cn)
            got = bool(f and fn(f))
            if got == (cn in SHAPE_HAND[kind]):
                right += 1
            else:
                wrong.append(cn)
        out[kind] = {"right": right, "wrong": wrong, "shape": len(SHAPE_HAND[kind])}
    return out


# Each shape's statewide fires, by college and control number (the S730 run, each read by hand as the shape).
_SB = lambda *cns: [(COLLEGE, cn) for cn in cns]  # noqa: E731
STATEWIDE = {
    "option_key": frozenset(_SB("30206", "30207", "36628", "40322")),
    # CUL 171 or a ServSafe Certification at 11 more Saddleback culinary and hospitality awards; DR 100's exemption;
    # the piano proficiency exam (04073, held: two gaps); TECALC 087 waived by placing into a transfer-level MATH
    # course (San Bernardino Valley 22784, not this plan's college).
    "waived_shape": frozenset(_SB("04069", "04073", "04094", "04119", "09869", "22874", "22902", "22903", "22904",
                                  "41673", "41674", "44664", "44665", "44666")
                              + [("San Bernardino Valley College", "22784")]),
}
# The fire the waiver shape leaves out by its prerequisite words: a reading prerequisites_counted owns.
STATEWIDE_OUT = {"waived_shape": frozenset({("Los Angeles City College", "02746")})}
STATEWIDE_FIXTURE = os.path.join(ROOT, "tests", "fixtures", "saddleback_shapes_statewide_s730.json")


def statewide_fires(base: str = NG.COLLEGE_DIR) -> dict:
    """{shape: {(college, control number)}}: every filed record at every college on which each shape fires."""
    out = {k: set() for k in SHAPES}
    for path in glob.glob(os.path.join(base, "*", "records", "*.json")):
        try:
            with open(path, encoding="utf-8") as fh:
                f = json.load(fh)
        except (OSError, ValueError):
            continue
        if not isinstance(f, dict):
            continue
        for k, fn in SHAPES.items():
            if fn(f):
                out[k].add((f.get("college"), str(f.get("control_number"))))
    return out


def fixture_records(path: str = STATEWIDE_FIXTURE) -> list[dict]:
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)["records"]


def fixture_fires(path: str = STATEWIDE_FIXTURE) -> dict:
    """Each shape on the pinned fields of the statewide fires and the one left out (the test's form: a later read at
    another college never moves it)."""
    recs = fixture_records(path)
    return {k: {(r["college"], r["control_number"]) for r in recs if fn(r)} for k, fn in SHAPES.items()}


def write_fixture(path: str = STATEWIDE_FIXTURE) -> None:
    keys = set().union(*STATEWIDE.values(), *STATEWIDE_OUT.values())
    recs = []
    for path_ in sorted(glob.glob(os.path.join(NG.COLLEGE_DIR, "*", "records", "*.json"))):
        with open(path_, encoding="utf-8") as fh:
            f = json.load(fh)
        if isinstance(f, dict) and (f.get("college"), str(f.get("control_number"))) in keys:
            recs.append({"college": f["college"], "control_number": str(f["control_number"]),
                         "record": {"blocks": [{k: b.get(k) for k in ("name", "rule", "option_group", "stated")}
                                               for b in f["record"].get("blocks") or []],
                                    "notes": f["record"].get("notes") or []},
                         "score": {"arithmetic": {k: (f["score"].get("arithmetic") or {}).get(k)
                                                  for k in ("status", "pass", "computed", "stated")}}})
    recs.sort(key=lambda r: (r["college"], r["control_number"]))
    with open(path, "w", encoding="utf-8") as fh:
        json.dump({"_what": "S730 (lane 2, Saddleback): the statewide fires of kb/_program_piles_s730_saddleback.py's "
                            "two shape checks and the one the waiver shape leaves out, their blocks' names, rules, "
                            "option groups and figures, notes and arithmetic as filed at the plan, pinned so a later "
                            "read never moves the test.",
                   "records": recs}, fh, ensure_ascii=False, indent=1)
        fh.write("\n")


# ── the plan ───────────────────────────────────────────────────────────────
def plan(write: bool, census_path: str = CENSUS) -> dict:
    rows, held, hits = [], [], []
    src = _sources()
    year = None
    cap = os.path.join(NG.COLLEGE_DIR, SLUG, "capture.json")
    if os.path.isfile(cap):
        with open(cap, encoding="utf-8") as fh:
            year = json.load(fh).get("catalog_year")
    images = NG._load_images({COLLEGE})
    for cn in census_members(census_path):
        f = _load(cn)
        if f is None:
            held.append({"control_number": cn, "why": HAND.get(cn, "no record file")})
            continue
        if S.passes_live(f.get("score")) or (f.get("score") or {}).get("gaps"):
            continue
        gap, words, c = outcome(f, src)
        if gap == "none":
            held.append({"control_number": cn, "why": HAND.get(cn, "not hand-held"), "claim": c})
            continue
        img = images.get((COLLEGE, cn))
        if img is None or F.row_passes(img["checks"]):
            held.append({"control_number": cn, "why": "the load leaves it out, or its image passes"})
            continue
        e = src.get(cn) or {}
        score = copy.deepcopy(f["score"])
        score["gaps"] = [{"gap": gap, "label": NG.GAPS[gap], "words": words}]
        score["confidence"] = NG.confidence(dict(f, score=score), gap, e.get("method"),
                                            (e.get("catalog_year") or year) == year)
        hits.append((cn, f, score, gap, words, img))
    for cn, f, score, gap, words, img in hits:
        row = {"college": COLLEGE, "control_number": cn, "award": f.get("award"),
               "extracted_run": f.get("extracted_run"), "moves_to": gap, "words": words,
               "confidence": score["confidence"], "path": os.path.relpath(_path(cn), ROOT)}
        if write:
            row["before_image"] = {k: img[k] for k in ("program_title", "award", "catalog_year", "source_url",
                                                       "measure", "total_min", "total_max", "record", "checks",
                                                       "extracted_run")}
            with open(_path(cn), "w", encoding="utf-8") as fh:
                json.dump(dict(f, score=score), fh, ensure_ascii=False, indent=1)
                fh.write("\n")
        rows.append(row)
    if write and rows:
        after = NG._load_images({COLLEGE})
        for r in rows:
            img = after[(COLLEGE, r["control_number"])]
            if img["record"] != r["before_image"]["record"] or (img["checks"].get("gaps") or []) != [r["moves_to"]]:
                raise SystemExit("%s: the record changed, or its image does not carry the gap" % r["control_number"])
            r["after_image"] = {"checks": img["checks"]}
    for i, r in enumerate(rows, 1):
        r["i"] = i
    return {"rows": rows, "held": held}


def md5_pre_read(rows: list[dict]) -> str:
    """F.md5_pre_read, its query sent to the local Postgres on stdin (images of many courses pass the kernel's
    argument limit as one -c argument). The SQL is F's own, never a copy; Palo Verde's form."""
    import subprocess
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
        assert subprocess.run is real


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--tag", default=TAG)
    ap.add_argument("--write-fixture", action="store_true")
    a = ap.parse_args(argv)
    for g, score in NEW_KINDS.items():
        if g not in NG.GAPS or NG.ARITH_SCORE.get(g) != score:
            raise SystemExit("%s has no sentence or score in kb/_program_named_gaps.py" % g)
    pr, cc, bd, sr, lv = precision(), claim_checks(), boundaries(), self_recall(), lever()
    sw = statewide_fires()
    print("precision: %s" % json.dumps(pr))
    print("self-recall: %s" % json.dumps(sr))
    print("lever: %s" % json.dumps(lv))
    for k in SHAPES:
        print("statewide %s: %d fires (pinned %d, equal %s)" % (k, len(sw[k]), len(STATEWIDE[k]), sw[k] == STATEWIDE[k]))
    print("claim checks: %s" % json.dumps(cc))
    print("boundaries: %s" % json.dumps(bd))
    if pr["wrong"] or pr["not_hand_held"] or bd["wrong"] or cc["not_standing"] or lv["wrong"] \
            or any(v["wrong"] for v in sr.values()) or any(sw[k] != STATEWIDE[k] for k in SHAPES):
        raise SystemExit("the self-recall reads a wrong answer: no plan is written")
    if a.write_fixture:
        write_fixture()
        print("fixture %s" % os.path.relpath(STATEWIDE_FIXTURE, ROOT))
    res = plan(write=not a.dry_run)
    by = dict(collections.Counter(r["moves_to"] for r in res["rows"]))
    print("plan: %d rows %s; held %d" % (len(res["rows"]), by, len(res["held"])))
    if a.dry_run or not res["rows"]:
        return 0
    rows = res["rows"]
    stamp = time.gmtime()
    day = time.strftime("%Y-%m-%d", stamp)
    path = os.path.join(NG.RECEIPTS, "program_requirement_records_piles_s730_saddleback_%s_%s.json" % (day, a.tag))
    body = {"rule": NG.RULING + "; S730: Saddleback's 17 wording-rule records, collected with their gaps named where "
                                "one is honest (no reread, no reconcile); records a repeat step passes held on the "
                                "reconcile lever",
            "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", stamp), "college": COLLEGE,
            "census": {"file": os.path.relpath(CENSUS, ROOT), "run": "45586922147", "levers": list(LEVERS),
                       "person": list(PERSON), "members": census_members()},
            "gaps": {g: NG.GAPS[g] for g in sorted(by)}, "moved": len(rows), "by": by,
            "precision": pr, "self_recall": sr, "lever": lv,
            "statewide": {k: sorted(list(x) for x in sw[k]) for k in SHAPES},
            "statewide_left_out": {k: sorted(list(x) for x in v) for k, v in STATEWIDE_OUT.items()},
            "claim_checks": cc, "boundaries": bd, "held": res["held"], "records": rows,
            "shared_pages": {r["control_number"]: shared_with(r["control_number"]) for r in rows
                             if shared_with(r["control_number"])},
            "representation": "checks.gaps and checks.confidence added as the load reads the filed score; "
                              "checks.arithmetic, coverage, invented and the record unchanged",
            "claim_check_reads": ("Today's capture (sources.json): every course an entry names among the codes it "
                                  "found, and each record's read page its own. The capture keeps no page text, so a "
                                  "note's quoted figures are the reader's words, never re-read here."),
            "follow_verdict": P.FOLLOW_VERDICT,
            "pre_read": P.confirm_pre_read(rows), "pre_read_md5": md5_pre_read(rows),
            "apply": P.confirm_guarded_apply(rows, a.tag + " piles"),
            "rollback": NG.rollback_sql(rows, a.tag + " piles rollback")}
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(body, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    rel = os.path.relpath(path, ROOT)
    hdr = ("-- %s lane 2's cheap piles at Saddleback (%d rows: %s). Each row's checks become the\n"
           "-- college load's image of its committed record (load_rows): checks.gaps and checks.confidence added; the\n"
           "-- record unchanged. Receipt: %s (before_image per row).\n"
           % (a.tag.upper(), len(rows), ", ".join("%s %d" % kv for kv in sorted(by.items())), rel))
    base = os.path.join(HERE, "migrations", "%s_%s_prreq_piles_" % (day, a.tag))
    parts = {
        "preread_md5.sql": ("-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text\n"
                            "-- (the full before-values, the fallback where a hash does not match, are in "
                            "..._preread.sql).\n" + body["pre_read_md5"]),
        "preread.sql": "-- Pre-read, read-only: one SELECT, one JSON value.\n" + body["pre_read"],
        "apply.sql": ("-- Guarded UPDATE: only where the row holds the filed run, the before-image's record and checks,\n"
                      "-- and no person's check. It aborts, writing nothing, unless it matches the plan's %d rows less\n"
                      "-- those a person checked (listed as skipped_checked), or a row holds a matching confirm.\n"
                      % len(rows) + body["apply"]),
        "rollback.sql": ("-- Rollback, NOT applied: the before-image's checks back where the row still holds the\n"
                         "-- after-image, skipping and listing a row a person checked. A rollback lasts only until the\n"
                         "-- next load of that college: revert the record files too (git revert of this plan's commit).\n"
                         + body["rollback"]),
    }
    for name, text in parts.items():
        with open(base + name, "w", encoding="utf-8") as fh:
            fh.write(hdr + text + "\n")
    print("receipt %s" % rel)
    return 0


if __name__ == "__main__":
    sys.exit(main())
