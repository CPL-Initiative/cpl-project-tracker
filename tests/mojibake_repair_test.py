#!/usr/bin/env python3
"""Mojibake repair — generator + normalizer verification (2026-06-12).

Guards _fix_text_encoding() in excel_to_dashboard.py and fix_mojibake() in
kb/_normalize_common_titles.py (mirrored logic — both are exercised):

  1. The cp1252→UTF-8 decode loop repairs single- AND double-encoded
     sequences ("Learnerâ€™s", "CuauhtÃƒÂ©moc", "MenÃ¢â‚¬â„¢s").
  2. The pair map catches remnants the loop can't round-trip — the NBSP
     artifact in all THREE case forms the data carries ("Ã‚Â" raw,
     "ã‚â" lowercased and "Ã‚â" mixed-case from the Session-51 title-caser).
  3. Honest text is never harmed: accented Spanish/French, the legitimate
     Ã-bearing "São", plain titles (the hint regex gates entry).
  4. The changed flag is accurate (drives the e:1 member flag + the
     kb/coci_title_corrections.json queue).

Not wired into `npm test` (the JS runner only discovers *.test.js) because it
needs the Python pipeline deps. Run from the repo root:

    python3 tests/mojibake_repair_test.py
"""
import importlib.util
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
sys.path.insert(0, os.path.join(ROOT, "kb"))

spec = importlib.util.spec_from_file_location("gen", os.path.join(ROOT, "excel_to_dashboard.py"))
gen = importlib.util.module_from_spec(spec)
_argv = sys.argv
sys.argv = ["x"]
spec.loader.exec_module(gen)
norm_spec = importlib.util.spec_from_file_location(
    "norm", os.path.join(ROOT, "kb", "_normalize_common_titles.py"))
norm = importlib.util.module_from_spec(norm_spec)
norm_spec.loader.exec_module(norm)
sys.argv = _argv

failures = []


def check(label, actual, expected):
    if actual == expected:
        print(f"PASS  {label}")
    else:
        print(f"FAIL  {label}: expected {expected!r}, got {actual!r}")
        failures.append(label)


REPAIRS = [
    # decode-loop cases (single + double encoded)
    ("Commercial Truck Driving: Preparation for the Learnerâ€™s Permit",
     "Commercial Truck Driving: Preparation for the Learner’s Permit"),
    ("Intercollegiate MenÃ¢â‚¬â„¢s Soccer", "Intercollegiate Men’s Soccer"),
    ("Ballet FolklÃ³rico I", "Ballet Folklórico I"),
    ("Chicana and Chicano History: Pre-CuauhtÃƒÂ©moc to U.S.-Mexico War",
     "Chicana and Chicano History: Pre-Cuauhtémoc to U.S.-Mexico War"),
    ("Introduction to Culinology Â® Professions",
     "Introduction to Culinology ® Professions"),
    ("Survey of Art Ã¢â‚¬â€œ Asian Art", "Survey of Art – Asian Art"),
    # NBSP artifact — raw (with the NBSP payload byte intact)
    ("IntroductionÃ‚Â ToÃ‚Â Poetry",
     "Introduction To Poetry"),
    # NBSP artifact — payload flattened to a plain space (pair-map path)
    ("IntroductionÃ‚Â ToÃ‚Â Poetry:Ã‚Â CreativeÃ‚Â Writing",
     "Introduction To Poetry: Creative Writing"),
    # the Session-51 title-caser's lowercased + mixed-case variants
    ("IntroductionÃ‚Â Toã‚â Poetry:Ã‚Â CreativeÃ‚Â Writing",
     "Introduction To Poetry: Creative Writing"),
    ("When the Paycheck Stops Ã‚â", "When the Paycheck Stops"),
]
NO_HARM = [
    "Plain Honest Title",
    "Statistics for Behavioral Sciences",
    "Café Management with é and ñ",
    "São Paulo Studies",          # legitimate Ã-bearing word
    "Théâtre Arts",               # legitimate â-bearing word
]

for raw, want in REPAIRS:
    fixed, changed = gen._fix_text_encoding(raw)
    check(f"generator repairs {raw[:46]!r}", fixed, want)
    check(f"generator flags  {raw[:46]!r}", changed, True)
    check(f"normalizer repairs {raw[:44]!r}", norm.fix_mojibake(raw), want)

for t in NO_HARM:
    fixed, changed = gen._fix_text_encoding(t)
    check(f"generator keeps {t!r}", (fixed, changed), (t, False))
    check(f"normalizer keeps {t!r}", norm.fix_mojibake(t), t)

# idempotency: repairing a repaired title is a no-op
fixed, _ = gen._fix_text_encoding("IntroductionÃ‚Â ToÃ‚Â Poetry")
fixed2, changed2 = gen._fix_text_encoding(fixed)
check("repair is idempotent", (fixed2, changed2), (fixed, False))

print()
if failures:
    print(f"{len(failures)} FAILURE(S)")
    sys.exit(1)
print("ALL PASS")
