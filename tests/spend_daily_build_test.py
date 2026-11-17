#!/usr/bin/env python3
"""kb/_build_spend_daily.py: the daily spend file's measured series (S678, COBIx's item 1a).

Guards the failure modes: a pasted billing key rewritten; a run priced twice, or zeroed by a later free rescore of the
same college; a run dated by the build day when its capture names the read day; a pre-S647 summary (cost_usd alone)
dropped; the committed file missing a row for a day a session or a run spent; the census job not running it, or not
committing it; the Commons builder showing a spent figure the ledger does not hold.

Run from repo root: python3 tests/spend_daily_build_test.py
"""
import importlib.util
import json
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("sd", os.path.join(ROOT, "kb", "_build_spend_daily.py"))
sd = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sd)
results = []


def check(name, cond, detail=""):
    results.append(bool(cond))
    print(("PASS " if cond else "FAIL ") + name + ((" — " + str(detail)) if (detail and not cond) else ""))


def put(root, rel, obj):
    p = os.path.join(root, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w") as f:
        f.write(obj if isinstance(obj, str) else json.dumps(obj))


with tempfile.TemporaryDirectory() as t:
    put(t, "kb/program_requirements_college/a/summary.json", {"run": "11", "cost_usd_run": 4.5, "cost_usd_filed": 9.0})
    put(t, "kb/program_requirements_college/a/capture.json", {"run": "11", "started": "2026-11-16T23:10:00Z"})
    put(t, "kb/program_requirements_college/b/summary.json", {"run": "22", "cost_usd": 12.41})
    put(t, "kb/program_requirements_college/c/summary.json", {"run": "33", "cost_usd_run": 0.0, "cost_usd_filed": 3.0})
    put(t, "docs/session_800_handoff.md", "Spend: $7.00 (Opus 5.5 $7.00); 2026-11-17T01:00Z to 2026-11-17T02:00Z.\n")
    billing = {"_what": "x", "api": {"2026-11-15": 1.99}, "topups": {"2026-11-14": [199.82]}, "updated": "2026-11-15"}
    d1 = sd.build(t, billing, "2026-11-17")
    check("the pasted billing keys are untouched", d1["api"] == billing["api"] and d1["topups"] == billing["topups"] and d1["updated"] == "2026-11-15")
    check("a run is dated by its own read's start, not the build day", d1["runner_runs"]["11"]["day"] == "2026-11-16", d1["runner_runs"])
    check("a pre-S647 summary's cost_usd stands for its run", d1["runner_runs"]["22"]["usd"] == 12.41)
    check("a free rescore is a $0 run, never the filed cost", d1["runner_runs"]["33"]["usd"] == 0.0)
    check("rows by day: Nov 16 and Nov 17", d1["runner"] == {"2026-11-16": 4.5, "2026-11-17": 12.41}, d1["runner"])
    check("sessions by the day each ended", d1["sessions"].get("2026-11-17", {}).get("usd") == 7.0, d1["sessions"])
    # The same college read again, and a second build: the old run stays in the ledger and is never priced twice.
    put(t, "kb/program_requirements_college/a/summary.json", {"run": "44", "cost_usd_run": 1.0, "cost_usd_filed": 9.5})
    put(t, "kb/program_requirements_college/a/capture.json", {"run": "44", "started": "2026-11-18T03:00:00Z"})
    d2 = sd.build(t, d1, "2026-11-18")
    d3 = sd.build(t, d2, "2026-11-19")
    check("an overwritten run stays in the ledger; a new run is added once", set(d3["runner_runs"]) == {"11", "22", "33", "44"} and d3["runner"]["2026-11-18"] == 1.0)
    check("a rebuild changes nothing", d3 == sd.build(t, d3, "2026-11-20"))
    check("spent sums the ledger", sd.spent(d3) == (17.91, 4), sd.spent(d3))

# The committed file and its wiring.
cur = json.load(open(os.path.join(ROOT, sd.OUT)))
check("the committed file has a measured row for Nov 16 and Nov 17", "2026-11-16" in cur.get("sessions", {}) and "2026-11-17" in cur.get("sessions", {})
      and "2026-11-17" in cur.get("runner", {}), sorted(cur.get("runner", {}))[-3:])
check("the committed file's billing rows are still the pasted ones", cur["api"]["2026-10-27"] == 2685.95 and cur["updated"] == "2026-11-15")
wf = open(os.path.join(ROOT, ".github/workflows/harvest-gap-census.yml")).read()
check("the census job runs the builder on a daily schedule and commits the file",
      "cron: '47 17 * * *'" in wf and "python3 kb/_build_spend_daily.py" in wf and "kb/reference/model_spend_daily.json; do" in wf
      and wf.index("_build_spend_daily.py") < wf.index("_build_commons_data_status.py"))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _build_commons_data_status as C  # noqa: E402
blk = C.spent_block(ROOT)
check("the Commons statewide spent figure is the ledger's sum", blk.get("spent_usd") == sd.spent(cur)[0] and blk.get("spent_runs") == sd.spent(cur)[1], blk)
with tempfile.TemporaryDirectory() as t:
    check("no ledger, no spent figure (the page says TBA)", C.spent_block(t) == {})

print("\n%d/%d checks passed" % (sum(results), len(results)))
sys.exit(0 if all(results) else 1)
