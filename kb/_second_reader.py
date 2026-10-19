#!/usr/bin/env python3
"""The second reader: a second model reads each harvest record that fails a machine check.

Sam, Open Asks Sheet 97 card 1 (2026-10-19 03:11Z, his own call): *Build with Grok.* His
words that opened it (~02:33Z, to S420): *"perhaps begin using Grokbot if it could multiple
and diversify our work."*

WHAT THIS IS. The Program Requirements harvest reads each program's catalog text once, with
Claude through the program-requirements-extract Edge Function, and scores the record with
machine checks (kb/_program_requirements_score.py). A record that fails a check names a
symptom and no cause. This hands the SAME text, closed list and prompt to a second model
(xAI's Grok, the function's provider "xai"; version 11) and scores that reading with the same
scorer. Two readings of one page are evidence: where they agree, the page probably says what
both read, and the failure is the page's or the check's; where they disagree, the record is
a known issue that carries both readings for a person to settle. It SUGGESTS. It never
edits a record, replaces a row, or writes a table: the comparison is a file in
kb/second_reader_out/, uploaded by the runner as an artifact, and a person reads it.

WHO READS WHAT. The runner captures the college first (free; out/sources/<cn>.json carries
the page text and the closed list the first reader saw), then reads only the records the
committed folder marks as failing (kb/program_requirements_college/<slug>/records/*.json),
and only when the capture found the same page the first reading came from: a moved page
says nothing about the filed record (the S403 guard). Public catalog text only, and the
state's course list; no student data reaches a model.

THE KEY IS THE FUNCTION'S. The xAI key is an Edge Function secret (XAI_API_KEY, with
XAI_MODEL), never a GitHub secret: Sam's call 6 on sheet 23 (model keys live in the
function). This runner presents the service key the extract step always has, and reads
"XAI_API_KEY not set" back from the function when the secret is still Sam's step.

RUN IT ON A RUNNER (second-reader.yml, input college=<college>):

    python3 kb/_second_reader.py --college "Cañada College" --capture out
    python3 kb/_second_reader.py --college "Taft College" --dry-run       # the plan, no call

Stdlib only beside the harvest's own modules.
"""
import argparse
import datetime as dt
import glob
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

COLLEGE_DIR = os.path.join(HERE, "program_requirements_college")
OUT = os.path.join(HERE, "second_reader_out")
PROVIDER = "xai"
POSTURE = "suggests"   # two readings, a scorer's verdict on each, and nothing written


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


def source_for(capture_dir, record):
    """The capture's source for this record, or None: no capture, no file, no text, or a page
    other than the one the record was extracted from (a moved page says nothing about it)."""
    if not capture_dir:
        return None
    path = os.path.join(capture_dir, "sources", "%s.json" % record.get("control_number"))
    if not os.path.isfile(path):
        return None
    try:
        src = json.load(open(path, encoding="utf-8")) or {}
    except (OSError, ValueError):
        return None
    if not src.get("text") or not src.get("closed_list"):
        return None
    url = (src.get("source") or {}).get("url")
    if record.get("source_url") and url and url != record.get("source_url"):
        return None
    return src


def figures(record):
    program = (record or {}).get("program") or {}
    return {k: program.get(k) for k in ("measure", "total_units", "degree_total", "ge_units",
                                        "open_elective_units", "degree_elective_units", "electives_fill_degree")}


def compare(first, second_record, second_score):
    """What a person reads first: do the two readings agree on the requirements, and does
    the second one pass the checks the first failed?"""
    from _program_requirements_score import requirements_md5
    first_rec = first.get("record") or {}
    first_fail = failing(first)
    second_fail = [k for k, v in (second_score or {}).items() if isinstance(v, dict) and v.get("pass") is False]
    same = bool(second_record) and requirements_md5(first_rec) == requirements_md5(second_record)
    if not second_record:
        verdict = "no_second_reading"
    elif same:
        verdict = "agree"                        # the same requirements: the failure is the page's or the check's
    elif not second_fail:
        verdict = "second_passes"                # a different reading that passes every check
    elif set(second_fail) == set(first_fail):
        verdict = "both_fail_same_checks"        # different readings, the same symptom
    else:
        verdict = "disagree"                     # different readings, different symptoms
    return {"verdict": verdict, "same_requirements": same, "first_failing": first_fail, "second_failing": second_fail,
            "first_figures": figures(first_rec), "second_figures": figures(second_record)}


def row_for(record, src, got, second_score):
    from _program_requirements_extract import cost
    second = got.get("record") if isinstance(got.get("record"), dict) else None
    return {"college": record.get("college"), "control_number": record.get("control_number"),
            "title": record.get("title"), "award": record.get("award"), "source_url": record.get("source_url"),
            "first": {"extracted_run": record.get("extracted_run"), "model": record.get("model"),
                      "pass": bool((record.get("score") or {}).get("pass"))},
            "second": {"provider": got.get("provider") or PROVIDER, "model": got.get("model"),
                       "stop_reason": got.get("stop_reason"), "usage": got.get("usage"),
                       "cost_usd": cost(got.get("model"), got.get("usage")), "ms": got.get("ms"),
                       "error": got.get("error"), "pass": bool(second_score and second_score.get("pass")),
                       "score": second_score, "record": second},
            "comparison": compare(record, second, second_score),
            "posture": POSTURE, "page_chars": len(src.get("text") or "") if src else 0}


def run(college, capture_dir=None, limit=None, dry_run=False, key=None, model=None, workers=4):
    import _program_requirements_extract as X
    slug = slug_of(college)
    every = failing_records(slug)
    records = every[:limit] if limit else every
    pairs = [(r, source_for(capture_dir, r)) for r in records]
    readable = [(r, s) for r, s in pairs if s]
    print("%s (%s): %d record(s) failing a machine check, %d chosen, %d with the page the first reading came from%s"
          % (college, slug, len(every), len(records), len(readable), "" if capture_dir else " (no capture dir given)"))
    if dry_run:
        for r, s in pairs:
            print("  %-6s %-40s %s" % (r.get("control_number"), (r.get("title") or "")[:40],
                                      "page in hand" if s else "no page: skipped"))
        print("dry run: no call, nothing written")
        return 0
    if not key:
        print("SUPABASE_SERVICE_KEY is not set; the Edge Function takes only the service key.", file=sys.stderr)
        return 2

    def one(pair):
        rec, src = pair
        got = X.call(src, key, provider=PROVIDER, model=model)
        second = got.get("record") if isinstance(got.get("record"), dict) else None
        sc = None
        if second:
            try:
                sc = X.score(second, src["closed_list"], src["text"], rec.get("award") or src.get("award"))
            except Exception as exc:   # a reading the scorer cannot read is still filed, with its reason
                got = dict(got, error="score: " + str(exc).splitlines()[0][:200])
        row = row_for(rec, src, got, sc)
        c = row["comparison"]
        print("%-6s first %-8s second %-8s %-22s %s" % (
            rec.get("control_number"), "fail", "PASS" if row["second"]["pass"] else "fail",
            c["verdict"], ("error: " + row["second"]["error"]) if row["second"].get("error") else ""), flush=True)
        return row

    from concurrent.futures import ThreadPoolExecutor
    with ThreadPoolExecutor(max_workers=max(1, workers)) as pool:
        rows = list(pool.map(one, readable))
    counts = {}
    for r in rows:
        v = r["comparison"]["verdict"]
        counts[v] = counts.get(v, 0) + 1
    errors = sum(1 for r in rows if r["second"].get("error"))
    skipped = [r.get("control_number") for r, s in pairs if not s]
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, "second_%s.json" % slug)
    json.dump({"_doc": "The second reader over %s's records failing a machine check: the same text, closed "
                       "list and prompt read by provider %s, both readings scored by the one scorer. Agreement "
                       "is evidence; disagreement is a known issue carrying both readings. SUGGESTS: nothing "
                       "is replaced or written until a person reads it." % (college, PROVIDER),
               "college": college, "slug": slug, "provider": PROVIDER,
               "at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
               "run": os.environ.get("GITHUB_RUN_ID"), "posture": POSTURE,
               "failing": len(every), "read": len(rows), "skipped_no_page": skipped, "errors": errors,
               "cost_usd": round(sum(r["second"].get("cost_usd") or 0 for r in rows), 4),
               "verdicts": counts, "rows": rows},
              open(path, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    print("wrote %s: %d read, %d skipped (no page), %d error(s); verdicts %s"
          % (os.path.relpath(path, os.path.dirname(HERE)), len(rows), len(skipped), errors, json.dumps(counts)))
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--college", required=True, help="the college, as program_source_registry names it")
    ap.add_argument("--capture", help="the runner's capture dir (out/), whose sources/<cn>.json carry the page text")
    ap.add_argument("--limit", type=int, help="the first N failing records only")
    ap.add_argument("--model", help="the second reader's model id, in place of the function's XAI_MODEL")
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--dry-run", action="store_true", help="print the plan; call nothing")
    a = ap.parse_args()
    return run(a.college, a.capture, a.limit, a.dry_run, (os.environ.get("SUPABASE_SERVICE_KEY") or "").strip(),
               a.model, a.workers)


if __name__ == "__main__":
    sys.exit(main())
