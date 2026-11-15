"""Every extraction is priced before a model call (S653).

Sam's standing limit is $40 a college a run on the estimate (relayed by COBIx on #3111; conductor_mode,
Settings). Until S653 the college workflow priced only a restaged read (sources_from), so a fresh step=read
with extract=1 ran with neither the estimate gate nor the hard stop. This test holds three things:

1. price() in kb/_program_requirements_wave.py: under the limit it goes, over it it stops with the figure, and
   extract=0 never goes but still prices.
2. Every workflow step that calls a paid extraction (`_program_requirements_college.py extract`, or
   `_program_requirements_extract.py` without --price, the pilot's) is gated on a price step that runs
   before it wherever it can run, by `steps.<price>.outputs.go == 'true'`, and passes a hard stop (--ceiling-usd)
   that is never empty; no run: step of its job pastes an expression into its run text.
3. The spend meter (kb/_spend_meter.py, S654; d-one-spend-meter-s654) counts every paid call of the pilot, the
   college workflow and the second reader. Only the network call and the sources are stubbed. The larger usage
   reading is charged, an unlisted model at the dearest rate; a sent call with no usage or an exception at its
   worst case; one refused before the model at $0; a read in parts once per part. Exact sent counts under four
   workers hold the reservations in flight and the latch. A re-run that would send, and an estimate over the
   limit, end the price step red; a rate per record below the default is refused.

Python with PyYAML (js-tests.yml installs it)."""
import os
import re
import shutil
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

# ── the spend meter (kb/_spend_meter.py; d-one-spend-meter-s654) ─────────────────────────────────────────
# The pilot, the college workflow and the second reader count every paid call on one meter. Only the network
# (XP._post) and the programs' sources are stand-ins; the call, the price, the charge and the stop are the
# code's own. Expected figures are worked by hand from the price table, Opus 5.5 at $4 in and $20 out per million
# tokens (the dearest rate, so an unlisted model's too), and the worst case's rule: a sent call with no usage
# costs (its request's characters + 40,000) input tokens and 32,000 output tokens.
import threading  # noqa: E402
import time  # noqa: E402
import _program_requirements_college as C  # noqa: E402
import _program_requirements_extract as XP  # noqa: E402
import _second_reader as SR  # noqa: E402
import _spend_meter as M  # noqa: E402


def _usd(inp, out):
    return round((inp * 5 + out * 25) / 1e6, 5)   # the dearest rate in the table: Opus 5, 4.8, 4.7 ($5/$25)


def _worst(chars):
    return _usd(chars + 40000, 32000)


_PROBE = {"prompt_tokens": 20000, "completion_tokens": 3000, "total_tokens": 60000,
          "completion_tokens_details": {"reasoning_tokens": 37000}}
check(abs(M.charge_for("grok-x", _PROBE) - _usd(20000, 40000)) < 1e-9 and abs(_usd(20000, 40000) - 1.10) < 1e-9,
      "the reviewer's probe (20k prompt, 3k completion, 60k total, 37k reasoning) counts its larger reading, $1.10")
# Each reading on its own, so deleting one fails a check: reasoning beside completion with no total, and a total
# with no details (the S654 meter review).
check(abs(M.charge_for("grok-x", {"prompt_tokens": 20000, "completion_tokens": 3000,
                                  "completion_tokens_details": {"reasoning_tokens": 37000}}) - _usd(20000, 40000)) < 1e-9,
      "reasoning tokens with no total: the output is completion + reasoning, $1.10")
check(abs(M.charge_for("grok-x", {"prompt_tokens": 20000, "completion_tokens": 3000, "total_tokens": 60000})
          - _usd(20000, 40000)) < 1e-9, "a total with no details: the output is total - prompt, $1.10")
check(XP.cost("claude-opus-5-5", {"prompt_tokens": 1_000_000, "completion_tokens": 100_000}) == 6.0
      and XP.cost("claude-opus-5-5", {"input_tokens": 1_000_000, "output_tokens": 100_000}) == 6.0
      and XP.cost("grok-x", _PROBE) is None,
      "a listed model's usage costs the same in either shape; an unlisted model's record cost reads None")
check(M.charge_for("claude-opus-5-5", {"input_tokens": 1000, "prompt_tokens": 5000}) == round(5000 * 4 / 1e6, 5),   # Opus 5.5's own $4
      "two readings of the input that differ count the larger")
check(M.answer_charge({"error": "HTTP 429: slow down", "http_status": 429}, 5000) == 0.0
      and M.answer_charge({"error": "HTTP 401: key", "http_status": 401}, 5000) == 0.0
      and M.answer_charge({"error": "HTTP 503", "http_status": 503, "reason": "upstream_timeout"}, 5000) == 0.0,
      "an answer that never reached the model (429, 401, the caller check's 503) counts $0")
check(M.answer_charge({"error": "HTTP 504: gateway timeout", "http_status": 504}, 5000) == _worst(5000)
      and M.answer_charge({"error": "timed out"}, 5000) == _worst(5000) and abs(_worst(56000) - 1.28) < 1e-9,
      "a sent call that answered no usage counts its worst case ($%.2f for 5,000 characters), never a floor"
      % _worst(5000))
_m = M.Meter(0.25, 0.10)
_t1, _t2, _t3 = _m.reserve(), _m.reserve(), _m.reserve()
_m.settle(_t1, 0.0)
_m.settle(_t2, 0.0)
check(_t1 and _t2 and _t3 is None and _m.reserve() is None and _m.in_flight == 0 and _m.spent == 0,
      "the meter reserves two $0.10 calls under $0.25, holds the third, and once it held one it holds every later one")


class _HookLock:
    """A lock that runs a hook the moment it is first released: a reserve there must see the charge added."""

    def __init__(self, inner):
        self.inner, self.hook = inner, None

    def __enter__(self):
        return self.inner.__enter__()

    def __exit__(self, *a):
        r = self.inner.__exit__(*a)
        h, self.hook = self.hook, None
        if h:
            h()
        return r


_mw = M.Meter(1.0, 0.5)
_tw = _mw.reserve()
_mw._lock = _HookLock(_mw._lock)
_seen = {}
_mw._lock.hook = lambda: _seen.update(ticket=_mw.reserve(0.5))
_mw.settle(_tw, 0.9)
check(_seen.get("ticket") is None and abs(_mw.spent - 0.9) < 1e-9,
      "settle releases the reservation and adds the charge in one lock block: a reserve the moment it lets go sees "
      "$0.90 charged and refuses $0.50 under $1.00")


def _net(answer, sent, pause=0.0):
    """XP._post's stand-in: records each body and gives the answer (a dict, or a function of the body)."""
    lock = threading.Lock()

    def post(body, key):
        with lock:
            sent.append(body)
        if pause:
            time.sleep(pause)
        a = answer(body) if callable(answer) else answer
        if isinstance(a, Exception):
            raise a
        return json.loads(json.dumps(a))
    return post


def _src(i, codes=3):
    return {"college": "Nowhere Test College", "control_number": "%05d" % i, "shape": "certificate",
            "title": "T%02d" % i, "award": "Certificate of Achievement", "catalog_year": "2026-2027",
            "source": {"url": "https://x.edu/%d" % i}, "coverage": 1.0, "_file": "s%d.json" % i,
            "text": "Program %d\n" % i + "\n".join("A %d Course" % c for c in range(codes)),
            "closed_list": [{"code": "A %d" % c} for c in range(codes)]}


_AT_EST = {"model": "claude-opus-5-5", "usage": {"input_tokens": 10000, "output_tokens": 3000}}   # $0.10
_CHEAP = {"model": "claude-opus-5-5", "usage": {"input_tokens": 1000, "output_tokens": 300}}      # $0.01
_GROK = {"model": "grok-x", "usage": {"prompt_tokens": 200000, "completion_tokens": 50000}}      # $2.25
_TIMEOUT = {"error": "HTTP 504: gateway timeout", "http_status": 504}
_saved_x = (XP._post, XP.load_sources, os.environ.get("SUPABASE_SERVICE_KEY"), os.environ.get("GITHUB_OUTPUT"))
_ghf = os.path.join(tempfile.mkdtemp(), "out.txt")
os.environ["GITHUB_OUTPUT"] = _ghf
open(_ghf, "w").close()
os.environ["SUPABASE_SERVICE_KEY"] = "test-not-a-key"


def _go():
    with open(_ghf) as fh:
        lines = [x for x in fh.read().splitlines() if x.startswith("go=")]
    open(_ghf, "w").close()
    return lines[-1] if lines else None


try:
    # ── reads in parts: a reservation and a settlement for each part ──
    _sent = []
    XP._post = _net(_AT_EST, _sent)
    _mp = M.Meter(0.25, 0.10)
    _got = XP.call(_src(1, codes=450), "k", meter=_mp)
    check(len(_sent) == 0 and _got.get("stopped") and not _got.get("_sent") and _mp.spent == 0 and _mp.in_flight == 0,
          "a read in three parts ($0.30 of estimates) under $0.25 is held whole before any part is sent (%d sent)"
          % len(_sent))
    _sent = []
    XP._post = _net(_AT_EST, _sent)
    _mp = M.Meter(0.30, 0.10)
    _got = XP.call(_src(1, codes=450), "k", meter=_mp)
    check(len(_sent) == 3 and not _got.get("stopped") and abs(_mp.spent - 0.30) < 1e-9,
          "under $0.30 the same read sends all three parts (%d sent)" % len(_sent))
    _sent = []
    XP._post = _net(lambda b: {"error": "IDLE_TIMEOUT: the gateway ended the read"} if "part" not in b else _AT_EST,
                    _sent)
    _mp = M.Meter()
    _got = XP.call(_src(2), "k", meter=_mp)
    _first = len(json.dumps(_sent[0]))
    check(len(_sent) == 3 and abs(_mp.spent - (_worst(_first) + 0.20)) < 1e-6
          and abs(_got["_charge_usd"] - _mp.spent) < 1e-6,
          "a read whose first call timed out with no usage counts that call's worst case ($%.2f) beside its two "
          "parts ($0.20): $%.2f" % (_worst(_first), _mp.spent))
    _sent = []
    XP._post = _net(lambda b: dict(_TIMEOUT) if (b.get("part") or {}).get("index") == 1 else _AT_EST, _sent)
    _mp = M.Meter()
    XP.call(_src(3, codes=450), "k", meter=_mp)
    _p1 = [len(json.dumps(b)) for b in _sent if b["part"]["index"] == 1][0]
    check(len(_sent) == 3 and abs(_mp.spent - (_worst(_p1) + 0.20)) < 1e-6,
          "a read in parts whose first part times out with no usage counts that part's worst case: $%.2f" % _mp.spent)

    # ── the pilot (program-requirements-extract.yml): one program at a time ──
    def _pilot(answer, ceiling, n=6):
        sent = []
        XP._post = _net(answer, sent)
        XP.load_sources = lambda only="": [_src(i) for i in range(n)]
        _rc[0] = XP.main(["--ceiling-usd", str(ceiling)])
        return sent

    _rc = [None]
    check(len(_pilot(_AT_EST, 0.25)) == 2 and _rc[0] == 1,
          "the pilot's calls at their estimate stop under $0.25 at exactly two (the third would make $0.30), and a run "
          "the stop held ends red (exit %r)" % _rc[0])
    check(len(_pilot(_AT_EST, 40)) == 6 and _rc[0] == 0, "a pilot run the stop never held stays green")
    _s15 = _pilot({"model": "claude-opus-5-5", "usage": {"output_tokens": 750000}}, 40)
    check(len(_s15) == 3, "a $15 call passes its $0.10 estimate, so the pilot passes $40 by one call's overrun "
          "(three calls, $45), the bound its step comment names")
    _s0 = _pilot(_TIMEOUT, 2.0)
    check(len(_s0) == 2, "the pilot counts a timed-out call at its worst case ($%.2f), so under $2.00 the stop holds "
          "the third (%d sent)" % (_worst(len(json.dumps(_s0[0]))), len(_s0)))
    XP.load_sources = lambda only="": [_src(i) for i in range(6)]
    check(XP.main(["--price", "--limit-usd", "40", "--attempt", "2"]) == 1 and _go() == "go=false",
          "attempt 2 of a pilot extraction that would send programs is refused, red")
    check(XP.main(["--price", "--limit-usd", "40", "--attempt", "1"]) == 0 and _go() == "go=true",
          "attempt 1 of six programs prices $0.60 and goes")
    XP.load_sources = lambda only="": []
    check(XP.main(["--price", "--limit-usd", "40", "--attempt", "2"]) == 0 and _go() == "go=false",
          "a pilot re-run that would send nothing is never refused, and stays green")
    XP.load_sources = lambda only="": [_src(i) for i in range(500)]
    check(XP.main(["--price", "--limit-usd", "40"]) == 1 and _go() == "go=false",
          "500 programs ($50) are over the limit: nothing goes and the step ends red")

    # ── the college workflow (program-requirements-college.yml): six workers at a time ──
    def _college(answer, ceiling, workers, n=10, pause=0.0, halt_wait_s=0.01):
        t = tempfile.mkdtemp()
        keep, out = os.path.join(t, "keep"), os.path.join(t, "out")
        os.makedirs(os.path.join(keep, "records"))
        os.makedirs(os.path.join(out, "sources"))
        for i in range(n):
            json.dump(dict(_src(i), method="sitemap_page", codes_found=["A0", "A1", "A2"]),
                      open(os.path.join(out, "sources", "%05d.json" % i), "w"))
        sent, saved = [], XP.score
        XP._post = _net(answer, sent, pause)
        XP.score = lambda rec, *a, **k: {"pass": True, "coverage": {"pass": True, "share": 1.0, "listed": 3,
                                                                     "placed": 3},
                                         "invented": {"pass": True, "count": 0}, "arithmetic": {"status": "equal"}}
        try:
            C.extract(out, 0, 1, "654", workers, keep, None, ceiling, halt_wait_s=halt_wait_s)
            with open(os.path.join(out, "extract_account_0.json")) as fh:
                acct = json.load(fh)
            acct["_check_extract"] = C.check_extract(out)
        finally:
            XP.score = saved
            shutil.rmtree(t, ignore_errors=True)
        return sent, acct

    _cs, _ca = _college(dict(_AT_EST, record={"blocks": []}), 0.25, 4, pause=0.05)
    check(len(_cs) == 2 and abs(_ca["meter_charge_usd"] - 0.20) < 1e-9,
          "the college workflow with four workers under $0.25 sends exactly two (%d), its reservations held in "
          "flight; the receipt names the meter's $%.2f" % (len(_cs), _ca["meter_charge_usd"]))
    check(_ca["_check_extract"] == 1, "a college read the stop held ends red at check-extract")
    _cs, _ca = _college(dict(_AT_EST, record={"blocks": []}), 40, 4)
    check(len(_cs) == 10 and _ca["_check_extract"] == 0, "a college read the stop never held stays green")
    # The halt retry is metered: the caller check's 503 counts $0 and the retry's priced $0.10 is counted.
    _tries = {}

    def _halt_then_read(b):
        _tries[b["title"]] = _tries.get(b["title"], 0) + 1
        if _tries[b["title"]] == 1:
            return {"error": "HTTP 503: upstream", "http_status": 503, "reason": "upstream_timeout"}
        return dict(_AT_EST, record={"blocks": []})
    _cs, _ca = _college(_halt_then_read, 0.15, 1, n=1)
    check(len(_cs) == 2 and abs(_ca["meter_charge_usd"] - 0.10) < 1e-9,
          "a 503 from the caller check, then a priced retry: the receipt counts the retry's $0.10 (%r)"
          % _ca["meter_charge_usd"])
    _cs, _ca = _college(dict(_CHEAP, record={"blocks": []}), 0.25, 4, pause=0.05)
    check(len(_cs) == 2, "with $0.01 calls the college meter still sends exactly two: once it held a call it "
          "sends nothing more (%d)" % len(_cs))
    with tempfile.TemporaryDirectory() as _d:
        json.dump({"extract_asked": True, "go": False, "within_limit": False, "price_usd": 50.0, "limit_usd": 40.0},
                  open(os.path.join(_d, "wave_price.json"), "w"))
        _red = C.check_extract(_d)
        json.dump({"extract_asked": False, "go": False, "within_limit": False, "price_usd": 50.0, "limit_usd": 40.0},
                  open(os.path.join(_d, "wave_price.json"), "w"))
        _green = C.check_extract(_d)
    check(_red == 1 and _green == 0, "an asked extraction the price refused over the limit ends the college run red; "
          "extract=0 at the same price stays green")
    with tempfile.TemporaryDirectory() as _d:
        json.dump({"ceiling_usd": 40, "meter_charge_usd": 40.0, "halted": None, "programs": ["00001"]},
                  open(os.path.join(_d, "not_sent_0.json"), "w"))
        _held = C.check_extract(_d)
    check(_held == 1, "programs the stop held, with no halt to explain them, end the college run red")

    # ── the second reader (second-reader.yml): four workers at a time ──
    _recs = [{"control_number": str(n), "college": "Nowhere", "title": "T%d" % n, "score": {"pass": False}}
             for n in range(20)]
    _saved_sr = (SR.failing_records, SR.source_for, SR.OUT)

    def _second(answer, ceiling, workers, n=5, pause=0.0, model=None, rate=None):
        sent = []
        with tempfile.TemporaryDirectory() as tmp:
            SR.failing_records = lambda slug: list(_recs[:n])
            SR.source_for = lambda capture_dir, record: dict(_src(int(record["control_number"])))
            SR.OUT = tmp
            XP._post = _net(answer, sent, pause)
            try:
                filed_rc = SR.run("Nowhere Test College", "cap", None, False, "test-not-a-key", model, workers,
                                  ceiling, rate)
                with open(os.path.join(tmp, "second_nowhere_test.json")) as fh:
                    filed = json.load(fh)
                filed["_rc"] = filed_rc
            finally:
                SR.failing_records, SR.source_for, SR.OUT = _saved_sr
        return sent, filed

    _s1, _f1 = _second(_GROK, 1.0, 1)
    check(len(_s1) == 1 and abs(_f1["charge_usd"] - 2.25) < 1e-9 and _f1["rows"][0]["second"]["cost_usd"] is None
          and abs(_f1["rows"][0]["second"]["charge_usd"] - 2.25) < 1e-9,
          "the second reader on xAI's usage stops after its first call: %d sent, $%.2f counted, cost_usd null"
          % (len(_s1), _f1["charge_usd"]))
    _sp, _fp = _second({"model": "grok-x", "usage": _PROBE}, None, 1, n=1)
    check(abs(_fp["rows"][0]["second"]["charge_usd"] - 1.10) < 1e-9, "the probe's row counts $1.10")
    _s4, _f4 = _second(_AT_EST, 0.25, 4, n=10, pause=0.05)
    check(len(_s4) == 2 and _f4["not_sent"] == 8 and _f4["_rc"] == 1,
          "with four workers under $0.25 the second reader sends exactly two (%d): the reservations in flight hold "
          "the third" % len(_s4))
    _sg, _fg = _second(_AT_EST, 40, 4, n=5)
    check(len(_sg) == 5 and _fg["_rc"] == 0, "a second reading the stop never held stays green")
    _sc, _fc = _second(_CHEAP, 0.25, 4, n=10, pause=0.05)
    check(len(_sc) == 2, "with $0.01 calls it still sends exactly two: once held, nothing more (%d)" % len(_sc))
    _se, _fe = _second(RuntimeError("the connection dropped"), None, 1, n=1)
    _ec = len(json.dumps(_se[0]))
    check(len(_se) == 1 and (_fe["rows"][0]["second"]["error"] or "").startswith("exception:")
          and abs(_fe["rows"][0]["second"]["charge_usd"] - _worst(_ec)) < 1e-6 and abs(_fe["charge_usd"] - _worst(_ec)) < 1e-4,
          "an exception inside the call settles at its worst case ($%.2f) and files an error row" % _worst(_ec))
    _s429, _f429 = _second({"error": "HTTP 429: rate limited", "http_status": 429}, 1.0, 1, n=5)
    check(len(_s429) == 5 and _f429["charge_usd"] == 0,
          "a pre-model 429 with no usage counts $0, so all five are sent and nothing is counted")
    _st, _ft = _second(_TIMEOUT, 2.0, 1, n=5)
    check(len(_st) == 2, "a timed-out call counts its worst case, so under $2.00 two are sent (%d)" % len(_st))

    # The second reader's price: the override, the rate, the limit and the re-run, each red when refused.
    SR.failing_records = lambda slug: list(_recs[:5])
    SR.source_for = lambda capture_dir, record: dict(_src(1))
    try:
        check(SR.main(["--college", "Nowhere Test College", "--price"]) == 0 and _go() == "go=true"
              and SR.per_record_rate()[0] == W.DEFAULT_COST_PER_PROGRAM and "upper estimate" in SR.per_record_rate()[1],
              "with no override the default rate stands and is named an upper estimate for the configured xAI model")
        check(SR.main(["--college", "Nowhere Test College", "--price", "--model", "grok-x"]) == 1 and _go() == "go=false",
              "a --model the price table does not name is refused at the price step, red")
        check(SR.main(["--college", "Nowhere Test College", "--price", "--model", "grok-x", "--rate-per-record", "0.5"])
              == 0 and _go() == "go=true", "with a rate per record the override is priced at that rate")
        check(SR.main(["--college", "Nowhere Test College", "--price", "--model", "grok-x", "--rate-per-record", "0.05"])
              == 1 and _go() == "go=false", "a rate per record below the $0.08 default is refused")
        check(SR.main(["--college", "Nowhere Test College", "--price", "--model", "grok-x", "--rate-per-record", "20"])
              == 1 and _go() == "go=false", "five records at $20 with the margin ($125) are over the limit, red")
        check(SR.main(["--college", "Nowhere Test College", "--price", "--attempt", "2"]) == 1 and _go() == "go=false",
              "attempt 2 of a second reading that would send records is refused, red")
        SR.failing_records = lambda slug: []
        check(SR.main(["--college", "Nowhere Test College", "--price", "--attempt", "2"]) == 0,
              "a re-run with nothing to send is never refused")
    finally:
        SR.failing_records, SR.source_for, SR.OUT = _saved_sr
finally:
    XP._post, XP.load_sources = _saved_x[0], _saved_x[1]
    for _k, _v in (("SUPABASE_SERVICE_KEY", _saved_x[2]), ("GITHUB_OUTPUT", _saved_x[3])):
        if _v is None:
            os.environ.pop(_k, None)
        else:
            os.environ[_k] = _v

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
                # The price step runs on every path the paid step can run on: no if:, or one the paid step's own
                # condition carries (the pilot's push guard, S654).
                pif = str(ps.get("if") or "").strip()
                check(not pif or pif in cond, "%s: the price step runs wherever it can (if: %s)" % (where, pif or "none"))
                # The re-run guard (S654 review): the price step passes the run's attempt, from the runner, by env.
                penv = {**(wf.get("env") or {}), **(job.get("env") or {}), **(ps.get("env") or {})}
                check(any('--attempt "$ATTEMPT"' in c for c in commands(prun))
                      and str(penv.get("ATTEMPT", "")).replace(" ", "") == "${{github.run_attempt}}",
                      "%s: the price step passes --attempt \"$ATTEMPT\" with ATTEMPT from github.run_attempt" % where)
                if name == "program-requirements-college.yml":
                    check('--fresh "$FRESH"' in prun and '--force "$FORCE"' in prun,
                          "%s: the price step passes --fresh and --force, so forced programs are priced" % where)
                    later = [p for p in steps[i + 1:] if "check-extract" in str(p.get("run") or "")]
                    check(len(later) == 1 and "env.EXTRACT == 'true'" in str(later[0].get("if") or "")
                          and "||" not in str(later[0].get("if") or ""),
                          "%s: check-extract runs after it whenever extraction is set" % where)
            run = " ".join(paid)
            check(all("--ceiling-usd" in c for c in paid), "%s passes the hard stop on every paid command" % where)
            ceiling = re.search(r"--ceiling-usd\s+\"?\$\{?([A-Z_]+)", run)
            env = {**(wf.get("env") or {}), **(job.get("env") or {}), **(st.get("env") or {})}
            val = str(env.get(ceiling.group(1), "")) if ceiling else ""
            check(bool(ceiling) and val.strip() != "" and "''" not in val,
                  "%s: the hard stop is never empty (%s=%r)" % (where, ceiling.group(1) if ceiling else "?", val))
check(checked >= 4, "the college, wave, pilot extraction and second reader workflows' steps were found (%d)" % checked)
# Dispatch inputs and run context reach the shell through env:, never pasted into the run text, in every run: step of
# a job that holds a paid step (COBIx on #3330; the S654 review found the second reader's pin and capture steps).
pasted = []
for name in sorted(os.listdir(wf_dir)):
    if not name.endswith((".yml", ".yaml")):
        continue
    with open(os.path.join(wf_dir, name)) as fh:
        wf = yaml.safe_load(fh)
    for job_id, job in (wf.get("jobs") or {}).items():
        steps = job.get("steps") or []
        if not any(paid_commands(st.get("run")) for st in steps):
            continue
        pasted += ["%s, job %s, step %r" % (name, job_id, st.get("name")) for st in steps
                   if "${{" in str(st.get("run") or "")]
check(pasted == [], "no run: step in a job with a paid step pastes an expression into its run text: %r" % pasted[:3])

print("\n%d failed" % len(FAILS) if FAILS else "\nall passed")
sys.exit(1 if FAILS else 0)
