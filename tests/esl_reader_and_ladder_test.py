#!/usr/bin/env python3
"""Guards for the ESL merging sheet's reader fixes and for the ladder script's own logic.

Sam's ESL merging procedure sheet (2026-09-26, https://claude.ai/artifact/LaZmu7NYj11DigAEbxsUMS)
came back with every item as proposed. Items 1 and 3 change how a title is read:

  1. "Keep the order and fix the three misreads: plurals of the purpose words, `Interm`
     as Intermediate, and `Part N` no longer read as a rung." Each case below is a
     title from the 92 ESL identities that arrived after the fold.
  3. "Keep purpose first, and add health words to it": 17 health-titled folds had
     fallen to Beginning and 1 to Intermediate.

Item 6 applies the ladder re-levels, and the lane's Open item held that no apply runs
before the ladder script's own logic is tested: Sam's sets table with its two-rung row,
the member vote, the noncredit shift, the tie, the identity word's precedence, and the
purpose carve-out skip, kept as the pair of assertions that made the old guard honest
("no carve-out was re-banded" AND "carve-outs were actually seen").

Run:  python3 tests/esl_reader_and_ladder_test.py
"""
import importlib
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(
    os.path.abspath(__file__))), "kb"))
D = importlib.import_module("_esl_package_dryrun")
R = importlib.import_module("_esl_relevel_dryrun")
A = importlib.import_module("_esl_package_apply")
L = importlib.import_module("_esl_ladder_relevel_dryrun")

FAILURES = []


def check(name, got, want):
    if got != want:
        FAILURES.append(name)
        print(f"  FAIL  {name}: got {got!r}, want {want!r}")
    else:
        print(f"  ok    {name}")


def fold(title):
    return D.classify(title)[0]


print("1. the three misreads (sheet item 1)")
check("`Interm` reads Intermediate",
      fold("High-Interm Reading/Writing/Grammar for Multiling Ss Part 1"), "Intermediate ESL")
check("the re-level reader agrees",
      R.classify("High-Interm Reading/Writing/Grammar for Multiling Ss Part 2")[0], "Intermediate")
check("`Part 1` is no rung in the fold", D._numeric_level("Integrated Skills Part 1"), None)
check("`Part 2` is no rung in the re-level reader", R.read_level("Integrated Skills: Part 2")[0], None)
check("`Part II` is no rung either", D._numeric_level("Conversation Part II"), None)
check("a real rung still reads", D._numeric_level("Grammar and Writing 2"), 2)
check("a Level still reads", R.read_level("ESL Level 6")[0], 6)
check("`Careers`, plural, is a purpose word", D.classify("Careers in ESL")[2], "carveout-vesl")
check("`Career`, singular, still is", D.classify("Career ESL")[2], "carveout-vesl")

print("2. health words come before any level (sheet item 3)")
for t in ("ESL for Healthcare 1", "ESL for Medical Terminology", "ESL for Patient Care Skills",
          "ESL for Healthcare Careers", "Listening and Speaking for Health Care Workers"):
    check(f"{t!r} is Vocational (health)", D.classify(t)[:1] + D.classify(t)[2:3],
          ("Vocational ESL (VESL)", "carveout-health"))
check("the apply splits it to Healthcare", A.is_healthcare("ESL for Healthcare 1"), True)
check("the apply and the fold read one pattern", A._HEALTHCARE is D.HEALTHCARE, True)
check("a level word alone is still a level", fold("Beginning Reading and Writing"), "Beginning ESL")
check("citizenship still comes first", D.classify("Citizenship for Healthcare Workers")[2],
      "carveout-citizenship")

print("3. Sam's sets table (2026-08-24), the two-rung row included")
doc, table, over = L.load_sets()
for (length, rung), want in (((2, 1), "Intermediate"), ((2, 2), "Advanced"),
                             ((3, 1), "Beginning"), ((3, 2), "Intermediate"), ((3, 3), "Advanced"),
                             ((4, 1), "Beginning"), ((4, 2), "Intermediate"), ((4, 3), "Intermediate"),
                             ((4, 4), "Advanced"), ((7, 3), "Beginning"), ((7, 4), "Intermediate")):
    check(f"L={length} rung {rung} -> {want}", table.get((length, rung)), want)
check("the noncredit shift moves Advanced down", over["shift"].get("Advanced"), "Intermediate")
check("and Beginning stays", over["shift"].get("Beginning"), "Beginning")

print("4. the member vote")
LAD = {"Alpha College": (4, [1, 2, 3, 4]), "Beta College": (2, [1, 2])}
NC = {"nc_values": {"Noncredit"}, "credit_status": {"CCC000NC1": "Noncredit"},
      "shift": over["shift"]}


def row(*members, title=""):
    return {"identity_title": title, "members": [
        {"college": c, "local_title": t, "control_number": cn} for c, t, cn in members]}


v, _ = L.member_votes(row(("Alpha College", "Reading 4", "CCC000CR1")), LAD, table, NC)
check("a rung votes by its college's ladder", [b for b, *_ in v], ["Advanced"])
v, _ = L.member_votes(row(("Alpha College", "Reading 4", "CCC000NC1")), LAD, table, NC)
check("a noncredit rung votes one band down", [b for b, *_ in v], ["Intermediate"])
v, _ = L.member_votes(row(("Alpha College", "Intermediate Reading 4", "CCC000NC1")), LAD, table, NC)
check("a stated level word votes as written, shift or no", [b for b, *_ in v], ["Intermediate"])
v, ab = L.member_votes(row(("Beta College", "Reading 3", "CCC000CR2")), LAD, table, NC)
check("a rung above the ladder abstains", (v, sum(ab.values())), ([], 1))
v, ab = L.member_votes(row(("Alpha College", "Integrated Skills: Part 2", "CCC000CR3")), LAD, table, NC)
check("a Part marker abstains instead of voting rung 2", (v, sum(ab.values())), ([], 1))
v, _ = L.member_votes(row(("Beta College", "Conversation 1", "CCC000CR4")), LAD, table, NC)
check("the two-rung row votes", [b for b, *_ in v], ["Intermediate"])

print("5. decide(): the identity word first, then the vote, and a tie decides nothing")
check("an identity level word wins over any vote",
      L.decide(row(("Alpha College", "Reading 4", "C1"), title="Beginning Reading"), LAD, table, NC)[:2],
      ("Beginning", "word"))
check("a tie is undecided",
      L.decide(row(("Alpha College", "Reading 1", "C1"), ("Alpha College", "Reading 4", "C2")),
               LAD, table, NC)[:2], (None, "tie"))
check("a majority decides",
      L.decide(row(("Alpha College", "Reading 4", "C1"), ("Beta College", "Reading 2", "C2"),
                   ("Alpha College", "Reading 1", "C3")), LAD, table, NC)[:2],
      ("Advanced", "ladder-vote"))

print("6. the purpose carve-out skip, end to end on the committed data")
plan = L.build("test")
skipped = {s["id"] for s in plan.get("skipped", [])} if "skipped" in plan else None
changed = {c["id"] for c in plan["changes"]}
purpose = {f["id"] for f in __import__("json").load(open(os.path.join(L.ROOT, L.APPLY_PLAN)))["folds"]
           if f["bucket"] not in L.LEVEL_BUCKETS}
check("carve-outs were actually seen (the guard can fire)", len(purpose) > 0 and
      plan["counts"]["purpose_carve_outs_skipped"] == len(purpose), True)
check("no purpose carve-out was re-banded", sorted(changed & purpose), [])
check("every change targets a level survivor",
      all(c["target"] in L.SURVIVOR.values() for c in plan["changes"]), True)

print()
if FAILURES:
    print(f"{len(FAILURES)} FAILED: {FAILURES}")
    sys.exit(1)
print("all checks passed")
