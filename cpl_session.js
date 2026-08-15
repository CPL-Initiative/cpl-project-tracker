/*
 * cpl_session.js — the shared reviewer-session KEEPER.
 *
 * WHY THIS EXISTS
 * ---------------
 * Sam, 2026-08-14, in one evening, three reports that looked like three bugs:
 *   • Admin  — dragged the menu, pressed Save, "save 400"
 *   • Sierra Training — "it says I'm not signed in, but I should be"
 *   • Common CR Reference — "Could not read the decisions table"
 * and then, having re-signed in: "now Sierra is allowing edits."
 *
 * One cause. A Supabase access token lives about an hour. `cpl_sb` carries
 * `exp` (MILLISECONDS — `Date.now() + expires_in * 1000`, minted by
 * unified_courses.js persistToken) and a `refresh_token` for renewing it
 * silently. THIRTEEN of the twenty-six modules that read that session check
 * only the token's SHAPE — three dot-separated parts, over 40 characters — so
 * an hour after signing in they still report "signed in" while every request
 * they send bears a dead token and comes back 401. The UI then renders that as
 * "not signed in" or "could not read", which sends the curator to re-enter a
 * credential that was never the problem, and re-signing in "fixes" it, which
 * hides the cause for the next person.
 *
 * ── A KEEPER, NOT A THIRTEENTH COPY ─────────────────────────────────────────
 * The obvious fix is to teach all thirteen to refresh. That is thirteen edits
 * to auth code, unverifiable outside a browser, and it leaves the same mistake
 * available to the next tab anyone writes.
 *
 * Instead this keeps the ONE thing they all read — `sessionStorage.cpl_sb` —
 * continuously fresh underneath them. Every module benefits, including the ones
 * this change does not touch, because they all parse the same key and it is
 * simply never stale when they look. A tab that already refreshes (raci.js,
 * unified_courses.js, tmc_builder.js …) keeps doing so and finds nothing to do.
 *
 * ── FAIL-SAFE: A REFRESH THAT DOES NOT ANSWER MUST NOT SIGN ANYONE OUT ──────
 * raci.js drops the session whenever a refresh rejects — including a network
 * blip, which signs a curator out for being briefly offline and loses whatever
 * they were about to write. Here a session is cleared ONLY when the auth server
 * definitively rejects the refresh token (400/401 — used, revoked, malformed).
 * Anything else (offline, DNS, 5xx, CORS, a timeout) leaves the session exactly
 * where it was and we try again on the next tick.
 *
 * ── NEVER DELETE ON READ ────────────────────────────────────────────────────
 * `read()` has no side effects. Existing getSession()s delete `cpl_sb` when it
 * fails their test, which means a single unlucky parse silently ends the
 * session. Deleting is a decision; it belongs with the code that learned the
 * credential is dead, not with the code that merely looked at it.
 *
 * Loaded EAGERLY in both HTMLs (Rule 4 — the two files stay identical). Every
 * consumer must still work when this file is absent: it improves a session, it
 * is never required to have one.
 */
(function () {
  "use strict";

  var SUPABASE_URL = "https://hvuwhnbuahrtptokpqfh.supabase.co";
  var SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dXdobmJ1YWhydHB0b2twcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzI0ODEsImV4cCI6MjA5MTE0ODQ4MX0.p0q-93iTM0GkF2z8_q7Vvl1tsX9SFGMM-W7Wdx7WfmM";
  var KEY = "cpl_sb";

  // Renew this far ahead of expiry. Comfortably longer than a slow round trip,
  // so a request is never sent on a token that dies mid-flight.
  var SKEW_MS = 5 * 60 * 1000;
  // How often to look. The check is a clock comparison and costs nothing; the
  // network call happens only inside the skew window, so this is ~12 refreshes
  // a day for someone who leaves the dashboard open.
  var TICK_MS = 60 * 1000;

  function isValidJwt(t) {
    return typeof t === "string" && t.split(".").length === 3 && t.length > 40;
  }

  /* Read WITHOUT side effects — see the header. Returns the stored session
   * whatever its freshness; judging it is a separate step, because "expired"
   * and "absent" are different states and only one of them is recoverable. */
  function read() {
    try {
      var s = JSON.parse(sessionStorage.getItem(KEY) || "null");
      if (s && isValidJwt(s.access_token)) return s;
    } catch (e) { /* private mode, or a garbled value */ }
    return null;
  }

  function write(s) {
    try { sessionStorage.setItem(KEY, JSON.stringify(s)); return true; }
    catch (e) { return false; }
  }

  function drop() {
    try { sessionStorage.removeItem(KEY); } catch (e) { /* ignore */ }
  }

  /* `exp` absent means an older session shape we cannot date. Treat it as fresh
   * rather than as expired: guessing "expired" would sign out someone whose
   * token is fine, which is the exact failure this file exists to end. */
  function isFresh(s, skewMs) {
    if (!s) return false;
    if (!s.exp) return true;
    return s.exp > Date.now() + (skewMs || 0);
  }

  function expiresInMs(s) {
    if (!s || !s.exp) return null;
    return s.exp - Date.now();
  }

  var inFlight = null;   // one refresh at a time; callers share the promise

  function exchange(refreshToken) {
    return fetch(SUPABASE_URL + "/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      headers: { apikey: SUPABASE_ANON, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    }).then(function (r) {
      if (r.ok) return r.json();
      // THE DISTINCTION THIS WHOLE FILE TURNS ON. 400/401 is the auth server
      // saying this refresh token will never work again — that session is over.
      // Any other status is the server or the network having a bad moment, and
      // a bad moment must not cost a curator their sign-in.
      var err = new Error("refresh " + r.status);
      err.rejected = (r.status === 400 || r.status === 401);
      throw err;
    });
  }

  /* Resolve to a usable session, renewing first if it is near expiry.
   * Resolves null when there is no session at all, or when the refresh token
   * was definitively rejected. NEVER rejects — callers treat null as
   * "signed out" and anything else as "go ahead". */
  function ensureFresh() {
    var s = read();
    if (!s) return Promise.resolve(null);
    if (isFresh(s, SKEW_MS)) return Promise.resolve(s);
    if (!s.refresh_token) {
      // Expired with no way to renew. This IS the end of the session, and
      // saying so is what lets the UI offer the sign-in control instead of
      // insisting the person is signed in while every read 401s.
      if (!isFresh(s, 0)) { drop(); announce(null); return Promise.resolve(null); }
      return Promise.resolve(s);   // inside the skew window but not yet dead
    }
    if (inFlight) return inFlight;

    inFlight = exchange(s.refresh_token).then(function (tok) {
      if (!tok || !isValidJwt(tok.access_token)) throw new Error("bad refresh payload");
      var ns = {
        access_token: tok.access_token,
        refresh_token: tok.refresh_token || s.refresh_token,
        email: s.email || null,
        exp: Date.now() + (parseInt(tok.expires_in || "3600", 10) * 1000),
      };
      write(ns);
      inFlight = null;
      announce(ns);
      return ns;
    }).catch(function (e) {
      inFlight = null;
      if (e && e.rejected) { drop(); announce(null); return null; }
      // Transient. Keep the session and hand back what we have — if it is still
      // inside its skew window the caller's request will succeed anyway, and if
      // it is not, one 401 is a far better outcome than a wrongful sign-out.
      return read();
    });
    return inFlight;
  }

  /* Tabs render their lock state at activation, so a session that changes
   * underneath them needs to say so. Named distinctly from the team-phrase
   * event: they are different credentials and a tab may care about only one. */
  function announce(sess) {
    try {
      window.dispatchEvent(new CustomEvent("cpl-session-changed", {
        detail: { signedIn: !!sess, email: sess ? sess.email : null },
      }));
    } catch (e) { /* CustomEvent unavailable — the keeper still works */ }
  }

  /* Headers for a Supabase REST call under this session. Offered as a
   * convenience for new code; nothing is obliged to use it, and every existing
   * caller keeps working untouched because the token they read is now fresh. */
  function authHeaders(extra) {
    var s = read();
    var h = {
      apikey: SUPABASE_ANON,
      Authorization: "Bearer " + ((s && s.access_token) || SUPABASE_ANON),
    };
    if (extra) for (var k in extra) h[k] = extra[k];
    return h;
  }

  var timer = null;
  function tick() { ensureFresh(); }

  function start() {
    if (timer) return;
    tick();
    timer = setInterval(tick, TICK_MS);
    // Timers in a backgrounded browser tab are throttled hard, so a laptop
    // reopened after lunch can hold an hours-dead token with a tick that has
    // barely run. Re-check on the moments a person actually returns.
    window.addEventListener("focus", tick);
    window.addEventListener("cpl-tab-activated", tick);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) tick();
    });
  }

  window.CPL_SESSION = {
    get: read,
    isFresh: function (s) { return isFresh(s || read(), 0); },
    expiresInMs: function () { return expiresInMs(read()); },
    ensureFresh: ensureFresh,
    authHeaders: authHeaders,
    signOut: function () { drop(); announce(null); },
    start: start,
    _skewMs: SKEW_MS,
    _tickMs: TICK_MS,
    _isValidJwt: isValidJwt,
  };

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start);
    } else {
      start();
    }
  }
})();
