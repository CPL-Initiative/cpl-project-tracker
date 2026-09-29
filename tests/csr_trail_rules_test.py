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

if fails:
    print("\n%d check(s) failed" % len(fails))
    sys.exit(1)
print("\nall checks passed")
