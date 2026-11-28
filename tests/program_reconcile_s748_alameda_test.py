#!/usr/bin/env python3
"""S748 (lane 1, keys): College of Alameda's set step for Cal-GETC's 34 reads the units line under both its wordings.

WHY. The census of 2026-11-28 00:44Z lists Art History A.A.-T 32765 under units_incomplete with the sub-cause
ge_pattern_no_units (lever ge_units_steps). The college's entry (kb/program_requirements_reconcile.json, 'College
of Alameda') sets the 34 on a transfer degree whose page prints 'General Education (Cal-GETC) and Elective Units'
(S619, Sociology 33032's wording). Art History's entry prints the same line with one other word, 'General
Education (Cal-GETC) and Elective Courses' over '42.00' (college page read 46121438840,
kb/college_reads/s748_keys_alameda_32765.json; the record's own note quotes it), so the step never reached it and it read incomplete against its
60. The step's pattern takes either word. No code changed, no new kind, no new step.

Pinned here:
  * the step as written: one set step for transfer degrees, 34, whose pattern reads 'Elective Units' and 'Elective
    Courses' after 'General Education (Cal-GETC) and', and whose source words quote both lines and both reads;
  * the pattern on the catalog's lines: both transfer wordings match; a local degree's 'General Education and
    Electives 42.00' and 'G.E. (Cal-GETC) and elective units 35.00' do not;
  * 32765: a transfer degree naming Cal-GETC with no units, whose note quotes the line; on its lines it takes 34 and
    today's scorer passes it, the major's 18, the 34 and transferable electives to the 60;
  * the wrong joins refused: a local degree on the same lines (01129, 01132); a page without the line; a record
    that holds units for its pattern;
  * the self-recall over every committed record of the college, each offered a page printing both wordings (the
    most the step could be offered), against the entry as main holds it: the wider pattern reaches 32765 alone,
    which turns passing; no passing record turns failing.

A test of the step on the committed records and the quoted lines. The free reconcile that reads the live pages is the
runner's. Either state of 32765 is accepted: as filed today, or as that reconcile files it.

Run from repo root: python3 tests/program_reconcile_s748_alameda_test.py
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

COA, CN = "College of Alameda", "32765"
FOLDER = os.path.join(ROOT, "kb", "program_requirements_college", "college_of_alameda", "records")
STEPS = R.load_steps()
CONF = STEPS[COA]
OLD_PATTERN = r"General\s+Education\s+\(Cal-?GETC\)\s+and\s+Elective\s+Units"
UNITS_LINE = "General Education (Cal-GETC) and Elective Units 41.00- 42.00"       # Sociology 33032, read 42609117444
COURSES_LINE = "General Education (Cal-GETC) and Elective Courses"                # Art History 32765, read 46121438840
# The end of 32765's entry as read 46121438840 printed the capture's text, line for line.
PAGE = ("Total units required for major: 18\n18.00\n%s\n42.00\nTotal Units Required for Degree\n60.00\n"
        % COURSES_LINE)
WORST = "Requirements\n%s\n%s\n42.00\nTotal Units 60.00\n" % (UNITS_LINE, COURSES_LINE)
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
    """32765 as the reading left it: the 34 a reconcile gave its pattern taken off again."""
    g = copy.deepcopy(f)
    if g["control_number"] == CN and (g["record"]["program"].get("ge_units") or {}).get("min") == 34:
        g["record"]["program"]["ge_units"] = {"min": None, "max": None}
    return g


def recon(f, text=PAGE, steps=None):
    return R.reconcile(f["record"], text, COA, f.get("award"), steps=steps, control_number=f["control_number"],
                       closed=C.closed_list(COA, f["control_number"]), title=f.get("title"))


def view(f, record):
    sc = S.score(record, C.closed_list(COA, f["control_number"]), None, f.get("award"), R.prefix_aliases(COA),
                 R.packed_codes(COA))
    return {"pass": bool(S.passes_live(sc)), "coverage": sc["coverage"]["pass"], "invented": sc["invented"]["pass"],
            "arithmetic": sc["arithmetic"].get("status")}


def ge(record):
    return (record["program"].get("ge_units") or {}).get("min")


# ── the step as written ───────────────────────────────────────────────────
sets = [st for st in CONF["steps"] if st.get("kind") == "set" and st.get("field") == "ge_units"]
check(len(sets) == 1 and sets[0].get("awards") == "transfer" and sets[0].get("value") == {"min": 34, "max": 34},
      "one set step for the pattern's units: transfer degrees, 34")
step = (sets + [{}])[0]
rx = re.compile(step.get("pattern") or r"(?!)")
check("Elective Units" in step.get("source_words", "") and "Elective Courses · 42.00" in step.get("source_words", "")
      and "42609117444" in step.get("source_words", "") and "46121438840" in step.get("source_words", ""),
      "the step's source words quote both lines and both page reads")
with open(os.path.join(ROOT, "kb", "college_reads", "s748_keys_alameda_32765.json"), encoding="utf-8") as fh:
    plan = json.load(fh)
check(plan["college"] == COA and [p["url"] for p in plan["pages"]] == [load(CN)["source_url"]],
      "the page read's plan reads the address 32765 was read from")

# ── the pattern on the catalog's lines ────────────────────────────────────
check(bool(rx.search(UNITS_LINE)) and bool(rx.search(COURSES_LINE)), "both transfer wordings match")
check(bool(re.search(OLD_PATTERN, UNITS_LINE)) and not re.search(OLD_PATTERN, COURSES_LINE),
      "the pattern main holds reads the first wording alone")
for line in ("General Education and Electives 42.00", "G.E. (Cal-GETC) and elective units 35.00",
             "General Education (Cal-GETC) and Electives", "Peralta General Education Electives 0.00"):
    check(not rx.search(line), "%r does not match" % line)

# ── 32765 ─────────────────────────────────────────────────────────────────
f = as_read(load(CN))
prog = f["record"]["program"]
check(R.awards_match("transfer", f["award"]) and R.CAL_GETC_ONLY.match(prog.get("ge_pattern") or "")
      and ge(f["record"]) is None and (prog.get("degree_total") or {}).get("min") == 60,
      "32765 as read: a transfer degree naming Cal-GETC alone, no units for it, and the 60")
check(any(COURSES_LINE in n for n in f["record"].get("notes") or []), "its own note quotes the line")
before = view(f, f["record"])
out, notes = recon(f)
check(ge(out) == 34 and [n.get("field") for n in notes if n.get("field") == "ge_units"] == ["ge_units"],
      "on its lines the step gives it 34")
after = view(f, out)
check(before["pass"] is False and before["arithmetic"] == "incomplete" and after["pass"] is True
      and after["coverage"] and after["invented"], "it read incomplete and then passes (%r, %r)" % (before, after))
check(view(load(CN), load(CN)["record"]) in (before, after), "32765 as committed is one of the two states")

# ── the wrong joins refused ───────────────────────────────────────────────
for cn in ("01129", "01132"):
    g = load(cn)
    check(R.awards_match("local", g["award"]) and ge(recon(g, text=WORST)[0]) == ge(g["record"]),
          "%s, a local degree, takes nothing on the same lines" % cn)
check(ge(recon(f, text="Total units required for major: 18\n18.00\nTotal Units Required for Degree\n60.00\n")[0]) is None,
      "a page without the line gives nothing")
kept = copy.deepcopy(f)
kept["record"]["program"]["ge_units"] = {"min": 37, "max": 39}
check(recon(kept)[0]["program"]["ge_units"] == {"min": 37, "max": 39}, "a record that holds units for its pattern keeps them")

# ── the self-recall ───────────────────────────────────────────────────────
old = copy.deepcopy(STEPS)
for st in old[COA]["steps"]:
    if st.get("kind") == "set" and st.get("field") == "ge_units":
        st["pattern"] = OLD_PATTERN
records, reached, moved = 0, [], {}
for path in sorted(glob.glob(os.path.join(FOLDER, "*.json"))):
    with open(path, encoding="utf-8") as fh:
        g = json.load(fh)
    if not isinstance(g.get("record"), dict):
        continue
    g = as_read(g)
    records += 1
    a_out, _ = recon(g, text=PAGE, steps=old)
    b_out, _ = recon(g, text=PAGE)
    w_old, _ = recon(g, text=WORST, steps=old)
    w_new, _ = recon(g, text=WORST)
    if a_out != b_out:
        reached.append(g["control_number"])
        a, b = view(g, a_out), view(g, b_out)
        if a != b:
            moved[g["control_number"]] = (a, b)
    check(w_old == w_new, "%s: on a page printing both wordings the two patterns read alike" % g["control_number"])
check(records >= 55, "the college's committed records are read (%d)" % records)
check(reached == [CN], "on the page printing 'Elective Courses' alone the wider pattern reaches 32765 alone (%r)" % reached)
check(sorted(moved) == [CN] and not moved[CN][0]["pass"] and moved[CN][1]["pass"], "32765 turns passing (%r)" % moved)
check(not [cn for cn, (a, b) in moved.items() if a["pass"] and not b["pass"]], "no passing record turns failing")

print("self-recall: %d records, reached %d, fail to pass %d, pass to fail %d"
      % (records, len(reached), len([1 for a, b in moved.values() if not a["pass"] and b["pass"]]),
         len([1 for a, b in moved.values() if a["pass"] and not b["pass"]])))
print("%d checks, %d failures" % (checks[0], len(failures)))
sys.exit(1 if failures else 0)
