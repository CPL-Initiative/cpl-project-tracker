#!/usr/bin/env python3
"""A wave of the program requirements harvest reads several colleges at once and
files them once (S644; kb/_program_requirements_wave.py,
.github/workflows/program-requirements-wave.yml).

WHY. A wave can spend model calls at up to eight colleges in one dispatch, and its
one table is what the conductor reads before any reread. The ways it goes wrong
are known in advance:

  * Two colleges on one catalog host break the standing rule (never two reads on
    one host); eLumen and Coursedog colleges share the vendor's host too.
  * A limit above Sam's standing $40 a college, or a price over the limit, spends
    without a card.
  * A capture that met HTTP 503s files a partial read as complete (Rio Hondo's
    reconcile read 34 of 328 pages and said nothing, S640).
  * A verify that restates the scorer drifts from it, and a table that sums the
    wrong cost (summary.json's cost_usd counts older runs) misleads the reader.

Each is pinned against the module's OWN functions on fixtures, with no browser
and no network. Run from repo root: python3 tests/program_requirements_wave_test.py
"""
import json
import os
import shutil
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_requirements_wave as W  # noqa: E402
import _program_requirements_college as C  # noqa: E402
import _program_requirements_score as S  # noqa: E402

failures = []
checks = [0]


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


def refused(fn, *a):
    try:
        fn(*a)
    except W.Refused as exc:
        return str(exc)
    return None


check(not {"playwright", "pypdf", "pdfminer"} & set(sys.modules),
      "importing the wave pulled in a runner-only dependency")

# ── plan: names, the cap, the limit, the branch ─────────────────────────────
check(W.parse_colleges(" Cerritos College, Mt. San Antonio College ,,") == ["Cerritos College", "Mt. San Antonio College"],
      "the colleges split on commas, trimmed, empties dropped")
eight = ",".join("College %d" % i for i in range(8))
check(len(W.parse_colleges(eight)) == 8, "eight colleges are a wave")
check("at most 8" in (refused(W.parse_colleges, eight + ",College 9") or ""), "a ninth college is refused")
check("named twice" in (refused(W.parse_colleges, "Cerritos College, cerritos college") or ""),
      "a college named twice is refused, whatever its letter case")
check(refused(W.parse_colleges, " , ") is not None, "a wave naming no college is refused")
check(W.parse_limit("40") == 40.0 and W.parse_limit("12.5") == 12.5, "a limit at or under $40 stands")
check("standing limit" in (refused(W.parse_limit, "40.01") or ""), "a limit above $40 is refused")
check(all(refused(W.parse_limit, v) for v in ("0", "-5", "abc", "nan", "inf")),
      "a limit of zero, below zero, not a number or infinite is refused")
check(W.parse_extract("0") is False and W.parse_extract("1") is True and refused(W.parse_extract, "yes"),
      "extract is 0 or 1 and nothing else")
check(W.check_branch("s644a", "claude/harvest-wave-s644a") is None, "the wave runs on its own branch")
check("never runs on main" in (refused(W.check_branch, "s644a", "main") or ""), "the wave refuses main")
check("this dispatch ran on" in (refused(W.check_branch, "s644a", "claude/harvest-cerritos") or ""),
      "the wave refuses a branch that is not claude/harvest-wave-<wave>")
check(refused(W.check_branch, "S644 A", "claude/harvest-wave-S644 A"), "a wave name with capitals or spaces is refused")

# ── plan: hosts ─────────────────────────────────────────────────────────────
REG = {
    "A College": {"college": "A College", "catalog_url": "https://catalog.a.edu/", "catalog_platform": "courseleaf"},
    "B College": {"college": "B College", "catalog_url": "https://www.catalog.a.edu/programs/", "catalog_platform": "courseleaf"},
    "C College": {"college": "C College", "catalog_url": "https://c.elumenapp.com/catalog/c/", "catalog_platform": "elumen"},
    "D College": {"college": "D College", "catalog_url": "https://d.elumenapp.com/catalog/d/", "catalog_platform": "elumen"},
    "E College": {"college": "E College", "catalog_url": "https://www.e.edu/catalog", "catalog_platform": "custom_html",
                  "procedure": {"catalog": {"start": "https://www.e.edu/catalog", "follow": "Full catalog",
                                            "format": "pdf"}}},
    "F College": {"college": "F College", "catalog_url": "https://f.edu/", "catalog_platform": "custom_html",
                  "procedure": {"catalog": {"start": "https://f.edu/", "file": "https://docs.shared-cms.com/f.pdf",
                                            "format": "pdf"}}},
    "G College": {"college": "G College", "catalog_url": "https://g.edu/", "catalog_platform": "acalog"},
    "H College": {"college": "H College", "catalog_url": "https://h.edu/", "catalog_platform": "acalog"},
}
REG["G College"]["procedure"] = {"catalog": {"start": "https://g.edu/", "file": "https://docs.shared-cms.com/g.pdf",
                                             "format": "pdf"}}
hosts = {n: W.hosts_of(r) for n, r in REG.items()}
check(hosts["A College"] == hosts["B College"] == ["catalog.a.edu"], "www. is the same host: %r" % hosts["B College"])
check("api-prod.elumenapp.com" in hosts["C College"] and "api-prod.elumenapp.com" in hosts["D College"],
      "an eLumen college reads the vendor's publish host")
check("docs.shared-cms.com" in hosts["F College"], "a procedure step's named file is a host the capture reads")
check(W.hosts_of({}, {"copy_url": "https://losrios.edu/arc.pdf"}) == ["losrios.edu"]
      and W.hosts_of({}, {"file": "x.pdf.gz"}, True) == [],
      "a hand-filed copy reads only its copy_url's host, and none when the file sits beside its record")
m = W.plan_wave(["A College", "C College", "E College"], REG, hosts)
check([x["college"] for x in m] == ["A College", "C College", "E College"]
      and [x["slug"] for x in m] == [C.slug_of(n) for n in ("A College", "C College", "E College")],
      "three colleges on three hosts plan, each with its folder's slug")
why = refused(W.plan_wave, ["A College", "B College"], REG, hosts) or ""
check("two reads on one host" in why and "catalog.a.edu" in why, "two colleges on one catalog host are refused: %s" % why)
check("api-prod.elumenapp.com" in (refused(W.plan_wave, ["C College", "D College"], REG, hosts) or ""),
      "two eLumen colleges are refused: both read the vendor's host")
check("docs.shared-cms.com" in (refused(W.plan_wave, ["F College", "G College"], REG, hosts) or ""),
      "two colleges whose catalog files sit on one host are refused")
check("not in program_source_registry: Nowhere College" in
      (refused(W.plan_wave, ["A College", "Nowhere College"], dict(REG, **{"Nowhere College": {}}), hosts) or ""),
      "a name the registry does not hold is refused")

# ── price: the gate at the limit and above it ───────────────────────────────
check(W.cost_per_program({"cost_per_program": 0.055}) == (0.055, "the college's summary.json"),
      "the price reads the college's own cost_per_program")
check(W.cost_per_program(None)[0] == 0.08 and W.cost_per_program({"cost_per_program": 0})[0] == 0.08
      and W.cost_per_program({"cost_per_program": None})[0] == 0.08,
      "no summary, or none with a positive figure, prices at 0.08 a program")
WHOLE = {"listed": 100, "answered": 100, "partial": False}
at = W.price(400, 0.08, 40.0, True, WHOLE)       # 400 x 0.08 x 1.25 = 40.00
check(at["price_usd"] == 40.0 and at["within_limit"] and at["go"], "a price exactly at the limit extracts: %r" % at)
over = W.price(401, 0.08, 40.0, True, WHOLE)     # 40.10
check(over["price_usd"] == 40.1 and not over["within_limit"] and not over["go"] and "over the limit" in over["why"],
      "a price a cent over the limit does not extract: %r" % over)
check(W.price(100, 0.1, 10.0, True, WHOLE)["price_usd"] == 12.5 and not W.price(100, 0.1, 10.0, True, WHOLE)["go"],
      "the 25% margin is in the price the gate reads")
check(not W.price(10, 0.08, 40.0, False, WHOLE)["go"], "extract 0 never extracts")
check(not W.price(0, 0.08, 40.0, True, WHOLE)["go"], "nothing to extract: no extraction step")
check(not W.price(10, 0.08, 40.0, True, {"partial": True, "why": "34 of 328 pages answered"})["go"],
      "a partial capture is never sent to the model")

# ── the capture's page account ──────────────────────────────────────────────
check(C.pages_account({"pages_read": 34}, "courseleaf", 328) == (328, 34), "the page queue is what a capture listed")
check(C.pages_account({"pages_read": 34, "curriqunet": {"entries_read": 328}}, "curriqunet", 0) == (328, 34),
      "a curriQunet capture lists its entries")
check(C.pages_account({"pages_read": 9, "elumen": {"program_pages_listed": 10}}, "elumen", 0) == (10, 9)
      and C.pages_account({"pages_read": 3, "coursedog": {"catalog": [1, 2, 3, 4]}}, "coursedog", 0) == (4, 3),
      "eLumen's publish slugs and Coursedog's program search are what those captures listed")
check(W.pages_share({"pages_listed": 328, "pages_answered": 34})["partial"]
      and not W.pages_share({"pages_listed": 100, "pages_answered": 90})["partial"]
      and W.pages_share({"pages_listed": 100, "pages_answered": 89})["partial"],
      "90% of the listed pages answered is whole, 89% is partial")
check(W.pages_share({})["partial"] and W.pages_share({"pages_listed": 0, "pages_answered": 0})["partial"],
      "a capture that counted no pages, or listed none, is held")


# ── verify: each verdict on fixtures ────────────────────────────────────────
def score(passes, share=1.0):
    return {"pass": passes, "coverage": {"pass": passes, "share": share, "listed": 10, "placed": int(share * 10)},
            "invented": {"pass": True}, "arithmetic": {"status": "equal" if passes else "unequal"}}


check(S.passes_live(score(True)) and not S.passes_live(score(False)), "the fixture's scores read as the scorer reads them")


def folder(base, recs, kept=None):
    os.makedirs(os.path.join(base, "records"), exist_ok=True)
    for cn, rec in recs.items():
        with open(os.path.join(base, "records", cn + ".json"), "w") as fh:
            json.dump(dict(rec, control_number=cn), fh)
    if kept:
        with open(os.path.join(base, "kept_passing.json"), "w") as fh:
            json.dump(kept, fh)
    return base


tmp = tempfile.mkdtemp()
try:
    MAIN = {"01": {"score": score(True), "extracted_run": "1"}, "02": {"score": score(False), "extracted_run": "1"},
            "03": {"score": score(True, 0.9), "extracted_run": "1"}}
    base = folder(os.path.join(tmp, "base"), MAIN)
    CAP = {"pages_listed": 50, "pages_answered": 50}
    PRICED = {"would_extract": 3, "price_usd": 0.3, "extract_asked": True, "within_limit": True, "why": "within"}
    OK = {"capture": "success", "extract": "success", "file": "success"}
    RUN = "99"
    # ready: 02 fails to pass, a new record 04, 01 kept by kept_passing, 03 moved with no model call.
    run = folder(os.path.join(tmp, "ready"), {
        "01": {"score": score(True), "extracted_run": "1"},
        "02": {"score": score(True), "extracted_run": RUN, "model": "m", "cost_usd": 0.06},
        "03": {"score": score(True, 0.9), "extracted_run": RUN, "read_run": "1", "cost_usd": 0.05},
        "04": {"score": score(False), "extracted_run": RUN, "model": "m", "cost_usd": 0.07}},
        kept={"run": RUN, "programs": [{"control_number": "01", "cost_usd": 0.04}]})
    v = W.verify("X College", run, base, CAP, PRICED, RUN, OK)
    check(v["verdict"] == "ready", "a run with no pass to fail and no lost coverage is ready: %r" % v["verdict"])
    check((v["fail_to_pass"], v["pass_to_fail"], v["lost_coverage"], v["kept"], v["new"]) == (1, 0, 0, 1, 1),
          "fail to pass, pass to fail, lost coverage, kept, new: %r" % [v[k] for k in
                                                                       ("fail_to_pass", "pass_to_fail", "lost_coverage", "kept", "new")])
    check(v["extracted"] == 2 and v["cost_usd"] == 0.17,
          "the run's cost is its fresh records plus kept_passing, never a moved record's old cost: %r" % [v["extracted"], v["cost_usd"]])
    # pass to fail: 01 now fails, 03 is absent.
    run = folder(os.path.join(tmp, "p2f"), {"01": {"score": score(False), "extracted_run": RUN, "model": "m"},
                                            "02": {"score": score(False), "extracted_run": "1"}})
    v = W.verify("X College", run, base, CAP, PRICED, RUN, OK)
    check(v["pass_to_fail"] == 2 and v["verdict"] == "held: 2 pass to fail, 0 lost coverage"
          and {d["why"] for d in v["detail"]["pass_to_fail"]} == {"fails", "absent"},
          "a passing record that fails, or that the run no longer files, holds the college: %r" % v["verdict"])
    # lost coverage: 03 still passes at a smaller share.
    run = folder(os.path.join(tmp, "lost"), dict(MAIN, **{"03": {"score": score(True, 0.8), "extracted_run": RUN,
                                                                  "model": "m"}}))
    v = W.verify("X College", run, base, CAP, PRICED, RUN, OK)
    check(v["lost_coverage"] == 1 and v["pass_to_fail"] == 0 and v["verdict"] == "held: 0 pass to fail, 1 lost coverage",
          "a passing record placing a smaller share holds the college: %r" % v["verdict"])
    # partial capture: held before anything else is read.
    run = folder(os.path.join(tmp, "same"), MAIN)
    v = W.verify("X College", run, base, {"pages_listed": 328, "pages_answered": 34}, PRICED, RUN, OK)
    check(v["verdict"] == "held: partial capture (34 of 328 pages answered)", "a partial capture is held: %r" % v["verdict"])
    # capture only, over the limit, failed.
    v = W.verify("X College", run, base, CAP, dict(PRICED, extract_asked=False), RUN,
                 {"capture": "success", "extract": "skipped", "file": "success"})
    check(v["verdict"] == "captured" and v["extracted"] == 0 and v["cost_usd"] == 0,
          "a capture-only run is captured, at no cost: %r" % v["verdict"])
    v = W.verify("X College", run, base, CAP, dict(PRICED, within_limit=False), RUN,
                 {"capture": "success", "extract": "skipped", "file": "success"})
    check(v["verdict"] == "held: price over the limit", "a price over the limit is held: %r" % v["verdict"])
    v = W.verify("X College", run, base, None, None, RUN, {"capture": "failure", "extract": "skipped", "file": "skipped"})
    check(v["verdict"] == "failed: capture", "a failed capture is failed: %r" % v["verdict"])
    v = W.verify("X College", run, None, CAP, PRICED, RUN, {"capture": "success", "extract": "failure", "file": "success"})
    check(v["verdict"] == "failed: extract" and v["new"] == 3, "a stopped extraction is failed; main filing none makes every record new")

    # ── file: one table, the folders copied, the sums ───────────────────────
    root = os.path.join(tmp, "repo")
    os.makedirs(os.path.join(root, "kb", "hand_filed_catalogs"))
    folder(os.path.join(root, "kb", "program_requirements_college", "x"), {"stale": {"score": score(True)}})
    arts = os.path.join(tmp, "arts")
    rows = {"x": dict(W.verify("X College", os.path.join(tmp, "ready"), base, CAP, PRICED, RUN, OK), price_usd=0.3),
            "y": dict(W.verify("Y College", os.path.join(tmp, "p2f"), base, CAP, PRICED, RUN, OK), price_usd=1.25),
            "z": dict(W.verify("Z College", run, base, CAP, PRICED, RUN,
                               {"capture": "success", "extract": "failure", "file": "failure"}), cost_usd=0.5)}
    for slug, row in rows.items():
        art = os.path.join(arts, W.artifact_name(RUN, slug))
        os.makedirs(os.path.join(art, "wave_out"))
        with open(os.path.join(art, "wave_out", slug + ".wave.json"), "w") as fh:
            json.dump(row, fh)
        shutil.copytree(os.path.join(tmp, "ready"), os.path.join(art, "kb", "program_requirements_college", slug))
    matrix = [{"college": "X College", "slug": "x", "hosts": ["x.edu"]}, {"college": "Y College", "slug": "y", "hosts": []},
              {"college": "Z College", "slug": "z", "hosts": []}, {"college": "Q College", "slug": "q", "hosts": []}]
    summ = W.file_wave("s644a", arts, matrix, RUN, True, 40.0, root=root)
    check(summ["total_cost_usd"] == round(0.17 + 0.0 + 0.5, 2) and summ["total_price_usd"] == round(0.3 + 1.25 + 0.3, 2),
          "the wave's totals sum its rows: %r" % [summ["total_cost_usd"], summ["total_price_usd"]])
    check(summ["ready"] == ["X College"] and [r["verdict"] for r in summ["rows"]][1:] ==
          ["held: 2 pass to fail, 0 lost coverage", "failed: extract", "failed: no result"],
          "each college's verdict rides into the table, a job with no result included")
    xdir = os.path.join(root, "kb", "program_requirements_college", "x", "records")
    check(sorted(os.listdir(xdir)) == ["01.json", "02.json", "03.json", "04.json"],
          "a filed folder replaces the branch's whole, so a record the run removed does not stay")
    check(os.path.isdir(os.path.join(root, "kb", "program_requirements_college", "y"))
          and not os.path.isdir(os.path.join(root, "kb", "program_requirements_college", "z")),
          "a held college's folder is filed; one whose file step did not finish is not")
    md = open(os.path.join(root, "kb", "program_requirements_wave", "s644a.md")).read()
    js = json.load(open(os.path.join(root, "kb", "program_requirements_wave", "s644a.json")))
    check(js["rows"][0]["college"] == "X College" and "| X College | 3 | $0.30 | 2 | $0.17 | 1 | 0 | 0 | 1 | 1 | 50 of 50 | ready |" in md
          and "Total cost $0.67" in md and "Z College: its folder was not filed" in md,
          "the table names a row a college with its counts, the total, and what was not filed")
finally:
    shutil.rmtree(tmp, ignore_errors=True)

# ── the workflow ────────────────────────────────────────────────────────────
import yaml  # noqa: E402

wf_text = open(os.path.join(ROOT, ".github", "workflows", "program-requirements-wave.yml")).read()
wf = yaml.safe_load(wf_text)
on = wf.get("on", wf.get(True))
check(list(on) == ["workflow_dispatch"], "the wave runs on a dispatch alone: never a push or a schedule")
ins = on["workflow_dispatch"]["inputs"]
check(ins["extract"]["default"] == "0" and ins["limit_usd"]["default"] == "40", "a wave defaults to capture only, at $40")
jobs = wf["jobs"]
read = jobs["read"]
check(read["strategy"]["fail-fast"] is False and read["strategy"]["max-parallel"] == 6,
      "one college failing never stops the others; at most six read at once")
check(read["permissions"] == {"contents": "read"} and "git push" not in json.dumps(read),
      "a college's job pushes nothing")
check(jobs["file"]["permissions"] == {"contents": "write"} and wf_text.count("git push") == 1,
      "one job, after the matrix, makes the one push")
names = [s.get("name") or s.get("uses") for s in read["steps"]]
ext = next(s for s in read["steps"] if s.get("id") == "extract")
check(ext["if"] == "steps.price.outputs.go == 'true'" and "kb/_program_requirements_college.py extract" in ext["run"],
      "the extraction is the college script's own, and runs only on the price's go")
holders = [s.get("name") for j in jobs.values() for s in j["steps"] if "SUPABASE_SERVICE_KEY" in json.dumps(s)]
check(holders == ["Extract and score"], "the service key reaches the extraction step alone: %r" % holders)
check(names.index("Capture") < names.index("Price the extraction") < names.index("Extract and score")
      < names.index("File the run into this job's checkout") < names.index("Verify against main's filed records"),
      "capture, price, extract, file, verify, in that order")
check("CENSUS_DELAY_MS: '4000'" in wf_text, "the capture reads at the census's pace")
gov = json.load(open(os.path.join(ROOT, "kb", "governance_surface_map.json")))
check("writes no table" in gov["dismissed"].get("workflow:program-requirements-wave.yml", ""),
      "the wave is dismissed in the governance map with its reason")
college_wf = open(os.path.join(ROOT, ".github", "workflows", "program-requirements-college.yml")).read()
check("group: program-requirements-college-${{ github.ref }}-${{ github.event.inputs.college }}" in college_wf,
      "rereads of several colleges on one wave branch queue apart, so none cancels another")

if failures:
    print("FAIL: %d" % len(failures))
    for f in failures:
        print("  -", f)
    sys.exit(1)
print("ok: program requirements wave (%d checks)" % checks[0])
