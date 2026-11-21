#!/usr/bin/env python3
"""kb/_build_local_subject_recommendations.py (S700, #3655; Sam, 2026-11-21: a recommendation beside every row
with no catalog title, its confidence measured before it shows).

Failure modes: a titled code's own heading counted in its own vote (every source would read 100%); a level that is
not the one its source measured; program titles reading High (Sam: they inform, never set); a row on the noncredit
hold given a recommendation; a differing source left out of sight; the subject map or Sam's 30 decisions read as a
source; a committed file that the daily build would rewrite.

Run from repo root: python3 tests/local_subject_recommendations_test.py
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _build_local_subject_recommendations as R  # noqa: E402

results = []


def check(name, cond):
    results.append(bool(cond))
    print(("  ok  " if cond else "FAIL  ") + name)


check("a title is right when it equals the heading after folding case, '&' and punctuation",
      R.same("Anatomy & Physiology", "ANATOMY AND PHYSIOLOGY") and not R.same("Chicano Studies", "Computer Science"))
check("a title that names the other whole is right; a shared word alone is not",
      R.same("Welding", "Welding Technology") and not R.same("Business Law", "Business Management"))
check("a vote folds spellings of one title and breaks a tie by the text, never by order",
      R.vote(["Art", "ART", "Music"])[1:] == (2, 3) and R.vote(["B", "A"])[0] == R.vote(["A", "B"])[0])

data = R.Data(ROOT)
titled = [r for r in data.rows if r["printed_name"]]
alone = [r for r in titled if len(data.titled[r["code"]]) == 1]
check("a code titled at one college only gets no vote from other colleges or its district: its own heading is out",
      alone and all("other_colleges" not in R.sources(data, r["slug"], r["code"])
                    and "district" not in R.sources(data, r["slug"], r["code"]) for r in alone[:200]))
src = open(os.path.join(ROOT, "kb", "_build_local_subject_recommendations.py"), encoding="utf-8").read()
check("the subject map is never opened", "subject_discipline_map" not in src)
check("Sam's 30 decisions are read for the score only", src.count("DECISIONS") == 2)

doc = R.build(ROOT)
table = doc["measured_on_titled_codes"]
for s, conds in table.items():
    for c, m in conds.items():
        want = "High" if m["share"] >= 0.9 else ("Medium" if m["share"] >= 0.6 else "Low")
        if m["asked"] < 20:
            want = "Low"
        if s == "program_titles" and want == "High":
            want = "Medium"
        check("%s, %s: %d of %d right reads %s" % (s, c, m["right"], m["asked"], want), m["level"] == want)
check("program titles never read High", all(m["level"] != "High" for m in table.get("program_titles", {}).values()))

hold = {(r["slug"], r["code"]) for r in data.rows if r["title_state"] == "noncredit_hold"}
recs = {(c["slug"], r["code"]): r for c in doc["colleges"] for r in c["rows"]}
check("a row on the noncredit hold takes no recommendation", hold and not (hold & set(recs)))
check("a titled row is never given a title", all("title" not in recs[(r["slug"], r["code"])]
                                                   for r in titled if (r["slug"], r["code"]) in recs))
check("a row that already holds a common code is never given one",
      all("common" not in recs[(r["slug"], r["code"])] for r in data.rows
          if r["common"] and (r["slug"], r["code"]) in recs))
differs = [r["title"] for r in recs.values() if r.get("title", {}).get("also")]
check("where sources differ the row reads Low and shows the other title", all(t["level"] == "Low" for t in differs))
s30 = doc["common_code"]["sams_30"]
check("Sam's 30 are all accounted for: agree, diverge or no recommendation",
      s30["agree"] + s30["diverge"] + len(s30["no_recommendation"]) == s30["decisions"] == 30)
check("every divergence names Sam's code beside the recommended one", all(d["sam"] != d["recommended"] for d in s30["divergences"]))
check("two builds write the same bytes", R.dump(doc) == R.dump(R.build(ROOT)))
path = os.path.join(ROOT, R.OUT)
check("the committed file is the one the daily build would write",
      os.path.exists(path) and open(path, encoding="utf-8").read() == R.dump(doc))
T = doc["totals"]
check("the totals add up", T["no_title"] == sum(T.get(k, 0) for k in ("title_high", "title_medium", "title_low", "title_none")))

print("%d/%d checks passed" % (sum(results), len(results)))
sys.exit(0 if all(results) else 1)
