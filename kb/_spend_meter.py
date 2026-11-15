"""One spend meter for every paid model call (S654; d-one-spend-meter-s654).

Sam's standing limit is $40 a college a run on the estimate, with a hard stop (relayed by COBIx on #3111). Until
S654 the pilot extraction, the college workflow and the second reader each kept their own running spend, and each
undercounted somewhere: xAI's OpenAI-shaped usage priced $0 (COBIx on #3330), reasoning tokens sat outside
completion_tokens, a call that billed and returned no usage counted a floor, a read in parts charged only its parts,
a stop checked after the spend with no reservation, and an exception charged nothing. This module is the one place
a call is priced and counted. It imports nothing of the program requirements code, so any model caller can use it.

The price table, the usage reader and one thread-safe Meter:

  usage   either shape the function passes back: Anthropic's (input_tokens, output_tokens and the cache fields)
          or the OpenAI shape xAI answers in (prompt_tokens, completion_tokens, total_tokens,
          completion_tokens_details.reasoning_tokens). Where two readings differ the larger is charged.
  price   at the model's rate; a model the table does not name reads None on its record (cost) and counts at the
          dearest rate in the table toward the stop (charge_for).
  Meter   reserve(estimate) before a call refuses when spent + in flight + estimate would pass the ceiling, and
          from then on the meter refuses every call (the caller sends nothing more); settle() releases the
          reservation and adds the charge in one lock block. A call that answered with usage counts its priced
          cost; one that was sent and answered no usage (a timeout, a cut-off, a 5xx after the send, an exception)
          counts its worst case, the request's size and the output cap at the dearest rate; one that never reached
          the model (a 400, 401, 413 or 429 with no usage, the function's caller check) counts $0.
"""
import json
import threading

# Dollars per million tokens, Claude Opus 5.5 (claude-api skill, cached 2026-09-25).
PRICE = {"claude-opus-5-5": {"input": 4.00, "output": 20.00, "cache_read": 0.20, "cache_write": 5.00}}

# A call's worst case, when it was sent and answered no usage. Every token is at least one character, so a request's
# characters bound its input tokens; the Edge Function adds its system prompt and schema, which together are shorter
# than its source file (chatbox/supabase/functions/program-requirements-extract/index.ts, 34,486 characters at
# S654), so 40,000 characters bound them. Its output cap is max_tokens 16,000 (index.ts, both readers), doubled for
# the reasoning tokens a reasoning model may bill beside it.
WORST_OVERHEAD_CHARS = 40000
WORST_OUTPUT_TOKENS = 32000
# HTTP answers given before any model call, when they carry no usage: the request was refused (400, 401, 403, 404,
# 405, 409, 413, 422) or rate-limited (429).
PRE_MODEL_STATUS = frozenset({400, 401, 403, 404, 405, 409, 413, 422, 429})


def _n(u: dict, key: str) -> float:
    v = u.get(key)
    return v if isinstance(v, (int, float)) and not isinstance(v, bool) and v > 0 else 0


def readings(usage) -> dict:
    """The token counts a usage carries, each reading of the output kept apart:
    {input, prompt, cache_read, cache_write, output}. output is the largest of output_tokens, completion_tokens,
    total_tokens - prompt_tokens, and completion_tokens + completion_tokens_details.reasoning_tokens."""
    u = usage if isinstance(usage, dict) else {}
    details = u.get("completion_tokens_details") if isinstance(u.get("completion_tokens_details"), dict) else {}
    prompt, completion = _n(u, "prompt_tokens"), _n(u, "completion_tokens")
    total = _n(u, "total_tokens")
    output = max(_n(u, "output_tokens"), completion, total - prompt if total else 0,
                 completion + _n(details, "reasoning_tokens"))
    return {"input": _n(u, "input_tokens"), "prompt": prompt, "cache_read": _n(u, "cache_read_input_tokens"),
            "cache_write": _n(u, "cache_creation_input_tokens"), "output": output}


def has_tokens(usage) -> bool:
    """Whether a usage reports any token at all."""
    r = readings(usage)
    return any(r[k] > 0 for k in r) or _n(usage if isinstance(usage, dict) else {}, "total_tokens") > 0


def usage_tokens(usage) -> tuple:
    """(input, output, cache read, cache write) tokens, input the larger of input_tokens with the cache fields
    and prompt_tokens."""
    r = readings(usage)
    return (max(r["input"] + r["cache_read"] + r["cache_write"], r["prompt"]), r["output"],
            r["cache_read"], r["cache_write"])


def price_at(rate: dict, usage) -> float:
    """The usage at one rate. Input is the larger reading: input_tokens and the cache fields at their rates, or
    prompt_tokens at the input rate (it counts cached tokens in)."""
    r = readings(usage)
    inp = max(r["input"] * rate["input"] + r["cache_read"] * rate["cache_read"]
              + r["cache_write"] * rate["cache_write"], r["prompt"] * rate["input"])
    return round((inp + r["output"] * rate["output"]) / 1e6, 5)


def dearest_rate() -> dict:
    """The dearest rate in the table, field by field."""
    return {f: max(p[f] for p in PRICE.values()) for f in ("input", "output", "cache_read", "cache_write")}


def price(model, usage):
    """A call's price at its model's rate, or None for a model the table does not name (the record's cost_usd)."""
    rate = PRICE.get(model or "")
    return price_at(rate, usage) if rate else None


def charge_for(model, usage) -> float:
    """What a call that answered with usage counts toward a stop: its price, an unlisted model's at the dearest
    rate."""
    p = price(model, usage)
    return p if p is not None else price_at(dearest_rate(), usage)


def worst_case(request_chars: int, model=None) -> float:
    """An upper bound on one sent call's cost: the request's characters and the function's prompt as input tokens,
    the output cap as output tokens, at the model's rate (the dearest when it is unknown or unlisted)."""
    rate = PRICE.get(model or "") or dearest_rate()
    return round(((max(0, int(request_chars)) + WORST_OVERHEAD_CHARS) * rate["input"]
                  + WORST_OUTPUT_TOKENS * rate["output"]) / 1e6, 5)


def reached_model(answer: dict) -> bool:
    """Whether an answer may have been billed: False for an HTTP refusal before any model call (PRE_MODEL_STATUS)
    and the function's caller check (503 with an upstream_* reason) when it carries no usage."""
    a = answer if isinstance(answer, dict) else {}
    if has_tokens(a.get("usage")):
        return True
    status = a.get("http_status")
    if status in PRE_MODEL_STATUS:
        return False
    if status == 503 and str(a.get("reason") or "").startswith("upstream_"):
        return False
    return True


def answer_charge(answer: dict, request_chars: int) -> float:
    """What one sent call counts: its priced usage; $0 when it never reached the model; otherwise its worst case."""
    a = answer if isinstance(answer, dict) else {}
    if has_tokens(a.get("usage")):
        return charge_for(a.get("model"), a.get("usage"))
    if not reached_model(a):
        return 0.0
    return worst_case(request_chars, a.get("model"))


def request_chars(body) -> int:
    """A request body's size in characters, as it is sent (json.dumps)."""
    return len(json.dumps(body))


class Ticket:
    __slots__ = ("estimate", "open")

    def __init__(self, estimate: float):
        self.estimate, self.open = estimate, True


class Meter:
    """The run's spend: charged calls, reservations in flight, and the ceiling (None: no stop, only counting)."""

    def __init__(self, ceiling=None, estimate: float = 0.0):
        self.ceiling = None if ceiling is None else float(ceiling)
        self.estimate = float(estimate)
        self._lock = threading.Lock()
        self.spent = 0.0
        self.in_flight = 0.0
        self.stopped = False
        self.refused = 0
        self.sent = 0

    def reserve(self, estimate=None):
        """A Ticket for one call, or None when the stop holds it: spent + in flight + estimate would pass the
        ceiling, or an earlier call was held. Once held, every later call is held."""
        est = self.estimate if estimate is None else float(estimate)
        with self._lock:
            if self.ceiling is not None and (self.stopped or self.spent + self.in_flight + est > self.ceiling + 1e-9):
                self.stopped = True
                self.refused += 1
                return None
            self.in_flight += est
            self.sent += 1
            return Ticket(est)

    def settle(self, ticket, charge: float) -> float:
        """Release the ticket's reservation and add the call's charge, in one lock block."""
        charge = max(0.0, float(charge or 0.0))
        with self._lock:
            if ticket is not None and ticket.open:
                ticket.open = False
                self.in_flight -= ticket.estimate
            self.spent += charge
        return charge

    def call(self, send, chars: int, estimate=None) -> dict:
        """One metered call: reserve, send() (which returns the function's answer), settle the answer's charge
        (answer_charge). An exception inside send() settles at the call's worst case and comes back as an error
        answer. A call the stop holds is never sent: {"stopped": True, "_sent": False, ...}. Every answer carries
        _charge_usd, what the meter counted for it."""
        ticket = self.reserve(estimate)
        if ticket is None:
            return {"record": None, "usage": None, "model": None, "stopped": True, "_sent": False,
                    "_charge_usd": 0.0,
                    "error": "the hard stop held this call: $%.2f charged and $%.2f in flight against $%.2f"
                             % (self.spent, self.in_flight, self.ceiling or 0)}
        try:
            got = send()
            if not isinstance(got, dict):
                got = {"error": "no answer", "record": None, "usage": None}
            charge = answer_charge(got, chars)
        except Exception as exc:
            got = {"record": None, "usage": None, "model": None,
                   "error": "exception: %s" % (str(exc).splitlines()[0][:200] if str(exc) else type(exc).__name__)}
            charge = worst_case(chars)
        self.settle(ticket, charge)
        return dict(got, _sent=True, _charge_usd=round(charge, 5))

    def snapshot(self) -> dict:
        with self._lock:
            return {"ceiling_usd": self.ceiling, "estimate_usd": self.estimate, "charge_usd": round(self.spent, 5),
                    "in_flight_usd": round(self.in_flight, 5), "stopped": self.stopped, "sent": self.sent,
                    "refused": self.refused}
