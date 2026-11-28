#!/usr/bin/env python3
"""S748 (lane 1, keys): Lassen's reconcile step that gives a local degree naming Cal-GETC the catalog's own 34.

WHY. The census of 2026-11-28 00:44Z lists Lassen degrees under units_incomplete with the sub-cause
ge_pattern_no_units (lever ge_units_steps). The college's entry (kb/program_requirements_reconcile.json, 'Lassen
College') already holds the catalog's own figure, 'Cal-GETC General Education Certificate of Achievement requires 34
Units.' (PDF p.72, college-page-read run 43570566375), as a set step for transfer degrees alone (S651). The
University Studies A.A. degrees are local degrees that name the same pattern, print no figure for it, name the 60
and say electives fill the rest, so they read incomplete. One more step of the same kind, the same figure from the
same page, reads local degrees: no code changed, no new kind.

Pinned here:
  * the step as written: kind set, ge_units 34, awards local, the earlier step's pattern, source and guards
    (only_with the pattern, the degree total and the major's units), and no hold of its own; the transfer step and
    its three held records are as S651 left them;
  * the step on a record: a University Studies degree as filed takes 34 and then passes today's scorer, with its
    major, the 34 and electives to the 60; a record that holds units for its pattern keeps them; a record naming no
    pattern, no degree total or no major units takes nothing; a page that never names Cal-GETC gives nothing; a
    certificate takes nothing;
  * the self-recall over every committed record of the college, each offered a page naming Cal-GETC (the most the
    step could be offered): it reaches five records, the University Studies degrees 18752, 18754, 18756, 18758 and
    18848, each naming Cal-GETC alone; each turns passing; no passing record turns failing; and the transfer
    degrees reconcile exactly as before (35106 and 41912 keep their hold).

A test of the step on the committed records. The free reconcile that reads the live pages is the runner's. Either
state of the five records is accepted: as filed today, or as that reconcile files them.

Run from repo root: python3 tests/program_reconcile_s748_lassen_test.py
"""
import copy
import glob
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_piles_s714_ccsf as C  # noqa: E402
import _program_requirements_reconcile as R  # noqa: E402
import _program_requirements_score as S  # noqa: E402

LASSEN = "Lassen College"
FOLDER = os.path.join(ROOT, "kb", "program_requirements_college", "lassen", "records")
STEPS = R.load_steps()
CONF = STEPS[LASSEN]
FIVE = ["18752", "18754", "18756", "18758", "18848"]
PAGE = "University Studies\nComplete the Cal-GETC pattern\nelectives to total 60 units\n"
checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)
        print("FAIL: " + msg)


def load(cn):
    with open(os.path.join(FOLDER, cn + ".json"), encoding="utf-8") as fh:
        return json.load(fh)


def as_read(f):
    """One of the five as the reading left it: the 34 a reconcile gave its pattern taken off again."""
    g = copy.deepcopy(f)
    if g["control_number"] in FIVE and (g["record"]["program"].get("ge_units") or {}).get("min") == 34:
        g["record"]["program"]["ge_units"] = {"min": None, "max": None}
    return g


def recon(f, text=PAGE, steps=None, award=None):
    return R.reconcile(f["record"], text, LASSEN, f.get("award") if award is None else award, steps=steps,
                       control_number=f["control_number"], closed=C.closed_list(LASSEN, f["control_number"]),
                       title=f.get("title"))


def view(f, record):
    sc = S.score(record, C.closed_list(LASSEN, f["control_number"]), None, f.get("award"), R.prefix_aliases(LASSEN),
                 R.packed_codes(LASSEN))
    return {"pass": bool(S.passes_live(sc)), "coverage": sc["coverage"]["pass"], "invented": sc["invented"]["pass"],
            "arithmetic": sc["arithmetic"].get("status")}


# ── the step as written ───────────────────────────────────────────────────
sets = [st for st in CONF["steps"] if st.get("kind") == "set" and st.get("field") == "ge_units"]
check([st.get("awards") for st in sets] == ["transfer", "local"], "two set steps for the pattern's units: transfer "
                                                                 "degrees, then local ones")
old_step, new_step = (sets + [{}, {}])[:2]
same = ("kind", "field", "value", "only_with", "pattern", "source", "source_words")
check(all(new_step.get(k) == old_step.get(k) for k in same) and new_step.get("value") == {"min": 34, "max": 34},
      "the local step carries the transfer step's figure, pattern, source and guards")
check(sorted(old_step.get("hold") or {}) == ["31297", "35106", "41912"] and "hold" not in new_step,
      "the transfer step keeps its three held records; the local step holds none")
check(new_step.get("only_cal_getc") is True and "only_cal_getc" not in old_step,
      "the local step asks for a record whose pattern is Cal-GETC alone (only_cal_getc)")
check(not [name for name, c in STEPS.items() if name != LASSEN and isinstance(c, dict)
           for st in c.get("steps") or [] if "only_cal_getc" in st], "no other college's step carries only_cal_getc")
check("43570566375" in (CONF.get("why") or "") and "43570566375" in (new_step.get("why") or ""),
      "the entry and the step cite the page read that printed the figure")

# ── the step on a record ──────────────────────────────────────────────────
f = as_read(load("18754"))
prog = f["record"]["program"]
check(R.awards_match("local", f["award"]) and R.CAL_GETC_ONLY.match(prog.get("ge_pattern") or "")
      and (prog.get("ge_units") or {}).get("min") is None and prog.get("electives_fill_degree") is True
      and (prog.get("degree_total") or {}).get("min") == 60,
      "18754 as read: a local degree naming Cal-GETC alone, no units for it, the 60, and electives that fill it")
before = view(f, f["record"])
out, notes = recon(f)
check([n.get("field") for n in notes if n.get("field") == "ge_units"] == ["ge_units"]
      and out["program"]["ge_units"] == {"min": 34, "max": 34}
      and "requires 34 Units" in [n for n in notes if n.get("field") == "ge_units"][0]["words"],
      "the step gives it 34, under the catalog's own words")
after = view(f, out)
check(before["pass"] is False and before["arithmetic"] == "incomplete" and after["pass"] is True
      and after["coverage"] and after["invented"], "it read incomplete and then passes (%r, %r)" % (before, after))
kept = copy.deepcopy(f)
kept["record"]["program"]["ge_units"] = {"min": 21, "max": 21}
check(recon(kept)[0]["program"]["ge_units"] == {"min": 21, "max": 21}, "a record that holds units for its pattern keeps them")
for field, empty in (("ge_pattern", None), ("degree_total", {"min": None, "max": None}),
                     ("total_units", {"min": None, "max": None})):
    g = copy.deepcopy(f)
    g["record"]["program"][field] = empty
    check((recon(g)[0]["program"].get("ge_units") or {}).get("min") is None, "a record with no %s takes nothing" % field)
check((recon(f, text="University Studies\nelectives to total 60 units\n")[0]["program"].get("ge_units") or {}).get("min")
      is None, "a page that never names Cal-GETC gives nothing")
# Which pattern the record names (the second reader's finding): only_with asks that one is named, never which.
loose = copy.deepcopy(STEPS)
for st in loose[LASSEN]["steps"]:
    st.pop("only_cal_getc", None)
for other in ("Local GE", "General Education Requirements", "Local General Education Pattern or Cal-GETC",
              "Lassen College General Education or Cal-GETC", "CSU GE Breadth or IGETC"):
    g = copy.deepcopy(f)
    g["record"]["program"]["ge_pattern"] = other
    check((recon(g)[0]["program"].get("ge_units") or {}).get("min") is None,
          "a local degree naming %r takes nothing, though its page prints Cal-GETC" % other)
    check((recon(g, steps=loose)[0]["program"].get("ge_units") or {}).get("min") == 34,
          "without only_cal_getc the same record would take 34 (%r): the guard carries the weight" % other)
for alone in ("Cal-GETC", "CalGETC", "California General Education Transfer Curriculum (Cal-GETC)"):
    g = copy.deepcopy(f)
    g["record"]["program"]["ge_pattern"] = alone
    check((recon(g)[0]["program"].get("ge_units") or {}).get("min") == 34, "a local degree naming %r takes 34" % alone)
check((recon(f, award="Certificate of Achievement requiring 16S/24Q to fewer than 30S/45Q units")[0]["program"]
       .get("ge_units") or {}).get("min") is None, "a certificate takes nothing")

# ── the self-recall ───────────────────────────────────────────────────────
old = copy.deepcopy(STEPS)
old[LASSEN]["steps"] = [st for st in old[LASSEN]["steps"] if st is not None and st.get("awards") != "local"
                        or st.get("field") != "ge_units"]
records, reached, moved, not_alone = 0, [], {}, []
for path in sorted(glob.glob(os.path.join(FOLDER, "*.json"))):
    with open(path, encoding="utf-8") as fh:
        f = json.load(fh)
    if not isinstance(f.get("record"), dict):
        continue
    f = as_read(f)
    records += 1
    a_out, _ = recon(f, steps=old)
    b_out, _ = recon(f)
    if a_out != b_out:
        reached.append(f["control_number"])
        if not R.CAL_GETC_ONLY.match((f["record"]["program"].get("ge_pattern") or "")) \
                or not R.awards_match("local", f.get("award")):
            not_alone.append(f["control_number"])
        a, b = view(f, a_out), view(f, b_out)
        if a != b:
            moved[f["control_number"]] = (a, b)
check(records >= 60, "the college's committed records are read (%d)" % records)
check(reached == FIVE, "the step reaches the five University Studies degrees and no other record (%r)" % reached)
check(not not_alone, "each is a local degree naming Cal-GETC alone (%r)" % not_alone)
check(sorted(moved) == FIVE and all(not a["pass"] and b["pass"] for a, b in moved.values()),
      "each of the five turns passing (%r)" % {k: (a["arithmetic"], b["arithmetic"]) for k, (a, b) in moved.items()})
check(not [cn for cn, (a, b) in moved.items() if a["pass"] and not b["pass"]], "no passing record turns failing")
for cn in ("35106", "41912"):
    g = load(cn)
    check((recon(g)[0]["program"].get("ge_units") or {}).get("min") is None, "%s keeps its hold" % cn)

print("self-recall: %d records, reached %d, fail to pass %d, pass to fail %d"
      % (records, len(reached), len([1 for a, b in moved.values() if not a["pass"] and b["pass"]]),
         len([1 for a, b in moved.values() if a["pass"] and not b["pass"]])))
print("%d checks, %d failures" % (checks[0], len(failures)))
sys.exit(1 if failures else 0)
