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
  PE (added 2026-07-06) = distinct students with Eligible Credits > 0 — credit
                  identified in MAP, whether or not transcribed yet. Serves the
                  reworded P1 "eligible for at least one course offered through
                  CPL" metric (wired in cpl_funding.js MEASURES, 2026-07-27).
  PP (added 2026-07-27 per Sam) = distinct PORTAL-ORIGIN students (Potential
                  Student = Yes, Test Student != Yes) with any transcribed CPL —
                  the P3 "transcribed Credit from either CPL Student Portal or
                  CPL Landing Page" metric. Achievement-based: a college earns on
                  its actual portal count and one with none earns $0 (#906). Tiny
                  & mostly test until the Portal launches.
  VET_STAR (added 2026-07-27) = a per-college Veteran Star flag (funding-name ->
                  bool) read from veteran_jst.json (>= star_threshold, 0.75, of
                  enrolled veterans have a JST uploaded). It is NOT a student
                  count — it's the auto-computed "75% veteran JSTs" eligibility
                  qualifier for the funding tab's Elig glyph. Emitted as the
                  top-level payload key `vet_star` (+ as_of/threshold/n).

  FEEDERS.F1 (added 2026-07-27 per Sam) = per-noncredit-feeder eligible headcount
                  (distinct students with Eligible Credits > 0), keyed by the
                  feeder SHORT name (NOCE / SD Cont. Ed / Mt. SAC NC / Calbright).
                  The one measure a noncredit campus can stand up (it can't
                  transcribe — colleges do that; F2 waivers have no feed yet).
                  Emitted as top-level `feeders`; empty until campuses attach
                  exhibits to their NC student records in MAP.

  The field -> priority mapping lives in cpl_funding.js (MEASURES), not here;
  this script only emits the raw pe/p2/p3/pp counts (+ the vet_star flags +
  the per-feeder F1 eligible headcount).

Privacy (docs/kb-notes/adr-funding-priority-metrics-privacy.md — RATIFIED):
  - aggregate per-college counts only; the student grain never leaves the
    runner; MAP Internal StudentID is used solely as a distinct-count set key
    (the _compute_college_military_students pattern in excel_to_dashboard.py)
  - pe/p2/p3 per-college counts 1..SUPPRESS_BELOW-1 bake as null + "<5" flag;
    `pp` is the one exception (shown raw, Sam 2026-07-27) — its privacy gate is
    the Test Student field, not <5 suppression (see NO_SUPPRESS below)
  - statewide counts are computed independently from the student grain
    (distinct across colleges), so they are NOT the sum of per-college cells —
    which also defeats recovering a suppressed cell by subtraction
  - Test Student rows and the MAP test colleges are excluded; Potential Student
    rows are routed to `pp` (not counted in pe/p2/p3)

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
VETERAN_JST = os.path.join(ROOT, "veteran_jst.json")  # daily Vets/JST + Veteran Star
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


def _feeder_resolver():
    """MAP college name -> noncredit-feeder SHORT name (or None). Feeders live
    only in cpl_funding_data.js `feeders` (they were moved out of the college
    table — they can't earn the CPL priority metrics). Matches on the feeder's
    full name or its short. Supports F1 (eligible headcount) — the one measure a
    noncredit campus can stand up once it attaches exhibits to its NC records."""
    with open(FUNDING_DATA, encoding="utf-8") as f:
        m = re.search(r"window\.CPL_FUNDING = (\{.*\});\s*$", f.read(), re.S)
    feeders = json.loads(m.group(1)).get("feeders", []) if m else []
    lookup = {}
    for fd in feeders:
        short = fd.get("short")
        if not short:
            continue
        for nm in (fd.get("name"), short):
            if nm:
                lookup[_norm(nm)] = short

    def resolve(map_name):
        return lookup.get(_norm(map_name))
    return resolve


def read_veteran_stars(resolve):
    """Per-college Veteran Star flag (funding-name → bool) from veteran_jst.json —
    a college where >= star_threshold (0.75) of enrolled veterans have a JST
    uploaded in MAP. This is the auto-computed "75% veteran JSTs" eligibility
    qualifier on the funding tab (Sam, 2026-07-27). Graceful if the file is
    absent (a fetch-less run keeps the tab's JST sector 'pending')."""
    if not os.path.exists(VETERAN_JST):
        return None
    try:
        with open(VETERAN_JST, encoding="utf-8") as f:
            vj = json.load(f)
    except (ValueError, OSError):
        return None
    stars, n = {}, 0
    for map_name, rec in (vj.get("colleges") or {}).items():
        fname = resolve(map_name)
        if not fname:
            continue
        met = bool(rec.get("star"))
        stars[fname] = met
        if met:
            n += 1
    if not stars:
        return None
    return {
        "colleges": stars,
        "as_of": (vj.get("scraped_at") or "").split("T")[0],
        "threshold": vj.get("star_threshold"),
        "n": n,
    }


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
    i_ecr = cm.get("Eligible Credits")
    i_pot = cm.get("Potential Student")
    i_test = cm.get("Test Student")
    i_sid = cm.get("MAP Internal StudentID")
    if i_tcr is None or i_sid is None:
        print("funding-performance: required columns missing — exiting 0 without changes.")
        return

    resolve = _name_resolver()
    feeder_resolve = _feeder_resolver()
    metrics = ("pe", "p2", "p3", "pp")
    seen = {m: set() for m in metrics}          # per-(college,sid) dedupe
    state_seen = {m: set() for m in metrics}    # statewide distinct (cross-college dedupe by sid)
    counts = {}                                 # funding-name -> {pe,p2,p3,pp}
    unmatched = {}
    state = {m: 0 for m in metrics}
    feeder_counts = {}                          # feeder-short -> {pe}  (F1 eligible headcount)
    feeder_seen = set()                         # per-(feeder,sid) dedupe
    rowno = 0
    for row in ds["rows"]:
        rowno += 1
        college = (row[i_col] or "").strip()
        if not college or college in TEST_COLLEGES:
            continue
        if i_test is not None and (row[i_test] or "").strip().lower() == "yes":
            continue
        # pe/p2/p3 count DOCUMENTED students (Potential excluded, as before); the
        # new `pp` counts PORTAL-ORIGIN students (Potential Student = Yes) with
        # transcribed CPL — the "from the CPL Student Portal / Landing Page"
        # metric (added 2026-07-27 per Sam; a tiny, mostly-test cohort until the
        # Portal launches). We no longer skip Potential rows outright — we route
        # them to pp instead.
        is_potential = i_pot is not None and (row[i_pot] or "").strip().lower() == "yes"
        try:
            tcr = float((row[i_tcr] or "0").strip() or 0)
        except ValueError:
            continue
        try:
            ecr = float((row[i_ecr] or "0").strip() or 0) if i_ecr is not None else 0.0
        except ValueError:
            ecr = 0.0
        if tcr <= 0 and ecr <= 0:
            continue
        sid = (row[i_sid] or "").strip()
        fname = resolve(college)
        if not fname:
            # Not a funding college — is it a noncredit FEEDER campus? If so, count
            # its F1 eligible headcount (distinct students with eligible units in
            # MAP; same "eligible" measure as `pe`, Potential/Test excluded) and
            # DON'T route it to `unmatched`. Empty until campuses attach exhibits.
            fshort = feeder_resolve(college)
            if fshort:
                if ecr > 0 and not is_potential:
                    fk = (fshort, sid) if sid else (fshort, f"row{rowno}")
                    if fk not in feeder_seen:
                        feeder_seen.add(fk)
                        feeder_counts.setdefault(fshort, {"pe": 0})["pe"] += 1
                continue
        bucket = counts if fname else unmatched
        key = fname or college
        rec = bucket.setdefault(key, {m: 0 for m in metrics})
        for metric, hit in (("pe", ecr > 0 and not is_potential),
                            ("p3", tcr > 0 and not is_potential),
                            ("p2", tcr >= P2_MIN_UNITS and not is_potential),
                            ("pp", tcr > 0 and is_potential)):
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

    # `pp` (portal-origin) is shown RAW, not <5-suppressed (Sam, 2026-07-27):
    # the privacy gate for it is the Test Student field (Test = Yes already
    # excluded above), and the small portal count itself IS the signal to
    # surface per college. pe/p2/p3 keep the ratified <5 suppression (real
    # students — adr-funding-priority-metrics-privacy.md).
    NO_SUPPRESS = {"pp"}

    def suppress(bucket):
        outb = {}
        for name, rec in sorted(bucket.items()):
            o = {}
            for metric in metrics:
                n = rec.get(metric, 0)
                if metric not in NO_SUPPRESS and 0 < n < SUPPRESS_BELOW:
                    o[metric] = None
                    o[metric + "_suppressed"] = True
                else:
                    o[metric] = n
            outb[name] = o
        return outb

    def suppress_feeders(bucket):
        out = {}
        for short, rec in sorted(bucket.items()):
            n = rec.get("pe", 0)
            if 0 < n < SUPPRESS_BELOW:
                out[short] = {"pe": None, "pe_suppressed": True}
            else:
                out[short] = {"pe": n}
        return out

    payload = {
        "as_of": (ds["generated_at"] or "").split("T")[0] or date.today().isoformat(),
        "basis": ("MAP " + VIEW + " — distinct students per college; "
                  "Test students and test colleges excluded; "
                  "P2 = transcribed CPL units >= 6, P3 = any transcribed CPL, "
                  "PE = any eligible CPL units identified, "
                  "PP = portal-origin (Potential Student = Yes) with any transcribed CPL "
                  "(the CPL Student Portal / Landing Page metric; small & mostly test until launch) (per MAP)"),
        "suppress_below": SUPPRESS_BELOW,
        "statewide": state,
        "colleges": suppress(counts),
        "unmatched": suppress(unmatched),
        # F1 (noncredit feeder eligible headcount) — per-feeder short -> {pe}.
        # Empty until the feeders attach exhibits to their NC records in MAP.
        "feeders": suppress_feeders(feeder_counts),
    }
    # Veteran Star (>=75% of enrolled veterans' JSTs uploaded) — the auto-computed
    # eligibility qualifier for the funding tab's Elig glyph (Sam, 2026-07-27).
    vet = read_veteran_stars(resolve)
    if vet:
        payload["vet_star"] = vet["colleges"]
        payload["vet_star_as_of"] = vet["as_of"]
        payload["vet_star_threshold"] = vet["threshold"]
        payload["vet_star_n"] = vet["n"]
    with open(out, "w", encoding="utf-8") as f:
        f.write(
            "// CPL funding priority-metric actuals (P2/P3 + the PE eligible-students\n"
            "// context column) — generated daily by\n"
            "// funding/_build_funding_performance.py from the transient CustomReport\n"
            "// pull. Aggregate, small-cell-suppressed counts ONLY (see\n"
            "// docs/kb-notes/adr-funding-priority-metrics-privacy.md). Do not hand-edit.\n"
            "window.CPL_FUNDING_PERF = " + json.dumps(payload, indent=1, ensure_ascii=False) + ";\n"
        )
    sup = sum(1 for r in payload["colleges"].values() for m in ("p2", "p3") if r.get(m) is None)
    print(f"wrote {os.path.normpath(out)}: {len(payload['colleges'])} colleges "
          f"({sup} suppressed cells), {len(payload['unmatched'])} unmatched, "
          f"{len(payload['feeders'])} feeders (F1 eligible), "
          f"statewide pe={state['pe']:,} p2={state['p2']:,} p3={state['p3']:,} "
          f"pp={state['pp']:,}, as_of {payload['as_of']}")


if __name__ == "__main__":
    main()
