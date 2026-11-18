#!/usr/bin/env python3
"""Named gaps: a record that fails a check is collected with the gap named and confidence scores (Part B).

Sam, 2026-11-17 (relayed by COBIx on #3358, section 2): never drop a record for failing; collect it with gaps
noted and confidence scores (unit arithmetic, course-list match, GE pattern, catalog year, source). Commons
Clarity's ask, Part B (#3480, comment 6967374303), names the gaps. COBIx decided that a degree whose major
total differs from the catalog is still collected, flagged "major total differs from catalog", scored about 30.

THE REPRESENTATION. One new key pair inside existing JSON, no new column:
  * the filed record: score.gaps, a list of {"gap": name, "words": why}, and score.confidence, five scores
    0-100 ({"unit_arithmetic", "course_list_match", "ge_pattern", "catalog_year", "source"});
  * the live row (program_requirement_records.checks, jsonb): checks.gaps, the list of names, and
    checks.confidence, the same five scores.
checks.arithmetic keeps its status: a named gap says why the units differ and leaves the check honest. The census
(kb/_harvest_gap_census.py) counts a row whose checks.gaps is not empty, with coverage and invented passing, as
collected, and reports it by gap name. The note #3478 wrote (score.arithmetic.note) stays where it is.

RECORD RULES (a filed record exists, so the program is collected with the gap):
  major_total_differs  a local degree the overlap ruling would pass but for a major that does not match the
                       catalog's major total exactly (local_overlap_hold in kb/_program_requirements_reconcile.py).
                       Unit arithmetic scores 30.
  no_units_printed     the units cannot be added because a required course has no units, and the record's own
                       notes say the catalog prints it without units. Unit arithmetic scores 40.
  no_units_read        the same, where the notes do not say so (the reader may have dropped the figure).
                       Unit arithmetic scores 20.

LABELS (no record exists, so the program stays in its pile with a plain reason; kb/status/program_named_gaps.json):
  noncredit_names_only a noncredit program whose catalog page names it (the capture's near miss: the title
                       matches exactly) and prints none of its courses (coverage 0).

The labels that need a title lookup across a college's whole current catalog (D1's "the state still lists this
program as active, but the college's current catalog doesn't print it", D3's "Not in the college's current
catalog", "Not printed in this year's catalog") need page reads the committed files do not hold: a runner task.

THE COLLECTION LANE'S COLLEGES are left out: COLLECTION_LANE_S680 in kb/collection_lane.py.

    python3 kb/_program_named_gaps.py --dry-run     # counts and the self-check; writes nothing
    python3 kb/_program_named_gaps.py --tag s680    # rewrite the records, the label file and the receipt

Guard: tests/program_named_gaps_test.py.
"""
from __future__ import annotations

import argparse
import collections
import glob
import json
import os
import re
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_requirements_reconcile as R  # noqa: E402
import _program_requirements_score as S  # noqa: E402
import collection_lane as CL  # noqa: E402

ROOT = os.path.dirname(HERE)
COLLEGE_DIR = os.path.join(HERE, "program_requirements_college")
RECEIPTS = os.path.join(HERE, "receipts")
LABELS_OUT = os.path.join(HERE, "status", "program_named_gaps.json")
RULING = ("Sam, 2026-11-17, relayed by COBIx on #3358 section 2: collect with gaps noted and confidence scores; "
          "Commons Clarity's Part B (#3480, comment 6967374303); COBIx's D2 decision (major total differs, about 30)")

GAPS = {
    "major_total_differs": "major total differs from catalog",
    "no_units_printed": "The catalog prints no units for at least one required course.",
    "no_units_read": "A required course carries no units as read, so the program's units cannot be added.",
    "noncredit_names_only": "Noncredit certificate: the catalog names it but prints no course list.",
}
ARITH_SCORE = {"major_total_differs": 30, "no_units_printed": 40, "no_units_read": 20}
MAJOR_NOT_EXACT = "the major does not match the catalog's major total exactly"
NO_UNITS_WHY = re.compile(r"^a required course in '.*' has no units$")
PRINTED_NO_UNITS = re.compile(r"\b(?:no|without)\s+units\b|\bunits?\s+(?:are\s+|is\s+)?not\s+(?:printed|listed|given)\b"
                              r"|\bprints?\s+no\s+units?\b", re.I)
NONCREDIT = re.compile(r"\bnon-?credit\b|\bcertificate\s+of\s+(?:competency|completion)\b", re.I)
FOUND_SOURCE = {"sitemap_page": 100, "link_search": 100, "pdf_pages": 80}


# ── confidence ─────────────────────────────────────────────────────────────
def confidence(filed: dict, gap: str | None, method: str | None = None, year_ok: bool | None = True) -> dict:
    """The five scores, 0-100. Unit arithmetic: 100 when the check passes, else the gap's score. Course-list
    match: the share of the closed list placed. GE pattern: 100 unless a degree names a pattern with no units
    (50). Catalog year: 100 for the registry's current year, 60 for a prior year. Source: by how the page was
    found (a sitemap or link page 100, a PDF slice 80)."""
    sc = filed.get("score") or {}
    a = sc.get("arithmetic") or {}
    prog = (filed.get("record") or {}).get("program") or {}
    share = (sc.get("coverage") or {}).get("share")
    ge = 50 if (prog.get("ge_pattern") and S._span(prog.get("ge_units")) is None
                and S._span(prog.get("degree_total")) is not None) else 100
    return {"unit_arithmetic": 100 if a.get("pass") else ARITH_SCORE.get(gap, 0),
            "course_list_match": None if share is None else int(round(float(share) * 100)),
            "ge_pattern": ge, "catalog_year": 100 if year_ok in (True, None) else 60,
            "source": FOUND_SOURCE.get(method or "", 60)}


# ── the record rules ───────────────────────────────────────────────────────
def collectable(sc: dict) -> bool:
    """Coverage and invented pass: the record read the program's own page and its courses."""
    return bool((sc.get("coverage") or {}).get("pass") and (sc.get("invented") or {}).get("pass"))


def major_total_differs(filed: dict) -> str | None:
    sc = filed.get("score") or {}
    a = sc.get("arithmetic") or {}
    if a.get("pass") or not collectable(sc):
        return None
    prog = (filed.get("record") or {}).get("program") or {}
    if R.local_overlap_hold(prog, filed.get("award"), a) != MAJOR_NOT_EXACT:
        return None
    m = a["major"]
    return ("the major sums to %s against the catalog's major total %s; the overlap ruling would pass the degree "
            "if the major matched" % (R._fig(m.get("computed")), R._fig(m.get("stated"))))


def _no_units_codes(filed: dict) -> list[str] | None:
    """The required courses with no units, when they are the only reason the units cannot be added."""
    sc = filed.get("score") or {}
    a = sc.get("arithmetic") or {}
    if a.get("pass") or a.get("status") != "incomplete" or not collectable(sc):
        return None
    why = [w for w in a.get("why") or [] if w != "the record names no total"]
    if not why or not all(NO_UNITS_WHY.match(w) for w in why):
        return None
    codes = [c.get("code") or "" for b in (filed.get("record") or {}).get("blocks") or [] if b.get("rule") == "all"
             for c in b.get("courses") or []
             if all(S._num(c.get(k)) is None for k in ("units", "units_max", "units_total"))]
    return codes or None


def no_units_read(filed: dict) -> str | None:
    codes = _no_units_codes(filed)
    if not codes or no_units_printed(filed):
        return None
    return "the record carries no units for %s and its notes do not say the catalog prints none" % ", ".join(codes[:4])


def no_units_printed(filed: dict) -> str | None:
    sc = filed.get("score") or {}
    a = sc.get("arithmetic") or {}
    if a.get("pass") or a.get("status") != "incomplete" or not collectable(sc):
        return None
    why = a.get("why") or []
    if not why or not all(NO_UNITS_WHY.match(w) for w in why if w != "the record names no total"):
        return None
    rec = filed.get("record") or {}
    notes = " ".join(str(n) for n in (rec.get("notes") or []))
    codes = []
    for b in rec.get("blocks") or []:
        if b.get("rule") != "all":
            continue
        for c in b.get("courses") or []:
            if all(S._num(c.get(k)) is None for k in ("units", "units_max", "units_total")):
                codes.append(c.get("code") or "")
    said = [c for c in codes if c and re.search(r"%s[^.]{0,120}" % re.escape(c), notes)
            and PRINTED_NO_UNITS.search(re.search(r"%s[^.]{0,120}" % re.escape(c), notes).group(0))]
    if not codes or len(said) != len(codes):
        return None
    return "the catalog prints %s with no units, so the program's units cannot be added" % ", ".join(said[:4])


RECORD_RULES = (("major_total_differs", major_total_differs), ("no_units_printed", no_units_printed),
                ("no_units_read", no_units_read))


def judge(filed: dict) -> tuple[str, str] | None:
    if (filed.get("score") or {}).get("gaps"):
        return None
    for name, fn in RECORD_RULES:
        words = fn(filed)
        if words:
            return name, words
    return None


# ── the labels ─────────────────────────────────────────────────────────────
def labels(base: str = COLLEGE_DIR, skip: tuple = ()) -> list[dict]:
    out = []
    for sp in sorted(glob.glob(os.path.join(base, "*", "sources.json"))):
        d = os.path.dirname(sp)
        summ_p = os.path.join(d, "summary.json")
        if not os.path.isfile(summ_p):
            continue
        with open(summ_p, encoding="utf-8") as fh:
            summ = json.load(fh)
        college = summ.get("college")
        if CL.held(college, skip):
            continue
        with open(sp, encoding="utf-8") as fh:
            src = {str(e.get("control_number")): e for e in json.load(fh)}
        for nf in summ.get("not_found") or []:
            cn = str(nf.get("control_number"))
            e = src.get(cn) or {}
            nm = nf.get("near_miss") or {}
            lab = nm.get("label") or {}
            text = "%s %s" % (e.get("award") or nf.get("award") or "", e.get("title") or nf.get("title") or "")
            if (NONCREDIT.search(text) and (lab.get("title") or 0) >= 0.99 and nm.get("coverage") is not None
                    and float(nm["coverage"]) == 0.0 and not os.path.isfile(os.path.join(d, "records", cn + ".json"))):
                out.append({"college": college, "control_number": cn, "title": e.get("title") or nf.get("title"),
                            "gap": "noncredit_names_only", "words": GAPS["noncredit_names_only"],
                            "source_line": "the catalog page %s names the program and prints none of its courses"
                                           % nm.get("url")})
    return out


# ── the run ────────────────────────────────────────────────────────────────
def _sources(path: str) -> tuple[dict, str | None]:
    d = os.path.dirname(os.path.dirname(path))
    src, year = {}, None
    if os.path.isfile(os.path.join(d, "sources.json")):
        with open(os.path.join(d, "sources.json"), encoding="utf-8") as fh:
            src = {str(e.get("control_number")): e for e in json.load(fh)}
    if os.path.isfile(os.path.join(d, "capture.json")):
        with open(os.path.join(d, "capture.json"), encoding="utf-8") as fh:
            year = json.load(fh).get("catalog_year")
    return src, year


def self_check(files: list[dict]) -> dict:
    """Each record rule on the records whose answer is held: a record whose units check passes is collected with
    no gap, so a rule that names one is wrong. A local degree #3478 passed under the overlap ruling (its major
    matched exactly) is the case major_total_differs must refuse."""
    out = {n: {"held_records": 0, "right": 0, "wrong": 0} for n, _ in RECORD_RULES}
    for f in files:
        a = (f.get("score") or {}).get("arithmetic") or {}
        if not a.get("pass"):
            continue
        for name, fn in RECORD_RULES:
            out[name]["held_records"] += 1
            out[name]["wrong" if fn(f) else "right"] += 1
    return out


def run(write: bool, skip: tuple = ()) -> dict:
    moved, files = [], []
    # A college the harvest parks (the census's PARKED) takes no gap from this lane either.
    import _harvest_gap_census as G
    parked = set(G.PARKED)
    for path in sorted(glob.glob(os.path.join(COLLEGE_DIR, "*", "records", "*.json"))):
        with open(path, encoding="utf-8") as fh:
            filed = json.load(fh)
        if (CL.held(filed.get("college"), skip) or filed.get("college") in parked
                or not isinstance(filed.get("score"), dict)):
            continue
        files.append(filed)
        j = judge(filed)
        if not j:
            continue
        name, words = j
        src, year = _sources(path)
        e = src.get(str(filed.get("control_number"))) or {}
        conf = confidence(filed, name, e.get("method"), (e.get("catalog_year") or year) == year)
        a = filed["score"]["arithmetic"]
        moved.append({"college": filed["college"], "control_number": filed["control_number"],
                      "award": filed.get("award"), "extracted_run": filed.get("extracted_run"),
                      "gap": name, "words": words, "confidence": conf,
                      "before": {"arithmetic": a.get("status"), "gaps": None},
                      "after": {"arithmetic": a.get("status"), "gaps": [GAPS[name]]},
                      "path": os.path.relpath(path, ROOT)})
        if write:
            filed["score"]["gaps"] = [{"gap": GAPS[name], "words": words}]
            filed["score"]["confidence"] = conf
            with open(path, "w", encoding="utf-8") as fh:
                json.dump(filed, fh, ensure_ascii=False, indent=1)
                fh.write("\n")
    for i, m in enumerate(moved, 1):
        m["i"] = i
    labs = labels(skip=skip)
    return {"moved": moved, "labels": labs, "self_check": self_check(files),
            "by_gap": dict(collections.Counter(m["gap"] for m in moved)),
            "labels_by_gap": dict(collections.Counter(x["gap"] for x in labs))}


def _q(s) -> str:
    return "'%s'" % str(s).replace("'", "''")


def _values(rows: list[dict]) -> str:
    return ",\n  ".join("(%d, %s, %s, %d, %s, %s::jsonb, %s::jsonb)" % (
        r["i"], _q(r["college"]), _q(r["control_number"]), int(r["extracted_run"]), _q(r["before"]["arithmetic"]),
        _q(json.dumps(r["after"]["gaps"], ensure_ascii=False)), _q(json.dumps(r["confidence"], sort_keys=True)))
        for r in rows)


V = "with v(i, college, control_number, extracted_run, arith_before, gaps, confidence) as (values\n  %s)"


def pre_read_sql(rows: list[dict]) -> str:
    """One SELECT, one JSON value: the rows as they stand live, before the UPDATE."""
    return (V % _values(rows) + "\n"
            "select json_build_object(\n"
            "  'listed', (select count(*) from v),\n"
            "  'on_run_before', count(*) filter (where r.extracted_run = v.extracted_run and r.checks->>'arithmetic' = v.arith_before and not (r.checks ? 'gaps')),\n"
            "  'on_run_has_gaps', count(*) filter (where r.extracted_run = v.extracted_run and r.checks ? 'gaps'),\n"
            "  'on_run_arith_moved', count(*) filter (where r.extracted_run = v.extracted_run and r.checks->>'arithmetic' is distinct from v.arith_before),\n"
            "  'off_run', count(*) filter (where r.extracted_run is distinct from v.extracted_run),\n"
            "  'checked_now', count(*) filter (where r.checked))\n"
            "  from v join public.program_requirement_records r\n"
            "    on r.college = v.college and r.control_number = v.control_number;")


def update_sql(rows: list[dict]) -> str:
    """The guarded UPDATE: adds checks.gaps and checks.confidence, only where the row holds the filed run, its
    arithmetic still reads the before-value and it carries no gaps yet. It writes nothing else."""
    return (V % _values(rows) + ",\n"
            "u as (\n"
            "update public.program_requirement_records r\n"
            "   set checks = r.checks || jsonb_build_object('gaps', v.gaps, 'confidence', v.confidence)\n"
            "  from v\n"
            " where r.college = v.college and r.control_number = v.control_number\n"
            "   and r.extracted_run = v.extracted_run and r.checks->>'arithmetic' = v.arith_before\n"
            "   and not (r.checks ? 'gaps')\n"
            "returning v.i, r.checked)\n"
            "select json_build_object('returned', count(*), 'keys', coalesce(json_agg(u.i order by u.i), '[]'::json),\n"
            "       'checked', coalesce(json_agg(u.i order by u.i) filter (where u.checked), '[]'::json)) as returned\n"
            "  from u;")


def rollback_sql(rows: list[dict]) -> str:
    """Takes back exactly what the UPDATE added: where the row still holds the run and the gaps written."""
    return (V % _values(rows) + ",\n"
            "u as (\n"
            "update public.program_requirement_records r\n"
            "   set checks = (r.checks - 'gaps') - 'confidence'\n"
            "  from v\n"
            " where r.college = v.college and r.control_number = v.control_number\n"
            "   and r.extracted_run = v.extracted_run and r.checks->'gaps' = v.gaps\n"
            "returning v.i)\n"
            "select json_build_object('returned', count(*), 'keys', coalesce(json_agg(u.i order by u.i), '[]'::json)) as returned\n"
            "  from u;")


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--tag", default="s680")
    ap.add_argument("--skip-college", action="append", default=[])
    a = ap.parse_args(argv)
    r = run(write=not a.dry_run, skip=tuple(a.skip_college))
    print("records collected with a named gap: %d (%s)" % (len(r["moved"]), ", ".join(
        "%s %d" % kv for kv in sorted(r["by_gap"].items())) or "none"))
    print("labels on programs with no record: %d (%s)" % (len(r["labels"]), ", ".join(
        "%s %d" % kv for kv in sorted(r["labels_by_gap"].items())) or "none"))
    for n, c in r["self_check"].items():
        print("self-check %s on %d records that pass: right %d, wrong %d" % (n, c["held_records"], c["right"], c["wrong"]))
    if a.dry_run:
        return 0
    held = list(CL.COLLECTION_LANE_S680) + list(a.skip_college)
    with open(LABELS_OUT, "w", encoding="utf-8") as fh:
        json.dump({"rule": RULING, "gaps": GAPS, "held_colleges": held, "labeled": len(r["labels"]),
                   "by_gap": r["labels_by_gap"], "labels": r["labels"]}, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    if not r["moved"]:
        return 0
    path = os.path.join(RECEIPTS, "program_requirement_records_named_gaps_%s_%s.json"
                        % (time.strftime("%Y-%m-%d", time.gmtime()), a.tag))
    with open(path, "w", encoding="utf-8") as fh:
        json.dump({"rule": RULING, "gaps": GAPS, "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                   "held_colleges": held, "collected": len(r["moved"]), "by_gap": r["by_gap"],
                   "self_check": r["self_check"], "records": r["moved"],
                   "representation": ("checks.gaps (a list of gap names) and checks.confidence (five scores 0-100) "
                                      "added to program_requirement_records.checks; checks.arithmetic unchanged"),
                   "pre_read": pre_read_sql(r["moved"]), "apply": update_sql(r["moved"]),
                   "rollback": rollback_sql(r["moved"])}, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    print("receipt %s" % os.path.relpath(path, ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
