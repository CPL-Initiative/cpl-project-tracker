#!/usr/bin/env python3
"""File an extraction run's records from its job log, keeping what a person read.

The extraction pass (kb/_program_requirements_extract.py) writes nothing: it
prints one JSON object per program between markers in its job log. This files
them under kb/program_requirements_pilot/records/, by one rule:

  * A program with no reading on file (kb/program_requirements_pilot/
    reviewed_readings.json) is filed whole: the run's record and its score.
  * A program a person has read keeps the record they read: its blocks, its
    figures, its notes and the reasons it gives for each course it leaves out.
    It takes only the outcomes from the run (record shape 3: program.outcomes
    and course_outcomes), and only when the scorer finds every one of them
    word for word in the same catalog text. The record is then re-scored and
    must pass as it did.

Why the graft (S334). Extraction run 37345734457 re-read the 20 pilot programs
under record shape 3. Fourteen came back with the same requirements; six
differed in labels the model words differently from run to run (a section
heading, a block name's punctuation, an option group's name) and one filled in
alternatives' units. Each such difference would end Sam's verdict on the
record (the loader counts a verdict only while the requirements fingerprint
matches the reading), for no change he would see. Outcomes are checked by
machine against the page, so they need no person's reading, and the requirements
need no second one.

It writes the record files and nothing else; it calls no service.

    python3 kb/_program_requirements_file.py LOG RUN_ID [--dry-run]
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
from _program_requirements_score import requirements_md5, score  # noqa: E402

PILOT = os.path.join(ROOT, "kb", "program_requirements_pilot")
RECORDS = os.path.join(PILOT, "records")
READINGS = os.path.join(PILOT, "reviewed_readings.json")


def rows_from_log(text: str) -> list[dict]:
    """The JSON objects between the run's markers. A job log prefixes each line
    with a timestamp; the marker lines name themselves."""
    out, inside = [], False
    for line in text.splitlines():
        body = re.sub(r"^\S+Z ", "", line, count=1)
        if "PILOT RECORDS JSON BEGIN" in body:
            inside = True
            continue
        if "PILOT RECORDS JSON END" in body:
            break
        if inside and body.lstrip().startswith("{"):
            out.append(json.loads(body))
    return out


def key_of(row: dict, slugs: dict) -> str:
    return "%s_%s" % (slugs[row["college"]], row["control_number"])


def college_slugs() -> dict:
    """College name to the file-name slug the filed records already use."""
    out = {}
    for name in os.listdir(RECORDS):
        if name.endswith(".json"):
            rec = json.load(open(os.path.join(RECORDS, name)))
            out[rec["college"]] = name.rsplit("_", 1)[0]
    return out


def graft(filed: dict, row: dict, run: int) -> tuple[dict | None, str]:
    """The filed record with the run's outcomes, or None and the reason it
    cannot take them."""
    src = json.load(open(os.path.join(ROOT, filed["source_file"])))
    new = json.loads(json.dumps(filed))
    rec = new["record"]
    got = row.get("record") or {}
    rec["program"]["outcomes"] = list((got.get("program") or {}).get("outcomes") or [])
    rec["course_outcomes"] = [c for c in (got.get("course_outcomes") or []) if c.get("outcomes")]
    sc = score(rec, src["closed_list"], src["text"])
    if not sc["outcomes"]["pass"]:
        return None, "outcomes not verbatim: %s" % "; ".join(sc["outcomes"]["why"][:2])
    old = filed.get("score") or {}
    same = (sc["pass"] == old.get("pass")
            and sc["arithmetic"]["status"] == (old.get("arithmetic") or {}).get("status")
            and sc["coverage"]["missing"] == (old.get("coverage") or {}).get("missing")
            and sc["invented"]["codes"] == (old.get("invented") or {}).get("codes"))
    if not same:
        return None, "the re-score of the read record no longer matches its filed score"
    if requirements_md5(rec) != requirements_md5(filed["record"]):
        return None, "grafting the outcomes changed the requirements fingerprint"
    new["score"] = sc
    new["record_shape"] = 3
    new["outcomes_run"] = run
    # A later run's outcomes replace an earlier run's note rather than stack on it.
    new["_what"] = (re.sub(r"\s*Record shape 3 \(S334\):.*$", "", filed["_what"].rstrip(), flags=re.S)
                    + " Record shape 3 (S334): the program and course outcomes, as printed, come from "
                      "extraction run %d and were checked word for word against the same catalog text; "
                      "the requirements, notes and reasons are the ones read, unchanged "
                      "(kb/_program_requirements_file.py)." % run)
    return new, "grafted %d program outcome%s" % (len(rec["program"]["outcomes"]),
                                                 "" if len(rec["program"]["outcomes"]) == 1 else "s")


def whole(row: dict, run: int) -> dict:
    out = {"_what": ("A pilot program's requirements record, drafted by the program-requirements-extract "
                     "Edge Function (record shape %s) from the fixture named in source_file and scored by "
                     "kb/_program_requirements_score.py. Filed from the job log of extraction run %d "
                     "(kb/_program_requirements_file.py). No person has read it yet."
                     % (row.get("record_shape") or 3, run)),
           "extracted_run": run}
    for k in ("college", "control_number", "shape", "title", "source_file", "record_shape", "model",
              "stop_reason", "usage", "cost_usd", "ms", "seconds", "error", "score", "record"):
        out[k] = row.get(k)
    return out


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("log")
    ap.add_argument("run", type=int)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args(argv)
    rows = rows_from_log(open(args.log).read())
    if not rows:
        print("no records between the markers in %s" % args.log)
        return 2
    readings = json.load(open(READINGS))["readings"]
    slugs = college_slugs()
    refused = 0
    for row in rows:
        key = key_of(row, slugs)
        path = os.path.join(RECORDS, key + ".json")
        if row.get("error") or not isinstance(row.get("record"), dict):
            print("%-16s skipped: the run returned no record (%s)" % (key, row.get("error")))
            refused += 1
            continue
        if key in readings and os.path.exists(path):
            new, why = graft(json.load(open(path)), row, args.run)
            if new is None:
                print("%-16s kept as filed: %s" % (key, why))
                refused += 1
                continue
        else:
            new, why = whole(row, args.run), "filed whole (no reading on file)"
        print("%-16s %s" % (key, why))
        if not args.dry_run:
            with open(path, "w") as fh:
                fh.write(json.dumps(new, indent=1, ensure_ascii=False) + "\n")
    print("%d of %d filed%s" % (len(rows) - refused, len(rows), " (dry run)" if args.dry_run else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())
