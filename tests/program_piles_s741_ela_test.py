#!/usr/bin/env python3
"""S741, lane 2's cheap piles at East Los Angeles: the five records s720e still held, 38168 collected with a named gap
(kb/_program_piles_s741_ela.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): a record with a true gap is collected with the gap
named, never held, unless the record is not the program's own. s720e held 38168 as unconfirmed: the catalog prints no
section under the state's title. College-page-read run 45953358884 prints the section the record read as 'Commercial
Music: Performance (Academic Plan E038168D)', and East Los Angeles's Academic Plan code is E0 and the state's control
number, so the section is 38168's own. The shared checks are tests/program_piles_s739_common.py's. Pinned here:

  * the five keys are s720e's holds less 33013, collected since; 38168 collected, four held;
  * 38168's heading carries its own Academic Plan code, and each page-mate's record carries another code (plan_code);
    with another program's code the entry names no gap;
  * its note names its own section (own_section); without that note it is not shown to be its own;
  * its reading closes the record: the last list at its heading's 4 units gives the printed 19-20 at both ends, and
    at 3 it does not;
  * the page read's plan is committed and reads the record's own catalog file over its page;
  * 02456's hold names unit_line_not_read's reading, which closes it (the 3-5 line), and its run.

Run from repo root: python3 tests/program_piles_s741_ela_test.py
"""
import copy
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s741 as B8  # noqa: E402
import _program_piles_s741_ela as M  # noqa: E402

W = M.W
B, NG = B8.B, B8.NG
ROOT = T.ROOT
HELD = {"02456": ["unit_line_not_read", "45176404274", "on_live_run"], "31017": ["a reread"],
        "37510": ["unstated"], "41231": ["a reread"]}

with open(os.path.join(ROOT, M.HELD_BY), encoding="utf-8") as fh:
    s720e = {h["control_number"] for h in json.load(fh)["held"]}
t = T.run(W, rows={"38168": "noted_figures_differ"}, held=HELD, scores={"noted_figures_differ": 40},
          day="2026-11-27", boundaries=5, prior_held=s720e - set(M.COLLECTED_SINCE), own={"38168": "own_section"})
check = t.check

check(s720e == set(M.KEYS) | set(M.COLLECTED_SINCE)
      and [g["gap"] for g in W.load("33013")["score"]["gaps"]] == ["noted_figures_differ"],
      "the keys are s720e's holds less 33013, which carries its gap since")

f, e = W.load("38168"), M.REVIEWED["38168"]
words = f["score"]["gaps"][0]["words"]
bare = copy.deepcopy(f)
bare["score"].pop("gaps")
bare["score"].pop("confidence")
check(W.gap_noted(bare) == ("noted_figures_differ", words) and e["words"] in words and NG.answer(bare) is None,
      "38168: the entry stands on the record as it was filed, with its note's words, and no record rule names a kind")
heading = bare["record"]["program"]["section_heading"]
check(heading == "Commercial Music: Performance (Academic Plan E038168D)" and M.plan_code(bare, e),
      "38168: its heading carries its own Academic Plan code, E0 and its control number")
# plan_code's self-recall (the second reader's MAJOR): the code is evidence where it matches, no universal rule.
rc = M.plan_code_recall()
check(rc["read"] == 92 and rc["matches"] == 90 and rc["colleges"] == [M.COLLEGE]
      and rc["differs"] == [[M.COLLEGE, "33681", "Academic Plan E046343H"], [M.COLLEGE, "45986", "Academic Plan E045717D"]],
      "plan_code's self-recall: of the 92 committed headings that print an Academic Plan code, all East Los "
      "Angeles's, 90 carry the record's own control number; 33681 and 45986 carry another (%r)" % (rc["differs"],))
check(not any(M.plan_code(W.load(cn), e) for cn in ("33681", "45986")) and "38168" not in [d[1] for d in rc["differs"]],
      "the two headings that carry another number are never shown their own by the code, and 38168 is not one of them")
mates = W.shared_with("38168")
check(mates == ["38169", "38206"]
      and all(W.load(m)["record"]["program"]["section_heading"] == W.load(m)["title"] != heading for m in mates)
      and not any(M.plan_code(dict(bare, control_number=m), e) for m in mates),
      "its page was also read for 38169 and 38206, whose records carry their own titles as headings, and its "
      "heading carries neither one's code")
g = copy.deepcopy(bare)
g["record"]["program"]["section_heading"] = "Commercial Music: Jazz Studies (Academic Plan E038169D)"
check(not W.kind_closes(g, e) and W.gap_noted(g) is None, "38168: under another program's code the entry names no gap")
g = copy.deepcopy(bare)
g["record"]["notes"] = [n for n in B.notes(g) if e["own_section"] not in n]
check(W.own(bare, e) == "own_section" and W.own(g, e) is None,
      "38168: its note names its own section; without the note it is not shown to be its own")
check(B.closes(bare, B.apply_ops(bare, e["ops"])) and not B.closes(bare, B.apply_ops(bare, [("stated", M._LAST, 3)])),
      "38168: the last list at its heading's 4 units closes the record at 19-20; at 3 it does not")
last = B.blocks(bare, M._LAST)[0]
check(B.same(last["stated"], [2, 3]) and last["minimum"] == 4,
      "38168: the record holds the list's printed '2-3' beside the heading's four units")
with open(os.path.join(ROOT, "kb", "college_reads", "s741_piles_east_los_angeles_music.json"), encoding="utf-8") as fh:
    plan = json.load(fh)
check(plan["college"] == M.COLLEGE and bare["source_url"] == plan["pages"][0]["url"] + "#page=288"
      and plan["pdf_span"][0] <= 288 <= plan["pdf_span"][1],
      "the page read's plan is committed, and it reads the record's own catalog file over its page")

f = W.load("02456")
# S742's reread 46013175731 posted the record, and its plan s742b files unit_line_not_read on it: no gap and no proved
# live run as s741d left it, or that kind alone on the posted record.
kinds = [x["gap"] for x in f["score"].get("gaps") or []]
check(((not kinds and not W.on_live_run(f)) or (W.on_live_run(f) and kinds in ([], ["unit_line_not_read"])))
      and str(f["extracted_run"]) == "45176404274"
      and B.closes(f, B.apply_ops(f, [("line", 3, 5)])) and not B.closes(f, B.apply_ops(f, [("line", 3, 4)])),
      "02456: the 3-5 line closes it at 48-50; no proved live run and no gap, or posted and S742's kind alone")
for cn in ("31017", "37510", "41231"):
    check(W.hand[cn] == M.S720.HAND[cn] and not W.load(cn)["score"].get("gaps"), "%s: s720e's reason, and no gap" % cn)

sys.exit(t.done())
