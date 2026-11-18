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
        lo = int(headers["Range"].split("-")[0])
        return [{"exhibit_id": f"TEST-{i}", "credit_recommendation": "3 hours in X"} for i in range(lo, min(total, lo + emp.PAGE))]

    rows = emp.load_ace_supabase(env, fake_get)
    check(len(rows) == total, f"paging must read past one page: {len(rows)} of {total}")
    check([c[1] for c in calls] == [f"0-{emp.PAGE - 1}", f"{emp.PAGE}-{2 * emp.PAGE - 1}"], f"ranges: {calls}")
    check(all(c[0].startswith("https://example.invalid/rest/v1/map_ace_catalog_cr?") for c in calls),
          "the read goes to map_ace_catalog_cr under SUPABASE_URL")
    check("select=exhibit_id%2Ccredit_recommendation" in calls[0][0], "it selects the migration's two columns")
    try:
        emp.load_ace_supabase(env, lambda url, headers: [])
        check(False, "an empty ACE read must stop, never label every row map_only")
    except SystemExit:
        pass
    try:
        emp.rest_url({})
        check(False, "no SUPABASE_URL must stop; the file names no host")
    except SystemExit:
        pass


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
