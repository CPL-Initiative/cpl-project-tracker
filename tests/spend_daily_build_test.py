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

# S680: a handoff's Spend: line that lands after the day's census run still reaches the sessions key (S678's $115.38
# reached handoff 679 at 00:53Z Nov 18, after the 23:09Z census, and the Nov 17 entry kept S677's $5.44 alone).
with tempfile.TemporaryDirectory() as t:
    put(t, "kb/program_requirements_college/a/summary.json", {"run": "11", "cost_usd_run": 4.5})
    put(t, "docs/session_678_handoff.md", "Spend: $5.44 (Opus 5.5 $5.44); 2026-11-17T20:15Z to 2026-11-17T21:05Z.\n")
    first = sd.build(t, {"api": {}}, "2026-11-17")
    put(t, "docs/session_679_handoff.md",
        "Spend: $115.38 (Opus 5.5 $115.38, subagents included); 2026-11-17T21:41Z to 2026-11-17T23:59Z.\n")
    later = sd.build_sessions(t, first)
    check("a Spend: line landing after the build reaches the sessions key with --sessions-only",
          later["sessions"]["2026-11-17"] == {"usd": 120.82, "sessions": 2, "not_available": 0}, later["sessions"])
    check("--sessions-only leaves the ledger and the billing keys as they stand",
          all(later[k] == first[k] for k in first if k != "sessions"))
    put(t, "docs/session_681_handoff.md", "Spend: $50.00 (Opus 5.5 $50.00); collection $30.00, curation $15.00, "
        "infrastructure $5.00; 2026-11-18T01:00Z to 2026-11-18T02:00Z.\n")
    put(t, "docs/session_682_handoff.md", "Spend: $10.00 (Opus 5.5 $10.00); 2026-11-18T03:00Z to 2026-11-18T04:00Z.\n")
    tagged = sd.build_sessions(t, later)["sessions"]
    check("a tagged day sums its tags and names the untagged rest",
          tagged["2026-11-18"] == {"usd": 60.0, "sessions": 2, "not_available": 0,
                                   "tags": {"collection": 30.0, "curation": 15.0, "infrastructure": 5.0},
                                   "untagged_usd": 10.0}, tagged["2026-11-18"])
    check("an untagged day keeps its old shape", "tags" not in tagged["2026-11-17"], tagged["2026-11-17"])
    # A day with an estimated session carries estimate_usd, the estimated sessions' dollars (COBIx on #3545).
    put(t, "docs/session_683_handoff.md",
        "Spend: $40 (estimated from token counts); 2026-11-18T05:00Z to 2026-11-18T06:00Z.\n")
    est = sd.build_sessions(t, later)["sessions"]
    check("a day with an estimated session shows estimate_usd", est["2026-11-18"].get("estimate_usd") == 40.0
          and est["2026-11-18"]["usd"] == 100.0, est["2026-11-18"])
    check("a day with no estimated session carries no estimate_usd", "estimate_usd" not in est["2026-11-17"],
          est["2026-11-17"])
    os.remove(os.path.join(t, "docs/session_683_handoff.md"))
    d = os.path.join(t, sd.OUT)
    os.makedirs(os.path.dirname(d), exist_ok=True)
    with open(d, "w") as f:
        json.dump(first, f)
    check("--sessions-only --check is stale when a handoff's line is not in the file",
          sd.main(["--root", t, "--sessions-only", "--check"]) == 1)
    sd.main(["--root", t, "--sessions-only"])
    check("and current after the rebuild", sd.main(["--root", t, "--sessions-only", "--check"]) == 0)

# The committed file and its wiring.
cur = json.load(open(os.path.join(ROOT, sd.OUT)))
check("the committed sessions key is what the handoffs' Spend: lines give (run: python3 kb/_build_spend_daily.py "
      "--sessions-only)", cur.get("sessions") == sd.sessions_by_day(ROOT))
gen = open(os.path.join(ROOT, "scripts/check_generated.sh")).read()
check("scripts/check_generated.sh runs the sessions check", "_build_spend_daily.py --sessions-only --check" in gen)
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
