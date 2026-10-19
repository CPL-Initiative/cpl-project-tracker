#!/usr/bin/env python3
"""xAI (Grok) smoke test: is the XAI_API_KEY repository secret present, and does xAI's API accept it?

Sam, Open Asks Sheet 97 card 1 (2026-10-19 03:11Z, his own call): build a second reader with
xAI's Grok over the harvest records that fail a machine check. The reader waits on one thing a
session cannot do: the key, which Sam creates under Settings > Secrets and variables > Actions as
XAI_API_KEY. This script is how a runner verifies it, the way kb/_typesafe_smoke.py verifies Jev's.

WHY A RUNNER: api.x.ai is reached from a GitHub Actions runner, never from the agent sandbox,
whose proxy refuses the host. .github/workflows/xai-smoke.yml dispatches this.

THE KEY NEVER REACHES THE LOG: presence and length are printed, nothing else, and the key is
scrubbed from any error body before it is raised. This repo's Actions logs are readable by anyone
who can read the repo.

THE MODEL IS NEVER GUESSED: the one System call (--full) uses XAI_MODEL when the workflow passes
one, else the first model the API lists. A guessed model id fails with a 404 that reads like a bad
key; the list is the authority.

The wire contract, from xAI's OpenAI-compatible API:
    GET  /v1/models                         -> {"data": [{"id": ...}, ...]}
    POST /v1/chat/completions {model, messages} -> {"choices": [{"message": {"content": ...}}]}

Usage:
    python3 kb/_xai_smoke.py           # auth + model list
    python3 kb/_xai_smoke.py --full    # also spend one chat completion

Exit: 0 pass · 1 failure · 2 no key. Pure stdlib.
"""
import json
import os
import ssl
import sys
import urllib.error
import urllib.request

BASE = os.environ.get("XAI_BASE_URL", "").strip() or "https://api.x.ai"


def call(path, key, body=None, method="GET", timeout=60):
    """One request. The key goes in the header only, and is scrubbed from any error text."""
    data = json.dumps(body).encode() if body is not None else None
    headers = {"Authorization": "Bearer " + key, "Accept": "application/json"}
    if data:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=ssl.create_default_context()) as r:
            raw = r.read().decode()
        return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")[:300].replace(key, "<redacted>")
        raise SystemExit("xAI HTTP %s on %s %s. %s" % (e.code, method, path, detail))
    except urllib.error.URLError as e:
        raise SystemExit("Cannot reach %s (%s). The agent sandbox is egress-blocked for api.x.ai; "
                         "run this on a GitHub Actions runner instead." % (BASE, e.reason))


def model_ids(models):
    items = models.get("data") or models.get("models") or [] if isinstance(models, dict) else models
    return [i.get("id") or i.get("name") if isinstance(i, dict) else str(i) for i in items]


def complete(key, model, text, timeout=60):
    """One chat completion; returns the first choice's text."""
    out = call("/v1/chat/completions", key,
               {"model": model, "messages": [{"role": "user", "content": text}], "temperature": 0},
               method="POST", timeout=timeout)
    choices = out.get("choices") or []
    msg = (choices[0].get("message") or {}) if choices else {}
    return (msg.get("content") or "").strip()


def main():
    key = (os.environ.get("XAI_API_KEY") or "").strip()
    if not key:
        print("XAI_API_KEY is not set (or is blank).")
        print("   Create it under Settings > Secrets and variables > Actions, and")
        print("   reference it as ${{ secrets.XAI_API_KEY }} in the job env.")
        return 2
    raw = os.environ["XAI_API_KEY"]
    print("XAI_API_KEY present: %d chars%s" % (len(raw), " (has surrounding whitespace)" if raw != key else ""))
    print("   base URL: %s" % BASE)

    names = [n for n in model_ids(call("/v1/models", key)) if n]
    print("GET /v1/models: %d model(s): %s" % (len(names), ", ".join(names)))

    if "--full" not in sys.argv:
        print("\nAuth verified. Re-run with --full to spend one chat completion.")
        return 0

    model = (os.environ.get("XAI_MODEL") or "").strip() or (names[0] if names else "")
    if not model:
        print("No model to call: the list is empty and XAI_MODEL is unset.")
        return 1
    # Deliberately about nothing in our data: this proves the round trip, and no catalog text
    # goes out before the second reader is built and agreed.
    answer = complete(key, model, "The Chancellor's Office allocated the funding in August. "
                                  "Is that sentence about the past or the future? Answer with one word.")
    print("POST /v1/chat/completions (%s): %r" % (model, answer[:80]))
    if "past" not in answer.lower():
        print("   Expected a word naming the past. Full answer: %r" % answer[:300])
        return 1
    print("\nEnd-to-end verified: the key works and the model answers.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
