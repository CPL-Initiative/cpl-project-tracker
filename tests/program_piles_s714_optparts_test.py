#!/usr/bin/env python3
"""S714 follow-up: the ten records at other colleges option_parts moves to passing (kb/_program_piles_s714_optparts.py).

WHY. #3714 taught the scorer to read one option the reading split over several blocks; its reach, measured against
each record's own state list, moved ten verdicts elsewhere from their live verdict to passing. Pinned here:

  * the ten, each with the hand reading of its notes, and the five whose arithmetic alone moves (no row);
  * each committed score is main's own with option_parts on, and with it off the arithmetic reads as the row held it
    (Foothill 06047's filed arithmetic is an older scorer's: main reads it equal both ways, exactly 40-48 with it on);
  * the claim checks: the notes stand on all ten; today's capture finds every listed course of the option's blocks
    on nine, and 31 of 33 on Santa Barbara City 05934 (ENVS 112 and ENVS 115 not found);
  * precision 15 of 15, 30 boundary readings with none wrong, the reach's 21 answers right and none from passing;
  * the plan: 9 rows (05934 held on its capture claim) named exactly by the receipt and the four SQL files, the confirm guard, a second run plans none;
  * the load's image of each committed record is its receipt's after-image (the rows applied by migrate 45188487600).

Run from repo root: python3 tests/program_piles_s714_optparts_test.py
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RECEIPT = os.path.join(ROOT, "kb", "receipts", "program_requirement_records_piles_optparts_2026-11-23_s714o.json")
MIG = os.path.join(ROOT, "kb", "migrations", "2026-11-23_s714o_prreq_piles_%s.sql")
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s714_ccsf as C  # noqa: E402
import _program_piles_s714_optparts as O  # noqa: E402
import _program_requirements_score as S  # noqa: E402

checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


TEN = {("Foothill College", "06047"), ("Glendale Community College", "24042"), ("Golden West College", "18423"),
       ("MiraCosta College", "18345"), ("Monterey Peninsula College", "03653"), ("Monterey Peninsula College", "22098"),
       ("Reedley College", "01773"), ("Reedley College", "18990"), ("Reedley College", "46449"),
       ("Santa Barbara City College", "05934")}
FIVE = {("Foothill College", "36328"), ("Napa Valley College", "36251"), ("Evergreen Valley College", "45025"),
        ("Santa Monica College", "03272"), ("Solano Community College", "20981")}
SBCC = ("Santa Barbara City College", "05934")
NINE = TEN - {SBCC}
check(set(O.HAND_HELD) == TEN and all(O.HAND_HELD[k].startswith("passes") for k in NINE)
      and O.HAND_HELD[SBCC].startswith("held"), "the ten: nine pass, 05934 held on its capture claim")
check(set(O.ARITH_ONLY) == FIVE, "the five whose arithmetic alone moves")

with open(RECEIPT, encoding="utf-8") as fh:
    receipt = json.load(fh)
rows = receipt["records"]
keys = {(r["college"], r["control_number"]) for r in rows}
check(keys == NINE and len(rows) == 9, "9 rows, the nine: %r" % sorted(keys))

every = C.every_record()
targets = O.every_target(every)
for r in rows:
    key = (r["college"], r["control_number"])
    f = targets[key]
    before, after = C.arithmetic(f)
    check(after == f["score"]["arithmetic"] and after["status"] == "equal" and after["computed"] == after["stated"],
          "%s %s: the committed arithmetic is main's, exactly the printed total" % key)
    if key == ("Foothill College", "06047"):
        check(before["status"] == "equal" and before["computed"] == [4.0, 36.0]
              and r["before_image"]["checks"]["arithmetic"] == "unequal",
              "06047: main reads it equal with the reading off (4-36); its row held unequal")
    else:
        check(before["status"] == r["before_image"]["checks"]["arithmetic"] == "unequal",
              "%s %s: with the reading off, the arithmetic reads as the row held it" % key)
    check(r["after_image"]["checks"]["arithmetic"] == "equal" and r["after_image"]["checks"]["coverage"] is True
          and r["after_image"]["checks"]["invented"] is True, "%s %s: the row passes after" % key)
    check(r["after_image"]["checks"] != r["before_image"]["checks"], "%s %s: the row's checks move" % key)
# The applied rows stand (#3719): the load's image of each committed record is the receipt's after-image, so the next
# load of the college posts what the apply wrote. A change to load_rows, the scorer or a record file fails here.
images = NG._load_images({r["college"] for r in rows})
for r in rows:
    key = (r["college"], r["control_number"])
    img = images.get(key)
    check(img is not None and img["checks"] == r["after_image"]["checks"] and img["record"] == r["before_image"]["record"]
          and str(img["extracted_run"]) == str(r["extracted_run"]),
          "%s %s: the load's image of the committed record is the receipt's after-image" % key)

# ── the self-recall ──
pr = O.precision(targets, {(r["college"], r["control_number"]): O.row_passes(r["before_image"]["checks"])
                           for r in rows})
check(pr["read"] == 15 and pr["right"] == 15 and not pr["wrong"], "precision: %r" % pr)
cc = O.claim_checks(targets)
check(cc["notes"] == {"stands": 10} and cc["capture"] == {"stands": 9, "partial": 1} and not cc["not_standing"],
      "the claim checks: %r" % cc)
check(cc.get("partial") == [["Santa Barbara City College", "05934", 31, 33, ["ENVS112", "ENVS115"]]],
      "05934: today's capture finds 31 of the option's 33 listed courses")
check(O.notes_claim({"record": {"notes": ["It is recorded as a separate option."]}}) == "against",
      "a note saying the block is a separate option reads against")
check(O.notes_claim({"record": {"notes": ["It belongs only to Option 3, not a fourth option."]}}) == "stands",
      "'not a fourth option' is no claim against")
check(O.notes_claim({"record": {"notes": ["Units are not printed."]}}) == "silent", "a note on another matter is silent")
bd = O.boundaries(targets)
check(sum(bd["counts"].values()) == 30 and not bd["wrong"], "30 boundary readings, none wrong: %r" % bd)
reach = C.option_parts_reach(every)
check(reach["fires"] == 21 and reach["right"] == 21 and not reach["from_passing"], "the reach: %r" % reach)
check(receipt["precision"]["right"] == 15 and receipt["boundaries"]["wrong"] == [] and receipt["claim_checks"] == cc,
      "the receipt's self-recall matches")

# ── the plan ──
check(sorted((h["college"], h["control_number"]) for h in receipt["held"]) == sorted(FIVE | {SBCC}),
      "the five and 05934 take no row and are listed as held")
why = [h["why"] for h in receipt["held"] if (h["college"], h["control_number"]) == SBCC]
check(why and "31 of the option's 33" in why[0] and "ENVS112, ENVS115" in why[0],
      "05934's hold names its capture finding: %r" % why)
check(not O.plan(write=False, every=every)["rows"] and SBCC not in keys, "05934 stays out on a second run")
for part in ("apply", "preread", "preread_md5", "rollback"):
    with open(MIG % part, encoding="utf-8") as fh:
        text = fh.read()
    sql_keys = set(re.findall(r"^\s*\(\d+, '([^']+)', '(\d{5})', \d+,", text, re.M))
    check(sql_keys == keys, "the %s names exactly the plan's rows (%d of %d)" % (part, len(sql_keys), len(keys)))
    if part == "apply":
        check("when f.n > 0" in text and "program_record_fp(r.record)" in text and "from s, c, e, f;" in text
              and "e(expect) as (values (9))" in text, "the apply expects 9 rows and carries the confirm guard")
    if part.startswith("preread"):
        check("'confirm_matches'" in text, "the %s counts matching confirm verdicts" % part)
    if part == "preread_md5":
        check(len(re.findall(r"'[0-9a-f]{32}'", text)) == 27, "the md5 pre-read carries three hashes a row")
check(not O.plan(write=False, every=every)["rows"], "a second run plans no row")

if failures:
    for m in failures:
        print("FAIL:", m)
    sys.exit(1)
print("%d/%d checks passed: S714 option_parts follow-up (ten records elsewhere, the plan)" % (checks[0], checks[0]))
