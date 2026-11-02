#!/usr/bin/env python3
"""Guard for scripts/next_slo_colleges.py and kb/course_outcomes/queue.json (step 11 of
docs/reference/scheduled_sessions.md; Sam, 2026-11-01: "yes to SLO hints and the nightly
harvest").

The failures this guards: a loaded college read again; a college whose host prints no SLOs
queued every night; an unproven host read in full before a 12-page trial; a trial that found
nothing taken as a pass; a curriQunet index that read a different report from the one the
census found SLOs on; a filed read left unloaded; the queue out of articulation order; and a
verdict in queue.json that names no college or no reason.

Run from repo root: python3 tests/next_slo_colleges_test.py
"""
import json
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "scripts"))
import next_slo_colleges as M  # noqa: E402

results = []


def check(name, ok, why=""):
    results.append((name, bool(ok), why))


def write(root, rel, data):
    path = os.path.join(root, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f)


def college(root, slug, name, url, codes, elumen=None):
    cap = {"college": name, "catalog_url": url}
    if elumen:
        cap["elumen"] = {"catalog": elumen}
    write(root, "program_requirements_college/%s/capture.json" % slug, cap)
    write(root, "program_requirements_college/%s/records/1.json" % slug,
          {"college": name, "record": {"blocks": [{"courses": [{"code": c} for c in codes]}]}})


def codes(n, subj="ABC"):
    return ["%s %d" % (subj, i) for i in range(1, n + 1)]


def fixture(root):
    names = ["Loaded", "Coast Two", "Eltrial", "Elpass", "Elnone", "Quiet", "Cq List", "Cq Swap",
             "Cq Outline", "No Folder", "Half Read", "Done Read", "Courseleaf"]
    # Articulations: index i articulates (13 - i) credentials, so the list order is the rank.
    creds = {}
    for k in range(13):
        creds["Cred %d" % k] = {"a": {str(i): [1.0, []] for i in range(13) if k < 13 - i}}
    write(root, "exhibits_adoption.json", {"colleges": names, "credentials": creds})
    college(root, "loaded", "Loaded", "https://catalog.cccd.edu/", codes(5))
    college(root, "coast_two", "Coast Two", "https://catalog.cccd.edu/", codes(850))
    college(root, "eltrial", "Eltrial", "https://elt.elumenapp.com/catalog/x", codes(30), elumen="x")
    college(root, "elpass", "Elpass", "https://elp.elumenapp.com/catalog/x", codes(30), elumen="x")
    college(root, "elnone", "Elnone", "https://eln.elumenapp.com/catalog/x", codes(30), elumen="x")
    college(root, "quiet", "Quiet", "https://elq.elumenapp.com/catalog/x", codes(30), elumen="x")
    college(root, "cq_list", "Cq List", "https://cql.example.edu/", codes(20))
    college(root, "cq_swap", "Cq Swap", "https://cqs.example.edu/", codes(20))
    college(root, "cq_outline", "Cq Outline", "https://cqo.example.edu/", codes(20))
    college(root, "half_read", "Half Read", "https://elh.elumenapp.com/catalog/x", codes(30), elumen="x")
    college(root, "done_read", "Done Read", "https://eld.elumenapp.com/catalog/x", codes(30), elumen="x")
    college(root, "courseleaf", "Courseleaf", "https://catalog.cl.edu/", codes(20))
    write(root, "course_outline_census/census_1.json", {"rows": [
        {"college": "Cq List", "cor_system": "curriqunet", "cor_access": "public", "cor_outline": "list_only",
         "cor_url": "https://cql.curriqunet.com/"},
        {"college": "Cq Swap", "cor_system": "curriqunet", "cor_access": "public", "cor_outline": "outline_with_slos",
         "cor_url": "https://cqs.curriqunet.com/",
         "cor_outline_url": "https://cqs.curriqunet.com/DynamicReports/AllFieldsReportByEntity/9?entityType=Course&reportId=4"},
        {"college": "Cq Outline", "cor_system": "curriqunet", "cor_access": "public", "cor_outline": "outline",
         "cor_url": "https://cqo.curriqunet.com/"},
        {"college": "Courseleaf", "cor_system": "none_found", "cor_access": "not_found", "cor_outline": "none_found"},
    ]})
    write(root, "course_outline_index/index_5.json", {
        "url": "https://cqs.curriqunet.com/", "coverage": {"cq_swap": {"courses": 20, "with_outline": 20}},
        "report_titles": [{"id": 493, "title": "Course Outline Report", "comparison": False, "read": True},
                          {"id": 4, "title": "All Fields", "comparison": False, "read": False}]})
    write(root, "receipts/course_outcomes_cccd_9.json",
          {"host": "cccd", "inserted_keys": [{"id": 1, "college": "Loaded", "course_code": "ABC 1"}]})
    write(root, "course_outcomes/queue.json", {"colleges": {
        "quiet": {"state": "none", "on": "2026-11-01", "by": "S0", "source": "trial 1", "why": "prints none"}}})

    def trial(run, slug, shapes):
        write(root, "course_outcomes/trial_%d/read.json" % run, {
            "run": str(run), "index": "catalog:" + slug, "slugs": slug, "complete": True,
            "rows": [{"status": 200, "shape": s} for s in shapes]})
    trial(11, "elpass", ["list"] * 9 + ["none"] * 3)
    trial(12, "elnone", ["none"] * 12)
    write(root, "course_outcomes/elh/read_21_p1of2.json", {"run": "21", "slugs": "half_read", "part": 1, "of": 2,
                                                          "complete": True, "rows": []})
    write(root, "course_outcomes/eld/read_22_p1of1.json", {"run": "22", "slugs": "done_read", "part": 1, "of": 1,
                                                          "complete": True, "rows": []})


with tempfile.TemporaryDirectory() as root:
    fixture(root)
    rows, census_file = M.queue(root)
    by = {r["college"]: r for r in rows}

    check("the list runs in articulation order",
          [r["articulations"] for r in rows] == sorted((r["articulations"] for r in rows), reverse=True))
    check("a college a load receipt names is done", by["Loaded"]["state"] == "done", by["Loaded"])
    check("a host a load proved reads in full, no trial",
          by["Coast Two"]["state"] == "read"
          and by["Coast Two"]["trigger"] == ("kb/course_outcomes/.run", ["catalog=coast_two", "parts=3"]),
          by["Coast Two"])
    check("an unproven eLumen host gets a 12-page trial first",
          by["Eltrial"]["state"] == "trial"
          and by["Eltrial"]["trigger"] == ("kb/course_outcomes/.run", ["catalog=eltrial", "trial=12"]),
          by["Eltrial"])
    check("a trial that parsed most pages opens the full read",
          by["Elpass"]["state"] == "read" and by["Elpass"]["trigger"][1] == ["catalog=elpass", "parts=1"], by["Elpass"])
    check("a trial that parsed nothing is never a pass, and asks for a verdict",
          by["Elnone"]["state"] == "trial" and by["Elnone"]["trigger"] is None and "none" in by["Elnone"]["why"],
          by["Elnone"])
    check("a verdict in queue.json skips the college with its reason",
          by["Quiet"]["state"] == "none" and "prints none" in by["Quiet"]["why"], by["Quiet"])
    check("a public curriQunet host with no index gets the index run",
          by["Cq List"]["state"] == "index"
          and by["Cq List"]["trigger"][0] == "kb/course_outline_index/.run"
          and "index=https://cql.curriqunet.com/" in by["Cq List"]["trigger"][1]
          and "slugs=cq_list" in by["Cq List"]["trigger"][1], by["Cq List"])
    check("an index that read another report than the census's SLO report is re-run on that report",
          by["Cq Swap"]["state"] == "reindex" and "report=^All Fields$" in by["Cq Swap"]["trigger"][1], by["Cq Swap"])
    check("a curriQunet outline that printed no SLO heading is skipped",
          by["Cq Outline"]["state"] == "skip" and "no SLO heading" in by["Cq Outline"]["why"], by["Cq Outline"])
    check("a college with no outline system is skipped", by["Courseleaf"]["state"] == "skip", by["Courseleaf"])
    check("a college with no harvest folder is skipped", by["No Folder"]["state"] == "skip", by["No Folder"])
    check("a read with a slice missing is reading, not load", by["Half Read"]["state"] == "reading", by["Half Read"])
    check("a complete read not yet loaded is the load, on its host folder",
          by["Done Read"]["state"] == "load" and by["Done Read"]["trigger"] == ("kb/course_outcomes/.load", ["host=eld"]),
          by["Done Read"])

    # The reindex resolves once the index reads the census's report.
    write(root, "course_outline_index/index_6.json", {
        "url": "https://cqs.curriqunet.com/", "coverage": {"cq_swap": {"courses": 20, "with_outline": 20}},
        "report_titles": [{"id": 4, "title": "All Fields", "comparison": False, "read": True}]})
    swap = {r["college"]: r for r in M.queue(root)[0]}["Cq Swap"]
    check("the newest index on the census's report moves the college to its trial",
          swap["state"] == "trial" and swap["trigger"][1][0].endswith("/course_outline_index/index_6.json")
          and swap["trigger"][1][1:] == ["slugs=cq_swap", "trial=12"],
          swap)

# --college prints one college's block; an unknown slug fails.
import contextlib  # noqa: E402
import io  # noqa: E402
buf = io.StringIO()
with contextlib.redirect_stdout(buf):
    code = M.main(["--college", "golden_west"])
check("--college prints that college's state", code == 0 and "(golden_west)" in buf.getvalue()
      and "state: " in buf.getvalue(), buf.getvalue())
with contextlib.redirect_stdout(io.StringIO()):
    code = M.main(["--college", "no_such_college"])
check("--college with an unknown slug exits 1", code == 1)
first = [r for r in M.queue()[0] if r["state"] in M.ACTIONS][:1]
if first:
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        M.main(["--next", "--skip", first[0]["slug"]])
    check("--skip passes over a college with an open PR", "(%s)" % first[0]["slug"] not in buf.getvalue(), buf.getvalue())

# The committed ledger and the live queue.
ledger = M.ledger()
for slug, v in ledger.items():
    check("queue.json %s names a harvest folder" % slug,
          os.path.isdir(os.path.join(ROOT, "kb", "program_requirements_college", slug)))
    check("queue.json %s has a known state and its reason" % slug,
          v.get("state") in M.VERDICTS and all(v.get(k) for k in ("on", "by", "why", "source")), v)
rows, census_file = M.queue()
check("the repo's queue reads a census", bool(census_file))
check("every college course_outcomes holds is done, never queued",
      all(r["state"] == "done" for r in rows if r["college"] in M.loaded()[0]))
check("every queued college has a slug and course codes",
      all(r["slug"] and r["courses"] for r in rows if r["state"] in M.ACTIONS))

failed = [r for r in results if not r[1]]
for name, ok, why in results:
    print("%s %s%s" % ("PASS" if ok else "FAIL", name, "" if ok else "  " + json.dumps(why, default=str)[:400]))
print("\n%d of %d passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
