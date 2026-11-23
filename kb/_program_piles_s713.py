#!/usr/bin/env python3
"""S713, lane 2's cheap piles at Santa Rosa Junior and Santa Monica: two free rules and their plan, no paid read.

COBIx's brief on #3358 (Nov 22): "then Santa Monica 30 and Santa Rosa 27 ... Collect every record with its gaps named
and confidence scores, and report records collected." Sam's cost rules (2026-11-17) give this lane units rules and
gaps noted instead of rereads. The committed census (kb/status/harvest_gap_census.json, 2026-11-22 22:50Z) lists 27
records at Santa Rosa Junior and 26 at Santa Monica under the catalog-wording lever (reconcile_steps). Every one was
read by hand (HAND_HELD below, with the cause of each).

RULE 1, THE COMMON NUMBER IN PARENTHESES (kb/_program_requirements_score.py, common_number_in_parens). Santa Rosa
Junior's 2026-2027 PDF prints "PSYC 1000 (PSYC C1000)"; the reader kept the code as printed, and the scorer read it as
one course missing (PSYCC1000) and another invented. The scorer now keys such a code by the common number where the
state's file lists it. A filed score is rescored here from its own lists, with no closed list: the common number is
listed exactly when the filed score names it missing or placed it under its own code, so coverage and invented move
as the scorer would move them. The arithmetic stays the filed one only where every renamed course carries its own
units or sits in a choose-units list (whose figure stands in for its courses); any other record is left as filed and
listed (not_exact) for the runner's rescore.

RULE 2, THE NAMED GAP section_cut_off (kb/_program_named_gaps.py). The reader's note says the program's
requirements continue on a page the read did not hold, the units fall short of the printed total or cannot be added,
and coverage and invented pass. Unit arithmetic scores 20; course-list match is capped at 50. The rule names the gap
only at CUT_OFF_COLLEGES, where every failing record is hand-held.

THE SELF-RECALL (p-self-recall-reads-rule-fields-s703): each rule's held answer is the hand reading, never the rule's
own fields; a claim check reads a second source (the record's notes for rule 1; the pages the read held, in
sources.json, for rule 2); boundary readings move one figure across each edge; the precision count runs over every
hand-held record.

    python3 kb/_program_piles_s713.py --dry-run     # the counts and the self-recall; writes nothing
    python3 kb/_program_piles_s713.py --tag s713    # rewrite the records, the receipt and the migration files

Guard: tests/program_piles_s713_test.py.
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
import _program_requirements_score as S  # noqa: E402

ROOT = os.path.dirname(HERE)
COLLEGE_DIR = NG.COLLEGE_DIR
CENSUS = NG.CENSUS
COLLEGES = {"Santa Rosa Junior College": "santa_rosa_junior", "Santa Monica College": "santa_monica"}
LEVER = "reconcile_steps"

# The hand reading of every record the census lists under the lever at the two colleges (S713). Each cause is the
# one the record's own blocks and notes show; "passes" and "section_cut_off" are what the two rules should do.
PASSES = "passes once its common numbers are read"
CUT = "section_cut_off: the section runs onto a page the read did not hold"
HAND_HELD = {
    "Santa Rosa Junior College": {
        "15243": PASSES, "16965": PASSES, "21729": PASSES, "30840": PASSES, "40890": PASSES,
        "06602": CUT, "15461": CUT, "15463": CUT, "30750": CUT, "32300": CUT,
        "32330": CUT, "32357": CUT, "33166": CUT, "45477": CUT, "45558": CUT,
        "06566": "held: sibling 21718 reads the same page and 20-course table in the same run, records 'Total "
                 "Hours/Units 20' and passes; the reader left total_units unset, and nothing countable is cut off",
        "32298": "held: sibling 46305 holds p. 145 and fails the same way (33.5-34 against 33.5; List C names no "
                 "minimum); the sum already reaches the total",
        "19599": "held: the concentration lists print no units beside courses the state's file does not list",
        "19600": "held: the concentration lists print no units beside courses the state's file does not list",
        "35738": "held: the concentration lists print no units beside courses the state's file does not list",
        "30569": "held: the catalog's own figures differ (courses to 22.25 against 'Complete 22.50'); a page read "
                 "would list it for total_differs",
        "32758": "held: cut off, and SOC 1 reads as no listed course (SOCI C1000); a renumber pair needs the state "
                 "file's title",
        "35400": "held: List B prints 'Select one of the following: 0'; a person reads the page",
        "35401": "held: List B prints 'Select one of the following: 0'; a person reads the page",
        "35429": "held: List B prints no rule and no units, and the core adds to the total without it; a person "
                 "reads the page",
        "45486": "held: CHEM 3A & 3AL print one figure for the pair; a units rule for a pair's one figure",
        "46305": "held: List C prints no rule and no total, and the rest adds to the printed total",
    },
    "Santa Monica College": {
        "43655": "held: a course taken four times (the reconcile repeat step reads the page; free on the runner)",
        "43743": "held: a course taken twice (the reconcile repeat step reads the page; free on the runner)",
        "44720": "held: a course taken twice (the reconcile repeat step reads the page; free on the runner)",
        "33270": "held: 'If completed entirely at SMC ... requires 19 units', the total its courses meet (a wording "
                 "step on the page text)",
        "33271": "held: 'If completed entirely at SMC ... requires 21 units', the total its courses meet (a wording "
                 "step on the page text)",
        "35284": "held: 'If completed entirely at SMC ... requires 27 units', the total its courses meet (a wording "
                 "step on the page text)",
        "08970": "held: two of five concentration groups, read as one option (a reread)",
        "21007": "held: two of five concentration groups, read as one option (a reread)",
        "39680": "held: each language track read as two option blocks with no figure (a reread)",
        "41797": "held: one option's figure taken from its courses (a reread)",
        "44004": "held: an elective path of one course from each of two groups (a reread)",
        "46189": "held: an elective path of one course from each of two groups (a reread)",
        "03272": "held: Option 2's electives fill to 39 with no printed figure (a reread)",
        "03256": "held: List B is 'a maximum of 7 units' toward 12 (a reread)",
        "33339": "held: a substitution list read as a list to choose from (a reread)",
        "43765": "held: 'any combination of Salon classes' with no figure, and COSM 11C printed for COSM 64",
        "43767": "held: 'any combination of Salon classes' with no figure, and COSM 11C printed for COSM 64",
        "03263": "held: an 8-unit minimum across two groups (a reread)",
        "32792": "held: 'the remaining 3 units from either list' (a reread)",
        "39671": "held: an alternative that is a pair of courses (a reread)",
        "37452": "held: a core printing 9 units over two 3-unit courses; the catalog's figures differ",
        "03282": "held: RC 11L printed at 2 in a semester printed at 14.5; the catalog's figures differ",
        "03302": "held: the courses add to 27.5 against a printed 26.5; the catalog's figures differ",
        "21026": "held: the courses add to 27.5 against a printed 26.5; the catalog's figures differ",
        "03281": "held: cut off, and NURSING 6, 6L, 7 and 7L read as no listed course",
        "10345": "held: the reader says no total is printed; a page read would list it for total_not_printed",
    },
}


# ── rule 1: the common number in parentheses, rescored from the filed score ──
def rescore_common_numbers(filed: dict) -> dict | None:
    """The filed score with every code that prints its common number in parentheses keyed by that number where the
    state's file lists it, read from the filed score's own lists. Returns {"score", "renamed", "exact"}, or None when
    no code changes key."""
    sc = filed.get("score") or {}
    cov, inv = sc.get("coverage") or {}, sc.get("invented") or {}
    missing, invented = list(cov.get("missing") or []), list(inv.get("codes") or [])
    flagged = list(inv.get("flagged") or [])
    placed_listed = set()
    entries = []
    for b in (filed.get("record") or {}).get("blocks") or []:
        for c in b.get("courses") or []:
            for e in [c] + [a for a in c.get("alternatives") or [] if isinstance(a, dict)]:
                k = S.norm_code(e.get("code"))
                if k and k not in invented:
                    placed_listed.add(k)
                entries.append((e, b, k))
    renamed, exact = [], True
    for e, b, k in entries:
        cn = S.common_number_in_parens(e.get("code"))
        if not cn or k not in invented:
            continue
        if cn not in missing and cn not in placed_listed:
            continue   # the state's file does not list the common number: the code stays as written
        renamed.append({"printed": e.get("code"), "listed": cn, "block": b.get("name")})
        if S._num(e.get("units")) is None and b.get("rule") != "choose_units":
            exact = False
    if not renamed:
        return None
    out = copy.deepcopy(sc)
    new_keys = {r["listed"] for r in renamed}
    gone = {S.norm_code(r["printed"]) for r in renamed}
    # A code as written leaves invented only when no entry keeps it unrenamed.
    still = {k for e, b, k in entries if k in gone and not (S.common_number_in_parens(e.get("code")) in new_keys)}
    miss = [k for k in missing if k not in new_keys]
    unexpl = [k for k in cov.get("unexplained") or [] if k not in new_keys]
    n = cov.get("listed") or 0
    inv_codes = sorted(k for k in invented if k not in gone or k in still)
    unflagged = [k for k in inv_codes if k not in flagged]
    none_placed = bool(n) and len(miss) == n
    out["coverage"] = dict(cov, placed=n - len(miss), share=round((n - len(miss)) / n, 3) if n else None,
                           missing=miss, unexplained=unexpl, none_placed=none_placed,
                           **{"pass": not unexpl and not none_placed})
    out["invented"] = dict(inv, count=len(inv_codes), codes=inv_codes, flagged=[k for k in flagged if k in inv_codes],
                           **{"pass": not unflagged})
    out["common_numbers"] = renamed
    a = out.get("arithmetic") or {}
    out["pass"] = bool(out["coverage"]["pass"] and out["invented"]["pass"] and a.get("pass")
                       and (out.get("repeated") or {}).get("pass", True) and (out.get("outcomes") or {}).get("pass", True))
    return {"score": out, "renamed": renamed, "exact": exact}


NOTE_MATCH = re.compile(r"\b(?:match|matches|matched|matching|recorded|treated|corresponds?|correspond)\b", re.I)
NOTE_AGAINST = re.compile(r"\b(?:not\s+the\s+same|differs?\s+from|another\s+course|different\s+course)\b", re.I)


def common_number_claim(filed: dict, cn: str) -> str:
    """The claim check: what the record's notes say of a renamed course, apart from the scorer's lists. 'stands'
    where a note names the common number and says the course was matched or recorded by it, 'against' where a note
    names it and says it is another course, 'silent' where no note names it."""
    num = re.sub(r"^([A-Z&/]+?)(C\d)", r"\1 \2", cn)
    pat = re.compile(re.escape(num).replace(r"\ ", r"\s*"), re.I)
    said = [n for n in (filed.get("record") or {}).get("notes") or [] if pat.search(str(n))]
    if any(NOTE_AGAINST.search(str(n)) for n in said):
        return "against"
    if any(NOTE_MATCH.search(str(n)) for n in said):
        return "stands"
    return "silent"


# ── the census's records and the plan ─────────────────────────────────────
def census_members(path: str = CENSUS) -> dict:
    """{college: [control numbers]} the committed census lists under the lever at the two colleges."""
    with open(path, encoding="utf-8") as fh:
        d = json.load(fh)
    out = {}
    for lv in d.get("levers") or []:
        if lv.get("lever") == LEVER and lv.get("scope") in COLLEGES:
            out[lv["scope"]] = list(lv.get("members") or [])
    return out


def _path(college: str, cn: str) -> str:
    return os.path.join(COLLEGE_DIR, COLLEGES[college], "records", cn + ".json")


def _sources(college: str) -> dict:
    p = os.path.join(COLLEGE_DIR, COLLEGES[college], "sources.json")
    with open(p, encoding="utf-8") as fh:
        return {str(e.get("control_number")): e for e in json.load(fh)}


def outcome(filed: dict) -> tuple[str, dict, str | None]:
    """What the two rules do to one record: ('passes' | 'section_cut_off' | 'none', the score after rule 1,
    the gap's words). The record itself is never changed."""
    work = copy.deepcopy(filed)
    rs = rescore_common_numbers(work)
    if rs and rs["exact"]:
        work["score"] = rs["score"]
    if S.passes_live(work["score"]):
        return "passes", work["score"], None
    j = NG.answer(work)
    if j and j[0] == "section_cut_off":
        return "section_cut_off", work["score"], j[1]
    return "none", work["score"], None


def plan(write: bool, census_path: str = CENSUS) -> dict:
    members = census_members(census_path)
    rows, held, not_exact, by = [], [], [], collections.Counter()
    hits = []
    for college in COLLEGES:
        src = _sources(college)
        year = None
        cap = os.path.join(COLLEGE_DIR, COLLEGES[college], "capture.json")
        if os.path.isfile(cap):
            with open(cap, encoding="utf-8") as fh:
                year = json.load(fh).get("catalog_year")
        for cn in members.get(college, []):
            p = _path(college, cn)
            if not os.path.isfile(p):
                held.append({"college": college, "control_number": cn, "why": "no record file"})
                continue
            with open(p, encoding="utf-8") as fh:
                filed = json.load(fh)
            rs = rescore_common_numbers(filed)
            if rs and not rs["exact"]:
                not_exact.append({"college": college, "control_number": cn, "renamed": rs["renamed"]})
            if S.passes_live(filed.get("score")) or (filed.get("score") or {}).get("gaps"):
                # Moved already (this plan's own write, read again): nothing left to plan.
                continue
            what, score, words = outcome(filed)
            if what == "none":
                held.append({"college": college, "control_number": cn,
                             "why": HAND_HELD.get(college, {}).get(cn, "not hand-held")})
                continue
            e = src.get(cn) or {}
            if what == "section_cut_off":
                score = dict(score)
                f2 = dict(filed, score=score)
                score["gaps"] = [{"gap": "section_cut_off", "label": NG.GAPS["section_cut_off"], "words": words}]
                score["confidence"] = NG.confidence(f2, "section_cut_off", e.get("method"),
                                                    (e.get("catalog_year") or year) == year)
            by[what] += 1
            hits.append((p, filed, score, what, words))
    before = NG._load_images({f["college"] for _, f, _, _, _ in hits}) if write else {}
    for p, filed, score, what, words in hits:
        key = (filed["college"], str(filed["control_number"]))
        row = {"college": filed["college"], "control_number": str(filed["control_number"]),
               "award": filed.get("award"), "extracted_run": filed.get("extracted_run"), "moves_to": what,
               "words": words, "common_numbers": score.get("common_numbers") or [],
               "confidence": score.get("confidence"), "path": os.path.relpath(p, ROOT)}
        if write:
            if key not in before:
                raise SystemExit("the load does not post %s %s" % key)
            img = before[key]
            row["before_image"] = {k: img[k] for k in ("program_title", "award", "catalog_year", "source_url",
                                                       "measure", "total_min", "total_max", "record", "checks",
                                                       "extracted_run")}
            filed["score"] = score
            with open(p, "w", encoding="utf-8") as fh:
                json.dump(filed, fh, ensure_ascii=False, indent=1)
                fh.write("\n")
        rows.append(row)
    # Every other record at the two colleges whose filed score rule 1 changes is rescored on disk too, so a committed
    # file never disagrees with the scorer (#3705's second reader: 35429 and 32301). The hand reading keeps them
    # failing, so they take no plan row; the receipt lists them.
    planned = {(f["college"], str(f["control_number"])) for _, f, _, _, _ in hits}
    rescored = []
    for college, slug in COLLEGES.items():
        for p in sorted(glob.glob(os.path.join(COLLEGE_DIR, slug, "records", "*.json"))):
            with open(p, encoding="utf-8") as fh:
                filed = json.load(fh)
            if not isinstance(filed.get("score"), dict) or (college, str(filed.get("control_number"))) in planned:
                continue
            rs = rescore_common_numbers(filed)
            if not rs or not rs["exact"]:
                continue
            rescored.append({"college": college, "control_number": str(filed["control_number"]),
                             "passes_after": S.passes_live(rs["score"]), "renamed": rs["renamed"],
                             "why": HAND_HELD.get(college, {}).get(str(filed["control_number"]),
                                                                  "outside the census lever; still failing")})
            if write:
                filed["score"] = rs["score"]
                with open(p, "w", encoding="utf-8") as fh:
                    json.dump(filed, fh, ensure_ascii=False, indent=1)
                    fh.write("\n")
    if write:
        after = NG._load_images({r["college"] for r in rows})
        for r in rows:
            img = after[(r["college"], r["control_number"])]
            if img["record"] != r["before_image"]["record"]:
                raise SystemExit("a rule changed the record of %s %s" % (r["college"], r["control_number"]))
            r["after_image"] = {"checks": img["checks"]}
    for i, r in enumerate(rows, 1):
        r["i"] = i
    return {"rows": rows, "held": held, "not_exact": not_exact, "by": dict(by), "members": members,
            "rescored_not_planned": rescored}


# ── the follow_verdict guard (#3705's second reader, finding 2) ──────────
# The trigger program_requirement_records_follow_verdict (chatbox/supabase_program_record_verdicts.sql) marks a row
# checked when its latest verdict is a confirm whose fingerprint matches the record and the machine checks pass. A
# checks-only UPDATE keeps the record, so a confirm given earlier on a failing row would check it at the apply, and
# the rollback (which never writes a checked row) would then skip it. The pre-read counts those rows, and the apply
# aborts, writing nothing, unless the count is 0.
CONFIRM_CTE = (
    "f as (select count(*) as n, coalesce(json_agg(v.i order by v.i), '[]'::json) as keys\n"
    "        from v join public.program_requirement_records r\n"
    "          on r.college = v.college and r.control_number = v.control_number\n"
    "        join lateral (select pv.verdict, pv.requirements_fp from public.program_record_verdicts pv\n"
    "                       where pv.college = v.college and pv.control_number = v.control_number\n"
    "                       order by pv.id desc limit 1) lv on true\n"
    "       where lv.verdict = 'confirm' and lv.requirements_fp = public.program_record_fp(r.record))")


def confirm_guarded_apply(rows: list[dict], tag: str) -> str:
    sql = NG.update_sql(rows, tag)
    head = "e(expect) as (values (%d)),\n" % len(rows)
    tail = "select case when s.n = e.expect - c.n\n"
    if sql.count(head) != 1 or sql.count(tail) != 1 or sql.count("  from s, c, e;") != 1:
        raise SystemExit("the guarded UPDATE's shape moved: the confirm guard cannot be placed")
    sql = sql.replace(head, CONFIRM_CTE + ",\n" + head)
    sql = sql.replace(tail, "select case when f.n > 0\n"
                            "            then ('%s confirm guard: ' || f.n || ' rows hold a matching confirm verdict "
                            "' || f.keys::text)::int::text::json\n"
                            "            when s.n = e.expect - c.n\n" % tag)
    return sql.replace("  from s, c, e;", "  from s, c, e, f;")


def confirm_pre_read(rows: list[dict]) -> str:
    sql = NG.pre_read_sql(rows)
    key = "  'checked_now', count(*) filter (where r.checked))\n"
    if sql.count(key) != 1:
        raise SystemExit("the pre-read's shape moved: the confirm count cannot be placed")
    return sql.replace(key, "  'checked_now', count(*) filter (where r.checked),\n"
                            "  'confirm_matches', count(*) filter (where lv.verdict = 'confirm'\n"
                            "                                       and lv.requirements_fp = public.program_record_fp(r.record)))\n"
                       ).replace("    on r.college = v.college and r.control_number = v.control_number;",
                                 "    on r.college = v.college and r.control_number = v.control_number\n"
                                 "  left join lateral (select pv.verdict, pv.requirements_fp from public.program_record_verdicts pv\n"
                                 "                      where pv.college = v.college and pv.control_number = v.control_number\n"
                                 "                      order by pv.id desc limit 1) lv on true;")


CLAIM_CHECK_READS = (
    "Rule 2's claim check reads the pages kb/program_requirements_college/<slug>/sources.json lists, which is the "
    "college's latest capture, not the read behind the record (32357's record names #page=169; its sources entry holds "
    "164 to 167). It can contradict a sentence that names a page the capture held in its middle; it cannot fail a "
    "one- or two-page read, a sentence that names no page, or a record whose read used other pages than today's "
    "capture. It is a check against the capture, never against the text the reader saw.")
FOLLOW_VERDICT = (
    "The follow_verdict trigger marks a row checked when its latest verdict is a confirm whose fingerprint matches "
    "the record and the machine checks pass. The record is unchanged here, so such a confirm on a row this plan moves "
    "to passing would check it at the apply, and the rollback would skip it. The pre-read counts those rows "
    "(confirm_matches); the apply aborts, writing nothing, unless the count is 0.")


# ── the self-recall ───────────────────────────────────────────────────────
def hand_answer(college: str, cn: str) -> str:
    w = HAND_HELD.get(college, {}).get(cn, "")
    return "passes" if w == PASSES else "section_cut_off" if w == CUT else "none"


def precision(census_path: str = CENSUS) -> dict:
    """Both rules against the hand reading of every census record at the two colleges: right where the outcome is
    the hand's answer. A record the hand did not read counts apart."""
    out = {"read": 0, "right": 0, "wrong": 0, "not_hand_held": 0, "by_answer": collections.Counter(),
           "wrong_keys": []}
    for college, cns in census_members(census_path).items():
        for cn in cns:
            p = _path(college, cn)
            if not os.path.isfile(p):
                continue
            if cn not in HAND_HELD.get(college, {}):
                out["not_hand_held"] += 1
                continue
            with open(p, encoding="utf-8") as fh:
                filed = json.load(fh)
            got, truth = outcome(filed)[0], hand_answer(college, cn)
            out["read"] += 1
            out["by_answer"][truth] += 1
            if got == truth:
                out["right"] += 1
            else:
                out["wrong"] += 1
                out["wrong_keys"].append({"college": college, "control_number": cn, "hand": truth, "rule": got})
    out["by_answer"] = dict(out["by_answer"])
    return out


def claim_checks(census_path: str = CENSUS) -> dict:
    """Rule 1: what the notes say of each renamed course. Rule 2: whether the cut-off sentence stands against the
    pages the read held (sources.json)."""
    r1, r2, r2_keys = collections.Counter(), collections.Counter(), []
    for college, cns in census_members(census_path).items():
        src = _sources(college)
        for cn in cns:
            p = _path(college, cn)
            if not os.path.isfile(p):
                continue
            with open(p, encoding="utf-8") as fh:
                filed = json.load(fh)
            rs = rescore_common_numbers(filed)
            for r in (rs or {}).get("renamed") or []:
                r1[common_number_claim(filed, r["listed"])] += 1
            what = outcome(filed)[0]
            if what == "section_cut_off":
                st = NG.cut_off_claim_stands(filed, src)
                r2[{True: "stands", False: "falls", None: "names no page"}[st]] += 1
                if st is False:
                    r2_keys.append([college, cn])
    return {"common_numbers": dict(r1), "section_cut_off": dict(r2), "section_cut_off_falls": r2_keys}


def _moved(filed: dict, comp, st, status: str) -> dict:
    f = copy.deepcopy(filed)
    a = f["score"]["arithmetic"]
    a.update(computed=list(comp), stated=list(st), status=status, against="program",
             why=["the blocks sum to %s-%s; the catalog states %s-%s" % (comp[0], comp[1], st[0], st[1])])
    a["pass"] = status == "equal"
    return f


def boundaries(census_path: str = CENSUS) -> dict:
    """Rule 2 read at each edge on every record it names: the sum at the printed total (the arithmetic passes: no
    gap), one unit past it (a cut-off read loses courses, never adds them: no gap), one unit short (the gap). Rule 1
    read at its edge: a common number the state's file does not list leaves the code as written."""
    out = collections.Counter()
    wrong = []
    for college, cns in census_members(census_path).items():
        for cn in cns:
            p = _path(college, cn)
            if not os.path.isfile(p):
                continue
            with open(p, encoding="utf-8") as fh:
                filed = json.load(fh)
            what, score, _ = outcome(filed)
            if what == "section_cut_off":
                f = dict(filed, score=score)
                st = NG._pair((score.get("arithmetic") or {}).get("stated"))
                if not st:
                    out["no printed total"] += 1
                    continue
                for name, comp, status, want in (("at total", st, "equal", None),
                                                 ("one past", (st[0] + 1, st[1] + 1), "unequal", None),
                                                 ("one short", (st[0] - 1, st[1] - 1), "unequal", "section_cut_off")):
                    g = NG.answer(_moved(f, comp, st, status))
                    got = g[0] if g else None
                    out["%s %s" % (name, "right" if got == want else "wrong")] += 1
                    if got != want:
                        wrong.append([college, cn, name, got])
            rs = rescore_common_numbers(filed)
            if rs:
                f = copy.deepcopy(filed)
                drop = {r["listed"] for r in rs["renamed"]}
                f["score"]["coverage"]["missing"] = [k for k in f["score"]["coverage"]["missing"] if k not in drop]
                again = rescore_common_numbers(f)
                left = {r["listed"] for r in (again or {}).get("renamed") or []} & drop
                out["unlisted number %s" % ("right" if not left else "wrong")] += 1
    return {"counts": dict(out), "wrong": wrong}


def statewide_counts() -> dict:
    """What the two rules would do at every other college, unwritten: rule 1's renamed codes, rule 2's ungated
    calls (no hand reading there, so no precision is claimed)."""
    r1, r1_pass, r2 = collections.Counter(), collections.Counter(), collections.Counter()
    for path in sorted(glob.glob(os.path.join(COLLEGE_DIR, "*", "records", "*.json"))):
        with open(path, encoding="utf-8") as fh:
            filed = json.load(fh)
        if not isinstance(filed.get("score"), dict) or filed.get("college") in COLLEGES:
            continue
        rs = rescore_common_numbers(filed)
        if rs:
            r1[filed["college"]] += 1
            if rs["exact"] and S.passes_live(rs["score"]) and not S.passes_live(filed["score"]):
                r1_pass[filed["college"]] += 1
        if not (filed["score"].get("arithmetic") or {}).get("pass") and NG.section_cut_off_ungated(filed):
            r2[filed["college"]] += 1
    return {"common_numbers_records": sum(r1.values()), "common_numbers_would_pass": sum(r1_pass.values()),
            "common_numbers_by_college": dict(r1.most_common()),
            "section_cut_off_ungated": sum(r2.values()), "section_cut_off_by_college": dict(r2.most_common())}


def recall_all() -> dict:
    """kb/_program_named_gaps.py's own recall, with section_cut_off among the rules, over every filed record."""
    every = []
    for path in sorted(glob.glob(os.path.join(COLLEGE_DIR, "*", "records", "*.json"))):
        with open(path, encoding="utf-8") as fh:
            f = json.load(fh)
        if isinstance(f.get("score"), dict):
            rs = rescore_common_numbers(f) if f.get("college") in COLLEGES else None
            if rs and rs["exact"]:
                f["score"] = rs["score"]
            every.append(f)
    r = NG.recall(every)
    return {k: v for k, v in r.items()}


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--tag", default="s713")
    a = ap.parse_args(argv)
    pr, cc, bd, rc = precision(), claim_checks(), boundaries(), recall_all()
    print("precision against the hand reading: read %d, right %d, wrong %d (%s); not hand-held %d" % (
        pr["read"], pr["right"], pr["wrong"], ", ".join("%s %d" % kv for kv in sorted(pr["by_answer"].items())),
        pr["not_hand_held"]))
    for w in pr["wrong_keys"]:
        print("  wrong: %(college)s %(control_number)s hand %(hand)s, rule %(rule)s" % w)
    print("claim checks: %s" % json.dumps({k: v for k, v in cc.items()}))
    print("boundaries: %s" % json.dumps(bd))
    print("named-gaps recall with section_cut_off: held %d, right %d, wrong %d" % (rc["held"], rc["right"], rc["wrong"]))
    for w in rc["wrong_keys"][:10]:
        print("  wrong: %(college)s %(control_number)s held %(held)s, rule %(rule)s" % w)
    sw = statewide_counts()
    print("elsewhere, unwritten: %s" % json.dumps(sw))
    res = plan(write=not a.dry_run)
    print("plan: %d rows (%s); held %d; rule 1 not exact %d" % (
        len(res["rows"]), ", ".join("%s %d" % kv for kv in sorted(res["by"].items())), len(res["held"]),
        len(res["not_exact"])))
    if pr["wrong"] or rc["wrong"] or bd["wrong"] or cc["section_cut_off_falls"] or cc["common_numbers"].get("against"):
        raise SystemExit("the self-recall reads a wrong answer: no plan is written")
    if a.dry_run or not res["rows"]:
        return 0
    day = time.strftime("%Y-%m-%d", time.gmtime())
    path = os.path.join(NG.RECEIPTS, "program_requirement_records_piles_%s_%s.json" % (day, a.tag))
    rows = res["rows"]
    body = {"rule": NG.RULING + "; S713: the common number in parentheses, and section_cut_off",
            "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "colleges": list(COLLEGES),
            "census": {"file": os.path.relpath(CENSUS, ROOT), "lever": LEVER, "members": res["members"]},
            "gaps": {"section_cut_off": NG.GAPS["section_cut_off"]}, "moved": len(rows), "by": res["by"],
            "precision": pr, "claim_checks": cc, "boundaries": bd,
            "recall": {k: v for k, v in rc.items() if k != "wrong_keys"}, "elsewhere_unwritten": sw,
            "held": res["held"], "not_exact": res["not_exact"], "records": rows,
            "representation": ("checks.coverage and checks.invented as the scorer reads the common numbers (rule 1); "
                               "checks.gaps and checks.confidence for section_cut_off (rule 2); checks.arithmetic "
                               "and the record unchanged"),
            "rescored_not_planned": res["rescored_not_planned"],
            "claim_check_reads": CLAIM_CHECK_READS, "follow_verdict": FOLLOW_VERDICT,
            "pre_read": confirm_pre_read(rows), "apply": confirm_guarded_apply(rows, a.tag + " piles"),
            "rollback": NG.rollback_sql(rows, a.tag + " piles rollback")}
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(body, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    rel = os.path.relpath(path, ROOT)
    hdr = ("-- %s lane 2's cheap piles at Santa Rosa Junior and Santa Monica (%s). Each row's checks become the\n"
           "-- college load's image of its committed record (load_rows); the record itself is unchanged.\n"
           "-- Receipt: %s (before_image per row).\n"
           % (a.tag.upper(), ", ".join("%s %d" % kv for kv in sorted(res["by"].items())), rel))
    base = os.path.join(HERE, "migrations", "%s_%s_prreq_piles_" % (day, a.tag))
    parts = {
        "preread.sql": "-- Pre-read, read-only: one SELECT, one JSON value.\n" + body["pre_read"],
        "apply.sql": ("-- Guarded UPDATE: only where the row holds the filed run, the before-image's record and checks,\n"
                      "-- and no person's check. It aborts, writing nothing, unless it matches the plan's %d rows less\n"
                      "-- those a person checked (listed as skipped_checked).\n" % len(rows) + body["apply"]),
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
