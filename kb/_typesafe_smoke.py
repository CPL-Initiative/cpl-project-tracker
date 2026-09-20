#!/usr/bin/env python3
"""TypeSafe (Jev) — verify the key, and the one place the wire format lives.

Jev is TypeSafe's "System One" model: it answers small typed questions about a
piece of state and returns a structured answer with a calibrated probability.

WHY A RUNNER: typesafe.ai is egress-blocked from the agent sandbox (the gateway
answers 403 to CONNECT on api./docs./apex), so a Claude session cannot call Jev
or read its docs. A GitHub Actions runner has open egress and stands in as the
proxy — the same pattern map-users-schema-probe.yml uses for the Azure MAP API.

⚠️ THE CONTRACT BELOW WAS READ OFF @typesafe-ai/sdk@0.6.0's PUBLISHED DIST, not
the docs, because registry.npmjs.org is reachable and docs.typesafe.ai is not.
Verified live on a runner 2026-09-20: models → jev-latest, jev-preview; one
systemone call answered correctly. A web-search summary claimed the key variable
was TYPESAFE_AI_API_KEY; it is TYPESAFE_API_KEY, and the wrong name fails
silently as "no key configured".

    TYPESAFE_API_KEY        the key (required)
    TYPESAFE_BASE_URL       default https://api.typesafe.ai
    TYPESAFE_DEFAULT_MODEL  default jev-latest

    POST /v1/systemone   {state, questions, model} -> {answers: {<name>: ...}}
    GET  /v1/models
    Authorization: Bearer <key>

Question shapes — `criteria` is what distinguishes them, and swapping the two
container types is the easy mistake:
    noul(instructions, criteria=None)   yes/no; criteria keys are "true"/"false"
    choice(instructions, criteria)      criteria is a MAP  label -> description
    score(instructions, criteria)       criteria is a LIST, >= 2, indexed from 0

⚠️ ANSWER SHAPES — A NOUL IS A PROBABILITY, NOT A BOOLEAN (docs.typesafe.ai,
read 2026-09-20 once egress was opened):
    noul   -> {"type":"noul",   "noul": 0.99}    float 0..1, NO confidence field
    choice -> {"type":"choice", "choice": "<label>", "confidence": 0.0..1.0}
    score  -> {"type":"score",  "score": <int>,     "confidence": 0.0..1.0}
"A Noul answer is a single number representing the probability that the answer
is yes... The number is the answer and the certainty in one." Reading it as a
bool costs you the whole result silently: `answer is True` is False for every
float, so a caller reports zero hits whatever the model said.

Usage:
    python3 kb/_typesafe_smoke.py           # auth + model list
    python3 kb/_typesafe_smoke.py --full    # also spend one System One call

Exit: 0 pass · 1 failure · 2 no key. Pure stdlib.
"""

import json
import os
import ssl
import sys
import urllib.error
import urllib.request

BASE = os.environ.get("TYPESAFE_BASE_URL", "").strip() or "https://api.typesafe.ai"
MODEL = os.environ.get("TYPESAFE_DEFAULT_MODEL", "").strip() or "jev-latest"


def noul(instructions=None, criteria=None):
    return {"type": "noul", "instructions": instructions, "criteria": criteria}


def choice(instructions, criteria):
    return {"type": "choice", "instructions": instructions, "criteria": criteria}


def score(instructions, criteria):
    return {"type": "score", "instructions": instructions, "criteria": list(criteria)}


def call(path, key, body=None, method="GET", timeout=30):
    """One request. The key goes in the header only, and is scrubbed from any
    error text — this repo's Actions logs are readable by anyone who can read
    the repo, and an API that echoes your token back is how it would leak."""
    data = json.dumps(body).encode() if body is not None else None
    headers = {"Authorization": "Bearer " + key, "Accept": "application/json"}
    if data:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout,
                                    context=ssl.create_default_context()) as r:
            raw = r.read().decode()
        return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")[:300].replace(key, "<redacted>")
        raise SystemExit(f"❌ TypeSafe HTTP {e.code} on {method} {path}. {detail}")
    except urllib.error.URLError as e:
        raise SystemExit(
            f"❌ Cannot reach {BASE} ({e.reason}). The agent sandbox is egress-blocked "
            "for typesafe.ai — run this on a GitHub Actions runner instead.")


def system_one(state, questions, key, model=None):
    """The entry point real work should use. Returns the parsed response."""
    return call("/v1/systemone", key, {"state": state, "questions": questions,
                                       "model": model or MODEL}, method="POST")


def main():
    key = (os.environ.get("TYPESAFE_API_KEY") or "").strip()
    if not key:
        print("❌ TYPESAFE_API_KEY is not set (or is blank).")
        print("   Add it under Settings > Secrets and variables > Actions, then")
        print("   reference it as `${{ secrets.TYPESAFE_API_KEY }}` in the job env.")
        return 2

    raw = os.environ["TYPESAFE_API_KEY"]
    # Length only, never the value. A pasted trailing newline is the usual cause
    # of a key that "is set" and still 401s, and length is what reveals it.
    print(f"✅ TYPESAFE_API_KEY present — {len(raw)} chars"
          f"{' ⚠️ has surrounding whitespace' if raw != key else ''}")
    print(f"   base URL: {BASE}\n   model:    {MODEL}")

    models = call("/v1/models", key)
    items = models.get("data") or models.get("models") or [] if isinstance(models, dict) else models
    names = [i.get("id") or i.get("name") if isinstance(i, dict) else str(i) for i in items]
    print(f"✅ GET /v1/models → {len(names)} model(s): {', '.join(n for n in names if n)}")

    if "--full" not in sys.argv:
        print("\n✅ Auth verified. Re-run with --full to spend one System One call.")
        return 0

    # Deliberately about nothing in our data: this proves the round trip, and no
    # MAP content goes out before the first real use is agreed.
    out = system_one(
        "The Chancellor's Office allocated the funding in August.",
        {"tense": choice("Is this sentence in the past or the future?",
                         {"past": "It already happened.",
                          "future": "It has yet to happen."})},
        key)
    answer = (out.get("answers") or {}).get("tense") or {}
    print(f"✅ POST /v1/systemone → answers.tense.choice = {answer.get('choice')!r}")
    if answer.get("choice") != "past":
        print(f"   ⚠️ Expected 'past'. Full answer: {answer}")
    print("\n✅ End-to-end verified — the key works and Jev answers.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
