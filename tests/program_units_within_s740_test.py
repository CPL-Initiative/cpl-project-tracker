#!/usr/bin/env python3
"""S740: units_within_printed_range, the units twin of hours_within_printed_range, and its statewide self-recall.

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): a record whose figures do not reconcile is
collected with its gap named. A named gap must be true of its record: S739's reader rejected noted_figures_differ on a
units sum inside its printed range (d-within-range-sums-hold-for-units-kind-s739), and seven records held for a kind of
their own. The kind (kb/_program_named_gaps.py) says only what the filed figures show, and it is filed from a
reviewed list (kb/_program_piles_s740*.py), never by a record rule. Pinned here:

  * the kind has its sentence and the hours kind's score, 50; no record rule names it, so answer and judge file it on
    no record;
  * the figures: a sum inside the printed range names the kind, at the range's top too (Gavilan 08460's 36 in 30-36);
    a sum whose low end is the range's low end (the scorer's short-high reading), a sum outside the range, a passing
    record, an hours record, a record whose coverage fails, a degree total, an incomplete sum and any other reason
    name nothing; the hours twin still names its own kind on an hours record;
  * the self-recall on held answers, synthetic (NG.units_within_recall): every passing units record the scorer
    reproduces is read four ways with its printed total moved, the scorer's own verdict the held answer; wrong 0;
  * the self-recall on held answers, real (B7.within_held_recall): of the failing records the figures name statewide,
    those whose answer a committed plan or handoff 740 holds. The figures alone are wrong wherever another lever or
    a hold owns the record, which is why the kind is no record rule; the reviewed lists are wrong on none, and every
    key the reviewed lists file is one whose held answer is the kind.

Run from repo root: python3 tests/program_units_within_s740_test.py
"""
import copy
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s740 as B7  # noqa: E402

KIND = "units_within_printed_range"
n, failures = 0, []


def check(cond, msg):
    global n
    n += 1
    if not cond:
        failures.append(msg)


def units(comp, st, **kw):
    """A failing units record read against its program total, collectable."""
    a = {"pass": False, "status": "unequal", "computed": list(comp), "stated": list(st), "against": "program",
         "why": ["the blocks sum to %s-%s; the catalog states %s-%s" % (comp[0], comp[1], st[0], st[1])]}
    a.update(kw.pop("arith", {}))
    f = {"college": "A College", "control_number": "00001", "award": "Certificate of Achievement",
         "record": {"program": {"measure": "units", "total_units": {"min": st[0], "max": st[1]}}, "blocks": [],
                    "notes": []},
         "score": {"pass": False, "arithmetic": a, "coverage": {"pass": True, "share": 1.0},
                   "invented": {"pass": True}}}
    f.update(kw)
    return f


# The kind and where it lives.
check(KIND in NG.GAPS and NG.ARITH_SCORE.get(KIND) == NG.ARITH_SCORE["hours_within_printed_range"] == 50,
      "the kind has its sentence and the hours kind's score, 50")
check("units" in NG.GAPS[KIND] and "hours" not in NG.GAPS[KIND], "its sentence names units, never hours")
check(KIND not in [name for name, _ in NG.RECORD_RULES], "no record rule names the kind")
f = units([36.0, 36.0], [30.0, 36.0])
check(NG.answer(f) is None and NG.judge(f) is None, "answer and judge file it on no record")

# The figures.
w = NG.units_within_printed_range(units([53.0, 60.0], [48.0, 60.0]))
check(w and "53-60" in w and "48-60" in w, "a sum inside the printed range names the kind, with both figures")
check(NG.units_within_printed_range(f) and NG.units_within_printed_range(units([27.0, 27.0], [26.0, 27.0])),
      "a sum at the range's top names the kind (36 in 30-36, 27 in 26-27)")
check(NG.units_within_printed_range(units([23.0, 27.0], [22.0, 27.0], arith={"why": []})),
      "a record an older scorer filed with no reason sentence names the kind")
for label, g in (
        ("the sum's low end at the range's low end (short-high)", units([30.0, 33.0], [30.0, 36.0])),
        ("a sum past the range's top", units([31.0, 37.0], [30.0, 36.0])),
        ("a sum below the range", units([29.0, 33.0], [30.0, 36.0])),
        ("a sum equal to the range", units([30.0, 36.0], [30.0, 36.0])),
        ("a sum against a single printed figure", units([36.0, 36.0], [35.0, 35.0])),
        ("a passing record", units([36.0, 36.0], [30.0, 36.0], arith={"pass": True, "status": "equal"})),
        ("a degree total", units([61.0, 61.0], [60.0, 62.0], arith={"against": "degree"})),
        ("an incomplete sum", units([36.0, 36.0], [30.0, 36.0], arith={"status": "incomplete"})),
        ("another reason beside the sum", units([36.0, 36.0], [30.0, 36.0],
                                                arith={"why": ["a required course in 'Core' has no units"]})),
        ("a printed total of zero", units([0.0, 0.0], [0.0, 0.0])),
        ("no printed total", units([36.0, 36.0], [30.0, 36.0], arith={"stated": None}))):
    check(NG.units_within_printed_range(g) is None, "%s names nothing" % label)
g = units([36.0, 36.0], [30.0, 36.0])
g["score"]["coverage"]["pass"] = False
check(NG.units_within_printed_range(g) is None, "a record whose coverage fails names nothing")
h = units([245.0, 245.0], [172.0, 245.0])
h["record"]["program"]["measure"] = "hours"
h["score"]["arithmetic"]["why"] = ["the blocks sum to 245.0-245.0; the catalog states 172.0-245.0"]
check(NG.units_within_printed_range(h) is None and (NG.answer(h) or (None,))[0] == "hours_within_printed_range",
      "an hours record takes the hours twin, never this kind")

# The self-recall, synthetic: the scorer's own verdict is the held answer.
every = B7.every_record()
rc = NG.units_within_recall(every)
print("units_within_recall: %s" % {k: v for k, v in rc.items() if k != "wrong_keys"})
check(rc["wrong"] == 0 and not rc["wrong_keys"], "the synthetic recall reads no wrong answer: %s" % rc["wrong_keys"][:5])
check(rc["held"] == rc["right"] and rc["held"] > 40000 and rc["read"] > 10000,
      "every held answer is right (%d of %d, over %d records)" % (rc["right"], rc["held"], rc["read"]))
check(set(rc["by_answer"]) == {"within %s" % KIND, "boundary_top %s" % KIND, "boundary_low none", "differs none"},
      "within and the top boundary hold the kind; the low boundary and a total past the sum hold none: %s"
      % rc["by_answer"])
check(rc["other_total"] + rc["sum_moved"] < rc["held"] / 100, "the readings counted apart stay under 1%")

# The self-recall, real records: the hand answers committed plans and handoff 740 hold.
reviewed = B7.reviewed_keys()
hr = B7.within_held_recall(every, reviewed)
print("within_held_recall: %s" % {k: v for k, v in hr.items() if not k.endswith("_keys") and k != "gone"})
check(hr["reviewed_wrong"] == 0 and hr["reviewed_right"] == hr["held"],
      "the reviewed lists are wrong on no held answer: %s" % hr["reviewed_wrong_keys"])
check(hr["figures_wrong"] >= 15 and hr["figures_right"] + hr["figures_wrong"] == hr["held"],
      "the figures alone name records another lever or a hold owns (%d of %d held): no record rule"
      % (hr["figures_wrong"], hr["held"]))
kind_keys = {k for k, (answer, _) in B7.WITHIN_HELD.items() if answer == KIND}
check(reviewed == kind_keys, "the reviewed lists file exactly the keys whose held answer is the kind: %s"
      % sorted(reviewed ^ kind_keys))
by_key = {(str(x.get("college")), str(x.get("control_number"))): x for x in every}
for key in sorted(reviewed):
    x = by_key.get(key)
    bare = copy.deepcopy(x)
    bare["score"].pop("gaps", None)
    bare["score"].pop("confidence", None)
    check(NG.units_within_printed_range(bare) is not None, "%s %s: the kind is true of its filed figures" % key)
    check(NG.answer(bare) is None, "%s %s: no record rule names another kind for it" % key)
check(B7.WITHIN_HELD[("Shasta College", "32162")][0] is None and "own" in B7.SHASTA_32162
      and NG.units_within_printed_range(by_key[("Shasta College", "32162")]) is not None
      and not by_key[("Shasta College", "32162")]["score"].get("gaps"),
      "Shasta 32162: the figures name it, the own-page guard holds it, and its record carries no gap")
check(all(len(v) == 2 and v[1] for v in B7.WITHIN_HELD.values()), "every held answer says where it is written")

print("%d checks, %d failures" % (n, len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
