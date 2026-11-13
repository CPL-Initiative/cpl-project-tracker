#!/usr/bin/env python3
"""The harvest gap census gives each program one cause and one lever, and its counts add up.

WHY. kb/_harvest_gap_census.py ranks the changes that would move the most active programs to a
passing record (Sam, 2026-11-12: "we need to increase our throughput"). A census whose causes
overlap, or whose lever counts are not their members, ranks the wrong lever first and sends a
session to the wrong college. Pinned here on a small fixture built in a scratch directory, never on
the committed or live files:

  * every program outside the passing set takes exactly one cause from the closed list;
  * the causes and the passing count sum to the universe;
  * a lever's count equals its members, and the levers' members partition the gap;
  * passing and places-none are the scorer's own (passes_live, places_none), read through the live
    row's flat checks;
  * a live row decides before the filed record, a parked college wins over every other cause, and
    a paid lever's estimate is its count times the college's cost per program.

Run from repo root: python3 tests/harvest_gap_census_test.py
"""
import json
import os
import shutil
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _harvest_gap_census as G  # noqa: E402

checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


def score(cov=True, inv=True, arith="equal", placed=3, listed=3, why=None, measure="units"):
    return {"measure": measure, "coverage": {"pass": cov, "placed": placed, "listed": listed},
            "invented": {"pass": inv}, "arithmetic": {"status": arith, "why": why or []}}


def write(base, slug, college, sources, records, cost=0.1, capture=True):
    d = os.path.join(base, slug)
    os.makedirs(os.path.join(d, "records"))
    json.dump({"college": college, "cost_per_program": cost}, open(os.path.join(d, "summary.json"), "w"))
    acct = {"college": college, "catalog_url": "https://catalog.%s.edu/" % slug}
    json.dump(acct, open(os.path.join(d, "capture.json" if capture else "capture_preview.json"), "w"))
    if capture:
        json.dump([{"control_number": cn, "title": cn, "method": m} for cn, m in sources.items()],
                  open(os.path.join(d, "sources.json"), "w"))
    for cn, sc in records.items():
        json.dump({"control_number": cn, "score": sc}, open(os.path.join(d, "records", cn + ".json"), "w"))


tmp = tempfile.mkdtemp()
try:
    write(tmp, "alpha", "Alpha College", {
        "A1": "sitemap_page",    # live passes
        "A2": "sitemap_page",    # live fails coverage
        "A3": "sitemap_page",    # live fails a course added
        "A4": "sitemap_page",    # live unequal; filed record passes -> reread
        "A5": "sitemap_page",    # filed passes, never loaded
        "A6": "sitemap_page",    # filed places none
        "A7": "no_closed_list",
        "A8": "not_found",
        "A9": "page_claimed",
        "A10": "pdf_pages",      # found, never extracted
        "A11": "sitemap_page",   # live incomplete; filed names a GE pattern with no units
        "A12": "sitemap_page",   # filed record, error (no score)
        "A14": "no_closed_list",  # the file now lists its courses
        "A15": "sitemap_page",   # live unstated: the tab counts it passing
        "A16": "sitemap_page",   # live unstated, coverage fails
        "A17": "sitemap_page",   # filed unstated whose own test failed, never loaded
    }, {
        "A1": score(), "A2": score(cov=False), "A3": score(inv=False), "A4": score(),
        "A5": score(), "A6": score(cov=False, placed=0),
        "A11": score(arith="incomplete", why=["the record names the degree total and the X pattern, but no units for it"]),
        "A12": None,
        "A15": score(arith="unstated", measure="hours"), "A16": score(cov=False, arith="unstated", measure="hours"),
        "A17": dict(score(arith="unstated", measure="hours"),
                    arithmetic={"status": "unstated", "pass": False,
                                "why": ["the record states no figure, but the catalog text names 1.5 HOURS"]}),
    }, cost=0.2)
    write(tmp, "beta", "Beta College", {"B1": "sitemap_page"}, {"B1": score(arith="unequal")})
    write(tmp, "gamma", "Gamma College", {}, {}, capture=False)   # a preview found no pages
    committed = G.read_committed(tmp)

    universe = [{"college": "Alpha College", "control_number": c} for c in
                ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10", "A11", "A12", "A13", "A14",
                 "A15", "A16", "A17"]]
    universe += [{"college": "Beta College", "control_number": "B1"},
                 {"college": "Gamma College", "control_number": "G1"},
                 {"college": "Delta College", "control_number": "D1"}]
    live = {
        "A1": {"checks": {"coverage": True, "invented": True, "arithmetic": "equal"}},
        "A2": {"checks": {"coverage": False, "invented": True, "arithmetic": "equal"}},
        "A3": {"checks": {"coverage": True, "invented": False, "arithmetic": "equal"}},
        "A4": {"checks": {"coverage": True, "invented": True, "arithmetic": "unequal"}},
        "A11": {"checks": {"coverage": True, "invented": True, "arithmetic": "incomplete"}},
        "A15": {"checks": {"coverage": True, "invented": True, "arithmetic": "unstated"}},
        "A16": {"checks": {"coverage": False, "invented": True, "arithmetic": "unstated"}},
        "B1": {"checks": {"coverage": True, "invented": True, "arithmetic": "unequal"}},
    }
    registry = {"Delta College": "https://www.delta.edu/catalog", "Gamma College": "https://gamma.edu/c"}
    closed_now = {"A7": False, "A14": True}
    r = G.census(universe, committed, live, registry, closed_now, parked={"Beta College": "fixture"})
    by = {p["control_number"]: p for p in r["programs"]}

    want = {"A2": "coverage_fails", "A3": "course_added", "A4": "units_unequal", "A5": "not_loaded",
            "A6": "places_none", "A7": "no_closed_list", "A8": "page_not_found", "A9": "page_not_found",
            "A10": "found_not_extracted", "A11": "units_incomplete", "A12": "extraction_error",
            "A13": "not_in_capture", "A14": "no_closed_list", "A16": "coverage_fails",
            "A17": "not_loaded", "B1": "parked_college",
            "G1": "college_never_read", "D1": "college_never_read"}
    for cn, cause in want.items():
        check(by.get(cn, {}).get("cause") == cause, "%s takes %s, got %s" % (cn, cause, by.get(cn, {}).get("cause")))
    check("A1" not in by and "A15" not in by and r["passing"] == 2,
          "the live passes are passing, through passes_live: an equal row and an unstated one (the tab's test)")
    check(by.get("A17", {}).get("sub") == "filed record passes",
          "a filed unstated record the tab would count passing is a load away, whatever its own unstated test said")
    check(not any(p["cause"] == "units_unstated" for p in r["programs"]),
          "'live, no figure stated' holds no row the tab counts passing")
    check(len(by) == len(r["programs"]), "no program appears twice in the gap")
    check(all(p["cause"] in G.CAUSE_IDS for p in r["programs"]), "every cause is on the closed list")
    check(r["passing"] + sum(r["statewide_by_cause"].values()) == r["universe"] == len(universe),
          "passing and the causes sum to the universe")
    check(sum(sum(v.values()) for v in r["per_college"].values()) == r["gap"],
          "the per-college counts sum to the gap")
    for lv in r["levers"]:
        check(lv["programs"] == len(lv["members"]), "lever %s at %s counts its members" % (lv["lever"], lv["scope"]))
    members = [m for lv in r["levers"] for m in lv["members"]]
    check(sorted(members) == sorted(by), "the levers' members partition the gap")
    check([lv["programs"] for lv in r["levers"]] == sorted((lv["programs"] for lv in r["levers"]), reverse=True),
          "levers rank by programs moved")

    lev = {cn: p["lever"] for cn, p in by.items()}
    check(lev["A4"] == "reread" and by["A4"]["sub"].startswith("filed record passes"),
          "a live failure whose filed record passes is a free reread")
    check(lev["A5"] == "load", "a filed pass never loaded is a free load")
    check(lev["A11"] == "ge_units_steps" and by["A11"]["sub"] == "ge_pattern_no_units",
          "the scorer's GE-pattern reason names the statewide lever")
    check(lev["A7"] == "program_course_file_refresh" and lev["A14"] == "capture_rerun_closed_list_now_filed",
          "a closed list missing from the file is a refresh; one now filed is a capture")
    check(by["B1"]["sub"] == "units_unequal", "a parked college keeps the cause it would carry as its sub-cause")
    check(by["G1"]["sub"] == "capture found no pages", "a preview-only college is never read, its capture named")
    paid = [lv for lv in r["levers"] if lv["lever"] == "paid_read" and lv["scope"] == "Alpha College"][0]
    check(paid["estimate_usd"] == round(paid["programs"] * 0.2, 2) and paid["kind"] == "paid",
          "a paid lever's estimate is its count times the college's cost per program")
    first = [lv for lv in r["levers"] if lv["lever"] == "first_read" and lv["scope"] == "Delta College"][0]
    check(first["estimate_usd"] == round(G.statistics.median([0.2, 0.1, 0.1]), 4), "an unread college is priced at the median")
    hosts = [w["host"] for w in r["next_wave"]]
    check(len(hosts) == len(set(hosts)), "the next wave names one college per host")
    check("delta.edu" in hosts, "the next wave reads the host from the registry, without www")

    # The live row's flat checks go through the scorer's own passes_live.
    check(G.S.passes_live(G.live_score({"coverage": True, "invented": True, "arithmetic": "equal"})),
          "flat passing checks pass")
    check(G.S.passes_live(G.live_score({"coverage": True, "invented": True, "arithmetic": "unstated"})),
          "an unstated figure passes live, as the tab and program_record_machine_pass count it")
    check(not G.S.passes_live(G.live_score({"coverage": False, "invented": True, "arithmetic": "unstated"})),
          "an unstated row whose coverage fails does not")

    # With no live read: the committed files decide, and loaded state is unknown.
    r2 = G.census(G.universe_from_committed(committed), committed, None, {}, None, parked={})
    by2 = {p["control_number"]: p for p in r2["programs"]}
    check(by2["A2"]["cause"] == "unknown_without_live" and by2["A2"]["sub"] == "coverage_fails",
          "without live a failing filed record is unknown, its failing check its sub-cause")
    check(by2["A7"]["lever"] == "program_course_file_check", "without the file's rows the closed list is a check")
    check(r2["passing"] + r2["gap"] == r2["universe"], "the committed-only view sums too")
    back = json.loads(G.dumps(r))
    check("programs" not in back and sum(len(v) for v in back["programs_by_college"].values()) == r["gap"],
          "the committed JSON keeps every gap program, by college")
    md = G.render_md(r, "fixture")
    check("| Cause | Programs |" in md and "Next wave" in md, "the table a person reads carries causes and the wave")
finally:
    shutil.rmtree(tmp)

if failures:
    print("FAIL: harvest gap census (%d of %d)" % (len(failures), checks[0]))
    for f in failures:
        print("  -", f)
    sys.exit(1)
print("%d/%d checks passed: harvest gap census" % (checks[0], checks[0]))
