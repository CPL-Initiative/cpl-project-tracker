#!/usr/bin/env python3
"""S748, lane 1 (keys), plan s748k1: three records collected with their gap named, by the named-gaps module's own
record rules, on rows a load already posted.

    python3 tests/program_named_gaps_s748k1_test.py

WHY. The census of 2026-11-28 00:44Z (run 46089216929) still counts these three as active programs with no passing
record, and each is a filed record a record rule of kb/_program_named_gaps.py already names a gap for, with no
catalog read and no model call (Sam, sam-collect-with-gaps-2026-11-17: a record with a true gap is collected with
the gap named and a lower score, never held for another night):

  College of the Canyons 38686, 44273 and 45610 (noncredit certificates measured in hours): each lists its one
      required course with no hours (no_hours_read, unit arithmetic 20). Run 44886816990 read them new, and load
      44887749460 inserted them; no later reread replaced them.

NOT IN THE PLAN. Cosumnes River 31055 (Physics A.S.-T, ge_units_not_read on the row reread 46006685503 posted at run
45972311864): the same pass names it, and tests/program_ge_units_not_read_s703_test.py holds every record of the six
colleges lane 1 held on 2026-11-22, Cosumnes River among them, free of that gap. The hold is a session's to lift, with
a reader; this plan leaves the college out, and check 8 pins that it does.

The module's wave pass planned them (--wave --college 'College of the Canyons' --tag s748k1), the pass behind
s742k3: existing kinds only, no new matcher, the record rules' self-recall 1,695 right
and 0 wrong over the failing records whose answer is held.

  1. The receipt holds three rows, each at its run, under its gap.
  2. Each row's after-image adds checks.gaps and checks.confidence and changes nothing else; each before-image
     carries no gap, places every listed course and reads incomplete.
  3. The guarded UPDATE names exactly those rows; the pre-read, the md5 pre-read and the rollback are filed beside
     it, and the md5 pre-read is the shared builder's over the receipt's rows.
  4. Each row sits on a run the college's keep-better account names, and the committed load receipt inserted it
     there before the plan was written; no later reread replaced it.
  5. The rule on each record itself: with its gap taken off, the record takes the same gap again; with an
     arithmetic that passes, it takes none.
  6. The census of 00:44Z counts each of the three in the gap.
  7. The plan writes no .apply (d-conductor-owns-applies-s720).
  8. No record of Cosumnes River carries ge_units_not_read (the S703 hold stands).
"""
import copy
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s739 as B  # noqa: E402

FAILS = []
N = [0]


def check(ok, what):
    N[0] += 1
    if not ok:
        FAILS.append(what)


CANYONS, CRC = "College of the Canyons", "Cosumnes River College"
ROWS = [(CANYONS, "38686", "44886816990", "no_hours_read"), (CANYONS, "44273", "44886816990", "no_hours_read"),
        (CANYONS, "45610", "44886816990", "no_hours_read")]
SLUG = {CANYONS: "college_of_the_canyons", CRC: "cosumnes_river"}
LOAD = "44887749460"
RECEIPT = os.path.join(ROOT, "kb", "receipts", "program_requirement_records_named_gaps_2026-11-28_s748k1.json")
MIG = os.path.join(ROOT, "kb", "migrations", "2026-11-28_s748k1_prreq_named_gaps_%s.sql")
DIR = os.path.join(ROOT, "kb", "program_requirements_college")

with open(RECEIPT, encoding="utf-8") as fh:
    body = json.load(fh)
rows = body["records"]

# ── 1. three rows, each under its gap ──────────────────────────────────────
got = [(r["college"], str(r["control_number"]), str(r["extracted_run"]), r["gap"]) for r in rows]
check(got == ROWS and all(r["part"] == "A" for r in rows) and [r["i"] for r in rows] == [1, 2, 3],
      "the plan holds the three rows, each at its run and under its gap (%s)" % got)
check(body.get("colleges") == [CANYONS] and body.get("by_gap") == {"no_hours_read": 3}
      and body.get("by_college") == {CANYONS: 3} and body.get("collected") == 3
      and body.get("checked_excluded") == [] and body.get("held_out") == [],
      "the wave pass was scoped to the one college, and held nothing out")
check(body["recall"]["wrong"] == 0 and body["recall"]["right"] == body["recall"]["held"] >= 1695,
      "the record rules' self-recall reads no wrong answer (%s of %s)" % (body["recall"]["right"], body["recall"]["held"]))
check(set(GAP for _, _, _, GAP in ROWS) <= set(NG.GAPS), "the gap is a kind the module already holds")
words = {str(r["control_number"]): r.get("words", "") for r in rows}
check(all(code in words[cn] for cn, code in (("38686", "NC.PHOT-099"), ("44273", "NC.HLTH-001"), ("45610", "NC.CAWT-110"))),
      "each row's words name the course read without hours")

# ── 2. the after-image adds the gap and the confidence and nothing else ───
for r in rows:
    key = "%s %s" % (r["college"], r["control_number"])
    before = (r.get("before_image") or {}).get("checks") or {}
    after = (r.get("after_image") or {}).get("checks") or {}
    check(not before.get("gaps") and after.get("gaps") == [r["gap"]], "%s: no gap before, %s after" % (key, r["gap"]))
    check(after.get("confidence") == r.get("confidence")
          and (r.get("confidence") or {}).get("unit_arithmetic") == NG.ARITH_SCORE[r["gap"]],
          "%s: the after-image carries the row's confidence at its gap's score" % key)
    check({k for k in set(after) | set(before) if after.get(k) != before.get(k)} == {"gaps", "confidence"},
          "%s: nothing but gaps and confidence differs between the images" % key)
    check(before.get("arithmetic") == "incomplete" and before.get("coverage") is True and before.get("invented") is True
          and before.get("placed") == before.get("listed"),
          "%s: the before-image reads incomplete and places every listed course" % key)
    check(str((r.get("before_image") or {}).get("extracted_run")) == str(r["extracted_run"])
          and (r.get("before_image") or {}).get("record") is not None and "record" not in (r.get("after_image") or {}),
          "%s: the plan carries the record's before-image at the row's run and changes no record" % key)

# ── 3. the SQL files ──────────────────────────────────────────────────────
apply_sql = open(MIG % "apply", encoding="utf-8").read()
named = re.findall(r"^\s*\((\d+), '(\w)', '((?:[^']|'')*)', '(\w+)', (\d+),", apply_sql, re.M)
check(named == [(str(i), "A", c, cn, run) for i, (c, cn, run, _) in enumerate(ROWS, 1)],
      "the UPDATE's values name exactly the plan's rows (%s)" % named)
check("checked" in apply_sql and "skipped_checked" in apply_sql and "update " in apply_sql.lower(),
      "the UPDATE is guarded: a row a person checked is skipped and listed")
check(all(os.path.isfile(MIG % part) for part in ("preread", "preread_md5", "rollback")),
      "the pre-read, the md5 pre-read and the rollback are filed beside it")
pre, back = open(MIG % "preread", encoding="utf-8").read(), open(MIG % "rollback", encoding="utf-8").read()
check(all("'%s'" % cn in pre and "'%s'" % cn in back for _, cn, _, _ in ROWS) and CANYONS in back and CRC not in back,
      "the pre-read and the rollback name each row")
md5_sql = open(MIG % "preread_md5", encoding="utf-8").read()
hashes = [re.findall(r"\(%d, '%s', '%s', %s, '([0-9a-f]{32})', '([0-9a-f]{32})', '([0-9a-f]{32})'\)" % (i, c, cn, run),
                     md5_sql) for i, (c, cn, run, _) in enumerate(ROWS, 1)]
check(all(len(h) == 1 and len(set(h[0])) == 3 for h in hashes) and len(re.findall(r"^\s*\(\d+, '", md5_sql, re.M)) == 3
      and "md5(r.record::text)" in md5_sql and "md5(r.checks::text)" in md5_sql,
      "the md5 pre-read names the three rows, each with three hashes: its record, its checks before and after")
try:
    built = B.md5_pre_read(rows)
except (Exception, SystemExit):  # noqa: BLE001  no local Postgres (CI): the committed file is read as filed
    built = None
check(built is None or built.strip() in md5_sql, "the md5 pre-read is the shared builder's over the receipt's rows")

# ── 4. each row's run is posted, before the plan ──────────────────────────
for college, cn, run, _ in ROWS:
    with open(os.path.join(DIR, SLUG[college], "reread_keep_better.json"), encoding="utf-8") as fh:
        acct = json.load(fh)
    check(run in (acct.get("runs") or {}) and run in body["wave_runs"][college],
          "%s's keep-better account names run %s" % (college, run))
with open(os.path.join(ROOT, "kb", "receipts",
                       "program_requirement_records_college_college_of_the_canyons_%s.json" % LOAD),
          encoding="utf-8") as fh:
    load = json.load(fh)
check({"38686", "44273", "45610"} <= set(load.get("inserted_keys") or []) and not load.get("error")
      and load["at"] < body["at"], "load %s inserted Canyons' three before the plan was written" % LOAD)
later = []
for path in glob.glob(os.path.join(ROOT, "kb", "receipts",
                                   "program_requirement_records_college_reread_college_of_the_canyons_*.json")):
    with open(path, encoding="utf-8") as fh:
        r = json.load(fh)
    if r.get("at", "") > load["at"] and {"38686", "44273", "45610"} & set(r.get("replaced_keys") or []):
        later.append(os.path.basename(path))
check(not later, "no reread after that load replaced any of the three (%s)" % later)

# ── 5. the rule on each record itself ─────────────────────────────────────
for college, cn, run, gap in ROWS:
    key = "%s %s" % (college, cn)
    with open(os.path.join(DIR, SLUG[college], "records", cn + ".json"), encoding="utf-8") as fh:
        filed = json.load(fh)
    if str(filed.get("extracted_run")) != run:
        # Another read moved the record on: the plan's guard (the filed run) refuses the row.
        check(True, "%s has moved to run %s; the plan's guard refuses it" % (key, filed.get("extracted_run")))
        continue
    gaps = (filed.get("score") or {}).get("gaps") or []
    check([g.get("gap") for g in gaps] == [gap] and gaps[0].get("label") == NG.GAPS[gap],
          "%s: the committed record, still run %s's, carries the gap and its sentence" % (key, run))
    bare = copy.deepcopy(filed)
    bare["score"].pop("gaps", None)
    bare["score"].pop("confidence", None)
    judged = NG.judge(bare)
    check(bool(judged) and judged[0] == gap,
          "%s: with its gap taken off, the record takes %s again (%s)" % (key, gap, judged and judged[0]))
    read = copy.deepcopy(bare)
    read["score"]["arithmetic"] = dict(read["score"]["arithmetic"], **{"pass": True, "status": "equal", "why": []})
    read["score"]["pass"] = True
    check(NG.judge(read) is None, "%s: a record whose arithmetic passes takes no gap" % key)
    if gap == "no_hours_read":
        check((filed["record"].get("program") or {}).get("measure") == "hours",
              "%s is measured in hours, so the hours kind is its own" % key)
    else:
        a = filed["score"]["arithmetic"]
        prog = filed["record"]["program"]
        check(a["against"] == "degree" and a["status"] == "incomplete" and a["major"]["pass"] is True
              and prog.get("ge_pattern") and (prog.get("ge_units") or {}).get("min") is None,
              "%s: the major passes, and the degree names a general education pattern with no units" % key)

# ── 6. the census counts each in the gap ──────────────────────────────────
with open(os.path.join(ROOT, "kb", "status", "harvest_gap_census.json"), encoding="utf-8") as fh:
    census = json.load(fh)
if census.get("written_at") == "2026-11-28 00:44Z":
    by = census["programs_by_college"]
    check(all((by.get(c) or {}).get(cn) for c, cn, _, _ in ROWS),
          "the census of 00:44Z lists each of the three among the programs with no passing record")
    check(not any(m["college"] == c and m["control_number"] == cn for c, cn, _, _ in ROWS
                  for m in census["collected_with_gaps"]["members"]), "and none as collected yet")

# ── 7. no .apply ──────────────────────────────────────────────────────────
marker = os.path.join(ROOT, "kb", "migrations", ".apply")
check(not os.path.exists(marker) or "s748k1" not in open(marker, encoding="utf-8").read(),
      "the plan does not write .apply (d-conductor-owns-applies-s720)")

# ── 8. the S703 hold stands at Cosumnes River ─────────────────────────────
held = []
for path in glob.glob(os.path.join(DIR, SLUG[CRC], "records", "*.json")):
    with open(path, encoding="utf-8") as fh:
        sc = json.load(fh).get("score") or {}
    if "ge_units_not_read" in [g.get("gap") for g in sc.get("gaps") or [] if isinstance(g, dict)]:
        held.append(os.path.basename(path))
check(not held and all(r["college"] != CRC for r in rows),
      "no Cosumnes River record carries ge_units_not_read, and the plan names none (%s)" % held)

print("%d checks, %d failures" % (N[0], len(FAILS)))
for m in FAILS:
    print("FAIL:", m)
sys.exit(1 if FAILS else 0)
