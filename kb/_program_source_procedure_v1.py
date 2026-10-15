#!/usr/bin/env python3
"""Write a college's procedure record v1 receipt for a catalog-sweep load.

The record names the catalog host, each read run (with extraction), the load and
the display build, and what the read left open. Every figure comes from files the
runs committed: each read's capture.json and summary.json (read at the run's own
filing commit, so a college read twice reports both reads), and the load receipt.
The receipt is applied through program_source_procedure_set with execute_sql; the
md5 it expects is the registry row's current procedure md5 ('none' when empty).

  python3 kb/_program_source_procedure_v1.py --college "Citrus College" \
      --branch claude/s394-citrus --load-receipt kb/receipts/...citrus_38677491426.json \
      --display ad2f574f892c:38678650345 --session "S395 SkyHawthorn" --expect none

S394 wrote the first eight of these by hand-run code; S395 committed this one so
the shape stops being re-derived.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PLAN_READ = ("program-requirements-college.yml, read with extraction (the catalog sweep; "
             "Sam's standing go of 2026-10-14, up to $40 a college)")
PLATFORM_NAME = {"courseleaf": "CourseLeaf", "curriqunet": "curriQunet", "elumen": "eLumen",
                 "acalog": "Acalog"}


def slug_of(college: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", college.lower().replace(" college", "")).strip("_")


def git(*args: str) -> str:
    return subprocess.run(["git", "-C", str(ROOT), *args], check=True,
                          capture_output=True, text=True).stdout


def read_runs(branch: str, college: str) -> list[dict]:
    """Each filed read on the branch, oldest first: its run, capture and summary."""
    subj = "File the program requirements read of %s (run " % college
    out = []
    for line in git("log", "--reverse", "--format=%H%x09%s", branch).splitlines():
        sha, s = line.split("\t", 1)
        if not s.startswith(subj):
            continue
        run = s[len(subj):].rstrip(")")
        base = "%s:kb/program_requirements_college/%s/" % (sha, slug_of(college))
        try:
            summary = json.loads(git("show", base + "summary.json"))
        except subprocess.CalledProcessError:
            continue                        # a capture-only read files no summary
        if str(summary.get("run")) != run:
            continue
        cap = json.loads(git("show", base + "capture.json"))
        out.append({"run": run, "date": git("show", "-s", "--format=%cs", sha).strip(),
                    "cap": cap, "sum": summary})
    return out


def found_text(cap: dict, s: dict) -> str:
    bm = cap.get("by_method") or {}
    ways = []
    if bm.get("link_search"):
        ways.append("%d by link search" % bm["link_search"])
    if bm.get("sitemap_page"):
        ways.append("%d by sitemap page" % bm["sitemap_page"])
    return ("%d pages in %d loads (%d min). %d of %d programs with a course list found a page (%s); "
            "%d extracted with function v10 for $%.2f; %d pass the machine checks."
            % (cap["pages_read"], cap["loads"], round(cap["seconds"] / 60), s["found"],
               s["with_closed_list"], ", ".join(ways) or "none", s["extracted"], s["cost_usd"],
               s["passed_machine_checks"]))


def build(a: argparse.Namespace) -> tuple[dict, str]:
    reads = read_runs(a.branch, a.college)
    if not reads:
        sys.exit("no filed read with extraction for %s on %s" % (a.college, a.branch))
    load = json.loads((ROOT / a.load_receipt).read_text())
    if load["college"] != a.college:
        sys.exit("the load receipt is %s's" % load["college"])
    last = reads[-1]
    cap, s = last["cap"], last["sum"]
    build_id, display_run = a.display.split(":")
    host = re.sub(r"^https?://", "", cap["catalog_url"]).split("/")[0]
    plat = PLATFORM_NAME.get(cap["platform"], cap["platform"])
    note = "%s's %s catalog (%s)." % (a.college, plat, cap.get("catalog_year"))
    sm = cap.get("sitemap") or {}
    if sm.get("status") == 200:
        note += " sitemap.xml lists %d addresses, %d of them program pages%s." % (
            sm["listed"], sm["program_pages"], " under %s" % cap["scope"] if cap.get("scope") else "")
    elif sm.get("status"):
        note += " sitemap.xml answers %s; the reader searches the catalog's links instead." % sm["status"]
    if a.host_note:
        note += " " + a.host_note
    steps = [{"run": r["run"], "date": r["date"], "plan": PLAN_READ,
              "found": found_text(r["cap"], r["sum"])} for r in reads]
    skipped = len(load.get("skipped") or [])
    steps.append({"run": str(load["load_run"]), "date": load["at"][:10],
                  "plan": "program-requirements-college.yml, load",
                  "found": "%d records inserted unchecked (receipt %s)%s" % (
                      load["inserted"], a.load_receipt,
                      "; %d place none of their listed courses and stay out." % skipped
                      if skipped else ".")})
    steps.append({"run": display_run, "date": a.display_date,
                  "plan": "program-requirements-college.yml, display",
                  "found": "Display build %s applied from main; the applied record beside the receipt "
                           "is the rollback." % build_id})
    f = s["failed"]
    opn = [{"question": "%d of %d records fail the arithmetic check, %d the coverage check, %d the "
                        "invented-course check and %d the outcomes check."
                        % (f["arithmetic"], s["extracted"], f["coverage"], f["invented"], f["outcomes"]),
            "next": "Measure the Major only and degree-figure gaps per page layout, then write this "
                    "catalog's reconcile steps (kb/program_requirements_reconcile.json) before any "
                    "record is confirmed."}]
    nf, claimed = len(cap.get("not_found") or []), len(cap.get("page_claimed") or [])
    if nf or claimed:
        opn.append({"question": "%d programs with a course list found no page; %d lost their page to a "
                                "program it names more fully." % (nf, claimed),
                    "next": "Read two of them against the catalog's own program index before a re-read."})
    if skipped:
        opn.append({"question": "%d records place none of their listed courses and stay out of the load."
                                % skipped,
                    "next": "Read two of their pages for the codes they print before a re-read."})
    if sm.get("status") and sm["status"] != 200:
        opn.append({"question": "%s answers %s for sitemap.xml, so the reader found pages by searching "
                                "links: %d of %d programs with a course list."
                                % (host, sm["status"], s["found"], s["with_closed_list"]),
                    "next": "Find where the catalog lists its programs (an A-Z page or a program menu) "
                            "and read from it before a re-read."})
    rec = {"v": a.v, "college": a.college,
           "hosts": [{"host": host, "access": "open", "platform": cap["platform"], "note": note}],
           "steps": steps, "open": opn}
    by = "%s, %s (the catalog sweep: read %s, load %s, display %s)" % (
        a.session, a.display_date, ", ".join(r["run"] for r in reads), load["load_run"], display_run)
    return rec, by


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--college", required=True)
    ap.add_argument("--branch", required=True, help="the college's read branch (origin/...)")
    ap.add_argument("--load-receipt", required=True)
    ap.add_argument("--display", required=True, help="build_id:run")
    ap.add_argument("--display-date", default=dt.date.today().isoformat())
    ap.add_argument("--session", required=True, help='e.g. "S395 SkyHawthorn"')
    ap.add_argument("--expect", required=True, help="the registry row's procedure md5, or none")
    ap.add_argument("--v", type=int, default=1)
    ap.add_argument("--host-note", default="")
    a = ap.parse_args(argv)
    rec, by = build(a)
    slug = slug_of(a.college)
    out = ROOT / ("kb/receipts/program_source_procedure_%s_v%d_%s_%s.sql" % (
        slug, a.v, a.display_date, a.session.split()[0].lower()))
    prior = ("the registry row held none" if a.expect == "none"
             else "replacing the record whose md5 is %s" % a.expect)
    body = json.dumps(rec, ensure_ascii=False)
    assert "$proc$" not in body
    out.write_text(
        "-- %s, %s: %s's procedure record v%d (%s), naming the\n"
        "-- %s host, the read, extraction, load and display runs, and what the read left open.\n"
        "-- Through program_source_procedure_set, expecting '%s'; the history trigger files the prior row.\n"
        "-- Rollback: program_source_registry_history holds the prior row.\n"
        "-- Written by kb/_program_source_procedure_v1.py.\n\n"
        "select public.program_source_procedure_set('%s', $proc$%s$proc$::jsonb,\n  '%s',\n  '%s');\n"
        % (a.session, a.display_date, a.college, a.v, prior, PLATFORM_NAME.get(rec["hosts"][0]["platform"],
           rec["hosts"][0]["platform"]), a.expect, a.college.replace("'", "''"), body,
           by.replace("'", "''"), a.expect))
    print(out.relative_to(ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
