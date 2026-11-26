#!/usr/bin/env python3
"""S740, lane 1 (reads), the cheap pile at Santa Ana: 8 records collected with named gaps, 3 held (kb/_program_piles_s740_santa_ana.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17) and his routine prompt of 2026-11-25: a record held
for a gap is collected with its gap named and a lower score, never held, unless the record is not the program's own;
and a named gap must be true for its record (d-within-range-sums-hold-for-units-kind-s739). The shared checks are
tests/program_piles_s739_common.py's. Pinned here:

  * the 11 keys are the census's 15 less the four the college's first reconcile passed (run 45841675928), which pass
    and are no keys;
  * the live-run reading (B.LiveRuns): load 38909293531 held one run and inserted every key; the three rows the
    reconcile restamped (04256, 31859, 31887) are on their live run by reread 45841675928's receipt;
  * each reading closes the record at its printed total, and the reading next to it does not: 32096 with the movement
    list kept, 08720 with the Mechanical Option one unit off, 21748 with the core at the 14-15 its courses add to,
    31887 with the core at 44, 04256 with either half of its reading alone, 31859 with List A at its courses' 7-7.5;
  * 18780's and 04230's notes quote both figures;
  * the holds: 04238 was read from the entry of English A.A.-T 32436, whose page it shares; 21789's groups add to a
    figure inside its printed range; 32533 closes without its substitution list, and no kind is filed for it.

Run from repo root: python3 tests/program_piles_s740_santa_ana_test.py
"""
import glob
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s739 as B  # noqa: E402
import _program_piles_s740_santa_ana as M  # noqa: E402

W = M.W
S, NG = B.S, B.NG
ROWS = {"32096": "required_list_outside_total", "08720": "pair_read_as_alternatives", "18780": "noted_figures_differ",
        "04230": "noted_figures_differ", "21748": "noted_figures_differ", "31887": "noted_figures_differ",
        "04256": "noted_figures_differ", "31859": "lists_not_closed"}
HELD = {"04238": ["not the program's own", "32436"], "21789": ["24.5-29", "units within-range kind"],
        "32533": ["Substitution Courses", "No kind names a substitute list counted"]}
SCORES = {"required_list_outside_total": 70, "pair_read_as_alternatives": 50, "noted_figures_differ": 40,
          "lists_not_closed": 30}
RESTAMPED = ("04256", "31859", "31887")

t = T.run(W, rows=ROWS, held=HELD, scores=SCORES, day="2026-11-26", boundaries=32, prior_held=set(M.KEYS))
check = t.check

# The keys: the census's 15 less the four the reconcile passed.
check(len(M.KEYS) == 11 and not set(M.KEYS) & set(M.RECONCILED) and len(set(M.KEYS) | set(M.RECONCILED)) == 15,
      "the keys are the census's 15 less the four the reconcile passed")
for cn in M.RECONCILED:
    f = W.load(cn)
    check(S.passes_live(f["score"]) and str(f.get("read_run")) == "38843461766",
          "%s passes since the reconcile, and is no key" % cn)

# The live-run reading.
with open(os.path.join(NG.RECEIPTS, "program_requirement_records_college_santa_ana_38909293531.json"),
          encoding="utf-8") as fh:
    load = json.load(fh)
check(load["extracted_runs"] == ["38843461766"] and set(M.KEYS) <= set(load["inserted_keys"]),
      "load 38909293531 held one run and inserted every key")
rereads = []
for path in glob.glob(os.path.join(NG.RECEIPTS, "program_requirement_records_college_reread_santa_ana_*.json")):
    with open(path, encoding="utf-8") as fh:
        d = json.load(fh)
    if str(d.get("extracted_run")) == "45841675928":
        rereads.append(d)
check(len(rereads) == 1 and set(RESTAMPED) <= {str(k) for k in rereads[0].get("replaced_keys") or []},
      "the reread at run 45841675928 replaced the three rows the reconcile restamped")
for cn in ROWS:
    want = "45841675928" if cn in RESTAMPED else "38843461766"
    check(str(W.load(cn)["extracted_run"]) == want, "%s: its record holds run %s" % (cn, want))
g = dict(W.load("32096"), extracted_run="1")
check(not W.on_live_run(g), "a record at another run is not on its live run")


def reads(cn, ops):
    f = W.load(cn)
    return B.closes(f, B.apply_ops(f, ops))


# Each reading closes, and the reading next to it does not.
for cn, e in M.REVIEWED.items():
    if e.get("ops"):
        check(reads(cn, e["ops"]), "%s: its reading gives the printed total at both ends" % cn)
check(not B.closes(W.load("32096"), W.load("32096")["record"]), "32096: with the movement list counted it does not close")
check(not reads("08720", [("choose", "Mechanical Option", 11)]) and not reads("08720", [("choose", "Mechanical Option", 9)]),
      "08720: the Mechanical Option at 11, or at the 9 its rows add to as read, does not close")
check(not reads("21748", [("choose", "Core Requirements", 14, 15)]),
      "21748: the core at the 14-15 its courses add to does not close")
check(not reads("31887", [("choose", "Required Core Courses", 44)]), "31887: the core at 44 does not close")
check(not reads("04256", [("pool", list(M._REQS), 22, 23.5)]) and not reads("04256", [("choose", "Recommended electives:", 3)]),
      "04256: neither half of its reading alone closes it")
check(not reads("31859", [("choose", "List A (select 2)", 7, 7.5)]),
      "31859: List A at the 7-7.5 its two listed rows carry does not close")
for cn in ("18780", "04230"):
    check(B.shape_note_quotes(W.load(cn), M.REVIEWED[cn]), "%s: its note quotes both figures" % cn)
# 31859's kind: its List A also takes a course from the core. lists_past_their_figure is not filed for it: that
# kind's record rule does not name the row, and a reconcile's rescore keeps such a gap only where the rule does
# (tests/reconcile_keeps_named_gaps_test.py reads every committed record so).
f = W.load("31859")
check(W._rule(f, B.arithmetic(f)) is None and "Any course not selected from Core" in M.REVIEWED["31859"]["page"],
      "31859: no record rule names it, and its page says List A also takes a core course")
for cn in ("21748", "04256"):
    f = W.load(cn)
    check(any(M.REVIEWED[cn]["also_words"] in n for n in B.notes(f)), "%s: its second note is the record's own" % cn)
check(all(e.get("page") for e in M.REVIEWED.values()) and M.PAGE_READ == "45835379921",
      "each entry carries its page's words, from the page read")

# The holds.
f = W.load("04238")
check(W.shared_with("04238") == ["32436"] and "A.A.-T" in f["record"]["program"]["section_heading"]
      and f["award"] == "A.A. Degree", "04238 was read from English A.A.-T 32436's entry, whose page it shares")
a = B.arithmetic(W.load("21789"))
check(a["stated"][0] < a["computed"][0] and a["computed"][1] < a["stated"][1],
      "21789: its groups add to a figure inside the printed range, matching neither end")
check(reads("32533", [("drop", "Substitution Courses")]) and "32533" not in M.REVIEWED,
      "32533 closes without its substitution list, and no kind is filed for it")

sys.exit(t.done())
