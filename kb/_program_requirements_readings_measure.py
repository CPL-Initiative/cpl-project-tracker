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


def measure_hours(records: list[dict]) -> dict:
    shapes, reach = collections.defaultdict(list), collections.defaultdict(lambda: collections.defaultdict(list))
    reach_passing = []
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
            reach[quoted_total(f)][f["college"]].append(f["control_number"])
    return {"shapes": shapes, "reach": reach, "reach_passing": reach_passing}


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


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--json", action="store_true", help="print the measure as JSON, every key named")
    args = ap.parse_args(argv)
    records = list(filed_records())
    steps = R.load_steps()
    hours = measure_hours(records)
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
