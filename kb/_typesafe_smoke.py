#!/usr/bin/env python3
"""Prove the TypeSafe (Jev) key works — without printing it.

WHY A RUNNER: typesafe.ai is egress-blocked from the agent sandbox (the gateway
answers 403 to CONNECT on api./docs./apex). A GitHub Actions runner has open
egress, so it stands in as the proxy — the same pattern
.github/workflows/map-users-schema-probe.yml uses for the Azure MAP API.

WHAT IT PRINTS: whether the key is present, its length, the models the account
can see, and — with --full — one real System One answer. The key itself never
reaches stdout; kb/typesafe_client.py redacts it from error bodies too, because
this repo's Actions logs are readable by anyone who can read the repo.

Usage:
    python3 kb/_typesafe_smoke.py            # auth + model list only
    python3 kb/_typesafe_smoke.py --full     # also spend one System One call

Exit codes: 0 pass · 1 failure · 2 no key configured.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from typesafe_client import (  # noqa: E402
    ENV, DEFAULT_BASE_URL, DEFAULT_MODEL,
    TypeSafeClient, TypeSafeError, TypeSafeAuthError, choice,
)


def main():
    full = "--full" in sys.argv

    raw = os.environ.get(ENV["api_key"])
    if not raw or not raw.strip():
        print(f"❌ {ENV['api_key']} is not set (or is blank).")
        print("   GitHub Actions: add it as a repository secret, then reference it")
        print("   as `${{ secrets.TYPESAFE_API_KEY }}` in the job's `env:` block.")
        print("   See docs/reference/typesafe_jev.md.")
        return 2

    # Length only — never the value. A trailing newline in a pasted secret is the
    # usual cause of a key that "is set" and still 401s, and length is what shows it.
    print(f"✅ {ENV['api_key']} present — {len(raw)} chars"
          f"{' ⚠️ has surrounding whitespace' if raw != raw.strip() else ''}")
    print(f"   base URL: {os.environ.get(ENV['base_url']) or DEFAULT_BASE_URL}")
    print(f"   model:    {os.environ.get(ENV['default_model']) or DEFAULT_MODEL}")

    try:
        client = TypeSafeClient()
    except TypeSafeAuthError as e:
        print(f"❌ {e}")
        return 2

    try:
        models = client.models()
    except TypeSafeAuthError as e:
        print(f"❌ Auth failed: {e}")
        return 1
    except TypeSafeError as e:
        print(f"❌ {e}")
        return 1

    names = _model_names(models)
    print(f"✅ GET /v1/models → {len(names)} model(s): {', '.join(names[:8]) or '(none listed)'}")

    if not full:
        print("\n✅ Auth verified. Re-run with --full to spend one System One call.")
        return 0

    # One real question, deliberately about nothing in our data — the point is to
    # prove the round trip, so no MAP content goes out before the governance gate
    # in docs/reference/typesafe_jev.md has been walked.
    try:
        response = client.system_one(
            state="The Chancellor's Office allocated the funding in August.",
            questions={
                "tense": choice(
                    "Is this sentence in the past or the future?",
                    {"past": "It already happened.", "future": "It has yet to happen."},
                )
            },
        )
    except TypeSafeError as e:
        print(f"❌ System One call failed: {e}")
        return 1

    answer = (response.get("answers") or {}).get("tense") or {}
    picked = answer.get("choice")
    print(f"✅ POST /v1/systemone → answers.tense.choice = {picked!r}")
    if picked != "past":
        print(f"   ⚠️ Expected 'past'. Full answer: {answer}")
    print("\n✅ End-to-end verified — the key works and Jev answers.")
    return 0


def _model_names(payload):
    """The list shape is unverified (the docs are egress-blocked), so read it
    defensively rather than assuming `data[].id` the way an OpenAI-shaped API
    would. A smoke test that crashes on an unexpected envelope reports nothing."""
    if isinstance(payload, dict):
        for key in ("data", "models"):
            items = payload.get(key)
            if isinstance(items, list):
                return [_name(i) for i in items]
        if payload:
            return [str(k) for k in payload.keys()]
    if isinstance(payload, list):
        return [_name(i) for i in payload]
    return []


def _name(item):
    if isinstance(item, dict):
        for key in ("id", "name", "model"):
            if item.get(key):
                return str(item[key])
        return "(unnamed)"
    return str(item)


if __name__ == "__main__":
    sys.exit(main())
