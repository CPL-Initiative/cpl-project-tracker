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

THE COLLECTION LANE'S COLLEGES are left out tonight: kb/collection_lane.py's COLLECTION_LANE_S680 (twelve colleges), plus
--skip-college NAME.

    python3 kb/_program_requirements_units_rules.py --dry-run     # counts by rule, the self-check; writes nothing
    python3 kb/_program_requirements_units_rules.py --tag s680    # rewrite the records, write the receipt

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

ROOT = os.path.dirname(HERE)
GLOB = os.path.join(HERE, "program_requirements_college", "*", "records", "*.json")
RECEIPTS = os.path.join(HERE, "receipts")
TOL = 1e-6

from collection_lane import COLLECTION_LANE_S680  # noqa: E402  (the one named filter, S680)

ASK = "Commons Clarity's blocker round, Part A (#3480, comments 6967374303 and 6967375123), COBIx's brief on #3358"
RULES = ("A1", "A4", "A5", "A6", "A8")
# A6 is off (S680 conductor's ruling on the second reader's F5): it landed 0 of 4 held answers, and landing is its
# only evidence. Its code stays for the self-check; its records stay as filed, with the note they carry.
A6_ON = False
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
        if rule == "A6" and not A6_ON:
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


def load_files(skip: tuple = ()) -> list[tuple[str, dict]]:
    out = []
    for path in sorted(glob.glob(GLOB)):
        with open(path, encoding="utf-8") as fh:
            d = json.load(fh)
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


def run(write: bool, skip: tuple = ()) -> dict:
    pairs = load_files(skip)
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


def guard(n: int, body: str, tag: str) -> str:
    """The final SELECT of a guarded UPDATE: the returned value when the UPDATE matched exactly the plan's n rows,
    else an error that aborts the statement, so nothing it wrote stands (second reader's F3). Postgres runs the
    data-modifying CTE and this SELECT as one statement: the failed cast rolls back both."""
    return ("select case when count(*) = %d then %s\n"
            "       else (%s || count(*) || ' rows, the plan names %d')::int::text::json end as returned\n"
            "  from u;" % (n, body, _q("%s guard: the UPDATE matched " % tag), n))


RETURNED = ("json_build_object('returned', count(*), 'keys', coalesce(json_agg(u.i order by u.i), '[]'::json), "
            "'checked', coalesce(json_agg(u.i order by u.i) filter (where u.checked), '[]'::json))")


def checks_only_apply(rows: list[dict], tag: str) -> str:
    sql = RS.update_sql(rows, "equal", "unequal")
    head = sql[:sql.index("select json_build_object('returned'")]
    return head + guard(len(rows), RETURNED, tag + " checks-only")


def _full_values(rows: list[dict]) -> str:
    return ",\n  ".join("(%d, %s, %s, %d, %s, %s, %s, %s)" % (
        r["i"], _q(r["college"]), _q(r["control_number"]), int(r["extracted_run"]),
        _jb(r["before_image"]["record"]), _jb(r["before_image"]["checks"]),
        _jb(r["after_image"]["record"]), _jb(r["after_image"]["checks"])) for r in rows)


FULL_V = ("with v(i, college, control_number, extracted_run, before_record, before_checks, after_record, after_checks) "
          "as (values\n  %s)")


def full_row_apply(rows: list[dict], tag: str) -> str:
    """Each corrected row takes the record and checks the college load would post for its committed record, only
    where the live row still holds the filed run and the load's image of main's record and checks (the before-image),
    and no person has checked it."""
    return (FULL_V % _full_values(rows) + ",\n"
            "u as (\n"
            "update public.program_requirement_records r\n"
            "   set record = v.after_record, checks = v.after_checks\n"
            "  from v\n"
            " where r.college = v.college and r.control_number = v.control_number\n"
            "   and r.extracted_run = v.extracted_run and r.record = v.before_record and r.checks = v.before_checks\n"
            "   and r.checked is not true\n"
            "returning v.i, r.checked)\n" + guard(len(rows), RETURNED, tag + " full-row"))


def full_row_rollback(rows: list[dict]) -> str:
    return (FULL_V % _full_values(rows) + ",\n"
            "u as (\n"
            "update public.program_requirement_records r\n"
            "   set record = v.before_record, checks = v.before_checks\n"
            "  from v\n"
            " where r.college = v.college and r.control_number = v.control_number\n"
            "   and r.extracted_run = v.extracted_run and r.record = v.after_record and r.checks = v.after_checks\n"
            "returning v.i, r.checked)\n"
            "select " + RETURNED + " as returned\n  from u;")


def pre_read(checks_rows: list[dict], full_rows: list[dict]) -> str:
    """One SELECT, one JSON value: both parts as they stand live."""
    a = RS.pre_read_sql(checks_rows)
    a_with, a_select = a.split("\nselect json_build_object(", 1)
    full = ("select json_build_object('listed', (select count(*) from v),\n"
            "  'on_run', count(*) filter (where r.extracted_run = v.extracted_run),\n"
            "  'record_is_before', count(*) filter (where r.extracted_run = v.extracted_run and r.record = v.before_record),\n"
            "  'checks_is_before', count(*) filter (where r.extracted_run = v.extracted_run and r.checks = v.before_checks),\n"
            "  'both_before', count(*) filter (where r.extracted_run = v.extracted_run and r.record = v.before_record and r.checks = v.before_checks),\n"
            "  'already_after', count(*) filter (where r.record = v.after_record and r.checks = v.after_checks),\n"
            "  'checked_now', count(*) filter (where r.checked))\n"
            "  from v join public.program_requirement_records r on r.college = v.college and r.control_number = v.control_number")
    return ("select json_build_object(\n'checks_only', (%s\nselect json_build_object(%s),\n'full_row', (%s\n%s));"
            % (a_with, a_select.rstrip().rstrip(";"), FULL_V % _full_values(full_rows), full))


def _parts(moved: list[dict]) -> tuple[list[dict], list[dict]]:
    """(checks-only rows, full-row rows); the rescore's rollback builder reads "records" by place i."""
    return ([m for m in moved if m["rule"] in CHECKS_ONLY], [m for m in moved if m["rule"] not in CHECKS_ONLY])


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--dry-run", action="store_true", help="count and self-check; write nothing")
    ap.add_argument("--tag", default="s680")
    ap.add_argument("--skip-college", action="append", default=[])
    a = ap.parse_args(argv)
    r = run(write=not a.dry_run, skip=tuple(a.skip_college))
    print("moved %d at %d colleges: %s" % (len(r["moved"]), r["colleges"],
                                           ", ".join("%s %d" % kv for kv in sorted(r["by_rule"].items()))))
    for rule, c in r["self_check"].items():
        print("self-check %s on records already equal: applies %d, right %d, wrong %d, not exact %d"
              % (rule, c["applies"], c["right"], c["wrong"], c["not_exact"]))
    if a.dry_run or not r["moved"]:
        return 0
    path = os.path.join(RECEIPTS, "program_requirement_records_units_rules_%s_%s.json"
                        % (time.strftime("%Y-%m-%d", time.gmtime()), a.tag))
    receipt = {"rule": ASK, "words": WORDS, "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
               "held_colleges": list(COLLECTION_LANE_S680) + list(a.skip_college),
               "rescored": len(r["moved"]), "by_rule": r["by_rule"], "self_check": r["self_check"],
               "left_as_filed": r["left"], "ge_totals": r["ge_totals"], "records": r["moved"],
               "plan": {"checks_only": [m["i"] for m in r["moved"] if m["rule"] in CHECKS_ONLY],
                        "full_row": [m["i"] for m in r["moved"] if m["rule"] not in CHECKS_ONLY]},
               "pre_read": pre_read(*_parts(r["moved"])),
               "apply_checks_only": checks_only_apply(_parts(r["moved"])[0], a.tag),
               "apply_full_row": full_row_apply(_parts(r["moved"])[1], a.tag),
               "follow_verdict": RS.FOLLOW_VERDICT, "person_settled": RS.PERSON_SETTLED,
               "rollback_full_row": full_row_rollback(_parts(r["moved"])[1]),
               "rollback": None,
               "rollback_how": ("checks-only: built from its UPDATE's returned value, after it runs: python3 "
                                "kb/_program_requirements_rescore.py --rollback-from <the migrate receipt> --receipt "
                                "<this file>. full-row: rollback_full_row puts the before-image back where the row "
                                "still holds the after-image."),
               "applied": None}
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(receipt, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    print("receipt %s" % os.path.relpath(path, ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
