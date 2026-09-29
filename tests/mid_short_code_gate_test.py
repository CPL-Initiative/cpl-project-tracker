"""A one or two character subject code never decides a discipline on its own.

Sam's cross-list sheet, item 2 (2026-09-22). 25 mapped subject codes are this
short, and they are a signal on 400 of the 1,210 rows whose colleges disagree
about discipline. `ES` maps to Ethnic Studies and means Exercise Science at many
colleges, which is how 31 physical-activity courses came to carry an ETHS
prefix -- Advanced Fencing, Swimming for Nonswimmers, Intercollegiate Track,
Advanced Golf. Both senses are real in the data, so the code cannot be resolved
without reading the title.

This guards the minting path specifically, because the re-mint that repairs the
existing rows runs through it: a gate added anywhere else would let the repair
reproduce the defect it is repairing.

Run: python3 tests/mid_short_code_gate_test.py
"""
import importlib.util
import os
import sys
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location(
    "seed_mids", os.path.join(ROOT, "kb", "_seed_coci_minted_mids.py"))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

MAP = {"ES": "Ethnic Studies", "ETHN": "Ethnic Studies", "KIN": "Kinesiology",
       "PE": "Physical Education", "KINA": "Kinesiology",
       "CS": "Computer Science", "CIS": "Computer Information Systems"}

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


# ── a longer code that DISAGREES holds the discipline ────────────────────────
# Advanced Golf: members read ES and KIN. Today this mints ETHS.
disc, note = m.discipline_for_modal("ES", Counter({"ES": 3, "KIN": 2}), MAP)
check("a disagreeing longer code holds the discipline", disc is None, repr(disc))
check("the hold says which codes disagreed",
      note and "KIN" in note and "Kinesiology" in note, repr(note))
check("and it never substitutes the longer code's answer",
      disc != "Kinesiology",
      "substituting would be a second guess dressed as a determination")

# ── the token still takes SUBJ4 shape from the longer code ───────────────────
check("the mint token comes from the longer code, so the id is not `M-ID ES n`",
      m.mint_token("ES", Counter({"ES": 3, "KIN": 2})) == "KIN",
      m.mint_token("ES", Counter({"ES": 3, "KIN": 2})))

# ── a longer code that AGREES lets the discipline stand ──────────────────────
disc, note = m.discipline_for_modal("ES", Counter({"ES": 3, "ETHN": 2}), MAP)
check("⭐ two signals that agree keep the discipline", disc == "Ethnic Studies", repr(disc))
check("an agreeing cluster carries no hold note", note is None, repr(note))

# ── nothing longer at all: held, and it says so ──────────────────────────────
disc, note = m.discipline_for_modal("ES", Counter({"ES": 4}), MAP)
check("an uncorroborated short code is held", disc is None, repr(disc))
check("the note names the absence of corroboration",
      note and "nothing" in note and "corroborates" in note, repr(note))

# ── a normal code is untouched, which is most of the data ────────────────────
disc, note = m.discipline_for_modal("KIN", Counter({"KIN": 5, "ES": 1}), MAP)
check("a three-character modal is unaffected", disc == "Kinesiology" and note is None,
      f"{disc!r} / {note!r}")
check("a long modal keeps its own token",
      m.mint_token("KIN", Counter({"KIN": 5, "ES": 1})) == "KIN")

# ── the gate is not special-cased to ES ──────────────────────────────────────
disc, _ = m.discipline_for_modal("CS", Counter({"CS": 4, "CIS": 3}), MAP)
check("CS against CIS is held on the same rule", disc is None, repr(disc))

# ── the threshold is where the doctrine says ─────────────────────────────────
check("the short-code threshold is two characters", m.SHORT_CODE_MAX == 2,
      str(m.SHORT_CODE_MAX))

passed = 0
for name, ok, why in results:
    print(f"{'  ok' if ok else 'FAIL'}  {name}" + ("" if ok else f"  — {why}"))
    passed += ok
print(f"\n{passed}/{len(results)} checks passed")
sys.exit(0 if passed == len(results) else 1)
