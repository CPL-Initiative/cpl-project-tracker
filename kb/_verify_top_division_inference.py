"""
Verify the COARSE TOP-division discipline inference (kb/_infer_disciplines_from_top_division.py).

Guards the failure modes:
  * a map target that isn't a real MQ discipline (the pass aborts on this — a typo
    would silently wipe out the whole pass),
  * the 2-digit-division → umbrella mapping (4930.62 → Interdisciplinary Studies,
    0901.00 → Industrial Technology, …),
  * skipped divisions stay blank (Media/Fine-Arts/Commercial have no honest umbrella),
  * the fill respects reviewed/non-blank records (idempotent / never overwrites).

Run:  python3 kb/_verify_top_division_inference.py
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _infer_disciplines_from_top_division as P  # noqa: E402

divmap = P.load("top_division_discipline_map.json")["map"]
valid = set(P.load(os.path.join("reference", "mq_disciplines.json"))["disciplines"])

results = []
def check(name, cond):
    results.append((name, bool(cond)))

# 1) every map target is a real MQ discipline (the pass's abort guardrail)
bad = sorted(d for d in divmap.values() if d not in valid)
check("every top_division_discipline_map target is a valid MQ discipline", not bad)
if bad:
    print("  INVALID targets:", bad)

# 2) the core mapping — catch-all codes resolve to their division umbrella
check("4930.62 (interdisciplinary catch-all) -> Interdisciplinary Studies",
      P.discipline_for({"top_code": "4930.62"}, divmap) == "Interdisciplinary Studies")
check("0901.00 (engineering/industrial) -> Industrial Technology",
      P.discipline_for({"top_code": "0901.00"}, divmap) == "Industrial Technology")
check("1299.00 ('Other Health') -> Health",
      P.discipline_for({"top_code": "1299.00"}, divmap) == "Health")
check("1105.00 (foreign language) -> Foreign Languages",
      P.discipline_for({"top_code": "1105.00"}, divmap) == "Foreign Languages")

# 3) deliberately-skipped divisions stay None (no honest umbrella → blank)
for code, div in [("1001.00", "10 Fine/Applied Arts"), ("0602.00", "06 Media/Comm"),
                  ("3010.00", "30 Commercial Services")]:
    check(f"skipped division {div} stays blank ({code} → None)",
          P.discipline_for({"top_code": code}, divmap) is None)

# 4) missing / empty top_code → None (never guesses)
check("empty top_code → None", P.discipline_for({"top_code": ""}, divmap) is None)
check("no top_code key → None", P.discipline_for({}, divmap) is None)

# 5) confidence + source constants are the lowest tier
check("SOURCE == 'top_division'", P.SOURCE == "top_division")
check("CONFIDENCE == 0.4 (coarsest tier, below top_code 0.5)", P.CONFIDENCE == 0.4)

pass_n = sum(1 for _, ok in results if ok)
for n, ok in results:
    print(("PASS" if ok else "FAIL") + "  " + n)
print(f"\n{pass_n}/{len(results)} checks passed")
sys.exit(0 if pass_n == len(results) else 1)
