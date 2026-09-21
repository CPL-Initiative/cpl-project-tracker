#!/usr/bin/env python3
"""The Jev magic half, guarded at its failure modes — kb/_jev_adjudicate.py.

Sam, 2026-09-21: "Let continue with Jev routines in CSR, CCR, CCRR, CER".

These are the ways an AI adjudication pass fails while LOOKING like it worked,
which is why each is pinned rather than described:

  * ⭐ A SKEPTIC SHOWN THE VERDICT RUBBER-STAMPS IT. "Critique this proposal"
    hands the model a conclusion and asks for fault. The playbook's working
    skeptics re-derived the evidence instead; here the second look is a separate
    call that never receives the first answer. If it ever does, agreement stops
    measuring anything and the whole pass reads as confirmation.

  * ⭐ A CONFIDENT PROPOSAL THE SECOND LOOK CONTRADICTS MUST NOT REACH THE PLAN.
    "A refuted merge falls back to the judgment queue instead of the plan" —
    confidence alone never promotes.

  * ⭐ A NOUL ANSWER IS A PROBABILITY, NOT A BOOLEAN (the named note on the
    2026-09-20 trial: an earlier cut tested `is True`, which a float never
    satisfies, and would have reported zero merges whatever Jev said — which
    reads exactly like a clean negative result).

  * Spending calls on mechanical findings. 180 of the CER's 239 are roman-numeral
    renames and style nits; a call on those buys nothing.

Pure stdlib, no network: Jev is replaced by a recorder that also asserts what it
was shown. Run: python3 tests/jev_adjudicate_test.py
"""
import json
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))

results = []
def check(name, cond, why=""):
    results.append((name, bool(cond), why))

import _jev_adjudicate as J  # noqa: E402

# ── a Jev stand-in that records every state and question set it is shown ─────
seen = []
def fake_system_one(answers_for):
    def _call(state, questions, key, model=None):
        seen.append({"state": dict(state), "questions": sorted(questions)})
        out = {}
        for q in questions:
            if q == "care":
                out[q] = {"score": 1, "confidence": 0.9}
            else:
                out[q] = {"noul": answers_for(q, state)}
        return {"answers": out}
    return _call

SPEC = J.CCRR_RULES["anchored_pair"]
STATE = {"item": "3 hours in Intro to Stats", "evidence": "published line: …",
         "proposed": "fold into: 3 hours in Introduction to Statistics"}

# ── 1. the second look never sees the first answer ──────────────────────────
seen.clear()
J.system_one = fake_system_one(lambda q, s: 0.95 if q == "verdict" else 0.02)
first = J.ask(STATE, SPEC, "k")
agree, p_hold = J.second_look(STATE, SPEC, "k")
check("the positive look returns a probability, never a bool",
      isinstance(first["p"], float) and first["p"] == 0.95,
      f"got {first['p']!r} of type {type(first['p']).__name__}")
check("the second look is a SEPARATE call", len(seen) == 2, f"{len(seen)} call(s)")
blob = json.dumps(seen[1])
check("⭐ the second look is never shown the first verdict",
      "0.95" not in blob and "verdict" not in seen[1]["questions"],
      f"the skeptic's call carried: {blob[:200]}")
check("the second look asks its own question, not a restatement",
      seen[1]["questions"] == ["hold"], f"got {seen[1]['questions']}")
check("an uncontradicted confident proposal is suggested",
      J.act_bucket(first["p"], agree) == "suggest", f"agree={agree}")

# ── 2. a contradicted proposal never reaches the plan ───────────────────────
seen.clear()
J.system_one = fake_system_one(lambda q, s: 0.99 if q == "verdict" else 0.97)
first2 = J.ask(STATE, SPEC, "k")
agree2, _ = J.second_look(STATE, SPEC, "k")
check("⭐ a refuted proposal goes to the curator however confident the first look",
      agree2 is False and J.act_bucket(first2["p"], agree2) == "contested",
      f"p={first2['p']} agree={agree2} -> {J.act_bucket(first2['p'], agree2)}")

# ── 3. a hedge is not a refutation ──────────────────────────────────────────
seen.clear()
J.system_one = fake_system_one(lambda q, s: 0.9 if q == "verdict" else 0.5)
f3 = J.ask(STATE, SPEC, "k")
a3, _ = J.second_look(STATE, SPEC, "k")
check("a 0.5 'maybe' from the second look neither confirms nor refutes",
      a3 is False and J.act_bucket(f3["p"], a3) == "contested",
      "a hedge must not silently promote to suggest")

# ── 4. under the gate, the curator sees it whatever the second look says ────
check("below the gate everything routes to the curator",
      J.act_bucket(0.84, True) == "curator" and J.act_bucket(0.5, None) == "curator",
      "the 2026-09-20 calibration: below 0.85 the number carried no signal")
check("an unscored finding is never treated as an answer",
      J.act_bucket(None, True) == "unscored", "")

# ── 5. triage: only judgment findings, only known rules ─────────────────────
for ref in ("csr", "cer", "ccrr"):
    rows, _src = J.REFS[ref][1]()
    rules = J.REFS[ref][2]
    check(f"{ref}: every finding carries a rule this module can ask about",
          rows and all(r["rule"] in rules for r in rows),
          f"{sorted({r['rule'] for r in rows}) if rows else 'no findings'}")

cer_raw = json.load(open(J._latest(os.path.join("trail_crew_out", "*", "findings.json")),
                         encoding="utf-8"))
cer_all = cer_raw["findings"] if isinstance(cer_raw, dict) else cer_raw
cer_rows, _ = J.cer_findings()
mech = [f for f in cer_all if not f.get("needs_judgment")]
check("⭐ mechanical findings never reach Jev",
      len(mech) > 0 and not ({f["id"] for f in cer_rows} & {f["id"] for f in mech}),
      f"{len(mech)} mechanical of {len(cer_all)}; a call on a roman-numeral rename buys nothing")

# ── 6. held curator decisions are dropped BEFORE a call is spent ────────────
rows, _ = J.csr_findings()
held = {rows[0]["id"]}
with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as fh:
    json.dump(sorted(held), fh)
    held_path = fh.name
kept, _ = J.run("csr", None, held, key=None, score_only=True)
check("⭐ a finding the curator parked is dropped before any call",
      rows[0]["id"] not in {f["id"] for f in kept},
      "or the adjudicators re-propose what the curator deliberately deferred")
os.unlink(held_path)

# ── 7. the blocking is imported, never reimplemented ────────────────────────
src = open(os.path.join(ROOT, "kb", "_jev_adjudicate.py"), encoding="utf-8").read()
check("⭐ CCRR blocking is imported from the trial, not copied",
      "from _typesafe_cr_trial import build_pairs" in src and "by_canon" not in src,
      "the alias chain was copy-pasted once and the copy drifted to 7 maps against 15")

# ── 8. the ground truth is his own calls only ───────────────────────────────
doc = J.sam_verdicts.__doc__ or ""
check("scoring is documented as his own verdicts, never as-proposed rows",
      "by: \"default\"" in doc and "opt-out" in doc,
      "an as-proposed row measures the default, never the model")

# ── 9. it says, in its own text, that it never writes ───────────────────────
check("the module states it suggests and never writes",
      "never merges" in src.lower() and "nothing is decided" in src.lower(), "")

failed = 0
for name, ok, why in results:
    if not ok:
        failed += 1
    print(("ok   " if ok else "FAIL ") + name + ("" if ok or not why else f"\n       {why}"))
print(f"\n{len(results) - failed}/{len(results)} checks passed")
sys.exit(1 if failed else 0)
