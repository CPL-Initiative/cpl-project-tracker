#!/usr/bin/env python3
"""S740, lane 1 at Solano: the census's 14 wording-rule records, 6 passed by the reconcile, 3 with named gaps, 5 held.

WHY. kb/_program_piles_s740_solano.py reads the census's reconcile_steps records at Solano Community College. Six pass
on the free reconcile 45840125172, which reads the catalog's SOCI codes as the file's SOC rows
(tests/program_reconcile_s740_test.py); they are no keys of the plan. Of the other eight, three are collected with a
named gap and five are held. The shared checks are tests/program_piles_s739_common.py's.

Pinned here beside them:
  * the lever's 14 are the six the reconcile passed and the plan's eight keys, and each of the six passes as the live
    table counts it, with its entry and without a gap, in either state of the record file (before the run's filing
    and after it);
  * 32917: the page's own words (college-page-read run 45835049303, PDF page 413): the section prints its lists and
    no 'Required Major Total Units' line, which the next section does print; the record rule names total_not_printed
    from kb/program_total_not_printed.json, and an unlisted record of the same shape takes nothing;
  * 06559 adds to its printed 18 as one list over the two sciences, and to 2.5-10 as read;
  * 37919's note quotes both figures;
  * the holds: the own-page guard refuses the two Mechatronics records and World Languages 43134 with an entry in hand,
    38591's own note says the state's list fits another section, and 42041 is not on its live run until the reread of
    the reconcile posts it.

Run from repo root: python3 tests/program_piles_s740_solano_test.py
"""
import copy
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402

import _program_piles_s714_ccsf as C  # noqa: E402
import _program_piles_s739 as B  # noqa: E402
import _program_piles_s740_solano as M  # noqa: E402
import _program_requirements_reconcile as R  # noqa: E402

W = M.W
S, NG = B.S, B.NG
ROWS = {"06559": "pool_figure_not_read", "37919": "noted_figures_differ", "32917": "total_not_printed"}
HELD = {"30184": ["one section", "30185", "the own-page guard"], "30185": ["one section", "30184", "the own-page guard"],
        "43134": ["06538", "the inventory's call"], "38591": ["not shown to be the program's own", "page 343"],
        "42041": ["total_not_printed", "45840125172"]}
SCORES = {"pool_figure_not_read": 40, "noted_figures_differ": 40, "total_not_printed": 40}
t = T.run(W, rows=ROWS, held=HELD, scores=SCORES, day="2026-11-26", boundaries=10, prior_held=set(M.KEYS))
check = t.check

with open(os.path.join(B.ROOT, "kb", "status", "harvest_gap_census.json"), encoding="utf-8") as fh:
    census = json.load(fh)
lever = next(e for e in census["levers"] if e["lever"] == "reconcile_steps" and e["scope"] == M.COLLEGE)
check(sorted(lever["members"]) == sorted(M.LEVER) and set(M.LEVER) == set(M.KEYS) | set(M.PASSED_BY_RECONCILE)
      and not set(M.KEYS) & set(M.PASSED_BY_RECONCILE),
      "the lever's 14 are the six the reconcile passed and the plan's eight keys")
for cn in M.PASSED_BY_RECONCILE:
    f = W.load(cn)
    sc = S.score(f["record"], C.closed_list(M.COLLEGE, cn), None, f.get("award"), R.prefix_aliases(M.COLLEGE), False)
    check(S.passes_live(sc) and not (f["score"].get("gaps") or []),
          "%s passes as the live table counts it under Solano's entry, and carries no gap" % cn)
    check(W.outcome(f)[0] == "none", "%s: the plan names no gap for it" % cn)

# ── 32917: the page's own words (PDF page 413, as pypdf prints it; 'ti' is a ligature) ───────────────────────
PAGE_413 = """412 · Psychology
Associate in Arts in Psychology for Transfer (ADT: A.A.-T)
Program DescripƟ on
REQUIRED COURSES ..............................................Units
PSYC C1000 IntroducƟ on to Psychology ......................... 3
PSYC 002 Biological Psychology ...................................... 3
STAT C1 000 IntroducƟ on to StaƟ sƟ cs ............................. 4
PSYC 004 Research Methods in Behavioral Science ....... 3
One course from List A ................................................ 3-4
One course from List B ................................................... 3
List A: (select one course) ..................................... Units
BIOL C1000 IntroducƟ on to Biology with Lab ................. 4
BIOL 016 IntroducƟ on to Human Biology ....................... 3
List B: (select one course) ..................................... Units
PSYC 005 Abnormal Psychology ..................................... 3
PSYC 040 Drugs, Society & Behavior............................... 3
Consult with your counselor for guidance on custom course pathwayr
"""
PAGE_414 = """413 · Psychology · Psychology · Associate in Arts · Program DescripƟ on
REQUIRED COURSES  .............................................Units
Three courses from List A ............................................... 9
Required Major Total Units  ...................................22
"""
check("Required Major Total Units" not in PAGE_413 and "Total" not in PAGE_413,
      "32917: the A.A.-T's section prints its lists and no total")
check("Required Major Total Units  ...................................22" in PAGE_414,
      "the next section, the Psychology A.A., prints its 'Required Major Total Units'")
entry = NG.total_not_printed_list().get((M.COLLEGE, "32917")) or {}
check(entry.get("page") == 413 and entry.get("run") == "45835049303" and entry.get("words") in PAGE_413,
      "32917 is listed with its page, its run and its section's heading as the page prints it")
f = W.load("32917")
bare = dict(f, score={k: v for k, v in f["score"].items() if k not in ("gaps", "confidence")})
check(NG.answer(bare) == ("total_not_printed", NG.total_not_printed(bare))
      and "PDF p.413" in NG.total_not_printed(bare) and "45835049303" in NG.total_not_printed(bare),
      "32917: the record rule names total_not_printed, with its page and run")
check(NG.total_not_printed(dict(bare, control_number="42041")) is None
      and (M.COLLEGE, "42041") not in NG.total_not_printed_list(),
      "an unlisted record of the same shape takes nothing: 42041 is not listed until its row is on its live run")
check(bare["score"]["arithmetic"]["why"] == [NG.NO_TOTAL_WHY] and bare["score"]["arithmetic"]["computed"] == [19.0, 20.0],
      "32917: its one arithmetic reason is that it names no total, over courses that add to 19-20")

# ── 06559 and 37919 ────────────────────────────────────────────────────────
f = W.load("06559")
pooled = B.apply_ops(f, M.REVIEWED["06559"]["ops"])
check(B.closes(f, pooled) and B.arithmetic(f)["computed"] == [2.5, 10.0] and B.arithmetic(f)["stated"] == [18.0, 18.0],
      "06559: one list of 18 over the two sciences adds to the printed 18; as read the lists add to 2.5-10")
check([b["name"] for b in f["record"]["blocks"]] == M.LISTS
      and all(b["rule"] == "choose_courses" and b["minimum"] == 1 for b in f["record"]["blocks"]),
      "06559: the record holds the two sciences as one course from each")
check(B.shape_note_quotes(W.load("37919"), M.REVIEWED["37919"]),
      "37919: its note quotes 'Required Major Total Units 19' and the 22 its lines add to")

# ── the holds ──────────────────────────────────────────────────────────────
TRIAL = {
    "30184": {"gap": "noted_figures_differ", "computed": [36, 36], "stated": [37, 37],
              "words": "Required Major Total Units is printed as 37, but the listed courses sum to 36",
              "shape": ["note_quotes"], "quotes": {"stated": "printed as 37", "computed": "sum to 36"},
              "own_heading": W.load("30184")["record"]["program"]["section_heading"]},
    "43134": {"gap": "lists_not_closed", "computed": [0, 0], "stated": [22, 27],
              "words": "No per-language unit minimum is printed", "shape": ["open"], "open": "French",
              "own_heading": "World Languages Associate in Arts"},
}
trial = B.Pile(college=M.COLLEGE, slug=M.SLUG, tag="trial", name="Solano", prior=W.prior, keys=tuple(TRIAL),
               reviewed=TRIAL, hand={cn: e["gap"] for cn, e in TRIAL.items()})
for cn, mate in (("30184", "30185"), ("43134", "06538")):
    f = trial.load(cn)
    check(trial.shared_with(cn) == [mate] and trial.gap_noted(f) is not None and trial.own(f, TRIAL[cn]) is None
          and trial.outcome(f)[0] == "none",
          "%s: with an entry in hand its gap's own check stands, and the own-page guard refuses it (its page-mate "
          "%s was read from the same section)" % (cn, mate))
check(any("is printed as 37, but the listed courses sum to 36" in n for n in B.notes(W.load("30184"))),
      "30184's note quotes the printed 37 and the 36 its courses add to")
check("Certificate of Achievement" in W.load("30185")["record"]["program"]["section_heading"]
      and "Associate in Science" in W.load("30185")["record"]["program"]["section_heading"],
      "30185's heading names both awards")
check(W.load("06538")["award"] == W.load("43134")["award"] == "A.A. Degree"
      and W.load("06538")["title"] == W.load("43134")["title"], "the state's file lists World Languages A.A. twice")
check(any("matches the separate 'ASL/English Interpreter Training Certificate of Achievement and Associate in Arts' "
          "section on page 343 more closely than this section" in n for n in B.notes(W.load("38591"))),
      "38591's own note says the state's list fits another section")
f = W.load("42041")
a = f["score"]["arithmetic"]
check(a["status"] == "incomplete" and a["why"] == [NG.NO_TOTAL_WHY],
      "42041 names no total, its one arithmetic reason")
check(str(f["extracted_run"]) != M.RECONCILE or NG.collectable(f["score"]),
      "42041: once the reconcile's run files it, its course list is read")
g = copy.deepcopy(f)
g["extracted_run"] = int(M.RECONCILE)
posted = W.prior.posted_runs().get("42041") or []
check(W.prior.on_live_run(g) == (bool(posted) and max(posted)[1] == M.RECONCILE),
      "42041 at the reconcile's run is on its live run only once a committed reread receipt posts that run")
sys.exit(t.done())
