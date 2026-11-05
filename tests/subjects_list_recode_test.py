#!/usr/bin/env python3
"""kb/_subjects_list_recode.py on fixtures: the planner keeps the number, gap-fills a slot an earlier
re-mint vacated, lets a row return to an id it held itself, moves only Media Production off FTVE (the
curator's overlay naming the discipline), refuses a plan the seed or the live picks disagree with, and the
seed edit ends the fan-in pair on both entries."""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "kb"))
import _subjects_list_recode as slr  # noqa: E402

fails = []


def check(ok, msg):
    print(("ok   " if ok else "FAIL ") + msg)
    if not ok:
        fails.append(msg)


def rec(disc, title="T", **kw):
    r = {"discipline": disc, "common_title": title}
    r.update(kw)
    return r


SEED = {d: {"canonical_subj4": a} for d, a, b, kind in slr.RECODES}
SEED["Film and Media Studies"] = {"canonical_subj4": "FTVE", "fan_in_with": ["Media Production"], "_fan_in_note": "n"}
SEED["Media Production"].update({"fan_in_with": ["Film and Media Studies"], "_fan_in_note": "n"})
PICKS = {d: {"code": b, "note": f"note for {d}"} for d, a, b, kind in slr.RECODES}
PICKS["Film and Media Studies"] = {"code": "FTVE"}

COURSES = {
    "GRAF M1001": rec("Graphic Arts"),
    "GRAF M1002": rec("Art", "an Art stray on GRAF"),
    "PLGL M1001": rec("Legal Assisting"),                            # PARA M1001 was vacated by an earlier re-mint
    "AUTD M9002": rec("Diesel Mechanics", _subj4_remint_from="DIES M9002"),   # held DIES M9002 itself
    "FTVE M1001": rec("Film and Media Studies"),
    "FTVE M1002": rec("Media Production"),
    "FTVE M1003": rec("Film and Media Studies", "filed under Media Production by a curator"),
    "MATH M1001": rec("Mathematics"),
}
SINGLES = {"NRSV M90AA": rec("Licensed Vocational Nursing")}
CURATIONS = {"FTVE M1003": {"discipline": "Media Production"}, "MATH M1001": {"merge_into": "GRAF M1001"}}
VACATED = {"PARA M1001", "DIES M9002"}

plan = slr.compute_plan(COURSES, SINGLES, CURATIONS, SEED, PICKS, {}, vacated=VACATED)
al = plan["alias"]
check(all(v["pass"] for v in plan["validation"].values()), "every gate passes on a consistent fixture: %r"
      % {k: v for k, v in plan["validation"].items() if not v["pass"]})
check(al.get("GRAF M1001") == "GFCD M1001", "a free slot keeps its number")
check(al.get("GRAF M1002") == "GFCD M1002" and plan["moves"]["GRAF M1002"]["off_discipline"],
      "the whole namespace moves; an off-discipline row goes with it, flagged")
check(plan["moves"]["GRAF M1002"]["discipline"] == "Art", "a moved row keeps its own discipline")
check(al.get("PLGL M1001", "").startswith("PARA M1") and al["PLGL M1001"] != "PARA M1001",
      "a slot an earlier re-mint vacated is gap-filled, not reused: %r" % al.get("PLGL M1001"))
check(al.get("AUTD M9002") == "DIES M9002" and plan["moves"]["AUTD M9002"]["how"] == "returned home",
      "a row takes back an id it held itself")
check("FTVE M1001" not in al, "Film keeps FTVE")
check(al.get("FTVE M1002") == "FMED M1002", "Media Production leaves FTVE for FMED")
check(al.get("FTVE M1003") == "FMED M1003" and plan["moves"]["FTVE M1003"]["discipline"] == "Film and Media Studies",
      "the curator's overlay names the discipline that moves; the file's field is left as it is")
check(al.get("NRSV M90AA") == "VNRS M90AA", "a singleton moves with its namespace")
check("MATH M1001" not in al, "an unrelated row stays")

bad_seed = dict(SEED, **{"Graphic Arts": {"canonical_subj4": "GRFX"}})
p2 = slr.compute_plan(COURSES, SINGLES, CURATIONS, bad_seed, PICKS, {})
check(not p2["validation"]["V0_the_plan_matches_seed_and_picks"]["pass"], "a seed holding another code refuses the plan")
bad_picks = dict(PICKS, **{"Graphic Arts": {"code": "GRPH"}})
p3 = slr.compute_plan(COURSES, SINGLES, CURATIONS, SEED, bad_picks, {})
check(not p3["validation"]["V0_the_plan_matches_seed_and_picks"]["pass"], "a live pick that moved since refuses the plan")
taken = dict(SEED, **{"Mathematics": {"canonical_subj4": "PARA"}})
p4 = slr.compute_plan(COURSES, SINGLES, CURATIONS, taken, PICKS, {})
check(not p4["validation"]["V0_the_plan_matches_seed_and_picks"]["pass"], "a new code another discipline owns refuses the plan")
more = dict(PICKS, **{"Mathematics": {"code": "MTHS"}})
p5 = slr.compute_plan(COURSES, SINGLES, CURATIONS, dict(SEED, Mathematics={"canonical_subj4": "MATH"}), more, {})
check(not p5["validation"]["V0_the_plan_matches_seed_and_picks"]["pass"], "a live pick the plan does not carry refuses it")

done = dict(COURSES, **{"GFCD M1001": rec("Graphic Arts", **{slr.STAMP: "GRAF M1001"})})
del done["GRAF M1001"]
p6 = slr.compute_plan(done, SINGLES, CURATIONS, SEED, PICKS, {})
check(not p6["validation"]["P0_not_applied"]["pass"], "a stamped row means the recode already ran")

doc = slr.seed_edit({"disciplines": SEED}, PICKS)["disciplines"]
check(doc["Graphic Arts"]["canonical_subj4"] == "GFCD" and doc["Graphic Arts"]["_notes"] == "note for Graphic Arts",
      "the seed takes the new code and Sam's note")
check("fan_in_with" not in doc["Media Production"] and "fan_in_with" not in doc["Film and Media Studies"]
      and "_fan_in_note" not in doc["Film and Media Studies"], "the fan-in pair ends on both entries")
check(SEED["Media Production"].get("fan_in_with") == ["Film and Media Studies"], "the edit works on a copy")

if fails:
    print("\n%d check(s) failed" % len(fails))
    sys.exit(1)
print("\nall checks passed")
