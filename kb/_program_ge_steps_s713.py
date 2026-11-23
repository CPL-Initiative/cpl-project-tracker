#!/usr/bin/env python3
"""S713: three general education reconcile steps, measured on every committed record at their colleges.

The conductor's d-ge-steps-three-colleges-s713: #3678's second reader held 21 records that print a general education
figure (d-ge-gap-only-where-no-figure-s703; kb/_program_named_gaps.py HELD_GE_FIGURE). Ten sit at lane 1's colleges
and are left alone. Of the other eleven, the conductor ruled three steps in kb/program_requirements_reconcile.json:

  Las Positas      the two LPC-GE steps read "Additional General Education and Elective(s)( Units)": run 42892238131
                   set the overlap and electives flags on 09214, 09227, 36235 and 38886 and never the units.
  Antelope Valley  "Completion of General Education requirements, plus electives as needed to reach 60 units" N: the
                   printed N is the general education units, with electives, of a local degree.
  College of Marin College of Marin GE (minimum 22 units) or Cal-GETC (minimum 34 units): the units 22 to 34.

Held for a person: Antelope Valley 43028 (CSU GE and IGETC figures on a Cal-GETC degree) and De Anza 45499 (a
180-unit bachelor's degree).

THE COMMITTED FILES HOLD NO PAGE TEXT. A step reads the page on the runner (the reconcile job of
program-requirements-college.yml, free of model calls). Here, before the run, each step is measured on what the files
hold, at every committed record of its college:

  * the claim check: the reader's note quotes the step's words (PHRASE) and, for a figure the step reads from the page,
    the figure beside them; the step's own pattern is run on a line built from that quote, so its mechanics (pattern,
    awards, only_with) are the reconcile module's own (kb/_program_requirements_reconcile.py, reconcile);
  * the prediction: the scorer's degree check (kb/_program_requirements_score.py, degree_check) on the record's filed
    sum with the step's units, against the degree total;
  * boundary readings: the figure that makes the sum meet the total, one unit more and one unit less;
  * the precision count: the prediction against the hand reading of the step's target records (TARGETS), and every
    other record the step would move, listed.
The run's filed records are then read against the prediction (--after): right where the run's verdict is the one
predicted.

    python3 kb/_program_ge_steps_s713.py            # the measure before the run
    python3 kb/_program_ge_steps_s713.py --json OUT # the same, written to OUT

Guard: tests/program_ge_steps_s713_test.py.
"""
from __future__ import annotations

import argparse
import copy
import glob
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_requirements_reconcile as R  # noqa: E402
import _program_requirements_score as S  # noqa: E402

COLLEGE_DIR = os.path.join(HERE, "program_requirements_college")
COLLEGES = {"Las Positas College": "las_positas", "Antelope Valley College": "antelope_valley",
            "College of Marin": "college_of_marin"}
# The hand reading (S713): each target record and whether its degree adds up once the step gives its units.
TARGETS = {
    "Las Positas College": {"09214": True, "09227": False, "36235": True, "38886": True},
    "Antelope Valley College": {"36852": True, "39295": False, "40870": True},
    "College of Marin": {"19789": False, "19791": False},
}
HELD_FOR_PERSON = {("Antelope Valley College", "43028"): "CSU GE and IGETC figures on a Cal-GETC degree",
                   ("De Anza College", "45499"): "a 180-unit bachelor's degree"}
# The words a reader's note quotes for each step, and where a figure sits beside them.
PHRASE = {
    "Las Positas College": re.compile(r"Additional\s+General\s+Education\s+and\s+Electives?(?:\s+Units)?", re.I),
    "Antelope Valley College": re.compile(r"Completion\s+of\s+General\s+Education\s+requirements,?\s+plus\s+electives",
                                          re.I),
    "College of Marin": re.compile(r"College\s+of\s+Marin\s+GE\s*\(minimum\s+22\s+units\)[^.;]{0,40}?Cal-?GETC\s*"
                                   r"\(minimum\s+34\s+units\)", re.I),
}
FIGURE_NEAR = re.compile(r"(?:prints?\s+'?|\.\s+)(\d{1,2}(?:\.\d+)?)(?:\s*-\s*(\d{1,2}(?:\.\d+)?))?(?:'|\s+units|\s+for)",
                         re.I)


def _records(college: str) -> list[tuple[str, dict]]:
    out = []
    for p in sorted(glob.glob(os.path.join(COLLEGE_DIR, COLLEGES[college], "records", "*.json"))):
        with open(p, encoding="utf-8") as fh:
            f = json.load(fh)
        if isinstance(f.get("score"), dict):
            out.append((p, f))
    return out


def quoted(filed: dict, college: str) -> tuple[str | None, tuple[float, float] | None]:
    """The reader's sentence quoting the step's words, and the figure it gives beside them (or None)."""
    for n in (filed.get("record") or {}).get("notes") or []:
        if PHRASE[college].search(str(n)):
            m = FIGURE_NEAR.search(str(n))
            fig = None
            if m:
                lo = float(m.group(1))
                fig = (lo, float(m.group(2)) if m.group(2) else lo)
            return str(n), fig
    return None, None


def page_line(college: str, fig: tuple[float, float] | None) -> str | None:
    """A line in the page's words as the note quotes them, for the step's own pattern to read."""
    if college == "Las Positas College":
        return "Additional General Education and Electives %s" % (S._fig(*fig) if fig else "")
    if college == "Antelope Valley College":
        if not fig:
            return None
        f = ("%g" % fig[0]) if fig[0] == fig[1] else ("%g-%g" % fig)
        return "Completion of General Education requirements, plus electives as needed to reach 60 units. %s units" % f
    return "College of Marin GE (minimum 22 units) or Cal-GETC (minimum 34 units)"


def stepped(filed: dict, college: str, text: str) -> tuple[dict, list]:
    """The record after the college's own steps on the line (the reconcile module's code)."""
    return R._college_steps(filed["record"], text, college, filed.get("award"))[:2]


def degree_verdict(filed: dict, prog: dict) -> dict | None:
    """The scorer's degree check on the filed sum with the program as the step leaves it."""
    a = (filed.get("score") or {}).get("arithmetic") or {}
    degree = S._span(prog.get("degree_total"))
    comp = a.get("computed")
    if not degree or not comp or a.get("against") != "degree":
        return None
    return S.degree_check(prog, degree, float(comp[0]), float(comp[1]), [], None, filed.get("award"))


def measure_college(college: str) -> dict:
    out = {"records": 0, "quote": 0, "step_fires": 0, "would_pass": [], "would_fail": [], "fires_not_quoted": [],
           "claim": {"stands": 0, "no_figure": 0}, "boundaries": {"right": 0, "wrong": 0, "wrong_keys": []},
           "precision": {"right": 0, "wrong": 0, "wrong_keys": []}, "targets_quoted": []}
    for path, f in _records(college):
        out["records"] += 1
        sc = f["score"]
        a = sc.get("arithmetic") or {}
        if a.get("pass"):
            continue
        note, fig = quoted(f, college)
        if note:
            out["quote"] += 1
            out["claim"]["stands" if (fig or college != "Antelope Valley College") else "no_figure"] += 1
        line = page_line(college, fig) if note else None
        if not line:
            continue
        new, notes = stepped(f, college, line)
        if not any(n["field"] == "ge_units" for n in notes):
            continue
        out["step_fires"] += 1
        cn = str(f["control_number"])
        v = degree_verdict(f, new.get("program") or {})
        ok = bool(v and v.get("pass")) and S.passes_live(dict(sc, arithmetic={"status": "equal"}))
        (out["would_pass"] if ok else out["would_fail"]).append(cn)
        if cn in TARGETS[college]:
            out["targets_quoted"].append(cn)
            right = ok == TARGETS[college][cn]
            out["precision"]["right" if right else "wrong"] += 1
            if not right:
                out["precision"]["wrong_keys"].append(cn)
        # Boundary readings on the record's own sum: the units that meet the total exactly pass; with the electives
        # filling the total, one unit less passes too and one unit more fails; without them, both fail.
        prog = copy.deepcopy(new.get("program") or {})
        comp = a.get("computed")
        degree = S._span(prog.get("degree_total"))
        if comp and degree and comp[0] == comp[1]:
            exact = degree[0] - float(comp[0])
            fill = bool(prog.get("electives_fill_degree"))
            overlap = bool(prog.get("ge_overlap"))
            for d, want in ((0, True), (1, overlap), (-1, fill)):
                p2 = dict(prog, ge_units={"min": exact + d, "max": exact + d})
                v2 = degree_verdict(f, p2)
                got = bool(v2 and v2.get("pass"))
                out["boundaries"]["right" if got == want else "wrong"] += 1
                if got != want:
                    out["boundaries"]["wrong_keys"].append([cn, d, got])
    for cn in TARGETS[college]:
        if cn not in out["targets_quoted"]:
            out["precision"]["wrong"] += 1
            out["precision"]["wrong_keys"].append(cn + " (no quote)")
    out["moves_beyond_targets"] = sorted(set(out["would_pass"] + out["would_fail"]) - set(TARGETS[college]))
    return out


def measure() -> dict:
    return {c: measure_college(c) for c in COLLEGES}


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--json")
    a = ap.parse_args(argv)
    m = measure()
    for c, r in m.items():
        print("%s: %d records; %d quote the step's words, the step fires on %d; would pass %s, would fail %s; "
              "beyond the targets %s; precision right %d wrong %d %s; boundaries right %d wrong %d" % (
                  c, r["records"], r["quote"], r["step_fires"], r["would_pass"], r["would_fail"],
                  r["moves_beyond_targets"], r["precision"]["right"], r["precision"]["wrong"],
                  r["precision"]["wrong_keys"], r["boundaries"]["right"], r["boundaries"]["wrong"]))
    if a.json:
        with open(a.json, "w", encoding="utf-8") as fh:
            json.dump({"measured": m, "held_for_person": [list(k) + [v] for k, v in HELD_FOR_PERSON.items()]}, fh,
                      ensure_ascii=False, indent=1)
            fh.write("\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
