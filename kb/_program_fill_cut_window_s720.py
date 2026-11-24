#!/usr/bin/env python3
"""The electives fill over a cut-off window, statewide (S720, f-elective-fill-passes-cut-off-windows-s714).

The scorer now refuses either electives fill (the program total's, the degree total's) where the record's own words
say its requirements run outside the text it was read from (kb/_program_requirements_score.py, window_cut). This
script measures what that changes over every committed record and writes the guarded plan for the filed records that
pass through a fill today, which the change turns failing with the gap named (section_cut_off, Sam's collect-with-gaps
ruling of 2026-11-17).

  * the dry run: each committed record's arithmetic rescored from the filed record alone (no closed list, no page
    text: the parts a reconcile reads again), with the guard off (main's scorer) and on; every verdict change, by
    college. The guard only takes passes away.
  * the filed false passes: a record whose filed arithmetic passes through a fill that adds units, under no major
    that adds up to its own printed total, while window_cut names a cut. Each one is planned only where the guard-off
    rescore reproduces its filed arithmetic exactly, so the after-arithmetic is the scorer's own.
  * the plan (Rule 10, docs/reference/data_write_rollback.md): the live row's checks move from the before-image to
    the after-image (arithmetic "unequal", gaps ["section_cut_off"], the confidence); the record does not change. The
    UPDATE runs only where the row still holds the before-image whole (record, checks and run), never on a checked
    row, aborts unless it matches the plan's count less the rows a person checked, and aborts if a confirm verdict
    would carry onto the row (kb/_program_ge_plan_s713.py). The rollback puts the before-image back where the row
    holds the after-image.

    python3 kb/_program_fill_cut_window_s720.py --dry-run        # the measure; writes nothing
    python3 kb/_program_fill_cut_window_s720.py                  # also the receipt and the four SQL files
    python3 kb/_program_fill_cut_window_s720.py --write-records  # after the apply: the record files take the after
                                                                 # score, so the next load and display carry it

Guard: tests/reconcile_window_fill_test.py.
"""
from __future__ import annotations

import argparse
import collections
import glob
import json
import os
import shutil
import sys
import tempfile
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_requirements_college as C  # noqa: E402
import _program_requirements_score as S  # noqa: E402
import _program_named_gaps as NG  # noqa: E402
import _program_ge_plan_s713 as GP  # noqa: E402

ROOT = os.path.dirname(HERE)
COLLEGE_DIR = os.path.join(HERE, "program_requirements_college")
TAG = "s720"
RECEIPT = os.path.join(HERE, "receipts", "program_requirement_records_cut_window_fill_s720.json")
MIGRATIONS = os.path.join(HERE, "migrations", "2026-11-24_s720_prreq_cut_window_fill_")
RULE = ("S720: an electives fill never passes a record over a window the reader cut off "
        "(f-elective-fill-passes-cut-off-windows-s714); the record is collected with the gap named "
        "(sam-collect-with-gaps-2026-11-17)")


def _arith(rec: dict, award, guard: bool) -> dict:
    real = S.window_cut
    if not guard:
        S.window_cut = lambda r: None
    try:
        return S.score(rec, [], None, award)["arithmetic"]
    finally:
        S.window_cut = real


def filled(a: dict) -> bool:
    """The top-level check passes through a fill that adds units (a degree check under a passing major total fills
    after a whole major, the fill's own case)."""
    if not a.get("pass") or (a.get("major") or {}).get("pass") is True:
        return False
    return bool(a.get("fill") and max(a["fill"]) > S.TOL)


def records():
    for path in sorted(glob.glob(os.path.join(COLLEGE_DIR, "*", "records", "*.json"))):
        with open(path, encoding="utf-8") as fh:
            f = json.load(fh)
        if isinstance(f.get("record"), dict) and isinstance(f.get("score"), dict):
            yield path, f


def passes(score: dict) -> bool:
    return all((score.get(k) or {}).get("pass") for k in ("coverage", "invented", "arithmetic", "repeated", "outcomes"))


def measure() -> dict:
    changes, false_passes, not_reproduced = [], [], []
    by_college = collections.Counter()
    n = 0
    for path, f in records():
        n += 1
        off, on = _arith(f["record"], f.get("award"), False), _arith(f["record"], f.get("award"), True)
        key = {"college": f["college"], "control_number": f["control_number"]}
        if off != on:
            refused = on.get("fill_refused") or (on.get("degree") or {}).get("fill_refused") or {}
            changes.append(dict(key, before=off.get("status"), after=on.get("status"), before_pass=bool(off.get("pass")),
                                after_pass=bool(on.get("pass")), filed_pass=bool(f["score"].get("pass")),
                                words=refused.get("words")))
            if off.get("pass") and not on.get("pass"):
                by_college[f["college"]] += 1
        fa = f["score"].get("arithmetic") or {}
        if filled(fa) and S.window_cut(f["record"]):
            if off == fa:
                false_passes.append((path, f, on))
            else:
                not_reproduced.append(key)
    return {"records": n, "changes": changes, "by_college": dict(sorted(by_college.items())),
            "takes_away": sum(1 for c in changes if c["before_pass"] and not c["after_pass"]),
            "adds": sum(1 for c in changes if not c["before_pass"] and c["after_pass"]),
            "false_passes": false_passes, "not_reproduced": not_reproduced}


def after_filed(path: str, f: dict, on: dict) -> dict:
    """The filed record with the after score: the guard's arithmetic, the pass, and the named gap."""
    sc = dict(f["score"], arithmetic=on)
    sc["pass"] = passes(sc)
    new = dict(f, score=sc)
    got = NG.answer(new)
    if not got or got[0] != "section_cut_off":
        raise SystemExit("%s %s: the named-gap rules give %s, not section_cut_off" % (f["college"], f["control_number"], got))
    src, year = NG._sources(path)
    e = src.get(str(f["control_number"])) or {}
    sc["gaps"] = [{"gap": got[0], "label": NG.GAPS[got[0]], "words": got[1]}]
    sc["confidence"] = NG.confidence(new, got[0], e.get("method"), (e.get("catalog_year") or year) == year)
    return new


def images(college: str, replaced: dict) -> dict:
    """{control number: load image} of the college's folder with the replaced records written in, read from a
    temporary copy so the committed files are untouched."""
    slug = C.slug_of(college)
    with tempfile.TemporaryDirectory() as tmp:
        dst = os.path.join(tmp, slug)
        shutil.copytree(os.path.join(COLLEGE_DIR, slug), dst)
        for cn, filed in replaced.items():
            with open(os.path.join(dst, "records", cn + ".json"), "w", encoding="utf-8") as fh:
                json.dump(filed, fh, ensure_ascii=False, indent=1)
        return {str(r["control_number"]): r for r in C.load_rows(college, dst)[0]}


def plan(false_passes: list) -> list[dict]:
    rows = []
    by_college = collections.defaultdict(dict)
    for path, f, on in false_passes:
        by_college[f["college"]][str(f["control_number"])] = (path, after_filed(path, f, on))
    for college, recs in sorted(by_college.items()):
        before = GP.images_now(college)
        after = images(college, {cn: filed for cn, (_, filed) in recs.items()})
        for cn, (path, filed) in sorted(recs.items()):
            b, a = before[cn], after[cn]
            if b["record"] != a["record"] or b["checks"] == a["checks"]:
                raise SystemExit("%s %s: the plan moves the checks alone" % (college, cn))
            rows.append({"college": college, "control_number": cn, "award": filed.get("award"),
                         "path": os.path.relpath(path, ROOT), "words": filed["score"]["arithmetic"]["fill_refused"]["words"],
                         "passes_before": GP._passes(b), "passes_after": GP._passes(a),
                         "before_image": {k: b[k] for k in GP.KEYS}, "after_image": {k: a[k] for k in GP.KEYS},
                         "after_score": filed["score"]})
    for i, r in enumerate(rows, 1):
        r["i"] = i
    return rows


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--write-records", action="store_true")
    a = ap.parse_args(argv)
    m = measure()
    print("records %d; the guard changes %d arithmetic checks: %d passes taken away, %d added"
          % (m["records"], len(m["changes"]), m["takes_away"], m["adds"]))
    print("passes taken away, by college: %s" % json.dumps(m["by_college"]))
    for c in m["changes"]:
        print("  %s %s: %s -> %s (filed %s)" % (c["college"], c["control_number"], c["before"], c["after"],
                                               "passing" if c["filed_pass"] else "failing"))
    print("filed passes through a fill over a cut window: %d; not reproduced by the rescore: %d"
          % (len(m["false_passes"]), len(m["not_reproduced"])))
    if m["adds"] or m["not_reproduced"]:
        raise SystemExit("the guard added a pass, or a filed false pass is not reproduced: no plan is written")
    if a.dry_run or not m["false_passes"]:
        return 0
    rows = plan(m["false_passes"])
    if a.write_records:
        for r in rows:
            p = os.path.join(ROOT, r["path"])
            with open(p, encoding="utf-8") as fh:
                f = json.load(fh)
            f["score"] = r["after_score"]
            with open(p, "w", encoding="utf-8") as fh:
                json.dump(f, fh, ensure_ascii=False, indent=1)
                fh.write("\n")
            print("rewrote %s" % r["path"])
        return 0
    body = {"rule": RULE, "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "measure": {k: v for k, v in m.items() if k not in ("false_passes",)},
            "rows": len(rows),
            "moved": [{k: v for k, v in r.items() if k != "after_score"} for r in rows],
            "after_scores": {"%s %s" % (r["college"], r["control_number"]): r["after_score"] for r in rows},
            "records": ("The record files keep their filed score until the apply lands; then "
                        "`python3 kb/_program_fill_cut_window_s720.py --write-records` writes each after_score, so the "
                        "next load and display carry the same checks."),
            "follow_verdict": ("The record does not change, so a confirm given on it would carry onto the row: the apply "
                               "aborts, writing nothing, if any row's latest verdict is such a confirm (Sheet 82 card 1)."),
            "pre_read": GP.pre_read_sql(rows), "apply": GP.apply_sql(rows, TAG + " cut window fill"),
            "rollback": GP.rollback_sql(rows, TAG + " cut window fill")}
    with open(RECEIPT, "w", encoding="utf-8") as fh:
        json.dump(body, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    rel = os.path.relpath(RECEIPT, ROOT)
    hdr = ("-- S720: the electives fill over a cut-off window, %d row(s): checks to the after-image (arithmetic "
           "unequal, gap section_cut_off);\n-- the record does not change. Receipt: %s.\n" % (len(rows), rel))
    parts = {"preread.sql": ("-- Pre-read, read-only: one SELECT, one JSON value. A clean read: on_run = both_before = "
                             "listed, already_after 0, checked_now 0,\n-- confirm_matches_after 0, confirm_carried 0.\n"
                             + body["pre_read"]),
             "apply.sql": ("-- Guarded UPDATE; aborts unless %d row(s) less those a person checked, and unless no "
                           "confirm carries onto the row.\n" % len(rows) + body["apply"]),
             "rollback.sql": ("-- Rollback, NOT applied: the before-image back where the row holds the after-image. "
                              "Revert the record files too.\n" + body["rollback"])}
    for name, text in parts.items():
        with open(MIGRATIONS + name, "w", encoding="utf-8") as fh:
            fh.write(hdr + text + "\n")
    print("receipt %s (%d rows)" % (rel, len(rows)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
