#!/usr/bin/env python3
"""S713, lane 2's cheap piles at Glendale: three free readings and their plan, no paid read.

COBIx's brief on #3358 (Nov 22): "the catalog-wording rules at Glendale (28), Clovis (14) ... each with a claim check,
boundary readings and a precision count before its second read." cpl_memory f-glendale-28-left-s697 names the pile:
11 programs with no record file (filed as named gaps by #3675, left alone here) and 17 records, every one read by
hand below (HAND_HELD, with its cause).

READING 1, THE SUBSTITUTE LIST (kb/_program_requirements_score.py, substitute_core). Glendale's language degrees and
certificates print a core of four 5-unit courses, a list headed "If 20 units have not been reached in the required
core, select one course from the following", and a total of 18-20; Spanish A.A-T 32394 heads its list "SELECT ONE OF
THE FOLLOWING IF ANY REQUIRED COURSES WERE SUBSTITUTED". The scorer added the list to the core (23). A student
completes the core as printed (20) or takes one list course in place of a core course (15 + 3 = 18): the list adds
nothing to the core and stands in for one of its courses.

READING 2, THE FIGURE IN A HEADING (heading_figure). 18639 heads its last list "CHOOSE ADDITIONAL UNITS TO COMPLETE A
MINIMUM TOTAL OF EIGHTEEN" and 12503 "CHOOSE THREE COURSES FROM THREE DIFFERENT DISCIPLINES FOR A MINIMUM OF NINE
UNITS"; the reading kept the heading and no figure. A heading figure equal to the program's total fills the program
to it; any other is the list's floor.

READING 3, ONE COURSE RENUMBERED (kb/program_requirements_reconcile.json, Glendale's course_renumbers). The state's
file keeps PSYCH 104 Social Psychology under the old prefix, the 2026-2027 pages print PSYC 104, and the prefix stays
unaliased (three counterexample titles). The course alone is renumbered, with its citation.

Each reading rescores the filed score from the record and the filed lists, with no closed list and no page text: the
arithmetic is re-added by the scorer only where, with the S713 readings off, it reproduces the filed arithmetic
exactly; the renumber renames a code only where the filed score names the file's code missing or placed (the S713
common-number rescore's shape, kb/_program_piles_s713.py rescore_common_numbers). The record itself is never changed.

THE SELF-RECALL (p-self-recall-reads-rule-fields-s703): the held answer is the hand reading, never a rule's own
fields; the claim check reads the record's notes, the reader's own words from the read behind the record
(p-claim-check-reads-current-capture-s713: the page text of that read stays in its run's artifact, which a session
cannot read, and today's capture is another read); boundary readings move one figure across each edge; the precision
count runs over every hand-held record.

    python3 kb/_program_piles_s713_glendale.py --dry-run   # the counts and the self-recall; writes nothing
    python3 kb/_program_piles_s713_glendale.py --tag s713g # rewrite the records, the receipt and the migration files

Guard: tests/program_piles_s713_glendale_test.py.
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
COLLEGE = "Glendale Community College"
SLUG = "glendale_community"
LEVER = "reconcile_steps"

SUB = "passes: the list stands in for one core course (substitute_core)"
FIG = "passes: the list's heading prints its figure (heading_figure)"
REN = "passes: the page's PSYC 104 is the file's PSYCH 104 (course_renumbers)"
# The hand reading of the 17 census records with a record file (S713). The 11 with none are #3675's named gaps.
HAND_HELD = {
    "32394": SUB, "36667": SUB, "36711": SUB, "36712": SUB, "36713": SUB, "36714": SUB, "36720": SUB,
    "36726": SUB, "36727": SUB,
    "18639": FIG, "12503": FIG,
    "18640": REN, "30813": REN,
    "32607": "held: List B prints 'GEOL 101/101H & GEOL 111/111H' as one choice (3 & 1 units), read as two choices, "
             "so its low end takes GEOL 111 alone at 1 (16 against 18); the reader's together field reads the pair "
             "on a reread",
    "36416": "held: BIOL 122 (4) or a lecture and its lab (GEOL 101 and 111, GEOL 102 and 112, OCEAN 115 and 116, "
             "3 and 1 each), read as six single alternatives, so the low end takes one lab at 1 (62 against 65); the "
             "reader's together field reads the pairs on a reread",
    "44488": "held: the page prints 'MATH 102/102+' and the state's file one row, MATH 102, titled 'Trigonometry "
             "with Support' (the record's note); which course the row names is the file's call, for a person",
    "45068": "held: the capture keeps 16,000 characters and the Cal-GETC page runs past them (cut at 'SOC200 "
             "Research Methods for Socio' in Area 4; Areas 5 and 6 unread, 25-27.5 against 34); the renumber clears "
             "its coverage alone; a reread with the page's whole text",
}
FILED_AS_GAPS = ("11155", "21302", "21303", "24327", "24377", "36599", "36601", "37070", "38973", "40846", "40847")


# ── the rescore ───────────────────────────────────────────────────────────
@contextlib.contextmanager
def readings_off():
    """The scorer with readings 1 and 2 off: what the filed run's scorer added."""
    saved = S.substitute_core, S.heading_figure
    S.substitute_core, S.heading_figure = (lambda *a, **k: None), (lambda b: None)
    try:
        yield
    finally:
        S.substitute_core, S.heading_figure = saved


def arithmetic(filed: dict) -> tuple[dict, dict]:
    """(the arithmetic with the S713 readings off, the arithmetic with them on), from the record alone."""
    rec, award = filed.get("record") or {}, filed.get("award")
    with readings_off():
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
    """The filed score under the three readings: {"score", "moves", "not_exact"}, or None where nothing moves."""
    sc = copy.deepcopy(filed.get("score") or {})
    moves, not_exact = [], []
    before, after = arithmetic(filed)
    if after != before and after != sc.get("arithmetic"):   # a filed score the readings already moved stays
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
    sc = rs["score"] if rs else filed.get("score")
    return ("passes" if S.passes_live(sc) else "none"), sc


# ── the census and the hand reading ───────────────────────────────────────
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


def reading_of(cn: str) -> str | None:
    w = HAND_HELD.get(cn, "")
    return "substitute" if w == SUB else "heading_figure" if w == FIG else "course_renumbers" if w == REN else None


def precision(census_path: str = CENSUS) -> dict:
    out = {"read": 0, "right": 0, "wrong": 0, "no_record_file": 0, "not_hand_held": 0,
           "by_answer": collections.Counter(), "wrong_keys": []}
    for cn in census_members(census_path):
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
SUB_NAMED = re.compile(r"\bconditional\b|\bif\s+20\s+units\s+have\s+not\s+been\s+reached\b|\bif\s+any\s+required\s+"
                       r"courses?\s+were\s+substituted\b", re.I)
SUB_STANDS = re.compile(r"\bplace[sd]?\s+(?:out|past|beyond)\b|\bexempt(?:ed|ion)?\b|\bwaived?\b|\bsubstitut\w*\b"
                        r"|\bcredit[\s-]+by[\s-]+exam\b|\bplacement\b", re.I)
SUB_AGAINST = re.compile(r"\bin\s+addition\s+to\s+the\s+(?:required\s+)?core\b|\balways\s+required\b"
                         r"|\badds?\s+to\s+the\s+core\b", re.I)
FIG_STANDS = re.compile(r"\b(?:remainder|minimum)\b[^.;]{0,60}?\b(?:18|nine|9)(?:[\s-]+units?|\b)"
                        r"|\b(?:18|9)[\s-]+units?\b[^.;]{0,40}?\bminimum\b|\b9-unit\s+minimum\b", re.I)
FIG_AGAINST = re.compile(r"\bno\s+minimum\b|\bnot\s+a\s+minimum\b", re.I)
REN_NAMED = re.compile(r"\bPSYC\s*104\b", re.I)
REN_STANDS = re.compile(r"\bPSYC\s*104\b[^.]{0,80}?(?:\bmatched\b|\s=\s|\bsame\s+course\b)[^.]{0,40}?\bPSYCH\s*104\b"
                        r"|\bPSYCH\s*104\b[^.;]{0,40}?\blikely\s+the\s+same\s+course\b", re.I)
REN_AGAINST = re.compile(r"\bPSYC\s*104\b[^.;]{0,80}?\b(?:not\s+the\s+same|another\s+course|different\s+course)\b",
                         re.I)


def claim(filed: dict, reading: str) -> str:
    """'stands', 'against' or 'silent': what the record's notes say of the reading."""
    notes = [str(n) for n in (filed.get("record") or {}).get("notes") or []]
    if reading == "substitute":
        said = [n for n in notes if SUB_NAMED.search(n)]
        if any(SUB_AGAINST.search(n) for n in said):
            return "against"
        return "stands" if any(SUB_STANDS.search(n) for n in said) else "silent"
    if reading == "heading_figure":
        if any(FIG_AGAINST.search(n) for n in notes):
            return "against"
        return "stands" if any(FIG_STANDS.search(n) for n in notes) else "silent"
    said = [n for n in notes if REN_NAMED.search(n)]
    if any(REN_AGAINST.search(n) for n in said):
        return "against"
    return "stands" if any(REN_STANDS.search(n) for n in said) else "silent"


def claim_checks(census_path: str = CENSUS) -> dict:
    out = {"substitute": collections.Counter(), "heading_figure": collections.Counter(),
           "course_renumbers": collections.Counter(), "against_keys": []}
    for cn in census_members(census_path):
        filed = _load(cn)
        if filed is None:
            continue
        rs = rescore(filed)
        arith = (rs or {}).get("score", {}).get("arithmetic") or {}
        used = []
        if "arithmetic" in (rs or {}).get("moves", []):
            used += ["substitute"] if arith.get("substitute_list") else []
            used += ["heading_figure"] if arith.get("heading_figures") else []
        if "course_renumbers" in (rs or {}).get("moves", []):
            used.append("course_renumbers")
        for reading in used:
            c = claim(filed, reading)
            out[reading][c] += 1
            if c == "against":
                out["against_keys"].append([cn, reading])
    return {k: (dict(v) if isinstance(v, collections.Counter) else v) for k, v in out.items()}


# ── the boundary readings ─────────────────────────────────────────────────
def _with_total(filed: dict, lo: float, hi: float) -> dict:
    f = copy.deepcopy(filed)
    f["record"]["program"]["total_units"] = {"min": lo, "max": hi}
    return f


def _passes_arith(filed: dict) -> bool:
    return bool(S.score(filed["record"], [], None, filed.get("award"))["arithmetic"].get("pass"))


def boundaries(census_path: str = CENSUS) -> dict:
    """Each reading at its edges, on every record it passes: the printed total one unit past or short at each end
    (no pass); the substitute list's courses one unit larger (no pass: 20 - 5 + 4 is 19, not the printed 18); the
    heading's figure one more and one less (no pass); the renumber where the file lists the printed code itself or
    lists neither (no rename)."""
    out, wrong = collections.Counter(), []

    def tally(name, ok, cn):
        out["%s %s" % (name, "right" if ok else "wrong")] += 1
        if not ok:
            wrong.append([cn, name])

    for cn in census_members(census_path):
        filed = _load(cn)
        reading = reading_of(cn)
        if filed is None or reading is None:
            continue
        if reading in ("substitute", "heading_figure"):
            # The low end only: a high end moved either way is a reading Sam's rulings already pass (meets, Sheet
            # 120 card 1; short_high, 2026-11-17) once the low end meets, so it is no edge of these readings.
            st = S._span(filed["record"]["program"].get("total_units"))
            for name, (lo, hi) in (("total low one short", (st[0] - 1, st[1])),
                                   ("total low one past", (st[0] + 1, max(st[1], st[0] + 1)))):
                tally(name, not _passes_arith(_with_total(filed, lo, hi)), cn)
        if reading == "substitute":
            f = copy.deepcopy(filed)
            for b in f["record"]["blocks"]:
                if S.SUBSTITUTE_HEADING.search(str(b.get("name") or "")):
                    for c in b["courses"]:
                        c["units"] = (S._num(c.get("units")) or 0) + 1
            tally("list one unit larger", not _passes_arith(f), cn)
        if reading == "heading_figure":
            for name, d in (("figure one more", 1), ("figure one less", -1)):
                f = copy.deepcopy(filed)
                for b in f["record"]["blocks"]:
                    n = S.heading_figure(b)
                    if n is not None:
                        word = {v: k for k, v in S.WORD_NUMBERS.items()}[n + d].upper()
                        b["name"] = S.HEADING_FIGURE.sub(lambda m: m.group(0).replace(m.group("n"), word), b["name"])
                        if S.heading_figure(b) != n + d:
                            raise SystemExit("the boundary reading did not move the heading's figure")
                tally(name, not _passes_arith(f), cn)
        if reading == "course_renumbers":
            sc = filed["score"]
            listed_too = dict(filed, score=dict(sc, coverage=dict(sc["coverage"], missing=list(
                sc["coverage"]["missing"]) + ["PSYC104"]), invented=dict(sc["invented"], codes=[
                    k for k in sc["invented"]["codes"] if k != "PSYC104"])))
            rn = P.rescore_common_numbers(listed_too, name_of=_renamer(renumbers()), key="course_renumbers")
            tally("file lists the printed code", not rn, cn)
            neither = dict(filed, score=dict(sc, coverage=dict(sc["coverage"], missing=[
                k for k in sc["coverage"]["missing"] if k != "PSYCH104"])))
            rn = P.rescore_common_numbers(neither, name_of=_renamer(renumbers()), key="course_renumbers")
            tally("file lists neither", not rn, cn)
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
    """Every committed record whose checks the readings change, at Glendale and elsewhere: the arithmetic with the
    S713 readings off against on, and the renumber (Glendale's alone)."""
    glendale, elsewhere, not_exact = [], [], []
    for f in every:
        if f.get("college") == COLLEGE:
            rs = rescore(f)
            if rs:
                row = {"control_number": str(f["control_number"]), "moves": rs["moves"],
                       "passes_before": S.passes_live(f["score"]), "passes_after": S.passes_live(rs["score"])}
                (not_exact if rs["not_exact"] else glendale).append(dict(row, not_exact=rs["not_exact"]))
            continue
        before, after = arithmetic(f)
        if before != after:
            elsewhere.append({"college": f["college"], "control_number": str(f["control_number"]),
                              "exact": before == f["score"].get("arithmetic")})
    return {"glendale": glendale, "elsewhere": elsewhere, "not_exact": not_exact}


def recall_all(every: list[dict]) -> dict:
    """kb/_program_named_gaps.py's recall over every filed record, Glendale's rescored."""
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
    members = census_members(census_path)
    rows, held, hits = [], [], []
    for cn in members:
        filed = _load(cn)
        if filed is None:
            held.append({"control_number": cn, "why": "no record file: #3675's named gap"})
            continue
        if S.passes_live(filed.get("score")):
            continue   # moved already (this plan's own write, read again)
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
               "extracted_run": filed.get("extracted_run"), "moves_to": "passes", "readings": [
                   r for r, on in (("substitute", a.get("substitute_list")),
                                   ("heading_figure", a.get("heading_figures")),
                                   ("course_renumbers", "course_renumbers" in rs["moves"])) if on],
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
    # Every other Glendale record the readings change is rescored on disk too, so a committed file never disagrees
    # with the scorer; it takes no plan row, and the receipt lists it.
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
    return {"rows": rows, "held": held, "members": members, "rescored_not_planned": rescored,
            "by": dict(collections.Counter("+".join(r["readings"]) for r in rows))}


CLAIM_CHECK_READS = (
    "The claim checks read the record's notes: the reader's own words from the read behind the record "
    "(read_run, else extracted_run). The page text of that read stays in its run's artifact, which a session cannot "
    "read, and sources.json describes the latest capture (run 44915445658), another read "
    "(p-claim-check-reads-current-capture-s713); no claim check here reads it.")


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--tag", default="s713g")
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
    print("changes: Glendale %d (%s), elsewhere %d, not exact %d" % (
        len(ch["glendale"]), ", ".join("%s %s" % (r["control_number"], "+".join(r["moves"])) for r in ch["glendale"]),
        len(ch["elsewhere"]), len(ch["not_exact"])))
    res = plan(write=not a.dry_run)
    print("plan: %d rows (%s); held %d; rescored not planned %d" % (
        len(res["rows"]), ", ".join("%s %d" % kv for kv in sorted(res["by"].items())), len(res["held"]),
        len(res["rescored_not_planned"])))
    if (pr["wrong"] or pr["not_hand_held"] or rc["wrong"] or bd["wrong"] or cc["against_keys"] or ch["elsewhere"]
            or ch["not_exact"]):
        raise SystemExit("the self-recall reads a wrong answer: no plan is written")
    if a.dry_run or not res["rows"]:
        return 0
    day = time.strftime("%Y-%m-%d", time.gmtime())
    path = os.path.join(NG.RECEIPTS, "program_requirement_records_piles_glendale_%s_%s.json" % (day, a.tag))
    rows = res["rows"]
    body = {"rule": NG.RULING + "; S713: the substitute list, the figure in a heading and one course renumbered",
            "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "college": COLLEGE,
            "census": {"file": os.path.relpath(CENSUS, ROOT), "lever": LEVER, "members": res["members"]},
            "moved": len(rows), "by": res["by"], "precision": pr, "claim_checks": cc, "boundaries": bd,
            "recall": {k: v for k, v in rc.items() if k != "wrong_keys"}, "changes": ch,
            "held": res["held"], "records": rows,
            "representation": ("checks.arithmetic as the scorer reads the substitute list and the heading's figure; "
                               "checks.coverage and checks.invented as it reads Glendale's PSYC 104 renumber; the "
                               "record unchanged"),
            "rescored_not_planned": res["rescored_not_planned"],
            "claim_check_reads": CLAIM_CHECK_READS, "follow_verdict": P.FOLLOW_VERDICT,
            "pre_read": P.confirm_pre_read(rows), "apply": P.confirm_guarded_apply(rows, a.tag + " piles"),
            "rollback": NG.rollback_sql(rows, a.tag + " piles rollback")}
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(body, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    rel = os.path.relpath(path, ROOT)
    hdr = ("-- %s lane 2's cheap piles at Glendale (%s). Each row's checks become the college load's image of its\n"
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
