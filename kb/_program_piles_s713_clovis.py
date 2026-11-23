#!/usr/bin/env python3
"""S713, lane 2's cheap piles at Clovis: three free readings and their plan, no paid read.

COBIx's brief on #3358 (Nov 22): "the catalog-wording rules at Glendale (28), Clovis (14) ... each with a claim check,
boundary readings and a precision count before its second read." cpl_memory f-clovis-19-left-s697: five Business and
Social Science degrees start or are cut at a page break (#3683 pinned them), and "14 read pairs or 'any course from
List A' wrongly". The committed census lists 16 Clovis records under the catalog-wording lever; 33432 is one of the
five, and the rest were each read by hand below (HAND_HELD, with its cause).

READING 1, A LECTURE AND ITS LAB (kb/_program_requirements_score.py, lab_pairs). Clovis prints "BIOL C1000 or BIOL
C1001 and BIOL C1001L"; the reading kept the pair as two alternatives, so the row's least took the 1-unit lab alone.
An alternative whose code is another alternative's with L added is one option with it.

READING 2, AN EARLIER LIST'S UNUSED COURSES (also_from). "List B: Select one course" over MATH 6, beside the row "Any
course from List A not already used", which the reading kept in its note (or in a list's name), never as courses. The
list's least and most then run over its own courses and the earlier list's leftovers.

READING 3, TWO COURSES RENUMBERED (kb/program_requirements_reconcile.json, Clovis's course_renumbers): SOC 1B for the
file's SOCI 1B and ANTHRO 2 for the file's ANTH 2, each cited by its control number and title; both prefixes stay
unaliased (one number each).

Each reading rescores the filed score from the record and the filed lists, with no closed list and no page text: the
arithmetic only where the scorer with the S713 readings off reproduces the filed arithmetic exactly; the renumber
only where the filed score names the file's code missing or placed. The record itself is never changed. The
self-recall follows kb/_program_piles_s713_glendale.py: the hand reading is the held answer, the claim check reads the
reader's notes (the page text of the read behind the record stays in its run's artifact), boundary readings move one
figure across each edge, and the precision count runs over every hand-held record; the blast radius runs over every
committed record at every college.

    python3 kb/_program_piles_s713_clovis.py --dry-run   # the counts and the self-recall; writes nothing
    python3 kb/_program_piles_s713_clovis.py --tag s713c # rewrite the records, the receipt and the migration files

Guard: tests/program_piles_s713_clovis_test.py.
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
COLLEGE = "Clovis Community College"
SLUG = "clovis_community"
LEVER = "reconcile_steps"

LAB = "passes: a lecture and its lab are one option (lab_pairs)"
ALSO = "passes: a list also takes an earlier list's unused courses (also_from)"
LAB_ALSO = "passes: a lecture and its lab are one option, and the lists take earlier lists' unused courses"
REN = "passes: the printed code is the file's renumbered course (course_renumbers)"
HAND_HELD = {
    # 33502 passes on the lab pair alone; also_from moves only its high end (#3708's second reader).
    "33502": LAB_ALSO, "42235": LAB, "35535": ALSO, "33486": REN, "45957": REN,
    # Outside the census lever: a failing Clovis record the lab pair passes, read by hand (its note: "BIOL C1000 (4)
    # may be replaced by BIOL C1001 (3) AND BIOL C1001L (1) together").
    "33508": LAB,
    "33432": "held: #3683 pins it to pp.106-107 (through); it waits on that pinned reread",
    "33431": "held: two 'Select a minimum' lists add to 11 against 18, and the record keeps no list or line for the "
             "other 7; a reread (33489's page prints the fill sentence in the same catalog)",
    "33489": "held: the note quotes 'Select additional units from the above areas to total at least 18 units', a fill "
             "to the total no field holds; a Clovis reconcile step on the page text passes it free on the runner "
             "(not built here)",
    "33501": "held: MATH 17 prints both in the core and as List A's one course, and 'List A and List B courses total a "
             "minimum of 6 units' reads with the core at 14; a person reads the page",
    "33506": "held: five one-course lists add to 15-17 against 18-20, and the record holds no sixth requirement; a "
             "reread (its ANTH 13 for the file's ANTHRO 13 waits on the state file's title)",
    "36050": "held: the lists add to 18-19 against a printed 19 with no 4-unit course in its first lists; a reread",
    "36326": "held: List A 'Select two to three courses' holds two 1-unit courses (GEOG 1L, GEOG 30), and the printed 18 "
             "needs two 3-unit ones; a person reads the page",
    "37227": "held: the note says MATH C2210 and the statistics course may be alternatives (42 against 39-42); a reread",
    "39539": "held: the prerequisite list adds to 22-23 against its printed 26-27 and Year 1 Fall to 12 against 11; "
             "the catalog's own figures, for a person or a reread",
    "43015": "held: List A pairs 'CHEM 1A AND CHEM 1B' and 'CHEM 28A AND CHEM 29A' under 'Select one to two courses' "
             "(21-26 against 27-31); a reread with the reader's together field",
    "45325": "held: the record holds only the elective list (1-4 against 18-21); the required core is unread, a reread",
}
EXTRA = ("33508",)


@contextlib.contextmanager
def readings_off():
    """The scorer with readings 1 and 2 off: what the filed run's scorer added."""
    saved = S.lab_pairs, S.also_from
    S.lab_pairs, S.also_from = (lambda alts, *a, **k: [dict(x) for x in alts]), (lambda record: {})
    try:
        yield
    finally:
        S.lab_pairs, S.also_from = saved


def arithmetic(filed: dict) -> tuple[dict, dict]:
    rec, award = filed.get("record") or {}, filed.get("award")
    with readings_off():
        before = S.score(rec, [], None, award)["arithmetic"]
    return before, S.score(rec, [], None, award)["arithmetic"]


def renumbers(college: str = COLLEGE) -> dict:
    table = R.prefix_aliases(college) or {}
    return {S.norm_code(k): S.norm_code(v) for k, v in table.items() if re.search(r"\d", k)}


def _renamer(table: dict):
    return lambda code: table.get(S.norm_code(code))


def _overall(sc: dict) -> bool:
    return bool((sc.get("coverage") or {}).get("pass") and (sc.get("invented") or {}).get("pass")
                and (sc.get("arithmetic") or {}).get("pass") and (sc.get("repeated") or {}).get("pass", True)
                and (sc.get("outcomes") or {}).get("pass", True))


def rescore(filed: dict, table: dict | None = None) -> dict | None:
    """The filed score under the three readings: {"score", "moves", "not_exact"}, or None where nothing moves."""
    sc = copy.deepcopy(filed.get("score") or {})
    moves, not_exact = [], []
    before, after = arithmetic(filed)
    if after != before and after != sc.get("arithmetic"):
        if before == sc.get("arithmetic"):
            sc["arithmetic"] = after
            moves.append("arithmetic")
        else:
            not_exact.append("arithmetic")
    if filed.get("college") == COLLEGE:
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


def census_members(path: str = CENSUS) -> list[str]:
    with open(path, encoding="utf-8") as fh:
        d = json.load(fh)
    for lv in d.get("levers") or []:
        if lv.get("lever") == LEVER and lv.get("scope") == COLLEGE:
            return list(lv.get("members") or [])
    return []


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


def readings_of(cn: str) -> list[str]:
    w = HAND_HELD.get(cn, "")
    return {LAB: ["lab_pairs"], ALSO: ["also_from"], LAB_ALSO: ["lab_pairs", "also_from"],
            REN: ["course_renumbers"]}.get(w, [])


def hand_read(census_path: str = CENSUS) -> list[str]:
    return census_members(census_path) + list(EXTRA)


def precision(census_path: str = CENSUS) -> dict:
    out = {"read": 0, "right": 0, "wrong": 0, "no_record_file": 0, "not_hand_held": 0,
           "by_answer": collections.Counter(), "wrong_keys": []}
    for cn in hand_read(census_path):
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


# ── the claim checks: the reader's notes ──
LAB_STANDS = re.compile(r"\b(?:together|pair|both\s+together|and\s+\w+\s+\d+\w*L\b)", re.I)
LAB_AGAINST = re.compile(r"\beither\s+course\s+alone\s+(?:counts|satisfies)\b|\bnot\s+(?:a\s+)?pair\b", re.I)
ALSO_STANDS = S.ALSO_FROM_NOTE
REN_STANDS = re.compile(r"\b(?:same\s+title|treated\s+as\s+the\s+closed\s+list's|matched\s+to\s+closed-list)\b", re.I)
REN_AGAINST = re.compile(r"\b(?:not\s+the\s+same|another\s+course|different\s+course)\b", re.I)


def claim(filed: dict, reading: str) -> str:
    rec = filed.get("record") or {}
    notes = [str(n) for n in rec.get("notes") or []]
    if reading == "lab_pairs":
        said = [n for n in notes if re.search(r"\b[A-Z]{2,6}\s?C?\d{1,4}[A-Z]?L\b", n)]
        if any(LAB_AGAINST.search(n) for n in said):
            return "against"
        return "stands" if any(LAB_STANDS.search(n) for n in said) else "silent"
    if reading == "also_from":
        names = [str(b.get("name") or "") for b in rec.get("blocks") or []]
        return "stands" if (any(ALSO_STANDS.search(n) for n in notes)
                            or any(S.ALSO_FROM_NAME.search(n) for n in names)) else "silent"
    said = [n for n in notes if re.search(r"\b(?:SOC\s?1B|ANTHRO\s?2)\b", n)]
    if any(REN_AGAINST.search(n) for n in said):
        return "against"
    return "stands" if any(REN_STANDS.search(n) for n in said) else "silent"


def claim_checks(census_path: str = CENSUS) -> dict:
    out = {"lab_pairs": collections.Counter(), "also_from": collections.Counter(),
           "course_renumbers": collections.Counter(), "against_keys": []}
    for cn in hand_read(census_path):
        filed = _load(cn)
        if filed is None:
            continue
        for reading in readings_of(cn):
            c = claim(filed, reading)
            out[reading][c] += 1
            if c == "against":
                out["against_keys"].append([cn, reading])
    return {k: (dict(v) if isinstance(v, collections.Counter) else v) for k, v in out.items()}


# ── the boundary readings ──
def _passes_arith(filed: dict) -> bool:
    return bool(S.score(filed["record"], [], None, filed.get("award"))["arithmetic"].get("pass"))


def boundaries(census_path: str = CENSUS) -> dict:
    """Each arithmetic reading at its edge, on every record it passes: the printed total's low end one unit short and
    one past (no pass; a high end moved either way is a reading Sam's rulings already pass once the low end meets);
    the lab with its lecture gone from the alternatives (no pass: nothing to pair it with, so it stands alone). The renumber where the file lists the printed
    code itself, or lists neither (no rename)."""
    out, wrong = collections.Counter(), []

    def tally(name, ok, cn):
        out["%s %s" % (name, "right" if ok else "wrong")] += 1
        if not ok:
            wrong.append([cn, name])

    for cn in hand_read(census_path):
        filed = _load(cn)
        rs = readings_of(cn)
        if filed is None or not rs:
            continue
        if "lab_pairs" in rs or "also_from" in rs:
            st = S._span(filed["record"]["program"].get("total_units"))
            for name, (lo, hi) in (("total low one short", (st[0] - 1, st[1])),
                                   ("total low one past", (st[0] + 1, max(st[1], st[0] + 1)))):
                f = copy.deepcopy(filed)
                f["record"]["program"]["total_units"] = {"min": lo, "max": hi}
                tally(name, not _passes_arith(f), cn)
        if "lab_pairs" in rs:
            # The lab with its lecture gone from the alternatives: nothing to pair it with, so it stands alone.
            f = copy.deepcopy(filed)
            for b in f["record"]["blocks"]:
                for c in b.get("courses") or []:
                    alts = [a for a in c.get("alternatives") or [] if isinstance(a, dict)]
                    keys = {S.norm_code(a.get("code")) for a in alts}
                    labs = {k[:-1] for k in keys if k.endswith("L") and k[:-1] in keys}
                    c["alternatives"] = [a for a in alts if S.norm_code(a.get("code")) not in labs]
            tally("lab without its lecture", not _passes_arith(f), cn)
        if "course_renumbers" in rs:
            sc = copy.deepcopy(filed["score"])
            table = renumbers()
            for r in sc.pop("course_renumbers", None) or []:
                # Planned and written already: the score as the filed run left it, the code as printed again.
                sc["coverage"]["missing"] = sorted(sc["coverage"]["missing"] + [r["listed"]])
                sc["invented"]["codes"] = sorted(sc["invented"]["codes"] + [S.norm_code(r["printed"])])
            pair = next((k, v) for k, v in table.items() if k in sc["invented"]["codes"] and v in sc["coverage"]["missing"])
            listed_too = dict(filed, score=dict(sc, coverage=dict(sc["coverage"], missing=list(
                sc["coverage"]["missing"]) + [pair[0]]), invented=dict(sc["invented"], codes=[
                    k for k in sc["invented"]["codes"] if k != pair[0]])))
            tally("file lists the printed code",
                  not P.rescore_common_numbers(listed_too, name_of=_renamer(table), key="course_renumbers"), cn)
            neither = dict(filed, score=dict(sc, coverage=dict(sc["coverage"], missing=[
                k for k in sc["coverage"]["missing"] if k != pair[1]])))
            tally("file lists neither",
                  not P.rescore_common_numbers(neither, name_of=_renamer(table), key="course_renumbers"), cn)
    return {"counts": dict(out), "wrong": wrong}


# ── the blast radius: every committed record ──
def every_record() -> list[dict]:
    out = []
    for p in sorted(glob.glob(os.path.join(COLLEGE_DIR, "*", "records", "*.json"))):
        with open(p, encoding="utf-8") as fh:
            f = json.load(fh)
        if isinstance(f.get("score"), dict) and isinstance(f.get("record"), dict):
            out.append(f)
    return out


# The records elsewhere the lab pair moves, each read by hand from its notes (S713): every note says the lecture and
# its lab are taken together. They pass on their college's next load; this plan writes none. With the closed lists
# rebuilt from kb/reference, #3708's second reader counts 12 passes outside Clovis (College of the Desert 37288, Long
# Beach City 31223 and MiraCosta 44000 besides these, all "together" in their notes) and Sierra 45624 moving.
ELSEWHERE_HAND = {
    ("Chabot College", "37428"): "passes: 'GEOS 11 AND GEOS 11L (both together)', 'ENSC 15 AND ENSC 15L'",
    ("Cuesta College", "43775"): "passes: 'BIO 201A OR BIO 211 OR (BIO 212 AND BIO 212L)'",
    ("Mendocino College", "03425"): "passes: 'GEL 201 & GEL 201L taken together'",
    ("Mendocino College", "16540"): "passes: 'GEL 201 (3) AND GEL 201L (1) together'",
    ("Mendocino College", "31958"): "passes: 'the pair BIO 202 and BIO 202L together'",
    ("Palomar College", "19779"): "passes: 'the pair BIOL C1001 (3) AND BIOL C1001L (1)'",
    ("Santa Ana College", "31980"): "passes: 'the pair GEOL 101 AND GEOL 101L taken together'",
    ("Santa Ana College", "31887"): "none: BIOL 109 and 109L together, and BIOL 109H at 3 alone keeps the low end at 51",
    ("San Diego City College", "17972"): "not exact: the filed arithmetic is not the scorer's on the record alone; "
                                          "'CHEM 100 AND CHEM 100L together' (the next load reads it)",
    ("San Diego City College", "17976"): "not exact: as 17972",
}


def changes(every: list[dict]) -> dict:
    clovis, elsewhere, not_exact = [], [], []
    for f in every:
        rs = rescore(f)
        if not rs:
            continue
        row = {"college": f["college"], "control_number": str(f["control_number"]), "moves": rs["moves"],
               "passes_before": S.passes_live(f["score"]), "passes_after": S.passes_live(rs["score"])}
        if rs["not_exact"]:
            not_exact.append(dict(row, not_exact=rs["not_exact"]))
        elif f["college"] == COLLEGE:
            clovis.append(row)
        else:
            elsewhere.append(dict(row, hand=ELSEWHERE_HAND.get((f["college"], row["control_number"]),
                                                               "not hand-held")))
    return {"clovis": clovis, "elsewhere": elsewhere, "not_exact": not_exact}


def elsewhere_precision(ch: dict) -> dict:
    """The hand reading of every record elsewhere the readings move, against the readings' outcome."""
    out = {"read": 0, "right": 0, "wrong": 0, "wrong_keys": []}
    for r in ch["elsewhere"] + [x for x in ch["not_exact"] if x["college"] != COLLEGE]:
        hand = ELSEWHERE_HAND.get((r["college"], r["control_number"]), "not hand-held")
        out["read"] += 1
        want = "not exact" if r.get("not_exact") else "passes" if hand.startswith("passes") else "none"
        got = "not exact" if r.get("not_exact") else "passes" if r["passes_after"] else "none"
        if hand != "not hand-held" and want == got and (want != "passes" or not r["passes_before"]):
            out["right"] += 1
        else:
            out["wrong"] += 1
            out["wrong_keys"].append(r)
    return out


def recall_all(every: list[dict]) -> dict:
    moved = []
    for f in every:
        rs = rescore(f)
        moved.append(dict(f, score=rs["score"]) if rs and not rs["not_exact"] else f)
    return NG.recall(moved)


# ── the plan ──
def plan(write: bool, census_path: str = CENSUS) -> dict:
    rows, held, hits = [], [], []
    for cn in hand_read(census_path):
        filed = _load(cn)
        if filed is None:
            held.append({"control_number": cn, "why": "no record file"})
            continue
        if S.passes_live(filed.get("score")):
            continue
        rs = rescore(filed)
        if not rs or not rs["moves"] or rs["not_exact"] or not S.passes_live(rs["score"]):
            held.append({"control_number": cn, "why": HAND_HELD.get(cn, "not hand-held")})
            continue
        hits.append((_path(cn), filed, rs))
    before = NG._load_images({COLLEGE}) if write and hits else {}
    for p, filed, rs in hits:
        key = (COLLEGE, str(filed["control_number"]))
        a = rs["score"]["arithmetic"]
        row = {"college": COLLEGE, "control_number": str(filed["control_number"]), "award": filed.get("award"),
               "extracted_run": filed.get("extracted_run"), "moves_to": "passes",
               "readings": readings_of(str(filed["control_number"])), "also_from": a.get("also_from"),
               "path": os.path.relpath(p, ROOT)}
        if write:
            if key not in before:
                raise SystemExit("the load does not post %s %s" % key)
            img = before[key]
            row["before_image"] = {k: img[k] for k in ("program_title", "award", "catalog_year", "source_url",
                                                       "measure", "total_min", "total_max", "record", "checks",
                                                       "extracted_run")}
            filed["score"] = rs["score"]
            with open(p, "w", encoding="utf-8") as fh:
                json.dump(filed, fh, ensure_ascii=False, indent=1)
                fh.write("\n")
        rows.append(row)
    planned = {r["control_number"] for r in rows}
    rescored = []
    for p in sorted(glob.glob(os.path.join(COLLEGE_DIR, SLUG, "records", "*.json"))):
        with open(p, encoding="utf-8") as fh:
            filed = json.load(fh)
        cn = str(filed.get("control_number"))
        if not isinstance(filed.get("score"), dict) or cn in planned:
            continue
        rs = rescore(filed)
        if not rs or rs["not_exact"] or not rs["moves"]:
            continue
        rescored.append({"control_number": cn, "moves": rs["moves"], "passes_before": S.passes_live(filed["score"]),
                         "passes_after": S.passes_live(rs["score"]), "why": HAND_HELD.get(cn, "outside the lever")})
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
    return {"rows": rows, "held": held, "members": census_members(census_path), "rescored_not_planned": rescored,
            "by": dict(collections.Counter("+".join(r["readings"]) for r in rows))}


CLAIM_CHECK_READS = (
    "The claim checks read the record's notes and its lists' names: the reader's own words from the read behind the "
    "record (extracted_run). The page text of that read stays in its run's artifact, which a session cannot read, "
    "and sources.json describes the latest capture, another read (p-claim-check-reads-current-capture-s713).")


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--tag", default="s713c")
    a = ap.parse_args(argv)
    every = every_record()
    pr, cc, bd, rc, ch = precision(), claim_checks(), boundaries(), recall_all(every), changes(every)
    ep = elsewhere_precision(ch)
    print("precision against the hand reading: read %d, right %d, wrong %d (%s); not hand-held %d" % (
        pr["read"], pr["right"], pr["wrong"], ", ".join("%s %d" % kv for kv in sorted(pr["by_answer"].items())),
        pr["not_hand_held"]))
    for w in pr["wrong_keys"]:
        print("  wrong: %(control_number)s hand %(hand)s, rule %(rule)s" % w)
    print("claim checks: %s" % json.dumps(cc))
    print("boundaries: %s" % json.dumps(bd))
    print("named-gaps recall: held %d, right %d, wrong %d" % (rc["held"], rc["right"], rc["wrong"]))
    print("changes: Clovis %d, elsewhere %d, not exact %d; elsewhere by hand read %d, right %d, wrong %d" % (
        len(ch["clovis"]), len(ch["elsewhere"]), len(ch["not_exact"]), ep["read"], ep["right"], ep["wrong"]))
    for w in ep["wrong_keys"]:
        print("  elsewhere wrong: %s" % json.dumps(w))
    res = plan(write=not a.dry_run)
    print("plan: %d rows (%s); held %d; rescored not planned %d" % (
        len(res["rows"]), ", ".join("%s %d" % kv for kv in sorted(res["by"].items())), len(res["held"]),
        len(res["rescored_not_planned"])))
    if (pr["wrong"] or pr["not_hand_held"] or rc["wrong"] or bd["wrong"] or cc["against_keys"] or ep["wrong"]
            or any(x["college"] == COLLEGE for x in ch["not_exact"])):
        raise SystemExit("the self-recall reads a wrong answer: no plan is written")
    if a.dry_run or not res["rows"]:
        return 0
    day = time.strftime("%Y-%m-%d", time.gmtime())
    path = os.path.join(NG.RECEIPTS, "program_requirement_records_piles_clovis_%s_%s.json" % (day, a.tag))
    rows = res["rows"]
    body = {"rule": NG.RULING + "; S713: a lecture and its lab, an earlier list's unused courses, two courses renumbered",
            "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "college": COLLEGE,
            "census": {"file": os.path.relpath(CENSUS, ROOT), "lever": LEVER, "members": res["members"]},
            "moved": len(rows), "by": res["by"], "precision": pr, "claim_checks": cc, "boundaries": bd,
            "recall": {k: v for k, v in rc.items() if k != "wrong_keys"}, "changes": ch,
            "elsewhere_precision": ep, "held": res["held"], "records": rows,
            "representation": ("checks.arithmetic as the scorer reads a lecture and its lab and an earlier list's "
                               "unused courses; checks.coverage and checks.invented as it reads Clovis's two "
                               "renumbers; the record unchanged"),
            "rescored_not_planned": res["rescored_not_planned"],
            "claim_check_reads": CLAIM_CHECK_READS, "follow_verdict": P.FOLLOW_VERDICT,
            "pre_read": P.confirm_pre_read(rows), "apply": P.confirm_guarded_apply(rows, a.tag + " piles"),
            "rollback": NG.rollback_sql(rows, a.tag + " piles rollback")}
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(body, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    rel = os.path.relpath(path, ROOT)
    hdr = ("-- %s lane 2's cheap piles at Clovis (%s). Each row's checks become the college load's image of its\n"
           "-- committed record (load_rows); the record itself is unchanged.\n"
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
