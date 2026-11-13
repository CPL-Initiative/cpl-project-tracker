#!/usr/bin/env python3
"""The harvest gap census: where the active programs without a passing record are, and why.

Sam, 2026-11-12, in session (S644): "I want to continue progress on our commons harvesting. we are
making great progress but we need to increase our throughput." The program requirements harvest
(lane: docs/reference/lanes/program-requirements-harvest.md) picked its next college by hand, one at
a time, with no ranked account of why each program lacks a passing record. This census gives every
active program without one exactly ONE cause from a closed list (CAUSES), then one lever (LEVERS):
the one change that would move it, free or paid, with the estimate. A person reads the table in
kb/status/harvest_gap_census.md; the JSON beside it carries every count.

THE UNIVERSE is the tab's own: one coci_college_programs row per control number with status exactly
'Active' (program_requirements.js, the S415 headline; queue_status.py HEADLINE_SQL). Teachout and
Approved rows the harvest also reads are counted apart, never inside it.

PASSING is the tab's count, the scorer's counts_passing_on_tab over the live row's flat checks: coverage
and invented true and the arithmetic "equal" or "unstated" (program_requirements.js machineFails, the
headline's complete count; S644), so the census headline equals the tab's. A row the tab counts passing
whose filed score fails the scorer's own unstated test (the page names a figure the record lacks) is
listed apart, as TAB_ONLY, and is no gap. The harvest's holds keep passes_live, equal-only (S641 review,
call 3), for the sub-causes that ask whether a filed record passes. places_none is the scorer's too
(kb/_program_requirements_score.py). Neither is restated here: the live table's flat checks
(_program_requirements_load.py writes coverage and invented as booleans, arithmetic as a status) are
handed to the scorer as they are, or put back in the score's shape for passes_live.

READS. On a runner, anon REST through the college script's own fetch_all (limit and offset, a page
of PAGE_SIZE at a time): coci_college_programs, program_requirement_records (college, control
number, checks), program_source_registry (catalog_url), and coci_program_courses only for the
programs a capture filed with no closed list. In a sandbox or a test, --from FILE reads the same
four lists from a JSON export ({"programs", "records", "registry", "program_courses"}). With
neither, --committed-only gives the view the committed files alone can show: the universe becomes
the programs the captures listed, and the causes that need the live table cannot be told apart.
Then the committed files under kb/program_requirements_college/<slug>/ (sources.json, records/,
summary.json, capture.json or capture_preview.json, kept_passing.json).

Writes no table. Workflow: .github/workflows/harvest-gap-census.yml (dispatch only, anon only).
Guard: tests/harvest_gap_census_test.py.
"""
from __future__ import annotations

import argparse
import collections
import json
import os
import statistics
import sys
import urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import _program_requirements_college as C  # noqa: E402
import _program_requirements_score as S  # noqa: E402

COLLEGE_DIR = os.path.join(HERE, "program_requirements_college")
OUT_JSON = os.path.join(HERE, "status", "harvest_gap_census.json")
OUT_MD = os.path.join(HERE, "status", "harvest_gap_census.md")

# Sam's limit for a paid read with no card (2026-10-14, sam-extraction-standing-go-40-per-college-2026-10-14).
COLLEGE_LIMIT_USD = 40.0

# The capture's methods that hand a program a page (sources.json "method").
FOUND_METHODS = {"sitemap_page", "pdf_pages", "link_search"}

# Colleges the lane parks (each a cpl_memory decision or the queue's stopping rule). A program there
# takes the cause parked_college, with the cause it would otherwise carry as its sub-cause.
PARKED = {
    "Glendale Community College": "glendale-parked-2026-10-30",
    "Los Angeles Valley College": "lavc-parked-2026-10-31",
    "Los Medanos College": "parked until an electives sentence in its own words (lane, S633)",
    "Monterey Peninsula College": "the queue's stopping rule (Sam, 2026-10-30; status file, S641)",
}

# The closed list. Each gap program takes exactly one, in this order of precedence.
CAUSES = [
    ("parked_college", "parked college"),
    ("college_never_read", "college never read"),
    ("not_in_capture", "program not in the college's capture"),
    ("no_closed_list", "no closed list in the Program Course File"),
    ("page_not_found", "page not found"),
    ("found_not_extracted", "page found, never extracted"),
    ("places_none", "extracted, places none of its courses"),
    ("not_loaded", "extracted, not loaded"),
    ("extraction_error", "extracted, no score (an error)"),
    ("coverage_fails", "live, coverage fails"),
    ("course_added", "live, a course added"),
    ("units_unequal", "live, units unequal"),
    ("units_incomplete", "live, units incomplete"),
    ("units_unstated", "live, no figure stated"),
    ("unknown_without_live", "filed record fails, live state unknown"),
]
CAUSE_IDS = [c for c, _ in CAUSES]
# Listed beside the gap, never in it: the tab counts the row passing on its "unstated" status while the
# filed score's own unstated test fails.
TAB_ONLY = ("tab_passes_scorer_fails", "counts as passing on the tab; the scorer's own test fails")
CAUSE_WORDS = dict(CAUSES)


def norm_cn(cn) -> str:
    return str(cn or "").strip()


def host_of(url: str | None) -> str | None:
    if not url:
        return None
    h = urllib.parse.urlparse(url).netloc.lower()
    return h[4:] if h.startswith("www.") else (h or None)


def flat_checks(score: dict | None) -> dict:
    """A filed score's three checks as the load writes them to the live row (booleans and a status)."""
    sc = score or {}
    return {"coverage": (sc.get("coverage") or {}).get("pass"), "invented": (sc.get("invented") or {}).get("pass"),
            "arithmetic": (sc.get("arithmetic") or {}).get("status")}


def scorer_unstated_fails(checks: dict | None, filed: dict | None) -> bool:
    """A row the tab counts passing on "unstated" whose filed score's own unstated test failed."""
    a = (filed or {}).get("arithmetic") or {}
    return (checks or {}).get("arithmetic") == "unstated" and a.get("status") == "unstated" and a.get("pass") is False


def live_score(checks: dict | None) -> dict:
    """The live row's flat checks in the score's shape, so the scorer's own passes_live reads them."""
    c = checks or {}
    return {"coverage": {"pass": c.get("coverage")}, "invented": {"pass": c.get("invented")},
            "arithmetic": {"status": c.get("arithmetic")}}


def failing_check(score: dict) -> str:
    """The first check a non-passing score fails, in passes_live's own order."""
    if (score.get("coverage") or {}).get("pass") is not True:
        return "coverage_fails"
    if (score.get("invented") or {}).get("pass") is not True:
        return "course_added"
    st = (score.get("arithmetic") or {}).get("status")
    return {"unequal": "units_unequal", "incomplete": "units_incomplete",
            "unstated": "units_unstated"}.get(st, "units_incomplete")


def units_sub(score: dict | None) -> str | None:
    """Where the filed record shows why its units fail: a general education pattern named with no
    units (the scorer's degree_check reason; fact-ge-pattern-no-units-shared-cause-2026-11-12), or a
    noncredit record measured in hours (docs/harvest_wave3_diagnoses_s639.md, cause 2)."""
    sc = score or {}
    arith = sc.get("arithmetic") or {}
    if arith.get("status") == "equal":
        return None
    if any("pattern, but no units for it" in (w or "") for w in arith.get("why") or []):
        return "ge_pattern_no_units"
    if sc.get("measure") == "hours":
        return "noncredit_hours"
    return None


# ── the committed files ────────────────────────────────────────────────────
def read_college_dir(path: str) -> dict:
    """One college's committed harvest: its capture account, each program's method, each filed score."""
    def load(name):
        p = os.path.join(path, name)
        if not os.path.exists(p):
            return None
        with open(p, encoding="utf-8") as fh:
            return json.load(fh)
    summary = load("summary.json") or {}
    capture = load("capture.json")
    preview = load("capture_preview.json")
    sources = load("sources.json") or []
    records = {}
    rd = os.path.join(path, "records")
    if os.path.isdir(rd):
        for f in sorted(os.listdir(rd)):
            if f.endswith(".json"):
                with open(os.path.join(rd, f), encoding="utf-8") as fh:
                    r = json.load(fh)
                records[norm_cn(r.get("control_number") or f[:-5])] = r.get("score")
    kept = load("kept_passing.json") or {}
    acct = capture or preview or {}
    return {
        "college": summary.get("college") or acct.get("college"),
        "read": bool(sources) and capture is not None,
        "preview_only": capture is None and preview is not None,
        "catalog_url": acct.get("catalog_url"),
        "cost_per_program": summary.get("cost_per_program"),
        "methods": {norm_cn(s.get("control_number")): s.get("method") for s in sources},
        "titles": {norm_cn(s.get("control_number")): s.get("title") for s in sources},
        "records": records,
        "kept": {norm_cn(k.get("control_number")) for k in kept.get("programs") or []},
    }


def read_committed(base: str = COLLEGE_DIR) -> dict:
    out = {}
    for slug in sorted(os.listdir(base)) if os.path.isdir(base) else []:
        p = os.path.join(base, slug)
        if os.path.isdir(p):
            out[slug] = read_college_dir(p)
    return out


# ── the live reads ─────────────────────────────────────────────────────────
def read_live() -> dict:
    """The four lists by anon REST, through the college script's own pager."""
    programs = C.fetch_all("coci_college_programs?select=college,control_number,status,program_title"
                           "&or=(status.like.Active*,status.eq.Approved)&order=college,control_number")
    records = C.fetch_all("program_requirement_records?select=college,control_number,checks"
                          "&order=college,control_number")
    registry = C.fetch_all("program_source_registry?select=college,catalog_url&order=college")
    return {"programs": programs, "records": records, "registry": registry, "program_courses": None}


def live_closed_lists(asks: dict[str, list[str]]) -> list[dict]:
    """For each college's no-closed-list programs, the rows the Program Course File holds now."""
    out = []
    for college, cns in sorted(asks.items()):
        for i in range(0, len(cns), 150):
            part = ",".join(urllib.parse.quote('"%s"' % c, safe="") for c in cns[i:i + 150])
            out += C.fetch_all("coci_program_courses?select=college,program_control_number&college=eq.%s"
                               "&program_control_number=in.(%s)&order=program_control_number"
                               % (urllib.parse.quote(college, safe=""), part))
    return out


# ── the census ─────────────────────────────────────────────────────────────
def assign(prog: dict, col: dict | None, live_rec: dict | None, live: bool, parked: dict) -> tuple[str, str | None]:
    """One program's (cause, sub-cause). `prog` is passing-or-not already known to be not passing."""
    cn = prog["control_number"]
    cause, sub = None, None
    score = (col or {}).get("records", {}).get(cn, "absent")
    filed = score if isinstance(score, dict) else None
    if live_rec is not None:
        # A live row decides by its own checks; the filed record names the sub-cause where it can.
        cause = failing_check(live_score(live_rec.get("checks")))
        if filed is not None and S.passes_live(filed):
            sub = "filed record passes (reread not run)"
        elif filed is None:
            sub = "no filed record"
        elif cause.startswith("units_"):
            sub = units_sub(filed)
    elif col is None or not col["read"]:
        cause, sub = "college_never_read", ("capture found no pages" if col and col["preview_only"] else None)
    else:
        method = col["methods"].get(cn)
        if method is None and score == "absent":
            cause = "not_in_capture"
        elif score != "absent":
            if score is None:
                cause = "extraction_error"
            elif S.places_none(score):
                cause = "places_none"
            elif live:
                cause = "not_loaded"
                sub = "filed record passes" if S.passes_live(score) else "filed record fails"
            else:
                cause = "unknown_without_live"
                us = units_sub(score)
                sub = failing_check(score) + ((":" + us) if us else "")
        elif method == "no_closed_list":
            cause = "no_closed_list"
        elif method in FOUND_METHODS:
            cause = "found_not_extracted"
        else:
            cause, sub = "page_not_found", method
    name = (col or {}).get("college") or prog.get("college")
    if name in parked:
        return "parked_college", cause + ((":" + sub) if sub else "")
    return cause, sub


def lever_of(cause: str, sub: str | None, college: str, closed_now: bool | None) -> tuple[str, str]:
    """(lever id, scope) for one gap program: the one change that would move it."""
    if cause == "parked_college":
        return "unpark", college
    if cause == "college_never_read":
        return "first_read", college
    if cause == "not_in_capture":
        return "capture_and_read", college
    if cause == "no_closed_list":
        if closed_now is True:
            return "capture_rerun_closed_list_now_filed", college
        if closed_now is False:
            return "program_course_file_refresh", "statewide"
        return "program_course_file_check", "statewide"
    if cause == "page_not_found":
        return "reader_page_search", college
    if cause == "found_not_extracted":
        return "paid_read", college
    if cause == "places_none":
        return "reader_page_assignment", college
    if cause == "not_loaded":
        return ("load", college) if sub == "filed record passes" else ("reconcile_then_load", college)
    if cause == "extraction_error":
        return "paid_read", college
    if sub == "filed record passes (reread not run)":
        return "reread", college
    if sub and sub.endswith("ge_pattern_no_units"):
        return "ge_units_steps", "statewide"
    if sub and sub.endswith("noncredit_hours"):
        return "scorer_noncredit_hours", "statewide"
    return "reconcile_steps", college


LEVER_WORDS = {
    "unpark": ("free", "a session takes the parked college back up under its decision"),
    "first_read": ("paid", "a first read of a college never read (capture free, extraction paid)"),
    "capture_and_read": ("paid", "a fresh capture lists the program, then its extraction"),
    "capture_rerun_closed_list_now_filed": ("paid", "the Program Course File now lists its courses: a fresh capture, then extraction"),
    "program_course_file_refresh": ("free", "the Program Course File lists no course for it: program-course-fetch.yml, or none exists"),
    "program_course_file_check": ("free", "check the Program Course File for its courses (needs the live read)"),
    "reader_page_search": ("free", "a reader change finds the program's page (a free page read first)"),
    "paid_read": ("paid", "extraction of a page the capture already found"),
    "reader_page_assignment": ("paid", "a reader change hands it its own page, then extraction"),
    "load": ("free", "step=load: the filed record passes and was never loaded"),
    "reconcile_then_load": ("free", "the filed record fails: reconcile steps, then step=load"),
    "reread": ("free", "step=reread: the filed record passes and the live row is older"),
    "ge_units_steps": ("free", "reconcile steps give the general education pattern its units"),
    "scorer_noncredit_hours": ("free", "a scorer reading for a noncredit total in hours"),
    "reconcile_steps": ("free", "the pipeline's reconcile steps for the college, on the catalog's own words"),
}


def census(universe: list[dict], committed: dict, records: dict | None, registry: dict,
           closed_now: dict | None = None, parked: dict | None = None,
           outside: dict | None = None) -> dict:
    """universe: [{college, control_number}]; committed: read_committed(); records: {cn: live row} or
    None when there is no live read; registry: {college: catalog_url}; closed_now: {cn: bool}."""
    parked = PARKED if parked is None else parked
    live = records is not None
    by_slug = committed
    gap, passing, tab_only = [], 0, []
    for prog in universe:
        cn = norm_cn(prog["control_number"])
        slug = C.slug_of(prog["college"])
        col = by_slug.get(slug)
        rec = (records or {}).get(cn)
        filed = (col or {}).get("records", {}).get(cn)
        filed = filed if isinstance(filed, dict) else None
        if live:
            checks = rec.get("checks") if rec is not None else None
        else:
            checks = flat_checks(filed) if filed is not None else None
        if checks is not None and S.counts_passing_on_tab(checks):
            passing += 1
            if scorer_unstated_fails(checks, filed):
                tab_only.append({"college": (col or {}).get("college") or prog["college"], "control_number": cn})
            continue
        cause, sub = assign({"control_number": cn, "college": prog["college"]}, col, rec, live, parked)
        college = (col or {}).get("college") or prog["college"]
        lever, scope = lever_of(cause, sub, college, (closed_now or {}).get(cn) if closed_now is not None else None)
        gap.append({"college": college, "control_number": cn, "cause": cause, "sub": sub,
                    "lever": lever, "scope": scope})

    by_cause = collections.Counter(g["cause"] for g in gap)
    by_sub = collections.Counter((g["cause"], g["sub"]) for g in gap if g["sub"])
    per_college = {}
    for g in gap:
        pc = per_college.setdefault(g["college"], collections.Counter())
        pc[g["cause"]] += 1

    costs = [c["cost_per_program"] for c in committed.values() if c.get("cost_per_program")]
    median_cost = round(statistics.median(costs), 4) if costs else None
    cost_by_college = {c["college"]: c.get("cost_per_program") for c in committed.values() if c.get("college")}

    levers = collections.OrderedDict()
    for g in gap:
        key = (g["lever"], g["scope"])
        L = levers.setdefault(key, {"lever": g["lever"], "scope": g["scope"], "members": []})
        L["members"].append(g["control_number"])
    out_levers = []
    for (lid, scope), L in levers.items():
        kind, words = LEVER_WORDS[lid]
        n = len(L["members"])
        est = None
        if kind == "paid":
            cpp = cost_by_college.get(scope) or median_cost
            est = round(n * cpp, 2) if cpp else None
        out_levers.append({"lever": lid, "scope": scope, "programs": n, "kind": kind, "what": words,
                           "estimate_usd": est,
                           "over_college_limit": bool(est is not None and scope != "statewide" and est > COLLEGE_LIMIT_USD),
                           "members": sorted(L["members"])})
    out_levers.sort(key=lambda x: (-x["programs"], x["lever"], x["scope"]))

    # The next wave: one college per catalog host, by the programs a read there would gain.
    paid_gain = collections.Counter()
    for g in gap:
        if g["lever"] in ("first_read", "paid_read", "capture_and_read", "reader_page_assignment",
                          "capture_rerun_closed_list_now_filed"):
            paid_gain[g["college"]] += 1
    hosts = {}
    for college, n in paid_gain.items():
        url = registry.get(college)
        if not url:
            for c in committed.values():
                if c.get("college") == college:
                    url = c.get("catalog_url")
        h = host_of(url) or "(no catalog address)"
        cpp = cost_by_college.get(college) or median_cost
        cand = {"college": college, "host": h, "programs": n,
                "estimate_usd": round(n * cpp, 2) if cpp else None,
                "read_before": any(c.get("college") == college and c["read"] for c in committed.values())}
        if h not in hosts or n > hosts[h]["programs"]:
            hosts[h] = cand
    wave = sorted(hosts.values(), key=lambda x: (-x["programs"], x["college"]))

    return {
        "basis": "live" if live else "committed files only",
        "universe": len(universe),
        "passing": passing,
        "gap": len(gap),
        "outside_universe": outside or {},
        "tab_only": {"cause": TAB_ONLY[0], "what": TAB_ONLY[1], "programs": len(tab_only),
                     "members": sorted(tab_only, key=lambda x: (x["college"], x["control_number"]))},
        "statewide_by_cause": {c: by_cause.get(c, 0) for c in CAUSE_IDS},
        "sub_causes": [{"cause": c, "sub": s, "programs": n}
                       for (c, s), n in sorted(by_sub.items(), key=lambda x: -x[1])],
        "per_college": {k: dict(sorted(v.items())) for k, v in sorted(per_college.items())},
        "median_cost_per_program": median_cost,
        "college_limit_usd": COLLEGE_LIMIT_USD,
        "levers": out_levers,
        "next_wave": wave,
        "programs": gap,
    }


def universe_from_live(programs: list[dict]) -> tuple[list[dict], dict]:
    seen, uni, outside = set(), [], collections.Counter()
    for p in programs:
        cn = norm_cn(p.get("control_number"))
        if p.get("status") != "Active":
            outside[p.get("status") or "(none)"] += 1
            continue
        if cn in seen:
            continue
        seen.add(cn)
        uni.append({"college": p.get("college"), "control_number": cn})
    return uni, dict(outside)


def universe_from_committed(committed: dict) -> list[dict]:
    uni, seen = [], set()
    for c in committed.values():
        if not c["read"]:
            continue
        for cn in sorted(c["methods"]):
            if cn not in seen:
                seen.add(cn)
                uni.append({"college": c["college"], "control_number": cn})
    return uni


# ── the files a person reads ───────────────────────────────────────────────
def render_md(r: dict, when: str) -> str:
    L = ["# Harvest gap census", "",
         "Written by `kb/_harvest_gap_census.py` (%s, %s). Every active program without a passing "
         "record, each with one cause and one lever. Counts are a snapshot; rerun "
         "`harvest-gap-census.yml` for today's." % (when, r["basis"]), "",
         "Universe %d · passing %d · without a passing record %d." % (r["universe"], r["passing"], r["gap"]), ""]
    if (r.get("tab_only") or {}).get("programs"):
        L += ["Of the passing, %d %s (listed in the JSON, not counted as gaps)."
              % (r["tab_only"]["programs"], r["tab_only"]["what"]), ""]
    if r["outside_universe"]:
        L += ["Read by the harvest but outside the universe: " + ", ".join(
            "%s %d" % (k, v) for k, v in sorted(r["outside_universe"].items())) + ".", ""]
    L += ["## By cause", "", "| Cause | Programs |", "|---|---:|"]
    for c in CAUSE_IDS:
        if r["statewide_by_cause"].get(c):
            L.append("| %s | %d |" % (CAUSE_WORDS[c], r["statewide_by_cause"][c]))
    L += ["", "## Top levers", "", "| # | Lever | Where | Programs | Free or paid | Estimate |",
          "|---:|---|---|---:|---|---:|"]
    for i, lv in enumerate(r["levers"][:25], 1):
        est = ("$%.2f" % lv["estimate_usd"]) if lv["estimate_usd"] is not None else ""
        if lv["over_college_limit"]:
            est += " (over the $40 limit)"
        L.append("| %d | %s | %s | %d | %s | %s |" % (i, lv["what"], lv["scope"], lv["programs"], lv["kind"], est))
    L += ["", "## Next wave: one college per catalog host", "",
          "| College | Host | Programs a read would gain | Estimate | Read before |", "|---|---|---:|---:|---|"]
    for w in r["next_wave"][:20]:
        L.append("| %s | %s | %d | %s | %s |" % (w["college"], w["host"], w["programs"],
                                                 ("$%.2f" % w["estimate_usd"]) if w["estimate_usd"] is not None else "",
                                                 "yes" if w["read_before"] else "no"))
    return "\n".join(L) + "\n"


def dumps(r: dict) -> str:
    """The committed JSON: each program as "cause" or "cause|sub" under its college (the full rows
    run to a megabyte), one top-level key a line so a diff reads by key."""
    out = {k: v for k, v in r.items() if k != "programs"}
    pbc = {}
    for g in r["programs"]:
        pbc.setdefault(g["college"], {})[g["control_number"]] = g["cause"] + ("|" + g["sub"] if g["sub"] else "")
    out["programs_by_college"] = {k: dict(sorted(v.items())) for k, v in sorted(pbc.items())}
    lines = ["  %s: %s" % (json.dumps(k), json.dumps(v, ensure_ascii=False, separators=(",", ":")))
             for k, v in out.items()]
    return "{\n" + ",\n".join(lines) + "\n}\n"


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    src = ap.add_mutually_exclusive_group()
    src.add_argument("--from", dest="src", help="a JSON export of the live lists, in place of REST")
    src.add_argument("--committed-only", action="store_true", help="the committed files alone (no live read)")
    ap.add_argument("--export", help="also write the live lists read to this file")
    ap.add_argument("--json", default=OUT_JSON)
    ap.add_argument("--md", default=OUT_MD)
    ap.add_argument("--when", default=None, help="the date stamped in the outputs (default: today, UTC)")
    a = ap.parse_args(argv)
    import datetime
    when = a.when or datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%MZ")
    committed = read_committed()
    if a.committed_only:
        universe, outside, records, registry, closed_now = universe_from_committed(committed), {}, None, {}, None
    else:
        if a.src:
            with open(a.src, encoding="utf-8") as fh:
                data = json.load(fh)
        else:
            data = read_live()
        universe, outside = universe_from_live(data["programs"])
        records = {norm_cn(r["control_number"]): r for r in data["records"]}
        registry = {r["college"]: r.get("catalog_url") for r in data.get("registry") or []}
        rows = data.get("program_courses")
        if rows is None:
            asks = collections.defaultdict(list)
            uni_cns = {u["control_number"]: u["college"] for u in universe}
            for c in committed.values():
                for cn, m in c["methods"].items():
                    if m == "no_closed_list" and cn in uni_cns and cn not in records:
                        asks[uni_cns[cn]].append(cn)
            # An export without the rows leaves the question open (program_course_file_check).
            rows = live_closed_lists(asks) if not a.src else None
            data["program_courses"] = rows
        closed_now = None
        if rows is not None:
            have = {norm_cn(r["program_control_number"]) for r in rows}
            closed_now = {u["control_number"]: (u["control_number"] in have) for u in universe}
        if a.export:
            os.makedirs(os.path.dirname(os.path.abspath(a.export)), exist_ok=True)
            with open(a.export, "w", encoding="utf-8") as fh:
                json.dump(data, fh)
    r = census(universe, committed, records, registry, closed_now, outside=outside)
    r["written_at"] = when
    os.makedirs(os.path.dirname(a.json), exist_ok=True)
    with open(a.json, "w", encoding="utf-8") as fh:
        fh.write(dumps(r))
    with open(a.md, "w", encoding="utf-8") as fh:
        fh.write(render_md(r, when))
    print("universe %d, passing %d, gap %d (%s)" % (r["universe"], r["passing"], r["gap"], r["basis"]))
    for c in CAUSE_IDS:
        if r["statewide_by_cause"][c]:
            print("  %-24s %d" % (c, r["statewide_by_cause"][c]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
