"""Two CSR scanner rules that reported settled work as open (2026-09-29).

CS9: the anchor rule compares the M-ID's prefix, never its `subject`.

The curated anchor (`kb/common_courses.json`) was re-keyed from
`M-ID SUBJ NNN` to `SUBJ4 M####`. The rule kept reading the old key, found
nothing, and fell back to `rec["subject"]`, which holds the modal LOCAL code
colleges typed. Re-run on 2026-09-29, it reported 108 anchors as re-mint
questions whose ids already carried the canonical (`BUSI M11TR`, subject
`ACCT`) and 13 umbrella languages, and counted all 218 M-ID anchors as
dead-format when 3 were. Those 121 were most of the CSR's Jev backlog.

CS2: a ruled fan-in is not a duplicate. Sam put Film and Media Studies and
Media Production on FTVE by design (2026-09-03 rulings, item 13), and the
registry records it on both entries; the rule reported it as a collision.

Run: python3 tests/csr_trail_rules_test.py
"""
import importlib.util
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location(
    "csr_trail", os.path.join(ROOT, "kb", "_csr_trail.py"))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

fails = []


def check(cond, msg):
    print(("ok   " if cond else "FAIL ") + msg)
    if not cond:
        fails.append(msg)


REG = {
    "Business": {"canonical_subj4": "BUSI"},
    "Music": {"canonical_subj4": "MUSI"},
    "Foreign Languages": {"canonical_subj4": "FLNG"},
    "Nursing": {"canonical_subj4": "NRSR"},
}


def anchor(subject, discipline):
    return {"id_system": "M-ID", "subject": subject, "discipline": discipline}


# 1. The id already carries the canonical; the subject field is a local code.
dead, div = m.cs9_anchor({"BUSI M11TR": anchor("ACCT", "Business"),
                          "MUSI M12SL": anchor("MUS", "Music")}, REG)
check(div == [], "a current-format id carrying the canonical is not a divergence, "
                 "whatever its subject field says")
check(dead == [], "a current-format key is not dead-format")

# 2. A prefix that really differs from the canonical is still reported.
dead, div = m.cs9_anchor({"NURS M1001": anchor("NURS", "Nursing")}, REG)
check(div == [("NURS M1001", "NURS", "NRSR")],
      "an id whose prefix differs from the canonical is reported, with the prefix as evidence")

# 3. Umbrella disciplines are the documented identity-layer exception.
dead, div = m.cs9_anchor({"ARAB M10BR": anchor("ARAB", "Foreign Languages"),
                          "FLNG M10AC": anchor("HEBR", "Foreign Languages")}, REG)
check(div == [], "an umbrella discipline's language code is exempt, as CS6 exempts it")

# 4. The pre-remint key format is dead, and its own subject is the comparison.
dead, div = m.cs9_anchor({"M-ID MUS 100": anchor("MUS", "Music"),
                          "M-ID HOSP 100": anchor("HOSP", "Travel Services")}, REG)
check(sorted(dead) == ["M-ID HOSP 100", "M-ID MUS 100"], "only `M-ID SUBJ NNN` keys count as dead")
check(div == [("M-ID MUS 100", "MUS", "MUSI")],
      "a dead key compares its own subject; a discipline with no canonical reports nothing")

# 5. Non-M-ID anchors (C-ID, CCN) are outside the rule.
dead, div = m.cs9_anchor({"ACCT 110": {"id_system": "C-ID", "subject": "ACCT",
                                       "discipline": "Business"}}, REG)
check(dead == [] and div == [], "a C-ID anchor is never read by the M-ID rule")

# 6. On the committed files, every reported divergence names the key's own prefix.
real_anchor = json.load(open(os.path.join(ROOT, "kb", "common_courses.json"), encoding="utf-8"))
real_reg = json.load(open(os.path.join(ROOT, "kb", "discipline_canonical_subj4.json"),
                          encoding="utf-8"))["disciplines"]
dead, div = m.cs9_anchor(real_anchor, real_reg)
check(all(k.startswith("M-ID ") for k in dead), "every dead key on the real anchor is `M-ID `-keyed")
check(all(k.split()[0] == p or k.startswith("M-ID ") for k, p, _ in div),
      "every real divergence reports the id's own prefix")

# 7. CS2: a mutual fan-in is exempt; a one-sided or undeclared share is not.
FAN = {
    "Film and Media Studies": {"canonical_subj4": "FTVE", "fan_in_with": ["Media Production"]},
    "Media Production": {"canonical_subj4": "FTVE", "fan_in_with": ["Film and Media Studies"]},
    "Agricultural Business and Related Services": {"canonical_subj4": "AUTB"},
    "Auto Body Technology": {"canonical_subj4": "AUTB"},
    "Alpha": {"canonical_subj4": "ALPH", "fan_in_with": ["Beta"]},
    "Beta": {"canonical_subj4": "ALPH"},
}
dups = m.cs2_dups(FAN)
check(("Film and Media Studies", "Media Production", "FTVE") not in dups,
      "a fan-in both entries declare is not a duplicate")
check(("Agricultural Business and Related Services", "Auto Body Technology", "AUTB") in dups,
      "an undeclared shared code is a duplicate")
check(("Alpha", "Beta", "ALPH") in dups, "a one-sided declaration does not silence a collision")

# 8. On the committed registry, FTVE's ruled fan-in never reports.
real_dups = m.cs2_dups(real_reg)
check(not any(c == "FTVE" for _, _, c in real_dups), "the real FTVE fan-in stays quiet")

# 9. CS4 (S425): a recorded note settles a divergence, so the scan stops asking.
check(m.note_records_prefix({"_notes": "CS4 divergence recorded: anchor-official prefix CMUS has zero COCI adoption; MUSC stays."}, "CMUS"),
      "a note naming the official prefix records the divergence")
check(not m.note_records_prefix({"_notes": "picked for the mnemonic"}, "CMUS"), "a note that does not name the prefix records nothing")
check(not m.note_records_prefix({}, "CMUS"), "no note, nothing recorded")
check(not m.note_records_prefix({"_notes": "CMUSIC is not it"}, "CMUS"), "the prefix is matched as a word, not a fragment")

# 10. CS10 (S425): every minted identity's code against the registry, from the minted files.
COURSES = {"courses": {
    "BUSI M1001": {"discipline": "Business"}, "BUSI M1002": {"discipline": "Business"},
    "SPAN M1001": {"discipline": "Foreign Languages"},
    "MCOM M1001": {"discipline": None}, "MCOM M1002": {}, "TOUR M1001": {"discipline": "Travel Services"},
    "ACCT 110": {"discipline": "Business"}}}
SINGLES = {"singletons": {"BUSI MNAA": {"discipline": "Business"}, "MCOM MNAB": {"discipline": None}}}
REG10 = {"Business": {"canonical_subj4": "BUSI"},
         "Foreign Languages": {"canonical_subj4": "FLNG", "umbrella_codes": ["FLNG", "SPAN", "FREN"]}}
mc = m.mid_subject_codes(REG10, COURSES, SINGLES)
check(mc["ids"] == 8 and mc["codes"] == 4, "every M-shaped id counts, a C-ID key does not: %r" % ({k: v for k, v in mc.items() if k != "strays"},))
check(mc["canonical"] == 1 and mc["umbrella"] == 1, "a canonical code and a declared umbrella code are not strays")
check(mc["stray_codes"] == 2 and mc["stray_ids"] == 4, "the strays are the codes neither canonical nor umbrella, with their ids")
check(mc["strays"][0]["code"] == "MCOM" and mc["strays"][0]["ids"] == 3 and mc["strays"][0]["disciplines"] == {"(no discipline)": 3},
      "a stray lists its ids and the disciplines they carry, no discipline named as such")
check(mc["strays"][1] == {"code": "TOUR", "ids": 1, "disciplines": {"Travel Services": 1}}, "a stray with a discipline names it")

# 11. On the committed files the measure reproduces the registry's own codes.
real_mc = m.mid_subject_codes(real_reg)
real_canon = {e.get("canonical_subj4") for e in real_reg.values()}
check(real_mc["canonical"] == len(real_canon), "every canonical code carries at least one identity")
check(real_mc["stray_ids"] < real_mc["ids"] * 0.02, "strays are under two percent of the identities (%d of %d)" % (real_mc["stray_ids"], real_mc["ids"]))

if fails:
    print("\n%d check(s) failed" % len(fails))
    sys.exit(1)
print("\nall checks passed")
