#!/usr/bin/env python3
"""Guards for kb/_mid_outcomes_compare.py, the MID re-clustering Step 1 comparison (#2962, S642).

The standing rules it must hold on a small fixture, each a way the comparison could go wrong quietly:
  1. A same-college suite whose courses teach different things splits (AGAB M1002's shape, Sam 2026-11-11).
  2. Identical outcomes at two colleges confirm.
  3. A member with no text is never the reason for a split (Sam, 2026-11-09: a missing SLO never counts against a
     course); it joins no group.
  4. A TOP difference alone never splits (CLAUDE.md Rule 7: TOP is a last-in-line corroborator).
  5. A units difference never splits (Sam, 2026-09-27).
  6. Outcomes alone never make a split above limited (Sam, 2026-11-09: an SLO never overrides on its own).
  7. Two levels of one sequence are never proposed as a merge.
  8. The levels are Sam's three match levels (Sheet 181, 2026-11-11).

Run from repo root: python3 tests/mid_outcomes_compare_test.py
"""
import importlib.util
import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("mid_outcomes_compare", os.path.join(REPO, "kb", "_mid_outcomes_compare.py"))
moc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(moc)

results = []


def check(name, cond):
    results.append((name, bool(cond)))


A, B, C = "Fixture College A", "Fixture College B", "Fixture College C"

INTRO = ["Explain the mission of the agricultural ambassador program and the duties of an ambassador officer.",
         "Plan a schedule of ambassador meetings, officer elections and campus service hours for the semester."]
PR = ["Write press releases and social media posts announcing agricultural events to newspapers and radio stations.",
      "Produce a newsletter with photographs, interviews and feature stories about livestock judging teams."]
RECRUIT = ["Conduct campus tours for prospective high school students and their parents visiting the farm laboratory.",
           "Deliver a recruitment presentation at a high school career fair describing transfer pathways and majors."]
CELL = ["Describe cell membrane transport, mitochondria respiration and photosynthesis chloroplast reactions in eukaryotes.",
        "Interpret Mendelian genetics crosses, meiosis chromosome segregation and DNA replication enzymes."]
GENE = ["Interpret Mendelian genetics crosses, pedigree charts and Punnett squares for dominant recessive alleles.",
        "Model meiosis chromosome segregation, crossing over and nondisjunction in gamete formation."]
MOLE = ["Diagram DNA replication forks, helicase, polymerase and ligase enzymes on leading and lagging strands.",
        "Compare transcription promoters, messenger RNA splicing and ribosome translation of codons into proteins."]
ORGN = ["Locate organelles with a compound microscope: nucleus, ribosomes, golgi apparatus, lysosomes and vacuoles.",
        "Stain prepared slides of onion epidermis and cheek epithelium cells and measure cell diameter in micrometers."]
SEQ = ["Classify kingdoms of life, protists, fungi, plants and animals by phylogenetic trees and cladograms.",
       "Dissect a frog and a fetal pig to trace digestive, circulatory and respiratory organ systems."]
ECON = ["Calculate gross domestic product, inflation indexes and unemployment rates from national income accounts.",
        "Explain monetary policy, federal reserve interest rates and fiscal deficits in aggregate demand models."]

D_INTRO = ("An orientation to the ambassador program: officer duties, meeting procedures, campus service hours, "
           "dress code, the ambassador handbook and the program's history at the college farm.")
D_PR = ("Public relations writing for agriculture: press releases, newsletters, photography, radio interviews, social "
        "media calendars and feature stories about the livestock and crops teams.")
D_RECRUIT = ("Student recruitment: campus tours, high school visits, career fair booths, transfer pathway talks and "
             "follow-up letters to prospective students and their parents.")
D_CELL = ("Cellular biology for majors: membranes, organelles, respiration, photosynthesis, genetics, meiosis, DNA "
          "replication and laboratory microscopy with prepared slides and experiments.")


def row(college, code, title, lines, url):
    return {"college": college, "course_code": code, "course_title": title, "kind": "slo", "outcomes": lines,
            "source_url": url}


def mem(college, code, title, units=3, top="0101.00", desc=""):
    return {"college": college, "code": code, "title": title, "units": units, "top": top, "desc": desc}


ROWS = [
    row(A, "AG 31A", "Ambassadors - Introduction", INTRO, "u1"),
    row(A, "AG 31B", "Ambassadors - Public Relations", PR, "u2"),
    row(A, "AG 31C", "Ambassadors - Recruitment", RECRUIT, "u3"),
    row(A, "BIO 1", "General Biology", CELL, "u4"),
    row(B, "BIOL 101", "General Biology", CELL, "u5"),
    row(A, "BIO 2", "Cell Biology", GENE, "u6"),
    row(B, "BIOL 102", "Cell Biology", GENE, "u7"),
    row(A, "BIO 3", "Molecular Biology", MOLE, "u8"),
    row(B, "BIOL 103", "Molecular Biology", MOLE, "u9"),
    row(A, "BIO 4", "Biology of Cells", ORGN, "u10"),
    row(B, "BIOL 104", "Biology of Cells", ORGN, "u11"),
    row(A, "ECO 1", "Principles of Biology", ECON, "u12"),
    row(B, "BIOL 105", "Principles of Biology", SEQ[:1] + ORGN[:1], "u13"),
    row(A, "BIO 10", "Biology I", SEQ, "u14"),
    row(B, "BIOL 11", "Biology II", SEQ, "u15"),
]

MEMBERS = {
    "AGAB M9001": [mem(A, "AG 31A", "Ambassadors - Introduction", desc=D_INTRO),
                   mem(A, "AG 31B", "Ambassadors - Public Relations", desc=D_PR),
                   mem(A, "AG 31C", "Ambassadors - Recruitment", desc=D_RECRUIT)],
    "BIOL M9002": [mem(A, "BIO 1", "General Biology", desc=D_CELL), mem(B, "BIOL 101", "General Biology", desc=D_CELL)],
    # The third member prints nothing and names something else: it must not be split out.
    "BIOL M9003": [mem(A, "BIO 2", "Cell Biology", desc=D_CELL), mem(B, "BIOL 102", "Cell Biology", desc=D_CELL),
                   mem(C, "ZOO 9", "Marine Mammal Field Studies", desc=D_PR)],
    # Different TOP codes, same outcomes.
    "BIOL M9004": [mem(A, "BIO 3", "Molecular Biology", top="0401.00", desc=D_CELL),
                   mem(B, "BIOL 103", "Molecular Biology", top="1201.00", desc=D_CELL)],
    # Units 1 and 5, same outcomes.
    "BIOL M9005": [mem(A, "BIO 4", "Biology of Cells", units=1, desc=D_CELL),
                   mem(B, "BIOL 104", "Biology of Cells", units=5, desc=D_CELL)],
    # Same title and description at two colleges, different outcomes: outcomes alone disagree.
    "BIOL M9006": [mem(A, "ECO 1", "Principles of Biology", desc=D_CELL),
                   mem(B, "BIOL 105", "Principles of Biology", desc=D_CELL)],
    # Two levels of one sequence in two M-IDs, same outcomes: never a merge.
    "BIOL M9007": [mem(A, "BIO 10", "Biology I", desc=D_CELL)],
    "BIOL M9008": [mem(B, "BIOL 11", "Biology II", desc=D_CELL)],
}

state = moc.run(ROWS, MEMBERS, {}, {}, "fixture", "2026-11-12")
R = state["results"]

# 1. The suite splits, strongly: the college files three codes, and descriptions and titles agree they differ.
s = R["AGAB M9001"]
check("1 a same-college suite with distinct outcomes splits", s["cls"] == "Split")
check("1 into three groups, one per course", len(s.get("groups") or []) == 3)
check("1 at strong (same college, descriptions and titles disagree too)", s["level"] == "strong")
check("1 each group proposes its course's own title",
      sorted(g["title"] for g in s["groups"]) == ["Ambassadors - Introduction", "Ambassadors - Public Relations",
                                                   "Ambassadors - Recruitment"])

# 2. Identical outcomes at two colleges confirm.
c = R["BIOL M9002"]
check("2 identical outcomes across colleges confirm", c["cls"] == "Confirmed")
check("2 at strong", c["level"] == "strong")

# 3. A member with no text is never the reason for a split.
n = R["BIOL M9003"]
check("3 a member with no text does not split the M-ID", n["cls"] == "Confirmed")
check("3 it is counted as having no text", n["members"] == 3 and n["with_text"] == 2)
check("3 it joins no group", "groups" not in n)
thin = moc.compare_mid("X M1", [mem(A, "BIO 2", "Cell Biology", desc=D_CELL), mem(C, "ZOO 9", "Marine Mammals")],
                       state["courses"], state["out_space"], state["desc_space"])
check("3 one member with text and one without is Not enough text", thin["cls"] == "Not enough text")

# 4. A TOP difference alone never splits.
t = R["BIOL M9004"]
check("4 different TOP codes, same outcomes: confirmed", t["cls"] == "Confirmed")
check("4 both TOP codes are shown", t["tops"] == ["0401.00", "1201.00"])

# 5. A units difference never splits.
u = R["BIOL M9005"]
check("5 units 1 and 5, same outcomes: confirmed", u["cls"] == "Confirmed")
check("5 the unit range is shown", u["units"] == [1.0, 5.0])

# 6. Outcomes alone never split above limited.
o = R["BIOL M9006"]
check("6 outcomes disagree with the same title and description", o["cls"] == "Split")
check("6 so the split is limited, a flag for a person", o["level"] == "limited")

# 7. Two levels of one sequence are never a merge.
check("7 Biology I and Biology II are not a merge candidate",
      ("BIOL M9007", "BIOL M9008") not in state["merges"])
check("7 the level reader sees I and II", moc.levels_differ("Biology I", "Biology II")
      and not moc.levels_differ("General Biology", "General Biology Honors"))

# 8. Sam's three levels, and every result uses one of them or none.
check("8 the levels are strong, partial and limited", moc.LEVELS == ("strong", "partial", "limited"))
check("8 every result's level is one of them", all(r["level"] in moc.LEVELS + (None,) for r in R.values()))

# The stored M-ID resolves through the alias chain module (imported, never copied).
check("the named M-ID resolves through kb/alias_chain.py", state["named"].get("AGAB M1002") == "AGAB M1002")
check("the script declares no alias chain of its own",
      "ALIAS_MAPS = [" not in open(os.path.join(REPO, "kb", "_mid_outcomes_compare.py")).read())

failed = [name for name, ok in results if not ok]
for name, ok in results:
    print(("PASS " if ok else "FAIL ") + name)
print("%d/%d checks passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
