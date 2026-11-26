#!/usr/bin/env python3
"""S739 wave B plan s739b: Riverside City's History AA-T 33230, collected with its gap named (ge_units_not_read).

    python3 tests/program_named_gaps_s739b_test.py

WHY. The census of 2026-11-26 06:54Z listed 33230 as a page found and never extracted. Read 45781329321 read it
from its own entry (36 of 36 listed courses placed, the major's 18 units equal) and load 45782612943 inserted it. Its
degree check is incomplete: the entry names Cal-GETC and a 60-unit degree and prints no units for the pattern, and
the college's Cal-GETC step holds it, since the entry's second heading line names CSUGE (reconcile 45781875995, 0
records changed). Sam's ruling (2026-11-17): never drop a record for failing; collect it with its gap named and
confidence scores. kb/_program_named_gaps.py's own record rule names it, and its plain pass, scoped to that gap and
to the census cause the program carried (--gap ge_units_not_read --census-cause found_not_extracted --tag s739b),
planned this one row: the receipt, a pre-read, a guarded UPDATE and a rollback, for the conductor's reader and apply.

  1. The receipt holds one row, Riverside City 33230 at run 45781329321, under that gap and that census cause.
  2. The row's after-image adds checks.gaps and checks.confidence and changes nothing else: arithmetic, coverage
     and invented are the before-image's, and the before-image carries no gap.
  3. The guarded UPDATE names exactly that row, and the pre-read and the rollback are filed beside it.
  4. The row is this session's insert (load 45782612943), so the before-image is the live row's.
  5. The rule on the record itself: with its gap taken off, the record takes ge_units_not_read again; with general
     education units read, or with a major that fails, it takes none. Riverside's Nutrition and Dietetics AS-T 38109,
     whose major adds to 22-26 against a printed 27-31, is the wrong record and takes no such gap.
Pure stdlib.
"""
import copy
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402

FAILS = []
N = [0]


def check(ok, what):
    N[0] += 1
    print(("ok   " if ok else "FAIL ") + what)
    if not ok:
        FAILS.append(what)


COLLEGE, CN, RUN, GAP = "Riverside City College", "33230", "45781329321", "ge_units_not_read"
RECEIPT = os.path.join(ROOT, "kb", "receipts", "program_requirement_records_named_gaps_2026-11-26_s739b.json")
MIG = os.path.join(ROOT, "kb", "migrations", "2026-11-26_s739b_prreq_named_gaps_%s.sql")
RECORDS = os.path.join(ROOT, "kb", "program_requirements_college", "riverside_city", "records")

with open(RECEIPT, encoding="utf-8") as fh:
    body = json.load(fh)
rows = body["records"]

# ── 1. one row, under its gap and its census cause ────────────────────────────────────────────────────
check(len(rows) == 1 and (rows[0]["college"], str(rows[0]["control_number"]), str(rows[0]["extracted_run"])) == (COLLEGE, CN, RUN)
      and rows[0]["gap"] == GAP, "the plan holds one row: %s %s at run %s, %s" % (COLLEGE, CN, RUN, GAP))
check(body.get("only_gaps") == [GAP] and body.get("census_causes") == ["found_not_extracted"] and body.get("by_gap") == {GAP: 1},
      "the pass was scoped to %s and to the census cause found_not_extracted" % GAP)
row = rows[0] if rows else {}
check("Cal-GETC" in row.get("words", "") and "18" in row.get("words", ""),
      "the row's words name the pattern and the printed major total (%r)" % row.get("words"))

# ── 2. the after-image adds the gap and the confidence and nothing else ───────────────────────────────
before, after = (row.get("before_image") or {}).get("checks") or {}, (row.get("after_image") or {}).get("checks") or {}
check(not before.get("gaps") and after.get("gaps") == [GAP], "the before-image carries no gap; the after-image carries %s" % GAP)
check(after.get("confidence") == row.get("confidence") and (row.get("confidence") or {}).get("unit_arithmetic") == 50,
      "the after-image carries the row's confidence, unit arithmetic 50")
check(all(before.get(k) == after.get(k) for k in ("arithmetic", "coverage", "invented", "placed", "listed"))
      and bool(before.get("arithmetic")), "arithmetic, coverage, invented and the placed count are the before-image's")
check({k for k in set(after) | set(before) if after.get(k) != before.get(k)} == {"gaps", "confidence"},
      "nothing but gaps and confidence differs between the images (%s)"
      % sorted(k for k in set(after) | set(before) if after.get(k) != before.get(k)))
check(before.get("arithmetic") == "incomplete" and before.get("placed") == before.get("listed") == 36
      and before.get("coverage") is True,
      "the before-image's arithmetic is incomplete and it places 36 of 36")
check((row.get("before_image") or {}).get("record") is not None and "record" not in (row.get("after_image") or {}),
      "the plan carries the record's before-image and changes no record")

# ── 3. the guarded UPDATE names exactly the row ───────────────────────────────────────────────────────
apply_sql = open(MIG % "apply", encoding="utf-8").read()
named = re.findall(r"^\s*\((\d+), '((?:[^']|'')*)', '(\w+)', (\d+),", apply_sql, re.M)
check(named == [("1", COLLEGE, CN, RUN)], "the UPDATE's values name exactly the plan's row (%s)" % named)
check("checked" in apply_sql and "skipped_checked" in apply_sql and "update " in apply_sql.lower(),
      "the UPDATE is guarded: a row a person checked is skipped and listed")
check(all(os.path.isfile(MIG % part) for part in ("preread", "rollback")) and not os.path.exists(MIG % "preread_md5"),
      "the pre-read and the rollback are filed beside it (no md5 pre-read: one row, read whole)")
check((COLLEGE in open(MIG % "rollback", encoding="utf-8").read()) and "'%s'" % CN in open(MIG % "preread", encoding="utf-8").read(),
      "the pre-read and the rollback name the row")

# ── 4. the row is this session's insert ───────────────────────────────────────────────────────────────
with open(os.path.join(ROOT, "kb", "receipts", "program_requirement_records_college_riverside_city_45782612943.json"),
          encoding="utf-8") as fh:
    load = json.load(fh)
check(load.get("inserted_keys") == [CN] and load.get("inserted") == 1 and RUN in [str(r) for r in load.get("extracted_runs") or []],
      "load 45782612943 inserted %s alone, from run %s" % (CN, RUN))

# ── 5. the rule on the record itself ──────────────────────────────────────────────────────────────────
with open(os.path.join(RECORDS, CN + ".json"), encoding="utf-8") as fh:
    filed = json.load(fh)
if str(filed.get("extracted_run")) == RUN:
    gaps = (filed.get("score") or {}).get("gaps") or []
    check([g.get("gap") for g in gaps] == [GAP] and (filed["score"].get("confidence") or {}).get("ge_pattern") == 50,
          "the committed record, still run %s's, carries the gap and its confidence" % RUN)
    bare = copy.deepcopy(filed)
    bare["score"].pop("gaps", None)
    bare["score"].pop("confidence", None)
    got = NG.judge(bare)
    check(bool(got) and got[0] == GAP, "with its gap taken off, the record takes %s again (%s)" % (GAP, got and got[0]))
    read = copy.deepcopy(bare)
    read["score"]["arithmetic"] = dict(read["score"]["arithmetic"], **{"pass": True, "status": "equal", "why": []})
    read["score"]["pass"] = True
    check(NG.judge(read) is None, "a record whose degree check passes takes no gap")
    broken = copy.deepcopy(bare)
    broken["score"]["arithmetic"]["major"] = dict(broken["score"]["arithmetic"]["major"], **{"pass": False, "status": "unequal"})
    got = NG.judge(broken)
    check(not got or got[0] != GAP, "the same record with a major that fails does not take %s" % GAP)
else:
    # Another read moved the record on: the plan's guard (the filed run) refuses the row, and nothing here applies.
    check(str(filed.get("extracted_run")) != RUN, "the record has moved to run %s; the plan's guard refuses it" % filed.get("extracted_run"))
with open(os.path.join(RECORDS, "38109.json"), encoding="utf-8") as fh:
    wrong = json.load(fh)
got = NG.judge(wrong)
check(not got or got[0] != GAP, "Riverside 38109, whose major does not add up, takes no %s (%s)" % (GAP, got and got[0]))

print("\n%d checks, %d failed" % (N[0], len(FAILS)))
sys.exit(1 if FAILS else 0)
