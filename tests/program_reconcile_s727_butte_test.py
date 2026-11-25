#!/usr/bin/env python3
"""S727, lane 2: Butte's map elective line read as electives that fill the degree (kb/_program_reconcile_s727_butte.py).

WHY. S721's second reader held nine Butte degrees (f-butte-nine-pass-on-elective-line-s721) whose records count the
map's 'Only necessary if the 60 units needed to graduate have not been completed' line at its printed figure; read as
electives that fill the degree, each passes today's scorer. Butte's reconcile config gains a clear_conditional step
(kb/program_requirements_reconcile.json), and a reconcile run the conductor dispatches files the nine. Pinned here:

  * the kind: conditional_note needs the field, its figure (never inside 113 or 13.5; both ends of a range) and the
    line's words in one note; conditional_short needs the major and general education at their least short of the
    degree's low end; the step fires only with the flag, a degree total, the line in the page's text and no hold;
  * the config: Butte's step follows its electives_fill_degree set and reads the same line; no other college names
    the kind, so no other college's reconcile changes;
  * the self-recall over every committed record against the hand reading of the 27 Butte records that keep the line's
    figure: 14 fire (the nine and 5 passing that still pass), 13 are kept, and no record elsewhere fires; a looser
    note reading fires on none of the 52 conditional elective notes at six other colleges;
  * each boundary reading leaves the nine alone; the standing guards hold (own page by same_address on sources.json's
    url and no shared page, live run, no cut window, failing before);
  * each target's outcome passes with the fill named, before the run (the step on the committed record) and after it
    (the record the run filed): the test reads the record's own state, never a receipt;
  * check_target, keep-only's check, accepts the record the run would file and refuses one changed beyond
    degree_elective_units, one read from another page, and one whose rescore does not pass; keep_only_plan refuses
    the run's own commit as base, a target the run did not carry and a missing one (S727's second reader, round 1);
  * the fill: the figure must lie inside what the electives fill (conditional_fits), and _figure_in never reads a
    range's end ("numbered 1-199"), a course number or the line's own 60.

Run from repo root: python3 tests/program_reconcile_s727_butte_test.py
"""
import copy
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_reconcile_s727_butte as B  # noqa: E402
import _program_requirements_reconcile as R  # noqa: E402
import _program_requirements_score as S  # noqa: E402

NINE = {"01362", "07269", "11136", "31042", "31941", "32469", "33199", "40923", "43453"}
KEPT = {"01298", "01305", "07258", "07264", "31930", "32721",
        "01370", "31306", "31307", "31950", "31954", "43185", "43186"}

checks = [0]
failures = []


def check(ok, msg):
    checks[0] += 1
    if not ok:
        failures.append(msg)


# The kind, on fixtures.
rec = {"program": {"degree_elective_units": {"min": 13, "max": 13}, "electives_fill_degree": True,
                   "degree_total": {"min": 60, "max": 66}, "total_units": {"min": 27, "max": 27},
                   "ge_units": {"min": 21, "max": 21}},
       "notes": ["degree_elective_units 13 is taken from the map's 'Elective' line, which the page says is 'Only "
                 "necessary if the 60 units needed to graduate have not been completed'."], "blocks": []}
W = r"only\s+necessary\s+if\s+the\s+60\s+units\s+needed\s+to\s+graduate"
check(R.conditional_note(rec, "degree_elective_units", W), "the note names the field, its 13 and the line")
for bad, why in (("degree_elective_units 113 is taken", "113 is no 13"), ("degree_elective_units 13.5 is taken", "13.5 is no 13"),
                 ("elective 13 is taken", "the field unnamed")):
    g = copy.deepcopy(rec)
    g["notes"] = [g["notes"][0].replace("degree_elective_units 13 is taken", bad)]
    check(not R.conditional_note(g, "degree_elective_units", W), why)
check(R._figure_in(13, "Elective 13.00 units") and R._figure_in(11, "The 11-unit elective")
      and R._figure_in(21.5, "line 21.5") and not R._figure_in(21.5, "line 21.50x1"), "figures as the notes print them")
# Anchored (S727's second reader): never a range's end, a course number or the line's own 60.
check(not R._figure_in(1, "any course numbered 1-199 or C1000-C2999") and not R._figure_in(1000, "C1000")
      and R._figure_in(1, "a 1.00-unit Elective (any course numbered 1-199"), "a range or a course number is no figure")
check(R._figure_in(6, "electives 6-8 units", 8) and not R._figure_in(6, "electives 6 units", 8), "a range's two ends")
g = copy.deepcopy(rec)
g["program"]["degree_elective_units"] = {"min": 60, "max": 60}
g["notes"] = ["degree_elective_units: the map's elective line is 'Only necessary if the 60 units needed to graduate'"]
check(not R.conditional_note(g, "degree_elective_units", W), "the line's own 60 is not the field's figure")
# The fill (S727's second reader): 27 and 21 leave 12-18 against 60-66.
check(R.conditional_fits(rec["program"], "degree_elective_units"), "13 lies inside the 12-18 fill")
for v, why in ((19, "19 past the fill's top"), (11, "11 short of the fill's low end")):
    check(not R.conditional_fits(dict(rec["program"], degree_elective_units={"min": v, "max": v}),
                                 "degree_elective_units"), why)
check(R.conditional_fits(dict(rec["program"], degree_elective_units={"min": 12, "max": 18}), "degree_elective_units"),
      "the fill's two ends themselves fit")
check(not R.conditional_fits(dict(rec["program"], ge_units=None), "degree_elective_units"), "no GE units: no fit")
g = copy.deepcopy(rec)
g["program"]["degree_elective_units"] = {"min": 6, "max": 8}
g["notes"] = ["degree_elective_units 6 from the line 'Only necessary if the 60 units needed to graduate'"]
check(not R.conditional_note(g, "degree_elective_units", W), "a range needs both ends in the note")
check(R.conditional_short(rec["program"]), "27 and 21 fall short of 60")
check(not R.conditional_short(dict(rec["program"], total_units={"min": 39, "max": 39})), "39 and 21 reach 60")
check(not R.conditional_short(dict(rec["program"], ge_units=None)), "no general education units read: not short")
check(not R.conditional_short(dict(rec["program"], total_units={"min": 27, "max": 27}, open_elective_units=12)),
      "open electives count toward the major's side")
TEXT = B.STAND_IN
st = {"X": {"steps": [B.step()]}}
new, notes = R._college_steps(rec, TEXT, "X", "A.S. Degree", steps=st)
check(new["program"]["degree_elective_units"] == {"min": None, "max": None} and len(notes) == 1
      and notes[0]["was"] == {"min": 13, "max": 13} and "reader's note" in notes[0]["words"], "the step clears the 13")
check(not R._college_steps(rec, TEXT, "X", "Certificate of Achievement", steps=st)[1], "associate degrees only")
check(not R._college_steps(rec, "Elective 13.00", "X", "A.S. Degree", steps=st)[1], "the page must print the line")

# The config.
steps = R.load_steps()
bs = steps["Butte College"]["steps"]
kinds = [s["kind"] + ":" + s.get("field", "") for s in bs]
i = kinds.index("clear_conditional:degree_elective_units")
check(kinds[i - 1] == "set:electives_fill_degree" and bs[i]["pattern"] == bs[i - 1]["pattern"],
      "Butte's step follows its electives_fill_degree set and reads the same line")
check([c for c, conf in steps.items() if any(s.get("kind") == "clear_conditional" for s in conf.get("steps") or [])]
      == ["Butte College"], "no other college names the kind")
check("clear_conditional" in json.load(open(R.STEPS, encoding="utf-8"))["_kinds"], "the kind is described")

# The self-recall.
rc = B.recall()
check(rc["read"] > 18000 and rc["right"] == rc["read"] and not rc["wrong"], "the step's recall: %s" % rc["wrong"][:5])
check(not rc["after_verdict_wrong"] and not rc["hand_not_seen"], "each fire's verdict is the hand's")
check(set(rc["by_college"]) <= {"butte"}, "no other college's record fires")
states = {cn: B.state(cn) for cn in NINE}
fired_now = 14 - sum(1 for v in states.values() if v == "after")
check(rc["fired"] == fired_now and rc["by_college"].get("butte") == fired_now, "14 fire, less those already filed")
check(set(rc["before_failing_after_passing"]) == {cn for cn, v in states.items() if v == "before"},
      "the nine still before the run are the ones it moves from failing to passing")
check({cn for cn, h in B.HAND.items() if h[1] == "clear"} >= NINE and {cn for cn, h in B.HAND.items()
      if h[1] != "clear"} == KEPT and len(B.HAND) == 27, "the hand reading: 14 clear, 13 kept")
lr = B.loose_recall()
check(sum(lr["notes"].values()) >= 50 and not lr["fired"], "the looser note reading fires nowhere else")
bd = B.boundaries()
check(not bd["wrong"] and len(bd["counts"]) == 9 and all(v == 9 for v in bd["counts"].values()),
      "every boundary reading: %s" % bd["wrong"][:4])
gd = B.guards()
check(set(gd) == NINE and all(all(v.values()) for v in gd.values()), "the standing guards: %s" % gd)

# The outcome, as the record stands, and as the run would file it.
for cn in sorted(NINE):
    o = B.outcome(cn)
    check(o["pass"] and o["fill"] and B._same(o["was"], B.TARGETS[cn]), "%s passes with the fill: %s" % (cn, o))
    f = B._load(cn)
    if B.state(cn) == "before":
        check(S._span(f["record"]["program"]["degree_elective_units"]) is not None
              and (f["score"]["arithmetic"] or {}).get("pass") is False, "%s fails as filed today" % cn)
        new, notes = B.run_step(f)
        sc = S.score(new, [], None, f.get("award"))
        after = dict(f, record=new, reconciled=notes, score=sc, extracted_run=1)
        check(B.state(cn, after) == "after" and B.outcome(cn, after)["pass"], "%s reads the same after the run" % cn)
        check(B.check_target(cn, after, f) is None, "%s: keep-only accepts the record the run files" % cn)
        g = copy.deepcopy(after)
        g["record"]["program"]["ge_units"] = {"min": 22, "max": 22}
        check(B.check_target(cn, g, f) == "the run changed more than degree_elective_units", "%s: more changed" % cn)
        g = dict(after, source_url="https://butte.curriqunet.com/catalog/iq/1/2/3")
        check(B.check_target(cn, g, f) == "the run read another page", "%s: another page" % cn)
        g = copy.deepcopy(after)
        g["score"]["arithmetic"]["pass"] = False
        check(B.check_target(cn, g, f) is not None, "%s: a failing rescore" % cn)
    else:
        check(B.reconciled_by_step(f) and f["score"]["arithmetic"].get("pass") is True, "%s filed by the run" % cn)
for cn in KEPT:
    check(not B.run_step(B._load(cn))[1], "%s: kept" % cn)

# keep-only's plan (S727's second reader): it keeps all nine only from the filing before the run, refuses a base that
# is the run's own commit, a target the run did not carry, and a restored file that still carries the run.
if all(v == "before" for v in states.values()):
    RUN = "777"
    base, after = {}, {}
    for cn in NINE:
        f = B._load(cn)
        new, notes = B.run_step(f)
        after[cn] = dict(f, record=new, reconciled=notes, read_run=f["extracted_run"], extracted_run=RUN,
                         score=S.score(new, [], None, f.get("award")))
        base[cn] = json.dumps(f)
    other = B._load("01298")
    after["01298"] = dict(other, extracted_run=RUN)
    base["01298"] = json.dumps(other)
    plan = B.keep_only_plan(RUN, after, base)
    check(not plan["held"] and sorted(plan["kept"]) == sorted(NINE) and list(plan["restore"]) == ["01298"],
          "the plan keeps the nine and restores 01298: %s" % plan["held"][:3])
    own = {cn: json.dumps(f) for cn, f in after.items()}
    plan = B.keep_only_plan(RUN, after, own)
    check(len(plan["held"]) == 10 and not plan["kept"], "the run's own commit as base: all ten refused")
    one = dict(after, **{"01362": B._load("01362")})
    plan = B.keep_only_plan(RUN, one, base)
    check(["01362", "the run did not carry it"] in plan["held"], "a target the run did not carry is refused")
    less = {cn: f for cn, f in after.items() if cn != "43453"}
    check(["43453", "no record file"] in B.keep_only_plan(RUN, less, base)["held"], "a missing target is refused")

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
