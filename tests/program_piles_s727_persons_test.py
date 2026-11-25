#!/usr/bin/env python3
"""S727 plan s727f: the records held for a person, collected with each gap named (kb/_program_piles_s727_persons.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): never drop a record for failing; collect it with
its gaps noted and confidence scores. COBIx's brief of 2026-11-25: a record held for a person is collected with its gap
named and a lower confidence. Pinned here, with the nineteen keys written out below (never read from a live census):

  * the two new kinds (upper_division_only, entry_path_range) carry a sentence and a unit-arithmetic score of 50;
  * precision 19 of 19 against the hand reading: 7 UPDATE rows, 7 named gaps with no record, 2 already collected,
    3 held (03281 and 44488 fail coverage or invented, so no gap collects them; 36326 holds on the own-page guard);
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

ROWS = {("De Anza College", "45499"): "upper_division_only", ("Santa Monica College", "10345"): "noted_no_total",
        ("Santa Monica College", "43765"): "lists_not_closed", ("Clovis Community College", "33501"): "lists_not_closed",
        ("Clovis Community College", "39539"): "noted_section_cut_off",
        ("East Los Angeles College", "33013"): "pool_figure_not_read",
        ("Contra Costa College", "01417"): "entry_path_range"}
NAMED = {("West Los Angeles College", "46261"), ("Napa Valley College", "19126"), ("Napa Valley College", "31158"),
         ("Napa Valley College", "36528"), ("Los Angeles Harbor College", "44947"), ("Ventura College", "45355"),
         ("Los Angeles City College", "32832")}
ALREADY = {("Cerritos College", "44984"), ("West Los Angeles College", "38677")}
HELD = {("Santa Monica College", "03281"), ("Glendale Community College", "44488"),
        ("Clovis Community College", "36326")}
CONF = {"45499": {"unit_arithmetic": 50, "course_list_match": 100, "ge_pattern": 50, "catalog_year": 100,
                  "source": 100},
        "39539": {"unit_arithmetic": 20, "course_list_match": 50, "ge_pattern": None, "catalog_year": 100,
                  "source": 80}}
checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


def statements(sql):
    return sum(1 for ln in sql.splitlines() if ln.rstrip().endswith(";") and not ln.lstrip().startswith("--"))


for g in ("upper_division_only", "entry_path_range"):
    check(g in NG.GAPS and NG.ARITH_SCORE.get(g) == 50 and g not in NG.OTHER_PAGE_GAPS, "%s: sentence and 50" % g)
check(set(W.KEYS) == set(ROWS) | NAMED | ALREADY | HELD and len(W.KEYS) == 19, "the nineteen keys")
check(set(W.COLLEGES) == {c for c, _ in W.KEYS} and len(W.COLLEGES) == 12, "the twelve colleges")
pr = W.precision()
check(pr["read"] == 19 and pr["right"] == 19 and not pr["wrong"], "precision 19 of 19: %s" % pr["wrong"])
bd = W.boundaries()
check(not bd["wrong"] and sum(bd["counts"].values()) >= 8 * 4 + 6, "every boundary reading names no gap: %s" % bd)
for key, e in W.REVIEWED.items():
    check(any(e["words"] in n for n in W._notes(W._load(*key))), "%s %s: the words are its own note's" % key)
for key in HELD:
    f = W._load(*key)
    check(W.outcome(f)[0] == "none", "%s %s holds" % key)
check(W.claim(W._load("Clovis Community College", "36326")) ==
      "the page is shared and no note names the record's own section", "36326 holds on the own-page guard")
check(W.shared_with("Santa Monica College", "10345") == ["03281"]
      and W.claim(W._load("Santa Monica College", "10345")) == "stands", "10345: shared, and its own section named")
src = W._sources("Clovis Community College")
s2 = copy.deepcopy(src)
s2["39539"]["source"] = dict(s2["39539"]["source"], pages=[144, 145])
check(W.claim(W._load("Clovis Community College", "39539"), s2) ==
      "the capture holds the page the note says the read lacked", "a capture holding page 144 holds 39539")
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
check(got == ROWS and rec["moved"] == 7 and rec["updates"] == 7 and rec["inserts"] == 0, "the receipt's 7 rows")
for part in ("apply", "preread", "preread_md5", "rollback"):
    with open(MIG % part, encoding="utf-8") as fh:
        sql = fh.read()
    check(all("'%s'" % cn in sql for _, cn in ROWS)
          and not any("'%s'" % cn in sql for _, cn in NAMED | ALREADY | HELD), "%s names exactly the 7" % part)
    check(statements(sql) == 1, "%s is one statement" % part)
    if part == "apply":
        check("confirm guard" in sql and "e(expect) as (values (7))" in sql, "the apply guards a confirm, expects 7")
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
for slug in ("west_los_angeles", "napa_valley", "los_angeles_harbor", "ventura", "los_angeles_city"):
    with open(os.path.join(NG.COLLEGE_DIR, slug, "named_gaps_s727.json"), encoding="utf-8") as fh:
        d = json.load(fh)
    check(all(p["reason"] in d["reasons"] for p in d["programs"]) and d["programs"], "%s: named reasons" % slug)
    check(all((d["college"], p["control_number"]) in NAMED for p in d["programs"]), "%s: only named keys" % slug)

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
