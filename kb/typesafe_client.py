#!/usr/bin/env python3
"""TypeSafe (Jev) System One client — the ONE place the API key is read.

Jev is TypeSafe's first "System One" model: it answers small, typed questions
about a piece of state and returns a structured answer rather than prose. Three
question shapes exist, and the API has exactly one endpoint for all of them.

⚠️ NO USE CASE IS WIRED YET (Session 279). This module is the plumbing Sam asked
for, plus the smoke test that proves the key resolves. Before pointing Jev at
MAP data, read docs/reference/typesafe_jev.md — sending course, credential or
articulation text to a third-party API is a new outbound surface, and the
governance gate there is the point.

⚠️ THE CONTRACT BELOW WAS READ OFF THE PUBLISHED SDK, NOT OFF THE DOCS.
`docs.typesafe.ai` is egress-blocked from the agent sandbox (the gateway 403s
CONNECT), so it cannot be consulted from a session. Everything here —
the env var names, `Authorization: Bearer`, the `/v1/systemone` path, the
`{state, questions, model}` body, the `noul`/`choice`/`score` discriminators —
was extracted from @typesafe-ai/sdk@0.6.0's dist on registry.npmjs.org, which
IS reachable. Re-verify against a newer SDK before assuming it still holds; a
search-result summary claimed the key was `TYPESAFE_AI_API_KEY`, and the SDK
says otherwise. A wrong variable name fails silently as "no key configured".

Pure stdlib, matching the rest of kb/. No `requests` dependency.

Naming: no leading underscore because this is an IMPORTABLE module in the sense
kb/alias_chain.py is — import it, never copy it. The kb/_typesafe_smoke.py
script is the underscore-prefixed caller.
"""

import json
import os
import ssl
import time
import urllib.error
import urllib.request

__all__ = [
    "ENV", "DEFAULT_BASE_URL", "DEFAULT_MODEL",
    "noul", "choice", "score", "validate_questions",
    "TypeSafeClient", "TypeSafeError", "TypeSafeAuthError",
]

# Environment variable names, verbatim from the SDK's src/env.ts. Explicit
# constructor arguments take precedence over all of these.
ENV = {
    "api_key": "TYPESAFE_API_KEY",
    "base_url": "TYPESAFE_BASE_URL",
    "default_model": "TYPESAFE_DEFAULT_MODEL",
    "log_level": "TYPESAFE_LOG_LEVEL",
}

DEFAULT_BASE_URL = "https://api.typesafe.ai"
DEFAULT_MODEL = "jev-latest"
SYSTEM_ONE_PATH = "/v1/systemone"
MODELS_PATH = "/v1/models"

UA = "cpl-project-tracker/1.0 (+https://github.com/CPL-Initiative/cpl-project-tracker)"

# Transient HTTP codes worth a retry. 401/403 are deliberately absent: a bad key
# does not become a good key on the second attempt, and retrying an auth failure
# just triples the time to the error message that actually tells you what broke.
RETRY_CODES = (429, 500, 502, 503, 504)


class TypeSafeError(RuntimeError):
    """Any failure talking to TypeSafe."""


class TypeSafeAuthError(TypeSafeError):
    """The key is missing, malformed or rejected (401/403)."""


# ── Question constructors ────────────────────────────────────────────────────
# Serialization matches the SDK's src/questions.ts exactly. The argument
# validation is copied deliberately: the API rejects these shapes too, but
# failing locally costs nothing and names the problem in the caller's terms.

def noul(instructions=None, criteria=None):
    """A yes/no question. `criteria` optionally describes the yes and no outcomes."""
    return {"type": "noul", "instructions": instructions, "criteria": criteria}


def choice(instructions, criteria):
    """Select between named alternatives.

    `criteria` maps labels to descriptions; a label may map to None when it
    needs no description. A LIST is rejected — that is the score shape.
    """
    if isinstance(criteria, (list, tuple)):
        raise TypeSafeError(
            "Choice criteria must be a map of labels to descriptions, not a list.")
    return {"type": "choice", "instructions": instructions, "criteria": criteria}


def score(instructions, criteria):
    """Score against an ordered rubric.

    `criteria` is a LIST of descriptions indexed by score from zero, at least
    two long; entries may be None. A MAP is rejected — that is the choice shape.
    """
    if not isinstance(criteria, (list, tuple)):
        raise TypeSafeError(
            "Score criteria must be a list of descriptions indexed by score "
            "from zero, not a map.")
    return {"type": "score", "instructions": instructions, "criteria": list(criteria)}


def validate_questions(questions):
    """Reject empty question sets and score questions without a 2+ rubric."""
    if not questions:
        raise TypeSafeError("At least one question is required.")
    for name, question in questions.items():
        if question.get("type") != "score":
            continue
        criteria = question.get("criteria")
        if not isinstance(criteria, (list, tuple)) or len(criteria) < 2:
            raise TypeSafeError(
                f"Score question {name!r} needs a list of at least two criteria.")
    return questions


class TypeSafeClient:
    """Thin System One client.

    The key is read from the environment once, held privately, and scrubbed out
    of every error this class raises. It is never printed, never logged and
    never placed in a URL — only in the Authorization header.
    """

    def __init__(self, api_key=None, base_url=None, default_model=None,
                 timeout=30, attempts=3):
        self._api_key = api_key or _read_env(ENV["api_key"])
        if not self._api_key:
            raise TypeSafeAuthError(
                f"No TypeSafe API key. Set {ENV['api_key']} in the environment. "
                "In GitHub Actions that is `${{ secrets.TYPESAFE_API_KEY }}`; "
                "see docs/reference/typesafe_jev.md.")
        self.base_url = (base_url or _read_env(ENV["base_url"]) or DEFAULT_BASE_URL).rstrip("/")
        self.default_model = default_model or _read_env(ENV["default_model"]) or DEFAULT_MODEL
        self.timeout = timeout
        self.attempts = attempts

    def system_one(self, state, questions, model=None):
        """POST /v1/systemone. Returns the parsed response dict.

        `state` is the thing being judged — a string, or a JSON-shaped dict.
        `questions` maps a caller-chosen name to a question constructor's output;
        the answer comes back under that same name in `response["answers"]`.
        """
        validate_questions(questions)
        body = {"state": state, "questions": questions,
                "model": model or self.default_model}
        return self._request("POST", SYSTEM_ONE_PATH, body)

    def models(self):
        """GET /v1/models — the cheapest authenticated call, so the smoke test
        can prove a key works without spending a System One request."""
        return self._request("GET", MODELS_PATH, None)

    def _request(self, method, path, body):
        url = self.base_url + path
        data = json.dumps(body).encode("utf-8") if body is not None else None
        headers = {
            "Authorization": "Bearer " + self._api_key,
            "Accept": "application/json",
            "User-Agent": UA,
        }
        if data is not None:
            headers["Content-Type"] = "application/json"
        ctx = ssl.create_default_context()
        last = None
        for i in range(self.attempts):
            req = urllib.request.Request(url, data=data, headers=headers, method=method)
            try:
                with urllib.request.urlopen(req, timeout=self.timeout, context=ctx) as r:
                    raw = r.read().decode("utf-8")
                return json.loads(raw) if raw else {}
            except urllib.error.HTTPError as e:
                detail = _redact(_safe_read(e), self._api_key)
                if e.code in (401, 403):
                    raise TypeSafeAuthError(
                        f"TypeSafe rejected the key (HTTP {e.code}). {detail}") from None
                last = TypeSafeError(f"TypeSafe HTTP {e.code} on {method} {path}. {detail}")
                if e.code not in RETRY_CODES:
                    raise last from None
            except urllib.error.URLError as e:
                # Egress blocks land here: the sandbox gateway refuses CONNECT to
                # api.typesafe.ai, so a session sees this rather than an HTTP code.
                last = TypeSafeError(
                    f"Cannot reach {self.base_url} ({_redact(str(e.reason), self._api_key)}). "
                    "The agent sandbox is egress-blocked for typesafe.ai — run this "
                    "on a GitHub Actions runner instead (runner-as-proxy pattern).")
            except json.JSONDecodeError as e:
                raise TypeSafeError(f"TypeSafe returned non-JSON on {method} {path}: {e}") from None
            if i < self.attempts - 1:
                time.sleep(2 * (i + 1))
        raise last


def _read_env(name):
    """Trimmed env read; blank is the same as absent (matches the SDK)."""
    value = os.environ.get(name)
    return value.strip() if value and value.strip() else None


def _safe_read(err):
    try:
        return err.read().decode("utf-8", "replace")[:400]
    except Exception:
        return ""


def _redact(text, secret):
    """Scrub the key out of anything headed for a log, a traceback or CI output.

    An API echoed back in an error body is the classic way a secret reaches a
    public Actions log, and this repo's Actions logs are readable by anyone who
    can read the repo.
    """
    if not text or not secret:
        return text or ""
    out = text.replace(secret, "<redacted>")
    if len(secret) > 8:
        out = out.replace(secret[:8], "<redacted>")
    return out
