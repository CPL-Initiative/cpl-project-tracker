#!/usr/bin/env python3
"""S739, lane 1 (the lever): Cosumnes River 33542 and East Los Angeles 33013 collected with named gaps, plan s739l
(kb/_program_piles_s739_lever.py).

WHY. Both records sat on the harvest lane's list as held: 33542 on main's filing after S720's reconcile passed it on
an electives fill the page does not print, 33013 for a person since S714. Sam's ruling of 2026-11-17 collects a
failing record with its gap named and a 0-100 confidence. Pinned here:

  * each entry's own reading, on the committed record: 33542's 'OPTION II' takes its two lists together, and read as
    two options the record adds to the printed 19 at both ends; 33013's printed 22-24 is the core with its lab, and
    with that path alone the record adds to 22-24 at both ends;
  * the wrong readings fail: 33542's options read as both (every block required) add to 35, and as filed (each list
    an alternative) to 11-19; 33013's core without the lab adds to 21-23; a record whose heading names another award
    on a shared page is refused by the own-page guard; a note's words gone, a total one unit off or a failing
    coverage check refuses the entry;
  * the plan: the rows pinned in the fixture (tests/fixtures/s739_lever.json), named exactly by the receipt and the
    four SQL files, the confirm guard, no .apply, a second run plans none, and the load's image of each committed
    record is its receipt's after-image with its record and page unchanged.

A row another open branch moves (lane 2 takes Cosumnes River's wording rules next) is accepted in either state: the
entry's reading is checked on the record with its gaps set aside (p-test-asserts-other-pr-absent-recurs-s731).

Run from repo root: python3 tests/program_piles_s739_lever_test.py
"""
import copy
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIXTURE = os.path.join(ROOT, "tests", "fixtures", "s739_lever.json")
MIG = os.path.join(ROOT, "kb", "migrations", "2026-11-26_s739l_prreq_piles_%s.sql")
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s739_lever as M  # noqa: E402
import _program_requirements_score as S  # noqa: E402

checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


with open(FIXTURE, encoding="utf-8") as fh:
    fx = json.load(fh)
rows = {(r["college"], r["control_number"]): r for r in fx["rows"]}

check(set(M.REVIEWED) == set(rows) and len(rows) == 2, "the reviewed rows are the fixture's 2")
check(set(M.LANE) == {"Cosumnes River College", "East Los Angeles College"}, "the two colleges")
check({k: e["gap"] for k, e in M.REVIEWED.items()} == {k: r["moves_to"] for k, r in rows.items()},
      "each key takes the fixture's gap")
check(all(e["gap"] in NG.GAPS and NG.ARITH_SCORE.get(e["gap"]) == 40 for e in M.REVIEWED.values()),
      "both kinds exist and score 40 on unit arithmetic")

# ── each entry's own reading, on the committed record ─────────────────────
crc, ela = (M.CRC, "33542"), (M.ELA, "33013")
f = M.load(crc)
e = M.REVIEWED[crc]
rec = f["record"]
check(M.gap_noted(crc)[0] == "option_lists_read_apart", "33542: the entry stands (%s)" % (M.gap_noted(crc),))
keys = M.option_keys(rec, e["options"])
check(sorted(keys.values()) == ["I", "II", "II"], "33542: Option I holds one block and Option II two (%s)" % keys)
a = M.major(rec, f["award"])
check(a.get("status") == "unequal" and a.get("computed") == [11.0, 19.0] and a.get("stated") == [19.0, 19.0],
      "33542: as filed, each list an alternative, the sum is 11-19 against 19 (%s)" % a)
a = M.major(M.as_option_parts(rec, e["options"]), f["award"])
check(a.get("status") == "equal" and a.get("computed") == [19.0, 19.0] and "fill" not in a,
      "33542: read as two options the record adds to 19 at both ends, with no fill (%s)" % a)
a = M.major(M.as_both(rec, e["options"]), f["award"])
check(a.get("status") != "equal" and a.get("computed") == [35.0, 35.0],
      "33542: the options read as both add to 35, not 19 (%s)" % a)
check(not M.scorer_passes(f), "33542: today's scorer does not pass it with no page text")
g = copy.deepcopy(f)
g["record"]["blocks"][3]["minimum"] = 7
g["record"]["blocks"][3]["stated"] = {"min": 7, "max": 7}
check(not M.kind_closes(g, e), "33542: Option II's list at 7 units no longer closes the reading")
g = copy.deepcopy(f)
g["record"]["blocks"][2]["name"] = "Native Spanish Speaker"
check(M.gap_noted(crc, g)[0] is None, "33542: a block that does not open with its option's numeral refuses the entry")
# The wrong page: the Spanish A.A. 15300 shares the PDF page; a heading naming that award is not this record's own.
g = copy.deepcopy(f)
g["record"]["program"]["section_heading"] = "A.A. in Spanish"
with M.lane():
    check(M.W.shared_with(*crc) == ["15300"], "33542: its page is shared with the Spanish A.A. 15300")
    check(M.W.own_page(f) and not M.W.own_page(g), "33542: the own-page guard reads the heading's award")
check(M.gap_noted(crc, g)[0] is None, "33542: read from the A.A.'s section, the entry is refused")

f = M.load(ela)
e = M.REVIEWED[ela]
rec = f["record"]
check(M.gap_noted(ela)[0] == "noted_figures_differ", "33013: the entry stands (%s)" % (M.gap_noted(ela),))
a = M.major(rec, f["award"])
check(a.get("status") == "unequal" and a.get("computed") == [21.0, 24.0] and a.get("stated") == [22.0, 24.0],
      "33013: as filed the major adds to 21-24 against 22-24 (%s)" % a)
a = M.major(M.one_path(rec, e["path"]), f["award"])
check(a.get("status") == "equal" and a.get("computed") == [22.0, 24.0],
      "33013: with the lab counted the major adds to 22-24 at both ends (%s)" % a)
a = M.major(M.one_path(rec, e["path"], keep="without"), f["award"])
check(a.get("status") == "unequal" and a.get("computed") == [21.0, 23.0],
      "33013: without the lab the major adds to 21-23, the page's own figures (%s)" % a)
lab = [b for b in rec["blocks"] if b["name"] == e["path"]["with"]][0]
check([S.norm_code(c["code"]) for c in lab["courses"]] == ["ANTHRO101", "ANTHRO111"]
      and [c["units"] for c in lab["courses"]] == [3, 1], "33013: the longer path is ANTHRO 101 (3) and its lab (1)")
g = copy.deepcopy(f)
g["record"]["blocks"] = [b for b in g["record"]["blocks"] if b["name"] != e["path"]["without"]]
check(M.gap_noted(ela, g)[0] is None, "33013: a record with one path only takes no gap from the entry")
check(not M.scorer_passes(f), "33013: today's scorer does not pass it with no page text")
check(NG.answer(dict(f, score={k: v for k, v in f["score"].items() if k not in ("gaps", "confidence")})) is None,
      "33013: no record rule names it under another kind")

bd = M.boundaries()
check(not bd["wrong"] and sum(bd["counts"].values()) == 12, "the twelve boundaries read right (%s)" % bd)

# ── the plan, read from the fixture ───────────────────────────────────────
with open(os.path.join(ROOT, fx["receipt"]), encoding="utf-8") as fh:
    rcpt = json.load(fh)
got = {(r["college"], r["control_number"]): r["moves_to"] for r in rcpt["records"]}
check(got == {k: r["moves_to"] for k, r in rows.items()} and rcpt["moved"] == 2, "the receipt names the fixture's 2")
check(rcpt["held"] == [], "the receipt holds none")
check(rcpt["options_shape_statewide"]["failing_and_closed_by_the_reading"] == ["Cosumnes River College 33542"],
      "statewide, the options reading closes 33542 alone among failing records")
for part in ("apply", "preread", "preread_md5", "rollback"):
    with open(MIG % part, encoding="utf-8") as fh:
        sql = fh.read()
    check(all("'%s'" % cn in sql and "'%s'" % c in sql for c, cn in rows), "%s names the 2" % part)
    check(sql.count("College', '") == 2, "%s names exactly 2 rows" % part)
    if part == "apply":
        check("confirm guard" in sql and "e(expect) as (values (2))" in sql, "the apply guards a confirm")
apply_marker = os.path.join(ROOT, "kb", "migrations", ".apply")
check(not os.path.exists(apply_marker) or "s739l" not in open(apply_marker, encoding="utf-8").read(),
      "the plan does not write .apply (d-conductor-owns-applies-s720)")
check(M.plan(write=False)["rows"] == [], "a second run plans none")
images = NG._load_images({c for c, _ in rows})
for r in rcpt["records"]:
    k = (r["college"], r["control_number"])
    img = images[k]
    check(img["checks"] == r["after_image"]["checks"], "%s %s: the load posts the receipt's after-image" % k)
    check(img["record"] == r["before_image"]["record"] and img["source_url"] == rows[k]["page"],
          "%s %s: the record and its page are unchanged" % k)
    check(img["checks"]["gaps"] == [r["moves_to"]] and img["checks"]["arithmetic"] != "equal",
          "%s %s: collected with its one gap, not passing" % k)
    check(img["checks"]["confidence"]["unit_arithmetic"] == 40 and r["confidence"] == img["checks"]["confidence"],
          "%s %s: unit arithmetic 40 on the 0-100 bar" % k)
    check(r["before_image"]["checks"].get("gaps") is None and str(r["before_image"]["extracted_run"]) ==
          str(rows[k]["extracted_run"]), "%s %s: the before-image is the filed run's, with no gap" % k)
    with M.lane():
        check(M.W.on_live_run(M.load(k)), "%s %s: on its live run" % k)

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
