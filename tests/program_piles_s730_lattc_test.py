#!/usr/bin/env python3
"""S730, lane 2's cheap piles at Los Angeles Trade-Technical: the census's 17 wording-rule records, 6 collected with their gaps named (kb/_program_piles_s730_lattc.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): never drop a record for failing; collect it with
its gaps noted and confidence scores, a gap noted instead of a reread. Pinned here:

  * each kind the plan files carries a sentence and a unit-arithmetic score in kb/_program_named_gaps.py (no new kind);
  * precision 17 of 17 against the hand reading of the census members pinned in the fixture
    (p-test-pins-census-members-s714): 6 collected, 11 held;
  * the own-page guard keys on the pages the records were read from (sources.json, each record's source_url), never
    capture.json's shared_pages (p-own-page-guard-reads-read-pages-s727): 37706 holds on it, and each shared row
    holds once its own-section words are gone;
  * the lever holds (p-gap-filing-leaves-census-lever-s721): 18857 passes under the pooled reading once it reads 'with
    a minimum of 3 units from each', 38737 under a fill from its own table row; today's scorer passes neither, and the
    five coverage holds pass today's arithmetic, so none is gap-filed;
  * the claim check holds a record whose capture holds the page its note says the read lacked, and every boundary
    reading names no gap;
  * the plan: 6 rows named exactly by the receipt and the four SQL files, the confirm guard, a second run plans none;
    the load's image of each committed record is its receipt's after-image, carrying its one gap;
  * every row is on its live run both as the receipts stood before this plan's own apply (posted_runs(skip=...)) and
    after it, so the test holds before and after the conductor's apply (p-test-reads-own-apply-receipt-s721).

Run from repo root: python3 tests/program_piles_s730_lattc_test.py
"""
import copy
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CENSUS_AT_PLAN = os.path.join(ROOT, "tests", "fixtures", "harvest_gap_census_s730_lattc.json")
RECEIPT = os.path.join(ROOT, "kb", "receipts", "program_requirement_records_piles_s730_lattc_2026-11-25_s730a.json")
MIG = os.path.join(ROOT, "kb", "migrations", "2026-11-25_s730a_prreq_piles_%s.sql")
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s730_lattc as W  # noqa: E402

COLLEGE = "Los Angeles Trade Technical College"
ROWS = {"08479": "noted_figures_differ", "21849": "noted_figures_differ", "44344": "noted_figures_differ",
        "02925": "noted_section_cut_off", "21867": "noted_section_cut_off", "08482": "lists_not_closed"}
ALIAS = {"02911", "21855", "31090", "31280", "41150"}
HELD = ALIAS | {"31089", "41011", "45285", "18857", "38737", "37706"}
SHARED = {"02925", "08479", "21849", "44344"}
SCORES = {"noted_figures_differ": 40, "noted_section_cut_off": 20, "lists_not_closed": 30}
checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


for g, score in SCORES.items():
    check(g in NG.GAPS and NG.ARITH_SCORE.get(g) == score, "%s has its sentence and score" % g)
check(set(ROWS.values()) == set(SCORES), "every kind filed is pinned")

members = W.census_members(CENSUS_AT_PLAN)
check(set(members) == set(ROWS) | HELD and len(members) == 17 and not set(W.PERSON) & set(members),
      "the fixture gives the 17 keys")
pr = W.precision(CENSUS_AT_PLAN)
check(pr["read"] == 17 and pr["right"] == 17 and not pr["wrong"], "precision 17 of 17: %s" % pr["wrong"])
cc = W.claim_checks(CENSUS_AT_PLAN)
check(cc["counts"] == {"stands": 6} and not cc["not_standing"], "6 claims stand")
bd = W.boundaries(CENSUS_AT_PLAN)
check(not bd["wrong"] and sum(bd["counts"].values()) == 6 * 3 + 4 + 1 + 2 + 2, "every boundary reading names no "
      "gap: %s" % bd)

# The own-page guard reads the pages the records were read from.
check({cn for cn in ROWS if W.shared_with(cn)} == SHARED, "four rows were read from a page another program was")
check(set(W.shared_with("08479")) >= {"21849", "02909"} and W.shared_with("21867") == [],
      "the read pages: 08479 with 21849 and the Carpentry A.S. on p.132; 21867 alone on p.183")
src = W._sources()
for cn in SHARED:
    g = copy.deepcopy(W._load(cn))
    g["record"]["notes"] = [n.replace(W.REVIEWED[cn]["own_section"], "") for n in g["record"]["notes"]]
    check(W.claim(g, src) != "stands", "%s: without its own-section words the shared page holds it" % cn)
# 37706, read as noted_figures_differ: the guard holds it (p.200 with Pre-Health Professions I, 38452).
check(W.shared_with("37706") == ["38452"], "37706 shares p.200 with 38452")
saved = W.REVIEWED
W.REVIEWED = dict(saved, **{"37706": {"gap": "noted_figures_differ", "computed": [16, 17], "stated": [18, 19],
                                       "words": "The printed major total (18-19 units) does not match the listed "
                                                "courses"}})
f37706 = W._load("37706")
check(W.gap_noted(f37706) is not None and W.claim(f37706, src) == "the page is shared and no note names the "
      "record's own section", "37706: the entry would stand, and the own-page guard holds it")
W.REVIEWED = saved
check("37706" not in W.REVIEWED and W.gap_noted(f37706) is None, "37706 takes no gap")

# The lever holds and the coverage holds.
for cn in W.ON_LEVER:
    lv = W.lever_passes(cn)
    check(lv["today"] != "equal" and lv["lever"] == "equal" and lv["words"]
          and lv["computed"] == W.ON_LEVER[cn]["passes_at"], "%s: its lever passes it, today's scorer does not: %s"
          % (cn, lv))
    check(cn not in W.REVIEWED, "%s takes no gap" % cn)
check(W.S.POOL_WORDS.search("with a minimum of 3 units from each") is None, "the pooled words are main's again")
for cn in ALIAS:
    f = W._load(cn)
    # Either state (p-test-asserts-other-pr-absent-recurs-s731): as S730 left it, coverage failing; or passed by
    # S739's rename (kb/_program_piles_s739_lattc.py, plan s739e), the filed score naming its renames.
    renamed = bool(f["score"].get("course_renumbers")) and W.S.passes_live(f["score"])
    check(W.scorer_passes(f) and (not NG.collectable(f["score"]) or renamed) and cn not in W.REVIEWED,
          "%s: today's scorer passes its arithmetic, and its coverage fails or S739's rename passes it" % cn)
for cn in ("31089", "41011", "45285"):
    check(not NG.collectable(W._load(cn)["score"]) and cn not in W.REVIEWED, "%s: coverage or invented fails" % cn)

# The kinds' own checks, read on the record as the page prints it (the reader's notes).
check(W.list_open(W._load("08482"), W.REVIEWED["08482"]), "08482: the elective list prints no figure, and the "
      "required list adds to the printed 24")
for cn in ("02925", "21867"):
    check(W.cut_short(W._load(cn)), "%s: the record adds short of its stated total, or states none" % cn)

with open(RECEIPT, encoding="utf-8") as fh:
    rec = json.load(fh)
got = {r["control_number"]: r["moves_to"] for r in rec["records"]}
check(got == ROWS and rec["moved"] == 6, "the receipt names the 6 rows and their gaps")
check({h["control_number"] for h in rec["held"]} == HELD, "the receipt holds the 11")
check(rec["census"]["members"] == members, "the receipt's keys are the fixture's")
check(set(rec["shared_pages"]) == SHARED, "the receipt lists the four shared pages")
for r in rec["records"]:
    check(r["confidence"]["unit_arithmetic"] == SCORES[r["moves_to"]], "%s: its arithmetic score is its kind's"
          % r["control_number"])
    if r["moves_to"] == "noted_section_cut_off":
        check(r["confidence"]["course_list_match"] <= NG.MAY_CONTINUE_CAP, "%s: a cut-off caps the course list"
              % r["control_number"])
for part in ("apply", "preread", "preread_md5", "rollback"):
    with open(MIG % part, encoding="utf-8") as fh:
        sql = fh.read()
    check(all("'%s'" % cn in sql for cn in ROWS) and not any("'%s'" % cn in sql for cn in HELD | set(W.PERSON)),
          "%s names exactly the 6" % part)
    if part == "apply":
        check("confirm guard" in sql and "e(expect) as (values (6))" in sql, "the apply guards a confirm")
check(W.plan(write=False, census_path=CENSUS_AT_PLAN)["rows"] == [], "a second run plans none")
images = NG._load_images({COLLEGE})
for r in rec["records"]:
    img = images[(COLLEGE, r["control_number"])]
    check(img["checks"] == r["after_image"]["checks"], "%s: the load posts the receipt's after-image" % r["control_number"])
    check(img["checks"].get("gaps") == [r["moves_to"]], "%s: the image carries its one gap" % r["control_number"])
    check(img["record"] == r["before_image"]["record"], "%s: the record is unchanged" % r["control_number"])

check(not any(W.scorer_passes(W._load(cn)) for cn in ROWS), "the scorer passes none of the rows (#3753's MAJOR)")
check(all(W.on_live_run(W._load(cn), skip=(W.TAG,)) for cn in ROWS), "every row is on its live run before the apply")
check(all(W.on_live_run(W._load(cn)) for cn in ROWS), "every row is on its live run")
check(W.precision(CENSUS_AT_PLAN, skip=(W.TAG,))["right"] == 17, "precision holds on the receipts before the apply")

why = {h["control_number"]: h["why"] for h in rec["held"]}
check("38452" in why.get("37706", ""), "37706 holds on the own-page guard")
check("pooled reading" in why.get("18857", "") and "18 = 18" in why.get("18857", ""), "18857 holds on the pooled "
      "reading")
check("T038737D" in why.get("38737", "") and "11 = 11" in why.get("38737", ""), "38737 holds on its table row")
check(all("scorer_passes" in why.get(cn, "") for cn in ALIAS), "the five coverage holds name scorer_passes")

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
