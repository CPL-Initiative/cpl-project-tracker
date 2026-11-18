#!/usr/bin/env python3
"""Keep kb/reference/model_spend_daily.json current without billing credentials (S678, COBIx's item 1a).

The file's `api` and `topups` are billing totals Sam pastes by hand, and only he can add them. This builder leaves
those keys alone and keeps two measured series beside them, so the file gains a row every day the census runs:

- `runner`: what the extraction runs cost, by the UTC day each read started. The figure is each run's own
  `cost_usd_run`, read from the college's summary.json (summarize() in kb/_program_requirements_college.py). A summary
  keeps only its latest run, so every run is copied into `runner_runs`, keyed by run id, the first time a build sees
  it. A run is never priced twice, and a later free rescore never zeroes it. A summary from before S647 carries
  `cost_usd` alone, for the run that filed every record, and that figure stands for the run.
- `sessions`: the sessions' own figures from their handoffs' `Spend:` lines, by the UTC day each session ended
  (kb/_build_session_spend.py, reused rather than restated).

The ledger begins with the runs the committed summaries hold today (2026-11-17). Runs that an earlier read overwrote
before then are not in it. `runner_since` says so, and the page says it too.

    python3 kb/_build_spend_daily.py            # update the file in place (the census job runs this daily on main)
    python3 kb/_build_spend_daily.py --check    # exit 1 if a build would change the measured keys
"""
import argparse
import glob
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = "kb/reference/model_spend_daily.json"
COLLEGES = "kb/program_requirements_college"
SINCE = "2026-11-17"
MEASURED = ("runner", "runner_runs", "runner_since", "sessions", "measured_note")


def _load(path):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return None


def run_cost(summary):
    """The run's own spend: cost_usd_run, else (a summary from before S647) cost_usd. None when neither is a number."""
    v = summary.get("cost_usd_run")
    if isinstance(v, (int, float)) and not isinstance(v, bool):
        return round(float(v), 2)
    if "cost_usd_filed" not in summary:
        v = summary.get("cost_usd")
        if isinstance(v, (int, float)) and not isinstance(v, bool):
            return round(float(v), 2)
    return None


def read_day(d, run):
    """The UTC day the read started: its capture's `started` when the capture is this run's, else None."""
    for name in ("capture.json", "capture_preview.json"):
        cap = _load(os.path.join(d, name)) or {}
        if str(cap.get("run") or "") == run and isinstance(cap.get("started"), str) and len(cap["started"]) >= 10:
            return cap["started"][:10]
    return None


def scan(root, today):
    """Every run the committed summaries name: {run_id: {college, usd, day}}."""
    out = {}
    for path in sorted(glob.glob(os.path.join(root, COLLEGES, "*", "summary.json"))):
        s = _load(path) or {}
        run = str(s.get("run") or "").strip()
        usd = run_cost(s)
        if not run or usd is None:
            continue
        d = os.path.dirname(path)
        out[run] = {"college": os.path.basename(d), "usd": usd, "day": read_day(d, run) or today}
    return out


def sessions_by_day(root):
    here = os.path.dirname(os.path.abspath(__file__))
    if here not in sys.path:
        sys.path.insert(0, here)
    import _build_session_spend as S  # noqa: E402  (the one parser of the Spend: line)
    built = S.build(root)
    return {day: v for day, v in built["by_day"].items() if day}


def build(root, current, today):
    data = dict(current or {})
    ledger = dict(data.get("runner_runs") or {})
    for run, row in scan(root, today).items():
        ledger.setdefault(run, row)   # first sight wins: a run is priced once, by its own read
    by_day = {}
    for row in ledger.values():
        by_day[row["day"]] = round(by_day.get(row["day"], 0.0) + row["usd"], 2)
    data["runner"] = {k: by_day[k] for k in sorted(by_day)}
    data["runner_runs"] = {k: ledger[k] for k in sorted(ledger)}
    data["runner_since"] = data.get("runner_since") or SINCE
    data["sessions"] = sessions_by_day(root)
    data["measured_note"] = ("runner and sessions are measured by kb/_build_spend_daily.py, not pasted: runner is the "
                             "extraction runs' own cost_usd_run by the day each read started, a ledger from " +
                             data["runner_since"] + " on (runs an earlier read overwrote before then are not in it); "
                             "sessions is the handoffs' Spend: lines by the day each session ended. Neither is added "
                             "to the billing totals in api and topups.")
    return data


def spent(data):
    """The total the ledger holds: (dollars, runs)."""
    runs = (data or {}).get("runner_runs") or {}
    return round(sum(r["usd"] for r in runs.values()), 2), len(runs)


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--root", default=ROOT)
    ap.add_argument("--today", default=None, help="the UTC day for a run whose read day cannot be found")
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args(argv)
    import datetime
    today = a.today or datetime.datetime.now(datetime.timezone.utc).date().isoformat()
    path = os.path.join(a.root, OUT)
    cur = _load(path) or {}
    new = build(a.root, cur, today)
    if a.check:
        same = all(cur.get(k) == new.get(k) for k in MEASURED)
        print("model_spend_daily measured keys are current" if same else "model_spend_daily measured keys are stale")
        return 0 if same else 1
    with open(path, "w", encoding="utf-8") as f:
        f.write(json.dumps(new, indent=1, ensure_ascii=False) + "\n")
    usd, n = spent(new)
    print("wrote %s: %d runs, $%.2f since %s; runner days %d; session days %d" % (OUT, n, usd, new["runner_since"], len(new["runner"]), len(new["sessions"])))
    return 0


if __name__ == "__main__":
    sys.exit(main())
