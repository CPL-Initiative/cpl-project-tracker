"""Every extraction is priced before a model call (S653).

Sam's standing limit is $40 a college a run on the estimate (relayed by COBIx on #3111; conductor_mode,
Settings). Until S653 the college workflow priced only a restaged read (sources_from), so a fresh step=read
with extract=1 ran with neither the estimate gate nor the hard stop. This test holds three things:

1. price() in kb/_program_requirements_wave.py: under the limit it goes, over it it stops with the figure, and
   extract=0 never goes but still prices.
2. Every workflow step that calls a paid extraction (`_program_requirements_college.py extract`, or
   `_program_requirements_extract.py` without --price, the pilot's) is gated on a price step that runs
   before it unconditionally, by `steps.<price>.outputs.go == 'true'`, and passes a hard stop (--ceiling-usd)
   that is never empty, and takes its dispatch inputs through env:.
3. The hard stop trips through the real usage price (S654; COBIx on #3330: xAI's OpenAI-shaped usage priced
   $0, so the second reader's stop never tripped). Only the network call is stubbed. The pilot and the second
   reader stop before a call when the cost so far and the next call's estimate would pass the ceiling, a call
   with no usage counts the per-program floor, a pilot re-run that would send programs is refused, and a
   second-reader --model the price table does not name needs a rate per record.

Python with PyYAML (js-tests.yml installs it)."""
import os
import re
import sys

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_requirements_wave as W  # noqa: E402

FAILS = []


def check(ok, what):
    print(("ok   " if ok else "FAIL ") + what)
    if not ok:
        FAILS.append(what)


# ── the price ────────────────────────────────────────────────────────────────
under = W.price(100, 0.08, 40.0, True)
check(under["price_usd"] == 10.0 and under["go"], "100 programs at the $0.08 floor with the 1.25 margin: $10, it goes")
over = W.price(500, 0.08, 40.0, True)
check(over["price_usd"] == 50.0 and not over["go"] and not over["within_limit"] and "$50.00" in over["why"],
      "500 programs: $50, over the $40 limit, it stops and names the figure (%s)" % over["why"])
edge = W.price(400, 0.08, 40.0, True)
check(edge["price_usd"] == 40.0 and edge["go"], "exactly $40 is within the limit")
free = W.price(500, 0.08, 40.0, False)
check(not free["go"] and free["price_usd"] == 50.0, "extract=0 never goes, and still prints the estimate")
check(W.price(10, 0.08, 40.0, True, {"partial": True, "why": "1 of 9 pages answered"})["go"] is False
      and W.price(10, 0.08, 40.0, True, None)["go"] is True,
      "a partial capture holds only when its pages are passed to the gate (a restaged read)")

# price_main on a fresh capture: forced programs are priced beside would_extract, and the pages never hold it.
import argparse  # noqa: E402
import json  # noqa: E402
import tempfile  # noqa: E402
with tempfile.TemporaryDirectory() as tmp:
    out = os.path.join(tmp, "out")
    os.makedirs(out)
    with open(os.path.join(out, "capture.json"), "w") as fh:
        json.dump({"would_extract": {"programs": 2, "list": [{"control_number": "11111"}, {"control_number": "22222"}]}}, fh)
    args = argparse.Namespace(college="Nowhere Test College", out=out, extract="1", limit_usd="40", attempt="1",
                              write=os.path.join(tmp, "row.json"), run="1", fresh="1", force="22222,33333,44444")
    check(W.price_main(args) == 0, "price_main runs on a fresh capture")
    with open(os.path.join(out, "wave_price.json")) as fh:
        got = json.load(fh)
    check(got["would_extract"] == 4 and got["forced_priced"] == 2 and got["go"],
          "two forced programs not on would_extract are priced beside its two, and a fresh capture's pages hold "
          "nothing (%s)" % {k: got.get(k) for k in ("would_extract", "forced_priced", "go", "why")})
    args.fresh = "0"
    W.price_main(args)
    with open(os.path.join(out, "wave_price.json")) as fh:
        check(json.load(fh)["go"] is False, "a restaged read's capture that counted no pages holds")
    # Nothing new to read on a fresh read: it goes, free, and refiles (S653 review, item 1).
    with open(os.path.join(out, "capture.json"), "w") as fh:
        json.dump({"would_extract": {"programs": 0, "list": []}}, fh)
    args.fresh, args.force = "1", ""
    W.price_main(args)
    with open(os.path.join(out, "wave_price.json")) as fh:
        got = json.load(fh)
    check(got["go"] is True and got["price_usd"] == 0.0,
          "a fresh read with nothing new to read goes, free, so it refiles its records (%s)" % got["why"])
    args.fresh = "0"
    W.price_main(args)
    with open(os.path.join(out, "wave_price.json")) as fh:
        check(json.load(fh)["go"] is False, "a restaged or wave read with nothing to send does not go")
    # A re-run attempt that would send nothing is never refused (item 2); one that would send something is.
    args.fresh, args.attempt = "1", "2"
    check(W.price_main(args) == 0, "attempt 2 of a fresh read that sends nothing passes the price step")
    args.force = "22222"
    check(W.price_main(args) == 1, "attempt 2 of a read that would send something is refused")
    args.attempt, args.force = "1", ""
    # A filed record that does not read is passed over by force=incomplete, and named (item 3).
    import _program_requirements_college as C  # noqa: E402
    folder = os.path.join(tmp, "college")
    os.makedirs(os.path.join(folder, "records"))
    with open(os.path.join(folder, "records", "11111.json"), "w") as fh:
        fh.write("{not json")
    with open(os.path.join(folder, "records", "22222.json"), "w") as fh:
        json.dump({"control_number": "22222", "score": {"arithmetic": {"status": "incomplete"},
                                                          "coverage": {"placed": 3, "listed": 4}}}, fh)
    check(C.forced(folder, "incomplete") == {"22222"},
          "force=incomplete passes over a record that does not read and keeps the rest")

# The pilot extraction's price (program-requirements-extract.yml): free, it calls nothing.
import _program_requirements_extract as XP  # noqa: E402
_n = len([s for s in XP.load_sources("") if (s.get("coverage") or 0) >= XP.MIN_COVERAGE])
_gh = os.environ.pop("GITHUB_OUTPUT", None)
check(XP.main(["--price", "--limit-usd", "40"]) == 0 and _n > 0,
      "the pilot extraction prices its %d programs without a key or a call" % _n)
if _gh is not None:
    os.environ["GITHUB_OUTPUT"] = _gh
# The second reader's price (second-reader.yml): free, it calls nothing.
import _second_reader as SR  # noqa: E402
_saved0 = (SR.failing_records, SR.source_for)
SR.failing_records = lambda slug: [{"control_number": "1", "college": "Nowhere", "title": "T", "score": {"pass": False}}]
SR.source_for = lambda capture_dir, record: {"text": "x", "closed_list": []}
_gh = os.environ.pop("GITHUB_OUTPUT", None)
try:
    check(SR.main(["--college", "Nowhere Test College", "--price", "--limit-usd", "40"]) == 0,
          "the second reader prices its records without a key or a call")
finally:
    SR.failing_records, SR.source_for = _saved0
    if _gh is not None:
        os.environ["GITHUB_OUTPUT"] = _gh

# ── the hard stop through the real cost and call_charge (COBIx on #3330 and #3327, S654) ──────────
# Only the network is stubbed (XP._post); the call, the usage's price (XP.cost), the charge (C.call_charge) and
# the stop are the code's own. The expected figures are worked by hand from the price table, Opus 5.5 at $4 in
# and $20 out per million tokens: xAI's usage of 200,000 prompt and 50,000 completion tokens is $0.80 + $1.00.
import threading  # noqa: E402
import time  # noqa: E402
import _program_requirements_college as C  # noqa: E402
_GROK = {"model": "grok-x", "usage": {"prompt_tokens": 200000, "completion_tokens": 50000}}
check(XP.cost("claude-opus-5-5", {"prompt_tokens": 1_000_000, "completion_tokens": 100_000}) == 6.0
      and XP.cost("claude-opus-5-5", {"input_tokens": 1_000_000, "output_tokens": 100_000}) == 6.0,
      "a priced model's usage costs the same in xAI's shape (prompt/completion) as in Anthropic's")
check(XP.cost("grok-x", _GROK["usage"]) is None and abs(C.call_charge(None, _GROK["usage"]) - 1.8) < 1e-9,
      "an unpriced model's xAI-shaped usage reads None on its record and counts $1.80 toward the stop, never $0")
check(C.call_charge(None, None) == W.DEFAULT_COST_PER_PROGRAM and C.call_charge(None, {}) == W.DEFAULT_COST_PER_PROGRAM
      and C.call_charge(0.0, {"prompt_tokens": 0, "completion_tokens": 0}) == W.DEFAULT_COST_PER_PROGRAM,
      "a call with no usage (an HTTP error, a timeout) counts the $%.2f per-program floor" % W.DEFAULT_COST_PER_PROGRAM)
check(C.call_charge(0.0, {"prompt_tokens": 5}) > 0 and C.call_charge(0.02, {"input_tokens": 10}) == 0.02,
      "a call whose usage carries tokens never counts $0; a positive price counts as given")


def _net(answer, sent, pause=0.0):
    """XP._post's stand-in: records each call and gives the same answer."""
    lock = threading.Lock()

    def post(body, key):
        with lock:
            sent.append(body.get("title"))
        if pause:
            time.sleep(pause)
        return json.loads(json.dumps(answer))
    return post


def _pilot(answer, ceiling):
    sent, saved, key = [], XP._post, os.environ.get("SUPABASE_SERVICE_KEY")
    XP._post = _net(answer, sent)
    os.environ["SUPABASE_SERVICE_KEY"] = "test-not-a-key"
    try:
        XP.main(["--ceiling-usd", str(ceiling)])
    finally:
        XP._post = saved
        if key is None:
            os.environ.pop("SUPABASE_SERVICE_KEY", None)
        else:
            os.environ["SUPABASE_SERVICE_KEY"] = key
    return len(sent)


_EST = XP.call_estimate()
check(abs(_EST - 0.10) < 1e-9, "one program's estimate is the $0.08 rate x the 1.25 margin, $0.10")
# Calls that cost their estimate: $0.10 each (10,000 in, 3,000 out). Under a $0.25 stop two go ($0.20); a third
# would make $0.30, so it is never sent. The check before the S654 fix (spent >= ceiling) sent three.
_AT_EST = {"model": "claude-opus-5-5", "usage": {"input_tokens": 10000, "output_tokens": 3000}}
_n2 = _pilot(_AT_EST, 0.25)
check(_n2 == 2, "the pilot's calls at their estimate stop at or under the stop: %d sent of $0.10 each under $0.25" % _n2)
# A call that costs more than its estimate ($15: 750,000 output tokens) passes the stop by that one call's overrun.
_n3 = _pilot({"model": "claude-opus-5-5", "usage": {"output_tokens": 750000}}, 40)
check(_n3 == 3 and 3 * 15.0 <= 40 + (15.0 - _EST) + 1e-9,
      "a call dearer than its estimate passes $40 by at most that one call's overrun (%d calls, $%.2f)" % (_n3, 15.0 * _n3))
# A call with no usage (a gateway timeout) counts the $0.08 floor: $0.08, $0.16, then $0.16 + $0.10 > $0.25.
_n4 = _pilot({"error": "HTTP 504: gateway timeout", "http_status": 504}, 0.25)
check(_n4 == 2, "the pilot counts a call with no usage at the floor, so the stop trips (%d sent)" % _n4)

# The pilot's re-run check (COBIx on #3327 point 1): a re-run that would send a program is refused.
_ghf = os.path.join(tempfile.mkdtemp(), "out.txt")
_gh = os.environ.get("GITHUB_OUTPUT")
os.environ["GITHUB_OUTPUT"] = _ghf


def _go():
    with open(_ghf) as fh:
        lines = [x for x in fh.read().splitlines() if x.startswith("go=")]
    open(_ghf, "w").close()
    return lines[-1] if lines else None


open(_ghf, "w").close()
check(XP.main(["--price", "--limit-usd", "40", "--attempt", "2"]) == 1 and _go() == "go=false",
      "attempt 2 of a pilot extraction that would send programs is refused and does not go")
check(XP.main(["--price", "--limit-usd", "40", "--attempt", "1"]) == 0 and _go() == "go=true",
      "attempt 1 prices and goes")
check(XP.main(["--price", "--limit-usd", "40", "--attempt", "2", "--only", "no-such-program-zz"]) == 0,
      "a re-run that would send nothing is never refused")
_go()

# The second reader, sending xAI's usage through the real price: the $1.00 stop trips after the first call.
_recs = [{"control_number": str(n), "college": "Nowhere", "title": "T%d" % n, "score": {"pass": False}}
         for n in range(20)]
_src = {"text": "x", "closed_list": [], "award": "A.A. Degree", "title": "T", "college": "Nowhere"}
_saved = (SR.failing_records, SR.source_for, SR.OUT, XP._post)


def _second(answer, ceiling, workers, n=5, pause=0.0, model=None, rate=None):
    sent = []
    with tempfile.TemporaryDirectory() as tmp:
        SR.failing_records = lambda slug: list(_recs[:n])
        SR.source_for = lambda capture_dir, record: dict(_src, title=record["title"])
        SR.OUT = tmp
        XP._post = _net(answer, sent, pause)
        try:
            SR.run("Nowhere Test College", "cap", None, False, "test-not-a-key", model, workers, ceiling, rate)
            with open(os.path.join(tmp, "second_nowhere_test.json")) as fh:
                filed = json.load(fh)
        finally:
            SR.failing_records, SR.source_for, SR.OUT, XP._post = _saved
    return sent, filed


_s1, _f1 = _second(_GROK, 1.0, 1)
check(len(_s1) == 1 and abs(_f1["charge_usd"] - 1.8) < 1e-9 and _f1["rows"][0]["second"]["cost_usd"] is None,
      "the second reader on xAI's usage stops after its first call: %d sent, $%.2f counted toward the $1.00 stop"
      % (len(_s1), _f1["charge_usd"]))
# Four workers: the calls already in flight finish, so the overshoot is at most four calls.
_s4, _f4 = _second(_GROK, 1.0, 4, n=10, pause=0.05)
check(1 <= len(_s4) <= 4 and _f4["read"] == len(_s4),
      "with four workers at most four calls go before the stop holds the rest (%d sent of 10)" % len(_s4))
# No usage (a gateway cut the reply off): each call counts the $0.08 floor. Under $1.00, twelve go: after eleven
# the run has counted $0.88 and $0.88 + $0.10 is within $1.00; after twelve, $0.96 + $0.10 is not.
_s0, _f0 = _second({"error": "HTTP 504: gateway timeout", "http_status": 504}, 1.0, 1, n=20)
check(len(_s0) == 12 and abs(_f0["charge_usd"] - 0.96) < 1e-9,
      "the second reader counts a call with no usage at the floor: %d of 20 sent, $%.2f counted"
      % (len(_s0), _f0["charge_usd"]))

# The price under a model override: a model the table does not name is refused without a rate per record.
SR.failing_records = lambda slug: list(_recs[:5])
SR.source_for = lambda capture_dir, record: dict(_src)
try:
    check(SR.main(["--college", "Nowhere Test College", "--price", "--model", "grok-x"]) == 1 and _go() == "go=false",
          "a --model the price table does not name is refused at the price step")
    check(SR.main(["--college", "Nowhere Test College", "--price", "--model", "grok-x", "--rate-per-record", "0.5"]) == 0
          and _go() == "go=true", "with a rate per record the override is priced at that rate")
    check(SR.main(["--college", "Nowhere Test College", "--price", "--model", "grok-x", "--rate-per-record", "20"]) == 0
          and _go() == "go=false", "five records at $20 with the margin ($125) are over the limit and do not go")
    check(SR.main(["--college", "Nowhere Test College", "--price"]) == 0 and _go() == "go=true"
          and SR.per_record_rate()[0] == W.DEFAULT_COST_PER_PROGRAM and "upper estimate" in SR.per_record_rate()[1],
          "with no override the default rate stands and is named an upper estimate for the configured xAI model")
finally:
    SR.failing_records, SR.source_for = _saved[0], _saved[1]
if _gh is None:
    os.environ.pop("GITHUB_OUTPUT", None)
else:
    os.environ["GITHUB_OUTPUT"] = _gh


# ── the workflows ────────────────────────────────────────────────────────────
# Every command that calls the model Edge Function: the college script's extract step, the pilot extraction
# script and the second reader (kb/_second_reader.py), each paid unless that one command carries --price
# (or --dry-run). A step's run text is cut into its commands first (line continuations joined, ${{ }}
# expressions set aside, then split at newlines, ;, &&, || and |), so a --price later on the same line, in
# another command, never frees a paid one.
# A command that runs the script (python, any flags, then its path), never one that only names it (git diff).
PAID = re.compile(r"\bpython3?(?:\s+-\S+)*\s+\S*(?:_program_requirements_college\.py\s+extract\b|"
                  r"_program_requirements_extract\.py|_second_reader\.py)")
FREE = re.compile(r"(?<!\S)--(?:price|dry-run)(?!\S)")


def commands(run_text):
    t = re.sub(r"\$\{\{.*?\}\}", " EXPR ", str(run_text or "").replace("\\\n", " "), flags=re.S)
    return [c.strip() for c in re.split(r"\n|;|&&|\|\||\|", t) if c.strip()]


def paid_commands(run_text):
    return [c for c in commands(run_text) if PAID.search(c) and not FREE.search(c)]


check(paid_commands('python3 kb/_program_requirements_extract.py --only "$ONLY" && echo --price') != [],
      "a paid call followed by --price in another command on the same line stays paid")
check(paid_commands("python3 kb/_second_reader.py --college x --capture out \\\n  --price --limit-usd 40") == [],
      "a price command split over continued lines is free")
check(paid_commands("python3 kb/_second_reader.py --college x --dry-run") == [], "a dry run is free")
check(len(paid_commands("python3 kb/_second_reader.py --college x --priced")) == 1, "--priced is no --price")

checked = 0
wf_dir = os.path.join(ROOT, ".github", "workflows")
for name in sorted(os.listdir(wf_dir)):
    if not name.endswith((".yml", ".yaml")):
        continue
    with open(os.path.join(wf_dir, name)) as fh:
        wf = yaml.safe_load(fh)
    for job_id, job in (wf.get("jobs") or {}).items():
        steps = job.get("steps") or []
        for i, st in enumerate(steps):
            paid = paid_commands(st.get("run"))
            if not paid:
                continue
            checked += 1
            where = "%s, job %s, step %r" % (name, job_id, st.get("name"))
            cond = str(st.get("if") or "")
            m = re.search(r"steps\.([A-Za-z0-9_-]+)\.outputs\.go\s*==\s*'true'", cond)
            check(bool(m), "%s runs only on its price step's go (if: %s)" % (where, cond or "none"))
            # The condition must not offer a way round the price ("||" beside the go).
            check("||" not in cond, "%s: no alternative to the price in its condition" % where)
            if not m:
                continue
            price_steps = [j for j, p in enumerate(steps) if p.get("id") == m.group(1)]
            check(len(price_steps) == 1 and price_steps[0] < i, "%s: the price step runs before it" % where)
            if price_steps:
                ps = steps[price_steps[0]]
                prun = str(ps.get("run") or "")
                check(any(("_program_requirements_wave.py price" in c or FREE.search(c)) and "--limit-usd" in c
                          for c in commands(prun)), "%s: the price step prices against a limit" % where)
                check(not ps.get("if"), "%s: the price step runs on every path (no if: on it)" % where)
                # Dispatch inputs reach the shell through env:, never pasted into the run text (COBIx on #3330).
                check("${{" not in prun and "${{" not in str(st.get("run") or ""),
                      "%s: neither it nor its price step pastes an expression into its run text" % where)
            run = " ".join(paid)
            check(all("--ceiling-usd" in c for c in paid), "%s passes the hard stop on every paid command" % where)
            ceiling = re.search(r"--ceiling-usd\s+\"?\$\{?([A-Z_]+)", run)
            env = {**(wf.get("env") or {}), **(job.get("env") or {}), **(st.get("env") or {})}
            val = str(env.get(ceiling.group(1), "")) if ceiling else ""
            check(bool(ceiling) and val.strip() != "" and "''" not in val,
                  "%s: the hard stop is never empty (%s=%r)" % (where, ceiling.group(1) if ceiling else "?", val))
check(checked >= 4, "the college, wave, pilot extraction and second reader workflows' steps were found (%d)" % checked)

print("\n%d failed" % len(FAILS) if FAILS else "\nall passed")
sys.exit(1 if FAILS else 0)
