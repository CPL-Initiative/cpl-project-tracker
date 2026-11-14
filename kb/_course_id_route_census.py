#!/usr/bin/env python3
"""Which of slice C's prefix_aliases pairs the course-id route retires, proved on the filed records (S653).

WHY. Slice C of issue #3299 (#3301) put 17 per-college prefix_aliases pairs into
kb/program_requirements_reconcile.json. The lessons (S652) name the next lever: most pairs exist only because
the COCI course list and the Program Course File spell a course's prefix differently, and the file's own CrsId
already prints the catalog's. kb/_course_id_route.py reads that id; the scorer and the capture take it before the
aliases. This census proves, per college and from committed files alone (no site contacted, nothing
dispatched, no table read), which pairs the route makes redundant.

THE CLOSED LISTS. Each program's closed list is rebuilt as chatbox/build_program_courses.py builds the
coci_program_courses table: the Program Course File's rows, each control number named by the COCI course list
(kb/reference/coci_course_list.xlsx) with the MIS owner preferred, and San Jose City's subject-named codes read as
the capture reads them (with_file_codes). Each course keeps its control number, so the route reads the same id the
live scorer reads from the closed list's "ccn".

THE PROOF (DECIDED by the S653 conductor). A pair retires only when the id route reproduces every match the pair
produced on the filed records: each (record, printed code, listed code) the pair alone renames, the route alone
renames the same way. A pair that renames nothing on the filed records, or any one match the route misses, stays
as the fallback. The id route runs before the aliases, so a retained pair still covers what the route cannot.

THE SELF-RECALL TEST (p-new-matcher-needs-self-recall-test-s652). The route is run over every match the filed
records already hold through another route (a prefix alias or a course renumber, under the committed config), and
each is right (the route names the same listed course), wrong (another listed course) or missed (none). Every
match the route makes that no other route made is checked against the college's own course names: a printed code
the COCI course list or the MIS course records name at the college under another control number and another
title is a conflict.

THE STATUS CHANGE. Every filed record statewide is re-read before (the committed config) and after (the route,
then the config without the retired pairs): coverage, invented and repeated as the scorer computes them, with the
filed arithmetic and outcomes (kb/_prefix_alias_census.py checks_pass). Each record whose score pass or tab count
moves is listed, by direction.

    python3 kb/_course_id_route_census.py            # write the plan, print the summary
    python3 kb/_course_id_route_census.py --check    # fail when the committed plan is stale

Output: kb/program_requirements_reconcile_out/course_id_route_2026-11-14/plan.json (withheld from Pages by
kb/*_out). Guard: tests/course_id_route_test.py.
"""
from __future__ import annotations

import argparse
import collections
import glob
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(ROOT, "chatbox"))
import _course_id_route as CI  # noqa: E402
import _prefix_alias_census as A  # noqa: E402
import _program_requirements_score as S  # noqa: E402
from _program_requirements_pilot import norm_code  # noqa: E402

RECONCILE = os.path.join(HERE, "program_requirements_reconcile.json")
OUT_DIR = os.path.join(HERE, "program_requirements_reconcile_out", "course_id_route_2026-11-14")
OUT = os.path.join(OUT_DIR, "plan.json")
PAIRS_SESSION = "S652"   # slice C's pairs, as prefix_aliases_cited names them
TAG = "S653"


def closed_lists() -> dict:
    """(college, program control number) -> [{"ccn", "code"}], as the coci_program_courses table is built."""
    import build_program_courses as B
    from _program_requirements_college import with_file_codes
    courses = B.load_courses()
    resolve = B.make_college_resolver(sorted({c["college"] for v in courses.values() for c in v}))
    prog_path = sorted(glob.glob(B.PROG_GLOB))[-1]
    mem = B.load_membership()
    xwalk, _ = B.college_crosswalk(mem, B.load_program_colleges(prog_path, resolve),
                                   {k: {c["college"] for c in v} for k, v in courses.items()})
    rows, _ = B.assemble(mem, xwalk, B.program_keys(resolve, prog_path), courses, B.load_mis_owner())
    out = collections.defaultdict(list)
    for r in rows:
        out[(r["college"], r["program_control_number"])].append({"ccn": r["course_control_number"],
                                                                 "code": r["course_code"], "units": r["units"]})
    for v in out.values():
        with_file_codes(v)
    return out


def renames(rec: dict) -> set:
    """(printed code, listed code) for every entry a renaming step changed."""
    return {(norm_code(e["printed_code"]), norm_code(e["code"])) for _, e, _ in S.placed_codes(rec)
            if e.get("printed_code")}


def bars(rec: dict, rec0: dict, listed: dict) -> dict:
    """coverage, invented and repeated as score() computes them, on a record already renamed."""
    placed = [(S.listed_key(e.get("code"), listed), e) for _, e, _ in S.placed_codes(rec)]
    keys = {k for k, _ in placed}
    missing = [k for k in listed if k not in keys]
    explained = {norm_code(m.get("code")): m.get("why") for m in rec0.get("missing_explained") or [] if m.get("code")}
    unexplained = [k for k in missing if not explained.get(k)]
    invented = {k for k, _ in placed if k not in listed}
    flagged = {k for k, e in placed if k not in listed and e.get("catalog_addition")}
    return {"coverage": not unexplained and not (listed and len(missing) == len(listed)),
            "invented": not (invented - flagged), "repeated": not S.repeated(rec)}


def arithmetic(before: dict, after: dict, listed: dict, filed: dict) -> dict | None:
    """The arithmetic on the renamed record where the renames move it, else None (the filed arithmetic stands).
    The census holds no page text, so both sides are scored without it and only a difference counts: a renamed
    course takes the list's units, and the blocks' sum moves (Mt. San Antonio 18236, S653 review)."""
    closed = [{"code": k, "units": u} for k, u in listed.items()]
    award = filed.get("award")
    b = S.score(before, closed, None, award, None, False, {})["arithmetic"]
    a = S.score(after, closed, None, award, None, False, {})["arithmetic"]
    key = lambda x: (x.get("pass"), x.get("status"), json.dumps(x.get("computed")))
    return None if key(a) == key(b) else a


def checks_pass(filed: dict, r: dict, arith: dict | None) -> tuple[bool, bool]:
    """(score pass, the tab's count), with the filed arithmetic unless the renames move it."""
    if arith is None:
        return A.checks_pass(filed, r)
    sc = dict(filed.get("score") or {})
    sc["arithmetic"] = arith
    return A.checks_pass(dict(filed, score=sc), r)


def college_names(path: str = A.COCI) -> tuple[dict, dict]:
    """The college's own course names: college -> {code: {(control, title key)}} from the COCI course list, and
    MIS college code -> the same from the MIS course records."""
    coci, _ = A.load_coci(path)
    mis = A.load_mis()
    fold = lambda t: {k: {(c, A.title_key(x)) for c, x in v} for k, v in t.items()}
    return {c: fold(v) for c, v in coci.items()}, {c: fold(v) for c, v in mis.items()}


def build() -> dict:
    with open(RECONCILE, encoding="utf-8") as fh:
        conf = json.load(fh)["colleges"]
    closed = closed_lists()
    ids = CI.load_ids()
    records = A.load_records()
    coci_names, mis_names = college_names()
    pcf_titles, pcf_programs, _ = A.load_pcf()

    pairs = {}   # college -> [(catalog prefix, file prefix)]
    for college, c in sorted(conf.items()):
        for cite in c.get("prefix_aliases_cited") or []:
            if cite.get("session") == PAIRS_SESSION:
                pairs.setdefault(college, []).append((norm_code(cite["printed"]), norm_code(cite["file"])))

    plan = {"_what": ("The course-id route's proof over the filed records (%s): which of slice C's prefix_aliases "
                      "pairs it retires, its self-recall test, and the status change on every filed record. "
                      "Read-only over committed files; no site contacted, nothing dispatched, no table written."
                      % TAG),
            "rule": "a pair retires only when the id route reproduces every match the pair produced on the filed records",
            "colleges": {}, "self_recall": {}, "new_matches": {}, "status_change": {}, "unmatched_records": {}}
    recall = collections.Counter()
    recall_examples = collections.defaultdict(list)
    new = collections.Counter()
    new_kind = collections.Counter()
    new_prefix = collections.Counter()
    new_examples = collections.defaultdict(list)
    moved = collections.defaultdict(lambda: collections.defaultdict(list))
    arith = collections.defaultdict(list)
    unmatched = collections.Counter()
    list_differs = collections.Counter()
    per_college = {}

    for slug in sorted(records):
        recs = records[slug]
        college = recs[0][1].get("college")
        conf_c = conf.get(college) or {}
        aliases = dict(conf_c.get("prefix_aliases") or {})
        # Before is the config as slice C left it: a pair this census retired stays in "before".
        for C, F in pairs.get(college) or []:
            if not any(norm_code(k) == C for k in aliases):
                aliases[C] = F
        aliases.update(conf_c.get("course_renumbers") or {})
        ctrls = {f.get("control_number") for _, f in recs}
        cc = max(pcf_programs, key=lambda c: len(pcf_programs[c] & ctrls)) if ctrls else None
        mine = pairs.get(college) or []
        proof = {p: {"alias_matches": 0, "reproduced": 0, "missed": [],
                     "filed_list_matches": 0, "filed_list_reproduced": 0, "filed_list_missed": []} for p in mine}
        work = []
        for name, f in recs:
            rec0 = f.get("record")
            if not f.get("score") or not isinstance(rec0, dict):
                continue
            cl = closed.get((college, f.get("control_number")))
            if not cl:
                unmatched[college] += 1
                continue
            listed = {norm_code(c["code"]): S._num(c.get("units")) for c in cl if c.get("code")}
            filed_listed = A.rebuilt_list(f, aliases)
            if set(listed) != set(filed_listed):
                list_differs[college] += 1
            lid = CI.listed_ids(cl, ids)
            by_id = renames(S.with_course_ids(rec0, listed, lid))
            # The list the filed score was taken against may name a course otherwise than today's committed
            # course list (Moreno Valley's HIS 1 is HIST 1 there now). A filed-list course keeps a control number
            # only where today's list names it by the same code: what committed files cannot tie is not proved.
            ccn_of = {norm_code(c["code"]): c.get("ccn") for c in cl if c.get("code")}
            fcl = [{"code": k, "ccn": ccn_of.get(k)} for k in filed_listed]
            by_id_filed = renames(S.with_course_ids(rec0, filed_listed, CI.listed_ids(fcl, ids)))
            for C, F in mine:
                got = renames(S.with_prefix_aliases(rec0, listed, {C: F}))
                proof[(C, F)]["alias_matches"] += len(got)
                proof[(C, F)]["reproduced"] += len(got & by_id)
                proof[(C, F)]["missed"] += [[f.get("control_number"), p, k] for p, k in sorted(got - by_id)]
                got = renames(S.with_prefix_aliases(rec0, filed_listed, {C: F}))
                proof[(C, F)]["filed_list_matches"] += len(got)
                proof[(C, F)]["filed_list_reproduced"] += len(got & by_id_filed)
                proof[(C, F)]["filed_list_missed"] += [[f.get("control_number"), p, k]
                                                       for p, k in sorted(got - by_id_filed)]
            # Self-recall over the matches another route already holds (the committed aliases and renumbers).
            held = renames(S.with_prefix_aliases(rec0, listed, aliases))
            id_of = dict(by_id)
            for p, k in sorted(held):
                verdict = "right" if id_of.get(p) == k else "wrong" if p in id_of else "missed"
                recall[verdict] += 1
                if verdict != "right" and len(recall_examples[verdict]) < 12:
                    recall_examples[verdict].append({"college": college, "record": f.get("control_number"),
                                                     "printed": p, "listed": k, "id_route": id_of.get(p)})
            # The route's own matches no other route made: checked against the college's own course names.
            ctl_of = {norm_code(c["code"]): c.get("ccn") for c in cl}
            for p, k in sorted(by_id - held):
                names = (coci_names.get(college, {}).get(p, set()) | mis_names.get(cc, {}).get(p, set()))
                mine_t = {A.title_key(t) for _, t in pcf_titles.get(cc, {}).get(p, ())}
                clash = sorted(t for c, t in names if c != ctl_of.get(k) and t not in mine_t)
                # confirmed: the college's own course names hold the printed code for this course; no_names: they
                # name it nowhere, so nothing held stands against the match or for it.
                verdict = "conflict" if clash else "confirmed" if names else "consistent_no_names"
                new[verdict] += 1
                sp, sk = A.split(p), A.split(k)
                kind = "common_course" if A.CCN.match(p) else "prefix" if sp and sk and sp[1] == sk[1] else "other"
                new_kind[kind] += 1
                if kind == "prefix":
                    new_prefix["%s: %s for %s" % (college, sp[0], sk[0])] += 1
                slot = "conflict" if clash else kind
                if len(new_examples[slot]) < (40 if clash else 8):
                    new_examples[slot].append({"college": college, "record": f.get("control_number"),
                                               "printed": p, "listed": k, "other_titles": clash[:2]})
            work.append((f, rec0, [(listed, lid, "committed_list"),
                                   ({k: None for k in filed_listed}, CI.listed_ids(fcl, ids), "filed_list")]))

        retired = [p for p, v in proof.items() if v["alias_matches"] and v["reproduced"] == v["alias_matches"]
                   and v["filed_list_reproduced"] == v["filed_list_matches"]]
        kept = {k: v for k, v in aliases.items()
                if not any(norm_code(k) == C and norm_code(v) == F for C, F in retired)}
        for f, rec0, lists in work:
            for listed, lid, which in lists:
                b = S.with_prefix_aliases(rec0, listed, aliases)
                a = S.with_prefix_aliases(S.with_course_ids(rec0, listed, lid, kept), listed, kept)
                fb, tb = checks_pass(f, bars(b, rec0, listed), None)
                moved_arith = arithmetic(b, a, listed, f)
                fa, ta = checks_pass(f, bars(a, rec0, listed), moved_arith)
                if which == "committed_list" and moved_arith is not None:
                    arith[college].append({"record": f.get("control_number"),
                                           "filed": (f.get("score") or {}).get("arithmetic", {}).get("status"),
                                           "renamed": moved_arith.get("status"),
                                           "computed": moved_arith.get("computed"), "stated": moved_arith.get("stated")})
                if (fb, tb) != (fa, ta):
                    moved[which]["%s_to_%s" % ("pass" if tb else "fail", "pass" if ta else "fail")].append(
                        {"college": college, "record": f.get("control_number"), "score_pass": [fb, fa],
                         "tab": [tb, ta]})
        if mine:
            per_college[college] = {
                "slug": slug, "college_code": cc,
                "pairs": [{"printed": C, "file": F, "verdict": "retire" if (C, F) in retired else "keep",
                           "alias_matches": v["alias_matches"], "id_route_reproduces": v["reproduced"],
                           "missed": v["missed"][:8], "missed_count": len(v["missed"]),
                           "filed_list_matches": v["filed_list_matches"],
                           "filed_list_reproduced": v["filed_list_reproduced"],
                           "filed_list_missed": v["filed_list_missed"][:8],
                           "filed_list_missed_count": len(v["filed_list_missed"])}
                          for (C, F), v in sorted(proof.items())]}

    plan["colleges"] = per_college
    plan["self_recall"] = {"counts": dict(recall), "examples": dict(recall_examples)}
    plan["new_matches"] = {"counts": dict(new), "by_kind": dict(new_kind),
                           "prefix_by_college": dict(sorted(new_prefix.items())), "examples": dict(new_examples)}
    plan["status_change"] = {w: {k: v for k, v in sorted(m.items())} for w, m in sorted(moved.items())}
    plan["arithmetic_moves"] = {k: v for k, v in sorted(arith.items())}
    plan["unmatched_records"] = {"no_rebuilt_closed_list": dict(sorted(unmatched.items())),
                                 "rebuilt_list_differs_from_filed_score": dict(sorted(list_differs.items()))}
    allp = [p for c in per_college.values() for p in c["pairs"]]
    plan["summary"] = {"pairs": len(allp), "retire": sum(p["verdict"] == "retire" for p in allp),
                       "keep": sum(p["verdict"] == "keep" for p in allp),
                       "self_recall": dict(recall), "new_matches": dict(new), "new_matches_by_kind": dict(new_kind),
                       "status_change": {w: {k: len(v) for k, v in sorted(m.items())} for w, m in sorted(moved.items())},
                       "arithmetic_moves": sum(len(v) for v in arith.values())}
    return plan


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    plan = build()
    text = json.dumps(plan, indent=1, sort_keys=True, ensure_ascii=False) + "\n"
    if args.check:
        with open(OUT, encoding="utf-8") as fh:
            if fh.read() != text:
                print("STALE: %s; run python3 kb/_course_id_route_census.py" % os.path.relpath(OUT, ROOT))
                return 1
        print("course-id route plan: current")
        return 0
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(text)
    print(json.dumps(plan["summary"], indent=1))
    for college, c in plan["colleges"].items():
        for p in c["pairs"]:
            print("%-32s %s for %s: %s, %d of %d (filed lists %d of %d)" % (
                college, p["printed"], p["file"], p["verdict"], p["id_route_reproduces"], p["alias_matches"],
                p["filed_list_reproduced"], p["filed_list_matches"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
