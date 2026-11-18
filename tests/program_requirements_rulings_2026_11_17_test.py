#!/usr/bin/env python3
"""Sam's three rulings of 2026-11-17 (docs/reference/sam_rulings.md; COBIx on #3461, "Sam's rulings"; final):

  1. "Let major courses count toward general education for local degrees too": a local degree whose major
     matches the catalog exactly, and whose major and general education run past the degree total, takes
     ge_overlap in the reconcile stage (local_degree_ge_overlap) and passes as overlap, as a transfer degree does.
  2. "Pass short high ends the same way as over-high ends": a printed unit range whose low end the sum meets
     exactly, the high end short, passes as short_high (the scorer, beside Sheet 120 card 1's meets).
  3. The general education open slot (correction step 4 of #3461): a line naming a general education area and its
     units is kept as an open slot, only when the printed total includes general education, and only when the
     slots bring the sum to that total exactly. Tested on Chaffey Physical Therapist Assistant (42987), Los Angeles
     Harbor Nursing RN (02790), Riverside Registered Nursing (38259) and Ventura Veterinary Assistant (39995), each
     from its committed record and page lines as ge-slot-rule-test.md on #3464 quotes them.

Stdlib only; committed records only."""
import copy
import glob
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_requirements_reconcile as R  # noqa: E402
import _program_requirements_rescore as RS  # noqa: E402
import _program_requirements_score as S  # noqa: E402

results = []


def check(name, cond):
    results.append((name, bool(cond)))


def filed(college_dir, cn):
    with open(os.path.join(ROOT, "kb", "program_requirements_college", college_dir, "records", cn + ".json")) as fh:
        f = json.load(fh)
    rec = copy.deepcopy(f["record"])
    # A later reconcile run may file the slots; the test starts from the record as the model read it.
    rec["blocks"] = [b for b in rec.get("blocks") or [] if not b.get("ge_area_slot")]
    return f, rec


def closed_of(rec, extra=None):
    """A closed list carrying every course's own units (what the state file prints for these programs)."""
    out = [{"code": c["code"], "units": c.get("units")} for b in rec.get("blocks") or [] for c in b.get("courses") or []]
    return out + [{"code": k, "units": v} for k, v in (extra or {}).items()]


def course_lines(rec, skip=()):
    lines = []
    for b in rec.get("blocks") or []:
        lines.append(b.get("name") or "")
        for c in b.get("courses") or []:
            if c["code"] in skip:
                continue
            lines.append("%s\tCourse title\t%s" % (c["code"], c.get("units") if c.get("units") is not None else ""))
    return lines


# ── ruling 2: a short high end ──────────────────────────────────────────────────────────────────────────────────────
print("ruling 2: a short high end passes as an over-high end does")
v = S.program_verdict({"measure": "units"}, (37.0, 40.0), 37.0, 38.0)
check("Citrus 42170's shape: 37-38 against a printed 37-40 passes as short_high", v["pass"] and v.get("short_high"))
check("the over-high end still passes as meets (Sheet 120 card 1)",
      S.program_verdict({"measure": "units"}, (24.0, 24.0), 24.0, 25.0).get("meets"))
check("a low end short of the printed low end still fails (36-38 against 37-40)",
      not S.program_verdict({"measure": "units"}, (37.0, 40.0), 36.0, 38.0)["pass"])
check("a low end past the printed low end still fails (38-39 against 37-40)",
      not S.program_verdict({"measure": "units"}, (37.0, 40.0), 38.0, 39.0)["pass"])
check("a single printed figure is no range: 37 against 37-37 is equal, never short_high",
      not S.program_verdict({"measure": "units"}, (37.0, 37.0), 37.0, 37.0).get("short_high"))
check("an hours range stays out of the ruling (108 against 108-216 hours fails)",
      not S.program_verdict({"measure": "hours"}, (108.0, 216.0), 108.0, 108.0)["pass"])
d = S.degree_verdict({}, (68.5, 74.5), 68.5, 68.5, "A.S. Degree")
check("a degree range (Butte 35937's shape, 68.5 against 68.5-74.5) passes as short_high",
      d["pass"] and d.get("short_high"))
rec = {"program": {"measure": "units", "total_units": {"min": 18, "max": 21}},
       "blocks": [{"name": "Required", "rule": "all", "courses": [{"code": "HIST 1", "units": 3},
                                                                    {"code": "HIST 2", "units": 3}]},
                  {"name": "List A", "rule": "choose_units", "stated": {"min": 12, "max": 12}, "courses": []}]}
a = S.score(rec, [{"code": "HIST 1", "units": 3}, {"code": "HIST 2", "units": 3}], None, "A.A. Degree")["arithmetic"]
check("score() carries short_high on the arithmetic", a["pass"] and a.get("short_high") and a["computed"] == [18.0, 18.0])

# ── ruling 1: a local degree's major counts toward general education ───────────────────────────────────────────────
print("ruling 1: a local degree's major counts toward general education")
MAJ = [{"code": "ART %d" % i, "units": 3} for i in range(1, 12)]   # 33 units, Ventura Ceramics 06972's shape


def local(total=33, ge=24, de=6, extra_alt=False, **prog):
    courses = [dict(c) for c in MAJ]
    if extra_alt:
        courses[0]["alternatives"] = [{"code": "ART 99", "units": 5}]
    return {"program": dict({"measure": "units", "total_units": {"min": total, "max": total},
                             "degree_total": {"min": 60, "max": 60}, "ge_units": {"min": ge, "max": ge} if ge else None,
                             "degree_elective_units": {"min": de, "max": de}, "ge_pattern": "VCCCD GE"}, **prog),
            "blocks": [{"name": "Required Core", "rule": "all", "courses": courses}]}


before = S.score(local(), MAJ, None, "A.A. Degree")["arithmetic"]
check("as read, 33 + 24 + 6 = 63 against 60 fails with the major matching",
      not before["pass"] and before["against"] == "degree" and R.plain_equal(before["major"]))
new, notes = R.reconcile(local(), "Total Major Units 33", "Ventura College", "A.A. Degree", closed=MAJ)
after = S.score(new, MAJ, None, "A.A. Degree")["arithmetic"]
check("the reconcile stage sets ge_overlap with a statewide note naming the ruling",
      new["program"].get("ge_overlap") is True and [n["statewide"] for n in notes] == ["local_degree_ge_overlap"]
      and "2026-11-17" in notes[0]["words"] and "63" in notes[0]["words"])
check("and the record then passes, its degree check as overlap", after["pass"] and after["degree"].get("overlap"))
check("without the closed list nothing changes",
      R.reconcile(local(), "Total Major Units 33", "Ventura College", "A.A. Degree")[1] == [])
check("a transfer degree is left to the overlap it already reads",
      R.local_overlap_hold(local()["program"], "A.A- T Degree", before) is not None)
check("a certificate is left alone", R.reconcile(local(), "x", "Ventura College", "Certificate of Achievement",
                                                  closed=MAJ)[1] == [])
loose = S.score(local(extra_alt=True), MAJ, None, "A.A. Degree")["arithmetic"]
check("a major that meets its total only by the over-high reading (33-35 against 33) is held",
      R.local_overlap_hold(local(extra_alt=True)["program"], "A.A. Degree", loose) is not None)
short = local(ge=None, de=0, ge_pattern=None)
sa = S.score(short, MAJ, None, "A.A. Degree")["arithmetic"]
check("a major-only record short of the 60 (33 against 60) is held: overlap cannot close a short sum",
      R.reconcile(short, "x", "Ventura College", "A.A. Degree", closed=MAJ)[1] == []
      and "cannot close" in R.local_overlap_hold(short["program"], "A.A. Degree", sa))
check("a record that already carries ge_overlap is not set again",
      R.reconcile(local(ge_overlap=True), "x", "Ventura College", "A.A. Degree", closed=MAJ)[1] == [])

# The filed records the rescore moved under ruling 1 carry the field and the note.
moved = []
for path in glob.glob(os.path.join(ROOT, "kb", "program_requirements_college", "*", "records", "*.json")):
    with open(path) as fh:
        f = json.load(fh)
    if ((f.get("score") or {}).get("arithmetic") or {}).get("rescored") == RS.RULING_LOCAL_OVERLAP:
        moved.append(f)
check("the rescore moved local degrees under ruling 1 (%d filed)" % len(moved), len(moved) >= 70)
check("each carries ge_overlap and the statewide note, so it can be undone",
      all(f["record"]["program"].get("ge_overlap") is True
          and any(n.get("statewide") == "local_degree_ge_overlap" for n in f.get("reconciled") or []) for f in moved))
check("each is a local degree whose major matched exactly",
      all(R.awards_match("local", f.get("award")) and R.plain_equal(f["score"]["arithmetic"]["major"]) for f in moved))

# ── ruling 3: the general education open slot ──────────────────────────────────────────────────────────────────────
print("ruling 3: the general education open slot")


def slot_run(college, cn, college_name, text, closed_extra=None, rec=None):
    f, own = filed(college, cn)
    rec = rec or own
    closed = closed_of(rec, closed_extra)
    new, notes = R.reconcile(rec, text, college_name, f["award"], closed=closed)
    return f, rec, new, notes, S.score(new, closed, text, f["award"])["arithmetic"]


# Chaffey Physical Therapist Assistant (42987): three 3-unit area lines inside the prerequisites block, Total 65.
f, rec = filed("chaffey", "42987")
lines = course_lines(rec)
at = lines.index("Choose one:")
chaffey = "\n".join(["Program Requirements"] + lines[:at] + [
    "GE Area 1B: Oral Communication and Critical Thinking\t3.00",
    "GE Area 3: Arts and Humanities\t3.00",
    "GE Area 6: Ethnic Studies\t3.00"] + lines[at:] + ["Total: 65.00"])
f, rec, new, notes, a = slot_run("chaffey", "42987", "Chaffey College", chaffey)
slots = [b for b in new["blocks"] if b.get("ge_area_slot")]
check("Chaffey 42987: 56 against 65 takes three 3-unit slots and meets 65 exactly",
      f["score"]["arithmetic"]["computed"] == [56.0, 56.0] and len(slots) == 3
      and all(b["stated"] == {"min": 3, "max": 3} and b["courses"] == [] for b in slots)
      and a["pass"] and a["computed"] == [65.0, 65.0] and R.plain_equal(a))
check("Chaffey 42987: one statewide note names the three lines and the ruling",
      [n["statewide"] for n in notes] == ["ge_area_slot"] and len(notes[0]["now"]) == 3
      and "Ethnic Studies" in notes[0]["words"] and "2026-11-17" in notes[0]["words"])
check("Chaffey 42987: without the closed list nothing changes",
      R.reconcile(rec, chaffey, "Chaffey College", f["award"])[1] == [])

# Los Angeles Harbor Nursing RN (02790): three area lines in the semester blocks; Area 4A printed as waived.
f, rec = filed("los_angeles_harbor", "02790")
blocks = []
for b in rec["blocks"]:
    blocks.append([b["name"]] + ["%s\tCourse\t%s" % (c["code"], c["units"]) for c in b["courses"]])
blocks[0].append("Mathematical Concepts and Quantitative Reasoning, LACCD GE Area 2 (3)")
blocks[2].append("Arts and Humanities LACCD GE Area 3 (3)")
blocks[4].append("Ethnic Studies LACCD GE Area 6 (3)")
waived = "American Institutions LACCD GE Area 4A (3) is waived for nursing degrees (AP 4100)."
harbor = "\n".join(["Degrees and Certificates – NURSING AND HEALTH PROFESSIONS", "Nursing Professional RN"]
                   + [ln for blk in blocks for ln in blk] + [waived, "Total Major Units 73"])
f, rec, new, notes, a = slot_run("los_angeles_harbor", "02790", "Los Angeles Harbor College", harbor)
check("Harbor 02790: 64 against 73 takes the three area slots, never the waived Area 4A, and meets 73",
      f["score"]["arithmetic"]["computed"] == [64.0, 64.0]
      and len([b for b in new["blocks"] if b.get("ge_area_slot")]) == 3 and a["pass"] and a["computed"] == [73.0, 73.0]
      and not any("4A" in b["name"] for b in new["blocks"] if b.get("ge_area_slot")))
unwaived = harbor.replace(waived, "American Institutions LACCD GE Area 4A (3)")
check("Harbor 02790: the same page with Area 4A as a fourth slot comes to 76, not 73, and the record is left alone",
      R.reconcile(rec, unwaived, "Los Angeles Harbor College", f["award"], closed=closed_of(rec))[1] == [])

# Riverside Registered Nursing (38259): two "Choose one course from RCCD GE Area" lines, figure in the next cell.
f, rec = filed("riverside_city", "38259")
riverside = "\n".join(["Registered Nursing - Associate of Science Degree - AS921/AS921C", "Required Courses Units: 71.00"]
                      + course_lines(rec) + ["Choose one course from RCCD GE Area 3: Arts & Humanities", "3.00",
                                             "Choose one course from RCCD GE Area 6: Ethnic Studies", "3.00",
                                             "Total : 71.00"])
f, rec, new, notes, a = slot_run("riverside_city", "38259", "Riverside City College", riverside)
check("Riverside 38259: 65 against 71 takes the two slots (the figure on the line below) and meets 71",
      f["score"]["arithmetic"]["computed"] == [65.0, 65.0]
      and len([b for b in new["blocks"] if b.get("ge_area_slot")]) == 2 and a["pass"] and a["computed"] == [71.0, 71.0])
check("Riverside 38259: the area number is never taken for the units (no figure printed, no slot)",
      R.ge_area_slots(rec, riverside.replace("\n3.00\n", "\n")) == [])

# Ventura Veterinary Assistant (39995): one slot; the BIOL C1001 & C1001L pair keeps the sum a unit over.
f, rec = filed("ventura", "39995")
lines = course_lines(rec, skip=("BIOL C1001L",))
lines[lines.index("BIOL C1001\tCourse title\t4")] = "BIOL C1001 & C1001L\tIntroduction to Biology and Lab\t4"
ventura = "\n".join(["Course List"] + lines + ["One course from: VCCCD GE Area 1b, 6 or 7\t3",
                                               "Required Core Units\t27.5", "Total Units for the Certificate\t44.5"])
f, rec, new, notes, a = slot_run("ventura", "39995", "Ventura College", ventura, closed_extra={"BIOL C1001L": 1})
check("Ventura 39995 as filed: 42.5 + the 3-unit slot is 45.5 against 44.5, so the record is left alone",
      f["score"]["arithmetic"]["computed"] == [42.5, 42.5] and notes == [] and new is rec
      and R.ge_area_slots(rec, ventura) == [{"words": "One course from: VCCCD GE Area 1b, 6 or 7\t3", "units": (3.0, 3.0)}])
lab0 = copy.deepcopy(rec)
for b in lab0["blocks"]:
    for c in b["courses"]:
        if c["code"] == "BIOL C1001L":
            c["units"] = 0
f, rec2, new, notes, a = slot_run("ventura", "39995", "Ventura College", ventura, closed_extra={"BIOL C1001L": 1}, rec=lab0)
check("Ventura 39995 with the lab counted inside its pair (0): the slot meets 44.5 exactly",
      len([b for b in new["blocks"] if b.get("ge_area_slot")]) == 1 and a["pass"] and a["computed"] == [44.5, 44.5])

# The gate: only where the printed total includes general education.
f, rec = filed("chaffey", "42987")
deg = copy.deepcopy(rec)
deg["program"]["degree_total"] = {"min": 65, "max": 65}
deg["program"]["ge_units"] = {"min": 21, "max": 21}
check("a record counting general education beside a degree total takes no slot (the total may leave the area out)",
      R.ge_area_slot_fill(deg, chaffey, lambda r: S.score(r, closed_of(rec), chaffey, f["award"]))[1] == [])
named = chaffey.replace("GE Area 3: Arts and Humanities\t3.00", "PSYCH 25 (GE Area 3: Arts and Humanities)\t3.00")
check("a line printing one of the record's own courses is no slot",
      len(R.ge_area_slots(rec, named)) == 2)
check("a page whose total line is missing gives no window and no slot",
      R.ge_area_slots(rec, chaffey.replace("Total: 65.00", "")) == [])
check("a passing record is left alone",
      R.ge_area_slot_fill(rec, chaffey, lambda r: {"arithmetic": {"pass": True}})[1] == [])
check("a filed slot note stands while the record carries the slots",
      R.statewide_note_stands({"statewide": "ge_area_slot"}, new)
      and not R.statewide_note_stands({"statewide": "ge_area_slot"}, rec))

failed = [n for n, ok in results if not ok]
for n, ok in results:
    print(("ok   " if ok else "FAIL ") + n)
print("%d/%d checks passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
