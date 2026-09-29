#!/usr/bin/env python3
"""Guards kb/_build_discipline_blanks_worklist.py and its committed output.

Sam's ruling of 2026-09-08 (the subject-discipline edge sheet, item 9): the
identities `discipline_edge_fill()` cannot reach are handed to a CURATOR as a
named list, not filled by inference. The list is only worth having if it is
current and if it keeps saying WHY each code is unfillable — so this checks
both, plus the one column that carries the argument.

⚠️ THE CORROBORATION COLUMN IS THE POINT. Measured 2026-09-08: 37 of the 45
codes have no other identity carrying that prefix, and 6 more read "unanimous"
off a SINGLE row. A build that dropped that column would leave a list of codes
indistinguishable from a to-do, and the next session would fill them.

Run from repo root:  python3 tests/discipline_blanks_worklist_test.py
"""
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "kb", "discipline_blanks_worklist.json")
BUILDER = os.path.join(ROOT, "kb", "_build_discipline_blanks_worklist.py")

results = []
def check(name, cond, detail=""):
    results.append((name, bool(cond), detail))

doc = json.load(open(OUT, encoding="utf-8"))
subs = doc["subjects"]
counts = doc["_counts"]

check("the committed worklist is not stale",
      subprocess.run([sys.executable, BUILDER, "--check"], cwd=ROOT,
                     capture_output=True).returncode == 0,
      "run: python3 kb/_build_discipline_blanks_worklist.py")

check("every entry says what corroboration exists",
      all(r.get("corroboration") for r in subs))

# ⚠️ Never let a single row be reported as agreement. One voter is the HUMN
# case: its lone identity is a film-music course while its blanks are
# popular-culture titles, so "unanimous" there would have mis-filed three rows.
check("a single voting row is never reported as agreement",
      all(r["corroboration"] == "a single row, which is not a vote"
          for r in subs if r["same_prefix_identities"] == 1),
      "; ".join(r["subj4"] + "=" + r["corroboration"]
                for r in subs if r["same_prefix_identities"] == 1
                and r["corroboration"] != "a single row, which is not a vote"))

check("a code with no same-prefix identity says so plainly",
      all("none" in r["corroboration"]
          for r in subs if r["same_prefix_identities"] == 0))

check("the counts agree with the rows",
      counts["subject_codes"] == len(subs)
      and counts["blank_after_fill"] == sum(r["identities_blank"] for r in subs)
      and counts["codes_with_no_corroboration"] == sum(1 for r in subs if not r["same_prefix_identities"])
      and counts["codes_corroborated_by_one_row"] == sum(1 for r in subs if r["same_prefix_identities"] == 1),
      json.dumps(counts))

check("every entry carries its ids and titles, one per blank identity",
      all(len(r["ids"]) == r["identities_blank"] and len(r["titles"]) == r["identities_blank"]
          for r in subs))

# The five codes Sam ruled into the map on 2026-09-08 must NOT be waiting here.
RULED_IN = {"BSOT", "HUMA", "GRAF", "BCST", "BARB"}
check("the five codes ruled into the subject map have left the worklist",
      not (RULED_IN & {r["subj4"] for r in subs}),
      ", ".join(sorted(RULED_IN & {r["subj4"] for r in subs})))

# HOSP was ruled OUT of the map (item 6, genuinely split) — it belongs here.
hosp = next((r for r in subs if r["subj4"] == "HOSP"), None)
check("HOSP is on the list, with its split shown rather than a value",
      hosp is not None and hosp["same_prefix_identities"] > 1
      and hosp["how_many_agree"] < hosp["same_prefix_identities"],
      json.dumps(hosp and {k: hosp[k] for k in ("same_prefix_identities", "how_many_agree")}))

failed = 0
for name, ok, detail in results:
    print(("PASS " if ok else "FAIL ") + name + ("" if ok or not detail else "\n      → " + detail))
    if not ok:
        failed += 1
print("\n%d/%d checks passed" % (len(results) - failed, len(results)))
sys.exit(1 if failed else 0)
