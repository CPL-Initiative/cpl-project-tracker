#!/usr/bin/env python3
"""The Los Rios records whose electives fill the scorer now refuses take their named gap (S720, section_cut_off).

The free reconciles on claude/s720-rios (Sacramento City 45353709365, Cosumnes River 45355422235, Folsom Lake
45356831201) rescored each college's filed records under the fixed scorer (#3756). The records the reconcile was for
were kept and the rest put back to the base filing: nine carry the arithmetic's fill_refused, the reader's own words
that the requirements run outside the text read (kb/_program_requirements_score.py, window_cut). Each is collected
with the gap named (sam-collect-with-gaps-2026-11-17): score.gaps ["section_cut_off"] and score.confidence, read by
the named-gaps rule (kb/_program_named_gaps.py, section_cut_off through refused_fill_words) and checked against the
held answer, which reads the score's own field.

The live rows still hold main's filing (the read the reconcile rescored), so the plan is full-row in the lane's
shape (kb/_program_ge_plan_s713.py): record, checks and run move from the load's image of main's record to the
load's image of the committed one. The record body is unchanged; the run becomes the reconcile's; the checks keep
arithmetic "unequal" and take the gap, the confidence and the rescore's placed and listed counts. The UPDATE runs only
where the row still holds the before-image whole, never on a checked row, aborts unless it matches the plan's count
less the checked rows, and aborts if a confirm verdict would carry onto the row. The compact pre-read compares md5
hashes of the jsonb text, hashed on a local Postgres 16 (p-compact-preread-by-md5-s713).

    python3 kb/_program_cut_window_gaps_s720.py --dry-run    # the rows and the self-check; writes nothing
    python3 kb/_program_cut_window_gaps_s720.py              # the record files, the receipt and the four SQL files
"""
from __future__ import annotations

import argparse
import collections
import glob
import importlib.util
import json
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_ge_plan_s713 as GP  # noqa: E402
import _program_named_gaps as NG  # noqa: E402

ROOT = os.path.dirname(HERE)
TAG = "s720r"
BASE = "35854487d647b567b52c45da9d31b37ec32978e0"   # main after #3756: the filing the live rows hold
COLLEGES = {"sacramento_city": "Sacramento City College", "cosumnes_river": "Cosumnes River College",
            "folsom_lake": "Folsom Lake College"}
RUNS = {"Sacramento City College": "45353709365", "Cosumnes River College": "45355422235",
        "Folsom Lake College": "45356831201"}
RECEIPT = os.path.join(HERE, "receipts", "program_requirement_records_cut_window_gaps_s720r.json")
MIGRATIONS = os.path.join(HERE, "migrations", "2026-11-24_s720r_prreq_cut_window_gaps_")


def refused(f: dict) -> bool:
    a = (f.get("score") or {}).get("arithmetic") or {}
    r = a.get("fill_refused") or (a.get("degree") or {}).get("fill_refused") or {}
    return r.get("gap") == "section_cut_off"


def targets() -> list[tuple[str, dict]]:
    out = []
    for slug in COLLEGES:
        for path in sorted(glob.glob(os.path.join(HERE, "program_requirements_college", slug, "records", "*.json"))):
            with open(path, encoding="utf-8") as fh:
                f = json.load(fh)
            if refused(f):
                out.append((path, f))
    return out


def name_gaps(write: bool) -> list[dict]:
    named = []
    for path, f in targets():
        key = "%s %s" % (f["college"], f["control_number"])
        ans, held = NG.answer(f), NG.held_answer(f)
        if not ans or ans[0] != "section_cut_off" or held != "section_cut_off":
            raise SystemExit("%s: the rule gives %s and the held answer %s, not section_cut_off" % (key, ans, held))
        if str(f.get("extracted_run")) != RUNS[f["college"]]:
            raise SystemExit("%s: filed on run %s, not the reconcile's %s" % (key, f.get("extracted_run"),
                                                                              RUNS[f["college"]]))
        src, year = NG._sources(path)
        e = src.get(str(f["control_number"])) or {}
        conf = NG.confidence(f, ans[0], e.get("method"), (e.get("catalog_year") or year) == year)
        gaps = [{"gap": ans[0], "label": NG.GAPS[ans[0]], "words": ans[1]}]
        already = (f["score"].get("gaps") == gaps and f["score"].get("confidence") == conf)
        named.append({"college": f["college"], "control_number": f["control_number"], "words": ans[1],
                      "confidence": conf, "already_filed": already, "path": os.path.relpath(path, ROOT)})
        if write and not already:
            f["score"]["gaps"], f["score"]["confidence"] = gaps, conf
            with open(path, "w", encoding="utf-8") as fh:
                json.dump(f, fh, ensure_ascii=False, indent=1)
                fh.write("\n")
    return named


def plan(named: list[dict]) -> list[dict]:
    rows = []
    for college in sorted({n["college"] for n in named}):
        before, after = GP.images_at(BASE, college), GP.images_now(college)
        for n in [x for x in named if x["college"] == college]:
            cn = str(n["control_number"])
            b, a = before[cn], after[cn]
            if b["record"] != a["record"]:
                raise SystemExit("%s %s: the record body moved; this plan moves checks and run alone" % (college, cn))
            if (a["checks"].get("gaps") or []) != ["section_cut_off"] or a["checks"].get("arithmetic") != "unequal":
                raise SystemExit("%s %s: the after-image does not carry the gap" % (college, cn))
            rows.append({"college": college, "control_number": cn, "award": a.get("award"), "words": n["words"],
                         "passes_before": GP._passes(b), "passes_after": GP._passes(a),
                         "before_image": {k: b[k] for k in GP.KEYS}, "after_image": {k: a[k] for k in GP.KEYS}})
    for i, r in enumerate(rows, 1):
        r["i"] = i
    return rows


def md5s(rows: list[dict]) -> dict:
    """The md5 of each image's jsonb text as Postgres 16 prints it, from a throwaway local cluster."""
    spec = importlib.util.spec_from_file_location("libproof", os.path.join(ROOT, "tests", "library_publishing_sql_proof.py"))
    lib = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(lib)
    vals = [json.dumps(img[k], ensure_ascii=False, sort_keys=True, separators=(",", ":"))
            for r in rows for img in (r["before_image"], r["after_image"]) for k in ("record", "checks")]
    sql = ("select h from (select row_number() over () as ord, md5(v::jsonb::text) as h from (values %s) t(v)) x "
           "order by ord;" % ", ".join("(%s)" % GP._q(v) for v in vals))
    c = lib.Cluster()
    if not c.start():
        raise SystemExit("no local Postgres for the md5 pre-read")
    try:
        ok, out, err = c.psql(sql)
    finally:
        c.stop()
    if not ok:
        raise SystemExit("local psql: " + err[-400:])
    hs = out.split()
    assert len(hs) == 4 * len(rows), (len(hs), len(rows))
    return {r["i"]: tuple(hs[4 * j:4 * j + 4]) for j, r in enumerate(rows)}


def pre_read_md5_sql(rows: list[dict], hashes: dict) -> str:
    v = ",\n  ".join("(%d, %s, %s, %d, %s, %s, %s, %s)" % (
        r["i"], GP._q(r["college"]), GP._q(r["control_number"]), int(r["before_image"]["extracted_run"]),
        GP._q(hashes[r["i"]][0]), GP._q(hashes[r["i"]][1]), GP._q(hashes[r["i"]][2]), GP._q(hashes[r["i"]][3]))
        for r in rows)
    return ("with v(i, college, control_number, before_run, rec_md5, chk_md5, after_rec_md5, after_chk_md5) as "
            "(values\n  %s)\n"
            "select json_build_object(\n"
            "  'listed', (select count(*) from v),\n"
            "  'on_run', count(*) filter (where r.extracted_run = v.before_run),\n"
            "  'both_before', count(*) filter (where r.extracted_run = v.before_run and md5(r.record::text) = "
            "v.rec_md5 and md5(r.checks::text) = v.chk_md5),\n"
            "  'already_after', count(*) filter (where md5(r.record::text) = v.after_rec_md5 and md5(r.checks::text) "
            "= v.after_chk_md5),\n"
            "  'checked_now', count(*) filter (where r.checked),\n"
            "  'latest_confirm', count(*) filter (where lv.verdict = 'confirm'),\n"
            "  'confirm_on_before', count(*) filter (where lv.verdict = 'confirm' and lv.requirements_fp = "
            "public.program_record_fp(r.record)))\n"
            "  from v join public.program_requirement_records r\n"
            "    on r.college = v.college and r.control_number = v.control_number\n"
            "  left %s;" % (v, GP.LATEST))


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args(argv)
    named = name_gaps(write=not a.dry_run)
    print("records whose fill is refused: %d (%s); rule and held answer agree on all"
          % (len(named), json.dumps(dict(collections.Counter(n["college"] for n in named)))))
    for n in named:
        print("  %s %s: %s" % (n["college"], n["control_number"], n["words"][:110]))
    if a.dry_run:
        return 0
    rows = plan(named)
    hashes = md5s(rows)
    body = {"rule": ("S720: the records whose electives fill the fixed scorer refuses over a cut-off window are "
                     "collected with section_cut_off (sam-collect-with-gaps-2026-11-17; "
                     "f-elective-fill-passes-cut-off-windows-s714)"),
            "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "base": BASE, "runs": RUNS,
            "rows": len(rows), "named": named,
            "records": rows,
            "follow_verdict": ("The record body does not change, so a confirm given on it would carry onto the row: "
                               "the apply aborts, writing nothing, if any row's latest verdict is such a confirm."),
            "pre_read_md5": pre_read_md5_sql(rows, hashes), "pre_read": GP.pre_read_sql(rows),
            "apply": GP.apply_sql(rows, TAG + " cut window gaps"), "rollback": GP.rollback_sql(rows, TAG + " cut window gaps")}
    with open(RECEIPT, "w", encoding="utf-8") as fh:
        json.dump(body, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    rel = os.path.relpath(RECEIPT, ROOT)
    hdr = ("-- S720r: %d Los Rios rows take section_cut_off: record (unchanged body), checks and run to the committed\n"
           "-- filing of the free reconciles. Receipt: %s.\n" % (len(rows), rel))
    parts = {"preread_md5.sql": ("-- Compact pre-read, read-only: one SELECT, one JSON value. A clean read: on_run = "
                                 "both_before = listed, already_after 0,\n-- checked_now 0, latest_confirm 0.\n"
                                 + body["pre_read_md5"]),
             "preread.sql": "-- Pre-read, read-only: one SELECT, one JSON value.\n" + body["pre_read"],
             "apply.sql": ("-- Guarded UPDATE; aborts unless %d rows less those a person checked, and unless no "
                           "confirm carries onto a row.\n" % len(rows) + body["apply"]),
             "rollback.sql": ("-- Rollback, NOT applied: the before-image back where the row holds the after-image. "
                              "Revert the record files too.\n" + body["rollback"])}
    for name, text in parts.items():
        with open(MIGRATIONS + name, "w", encoding="utf-8") as fh:
            fh.write(hdr + text + "\n")
    print("receipt %s (%d rows)" % (rel, len(rows)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
