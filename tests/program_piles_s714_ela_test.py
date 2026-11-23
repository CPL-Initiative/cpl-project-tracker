#!/usr/bin/env python3
"""S714, lane 2's cheap piles at East Los Angeles College (kb/_program_piles_s714_ela.py).

Each reading runs on the records as main filed them (BASE) and their own sections of the 2026-2027 catalog, as the
free page reads printed them (tests/fixtures/ela_s714_sections.json). Held here, per reading: its self-recall counts
against the hand reading (right and wrong), one boundary each way, and the claim check on the reader's notes. Then
the shared helpers (own_heading_end, own_plan_line_at, set with was) at their edges, and the plan's rows once the
reconcile run has filed the records.
"""
import glob
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "kb"))
import _program_piles_s714_ela as E  # noqa: E402
import _program_requirements_reconcile as R  # noqa: E402

checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


secs = E.sections()
members = E.census_members()
check(len(members) == 24 and set(members) == set(E.HAND_HELD) and set(members) <= set(secs),
      "the census's 24 East Los Angeles reconcile_steps members are each hand-held and each has its section")

# ── the self-recall, per reading: right and wrong against the hand ──
pr = E.precision()
check(pr["read"] == 24 and pr["right"] == 24 and pr["wrong"] == 0,
      "the readings answer the hand on all 24: %s" % pr["wrong_keys"])
check(pr["by_answer"] == {"passes": 14, "gap": 1, "none": 9}, "14 pass, 1 named gap, 9 held: %s" % pr["by_answer"])
by_reading = {}
for cn in members:
    r = E.reading_of(cn)
    if r:
        got = E.read(E.at_base(cn), secs[cn]["text"])["answer"]
        by_reading.setdefault(r, [0, 0])[0 if got == E.hand_answer(cn) else 1] += 1
check(by_reading == {"plan_line": [6, 0], "ge_overlap": [4, 0], "ge_waiver": [2, 0], "repeat": [1, 0],
                     "course_renumbers": [1, 0], "total_differs": [1, 0]},
      "each reading's right and wrong: %s" % by_reading)
# The two records the electives step holds by name: the plan-line reading alone passes them, and the hand holds them.
check(pr["held_by_name"] == {"02430": {"without_the_hold": "passes", "hand": "none"},
                             "08252": {"without_the_hold": "passes", "hand": "none"}},
      "02430 and 08252 pass without the hold and are held by name: %s" % pr["held_by_name"])
# Each held record stays held (none) under the readings: they read no gap and pass nothing.
held = [cn for cn in members if E.hand_answer(cn) == "none"]
check(all(E.read(E.at_base(cn), secs[cn]["text"])["answer"] == "none" for cn in held), "the 9 held stay held")

# ── the boundaries: each reading across each edge ──
bd = E.boundaries()
check(not bd["wrong"], "every boundary reads its expected answer: %s" % bd["wrong"])
want = {"plan line one digit off right": 6, "sentence cut from the section right": 6,
        "a later program's sentence right": 6,
        "verb 'double counted for' right": 4, "note under the next plan line right": 4,
        "'may choose to waive either' right": 2, "ge_units 26, not the plan's 27 right": 2,
        "heading 'ONCE' right": 1, "course 3 against the stated 4 right": 1,
        "file lists the printed code right": 1, "printed code one letter off right": 1,
        "total read 27 right": 1, "entry withdrawn right": 1}
check(bd["counts"] == want, "the boundary counts: %s" % bd["counts"])

# ── the claim checks: every reading the notes support ──
cc = E.claim_checks()
check(not cc["not_standing"] and sum(sum(v.values()) for v in cc["by_reading"].values()) == 15,
      "the reader's notes stand behind all 15 readings: %s" % cc)

# ── the hold names its records however the control number arrives (the S714 second reader, minor 5) ──
for cn in ("02430", "08252"):
    f, t = E.at_base(cn), secs[cn]["text"]
    for given in (cn, int(cn), None):
        new, notes = R.reconcile(f["record"], t, E.COLLEGE, f.get("award"), control_number=given)
        check("electives_fill_words" not in [n["field"] for n in notes],
              "%s is held from the sentence with its control number given as %r" % (cn, given))
check(R.norm_control_number(2430) == "02430" and R.norm_control_number("02430") == "02430"
      and R.norm_control_number(None) is None, "control numbers normalize to five digits")
# ...and a record the hold does not name still takes the sentence with its number as an integer or not at all.
f, t = E.at_base("32980"), secs["32980"]["text"]
check(all("electives_fill_words" in [n["field"] for n in R.reconcile(f["record"], t, E.COLLEGE, f.get("award"),
                                                                       control_number=g)[1]]
          for g in ("32980", 32980, None)), "32980 takes the sentence however its number arrives")

# ── the electives guard ends at the next program's plan line ──
prog_e = {"section_heading": "(Academic Plan E011111C)", "electives_fill_words": "ADDITIONAL CSU UNITS TO REACH 60"}
check(E.S.electives_named(prog_e, "(Academic Plan E011111C)\nCOMPLETE ADDITIONAL CSU UNITS TO REACH 60\n")
      and not E.S.electives_named(prog_e, "(Academic Plan E011111C)\nnone\n(Academic Plan E022222C)\n"
                                          "COMPLETE ADDITIONAL CSU UNITS TO REACH 60\n"),
      "the guard reads its own section's sentence, never the next program's")
check(E.S.electives_named({"section_heading": "Title", "electives_fill_words": "TO REACH 60 UNITS"},
                          "Title\nnone here\nlater words TO REACH 60 UNITS"),
      "a text with no plan lines runs to its end as before")

# ── the shared helpers at their edges ──
t = "Associate in Arts in\nJournalism for Transfer\n(Academic Plan E032980G)\nText"
check(R._heading_end(t, "Associate in Arts in Journalism for Transfer Degree (Academic Plan E032980G)") is None
      and R.own_heading_end(t, "Associate in Arts in Journalism for Transfer Degree (Academic Plan E032980G)")
      == t.index(")"), "a completed heading reads from its plan line (to its last letter, as _heading_end)")
check(R.own_heading_end(t, "Associate in Arts in Journalism for Transfer Degree (Academic Plan E032981G)") is None,
      "another program's plan line anchors nothing")
check(R.own_heading_end(t, "Associate in Arts in Journalism for Transfer Degree") is None,
      "a heading without a plan line keeps the old reading")
check(R.own_heading_end("(Academic Plan E032980G) x", "(Academic Plan E032980G)") == 23,
      "a heading that is its plan line alone reads as before")
check(R.own_plan_line_at(t, t.index("(") - 1, t.index("(")) and not R.own_plan_line_at(t, 0, t.index("(")),
      "the own plan line is the one right under the heading, never one after other words")

prog = {"section_heading": "X (Academic Plan E011111C)", "ge_units": {"min": 27, "max": 27},
        "ge_pattern": "LACCD General Education Plan", "degree_total": {"min": 60, "max": 60}}
rec = {"program": prog, "blocks": [{"name": "A", "rule": "all", "courses": [{"code": "ABC 1", "units": 39}]}]}
waiver = "X\n(Academic Plan E011111C)\nNote: The following LACCD GE Area 4a (3 units) and Area 7 (3 units) are " \
         "waived for this degree.\n(Academic Plan E022222C)"
new, notes = R.reconcile(rec, waiver, E.COLLEGE, "A.S. Degree")
check(new["program"]["ge_units"] == {"min": 21, "max": 21} and [n["field"] for n in notes] == ["ge_units"],
      "the waiver takes the plan's 27 to 21 (set with was)")
new, notes = R.reconcile(rec, waiver, E.COLLEGE, "A.S. T Degree")
check(new["program"]["ge_units"] == {"min": 27, "max": 27}, "a transfer degree takes no local waiver")
later = "X\n(Academic Plan E011111C)\nNo note.\n(Academic Plan E022222C)\nNote: The following LACCD GE Area 4a " \
        "(3 units) and Area 7 (3 units) are waived for this degree."
check(R.reconcile(rec, later, E.COLLEGE, "A.S. Degree")[1] == [], "the next program's waiver is not this one's")

# ── the plan's receipt, once written: its rows and the committed records agree with the hand ──
receipts = sorted(glob.glob(os.path.join(HERE, "..", "kb", "receipts", "program_requirement_records_piles_ela_*.json")))
moved = {}
if receipts:
    with open(receipts[-1], encoding="utf-8") as fh:
        body = json.load(fh)
    moved = {r["control_number"]: r for r in body["records"]}
    check(not body["moved_against_the_hand_not_planned"], "no record moved against the hand")
    images = E.GP.images_now(E.COLLEGE)
    for cn, r in moved.items():
        f = E.now(cn)
        want = E.hand_answer(cn)
        live = E.S.passes_live(f["score"])
        check((want == "passes" and live) or (want == "gap" and not live and bool(f["score"].get("gaps"))),
              "%s's committed record reads the hand's answer (%s)" % (cn, want))
        check(r["after_image"]["record"] == images[cn]["record"] and r["after_image"]["checks"] == images[cn]["checks"],
              "%s's after-image is its committed record's load image" % cn)
    check(sorted(moved) == sorted(cn for cn in members if E.hand_answer(cn) in ("passes", "gap")),
          "the plan's rows are the hand's passes and gap: %s" % sorted(moved))

if failures:
    print("FAIL: %d" % len(failures))
    for f in failures:
        print("  -", f)
    sys.exit(1)
print("ok: S714 cheap piles at East Los Angeles (%d checks; %d plan rows)" % (checks[0], len(moved)))
