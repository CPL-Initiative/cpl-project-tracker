#!/usr/bin/env python3
"""S727 plan s727f: the records held for a person, collected with each gap named (kb/_program_piles_s727_persons.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): never drop a record for failing; collect it with
its gaps noted and confidence scores. COBIx's brief of 2026-11-25: a record held for a person is collected with its gap
named and a lower confidence. Pinned here, with the nineteen keys written out below (never read from a live census):

  * the new kind entry_path_range carries a sentence, a unit-arithmetic score of 50 and the GE cap of 50, and the
    round-0 kind upper_division_only is gone (45499 takes unit_line_not_read: 60 + 90 + 30 is the printed 180);
  * precision 19 of 19 against the hand reading: 5 UPDATE rows, 6 named gaps with no record, 1 already collected,
    7 held (03281 and 44488 fail coverage or invented; 36326 the own-page guard; 39539 and 33013 their earlier
    reasons; 32832 a failing live row with no record file; 44984 an unequal live row, a reload);
  * Ventura 45355's live row was deleted by S456's older_build_removed plan, so its named gap stands;
  * each gap's words are its record's own note's, and every boundary reading names no gap;
  * the plan's 7 rows are exactly the receipt's and the four SQL files', a second run plans none, and the load's image
    of each committed record is its receipt's after-image with the record unchanged;
  * on_live_run reads the receipts as they stood before this plan's own apply (skip s727f), so the test holds after it.

Run from repo root: python3 tests/program_piles_s727_persons_test.py
"""
import copy
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RECEIPT = os.path.join(ROOT, "kb", "receipts", "program_requirement_records_piles_s727_persons_2026-11-25_s727f.json")
MIG = os.path.join(ROOT, "kb", "migrations", "2026-11-25_s727f_prreq_piles_%s.sql")
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s727_persons as W  # noqa: E402

ROWS = {("De Anza College", "45499"): "unit_line_not_read", ("Santa Monica College", "10345"): "noted_no_total",
        ("Santa Monica College", "43765"): "lists_not_closed", ("Clovis Community College", "33501"): "lists_not_closed",
        ("Contra Costa College", "01417"): "entry_path_range"}
NAMED = {("West Los Angeles College", "46261"), ("Napa Valley College", "19126"), ("Napa Valley College", "31158"),
         ("Napa Valley College", "36528"), ("Los Angeles Harbor College", "44947"), ("Ventura College", "45355")}
ALREADY = {("West Los Angeles College", "38677")}
HELD = {("Santa Monica College", "03281"), ("Glendale Community College", "44488"),
        ("Clovis Community College", "36326"), ("Clovis Community College", "39539"),
        ("East Los Angeles College", "33013"), ("Los Angeles City College", "32832"), ("Cerritos College", "44984")}
CONF = {"45499": {"unit_arithmetic": 40, "course_list_match": 100, "ge_pattern": 50, "catalog_year": 100,
                  "source": 100},
        "01417": {"unit_arithmetic": 50, "course_list_match": 100, "ge_pattern": 50, "catalog_year": 100,
                  "source": 100}}
checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


def statements(sql):
    return sum(1 for ln in sql.splitlines() if ln.rstrip().endswith(";") and not ln.lstrip().startswith("--"))


check("entry_path_range" in NG.GAPS and NG.ARITH_SCORE.get("entry_path_range") == 50
      and "entry_path_range" in NG.GE_NOT_PRINTED and "entry_path_range" not in NG.OTHER_PAGE_GAPS,
      "entry_path_range: sentence, 50 and the GE cap")
check("upper_division_only" not in NG.GAPS and NG.ARITH_SCORE.get("unit_line_not_read") == 40,
      "upper_division_only is gone; unit_line_not_read scores 40")
check(set(r for e in W.NAMED.values() for r in [e["reason"]]) == {"no_own_page_found"}, "every named gap: no_own_page")
f = W._load("Clovis Community College", "33501")
check("MATH 17 is printed both" in W.gap_noted(f)[1], "33501's gap names its MATH 17 note")
check(W.named_stands("Ventura College", "45355") == "stands" and W.posted_runs("Ventura College").get("45355"),
      "45355: a posted row S456 deleted reads as none")
check(set(W.KEYS) == set(ROWS) | NAMED | ALREADY | HELD and len(W.KEYS) == 19, "the nineteen keys")
check(set(W.COLLEGES) == {c for c, _ in W.KEYS} and len(W.COLLEGES) == 12, "the twelve colleges")
pr = W.precision()
check(pr["read"] == 19 and pr["right"] == 19 and not pr["wrong"], "precision 19 of 19: %s" % pr["wrong"])
bd = W.boundaries()
check(not bd["wrong"] and sum(bd["counts"].values()) >= 6 * 4 + 6, "every boundary reading names no gap: %s" % bd)
for key, e in W.REVIEWED.items():
    check(any(e["words"] in n for n in W._notes(W._load(*key))), "%s %s: the words are its own note's" % key)
for key in HELD:
    f = W._load(*key)
    check(f is None or W.outcome(f)[0] == "none", "%s %s holds" % key)
check(W.claim(W._load("Clovis Community College", "36326")) ==
      "the page is shared and no note names the record's own section", "36326 holds on the own-page guard")
check(W.shared_with("Santa Monica College", "10345") == ["03281"]
      and W.claim(W._load("Santa Monica College", "10345")) == "stands", "10345: shared, and its own section named")
for key in NAMED:
    check(W.named_stands(*key) == "stands", "%s %s: the named gap stands" % key)
    check(not os.path.isfile(W._path(*key)), "%s %s: no record file in records/" % key)

# Read as the receipts stood before this plan's own apply.
for key in ROWS:
    f = W._load(*key)
    check(W.on_live_run(f, skip=("s727f",)), "%s %s is on its live run before the apply" % key)
    check(not W.scorer_passes(f), "%s %s: the scorer does not pass it" % key)

with open(RECEIPT, encoding="utf-8") as fh:
    rec = json.load(fh)
got = {(r["college"], r["control_number"]): r["moves_to"] for r in rec["records"]}
check(got == ROWS and rec["moved"] == 5 and rec["updates"] == 5 and rec["inserts"] == 0, "the receipt's 5 rows")
for part in ("apply", "preread", "preread_md5", "rollback"):
    with open(MIG % part, encoding="utf-8") as fh:
        sql = fh.read()
    check(all("'%s'" % cn in sql for _, cn in ROWS)
          and not any("'%s'" % cn in sql for _, cn in NAMED | ALREADY | HELD), "%s names exactly the 5" % part)
    check(statements(sql) == 1, "%s is one statement" % part)
    if part == "apply":
        check("confirm guard" in sql and "e(expect) as (values (5))" in sql, "the apply guards a confirm, expects 5")
check(W.plan(write=False)["rows"] == [], "a second run plans none")
images = NG._load_images(set(c for c, _ in ROWS))
for r in rec["records"]:
    key = (r["college"], r["control_number"])
    img = images[key]
    check((img["checks"].get("gaps") or []) == [r["moves_to"]], "%s %s: the image carries its gap" % key)
    check(img["checks"] == r["after_image"]["checks"], "%s %s: the load posts the after-image" % key)
    check(img["record"] == r["before_image"]["record"], "%s %s: the record is unchanged" % key)
    if r["control_number"] in CONF:
        check(r["confidence"] == CONF[r["control_number"]], "%s %s confidence: %s" % (key + (r["confidence"],)))
check(not os.path.exists(os.path.join(NG.COLLEGE_DIR, "los_angeles_city", "named_gaps_s727.json")), "32832 held")
for slug in ("west_los_angeles", "napa_valley", "los_angeles_harbor", "ventura"):
    with open(os.path.join(NG.COLLEGE_DIR, slug, "named_gaps_s727.json"), encoding="utf-8") as fh:
        d = json.load(fh)
    check(all(p["reason"] in d["reasons"] for p in d["programs"]) and d["programs"], "%s: named reasons" % slug)
    check(all((d["college"], p["control_number"]) in NAMED for p in d["programs"]), "%s: only named keys" % slug)

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
