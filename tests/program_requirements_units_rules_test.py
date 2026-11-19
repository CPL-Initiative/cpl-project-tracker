#!/usr/bin/env python3
"""The units rules (Commons Clarity's Part A: A1, A4, A5, A6, A8) keep a correction only when it lands exactly.

WHY. kb/_program_requirements_units_rules.py moves filed records from "units unequal" to passing with free
corrections, and the live UPDATE follows its receipt. A correction that fires where the page did not say it,
or a sum computed without the closed list's units, would pass a record the catalog does not support. Pinned on
fixtures, never on the committed records:

  * each correction fires on its own pattern and lands the fixture's sum on the printed total;
  * the self-check keeps a record as filed when the corrected sum misses the total at either end;
  * A1 never grants an electives fill (the page text would have to confirm it);
  * a record whose sum the committed files cannot reproduce exactly is left alone;
  * the collection lane's colleges are left out (kb/collection_lane.py), and S681's plan names records at the
    seven colleges S680's lane released alone (none S680 planned, none tonight's lane holds);
  * A5 is off on every further record (d-a5-five-rows-stay-applied-s680);
  * a paired alternative needs evidence a note does not contradict: the seven College of the Desert
    work-experience groups never plan as pairs, and the pair call agrees with every record note that holds an
    answer (S683, #3508 round two's item 1);
  * every unit A4 writes agrees with the state's course file (unified_courses_members.js): a record that would
    break it stays as filed, and Long Beach City 44747's BIO 60L (4-5 against the file's 1) is corrected (item 2);
  * A11's named gaps: a general-education pattern certificate by its title, a program the state lists twice,
    and neither at a college the collection lane holds.

Run from repo root: python3 tests/program_requirements_units_rules_test.py
"""
import collections
import copy
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_requirements_units_rules as U  # noqa: E402
import _harvest_gap_census as G  # noqa: E402
import collection_lane as CL  # noqa: E402

checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


def filed(blocks, total, award="Certificate of Achievement", college="Butte College", program=None):
    rec = {"program": dict({"measure": "units", "total_units": {"min": total[0], "max": total[1]}}, **(program or {})),
           "blocks": blocks}
    a = U.arith(rec, award)
    return {"college": college, "control_number": "1", "award": award, "extracted_run": "9", "record": rec,
            "score": {"arithmetic": dict(a, status="unequal", pass_=False)}}


def course(code, units=None, units_max=None, alts=None):
    c = {"code": code}
    if units is not None:
        c["units"] = units
    if units_max is not None:
        c["units_max"] = units_max
    if alts is not None:
        c["alternatives"] = alts
    return c


# A4: a blank "or" alternative takes its row's units.
f = filed([{"name": "Required", "rule": "all",
            "courses": [course("ESTH 142", 4, alts=[{"code": "ESTH 144", "units": None}]), course("ESTH 150", 3)]}],
          (7, 7))
f["score"]["arithmetic"]["computed"] = [5.0, 7.0]   # the filed run read ESTH 144 at 2 from its closed list
j = U.judge(f, {})
check(j["rule"] == "A4" and U.lands(j["arith"]), "A4 fills the blank alternative and lands (%s)" % j.get("rule"))
check(j["record"]["blocks"][0]["courses"][0]["alternatives"][0]["units"] == 4, "A4 copies the row's units")
# A4's lab: printed with no units right after its lecture, it counts 0.
f = filed([{"name": "Required", "rule": "all", "courses": [course("BIOL C1001", 4), course("BIOL C1001L")]}], (4, 4))
f["score"]["arithmetic"].update(status="unequal", computed=[5.0, 5.0])
j = U.judge(f, {})
check(j["rule"] == "A4" and j["record"]["blocks"][0]["courses"][1]["units"] == 0, "A4 counts a blank lab after its lecture 0")

# A6: a choose list printed with the sum of every option (Chaffey History's pattern).
blocks = [{"name": "Core", "rule": "all", "courses": [course("HIST 1", 3), course("HIST 2", 3)]},
          {"name": "List A - Group 1", "rule": "choose_courses", "minimum": 1, "stated": {"min": 9, "max": 9},
           "courses": [course("HIST 10", 3), course("HIST 11", 3), course("HIST 12", 3)]}]
f = filed(blocks, (9, 9), award="A.A.-T Degree")
check(U.arith(f["record"], f["award"])["computed"] == [15.0, 15.0], "the fixture fails as filed, 15 against 9")
check(not U.A6_ON and U.judge(f, {})["rule"] is None, "A6 is off (F5): its record stays as filed")
new6, notes6 = U.a6_sum_of_options(f["record"])
check(notes6 and U.arith(new6, f["award"])["computed"] == [9.0, 9.0], "A6's code still drops the summed figure")
# A6 never fires when the printed figure is not the sum of every option.
b2 = copy.deepcopy(blocks)
b2[1]["stated"] = {"min": 6, "max": 6}
check(not U.a6_sum_of_options({"blocks": b2})[1], "A6 leaves a list printing a real figure alone")

# A5: "any course from List A not already used".
blocks = [{"name": "List A", "rule": "choose_courses", "minimum": 1, "courses": [course("ECON 1", 3), course("ECON 2", 4)]},
          {"name": "List B: Select two courses. Any course from LIST A not already used", "rule": "choose_courses",
           "minimum": 2, "courses": [course("FSM 35", 4), course("HSP 1", 4)]}]
f = filed(blocks, (10, 12), award="A.S.-T Degree")
check(U.arith(f["record"], f["award"])["computed"] == [11.0, 12.0], "the fixture fails as filed, 11-12 against 10-12")
check(not U.A5_ON and U.judge(f, {})["rule"] is None,
      "A5 is off on every further record (d-a5-five-rows-stay-applied-s680): its record stays as filed")
U.A5_ON = True
try:
    j = U.judge(f, {})
finally:
    U.A5_ON = False
check(j["rule"] == "A5" and j["arith"]["computed"] == [10.0, 12.0], "A5's code still adds List A's courses and lands")

# The self-check: a correction that does not land leaves the record as filed.
blocks6 = copy.deepcopy([{"name": "Core", "rule": "all", "courses": [course("HIST 1", 3), course("HIST 2", 3)]},
                         {"name": "Pick", "rule": "choose_courses", "minimum": 1, "stated": {"min": 9, "max": 9},
                          "courses": [course("HIST 10", 3), course("HIST 11", 3), course("HIST 12", 3)]}])
f = filed(blocks6, (8, 8))
check(U.judge(f, {})["rule"] is None, "a correction that misses the total keeps the record as filed")

# A1 refuses an electives fill: the page would have to name the electives.
f = filed([{"name": "Required", "rule": "all", "courses": [course("BUS 1", 3)]}], (12, 12),
          program={"electives_fill_degree": True})
check(U.judge(f, {})["rule"] is None, "A1 never grants an electives fill without page text")
# A1 passes a record today's rules pass as filed (a low end that meets the printed total exactly).
f = filed([{"name": "Required", "rule": "all", "courses": [course("BUS 1", 3), course("BUS 2", 3, 4)]}], (6, 6))
check(U.judge(f, {})["rule"] == "A1", "A1 rescores a record today's rules pass")

# Exactness: a record whose sum used the closed list's units, which the committed files lack, is left alone.
f = filed([{"name": "Required", "rule": "all", "courses": [course("BUS 1", 3), course("BUS 9")]}], (6, 6))
f["score"]["arithmetic"].update(computed=[6.0, 6.0], status="unequal")
check(not U.exact(f, f["record"]), "a sum the committed files cannot reproduce is not exact")

# A8: the college's own general education total, where every filed local degree carries one figure.
deg = {"degree_total": {"min": 60, "max": 60}}
files = [{"college": "Butte College", "award": "A.S. Degree",
          "record": {"program": {"ge_units": {"min": 21, "max": 21}}}} for _ in range(3)]
ge = U.college_ge_totals(files)
check(ge.get("Butte College") == (21.0, 21.0), "a college whose local degrees carry one general education total")
check(not U.college_ge_totals(files[:2]), "fewer than three records name no college total")
rec = {"program": dict(deg, measure="units", degree_elective_units={"min": 18, "max": 18}),
       "blocks": [{"name": "Major", "rule": "all", "courses": [course("AG %d" % i, 3) for i in range(7)]}]}
new, notes = U.a8_college_ge(rec, "A.S. Degree", ge["Butte College"])
check(notes and U.lands(U.arith(new, "A.S. Degree")), "A8 gives the degree its college total and lands at 60")
check(not U.a8_college_ge(rec, "A.S.-T Degree", ge["Butte College"])[1], "A8 never fills a transfer degree")

# The collection lane's colleges are left out.
check(U.held("Lassen College") and U.held("Santiago Canyon College") and not U.held("Crafton Hills College")
      and not U.held("College of the Siskiyous") and not U.held("Butte College") and not U.held("Golden West College"),
      "the collection lane's five colleges are held; Crafton Hills, Siskiyous, a released college and others are not")
check(len(CL.COLLECTION_LANE) == 5 and CL.COLLECTION_LANE_S680 is CL.COLLECTION_LANE,
      "one named constant holds tonight's five; the old name is an alias of it")
check(len(CL.RELEASED) == 7 and not set(CL.RELEASED) & set(CL.COLLECTION_LANE),
      "the seven released colleges, none of them in tonight's lane")
try:
    U.run(False, only=("Golden West College", "Lassen College"))
    check(False, "a run naming a college the lane holds must refuse")
except SystemExit as e:
    check("Lassen College" in str(e), "a run naming a college the lane holds refuses and names it")
# A write names its scope (second reader's C): with none it would re-plan MiraCosta 21976, held out of S680's plan.
import contextlib  # noqa: E402
import io  # noqa: E402
try:
    with contextlib.redirect_stderr(io.StringIO()):
        U.main(["--tag", "s999-scope-test"])
    check(False, "a write with no scope must refuse")
except SystemExit as e:
    check(e.code == 2, "a write with no scope refuses before it reads a record")

# A paired alternative (second reader's A): A4 never copies the row's units onto each member of a group taken
# together in the row's place (Coastline 18223's SPAN C180A and C180B for SPAN C180, 2.5 units each in the state's
# file). The state's course file is injected here, never read.
pair_rec = {"program": {"measure": "units", "total_units": {"min": 9, "max": 9}},
            "blocks": [{"name": "Core", "rule": "all", "courses": [
                course("SPAN C180", 5, alts=[{"code": "SPAN C180A", "units": None}, {"code": "SPAN C180B", "units": None}]),
                course("SPAN C280", 4)]}],
            "notes": []}
CO = "Coastline Community College"
state = {(CO, U.S.norm_code("SPAN C180A")): 2.5, (CO, U.S.norm_code("SPAN C180B")): 2.5}
new, notes = U.a4_blank_alternative(pair_rec, U.units_at(CO, state))
alts = new["blocks"][0]["courses"][0]["alternatives"]
check([a["units"] for a in alts] == [2.5, 2.5] and len({a.get("together") for a in alts}) == 1 and alts[0]["together"],
      "a pair the state's file confirms carries each member's own units, under one together label")
check(U.arith(new, "A.A. Degree")["computed"] == [9.0, 9.0], "the scorer reads the pair as one 5-unit option")
old_reading = U.arith(U.a4_blank_alternative(pair_rec, U.units_at(CO, {}))[0], "A.A. Degree")["computed"]
check(old_reading == [9.0, 9.0], "the program total is the same as the old reading's")
# Not confirmed by the file, but a record note says so: no member carries units, the group carries the row's.
noted = dict(pair_rec, notes=["SPAN C180A and SPAN C180B are a paired alternative: both together replace SPAN C180."])
new, notes = U.a4_blank_alternative(noted, U.units_at(CO, {}))
alts = new["blocks"][0]["courses"][0]["alternatives"]
check(all(a["units"] is None and a["together_units"] == 5 and a.get("together") for a in alts)
      and notes and notes[0]["together"] == "row" and "note" in notes[0]["words"],
      "a pair only a note names: the group carries the row's 5 units, no member its own, and the note says so")
check(U.arith(new, "A.A. Degree")["computed"] == [9.0, 9.0] and U.self_contained(new), "and it sums exactly")
# State figures that do not add up to the row, and no note: two standalone options, as before.
off = {(CO, U.S.norm_code("SPAN C180A")): 5, (CO, U.S.norm_code("SPAN C180B")): 5}
new, _ = U.a4_blank_alternative(pair_rec, U.units_at(CO, off))
check(all(a["units"] == 5 and not a.get("together") for a in new["blocks"][0]["courses"][0]["alternatives"]),
      "two alternatives each worth the row stay two options")
check(not U._notes_pair({"notes": ["DANC 131 and DANC 132 appear both as the 'or' choice"]}, ["DANC 131", "DANC 132"]),
      "'both' alone names no pair (Cerritos 38756)")

# S683, #3508 round two's item 1: a sum inside the row's printed range is a pair only where no note says "or" about
# a member and each member alone is worth less than the row's low figure. Fixtures first, then the seven College of
# the Desert work-experience groups the old rule called pairs, read from the committed records and the state's file.
CD = "College of the Desert"
wx = {"program": {"measure": "units", "total_units": {"min": 4, "max": 4}},
      "blocks": [{"name": "Electives", "rule": "all", "courses": [
          course("AGEH 095A", 1, 4, alts=[{"code": "BUAC 095A", "units": None}, {"code": "CIS 095A", "units": None}])]}],
      "notes": ["AGEH 095A carries the note. BUAC 095A and CIS 095A are printed as 'or' options with no units."]}
wx_state = {(CD, U.S.norm_code(c)): 1 for c in ("AGEH 095A", "BUAC 095A", "CIS 095A")}
check(U.paired_group(wx, wx["blocks"][0]["courses"][0], U.units_at(CD, wx_state)) == (None, []),
      "a note saying 'or' about the members keeps a sum inside the range from reading as a pair")
check(U.paired_group(dict(wx, notes=[]), wx["blocks"][0]["courses"][0], U.units_at(CD, wx_state)) == (None, []),
      "members each worth the row's low figure are choices, with no note (College of the Desert 41319)")
chem = {"program": {}, "notes": [], "blocks": [{"courses": [
    course("CHEM 0001A", 5, 6, alts=[{"code": "CHEM 0003A", "units": None}, {"code": "CHEM 0003B", "units": None}])]}]}
SI = "Sierra College"
check(U.paired_group(chem, chem["blocks"][0]["courses"][0],
                     U.units_at(SI, {(SI, U.S.norm_code("CHEM 0003A")): 3, (SI, U.S.norm_code("CHEM 0003B")): 3}))[0]
      == "state", "two members of 3 inside a 5-6 row, no note saying 'or', still read as a pair")
seven = [("36127", "AGEH 095A"), ("36128", "AGEH 095A"), ("36129", "AGEH 095A"), ("36130", "AGEH 095A"),
         ("36131", "AGEH 095A"), ("41319", "AIS 095A"), ("43625", "AIS 095A")]
st_file = U.state_units()
seen_groups = 0
for cn, row in seven:
    p = os.path.join(ROOT, "kb", "program_requirements_college", "college_of_the_desert", "records", cn + ".json")
    with open(p, encoding="utf-8") as fh:
        d = __import__("json").load(fh)
    rows = [c for b in d["record"].get("blocks") or [] for c in b.get("courses") or [] if c.get("code") == row]
    seen_groups += len(rows)
    for c in rows:
        check(U.paired_group(d["record"], c, U.units_at(CD, st_file)) == (None, []),
              "College of the Desert %s: %s and its 'or' alternatives never plan as a pair" % (cn, row))
    new, notes = U.a4_blank_alternative(d["record"], U.units_at(CD, st_file))
    check(not any(n.get("together") for n in notes), "College of the Desert %s: A4 names no group" % cn)
check(seen_groups == 7, "the seven College of the Desert groups are all read (%d)" % seen_groups)
# S683, #3508 round two's second reader: the note-pair call is off on every further record. A regex over the notes
# made the call and held its answer, so it scored itself right and read mixed "and"/"or" choices as one group. The
# six records the reader named plan no row and form no group; the three S681 rows whose group rests on a note stay
# as planned; a fresh run at the released colleges plans nothing beyond the 14.
check(U.NOTE_PAIR_ON is False and len(U.NOTE_PAIR_KEPT) == 3, "the note-pair call is off, three planned rows kept")
files_all = [d for _, d in U.load_files()]
by_key = {(d["college"], str(d["control_number"])): d for d in files_all}
ge_all = U.college_ge_totals(files_all)
for c, n, row, members in U.HAND_HELD_START:
    d = by_key.get((c, n))
    check(d is not None, "%s %s is a committed record outside the lane" % (c, n))
    if d is None:
        continue
    check(U.judge(d, ge_all, st_file)["rule"] is None, "%s %s plans no row" % (c, n))
    _, nn = U.a4_blank_alternative(d["record"], U.units_at(c, st_file), U.note_pairs_for(c, n))
    check(not any(x.get("together") for x in nn), "%s %s: A4 reads no group at %s" % (c, n, row))
    _, nn = U.a4_blank_alternative(d["record"], U.units_at(c, st_file), True)
    check(any(x.get("together") and set(x["code"].split(" + ")) == set(members) for x in nn),
          "%s %s: with the call on, the old rule would read %s as one group" % (c, n, " + ".join(members)))
# The score is a hand-held list, never the notes: with the six held as "not one group" and the call switched on,
# each reads wrong; switched off, each reads right. With the list empty nothing is scored wrong.
held6 = {(c, n, row): (list(m), "not one group") for c, n, row, m in U.HAND_HELD_START}
six_files = [by_key[(c, n)] for c, n, _, _ in U.HAND_HELD_START if (c, n) in by_key]
U.NOTE_PAIR_ON = True
on = U.pair_recall(six_files, st_file, held6)
U.NOTE_PAIR_ON = False
off = U.pair_recall(six_files, st_file, held6)
check(len(on["wrong"]) == 6 and on["tally"].get("pair held wrong") == 6, "the list scores the note-pair call wrong: %s" % on["tally"])
check(not off["wrong"] and off["tally"].get("or held right") == 6, "and the switched-off call right: %s" % off["tally"])
pr = U.pair_recall(files_all, st_file)
print("pair call against the hand-held list: %s" % ", ".join("%s %d" % kv for kv in pr["tally"].items()))
check(not pr["wrong"] and not pr["tally"].get("note pair, unscored"),
      "no pair call is scored wrong, and no note pair is still made: %s" % pr["tally"])
fresh = U.run(write=False, only=tuple(CL.RELEASED))
check(not fresh["moved"], "a fresh run at the released colleges plans nothing beyond the 14: %s"
      % [(m["college"], m["control_number"]) for m in fresh["moved"]][:5])
# A note-only pair at a record outside NOTE_PAIR_KEPT: no group; at a kept record, the group as planned.
np_rec = {"program": {"measure": "units", "total_units": {"min": 4, "max": 4}}, "notes": [
    "The ESTH 142 alternative is the pair ESTH 144 & ESTH 145 (part-time path), taken together."],
    "blocks": [{"name": "Required", "rule": "all", "courses": [
        course("ESTH 142", 4, alts=[{"code": "ESTH 144", "units": None}, {"code": "ESTH 145", "units": None}])]}]}
_, nn = U.a4_blank_alternative(np_rec, U.units_at("Citrus College", {}), U.note_pairs_for("Citrus College", "99999"))
check(not any(x.get("together") for x in nn), "a note-only pair at a further record reads as two options")
_, nn = U.a4_blank_alternative(np_rec, U.units_at("Citrus College", {}), U.note_pairs_for("Citrus College", "11247"))
check(any(x.get("together") == "row" for x in nn), "at Citrus 11247 the planned group stands")
# The three kept rows come out of today's A4 exactly as the plan wrote them (their committed records).
with open(os.path.join(ROOT, "kb", "receipts", "program_requirement_records_units_rules_2026-11-18_s680.json"),
          encoding="utf-8") as fh:
    s680_rows ={(r["college"], str(r["control_number"])): r for r in __import__("json").load(fh)["records"]}
for key in sorted(U.NOTE_PAIR_KEPT):
    r = s680_rows[key]
    with open(os.path.join(ROOT, r["path"]), encoding="utf-8") as fh:
        rec_now = __import__("json").load(fh)["record"]
    orig = dict(copy.deepcopy(rec_now), blocks=copy.deepcopy(r["before_image"]["record"]["blocks"]),
                program=copy.deepcopy(r["before_image"]["record"]["program"]))
    again, _ = U.a4_blank_alternative(orig, U.units_at(key[0], st_file), U.note_pairs_for(*key))
    check(again["blocks"] == rec_now["blocks"], "%s %s: today's A4 writes the planned record again" % key)

# S683, #3508 round two's item 2: the per-course self-check. Every unit A4 writes is compared with the state's file.
# A single "or" alternative given its row's 3 units where the file holds 4 is left as filed, never planned.
single = filed([{"name": "Core", "rule": "all", "courses": [
    course("ENGL C1001", 3, alts=[{"code": "ENGL C1001H", "units": None}]), course("ENGL 2", 4)]}], (7, 7),
    college="Citrus College")
single["score"]["arithmetic"]["computed"] = [6.0, 8.0]   # the filed run read ENGL C1001H from its closed list
cit ={("Citrus College", U.S.norm_code("ENGL C1001H")): 4}
new, _ = U.a4_blank_alternative(single["record"], U.units_at("Citrus College", cit))
check(U.state_differs(single["record"], new, U.units_at("Citrus College", cit))
      == [{"code": "ENGL C1001H", "written": [3.0, 3.0], "state": 4}], "the check names the course, its figure and the file's")
j = U.judge(single, {}, cit)
check(j["rule"] is None and "does not hold" in j["why"], "a record whose A4 writes a unit the file does not hold stays as filed")
check(U.judge(single, {}, {})["rule"] == "A4", "the same record moves where the file holds no figure")
check(not U.state_differs(single["record"], new, U.units_at("Citrus College", {("Citrus College", U.S.norm_code("ENGL C1001H")): 3})),
      "a unit the file holds passes")
# Long Beach City 44747: S680 gave BIO 60L its row's 4-5 where the file holds 1. The check catches S680's image, and
# the fixed A4 reads BIO 60 and BIO 60L as one option, 4 and 1 from the file, under the note that pairs them.
RC680 = os.path.join(ROOT, "kb", "receipts", "program_requirement_records_units_rules_2026-11-18_s680.json")
with open(RC680, encoding="utf-8") as fh:
    lb = [r for r in __import__("json").load(fh)["records"] if (r["college"], r["control_number"]) ==
          ("Long Beach City College", "44747")][0]
LB = "Long Beach City College"
lb_units = U.units_at(LB, st_file)
check(U.state_differs(lb["before_image"]["record"], lb["after_image"]["record"], lb_units)
      == [{"code": "BIO 60L", "written": [4.0, 5.0], "state": 1}], "S680's Long Beach City 44747 fails the per-course check")
with open(os.path.join(ROOT, lb["path"]), encoding="utf-8") as fh:
    lb_rec = __import__("json").load(fh)["record"]
orig = dict(lb_rec, blocks=copy.deepcopy(lb["before_image"]["record"]["blocks"]))
new, notes = U.a4_blank_alternative(orig, lb_units)
alts = {a["code"]: a for b in new["blocks"] for c in b["courses"] if c.get("code") == "ANAT 1" for a in c["alternatives"]}
check(alts["BIO 60"]["units"] == 4 and alts["BIO 60L"]["units"] == 1
      and alts["BIO 60"]["together"] == alts["BIO 60L"]["together"] == "BIO 60 + BIO 60L",
      "the fixed A4 gives BIO 60 and BIO 60L their own 4 and 1, as one option")
check(not U.state_differs(orig, new, lb_units) and U.arith(new, lb["award"])["computed"] == lb["after"]["computed"],
      "and passes the per-course check with the program total unchanged")
# The scorer: a group's members add up; with the closed list, a member's listed units; a group's own figure first.
grp = course("X 1", 5, alts=[{"code": "X 1A", "together": "g"}, {"code": "X 1B", "together": "g"}])
lk = {U.S.listed_key("X 1A", {}): 2.5, U.S.listed_key("X 1B", {}): 2.5}
check(U.S.choice_units(grp, lk) == (2.5 * 2, 5.0), "a group reads its members' listed units added")
for a in grp["alternatives"]:
    a["together_units"] = 5
check(U.S.choice_units(grp, {k: 1 for k in lk}) == (5.0, 5.0), "a group's own figure wins over a closed list")

# A11's named gaps.
col = {"college": "Butte College", "titles": {"100": "Cal-GETC", "200": "English", "300": "English"},
       "awards": {"100": "Certificate of Achievement", "200": "A.A. Degree", "300": "A.A. Degree"},
       "listed": {"100": 0, "200": 0, "300": 12}}
check(G.named_gap(col, "100", "no_closed_list") == ("ge_pattern_certificate", None), "a Cal-GETC certificate is named")
check(G.named_gap(col, "100", "units_unequal") is None, "the label holds only in the no-list and page-not-found piles")
check(G.named_gap(col, "200", "no_closed_list") == ("listed_twice", "300"), "a program listed twice names its other listing")
check(G.named_gap(col, "300", "no_closed_list") is None, "the listing with the course list is not labeled")
check(G.named_gap(dict(col, college="Lassen College"), "100", "no_closed_list") is None,
      "no label at a college the collection lane holds")

# A11 self-recall over the held titles (second reader's F2): every committed program title a looser search finds
# (general education, GETC, IGETC, CSU, breadth, transfer curriculum, GE) is either a hit or a pinned non-pattern.
# A new title in neither fails, so a person judges it before the label reaches it.
import glob  # noqa: E402
import json  # noqa: E402
import re  # noqa: E402
LOOSE = re.compile(r"general\s+ed|getc|igetc|\bcsu\b|breadth|transfer\s+curriculum|\bGE\b", re.I)
NOT_PATTERNS = {  # held answers: not a general-education pattern certificate
    "CSU/UC Preparation", "GENERAL EDUCATION DIPLOMA", "GENERAL EDUCATION DIPLOMA (GED)",
    "GENERAL EDUCATION DIPLOMA - BILINGUAL", "General Education Development Preparation",
    "General Educational Development Program", "Media Arts: Graphic Design (CSU Option)",
}
held_titles = set()
for sp in glob.glob(os.path.join(ROOT, "kb", "program_requirements_college", "*", "sources.json")):
    with open(sp, encoding="utf-8") as fh:
        held_titles |= {(e.get("title") or "").strip() for e in json.load(fh) if LOOSE.search(e.get("title") or "")}
hit = lambda t: bool(G.GE_PATTERN_TITLE.search(t) and not G.NOT_GE_PATTERN_TITLE.search(t))
right = sum(1 for t in held_titles if hit(t) != (t in NOT_PATTERNS))
wrong = sorted(t for t in held_titles if hit(t) == (t in NOT_PATTERNS))
check(not wrong, "GE pattern self-recall over %d held titles: right %d, wrong %d (%s)"
      % (len(held_titles), right, len(wrong), "; ".join(wrong[:5])))
for t in ("GENERAL EDUCATION DIPLOMA", "General Education Development Preparation"):
    check(G.named_gap({"college": "Pasadena City College", "titles": {"1": t}}, "1", "page_not_found") is None,
          "a diploma or GED takes no GE pattern label: %s" % t)
check(hit("Intersegmental GE Transfer Curriculum") and hit("SRJC Local GE"), "IGETC spelled out and a local GE pattern")

# listed_twice self-recall over held answers: a program whose own listing has a course list never takes the label.
lt_right = lt_wrong = 0
for d in glob.glob(os.path.join(ROOT, "kb", "program_requirements_college", "*")):
    if not os.path.isfile(os.path.join(d, "sources.json")):
        continue
    col = G.read_college_dir(d)
    for cn, n in (col.get("listed") or {}).items():
        if n:
            if G.named_gap(col, cn, "no_closed_list") and G.named_gap(col, cn, "no_closed_list")[0] == "listed_twice":
                lt_wrong += 1
            else:
                lt_right += 1
check(lt_wrong == 0, "listed_twice on held listings with a course list: right %d, wrong %d" % (lt_right, lt_wrong))
print("self-recall: GE pattern %d held titles, right %d, wrong %d; listed_twice on %d listings with their own course "
      "list, right %d, wrong %d" % (len(held_titles), right, len(wrong), lt_right + lt_wrong, lt_right, lt_wrong))

# F1: after the rewrite the college load posts exactly the plan's after-image for every full-row record, so a
# later load or a dry run of it reports no change for them.
RECEIPT = os.path.join(ROOT, "kb", "receipts", "program_requirement_records_units_rules_2026-11-18_s680.json")
if os.path.isfile(RECEIPT):
    import _program_requirements_college as C  # noqa: E402
    with open(RECEIPT, encoding="utf-8") as fh:
        rc = json.load(fh)
    full = [r for r in rc["records"] if r["i"] in set(rc["plan"]["full_row"])]
    images = {}
    for college in sorted({r["college"] for r in full}):
        for row in C.load_rows(college)[0]:
            images[(college, str(row["control_number"]))] = row
    # A row S681 corrects (its paired alternatives) carries S681's after-image; its before-image is S680's.
    later = {}
    p681 = os.path.join(ROOT, "kb", "receipts", "program_requirement_records_units_rules_2026-11-19_s681.json")
    if os.path.isfile(p681):
        with open(p681, encoding="utf-8") as fh:
            for r in json.load(fh)["records"]:
                if (r.get("corrects") or {}).get("receipt", "").endswith("_s680.json"):
                    later[r["corrects"]["i"]] = r
    for i, r in later.items():
        check(r["before_image"]["record"] == next(x for x in full if x["i"] == i)["after_image"]["record"],
              "S681's correction of S680 row %d starts from the row S680 wrote" % i)
    want = {r["i"]: (later[r["i"]] if r["i"] in later else r)["after_image"] for r in full}
    same = sum(1 for r in full if (images.get((r["college"], str(r["control_number"]))) or {}).get("record")
               == want[r["i"]]["record"] and images[(r["college"], str(r["control_number"]))]["checks"]
               == want[r["i"]]["checks"])
    check(full and same == len(full), "the load posts the after-image for %d of %d full-row records" % (same, len(full)))
    check(all(r["before_image"]["record"] != r["after_image"]["record"] for r in full),
          "every full-row record's blocks change (else it belongs in the checks-only part)")
    check(not set(rc["plan"]["checks_only"]) & set(rc["plan"]["full_row"])
          and all(r["rule"] == "A1" for r in rc["records"] if r["i"] in set(rc["plan"]["checks_only"])),
          "A1 alone is checks-only")
    check(not any(r["rule"] == "A6" for r in rc["records"]), "A6 is not in the plan")
    # The checks-only apply ran (migrate run 44259625861, 17 returned, none checked): its rows are marked applied
    # and its rollback names exactly the returned rows.
    ap_ = (rc.get("applied") or {}).get("checks_only") or {}
    check(ap_.get("returned") == 17 and sorted(ap_.get("keys") or []) == sorted(rc["plan"]["checks_only"])
          and all((r.get("applied") or {}).get("part") == "checks_only" for r in rc["records"]
                  if r["i"] in set(ap_.get("keys") or [])) and "e(expect) as (values (17))" in rc["rollback_checks_only"],
          "the 17 checks-only rows are marked applied and the rollback names them")
    # The full-row apply ran (migrate run 44261575737, 39 returned, none checked): marked applied, its rollback
    # names exactly the returned rows, and the committed apply is byte for byte the file that ran.
    apr = (rc.get("applied") or {}).get("full_row") or {}
    check(apr.get("returned") == 39 and sorted(apr.get("keys") or []) == sorted(rc["plan"]["full_row"])
          and all((r.get("applied") or {}).get("part") == "full_row" for r in rc["records"]
                  if r["i"] in set(apr.get("keys") or [])) and "e(expect) as (values (39))" in rc["rollback_full_row"],
          "the 39 full-row rows are marked applied and the rollback names them")
    import hashlib  # noqa: E402
    mig_dir = os.path.join(ROOT, "kb", "migrations")
    for part, run_ in (("apply_rows", "44261575737"), ("apply_checks", "44259625861")):
        rp = os.path.join(ROOT, "kb", "receipts", "migration_s680_prreq_units_rules_%s_%s.json" % (part, run_))
        if os.path.isfile(rp):
            with open(rp, encoding="utf-8") as fh:
                want = json.load(fh)["sha256"]
            with open(os.path.join(mig_dir, "2026-11-18_s680_prreq_units_rules_%s.sql" % part), "rb") as fh:
                check(hashlib.sha256(fh.read()).hexdigest() == want, "%s is the file migrate run %s applied" % (part, run_))
    # MiraCosta 21976 is live on an older run than its filed record: out of the full-row plan, a load question.
    check(len(rc["plan"]["full_row"]) == 39 and "e(expect) as (values (39))" in rc["apply_full_row"]
          and "e(expect) as (values (39))" in rc["rollback_full_row"]
          and [(h["college"], h["control_number"]) for h in rc.get("held_out") or []] == [("MiraCosta College", "21976")]
          and not any((r["college"], r["control_number"]) == ("MiraCosta College", "21976") for r in rc["records"])
          and "'MiraCosta College', '21976'" not in rc["apply_full_row"],
          "the full-row plan is 39 rows, MiraCosta 21976 held out")
    with open(os.path.join(ROOT, "kb", "program_requirements_college", "miracosta", "records", "21976.json"),
              encoding="utf-8") as fh:
        check("units_rules_" not in fh.read(), "MiraCosta 21976's record file is main's, with no units-rules note")
    for k in ("apply_checks_only", "apply_full_row", "rollback_checks_only", "rollback_full_row"):
        sql = rc[k]
        check("r.checked is not true" in sql and "e(expect) as (values (" in sql and "skipped_checked" in sql
              and "::int::text::json" in sql,
              "%s skips a checked row, lists it, and aborts unless it matches the plan less those rows" % k)

# S681: two kinds of row, and no other. A NEW row is at one of the seven colleges S680's lane released (a planned
# record elsewhere re-plans one S680 applied or held out, MiraCosta 21976); a CORRECTING row is an A4 row S680
# applied whose paired alternatives the fixed rule changes (second reader's A), planned from the row S680 wrote.
# Neither is ever at a college tonight's lane holds.
RECEIPT_681 = os.path.join(ROOT, "kb", "receipts", "program_requirement_records_units_rules_2026-11-19_s681.json")
check(os.path.isfile(RECEIPT_681), "the S681 receipt is committed where this test reads it")
if os.path.isfile(RECEIPT_681):
    with open(RECEIPT_681, encoding="utf-8") as fh:
        r681 = json.load(fh)
    released, lane = set(CL.RELEASED), set(CL.COLLECTION_LANE)
    planned = [(r["college"], str(r["control_number"])) for r in r681["records"]]
    new_rows = [(r["college"], str(r["control_number"])) for r in r681["records"] if not r.get("corrects")]
    fixes = [r for r in r681["records"] if r.get("corrects")]
    check(new_rows and all(c in released for c, _ in new_rows),
          "every new S681 row is at a released college: %s" % [p for p in new_rows if p[0] not in released][:5])
    check(not any(c in lane for c, _ in planned), "no S681 row is at a college tonight's lane holds")
    check(set(r681.get("only_colleges") or []) == released, "the S681 run named the seven released colleges alone")
    if os.path.isfile(RECEIPT):
        s680 = {(r["college"], str(r["control_number"])) for r in rc["records"] + (rc.get("held_out") or [])}
        check(not s680 & set(new_rows), "no new S681 row is one S680 planned: %s" % sorted(s680 & set(new_rows))[:5])
        applied_a4 = {r["i"]: r for r in rc["records"]
                      if r["rule"] == "A4" and (r.get("applied") or {}).get("part") == "full_row"}
        check(all(f["corrects"]["receipt"].endswith("_s680.json") and f["corrects"]["i"] in applied_a4
                  and (f["college"], str(f["control_number"])) == (applied_a4[f["corrects"]["i"]]["college"],
                                                                   str(applied_a4[f["corrects"]["i"]]["control_number"]))
                  and f["before_image"] == applied_a4[f["corrects"]["i"]]["after_image"]
                  and str(f["extracted_run"]) == str(applied_a4[f["corrects"]["i"]]["extracted_run"])
                  for f in fixes), "every correcting row is an applied S680 A4 row, from the row and run S680 wrote")
        check(not any((h["college"], str(h["control_number"])) in set(planned) for h in rc.get("held_out") or []),
              "MiraCosta 21976 stays out")
    check(all(f["before"]["computed"] == f["after"]["computed"] and f["before_image"]["checks"] == f["after_image"]["checks"]
              for f in fixes), "a correction changes no program total and no check")
    # The per-course self-check on what this plan writes (S683): every unit that moves from a row's before-image to
    # its after-image is one the state's file holds, and Long Beach City 44747 is corrected here.
    bad = [(r["college"], r["control_number"], x) for r in r681["records"] if r.get("after_image")
           for x in U.state_differs(r["before_image"]["record"], r["after_image"]["record"], U.units_at(r["college"]))]
    check(not bad, "no S681 row writes a unit the state's file does not hold: %s" % bad[:3])
    check(("Long Beach City College", "44747") in {(f["college"], str(f["control_number"])) for f in fixes},
          "Long Beach City 44747 is a correcting row")
    check(not (r681.get("pair_recall") or {}).get("wrong") and (r681.get("pair_recall") or {}).get("tally"),
          "the S681 receipt carries the pair call's score against the notes, with no contradicted call")
    check(all(not (x["written"][0] - 1e-6 <= x["state"] <= x["written"][1] + 1e-6)
              for x in r681.get("state_differs_left") or [{"written": [0, 0], "state": 0}])
          and not any((x["college"], x["code"]) == ("Long Beach City College", "BIO 60L")
                      for x in r681.get("state_differs_left") or []),
          "the receipt lists the units an earlier plan wrote that the file does not hold, 44747's left out")
    check(not any(r["rule"] in ("A5", "A6") for r in r681["records"]), "A5 and A6 move no S681 record")
    check(r681.get("a5_on") is False and r681.get("a6_on") is False, "the S681 receipt says A5 and A6 were off")
    # Every row each committed S681 file names is a planned row, at no college tonight's lane holds.
    ROW = re.compile(r"^\s*\((\d+), '((?:[^']|'')+)', '([^']+)', \d+", re.M)
    named = {}
    for sql in sorted(glob.glob(os.path.join(ROOT, "kb", "migrations", "2026-11-19_s681_prreq_units_rules_*.sql"))):
        with open(sql, encoding="utf-8") as fh:
            text = fh.read()
        rows = [(c.replace("''", "'"), n) for _, c, n in ROW.findall(text)]
        named[os.path.basename(sql)] = rows
        check(rows and all(c not in lane for c, _ in rows) and set(rows) <= set(planned),
              "%s names only planned rows, none at a lane college (%d rows)" % (os.path.basename(sql), len(rows)))
    full681 = [r for r in r681["records"] if r["i"] in set(r681["plan"]["full_row"])]
    for name in ("preread", "apply_rows", "rollback_rows"):
        check(len(named.get("2026-11-19_s681_prreq_units_rules_%s.sql" % name) or []) == len(full681),
              "the S681 %s file names the %d full-row rows" % (name, len(full681)))
    with open(os.path.join(ROOT, "kb", "migrations", "2026-11-19_s681_prreq_units_rules_rollback_rows.sql"),
              encoding="utf-8") as fh:
        check(not fixes or "ORDER: run this rollback first" in fh.read(), "the rollback says it runs before S680's")
    check(("e(expect) as (values (%d))" % len(full681)) in r681["apply_full_row"]
          and ("e(expect) as (values (%d))" % len(full681)) in r681["rollback_full_row"],
          "the S681 full-row apply and rollback expect the plan's count")
    check(bool(r681["plan"]["checks_only"]) == bool(r681.get("apply_checks_only")),
          "an empty checks-only part carries no statement")
    import _program_requirements_college as C  # noqa: E402
    imgs = {}
    for college in sorted({r["college"] for r in full681}):
        for row in C.load_rows(college)[0]:
            imgs[(college, str(row["control_number"]))] = row
    check(all((imgs.get((r["college"], str(r["control_number"]))) or {}).get("record") == r["after_image"]["record"]
              and imgs[(r["college"], str(r["control_number"]))]["checks"] == r["after_image"]["checks"]
              for r in full681), "the load posts the S681 after-image for every full-row record")

# The per-course self-recall (second reader's A, item 2), over every record A4 changed (S680's applied A4 rows and
# S681's): each alternative A4 filled is compared with the state's course file. A member of a paired alternative
# (the fixed rule's group on the record as filed) must never carry its row's units where the file says otherwise:
# it carries the file's figure, or none under the group's together_units. Counts print; the test fails on a wrong
# paired member.
if os.path.isfile(RECEIPT) and os.path.isfile(RECEIPT_681):
    st = U.state_units()
    seen, tally, paired_wrong = set(), collections.Counter(), []
    rows = [r for r in rc["records"] if r["rule"] == "A4" and (r.get("applied") or {}).get("part") == "full_row"]
    rows += [r for r in r681["records"] if r["rule"] == "A4" and not r.get("corrects")]
    s680_before = {(r["college"], str(r["control_number"])): r["before_image"]["record"] for r in rc["records"]
                   if r.get("before_image")}
    for r in rows:
        key = (r["college"], str(r["control_number"]))
        if key in seen:
            continue
        seen.add(key)
        with open(os.path.join(ROOT, r["path"]), encoding="utf-8") as fh:
            filed = json.load(fh)
        as_filed = dict(filed["record"], blocks=(s680_before.get(key) or r["before_image"]["record"])["blocks"])
        units_of = U.units_at(r["college"], st)
        for b, ob in zip(filed["record"].get("blocks") or [], as_filed.get("blocks") or []):
            for c, oc in zip(b.get("courses") or [], ob.get("courses") or []):
                kind, _ = U.paired_group(as_filed, oc, units_of)
                for a, oa in zip(U.S.alternatives(c), U.S.alternatives(oc)):
                    if not U._unitless(oa):
                        continue
                    v, u = units_of(a["code"]), U.S._num(a.get("units"))
                    k = "not held" if v is None else ("no units" if u is None else ("right" if abs(u - v) < 1e-6 else "wrong"))
                    tally[k] += 1
                    if kind:
                        tally["paired " + k] += 1
                        ok = a.get("together") and ((u is None and U.S._num(a.get("together_units")) is not None)
                                                    or (u is not None and v is not None and abs(u - v) < 1e-6))
                        if not ok:
                            paired_wrong.append("%s %s %s" % (r["college"], r["control_number"], a["code"]))
    print("per-course self-recall over %d A4 records: %s" % (len(seen), ", ".join("%s %d" % kv for kv in sorted(tally.items()))))
    check(not paired_wrong, "no member of a paired alternative carries its row's units: %s" % paired_wrong[:5])

if failures:
    for m in failures:
        print("FAIL:", m)
    sys.exit(1)
print("%d/%d checks passed: program requirements units rules" % (checks[0], checks[0]))
