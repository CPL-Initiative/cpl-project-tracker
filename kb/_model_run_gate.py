"""The $40 gate for a run of calls to an Edge Function that returns no usage to its caller (S655, card 10).

Sam's standing limit is $40 a run on the estimate, per run and never a remaining pot (relayed by COBIx on #3111,
comment 6808460886), and one meter prices every paid model call (kb/_spend_meter.py, d-one-spend-meter-s654).
cpl-news-harvest and cpl-chat answer their callers with no usage, so no hard stop can count a run as it goes. Their
stop is this gate: before any call it computes the run's worst case from the function's own limits, read from the
function's source in this repo, and through the meter (M.run_bound), and it refuses the run when that bound passes
$40. It sends nothing and needs no key.

  cpl-news-harvest   one POST runs the whole harvest. Calls: the manual queue's limit plus MAX_NEW_CANDIDATES,
                     in batches of ANALYZE_BATCH, one model call a batch, no retry (a raw fetch). Each call: the
                     model's context window as input (the API refuses a longer request unbilled) and max_tokens as
                     output, at its fixed model's rate (Sonnet 4.6, $3/$15).
  cpl-chat           one model call an answer, no retry (a raw fetch). Calls: the runs in a test script (each run or
                     ask line is one answer) times the passes, plus extra calls, or --calls. Each call: max_tokens
                     as output, and SIERRA_INPUT_TOKENS as input. Sierra's prompt is assembled at request time and
                     the function caps no total, so its input is an allowance, not a limit the function enforces:
                     3.3 times the 30,600-token mean of 2026-10-26 and 27 (docs/reference/model_spend.md), which
                     also covers the largest query cap (QUERY_CAP_GR_ANALYSIS, 40,000 characters) on top of that
                     mean. Her model is the CPL_CHAT_MODEL secret, which this repo cannot read, so the rate of the
                     dearest model that accepts her request (thinking turned off): Opus 4.8, $5/$25. A run of the
                     smoke suite counts only the modes it names (SMOKE_MODES, matched as smoke_test.sh matches
                     them), so the A/B, at most 56 answers, names 27 modes a side or fewer.

A limit the gate cannot read from the source refuses the run: a function that changed shape is a person's to price.
When the functions return usage (the next deploy), these callers move to the meter's hard stop.

  python3 kb/_model_run_gate.py cpl-news-harvest
  python3 kb/_model_run_gate.py cpl-chat --script chatbox/smoke_test.sh [--modes "7c,9"] [--passes 2] [--extra 2]
  python3 kb/_model_run_gate.py cpl-chat --calls 1

Exit 0 with go=true when the bound is within the limit; exit 1 with go=false otherwise (the job ends red).
"""
import argparse
import math
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import _spend_meter as M  # noqa: E402

FUNCTIONS = os.path.join(ROOT, "chatbox", "supabase", "functions")
# Every model these functions name has a 1M-token context window (claude-api skill, models table cached
# 2026-11-03: Sonnet 4.6, Sonnet 5, Opus 5.5); a request past it is refused before the model, unbilled.
CONTEXT_WINDOW_TOKENS = 1_000_000
SIERRA_INPUT_TOKENS = 100_000
# The dearest model that accepts Sierra's request shape (thinking: disabled; Fable and Opus 5.5 refuse it), priced
# in the meter's table at $5/$25 (S655 second reader on #3351).
SIERRA_PRICED_AS = "claude-opus-4-8"
MODEL_ENDPOINT = "api.anthropic.com/v1/messages"


class Unreadable(Exception):
    pass


def source(fn: str) -> str:
    with open(os.path.join(FUNCTIONS, fn, "index.ts"), encoding="utf-8") as fh:
        return fh.read()


def _one(pattern: str, text: str, what: str) -> str:
    found = re.findall(pattern, text)
    if len(found) != 1:
        raise Unreadable("%s: found %d times, expected once" % (what, len(found)))
    return found[0]


def _one_model_call(text: str, fn: str) -> None:
    """The bound counts one model call per batch or answer: exactly one call site, and no SDK client, whose retries
    would bill outside it."""
    if text.count(MODEL_ENDPOINT) != 1:
        raise Unreadable("%s: %d model call sites, expected one" % (fn, text.count(MODEL_ENDPOINT)))
    if re.search(r"new\s+Anthropic\s*\(", text):
        raise Unreadable("%s: an SDK client retries on its own; the bound counts one attempt a call" % fn)


def news_limits(text: str) -> dict:
    _one_model_call(text, "cpl-news-harvest")
    manual = int(_one(r"cpl_news_requests\?[^`\"']*?[?&]limit=(\d+)", text, "the manual queue's limit"))
    fresh = int(_one(r"const MAX_NEW_CANDIDATES = (\d+)", text, "MAX_NEW_CANDIDATES"))
    batch = int(_one(r"const ANALYZE_BATCH = (\d+)", text, "ANALYZE_BATCH"))
    out = int(_one(r"max_tokens: (\d+)", text, "max_tokens"))
    model = _one(r'const MODEL = "([^"]+)"', text, "MODEL")
    if batch <= 0:
        raise Unreadable("ANALYZE_BATCH is %d" % batch)
    return {"calls": math.ceil((manual + fresh) / batch), "input_tokens": CONTEXT_WINDOW_TOKENS,
            "output_tokens": out, "model": model, "attempts": 1,
            "how": "%d manual + %d candidates in batches of %d, the %s-token context window in, %d out"
                   % (manual, fresh, batch, format(CONTEXT_WINDOW_TOKENS, ","), out)}


def chat_limits(text: str) -> dict:
    _one_model_call(text, "cpl-chat")
    out = int(_one(r"const MAX_TOKENS = (\d+);", text, "MAX_TOKENS"))
    # The model is a secret the repo cannot read (CPL_CHAT_MODEL): priced as the dearest model that accepts it.
    return {"input_tokens": SIERRA_INPUT_TOKENS, "output_tokens": out, "model": SIERRA_PRICED_AS, "attempts": 1,
            "how": "%s tokens in (an allowance), %d out, at %s's rate" % (format(SIERRA_INPUT_TOKENS, ","), out,
                                                                         SIERRA_PRICED_AS)}


RUN_LINE = re.compile(r"^\s*(?:run|ask)\s+(\S.*)$", re.M)


def script_calls(path: str, modes: str = "") -> int:
    """The answers a test script asks for: each line that calls its run or ask function is one billed answer
    (chatbox/smoke_test.sh's run, chatbox/preflight_bgca.sh's ask). modes, a comma list as SMOKE_MODES takes it,
    keeps only the runs whose label's first word it names, as smoke_test.sh's mode_selected does."""
    with open(path, encoding="utf-8") as fh:
        lines = RUN_LINE.findall(fh.read())
    want = {m for m in re.sub(r"\s", "", modes or "").split(",") if m}
    if not want:
        return len(lines)
    n = 0
    for rest in lines:
        m = re.match(r'"([^"]*)"', rest)
        if m and m.group(1).split(" ")[0] in want:
            n += 1
    return n


def gate(limits: dict, calls: int, limit: float = None) -> dict:
    limit = M.STANDING_LIMIT_USD if limit is None else float(limit)
    bound = M.run_bound(calls, limits["input_tokens"], limits["output_tokens"], limits["model"], limits["attempts"])
    return {"calls": calls, "per_call_usd": M.call_bound(limits["input_tokens"], limits["output_tokens"],
                                                        limits["model"]),
            "bound_usd": round(bound, 2), "limit_usd": limit, "go": M.within_limit(bound, limit),
            "how": limits["how"]}


def _output(name: str, value: str) -> None:
    path = os.environ.get("GITHUB_OUTPUT")
    if path:
        with open(path, "a") as fh:
            fh.write("%s=%s\n" % (name, value))


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("function", choices=["cpl-news-harvest", "cpl-chat"])
    ap.add_argument("--calls", type=int, help="cpl-chat: the answers this run asks for")
    ap.add_argument("--script", help="cpl-chat: a test script whose run or ask lines are the answers")
    ap.add_argument("--modes", default="", help="cpl-chat: the smoke modes this run names (blank: all)")
    ap.add_argument("--passes", type=int, default=1, help="cpl-chat: times the script runs (the A/B runs it twice)")
    ap.add_argument("--extra", type=int, default=0, help="cpl-chat: further answers beside the script's")
    args = ap.parse_args(argv)
    try:
        if args.function == "cpl-news-harvest":
            limits = news_limits(source("cpl-news-harvest"))
            calls = limits["calls"]
        else:
            limits = chat_limits(source("cpl-chat"))
            if (args.calls is None) == (args.script is None):
                raise Unreadable("give --calls or --script, one of them")
            calls = (args.calls if args.script is None
                     else script_calls(args.script, args.modes) * max(1, args.passes))
            calls += max(0, args.extra)
    except (Unreadable, OSError, ValueError) as exc:
        print("::error::%s: the $%.0f gate could not read the function's limits (%s); nothing is sent"
              % (args.function, M.STANDING_LIMIT_USD, exc), flush=True)
        _output("go", "false")
        return 1
    got = gate(limits, calls)
    print("%s: worst case $%.2f for %d calls at $%.4f each (%s), against the $%.0f limit"
          % (args.function, got["bound_usd"], got["calls"], got["per_call_usd"], got["how"], got["limit_usd"]),
          flush=True)
    _output("go", "true" if got["go"] else "false")
    if not got["go"]:
        print("::error::%s: the worst case $%.2f is over the $%.0f limit; nothing is sent"
              % (args.function, got["bound_usd"], got["limit_usd"]), flush=True)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
