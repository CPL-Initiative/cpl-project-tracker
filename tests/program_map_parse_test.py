#!/usr/bin/env python3
"""Guard for kb/_program_map_parse.py: a college's own program map, read into terms.

The two sources are the text college page read run 37372136739 printed for
Irvine Valley's All Program Maps page and Santa Monica's Barbering pathway
(S336). A parser change that moves a course out of its term, loses a choice, or
lets a map name a course off the program's list fails here, and the committed
sequence records must equal a fresh build.

Run from repo root: python3 tests/program_map_parse_test.py
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_map_parse as M  # noqa: E402

results = []


def check(name, ok, why=""):
    results.append((name, bool(ok), why))


SRC = os.path.join(M.SEQ_DIR, "sources")
ivc = json.load(open(os.path.join(SRC, "ivc_all_program_maps_p1.json"), encoding="utf-8"))
smc = json.load(open(os.path.join(SRC, "smc_program_219.json"), encoding="utf-8"))

# ── 1. a cell's course codes ─────────────────────────────────────────────────
check("a list of alternatives carries each code, and drops the old number in parentheses",
      M.codes_in("STAT C1000 (MATH 10), ECON 10, MGT 10, or MATH 111")
      == ["STAT C1000", "ECON 10", "MGT 10", "MATH 111"])
check("a bare number takes the subject before it",
      M.codes_in("PHIL 1, 2, 5, 10, or 11") == ["PHIL 1", "PHIL 2", "PHIL 5", "PHIL 10", "PHIL 11"])
check("letter suffixes survive in a run of alternatives",
      M.codes_in("TA 15A, 16A, 17A, 18A or 19A") == ["TA 15A", "TA 16A", "TA 17A", "TA 18A", "TA 19A"])
check("a GE slot names no course", M.codes_in("Natural Sciences") == [])
closed = M.closed_index([{"code": "MATH 3A", "title": "Analytic Geometry and Calculus I"}])
check("a footnote glued to a course number resolves to the listed course",
      M.resolve("MATH 3A1", closed) == "MATH 3A")
check("a code off the list keeps its printed form", M.resolve("ECON 10", closed) == "ECON 10")

# ── 2. Irvine Valley: every map on one page ──────────────────────────────────
maps = M.ivc_maps(ivc["text"])
check("page 1 of All Program Maps holds at least 25 maps", len(maps) >= 25, "%d maps" % len(maps))
check("the Art A.A. and an Accounting certificate are among them",
      "Art, AA" in maps and "Accounting, COA" in maps)
art = M.parse_ivc("Art, AA", maps["Art, AA"], ivc["closed_lists"]["10265"])
labels = [t["label"] for t in art["terms"]]
check("the Art A.A. map has four semesters", labels == ["Semester 1", "Semester 2", "Semester 3", "Semester 4"], labels)
sem3 = [c for i in art["terms"][2]["items"] for c in i["codes"]]
check("ART 85 Life Drawing I sits in Semester 3 (165 students hold its CPL at the college)", "ART 85" in sem3, sem3)
kinds = [i["kind"] for t in art["terms"] for i in t["items"]]
check("the map leaves four Art major slots to the catalog's lists", kinds.count("list") == 4, kinds)
check("the GE slots read as GE, never as courses", kinds.count("ge") == 9, kinds)
check("the map's printed pattern is kept", art["pattern"].startswith("AA-GE · 2 Years Full-Time"), art["pattern"])
cov = M.coverage(art, ivc["closed_lists"]["10265"])
check("the Art map names the five core courses and nothing off the list",
      cov["named"] == ["ART 40", "ART 80", "ART 41", "ART 50", "ART 85"] and not cov["off_list"], cov)
check("a map with list slots is accepted on its named core", M.accepts(art, cov))
acct = M.parse_ivc("Accounting, AS", maps["Accounting, AS"], [])
first = acct["terms"][0]["items"]
check("an alternatives row reads as one choice", first[1]["kind"] == "choice" and len(first[1]["codes"]) == 4,
      first[1])

# ── 3. Santa Monica: one page per program ────────────────────────────────────
barb = M.parse_smc(smc["text"], smc["closed_lists"]["43767"])
check("the Barbering pathway has six terms, eight-week halves kept apart",
      [t["label"] for t in barb["terms"]] == ["Semester 1 (First 8 weeks)", "Semester 1 (Second 8 weeks)",
                                              "Semester 2 (First 8 weeks)", "Semester 2 (Second 8 weeks)",
                                              "Semester 3", "Semester 4"])
check("each term keeps its printed units", [t["units"] for t in barb["terms"]] == ["9", "6", "9", "6-9", "15", "15"])
salon = [i for i in barb["terms"][3]["items"] if i["text"].startswith("Salon Experience")]
check("the open Salon Experience slot resolves by title to COSM 95A-95D",
      salon and salon[0]["kind"] == "choice" and salon[0]["codes"] == ["COSM 95A", "COSM 95B", "COSM 95C", "COSM 95D"],
      salon)
eng = [i for i in barb["terms"][2]["items"] if i["codes"] == ["ENGL C1000"]]
check("a code and title split across lines still read as one course", len(eng) == 1)
cov = M.coverage(barb, smc["closed_lists"]["43767"])
check("the Barbering map names 24 of the 25 listed courses; COSM 49R is the one it leaves out",
      len(cov["named"]) == 24 and cov["not_on_map"] == ["COSM 49R"], cov["not_on_map"])
check("COUNS 20 and ENGL C1000 are another subject's courses, never an off-list COSM course", not cov["off_list"])

# ── 4. acceptance fails where it should ──────────────────────────────────────
bad = {"terms": [{"label": "Semester 1", "items": [{"kind": "course", "codes": ["COSM 99"]}]},
                 {"label": "Semester 2", "items": []}]}
bad_cov = M.coverage(bad, smc["closed_lists"]["43767"])
check("a map naming a COSM course the program does not list is refused",
      bad_cov["off_list"] == ["COSM 99"] and not M.accepts(bad, bad_cov))
one = {"terms": [{"label": "Semester 1", "items": []}]}
check("a single term is not a sequence", not M.accepts(one, M.coverage(one, [])))

# ── 5. the committed records are a fresh build ───────────────────────────────
for rec in M.build(write=False):
    slug = [p["slug"] for p in M.PROGRAMS if p["control_number"] == rec["control_number"]][0]
    on_disk = json.load(open(os.path.join(M.SEQ_DIR, slug + ".json"), encoding="utf-8"))
    check("%s on disk equals a fresh build (python3 kb/_program_map_parse.py)" % slug, on_disk == rec)

passed = 0
for name, ok, why in results:
    print(f"{'  ok' if ok else 'FAIL'}  {name}" + ("" if ok else f"  — {why}"))
    passed += ok
print(f"\n{passed}/{len(results)} checks passed")
sys.exit(0 if passed == len(results) else 1)
