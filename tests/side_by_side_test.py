#!/usr/bin/env python3
"""Guards for kb/_build_side_by_side.py (S678, COBIx's item 7 on #3464): the files behind the read-only Side by side
views in the Courses List and the Exhibits tab.

What this pins, against the committed files (the fixture cards are COBIx's case_studies.md on #3464):
  1. NRSR M1137 (held by a false title alarm): three college courses, all Active, TOP 1230.10 Registered Nursing, our
     TOP table and subject map both Nursing, and its own subject, its colleges' subjects and their TOP codes agree.
     The scorer and the List hold the same three, so the card carries no disagreement.
  2. AGAB M1002 (no college courses in the memberships file): the scorer reads 0 while the List shows 3; the three are
     Active, TOP 0112.00 is in neither of our tables, AGAB is not in the subject map, and every signal is missing.
  3. AUTO M9003 (nothing to read): its control number has no row in the program course file and no own description,
     and our tables agree on Automotive Technology.
  4. Exhibits: a Review card's exhibit says its official certification name is not on file and names the course the
     Review builder set aside; a CPL type falls back to the exhibit id's path only when MAP's type is not on record.
  5. The builder is read-only and independent of the scorer: it imports no kb/_ccr_confidence_score.py, writes only
     its two outputs, and the committed outputs are what it builds today (--check).

Run from repo root: python3 tests/side_by_side_test.py
"""
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


def load(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return json.load(f)


src = open(os.path.join(ROOT, "kb/_build_side_by_side.py"), encoding="utf-8").read()
C = load("kb/side_by_side.json")
E = load("kb/exhibit_side_by_side.json")
status = {cn: st for st, cns in C["status"].items() for cn in cns}
LIST = {
    "NRSR M1137": ["CCC000502913", "CCC000642246", "CCC000593129"],
    "AGAB M1002": ["CCC000553356", "CCC000553354", "CCC000553355"],
    "AUTO M9003": ["CCC000421219"],
}

# 1. NRSR M1137
n = C["cards"].get("NRSR M1137") or {}
check("1 NRSR M1137 is a card the scorer reads, guess Nursing", n.get("g") == "Nursing", n)
check("1 its three signals agree", n.get("r") == ["agrees", "agrees", "agrees"], n.get("r"))
check("1 the scorer and the List hold the same courses (no disagreement)", "s" not in n, n.get("s"))
check("1 each college course is Active", all(status.get(cn) == "Active" for cn in LIST["NRSR M1137"]))
check("1 TOP 1230.10 is Registered Nursing, and our TOP table says Nursing", C["tops"].get("1230.10") == ["Registered Nursing", "Nursing"], C["tops"].get("1230.10"))
check("1 the subject map gives NURS Nursing", C["subjects"].get("NURS") == "Nursing")
check("1 its own description, first 200 characters", (n.get("d") or "").startswith("Focuses on the care of adult clients") and len(n["d"]) <= 201)

# 2. AGAB M1002
a = C["cards"].get("AGAB M1002") or {}
check("2 AGAB M1002: the scorer reads 0 college courses", a.get("s") == [], a)
check("2 its three are Active", all(status.get(cn) == "Active" for cn in LIST["AGAB M1002"]))
check("2 TOP 0112.00 is in neither table", C["tops"].get("0112.00") == ["Agriculture Business, Sales, and Service", None], C["tops"].get("0112.00"))
check("2 AGAB is not in the subject map", "AGAB" not in C["subjects"])
check("2 its own subject unmapped, the other signals missing", a.get("r") == ["unmapped", "missing", "missing"], a.get("r"))
check("2 no own description", "d" not in a)

# 3. AUTO M9003
u = C["cards"].get("AUTO M9003") or {}
check("3 AUTO M9003: no row in the program course file", "CCC000421219" not in status)
check("3 our tables agree on Automotive Technology", u.get("g") == "Automotive Technology" and u.get("r") == ["agrees", "agrees", "agrees"], u)
check("3 no own description", "d" not in u)
check("3 TOP 0948.00 reads Automotive Technology in our TOP table", (C["tops"].get("0948.00") or [None, None])[1] == "Automotive Technology")

# The disagreement counts the report names.
k = C["counts"]
check("the counts add up: seedless = merged away + not openable + openable",
      k["seedless"] == k["merged_away"] + k["not_openable"] + k["openable"], k)
check("every card that reads none is among those that differ", k["scorer_reads_none"] <= k["scorer_and_list_differ"], k)

# 4. Exhibits
x = E["exhibits"].get("MAPICA-AATA-1-001") or {}
check("4 the Review card's exhibit: no official certification name on file", x.get("n") == 1 and x.get("k") == "cert-based", x)
check("4 it names the course the Review builder set aside",
      x.get("a") == "Foothill College AATA 103A (Ultrasonic Testing Level One) was set aside: this exhibit is an industry "
                    "certification, not credit by exam.", x.get("a"))
check("4 the type comes from MAP's record when MAP has one",
      all(r.get("ts") == "map" for r in E["exhibits"].values() if r.get("t") in ("Credit By Exam", "Industry Certification")
          and r.get("ts") != "id") and E["counts"]["type_from_map"] > 0)
check("4 and from the exhibit id otherwise", (E["exhibits"].get("MAPCXS-B0BL-1-001") or {}).get("ts") == "id")
check("4 the local title is carried as the college entered it",
      (E["exhibits"].get("MAPCXS-B0BL-1-001") or {}).get("l") == "BUS 018: Business Law")

# 5. Read-only and independent
check("5 the builder never imports the scorer",
      not re.search(r"^\s*(import|from)\s+\S*(_ccr_confidence_score|discipline_confidence|_ccr_desc_signal)", src, re.M))
check("5 it writes only its two outputs", set(re.findall(r'OUT_[A-Z]+ = "([^"]+)"', src)) == {"kb/side_by_side.json", "kb/exhibit_side_by_side.json"}
      and src.count('open(path(rel), "w"') == 1)
check("5 it sends nothing over the network", not re.search(r"urllib|requests|http\.client|supabase", src.split('"""', 2)[2], re.I))
p = subprocess.run([sys.executable, "kb/_build_side_by_side.py", "--check"], cwd=ROOT, capture_output=True, text=True)
check("5 the committed files are what the builder builds today", p.returncode == 0, p.stderr.strip())
# A credential rename rewrites coci_articulations.json's canonical titles, which the rows read: the 2026-11-18 apply left
# kb/exhibit_side_by_side.json stale until S679 rebuilt it. The rename workflow rebuilds and commits both outputs.
rw = open(os.path.join(ROOT, ".github", "workflows", "cred-rename-apply.yml"), encoding="utf-8").read()
rb = rw[rw.index("name: Rebuild the files derived from the credential keys"):]
rb = rb[:rb.index("- name:", 10)]
rc = rw[rw.index("name: Commit + push"):]
rc = rc[:rc.index("git diff --cached")]
check("5 the rename workflow rebuilds the side by side with the files derived from the credential keys, and commits it",
      "python3 kb/_build_side_by_side.py" in rb and "kb/side_by_side.json" in rc and "kb/exhibit_side_by_side.json" in rc)

fails = [r for r in results if not r[1]]
for name, ok, why in results:
    print(("PASS " if ok else "FAIL ") + name + ("" if ok or why == "" else "\n     " + str(why)[:300]))
print("\n%d/%d passed" % (len(results) - len(fails), len(results)))
sys.exit(1 if fails else 0)
