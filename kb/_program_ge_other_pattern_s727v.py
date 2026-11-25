#!/usr/bin/env python3
"""S727 plan s727v: Antelope Valley 43028, collected with its gap named (ge_figures_other_pattern).

Communication Studies 2.0 A.A.-T (43028) is a Cal-GETC degree whose page prints general education figures only in a
CSU GE and IGETC table ("GE 39 (CSU) / 37 (IGETC)", the reader's note). The reader left ge_units null, so the record
has the shape of ge_units_not_read: the major adds up to its printed 18 and the degree's 60 cannot be added. S713
held it for a person (kb/_program_ge_steps_s713.py HELD_FOR_PERSON; kb/_program_named_gaps.py HELD_GE_FIGURE), because
ge_units_not_read says no figure was printed and this page prints figures for other patterns. Sam's ruling
(sam-collect-with-gaps-2026-11-17): never drop a record for failing; collect it with its gaps noted and confidence
scores. The S727 conductor's brief: collect 43028 with its gap named. The new kind names this gap exactly:
ge_figures_other_pattern, "The degree names one general education pattern, and the page prints general education
figures only for other patterns, so no units for the named pattern were read and the degree's units cannot be
added. Its major adds up to the printed major total." Its unit-arithmetic score is ge_units_not_read's 50.

THE SHAPE (shape()): ge_units_not_read's scorer shape (NG._ge_units_shape: incomplete against the degree, one why
naming the pattern, the major equal), the record held out of that gap by its printed figure (HELD_GE_FIGURE), and a
note of the record's own saying the printed figures are another pattern's rather than the named one (OTHER_NOTE). Over
every committed record statewide it fires on 43028 alone (STATEWIDE, pinned).

THE GUARDS: scorer_passes (today's scorer does not pass it), on_live_run (its committed run is its live row's), the
own-page guard (no other program shares its page, capture.json shared_pages), and the reviewed entry's words found
among its notes. The plan files the gap into the committed record's score; the load's image then carries it, and the
four SQL files apply it to the live row under the confirm guard.

    python3 kb/_program_ge_other_pattern_s727v.py --dry-run
    python3 kb/_program_ge_other_pattern_s727v.py --tag s727v

Guard: tests/program_ge_other_pattern_s727v_test.py.
"""
from __future__ import annotations

import argparse
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
import _program_piles_s721_paloverde as PV  # noqa: E402
import _program_requirements_score as S  # noqa: E402

ROOT = os.path.dirname(HERE)
COLLEGE = "Antelope Valley College"
SLUG = "antelope_valley"
GAP = "ge_figures_other_pattern"
# A note saying the printed figures are another pattern's: CSU GE or IGETC, "rather than" the named Cal-GETC.
OTHER_NOTE = re.compile(r"\b(?:CSU(?:\s*GE)?(?:-Breadth)?|IGETC)\b[^.]{0,200}?\brather than\b[^.]{0,80}?\bCal-?GETC\b",
                        re.I)
REVIEWED = {
    "43028": {"pattern": "Cal-GETC", "major": [18.0, 18.0],
              "words": "Because those figures refer to CSU GE and IGETC rather than the Cal-GETC pattern the page names"},
}
STATEWIDE = frozenset({("Antelope Valley College", "43028")})


def _path(cn: str) -> str:
    return os.path.join(NG.COLLEGE_DIR, SLUG, "records", cn + ".json")


def _load(cn: str) -> dict | None:
    if not os.path.isfile(_path(cn)):
        return None
    with open(_path(cn), encoding="utf-8") as fh:
        return json.load(fh)


def shape(filed: dict) -> bool:
    """ge_units_not_read's scorer shape, held out of it by a printed figure, with a note naming another pattern's."""
    sh = NG._ge_units_shape(filed)
    if not sh or (filed.get("college"), str(filed.get("control_number"))) not in NG.HELD_GE_FIGURE:
        return False
    return any(OTHER_NOTE.search(str(n)) for n in (filed.get("record") or {}).get("notes") or [])


def statewide_fires(base: str = NG.COLLEGE_DIR) -> set:
    out = set()
    for path in glob.glob(os.path.join(base, "*", "records", "*.json")):
        try:
            with open(path, encoding="utf-8") as fh:
                f = json.load(fh)
        except (OSError, ValueError):
            continue
        if shape(f):
            out.add((f.get("college"), str(f.get("control_number"))))
    return out


def shared_with(cn: str) -> list[str]:
    """The other programs capture.json's shared_pages lists on the record's page."""
    with open(os.path.join(NG.COLLEGE_DIR, SLUG, "capture.json"), encoding="utf-8") as fh:
        sp = json.load(fh).get("shared_pages") or {}
    return sorted({str(m) for v in sp.values() if str(cn) in [str(x) for x in v] for m in v if str(m) != str(cn)})


def on_live_run(filed: dict) -> bool:
    """PV.on_live_run at this college: the committed run is the one the latest committed receipt posted."""
    saved = (PV.COLLEGE, PV.SLUG, PV._POSTED)
    PV.COLLEGE, PV.SLUG, PV._POSTED = COLLEGE, SLUG, None
    try:
        return PV.on_live_run(filed)
    finally:
        PV.COLLEGE, PV.SLUG, PV._POSTED = saved


def gap_noted(filed: dict) -> tuple[str, str] | None:
    """(gap, words) where the reviewed entry stands on the record as filed, with no gap yet; else None."""
    cn = str(filed.get("control_number"))
    e = REVIEWED.get(cn)
    if not e or filed.get("college") != COLLEGE:
        return None
    sc = filed.get("score") or {}
    a = sc.get("arithmetic") or {}
    if sc.get("gaps") or not NG.collectable(sc) or a.get("pass") or S.passes_live(sc):
        return None
    sh = NG._ge_units_shape(filed)
    if not sh or sh[0] != e["pattern"] or list(sh[1] or []) != e["major"] or not shape(filed):
        return None
    words = next((str(n) for n in (filed.get("record") or {}).get("notes") or [] if e["words"] in str(n)), None)
    if not words or PV.scorer_passes(filed) or not on_live_run(filed) or shared_with(cn):
        return None
    return GAP, words


def plan(write: bool) -> dict:
    rows, held = [], []
    with open(os.path.join(NG.COLLEGE_DIR, SLUG, "capture.json"), encoding="utf-8") as fh:
        year = json.load(fh).get("catalog_year")
    with open(os.path.join(NG.COLLEGE_DIR, SLUG, "sources.json"), encoding="utf-8") as fh:
        src = {str(x.get("control_number")): x for x in json.load(fh)}
    images = NG._load_images({COLLEGE})
    for cn in sorted(REVIEWED):
        f = _load(cn)
        j = f and gap_noted(f)
        if not j:
            held.append({"control_number": cn, "why": "no record file" if f is None else "the entry does not stand"})
            continue
        img = images.get((COLLEGE, cn))
        if img is None or F.row_passes(img["checks"]):
            held.append({"control_number": cn, "why": "the load leaves it out, or its image passes"})
            continue
        e = src.get(cn) or {}
        score = copy.deepcopy(f["score"])
        score["gaps"] = [{"gap": GAP, "label": NG.GAPS[GAP], "words": j[1]}]   # NG holds the kind (S727)
        score["confidence"] = NG.confidence(dict(f, score=score), GAP, e.get("method"),
                                            (e.get("catalog_year") or year) == year)
        row = {"college": COLLEGE, "control_number": cn, "award": f.get("award"),
               "extracted_run": f.get("extracted_run"), "moves_to": GAP, "words": j[1],
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
            if img["record"] != r["before_image"]["record"] or (img["checks"].get("gaps") or []) != [GAP]:
                raise SystemExit("%s: the record changed, or its image does not carry the gap" % r["control_number"])
            r["after_image"] = {"checks": img["checks"]}
    for i, r in enumerate(rows, 1):
        r["i"] = i
    return {"rows": rows, "held": held}


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--tag", default="s727v")
    a = ap.parse_args(argv)
    fires = statewide_fires()
    print("statewide fires: %s" % sorted(fires))
    if fires - STATEWIDE:
        raise SystemExit("the shape fires beyond the reviewed record: no plan is written")
    res = plan(write=not a.dry_run)
    print("plan: %d rows; held %s" % (len(res["rows"]), res["held"]))
    if a.dry_run or not res["rows"]:
        return 0
    rows = res["rows"]
    stamp = time.gmtime()
    day = time.strftime("%Y-%m-%d", stamp)
    path = os.path.join(NG.RECEIPTS, "program_requirement_records_ge_other_pattern_%s_%s.json" % (day, a.tag))
    body = {"rule": NG.RULING + "; S727: Antelope Valley 43028, held for a person in S713, collected with its gap named",
            "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", stamp), "college": COLLEGE,
            "gaps": {GAP: NG.GAPS[GAP]}, "moved": len(rows), "by": {GAP: len(rows)},
            "statewide_fires": sorted("%s %s" % k for k in fires), "held": res["held"], "records": rows,
            "representation": "checks.gaps and checks.confidence added as the load reads the filed score; "
                              "checks.arithmetic, coverage, invented and the record unchanged",
            "follow_verdict": P.FOLLOW_VERDICT,
            "pre_read": P.confirm_pre_read(rows), "pre_read_md5": PV.md5_pre_read(rows),
            "apply": P.confirm_guarded_apply(rows, a.tag + " ge other pattern"),
            "rollback": NG.rollback_sql(rows, a.tag + " ge other pattern rollback")}
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(body, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    rel = os.path.relpath(path, ROOT)
    hdr = ("-- %s Antelope Valley 43028 collected with its gap named (ge_figures_other_pattern). The row's checks\n"
           "-- become the college load's image of its committed record (load_rows): checks.gaps and checks.confidence\n"
           "-- added; the record unchanged. Receipt: %s (before_image per row).\n" % (a.tag.upper(), rel))
    base = os.path.join(HERE, "migrations", "%s_%s_prreq_ge_other_pattern_" % (day, a.tag))
    parts = {
        "preread_md5.sql": ("-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text\n"
                            "-- (the full before-values are in ..._preread.sql).\n" + body["pre_read_md5"]),
        "preread.sql": "-- Pre-read, read-only: one SELECT, one JSON value.\n" + body["pre_read"],
        "apply.sql": ("-- Guarded UPDATE: only where the row holds the filed run, the before-image's record and checks,\n"
                      "-- and no person's check. It aborts, writing nothing, unless it matches the plan's %d row less\n"
                      "-- one a person checked (listed as skipped_checked), or the row holds a matching confirm.\n"
                      % len(rows) + body["apply"]),
        "rollback.sql": ("-- Rollback, NOT applied: the before-image's checks back where the row still holds the\n"
                         "-- after-image, skipping and listing a row a person checked. A rollback lasts only until the\n"
                         "-- next load of that college: revert the record file too (git revert of this plan's commit).\n"
                         + body["rollback"]),
    }
    for name, text in parts.items():
        with open(base + name, "w", encoding="utf-8") as fh:
            fh.write(hdr + text + "\n")
    print("receipt %s" % rel)
    return 0


if __name__ == "__main__":
    sys.exit(main())
