#!/usr/bin/env python3
"""S748 (lane 1, keys): Cosumnes River's set step for a local degree that names the local CRC General Education
Requirement alone.

WHY. The census of 2026-11-28 00:44Z lists nine local Cosumnes River degrees under units_incomplete with the sub-cause
ge_pattern_no_units. Each prints its major's total and a sentence of the same shape, 'the required program, plus
the local CRC General Education Requirement, plus sufficient electives to meet a 60-unit total', and no figure for
the pattern, so each reads incomplete against its 60. The catalog prints the local pattern on its own pages, a minimum
for each of seven areas and no total: six units in L1 and three in each of L2 to L7, 24 in all, with L7 waived for
a major of 45 or more units (the hand-filed 2026-27 catalog, PDF pp.84-86, college page read 46123853753, kb/college_reads/s748_keys_cosumnes_local_ge_4.json).
One set step of the existing kind gives the sum of those minimums to a local degree whose page prints the local
requirement's own words; no code changed. The figure is a sum the catalog does not print as one number, which the
step's why says for its second reader.

Four of the nine name the local requirement alone. Three are the step's (04600, 12792, 45317); the fourth, 30576,
whose major's 60 units waive L7, is held by name and stays as filed. The other five
name 'the Local General Education Pattern or California General Education Transfer Curriculum (Cal-GETC)': a
degree that takes either pattern takes the local figure or Cal-GETC's 34, and today's scorer fails that range
against the 60 though electives fill it, so no step of an existing kind passes them truthfully. They are left as
filed and named in the step's why.

Pinned here:
  * the step as written: kind set, ge_units at the catalog's figure, awards local, only_with the pattern, the
    degree total and the major's units, a pattern of the local requirement's own words, and source words quoting
    the catalog's page and its read;
  * the step on a record: 04600 as filed takes the figure on its own sentence and then passes today's scorer; a
    page printing the either-pattern sentence gives nothing; a transfer degree and a certificate take nothing; a
    record that holds units for its pattern keeps them;
  * the self-recall over every committed record of the college, each offered the page its own pattern would print:
    the step reaches the three, each turns passing, 30576 and the five either-pattern degrees stay as filed, and no
    passing record turns failing.

Either state of the three is accepted: as filed today, or as the free reconcile files them.

Run from repo root: python3 tests/program_reconcile_s748_cosumnes_test.py
"""
import copy
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_piles_s714_ccsf as C  # noqa: E402
import _program_requirements_reconcile as R  # noqa: E402
import _program_requirements_score as S  # noqa: E402

CRC = "Cosumnes River College"
FOLDER = os.path.join(ROOT, "kb", "program_requirements_college", "cosumnes_river", "records")
STEPS = R.load_steps()
CONF = STEPS[CRC]
FIGURE = 24
RUN = "46123853753"
FOUR = ["04600", "12792", "45317"]
HELD = "30576"
EITHER = ["04593", "07290", "12790", "20367", "35175"]
LOCAL_LINE = ("may be obtained by completion of the required program, plus the local CRC General Education "
              "Requirement, plus sufficient electives to meet a 60-unit total.")
EITHER_LINE = ("the required program, plus the Local General Education Pattern or California General Education "
               "Transfer Curriculum (Cal-GETC), plus sufficient electives for a total of at least 60 units.")
checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)
        print("FAIL: " + msg)


def load(cn):
    with open(os.path.join(FOLDER, cn + ".json"), encoding="utf-8") as fh:
        return json.load(fh)


def ge(record):
    return (record["program"].get("ge_units") or {}).get("min")


def as_read(f):
    """One of the four as the reading left it: the figure a reconcile gave its pattern taken off again."""
    g = copy.deepcopy(f)
    if g["control_number"] in FOUR and ge(g["record"]) == FIGURE:
        g["record"]["program"]["ge_units"] = {"min": None, "max": None}
    return g


def page_of(f):
    """The sentence a record's own pattern would print: the local requirement's, or the either-pattern one."""
    p = (f["record"].get("program") or {}).get("ge_pattern") or ""
    if re.search(r"local\s+CRC\s+General\s+Education", p, re.I):
        return LOCAL_LINE + "\n"
    if re.search(r"Local\s+General\s+Education\s+Pattern\s+or", p, re.I):
        return EITHER_LINE + "\n"
    return "Degree Requirements\n%s\n" % p


def recon(f, text=None, steps=None, award=None):
    return R.reconcile(f["record"], page_of(f) if text is None else text, CRC,
                       f.get("award") if award is None else award, steps=steps, control_number=f["control_number"],
                       closed=C.closed_list(CRC, f["control_number"]), title=f.get("title"))


def view(f, record):
    sc = S.score(record, C.closed_list(CRC, f["control_number"]), None, f.get("award"), R.prefix_aliases(CRC),
                 R.packed_codes(CRC))
    return {"pass": bool(S.passes_live(sc)), "coverage": sc["coverage"]["pass"], "invented": sc["invented"]["pass"],
            "arithmetic": sc["arithmetic"].get("status")}


# ── the step as written ───────────────────────────────────────────────────
sets = [st for st in CONF["steps"] if st.get("kind") == "set" and st.get("field") == "ge_units"]
check(len(sets) == 1 and len(CONF["steps"]) == 1, "the entry carries one step, a set of the pattern's units")
step = (sets + [{}])[0]
check(step.get("value") == {"min": FIGURE, "max": FIGURE} and step.get("awards") == "local"
      and step.get("only_with") == ["ge_pattern", "degree_total", "total_units"],
      "the catalog's figure, for a local degree that names its pattern, its degree total and its major's units")
rx = re.compile(step.get("pattern") or r"(?!)")
check(bool(rx.search(LOCAL_LINE)) and not rx.search(EITHER_LINE) and not rx.search("General Education (Cal-GETC)")
      and not rx.search("Local General Education Pattern"),
      "the pattern reads the local requirement's own words and never the either-pattern sentence")
check(RUN in step.get("source_words", "") and str(FIGURE) in step.get("source_words", "")
      and all(cn in step.get("why", "") for cn in FOUR + [HELD] + EITHER)
      and step.get("source_words", "").count("minimum of three semester units") >= 2
      and "minimum of six semester units" in step.get("source_words", "") and "no total" in step.get("source_words", "")
      and "45 or more units" in step.get("source_words", ""),
      "the source words quote the areas' minimums, the waiver and the read, and the why names every degree")
check(sorted(step.get("hold") or {}) == [HELD], "30576 is held by name, the one degree whose major waives L7")
check(6 + 3 * 6 == FIGURE, "the figure is the sum of the seven area minimums the page prints")
check("statewide_cal_getc" in CONF and not (CONF["statewide_cal_getc"].get("hold") or {}),
      "the statewide Cal-GETC entry is as it was")

# ── the step on a record ──────────────────────────────────────────────────
f = as_read(load("04600"))
prog = f["record"]["program"]
check(R.awards_match("local", f["award"]) and ge(f["record"]) is None and prog.get("electives_fill_degree") is True
      and (prog.get("degree_total") or {}).get("min") == 60
      and re.search(r"local\s+CRC\s+General\s+Education\s+Requirement", prog.get("ge_pattern") or ""),
      "04600 as read: a local degree naming the local requirement, no units for it, the 60, electives that fill it")
before = view(f, f["record"])
out, notes = recon(f)
check(ge(out) == FIGURE and [n.get("field") for n in notes if n.get("field") == "ge_units"] == ["ge_units"],
      "on its own sentence the step gives it the catalog's figure")
after = view(f, out)
check(before["pass"] is False and before["arithmetic"] == "incomplete" and after["pass"] is True
      and after["coverage"] and after["invented"], "it read incomplete and then passes (%r, %r)" % (before, after))
check(ge(recon(f, text=EITHER_LINE + "\n")[0]) is None, "a page printing the either-pattern sentence gives nothing")
check(ge(recon(f, award="A.S. T Degree")[0]) is None, "a transfer degree takes nothing")
check(ge(recon(f, award="Certificate of Achievement requiring 16S/24Q to fewer than 30S/45Q units")[0]) is None,
      "a certificate takes nothing")
kept = copy.deepcopy(f)
kept["record"]["program"]["ge_units"] = {"min": 34, "max": 34}
check(recon(kept)[0]["program"]["ge_units"] == {"min": 34, "max": 34}, "a record that holds units for its pattern keeps them")

# ── the self-recall ───────────────────────────────────────────────────────
old = copy.deepcopy(STEPS)
old[CRC]["steps"] = []
records, reached, moved = 0, [], {}
for path in sorted(glob.glob(os.path.join(FOLDER, "*.json"))):
    with open(path, encoding="utf-8") as fh:
        g = json.load(fh)
    if not isinstance(g.get("record"), dict):
        continue
    g = as_read(g)
    records += 1
    a_out, _ = recon(g, steps=old)
    b_out, _ = recon(g)
    if a_out != b_out:
        reached.append(g["control_number"])
        a, b = view(g, a_out), view(g, b_out)
        if a != b:
            moved[g["control_number"]] = (a, b)
check(records >= 200, "the college's committed records are read (%d)" % records)
check(reached == FOUR, "the step reaches the three degrees naming the local requirement alone (%r)" % reached)
check(sorted(moved) == FOUR and all(not a["pass"] and b["pass"] for a, b in moved.values()),
      "each of the three turns passing (%r)" % {k: (a["arithmetic"], b["arithmetic"]) for k, (a, b) in moved.items()})
check(not [cn for cn, (a, b) in moved.items() if a["pass"] and not b["pass"]], "no passing record turns failing")
for cn in EITHER:
    g = load(cn)
    check(ge(recon(g)[0]) == ge(g["record"]), "%s, naming either pattern, stays as filed" % cn)
g = load(HELD)
check(ge(recon(g, text=LOCAL_LINE + "\n")[0]) == ge(g["record"]), "30576, held by name, stays as filed")

print("self-recall: %d records, reached %d, fail to pass %d, pass to fail %d"
      % (records, len(reached), len([1 for a, b in moved.values() if not a["pass"] and b["pass"]]),
         len([1 for a, b in moved.values() if a["pass"] and not b["pass"]])))
print("%d checks, %d failures" % (checks[0], len(failures)))
sys.exit(1 if failures else 0)
