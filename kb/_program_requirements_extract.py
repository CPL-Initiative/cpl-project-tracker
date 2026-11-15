#!/usr/bin/env python3
"""The program requirements pilot, extraction pass: draft each record and score it.

Phase 1 of the program requirements harvest
(docs/reference/lanes/program-requirements-harvest.md). The capture pass
(kb/_program_requirements_pilot.py) filed each pilot program's catalog text and
closed course list under kb/program_requirements_pilot/sources/. This pass
reads those files and nothing else: it never loads a college's site. For each
program it posts the text and the closed list to the
program-requirements-extract Edge Function (Sam's call 6 on sheet 23: model
calls go through an Edge Function that holds the Anthropic key), then scores
the record it gets back against the closed list
(kb/_program_requirements_score.py): coverage, no invented courses, unit
arithmetic. The scorer also reads the catalog text, so a record that states no
figure passes only when the page prints none. The fourth check is Sam's
reading of the same 20 programs.

It writes nothing. It prints a line per program and one JSON object per
program between markers, which a session reads from the job log and files.
The cost of each call is priced from the usage the function returns, so the
pilot can compare methods by cost per program (the plan's fifth measure).

Run (on the runner, with SUPABASE_SERVICE_KEY):
    python3 kb/_program_requirements_extract.py [--only TEXT]
"""
from __future__ import annotations

import argparse
import difflib
import glob
import json
import math
import os
import re
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from _program_requirements_score import score  # noqa: E402
from _program_requirements_pilot import code_pattern, find_codes, norm_code  # noqa: E402

SOURCES = os.path.join(HERE, "program_requirements_pilot", "sources")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co").rstrip("/")
FUNCTION = "program-requirements-extract"
MIN_COVERAGE = 0.5      # a fixture whose page named fewer listed codes was not the program's page
# The record shape the function writes (its header names each version). Shape 3
# (S334, Sam's sheet 33 card 4): program and course outcomes as printed, which
# the scorer checks word for word against the catalog text. Shape 4 (S360, Sam's
# rules 4 and 5, Open Asks Sheet 61 card 1): a block of rule "recommended" for
# courses the catalog recommends, and program.careers as printed. Shape 5 (S389,
# Sam's Open Asks Sheet 78 card 2, "Record both figures"): program.degree_total,
# program.ge_units and program.electives_fill_degree, so a page that prints the
# degree total with general education and no major total is checked against it.
# Shape 6 (S392; Sam, 2026-10-14, Cabrillo Biology 06328 Needs a fix):
# program.degree_elective_units beside a major total the page also prints, and a
# major-minimum sentence is no major total; the scorer checks the major and the degree.
RECORD_SHAPE = 6

# A program read in parts (S361; Sam, 2026-10-11: "go with splitting the program
# into two calls"). A record holds about 54 output tokens per course: 215 listed
# courses came to about 11,500 of a call's 16,000 in about 80 s, and Humanities,
# Philosophy & Arts (316) ran past it at all three RCCD colleges. The gateway
# ends a request that sends nothing back for 150 s (Mt. San Antonio 24171), so
# one longer call cannot hold such a record. The function's version 6 reads one
# part of it; call() sends the parts at once and merge_parts() joins them.
SPLIT_AT = 240     # listed courses above which a program is read in parts from the start
PART_SIZE = 200    # listed courses one part carries at most
SPLIT_WHEN = ("ran past max_tokens", "IDLE_TIMEOUT")   # a single call's error that sends it to parts

# The price table and the usage reader are the spend meter's (kb/_spend_meter.py, S654), the one place a call is
# priced and counted; these names stay for the readers that use them.
import _spend_meter as M  # noqa: E402
PRICE = M.PRICE
# The most one post can cost: M.worst_case of the largest request the committed sources can make, a part of a read
# in parts included. tests/model_run_gates_test.py recomputes it over every committed request and fails when this
# figure, or an overshoot stated from it in the three callers and their workflows, falls behind (COBIx on #3330,
# comment 6888534891). Over the $0.10 estimate a call can pass the hard stop by CALL_MAX_USD - $0.10, $1.15.
CALL_MAX_USD = 1.25


def load_sources(only: str = "") -> list[dict]:
    out = []
    for path in sorted(glob.glob(os.path.join(SOURCES, "*.json"))):
        with open(path) as fh:
            src = json.load(fh)
        # A comma-separated list matches any of its parts ("cerritos_41982,ivc,smc"), the file's name included.
        hay = (src["college"] + " " + src["control_number"] + " " + os.path.basename(path)).lower()
        if only and not any(t.strip().lower() in hay for t in only.split(",") if t.strip()):
            continue
        src["_file"] = os.path.relpath(path, os.path.dirname(HERE))
        out.append(src)
    return out


def usage_tokens(usage) -> tuple:
    """(input, output, cache read, cache write) tokens, in either usage shape (M.usage_tokens)."""
    return M.usage_tokens(usage)


def cost(model: str | None, usage: dict | None) -> float | None:
    """The call's price from its usage, in either shape (M.price). A fallback model the table does not price reads
    None rather than a wrong number on its record; the meter counts it at the dearest rate (M.charge_for)."""
    return M.price(model, usage)


def call(src: dict, key: str, provider: str | None = None, model: str | None = None, meter=None) -> dict:
    """The record for one program: one call, or, for a program too long for one
    reply, a call per part (call_in_parts). A single call that runs past
    max_tokens or the gateway's idle limit is read again in parts.
    provider names the function's reader (version 11: "anthropic", the default,
    or "xai", the second reader of Sam's Sheet 97 ruling); model, when given,
    names the second reader's model in place of the function's XAI_MODEL.
    meter (kb/_spend_meter.py's Meter) reserves before each post and settles after it, a read in parts once per part;
    none given, an unlimited one counts the call. The answer carries _charge_usd (what the meter counted for this
    program) and _sent (whether any post went); a call the stop held carries stopped."""
    meter = meter if meter is not None else M.Meter()
    body = {"college": src["college"], "title": src["title"], "award": src["award"],
            "catalog_year": src.get("catalog_year"), "source_url": (src.get("source") or {}).get("url"),
            "text": src["text"], "closed_list": src["closed_list"]}
    if provider:
        body["provider"] = provider
    if model:
        body["model"] = model
    if len(src["closed_list"]) > SPLIT_AT:
        return call_in_parts(src, key, body, meter=meter)
    got = meter.call(lambda: _post(body, key), M.request_chars(body))
    if any(w in (got.get("error") or "") for w in SPLIT_WHEN):
        return call_in_parts(src, key, body, first=got, meter=meter)
    return got


def _post(body: dict, key: str) -> dict:
    req = urllib.request.Request(
        "%s/functions/v1/%s" % (SUPABASE_URL, FUNCTION), data=json.dumps(body).encode(),
        headers={"Authorization": "Bearer " + key, "apikey": key,
                 "Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=300) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as exc:
        # The status rides beside the text, and the function's reason when it gives one, so a caller can tell
        # an outage from a bad record (halt_of).
        raw = exc.read().decode(errors="replace")
        out = {"error": "HTTP %d: %s" % (exc.code, raw[:300]), "http_status": exc.code}
        try:
            answer = json.loads(raw)
        except ValueError:
            answer = None
        if isinstance(answer, dict) and answer.get("reason"):
            out["reason"] = str(answer["reason"])[:80]
            out["detail"] = str(answer.get("detail") or "")[:200]
        return out
    except Exception as exc:
        return {"error": str(exc).splitlines()[0][:300]}


# A function answer that will be the same for every program, so a read stops at it rather than send the rest
# (S647, Sam's Open Asks Sheet 190 card 6). Version 12 of the function answers 503 when its caller check could not
# reach the database, and 401 only when the key is refused; before it, every failure answered 401, and Glendale's
# run 43384599013 sent all 135 programs into a database outage and filed 121 error stubs. The halting answer itself
# costs no model call, but a read in parts can carry the paid usage of its other parts (the caller charges it).
HALT_EXIT = 3     # a run the function's answer stopped (the pilot here; extract in _program_requirements_college)
HALT_STATUS = {
    503: "the extraction function could not check the caller (the database did not answer)",
    401: "the extraction function refused the service key",
}
# A 503 without the caller check's upstream_* reason came from the platform in front of the function (a boot error,
# a deploy in progress), not from the database probe (S648 review): it still halts, under its own cause.
HALT_503_PLATFORM = "the platform answered 503 before the extraction function ran (a boot error or a deploy in progress)"


def halt_of(got: dict | None) -> dict | None:
    """{status, cause, reason, detail, error} when the function's answer stops the whole read (HALT_STATUS),
    else None. reason and detail are the function's own words (upstream_timeout, upstream_http_503, ...)."""
    status = (got or {}).get("http_status")
    if status not in HALT_STATUS:
        return None
    cause = HALT_STATUS[status]
    if status == 503 and not str(got.get("reason") or "").startswith("upstream_"):
        cause = HALT_503_PLATFORM
    return {"status": status, "cause": cause, "reason": got.get("reason"),
            "detail": got.get("detail"), "error": str(got.get("error") or "")[:300]}


def split_codes(closed: list[dict], text: str, n: int) -> list[list[str]]:
    """The closed list in n parts, by where each course first appears in the
    catalog text, so each part reads about 1/n of the section and its blocks.
    The courses the text never names come last (the last part reports them in
    missing_explained). Each part is non-empty; fewer courses than n give fewer
    parts."""
    seen, uniq = set(), []
    for c in closed:
        k = norm_code(c.get("code"))
        if k and k not in seen:
            seen.add(k)
            uniq.append(c["code"])
    found = find_codes(text or "", [{"code": c} for c in uniq])
    order = [c for _, _, c in sorted((min(found[norm_code(c)]), i, c)
                                     for i, c in enumerate(uniq) if norm_code(c) in found)]
    order += [c for c in uniq if norm_code(c) not in found]
    n = max(1, min(n, len(order)))
    size = math.ceil(len(order) / n) if order else 1
    return [p for p in (order[i * size:(i + 1) * size] for i in range(n)) if p]


def _block_key(b: dict) -> tuple:
    return (re.sub(r"\s+", " ", (b.get("name") or "").strip().lower()), b.get("rule"))


def _codes_in(entry: dict) -> list[str]:
    return [norm_code(x.get("code") if isinstance(x, dict) else x)
            for x in [entry] + list(entry.get("alternatives") or []) if x]


def _merge_block(a: dict, b: dict, part: int, problems: list[str]) -> dict:
    out = dict(a, courses=list(a.get("courses") or []) + list(b.get("courses") or []))
    for f in ("minimum", "option_group"):
        if out.get(f) is None:
            out[f] = b.get(f)
        elif b.get(f) is not None and b.get(f) != out.get(f):
            problems.append("the parts read '%s' with different %s (%s; part %d: %s)"
                            % (a.get("name"), f, out.get(f), part, b.get(f)))
    sa, sb = a.get("stated") or {}, b.get("stated") or {}
    if sa.get("min") is None and sa.get("max") is None:
        out["stated"] = {"min": sb.get("min"), "max": sb.get("max")}
    elif (sb.get("min"), sb.get("max")) not in ((None, None), (sa.get("min"), sa.get("max"))):
        problems.append("the parts read '%s' with different stated totals (%s-%s; part %d: %s-%s)"
                        % (a.get("name"), sa.get("min"), sa.get("max"), part, sb.get("min"), sb.get("max")))
    return out


def merge_parts(records: list[dict], text: str) -> tuple[dict, list[str]]:
    """One record from the parts of a program read in parts. Blocks align by
    name and rule in the catalog's order (a block one part left out is kept from
    the other); each block's entries join, an entry whose first code the block
    already places is dropped, and the entries take the catalog's order. Outcomes,
    missing_explained and notes join; program comes from part 1, its outcomes and
    careers from the first part that read any. A disagreement the merge cannot
    settle (two stated totals, blocks named differently) is returned and kept in
    notes for the reviewer."""
    problems: list[str] = []
    base = records[0]
    blocks = [dict(b, courses=list(b.get("courses") or [])) for b in base.get("blocks") or []]
    for part, rec in enumerate(records[1:], start=2):
        other = rec.get("blocks") or []
        sm = difflib.SequenceMatcher(a=[_block_key(b) for b in blocks],
                                     b=[_block_key(b) for b in other], autojunk=False)
        merged = []
        for tag, a0, a1, b0, b1 in sm.get_opcodes():
            if tag == "equal":
                merged += [_merge_block(blocks[a0 + k], other[b0 + k], part, problems) for k in range(a1 - a0)]
                continue
            if tag == "replace":
                problems.append("part %d names blocks part 1 does not: %s (kept beside %s)" % (
                    part, ", ".join("'%s'" % b.get("name") for b in other[b0:b1]),
                    ", ".join("'%s'" % b.get("name") for b in blocks[a0:a1])))
            merged += blocks[a0:a1] + [dict(b, courses=list(b.get("courses") or [])) for b in other[b0:b1]]
        blocks = merged

    def positions(code: str) -> list[int]:
        pat = code_pattern(code or "")
        return [m.start() for m in pat.finditer(text or "")] if pat else []

    # The catalog prints its blocks in order, so each entry is placed at its
    # code's first appearance after the previous block's last course: a course
    # printed in two blocks (AAA 1 required, and again among the electives)
    # sorts by where this block prints it.
    end = 0
    placed: set[str] = set()
    for b in blocks:
        kept, here = [], set()
        for c in b["courses"]:
            codes = _codes_in(c)
            if not codes or codes[0] in here:
                continue
            here.update(codes)
            kept.append(c)
        at = []
        for i, c in enumerate(kept):
            ps = positions(c.get("code"))
            later = [p for p in ps if p >= end]
            at.append((later[0] if later else (ps[0] if ps else math.inf), i, c))
        at.sort(key=lambda o: (o[0], o[1]))
        b["courses"] = [c for _, _, c in at]
        found = [p for p, _, _ in at if p != math.inf]
        end = max(found) if found else end
        placed |= here

    program = dict(base.get("program") or {})
    for f in ("outcomes", "careers"):
        if not program.get(f):
            program[f] = next((r["program"][f] for r in records[1:]
                               if (r.get("program") or {}).get(f)), program.get(f) or [])
    outs, seen_out = [], set()
    for r in records:
        for o in r.get("course_outcomes") or []:
            k = norm_code(o.get("code"))
            if k not in seen_out:
                seen_out.add(k)
                outs.append(o)
    missing, seen_m = [], set()
    for r in records:
        for m in r.get("missing_explained") or []:
            k = norm_code(m.get("code"))
            if k and k not in placed and k not in seen_m:
                seen_m.add(k)
                missing.append(m)
    notes = list(base.get("notes") or [])
    for part, r in enumerate(records[1:], start=2):
        notes += ["Part %d: %s" % (part, n) for n in r.get("notes") or []]
    notes.append("Read in %d parts, because one reply could not hold the whole record." % len(records))
    notes += ["Reviewer: " + p for p in problems]
    return {"program": program, "blocks": blocks, "course_outcomes": outs,
            "missing_explained": missing, "notes": notes}, problems


def _sum_usage(results: list[dict]) -> dict:
    """Every call's usage summed field by field, a nested count (completion_tokens_details.reasoning_tokens)
    included."""
    total: dict = {}
    for r in results:
        for k, v in ((r or {}).get("usage") or {}).items():
            if isinstance(v, (int, float)) and not isinstance(v, bool):
                total[k] = total.get(k, 0) + v
            elif isinstance(v, dict):
                sub = total.setdefault(k, {})
                if isinstance(sub, dict):
                    for k2, v2 in v.items():
                        if isinstance(v2, (int, float)) and not isinstance(v2, bool):
                            sub[k2] = sub.get(k2, 0) + v2
    return total


def call_in_parts(src: dict, key: str, body: dict, first: dict | None = None,
                  post=None, meter=None) -> dict:
    """The record read in parts, sent at once. The usage covers every call made
    for the program, a single call that failed first included, so the cost is
    what the program spent. Each part is its own reservation and settlement on the
    meter (S654): a part the stop holds is never sent, and the read answers with
    that part's error; _charge_usd sums every call's charge, the first's included."""
    post = post or _post
    meter = meter if meter is not None else M.Meter()
    closed = src["closed_list"]
    parts = split_codes(closed, src["text"], max(2, math.ceil(len(closed) / PART_SIZE)))
    bodies = [dict(body, part={"index": i + 1, "of": len(parts), "codes": codes})
              for i, codes in enumerate(parts)]
    # Every part's estimate is reserved in one step before any part is sent (S654 review): the stop holds the
    # whole read or none of it, so no paid part is wasted on a read it holds partway.
    tickets = meter.reserve_many(len(bodies))
    if tickets is None:
        out = dict(meter.held(), parts=len(parts), split_because=(first or {}).get("error")
                   or "the closed list holds %d courses" % len(closed))
        if first:
            out.update(_sent=bool(first.get("_sent")), _charge_usd=first.get("_charge_usd") or 0.0,
                       usage=_sum_usage([first]), model=first.get("model"))
        return out
    with ThreadPoolExecutor(max_workers=len(bodies)) as pool:
        gots = list(pool.map(lambda tb: meter.send_reserved(tb[0], lambda: post(tb[1], key), M.request_chars(tb[1])),
                             zip(tickets, bodies)))
    every = ([first] if first else []) + gots
    models = {g.get("model") for g in every if g.get("model")}
    out = {"model": models.pop() if len(models) == 1 else None, "usage": _sum_usage(every),
           "ms": (first or {}).get("ms", 0) + max((g.get("ms") or 0) for g in gots),
           "parts": len(parts),
           "split_because": (first or {}).get("error") or "the closed list holds %d courses" % len(closed),
           "stop_reason": None, "record": None, "error": None,
           "_sent": any(g.get("_sent") for g in every),
           "_charge_usd": round(sum(g.get("_charge_usd") or 0.0 for g in every), 5)}
    if any(g.get("stopped") for g in gots):
        out["stopped"] = True
    for i, g in enumerate(gots, start=1):
        if g.get("error") or not isinstance(g.get("record"), dict):
            out["stop_reason"] = g.get("stop_reason")
            out["error"] = "part %d of %d: %s" % (i, len(gots), g.get("error") or "no record")
            for k in ("http_status", "reason", "detail"):
                if g.get(k):
                    out[k] = g[k]
            return out
    out["record"], _ = merge_parts([g["record"] for g in gots], src["text"])
    out["stop_reason"] = gots[-1].get("stop_reason")
    return out


def call_estimate() -> float:
    """One program's share of the estimate the price step gates on: the default rate x the margin (W.price)."""
    import _program_requirements_wave as W
    return round(W.DEFAULT_COST_PER_PROGRAM * W.PRICE_MARGIN, 5)


def attempt_of(attempt) -> int:
    try:
        return int(str(attempt or "1").strip())
    except ValueError:
        return 1


def price_main(args) -> int:
    """The estimate before any call (S653): the programs that would be sent x the default rate per program
    x the margin (kb/_program_requirements_wave.py's price()), against Sam's $40 limit a run. Writes go=
    for the workflow's extraction step; calls nothing and needs no key. It exits 1, so the job ends red, when
    the estimate is over the limit, or when a re-run attempt would send programs again (COBIx on #3327, S654;
    the college workflow's check_attempt holds the same rule). With nothing to send it is never refused."""
    import _program_requirements_wave as W
    n = len([s for s in load_sources(args.only) if (s.get("coverage") or 0) >= MIN_COVERAGE])
    got = W.price(n, W.DEFAULT_COST_PER_PROGRAM, W.parse_limit(args.limit_usd), True)
    print("pilot extraction: estimate $%.2f for %d programs at $%.4f each with the %.2f margin; %s"
          % (got["price_usd"], n, got["cost_per_program"], got["margin"], got["why"]), flush=True)
    attempt = attempt_of(getattr(args, "attempt", "1"))
    refused = None
    if n > 0 and attempt > 1:
        refused = ("this is attempt %d of the pilot extraction, and re-running it would send its %d programs again "
                   "and pay a second time: dispatch the workflow again instead of re-running the job" % (attempt, n))
    elif n > 0 and not got["within_limit"]:
        refused = "the estimate $%.2f is over the $%.0f limit; nothing is sent" % (got["price_usd"], got["limit_usd"])
    W._output("go", "true" if got["go"] and not refused else "false")
    if refused:
        print("::error::pilot extraction: %s" % refused, flush=True)
        return 1
    return 0


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--only", default="", help="programs whose college, number or file name contains this (comma-separated: any)")
    ap.add_argument("--price", action="store_true",
                    help="price what would be sent against --limit-usd, write go= for the workflow, and call nothing")
    ap.add_argument("--limit-usd", default="40")
    ap.add_argument("--ceiling-usd", default="", help="the hard stop (kb/_spend_meter.py): no program is sent once "
                    "the run's charges, the calls in flight and the next program's estimate would pass it")
    ap.add_argument("--attempt", default="1", help="price: the workflow's run attempt; a re-run that would send "
                    "a program is refused")
    args = ap.parse_args(argv)
    if args.price:
        return price_main(args)
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not key:
        print("SUPABASE_SERVICE_KEY is not set; the Edge Function takes only the service key.")
        return 2
    sources = [s for s in load_sources(args.only) if (s.get("coverage") or 0) >= MIN_COVERAGE]
    print("program requirements pilot, extraction: %d programs, writes nothing" % len(sources), flush=True)
    rows = []
    ceiling = float(args.ceiling_usd) if str(args.ceiling_usd or "").strip() else None
    # The hard stop is the spend meter's (kb/_spend_meter.py, S654): before each post it reserves the program's
    # estimate ($0.08 x 1.25) and refuses when the charges, the reservations in flight and this one would pass the
    # ceiling; from then on it sends nothing. One program is read at a time (a read in parts posts its parts at
    # once, a reservation each), so the run can pass the ceiling only by the calls in flight costing more than
    # their estimates. A call costs at most CALL_MAX_USD, $1.25 (M.worst_case over every committed request, which
    # tests/model_run_gates_test.py recomputes), $1.15 over its $0.10 estimate: the worst overshoot is $1.15 for
    # one call, and $1.15 a part for a read in parts. A run the stop held ends red.
    meter = M.Meter(ceiling, call_estimate())
    for src in sources:
        if meter.stopped:
            print("::warning::the hard stop held the run at $%.2f charged against $%.2f; %d programs not sent"
                  % (meter.spent, ceiling, len(sources) - len(rows)), flush=True)
            break
        t0 = time.time()
        got = call(src, key, meter=meter)
        if got.get("stopped"):
            print("::warning::the hard stop held the run at $%.2f charged against $%.2f; %d programs not sent"
                  % (meter.spent, ceiling, len(sources) - len(rows)), flush=True)
            break
        h = halt_of(got)
        if h:
            # Every program would get the same answer, and program-requirements-extract.yml (a dispatch or an
            # [extract] push) should show the outage as a red run, never a clean one (S648): stop red.
            print("::error::the pilot stopped at %s: %s (HTTP %s%s); %d programs not sent" % (
                src["control_number"], h["cause"], h["status"], ", " + h["reason"] if h.get("reason") else "",
                len(sources) - len(rows) - 1), flush=True)
            return HALT_EXIT
        rec = got.get("record")
        sc = score(rec, src["closed_list"], src["text"]) if isinstance(rec, dict) else None
        row = {"college": src["college"], "control_number": src["control_number"],
               "shape": src["shape"], "title": src["title"], "source_file": src["_file"],
               "record_shape": RECORD_SHAPE,
               "model": got.get("model"), "stop_reason": got.get("stop_reason"),
               "usage": got.get("usage"), "cost_usd": cost(got.get("model"), got.get("usage")),
               "charge_usd": got.get("_charge_usd"),
               "ms": got.get("ms"), "seconds": round(time.time() - t0, 1), "parts": got.get("parts"),
               "error": got.get("error"), "score": sc, "record": rec}
        rows.append(row)
        print("%-26s %-6s %-20s %s cov %-5s inv %-2s arith %-10s out %-7s $%s  %s" % (
            src["college"][:26], src["control_number"], src["shape"],
            "PASS" if sc and sc["pass"] else "fail",
            sc and sc["coverage"]["share"], sc and sc["invented"]["count"],
            sc and sc["arithmetic"]["status"],
            sc and "%d%s" % (sc["outcomes"]["count"], "" if sc["outcomes"]["pass"] else " BAD"),
            row["cost_usd"], row["error"] or ""), flush=True)
    total = sum(r["cost_usd"] or 0 for r in rows)
    print("\npassed %d of %d; model cost $%.4f ($%.4f a program); the meter counted $%.4f" % (
        sum(1 for r in rows if r["score"] and r["score"]["pass"]), len(rows), total,
        total / len(rows) if rows else 0, meter.spent))
    print("=== PILOT RECORDS JSON BEGIN ===")
    for r in rows:
        print(json.dumps(r, ensure_ascii=False))
    print("=== PILOT RECORDS JSON END ===")
    if meter.stopped:
        # The stop held programs: the run is no whole read, so it ends red (S654 review).
        print("::error::the hard stop held the pilot at $%.2f charged against $%.2f; %d of %d programs were read"
              % (meter.spent, ceiling, len(rows), len(sources)), flush=True)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
