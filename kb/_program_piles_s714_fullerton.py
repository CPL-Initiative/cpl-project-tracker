#!/usr/bin/env python3
"""S714, lane 2's cheap piles at Fullerton: one free reading and its plan, no paid read.

The census (kb/status/harvest_gap_census.json, run 45161770730) lists 24 Fullerton programs under the reconcile_steps
lever. Every one is read by hand below (HAND_HELD, with its cause).

THE READING, THE CAMPUS LETTER'S PLACE (kb/program_requirements_reconcile.json, the college's course_renumbers). The
2026-2027 catalog prints every Fullerton course with its campus letter after the number ("HORT 002 F"). The state's
Program Course File keeps most rows the same way and a few with the letter before the subject ("F HORT002") or with
no letter ("CSTR 42"). Each printed code that a program's list carries only in the other form is renamed to the file's
row, cited by the file's title and the units both print, and never where the program's list carries the printed form.

The rescore renames a code only where the filed score names the file's code missing or placed (the S713 rescore's
shape, kb/_program_piles_s713.py rescore_common_numbers); the arithmetic and the record are never changed.

THE SELF-RECALL (p-self-recall-reads-rule-fields-s703): the held answer is the hand reading; the claim checks read the
record's notes (silent or matching for every renamed code, never against) and today's capture (sources.json: the
file's form among the codes the capture found, or the printed form looked for under it); boundary readings: the
program's list carries the printed form too (no rename), lists neither (no rename), the printed code one letter off
(no rename); the precision count runs over all 24.

    python3 kb/_program_piles_s714_fullerton.py --dry-run
    python3 kb/_program_piles_s714_fullerton.py --tag s714f

Guard: tests/program_piles_s714_fullerton_test.py.
"""
from __future__ import annotations

import argparse
import ast
import collections
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
import _program_requirements_reconcile as R  # noqa: E402
import _program_requirements_score as S  # noqa: E402

ROOT = os.path.dirname(HERE)
COLLEGE_DIR = NG.COLLEGE_DIR
CENSUS = NG.CENSUS
COLLEGE = "Fullerton College"
SLUG = "fullerton"
LEVER = "reconcile_steps"

REN = "passes: the file keeps the course with its campus letter elsewhere (course_renumbers)"
HAND_HELD = {cn: REN for cn in ("03816", "03839", "08438", "11690", "18747", "21252", "21266", "21271", "36790",
                                "45320", "45378")}
HAND_HELD.update({
    "18166": "held: the renumber places PE 248 F, and the arithmetic still fails (4-10 against 18): the record's "
             "Category C list is cut off after PE 144 F (MAY_CONTINUE_REVIEWED, kb/_program_named_gaps.py), a reread",
    "18749": "held: coverage: the state's file lists THEA 231 F, which the page does not print",
    "36863": "held: coverage: the state's file lists PE 108 F, which the page does not print",
    "03853": "held: 'Restricted Electives or Substitution Courses' fill the program from 18 to 22 with no figure of "
             "their own (students placed above 101 F); a substitute-list reading of the catalog's words",
    "03866": "held: the core's courses print no units (Option 1: 7, Option 2: 4) and List C's figure depends on the "
             "option (3 or 6); the record adds to 16-22 against 19",
    "08420": "held: the catalog's own figures differ (headings 25 + 2 = 27 against 'Total Units 31-32'); "
             "total_differs once a page read lists both figures",
    "08422": "held: the page read is the Level 2 certificate's (the record's note); Level 1 prints no total of its own",
    "18163": "held: the emphasis's 18-22 units are one list read as small blocks (4-10); a reread",
    "33680": "held: List B and List C also take 'any LIST A course not already used' and ESC pairs carry their units on "
             "the lecture; the record adds to 20-26 against 22-26",
    "35174": "held: the description prints 47-48 units in the major and the table 48; the catalog's figures differ "
             "(total_differs once a page read lists both)",
    "36798": "held: as 35174 (47-48 in the description, 48 in the table)",
    "42143": "held: the record adds to 17-19 against 18-19; a list's floor the reading left unset",
    "42394": "held: the record adds to 14-16 against 16; a list's floor the reading left unset",
})


def row_passes(checks: dict | None) -> bool:
    """A live row's verdict, as passes_live reads a score: coverage, invented and the arithmetic equal."""
    c = checks or {}
    return c.get("coverage") is True and c.get("invented") is True and c.get("arithmetic") == "equal"


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


def renumbers() -> dict:
    table = R.prefix_aliases(COLLEGE) or {}
    return {S.norm_code(k): S.norm_code(v) for k, v in table.items() if re.search(r"\d", k)}


def _renamer(table: dict):
    return lambda code: table.get(S.norm_code(code))


def rescore(filed: dict, table: dict | None = None) -> dict | None:
    rn = P.rescore_common_numbers(filed, name_of=_renamer(renumbers() if table is None else table),
                                  key="course_renumbers")
    if not rn:
        return None
    sc = rn["score"]
    return {"score": sc, "exact": rn["exact"], "renamed": rn["renamed"]}


def census_members(path: str = CENSUS) -> list[str]:
    with open(path, encoding="utf-8") as fh:
        d = json.load(fh)
    for lv in d.get("levers") or []:
        if lv.get("lever") == LEVER and lv.get("scope") == COLLEGE:
            return list(lv.get("members") or [])
    return []


def _path(cn: str) -> str:
    return os.path.join(COLLEGE_DIR, SLUG, "records", cn + ".json")


def _load(cn: str) -> dict | None:
    p = _path(cn)
    if not os.path.isfile(p):
        return None
    with open(p, encoding="utf-8") as fh:
        return json.load(fh)


def outcome(filed: dict) -> str:
    rs = rescore(filed)
    sc = rs["score"] if rs and rs["exact"] else filed.get("score")
    return "passes" if S.passes_live(sc) else "none"


def precision(census_path: str = CENSUS) -> dict:
    out = {"read": 0, "right": 0, "wrong": [], "no_record_file": 0, "not_hand_held": 0,
           "by_answer": collections.Counter()}
    for cn in census_members(census_path):
        f = _load(cn)
        if f is None:
            out["no_record_file"] += 1
            continue
        if cn not in HAND_HELD:
            out["not_hand_held"] += 1
            continue
        truth = "passes" if HAND_HELD[cn].startswith("passes") else "none"
        out["read"] += 1
        out["by_answer"][truth] += 1
        got = outcome(f)
        if got == truth:
            out["right"] += 1
        else:
            out["wrong"].append([cn, truth, got])
    out["by_answer"] = dict(out["by_answer"])
    return out


NOTE_AGAINST = re.compile(r"\b(?:not\s+the\s+same|another\s+course|different\s+course|differs?\s+from)\b", re.I)


def notes_claim(filed: dict, printed: str) -> str:
    """'against' where a note names the printed course and says it is another course; else 'stands' where a note
    names it with a match, or 'silent'."""
    m = re.match(r"([A-Z]+)\s*0*(\d+[A-Z]?)\s*F$", printed.replace(" ", ""))
    pat = re.compile(r"\b%s\s*0*%s\s*H?F\b" % (m.group(1), m.group(2)), re.I) if m else None
    said = [str(n) for n in (filed.get("record") or {}).get("notes") or [] if pat and pat.search(str(n))]
    if any(NOTE_AGAINST.search(n) for n in said):
        return "against"
    return "stands" if any(P.NOTE_MATCH.search(n) for n in said) else "silent"


PAGE_READ = os.path.join(COLLEGE_DIR, SLUG, "campus_letter_read_s714.json")


def capture_claim(filed: dict, listed: str, printed: str | None = None) -> str:
    """'stands' where today's capture (sources.json) found the file's code on the program's page, or where the S714
    free page read (PAGE_READ, the capture's own pages read for the printed form, which the capture does not look
    for) found the code as the record read it on that page; else 'not found'."""
    src = os.path.join(COLLEGE_DIR, SLUG, "sources.json")
    with open(src, encoding="utf-8") as fh:
        e = next((x for x in json.load(fh) if str(x.get("control_number")) == str(filed["control_number"])), None)
    if not e:
        return "no capture"
    found = e.get("codes_found") or []
    if isinstance(found, str):
        found = ast.literal_eval(found)
    if listed in {S.norm_code(x) for x in found}:
        return "stands"
    if printed and os.path.isfile(PAGE_READ):
        with open(PAGE_READ, encoding="utf-8") as fh:
            read = json.load(fh)
        if S.norm_code(printed) in {S.norm_code(x) for x in
                                    (read.get("found") or {}).get(str(filed["control_number"])) or []}:
            return "stands"
    return "not found"


def claim_checks(census_path: str = CENSUS) -> dict:
    out = {"notes": collections.Counter(), "capture": collections.Counter(), "not_standing": []}
    for cn in census_members(census_path):
        f = _load(cn)
        if f is None or not HAND_HELD.get(cn, "").startswith("passes"):
            continue
        for r in (rescore(f) or {}).get("renamed") or []:
            n, c = notes_claim(f, r["printed"]), capture_claim(f, r["listed"], r["printed"])
            out["notes"][n] += 1
            out["capture"][c] += 1
            if n == "against" or c != "stands":
                out["not_standing"].append([cn, r["printed"], n, c])
    return {k: (dict(v) if isinstance(v, collections.Counter) else v) for k, v in out.items()}


def boundaries(census_path: str = CENSUS) -> dict:
    out, wrong = collections.Counter(), []

    def tally(name, ok, cn):
        out["%s %s" % (name, "right" if ok else "wrong")] += 1
        if not ok:
            wrong.append([cn, name])

    table = renumbers()
    for cn in census_members(census_path):
        f = _load(cn)
        if f is None or not HAND_HELD.get(cn, "").startswith("passes"):
            continue
        sc = f["score"]
        printed = sorted({k for k in sc["invented"]["codes"] if k in table})
        listed = sorted({table[k] for k in printed})
        too = dict(f, score=dict(sc, coverage=dict(sc["coverage"], missing=list(sc["coverage"]["missing"]) + printed),
                                 invented=dict(sc["invented"], codes=[k for k in sc["invented"]["codes"]
                                                                      if k not in printed])))
        tally("list carries the printed form", not P.rescore_common_numbers(too, name_of=_renamer(table),
                                                                              key="course_renumbers"), cn)
        neither = dict(f, score=dict(sc, coverage=dict(sc["coverage"], missing=[
            k for k in sc["coverage"]["missing"] if k not in listed])))
        tally("list carries neither", not P.rescore_common_numbers(neither, name_of=_renamer(table),
                                                                     key="course_renumbers"), cn)
        off = {k[:-2] + "X" + k[-1]: v for k, v in table.items()}
        tally("printed code one letter off", not P.rescore_common_numbers(f, name_of=_renamer(off),
                                                                            key="course_renumbers"), cn)
    return {"counts": dict(out), "wrong": wrong}


def plan(write: bool, census_path: str = CENSUS) -> dict:
    rows, held = [], []
    images = NG._load_images({COLLEGE})
    for cn in census_members(census_path):
        f = _load(cn)
        if f is None:
            held.append({"control_number": cn, "why": "no record file"})
            continue
        if S.passes_live(f.get("score")):
            continue
        rs = rescore(f)
        if not rs or not rs["exact"] or not S.passes_live(rs["score"]):
            held.append({"control_number": cn, "why": HAND_HELD.get(cn, "not hand-held")})
            continue
        img = images.get((COLLEGE, cn))
        if img is None or row_passes(img["checks"]):
            held.append({"control_number": cn, "why": "the load leaves it out, or its image passes"})
            continue
        row = {"college": COLLEGE, "control_number": cn, "award": f.get("award"),
               "extracted_run": f.get("extracted_run"), "moves_to": "passes", "readings": ["course_renumbers"],
               "renamed": rs["renamed"], "path": os.path.relpath(_path(cn), ROOT)}
        if write:
            row["before_image"] = {k: img[k] for k in ("program_title", "award", "catalog_year", "source_url",
                                                       "measure", "total_min", "total_max", "record", "checks",
                                                       "extracted_run")}
            with open(_path(cn), "w", encoding="utf-8") as fh:
                json.dump(dict(f, score=rs["score"]), fh, ensure_ascii=False, indent=1)
                fh.write("\n")
        rows.append(row)
    # Every other record of the college the renumbers reach is rescored on disk too (no row).
    planned = {r["control_number"] for r in rows}
    rescored = []
    for p in sorted(glob.glob(os.path.join(COLLEGE_DIR, SLUG, "records", "*.json"))):
        with open(p, encoding="utf-8") as fh:
            f = json.load(fh)
        cn = str(f.get("control_number"))
        if cn in planned or not isinstance(f.get("score"), dict) or S.passes_live(f["score"]) and cn in HAND_HELD:
            continue
        rs = rescore(f)
        if not rs or not rs["exact"]:
            continue
        rescored.append({"control_number": cn, "renamed": rs["renamed"], "passes_after": S.passes_live(rs["score"]),
                         "why": HAND_HELD.get(cn, "outside the census lever")})
        if write:
            with open(p, "w", encoding="utf-8") as fh:
                json.dump(dict(f, score=rs["score"]), fh, ensure_ascii=False, indent=1)
                fh.write("\n")
    if write and rows:
        after = NG._load_images({COLLEGE})
        for r in rows:
            img = after[(COLLEGE, r["control_number"])]
            if img["record"] != r["before_image"]["record"] or not row_passes(img["checks"]):
                raise SystemExit("%s: the record changed, or its image does not pass" % r["control_number"])
            r["after_image"] = {"checks": img["checks"]}
    for i, r in enumerate(rows, 1):
        r["i"] = i
    return {"rows": rows, "held": held, "rescored_not_planned": rescored}


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--tag", default="s714f")
    a = ap.parse_args(argv)
    pr, cc, bd = precision(), claim_checks(), boundaries()
    rc = NG.recall(C.every_record())
    print("precision: %s" % json.dumps(pr))
    print("claim checks: %s" % json.dumps(cc))
    print("boundaries: %s" % json.dumps(bd))
    print("named-gaps recall: right %d, wrong %d" % (rc["right"], rc["wrong"]))
    if pr["wrong"] or pr["not_hand_held"] or cc["not_standing"] or bd["wrong"] or rc["wrong"]:
        raise SystemExit("the self-recall reads a wrong answer: no plan is written")
    res = plan(write=not a.dry_run)
    print("plan: %d rows; held %d; rescored not planned %d" % (len(res["rows"]), len(res["held"]),
                                                               len(res["rescored_not_planned"])))
    if a.dry_run or not res["rows"]:
        return 0
    rows = res["rows"]
    day = time.strftime("%Y-%m-%d", time.gmtime())
    path = os.path.join(NG.RECEIPTS, "program_requirement_records_piles_fullerton_%s_%s.json" % (day, a.tag))
    body = {"rule": NG.RULING + "; S714: the campus letter's place in Fullerton's file codes (course_renumbers)",
            "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "college": COLLEGE,
            "census": {"file": os.path.relpath(CENSUS, ROOT), "lever": LEVER, "members": census_members()},
            "moved": len(rows), "precision": pr, "claim_checks": cc, "boundaries": bd,
            "recall": {k: v for k, v in rc.items() if k != "wrong_keys"}, "held": res["held"], "records": rows,
            "rescored_not_planned": res["rescored_not_planned"],
            "representation": "checks.coverage and checks.invented as the scorer reads the college's renumbers; the "
                              "record unchanged",
            "claim_check_reads": ("The notes claim reads the record's notes for each renamed course; the capture claim "
                                  "reads today's capture (sources.json): the file's code among the codes it found."),
            "follow_verdict": P.FOLLOW_VERDICT,
            "pre_read": P.confirm_pre_read(rows), "pre_read_md5": md5_pre_read(rows),
            "apply": P.confirm_guarded_apply(rows, a.tag + " piles"),
            "rollback": NG.rollback_sql(rows, a.tag + " piles rollback")}
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(body, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    rel = os.path.relpath(path, ROOT)
    hdr = ("-- %s lane 2's cheap piles at Fullerton (course_renumbers %d). Each row's checks become the college load's\n"
           "-- image of its committed record (load_rows); the record itself is unchanged.\n"
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
