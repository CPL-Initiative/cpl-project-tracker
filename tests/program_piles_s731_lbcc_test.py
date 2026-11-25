#!/usr/bin/env python3
"""S731, lane 2's cheap piles at Long Beach City: the census's 16 wording-rule records, 3 passed and 9 collected with named gaps (kb/_program_piles_s731_lbcc.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): never drop a record for failing; collect it with
its gaps noted and confidence scores, a gap noted instead of a reread. Pinned here:

  * each kind the plan files carries a sentence and a unit-arithmetic score in kb/_program_named_gaps.py (no new kind);
  * precision 16 of 16 against the hand reading of the census members pinned in the fixture
    (p-test-pins-census-members-s714): 3 passed, 9 collected, 4 held;
  * the rescore: each of the three passes under its one reading (short_high, meets), and with that reading off today's
    scorer gives the filed arithmetic ("against" aside);
  * each named gap's own reading closes the record at the printed total under today's scorer, and every boundary
    reading names no gap;
  * on_live_run: the loads that inserted the rows held two and three runs; the rows are on their live run through each
    record file's commit history (FILE_HISTORY), and with that history gone every row holds;
  * the holds: 42970 (no_units_printed stays off and no_units_read refuses it, d-lbcc-42970-no-units-read-or-hold-s731),
    43021 on the own-page guard (its page is 02677's), 37213 (another award's page), 44848 (cut off, no
    total);
  * the plan: 12 rows named exactly by the receipt and the four SQL files, the confirm guard, a second run plans none;
    the load's image of each committed record is its receipt's after-image;
  * every row is on its live run both as the receipts stood before this plan's own apply (posted_runs(skip=...)) and
    after it, so the test holds before and after the conductor's apply (p-test-reads-own-apply-receipt-s721).

Run from repo root: python3 tests/program_piles_s731_lbcc_test.py
"""
import copy
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CENSUS_AT_PLAN = os.path.join(ROOT, "tests", "fixtures", "harvest_gap_census_s731_lbcc.json")
RECEIPT = os.path.join(ROOT, "kb", "receipts", "program_requirement_records_piles_s731_lbcc_2026-11-25_s731c.json")
MIG = os.path.join(ROOT, "kb", "migrations", "2026-11-25_s731c_prreq_piles_%s.sql")
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s731_lbcc as W  # noqa: E402

COLLEGE = "Long Beach City College"
PASSED = {"02678": "short_high", "20940": "short_high", "30650": "meets"}
GAPS = {"02618": "option_lists_read_apart", "02683": "prerequisites_counted", "20937": "prerequisites_counted",
        "08834": "unit_line_not_read", "32634": "repeat_read_once", "41220": "lists_past_their_figure",
        "33390": "noted_figures_differ", "33302": "lists_not_closed",
        "35803": "lists_not_closed"}
ROWS = dict(GAPS, **{cn: W.PASSES for cn in PASSED})
HELD = {"42970", "43021", "37213", "44848"}
SCORES = {"option_lists_read_apart": 40, "prerequisites_counted": 70, "unit_line_not_read": 40,
          "repeat_read_once": 60, "lists_past_their_figure": 60, "noted_figures_differ": 40, "lists_not_closed": 30}
checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


for g, score in SCORES.items():
    check(g in NG.GAPS and NG.ARITH_SCORE.get(g) == score, "%s has its sentence and score" % g)
check(set(GAPS.values()) == set(SCORES), "every kind filed is pinned")

members = W.census_members(CENSUS_AT_PLAN)
check(set(members) == set(ROWS) | HELD and len(members) == 16 and not set(W.PERSON) & set(members),
      "the fixture gives the 16 keys")
pr = W.precision(CENSUS_AT_PLAN)
check(pr["read"] == 16 and pr["right"] == 16 and not pr["wrong"], "precision 16 of 16: %s" % pr["wrong"])
cc = W.claim_checks(CENSUS_AT_PLAN)
check(cc["counts"] == {"stands": 12} and not cc["not_standing"], "12 claims stand: %s" % cc)
bd = W.boundaries(CENSUS_AT_PLAN)
check(not bd["wrong"] and sum(bd["counts"].values()) == 3 * 3 + 8 + 9 * 2 + 8, "every boundary reading names no "
      "gap: %s" % bd)

# The rescore: one reading moves each, and with it off today's scorer gives the filed arithmetic.
with open(RECEIPT, encoding="utf-8") as fh:
    rec = json.load(fh)
before = {r["control_number"]: r for r in rec["records"]}
for cn, reading in PASSED.items():
    f = W._load(cn)
    now = W.arithmetic(f)
    check(now.get(reading) is True and now.get("status") == "equal", "%s passes as %s" % (cn, reading))
    check(W.arithmetic(f, reading).get("status") == "unequal", "%s: with %s off today's scorer fails it" % (cn, reading))
    check(W.passing_score(f) is not None and W.PASSED[cn]["reading"] == reading, "%s: its entry stands" % cn)
    check(before[cn]["after_image"]["checks"]["arithmetic"] == "equal"
          and before[cn]["before_image"]["checks"]["arithmetic"] == "unequal", "%s: the image moves to equal" % cn)

# Each gap's own reading closes the record, and the record rule names 41220's kind on today's arithmetic.
for cn, g in GAPS.items():
    f = W._load(cn)
    check(W.kind_closes(f, W.REVIEWED[cn]), "%s: its reading closes it" % cn)
    check(not W.scorer_passes(f), "%s: today's scorer does not pass it" % cn)
check(W._rule(W._load("41220"), W.arithmetic(W._load("41220")))[0] == "lists_past_their_figure",
      "41220: the record rule names lists_past_their_figure")
check(all(W._rule(W._load(cn), W.arithmetic(W._load(cn))) is None for cn in GAPS if cn != "41220"),
      "no record rule names another row")
check(not set(W.REVIEWED["02683"]["outside"]) & {W.S.norm_code(c.get("code")) for c in
                                                   W.C.closed_list(COLLEGE, "02683")},
      "02683: the state's list holds none of the prerequisites")

# on_live_run: two- and three-run loads; the file history proves each row's run, and without it every row holds.
check(all(W.on_live_run(W._load(cn)) for cn in ROWS), "every row is on its live run")
saved = W.FILE_HISTORY
W.FILE_HISTORY, W._POSTED = {}, None
check(not any(W.on_live_run(W._load(cn), skip=(W.TAG,)) for cn in ROWS),
      "without the file history no row is on a proved run (the receipts as they stood before this plan's apply)")
W.FILE_HISTORY, W._POSTED = saved, None
saved_keep = W.KEEPS_RUN
W.KEEPS_RUN, W._POSTED = {}, None
check(not W.on_live_run(W._load("33390"), skip=(W.TAG,)) and W.on_live_run(W._load("02618"), skip=(W.TAG,)),
      "33390: S529's commit after its load counts only as a commit that keeps the run")
W.KEEPS_RUN, W._POSTED = saved_keep, None

# The holds. 42970: no_units_printed stays off, and no_units_read's own check refuses the row as filed and as today's
# scorer adds it (the state's list gives BCOM 15 its 3 units).
f42970 = W._load("42970")
check(NG.NO_UNITS_PRINTED_ON is False and "42970" not in W.REVIEWED, "42970: no_units_printed stays off, no entry")
check(NG.no_units_read(f42970) is None and NG.no_units_read(dict(f42970, score=dict(
    f42970["score"], arithmetic=W.arithmetic(f42970)))) is None, "42970: no_units_read refuses it")
check(W.shared_with("43021") == ["02677"] and W.scorer_passes(W._load("43021")), "43021: today's scorer passes it, "
      "and its page is 02677's")
check(any("not the CSU GE-Breadth certificate" in n for n in W._notes(W._load("37213"))), "37213: its note says the "
      "page is another award's")
check(W._load("44848")["score"]["arithmetic"]["status"] == "incomplete"
      and any("cut off partway through the Area 4 list" in n for n in W._notes(W._load("44848"))),
      "44848: cut off, its arithmetic incomplete")

got = {r["control_number"]: r["moves_to"] for r in rec["records"]}
check(got == ROWS and rec["moved"] == 12, "the receipt names the 12 rows and their kinds")
check({h["control_number"] for h in rec["held"]} == HELD, "the receipt holds the 4")
check(rec["census"]["members"] == members, "the receipt's keys are the fixture's")
check(rec["shared_pages"] == {}, "no planned row was read from a page another program was")
for r in rec["records"]:
    if r["moves_to"] in SCORES:
        check(r["confidence"]["unit_arithmetic"] == SCORES[r["moves_to"]], "%s: its arithmetic score is its kind's"
              % r["control_number"])
for part in ("apply", "preread", "preread_md5", "rollback"):
    with open(MIG % part, encoding="utf-8") as fh:
        sql = fh.read()
    check(all("'%s'" % cn in sql for cn in ROWS) and not any("'%s'" % cn in sql for cn in HELD | set(W.PERSON)),
          "%s names exactly the 12" % part)
    if part == "apply":
        check("confirm guard" in sql and "e(expect) as (values (12))" in sql, "the apply guards a confirm")
check(W.plan(write=False, census_path=CENSUS_AT_PLAN)["rows"] == [], "a second run plans none")
images = NG._load_images({COLLEGE})
for r in rec["records"]:
    img = images[(COLLEGE, r["control_number"])]
    want = [] if r["moves_to"] == W.PASSES else [r["moves_to"]]
    check(img["checks"] == r["after_image"]["checks"], "%s: the load posts the receipt's after-image" % r["control_number"])
    check((img["checks"].get("gaps") or []) == want, "%s: the image carries its gap, or none" % r["control_number"])
    check(img["record"] == r["before_image"]["record"], "%s: the record is unchanged" % r["control_number"])

check(all(W.on_live_run(W._load(cn), skip=(W.TAG,)) for cn in ROWS), "every row is on its live run before the apply")
check(W.precision(CENSUS_AT_PLAN, skip=(W.TAG,))["right"] == 16, "precision holds on the receipts before the apply")

why = {h["control_number"]: h["why"] for h in rec["held"]}
check("02677" in why.get("43021", ""), "43021 holds on the own-page guard")
check("S681" in why.get("42970", "") and NG.HOLD_NO_UNITS_PRINTED in why.get("42970", ""), "42970 holds on S681's reason")
check("page search" in why.get("37213", ""), "37213 holds for its page")
check("45290" in why.get("44848", ""), "44848 holds as El Camino 45290 did")

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
