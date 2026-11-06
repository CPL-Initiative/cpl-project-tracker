---
title: Refresh the access token before every write (don't trust a format-valid JWT)
kb-status: published
created: 2026-06-26
updated: 2026-11-06
tags: [methodology, supabase, auth, jwt, magic-link, raci, debugging, session-keeper]
related: ["[[docs/cobi_raci_nudge_lessons]]", "[[CLAUDE]]"]
---

# Refresh the access token before every write

## The trap
A Supabase magic-link session stores `{access_token, refresh_token, exp}`. The access token expires
(~1 hour); the `refresh_token` renews it. A tab that gates writes on the *format* of the access token
(`/^[\w-]+\.[\w-]+\.[\w-]+$/`) — but never checks `exp` or refreshes — will keep showing "Signed in"
long after the token is dead. Every write then **401s silently**, and if the UI updates optimistically
(paints the change before the POST resolves), the user sees a phantom "save" that never reached the DB.

This bit the RACI tab on 2026-06-26: a curator assigned people for an hour; only the **first** write
(pre-expiry) had actually persisted. `raci.js` validated the JWT format but, unlike `unified_courses.js`,
never refreshed it.

## Diagnosis tell
**The database has far fewer rows than the user believes they saved.** When "saves don't persist,"
query the table for the affected keys *first* — if writes are landing for some keys but not others
(especially early-session vs late-session), suspect **auth/token expiry**, not the write logic. A
healthy write path that 401s is invisible without this check because the optimistic UI lies.

## The fix (pattern)
Make the write helper **refresh-gated** — renew before the request, never inside the optimistic paint:

```js
function ensureFresh() {
  var s = state.sess;
  if (!s) return Promise.resolve(null);
  if (s.exp && s.exp <= Date.now() + 60000 && s.refresh_token) {     // expired/near-expiry + renewable
    return refreshToken(s.refresh_token).then(function (tok) {
      s = { access_token: tok.access_token, refresh_token: tok.refresh_token || s.refresh_token,
            email: s.email, exp: Date.now() + (parseInt(tok.expires_in || "3600", 10) * 1000) };
      state.sess = s; sessionStorage.setItem("cpl_sb", JSON.stringify(s));
      return s;
    }).catch(function () {                 // refresh failed → drop the dead session so UI flips to "Sign in"
      state.sess = null; sessionStorage.removeItem("cpl_sb"); return null;
    });
  }
  return Promise.resolve(s);
}
function sbWrite(method, path, body, prefer) {
  return ensureFresh().then(function (s) {
    return fetch(URL + "/rest/v1/" + path, { method: method, body: JSON.stringify(body),
      headers: { apikey: ANON, "Content-Type": "application/json",
                 Authorization: "Bearer " + ((s && s.access_token) || ""), Prefer: prefer } });
  });
}
```
`refreshToken(rt)` = `POST /auth/v1/token?grant_type=refresh_token {refresh_token}`.

Two more guardrails that turn a silent failure into a visible one:
1. **`getSession()` keeps a session that's expired but holds a `refresh_token`** (so the tab self-heals
   instead of dropping to anonymous), and discards a garbled/unrenewable one.
2. **Roll back optimistic state on a non-OK response** — don't leave a change that didn't persist looking
   saved: `var prev = state[key]; state[key] = next; … if (!r.ok) { state[key] = prev; throw … }`.

## Where it lives
`raci.js` (Session 77, PR #559) and `unified_courses.js` (the original, lines ~63–82). When you add a new
authed-write surface, copy the `ensureFresh` + refresh-gated `sbWrite` + rollback trio — don't re-derive
a format-only check.

> **2026-07-07 adoption — credential_reference.js (CER).** The CER carried this
> exact bug for another month after raci.js was fixed: its triage worklist +
> Curate writes trusted the init-time `state.sess` snapshot, so ~1h after
> sign-in every save died into a silent "retry" ("the tab stopped working",
> Sam's triage session). Ported the trio as `withFreshSession()` around all 5
> write fns, **plus one refinement worth copying: SINGLE-FLIGHT the refresh** —
> the worklist saves two rows in a `Promise.all`, and two parallel
> refresh-token exchanges on the same GoTrue token can kill the session.
> Guard: `tests/cer_token_refresh.test.js`. Remaining known holder of the
> pattern-without-refresh: none found (unified_courses.js has its own rolling
> refresh; raci.js and CER now both ensureFresh).

## The draw-time half (2026-11-06)

Renewing before a write is half the rule. A page that decides "is a reviewer signed in?" once, when it draws, and
checks a strict expiry, reads a lapsed token as signed out and keeps that answer until a reload, even though the shared
keeper (`cpl_session.js`) renews the token a second later and the header reads *Signed in*. Two places it bit on one
day: the CPL Commons hid **Mark done** and never read a reviewer's done marks, so a decision Sam had marked done on
another tab stayed waiting; COCI Lookup (Courses and Programs) hid its save controls. The fix has two parts, and a
surface needs both:

- **Draw on a renewable session**: an email and either a fresh token or a refresh token. The save still renews first
  and then asks for a fresh one, so a renewal that fails surfaces at the save, where a message can say so.
- **Redraw on the keeper's announcement** (`cpl-session-changed`, fired after every renewal and sign-in). A surface that
  listens recovers without a reload; one that does not stays wrong until the person reloads, which hides the cause.

Diagnosis tell: the header says *Signed in* while one panel offers only a sign-in line, and a reload fixes it.

