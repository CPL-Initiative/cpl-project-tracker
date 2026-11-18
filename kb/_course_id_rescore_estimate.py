#!/usr/bin/env python3
"""The course-id rescore at six colleges, estimated from committed files before the free reconcile runs (S655).

WHY. Handoff 655 (First things 5) rescored American River, Barstow, City College of San Francisco, Diablo Valley,
Riverside City and Santiago Canyon on the course-id route (#3312, kb/_course_id_route.py): a free reconcile from
each college's filed pages (step=reconcile, extract=0, sources_from the filed capture's run), then the reread, a
live write with a receipt. The pages sit in each run's artifact, never in the repository, so the reconcile runs
only on a runner. This estimate says beforehand what the rescore should change, so the runner's filing and the
live read can be measured against it.

THE ESTIMATE. Each filed record is scored by the current scorer with no page text, against its closed list rebuilt
as the coci_program_courses table is built (kb/_course_id_route_census.py closed_lists; the record's own filed list,
each course keeping a control number where today's list names it by the same code, when the two differ). Coverage,
invented and repeated need no text, so they are the scorer's own. The arithmetic and the outcomes stay as filed,
except where the renames move the text-free arithmetic (the census's rule). A record whose estimated score differs
from its filed score is a score change; the wave's compare (kb/_program_requirements_wave.py compare) then reads
fail to pass, pass to fail and lost coverage between the filed records and the estimate.

WHAT IT CANNOT SEE. The reconcile also rereads each page through kb/_program_requirements_reconcile.py, and the
scorer's text checks (outcomes, the arithmetic's printed figures, the electives fill) read the page. A change from
either shows only on the runner, so the runner's count may be larger: the estimate is a floor for the text-free
part, never an upper bound for the run.

SOURCES_FROM. stage_sources in kb/_program_requirements_college.py refuses any run but the one the filed
capture.json (or capture_preview.json) names, so each college's dispatch input is read from its filed capture.json.

    python3 kb/_course_id_rescore_estimate.py      # write the estimate, print the summary

Output: kb/program_requirements_reconcile_out/course_id_rescore_2026-11-15/estimate.json (withheld from Pages by
kb/*_out). A dated record of the files as they stood: a newly filed record moves it, so nothing checks it byte
for byte.
"""
from __future__ import annotations

import collections
import json
import os
import shutil
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(ROOT, "chatbox"))
import _course_id_route as CI  # noqa: E402
import _course_id_route_census as CEN  # noqa: E402
import _prefix_alias_census as A  # noqa: E402
import _program_requirements_reconcile as R  # noqa: E402
import _program_requirements_score as S  # noqa: E402
import _program_requirements_wave as W  # noqa: E402
from _program_requirements_pilot import norm_code  # noqa: E402

COLLEGES = ["American River College", "Barstow Community College", "City College of San Francisco",
            "Diablo Valley College", "Riverside City College", "Santiago Canyon College"]
RECONCILE = os.path.join(HERE, "program_requirements_reconcile.json")
COLLEGE_DIR = os.path.join(HERE, "program_requirements_college")
OUT_DIR = os.path.join(HERE, "program_requirements_reconcile_out", "course_id_rescore_2026-11-15")
OUT = os.path.join(OUT_DIR, "estimate.json")
TEXT_FREE = ("coverage", "invented", "repeated")


def tab_checks(sc: dict) -> dict:
    """The live row's flat checks, as the load writes them."""
    return {"coverage": (sc.get("coverage") or {}).get("pass"), "invented": (sc.get("invented") or {}).get("pass"),
            "arithmetic": (sc.get("arithmetic") or {}).get("status")}


def build() -> dict:
    with open(RECONCILE, encoding="utf-8") as fh:
        conf = json.load(fh)["colleges"]
    closed = CEN.closed_lists()
    ids = CI.load_ids()
    records = A.load_records()
    out = {"_what": ("The course-id rescore at six colleges estimated from committed files (S655): each filed "
                     "record scored with no page text, coverage, invented and repeated as the scorer computes them. "
                     "Read-only; no site contacted, nothing dispatched, no table read or written."),
           "colleges": {}}
    tmp = tempfile.mkdtemp()
    try:
        for college in COLLEGES:
            slug = next(s for s, v in records.items() if v[0][1].get("college") == college)
            c = conf.get(college) or {}
            now = R.prefix_aliases(college)
            packed = R.packed_codes(college)
            # Before is the config as slice C left it: a pair the route retired stays in "before" (the census's rule).
            before = dict(c.get("prefix_aliases") or {})
            for cite in c.get("prefix_aliases_cited") or []:
                if cite.get("session") == CEN.PAIRS_SESSION:
                    before.setdefault(cite["printed"], cite["file"])
            before.update(c.get("course_renumbers") or {})
            est_dir = os.path.join(tmp, slug)
            os.makedirs(os.path.join(est_dir, "records"))
            changed, parts = [], collections.Counter()
            route_records, filed_list_used, no_list = 0, 0, 0
            totals = {"placed_sum": [0, 0], "coverage_true": [0, 0], "invented_true": [0, 0], "tab_passing": [0, 0]}
            for name, f in records[slug]:
                rec0, sc = f.get("record"), f.get("score")
                row = f
                if isinstance(rec0, dict) and sc:
                    cl = closed.get((college, f.get("control_number")))
                    filed_listed = A.rebuilt_list(f, before)
                    if not cl:
                        no_list += 1
                    else:
                        if {norm_code(x["code"]) for x in cl if x.get("code")} != set(filed_listed):
                            filed_list_used += 1
                            ccn_of = {norm_code(x["code"]): x.get("ccn") for x in cl if x.get("code")}
                            cl = [{"code": k, "ccn": ccn_of.get(k), "units": None} for k in filed_listed]
                        new = S.score(rec0, cl, None, f.get("award"), now, packed)
                        if new["coverage"].get("course_id"):
                            route_records += 1
                        lst = {norm_code(x["code"]): S._num(x.get("units")) for x in cl if x.get("code")}
                        b = S.with_prefix_aliases(rec0, lst, before)
                        a = S.with_prefix_aliases(S.with_course_ids(rec0, lst, CI.listed_ids(cl, ids), now), lst, now)
                        moved = CEN.arithmetic(b, a, lst, f)
                        est = dict(sc)
                        for k in TEXT_FREE:
                            est[k] = new[k]
                        if moved is not None:
                            est["arithmetic"] = moved
                        est["pass"] = bool(est["coverage"]["pass"] and est["invented"]["pass"]
                                           and (est.get("arithmetic") or {}).get("pass") and est["repeated"]["pass"]
                                           and (est.get("outcomes") or {}).get("pass", True))
                        if est != sc:
                            changed.append(f["control_number"])
                            for k in TEXT_FREE + ("arithmetic", "pass"):
                                if est.get(k) != sc.get(k):
                                    parts[k] += 1
                            for i, s_ in enumerate((sc, est)):
                                totals["placed_sum"][i] += (s_.get("coverage") or {}).get("placed") or 0
                                totals["coverage_true"][i] += bool((s_.get("coverage") or {}).get("pass"))
                                totals["invented_true"][i] += bool((s_.get("invented") or {}).get("pass"))
                                totals["tab_passing"][i] += S.counts_passing_on_tab(tab_checks(s_))
                        row = dict(f, score=est)
                with open(os.path.join(est_dir, "records", name), "w", encoding="utf-8") as fh:
                    json.dump(row, fh)
            main_dir = os.path.join(COLLEGE_DIR, slug)
            base, est_recs = W.load_records(main_dir), W.load_records(est_dir)
            cmp = W.compare(base, est_recs)
            with open(os.path.join(main_dir, "capture.json"), encoding="utf-8") as fh:
                cap = json.load(fh)
            out["colleges"][college] = {
                "slug": slug, "sources_from": str(cap.get("run")),
                "sources_from_staged_from": (cap.get("staged_from") or {}).get("run"),
                "records": len(base), "score_changes": len(changed), "changed_parts": dict(sorted(parts.items())),
                "records_matched_by_course_id": route_records, "filed_list_used": filed_list_used,
                "no_rebuilt_list": no_list,
                "passes_live": [sum(1 for r in base.values() if S.passes_live(r.get("score"))),
                                sum(1 for r in est_recs.values() if S.passes_live(r.get("score")))],
                "changed_records": totals, "fail_to_pass": cmp["fail_to_pass"], "pass_to_fail": cmp["pass_to_fail"],
                "lost_coverage": cmp["lost_coverage"], "changed": changed}
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    cs = out["colleges"].values()
    out["summary"] = {"score_changes": sum(v["score_changes"] for v in cs),
                      "fail_to_pass": sorted("%s %s" % (v["slug"], cn) for v in cs for cn in v["fail_to_pass"]),
                      "pass_to_fail": sum(len(v["pass_to_fail"]) for v in cs),
                      "lost_coverage": sum(len(v["lost_coverage"]) for v in cs)}
    return out


def main() -> int:
    plan = build()
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(json.dumps(plan, indent=1, sort_keys=True, ensure_ascii=False) + "\n")
    print(json.dumps(plan["summary"], indent=1))
    for college, v in plan["colleges"].items():
        print("%-32s sources_from %s: %d score changes, passes_live %d to %d, fail to pass %s, falls %d"
              % (college, v["sources_from"], v["score_changes"], v["passes_live"][0], v["passes_live"][1],
                 ",".join(v["fail_to_pass"]) or "none", len(v["pass_to_fail"]) + len(v["lost_coverage"])))
    return 0


if __name__ == "__main__":
    sys.exit(main())
