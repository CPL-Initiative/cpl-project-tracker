#!/usr/bin/env python3
"""S748 (lane 2, cheap piles): East Los Angeles's reconcile step for a choice list printed with its least units.

WHY. Kinesiology A.A.-T 31017 (Academic Plan E031017G) has held since S720. Its page prints the movement list as
'Movement-based courses: (minimum 3 units) Select a maximum of one (1) course from any three (3) of the following
areas'. The reading took the count: three courses of 1 to 4 units (the team sports' KIN ATH courses carry 4), so the
major reads 20-33 around the printed Subtotal 20-27 and the degree 54-67 on both sides of the printed 60. The
scorer's fill reading wants the sum at or under the total and its overlap reading a low end past it (S457, Sam's
'narrow'), so a sum on both sides takes neither, and no filed gap is true of it. College page read 46120012715
(kb/college_reads/s748_piles_east_los_angeles_kinesiology.json, PDF pp.239-241 whole) prints the section line for
line; it is committed in that plan file under the run. The college's entry (kb/program_requirements_reconcile.json,
'East Los Angeles College') carries one new step, kind list_minimum_units (kb/_program_requirements_reconcile.py):
the one list the step names, filed as choose_courses with the printed count and stating the printed figure, reads as
that many units to choose.

Pinned here:
  * the step as written, citing its page read, and the kind described;
  * the step on the page's own lines: the movement list becomes 3 units to choose, nothing else in the record moves,
    and today's scorer then passes the degree (the major 20-24 under the printed 20-27, the degree 54-58 with the
    electives the page says fill it);
  * the wrong joins it refuses: a page without the words; the words at another figure, or with another count; a list
    that states a range; a list whose three cheapest courses pass the figure; a course with no units; a record the
    reading does not close; a record that already passes; a local degree or a certificate (awards); a record the
    step's hold names; another college's record;
  * the self-recall over every committed East Los Angeles record (the S652 review rule, counting what the step joins
    as well as the verdicts), each record offered 31017's own section, the most the step could be offered: the step
    reads 31017 alone, it turns passing, and no passing record turns failing; statewide, the lists the step's
    block_pattern names are counted by college, and the step, East Los Angeles's own, reads none of the others.

A test of the step's logic on committed records and quoted lines. The free reconcile that reads the live page is the
runner's, after a second reader (a new kind is shared reader code). Either state of 31017 is accepted: as S742's
reread left it, or as that reconcile files it.

Run from repo root: python3 tests/program_reconcile_s748_ela_test.py
"""
import collections
import copy
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_piles_s714_ccsf as C  # noqa: E402
import _program_requirements_reconcile as R  # noqa: E402

ELA = "East Los Angeles College"
FOLDER = os.path.join(ROOT, "kb", "program_requirements_college", "east_los_angeles", "records")
STEPS = R.load_steps()
KIND = "list_minimum_units"
PAGE_READ = "46120012715"
PLAN = "kb/college_reads/s748_piles_east_los_angeles_kinesiology.json"
LIST = "Movement-based courses"
checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


def load(cn):
    with open(os.path.join(FOLDER, cn + ".json"), encoding="utf-8") as fh:
        return json.load(fh)


def arithmetic(filed, record):
    return C.fresh_score(dict(filed, record=record))["arithmetic"]


# ── the step as written ──
mine = [s for s in STEPS[ELA]["steps"] if s["kind"] == KIND]
check(len(mine) == 1, "East Los Angeles carries one %s step" % KIND)
ST = mine[0]
ONLY = {ELA: dict(STEPS[ELA], steps=[ST])}
check(ST.get("awards") == "transfer" and PAGE_READ in ST["source"] and os.path.basename(PLAN) in ST["source"]
      and "(minimum 3 units)" in ST["source_words"] and "second reader" in ST["why"] and ST.get("session") == "S748",
      "the step reads transfer degrees, cites its page read and says it needs a second reader")
with open(os.path.join(ROOT, "kb", "program_requirements_reconcile.json"), encoding="utf-8") as fh:
    check(KIND in json.load(fh)["_kinds"], "the kind is described")
with open(os.path.join(ROOT, PLAN), encoding="utf-8") as fh:
    plan = json.load(fh)
quoted = plan["_quoted"][PAGE_READ]
SECTION = quoted["section"]
check(plan["pdf_span"] == [239, 241] and "(Academic Plan E031017G)" in SECTION.split("\n")[0]
      and SECTION.rstrip().endswith("60") and quoted["movement"].split(" | ")[0] in SECTION
      and "20-27" in quoted["subtotal"] and quoted["subtotal"] in SECTION
      and "ADDITIONAL CSU UNITS, IF NEEDED, TO REACH 60 CSU TRANSFERABLE" in SECTION,
      "the page read's plan holds the section whole under its run: the plan line, the movement list's rule, the "
      "Subtotal 20-27, the electives sentence and the Total 60")
pm = re.search(ST["pattern"], SECTION)
check(pm is not None and pm.group("n") == "3" and pm.group("count") == "3" and "\n" in pm.group(0)
      and len(re.findall(ST["pattern"], SECTION)) == 1,
      "the step's words match the page's lines once, across its line breaks, with the figure 3 and the count 3")


def step(filed, text=SECTION, steps=ONLY, award=None, college=ELA):
    return R._college_steps(filed["record"], text, college, filed["award"] if award is None else award, steps,
                            control_number=str(filed["control_number"]))


def as_read(filed):
    """31017 as S742's reread left it: the movement list a choice of three courses."""
    g = copy.deepcopy(filed)
    for b in g["record"]["blocks"]:
        if b["name"] == LIST:
            b["rule"], b["minimum"] = "choose_courses", 3
    return g


# ── the step on the page's own lines ──
f = load("31017")
block = next(b for b in f["record"]["blocks"] if b["name"] == LIST)
check(block["rule"] in ("choose_courses", "choose_units") and block["minimum"] == 3
      and block["stated"] == {"min": 3, "max": 3},
      "31017: the movement list holds three (courses as read, or units once the reconcile files it) and states 3")
g = as_read(f)
before = arithmetic(g, g["record"])
check(before["status"] == "unequal" and before["against"] == "degree" and before["major"]["pass"]
      and before["computed"] == [54.0, 67.0] and before["stated"] == [60.0, 60.0],
      "31017 as read: the major passes and the degree reads 54-67 on both sides of the printed 60")
out, notes = step(g)
moved = next(b for b in out["blocks"] if b["name"] == LIST)
check(len(notes) == 1 and notes[0]["field"] == "blocks" and moved["rule"] == "choose_units" and moved["minimum"] == 3
      and notes[0]["was"] == {LIST: {"rule": "choose_courses", "minimum": 3}}
      and notes[0]["now"] == {LIST: {"rule": "choose_units", "minimum": 3}}
      and notes[0]["words"].startswith("Movement-based courses: (minimum 3 units) Select a maximum of one (1) course"),
      "31017: the movement list becomes 3 units to choose, and the note carries the page's words")
rest = copy.deepcopy(out)
for b in rest["blocks"]:
    if b["name"] == LIST:
        b["rule"], b["minimum"] = "choose_courses", 3
check(rest == g["record"], "31017: nothing but the list's rule and minimum moves")
after = arithmetic(g, out)
check(after["pass"] and after["status"] == "equal" and after["computed"] == [20.0, 24.0]
      and after["stated"] == [20.0, 27.0] and after["degree"]["pass"] and after["degree"]["computed"] == [54.0, 58.0]
      and after["degree"]["fill"] == [2.0, 6.0],
      "31017: today's scorer then passes it: the major 20-24 under the printed 20-27, the degree 54-58 with electives "
      "that fill 2-6")
whole, wnotes = step(g, steps=STEPS)
check([n["field"] for n in wnotes if n["field"] == "blocks"] == ["blocks"] and arithmetic(g, whole)["pass"],
      "31017: under the college's whole entry the step reads the same")
again, none = step(dict(g, record=out))
check(not none and again == out, "31017: a second run moves nothing (the record passes as filed)")

# ── the wrong joins it refuses ──
check(step(g, text=SECTION.replace("Movement-based courses:", "Activity courses:"))[1] == [],
      "a page without the words moves nothing")
check(step(g, text=SECTION.replace("(minimum 3 units)", "(minimum 4 units)"))[1] == [],
      "the words at another figure move nothing")
check(step(g, text=SECTION.replace("any three (3)", "any two (2)"))[1] == [], "the words with another count move nothing")
h = copy.deepcopy(g)
next(b for b in h["record"]["blocks"] if b["name"] == LIST)["stated"] = {"min": 3, "max": 6}
check(step(h)[1] == [], "a list that states a range is left as read")
h = copy.deepcopy(g)
for c in next(b for b in h["record"]["blocks"] if b["name"] == LIST)["courses"]:
    c["units"] = 2
check(step(h)[1] == [], "a list whose three cheapest courses pass the figure is left as read")
h = copy.deepcopy(g)
next(b for b in h["record"]["blocks"] if b["name"] == LIST)["courses"][0]["units"] = None
check(step(h)[1] == [], "a list with a course that carries no units is left as read")
h = copy.deepcopy(g)
h["record"]["program"]["degree_total"] = {"min": 50, "max": 50}
check(step(h)[1] == [], "a record the reading does not close is left as read")
h = copy.deepcopy(g)
next(b for b in h["record"]["blocks"] if b["name"] == LIST)["name"] = "List B: Movement-based courses"
check(step(h)[1] == [], "a list under another name is left as read")
check(step(g, award="A.A. Degree")[1] == [] and step(g, award="Certificate of Achievement")[1] == [],
      "a local degree or a certificate is never read (the step's awards)")
held = {ELA: dict(STEPS[ELA], steps=[dict(ST, hold={"31017": "a test's hold"})])}
check(step(g, steps=held)[1] == [], "a record the step's hold names is left as read")
check(step(g, college="Los Angeles City College")[1] == [] and step(g, college="No Such College")[1] == [],
      "another college's entry carries no such step")

# ── the self-recall ──
recall = collections.Counter()
joined = []
for p in sorted(glob.glob(os.path.join(FOLDER, "*.json"))):
    with open(p, encoding="utf-8") as fh:
        r = json.load(fh)
    cn = str(r["control_number"])
    r = as_read(r) if cn == "31017" else r
    recall["records"] += 1
    o, n = step(r)
    if not n:
        continue
    joined.append(cn)
    was, now = arithmetic(r, r["record"]).get("pass"), arithmetic(r, o).get("pass")
    recall["fail to pass" if now and not was else "pass to fail" if was and not now else "no change"] += 1
print("self-recall over East Los Angeles: %s; joined %s" % (dict(recall), joined))
check(joined == ["31017"] and recall["fail to pass"] == 1 and not recall["pass to fail"] and not recall["no change"]
      and recall["records"] >= 130,
      "of East Los Angeles's records, each offered 31017's own section, the step reads 31017 alone, which turns "
      "passing; no passing record turns failing")
named = re.compile(ST["block_pattern"])
state = collections.Counter()
others = 0
for p in sorted(glob.glob(os.path.join(ROOT, "kb", "program_requirements_college", "*", "records", "*.json"))):
    with open(p, encoding="utf-8") as fh:
        r = json.load(fh)
    if not isinstance(r.get("record"), dict):
        continue
    if any(b.get("rule") == "choose_courses" and named.search(b.get("name") or "") for b in r["record"].get("blocks") or []):
        state[r.get("college")] += 1
        if r.get("college") != ELA:
            # The other college's own entry, offered East Los Angeles's words: no note may rewrite such a list's rule.
            got = R._college_steps(r["record"], SECTION, r["college"], r.get("award"), STEPS,
                                   control_number=str(r.get("control_number")))[1]
            others += any(isinstance(n.get("now"), dict) and any(
                isinstance(v, dict) and v.get("rule") == "choose_units" and named.search(k)
                for k, v in n["now"].items()) for n in got)
print("statewide: %d records at %d colleges hold a choice list the block_pattern names" % (sum(state.values()), len(state)))
check(state[ELA] <= 1 and others == 0,
      "statewide, the step moves no other college's list of that name, even offered East Los Angeles's own words")

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
