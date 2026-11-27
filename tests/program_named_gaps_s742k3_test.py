#!/usr/bin/env python3
"""S742, lane 1 (keys), plan s742k3: San Bernardino Valley's Environmental Science A.S. 17829, collected with its gap
named (ge_units_not_read) on the row its reread posted.

    python3 tests/program_named_gaps_s742k3_test.py

WHY. S740 and S741 held 17829: its filed arithmetic was an older scorer's (the major's 50-60 against the printed
50-63), and each free reconcile that brought it to today's was undone by keep-better, which ranked the degree's
'incomplete' below the filed 'unequal'. S741's ranking keeps an incomplete re-read whose major equals over a filed
record whose major does not. This session's free reconcile 46000859685 re-filed 17829 (the major passes by the
short-high reading; the degree names 60 and a general education pattern with no units), keep-better kept it on the
conductor's live read of 13:08Z, and reread 46006706537 posted it. The reread came before the plan
(d-reread-before-rebuilt-plan-s741). kb/_program_named_gaps.py's own record rule names the gap, and its wave pass at
the college (--wave --college 'San Bernardino Valley College' --tag s742k3) planned this one row.

  1. The receipt holds one row, San Bernardino Valley 17829 at run 46000859685, under ge_units_not_read.
  2. The row's after-image adds checks.gaps and checks.confidence and changes nothing else; the before-image
     carries no gap and reads incomplete with every listed course placed.
  3. The guarded UPDATE names exactly that row; the pre-read, the md5 pre-read and the rollback are filed beside it,
     and the md5 pre-read is the shared builder's over the receipt's row.
  4. The reread's receipt posted the row at that run before the plan was written, and keep-better's account kept it
     for the major's sake.
  5. The rule on the record itself: with its gap taken off, the record takes ge_units_not_read again; with a degree
     check that passes, or a major that fails, it takes none.
  6. The plan writes no .apply (d-conductor-owns-applies-s720).
"""
import copy
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


COLLEGE, CN, RUN, GAP = "San Bernardino Valley College", "17829", "46000859685", "ge_units_not_read"
REREAD = "46006706537"
RECEIPT = os.path.join(ROOT, "kb", "receipts", "program_requirement_records_named_gaps_2026-11-27_s742k3.json")
MIG = os.path.join(ROOT, "kb", "migrations", "2026-11-27_s742k3_prreq_named_gaps_%s.sql")
DIR = os.path.join(ROOT, "kb", "program_requirements_college", "san_bernardino_valley")

with open(RECEIPT, encoding="utf-8") as fh:
    body = json.load(fh)
rows = body["records"]

# ── 1. one row, under its gap ─────────────────────────────────────────────
check(len(rows) == 1 and (rows[0]["college"], str(rows[0]["control_number"]), str(rows[0]["extracted_run"]))
      == (COLLEGE, CN, RUN) and rows[0]["gap"] == GAP and rows[0]["part"] == "A",
      "the plan holds one row: %s %s at run %s, %s" % (COLLEGE, CN, RUN, GAP))
check(body.get("colleges") == [COLLEGE] and body.get("by_gap") == {GAP: 1} and body.get("collected") == 1
      and RUN in body["wave_runs"][COLLEGE] and body.get("checked_excluded") == [] and body.get("held_out") == [],
      "the wave pass was scoped to the college and its re-read runs, and held nothing out")
check(body["recall"]["wrong"] == 0 and body["recall"]["right"] == body["recall"]["held"],
      "the record rules' self-recall reads no wrong answer (%s of %s)" % (body["recall"]["right"], body["recall"]["held"]))
row = rows[0] if rows else {}
check("50-63" in row.get("words", "") and "General Education" in row.get("words", ""),
      "the row's words name the pattern and the printed major total (%r)" % row.get("words"))

# ── 2. the after-image adds the gap and the confidence and nothing else ───
before = (row.get("before_image") or {}).get("checks") or {}
after = (row.get("after_image") or {}).get("checks") or {}
check(not before.get("gaps") and after.get("gaps") == [GAP],
      "the before-image carries no gap; the after-image carries %s" % GAP)
check(after.get("confidence") == row.get("confidence") and (row.get("confidence") or {}).get("unit_arithmetic") == 50
      and (row.get("confidence") or {}).get("ge_pattern") == 50,
      "the after-image carries the row's confidence: unit arithmetic 50, general education pattern 50")
check({k for k in set(after) | set(before) if after.get(k) != before.get(k)} == {"gaps", "confidence"},
      "nothing but gaps and confidence differs between the images")
check(before.get("arithmetic") == "incomplete" and before.get("placed") == before.get("listed") == 31
      and before.get("coverage") is True and before.get("invented") is True,
      "the before-image's arithmetic is incomplete and it places 31 of 31")
check((row.get("before_image") or {}).get("record") is not None and "record" not in (row.get("after_image") or {}),
      "the plan carries the record's before-image and changes no record")

# ── 3. the SQL files ──────────────────────────────────────────────────────
apply_sql = open(MIG % "apply", encoding="utf-8").read()
named = re.findall(r"^\s*\((\d+), '(\w)', '((?:[^']|'')*)', '(\w+)', (\d+),", apply_sql, re.M)
check(named == [("1", "A", COLLEGE, CN, RUN)], "the UPDATE's values name exactly the plan's row (%s)" % named)
check("checked" in apply_sql and "skipped_checked" in apply_sql and "update " in apply_sql.lower(),
      "the UPDATE is guarded: a row a person checked is skipped and listed")
check(all(os.path.isfile(MIG % part) for part in ("preread", "preread_md5", "rollback")),
      "the pre-read, the md5 pre-read and the rollback are filed beside it")
check(COLLEGE in open(MIG % "rollback", encoding="utf-8").read()
      and "'%s'" % CN in open(MIG % "preread", encoding="utf-8").read(), "the pre-read and the rollback name the row")
md5_sql = open(MIG % "preread_md5", encoding="utf-8").read()
md5s = re.findall(r"\(1, '%s', '%s', %s, '([0-9a-f]{32})', '([0-9a-f]{32})', '([0-9a-f]{32})'\)" % (COLLEGE, CN, RUN),
                  md5_sql)
check(len(md5s) == 1 and len(set(md5s[0])) == 3 and md5_sql.count("College', '") == 1
      and "md5(r.record::text)" in md5_sql and "md5(r.checks::text)" in md5_sql,
      "the md5 pre-read names the one row with three hashes: its record, its checks before and its checks after")
try:
    built = B.md5_pre_read(rows)
except Exception:  # noqa: BLE001  no local Postgres (CI): the committed file is read as filed
    built = None
check(built is None or built.strip() in md5_sql, "the md5 pre-read is the shared builder's over the receipt's row")

# ── 4. the reread came first, and keep-better kept the row ────────────────
with open(os.path.join(ROOT, "kb", "receipts",
                       "program_requirement_records_college_reread_san_bernardino_valley_%s.json" % REREAD),
          encoding="utf-8") as fh:
    reread = json.load(fh)
check(reread["replaced_keys"] == [CN] and str(reread["extracted_run"]) == RUN and reread["at"] < body["at"]
      and not reread.get("error"),
      "reread %s posted 17829 at run %s before the plan was written" % (REREAD, RUN))
with open(os.path.join(DIR, "reread_keep_better.json"), encoding="utf-8") as fh:
    kb = json.load(fh)
mine = [p for p in ((kb.get("runs") or {}).get(RUN) or {}).get("programs") or [] if p.get("control_number") == CN]
if not mine and str(kb.get("run")) == RUN:
    mine = [p for p in kb.get("programs") or [] if p.get("control_number") == CN]
check(len(mine) == 1 and mine[0]["outcome"] == "kept" and "incomplete_major_equal" in mine[0]["why"],
      "keep-better kept the re-read: incomplete with its major equal, over the filed unequal (%s)"
      % (mine and mine[0].get("why")))

# ── 5. the rule on the record itself ──────────────────────────────────────
with open(os.path.join(DIR, "records", CN + ".json"), encoding="utf-8") as fh:
    filed = json.load(fh)
if str(filed.get("extracted_run")) == RUN:
    gaps = (filed.get("score") or {}).get("gaps") or []
    check([g.get("gap") for g in gaps] == [GAP] and (filed["score"].get("confidence") or {}).get("ge_pattern") == 50,
          "the committed record, still run %s's, carries the gap and its confidence" % RUN)
    a = filed["score"]["arithmetic"]
    check(a["against"] == "degree" and a["status"] == "incomplete" and a["stated"] == [60.0, 60.0]
          and a["major"]["pass"] is True and a["major"].get("short_high") is True
          and a["major"]["computed"] == [50.0, 60.0] and a["major"]["stated"] == [50.0, 63.0],
          "the major passes by the short-high reading (50-60 against 50-63) and the degree's 60 reads incomplete")
    prog = filed["record"]["program"]
    check(prog.get("ge_pattern") and (prog.get("ge_units") or {}).get("min") is None,
          "the record names a general education pattern and no units for it")
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
    broken["score"]["arithmetic"]["major"] = dict(broken["score"]["arithmetic"]["major"],
                                                  **{"pass": False, "status": "unequal"})
    got = NG.judge(broken)
    check(not got or got[0] != GAP, "the same record with a major that fails does not take %s" % GAP)
else:
    # Another read moved the record on: the plan's guard (the filed run) refuses the row, and nothing here applies.
    check(str(filed.get("extracted_run")) != RUN,
          "the record has moved to run %s; the plan's guard refuses it" % filed.get("extracted_run"))

# ── 6. no .apply ──────────────────────────────────────────────────────────
marker = os.path.join(ROOT, "kb", "migrations", ".apply")
check(not os.path.exists(marker) or "s742k3" not in open(marker, encoding="utf-8").read(),
      "the plan does not write .apply (d-conductor-owns-applies-s720)")

print("%d checks, %d failures" % (N[0], len(FAILS)))
for m in FAILS:
    print("FAIL:", m)
sys.exit(1 if FAILS else 0)
