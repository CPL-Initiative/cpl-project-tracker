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


def per_record_rate(model=None, rate=None):
    """(the rate per record the price and the hard stop use, where it came from), or (None, why) for a refusal
    (COBIx on #3330, S654). The default rate is calibrated on the Anthropic reader at Opus's rates; with no
    --model it stands, as an upper estimate for the function's configured xAI model. A --model the price table
    does not name is refused unless the dispatch gives a rate per record; a rate given is used as given, and one
    below the default rate is refused, since it would price nothing the hard stop could hold to."""
    import _program_requirements_extract as X
    import _program_requirements_wave as W
    if str(rate or "").strip():
        try:
            r = float(str(rate).strip())
        except ValueError:
            return None, "the rate per record %r is no number" % rate
        if not r >= W.DEFAULT_COST_PER_PROGRAM:
            return None, "the rate per record %r is below the default rate $%.2f" % (rate, W.DEFAULT_COST_PER_PROGRAM)
        return r, "the dispatch's rate per record"
    if model and model not in X.PRICE:
        return None, ("the model %r is not in the price table (%s): give the dispatch a rate per record, or no "
                      "model" % (model, ", ".join(sorted(X.PRICE))))
    if model:
        return W.DEFAULT_COST_PER_PROGRAM, "the default rate, at %s's rates" % model
    return W.DEFAULT_COST_PER_PROGRAM, ("the default rate at Opus's rates, an upper estimate for the function's "
                                        "configured xAI model")


def price_main(college, capture_dir=None, limit=None, limit_usd="40", model=None, rate=None, attempt="1") -> int:
    """The estimate before any call (S653): the records with a page in hand x the rate per record
    (per_record_rate) x the margin (kb/_program_requirements_wave.py's price()), against Sam's $40 limit a run.
    Writes go= for the workflow's second-reader step; calls nothing and needs no key. It exits 1, so the job ends
    red, when the estimate is over the limit, the model needs a rate it was not given, or a re-run attempt would
    send records again and pay a second time (S654). With nothing to send it is never refused."""
    import _program_requirements_wave as W
    cpp, cpp_from = per_record_rate(model, rate)
    if cpp is None:
        print("::error::second reader, %s: %s; nothing is sent" % (college, cpp_from), flush=True)
        W._output("go", "false")
        return 1
    every = failing_records(slug_of(college))
    records = every[:limit] if limit else every
    n = sum(1 for r in records if source_for(capture_dir, r))
    got = W.price(n, cpp, W.parse_limit(limit_usd), True)
    print("second reader, %s: estimate $%.2f for %d records at $%.4f each (%s) with the %.2f margin; %s"
          % (college, got["price_usd"], n, got["cost_per_program"], cpp_from, got["margin"], got["why"]), flush=True)
    try:
        tries = int(str(attempt or "1").strip())
    except ValueError:
        tries = 1
    refused = None
    if n > 0 and tries > 1:
        refused = ("this is attempt %d of the second reading, and re-running it would send its %d records again and "
                   "pay a second time: dispatch the workflow again instead of re-running the job" % (tries, n))
    elif n > 0 and not got["within_limit"]:
        refused = "the estimate $%.2f is over the $%.0f limit; nothing is sent" % (got["price_usd"], got["limit_usd"])
    W._output("go", "true" if got["go"] and not refused else "false")
    if refused:
        print("::error::second reader, %s: %s" % (college, refused), flush=True)
        return 1
    return 0


def run(college, capture_dir=None, limit=None, dry_run=False, key=None, model=None, workers=4, ceiling=None,
        rate=None):
    import _program_requirements_extract as X
    import _program_requirements_reconcile as R
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

    # The hard stop is the spend meter's (kb/_spend_meter.py, S654): before each post it reserves the record's
    # estimate (the price step's rate x the margin) and refuses when the charges, the reservations in flight and
    # this one would pass the ceiling; from then on no record is sent. A call settles at its priced usage (xAI's
    # at the dearest rate, its larger reading), at its worst case when it was sent and answered no usage or raised,
    # and at $0 when it never reached the model. The run can pass the ceiling only by calls in flight costing
    # more than their estimates: a call costs at most $1.55 (X.CALL_MAX_USD, M.worst_case over every committed
    # request), $1.45 over a $0.10 estimate, so $5.80 with four workers, and $1.45 more for each further
    # part of a read in parts in flight. A run the stop held ends red.
    import _program_requirements_wave as W
    import _spend_meter as M
    # A rate the price step would refuse is refused here too, before any call (COBIx on #3330, comment
    # 6888116814): a run that skipped the price step must never price a refused model at the default rate.
    cpp, cpp_from = per_record_rate(model, rate)
    if cpp is None:
        print("::error::second reader, %s: %s; nothing is sent" % (college, cpp_from), file=sys.stderr, flush=True)
        return 1
    est = round(cpp * W.PRICE_MARGIN, 5)
    meter = M.Meter(ceiling, est)

    def one(pair):
        rec, src = pair
        if meter.stopped:
            return ("held", rec)
        try:
            got = X.call(src, key, provider=PROVIDER, model=model, meter=meter)
        except Exception as exc:
            # The posts inside the call were metered as they went (an exception in a post settles at its worst
            # case); one raised after them (merging the parts) leaves an error row and nothing uncounted.
            got = {"record": None, "usage": None, "model": None, "_sent": True, "_charge_usd": None,
                   "error": "exception: %s" % (str(exc).splitlines()[0][:200] if str(exc) else type(exc).__name__)}
        if got.get("stopped"):
            return ("held", rec)
        second = got.get("record") if isinstance(got.get("record"), dict) else None
        sc = None
        if second:
            try:
                sc = X.score(second, src["closed_list"], src["text"], rec.get("award") or src.get("award"),
                             R.prefix_aliases(college, year=rec.get("catalog_year") or src.get("catalog_year")),
                             R.packed_codes(college))
            except Exception as exc:   # a reading the scorer cannot read is still filed, with its reason
                got = dict(got, error="score: " + str(exc).splitlines()[0][:200])
        row = row_for(rec, src, got, sc)
        row["second"]["charge_usd"] = got.get("_charge_usd")   # what the meter counted for this record
        c = row["comparison"]
        print("%-6s first %-8s second %-8s %-22s %s" % (
            rec.get("control_number"), "fail", "PASS" if row["second"]["pass"] else "fail",
            c["verdict"], ("error: " + row["second"]["error"]) if row["second"].get("error") else ""), flush=True)
        return row

    from concurrent.futures import ThreadPoolExecutor
    with ThreadPoolExecutor(max_workers=max(1, workers)) as pool:
        got_all = list(pool.map(one, readable))
    rows = [r for r in got_all if not isinstance(r, tuple)]
    held = [r for r in got_all if isinstance(r, tuple)]
    if held:
        print("::warning::the hard stop held the run at $%.2f charged against $%.2f; %d record(s) not sent"
              % (meter.spent, ceiling or 0, len(held)), flush=True)
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
               "charge_usd": round(meter.spent, 4), "not_sent": len(held),
               "verdicts": counts, "rows": rows},
              open(path, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    print("wrote %s: %d read, %d skipped (no page), %d error(s); verdicts %s"
          % (os.path.relpath(path, os.path.dirname(HERE)), len(rows), len(skipped), errors, json.dumps(counts)))
    if not rows:
        # The one legitimate empty run: the college has no record failing a machine check, so there is nothing
        # to read. Any other empty run (every chosen record skipped because the capture found no page) read nothing
        # and must not look clean.
        if not records:
            print("no record fails a machine check: nothing to read", file=sys.stderr)
            return 0
        if held:
            print("nothing was read: the hard stop held all %d record(s) with a page" % len(held), file=sys.stderr)
            return 1
        print("nothing was read: all %d chosen record(s) skipped (no page the first reading came from)"
              % len(skipped), file=sys.stderr)
        return 1
    # A call error is a row with an error and no reading. A reading the scorer could not read is still a reading,
    # filed with its reason, and does not count here.
    call_errors = [r for r in rows if r["second"].get("error") and not r["second"].get("record")]
    if held:
        # The stop held records: the run is no whole reading, so it ends red (S654 review).
        print("::error::the hard stop held %d record(s) at $%.2f charged against $%.2f" % (len(held), meter.spent,
                                                                                          ceiling or 0),
              file=sys.stderr)
        return 1
    if rows and len(call_errors) == len(rows):
        # Every call errored (the database or the function down, or the function answering "XAI_API_KEY not set").
        # The file stays written as the record, but the run made no second reading, and exit 0 would report it
        # as a clean one.
        print("every one of the %d call(s) errored: no second reading was made; the first error: %s"
              % (len(rows), call_errors[0]["second"]["error"]), file=sys.stderr)
        return 1
    return 0


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--college", required=True, help="the college, as program_source_registry names it")
    ap.add_argument("--capture", help="the runner's capture dir (out/), whose sources/<cn>.json carry the page text")
    ap.add_argument("--limit", type=int, help="the first N failing records only")
    ap.add_argument("--model", help="the second reader's model id, in place of the function's XAI_MODEL")
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--dry-run", action="store_true", help="print the plan; call nothing")
    ap.add_argument("--price", action="store_true",
                    help="price what would be sent against --limit-usd, write go= for the workflow, and call nothing")
    ap.add_argument("--limit-usd", default="40")
    ap.add_argument("--ceiling-usd", default="", help="the hard stop (kb/_spend_meter.py): no record is sent once "
                    "the run's charges, the calls in flight and the next record's estimate would pass it")
    ap.add_argument("--attempt", default="1", help="price: the workflow's run attempt; a re-run that would send "
                    "records is refused")
    ap.add_argument("--rate-per-record", default="", help="price and hard stop: the dollars a record costs to "
                    "read; required with a --model the price table does not name")
    a = ap.parse_args(argv)
    a.model = (a.model or "").strip() or None
    if a.price:
        return price_main(a.college, a.capture, a.limit, a.limit_usd, a.model, a.rate_per_record, a.attempt)
    ceiling = float(a.ceiling_usd) if str(a.ceiling_usd or "").strip() else None
    return run(a.college, a.capture, a.limit, a.dry_run, (os.environ.get("SUPABASE_SERVICE_KEY") or "").strip(),
               a.model, a.workers, ceiling, a.rate_per_record)


if __name__ == "__main__":
    sys.exit(main())
