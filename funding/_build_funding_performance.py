#!/usr/bin/env python3
"""Build cpl_funding_performance.js — per-college P2/P3 actuals vs the funding
priorities, from the daily CustomReport pull.

Runs in the daily GitHub Actions workflow right after fetch_custom_report.py
(the input, CustomReport_latest.json, is TRANSIENT runner data — never
committed; it carries pseudonymous per-student rows). Local/manual:

    python3 funding/_build_funding_performance.py [CustomReport_latest.json] [--out path]

Metrics (per docs/funding_priority_metrics_scope.md; forks ratified by Sam
2026-06-11):
  P2 (access)   = distinct students with Transcribed Credits >= 6
  P3 (capacity) = distinct students with Transcribed Credits > 0  (MAP half;
                  the "and MIS" cross-check has no feed yet)
  P1 (completion) is a deliberate data gap — see
  docs/kb-notes/reference-p1-completion-data-gap.md. Not emitted.

Privacy (docs/kb-notes/adr-funding-priority-metrics-privacy.md — RATIFIED):
  - aggregate per-college counts only; the student grain never leaves the
    runner; MAP Internal StudentID is used solely as a distinct-count set key
    (the _compute_college_military_students pattern in excel_to_dashboard.py)
  - per-college counts 1..SUPPRESS_BELOW-1 bake as null + "<5" flag
  - statewide counts are computed independently from the student grain
    (distinct across colleges), so they are NOT the sum of per-college cells —
    which also defeats recovering a suppressed cell by subtraction
  - Test Student / Potential Student rows and the MAP test colleges are
    excluded (fork ③: "documented" means actual records)

College-name join: MAP college names resolve to the funding workbook's names
via kb/college_short_names.json (canonical/alias → short) with a normalized
fallback; unresolved colleges are emitted under "unmatched" for visibility
(suppressed the same way).

Graceful behavior: if the input JSON or the StudentAggregatedValues view is
absent, prints a notice and exits 0 WITHOUT touching any existing artifact
(a failed fetch day keeps yesterday's numbers).
"""
import glob
import json
import os
import re
import sys
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))
OUT_JS = os.path.join(ROOT, "cpl_funding_performance.js")
SHORT_NAMES = os.path.join(ROOT, "kb", "college_short_names.json")
FUNDING_DATA = os.path.join(ROOT, "cpl_funding_data.js")
VIEW = "View_StudentAggregatedValues_APIDataset"
SUPPRESS_BELOW = 5
P2_MIN_UNITS = 6.0

TEST_COLLEGES = {"RivTest City College", "MorTest City College", "Nortest City College",
                 "CA MAP INITIATIVE COLLEGE", "RivTest", "MorTest", "Nortest"}


def _norm(name):
    return re.sub(r"[^a-z0-9]", "", str(name).lower())


def _load_input(argv):
    args = [a for a in argv if not a.startswith("--")]
    path = args[0] if args else None
    if path is None:
        latest = os.path.join(os.getcwd(), "CustomReport_latest.json")
        if os.path.exists(latest):
            path = latest
        else:
            cands = sorted(glob.glob(os.path.join(os.getcwd(), "CustomReport_*.json")))
            path = cands[-1] if cands else None
    if not path or not os.path.exists(path):
        return None, None
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    for report in data if isinstance(data, list) else []:
        if report.get("viewName") == VIEW and report.get("columnValue"):
            col_map = {c: i for i, c in enumerate(report.get("columnName", []))}
            return {"rows": report["columnValue"], "col_map": col_map,
                    "generated_at": report.get("generatedAt", "")}, path
    return None, path


def _name_resolver():
    """MAP college name -> funding-workbook college name (or None)."""
    with open(SHORT_NAMES, encoding="utf-8") as f:
        shorts = json.load(f)["colleges"]
    with open(FUNDING_DATA, encoding="utf-8") as f:
        m = re.search(r"window\.CPL_FUNDING = (\{.*\});\s*$", f.read(), re.S)
    funding_names = [c["college"] for c in json.loads(m.group(1))["colleges"]]
    by_norm_funding = {_norm(n): n for n in funding_names}
    # canonical + every alias -> the funding name whose normalized form matches
    # the entry's short (e.g. "College of Alameda" -> short "Alameda" -> "Alameda").
    lookup = {}
    for entry in shorts:
        target = by_norm_funding.get(_norm(entry["short"]))
        if not target:
            continue
        for alias in set([entry["canonical"], entry["short"]] + list(entry.get("aliases", []))):
            lookup[_norm(alias)] = target

    def resolve(map_name):
        key = _norm(map_name)
        return lookup.get(key) or by_norm_funding.get(key)
    return resolve


def main():
    ds, src = _load_input(sys.argv[1:])
    out = OUT_JS
    if "--out" in sys.argv:
        out = sys.argv[sys.argv.index("--out") + 1]
    if ds is None:
        print(f"funding-performance: no CustomReport input / {VIEW} view found "
              f"(src={src}) — keeping the existing artifact, exiting 0.")
        return
    cm = ds["col_map"]
    i_col = cm.get("College", 0)
    i_tcr = cm.get("Transcribed Credits")
    i_pot = cm.get("Potential Student")
    i_test = cm.get("Test Student")
    i_sid = cm.get("MAP Internal StudentID")
    if i_tcr is None or i_sid is None:
        print("funding-performance: required columns missing — exiting 0 without changes.")
        return

    resolve = _name_resolver()
    seen = {"p2": set(), "p3": set()}          # per-(college,sid) dedupe
    state_seen = {"p2": set(), "p3": set()}    # statewide distinct (cross-college dedupe by sid)
    counts = {}                                 # funding-name -> {p2,p3}
    unmatched = {}
    state = {"p2": 0, "p3": 0}
    rowno = 0
    for row in ds["rows"]:
        rowno += 1
        college = (row[i_col] or "").strip()
        if not college or college in TEST_COLLEGES:
            continue
        if i_test is not None and (row[i_test] or "").strip().lower() == "yes":
            continue
        if i_pot is not None and (row[i_pot] or "").strip().lower() == "yes":
            continue
        try:
            tcr = float((row[i_tcr] or "0").strip() or 0)
        except ValueError:
            continue
        if tcr <= 0:
            continue
        sid = (row[i_sid] or "").strip()
        fname = resolve(college)
        bucket = counts if fname else unmatched
        key = fname or college
        rec = bucket.setdefault(key, {"p2": 0, "p3": 0})
        for metric, hit in (("p3", True), ("p2", tcr >= P2_MIN_UNITS)):
            if not hit:
                continue
            k = (key, sid) if sid else (key, f"row{rowno}")
            if k not in seen[metric]:
                seen[metric].add(k)
                rec[metric] += 1
            sk = sid if sid else f"row{rowno}"
            if sk not in state_seen[metric]:
                state_seen[metric].add(sk)
                state[metric] += 1

    def suppress(bucket):
        outb = {}
        for name, rec in sorted(bucket.items()):
            o = {}
            for metric in ("p2", "p3"):
                n = rec[metric]
                if 0 < n < SUPPRESS_BELOW:
                    o[metric] = None
                    o[metric + "_suppressed"] = True
                else:
                    o[metric] = n
            outb[name] = o
        return outb

    payload = {
        "as_of": (ds["generated_at"] or "").split("T")[0] or date.today().isoformat(),
        "basis": ("MAP " + VIEW + " — distinct students per college; "
                  "Test/Potential students and test colleges excluded; "
                  "P2 = transcribed CPL units >= 6, P3 = any transcribed CPL (per MAP)"),
        "suppress_below": SUPPRESS_BELOW,
        "statewide": state,
        "colleges": suppress(counts),
        "unmatched": suppress(unmatched),
    }
    with open(out, "w", encoding="utf-8") as f:
        f.write(
            "// CPL funding priority-metric actuals (P2/P3) — generated daily by\n"
            "// funding/_build_funding_performance.py from the transient CustomReport\n"
            "// pull. Aggregate, small-cell-suppressed counts ONLY (see\n"
            "// docs/kb-notes/adr-funding-priority-metrics-privacy.md). Do not hand-edit.\n"
            "window.CPL_FUNDING_PERF = " + json.dumps(payload, indent=1, ensure_ascii=False) + ";\n"
        )
    sup = sum(1 for r in payload["colleges"].values() for m in ("p2", "p3") if r.get(m) is None)
    print(f"wrote {os.path.normpath(out)}: {len(payload['colleges'])} colleges "
          f"({sup} suppressed cells), {len(payload['unmatched'])} unmatched, "
          f"statewide p2={state['p2']:,} p3={state['p3']:,}, as_of {payload['as_of']}")


if __name__ == "__main__":
    main()
