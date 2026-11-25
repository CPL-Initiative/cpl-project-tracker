#!/usr/bin/env python3
"""S727, lane 2: Butte's map elective line read as electives that fill the degree, and the reconcile for nine.

S721's second reader held nine Butte degrees (f-butte-nine-pass-on-elective-line-s721, p-gap-filing-leaves-census-
lever-s721): 01362, 07269, 11136, 31042, 31941, 32469, 33199, 40923 and 43453. Each page's sample term map prints an
elective line, "Only necessary if the 60 units needed to graduate have not been completed", and the reader kept that
line's figure as degree_elective_units, so the degree's sum (major, general education, the line's figure) falls inside
the map's range and fails. Butte's reconcile config already reads the line as electives that fill the degree
(S636's set of electives_fill_degree); 44 of the 71 Butte records quoting the line leave its figure out, as the line's
words ask. Sam's collect-with-gaps ruling (sam-collect-with-gaps-2026-11-17) and collection first
(r-collection-first-sam-2026-11-20) put these nine back in the pasture.

THE READING (kb/program_requirements_reconcile.json, Butte College; the kind clear_conditional in
kb/_program_requirements_reconcile.py, which only a college whose config names it runs): where the page's text prints
the line, the record reads electives_fill_degree and a degree total, one of the record's own notes names
degree_elective_units, prints its figure and quotes the line (conditional_note), and the major and general education at
their least come short of the degree's low end (conditional_short, the "only necessary if" of the line), and the
figure lies inside what the electives fill (conditional_fits: no less than the degree's low end less the major and
general education at their most, no more than its top less them at their least), the figure is cleared and the
electives fill the degree to its total. Where the major and general education already reach the low end the line asks
for nothing, and the step leaves the record alone (01298, 01305, 07258, 07264, 31930, 32721); where the printed figure
lies outside the fill it is no rest of the degree, and the step leaves it too (01370, 31306, 31307, 31950, 31954,
43185, 43186; S727's second reader).

THE SELF-RECALL (the S652 rule; p-self-recall-reads-rule-fields-s703): HAND is a hand reading of every Butte record
whose notes quote the line with a figure kept as degree_elective_units (27), each answer written from the record's
notes and its figures, never from the step's output: "clear" with the verdict the cleared record should carry, or
"keep" with why. recall() runs the step on every committed record of every college (18,968), with a stand-in text
that prints the line so the record-side guards alone decide, and counts right and wrong: a fire where HAND says
"clear" is right, a fire anywhere else is wrong, and no fire where HAND says "clear" is wrong. A looser note reading
(any "only necessary if", "as needed to reach" or "if needed to reach" sentence; loose_recall) runs at every other
college with such notes (Allan Hancock's and Chabot's unit summaries among them) and fires on none, since none reads
electives_fill_degree with a short major. Boundary readings: the note's words gone, its figure one unit off, the flag
false, no degree total, the major raised to reach the low end, a page text without the line, and a hold.

THE RUN (d-conductor-owns-applies-s720: the conductor dispatches): a reconcile of Butte on this branch,
program-requirements-college.yml with step=reconcile, extract=0, college "Butte College" (free, no model call). It
reads every page again and reconciles every filed record; this module's keep-only then puts every other record back as
the base filed it (d-rios-reconcile-keeps-only-targets-s720) and checks each target: carried by the run, its own page
(same_address on sources.json's url), its record changed in degree_elective_units alone, the step's note filed, and
its arithmetic passing with the fill named. It refuses, writing nothing, unless all nine are kept and the base holds
each one's figure from an earlier run, and refuses again if any other record still carries the run; then it runs
both Commons builders under python3.12. Commit the records and the builders' output; then step=reread posts the nine.

    python3 kb/_program_reconcile_s727_butte.py                 # the self-recall and each target's expected outcome
    python3 kb/_program_reconcile_s727_butte.py keep-only --run <reconcile run id> --base <the run's commit's parent>

Guard: tests/program_reconcile_s727_butte_test.py.
"""
from __future__ import annotations

import argparse
import collections
import copy
import glob
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_requirements_reconcile as R  # noqa: E402
import _program_requirements_score as S  # noqa: E402

ROOT = os.path.dirname(HERE)
COLLEGE = "Butte College"
SLUG = "butte"
COLLEGE_DIR = os.path.join(HERE, "program_requirements_college")
FIELD = "degree_elective_units"
LINE = re.compile(r"only\s+necessary\s+if\s+the\s+60\s+units\s+needed\s+to\s+graduate", re.I)
# A page text that prints the line and the word elective, so the record-side guards alone decide.
STAND_IN = ("Elective (any course numbered 1-199 or C1000-C2999) Only necessary if the 60 units needed to graduate have "
            "not been completed")
LOOSE = r"only\s+(?:necessary|needed|required)\s+if|as\s+needed\s+to\s+(?:reach|achieve)|if\s+needed\s+to\s+reach"

# The nine S721's second reader held (f-butte-nine-pass-on-elective-line-s721), each with the elective figure its note
# quotes from the map's line.
TARGETS = {"01362": 13, "07269": 7, "11136": 7, "31042": 9, "31941": 6, "32469": 6, "33199": 12, "40923": 12,
           "43453": 12}

# The hand reading of the 27 Butte records whose notes quote the line and keep a figure as degree_elective_units: the
# figure the note quotes, then "clear" and the verdict the record should carry once the figure is cleared (each of the
# 14: the major and general education at their least come short of the map's low end of 60 or 61, so the line is
# needed, and the printed figure lies inside what the electives fill), or "keep" and why (13).
_REACH = "keep: the major and general education at their least already reach the map's low end (%s), so the line asks for nothing"
_OUT = "keep: the major and general education (%s) leave the electives %s to fill, and the line prints %s"
HAND = {
    # The nine: failing today, passing once the line's figure fills.
    "01362": (13, "clear", True), "07269": (7, "clear", True), "11136": (7, "clear", True),
    "31042": (9, "clear", True), "31941": (6, "clear", True), "32469": (6, "clear", True),
    "33199": (12, "clear", True), "40923": (12, "clear", True), "43453": (12, "clear", True),
    # Passing today and passing after: the line's figure lies inside what the electives fill, and as fill it reads
    # the same.
    "01348": (3, "clear", True), "09582": (6, "clear", True), "33222": (9, "clear", True),
    "40710": (8, "clear", True), "44716": (7, "clear", True),
    # Kept: the printed figure lies outside what the electives fill (S727's second reader), so the figure is not the
    # rest of the degree.
    "01370": (11, _OUT % ("26 and 21", "13-19", "11"), None),
    "31306": (2, _OUT % ("35 and 21", "4-10", "2"), None),
    "31307": (14, _OUT % ("23 and 21", "16-22", "14"), None),
    "31950": (8, _OUT % ("25 and 34", "1-5", "8"), None),
    "31954": (14, _OUT % ("19 and 34", "7-13", "14"), None),
    "43185": (14, _OUT % ("37 and 21", "2-5", "14"), None),
    "43186": (21.5, _OUT % ("29.5 and 21", "9.5-12.5", "21.5"), None),
    # Kept: the line asks for nothing.
    "01298": (7, _REACH % "44 and 21 against 60-62", None),
    "01305": (1, _REACH % "41 and 21 against 60-64; S721's degree_within_map_range", None),
    "07258": (2, _REACH % "40 and 21 against 60-64; S721's degree_within_map_range", None),
    "07264": (1, _REACH % "44 and 21 against 60-65", None),
    "31930": (4, _REACH % "29 and 34 against 60-64", None),
    "32721": (5, _REACH % "27 and 34 against 60-63", None),
}


def _path(cn: str, slug: str = SLUG) -> str:
    return os.path.join(COLLEGE_DIR, slug, "records", cn + ".json")


def _load(cn: str, slug: str = SLUG) -> dict | None:
    p = _path(cn, slug)
    if not os.path.isfile(p):
        return None
    with open(p, encoding="utf-8") as fh:
        return json.load(fh)


def step() -> dict:
    """Butte's clear_conditional step, as its config carries it."""
    return next(s for s in R.load_steps()[COLLEGE]["steps"] if s["kind"] == "clear_conditional")


def run_step(filed: dict, text: str = STAND_IN, st: dict | None = None) -> tuple[dict, list[dict]]:
    """The step alone on the record (its config's other steps left out, so only this reading moves it)."""
    return R._college_steps(filed.get("record") or {}, text, "X", filed.get("award"),
                            steps={"X": {"steps": [st or step()]}}, control_number=filed.get("control_number"))


def arith(record: dict, award: str | None) -> dict:
    """Today's scorer on the record's own arithmetic, no closed list and no text (as S721's scorer_passes reads)."""
    return S.score(record, [], None, award).get("arithmetic") or {}


def reconciled_by_step(filed: dict) -> dict | None:
    """The run's note, where a reconcile has already cleared the field on this record: its reconciled list holds the
    step's note (the field, its old figure, the line's words), and the field is empty."""
    if R._span_of(((filed.get("record") or {}).get("program") or {}).get(FIELD))[0] is not None:
        return None
    return next((n for n in filed.get("reconciled") or [] if isinstance(n, dict) and n.get("field") == FIELD
                 and n.get("now") == {"min": None, "max": None} and LINE.search(str(n.get("words") or ""))), None)


def state(cn: str, f: dict | None = None) -> str:
    """'before' while the committed record keeps the line's figure, 'after' once a reconcile cleared it."""
    f = _load(cn) if f is None else f
    return "after" if f and reconciled_by_step(f) else "before"


def outcome(cn: str, f: dict | None = None) -> dict:
    """A target's expected outcome: the record as the step leaves it (before the run) or as the run filed it (after),
    and its arithmetic on today's scorer."""
    f = _load(cn) if f is None else f
    if reconciled_by_step(f):
        rec, was = f["record"], reconciled_by_step(f)["was"]
    else:
        rec, notes = run_step(f)
        was = notes[0]["was"] if notes else None
    a = arith(rec, f.get("award"))
    deg = a if a.get("against") == "degree" else a.get("degree") or {}
    return {"control_number": cn, "state": state(cn, f), "was": was, "pass": a.get("pass") is True,
            "fill": deg.get("fill"), "computed": deg.get("computed"), "stated": deg.get("stated")}


def recall() -> dict:
    """The step over every committed record of every college, with the stand-in text, against HAND."""
    out = {"read": 0, "fired": 0, "right": 0, "wrong": [], "by_college": collections.Counter(),
           "after_verdict_wrong": [], "before_failing_after_passing": []}
    seen = set()
    for p in sorted(glob.glob(os.path.join(COLLEGE_DIR, "*", "records", "*.json"))):
        slug = p.split(os.sep)[-3]
        try:
            with open(p, encoding="utf-8") as fh:
                f = json.load(fh)
        except (OSError, ValueError):
            continue
        if not isinstance(f.get("record"), dict):
            continue
        out["read"] += 1
        cn = str(f.get("control_number"))
        hand = HAND.get(cn) if slug == SLUG else None
        if hand and reconciled_by_step(f):
            # After the run: the target already holds the cleared field; the step has nothing left to clear.
            seen.add(cn)
            ok = hand[1] == "clear" and _same(reconciled_by_step(f)["was"], hand[0])
            if ok:
                out["right"] += 1
            else:
                out["wrong"].append([slug, cn, "reconciled, but not as the hand reads it"])
            if arith(f["record"], f.get("award")).get("pass") is not hand[2]:
                out["after_verdict_wrong"].append(cn)
            continue
        new, notes = run_step(f)
        fired = bool(notes)
        if hand:
            seen.add(cn)
        if fired:
            out["fired"] += 1
            out["by_college"][slug] += 1
        want = bool(hand) and hand[1] == "clear"
        if fired != want or (fired and not _same(notes[0]["was"], hand[0])):
            out["wrong"].append([slug, cn, "fired" if fired else "did not fire"])
            continue
        out["right"] += 1
        if fired:
            after = arith(new, f.get("award")).get("pass")
            if after is not hand[2]:
                out["after_verdict_wrong"].append(cn)
            if arith(f["record"], f.get("award")).get("pass") is not True and after is True:
                out["before_failing_after_passing"].append(cn)
    out["hand_not_seen"] = sorted(set(HAND) - seen)
    out["by_college"] = dict(out["by_college"])
    return out


def loose_recall() -> dict:
    """A looser note reading at every other college: the notes any conditional elective sentence matches, and how many
    the step's record-side guards fire on (none: no such record reads electives_fill_degree with a short major)."""
    st = dict(step(), note_words=LOOSE)
    out = {"notes": collections.Counter(), "fired": []}
    for p in sorted(glob.glob(os.path.join(COLLEGE_DIR, "*", "records", "*.json"))):
        slug = p.split(os.sep)[-3]
        if slug == SLUG:
            continue
        with open(p, encoding="utf-8") as fh:
            f = json.load(fh)
        if not isinstance(f.get("record"), dict) or not R.conditional_note(f["record"], FIELD, LOOSE):
            continue
        out["notes"][slug] += 1
        if run_step(f, st=st)[1]:
            out["fired"].append([slug, str(f.get("control_number"))])
    out["notes"] = dict(out["notes"])
    return out


def _same(a, b) -> bool:
    lo, hi = R._span_of(a) if isinstance(a, dict) else (a, a)
    return lo is not None and abs(float(lo) - float(b)) < 0.01 and abs(float(hi if hi is not None else lo) - float(b)) < 0.01


def boundaries() -> dict:
    """Each target with one thing the reading needs taken away: the step must not fire."""
    out, wrong = collections.Counter(), []

    def tally(name, ok, cn):
        out["%s %s" % (name, "right" if ok else "wrong")] += 1
        if not ok:
            wrong.append([cn, name])

    for cn in TARGETS:
        f = _load(cn)
        if reconciled_by_step(f):
            # After the run, the before-image: the field back at the note's figure, so the boundaries read the same.
            f = copy.deepcopy(f)
            f["record"]["program"][FIELD] = reconciled_by_step(f)["was"]
        tally("fires as filed", bool(run_step(f)[1]), cn)
        g = copy.deepcopy(f)
        g["record"]["notes"] = [LINE.sub("", str(n)) for n in g["record"]["notes"]]
        tally("the note's words gone", not run_step(g)[1], cn)
        g = copy.deepcopy(f)
        v = R._span_of(g["record"]["program"][FIELD])[0]
        g["record"]["program"][FIELD] = {"min": v + 1, "max": v + 1}
        tally("the figure one unit off its note", not run_step(g)[1], cn)
        g = copy.deepcopy(f)
        g["record"]["program"]["electives_fill_degree"] = False
        tally("the flag false", not run_step(g)[1], cn)
        g = copy.deepcopy(f)
        g["record"]["program"]["degree_total"] = {"min": None, "max": None}
        tally("no degree total", not run_step(g)[1], cn)
        g = copy.deepcopy(f)
        prog = g["record"]["program"]
        rest = R._span_of(prog["degree_total"])[0] - R._span_of(prog["ge_units"])[0]
        prog["total_units"] = {"min": rest, "max": R._span_of(prog["total_units"])[1] + rest}
        tally("the major raised to the low end", not run_step(g)[1], cn)
        g = copy.deepcopy(f)
        prog = g["record"]["program"]
        room = R._span_of(prog["total_units"])[0] + R._span_of(prog["ge_units"])[0] + R._span_of(prog[FIELD])[0] - 0.5
        prog["degree_total"] = {"min": R._span_of(prog["degree_total"])[0], "max": room}
        tally("the figure past the fill's top", not run_step(g)[1], cn)
        tally("a text without the line", not run_step(f, text="Elective (any course numbered 1-199)")[1], cn)
        tally("held by the step", not run_step(f, st=dict(step(), hold={cn: "a test hold"}))[1], cn)
    return {"counts": dict(out), "wrong": wrong}


def guards() -> dict:
    """The standing guards on each target: its own page (sources.json's url names the record's page, and no other
    program shares it), its live run (S721's posted_runs), no cut window, and today's scorer failing it before."""
    import _program_piles_s721_butte as W
    import _program_requirements_college as C
    src = W._sources()
    out = {}
    for cn in TARGETS:
        f = _load(cn)
        s = src.get(cn) or {}
        out[cn] = {"own_page": C.same_address((s.get("source") or {}).get("url") or "", f.get("source_url") or "")
                   and not W.shared_with(cn),
                   # Before the run, the committed record's run is the posted one; after it, the run that read the
                   # record is still the posted one until the reread lands, and the reconcile run is from then on.
                   "on_live_run": W.on_live_run(f) or (state(cn, f) == "after"
                                                       and W.on_live_run(dict(f, extracted_run=f.get("read_run")))),
                   "no_cut_window": S.window_cut(f["record"]) is None,
                   "fails_before": state(cn) == "after" or not W.scorer_passes(f)}
    return out


def check_target(cn: str, f: dict, b: dict | None) -> str | None:
    """Why a target the reconcile run filed (f) is not as the reading says, against its base filing (b); None where it
    is: the step's note filed with the hand's figure, the record changed in degree_elective_units alone, its own page
    (the run's source_url the base's address), and its arithmetic passing with the fill named."""
    import _program_requirements_college as C
    if b is None:
        return "no base filing"
    # The base is the filing before the run: it holds the line's figure the hand reads (S727's second reader: with the
    # run's own commit as --base, every file "restored" still carried the run).
    if not _same(((b.get("record") or {}).get("program") or {}).get(FIELD), TARGETS[cn]) \
            or str(b.get("extracted_run")) == str(f.get("extracted_run")):
        return "the base does not hold the line's figure from an earlier run: --base is not the filing before the run"
    note = reconciled_by_step(f)
    if not note or not _same(note["was"], TARGETS[cn]):
        return "the step's note is not filed, or names another figure"
    prog_b = dict(b["record"]["program"], **{FIELD: {"min": None, "max": None}})
    if dict(b["record"], program=prog_b) != f["record"]:
        return "the run changed more than degree_elective_units"
    if not C.same_address(f.get("source_url") or "", b.get("source_url") or ""):
        return "the run read another page"
    a = (f.get("score") or {}).get("arithmetic") or {}
    deg = a if a.get("against") == "degree" else a.get("degree") or {}
    if a.get("pass") is not True or not deg.get("fill"):
        return "the rescore does not pass with the fill named"
    return None


def keep_only_plan(run: str, current: dict, base: dict) -> dict:
    """What keep-only writes, decided before anything is written. current is {control number: filed record} as the
    branch holds it after the run; base is {control number: the base commit's file text, or None}. Every record the
    run carried but the nine goes back to its base text, which must not carry the run itself; each of the nine must be
    carried and pass check_target. held lists every refusal; keep-only writes nothing unless it is empty."""
    held, kept, restore = [], [], {}
    for cn, f in sorted(current.items()):
        carried = str(f.get("extracted_run")) == str(run)
        if cn in TARGETS:
            if not carried:
                held.append([cn, "the run did not carry it"])
                continue
            why = check_target(cn, f, json.loads(base[cn]) if base.get(cn) else None)
            if why:
                held.append([cn, why])
            else:
                kept.append(cn)
        elif carried:
            body = base.get(cn)
            if body is None:
                held.append([cn, "no base filing to restore"])
            elif str(json.loads(body).get("extracted_run")) == str(run):
                held.append([cn, "the base still carries the run: --base is not the filing before the run"])
            else:
                restore[cn] = body
    held += [[cn, "no record file"] for cn in sorted(set(TARGETS) - set(current))]
    return {"kept": kept, "restore": restore, "held": held}


def keep_only(run: str, base: str, build: bool = True) -> dict:
    """After the reconcile run filed on this branch: every Butte record but the nine goes back to the base commit's
    filing (d-rios-reconcile-keeps-only-targets-s720), and each target is checked (keep_only_plan). Refuses, writing
    nothing, unless all nine are kept and every restored file is free of the run; after writing, refuses again if any
    record but the nine still carries the run. Then both Commons builders run under python3.12 (S727's second reader;
    p-check-generated-misses-commons-data-s697), and their output joins the kept records' commit before the reread."""
    current, base_text = {}, {}
    for p in sorted(glob.glob(os.path.join(COLLEGE_DIR, SLUG, "records", "*.json"))):
        cn = os.path.basename(p)[:-5]
        with open(p, encoding="utf-8") as fh:
            current[cn] = json.load(fh)
        if cn in TARGETS or str(current[cn].get("extracted_run")) == str(run):
            was = subprocess.run(["git", "show", "%s:%s" % (base, os.path.relpath(p, ROOT))],
                                 capture_output=True, text=True, cwd=ROOT)
            base_text[cn] = was.stdout if was.returncode == 0 else None
    plan = keep_only_plan(run, current, base_text)
    if plan["held"] or sorted(plan["kept"]) != sorted(TARGETS):
        raise SystemExit("keep-only refused, nothing written: %s" % plan["held"])
    for cn, body in plan["restore"].items():
        with open(_path(cn), "w", encoding="utf-8") as fh:
            fh.write(body)
    still = []
    for p in glob.glob(os.path.join(COLLEGE_DIR, SLUG, "records", "*.json")):
        cn = os.path.basename(p)[:-5]
        with open(p, encoding="utf-8") as fh:
            if cn not in TARGETS and str(json.load(fh).get("extracted_run")) == str(run):
                still.append(cn)
    if still:
        raise SystemExit("keep-only: records beside the nine still carry the run: %s" % sorted(still))
    if build:
        subprocess.run(["python3.12", "kb/_build_commons_status.py", "--quiet"], check=True, cwd=ROOT)
        subprocess.run(["python3.12", "kb/_build_commons_data_status.py"], check=True, cwd=ROOT)
    return {"run": run, "base": base, "kept": sorted(plan["kept"]), "restored": len(plan["restore"]),
            "next": "commit the records and the Commons builders' output, then dispatch step=reread"}


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = ap.add_subparsers(dest="cmd")
    k = sub.add_parser("keep-only")
    k.add_argument("--run", required=True)
    k.add_argument("--base", required=True, help="the commit before the run's own (the run's commit's parent)")
    k.add_argument("--no-build", action="store_true", help="skip the Commons builders")
    a = ap.parse_args(argv)
    if a.cmd == "keep-only":
        print(json.dumps(keep_only(a.run, a.base, build=not a.no_build)))
        return 0
    rc, lr, bd, gd = recall(), loose_recall(), boundaries(), guards()
    print("recall: %s" % json.dumps({k: v for k, v in rc.items()}))
    print("loose recall elsewhere: %s" % json.dumps(lr))
    print("boundaries: %s" % json.dumps(bd))
    print("guards: %s" % json.dumps(gd))
    for cn in TARGETS:
        print("outcome: %s" % json.dumps(outcome(cn)))
    return 1 if rc["wrong"] or rc["after_verdict_wrong"] or rc["hand_not_seen"] or lr["fired"] or bd["wrong"] \
        or not all(all(v.values()) for v in gd.values()) else 0


if __name__ == "__main__":
    sys.exit(main())
