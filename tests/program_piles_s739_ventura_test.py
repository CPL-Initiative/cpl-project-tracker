#!/usr/bin/env python3
"""S739, lane 2's cheap piles at Ventura: the 17 records s720t held, seven collected with named gaps (kb/_program_piles_s739_ventura.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17) and his routine prompt of 2026-11-25: a record held
for a gap is collected with its gap named and a lower score, never held, unless the record is not the program's own.
The shared checks are tests/program_piles_s739_common.py's. Pinned here:

  * the 17 keys are s720t's holds; 7 collected (no new kind), 10 held;
  * the live runs: 06973 and 32834 are on run 39622549965 through reread 39629266949's kept keys, that run being the
    later of the two runs of load 39628631068, the one load that inserted them; 39961 and 39995 were replaced by that
    reread; 20599, 42967 and 45427 were inserted by the one-run load 38842159685; 31298 is on no proved run and
    holds;
  * 06973: the four lists as one pool at 20-22 close the major at 36-38;
  * 32834: List B is a choice list and the record adds short of the printed total;
  * 20599: with the pair and the optional list inside List A the record passes at the printed range's low end;
  * 39961: without the prerequisites the major closes at 52;
  * 39995: the 3-unit line and the lab inside the pair's 4 close it at 44.5; the line alone does not;
  * 42967 and 45427 state no total; 42967's courses add to the plan's 29, and its lever is named;
  * the holds: 30587 and 32578 pass today's scorer on their own record; the six tab records say so in a note.

Run from repo root: python3 tests/program_piles_s739_ventura_test.py
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s739 as B  # noqa: E402
import _program_piles_s739_ventura as M  # noqa: E402

W = M.W
NG = B.NG
ROWS = {"06973": "pool_figure_not_read", "32834": "lists_not_closed", "20599": "lists_not_closed",
        "39961": "prerequisites_counted", "39995": "unit_line_not_read", "42967": "noted_no_total",
        "45427": "noted_no_total"}
TAB = ["requirements tab is not in the text", "a reread"]
HELD = {"06948": TAB, "08253": TAB, "35654": TAB, "37415": TAB, "44994": TAB, "44995": TAB,
        "30587": ["today's scorer passes it"], "32578": ["today's scorer passes it"],
        "31298": ["44514835321", "no committed receipt posts"], "45348": ["upper-division general education", "a new kind"]}
SCORES = {"pool_figure_not_read": 40, "lists_not_closed": 30, "prerequisites_counted": 70, "unit_line_not_read": 40,
          "noted_no_total": 40}

t = T.run(W, rows=ROWS, held=HELD, scores=SCORES, day="2026-11-26", boundaries=28)
check = t.check


def receipt(name):
    with open(os.path.join(NG.RECEIPTS, name), encoding="utf-8") as fh:
        return json.load(fh)


# The live runs.
posted = W.prior.posted_runs(skip=(W.tag,))
reread = receipt("program_requirement_records_college_reread_ventura_39629266949.json")
multi = receipt("program_requirement_records_college_ventura_39628631068.json")
first = receipt("program_requirement_records_college_ventura_38842159685.json")
for cn in ("06973", "32834"):
    check(cn in [str(k) for k in reread["kept_keys"]] and cn in [str(k) for k in multi["inserted_keys"]]
          and max(multi["extracted_runs"], key=int) == str(reread["extracted_run"]) == "39622549965"
          and posted.get(cn) == [(reread["at"], "39622549965")] and str(W.load(cn)["extracted_run"]) == "39622549965",
          "%s is on run 39622549965: the reread kept it at the later run of the one load that inserted it" % cn)
for cn in ("39961", "39995"):
    check(cn in [str(k) for k in reread["replaced_keys"]] and max(posted[cn]) == (reread["at"], "39622549965")
          and str(W.load(cn)["extracted_run"]) == "39622549965", "%s was replaced at run 39622549965" % cn)
check(first["extracted_runs"] == ["38756014587"] and all(
    cn in [str(k) for k in first["inserted_keys"]] and posted[cn] == [(first["at"], "38756014587")]
    and str(W.load(cn)["extracted_run"]) == "38756014587" for cn in ("20599", "42967", "45427")),
      "the one-run load 38842159685 inserted 20599, 42967 and 45427 at run 38756014587")
check(not posted.get("31298") and not W.on_live_run(W.load("31298"), skip=(W.tag,)), "31298 is on no proved live run")
check(all(not W.shared_with(cn) for cn in M.KEYS), "each record was read from a page no other record was read from")

f, e = W.load("06973"), M.REVIEWED["06973"]
check(B.closes(f, B.apply_ops(f, e["ops"]), major=True) and not B.closes(f, f["record"], major=True),
      "06973: the four lists as one pool at 20-22 close the major at 36-38")
f, e = W.load("32834"), M.REVIEWED["32834"]
check(B.shape_depends(f, e) and "9-15" in f["score"]["gaps"][0]["words"],
      "32834: List B is a choice list, the record adds short, and the gap files the pooled figure's note")
f, e = W.load("20599"), M.REVIEWED["20599"]
now = B.C.fresh_score(dict(f, record=B.apply_ops(f, e["ops"])))["arithmetic"]
check(now.get("short_high") is True and now["computed"] == [21.0, 21.0] and now["stated"] == [21.0, 22.0]
      and not B.closes(f, B.apply_ops(f, e["ops"][:1]), verdict=True),
      "20599: with the pair and the optional list inside List A it adds to 21, the printed range's low end")
f, e = W.load("39961"), M.REVIEWED["39961"]
now = B.C.fresh_score(dict(f, record=B.apply_ops(f, e["ops"])))["arithmetic"]
check(now["major"]["computed"] == [52.0, 52.0] and now["major"]["status"] == "equal"
      and "= 81" in f["score"]["gaps"][0]["words"],
      "39961: without the prerequisites the major closes at 52, and the gap files the degree's line")
f, e = W.load("39995"), M.REVIEWED["39995"]
check(B.closes(f, B.apply_ops(f, e["ops"])) and not B.closes(f, B.apply_ops(f, e["ops"][:1]))
      and not B.closes(f, B.apply_ops(f, e["ops"][1:])) and "4 units for the pair" in f["score"]["gaps"][0]["words"],
      "39995: the 3-unit line and the lab inside the pair's 4 close it at 44.5; neither alone does")
for cn in ("42967", "45427"):
    f = W.load(cn)
    check(B.shape_no_total(f, {}) and f["record"]["program"]["total_units"] in (None, {"min": None, "max": None}),
          "%s states no total" % cn)
check(W.load("42967")["score"]["arithmetic"]["computed"] == [29.0, 29.0] and "29 = 29" in M.REVIEWED["42967"]["lever"],
      "42967: its courses add to the plan's 29, and the lever is named")

for cn in ("30587", "32578"):
    check(B.scorer_passes(W.load(cn)), "%s passes today's scorer on its own record" % cn)
for cn in ("06948", "08253", "35654", "37415", "44994", "44995"):
    check(any("requirements tab" in n.lower() and (" not " in n or " no " in n.lower()) for n in B.notes(W.load(cn))),
          "%s: its note says the requirements tab is not in the text" % cn)
f = W.load("45348")
check(f["score"]["arithmetic"]["major"]["status"] == "equal"
      and any("Required Upper Division General Education Units 10" in n for n in B.notes(f)),
      "45348: its major passes, and its note names the 10 upper-division general education units")

sys.exit(t.done())
