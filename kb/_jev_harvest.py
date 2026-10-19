#!/usr/bin/env python3
"""Jev over the harvest's failing records: a typed cause for every machine-check failure.

Sam, 2026-10-19 (~02:33Z, to S420): *"If you can think of any other automation layers or
tools we can incorporate, please incorporate--perhaps ensuring we use Jev is helpful..."*

WHAT THIS IS. The Program Requirements harvest scores every record with machine checks
(kb/_program_requirements_score.py: coverage, invented, arithmetic, repeated, outcomes). A
failure names a symptom ("the blocks sum to 12.0-12.0; the catalog states 19.0-19.0") and no
cause. A session finds the cause by reading the page, one college at a time: Delta's degree
floor and Taft's Cal-GETC 34 (S415), Cañada's cut headings (S419). This asks Jev the cause for
every failing record at a college in one sitting, from the record, the scorer's verdict and the
page text the reader handed the model, and ranks the answers for a person. The hit is cheap to
verify: a session reads the page, and the scorer re-runs once the procedure changes.

POSTURE (kb/_jev_adjudicate.py, ladder item 3: every reference calibrates its own gate and
none inherits 0.85). The harvest has NO GATE yet, so every answer here is `uncalibrated`, and
nothing is proposed off it. The first sittings ARE the calibration: a person's verdict per
record goes beside Jev's answer, and a gate is recorded only when the sweep shows precision
1.00 at some threshold. This SUGGESTS. It never edits a record, a procedure or a table.

RUN IT ON A RUNNER (typesafe.ai is egress-blocked from the agent sandbox): typesafe-smoke.yml,
input `harvest=<college>`. The runner captures the college first (free, no model call), so each
record's page text is in out/sources/<cn>.json; without a capture the state carries the record
alone and says so, which Jev is told.

    python3 kb/_jev_harvest.py --college "Cañada College" --capture out
    python3 kb/_jev_harvest.py --college "Taft College" --dry-run        # the plan, no call
"""
import argparse
import datetime as dt
import glob
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from _typesafe_smoke import choice, noul, system_one  # noqa: E402

COLLEGE_DIR = os.path.join(HERE, "program_requirements_college")
OUT = os.path.join(HERE, "jev_out")
TEXT_CHARS = 6000          # the page text Jev sees, from the top of the excerpt the model read
POSTURE = "uncalibrated"   # no gate is measured for the harvest; nothing is proposed

CAUSES = {
    "excerpt_cut": "The text the reader handed the model begins or ends inside the program's section, "
                   "so a heading, a block or part of a list is missing from the record.",
    "stated_total_counts_more": "The catalog's stated total counts units the blocks do not list: general "
                                "education, electives, or courses an embedded certificate carries.",
    "choose_block_misread": "A block's rule or minimum was read wrong: choose N courses against N units, "
                            "a unit range, or an option group counted twice.",
    "catalog_figures_disagree": "The page's own figures do not add up; the record reads the page as printed.",
    "wrong_program_text": "The text belongs to another program, award or a course description section.",
    "record_right_check_misfires": "The record matches the page; the check applies a rule the page does not follow.",
    "cannot_tell": "The evidence here does not settle it.",
}
OWNERS = {
    "reader_procedure": "The college's reading procedure: which page or pages the reader hands the model.",
    "extraction": "The model's reading of the text it was given.",
    "scorer": "The machine check's rule.",
    "college_catalog": "The catalog itself: the college's figures or wording.",
    "state_list": "The state's course list (COCI) against what the catalog prints.",
    "none": "Nothing needs fixing.",
}


def slug_of(college):
    from _program_requirements_college import slug_of as s  # the one slug, imported never copied
    return s(college)


def failing(record):
    """The checks this record fails, by name; [] when it passes them all."""
    score = record.get("score") or {}
    return [k for k, v in score.items() if isinstance(v, dict) and v.get("pass") is False]


def failing_records(slug):
    out = []
    for path in sorted(glob.glob(os.path.join(COLLEGE_DIR, slug, "records", "*.json"))):
        try:
            rec = json.load(open(path, encoding="utf-8"))
        except (OSError, ValueError):
            continue
        if failing(rec):
            out.append(rec)
    return out


def page_text(capture_dir, control_number):
    """The text the model read, from the runner's capture (out/sources/<cn>.json), or None."""
    if not capture_dir:
        return None
    path = os.path.join(capture_dir, "sources", "%s.json" % control_number)
    if not os.path.isfile(path):
        return None
    try:
        return (json.load(open(path, encoding="utf-8")) or {}).get("text") or None
    except (OSError, ValueError):
        return None


def state_for(record, text=None):
    """What Jev sees: the record's figures and blocks, the checks' verdicts, the page text."""
    body = record.get("record") or {}
    program = body.get("program") or {}
    score = record.get("score") or {}
    blocks = []
    for b in body.get("blocks") or []:
        blocks.append({"name": b.get("name"), "rule": b.get("rule"), "minimum": b.get("minimum"),
                       "stated": b.get("stated"),
                       "courses": [{"code": c.get("code"), "units": c.get("units"), "units_max": c.get("units_max")}
                                   for c in (b.get("courses") or [])]})
    cut = None
    if text:
        cut = text[:TEXT_CHARS]
    return {
        "program": {"college": record.get("college"), "control_number": record.get("control_number"),
                    "title": record.get("title"), "award": record.get("award"), "source_url": record.get("source_url")},
        "record": {"figures": {k: program.get(k) for k in ("measure", "total_units", "degree_total", "ge_units",
                                                           "ge_pattern", "open_elective_units",
                                                           "degree_elective_units", "electives_fill_degree")},
                   "blocks": blocks,
                   "missing_explained": body.get("missing_explained") or [],
                   "notes": body.get("notes") or []},
        "checks": {k: score.get(k) for k in ("arithmetic", "coverage", "invented", "repeated") if k in score},
        "failing": failing(record),
        "page_text": cut,
        "page_text_note": ("the first %d characters of the text the reader handed the model" % TEXT_CHARS
                           if cut and len(text) > TEXT_CHARS else
                           "the whole text the reader handed the model" if cut else
                           "no page text is available in this sitting; judge from the record and the checks alone, "
                           "and answer cannot_tell where the text would be needed"),
    }


def questions():
    """One set per record; Jev answers them in one call and none sees another's answer."""
    return {
        "cause": choice(
            "The record at `record` was read from a college catalog's text (`page_text`) for the program at "
            "`program`, and failed the machine checks at `checks` (the failing ones are listed at `failing`). "
            "Which single cause best explains the failure?", CAUSES),
        "owner": choice(
            "Given `record`, `checks` and `page_text`, who would have to change something for this record to pass: the reading "
            "procedure that picks the text, the model's extraction, the scorer's rule, the college's catalog, "
            "the state's course list, or nothing?", OWNERS),
        "ge_in_total": noul(
            "Does `page_text` print a program or degree total that includes general education units the blocks "
            "at `record.blocks` do not list? Answer no when no text is available.",
            {"true": "The printed total includes general education.", "false": "It does not, or no text shows it."}),
        "electives_fill": noul(
            "Does `page_text` state that electives make up the balance of the total (words such as 'electives to "
            "reach 60 units', 'remaining units', 'additional courses to total')? Answer no when no text is available.",
            {"true": "The page says electives fill the total.", "false": "It does not, or no text shows it."}),
        "missing_printed": noul(
            "The coverage check at `checks.coverage.missing` lists course codes the record did not place. Are any of "
            "those codes printed in `page_text`? Answer no when the list is empty or no text is available.",
            {"true": "At least one missing code is printed in the text.", "false": "None is, or there is nothing to check."}),
    }


def answer_row(record, answers):
    a = answers or {}
    cause = a.get("cause") or {}
    owner = a.get("owner") or {}
    score = record.get("score") or {}
    return {
        "control_number": record.get("control_number"), "title": record.get("title"), "award": record.get("award"),
        "failing": failing(record),
        "arithmetic": (score.get("arithmetic") or {}).get("status"),
        "coverage_share": (score.get("coverage") or {}).get("share"),
        "cause": cause.get("choice"), "cause_confidence": cause.get("confidence"),
        "owner": owner.get("choice"), "owner_confidence": owner.get("confidence"),
        "ge_in_total": (a.get("ge_in_total") or {}).get("noul"),
        "electives_fill": (a.get("electives_fill") or {}).get("noul"),
        "missing_printed": (a.get("missing_printed") or {}).get("noul"),
        "posture": POSTURE,
    }


def run(college, capture_dir=None, limit=None, dry_run=False, key=None):
    slug = slug_of(college)
    every = failing_records(slug)
    records = every[:limit] if limit else every
    with_text = sum(1 for r in records if page_text(capture_dir, r.get("control_number")))
    print("%s (%s): %d record(s) failing a machine check, asking about %d; page text for %d of them%s"
          % (college, slug, len(every), len(records), with_text, "" if capture_dir else " (no capture dir given)"))
    if dry_run:
        if records:
            st = state_for(records[0], page_text(capture_dir, records[0].get("control_number")))
            print("first state:", json.dumps(st)[:1200])
        print("questions:", ", ".join(questions()))
        print("dry run: no call, nothing written")
        return 0
    if not key:
        print("TYPESAFE_API_KEY is not set; nothing asked", file=sys.stderr)
        return 1
    rows, errors = [], 0
    for rec in records:
        st = state_for(rec, page_text(capture_dir, rec.get("control_number")))
        try:
            answers = (system_one(st, questions(), key) or {}).get("answers") or {}
            row = answer_row(rec, answers)
        except Exception as exc:  # one record's failure never ends the sitting
            errors += 1
            row = answer_row(rec, {})
            row["error"] = str(exc).splitlines()[0][:200]
        rows.append(row)
        print("%-6s %-10s cov %-5s  %-28s %-18s %s" % (
            row["control_number"], row["arithmetic"] or "-", row["coverage_share"] if row["coverage_share"] is not None else "-",
            row["cause"] or "-", row["owner"] or "-", ("error: " + row["error"]) if row.get("error") else ""))
    counts = {}
    for r in rows:
        counts[r["cause"] or "error"] = counts.get(r["cause"] or "error", 0) + 1
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, "harvest_%s.json" % slug)
    json.dump({"_doc": "Jev's typed cause for each of %s's records failing a machine check. %s: no gate is "
                       "measured for the harvest, so nothing is proposed; a person's verdict beside each row is "
                       "what calibrates one. SUGGESTS, never edits." % (college, POSTURE.upper()),
               "college": college, "slug": slug, "at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
               "run": os.environ.get("GITHUB_RUN_ID"), "posture": POSTURE, "asked": len(rows), "errors": errors,
               "with_page_text": with_text, "causes": counts, "answers": rows},
              open(path, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    print("wrote %s: %d asked, %d error(s); causes %s" % (os.path.relpath(path, os.path.dirname(HERE)), len(rows), errors,
                                                        json.dumps(counts)))
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--college", required=True, help="the college, as program_source_registry names it")
    ap.add_argument("--capture", help="the runner's capture dir (out/), whose sources/<cn>.json carry the page text")
    ap.add_argument("--limit", type=int, help="the first N failing records only")
    ap.add_argument("--dry-run", action="store_true", help="print the plan and the first state; call nothing")
    a = ap.parse_args()
    return run(a.college, a.capture, a.limit, a.dry_run, (os.environ.get("TYPESAFE_API_KEY") or "").strip())


if __name__ == "__main__":
    sys.exit(main())
