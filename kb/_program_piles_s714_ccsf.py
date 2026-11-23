#!/usr/bin/env python3
"""S714, lane 2's cheap piles at City College of San Francisco: two free readings and their plan, no paid read.

The census (kb/status/harvest_gap_census.json, run 45161770730) lists 28 City College of San Francisco programs under
the reconcile_steps lever; S713 held six more for a list or wording rule (held_s713.json): 17954, whose record is
filed and was never loaded, and five with no record. Every one is read by hand below (HAND_HELD, with its cause).

READING 1, A CROSS-LISTED COURSE AND A MISREAD CODE (kb/program_requirements_reconcile.json, the college's
course_renumbers). The state's file lists one row for a cross-listed course, LALS/LGBT 9 The Latinx LGBTQ+ Experience
(3 units), and no LALS 9 or LGBT 9; the 2026-2027 catalog prints it as LALS 9, as LGBT 9, or as both. The file stores
CNIT 133I JavaScript for IoT and XR as 'CNIT 133l', a lower-case L, and lists no CNIT 133I. Each printed code is
renamed to the file's row, cited by the title and units both print, and never where the file lists the printed code.

READING 2, ONE OPTION OVER SEVERAL BLOCKS (kb/_program_requirements_score.py, option_parts). Data Science A.S. 42228
prints "Choose one of the following options Units 5.0-10.0": Option 1 (MATH 108) or Option 2 (CS 110A and one
statistics course, 9.0-10.0). The reading kept Option 2 as two blocks of the group, "Option 2" and "Option 2: A
statistics course", and the scorer took the second as a third alternative (25-29 against 26-33). Blocks of one group
whose names open with the same "Option N" are one option: their units add up (26-33).

Each reading rescores the filed score from the record and the filed lists, with no closed list and no page text: the
arithmetic is re-added by the scorer only where, with option_parts off, it reproduces the filed arithmetic exactly;
the renumber renames a code only where the filed score names the file's code missing or placed (the S713 rescore's
shape, kb/_program_piles_s713.py rescore_common_numbers). The record itself is never changed.

THE SELF-RECALL (p-self-recall-reads-rule-fields-s703): the held answer is the hand reading, never a rule's own
fields; the claim check reads the record's notes, the reader's own words; the capture of today (sources.json) holds
no page text a session can read (p-claim-check-reads-current-capture-s713); boundary readings move one figure or one
code across each edge; the precision count runs over every hand-held record.

    python3 kb/_program_piles_s714_ccsf.py --dry-run   # the counts and the self-recall; writes nothing
    python3 kb/_program_piles_s714_ccsf.py --tag s714c # rewrite the records, the receipt and the migration files

Guard: tests/program_piles_s714_ccsf_test.py.
"""
from __future__ import annotations

import argparse
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
import _program_requirements_reconcile as R  # noqa: E402
import _program_requirements_score as S  # noqa: E402

ROOT = os.path.dirname(HERE)
COLLEGE_DIR = NG.COLLEGE_DIR
CENSUS = NG.CENSUS
COLLEGE = "City College of San Francisco"
SLUG = "city_of_san_francisco"
LEVER = "reconcile_steps"

REN = "passes: the page's code is the file's cross-listed or misread row (course_renumbers)"
PARTS = "passes: Option 2's two blocks are one option (option_parts)"
CNIT_OPTION = ("held: the shared CNIT page's record holds all six options of one option group, and the program is "
               "the one option its title names (core 9 + network course 3 + option 9.0-10.0 = 21.0-22.0); the scorer "
               "reads no title, so an own-option reading waits on a reconcile step that names each program's option")
FRENCH = ("held: the section prints one figure over the third-level option and the electives ('Choose 18 units from "
          "the following courses Units 18.0'; the certificate's 'Choose a minimum of 16 units ... 16.0-18.0'), and "
          "the record leaves Electives with no figure; a wrapper-fill step (the wrapper's figure is the program "
          "total) on the page's words")
CUT = ("held: the reader's note says the list continues on a page the read did not hold; section_cut_off reads no "
       "gap at the college (CUT_OFF_COLLEGES), and its matcher does not read this note's wording")
# The hand reading of the 28 census records and S713's six (S714).
HAND_HELD = {
    "30897": REN, "35690": REN, "46323": REN, "46324": REN, "46326": REN, "40704": REN, "40876": REN,
    "42228": PARTS,
    "17614": CNIT_OPTION, "17615": CNIT_OPTION, "17616": CNIT_OPTION, "17617": CNIT_OPTION, "17618": CNIT_OPTION,
    "17619": CNIT_OPTION + "; Option 6 also reads garbled (CNIT 416 and CNIT 415, 6 units, against the page's "
                           "9.0-10.0), a reread of that option",
    "16990": FRENCH, "38267": FRENCH,
    "05482": "held: the reader's note says the catalog prints no major total (the lists add to 42); "
             "total_not_printed takes it once a page read lists it in kb/program_total_not_printed.json",
    "16991": "held: 'Choose 15 units from the following Units 15.0' wraps three option levels that add to 16-18 "
             "(the reader's note), with no block for the wrapper; the catalog's figures (15 + 3) make the printed 18",
    "19037": "held: the record's note says its page (p.207) reads as Liberal Arts and Sciences: Emphasis in Science and "
             "Mathematics, 17954's own section, not Biological Sciences; whether the 2026-2027 catalog prints "
             "Biological Sciences A.S. is a page read (program_discontinued if it does not)",
    "17954": "held: one 18-unit list ('Complete 18 units from the following courses (at least one each from Science "
             "and Math options)') read as two at-least-one blocks; a fill_to step reads it, but 19037's record "
             "carries the same heading from the same page, so the step waits on 19037's page read; never loaded",
    "32079": "held: coverage: the state's file lists CS 110A, MATH 115 and STAT C1000 for Mathematics AS-T, which "
             "the 2026-2027 page does not print (it prints CS 110B, CS 111B and CS 131B); the file's list is older "
             "than the page, for a person or the file's refresh",
    "33208": CUT + " ('The text is cut off at the end of page 184': Option 2's List B is on p.185)",
    "37781": CUT + " (the list starts on p.252, about 4 units, HCT 61 and HCT 67 by the note; the read began on p.253)",
    "38907": "held: the read began mid-section, so the intermediate option's other alternative (SPAN 3, 5 units, on "
             "p.185) is missing and the low end reads 17 against the printed 16; a cut-off read whose sum is not short",
    "38909": "held: 'a total of 12 elective units ... At least 3 units must be selected from each of the three areas' "
             "read as three 3-unit areas (9), so the record adds to 24 against 27; a pool_lists with_floors step on "
             "the page's words",
    "39727": "held: Option 1's third-level choice reads CHIN 3 or CHIN 3A or CHIN 3B singly (3-5) where the page "
             "prints CHIN 3 or both CHIN 3A and 3B (5-6); with option_parts it adds to 14-18 against 16-18",
    "40157": "held: the two option headings print 'Units 2.0-5.0' over options that add to 1.0-5.0 and 1.5-5.0, so "
             "the catalog's own figures differ (17.5 against 19.0), for a person",
    "41315": "held: coverage: the state's file lists PSYC 23, which the page does not print; and the reading lists "
             "POLS 12 twice in one list (repeated)",
    "41361": "held: the required courses print 12.0-12.5 and add to 12.5 (EMT 12 at 0.5), so the low end reads 20.5 "
             "against the printed 20.0; total_differs once a page read lists both figures",
}
# S713's five held with no record file (held_s713.json): each moves only by an extraction once a list rule exists.
NO_RECORD = {
    "09178": "its list (JOUR 19, 21, 24A or 29A, 35, 36, LI S 10) matches a third of the state's list",
    "17952": "the pages from its heading name none of the state's listed courses",
    "31602": "its requirements name none of the state's listed courses",
    "36964": "its list prints ESLN courses in hours, none on the state's list",
    "42318": "its list prints ESLN courses in hours, none on the state's list",
}


# ── the rescore ───────────────────────────────────────────────────────────
@contextlib.contextmanager
def parts_off():
    """The scorer with option_parts off: what the filed run's scorer added."""
    saved = S.OPTION_PARTS_ON
    S.OPTION_PARTS_ON = False
    try:
        yield
    finally:
        S.OPTION_PARTS_ON = saved


def arithmetic(filed: dict) -> tuple[dict, dict]:
    """(the arithmetic with option_parts off, the arithmetic with it on), from the record alone."""
    rec, award = filed.get("record") or {}, filed.get("award")
    with parts_off():
        before = S.score(rec, [], None, award)["arithmetic"]
    return before, S.score(rec, [], None, award)["arithmetic"]


def renumbers(college: str = COLLEGE) -> dict:
    """{a printed code, normalized: the file's code, normalized}: the college's whole-course renumbers."""
    table = R.prefix_aliases(college) or {}
    return {S.norm_code(k): S.norm_code(v) for k, v in table.items() if re.search(r"\d", k)}


def _renamer(table: dict):
    return lambda code: table.get(S.norm_code(code))


def _overall(sc: dict) -> bool:
    return bool((sc.get("coverage") or {}).get("pass") and (sc.get("invented") or {}).get("pass")
                and (sc.get("arithmetic") or {}).get("pass") and (sc.get("repeated") or {}).get("pass", True)
                and (sc.get("outcomes") or {}).get("pass", True))


def rescore(filed: dict, table: dict | None = None) -> dict | None:
    """The filed score under the two readings: {"score", "moves", "not_exact"}, or None where nothing moves."""
    sc = copy.deepcopy(filed.get("score") or {})
    moves, not_exact = [], []
    before, after = arithmetic(filed)
    if after != before and after != sc.get("arithmetic"):   # a filed score the reading already moved stays
        if before == sc.get("arithmetic"):
            sc["arithmetic"] = after
            moves.append("arithmetic")
        else:
            not_exact.append("arithmetic")
    rn = P.rescore_common_numbers(dict(filed, score=sc), name_of=_renamer(renumbers() if table is None else table),
                                  key="course_renumbers")
    if rn and rn["exact"]:
        sc = rn["score"]
        moves.append("course_renumbers")
    elif rn:
        not_exact.append("course_renumbers")
    if not moves and not not_exact:
        return None
    sc["pass"] = _overall(sc)
    return {"score": sc, "moves": moves, "not_exact": not_exact}


def outcome(filed: dict) -> tuple[str, dict]:
    rs = rescore(filed)
    sc = rs["score"] if rs and not rs["not_exact"] else filed.get("score")
    return ("passes" if S.passes_live(sc) else "none"), sc


# ── the census and the hand reading ───────────────────────────────────────
def census_members(path: str = CENSUS) -> list[str]:
    with open(path, encoding="utf-8") as fh:
        d = json.load(fh)
    for lv in d.get("levers") or []:
        if lv.get("lever") == LEVER and lv.get("scope") == COLLEGE:
            return list(lv.get("members") or [])
    return []


def members(path: str = CENSUS) -> list[str]:
    """The census's members and S713's held record 17954 (its five with no record are NO_RECORD)."""
    out = census_members(path)
    return out + [cn for cn in ("17954",) if cn not in out]


def _path(cn: str) -> str:
    return os.path.join(COLLEGE_DIR, SLUG, "records", cn + ".json")


def _load(cn: str) -> dict | None:
    p = _path(cn)
    if not os.path.isfile(p):
        return None
    with open(p, encoding="utf-8") as fh:
        return json.load(fh)


def hand_answer(cn: str) -> str:
    return "passes" if HAND_HELD.get(cn, "").startswith("passes") else "none"


def reading_of(cn: str) -> str | None:
    w = HAND_HELD.get(cn, "")
    return "course_renumbers" if w == REN else "option_parts" if w == PARTS else None


def precision(census_path: str = CENSUS) -> dict:
    out = {"read": 0, "right": 0, "wrong": 0, "no_record_file": 0, "not_hand_held": 0,
           "by_answer": collections.Counter(), "wrong_keys": []}
    for cn in members(census_path):
        filed = _load(cn)
        if filed is None:
            out["no_record_file"] += 1
            continue
        if cn not in HAND_HELD:
            out["not_hand_held"] += 1
            continue
        got, truth = outcome(filed)[0], hand_answer(cn)
        out["read"] += 1
        out["by_answer"][truth] += 1
        if got == truth:
            out["right"] += 1
        else:
            out["wrong"] += 1
            out["wrong_keys"].append({"control_number": cn, "hand": truth, "rule": got})
    out["by_answer"] = dict(out["by_answer"])
    return out


# ── the claim checks: the reader's notes, apart from the scorer's fields ──
REN_NAMED = re.compile(r"\bLALS\s*/\s*LGBT\s*9\b|\bCNIT\s*133\s*[lI]\b", re.I)
REN_STANDS = re.compile(r"\b(?:treated|matched|matching|matches|same\s+course|cross-?listed|recorded\s+as\s+one)\b",
                        re.I)
REN_AGAINST = re.compile(r"\b(?:not\s+the\s+same|another\s+course|different\s+course|differs?\s+from)\b", re.I)
PARTS_STANDS = re.compile(r"\bone\s+combined\s+option\b|\btaken\s+together\b|\btogether\s+form\s+option\b"
                          r"|\bconsists?\s+of\b[^.;]{0,60}\bAND\b", re.I)
PARTS_AGAINST = re.compile(r"\bas\s+a\s+third\s+option\b(?![^.;]{0,5}\))(?<!not as a third option)", re.I)


def claim(filed: dict, reading: str) -> str:
    """'stands', 'against' or 'silent': what the record's notes say of the reading."""
    notes = [str(n) for n in (filed.get("record") or {}).get("notes") or []]
    if reading == "course_renumbers":
        said = [n for n in notes if REN_NAMED.search(n)]
        if any(REN_AGAINST.search(n) for n in said):
            return "against"
        return "stands" if any(REN_STANDS.search(n) for n in said) else "silent"
    said = [n for n in notes if re.search(r"\boption\b", n, re.I)]
    if any(re.search(r"\bnot\s+as\s+a\s+third\s+option\b", n, re.I) for n in said):
        return "stands"
    if any(PARTS_AGAINST.search(n) for n in said):
        return "against"
    return "stands" if any(PARTS_STANDS.search(n) for n in said) else "silent"


def claim_checks(census_path: str = CENSUS) -> dict:
    out = {"course_renumbers": collections.Counter(), "option_parts": collections.Counter(), "against_keys": []}
    for cn in members(census_path):
        filed = _load(cn)
        if filed is None:
            continue
        rs = rescore(filed)
        if not rs or rs["not_exact"]:
            continue
        used = []
        if "arithmetic" in rs["moves"] and S.option_parts(filed.get("record") or {}):
            used.append("option_parts")
        if "course_renumbers" in rs["moves"]:
            used.append("course_renumbers")
        for reading in used:
            c = claim(filed, reading)
            out[reading][c] += 1
            if c != "stands":
                out["against_keys"].append([cn, reading, c])
    return {k: (dict(v) if isinstance(v, collections.Counter) else v) for k, v in out.items()}


# ── the boundary readings ─────────────────────────────────────────────────
def _with_total(filed: dict, lo: float, hi: float) -> dict:
    f = copy.deepcopy(filed)
    f["record"]["program"]["total_units"] = {"min": lo, "max": hi}
    return f


def _passes_arith(filed: dict) -> bool:
    return bool(S.score(filed["record"], [], None, filed.get("award"))["arithmetic"].get("pass"))


def boundaries(census_path: str = CENSUS) -> dict:
    """Each reading at its edges, on every record it passes: option_parts with the printed total one unit short or
    past at the low end (no pass), with the split option's blocks renamed apart ("Option 2" and "Option 3": no part,
    no pass) and with the two blocks given one name (alternatives, never parts: no pass); the renumber where the file
    lists the printed code itself (no rename) or lists neither (no rename), and with one wrong letter in the printed
    code (no rename)."""
    out, wrong = collections.Counter(), []

    def tally(name, ok, cn):
        out["%s %s" % (name, "right" if ok else "wrong")] += 1
        if not ok:
            wrong.append([cn, name])

    for cn in members(census_path):
        filed = _load(cn)
        reading = reading_of(cn)
        if filed is None or reading is None:
            continue
        if reading == "option_parts":
            st = S._span(filed["record"]["program"].get("total_units"))
            for name, (lo, hi) in (("total low one short", (st[0] - 1, st[1])),
                                   ("total low one past", (st[0] + 1, max(st[1], st[0] + 1)))):
                tally(name, not _passes_arith(_with_total(filed, lo, hi)), cn)
            parts = S.option_parts(filed["record"])
            split = [i for i, (g, k) in parts.items()
                     if sum(1 for gk in parts.values() if gk == (g, k)) > 1]
            f = copy.deepcopy(filed)
            nb = f["record"]["blocks"][split[-1]]
            nb["name"] = re.sub(r"(?i)^(\s*option\s+)(\d+)", lambda m: m.group(1) + str(int(m.group(2)) + 1),
                                nb["name"])
            tally("split block renamed apart", not S.option_parts(f["record"]) and not _passes_arith(f), cn)
            f = copy.deepcopy(filed)
            for i in split:
                f["record"]["blocks"][i]["name"] = f["record"]["blocks"][split[0]]["name"]
            tally("split blocks given one name", not S.option_parts(f["record"]) and not _passes_arith(f), cn)
        if reading == "course_renumbers":
            sc = filed["score"]
            table = renumbers()
            printed = sorted({k for k in sc["invented"]["codes"] if k in table})
            listed = sorted({table[k] for k in printed})
            listed_too = dict(filed, score=dict(sc, coverage=dict(sc["coverage"], missing=list(
                sc["coverage"]["missing"]) + printed), invented=dict(sc["invented"], codes=[
                    k for k in sc["invented"]["codes"] if k not in printed])))
            rn = P.rescore_common_numbers(listed_too, name_of=_renamer(table), key="course_renumbers")
            tally("file lists the printed code", not rn, cn)
            neither = dict(filed, score=dict(sc, coverage=dict(sc["coverage"], missing=[
                k for k in sc["coverage"]["missing"] if k not in listed])))
            rn = P.rescore_common_numbers(neither, name_of=_renamer(table), key="course_renumbers")
            tally("file lists neither", not rn, cn)
            one_off = {k[:-1] + ("X" if k[-1] != "X" else "Y"): v for k, v in table.items()}
            rn = P.rescore_common_numbers(filed, name_of=_renamer(one_off), key="course_renumbers")
            tally("printed code one letter off", not rn, cn)
    return {"counts": dict(out), "wrong": wrong}


# ── every committed record: main's scorer against this one ────────────────
def every_record() -> list[dict]:
    out = []
    for p in sorted(glob.glob(os.path.join(COLLEGE_DIR, "*", "records", "*.json"))):
        with open(p, encoding="utf-8") as fh:
            f = json.load(fh)
        if isinstance(f.get("score"), dict) and isinstance(f.get("record"), dict):
            out.append(f)
    return out


def changes(every: list[dict]) -> dict:
    """Every committed record whose checks the readings change: at the college (the arithmetic and the renumbers),
    and elsewhere (option_parts alone; the renumbers are the college's), each elsewhere record with what it reads
    before and after. Elsewhere records take no row and no file change here."""
    here, elsewhere, not_exact = [], [], []
    for f in every:
        if f.get("college") == COLLEGE:
            rs = rescore(f)
            if rs:
                row = {"control_number": str(f["control_number"]), "moves": rs["moves"],
                       "passes_before": S.passes_live(f["score"]), "passes_after": S.passes_live(rs["score"])}
                (not_exact if rs["not_exact"] else here).append(dict(row, not_exact=rs["not_exact"]))
            continue
        before, after = arithmetic(f)
        if before != after:
            elsewhere.append({"college": f["college"], "control_number": str(f["control_number"]),
                              "exact": before == f["score"].get("arithmetic"),
                              "arith_before": [before.get("computed"), bool(before.get("pass"))],
                              "arith_after": [after.get("computed"), bool(after.get("pass"))],
                              "stated": after.get("stated")})
    return {"here": here, "elsewhere": elsewhere, "not_exact": not_exact}


def recall_all(every: list[dict]) -> dict:
    """kb/_program_named_gaps.py's recall over every filed record, the college's rescored."""
    moved = []
    for f in every:
        if f.get("college") == COLLEGE:
            rs = rescore(f)
            if rs and not rs["not_exact"]:
                f = dict(f, score=rs["score"])
        moved.append(f)
    return NG.recall(moved)


# ── the plan ──────────────────────────────────────────────────────────────
def plan(write: bool, census_path: str = CENSUS) -> dict:
    mem = members(census_path)
    rows, held, hits = [], [], []
    loaded = NG._load_images({COLLEGE})
    for cn in mem:
        filed = _load(cn)
        if filed is None:
            held.append({"control_number": cn, "why": "no record file"})
            continue
        if S.passes_live(filed.get("score")):
            continue   # moved already (this plan's own write, read again)
        rs = rescore(filed)
        if not rs or not rs["moves"] or rs["not_exact"] or not S.passes_live(rs["score"]):
            held.append({"control_number": cn, "why": HAND_HELD.get(cn, "not hand-held")})
            continue
        if (COLLEGE, cn) not in loaded:
            held.append({"control_number": cn, "why": "passes, and the load leaves it out: " + HAND_HELD.get(cn, "")})
            continue
        hits.append((_path(cn), filed, rs))
    for cn, why in NO_RECORD.items():
        held.append({"control_number": cn, "why": "S713's hold stands, no record: " + why})
    for p, filed, rs in hits:
        key = (COLLEGE, str(filed["control_number"]))
        row = {"college": COLLEGE, "control_number": str(filed["control_number"]), "award": filed.get("award"),
               "extracted_run": filed.get("extracted_run"), "moves_to": "passes", "readings": [
                   r for r, on in (("option_parts", "arithmetic" in rs["moves"]),
                                   ("course_renumbers", "course_renumbers" in rs["moves"])) if on],
               "path": os.path.relpath(p, ROOT)}
        if write:
            img = loaded[key]
            row["before_image"] = {k: img[k] for k in ("program_title", "award", "catalog_year", "source_url",
                                                       "measure", "total_min", "total_max", "record", "checks",
                                                       "extracted_run")}
            filed["score"] = rs["score"]
            with open(p, "w", encoding="utf-8") as fh:
                json.dump(filed, fh, ensure_ascii=False, indent=1)
                fh.write("\n")
        rows.append(row)
    # Every other record of the college the readings change is rescored on disk too, so a committed file never
    # disagrees with the scorer; it takes no plan row, and the receipt lists it. A record whose filed arithmetic the
    # scorer no longer reproduces with the reading off (an older scorer's) and that passes both ways stays as filed.
    planned = {r["control_number"] for r in rows}
    rescored, left = [], []
    for p in sorted(glob.glob(os.path.join(COLLEGE_DIR, SLUG, "records", "*.json"))):
        with open(p, encoding="utf-8") as fh:
            filed = json.load(fh)
        cn = str(filed.get("control_number"))
        if not isinstance(filed.get("score"), dict) or cn in planned:
            continue
        rs = rescore(filed)
        if not rs:
            continue
        if rs["not_exact"] or not rs["moves"]:
            left.append({"control_number": cn, "not_exact": rs["not_exact"],
                         "passes_filed": S.passes_live(filed["score"])})
            continue
        rescored.append({"control_number": cn, "moves": rs["moves"], "passes_after": S.passes_live(rs["score"]),
                         "why": HAND_HELD.get(cn, "outside the census lever")})
        if write:
            filed["score"] = rs["score"]
            with open(p, "w", encoding="utf-8") as fh:
                json.dump(filed, fh, ensure_ascii=False, indent=1)
                fh.write("\n")
    if write and rows:
        after = NG._load_images({COLLEGE})
        for r in rows:
            img = after[(COLLEGE, r["control_number"])]
            if img["record"] != r["before_image"]["record"]:
                raise SystemExit("a reading changed the record of %s" % r["control_number"])
            r["after_image"] = {"checks": img["checks"]}
    for i, r in enumerate(rows, 1):
        r["i"] = i
    return {"rows": rows, "held": held, "members": mem, "rescored_not_planned": rescored, "left_as_filed": left,
            "by": dict(collections.Counter("+".join(r["readings"]) for r in rows))}


CLAIM_CHECK_READS = (
    "The claim checks read the record's notes: the reader's own words from the read behind the record "
    "(extracted_run). The page text of that read stays in its run's artifact, which a session cannot read, and "
    "sources.json describes the college's latest capture, another read that commits no page text "
    "(p-claim-check-reads-current-capture-s713); no claim check here reads it.")


def stop_reasons(pr: dict, cc: dict, bd: dict, rc: dict, ch: dict) -> list[str]:
    """What keeps the plan from being written: a wrong answer anywhere in the self-recall, a college record the
    readings move inexactly that does not pass as filed, or an elsewhere record the reading moves from passing."""
    out = []
    if pr["wrong"] or pr["not_hand_held"]:
        out.append("precision")
    if rc["wrong"]:
        out.append("named-gaps recall")
    if bd["wrong"]:
        out.append("boundaries")
    if cc["against_keys"]:
        out.append("claim checks")
    if any(not r["passes_before"] for r in ch["not_exact"]):
        out.append("not exact")
    if any(e["arith_before"][1] and not e["arith_after"][1] for e in ch["elsewhere"]):
        out.append("elsewhere unpassed")
    return out


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--tag", default="s714c")
    a = ap.parse_args(argv)
    every = every_record()
    pr, cc, bd, rc, ch = precision(), claim_checks(), boundaries(), recall_all(every), changes(every)
    print("precision against the hand reading: read %d, right %d, wrong %d (%s); no record file %d; not hand-held %d"
          % (pr["read"], pr["right"], pr["wrong"], ", ".join("%s %d" % kv for kv in sorted(pr["by_answer"].items())),
             pr["no_record_file"], pr["not_hand_held"]))
    for w in pr["wrong_keys"]:
        print("  wrong: %(control_number)s hand %(hand)s, rule %(rule)s" % w)
    print("claim checks: %s" % json.dumps(cc))
    print("boundaries: %s" % json.dumps(bd))
    print("named-gaps recall: held %d, right %d, wrong %d" % (rc["held"], rc["right"], rc["wrong"]))
    print("changes: here %d (%s); elsewhere %d (%d move to passing, %d from passing); not exact %d" % (
        len(ch["here"]), ", ".join("%s %s" % (r["control_number"], "+".join(r["moves"])) for r in ch["here"]),
        len(ch["elsewhere"]), sum(1 for e in ch["elsewhere"] if e["arith_after"][1] and not e["arith_before"][1]),
        sum(1 for e in ch["elsewhere"] if e["arith_before"][1] and not e["arith_after"][1]), len(ch["not_exact"])))
    stop = stop_reasons(pr, cc, bd, rc, ch)
    if stop:
        raise SystemExit("the self-recall reads a wrong answer (%s): no plan is written" % ", ".join(stop))
    res = plan(write=not a.dry_run)
    print("plan: %d rows (%s); held %d; rescored not planned %d; left as filed %d" % (
        len(res["rows"]), ", ".join("%s %d" % kv for kv in sorted(res["by"].items())), len(res["held"]),
        len(res["rescored_not_planned"]), len(res["left_as_filed"])))
    if a.dry_run or not res["rows"]:
        return 0
    day = time.strftime("%Y-%m-%d", time.gmtime())
    path = os.path.join(NG.RECEIPTS, "program_requirement_records_piles_ccsf_%s_%s.json" % (day, a.tag))
    rows = res["rows"]
    body = {"rule": NG.RULING + "; S714: a cross-listed course and a misread code renamed, one option over several "
                                "blocks",
            "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "college": COLLEGE,
            "census": {"file": os.path.relpath(CENSUS, ROOT), "lever": LEVER, "members": census_members(),
                       "with_s713_held": ["17954"] + sorted(NO_RECORD)},
            "moved": len(rows), "by": res["by"], "precision": pr, "claim_checks": cc, "boundaries": bd,
            "recall": {k: v for k, v in rc.items() if k != "wrong_keys"}, "changes": ch,
            "held": res["held"], "records": rows,
            "representation": ("checks.arithmetic as the scorer reads one option over several blocks; "
                               "checks.coverage and checks.invented as it reads the college's three renumbers; the "
                               "record unchanged"),
            "rescored_not_planned": res["rescored_not_planned"], "left_as_filed": res["left_as_filed"],
            "claim_check_reads": CLAIM_CHECK_READS, "follow_verdict": P.FOLLOW_VERDICT,
            "pre_read": P.confirm_pre_read(rows), "apply": P.confirm_guarded_apply(rows, a.tag + " piles"),
            "rollback": NG.rollback_sql(rows, a.tag + " piles rollback")}
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(body, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    rel = os.path.relpath(path, ROOT)
    hdr = ("-- %s lane 2's cheap piles at City College of San Francisco (%s). Each row's checks become the college\n"
           "-- load's image of its committed record (load_rows); the record itself is unchanged.\n"
           "-- Receipt: %s (before_image per row).\n"
           % (a.tag.upper(), ", ".join("%s %d" % kv for kv in sorted(res["by"].items())), rel))
    base = os.path.join(HERE, "migrations", "%s_%s_prreq_piles_" % (day, a.tag))
    parts = {
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
