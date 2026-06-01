---
title: Playbook — Pre-stage optional auth before an external API enforces it
type: playbook
kb-status: published
created: 2026-06-01
updated: 2026-06-01
session: 27
tags: [playbook, auth, external-api, github-actions, secrets, map, resilience]
related:
  - "[[docs/map_api_auth_handoff.md]]"
  - "[[docs/kb-notes/reference-daily-dashboard-data-pipeline.md]]"
---

# Playbook — Pre-stage optional auth before an external API enforces it

## When this applies
An upstream API you depend on is **currently open** but is **about to add auth**
(e.g. MAP adding user auth to the Custom Report Builder that
`fetch_custom_report.py` hits unauthenticated). You don't yet have the credential,
and you don't know the exact scheme. Get ahead of the cutover so go-live day is
"paste a secret," not "scramble while the daily job is broken."

## The pattern: an optional, no-op-until-set credential header
Wire the auth path **now**, sourced from env/secrets, so it's **a no-op until the
credential exists** and the current open-endpoint behavior is unchanged.

1. **Read the credential + its shape from env at call time** (don't hardcode the
   scheme — you don't know it yet). Three vars cover the common cases:
   - `X_API_KEY` — the credential. **Absent → attach no auth header** (today's behavior).
   - `X_API_AUTH_HEADER` — header name (default `Authorization`; override for Azure
     APIM `Ocp-Apim-Subscription-Key`, or `x-api-key`).
   - `X_API_AUTH_SCHEME` — prefix (default `Bearer`; set `""` for a raw key value).
   ```python
   def _build_headers():
       headers = {"Content-Type": "application/json"}
       key = os.environ.get("X_API_KEY", "").strip()
       if key:
           name = os.environ.get("X_API_AUTH_HEADER", "").strip() or "Authorization"
           scheme = os.environ.get("X_API_AUTH_SCHEME", "Bearer").strip()
           headers[name] = (scheme + " " + key).strip() if scheme else key
       return headers
   ```
2. **Pass the (not-yet-existing) secrets through the workflow.** Referencing an
   undefined GitHub Actions secret resolves to an **empty string** (not an error),
   so this is inert until the secret is created:
   ```yaml
   env:
     X_API_KEY: ${{ secrets.X_API_KEY }}
     X_API_AUTH_HEADER: ${{ secrets.X_API_AUTH_HEADER }}
     X_API_AUTH_SCHEME: ${{ secrets.X_API_AUTH_SCHEME }}
   ```
3. **Unit-test the header logic** across unset (no-op) + each scheme (Bearer / APIM
   raw / x-api-key) — no network needed.
4. **Write the provider a spec sheet** with the exact call (endpoint, method,
   headers-today, body, response, caller) and the **one ask**: a **non-interactive
   service credential** (API key / OAuth client-credentials) — automation can't do
   interactive/SSO/MFA login. Ask *which* scheme + header they'll issue.

## Activation (when the provider replies)
Pick the matching case and set repo secrets — **no code change**:
- **Bearer token:** `X_API_KEY=<token>` (defaults send `Authorization: Bearer …`).
- **Azure APIM:** `X_API_KEY=<key>`, `X_API_AUTH_HEADER=Ocp-Apim-Subscription-Key`,
  `X_API_AUTH_SCHEME=` (empty).
- **`x-api-key`:** `X_API_KEY=<key>`, `X_API_AUTH_HEADER=x-api-key`, `X_API_AUTH_SCHEME=`.
Then **`workflow_dispatch` once** to confirm the authenticated call succeeds before
the provider removes the open path.

## Gotchas
- **Enumerate the data sources.** A provider's auth rollout may span *multiple
  hosts*. (Our pipeline reads MAP from **two** Azure hosts — the CustomReport API
  and the `potential-savings` KPI endpoint via a Cloudflare Worker. Flag both; the
  Worker-side one is a separate Cloudflare change.)
- **Read env at call-time, not import-time**, so a test (or a late-set secret) is
  picked up and the function stays unit-testable.
- This is pure resilience prep — it changes **nothing** about the live run until a
  secret is created, so it merges on green with zero risk.
