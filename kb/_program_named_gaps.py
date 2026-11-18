#!/usr/bin/env python3
"""Named gaps: a record that fails a check is collected with the gap named and confidence scores (Part B).

Sam, 2026-11-17 (relayed by COBIx on #3358, section 2): never drop a record for failing; collect it with gaps
noted and confidence scores (unit arithmetic, course-list match, GE pattern, catalog year, source). Commons
Clarity's ask, Part B (#3480, comment 6967374303), names the gaps. COBIx decided that a degree whose major
total differs from the catalog is still collected, flagged "major total differs from catalog", scored about 30.

THE REPRESENTATION. One new key pair inside existing JSON, no new column:
  * the filed record: score.gaps, a list of {"gap": name, "label": sentence, "words": why}, and score.confidence,
    five scores 0-100 ({"unit_arithmetic", "course_list_match", "ge_pattern", "catalog_year", "source"});
  * the live row (program_requirement_records.checks, jsonb): checks.gaps, the list of names, and
    checks.confidence, the same five scores.
A gap's name is a short stable key of GAPS ("no_units_read"); its sentence is GAPS[name], filed as "label" beside
the record's own "words". The load and the census read only the name, so a reworded sentence moves no row.
checks.arithmetic keeps its status: a named gap says why the units differ and leaves the check honest. The census
(kb/_harvest_gap_census.py) counts a row whose checks.gaps is not empty, with coverage and invented passing, as
collected, and reports it by gap name. The note #3478 wrote (score.arithmetic.note) stays where it is.

RECORD RULES (a filed record exists, so the program is collected with the gap):
  major_total_differs  a local degree the overlap ruling would pass but for a major whose own check fails against
                       the catalog's major total (local_overlap_hold in kb/_program_requirements_reconcile.py, and
                       the major's check not passing). Unit arithmetic scores 30. A major that passes on another
                       reading than plain equality is not this gap: its degree fails for another reason (S680
                       second reader: Alameda 01118 and Glendale 02587, whose general education is what fails).
  no_units_printed     the units cannot be added because a required course has no units, and the record's own
                       notes say the catalog prints it without units. Unit arithmetic scores 40.
  no_units_read        a required course carries no units as read, the only reason the units cannot be added, and
                       the record's notes do not say its requirements list or table is missing or cut off
                       (INCOMPLETE_READ: that record is an incomplete read, not this gap; S680 second reader: Butte
                       14583, West Los Angeles 42627). Unit arithmetic scores 20. (no_units_printed, the same where
                       the notes say the catalog prints none, scored 40, is off: its note matcher fails its
                       self-recall, matcher_recall.)

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
import _guarded_sql as GS  # noqa: E402

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
# A note sentence that says the record's requirements list or table is missing or cut off: the read is incomplete.
# The list or table is the subject and the loss is said of it, in one clause: a cut-off career list or title
# heading does not count, nor a page cut off elsewhere before "a requirements table may follow" (Taft 31290).
INCOMPLETE_READ = re.compile(
    r"\b(?:requirements?|required|course|courses)\b[^.;|]{0,40}\b(?:table|list)\b[^.;|]{0,80}?"
    r"(?:\bcut\s+off\b|\btruncat|\bnot\s+in\s+the\s+(?:provided|extracted|supplied|given)\s+(?:text|excerpt)\b"
    r"|\bmissing\b|\bnot\s+(?:provided|included)\b)", re.I)
# The S680 second reader's held answers: the two no-units records whose notes say the list is incomplete.
HELD_INCOMPLETE = frozenset({("Butte College", "14583"), ("West Los Angeles College", "42627")})
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
    if m.get("pass") is not False:
        # The major passes on another reading than plain equality, so the degree fails for another reason.
        return None
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


def _listed(codes: list[str]) -> str:
    """Up to four codes, and how many more."""
    more = len(codes) - 4
    return ", ".join(codes[:4]) + (" and %d more" % more if more > 0 else "")


def incomplete_read(filed: dict) -> str | None:
    """The note sentence saying the record's requirements list or table is missing or cut off, or None."""
    for n in (filed.get("record") or {}).get("notes") or []:
        for s in re.split(r"(?<=[.!?])\s+", str(n)):
            if INCOMPLETE_READ.search(s):
                return s
    return None


def no_units_read(filed: dict) -> str | None:
    codes = _no_units_codes(filed)
    if not codes or (NO_UNITS_PRINTED_ON and no_units_printed(filed)) or incomplete_read(filed):
        return None
    return "the record carries no units for %s, so the program's units cannot be added" % _listed(codes)


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
    return "the catalog prints %s with no units, so the program's units cannot be added" % _listed(said)


# no_units_printed is off: its note matcher (PRINTED_NO_UNITS) claims "no units" beside 673 of 107,852 required
# courses whose units the record holds (matcher_recall), so it fails its own self-check. Its records take
# no_units_read, the gap that claims only what the record shows.
NO_UNITS_PRINTED_ON = False
RECORD_RULES = (("major_total_differs", major_total_differs),) + (
    (("no_units_printed", no_units_printed),) if NO_UNITS_PRINTED_ON else ()) + (("no_units_read", no_units_read),)


def answer(filed: dict) -> tuple[str, str] | None:
    """The first record rule that names a gap, whether or not the record already files one."""
    for name, fn in RECORD_RULES:
        words = fn(filed)
        if words:
            return name, words
    return None


def judge(filed: dict) -> tuple[str, str] | None:
    if (filed.get("score") or {}).get("gaps"):
        return None
    return answer(filed)


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


def held_answer(filed: dict) -> str | None:
    """The gap a failing, collectable record holds, read from the scorer's own verdict and the second reader's
    held cases, apart from the rules' code paths: major_total_differs where a local degree's major check itself
    fails; no_units_read where the arithmetic is incomplete, every reason it gives is a required course with no
    units, and the record is not one the reader held as an incomplete read (HELD_INCOMPLETE); otherwise none."""
    sc = filed.get("score") or {}
    a = sc.get("arithmetic") or {}
    m = a.get("major")
    if isinstance(m, dict) and m.get("pass") is False and R.awards_match("local", filed.get("award")):
        return "major_total_differs"
    why = [w for w in a.get("why") or [] if w != "the record names no total"]
    if (a.get("status") == "incomplete" and why and all(w.endswith(" has no units") for w in why)
            and (filed.get("college"), str(filed.get("control_number"))) not in HELD_INCOMPLETE):
        return "no_units_read"
    return None


def recall(every: list[dict]) -> dict:
    """The record rules against the held answer on every failing record that coverage and invented pass, at every
    college (the collection lane's and the parked ones too, read here and written nowhere): right when the rule
    names the held gap or, where none is held, names none."""
    out = {"held": 0, "right": 0, "wrong": 0, "by_answer": collections.Counter(), "wrong_keys": []}
    for f in every:
        sc = f.get("score") or {}
        if (sc.get("arithmetic") or {}).get("pass") or not collectable(sc):
            continue
        truth, got = held_answer(f), (answer(f) or (None,))[0]
        out["held"] += 1
        out["by_answer"][truth or "none"] += 1
        if got == truth:
            out["right"] += 1
        else:
            out["wrong"] += 1
            out["wrong_keys"].append({"college": f.get("college"), "control_number": f.get("control_number"),
                                      "held": truth, "rule": got})
    out["by_answer"] = dict(out["by_answer"])
    return out


NONCREDIT_AWARD = re.compile(r"^\s*(?:noncredit\s+program|certificate\s+of\s+(?:competency|completion))", re.I)


def matcher_recall(files: list[dict], base: str = COLLEGE_DIR) -> dict:
    """Each new matcher against answers already held (the second reader's test on #3496):
    NONCREDIT on every committed program's award and title, against the state's own award (a noncredit program,
    a certificate of competency or completion is noncredit); PRINTED_NO_UNITS on every required course that carries
    its units, where a hit would claim the catalog prints none."""
    nc = {"held": 0, "right": 0, "wrong": 0, "missed": 0}
    for sp in sorted(glob.glob(os.path.join(base, "*", "sources.json"))):
        with open(sp, encoding="utf-8") as fh:
            for e in json.load(fh):
                award = e.get("award") or ""
                if not award:
                    continue
                truth = bool(NONCREDIT_AWARD.search(award))
                got = bool(NONCREDIT.search("%s %s" % (award, e.get("title") or "")))
                nc["held"] += 1
                if got == truth:
                    nc["right"] += 1
                elif got:
                    nc["wrong"] += 1
                else:
                    nc["missed"] += 1
    pu = {"held": 0, "right": 0, "wrong": 0}
    for f in files:
        rec = f.get("record") or {}
        notes = " ".join(str(n) for n in (rec.get("notes") or []))
        for b in rec.get("blocks") or []:
            if b.get("rule") != "all":
                continue
            for c in b.get("courses") or []:
                code = c.get("code") or ""
                if not code or S._num(c.get("units")) is None:
                    continue
                pu["held"] += 1
                m = re.search(r"%s[^.]{0,120}" % re.escape(code), notes)
                pu["wrong" if m and PRINTED_NO_UNITS.search(m.group(0)) else "right"] += 1
    return {"noncredit": nc, "printed_no_units": pu}


def _load_images(colleges: set) -> dict:
    """{(college, control_number): the row the college load would post}, built by the load's own code (load_rows in
    kb/_program_requirements_college.py, which carries checks.gaps and checks.confidence from the filed score)."""
    import _program_requirements_college as C
    out = {}
    for college in sorted(colleges):
        for r in C.load_rows(college)[0]:
            out[(college, str(r["control_number"]))] = r
    return out


def run(write: bool, skip: tuple = ()) -> dict:
    moved, files, hits, every = [], [], [], []
    # A college the harvest parks (the census's PARKED) takes no gap from this lane either.
    import _harvest_gap_census as G
    parked = set(G.PARKED)
    for path in sorted(glob.glob(os.path.join(COLLEGE_DIR, "*", "records", "*.json"))):
        with open(path, encoding="utf-8") as fh:
            filed = json.load(fh)
        if not isinstance(filed.get("score"), dict):
            continue
        every.append(filed)
        if CL.held(filed.get("college"), skip) or filed.get("college") in parked:
            continue
        files.append(filed)
        j = judge(filed)
        if j:
            hits.append((path, filed, j))
    # The load's image of each record before any rewrite (the guard), and after it (what the row takes).
    before = _load_images({f["college"] for _, f, _ in hits}) if write else {}
    for path, filed, (name, words) in hits:
        src, year = _sources(path)
        e = src.get(str(filed.get("control_number"))) or {}
        conf = confidence(filed, name, e.get("method"), (e.get("catalog_year") or year) == year)
        key = (filed["college"], str(filed["control_number"]))
        if write and key not in before:
            raise SystemExit("the load does not post %s %s" % key)
        moved.append({"college": filed["college"], "control_number": filed["control_number"],
                      "award": filed.get("award"), "extracted_run": filed.get("extracted_run"),
                      "gap": name, "words": words, "confidence": conf,
                      "path": os.path.relpath(path, ROOT)})
        if write:
            img = before[key]
            moved[-1]["before_image"] = {k: img[k] for k in ("program_title", "award", "catalog_year", "source_url",
                                                             "measure", "total_min", "total_max", "record", "checks",
                                                             "extracted_run")}
            filed["score"]["gaps"] = [{"gap": name, "label": GAPS[name], "words": words}]
            filed["score"]["confidence"] = conf
            with open(path, "w", encoding="utf-8") as fh:
                json.dump(filed, fh, ensure_ascii=False, indent=1)
                fh.write("\n")
    if write:
        after = _load_images({m["college"] for m in moved})
        for m in moved:
            img = after[(m["college"], str(m["control_number"]))]
            if img["record"] != m["before_image"]["record"]:
                raise SystemExit("a named gap changed the record of %s %s" % (m["college"], m["control_number"]))
            m["after_image"] = {"checks": img["checks"]}
    for i, m in enumerate(moved, 1):
        m["i"] = i
    labs = labels(skip=skip)
    return {"moved": moved, "labels": labs, "recall": recall(every), "matcher_recall": matcher_recall(files),
            "by_gap": dict(collections.Counter(m["gap"] for m in moved)),
            "labels_by_gap": dict(collections.Counter(x["gap"] for x in labs))}


def _q(s) -> str:
    return "'%s'" % str(s).replace("'", "''")


def _jb(v) -> str:
    return "%s::jsonb" % _q(json.dumps(v, ensure_ascii=False, sort_keys=True, separators=(",", ":")))


def _values(rows: list[dict]) -> str:
    return ",\n  ".join("(%d, %s, %s, %d, %s, %s, %s)" % (
        r["i"], _q(r["college"]), _q(r["control_number"]), int(r["extracted_run"]),
        _jb(r["before_image"]["record"]), _jb(r["before_image"]["checks"]), _jb(r["after_image"]["checks"]))
        for r in rows)


V = "with v(i, college, control_number, extracted_run, before_record, before_checks, after_checks) as (values\n  %s)"
def pre_read_sql(rows: list[dict]) -> str:
    """One SELECT, one JSON value: the rows as they stand live, before the UPDATE."""
    return (V % _values(rows) + "\n"
            "select json_build_object(\n"
            "  'listed', (select count(*) from v),\n"
            "  'on_run', count(*) filter (where r.extracted_run = v.extracted_run),\n"
            "  'record_is_before', count(*) filter (where r.extracted_run = v.extracted_run and r.record = v.before_record),\n"
            "  'checks_is_before', count(*) filter (where r.extracted_run = v.extracted_run and r.checks = v.before_checks),\n"
            "  'both_before', count(*) filter (where r.extracted_run = v.extracted_run and r.record = v.before_record and r.checks = v.before_checks),\n"
            "  'already_after', count(*) filter (where r.checks = v.after_checks),\n"
            "  'checked_now', count(*) filter (where r.checked))\n"
            "  from v join public.program_requirement_records r\n"
            "    on r.college = v.college and r.control_number = v.control_number;")


def _update(to: str, frm: str) -> str:
    return ("update public.program_requirement_records r\n"
            "   set checks = v.%s_checks\n"
            "  from v\n"
            " where r.college = v.college and r.control_number = v.control_number\n"
            "   and r.extracted_run = v.extracted_run and r.checks = v.%s_checks%s"
            % (to, frm, " and r.record = v.before_record" if frm == "before" else ""))


def update_sql(rows: list[dict], tag: str = "s680 named-gaps") -> str:
    """The guarded UPDATE: each row's checks become the load's image of its committed record (checks.gaps and
    checks.confidence added, checks.arithmetic unchanged), only where the row holds the filed run, the load's image
    of main's record and checks (the before-image), and no person's check; it aborts unless it matches the plan
    less the rows a person checked (kb/_guarded_sql.py)."""
    return GS.guarded(V % _values(rows), _update("after", "before"), len(rows), tag)


def rollback_sql(rows: list[dict], tag: str = "s680 named-gaps rollback") -> str:
    """The before-image's checks back where the row still holds the after-image, skipping and listing a row a
    person checked; it aborts on fewer rows unless a person edits its expect line."""
    return GS.guarded(V % _values(rows), _update("before", "after"), len(rows), tag, rollback=True)


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
    rc = r["recall"]
    print("recall on %d failing records whose answer is held: right %d, wrong %d (%s)" % (
        rc["held"], rc["right"], rc["wrong"], ", ".join("%s %d" % kv for kv in sorted(rc["by_answer"].items()))))
    for w in rc["wrong_keys"][:10]:
        print("  wrong: %(college)s %(control_number)s held %(held)s, rule %(rule)s" % w)
    for n, c in r["matcher_recall"].items():
        print("matcher recall %s: %s" % (n, ", ".join("%s %d" % kv for kv in c.items())))
    if rc["wrong"]:
        raise SystemExit("the recall is wrong on %d records: no plan is written" % rc["wrong"])
    if a.dry_run:
        return 0
    held = list(CL.COLLECTION_LANE_S680) + list(a.skip_college)
    with open(LABELS_OUT, "w", encoding="utf-8") as fh:
        json.dump({"rule": RULING, "gaps": GAPS, "held_colleges": held, "labeled": len(r["labels"]),
                   "by_gap": r["labels_by_gap"], "labels": r["labels"]}, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    if not r["moved"]:
        return 0
    day = time.strftime("%Y-%m-%d", time.gmtime())
    path = os.path.join(RECEIPTS, "program_requirement_records_named_gaps_%s_%s.json" % (day, a.tag))
    n = len(r["moved"])
    body = {"rule": RULING, "gaps": GAPS, "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "held_colleges": held, "collected": n, "by_gap": r["by_gap"],
            "recall": r["recall"], "matcher_recall": r["matcher_recall"], "records": r["moved"],
            "decided": ("The %d records count as collected with the gap named (the S680 conductor, on Sam's rule of "
                        "2026-11-17: never drop a record for failing; collect it with gaps noted and scores)." % n),
            "representation": ("checks.gaps (a list of gap names, keys of gaps) and checks.confidence (five scores "
                               "0-100) added to program_requirement_records.checks; checks.arithmetic unchanged"),
            "pre_read": pre_read_sql(r["moved"]), "apply": update_sql(r["moved"]),
            "rollback": rollback_sql(r["moved"])}
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(body, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    write_migrations(body, os.path.relpath(path, ROOT), day, a.tag)
    print("receipt %s" % os.path.relpath(path, ROOT))
    return 0


def write_migrations(body: dict, receipt: str, day: str, tag: str) -> None:
    """The pre-read, the apply and the rollback as committed files beside the receipt."""
    n = body["collected"]
    hdr = ("-- %s cheap piles, item 4: named gaps (%s). Each row's checks become the college load's image of its\n"
           "-- committed record (load_rows): checks.gaps and checks.confidence added, checks.arithmetic and the record\n"
           "-- unchanged. Receipt: %s (before_image per row).\n"
           "-- The collection lane's twelve colleges (kb/collection_lane.py) and the parked colleges are not in the list.\n"
           % (tag.upper(), ", ".join("%s %d" % kv for kv in sorted(body["by_gap"].items())), receipt))
    base = os.path.join(HERE, "migrations", "%s_%s_prreq_named_gaps_" % (day, tag))
    parts = {
        "preread.sql": "-- Pre-read, read-only: one SELECT, one JSON value.\n" + body["pre_read"],
        "apply.sql": ("-- Guarded UPDATE: only where the row holds the filed run, the before-image's record and checks,\n"
                      "-- and no person's check. It aborts, writing nothing, unless it matches the plan's %d rows less\n"
                      "-- those a person checked (listed as skipped_checked).\n" % n + body["apply"]),
        "rollback.sql": ("-- Rollback, NOT applied: the before-image's checks back where the row still holds the\n"
                         "-- after-image, skipping and listing a row a person checked.\n"
                         "-- A rollback lasts only until the next load of that college: the load posts the committed\n"
                         "-- record files, which still carry score.gaps, so revert those files too (git revert of this\n"
                         "-- plan's commit) or the next load writes the gaps back.\n" + body["rollback"]),
    }
    for name, text in parts.items():
        with open(base + name, "w", encoding="utf-8") as fh:
            fh.write(hdr + text + "\n")


if __name__ == "__main__":
    sys.exit(main())
