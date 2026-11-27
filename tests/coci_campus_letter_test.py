#!/usr/bin/env python3
"""The letters COCI glued onto Cerro Coso's, Porterville's and Chabot's subject codes (S744, S745; kb/coci_campus_letter.py).

WHAT THIS GUARDS (each a way the fold would hurt):
  (1) a real subject that ends in the letter is never folded (Cerro Coso's EMTC PSYC MUSC, Porterville's HOSP), and no
      other college is touched;
  (2) a glued code folds to its base with the letter on the number, and a number that carries the letter keeps one;
  (3) the committed coci_lookup_data.js holds no glued code at either college, and every row the fold dropped was the
      lettered twin of the same control number (no course lost);
  (4) a person's save on a glued code (Sam's ADMJC title, 2026-11-26) carries to the folded code, and a save made on
      the folded code itself wins over a carried one;
  (5) Chabot (S745): a glued code folds its letters onto the number (PEACLSF 2 -> PEAC LSF2), a code listed both ways
      (ATHLBB 13 beside ATHL BB13) lands on its twin and both control numbers stay, PHEACJUD and the retired MICR PHSI
      PHEA stay, the lists never cross colleges, and a save on PEACBTC carries to PEAC.

Run from repo root: python3 tests/coci_campus_letter_test.py
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import coci_campus_letter as ccl  # noqa: E402
import subject_decisions as sd  # noqa: E402

CC, PC, CH = "Cerro Coso Community College", "Porterville College", "Chabot College"
fails = []


def check(cond, msg):
    if not cond:
        fails.append(msg)


# (1) real codes and other colleges stay
for code in ("EMTC", "PSYC", "MUSC", "EDUC", "PHSC", "SOSC", "PTEC", "FRCC", "ICC"):
    check(ccl.fold(CC, code, "C101") == (code, "C101"), "Cerro Coso %s must not fold" % code)
check(ccl.fold(PC, "HOSP", "P101") == ("HOSP", "P101"), "Porterville HOSP must not fold")
check(ccl.fold("Bakersfield College", "PHEDC", "103") == ("PHEDC", "103"), "another college must not fold")
check(ccl.fold(PC, "PHEDC", "103") == ("PHEDC", "103"), "Cerro Coso's list must not apply at Porterville")

# (2) glued codes fold
check(ccl.fold(CC, "PHEDC", "103") == ("PHED", "C103"), "PHEDC 103 -> PHED C103")
check(ccl.fold(CC, "EMTCC", "070") == ("EMTC", "C070"), "EMTCC 070 -> EMTC C070")
check(ccl.fold(CC, "HCRSC", "C134") == ("HCRS", "C134"), "a lettered number keeps one letter")
check(ccl.fold(PC, "BIOLP", "118") == ("BIOL", "P118"), "BIOLP 118 -> BIOL P118")
check(ccl.base_code("cerro_coso_community", "ADMJC") == "ADMJ", "slug base code")
check(ccl.base_code("cerritos", "ADMJC") == "ADMJC", "slug base code elsewhere")

# (3) the committed lookup
s = open(os.path.join(ROOT, "coci_lookup_data.js"), encoding="utf-8").read()
d = json.loads(s[s.index("=") + 1:].rstrip().rstrip(";"))
cols = d["colleges"]
by = {}
for r in d["rows"]:
    name = cols[r[0]]
    if name in ccl.GLUED:
        check(r[2].upper() not in ccl.GLUED[name], "glued code left in the lookup: %s %s %s" % (name, r[2], r[3]))
        by.setdefault(name, set()).add(r[1])
check(len(by) == 3, "all three colleges present in the lookup")
check(len(by.get(CC, ())) > 500, "Cerro Coso keeps its courses")

# (4) a save on a glued code carries; a direct save wins
doc = {"decisions": [
    {"key": "SUBJ:cerro_coso_community|ADMJC|credit", "local_title": "Administration of Justice", "who": "a reviewer"},
    {"key": "SUBJ:cerro_coso_community|PHEDC|credit", "local_title": "Physical Education (glued)", "who": "a"},
    {"key": "SUBJ:cerro_coso_community|PHED|credit", "local_title": "Kinesiology", "who": "a"},
]}
dec = sd.Decisions(doc, None)
a = dec.for_row("cerro_coso_community", "ADMJ", "credit")
check(a and a["local_title"] == "Administration of Justice" and a.get("carried_from") == "ADMJC",
      "Sam's ADMJC save carries to ADMJ")
p = dec.for_row("cerro_coso_community", "PHED", "credit")
check(p and p["local_title"] == "Kinesiology", "a save on the folded code itself wins over a carried one")
check(not dec.refused, "no save is refused: %s" % dec.refused)
crs = sd.Decisions({"courses": [{"key": "CRS:cerro_coso_community|PHEDC|103", "common_code": "KIN"}]}, None)
check(("cerro_coso_community", "PHED", "C103") in crs.course or crs.refused, "a course move on a glued code folds")

# (5) Chabot: explicit glued codes, the letters lead the number
check(ccl.fold(CH, "PEACLSF", "2") == ("PEAC", "LSF2"), "PEACLSF 2 -> PEAC LSF2")
check(ccl.fold(CH, "ATHLBB", "13") == ("ATHL", "BB13"), "ATHLBB 13 -> ATHL BB13 (its twin)")
check(ccl.fold(CH, "HEAGBY", "50") == ("HEAG", "BY50"), "HEAGBY 50 -> HEAG BY50")
check(ccl.fold(CH, "DANCJD", "4") == ("DANC", "JD4"), "DANCJD 4 -> DANC JD4")
for code in ("PHEACJUD", "MICR", "PHSI", "PHEA", "PEAC", "ATHL", "PEACX"):
    check(ccl.fold(CH, code, "1") == (code, "1"), "Chabot %s must not fold" % code)
check(ccl.fold(CC, "PEACLSF", "2") == ("PEACLSF", "2"), "Chabot's list must not apply at Cerro Coso")
check(ccl.fold(CH, "PHEDC", "103") == ("PHEDC", "103"), "Cerro Coso's list must not apply at Chabot")
check(ccl.base_code("chabot", "PEACLSF") == "PEAC" and ccl.base_code("chabot", "PHEACJUD") == "PHEACJUD",
      "Chabot base code")
ch = [r for r in d["rows"] if cols[r[0]] == CH]
bb = [r for r in ch if r[2] == "ATHL" and r[3] == "BB13"]
check(len(bb) == 2 and len({r[1] for r in bb}) == 2,
      "ATHL BB13 is listed under two control numbers, and both stay (one row per control number)")
check(any(r[2] == "PEAC" and r[3] == "LSF2" for r in ch) and not any(r[2] == "PEACLSF" for r in ch),
      "PEAC LSF2 in the lookup, no PEACLSF left")
check(sum(1 for r in ch if r[2] == "PHEACJUD") == 1, "PHEACJUD stays as COCI writes it")
dch = sd.Decisions({"decisions": [{"key": "SUBJ:chabot|PEACBTC|credit", "local_title": "Physical Education Activity",
                                   "who": "a reviewer"}]}, None)
b = dch.for_row("chabot", "PEAC", "credit")
check(b and b.get("carried_from") == "PEACBTC", "the PEACBTC save carries to PEAC")

if fails:
    print("FAIL\n  " + "\n  ".join(fails))
    sys.exit(1)
print("ok: campus letter fold (%d Cerro Coso, %d Porterville, %d Chabot control numbers)"
      % (len(by[CC]), len(by[PC]), len(by[CH])))
