#!/usr/bin/env python3
"""Dependency map (Sam's ruling A, 2026-08-29) — content guards.

kb/_build_dependency_map.py --check (wired beside this in js-tests.yml) keeps
the committed artifacts FRESH; this file keeps them TRUE. Each check below is
a way the map could lie while still regenerating cleanly — every one is a
failure mode the build actually hit, or the exact miss the map exists to close.

Run from repo root: python3 tests/dependency_map_test.py
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAP = os.path.join(ROOT, "kb", "dependency_map.json")

results = []


def check(name, cond):
    results.append((name, bool(cond)))


def consumers(p, ds):
    return {(e["id"], e["direction"]) for e in
            p["datasets"].get(ds, {}).get("consumers", [])}


def ids(p, ds):
    return {e["id"] for e in p["datasets"].get(ds, {}).get("consumers", [])}


def main() -> int:
    if not os.path.exists(MAP):
        print("FAIL: kb/dependency_map.json missing — run kb/_build_dependency_map.py")
        return 1
    p = json.load(open(MAP, encoding="utf-8"))

    # (a) THE CANONICAL TRAP: fact-sheet/ looks self-contained on its script
    # tags while factsheet.js fetches ../live_metrics.json at RUNTIME. This
    # exact miss is why the map exists (probe finding, 2026-08-29). The edge
    # fn's read of the same file over raw.githubusercontent is the seeded
    # cross-service self-dependency.
    lm = ids(p, "file:live_metrics.json")
    check("factsheet.js runtime-fetches live_metrics.json",
          "module:fact-sheet/factsheet.js" in lm)
    check("cpl-chat edge fn reads live_metrics.json (seeded)",
          "edgefn:cpl-chat" in lm)

    # (b) THE CRON BYPASS: daily-dashboard commits live_metrics.json straight
    # to main while Pages serves from main — no PR ever sees it.
    check("daily-dashboard.yml is a main-committer of live_metrics.json",
          "workflow:daily-dashboard.yml" in
          p["datasets"].get("file:live_metrics.json", {}).get("main_committers", []))

    # (c) the sneaky main-committer: cpl-landing-pages pushes
    # HEAD:${{github.ref_name}}, which is main on its weekly cron — a scanner
    # grepping only 'HEAD:main' calls this workflow branch-only.
    wf = p["workflows"].get("cpl-landing-pages.yml", {})
    check("cpl-landing-pages push shape resolves to main on cron",
          wf.get("push") == "main (cron checkout)")

    # (d) trailing-slash REST convention (cpl_memory.js: REST + "cpl_memory").
    # Requiring the slash once made this tab report ZERO tables — a false
    # "nothing to protect" on the table Rule 8 orders every session to read.
    cm = consumers(p, "supabase:cpl_memory")
    check("cpl_memory read by the memory tab", ("module:cpl_memory.js", "read") in cm)
    check("cpl_memory WRITTEN by the memory tab (verb is the helper's 1st arg)",
          ("module:cpl_memory.js", "write") in cm)

    # (e) helper-call-site harvest: kb_curation names live only in call
    # arguments for half its consumers (raci-style wrappers, _req("GET",
    # "/kb_curation"), f-string {path} loaders).
    kc = ids(p, "supabase:kb_curation")
    check("kb_curation has 5+ tab-module consumers",
          sum(1 for i in kc if i.startswith("module:")) >= 5)
    check("kb_curation includes the call-site-only consumer _eacr_flag_migrate",
          "script:kb/_eacr_flag_migrate.py" in kc)

    # (f) the meta-scanner trap: _build_cobi_admin_surface.py regex-mines
    # table names as DATA — crediting it with touching every table it scans
    # for would be exactly the phantom-'table' incident again.
    dirty = [ds for ds in p["datasets"]
             if ds.startswith(("supabase:", "rpc:"))
             and "script:kb/_build_cobi_admin_surface.py" in ids(p, ds)]
    check("meta-scanners are not credited with the tables they scan for",
          not dirty)

    # (g) seeds are anchor-verified: a warning here means a refactor moved a
    # dynamic read and the map silently lost its edges — fix the seed, do not
    # ship the warning.
    check("no seed anchors have gone stale", not p.get("warnings"))

    # (h) Rule 4 double-count: index.html is byte-identical to
    # CPL_Dashboard.html and must be scanned as ONE page.
    check("index.html is not scanned as a second page",
          not any("page:index.html" in ids(p, ds) for ds in p["datasets"]))

    # (i) coverage floors — shrinking numbers mean extraction broke, not that
    # the repo got simpler (the build fails hard below these; the test pins
    # them against a silently-weakened committed artifact too).
    s = p["stats"]
    check("40+ Supabase tables", s["supabase_tables"] >= 40)
    check("15+ RPCs", s["rpcs"] >= 15)
    check("100+ file datasets", s["file_datasets"] >= 100)
    check("25+ workflows", s["workflows"] >= 25)
    check("25+ tabs", s["tabs"] >= 25)

    # (j) the one independently-confirmed stale-copy case stays visible until
    # someone actually fixes the commit list (then update this check).
    check("stale-copy risk names cpl_pathways_ccr_data.js",
          any("cpl_pathways_ccr_data.js" in r for r in p.get("stale_risk", [])))

    # (k)-(n): the four defects the 2026-08-30 adversarial verify found, each
    # pinned so the fix cannot silently regress.
    # (k) the rekey script bulk-PATCHes the LIVE kb_curation table through
    # _req("PATCH", "<filter>") with the table in an ENDPOINT const — it was
    # recorded read-only, the worst direction error the Rule-10 table can hold.
    check("kb_curation rekey script carries the WRITE direction",
          ("script:kb/_rekey_kb_curation_supabase.py", "write") in
          consumers(p, "supabase:kb_curation"))
    # (l) fs-helper reads: loadWindowJson("credential_reference_data.js") in
    # the Node roster CLI keeps its literal only at the call site.
    cr = ids(p, "file:credential_reference_data.js")
    check("roster CLI's loadWindowJson read is mapped",
          "module:kb/_college_apprenticeship_cpl_roster.js" in cr)
    # (m) path.join(__dirname, "..", "x.js") resolves to the file, not to ".."
    # (the ".." capture minted a bogus file:. dataset and dropped the edge).
    check("carp-plan CLI's path.join('..') read is mapped, no file:. dataset",
          "module:kb/_carp_apprentice_plan_s109.js" in cr
          and "file:." not in p["datasets"])
    # (n) a literal joined onto a tempfile dir is NOT the repo dataset —
    # _verify_students_served.py reads its own synthetic tmp copy.
    check("tempdir self-bake is not a consumer of the repo artifact",
          "script:kb/_verify_students_served.py" not in cr)
    # double-quoted YAML crons parse (credential-catalog-sync read as
    # schedule-less under a single-quote-only pattern)
    check("credential-catalog-sync.yml cron is parsed",
          p["workflows"].get("credential-catalog-sync.yml", {}).get("crons") ==
          ["20 13 * * *"])

    failed = [n for n, ok in results if not ok]
    for n, ok in results:
        print("%s %s" % ("PASS" if ok else "FAIL", n))
    print("%d checks, %d failed" % (len(results), len(failed)))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
