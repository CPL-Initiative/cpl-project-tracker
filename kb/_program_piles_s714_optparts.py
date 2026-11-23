#!/usr/bin/env python3
"""S714 follow-up: the ten records at other colleges that option_parts moves to passing, rescored and planned.

#3714 (merged as f0d84966) taught the scorer to read one option the reading split over several blocks of its option
group (kb/_program_requirements_score.py, option_parts). Its reach, measured against each record's own state list
(#3714's second reader), moved ten verdicts at other colleges from their filed and live verdicts to passing: Foothill
06047, Glendale 24042, Golden West 18423, MiraCosta 18345, Monterey Peninsula 03653 and 22098, Reedley 01773, 18990
and 46449, Santa Barbara City 05934. This plan rescores those ten on main's scorer and writes only rows whose verdict
moves. The five records whose arithmetic alone moves take no row.

THE RESCORE. Each record's arithmetic is re-added by main's scorer against the record's own state list and its
college's renumbers and aliases (kb/_program_piles_s714_ccsf.py fresh_score), with option_parts on. The record is
never changed. A record moves only where, with option_parts off, the scorer reproduces the filed arithmetic exactly,
or (Foothill 06047, whose filed arithmetic an older scorer wrote) where it already reads the arithmetic equal and
option_parts reads it equal exactly; the degree reading must be unchanged either way.

THE SELF-RECALL. The held answer per record is the hand reading of its notes (HAND_HELD). The claim check reads two
sources apart from the scorer's fields: the record's notes (the reader's own words that the blocks of one option go
together), and today's capture (sources.json): every listed course of the option's blocks among the codes the
capture found on the program's page. Boundary readings: the printed total one unit short or past at the low end (no
pass), the split blocks renamed apart (no part, no pass), and the split blocks given one name (alternatives: no pass).

    python3 kb/_program_piles_s714_optparts.py --dry-run
    python3 kb/_program_piles_s714_optparts.py --tag s714o

Guard: tests/program_piles_s714_optparts_test.py.
"""
from __future__ import annotations

import argparse
import ast
import collections
import copy
import glob
import json
import os
import re
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s713 as P  # noqa: E402
import _program_piles_s714_ccsf as C  # noqa: E402
import _program_requirements_score as S  # noqa: E402

ROOT = os.path.dirname(HERE)
COLLEGE_DIR = NG.COLLEGE_DIR

# The hand reading of each record's notes (S714): the option the reading split, and what the notes say of it.
HAND_HELD = {
    ("Foothill College", "06047"): "passes: each of three track options is three blocks (core, four units, support) "
                                   "named Option 1/2/3; 40-48 as printed",
    ("Glendale Community College", "24042"): "passes: each of three options is a required block and a nested "
                                             "choice; 185-560 hours as printed",
    ("Golden West College", "18423"): "passes: Option 1 (four required courses and one elective, 21) or Option 2 "
                                      "(two courses and three electives, 19); 19-21 as printed",
    ("MiraCosta College", "18345"): "passes: Option 1 is two blocks (6 required units and a 3-unit list) against "
                                    "Option 2's 9; 27 as printed",
    ("Monterey Peninsula College", "03653"): "passes: Option 1 is six ADMJ courses and 2-3 units, completed "
                                             "together; 20-25.5 as printed",
    ("Monterey Peninsula College", "22098"): "passes: Option 1 General is both Option 1 blocks together; 20-25.5 as "
                                             "printed",
    ("Reedley College", "01773"): "passes: the 2-unit choice is nested inside Option 3 (12 + 2 = 14); 26-29 as "
                                  "printed",
    ("Reedley College", "18990"): "passes: the 2-unit choice is nested inside Option 3; 26-29 as printed",
    ("Reedley College", "46449"): "passes: the 2-unit choice belongs only to Option 3, not a fourth option; 24-27 as "
                                  "printed",
    ("Santa Barbara City College", "05934"): "held: Option B is two blocks taken together (6 and 3-5) against "
                                             "Option A's 9, 20-23 as printed, but today's capture does not find "
                                             "ENVS 112 and ENVS 115 (the S714 conductor: the capture claim is the "
                                             "gate)",
}
# Records whose hand reading is the option_parts reading (the claim checks and boundaries read each), passing or held.
READ_AS_PARTS = tuple(HAND_HELD)
# The capture claim is the gate (p-claim-check-reads-current-capture-s713; the S714 conductor): a record whose option's
# listed courses today's capture does not all find takes no row until a read settles the ones it missed.
CAPTURE_HOLD = "held: today's capture finds %d of the option's %d listed courses (%s not found); a read settles them"
ARITH_ONLY = (("Foothill College", "36328"), ("Napa Valley College", "36251"), ("Evergreen Valley College", "45025"),
              ("Santa Monica College", "03272"), ("Solano Community College", "20981"))

# The claim check on the notes: the reader says the blocks of one option go together (wider than #3714's matcher,
# which read three City College of San Francisco notes; every wording here is one of these ten records').
PARTS_STANDS = re.compile(
    r"\bone\s+combined\s+option\b|\b(?:blocks\s+)?taken\s+together\b|\btogether\s+form\s+option\b"
    r"|\bcompleted\s+together\b|\bnested\s+inside\s+option\b|\bbelongs?\s+(?:only\s+)?(?:to|with)\s+option\b"
    r"|\bboth\s+option\s+\w+\s+blocks\b|\b(?:is|are)\s+made\s+(?:up\s+)?of\s+(?:two|three|four)\s+blocks\b"
    r"|\bconsists?\s+of\s+(?:two|three|four)\s+blocks\b|\b(?:recorded\s+as|is)\s+(?:two|three|four)\s+blocks\b"
    r"|\bwhich\s+blocks\s+belong\s+together\b|\bfirst\s+two\s+blocks\b|\blast\s+two\s+blocks\b", re.I)
PARTS_AGAINST = re.compile(r"\b(?:a|an)\s+(?:separate|third|fourth|fifth)\s+(?:alternative\s+)?option\b", re.I)


def notes_claim(filed: dict) -> str:
    """'stands', 'against' or 'silent': what the record's notes say of the option's blocks going together."""
    notes = [str(n) for n in (filed.get("record") or {}).get("notes") or []]
    for n in notes:
        for m in PARTS_AGAINST.finditer(n):
            if not re.search(r"\bnot\s+(?:as\s+)?$", n[max(0, m.start() - 8):m.start()], re.I):
                return "against"
    return "stands" if any(PARTS_STANDS.search(n) for n in notes) else "silent"


def _slug_dir(filed: dict) -> str | None:
    for d in glob.glob(os.path.join(COLLEGE_DIR, "*", "records", "%s.json" % filed["control_number"])):
        with open(d, encoding="utf-8") as fh:
            if json.load(fh).get("college") == filed.get("college"):
                return os.path.dirname(os.path.dirname(d))
    return None


def capture_claim(filed: dict) -> dict:
    """Today's capture (sources.json): which listed courses of the split option's blocks it found on the page."""
    d = _slug_dir(filed)
    src = os.path.join(d, "sources.json") if d else None
    if not src or not os.path.isfile(src):
        return {"status": "no capture"}
    with open(src, encoding="utf-8") as fh:
        e = next((x for x in json.load(fh) if str(x.get("control_number")) == str(filed["control_number"])), None)
    if not e:
        return {"status": "no capture"}
    found = e.get("codes_found") or []
    if isinstance(found, str):
        found = ast.literal_eval(found)
    found = {S.norm_code(x) for x in found}
    listed = {S.norm_code(c.get("code")) for c in C.closed_list(filed["college"], filed["control_number"])}
    parts = S.option_parts(filed.get("record") or {})
    codes = {S.norm_code(c.get("code")) for i in parts for c in filed["record"]["blocks"][i].get("courses") or []}
    want = codes & listed
    miss = sorted(want - found)
    return {"status": "stands" if not miss else "partial", "listed_in_option": len(want),
            "found": len(want) - len(miss), "not_found": miss, "pages": (e.get("source") or {}).get("pages")
            if isinstance(e.get("source"), dict) else None}


# ── the rescore ───────────────────────────────────────────────────────────
def rescore(filed: dict) -> dict:
    """{"score", "exact", "why"}: the filed score with main's arithmetic, option_parts on."""
    before, after = C.arithmetic(filed)
    sc = copy.deepcopy(filed.get("score") or {})
    filed_arith = sc.get("arithmetic")
    with C.parts_off():
        deg_off = C.fresh_score(filed).get("degree")
    deg_on = C.fresh_score(filed).get("degree")
    if before == filed_arith:
        exact, why = True, "with option_parts off, main's scorer reproduces the filed arithmetic"
    elif after == filed_arith:
        exact, why = True, "the filed arithmetic is main's with option_parts on (this plan's own write, read again)"
    elif before.get("status") == "equal" and after.get("status") == "equal" and after.get("computed") == after.get(
            "stated"):
        exact, why = True, ("the filed arithmetic is an older scorer's; main's scorer reads it equal with option_parts "
                            "off and equal exactly with it on")
    else:
        exact, why = False, "main's scorer does not reproduce the filed arithmetic"
    if deg_on != deg_off:
        exact, why = False, "option_parts moves the degree reading"
    sc["arithmetic"] = after
    sc["pass"] = C._overall(sc)
    return {"score": sc, "exact": exact, "why": why, "before": before}


def every_target(every: list[dict]) -> dict:
    keys = set(HAND_HELD) | set(ARITH_ONLY)
    return {(f["college"], str(f["control_number"])): f for f in every
            if (f.get("college"), str(f.get("control_number"))) in keys}


def row_passes(checks: dict | None) -> bool:
    """A live row's verdict, as passes_live reads a score: coverage, invented and the arithmetic equal."""
    c = checks or {}
    return c.get("coverage") is True and c.get("invented") is True and c.get("arithmetic") == "equal"


def precision(targets: dict, was: dict | None = None) -> dict:
    """The verdict move against the hand reading. was: {key: the row's verdict before} (a receipt's before-images,
    once the plan has written); left out, the filed verdict."""
    out = {"read": 0, "right": 0, "wrong": []}
    for key, f in targets.items():
        truth = "passes" if HAND_HELD.get(key, "").startswith("passes") else "none"
        rs = rescore(f)
        before = (was or {}).get(key, S.passes_live(f["score"]))
        moves = (rs["exact"] and S.passes_live(rs["score"]) and not before
                 and (key not in HAND_HELD or capture_claim(f)["status"] == "stands"))
        got = "passes" if moves else "none"
        out["read"] += 1
        if got == truth:
            out["right"] += 1
        else:
            out["wrong"].append(list(key) + [got])
    return out


def claim_checks(targets: dict) -> dict:
    out = {"notes": collections.Counter(), "capture": collections.Counter(), "not_standing": []}
    for key in HAND_HELD:
        f = targets[key]
        n, c = notes_claim(f), capture_claim(f)
        out["notes"][n] += 1
        out["capture"][c["status"]] += 1
        if n != "stands" or c["status"] not in ("stands", "partial"):
            out["not_standing"].append(list(key) + [n, c["status"]])
        if c["status"] == "partial":
            out.setdefault("partial", []).append(list(key) + [c["found"], c["listed_in_option"], c["not_found"]])
    return {k: (dict(v) if isinstance(v, collections.Counter) else v) for k, v in out.items()}


def boundaries(targets: dict) -> dict:
    out, wrong = collections.Counter(), []

    def tally(name, ok, key):
        out["%s %s" % (name, "right" if ok else "wrong")] += 1
        if not ok:
            wrong.append(list(key) + [name])

    def passes(f):
        return C.fresh_score(f)["arithmetic"].get("status") == "equal"

    for key in HAND_HELD:
        f = targets[key]
        st = S._span(f["record"]["program"].get("total_units"))
        for name, (lo, hi) in (("total low one short", (st[0] - 1, st[1])),
                               ("total low one past", (st[0] + 1, max(st[1], st[0] + 1)))):
            g = copy.deepcopy(f)
            g["record"]["program"]["total_units"] = {"min": lo, "max": hi}
            tally(name, not passes(g), key)
        parts = S.option_parts(f["record"])
        split = [i for i, gk in parts.items() if sum(1 for x in parts.values() if x == gk) > 1]
        g = copy.deepcopy(f)
        for i in split:
            g["record"]["blocks"][i]["name"] = g["record"]["blocks"][split[0]]["name"]
        # No part, and the sum no longer the printed total exactly (Foothill 06047 still reads equal on main's fill
        # reading, 4-36 against 40-48: its sum is not the total, so the reading is gone).
        a = C.fresh_score(g)["arithmetic"]
        tally("split blocks given one name", not S.option_parts(g["record"]) and a.get("computed") != a.get("stated"),
              key)
    return {"counts": dict(out), "wrong": wrong}


# ── the plan ──────────────────────────────────────────────────────────────
def plan(write: bool, every: list[dict] | None = None) -> dict:
    every = every if every is not None else C.every_record()
    targets = every_target(every)
    colleges = {k[0] for k in HAND_HELD}
    images = NG._load_images(colleges)
    rows, held = [], []
    for key in sorted(HAND_HELD):
        f = targets.get(key)
        if f is None:
            held.append({"college": key[0], "control_number": key[1], "why": "no committed record"})
            continue
        if S.passes_live(f["score"]):
            continue   # moved already (this plan's own write, read again)
        rs = rescore(f)
        if not rs["exact"] or not S.passes_live(rs["score"]):
            held.append({"college": key[0], "control_number": key[1], "why": rs["why"]})
            continue
        cap = capture_claim(f)
        if cap["status"] != "stands":
            held.append({"college": key[0], "control_number": key[1], "why": CAPTURE_HOLD % (
                cap.get("found", 0), cap.get("listed_in_option", 0), ", ".join(cap.get("not_found") or []))
                if cap["status"] == "partial" else "held: no capture to check the claim against"})
            continue
        img = images.get(key)
        if img is None:
            held.append({"college": key[0], "control_number": key[1], "why": "the load leaves it out"})
            continue
        if S.counts_passing_on_tab(img["checks"]):
            held.append({"college": key[0], "control_number": key[1], "why": "its load image already passes"})
            continue
        p = os.path.join(_slug_dir(f), "records", "%s.json" % key[1])
        row = {"college": key[0], "control_number": key[1], "award": f.get("award"),
               "extracted_run": f.get("extracted_run"), "moves_to": "passes", "readings": ["option_parts"],
               "exact": rs["why"], "path": os.path.relpath(p, ROOT)}
        if write:
            row["before_image"] = {k: img[k] for k in ("program_title", "award", "catalog_year", "source_url",
                                                       "measure", "total_min", "total_max", "record", "checks",
                                                       "extracted_run")}
            f = dict(f, score=rs["score"])
            with open(p, "w", encoding="utf-8") as fh:
                json.dump(f, fh, ensure_ascii=False, indent=1)
                fh.write("\n")
        rows.append(row)
    for key in ARITH_ONLY:
        held.append({"college": key[0], "control_number": key[1],
                     "why": "option_parts moves its arithmetic alone; its verdict stays (no row)"})
    if write and rows:
        after = NG._load_images(colleges)
        for r in rows:
            img = after[(r["college"], r["control_number"])]
            if img["record"] != r["before_image"]["record"]:
                raise SystemExit("the rescore changed the record of %s %s" % (r["college"], r["control_number"]))
            if not S.counts_passing_on_tab(img["checks"]):
                raise SystemExit("%s %s does not pass at its load image" % (r["college"], r["control_number"]))
            r["after_image"] = {"checks": img["checks"]}
    for i, r in enumerate(rows, 1):
        r["i"] = i
    return {"rows": rows, "held": held}


def md5_pre_read(rows: list[dict]) -> str:
    """The compact pre-read (p-compact-preread-by-md5-s713): each before-image's record and checks and the
    after-image's checks as md5 of their jsonb text, hashed by a local Postgres 16 so the text form is Postgres's."""
    def lit(s):
        return "'" + s.replace("'", "''") + "'"
    vals = ",\n".join("(%d, %s::jsonb, %s::jsonb, %s::jsonb)" % (
        r["i"], lit(json.dumps(r["before_image"]["record"], ensure_ascii=False)),
        lit(json.dumps(r["before_image"]["checks"], ensure_ascii=False)),
        lit(json.dumps(r["after_image"]["checks"], ensure_ascii=False))) for r in rows)
    q = ("select json_agg(json_build_object('i', i, 'rec', md5(rec::text), 'chk', md5(chk::text), "
         "'aft', md5(aft::text)) order by i) from (values %s) v(i, rec, chk, aft);" % vals)
    res = subprocess.run(["sudo", "-u", "postgres", "psql", "-At", "-c", q], capture_output=True, text=True)
    if res.returncode:
        raise SystemExit("the local Postgres did not hash the images: " + res.stderr[:300])
    h = {d["i"]: d for d in json.loads(res.stdout)}
    lines = ",\n".join("  (%d, %s, '%s', %s, '%s', '%s', '%s')" % (
        r["i"], lit(r["college"]), r["control_number"], r["extracted_run"], h[r["i"]]["rec"], h[r["i"]]["chk"],
        h[r["i"]]["aft"]) for r in rows)
    return ("with v(i, college, control_number, extracted_run, rec_md5, chk_md5, after_md5) as (values\n%s)\n"
            "select json_build_object(\n"
            "  'listed', (select count(*) from v),\n"
            "  'on_run', count(*) filter (where r.extracted_run = v.extracted_run),\n"
            "  'record_is_before', count(*) filter (where r.extracted_run = v.extracted_run "
            "and md5(r.record::text) = v.rec_md5),\n"
            "  'checks_is_before', count(*) filter (where r.extracted_run = v.extracted_run "
            "and md5(r.checks::text) = v.chk_md5),\n"
            "  'already_after', count(*) filter (where md5(r.checks::text) = v.after_md5),\n"
            "  'checked_now', count(*) filter (where r.checked),\n"
            "  'confirm_matches', count(*) filter (where lv.verdict = 'confirm'\n"
            "                                       and lv.requirements_fp = public.program_record_fp(r.record)))\n"
            "  from v join public.program_requirement_records r\n"
            "    on r.college = v.college and r.control_number = v.control_number\n"
            "  left join lateral (select pv.verdict, pv.requirements_fp from public.program_record_verdicts pv\n"
            "                      where pv.college = v.college and pv.control_number = v.control_number\n"
            "                      order by pv.id desc limit 1) lv on true;" % lines)


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--tag", default="s714o")
    a = ap.parse_args(argv)
    every = C.every_record()
    targets = every_target(every)
    pr, cc, bd = precision(targets), claim_checks(targets), boundaries(targets)
    reach = C.option_parts_reach(every)
    print("precision: read %d, right %d, wrong %r" % (pr["read"], pr["right"], pr["wrong"]))
    print("claim checks: %s" % json.dumps(cc))
    print("boundaries: %s" % json.dumps(bd))
    print("reach: fires %d, right %d, moves %d, from passing %d" % (reach["fires"], reach["right"],
                                                                    len(reach["moves"]), len(reach["from_passing"])))
    if pr["wrong"] or bd["wrong"] or cc["not_standing"] or reach["wrong"] or reach["from_passing"]:
        raise SystemExit("the self-recall reads a wrong answer: no plan is written")
    res = plan(write=not a.dry_run, every=every)
    print("plan: %d rows; held %d" % (len(res["rows"]), len(res["held"])))
    if a.dry_run or not res["rows"]:
        return 0
    rows = res["rows"]
    day = time.strftime("%Y-%m-%d", time.gmtime())
    path = os.path.join(NG.RECEIPTS, "program_requirement_records_piles_optparts_%s_%s.json" % (day, a.tag))
    body = {"rule": NG.RULING + "; S714: one option the reading split over several blocks (option_parts, #3714)",
            "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "moved": len(rows), "precision": pr, "claim_checks": cc, "boundaries": bd,
            "reach": reach, "held": res["held"], "records": rows,
            "representation": "checks.arithmetic as main's scorer reads one option over several blocks; the record "
                              "unchanged",
            "claim_check_reads": ("The notes claim reads the record's notes, the reader's own words; the capture claim "
                                  "reads today's capture (sources.json at each college): the listed courses of the "
                                  "option's blocks among the codes it found on the program's page."),
            "follow_verdict": P.FOLLOW_VERDICT,
            "pre_read": P.confirm_pre_read(rows), "pre_read_md5": md5_pre_read(rows),
            "apply": P.confirm_guarded_apply(rows, a.tag + " piles"),
            "rollback": NG.rollback_sql(rows, a.tag + " piles rollback")}
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(body, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    rel = os.path.relpath(path, ROOT)
    hdr = ("-- %s: the %d records at other colleges option_parts moves to passing (#3714's reach). Each row's checks\n"
           "-- become the college load's image of its committed record (load_rows); the record itself is unchanged.\n"
           "-- Receipt: %s (before_image per row).\n" % (a.tag.upper(), len(rows), rel))
    base = os.path.join(HERE, "migrations", "%s_%s_prreq_piles_" % (day, a.tag))
    parts = {
        "preread_md5.sql": ("-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text\n"
                            "-- (the full before-values, the fallback where a hash does not match, are in "
                            "..._preread.sql).\n" + body["pre_read_md5"]),
        "preread.sql": "-- Pre-read, read-only: one SELECT, one JSON value.\n" + body["pre_read"],
        "apply.sql": ("-- Guarded UPDATE: only where the row holds the filed run, the before-image's record and checks,\n"
                      "-- and no person's check. It aborts, writing nothing, unless it matches the plan's %d rows less\n"
                      "-- those a person checked (listed as skipped_checked), or a row holds a matching confirm.\n"
                      % len(rows) + body["apply"]),
        "rollback.sql": ("-- Rollback, NOT applied: the before-image's checks back where the row still holds the\n"
                         "-- after-image, skipping and listing a row a person checked. A rollback lasts only until the\n"
                         "-- next load of that college: revert the record files too (git revert of this plan's commit).\n"
                         + body["rollback"]),
    }
    for name, text in parts.items():
        with open(base + name, "w", encoding="utf-8") as fh:
            fh.write(hdr + text + "\n")
    print("receipt %s" % rel)
    return 0


if __name__ == "__main__":
    sys.exit(main())
