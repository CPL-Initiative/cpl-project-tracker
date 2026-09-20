#!/usr/bin/env python3
"""The TypeSafe (Jev) wire contract holds, and the key never leaks.

⚠️ EVERY CHECK HERE GUARDS A FAILURE THAT IS SILENT. A wrong env var name does
not raise — it reports "no key configured" while a perfectly good secret sits
in the repo unread. A key echoed into an error body does not raise either; it
just lands in an Actions log that anyone who can read the repo can read.

The contract was read off @typesafe-ai/sdk@0.6.0's published dist, because
docs.typesafe.ai is egress-blocked from the agent sandbox. That makes it the
kind of fact a later session cannot re-check casually, so it is pinned here.
A web-search summary claimed the variable was TYPESAFE_AI_API_KEY; the SDK says
TYPESAFE_API_KEY. Check 1 is what stops that correction from being "helpfully"
applied.

Pure stdlib, no network. Run: python3 tests/typesafe_client_test.py
"""

import io
import json
import os
import re
import sys
import urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))

import typesafe_client as tc  # noqa: E402

FAILURES = []


def check(label, condition, detail=""):
    if condition:
        print(f"  ✅ {label}")
    else:
        print(f"  ❌ {label}{(' — ' + detail) if detail else ''}")
        FAILURES.append(label)


# ── 1. The env var names are exactly the SDK's ───────────────────────────────
print("1. Environment variable names match @typesafe-ai/sdk src/env.ts")
check("api_key is TYPESAFE_API_KEY", tc.ENV["api_key"] == "TYPESAFE_API_KEY",
      f"got {tc.ENV['api_key']}")
check("base_url is TYPESAFE_BASE_URL", tc.ENV["base_url"] == "TYPESAFE_BASE_URL")
check("default_model is TYPESAFE_DEFAULT_MODEL",
      tc.ENV["default_model"] == "TYPESAFE_DEFAULT_MODEL")
check("defaults are api.typesafe.ai / jev-latest",
      tc.DEFAULT_BASE_URL == "https://api.typesafe.ai" and tc.DEFAULT_MODEL == "jev-latest")

# ── 2. The workflow reads the same secret this module reads ──────────────────
print("\n2. Workflow and module agree on the secret name (drift guard)")
wf_path = os.path.join(ROOT, ".github", "workflows", "typesafe-smoke.yml")
wf = open(wf_path, encoding="utf-8").read()
check("workflow maps the env var to a secret of the same name",
      re.search(r"TYPESAFE_API_KEY:\s*\$\{\{\s*secrets\.TYPESAFE_API_KEY\s*\}\}", wf) is not None)
check("workflow is workflow_dispatch only (a PR trigger would leak the secret to forks)",
      "workflow_dispatch" in wf and not re.search(r"^\s*pull_request:", wf, re.M))

# ── 3. Question constructors serialize as the API expects ────────────────────
print("\n3. Question shapes")
check("noul", tc.noul("Is this billing?") ==
      {"type": "noul", "instructions": "Is this billing?", "criteria": None})
check("choice keeps its label map",
      tc.choice("Which?", {"a": None, "b": "second"})["criteria"] == {"a": None, "b": "second"})
check("score keeps its ordered rubric",
      tc.score("How bad?", ["fine", "bad"])["criteria"] == ["fine", "bad"])

# The two shapes are easy to swap, and the API rejects the swap — locally is a
# cheaper place to find out than a spent API call.
try:
    tc.choice("Which?", ["a", "b"])
    check("choice rejects a list", False, "no error raised")
except tc.TypeSafeError:
    check("choice rejects a list", True)
try:
    tc.score("How bad?", {"a": "x"})
    check("score rejects a map", False, "no error raised")
except tc.TypeSafeError:
    check("score rejects a map", True)
try:
    tc.validate_questions({})
    check("empty question set rejected", False, "no error raised")
except tc.TypeSafeError:
    check("empty question set rejected", True)
try:
    tc.validate_questions({"q": tc.score("x", ["only-one"])})
    check("score with a 1-entry rubric rejected", False, "no error raised")
except tc.TypeSafeError:
    check("score with a 1-entry rubric rejected", True)

# ── 4. A missing key fails loudly and names the variable ─────────────────────
print("\n4. Missing key")
saved = os.environ.pop("TYPESAFE_API_KEY", None)
try:
    tc.TypeSafeClient()
    check("missing key raises", False, "no error raised")
except tc.TypeSafeAuthError as e:
    check("missing key raises TypeSafeAuthError naming the variable",
          "TYPESAFE_API_KEY" in str(e))
os.environ["TYPESAFE_API_KEY"] = "   "
try:
    tc.TypeSafeClient()
    check("blank key treated as absent", False, "no error raised")
except tc.TypeSafeAuthError:
    check("blank key treated as absent", True)
if saved is not None:
    os.environ["TYPESAFE_API_KEY"] = saved
else:
    os.environ.pop("TYPESAFE_API_KEY", None)

# ── 5. The request is built the way the API expects ──────────────────────────
print("\n5. Request construction (urlopen stubbed — no network)")
SECRET = "sk-test-SUPERSECRET-abcdef123456"
captured = {}


def fake_urlopen(req, timeout=None, context=None):
    captured["url"] = req.full_url
    captured["method"] = req.get_method()
    captured["headers"] = {k.lower(): v for k, v in req.header_items()}
    captured["body"] = json.loads(req.data.decode()) if req.data else None

    class R:
        def read(self_inner):
            return json.dumps({"answers": {"tense": {"choice": "past"}}}).encode()
        def __enter__(self_inner):
            return self_inner
        def __exit__(self_inner, *a):
            return False
    return R()


real_urlopen = tc.urllib.request.urlopen
tc.urllib.request.urlopen = fake_urlopen
try:
    client = tc.TypeSafeClient(api_key=SECRET)
    out = client.system_one(state="s", questions={"tense": tc.choice("?", {"past": None})})
    check("POSTs to /v1/systemone", captured["url"] == "https://api.typesafe.ai/v1/systemone"
          and captured["method"] == "POST")
    check("sends Authorization: Bearer <key>",
          captured["headers"].get("Authorization".lower()) == "Bearer " + SECRET)
    check("body carries state, questions and model",
          set(captured["body"]) == {"state", "questions", "model"}
          and captured["body"]["model"] == "jev-latest")
    check("response parsed", out["answers"]["tense"]["choice"] == "past")

    # ── 6. The key is scrubbed from error output ─────────────────────────────
    print("\n6. Key redaction (the Actions-log leak)")

    def echoing_500(req, timeout=None, context=None):
        raise urllib.error.HTTPError(
            req.full_url, 500, "Server Error", {},
            io.BytesIO(f'{{"error":"bad token {SECRET}"}}'.encode()))

    tc.urllib.request.urlopen = echoing_500
    try:
        tc.TypeSafeClient(api_key=SECRET, attempts=1).models()
        check("error raised", False, "no error")
    except tc.TypeSafeError as e:
        msg = str(e)
        check("key absent from the error message", SECRET not in msg, "KEY LEAKED")
        check("key prefix absent too", SECRET[:8] not in msg, "PREFIX LEAKED")
        check("redaction marker present", "<redacted>" in msg, msg[:120])

    # 401 is an auth error and is never retried.
    def unauthorized(req, timeout=None, context=None):
        raise urllib.error.HTTPError(req.full_url, 401, "Unauthorized", {}, io.BytesIO(b"{}"))

    tc.urllib.request.urlopen = unauthorized
    try:
        tc.TypeSafeClient(api_key=SECRET, attempts=3).models()
        check("401 raises", False, "no error")
    except tc.TypeSafeAuthError:
        check("401 raises TypeSafeAuthError (and is not retried)", True)
    check("401/403 are excluded from the retry list",
          401 not in tc.RETRY_CODES and 403 not in tc.RETRY_CODES)
finally:
    tc.urllib.request.urlopen = real_urlopen

print("\n" + ("=" * 62))
if FAILURES:
    print(f"❌ {len(FAILURES)} check(s) failed:")
    for f in FAILURES:
        print(f"   · {f}")
    sys.exit(1)
print("✅ All TypeSafe client checks passed.")
