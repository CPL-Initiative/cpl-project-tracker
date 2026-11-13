#!/usr/bin/env python3
"""Apply a display build's receipt to program_requirement_records from a runner.

WHY. kb/_build_roep_display.py writes each harvested program's display facts
twice: into cpl_pathways_roep_data.js for the page, and into a receipt
(kb/receipts/program_requirement_records_display_<date>_<build>.sql.gz, gzipped
from S398; earlier builds' are plain .sql) for the
table Sierra and the Records view read. Until S356 a session applied the
receipt through the Supabase connector's apply_migration, a batch of about
twenty statements a migration. That held for the pilot's 22 programs (185 KB).
A full college is a 2.2 MB receipt for Cerritos alone, and every college after
it adds another; pushed through a session, each one costs hundreds of thousands
of tokens and an afternoon of timeouts. So the receipt is applied where the
service key already lives: the college workflow's display job
(.github/workflows/program-requirements-college.yml, step=display).

WHAT IT APPLIES. The receipt of the build the page carries: the build stamp in
cpl_pathways_roep_data.js names it, so the table and the page agree by
construction, and a dispatch needs no input to get it right. Each statement's
display JSON is applied exactly as the receipt prints it (the receipt is the
reviewed artifact; nothing here rebuilds it), with one PATCH a program on its
key, writing display and nothing else. The verdict trigger
(program_requirement_records_follow_verdict) re-applies the latest verdict
from record and checks, which a display write leaves alone, so a person's
Confirm survives. --college "<name>" applies only that college's statements.

HOW (S644). Until S644 it read and wrote one row at a time, in series: build
8fbbcfb7a9c0's 17,598 statements took 69 minutes (run 43310473532). Now:
  1. One paged read (1,000 rows a page, ordered by college and control number)
     takes every row's key and display->>build. A statement whose key is not
     in it is missing (up to 300 such keys are re-read one at a time: offset
     paging has no snapshot, so a concurrent delete on an earlier page moves
     a later row out of the read); a row already carrying this build is
     skipped and counted `already`, so a run after a partial failure costs
     only what is left.
  2. The plan (every key to write and its before-build) is filed in the
     applied record BEFORE the first write; a run canceled mid-write still
     leaves its rollback behind.
  3. The PATCHes run in a bounded pool (--workers, 8 by default), each retried
     on a 5xx, a timeout or a dropped connection, with backoff, at most 4
     tries; after that the row is an error.
  4. A second paged read (with the same one-key re-read of up to 300 planned
     keys it lacks) confirms which planned rows now carry the build, and the
     applied record is finished from that read, never from a write's
     response: a write whose response was lost still ends confirmed.
Missing keys are listed and reported, and are not fatal by themselves: the
run exits 1 when a planned row does not carry the build afterward, or when
more statements are still missing than both 1% of them and 30 keys (the
wrong build), and 0 otherwise. A key missing at the first read that the confirming read finds
(a load inserted it mid-run) is listed as `present_now`: not written, run
again. A receipt with no statement (or none of --college's) is refused.

ROLLBACK (Rule 10 a2). The applied record beside the receipt
(<receipt>.applied_<run>.json; a re-run adds its attempt above 1, from
GITHUB_RUN_ATTEMPT, and a --college run adds the college's slug)
files each planned row's before-build: a row that held no display goes back
to null, and a row that held an older build goes back by re-applying that
build's receipt. The rollback names every row the run may have written:
while the record is still a plan (state "planned" or "unconfirmed"), every
planned row; once confirmed, every planned row it sent a write, errored and
unconfirmed rows included (a PATCH that timed out can still commit after
the confirming read), leaving out only a row never tried and a row the
server refused outright on every try (a 4xx other than 408 or 429) that the
confirming read shows still holding its before-build. Naming an unwritten row is safe: putting it back to its
before-build leaves it as it was. A
row skipped as `already` was not written by this run and is not in its
rollback; the earlier run that wrote it holds it in its own record. A
display write on a checked program waits on Sam's go (his sheet 42 card 2
practice); the dispatch is that go carried out, so the workflow never runs
this on a push.

Usage, from the repo root:
  python3 kb/_program_requirements_display_apply.py --dry-run [--college NAME]
      name the build and receipt, parse every statement, write nothing
  python3 kb/_program_requirements_display_apply.py --apply [--run N] [--workers 8] [--college NAME]
      apply it with SUPABASE_SERVICE_KEY and file the applied record

Guard: tests/program_requirements_display_apply_test.py.
"""
from __future__ import annotations

import argparse
import glob
import gzip
import hashlib
import http.client
import json
import os
import re
import socket
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
RECEIPTS = os.path.join(HERE, "receipts")
PAGE = os.path.join(ROOT, "cpl_pathways_roep_data.js")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co").rstrip("/")
TABLE = "program_requirement_records"
BUILD = re.compile(r'"build":\s*"([0-9a-f]{12})"')
HEAD = "insert into public.program_requirement_records "
JSON_AT = "r.checks, '"
KEY = re.compile(r"^::jsonb from public\.program_requirement_records r where r\.college = '((?:[^']|'')*)' "
                 r"and r\.control_number = '((?:[^']|'')*)' on conflict \(college, control_number\) "
                 r"do update set display = excluded\.display;\s*$")


def page_build(src: str | None = None) -> str:
    """The one build the page carries; refuses a page that mixes builds."""
    if src is None:
        with open(PAGE, encoding="utf-8") as fh:
            src = fh.read()
    builds = set(BUILD.findall(src))
    if len(builds) != 1:
        raise SystemExit("the page carries %d builds (%s); rebuild it before applying"
                         % (len(builds), ", ".join(sorted(builds)) or "none"))
    return builds.pop()


def receipt_for(build: str, folder: str = RECEIPTS) -> str:
    """The full receipt of a build, gzipped (S398 on) or plain. A delta receipt
    (its name ends _delta) writes only the rows that moved, so it never stands
    for the build."""
    hits = [p for pat in ("program_requirement_records_display_*_%s.sql", "program_requirement_records_display_*_%s.sql.gz")
            for p in glob.glob(os.path.join(folder, pat % build))
            if not os.path.basename(p).endswith(("_delta.sql", "_delta.sql.gz"))]
    if len(hits) != 1:
        raise SystemExit("%d full receipts name build %s in %s" % (len(hits), build, folder))
    return hits[0]


def _literal(line: str, start: int) -> tuple[str, int]:
    """The SQL string literal opening at line[start] (a quote), unescaped, and
    the index just past its closing quote. A doubled quote is a quote."""
    out, i = [], start + 1
    while i < len(line):
        ch = line[i]
        if ch == "'":
            if i + 1 < len(line) and line[i + 1] == "'":
                out.append("'")
                i += 2
                continue
            return "".join(out), i + 1
        out.append(ch)
        i += 1
    raise ValueError("an unterminated string literal")


def parse(text: str) -> list[dict]:
    """Every statement of a display receipt as {college, control_number,
    display}. A line that is neither a comment nor a statement of the receipt's
    one shape stops the parse: what applies is exactly what was reviewed."""
    rows = []
    for n, line in enumerate(text.splitlines(), 1):
        if not line.strip() or line.startswith("--"):
            continue
        if not line.startswith(HEAD):
            raise ValueError("line %d is not a display statement" % n)
        at = line.find(JSON_AT)
        if at < 0:
            raise ValueError("line %d carries no display literal" % n)
        raw, end = _literal(line, at + len(JSON_AT) - 1)
        m = KEY.match(line[end:])
        if not m:
            raise ValueError("line %d does not end on one program's key" % n)
        rows.append({"college": m.group(1).replace("''", "'"),
                     "control_number": m.group(2).replace("''", "'"),
                     "display": json.loads(raw)})
    return rows


def _request(method: str, path_qs: str, key: str, body: dict | None = None) -> list:
    req = urllib.request.Request(
        SUPABASE_URL + "/rest/v1/" + path_qs,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"apikey": key, "Authorization": "Bearer " + key, "Content-Type": "application/json",
                 "Prefer": "return=representation"},
        method=method)
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode() or "[]")


def _where(college: str, control_number: str) -> str:
    return "college=eq.%s&control_number=eq.%s" % (urllib.parse.quote(college, safe=""),
                                                   urllib.parse.quote(control_number, safe=""))


PAGE_ROWS = 1000      # PostgREST's max-rows; a page is ordered by the key, so pages never shear
WORKERS = 8           # PATCHes at once
TRIES = 4             # a PATCH or a page read, at most
ERROR_STOP = 50       # past this many failed writes the rest are not tried (a dead key or host)
MISSING_LINE = 0.01   # more than 1% of the statements missing means the wrong build,
MISSING_FLOOR = 30    # and more than 30 keys, so a small college's few gone rows do not fail it
RECHECK_MAX = 300     # missing keys re-read one at a time; past this the build is wrong anyway
SHOW = 30             # missing keys printed


def _key(college: str, control_number: str) -> str:
    return "%s|%s" % (college, control_number)


def _first(exc: BaseException) -> str:
    return (str(exc).splitlines() or [""])[0][:300] or type(exc).__name__


def _transient(exc: BaseException) -> bool:
    """A 5xx, a 408 or 429, a timeout or a dropped connection is worth another
    try; any other 4xx is not."""
    if isinstance(exc, urllib.error.HTTPError):
        return exc.code >= 500 or exc.code in (408, 429)
    return isinstance(exc, (urllib.error.URLError, TimeoutError, socket.timeout, ConnectionError,
                            http.client.HTTPException))


def _retry(call, sleep, tries: int = TRIES):
    """call() until it returns, sleeping 1, 2, 4 s between tries of a transient failure."""
    for i in range(tries):
        try:
            return call()
        except Exception as exc:
            if i == tries - 1 or not _transient(exc):
                raise
            sleep(2 ** i)


def read_builds(request, college: str | None = None, sleep=time.sleep) -> dict:
    """{key: display->>build} for every row (one college's with `college`), in
    pages of PAGE_ROWS ordered by college and control number, read until an
    empty page, so a server capping a page lower than PAGE_ROWS still reads whole."""
    scope = "&college=eq.%s" % urllib.parse.quote(college, safe="") if college else ""
    out, offset = {}, 0
    while True:
        qs = ("%s?select=college,control_number,build:display->>build%s"
              "&order=college.asc,control_number.asc&limit=%d&offset=%d" % (TABLE, scope, PAGE_ROWS, offset))
        page = _retry(lambda: request("GET", qs), sleep)
        if not page:
            return out
        for r in page:
            out[_key(r["college"], r["control_number"])] = r.get("build")
        offset += len(page)


def _rollback(before: dict, keys: list) -> dict:
    held = sorted({before[k] for k in keys if before[k]})
    return {
        "to_null": [k for k in keys if before[k] is None],
        "reapply": {b: [k for k in keys if before[k] == b] for b in held},
        "how": "set display to null for to_null; for each build in reapply, re-apply that build's "
               "full receipt (kb/receipts/program_requirement_records_display_*_<build>.sql, or .sql.gz) to those keys.",
    }


def _file(rec: dict, out: str | None) -> None:
    if not out:
        return
    tmp = out + ".tmp"
    with open(tmp, "w") as fh:
        json.dump(rec, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    os.replace(tmp, out)


def apply(rows: list[dict], build: str, receipt: str, run: str | None, request=None, *,
          out: str | None = None, workers: int = WORKERS, college: str | None = None,
          sleep=time.sleep, log=print) -> dict:
    """Read every row's build in pages, file the plan to `out`, write the
    planned rows in a pool, then confirm them with a second paged read and
    finish the record from it. Returns the applied record;
    `request(method, path_qs, body)` and `sleep` are injectable for the test."""
    request = request or (lambda m, p, b=None: _request(m, p, os.environ["SUPABASE_SERVICE_KEY"], b))
    with open(receipt, "rb") as fh:
        md5 = hashlib.md5(fh.read()).hexdigest()
    rec = {
        "build": build, "receipt": os.path.relpath(receipt, ROOT), "receipt_md5": md5, "run": run,
        "scope": college or "the whole build", "workers": workers,
        "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "state": "planned", "statements": len(rows), "already": 0, "planned": 0, "written": None,
        "missing": [], "present_now": [], "errors": [], "unconfirmed": [], "before": {},
        "rollback": _rollback({}, []),
    }
    by_key = {}
    for r in rows:
        by_key.setdefault(_key(r["college"], r["control_number"]), r)

    # 1. Before-values, in pages; a key the pages lack is re-read on its own.
    try:
        held = read_builds(request, college, sleep)
        missing = [k for k in by_key if k not in held]
        if 0 < len(missing) <= RECHECK_MAX:
            for k in missing:
                where = _where(by_key[k]["college"], by_key[k]["control_number"])
                got = _retry(lambda: request("GET", "%s?select=build:display->>build&%s" % (TABLE, where)), sleep)
                if len(got) == 1:
                    held[k] = got[0].get("build")
    except Exception as exc:
        rec["state"] = "not started"
        rec["errors"].append({"key": None, "error": "the before-read: " + _first(exc)})
        _file(rec, out)
        return rec
    rec["missing"] = [k for k in by_key if k not in held]
    rec["already"] = sum(1 for k in by_key if k in held and held[k] == build)
    plan = {k: held[k] for k in by_key if k in held and held[k] != build}
    rec["planned"], rec["before"], rec["rollback"] = len(plan), plan, _rollback(plan, list(plan))

    # 2. The plan is the rollback until the confirming read; it is filed before the first write.
    _file(rec, out)
    log("plan: %d to write, %d already carry %s, %d missing" % (len(plan), rec["already"], build,
                                                                len(rec["missing"])))

    # 3. The writes, a bounded pool, each retried on a transient failure.
    failed, lock, stop, done = {}, threading.Lock(), threading.Event(), [0]
    sent, refused = set(), set()     # sent a write; every try refused by a 4xx, so none can land late

    def write(k: str) -> None:
        tried, no = False, False
        if stop.is_set():
            err = "not tried: %d writes had failed" % ERROR_STOP
        else:
            tried = True
            where = _where(by_key[k]["college"], by_key[k]["control_number"])
            body = {"display": by_key[k]["display"]}
            outcomes = []            # per try: True when the server refused it outright

            def once():
                try:
                    return request("PATCH", "%s?select=control_number&%s" % (TABLE, where), body)
                except Exception as exc:
                    outcomes.append(isinstance(exc, urllib.error.HTTPError) and not _transient(exc))
                    raise
            try:
                back = _retry(once, sleep)
                err = None if len(back) == 1 else "the write matched %d rows" % len(back)
            except Exception as exc:
                err = _first(exc)
                no = bool(outcomes) and all(outcomes)
        with lock:
            done[0] += 1
            if tried:
                sent.add(k)
            if no:
                refused.add(k)
            if err:
                failed[k] = err
                if len(failed) >= ERROR_STOP:
                    stop.set()
            if done[0] % 2000 == 0:
                log("  %d of %d written or tried, %d failed" % (done[0], len(plan), len(failed)))

    with ThreadPoolExecutor(max_workers=max(1, workers)) as pool:
        list(pool.map(write, plan))

    # 4. Confirm from a fresh read, never from the writes' responses.
    try:
        post = read_builds(request, college, sleep)
    except Exception as exc:
        rec["state"] = "unconfirmed"
        rec["errors"] = [{"key": k, "error": failed[k]} for k in plan if k in failed]
        rec["errors"].append({"key": None, "error": "the confirming read: " + _first(exc)})
        rec["unconfirmed"] = list(plan)
        _file(rec, out)
        return rec
    # A planned key the pages lack is re-read on its own (a concurrent delete shifts a page).
    for k in [k for k in plan if k not in post][:RECHECK_MAX]:
        where = _where(by_key[k]["college"], by_key[k]["control_number"])
        try:
            got = _retry(lambda: request("GET", "%s?select=build:display->>build&%s" % (TABLE, where)), sleep)
        except Exception:
            continue                      # left absent: unconfirmed, and in the rollback if it was sent
        if len(got) == 1:
            post[k] = got[0].get("build")
    confirmed = [k for k in plan if post.get(k) == build]
    ok = set(confirmed)
    rec["state"] = "confirmed"
    rec["written"] = len(confirmed)
    rec["errors"] = [{"key": k, "error": failed[k], "confirmed": k in ok} for k in plan if k in failed]
    rec["unconfirmed"] = [k for k in plan if k not in ok]
    rec["present_now"] = [k for k in rec["missing"] if k in post]
    # Every row the run may have written: each one sent a write, but a row the server
    # refused outright that still holds its before-build. A timed-out write can land late.
    rec["rollback"] = _rollback(plan, [k for k in plan if k in sent
                                       and not (k in refused and k in post and post[k] == plan[k])])
    rec["finished"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    _file(rec, out)
    return rec


def exit_code(rec: dict) -> int:
    """1 when the run did not confirm, when a planned row does not carry the
    build after it (an error the confirming read resolved is not one), or when
    more are still missing than both 1% of the statements and 30 keys; 0 otherwise. A key a load
    inserted mid-run (present_now) is not missing; the next run writes it."""
    return 1 if rec["state"] != "confirmed" or rec["unconfirmed"] or over_line(rec) else 0


def still_missing(rec: dict) -> list:
    now = set(rec.get("present_now", []))
    return [k for k in rec["missing"] if k not in now]


def over_line(rec: dict) -> bool:
    """The wrong-build line: more missing than 1% of the statements and more
    than MISSING_FLOOR keys, so a small --college run is not failed by the
    few keys the table no longer holds."""
    return len(still_missing(rec)) > max(MISSING_LINE * rec["statements"], MISSING_FLOOR)


def read_receipt(path: str) -> str:
    if path.endswith(".gz"):
        with gzip.open(path, "rt", encoding="utf-8") as fh:
            return fh.read()
    with open(path, encoding="utf-8") as fh:
        return fh.read()


def applied_path(receipt: str, run: str | None, college: str | None = None, attempt: str | None = None) -> str:
    """<receipt stem>.applied_<run>[_<attempt>][_<college slug>].json; the
    attempt only above 1, so a re-run of one workflow run never writes over
    the first attempt's record."""
    stem = receipt[:-len(".gz")] if receipt.endswith(".gz") else receipt
    tag = "_%d" % int(attempt) if attempt and str(attempt).isdigit() and int(attempt) > 1 else ""
    slug = "_" + re.sub(r"[^a-z0-9]+", "-", college.lower()).strip("-") if college else ""
    return stem[:-len(".sql")] + ".applied_%s%s%s.json" % (run or "local", tag, slug)


def main(argv: list[str] | None = None, request=None, sleep=time.sleep) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    mode = ap.add_mutually_exclusive_group(required=True)
    mode.add_argument("--dry-run", action="store_true", help="parse the receipt; write nothing")
    mode.add_argument("--apply", action="store_true", help="write it with SUPABASE_SERVICE_KEY")
    ap.add_argument("--run", default=os.environ.get("GITHUB_RUN_ID"))
    ap.add_argument("--attempt", default=os.environ.get("GITHUB_RUN_ATTEMPT"),
                    help="the run's attempt; above 1 it joins the applied record's name")
    ap.add_argument("--workers", type=int, default=WORKERS, help="PATCHes at once (default %d)" % WORKERS)
    ap.add_argument("--college", help="apply only this college's statements, as the receipt names it")
    args = ap.parse_args(argv)
    build = page_build()
    receipt = receipt_for(build)
    rows = parse(read_receipt(receipt))
    if not rows:
        print("REFUSING: the receipt of build %s (%s) holds no statement" % (build, os.path.relpath(receipt, ROOT)))
        return 1
    stale =[r["control_number"] for r in rows if (r["display"] or {}).get("build") != build]
    if stale:
        print("REFUSING: %d statements carry another build than %s (first: %s)" % (len(stale), build, stale[0]))
        return 1
    keys = [_key(r["college"], r["control_number"]) for r in rows]
    if len(set(keys)) != len(keys):
        print("REFUSING: %d keys appear in more than one statement; parallel writes would land in no set order"
              % (len(keys) - len(set(keys))))
        return 1
    if args.college:
        rows = [r for r in rows if r["college"] == args.college]
        if not rows:
            print("REFUSING: no statement of build %s names the college %r" % (build, args.college))
            return 1
    print("build %s: %s, %d statements%s" % (build, os.path.relpath(receipt, ROOT), len(rows),
                                             " of %s" % args.college if args.college else ""))
    if args.dry_run:
        return 0
    if request is None and not os.environ.get("SUPABASE_SERVICE_KEY"):
        print("SUPABASE_SERVICE_KEY is not set; the display write takes the service role.")
        return 2
    out = applied_path(receipt, args.run, args.college, args.attempt)
    rec = apply(rows, build, receipt, args.run, request, out=out, workers=args.workers,
                college=args.college, sleep=sleep)
    gone, now = still_missing(rec), rec.get("present_now", [])
    if gone:
        print("missing %d (no row holds the key): %s%s" % (len(gone), ", ".join(gone[:SHOW]),
                                                         ", ..." if len(gone) > SHOW else ""))
    if now:
        print("present now, not written: run again (%d, a load inserted them mid-run): %s%s"
              % (len(now), ", ".join(now[:SHOW]), ", ..." if len(now) > SHOW else ""))
    print("%s: written %s of %d planned; %d already; missing %d; errors %d (%d resolved by the confirming read); "
          "not confirmed %d" % (rec["state"], rec["written"] if rec["written"] is not None else "unknown",
                                rec["planned"], rec["already"], len(rec["missing"]), len(rec["errors"]),
                                sum(1 for e in rec["errors"] if e.get("confirmed")), len(rec["unconfirmed"])))
    for e in rec["errors"][:SHOW]:
        print("  error %s: %s" % (e["key"], e["error"]))
    if over_line(rec):
        print("FAIL: more than 1%% of the statements, and more than 30, are missing (%d of %d); "
              "is this the build the table holds?"
              % (len(gone), rec["statements"]))
    return exit_code(rec)


if __name__ == "__main__":
    sys.exit(main())
