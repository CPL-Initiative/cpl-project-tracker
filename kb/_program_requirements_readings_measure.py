#!/usr/bin/env python3
"""Measure S644's two scorer readings and its reconcile steps at every college, on the filed records.

The harvest's NEXT 5 (docs/reference/lanes/program-requirements-harvest.md): "two scorer readings, one writer,
each measured at every college first: a noncredit Total Hours N-M, and the electives flag where a step files
the catalog's own sentence." The method is d-hours-meets-top-term-length-s639's: build the reading, run it on
every filed record, and narrow it to the cause you can state.

The filed records (kb/program_requirements_college/*/records/*.json) keep the record, its score and the
reading's notes, but not the page text or the closed list, which stay with the run that read them. So this
measures what the files can show and says what waits for a page:

  1. hours_total_only's second reading (total_hours_printed): a page printing 'Total Hours N' or 'N-M' with no
     colon. It is read only where the first reading fails, so its reach is the hours records that fail as
     incomplete with a stated total and no course or block figure. Which of those move depends on the page
     text; the notes say how each reading quoted its total line, which estimates the movers.
  2. the electives guard (electives_named): every record failing on the guard is named by its own score, and
     its arithmetic once the guard is answered is degree_verdict's on the stored sum.
  3. the general education steps S644 added: each simulated on every filed record of its college the step's
     awards and fields admit, as if its pattern matched (the upper bound), through degree_check on the stored
     sum.

A filed record moves only when a reconcile run (program-requirements-college.yml, step=reconcile, extract=0)
rescores it on fresh text; step=reread then posts it with the live row's before-values in its receipt.

    python3 kb/_program_requirements_readings_measure.py          # the counts, by college
    python3 kb/_program_requirements_readings_measure.py --json   # the same, as JSON with every key
"""
from __future__ import annotations

import argparse
import collections
import glob
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_requirements_reconcile as R  # noqa: E402
import _program_requirements_score as S  # noqa: E402

GLOB = os.path.join(HERE, "program_requirements_college", "*", "records", "*.json")
GUARD = "names no electives"
NO_UNITS = "pattern, but no units for it"
# The general education steps S644 added (kb/program_requirements_reconcile.json).
GE_STEP_COLLEGES = ("East Los Angeles College", "Los Angeles Pierce College")
# A reading's note that the window does not print the program's own heading.
HEADING_DOUBT = re.compile(r"heading[^.]{0,80}(?:not (?:printed|in)|cut off|is inferred|falls on the preceding)"
                           r"|section_heading (?:uses|is inferred)|department head", re.I)


def filed_records(pattern: str = GLOB):
    for path in sorted(glob.glob(pattern)):
        with open(path) as fh:
            f = json.load(fh)
        if isinstance(f.get("record"), dict) and isinstance(f.get("score"), dict):
            yield f


def _figure_free(rec: dict) -> bool:
    """No course, alternative or block carries a figure: hours_total_only's record test."""
    for b in rec.get("blocks") or []:
        if S._span(b.get("stated")):
            return False
        for c in b.get("courses") or []:
            for e in [c] + S.alternatives(c):
                if S._num(e.get("units")) or S._num(e.get("units_max")):
                    return False
    return True


def flat_checks(score: dict) -> dict:
    """A filed score's checks as the load writes them to the live row."""
    return {"coverage": (score.get("coverage") or {}).get("pass"), "invented": (score.get("invented") or {}).get("pass"),
            "arithmetic": (score.get("arithmetic") or {}).get("status")}


def hours_shape(f: dict) -> str:
    """Why an hours record the tab does not count passing fails, by its score."""
    a = f["score"].get("arithmetic") or {}
    st = a.get("status")
    if f["score"].get("coverage", {}).get("pass") is not True or f["score"].get("invented", {}).get("pass") is not True:
        return "coverage or invented fails (arithmetic %s)" % st
    if st == "incomplete" and not a.get("stated"):
        return "incomplete, the record names no total"
    if st == "incomplete" and _figure_free(f["record"]) and a.get("against") == "program":
        return "incomplete, a total and no course figure (the reading's reach)"
    if st == "incomplete":
        return "incomplete, a total and some course figures"
    if st == "unequal":
        return "unequal, the courses' sum against the printed total"
    return "arithmetic %s" % st


def quoted_total(f: dict) -> str:
    """How the reading quoted the page's total line, for the reach: the second reading's form ('Total Hours N'
    or 'N-M' with no colon, both ends the record's), the first reading's (a colon: it already reads it, so
    the record fails on other text), or neither."""
    stated = f["score"]["arithmetic"].get("stated") or [None, None]
    notes = " | ".join(f["record"].get("notes") or [])
    m = S.TOTAL_HOURS.search(notes)
    if not m:
        return "neither (a description's hours, a label with another word, or no label quoted)"
    if ":" in m.group(0):
        return "a colon (the first reading's form; the page fails on other text)"
    lo = float(m.group(1))
    hi = float(m.group(2)) if m.group(2) else lo
    if abs(lo - stated[0]) <= S.TOL and abs(hi - stated[1]) <= S.TOL:
        return "no colon, both ends the record's (expected to move)"
    return "no colon, another figure"


def gated_colleges(steps: dict) -> set:
    """The colleges whose procedure names the no-colon hours reading (a step filing hours_total_printed)."""
    return {c for c, e in steps.items() for st in e.get("steps") or [] if st.get("field") == "hours_total_printed"}


def measure_hours(records: list[dict], steps: dict | None = None) -> dict:
    shapes, reach = collections.defaultdict(list), collections.defaultdict(lambda: collections.defaultdict(list))
    reach_passing, expected = [], collections.defaultdict(list)
    gated = gated_colleges(steps if steps is not None else R.load_steps())
    for f in records:
        if S.measure(f["record"]) != "hours":
            continue
        a = f["score"].get("arithmetic") or {}
        in_reach = (a.get("status") == "incomplete" and a.get("stated") and a.get("against") == "program"
                    and _figure_free(f["record"]))
        if in_reach and S.passes_live(f["score"]):
            reach_passing.append(f["control_number"])
        if S.counts_passing_on_tab(flat_checks(f["score"])):
            continue
        shapes[hours_shape(f)].append((f["college"], f["control_number"]))
        if in_reach:
            q = quoted_total(f)
            reach[q][f["college"]].append(f["control_number"])
            notes = " ".join(f["record"].get("notes") or [])
            # Expected to move: the college's procedure names the reading, the reading quotes the no-colon
            # total, describes a 0 or N/A column, and never says the page lacks the program's heading.
            if (f["college"] in gated and q.startswith("no colon, both ends") and not HEADING_DOUBT.search(notes)
                    and re.search(r"\b0\b[^.]{0,40}units|units[^.]{0,30}(?:column|N/A)|N/A", notes, re.I)):
                expected[f["college"]].append(f["control_number"])
    return {"shapes": shapes, "reach": reach, "reach_passing": reach_passing, "gated": sorted(gated),
            "expected": expected}


def _final(f: dict, deg: dict) -> bool:
    """Whether the record's arithmetic passes once its degree check reads deg: score() keeps a failing major."""
    a = f["score"]["arithmetic"]
    if a.get("against") == "program":
        return a.get("status") == "equal" and deg["pass"]
    major = a.get("major")
    return deg["pass"] and (major is None or major.get("pass") is True)


def _degree(a: dict) -> dict | None:
    return a if a.get("against") == "degree" else a.get("degree")


def measure_electives(records: list[dict], steps: dict) -> dict:
    out = collections.defaultdict(list)
    carrying = []
    for f in records:
        prog = f["record"].get("program") or {}
        if prog.get("electives_fill_words"):
            carrying.append(f["control_number"])
        a = f["score"]["arithmetic"]
        deg = _degree(a) or {}
        why = list(a.get("why") or []) + list(deg.get("why") or [])
        cert = (a.get("against") == "program" and a.get("status") == "unequal" and not prog.get("degree_total")
                and prog.get("electives_fill_degree") and a.get("computed") and a.get("stated")
                and a["computed"][1] <= a["stated"][0] + S.TOL)
        if not (any(GUARD in w for w in why) or cert):
            continue
        if cert:
            ok = True
        else:
            v = S.degree_verdict(prog, tuple(map(float, deg["stated"])), float(deg["computed"][0]),
                                 float(deg["computed"][1]), f.get("award"))
            ok = _final(f, v)
        mine = [st for st in (steps.get(f["college"]) or {}).get("steps") or []
                if st.get("field") == "electives_fill_words" and R.awards_match(st.get("awards"), f.get("award"))]
        words = [st["value"] for st in mine]
        scoped = any(st.get("before") for st in mine)
        notes = " ".join(f["record"].get("notes") or [])
        quoted = any(S._words(w) in S._words(notes) for w in words)
        live = ok and f["score"]["coverage"]["pass"] is True and f["score"]["invented"]["pass"] is True
        # A heading-scoped step reads from the record's heading: a reading that says the window does not
        # print it (a department header or 'Program Requirements' standing in) takes no sentence.
        no_head = scoped and bool(HEADING_DOUBT.search(notes))
        out[f["college"]].append({"control_number": f["control_number"], "award": f.get("award"),
                                  "certificate": bool(cert), "arith_passes": ok, "passes_live": live,
                                  "step": bool(words), "notes_quote_step": quoted, "heading_scoped": scoped,
                                  "heading_not_printed": no_head,
                                  "expected": live and quoted and not no_head})
    return {"by_college": out, "carrying": carrying}


def _stub_text(f: dict, prog: dict) -> str | None:
    """A stand-in for the page text that answers the electives guard as the filed score did."""
    if not prog.get("electives_fill_degree"):
        return None
    a = f["score"]["arithmetic"]
    why = list(a.get("why") or []) + list((_degree(a) or {}).get("why") or [])
    return "" if any(GUARD in w for w in why) else "electives"


def simulate_ge(f: dict, step: dict) -> tuple[str, bool | None]:
    """(what happened, passes after) for one ge_units step on one filed record, as if its pattern matched."""
    prog = f["record"].get("program") or {}
    if not R.awards_match(step.get("awards"), f.get("award")):
        return "award not read", None
    if not R._empty(prog.get(step["field"])):
        return "field already set", None
    needs = step.get("only_with") or []
    if any(R._empty(prog.get(n)) or prog.get(n) == "" for n in ([needs] if isinstance(needs, str) else needs)):
        return "only_with field empty", None
    a = f["score"]["arithmetic"]
    deg = _degree(a)
    if not deg or not deg.get("computed") or not deg.get("stated"):
        return "no degree check (general education rides outside it)", S.passes_live(f["score"])
    other = [w for w in deg.get("why") or [] if NO_UNITS not in w and GUARD not in w]
    if other:
        return "the degree check fails on the blocks", False
    new = dict(prog, **{step["field"]: step["value"]})
    lo, hi = float(deg["computed"][0]), float(deg["computed"][1])
    v = S.degree_check(new, tuple(map(float, deg["stated"])), lo, hi, [], _stub_text(f, prog), f.get("award"))
    after = (_final(f, v) and f["score"]["coverage"]["pass"] is True and f["score"]["invented"]["pass"] is True)
    return v["status"] + (" (%s)" % ",".join(k for k in ("within", "overlap", "transfer", "minimum") if v.get(k))
                          if v["pass"] else ""), after


def measure_ge(records: list[dict], steps: dict) -> dict:
    out = {}
    for college in GE_STEP_COLLEGES:
        for i, st in enumerate((steps.get(college) or {}).get("steps") or []):
            if st.get("field") != "ge_units":
                continue
            rows = collections.defaultdict(list)
            for f in records:
                if f["college"] != college:
                    continue
                before = S.passes_live(f["score"])
                what, after = simulate_ge(f, st)
                if after is None:
                    continue
                move = ("fail to pass" if after and not before else "pass to fail" if before and not after
                        else "passes, unchanged" if before else "fails, unchanged")
                rows[move].append((f["control_number"], what))
            out["%s step %d (ge_units %s-%s, %s)" % (college, i + 1, st["value"]["min"], st["value"]["max"],
                                                    st.get("awards"))] = rows
    return out


def statewide_cal_getc(records: list[dict]) -> dict:
    """Unruled, for the conductor: a transfer degree naming Cal-GETC and no units, given 34 on no words of its
    own catalog (Taft's step cites Monterey Peninsula's page and went to Sam as a card, S415)."""
    rows = collections.defaultdict(list)
    step = {"field": "ge_units", "value": {"min": 34, "max": 34}, "awards": "transfer",
            "only_with": ["ge_pattern", "degree_total"]}
    for f in records:
        prog = f["record"].get("program") or {}
        a = f["score"]["arithmetic"]
        why = list(a.get("why") or []) + list((_degree(a) or {}).get("why") or [])
        if not any(NO_UNITS in w for w in why) or not re.search(r"Cal-?GETC", prog.get("ge_pattern") or "", re.I):
            continue
        what, after = simulate_ge(f, step)
        if after is not None:
            rows["passes" if after else "still fails"].append((f["college"], f["control_number"]))
    return rows


CAL_GETC_PLAN = os.path.join(HERE, "program_requirements_calgetc_34_plan.json")
# A figure beside Cal-GETC as a reading's notes quote the page (an estimate of the page gate, never a gate).
NOTES_FIGURE = re.compile(r"(?:cal\s*-?\s*getc|general\s+education\s+transfer\s+curriculum)[^.;]{0,80}?\b\d{1,2}(?:\.\d{1,2})?"
                          r"(?:\s*[-–]\s*\d{1,2})?\b|\b\d{1,2}(?:\s*[-–]\s*\d{1,2})?\s*units?[^.;]{0,40}?cal\s*-?\s*getc",
                          re.I)


def _git_head() -> tuple[str | None, str | None]:
    import subprocess
    try:
        out = subprocess.run(["git", "-C", HERE, "log", "-1", "--format=%H %cI"], capture_output=True, text=True,
                             check=True).stdout.split()
        return out[0], out[1]
    except (OSError, subprocess.CalledProcessError, IndexError):
        return None, None


# Records held by name until a person reads them again (the conductor, S648, from the second readers of #3244).
HELD_BY_NAME = {
    "Antelope Valley College": {"43028": "its page prints a GE table (39 CSU / 37 IGETC) and its sibling AS-Ts print "
                                         "'Completion of Cal-GETC Units 35 units'"},
    "Los Angeles Southwest College": {"33658": "its major reads 25 against a printed 'minimum of 37-39 units in the "
                                               "major' (a draft catalog); held until the major is read again"},
    "Sacramento City College": {"30700": "its section heading is not printed on its page"},
}


def cal_getc_34_plan(records: list[dict], commit: str | None = None, date: str | None = None,
                     steps: dict | None = None) -> dict:
    """Sam's ruling (Sheet 187 card 5, 13:19:50Z 2026-11-13: "Use 34 statewide"), measured once on the filed
    records. A record is touched when the statewide rule's record gates admit it (R.calgetc_hold's: a transfer
    degree, Cal-GETC alone, no general education units, a degree total of exactly 60, no UC-transfer heading or
    title). Each touched record's standing with 34 filled (R.calgetc_standing, read by the scorer's degree_verdict:
    exact, under with its basis "stated" or "sheet-81", overlap, short, unknown) is listed with its numbers; the
    rule fills exact and under only, and holds an overlap record unless
    the catalog states double counting (the notes are searched here and quoted; the rule reads the page). A
    legacy number reading its "2.0" sibling's section is listed with its pair and left out of the apply. The
    page gates (the section's own words: a printed figure, a partial Cal-GETC line, another pattern) read the
    page text, which the files do not keep; they run in each college's reconcile run. likely_held_by_page_gate
    estimates them from the reading's notes and never gates. A one-time measure: no CI step checks this file."""
    steps = R.load_steps() if steps is None else steps
    by_college = collections.defaultdict(list)
    for f in records:
        by_college[f["college"]].append(f)
    colleges, pairs = {}, []
    for college, fs in sorted(by_college.items()):
        family = [{"control_number": f["control_number"], "title": f.get("title"),
                   "section_heading": (f["record"].get("program") or {}).get("section_heading")} for f in fs]
        rows = []
        for f in sorted(fs, key=lambda x: x["control_number"]):
            prog = f["record"].get("program") or {}
            if not R.awards_match("transfer", f.get("award")) or not R._empty(prog.get("ge_units")) \
                    or not R.CAL_GETC_ONLY.match(prog.get("ge_pattern") or ""):
                continue
            if R._lo_hi(prog.get("degree_total")) != (60.0, 60.0):
                continue
            if R.PARTIAL_TITLE.search(prog.get("section_heading") or "") or R.PARTIAL_TITLE.search(f.get("title") or ""):
                continue
            sibs = [x for x in family if x["control_number"] != f["control_number"]]
            legacy = R.calgetc_legacy_of(f.get("title"), prog.get("section_heading"), sibs)
            stand = R.calgetc_standing(prog, f.get("award"))
            notes = " ".join(str(n) for n in f["record"].get("notes") or [])
            row = {"control_number": f["control_number"], "title": f.get("title"),
                   "section_heading": prog.get("section_heading"), **stand}
            dc = R.DOUBLE_COUNT.search(notes)
            if stand["standing"] == "overlap" and dc:
                row["double_count_words"] = notes[max(0, dc.start() - 80):dc.end() + 80].strip()
            if NOTES_FIGURE.search(notes):
                row["likely_held_by_page_gate"] = True
            if legacy:
                row["legacy_of"] = legacy
                pairs.append({"college": college, "legacy": f["control_number"], "two_point_oh": legacy,
                              "section_heading": prog.get("section_heading")})
            conf = steps.get(college) or {}
            own = [st for st in conf.get("steps") or [] if st.get("kind") == "set" and st.get("field") == "ge_units"
                   and R.awards_match(st.get("awards"), f.get("award"))]
            named = (R.calgetc_step(conf) or {}).get("hold") or {}
            if f["control_number"] in HELD_BY_NAME.get(college, {}):
                row["route"], row["held"] = "held by name", HELD_BY_NAME[college][f["control_number"]]
                row["fills"] = False
            elif own:
                # The college's own printed figure, by its set step (it runs first; the statewide rule never asks).
                row["route"], row["figure"] = "college set step", own[0]["value"]
                row["fills"] = True
            elif R.calgetc_step(conf) is None:
                row["route"], row["fills"] = "needs a page read", False
            elif f["control_number"] in named:
                row["route"], row["held"], row["fills"] = "held by name", named[f["control_number"]], False
            else:
                row["route"] = "statewide step"
                row["fills"] = (not legacy and (stand["standing"] in ("exact", "under")
                                                or (stand["standing"] == "overlap" and bool(dc))))
            rows.append(row)
        if rows:
            colleges[college] = rows
    allrows = [r for rs in colleges.values() for r in rs]
    count = lambda pred: sum(1 for r in allrows if pred(r))
    fill_by = {c: sum(1 for r in rs if r["fills"]) for c, rs in colleges.items()}
    route_of = lambda c: sorted({r["route"] for r in colleges[c]})
    return {"ruling": "sam-sheet-187-calgetc-34-statewide-2026-11-13 (Open Asks Sheet 187 card 5, 13:19:50Z "
                      "2026-11-13: \"Use 34 statewide\")",
            "rule": "kb/_program_requirements_reconcile.py statewide_cal_getc (calgetc_hold)",
            "source_words": R.CAL_GETC_SOURCE,
            "measured_on": {"commit": commit, "date": date, "records": "kb/program_requirements_college/*/records/",
                            "kind": "a one-time measure of the committed records; no CI step checks it"},
            "upper_bound": "the record gates only; the page gates run in each college's reconcile run",
            "counts": {"touched": len(allrows), "colleges_touched": len(colleges),
                       "exact": count(lambda r: r["standing"] == "exact"),
                       "under": count(lambda r: r["standing"] == "under"),
                       "under_basis_stated": count(lambda r: r.get("basis") == "stated"),
                       "under_basis_sheet_81": count(lambda r: r.get("basis") == "sheet-81"),
                       "overlap": count(lambda r: r["standing"] == "overlap"),
                       "overlap_with_double_count_words": count(lambda r: "double_count_words" in r),
                       "short": count(lambda r: r["standing"] == "short"),
                       "unknown": count(lambda r: r["standing"] == "unknown"),
                       "legacy_left_out": len(pairs),
                       "fills": count(lambda r: r["fills"]),
                       "fills_statewide": count(lambda r: r["fills"] and r["route"] == "statewide step"),
                       "fills_college_set_step": count(lambda r: r["fills"] and r["route"] == "college set step"),
                       "needs_a_page_read": count(lambda r: r["route"] == "needs a page read"),
                       "fills_not_likely_held_by_page_gate": count(lambda r: r["fills"] and not r.get("likely_held_by_page_gate")),
                       "colleges_filling": sum(1 for n in fill_by.values() if n)},
            "fills_by_college": dict(sorted(((c, n) for c, n in fill_by.items() if n), key=lambda x: (-x[1], x[0]))),
            "statewide_step_colleges": {c: fill_by[c] for c in colleges if "statewide step" in route_of(c)},
            "college_set_step_colleges": {c: next(r["figure"] for r in colleges[c] if r.get("figure"))
                                          for c in colleges if "college set step" in route_of(c)},
            "needs_a_page_read": sorted(c for c in colleges if "needs a page read" in route_of(c)),
            "held_by_name": [{"college": c, "control_number": r["control_number"], "why": r["held"]}
                             for c, rs in colleges.items() for r in rs if r.get("held")],
            "legacy_pairs": pairs,
            "unknown_held": [{"college": c, "control_number": r["control_number"], "title": r.get("title"),
                              "why": r.get("why")} for c, rs in colleges.items() for r in rs
                             if r["standing"] == "unknown"],
            "colleges": colleges}


def _span_words(v) -> str:
    lo, hi = R._lo_hi(v)
    return "none" if lo is None else ("%g" % lo if lo == hi else "%g-%g" % (lo, hi))


def calgetc_apply_plan_path(college: str) -> str:
    from _program_requirements_college import slug_of
    return os.path.join(HERE, "program_requirements_college", slug_of(college), "calgetc_apply_plan.json")


def calgetc_apply_plan(records: list[dict], college: str, commit: str | None = None, date: str | None = None,
                       steps: dict | None = None) -> dict:
    """One college's Cal-GETC apply as a dry run on its filed records, before its reconcile run is dispatched
    (S649, after Grossmont's #3252): each record the college's Cal-GETC route reaches, with its ge_units and its
    passing (passes_live) before and after. The route is the college's own ge_units set step where its config
    carries one (every record the step's awards and only_with admit, simulated by simulate_ge as if its
    pattern matched), else its statewide_cal_getc step (the record gates of cal_getc_34_plan; its page gates run
    in the reconcile run, so a fill here is an upper bound). A row is held, never applied, where the fill would
    turn a passing record failing, or where a set step's figure puts the sum past 60 at both ends (overlap): a
    set step checks no standing while draft #3250 is unmerged, and Grossmont 46141, the same shape, was kept as
    main files it (#3252). A held row the set step still fills in the run is restored from main before the
    reread (restore_before_reread)."""
    steps = R.load_steps() if steps is None else steps
    conf = steps.get(college) or {}
    mine = [f for f in records if f["college"] == college]
    own = [st for st in conf.get("steps") or [] if st.get("kind") == "set" and st.get("field") == "ge_units"]
    rows = []
    if own:
        route = "college set step"
        cands = [(f, st) for f in sorted(mine, key=lambda x: x["control_number"]) for st in own[:1]]
    elif R.calgetc_step(conf) is not None:
        route = "statewide step"
        plan = cal_getc_34_plan(mine, steps=steps).get("colleges", {}).get(college, [])
        by_cn = {f["control_number"]: f for f in mine}
        cands = [(by_cn[r["control_number"]], dict(step_of=r)) for r in plan]
    else:
        return {"college": college, "route": None, "why": "the college's config carries no Cal-GETC step",
                "rows": [], "apply": [], "restore_before_reread": [], "held": []}
    for f, st in cands:
        prog = f["record"].get("program") or {}
        before = S.passes_live(f["score"])
        if route == "statewide step":
            pr = st["step_of"]
            sim = {"field": "ge_units", "value": dict(R.CAL_GETC_UNITS), "awards": "transfer",
                   "only_with": ["ge_pattern", "degree_total"]}
            fills = bool(pr.get("fills"))
            held = None if fills else (pr.get("held") or "the statewide rule holds it: %s" % pr.get("standing"))
        else:
            sim = st
            fills, held = True, None
        what, after = simulate_ge(f, sim)
        if after is None:
            continue
        fig = sim["value"]
        maj = R._lo_hi(prog.get("total_units"))
        el = [R._lo_hi(prog.get(k)) for k in ("open_elective_units", "degree_elective_units")]
        total = R._lo_hi(prog.get("degree_total"))
        sums = None
        if maj[0] is not None:
            sums = [maj[0] + fig["min"] + sum(e[0] for e in el if e[0] is not None),
                    maj[1] + fig["max"] + sum(e[1] for e in el if e[1] is not None)]
        if held is None and before and not after:
            held = "a passing record would fail"
        if held is None and route == "college set step" and sums and total[0] is not None \
                and sums[0] > total[1] and sums[1] > total[1]:
            held = ("overlap: the major plus the printed %g runs past the degree total of %g; a set step checks no "
                    "standing while #3250 is unmerged, so the record stays as main files it (Grossmont 46141, #3252)"
                    % (fig["min"], total[0]))
        row = {"control_number": f["control_number"], "title": f.get("title"), "award": f.get("award"),
               "ge_units_before": prog.get("ge_units"),
               "ge_units_after": prog.get("ge_units") if (held or not fills) else dict(fig),
               "passes_before": before, "passes_after": after if (fills and not held) else before,
               "verdict_with_fill": what, "sum_with_fill": sums,
               "degree_total": total[0]}
        if held:
            row["held"] = held
        rows.append(row)
    apply_ = [r["control_number"] for r in rows if "held" not in r]
    held = [r["control_number"] for r in rows if "held" in r]
    return {"college": college, "route": route,
            "step": own[0] if own else R.calgetc_step(conf),
            "measured_on": {"commit": commit, "date": date,
                            "records": "kb/program_requirements_college/<slug>/records/",
                            "tool": "python3 kb/_program_requirements_readings_measure.py --calgetc-apply '%s'" % college,
                            "kind": "a dry run on the filed records; the reconcile run reads the pages"},
            "counts": {"rows": len(rows), "apply": len(apply_), "held": len(held),
                       "fail_to_pass": sum(1 for r in rows if "held" not in r and r["passes_after"]
                                           and not r["passes_before"]),
                       "pass_to_fail": sum(1 for r in rows if r["passes_before"] and not r["passes_after"])},
            "apply": apply_, "held": held,
            "restore_before_reread": held if route == "college set step" else [],
            "rows": rows}


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--json", action="store_true", help="print the measure as JSON, every key named")
    ap.add_argument("--calgetc-plan", action="store_true",
                    help="write the statewide Cal-GETC 34 plan (%s), a one-time measure, and print its counts"
                         % os.path.relpath(CAL_GETC_PLAN, HERE))
    ap.add_argument("--calgetc-apply", metavar="COLLEGE",
                    help="write one college's Cal-GETC apply plan (kb/program_requirements_college/<slug>/"
                         "calgetc_apply_plan.json), a dry run on its filed records, and print its rows")
    args = ap.parse_args(argv)
    records = list(filed_records())
    if args.calgetc_apply:
        plan = calgetc_apply_plan(records, args.calgetc_apply, *_git_head())
        with open(calgetc_apply_plan_path(args.calgetc_apply), "w") as fh:
            fh.write(json.dumps(plan, indent=1) + "\n")
        print(json.dumps(plan["counts"]))
        for r in plan["rows"]:
            print("%s %-36s ge %s -> %s  passes %s -> %s%s" % (
                r["control_number"], (r["title"] or "")[:36], _span_words(r["ge_units_before"]),
                _span_words(r["ge_units_after"]), r["passes_before"], r["passes_after"],
                ("  HELD: " + r["held"][:80]) if r.get("held") else ""))
        return 0
    if args.calgetc_plan:
        plan = cal_getc_34_plan(records, *_git_head())
        with open(CAL_GETC_PLAN, "w") as fh:
            fh.write(json.dumps(plan, indent=1) + "\n")
        print(json.dumps(plan["counts"]))
        return 0
    steps = R.load_steps()
    hours = measure_hours(records, steps)
    elec = measure_electives(records, steps)
    ge = measure_ge(records, steps)
    cal = statewide_cal_getc(records)
    if args.json:
        print(json.dumps({"records": len(records), "hours": hours, "electives": elec, "ge_steps": ge,
                          "statewide_cal_getc_unruled": cal}, indent=1, default=list))
        return 0
    tab = [f for f in records if S.counts_passing_on_tab(flat_checks(f["score"]))]
    print("filed records read: %d; passing on the tab (counts_passing_on_tab): %d; by passes_live: %d" % (
        len(records), len(tab), sum(1 for f in records if S.passes_live(f["score"]))))
    print("   passing on the tab while the scorer's own unstated test fails: %d" % sum(
        1 for f in tab if f["score"]["arithmetic"].get("status") == "unstated"
        and f["score"]["arithmetic"].get("pass") is False))
    print("\n1. hours_total_only's second reading (total_hours_printed)")
    print("   reach records that already pass (must be 0): %d" % len(hours["reach_passing"]))
    for shape, v in sorted(hours["shapes"].items(), key=lambda x: -len(x[1])):
        print("   %4d  %s  e.g. %s" % (len(v), shape, ", ".join("%s %s" % x for x in v[:3])))
    print("   the reach, by how each reading quoted its total line:")
    for q, by in sorted(hours["reach"].items(), key=lambda x: -sum(map(len, x[1].values()))):
        print("   %4d  %s" % (sum(map(len, by.values())), q))
        for c, keys in sorted(by.items(), key=lambda x: -len(x[1])):
            print("            %-44s %3d  %s" % (c, len(keys), ", ".join(keys[:3])))
    print("   gated colleges (the procedure names the reading): %s" % ", ".join(hours["gated"]))
    for c, keys in sorted(hours["expected"].items()):
        print("   expected to move: %-36s %3d  %s" % (c, len(keys), ", ".join(keys[:4])))
    print("\n2. the electives guard (electives_named)")
    print("   filed records already carrying electives_fill_words (must be 0): %d" % len(elec["carrying"]))
    for c, v in sorted(elec["by_college"].items(), key=lambda x: -len(x[1])):
        print("   %-28s fail on the guard %3d; pass once answered %3d (live %3d); a step %s%s; notes quote it %d;"
              " heading not printed %d; expected to move %d"
              % (c, len(v), sum(r["arith_passes"] for r in v), sum(r["passes_live"] for r in v),
                 "yes" if any(r["step"] for r in v) else "no",
                 " (from the heading)" if any(r["heading_scoped"] for r in v) else "",
                 sum(r["notes_quote_step"] for r in v), sum(r["heading_not_printed"] for r in v),
                 sum(r["expected"] for r in v)))
    print("\n3. the general education steps, as if each pattern matched")
    for name, rows in ge.items():
        print("   " + name)
        for move, v in sorted(rows.items()):
            print("      %-18s %3d  %s" % (move, len(v), ", ".join("%s %s" % x for x in v[:4])))
    print("\n   unruled: a statewide Cal-GETC 34 on transfer degrees naming Cal-GETC with no units")
    for k, v in sorted(cal.items()):
        print("      %-12s %3d  %s" % (k, len(v), ", ".join("%s %s" % x for x in v[:3])))
    return 0


if __name__ == "__main__":
    sys.exit(main())
