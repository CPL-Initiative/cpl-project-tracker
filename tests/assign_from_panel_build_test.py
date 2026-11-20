#!/usr/bin/env python3
"""Assign from the panel: what the daily export does with a course from outside the identity file (2026-11-20, S694).

The Courses List's Needs an M-ID pile holds local courses with no M-ID, C-ID or CCN. Assigning one saves the row
SkyView's re-home writes, kb_curation `CN:<control number>` `merge_into` <target>. Every such row before this one
moved a course the identity file already held. kb/_assign_from_panel_dryrun.py measured what the export did with a
course from outside it, and this guards each failure it found:

A. state_list_course_fields on a small state list: the fields a course outside the identity file contributes, the
   Courses List's credit rule, the bare TOP, the first row for a shared control number, no read for an empty ask.
B. The export, run twice through its UC_KB_DIR / UC_OUT_DIR seam (today's overlay, then a copy with five
   assignments), on courses picked from the state list by rule, never from a worklist:
     1. a course joined to a catalog M-ID lists under it, and the M-ID's row stays exactly as it was (drawn as a
        merge target, a 5-course M-ID read "2 members", confidence 1.0 and no discipline source);
     2. a course joined to a stand-alone M-ID lists under it, and the M-ID keeps its own credit status and TOP
        (one course with a sibling TOP blanked its target's);
     3. a new common course minted from one course carries that course's subject, credit status and TOP (12 of 12
        landed with none);
     4. nothing outside the targets moves.
C. No course the identity file holds is hidden behind a twin: a second state-list record with the same college,
   code and title and its own control number lists under its M-ID (15 did not, and counted as needing an M-ID).

Run from the repo root:  python3 tests/assign_from_panel_build_test.py     (about a minute: two full exports)
"""
import importlib.util
import json
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _assign_from_panel_dryrun as dry  # noqa: E402

spec = importlib.util.spec_from_file_location("gen", os.path.join(ROOT, "excel_to_dashboard.py"))
gen = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gen)

fails = []


def check(name, got, want=True):
    ok = got == want
    print(("  ok   " if ok else "  FAIL ") + name + ("" if ok else "\n         got  %r\n         want %r" % (got, want)))
    if not ok:
        fails.append(name)


def nrm(x):
    return " ".join(str(x or "").split()).upper()


# ---------------------------------------------------------------------------------------------------------------
print("A. state_list_course_fields")
import openpyxl  # noqa: E402

HEADER = ["College", "CourseControlNumber", "Subject", "Course_Number", "CourseTitle", "UnitValue", "CreditType",
          "Non_Credit_Category", "TopCode", "CIDNumber", "CatalogDescription", "CommonCourseNumber"]
ROWS = [
    ["Alpha College", "CCC000000001", "AUTO", 60.5, "Advanced Alignment", 4, "Credit Course", "Credit Course",
     "0948.00: Automotive Technology", None, "d", None],
    ["Alpha College", "ccc000000002", "LLS", 26, "The Simple Life", 0, "Non-Enhanced Funding", "Courses for Older Adults",
     "4999.00: Other Interdisciplinary Studies", None, "d", None],
    ["Beta College", "CCC000000003", "ESL", "82", "Advanced Conversation", 0, "Workforce Preparation Enhanced Funding",
     "ESL", "4930.87: ESL Integrated", None, "d", None],
    ["Beta College", "CCC000000004", "ART", 50, "Art", 3, None, None, None, None, None, None],
    ["Gamma College", "CCC000000005", "KIN", "009B", "Intermediate Badminton", 1, "Credit Course", "Credit Course",
     "0835.00: Physical Education", None, "d", None],
    ["Gamma College", "CCC000000005", "KIN", "056", "Beginning Weight Training", 2, "Credit Course", "Credit Course",
     "0835.10: Physical Fitness", None, "d", None],
]
with tempfile.TemporaryDirectory() as td:
    path = os.path.join(td, "state_list.xlsx")
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(HEADER)
    for r in ROWS:
        ws.append(r)
    wb.save(path)
    got = gen.state_list_course_fields(path, ["CCC000000001", " ccc000000002 ", "CCC000000003", "CCC000000004",
                                              "CCC000000005", "CCC999999999"])
    check("a credit course: subject, number, units, credit status, bare TOP",
          {k: got["CCC000000001"].get(k) for k in ("college", "subject", "course_number", "units", "credit_status", "top_code")},
          {"college": "Alpha College", "subject": "AUTO", "course_number": "60.5", "units": 4,
           "credit_status": "Credit", "top_code": "0948.00"})
    check("a control number is matched whatever its case or spacing", "CCC000000002" in got, True)
    check("non-enhanced funding reads Noncredit", got["CCC000000002"]["credit_status"], "Noncredit")
    check("enhanced funding reads Noncredit Enhanced", got["CCC000000003"]["credit_status"], "Noncredit Enhanced")
    check("a blank credit type with units reads Credit, and a blank TOP reads none",
          (got["CCC000000004"]["credit_status"], got["CCC000000004"]["top_code"]), ("Credit", None))
    check("a control number naming two courses keeps the first, the one the member join shows",
          got["CCC000000005"]["course_number"], "009B")
    check("a control number the state list does not hold is left out", "CCC999999999" in got, False)
    check("an empty ask reads nothing", gen.state_list_course_fields(os.path.join(td, "no_such.xlsx"), []), {})
    check("a missing state list returns nothing", gen.state_list_course_fields(os.path.join(td, "no_such.xlsx"), ["X"]), {})

# ---------------------------------------------------------------------------------------------------------------
print("B. the export, on courses from outside the identity file")
KB = os.path.join(ROOT, "kb")
overlay = json.load(open(os.path.join(KB, "coci_curation.json"), encoding="utf-8"))["curations"]
memberships = json.load(open(os.path.join(KB, "coci_minted_memberships.json"), encoding="utf-8"))["memberships"]
singletons = json.load(open(os.path.join(KB, "coci_minted_singletons.json"), encoding="utf-8"))["courses"]
catalog = json.load(open(os.path.join(KB, "coci_minted_courses.json"), encoding="utf-8"))
catalog = catalog.get("courses") or catalog
on_file = {nrm(p.get("control_number")) for ms in memberships.values() for p in ms}
on_file |= {nrm(v.get("control_number")) for v in singletons.values()}
routed = {nrm(j.get("control_number")) for j in
          (json.load(open(os.path.join(KB, "cid_articulation_joins.json"), encoding="utf-8")).get("joins") or [])}
pointed_at = {v.get("merge_into") for v in overlay.values() if isinstance(v, dict) and v.get("merge_into")}
sl = dry.state_list()

# Courses outside the identity file, by rule: one state-list row, no C-ID or CCN, not routed, not already re-homed.
# Most are independent study and the like, kept out of the counts for good, so this never empties as the pile does.
pool = [dict(sl[cn][0], cn=cn) for cn in sorted(sl)
        if cn and cn not in on_file and cn not in routed and len(sl[cn]) == 1
        and not sl[cn][0]["cid"] and not sl[cn][0]["ccn"] and ("CN:" + cn) not in overlay
        and sl[cn][0]["subj"] and sl[cn][0]["top"]][:400]
check("courses outside the identity file to work with", len(pool) >= 8, True)


def take(pred=lambda c: True):
    c = next(c for c in pool if pred(c))
    pool.remove(c)
    return c


# Targets no curation touches, picked from what today's build displays (the committed rows), so the picks stand
# whatever an official id takes in tomorrow: three catalog M-IDs that stand as their own row, one catalog M-ID an
# official id took in, one stand-alone M-ID, and one anchor (a common_courses.json M-ID with no credit status or TOP).
shown = {r["id"]: r for r in dry.js_payload(os.path.join(ROOT, "unified_courses_data.js"))["rows"] if isinstance(r, dict)}
taken_in = {c for r in shown.values() for c in (r.get("consolidated_from") or [])}
free = [m for m in sorted(catalog) if isinstance(catalog[m], dict) and m not in overlay and m not in pointed_at
        and len(memberships.get(m, [])) >= 3]
plain_targets = [m for m in free if m in shown and not shown[m].get("mt") and shown[m].get("id_system") == "M-ID"][:3]
folded_target = next(m for m in free if m in taken_in)
sg_target = next(s for s in sorted(singletons) if s not in overlay and s not in pointed_at
                 and nrm(singletons[s].get("control_number")) not in routed and singletons[s].get("top_code"))
sg_top = str(singletons[sg_target].get("top_code") or "").partition(":")[0].strip()
anchors = json.load(open(os.path.join(KB, "common_courses.json"), encoding="utf-8"))
anchor_target = next(k for k, v in sorted(anchors.items()) if isinstance(v, dict) and v.get("id_system") == "M-ID"
                     and k not in catalog and k not in singletons and k not in overlay and k not in pointed_at
                     and not v.get("credit_status") and not v.get("top_code") and k in shown)
MINT = "UC-CUR-EXTTEST1"
existing = [{"cn": c["cn"], "target": t, "course": c} for t, c in ((t, take()) for t in plain_targets + [folded_target])]
c = take(lambda c: c["top"] != sg_top)  # a different TOP, so the stand-alone's own TOP has something to hold against
existing.append({"cn": c["cn"], "target": sg_target, "course": c})
c = take()
existing.append({"cn": c["cn"], "target": anchor_target, "course": c})
c = take()
mint = [{"cn": c["cn"], "target": MINT, "course": c}]

with tempfile.TemporaryDirectory() as td:
    before, after = dry.run_exports(td, dry.overlay_with(existing, mint))
    rb, ra = dry.rows_of(before), dry.rows_of(after)
    mb, ma = dry.members_of(before), dry.members_of(after)
    members_before = dry.js_payload(os.path.join(before, "unified_courses_members.js"))

home = {}
for mid, rows in ma.items():
    for r in rows:
        if r.get("cn"):
            home.setdefault(r["cn"], []).append(mid)

# 1. Catalog M-IDs that stood as their own row before the assignment (an official id may have taken one in).
# The figures that follow the members a row displays, the joined course included: its units and its course count.
FOLLOWS = ("units", "umin", "umax", "members")


def but_counts(r):
    return {k: v for k, v in (r or {}).items() if k not in FOLLOWS}


by_target = {a["target"]: a for a in existing}
plain = [by_target[t] for t in plain_targets if t in rb and not rb[t].get("mt")]
check("at least two catalog M-IDs stood as their own row to test against", len(plain) >= 2, True)
for a in plain:
    t = a["target"]
    check("%s: the joined course lists under it" % t, t in home.get(a["cn"], []), True)
    check("%s: its row is the row it had, the units and the course count aside" % t, but_counts(ra.get(t)), but_counts(rb[t]))
    check("%s: its member list grew by the one course" % t, len(ma.get(t, [])) - len(mb.get(t, [])), 1)
    check("%s: its course count grew by the one course" % t, (ra.get(t) or {}).get("members"), (rb[t].get("members") or 0) + 1)
    u, r = a["course"]["units"], ra.get(t) or {}
    if isinstance(u, (int, float)) and r.get("umin") is not None:
        check("%s: its units range covers the joined course" % t, r["umin"] <= u <= r["umax"], True)
# A catalog M-ID an official id took in displays under that id, and the joined course follows it there.
carriers = {}
for i, r in ra.items():
    for t in set(r.get("consolidated_from") or []) & set(by_target):
        carriers[t] = i
a = by_target[folded_target]
check("%s displays under an official id" % folded_target, folded_target in carriers, True)
check("%s: the joined course follows it to %s" % (folded_target, carriers.get(folded_target)),
      carriers.get(folded_target) in home.get(a["cn"], []), True)

# 2. A stand-alone M-ID keeps its own credit status and TOP whatever the joined course carries.
s = by_target[sg_target]
row = ra.get(sg_target) or {}
check("%s (stand-alone): the joined course lists under it" % sg_target, sg_target in home.get(s["cn"], []), True)
check("%s (stand-alone): it keeps its own credit status and TOP against a course with TOP %s" % (sg_target, s["course"]["top"]),
      (row.get("credit"), row.get("top")), (singletons[sg_target].get("credit_status"), sg_top))
check("%s (stand-alone): its subject list gains the joined course's code" % sg_target,
      s["course"]["subj"] in (row.get("subj") or []), True)
# An anchor carries no credit status or TOP of its own, so the joined course's speak for the row.
s = by_target[anchor_target]
row = ra.get(anchor_target) or {}
check("%s (anchor): the joined course lists under it" % anchor_target, anchor_target in home.get(s["cn"], []), True)
check("%s (anchor): silent on credit status and TOP, it takes the joined course's" % anchor_target,
      (row.get("credit"), row.get("top")),
      ({"C": "Credit", "E": "Noncredit Enhanced", "N": "Noncredit"}.get(s["course"]["credit"]), s["course"]["top"]))

# 3. A common course minted from one course carries that course's fields.
m = mint[0]
row = ra.get(MINT) or {}
credit = {"C": "Credit", "E": "Noncredit Enhanced", "N": "Noncredit"}.get(m["course"]["credit"])
check("the minted course lists its one course", MINT in home.get(m["cn"], []), True)
check("the minted course carries its course's subject, credit status and TOP",
      (row.get("subj"), row.get("credit"), row.get("top")), ([m["course"]["subj"]], credit, m["course"]["top"]))

# 4. Nothing outside the targets moves.
targets = {a["target"] for a in existing} | {MINT} | set(carriers.values())
check("no row outside the targets changed", [i for i in sorted(set(rb) | set(ra)) if i not in targets and rb.get(i) != ra.get(i)], [])
mine = {a["cn"] for a in existing + mint}
home_b = {}
for mid, rows in mb.items():
    for r in rows:
        if r.get("cn"):
            home_b.setdefault(r["cn"], []).append(mid)
check("no other course changed its home",
      [cn for cn in sorted(set(home_b) | set(home)) if cn not in mine and home_b.get(cn) != home.get(cn)], [])

# ---------------------------------------------------------------------------------------------------------------
print("C. no course the identity file holds is hidden behind a twin")
names = [str(c or "").strip() for c in members_before["colleges"]]
shown_cn = {r["cn"] for rows in mb.values() for r in rows if r.get("cn")}
hidden = []
for mid, rows in mb.items():
    shown_here = {(names[r["c"]], nrm(r["n"]), r["t"]) for r in rows}
    for p in memberships.get(mid, []):
        cn = nrm(p.get("control_number"))
        if not cn or cn in shown_cn or len(sl.get(cn, [])) != 1:
            continue
        c = sl[cn][0]
        if (c["college"], nrm(c["subj"] + " " + c["num"]), c["title"]) in shown_here:
            hidden.append(cn)
check("every twin lists under its M-ID by its own control number", sorted(hidden), [])

print("\n" + ("FAILED: " + ", ".join(fails) if fails else "all checks passed"))
sys.exit(1 if fails else 0)
