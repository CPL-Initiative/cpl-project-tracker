#!/usr/bin/env python3
"""Guard ACE's catalog credit recommendation text: kept, keyed on AceID, compared typographically, never rewritten.

    python3 tests/map_ace_catalog_cr_test.py

S678 (COBIx item 5, #3464 comments 6962133442 and 6962134078). kb/_sync_map_custom_reports.py now keeps
View_ExhibitCRsCatalog_Dataset's CreditRecommendation, one row per distinct (AceID, CreditRecommendation), in
map_ace_catalog_cr. The failure modes guarded here all pass silently if they happen:

  * the catalog's numeric ExhibitID landing as exhibit_id (a different namespace; every join would miss),
  * the typographic rule folding wordings that differ in substance (AR-0102-0007's truncation and run-on),
  * the rule rewriting the source text it only compares,
  * the side by side counting a MAP wording twice, so its buckets stop adding up,
  * Python and cr_reference.js disagreeing on the rule (the shared fixture; tests/cr_ace_side_by_side.test.js),
  * the loader failing the nightly MAP load when the migration is not applied yet,
  * the load function left callable by an API role, or service_role losing it (Rule 10 b2).

Fixtures only; nothing here reads Supabase or any ACE website.
"""
from __future__ import annotations

import importlib.util
import json
import os
import re
import sys
import urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("sync_map", os.path.join(ROOT, "kb", "_sync_map_custom_reports.py"))
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)
sys.path.insert(0, os.path.join(ROOT, "kb"))
import cr_typographic as T  # noqa: E402

failures: list[str] = []


def check(cond, msg):
    if not cond:
        failures.append(msg)


# ── 1. The rule itself, on the shared fixture ───────────────────────────────
CASES = json.load(open(os.path.join(ROOT, "tests", "fixtures", "cr_typographic_cases.json"), encoding="utf-8"))
for c in CASES["pairs"]:
    got = T.typo_key(c["a"]) == T.typo_key(c["b"])
    check(got == c["same"], f"typographic rule on {c['case']}: expected same={c['same']}, got {got} "
                            f"({T.typo_key(c['a'])!r} vs {T.typo_key(c['b'])!r})")
    if "clean" in c:
        check(T.clean_rec(c["a"]) == c["clean"] and T.clean_rec(c["b"]) == c["clean"],
              f"clean_rec on {c['case']}: {T.clean_rec(c['a'])!r} / {T.clean_rec(c['b'])!r}, want {c['clean']!r}")
check(T.typo_key("") == "" and not T.same_typographically("", ""), "a blank wording matched another blank")

# ── 2. The catalog parse: AceID is the key, the numeric ExhibitID never is ───
COLS = ["ExhibitID", "SkillLevel", "CreditRecommendation", "Title", "TotalStudentsForCR", "AceID", "CPLTypeCode"]


def cat(rows, cols=COLS):
    return [{"viewName": sync.CATALOG_VIEW, "columnName": cols, "columnValue": rows}]


ROWS = [
    # AR-0702-0030: one catalog line, sent on two skill-level rows; the second copy carries stray spaces.
    ["40001", "L", "3 hours in Supervision", "Supervisor Course", "0", "AR-0702-0030", "M"],
    ["40002", "U", "  3 hours in Supervision ", "Supervisor Course", "0", "AR-0702-0030", "M"],
    # AR-0102-0007: two atomic ACE lines (MAP's field runs them together).
    ["40003", "L", "4 hours in Companion Animal Radiology", "Veterinary Tech", "0", "AR-0102-0007", "M"],
    ["40004", "L", "4 hours in Companion Animal Surgical Assistance And Anesthesia", "Veterinary Tech", "0", "AR-0102-0007", "M"],
    # An AceID with two catalog CR lines, one in lowercase as the catalog sent it.
    ["40005", "L", "3 hours in emergency medical technician", "Combat Medic", "0", "MOS-68W-001", "M"],
    ["40006", "U", "2 hours in Anatomy and Physiology", "Combat Medic", "0", "MOS-68W-001", "M"],
    # A numeric id in the AceID column, a blank recommendation, a blank id: none land.
    ["40007", "L", "3 hours in Welding", "Welder", "0", "41234", "M"],
    ["40008", "L", "", "Welder", "0", "AR-1703-0030", "M"],
    ["40009", "L", "3 hours in Welding", "Welder", "0", "", "M"],
]
pairs, stats = sync.ace_catalog_crs(cat(ROWS))
keys = [(p["exhibit_id"], p["credit_recommendation"]) for p in pairs]
check(len(keys) == len(set(keys)) == 5, f"one row per distinct (AceID, CreditRecommendation): got {keys}")
check(("AR-0702-0030", "3 hours in Supervision") in keys and sum(k[0] == "AR-0702-0030" for k in keys) == 1,
      f"AR-0702-0030's two copies of one line must store once, trimmed: {keys}")
check(sum(k[0] == "MOS-68W-001" for k in keys) == 2, f"an AceID with two catalog lines keeps both: {keys}")
check(("MOS-68W-001", "3 hours in emergency medical technician") in keys,
      "the catalog text is stored as sent (only trimmed): its lowercase topic was rewritten")
check(sum(k[0] == "AR-0102-0007" for k in keys) == 2, f"AR-0102-0007's two atomic lines both store: {keys}")
check(not any(re.fullmatch(r"\d+", k[0]) for k in keys), f"a numeric id landed as exhibit_id: {keys}")
check(not any(k[0].startswith("400") for k in keys), "the catalog's numeric ExhibitID was read as the key")
check(stats == {"catalog_rows": 9, "numeric_ace_id": 1, "blank": 2, "pairs": 5}, f"parse stats: {stats}")
check(all(p["typo_key"] == T.typo_key(p["credit_recommendation"]) for p in pairs), "typo_key beside each pair")

# By name, never by position: the same rows in another column order give the same pairs.
order = ["AceID", "CreditRecommendation", "ExhibitID"]
shuffled = [[r[COLS.index(c)] for c in order] for r in ROWS]
check(sync.ace_catalog_crs(cat(shuffled, order))[0] == pairs, "ace_catalog_crs read the columns by position")
check(sync.ace_catalog_crs(cat(ROWS, COLS[:2] + ["Recommendation"] + COLS[3:]))[0] == [],
      "a view without CreditRecommendation must store nothing rather than guess a column")
check(sync.ace_catalog_crs([])[0] == [], "a pull without the catalog view must store nothing")
try:
    sync.ace_catalog_crs(cat([[str(i), "L", "3 hours in X", "t", "0", str(9000 + i), "M"] for i in range(5)]))
    failures.append("a catalog whose AceID column carries numeric ids (the ExhibitID namespace) must stop the run")
except SystemExit:
    pass

# ── 3. The side by side: four buckets that add up, the rule on the MAP side ──
MAP = [
    ("AR-0702-0030", "3 hours in Supervision"),           # exact
    ("AR-0702-0030", "3 hours in supervision"),           # typographic only (casing)
    ("AR-0702-0030", "3 hours in Supervision"),           # the same pair again: counted once
    ("AR-0102-0007", "4 hours in Companion Animal Surgical Assistance And"),  # truncated: differs
    ("AR-0102-0007", "4 hours in Companion Animal Radiology Companion Animal Surgical Assistance And Anesthesia "
                     "Laboratory Animal And Small Animal Exotics"),             # run-on: differs
    ("MOS-68W-001", "3 Hours in Emergency Medical Technician"),  # typographic only against ACE's lowercase line
    ("NV-1732-0026", "3 hours in Fluid Power Systems"),   # no ACE line for the exhibit
    ("", "3 hours in Supervision"),                       # no exhibit id: apart
]
sbs = T.side_by_side(MAP, keys)
check((sbs["exact"], sbs["typographic"], sbs["differs"], sbs["ace_missing"], sbs["no_exhibit"]) == (1, 2, 2, 1, 1),
      f"side by side buckets: {sbs}")
check(sbs["exact"] + sbs["typographic"] + sbs["differs"] + sbs["ace_missing"] == sbs["map_pairs"] == 6,
      f"the buckets must add up to the MAP pairs without double counting: {sbs}")
check(sbs["map_typo_settled"] == 2, f"AR-0702-0030's two MAP wordings settle typographically: {sbs}")
check(sbs["ace_pairs"] == 5 and sbs["ace_exhibits"] == 3, f"ACE side counts: {sbs}")
before = list(MAP)
T.side_by_side(MAP, keys)
check(MAP == before, "the side by side changed the source text it compares")

cr_rows = [{"exhibit_id": e, "credit_rec": r} for e, r in MAP]
got = sync.report_ace_crs(pairs, stats, cr_rows)
check(got == sbs, "the runner's report must be the same partition")

# ── 4. The write: batches, the 404 before the migration, never a numeric key ──
calls = []


def fake(method, path, key, body=None, timeout=180):
    calls.append((method, path, body))
    rows = body["p_rows"]
    return 200, json.dumps({"sent": len(rows), "added": len(rows), "seen_again": 0, "held": len(rows)}).encode()


real_request, real_batch, real_sleep = sync._request, sync.ACE_CR_BATCH, sync._sleep
try:
    sync._request, sync.ACE_CR_BATCH, sync._sleep = fake, 2, (lambda s: None)
    tot = sync.load_ace_catalog_crs(pairs, "k")
    check(len(calls) == 3 and all(c[1] == "rpc/map_ace_catalog_cr_load" for c in calls), f"batches: {calls}")
    sent = [r for c in calls for r in c[2]["p_rows"]]
    check(sent == pairs, "every pair goes out once, in order")
    check(set(sent[0]) == {"exhibit_id", "credit_recommendation", "typo_key"}, f"payload fields: {set(sent[0])}")
    check(tot["sent"] == 5 and tot["added"] == 5, f"totals: {tot}")

    def missing(*a, **k):
        raise urllib.error.HTTPError("u", 404, "Not Found", {}, None)
    sync._request = missing
    check(sync.load_ace_catalog_crs(pairs, "k") is None, "a missing function (migration not applied) must not raise")
    check(sync.store_ace_crs(pairs, "k") == 0, "the nightly run must not fail before the migration is applied")

    flaky = {"n": 0}

    def once_then_ok(method, path, key, body=None, timeout=180):
        flaky["n"] += 1
        if flaky["n"] == 1:
            raise urllib.error.HTTPError("u", 503, "Unavailable", {}, None)
        return fake(method, path, key, body, timeout)
    calls.clear()
    sync._request = once_then_ok
    sync.load_ace_catalog_crs(pairs, "k")
    check(flaky["n"] == 4, f"a transient failure resends the batch (the load is idempotent): {flaky['n']} calls")
finally:
    sync._request, sync.ACE_CR_BATCH, sync._sleep = real_request, real_batch, real_sleep

# ── 5. main(): report on every run, store only after the promotion ──────────
SRC = open(os.path.join(ROOT, "kb", "_sync_map_custom_reports.py"), encoding="utf-8").read()
main_src = SRC[SRC.index("def main()"):SRC.index("def store_ace_crs")]
check(main_src.index("report_ace_crs(") < main_src.index("if args.dry_run"),
      "the side by side must print on a dry run too")
check(main_src.index("if args.no_promote") < main_src.index("store_ace_crs("),
      "ACE text must be stored only after the promotion (--no-promote changes nothing live)")
check(main_src.count("return store_ace_crs(ace_crs, key)") == 2, "both promotion outcomes store the ACE text")
check('"ExhibitID"' not in SRC[SRC.index("def ace_catalog_crs"):SRC.index("def report_ace_crs")],
      "ace_catalog_crs must never name the catalog's numeric ExhibitID")

# ── 6. The migration and its rollback ───────────────────────────────────────
MIG = os.path.join(ROOT, "kb", "migrations", "2026-11-17_s678_map_ace_catalog_cr.sql")
sql = open(MIG, encoding="utf-8").read()
rb = open(MIG.replace(".sql", "_rollback.sql"), encoding="utf-8").read()
body = "\n".join(l for l in sql.splitlines() if not l.lstrip().startswith("--"))
check("primary key (exhibit_id, cr_md5)" in body, "the key is the ACE id and the text's hash")
check("exhibit_id !~ '^[0-9]+$'" in body, "a check constraint must refuse a numeric exhibit_id")
check(re.search(r"for select to anon, authenticated\s+using \(is_allowed_reviewer\(\) or team_pass_ok\(\)\)", body),
      "reads are reviewer-gated (is_allowed_reviewer() or team_pass_ok())")
check("grant update (last_seen, typo_key)" in body and not re.search(r"grant[^;]*\bupdate\b[^(;]*on public\.map_ace", body),
      "the service role may update the two derived columns only, never the text")
check(not re.search(r"grant[^;]*\b(insert|update|delete)\b[^;]*to[^;]*\b(anon|authenticated)\b", body),
      "no API role may write the table")
g = body.index("grant execute on function public.map_ace_catalog_cr_load(jsonb) to service_role")
r = body.index("revoke all on function public.map_ace_catalog_cr_load(jsonb) from public, anon, authenticated")
check(g < r, "Rule 10 b2: service_role's explicit grant comes before the revoke")
check("has_function_privilege('service_role'" in body and "has_function_privilege('anon'" in body,
      "the migration checks the grants it set, and raises if they are wrong")
check("security_invoker = true" in body, "the side-by-side view must read through the underlying policies")
check("ExhibitID" not in body, "the migration must not name the catalog's numeric ExhibitID as a column")
for stmt in ("drop view if exists public.map_exhibit_cr_side_by_side", "drop function if exists public.map_ace_catalog_cr_load(jsonb)",
             "drop table public.map_ace_catalog_cr", "create table public.map_ace_catalog_cr_backup as table public.map_ace_catalog_cr"):
    check(stmt in rb, f"the rollback must {stmt}")
check(rb.index("map_ace_catalog_cr_backup as table") < rb.index("drop table public.map_ace_catalog_cr;"),
      "the rollback copies the rows before it drops the table")

# ── 7. The governance map names every new surface with its reason ───────────
gov = json.load(open(os.path.join(ROOT, "kb", "governance_surface_map.json"), encoding="utf-8"))
allg = {**gov.get("mapped", {}), **gov.get("dismissed", {})}
for k in ("table:map_ace_catalog_cr", "rpc:map_ace_catalog_cr_load", "view:map_exhibit_cr_side_by_side"):
    check(k in allg and len(str(allg[k])) > 40, f"kb/governance_surface_map.json must map or dismiss {k} with its reason")

if failures:
    print("FAIL —", len(failures), "problem(s):")
    for f in failures:
        print("  -", f)
    sys.exit(1)
print("OK — ACE catalog text keyed on AceID, one row per pair, the typographic rule agreeing with its fixture, "
      "a side by side that adds up, a load that waits for its migration, and the grants closed.")
