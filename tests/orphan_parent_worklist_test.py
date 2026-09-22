#!/usr/bin/env python3
"""Guards kb/_build_orphan_parent_worklist.py and its committed output.

Item 9 of Sam's cross-list decision sheet (2026-09-22): identities whose
recorded discipline appears nowhere among their members get their own list,
ahead of the cross-list pass, because sending them through it would record the
disagreement as a second home.

⚠️ THE `decidable` COLUMN IS THE POINT, and it is why the discipline-blank
worklist has a corroboration column. A list of ids with nothing saying whether
the answer is checkable reads as a to-do, and the next session fills it. Here
93 of 111 rows are undecidable because the members disagree among themselves —
a split is a question, never a correction.

⚠️ AND `members_say` IS NOT A VERDICT. `AUTD M1040 Medium and Heavy Truck
Drivetrain Service` is recorded Diesel Mechanics while its members read
Automotive Technology, and Diesel Mechanics is arguably the better answer for a
heavy-truck drivetrain course. A build that renamed this field to something
imperative would turn the list into a patch.

Run from repo root:  python3 tests/orphan_parent_worklist_test.py
"""
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "kb", "orphan_parent_worklist.json")
BUILDER = os.path.join(ROOT, "kb", "_build_orphan_parent_worklist.py")

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


check("the committed worklist exists", os.path.exists(OUT), OUT)
doc = json.load(open(OUT, encoding="utf-8")) if os.path.exists(OUT) else {}
rows = doc.get("rows", [])
counts = doc.get("_counts", {})

# ── it is current ────────────────────────────────────────────────────────────
r = subprocess.run([sys.executable, BUILDER, "--check"], cwd=ROOT,
                   capture_output=True, text=True)
check("the committed worklist is current", r.returncode == 0,
      (r.stdout + r.stderr).strip())

# ── every row carries the column that stops it being a to-do ─────────────────
check("every row says whether it is decidable",
      rows and all("decidable" in x and "why" in x for x in rows),
      "a row without `why` is an id with no argument attached")

check("⭐ an undecidable row names what is missing",
      all(x["why"].strip() for x in rows if not x["decidable"]),
      "silence here is what turns a worklist into a patch")

check("an undecidable row proposes nothing",
      all(x.get("members_say") is None for x in rows if not x["decidable"]),
      "proposing a discipline for a row the payload cannot settle is the failure mode")

check("a decidable row says what the members read",
      all(x.get("members_say") for x in rows if x["decidable"]),
      "decidable with nothing to check against is a contradiction")

# ── the recorded discipline really is absent from the members ────────────────
check("⭐ every row's recorded discipline is absent from its members",
      all(x["recorded_discipline"] not in x["member_disciplines"] for x in rows),
      "a row whose parent agrees with any member belongs in neither this list nor a fix")

check("every row hears from more than one member discipline",
      all(len(x["member_disciplines"]) >= 2 for x in rows),
      "one voice disagreeing is a different problem")

# ── the field name stays honest ──────────────────────────────────────────────
check("⭐ the field is `members_say`, never a proposal",
      all("proposed_discipline" not in x for x in rows)
      and any("members_say" in x for x in rows),
      "AUTD M1040 reads Diesel Mechanics with Automotive Technology members, and "
      "Diesel Mechanics is arguably right — the column reports, it does not rule")

check("the header warns that members_say is not a verdict",
      "never a verdict" in doc.get("_read_this_first", ""),
      "the warning has to travel with the file, not only with this test")

# ── the counts agree with the rows ───────────────────────────────────────────
check("the counts match the rows",
      counts.get("orphan_parents") == len(rows)
      and counts.get("decidable") == sum(1 for x in rows if x["decidable"])
      and counts.get("undecidable") == sum(1 for x in rows if not x["decidable"]),
      json.dumps(counts))

# ── the short-code threshold has ONE source ──────────────────────────────────
src = open(BUILDER, encoding="utf-8").read()
check("⭐ the short-code threshold is imported, never re-stated",
      "SHORT_CODE_MAX" in src and "_seed_coci_minted_mids.py" in src
      and "SHORT_CODE_MAX = " not in src,
      "a second copy drifts — the alias chain went to 7 maps against 15 that way")

passed = 0
for name, ok, why in results:
    print(f"{'  ok' if ok else 'FAIL'}  {name}" + ("" if ok else f"  — {why}"))
    passed += ok
print(f"\n{passed}/{len(results)} checks passed")
sys.exit(0 if passed == len(results) else 1)
