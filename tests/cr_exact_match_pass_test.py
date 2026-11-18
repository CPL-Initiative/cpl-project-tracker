#!/usr/bin/env python3
"""Guard the credit recommendation exact-match pass, a read-only dry run (S683; COBIx's draft on #3480).

    python3 tests/cr_exact_match_pass_test.py

The fixtures in tests/fixtures/cr_exact_match/ are HAND-BUILT TEST DATA, NOT REAL ACE TEXT: TEST- exhibit ids and
invented wordings that reach every label. The failure modes guarded here all pass silently if they happen:

  * a label count that no longer adds up to the inventory (a row dropped or counted twice),
  * a MAP row called an exact match because ACE carries the same words,
  * a refused reviewer gate (HTTP 200, an empty list) read as "no ACE text", labeling every row map_only,
  * a page cap read as the whole table (PostgREST stops at 1,000 rows),
  * the typographic rule copied into the script instead of imported from kb/cr_typographic.py,
  * any request other than a GET to SUPABASE_URL, any named host, or any ACE website.

Nothing here reads Supabase or any website.
"""
from __future__ import annotations

import ast
import importlib.util
import json
import os
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "kb" / "_cr_exact_match_pass.py"
FIX = ROOT / "tests" / "fixtures" / "cr_exact_match"
ACE_CSV, INV_CSV = FIX / "handbuilt_ace_wordings.csv", FIX / "handbuilt_inventory.csv"

spec = importlib.util.spec_from_file_location("cr_exact_match_pass", SCRIPT)
emp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(emp)
sys.path.insert(0, str(ROOT / "kb"))
import cr_typographic as T  # noqa: E402

failures: list[str] = []


def check(cond, msg):
    if not cond:
        failures.append(msg)


def test_fixtures_are_marked_hand_built():
    for path in (ACE_CSV, INV_CSV):
        text = path.read_text(encoding="utf-8")
        check("HAND-BUILT TEST DATA, NOT REAL ACE TEXT" in text, f"{path.name} must say it is hand-built")
        ids = [r["exhibit_id"] for r in emp.load_inventory(path)]
        check(ids and all(i.startswith("TEST-") for i in ids), f"{path.name}: every exhibit id must start TEST-")
        check("acenet" not in text.casefold(), f"{path.name} must hold no ACE site text")
    readme = (FIX / "README.md").read_text(encoding="utf-8").casefold()
    check("not real ace text" in readme, "the fixture README must say the files are not real ACE text")


def test_every_label_and_the_sum():
    inventory, ace_rows = emp.load_inventory(INV_CSV), emp.load_ace_csv(ACE_CSV)
    check(len(inventory) == 10, f"expected 10 hand-built inventory rows, got {len(inventory)}")
    out, summary = emp.run(inventory, ace_rows)
    by = {r["exhibit_id"]: r for r in out}
    want = {
        "TEST-EXACT-01": ("exact_match", ""), "TEST-CASE-02": ("light_fix_match", ""),
        "TEST-UNIT-03": ("light_fix_match", ""), "TEST-MAP-04": ("map_only", ""), "TEST-NONE-05": ("map_only", ""),
        "TEST-TRUNC-06": ("real_difference", "truncation"), "TEST-HOURS-07": ("real_difference", "different_hours"),
        "TEST-TOPIC-08": ("real_difference", "different_topic"),
        "TEST-SEVERAL-09": ("real_difference", "several_ace_recommendations"),
        "TEST-SPACE-10": ("light_fix_match", ""),
    }
    for eid, (label, cause) in want.items():
        got = (by[eid]["label"], by[eid]["sub_cause"])
        check(got == (label, cause), f"{eid}: expected {(label, cause)}, got {got}")
    check(by["TEST-EXACT-01"]["map_source_text"] == by["TEST-EXACT-01"]["ace_source_text"], "exact is identical raw")
    check(by["TEST-CASE-02"]["map_source_text"] != by["TEST-CASE-02"]["ace_source_text"], "light fix differs raw")
    check(by["TEST-MAP-04"]["n_ace_wordings"] == 1 and "source_is_map" in by["TEST-MAP-04"]["note"],
          "a MAP row whose words ACE also carries stays map_only, with the note saying why")
    check(by["TEST-NONE-05"]["n_ace_wordings"] == 0, "TEST-NONE-05 has no ACE line")
    check(by["TEST-SEVERAL-09"]["n_ace_wordings"] == 2, "TEST-SEVERAL-09 has two ACE lines")
    labels = summary["labels"]
    check(labels == {"exact_match": 1, "light_fix_match": 3, "map_only": 2, "real_difference": 4},
          f"label counts: {labels}")
    # The brief's assertion: exact + typographic-only + MAP-only + real difference = the inventory count.
    check(sum(labels[k] for k in emp.LABELS) == summary["n_inventory"] == len(inventory),
          f"the four buckets must add up to the inventory: {labels} vs {len(inventory)}")
    check(summary["labels_add_up"] is True, "the summary states the sum held")


def test_run_refuses_a_sum_that_breaks():
    orig = emp.classify_row
    try:
        emp.classify_row = lambda row, idx: dict(orig(row, idx), label="")
        try:
            emp.run(emp.load_inventory(INV_CSV), emp.load_ace_csv(ACE_CSV))
            check(False, "run() must refuse labels that do not add up to the inventory")
        except AssertionError:
            pass
    finally:
        emp.classify_row = orig


def test_typographic_rule_is_imported_not_copied():
    check(emp.typo_key is T.typo_key and emp.clean_rec is T.clean_rec,
          "the pass must use kb/cr_typographic.py's typo_key and clean_rec")
    tree = ast.parse(SCRIPT.read_text(encoding="utf-8"))
    defs = {n.name for n in ast.walk(tree) if isinstance(n, ast.FunctionDef)}
    check(not defs & {"typo_key", "clean_rec", "_title", "_num"}, f"the rule is redefined here: {defs}")
    check(emp.typo_key("1 hours in Basic DC Laboratory") == emp.typo_key("1 hour in Basic DC Laboratory"),
          "unit grammar folds")


def test_inventory_from_units():
    units = [
        {"exhibit_id": "TEST-A", "credit_rec": "3 hours in Supervision", "source_code": "ACE"},
        {"exhibit_id": "TEST-A", "credit_rec": "3 hours in Supervision", "source_code": "MAP"},
        {"exhibit_id": "TEST-B", "credit_rec": "2 hours in Welding", "source_code": "MAP"},
        {"exhibit_id": "TEST-C", "credit_rec": "1 hour in Typing", "source_code": None},
        {"exhibit_id": "TEST-C", "credit_rec": "", "source_code": "ACE"},
    ]
    inv = emp.inventory_from_units(units)
    check([(r["exhibit_id"], r["source"]) for r in inv] == [("TEST-A", "ACE"), ("TEST-B", "MAP"),
                                                            ("TEST-C", "unlabeled")], f"units to inventory: {inv}")


def test_gate_and_paging():
    try:
        emp.gate_headers({"SUPABASE_ANON_KEY": "x"})
        check(False, "an anon key alone must stop: the gate would answer zero rows")
    except SystemExit:
        pass
    h = emp.gate_headers({"SUPABASE_ANON_KEY": "anon", "CPL_TEAM_PASS": "phrase"})
    check(h.get("x-team-pass") == "phrase", "the team pass goes in x-team-pass, the header team_pass_ok() reads")
    check(emp.gate_headers({"SUPABASE_SERVICE_KEY": "svc"})["apikey"] == "svc", "the runner's key opens the gate")
    env = {"SUPABASE_URL": "https://example.invalid", "SUPABASE_SERVICE_KEY": "svc"}
    calls = []
    total = emp.PAGE + 5

    def fake_get(url, headers):
        calls.append((url, headers["Range"]))
        check(headers.get("Prefer") == "count=exact", "each page asks for the exact count")
        lo = int(headers["Range"].split("-")[0])
        rows = [{"exhibit_id": f"TEST-{i}", "credit_recommendation": "3 hours in X"}
                for i in range(lo, min(total, lo + emp.PAGE))]
        return rows, total

    rows = emp.load_ace_supabase(env, fake_get)
    check(len(rows) == total, f"paging must read past one page: {len(rows)} of {total}")
    check([c[1] for c in calls] == [f"0-{emp.PAGE - 1}", f"{emp.PAGE}-{2 * emp.PAGE - 1}"], f"ranges: {calls}")
    check(all(c[0].startswith("https://example.invalid/rest/v1/map_ace_catalog_cr?") for c in calls),
          "the read goes to map_ace_catalog_cr under SUPABASE_URL")
    check("select=exhibit_id%2Ccredit_recommendation" in calls[0][0], "it selects the migration's two columns")
    # A server max-rows below PAGE: every page is short, and the read must still reach the total.
    cap, capped_calls = 300, []

    def capped_get(url, headers):
        lo = int(headers["Range"].split("-")[0])
        capped_calls.append(lo)
        return [{"exhibit_id": f"TEST-{i}", "credit_recommendation": "3 hours in X"}
                for i in range(lo, min(total, lo + cap))], total

    rows = emp.load_ace_supabase(env, capped_get)
    check(len(rows) == total, f"a server cap of {cap} must not end the read early: {len(rows)} of {total}")
    check(capped_calls[:3] == [0, cap, 2 * cap], f"the next page starts where the last one ended: {capped_calls[:3]}")
    for name, bad in (("an empty page before the total", lambda u, h: ([], 5)),
                      ("no Content-Range total", lambda u, h: ([{"exhibit_id": "TEST-1"}], None)),
                      ("more rows than the total", lambda u, h: ([{"exhibit_id": "TEST-1"}] * 3, 2))):
        try:
            emp.load_ace_supabase(env, bad)
            check(False, f"{name} must stop the read")
        except SystemExit:
            pass
    check(emp.content_range_total("0-999/12345") == 12345 and emp.content_range_total("*/0") == 0
          and emp.content_range_total(None) is None, "Content-Range totals parse")
    try:
        emp.load_ace_supabase(env, lambda url, headers: ([], 0))
        check(False, "an empty ACE read must stop, never label every row map_only")
    except SystemExit:
        pass
    try:
        emp.rest_url({})
        check(False, "no SUPABASE_URL must stop; the file names no host")
    except SystemExit:
        pass


def _one(inv_text, ace_texts, source="ACE"):
    rows, _ = emp.run([{"exhibit_id": "TEST-R", "source_text": inv_text, "ace_id": "TEST-R", "source": source}],
                      [{"exhibit_id": "TEST-R", "credit_recommendation": a} for a in ace_texts])
    return rows[0]


def test_self_recall():
    """The held answers in tests/fixtures/cr_typographic_cases.json, run through run(): `a` as the inventory row,
    `b` as the ACE line. A same pair must match (exact or light fix); a different pair must not, with its sub-cause."""
    cases = json.loads((ROOT / "tests" / "fixtures" / "cr_typographic_cases.json").read_text(encoding="utf-8"))
    expected_cause = {"AR-0102-0007 truncation is not typographic": "truncation",
                      "AR-0102-0007 run-on is not typographic": "truncation",
                      "different units stay apart": "different_hours",
                      "NV-1732-0026 different topics stay apart": "different_topic"}
    right = wrong = 0
    for pair in cases["pairs"]:
        r = _one(pair["a"], [pair["b"]])
        ok = (r["label"] in ("exact_match", "light_fix_match")) == pair["same"]
        if not pair["same"] and pair["case"] in expected_cause:
            ok = ok and r["sub_cause"] == expected_cause[pair["case"]]
        right, wrong = right + ok, wrong + (not ok)
        check(ok, f"self-recall {pair['case']}: {r['label']} / {r['sub_cause']}")
    check(set(expected_cause) <= {p["case"] for p in cases["pairs"]}, "every expected sub-cause case is held")
    print(f"self-recall on cr_typographic_cases.json: {right} right, {wrong} wrong of {right + wrong}")


def test_sub_cause_probes():
    probes = [("3 semester hours in Welding", "3 hours in Welding", "other_wording"),
              ("3 hours in Supervision.", "3 hours in Supervision", None),
              ("3 hours in supervision and", "3 hours in Supervision and Leadership", "truncation"),
              ("3 hours in Supervision", "4 hours in Supervision.", "different_hours"),
              ("3 hours in Fluid Power Systems", "1 hour in Industrial Safety", "different_topic")]
    for inv, ace, cause in probes:
        r = _one(inv, [ace])
        if cause is None:   # the typographic rule may fold an end mark; either way it is never a topic difference
            check(r["label"] == "light_fix_match" or r["sub_cause"] == "other_wording",
                  f"{inv!r} vs {ace!r}: {r['label']} / {r['sub_cause']}")
        else:
            check(r["label"] == "real_difference" and r["sub_cause"] == cause,
                  f"{inv!r} vs {ace!r}: expected {cause}, got {r['label']} / {r['sub_cause']}")


def test_live_counts_sql_agrees_with_python():
    sql = emp.LIVE_COUNTS_SQL
    check(sql.lstrip().startswith("with ") and sql.count("select json_build_object(") == 1,
          "one SELECT returning one JSON value")
    check("public.map_college_cr_unit" in sql and "public.map_ace_catalog_cr" in sql, "it reads the two tables")
    check(emp.MAP_ONLY_SQL == "((has_map and not has_ace) or exhibit_id = '' or not in_catalog)",
          "the map_only predicate is the one classify_row() applies")
    check(sql.count(emp.MAP_ONLY_SQL) == 3, "all three label counts use the one map_only predicate")
    for w in ("insert", "update ", "delete", "drop", "truncate", "count_cr", "student"):
        check(w not in sql.casefold(), f"the SELECT holds no {w!r}")
    # The predicate mirrors the Python: a unit set with ACE and MAP is ACE (not map_only); MAP alone is map_only;
    # an exhibit the catalog does not carry is map_only.
    inv = emp.inventory_from_units([
        {"exhibit_id": "TEST-1", "credit_rec": "3 hours in X", "source_code": "MAP"},
        {"exhibit_id": "TEST-1", "credit_rec": "3 hours in X", "source_code": "ACE"},
        {"exhibit_id": "TEST-2", "credit_rec": "3 hours in X", "source_code": "MAP"},
        {"exhibit_id": "TEST-3", "credit_rec": "3 hours in X", "source_code": "ACE"}])
    ace = [{"exhibit_id": e, "credit_recommendation": "3 hours in X"} for e in ("TEST-1", "TEST-2")]
    labels = {r["exhibit_id"]: r["label"] for r in emp.run(inv, ace)[0]}
    check(labels == {"TEST-1": "exact_match", "TEST-2": "map_only", "TEST-3": "map_only"}, f"labels: {labels}")


def test_migration_names_match():
    sql = (ROOT / "kb" / "migrations" / "2026-11-17_s678_map_ace_catalog_cr.sql").read_text(encoding="utf-8")
    check("create table public.map_ace_catalog_cr (" in sql, "the table the pass reads exists in the migration")
    for col in (emp.ACE_ID_COLUMN, emp.ACE_TEXT_COLUMN, "cr_md5"):
        check(f"\n  {col} " in sql, f"column {col} is in the migration")
    check("is_allowed_reviewer() or team_pass_ok()" in sql, "the read gate is the one gate_headers() opens")


def test_no_fetch_but_the_gated_get():
    src = SCRIPT.read_text(encoding="utf-8")
    check("http://" not in src and "https://" not in src, "the pass names no URL; SUPABASE_URL comes from the env")
    check("acenet" not in src.casefold(), "no ACE website")
    tree = ast.parse(src)
    opens = [n for n in ast.walk(tree) if isinstance(n, ast.Attribute) and n.attr in ("urlopen", "Request")]
    check(len(opens) == 2, f"one Request and one urlopen, in _get alone: {len(opens)}")
    get_fn = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "_get")
    inside = [n for n in ast.walk(get_fn) if isinstance(n, ast.Attribute) and n.attr in ("urlopen", "Request")]
    check(len(inside) == 2, "urlopen and Request appear only inside _get")
    check('method="GET"' in ast.get_source_segment(src, get_fn), "_get sends a GET only")
    for mod in ("requests", "http.client", "socket", "subprocess"):
        check(f"import {mod}" not in src, f"no {mod}")


def test_cli_writes_csv_and_counts_only():
    with tempfile.TemporaryDirectory() as d:
        out, summ = Path(d) / "dry.csv", Path(d) / "dry.json"
        rc = emp.main(["--ace-source", "csv", "--ace-csv", str(ACE_CSV), "--inventory", str(INV_CSV),
                       "--out", str(out), "--summary-json", str(summ)])
        check(rc == 0, "the CLI exits 0 on the fixtures")
        check(sorted(p.name for p in Path(d).iterdir()) == ["dry.csv", "dry.json"], "it writes the two files only")
        s = json.loads(summ.read_text(encoding="utf-8"))
        check(s["n_inventory"] == 10 and sum(s["labels"].values()) == 10, f"summary: {s['labels']}")
        check(len(emp.load_inventory(out)) == 10, "one CSV row per inventory row")


def main() -> int:
    for name, fn in list(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
    if failures:
        print(f"{len(failures)} FAILED")
        for m in failures:
            print(" -", m)
        return 1
    print("cr_exact_match_pass: all checks passed (hand-built test data, not real ACE text).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
