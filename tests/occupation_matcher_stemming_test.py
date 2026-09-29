#!/usr/bin/env python3
"""The occupation matcher must not merge two different words onto one token.

⚠️ This guard exists because the coverage rule cannot catch the failure it
guards. `stem()` strips -er/-or past four characters, which is right for
`installers -> install` and wrong for `engineer -> engine` and `actors -> act`:
those land on a DIFFERENT word. By the time `hit()` computes coverage, the
collapsed token is a genuine member of both sets, so every downstream threshold
certifies the match.

Measured 2026-09-16 joining the 369 California occupational and professional
licenses to the 541 COE occupations: 8 false pairs from engineer/engine and 1
from actors/act. The worked examples below are those pairs.

⚠️ THE OBVIOUS FIX IS WRONG AND IS PINNED AGAINST HERE. "Protect the strip when
the bare word is also in play" was tried first and cost Santa Rosa three correct
rows: Roofers/Roof, Floral Designers/Floral Design, Data Entry Keyers/10-Key are
all true agent nouns, where the bare word being present is exactly when the merge
is RIGHT. The guard names forbidden LANDING POINTS instead, and those three pairs
are checked below so the wrong fix cannot come back green.

⚠️ CI's python steps are STDLIB-ONLY by convention, and this file imports the
generator to reach stem/toks/Matcher. That made it fail on the runner with
`ModuleNotFoundError: openpyxl` while passing locally (2026-09-17) — the
generator imported openpyxl at module scope. The import now lives inside
write_workbook(). Keep it that way, and add no third-party import here.

Run: python3 tests/occupation_matcher_stemming_test.py
"""
import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location(
    "rco", ROOT / "kb" / "_build_regional_cpl_opportunity.py")
rco = importlib.util.module_from_spec(spec)
sys.modules["rco"] = rco
spec.loader.exec_module(rco)

FAILS = []


def check(cond, msg):
    if not cond:
        FAILS.append(msg)


def tokens(a, b):
    return (rco.tokset(rco.clean_title(a)), rco.tokset(rco.clean_title(b)))


# 1. The measured false pairs must not match.
MUST_NOT_MATCH = [
    ("Bus and Truck Mechanics and Diesel Engine Specialists", "Engineer In Training (E.I.T.)",
     "engineer collapsing onto engine"),
    ("Actors", "California Residential Mortgage Lending Act",
     "actors collapsing onto act"),
]
m = rco.Matcher([b for _, b, _ in MUST_NOT_MATCH])
for a, b, why in MUST_NOT_MATCH:
    check(m.hit(a, b) is None, f"{a!r} still matches {b!r} — {why}")
    A, B = tokens(a, b)
    check(not (A & B), f"{a!r} and {b!r} still share a token: {sorted(A & B)}")

# 2. The plural strip still runs, so two spellings of the same occupation reach
#    each other. Falling through to the next suffix is what preserves this.
check(rco.stem("engineers") == "engineer", "engineers must reduce to engineer")
check(rco.stem("engineer") == "engineer", "engineer must NOT reduce to engine")
check(rco.stem("actors") == "actor", "actors must reduce to actor")
check(rco.stem("actor") == "actor", "actor must NOT reduce to act")
A, B = tokens("Locomotive Engineers", "Marine Engineer")
check(A & B, "two engineer titles must still share a token")

# 3. TRUE AGENT NOUNS MUST KEEP MERGING. Each of these lost a correct Santa Rosa
#    row under the first attempt at this guard; they are the reason it was
#    rewritten. A fix that protects on "the bare word is in play" fails here.
for occ, cand in [("Roofers", "Basic Roof Framing"),
                  ("Floral Designers", "Floral Design"),
                  ("Data Entry Keyers", "10-Key Data Entry"),
                  ("Electricians", "Electrician Apprenticeship")]:
    A, B = tokens(occ, cand)
    check(A & B, f"{occ!r} must still share a token with {cand!r}")

# 4. The documented good match survives (kb/_build_regional_cpl_opportunity.py's
#    own comment names it): a single shared token that is the whole of one side.
m2 = rco.Matcher(["Paralegal Studies"])
check(m2.hit("Paralegals and Legal Assistants", "Paralegal Studies") is not None,
      "Paralegals and Legal Assistants must still reach Paralegal Studies")

if FAILS:
    print("FAIL — occupation matcher stemming")
    for f in FAILS:
        print("  -", f)
    sys.exit(1)
print("ok — occupation matcher stemming (15 checks)")
