#!/usr/bin/env python3
"""One dry run, by college, for the four pending changes to the program-requirements passing function (S651).

WHY. The S649 conductor ruled that the passing-function changes go out together: one dry run by college,
posted on #3111 for COBIx's review, then one migration and one rescore (d-one-rescore-for-three-rules-s649).
S650 added a fourth, the degree electives-fill guard (p-degree-electives-fill-false-pass-s650). A change to
the passing function moves counts at 118 colleges, and a false pass is worse than a miss, so the effect of
each change is measured on the filed records before anything live moves. This writes no table.

WHAT IT READS. The filed records on main (kb/program_requirements_college/<slug>/records/*.json), the live
gap census (kb/status/harvest_gap_census.json) for the programs with no closed list, the COCI program export
(tmc/source_data/coci_program_export_*.csv) for their titles and awards, and the reconcile config
(kb/program_requirements_reconcile.json) for quoted GE-pattern evidence. The filed records carry no page
text (the captured text lives only in the run artifacts, d-rescore-text-checked-from-artifacts-s647), so
the dry run re-reads each record's filed sums, the way kb/_program_requirements_rescore.py does, through
the scorer's own functions with the S651 flag off and on. No scoring logic is restated here.

THE FOUR CHANGES, and what the files can show:
  1. noncredit Total Hours   (Sam, sam-noncredit-total-hours-2026-11-13) adds a reading of the page's text.
                             Without the text the dry run names the candidates: hours records failing as
                             incomplete whose courses carry no figure and whose college's step does not
                             already read the total. Each one's flip is decided on its captured text.
  2. the own-list rule       (sam-headline-counts-own-list-2026-11-13) is not coded: no record exists for a
                             program with no closed list (the reader reads none), and what a pass against
                             a college's own course list checks is not written down. The dry run counts
                             the programs it would reach.
  3. the GE-pattern rule     (COBIx, #3229 comment 6869816372) matches criteria 1 to 3 from the census and
                             the export; criterion 4 is quoted evidence in the reconcile config, and only a
                             program with it counts.
  4. the electives-fill guard  a degree's record total is its major's, which electives never fill: every
                             filed pass that rests on the program-total fill of a degree flips, and every
                             failing degree record the current fill would pass on a rescore stays failing.

    python3 kb/_program_requirements_passing_dryrun.py            # write the JSON and the summary
    python3 kb/_program_requirements_passing_dryrun.py --check    # fail when the committed pair is stale

Guard: tests/program_requirements_passing_s651_test.py.
"""
from __future__ import annotations

import argparse
import collections
import csv
import glob
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(ROOT, "chatbox"))
import _program_requirements_score as S  # noqa: E402

COLLEGE_GLOB = os.path.join(HERE, "program_requirements_college", "*", "records", "*.json")
CENSUS = os.path.join(HERE, "status", "harvest_gap_census.json")
EXPORT_GLOB = os.path.join(ROOT, "tmc", "source_data", "coci_program_export_*.csv")
RECONCILE = os.path.join(HERE, "program_requirements_reconcile.json")
OUT_DIR = os.path.join(HERE, "program_requirements_passing_dryrun")
OUT_JSON = os.path.join(OUT_DIR, "passing_s651.json")
OUT_MD = os.path.join(OUT_DIR, "passing_s651.md")

# Cosumnes River's seven rescore-only passes, held for this dry run (d-cosumnes-two-pins-loaded-seven-held-s650).
HOLDS = ("Cosumnes River College", ("04602", "04607", "04614", "07305", "11319", "11338", "33542"))


def flat_checks(filed: dict) -> dict:
    """The live row's flat checks, as kb/_program_requirements_load.py writes them."""
    sc = filed.get("score") or {}
    return {"coverage": (sc.get("coverage") or {}).get("pass"),
            "invented": (sc.get("invented") or {}).get("pass"),
            "arithmetic": (sc.get("arithmetic") or {}).get("status")}


def program_total_ok(filed: dict, on: bool) -> bool | None:
    """Whether a filed record's program-total arithmetic passes with the S651 flag off or on, re-read from
    its filed sums (no text, so the word guard is not read); None where the program-total fill cannot
    reach the record: the arithmetic is not against a program total, a degree total sits beside it, the
    record says nothing of electives filling it, or the general education units made it exact."""
    arith = (filed.get("score") or {}).get("arithmetic") or {}
    prog = (filed.get("record") or {}).get("program") or {}
    comp, stated = arith.get("computed"), arith.get("stated")
    if (arith.get("against") != "program" or arith.get("degree") or S._span(prog.get("degree_total"))
            or not prog.get("electives_fill_degree") or arith.get("ge_included") or not comp or not stated
            or arith.get("status") not in ("equal", "unequal")):
        return None   # an incomplete sum never reaches the fill (score() reads its reasons first)
    if arith.get("status") == "equal" and arith.get("fill") is None:
        return None   # it passes on its sum alone (equal, meets, minimum, meets_top, total_only)
    st, lo, hi = (float(stated[0]), float(stated[1])), float(comp[0]), float(comp[1])
    prev = S.set_passing_s651(on)
    try:
        return bool(S.program_verdict(prog, st, lo, hi)["pass"]
                    or S.program_total_fill(prog, st, lo, hi, filed.get("award"), None, filed.get("record")) is not None)
    finally:
        S.set_passing_s651(prev)


def total_hours_candidate(filed: dict) -> bool:
    """Change 1's reach: a failing hours record whose courses carry no figure, read as incomplete against a
    printed total, at a college whose step does not already set hours_total_printed. Whether it passes is
    the page's to say (total_hours_printed on the captured text)."""
    rec = filed.get("record") or {}
    prog = rec.get("program") or {}
    arith = (filed.get("score") or {}).get("arithmetic") or {}
    c = flat_checks(filed)
    return (c["coverage"] is True and c["invented"] is True and arith.get("status") == "incomplete"
            and arith.get("against") == "program" and S._span(prog.get("total_units")) is not None
            and not prog.get("hours_total_printed") and S.hours_figureless(rec))


def read_filed(pattern: str = COLLEGE_GLOB) -> list:
    out = []
    for f in sorted(glob.glob(pattern)):
        with open(f, encoding="utf-8") as fh:
            d = json.load(fh)
        out.append(d)
    return out


def read_export(colleges) -> dict:
    """(college, control number) -> the program export's row, colleges resolved to the census's names
    by the loader's own resolver (chatbox/build_coci_offerings.py)."""
    from build_coci_offerings import make_college_resolver
    resolve = make_college_resolver(sorted(colleges))
    path = sorted(glob.glob(EXPORT_GLOB))[-1]
    out = {}
    with open(path, encoding="utf-8-sig", newline="") as fh:
        for r in csv.DictReader(fh):
            c = resolve(r.get("COLLEGE", ""))
            if c:
                out.setdefault((c, (r.get("CONTROL NUMBER") or "").strip()), r)
    return out


def no_closed_list(census: dict) -> list:
    """(college, control number, parked) for every census program whose cause is no closed list."""
    out = []
    for col, ps in census.get("programs_by_college", {}).items():
        for cn, v in ps.items():
            parts = v.split("|")
            if parts[0] == "no_closed_list":
                out.append((col, cn, False))
            elif parts[0] == "parked_college" and parts[1:2] == ["no_closed_list"]:
                out.append((col, cn, True))
    return out


def dry_run(filed: list, census: dict, export: dict, reconcile: dict) -> dict:
    colleges = collections.defaultdict(lambda: {"records": 0, "before": 0, "after": 0,
                                                "rule1_candidates": [], "rule3_candidates": [],
                                                "rule3_quoted": [], "rule4_pass_to_fail": [],
                                                "rule4_held": [], "own_list_programs": 0})
    holds = {}
    for d in filed:
        col, cn = d.get("college"), str(d.get("control_number"))
        row = colleges[col]
        row["records"] += 1
        before = S.counts_passing_on_tab(flat_checks(d))
        after = before
        off, on = program_total_ok(d, False), program_total_ok(d, True)
        c = flat_checks(d)
        listed_ok = c["coverage"] is True and c["invented"] is True
        if before and off is True and on is False:
            row["rule4_pass_to_fail"].append(cn)
            after = False
        elif not before and listed_ok and off is True and on is False:
            row["rule4_held"].append(cn)   # the current fill would pass it on a rescore; the guard keeps it failing
        if not before and total_hours_candidate(d):
            row["rule1_candidates"].append(cn)
        row["before"] += before
        row["after"] += after
        if col == HOLDS[0] and cn in HOLDS[1]:
            holds[cn] = {"filed": "pass" if before else "fail",
                         "current_function_rescore": "pass" if (listed_ok and off) else "fail",
                         "after": "pass" if after else "fail",
                         "award": d.get("award")}
    ncl = no_closed_list(census)
    patterns = collections.Counter()
    for col, cn, parked in ncl:
        e = export.get((col, cn)) or {}
        pat = S.ge_pattern_certificate(e.get("TITLE"), e.get("AWARD"), False)
        row = colleges[col]
        if pat is None:
            row["own_list_programs"] += 1
            continue
        patterns[pat + (" at a parked college" if parked else "")] += 1
        quoted = S.ge_pattern_evidence((reconcile.get("colleges") or {}).get(col), cn, pat)
        row["rule3_candidates"].append("%s %s" % (cn, pat))
        if quoted:
            row["rule3_quoted"].append(cn)
            row["after"] += 1
    per_college = []
    for col in sorted(colleges):
        r = colleges[col]
        r["movement"] = r["after"] - r["before"]
        per_college.append(dict({"college": col}, **r))
    tot = lambda k: sum(r[k] for r in per_college)  # noqa: E731
    totl = lambda k: sum(len(r[k]) for r in per_college)  # noqa: E731
    return {
        "dry_run": "S651 passing function, four changes, nothing applied",
        "basis": {"filed_records": "kb/program_requirements_college/*/records on main",
                  "census": "%s, %s" % (census.get("basis"), census.get("written_at")),
                  "passing": "the tab's rule, counts_passing_on_tab over each filed record's flat checks"},
        "totals": {"records": tot("records"), "before": tot("before"), "after": tot("after"),
                   "rule1_candidates": totl("rule1_candidates"), "rule2_programs_unread": tot("own_list_programs"),
                   "rule3_candidates": totl("rule3_candidates"), "rule3_quoted": totl("rule3_quoted"),
                   "rule3_by_pattern": dict(sorted(patterns.items())),
                   "rule4_pass_to_fail": totl("rule4_pass_to_fail"), "rule4_held": totl("rule4_held")},
        "rules": {
            "1": {"name": "noncredit Total Hours", "coded": True, "flips_from_files": 0,
                  "note": "fail-to-pass only; each candidate's flip is read on its captured text at the rescore"},
            "2": {"name": "own-list rule", "coded": False,
                  "note": "not coded: no record exists for a program with no closed list, and what a pass against "
                          "a college's own course list checks is not written down"},
            "3": {"name": "GE-pattern certificate rule", "coded": True,
                  "note": "criteria 1-3 matched from the census and the export; a program counts only with "
                          "criterion 4, quoted catalog words in the reconcile config"},
            "4": {"name": "degree electives-fill guard", "coded": True,
                  "note": "pass-to-fail where a filed pass rests on the program-total fill of a degree; held where "
                          "the current fill would pass a failing degree record on a rescore"}},
        "cosumnes_river_holds": {cn: holds.get(cn) for cn in HOLDS[1]},
        "per_college": per_college,
    }


def summary_md(r: dict) -> str:
    t = r["totals"]
    pc = r["per_college"]
    lines = ["## Passing function: one dry run for four changes (S651), nothing applied", "",
             "Filed records on `main`, scored by the tab's rule before and after; the live table may differ "
             "(a reconcile SELECT goes with this). Census: %s." % r["basis"]["census"], "",
             "| Change | Effect on the filed records |", "|---|---|",
             "| 1. Noncredit Total Hours | %d candidates, fail to pass only, each decided on its captured text "
             "at the rescore |" % t["rule1_candidates"],
             "| 2. Own-list rule | not coded: no record exists; %d programs with no closed list are unread |"
             % t["rule2_programs_unread"],
             "| 3. GE-pattern certificates | %d match criteria 1-3 (%s); %d have quoted evidence, so %d count |"
             % (t["rule3_candidates"], ", ".join("%s %d" % (k, v) for k, v in t["rule3_by_pattern"].items()),
                t["rule3_quoted"], t["rule3_quoted"]),
             "| 4. Degree electives-fill guard | %d pass to fail; %d failing degree records held |"
             % (t["rule4_pass_to_fail"], t["rule4_held"]), "",
             "**Passing, all filed records:** %d before, %d after, of %d." % (t["before"], t["after"], t["records"]),
             "", "### The ten largest college movements", "",
             "| College | Before | After | Change |", "|---|---:|---:|---:|"]
    moved = sorted((x for x in pc if x["movement"]), key=lambda x: (-abs(x["movement"]), x["college"]))[:10]
    for x in moved:
        lines.append("| %s | %d | %d | %+d |" % (x["college"], x["before"], x["after"], x["movement"]))
    if not moved:
        lines.append("| (none) | | | |")
    lines += ["", "### Change 4, every pass to fail", ""]
    p2f = [(x["college"], cn) for x in pc for cn in x["rule4_pass_to_fail"]]
    lines += ["- %s %s" % p for p in p2f] or ["- none"]
    held = ["%s %s" % (x["college"], cn) for x in pc for cn in x["rule4_held"]]
    lines += ["", "Held (the current fill would pass them on a rescore; the guard keeps them failing): "
              + ("; ".join(held) if held else "none") + ".", ""]
    nc = ["%s %d" % (x["college"], len(x["rule1_candidates"])) for x in pc if x["rule1_candidates"]]
    lines += ["Change 1's candidates by college: " + ("; ".join(nc) if nc else "none") + ".", "",
              "### Cosumnes River's seven holds", "", "| Control number | Filed | Current rescore | After |",
              "|---|---|---|---|"]
    for cn, h in r["cosumnes_river_holds"].items():
        h = h or {"filed": "no record", "current_function_rescore": "", "after": ""}
        lines.append("| %s | %s | %s | %s |" % (cn, h["filed"], h["current_function_rescore"], h["after"]))
    lines += ["", "Nothing is applied: the migration is drafted and not listed in `kb/migrations/.apply`."]
    return "\n".join(lines) + "\n"


def reconcile_live(filed: dict, live: dict) -> list:
    """Colleges whose filed records or passing count differ from the live table's (S648: a plan built from
    files was wrong about the table)."""
    out = []
    for col in sorted(set(filed) | set(live)):
        f, l = filed.get(col) or {}, live.get(col) or {}
        row = {"college": col, "records": f.get("records", 0), "before": f.get("before", 0),
               "live_rows": int(l.get("live_rows") or 0), "live_passing": int(l.get("live_passing") or 0)}
        if (row["records"], row["before"]) != (row["live_rows"], row["live_passing"]):
            out.append(row)
    return out


def live_section(r: dict, live_rows: list, export: dict, read_at: str) -> list:
    """The summary's live reconcile: the read's totals beside the files', the colleges that differ, and what
    each change's records are on the live table, as far as an aggregate read can say."""
    live = {x["college"]: x for x in live_rows}
    filed = {x["college"]: x for x in r["per_college"] if x["records"]}
    diff = reconcile_live(filed, live)
    lt = {k: sum(int(x.get(k) or 0) for x in live_rows)
          for k in ("live_rows", "live_passing", "active_rows", "active_passing", "s651_flips_live_passing")}
    t = r["totals"]
    flips = [(x["college"], cn) for x in r["per_college"] for cn in x["rule4_pass_to_fail"]]
    active = [f for f in flips if ((export.get(f) or {}).get("STATUS") or "").strip() == "Active"]
    same = {c for c in filed if c in live and filed[c]["records"] == int(live[c].get("live_rows") or 0)}

    def split(key):
        n = sum(len(filed[c][key]) for c in filed)
        return n, sum(len(filed[c][key]) for c in filed if c in same)
    pdiff = [d for d in diff if d["before"] != d["live_passing"]]
    out = ["", "### Live reconcile (%s)" % read_at, "",
           "**Live:** %d rows, %d passing; Active %d rows, %d passing. **Files:** %d records, %d passing, so "
           "%d filed records are not live and the files count %d more passing."
           % (lt["live_rows"], lt["live_passing"], lt["active_rows"], lt["active_passing"], t["records"], t["before"],
              t["records"] - lt["live_rows"], t["before"] - lt["live_passing"])
           + " **%d of %d colleges differ** (%d in the passing count). The ten largest differences:"
           % (len(diff), len(set(filed) | set(live)), len(pdiff)), "",
           "| College | Filed | Live rows | Filed passing | Live passing |", "|---|---:|---:|---:|---:|"]
    for d in sorted(diff, key=lambda d: (-(abs(d["records"] - d["live_rows"]) + abs(d["before"] - d["live_passing"])),
                                         d["college"]))[:10]:
        out.append("| %s | %d | %d | %d | %d |" % (d["college"], d["records"], d["live_rows"], d["before"],
                                                   d["live_passing"]))
    c1, c1s = split("rule1_candidates")
    c4, c4s = split("rule4_held")
    out += ["",
            "- **Change 4's five flips:** %d of 5 pass live today (the read's own count); %d are Active in the June "
            "program export. Against the table: live passing %d to %d, Active passing %d to %d."
            % (lt["s651_flips_live_passing"], len(active), lt["live_passing"],
               lt["live_passing"] - lt["s651_flips_live_passing"], lt["active_passing"],
               lt["active_passing"] - min(len(active), lt["s651_flips_live_passing"])),
            "- **Change 4's %d held and change 1's %d candidates** fail on file. The read is per college, so it "
            "cannot say which are live rows. %d held and %d candidates sit at colleges whose filed and live row "
            "counts agree; equal counts suggest, but do not prove, the same records." % (c4, c1, c4s, c1s),
            "- **Change 3's %d programs** (2 at parked colleges) and change 2's %d have no row; the census that "
            "named them read the live Active list. Change 3's would add %d to Active passing, once quoted."
            % (t["rule3_candidates"], t["rule2_programs_unread"], t["rule3_candidates"])]
    return out


LIVE_ROWS = os.path.join(OUT_DIR, "live_reconcile_s651_rows.json")
LIVE_READ_AT = "09:31Z 2026-11-14"


def build() -> tuple[str, str]:
    census = json.load(open(CENSUS, encoding="utf-8"))
    reconcile = json.load(open(RECONCILE, encoding="utf-8"))
    export = read_export(census.get("programs_by_college", {}).keys())
    r = dry_run(read_filed(), census, export, reconcile)
    md = summary_md(r)
    if os.path.exists(LIVE_ROWS):
        with open(LIVE_ROWS, encoding="utf-8") as fh:
            body = md.rstrip("\n").split("\n")
            md = "\n".join(body[:-1] + live_section(r, json.load(fh), export, LIVE_READ_AT) + ["- " + body[-1]]) + "\n"
    return json.dumps(r, indent=1, ensure_ascii=False) + "\n", md


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--check", action="store_true", help="fail when the committed pair differs from a rebuild")
    ap.add_argument("--live", metavar="FILE",
                    help="the rows of program_requirements_passing_dryrun/live_reconcile_s651.sql as JSON: "
                         "print each college whose live counts differ from the filed ones, and exit")
    a = ap.parse_args(argv)
    if a.live:
        with open(a.live, encoding="utf-8") as fh:
            live = {r["college"]: r for r in json.load(fh)}
        with open(OUT_JSON, encoding="utf-8") as fh:
            filed = {r["college"]: r for r in json.load(fh)["per_college"] if r["records"]}
        diff = reconcile_live(filed, live)
        for d in diff:
            print("%s: filed %s records, %s passing; live %s rows, %s passing"
                  % (d["college"], d["records"], d["before"], d["live_rows"], d["live_passing"]))
        print("%d of %d colleges differ" % (len(diff), len(set(filed) | set(live))))
        return 0
    js, md = build()
    if a.check:
        stale = [p for p, body in ((OUT_JSON, js), (OUT_MD, md))
                 if not os.path.exists(p) or open(p, encoding="utf-8").read() != body]
        for p in stale:
            print("stale: %s (run python3 kb/_program_requirements_passing_dryrun.py)" % os.path.relpath(p, ROOT))
        return 1 if stale else 0
    os.makedirs(OUT_DIR, exist_ok=True)
    for p, body in ((OUT_JSON, js), (OUT_MD, md)):
        with open(p, "w", encoding="utf-8") as fh:
            fh.write(body)
    t = json.loads(js)["totals"]
    print("passing dry run: %d records, %d before, %d after; rule 4 %d pass to fail, %d held; rule 1 %d "
          "candidates; rule 3 %d candidates, %d quoted" % (t["records"], t["before"], t["after"],
                                                           t["rule4_pass_to_fail"], t["rule4_held"],
                                                           t["rule1_candidates"], t["rule3_candidates"],
                                                           t["rule3_quoted"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
