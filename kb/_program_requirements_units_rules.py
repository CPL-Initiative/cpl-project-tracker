#!/usr/bin/env python3
"""The units rules of the Commons Clarity ask, Part A: free corrections behind a self-check.

COBIx's brief on #3358 (Nov 17, section 2, cheap-piles item 2) carries Commons Clarity's ask (#3480, comment
6967374303; working in 6967375123). A2, A3 and A7 landed in #3478. This module runs the rest on the filed
records (kb/program_requirements_college/<slug>/records/<cn>.json) whose units check reads "unequal":

  A1  rescore only. The current scorer passes the record as filed. Held: a pass that leans on "electives
      fill the total" (the scorer runs with empty page text, so it never grants one here).
  A4  a blank "or" alternative takes its row's units and top-end units; a lab printed with no units right
      after its own lecture (BIOL C1001 then C1001L) counts as 0.
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
    return all(S._num(e.get(k)) is None for k in ("units", "units_max", "units_total"))


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


def a4_blank_alternative(record: dict) -> tuple[dict, list[dict]]:
    out = copy.deepcopy(record)
    notes = []
    for b in out.get("blocks") or []:
        prev = None
        for c in b.get("courses") or []:
            own = S._num(c.get("units"))
            if own is not None:
                alts = []
                for a in c.get("alternatives") or []:
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
def judge(filed: dict, ge_totals: dict) -> dict:
    """{"rule", "why", "record", "notes", "arith"}: the first rule whose self-check lands, or why none moved."""
    a = (filed.get("score") or {}).get("arithmetic") or {}
    rec, award = filed.get("record") or {}, filed.get("award")
    if a.get("status") != "unequal":
        return {"rule": None, "why": "not unequal"}
    now = arith(rec, award)
    if now.get("pass") and now.get("status") == "equal" and exact(filed, rec):
        return {"rule": "A1", "record": rec, "notes": [], "arith": now}
    tried = []
    for rule, fn in (("A4", a4_blank_alternative), ("A5", a5_any_course_from), ("A6", a6_sum_of_options),
                     ("A8", lambda r: a8_college_ge(r, award, ge_totals.get(filed["college"])))):
        if (rule == "A6" and not A6_ON) or (rule == "A5" and not A5_ON):
            continue
        new, notes = fn(rec)
        if not notes:
            continue
        if not exact(filed, new):
            tried.append(rule + " not exact")
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


def self_check(files: list[dict], ge_totals: dict) -> dict:
    """Each correction on the records whose answer is already held (their units check reads "equal" today):
    right = the correction applies and the record still lands exactly; wrong = it applies, the sum is exact,
    and the record stops landing. A correction is applied only behind lands(), so a wrong
    here is a record the rule would break as a bare adding-up rule, never one it writes."""
    out = {r: {"applies": 0, "right": 0, "wrong": 0, "not_exact": 0} for r in RULES if r != "A1"}
    for f in files:
        a = (f.get("score") or {}).get("arithmetic") or {}
        rec, award = f.get("record") or {}, f.get("award")
        if a.get("status") != "equal" or not lands(a) or not (self_contained(rec) or reproduces(f)):
            continue
        for rule, fn in (("A4", a4_blank_alternative), ("A5", a5_any_course_from), ("A6", a6_sum_of_options),
                         ("A8", lambda r: a8_college_ge(r, award, ge_totals.get(f["college"])))):
            new, notes = fn(rec)
            if not notes:
                continue
            out[rule]["applies"] += 1
            if not exact(f, new):
                out[rule]["not_exact"] += 1
                continue
            out[rule]["right" if lands(arith(new, award)) else "wrong"] += 1
    return out


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


def run(write: bool, skip: tuple = (), only: tuple = ()) -> dict:
    bad = [c for c in only if held(c, skip)]
    if bad:
        raise SystemExit("the collection lane holds %s: never in a plan" % ", ".join(bad))
    pairs = load_files(skip, only)
    files = [d for _, d in pairs]
    ge_totals = college_ge_totals(files)
    moved, why = [], collections.Counter()
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
            + ("-- The plan names records at %s alone (--college).\n" % ", ".join(only) if only else ""))


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
            held + "-- Rollback of part 2, NOT applied: the before-image back where the row still "
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
            held + "-- Rollback of part 2, NOT applied: the %d rows the full-row apply returned (%s), the before-image\n"
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
    if not a.dry_run and glob.glob(os.path.join(RECEIPTS, "program_requirement_records_units_rules_*_%s.json" % a.tag)):
        # A second write under one tag would rescore records the first already moved and overwrite its receipt.
        raise SystemExit("a units-rules receipt for %s exists: replan it with --receipt, or take a new --tag" % a.tag)
    r = run(write=not a.dry_run, skip=tuple(a.skip_college), only=only)
    print("moved %d at %d colleges: %s" % (len(r["moved"]), r["colleges"],
                                           ", ".join("%s %d" % kv for kv in sorted(r["by_rule"].items()))))
    for rule, c in r["self_check"].items():
        print("self-check %s on records already equal: applies %d, right %d, wrong %d, not exact %d"
              % (rule, c["applies"], c["right"], c["wrong"], c["not_exact"]))
    if a.dry_run or not r["moved"]:
        return 0
    day = time.strftime("%Y-%m-%d", time.gmtime())
    path = os.path.join(RECEIPTS, "program_requirement_records_units_rules_%s_%s.json" % (day, a.tag))
    receipt = {"rule": ASK, "words": WORDS, "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
               "held_colleges": list(COLLECTION_LANE) + list(a.skip_college),
               "only_colleges": list(only) or None, "a5_on": A5_ON, "a6_on": A6_ON,
               "self_check_scope": ("the held answers at the colleges named in only_colleges" if only
                                    else "the held answers outside the collection lane"),
               "rescored": len(r["moved"]), "by_rule": r["by_rule"], "self_check": r["self_check"],
               "left_as_filed": r["left"], "ge_totals": r["ge_totals"], "records": r["moved"],
               "plan": {"checks_only": [m["i"] for m in r["moved"] if m["rule"] in CHECKS_ONLY],
                        "full_row": [m["i"] for m in r["moved"] if m["rule"] not in CHECKS_ONLY]},
               "pre_read": pre_read(*_parts(r["moved"])),
               "apply_checks_only": checks_only_apply(_parts(r["moved"])[0], a.tag),
               "apply_full_row": full_row_apply(_parts(r["moved"])[1], a.tag),
               "follow_verdict": RS.FOLLOW_VERDICT, "person_settled": RS.PERSON_SETTLED,
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
