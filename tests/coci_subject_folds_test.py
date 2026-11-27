#!/usr/bin/env python3
"""Explicit subject-parse folds (COBIx, 2026-11-27, kb/coci_subject_folds.py).

WHAT THIS GUARDS (each a way the fold would hurt):
  (1) only the listed codes fold, and only at their college; a prefix rule is not used, so Hancock AGRIB is AGBUS
      (not AG), PHYSE is PE (not PHYS), and Victor Valley's PHYSIO is left as Physiology;
  (2) Chabot course letters prepend to the number (PEACLSF 2 -> PEAC LSF2), including Sam's four PEAC* saves and
      PEACBTC, and the garbled PHEACJUD maps to PEAC JUD, not a prefix of the fake string;
  (3) bad splits and Hancock title remaps land on their second-reader targets; a Hancock title that does not parse
      keeps the original number under the target subject;
  (4) placeholders are not folded; ICC, slash pairs, ESLNC, MATNC, and the sure-under-80 Hancock review codes are
      not folded;
  (5) once the lookup is rebuilt, the committed coci_lookup_data.js holds none of the listed fake subjects, and
      Cypress C remains (it is marked not_a_subject, not dropped);
  (6) a person's save on a glued or split code carries to the folded code.

Run from repo root: python3 tests/coci_subject_folds_test.py
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import coci_subject_folds as csf  # noqa: E402
import coci_campus_letter as ccl  # noqa: E402
import subject_decisions as sd  # noqa: E402

fails = []


def check(cond, msg):
    if not cond:
        fails.append(msg)


def compact(s):
    return "".join(c for c in (s or "").upper() if c.isalnum())


CH = "Chabot College"
AH = "Allan Hancock College"
GL = "Glendale Community College"
VVC = "Victor Valley College"

# (1) other colleges and unlisted codes stay
check(csf.fold(CH, "PEAC", "LSF1") == ("PEAC", "LSF1"), "a real Chabot PEAC row must not fold")
check(csf.fold("Las Positas College", "PEACLSF", "2") == ("PEACLSF", "2"), "another college must not fold Chabot's list")
check(csf.fold(AH, "BIOL", "145") == ("BIOL", "145"), "a real Hancock BIOL row must not fold")
check(csf.fold(AH, "AGRIB", "1", "AGBUS 101") == ("AGBUS", "101"), "AGRIB must go to AGBUS")
check(csf.fold(AH, "AGRIB", "1")[0] != "AG", "AGRIB must not fold to AG")
check(csf.fold(VVC, "PHYSIO", "1") == ("PHYSIO", "1"), "Victor Valley PHYSIO must not fold into PHYS")

# (2) Chabot course letters
check(csf.fold(CH, "PEACLSF", "2") == ("PEAC", "LSF2"), "PEACLSF 2 -> PEAC LSF2")
check(csf.fold(CH, "PEACPLF", "1") == ("PEAC", "PLF1"), "PEACPLF")
check(csf.fold(CH, "PEACSBB", "1") == ("PEAC", "SBB1"), "PEACSBB")
check(csf.fold(CH, "PEACSBM", "1") == ("PEAC", "SBM1"), "PEACSBM")
check(csf.fold(CH, "PEACBTC", "1") == ("PEAC", "BTC1"), "PEACBTC")
check(csf.fold(CH, "ATHLBB", "13") == ("ATHL", "BB13"), "ATHLBB 13 -> ATHL BB13")
check(csf.fold(CH, "ATHLBB", "BB13") == ("ATHL", "BB13"), "a lettered number keeps one letter")
check(csf.fold(CH, "PHEACJUD", "1") == ("PEAC", "JUD1"), "PHEACJUD is PEAC JUD, not a prefix of PHEACJUD")
check(csf.fold(CH, "DANCJD", "1") == ("DANC", "JD1"), "DANCJD")
check(csf.base_code("chabot", "PEACLSF") == "PEAC", "slug base code")
check(csf.base_code("las_positas", "PEACLSF") == "PEACLSF", "slug base code elsewhere")

# (3) bad splits and Hancock
check(csf.fold(GL, "AD", "ST113") == ("AD ST", "113"), "AD ST113 -> AD ST 113")
check(csf.fold("Moorpark College", "CNSEM", "52") == ("CNSE", "M52"), "CNSEM 52 -> CNSE M52")
check(csf.fold("Feather River College", "ENGL005", "NA") == ("ENGL", "005"), "ENGL005 NA -> ENGL 005")
check(csf.fold("College of the Desert", "CIS 023D", "AWS SysOps Admi") == ("CIS", "023D"), "CIS 023D junk number")
check(csf.fold("Los Angeles Southwest College", "Q", "CNTRL010") == ("Q CNTRL", "010"), "Q CNTRL010")
check(csf.fold("Los Angeles Trade Technical College", "OFF", "MCH002") == ("OFF MCH", "002"), "OFF MCH002")
check(csf.fold(AH, "BIOLO", "1762G", "BIOL 145") == ("BIOL", "145"), "Hancock title parse")
check(csf.fold(AH, "PHYSE", "1", "PE 100") == ("PE", "100"), "PHYSE is PE, not PHYS")
check(csf.fold(AH, "PHYSS", "1", "PHYS 161") == ("PHYS", "161"), "PHYSS is PHYS")
check(csf.fold(AH, "HEALE", "1", "H ED 100") == ("H ED", "100"), "HEALE is H ED, not HEAL")
check(csf.fold(AH, "ENGLI", "0467F", "0467F ENGLI") == ("ENGL", "0467F"), "unparseable Hancock title keeps the number")
check(len(csf.HANCOCK_LABELS) == 38, "the Hancock sure-80 list is 38 codes, not the review pile")

# (4) placeholders and the review pile stay
check(csf.fold("Cypress College", "C", "INDS092") == ("C", "INDS092"), "Cypress C is not folded")
check(csf.is_not_a_subject("cypress", "C") and csf.is_not_a_subject("golden_west", "SPTP")
      and csf.is_not_a_subject("los_angeles_valley", "BOTH KIN"), "the three placeholders are not_a_subject")
for college, code, num in (
    ("Imperial Valley College", "ICC", "101"),
    ("City College of San Francisco", "GEOL/GEOG", "1"),
    ("City College of San Francisco", "LALS/LGBT", "1"),
    (AH, "ENGLL", "1"),
    (AH, "HEALT", "1"),
    (AH, "COMPC", "1"),
    (AH, "SPECI", "1"),
    (AH, "SPCOM", "1"),
    ("College of the Desert", "NURSING AND", "1"),
    ("College of San Mateo", "ESLNC", "1"),
    ("College of San Mateo", "MATNC", "1"),
):
    check(csf.fold(college, code, num) == (code, num), "%s %s must not fold" % (college, code))
check(ccl.fold("Cerro Coso Community College", "ICC", "C101") == ("ICC", "C101"), "campus-letter must still leave ICC")

# (6) a save on a glued code carries; a direct save wins
doc = {"decisions": [
    {"key": "SUBJ:chabot|PEACLSF|credit", "local_title": "Physical Education Activity", "who": "a reviewer"},
    {"key": "SUBJ:chabot|ATHLBB|credit", "local_title": "Athletics (glued)", "who": "a"},
    {"key": "SUBJ:chabot|ATHL|credit", "local_title": "Athletics", "who": "a"},
    {"key": "SUBJ:cypress|C|credit", "not_a_subject": True, "who": "a reviewer"},
]}
dec = sd.Decisions(doc, None)
a = dec.for_row("chabot", "PEAC", "credit")
check(a and a["local_title"] == "Physical Education Activity" and a.get("carried_from") == "PEACLSF",
      "a PEACLSF save carries to PEAC")
p = dec.for_row("chabot", "ATHL", "credit")
check(p and p["local_title"] == "Athletics", "a save on the folded code itself wins over a carried one")
n = dec.for_row("cypress", "C", "credit")
check(n and n.get("not_a_subject") and not dec.refused, "a not_a_subject save is honored, not refused: %s" % dec.refused)

# (5) the committed lookup, once rebuilt
s = open(os.path.join(ROOT, "coci_lookup_data.js"), encoding="utf-8").read()
d = json.loads(s[s.index("=") + 1:].rstrip().rstrip(";"))
cols = d["colleges"]
banned = {}
banned[CH] = {compact(c) for c in csf.PREPEND[CH]}
banned[AH] = {compact(c) for c in csf.HANCOCK_LABELS}
banned[GL] = {compact(c) for c in csf.SPLIT[GL]}
banned["Moorpark College"] = {compact(c) for c in csf.PREPEND["Moorpark College"]}
banned["Feather River College"] = {compact(c) for c in csf.SET_NUMBER["Feather River College"]}
banned["College of the Desert"] = {compact(c) for c in csf.SET_NUMBER["College of the Desert"]}
banned["Los Angeles Southwest College"] = {compact(c) for c in csf.SPLIT["Los Angeles Southwest College"]}
banned["Los Angeles Trade Technical College"] = {compact(c) for c in csf.SPLIT["Los Angeles Trade Technical College"]}
seen = {name: 0 for name in banned}
cypress_c = 0
for r in d["rows"]:
    name = cols[r[0]]
    subj = compact(r[2])
    if name in banned and subj in banned[name]:
        check(False, "fake subject left in the lookup: %s %s %s" % (name, r[2], r[3]))
    if name in seen:
        seen[name] += 1
    if name == "Cypress College" and compact(r[2]) == "C":
        cypress_c += 1
for name, n in seen.items():
    check(n > 0, "%s missing from the lookup" % name)
check(cypress_c > 0, "Cypress C must remain in the lookup (not_a_subject, not dropped)")

if fails:
    print("FAIL\n  " + "\n  ".join(fails))
    sys.exit(1)
print("ok: subject-parse folds (%d Chabot list, %d Hancock labels)" % (len(csf.PREPEND[CH]), len(csf.HANCOCK_LABELS)))
