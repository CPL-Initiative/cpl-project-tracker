#!/usr/bin/env python3
"""S714, lane 2's cheap piles at College of the Sequoias: the page's double-count figure, and the plan for what the
free reconcile run filed.

The census (kb/status/harvest_gap_census.json, run 45161770730) lists 22 College of the Sequoias programs under the
reconcile_steps lever. Fifteen are local degrees whose major, restricted electives, general education and electives
add past the TOTAL the page prints, and each page says why under that TOTAL: "Courses meet General Education
requirements and 3 units may double count above in COS-GE" (Dance 10045), "0-3 units may double count" (Paralegal
06751), "13 units may be double counted above in Cal-GETC" (Sports Medicine 06770); free page read 45191780301.

THE READING. The college's fill step (kb/program_requirements_reconcile.json) files the figure as ge_overlap, a span;
the scorer reads a span as the most a student counts twice (kb/_program_requirements_score.py degree_verdict): the
degree's units run from the sum less the figure to the sum, and the printed total must be one of them. A flag of true
(Hartnell, ruling 1) stays the uncapped overlap. The step reads the page's own words on the runner: free reconcile run
RUN (program-requirements-college.yml, step=reconcile, extract=0) filed the records on this branch.

THE SELF-RECALL. The held answer per record is the hand reading (HAND_HELD), from the reader's notes and the page read.
The claim checks: the notes (a note quoting the figure, where the reader quoted it: the figure must be the one the run
filed) and today's capture (the run's own fill note: the words it matched on today's page). Boundaries: the figure one
unit less where the sum less the figure meets the total exactly (no pass), and the printed total's top one unit past
the sum (no pass). The precision count runs over all 22 against the run's filed verdicts.

THE PLAN (kb/_program_ge_plan_s713.py's full-row shape): every record whose load image moves between BASE (main's
records) and this branch and whose verdict moves takes one full-row row: the live row takes the after-image's record,
checks and run, only where it still holds the before-image's run, record and checks and no person has checked it.

    python3 kb/_program_piles_s714_sequoias.py --base f0d84966 --dry-run
    python3 kb/_program_piles_s714_sequoias.py --base f0d84966 --tag s714s

Guard: tests/program_piles_s714_sequoias_test.py.
"""
from __future__ import annotations

import argparse
import copy
import collections
import json
import os
import re
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_ge_plan_s713 as GP  # noqa: E402
import _program_requirements_score as S  # noqa: E402

ROOT = os.path.dirname(HERE)
COLLEGE = "College of the Sequoias"
SLUG = "college_of_the_sequoias"
CENSUS = os.path.join(HERE, "status", "harvest_gap_census.json")
LEVER = "reconcile_steps"
PAGE_READ = "45191780301"
RUN = None   # set from the run's filing (main reads it from the records)

DC = "passes: the page prints the units that may double count, and the printed TOTAL lies between the sum less them " \
     "and the sum"
HAND_HELD = {cn: DC for cn in ("06715", "06718", "06720", "06728", "06732", "06740", "06742", "06748", "06751",
                               "06770", "10027", "11572", "19755", "36073", "37613")}
HAND_HELD.update({
    "10045": "held: the sum (64) less the 3 units the page lets count twice is 61, past the printed 60; the catalog's "
             "own figures differ (15 + 6 + 17 + 25 = 63 as printed), for a person",
    "06764": "held: the sum runs short at its low end (56 against 60-64): electives fill it, and no double count closes "
             "a short sum",
    "42254": "held: the sum runs short at its low end (44 against 60)",
    "32710": "held: the transfer degree's lists add to 21-22 against 24; a list's floor the reading left unset",
    "35415": "held: the pathway's 18 units are one list read as blocks (6-30); a reread",
    "37744": "held: the certificate's lists add to 26-32 against 24; the catalog's figures differ",
    "45030": "held: Cal-GETC's areas add to 35-41 against 34; the pattern's own minimums, for the Cal-GETC lane",
})
FIGURE = re.compile(r"(\d+(?:\.\d+)?)(?:\s*-\s*(\d+(?:\.\d+)?))?\s+units?\s+may\s+(?:be\s+)?double[\s-]?count", re.I)


def census_members(path: str = CENSUS) -> list[str]:
    with open(path, encoding="utf-8") as fh:
        d = json.load(fh)
    for lv in d.get("levers") or []:
        if lv.get("lever") == LEVER and lv.get("scope") == COLLEGE:
            return list(lv.get("members") or [])
    return []


def _load(cn: str) -> dict | None:
    p = os.path.join(GP.C.COLLEGE_DIR if hasattr(GP.C, "COLLEGE_DIR") else os.path.join(HERE,
                     "program_requirements_college"), SLUG, "records", cn + ".json")
    if not os.path.isfile(p):
        return None
    with open(p, encoding="utf-8") as fh:
        return json.load(fh)


def filed_figure(f: dict):
    """The span the run's fill step filed as ge_overlap, or None."""
    v = (f.get("record") or {}).get("program", {}).get("ge_overlap")
    return S._span(v) if isinstance(v, dict) else None


def fill_words(f: dict) -> str | None:
    """The words today's page printed that the run's fill step matched (its reconcile note)."""
    for n in f.get("reconciled") or (f.get("record") or {}).get("reconciled") or []:
        if isinstance(n, dict) and n.get("field") == "ge_overlap":
            return str(n.get("words") or "")
    return None


def notes_claim(f: dict) -> str:
    """'stands' where a note quotes a figure equal to the filed one's top, 'against' where it quotes another,
    'silent' where no note quotes one."""
    fig = filed_figure(f)
    quoted = [float(m.group(2) or m.group(1)) for n in (f.get("record") or {}).get("notes") or []
              for m in FIGURE.finditer(str(n))]
    if not quoted:
        return "silent"
    return "stands" if fig and any(abs(q - fig[1]) < 1e-9 for q in quoted) else "against"


def capture_claim(f: dict) -> str:
    """'stands' where the run's fill note holds the page's words and they name the filed figure."""
    w, fig = fill_words(f), filed_figure(f)
    if not w or not fig:
        return "no fill"
    m = FIGURE.search(w)
    return "stands" if m and abs(float(m.group(2) or m.group(1)) - fig[1]) < 1e-9 else "against"


def verdict(f: dict) -> str:
    return "passes" if S.passes_live(f.get("score")) else "none"


def precision(path: str = CENSUS) -> dict:
    out = {"read": 0, "right": 0, "wrong": [], "by_answer": collections.Counter()}
    for cn in census_members(path):
        f = _load(cn)
        truth = "passes" if HAND_HELD.get(cn, "").startswith("passes") else "none"
        out["read"] += 1
        out["by_answer"][truth] += 1
        got = verdict(f) if f else "none"
        if got == truth:
            out["right"] += 1
        else:
            out["wrong"].append([cn, truth, got])
    out["by_answer"] = dict(out["by_answer"])
    return out


def claim_checks(path: str = CENSUS) -> dict:
    out = {"notes": collections.Counter(), "capture": collections.Counter(), "not_standing": []}
    for cn in census_members(path):
        if not HAND_HELD.get(cn, "").startswith("passes"):
            continue
        f = _load(cn)
        n, c = notes_claim(f), capture_claim(f)
        out["notes"][n] += 1
        out["capture"][c] += 1
        if n == "against" or c != "stands":
            out["not_standing"].append([cn, n, c])
    return {k: (dict(v) if isinstance(v, collections.Counter) else v) for k, v in out.items()}


def _degree(f: dict) -> dict:
    return S.score(f["record"], [], None, f.get("award"))["arithmetic"]


def boundaries(path: str = CENSUS) -> dict:
    """The figure one unit less where the sum less it meets the total's low end exactly (no pass), and the printed
    total's top one unit past the sum (no pass); scored from the record alone, the arithmetic's own reading."""
    out, wrong = collections.Counter(), []

    def tally(name, ok, cn):
        out["%s %s" % (name, "right" if ok else "wrong")] += 1
        if not ok:
            wrong.append([cn, name])

    for cn in census_members(path):
        if not HAND_HELD.get(cn, "").startswith("passes"):
            continue
        f = _load(cn)
        a = _degree(f)
        fig = filed_figure(f)
        if not fig or not a.get("computed") or not a.get("stated"):
            tally("figure filed", False, cn)
            continue
        lo, hi = a["computed"]
        st = a["stated"]
        if abs(lo - fig[1] - st[0]) < 1e-9:
            g = copy.deepcopy(f)
            g["record"]["program"]["ge_overlap"] = {"min": fig[0], "max": fig[1] - 1}
            tally("figure one less", not _degree(g).get("pass"), cn)
        g = copy.deepcopy(f)
        g["record"]["program"]["degree_total"] = {"min": st[0], "max": hi + 1}
        tally("total's top one past the sum", not _degree(g).get("pass"), cn)
    return {"counts": dict(out), "wrong": wrong}


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--base", required=True)
    ap.add_argument("--run", required=True, help="the free reconcile run that filed the records")
    ap.add_argument("--tag", default="s714s")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args(argv)
    GP.RUNS = {COLLEGE: a.run}
    GP.DECIDED_HELD = {}
    pr, cc, bd = precision(), claim_checks(), boundaries()
    print("precision: %s" % json.dumps(pr))
    print("claim checks: %s" % json.dumps(cc))
    print("boundaries: %s" % json.dumps(bd))
    res = GP.plan(a.base)
    rows = [r for r in res["rows"] if r["passes_after"] and not r["passes_before"]]
    other = [r for r in res["rows"] if r not in rows]
    for r in rows:
        r["target"] = r["control_number"] in HAND_HELD
    for i, r in enumerate(rows, 1):
        r["i"] = i
    print("plan: %d rows (%s); other rows %d; restamped %d; counts only %d; written, verdict same %d" % (
        len(rows), " ".join(r["control_number"] for r in rows), len(other), len(res["restamped_not_planned"]),
        len(res["counts_only_not_planned"]), len(res["record_written_verdict_same_not_planned"])))
    if pr["wrong"] or cc["not_standing"] or bd["wrong"] or other or not all(r["target"] for r in rows):
        raise SystemExit("the self-recall reads a wrong answer, or a row moves outside the hand reading: no plan")
    if a.dry_run or not rows:
        return 0
    day = time.strftime("%Y-%m-%d", time.gmtime())
    path = os.path.join(HERE, "receipts", "program_requirement_records_piles_sequoias_%s_%s.json" % (day, a.tag))
    body = {"rule": "S714 lane 2: College of the Sequoias's double-count figure, a capped overlap",
            "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "base": a.base, "run": a.run,
            "page_read": PAGE_READ, "census": {"lever": LEVER, "members": census_members()},
            "precision": pr, "claim_checks": cc, "boundaries": bd,
            "held": [{"control_number": cn, "why": w} for cn, w in sorted(HAND_HELD.items()) if w.startswith("held")],
            "restamped_not_planned": res["restamped_not_planned"],
            "counts_only_not_planned": res["counts_only_not_planned"],
            "record_written_verdict_same_not_planned": res["record_written_verdict_same_not_planned"],
            "records": rows,
            "follow_verdict": ("The record changes, so a confirm given on the old record no longer matches. The apply "
                               "aborts, writing nothing, if any row's latest verdict is a confirm matching the new "
                               "record's fingerprint, or one given on the old record a reread would carry over; the "
                               "pre-read counts them."),
            "pre_read": GP.pre_read_sql(rows), "apply": GP.apply_sql(rows, a.tag),
            "rollback": GP.rollback_sql(rows, a.tag)}
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(body, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    rel = os.path.relpath(path, ROOT)
    hdr = ("-- %s: College of the Sequoias's double-count figure, %d full-row rows: record, checks and run to the\n"
           "-- reconcile run's filing (%s). Receipt: %s.\n" % (a.tag.upper(), len(rows), a.run, rel))
    base = os.path.join(HERE, "migrations", "%s_%s_prreq_piles_" % (day, a.tag))
    for name, text in (("preread.sql", "-- Pre-read, read-only: one SELECT, one JSON value.\n" + body["pre_read"]),
                       ("apply.sql", "-- Guarded UPDATE; aborts unless %d rows less those a person checked, and "
                                     "unless no confirm matches.\n" % len(rows) + body["apply"]),
                       ("rollback.sql", "-- Rollback, NOT applied: the before-image back where the row holds the "
                                        "after-image. Revert the record files too.\n" + body["rollback"])):
        with open(base + name, "w", encoding="utf-8") as fh:
            fh.write(hdr + text + "\n")
    print("receipt %s" % rel)
    return 0


if __name__ == "__main__":
    sys.exit(main())
